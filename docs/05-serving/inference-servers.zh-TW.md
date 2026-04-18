# Inference server

當團隊裡第一次有人說「我們就用 Flask 包一個 `transformers.generate()` 跑吧」的時候,請忍住不要點頭。在 2020 年那算合理。在 2025 年你會白白丟掉 10–20 倍的 throughput。現代的 inference server 存在,是因為[第三部分](../03-llm-inference/index.md)講過的那些最佳化 —— continuous batching、paged KV cache、prefix caching、speculative decoding —— 價值非常大,而且沒有一個好實作。

這一章是主要選項的實戰指南。

## 一個 inference server 實際上在做什麼

現代 LLM inference server 的職責:

1. **載入 model。** 放到一張或多張 GPU 上,用選定的精度,處理好量化檔案。
2. **接收 request。** 透過 HTTP(REST、OpenAI 相容)或 gRPC。
3. **Schedule。** 每一個 decode step 都把新的 request 併進當下的 batch(continuous batching)。
4. **管理 KV 快取。** 配 page、滿了會 evict、能共用的 prefix 就共用。
5. **有效率地 decode。** CUDA graph、FlashAttention、融合 kernel、tensor-parallel 切分。
6. **串流。** Token 一邊生一邊吐,不是生完整段再吐。
7. **量化。** 至少支援 FP16/BF16,通常也支援 FP8、INT8、INT4。
8. **觀察自己。** 暴露 GPU 使用率、batch size、queue 深度、tokens/sec、per-request trace 的 metric。

一個自幹的 server 會有很長一段時間缺一堆這些。

<div class="numbers" markdown>
<div class="cell"><div class="n">~10–20×</div><div class="l">Throughput 差距:naive PyTorch vs. vLLM/TGI</div></div>
<div class="cell"><div class="n">~2–4×</div><div class="l">差距:vLLM vs. TensorRT-LLM,在有利 workload 下</div></div>
</div>

## 主要選項

### vLLM

目前最廣泛使用的 open-source LLM inference server。在 2023 年引入了 **PagedAttention**(把 KV 快取做成 page,像 OS 的 virtual memory),現在是大家抄的標準。

- **維護:** 社群,最初來自 UC Berkeley。
- **跑在:** NVIDIA(很好)、AMD(成長中)、Intel(早期)、TPU(透過一些 fork)。
- **Model:** 非常廣 —— Llama、Mistral、Qwen、DeepSeek、Mixtral,以及大多 Hugging Face 架構,拿來就能跑。
- **優點:** continuous batching、paged KV cache、prefix caching、speculative decoding、穩的 OpenAI 相容 API、不錯的 default 設定。
- **缺點:** 在 NVIDIA 上、調過的 workload 下,raw 效能比 TensorRT-LLM 差;新功能有時會在穩定之前就先上。

**要用 vLLM 的情況:** 你要一個 production 等級、open-source、不用博士學位就能讓大多 model 跑起來的 server。這是預設選擇。

### Text Generation Inference(TGI)

Hugging Face 的 inference server。長期在做的專案,也是 Hugging Face Inference Endpoints 產品的背後引擎。

- **維護:** Hugging Face。
- **跑在:** NVIDIA、AMD、Intel。
- **Model:** Hugging Face model hub,廣泛。
- **優點:** 和 HF 工具鏈整合得緊、tensor-parallel 支援好、用 Rust 寫的 router overhead 低。
- **缺點:** 社群比 vLLM 小;各 model 的功能完整度不一。

**要用 TGI 的情況:** 你本來就在 Hugging Face 生態系裡,或你想要它那個特定的 router。

### TensorRT-LLM

NVIDIA 為 tensor core 特別打造、最佳化的 LLM inference 函式庫。在 NVIDIA 硬體上調好了之後,效能最頂。

- **維護:** NVIDIA。
- **跑在:** 只跑在 NVIDIA(A100、H100、L40S、Grace、Blackwell)。
- **Model:** 一份精選清單,還有一個「把 model 編譯成 TRT engine」的步驟。
- **優點:** 在支援的 model 清單內,在 NVIDIA 上的 latency 和 throughput 都是第一名。FP8 支援很緊。常見 pattern 有客製 kernel。
- **缺點:** 複雜度。engine build 多一層營運步驟。model 支援落後 vLLM。被鎖在 NVIDIA。

**要用 TensorRT-LLM 的情況:** 你在 NVIDIA H100/H200/B200 上跑、需要最後 30% 的效能、而且有工程預算去維護那些 engine。

### SGLang

比較新(2024+)的 server,專門處理**結構化 workload** —— agent 那類有 tool use、受限制生成、多輪 prompt 且共用 prefix 的流程。

- **維護:** 社群,起源於 UC Berkeley。
- **跑在:** 主要是 NVIDIA。
- **優點:** 有 RadixAttention 做激進的 prefix sharing、constrained decoding 很強、在 agent / tool-use workload(很多 request 有重疊 prefix)下效能很好。
- **缺點:** 比較新;社群比較小;在純文字 completion 上沒像 vLLM/TGI 那麼身經百戰。

**要用 SGLang 的情況:** 你的 workload 大量是結構化輸出、tool use、或多輪有共用 prefix 的對話。

### llama.cpp

原本是為了「在 CPU 上跑 Llama」寫的 C++ inference engine。現在是 Apple Silicon、edge 裝置、消費級硬體上的量化推論、還有桌面 app 的標準。

- **維護:** 社群。
- **跑在:** 任何東西。CPU、Apple Metal、CUDA、Vulkan、ROCm、OpenCL。
- **優點:** 可移植性、二進位檔小、量化選項很多(GGUF 格式)、營運負擔低。Apple Silicon 和純 CPU 部署上唯一認真的選項。
- **缺點:** 不是為高並行 server workload 設計的。要做高 batch 的 GPU serving,用 vLLM 或 TGI。

**要用 llama.cpp 的情況:** 你在 Apple Silicon、CPU、edge 硬體上、或在桌面 app 裡跑。也是單使用者本地推論的強力 default。

### Ollama

一個好用的 llama.cpp 包裝,讓本地 model 管理變得簡單(`ollama run llama3`)。不是 production serving 框架,但值得知道,拿來給開發者筆電和內部工具用很不錯。

### 其他值得知道的選項

- **MLC LLM** —— 把 model 編譯給 edge、WebGPU、行動裝置。對新奇部署目標有用。
- **DeepSpeed-Inference / DeepSpeed-MII** —— Microsoft 的對等物。現在沒 vLLM 那麼廣泛在用了。
- **OpenLLM / BentoML** —— 包 vLLM 或其他 server、加上生命週期管理的打包層。
- **Ray Serve / Nvidia Triton** —— 可以坐在 vLLM/TensorRT-LLM 前面、加 routing、autoscaling、多 model 管理的 orchestration 層。

## 怎麼選

適用大多團隊的決策樹:

1. **單使用者、筆電或桌機?** llama.cpp 或 Ollama。
2. **Apple Silicon 或純 CPU?** llama.cpp。
3. **要 NVIDIA 上的最大效能、又有工程人力?** TensorRT-LLM。
4. **重度 agent / tool-use workload?** SGLang。
5. **其他全部?** vLLM 就是 default。

**不要自己做 serving layer**,除非(a)上面這些你都試過了、而且有一個關鍵功能缺了,(b)你有工程人力去長期維護。從「自幹 loop」到「vLLM」大約是一個人一年的工作。

## 營運面比較

| 面向 | vLLM | TGI | TensorRT-LLM | SGLang | llama.cpp |
|---|---|---|---|---|---|
| OSS 授權 | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT |
| NVIDIA 效能 | 很好 | 好 | 最好 | 很好 | 好 |
| AMD 支援 | 成長中 | 有 | 無 | 有限 | 有 |
| Apple Silicon | 無 | 無 | 無 | 無 | 很好 |
| CPU | 無 | 無 | 無 | 無 | 很好 |
| OpenAI API | 有 | 有 | 透過 wrapper | 有 | 透過 wrapper |
| Model 涵蓋 | 廣 | 廣 | 精選 | 中等 | 非常廣 |
| 營運複雜度 | 低 | 低 | 高(要 engine build) | 中 | 非常低 |

## 常見錯誤

- **留著 default。** Max batch size、tensor-parallel degree、KV 快取比例 —— 都有預設值,能動,但很少正好符合你的 workload。照你的流量形狀調。
- **跑在 eager mode。** Production 要編譯過(TorchInductor、CUDA graph、或 TRT engine)。加速可觀,代價是一次性的。
- **多 GPU server 上每 GPU 一個 process。** 跨 GPU 的 tensor parallelism 要的是*一個* process 跨越它們,不是一 GPU 一 process。
- **用 CPU metric 來 autoscaling。** LLM pod 瓶頸在 GPU 工作。用 tokens-per-second、queue 深度、或 KV 快取使用率來 scale。見 [cluster ops](cluster-ops.md)。

## 一句話總結

default 用 vLLM、edge/Apple 用 llama.cpp、要榨 NVIDIA 最後一滴效能用 TensorRT-LLM、重度結構化/agent workload 用 SGLang —— 不要自己做一個。

下一章:[Continuous batching →](continuous-batching.md)

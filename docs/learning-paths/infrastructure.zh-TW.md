# 路徑五 —— 基礎設施工程師

## 這是寫給誰的

你在管叢集。你會 Kubernetes、你因為壞掉的 deploy 被 page 過,「observability」對你來說不是 buzzword。你的團隊開始要自己 host LLM —— 可能因為公司要資料所在地、可能因為 API 帳單變可怕、也可能因為上游某個人說了一句「我們拉一組 GPU 叢集就好」。現在變成是*你*要把那句話變成一個可靠的服務。

## 目標

走完這條路徑之後,你會:

- 給定一個 model 和流量型態,能有根據地估算 GPU 叢集的規模,而不是用猜的。
- 挑選並操作一個現代 inference server(vLLM、TGI、TensorRT-LLM)。
- 在 Kubernetes 上部署、觀察、擴展 LLM 工作負載。
- 用數字而不是意見,建立自託管 vs. 託管的成本模型。
- 處理這些新的失敗模式:長 context 下的 OOM、head-of-line blocking、量化帶來的退步、prompt injection 作為資安風險。

## 先備知識

Kubernetes 基礎。對 container、load balancer、Prometheus 風格的 metric 熟悉。願意讀 NVIDIA 的文件。

## 這條路徑

### 第一步 —— 為什麼這跟你以前 host 的工作負載不一樣

在你把「無狀態 microservice」的反射動作套過來之前,先暫停。LLM serving 打破了好幾個大多數 web 服務不會打破的假設。

1. [自助餐廳 vs. 牛排館](../01-why-gpu/cpu-vs-gpu.md) —— 整個「為什麼 GPU 是對的工具」的形狀。
2. [記憶體階層](../02-gpu-architecture/memory-hierarchy.md) —— 你需要這章。對你而言,稀缺資源是記憶體頻寬,不是 CPU cycle。
3. [GPU 的解剖學](../02-gpu-architecture/anatomy.md) —— 認識一下你之後要監控的那些零件。
4. [Tensor Core:專業級電動工具](../02-gpu-architecture/tensor-cores.md) —— 為什麼 FP8/BF16 的選擇會影響容量,不只是品質。
5. [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) —— 所有 serving 最佳化背後的心智模型。

**帶走的重點:** LLM 推論通常是 memory-bandwidth-bound,每個請求本身高度有狀態(KV 快取),而且對 batch 的形狀極度敏感。你在無狀態 web 服務上習慣的 scaling 直覺,會在特定地方把你帶歪。

!!! warning "誤解檢查點"

    **「LLM server 就是一個無狀態 microservice。」** 聽起來更接近真的的親戚說法:*「在 HTTP endpoint 後面的東西預設都是無狀態,除非我們特別說明。」* 你的*控制平面*可以是。*資料平面*不是 —— 它在為每一個 in-flight 的請求持有 KV 快取,每位使用者有時是幾 MB 到幾 GB。這也是為什麼 LLM serving 在 scaling 特性上比較像資料庫而不是 web 服務:per-request 記憶體很大,drain 一台節點不是免費的。failover、connection draining、autoscaling 都要對應規劃。

### 第二步 —— 一張 serving 用 GPU 到底在做什麼

1. [Token 是什麼?](../03-llm-inference/token.md)
2. [一個 token 的一生](../03-llm-inference/life-of-a-token.md)
3. [KV 快取](../03-llm-inference/kv-cache.md) —— *那*一章。讀兩次。
4. [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) —— 你的請求有兩個成本特性不同的階段。
5. [同時服務多桌客人(Batching)](../03-llm-inference/batching.md) —— 為什麼你的 serving 系統從來不會一次只處理一個請求。

**帶走的重點:** 一個 model 的「部署」實際上是兩個工作負載 —— 運算重的 prefill,和記憶體頻寬重的 decode —— 共用一張 GPU,中間有一個吃掉大部分記憶體的大型有狀態 KV 快取。

!!! warning "誤解檢查點"

    **「兩個請求 = 2 倍 throughput。」** 聽起來更接近真的的親戚說法:*「橫向擴展是等比例的。」* 對傳統無狀態服務大致對。但在 LLM 推論上,batching *會*隨著並發數增加而拉高每張 GPU 的 throughput,直到某個點(常見是單請求的 2–5 倍) —— 因為 batch 1 的時候,GPU 被記憶體頻寬綁住,根本沒吃滿。超過最佳點之後,新增的請求會開始搶 KV 快取空間、帶來 head-of-line blocking。要知道你這個 model × 硬體 × context 長度組合的 batch 最佳點在哪裡。

### 第三步 —— 現代 inference server

新章節:[Inference server 比較](../05-serving/inference-servers.md)。深入比較 vLLM、TGI(Text Generation Inference)、TensorRT-LLM、SGLang、llama.cpp。每一個為什麼而最佳化、操作成本多少、強在哪裡。

**帶走的重點:** 挑 server 是為了你的 model 和硬體,不是因為它流行。在資料中心 GPU 上做通用 open-source serving,選 vLLM。想在 NVIDIA 上把最後 30% 性能榨出來、願意付複雜度稅,選 TensorRT-LLM。邊緣 / CPU / Apple Silicon,選 llama.cpp。特定工作負載型態,TGI/SGLang。

!!! warning "誤解檢查點"

    **「我自己寫 serving 那層就好了 —— 不就是 PyTorch 推論跑 loop 嗎。」** 聽起來更接近真的的親戚說法:*「在設計良好的 library 外面包一層薄的是可以的。」* 對傳統 model serving(一個 CNN、一個小 BERT)還算合理。對 LLM serving,你會重新發明 continuous batching、paged KV cache、prefix caching、speculative decoding、CUDA graph capture —— 每一項都是幾個月的專案。手捲的 loop 和 vLLM 的差距常常是 10–20 倍。請直接用 library。

### 第四步 —— Continuous batching:核心招式

新章節:[Continuous batching](../05-serving/continuous-batching.md)。Static batching vs. dynamic batching vs. continuous(iteration-level)batching。Paged attention 怎麼讓它成為可能。為什麼它是現代 serving 中最大的 throughput 槓桿。

**帶走的重點:** 在 continuous batching 裡,server 不會等一個「batch window」—— 它在每一個 decode step 都會把新請求插進 in-flight 的 batch。這讓 GPU 一直有事做,也是現代 server 能跑出原生 PyTorch serving 5–10 倍 throughput 的原因。

!!! warning "誤解檢查點"

    **「batch 越大,對每位使用者就越快。」** 聽起來更接近真的的親戚說法:*「throughput 和 latency 在一條 Pareto 曲線上互換。」* 是會互換,但不一定平滑。超過某個 batch size,KV 快取壓力會逼出 eviction 或 page swap,而這兩者會讓*每一個*人都變慢。這也是為什麼現代 server 會有一個設定的 max batch size —— 它不是效能旋鈕,而是一道防止懸崖式退化的護欄。

### 第五步 —— 部署用的量化

用 ML 工程師路徑裡的章節:[量化(深入)](../04-training/quantization.md)。

你的視角不同:你不是在訓練,你是在 serve。對你而言的關鍵問題是:量化的部署時 overhead 是什麼(校準時間、多出來的 kernel)、量化過的推論怎麼跟你的 server 互動(大多數原生支援 FP8 和 INT4,有些不支援)、以及這個應用可接受多少精度倒退?

**帶走的重點:** 把 FP8 或 INT4 量化應用上去,每張 GPU 的有效容量大約翻倍,因為從 HBM 讀回來的權重少了一半 / 四分之一。這意味著同一張 GPU 上可以多容納 2–4 倍的並發使用者,或同樣的足跡塞得下大一號的 model。

### 第六步 —— 叢集營運

新章節:[GPU 叢集營運](../05-serving/cluster-ops.md)。Kubernetes GPU operator、NVIDIA device plugin、MIG(Multi-Instance GPU)、resource request 和 limit(對 GPU 基本上不存在的那些)、Pod scheduling、對 GPU-aware metric 的 autoscaling、LLM model 的 canary deploy,以及可觀察性堆疊(用 Prometheus 抓 GPU metric、用 tracing 追請求流向、token 級別的 log)。

**帶走的重點:** Kubernetes 的 GPU 調度是 best-effort 且粗顆粒的 —— 一張 GPU 是一個不可分割的資源(MIG 另當別論),所以 bin-packing 是一個真實問題。按「pod CPU」做 autoscaling 沒用;你需要 GPU-aware 的 metric(batch size、KV 快取使用率、佇列長度)。

!!! warning "誤解檢查點"

    **「GPU 用量 100% 代表我很有效率。」**(和 ML 工程師路徑一樣的誤解,一樣的誘惑原因。)聽起來更接近真的的親戚說法:*「CPU 到 100% 代表全速在跑。」* `nvidia-smi` 的「utilization」是一個很粗的活動計數器 —— 只要在取樣視窗內 GPU 做了任何事,它就會顯示 100%。一個 memory-bound 的工作負載可以一邊維持 100% utilization,一邊實際只跑在 peak FLOPs 的 5%。要看的是 **tokens/sec** 和 **MFU**,不是 utilization 百分比。

!!! warning "誤解檢查點"

    **「GPU 越大,$/token 越好。」** 聽起來更接近真的的親戚說法:*「規模越大,每單位越便宜。」* 對儲存和頻寬成立。對 GPU,每 token 的成本算盤取決於 model 大小、context 長度、流量型態。一張 H100 在低並發流量下跑 7B model 是殺雞用牛刀;在這種規模,一群 L40S 或 A10 的 $/token 可能贏。大 GPU 贏的情境是 model 本身就需要比小卡更多 VRAM,或是你能把大卡推進重度 batching。

### 第七步 —— 新的資安介面

LLM serving 有一些你以前的服務沒有的失敗模式:

- **透過 retrieval 內容的 prompt injection。** 一份惡意文件被放進 RAG corpus,裡面夾帶指令。請把被檢索到的內容當成「不可信輸入」。
- **Prompt 洩漏攻擊。** 使用者把 system prompt 挖出來。如果你的 system prompt 裡塞了 secret,你就已經輸了 —— 別把 secret 放那裡。
- **Token 預算 DoS。** 使用者重複送達 max-context 的 prompt。rate-limit 要按 *token* 做,不是只按請求數。
- **對計費後端的成本 DoS。** 如果你下游在呼叫一個付費 API,慢 loris 型的使用者可以真的讓你燒錢。每位使用者要有預算上限。
- **Log 的隱私。** Prompt + completion 的 log 常常是高度敏感資料(使用者資料、健康、金融)。在打開 log 之前,保留期限和存取控制要先規劃好。

**帶走的重點:** 假設任何受使用者影響的字串都可能夾帶指令。假設任何人給他足夠多嘗試次數,都有辦法讀到任何 system prompt。設計時要圍繞這些假設。

### 第八步 —— 無痛成本建模

新章節(和 PM 路徑共用):[經濟學](../07-strategy/economics.md) —— 跳到自託管那一節。

對你而言的關鍵拆解:

- **固定成本:** GPU 租金或資本支出、網路、工程 on-call、地端的電力與散熱。
- **變動成本:** 和 GPU-hour 成正比的電費、egress 頻寬。
- **Throughput:** 在你的 batch 最佳點下,每張 GPU 的 tokens/sec。
- **Utilization:** 跨一週預期的 duty cycle(互動型工作負載通常是 30–60%)。

$/百萬 token ≈ (固定 + 變動每 GPU-hour 成本) / (tokens/sec × 3600 × utilization / 1e6)。

把它跟託管定價比較。在某個持續流量以下,託管贏。在那之上,自託管贏 —— *前提是*你真的跑在 batch 最佳點,而且 utilization 夠高。

## 誤解總表

| 誤解 | 它從哪裡來 |
|---|---|
| LLM server 是無狀態的 | Microservice 習慣。 |
| 2 倍請求 = 2 倍 throughput | 無狀態線性擴展直覺。 |
| 自己寫 serving | 傳統 ML serving 留下的「薄封裝」直覺。 |
| batch 越大越好 | 忽略 KV 快取壓力懸崖。 |
| 100% GPU util = 有效率 | 粗 metric 被當成容量指標讀。 |
| GPU 越大 = 更好的 $/token | 忽略 model 大小吻合度與流量型態。 |

## 檢查點

在你說這條路徑走完之前:

1. 規劃一次部署:Llama-3-70B、BF16、4K 平均 context、500 QPS、P95 < 2s TTFT。需要幾張 H100?哪一個 server?為什麼?
2. 某次 rolling deploy 沒動 code,tokens/sec 卻掉了 30%。描述你最前面五步的診斷程序。
3. PM 想知道相較於託管 API,自託管會不會省錢。你需要知道什麼?你的回答長什麼形狀?
4. 這個服務的 per-pod Prometheus dashboard 長怎樣?列出前五大 metric。
5. 資安審查問你怎麼防 prompt-injection 攻擊。走過一次你的防禦縱深。

如果你都回答得出來,你的 pager 會比較不痛。

回到[所有路徑](index.md)。

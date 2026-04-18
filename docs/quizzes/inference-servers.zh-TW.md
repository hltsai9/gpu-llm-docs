# 測驗 —— Inference server

六題,關於挑選與運營 vLLM、TGI、TensorRT-LLM、SGLang 和 llama.cpp。章節:[Inference server](../05-serving/inference-servers.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> Python 團隊想把 Llama-3 70B 放在內部 API 後面。2025 年的預設推薦?",
      "choices": {
        "A": "寫一個環繞 transformers.generate() 的自訂 serving loop",
        "B": "用 vLLM —— 生產等級、開源、model 覆蓋廣、OpenAI 相容 API",
        "C": "為了極致效能從 TensorRT-LLM 開始",
        "D": "用 llama.cpp 因為它簡單"
      },
      "explain": "<p>NVIDIA GPU 上,vLLM 是預設選擇而且理由充分:continuous batching、paged KV cache、prefix caching、speculative decoding 都內建。TensorRT-LLM 效能贏,但要 engine-building 和持續工程。llama.cpp 是 Apple/CPU/edge 用。手搓 loop 會浪費 10–20× 的 throughput。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> vLLM 的 PagedAttention 在做什麼?",
      "choices": {
        "A": "把 attention 權重在 HBM 和 CPU RAM 之間換,支援更長 context",
        "B": "把 attention 拆到 node 內多張 GPU",
        "C": "把 KV cache 管理成固定大小的 page(像 OS 的虛擬記憶體),支援多個同時進行的請求乾淨地配置、沒有 fragmentation",
        "D": "數值性質比 softmax 好的替代品"
      },
      "explain": "<p>PagedAttention 把 KV cache 當 OS 虛擬記憶體對待 —— 固定大小 page,而不是每個請求獨立連續緩衝區。這讓 continuous batching 能俐落地加減請求、能跨 user 共享 prefix,也是每個現代 server 都抄過去的原因。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 什麼時候 TensorRT-LLM 比 vLLM 對?",
      "choices": {
        "A": "綁定 NVIDIA 硬體,要擠最後 20–30% 效能,也有工程力維護 compiled engine",
        "B": "想要硬體可攜性",
        "C": "要同一個 binary 跑 CPU 和 GPU",
        "D": "團隊沒 MLOps 經驗"
      },
      "explain": "<p>TensorRT-LLM 在 NVIDIA 上是最頂效能,但運營成本實在:engine-building 是 compile step,model 支援晚於 vLLM,還綁死 NVIDIA。效能增益是真的(偏好工作負載上 ~2-4× 於 vLLM),但工程稅也是真的。到規模才值得。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> SGLang 特別適合什麼 workload?",
      "choices": {
        "A": "單一請求的延遲測試",
        "B": "純 CPU serving",
        "C": "訓練時頻繁 checkpoint",
        "D": "結構化/agent 風格的流程,有受約束的 generation、大量重疊 prefix(RadixAttention)"
      },
      "explain": "<p>SGLang 專攻 agent 與 tool-use workload,請求之間共享長 overlap prefix。RadixAttention 把 prefix 存成 trie 做積極共享,constrained decoding 是 first-class。單純文字補全,vLLM 還是預設;結構化 workload,SGLang 發光。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 開發者想在 MacBook 上跑 13B 模型。自然選擇?",
      "choices": {
        "A": "vLLM",
        "B": "llama.cpp(或包它的 Ollama)",
        "C": "TensorRT-LLM",
        "D": "SGLang"
      },
      "explain": "<p>llama.cpp 是 Apple Silicon 和 CPU 的標準。用 GGUF 量化、運營 overhead 很小、在 Mac 的統一記憶體上跑得好。Ollama 包了更親切的 CLI。vLLM 不跑 Metal;TensorRT-LLM 只有 NVIDIA。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 為什麼不該自己做 LLM serving layer?",
      "choices": {
        "A": "Open-source 授權禁止",
        "B": "Rust 寫不贏 Python 的效能",
        "C": "從手搓 loop 到 vLLM 的差距大約是一人一年的工 —— continuous batching、paged KV、chunked prefill、prefix caching、CUDA graph 全都要重新實作",
        "D": "自訂 server 不支援 streaming"
      },
      "explain": "<p>現代 inference server 打包了十年的優化,小團隊要重造得花一年。除非你試過主流選項且有一個關鍵功能缺少 —— 而且有工程力長期維護 —— 不然你會比 vLLM 慢又多 bug。</p>"
    }
  ]
}
</script>

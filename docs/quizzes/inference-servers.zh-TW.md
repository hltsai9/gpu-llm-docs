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
        "A": "寫一個環繞 transformers.generate() 的自訂 loop,手動管理 batching 和 KV cache",
        "B": "用 vLLM,內建 continuous batching、paged KV cache、prefix caching",
        "C": "為了極致效能從 TensorRT-LLM 開始,最大化硬體最佳化",
        "D": "用 llama.cpp 因為 API 最簡單、model loading 最快"
      },
      "explain": "<p>NVIDIA GPU 上,vLLM 是預設選擇而且理由充分:continuous batching、paged KV cache、prefix caching、speculative decoding 都內建。TensorRT-LLM 效能贏,但要 engine-building 和持續工程。llama.cpp 是 Apple/CPU/edge 用。手搓 loop 會浪費 10–20× 的 throughput。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> vLLM 的 PagedAttention 在做什麼?",
      "choices": {
        "A": "在 HBM 和 CPU RAM 間交換 attention 權重,讓單一請求擴大 context 長度",
        "B": "把 attention 計算拆到多張 GPU 並行,加速計算",
        "C": "用固定 page 管理 KV cache,避免 memory fragmentation",
        "D": "用更穩定的數值方法替代 softmax 演算法"
      },
      "explain": "<p>PagedAttention 把 KV cache 當 OS 虛擬記憶體對待 —— 固定大小 page,而不是每個請求獨立連續緩衝區。這讓 continuous batching 能俐落地加減請求、能跨 user 共享 prefix,也是每個現代 server 都抄過去的原因。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 什麼時候 TensorRT-LLM 比 vLLM 對?",
      "choices": {
        "A": "要在 NVIDIA 上榨出最後效能,也有工程師維護 engine 編譯",
        "B": "想要同一套 serving code 跑在多個硬體廠商上不用改",
        "C": "需要單一 binary 同時高效跑 CPU 和 GPU",
        "D": "團隊才接觸機器學習 ops,要最簡單的方案"
      },
      "explain": "<p>TensorRT-LLM 在 NVIDIA 上是最頂效能,但運營成本實在:engine-building 是 compile step,model 支援晚於 vLLM,還綁死 NVIDIA。效能增益是真的(偏好工作負載上 ~2-4× 於 vLLM),但工程稅也是真的。到規模才值得。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> SGLang 特別適合什麼 workload?",
      "choices": {
        "A": "優化單一請求的延遲,測試 time-to-first-token",
        "B": "純 CPU 推論,沒有 GPU 可用",
        "C": "訓練時每個 epoch 間頻繁做 checkpoint",
        "D": "Agent 工作流,有結構化輸出和共用 prompt"
      },
      "explain": "<p>SGLang 專攻 agent 與 tool-use workload,請求之間共享長 overlap prefix。RadixAttention 把 prefix 存成 trie 做積極共享,constrained decoding 是 first-class。單純文字補全,vLLM 還是預設;結構化 workload,SGLang 發光。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 開發者想在 MacBook 上跑 13B 模型。自然選擇?",
      "choices": {
        "A": "vLLM,它對 Apple Silicon 的 Metal 有原生支援",
        "B": "llama.cpp,用 GGUF 量化在 Apple Silicon 上高效推論",
        "C": "TensorRT-LLM,為 macOS ARM 架構編譯",
        "D": "SGLang,用 constrained decoding 做結構化輸出"
      },
      "explain": "<p>llama.cpp 是 Apple Silicon 和 CPU 的標準。用 GGUF 量化、運營 overhead 很小、在 Mac 的統一記憶體上跑得好。Ollama 包了更親切的 CLI。vLLM 不跑 Metal;TensorRT-LLM 只有 NVIDIA。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 為什麼不該自己做 LLM serving layer?",
      "choices": {
        "A": "開源授權禁止自訂 serving 實作完全不允許",
        "B": "編譯語言實現會比 Python 慢很多",
        "C": "需要人年級的工程投入才能完整實現優化",
        "D": "自訂 server 無法向客戶串流輸出 token"
      },
      "explain": "<p>現代 inference server 打包了十年的優化,小團隊要重造得花一年。除非你試過主流選項且有一個關鍵功能缺少 —— 而且有工程力長期維護 —— 不然你會比 vLLM 慢又多 bug。</p>"
    }
  ]
}
</script>

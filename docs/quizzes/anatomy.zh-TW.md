# 測驗 —— GPU 的解剖學

六題關於 SM、CUDA Core、Tensor Core、以及 HBM 的問題。章節:[GPU 的解剖學](../02-gpu-architecture/anatomy.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 一顆 NVIDIA H100 由多少個 Streaming Multiprocessor(SM)組成?",
      "choices": {
        "A": "32",
        "B": "132",
        "C": "1,024",
        "D": "16,384"
      },
      "explain": "<p>H100 有 132 個 SM —— 132 個「工作坊」共用一份 L2 快取和 HBM。每個 SM 都有自己的核心、排程器、暫存器檔、共享記憶體。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> GigaThread engine 在做什麼?",
      "choices": {
        "A": "在晶片偵測到重量級工作時動態調整時脈與功耗",
        "B": "透過調整所有 SM 的電源供應與電壓來管理熱量",
        "C": "kernel 啟動時把 thread block 分派到各個 SM 上執行",
        "D": "在資料寫入 HBM 前先在 L2 快取中進行壓縮"
      },
      "explain": "<p>GigaThread engine 是整顆晶片層級的排程器。你說「把這個 kernel 跨 N 個 block 啟動」;由它決定哪個 SM 跑哪個 block,SM 做完了就再分配下一個。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 共享記憶體(shared memory)實際上位於哪裡?",
      "choices": {
        "A": "在每個 SM 內部,快速且小,只有該 SM 的 thread block 可存取",
        "B": "在主要 HBM 儲存裡,由所有 SM 共享但經由 L2 快取路由",
        "C": "分散在 L1 快取與本地 CPU RAM,經由 PCIe 匯流排連接",
        "D": "在 warp 排程器的暫存器檔中,以 L2 快取支援"
      },
      "explain": "<p>共享記憶體(H100 上每個 SM 約 256 KB)位於晶片上、在每個 SM 內部。它比 HBM 快很多倍,是「工作坊的物料間」—— block 會把要重複用的資料暫存在這裡。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> H100 SXM 的 HBM 頻寬大約是多少?",
      "choices": {
        "A": "30 GB/s",
        "B": "300 MB/s",
        "C": "300 GB/s",
        "D": "約 3 TB/s"
      },
      "explain": "<p>H100 透過 5,120 位元寬的記憶體匯流排提供約 3.35 TB/s 的 HBM3 頻寬。這是主流運算裡最寬的記憶體介面之一。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 晶片上哪個結構實際承擔 LLM 絕大部分的算術工作?",
      "choices": {
        "A": "CUDA Core 執行純量浮點運算且精度為 FP32",
        "B": "Tensor Core —— 專為小型矩陣 multiply-accumulate 設計",
        "C": "L2 快取控制器管理資料流向 Tensor Core",
        "D": "GigaThread 排程器負責分配工作到各個 SM"
      },
      "explain": "<p>Tensor Core 主導一顆 H100 可用 FLOPs:BF16 約 989 TFLOPs,相較於 CUDA Core 在 FP32 下約 67 TFLOPs。現代 LLM kernel 都會把工作集中到 Tensor Core 上。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 為什麼 LLM 推論時 Tensor Core 反而不會變成瓶頸?",
      "choices": {
        "A": "它們完工比 HBM 餵資料還快 —— 大部分工作負載整顆晶片都是受限於記憶體",
        "B": "它們是為訓練優化的,在推論時會被禁用",
        "C": "推論 kernel 主要使用 CUDA Core 而非 Tensor Core",
        "D": "warp 排程器大幅限制了 Tensor Core 指令吞吐量"
      },
      "explain": "<p>Tensor Core 是「過度資格」—— 它們能吃的資料量遠超過 HBM 能送進來的量。瓶頸幾乎永遠是記憶體頻寬,而不是運算。</p>"
    }
  ]
}
</script>

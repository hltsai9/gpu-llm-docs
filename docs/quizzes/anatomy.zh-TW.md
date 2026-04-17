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
        "A": "在 GPU 上跑繪圖工作負載",
        "B": "在重的 kernel 跑時拉高時脈",
        "C": "kernel 啟動時,把 thread block 分派到各個 SM 上",
        "D": "寫到 HBM 前先壓縮資料"
      },
      "explain": "<p>GigaThread engine 是整顆晶片層級的排程器。你說「把這個 kernel 跨 N 個 block 啟動」;由它決定哪個 SM 跑哪個 block,SM 做完了就再分配下一個。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 共享記憶體(shared memory)實際上位於哪裡?",
      "choices": {
        "A": "在每個 SM 內部 —— 快、小、是那個 SM 的 thread block 私有的",
        "B": "在 HBM 裡,晶片外",
        "C": "在 CPU 的 RAM 裡,透過 PCIe 存取",
        "D": "它是軟體上的假象,實際上由 L2 支援"
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
        "A": "CUDA Core(FP32 純量運算)",
        "B": "Tensor Core —— 為小型矩陣 multiply-accumulate 量身打造",
        "C": "L2 快取",
        "D": "warp 排程器"
      },
      "explain": "<p>Tensor Core 主導一顆 H100 可用 FLOPs:BF16 約 989 TFLOPs,相較於 CUDA Core 在 FP32 下約 67 TFLOPs。現代 LLM kernel 都會把工作集中到 Tensor Core 上。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 為什麼 LLM 推論時 Tensor Core 反而不會變成瓶頸?",
      "choices": {
        "A": "它們完工比 HBM 餵資料還快 —— 大部分工作負載整顆晶片都是受限於記憶體",
        "B": "它們對現代模型來說太慢",
        "C": "它們只在訓練時啟用",
        "D": "真正做事的是 CUDA Core"
      },
      "explain": "<p>Tensor Core 是「過度資格」—— 它們能吃的資料量遠超過 HBM 能送進來的量。瓶頸幾乎永遠是記憶體頻寬,而不是運算。</p>"
    }
  ]
}
</script>

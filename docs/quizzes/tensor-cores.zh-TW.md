# 測驗 —— Tensor Core

六題關於 matmul 專業級電動工具的問題。章節:[Tensor Core:專業級電動工具](../02-gpu-architecture/tensor-cores.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 在同一張 H100 上,Tensor Core 跑 BF16 大約比 CUDA Core 跑 FP32 快幾倍?",
      "choices": {
        "A": "差不多",
        "B": "約 2 倍",
        "C": "約 15 倍",
        "D": "約 1,000 倍"
      },
      "explain": "<p>H100:CUDA Core 的 FP32 約 67 TFLOPs vs. Tensor Core 的 BF16 約 989 TFLOPs —— 差不多 15 倍。沒用到 Tensor Core,你就把大部分晶片的能力放著不用了。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> 一條 Tensor Core 指令會算什麼?",
      "choices": {
        "A": "一對純量的乘加",
        "B": "一次小型矩陣 multiply-accumulate(例如 16×16 × 16×8 → 16×8)",
        "C": "一次完整的 attention 運算",
        "D": "一整個卷積層"
      },
      "explain": "<p>Tensor Core 在硬體裡做的是矩陣對矩陣的運算。CUDA Core 一次乘一對純量;Tensor Core 每個週期直接吐出整塊小 matmul。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 在 Hopper 世代的 Tensor Core 上,下列哪個精度**最快**?",
      "choices": {
        "A": "FP64",
        "B": "FP32",
        "C": "FP16",
        "D": "FP8(或 INT8)"
      },
      "explain": "<p>精度越低 = 操作數越小 = 同樣的矽片面積每週期可以做更多乘法。H100 的 FP8 吞吐量幾乎是 BF16 的兩倍。Blackwell 上還有 FP4,差距更大。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 在程式層面,Tensor Core 是怎麼被呼叫的?",
      "choices": {
        "A": "由一整個 warp 合作呼叫 —— 每個執行緒貢獻一小塊操作數、收下一小塊結果",
        "B": "由單一執行緒以普通的算術運算方式呼叫",
        "C": "只能由 CPU 透過 PCIe 呼叫",
        "D": "只能從 PyTorch 的 Python 程式碼呼叫,從 CUDA 不行"
      },
      "explain": "<p>Tensor Core 指令是 warp 層級的:32 個執行緒全部參與,每個執行緒持有操作數與結果的一小片。cuBLAS、cuDNN、FlashAttention 這些函式庫會幫你打理整個編排。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 在 Hopper Tensor Core 上,「2:4 結構化稀疏(2:4 structured sparsity)」可以給你什麼?",
      "choices": {
        "A": "精度砍半,速度沒變",
        "B": "時脈變 4 倍",
        "C": "約 2 倍的有效運算量 —— 如果每 4 個權重中有 2 個是零,那些乘法就會被跳過",
        "D": "稀疏只影響記憶體,不影響運算"
      },
      "explain": "<p>硬體會辨識「4 中取 2」的樣式,跳過一半的乘法,對能容忍這種稀疏化的模型(通常是 prune + 微調後)提供約 2 倍的加速。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 為什麼 LLM 推論裡大部分的效能故事最後都在講**記憶體**而不是**Tensor Core**?",
      "choices": {
        "A": "Tensor Core 只能在訓練時用",
        "B": "Tensor Core 太快了,它們早就把活做完在等 HBM 送下一塊來 —— 真正的瓶頸是資料搬動",
        "C": "Tensor Core 在推論時不夠精準",
        "D": "推論用的是 CUDA Core,不是 Tensor Core"
      },
      "explain": "<p>Transformer 約有 99% 是 matmul,全部跑在 Tensor Core 上,而 Tensor Core 很少是瓶頸。整本最佳化教戰手冊 —— 量化、FlashAttention、KV 快取各種招式、batching —— 目的都是要讓 Tensor Core 不要餓肚子。</p>"
    }
  ]
}
</script>

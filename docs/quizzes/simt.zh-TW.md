# 測驗 —— 同步運作的廚房(SIMT)

六題關於 warp、SIMT、以及分支發散的問題。章節:[同步運作的廚房(SIMT)](../01-why-gpu/simt.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 在 NVIDIA GPU 上,一個 warp 包含幾個執行緒?",
      "choices": {
        "A": "16",
        "B": "32",
        "C": "64",
        "D": "128"
      },
      "explain": "<p>一個 warp 是 32 個執行緒 —— 硬體上步調同步的最小單位。AMD 的對應概念叫 wavefront,依世代不同是 32 或 64。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 當一個 warp 裡的執行緒走進 <code>if</code> 的不同分支時,「warp 發散(warp divergence)」長什麼樣?",
      "choices": {
        "A": "編譯器會拒絕這段程式碼",
        "B": "只有第一個分支會執行;其他執行緒會拿到錯誤的結果",
        "C": "兩個分支會**依序**跑 —— 當前不該動的那半邊執行緒被遮蔽,浪費週期",
        "D": "每個執行緒會拿到自己獨立的指令指標"
      },
      "explain": "<p>32 個執行緒共用一個指令指標。硬體會先跑 <code>if</code> 分支,遮蔽一半執行緒;再跑 <code>else</code> 分支,遮蔽另一半。兩條路都會跑過,但每條路上「不該動」的那半邊就只能站著看。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 為什麼純粹的矩陣乘法幾乎不會發散?",
      "choices": {
        "A": "每個執行緒執行的都是同樣的乘加,只是數字不同 —— 沒有分支",
        "B": "matmul kernel 跑在 CUDA Core 上,那些 Core 沒有 warp",
        "C": "驅動會自動改寫分支",
        "D": "matmul 其實嚴重發散"
      },
      "explain": "<p>matmul 是 SIMT 的理想工作負載:每個執行緒都是同樣的指令,只是操作數不同。這也是為什麼 GPU 在這上面把 CPU 甩開好幾個數量級。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> SIMD(在 CPU 上)和 SIMT(在 GPU 上)最主要的差別是什麼?",
      "choices": {
        "A": "SIMT 比較慢;SIMD 比較快",
        "B": "SIMD 是指令層級(一個核心,一個向量寬度的運算);SIMT 是執行緒層級(很多執行緒被硬體悄悄強迫同步)",
        "C": "兩者是同一件事,只是換個名字",
        "D": "SIMT 只能處理整數,SIMD 只能處理浮點數"
      },
      "explain": "<p>SIMD 是一條指令在一顆 CPU 核心上對一個向量操作數動作。SIMT 對程式設計師來說看起來是「很多獨立的執行緒」;同步分組是硬體的秘密。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q5.</strong> 哪個 Transformer 時代的運算會引入 warp 發散?",
      "choices": {
        "A": "標準的稠密 matmul",
        "B": "layer norm",
        "C": "pointwise ReLU",
        "D": "Masked attention、或稀疏 Mixture-of-Experts 的路由 —— 不同執行緒會走不同路徑"
      },
      "explain": "<p>因果遮罩與 MoE 路由都有「依條件決定」的控制流 —— 不同執行緒想做不同的事。好的 kernel 會把這種情況降到最低,但真實的 LLM 程式碼裡,發散就常常出現在這些地方。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 為什麼 GPU 設計師一開始就要採用 SIMT 這種同步規則?",
      "choices": {
        "A": "讓一個指令解碼器被 32 個執行緒共用,省下的面積拿去放更多算術單元",
        "B": "為了避免競爭條件",
        "C": "因為比較好 debug",
        "D": "為了不讓程式設計師寫分支"
      },
      "explain": "<p>32 個執行緒共用一個解碼器,等於每次運算的解碼硬體少了約 32 倍。這就是你怎麼有辦法在一顆晶片上塞進幾萬個算術單元的方法 —— 把昂貴的控制邏輯在許多執行緒之間攤掉。</p>"
    }
  ]
}
</script>

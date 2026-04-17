# 測驗 —— 記憶體階層

七題關於儲存金字塔與算術密度的問題。章節:[記憶體階層](../02-gpu-architecture/memory-hierarchy.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> 哪一層儲存離算術單元最近 —— 最快、最小?",
      "choices": {
        "A": "暫存器(Registers)",
        "B": "共享記憶體",
        "C": "L2 快取",
        "D": "HBM"
      },
      "explain": "<p>暫存器就「在廚師手上」—— 1 個週期就能存取,但每個 SM 只有約 256 KB,還要分給所有活躍的執行緒。下一階才是共享記憶體。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 「合併式(coalesced)」記憶體存取是什麼意思?",
      "choices": {
        "A": "用壓縮技術省頻寬的 load",
        "B": "跳過快取的 load",
        "C": "一個 warp 的 32 個執行緒讀取 32 個連續 byte,硬體就能用一次寬頻寬交易一次滿足全部",
        "D": "同時跨多張 GPU 的 load"
      },
      "explain": "<p>HBM 獎勵連續、寬的交易。如果一個 warp 的 32 個執行緒剛好要讀 32 個相鄰的 byte,一次交易就搞定全部。如果每個都跳到隨機位置,你要付 32 次延遲,吞吐量直接崩。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> H100(BF16)的「交界點」算術密度大約是多少 —— 要達到的 ops/byte 才能單靠 HBM 把 Tensor Core 吃飽?",
      "choices": {
        "A": "每 byte 約 5 次運算",
        "B": "每 byte 約 295 次運算",
        "C": "每 byte 約 10,000 次運算",
        "D": "沒有交界點 —— 運算永遠是天花板"
      },
      "explain": "<p>約 989 TFLOPs 的 BF16 運算量 除以 約 3.35 TB/s 的 HBM 頻寬 ≈ 每 byte 295 次運算。低於這個值你受限於記憶體;高於這個值你受限於運算。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 為什麼量化(例如 FP16 → FP8)通常能加速 decode?",
      "choices": {
        "A": "因為 Tensor Core 在較低電壓下跑得比較快",
        "B": "因為減少了需要的 FLOPs 數量",
        "C": "因為能用到更多 CUDA Core",
        "D": "因為每次 HBM 讀取搬的 byte 減半 —— 而 decode 是受限於頻寬的"
      },
      "explain": "<p>decode 是受限於記憶體的。把每個權重縮成一半的 byte,HBM 就能用一半的時間送出同樣的工作量。Tensor Core 本來就不是瓶頸。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 算術密度衡量的是……",
      "choices": {
        "A": "運算的準確度",
        "B": "每搬一個 byte 從 HBM 過來能做的 FLOPs",
        "C": "GPU 的時脈",
        "D": "模型的參數量"
      },
      "explain": "<p>算術密度 = FLOPs ÷ bytes。高密度代表每個載入的 byte 被用在很多次運算上 —— 當記憶體通道比核心慢時,這是唯一能維持巔峰運算的方法。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 為什麼 HBM 被形容成「高**頻寬**但**高延遲**」?",
      "choices": {
        "A": "啟動一次傳輸要花上百個週期,但一旦搬動起來,它每秒可以送出巨量的 byte",
        "B": "整體都很慢,沒什麼人用",
        "C": "延遲和頻寬本來就是同一件事",
        "D": "它每 byte 很快,但總容量很快就到天花板"
      },
      "explain": "<p>就像貨運火車:啟動慢、但一旦跑起來,載重巨大。這就是為什麼 GPU 愛大塊、連續的傳輸 —— 延遲只付一次,之後就騎著頻寬走。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q7.</strong> 如果一個權重矩陣只從 HBM 讀一次,下列哪個**最能**拉高算術密度?",
      "choices": {
        "A": "把同一個向量連續跑過它 10 次,每次都把結果丟掉",
        "B": "用多兩倍的執行緒讀這個矩陣",
        "C": "把 64 個不同的輸入向量一起 batch 進去,做成一次 matmul",
        "D": "把輸出轉成 FP32"
      },
      "explain": "<p>一次讀權重,對這次讀取做 64 倍的算術。「工作量 ÷ 搬動 byte」的比值就成比例往上跳。這就是為什麼 batching 是 decode 吞吐量的核心槓桿。</p>"
    }
  ]
}
</script>

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
        "A": "暫存器 —— 1 個週期存取,私有每個執行緒",
        "B": "共享記憶體 —— 同 block 執行緒共享,需同步",
        "C": "L2 快取 —— 整顆晶片共享的層級快取",
        "D": "HBM —— 高頻寬記憶體,最慢但最大"
      },
      "explain": "<p>暫存器就「在廚師手上」—— 1 個週期就能存取,但每個 SM 只有約 256 KB,還要分給所有活躍的執行緒。下一階才是共享記憶體。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 「合併式(coalesced)」記憶體存取是什麼意思?",
      "choices": {
        "A": "搭配 cache 最佳化與壓縮技術,降低 HBM 整體頻寬使用量",
        "B": "跳過 L1/L2 cache 的 load,直接從 HBM 取資料以避開 cache 干擾",
        "C": "一個 warp 的 32 條執行緒讀 32 個連續 byte,硬體用一次交易滿足",
        "D": "同時跨多張 GPU 並行的 load,把資料一次從多裝置帶進 SM"
      },
      "explain": "<p>HBM 獎勵連續、寬的交易。如果一個 warp 的 32 個執行緒剛好要讀 32 個相鄰的 byte,一次交易就搞定全部。如果每個都跳到隨機位置,你要付 32 次延遲,吞吐量直接崩。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> H100(BF16)的「交界點」算術密度大約是多少 —— 要達到的 ops/byte 才能單靠 HBM 把 Tensor Core 吃飽?",
      "choices": {
        "A": "大約每 byte 2 到 8 個運算",
        "B": "每 byte 約 295 次運算",
        "C": "大約每 byte 10,000 個運算",
        "D": "沒有交界點;運算永遠超過"
      },
      "explain": "<p>約 989 TFLOPs 的 BF16 運算量 除以 約 3.35 TB/s 的 HBM 頻寬 ≈ 每 byte 295 次運算。低於這個值你受限於記憶體;高於這個值你受限於運算。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 為什麼量化(例如 FP16 → FP8)通常能加速 decode?",
      "choices": {
        "A": "Tensor Core 在處理較低精度操作數時會以更高頻率運作",
        "B": "較低精度格式直接減少 kernel 所需的 FLOPs",
        "C": "量化讓額外的 CUDA Core 管道能平行執行",
        "D": "每次 HBM 讀取要搬的 byte 數減半,搬同樣的工作量所需頻寬就少一半"
      },
      "explain": "<p>decode 是受限於記憶體的。把每個權重縮成一半的 byte,HBM 就能用一半的時間送出同樣的工作量。Tensor Core 本來就不是瓶頸。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 算術密度衡量的是……",
      "choices": {
        "A": "FLOPs 計算的數值準確度,通常用 FP32 vs BF16 的誤差來表達",
        "B": "每從 HBM 搬一個 byte 過來,能做多少次 FLOPs 的比值",
        "C": "GPU 晶片在標準供電條件下的工作時脈速度,單位是 GHz",
        "D": "模型的總參數量,通常以 billions 為單位來描述模型大小"
      },
      "explain": "<p>算術密度 = FLOPs ÷ bytes。高密度代表每個載入的 byte 被用在很多次運算上 —— 當記憶體通道比核心慢時,這是唯一能維持巔峰運算的方法。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 為什麼 HBM 被形容成「高**頻寬**但**高延遲**」?",
      "choices": {
        "A": "啟動一次傳輸要數百個 cycle,但跑起來每秒可送出極大量 byte",
        "B": "HBM 整體都很慢,是 GPU 記憶體階層中最弱的環節,沒什麼優勢",
        "C": "延遲和頻寬其實是同一件事,只是兩種測量同一現象的方式",
        "D": "每個 byte 的存取很快,但 HBM 整體的容量被嚴格限制住"
      },
      "explain": "<p>就像貨運火車:啟動慢、但一旦跑起來,載重巨大。這就是為什麼 GPU 愛大塊、連續的傳輸 —— 延遲只付一次,之後就騎著頻寬走。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q7.</strong> 如果一個權重矩陣只從 HBM 讀一次,下列哪個**最能**拉高算術密度?",
      "choices": {
        "A": "把同一個輸入向量重複跑 10 次,期待 cache 在後幾次能命中",
        "B": "用兩倍的執行緒去讀矩陣,期待平行讀取本身就能拉高密度",
        "C": "把 64 個不同的輸入向量 batch 起來,變成一次大 matmul",
        "D": "把輸出格式轉成 FP32,以提高每個運算的數值精度水準"
      },
      "explain": "<p>一次讀權重,對這次讀取做 64 倍的算術。「工作量 ÷ 搬動 byte」的比值就成比例往上跳。這就是為什麼 batching 是 decode 吞吐量的核心槓桿。</p>"
    }
  ]
}
</script>

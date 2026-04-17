# 測驗 —— Prefill 與 Decode

六題關於「兩階段切分」的問題。章節:[Prefill 與 Decode](../03-llm-inference/prefill-vs-decode.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> 哪個階段是受限於運算?",
      "choices": {
        "A": "Prefill —— 所有 prompt token 平行通過模型,算術密度高",
        "B": "Decode —— 一次一個 token",
        "C": "兩個都一樣",
        "D": "都不是 —— 兩個都受限於記憶體"
      },
      "explain": "<p>Prefill 一次處理上千個 token,所以權重會在這些 token 之間大量重複使用。Tensor Core 才是那邊的瓶頸。相反地,decode 每搬一個 HBM byte 只做極少的算術。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> TTFT 是什麼的縮寫 —— 而且它主要取決於什麼?",
      "choices": {
        "A": "Tokens-To-Free-Time;取決於 GPU 散熱器",
        "B": "Total Transformer Float Tally;跟 prompt 長度無關",
        "C": "Time-To-First-Token(首 token 時間);由 prefill 主導,隨 prompt 長度成長",
        "D": "Transformer Tensor-Format Timing;一個精度設定"
      },
      "explain": "<p>TTFT = 首 token 時間。因為第一個 token 需要一次把整段 prompt 做完 prefill,所以 TTFT 大致隨 prompt 長度線性成長。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 為什麼 decode 每 token 的算術量很小,卻還是受限於記憶體?",
      "choices": {
        "A": "因為 decode 用的是 CUDA Core,不是 Tensor Core",
        "B": "因為每一步還是要從 HBM 把整份權重和 KV 快取讀進來,而對「一個 token 的 activation」卻只做一點點運算",
        "C": "因為 decode 會寫到磁碟",
        "D": "因為因果遮罩拖慢了一切"
      },
      "explain": "<p>權重不會因為「只在處理一個 token」就變小。每次 decode 步還是要把 140 GB 的權重從 HBM 搬過去 —— 為了生一個 token,付出巨量的記憶體流量。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> H200 的哪個特點對 **decode** 吞吐量比 prefill 更有幫助?",
      "choices": {
        "A": "更大、更快的 HBM —— 為受限於記憶體的階段提供更多頻寬",
        "B": "更多 Tensor Core",
        "C": "更高時脈",
        "D": "不同的指令集"
      },
      "explain": "<p>Prefill 受限於運算,多給 FLOPs 有用。Decode 受限於頻寬,多給 HBM 頻寬幾乎能直接 1:1 轉成 tokens/秒。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q5.</strong> 「拆解式服務(disaggregated serving,把 prefill 與 decode 分到不同 GPU)」的價值是什麼?",
      "choices": {
        "A": "讓 prompt 變短",
        "B": "減少參數量",
        "C": "跟 batching 一樣的東西",
        "D": "兩個階段的瓶頸剛好相反,所以各自專職一組 GPU,能避免同一台機器同時勉強處理兩種工作"
      },
      "explain": "<p>Prefill pool 跑的是能把運算吃滿、算術密度高的 kernel。Decode pool 跑的是能把頻寬吃滿、配大 batch 的 kernel。兩者混在一張 GPU 上,沒有一邊會被真正用滿。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 「chunked prefill」在解什麼問題?",
      "choices": {
        "A": "量化的數值誤差",
        "B": "KV 快取碎片化",
        "C": "一個很長的 prefill 會卡住同一張 GPU 上其他使用者正在跑的 decode 步",
        "D": "warp 發散"
      },
      "explain": "<p>把長 prompt 切成 256/512 個 token 的 chunk,讓排程器可以把這些 chunk 跟其他請求的 decode 步交錯執行,這樣一個巨大的 prompt 就不會把其他人全部凍住。</p>"
    }
  ]
}
</script>

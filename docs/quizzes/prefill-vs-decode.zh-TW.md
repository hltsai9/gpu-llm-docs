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
        "A": "Prefill —— 所有 prompt token 平行通過 model,算術密度高、能吃滿 tensor core",
        "B": "Decode —— 一次一個 token,但每 step 算術量也夠把 tensor core 拉滿",
        "C": "兩個都一樣 —— prefill 和 decode 在每層的算術密度其實是相同的",
        "D": "都不是 —— 兩個其實都受限於記憶體,實務上都是 HBM 頻寬卡住"
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
        "A": "因為 decode 用的是 CUDA Core 而不是 Tensor Core,FLOPs 吞吐就被腰斬",
        "B": "因為每 step 還是從 HBM 讀整份權重和 KV cache,卻只對一個 token 做一點點運算",
        "C": "因為 decode 會週期性把中間狀態寫到磁碟,以便發生 crash 時還能還原",
        "D": "因為 causal attention 的 mask 需要額外簿記,kernel 因此跑得慢一些"
      },
      "explain": "<p>權重不會因為「只在處理一個 token」就變小。每次 decode 步還是要把 140 GB 的權重從 HBM 搬過去 —— 為了生一個 token,付出巨量的記憶體流量。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> H200 的哪個特點對 **decode** 吞吐量比 prefill 更有幫助?",
      "choices": {
        "A": "更大、更快的 HBM —— 為受限於記憶體的 decode 階段提供更多頻寬",
        "B": "每 SM 更多 tensor core,把整顆晶片的 FP16 / BF16 峰值 FLOPs 拉高",
        "C": "更高的 SM 時脈,讓每個 cycle 完成的工作量增加、推論加速",
        "D": "不同的指令集,加入針對 decode kernel 的 fused-attention opcode"
      },
      "explain": "<p>Prefill 受限於運算,多給 FLOPs 有用。Decode 受限於頻寬,多給 HBM 頻寬幾乎能直接 1:1 轉成 tokens/秒。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q5.</strong> 「拆解式服務(disaggregated serving,把 prefill 與 decode 分到不同 GPU)」的價值是什麼?",
      "choices": {
        "A": "透明地把使用者 prompt 縮短,讓每個請求 prefill 花的時間更少",
        "B": "把權重分片到兩個 pool,藉此降低 model 整體的有效參數量",
        "C": "跟 batching 是同一件事 —— 兩個階段在同一個 GPU pool 裡一起跑",
        "D": "兩階段瓶頸相反,各自專職的 pool 能避免一張 GPU 同時勉強處理兩種工作"
      },
      "explain": "<p>Prefill pool 跑的是能把運算吃滿、算術密度高的 kernel。Decode pool 跑的是能把頻寬吃滿、配大 batch 的 kernel。兩者混在一張 GPU 上,沒有一邊會被真正用滿。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 「chunked prefill」在解什麼問題?",
      "choices": {
        "A": "量化在跨多層 prefill 時累積出來的數值誤差,會讓答案逐漸偏離",
        "B": "KV cache 碎片化,藉由配置固定大小的 block 而非連續記憶體來解決",
        "C": "一個很長的 prefill 會卡住同一張 GPU 上其他使用者正在跑的 decode step",
        "D": "Warp 發散,因為同一 batch 裡長度不一的序列在 attention kernel 裡分歧"
      },
      "explain": "<p>把長 prompt 切成 256/512 個 token 的 chunk,讓排程器可以把這些 chunk 跟其他請求的 decode 步交錯執行,這樣一個巨大的 prompt 就不會把其他人全部凍住。</p>"
    }
  ]
}
</script>

# 測驗 —— Continuous batching

六題,關於 iteration-level batching 以及它帶來的 throughput 收益。章節:[Continuous batching](../05-serving/continuous-batching.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 「收集 N 個請求、padding 到最長、跑一次大 forward pass」這種 <em>static</em> batching 有什麼問題?",
      "choices": {
        "A": "現代 GPU 處理不了 padded tensor",
        "B": "Static batching 只能用 FP32",
        "C": "Head-of-line blocking:batch 裡有個請求要生 1000 個 token,就卡住同 batch 其他請求,compute 浪費、GPU 在 batch 之間閒置",
        "D": "Static batch 不能用 tensor core"
      },
      "explain": "<p>Static batching 被 batch 裡最慢的請求拖住。短回覆在旁邊等久的那個煮完;GPU 在兩個 batch 之間也閒著。Continuous batching 的解法是每個 decode step 都加減請求 —— 不等、不 padding 到最長。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 為什麼<em>能</em>在每個 decode step 把請求進出 batch?",
      "choices": {
        "A": "每個 decode step 每個請求恰好產一個 token;工作分解成「per-request × per-step」單位,前後 step 的 batch 組成之間沒有耦合",
        "B": "現代 transformer 是 stateless 的",
        "C": "同一個 batch 裡所有請求每個 step 必須產一樣的 token",
        "D": "Decoding 是單使用者操作"
      },
      "explain": "<p>Decode 迴圈本質上就是每個請求每 step 產一個 token。也就是說 step t+1 的 batch 跟 step t 的 batch 不必一樣 —— 任何 step 邊界都能加、刪、重排。這就是 continuous batching 能成立的原因,也是為什麼 static batching 留了一大把 throughput 在桌上。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Continuous batching 需要哪三塊基礎建設?",
      "choices": {
        "A": "FP8 tensor core、NVLink、InfiniBand",
        "B": "Speculative decoding、MoE routing、LoRA hot-swap",
        "C": "CPU offload、disk swap、zero-copy RDMA",
        "D": "Paged KV cache(逐請求配置/釋放 page)、高效的 single-step kernel(CUDA graph)、還有 request-level scheduler"
      },
      "explain": "<p>沒 paged KV cache,每請求配置記憶體就碎片化。沒高效 single-step kernel,每 step 成本讓頻繁排程太貴。沒 scheduler,就決定不了下一個進 batch 的是誰。三塊都得穩 —— 所以自幹才這麼難。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Continuous batching 做起來後,新的瓶頸通常是:",
      "choices": {
        "A": "Model 權重的 disk I/O",
        "B": "KV cache 容量 —— HBM 能同時裝下多少請求的 cache",
        "C": "CPU 上的 tokenizer throughput",
        "D": "CUDA kernel launch overhead"
      },
      "explain": "<p>Continuous batching 把 GPU compute 拉到接近最優。之後限制同時數的,是 KV cache 記憶體 —— 每個 in-flight 請求占幾張 KV page,塞滿 HBM 以後,新請求要等,或現有的要被 preempt/evict。調 max_num_seqs 和 KV cache fraction 就成了下一個槓桿。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> <em>Chunked prefill</em> 解決了什麼?",
      "choices": {
        "A": "用字典編碼壓縮 input prompt",
        "B": "把 prefill 結果 cache 到 disk",
        "C": "把一個長 prefill 拆成 chunk,和 decode step 交錯跑,這樣新進來的長 prompt 在處理時,既有的 decode 請求不會停住",
        "D": "把 prefill 搬到第二張 GPU"
      },
      "explain": "<p>長 prefill 是 compute-heavy,會擋住其他人的 decode。Chunked prefill 把 prefill 拆小塊,和整個 batch 的 decode step 交錯,保持 decode 的反應速度。多數現代 serving framework 都支援;沒開是常見的調校漏洞。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Continuous-batching server 的 prefix sharing 什麼時候省成本?",
      "choices": {
        "A": "多個同時進來的請求共用一段長 system prompt —— 那段 prefix 的 KV page 算一次就共享,共享部分的 prefill 直接跳過",
        "B": "所有使用者問完全一樣的問題",
        "C": "每個請求的 system prompt 都不一樣",
        "D": "每個請求只看第一個 token"
      },
      "explain": "<p>使用者 A 和 B 共用一段長 system prompt,他們那段 prefix 的 KV cache 是一模一樣的。Paged attention 讓他們指向同一批 page —— 算一次、兩人(或更多)都讀,cache 用量減半,共享部分的 prefill 也跳過。有固定 system prompt 的聊天應用,這是白撿的 throughput。</p>"
    }
  ]
}
</script>

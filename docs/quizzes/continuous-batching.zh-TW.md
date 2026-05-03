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
        "A": "現代 GPU 不支援 padded tensor,masked position 會被忽略",
        "B": "Static batching 限制只能用 FP32,無法混精量化",
        "C": "Head-of-line blocking:短回覆等久的那個完成,GPU batch 間閒置",
        "D": "Static batch 無法利用 tensor core 的並行能力"
      },
      "explain": "<p>Static batching 被 batch 裡最慢的請求拖住。短回覆在旁邊等久的那個煮完;GPU 在兩個 batch 之間也閒著。Continuous batching 的解法是每個 decode step 都加減請求 —— 不等、不 padding 到最長。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 為什麼<em>能</em>在每個 decode step 把請求進出 batch?",
      "choices": {
        "A": "每個 decode step 每個請求獨立各產一個 token",
        "B": "現代 transformer 沒內部狀態,每 step 都重算整個 context",
        "C": "同 batch 所有請求每個 step 必須輸出一樣的 token 保持一致性",
        "D": "Decoding 一次只處理一個使用者、順序執行"
      },
      "explain": "<p>Decode 迴圈本質上就是每個請求每 step 產一個 token。也就是說 step t+1 的 batch 跟 step t 的 batch 不必一樣 —— 任何 step 邊界都能加、刪、重排。這就是 continuous batching 能成立的原因,也是為什麼 static batching 留了一大把 throughput 在桌上。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Continuous batching 需要哪三塊基礎建設?",
      "choices": {
        "A": "FP8 量化、NVLink 頻寬、InfiniBand 網路",
        "B": "Speculative decoding、MoE 路由、LoRA 熱交換",
        "C": "CPU 記憶體溢出、磁碟快取、kernel-free 運算",
        "D": "Paged KV cache、CUDA graph kernel、scheduler"
      },
      "explain": "<p>沒 paged KV cache,每請求配置記憶體就碎片化。沒高效 single-step kernel,每 step 成本讓頻繁排程太貴。沒 scheduler,就決定不了下一個進 batch 的是誰。三塊都得穩 —— 所以自幹才這麼難。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Continuous batching 做起來後,新的瓶頸通常是:",
      "choices": {
        "A": "Model 權重從磁碟載入的 I/O",
        "B": "KV cache 容量限制並行請求數",
        "C": "CPU 端的 tokenizer 效能",
        "D": "CUDA kernel launch 的 overhead"
      },
      "explain": "<p>Continuous batching 把 GPU compute 拉到接近最優。之後限制同時數的,是 KV cache 記憶體 —— 每個 in-flight 請求占幾張 KV page,塞滿 HBM 以後,新請求要等,或現有的要被 preempt/evict。調 max_num_seqs 和 KV cache fraction 就成了下一個槓桿。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> <em>Chunked prefill</em> 解決了什麼?",
      "choices": {
        "A": "用壓縮演算法減小 input prompt",
        "B": "把 prefill 結果快取到磁碟",
        "C": "把 prefill 和 decode 交錯,避免卡住",
        "D": "把 prefill 分到第二張 GPU"
      },
      "explain": "<p>長 prefill 是 compute-heavy,會擋住其他人的 decode。Chunked prefill 把 prefill 拆小塊,和整個 batch 的 decode step 交錯,保持 decode 的反應速度。多數現代 serving framework 都支援;沒開是常見的調校漏洞。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Continuous-batching server 的 prefix sharing 什麼時候省成本?",
      "choices": {
        "A": "多個請求共用 prefix,指向同一批 KV page",
        "B": "所有使用者提交完全相同的請求和回應",
        "C": "每個請求的 system prompt 都獨特且不重複",
        "D": "只需要生成和輸出第一個 token"
      },
      "explain": "<p>使用者 A 和 B 共用一段長 system prompt,他們那段 prefix 的 KV cache 是一模一樣的。Paged attention 讓他們指向同一批 page —— 算一次、兩人(或更多)都讀,cache 用量減半,共享部分的 prefill 也跳過。有固定 system prompt 的聊天應用,這是白撿的 throughput。</p>"
    }
  ]
}
</script>

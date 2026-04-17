# 測驗 —— 同時服務多桌客人(Batching)

六題關於攤銷與連續 batching 的問題。章節:[同時服務多桌客人(Batching)](../03-llm-inference/batching.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> decode 時,batching 在**攤銷**的是什麼?",
      "choices": {
        "A": "每一層權重從 HBM 讀出來的成本 —— 同樣一份權重在一次 forward pass 裡服務整個 batch 的所有序列",
        "B": "CUDA kernel 啟動的額外開銷",
        "C": "softmax 運算",
        "D": "什麼都沒攤 —— 每個請求都獨立"
      },
      "explain": "<p>權重每一步只從 HBM 讀一次,不管 batch 多大。讓這次權重讀取服務 64 條序列,就能多做 64 倍的有用工作 —— 算術密度也成比例往上跳。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 靜態與連續 batching 最核心的差別是什麼?",
      "choices": {
        "A": "靜態 batching 每 token 比較快",
        "B": "連續 batching 沒有 batch size",
        "C": "靜態把請求湊成一批一起跑,直到最慢那條跑完;連續 batching(iteration-level)在 decode 步之間可以隨時加入或移除序列",
        "D": "只有靜態 batching 會用 GPU"
      },
      "explain": "<p>靜態 batching 是旅遊巴士 —— 你得等最晚下車的那位。連續 batching 是共乘小巴 —— 乘客沿途隨上隨下,GPU 永遠幾乎是滿的。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 實務上,decode 的 batch size 上限是被什麼卡住?",
      "choices": {
        "A": "CUDA 的 thread-block 上限",
        "B": "prompt 的長度",
        "C": "單靠模型的參數量",
        "D": "KV 快取記憶體 —— 每條並行的序列都要在 HBM 裡有自己的一份快取"
      },
      "explain": "<p>權重可以跨 batch 共用,但 KV 快取是每條序列各自的。HBM 總量 ÷ 每序列 KV 快取大小,就決定了你同時能維持多少場對話。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Batching 幫 **prefill** 幫得跟幫 decode 一樣多嗎?",
      "choices": {
        "A": "是 —— 好處一樣",
        "B": "比較少 —— 單一個夠大的 prefill 就已經把 Tensor Core 吃滿了(受限於運算),再疊更多 prefill 也不會更快",
        "C": "不會,batching 反而拖慢 prefill",
        "D": "prefill 不使用 HBM"
      },
      "explain": "<p>Prefill 在一般尺寸下就已經受限於運算。把很多短 prefill 湊一起還是有幫助,但一旦單一個 prefill 就能吃滿整顆晶片,再多也只是排隊。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> 連續 batching 是在哪個粒度做 batch?",
      "choices": {
        "A": "每個 token(每次 iteration)—— 每個 decode 步都會用「當下活著的序列」重新組出一個 batch",
        "B": "每天",
        "C": "每個 epoch",
        "D": "每個模型"
      },
      "explain": "<p>Token 層級 / iteration 層級的 batch:每一步 decode 時,排程器用「活著的請求」重新組 batch。跑完的序列立刻離開;新來的一 prefill 完就加入。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 隨著 batch size 變大,什麼會開始主導 HBM 流量(最後取代權重)?",
      "choices": {
        "A": "Embedding 表",
        "B": "模型的 bias 向量",
        "C": "KV 快取讀取 —— 它會隨 batch size 線性成長,而權重讀取則維持常數",
        "D": "warp 排程器"
      },
      "explain": "<p>權重:不管 batch 多大,每步只讀一次。KV 快取:batch = N 時就是 N 次。最後 KV 快取的流量會超過權重流量,成為新的瓶頸 —— 這也是為什麼縮小 KV 快取這麼重要。</p>"
    }
  ]
}
</script>

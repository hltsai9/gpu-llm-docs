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
        "A": "每層權重從 HBM 讀的成本 —— 同一份權重在一次 forward pass 裡服務整個 batch",
        "B": "CUDA kernel launch 的額外 overhead,在 step 很小或 pipeline 串接時主導成本",
        "C": "Softmax 運算的成本,因為它每層只跑一次,跟 batch size 沒有直接關係",
        "D": "什麼都沒攤 —— 每個請求都獨立跑自己的 forward pass、各自從 HBM 讀權重"
      },
      "explain": "<p>權重每一步只從 HBM 讀一次,不管 batch 多大。讓這次權重讀取服務 64 條序列,就能多做 64 倍的有用工作 —— 算術密度也成比例往上跳。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 靜態與連續 batching 最核心的差別是什麼?",
      "choices": {
        "A": "靜態 batching 每 token 比較快,因為所有請求跑同一個固定的 forward pass",
        "B": "連續 batching 沒有 batch size 的概念,每個請求都跑在自己獨立的 kernel 裡",
        "C": "靜態 batch 等最慢那條跑完才結束;連續 batching(iteration-level)在 decode step 間隨時加減",
        "D": "只有靜態 batching 真的跑在 GPU 上;連續 batching 會 fallback 到 CPU 排程"
      },
      "explain": "<p>靜態 batching 是旅遊巴士 —— 你得等最晚下車的那位。連續 batching 是共乘小巴 —— 乘客沿途隨上隨下,GPU 永遠幾乎是滿的。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 實務上,decode 的 batch size 上限是被什麼卡住?",
      "choices": {
        "A": "CUDA 的 thread-block 硬性上限,每次 kernel 啟動最多能有多少 block",
        "B": "Prompt 的長度,因為較長 prompt 需要在 batch 裡占用更大的 compute slot",
        "C": "單靠模型本身的參數量,它直接決定了 HBM 裡剩下多少空間給其他用途",
        "D": "KV cache 記憶體 —— 每條並行序列都要在 HBM 裡有自己每層的快取"
      },
      "explain": "<p>權重可以跨 batch 共用,但 KV 快取是每條序列各自的。HBM 總量 ÷ 每序列 KV 快取大小,就決定了你同時能維持多少場對話。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Batching 幫 **prefill** 幫得跟幫 decode 一樣多嗎?",
      "choices": {
        "A": "是 —— 好處完全一樣,因為 prefill 和 decode 的算術密度其實是相同的",
        "B": "比較少 —— 單一夠大的 prefill 就把 Tensor Core 吃滿(受限運算),再疊更多 prefill 也只是排隊",
        "C": "不會,batching 反而會拖慢 prefill,因為它強迫多條短序列之間做同步等待",
        "D": "Prefill 完全不用 HBM,所以 batching 在 prefill 階段攤銷不到任何東西"
      },
      "explain": "<p>Prefill 在一般尺寸下就已經受限於運算。把很多短 prefill 湊一起還是有幫助,但一旦單一個 prefill 就能吃滿整顆晶片,再多也只是排隊。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> 連續 batching 是在哪個粒度做 batch?",
      "choices": {
        "A": "每個 token(每次 iteration)—— 每個 decode step 用「當下活著的序列」重新組 batch",
        "B": "每個請求 —— 序列只能跟同一個 incoming HTTP 請求裡同時送進來的人共用 batch",
        "C": "每個 epoch —— 排程器要等所有 in-flight 序列都跑完,才會開新的一輪 batch",
        "D": "每個模型 —— 只有打到同一個 model deployment 的序列,才有機會共用一個 batch"
      },
      "explain": "<p>Token 層級 / iteration 層級的 batch:每一步 decode 時,排程器用「活著的請求」重新組 batch。跑完的序列立刻離開;新來的一 prefill 完就加入。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 隨著 batch size 變大,什麼會開始主導 HBM 流量(最後取代權重)?",
      "choices": {
        "A": "Embedding 表,因為 batch 裡每個新 token 都會打到不同的 embedding row",
        "B": "模型的 bias 向量,每個序列每層都要重新讀一次 bias 才能算 forward",
        "C": "KV cache 讀取 —— 隨 batch size 線性成長,而權重讀取仍維持每 step 一次的常數",
        "D": "Warp scheduler 的 dispatch metadata,它的大小隨同時活著的序列數線性增長"
      },
      "explain": "<p>權重:不管 batch 多大,每步只讀一次。KV 快取:batch = N 時就是 N 次。最後 KV 快取的流量會超過權重流量,成為新的瓶頸 —— 這也是為什麼縮小 KV 快取這麼重要。</p>"
    }
  ]
}
</script>

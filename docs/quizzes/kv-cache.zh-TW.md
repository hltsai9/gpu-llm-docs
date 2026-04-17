# 測驗 —— KV 快取

七題關於讓串流變可行的那本筆記本。章節:[KV 快取](../03-llm-inference/kv-cache.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 為什麼我們快取 K 和 V,但不快取 Q?",
      "choices": {
        "A": "Q 佔記憶體太多",
        "B": "Q 其實也有被快取",
        "C": "過去 token 的 K、V 每一步之間都不變;新 token 的 Q 會拿來跟快取中的歷史比對",
        "D": "Q 存在 CPU 裡"
      },
      "explain": "<p>第 17 層 token 3 的 K 和 V,在生成 token 100 時,跟生成 token 4 時是一模一樣的 —— 所以我們只算一次、就留著。每一步實際需要的,是**新** token 的 Q。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 沒有 KV 快取時,生成 token t 的成本怎麼成長?",
      "choices": {
        "A": "大致隨 t 線性(甚至更糟)—— 每一步都得重算所有之前的 K/V",
        "B": "不論 t 多少都常數",
        "C": "只跟 batch size 有關",
        "D": "次線性 —— 根本不需要快取"
      },
      "explain": "<p>每多一個 token 就得把整段前綴重新跑一次模型。到了第 2,000 個 token,你的工作量會是一開始的 2,000 倍。快取把它變成每個新 token 大致固定工作量(再加上隨序列長度成長的 attention 成本)。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 70B 參數模型(約 Llama-2-70B、沒有 GQA)在 FP16 下,每 token 大約用多少 KV 快取?",
      "choices": {
        "A": "約 25 KB",
        "B": "約 2.5 MB",
        "C": "約 2.5 GB",
        "D": "約 25 MB"
      },
      "explain": "<p>每 token 約 2.5 MB。在 32K context 下就是約 82 GB —— 比整張 H100 的 HBM 還多。這就是為什麼 KV 快取最佳化是 LLM 服務最核心的記憶體問題。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> Grouped-Query Attention(GQA)在做什麼?",
      "choices": {
        "A": "跨多組 GPU 上跑 attention",
        "B": "把 attention head 數量加倍",
        "C": "把 softmax 換成一個群組化運算",
        "D": "讓一群 Q-head 共用一組 K/V,縮小 KV 快取"
      },
      "explain": "<p>Llama-2 70B 有 64 個 Q-head 但只有 8 個 KV-head —— KV 快取縮小 8 倍,品質損失極小。因為 KV 快取大小太關鍵,GQA 現在已經是現代開源模型的標配。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> Paged KV 快取(vLLM 風格)主要的好處是什麼?",
      "choices": {
        "A": "減少記憶體碎片化,也讓「有共同前綴的序列」可以共用 page",
        "B": "讓 attention 在數值上更準確",
        "C": "加速 Tensor Core",
        "D": "把 KV 快取整個省掉"
      },
      "explain": "<p>Paging 的概念是借自作業系統的虛擬記憶體。固定大小的 page 讓伺服器能在一張 GPU 上塞更多序列,也讓多條序列在共同前綴(例如同一段 system prompt)上指向同一批 page。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> decode 時,每個新 token 的前向傳遞必須讀……",
      "choices": {
        "A": "只讀新 token 的 activation",
        "B": "只讀 embedding 表",
        "C": "所有權重矩陣**以及**目前為止完整的 KV 快取",
        "D": "只讀 LM head"
      },
      "explain": "<p>權重:每一層的 matmul 都要把完整權重張量讀進來。KV 快取:對所有過去 token 做 attention 時,整份快取都要讀。這就是為什麼 decode 是受限於記憶體 —— 大量 HBM 讀取、但每 byte 做的算術極少。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q7.</strong> 把 KV 快取從 FP16 量化到 INT8,主要帶來的好處是……",
      "choices": {
        "A": "降低準確度以加速訓練",
        "B": "每次 decode 步要讀的 byte 減半 —— 直接加速受限於記憶體的 decode",
        "C": "讓 attention head 數量變多",
        "D": "關掉因果遮罩"
      },
      "explain": "<p>道理跟權重量化一樣:每省下一個 byte,就是一個不必搬的 byte。decode 吞吐量大致跟 KV 快取 byte 數成反比。</p>"
    }
  ]
}
</script>

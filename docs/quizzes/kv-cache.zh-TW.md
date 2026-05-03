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
        "A": "Q 佔用的 GPU 記憶體比例太大無法快取",
        "B": "Q 其實也跟 K 和 V 一起被快取儲存",
        "C": "過去 token 的 K、V 每一步之間都不變;新 token 的 Q 會拿來跟快取中的歷史比對",
        "D": "Q 向量是存放在 CPU 側的記憶體裡"
      },
      "explain": "<p>第 17 層 token 3 的 K 和 V,在生成 token 100 時,跟生成 token 4 時是一模一樣的 —— 所以我們只算一次、就留著。每一步實際需要的,是**新** token 的 Q。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 沒有 KV 快取時,生成 token t 的成本怎麼成長?",
      "choices": {
        "A": "大致隨 t 線性甚至更差 —— 每一步都得重算所有之前的 K/V",
        "B": "不論序列長度多長都維持完全常數",
        "C": "只跟每個推論批次的 batch size 參數關係",
        "D": "呈現次線性成長 —— 根本不需要快取"
      },
      "explain": "<p>每多一個 token 就得把整段前綴重新跑一次模型。到了第 2,000 個 token,你的工作量會是一開始的 2,000 倍。快取把它變成每個新 token 大致固定工作量(再加上隨序列長度成長的 attention 成本)。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 70B 參數模型(約 Llama-2-70B、沒有 GQA)在 FP16 下,每 token 大約用多少 KV 快取?",
      "choices": {
        "A": "每 token 大約 25 kilobytes 的快取容量",
        "B": "每 token 大約 2.5 megabytes 的快取存儲",
        "C": "每 token 大約 2.5 gigabytes 的快取存儲",
        "D": "每 token 大約 25 megabytes 的快取容量"
      },
      "explain": "<p>每 token 約 2.5 MB。在 32K context 下就是約 82 GB —— 比整張 H100 的 HBM 還多。這就是為什麼 KV 快取最佳化是 LLM 服務最核心的記憶體問題。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> Grouped-Query Attention(GQA)在做什麼?",
      "choices": {
        "A": "跨多個 GPU 組分散式平行執行 attention 計算",
        "B": "增加 attention head 總數以提高模型表達能力",
        "C": "把 softmax 運算替換成群組化的替代方案",
        "D": "讓一群 Q-head 共用一組 K/V,縮小 KV 快取"
      },
      "explain": "<p>Llama-2 70B 有 64 個 Q-head 但只有 8 個 KV-head —— KV 快取縮小 8 倍,品質損失極小。因為 KV 快取大小太關鍵,GQA 現在已經是現代開源模型的標配。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> Paged KV 快取(vLLM 風格)主要的好處是什麼?",
      "choices": {
        "A": "減少記憶體碎片化,也讓「有共同前綴的序列」可以共用 page",
        "B": "提高 attention 計算的數值精度和穩定性",
        "C": "直接加速 Tensor Core 的矩陣乘法操作",
        "D": "完全移除在生成時需要的 KV 快取存儲"
      },
      "explain": "<p>Paging 的概念是借自作業系統的虛擬記憶體。固定大小的 page 讓伺服器能在一張 GPU 上塞更多序列,也讓多條序列在共同前綴(例如同一段 system prompt)上指向同一批 page。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> decode 時,每個新 token 的前向傳遞必須讀……",
      "choices": {
        "A": "只讀新計算 token 位置特有的中間激活",
        "B": "只讀 embedding 查表用以詞彙映射",
        "C": "所有權重矩陣**以及**目前為止完整的 KV 快取",
        "D": "只讀 LM head 投影層的完整權重"
      },
      "explain": "<p>權重:每一層的 matmul 都要把完整權重張量讀進來。KV 快取:對所有過去 token 做 attention 時,整份快取都要讀。這就是為什麼 decode 是受限於記憶體 —— 大量 HBM 讀取、但每 byte 做的算術極少。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q7.</strong> 把 KV 快取從 FP16 量化到 INT8,主要帶來的好處是……",
      "choices": {
        "A": "犧牲一些精度,以加速整個訓練階段的反向傳播流程",
        "B": "每個 decode step 要讀的 byte 減半,直接加速 memory-bound 的 decode",
        "C": "讓 attention head 的總數能夠增加,模型的容量也跟著拉高",
        "D": "從計算過程中完全移除 causal mask,簡化 attention kernel 的邏輯"
      },
      "explain": "<p>道理跟權重量化一樣:每省下一個 byte,就是一個不必搬的 byte。decode 吞吐量大致跟 KV 快取 byte 數成反比。</p>"
    }
  ]
}
</script>

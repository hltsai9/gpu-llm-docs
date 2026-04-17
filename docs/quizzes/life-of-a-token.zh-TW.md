# 測驗 —— 一個 token 的一生

六題關於端到端流程的問題。章節:[一個 token 的一生](../03-llm-inference/life-of-a-token.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Tokenization 會把文字轉成什麼?",
      "choices": {
        "A": "直接轉成浮點數向量",
        "B": "原始 byte 直接餵給 GPU",
        "C": "一串整數 ID,對應到詞彙表裡的索引",
        "D": "一個 token 對應一個單字,永遠如此"
      },
      "explain": "<p>Tokenization 產生的是整數 ID(約 50K–200K 個可能值)。這些 ID 接著會在 embedding 表上被查詢,轉成向量。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> 一個 token 的 embedding 向量從哪裡來?",
      "choices": {
        "A": "每次從一個小神經網路現場生成",
        "B": "用整數 ID 從模型的 embedding 表(每個詞彙項目一列)裡查出來",
        "C": "用 token 的 Unicode byte 算出來",
        "D": "從 attention 層來"
      },
      "explain": "<p>Embedding 是一份被學出來的查表:token ID → 4,096 維(或類似)的向量。這一次矩陣乘法把離散 token 映射到連續空間,後面的模型才能對它動手腳。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 一個 Transformer 層通常由什麼組成?",
      "choices": {
        "A": "只有一次矩陣乘法",
        "B": "只有 attention",
        "C": "只有前饋",
        "D": "Layer norm → attention → 殘差 → layer norm → 前饋 → 殘差"
      },
      "explain": "<p>每一層:正規化、attention、把 attention 輸出加回輸入(殘差)、再正規化、跑前饋 MLP、再加一次。根據模型大小,整個堆疊有 32 到 96 層。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> LM head 在堆疊尾端做什麼?",
      "choices": {
        "A": "把最後一個 token 的向量投影成整個詞彙表上的機率分佈",
        "B": "把輸出重新 tokenize",
        "C": "跨層計算 attention",
        "D": "決定要在哪張 GPU 上跑"
      },
      "explain": "<p>LM head 是一個大的線性投影,從 hidden dim(約 4,096)投到詞彙大小(約 50,000+),接著再用抽樣策略(greedy、top-k、top-p、temperature……)來挑下一個 token。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 什麼是自回歸(autoregression)?",
      "choices": {
        "A": "模型產生結果後的自我評估步驟",
        "B": "一次生一個 token,把它追加到序列尾端,再把延長後的序列餵回去",
        "C": "訓練時的一種正規化技術",
        "D": "跑多個模型然後投票"
      },
      "explain": "<p>自回歸生成:token t 依條件於 tokens 1…t-1。每個新 token 都是一次完整的前向傳遞,看得到它前面的一切 —— 這也是為什麼一個字一個字吐出來的串流感覺那麼「活」。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 70B 參數模型在 FP16 下,以約 100 tokens/秒的速度為一位使用者生成 token,大約每秒要搬多少資料?",
      "choices": {
        "A": "幾 MB/秒",
        "B": "幾百 MB/秒",
        "C": "大約 14 TB/秒(100 次前向傳遞 × 約 140 GB 權重)",
        "D": "不用搬 —— 權重會留在 GPU 暫存器裡"
      },
      "explain": "<p>每次前向傳遞要從 HBM 拉約 140 GB 的權重。100 tokens/秒 × 140 GB = 約 14 TB/秒。等於單一位使用者要佔掉 4 到 5 張 H100 的全部 HBM 頻寬 —— 這就是為什麼 batching 是必備。</p>"
    }
  ]
}
</script>

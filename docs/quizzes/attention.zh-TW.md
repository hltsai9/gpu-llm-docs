# 測驗 —— 慢慢講清楚 Attention

六題關於 Q/K/V、softmax、以及 FlashAttention 的問題。章節:[慢慢講清楚 Attention](../03-llm-inference/attention.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> 哪個向量代表「這個 token 在找什麼?」",
      "choices": {
        "A": "Query(Q), 代表「我在找什麼」的向量",
        "B": "Key(K), 代表「序列中每個 token 是什麼」用於比對",
        "C": "Value(V), 代表「每個 token 帶著什麼資訊」內容",
        "D": "Embedding, 是輸入 token 的原始表示法"
      },
      "explain": "<p>Q 是「我在找什麼」的向量。K 是「我代表什麼」—— 用來被 query 比對。V 是「我帶了什麼資訊」—— 會根據 attention 權重被混進輸出。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 序列長度為 L,attention 分數矩陣(QKᵀ)的形狀是什麼?",
      "choices": {
        "A": "L × d 代表序列長度乘以嵌入維度大小",
        "B": "d × d 代表嵌入維度乘以嵌入維度",
        "C": "L × L (序列長度乘以序列長度)",
        "D": "1 × L 代表每個查詢位置的單一列向量"
      },
      "explain": "<p>每個 token 都會被跟其他每個 token 打分:L × L 個項目。這就是 attention 成本隨序列長度二次方成長的源頭。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> attention 成本中,什麼是序列長度 L 的二次方?",
      "choices": {
        "A": "所有使用者跨批次的解碼 token 生成數量",
        "B": "attention 分數矩陣(QKᵀ)與加權乘 V 的運算 —— 兩者都是 L²",
        "C": "平行分散計算所需的 GPU 數量",
        "D": "堆疊在一起的 Transformer 層總數"
      },
      "explain": "<p>QKᵀ 矩陣是 L × L,而把這個 L × L 權重矩陣乘上 V 的工作量是 L × L × d。這就是為什麼 128K context 推論比 4K context 推論難得多。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 生成時,因果遮罩強制了什麼?",
      "choices": {
        "A": "每個 head 在層內只能 attend 到另一個特定 head",
        "B": "attention 權重在所有 token 對之間完全對稱",
        "C": "序列中只有第一個 token 被用於所有預測",
        "D": "token i 不能 attend 到未來的 token j > i"
      },
      "explain": "<p>語言模型是自回歸的。生成時,未來的 token 根本還不存在;訓練時,如果 attend 到未來 token 就會洩漏答案。遮罩會在 softmax 之前把「未來位置」的分數設成零。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> FlashAttention 改了什麼?",
      "choices": {
        "A": "記憶體佈局 —— 它從不把完整的 L × L 分數矩陣寫到 HBM,暫存資料留在晶片上。數學沒變。",
        "B": "用運算量較少的近似來完全取代 softmax 計算",
        "C": "移除一半的 attention head 來顯著減少計算量",
        "D": "在 attention 機制裡加入新的可訓練參數"
      },
      "explain": "<p>FlashAttention 是更聰明的 kernel,不是新的演算法。它把運算切 tile,讓分數矩陣只待在共享記憶體與暫存器裡 —— 用一點點多餘運算換大量減少的 HBM 流量。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 為什麼 Transformer 要用多個 attention **head**?",
      "choices": {
        "A": "為了在不增加計算成本的情況下把參數總數加倍",
        "B": "讓不同 head 可以專精在不同類型的關係上(語法、共指、數值……)",
        "C": "因為單一個 attention head 的容量太大無法放入 GPU 記憶體",
        "D": "為了對 attention 權重分佈進行隨機化來提高穩健性"
      },
      "explain": "<p>Multi-head attention 會把 hidden dim 切給各個 head;每個 head 有自己的 Q/K/V 投影。各 head 會學到 attend 到不同面向的資訊 —— 對同一輸入,同樣的總 FLOPs 成本下,提供了多副不同的「鏡片」。</p>"
    }
  ]
}
</script>

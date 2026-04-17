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
        "A": "Query(Q)",
        "B": "Key(K)",
        "C": "Value(V)",
        "D": "Embedding"
      },
      "explain": "<p>Q 是「我在找什麼」的向量。K 是「我代表什麼」—— 用來被 query 比對。V 是「我帶了什麼資訊」—— 會根據 attention 權重被混進輸出。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 序列長度為 L,attention 分數矩陣(QKᵀ)的形狀是什麼?",
      "choices": {
        "A": "L × d",
        "B": "d × d",
        "C": "L × L",
        "D": "1 × L"
      },
      "explain": "<p>每個 token 都會被跟其他每個 token 打分:L × L 個項目。這就是 attention 成本隨序列長度二次方成長的源頭。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> attention 成本中,什麼是序列長度 L 的二次方?",
      "choices": {
        "A": "產生的 token 數",
        "B": "attention 分數矩陣(QKᵀ)與加權乘 V 的運算 —— 兩者都是 L²",
        "C": "需要的 GPU 數量",
        "D": "模型深度"
      },
      "explain": "<p>QKᵀ 矩陣是 L × L,而把這個 L × L 權重矩陣乘上 V 的工作量是 L × L × d。這就是為什麼 128K context 推論比 4K context 推論難得多。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 生成時,因果遮罩強制了什麼?",
      "choices": {
        "A": "每個 head 只能 attend 到另一個 head",
        "B": "attention 在 token 間對稱",
        "C": "只用第一個 token",
        "D": "token i 不能 attend 到未來的 token j > i"
      },
      "explain": "<p>語言模型是自回歸的。生成時,未來的 token 根本還不存在;訓練時,如果 attend 到未來 token 就會洩漏答案。遮罩會在 softmax 之前把「未來位置」的分數設成零。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> FlashAttention 改了什麼?",
      "choices": {
        "A": "記憶體佈局 —— 它從不把完整的 L × L 分數矩陣寫到 HBM,暫存資料留在晶片上。數學沒變。",
        "B": "用比較便宜的近似取代 softmax",
        "C": "剪掉一半的 attention head",
        "D": "加入新的可學習參數"
      },
      "explain": "<p>FlashAttention 是更聰明的 kernel,不是新的演算法。它把運算切 tile,讓分數矩陣只待在共享記憶體與暫存器裡 —— 用一點點多餘運算換大量減少的 HBM 流量。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 為什麼 Transformer 要用多個 attention **head**?",
      "choices": {
        "A": "為了在不多花成本的情況下把參數量加倍",
        "B": "讓不同 head 可以專精在不同類型的關係上(語法、共指、數值……)",
        "C": "因為單一個 head 塞不進一張 GPU",
        "D": "為了把 attention 分數隨機化"
      },
      "explain": "<p>Multi-head attention 會把 hidden dim 切給各個 head;每個 head 有自己的 Q/K/V 投影。各 head 會學到 attend 到不同面向的資訊 —— 對同一輸入,同樣的總 FLOPs 成本下,提供了多副不同的「鏡片」。</p>"
    }
  ]
}
</script>

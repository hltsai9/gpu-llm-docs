# 第六部分 —— 用 LLM 打造東西

這部分是寫給開發者的。它和第一到第三部分(GPU 在做什麼)、第四到第五部分(model 怎麼訓練、怎麼 serve)分開 —— 這邊我們把那些都當成給定,來問實務問題:*你要怎麼在 LLM API 上面打造一個 production 功能?*

<div class="hero" markdown>

LLM API 不是資料庫。不是搜尋引擎。不是確定性函式。它是一個「帶點狀態」的 generator,會意外地能幹、偶爾災難性地爛、而且永遠是按 token 計費。要穩穩地在它上面打造東西,需要一小組 pattern —— prompting、retrieval、tool use、evaluation —— 合起來構成開發者的工具箱。

</div>

## 這部分有什麼

- [API basics](api-basics.md) —— token、context window、streaming、sampling、錯誤處理。
- [Prompt engineering 模式](prompt-engineering.md) —— 真的有用的那些 pattern。
- [Retrieval-Augmented Generation(RAG)](rag.md) —— 怎麼把 model 沒有的知識給它。
- [Tool use 與 agent](tool-use-agents.md) —— 讓 model 能採取行動。
- [能用的 evaluation](evals.md) —— demo 和產品之間的差別。

## 為什麼是這五個、按這個順序

每個以 LLM 為基礎的功能都坐在前兩個上:API 呼叫和 prompt。如果 prompting 就夠,就停在那 —— 再上一層都不是免費的。model 需要它沒有的知識時,伸手去拿 RAG。model 需要採取行動時,伸手去拿 tool use。要出貨時,就建 eval。

常見的失敗模式是搞錯順序:還沒 prompting 就 fine-tune、還沒 retrieval 就做 agent、還沒 eval 就上 production。每一次倒置都會讓同一個結果付出 2–10 倍的工程時間。

## 一句話帶走

以 LLM 為基礎的軟體,難的部分不是 model 呼叫。難的是圍繞在外面的紀律:仔細的 prompt、有節制的 retrieval、保守的 tool 接線、還有能告訴你「以上任何一個壞了」的 eval。

從 [API basics →](api-basics.md) 開始。

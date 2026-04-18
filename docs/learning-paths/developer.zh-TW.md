# 路徑一 —— 軟體開發者

## 這是寫給誰的

你寫得出可以出貨的程式碼。你用過 REST API、你知道 JSON 是什麼、你也在半夜兩點 debug 過 webhook。現在有人請你把「AI」加進某個產品裡 —— 一個客服機器人、一個會摘要的搜尋框、一個表單上的寫作助理、一個會自動開 ticket 的 agent。你不需要訓練什麼。你只是需要像使用任何其他服務一樣,用 LLM *去打造東西*:呼叫它、處理它的失敗、留意它的成本。

## 目標

走完這條路徑之後,你會:

- 知道 token 實際上是什麼,以及為什麼它會出現在每一張帳單上。
- 知道什麼時候該用 prompt engineering、什麼時候該用 retrieval、什麼時候該用 fine-tuning。
- 有能力做出一個小型、可以上 production 的功能:function calling、retry、streaming、structured output,以及一套 eval 流程。
- 看得懂 model card,並且在不同供應商之間做出有根據的選擇。
- 對每次請求的延遲與金額有一個心裡的預算,並且知道哪些旋鈕會影響它們。

## 先備知識

任何後端語言、對 HTTP 與 async 有基本熟悉、一個文字編輯器。不需要 ML 背景,也不需要 CUDA。

## 這條路徑

### 第一步 —— 先建立正確的心智模型(寫 code 之前先讀)

你不需要知道 GPU 怎麼運作就能*使用* LLM,就像你不需要知道 Postgres 怎麼存索引就能*查詢*它一樣。但花十五分鐘建立背景,可以讓你之後不用跟幾個非常頑強的誤解搏鬥。

1. [自助餐廳 vs. 牛排館](../01-why-gpu/cpu-vs-gpu.md) —— 為什麼 LLM 不會跑在你的筆電上。
2. [Token 是什麼?](../03-llm-inference/token.md) —— *所有東西*的單位。帳單、延遲、上限。
3. [一個 token 的一生](../03-llm-inference/life-of-a-token.md) —— 一分鐘就能讀完,卻能幫你擋掉一堆 bug。

**帶走的重點:** LLM 是一個用 HTTP 提供服務的下一個 token 預測器。API 上的每一個參數,都對應到這個過程裡的某個東西。

!!! warning "誤解檢查點"

    **「prompt 越長,prompt 越好。」** 聽起來更接近真的的親戚說法:*「提供更多 context 總是有幫助。」* 在傳統搜尋裡,是的 —— 多幾個 query 詞通常有幫助。但在 LLM 裡,非常長的 prompt 會遭遇*位置偏差*(埋在中間的重要資訊會被忽略),而且每次呼叫都要付更多錢。正確的推廣是「高訊噪比的 context 有幫助」。一個 200 token、帶著三個正確事實的 prompt,勝過一個 20,000 token、塞了所有你能找到的東西的 prompt。

### 第二步 —— API 以及它的旋鈕

新章節:[API 基礎(給開發者)](../06-building/api-basics.md)。涵蓋驗證、model、messages、system vs. user turn、`temperature`、`top_p`、`max_tokens`、streaming,以及怎麼處理 rate limit 與 retry。

搭配 [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) 一起看 —— 知道你的延遲是「prefill + N × decode」這件事,會改變你設計 endpoint 的方式。streaming 的動機會變得很明顯;一個 2000 token 的 prompt 為什麼不會是 1 token 的 2000 倍成本,也會變得很明顯。

**帶走的重點:** 你可以把一次 LLM 呼叫想成「固定的 prompt 處理成本 + 每個輸出 token 的成本」。有了這兩個數字,任何功能你都可以做粗略估算。

!!! warning "誤解檢查點"

    **「設 `temperature=0` 會讓輸出 deterministic。」** 聽起來更接近真的的親戚說法:*「把 RNG 的 seed 設成 0,每次都會得到同樣的結果。」* 對 in-process 的 RNG 來說這是對的;對一個託管的 LLM 通常不是。大多數供應商就算在 `temperature=0` 的情況下,也不保證 determinism —— kernel 的不確定性、跨 model 副本的負載平衡、偶爾的模型更新,都會改變輸出。把 `temperature=0` 當成「大致穩定」,不是「一定一樣」,並且寫 eval 的時候要容忍表面變化。

### 第三步 —— 把 prompt engineering 當成一級技能

新章節:[Prompt engineering 模式](../06-building/prompt-engineering.md)。Few-shot、chain-of-thought、structured output(JSON mode / schema)、role conditioning、reflection。附可以直接抄的完整範例。

**帶走的重點:** production 上 80% 的「LLM bug」其實是 prompt bug。一個分隔符改掉、一個範例少掉,行為就翻盤了。把 prompt 當 code 對待:進版本控制、做 diff、寫測試。

!!! warning "誤解檢查點"

    **「如果 model 會 hallucinate,我需要更大/更聰明的 model。」** 聽起來更接近真的的親戚說法:*「如果 compiler 有 bug,升級通常會解。」* Hallucination 幾乎不會因為 model 變大而痊癒。它幾乎一定是靠這幾招處理:(a) 更好的 retrieval,讓 model *在 context 裡真的有*那個事實、(b) 明確地指示它不確定的時候要說不知道、(c) 用 structured output 強迫它引用來源。把一個本來就在亂猜的 model 放大,只會得到更有自信的亂猜。

### 第四步 —— 把事實餵給 model:RAG(檢索增強生成)

新章節:[RAG 基礎](../06-building/rag.md)。Embedding、chunking、vector database、reranking,以及常見的失敗模式(切得爛、index 過時、同義詞沒命中)。最後會附一個你可以直接跑的 30 行 Python 範例。

用開發者的視角回頭重讀 [KV 快取](../03-llm-inference/kv-cache.md):被檢索到的 context 會在 decode 時被 model 吃進去,所以 context 變兩倍,大約就會讓伺服器為*你*這個 request 保留的 KV 快取記憶體也變兩倍。這也是為什麼託管型供應商對較長的 prompt 收費更高。

**帶走的重點:** RAG 是你把 model 沒有的知識塞給它的方式。它*不是* fine-tuning 的替代品,fine-tuning 也*不是*它的替代品 —— 它們修的是不同的問題(詳見下一步)。

!!! warning "誤解檢查點"

    **「我們直接把 model 用我們的資料 fine-tune 一下就好。」** 聽起來更接近真的的親戚說法:*「要客製一個系統,就修改它的原始碼。」* Fine-tuning 會改變 model 的*風格和行為*,但用來「加入事實」卻意外地糟糕 —— model 會把表面形式泛化過去,卻不會可靠地學到內容,而且要讓 fine-tune 過的 model 保持最新,就得不斷重新訓練。對於「我們的產品目錄 / 文件 / ticket」,RAG 幾乎永遠是對的答案。Fine-tuning 請留給格式與語氣。

### 第五步 —— 讓 model 動手:工具與 agent

新章節:[工具呼叫與 agent 迴圈](../06-building/tool-use-agents.md)。Function calling、驗證 tool 的參數、think-act-observe 迴圈、預算上限、什麼時候該停。同時說明「給 model 一個 Python」和「給 model 一組 API」為什麼是兩件不同的事。

**帶走的重點:** Agent 就是一個包在 LLM 外面的*迴圈*,不是什麼神奇的新能力。每一個 agent 的 bug,不是 prompt bug、就是 tool bug、就是少了一個停止條件。

!!! warning "誤解檢查點"

    **「Agent 會把整個工作流程自動化。」** 聽起來更接近真的的親戚說法:*「自動化就是取代人。」* 端到端的 agent 自動化,只在很狹窄、可逆、低風險的任務上行得通。其他所有場合,真正的收益來自*輔助式*的迴圈 —— agent 寫草稿,人類審核。這不是在看衰 model,而是在正視「錯誤率 2%、動作不可逆」時壞輸出的成本。

### 第六步 —— 用量,不要靠期望:evals

新章節:[真的有用的 evaluation](../06-building/evals.md)。Golden dataset、LLM-as-judge 及其注意事項、迴歸測試、用 open-source 工具做 trace、以及在 production 要 log 哪些東西,讓明天的你可以 debug 今天的你。

**帶走的重點:** 如果你沒有 eval,你就沒有產品 —— 你只有 demo。從 demo 走到 production 的過程,大部分就是在建 eval 基礎設施。

!!! warning "誤解檢查點"

    **「demo 跑得起來,我們就完成 90% 了。」** 聽起來更接近真的的親戚說法:*「程式編得過、快樂路徑也能通,大部分工作就已經做完了。」* 對傳統軟體來說,是的。對 LLM 功能來說,快樂路徑通常只是 10% 的工作。對抗性輸入、拒答行為、token 預算爆掉、成本爆炸、retrieved doc 裡的 prompt injection、以及 model 更新帶來的無聲品質倒退,這些全都是需要新測試的新失敗模式。最後那 30% 請預留比你平常多一點的預算。

### 第七步 —— 聰明地挑 model

交叉引用:PM 路徑裡的 [能力地圖](../07-strategy/capability-mapping.md)。就算你是開發者也請讀它 —— 知道哪一個 model 等級適合哪個任務(以及哪些 benchmark 真的能預測你的工作量),現在已經是一種開發者技能了。

### 第八步 —— 成本、延遲、roofline(簡短版)

如果還沒讀過,去讀 [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md)。那些數學你可以掃過去。要帶走的一句話是:*在 batch size 為 1 的推論,瓶頸是記憶體頻寬,不是運算。* 這也是為什麼 streaming 一個一個 token 吐,感覺起來不會比一次大 batch 慢;為什麼供應商是按 token 計價,而不是按 FLOP 計價;以及為什麼同一個 model 在同一批硬體上,會隨著伺服器把更多使用者合批而越來越便宜。

## 誤解總表

| 誤解 | 它從哪裡來 |
|---|---|
| Prompt 越長越好。 | 「更多 context 對搜尋有幫助。」在那裡對,在這裡不對。 |
| `temperature=0` 等於 deterministic。 | In-process 的 RNG *是* deterministic 的。託管的 LLM 不是。 |
| 更大的 model 會治好 hallucination。 | 軟體 bug 通常升級就解了。Hallucination 不會。 |
| 用 fine-tune 加事實進去。 | 「要客製就修原始碼」—— 是一個好直覺,只是它誤判了 fine-tune 改的是什麼。 |
| Agent 會把所有事情自動化。 | 傳統自動化是二元的。LLM 的輔助是一個光譜。 |
| demo 可以跑 = 90% 完成。 | 對典型軟體成立。LLM 產品會在新地方壞掉。 |
| model 出新版就要整個重建。 | Web framework 的直覺。LLM API 其實比你擔心的穩定。 |

## 檢查點

在你說這條路徑走完之前,以下每一題請用一分鐘、講出聲音來回答:

1. 使用者打了一段 500 字的訊息,得到 200 字的回覆。這大約是多少 token?是 prompt 那邊比較貴,還是回覆那邊比較貴?為什麼?
2. 你的聊天機器人在對話超過一小時之後變慢了。從*機制*上解釋為什麼,不要只說「context 太多」。
3. 一個新 model 發表了。描述你會怎麼決定要不要遷移。
4. 你需要回傳 JSON。列出三種方式,照偏好程度排序,並說明原因。
5. 你的 RAG 系統上週開始把錯的 chunk 撈回來。列出五個最可能的原因。

如果你答得出來,你就準備好出貨了。

下一條路徑:[ML 工程師 →](ml-engineer.md) · 回到[所有路徑](index.md)

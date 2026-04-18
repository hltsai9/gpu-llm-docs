# 能用的 Evaluation

一個沒有 eval 的 LLM 功能就是一個 demo。從 demo 到 production,最主要的工作,就是做 eval。

這一章在講怎麼把這件事做好 —— 不是去講你能裝的幾十種 benchmark 工具,而是那些反覆地把不可靠功能變可靠的做法。

## 為什麼傳統測試不夠

傳統軟體測試是對固定輸入檢查確定性結果。LLM 功能:

- 不是確定性的(即使 `temperature=0`,見 [API basics](api-basics.md))。
- 大多輸入沒有單一正確答案。
- 會隨著 model 更新而 drift。
- 失敗模式不是 exception(一個 hallucinate 的答案是安靜的)。

所以「寫 unit test」不直接搬過來。正確類比是**對一個行為會演化的 flaky 外部服務做 integration test** —— 加上比起典型後端團隊、更像搜尋團隊會用的**品質指標**。

## Eval 金字塔

在三個層級上建 eval。

### 1. Unit 風格:小、快、多

每個 PR 都能跑的小 test case:

- 確定性輸入 → 檢查輸出是不是符合 pattern、包含預期子字串、符合 schema。
- 結構化輸出 → 依 schema 驗證,抓格式回歸。
- Tool call → 檢查 model 有沒有挑對 tool、用對參數。
- 短 completion 任務 → 從少數預期答案中挑。

這些跑得快。它們能抓住 80% 的回歸。它們是你的安全網。

### 2. 黃金資料集

一組 50–200 個有代表性、有已知好答案的輸入。每次改 model 或 prompt 前跑。量:

- **準確度**(分類任務)。
- **答案品質**(人工打分或 LLM-as-judge,見下)。
- 每個 response 的**成本與 latency**。
- **變動率**與前一版比較。

資料集要持續更新。production 裡發現新的失敗 pattern,就加進去。

### 3. Production 取樣

真實流量抽樣(注意隱私)並評分。這能抓「你的黃金集」和「現實」之間的 drift —— 你沒想到的 edge case。品質指標偏掉就 alert。

## LLM-as-judge

對主觀輸出 —— summary、rewrite、Q&A —— 通常沒辦法用簡單的字串比對自動打分。實務上的妥協是用另一個 LLM 當 judge。

基本形狀:

```
You are evaluating an assistant's response. Grade from 1-5.

Criteria:
- Accurate (matches the facts in the source)
- Complete (covers all the main points)
- Clear (easy to read)

Source: {{ source }}
User question: {{ question }}
Assistant's answer: {{ answer }}

Return JSON: {"score": <1-5>, "reasoning": "<one sentence>"}
```

效果意外地好 —— 很多任務上,LLM judge 和人類判斷的相關性,已經可以和「人類之間彼此的一致性」相比。

**注意事項:**

- **位置偏誤。** 給「A vs B」時,model 會偏愛 A。順序隨機化。
- **冗長偏誤。** Model(包括 LLM judge)偏愛更長的答案。criteria 裡要控長度。
- **自我偏愛。** Model 可能對自己的輸出打高分。能的話用不同 model 當 judge。
- **rubric 含糊。** 標準模糊 → 分數吵。Judge prompt 要具體。

**穩健 judge 的 pattern:**

- Judge 用強 model(通常是前沿等級)。
- 能隨機化的全部隨機化。
- 驗證 judge 本身:人工 review 50 個 case,檢查 judge 的一致性。
- 把 judge 當成另一塊有版控的 prompt 基礎設施。

## 規則式檢查

能用規則取代 LLM 判斷就用:

- **格式合規:** 輸出是有效 JSON 嗎?符合 schema?
- **子字串需求:** 客服回應有提到 ticket ID 嗎?
- **禁用內容:** 輸出有沒有避掉列表上的詞(競爭對手名、髒話、內部代號)?
- **長度邊界:** 回應在 100 到 500 字之間嗎?
- **Citation 準確:** 所有 bracket citation 都真的在取回的 source 裡嗎?

規則快、確定性、免費。它們應該是 eval pipeline 的第一層;LLM-as-judge 處理規則處理不了的。

## 建黃金資料集

建一個好黃金集,就贏了一半戰役。

**怎麼起步:**

- **從真實流量。** 只要有一點用量,抽 100 個有代表性的 query。
- **從 bug 回報。** 每個 production 失敗都進黃金集。
- **從想像。** 腦力激盪 edge case:空輸入、超長輸入、多語、對抗性、諷刺。
- **從測試規格。** 結構化功能的 acceptance criteria *就是* eval 集。

**怎麼維護:**

- 有版本控。check 進 git。
- 有稽核。定期重審,確保「正確答案」沒 drift。
- 平衡。按比例涵蓋各種輸入類別。
- 標 metadata:類別、難度、來源。

## 跑 eval

最小 pipeline:

- **pre-commit / pre-deploy hook。** 跑 unit-level eval。回歸就讓 build 失敗。
- **夜間或每 PR 跑黃金集。** 跑完整 200-case 套件、對 baseline 比較、報 delta。
- **持續 production 取樣。** 抽一小比例真實流量來評分;指標變動就 alert。

把 eval 結果長期存下來,你就能回答:「我們換到 model 版本 X 時品質有變嗎?改 prompt 之後呢?」

## 該量什麼

每一個 LLM 功能,都要有這些數字:

- **品質。** 準確度、答案正確性、faithfulness。
- **安全。** 有害內容率、拒絕率(不該拒還是該拒)。
- **成本。** 每 request 的 token、每千次 query 的 dollar。
- **Latency。** P50、P95 TTFT;P50、P95 總時間。
- **可靠度。** 錯誤率、timeout 率、成功完成率。
- **RAG 用:** retrieval recall、對 source 的 faithfulness、citation 準確度。
- **Agent 用:** 任務成功率、平均步驟數、每成功任務的成本。

把這些發成一頁儀表板。

## Tracing 與 observability

多步驟流程(RAG、agent、多輪 chat)上,unit-level eval 不夠。你要能看到一個 request 的完整軌跡。

- **log 完整 trace:** prompt、取回的 docs、每次 tool call、每次 model response、最後輸出。
- **Trace 和 eval 分數連起來:** 品質掉的時候,你要的是 trace,不只是 input / output。
- **Open-source 選項:** Langfuse、Phoenix(Arize)、LangSmith、Helicone。大多 10 行就整合。
- **自架:** log 到你自己的 Postgres/Elastic,用最簡 schema。

## Red-team eval

最後一層:刻意對抗性的 case。

- **Prompt injection 嘗試。** 使用者能讓 bot 說出傷害性話、或洩 system prompt 嗎?
- **Jailbreak。** 使用者能繞過拒絕嗎?
- **資料洩漏。** RAG 系統下,租戶 A 的使用者能取到租戶 B 的資料嗎?
- **Tool 濫用。** Agent 能被操控去呼叫破壞性的 tool 嗎?

維護一個 red-team 集,會隨時間成長(新對抗 pattern 每個月都出)。部署前跑;量防禦率。

## 常見錯誤

- **評一次就出貨。** 品質會隨 model 更新 drift。持續跑回歸。
- **只測簡單 case。** 黃金集一定要有對抗性、長尾、多語。否則你的 eval 在騙人。
- **高風險 eval 用同一個 model 做生成和打分。** 自我偏愛會把分數膨脹。
- **什麼都用 LLM-as-judge。** 能用規則的地方就用規則。
- **沒 baseline。** 「品質變好了!」和什麼比?永遠要 baseline。
- **只量 accuracy。** Latency、成本、失敗模式也是 feature。

## 90 分鐘起步包

如果你的 LLM 功能現在沒有 eval,這是一份具體計畫:

- **0–15 分鐘。** 定義會在乎的 3 個品質面向(例如:準確、語氣、完整)。
- **15–45 分鐘。** 寫 50 個 test case,涵蓋 easy / medium / adversarial。
- **45–60 分鐘。** 跑過去、人工打分。這就是你的 baseline。
- **60–75 分鐘。** 寫一個 LLM-judge prompt,要和你人工打的分一致。
- **75–90 分鐘。** 把 eval 接進 CI。每改一次 prompt 就跑。

這 90 分鐘的工作,在第一次部署之內就會回本。

## 一句話總結

Eval 是讓 LLM 軟體變成真正軟體的那種紀律 —— 它們同時是 unit test、integration test、品質儀表板、和 red-team 練習,而建它們是從 demo 走到 production 絕大部分的工作。

回到[第六部分目錄](index.md)。

# Tool use 與 agent

Tool use —— 讓 model 呼叫你程式碼裡的函式 —— 是那個把 chatbot 變成應用的機制。加上一個 loop,就把應用變成 agent。兩者都比純文字生成強大,也都比大多團隊預料的更危險。

## Tool use:機制

一個「tool」是你向 model 宣告的一個函式:名字、描述、和它參數的 schema。當 model 決定這 tool 有用時,它不產出文字,而是產出一個結構化呼叫。

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"},
                "units": {"type": "string", "enum": ["C", "F"]},
            },
            "required": ["city"],
        },
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Taipei?"}],
)

# response.content 可能是:
# [{"type": "tool_use", "name": "get_weather", "input": {"city": "Taipei", "units": "C"}}]
```

然後你要:

1. 執行 tool(呼叫你真的天氣 API)。
2. 把結果以 `tool`(或 `tool_result`,看 provider)角色附加到訊息歷史。
3. 再呼叫一次 model。現在它有 tool 輸出,可以回答使用者。

<div class="analogy" markdown>
Tool use 是一種可靠的 handshake。沒有它,你問 model「天氣怎樣?」,它會亂編 —— 它腦袋裡沒有天氣 API。有 tool,model 會說「我不知道,但請用 `city=Taipei` 呼叫 weather tool」,你的程式呼叫真實 API,把結果交回去,model 呈現給使用者。
</div>

## 為什麼這和「parse 輸出再呼叫函式」不一樣

Tool use 在結構上的可靠度,是特設 parsing 做不到的:

- **Schema 會被強制。** Model 產不出型別不對的參數。
- **Model 知道什麼時候不該叫。** 問題不需要 tool 時,它就直接回答。
- **多個 tool 可以組合。** Model 挑對的那個(或都不挑)。
- **重試和驗證能好好運作。** 呼叫失敗時,你可以把 error 當 tool result 回傳,model 常常會自我修正。

「parse 回應再看有沒有提到函式」在 demo 會動、在 production 會壞。

## Tool 設計:大家會煮太生的那塊

Tool 是你 prompt 的一部分。名字和描述每次都會被 model 讀到。一個設計良好的 tool:

- **名字描述動作。** `get_weather`,不是 `weather_tool_v2`。
- **描述短而具體。** 「Get the current weather for a city. Use when the user asks about weather conditions or temperature.」
- **參數型別嚴格。** enum、字串 pattern、必填欄位。schema 越鬆,model 越要猜。
- **回傳結構化結果。** model 能 parse 的 JSON。可讀沒問題;機器可讀更好。
- **有預算。** rate limit、cost limit、輸出 size limit。

**不良 tool 設計:**

- 一個什麼限制都沒有的 `execute_sql` tool。model 會寫任意 query,而你沒防線。
- 一個回傳 10KB HTML 的 `search_web` tool。model 的 context 瞬間就滿。
- 描述重疊的 tool(`get_user_info` 和 `fetch_user_data`)。Model 會挑得不一致。

## Agent 迴圈

**Agent** 是一個程式,讓 model 呼叫 tool、觀察結果、再叫更多 tool,直到它決定完成為止。

最簡迴圈:

```python
messages = [{"role": "user", "content": user_query}]
for step in range(MAX_STEPS):
    response = client.messages.create(model=MODEL, tools=tools, messages=messages)

    # Model 回了文字 → 完成
    if response.stop_reason == "end_turn":
        return response.content

    # Model 呼叫了 tool → 執行、附加結果、繼續
    for block in response.content:
        if block.type == "tool_use":
            result = run_tool(block.name, block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            }]})

raise RuntimeError("Agent didn't complete within MAX_STEPS")
```

就這樣。大多「agent 框架」就是這個 loop 再加些裝飾 —— memory 層、多 agent routing、planning 階段。那些都值得考慮,但原語是很小的。

## 會出什麼事

### 無窮迴圈

Model 一直呼叫沒進展的 tool。防禦:

- **`MAX_STEPS` 上限。** 絕對的。Production 通常 10–20。
- **Step 預算。** 追 token 或成本;到門檻就中止。
- **進度偵測。** 最近 3 次 tool 呼叫一樣就中止。
- **遞減預算 prompt。** 第 5 步時告訴 model「你剩 3 次 tool 呼叫 —— 聚焦。」

### Tool 失敗

Tool 回 error。只要你做到以下,model 通常能優雅處理:

- *把 error 當 tool result* 回傳,不要當例外丟。
- 包含原始 error 訊息(別藏)。
- Tool 被 rate limit 的話,跟 model 講 —— 它會退讓。

### 幻想的 tool 呼叫

Model 呼叫不存在的 tool、或參數不符合 schema。現代 model 少見,但要抓:

- 把 tool name 和你的清單比對;未知就回 error。
- 讓 provider 的 schema 驗證把壞參數擋掉。
- 反覆失敗時,插一則修正訊息,再試一次。

### 透過 tool result 的 prompt injection

如果一個 tool 回傳受使用者影響的內容(抓到的網頁、文件、email),那內容裡可能有 model 會跟的指令。

**緩解原則:**

- **把 tool 輸出當不可信。** 不讓它改變 model 的目標。
- **Sandbox tool。** 一個 `send_email` tool 應該限制白名單網域或需要使用者核准。不是「給你 SMTP,想幹嘛幹嘛」。
- **把能力型 tool 和資訊型 tool 分開。** 讀資訊(web fetch、doc search)vs. 採取行動(寄信、付款)。牽涉行動時,agent loop 要更保守。
- **重大行動要 human-in-the-loop。** 永遠。

### 成本爆炸

一個沒預算上限的 agent 可以很快燒掉真的錢。上限:

- **per-agent token 預算。** 硬上限。
- **per-tool-call 上限。** 一次 web search 回 100KB 通常是誤用。
- **下游成本上限。** Agent 用付費 API(地圖、搜尋、天氣),每使用者 rate limit。

你不會想變成的那個恐怖故事:一個 agent 在 loop 裡呼叫付費 API 10,000 次,一夜之間產出一張五位數發票。

## Agent pattern

除了基本 loop,還有幾個 pattern 值得知道:

### ReAct(Reason + Act)

經典 pattern:model 在「思考」文字和 tool 呼叫之間交替。對探索型任務特別好用。大多現代 agent 框架 default 就是這個。

### Plan-then-execute

先讓 model 產出一個 plan(子任務清單),再依序執行。比較好稽核,複雜任務上通常更可靠。

### 多 agent

多個專門 agent(planner、researcher、critic),由 coordinator 協調。有時對很複雜的 workflow 有幫助;常常是過頭。

### Router

一開始的 model 呼叫把 query 分類,再路由到特化的 agent 或 workflow。輸入類別很雜(support、sales、billing 等)時適合。

## Agent vs. workflow

不是看起來「很 agentic」的東西就該是 agent。**Workflow** 是固定的步驟序列;**agent** 是會自己決定下一步做什麼的 loop。

Workflow 便宜、更可靠、更容易推理。適合的情況:

- 步驟事先就知道。
- 錯誤模式有邊界。
- 任務不會有意義地分支。

Agent 有意義的情況:

- 路徑取決於中間結果。
- 新 query 需要 tool 的新組合。
- 彈性抵得過不可預測性。

大多團隊從「我們需要 agent」開始,最後發現「其實是一個設計良好的 workflow,只有最複雜那一步用 LLM 呼叫」。

## Evaluation

Agent 的 eval 比單輪 eval 難,因為路徑多。重點:

- **端到端任務成功。** Agent 有沒有達成使用者的目標?(二元就行;「大部分」不行。)
- **步驟數。** 訓練良好的 agent 是有效率的。看會不會回歸成「本來 3 步,現在要 15 步」。
- **Tool 使用正確性。** 有用對 tool 嗎?參數對嗎?
- **每任務成本。** 成功完成一次的 dollar 和 token。
- **尾端行為。** 人工抽樣失敗任務,找失敗 pattern。

見 [eval](evals.md)。

## 常見錯誤

- **Tool 沒限制。** 尤其是 SQL、shell、code execution。全部要收緊範圍。
- **沒有 step 上限。** 你的第一個脫韁 loop 會教你。
- **信任 tool 輸出。** Retrieve 的文字、抓到的頁面、檔案內容 —— 都可能受使用者影響。
- **Tool 太多。** 15 個 tool 會讓 model 混淆。從 3–5 開始;需要才長。
- **忘記把 tool 結果放進下一則訊息。** Model 會幻想剛才發生了什麼。
- **Agentic 氾濫。** 「這該是 agent 嗎?」通常答案是「不,要 workflow」。

## 一句話總結

Tool use 是結構化的函式呼叫;agent 是把 tool use 放在 loop 裡 —— 兩者都強,也都有可預期的失敗模式(injection、loop、成本爆炸),兩者在任何有後果的行動上都需要明確預算、sandbox tool、和人類監督。

下一章:[能用的 evaluation →](evals.md)

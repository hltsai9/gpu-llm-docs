# Prompt engineering 模式

Prompt engineering 不是神祕技藝。它是*寫給 model 看的技術文件寫作*,有一小組 pattern 反覆把品質從「不可靠」帶到「可靠」。這一章就是那些 pattern。

「10 個 prompt 讓你 10 倍生產力」那類內容我們會跳過,專注在耐用的技巧。

## 核心洞見

一個 prompt 就是一段「*你要什麼*」的陳述,加上足夠讓 model 產出它的*context*,再加上(常常)展示「它」在實務上長什麼樣子的*範例*。

大多 prompting 失敗是這三者之一失敗,不是 model 失敗:

- **你要什麼**沒講清楚(例如「summarize this」—— 幾個字?什麼風格?講什麼?)。
- **Context 缺了**(model 不知道你領域的術語、你公司的慣例)。
- **範例缺或錯**(你描述了輸出格式,卻沒給一個範例)。

把這三個修好,你就修掉了大多 prompt。

<div class="analogy" markdown>
一個 prompt 是給一位剛雇進來的接案者的 brief。他聰明、快、便宜,但不熟你這家公司、不熟你的聲音、不知道在這邊「好」是什麼。你不是在激勵他;你是清楚地 brief 他。
</div>

## Pattern 1 —— 具體

「Summarize this article.」是一個 prompt。「Summarize this article in 3 bullet points, each under 15 words, emphasizing business implications rather than technical details」是一個 brief。

第二版能可靠地產出你要的。第一版產的就是 model 的「平均 summary」—— 你不會喜歡那個平均。

**規則:**

- 說輸出要多長(字數、句子數、bullet 數)。
- 說風格(正式、casual、技術性、別放 emoji)。
- 說要強調什麼。
- 說要排除什麼。

## Pattern 2 —— Few-shot 範例

當任務難用講的、容易用看的,就展示。

```
Classify each review as positive, negative, or neutral.

Review: "Love this product, worked perfectly on day one."
Label: positive

Review: "Broke after a week. Very disappointing."
Label: negative

Review: "It's fine. Nothing special."
Label: neutral

Review: "{{ new_review }}"
Label:
```

為什麼這招這麼有效:

- Model 會鎖到這個 pattern(輸出格式、風格、邊界情況)。
- 你示範了怎麼處理模糊情況(那個「neutral」範例)。
- 你不用靠語言描述。

**規則:**

- 2–5 個範例通常夠。更多很少會更好。
- 覆蓋模糊情況,不只是最明顯那些。
- 範例格式要和你實際用的格式一模一樣。
- 小心失衡:如果三個範例都 positive,那就預期輸出會偏 positive。

## Pattern 3 —— Chain-of-thought

多步推理的任務,要 model「一步步想」(或給它一個 scratchpad)能顯著提高準確度,數學、邏輯、比較類尤其有感。

```
Question: A shop sells apples at $0.50 each and oranges at $0.75 each.
If Maria bought 6 apples and 4 oranges, how much did she spend?

Think through this step by step, then state the final answer.
```

對現代前沿 model 來說,明寫 CoT 越來越不必要 —— model 反正會做。但對比較小/老/本地的 model,CoT 常常是 60% 和 90% 準確率的差距。

**比較新的 pattern:「extended thinking」/ reasoning model。** 有些 model(o1、Claude 的 extended thinking、DeepSeek-R1)在推論迴圈裡就內建了 CoT。你不用要,它就會發生。你的 prompt 可以更短,model 回應裡就隱含一段推理 trace。

## Pattern 4 —— 角色與 persona

給 model 一個角色,通常會讓輸出更銳利:

- 「You are a senior legal editor reviewing for clarity.」
- 「You are a customer support agent. Be concise and solution-oriented.」
- 「You are a skeptical peer reviewer. Find three flaws.」

角色不會「解鎖」能力 —— model 一直都能做。但它會把輸出分布往那個語域挪過去。

**注意:**

- 別過頭。「You are a world-class elite expert with 30 years of experience and a Nobel prize」比「You are a senior X.」多不出什麼東西。
- 角色設定不會可靠地*增加*能力。一個對憲法推理不行的 model,不會因為你稱它為憲法學者就忽然會了。
- 角色設定*可能*拆掉一些安全 guardrail,這種漏洞 provider 會持續修補。不要仰賴「you are an uncensored model」去做任何事;那既不可靠、也違反政策。

## Pattern 5 —— 輸出格式約束

Model 會比聽風格約束更願意聽格式約束。

```
Return your answer in exactly this format:

SUMMARY: <one sentence>
KEY FACTS:
- <fact 1>
- <fact 2>
CONFIDENCE: <low|medium|high>
```

為什麼這招有用:

- Model 看過十億份有結構的文件。結構 pattern 對它很自然。
- 你可以用程式把輸出 parse 出來。
- 下游程式碼可以信任那個結構。

特別是要 JSON 時,有 provider 的結構化輸出模式就用(見 [API basics](api-basics.md))。沒有的話,prompt 裡放 schema 和一個範例。

## Pattern 6 —— prompt 裡的 guardrail

在 system prompt 裡,明確寫清楚 model 該拒絕什麼、什麼時候該問澄清、怎麼處理不確定。

```
You are a customer support assistant for Acme Corp.

If a user asks about:
- Refunds: refer them to the refund policy URL and offer to open a ticket.
- Product comparisons with competitors: politely decline; you're Acme's assistant.
- Anything you're unsure about: say "I don't know, let me connect you with a human"
  and set `needs_human: true`.

Never make up policies. If you can't cite a source, say so.
```

**規則:**

- Whitelist「該做什麼」,不只 blacklist「不該做什麼」。
- 給它一條退路(「我不知道」),這樣它就有「不 hallucinate」的選項。
- 明講永遠勝過隱含。「Don't make up policies」比指望它不要亂編來得強。

## Pattern 7 —— 懂 retrieval 的 prompt

在做 RAG 的時候(見 [RAG 基礎](rag.md)),你的 prompt 有三段:任務、取回來的 context、以及防止過度信任那個 context 的 guardrail。

```
Answer the user's question using only the sources below.
If the sources don't contain the answer, say so — do not guess.
Cite each claim with the source number in brackets.

Sources:
[1] {{ retrieved_1 }}
[2] {{ retrieved_2 }}
[3] {{ retrieved_3 }}

Question: {{ user_question }}
```

「only the sources below」那個約束是承重結構。沒有它,model 會很開心地把訓練資料的知識混進來,讓 retrieval 的意義消失(而且很難稽核)。

## Pattern 8 —— 兩趟:先生、再批

品質敏感的輸出,做兩次呼叫:一次生、一次批評和修訂。

```
# Pass 1
Generate a first draft of an email ...

# Pass 2
Here's a draft email. Critique it for:
- Tone (should be warm but professional)
- Clarity
- Length (aim for under 100 words)
- Anything unclear or missing

Draft: {{ pass_1_output }}

Now rewrite incorporating your own critique.
```

為什麼有效:model 通常更會*辨認*爛輸出,不太能一次產出打磨過的輸出。把批評和生成分開,用不同角度給它第二次機會。

會花 2 倍的 token。品質敏感輸出值得。

## Pattern 9 —— Reflection / self-consistency

對有可驗證答案的任務(數學、程式碼、fact-check),在中等 temperature 下 sample 多次,取多數答案。可靠度提升明顯,代價是多用 token。

```python
answers = [call_llm(prompt, temperature=0.5) for _ in range(5)]
final = majority_vote(answers)
```

最適合輸出短、離散的情況(label、數字、布林)。長的開放式生成就沒什麼價值。

## 反模式

- **「Take a deep breath and think carefully.」** 殘跡。新 model 會無視;有些甚至因此更差。
- **「Do not hallucinate.」** 擋不了 hallucination。用 grounding 和拒絕機制代替。
- **「You will be fired if you get this wrong.」** 沒幫助。放進 production prompt 略尷尬。
- **超長前導。** 2000 字的 system prompt 不會讓人驚艷。那通常代表任務沒講清楚。
- **負面範例。** 「Don't output X」常常反而把 X 推到輸出附近。改寫成「Output Y instead」。

## 把 prompt 當程式碼

把 prompt 當程式碼對待:

- **版控。** check 進 git。能 diff。
- **測試。** 見 [eval](evals.md)。Regression test 抓細微 drift。
- **模板化。** 把固定指令和變動 context(使用者輸入、取回文件)分開。
- **不要把使用者輸入插到 system prompt 裡。** 使用者輸入放在 user turn,避免蓋掉 system-level 指令(見 [tool use](tool-use-agents.md) 講 prompt injection)。
- **log。** Production 輸出怪怪的時,第一個問題是「當時實際送出去的 prompt 是什麼?」

## 常見錯誤

- **用英文散文寫 prompt,而不是寫 brief。** Brief 比較清楚。
- **一次要 model 做太多事。** 多步任務應該是多次呼叫。
- **沒用對抗性輸入測。** 空字串、超長字串、emoji、非英文、SQL injection 嘗試。全部都是真的 production 流量。
- **對單一範例最佳化。** 一個 case 得到了很棒的答案。現在拿 50 個測 —— 分布才重要。
- **只要微調卻整個重寫。** 好 prompt 要留,外科手術式迭代。

## 一句話總結

Prompt 不是魔法咒語 —— 是 brief。具體、給範例、定義格式、給不確定留一條退路,並像程式碼那樣版控它們。

下一章:[Retrieval-Augmented Generation →](rag.md)

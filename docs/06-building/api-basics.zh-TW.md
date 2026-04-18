# 給開發者的 API basics

你一個下午就能把一個 LLM 功能出貨。你也可能花兩週在 debug 一個 —— 如果你不知道哪些細節重要。這一章是一個實務開發者需要的最小集合:參數是什麼意思、怎麼處理失敗、怎麼想成本和 latency。

我們會用「messages」API 形狀(OpenAI、Anthropic、Google、open-source 相容 server),因為它已經變成事實標準。

## Request

一個典型的呼叫形狀很小:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1000,
    temperature=0.7,
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "What is the capital of France?"},
    ],
)
```

六個旋鈕,每一個都做特定的事。要懂。

### `model`

字串識別。不同 model 在能力、context 長度、速度、價格上各有差別。default 會變 —— production 一定要 pin 具體的 model 版本。

### `max_tokens`

*回應*長度的上限。不是對話長度。不是輸入長度。你根據「model 最多可以回多少」來設。

地雷:

- **設太低會被截斷。** 回應會在句子中間停下來。
- **設太高沒關係。** 用不到的 token 不會收費;收的是 model 實際產出的那些。
- **某些 provider 算法不一樣。** `max_tokens` 在某些 API 上只算輸出;在別的上面是包含輸入的總預算。

### `temperature`

控制 sampling 多「有創意」。Temperature 0(或接近 0)會讓 model 每次都挑機率最高的下一個 token。更高的 temperature(0.7–1.0)產出更多樣的輸出。

- **0.0:** 接近確定性(見下面的誤解)。
- **0.3–0.5:** 分析任務、程式碼、結構化輸出常用。
- **0.7:** 大多 chat 用法的 default。
- **1.0+:** 用於創意寫作、腦力激盪。

!!! warning "Temperature 0 不是確定性的"
    託管的 LLM 是跨多張 GPU replica 在 serve,kernel 有非確定性、數值會依 batch 而變,model 也會定期更新。「Temperature=0」能可靠產出低變異的輸出,**不是**跨呼叫 byte 相同的輸出。你的 eval 要容忍表面差異;你的測試不要去比對完全一樣的字串。

### `top_p` 和 `top_k`

額外的 sampling 旋鈕。`top_p=0.9` 只保留累積機率到 90% 那些 token(nucleus sampling);`top_k=40` 保留前 40 個 token。兩個都在限制 sampler 有多怪。

**實務上:** 沒有具體理由就留 default。Temperature 涵蓋你 95% 的需求。

### `system`

放在對話最上面的指令。比 user 訊息優先(但不是絕對不會被突破 —— 見 [tool use 與 agent](tool-use-agents.md) 談 prompt injection 還是怎麼漏過去)。

**原則:**

- 一組一致的指令集。不要寫成購物清單。
- 輸出格式寫在這邊,不要每一個 user turn 重寫。
- 如果行為很細,附上範例。
- 不要把 secret 放在 system prompt 裡。使用者*一定*會把它們抽出來。

### `messages`

交替的 `user` 和 `assistant` turn。Model 會把它當成對話歷史 —— 包括你放在那邊的任何 assistant turn。那也是 few-shot prompting 背後的機制:你偽造了前面的交換。

```python
messages=[
    {"role": "user", "content": "Classify: 'I love this.'"},
    {"role": "assistant", "content": "positive"},
    {"role": "user", "content": "Classify: 'Terrible service.'"},
    {"role": "assistant", "content": "negative"},
    {"role": "user", "content": "Classify: 'It was fine.'"},
]
```

最後那一個 user turn 才是你真正要回答的那題。

## Streaming

只要是面向使用者的,就 stream。大多數 API 支援 server-sent event:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1000,
    messages=[...],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

為什麼 streaming 重要:

- **感知 latency。** 2 秒 TTFT 加 streaming 感覺比 4 秒整段回應快,即使總時間更長。
- **使用者可以中斷。** Model 開始歪掉時,使用者可以停下不看(你也可以關掉連線省錢)。
- **把 TTFT 和 TPOT 暴露成獨立 metric。** 理由見 [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md)。

不要 stream 的時機:

- 回應要當成一塊來 parse 和呈現(你要 `JSON.parse` 的 JSON)。
- 非互動情境(背景工作、批次 pipeline)。

## Token:一切的單位

你會按 token 被計費。你的 latency 會隨 token scale。你的 context 上限是 token 數。學著估。

**大原則:**

- **英文散文:** ~1.3 token 一字。
- **程式碼:** ~1.5 token 一字,語法重的語言更多。
- **JSON:** 變動;大約算 ~2 token 一字。
- **非拉丁文字(中、日、阿):** 常常一個字就 2–4 token。
- **URL、識別字、隨機字串:** 一個可以吃很多 token。

要精準,用 model 自己的 tokenizer(OpenAI 用 `tiktoken`、Claude 用 `anthropic.count_tokens()`、open model 用 Hugging Face `AutoTokenizer`)。永遠不要相信單字數。

## 成本和 latency:怎麼估

兩條公式涵蓋大多數實際估算。

**每次 request 的成本:**

$$
C = p_\text{in} \cdot n_\text{in} + p_\text{out} \cdot n_\text{out}
$$

輸入和輸出的定價不同(輸出通常是輸入的 3–5 倍,因為 decode 每 token 更貴 —— 見 [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md))。一個中階 model、5000 token prompt 加 500 token 回應,可能分別 $0.005 和 $0.015。

**每次 request 的 latency:**

$$
L \approx L_\text{prefill} + n_\text{out} \cdot L_\text{decode}
$$

其中 $L_\text{prefill}$ 大致和 $n_\text{in}$ 成比例(但有一個不小的 baseline),$L_\text{decode}$ 依 model 約 30–100ms 一 token。500 token 輸出在 $0.1s/\text{token}$ 下大約要 15–50 秒。

對功能規格,兩個數字你都要在承諾之前先有。

## 錯誤處理

實際會看到的錯誤:

- **Rate limit(429)。** 指數退避。遵守 `retry-after` header。
- **Context 長度超過。** 送之前主動 token-count 輸入來偵測。
- **Server error(500、503)。** 退避重試。
- **Content filter / 拒絕。** 在協議層不是錯誤 —— model 就是不回。要在應用層處理。
- **截斷(`stop_reason = "length"`)。** Model 在中途撞到 `max_tokens`。通常代表要調高上限或把任務拆開。
- **網路 timeout。** 設合理的 client 端 timeout(streaming 60s,非 streaming 更短)。

一個最簡的 production wrapper:

```python
def call_llm(messages, **kwargs):
    for attempt in range(3):
        try:
            return client.messages.create(
                model=MODEL,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", 1000),
                **kwargs,
            )
        except RateLimitError as e:
            wait = getattr(e, "retry_after", 2 ** attempt)
            time.sleep(wait)
        except (APIConnectionError, APITimeoutError):
            time.sleep(2 ** attempt)
        except APIError as e:
            if 500 <= e.status_code < 600:
                time.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError("LLM call failed after retries")
```

## 結構化輸出

要 JSON 回來時,三個選項,依偏好順序:

1. **原生 structured output**(OpenAI 的 JSON mode、Anthropic 的 JSON schema、Gemini 的 schema)。provider 幫你強制 validity。
2. **Schema 寫進 prompt + parse 失敗就重試。** 「回一個符合這個 schema 的 JSON:{…}。」通常會動,有時不會。要有重試方案。
3. **Function calling / tool use**(見 [tool use 與 agent](tool-use-agents.md))。Structured output 包裝成 tool schema。可靠度和 #1 差不多。

結構化輸出不動時,錯幾乎一定是(a)schema 太複雜、(b)prompt 裡的範例和 schema 不一致、或(c)這個 temperature 下 model 真的產不出來。把 schema 簡化;加 few-shot 範例;降 temperature。

## 冪等性(idempotency)和重試

LLM 呼叫不便宜。隨便重試失敗的呼叫可以燒光你的預算。兩個 pattern:

- **用 request hash 做 cache。** 同一組 `messages + parameters` 剛問過,不要再問一次。
- **Idempotency key。** 有些 provider 支援;有的話就用。

面向使用者的呼叫,自動重試不要超過 2–3 次,錯誤如果暗示「呼叫本身有問題」(content policy、schema error)就不要重試。

## 多 provider

production 上大多數認真的團隊會有 fallback。Pattern:

```python
providers = [anthropic_client, openai_client, google_client]
for provider in providers:
    try:
        return provider.call(messages, ...)
    except (RateLimitError, ServerError):
        continue
raise RuntimeError("All providers failed")
```

需要知道的 provider 差異:

- **Message 形狀相似但不一樣。** 需要一層小 adapter。
- **Tokenizer 不一樣。** 同一段文字在不同 provider 的 token 數會不同。
- **Context 長度不一樣。** Claude 200k、GPT 128k、Gemini 1M。
- **Rate limit 不一樣。** 在一家被 rate-limit 的使用者,在另一家不會。
- **行為會微妙地不同。** 同 prompt、不同輸出風格。換之前要測。

## 常見錯誤

- **Prompt 不做版控。** 它們是程式碼。check-in。
- **信任 `temperature=0` 的確定性。** 並不是。
- **假設 1 token = 1 字。** 你會把預算估算低估 30–200%。
- **對不該重試的錯誤重試。** Content-policy 拒絕不會因為重試而消失。Schema 違反不會自己修。
- **互動功能沒做 streaming。** 使用者討厭 4 秒 wall-clock;10 秒 streamed 卻可以接受。
- **log 太多。** Prompt 和 completion 常常有 PII。要規劃保留和存取。

## Debug checklist

LLM 功能出問題時,依順序走:

1. **把精確的 request log 下來。** 完整的 `messages`、完整的 `system`、參數。在你的 app 外面重現那個呼叫。
2. **檢查 token 數。** prompt 有沒有被截?回應有沒有撞到 `max_tokens`?
3. **用 `temperature=0.3` 和更低的 temperature 測。** 是 sampling 變異還是系統性 bug?
4. **換更強的 model 試試。** 如果行為消失,你的 prompt 有歧義;把它調緊。
5. **簡化。** 把 prompt 剝到能重現 bug 的最小版,再一塊塊加回去。
6. **和同級 model 比較**(另一家 provider)。兩邊都壞,是你的 prompt;只有一邊壞,是 model 特定的怪癖。

大多數「LLM bug」其實是偽裝成 bug 的 prompt bug。

## 一句話總結

把 API 當成按 token 計費的下一個 token 生成器,每一個 request 都圍繞這個單位設計,為非確定性和偶發失敗做規劃 —— 而當輸出不是你要的時,先修 prompt,再怪 model。

下一章:[Prompt engineering 模式 →](prompt-engineering.md)

# LLM 產品的經濟學

大多數「一個 LLM 產品要花多少錢」的問題,正確答案是「看情況」。這一章在把「看情況」拆成你真的能用的數字。

## 三大成本類別

任何 LLM 產品的成本來自:

1. **推論。** 託管 API 的美金,或自架基礎設施。
2. **工程。** 打造、維護、演進這個功能的工。
3. **Ops。** Eval、監控、red-teaming、安全 review。

公開文章傾向聚焦 #1,因為好量化。實務上,在功能的前 12–18 個月,#2 和 #3 常常主宰總擁有成本。

## 每請求成本,拆解

託管 API 下,單一 request 的成本是:

$$
C = p_\text{in} \cdot n_\text{in} + p_\text{out} \cdot n_\text{out}
$$

其中 $p_\text{in}$ 和 $p_\text{out}$ 是每 token 的價格(通常是每百萬 token 多少美金),$n_\text{in}$ 和 $n_\text{out}$ 是輸入和輸出的 token 數。

**典型比例:** 輸出價格是輸入的 3–5 倍。因為輸出是 decode mode 生成的,那是記憶體頻寬受限的(見 [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md))—— 每個輸出 token 都要 server 讀一次完整權重矩陣。

**關鍵估算技能:** 任何功能 spec 都要估 $n_\text{in}$ 和 $n_\text{out}$(token 怎麼估見 [API basics](../06-building/api-basics.md))。乘上價格。你就有 per-request 成本了。

### 範例:客服 chatbot

- System prompt:500 token。
- 使用者問題:100 token。
- 取回的 context(5 個 chunk × 400 token):2000 token。
- Model 回應:200 token。

輸入合計:2600 token。輸出:200 token。

中階價 $3/M 輸入、$15/M 輸出:

$$
C = 3 \cdot \frac{2600}{10^6} + 15 \cdot \frac{200}{10^6} = 0.0078 + 0.003 = \$0.011
$$

每 request 大約一美分。每月 100,000 個 request 就是 $1,100/月的 API 費。

### 範例:agentic 任務

Agent 把成本乘上去,因為每個任務做很多次呼叫。

- 5 步 tool-use × 每次 3000 token in + 200 out = 總共 15,000 輸入、1000 輸出。

$$
C = 3 \cdot \frac{15000}{10^6} + 15 \cdot \frac{1000}{10^6} = 0.045 + 0.015 = \$0.06
$$

每任務六美分。每月 100,000 個任務就是 $6,000/月。不算大 —— 但一個本該 5 步、卻 loop 20 步的壞 agent,是這個的 4 倍。

### 範例:code assistant

Code assistant 輸入高(使用者整份檔案當 context)、輸出中等。

- 輸入:8000 token(檔案 + 歷史)。
- 輸出:300 token。

$$
C = 3 \cdot \frac{8000}{10^6} + 15 \cdot \frac{300}{10^6} = 0.024 + 0.0045 = \$0.029
$$

每 request 三美分。每位使用者每天 10 個 request × 1000 DAU × 30 天 = 每月 300k 個 request:$8,700/月。

## 定價模式的考量

三種常見 pattern:

**Per-seat 訂閱。** 營收可預期;變動成本你吸收。使用量相對均勻時適合。用軟性上限防止重度使用者。

**用量計費。** 使用者按 token 或 request 付費(常常把成本直接轉嫁 + 加成)。營收隨使用量 scale。開發者導向產品適合。可能讓終端使用者困惑。

**混合。** 固定訂閱 + 超量部分用量計費。企業銷售最常見。

不管挑哪個,per-request 成本數字要準備好。不然你會靠感覺定價,然後發現自己在重度使用者身上虧錢。

## 自架 vs. API

永恆的問題。正確答案取決於三個數字:

1. **持續流量**(每日 token 數)。
2. **Model 大小需求**(你要的品質是多少)。
3. **組織能力**(你能不能營運一座 GPU fleet)。

### 交叉點數學

單張 H100 以有合理 batching 的 70B 級 model 而言,每天大約能穩定服務 **5–10M token**。粗估全包成本:**~$3–6 每 GPU-hour**(on-demand)或 **~$2 每 GPU-hour**(committed/reserved)。

每日成本:每張 GPU $50–150。

每百萬 token:$5–30,視使用率與承諾。

比較一下:託管 API 以 $3 輸入 / $15 輸出計,混合 workload 大約 $10/M token。

**交叉點:** 大 model 上大約 **每日持續 10M+ token** 時,自架在成本上變有競爭力 —— *如果*你跑得接近滿載。低於此,託管通常勝出。

<div class="numbers" markdown>
<div class="cell"><div class="n">~$3-6/hr</div><div class="l">大雲上的 on-demand H100 租金</div></div>
<div class="cell"><div class="n">~5-10M</div><div class="l">一張調好的 H100、70B model 每日 token 數</div></div>
<div class="cell"><div class="n">~30-60%</div><div class="l">互動式 workload 典型 duty cycle</div></div>
<div class="cell"><div class="n">~10M/日</div><div class="l">純 $/token 上自架打贏 API 的粗略交叉點</div></div>
</div>

### 自架的隱藏成本

純 $/token 不是全部。自架還加上:

- **冗餘。** 你要尖峰 + 容錯的 headroom。GPU 數加 30–50%。
- **Ops 工程。** 至少一人,可能更多,在 fleet 上 on-call。fully-loaded ~$200-400k/年。
- **維持品質對等的開發時間。** API 功能(function calling、structured output、最新 model)跟著平台出貨;你要重新實作或落後。
- **Model 更新。** 有更好的 open-source model 出現時,得有人 benchmark、驗證、roll out。
- **合規與 observability。** 系統是你在操,你就擁有它的事故。

把這些算進去,有效交叉點會更高 —— 常常是 **每日 20–50M token** 自架才真的便宜。

### 什麼時候還是要自架

非成本理由:

- **資料居留 / air-gapped 需求。** 你的資料不能離開你的基礎設施。自架是強制的。
- **Latency。** 你需要在「太大、沒有 edge API 能跑」的 model 上達到 sub-100ms TTFT。
- **Fine-tune / 自訂 model。** 你訓了專屬的東西;你自己 host。
- **特定 model 沒 API。** 沒有託管 endpoint 的 open-source model。
- **穩定流量下的長期承諾。** 需求已知、3 年時程,持有勝出。

**什麼時候*不*要自架:**

- 爆衝、不可預測的流量。
- 小團隊、沒 MLOps 人力。
- 還在實驗 —— 你還不知道需要什麼 model、什麼規模。
- 「資料隱私」拿來當口號用。主要 API provider 都有 zero-retention 企業方案,能滿足大多隱私需求。

## 自建 vs. 買 vs. fine-tune

相關決策:你該做自訂 model、租一個前沿 model、還是 fine-tune 一個中等選項?

| 選項 | 勝出時機 | 失敗時機 |
|---|---|---|
| **用前沿 API** | 大多產品的 default。最高品質、最少 ops。 | 規模下成本敏感;資料居留問題。 |
| **用較小的託管 model** | Latency 或成本壓力;任務夠窄,不需要前沿。 | 任務需要前沿等級的推理。 |
| **Fine-tune 一個 open-source base** | 風格與格式客製;窄領域任務;規模能回本基礎建設。 | 你原本指望 fine-tune 能加事實(並不會可靠地加)。 |
| **從零訓練** | 你是研究實驗室、或你有很具體的護城河。 | 你不是那種。 |

對 95% 的產品團隊,答案是「前沿 API,或前沿 API + RAG,或前沿 API + 窄域 fine-tune」。從零訓練對產品團隊幾乎從來不是對的答案。

## 把 cache 當成本槓桿

三種 cache 能省真的錢:

- **精確比對 cache。** 同 request → 同 response,不呼叫 LLM。可重複的東西都能用。
- **語意 cache。** 相似 request → 同 response,基於 embedding 相似度。能抓到換句話說;有品質風險(命中錯的 cache 看起來跟回歸一模一樣)。
- **Prompt cache**(provider 原生)。近期 provider 對重複的 prompt prefix 收費較低。prompt 共用一長段 system prompt 的話,這是大收益。

RAG 應用,system prompt 穩定的話,provider 的 prompt cache 可以砍 30–50% 輸入成本。幾乎沒成本就能開;低估用。

## 毛利數學

任何面對付費使用者的 LLM 功能:

- **每使用者成本** = per-request 成本 × 每使用者每月 request 數。
- **每使用者營收** = 價格 × attach rate(用量計費)或訂閱價(固定)。
- **每使用者 margin** = 營收 − 成本 − 攤提工程。

有任何顯著使用者段落的 margin 是負的,你就有成本問題。槓桿:

- 那個段落改用較小的 model。
- Cache。
- Prompt 壓縮(system prompt 寫短、retrieval 收緊)。
- Rate limit(把重度使用者轉成明確 overage 收費)。
- 重新想那個功能的定位。

## 常見錯誤

- **用字數估成本。** 會差 30–200%。用 token counter。
- **忽略輸出成本。** 輸出 token 是輸入的 3–5 倍;話多的功能很貴。
- **在錯量級下為了省錢自架。** 在交叉點以下,越自架越虧。
- **為了「隱私」自架但沒有監管理由。** 企業 API 方案通常就夠。
- **還沒算 per-request 成本就開始定價。** 會在上線後引發定價大火。
- **沒用 prompt cache。** 白白放掉 30–50% 輸入成本節省。
- **忽略 prompt 壓縮。** System prompt 長度砍 50%,對大多使用者就是輸入成本砍 50%。

## 可用的單位經濟模板

任何被提案的 LLM 功能,產出:

- 預期每 request 的 $n_\text{in}$ 和 $n_\text{out}$,附理由。
- 每使用者每期間預期 request 數。
- 在 3 種價位(前沿、中階、小)下每使用者每期間成本。
- 每個 model 選擇下的每使用者預期營收。
- 每種下的 margin。
- 敏感度:每使用者 request 翻倍會怎樣?成本 10 倍呢?

每個功能一份這樣的一頁文件,會讓對話有根據。

## 一句話總結

LLM 產品經濟學只要拆開就看得懂 —— 輸入 token、輸出 token、每使用者 request 數、基礎設施選擇 —— 不算就不懂;在這邊活得好的團隊,就是早算、常算的那些。

下一章:[風險與治理 →](risk-governance.md)

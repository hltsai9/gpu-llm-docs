# Continuous batching

如果你只從 serving 這一側學一個技巧,就學這個。Continuous batching(也叫 *iteration-level batching* 或 *in-flight batching*)是那個讓現代 LLM serving throughput 大約變 10 倍的單一改變。它也是為什麼現代 server 長得跟一個簡單的 `generate()` loop 差那麼多的原因。

## 天真做法:static batching

對 LLM workload 做 batch 的簡單方式:

1. 收集 $N$ 個 request。
2. 把它們 pad 到同一個長度。
3. 跑一個大的 forward pass,把它們一起跑完。
4. 等到*最慢的那一個*做完(通常是輸出最長的那個)。
5. 一次把所有回應返回。

<div class="analogy" markdown>
一位廚師在取菜口等著,要等整輪每一盤都好了才送。如果有三個客人點了快煮義大利麵、一個點了 beef Wellington,那三份義大利麵要在保溫燈下躺一個小時。
</div>

依嚴重性排序的問題:

- **Head-of-line blocking。** 一個要生 1000 個 token 的 request,會擋住同一個 batch 裡的所有人直到它做完。
- **浪費運算。** 短回應也要付「被 pad 到最長那個長度」的代價。
- **GPU 閒置。** Server 在等 batch 收齊的時候,GPU 什麼事都沒做。
- **沒有 streaming。** 要到 batch 結束才能返回 token。

在 production 上,static batching 會把有效 throughput 壓在 GPU 能力的 20–30% 左右。

## 洞見:反正 decode 本來就是一次一個 token

回想一下 [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md):每一個 decode step 都只會為每個 request 產生一個新 token。所以每一步,每個 request 只貢獻一個 `(Q, new_token)` 操作,工作本質上是可以拆成「一個 request、一個 decode step」這種單位的。

這意思是:step $t$ 的 batch 不需要和 step $t+1$ 的 batch 一樣。

**Continuous batching** 在每一個 decode step 都可以加入、移除 request:

- 一個 request 的最後一個 token 出來了 → 它離開 batch。
- 新 request 來了 → 下一步就加入 batch。
- 沒有 padding。沒有「等最慢的」。

<div class="analogy" markdown>
一位廚師連續出小份菜。一盤一上桌,馬上做下一盤。客人在不同時間進場離場,廚師從不因為等最慢的單而閒下來。
</div>

## Continuous batching 需要什麼

你不能想加就加 —— 你需要:

1. **Paged KV cache。** 新 request 現在就需要分 KV 快取 page;舊 request 退場就要立刻把 page 收回來。固定連續記憶體分配讓這件事沒法做。
2. **高效的單步 kernel。** 每一個 decode step 都必須便宜,因為步數很多。CUDA graph 在這邊有幫助 —— graph 每一步直接 replay,不用每步重規劃。
3. **一個 scheduler。** 要有東西決定「每一步讓哪些 pending request 加入 batch」。vLLM 和 TGI 內建的 scheduler 會處理優先權、公平性、容量上限。
4. **Request-level 狀態追蹤。** 每一個在跑的 request 都有自己在 KV 快取中的位置、自己的輸出 token 數、自己的終止條件。

這四件事都不簡單。這也是為什麼自幹 serving layer 是個很深的坑。

## 實際上的 throughput 改善

<div class="numbers" markdown>
<div class="cell"><div class="n">~5–10×</div><div class="l">相較 static batching 的典型 throughput 增益</div></div>
<div class="cell"><div class="n">~15–25×</div><div class="l">相較一次跑一個 request 的 throughput 增益</div></div>
<div class="cell"><div class="n">~20–50×</div><div class="l">相較 Python 裡 naive transformers.generate() 的增益</div></div>
</div>

這不是行銷數字。vLLM 對上自幹 PyTorch serving 的真實 benchmark,在常見 workload 上常常是 10–20 倍的改善。當中大部分差距來自 continuous batching;其餘來自 paged KV cache 和 kernel 最佳化。

## 新的瓶頸:KV 快取容量

Continuous batching 把瓶頸搬家。當每個 request 都在有效率地共享 GPU 時間,限制你的就是「多少 request 的 KV 快取可以同時裝得下」。

舉例:H100 有 80GB 的 HBM。裝入一個 FP16 的 13B model(~26 GB)後,你大概剩 ~54 GB 的 KV 快取空間。假設每個在跑的 request 平均每 token 要 1 MB 的 KV 快取、context 長度 2048:每個 request 需要 ~2 GB 快取。滿以前你大概可以有 ~27 個並發 request。

第 28 個 request 來的時候:

- **等策略:** 把 request 排隊,等有空位再服務。Tail latency 會變差。
- **Evict 策略:** 把閒置最久的 request 踢出去,它回來時再重新計算它的 KV 快取。付的是運算成本,但 latency 保得住。
- **Preempt 策略:** 停下一些正在跑的 request,先服務新來的。看 scheduler 的具體策略。

每一個 server 都有自己的策略;搞清楚你這台用哪一種,是營運的一部分。

## Continuous batch 裡的 prefill vs. decode

回想:**prefill** 是 compute-bound(一次把整段輸入 prompt 處理完)。**Decode** 是 memory-bound(一次生一個 token)。

一個乾淨的 continuous batch 會有一個「新的」request 在 prefill,和很多現有 request 在 decode。把它們混在同一張 GPU 上其實是好事 —— prefill 可以用到 decode 沒有在用的 tensor core。

但它們有兩個交互作用要注意:

- **Prefill 主宰 first-token latency。** 長 prompt 會在它的 decode 開始之前,*佔走*一段不小的 GPU 時間。其他正在 decode 的 request 會因為 prefill 在跑而短暫停滯。
- **「Chunked prefill」**是現代解法:把長 prefill 切成 chunk,和 decode step 交錯。讓 decode 邊跑邊讓 prefill 進展。大多 serving 框架現在都支援。

## Prefix sharing:額外的一層

Continuous batching 解鎖了另一個最佳化:**prefix sharing**。

如果兩個 request 的開頭是一樣的 system prompt,它們在那段 prefix 上的 KV 快取是一樣的。Paged attention 讓它們共用那些 page —— 一次計算、兩個 request 讀同一塊記憶體。對那種「很多使用者打到同一個長 system prompt」的 workload(這就是大多數 chat 應用),prefix sharing 會把 KV 快取用量砍半,也跳過共用那段的 prefill。

SGLang 的 RadixAttention 把這件事再往前推,用一棵共用 prefix 的 trie,對 agent 這種會共用多步 prompt 的 workload 特別有利。

## 量測:會在乎的那些 metric

你在一張 serving GPU 上會在乎的 metric:

- **Tokens/sec(總和與 per-request)。** 真正的 throughput 數字。
- **Running batch size。** 有多少 request 在跑。越高越好,直到容量上限。
- **Queue 深度。** 等著進 batch 的 request。一直升 = 過載了。
- **KV 快取使用率(已用 page 的百分比)。** 長期 >90%,你就是被容量綁住了。
- **Time to first token(TTFT)P50/P95。** 使用者要多久才看到東西。
- **Time per output token(TPOT)P50/P95。** 看到之後 stream 多快。

不是 `nvidia-smi` 裡的 GPU 使用率(理由見 infrastructure 路徑)。

## 常見錯誤

- **`max_num_seqs` 設太高。** 讓太多 request 進快取;會引發 preempt、tail latency 尖峰。
- **沒開 prefix caching。** 對任何有共用 prompt 的 workload 而言,是白拿的 throughput。
- **沒開 chunked prefill。** 長 prompt 的 request 會擋住所有人的 decode。
- **用一樣的 request 去量 throughput。** Benchmark 看起來很好看;production 流量其實很雜,行為會差很多。
- **用 request 數做 autoscaling。** 不同 request 的成本可以差非常多。要用 token 或 KV 快取用量來 scale。

## 一句話總結

Continuous batching 讓 GPU 用各自需要的速率服務 N 個 request,而不是在那邊等最慢的 —— 要做到,需要 paged KV cache 和仔細的 scheduling,但它是現代 LLM serving 上最大的那頓免費午餐。

下一章:[GPU cluster operations →](cluster-ops.md)

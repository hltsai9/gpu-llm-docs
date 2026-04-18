# 訓練 vs. 推論

不管你是在 production 吐一個 token,還是在實驗室跑一個訓練步驟,一個 model 的 forward pass 是同一張 graph。但圍繞這個 forward pass 的*記帳方式*差異之大,訓練和推論感覺起來就像兩門不同的學問。

## 重新描述這份工作

<div class="analogy" markdown>
推論是餐廳出餐:食譜固定,廚師盡可能快地把一份份餐點端出去。訓練是在研發食譜:廚師也在煮,但每出一 batch 就嚐一次、調鹽、做筆記、再試一次。他需要一本筆記、一把尺、一台秤、上一個三版的醬料還留在冰箱、還要多一張檯面可以寫字。
</div>

具體地說,forward pass 在兩種情境下都是同一個 $y = f(x; \theta)$。訓練多了:

1. 一個 **backward pass**,計算 loss 對權重的 gradient。
2. 一個 **optimizer step**,用那些 gradient 去更新權重。
3. forward 時存下來的 **activation**,讓 backward 能用。
4. **optimizer 自己的狀態**(Adam 的 $m$ 和 $v$ 動量)。

每一項都同時是記憶體和運算的成本。

## 記憶體的算術

設 $N$ 為參數數、$b$ 為每個參數的 byte 數(FP16/BF16 為 2、FP32 為 4、FP8 為 1)。

**推論記憶體**,約略:

$$
\text{mem}_{\text{inf}} \approx N \cdot b + \text{KV cache}
$$

一個 7B model 用 BF16、context 不長的情境下:$7{\times}10^9 \times 2 = 14\text{ GB}$ 的權重,再加上幾 GB 的 KV 快取。一張消費級 GPU 就裝得下。

**訓練記憶體**(mixed precision、使用 Adam、沒有任何記憶體最佳化),約略:

$$
\text{mem}_{\text{train}} \approx N \cdot b \;+\; N \cdot 4 \;+\; N \cdot 8 \;+\; A
$$

拆開來:

- $N \cdot b$ —— 半精度的權重(forward 用的那份)。
- $N \cdot 4$ —— 一份 FP32 的**權重主副本**(optimizer 更新時用,避免精度漂掉)。
- $N \cdot 8$ —— Adam 的兩個 FP32 動量 tensor(也就是 $2 \times 4$)。
- $A$ —— **activation**:forward pass 的中間 tensor,為 backward 存下來。

以 7B model 為例:

- BF16 權重:14 GB
- FP32 主副本:28 GB
- Adam 動量:56 GB
- 光是 optimizer 和權重的總和:**98 GB**
- 加上 activation —— 一個 sequence=4096 的 batch 很容易再多 20–40 GB。

<div class="numbers" markdown>
<div class="cell"><div class="n">~14 GB</div><div class="l">BF16 權重(7B model)</div></div>
<div class="cell"><div class="n">~98 GB</div><div class="l">權重 + FP32 主副本 + Adam 狀態</div></div>
<div class="cell"><div class="n">~120–140 GB</div><div class="l">加上典型訓練 activation</div></div>
<div class="cell"><div class="n">~14 GB</div><div class="l">同一個 model 的推論記憶體</div></div>
</div>

**一個 7B model 用 14 GB 可以 serve,但訓練要 120 GB。** 一張 80 GB 的 H100 沒辦法天真地訓練一個 7B model。你需要記憶體最佳化,而這部分剩下的章節就是在講這些。

!!! note "5–6 倍的大原則"
    對 BF16 mixed-precision + Adam 的訓練,訓練總記憶體約是推論記憶體的 $5{-}6\times$。對 70B model,那是 ~600–800 GB 的訓練狀態 —— 遠超過任何單張 GPU 能裝,也正是為什麼有規模的訓練天生就是分散式的。

## activation 從哪裡來

activation 常常是記憶體帳單裡最大的一筆,而它會隨 *batch × sequence × hidden 維度 × layer 數* 縮放 —— 所以它在一些看起來無傷大雅的變數上會以二次方成長。

一個 transformer 層處理 batch $B$、序列長 $L$、hidden 大小 $H$ 的情況:

- 進入該層的輸入:$B \cdot L \cdot H \cdot b$ bytes。
- Attention 的中間 tensor(沒有 FlashAttention):最糟到 $B \cdot L^2 \cdot H \cdot b$ bytes —— 注意那個 $L^2$。
- 輸出:$B \cdot L \cdot H \cdot b$ bytes。

再乘以層數。對 70B model(80 層、8192 hidden、BF16),$B=4$、$L=4096$ 之下:activation 很容易就是幾十 GB。

所以:

- 有 **gradient checkpointing** 這東西。只存一部分 activation;backward 時再重新計算其他的。可以把 activation 記憶體砍到 2–4 分之一,代價是 forward pass 多約 30% 的運算。
- **FlashAttention** 是一件大事。它的 attention 永遠不把那個 $L^2$ 的中間 tensor 寫到 HBM —— 全部留在 register/SRAM 裡。同時省下大量的記憶體頻寬*和* activation 儲存空間。
- **Sequence packing** 有影響。把多個短序列打包進同一個長度為 $L$ 的 batch slot,可以更有效率地利用 activation。

## 推論為什麼不一樣

推論會把上面那些全部丟掉。沒有 gradient、沒有 optimizer、沒有留下來的 activation。剩下的是:

- 權重,以你部署的精度為準(為了效率常常是 INT4/INT8/FP8)。
- **KV 快取** —— 一個只有推論有、訓練沒有的新記憶體消耗項(見 [KV 快取](../03-llm-inference/kv-cache.md))。

這也是為什麼同一個 model,serve 的成本是訓練的 5–10 分之一。這也是為什麼「裝得下一張 GPU」這句話在兩個脈絡下意義差很多。一個 INT4 的 70B model 在一張 H100 上做推論很從容。訓練同一個 model 要幾十張 H100。

<div class="analogy" markdown>
訓練是廚師揹著一本筆記、三瓶參考醬料、一把尺、一台秤在廚房走動。推論是廚師只帶著一張食譜卡和一個鍋。
</div>

## 運算特性

運算的故事比較簡單,但也值得知道:

- 訓練 forward:每個 token、每層大約 $2N$ FLOPs(matmul 主宰)。
- 訓練 backward:再一個 $2N$ FLOPs,加上權重梯度的 matmul。大約是 $\sim 2\times$ forward。
- **每 token 訓練總運算量:$\sim 6N$ FLOPs。**
- 推論 forward(prefill,一個 token):$\sim 2N$ FLOPs。
- 推論 decode(一個新 token):$\sim 2N$ FLOPs —— 但 arithmetic intensity 低很多(見 [roofline](../03-llm-inference/roofline.md)),所以有效 throughput 只有 peak 的一小部分。

這就是著名的 Chinchilla 法則的來源:訓練一個 $N$ 參數的 model 在 $D$ 個 token 上要花 $\sim 6ND$ FLOPs。對 2T token 上的 70B model:$6 \times 7{\times}10^{10} \times 2{\times}10^{12} = 8.4{\times}10^{23}$ FLOPs。在每張 H100 持續 400 TFLOPs 的情況下,大約是 66,000 GPU 小時。對大廠來說是零頭,對小團隊來說是一整年。

## 這些對你的配方會改變什麼

如果你要訓練或 fine-tune 一個 LLM,上面那些的實務意涵是:

- **Mixed precision 不是可選項。** BF16 或 FP8 做運算,搭配 FP32 的主權重。全部用 FP32 等於在現代硬體上付 2 倍記憶體、卻不會換到任何品質。
- **一開始就為 activation 記憶體做規劃。** 它通常是主宰項,而且是大多數人沒想到的旋鈕。FlashAttention 和 gradient checkpointing 是第一組槓桿。
- **Optimizer state 很大。** 這就是 ZeRO(和它的手足 FSDP)拿來跨 GPU sharding 的東西 —— 更多細節見 [分散式訓練](distributed-training.md)。
- **先用真實的 batch size 測試。** Out-of-memory 錯誤會隨 batch 和 sequence 放大,一個在 $B=1, L=512$ 會跑的訓練,在 $B=8, L=4096$ 就可能 OOM。

## 一句話總結

訓練就是推論加上一個 backward pass,加上驅動權重更新的 optimizer state,加上 backward pass 需要用到的 activation —— 而那個「加上」加起來是記憶體乘 5–6 倍、每 token 運算乘 3 倍。

下一章:[Fine-tuning 光譜 →](fine-tuning-spectrum.md)

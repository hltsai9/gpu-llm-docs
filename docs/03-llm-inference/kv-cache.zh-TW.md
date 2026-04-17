# KV 快取

在 LLM 推論所有聰明技巧裡,KV 快取是最核心的那一個。沒有它,串流生成根本不可行 —— 而它也是 LLM 伺服器這麼吃 GPU 記憶體的原因。

## 問題

接著上一章:要生成 token $t$,需要做 attention,而 attention 需要序列中**之前每個** token 的 keys($K$)和 values($V$)。當我們生成 token $t+1$ 時,需要 token $1..t$ 的 K/V;生成 token $t+2$ 時,需要 token $1..t+1$;依此類推。

最天真的做法是:每生成一個新 token,就把整段 prompt 再跑一次模型,從頭為每個 token 重新算出 K 和 V。這能跑,但每產生一個新 token 的成本會隨著序列長度線性增長。到了第 2,000 個 token 時,每多出一個 token 就比第一個貴 2,000 倍。

這顯然很爛。但仔細看:**前面 token 的 K 和 V 向量在每一步之間是不變的**。我們在生成第 100 個 token 時、第 17 層的第 3 個 token 的 key 向量,跟我們在生成第 4 個 token 時算出來的是一模一樣的。我們只是毫無必要地每次都重算一次而已。

<div class="analogy" markdown>
想像一位主廚每次有新單進來時,都把今晚從頭到現在的每張單子重讀一次。每 10 分鐘就重讀 200 張單,只為了搞清楚「欸,6 號桌的備註是什麼?」更快的做法是準備一本筆記本,新增一筆就記一行。
</div>

## 解法:把它們快取下來

**KV 快取**就是那本筆記本。每生成一個 token,我們會:

1. 算出新 token 的 Q、K、V(這是只針對單一個 token 的迷你前向傳遞)。
2. 把新的 K 和 V **追加**到住在 HBM 裡、不斷累積的快取裡 —— 每一層、每個 head 各一格。
3. 做 attention 時,用新的 Q 去對快取裡所有過去的 K、V 計算。
4. 輸出新 token。

有了這個快取,每一步生成幾乎都是固定工作量,不管序列多長都一樣。我們從不重算舊的 K 和 V,只在它們對應的 token 第一次出現時算一次。

## 快取的形狀

對每一層、每個 attention head,每個 token 我們都存一個 K 向量和一個 V 向量。整個快取的大小是:

$$
\text{cache size} = 2 \times L \times n_{\text{layers}} \times n_{\text{heads}} \times d_{\text{head}} \times \text{每個元素的位元組數}
$$

前面乘 2 是因為 K 和 V。我們以 70B 模型(以 Llama-2-70B 做參考)代入數字:80 層、64 個 attention head、每個 head 128 維、FP16(2 bytes)。

- 每 token:$2 \times 80 \times 64 \times 128 \times 2 = 2{,}621{,}440$ bytes ≈ **每 token 2.5 MB**。
- 4K context:每個序列約 10 GB。
- 32K context:每個序列約 82 GB。

<div class="numbers" markdown>
<div class="cell"><div class="n">2.5 MB</div><div class="l">每 token 的 KV 快取(Llama-70B,FP16)</div></div>
<div class="cell"><div class="n">10 GB</div><div class="l">4K context 下單一序列</div></div>
<div class="cell"><div class="n">82 GB</div><div class="l">32K context 下單一序列</div></div>
<div class="cell"><div class="n">80 GB</div><div class="l">H100 的 HBM 總量</div></div>
</div>

看一下最後那個對比。**一個 32K context 的對話,光是它的 KV 快取,就能吃光一張 H100 的記憶體。** 真實服務系統要在單卡上同時服務很多場對話,所以它們得把每個 byte 都擠出來用。

## 縮小快取的各種戰爭

KV 快取已經變成 LLM 服務系統裡最核心的記憶體管理問題。你聽到的每個技巧最後都是在做兩件事:讓它更小,或塞得更多。

**Grouped-Query Attention(GQA)。** 不要每個 head 都有自己的 K 和 V,而是讓一群 head 共用一組 K/V。Llama-2 7B 有 32 個 Q head、32 個 KV head;Llama-2 70B 則是 64 個 Q head、8 個 KV head —— KV 快取直接縮小 8 倍,品質損失極小。現代的開源模型幾乎都用 GQA。

**Multi-Query Attention(MQA)。** 極端版本:所有 head 共用一個 K 和一個 V。記憶體省最多,品質略降。

**Paged KV cache**(vLLM 的創新)。不要為每個序列配一整塊連續的記憶體(如果序列沒到最大長度就會浪費),而是把快取切成固定大小的 page(就像作業系統的虛擬記憶體那樣),按需要配配 page。這大幅減少碎片化,也讓聰明的共享變得可能。

**前綴共享(Prefix sharing)。** 如果兩個序列有共用的前綴(例如同一段 system prompt),它們在那段前綴的 KV 快取是一模一樣的。Paged cache 允許多個序列**指向同一批 page** —— 零額外記憶體、零額外算力。

**量化 KV 快取。** 把 K 和 V 存成 8-bit,甚至 4-bit,而不是 16-bit。記憶體減半或減到四分之一,精度損失很小。

**KV 快取卸載(Offload)。** 把熱的 page 留在 HBM,把冷的 page 搬到 CPU 記憶體或 NVMe。比較慢,但可以服務更長的 context。

<div class="analogy" markdown>
KV 快取就是主廚的筆記本。上面每一招,要嘛是換一本比較小的筆記本(GQA、量化)、要嘛是讓不同桌共用同幾頁(前綴共享)、要嘛是在筆記寫爆時從辦公室再抽幾本備用出來(offload)、要嘛是把空白頁聰明地重複使用(paging)。
</div>

## 為什麼這個快取讓 decode 變成受限於記憶體

這就是通往下一章的橋。當你生成一個 token,你會做:

1. 為新 token 算一點點運算的 Q、K、V(約等於只對一個 token 跑一次前向傳遞 —— 很便宜)。
2. 從 HBM 讀出**每一層的整個權重矩陣**(為了做矩陣乘法)。
3. 從 HBM 讀出**整份 KV 快取**(為了對所有過去的 token 計算 attention)。

在步驟 2 和 3 裡,每搬一個 byte 能做的算術極少。你碰了好幾百 GB 的權重和 KV 快取,可是每 byte 只做幾百次算術運算。Tensor Core 大部分時間都在閒著。你是在搬資料,不是在運算。

這就是為什麼 decode 是**受限於記憶體(memory-bound)**(見 [roofline 章節](roofline.md))。也是為什麼 KV 快取 —— 每生成一個新 token 就得整份讀一次 —— 會是這麼核心的議題。你每一個能避免儲存或讀取的 byte,都是一個不會拖慢生成速度的 byte。

## 大局觀

- 沒有 KV 快取,生成成本會二次方增長。沒法用。
- 有 KV 快取,每個新 token 大致變成固定工作量 —— 但你現在多了一個會隨序列長度增長的資料結構。
- 這份快取在 LLM 伺服器的 HBM 使用上佔主導地位。
- Attention 的變形(MQA、GQA)以及服務系統的各種技巧(paging、前綴共享、量化),存在的目的都是要把它塞進去。

一旦你把「KV 快取是筆記本,而這本筆記本攜帶成本很高」這件事內化,現代 LLM 服務的大量文獻就會變得一目了然。

下一章:[Prefill vs. Decode →](prefill-vs-decode.md)

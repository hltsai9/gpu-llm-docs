# Prefill 與 Decode

如果關於 LLM 推論你只記住一件事,讓它是這件:

<div class="analogy" markdown>
**Prefill 是用餐尖峰,decode 是點滴式緩流。** 它們用的是同一個廚房,但使用方式完全不同。
</div>

推論分兩個階段,從 GPU 的角度看,這兩個階段幾乎沒有共通點。理解這個分裂,是理解後面所有效能與服務系統決策的關鍵。

## 階段 1:Prefill

當你的 prompt 第一次進來時 —— 假設是 2,000 個 token —— 模型會**一次**對所有 2,000 個 token 做一次前向傳遞。它們以平行方式處理,因為 Transformer 其實並不需要把它們「依序」處理:訓練時它就是看整段序列的,推論時同樣的技巧也適用。

prefill 時的 attention,以 2,000 個 token 的 prompt 為例,QK 矩陣是 2,000 × 2,000。所有的配對都被打分、套上因果遮罩、做 softmax 再乘 V。大矩陣乘法,大量算術,Tensor Core 有很多平行工作可做。它們火力全開。

Prefill 時權重發生了什麼:

- 每一層的權重矩陣從 HBM 讀進來一次。
- 這些權重會乘上整個 2,000 個 token 的 activation 矩陣。
- 每搬一個 byte 能做很多次算術:**高算術密度**。

結果:**prefill 是受限於運算(compute-bound)的。** 瓶頸在 Tensor Core。HBM 頻寬不是 —— 權重只讀一次,然後橫跨上千個 token 重複使用。

<div class="analogy" markdown>
Prefill 就像中午用餐尖峰同時湧入。廚師整個早上都在備料;此刻 2,000 張單同時衝進廚房。每一站都在忙。裝卸月台不是瓶頸 —— 廚師的手才是。這是 GPU 最開心的時刻。
</div>

## 階段 2:Decode

Prefill 結束後,模型已經產出了第一個輸出 token,KV 快取裡也存好了 2,000 個 prompt token 的條目。接下來進入 **decode**:生出一個 token、追加到 context,再生下一個、追加、重複。

每一步 decode 都是**恰好對一個 token** 做一次前向傳遞。那個 token 的 activation 是個很小的向量(Llama-70B 是 4,096 個浮點數)。但為了處理這個向量,模型還是得:

- 從 HBM 把**每一層的所有權重矩陣**讀進來(70B 模型 FP16 是 140 GB)。
- 讀**整份 KV 快取**,以便對每一個過去的 token 做 attention。
- 做一點點算術(每層只為一個 token 的份量)。

每搬一個 byte 能做的算術:**非常少**。權重從 HBM 跋涉到 Tensor Core,乘上一個向量,然後被丟棄 —— 用來換回一點點慘兮兮的工作量。

結果:**decode 是受限於記憶體(memory-bound)的。** Tensor Core 大部分時間都在閒著等 HBM。HBM 頻寬是「每秒 token 數」的上限。換一張 HBM 更快的 GPU,decode 吞吐量會直接跳起來;換一張 Tensor Core FLOPs 更高的 GPU,對 decode 幾乎沒幫助。

<div class="analogy" markdown>
Decode 就像深夜只剩一位客人的班次。僅剩的那位廚師要為每一份烤土司親自走到裝卸月台,把一整板食材推回來。廚房的產能很大,但這趟堆高機之旅佔據了絕大多數時間。要每小時做更多土司,靠的是把「每板食材變小」,不是多雇廚師。
</div>

## 兩個階段、兩條 roofline

在 [roofline 圖](roofline.md) 上各釘一個大頭針:

- **Prefill** 坐在運算上限(compute ceiling)上,幾乎用滿 Tensor Core 吞吐量。
- **Decode** 坐在記憶體頻寬上限(memory-bandwidth ceiling)上,幾乎用滿 HBM 頻寬。

跑純 prefill 的 GPU 和跑純 decode 的 GPU,瓶頸完全不同。這也代表:

- **硬體升級對它們影響不同。** H200 相對 H100 的主要升級是更大、更快的 HBM。Decode 吞吐量會跳起來,prefill 幾乎沒動。
- **量化對 decode 幫助更大。** 權重改成 FP8 → HBM 流量減半 → decode 的 token/秒大概翻倍。Prefill 也有好處,但沒那麼戲劇化。
- **Batching 對 decode 幫助**巨大。這就是下一章 —— 先講結論:64 個使用者同時做 decode,就能重複使用那一次的權重讀取,把「受限於記憶體」的工作負載硬生生拉回「受限於運算」。

## 首 token 時間 vs. 每 token 間隔

這兩個階段直接對應到兩個「使用者看得見的延遲指標」:

**TTFT(time to first token,首 token 時間)。** 由 prefill 主導。大致隨 prompt 長度線性成長。100 個 token 的 prompt 的 TTFT 可能是 100 毫秒;10,000 個 token 的 prompt 則會是好幾秒。

**ITL(inter-token latency,token 間延遲)。** 由 decode 主導。*對單一使用者而言*,大致跟 context 長度無關,但會隨 batch size 和模型大小變動。

伺服器營運者會根據產品類型,調整這兩者的比重。聊天介面通常會以 TTFT < 500 毫秒為目標,讓第一個字能快速浮現;批次摘要任務則只在乎整體吞吐量。

## 拆解(Disaggregation)的觀點

由於 prefill 和 decode 個性差異這麼大,現代服務系統有時會把它們放在**不同的 GPU** 上跑:

- **Prefill pool**:一群專門負責處理進來的 prompt 的 GPU。受限於運算,吞吐量用 TFLOPs 衡量。
- **Decode pool**:一群專門負責正在生成 token 的 GPU。受限於記憶體,吞吐量用 HBM-GB/s 衡量。

Prefill 結束後,KV 快取會從 prefill GPU 被搬到 decode GPU(透過 NVLink 或 RDMA),然後繼續在那邊生成。這種**拆解式服務(disaggregated serving)**(由 vLLM 的 splitwise、Mooncake 等系統帶起風潮)可以顯著提升整體 GPU 使用率 —— 你不再強迫同一種硬體做兩份不相容的工作。

<div class="analogy" markdown>
好的餐廳會把備料站和擺盤站分開。備料團隊可以在一天內分切掉三個禮拜的肉量(受限於運算、為吞吐量最佳化)。擺盤站則是一盤一盤上菜(受限於延遲,節奏完全不同)。強迫一個站做兩件事,兩邊都不會有效率。
</div>

## Chunked prefill:中間路線

對於非常長的 prompt,prefill 可能長時間佔住 GPU,讓同一台機器上其他需要 decode 的請求都餓肚子。折衷做法是 **chunked prefill**:把 prompt 切成一塊塊(例如每塊 512 個 token),一塊一塊處理,並和正在進行的 decode 交錯。整個 prompt 的端到端時間會稍微變長,但其他使用者的 decode 不會卡住。

## 值得帶走的重點

- **Prefill** = 平行處理整個 prompt。受限於運算。重度使用 Tensor Core。
- **Decode** = 一次一個 token 自回歸。受限於記憶體。重度使用 HBM 頻寬。
- 兩個階段具有**完全相反的效能特性**,對不同最佳化手段反應不同。
- 服務系統上那些聰明技巧(batching、量化、paged KV cache、拆解式服務)幾乎都在做一件事:讓 decode 不要那麼慘,因為它才是常態。

下一章:[同時服務多桌客人(Batching)→](batching.md)

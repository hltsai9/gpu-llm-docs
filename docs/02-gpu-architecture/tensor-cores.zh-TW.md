# Tensor Core:專業級電動工具

整個工廠園區大部分看起來都一樣:CUDA 核心、記憶體、warp 排程器。但藏在每個 SM 裡,還有幾個 **Tensor Core**,它們才是 LLM 跑得這麼快的真正原因。

可以把它們想成**專門為特定工作打造的電動工具**,就像擺在一般工作台旁邊的工業機器。CUDA 核心是一隻拿著鐵槌的靈巧的手;Tensor Core 則是一台液壓沖床,一次就把整塊板材沖成你要的形狀。

<div class="analogy" markdown>
CUDA 核心是拿著鐵槌的手。Tensor Core 是液壓沖床。兩者各有角色,但如果你的產品是金屬板,你不會拿鐵槌敲 —— 你會拿去沖。
</div>

## Tensor Core 到底在做什麼

一個 CUDA 核心每個 cycle 對純量運算元執行一次乘加:

```
accumulator += a * b    // 每個 cycle 每個核心做一次乘加
```

一個 Tensor Core 則是在每個 cycle 執行一整個小型的**矩陣乘加運算(matrix multiply-accumulate)** —— 大致像:

```
D = A × B + C   // 其中 A、B、C、D 都是小矩陣(例如 16×16 × 16×8)
```

也就是一道硬體指令裡同時做好幾百次乘加,使用的是較低精度的資料型別(FP16、BF16、FP8、INT8,Blackwell 上還有 FP4)。Tensor Core 的運算元從暫存器讀進來,把結果寫回暫存器;一個 warp 的所有執行緒像個「合作的前端」,負責把機器餵飽。

看看數字感受一下規模。H100 SXM 可以達到:

<div class="numbers" markdown>
<div class="cell"><div class="n">67 TFLOPs</div><div class="l">FP32 —— 一般 CUDA 核心</div></div>
<div class="cell"><div class="n">989 TFLOPs</div><div class="l">BF16 —— Tensor Core</div></div>
<div class="cell"><div class="n">1,979 TFLOPs</div><div class="l">FP8 —— Tensor Core(稀疏加持下再翻倍)</div></div>
</div>

從「CUDA 核心跑 FP32」跳到「Tensor Core 跑 BF16」,差距大約是 15 倍。到 FP8 差距還會更誇張。**如果你的 LLM 數學沒有跑在 Tensor Core 上,你大概把 90% 的晶片都留在桌上沒用。** PyTorch、cuBLAS、cuDNN、FlashAttention 這些框架會自動讓你的矩陣乘法跑到 Tensor Core 上 —— 但你還是該知道它們的存在。

## 為什麼到處都是低精度

你會注意到 Tensor Core 在「比較低的精度」下最快:FP16、BF16、FP8、INT8。這是刻意的設計。精度降低意味著:

- 運算元更小 → 暫存器和共享記憶體一次能放更多。
- 資料通路更窄 → 同樣的矽面積能塞更多乘法器、每 cycle 做更多乘法。
- 每個數值占用的記憶體頻寬更少。

對於 LLM 推論,業界大致收斂到:

- **BF16 或 FP16**:用於訓練,以及對品質要求較高的推論。
- **FP8**:在 H100/Blackwell 級 GPU 上進行積極的推論。
- **INT8、INT4**:量化推論,尤其是權重。

每往下走一階,都是用一點點數值精度,換取大幅的吞吐量與記憶體佔用優勢。Transformer 意外地能承受這些 —— 只要校準得當,attention 和前饋層可以吸收很多四捨五入誤差而看不出品質差異。

<div class="analogy" markdown>
一台用一半壓力、兩倍速度在跑的沖床,只要做出來的零件還過得了規格,每小時照樣做更多零件。量化就是業界在持續進行的校準:「壓力到底可以調到多低,零件才會開始出現不合格?」
</div>

## 稀疏(Sparsity):少做點也行

Hopper 和 Blackwell 上的 Tensor Core 支援 **2:4 結構化稀疏** —— 如果每 4 個權重中你可以讓 2 個歸零,Tensor Core 就會跳過那些乘法,速度直接翻倍。不是每個模型都禁得起這樣(通常要搭配剪枝與微調),但能用的時候,幾乎就是免費的 2 倍。

方向很清楚:每一代 Tensor Core 都變得更寬、耗電更低、更擅長低精度與稀疏格式。CUDA 核心則是搭著這班車順勢進步。

## 一個 warp 怎麼使用 Tensor Core

你不是一條執行緒一條執行緒地操作 Tensor Core。一道 Tensor Core 指令,是由**整個 warp 協作地**發出的 —— 每條執行緒貢獻自己那一塊運算元,也收回自己那一塊結果。CUDA 透過像 `wmma`(Warp Matrix Multiply Accumulate)這樣的 API,以及 Hopper 上的後繼版本 `wgmma`(Warp Group Matrix Multiply Accumulate)來提供這個功能:

```cuda
// 概念上(CUDA WMMA):
wmma::fragment<matrix_a, 16, 16, 16, half> a_frag;
wmma::fragment<matrix_b, 16, 16, 16, half> b_frag;
wmma::fragment<accumulator, 16, 16, 16, float> c_frag;

wmma::load_matrix_sync(a_frag, A_ptr, 16);
wmma::load_matrix_sync(b_frag, B_ptr, 16);
wmma::mma_sync(c_frag, a_frag, b_frag, c_frag);  // Tensor Core 運算
wmma::store_matrix_sync(C_ptr, c_frag, 16, wmma::mem_row_major);
```

你很少自己寫這種程式。cuBLAS 和 cuDNN 裡有上百萬行手工調校過的 kernel,會針對不同代 GPU 去派送正確的 Tensor Core 指令。FlashAttention 的全部價值主張,就是一場精心編排的 Tensor Core `mma` 指令舞蹈,搭配聰明的記憶體管理,藏在一個乾淨的 API 後面。

## 這對 LLM 直覺的意義

從算術角度看,Transformer 的一次前向傳遞大約 99% 都是矩陣乘法。其他東西 —— layer norm、activation、elementwise 加法 —— 跟矩陣乘法比起來,只是四捨五入的誤差。矩陣乘法跑在 Tensor Core 上。Tensor Core 太快了,幾乎從來不是瓶頸。

這也是為什麼每一個 LLM 效能故事最後都變成記憶體故事:Tensor Core 處理資料的速度,比 HBM 送資料過來還快,所以要變快的唯一辦法就是少搬一點資料。量化、FlashAttention、operator fusion、KV 快取壓縮 —— 所有這些技巧的目標都是同一件事:**讓電動工具不要餓肚子。**

<div class="analogy" markdown>
液壓沖床全速壓下去大概只要 0.3 秒,剩下時間都在等下一塊金屬板到。廠長的工作不是買一台更快的沖床,而是多雇幾台堆高機。
</div>

## 值得帶走的重點

- Tensor Core 是**專門的矩陣乘法引擎**,每個 cycle 做一次小矩陣乘加。
- 它們在 GPU 的運算吞吐量中占主導地位 —— 比同一顆晶片上的 CUDA 核心快大約 15 倍。
- 它們在低精度(FP16/BF16/FP8/INT8)下工作 —— 這也是為什麼量化在現代 LLM 裡這麼核心。
- 它們是由一個 warp 協作餵飽的,通常透過函式庫提供的 kernel。
- 在現代 LLM 工作負載下,它們**幾乎從不是瓶頸**。瓶頸是記憶體。

最後這一點正是通往第三部分的橋樑:一旦你理解了「Tensor Core 其實都在等記憶體」,LLM 推論引擎的設計就變得非常好讀了。

下一章:[第三部分 —— LLM 推論 →](../03-llm-inference/index.md)

# Warp、執行緒與區塊

我們已經知道:一個 SM 裡面有好幾千個核心;執行緒以 32 條為一組、同步前進,叫做 warp。現在我們需要完整的組織圖 —— CUDA(以及 GPU 程式一般來說)實際上是怎麼把工作切開的。

階層一共有四層,由小到大:

1. **執行緒(Thread)** —— 一位出餐員。
2. **Warp** —— 32 位出餐員的編制,必須執行同一個指令。
3. **區塊(Block)**(也叫 *cooperative thread array*)—— 一組最多 1,024 條執行緒,住在同一個 SM 裡,可以共用記憶體、可以彼此同步。
4. **Grid** —— 整間廚房那麼多的 block,分散到 GPU 上所有的 SM。

<div class="analogy" markdown>
執行緒是出餐員。Warp 是 32 人一組、同步動作的編制。Block 是被分派到「同一間工作坊」裡的一組人 —— 他們共用一個小倉庫,也可以互相講話。Grid 則是整座工廠園區:幾十間工作坊、每間裡有幾十個編制,各自負責整張訂單的某一塊。
</div>

## 工作是怎麼組織的

當你啟動一個 kernel(GPU 函式)時,你要指定兩個形狀:

```cuda
kernel<<<gridDim, blockDim>>>(args);
// gridDim  = 總共多少個 block(例如 1024)
// blockDim = 每個 block 裡多少條執行緒(例如 256)
```

每條執行緒會拿到一組座標:它在 block 內的索引,以及它所在的 block 在 grid 內的索引。Kernel 內部,每條執行緒用這組座標算出「自己要負責哪一個資料元素」:

```cuda
int i = blockIdx.x * blockDim.x + threadIdx.x;
output[i] = input[i] * 2.0f;  // 每條執行緒處理一個元素
```

這就是你怎麼把一個 1,000,000 元素的陣列對應到硬體上的方式:1,000,000 條執行緒,每個 block 放 256 條,總共 3,907 個 block。GigaThread 引擎會把這 3,907 個 block 分派給 H100 上的 132 個 SM,每個 SM 依自己的資源限制,能跑幾個就跑幾個 block。

## Block 作為合作單位

同一個 block 內的執行緒,擁有跨 block 執行緒所沒有的兩種超能力:

**共享記憶體。** 同一個 block 內的執行緒可以讀寫一塊屬於這個 block 自己的、很小(H100 約 100 KB)、很快的晶片內記憶體。這就是你暫存權重和 activation tile 的地方,讓整個 block 可以對這些 tile 用很多次,不用再跑回 HBM。

**同步。** 一個 block 內所有執行緒都可以撞上 `__syncthreads()` 這個柵欄(barrier),意思是:*「所有人在這裡等,直到整個 block 都到齊為止。」* 你會在把資料暫存進共享記憶體後用這個 —— 沒有人可以開始算,直到所有人都載入完成。

**不同 block** 之間的執行緒就沒辦法有效率地做這兩件事。Block 與 block 之間除了透過 HBM,沒有直接的溝通管道,而在同一個 kernel 內也沒辦法讓它們彼此同步(只能另啟一個 kernel)。這是刻意的取捨:讓 block 彼此獨立,硬體才能把它們隨意丟到「任何 SM、任何順序、任何時間」上跑,完全不需要協調。

<div class="analogy" markdown>
同一間工作坊裡的編制可以互相吆喝、共用小倉庫。但工作坊之間工作進行中不會互相講話 —— 他們只是把完成品送到中央倉儲。這種各自獨立的設計,正是工廠能夠擴大規模的關鍵。
</div>

## Occupancy:每間工作坊能塞進幾組人

SM 的資源是有限的 —— 暫存器檔、共享記憶體、warp slot。一個 SM 能同時容納多少個 block,取決於每個 block 需要用多少資源:

- 如果每條執行緒用很多暫存器,能塞進去的執行緒就變少。
- 如果每個 block 想要一大塊共享記憶體,能塞的 block 就變少。
- 如果每個 block 裡的執行緒數很多,能塞的 block 也變少(每個 SM 的執行緒總數有硬上限)。

你實際用到的、占 SM 執行緒容量的比例,叫做 **occupancy**。並不是越高越好 —— 有些 kernel 在「低 occupancy、每條執行緒吃大量暫存器」的情況下效能最好(FlashAttention 就是著名案例)。但如果 occupancy 太低,SM 能同時輪換的 warp 數太少,延遲隱藏就會失效。

!!! info "延遲隱藏的數字"
    H100 的一個 SM 可以同時讓 2,048 條執行緒在飛 —— 也就是每個 SM 有 64 個 warp 可供調度。當某個 warp 卡在一次 500 個 cycle 的 HBM 載入時,排程器需要有其他 warp 可以立刻接手。如果 SM 裡只有 4 個 warp,大家就會一起卡住,核心會全部閒下來。

挑選 `blockDim` 以及每條執行緒要用多少資源,是 CUDA 調校裡的核心決策之一。LLM 會用到的框架級程式碼(cuBLAS、cuDNN、FlashAttention)都針對每一代 GPU 把這些旋鈕設定好了。

## 執行緒、warp、block 在 LLM kernel 裡長什麼樣

拿矩陣乘法當例子,它是每一層 Transformer 的核心。典型的 tile 切法像這樣:

1. **問題:** 計算 $C = A \times B$,其中 $C$ 是 $M \times N$。把 $C$ 切成 $128 \times 128$ 大小的 tile。
2. **一個 block 負責一個 C 的 tile。** 一個 256 條執行緒的 block 負責算一塊 128×128 的輸出 tile。這代表 16,384 個輸出元素由 256 條執行緒分擔 → 每條執行緒 64 個元素。
3. **暫存(Staging):** Block 內所有執行緒協作,把 $A$ 和 $B$ 的一條條 strip 從 HBM 搬進共享記憶體。
4. **同步(Syncthreads)。** 所有人等到 strip 都載完為止。
5. **Tensor Core。** Block 內的各個 warp 發出 Tensor Core 指令,從共享記憶體吃 strip,並把結果累加到每條執行緒的累加器暫存器上。
6. **沿著共用維度 $K$ 重複** 步驟 3–5,直到整個 tile 算完。
7. **寫回** 累加好的 tile 到 HBM。

每一層階層都在做自己的工作:

- **執行緒**持有累加器,做最後的 elementwise 工作。
- **Warp**同步地驅動 Tensor Core 指令。
- **Block**協調把 strip 載進共享記憶體,並在多次迴圈中重複使用它。
- **Grid**覆蓋整個輸出矩陣,GigaThread 引擎負責把 block 分派到所有 SM。

<div class="analogy" markdown>
Grid 是整座工廠要完成的訂單。Block 是工作坊,每個工作坊負責最終成品上的一小塊方格。工作坊從裝卸月台一批一批拿原料回來,塞在自己的小倉庫裡,讓編制(warp)裡的出餐員(執行緒)把它變成成品,再送回出去。
</div>

## 一張乾淨的腦中圖

```
 Grid  ────────────────────────────────────────────────────────
  │
  ├── Block 0   ──┐
  ├── Block 1   ──┤  由 GigaThread 引擎分派到各個 SM
  ├── Block 2   ──┤
  │              ...
  └── Block N-1 ──┘

 一個 block 內部:

   Block ─── Threads 0..255 ──┬── Warp 0 (threads 0..31)
                              ├── Warp 1 (threads 32..63)
                              ├── ...
                              └── Warp 7 (threads 224..255)

   外加:256 條執行緒共同可見的共享記憶體。
         整個 block 一次 syncthreads() 柵欄。
```

## 新版本多出來的一層:Thread Block Cluster

在 Hopper(H100)以及更新的架構上,NVIDIA 多加了一層:**thread block cluster**,把多個 block 組在一起,讓它們共用一塊稍微大一點的晶片上記憶體區域(Distributed Shared Memory,DSMEM)。對那種非常大的矩陣乘法來說,這是一個讓 tile-based 的 LLM kernel 更有效率的工具。你目前還不需要把它放進腦中模型 —— 只要知道「這個階層是可延伸的、會一直長出新的一層」就好。

## 值得帶走的重點

- 工作以 **執行緒 → warp → block → grid** 的順序組織。
- Block 是**合作**的單位:共享記憶體、同步。
- Grid 是**分派**的單位:block 會自動被分散到各個 SM。
- Occupancy —— 你讓 SM 被塞得多滿 —— 是讓延遲隱藏能生效的那個旋鈕。
- 你會關心的每一個 LLM 運算子(matmul、attention、layer norm),實作上都是把問題巧妙地切成 block,然後讓這些 block 的共享記憶體保持滿載。

下一章:[Tensor Core:專業級電動工具 →](tensor-cores.md)

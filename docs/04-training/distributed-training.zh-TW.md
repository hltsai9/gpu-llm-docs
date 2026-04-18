# 分散式訓練

一個 BF16 訓練狀態下的 70B model 大約需要 800 GB 記憶體。現在常見最大的單張 GPU 是 141 GB(H200)。所以訓練一個前沿規模的 model,注定是一個*分散式系統*的問題。

這一章在講這件事*怎麼*發生 —— 三個平行化軸、ZeRO / FSDP 家族的記憶體 sharding、以及實務工程師真正要做的選擇。

## 三個平行化軸

當你有很多張 GPU、一個 model,你可以沿著其中一個或多個軸來切工作:

1. **Data parallel** —— 每張 GPU 都拿一份完整 model 的複本,各自處理 batch 的不同切片。到 step 結尾再平均 gradient。
2. **Tensor parallel** —— 把一個 matrix multiply 切開、分散到多張 GPU。每張 GPU 拿一小片權重;每個 op 結束後把 activation 重新組回來。
3. **Pipeline parallel** —— 不同的*層*放在不同 GPU 上。activation 像 pipeline 一樣流過去,batch 再切成 micro-batch,讓多個 stage 可以重疊。

實務上,前沿規模的訓練會三個一起用(**3D parallelism**)。大多數比較小的訓練,一個或兩個軸就夠了。

<div class="analogy" markdown>
如果一份食譜大到一位廚師做不完:
—— **Data parallel:** 給每位廚師完整的食譜,但一人一堆不同的食材;最後把結果合起來。
—— **Tensor parallel:** 給每位廚師食譜每一個步驟的三分之一 —— 大家都在同一個階段,只是分到食譜頁面上不同的欄位。
—— **Pipeline parallel:** 第 1 位廚師負責第 1 章、第 2 位廚師第 2 章、第 3 位廚師第 3 章;把菜沿著流水線往下傳。
</div>

## Data parallel —— 最簡單的起點

每張 GPU 都有完整的 model 和 optimizer state 的複本。每張拿 batch 的不同切片。backward pass 結尾把 gradient 跨 GPU 平均(透過 **all-reduce** —— 一種在 NVLink 或 InfiniBand 上的 collective operation)。

**好處:**

- 簡單。幾乎什麼 model 都能用。
- 到「通訊成本開始主宰」之前都是線性 scale。

**壞處:**

- **每張 GPU 都要有足夠的記憶體裝整個 model + 它的訓練狀態。** 對大 model 來說,那就是天花板。
- gradient all-reduce 完全是網路流量;幾百張 GPU 下就會變成瓶頸。

大原則:**一張 GPU 還裝得下訓練狀態時就用 data parallel**。再大下去就需要記憶體 sharding(ZeRO/FSDP)或 tensor parallel。

## ZeRO / FSDP —— sharded data parallel

大規模下大多數「data parallel」訓練,其實是 **sharded data parallel**:optimizer state、gradient、以及(或)參數,被切散到多張 GPU 上,沒有任何一張需要全部自己裝。兩套等價的系譜:

- **DeepSpeed ZeRO**(Microsoft,2019)—— 三個 stage,越後面 sharding 越多。
- **PyTorch FSDP**(Fully Sharded Data Parallel)—— PyTorch 原生的對等物,目前是大多數新訓練程式碼的 default。

ZeRO 各 stage:

- **ZeRO-1:** shard optimizer state。相比純 data parallel,大約把訓練記憶體砍掉 4 倍(Adam state 是最大的那項)。
- **ZeRO-2:** 再 shard gradient。再省 2 倍,代價是通訊更多。
- **ZeRO-3 / FSDP:** 連參數都 shard。每張 GPU 在 forward/backward 時只具現化當下這一層的權重,需要的時候從別張 GPU 取。記憶體省最多,通訊成本也最高。

實務建議:

- 先從 **ZeRO-1 或 FSDP 的 `SHARD_GRAD_OP`** 開始 —— 在最少通訊成本下拿到大部分的記憶體節省。
- 只有真的還裝不下,才升到 **ZeRO-3 / 完整 FSDP**,因為對 hidden 維度較小的 model 來說,它的網路成本可能很可觀。
- 在連接良好的 node(NVLink + InfiniBand)上,ZeRO-3 scale 得比鬆耦合 cluster 好很多。

<div class="numbers" markdown>
<div class="cell"><div class="n">4×</div><div class="l">ZeRO-1 的記憶體節省(optimizer shard)</div></div>
<div class="cell"><div class="n">~8×</div><div class="l">ZeRO-2(gradient 也 shard)</div></div>
<div class="cell"><div class="n">~N×</div><div class="l">ZeRO-3(連參數也 shard),N 是 world size</div></div>
</div>

## Tensor parallel —— 切矩陣

拿一個 linear layer $Y = X W$,$W$ 的形狀是 $[H, H]$。把 $W$ 沿欄切成 $[H, H/k]$ 的塊,每張 GPU 拿一塊。每張 GPU 算出一塊 $[B, L, H/k]$ 的輸出切片。結尾再把它們接起來(或 all-reduce,依 op 而定)。

**好處:**

- 把 activation 和權重按 GPU 數成比例縮小。
- 對非常寬的 model(大 hidden dim)很好用。

**壞處:**

- 通訊發生在層*內部*,不只是 step 和 step 之間。需要非常快的互連(一個 node 內的 NVLink)。
- 跨機器不 scale 得好 —— tensor-parallel 群組要放在*一個* node *裡面*,不要跨 node。

典型部署:在一個 node 內跑 4-way 或 8-way tensor-parallel(一個 NVLink 連通的群組),跨 node 才用 data parallel。

## Pipeline parallel —— 按層切

第 1–20 層住在 GPU 1,第 21–40 層在 GPU 2,以此類推。一個 batch 切成好幾個 micro-batch,這樣 GPU 2 在處理 micro-batch 1 的同時,GPU 1 可以開始處理 micro-batch 2。

**好處:**

- 每張 GPU 的 activation 記憶體大幅減少(每張 GPU 只住一個「stage」的層)。
- 通訊是鄰居對鄰居的點對點 —— 總流量比 all-reduce 少。

**壞處:**

- **Pipeline bubble:** 前面的 GPU 在等第一個 micro-batch 抵達時會閒置,後面的 GPU 在等最後一個 micro-batch 離開時也會閒置。batch 越小,bubble 越嚴重。
- 實作很細。除錯 pipeline schedule 是某個人的全職工作。

實務上,pipeline parallel 是在前沿規模訓練裡,和 tensor/data parallel 一起用的。大多數中小型訓練,直接跳過。

## 把它們組起來:3D parallelism

前沿規模訓練通常會組合:

- **Tensor parallel** 在 node 內(例如:在 NVLink 連通的 GPU 之間用 8-way TP)。
- **Pipeline parallel** 跨少數幾個 node。
- **Data parallel** 跨剩下的,而且常常是 sharded 的(FSDP/ZeRO)。

例子:在 512 張 H100 上訓練一個 70B model,可能用 8-way TP、4-way PP、16-way data parallel。拓撲是挑過的,目的是把重流量留在 NVLink 內,把輕流量放到 InfiniBand 上。

不是每個工程師都需要這套。一個團隊在 8–32 張 GPU 上 fine-tune 一個 7B 或 13B model,光 FSDP 通常就很夠用。

## 通訊成本:隱形的瓶頸

分散式訓練在 node 之間就是個記憶體頻寬問題,程度不輸 GPU 內部的。關鍵指標:

- **NVLink 頻寬**(node 內 GPU 對 GPU):Hopper 大約 900 GB/s。非常快。
- **InfiniBand 頻寬**(node 之間):大約 400 Gb/s,即現代 cluster 上單張 NIC 大約 50 GB/s。比 NVLink 慢很多。

設計你的平行化方式時,要把最重的流量放在頻寬最大的地方。Tensor parallel 產生最多流量;要放在有 NVLink 的地方。Data parallel 的 gradient all-reduce 比較寬容;可以跑在 InfiniBand 上。

<div class="analogy" markdown>
一個 node 內,GPU 之間是透過一條快速的地區高速公路在對話。跨 node 之間,頻寬掉一個數量級。好的平行化規劃,會把講話最多的放在同一個房間裡,讓安靜的更新跨辦公室傳。
</div>

## MFU:要盯的那個數字

**Model FLOPs Utilization** 是「你在一個訓練 step 裡端到端實際跑出來的 FLOPs,佔理論 peak 的多少」。這是判斷「我這 cluster 有沒有用好」最好的單一指標。

好的目標:

- **調得好的 dense transformer 訓練在 30–50% MFU** 大約是 H100 BF16 當下的行情。更高就很棒了。
- **低於 25% MFU** 通常表示有瓶頸 —— activation 記憶體、通訊、或資料載入。
- **50%+** 是前沿實驗室會報的;要達到得靠對架構、精度、平行化的仔細共設計。

如果你的 MFU 很低,診斷順序:

1. data loader 有沒有讓 GPU 餓著?(查 CPU 使用率和 prefetch queue。)
2. 通訊時間有沒有佔整個 step 時間的一大塊?(NCCL profiling。)
3. 是不是被 activation 重新計算卡住?
4. 你的 tensor-parallel 群組有沒有跨出 NVLink 邊界?

## Checkpoint 和容錯

訓練跑很久。GPU 會壞。Checkpoint 不是可選的。關鍵考量:

- **Checkpoint 頻率。** 常常每 100–1000 步一次。太密會浪費頻寬;太稀一次失敗會失去好幾小時。
- **Checkpoint 大小。** 一個 FP32 主權重形式的 70B model 大約 280 GB。存去遠端儲存可能要幾分鐘。
- **Resume 行為。** 要測。很多團隊是真的壞了一次之後,才發現他們的 resume 不完全重現訓練。
- **Sharded checkpoint。** 現代框架會在 rank 之間平行地存 checkpoint;載入也是平行的。

## 成本現實

<div class="numbers" markdown>
<div class="cell"><div class="n">~$4/hr</div><div class="l">大 provider 的 on-demand H100 租金</div></div>
<div class="cell"><div class="n">~2M GPU-hours</div><div class="l">在 40% MFU 下訓練一個 70B model 跑 2T token</div></div>
<div class="cell"><div class="n">~$8M</div><div class="l">用上面的 list 價粗估的成本</div></div>
<div class="cell"><div class="n">~3 週</div><div class="l">在 4096 張 H100 上的 wall-clock 時間</div></div>
</div>

這也是為什麼大多數團隊*不*從零訓練。相對的,fine-tune 通常就是幾百 GPU-hour —— 接近 $1–10k 這個量級。

## 常見錯誤

- **該用 ZeRO-1 卻用了 ZeRO-3。** 記憶體不是問題時,多付了通訊成本卻沒好處。
- **Tensor-parallel 跨 node。** 效能會垮。把 TP 留在 NVLink 裡。
- **忽略資料載入。** 餓著的 GPU 就是慢的 GPU;有時瓶頸是資料 pipeline,不是 model。
- **不量 MFU。** 「訓練在跑」不是指標。bytes/sec 和 tokens/sec 才是。
- **跳過 warm-up。** Kernel 的 autotuning 和快取,前幾百步才會暖起來。measure 要在 warmup 之後。

## 一句話總結

分散式訓練就是「把訓練狀態裝上 cluster,同時讓通訊別擋在 critical path 上」—— 挑能讓 model 裝得下的最小平行化組合,量 MFU 確認 cluster 在動,而且在量到「真的需要」之前不要伸手去拿 3D parallelism。

回到[第四部分目錄](index.md)。

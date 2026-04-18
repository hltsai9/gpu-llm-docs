# 路徑二 —— ML 工程師

## 這是寫給誰的

你訓練過 model。也許是研究所時做過的 CNN、也許是在公司做過的推薦系統、也許你 2020 年 fine-tune 過 BERT,從此沒再碰過 transformer。現在你盯著一個 Llama 等級的 decoder,團隊裡有人開始問「我們可以在一張 A100 上 QLoRA 這個嗎?」還有「我們要 ZeRO-3 還是 FSDP 就夠了?」這類問題。你想要從「我知道 transformer 是什麼」,變成「我能對 fine-tune 和部署做出有根據的決定」。

## 目標

走完這條路徑之後,你會:

- 用具體數字解釋 model 在訓練 vs. 推論時各需要多少 VRAM,以及每個 byte 花到哪裡去了。
- 有智慧地在 full fine-tuning、LoRA、QLoRA、DPO 之間做選擇。
- 建起一個分散式訓練任務,而且不靠黑魔法 —— 知道自己在用哪一軸的 parallelism,為什麼。
- 為部署量化一個 model,並且知道你犧牲掉了多少準確度。
- 讀得懂一次訓練跑出來的 performance log,分得出真正的瓶頸(而不是只看到「GPU utilization 很低」)。

## 先備知識

對 PyTorch 熟悉。一些線性代數。你至少刻意地跑過一次 backward pass。

## 這條路徑

### 第一步 —— 把硬體的底子打穩

這是 ML 背景的人最想跳過的一步。別跳。現代 LLM 訓練流程之所以長成這個樣子,原因就在底下的硬體形狀。

1. [自助餐廳 vs. 牛排館](../01-why-gpu/cpu-vs-gpu.md)
2. [SIMT —— 同步運作的廚房](../01-why-gpu/simt.md)
3. [記憶體階層](../02-gpu-architecture/memory-hierarchy.md) —— 對你來說最重要的一章硬體章節。
4. [Tensor Core:專業級電動工具](../02-gpu-architecture/tensor-cores.md) —— 為什麼 BF16/FP8 不是「精度低一點而已」,而是一個硬體速度旋鈕。
5. [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) —— 所有最佳化故事到最後都會收斂到這個心智模型。

**帶走的重點:** 大多數「我訓練很慢」的 bug 是記憶體頻寬 bug,不是運算 bug。在碰 optimizer 之前,先知道自己在 roofline 的哪裡。

!!! warning "誤解檢查點"

    **「GPU 用量到 100% 代表表現很好。」** 聽起來更接近真的的親戚說法:*「CPU 到 100% 就代表它是瓶頸 —— 升級它。」* 對 CPU 而言,是的。但在 GPU 上,`nvidia-smi` 顯示 100% 只代表這段取樣時間內 GPU *有事情做* —— 它不告訴你那件事是不是把 tensor core 餵飽了,或者(更常見的)是不是卡在 HBM 讀取上。你的訓練可以「100% 用滿」,但實際只跑在 peak FLOPs 的一小部分。你真正該看的是 *tokens/sec*(訓練情境),或是 *MFU*(model FLOPs utilization)—— 典型值是 30–50%,不是 100%。

### 第二步 —— 訓練 vs. 推論:兩個不同的工作

新章節:[訓練 vs. 推論](../04-training/training-vs-inference.md)。涵蓋 activation、gradient、optimizer state、KV 快取、mixed precision,以及每個階段的 VRAM 數學。會有一個完整範例:一個 7B model 用 FP16 vs. BF16 vs. FP8 訓練時各要多少記憶體,以及為什麼同一個 model 拿來 serve 時記憶體需求會少 5 倍。

**帶走的重點:** 粗略估算是「參數 × bytes」。真正的估算是「參數 × bytes × 訓練約 5–6 倍、推論約 1–2 倍」。訓練時記憶體的主角是 optimizer state,不是 weight。

!!! warning "誤解檢查點"

    **「70B 的 model 需要 70B 參數大小的 GPU 才能訓練。」** 聽起來更接近真的的親戚說法:*「要打開一個 140GB 的檔案,我需要 140GB 的 RAM。」* 訓練真實需要的數字大約是 model byte 足跡的 6 倍,因為 Adam 會保存一階和二階動量(額外 2 倍)、你需要 gradient(額外 1 倍)、你需要和「batch × sequence × layer」成正比的 activation(通常是*最大*的那一項),再加上 model 權重本身。一個 FP16 的 70B model,權重本身是 140GB,而如果只是單純做 sharding,*訓練時的狀態*大約落在 1.5–2TB。

### 第三步 —— fine-tuning 的光譜

新章節:[Fine-tuning 光譜](../04-training/fine-tuning-spectrum.md)。Full fine-tuning、LoRA、QLoRA、adapter、prefix tuning、DPO、RLHF(概念層)。一張決策樹:給定你的資料、目標、GPU 預算,你該選哪一個?

**帶走的重點:** 每一種方法改動的是不同的一組參數。要怎麼選,主要看 (a) 你需要把行為移動多遠、(b) 你有多少資料、(c) 你有多少運算資源。不是「最新的就是最好的」。

!!! warning "誤解檢查點"

    **「LoRA 永遠跟 full fine-tuning 一樣好。」** 聽起來更接近真的的親戚說法:*「low-rank 近似可以抓住大多數矩陣的大部分 signal。」* 常常是對的 —— 對於窄型任務(風格、格式、某個領域的詞彙),LoRA 的確可以抓到大部分有用的 signal。但它*抓不到*大幅度的能力轉變(例如教一個 base model 做數學,或說一種它本來很弱的語言)。那些「LoRA 媲美 full FT」的論文通常衡量的是窄任務;在能力型任務上,差距會拉大。請依任務型態挑,不要當 default。

!!! warning "誤解檢查點"

    **「要加知識就要 fine-tune。」** 聽起來更接近真的的親戚說法:*「把資料拿去訓練,就是把資料塞進 model 裡。」* 概念上成立,實務上不可靠。Fine-tune 傾向於改變分布和表面樣式,而不是記住事實,而且它*會*可靠地增加 hallucination —— 當 fine-tune 資料是事實性的,但 model 其實沒真的學到那些事實時尤其嚴重。知識用 RAG,風格/行為用 fine-tune。這是這個領域最貴的錯誤之一。

### 第四步 —— 讓它裝得下:量化

新章節:[量化(深入)](../04-training/quantization.md)。整數 vs. 浮點格式(INT8、INT4、FP8、BF16)、只量化權重 vs. 連 activation 一起量化、GPTQ、AWQ、GGUF、SmoothQuant,以及你實際上會犧牲多少精度。包含訓練感知量化(QAT)與訓練後量化(PTQ)。

把這件事跟 [roofline](../03-llm-inference/roofline.md) 扣回來:量化不只是省記憶體,它還提高 arithmetic intensity,也就是說它可以讓一個 memory-bound 的 model 照位數縮減的比例*加速*。

**帶走的重點:** 推論端的量化幾乎永遠是贏。訓練端比較微妙 —— 在你真的知道為什麼之前,請乖乖用 BF16/FP8(在硬體支援的前提下),不要用 INT8。

!!! warning "誤解檢查點"

    **「4-bit 會掉 1/4 的品質。」** 聽起來更接近真的的親戚說法:*「精度砍一半,品質大致也砍一半。」* LLM 的權重分布極度集中 —— 大多數 weight 都非常接近 0,而好的 4-bit 方案會很小心地處理尾端分布。現代 4-bit 量化在 70B 模型上,標準 benchmark 的掉幅通常 <2%,不是 75%。這個天真直覺來自於想 4-bit 音訊或 4-bit 影像,在那些場合每一個 bit 都很重要,因為分布更均勻。

### 第五步 —— 橫跨多張 GPU

新章節:[分散式訓練](../04-training/distributed-training.md)。三個 parallelism 軸(data、tensor、pipeline)、ZeRO 各階段、FSDP、什麼時候該伸手去拿哪一個,以及為什麼*前沿 model 的訓練配方大多是分散式系統的 code,不是 ML 的 code*。

**帶走的重點:** 先從 data parallel 開始。裝不下就加 FSDP / ZeRO-3。只有當 FSDP 的通訊成本壓過運算的時候才去動 tensor parallel。Pipeline parallel 是為特定拓撲準備的小眾工具。

!!! warning "誤解檢查點"

    **「GPU 越多,速度等比例越快。」** 聽起來更接近真的的親戚說法:*「在可平行的工作上,10 人團隊比 1 人團隊快 10 倍。」* 對 embarrassingly parallel 的工作大致成立。但在分散式訓練裡,通訊 overhead 會隨節點數增加而放大,而到某個叢集規模,interconnect(NVLink、InfiniBand)就會變成瓶頸。大約超過 64 張 GPU 之後,你會開始看到明顯的邊際報酬遞減,除非你換一套 parallelism 策略。這也是為什麼大叢集看的是 MFU,不只是「GPU 張數」。

### 第六步 —— 功夫:真的會動的訓練

- [慢慢講清楚 Attention](../03-llm-inference/attention.md) —— 現在換成訓練視角再讀一次。
- [KV 快取](../03-llm-inference/kv-cache.md) —— 再讀一次,現在那些數字對你的意義不一樣了。
- FlashAttention(在 [roofline](../03-llm-inference/roofline.md) 裡有引用)—— 知道它為什麼有幫助、什麼時候沒幫助。

**帶走的重點:** 訓練現代 LLM 的核心,大多是把資料留在晶片上。Flash 式的 kernel、gradient checkpointing(用運算換記憶體)、activation offloading、細心的 batch shape,是主要工具。

### 第七步 —— 不是只看 loss 曲線的 evaluation

把開發者路徑裡的 [Evals](../06-building/evals.md) 當起點,再加上標準 LLM benchmark。關鍵洞察:訓練 loss 會平滑下降,但下游能力是以突然跳躍的方式出現的。*Loss 是一個 proxy 的 proxy。* 永遠要用你真正在乎的任務來評估。

!!! warning "誤解檢查點"

    **「loss 越低 = model 越好。」** 聽起來更接近真的的親戚說法:*「fit 得更好的 model 是更好的 model。」* 對大多數傳統 ML 而言是對的。對 LLM 而言,*loss 衡量的是對下一個 token 分布的校準,不是能力。* 兩個同樣 loss 的 model,在下游表現上可能差很多 —— 而一個在某個領域過度訓練的 model,可以 loss 很低、泛化卻很差。兩樣都要用:loss 看訓練健康度,真實的 eval 看 model 品質。

## 誤解總表

| 誤解 | 它從哪裡來 |
|---|---|
| GPU util 100% = 好 | 我們讀 CPU 用量的習慣。 |
| 要 model 大小的 GPU 才能訓練 | 把記憶體當成硬碟看。 |
| LoRA 總是跟 full FT 一樣好 | 從線性代數來的 low-rank 直覺。 |
| 用 fine-tune 加事實 | 「訓練就是教。」大多時候它改的是風格。 |
| 4-bit = 25% 品質 | 天真的 bit 數直覺。 |
| GPU 多 = 等比例快 | Amdahl 忘了算通訊成本。 |
| loss 低 = model 好 | 把傳統 ML 的衛生觀念套到不同目標上。 |

## 檢查點

在你說這條路徑走完之前:

1. 一個 70B model,FP16,在 2048 token 序列、batch 8 上用 Adam 訓練。在 32 張 GPU 的 FSDP ZeRO-3 下,估算每張 GPU 的總訓練記憶體。寫出你的計算。
2. 你把一個 13B base 用 QLoRA 改成了客服助理。eval 在你的測試集上看起來很棒。PM 把它出貨了。兩週後,當使用者問一個新產品時品質下滑。發生了什麼事?修法是什麼?
3. 你的 H100 訓練跑顯示 35% MFU。這是好還是壞?說明你接下來會檢查的三件事。
4. 列出三個你*不會*選 LoRA 的情境。
5. 團隊想切到 FP8。走過你在扳下開關之前會量的東西。

如果這五題都答得從容,你就過了那道裂谷。

下一條路徑:[產品經理 →](product-manager.md) · 回到[所有路徑](index.md)

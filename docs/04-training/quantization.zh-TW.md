# 量化(深入)

一個 neural network 的權重就是一堆數字。這些數字可以用很多種格式存:FP32(4 bytes)、FP16 或 BF16(2 bytes)、FP8(1 byte)、INT8(1 byte)、INT4(0.5 bytes)。**量化**就是「用比較小的格式存,又不把品質毀掉」的手藝。

每一個實際上在營運或部署 LLM 的人,都得想清楚這件事,因為這是對記憶體和速度影響最大的那個旋鈕,沒有之一。

## 為什麼這件事居然成立

訓練好的 LLM 權重*不是*均勻分布的。它們集中在 0 附近,偶爾有大的 outlier。這種分布**不需要 32 bit 才能表示得好**。一個設計得當的 4-bit 方案,可以抓住重要資訊 —— 相對大小和正負號 —— 只丟掉那些對輸出品質不重要的小細節。

<div class="analogy" markdown>
音訊通常錄在 16 或 24 bit,因為耳朵分得出差別。但「一首典型歌曲的振幅密度直方圖」大致上是均勻的 —— 每一個 bit 都有用。neural network 權重的直方圖比較像一堆沙:0 附近一個大尖峰,後面長長一條細尾巴。如果你把 bit 花在質量集中的地方,就能存得非常緊實。
</div>

這也是為什麼「4-bit」聽起來嚇人(3/4 的 bit 都不見了!)但常常只會在 benchmark 上掉 1–2 分。這不是亂丟 bit;這是針對某一種特定分布形狀所做的有針對性壓縮。

## 各種 bit 寬度,分別代表什麼

<div class="numbers" markdown>
<div class="cell"><div class="n">FP32</div><div class="l">4 bytes —— 訓練預設,對推論而言過頭</div></div>
<div class="cell"><div class="n">BF16</div><div class="l">2 bytes —— 寬動態範圍、精度一般;訓練 + 推論</div></div>
<div class="cell"><div class="n">FP16</div><div class="l">2 bytes —— 動態範圍較窄、較麻煩;多半是舊系統</div></div>
<div class="cell"><div class="n">FP8</div><div class="l">1 byte —— 新硬體支援;訓練 + 推論</div></div>
<div class="cell"><div class="n">INT8</div><div class="l">1 byte —— 廣泛支援;推論</div></div>
<div class="cell"><div class="n">INT4</div><div class="l">0.5 bytes —— 僅推論,需要小心</div></div>
</div>

**BF16**(bfloat16)有 8 bit 指數、7 bit 尾數 —— 它和 FP32 有一樣的動態範圍,但精度沒 FP32 那麼高。這讓它在訓練時很穩,也是為什麼它是現代硬體上的 default。

**FP16** 有 5 bit 指數、10 bit 尾數 —— 比 BF16 精度更好,但動態範圍更小,會造成訓練不穩定(gradient 會 overflow)。拿來做推論則沒問題。

**FP8** 比較新(NVIDIA Hopper 以後才有)。有兩種子格式:E4M3(4 指數、3 尾數,給權重/activation)和 E5M2(5 指數、2 尾數,給 gradient)。tensor core 有支援,能對訓練帶來實質加速。

**INT8 和 INT4** 是整數格式。權重存成小整數,另外帶一個 scale factor(有時再加上一個 zero point)。運算時,權重會被反量化回作用格式(通常是 BF16 或 FP16)再做乘法。關鍵洞見是:*儲存和搬運*權重用 4-bit,省下的是記憶體和頻寬,而這正是記憶體受限推論真正在乎的事情(見 [roofline](../03-llm-inference/roofline.md))。

## 權重量化 vs. activation 量化

大多數實際用的 LLM 量化是**只量化權重**:權重存成 INT4/INT8,activation 保持在 BF16。這樣就能拿到容量和頻寬上的大勝利(HBM 流量主要是權重造成的),又避開了麻煩的那一塊。

**activation 量化**把 runtime 的 tensor 也一起量化。更難,因為 activation 有不容易壓縮的 outlier,而且不同層的 scale 差很多。SmoothQuant(2022)和 ZeroQuant(2022)是讓 activation 量化真正能用的關鍵論文。production 的 inference server 通常只有在要榨最後 20–30% throughput 時才會用 activation 量化。

## Calibration:大家會跳過的那一步

Post-training quantization(PTQ)不是單純把權重四捨五入 —— 它會在一個小資料集(通常 128–512 個樣本)上跑一次 *calibration pass*,量實際的 activation 和權重分布,再選出能保住重要質量的 scale factor。

- **GPTQ**(2022)—— 用少量範例做一層一層的 calibration。4-bit 品質不錯。一個 70B model 大約 10 分鐘到 1 小時可以校完。
- **AWQ**(2023)—— 觀察到只有少數幾個百分比的權重特別重要(「salient」),就保住那些的精度,其他量得更兇。比 GPTQ 快,品質常常還稍微更好。
- **GGUF** —— 是一種檔案格式(不是演算法),llama.cpp 和 Apple Silicon 生態系在用。它包了幾種量化方案(Q4_K_M、Q5_K_M、Q6_K 等等),各自在精度上取不同的權衡,針對 CPU 和統一記憶體 GPU 做調校。

GPTQ / AWQ / GGUF 之間要選哪一個,主要看你要部署在哪:

- **資料中心 NVIDIA GPU:** GPTQ 或 AWQ,搭配 vLLM 或 TensorRT-LLM。
- **CPU / Apple Silicon / edge:** llama.cpp 上的 GGUF。

## QAT vs. PTQ

- **Post-Training Quantization(PTQ):** 把已經訓練好的 model 量化。很快(幾分鐘到幾小時),大多 model 在 INT8 上、前沿 model 在 INT4 上都能有好的表現。
- **Quantization-Aware Training(QAT):** 在訓練過程中就模擬量化,讓 model 自己去適應那些 round。激進 bit 寬度下品質最好,但要付訓練時間。只在 PTQ 無法過門檻時用。

以 2025 年的 LLM 而言,PTQ 是壓倒性的 default;QAT 只留給研究或極端壓縮目標。

## 精度:你實際上在交換什麼

公開報告裡的一些具體數字,給參考 model 家族用:

| 精度 | 對 FP16 的 MMLU 差異 | 備註 |
|---|---|---|
| BF16 | ~0 | 大多任務和 FP16 分不出差別 |
| FP8 | ~0 到 -0.5 | 大多 model 上接近無損 |
| INT8 權重量化 | ~0 到 -1 | 基本上免費 |
| INT4(GPTQ/AWQ) | -1 到 -3 | 看得見,但對大多應用可接受 |
| INT3 / INT2 | -5 或更糟 | 研究領域 |

帶走的重點:**量到 INT4 對大多應用而言幾乎是免費的**。低於 4 bit,品質掉的速度會比省下來的資源更快。

!!! warning "誤解"
    **「4-bit 會丟掉 75% 的品質。」** Bit 數不是品質;一個分布裡的*可用資訊量*才是。因為 LLM 權重高度集中,你可以丟掉很多 bit 卻不太損失品質。這也是為什麼現代 4-bit 的 70B model 在標準 benchmark 上,和它們的 BF16 版本只差一兩個百分點。如果你是從音訊或影像領域過來的 —— 那邊 bit 的貢獻比較均勻 —— 這結果看起來可能很可疑。它其實沒問題;分布真的就是不一樣。

## 量化換到了什麼

記憶體和頻寬,比例就是 bit 的縮小幅度:

- 一個 70B model 在 BF16:140 GB。單張 H100(80GB)裝不下。
- 一個 70B model 在 INT4:35 GB。單張 H100 輕鬆裝得下,還留下空間給 KV 快取和 activation。

頻寬的改善在記憶體受限的推論上會直接變成 throughput。如果 decode 是記憶體受限(通常就是),從 FP16 換到 INT4 會讓同一張 GPU 的 tokens/sec 大約變成 4 倍。

<div class="numbers" markdown>
<div class="cell"><div class="n">4×</div><div class="l">記憶體縮減,FP16 → INT4</div></div>
<div class="cell"><div class="n">~3–4×</div><div class="l">記憶體受限推論上的 decode throughput 提升</div></div>
<div class="cell"><div class="n">&lt;2%</div><div class="l">一個好好 calibrate 過的 INT4 70B model 典型 MMLU 損失</div></div>
</div>

## 量化什麼時候會反咬一口

- **小 model(1–3B)。** 冗餘比較少;激進量化傷害更大。
- **長尾任務。** Benchmark 是平均出來的,但特定任務(數學、多步推理、稀有語言)可能掉得不成比例。永遠要用*你的*任務來測。
- **已經在低精度下訓練過的 model。** 如果一個 model 本來就是用 FP8、或用 INT4 的 QAT 訓練出來的,再更激進地量化就沒什麼餘裕可用。
- **不尋常的架構。** Mixture-of-experts(MoE)、用特殊 attention 變體、或 hidden 維度非常寬的 model,用現成工具有時校不乾淨。

## 訓練時是另一套規則

訓練時要對權重量化困難得多,因為 gradient 比權重更吵、動態範圍更大。實務上的規則是:

- **BF16 計算 + FP32 主權重**是主流 default(mixed precision)。
- **FP8 訓練**(transformer-engine、MS-AMP)在 Hopper+ 硬體上可以拿到 ~1.5–2× 加速;不過要開通不是一個 flag 而是一個專案。
- **INT8 或 INT4 訓練**截至 2025 年還是研究領域。

對低精度的 fine-tune 而言,**QLoRA** 是那個「例外證明規則」的例子:凍結的 base 用 INT4 保存,但*可訓練*的 LoRA adapter 保持 BF16,而且反量化的數學是小心設計過、以保住 gradient 品質的。(見 [fine-tuning 光譜](fine-tuning-spectrum.md)。)

## 部署時的一條大原則

如果你在 serve 一個 LLM,而且還沒量化,你大概在付 2–4 倍的不必要成本。2025 年大多數 open-source model 的部署預設精度,通常是以下之一:

- **INT8 權重量化** —— 接近無損、支援廣泛。
- **FP8** —— 在 Hopper+ 上;也可以套在 activation 上。
- **INT4(GPTQ 或 AWQ)** —— 記憶體吃緊的環境、或想把每張 GPU 的 throughput 撐到最大時用。

挑一個你的 serving 框架和 GPU 原生加速的版本,跑你的 eval 確認品質可以接受,大概就在對的位置了。

## 一句話總結

量化利用了「LLM 權重分布高度集中」這件事:你可以用遠少於名目精度的 bit 存它們,回收記憶體和頻寬,只付出很小的品質代價 —— 又因為推論是記憶體受限的,省下來的頻寬幾乎直接變成 throughput。

下一章:[分散式訓練 →](distributed-training.md)

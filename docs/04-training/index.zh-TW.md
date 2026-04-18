# 第四部分 —— 訓練與 Fine-Tuning

第一到第三部分回答了「LLM 在跑的時候,GPU 在做什麼?」這個問題。答案聚焦在推論 —— 一次 forward pass、一個新 token。第四部分打開另一扇門:*model 的權重一開始是怎麼被調出來的,以及我們要怎麼去改它?*

<div class="hero" markdown>

訓練和推論表面上看起來很像 —— 都是把 tensor 推進同一張 graph —— 但它們的效能特性、記憶體預算、失敗模式差異之大,幾乎可以當成兩種不同的工作負載。一張當 serving 很快樂的 GPU,換到訓練就會整個垮;一份為 512 張 GPU 調出來的訓練配方,拿到 4 張上看起來會完全不一樣。

</div>

## 從推論到訓練,哪些東西變大了

三件事會變得大很多:

1. **多了一個 backward pass。** 每一個 forward 的 op,都有一個對應的 gradient op。粗估運算量乘以 2。
2. **activation 必須留著。** 你在 forward pass 的時候,會存下中間的 tensor,好讓 backward pass 用。對長序列和深 model 來說,activation 可以是*最大*的記憶體項目 —— 比權重還大。
3. **optimizer 會保有狀態。** Adam 會為每一個參數多保留兩個 tensor(一階和二階動量)。那是在權重本身之外,*再*加一份 2 倍的權重大小。

加起來之後:訓練一個 model 的記憶體,通常是它推論記憶體的 5–6 倍。這條事實幾乎解釋了這部分裡所有的配方。

## 這部分有什麼

- [訓練 vs. 推論](training-vs-inference.md) —— 記憶體的算術,附上可以放在腦中的數字。
- [Fine-tuning 光譜](fine-tuning-spectrum.md) —— full FT、LoRA、QLoRA、DPO/RLHF。每一個什麼時候才是對的工具。
- [量化(深入)](quantization.md) —— FP16、BF16、FP8、INT8、INT4;在精度上你付了什麼,在容量上你得到什麼。
- [分散式訓練](distributed-training.md) —— data / tensor / pipeline parallel;FSDP 與 ZeRO 各階段;什麼時候伸手去拿哪一個。

## 一句話總結

你很少會需要從零訓練一個 foundation model。你常常需要 fine-tune 一個。Fine-tune 做得好,關鍵在 (a) 為你的目標挑對 fine-tune 的*種類*、(b) 把數學壓在記憶體預算之內、(c) 用你真正在乎的任務去評估結果 —— 不是用訓練 loss。

從 [訓練 vs. 推論 →](training-vs-inference.md) 開始。

# Fine-tuning 光譜

「Fine-tuning」是產業用來指大約六種不同操作的同一個詞。它們共享的概念是「從一個預訓練過的 model 出發,讓它在某件事上變得更好」,但它們在「哪些參數會改」、「改多少」、「用哪一種回饋」這些問題上差很多。挑錯了方法,是最常見的訓練預算浪費原因。

<div class="hero" markdown>

光譜從最小到最大足跡:**prompt engineering → 少量 in-context 範例 → retrieval → prefix/adapter tuning → LoRA → QLoRA → full fine-tuning → continued pretraining。**

每往右一階,改動 model 的幅度就更大,所需的資料、運算、小心程度也都更多。從能解決你問題的最便宜那端開始。不要因為下一階「聽起來比較強」就跳級。

</div>

## 為什麼會存在一個光譜

所有深度學習 model 都由兩件事型塑:訓練目標,以及資料。一個預訓練過的 LLM 是由「預測整個網路上下一個 token」這件事型塑的。想改它的行為,你可以:

- 改*推論時的輸入*(prompt engineering、RAG)。
- 改*一小組新的參數*,輕輕推動 model(LoRA、adapter)。
- 用新的目標改*所有參數*(full fine-tuning、DPO、RLHF)。
- 用來自新領域的大量新資料改*所有參數*(continued pretraining)。

每一個選項都在用運算和資料換「對行為更多的影響力」。影響力更大不一定更好 —— 太重的方法配上不夠的資料,會讓 model overfitting,並且在其他所有事情上變得更爛。

## 決策樹

在 fine-tune 任何東西之前,先問:

1. **我能不能用更好的 prompt 解決這個問題?** 常常可以,而且不花錢。
2. **我能不能把對的 context 餵給 model 來解決?** 如果是「model 不知道我們產品的細節」,這是 RAG 的地盤 —— 見 [RAG 基礎](../06-building/rag.md)。用 fine-tune 去塞事實,是一條昂貴又不穩定的窄路。
3. **我有沒有一個清楚想要的行為轉變?**(「一律用這個語氣/格式回答/拒絕像 X 這樣的請求。」)這才是 fine-tuning 真正擅長的事。
4. **我有沒有乾淨、有標的資料來教這個行為?** 幾百筆高品質的範例勝過幾萬筆中等品質的。
5. **行為範圍是窄還是寬?** 窄 → LoRA/QLoRA。寬 → 考慮 full FT 或 DPO。

如果第 1 或第 2 步就解掉了,*就停*。你完成了。把 prompting 或 RAG 就能解決的問題拿去 fine-tune,是這個領域頭號的 GPU 小時浪費。

!!! warning "學事實的陷阱"
    人們會想用 fine-tune 來「教 model 我們的資料」。大多時候這不會成功。用事實文本做 fine-tune,會把 model 的*風格*推向那些文本的分布,卻不會可靠地記住事實。model 學到的是「聽起來像自己知道」,不是「真的知道」。更糟的是,這會增加 hallucination:model 學到了你公司回答的*形狀*,卻沒有內容。事實請透過 RAG 塞進 context;fine-tune 留給格式、語氣、行為。

## 各種方法,依順序

### Prefix 與 adapter tuning

在每一層加進一小組新參數,接在前面或插在中間。凍結原來的權重,只訓練新加進來的。

- **記憶體足跡:** 很小(通常 < model 的 1%)。
- **容量:** 中等。對窄型改造有效。
- **什麼時候用:** 舊的選擇;大多被 LoRA 取代。你會在早期文獻裡看到。

### LoRA(Low-Rank Adaptation)

把對每個權重矩陣的*更新量*分解成一個 low-rank 乘積:$\Delta W = B A$,其中 $B$ 和 $A$ 是 rank 為 $r$ 的矩陣(常見 $r = 8, 16, 32, 64$)。只訓練 $A$ 和 $B$;凍結 $W$。推論時,要嘛分開存、要嘛訓練結束後把 $\Delta W$ 合併進 $W$。

- **記憶體足跡:** 可訓練參數約 model 總參數的 0.1–1%。但你還是要把被凍結的 $W$ 放在 VRAM 裡,加上整個 model 的 activation。
- **容量:** 對大多數窄型任務夠用。意外地強。
- **典型訓練記憶體:** ~1.5 倍推論記憶體。7B model 可以在單張 24GB GPU 上做 LoRA fine-tune。
- **資料需求:** 幾百到幾千筆範例。
- **注意:** 訓練時 base model 還是在 VRAM 裡。

<div class="analogy" markdown>
LoRA 是貼在每張食譜卡上的便利貼。食譜本本身沒動;你的增補小、可移除、存起來很便宜。你可以為不同廚房收集一整組便利貼包。
</div>

### QLoRA(Quantized LoRA)

把 LoRA 疊在一個 4-bit 量化、凍結的 base 上。base 權重以 4-bit 保存、LoRA adapter 以 BF16 訓練,而 forward 和 backward 時動態做反量化。

- **記憶體足跡:** base 那邊省得很兇。一個 70B model 可以在 2 張 A100(80GB)上做 QLoRA,甚至在小 batch 下單張 80GB 卡就可以。
- **容量:** 對大多數任務而言和 LoRA 差不多。偶爾因為 base 上的量化誤差而稍微差一點點。
- **典型訓練記憶體:** 約 4-bit base 的推論記憶體的 2 倍。
- **什麼時候用:** 只要 LoRA 是你的工具,而你又想在小硬體上 fine-tune 比較大的 base,就用 QLoRA。

QLoRA 已經是獨立開發者 / 業餘 / 新創在 fine-tune open-source model 時的 default。早點學起來。

### Full fine-tuning

所有權重都會被更新。Backward pass 為每一個權重算 gradient;optimizer 更新所有權重。

- **記憶體足跡:** 巨大。見 [訓練 vs. 推論](training-vs-inference.md) —— 大約是推論記憶體的 5–6 倍。
- **容量:** 最大。
- **資料需求:** 幾千到幾百萬筆範例,取決於你想把行為挪動多遠。
- **什麼時候用:** 當 LoRA 試過不夠的時候。當你在有規模地訓練、而且有運算資源的時候。當你需要能力層級的轉變,不只是風格層級。
- **風險:** 災難性遺忘。model 可能丟掉它原本會的能力(「我 fine-tune 了 code,它現在變得不太會寫詩」)。訓練混合通常要包含一些原始資料。

### Continued pretraining

數學上和 full fine-tuning 一樣,但資料長得像預訓練資料(大量、未標註、多樣),不是任務特化的範例。用來把一個 model 延伸到新的領域或語言。

- **資料需求:** 幾十億到幾兆 token。
- **運算需求:** 巨大。
- **什麼時候用:** 你在打造一個領域特化的 foundation model。除了大實驗室和資金充足的新創,很少人做。

## 偏好型 fine-tuning:DPO、RLHF 及同類

Fine-tune 的另一個分支不教 model「複製這個輸出」,而是「比起 B,更偏好 A」。資料是偏好對:兩份 completion,加上一個人類(或 AI)的判斷。

- **RLHF(Reinforcement Learning from Human Feedback):** 先用偏好訓練一個 reward model,再用 reinforcement learning(通常是 PPO)去更新 policy model,讓它產生高 reward 的輸出。ChatGPT 最初的技術。威力強,但操作複雜且不穩定。
- **DPO(Direct Preference Optimization):** 2023 年的重新表述,不需要另外的 reward model 或 RL loop,就能達到類似結果。訓練本身看起來和一般 supervised fine-tuning 很像。已經成為 open-source alignment 工作的 default。
- **KTO、IPO、ORPO:** 更近期的變種,各自在資料需求、穩定性、實作複雜度之間取捨。

什麼時候用偏好型方法:

- 你希望 model 偏好某些*風格*的回答(有幫助、無害、簡短)。
- 你有成對的偏好資料,不只是「一個正確答案」。
- 你想調的行為不容易被「一個正確答案」式的 supervised pair 抓到。

如果你 fine-tune 只是為了格式(「一律用這個 schema 回 JSON」),supervised fine-tuning 就好。如果是為了有幫助度或語氣,偏好資料和 DPO 通常更對味。

## 一張實用表

| 方法 | 可訓練參數 | base 保持凍結? | VRAM(7B) | VRAM(70B) | 什麼時候用 |
|---|---|---|---|---|---|
| Prompting / RAG | 0 | N/A | — | — | 「model 不知道 X」的首選。 |
| Adapter | ~1% | 是 | ~16 GB | ~140 GB | 舊方法;現在偏好 LoRA。 |
| LoRA | ~0.1–1% | 是 | ~20 GB | ~200 GB | 窄型風格/格式任務。 |
| QLoRA | ~0.1–1% | 是(4-bit) | ~8 GB | ~48 GB | 對小團隊最實用。 |
| Full FT(BF16) | 100% | 否 | ~120 GB | ~1.2 TB | 大規模能力轉變,資源足夠。 |
| DPO | 100% 或 LoRA | 可選 | 類似 | 類似 | 用偏好塑形行為。 |
| Continued pretraining | 100% | 否 | ~120 GB | ~1.2 TB | 領域 foundation model。少見。 |

(VRAM 欄是單 GPU、不做 sharding 的粗估;分散式訓練可以解鎖更大的 model —— 見 [分散式訓練](distributed-training.md)。)

## 常見錯誤

- **用 fine-tune 去加知識。** 用 RAG。(這章故意講了三次。)
- **資料太多、策展太少。** 用 500 筆高品質範例做 fine-tune,不要用 50,000 筆中等品質的。對窄型任務而言,品質壓過數量。
- **用訓練 loss 做評估。** Loss 會平滑下降;真實能力是跳躍式變化的。永遠要用留出來的、任務特化的範例來評估。
- **忘了 base 可能變過。** 如果你用客戶資料做了 LoRA,然後 vendor 更新了 base model,你的 adapter 可能要重新訓練。要預先規劃。
- **把方法過度工程化。** 如果在 default target module、default rank 上跑一個 LoRA 就行得通,就出貨。在這裡鑽 hyperparameter 的報酬很低,除非你已經在前沿。

## 一句話總結

把 fine-tune 方法配到能完成任務的最小變化:prompting 先於 RAG、RAG 先於 LoRA、LoRA 先於 full FT、supervised 先於 preference-based。每往上一階都更貴、也更有風險;報酬曲線是凹的,不是線性的。

下一章:[量化(深入) →](quantization.md)

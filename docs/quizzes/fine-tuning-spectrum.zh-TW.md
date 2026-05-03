# 測驗 —— Fine-tuning 光譜

六題,關於在 prompting → LoRA → full-FT 這段光譜上挑對工具。章節:[Fine-tuning 光譜](../04-training/fine-tuning-spectrum.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 使用者想讓 assistant 知道目前的產品目錄。哪種做法最可能有效?",
      "choices": {
        "A": "在產品目錄上做 full fine-tune,把目錄學進權重",
        "B": "RAG —— 查詢時從目錄抓對應內容塞進 prompt 作答",
        "C": "在目錄 PDF 上做 LoRA,讓 adapter 學進去",
        "D": "把 prompt 寫得更用力,要求 model 仔細記住"
      },
      "explain": "<p>Fine-tuning 教的是<em>風格</em>,不是事實。在事實文字上訓練,模型學會「聽起來像知道」,不是「真的知道」,反而更常 hallucinate。RAG 把事實放在 context 裡,新鮮、可審計。這是 2025 年 fine-tuning 的第一條規則:不要用 fine-tuning 灌知識。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> QLoRA 相對於標準 LoRA 的主要記憶體優勢是什麼?",
      "choices": {
        "A": "可訓練參數變 10× 小,adapter 體積大幅縮減",
        "B": "QLoRA 完全不需要 gradient,純向前推算就能訓練",
        "C": "凍住的 base 用 4-bit 精度存,靜態權重的 VRAM 大幅下降",
        "D": "QLoRA 跑在 CPU 上,完全不需要 GPU 記憶體"
      },
      "explain": "<p>QLoRA 把 base 量化到 4-bit 靜態存著(要算時才 dequant),LoRA adapter 訓練仍用 BF16。這就是 70B 模型能塞進單張 80GB GPU 的原因 —— 標準 LoRA 的 BF16 base 做不到。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> LoRA 裡的 rank <em>r</em> 是什麼?",
      "choices": {
        "A": "兩個小矩陣 B 和 A 的中間維度,B·A 的乘積構成 ΔW",
        "B": "訓練要用的 GPU 數量,值越大同步成本越高",
        "C": "要 adapt 的層數,值越大覆蓋越多 transformer block",
        "D": "Adapter 的 learning-rate 倍率,跟更新強度有關"
      },
      "explain": "<p>LoRA 把權重更新寫成 ΔW = B·A,B 和 A 是 rank-r 的矩陣(常見 r = 8、16、32、64)。Rank 決定了更新的表現力;r 越高容量越多、可訓練參數也越多。多數 narrow 任務,r=16 或 32 就很夠。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 什麼情況下,<em>full</em> fine-tuning(更新全部權重)比 LoRA 明顯是對的選擇?",
      "choices": {
        "A": "隨時都比 LoRA 好,因為更新範圍涵蓋所有參數",
        "B": "只有單張消費級 GPU 時,full FT 才能跑得動",
        "C": "只有幾百筆範例時,full FT 較容易擬合",
        "D": "要大幅改能力(不只風格),資料量大、算力也付得起時"
      },
      "explain": "<p>Full FT 的記憶體是 LoRA 的 5–6 倍,還有 catastrophic forgetting 風險。只有在 LoRA 試過證明不夠、資料量和算力也跟得上時,才是對的工具。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> DPO(Direct Preference Optimization)訓練的資料和 supervised fine-tuning 有什麼不同?",
      "choices": {
        "A": "純文字文件(沒標籤),用 next-token 損失",
        "B": "一對對的 completion,附帶偏好標籤(A 比 B 好)",
        "C": "對齊 caption 的圖像,做圖文匹配訓練",
        "D": "Base model 訓練時記下來的梯度 norm 序列"
      },
      "explain": "<p>DPO 用的是<em>成對偏好</em>資料。給兩個 completion,標哪個比較好。2024 年後變成 open-source alignment 的預設,因為它能得到 RLHF 類似效果,但不需要另外的 reward model 或 RL 迴圈 —— 訓練簡單得多。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 有 50,000 筆普通訓練資料,和 500 筆精心整理的。對 narrow 任務,哪個通常 fine-tune 效果更好?",
      "choices": {
        "A": "50,000 筆普通的 —— 對 fine-tune 來說資料越多永遠越好",
        "B": "500 筆整理過的 —— narrow 任務,品質遠比數量重要",
        "C": "兩者實務上效果差不多,模型容量足以處理雜訊",
        "D": "都不重要,只看 learning rate 跟訓練步數調得好不好"
      },
      "explain": "<p>Narrow SFT 時,好資料的形狀比體積重要得多。500 筆高訊號資料通常打得過 50,000 筆雜訊資料 —— 後者甚至會把模型推向錯的分布。這也是為什麼資料整理是 fine-tuning 裡最花工的部分。</p>"
    }
  ]
}
</script>

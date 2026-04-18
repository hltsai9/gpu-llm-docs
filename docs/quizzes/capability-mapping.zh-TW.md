# 測驗 —— 能力地圖

六題,關於 Green/Yellow/Red 的能力判讀,以及怎麼校準它。章節:[能力地圖](../07-strategy/capability-mapping.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> PM 在 scope 一個 LLM 功能,一律標「可以,model 做得到」。為什麼這是風險模式?",
      "choices": {
        "A": "永遠對 —— 現在 LLM 什麼都能做",
        "B": "忽略成本;「能/不能」是關於預算",
        "C": "多數失敗的 AI 產品,是把 Yellow(要 guardrail 和 eval 才跑得動)當 Green(可穩定上線)出貨。二分法漏掉的是中間 —— 拒答路徑、人工複核、eval、窄 scope",
        "D": "法務會反對二分主張"
      },
      "explain": "<p>能力地圖有三個顏色,不是兩個。Green 用正常工程紀律就能上;Yellow 行得通,但要 guardrail、eval、人工 fallback;Red 還不夠穩。把 Yellow 錯標成 Green,是 LLM 功能最常見的產品失敗模式。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 2025 年,下列哪個是 Green(正常工程紀律就能穩)?",
      "choices": {
        "A": "已知文字的摘要、語氣/風格改寫、主要語言之間的翻譯、從結構良好的文件抽取、從短 label 清單做分類",
        "B": "從症狀描述做醫療診斷",
        "C": "自動 agent 不經人工核准就執行不可回復動作(送款、寄 email)",
        "D": "橫跨好幾天的長期規劃"
      },
      "explain": "<p>Green 能力的失敗率低<em>而且</em>失敗代價有界。醫療診斷、自動財務動作、長期規劃是 Red —— 不是因為 model 永遠錯,而是偶爾自信的錯誤代價不能接受。把 Green 出貨;Yellow 謹慎 scope;不要在 Red 上蓋東西。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 為什麼「專業領域(醫療、法律、法規)的事實召回」是 Red 不是 Green?",
      "choices": {
        "A": "Model 根本不懂這些領域",
        "B": "這些領域需要有牌的專業人士",
        "C": "API rate limit 擋下專業 query",
        "D": "Model 經常自信地錯 —— hallucination 在專家口吻裡聽起來合理,而錯誤代價又高。要用權威來源的檢索;絕不要依賴訓練資料回想"
      },
      "explain": "<p>失敗模式是「自信的合理」。被 hallucinate 出來的劑量或法條,看起來跟對的一模一樣。從權威 source 做 RAG 是唯一負責任的模式 —— 就算這樣,出到使用者之前通常還要專家複核。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Benchmark 顯示新 model 比你現在用的高 10 分。這對<em>你</em>的功能品質說了什麼?",
      "choices": {
        "A": "你的功能一定也會進步 10 分",
        "B": "它預測你的功能的表現,取決於你的功能跟 benchmark 有多像 —— 拿你真正的任務建一個 50 筆的 eval set,重新量",
        "C": "完全無關",
        "D": "Benchmark 分數是唯一值得信的訊號"
      },
      "explain": "<p>Benchmark 是過濾器,不是預測。它告訴你哪些 model 值得仔細看 —— 但真正告訴你使用者感受的數字,是你自己 eval set 的分數。拿 2–3 個候選 model 跑 50 筆來自真實 workload 的 case。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 對「大概很快會變好」的能力,正確的規劃方式是?",
      "choices": {
        "A": "現在就出貨,假設上線後 model 會補上差距",
        "B": "無限期等到那個能力明顯變 Green",
        "C": "產品架構按 Yellow 基線建(guardrail、eval、人工 fallback),等可靠度成長再放鬆 —— 主要 model 版本釋出後重新跑 eval,抓品質跳升",
        "D": "寫個 prompt 叫 model 更努力"
      },
      "explain": "<p>不要把 roadmap 賭在「它會變好」上。但要蓋得能吃到紅利:guardrail 能放鬆、人工複核從必要改成抽樣、tool 的 scope 能擴大。Prompt 和 tool 穩住,model 升級大多只會是品質變好,不用大改 code。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 在 spec LLM 功能之前,以下哪個問題最值得先回答?",
      "choices": {
        "A": "失敗代價是什麼?Model 有 5% 答錯時,會怎樣 —— 是可回復的惱人、尷尬、法律曝險、還是真正的使用者傷害?",
        "B": "Model 在 MMLU 的準確率是多少?",
        "C": "哪家供應商 token 最便宜?",
        "D": "要不要自建?"
      },
      "explain": "<p>失敗代價驅動設計。低風險功能的可回復失敗,可以用基本拒答路徑以 Yellow 出貨。高風險失敗(醫療、法律、財務、隱私)可能要 Red → 等,或做 expert-in-the-loop。成本、託管、model 選擇,都是這個問題之下的。</p>"
    }
  ]
}
</script>

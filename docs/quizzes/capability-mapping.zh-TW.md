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
        "A": "永遠對 —— 現在 LLM 幾乎什麼都能做,二分框架在業界知識裡只是過度簡化的偽問題",
        "B": "忽略成本和 SLA 風險:「能/不能」沒充分考慮預算制約與長期營運權衡的層次",
        "C": "失敗的 AI 產品把 Yellow(要 guardrail 和 eval)當 Green 出貨;漏了拒答、人工、窄 scope",
        "D": "法務會反對二分主張,要求所有上線功能都加上法律部門起草的風險免責聲明"
      },
      "explain": "<p>能力地圖有三個顏色,不是兩個。Green 用正常工程紀律就能上;Yellow 行得通,但要 guardrail、eval、人工 fallback;Red 還不夠穩。把 Yellow 錯標成 Green,是 LLM 功能最常見的產品失敗模式。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 2025 年,下列哪個是 Green(正常工程紀律就能穩)?",
      "choices": {
        "A": "已知文字的摘要、語氣/風格改寫、主要語言翻譯、結構良好文件抽取、短 label 清單分類",
        "B": "從症狀描述做醫療診斷,即使領域微調也因為合理聽起來的錯誤風險高",
        "C": "自動 agent 不經人工核准就執行不可回復動作,例如送款或寄信給使用者",
        "D": "橫跨好幾天的長期規劃,需要跨 API 呼叫的一致推理和狀態追蹤"
      },
      "explain": "<p>Green 能力的失敗率低<em>而且</em>失敗代價有界。醫療診斷、自動財務動作、長期規劃是 Red —— 不是因為 model 永遠錯,而是偶爾自信的錯誤代價不能接受。把 Green 出貨;Yellow 謹慎 scope;不要在 Red 上蓋東西。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 為什麼「專業領域(醫療、法律、法規)的事實召回」是 Red 不是 Green?",
      "choices": {
        "A": "Model 在訓練資料從沒見過這些領域,無法學習專門術語",
        "B": "這些領域需要有牌的專業人士,所以執業法禁止任何 model 回答相關問題",
        "C": "API rate limit 擋下專業 domain query,防止從供應商可靠地檢索參考資料",
        "D": "Model 經常自信地錯 —— hallucination 在專家口吻裡聽起來合理,錯誤代價又高;只能用權威來源檢索"
      },
      "explain": "<p>失敗模式是「自信的合理」。被 hallucinate 出來的劑量或法條,看起來跟對的一模一樣。從權威 source 做 RAG 是唯一負責任的模式 —— 就算這樣,出到使用者之前通常還要專家複核。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Benchmark 顯示新 model 比你現在用的高 10 分。這對<em>你</em>的功能品質說了什麼?",
      "choices": {
        "A": "你的功能一定也會進步 10 分,假設你的任務分布符合 benchmark",
        "B": "它預測你的功能表現,取決於你的功能有多像 benchmark — 在真實任務建 50 筆 eval set 重新量",
        "C": "大多無關;benchmark 表現很少和真實功能的成功相關",
        "D": "Benchmark 分數是評估 roadmap 上 model 變化的唯一值得信的訊號"
      },
      "explain": "<p>Benchmark 是過濾器,不是預測。它告訴你哪些 model 值得仔細看 —— 但真正告訴你使用者感受的數字,是你自己 eval set 的分數。拿 2–3 個候選 model 跑 50 筆來自真實 workload 的 case。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 對「大概很快會變好」的能力,正確的規劃方式是?",
      "choices": {
        "A": "現在就出貨上線,假設上線後 model 會補上差距,然後計畫之後再放鬆 guardrail",
        "B": "無限期等到那個能力明顯變 Green,即使是基礎功能、也許因此永遠等不到上線",
        "C": "Yellow 基線(guardrail、eval、人工 fallback),可靠度提升再放鬆;主要 model 出後重跑 eval",
        "D": "寫個 prompt 叫 model 更努力、在這個案例裡更謹慎,並提示要專注於準確度"
      },
      "explain": "<p>不要把 roadmap 賭在「它會變好」上。但要蓋得能吃到紅利:guardrail 能放鬆、人工複核從必要改成抽樣、tool 的 scope 能擴大。Prompt 和 tool 穩住,model 升級大多只會是品質變好,不用大改 code。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 在 spec LLM 功能之前,以下哪個問題最值得先回答?",
      "choices": {
        "A": "失敗代價是什麼?Model 5% 答錯時,是可回復的惱人、尷尬、法律曝險或真正的使用者傷害?",
        "B": "Model 在 MMLU(標準 AI 基準,測通識和推理)的準確率是多少?",
        "C": "哪家供應商 token 最便宜,或對你的請求量有最好的隨需計價?",
        "D": "要不要自建,部署在自己的基礎設施,或用託管 API endpoint?"
      },
      "explain": "<p>失敗代價驅動設計。低風險功能的可回復失敗,可以用基本拒答路徑以 Yellow 出貨。高風險失敗(醫療、法律、財務、隱私)可能要 Red → 等,或做 expert-in-the-loop。成本、託管、model 選擇,都是這個問題之下的。</p>"
    }
  ]
}
</script>

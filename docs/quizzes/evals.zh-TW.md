# 測驗 —— 真正可用的 eval

六題,關於用 eval 把 LLM demo 變成 production 功能。章節:[真正可用的 eval](../06-building/evals.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 為什麼經典 unit testing 不能直接搬到 LLM 功能?",
      "choices": {
        "A": "LLM 跑太慢不適合 unit test",
        "B": "LLM 在 sandbox 裡訓練,離開 sandbox 就失去能力",
        "C": "LLM 就算 temperature=0 也不 deterministic、多數 input 沒有單一正確答案、行為隨 model 更新漂移、失敗模式(自信的 hallucination)是安靜的,不是 exception",
        "D": "供應商禁止自動測試"
      },
      "explain": "<p>經典 test 用固定 input 對確定結果。LLM 功能需要另一種紀律 —— 比較接近對一個會進化的不穩外部服務做 integration test,再加上搜尋那種品質 metric。這也是為什麼 eval 不只是「一般 test」。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Eval 實務上的「golden dataset」是什麼?",
      "choices": {
        "A": "MMLU 之類的榜單 benchmark",
        "B": "50–200 筆具代表性、有已知好答案、版本控管的 input;任何 model/prompt 改動前都跑一遍,量準確率、品質、成本、延遲",
        "C": "所有 production 請求",
        "D": "OpenAI evals library 裡的 dataset"
      },
      "explain": "<p>Golden set 是 LLM 功能的 regression-test suite。從真流量、bug report、邊緣情況、對抗性 input 長出來。每次 prompt/model 改動都跑一遍。版本化、維持平衡、定期審計 —— 它的品質直接決定了你敢不敢說「可以上了」。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 用另一個 LLM 當 judge 評主觀輸出(摘要、改寫),常見要控制的 bias 是?",
      "choices": {
        "A": "Judge 永遠偏好負面輸出",
        "B": "Judge 只對分類任務有用",
        "C": "Judge 不能用於多輪對話",
        "D": "Position bias(A vs B 並排時偏好 A)、verbosity bias(偏好更長答案)、self-preference(model 給自己的輸出評較高分)。隨機化順序、控制長度、用不同 model 當 judge"
      },
      "explain": "<p>LLM-as-judge 意外有效,但有系統性偏差。隨機化比對順序可緩解 position bias;明定長度標準可緩解 verbosity;用不同 model 家族當 judge 可緩解 self-preference。再拿一小批人工評分驗校 judge,確認 calibration。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 以下哪些該先用<em>規則</em>檢查,再動用 LLM-as-judge?",
      "choices": {
        "A": "格式合規(是不是合法 JSON?符合 schema?)、必含字串、禁用語掃描、長度界限、citation 準確性(引用的 source 是不是都在?)",
        "B": "整體答案品質",
        "C": "語氣評估",
        "D": "答案「有沒有幫助」"
      },
      "explain": "<p>規則快、deterministic、免費。當第一層:output 是不是能 parse 成 JSON?必要欄位在不在?有沒有禁用語?LLM-as-judge 處理規則抓不到的主觀部分 —— 兩個一起跑,比什麼都交給 judge 又便宜又可靠。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 團隊有 RAG 系統。有用的<em>檢索</em>指標(相對於答案品質)是?",
      "choices": {
        "A": "最終答案的 BLEU 分數",
        "B": "對 temperature 的敏感度",
        "C": "Recall@K:正確 chunk 出現在 top K 檢索結果的比例 —— 直接量檢索有沒有把對的來源撈上來",
        "D": "產生的總 token 數"
      },
      "explain": "<p>RAG 要兩層 eval。檢索品質(Recall@K、MRR、NDCG)量你有沒有撈對文件。答案品質(faithfulness、correctness、citation 準確性)量 model 有沒有正確使用。許多 RAG 失敗其實是檢索失敗,被聽起來合理的答案遮掉。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 「Red-team set」為什麼有價值?它應該隨時間長什麼?",
      "choices": {
        "A": "是部署必備的法律文件",
        "B": "它蒐集刻意對抗性的 input —— prompt injection、jailbreak、資料外洩嘗試、tool 濫用模式 —— 新攻擊出現就補進去,每次部署前量防禦率",
        "C": "是另一套訓練 dataset",
        "D": "取代 golden set"
      },
      "explain": "<p>Red-team set 跟品質 eval 是不同軸:量的是功能能不能抵抗濫用。新的對抗性模式每個月都在冒;維持一個持續成長的 red-team set、部署前跑,讓 security 姿態變成可量測的,而不是口號。</p>"
    }
  ]
}
</script>

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
        "A": "LLM 推論速度太慢,不適合放進 unit test,整套測試 suite 會花過多時間跑完",
        "B": "LLM 是在 sandbox 裡訓練的,離開那個 sandbox 環境就會失去原本展示出來的能力",
        "C": "temperature=0 也不 deterministic、多數 input 無單一答案、行為隨更新漂移、失敗是安靜的",
        "D": "供應商在 ToS 上禁止自動化測試,違反呼叫頻率限制與 API 使用條款的可能"
      },
      "explain": "<p>經典 test 用固定 input 對確定結果。LLM 功能需要另一種紀律 —— 比較接近對一個會進化的不穩外部服務做 integration test,再加上搜尋那種品質 metric。這也是為什麼 eval 不只是「一般 test」。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Eval 實務上的「golden dataset」是什麼?",
      "choices": {
        "A": "MMLU 之類的公開榜單 benchmark,用來跟其他 model 比準確率",
        "B": "50–200 筆有代表性、附已知答案、版本控管;每次 prompt/model 改前都跑一遍",
        "C": "所有 production 請求的完整紀錄,當成 regression suite 對照新版本",
        "D": "OpenAI evals library 裡的 dataset,使用者透過 GitHub clone 下來"
      },
      "explain": "<p>Golden set 是 LLM 功能的 regression-test suite。從真流量、bug report、邊緣情況、對抗性 input 長出來。每次 prompt/model 改動都跑一遍。版本化、維持平衡、定期審計 —— 它的品質直接決定了你敢不敢說「可以上了」。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 用另一個 LLM 當 judge 評主觀輸出(摘要、改寫),常見要控制的 bias 是?",
      "choices": {
        "A": "Judge 永遠偏好負面輸出,把任何回答都評低分,以維持嚴格姿態與評分一致",
        "B": "Judge 只對分類類任務有用,評主觀題時會直接拒絕作答或在中途 timeout",
        "C": "Judge 不能用於多輪對話評估,因為會在 context 裡迷失、給出近乎隨機的分數",
        "D": "Position bias、verbosity bias、self-preference —— 隨機化順序、控長度、換 model 當 judge"
      },
      "explain": "<p>LLM-as-judge 意外有效,但有系統性偏差。隨機化比對順序可緩解 position bias;明定長度標準可緩解 verbosity;用不同 model 家族當 judge 可緩解 self-preference。再拿一小批人工評分驗校 judge,確認 calibration。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 以下哪些該先用<em>規則</em>檢查,再動用 LLM-as-judge?",
      "choices": {
        "A": "格式合規(JSON、schema)、必含字串、禁用語、長度界限、citation 來源是否真的存在",
        "B": "整體答案品質的綜合判斷,涵蓋語意、結構、幫助性、語氣多個維度",
        "C": "語氣評估,例如是否符合品牌聲音、有沒有過度正式或不夠親切",
        "D": "答案是否「對使用者有幫助」這類涉及主觀判斷的綜合屬性"
      },
      "explain": "<p>規則快、deterministic、免費。當第一層:output 是不是能 parse 成 JSON?必要欄位在不在?有沒有禁用語?LLM-as-judge 處理規則抓不到的主觀部分 —— 兩個一起跑,比什麼都交給 judge 又便宜又可靠。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 團隊有 RAG 系統。有用的<em>檢索</em>指標(相對於答案品質)是?",
      "choices": {
        "A": "最終答案的 BLEU 分數,跟 reference answer 比相似度",
        "B": "對 temperature 的敏感度,看不同設定下答案如何變動",
        "C": "Recall@K:正確 chunk 出現在 top K 結果的比例 —— 直接量檢索有沒有撈對來源",
        "D": "產生的總 token 數,反映 model 用了多少資源寫答案"
      },
      "explain": "<p>RAG 要兩層 eval。檢索品質(Recall@K、MRR、NDCG)量你有沒有撈對文件。答案品質(faithfulness、correctness、citation 準確性)量 model 有沒有正確使用。許多 RAG 失敗其實是檢索失敗,被聽起來合理的答案遮掉。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 「Red-team set」為什麼有價值?它應該隨時間長什麼?",
      "choices": {
        "A": "是部署必備的法律文件,監管機關要求必須準備一份用於審計",
        "B": "蒐集對抗性 input —— prompt injection、jailbreak、資料外洩、tool 濫用 —— 新攻擊持續加入,部署前量防禦率",
        "C": "另一套訓練 dataset,能拿來 fine-tune model 讓它更 robust",
        "D": "取代 golden set 成為新的 regression suite,不再需要原來的 quality eval"
      },
      "explain": "<p>Red-team set 跟品質 eval 是不同軸:量的是功能能不能抵抗濫用。新的對抗性模式每個月都在冒;維持一個持續成長的 red-team set、部署前跑,讓 security 姿態變成可量測的,而不是口號。</p>"
    }
  ]
}
</script>

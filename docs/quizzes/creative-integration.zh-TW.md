# 測驗 —— 創意工作流程整合

六題,關於寫作、圖像、生產的真實專案工作流程。章節:[創意整合](../08-creative/creative-integration.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 在描述的散文/部落格工作流程裡,誰(或什麼)寫 brief 和 outline?",
      "choices": {
        "A": "Model 兩個都寫",
        "B": "Collaborator 寫 brief;model 寫 outline",
        "C": "你 —— brief 和 outline 是你保留的創作工作;model 處理腦力激盪、過渡段落、機械式潤飾",
        "D": "另一個內容生成工具兩個都寫"
      },
      "explain": "<p>紀律就是分工:你守住創作(主張、聲音、具體觀察、節奏),model 處理機械(腦力激盪、填 context、潤滑)。角色反過來就會變平庸。Brief 和 outline 太 load-bearing 不能外包。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 行銷文案變體,推薦的工作流程是?",
      "choices": {
        "A": "寫一份非常清楚的 brief,生 10–20 個變體,砍 70%(會很平),在剩下 5–10 個有東西的上迭代,最後 2–3 個親手潤飾",
        "B": "生一個變體就出貨",
        "C": "叫 model 給自己打分、出貨分數最高的",
        "D": "複製競品廣告稍作修改"
      },
      "explain": "<p>行銷有格式也有變體;AI 的強項在這裡是真的。流程是:廣撒、狠砍、在有潛力的上迭代、最後手工潤飾。預期 70% 初始變體會很平 —— 那是分布正常在運作。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 團隊幫 CEO 代筆。對上口吻的關鍵實務是?",
      "choices": {
        "A": "餵 model 300 字,其餘讓它推斷",
        "B": "貼上 3,000–5,000 字、明確標記的本人既有寫作;跟 model 起草;<em>對著本人實際怎麼講話</em>來編輯,而不是對著其他 AI 輸出。早且勤地送草稿給本人確認",
        "C": "叫 model 想像 CEO 會怎麼寫",
        "D": "讓代筆自己選口吻"
      },
      "explain": "<p>代筆的口吻漂移特別貴,因為 CEO 不會像一個讀者那樣察覺。大量標記過的既有寫作、對著本人口吻編輯、頻繁確認 loop,就是這樣讓輸出仍是他們的,而不是安靜地變成以他們名義發的 AI 平均值。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 用 AI 做研究時,哪裡最該謹慎?",
      "choices": {
        "A": "幫你摘要你提供的 20 篇文章",
        "B": "找反方論點來壓測你的主張",
        "C": "Source 在 context 裡時比較三種立場",
        "D": "沒提供 source 就問事實問題,或要求特定 citation —— hallucination 風險高、citation 可能是編的;永遠對真實 source 驗證(或用 Perplexity 這類 retrieval-augmented 工具)"
      },
      "explain": "<p>AI 擅長處理你交給它的材料;不擅長從記憶裡撈冷僻事實,尤其不擅長編出看起來像真的 citation。任何需要引用的,用 retrieval-augmented 工具(Perplexity、你自己的 RAG)—— 再驗證 citation 真的存在、說的是工具聲稱的那樣。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> Production 等級的圖像生成(廣告、hero image、角色美術),典型可靠工作流程?",
      "choices": {
        "A": "Prompt 一次就出貨",
        "B": "自動生幾千張,讓使用者投票",
        "C": "用 reference 或 ControlNet 工作流程限制構圖;在 Photoshop/Figma 手工合成;upscale 並 inpaint 修 artifact(手、文字、小瑕疵);保留 seed 和 prompt 以求可重現",
        "D": "只用文字 prompt,絕不用 reference"
      },
      "explain": "<p>無限制生成到不了 production 等級的精準。能用的模式:限制結構(參考圖或 ControlNet)、最終作品用傳統工具合成各部件、upscale 與 inpaint 修 artifact、存 seed + prompt 以便 brief 變動時重現和調整。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 創意作品的 AI 揭露,推薦的判斷法則是?",
      "choices": {
        "A": "對聲音為主的工作(署名文章、代筆、當自己創作輸出販售的內容),AI 實質影響時就揭露;對機械性工作(研究協助、初稿翻譯、會議筆記、背景閱讀)則不需要",
        "B": "永不揭露 —— 客戶不想知道",
        "C": "所有事都揭露,連拼字檢查也是",
        "D": "客戶問才揭露"
      },
      "explain": "<p>客戶現在正在形成意見;走在對話前面勝過被對話追著跑。合理框架:AI 實質塑造了以聲音或作者身分為產品的創作輸出,就揭露;實質上看不見的工具(語音轉文字、翻譯草稿、研究協助)不用。不確定時就問 —— 直接對話勝過事後被發現。</p>"
    }
  ]
}
</script>

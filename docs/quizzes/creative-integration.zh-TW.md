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
        "A": "Model 兩個都寫,從 brief 到 outline 都當作可以完全自動化的流程",
        "B": "Collaborator 寫 brief;model 從 brief 自動推導出 outline 和 section heading",
        "C": "你寫 brief 和 outline(創作工作你保留),model 處理腦力激盪、過渡和潤飾",
        "D": "另一個獨立的內容生成工具自動把 brief 和 outline 都寫好交出來"
      },
      "explain": "<p>紀律就是分工:你守住創作(主張、聲音、具體觀察、節奏),model 處理機械(腦力激盪、填 context、潤滑)。角色反過來就會變平庸。Brief 和 outline 太 load-bearing 不能外包。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 行銷文案變體,推薦的工作流程是?",
      "choices": {
        "A": "寫清楚 brief,生 10–20 變體、砍 70% 平的、在 5–10 個有東西的上迭代,最後 2–3 個手工潤飾",
        "B": "生一個變體就直接出貨到 production 環境,讓使用者直接看到當天的版本",
        "C": "讓 model 自己幫自己的輸出評分,出貨分數最高的那一版作為決定性結果",
        "D": "直接複製競品的廣告文案並做一些小修改,然後當作自己的版本來用"
      },
      "explain": "<p>行銷有格式也有變體;AI 的強項在這裡是真的。流程是:廣撒、狠砍、在有潛力的上迭代、最後手工潤飾。預期 70% 初始變體會很平 —— 那是分布正常在運作。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 團隊幫 CEO 代筆。對上口吻的關鍵實務是?",
      "choices": {
        "A": "餵 model 300 字本人寫作,期待它從中推斷出其餘口吻並穩定模仿",
        "B": "用 3,000–5,000 字標記過的本人既有寫作,跟 model 起草、按本人實際口吻編輯,頻繁送確認",
        "C": "叫 model 想像「一般 CEO 該怎麼寫」,讓它從通泛的角色概念自行推導風格",
        "D": "讓代筆者自己決定要採用什麼口吻,然後再請 CEO 在最後階段一起調整"
      },
      "explain": "<p>代筆的口吻漂移特別貴,因為 CEO 不會像一個讀者那樣察覺。大量標記過的既有寫作、對著本人口吻編輯、頻繁確認 loop,就是這樣讓輸出仍是他們的,而不是安靜地變成以他們名義發的 AI 平均值。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 用 AI 做研究時,哪裡最該謹慎?",
      "choices": {
        "A": "摘要你親自提供的 20 篇文章和對應 context,讓 model 在已知範圍內整理",
        "B": "找反方論點來挑戰你的主張和前提,讓 model 用對立角度壓測你的立場",
        "C": "Source 已經放在 prompt context 裡時,讓 model 比較三種立場的差異",
        "D": "沒 source 就問事實或要 citation —— hallucination 風險高、citation 可能是編的"
      },
      "explain": "<p>AI 擅長處理你交給它的材料;不擅長從記憶裡撈冷僻事實,尤其不擅長編出看起來像真的 citation。任何需要引用的,用 retrieval-augmented 工具(Perplexity、你自己的 RAG)—— 再驗證 citation 真的存在、說的是工具聲稱的那樣。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> Production 等級的圖像生成(廣告、hero image、角色美術),典型可靠工作流程?",
      "choices": {
        "A": "Prompt 一次就直接出貨到生產環境,期待 model 第一次嘗試就達到正式品質",
        "B": "自動生成幾千張,讓使用者透過投票或 A/B test 選出最好的一張上線",
        "C": "用 reference 或 ControlNet 限制構圖、Photoshop/Figma 合成、upscale 與 inpaint、存 seed 與 prompt",
        "D": "只用文字 prompt,絕對不靠結構 reference 或 ControlNet 之類的引導工具"
      },
      "explain": "<p>無限制生成到不了 production 等級的精準。能用的模式:限制結構(參考圖或 ControlNet)、最終作品用傳統工具合成各部件、upscale 與 inpaint 修 artifact、存 seed + prompt 以便 brief 變動時重現和調整。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 創意作品的 AI 揭露,推薦的判斷法則是?",
      "choices": {
        "A": "聲音為主的工作(署名、代筆、販售為己創作)AI 實質影響就揭露;機械工作(研究、翻譯)不用",
        "B": "永遠不向客戶揭露,因為他們其實不想知道,而且揭露反而會引起不必要的疑慮",
        "C": "所有事情都揭露,包括拼字檢查、grammar 檢查、甚至 IDE 的自動完成這類細節",
        "D": "只有當客戶明確詢問你的工作流程細節時,才針對被問到的部分簡短揭露"
      },
      "explain": "<p>客戶現在正在形成意見;走在對話前面勝過被對話追著跑。合理框架:AI 實質塑造了以聲音或作者身分為產品的創作輸出,就揭露;實質上看不見的工具(語音轉文字、翻譯草稿、研究協助)不用。不確定時就問 —— 直接對話勝過事後被發現。</p>"
    }
  ]
}
</script>

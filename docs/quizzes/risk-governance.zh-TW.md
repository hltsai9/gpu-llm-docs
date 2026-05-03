# 測驗 —— 風險與治理

六題,關於 LLM 功能獨有的風險類別,以及怎麼處理。章節:[風險與治理](../07-strategy/risk-governance.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 團隊假設「model 越大 → hallucination 越少」。為什麼這樣講誤導?",
      "choices": {
        "A": "對 —— frontier model 不會 hallucinate 或製造假資訊",
        "B": "小 model 在檢索和事實回想上永遠比大 model 準",
        "C": "大 model 錯得更流暢 —— 同樣 hallucination 率,但聽起來更像真的、更難抓;要靠 grounding(RAG)和拒答模式來修",
        "D": "Model 大小跟 hallucination 率和流暢度一點關係也沒有;所有 model 都平等地 hallucinate"
      },
      "explain": "<p>流暢的 hallucination 比笨拙的糟,因為更有說服力、更難審計。靠檢索到的 source grounding、明確拒答、結構化 citation,比升級到更大 model 更能降 hallucination。用工程買準確率,不是用 token 預算。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> 什麼是 <em>indirect(second-order)prompt injection</em>?",
      "choices": {
        "A": "使用者在聊天裡打「忽略先前指令」,model 應該要過濾掉",
        "B": "攻擊者把指令埋進 model 稍後會讀的內容(網頁、RAG 文件、email、tool 輸出) — 不在使用者訊息",
        "C": "Tokenizer 的 bug 導致指令邊界錯位或 token 解釋失誤",
        "D": "供應商 rate-limit 在 model 短時間內呼叫太多次 API 時啟動"
      },
      "explain": "<p>Indirect injection 是 LLM 安全問題裡尚未解決的那塊。攻擊者把指令種在文件或網頁;你的 RAG pipeline 檢索到、或 agent 抓下來,model 就讀到攻擊。沒有任何 prompt 層的防禦 100% 可靠。結構防禦 —— tool scoping、retrieval 隔離、高風險動作人工核准 —— 才是真解。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 你絕對<em>不應該</em>放進 system prompt 的是?",
      "choices": {
        "A": "機密 —— API key、credential、內部 URL、客戶資料;使用者用「重複上文」就能輕鬆抽出來",
        "B": "產品名稱與服務描述,讓使用者知道他們正在跟哪個系統互動",
        "C": "助理語氣與人格的具體描述,用來導引回覆風格與互動口吻",
        "D": "Model 在整個系統架構裡的角色定位、職責邊界與互動範圍"
      },
      "explain": "<p>把 system prompt 當半公開的看待。抽出來很容易,而且一直在發生。任何漏出去會造成影響的機密(API key、客戶 ID、內部 endpoint)都不該靠近 prompt —— 放在 model 讀不到、經認證的基礎設施裡。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 多租戶 RAG 系統,哪種緩解能防止跨租戶資料外洩?",
      "choices": {
        "A": "在 system prompt 裡叮嚀 model,只能回答關於當前租戶資料的問題",
        "B": "希望 model 尊重租戶邊界,假如 prompt 裡有客氣地請它注意這件事的話",
        "C": "升級到更大 model,據說它對隔離規則和 metadata 會更謹慎地看待",
        "D": "逐使用者檢索 scope —— tenant ID filter 套在檢索層,model 看不到其他租戶 chunk"
      },
      "explain": "<p>Prompt 不是安全邊界。租戶隔離必須發生在檢索層(metadata filter 限制哪些 chunk 能被特定使用者撈到),不是在 model 指令裡。「Model 會處理」就是那種會害你上頭條的假設。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 某功能讓歐盟使用者跟 AI chatbot 互動。根據 EU AI Act,通常歸到哪一類?",
      "choices": {
        "A": "Prohibited(禁止) —— EU AI Act 禁止 chatbot 跟市民互動",
        "B": "High-risk,跟僱傭、信用、基本服務決策一樣有重合規",
        "C": "Limited-risk —— 一般要求揭露和透明度,不是重量級的 high-risk 規範",
        "D": "完全不受規範;EU AI Act 還沒提到 chatbot 或內容生成"
      },
      "explain": "<p>EU AI Act 把用途分成 Unacceptable(禁止)、High-risk(重合規 —— 僱傭、信用、基本服務)、Limited-risk(chatbot、內容生成 —— 要揭露)、Minimal-risk(垃圾過濾、遊戲 AI)。一般 AI 內容的 chatbot 通常落在 Limited-risk。在歐盟營運,就要早早把功能按這些層級歸類。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> LLM 功能的一頁式風險 ledger 上,該放什麼?",
      "choices": {
        "A": "Model 的 benchmark 分數,以及在標準評估上的歷史表現紀錄",
        "B": "每個風險記下 likelihood、impact、mitigation、residual —— 每季和事件後複審",
        "C": "團隊成員名單,以及他們對這個功能的個別職責歸屬",
        "D": "API key 輪換的排程,以及 credential 管理流程的書面程序"
      },
      "explain": "<p>風險 ledger 讓風險<em>可讀</em>。每個風險(答錯被 hallucinate、從 support ticket 來的 prompt injection、system prompt 外洩、GDPR 違規、成本爆炸)都記 likelihood × impact、你做了什麼 mitigation、residual risk 還剩什麼。一頁,每季複審 —— 這就是「負責任 AI」在實務上的樣子。</p>"
    }
  ]
}
</script>

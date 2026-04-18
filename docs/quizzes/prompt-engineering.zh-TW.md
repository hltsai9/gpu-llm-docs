# 測驗 —— Prompt engineering 模式

六題,關於把不穩輸出變穩的耐用模式。章節:[Prompt engineering 模式](../06-building/prompt-engineering.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 「幫我摘要這篇文章」這種 prompt 輸出平庸。改善它最大的單一槓桿是?",
      "choices": {
        "A": "換 frontier model",
        "B": "寫清楚 brief:目標長度(字數或點數)、風格(正式/輕鬆)、要強調什麼、要避開什麼",
        "C": "提高 temperature 求多樣性",
        "D": "加「深呼吸」和「你是專家」"
      },
      "explain": "<p>多數 prompting 失敗是 brief 寫得太鬆。你只要求「摘要」,model 就預設網路上平均那種摘要 —— 指定長度、風格、受眾、強調,它就穩定給你想要的。更大的 model 治不了寫得太鬆這個病。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> Few-shot prompting 之所以有效,是因為:",
      "choices": {
        "A": "Runtime 把範例 fine-tune 進 model",
        "B": "降低每請求的 token 成本",
        "C": "Model 會鎖上你示範的模式 —— 輸出格式、邊緣情況處理、風格 —— 比用文字描述更穩",
        "D": "讓 model 的 temperature 等效於零"
      },
      "explain": "<p>示範打贏描述。2–5 個範例,涵蓋棘手情況(模糊輸入、邊緣情況),比長篇指令穩。一個陷阱:小心不平衡 —— 如果所有範例都貼同一個 label,輸出就會偏。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 明確 chain-of-thought(「一步一步想」)什麼時候最有用?",
      "choices": {
        "A": "任何 prompt —— 永遠加",
        "B": "從不 —— 已經過時",
        "C": "只對圖像生成任務有用",
        "D": "多步推理(數學、邏輯、比較),尤其在較小/較舊/本地 model 上,能把準確率從 ~60% 拉到 ~90%"
      },
      "explain": "<p>CoT 給 model 一個可以跨步推理的草稿紙。Frontier model 常常已經隱性在做,或是把「extended thinking」內建進 inference loop,所以明確 CoT 對它們沒那麼關鍵。但對較小或本地 model,多步問題上仍是大槓桿。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 下列哪一個是 system prompt 裡的<em>guardrail</em> 模式?",
      "choices": {
        "A": "「資料裡找不到答案就說找不到 —— 不要猜。被問退款,把人轉到退款 URL,並提議開單。」",
        "B": "「你是世界頂級、30 年經驗的專家。」",
        "C": "「不要 hallucinate。」",
        "D": "「深呼吸仔細想。」"
      },
      "explain": "<p>Guardrail 是把允許的行為具體 whitelist 起來(「引到 URL 並開單」)、給 model 一條逃生路(「說找不到就好,別猜」)。具體、load-bearing。「別 hallucinate」或假履歷這種通用句子阻止不了 hallucination,只是讓 prompt 變長。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 為什麼不該把使用者輸入插進 system prompt?",
      "choices": {
        "A": "System prompt 費用是雙倍",
        "B": "System prompt 裡的使用者輸入能覆蓋系統層級指令 —— 這是 prompt injection 載體。把使用者輸入放在 user turn,系統指令仍享有優先權",
        "C": "System prompt 有 100 token 上限",
        "D": "供應商比 user message 更長期保留 system prompt 的 log"
      },
      "explain": "<p>System prompt 在 model 的指令注意力裡優先權高於 user message。但你把使用者輸入貼進 system prompt 字串,這個優先權保護就消失 —— 使用者文字被賦予系統等級的權威。把使用者內容留在 user turn。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 為什麼「先生、後批」的兩趟工作流,常常比單次 prompt 品質高?",
      "choices": {
        "A": "第二次 model 比較在乎",
        "B": "第二次 call 自動換更強 model",
        "C": "Model 通常比較會<em>辨認</em>一次性輸出裡的通俗或瑕疵,而不是一次就寫出精品 —— 把批判和生成分開,用不同框架給它第二次機會",
        "D": "兩次 call 觸發 caching,產生更好輸出"
      },
      "explain": "<p>「指出這份草稿有哪 5 處聽起來通俗,然後重寫」會有用,是因為批判性閱讀和初稿寫作,動用的是 model 的不同強項。代價是 2× token,但對品質敏感的輸出(行銷文案、email、長文)值得。</p>"
    }
  ]
}
</script>

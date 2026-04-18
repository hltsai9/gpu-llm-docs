# 測驗 —— 開發者的 API 基礎

六題,關於呼叫 LLM API 的旋鈕、失敗模式與成本算術。章節:[API 基礎](../06-building/api-basics.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 開發者設 <code>temperature=0</code>,期待每次呼叫得到 byte-identical 的回應。結果沒有。為什麼?",
      "choices": {
        "A": "API key 在輪換",
        "B": "temperature=0 雖然叫這名字但其實一定隨機",
        "C": "Hosted LLM 跑在多張 GPU replica 上,有 kernel 非決定性、batch 相關的數值、以及週期性模型更新 —— temperature=0 穩定產生低變異輸出,不是相同輸出",
        "D": "Temperature=0 不是合法值"
      },
      "explain": "<p>原則上「Temperature 0」每步挑最高機率 token,但 production serving 引入了從外面看不到的非決定性:batch 組成、kernel 排程、FP reduction 順序、model 版本 rollout。低變異,是;byte-identical,不。別寫比對精確字串的 test。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> 為什麼 output 定價通常是 input 的 3–5 倍?",
      "choices": {
        "A": "Output 有版權、input 沒有",
        "B": "Output token 是在 decode 模式產出(memory-bandwidth-bound —— 每個 token 要讀一次完整權重矩陣),input token 跑 prefill 模式(compute-bound,每 token 便宜很多)",
        "C": "Output token 一定比 input token 長",
        "D": "供應商想讓答案別那麼短"
      },
      "explain": "<p>每 token 成本跟 per-token GPU 工作量相關。Prefill 把一次 forward pass 攤到整個 input(每 token 便宜);decode 每個新 output token 都要讀一遍完整的權重矩陣(每 token 貴)。定價反映這種不對稱。見 Part 3 的 <em>prefill vs. decode</em>。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 前端功能把 <code>max_tokens=200</code> 傳出去,但 model 回應一直在句中被截。通常是什麼症狀?",
      "choices": {
        "A": "撞到 max_tokens 上限 —— response 停下來是因為 output 預算用完,不是因為寫完。看 stop_reason = \"length\",提高 max_tokens 或把任務切短",
        "B": "Model 拒絕任務",
        "C": "Rate limit(429)",
        "D": "Tokenizer 不匹配"
      },
      "explain": "<p>stop_reason 告訴你 response 為什麼結束。\"end_turn\" = model 自然寫完;\"length\" = 生到一半撞到 max_tokens。修法通常是提高 max_tokens(你只為實際產生的付費),或把任務拆成多個較小的輸出。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 對面向使用者的聊天功能,為什麼 streaming 通常值得下工程力?",
      "choices": {
        "A": "Streaming 減少 server 端總 inference 時間",
        "B": "Streaming 降低每請求 token 數",
        "C": "Streaming 讓 API 變 deterministic",
        "D": "Streaming 縮短<em>感知</em>延遲(TTFT),而且讓使用者看到走歪就能提早中止,省下剩餘 generation"
      },
      "explain": "<p>總時間可能差不多,甚至 streaming 還稍微長一點;但 2 秒 TTFT + 逐漸吐字,比 4 秒完全沒動感覺快多了。使用者也可以停 stream、client 能關連線,省下 output 成本。任何互動式 UI 都該 stream。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 「1 個字 ≈ 1 個 token」是英文散文的粗估。為什麼對其他內容常常大錯?",
      "choices": {
        "A": "供應商的 tokenizer 對非英文故意做爛",
        "B": "英文散文 ~1.3 token/字;程式碼 ~1.5;JSON ~2;中文/日文/阿拉伯文每個字元可能 2–4 token —— 用字數估會把成本和 context 消耗低估 30–200%",
        "C": "Token 永遠是固定長度的 byte",
        "D": "只有英文有 tokenizer"
      },
      "explain": "<p>Tokenizer 訓練用的 corpus 主要是英文;非拉丁字、以及特殊內容(code、URL、JSON)會被切成更多片。要準確估預算和 context,用供應商真正的 tokenizer(tiktoken、anthropic.count_tokens、AutoTokenizer)—— 別信字數。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 下列哪個錯誤<em>不值得</em>自動重試?",
      "choices": {
        "A": "429 rate limit 附 retry-after",
        "B": "503 server error",
        "C": "內容政策拒絕或 schema validation error —— 重試改變不了結果;call 本身就是問題",
        "D": "APIConnectionError / timeout"
      },
      "explain": "<p>可重試的錯誤是暫時性的:rate limit、網路抖動、5xx server error。不可重試的錯誤是在告訴你這次 call 本身的問題:內容政策拒絕、schema violation、content-length 超標。重試是浪費預算,還修不到根本。</p>"
    }
  ]
}
</script>

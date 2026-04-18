# 測驗 —— LLM 產品的經濟學

六題,關於每請求成本算術、自建交叉點、caching 槓桿。章節:[LLM 產品的經濟學](../07-strategy/economics.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 某功能每請求 input 2600 token、output 200 token,model 定價是 input $3/M、output $15/M。每請求約多少成本?",
      "choices": {
        "A": "~$0.001",
        "B": "~$0.011 —— 大約一分錢",
        "C": "~$0.10",
        "D": "~$1.00"
      },
      "explain": "<p>成本 = 3 × 2600/1M + 15 × 200/1M = $0.0078 + $0.003 ≈ $0.011。任何功能都要能在 30 秒內算出來,這是基本經濟素養 —— 沒有的話,你會用感覺定價,然後在重度用戶身上賠錢。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 為什麼 output token 通常比 input 貴 3–5 倍?",
      "choices": {
        "A": "Output token 平均比較長",
        "B": "供應商想讓你少寫一點 output",
        "C": "Output token 在 decode 模式生成,是 memory-bandwidth-bound —— 每個新 token 都要讀完整權重矩陣;input token 跑 prefill 模式(compute-bound,每 token 便宜很多)",
        "D": "Output 需要加密"
      },
      "explain": "<p>每 token 定價反映每 token 的 GPU 工作量。Prefill 把一次 forward pass 攤到整個 prompt(每 token 便宜);decode 每個 output token 都要重讀整份權重(每 token 貴)。這種不對稱內建在每家供應商的價目表。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 團隊一天處理 3M token,覺得應該自建。誠實的答案大概是?",
      "choices": {
        "A": "馬上自建 —— 流量明顯夠",
        "B": "只有用 Python 才自建",
        "C": "自建一定省錢",
        "D": "Hosted API 大概比較便宜。純 $/token 的交叉點大約在一天 10M token,一旦算進冗餘(30–50% headroom)、運營工程(每人每年 $200–400k)、湊功能的工程時間、合規 —— 有效交叉點更像 20–50M token/天"
      },
      "explain": "<p>自建有真實、非 token 的成本:failover headroom、on-call 工程師、跟上新 model、重做 hosted 平台出廠就有的功能(function calling、structured output)。在有效交叉點之下,自建比較貴<em>而且</em>分散產品專注。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 下列哪個是非關成本、但合理的自建理由?",
      "choices": {
        "A": "資料駐留或 air-gapped 要求 —— 資料在法律上不能離開你的基礎設施;必須自建",
        "B": "模糊覺得「隱私比較好」,但其實企業版 API 零保留就滿足監管要求",
        "C": "Hosted API 運作良好,但自建聽起來比較技術",
        "D": "還不知道 workload 就想試不同 model size"
      },
      "explain": "<p>HIPAA 某些 PHI 配置、FedRAMP、或歐盟資料駐留這類硬性要求,可能讓自建變強制。用「資料隱私」當理由揮一揮手,通常在認真看企業版 API 條款後就站不住。實驗性 workload 該留在 hosted,直到穩定模式浮現。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> RAG 應用每請求都送 1500 token 的 system prompt。哪個 caching 槓桿降成本效果最大?",
      "choices": {
        "A": "以 embedding 相似度為基礎的 semantic cache(品質風險,會抓到 paraphrase)",
        "B": "App 和 API 之間多一層本地 CDN",
        "C": "供應商原生的 <em>prompt cache</em> —— 重複使用的 prompt 前綴收更少錢,穩定 system prompt 的 workload 通常省 30–50% input 成本。開起來很簡單;廣泛被低估",
        "D": "HTTP payload 的 gzip 壓縮"
      },
      "explain": "<p>Prompt caching 是安靜的 free lunch。供應商對重複使用的 prompt 前綴收較少費用(有時遠少);任何有長且穩定 system prompt 的 RAG/agent workload,開啟來通常省 30–50% input 成本、品質零風險。是 ROI 最高的經濟改動之一。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 對毛利吃緊的功能,哪個槓桿通常對每請求成本影響最大?",
      "choices": {
        "A": "把 pod 搬到不同資料中心地區",
        "B": "對能處理的那部分流量換較小 model,再緊縮 retrieval(chunk 更少、system prompt 更短)",
        "C": "用更快的語言重寫 app",
        "D": "加更多 GPU"
      },
      "explain": "<p>LLM 功能最大的成本槓桿是 model 選擇和 token 量。簡單 query 用較小 model(難題才路由到 frontier),再加上 prompt 壓縮和更緊的 retrieval,通常砍 50–80% 成本,品質影響有界。基礎設施改動排在後面很多。</p>"
    }
  ]
}
</script>

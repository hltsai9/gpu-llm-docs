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
        "A": "~$0.001,等於千分之一分錢的成本",
        "B": "~$0.011 —— 每請求大約一分錢",
        "C": "~$0.10,大約每個請求十分之一的美元",
        "D": "~$1.00,大約每個請求整整一美元的成本"
      },
      "explain": "<p>成本 = 3 × 2600/1M + 15 × 200/1M = $0.0078 + $0.003 ≈ $0.011。任何功能都要能在 30 秒內算出來,這是基本經濟素養 —— 沒有的話,你會用感覺定價,然後在重度用戶身上賠錢。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 為什麼 output token 通常比 input 貴 3–5 倍?",
      "choices": {
        "A": "Output token 平均比較長,字元數和帶的資訊密度都比 input token 高",
        "B": "供應商戰略性地想讓使用者少要求長 output,定價反映品質激勵的考量",
        "C": "Decode 是 memory-bandwidth-bound,每 token 讀全權重;prefill 是 compute-bound",
        "D": "Output token 需要額外加密與金鑰輪換,增加編碼層的計算負擔與成本"
      },
      "explain": "<p>每 token 定價反映每 token 的 GPU 工作量。Prefill 把一次 forward pass 攤到整個 prompt(每 token 便宜);decode 每個 output token 都要重讀整份權重(每 token 貴)。這種不對稱內建在每家供應商的價目表。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 團隊一天處理 3M token,覺得應該自建。誠實的答案大概是?",
      "choices": {
        "A": "馬上自建 —— 3M token/天的流量已經足以支撐團隊投入完整 ops 維運成本",
        "B": "只有用 Python 或 Rust 等系統等級語言部署服務的團隊才應該考慮自建",
        "C": "自建只要超過純 $/token 交叉點 ~10M/天之後,就一定會比 hosted API 省錢",
        "D": "Hosted API 大概更便宜;純交叉 ~10M/天,加冗餘、ops、合規,有效交叉 20–50M/天"
      },
      "explain": "<p>自建有真實、非 token 的成本:failover headroom、on-call 工程師、跟上新 model、重做 hosted 平台出廠就有的功能(function calling、structured output)。在有效交叉點之下,自建比較貴<em>而且</em>分散產品專注。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 下列哪個是非關成本、但合理的自建理由?",
      "choices": {
        "A": "資料駐留或 air-gapped 要求 —— 資料法律上不能離開你的基礎設施;必須自建",
        "B": "模糊覺得「隱私比較好」,但企業版 API 零保留已滿足實際監管需求",
        "C": "Hosted API 運作良好且滿足要求,但自建聽起來比較技術和給人掌控感",
        "D": "還不知道穩定 workload 模式就想試不同 model 尺寸或架構"
      },
      "explain": "<p>HIPAA 某些 PHI 配置、FedRAMP、或歐盟資料駐留這類硬性要求,可能讓自建變強制。用「資料隱私」當理由揮一揮手,通常在認真看企業版 API 條款後就站不住。實驗性 workload 該留在 hosted,直到穩定模式浮現。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> RAG 應用每請求都送 1500 token 的 system prompt。哪個 caching 槓桿降成本效果最大?",
      "choices": {
        "A": "基於 embedding 相似度的 semantic cache,會抓到 paraphrase 但有品質風險",
        "B": "App 和 API 之間的本地 CDN 或邊緣快取,降低延遲和重複請求",
        "C": "供應商原生 <em>prompt cache</em> —— 重複使用的 prompt 前綴收更少費用,常省 30–50% input 成本",
        "D": "HTTP payload 的 gzip 壓縮,減少客戶端和伺服器間的頻寬開銷"
      },
      "explain": "<p>Prompt caching 是安靜的 free lunch。供應商對重複使用的 prompt 前綴收較少費用(有時遠少);任何有長且穩定 system prompt 的 RAG/agent workload,開啟來通常省 30–50% input 成本、品質零風險。是 ROI 最高的經濟改動之一。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 對毛利吃緊的功能,哪個槓桿通常對每請求成本影響最大?",
      "choices": {
        "A": "把 pod 搬到不同資料中心地區,期待當地的基礎設施定價較低",
        "B": "容易的 query 換成較小 model,再緊縮 retrieval(chunk 更少、system prompt 更短)",
        "C": "用 Rust 或 C++ 等編譯語言重寫整個 app,期待降低延遲與 CPU 開銷",
        "D": "加更多 GPU 增加平行度,讓功能後端的並行吞吐量得以全面提升"
      },
      "explain": "<p>LLM 功能最大的成本槓桿是 model 選擇和 token 量。簡單 query 用較小 model(難題才路由到 frontier),再加上 prompt 壓縮和更緊的 retrieval,通常砍 50–80% 成本,品質影響有界。基礎設施改動排在後面很多。</p>"
    }
  ]
}
</script>

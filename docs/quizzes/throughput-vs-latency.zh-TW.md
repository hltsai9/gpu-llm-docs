# 測驗 —— 吞吐量優於延遲

五題關於「延遲 vs. 吞吐量」取捨的問題。章節:[吞吐量優於延遲](../01-why-gpu/throughput-vs-latency.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 在公路比喻裡,要把 10,000 人從舊金山搬到洛杉磯,哪個策略會贏?",
      "choices": {
        "A": "法拉利 —— 每趟快速,開回來再重複很多次",
        "B": "貨運火車 —— 每趟比較慢,但一次載 10,000 人",
        "C": "兩者搬運 10,000 人的總時間會是相同的",
        "D": "兩個都不行 —— 延遲優勢永遠勝過吞吐量優勢"
      },
      "explain": "<p>火車雖然每趟慢得多,卻以壓倒性的差距獲勝,因為它同時搬運整批人潮。GPU 就是那列火車:單一運算通常比 CPU 慢,但總體吞吐量大得多。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> 當 GPU 上的一個 warp 等記憶體停頓時,SM 會做什麼?",
      "choices": {
        "A": "讓所有核心停住,等待記憶體讀取資料完成",
        "B": "把該 warp 從核心函式開頭重新開始執行",
        "C": "切到另一個已經就緒的 warp,讓算術單元繼續忙",
        "D": "請 CPU 幫忙去記憶體抓取需要的資料"
      },
      "explain": "<p>這就是**延遲隱藏(latency hiding)**:SM 同時掛著幾十個 warp,一個停頓了、排程器就跑另一個。每個執行緒的延遲可能很大,但聚合吞吐量還是貼近巔峰。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> 在服務 LLM 時,為什麼小 batch 對 GPU 使用率很不利?",
      "choices": {
        "A": "小 batch 無法充分利用 Tensor Core —— 貨運火車跑得半空",
        "B": "小 batch 會讓 GPU 發熱過高並觸發溫度限流",
        "C": "CUDA 驅動明確拒絕執行小 batch 的 kernel",
        "D": "小 batch 計算的總 FLOPs 實際上比大 batch 還多"
      },
      "explain": "<p>GPU 的吞吐量靠的是「大量工作平行執行」。batch = 1 就讓上千個核心閒著 —— 火車只裝了半車。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 對 GPU 上的「單一」運算 vs. CPU 上的「單一」運算,什麼通常是對的?",
      "choices": {
        "A": "GPU 的單一運算延遲永遠比 CPU 更低",
        "B": "兩者在速度和延遲特性上完全相同",
        "C": "執行 Python 程式碼時 GPU 延遲會比較低",
        "D": "單一運算在 GPU 上通常**更慢** —— 但同時平行執行上百萬個"
      },
      "explain": "<p>GPU 上任何一個執行緒的速度都不怎麼特別。這顆晶片贏在聚合:上千個執行緒同時往前走,其中任何一個在等什麼都沒差。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 某個系統單一使用者每秒產生 100 個 token,而跨 100 位使用者時總共每秒產生 10,000 個 token。這兩個數字描述的是……",
      "choices": {
        "A": "同一個指標使用不同單位方式測量",
        "B": "兩個不同目標 —— 每使用者延遲 vs. 整體吞吐量 —— 通常彼此互斥",
        "C": "系統儀表或軟體中的測量誤差或 bug",
        "D": "CPU 實作與 GPU 實作的效能差異比較"
      },
      "explain": "<p>延遲(對單一使用者的 tokens/秒)跟吞吐量(跨所有使用者的 tokens/秒)是不同的。服務系統會挑一個目標;兩邊通常沒辦法同時極大化。</p>"
    }
  ]
}
</script>

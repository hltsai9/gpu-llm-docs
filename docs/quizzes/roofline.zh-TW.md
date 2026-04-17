# 測驗 —— 受限於記憶體 vs. 受限於運算

七題關於 roofline 這個把一切串起來的心智模型。章節:[受限於記憶體 vs. 受限於運算](../03-llm-inference/roofline.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 哪兩個天花板定義了 roofline?",
      "choices": {
        "A": "核心數與時脈",
        "B": "快取大小與 HBM 容量",
        "C": "巔峰運算吞吐量(FLOPs/秒)與巔峰記憶體頻寬(bytes/秒)",
        "D": "功耗與溫度"
      },
      "explain": "<p>任何運算都受其中之一限制。算術密度低 → 頻寬是天花板。算術密度高 → 運算是天花板。Roofline 圖會告訴你切換點在哪裡。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 70B 模型、FP16、batch=1 的一次 decode,算術密度大約是……",
      "choices": {
        "A": "每 byte 約 1 次運算 —— 深度受限於記憶體,只用掉不到 1% 的 Tensor Core 能力",
        "B": "每 byte 約 1,000 次運算 —— 受限於運算",
        "C": "每 byte 約 295 次運算 —— 剛好在 roofline 交界點",
        "D": "取決於 prompt 的內容"
      },
      "explain": "<p>搬 140 GB 權重做大約 140 GFLOPs 的工作 → 大約 1 op/byte。在一顆需要 295 ops/byte 才能吃滿的晶片上,Tensor Core 基本上閒著。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> 減少從 HBM 搬動的 byte 數,會直接加速哪種運算?",
      "choices": {
        "A": "受限於運算的運算 —— 反正 byte 本來就不是瓶頸",
        "B": "受限於記憶體的運算 —— 頻寬本來就是瓶頸",
        "C": "都不會 —— byte 數不影響速度",
        "D": "兩者相同"
      },
      "explain": "<p>如果你是受限於運算,搬更少 byte 幫不大。如果你是受限於記憶體,每省一個 byte 就是等比例的加速。這也是為什麼量化對 decode 的幫助比對 prefill 大得多。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> 為什麼 GPU 的 roofline 交界點**一代一代往右漂移**(需要更高的 ops/byte)?",
      "choices": {
        "A": "HBM 變慢了",
        "B": "工作負載需要的運算變少了",
        "C": "時脈下降了",
        "D": "運算成長比記憶體頻寬快 —— 所以每張新 GPU 需要更高的算術密度才能吃滿"
      },
      "explain": "<p>從 Pascal(約 15)到 Hopper(約 295) ops/byte,運算吞吐量一直跑得比 HBM 頻寬快。同樣的工作負載在老硬體上可能是受限於運算,到了新硬體就變成受限於記憶體 —— 這也是現代推論引擎複雜度不斷上升的原因。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> FlashAttention 在 roofline 圖上把 attention 搬去哪?",
      "choices": {
        "A": "提高算術密度(同樣的數學,搬更少 HBM byte),把 attention 從受限於記憶體推向受限於運算",
        "B": "提高 FLOPs,往左移",
        "C": "壓低運算天花板",
        "D": "完全不影響 roofline"
      },
      "explain": "<p>FlashAttention 不改變數學、也不改變 FLOPs;它改變記憶體佈局,讓 L×L 的分數矩陣不再進 HBM。搬動的 byte 大幅下降 → 算術密度上升 → 進入受限於運算的區域。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 下列哪個**不是** roofline 圖上的移動?",
      "choices": {
        "A": "把多條序列透過共用權重做 batch(x 軸往右)",
        "B": "在 CPU 上把 Python 函式改寫成 Rust(完全不在 GPU roofline 上)",
        "C": "把權重量化到 FP8(x 軸往右)",
        "D": "從 H100 升級到 H200(把記憶體頻寬那條線往上拉)"
      },
      "explain": "<p>CPU 端的改寫不會改變 GPU 效能特性。其他三個都是真正在 roofline 上的移動 —— 不是沿著 x 軸(密度)、就是把某條天花板往上拉。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q7.</strong> 判斷某個新最佳化是否會幫到「受限於記憶體的運算」,最乾淨的一行測試是什麼?",
      "choices": {
        "A": "它有沒有加更多核心?",
        "B": "它有沒有讓每次運算的 FLOPs 變多?",
        "C": "同樣的工作量下,它有沒有減少從 HBM 搬動的 byte?",
        "D": "它有沒有拉高時脈?"
      },
      "explain": "<p>對受限於記憶體的運算而言,HBM 流量越少 ≈ 速度越快。如果這個技術沒有減少搬動的 byte,大概就幫不上忙 —— 甚至可能因為多了複雜度反而變慢。</p>"
    }
  ]
}
</script>

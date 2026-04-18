# 測驗 —— 分散式訓練

六題,關於 parallelism 軸、記憶體分片、以及通訊拓撲。章節:[分散式訓練](../04-training/distributed-training.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 下列哪個最準確地描述 <em>data parallelism</em>?",
      "choices": {
        "A": "每張 GPU 拿權重的一部分;activation 每層都要重組",
        "B": "每張 GPU 拿完整模型、處理 batch 的一部分,每步結束用 all-reduce 平均梯度",
        "C": "不同層放在不同 GPU,activation 像管線流過去",
        "D": "只複製梯度;權重放 CPU RAM"
      },
      "explain": "<p>Data parallel 最單純:每張 GPU 放整個模型,batch 切開,step 結束時 all-reduce 梯度。是起點 —— scale 得漂亮,直到模型塞不進單張 GPU,才開始要 ZeRO/FSDP 或 tensor parallel。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> ZeRO-1 和 ZeRO-3 的關鍵差別是什麼?",
      "choices": {
        "A": "ZeRO-1 是 BF16,ZeRO-3 是 FP32",
        "B": "ZeRO-1 只在 A100 跑,ZeRO-3 只在 H100",
        "C": "ZeRO-1 只分 optimizer state;ZeRO-3 分 optimizer state、梯度、參數(最大記憶體節省,但通訊成本最高)",
        "D": "ZeRO-1 是 data parallel,ZeRO-3 是 tensor parallel"
      },
      "explain": "<p>ZeRO 的 stage 依序加 sharding:ZeRO-1 = optimizer state、ZeRO-2 = +梯度、ZeRO-3 = +參數(每張 GPU 只 materialize 當前層權重)。分越多 = 省越多記憶體,但通訊量越大。從 ZeRO-1 開始,需要才往上。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Tensor-parallel 群組該放在哪裡?",
      "choices": {
        "A": "薄薄地分散到很多 node,減低單點負擔",
        "B": "只放在有 NVMe 本地存儲的機器",
        "C": "跟純 CPU worker 配成對做預處理",
        "D": "放在單一 node 內、用 NVLink 連 —— 絕對不跨 node,因為層內通訊量 InfiniBand 吞不下"
      },
      "explain": "<p>Tensor parallel 在 forward pass <em>層內</em>就產生通訊(每個 matmul)。NVLink(~900 GB/s)吞得下;InfiniBand(~50 GB/s)吞不下。規則:TP 在 node 內、DP 跨 node。跨 node 的 TP 會直接搞壞效能。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Pipeline parallelism 裡的「pipeline bubble」是什麼?",
      "choices": {
        "A": "舊版 pipeline scheduler 的記憶體 leak",
        "B": "每步的頭尾,早期/晚期 GPU 分別閒置等 micro-batch 進來或流完,吃掉 throughput",
        "C": "只在 AMD GPU 上出現的排程 artifact",
        "D": "階段間壓縮 activation 的 overhead"
      },
      "explain": "<p>Pipeline parallel 把層分到不同 stage;batch 拆 micro-batch 以重疊 stage。但前段 GPU 得等第一個 micro-batch 到後段才忙起來,後段要等最後一個流完才閒下來。Batch 小、bubble 就大。這也是為什麼 PP 通常跟 DP、TP 合用,很少單獨使用。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> 團隊回報 BF16 transformer 訓練的 MFU 是 18%。這代表什麼?",
      "choices": {
        "A": "有東西在浪費時間 —— 通常是 data loading、通訊、或 kernel 效率 —— 在買更多 GPU 前先診斷",
        "B": "Cluster 表現最佳;18% 就是硬體天花板",
        "C": "MFU 低於 20% 只有量化訓練才可能",
        "D": "模型對這個 cluster 來說太小"
      },
      "explain": "<p>調得好的 dense transformer 訓練在 H100 上通常落 30–50% MFU;frontier lab 回報 50%+。低於 25% 強烈暗示瓶頸 —— data loader 餓死、通訊吃太久、tensor parallel 跨 NVLink、或沒做 warmup。先診斷,再買 GPU。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 為什麼多數團隊不從頭訓 LLM?",
      "choices": {
        "A": "不知道怎麼訓",
        "B": "雲端供應商禁止",
        "C": "70B × 2T-token 的 Chinchilla 風格訓練大約 ~2M GPU-hours、好幾百萬美金 —— fine-tune 現成模型只要幾百 GPU-hours、一兩萬美金",
        "D": "Open-source 授權禁止從頭訓"
      },
      "explain": "<p>訓練 FLOPs ≈ 6 × 參數 × tokens。稱職的 70B × 2T 訓練在 4096 張 H100 上要跑 ~3 週,按 list price 約 $8M。Fine-tuning 便宜三個數量級。這個經濟結構讓「從頭訓」變成研究實驗室或 frontier 公司的活動,不是產品團隊的第一反應。</p>"
    }
  ]
}
</script>

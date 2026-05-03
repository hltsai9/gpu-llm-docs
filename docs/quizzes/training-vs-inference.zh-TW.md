# 測驗 —— 訓練 vs. 推論

六題小測驗,關於訓練和推論在形狀、記憶體與成本上的差異。章節:[訓練 vs. 推論](../04-training/training-vs-inference.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 下列哪一個<em>不是</em>訓練和推論之間的根本差異?",
      "choices": {
        "A": "訓練要做 backward pass;推論只跑 forward pass,不需要梯度",
        "B": "訓練要保留整個 batch 的 activation 給梯度計算,推論用完即丟",
        "C": "訓練用的 attention 演算法和推論用的不一樣,kernel 也不同",
        "D": "訓練需要 optimizer,還要為每個參數多存一份 optimizer state"
      },
      "explain": "<p>兩邊的 attention 數學是同一個。真正的差別在 backward pass、要保留 activation、以及 optimizer state。這也是為什麼訓練每個參數大約要吃 <em>16–20 bytes</em>,而推論只要 <em>~2 bytes</em>。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Adam optimizer state 每個參數大約吃多少 GPU 記憶體(FP32)?",
      "choices": {
        "A": "2 bytes per parameter,只存一階動量(first moment)估計",
        "B": "8 bytes —— 兩個 moment,FP32 各 4 bytes,加在 weight 之上",
        "C": "16 bytes,包含 weight、gradient、和兩個 momentum tensor 一起",
        "D": "0 bytes —— optimizer state 放在 CPU RAM,不占 GPU VRAM"
      },
      "explain": "<p>Adam 每個參數要追一個 first moment 和一個 second moment,FP32 各 4 bytes —— 加起來 8 bytes 的 optimizer state,疊在 4-byte 權重 + 4-byte 梯度之上。這也是為什麼訓練 70B 模型,在還沒算 activation 之前就要上百 GB。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 為什麼訓練時不能一直把 batch size 開大直到塞爆 GPU?",
      "choices": {
        "A": "Batch 超過某個門檻(例如 512)後,gradient 變舊,會慢慢拖累模型準確率",
        "B": "Optimizer 的二階動量估計在 batch 超過 1024 後,內部數值會開始變得不穩",
        "C": "HBM 頻寬會飽和,compute 邊際遞減,被資料餵得跟不上 GPU 算力的吞吐",
        "D": "Activation 跟 batch size 一起長,到某點 OOM —— gradient checkpointing 或 micro-batch 是解法"
      },
      "explain": "<p>Batch 裡每一筆都要自己留 activation 給 backward pass 用。Batch 大、序列長的時候,activation 就主宰了記憶體。常見解法:gradient checkpointing(用重算換記憶體),或是拆小 micro-batch 搭配 gradient accumulation。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> <strong>MFU</strong>(Model FLOPs Utilization)在量什麼?",
      "choices": {
        "A": "每個訓練 step 拿到 gradient 更新的可訓練參數比例",
        "B": "模型有用 FLOPs 占 GPU 峰值算力的比例 —— 離硬體理論上限有多近",
        "C": "Forward pass FLOPs 對 backward pass FLOPs 的比值",
        "D": "用 Tensor Core 相對於 CUDA Core 帶來的 speedup 倍率"
      },
      "explain": "<p>MFU = 有用的 model FLOPs / (GPU 峰值 FLOPs × 時間)。訓練調得好大約落在 40–55% MFU;低於 30% 通常意味著通訊、data loading,或 kernel 效率在浪費時間。這是「我的訓練是不是花在該花的地方」最好用的單一指標。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> 推論時的 GPU 使用率通常遠低於訓練。主要原因是:",
      "choices": {
        "A": "Decode 受限於記憶體頻寬 —— 每生一個 token 都要讀一次完整權重矩陣,HBM 先撞到天花板",
        "B": "推論用的是小模型,塞不滿 GPU 的 compute 資源,大部分時間是閒置的",
        "C": "KV cache 讓每個 token 變便宜,所以 GPU 是刻意保留閒置不用滿載的",
        "D": "推論精度比較低,理論 compute 容量根本用不到、就只能浪費掉"
      },
      "explain": "<p>Decode 一次出一個 token —— 每個使用者的 batch 維度是 1,所以一次讀整張權重矩陣,只做一點點算。算力上限還沒到,HBM 頻寬上限就先撞到了。這也是為什麼把多個使用者併成一個 batch,對 serving 來說價值這麼大。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> 關於訓練經濟學,下列哪一句話是<em>對</em>的?",
      "choices": {
        "A": "訓練成本只跟模型參數量有關,跟資料量沒有什麼直接關係",
        "B": "訓練一定比這個 model 部署後整個生命週期的 inference 收入還貴",
        "C": "成本 ∝ 參數 × tokens(Chinchilla);70B × 2T tokens 訓練要好幾百萬美金",
        "D": "70B 在 Chinchilla 最佳 tokens 量訓練,只要 GPU 夠,其實便宜"
      },
      "explain": "<p>訓練 FLOPs ≈ 6 × 參數 × tokens。Chinchilla 證明 data 跟 parameter 一樣重要。一次 70B × 2T token 的訓練大約要上百萬 GPU-hours —— 以 2025 年的價格,大約是個位數到十幾百萬美金,看 utilization。</p>"
    }
  ]
}
</script>

# 測驗 —— GPU cluster 運營

六題,關於可靠地跑 LLM 機群:autoscaling、MIG、可觀測性、cold-start。章節:[GPU cluster 運營](../05-serving/cluster-ops.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 團隊用 CPU 使用率幫 LLM pod 做 autoscale。會出什麼狀況?",
      "choices": {
        "A": "不會怎樣 —— CPU 使用率就是 LLM serving 對的訊號",
        "B": "Pod 會 overscale,因為 CPU 永遠很忙",
        "C": "CPU 不是瓶頸,GPU 才是。用 tokens/sec、queue depth、KV cache utilization、TTFT 才抓得到真正的負載;CPU 幾乎沒動,GPU 卻已經滿載",
        "D": "只有 GPU 使用率(nvidia-smi %)是能用的訊號"
      },
      "explain": "<p>LLM pod 的瓶頸在 GPU。GPU 已經飽和時 CPU 看起來還好好的。用 framework 吐出來的 metric(tokens/sec、queue depth、KV cache %)透過 KEDA 或 Prometheus Adapter。nvidia-smi 的 % 也是爛訊號,因為它反映的是 kernel occupancy,不是有用的工作量。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> 為什麼反應式 autoscale LLM pod(「負載高就加 replica」)通常太慢?",
      "choices": {
        "A": "Kubernetes 不支援快速 scale",
        "B": "LLM pod 的 cold-start 是數分鐘 —— image pull、model 權重載入(50–150 GB)、CUDA graph capture、warm-up —— 等新 pod 能服務時,負載尖峰可能已經過了",
        "C": "Autoscaler 根本排不到 GPU workload",
        "D": "Replica 中間必須關機"
      },
      "explain": "<p>Web pod 秒起,LLM pod 幾分鐘。反應式 autoscale 產能到位那一刻剛好撞上尖峰,太晚了。要嘛預留 headroom、要嘛從上游訊號(首頁流量、上班時間)預測需求、要嘛備 warm standby replica。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> A100/H100 上的 <em>MIG</em>(Multi-Instance GPU)什麼時候有用?",
      "choices": {
        "A": "一張大 GPU 上跑多個小模型,租戶之間有硬體強制隔離",
        "B": "伺服單一大模型,需要整張 GPU 的 HBM",
        "C": "跨多 node 的 frontier 規模訓練",
        "D": "Apple Silicon 上的 edge 部署"
      },
      "explain": "<p>MIG 把一張 GPU 切成最多 7 個獨立的小 GPU —— 對小模型的多租戶 inference、或要讓開發者便宜按 slice 使用很好。<em>不</em>適合跑大模型(partition 之間沒 NVLink),也不適合動態 workload(重設 MIG 要 reboot)。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> LLM serving dashboard 上,下列哪個<em>不是</em>你真正需要的 GPU 時代訊號?",
      "choices": {
        "A": "TTFT(time to first token)P50 / P95",
        "B": "KV cache utilization",
        "C": "Running batch size 和 queue depth",
        "D": "每個 replica 的平均 CPU 負載"
      },
      "explain": "<p>CPU 負載是 CPU 時代的 proxy,跟 LLM 的健康幾乎不相關。真正有用的訊號:per-request TTFT 和 TPOT、batch size、queue depth、KV cache %、tokens/sec、HBM used。CPU 看起來健康,什麼也不告訴你 GPU 是否過載。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 為什麼 tensor-parallel workload 在 Kubernetes 上要特殊排程?",
      "choices": {
        "A": "需要專屬 node、不能有其他 pod",
        "B": "需要 AMD GPU",
        "C": "TP 群組要的是<em>同一個</em> node 上的多張 GPU(為了 NVLink),所以需要 nodeSelector 或 gpu-count=8 之類的 label,把 pod 導到有足夠共址 GPU 的 host",
        "D": "必須跑在 preemptible instance 上"
      },
      "explain": "<p>Tensor parallel 流量只有 NVLink 頻寬吞得住。TP 群組跨 node(掉到 InfiniBand)throughput 直接崩。Kubernetes 預設不知道這件事,所以要 label node、限制 pod placement,把 TP 群組保持在同一 node。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 部署新版後,保留舊版 warm 至少一週有什麼價值?",
      "choices": {
        "A": "減少新版的記憶體占用",
        "B": "如果新版有安靜的品質退化,流量可以瞬間切回去 —— 從 cold start rollback 要幾分鐘,每一分鐘都讓狀況更糟",
        "C": "Kubernetes 規定永遠要有兩版",
        "D": "舊版跑在不同硬體"
      },
      "explain": "<p>Model 版本退化常常是細微的品質漂移,不是硬錯誤。瞬間 rollback 意味著對「使用者在抱怨」的反應是秒級,不是分鐘級。留一週 warm spare 的成本,跟一小時的爛輸出打到每個使用者相比,是便宜的保險。</p>"
    }
  ]
}
</script>

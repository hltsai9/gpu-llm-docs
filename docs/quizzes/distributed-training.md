# Quiz — Distributed training

Six questions on parallelism axes, memory sharding, and communication topology. Chapter: [Distributed training](../04-training/distributed-training.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> Which of these best describes <em>data parallelism</em>?",
      "choices": {
        "A": "Each GPU stores part of weights; activation reassembly happens between layers",
        "B": "Each GPU holds complete model, processes different batch slice, all-reduce gradients at step end",
        "C": "Different layers split across GPUs; activations pipeline through stages sequentially",
        "D": "Gradients replicate across GPUs; weights permanently stay in CPU RAM"
      },
      "explain": "<p>Data parallel is the simplest: every GPU holds the whole model, batches are split, and gradients are all-reduced at step end. It's the starting point — scales beautifully until the model no longer fits on a single GPU, which is when you reach for ZeRO/FSDP or tensor parallel.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What is the key difference between ZeRO-1 and ZeRO-3?",
      "choices": {
        "A": "ZeRO-1 stores in BF16 precision; ZeRO-3 uses FP32 precision",
        "B": "ZeRO-1 requires A100 GPUs; ZeRO-3 targets H100 clusters only",
        "C": "ZeRO-1 shards optimizer state only; ZeRO-3 shards state, gradients, and parameters",
        "D": "ZeRO-1 implements data parallelism; ZeRO-3 implements tensor parallelism"
      },
      "explain": "<p>The ZeRO stages increase sharding: ZeRO-1 = optimizer state, ZeRO-2 = +gradients, ZeRO-3 = +parameters (so each GPU only materializes the current layer's weights). More sharding = more memory saved but more network traffic per step. Start with ZeRO-1; escalate only when needed.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Where should tensor-parallel groups live in a cluster?",
      "choices": {
        "A": "Spread thin across many nodes to balance per-node computational load",
        "B": "Only on machines equipped with high-speed NVMe local SSD storage",
        "C": "Paired alongside CPU-only nodes running data preprocessing tasks",
        "D": "Within single node via NVLink only; never cross-node as layer traffic exceeds InfiniBand"
      },
      "explain": "<p>Tensor parallel generates communication <em>inside</em> the forward pass (every matmul). NVLink (~900 GB/s) can absorb it; InfiniBand (~50 GB/s) cannot. Rule: TP within a node, data parallel across nodes. Cross-node TP destroys performance.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> What is the \"pipeline bubble\" in pipeline parallelism?",
      "choices": {
        "A": "Memory management bug leaking allocations in older pipeline schedulers",
        "B": "Idle GPU time at step start/end while waiting for micro-batches; early and late stages stall",
        "C": "Scheduling issue appearing only on AMD GPU hardware implementations",
        "D": "Cost of compressing/decompressing activations passed between pipeline stages"
      },
      "explain": "<p>Pipeline parallel splits layers across stages; batches are split into micro-batches to overlap stages. But early GPUs sit idle until the first micro-batch reaches later stages, and late GPUs sit idle waiting for the last one. Small batches hit the bubble harder. This is why PP is usually combined with DP and TP, not used alone.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> A team reports MFU of 18% on a BF16 transformer training run. What does that suggest?",
      "choices": {
        "A": "Bottleneck exists — data loading, communication, or kernel inefficiency — diagnose before expanding",
        "B": "Cluster performance is optimal; 18% is the baseline hardware ceiling for transformers",
        "C": "Achieving MFU below 20% requires activating quantized training mode",
        "D": "Model size is insufficient to saturate this cluster's compute capabilities"
      },
      "explain": "<p>Well-tuned dense transformer training on H100 typically hits 30–50% MFU; frontier labs report 50%+. Below 25% strongly suggests a bottleneck — starved data loader, heavy communication time, cross-NVLink tensor parallel, or no warmup measurement. Diagnose first, buy more GPUs second.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Why don't most teams train LLMs from scratch?",
      "choices": {
        "A": "Few teams have expertise and resources for large-scale training pipelines",
        "B": "Cloud providers restrict or prohibit full-model pretraining through contracts",
        "C": "Scratch training: ~$8M and millions GPU-hours; fine-tuning: ~thousands dollars, hundreds GPU-hours",
        "D": "Open-source software licenses legally forbid from-scratch model training"
      },
      "explain": "<p>Training FLOPs ≈ 6 × parameters × tokens. A competent 70B × 2T run takes ~3 weeks on 4096 H100s at ~$8M at list rates. Fine-tuning is three orders of magnitude cheaper. The economics make starting from scratch a research-lab or frontier-company activity, not a product team's first instinct.</p>"
    }
  ]
}
</script>

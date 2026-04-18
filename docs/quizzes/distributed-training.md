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
        "A": "Each GPU holds a slice of the weights; activations are reassembled every layer",
        "B": "Each GPU holds a full copy of the model and processes a different slice of the batch, with gradients averaged at step end",
        "C": "Different layers are placed on different GPUs, and activations flow through like a pipeline",
        "D": "Only gradients are replicated; weights live in CPU RAM"
      },
      "explain": "<p>Data parallel is the simplest: every GPU holds the whole model, batches are split, and gradients are all-reduced at step end. It's the starting point — scales beautifully until the model no longer fits on a single GPU, which is when you reach for ZeRO/FSDP or tensor parallel.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What is the key difference between ZeRO-1 and ZeRO-3?",
      "choices": {
        "A": "ZeRO-1 is BF16, ZeRO-3 is FP32",
        "B": "ZeRO-1 works only on A100, ZeRO-3 on H100",
        "C": "ZeRO-1 shards only the optimizer state; ZeRO-3 shards optimizer state, gradients, and parameters (maximum memory savings at highest communication cost)",
        "D": "ZeRO-1 is data parallel, ZeRO-3 is tensor parallel"
      },
      "explain": "<p>The ZeRO stages increase sharding: ZeRO-1 = optimizer state, ZeRO-2 = +gradients, ZeRO-3 = +parameters (so each GPU only materializes the current layer's weights). More sharding = more memory saved but more network traffic per step. Start with ZeRO-1; escalate only when needed.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Where should tensor-parallel groups live in a cluster?",
      "choices": {
        "A": "Spread thinly across many nodes to reduce load per node",
        "B": "Only on machines with NVMe local storage",
        "C": "Paired with CPU-only workers for preprocessing",
        "D": "Inside a single node, connected by NVLink — never across nodes, because inter-layer traffic is too heavy for InfiniBand"
      },
      "explain": "<p>Tensor parallel generates communication <em>inside</em> the forward pass (every matmul). NVLink (~900 GB/s) can absorb it; InfiniBand (~50 GB/s) cannot. Rule: TP within a node, data parallel across nodes. Cross-node TP destroys performance.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> What is the \"pipeline bubble\" in pipeline parallelism?",
      "choices": {
        "A": "A memory leak in older pipeline schedulers",
        "B": "Idle time at the start and end of a step where early/late GPUs wait for micro-batches to arrive or depart, costing throughput",
        "C": "A scheduling artifact that only appears on AMD GPUs",
        "D": "The overhead of compressing activations between stages"
      },
      "explain": "<p>Pipeline parallel splits layers across stages; batches are split into micro-batches to overlap stages. But early GPUs sit idle until the first micro-batch reaches later stages, and late GPUs sit idle waiting for the last one. Small batches hit the bubble harder. This is why PP is usually combined with DP and TP, not used alone.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> A team reports MFU of 18% on a BF16 transformer training run. What does that suggest?",
      "choices": {
        "A": "Something is wasting time — usually data loading, communication, or kernel inefficiency — and it's worth diagnosing before buying more GPUs",
        "B": "The cluster is performing optimally; 18% is the hardware ceiling",
        "C": "MFU below 20% is only possible with quantized training",
        "D": "The model is too small for the cluster"
      },
      "explain": "<p>Well-tuned dense transformer training on H100 typically hits 30–50% MFU; frontier labs report 50%+. Below 25% strongly suggests a bottleneck — starved data loader, heavy communication time, cross-NVLink tensor parallel, or no warmup measurement. Diagnose first, buy more GPUs second.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Why don't most teams train LLMs from scratch?",
      "choices": {
        "A": "They don't know how",
        "B": "Cloud providers prohibit it",
        "C": "A 70B × 2T-token Chinchilla-style run is roughly ~2M GPU-hours and several million dollars — fine-tuning an existing model is hundreds of GPU-hours and costs 1–10k",
        "D": "Open-source licenses forbid starting from scratch"
      },
      "explain": "<p>Training FLOPs ≈ 6 × parameters × tokens. A competent 70B × 2T run takes ~3 weeks on 4096 H100s at ~$8M at list rates. Fine-tuning is three orders of magnitude cheaper. The economics make starting from scratch a research-lab or frontier-company activity, not a product team's first instinct.</p>"
    }
  ]
}
</script>

# Quiz — Training vs. inference

Six questions on how training differs from inference in shape, memory, and cost. Chapter: [Training vs. inference](../04-training/training-vs-inference.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Which of these is <em>not</em> a fundamental difference between training and inference?",
      "choices": {
        "A": "Training needs a backward pass; inference only does the forward pass",
        "B": "Training holds activations across the whole batch for gradient computation; inference can discard them",
        "C": "Training uses a different attention algorithm than inference",
        "D": "Training requires an optimizer that keeps extra state per parameter"
      },
      "explain": "<p>Both use the same attention math. The real differences are the backward pass, the need to retain activations, and the optimizer state. That's why training memory per parameter is roughly <em>16–20 bytes</em> vs. <em>~2 bytes</em> for inference.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Roughly how much GPU memory does Adam optimizer state consume per parameter (in FP32)?",
      "choices": {
        "A": "2 bytes",
        "B": "8 bytes (two moments × 4 bytes each)",
        "C": "16 bytes",
        "D": "None — Adam only adds compute, not memory"
      },
      "explain": "<p>Adam tracks a first and second moment per parameter, each 4 bytes in FP32 — 8 bytes of optimizer state on top of the 4-byte weights and 4-byte gradients. That's the bulk of why training a 70B model needs hundreds of GB of memory even before activations.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Why can't you just turn up the batch size during training forever to fill the GPU?",
      "choices": {
        "A": "Larger batches reduce accuracy below a certain threshold",
        "B": "The optimizer becomes numerically unstable",
        "C": "Bandwidth saturates and you get diminishing MFU",
        "D": "Activations grow with batch size, and at some point you run out of memory — gradient checkpointing or smaller batches are the knobs"
      },
      "explain": "<p>Each item in the batch keeps its own activations in memory for the backward pass. Activations dominate memory at large batch and long sequences. Gradient checkpointing (trade recompute for memory) and smaller micro-batches with gradient accumulation are the usual responses.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> What does <strong>MFU</strong> (Model FLOPs Utilization) measure?",
      "choices": {
        "A": "The percentage of parameters updated per step",
        "B": "The fraction of the GPU's peak compute actually used by the model's useful FLOPs — how close to the hardware's theoretical ceiling you are",
        "C": "The ratio of forward FLOPs to backward FLOPs",
        "D": "The speedup from using Tensor Cores vs. CUDA cores"
      },
      "explain": "<p>MFU = useful model FLOPs / (GPU peak FLOPs × time). Good training setups hit 40–55% MFU; below 30% usually means communication, data loading, or kernel inefficiency is wasting time. It's the single best diagnostic for \"is my training expensive for the right reasons?\"</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> Inference typically runs at far lower GPU utilization than training. The main reason is:",
      "choices": {
        "A": "Decode is memory-bandwidth bound — each new token requires reading the full weight matrices, so you're limited by HBM throughput, not compute",
        "B": "Inference uses smaller models that can't saturate the GPU",
        "C": "The KV cache makes each token cheaper so the GPU is deliberately idle",
        "D": "Inference runs at lower precision, which leaves compute on the table"
      },
      "explain": "<p>Decoding one token at a time has a batch dimension of 1 (per user) — you read the whole weight matrix once and do a tiny amount of compute against it. You hit the HBM bandwidth ceiling long before the compute ceiling. This is why batching multiple users together is so valuable for serving.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Which statement about training economics is <em>true</em>?",
      "choices": {
        "A": "Training cost scales with model parameters only",
        "B": "Training is always more expensive than the sum of all inference runs on the model",
        "C": "Training cost scales with parameters × tokens (Chinchilla-style), and a 70B-parameter frontier run on 2T tokens costs several million dollars",
        "D": "Training a 70B model at Chinchilla-optimal data is cheap as long as you have enough GPUs"
      },
      "explain": "<p>Training FLOPs ≈ 6 × parameters × tokens. Chinchilla showed that data matters as much as parameter count. A 70B × 2T-token run is on the order of millions of GPU-hours — single-digit to low-double-digit millions of dollars at 2025 prices, depending on utilization.</p>"
    }
  ]
}
</script>

# Quiz — Tensor Cores

Six questions on the matmul power tools. Chapter: [Tensor Cores: power tools](../02-gpu-architecture/tensor-cores.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Roughly how much faster are tensor cores at BF16 compared to CUDA cores at FP32 on the same H100?",
      "choices": {
        "A": "About the same",
        "B": "~2×",
        "C": "~15×",
        "D": "~1,000×"
      },
      "explain": "<p>H100: ~67 TFLOPs FP32 on CUDA cores vs ~989 TFLOPs BF16 on tensor cores — about a 15× jump. Miss the tensor cores and you're leaving most of the chip on the table.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> A single tensor-core instruction computes…",
      "choices": {
        "A": "One scalar multiply-add operation, the same primitive a CUDA core executes per cycle",
        "B": "A small matrix multiply-accumulate (e.g., 16×16 × 16×8 → 16×8) in a single hardware step",
        "C": "An entire attention mechanism with Q, K, V projections fused into one tensor-core call",
        "D": "A single 2D convolution with bias, including the activation function applied at the end"
      },
      "explain": "<p>Tensor cores do matrix-matrix ops in hardware. A CUDA core multiplies scalars; a tensor core stamps out entire small matmuls per cycle.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Which of these precisions is <em>fastest</em> on Hopper-generation tensor cores?",
      "choices": {
        "A": "FP64",
        "B": "FP32",
        "C": "FP16",
        "D": "FP8/INT8"
      },
      "explain": "<p>Lower precision = smaller operands = more multiplies per cycle at the same silicon cost. FP8 on H100 nearly doubles BF16 throughput. On Blackwell, FP4 goes further still.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> How is a tensor core invoked at the programming level?",
      "choices": {
        "A": "By a warp cooperatively — each thread contributes a fragment of operand and collects a fragment of result",
        "B": "By one thread issuing scalar multiply-add instructions in sequence, the way a CUDA core would",
        "C": "By the CPU sending matmul descriptors over PCIe, which the tensor core executes asynchronously",
        "D": "Only via the high-level PyTorch API; CUDA C++ does not expose tensor-core instructions directly"
      },
      "explain": "<p>Tensor-core instructions are warp-level: all 32 threads participate, each owning a slice of the operands and result. Libraries like cuBLAS, cuDNN, and FlashAttention handle the orchestration.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What does \"2:4 structured sparsity\" give you on a Hopper tensor core?",
      "choices": {
        "A": "Significant accuracy loss with no measurable speedup, since hardware ignores the sparsity pattern",
        "B": "A 4× clock-rate boost on the affected SM to compensate for the precision drop from sparsity",
        "C": "Roughly 2× more effective compute — 2 of every 4 weights are zero, so half the multiplies skip",
        "D": "Memory savings only, since the zero weights drop out of HBM but compute speed stays unchanged"
      },
      "explain": "<p>The hardware recognizes the 2-of-4 pattern and skips half the multiplies, giving ~2× speedup for models (typically pruned and fine-tuned) that tolerate it.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why do most performance stories in LLM inference end up being about <em>memory</em> rather than <em>tensor cores</em>?",
      "choices": {
        "A": "Tensor cores only work during training; inference workloads have to fall back to CUDA cores",
        "B": "Tensor cores finish faster than HBM can deliver the next tile — data movement is the real limit",
        "C": "Tensor cores are too inaccurate for inference, so workloads fall back to higher-precision CUDA paths",
        "D": "Inference exclusively uses CUDA cores; only training-time matmul kernels actually call tensor cores"
      },
      "explain": "<p>A transformer is ~99% matmul, all running on tensor cores that are rarely the bottleneck. The whole optimization playbook — quantization, FlashAttention, KV cache tricks, batching — is about keeping those tensor cores fed.</p>"
    }
  ]
}
</script>

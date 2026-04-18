# Quiz — Quantization deep dive

Six questions on precision formats, calibration, and the economics of bit reduction. Chapter: [Quantization deep dive](../04-training/quantization.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Why does 4-bit quantization often cost only 1–2 points on benchmarks, even though 75% of the bits are gone?",
      "choices": {
        "A": "Modern models are trained redundantly with that loss in mind",
        "B": "Benchmarks are known to be insensitive to precision",
        "C": "LLM weights are heavily concentrated near zero with rare outliers — a distribution that can be captured well with few bits if you place them where the mass is",
        "D": "4-bit storage uses lossless compression on top of the quantization"
      },
      "explain": "<p>Quantization exploits distribution shape. A uniform distribution (audio samples, photograph pixels) uses every bit. LLM weights look like a pile of sand: a big peak near zero and a thin tail. Allocating bits proportionally to mass lets you compress much harder than naive intuition suggests.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What's the practical difference between BF16 and FP16?",
      "choices": {
        "A": "They're identical — same exponent and mantissa layout",
        "B": "BF16 has FP32's wider dynamic range (8 exponent bits) with less precision; FP16 has better precision but narrower range, causing training instabilities (gradient overflow)",
        "C": "BF16 is 4 bytes per value; FP16 is 2 bytes",
        "D": "BF16 works only on AMD; FP16 only on NVIDIA"
      },
      "explain": "<p>BF16 (bfloat16) trades mantissa bits for exponent bits — matching FP32's range at half the storage. That's why it's the training default: gradients can span many orders of magnitude, and BF16 handles them without overflow. FP16 is still fine for inference but was a training headache on older hardware.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> In weight-only quantization (the common case for LLMs), what happens during the matmul at compute time?",
      "choices": {
        "A": "Weights stored in INT4/INT8 are dequantized on-the-fly to BF16/FP16, multiplied against BF16 activations, and the result is BF16",
        "B": "Everything, including activations, is held in INT4",
        "C": "The GPU's tensor cores natively multiply INT4 × INT4 without dequantization",
        "D": "Weights stay in INT4 but activations are quantized first to match"
      },
      "explain": "<p>Weight-only quantization stores and <em>moves</em> weights in 4-bit (saving memory and bandwidth), then dequantizes before the multiply. You keep the compute in higher precision, so quality is preserved — and because decode is memory-bandwidth-bound, the saved bandwidth translates directly to throughput.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does GPTQ (or AWQ) do during calibration that simple rounding doesn't?",
      "choices": {
        "A": "It applies lossless compression after rounding",
        "B": "It retrains the whole model at low precision",
        "C": "It's a network protocol for sending weights",
        "D": "It runs a small representative dataset through the model to measure activation and weight distributions, then picks per-layer scale factors that preserve the important mass"
      },
      "explain": "<p>Post-training quantization uses a calibration pass (typically 128–512 examples) to find good scale factors. AWQ additionally identifies \"salient\" weights and preserves their precision while quantizing the rest harder. This calibration is what makes 4-bit quality acceptable — naive rounding loses far more.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A 70B model at BF16 is 140 GB. What is it (roughly) at INT4?",
      "choices": {
        "A": "~70 GB",
        "B": "~18 GB",
        "C": "~35 GB",
        "D": "Unchanged — quantization doesn't reduce weight storage"
      },
      "explain": "<p>BF16 is 2 bytes per parameter; INT4 is 0.5 bytes per parameter. The 4× reduction turns 140 GB into ~35 GB, which fits comfortably on a single H100 (80GB) with plenty of room for KV cache and activations. This is what makes single-GPU inference of a 70B model possible.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> For which deployment target is GGUF (not GPTQ or AWQ) the natural quantization choice?",
      "choices": {
        "A": "Large-scale NVIDIA datacenter serving with vLLM",
        "B": "Apple Silicon, CPU-only machines, and edge/desktop setups via llama.cpp",
        "C": "Training runs on H100",
        "D": "Training fine-tune runs with QLoRA"
      },
      "explain": "<p>GGUF is a file format used by llama.cpp and the Apple Silicon ecosystem. It wraps several quantization schemes (Q4_K_M, Q5_K_M, Q6_K, etc.) tuned for CPU and unified-memory GPUs. Pick GPTQ/AWQ for datacenter NVIDIA; pick GGUF for edge and Mac.</p>"
    }
  ]
}
</script>

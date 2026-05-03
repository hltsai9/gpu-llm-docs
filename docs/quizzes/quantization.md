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
        "A": "Models are built with intentional weight redundancy designed to tolerate lower precision",
        "B": "Benchmark suites don't correlate with real model quality, so precision changes don't show up",
        "C": "LLM weights cluster near zero; place bits where density is high to keep structure intact",
        "D": "4-bit uses additional lossless entropy coding to recover lost precision"
      },
      "explain": "<p>Quantization exploits distribution shape. A uniform distribution (audio samples, photograph pixels) uses every bit. LLM weights look like a pile of sand: a big peak near zero and a thin tail. Allocating bits proportionally to mass lets you compress much harder than naive intuition suggests.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What's the practical difference between BF16 and FP16?",
      "choices": {
        "A": "They're the same format under different names — exponent and mantissa bits are identical",
        "B": "BF16 has FP32's wide range with low precision; FP16 has higher precision but a narrow range",
        "C": "BF16 is 4 bytes per value while FP16 is 2 bytes per value, doubling the memory footprint",
        "D": "BF16 only runs on AMD hardware while FP16 is supported only on NVIDIA tensor cores"
      },
      "explain": "<p>BF16 (bfloat16) trades mantissa bits for exponent bits — matching FP32's range at half the storage. That's why it's the training default: gradients can span many orders of magnitude, and BF16 handles them without overflow. FP16 is still fine for inference but was a training headache on older hardware.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> In weight-only quantization (the common case for LLMs), what happens during the matmul at compute time?",
      "choices": {
        "A": "INT4/INT8 weights dequant to BF16/FP16, multiply against BF16 activations, result is BF16",
        "B": "All data including activations stays quantized in INT4 throughout computation",
        "C": "GPU tensor cores directly compute INT4 × INT4 natively without dequantization",
        "D": "Weights remain INT4; activations also quantize to match for the multiply"
      },
      "explain": "<p>Weight-only quantization stores and <em>moves</em> weights in 4-bit (saving memory and bandwidth), then dequantizes before the multiply. You keep the compute in higher precision, so quality is preserved — and because decode is memory-bandwidth-bound, the saved bandwidth translates directly to throughput.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does GPTQ (or AWQ) do during calibration that simple rounding doesn't?",
      "choices": {
        "A": "Stack Huffman compression on top of quantization for extra bit savings",
        "B": "Run full training on the model again at quantized precision from scratch",
        "C": "Define a file format and network protocol for sharing quantized model weights",
        "D": "Use calibration data to measure distributions; pick per-layer scales that keep important weight mass"
      },
      "explain": "<p>Post-training quantization uses a calibration pass (typically 128–512 examples) to find good scale factors. AWQ additionally identifies \"salient\" weights and preserves their precision while quantizing the rest harder. This calibration is what makes 4-bit quality acceptable — naive rounding loses far more.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A 70B model at BF16 is 140 GB. What is it (roughly) at INT4?",
      "choices": {
        "A": "Still ~70 GB because quantization compresses internally only",
        "B": "~18 GB after applying secondary lossless compression filters",
        "C": "~35 GB — 4× reduction fits in one 80GB H100 with room left",
        "D": "Size unchanged — quantization is computation-level, not storage"
      },
      "explain": "<p>BF16 is 2 bytes per parameter; INT4 is 0.5 bytes per parameter. The 4× reduction turns 140 GB into ~35 GB, which fits comfortably on a single H100 (80GB) with plenty of room for KV cache and activations. This is what makes single-GPU inference of a 70B model possible.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> For which deployment target is GGUF (not GPTQ or AWQ) the natural quantization choice?",
      "choices": {
        "A": "NVIDIA datacenter GPU serving at scale with vLLM infrastructure",
        "B": "Apple Silicon, CPU-only, and edge devices running llama.cpp",
        "C": "On-premise H100 training cluster for scratch pretraining",
        "D": "Fine-tuning training workflows using QLoRA adapters"
      },
      "explain": "<p>GGUF is a file format used by llama.cpp and the Apple Silicon ecosystem. It wraps several quantization schemes (Q4_K_M, Q5_K_M, Q6_K, etc.) tuned for CPU and unified-memory GPUs. Pick GPTQ/AWQ for datacenter NVIDIA; pick GGUF for edge and Mac.</p>"
    }
  ]
}
</script>

# Quiz — Anatomy of a GPU

Six questions on SMs, CUDA cores, tensor cores, and HBM. Chapter: [Anatomy of a GPU](../02-gpu-architecture/anatomy.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> An NVIDIA H100 is built from how many Streaming Multiprocessors (SMs)?",
      "choices": {
        "A": "32",
        "B": "132",
        "C": "1,024",
        "D": "16,384"
      },
      "explain": "<p>The H100 has 132 SMs — 132 \"workshops\" that share an L2 cache and HBM. Each SM contains its own cores, schedulers, register file, and shared memory.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What does the GigaThread engine do?",
      "choices": {
        "A": "Runs graphics workloads on the GPU",
        "B": "Boosts clock speeds during heavy kernels",
        "C": "Distributes thread blocks across the SMs when a kernel is launched",
        "D": "Compresses data before writing to HBM"
      },
      "explain": "<p>The GigaThread engine is the chip-wide scheduler. You say \"launch this kernel across N blocks\"; it decides which SM runs which block, and hands out more blocks as SMs finish.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> Where does shared memory physically live?",
      "choices": {
        "A": "Inside each SM — fast, small, private to that SM's thread blocks",
        "B": "In HBM, off-die",
        "C": "In CPU RAM, accessible over PCIe",
        "D": "It's a software fiction backed by L2"
      },
      "explain": "<p>Shared memory (~256 KB per SM on H100) is on-die inside each SM. It's many times faster than HBM and is the \"workshop stockroom\" where blocks stage data they'll reuse.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What's the approximate HBM bandwidth on an H100 SXM?",
      "choices": {
        "A": "30 GB/s",
        "B": "300 MB/s",
        "C": "300 GB/s",
        "D": "~3 TB/s"
      },
      "explain": "<p>H100 ships ~3.35 TB/s of HBM3 bandwidth through a 5,120-bit memory bus. This is one of the widest memory interfaces in mainstream computing.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> Which on-chip structure actually performs the bulk of LLM arithmetic?",
      "choices": {
        "A": "CUDA cores (FP32 scalar ops)",
        "B": "Tensor cores — purpose-built for small matrix multiply-accumulate",
        "C": "The L2 cache",
        "D": "The warp scheduler"
      },
      "explain": "<p>Tensor cores dominate an H100's usable FLOPs: ~989 TFLOPs at BF16 vs ~67 TFLOPs on CUDA cores at FP32. Modern LLM kernels funnel work into tensor cores.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Why don't tensor cores become the bottleneck during LLM inference?",
      "choices": {
        "A": "They finish faster than HBM can feed them — the chip is memory-bound on most workloads",
        "B": "They're too slow for modern models",
        "C": "They're only active during training",
        "D": "CUDA cores do all the real work"
      },
      "explain": "<p>Tensor cores are \"overqualified\" — they could consume far more data than HBM can deliver. The bottleneck is almost always memory bandwidth, not compute.</p>"
    }
  ]
}
</script>

# Quiz — Memory-bound vs. compute-bound

Seven questions on the roofline, the unifying mental model. Chapter: [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> What two ceilings define the roofline?",
      "choices": {
        "A": "The total number of cores and the GPU's operating clock speed",
        "B": "The size of cache memory and the total HBM capacity available",
        "C": "Peak compute throughput (FLOPs/sec) and peak memory bandwidth (bytes/sec)",
        "D": "The power dissipation of the GPU and its maximum operating temperature"
      },
      "explain": "<p>Every operation is limited by one or the other. Low arithmetic intensity → bandwidth is the ceiling. High arithmetic intensity → compute is the ceiling. The roofline graph shows where the switch happens.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Batch-1 decode on a 70B model at FP16 has an arithmetic intensity of roughly…",
      "choices": {
        "A": "~1 op/byte — deeply memory-bound, using less than 1% of tensor-core capacity",
        "B": "~1,000 ops/byte — compute-bound and saturating tensor cores efficiently",
        "C": "~295 ops/byte — exactly at the roofline crossover point for H100 GPUs",
        "D": "It varies significantly depending on the content and length of the prompt"
      },
      "explain": "<p>140 GB of weights moved for ~140 GFLOPs of work → about 1 op/byte. On a chip that wants 295 ops/byte to saturate, that leaves tensor cores mostly idle.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> Reducing bytes moved from HBM directly speeds up which kind of operation?",
      "choices": {
        "A": "A compute-bound operation where bytes weren't actually the bottleneck",
        "B": "A memory-bound operation, where HBM bandwidth was the actual bottleneck on speed",
        "C": "Neither type — byte reduction and speed performance are independent factors",
        "D": "Both compute-bound and memory-bound operations are equally affected"
      },
      "explain": "<p>If you were compute-bound, fewer bytes moved does little. If you were memory-bound, every byte saved is proportional speedup. That's why quantization helps decode so much more than prefill.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> Why have GPU rooflines drifted <em>rightward</em> (higher crossover ops/byte) across generations?",
      "choices": {
        "A": "HBM memory speeds decreased with each new GPU generation",
        "B": "Modern workloads require less total compute to accomplish the same task",
        "C": "GPU clock speeds and frequencies have steadily dropped",
        "D": "Compute grew faster than memory bandwidth — so each new GPU needs higher arithmetic intensity to saturate"
      },
      "explain": "<p>From Pascal (~15) to Hopper (~295) ops/byte, compute throughput has consistently outpaced HBM bandwidth. The same workload that was compute-bound on old hardware can become memory-bound on new hardware — driving the complexity of modern inference engines.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> How does FlashAttention move attention on the roofline graph?",
      "choices": {
        "A": "It increases arithmetic intensity (fewer HBM bytes for the same math), shifting attention from memory-bound toward compute-bound",
        "B": "It greatly increases the total number of FLOPs required for the operation",
        "C": "It significantly lowers the peak compute throughput ceiling of the GPU",
        "D": "It has essentially no measurable effect on the roofline position"
      },
      "explain": "<p>FlashAttention doesn't change the math or the FLOPs; it changes the memory layout so the L×L score matrix never goes to HBM. Bytes moved drop sharply → intensity rises → compute-bound regime.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Which of these is <em>not</em> a motion on the roofline graph?",
      "choices": {
        "A": "Batching many sequences through shared weights increases arithmetic intensity rightward",
        "B": "Rewriting a Python function in Rust on the CPU (stays off the GPU roofline entirely)",
        "C": "Quantizing weights to FP8 to reduce bytes moved (moves rightward on x-axis)",
        "D": "Upgrading from H100 to H200 (raises the memory-bandwidth ceiling line)"
      },
      "explain": "<p>CPU-side rewrites don't change GPU performance characteristics. The other three are all genuine roofline motions — either along the x-axis (intensity) or raising a ceiling line.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q7.</strong> What's the cleanest one-line test for whether a new optimization will help a memory-bound op?",
      "choices": {
        "A": "Does it increase the number of processing cores available?",
        "B": "Does it increase the total FLOPs required per operation?",
        "C": "Does it reduce bytes moved from HBM for the same work?",
        "D": "Does it raise the clock speed or operating frequency?"
      },
      "explain": "<p>For memory-bound ops, less HBM traffic ≈ more speed. If the technique doesn't reduce bytes moved, it probably won't help — or might even slow things down by adding complexity.</p>"
    }
  ]
}
</script>

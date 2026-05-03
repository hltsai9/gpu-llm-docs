# Quiz — Throughput over latency

Five questions on the latency/throughput tradeoff. Chapter: [Throughput over latency](../01-why-gpu/throughput-vs-latency.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> In the highway analogy, which strategy wins for moving 10,000 people from SF to LA?",
      "choices": {
        "A": "The Ferrari — fast per trip, then turn around and repeat many times",
        "B": "The freight train — slower per trip, but carries 10,000 people at once",
        "C": "Both take the same total time to move all 10,000 people across",
        "D": "Neither strategy works — latency advantages always beat throughput gains"
      },
      "explain": "<p>The train wins by enormous margins despite being slower per trip, because it moves the whole crowd in parallel. GPUs are the train: often slower per op than a CPU, but vastly higher total throughput.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> When a warp on a GPU stalls waiting for memory, what does the SM do?",
      "choices": {
        "A": "Halt execution on all cores until the memory data returns",
        "B": "Restart that warp from the beginning of the kernel code",
        "C": "Switch to another ready warp so the arithmetic units stay busy",
        "D": "Ask the CPU to fetch the memory data instead of waiting"
      },
      "explain": "<p>This is <strong>latency hiding</strong>: the SM keeps dozens of warps in flight, and when one stalls, the scheduler runs another. Per-thread latency can be huge, but aggregate throughput stays near peak.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> Why are small batches bad for GPU utilization when serving an LLM?",
      "choices": {
        "A": "A tiny batch under-uses the tensor cores — the freight train runs half-empty",
        "B": "Small batches cause excessive heat and force the GPU to thermal-throttle",
        "C": "The CUDA driver explicitly refuses to launch kernels with small batches",
        "D": "Small batches actually require higher total FLOPs than larger batch sizes"
      },
      "explain": "<p>A GPU earns its throughput by running many pieces of work in parallel. A batch of 1 leaves thousands of cores idle — the train is half-empty.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What's typically true about a <em>single</em> operation on a GPU versus on a CPU?",
      "choices": {
        "A": "The GPU's single-op latency is always lower than the CPU equivalent",
        "B": "They are identical in speed and latency characteristics",
        "C": "GPU latency improves when running Python code instead of compiled code",
        "D": "A single op often takes <em>longer</em> on the GPU — but it does millions in parallel"
      },
      "explain": "<p>Any one thread on a GPU is unremarkable in speed. The chip wins on aggregate: thousands of threads making progress at once while any given one waits.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> A system produces 100 tokens/sec for one user versus 10,000 tokens/sec across 100 users. These numbers describe…",
      "choices": {
        "A": "The same performance metric measured using two different units and scales",
        "B": "Two different targets — per-user latency vs overall throughput — which usually trade off",
        "C": "A measurement error or instrumentation bug in the serving system",
        "D": "The performance comparison between native CPU implementation and GPU implementation"
      },
      "explain": "<p>Latency (tokens/sec for one user) and throughput (total tokens/sec across users) are different. Serving systems pick a target; you generally can't max both at the same time.</p>"
    }
  ]
}
</script>

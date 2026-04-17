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
        "A": "The Ferrari — fast per trip, turn around and repeat",
        "B": "The freight train — slower per trip, but carries 10,000 at once",
        "C": "They take the same total time",
        "D": "Neither — latency always wins over throughput"
      },
      "explain": "<p>The train wins by enormous margins despite being slower per trip, because it moves the whole crowd in parallel. GPUs are the train: often slower per op than a CPU, but vastly higher total throughput.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> When a warp on a GPU stalls waiting for memory, what does the SM do?",
      "choices": {
        "A": "Halt all cores until the memory load returns",
        "B": "Restart the warp from the beginning",
        "C": "Switch to another ready warp so the arithmetic units stay busy",
        "D": "Ask the CPU to fetch the data instead"
      },
      "explain": "<p>This is <strong>latency hiding</strong>: the SM keeps dozens of warps in flight, and when one stalls, the scheduler runs another. Per-thread latency can be huge, but aggregate throughput stays near peak.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> Why are small batches bad for GPU utilization when serving an LLM?",
      "choices": {
        "A": "A tiny batch under-uses the tensor cores — you're sending a freight train half-empty",
        "B": "Small batches cause the GPU to overheat",
        "C": "The CUDA driver refuses them",
        "D": "Small batches have higher total FLOPs than large ones"
      },
      "explain": "<p>A GPU earns its throughput by running many pieces of work in parallel. A batch of 1 leaves thousands of cores idle — the train is half-empty.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What's typically true about a <em>single</em> operation on a GPU versus on a CPU?",
      "choices": {
        "A": "The GPU's single-op latency is always lower",
        "B": "They're identical",
        "C": "GPU latency is lower when running Python",
        "D": "A single op often takes <em>longer</em> on the GPU — but the GPU does millions in parallel"
      },
      "explain": "<p>Any one thread on a GPU is unremarkable in speed. The chip wins on aggregate: thousands of threads making progress at once while any given one waits.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> A system produces 100 tokens/sec for one user versus 10,000 tokens/sec across 100 users. These numbers describe…",
      "choices": {
        "A": "The same metric measured two ways",
        "B": "Two different targets — per-user latency vs overall throughput — which usually trade off against each other",
        "C": "A bug in the measurement",
        "D": "CPU vs GPU comparison"
      },
      "explain": "<p>Latency (tokens/sec for one user) and throughput (total tokens/sec across users) are different. Serving systems pick a target; you generally can't max both at the same time.</p>"
    }
  ]
}
</script>

# Quiz — Continuous batching

Six questions on iteration-level batching and the throughput wins it unlocks. Chapter: [Continuous batching](../05-serving/continuous-batching.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> What's wrong with <em>static</em> batching in the style of \"collect N requests, pad to the longest, run one big forward pass\"?",
      "choices": {
        "A": "Modern GPUs don't support padded tensors and will silently ignore masked positions",
        "B": "Static batching restricts you to FP32 and prevents mixed-precision quantization",
        "C": "Head-of-line blocking: short replies wait while long ones finish, GPU idles between batches",
        "D": "Static batches cannot utilize the parallelism available in tensor cores"
      },
      "explain": "<p>Static batching is limited by the slowest request in the batch. Short replies wait under the heat lamp while the long one cooks; the GPU sits idle between batches. Continuous batching fixes this by adding and removing requests at every decode step — no waiting, no padding to the longest.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Why is it <em>possible</em> to switch requests in and out at every decode step?",
      "choices": {
        "A": "Each decode step samples exactly one token per request independently",
        "B": "Modern transformers have no internal state and recompute the full context each step",
        "C": "Every request in the batch must generate the same output token to maintain coherence",
        "D": "Decoding processes only one user's request at a time sequentially"
      },
      "explain": "<p>The decode loop fundamentally processes one token per request per step. That means the batch at step t+1 doesn't have to match the batch at step t — you can add, remove, or re-order at any step boundary. This is why continuous batching works and why static batching is leaving huge throughput on the table.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Continuous batching depends on which three infrastructure pieces?",
      "choices": {
        "A": "FP8 quantization on tensor cores, NVLink cross-GPU bandwidth, and InfiniBand networking",
        "B": "Speculative decoding for lookahead, MoE dynamic routing, and LoRA adapter swapping",
        "C": "CPU memory spillover, disk caching for weights, and kernel-free tensor operations",
        "D": "Paged KV cache for allocation, fast single-step kernels with CUDA graphs, and a scheduler"
      },
      "explain": "<p>Without paged KV cache, per-request allocation fragments memory. Without efficient single-step kernels, the per-step cost makes the frequent scheduling too expensive. Without a scheduler, you can't decide which pending request enters the batch next. All three need to be solid — which is why rolling your own is so hard.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Once continuous batching is working, the new bottleneck is typically:",
      "choices": {
        "A": "Reading model weights from disk or network storage at startup",
        "B": "KV cache memory capacity and how many concurrent requests can fit",
        "C": "CPU-side tokenization speed and text processing throughput",
        "D": "Overhead from launching many small CUDA kernels per decode step"
      },
      "explain": "<p>Continuous batching makes GPU compute roughly optimal. What limits concurrency then is KV cache memory — each in-flight request occupies some KV pages, and when they fill HBM, new requests must wait or existing ones must be preempted/evicted. Tuning max_num_seqs and KV cache fraction becomes the next lever.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What does <em>chunked prefill</em> solve?",
      "choices": {
        "A": "It reduces input prompt size using dictionary-based compression algorithms",
        "B": "It stores prefill computation results to disk for later cache hits",
        "C": "It interleaves long prefill chunks with decode steps to avoid stalling other requests",
        "D": "It offloads prefill processing to a dedicated second GPU for parallelism"
      },
      "explain": "<p>A long prefill is compute-heavy and can block decode for other users. Chunked prefill breaks the prefill into smaller pieces that can be interleaved with decode steps across the batch, keeping decode responsive. Most modern serving frameworks support it; leaving it off is a common tuning mistake.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Prefix sharing in a continuous-batching server saves cost when:",
      "choices": {
        "A": "Multiple concurrent requests reuse a long shared prefix, pointing to the same KV pages",
        "B": "All users submit identical requests and queries to the system",
        "C": "The system prompt is unique and different for every single request",
        "D": "Only the first output token is needed, not the full generation"
      },
      "explain": "<p>If user A and user B share a long system prompt, their KV cache for that prefix is identical. Paged attention lets them point to the same pages — one computation, two (or more) readers — halving cache usage and skipping the prefill for the shared part. For chat apps with a fixed system prompt, this is free throughput.</p>"
    }
  ]
}
</script>

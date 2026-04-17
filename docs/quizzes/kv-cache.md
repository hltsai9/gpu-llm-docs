# Quiz — The KV cache

Seven questions on the notebook that makes streaming feasible. Chapter: [The KV cache](../03-llm-inference/kv-cache.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Why do we cache K and V but not Q?",
      "choices": {
        "A": "Q takes too much memory",
        "B": "Q is also cached",
        "C": "K and V for past tokens don't change from step to step; the new token's Q is used against the cached history",
        "D": "Q is stored in the CPU"
      },
      "explain": "<p>Token 3's K and V in layer 17 are identical when generating token 100 as they were when generating token 4 — so we compute them once and keep them. The <em>new</em> token's Q is what we actually need each step.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Without a KV cache, how does the cost of generating token t grow?",
      "choices": {
        "A": "Roughly linearly (or worse) with t — you'd be recomputing all prior K/V every step",
        "B": "Constant regardless of t",
        "C": "Only depends on batch size",
        "D": "Sublinearly — caches aren't needed"
      },
      "explain": "<p>Each new token would require re-running the full prefix through the model. By token 2,000, you'd repeat 2,000× the work. The cache converts this into roughly constant work per new token (plus the growing attention cost).</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> Approximately how much KV cache does a 70B parameter model (Llama-2-70B-ish, no GQA) use per token at FP16?",
      "choices": {
        "A": "~25 KB",
        "B": "~2.5 MB",
        "C": "~2.5 GB",
        "D": "~25 MB"
      },
      "explain": "<p>~2.5 MB per token. At 32K context that's ~82 GB — more than an H100's entire HBM. It's why KV-cache optimization is the central memory problem of LLM serving.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does Grouped-Query Attention (GQA) do?",
      "choices": {
        "A": "Runs attention across grouped GPUs",
        "B": "Doubles the number of attention heads",
        "C": "Replaces softmax with a grouped operation",
        "D": "Lets groups of Q-heads share one K/V pair, shrinking the KV cache"
      },
      "explain": "<p>Llama-2 70B has 64 Q-heads and 8 KV-heads — an 8× KV cache reduction at tiny quality cost. GQA is standard in modern open models because KV cache size is so critical.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> What's the main benefit of a paged KV cache (vLLM-style)?",
      "choices": {
        "A": "Reduces memory fragmentation and enables sharing pages between sequences that have common prefixes",
        "B": "Makes attention numerically more accurate",
        "C": "Speeds up tensor cores",
        "D": "Eliminates the KV cache altogether"
      },
      "explain": "<p>Paging is borrowed from OS virtual memory. Fixed-size pages let the server pack more sequences per GPU and let multiple sequences point at the same pages for shared prefixes (e.g., identical system prompts).</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> During decoding, each new token's forward pass must read…",
      "choices": {
        "A": "Only the new token's activations",
        "B": "Only the embedding table",
        "C": "All weight matrices <em>and</em> the full KV cache up to now",
        "D": "Only the LM head"
      },
      "explain": "<p>Weights: every layer's matmul reads the full weight tensor. KV cache: attention against prior tokens reads the entire cache. That's why decode is memory-bound — lots of HBM reads, tiny arithmetic per byte.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q7.</strong> Quantizing the KV cache from FP16 to INT8 primarily helps by…",
      "choices": {
        "A": "Reducing accuracy to make training faster",
        "B": "Halving the bytes read per decode step — which directly speeds up memory-bound decode",
        "C": "Allowing more attention heads",
        "D": "Disabling the causal mask"
      },
      "explain": "<p>Same idea as weight quantization: every byte saved is a byte the HBM doesn't have to move. Decode throughput scales inversely with KV cache bytes.</p>"
    }
  ]
}
</script>

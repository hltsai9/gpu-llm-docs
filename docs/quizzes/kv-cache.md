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
        "A": "Q takes up so much memory that caching becomes prohibitively expensive",
        "B": "Q is also cached alongside K and V in the same buffer",
        "C": "K and V for past tokens don't change from step to step; the new token's Q is used against the cached history",
        "D": "Q is stored on the CPU side instead of GPU memory"
      },
      "explain": "<p>Token 3's K and V in layer 17 are identical when generating token 100 as they were when generating token 4 — so we compute them once and keep them. The <em>new</em> token's Q is what we actually need each step.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Without a KV cache, how does the cost of generating token t grow?",
      "choices": {
        "A": "Roughly linearly (or worse) with t — you'd be recomputing all prior K/V every step",
        "B": "Completely constant regardless of how long the sequence gets",
        "C": "Only depends on the batch size and not on the sequence length",
        "D": "Sublinearly — caches aren't actually needed at all"
      },
      "explain": "<p>Each new token would require re-running the full prefix through the model. By token 2,000, you'd repeat 2,000× the work. The cache converts this into roughly constant work per new token (plus the growing attention cost).</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> Approximately how much KV cache does a 70B parameter model (Llama-2-70B-ish, no GQA) use per token at FP16?",
      "choices": {
        "A": "Approximately 25 kilobytes per token on average across the model",
        "B": "About 2.5 megabytes per token of cache storage",
        "C": "About 2.5 gigabytes per token of storage required",
        "D": "Approximately 25 megabytes per token of cache storage"
      },
      "explain": "<p>~2.5 MB per token. At 32K context that's ~82 GB — more than an H100's entire HBM. It's why KV-cache optimization is the central memory problem of LLM serving.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does Grouped-Query Attention (GQA) do?",
      "choices": {
        "A": "Distributes attention computation across multiple grouped GPUs in parallel",
        "B": "Increases the total number of attention heads for better expressiveness",
        "C": "Replaces the softmax operation with a grouped alternative computation",
        "D": "Lets groups of Q-heads share one K/V pair, shrinking the KV cache"
      },
      "explain": "<p>Llama-2 70B has 64 Q-heads and 8 KV-heads — an 8× KV cache reduction at tiny quality cost. GQA is standard in modern open models because KV cache size is so critical.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> What's the main benefit of a paged KV cache (vLLM-style)?",
      "choices": {
        "A": "Reduces memory fragmentation and enables sharing pages between sequences that have common prefixes",
        "B": "Increases the numerical precision of attention weight calculations",
        "C": "Directly speeds up tensor core computations for matrix multiplications",
        "D": "Completely removes the need for KV cache storage during generation"
      },
      "explain": "<p>Paging is borrowed from OS virtual memory. Fixed-size pages let the server pack more sequences per GPU and let multiple sequences point at the same pages for shared prefixes (e.g., identical system prompts).</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> During decoding, each new token's forward pass must read…",
      "choices": {
        "A": "Only the activations specific to the newly computed token position",
        "B": "Only the embedding lookup table used for vocabulary mapping",
        "C": "All weight matrices <em>and</em> the full KV cache up to now",
        "D": "Only the LM head's final projection layer weight matrix"
      },
      "explain": "<p>Weights: every layer's matmul reads the full weight tensor. KV cache: attention against prior tokens reads the entire cache. That's why decode is memory-bound — lots of HBM reads, tiny arithmetic per byte.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q7.</strong> Quantizing the KV cache from FP16 to INT8 primarily helps by…",
      "choices": {
        "A": "Sacrificing accuracy to speed up the training phase overall",
        "B": "Halving the bytes read per decode step — which directly speeds up memory-bound decode",
        "C": "Enabling additional attention heads that weren't possible before",
        "D": "Removing the causal masking requirement from the computation"
      },
      "explain": "<p>Same idea as weight quantization: every byte saved is a byte the HBM doesn't have to move. Decode throughput scales inversely with KV cache bytes.</p>"
    }
  ]
}
</script>

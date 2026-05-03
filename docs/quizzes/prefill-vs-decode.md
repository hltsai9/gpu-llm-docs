# Quiz — Prefill vs. decode

Six questions on the two-phase split. Chapter: [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> Which phase is compute-bound?",
      "choices": {
        "A": "Prefill — prompt tokens flow through the model in parallel at high arithmetic intensity",
        "B": "Decode — one token at a time, but each step does enough math to saturate the tensor cores",
        "C": "Both equally — prefill and decode share the same arithmetic-intensity profile per layer",
        "D": "Neither — both phases are memory-bound and limited by HBM bandwidth in practice"
      },
      "explain": "<p>Prefill processes thousands of tokens in one pass, so weights are heavily reused across those tokens. The tensor cores are the bottleneck there. Decode, by contrast, does minimal work per HBM byte moved.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What does TTFT stand for — and what does it mostly depend on?",
      "choices": {
        "A": "Tokens-To-Free-Time; depends on the GPU cooler",
        "B": "Total Transformer Float Tally; independent of prompt length",
        "C": "Time-To-First-Token; dominated by prefill and grows with prompt length",
        "D": "Transformer Tensor-Format Timing; a precision setting"
      },
      "explain": "<p>TTFT = time to first token. Since the first token requires a full prefill pass over the whole prompt, TTFT scales roughly linearly with prompt length.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> Why is decode memory-bound even though per-token arithmetic is small?",
      "choices": {
        "A": "Because decode runs on CUDA cores instead of tensor cores, sacrificing FLOPs throughput",
        "B": "Because each step reads the full weight set + KV cache from HBM for a single token's activations",
        "C": "Because decode periodically writes intermediate state to disk for crash-recovery purposes",
        "D": "Because the causal attention mask requires extra bookkeeping that slows the kernel down"
      },
      "explain": "<p>The weights don't get smaller just because only one token is being processed. 140 GB of weights still have to stream from HBM for each decode step — huge memory traffic per token produced.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which H200 feature helps <em>decode</em> throughput more than prefill?",
      "choices": {
        "A": "Larger, faster HBM — more bandwidth for the memory-bound decode phase",
        "B": "More tensor cores per SM, raising peak FP16 and BF16 throughput across the chip",
        "C": "Higher clock speed on streaming multiprocessors, accelerating per-cycle work",
        "D": "A different instruction set with extra fused-attention opcodes for decode kernels"
      },
      "explain": "<p>Prefill is compute-bound, so extra FLOPs help. Decode is bandwidth-bound, so extra HBM bandwidth translates almost 1:1 into tokens/sec.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q5.</strong> What's the value of disaggregated serving (separating prefill and decode onto different GPUs)?",
      "choices": {
        "A": "It transparently shortens user prompts so prefill takes less time per request",
        "B": "It reduces the model's effective parameter count by sharding weights across two pools",
        "C": "It's just another name for batching — the two phases run together on one GPU pool",
        "D": "The two phases have opposite bottlenecks; dedicated pools stop one GPU juggling both badly"
      },
      "explain": "<p>A prefill pool runs compute-saturating kernels at high arithmetic intensity. A decode pool runs bandwidth-saturating kernels with large batches. Mixing them on one GPU means neither is fully utilized.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> What problem does \"chunked prefill\" solve?",
      "choices": {
        "A": "Quantization numerical errors that accumulate when prefill spans many sequential layers",
        "B": "KV cache fragmentation, by allocating fixed-size blocks instead of contiguous memory",
        "C": "A long prefill otherwise blocking decode steps for other users sharing the same GPU",
        "D": "Warp divergence inside attention, caused by mixed-length sequences in a shared batch"
      },
      "explain": "<p>Splitting a long prompt into 256/512-token chunks lets the scheduler interleave those chunks with decode steps from other requests, so a giant prompt doesn't freeze everyone else.</p>"
    }
  ]
}
</script>

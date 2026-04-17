# Quiz — Batching many diners at once

Six questions on amortization and continuous batching. Chapter: [Batching many diners at once](../03-llm-inference/batching.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> What does batching <em>amortize</em> during decode?",
      "choices": {
        "A": "The HBM read of each layer's weights — the same weights serve every sequence in the batch in one pass",
        "B": "The CUDA kernel launch overhead",
        "C": "The softmax calculation",
        "D": "Nothing — each request is independent"
      },
      "explain": "<p>Weights are read from HBM once per step, regardless of batch size. Running that one weight-read against 64 sequences produces 64× more useful work — arithmetic intensity jumps proportionally.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What's the key difference between static and continuous batching?",
      "choices": {
        "A": "Static batching is faster per token",
        "B": "Continuous batching has no batch size",
        "C": "Static batches requests together until the slowest finishes; continuous batching (iteration-level) adds and drops sequences between decode steps",
        "D": "Only static batching uses the GPU"
      },
      "explain": "<p>Static batching is the tour bus — you wait for the latest passenger. Continuous batching is a rideshare van — passengers get on and off along the route, so the GPU is always nearly full.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> What sets the practical ceiling on how big the decode batch can be?",
      "choices": {
        "A": "CUDA's thread-block limit",
        "B": "The length of the prompt",
        "C": "The model's parameter count alone",
        "D": "KV cache memory — each concurrent sequence needs its own cache in HBM"
      },
      "explain": "<p>Weights are shared across the batch, but KV cache is per-sequence. Total HBM divided by per-sequence KV cache sets how many conversations you can keep alive at once.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Does batching help <em>prefill</em> the same way it helps decode?",
      "choices": {
        "A": "Yes — identical benefit",
        "B": "Less so — a single large prefill already saturates tensor cores (compute-bound), so adding more prefills doesn't speed things up further",
        "C": "No, batching hurts prefill",
        "D": "Prefill doesn't use HBM"
      },
      "explain": "<p>Prefill is already compute-bound at ordinary sizes. Batching many short prefills together helps, but once one prefill fills the chip, more don't make it faster — they queue.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> Continuous batching batches at which granularity?",
      "choices": {
        "A": "Per token (iteration) — each decode step is a fresh batch of whatever sequences happen to be active",
        "B": "Per day",
        "C": "Per epoch",
        "D": "Per model"
      },
      "explain": "<p>Token-level / iteration-level batching: on every decode step, the scheduler rebuilds the batch from active requests. Sequences finish and leave immediately; new ones join as soon as prefill completes.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> As batch size grows, what starts to dominate HBM traffic (eventually replacing weights)?",
      "choices": {
        "A": "The embedding table",
        "B": "The model's bias vectors",
        "C": "The KV cache reads — they scale linearly with batch size, while weight reads stay constant",
        "D": "The warp scheduler"
      },
      "explain": "<p>Weights: 1× per step no matter the batch. KV cache: N× for a batch of N. Eventually KV cache traffic exceeds weight traffic and becomes the new bottleneck — which is why shrinking the KV cache is so important.</p>"
    }
  ]
}
</script>

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
        "A": "The HBM read of each layer's weights — one fetch serves every sequence in the batch",
        "B": "The CUDA kernel launch overhead, which dominates when steps are small or pipelined",
        "C": "The softmax calculation, which only runs once per layer regardless of batch size",
        "D": "Nothing — each request runs an independent forward pass with its own weight fetch"
      },
      "explain": "<p>Weights are read from HBM once per step, regardless of batch size. Running that one weight-read against 64 sequences produces 64× more useful work — arithmetic intensity jumps proportionally.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What's the key difference between static and continuous batching?",
      "choices": {
        "A": "Static batching is faster per token because every request runs the same fixed forward pass",
        "B": "Continuous batching has no notion of batch size; each request runs in its own dedicated kernel",
        "C": "Static waits for the slowest request to finish; continuous (iteration-level) adds and drops between steps",
        "D": "Only static batching actually runs on the GPU; continuous batching falls back to CPU scheduling"
      },
      "explain": "<p>Static batching is the tour bus — you wait for the latest passenger. Continuous batching is a rideshare van — passengers get on and off along the route, so the GPU is always nearly full.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> What sets the practical ceiling on how big the decode batch can be?",
      "choices": {
        "A": "CUDA's hard thread-block dispatch limit per kernel invocation",
        "B": "The length of the prompt, since longer prompts need bigger compute slots",
        "C": "The model's raw parameter count alone, which fixes how much HBM is left over",
        "D": "KV cache memory — each concurrent sequence needs its own per-layer cache in HBM"
      },
      "explain": "<p>Weights are shared across the batch, but KV cache is per-sequence. Total HBM divided by per-sequence KV cache sets how many conversations you can keep alive at once.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Does batching help <em>prefill</em> the same way it helps decode?",
      "choices": {
        "A": "Yes — identical benefit, since prefill and decode share the same arithmetic intensity profile",
        "B": "Less so — a single prefill already saturates tensor cores (compute-bound), more prefills queue",
        "C": "No, batching actively hurts prefill because it forces synchronization across short sequences",
        "D": "Prefill doesn't use HBM at all, so batching can't amortize anything during the prefill phase"
      },
      "explain": "<p>Prefill is already compute-bound at ordinary sizes. Batching many short prefills together helps, but once one prefill fills the chip, more don't make it faster — they queue.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> Continuous batching batches at which granularity?",
      "choices": {
        "A": "Per token (iteration) — each decode step is a fresh batch of whichever sequences are active",
        "B": "Per request — sequences batch only with others arriving in the same incoming HTTP request",
        "C": "Per epoch — the scheduler waits for all in-flight sequences to finish before starting a new batch",
        "D": "Per model — only sequences hitting the same model deployment can ever share a single batch"
      },
      "explain": "<p>Token-level / iteration-level batching: on every decode step, the scheduler rebuilds the batch from active requests. Sequences finish and leave immediately; new ones join as soon as prefill completes.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> As batch size grows, what starts to dominate HBM traffic (eventually replacing weights)?",
      "choices": {
        "A": "The embedding table, since each new token in the batch hits a different embedding row",
        "B": "The model's bias vectors, which need to be re-fetched once per sequence per layer",
        "C": "The KV cache reads — they scale linearly with batch size, while weight reads stay constant",
        "D": "The warp scheduler's dispatch metadata, which grows with the number of active sequences"
      },
      "explain": "<p>Weights: 1× per step no matter the batch. KV cache: N× for a batch of N. Eventually KV cache traffic exceeds weight traffic and becomes the new bottleneck — which is why shrinking the KV cache is so important.</p>"
    }
  ]
}
</script>

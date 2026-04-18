# Part 3 — LLM Inference

We have the kitchen. Now we watch it cook.

Part 3 follows a token from the moment you hit "send" to the moment it appears on screen. Along the way we meet the transformer's core operations, the KV cache that makes streaming possible, and the two very different phases of inference — prefill and decode — each with its own performance character.

By the end, you'll know why "throughput" and "latency" are two different metrics, why servers batch requests aggressively, why `max_seq_len` and `batch_size` are the two knobs everyone argues about, and what "the decode phase is memory-bound" really means.

## The shift in perspective

Part 2 was hardware-first: *here is a GPU, here is how it works.* Part 3 is workload-first: *here is how a transformer runs, and here is how it bumps into hardware.* The two halves meet in a concept called the **roofline** — the ceiling of performance set by either compute or memory, whichever runs out first.

<div class="analogy" markdown>
Imagine watching a single order travel through the kitchen from ticket to plate. Part 3 is that walkthrough. Each station along the way is doing something specific, with its own rhythm and its own bottleneck.
</div>

## Chapters in this part

- [What is a token?](token.md) — what the thing actually is, how BPE builds the vocabulary, and why non-English text costs more.
- [The life of a token](life-of-a-token.md) — the high-level flow, from prompt to output.
- [Attention, explained slowly](attention.md) — what the most-discussed operation in ML actually computes, and why it's expensive.
- [The KV cache](kv-cache.md) — the clever trick that makes streaming generation fast, and the reason LLM servers eat memory.
- [Prefill vs. decode](prefill-vs-decode.md) — why the first token takes a while and then the rest come quickly, and why they stress the GPU in opposite ways.
- [Batching many diners at once](batching.md) — how serving systems amortize HBM trips across many users.
- [Memory-bound vs. compute-bound](roofline.md) — the one mental model that ties everything together.

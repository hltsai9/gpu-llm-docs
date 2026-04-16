# Part 1 — Why GPUs

Before we open the hood, we need to answer one question: **why are GPUs the right shape for LLMs at all?** Not *how* they are fast, but *why their kind of fast matters*.

This part sets up three ideas that every later chapter leans on:

1. **CPUs and GPUs optimize for opposite things.** Latency versus throughput. Fewer brilliant workers versus many coordinated ones.
2. **LLM math is embarrassingly parallel.** Billions of independent multiplications — exactly the shape GPUs were designed to eat.
3. **Coordination beats cleverness.** GPUs don't beat CPUs by being smarter per core. They beat them by doing the same thing in lockstep, millions of times at once.

We explore these through two settings: a **restaurant kitchen** (for parallelism and latency) and a **factory floor** (for throughput and pipelining). Neither is perfect, and we will mix them when each makes a point clearer.

## Chapters in this part

- [The cafeteria vs. the steakhouse](cpu-vs-gpu.md) — why a CPU is a head chef and a GPU is a cafeteria.
- [Throughput over latency](throughput-vs-latency.md) — why "how fast does one order take?" is the wrong question for a GPU.
- [The synchronized kitchen (SIMT)](simt.md) — why all 32 line cooks have to chop the same vegetable at the same time.

Once these three clicks are in place, the architecture in Part 2 will read like a tour of a kitchen you already understand.

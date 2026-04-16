# Part 2 — GPU Architecture

Now we open the hood.

Part 1 gave us the why: GPUs are cafeterias, not steakhouses, and LLM math is exactly the kind of work cafeterias are built for. Part 2 answers the how: where the cooks stand, what the pantry looks like, and why the kitchen is laid out the way it is.

We will use two complementary analogies:

- **A factory floor with stations and warehouses.** This is the spatial analogy — it shows you where things physically live on the chip.
- **A kitchen brigade.** This is the organizational analogy — it shows you how work is assigned and coordinated.

Both are useful. We switch between them when one makes a point cleaner than the other.

## What you'll know by the end

By the end of Part 2, when you see a line like:

> *H100 SXM5: 132 SMs, 2048 threads/SM, 80 GB HBM3 @ 3.35 TB/s, 50 MB L2, tensor cores delivering 989 TFLOPs BF16.*

…you should be able to read it out loud and mean something by every word.

## Chapters in this part

- [Anatomy of a GPU](anatomy.md) — the chip as a factory floor. SMs, CUDA cores, the control tower.
- [The memory hierarchy](memory-hierarchy.md) — the single most important chapter in this guide. Registers, shared memory, L2, HBM — and why the distance to each matters more than the raw core count.
- [Warps, threads, and blocks](warps-threads-blocks.md) — how work gets organized and scheduled.
- [Tensor Cores: power tools](tensor-cores.md) — the purpose-built machinery that makes LLM matmuls so absurdly fast.

The memory hierarchy chapter in particular is worth reading slowly. Almost every performance conversation about LLM inference — quantization, KV cache offload, FlashAttention, paged attention — is ultimately a conversation about where the data lives and how far it has to travel.

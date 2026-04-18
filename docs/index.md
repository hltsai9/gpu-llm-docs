# GPUs and LLMs — A Story-Driven Guide

<div class="hero" markdown>

**Why does a chatbot need a warehouse-sized GPU cluster to hold a conversation?**

This guide answers that question from the ground up — not with datasheets, but with stories. You will meet chefs running parallel stations, factory floors with conveyor belts of numbers, and cities with highways and side streets for data. By the end, the numbers in a GPU spec sheet will mean something.

</div>

## Who this is for

This is a progressive guide. Early chapters assume you can program, but not much else. Later chapters go deeper into memory bandwidth, arithmetic intensity, and how modern LLM engines squeeze performance out of every cycle. Read linearly the first time; treat it as a reference the second.

!!! tip "For your role — pick a learning path"
    Not everyone needs the whole guide in order. If you already know what you're building toward, jump into a curated path:

    - **[Developer](learning-paths/developer.md)** — shipping features with LLM APIs.
    - **[ML Engineer](learning-paths/ml-engineer.md)** — fine-tuning, serving, squeezing performance.
    - **[Product Manager](learning-paths/product-manager.md)** — scoping, costing, de-risking AI features.
    - **[Creative](learning-paths/creative.md)** — writing, designing, and producing alongside AI tools.
    - **[Infrastructure & Platform](learning-paths/infrastructure.md)** — GPU clusters, capacity, reliability.

    Each path walks through the relevant chapters in order, with misconception checkpoints at each step. Start at the [Learning Paths hub](learning-paths/index.md) if you're not sure which fits.

## The big question

Modern LLMs are enormous piles of multiplications. A single forward pass through a 70B-parameter model touches roughly 140 GB of weights and performs tens of trillions of operations — for *each* token it produces. Do that many times per second, for thousands of concurrent users, and you have the workload GPUs were built to handle.

But "GPUs are fast" is not an explanation. A GPU is a very specific kind of fast. It is terrible at many things a CPU is good at, and wonderful at exactly the things a transformer needs. Understanding *why* requires picking up a few ideas:

<div class="numbers" markdown>
<div class="cell"><div class="n">~10,000</div><div class="l">CUDA cores on a modern data-center GPU</div></div>
<div class="cell"><div class="n">~3 TB/s</div><div class="l">HBM memory bandwidth on H100</div></div>
<div class="cell"><div class="n">~1,000×</div><div class="l">Throughput ratio GPU vs CPU for matmul</div></div>
<div class="cell"><div class="n">32</div><div class="l">Threads in a warp — the smallest unit of work</div></div>
</div>

Each of those numbers has a story behind it. This guide tells those stories.

## How to read this site

The guide is organized into eight parts. The first three build the foundation; the rest apply it to specific kinds of work.

**Part 1 — Why GPUs.** We start in a restaurant. A CPU is a brilliant head chef; a GPU is a cafeteria with a thousand line cooks. This part is short and conceptual. Read it even if you think you already know why GPUs are fast — the analogies here carry through the rest of the guide.

**Part 2 — GPU Architecture.** We tour the kitchen. Streaming Multiprocessors, warps, shared memory, HBM, tensor cores. You will see where the numbers above come from, and why the *memory hierarchy* matters more than the core count.

**Part 3 — LLM Inference.** We watch a token come to life. Attention, the KV cache, prefill versus decode, batching. This is where GPU hardware meets transformer software. You will understand why inference is *memory-bound*, and why that one sentence shapes nearly every serving-system design choice.

**Part 4 — Training & Fine-Tuning.** When you need to change a model, not just use one. The spectrum from prompt engineering through LoRA to full fine-tuning, plus quantization and distributed training.

**Part 5 — Serving & Deployment.** Turning a model into a production service. Inference servers, continuous batching, paged KV cache, cluster operations.

**Part 6 — Building with LLMs.** A developer's toolkit: API basics, prompt engineering, retrieval-augmented generation, tools/agents, and evals that let you ship with confidence.

**Part 7 — Strategy & Product.** Which features should use AI, what they cost, and how to handle the new risk surfaces — hallucination, prompt injection, regulation.

**Part 8 — Creative Workflows.** For writers, designers, and producers: how diffusion models actually work, how to preserve voice when the tool pulls toward an average, and practical workflow patterns.

!!! tip "The promise"
    By the end, when someone says "we're bandwidth-bound on decode, need to upgrade to H200 for the bigger HBM," you will know exactly what they mean — and roughly what it will buy them. And you will have a clear path from that hardware knowledge into whatever kind of AI work you actually do.

## A note on analogies

Analogies are scaffolding. They get you up the wall; eventually you step off. Every analogy in this guide breaks somewhere, and where it breaks is usually interesting. When an analogy stops being helpful, we will tell you, and switch to a more precise one. The goal is intuition that survives contact with real code.

<div class="analogy" markdown>
A GPU is not a faster CPU. It is a completely different kind of machine that happens to share a socket and a programming language. Treating it as "CPU but more" is the single most common reason people's code runs slowly on it.
</div>

Ready? Start with [Part 1 — Why GPUs](01-why-gpu/index.md), or [pick a learning path for your role](learning-paths/index.md).

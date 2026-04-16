# GPUs and LLMs — A Story-Driven Guide

<div class="hero" markdown>

**Why does a chatbot need a warehouse-sized GPU cluster to hold a conversation?**

This guide answers that question from the ground up — not with datasheets, but with stories. You will meet chefs running parallel stations, factory floors with conveyor belts of numbers, and cities with highways and side streets for data. By the end, the numbers in a GPU spec sheet will mean something.

</div>

## Who this is for

This is a progressive guide. Early chapters assume you can program, but not much else. Later chapters go deeper into memory bandwidth, arithmetic intensity, and how modern LLM engines squeeze performance out of every cycle. Read linearly the first time; treat it as a reference the second.

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

The three parts are designed to build on each other:

**Part 1 — Why GPUs.** We start in a restaurant. A CPU is a brilliant head chef; a GPU is a cafeteria with a thousand line cooks. This part is short and conceptual. Read it even if you think you already know why GPUs are fast — the analogies here carry through the rest of the guide.

**Part 2 — GPU Architecture.** We tour the kitchen. Streaming Multiprocessors, warps, shared memory, HBM, tensor cores. You will see where the numbers above come from, and why the *memory hierarchy* matters more than the core count.

**Part 3 — LLM Inference.** We watch a token come to life. Attention, the KV cache, prefill versus decode, batching. This is where GPU hardware meets transformer software. You will understand why inference is *memory-bound*, and why that one sentence shapes nearly every serving-system design choice.

!!! tip "The promise"
    By the end, when someone says "we're bandwidth-bound on decode, need to upgrade to H200 for the bigger HBM," you will know exactly what they mean — and roughly what it will buy them.

## A note on analogies

Analogies are scaffolding. They get you up the wall; eventually you step off. Every analogy in this guide breaks somewhere, and where it breaks is usually interesting. When an analogy stops being helpful, we will tell you, and switch to a more precise one. The goal is intuition that survives contact with real code.

<div class="analogy" markdown>
A GPU is not a faster CPU. It is a completely different kind of machine that happens to share a socket and a programming language. Treating it as "CPU but more" is the single most common reason people's code runs slowly on it.
</div>

Ready? Start with [Part 1 — Why GPUs](01-why-gpu/index.md).

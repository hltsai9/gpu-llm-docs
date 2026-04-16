# Throughput over latency

There are two ways to measure a kitchen.

**Latency** is how long your specific meal takes from the moment you order to the moment it arrives. You care about this when you're hungry.

**Throughput** is how many meals the kitchen ships per hour. You care about this if you run the restaurant.

A CPU is optimized for *your* meal. A GPU is optimized for *the restaurant's Friday night*.

## The highway analogy

Switch to a different setting for a moment. Imagine two ways to get 10,000 people from San Francisco to Los Angeles.

**The sports car strategy.** One Ferrari. It covers the 380 miles in three and a half hours. Then it turns around, drives back, picks up the next passenger, and repeats. The Ferrari is *fast per trip* — latency per passenger is about 7 hours door-to-door including turnaround. To move 10,000 people, it needs 10,000 trips. Total time: years.

**The freight train strategy.** One train. It takes eight hours to get to LA (slower per passenger!). But it carries 10,000 people at once. Total time: eight hours.

The Ferrari wins on **latency per passenger**. The train wins on **throughput of passengers**. For anything that needs to move a crowd, the train wins by staggering amounts, even though it is slower per trip.

A GPU is the train.

<div class="analogy" markdown>
A single operation on a GPU often takes *longer* than the same operation on a CPU. The GPU wins by doing a million of them while the CPU finishes its first one.
</div>

## Why transistors are budgeted this way

Chip designers have a fixed transistor budget. They can spend it on **making one thread faster** or on **running more threads in parallel**. They cannot do both — the silicon is finite, and the two goals pull in opposite directions.

A CPU spends its budget on:

- Branch predictors that guess which way an `if` will go.
- Out-of-order execution, so that if one instruction stalls, the core keeps working on later ones.
- Huge caches so the next byte is always a nanosecond away.
- Wide decoders that chew through complex x86 instructions.

All of that machinery exists to shave nanoseconds off *one thread*. None of it directly helps you run more threads in parallel.

A GPU spends its budget on:

- More arithmetic units (multiply-adders).
- More threads in flight simultaneously (a single H100 SM can juggle up to 2,048 threads at once).
- Wide memory paths to feed all those units.

The GPU barely tries to make any single thread fast. Instead, it ensures that *somewhere on the chip*, arithmetic is always happening. If thread 47 stalls waiting for memory, threads 48 through 127 keep going. You don't notice the stall because someone is always working.

This is called **latency hiding**, and it is the single most important trick in GPU performance.

## Latency hiding, in one picture

Imagine a line cook waiting for a pot of water to boil. On a CPU, the chef stands there, looking at the pot. On a GPU, while one cook waits for water, 2,000 other cooks are already chopping, stirring, plating — so from the head chef's view, the kitchen never slows down.

!!! info "In GPU terms"
    When a warp issues a memory load from HBM, it may have to wait hundreds of cycles for the data to arrive. Rather than sit idle, the SM immediately switches to another warp that is ready to compute. By the time the original warp's data shows up, it gets swapped back in. The chip's arithmetic units stay busy almost 100% of the time — but the *per-thread* latency can be enormous.

This is why throughput is the only number that matters on a GPU. Any one thread is slow. All of them together are ferocious.

## What this means for LLMs

Two practical consequences, worth tattooing somewhere visible:

**1. Small batches waste GPUs.** If you send a GPU one request at a time, you're sending a Ferrari to carry one passenger. The train is half empty. LLM serving systems work extremely hard to *batch* many requests together, so the GPU runs its one big matmul on behalf of 64 or 128 or 256 conversations at once. We'll see how this works in [Batching many diners at once](../03-llm-inference/batching.md).

**2. Latency per token is not the same as throughput of tokens.** A system producing 100 tokens per second for one user is very different from one producing 10,000 tokens per second across 100 users. The first optimizes latency; the second, throughput. LLM infrastructure teams have to pick a target and design for it — you cannot max both.

<div class="analogy" markdown>
A coffee shop can be *fast per customer* (barista focused on one order) or *high-volume* (assembly line with specialists). It cannot be both at peak. LLM serving has the same tradeoff, multiplied by the cost of a GPU.
</div>

## The mental move

When you catch yourself thinking *"how fast is this single operation?"*, stop. Ask instead: *"how many of these can I run in parallel, and am I keeping the chip full?"* That shift — from latency to throughput — is the first real GPU thought.

Next: [The synchronized kitchen (SIMT) →](simt.md)

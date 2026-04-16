# The synchronized kitchen (SIMT)

So far the cafeteria has one head chef shouting instructions to a thousand line cooks. That's close to the truth, but not quite. The real picture is more specific — and the specifics are where performance is won or lost.

Here is the actual rule on a GPU:

<div class="analogy" markdown>
Line cooks work in **brigades of 32**. Every cook in a brigade must execute the **same instruction at the same time**, on **different ingredients**. If one cook needs to do something different, the other 31 stand there holding their knives, waiting.
</div>

That brigade of 32 is called a **warp**. The programming model is called **SIMT** — Single Instruction, Multiple Threads. It is the most important GPU concept to internalize.

## Why 32, and why in lockstep?

Remember: GPUs sacrificed per-thread intelligence for parallel throughput. One of the biggest cost savings is the **instruction decoder**. A CPU has a fancy decoder per core, chewing through complex instructions, predicting branches, reordering on the fly. That's expensive silicon.

A GPU pools the decoder across 32 threads. One instruction is fetched and decoded once, then applied to 32 data items in parallel. That's 32× less decoder hardware for the same amount of work — which is how you fit 10,000 cores on one chip.

The tradeoff is the lockstep rule. All 32 threads in a warp share one instruction pointer. They can operate on different data, but they all execute the same op.

!!! info "SIMT vs SIMD"
    CPUs have a similar idea called SIMD — one instruction, multiple data, via vector registers like AVX-512. The difference: SIMD is an *instruction-level* feature (one core, vector-wide ops). SIMT is a *thread-level* feature (many threads pretending to be independent, but quietly forced into lockstep by the hardware). SIMT is easier to write against, because you pretend each thread is independent, until you hit divergence.

## The divergence problem

What happens when your code has an `if` statement?

```python
# On the GPU, each of 32 threads runs this:
if value > 0:
    result = sqrt(value)
else:
    result = -1.0
```

Since all 32 threads must execute the same instruction at the same time, the hardware has no choice. It runs the `if` branch for the threads where the condition is true — and the other threads **stand idle**, masked off. Then it runs the `else` branch for the remaining threads, while the first group stands idle. Both branches execute sequentially, and only some threads are doing useful work at any moment.

This is called **warp divergence**. In the worst case, if every thread takes a different path, you lose up to 32× throughput.

<div class="analogy" markdown>
Imagine the head chef yelling *"if your vegetable is a carrot, peel it; otherwise chop it."* The cooks with carrots peel while the chop-cooks stand there holding their knives. Then the chop-cooks chop while the carrot-cooks watch. Twice the time, same total work.
</div>

For LLMs, this is mostly not a problem — matrix multiplications have no branches. Every thread is doing the same `multiply-add` on different numbers. Transformers are almost perfectly uniform work, which is exactly why GPUs serve them so well.

## Why LLM math fits the SIMT model perfectly

A single matrix multiply-add is:

```
accumulator += A[i,k] * B[k,j]
```

That instruction is the same for every (i, j) in the output matrix. You can hand one (i, j) to each thread, and all of them will execute the exact same op on different A and B entries. No branches. No divergence. Every cook in every warp doing the same thing — just on their assigned slice of the matrix.

This is why matrix multiplication on a GPU is routinely 100×–1000× faster than on a CPU. It is the *shape* of computation the hardware was built for. Transformer attention, feedforward layers, layer norms — almost everything in a modern LLM boils down to matmuls with a sprinkle of elementwise ops. All of it is warp-friendly.

<div class="analogy" markdown>
Telling a cafeteria *"everyone, dice your onion"* is the easiest instruction in the world. That's what a transformer is, all the way down.
</div>

## Where programmers have to be careful

Even though transformers are warp-friendly, real GPU kernels still have to deal with divergence when:

- **Masked attention.** In causal self-attention, some positions should not attend to future tokens. The mask introduces an `if` that can diverge.
- **Sparse ops.** Sparse matrix code (MoE routing, for instance) has different threads going to different experts.
- **Boundary conditions.** When the matrix dimensions aren't a multiple of 32, the last warp has a few threads doing real work and a few with nothing to do.

Well-written GPU kernels structure their work so all 32 threads in a warp take the same path. Poorly written ones don't, and pay for it in idle cores. The compiler can help (predication, warp-level primitives), but the *shape* of the problem matters more than compiler cleverness.

## The mental move

You now have the picture you need to understand how LLMs run on GPUs:

- Thousands of tiny cores.
- Grouped into brigades of 32 called warps.
- Each warp executes one instruction at a time, in perfect lockstep.
- The whole chip keeps itself busy by juggling many warps, swapping in new ones whenever a warp stalls on memory.
- LLM math is naturally branchless, uniform, massive — the exact workload this machine is shaped for.

In Part 2 we open the hood and see where these warps actually live, what the memory pantry looks like, and why the *memory hierarchy* ends up mattering more than the core count.

Next: [Part 2 — GPU Architecture →](../02-gpu-architecture/index.md)

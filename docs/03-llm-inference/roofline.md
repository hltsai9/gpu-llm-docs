# Memory-bound vs. compute-bound

We close with the one mental model that ties everything together: the **roofline**.

The roofline is a diagram invented by performance engineers to answer a simple question: *for a given operation, what's the fastest it can possibly run on this hardware?* Once you internalize the roofline, nearly every optimization story in LLM inference falls into place.

## The two ceilings

Any operation on a GPU is limited by one of two things:

1. **Compute throughput.** How fast the tensor cores (or CUDA cores) can do arithmetic. Measured in FLOPs/sec.
2. **Memory bandwidth.** How fast data can get from HBM to the chip. Measured in bytes/sec.

An operation's actual speed is governed by whichever runs out first. You can't go faster than your tensor cores, and you can't go faster than your memory pipe.

<div class="analogy" markdown>
A factory's throughput is limited by whichever is slower: how fast the machines can work, or how fast raw materials arrive from the loading dock. Hiring faster machines won't help if the forklifts are already maxed. Buying faster forklifts won't help if the machines are already saturated.
</div>

## Arithmetic intensity: the x-axis

The quantity that determines *which* ceiling you hit is **arithmetic intensity**:

$$
I = \frac{\text{FLOPs}}{\text{bytes moved from HBM}}
$$

It's the number of arithmetic operations you do per byte of data you load. High intensity = use each loaded byte many times. Low intensity = load a byte, do one multiply, move on.

For an H100 (roughly):

- Peak compute (BF16 tensor cores): ~989 TFLOPs
- Peak HBM bandwidth: ~3.35 TB/s
- **Crossover point: ~295 ops/byte**

If your operation has arithmetic intensity below 295, you are **memory-bound**: the HBM bandwidth is the ceiling, and you could in principle sustain all available compute if only the data arrived fast enough. If it's above 295, you are **compute-bound**: the tensor cores are the ceiling, and you could in principle use all available bandwidth but don't need to.

## The roofline graph

Plot arithmetic intensity on the x-axis (log scale), achievable FLOPs on the y-axis (log scale). Two lines:

- A diagonal line for memory bandwidth: `y = bandwidth × x`. Doubling intensity doubles what you can achieve, up to…
- A horizontal line for compute: `y = peak FLOPs`. After that, no amount of more intensity helps.

They meet at the crossover point. Operations to the left of the meeting point live on the diagonal (memory-bound). Operations to the right live on the horizontal (compute-bound).

```
  Achievable FLOPs
        │
   peak ├───────────────────  ← compute ceiling
        │                    ╱
        │                   ╱
        │                  ╱
        │                 ╱     ← memory bandwidth line
        │                ╱      (slope = HBM bandwidth)
        │               ╱
        │              ╱
        └─────────────┴────────── Arithmetic intensity
                      ↑
                  crossover (~295 ops/byte on H100)
```

Operators live as points on this graph:

| Operation | Intensity | Where it lives |
|---|---|---|
| Elementwise add/multiply | ~1 op/byte | Far memory-bound |
| Layer norm | ~3 ops/byte | Memory-bound |
| Matmul, batch=1 decode | ~1–2 ops/byte | Memory-bound |
| Matmul, batch=64 decode | ~30–50 ops/byte | Memory-bound, getting closer |
| Matmul, prefill (seq=2048) | ~500+ ops/byte | Compute-bound |
| Large training matmul | ~1000+ ops/byte | Compute-bound |
| Attention (naive) | ~variable | Memory-bound without FlashAttention |
| Attention (FlashAttention) | Much higher | Compute-bound |

## Why decode is so painful

Walk through a batch-1 decode step on a 70B model:

- Weights moved: ~140 GB per step.
- Arithmetic: ~140 GFLOPs per token (~one op per parameter).
- Intensity: ~1 op/byte.

We're at 1 op/byte on a chip that needs 295 ops/byte to saturate. That means decode can, at best, use ~1/295 of the tensor cores. The rest of the chip is sitting idle, waiting for the HBM forklift.

The serving system is effectively paying for a 989-TFLOP accelerator to run at ~3 TFLOPs of effective throughput. **This is the fundamental reason LLM inference is expensive.**

## What moves you along the roofline

Every optimization you've seen in this guide can be read as a motion on the roofline graph:

**Batching** — moves you right (higher intensity) by amortizing HBM reads across more work. Turns decode from "far left of memory-bound" to "closer to compute-bound." Diminishing returns as the KV cache starts to dominate traffic.

**Quantization** — moves you right on the x-axis by *shrinking the bytes*. If weights are FP8 instead of FP16, the same number of ops now requires half the HBM traffic, so intensity doubles. Also moves the entire bandwidth line upward a bit (more bytes per second effectively).

**FlashAttention** — moves attention right on the x-axis by avoiding HBM writes of the intermediate score matrix. Changes a memory-bound op into a compute-bound one without changing the math.

**Operator fusion** — merges multiple elementwise ops into one kernel so intermediate values stay in registers instead of round-tripping through HBM. Increases intensity for fused operations.

**KV cache tricks (GQA, paging, quantization)** — reduce the bytes read per decode step, so intensity goes up.

**Hardware upgrades** — H200 vs H100 has ~1.4× the HBM bandwidth. If you're memory-bound, that's ~1.4× more tokens/sec. Blackwell adds more FLOPs; helpful for compute-bound operations (prefill, training).

<div class="analogy" markdown>
Every trick in LLM inference is one of two motions: either "make the forklifts faster" (hardware, memory bandwidth) or "make each forklift trip deliver more useful work" (batching, quantization, fusion, clever caching). Nobody wastes time hiring more cooks — they're already standing around.
</div>

## How to reason about new techniques

When you see a new paper or blog post about LLM efficiency, run it through this checklist:

1. **What is the operation's arithmetic intensity?** (FLOPs per byte.)
2. **Is it currently memory-bound or compute-bound?** (Is intensity below or above the crossover?)
3. **What does the technique change — FLOPs, bytes, or both?** Usually it reduces bytes.
4. **Does that push the operation to a higher-utilization regime?**

If the technique reduces bytes for a memory-bound op, it'll produce a roughly proportional speedup. If it reduces bytes for an already-compute-bound op, it'll do less. If it reduces FLOPs for a memory-bound op, it might even slow things down (you didn't help the bottleneck and added complexity).

This lens filters a lot of hype.

## Why the rooflines are drifting

One final observation. The crossover point has been moving *right* over time:

- Pascal (2016): ~15 ops/byte to saturate.
- Volta (2017): ~70 ops/byte.
- Ampere (2020): ~140 ops/byte.
- Hopper (2022): ~295 ops/byte.
- Blackwell (2024): even higher, especially at FP8/FP4.

Compute throughput grew faster than memory bandwidth across generations. Each new GPU is more top-heavy. That means the *same* workload that was compute-bound on Pascal might be memory-bound on Hopper. It's the same algorithm, but the shape of the hardware changed underneath.

This is why LLM serving has gotten more complicated over time, not less. The earliest inference engines just pushed matmuls through cuBLAS and called it a day. Modern ones do surgery on the memory hierarchy — because that's where the newly-imbalanced hardware demands attention.

## The whole guide in three sentences

- GPUs are shaped like cafeterias: lots of cooks doing the same thing on different ingredients.
- LLMs are shaped like orders for a stadium crowd: mountains of identical, independent arithmetic.
- The interesting performance story isn't about the cooks — it's about the forklifts bringing them ingredients, and every optimization in the field is about getting more useful work out of each forklift trip.

You now have the mental model. The numbers in a datasheet, the headlines in a serving-system blog post, and the knobs in an inference config should all read as sensible consequences of the hardware-workload fit we've walked through. Welcome to the cafeteria.

---

Ready to explore further? Revisit any chapter from the sidebar, or start back at the [homepage](../index.md).

# The memory hierarchy

If you only read one chapter, read this one.

Almost every real conversation about LLM performance — quantization, FlashAttention, paged KV caches, model sharding, H100 vs H200, why inference latency is what it is — is a conversation about memory. Not about the cores. The cores are fine. The cores are *over*qualified. The game is moving data to them in time.

## A city of storage

Switch analogies for this chapter. Think of each thread as a cook who needs ingredients. The ingredients live at different distances:

| Storage | Where it is | How big | How fast | Who can see it |
|---|---|---|---|---|
| **Registers** | In the cook's hand | ~256 KB per SM (split per thread) | 1 cycle | One thread |
| **Shared memory / L1** | On the workshop shelf | ~256 KB per SM | ~30 cycles | All threads in a block |
| **L2 cache** | In the central dispatch warehouse | ~50 MB chip-wide | ~200 cycles | All SMs |
| **HBM (main memory)** | At the loading dock across the parking lot | 80 GB | ~500–800 cycles | Whole GPU |
| **CPU RAM over PCIe** | Another city | Hundreds of GB | ~tens of thousands of cycles | Host + GPU (via copy) |
| **NVMe / disk** | Another country | TB+ | Millions of cycles | Host only |

<div class="analogy" markdown>
Registers are what's in your hand. Shared memory is the shelf behind you. L2 is the warehouse on the other side of the building. HBM is the loading dock in the next parking lot. CPU RAM is the supplier across town. Disk is overseas.
</div>

The speeds differ by orders of magnitude — the ratio from register to disk is roughly **a billion to one**. That single fact drives nearly every design decision in GPU software.

## Bandwidth vs. latency, again

Two numbers matter for each level:

- **Latency** — how long it takes to get *one byte* from there.
- **Bandwidth** — how many bytes per second you can move if you ask for many at once.

HBM is a great example. Its latency is *terrible* — hundreds of cycles. But its bandwidth is monstrous — 3 TB/s on H100. This is why GPUs love to move data in big contiguous chunks: you pay the latency cost once and then ride the bandwidth for the whole transfer.

<div class="analogy" markdown>
The freight train to the loading dock takes a long time to get started. But once it's moving, it carries an enormous payload. Asking for one crate at a time is wasteful. Asking for a full train is how the system was designed to be used.
</div>

In GPU terms, this manifests as **coalesced memory access**: the 32 threads in a warp should load 32 *adjacent* bytes, so the hardware can satisfy all of them with a single wide HBM transaction. If the threads jump around to random addresses, you pay the full latency per thread, and throughput collapses.

## Reuse: the holy grail

Here is the central insight for LLM inference:

<div class="analogy" markdown>
Every byte you can use twice before it goes back to the loading dock is a byte you didn't have to fetch twice.
</div>

Suppose you have a weight matrix $W$ of 4096×4096 floats (64 MB in FP16). You want to multiply it by a vector $x$ of length 4096. The matmul touches:

- 64 MB of $W$ (read once)
- 8 KB of $x$ (read once)
- 8 KB of result $y$ (written once)

Total memory traffic: ~64 MB. Total arithmetic: ~33 million multiply-adds.

Now multiply by a *batch* of 64 vectors at once — a 4096×64 matrix $X$ instead of a single vector. The matmul touches:

- 64 MB of $W$ (still read once — we reuse it across the batch!)
- 512 KB of $X$
- 512 KB of $Y$
- Arithmetic: ~2.1 billion multiply-adds — **64× more work**

For only a little more memory traffic (~1 MB extra), we did 64× more computation. **Arithmetic per byte moved** went way up. This ratio — **arithmetic intensity** — is the magic number.

This is the entire reason batching matters for LLMs. When you batch many requests through the same weight matrix, you pay the HBM cost *once* and amortize it across all the requests. We'll see this again in [batching](../03-llm-inference/batching.md) and [roofline](../03-llm-inference/roofline.md).

## The memory wall

Here's the uncomfortable truth about modern GPUs:

<div class="numbers" markdown>
<div class="cell"><div class="n">989 TFLOPs</div><div class="l">BF16 compute on H100</div></div>
<div class="cell"><div class="n">3.35 TB/s</div><div class="l">HBM bandwidth</div></div>
<div class="cell"><div class="n">~295</div><div class="l">Ops per byte to break even</div></div>
</div>

To "break even" on an H100 — to keep the tensor cores fully fed from HBM alone — every byte loaded needs to participate in about 295 arithmetic operations before being discarded. If you load a byte and do only 10 ops with it, the tensor cores will finish in a fraction of the time HBM needed to deliver that byte, and they'll stand idle for the rest.

That's the **memory wall**. The cores got dramatically faster over the last decade; HBM bandwidth grew too, but not as fast. The gap keeps widening. The art of GPU programming is increasingly the art of *not* going to HBM.

## How each level gets used in an LLM

Walk through a single transformer layer and watch the data flow.

**Weights** live in HBM. They are too big to fit anywhere else — a single 70B-parameter model in FP16 is 140 GB, split across multiple GPUs or quantized. When you compute a matmul, tiles of the weight matrix are streamed from HBM into on-chip memory.

**Tiles of weights and activations** are staged in **shared memory** inside each SM. Multiple warps reuse these tiles, doing many multiply-adds before the tile is evicted. This is where the arithmetic intensity actually manifests — one HBM load, many ops.

**The innermost accumulators** of the matmul live in **registers**. Tensor cores read operands from registers, produce results into registers.

**L2 cache** helps when multiple SMs happen to touch overlapping data — for instance, when the same weight matrix is used by different output tiles. A good tile pattern arranges for this kind of reuse.

**KV cache** for inference also lives in HBM. During decoding, each new token has to fetch the entire KV cache to do attention — and this fetch is the reason decode is memory-bound. [See the KV cache chapter](../03-llm-inference/kv-cache.md).

## Why "quantization" is really "shrink the loading dock trip"

Modern LLM serving talks constantly about quantization: running models at INT8, FP8, INT4 instead of FP16/BF16. The obvious benefit is the model taking less memory. The *larger* benefit is that every HBM read moves half or a quarter as many bytes. Since decode is bandwidth-bound, cutting HBM traffic in half roughly doubles tokens-per-second.

<div class="analogy" markdown>
Quantization doesn't make the cooks faster. It makes every ingredient a smaller box, so the forklift can bring twice as many per trip.
</div>

## What to take away

- The memory hierarchy spans about **nine orders of magnitude** in capacity and speed.
- GPUs win by keeping the cores fed from **on-chip memory** — registers and shared memory — as much as possible.
- The only way to sustain peak compute is **high arithmetic intensity**: many ops per byte moved.
- Batching, quantization, FlashAttention, paged KV caches, operator fusion — all of them are different ways of saying *"move less data, reuse what you moved."*

Once you have this picture, most of the clever algorithmic work in modern LLM serving becomes legible. It is not about squeezing more out of the cores. It is about squeezing more work out of every byte that crosses the memory hierarchy.

Next: [Warps, threads, and blocks →](warps-threads-blocks.md)

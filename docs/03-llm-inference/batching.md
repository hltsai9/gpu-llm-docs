# Batching many diners at once

We have all the pieces now. Weights live in HBM. Decode is memory-bound. Tensor cores sit mostly idle, waiting for forklifts. The question is: can we make the forklifts carry more useful cargo per trip?

Yes. The answer is **batching**.

## The core idea

When the model processes one token for one user, it pulls the entire set of weights from HBM, does a tiny bit of arithmetic against a 4,096-dim vector, and throws the weights away.

If the model processes one token for **64 users** at the same time, it still pulls the entire set of weights from HBM — *once* — and now does 64× the arithmetic on a 4,096×64 matrix. Same HBM traffic for the weights. 64× the tensor-core work.

<div class="analogy" markdown>
Pushing one empty cart from the loading dock wastes the trip. Pushing one cart stacked with 64 different customers' ingredients is the same trip but 64× more productive. Batching is exactly this: share the expensive walk across many customers.
</div>

This is why batching is the single most important optimization in LLM serving. It converts a memory-bound workload into a compute-bound one, and the tensor cores finally get to work.

## The arithmetic intensity shift, in numbers

Back-of-envelope for a 70B-parameter model, FP16, single decode step:

**Batch size 1:**

- HBM traffic: ~140 GB of weights (read) + ~10 GB of KV cache (per sequence) = ~150 GB per step.
- Compute: ~140B multiply-adds (one per parameter, roughly).
- Arithmetic intensity: ~1 op per byte.
- Verdict: **completely memory-bound.** H100's peak is ~295 ops/byte. You are at < 1% of tensor-core utilization.

**Batch size 64:**

- HBM traffic: ~140 GB of weights (still read once — they're shared!) + ~640 GB of KV cache (64 sequences) = ~780 GB.
- Compute: ~140B × 64 = ~9T multiply-adds.
- Arithmetic intensity: ~11 ops per byte.
- Verdict: still memory-bound, but 11× better. Tensor-core utilization goes up proportionally.

**Batch size 256:**

- HBM traffic: ~140 GB weights + ~2.5 TB KV cache = ~2.6 TB.
- Compute: ~36T multiply-adds.
- Arithmetic intensity: ~14 ops/byte (the KV cache now dominates the traffic).
- Verdict: getting closer to compute-bound, but the KV cache eventually takes over HBM traffic.

Notice how the **weights** read cost is amortized beautifully with batching — the 70B weights are read *once* per step regardless of batch size. But the **KV cache** traffic grows linearly with batch size. Eventually the KV cache, not the weights, becomes the limiting memory cost.

<div class="numbers" markdown>
<div class="cell"><div class="n">1×</div><div class="l">Weight reads per step, no matter the batch</div></div>
<div class="cell"><div class="n">N×</div><div class="l">KV cache reads per step, for batch of N</div></div>
<div class="cell"><div class="n">N×</div><div class="l">Tokens generated per step</div></div>
</div>

This is why modern serving systems target very large decode batches — 64, 128, 256 concurrent sequences — and why they spend enormous engineering effort shrinking the KV cache, which is what keeps the batch size from scaling further.

## Static batching: the old way

The earliest approach was **static batching**: collect 32 requests, run them together until all 32 finish, then start a new batch. It worked, but it has an obvious problem: requests in the batch have different lengths. Short ones finish early and wait idle for the longest one. Average GPU utilization suffers.

Worse, you can't add a new request mid-batch; late arrivals queue for the next batch.

<div class="analogy" markdown>
Static batching is a tour bus. You fill it, drive to the destination, and everyone gets off at the same stop — even the people whose stop was earlier. The bus drives half-empty for the last leg.
</div>

## Continuous batching: the modern way

**Continuous batching** (also called *iteration-level* or *in-flight* batching) is the dominant approach today. Instead of batching at the request level, it batches at the **token** level:

1. At each decode step, the server looks at all active sequences and runs one step for all of them in a single batched forward pass.
2. If a sequence finishes (hits max length or emits end-of-sequence), it leaves the batch. The next step runs with one fewer sequence.
3. If a new request arrives, it does its prefill (maybe in its own separate call, maybe interleaved via chunked prefill) and then joins the decode batch.

The result: the batch is always full of *currently-generating* sequences. Finished requests leave immediately, new requests join immediately, GPU utilization stays high.

<div class="analogy" markdown>
Continuous batching is a rideshare van, not a tour bus. Passengers get on and off along the route. As soon as a seat opens up, someone waiting nearby hops in. The van is always nearly full.
</div>

This is what libraries like vLLM, TensorRT-LLM, TGI, and SGLang implement. The idea is conceptually simple; the engineering is not — it requires tight integration between scheduler, attention kernel (to handle variable sequence lengths), and memory manager (paged KV cache).

## The batch-size tradeoff

Bigger batches = higher throughput. So why not batch everyone forever?

Three reasons to cap it:

**Memory.** Each sequence needs its own KV cache. Batch size is bounded by HBM divided by per-sequence KV cache size. With a 32K context and GQA, maybe 20–40 concurrent sequences per H100 for a 70B model — much smaller for non-GQA or longer contexts.

**Latency.** Larger batches mean each decode step takes longer (more arithmetic, more KV cache to read), so inter-token latency per user increases. A batch of 256 might have 2× slower per-token latency than a batch of 32, even though throughput is higher.

**Fairness.** A user whose request is queued behind a very long one waits longer. Continuous batching helps, but extremely long sequences still dominate step time.

Serving systems expose `max_batch_size` and `max_tokens_per_batch` as tunable knobs. Operators pick based on their product's TTFT and ITL targets.

## Prefill batching

For prefill, the picture is different. A prefill request of 2,000 tokens already saturates the tensor cores (it's compute-bound). Adding more prefill requests doesn't make things faster — they'd just queue up.

Prefill batching is still useful when you have many **short** prompts, which wouldn't each saturate the GPU on their own. But there's a ceiling: once a single prefill is big enough to use the chip, there's no further gain from batching more prefills.

## Chunked prefill + continuous decode batching

The fanciest serving systems combine both:

- Ongoing decode batch runs every step.
- Incoming prefill is chunked into 256- or 512-token chunks.
- Each chunk is interleaved into the decode batch so neither starves the other.

This keeps the GPU saturated regardless of the mix of short/long prompts and ongoing generations — the modern gold standard for LLM inference serving.

## What to take away

- Batching shares the HBM weight-read cost across many users.
- It converts decode from memory-bound toward compute-bound.
- **Continuous batching** (token-level, not request-level) is how modern servers do it.
- The ceiling on batch size is set by **KV cache memory**, then by latency constraints.
- Every serving-system decision — paged KV cache, chunked prefill, GQA, FP8 KV — is aimed at letting that ceiling go higher.

Next: [Memory-bound vs. compute-bound →](roofline.md)

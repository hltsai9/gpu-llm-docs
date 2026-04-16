# The KV cache

Of all the clever tricks in LLM inference, the KV cache is the most essential. It's the reason streaming generation is feasible at all — and the reason LLM servers eat so much GPU memory.

## The problem

From the last chapter: generating token $t$ requires attention, which needs the keys ($K$) and values ($V$) of every *previous* token in the sequence. When we generate token $t+1$, we need the K/V of tokens $1..t$. For token $t+2$, tokens $1..t+1$. And so on.

Here's the naive approach: every time we generate a new token, re-run the entire prompt through the model, producing K and V for every token from scratch. This works, but the cost per new token grows linearly with sequence length. By the 2,000th token, each additional token costs 2,000× more than the first.

That is obviously terrible. But look closely: **the K and V vectors for previous tokens don't change** from step to step. Token 3's key vector in layer 17 is the same when we generate token 100 as it was when we generated token 4. We're computing them fresh every time for no reason.

<div class="analogy" markdown>
Imagine a chef who re-reads every ticket from the start of the night each time a new order comes in. Every 10 minutes, they re-read 200 tickets to figure out "okay, what was the chef's note on table 6?" It would be faster to keep a running notebook and add one line per order.
</div>

## The fix: cache them

The **KV cache** is exactly that notebook. As we generate each token:

1. Compute the new token's Q, K, V (a quick forward pass for just one token).
2. **Append** the new K and V to a running cache stored in HBM — one slot per layer, per head.
3. For attention, use the new Q against the full cached history of K and V.
4. Output the new token.

With the cache in place, each new generation step is almost constant work regardless of how long the sequence is. We never recompute old K and V. We only compute them once, when their token first appeared.

## The shape of the cache

For each layer in the model, for each attention head, we store a K vector and a V vector per token. The cache has shape:

$$
\text{cache size} = 2 \times L \times n_{\text{layers}} \times n_{\text{heads}} \times d_{\text{head}} \times \text{bytes per element}
$$

The factor of 2 is for K and V. Let's plug in numbers for a 70B model (Llama-2-70B as a reference): 80 layers, 64 attention heads, 128 dim per head, FP16 (2 bytes).

- Per token: $2 \times 80 \times 64 \times 128 \times 2 = 2{,}621{,}440$ bytes ≈ **2.5 MB per token**.
- 4K context: ~10 GB per sequence.
- 32K context: ~82 GB per sequence.

<div class="numbers" markdown>
<div class="cell"><div class="n">2.5 MB</div><div class="l">KV cache per token (Llama-70B, FP16)</div></div>
<div class="cell"><div class="n">10 GB</div><div class="l">per sequence at 4K context</div></div>
<div class="cell"><div class="n">82 GB</div><div class="l">per sequence at 32K context</div></div>
<div class="cell"><div class="n">80 GB</div><div class="l">total HBM on an H100</div></div>
</div>

Look at that last comparison. **One 32K-context conversation can consume an entire H100's memory, just for its KV cache.** Real serving systems juggle many concurrent conversations on a single GPU, so they have to squeeze every byte.

## The fight to shrink the cache

The KV cache has become the central memory-management problem of LLM serving. Every trick you'll hear about is ultimately about making it smaller or fitting more of them:

**Grouped-Query Attention (GQA).** Instead of each head having its own K and V, groups of heads share K/V. Llama-2 7B has 32 Q-heads and 32 KV-heads. Llama-2 70B has 64 Q-heads and 8 KV-heads — an 8× KV cache reduction at a tiny quality cost. Modern open models almost all use GQA.

**Multi-Query Attention (MQA).** The extreme: all heads share one K and one V. Maximum memory savings, slight quality drop.

**Paged KV cache** (vLLM's innovation). Rather than allocate a contiguous slab per sequence (which wastes memory if the sequence is shorter than max), chop the cache into fixed-size pages (like OS virtual memory) and allocate pages on demand. This reduces fragmentation dramatically and enables clever sharing.

**Prefix sharing.** If two sequences share a prefix (e.g., the same system prompt), their KV caches for that prefix are identical. Paged cache allows multiple sequences to *point at the same pages* for shared prefixes — zero extra memory, zero extra compute.

**Quantized KV cache.** Store K and V in 8-bit, or even 4-bit, instead of 16-bit. Halve or quarter the memory, with tiny accuracy loss.

**KV cache offload.** Keep hot pages in HBM, swap cold ones to CPU RAM or NVMe. Slower, but can serve much longer contexts.

<div class="analogy" markdown>
The KV cache is the chef's notebook. Every trick above is either using a smaller notebook (GQA, quantization), sharing notebook pages between tables (prefix sharing), pulling extra notebooks from the back office when things get full (offload), or getting clever about how empty pages are reused (paging).
</div>

## Why the cache makes decode memory-bound

Here's the bridge to the next chapters. When you generate one token, you:

1. Do a tiny bit of compute for the new token's Q, K, V (~one forward pass for a single token — cheap).
2. Read the **entire** weight matrix for every layer from HBM (to do the matmuls).
3. Read the **entire** KV cache from HBM (to compute attention against all prior tokens).

For step 2 and step 3, the arithmetic done per byte loaded is tiny. You touch hundreds of GB of weights and KV cache, and do only a few hundred arithmetic ops per byte. The tensor cores sit mostly idle. You are moving data, not computing.

This is why decode is **memory-bound** (see the [roofline chapter](roofline.md)). And it's why the KV cache, which is read in full for every generated token, is such a central concern. Every byte you can avoid storing or reading is a byte that doesn't slow down generation.

## The big picture

- Without a KV cache, generation cost grows quadratically. Impractical.
- With a KV cache, each new token is roughly constant-work — but now you have a data structure that grows with sequence length.
- The cache dominates HBM usage on LLM servers.
- Attention variants (MQA, GQA) and serving tricks (paging, prefix sharing, quantization) all exist to make it fit.

Once you internalize "the KV cache is the notebook, and the notebook is expensive to carry around," a huge amount of modern LLM-serving literature becomes transparent.

Next: [Prefill vs. decode →](prefill-vs-decode.md)

# Continuous batching

If you only learn one technique from the serving side of the guide, learn this one. Continuous batching (also called *iteration-level batching* or *in-flight batching*) is the single change that roughly 10×'d modern LLM serving throughput. It's also the reason modern servers look so different from a simple `generate()` loop.

## The naive approach: static batching

The easy way to batch an LLM workload:

1. Collect $N$ requests.
2. Pad them all to the same length.
3. Run one big forward pass for all of them together.
4. Wait until the *slowest* one finishes (often the one with the longest output).
5. Return all responses at once.

<div class="analogy" markdown>
A chef waits at the pass until every plate on the round is ready. If three of the diners ordered a quick pasta and one ordered a beef Wellington, the pasta orders sit under the heat lamp for an hour.
</div>

Problems, in order of severity:

- **Head-of-line blocking.** A request that generates 1000 tokens holds up everyone in its batch until it's done.
- **Wasted compute.** Short responses still pay for the full padded length of the longest.
- **Idle GPU.** While the server waits for a batch to fill, the GPU is doing nothing.
- **No streaming.** You can't return tokens until the batch ends.

In production, static batching sets effective throughput at maybe 20–30% of the GPU's capability.

## The insight: decode happens one token at a time anyway

Remember from [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md): every single decode step only produces one new token per request. So at each step, each request contributes exactly one `(Q, new_token)` operation, and the work is fundamentally decomposable into units of *one request, one decode step*.

That means the batch at step $t$ doesn't have to be the same as the batch at step $t+1$.

**Continuous batching** adds and removes requests from the batch at every decode step:

- A request's final token arrives → it leaves the batch.
- A new request arrives → it joins the batch at the next step.
- No padding. No waiting for the slowest.

<div class="analogy" markdown>
A chef who serves small plates continuously. As soon as one plate is up, they start another. Diners arrive and leave at different times, and the chef is never idle waiting for the slowest order.
</div>

## What continuous batching requires

You can't just add requests whenever you want — you need:

1. **Paged KV cache.** A new request needs KV cache pages allocated *now*; old requests returning their pages means pages are reclaimed *now*. Fixed contiguous allocations make this impractical.
2. **Efficient single-step kernels.** Each decode step must be cheap, because there are many. CUDA graphs help here — the graph is replayed at every step rather than re-planned.
3. **A scheduler.** Something decides which pending requests join the batch at each step. vLLM and TGI ship with ones that handle priorities, fairness, and capacity limits.
4. **Request-level state tracking.** Each in-flight request has its own position in the KV cache, its own output token count, and its own stopping condition.

All four of these are non-trivial. This is why rolling your own serving layer is a deep well.

## Throughput improvements in practice

<div class="numbers" markdown>
<div class="cell"><div class="n">~5–10×</div><div class="l">Typical throughput gain vs. static batching</div></div>
<div class="cell"><div class="n">~15–25×</div><div class="l">Throughput gain vs. one-request-at-a-time</div></div>
<div class="cell"><div class="n">~20–50×</div><div class="l">Gain vs. naive transformers.generate() in Python</div></div>
</div>

These are not marketing numbers. Real vLLM benchmarks against hand-rolled PyTorch serving routinely show 10–20× improvements for common workloads. Much of the gap comes from continuous batching; the rest from paged KV cache and kernel optimizations.

## The new bottleneck: KV cache capacity

Continuous batching moves the bottleneck. When every request is sharing GPU time efficiently, what limits you is how many requests' KV caches can fit simultaneously.

Example: an H100 has 80GB of HBM. After loading a 13B model in FP16 (~26 GB), you have ~54 GB of KV cache space. Say each in-flight request averages 1 MB of KV cache per token, at 2048 context length: each request needs ~2 GB of cache. You can have ~27 concurrent requests before the GPU is full.

If request 28 arrives:

- **Wait strategy:** queue the request, serve it when space opens. Tail latency suffers.
- **Evict strategy:** kick out the longest-idle request and recompute its KV cache when it resumes. Compute cost, but latency preserved.
- **Preempt strategy:** stop some in-flight requests, serve the new one. Specific scheduler policy.

Each server has its own strategy; understanding yours is part of operating it.

## Prefill vs. decode in a continuous batch

Recall: **prefill** is compute-bound (processing the full input prompt once). **Decode** is memory-bound (generating one new token at a time).

A clean continuous batch has one "new" request doing prefill and many existing requests doing decode. Mixing them on the same GPU is actually good — prefill can use tensor cores that decode is leaving idle.

But they interact in two gotchas:

- **Prefill dominates first-token latency.** A long prompt takes a significant chunk of GPU time *before* its decode starts. Other decoding requests stall briefly while prefill runs.
- **"Chunked prefill"** is the modern solution: split a long prefill into chunks and interleave them with decode steps. Keeps decode moving while prefill progresses. Most serving frameworks support this now.

## Prefix sharing: the bonus layer

Continuous batching unlocks another optimization: **prefix sharing**.

If two requests start with the same system prompt, their KV cache for that prefix is identical. Paged attention lets them share those pages — one computation, both requests read from the same memory. For workloads where many users hit the same long system prompt (which is most chat applications), prefix sharing halves KV cache usage and skips the prefill step for the shared portion.

SGLang's RadixAttention takes this further with a trie of shared prefixes, benefiting workloads like agents that share multi-step prompts.

## Measuring: the metrics that matter

The metrics you care about on a serving GPU:

- **Tokens/sec (total and per-request).** The real throughput number.
- **Running batch size.** How many requests are in flight. Higher is better, up to capacity limits.
- **Queue depth.** Requests waiting to enter the batch. Rising = overloaded.
- **KV cache utilization (percentage of pages used).** If consistently >90%, you're capacity-limited.
- **Time to first token (TTFT) P50/P95.** How long before a user sees something.
- **Time per output token (TPOT) P50/P95.** How fast it streams after that.

Not `nvidia-smi` GPU utilization (see the infrastructure path for the reason).

## Common mistakes

- **Setting `max_num_seqs` too high.** Lets too many requests into the cache; causes preemptions, tail latency spikes.
- **Not enabling prefix caching.** Free throughput for any workload with shared prompts.
- **Not enabling chunked prefill.** Long-prompt requests stall decoding for all others.
- **Measuring throughput with identical requests.** The benchmark looks good; production traffic is varied, and behavior differs.
- **Autoscaling on request count.** Requests can have wildly different costs. Scale on tokens or KV cache usage.

## In one sentence

Continuous batching lets the GPU serve N requests at whatever rates they need rather than waiting for the slowest — it requires paged KV cache and careful scheduling to implement, but it is the biggest free lunch in modern LLM serving.

Next: [GPU cluster operations →](cluster-ops.md)

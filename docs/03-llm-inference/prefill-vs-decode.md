# Prefill vs. decode

If you remember one thing about LLM inference, make it this:

<div class="analogy" markdown>
**Prefill is a dinner rush. Decode is a slow drip.** They use the same kitchen in radically different ways.
</div>

Inference has two phases, and they have almost nothing in common from the GPU's perspective. Understanding this split is the key to understanding every performance and serving decision downstream.

## Phase 1: Prefill

When your prompt first arrives — say, 2,000 tokens — the model runs a forward pass over **all 2,000 tokens at once**. They're processed in parallel, because the transformer doesn't actually need them to be sequential: at training time it saw whole sequences, and at inference time the same trick works.

For attention in prefill, a 2,000-token prompt means the QK matrix is 2,000 × 2,000. Every pair scored, causal mask applied, softmax-then-V. Big matmuls, lots of arithmetic, plenty of parallel work for the tensor cores. They light up.

What happens to the weights during prefill:

- Each layer's weight matrices are read once from HBM.
- Those weights are multiplied against the full 2,000-token activation matrix.
- Lots of arithmetic per byte moved: **high arithmetic intensity**.

Result: **prefill is compute-bound.** The tensor cores are the bottleneck. HBM bandwidth is not — the weights are read once and used across thousands of tokens.

<div class="analogy" markdown>
Prefill is like the lunch crowd arriving all at once. The chefs have been prepping all morning; now 2,000 orders hit the kitchen simultaneously. Every station is busy. The loading dock isn't the bottleneck — the cooks' hands are. This is the GPU at its happiest.
</div>

## Phase 2: Decode

After prefill, the model has produced the first output token, and the KV cache holds entries for all 2,000 prompt tokens. Now it enters **decode**: generate one token, append to context, generate the next, append, repeat.

Each decode step is a forward pass for **exactly one token**. That single token's activations are a tiny vector (4,096 floats for Llama-70B). But to process that vector, the model still has to:

- Read **all** weight matrices for every layer from HBM. (That's ~140 GB for a 70B model in FP16.)
- Read **all** of the KV cache, to do attention against every past token.
- Do a modest amount of arithmetic (one token's worth per layer).

Arithmetic per byte loaded: **very low**. The weights travel from HBM to the tensor cores, get multiplied against one vector, and are discarded — for a pitiful amount of work per trip.

Result: **decode is memory-bound.** The tensor cores are mostly idle, waiting for HBM. HBM bandwidth is the ceiling on tokens-per-second. Upgrading to a GPU with faster HBM directly increases decode throughput; upgrading to one with more tensor-core FLOPs barely helps.

<div class="analogy" markdown>
Decode is like the late-night single-customer shift. The one remaining cook has to walk to the loading dock and wheel back a full pallet of ingredients for each order of toast. The kitchen's capability is enormous, but the forklift trip dominates. You'd get more toast per hour by making the pallets smaller — not by hiring more cooks.
</div>

## Two phases, two rooflines

Drop a pin on each phase on the [roofline graph](roofline.md):

- **Prefill** sits on the compute ceiling, using ~100% of tensor-core throughput.
- **Decode** sits on the memory-bandwidth ceiling, using ~100% of HBM bandwidth.

A GPU running pure prefill and a GPU running pure decode have completely different bottlenecks. Which means:

- **Hardware changes affect them differently.** H200's main upgrade over H100 is larger, faster HBM. Decode throughput jumps; prefill barely changes.
- **Quantization helps decode more.** Weights in FP8 → half the HBM traffic → ~2× decode tokens/sec. Prefill also benefits but less dramatically.
- **Batching helps decode *enormously*.** More on this next — but the short version: running decode for 64 users at once reuses the weight reads, turning a memory-bound workload back into a compute-bound one.

## Time-to-first-token vs. inter-token latency

These two phases map directly to the two user-facing latency metrics:

**TTFT (time to first token).** Dominated by prefill. Grows roughly linearly with prompt length. A 100-token prompt might have TTFT of 100ms; a 10,000-token prompt, several seconds.

**ITL (inter-token latency).** Dominated by decode. Roughly constant with context length *for a single user*, but scales with batch size and model size.

Server operators tune for different ratios of these depending on the product. A chat interface might target TTFT < 500ms so the first words appear fast; a batch summarization job cares only about total throughput.

## The disaggregation insight

Because prefill and decode have such different character, modern serving systems sometimes run them on **different GPUs**:

- A **prefill pool** of GPUs handles incoming prompts. Compute-bound, so throughput is measured in TFLOPs.
- A **decode pool** of GPUs handles ongoing token generation. Memory-bound, so throughput is measured in HBM-GB/s.

After prefill finishes, the KV cache is shipped from the prefill GPU to the decode GPU (over NVLink or RDMA) and generation continues there. This **disaggregated serving** (popularized by systems like vLLM's splitwise and Mooncake) can significantly improve overall GPU utilization — you stop making one kind of hardware do two incompatible jobs.

<div class="analogy" markdown>
A good restaurant separates the prep station from the plating station. The prep team can butcher three weeks of meat in a day (compute-bound, throughput-optimized). The plating station serves dishes one at a time (latency-optimized, different rhythm). Forcing one station to do both makes neither efficient.
</div>

## Chunked prefill: a middle ground

For very long prompts, prefill can occupy a GPU long enough to starve decode requests sharing the same machine. A compromise is **chunked prefill**: process the prompt in chunks of, say, 512 tokens, interleaving chunks with ongoing decode steps. The prompt takes slightly longer end-to-end, but decode for other users doesn't stall.

## What to take away

- **Prefill** = process the whole prompt in parallel. Compute-bound. Heavy on tensor cores.
- **Decode** = one token at a time, autoregressively. Memory-bound. Heavy on HBM bandwidth.
- The two phases have **opposite performance characteristics** and respond to different optimizations.
- Most "clever" tricks in serving (batching, quantization, paged KV cache, disaggregation) are about making decode less miserable, since it's the common case.

Next: [Batching many diners at once →](batching.md)

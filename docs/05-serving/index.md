# Part 5 — Serving &amp; Deployment

Part 3 walked through what happens when one token is generated. Part 5 scales that out: many tokens, many users, many GPUs, all of them running simultaneously, reliably, at a reasonable cost.

<div class="hero" markdown>

Serving an LLM at scale is mostly not about the model. It's about three problems: **keeping the GPU busy** (batching, scheduling, speculative decoding), **fitting the KV cache** (paging, quantization, offload), and **handling traffic like an engineer** (autoscaling, observability, graceful failure). Modern serving frameworks exist because all three are hard enough that nobody wants to solve them from scratch anymore.

</div>

## What's in this part

- [Inference servers](inference-servers.md) — vLLM, TGI, TensorRT-LLM, SGLang, llama.cpp. What each is for.
- [Continuous batching](continuous-batching.md) — the single trick that ~10× the throughput of naive serving.
- [GPU cluster operations](cluster-ops.md) — Kubernetes, observability, autoscaling, security.

## Why serving is its own discipline

A web service and an LLM service both sit behind HTTP, but that's about where the similarities stop. Three things differ:

1. **Requests are stateful per-GPU.** The KV cache for each in-flight request lives on the GPU and can be gigabytes. You cannot just round-robin requests across replicas without care.
2. **Latency is dominated by output length.** A 500-token response takes ~5× as long as a 100-token response. Your SLO needs to be shaped accordingly.
3. **Throughput and latency are not independent knobs.** Batching more users improves throughput but hurts tail latency. The Pareto frontier between them is the main operational tuning surface.

If you come from stateless microservice operations, Part 5 will teach you which of your instincts to keep and which to update.

## The one sentence to take away

Modern LLM serving is a game of three resources: **HBM bandwidth** (your per-token decode ceiling), **HBM capacity** (your KV cache budget), and **GPU-hours** (your cost). Everything in this part is about spending them well.

Start with [Inference servers →](inference-servers.md).

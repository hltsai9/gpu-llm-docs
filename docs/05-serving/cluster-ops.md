# GPU cluster operations

By now you've seen what a single GPU does during LLM serving and which framework drives it. This chapter is about running a *fleet* of them reliably — scheduling, scaling, observing, recovering. The practices are different enough from stateless web serving that many of your reflexes will need adjustment.

## Kubernetes and GPUs

Kubernetes is the current default for LLM fleet operations. Making GPUs work inside it requires three pieces:

1. **NVIDIA GPU Operator.** Installs drivers, CUDA runtime, and monitoring tooling on each node. One-time cluster setup.
2. **Device plugin.** Advertises GPUs as a schedulable resource (`nvidia.com/gpu`) that pods can request.
3. **Node labels and taints.** Mark which nodes have which GPU types; taint GPU nodes so only GPU workloads get scheduled there.

A pod requests a GPU like:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

GPUs are indivisible by default — a pod asking for 1 gets a whole GPU, even if it only uses 10% of it. This is the single biggest surprise for people used to fractional CPU requests.

## MIG: the exception to indivisibility

On A100, H100, and H200, **Multi-Instance GPU (MIG)** lets you partition a single GPU into up to 7 smaller isolated GPUs with hardware-enforced compute and memory quotas. Each partition looks like a smaller GPU to the scheduler.

- **Useful for:** running many small models on one big GPU, serving multiple tenants with isolation, or giving developers cheap per-slice GPU access.
- **Not useful for:** dynamic workloads (reconfiguring MIG partitions requires reboot), serving large models (you lose NVLink between partitions).

For LLM serving of large models, MIG usually isn't the right tool. For mixed inference workloads with many small models, it's excellent.

## Scheduling realities

GPU scheduling in Kubernetes has gotchas that don't exist for CPU workloads:

- **Bin-packing matters.** A node with one GPU left and two pods that each want one can't schedule both. Tune pod topology spread to avoid fragmentation.
- **Tensor-parallel workloads** need multiple GPUs on the *same node* (for NVLink). Use `nodeSelector` and node labels like `gpu-count=8` to target hosts with enough co-located GPUs.
- **Rolling updates are slow.** A replaced pod has to cold-load 50–150 GB of model weights from storage, which can take minutes. Plan for overlap between old and new versions during a rollout.
- **Pre-pulling images and warming weights** is worth doing. A large LLM container image can be 20+ GB; have it on the node before the pod needs it.

## Autoscaling

The default Kubernetes horizontal pod autoscaler (HPA) scales on CPU and memory. Neither is useful for LLM serving. The signals that *do* matter:

- **GPU tokens-per-second.** If your throughput is plateauing, you're near capacity.
- **Queue depth.** Requests waiting to enter the batch. Rising = overloaded.
- **KV cache utilization.** The cache fills up before the compute does.
- **Time to first token (TTFT).** The user-facing canary; if it rises, you're capacity-constrained somewhere.

Expose these as Prometheus metrics from your serving framework (vLLM, TGI, and TensorRT-LLM all do, with varying conventions) and use **KEDA** or Prometheus Adapter + HPA to autoscale on them.

Beware the **cold-start problem.** Spinning up a new LLM pod takes minutes (image pull, model load, CUDA graph capture, warm-up). Autoscaling based on current load is too late. Either pre-provision headroom or predict demand from upstream signals (front-page traffic, business hours).

<div class="analogy" markdown>
Autoscaling a stateless web service is like hiring a barista when the line grows. Autoscaling an LLM service is like hiring a head chef — they need time to show up, fire up the ovens, and taste the stock before they can take their first order. You can't do it reactively.
</div>

## Observability

A healthy LLM serving dashboard has more panels than a typical web service. The essentials:

**Per-request**
- TTFT (time to first token), P50 and P95.
- TPOT (time per output token, post-first), P50 and P95.
- End-to-end latency, P50 and P95.
- Token counts in and out.
- Status codes and error rates.

**Per-pod / per-GPU**
- Running batch size.
- KV cache utilization.
- Queue depth.
- Tokens/sec.
- Model FLOPs utilization (MFU) if your framework exposes it.
- HBM memory used.
- `nvidia-smi` temperature and power draw (for hardware health, not capacity).

**Fleet**
- Total concurrent requests.
- Replicas in each deployment.
- Cost per million tokens (derive from GPU-hours).
- Error-budget consumption.

**Tracing.** For multi-step workloads (agents, RAG), distributed tracing (OpenTelemetry) is invaluable. You want to see an individual user's request as it flows through the retrieval step, the rerank step, the generation step, and any tools called.

**Log sampling.** Full prompt and completion logs are often too large (and often too sensitive) to retain for every request. Sample a small percentage, rotate aggressively, and encrypt at rest. Build a "bug triage" flow that captures full logs for flagged sessions only.

## Scheduling strategies: interactive vs. batch

Different workloads have different SLOs:

- **Interactive** (chat, code completion): low TTFT, good TPOT. Willing to use GPU less efficiently to keep users happy.
- **Batch** (summarize 10M documents overnight): high throughput, latency irrelevant. Fill the GPU.
- **Streaming async** (RAG pipelines, agents): somewhere in between.

Running all three on the same cluster requires either (a) separate pools of replicas for each, or (b) a scheduler that understands priority and can preempt batch work when interactive traffic spikes. SGLang and some vLLM extensions can do (b); separate pools are simpler operationally.

## Model deployment patterns

Common patterns for putting a new model into production:

- **Shadow traffic.** New version sees real requests but its responses aren't returned to users. Compare quality offline.
- **Canary.** Route 1%, 5%, 25% to the new version. Watch error rate, latency, and quality metrics.
- **A/B test.** For quality-sensitive changes, route different users to different models and compare downstream outcomes.
- **Instant rollback.** Keep the old version warm for at least a week after a deploy. Rollback from a cold start is painful.

Model versions are not microservice versions. A "bad deploy" of a microservice has a bounded impact radius; a bad deploy of an LLM can degrade every user's experience silently. Invest in pre-deploy evals and canary periods.

## Cost management

Cost discipline on a GPU fleet comes from a short list of levers:

- **Right-sizing GPUs to models.** A 7B model on an H100 is overkill; use L40S or A10G.
- **Quantization.** Every step down in bit width is a step toward fitting more users per GPU. See [quantization](../04-training/quantization.md).
- **Batch sweet spot.** Over- and under-batching both cost money. Tune.
- **Autoscaling down.** Not just up. Nights, weekends, low-traffic periods — get rid of replicas.
- **Reserved instances.** For steady baseline traffic, reserved or committed GPU hours save 30–60% vs. on-demand.
- **Spot / preemptible for batch.** Preemptible GPU instances are cheap if you can tolerate interruptions. Good for overnight batch jobs.

<div class="numbers" markdown>
<div class="cell"><div class="n">~30–60%</div><div class="l">Savings from reserved vs. on-demand at steady load</div></div>
<div class="cell"><div class="n">~2–4×</div><div class="l">Throughput gain from quantization, for memory-bound decode</div></div>
<div class="cell"><div class="n">~20–40%</div><div class="l">Wasted GPU-hours on a typical unoptimized serving fleet</div></div>
</div>

## Failure modes new to LLM serving

The failure modes you'll meet that you haven't before:

- **OOM on long context.** A request with 32k tokens can OOM the KV cache. Enforce max context server-side.
- **CUDA crashes.** Rare but real. Pod health checks should fail on CUDA errors; a restart is usually the fix.
- **Silent quality regression after model swap.** The infrastructure is healthy; the output quality isn't. Only evals catch this.
- **Gradual KV cache fragmentation.** On servers without paged KV, long uptime can fragment the cache. Not common with modern frameworks, but watch for it.
- **Cold-start storms.** A crash-loop on multiple replicas can cascade into a cluster-level outage as weight-loading traffic saturates storage.

## The security surface

Covered in the [Infrastructure learning path](../learning-paths/infrastructure.md) (Step 7), summarized here:

- Rate-limit on **tokens**, not just requests.
- Treat retrieved documents as **untrusted input**. They can contain instructions.
- **Don't put secrets in system prompts.** Assume users can extract them.
- Budget caps per user for downstream paid APIs.
- Sensitive prompt/completion logs need careful retention policy.

## Common mistakes

- **Autoscaling on CPU.** Already covered. Still happens weekly in new teams.
- **Treating GPUs like CPUs** (fractional requests, fast schedules). Doesn't work.
- **Ignoring cold-start.** Autoscaling that assumes 30-second pod start will fail on a 5-minute LLM cold-start.
- **No model version strategy.** "We deployed the new one, but the old one's weights are gone." Keep old versions warm for rollback.
- **Observability only on infrastructure.** You need per-request token metrics, too — the GPU can look healthy while quality is collapsing.

## In one sentence

Operating an LLM fleet well means reading *GPU-native* signals (tokens/sec, KV cache, queue depth) instead of CPU-era proxies, planning for slow pod starts and large per-request state, and recognizing that model quality itself is a reliability metric — not just latency.

Back to [Part 5 index](index.md).

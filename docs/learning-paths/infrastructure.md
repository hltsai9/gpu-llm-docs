# Path 5 — The Infrastructure Engineer

## Who this is for

You run clusters. You know Kubernetes, you've paged on a bad deploy, and "observability" isn't a buzzword to you. Your team is starting to host LLMs — either because your company wants data residency, or because the API bill got scary, or because someone upstream said "we'll just spin up a GPU cluster." Now you're the one who has to turn that sentence into a reliable service.

## The goal

By the end of this path you will:

- Size a GPU cluster for a given model and traffic shape, not by guess.
- Choose and operate a modern inference server (vLLM, TGI, TensorRT-LLM).
- Deploy, observe, and scale LLM workloads on Kubernetes.
- Cost-model self-hosted vs. hosted tradeoffs with numbers, not opinions.
- Handle the new failure modes: OOM on long contexts, head-of-line blocking, quantization regressions, prompt-injection-as-security-risk.

## Prerequisites

Kubernetes basics. Comfort with containers, load balancers, and Prometheus-style metrics. A willingness to read NVIDIA documentation.

## The path

### Step 1 — Why this is different from your previous workloads

Before you apply your stateless-microservice reflexes, pause. LLM serving breaks several assumptions that most web services don't.

1. [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md) — the whole shape of why GPUs are the right tool.
2. [The memory hierarchy](../02-gpu-architecture/memory-hierarchy.md) — you need this. Memory bandwidth is your scarce resource, not CPU cycles.
3. [Anatomy of a GPU](../02-gpu-architecture/anatomy.md) — know the parts you're going to monitor.
4. [Tensor Cores: power tools](../02-gpu-architecture/tensor-cores.md) — why FP8/BF16 choice matters for capacity, not just quality.
5. [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) — the mental model behind every serving optimization.

**Takeaway:** LLM inference is typically memory-bandwidth-bound, heavily stateful per request (KV cache), and extremely sensitive to batch shape. Scaling instincts you use for stateless web services will mislead you in specific ways.

!!! warning "Misconception checkpoint"

    **"An LLM server is a stateless microservice."** Truer-sounding cousin: *"Anything behind an HTTP endpoint is stateless unless we say otherwise."* Your *control plane* can be. The *data plane* is not — it's holding the KV cache for every in-flight request, sometimes megabytes to gigabytes per user. This is why LLM serving looks more like a database than a web service in its scaling characteristics: per-request memory is large, and draining a node isn't free. Plan failover, connection draining, and autoscaling accordingly.

### Step 2 — What a serving GPU actually does

1. [What is a token?](../03-llm-inference/token.md)
2. [The life of a token](../03-llm-inference/life-of-a-token.md)
3. [The KV cache](../03-llm-inference/kv-cache.md) — *the* chapter. Read it twice.
4. [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) — your request has two distinct phases with different cost profiles.
5. [Batching many diners at once](../03-llm-inference/batching.md) — why your serving system doesn't process one request at a time, ever.

**Takeaway:** A single model "deployment" is actually a pair of workloads — compute-heavy prefill and memory-bandwidth-heavy decode — sharing a GPU, with a large stateful KV cache that dominates memory.

!!! warning "Misconception checkpoint"

    **"Two requests = 2× the throughput."** Truer-sounding cousin: *"Horizontal scale is proportional."* For classical stateless services, roughly yes. For LLM inference, batching *increases* per-GPU throughput with more concurrent requests, up to a point (often 2–5× the single-request number) — because the GPU was under-utilized at batch 1 due to memory-bandwidth limits. Above the sweet spot, additional requests start to fight for KV cache space and introduce head-of-line blocking. Know your batch sweet spot for each model × hardware × context-length combo.

### Step 3 — Modern inference servers

New chapter: [Inference servers](../05-serving/inference-servers.md). Deep comparison of vLLM, TGI (Text Generation Inference), TensorRT-LLM, SGLang, and llama.cpp. What each is optimized for, what it costs to operate, where it wins.

**Takeaway:** Pick a server for your model and hardware, not because it's trendy. vLLM for general open-source serving on datacenter GPUs. TensorRT-LLM when you want the last 30% of performance on NVIDIA and you'll pay the complexity tax. llama.cpp for edge/CPU/Apple Silicon. TGI/SGLang for specific workload shapes.

!!! warning "Misconception checkpoint"

    **"I'll write my own serving layer — it's just PyTorch inference in a loop."** Truer-sounding cousin: *"Thin wrappers around well-designed libraries are fine."* For classical model serving (a CNN, a small BERT), reasonable. For LLM serving, you will reinvent continuous batching, paged KV cache, prefix caching, speculative decoding, and CUDA graph capture — each of which is a multi-month project by itself. The performance gap between a hand-rolled loop and vLLM is often 10–20×. Use the library.

### Step 4 — Continuous batching: the central trick

New chapter: [Continuous batching](../05-serving/continuous-batching.md). Static batching vs. dynamic batching vs. continuous (iteration-level) batching. How paged attention enables it. Why it's the single biggest throughput lever in modern serving.

**Takeaway:** In continuous batching, the server doesn't wait for a "batch window" — it splices new requests into the in-flight batch at every decode step. This keeps the GPU busy and is the reason modern servers can hit 5–10× the throughput of naive PyTorch serving.

!!! warning "Misconception checkpoint"

    **"Larger batch = always faster per-user."** Truer-sounding cousin: *"Throughput and latency trade off along a Pareto curve."* They do, but not always smoothly. Above a certain batch size, KV cache pressure forces eviction or page swaps, and both make *everyone* slower. This is why modern servers have a configured max batch size — it's not a performance knob, it's a safety rail against cliff-edge degradation.

### Step 5 — Quantization for deployment

Use the ML Engineer path's chapter: [Quantization deep dive](../04-training/quantization.md).

Your lens is different: you're not training, you're serving. Key questions for you: what's the deploy-time overhead of quantization (calibration time, extra kernels), how does quantized inference interact with your server (most support FP8 and INT4 natively, some don't), and what's the accuracy regression budget for your application?

**Takeaway:** FP8 or INT4 quantization roughly doubles effective capacity on a given GPU because weights read from HBM are halved/quartered. That means 2–4× more concurrent users per GPU, or a model one size up at the same footprint.

### Step 6 — Cluster operations

New chapter: [GPU cluster ops](../05-serving/cluster-ops.md). Kubernetes GPU operator, NVIDIA device plugin, MIG (Multi-Instance GPU), resource requests and limits (the ones that don't exist for GPUs), pod scheduling, autoscaling against GPU-aware metrics, canary deploys of LLM models, and the observability stack (Prometheus for GPU metrics, tracing for request flow, token-level logs).

**Takeaway:** GPU scheduling in Kubernetes is best-effort and chunky — a GPU is an indivisible resource (MIG aside), so bin-packing is a real problem. Autoscaling on "pod CPU" doesn't work; you need GPU-aware metrics (batch size, KV cache utilization, queue depth).

!!! warning "Misconception checkpoint"

    **"GPU utilization at 100% means I'm efficient."** (Same misconception as the ML engineer path, same reason it's tempting.) Truer-sounding cousin: *"CPU at 100% means fully loaded."* `nvidia-smi`'s "utilization" is a coarse activity counter — it's 100% if the GPU did any work in a sampling window. A memory-bound workload can sit at 100% utilization while running at 5% of peak FLOPs. Watch **tokens/sec** and **MFU**, not utilization percent.

!!! warning "Misconception checkpoint"

    **"A bigger GPU always gives better $/token."** Truer-sounding cousin: *"Bigger is cheaper per unit at scale."* True for storage and bandwidth. For GPUs, the dollars-per-token economics depend on the model size, context length, and traffic shape. An H100 is overkill for a 7B model on low-concurrency traffic; a fleet of L40S or A10s can win on $/token at that scale. Bigger wins when the model needs more VRAM than smaller cards have, or when you can drive the bigger card into heavy batching.

### Step 7 — The new security surface

LLM serving has failure modes your previous services didn't:

- **Prompt injection via retrieved content.** A malicious doc in the RAG corpus issuing instructions. Treat retrieved content as untrusted input.
- **Prompt-leak attacks.** Users extracting system prompts. If your system prompt contains secrets, you've already lost — don't put secrets there.
- **Token-budget DoS.** A user sending a maximum-context prompt, repeatedly. Rate-limit on *tokens*, not just requests.
- **Cost DoS on metered backends.** If you're calling a paid API downstream, a slow-loris user can cost you real dollars. Budget caps per user.
- **Privacy in logs.** Prompt + completion logs are often highly sensitive (user data, health, finance). Plan retention and access controls before you turn logging on.

**Takeaway:** Assume any user-influenced string can contain instructions. Assume anyone can read any system prompt given enough attempts. Design around those assumptions.

### Step 8 — Cost-modeling without tears

New chapter (shared with PM path): [Economics](../07-strategy/economics.md) — skip to the self-hosted section.

Key decomposition for you:

- **Fixed cost:** GPU rental or capex, networking, engineering on-call, power and cooling if on-prem.
- **Variable cost:** electricity proportional to GPU-hours, egress bandwidth.
- **Throughput:** tokens/sec per GPU at your batch sweet spot.
- **Utilization:** expected duty cycle across the week (usually 30–60% for interactive workloads).

$/million tokens ≈ (fixed + variable cost per GPU-hour) / (tokens/sec × 3600 × utilization / 1e6).

Compare to hosted pricing. Below a certain sustained traffic level, hosted wins. Above it, self-hosted wins — *if* you're running at your batch sweet spot and high utilization.

## Misconceptions, consolidated

| Misconception | Where it comes from |
|---|---|
| LLM server is stateless | Microservice habits. |
| 2× requests = 2× throughput | Stateless linear scaling intuition. |
| Roll your own serving | Thin-wrapper instincts from classical ML serving. |
| Bigger batch always better | Ignores KV cache pressure cliff. |
| 100% GPU util = efficient | Coarse metric misread as a capacity indicator. |
| Bigger GPU = better $/token | Ignores model-size fit and traffic shape. |

## Checkpoints

Before you call this path done:

1. Size a deployment: Llama-3-70B, BF16, 4K average context, 500 QPS, P95 < 2s TTFT. How many H100s? Which server? Why?
2. Your tokens/sec dropped 30% after a rolling deploy with no code change. Describe your first five diagnostic steps.
3. A PM wants to know whether you'd save money self-hosting versus the hosted API. What do you need to know, and what's your answer shape?
4. What does your per-pod Prometheus dashboard look like for this service? Name the top five metrics.
5. A security review asks how you prevent prompt-injection attacks. Walk through your defense-in-depth.

If you can, your pager will hurt less.

Back to [all paths](index.md).

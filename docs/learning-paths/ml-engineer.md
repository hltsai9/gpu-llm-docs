# Path 2 — The ML Engineer

## Who this is for

You've trained models. Maybe a CNN in grad school, maybe a recommender at work, maybe you fine-tuned BERT in 2020 and haven't looked at transformers since. You're now staring at a Llama-class decoder and someone on your team is asking questions like "can we QLoRA this on one A100?" and "do we need ZeRO-3 or is FSDP enough?" You want to go from *I know what a transformer is* to *I can make principled decisions about fine-tuning and deployment.*

## The goal

By the end of this path you will:

- Explain, with numbers, how much VRAM a model takes to train vs. serve, and where each byte goes.
- Choose intelligently between full fine-tuning, LoRA, QLoRA, and DPO for a given task.
- Set up a distributed training run without voodoo — know which parallelism axis you're using and why.
- Quantize a model for deployment and know what accuracy you gave up.
- Read performance logs for a training run and spot the real bottleneck (not just "GPU utilization is low").

## Prerequisites

PyTorch comfort. Some linear algebra. You've done at least one backward pass on purpose.

## The path

### Step 1 — Ground yourself in the hardware

This is the step ML people most want to skip. Don't. The reason modern LLM training recipes look the way they do is the hardware shape underneath them.

1. [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md)
2. [SIMT — the synchronized kitchen](../01-why-gpu/simt.md)
3. [The memory hierarchy](../02-gpu-architecture/memory-hierarchy.md) — the single most important hardware chapter for you.
4. [Tensor Cores: power tools](../02-gpu-architecture/tensor-cores.md) — why BF16/FP8 aren't just "lower precision," they're a hardware speed knob.
5. [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) — the mental model every optimization story will reduce to.

**Takeaway:** Most "my training is slow" bugs are memory-bandwidth bugs, not compute bugs. Know the roofline before you touch the optimizer.

!!! warning "Misconception checkpoint"

    **"GPU utilization at 100% means we're doing well."** Truer-sounding cousin: *"CPU at 100% means the CPU is the bottleneck — upgrade it."* For CPUs, yes. On GPUs, `nvidia-smi` reporting 100% means the GPU had *some* work every sample period — it doesn't tell you whether the work was saturating the tensor cores or, much more commonly, stalling on HBM reads. Your training can be "100% utilized" and still running at a small fraction of peak FLOPs. The right number is *tokens/sec* for training, or *MFU* (model FLOPs utilization) — that typical value is 30–50%, not 100%.

### Step 2 — Training vs. inference: two different jobs

New chapter: [Training vs. inference](../04-training/training-vs-inference.md). Covers activations, gradients, optimizer states, KV cache, mixed precision, and the VRAM math for each phase. Worked example: how much memory a 7B model takes to train in FP16 vs. BF16 vs. FP8, and why serving the same model takes 5× less.

**Takeaway:** The naive estimate is "parameters × bytes." The real estimate is "parameters × bytes × ~5–6 for training, × ~1–2 for inference." Optimizer states dominate training memory, not weights.

!!! warning "Misconception checkpoint"

    **"A 70B model needs a 70B-parameter-sized GPU to train."** Truer-sounding cousin: *"To open a 140GB file, I need 140GB of RAM."* The real number for training is roughly 6× the model's byte footprint, because Adam keeps first and second moments (2× extra), you need gradients (1× extra), you need activations proportional to batch × sequence × layers (often the *biggest* term), and the model weights themselves. A 70B model in FP16 is 140GB of weights and roughly 1.5–2TB of *training state* when naively sharded.

### Step 3 — The fine-tuning spectrum

New chapter: [Fine-tuning spectrum](../04-training/fine-tuning-spectrum.md). Full fine-tuning, LoRA, QLoRA, adapters, prefix tuning, DPO, RLHF (conceptually). Decision tree: given your data, your goal, and your GPU budget, what do you choose?

**Takeaway:** Each method changes a different set of parameters. The choice is primarily about (a) how much behavior you need to move, (b) how much data you have, and (c) how much compute. Not "newest = best."

!!! warning "Misconception checkpoint"

    **"LoRA is always as good as full fine-tuning."** Truer-sounding cousin: *"Low-rank approximations capture most of the signal in most matrices."* Often true — LoRA does capture most of the useful signal for narrow tasks (style, format, a specific domain's vocabulary). It does *not* capture substantial capability shifts (teaching a base model to do math, or to speak a language it's weak in). Papers showing "LoRA matches full FT" tend to measure narrow tasks; the gap widens on capability tasks. Pick by task profile, not by default.

!!! warning "Misconception checkpoint"

    **"Fine-tuning is the way to add knowledge."** Truer-sounding cousin: *"Training on data adds data to the model."* Conceptually true; practically unreliable. Fine-tuning tends to shift distribution and surface patterns rather than memorize facts, and it *does* reliably increase hallucination when the fine-tune data is factual but the model hasn't actually learned the facts. Use RAG for knowledge, fine-tuning for style/behavior. This is one of the most expensive mistakes in the field.

### Step 4 — Making it fit: quantization

New chapter: [Quantization deep dive](../04-training/quantization.md). Integer vs. float formats (INT8, INT4, FP8, BF16), weight-only vs. activation quantization, GPTQ, AWQ, GGUF, SmoothQuant, and the concrete accuracy you give up. Covers both training-aware quantization (QAT) and post-training (PTQ).

Tie this back to the [roofline](../03-llm-inference/roofline.md): quantization doesn't just save memory, it increases arithmetic intensity, which can *speed up* a memory-bound model by the same ratio as the bit reduction.

**Takeaway:** Quantization is almost always a win for inference. For training, it's more subtle — stick to BF16/FP8 (where hardware supports it), not INT8, until you know why.

!!! warning "Misconception checkpoint"

    **"4-bit loses a quarter of the quality."** Truer-sounding cousin: *"Halving precision should roughly halve quality."* LLM weight distributions are extraordinarily concentrated — most weights are close to zero, and a good 4-bit scheme quantizes the tails carefully. Modern 4-bit quantization of a 70B model typically loses <2% on standard benchmarks, not 75%. The naive intuition comes from thinking about 4-bit audio or 4-bit images, where every bit matters because the distribution is more uniform.

### Step 5 — Scaling across GPUs

New chapter: [Distributed training](../04-training/distributed-training.md). The three parallelism axes (data, tensor, pipeline), ZeRO stages, FSDP, when to reach for which, and why *training recipes for frontier models are mostly distributed-systems code, not ML code.*

**Takeaway:** Start with data parallel. Add FSDP / ZeRO-3 when your model doesn't fit. Reach for tensor parallel only when FSDP communication cost dominates. Pipeline parallel is a niche tool for very specific topologies.

!!! warning "Misconception checkpoint"

    **"More GPUs = proportionally faster."** Truer-sounding cousin: *"A team of 10 is 10× faster than a team of 1 at parallelizable work."* For embarrassingly parallel jobs, approximately true. For distributed training, communication overhead scales up as you add nodes, and at some cluster size the interconnect (NVLink, InfiniBand) becomes the bottleneck. Above ~64 GPUs you start seeing strong diminishing returns unless you change the parallelism strategy. This is why big clusters are measured in MFU (model FLOPs utilization), not just "number of GPUs."

### Step 6 — The craft: training that actually works

- [Attention, explained slowly](../03-llm-inference/attention.md) — re-read now that you're thinking about training, not inference.
- [The KV cache](../03-llm-inference/kv-cache.md) — re-read; the numbers will mean more now.
- FlashAttention (referenced in [roofline](../03-llm-inference/roofline.md)) — know why it helps and when it doesn't.

**Takeaway:** Training a modern LLM is mostly about keeping data on-chip. Flash-style kernels, gradient checkpointing (trade compute for memory), activation offloading, and careful batch shaping are the main tools.

### Step 7 — Evaluation that isn't a loss curve

Use the developer-path chapter [Evals](../06-building/evals.md) as your starting point, and extend with standard LLM benchmarks. Key insight: training loss goes down smoothly while downstream capabilities arrive in sudden jumps. *Loss is a proxy for a proxy.* Always evaluate on the task you care about.

!!! warning "Misconception checkpoint"

    **"Lower loss = better model."** Truer-sounding cousin: *"A better-fitting model is a better model."* True for most of classical ML. For LLMs, *loss measures calibration over the next-token distribution, not capability.* Two models at the same loss can have wildly different downstream performance — and a model overtrained on one domain can have low loss and poor generalization. Use both: loss for training health, real evals for model quality.

## Misconceptions, consolidated

| Misconception | Where it comes from |
|---|---|
| 100% GPU util = good | How we read CPU utilization. |
| Need model-sized GPU to train | Treating memory like disk. |
| LoRA ≈ full FT always | Low-rank intuition from linear algebra. |
| Fine-tune to add facts | "Training is teaching." Mostly it's styling. |
| 4-bit = 25% quality | Naive bit-count reasoning. |
| More GPUs = proportionally faster | Amdahl forgets comms cost. |
| Lower loss = better model | Classical ML hygiene applied to a different objective. |

## Checkpoints

Before you call this path done:

1. A 70B model, FP16, trained with Adam on 2048-token sequences at batch 8. Estimate total training memory per GPU under FSDP ZeRO-3 on 32 GPUs. Show your work.
2. You QLoRA'd a 13B base into a customer-support assistant. Evals on your test set look great. A PM ships it. Two weeks later quality drops when users ask about a new product. What happened and what's the fix?
3. Your H100 training run shows 35% MFU. Is that good? Describe the next three things you'd check.
4. Name three scenarios where you would *not* reach for LoRA.
5. The team wants FP8. Walk through what you would measure before flipping the switch.

If all five are comfortable, you're past the chasm.

Next path: [Product Manager →](product-manager.md) · Back to [all paths](index.md)

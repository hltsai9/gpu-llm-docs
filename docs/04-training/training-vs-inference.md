# Training vs. inference

A model's forward pass is the same graph whether you're generating a token in production or running a training step in the lab. But the *accounting* around that forward pass differs so much that training and inference feel like separate disciplines.

## The job, restated

<div class="analogy" markdown>
Inference is a restaurant service: the recipe is fixed, and the chef pumps out portions as fast as possible. Training is recipe development: the chef also cooks, but after every batch they taste, adjust the salt, note it down, and try again. They need a notebook, a ruler, scales, the last three versions of the sauce in the walk-in, and extra counter space to write on.
</div>

Concretely, the forward pass is the same $y = f(x; \theta)$ in both cases. Training adds:

1. A **backward pass** that computes gradients of a loss with respect to the weights.
2. An **optimizer step** that updates the weights using those gradients.
3. The **activations** saved during forward that the backward pass will need.
4. The **optimizer's own state** (Adam's $m$ and $v$ moments).

Each of those is a memory and compute cost.

## The memory math

Let $N$ be the number of parameters and $b$ the bytes per parameter (2 for FP16/BF16, 4 for FP32, 1 for FP8).

**Inference memory**, approximately:

$$
\text{mem}_{\text{inf}} \approx N \cdot b + \text{KV cache}
$$

For a 7B model at BF16 with modest context: $7{\times}10^9 \times 2 = 14\text{ GB}$ of weights, plus a few gigabytes of KV cache. One consumer GPU.

**Training memory** (mixed precision with Adam and no memory optimizations), approximately:

$$
\text{mem}_{\text{train}} \approx N \cdot b \;+\; N \cdot 4 \;+\; N \cdot 8 \;+\; A
$$

Broken down:

- $N \cdot b$ — the weights in half precision (what you forward with).
- $N \cdot 4$ — a **master copy** of the weights in FP32 (what the optimizer updates to avoid precision drift).
- $N \cdot 8$ — Adam's two moment tensors in FP32 (so $2 \times 4$).
- $A$ — **activations**: intermediate tensors from the forward pass, saved for backward.

For a 7B model:

- Weights in BF16: 14 GB
- FP32 master copy: 28 GB
- Adam moments: 56 GB
- Total, just for the optimizer and weights: **98 GB**
- Plus activations — for a 4096-sequence batch, easily another 20–40 GB.

<div class="numbers" markdown>
<div class="cell"><div class="n">~14 GB</div><div class="l">Weights at BF16 (7B model)</div></div>
<div class="cell"><div class="n">~98 GB</div><div class="l">Weights + FP32 master + Adam state</div></div>
<div class="cell"><div class="n">~120–140 GB</div><div class="l">With typical training activations</div></div>
<div class="cell"><div class="n">~14 GB</div><div class="l">Inference memory for the same model</div></div>
</div>

**A 7B model takes ~14 GB to serve and ~120 GB to train.** An 80-GB H100 cannot train a 7B model naively. You need memory optimizations, which is what the rest of this part is about.

!!! note "The 5–6× rule of thumb"
    For BF16 mixed-precision training with Adam, total training memory is roughly $5{-}6\times$ the inference memory. For a 70B model, that's ~600–800 GB of training state — far beyond any single GPU, which is why training runs at scale are inherently distributed.

## Where activations come from

Activations are often the single biggest memory line item, and they scale with *batch × sequence × hidden dim × layers* — so they grow quadratically in things that seem innocuous.

For a transformer layer processing a batch of $B$ sequences of length $L$, hidden size $H$:

- Input to the layer: $B \cdot L \cdot H \cdot b$ bytes.
- Attention intermediate (without FlashAttention): up to $B \cdot L^2 \cdot H \cdot b$ bytes — note the $L^2$.
- Output: $B \cdot L \cdot H \cdot b$ bytes.

Multiply by the number of layers. For a 70B model (80 layers, 8192 hidden, BF16) at $B=4$, $L=4096$: tens of gigabytes of activations, easily.

That's why:

- **Gradient checkpointing** exists. Save only some activations; recompute the rest on backward. Cuts activation memory 2–4×, costs ~30% more forward-pass compute.
- **FlashAttention** is a big deal. Its attention never materializes the $L^2$ intermediate in HBM — it stays in registers/SRAM. Saves a huge amount of memory bandwidth *and* activation storage.
- **Sequence packing** matters. Packing multiple short sequences into one $L$-length batch slot uses activations more efficiently.

## Why inference is different

Inference drops all of the above. No gradients, no optimizer, no saved activations. What's left:

- Weights, at whatever precision you deploy (often INT4/INT8/FP8 for efficiency).
- The **KV cache** — a new memory consumer that inference has but training doesn't (see [KV cache](../03-llm-inference/kv-cache.md)).

That's why the same model is 5–10× cheaper to serve than to train. It's also why "fits on one GPU" means very different things in the two contexts. A 70B model at INT4 fits comfortably on a single H100 for inference. Training that same model needs dozens of H100s.

<div class="analogy" markdown>
Training is the chef carrying a notebook, three reference sauces, a ruler, and a scale around the kitchen. Inference is the chef with just the recipe card and a pan.
</div>

## Compute profile

The compute story is simpler but also worth knowing:

- Training forward: roughly $2N$ FLOPs per token per layer (matmul dominates).
- Training backward: another $2N$ FLOPs per token per layer, plus weight-gradient matmuls. Call it $\sim 2\times$ forward.
- **Total training compute per token: $\sim 6N$ FLOPs.**
- Inference forward (prefill, one token): $\sim 2N$ FLOPs.
- Inference decode, one new token: $\sim 2N$ FLOPs — but arithmetic intensity is much lower (see [roofline](../03-llm-inference/roofline.md)), so the effective throughput is a small fraction of peak.

This is where the famous Chinchilla law comes from: training a model of $N$ parameters on $D$ tokens costs $\sim 6ND$ FLOPs. For a 70B model on 2T tokens: $6 \times 7{\times}10^{10} \times 2{\times}10^{12} = 8.4{\times}10^{23}$ FLOPs. At 400 TFLOPs sustained per H100, that's ~66,000 GPU-hours. A rounding error for the hyperscalers; a whole year for a small team.

## What this changes in your recipe

If you are going to train or fine-tune an LLM, the practical implications of the above are:

- **Mixed precision is not optional.** BF16 or FP8 compute with FP32 master weights. FP32 everywhere is 2× the memory for no quality gain on modern hardware.
- **Plan for activation memory up front.** It's usually the dominant term, and the knob that most people miss. FlashAttention and gradient checkpointing are the first levers.
- **Optimizer state is huge.** This is what ZeRO (and its FSDP sibling) shards across GPUs — more on that in [distributed training](distributed-training.md).
- **Test with a real batch size first.** Out-of-memory errors scale with batch and sequence, and a training run that succeeds at $B=1, L=512$ can OOM at $B=8, L=4096$.

## In one sentence

Training is inference plus a backward pass, plus the optimizer state that drives weight updates, plus the activations the backward pass needs — and that "plus" comes out to a 5–6× memory multiplier and 3× more compute per token.

Next: [The fine-tuning spectrum →](fine-tuning-spectrum.md)

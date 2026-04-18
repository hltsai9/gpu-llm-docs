# Quantization deep dive

A neural network's weights are numbers. The numbers can be stored in many formats: FP32 (4 bytes), FP16 or BF16 (2 bytes), FP8 (1 byte), INT8 (1 byte), INT4 (0.5 bytes). **Quantization** is the craft of using smaller formats without wrecking quality.

Every person who operates or deploys LLMs has to think about this, because it is the single biggest knob on both memory and speed.

## Why it works at all

Weights in a trained LLM are not uniformly distributed. They are concentrated near zero, with occasional large outliers. A distribution like that *does not need 32 bits* to represent well. A careful 4-bit scheme can capture the important information — the relative magnitudes and signs — while losing only the fine details that don't matter for output quality.

<div class="analogy" markdown>
Audio is typically recorded at 16 or 24 bits because the ear notices the difference. But a density histogram of "how much of a typical song is at each amplitude" is roughly uniform — every bit counts. A neural network's weight histogram looks more like a pile of sand: a big peak near zero, a long thin tail. If you spend your bits proportionally to where the mass is, you can store it very compactly.
</div>

This is why "4-bit" sounds alarming (3/4 of the bits are gone!) but often only costs 1–2 points on benchmarks. It's not random bit-dropping; it's a targeted compression of a specific distribution shape.

## The bit widths and what they mean

<div class="numbers" markdown>
<div class="cell"><div class="n">FP32</div><div class="l">4 bytes — training default, overkill for inference</div></div>
<div class="cell"><div class="n">BF16</div><div class="l">2 bytes — wide range, modest precision; training + inference</div></div>
<div class="cell"><div class="n">FP16</div><div class="l">2 bytes — narrower range, trickier; mostly legacy</div></div>
<div class="cell"><div class="n">FP8</div><div class="l">1 byte — new hardware support; training + inference</div></div>
<div class="cell"><div class="n">INT8</div><div class="l">1 byte — widely supported; inference</div></div>
<div class="cell"><div class="n">INT4</div><div class="l">0.5 bytes — inference only, with care</div></div>
</div>

**BF16** (bfloat16) has 8 exponent bits and 7 mantissa bits — it matches FP32's dynamic range but not its precision. That makes it robust for training, which is why it's the default on modern hardware.

**FP16** has 5 exponent bits and 10 mantissa bits — better precision than BF16 but smaller dynamic range, which causes training instability (gradients overflow). For inference, fine.

**FP8** is newer (Hopper+ on NVIDIA). Two sub-formats: E4M3 (4 exponent, 3 mantissa, for weights/activations) and E5M2 (5 exponent, 2 mantissa, for gradients). Supported in tensor cores; can accelerate training meaningfully.

**INT8 and INT4** are integer formats. Weights are stored as small integers plus a scale factor (and optionally a zero point). At compute time, weights are dequantized to the active format (usually BF16 or FP16) and multiplied. The key insight: *storing and moving* the weights in 4-bit saves memory and bandwidth, which is what matters for memory-bound inference (see [roofline](../03-llm-inference/roofline.md)).

## Weight-only vs. activation quantization

Most practical LLM quantization is **weight-only**: weights are stored in INT4/INT8, activations stay in BF16. This gets the big capacity and bandwidth wins (weights dominate HBM traffic) without the tricky part.

**Activation quantization** quantizes the runtime tensors too. Harder, because activations have outliers that don't compress well, and different layers have wildly different scales. SmoothQuant (2022) and ZeroQuant (2022) were key papers in making activation quantization work. Production inference servers mostly use activation quantization only when squeezing the last 20–30% of throughput.

## Calibration: the part people skip

Post-training quantization (PTQ) doesn't just round weights — it runs a *calibration pass* on a small dataset (often 128–512 samples) to measure the actual distribution of activations and weights, then picks scale factors that preserve the important mass.

- **GPTQ** (2022) — layer-by-layer calibration using a small number of examples. Good quality at 4-bit. Takes 10 minutes to an hour to calibrate a 70B model.
- **AWQ** (2023) — observes that a few percent of weights are disproportionately important ("salient") and preserves their precision while quantizing the rest harder. Faster to calibrate than GPTQ, often slightly better quality.
- **GGUF** — a file format (not an algorithm) used by llama.cpp and the Apple Silicon ecosystem. Wraps several quantization schemes (Q4_K_M, Q5_K_M, Q6_K, etc.) with their own precision tradeoffs, tuned for CPU and unified-memory GPUs.

The choice between GPTQ/AWQ/GGUF is mostly about where you deploy:

- **Datacenter NVIDIA GPUs:** GPTQ or AWQ, with vLLM or TensorRT-LLM.
- **CPU / Apple Silicon / edge:** GGUF via llama.cpp.

## QAT vs. PTQ

- **Post-Training Quantization (PTQ):** quantize an already-trained model. Fast (minutes to hours), works well for most models at INT8 and for frontier models at INT4.
- **Quantization-Aware Training (QAT):** simulate quantization during training so the model adapts to the rounding. Best quality at aggressive bit widths, but you pay with training time. Used when PTQ doesn't hit the accuracy bar.

For LLMs as of 2025, PTQ is the overwhelming default; QAT is reserved for research or extreme compression targets.

## Accuracy: what you actually give up

Concrete numbers from public reports, for reference model families:

| Precision | MMLU delta from FP16 | Notes |
|---|---|---|
| BF16 | ~0 | Indistinguishable from FP16 on most tasks |
| FP8 | ~0 to -0.5 | Near-lossless on most models |
| INT8 weight-only | ~0 to -1 | Essentially free |
| INT4 (GPTQ/AWQ) | -1 to -3 | Noticeable but acceptable for most applications |
| INT3 / INT2 | -5 or worse | Research territory |

The takeaway: **quantization down to INT4 is close to free** for most applications. Below 4 bits, quality starts to erode faster than the savings justify.

!!! warning "Misconception"
    **"4-bit loses 75% of the quality."** Bit count is not quality; the *usable information* in a distribution is. Because LLM weights are highly concentrated, you can throw away many bits without losing much. This is why modern 4-bit 70B models score within a percentage point or two of their BF16 counterparts on standard benchmarks. If you come from audio or image domains — where bits matter more uniformly — this result can look suspicious. It isn't; the distribution really is different.

## What quantization buys you

Memory and bandwidth, proportional to the bit reduction:

- A 70B model at BF16: 140 GB. One H100 (80GB) cannot hold it.
- A 70B model at INT4: 35 GB. Fits comfortably on one H100, with plenty of room for KV cache and activations.

Bandwidth improvements translate directly to throughput on memory-bound inference. If decode is memory-bound (which it usually is), going from FP16 to INT4 roughly quadruples the tokens/sec of that specific GPU.

<div class="numbers" markdown>
<div class="cell"><div class="n">4×</div><div class="l">Memory reduction, FP16 → INT4</div></div>
<div class="cell"><div class="n">~3–4×</div><div class="l">Decode throughput improvement on memory-bound inference</div></div>
<div class="cell"><div class="n">&lt;2%</div><div class="l">Typical MMLU drop for a well-calibrated INT4 70B model</div></div>
</div>

## When quantization backfires

- **Small models (1–3B).** They have less redundancy; aggressive quantization hurts more.
- **Long-tail tasks.** Benchmarks average out, but specific tasks (math, multi-step reasoning, rare languages) can regress disproportionately. Always test on *your* task.
- **Models trained in low precision already.** If a model was trained in FP8 or with QAT at INT4, further aggressive quantization has less headroom to give.
- **Unusual architectures.** Mixture-of-experts (MoE), models with unusual attention variants, or models with very wide hidden dimensions sometimes don't calibrate cleanly with off-the-shelf tools.

## For training: different rules

Weight quantization for training is much trickier because gradients are noisier and span wider dynamic ranges than weights. The practical rules:

- **BF16 compute with FP32 master weights** is the mainstream default (mixed precision).
- **FP8 training** (transformer-engine, MS-AMP) can give ~1.5–2× speedup on Hopper+ hardware; enabling it is a project, not a flag.
- **INT8 or INT4 training** is research-only as of 2025.

For fine-tuning at lower precision, **QLoRA** is the exception that proves the rule: the frozen base is held in INT4, but the *trainable* LoRA adapters are in BF16, and the dequantization math is carefully designed to preserve gradient quality. (See [fine-tuning spectrum](fine-tuning-spectrum.md).)

## A rule of thumb for deployment

If you are serving an LLM and haven't quantized, you are probably paying 2–4× more than you need to. The default deployment precision for most open-source models in 2025 is one of:

- **INT8 weight-only** — near-lossless, broad support.
- **FP8** — on Hopper+; can also apply to activations.
- **INT4 (GPTQ or AWQ)** — for memory-constrained environments or to maximize throughput per GPU.

Pick the one your serving framework and GPU natively accelerate, run your evals to confirm the quality is acceptable, and you're likely in the right spot.

## In one sentence

Quantization exploits the fact that LLM weights are heavily concentrated: you can store them with far fewer bits than their nominal precision, reclaiming memory and bandwidth at only a small quality cost — and because inference is memory-bound, that saved bandwidth translates almost directly into throughput.

Next: [Distributed training →](distributed-training.md)

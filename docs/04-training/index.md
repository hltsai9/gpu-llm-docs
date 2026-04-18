# Part 4 — Training &amp; Fine-Tuning

Parts 1–3 answered the question *"what does a GPU do when an LLM runs?"* The answer centered on inference — one forward pass, one new token. Part 4 opens the other door: *how did the model's weights get set in the first place, and how do we change them?*

<div class="hero" markdown>

Training and inference look superficially similar — both push tensors through the same graph — but their performance profiles, memory budgets, and failure modes are so different that they might as well be separate workloads. A GPU happy as a serving box will fall over during training, and a training recipe tuned for 512 GPUs looks nothing like one for 4.

</div>

## What changes from inference to training

Three things get much bigger:

1. **A backward pass is added.** For every forward op, there is a gradient op. Roughly a 2× compute multiplier.
2. **Activations must be kept.** During the forward pass you save intermediate tensors so the backward pass can use them. For long sequences and deep models, activations can be the *largest* memory term — bigger than the weights.
3. **The optimizer keeps state.** Adam keeps two extra tensors per parameter (first and second moment). That's 2× the weight size *on top of* the weights themselves.

Add them together: training memory for a model is typically 5–6× its inference memory. This single fact explains almost every recipe in this part.

## What's in this part

- [Training vs. inference](training-vs-inference.md) — the memory math, with numbers you can keep in your head.
- [The fine-tuning spectrum](fine-tuning-spectrum.md) — full FT, LoRA, QLoRA, DPO/RLHF. When each is the right tool.
- [Quantization deep dive](quantization.md) — FP16, BF16, FP8, INT8, INT4; what you pay in accuracy, what you gain in capacity.
- [Distributed training](distributed-training.md) — data / tensor / pipeline parallel; FSDP and ZeRO stages; when to reach for each.

## The one sentence to take away

You rarely need to train a foundation model from scratch. You frequently need to fine-tune one. Fine-tuning well is about (a) picking the right *kind* of fine-tune for your goal, (b) keeping the math within a memory budget, and (c) evaluating outcomes on the task you actually care about — not on training loss.

Start with [Training vs. inference →](training-vs-inference.md).

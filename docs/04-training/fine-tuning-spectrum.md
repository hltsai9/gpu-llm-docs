# The fine-tuning spectrum

"Fine-tuning" is the single word the industry uses for about six different operations. They share the idea of "start from a pretrained model and make it better at something," but they differ in *which parameters change*, *how many*, and *what kind of feedback they use.* Picking the wrong one is the most common cause of wasted training budget.

<div class="hero" markdown>

The spectrum, from smallest to largest footprint: **prompt engineering → few-shot in-context → retrieval → prefix/adapter tuning → LoRA → QLoRA → full fine-tuning → continued pretraining.**

Each step changes more of the model and requires more data, more compute, and more care. Start at the cheapest end that solves your problem. Do not skip levels because the next one sounds more powerful.

</div>

## Why there's a spectrum at all

All deep learning models are shaped by two things: the training objective and the data. A pretrained LLM has been shaped by "predict the next token over the internet." To change its behavior you can either:

- Change the *input* at inference time (prompt engineering, RAG).
- Change a *small set of new parameters* that gently nudge the model (LoRA, adapters).
- Change *all parameters* with a new objective (full fine-tuning, DPO, RLHF).
- Change *all parameters* with large new data from a new domain (continued pretraining).

Each option trades compute and data for more influence over behavior. More influence is not always better — a heavier method on too-little data will overfit and make the model worse at everything else.

## The decision tree

Before fine-tuning anything, ask:

1. **Can I solve this with a better prompt?** Often yes, and it costs nothing.
2. **Can I solve this by giving the model the right context?** If "the model doesn't know our product details," this is RAG territory — see [RAG fundamentals](../06-building/rag.md). Fine-tuning for facts is an expensive, flaky, shaft.
3. **Do I have a clear behavioral shift I want?** ("Always respond in this tone / format / refuse requests like X.") This is what fine-tuning is actually good at.
4. **Do I have clean labeled data for that behavior?** A few hundred high-quality examples beats tens of thousands of mediocre ones.
5. **Is the behavior narrow or broad?** Narrow → LoRA/QLoRA. Broad → consider full FT or DPO.

If step 1 or 2 solves it, *stop.* You're done. Fine-tuning for problems that prompting or RAG could solve is the #1 waste of GPU hours in the field.

!!! warning "The fact-learning trap"
    People reach for fine-tuning to "teach the model our data." It mostly doesn't work. Fine-tuning on factual text shifts the model's *style* toward that text's distribution without reliably memorizing the facts. The model learns to sound like it knows, not to actually know. Worse, this increases hallucination: the model has learned the *shape* of your company's answers without the content. Put facts in context via RAG; use fine-tuning for format, tone, and behavior.

## The methods, in order

### Prefix and adapter tuning

Add a small number of new parameters that get prepended or inserted into each layer. Freeze the original weights. Train only the new ones.

- **Memory footprint:** tiny (typically <1% of the model).
- **Capacity:** modest. Works well for narrow adaptations.
- **When to use:** legacy choice; mostly superseded by LoRA. You'll see it in older literature.

### LoRA (Low-Rank Adaptation)

Factorize the *update* to each weight matrix as a low-rank product: $\Delta W = B A$ where $B$ and $A$ are rank-$r$ matrices (typical $r = 8, 16, 32, 64$). Train only $A$ and $B$; freeze $W$. At inference, either keep them separate or merge $\Delta W$ into $W$ after training.

- **Memory footprint:** ~0.1–1% of the model's parameter count in trainable weights. But you still need the frozen $W$ in VRAM, plus activations for the whole model.
- **Capacity:** enough for most narrow tasks. Surprisingly powerful.
- **Typical training memory:** ~1.5× inference memory. A 7B model LoRA-finetunes on a single 24GB GPU.
- **Data requirement:** hundreds to thousands of examples.
- **Caveat:** the base model is still in VRAM at training time.

<div class="analogy" markdown>
LoRA is a sticky note on each recipe card. The recipe book is unchanged; your additions are small, removable, and cheap to store. You can have a library of sticky-note packs for different kitchens.
</div>

### QLoRA (Quantized LoRA)

LoRA on top of a 4-bit quantized frozen base. The base weights are held in 4-bit, the LoRA adapters are trained in BF16, and the dequantization happens on-the-fly during forward and backward.

- **Memory footprint:** dramatic savings on the base. A 70B model QLoRA-tunes on 2× A100 (80GB) or even a single 80GB card for small batches.
- **Capacity:** similar to LoRA for most tasks. Occasionally a hair worse due to quantization artifacts on the base.
- **Typical training memory:** ~2× inference memory of the 4-bit base.
- **When to use:** whenever LoRA is your tool and you want to fine-tune a bigger base on smaller hardware.

QLoRA is the default for indie/hobby/startup fine-tuning of open-source models. Learn it early.

### Full fine-tuning

All weights are updated. Backward pass computes gradients for everything; optimizer updates everything.

- **Memory footprint:** massive. See [Training vs. inference](training-vs-inference.md) — roughly 5–6× inference memory.
- **Capacity:** maximum.
- **Data requirement:** thousands to millions of examples, depending on how much behavior you're shifting.
- **When to use:** when LoRA has been tried and isn't enough. When you're training at scale and have the compute. When you need capability shifts, not just style shifts.
- **Risk:** catastrophic forgetting. The model can lose capabilities it had before ("I fine-tuned on code and now it's bad at poetry"). Training mixtures should usually include some of the original data.

### Continued pretraining

Same math as full fine-tuning, but with data that looks like pretraining data (large, unlabeled, diverse) rather than task-specific examples. Used to extend a model into a new domain or language.

- **Data requirement:** billions to trillions of tokens.
- **Compute requirement:** enormous.
- **When to use:** you're building a domain-specialized foundation model. Rare outside the large labs and well-funded startups.

## Preference-based fine-tuning: DPO, RLHF, and friends

A separate branch of fine-tuning teaches the model not "copy this output" but "prefer output A over output B." The data is preference pairs: two completions and a human (or AI) judgment of which is better.

- **RLHF (Reinforcement Learning from Human Feedback):** train a reward model on preferences, then use reinforcement learning (PPO typically) to update the policy model toward high-reward outputs. Original technique behind ChatGPT. Powerful but operationally complex and unstable.
- **DPO (Direct Preference Optimization):** a 2023 reformulation that achieves similar results without a separate reward model or RL loop. Training looks much more like standard supervised fine-tuning. Has become the default for open-source alignment work.
- **KTO, IPO, ORPO:** more recent variants, each trading off data requirements, stability, and implementation complexity.

When to use preference-based methods:

- You want the model to prefer certain *styles* of answer (helpful, harmless, concise).
- You have pairwise preference data, not just correct answers.
- You want to tune behavior that isn't easily captured by "one right answer" supervised pairs.

If you're fine-tuning for format ("always return JSON in this schema"), supervised fine-tuning is fine. If you're fine-tuning for helpfulness or tone, preference data and DPO tend to be the better match.

## A practical table

| Method | Trainable params | Base stays frozen? | VRAM (7B) | VRAM (70B) | When to use |
|---|---|---|---|---|---|
| Prompting / RAG | 0 | N/A | — | — | First choice for "the model doesn't know X." |
| Adapters | ~1% | Yes | ~16 GB | ~140 GB | Legacy; prefer LoRA. |
| LoRA | ~0.1–1% | Yes | ~20 GB | ~200 GB | Narrow style/format tasks. |
| QLoRA | ~0.1–1% | Yes (4-bit) | ~8 GB | ~48 GB | Most practical for small teams. |
| Full FT (BF16) | 100% | No | ~120 GB | ~1.2 TB | Large capability shifts, enough compute. |
| DPO | 100% or LoRA | optional | similar | similar | Behavior shaping with preferences. |
| Continued pretraining | 100% | No | ~120 GB | ~1.2 TB | Domain foundation models. Rare. |

(VRAM rows are single-GPU assumptions without sharding; distributed training unlocks larger models — see [distributed training](distributed-training.md).)

## Common mistakes

- **Fine-tuning to add knowledge.** Use RAG. (Said three times in this chapter on purpose.)
- **Too much data, too little curation.** Fine-tune on 500 high-quality examples instead of 50,000 mediocre ones. Quality dominates quantity for narrow tasks.
- **Evaluating with training loss.** Loss goes down smoothly; real capability changes in jumps. Always evaluate on held-out task-specific examples.
- **Forgetting the base changed.** If you LoRA-fine-tune on customer data and then the vendor updates the base model, your adapter may need retraining. Plan for it.
- **Over-engineering the method.** If a LoRA on the default target modules and default rank works, ship it. Hyperparameter obsession here has low returns unless you're at the frontier.

## In one sentence

Match the fine-tuning method to the smallest change that will do the job: prompting before RAG, RAG before LoRA, LoRA before full FT, supervised before preference-based. Every step up costs more and brings more risk; the payoff curve is concave, not linear.

Next: [Quantization deep dive →](quantization.md)

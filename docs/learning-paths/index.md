# Learning Paths — pick your kitchen station

This guide was originally written as a linear tour. But not everyone lands in the same kitchen, and not everyone needs the same tools.

A backend developer wiring an LLM into a support app cares about tokens, context, and cost. A machine-learning engineer fine-tuning a 13B model cares about gradient accumulation and FSDP sharding. A product manager sizing a feature cares about capabilities, failure modes, and dollars per thousand queries. A creative director cares about voice and style drift. An infrastructure engineer cares about whether a single H100 can hold a 70B model at 4-bit and still serve twenty users.

Same kitchen, different stations. This page is the host stand.

<div class="hero" markdown>

**Which path is for you?** Each role below is a reading order through the guide — existing chapters plus new ones written for that audience. Every path includes the **misconceptions** we keep hearing from people in that role, and more importantly, *why* those misconceptions are so natural to land on.

</div>

## The five paths

<div class="numbers" markdown>
<div class="cell"><div class="n">1</div><div class="l">[Software Developer](developer.md) — building with LLM APIs</div></div>
<div class="cell"><div class="n">2</div><div class="l">[ML Engineer](ml-engineer.md) — training, fine-tuning, optimizing</div></div>
<div class="cell"><div class="n">3</div><div class="l">[Product Manager](product-manager.md) — scoping, costing, governing</div></div>
<div class="cell"><div class="n">4</div><div class="l">[Creative Professional](creative.md) — writing, images, voice</div></div>
<div class="cell"><div class="n">5</div><div class="l">[Infrastructure Engineer](infrastructure.md) — GPU clusters &amp; serving</div></div>
</div>

## How the paths are laid out

Each path has the same skeleton so you can skim it before committing:

1. **Who this is for.** A concrete persona — what you're building or deciding.
2. **The goal.** What you'll be able to do or explain by the end.
3. **Prerequisites.** What's assumed. We keep this short on purpose.
4. **The path.** A numbered sequence of chapters, mixing existing guide pages with role-specific new ones. Each step tells you *why* it's here and *what to take away*.
5. **Misconceptions, with origins.** Not a list of "wrong things." Each misconception is paired with *why* it's an easy trap — usually it's a true statement from a neighbouring domain that stops being true when applied to LLMs.
6. **Checkpoints.** Concrete questions you should be able to answer before moving to the next stage.

## Why include misconceptions at all?

Most technical misunderstandings aren't random. They come from applying a correct model from one domain to a new one where a critical detail has changed. "More parameters means smarter" is a reasonable rule of thumb in some contexts and a catastrophically wrong one in others. "We need our own model to own our data" makes sense for databases but usually not for inference APIs.

If we just told you "don't think X," you'd nod and then re-derive X the first time you're under time pressure. So every misconception on every path is annotated with the *true statement* it came from. Once you see the source, the trap stops working.

<div class="analogy" markdown>
A misconception is usually not a stupid thought. It is a smart thought in the wrong kitchen. The cure isn't shame — it's a clearer map of which station you're standing in.
</div>

## Cross-path chapters

Some chapters are important to everyone. If you read nothing else, read these:

- [Part 1 — Why GPUs](../01-why-gpu/index.md) — 15 minutes, the mental model everything else rests on.
- [What is a token?](../03-llm-inference/token.md) — the atomic unit of LLM cost, latency, and capability.
- [The KV cache](../03-llm-inference/kv-cache.md) — the single biggest memory consumer on a serving GPU.
- [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) — the lens that makes most optimization news readable.

Each path will point you back to these at the right moment.

## A word on order

The paths assume you read chapters in the listed order the first time. Nothing stops you from skipping ahead — the chapters are mostly self-contained — but later steps sometimes lean on a vocabulary word introduced earlier. When a path says *"now re-read [attention](../03-llm-inference/attention.md) with this frame in mind,"* it means exactly that: you'll get more out of a familiar chapter on a second pass.

Pick your path:

- [Developer →](developer.md)
- [ML Engineer →](ml-engineer.md)
- [Product Manager →](product-manager.md)
- [Creative Professional →](creative.md)
- [Infrastructure Engineer →](infrastructure.md)

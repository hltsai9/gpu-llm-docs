# Part 7 — Strategy &amp; Product

Parts 1–6 were about what LLMs *do*. Part 7 is about what they're *for*, who decides that, and how to make those decisions without either over-promising or under-using.

<div class="hero" markdown>

Picking the right feature to build, pricing it correctly, scoping it against the model's actual abilities, and planning for its failure modes are skills that outlast any specific model. Most bad AI products failed not because the tech was bad, but because the product thinking around it was vague — a demo that wowed an exec became a spec that ignored costs, safety, and the difference between "usually works" and "reliably works."

</div>

## What's in this part

- [Capability mapping](capability-mapping.md) — what frontier models reliably do, unreliably do, and can't do.
- [Economics of LLM products](economics.md) — per-token pricing, build vs. buy vs. fine-tune, unit economics.
- [Risk and governance](risk-governance.md) — hallucination, prompt injection, privacy, regulation.

## Why this part exists

Product leaders are often asked to ship AI features by people who don't know what they're asking for, and to explain AI limitations to people who don't want to hear them. The vocabulary and structure here are designed for that middle seat — enough mechanism to be credible with engineers, enough business framing to be credible with executives, and enough honesty to prevent the avoidable failures.

## The one sentence to take away

A good LLM product decision has three legs: *can the tech do this reliably*, *can we afford to do it at our traffic*, and *can we accept the failure modes*. If any leg is weak, the feature is a liability regardless of how slick the demo looked.

Start with [Capability mapping →](capability-mapping.md).

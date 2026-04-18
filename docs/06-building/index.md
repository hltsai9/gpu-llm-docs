# Part 6 — Building with LLMs

This part is for developers. It stands apart from Parts 1–3 (what a GPU does) and Parts 4–5 (how models get trained and served) — here we take all of that as given and ask the practical question: *how do you build a production feature on top of an LLM API?*

<div class="hero" markdown>

An LLM API is not a database. It's not a search engine. It's not a deterministic function. It's a stateful-ish generator that can be surprisingly competent, occasionally catastrophic, and always token-metered. Building with it reliably requires a small set of patterns — prompting, retrieval, tool use, and evaluation — that together form the developer's toolkit.

</div>

## What's in this part

- [API basics](api-basics.md) — tokens, context windows, streaming, sampling, error handling.
- [Prompt engineering patterns](prompt-engineering.md) — patterns that actually move the needle.
- [Retrieval-Augmented Generation (RAG)](rag.md) — how to give the model knowledge it doesn't have.
- [Tool use and agents](tool-use-agents.md) — letting the model take actions.
- [Evaluation that works](evals.md) — the difference between a demo and a product.

## Why these five, in this order

Every LLM-based feature sits on top of the first two: API calls and prompts. If prompting is enough, stop there — nothing else is free. When the model needs knowledge it doesn't have, reach for RAG. When the model needs to take actions, reach for tool use. When you want to ship, build evals.

The common failure pattern is going out of order: fine-tuning before prompting, agents before retrieval, production before evals. Each inversion costs 2–10× the engineering time for the same outcome.

## The one sentence to take away

The hard parts of LLM-based software are not the model calls. They are the surrounding discipline: careful prompts, disciplined retrieval, conservative tool wiring, and the evals that tell you when any of those breaks.

Start with [API basics →](api-basics.md).

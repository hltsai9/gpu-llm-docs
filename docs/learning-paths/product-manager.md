# Path 3 — The Product Manager

## Who this is for

You're a PM, a founder, a strategist, or a non-engineering lead in a company that has decided it needs to "use AI." You are not going to write the training script. You are going to decide *what* gets built, *why*, *for whom*, at *what cost*, and *with what guardrails*. The engineering team will do the rest. To do your part well, you need enough fluency to call BS, to estimate, and to write a spec that doesn't ask for a physically impossible product.

## The goal

By the end of this path you will:

- Map any product idea onto "yes the current tech can do this / no it can't / here's the uncertain middle."
- Quote rough cost ranges per query and per user, not just "it depends."
- Make informed buy / build / fine-tune decisions with your team.
- Write AI feature requirements that anticipate hallucination, latency, regulatory, and privacy surface.
- Read model cards and benchmark tables without drowning.

## Prerequisites

Familiarity with ChatGPT or Claude as a user. No coding. An ability to ask "is that a real number or a marketing number" without blushing.

## The path

### Step 1 — Enough mechanics to be dangerous

Skim these to build intuition. You don't need to memorize, you need to know the *shape* of the machine.

1. [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md) — 10 minutes. Why LLMs need GPUs.
2. [What is a token?](../03-llm-inference/token.md) — essential. Tokens are the unit of everything — pricing, latency, context limits, quality.
3. [The life of a token](../03-llm-inference/life-of-a-token.md) — 10 minutes. You'll suddenly understand why streaming exists and why prompts aren't free.

**Takeaway:** Tokens are to LLMs what bytes are to storage. Prices, limits, and feature specs all reduce to tokens.

!!! warning "Misconception checkpoint"

    **"One token is one word."** Truer-sounding cousin: *"Words are the natural unit of language."* For humans, sure. LLMs tokenize before training, and the tokenizer splits common words as one token, uncommon words or numbers as many. "Hello" is one token; "Hsing-Lin" might be four; a long URL can be twenty. Your pricing model needs to assume ~1.3 tokens/word for English, and far more for code, JSON, or non-Latin scripts. Budgets built on word counts are wrong by 30–200%.

### Step 2 — What the current generation can actually do

New chapter: [Capability mapping](../07-strategy/capability-mapping.md). A running field guide: what frontier models are reliably good at, unreliably good at, and not yet good at. Includes concrete examples for common product categories (support, search, summarization, code, agents).

**Takeaway:** The honest map has three zones: Green (reliable), Yellow (works with guardrails and evals), Red (do not ship without humans in the loop). Most failed AI products shipped a Yellow feature as a Green one.

!!! warning "Misconception checkpoint"

    **"If the demo wowed me, the product will work."** Truer-sounding cousin: *"A working prototype de-risks the build."* For typical software, demos predict product viability reasonably well because the easy case and the hard case look similar. For LLM features, the demo is almost always the *best* case — the adversarial, long-tail, multilingual, repetitive, subtly ambiguous inputs are the actual 80% of production traffic, and quality on those can be 30 points worse than the demo. Run evals on representative data before betting on the demo.

### Step 3 — The economics

New chapter: [Economics of LLM products](../07-strategy/economics.md). What you actually pay: per-token pricing, fixed infra for self-hosting, engineering time, eval/ops cost. Worked examples for three product shapes: a customer-support bot, a coding assistant, and an agentic workflow. Build-vs-buy-vs-fine-tune decision framework.

Pair with [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) — you should understand *why* prompt tokens and output tokens have different costs, at the level of "I can explain it at a whiteboard."

**Takeaway:** Unit economics on an LLM feature are *legible* if you decompose them into tokens in, tokens out, and per-query overhead. A lot of "we don't know if this is profitable" is really "we didn't bother to count."

!!! warning "Misconception checkpoint"

    **"We should self-host to save money."** Truer-sounding cousin: *"At enough scale, renting becomes more expensive than owning."* Eventually true for any compute-heavy service, but the *crossover volume* for LLM serving is higher than people expect. Below a few million tokens per day, you will lose money self-hosting once you include a full-time MLOps engineer, GPU headroom for peak, redundancy, and on-call. Don't self-host for savings — self-host for control (data residency, model weights, latency).

!!! warning "Misconception checkpoint"

    **"Self-hosting is the way to protect our data."** Truer-sounding cousin: *"If I hold the data, I control it."* Every major API provider now offers zero-retention enterprise tiers with contractual guarantees that your prompts and outputs are not stored, logged, or used for training. In almost every case, those guarantees are stronger than what you can self-enforce in-house. Self-host when there's a regulatory reason (e.g., air-gapped) or a latency reason, not a vague "privacy is better."

### Step 4 — Risk, safety, and governance

New chapter: [Risk and governance](../07-strategy/risk-governance.md). Hallucination, prompt injection, jailbreaks, bias, copyright, EU AI Act basics, SOC 2 for AI vendors, red-teaming. What to ask your vendor. What to write in your internal AI policy.

**Takeaway:** The biggest product risks aren't "model says something wrong" — they're "model says something wrong and takes irreversible action," or "model's wrong output is served with enough confidence that a user trusts it." Design around reversibility and traceability.

!!! warning "Misconception checkpoint"

    **"Guardrails (content filters) solve safety."** Truer-sounding cousin: *"Input sanitization handles security."* For classical injection attacks, input sanitization goes a long way. For LLMs, guardrails are a shallow layer — they catch common categories, but most shipped-product incidents are about *semantic* failures: confidently-wrong advice, retrieval of the wrong user's data, actions the user didn't actually authorize. Safety budget should go into evals, logging, tight scoping, and human review for high-impact actions — in that order.

### Step 5 — Specifying AI features well

A good AI feature spec includes things most PM specs don't:

- **Scope boundary.** What the model *must not* attempt. "Do not answer questions about X."
- **Refusal behavior.** What the model says when it's uncertain. "If unclear, ask."
- **Eval criteria.** A golden dataset of examples and expected behaviors. (Engineering will help build it.)
- **Acceptable cost and latency envelopes.** P50 and P95 for both.
- **Fallback.** What happens when the model is down, slow, or wrong.
- **Observability.** What gets logged. Who reviews it.
- **Human-in-loop seam.** Where a human can intervene, and how that's surfaced.

Use [Evals](../06-building/evals.md) (from the developer path) as your eval vocabulary.

**Takeaway:** An AI spec is a *legal document for the model's behavior.* Treat ambiguity here the way you'd treat ambiguity in a billing flow.

### Step 6 — How to read model cards and benchmarks

Modern model cards contain: training-data summary, architecture, benchmark scores, evaluation methodology, known limitations, and safety information. Skim the architecture. Read the limitations. *Carefully* read benchmark methodology — "MMLU 88.2" means very different things depending on whether it's 5-shot, 0-shot, or chain-of-thought.

For benchmark tables, the rule is: *the benchmark predicts your product only insofar as your product looks like the benchmark.* MMLU scores predict knowledge-quiz performance. HumanEval predicts coding on short, self-contained problems. Neither predicts *your* customer support bot.

!!! warning "Misconception checkpoint"

    **"Model A beats Model B on benchmark X, so we should use Model A."** Truer-sounding cousin: *"The leaderboard ranks who's best."* Leaderboards rank *benchmark performance*, which is a low-fidelity proxy for your actual task. Two models a percentage point apart on MMLU can be vastly different on your workload. Always run your own evals on representative data before committing — including cost and latency, which rarely appear on public leaderboards.

### Step 7 — Communicating up and across

You will be asked, sometimes in the same meeting, to (a) hype the upside to execs, (b) temper expectations with engineers, and (c) reassure legal. A few phrases to keep in your pocket:

- "This is reliable for X. For Y we need a human-in-loop. For Z we wouldn't ship yet."
- "We can cut cost Z% by switching to a smaller model here, with roughly this quality impact — we'll measure before deciding."
- "Our eval shows P50 latency of X seconds; most users experience it that way. P95 is longer — here's the plan."
- "No, fine-tuning won't fix that; that's a retrieval problem."

The vocabulary from this path is designed to let you make those statements comfortably.

## Misconceptions, consolidated

| Misconception | Where it comes from |
|---|---|
| One word = one token | Human-centric language intuition. |
| Demo = product | True for normal software; false for LLM features. |
| Self-host to save money | Economies of scale — but the crossover is higher than you think. |
| Self-host to protect data | "I hold it, I control it" — outdated against modern enterprise tiers. |
| Guardrails solve safety | Input sanitization analogy — doesn't cover semantic failures. |
| Leaderboards predict product quality | Benchmarks are proxies, not predictions. |
| Fine-tune to add knowledge | Conflating training with knowledge transfer. |
| Agentic = human-free | Hype vs. reality. |

## Checkpoints

Before you call this path done:

1. A team proposes an agent that emails customers automatically. Describe, in order, the three checks you would insist on before ship.
2. Your CFO asks, "Are we losing money on this feature per query?" How do you produce the answer?
3. A vendor claims their model is "20% better than GPT-4." What do you need to know before that number means anything?
4. Your support-bot hallucinated and quoted a non-existent refund policy to a customer. Walk through the post-mortem — root cause, not blame.
5. Give a one-sentence explanation each of: tokens, prefill, KV cache, hallucination, RAG, and fine-tuning. (Practice saying them to your grandmother.)

If you can, you're equipped.

Next path: [Creative Professional →](creative.md) · Back to [all paths](index.md)

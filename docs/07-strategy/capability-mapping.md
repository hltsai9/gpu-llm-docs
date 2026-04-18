# Capability mapping

"Can the current tech do X?" is the most common question asked of product teams working with LLMs, and the one most prone to fuzzy answers. This chapter is a map.

The honest answer is rarely "yes" or "no." It's one of three:

- **Green.** The tech does this reliably. Build it.
- **Yellow.** The tech does this with guardrails, evals, and a human fallback. Scope carefully.
- **Red.** The tech does not yet do this reliably. Wait or ship with humans heavily in the loop.

Most failed AI products shipped a Yellow as a Green.

## The map, as of 2025

The following is a pragmatic read on frontier-model capabilities. Specific numbers move with every model release; categories move more slowly.

### Green: ship it

- **Summarization of known text.** Short summaries, bullet points, executive abstracts. Reliable across the frontier.
- **Text reformatting.** Converting plain text to Markdown, JSON, bullet lists, tables.
- **Translation between major languages.** Near-human quality for the ~50 most resourced language pairs.
- **Tone and style rewrites.** "Make this more formal." "Shorten this to a tweet."
- **Classification from a short list.** Sentiment, category, priority (into buckets you define).
- **Extraction from well-structured text.** Names, dates, entities from emails, contracts, documents.
- **Simple code completion.** Autocompleting idiomatic code in mainstream languages.
- **Conversational UIs with bounded scope.** A chat interface for a specific domain with clear fallback.
- **Instruction-following for well-specified tasks.** "Rewrite this in the style of a New Yorker piece" — consistent.

These are reliable enough that you can put them in front of users today with normal engineering hygiene and expect quality parity across model families.

### Yellow: works with guardrails

- **Answering questions from a retrieved corpus (RAG).** Works well with good retrieval and refusal prompts. Fails visibly without them. See [RAG](../06-building/rag.md).
- **Multi-step reasoning.** Works with chain-of-thought or reasoning models for most "normal" problems; breaks on truly novel ones.
- **Code generation beyond autocompletion.** Write a small function given a spec — usually correct; sometimes subtly wrong. Always review.
- **Creative writing.** Good first drafts; usually needs editing to avoid generic phrasing.
- **Complex customer support with policy compliance.** The model can follow the policy; you need to prove it did. Human QA sampling essential.
- **Agents with narrow scope.** See [agents](../06-building/tool-use-agents.md). Works for specific, bounded workflows; fails for open-ended ones.
- **Rewriting a user's email in their voice.** Works if you feed it examples; still can drift.
- **Tabular reasoning from unstructured input.** "From this PDF, extract the invoice total" — usually works; occasionally misreads.
- **Moderating user content with explicit rules.** Works with a clear policy; tail cases need humans.

Every Yellow feature needs: a clear refusal path, evals to measure drift, and a plan for when things go wrong in production.

### Red: not yet reliable

- **Factual recall on specialized domains.** Medical, legal, regulatory. The model is confident and often wrong. Always require retrieval from authoritative sources, never rely on training-data recall.
- **Agents that take irreversible action autonomously.** Sending payments, emailing external parties, editing customer data without human approval. The error rate isn't low enough; the cost of errors is too high.
- **Long-horizon planning.** Multi-step tasks spanning hours or days. Current agents lose coherence; they're better at sprints than marathons.
- **Math beyond grade-school.** Models with reasoning mode are dramatically better but still miss on non-trivial problems. Use a calculator or code-interpreter tool.
- **Anything requiring perfect reliability.** Medical diagnosis, legal advice, financial trades, physical-world control. Not because the model is always wrong, but because the occasional confident wrong answer has an unacceptable cost.
- **Novel research.** The model recombines; it doesn't reliably invent at the frontier.
- **Adversarial-user defense without engineering.** Prompt injection is an unsolved problem; assume anyone hostile can get around a basic prompt-based defense.
- **Truly personalized long-term memory.** Current "memory" features are retrieval over past conversations, not genuine persistent learning. They help but don't match human memory.

These are either active research areas or structural limits. Building a product that depends on them is betting on something that hasn't shipped yet.

## Domain-specific honest takes

Some categories deserve a closer look, because the averages hide variance.

### Coding

- **Autocompletion, boilerplate, small refactors:** Green.
- **Writing a new function given tests and a spec:** Yellow.
- **Understanding a large unfamiliar codebase:** Yellow with good context tools.
- **Agentic coding (plan + implement + test):** Yellow for well-scoped tasks; Red for open-ended "build this app."
- **Security-critical code:** Red for production without expert review.

### Customer support

- **Tier-1 FAQ with RAG and refusal:** Green.
- **Issue triage and routing:** Green.
- **Policy-sensitive interactions (refunds, cancellations):** Yellow with policy in context and human review.
- **Billing or account actions:** Yellow with explicit human approval for every action.

### Content creation

- **First drafts:** Green.
- **Brand-voice drafts with good examples:** Yellow.
- **Long-form that doesn't sound generic:** Yellow (needs substantial editing).
- **Factual reporting:** Red without human fact-checking.

### Data and analytics

- **Natural-language to SQL:** Yellow. Works for simple schemas; breaks on complex joins. Always preview before executing.
- **Summarizing structured data into narrative:** Green.
- **Detecting anomalies in numeric data:** Red (use real anomaly detection; LLMs are not the right tool).

### Healthcare / legal / finance

- **Drafting tooling (memos, case notes, templates):** Yellow with expert review.
- **Search through internal policies/docs:** Yellow with RAG.
- **Advice to end users:** Red in most jurisdictions and use cases.

## How to calibrate

Public benchmarks help but don't decide. A benchmark predicts performance on your product only insofar as your product looks like the benchmark.

**For each feature you're scoping, build a 50-example eval set (see [evals](../06-building/evals.md))** and run it against 2–3 model candidates. This is more predictive than any leaderboard.

When you're forced to decide before building evals:

- **Read recent model cards.** Not the marketing post — the *limitations* section.
- **Ask engineers how the failure mode shows up.** "What happens when it's wrong?" is more informative than "how often is it right?"
- **Look at similar shipped products.** If a well-funded team tried X and quietly rolled it back, that's signal.

## The velocity question

Capabilities shift every few months. Something Yellow today may be Green in six months. How to plan:

- **Build the product architecture around a Yellow baseline** (guardrails, evals, human fallbacks) so you can relax them as reliability grows. Don't bet the roadmap on "it'll get better."
- **Re-run your evals after each major model release.** Sometimes the score moves 10 points overnight.
- **Keep prompts and tools stable.** The fragile thing is usually not the prompt, it's the model; when the model improves, your existing code often just gets better.

## A working template for feature scoping

For any proposed LLM feature, write one paragraph for each of the following before writing a spec:

- **What color is this on the capability map?** Green / Yellow / Red, with rationale.
- **What's the failure cost?** If it gets 5% of cases wrong, what happens? Reversible? Embarrassing? Legal?
- **What's the per-request economics?** See [economics](economics.md).
- **What guardrails are required?** Refusal, human review, rate limits, structured output.
- **What are the evals?** What does "good enough to ship" look like as a number?

If any of those paragraphs is hand-wavy, the feature isn't ready for engineering.

## Common mistakes

- **Generalizing from one good demo.** The demo is the best case; production traffic is the distribution.
- **Mistaking "fluent" for "correct."** Fluent is free; correct is what needs work.
- **Treating benchmarks as rankings.** They're filters, not predictions.
- **Building on a Red capability and hoping it improves.** Sometimes it does; often not on your timeline.
- **Not revisiting the map after model updates.** A 6-month-old feature spec is stale.

## In one sentence

The capability map has three colors, not two — build on Green, be careful on Yellow, and don't bet a product on Red until reality catches up to the pitch.

Next: [Economics →](economics.md)

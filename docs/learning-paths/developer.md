# Path 1 — The Software Developer

## Who this is for

You can ship code. You've used REST APIs, you know what JSON is, you've debugged a webhook at 2am. Someone has asked you to "add AI" to a product — a support bot, a search box that summarizes, a writing assistant in a form, an agent that files tickets. You don't need to train anything. You need to *build with* LLMs the way you'd build with any other service: call it, handle its failures, pay attention to its costs.

## The goal

By the end of this path you will:

- Understand what a token actually is and why it shows up in every invoice.
- Know when to reach for prompt engineering, when to reach for retrieval, and when to reach for fine-tuning.
- Build a small production-grade feature: function calling, retries, streaming, structured output, and an eval harness.
- Read a model card and make an informed choice between providers.
- Have a mental budget for latency and dollars per request, and know which knobs move them.

## Prerequisites

Any backend language, basic familiarity with HTTP and async, and a text editor. No ML background. No CUDA.

## The path

### Step 1 — Build the right mental model (read before you code)

You don't need to know how a GPU works to *use* an LLM, the same way you don't need to know how Postgres stores indexes to *query* it. But fifteen minutes of background saves you from some very persistent misunderstandings.

1. [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md) — why your laptop isn't where LLMs live.
2. [What is a token?](../03-llm-inference/token.md) — the unit of *everything*. Bills, latency, limits.
3. [The life of a token](../03-llm-inference/life-of-a-token.md) — a minute of reading that will prevent many a bug.

**Takeaway:** An LLM is a next-token predictor served over HTTP. Every parameter on the API maps to something in that process.

!!! warning "Misconception checkpoint"

    **"A longer prompt is a better prompt."** Truer-sounding cousin: *"Providing more context always helps."* In classical search, yes — more query terms usually helps. In LLMs, very long prompts suffer from *position bias* (important facts buried in the middle get ignored) and simply cost more money for every call. The correct generalization is "higher signal-to-noise context helps." A 200-token prompt with the right three facts beats a 20,000-token prompt with everything you could find.

### Step 2 — The API and its knobs

New chapter: [API basics for developers](../06-building/api-basics.md). Covers authentication, models, messages, system vs. user turns, `temperature`, `top_p`, `max_tokens`, streaming, and how to handle rate limits and retries.

Pair with [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) — knowing that your latency is *prefill + N × decode* changes how you design endpoints. Streaming becomes obvious; so does why a 2000-token prompt doesn't cost 2000× a 1-token prompt.

**Takeaway:** You can reason about an LLM call as "fixed prompt processing cost + per-output-token cost." Those two numbers let you back-of-envelope any feature.

!!! warning "Misconception checkpoint"

    **"Setting `temperature=0` makes output deterministic."** Truer-sounding cousin: *"Seeding an RNG with 0 gives you the same output every time."* That's true for an in-process RNG; it's usually not true for a hosted LLM. Most providers make no determinism guarantees even at `temperature=0` — kernel nondeterminism, load balancing across model replicas, and occasional model updates will all change output. Treat temperature=0 as "mostly stable," not "deterministic," and write evals that tolerate surface variation.

### Step 3 — Prompt engineering as a first-class skill

New chapter: [Prompt engineering patterns](../06-building/prompt-engineering.md). Few-shot, chain-of-thought, structured output (JSON mode / schema), role conditioning, reflection. Worked examples you can copy.

**Takeaway:** 80% of "LLM bugs" in production are prompt bugs. A changed delimiter or a missing example can flip behavior. Treat prompts like code: version-control them, diff them, test them.

!!! warning "Misconception checkpoint"

    **"If the model hallucinates, I need a bigger/smarter model."** Truer-sounding cousin: *"If a compiler has a bug, upgrading usually helps."* Hallucination is almost never cured by model size. It's almost always cured by (a) better retrieval so the model *has* the fact in context, (b) explicit instructions to refuse when unsure, or (c) structured output that forces the model to cite sources. Scaling up a model that was guessing will just produce more confidently-worded guesses.

### Step 4 — Give the model facts: Retrieval-Augmented Generation

New chapter: [RAG fundamentals](../06-building/rag.md). Embeddings, chunking, vector databases, reranking, and the common failure modes (bad chunks, stale indexes, missed synonyms). End with a 30-line Python example you can run.

Re-read [The KV cache](../03-llm-inference/kv-cache.md) through a developer lens: retrieved context is consumed by the model at decode time, so doubling context roughly doubles the KV cache memory that the server keeps for *your* request. That is why hosted providers charge more for longer prompts.

**Takeaway:** RAG is how you give an LLM knowledge it doesn't have. It is *not* a substitute for fine-tuning, and fine-tuning is *not* a substitute for it — they fix different problems (see next step).

!!! warning "Misconception checkpoint"

    **"We'll just fine-tune the model on our data."** Truer-sounding cousin: *"To customize a system, modify its source."* Fine-tuning changes the model's *style and behavior*, but is a surprisingly poor way to add *facts* — the model generalizes the surface pattern without reliably learning the content, and keeping the fine-tuned model up-to-date means retraining. For "our product catalog / docs / tickets," RAG is almost always the right answer. Reserve fine-tuning for format and tone.

### Step 5 — Let the model act: tools and agents

New chapter: [Tool use and agent loops](../06-building/tool-use-agents.md). Function calling, validating tool arguments, the think-act-observe loop, budget caps, and when to stop. Covers why "give the model Python" is different from "give the model a set of APIs."

**Takeaway:** An agent is a *loop* that wraps an LLM, not a magic new capability. Every agent bug is either a prompt bug, a tool bug, or a missing stop condition.

!!! warning "Misconception checkpoint"

    **"Agents will automate the whole workflow."** Truer-sounding cousin: *"Automation means replacing humans."* End-to-end agentic automation works only for narrow, reversible, low-stakes tasks. For everything else, the win comes from *assistive* loops — the agent drafts, a human approves. This isn't pessimism about models; it's realism about the cost of bad outputs when the error rate is 2% and the action is irreversible.

### Step 6 — Measure, don't hope: evals

New chapter: [Evaluation that works](../06-building/evals.md). Golden datasets, LLM-as-judge with its caveats, regression testing, tracing with open-source tools, and what to log in production so tomorrow-you can debug today-you.

**Takeaway:** If you don't have evals, you don't have a product — you have a demo. The transition from demo to production is mostly building the eval infrastructure.

!!! warning "Misconception checkpoint"

    **"The demo works, so we're 90% done."** Truer-sounding cousin: *"If it compiles and the happy path passes, most of the work is done."* For classical software, yes. For LLM features, the happy path is usually 10% of the work. Adversarial inputs, refusal behavior, token-budget overruns, cost explosions, prompt-injection-via-retrieved-doc, and silent quality regressions on model updates are all new failure modes that need new tests. Budget more for the last 30% than you normally would.

### Step 7 — Pick a model intelligently

Cross-reference: [Capability mapping](../07-strategy/capability-mapping.md) from the PM path. Read it even if you're a developer — knowing which model class is right for a task (and which bench marks actually predict your workload) is a developer skill now.

### Step 8 — Cost, latency, and the roofline (the short version)

Read [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md) if you haven't. You can skim the math. The one sentence to take away: *inference at batch size 1 is dominated by memory bandwidth, not compute.* That is why streaming token-by-token doesn't feel slower than a big batch, why providers have per-token prices rather than per-FLOP prices, and why the same model gets cheaper over time on the same hardware as servers batch more users together.

## Misconceptions, consolidated

| Misconception | Where it comes from |
|---|---|
| Longer prompts are better prompts. | "More context helps search." True there; not here. |
| `temperature=0` is deterministic. | In-process RNGs *are* deterministic. Hosted LLMs aren't. |
| Bigger model cures hallucination. | Software bugs usually yield to a newer version. Hallucination doesn't. |
| Fine-tune to add facts. | "Customize by modifying source" — a sound instinct that misreads what fine-tuning changes. |
| Agents automate everything. | Classical automation is binary. LLM assistance is a spectrum. |
| Demo = 90% done. | True for typical software. LLM products fail in new places. |
| New model release means rebuild everything. | Web-framework instincts. LLM APIs are more stable than you fear. |

## Checkpoints

Before you call this path done, be able to answer — in one minute each, out loud:

1. A user types a 500-word message and gets a 200-word response. Roughly how many tokens is that? Which part costs more, the prompt or the response? Why?
2. Your chatbot gets slow when conversations go past an hour. Why, *mechanically*, not just "too much context"?
3. A new model drops. Describe how you would decide whether to migrate.
4. You need to return JSON. Name three ways, in order of preference, and say why.
5. Your RAG system started retrieving the wrong chunks last week. List the five most likely causes.

If you can, you're ready to ship.

Next path: [ML Engineer →](ml-engineer.md) · Back to [all paths](index.md)

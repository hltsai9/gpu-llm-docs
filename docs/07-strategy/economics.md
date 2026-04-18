# Economics of LLM products

"It depends" is the correct answer to most "how much does an LLM product cost" questions. This chapter is about decomposing "it depends" into numbers you can actually use.

## The three big cost categories

For any LLM product, cost comes from:

1. **Inference.** Hosted API dollars or self-hosted infrastructure.
2. **Engineering.** Building, maintaining, and evolving the feature.
3. **Ops.** Evals, monitoring, red-teaming, security reviews.

Public writeups tend to focus on #1 because it's easy to quantify. In practice, #2 and #3 often dominate total cost of ownership for the first 12–18 months of a feature.

## Per-request cost, decomposed

For a hosted API, a single request's cost is:

$$
C = p_\text{in} \cdot n_\text{in} + p_\text{out} \cdot n_\text{out}
$$

Where $p_\text{in}$ and $p_\text{out}$ are per-token prices (usually measured in dollars per million tokens), and $n_\text{in}$ and $n_\text{out}$ are input and output token counts.

**Typical ratios:** output prices are 3–5× input prices. This is because output is generated in decode mode, which is memory-bandwidth-bound (see [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md)) — each output token costs the server a full weight-matrix read.

**Key estimation skill:** for any feature spec, estimate $n_\text{in}$ and $n_\text{out}$ (see [API basics](../06-building/api-basics.md) for token estimation). Multiply by prices. You now have a per-request cost.

### Example: customer-support chatbot

- System prompt: 500 tokens.
- User question: 100 tokens.
- Retrieved context (5 chunks × 400 tokens): 2000 tokens.
- Model response: 200 tokens.

Input total: 2600 tokens. Output: 200 tokens.

At a mid-tier price of $3/M input, $15/M output:

$$
C = 3 \cdot \frac{2600}{10^6} + 15 \cdot \frac{200}{10^6} = 0.0078 + 0.003 = \$0.011
$$

Roughly a cent per request. At 100,000 requests/month, that's $1,100/month in API costs.

### Example: agentic task

Agents multiply cost because they make many calls per task.

- 5 tool-use steps × 3000 tokens each in + 200 out = 15,000 input, 1000 output total.

$$
C = 3 \cdot \frac{15000}{10^6} + 15 \cdot \frac{1000}{10^6} = 0.045 + 0.015 = \$0.06
$$

Six cents per task. At 100,000 tasks/month: $6,000/month. Not huge — but a misbehaving agent that loops 20 times instead of 5 is four times that.

### Example: code assistant

Code assistants have high input (user's whole file for context) and moderate output.

- Input: 8000 tokens (file + history).
- Output: 300 tokens.

$$
C = 3 \cdot \frac{8000}{10^6} + 15 \cdot \frac{300}{10^6} = 0.024 + 0.0045 = \$0.029
$$

Three cents per request. At 10 requests/user/day × 1000 DAU × 30 days = 300k requests/month: $8,700/month.

## Pricing model considerations

Three common patterns:

**Per-seat subscription.** Predictable revenue; you absorb variable cost. Works when usage is fairly uniform. Protect against power users with soft limits.

**Usage-based.** Users pay per token or per request (often with their costs as pass-through + margin). Revenue scales with usage. Works for developer-facing products. Can confuse end users.

**Hybrid.** Fixed subscription + usage-based overages. Most common for enterprise sales.

Whichever you pick, have the per-request cost number ready. Otherwise you'll price by vibes and discover you're losing money on power users.

## Self-host vs. API

The eternal question. The correct answer depends on three numbers:

1. **Sustained traffic** (tokens per day).
2. **Model size requirement** (what quality do you need).
3. **Organizational capacity** (can you operate a GPU fleet).

### The crossover math

A single H100 can sustainably serve roughly **5–10M tokens per day** for a 70B-class model with decent batching. Rough all-in cost: **~$3–6 per GPU-hour** (on-demand) or **~$2 per GPU-hour** (committed/reserved).

Daily cost: $50–150 per GPU.

Per million tokens: $5–30 depending on utilization and commitment.

Compare: hosted API at $3 input / $15 output = roughly $10/M tokens for a mixed workload.

**Crossover point:** at roughly **10M+ sustained tokens/day** on a large model, self-hosting becomes cost-competitive — *if* you're running near capacity. Below that, hosted usually wins.

<div class="numbers" markdown>
<div class="cell"><div class="n">~$3-6/hr</div><div class="l">On-demand H100 rental, major clouds</div></div>
<div class="cell"><div class="n">~5-10M</div><div class="l">Tokens/day from one well-tuned H100, 70B model</div></div>
<div class="cell"><div class="n">~30-60%</div><div class="l">Typical duty cycle for an interactive workload</div></div>
<div class="cell"><div class="n">~10M/day</div><div class="l">Rough crossover where self-host beats API on pure $/token</div></div>
</div>

### The hidden self-hosting costs

Pure $/token is not the whole picture. Self-hosting adds:

- **Redundancy.** You need headroom for peak + failover. Add 30–50% to your GPU count.
- **Ops engineering.** At least one person, likely more, on-call for the fleet. Fully-loaded ~$200-400k/year.
- **Dev time for quality parity.** API features (function calling, structured output, latest models) ship with the platform; you re-implement or lag.
- **Model updates.** When a better open-source model comes out, someone has to benchmark, validate, and roll it out.
- **Compliance and observability.** You operate the system, so you own its incidents.

Including those, the effective crossover is higher — often **20–50M tokens/day** before self-hosting is actually cheaper.

### When to self-host anyway

The non-cost reasons:

- **Data residency / air-gapped requirements.** Your data cannot leave your infrastructure. Self-host is mandatory.
- **Latency.** You need sub-100ms TTFT on a model too large for any edge API.
- **Fine-tuned / custom models.** You trained something proprietary; you host it.
- **Specific model unavailable via API.** Open-source models without hosted endpoints.
- **Long-term commitment at steady traffic.** At 3-year horizons with known demand, owning wins.

**When not to self-host:**

- Bursty, unpredictable traffic.
- Small team, no MLOps capacity.
- Experimenting — you don't know yet what model or scale you need.
- "Data privacy" as a handwave. Major API providers offer zero-retention enterprise tiers that satisfy most privacy requirements.

## Build vs. buy vs. fine-tune

A related decision: should you build a custom model, rent a frontier one, or fine-tune a middle option?

| Option | When it wins | When it loses |
|---|---|---|
| **Use a frontier API** | Default for most products. Maximum quality, minimum ops. | Cost sensitivity at scale; data residency issues. |
| **Use a smaller hosted model** | Latency or cost pressure; the task is narrow enough not to need frontier. | Task needs frontier-quality reasoning. |
| **Fine-tune an open-source base** | Style and format customization; narrow vertical task; scale justifies infra. | You hoped fine-tuning would add facts (it doesn't reliably). |
| **Train from scratch** | You're a research lab or you have a very specific moat. | You're not one of those. |

For 95% of product teams, the answer is "frontier API, or frontier API + RAG, or frontier API + narrow fine-tune." Training from scratch is essentially never the right answer for a product team.

## Caching as a cost lever

Three kinds of cache save real money:

- **Exact-match cache.** Same request → same response, don't call the LLM. Works for anything repeatable.
- **Semantic cache.** Similar request → same response, based on embedding similarity. Catches paraphrases; has quality risk (wrong cache hit looks identical to a regression).
- **Prompt cache** (provider-native). Recent providers charge less for re-used prompt prefixes. If your prompts share a long system prompt, this is a big win.

For RAG applications with stable system prompts, provider prompt caching can cut input costs 30–50%. Trivial to enable; underused.

## Margin math

For any LLM feature in front of paying users:

- **Per-user cost** = per-request cost × requests per user per month.
- **Per-user revenue** = price × attach rate (if usage-based) or subscription price (if fixed).
- **Per-user margin** = revenue − cost − amortized engineering.

If margin is negative on any significant user segment, you have a cost problem. Levers:

- Smaller model for that segment.
- Caching.
- Prompt compression (shorter system prompts, tighter retrieval).
- Rate limits (convert power users to explicit overage pricing).
- Reconsider the feature's positioning.

## Common mistakes

- **Estimating cost from word count.** You'll be off by 30–200%. Use token counters.
- **Ignoring output cost.** Output tokens are 3–5× input; a verbose feature is expensive.
- **Self-hosting to save money with the wrong volume.** Below the crossover, you lose money.
- **Self-hosting for "privacy" without a regulatory reason.** Enterprise API tiers are usually sufficient.
- **Pricing features before knowing per-request cost.** Sets up post-launch pricing fires.
- **Not using prompt caching.** Leaves 30–50% input-cost savings on the table.
- **Ignoring prompt compression.** A 50% reduction in system prompt length is a 50% input cost reduction, for most users.

## A working template for unit economics

For any proposed LLM feature, produce:

- Expected $n_\text{in}$ and $n_\text{out}$ per request, with rationale.
- Expected requests per user per period.
- Cost per user per period at 3 price points (frontier, mid-tier, small).
- Expected revenue per user at each model choice.
- Margin at each.
- Sensitivity: what if requests per user doubles? Cost 10×?

A one-page version of this per feature keeps the conversation grounded.

## In one sentence

LLM product economics are legible if you decompose them — input tokens, output tokens, requests per user, and infrastructure choice — and illegible if you try to reason about them without actually counting; the teams that thrive here are the ones that count early and often.

Next: [Risk and governance →](risk-governance.md)

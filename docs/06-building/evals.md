# Evaluation that works

An LLM feature without evals is a demo. The transition from demo to production is, more than anything else, the work of building evals.

This chapter is about doing that well — not about the dozens of benchmark tools you can install, but about the practices that repeatedly turn unreliable features into reliable ones.

## Why classical testing doesn't suffice

Traditional software tests check deterministic outcomes against fixed inputs. LLM features:

- Are not deterministic (even at `temperature=0`, see [API basics](api-basics.md)).
- Don't have a single correct answer for most inputs.
- Drift over time as models update.
- Have failure modes that aren't exceptions (a hallucinated answer is silent).

So "write unit tests" doesn't translate directly. The correct analogy is **integration tests against a flaky external service whose behavior evolves** — plus **quality metrics** more like what search teams use than what typical backend teams do.

## The eval pyramid

Build evals at three levels.

### 1. Unit-style: small, fast, many

Small test cases you can run on every PR:

- Deterministic input → check the output matches a pattern, contains expected substrings, or fits a schema.
- Structured output → validate against the schema, catch regressions in format.
- Tool calls → verify the model picked the right tool with the right arguments.
- Short completion tasks → pick from a few expected answers.

These run fast. They catch 80% of regressions. They are your safety net.

### 2. Golden datasets

A curated set of 50–200 representative inputs with known-good outputs. Run these before any model or prompt change. Measure:

- **Accuracy** (for classification tasks).
- **Answer quality** (manual grading or LLM-as-judge, see below).
- **Cost and latency** per response.
- **Change rate** vs. the previous version.

Keep the dataset up to date. Add cases when you find new failure patterns in production.

### 3. Production samples

Sample real traffic (with privacy care) and grade outputs. This catches the drift between your golden set and reality — edge cases you didn't anticipate. Alerts fire when quality metrics deviate.

## LLM-as-judge

For subjective outputs — summaries, rewrites, Q&A — you often can't grade automatically with simple string matching. The practical compromise is to use another LLM to judge.

Basic shape:

```
You are evaluating an assistant's response. Grade from 1-5.

Criteria:
- Accurate (matches the facts in the source)
- Complete (covers all the main points)
- Clear (easy to read)

Source: {{ source }}
User question: {{ question }}
Assistant's answer: {{ answer }}

Return JSON: {"score": <1-5>, "reasoning": "<one sentence>"}
```

Works surprisingly well — for many tasks, an LLM-judge's correlation with human judgment is comparable to inter-human agreement.

**Caveats:**

- **Position bias.** If you show "A vs B", models tend to prefer A. Randomize order.
- **Verbosity bias.** Models (and LLM judges) tend to prefer longer answers. Control for length in your criteria.
- **Self-preference.** A model may rate its own outputs higher. Use a different model as judge when possible.
- **Rubric ambiguity.** Vague criteria → noisy scores. Be specific in the judge prompt.

**Pattern for a robust judge:**

- Use a strong model (usually frontier-tier) as the judge.
- Randomize everything randomizable.
- Validate the judge itself: run a human review on 50 cases, check the judge's agreement.
- Treat the judge as another piece of versioned prompt infrastructure.

## Rule-based checks

When possible, replace LLM judgment with rules:

- **Format compliance:** Does the output parse as valid JSON? Match the schema?
- **Substring requirements:** Does a customer-support answer mention the ticket ID?
- **Forbidden content:** Does the output avoid listed phrases (competitor names, profanity, internal code names)?
- **Length bounds:** Is the response between 100 and 500 words?
- **Citation accuracy:** Are all bracketed citations present in the retrieved sources?

Rules are fast, deterministic, and free. They should be the first layer of your eval pipeline; LLM-as-judge handles what they can't.

## Golden dataset construction

Building a good golden dataset is half the battle.

**How to start:**

- **From real traffic.** If you have any usage, sample 100 representative queries.
- **From bug reports.** Every production failure goes into the golden set.
- **From imagination.** Brainstorm edge cases: empty inputs, very long inputs, multilingual, adversarial, sarcastic.
- **From a test spec.** For structured features, the acceptance criteria *is* the eval set.

**How to maintain:**

- Versioned. Check into git.
- Audited. Periodically re-review to make sure the "correct answers" haven't drifted.
- Balanced. Cover different input categories proportionally.
- Labeled with metadata: category, difficulty, source.

## Running evals

Minimum pipeline:

- **Pre-commit / pre-deploy hook.** Run the unit-level evals. Fail the build on regression.
- **Nightly or per-PR golden set run.** Run the full 200-case suite, compare to baseline, report deltas.
- **Continuous production sampling.** Grade a small percentage of real traffic; alert on metric changes.

Store eval results over time so you can answer: "Did quality change when we switched to model version X? When we updated the prompt?"

## What to measure

For every LLM feature, have numbers for:

- **Quality.** Accuracy, answer correctness, faithfulness.
- **Safety.** Harmful content rate, refusal rate (unwanted or wanted).
- **Cost.** Tokens per request, dollars per thousand queries.
- **Latency.** P50, P95 TTFT; P50, P95 total time.
- **Reliability.** Error rate, timeout rate, successful completion rate.
- **For RAG:** retrieval recall, faithfulness to sources, citation accuracy.
- **For agents:** task success rate, average steps, cost per successful task.

Publish a one-page dashboard with all of these.

## Tracing and observability

For multi-step flows (RAG, agents, multi-turn chat), unit-level evals aren't enough. You need to see the full trajectory of a request.

- **Log the full trace:** prompt, retrieved docs, each tool call, each model response, final output.
- **Link trace to eval score:** when quality drops, you want the trace, not just the input/output.
- **Open-source options:** Langfuse, Phoenix (Arize), LangSmith, Helicone. Most integrate in 10 lines.
- **Self-hosted:** log to your own Postgres/Elastic with a minimal schema.

## The red-team eval

A final layer: deliberately adversarial cases.

- **Prompt injection attempts.** Can a user make the bot say something harmful or leak the system prompt?
- **Jailbreaks.** Can a user bypass a refusal?
- **Data leakage.** Given a RAG system, can a user from tenant A retrieve tenant B's data?
- **Tool abuse.** Can an agent be manipulated into calling destructive tools?

Maintain a red-team set that grows over time (new adversarial patterns appear monthly). Run it before deploys; measure defense rate.

## Common mistakes

- **Evaluating once and shipping.** Quality drifts when models update. Run regressions continuously.
- **Only measuring on easy cases.** The golden set must include adversarial, long-tail, multilingual. Otherwise your evals lie.
- **Using the same model for generation and judging in high-stakes evals.** Self-preference inflates scores.
- **LLM-as-judge for everything.** Use rules where rules work.
- **No baseline.** "Quality improved!" Compared to what? Always baseline.
- **Measuring only accuracy.** Latency, cost, and failure modes are features too.

## A 90-minute starter

If your LLM feature has zero evals, here's a concrete plan:

- **0–15 min.** Define the 3 quality dimensions that matter (e.g., accuracy, tone, completeness).
- **15–45 min.** Write 50 test cases across easy / medium / adversarial.
- **45–60 min.** Run them and grade manually. This is your baseline.
- **60–75 min.** Write the LLM-judge prompt that agrees with your manual grades.
- **75–90 min.** Wire the eval into CI. Run on every prompt change.

Ninety minutes of this work pays back within the first deployment.

## In one sentence

Evals are the discipline that makes LLM software real software — they are unit tests, integration tests, quality dashboards, and red-team exercises all at once, and building them is most of the work of going from demo to production.

Back to [Part 6 index](index.md).

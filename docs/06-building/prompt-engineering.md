# Prompt engineering patterns

Prompt engineering is not a mystical art. It is *technical writing for a model*, with a small set of patterns that repeatedly move quality from unreliable to reliable. This chapter is those patterns.

We'll skip "10 prompts to 10× productivity" content and focus on the durable techniques.

## The core insight

A prompt is a statement of *what you want*, plus enough *context* for the model to produce it, plus (often) *examples* that show what "it" looks like in practice.

Most prompting failures are failures in one of those three, not in the model:

- **What you want** is underspecified (e.g., "summarize this" — in how many words? what style? what about?).
- **Context is missing** (the model doesn't know your domain's terminology or your company's conventions).
- **Examples are missing or wrong** (you described the output format but didn't show one).

Fix the three, and you've fixed most prompts.

<div class="analogy" markdown>
A prompt is a brief to a freelancer you just hired. They're smart and fast and work cheap, but they don't know your business, your voice, or what "good" looks like here. You don't motivate them; you brief them clearly.
</div>

## Pattern 1 — Specificity

"Summarize this article." is a prompt. "Summarize this article in 3 bullet points, each under 15 words, emphasizing business implications rather than technical details" is a brief.

The second version reliably produces what you want. The first produces whatever the model's average summary looks like — and you will not like the average.

**Rules:**

- Say how long the output should be (words, sentences, bullet points).
- Say the style (formal, casual, technical, emoji-free).
- Say what to emphasize.
- Say what to exclude.

## Pattern 2 — Few-shot examples

When the task is hard to describe but easy to show, show.

```
Classify each review as positive, negative, or neutral.

Review: "Love this product, worked perfectly on day one."
Label: positive

Review: "Broke after a week. Very disappointing."
Label: negative

Review: "It's fine. Nothing special."
Label: neutral

Review: "{{ new_review }}"
Label:
```

Why this works so well:

- The model locks onto the pattern (output format, style, edge cases).
- You demonstrate what to do with ambiguous cases (the "neutral" example).
- You don't need to describe things in words.

**Rules:**

- 2–5 examples is usually enough. More is rarely better.
- Cover the ambiguous cases, not just the obvious ones.
- Make example format identical to the real format you'll use.
- Watch for imbalance: if all three examples are positive, expect positive-biased output.

## Pattern 3 — Chain-of-thought

For multi-step reasoning, asking the model to "think step by step" (or giving it a scratchpad) improves accuracy dramatically, especially on math, logic, and comparison tasks.

```
Question: A shop sells apples at $0.50 each and oranges at $0.75 each.
If Maria bought 6 apples and 4 oranges, how much did she spend?

Think through this step by step, then state the final answer.
```

For modern frontier models, explicit CoT is less necessary — the model does it anyway. But for smaller / older / local models, CoT is often the difference between 60% and 90% accuracy.

**Newer pattern: "extended thinking" / reasoning models.** Some models (o1, Claude's extended thinking, DeepSeek-R1) have CoT built into their inference loop. You don't ask for it — it happens under the hood. Your prompts are shorter, and the model's response includes an implicit reasoning trace.

## Pattern 4 — Role and persona

Giving the model a role often sharpens output:

- "You are a senior legal editor reviewing for clarity."
- "You are a customer support agent. Be concise and solution-oriented."
- "You are a skeptical peer reviewer. Find three flaws."

The role doesn't "unlock" capability — the model could always do this. But it shifts the output distribution toward that register.

**Cautions:**

- Don't overdo it. "You are a world-class elite expert with 30 years of experience and a Nobel prize" adds nothing over "You are a senior X."
- Role conditioning does not reliably *add* capability. A model that can't reason well about constitutional law won't reason well just because you called it a constitutional scholar.
- Role conditioning can *remove* some safety guardrails in ways providers patch over time. Don't rely on "you are an uncensored model" to do anything; it's both unreliable and policy-violating.

## Pattern 5 — Output format constraints

The model will comply with format constraints more readily than style constraints.

```
Return your answer in exactly this format:

SUMMARY: <one sentence>
KEY FACTS:
- <fact 1>
- <fact 2>
CONFIDENCE: <low|medium|high>
```

Why this works:

- The model has seen a billion formatted documents. Structural patterns are natural for it.
- You can parse the output programmatically.
- Downstream code can trust the structure.

For JSON specifically, use the provider's structured output mode if available (see [API basics](api-basics.md)). When it isn't, provide a schema in the prompt and give one example.

## Pattern 6 — Guardrails in the prompt

Inside the system prompt, be explicit about what the model should refuse, when to ask for clarification, and how to handle uncertainty.

```
You are a customer support assistant for Acme Corp.

If a user asks about:
- Refunds: refer them to the refund policy URL and offer to open a ticket.
- Product comparisons with competitors: politely decline; you're Acme's assistant.
- Anything you're unsure about: say "I don't know, let me connect you with a human"
  and set `needs_human: true`.

Never make up policies. If you can't cite a source, say so.
```

**Rules:**

- Whitelist what the model should do, not just blacklist what it shouldn't.
- Give it an out ("I don't know") so it has an alternative to hallucinating.
- Explicit always beats implicit. "Don't make up policies" is stronger than hoping it won't.

## Pattern 7 — Retrieval-aware prompts

When you're doing RAG (see [RAG fundamentals](rag.md)), your prompt has three sections: the task, the retrieved context, and the guardrail against over-trusting that context.

```
Answer the user's question using only the sources below.
If the sources don't contain the answer, say so — do not guess.
Cite each claim with the source number in brackets.

Sources:
[1] {{ retrieved_1 }}
[2] {{ retrieved_2 }}
[3] {{ retrieved_3 }}

Question: {{ user_question }}
```

The "only the sources below" constraint is load-bearing. Without it, the model will happily mix in knowledge from training data, which defeats the point of retrieval (and is hard to audit).

## Pattern 8 — Two-pass: generate, then critique

For quality-sensitive outputs, make two calls: one to generate, one to critique and revise.

```
# Pass 1
Generate a first draft of an email ...

# Pass 2
Here's a draft email. Critique it for:
- Tone (should be warm but professional)
- Clarity
- Length (aim for under 100 words)
- Anything unclear or missing

Draft: {{ pass_1_output }}

Now rewrite incorporating your own critique.
```

Why this works: the model is often better at *recognizing* bad output than at producing polished output in one shot. Separating critique from generation gives it a second chance with a different framing.

Costs 2× tokens. Worth it for quality-sensitive outputs.

## Pattern 9 — Reflection / self-consistency

For tasks with a verifiable answer (math, code, fact-check), sample multiple times at moderate temperature and take the majority answer. Improves reliability significantly, at the cost of more tokens.

```python
answers = [call_llm(prompt, temperature=0.5) for _ in range(5)]
final = majority_vote(answers)
```

Works best when the output is short and discrete (a label, a number, a boolean). Loses value for long, open-ended generation.

## Anti-patterns

- **"Take a deep breath and think carefully."** Vestigial. Newer models ignore it; some actually do worse.
- **"Do not hallucinate."** Doesn't prevent hallucination. Use grounding and refusals instead.
- **"You will be fired if you get this wrong."** Doesn't help. Mildly cringe to put in your production prompt.
- **Massive preambles.** A 2000-word system prompt isn't impressive. It's usually a sign the task isn't clear.
- **Negative examples.** "Don't output X" often puts X in the output's neighborhood anyway. Rewrite as "Output Y instead."

## Prompts as code

Treat prompts like code:

- **Version them.** Check them into git. Diff them.
- **Test them.** See [evals](evals.md). Regression tests catch subtle drift.
- **Template them.** Separate fixed instruction from variable context (user input, retrieved docs).
- **Don't interpolate user input into system prompts.** Keep user input in user turns, where it can't override system-level instructions (see [tool use](tool-use-agents.md) on prompt injection).
- **Log them.** When a production output looks wrong, the first question is "what prompt actually went out?"

## Common mistakes

- **Writing prompts in English prose instead of a brief.** A brief is clearer.
- **Asking the model to do too many things at once.** Multi-step tasks should be multiple calls.
- **Not testing with adversarial inputs.** Empty strings, enormous strings, emoji, non-English, SQL injection attempts. All are real production traffic.
- **Optimizing for one example.** You got a great answer for one case. Now test on 50 — the distribution matters.
- **Re-writing from scratch when only a tweak is needed.** Keep good prompts, iterate surgically.

## In one sentence

Prompts aren't magic spells — they're briefs. Be specific, show examples, define the format, leave an escape hatch for uncertainty, and version them like code.

Next: [Retrieval-Augmented Generation →](rag.md)

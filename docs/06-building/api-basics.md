# API basics for developers

You can ship an LLM-powered feature in an afternoon. You can also spend two weeks debugging one, if you don't know which details matter. This chapter is the minimum a working developer needs: what the parameters mean, how to handle failure, and how to think about cost and latency.

We'll use the "messages" API shape (OpenAI, Anthropic, Google, open-source-compatible servers) because it's become the de facto standard.

## The request

A typical call has a small shape:

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1000,
    temperature=0.7,
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": "What is the capital of France?"},
    ],
)
```

Six knobs, each doing something specific. Know them.

### `model`

The string identifier. Models vary on capability, context length, speed, and price. Defaults change — always pin a specific model version in production.

### `max_tokens`

Upper bound on the *response* length. Not the conversation length. Not the input length. You set this based on "how much should the model be allowed to say back?"

Gotchas:

- **Setting too low truncates.** The response stops mid-sentence.
- **Setting too high is fine.** You're not charged for unused tokens; you're charged for what the model produced.
- **Some providers count differently.** `max_tokens` is output-only on some APIs; on others, it's a total budget including input.

### `temperature`

Controls how "creative" the sampling is. A temperature of 0 (or near-zero) makes the model pick the highest-probability next token each time. Higher temperatures (0.7–1.0) produce more varied output.

- **0.0:** deterministic-ish (see misconception below).
- **0.3–0.5:** common for analytical tasks, code, structured output.
- **0.7:** default for most chat uses.
- **1.0+:** for creative writing, brainstorming.

!!! warning "Temperature 0 is not deterministic"
    Hosted LLMs are served across GPU replicas with kernel non-determinism, batch-dependent numerics, and periodic model updates. "Temperature=0" reliably produces low-variance output, *not* byte-identical output across calls. Your evals should tolerate surface variation; your tests should not check for exact string equality.

### `top_p` and `top_k`

Additional sampling knobs. `top_p=0.9` keeps only the tokens whose cumulative probability hits 90% (nucleus sampling); `top_k=40` keeps the top 40 tokens. Both limit how weird the sampler gets.

**In practice:** leave these at defaults unless you have a specific reason. Temperature covers 95% of what you need.

### `system`

The top-of-conversation instruction. Higher priority than user messages (though not inviolable — see [tool use and agents](tool-use-agents.md) for how prompt injection can still leak through).

**Guidelines:**

- One coherent instruction set. Don't make it a grocery list.
- Specify output format here, not in every user turn.
- Include examples if behavior is subtle.
- Don't put secrets in the system prompt. Users *will* extract them.

### `messages`

Alternating `user` and `assistant` turns. The model sees this as a conversation history — including any assistant turns you put there. That's the mechanism behind few-shot prompting: you fake a prior exchange.

```python
messages=[
    {"role": "user", "content": "Classify: 'I love this.'"},
    {"role": "assistant", "content": "positive"},
    {"role": "user", "content": "Classify: 'Terrible service.'"},
    {"role": "assistant", "content": "negative"},
    {"role": "user", "content": "Classify: 'It was fine.'"},
]
```

The final user turn is the one you actually want answered.

## Streaming

For anything user-facing, stream. Most APIs support server-sent events:

```python
with client.messages.stream(
    model="claude-sonnet-4-6",
    max_tokens=1000,
    messages=[...],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

Why streaming matters:

- **Perceived latency.** A 2-second TTFT followed by streaming feels faster than a 4-second full response, even if the total time is longer.
- **User can abort.** If the model is going sideways, the user can stop reading (and you can close the connection to save cost).
- **It exposes TTFT and TPOT as separate metrics.** See [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md) for why.

Don't stream when:

- The response is parsed and rendered atomically (JSON you're going to `JSON.parse`).
- Non-interactive contexts (background jobs, batch pipelines).

## Tokens: the unit of everything

You will be billed in tokens. Your latency will scale with tokens. Your context limits are in tokens. Learn to estimate.

**Rules of thumb:**

- **English prose:** ~1.3 tokens per word.
- **Code:** ~1.5 tokens per word, more for syntax-heavy languages.
- **JSON:** variable; assume ~2 tokens per word.
- **Non-Latin scripts (Chinese, Japanese, Arabic):** often 2–4 tokens per character.
- **URLs, identifiers, random strings:** can be many tokens each.

For precision, use the model's own tokenizer (`tiktoken` for OpenAI, `anthropic.count_tokens()` for Claude, or Hugging Face `AutoTokenizer` for open models). Never trust word count.

## Cost and latency: how to estimate

Two formulas that cover most real estimations.

**Cost per request:**

$$
C = p_\text{in} \cdot n_\text{in} + p_\text{out} \cdot n_\text{out}
$$

Input and output are priced differently (output is usually 3–5× input, because decode is more expensive per token — see [prefill vs. decode](../03-llm-inference/prefill-vs-decode.md)). A 5000-token prompt and 500-token response on a mid-tier model might cost $0.005 and $0.015 respectively.

**Latency per request:**

$$
L \approx L_\text{prefill} + n_\text{out} \cdot L_\text{decode}
$$

Where $L_\text{prefill}$ is roughly proportional to $n_\text{in}$ (but with a high baseline), and $L_\text{decode}$ is ~30–100ms per token depending on the model. A 500-token output takes ~15–50 seconds at $0.1s$/token.

For feature specs, have both numbers before you commit.

## Error handling

The errors you'll actually see:

- **Rate limits (429).** Exponential backoff. Respect the `retry-after` header.
- **Context length exceeded.** Detect proactively by token-counting inputs before sending.
- **Server errors (500, 503).** Retry with backoff.
- **Content filter / refusal.** Not an error in protocol terms — the model just declines. Handle in the application layer.
- **Truncation (stop_reason = "length").** The model hit `max_tokens` mid-response. Often means you need to increase the limit or split the task.
- **Network timeouts.** Set a reasonable client-side timeout (60s for streaming, less for non-streaming).

A minimal production wrapper:

```python
def call_llm(messages, **kwargs):
    for attempt in range(3):
        try:
            return client.messages.create(
                model=MODEL,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", 1000),
                **kwargs,
            )
        except RateLimitError as e:
            wait = getattr(e, "retry_after", 2 ** attempt)
            time.sleep(wait)
        except (APIConnectionError, APITimeoutError):
            time.sleep(2 ** attempt)
        except APIError as e:
            if 500 <= e.status_code < 600:
                time.sleep(2 ** attempt)
            else:
                raise
    raise RuntimeError("LLM call failed after retries")
```

## Structured output

When you need JSON back, three options, in order of preference:

1. **Native structured output** (OpenAI's JSON mode, Anthropic's JSON schema, Gemini's schema). The provider enforces validity.
2. **Schema in prompt + retry on parse failure.** "Return JSON matching this schema: {…}." Usually works; sometimes doesn't. Have a retry plan.
3. **Function calling / tool use** (see [tool use and agents](tool-use-agents.md)). Structured output dressed up as a tool schema. Same reliability as #1.

If structured output is not working, the fault is almost always (a) schema is too complex, (b) examples in the prompt are inconsistent with the schema, or (c) the model legitimately can't produce it at this temperature. Simplify the schema; add few-shot examples; lower temperature.

## Idempotency and retries

LLM calls are not cheap. Retrying a failed call at random can burn your budget. Two patterns:

- **Cache by request hash.** If the same `messages + parameters` was just asked, don't re-ask.
- **Idempotency keys.** Some providers support them; use them if available.

For user-facing calls, don't auto-retry more than 2–3 times and don't retry if the error suggests the call itself was the problem (content policy, schema error).

## Multiple providers

In production, most serious teams have a fallback. The pattern:

```python
providers = [anthropic_client, openai_client, google_client]
for provider in providers:
    try:
        return provider.call(messages, ...)
    except (RateLimitError, ServerError):
        continue
raise RuntimeError("All providers failed")
```

Provider differences to know:

- **Message shapes are similar but not identical.** Small adapter layer needed.
- **Tokenizers differ.** Your token counts differ between providers for the same text.
- **Context lengths differ.** 200k on Claude, 128k on GPT, 1M on Gemini.
- **Rate limits differ.** A user on one provider isn't rate-limited on the other.
- **Behavior differs subtly.** Same prompt, different output style. Test before swapping.

## Common mistakes

- **Not versioning prompts.** They're code. Check them in.
- **Trusting `temperature=0` for determinism.** It isn't.
- **Assuming 1 token = 1 word.** You'll underpay your budget estimates by 30–200%.
- **Retrying on non-retryable errors.** A content-policy refusal won't go away on retry. A schema violation won't self-correct.
- **Not streaming for interactive features.** Users hate the 4-second wall-clock; they're fine with 10 seconds of streamed output.
- **Logging too much.** Prompts and completions often contain PII. Plan retention and access.

## Debugging checklist

When an LLM-based feature misbehaves, work through this in order:

1. **Log the exact request.** The full `messages`, the full `system`, the parameters. Reproduce the call outside your app.
2. **Inspect token counts.** Is the prompt being truncated? Is the response hitting `max_tokens`?
3. **Test with `temperature=0.3` and a lower temperature.** Is it a sampling variance issue or a systematic bug?
4. **Try a stronger model.** If the behavior disappears, your prompt is ambiguous; tighten it.
5. **Simplify.** Strip the prompt down to the minimum that reproduces the bug, then build back up.
6. **Compare with a peer model** (another provider). If both misbehave, it's your prompt; if only one does, it's a model-specific quirk.

Most "LLM bugs" are prompt bugs in disguise.

## In one sentence

Treat the API as a next-token generator metered in tokens, shape every request around that unit, plan for non-determinism and occasional failure — and when the output isn't what you want, fix the prompt before you blame the model.

Next: [Prompt engineering patterns →](prompt-engineering.md)

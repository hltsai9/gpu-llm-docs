# Quiz — API basics for developers

Six questions on the knobs, failure modes, and cost math of calling an LLM API. Chapter: [API basics](../06-building/api-basics.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> A developer sets <code>temperature=0</code> expecting byte-identical responses across calls. They don't get them. Why?",
      "choices": {
        "A": "API credentials are rotated automatically between calls, causing authentication hash changes that affect determinism downstream",
        "B": "temperature=0 is a misnomer: the backend applies a small hidden random noise to prevent pathological looping behavior",
        "C": "GPU replicas have non-deterministic kernels, batch composition varies, and periodic model updates change behavior",
        "D": "The client tokenizer differs from the server's, causing mismatch in what constitutes \"identical\" byte sequences"
      },
      "explain": "<p>\"Temperature 0\" picks the highest-probability token at each step in principle, but production serving introduces non-determinism you can't see from the outside: batch composition, kernel scheduling, FP reduction order, model version rollouts. Low-variance, yes. Byte-identical, no. Don't write tests that check exact strings.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Why is output pricing typically 3–5× input pricing?",
      "choices": {
        "A": "Output generation incurs copyright licensing fees per token, whereas input licensing is already covered in subscription costs",
        "B": "Decode mode is memory-bandwidth-bound (reads full weight matrices per token); prefill is compute-bound and much cheaper per token",
        "C": "Output tokens are enforced to exceed minimum length by safety constraints, making them intrinsically more expensive to produce",
        "D": "Providers monetize output more aggressively to compensate for free input processing and create revenue incentives"
      },
      "explain": "<p>Per-token cost tracks per-token GPU work. Prefill amortizes a full forward pass over the whole input (cheap per token); decode runs the full weight-matrix read for each new output token (expensive per token). Pricing reflects that asymmetry. See <em>prefill vs. decode</em> in Part 3.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> A front-end feature sends requests with <code>max_tokens=200</code> but the model's responses keep getting cut off mid-sentence. What's the symptom usually?",
      "choices": {
        "A": "Hitting max_tokens ceiling: response stops from budget exhaustion, not completion. Check stop_reason=\"length\";...",
        "B": "Model refused due to content policy violations or safety trigger, blocking completion of the entire response",
        "C": "Client hit rate limits (429 errors), preventing the response from reaching the model for generation",
        "D": "Client/API tokenizer mismatch causes length to be miscalculated, padding added to consume budget"
      },
      "explain": "<p>stop_reason reveals why a response ended. \"end_turn\" = model finished naturally; \"length\" = max_tokens was hit mid-generation. The fix is usually to raise max_tokens (you're only billed for what's actually produced) or to split the task into smaller outputs.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> For a user-facing chat feature, why is streaming the response usually worth the engineering effort?",
      "choices": {
        "A": "Streaming batches decode iterations on the GPU, reducing total wall-clock time on the server",
        "B": "Streaming compresses tokens in transit, reducing total billable tokens compared to non-streamed full response",
        "C": "Streaming makes outputs deterministic by locking random seeds during incremental token emission",
        "D": "Streaming shortens perceived latency (TTFT) and lets users abort early, saving generation cost and avoiding bad answers"
      },
      "explain": "<p>Total time might actually be the same or slightly longer with streaming, but a 2-second TTFT + gradual text feels much faster than a 4-second wall of silence. Users can also stop the stream and the client can close the connection, saving output cost. Stream for any interactive UI.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> \"1 word ≈ 1 token\" is a rule of thumb for English prose. Why is it often wildly wrong for other content?",
      "choices": {
        "A": "Provider tokenizers apply unicode-based length penalties to non-English scripts as a deliberate design choice for cost control",
        "C": "Tokens are always fixed-length 2-byte or 4-byte chunks, ignoring UTF-8 variable-width encoding details",
        "D": "Only English-language training data has received tokenizer optimization by any major provider",
        "B": "English ~1.3 tokens/word; code ~1.5; JSON ~2; Chinese/Japanese/Arabic 2–4 tokens/char — word estimates underestimate cost 30–200%"
      },
      "explain": "<p>Tokenizers are trained on a corpus that was mostly English; non-Latin scripts and specialized content (code, URLs, JSON) get tokenized into more pieces. For precise budget and context estimates, use the provider's actual tokenizer (tiktoken, anthropic.count_tokens, AutoTokenizer) — never trust word count.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Which of these errors is NOT worth automatically retrying?",
      "choices": {
        "A": "429 rate limit with retry-after header telling you when to retry within the backoff window",
        "B": "503 service unavailable from temporary infrastructure degradation or rolling updates",
        "C": "Content-policy refusal or schema validation error — retry won't fix it; the request itself is malformed or violates policy",
        "D": "APIConnectionError or timeout from transient network failures or client-side connectivity issues"
      },
      "explain": "<p>Retryable errors are transient: rate limits, network hiccups, 5xx server errors. Non-retryable errors tell you something about the call itself: a content-policy refusal, a schema violation, a content-length-exceeded. Retrying those wastes budget and doesn't fix the underlying issue.</p>"
    }
  ]
}
</script>

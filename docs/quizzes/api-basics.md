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
        "A": "Their API key is being rotated",
        "B": "temperature=0 always randomizes despite its name",
        "C": "Hosted LLMs are served across GPU replicas with kernel non-determinism, batch-dependent numerics, and periodic model updates — temperature=0 reliably produces low-variance output, not identical output",
        "D": "Temperature=0 is not a valid value"
      },
      "explain": "<p>\"Temperature 0\" picks the highest-probability token at each step in principle, but production serving introduces non-determinism you can't see from the outside: batch composition, kernel scheduling, FP reduction order, model version rollouts. Low-variance, yes. Byte-identical, no. Don't write tests that check exact strings.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Why is output pricing typically 3–5× input pricing?",
      "choices": {
        "A": "Output is copyrighted and input isn't",
        "B": "Output tokens are generated in decode mode (memory-bandwidth-bound — each token reads the full weight matrices), while input tokens run in prefill mode (compute-bound and much cheaper per token)",
        "C": "Output tokens are always longer than input tokens",
        "D": "Providers want to discourage short answers"
      },
      "explain": "<p>Per-token cost tracks per-token GPU work. Prefill amortizes a full forward pass over the whole input (cheap per token); decode runs the full weight-matrix read for each new output token (expensive per token). Pricing reflects that asymmetry. See <em>prefill vs. decode</em> in Part 3.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> A front-end feature sends requests with <code>max_tokens=200</code> but the model's responses keep getting cut off mid-sentence. What's the symptom usually?",
      "choices": {
        "A": "Hitting the max_tokens ceiling — the response stops because it ran out of output budget, not because it finished. Look at stop_reason = \"length\" and raise max_tokens or shorten the task",
        "B": "The model is refusing the task",
        "C": "A rate limit (429)",
        "D": "A tokenizer mismatch"
      },
      "explain": "<p>stop_reason reveals why a response ended. \"end_turn\" = model finished naturally; \"length\" = max_tokens was hit mid-generation. The fix is usually to raise max_tokens (you're only billed for what's actually produced) or to split the task into smaller outputs.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> For a user-facing chat feature, why is streaming the response usually worth the engineering effort?",
      "choices": {
        "A": "Streaming reduces total inference time on the server",
        "B": "Streaming lowers the token count per request",
        "C": "Streaming makes the API deterministic",
        "D": "Streaming shortens <em>perceived</em> latency (TTFT) and lets the user abort early if the answer goes sideways, saving the rest of the generation"
      },
      "explain": "<p>Total time might actually be the same or slightly longer with streaming, but a 2-second TTFT + gradual text feels much faster than a 4-second wall of silence. Users can also stop the stream and the client can close the connection, saving output cost. Stream for any interactive UI.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> \"1 word ≈ 1 token\" is a rule of thumb for English prose. Why is it often wildly wrong for other content?",
      "choices": {
        "A": "Provider tokenizers are deliberately sabotaged on non-English",
        "B": "English prose is ~1.3 tokens/word; code is ~1.5; JSON ~2; Chinese/Japanese/Arabic can be 2–4 tokens per character — so estimates based on word count underestimate cost and context consumption by 30–200%",
        "C": "Tokens are always fixed-length bytes",
        "D": "Only English has tokenizers"
      },
      "explain": "<p>Tokenizers are trained on a corpus that was mostly English; non-Latin scripts and specialized content (code, URLs, JSON) get tokenized into more pieces. For precise budget and context estimates, use the provider's actual tokenizer (tiktoken, anthropic.count_tokens, AutoTokenizer) — never trust word count.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Which of these errors is NOT worth automatically retrying?",
      "choices": {
        "A": "429 rate limit with retry-after",
        "B": "503 server error",
        "C": "Content-policy refusal or schema validation error — retry won't change the outcome; the call itself was the problem",
        "D": "APIConnectionError / timeout"
      },
      "explain": "<p>Retryable errors are transient: rate limits, network hiccups, 5xx server errors. Non-retryable errors tell you something about the call itself: a content-policy refusal, a schema violation, a content-length-exceeded. Retrying those wastes budget and doesn't fix the underlying issue.</p>"
    }
  ]
}
</script>

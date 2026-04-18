# Quiz — Economics of LLM products

Six questions on per-request cost math, self-host crossover, and caching levers. Chapter: [Economics of LLM products](../07-strategy/economics.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> A feature has a 2600-token input and 200-token output per request, on a model priced at $3/M input and $15/M output. What's the rough per-request cost?",
      "choices": {
        "A": "~$0.001",
        "B": "~$0.011 — about a cent",
        "C": "~$0.10",
        "D": "~$1.00"
      },
      "explain": "<p>Cost = 3 × 2600/1M + 15 × 200/1M = $0.0078 + $0.003 ≈ $0.011. Being able to compute this for any feature in 30 seconds is a fundamental economic skill — without it, you'll price by vibes and lose money on power users.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> Why are output tokens typically 3–5× more expensive than input tokens?",
      "choices": {
        "A": "Output tokens are longer on average",
        "B": "Providers are trying to discourage long outputs",
        "C": "Output tokens are generated in decode mode, which is memory-bandwidth-bound — each new token reads the full weight matrices — while input tokens run in prefill mode (compute-bound, much cheaper per token)",
        "D": "Output requires encryption"
      },
      "explain": "<p>Per-token pricing reflects per-token GPU work. Prefill amortizes one forward pass over the whole prompt (cheap per token); decode re-reads the full weights for every output token (expensive per token). This asymmetry is baked into every provider's price sheet.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> A team processes 3M tokens per day and thinks they should self-host. What's the likely honest answer?",
      "choices": {
        "A": "Self-host immediately — volume is clearly sufficient",
        "B": "Self-host only if they use Python",
        "C": "Self-host always saves money",
        "D": "Hosted API is likely cheaper. The pure $/token crossover is roughly 10M tokens/day, and once you count redundancy (30–50% headroom), ops engineering ($200–400k/year/person), dev time for parity, compliance — the effective crossover is more like 20–50M tokens/day"
      },
      "explain": "<p>Self-hosting has real non-token costs: headroom for failover, on-call engineers, keeping pace with new models, re-implementing features (function calling, structured output) that ship with the hosted platform. Below the effective crossover, self-hosting is more expensive <em>and</em> a distraction from product work.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which of these is a legitimate non-cost reason to self-host an LLM?",
      "choices": {
        "A": "Data residency or air-gapped requirements — your data cannot legally leave your infrastructure; self-host is mandatory",
        "B": "A vague sense that \"privacy is better\" when enterprise API tiers with zero retention satisfy the actual regulatory requirement",
        "C": "The hosted API works fine, but self-hosting sounds more technical",
        "D": "Experimenting with new model sizes before knowing the workload"
      },
      "explain": "<p>Hard requirements like HIPAA-covered PHI in certain configurations, FedRAMP, or EU data residency can make self-hosting mandatory. \"Data privacy\" as a handwave usually doesn't survive a real look at enterprise API tiers. Experimental workloads should stay on hosted services until a stable pattern emerges.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A RAG app has a 1500-token system prompt sent on every request. Which caching lever gives the biggest cost reduction?",
      "choices": {
        "A": "Semantic cache based on embedding similarity (quality-risky, catches paraphrases)",
        "B": "A local CDN between app and API",
        "C": "Provider-native <em>prompt cache</em> — paying less for re-used prompt prefixes, which can cut input costs 30–50% on workloads with stable system prompts. Trivial to enable; widely underused",
        "D": "Gzip compression on the HTTP payload"
      },
      "explain": "<p>Prompt caching is a quiet free lunch. Providers charge less (sometimes far less) for re-used prompt prefixes; for any RAG or agent workload with a long stable system prompt, enabling it typically saves 30–50% on input cost with zero quality risk. One of the highest-ROI economic changes a team can make.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> For a feature with tight margins, which lever usually has the largest impact on per-request cost?",
      "choices": {
        "A": "Moving the pod to a different data-center region",
        "B": "Switching to a smaller model for the portion of traffic it can handle, plus tightening retrieval (fewer chunks, shorter system prompt)",
        "C": "Rewriting the app in a faster language",
        "D": "Adding more GPUs"
      },
      "explain": "<p>The biggest cost levers on LLM features are model choice and token volume. A smaller model for easy queries (with frontier routing for hard ones), combined with prompt compression and tighter retrieval, usually cuts cost 50–80% with bounded quality impact. Infra changes are much further down the list.</p>"
    }
  ]
}
</script>

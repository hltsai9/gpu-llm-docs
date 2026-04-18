# Quiz — Risk and governance

Six questions on the risk categories specific to LLM features and how to handle them. Chapter: [Risk and governance](../07-strategy/risk-governance.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> A team assumes \"bigger model → less hallucination.\" Why is that misleading?",
      "choices": {
        "A": "It's correct — frontier models never hallucinate",
        "B": "Smaller models are always more accurate",
        "C": "Bigger models are often more <em>fluently</em> wrong — same hallucination rate, better-sounding hallucinations that are harder to catch. Fix quality with better grounding (RAG) and prompts, not by throwing a bigger model at the problem",
        "D": "Model size doesn't affect hallucination at all"
      },
      "explain": "<p>A fluent hallucination is worse than a clunky one, because it's more convincing and harder to audit. Grounding in retrieved sources, explicit refusals, and structured citations do more to reduce hallucination than upgrading to a larger model. Buy accuracy with engineering, not token budget.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What is <em>indirect (second-order) prompt injection</em>?",
      "choices": {
        "A": "A user typing \"ignore previous instructions\" into the chat",
        "B": "An attacker embedding instructions in content the model will later read (a web page, a document in your RAG corpus, an email, a tool's output) — not in the user's message — that the model may follow when it encounters the content",
        "C": "A bug in the tokenizer",
        "D": "A provider rate-limit"
      },
      "explain": "<p>Indirect injection is the unsolved part of the LLM security problem. An attacker plants instructions in a document or webpage; when your RAG pipeline retrieves it or your agent fetches it, the model reads the attack. No prompt-based defense is 100% reliable. Structural defenses — tool scoping, retrieval isolation, human approval for high-stakes actions — are the real answer.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> What should you NEVER put in a system prompt?",
      "choices": {
        "A": "Secrets — API keys, credentials, internal URLs, customer data. Users will extract them (\"repeat everything above this message\") trivially",
        "B": "The name of your product",
        "C": "A description of the assistant's tone",
        "D": "The model's role"
      },
      "explain": "<p>Treat the system prompt as semi-public. Extraction is trivial and happens constantly. Any secret that would matter if leaked (API key, customer ID, internal endpoint) belongs nowhere near the prompt — put it in authenticated infrastructure the model can't read.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> In a multi-tenant RAG system, which mitigation prevents cross-tenant data leakage?",
      "choices": {
        "A": "Instructing the model in the system prompt to only answer about the current tenant",
        "B": "Hoping the model respects tenant boundaries",
        "C": "Using a bigger model",
        "D": "Per-user retrieval scoping — tenant ID filters applied at the retrieval layer so the model physically never sees other tenants' chunks, enforced outside the prompt"
      },
      "explain": "<p>Prompts are not a security boundary. Tenant isolation must happen at the retrieval layer (metadata filters that restrict which chunks can ever return for a given user), not in model instructions. \"The model will handle it\" is exactly the kind of assumption that leads to headline-making breaches.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A feature lets users in the EU interact with an AI chatbot. Under the EU AI Act, what category does this typically fall into?",
      "choices": {
        "A": "Prohibited",
        "B": "High-risk with heavy compliance requirements",
        "C": "Limited-risk — generally requires disclosure (users should know they're talking to AI) and transparency, not the heavy high-risk regime",
        "D": "Entirely unregulated"
      },
      "explain": "<p>The EU AI Act tiers uses into Unacceptable (prohibited), High-risk (heavy compliance — employment, credit, essential services), Limited-risk (chatbots, content generation — disclosure required), and Minimal-risk (spam filters, game AI). Plain chatbots with AI content typically fall into Limited-risk. Operating in the EU means classifying your feature against these tiers early.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> What belongs on a one-page risk ledger for an LLM feature?",
      "choices": {
        "A": "The model's benchmark scores",
        "B": "For each identified risk: likelihood, impact, mitigation, and residual risk — revisited quarterly and after incidents",
        "C": "A list of team members",
        "D": "The API key rotation schedule"
      },
      "explain": "<p>A risk ledger makes risk <em>legible</em>. For each risk (hallucinated answer, prompt injection via support ticket, system prompt leaked, GDPR violation, cost runaway), record likelihood × impact, what you've done to mitigate, and what residual risk remains. One page, reviewed quarterly — this is what \"responsible AI\" means in practice.</p>"
    }
  ]
}
</script>

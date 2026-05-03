# Quiz — Prompt engineering patterns

Six questions on the durable patterns that turn unreliable outputs into reliable ones. Chapter: [Prompt engineering patterns](../06-building/prompt-engineering.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> A prompt like \"Summarize this article\" produces mediocre output. What's the single biggest lever to improve it?",
      "choices": {
        "A": "Switch to a newer frontier model with larger parameters",
        "B": "Specify the brief: target length, style (formal/casual), what to emphasize, what to exclude",
        "C": "Increase temperature significantly to generate more diverse response variants",
        "D": "Add motivational phrases like \"take a deep breath\" or \"you are an expert\""
      },
      "explain": "<p>Most prompting failures are underspecified briefs. The model defaults to the average summary on the internet because you asked for a summary — specify length, style, audience, emphasis, and it reliably produces what you want. Bigger models don't fix underspecification.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> Few-shot prompting works because:",
      "choices": {
        "A": "It fine-tunes model weights on the examples during the inference call",
        "B": "It reduces the total token count billed because examples are compressed",
        "C": "The model locks onto the demonstrated pattern — format, edge-case...",
        "D": "It makes the model behave as if temperature is effectively zero"
      },
      "explain": "<p>Showing beats describing. 2–5 examples that include the tricky cases (ambiguous inputs, edge cases) are more reliable than paragraphs of instructions. One gotcha: watch for imbalance — if all examples share a label, expect biased output.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> When is explicit chain-of-thought (\"think step by step\") most valuable?",
      "choices": {
        "A": "Every prompt — explicit CoT should always be included",
        "B": "Never — chain-of-thought is an outdated technique no longer supported",
        "C": "Only for image generation and creative synthesis tasks",
        "D": "On multi-step reasoning (math, logic, comparisons), especially..."
      },
      "explain": "<p>CoT gives the model a scratchpad to reason across. Frontier models often do it implicitly already — or have \"extended thinking\" built into their inference loop — so explicit CoT is less critical for them. But for smaller or local models, it's still a big lever on multi-step problems.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which of these is a <em>guardrail</em> pattern in a system prompt?",
      "choices": {
        "A": "\"If sources don't contain the answer, say so—don't guess. For refund...",
        "B": "\"You are a world-class expert with 30 years of specialized experience.\"",
        "C": "\"Do not produce hallucinated content or false information.\"",
        "D": "\"Pause and think carefully before responding to every query.\""
      },
      "explain": "<p>Guardrails whitelist specific allowed behaviors (\"refer to the URL and open a ticket\") and give the model an out (\"say so — do not guess\"). They're concrete and load-bearing. Generic phrases like \"don't hallucinate\" or fake-credentials don't prevent hallucination; they just pad the prompt.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> Why shouldn't you interpolate user input into the system prompt?",
      "choices": {
        "A": "System prompts incur double billing compared to user message input costs",
        "B": "User input in the system prompt can override system-level instructions — a...",
        "C": "System prompts are enforced with a strict 100-token budget limit",
        "D": "Providers retain system prompts in logs longer than user messages for compliance"
      },
      "explain": "<p>System prompts have higher priority than user messages in the model's attention over instructions. But if you paste user input into the system prompt string, that priority protection evaporates — the user's text gets system-level authority. Keep user content in user turns.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Why is a two-pass \"generate, then critique\" workflow often higher-quality than a single-shot prompt?",
      "choices": {
        "A": "Models demonstrate increased effort and motivation during the second attempt",
        "B": "The second API call automatically switches to a stronger underlying model",
        "C": "Models excel at recognizing generic/flawed output more than generating...",
        "D": "Two calls activate prompt caching, which optimizes output quality"
      },
      "explain": "<p>\"Identify five places this draft sounds generic, then rewrite them\" works because critical reading and initial drafting engage different strengths of the model. The cost is 2× tokens, which is worth it for quality-sensitive outputs like marketing copy, emails, and long-form prose.</p>"
    }
  ]
}
</script>

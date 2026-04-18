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
        "A": "Switch to a frontier model",
        "B": "Specify the brief: target length (word count or bullet count), style (formal/casual), what to emphasize, what to exclude",
        "C": "Increase temperature to get more variety",
        "D": "Add \"take a deep breath\" and \"you are an expert\""
      },
      "explain": "<p>Most prompting failures are underspecified briefs. The model defaults to the average summary on the internet because you asked for a summary — specify length, style, audience, emphasis, and it reliably produces what you want. Bigger models don't fix underspecification.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> Few-shot prompting works because:",
      "choices": {
        "A": "It fine-tunes the model on the examples at runtime",
        "B": "It reduces the token cost of each request",
        "C": "The model locks onto the demonstrated pattern — output format, edge-case handling, style — more reliably than it does from verbal description",
        "D": "It makes the model temperature effectively zero"
      },
      "explain": "<p>Showing beats describing. 2–5 examples that include the tricky cases (ambiguous inputs, edge cases) are more reliable than paragraphs of instructions. One gotcha: watch for imbalance — if all examples share a label, expect biased output.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> When is explicit chain-of-thought (\"think step by step\") most valuable?",
      "choices": {
        "A": "Any prompt — always use it",
        "B": "Never — it's deprecated",
        "C": "Only on image generation tasks",
        "D": "On multi-step reasoning (math, logic, comparisons), especially for smaller / older / local models where it can shift accuracy from ~60% to ~90%"
      },
      "explain": "<p>CoT gives the model a scratchpad to reason across. Frontier models often do it implicitly already — or have \"extended thinking\" built into their inference loop — so explicit CoT is less critical for them. But for smaller or local models, it's still a big lever on multi-step problems.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which of these is a <em>guardrail</em> pattern in a system prompt?",
      "choices": {
        "A": "\"If you can't find the answer in the sources, say so — do not guess. If asked about refunds, refer to the refund URL and offer to open a ticket.\"",
        "B": "\"You are a world-class genius expert with 30 years of experience.\"",
        "C": "\"Do not hallucinate.\"",
        "D": "\"Take a deep breath and think carefully.\""
      },
      "explain": "<p>Guardrails whitelist specific allowed behaviors (\"refer to the URL and open a ticket\") and give the model an out (\"say so — do not guess\"). They're concrete and load-bearing. Generic phrases like \"don't hallucinate\" or fake-credentials don't prevent hallucination; they just pad the prompt.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> Why shouldn't you interpolate user input into the system prompt?",
      "choices": {
        "A": "System prompts are billed at double rate",
        "B": "User input in the system prompt can override system-level instructions — a prompt injection vector. Keep user input in user turns, where system instructions still take precedence",
        "C": "System prompts have a 100-token limit",
        "D": "Providers log system prompts longer than user messages"
      },
      "explain": "<p>System prompts have higher priority than user messages in the model's attention over instructions. But if you paste user input into the system prompt string, that priority protection evaporates — the user's text gets system-level authority. Keep user content in user turns.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> Why is a two-pass \"generate, then critique\" workflow often higher-quality than a single-shot prompt?",
      "choices": {
        "A": "The model cares more on the second try",
        "B": "The second call uses a stronger model automatically",
        "C": "Models are often better at <em>recognizing</em> generic or flawed output than at producing polished output in one pass — separating critique from generation gives a second chance with different framing",
        "D": "Two calls trigger caching that produces better output"
      },
      "explain": "<p>\"Identify five places this draft sounds generic, then rewrite them\" works because critical reading and initial drafting engage different strengths of the model. The cost is 2× tokens, which is worth it for quality-sensitive outputs like marketing copy, emails, and long-form prose.</p>"
    }
  ]
}
</script>

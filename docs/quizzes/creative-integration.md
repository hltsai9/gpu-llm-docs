# Quiz — Creative workflow integration

Six questions on real-project workflows for writing, images, and production. Chapter: [Creative integration](../08-creative/creative-integration.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> In the essay/blog workflow described, who (or what) writes the brief and outline?",
      "choices": {
        "A": "The model always writes both",
        "B": "A collaborator writes the brief; the model writes the outline",
        "C": "You — brief and outline are creative work you keep; the model handles brainstorm, bridge paragraphs, and mechanical smoothing",
        "D": "A separate content-generation tool writes both"
      },
      "explain": "<p>The discipline is division of labor: you hold the creative work (claims, voice, specific observations, rhythm), the model handles the mechanical work (brainstorm, context-filling, smoothing). Flip the division and you get generic. The brief and outline are too load-bearing to outsource.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> For marketing copy variants, what's the recommended workflow?",
      "choices": {
        "A": "Write a very clear brief, generate 10–20 variants, cull 70% (they'll be flat), iterate on the 5–10 that have something, hand-polish the final 2–3",
        "B": "Generate one variant and ship it",
        "C": "Ask the model to rate its own output and ship the highest-rated",
        "D": "Copy competitor ads with small changes"
      },
      "explain": "<p>Marketing has format and variants; AI's strengths here are genuine. The workflow is: sample broadly, cull ruthlessly, iterate on the promising, hand-polish the finalists. Expect 70% of initial variants to be flat — that's the distribution working as designed.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> A team does ghostwriting for a CEO. What's the critical practice for matching voice?",
      "choices": {
        "A": "Feed the model 300 words and let it infer the rest",
        "B": "Paste 3,000–5,000 words of the person's actual prior writing, explicitly labeled; draft with the model; <em>edit against how the person actually speaks</em>, not against other AI outputs. Send drafts for approval early and often",
        "C": "Ask the model to imagine how a CEO would write",
        "D": "Let the ghostwriter choose the voice themselves"
      },
      "explain": "<p>Voice drift is particularly expensive in ghostwriting because the CEO can't catch it the way a reader can. Lots of labeled prior writing, editing against the real person's speech, and frequent approval loops are how the output stays theirs instead of quietly becoming AI-average in their name.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> Where should you be most cautious about using AI for research?",
      "choices": {
        "A": "Summarizing 20 articles you've provided",
        "B": "Finding counterarguments to stress-test your claim",
        "C": "Comparing three positions when the source material is in context",
        "D": "Asking factual questions with no sources provided, or asking for specific citations — hallucination risk is high and citations can be fabricated; always verify against real sources (or use retrieval-augmented tools like Perplexity)"
      },
      "explain": "<p>AI is good at processing material you give it; it's bad at retrieving obscure facts from memory and particularly bad at fabricating plausible-looking citations. For anything that needs to be cited, use a retrieval-augmented tool (Perplexity, your own RAG) — and verify the citation still exists and says what the tool claims it says.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> In production image generation (ads, hero images, character art), what's a typical reliable workflow?",
      "choices": {
        "A": "Prompt once and ship the output",
        "B": "Auto-generate thousands and let users vote",
        "C": "Reference-based or ControlNet workflows to constrain composition; hand-composite in Photoshop/Figma; upscale and inpaint artifacts (hands, text, small mistakes); keep seeds and prompts for reproducibility",
        "D": "Use only text prompts, never references"
      },
      "explain": "<p>Unconstrained generation isn't reliable to production precision. The working pattern: constrain structure (reference image or ControlNet), composite pieces in traditional tools for the final, upscale and inpaint to fix artifacts, save seeds + prompts so you can reproduce and adjust when the brief changes.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> A recommended rule of thumb on AI disclosure for creative work:",
      "choices": {
        "A": "Assume you should disclose when AI substantially affected voice-heavy work (bylined pieces, ghostwriting, content sold as your own creative output); assume you don't need to disclose for mechanical work (research assistance, first-pass translation, meeting notes, background reading)",
        "B": "Never disclose — clients don't want to know",
        "C": "Always disclose everything, even spellcheck",
        "D": "Only disclose if the client asks"
      },
      "explain": "<p>Clients are forming opinions on this now; being ahead of the conversation beats being behind it. A reasonable framing: disclose when AI materially shaped creative output where voice or authorship is the product; don't bother for tools that are effectively invisible (dictation, translation drafts, research assistance). When unsure, ask — direct conversation beats post-hoc discovery.</p>"
    }
  ]
}
</script>

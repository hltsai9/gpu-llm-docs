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
        "A": "The model writes both the brief and the outline, then drafts the piece from its own scaffolding",
        "B": "A collaborator writes the brief; the model derives the outline and section headings automatically",
        "C": "You — brief and outline are creative work you keep; the model handles brainstorm and smoothing",
        "D": "A separate content-generation tool writes the brief and outline before any human review starts"
      },
      "explain": "<p>The discipline is division of labor: you hold the creative work (claims, voice, specific observations, rhythm), the model handles the mechanical work (brainstorm, context-filling, smoothing). Flip the division and you get generic. The brief and outline are too load-bearing to outsource.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> For marketing copy variants, what's the recommended workflow?",
      "choices": {
        "A": "Write a clear brief, generate 10–20 variants, cull 70% (flat)",
        "B": "Generate a single variant and ship it to production immediately",
        "C": "Ask the model to rate its own outputs and ship the highest-scored one",
        "D": "Copy competitor ads and make small variations to them"
      },
      "explain": "<p>Marketing has format and variants; AI's strengths here are genuine. The workflow is: sample broadly, cull ruthlessly, iterate on the promising, hand-polish the finalists. Expect 70% of initial variants to be flat — that's the distribution working as designed.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> A team does ghostwriting for a CEO. What's the critical practice for matching voice?",
      "choices": {
        "A": "Feed the model 300 words and trust it to infer the voice",
        "B": "Use 3,000–5,000 words of their actual prior writing,  draft with model",
        "C": "Ask the model to imagine how a CEO would typically write",
        "D": "Let the ghostwriter themselves choose the voice to adopt"
      },
      "explain": "<p>Voice drift is particularly expensive in ghostwriting because the CEO can't catch it the way a reader can. Lots of labeled prior writing, editing against the real person's speech, and frequent approval loops are how the output stays theirs instead of quietly becoming AI-average in their name.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> Where should you be most cautious about using AI for research?",
      "choices": {
        "A": "Summarizing 20 articles you've personally provided as context",
        "B": "Finding counterarguments to stress-test your claims against challenges",
        "C": "Comparing three positions when source material is in the prompt",
        "D": "Asking factual questions with no sources or requesting citations — hallucination"
      },
      "explain": "<p>AI is good at processing material you give it; it's bad at retrieving obscure facts from memory and particularly bad at fabricating plausible-looking citations. For anything that needs to be cited, use a retrieval-augmented tool (Perplexity, your own RAG) — and verify the citation still exists and says what the tool claims it says.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> In production image generation (ads, hero images, character art), what's a typical reliable workflow?",
      "choices": {
        "A": "Prompt once and ship the generated output to production",
        "B": "Auto-generate thousands of candidates and let users vote on favorites",
        "C": "Use references or ControlNet to constrain composition",
        "D": "Use only free-form text prompts, never structural references or ControlNet"
      },
      "explain": "<p>Unconstrained generation isn't reliable to production precision. The working pattern: constrain structure (reference image or ControlNet), composite pieces in traditional tools for the final, upscale and inpaint to fix artifacts, save seeds + prompts so you can reproduce and adjust when the brief changes.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> A recommended rule of thumb on AI disclosure for creative work:",
      "choices": {
        "A": "Disclose when AI substantially affected voice-heavy work (bylined, ghostwriting)",
        "B": "Never disclose to clients because they don't want to know about AI involvement",
        "C": "Always disclose everything, including every AI tool like spellcheck and grammar checkers",
        "D": "Only disclose AI use when a client explicitly asks about your process"
      },
      "explain": "<p>Clients are forming opinions on this now; being ahead of the conversation beats being behind it. A reasonable framing: disclose when AI materially shaped creative output where voice or authorship is the product; don't bother for tools that are effectively invisible (dictation, translation drafts, research assistance). When unsure, ask — direct conversation beats post-hoc discovery.</p>"
    }
  ]
}
</script>

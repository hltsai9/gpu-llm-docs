# Quiz — Style and voice in AI-assisted work

Six questions on resisting the pull toward average when tools make it easy. Chapter: [Style and voice](../08-creative/style-and-voice.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Why do unedited language-model outputs drift toward a recognizable \"AI voice\"?",
      "choices": {
        "A": "A secret style-tuning setting is enabled by default in most deployments",
        "B": "The models learn and hold strong opinions about good writing and style",
        "C": "They predict the most likely next token from a huge corpus",
        "D": "Outputs are post-processed after generation to enforce stylistic consistency"
      },
      "explain": "<p>The model is a probability distribution; the default samples near its mean. Averaging a million photographs of sunsets gives you a blurry orange-pink gradient — that's the default output. Your job is to prompt it toward a <em>specific</em> sunset, not let it give you the gradient.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Which of these is a classic tell of a generic AI-written passage?",
      "choices": {
        "A": "Short sharp sentences with varied rhythm creating a distinctive pace",
        "B": "Stock openers like \"In today's fast-paced world,\" closers like \"multifaceted issue,\"",
        "C": "Specific personal examples and concrete details drawn from lived experience",
        "D": "A skeptical or contrarian tone that challenges conventional wisdom"
      },
      "explain": "<p>These phrases aren't \"wrong\" — they're <em>average</em>. They appear in every other internet article, so the model reaches for them. If your draft matches several of these patterns, you have a genericity problem, and it's the top signal to rewrite toward specifics.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> What's the highest-leverage single thing to include in a prompt when you want the output to sound like <em>you</em>?",
      "choices": {
        "A": "The word \"expert\" in the system prompt to set tone",
        "B": "A list of adjectives like \"casual,\" \"precise,\" and \"witty\" to describe voice",
        "C": "Temperature set to 0.9 to increase randomness and diversity in generation",
        "D": "300–500 words of your actual prior writing, with \"Match this voice in what follows\""
      },
      "explain": "<p>Voice transfer from <em>examples</em> massively outperforms voice transfer from <em>description</em>. The model is very good at pattern-matching; it's poor at interpreting \"write casual but precise.\" Show it your prose and it imitates far better than any style adjective list.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> A useful two-pass technique: first draft, then ask the model to:",
      "choices": {
        "A": "Identify five generic spots with lazy phrasings",
        "B": "Translate the draft to another language and back to English",
        "C": "Double the length by expanding paragraphs and adding detail",
        "D": "Add more adjectives and intensifiers to boost impact"
      },
      "explain": "<p>Models are often better at <em>recognizing</em> generic writing than at avoiding it in one shot. Asking the model to identify lazy phrasings and rewrite them — a self-critique pass — gives you a second chance with different framing. It costs 2× tokens and is worth it for quality-sensitive writing.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What does it mean that AI tools \"amplify\" the person using them?",
      "choices": {
        "A": "They produce polished audio and video versions of your written work without extra editing",
        "B": "They generate higher raw word counts per minute than a human writing unaided at the keyboard",
        "C": "Strong taste accelerates you toward better outputs; weak or unexercised taste accelerates you toward average",
        "D": "They increase your social media reach and the number of followers your work attracts over time"
      },
      "explain": "<p>The tool doesn't add taste; it removes friction. That's a force multiplier in either direction. Writers who've trained an eye for specific detail, rhythm, and surprise use AI well. Writers who haven't — or who let the habit atrophy — find AI polishing off the very edges that made their work theirs.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Which of these is an anti-pattern in AI-assisted writing?",
      "choices": {
        "A": "Reading the draft out loud before publishing to catch rhythm issues",
        "B": "Accepting the first draft because it sounds \"OK\" without further iteration",
        "C": "Keeping a list of your personal AI tells and grep-checking before publish",
        "D": "Printing the piece and reading it on paper to spot errors"
      },
      "explain": "<p>\"OK\" is the uniform of average. A paragraph that's just OK almost never is the best it can be. Iterate — in the prompt or by hand — until a paragraph is either bad (rewrite) or good (has a specific observation, a sharp turn, a distinctive rhythm).</p>"
    }
  ]
}
</script>

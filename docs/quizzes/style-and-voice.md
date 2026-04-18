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
        "A": "A secret style setting is enabled by default",
        "B": "The models hold opinions about good writing",
        "C": "They're trained to predict the most likely next token over a huge corpus — \"most likely\" is a statistical center, so untouched outputs pull toward the median writer on the internet, plus a layer of instruction-tuning politeness",
        "D": "The outputs are post-processed for consistency"
      },
      "explain": "<p>The model is a probability distribution; the default samples near its mean. Averaging a million photographs of sunsets gives you a blurry orange-pink gradient — that's the default output. Your job is to prompt it toward a <em>specific</em> sunset, not let it give you the gradient.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Which of these is a classic tell of a generic AI-written passage?",
      "choices": {
        "A": "Short sharp sentences with varied rhythm",
        "B": "Openers like \"In today's fast-paced world,\" closers like \"Ultimately, X is a multifaceted issue\" or \"striking the right balance,\" and heavy use of three-item parallel lists",
        "C": "Specific examples drawn from personal experience",
        "D": "A skeptical or contrarian tone"
      },
      "explain": "<p>These phrases aren't \"wrong\" — they're <em>average</em>. They appear in every other internet article, so the model reaches for them. If your draft matches several of these patterns, you have a genericity problem, and it's the top signal to rewrite toward specifics.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> What's the highest-leverage single thing to include in a prompt when you want the output to sound like <em>you</em>?",
      "choices": {
        "A": "The word \"expert\" in the system prompt",
        "B": "A list of adjectives describing your voice",
        "C": "Temperature set to 0.9",
        "D": "300–500 words of your actual prior writing, with \"Match this voice in what follows\""
      },
      "explain": "<p>Voice transfer from <em>examples</em> massively outperforms voice transfer from <em>description</em>. The model is very good at pattern-matching; it's poor at interpreting \"write casual but precise.\" Show it your prose and it imitates far better than any style adjective list.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> A useful two-pass technique: first draft, then ask the model to:",
      "choices": {
        "A": "Identify five places the draft sounds generic — specifically, phrasings a lazy writer would use — and rewrite those passages to be more specific, more surprising, and sharper",
        "B": "Translate the draft to another language",
        "C": "Double the length",
        "D": "Add more adjectives"
      },
      "explain": "<p>Models are often better at <em>recognizing</em> generic writing than at avoiding it in one shot. Asking the model to identify lazy phrasings and rewrite them — a self-critique pass — gives you a second chance with different framing. It costs 2× tokens and is worth it for quality-sensitive writing.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What does it mean that AI tools \"amplify\" the person using them?",
      "choices": {
        "A": "They project audio of your work",
        "B": "They generate more words per minute",
        "C": "If you have strong taste and specific preferences, AI accelerates you toward better outputs; if you don't — or if you stop exercising them — AI accelerates you toward average outputs. Taste is the scarce skill",
        "D": "They increase the number of social media followers"
      },
      "explain": "<p>The tool doesn't add taste; it removes friction. That's a force multiplier in either direction. Writers who've trained an eye for specific detail, rhythm, and surprise use AI well. Writers who haven't — or who let the habit atrophy — find AI polishing off the very edges that made their work theirs.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Which of these is an anti-pattern in AI-assisted writing?",
      "choices": {
        "A": "Reading the draft out loud before publishing",
        "B": "Accepting the first draft because it sounds \"OK\"",
        "C": "Keeping a list of your personal AI tells and grep-checking before publish",
        "D": "Printing the piece and reading on paper"
      },
      "explain": "<p>\"OK\" is the uniform of average. A paragraph that's just OK almost never is the best it can be. Iterate — in the prompt or by hand — until a paragraph is either bad (rewrite) or good (has a specific observation, a sharp turn, a distinctive rhythm).</p>"
    }
  ]
}
</script>

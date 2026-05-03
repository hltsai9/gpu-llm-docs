# Quiz — Diffusion basics for creatives

Six questions on how image models work and what the knobs actually do. Chapter: [Diffusion basics](../08-creative/diffusion-basics.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> In one sentence, what does a diffusion model do at generation time?",
      "choices": {
        "A": "Searches a database of existing images for the best prompt match",
        "B": "Predicts pixels sequentially one at a time from left to right",
        "C": "Iteratively denoises random noise, guided by the prompt encoding",
        "D": "Computes the image directly in one forward pass without iteration"
      },
      "explain": "<p>Diffusion trains a network to undo noise one step at a time. Generation is that undoing run repeatedly from pure noise. The prompt's encoded vector guides each step toward images whose representation matches the text. It's a different paradigm from autoregressive LLMs — there's no \"next token,\" only iterative denoising.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What does the <em>seed</em> control in diffusion generation?",
      "choices": {
        "A": "The final image's resolution and output dimensions in pixels per side",
        "B": "The starting block of random noise — same prompt + same seed = same image, different seed = different image",
        "C": "The model's total number of denoising iterations performed per generation",
        "D": "Whether the model executes on GPU hardware or fallback CPU processors"
      },
      "explain": "<p>Seed is determinism in a random process. If you landed a great composition and didn't save the seed, you can't reproduce it — no matter how carefully you reuse the prompt. This is why save-your-seeds is rule #1 of serious image-model workflows.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> An image looks overly saturated, plastic, or \"overcooked.\" What's usually the culprit?",
      "choices": {
        "A": "The prompt is too short or too vague, lacking the stylistic guidance the model needs",
        "B": "The resolution is too low, compressing fine detail and increasing visible compression artifacts",
        "C": "Too few denoising steps, causing incomplete noise removal and a generally noisy result",
        "D": "CFG (classifier-free guidance) is too high — the model is pulled too hard toward the prompt"
      },
      "explain": "<p>CFG controls how strongly the denoise path is pulled toward the prompt. Too low (3–5) = loose, maybe off-prompt. Too high (10+) = plastic, over-saturated, \"trying too hard.\" 7–9 works for most models; experiment within that range.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Writing \"no people\" in the positive prompt often backfires. Why?",
      "choices": {
        "A": "The model sees the token \"people\" and may still generate them — exclusion belongs in the negative prompt parameter",
        "B": "Diffusion models cannot process the word \"no\" or any other negation syntax in their text encoder",
        "C": "The prompt must be entirely in all capital letters for the model to recognize negation in encoding",
        "D": "Only English-language prompts support negation syntax — other languages route through different encoders"
      },
      "explain": "<p>CLIP-style encoders don't reliably handle negation in positive prompts — the semantic presence of \"people\" in the text vector can still pull the image toward people. Use the negative prompt field (a separate parameter) for exclusions. Most tools expose it; use it.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> You love a composition from one generation but want to change the lighting. What's the right workflow?",
      "choices": {
        "A": "Hope you can describe the composition well enough in a fresh prompt and get lucky on a re-roll",
        "B": "Generate many variations with random seeds and carefully pick one whose composition matches",
        "C": "Reuse the same seed with a modified prompt — structure tends to stay similar while attributes shift",
        "D": "Increase CFG to 15 to lock the composition into all subsequent generations from that prompt"
      },
      "explain": "<p>Same seed + different prompt often produces structurally similar images with the prompt-driven attributes changed. It's the canonical technique for fine-tuning a composition you liked. The composition doesn't always survive big prompt changes — but for small edits (\"same scene, golden hour lighting\") it usually does.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> What problem does ControlNet solve that plain prompting doesn't?",
      "choices": {
        "A": "It speeds up generation by reducing the number of denoising iterations needed",
        "B": "It locks in structure (pose, edges, depth, line art) while the prompt controls style and content",
        "C": "It eliminates the need for expensive GPU hardware to run diffusion models",
        "D": "It removes watermarks and licensed content signatures from generated images"
      },
      "explain": "<p>ControlNet (and its cousins) take a structure reference — a pose stick figure, an edge map, a depth map — and force the generated image to match that structure. Prompt controls style; ControlNet locks composition. For reliable art direction (consistent character pose, composition from a sketch), it's transformative.</p>"
    }
  ]
}
</script>

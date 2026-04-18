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
        "A": "Searches a database of images for the best match to the prompt",
        "B": "Predicts the next pixel one at a time from left to right",
        "C": "Iteratively denoises a starting block of random noise — at each step predicting what noise to remove, guided by the prompt encoding — until a clean image remains (typically 20–50 steps)",
        "D": "Computes the image directly in a single forward pass"
      },
      "explain": "<p>Diffusion trains a network to undo noise one step at a time. Generation is that undoing run repeatedly from pure noise. The prompt's encoded vector guides each step toward images whose representation matches the text. It's a different paradigm from autoregressive LLMs — there's no \"next token,\" only iterative denoising.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What does the <em>seed</em> control in diffusion generation?",
      "choices": {
        "A": "The final image's resolution",
        "B": "The starting block of random noise — same prompt + same seed = same image; same prompt + different seed = different image, same style",
        "C": "The model's total number of denoising steps",
        "D": "Whether the model uses GPU or CPU"
      },
      "explain": "<p>Seed is determinism in a random process. If you landed a great composition and didn't save the seed, you can't reproduce it — no matter how carefully you reuse the prompt. This is why save-your-seeds is rule #1 of serious image-model workflows.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> An image looks overly saturated, plastic, or \"overcooked.\" What's usually the culprit?",
      "choices": {
        "A": "The prompt is too short",
        "B": "The resolution is too low",
        "C": "Not enough denoising steps",
        "D": "CFG (classifier-free guidance) is too high — the model is being pulled too hard toward the prompt, sacrificing naturalness. 7–9 is a common sweet spot; 10+ often overcooks"
      },
      "explain": "<p>CFG controls how strongly the denoise path is pulled toward the prompt. Too low (3–5) = loose, maybe off-prompt. Too high (10+) = plastic, over-saturated, \"trying too hard.\" 7–9 works for most models; experiment within that range.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Writing \"no people\" in the positive prompt often backfires. Why?",
      "choices": {
        "A": "The model sees the token \"people\" and may generate people anyway — exclusion belongs in a separate <em>negative prompt</em> parameter, which the model is trained to avoid",
        "B": "Diffusion models cannot process the word \"no\"",
        "C": "The prompt must be in all caps",
        "D": "Only English works for negations"
      },
      "explain": "<p>CLIP-style encoders don't reliably handle negation in positive prompts — the semantic presence of \"people\" in the text vector can still pull the image toward people. Use the negative prompt field (a separate parameter) for exclusions. Most tools expose it; use it.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> You love a composition from one generation but want to change the lighting. What's the right workflow?",
      "choices": {
        "A": "Hope you can describe the composition well enough in a new prompt",
        "B": "Generate many variations and pick one that matches",
        "C": "Reuse the same seed with a modified prompt — structure tends to stay similar while the changed words shift specific attributes like lighting or style",
        "D": "Increase CFG to 15"
      },
      "explain": "<p>Same seed + different prompt often produces structurally similar images with the prompt-driven attributes changed. It's the canonical technique for fine-tuning a composition you liked. The composition doesn't always survive big prompt changes — but for small edits (\"same scene, golden hour lighting\") it usually does.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> What problem does ControlNet solve that plain prompting doesn't?",
      "choices": {
        "A": "It makes generation faster",
        "B": "It lets you specify structure (pose, edges, depth, line art) as an input the model must obey — so the output matches a chosen composition while the prompt controls style and content",
        "C": "It eliminates the need for a GPU",
        "D": "It removes watermarks from images"
      },
      "explain": "<p>ControlNet (and its cousins) take a structure reference — a pose stick figure, an edge map, a depth map — and force the generated image to match that structure. Prompt controls style; ControlNet locks composition. For reliable art direction (consistent character pose, composition from a sketch), it's transformative.</p>"
    }
  ]
}
</script>

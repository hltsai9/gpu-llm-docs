# Quiz — The fine-tuning spectrum

Six questions on picking the right tool on the prompting → LoRA → full-FT spectrum. Chapter: [The fine-tuning spectrum](../04-training/fine-tuning-spectrum.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> A user wants their assistant to know the current product catalog. Which approach is most likely to work well?",
      "choices": {
        "A": "Full fine-tune on the entire product catalog dataset directly",
        "B": "Retrieval-augmented generation (RAG) pulling catalog data at query time",
        "C": "LoRA training on the PDF to make facts stick in weights",
        "D": "Craft longer, more detailed prompts to teach the model"
      },
      "explain": "<p>Fine-tuning teaches <em>style</em>, not facts. Models trained on factual text learn to sound like they know, not to actually know — increasing hallucination. RAG keeps facts in context where they stay fresh and auditable. This is rule #1 of fine-tuning in 2025: don't fine-tune for knowledge.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What's the main memory advantage of QLoRA over standard LoRA?",
      "choices": {
        "A": "Trainable LoRA parameters shrink to 1/10 the size of standard LoRA",
        "B": "QLoRA avoids computing or storing gradients in memory at all",
        "C": "Base model stored in 4-bit; static weights use 4× less VRAM than BF16",
        "D": "QLoRA executes on CPU, never touching the GPU at any time"
      },
      "explain": "<p>QLoRA quantizes the base to 4-bit (stored statically, dequantized on-the-fly for compute) while training the LoRA adapters in BF16. That's what lets a 70B model fit on a single 80GB GPU — a feat impossible with standard LoRA's BF16 base.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> In LoRA, what is the rank <em>r</em>?",
      "choices": {
        "A": "Inner dimension of small matrices B and A whose product makes ΔW",
        "B": "Total number of GPUs required to run this training job",
        "C": "How many transformer layers get LoRA adapters applied to them",
        "D": "Per-layer learning-rate scaling factor applied to adapter gradients"
      },
      "explain": "<p>LoRA factorizes the weight update as ΔW = B·A, where B and A are rank-r matrices (typical r = 8, 16, 32, 64). The rank sets how expressive the update can be; higher r = more capacity but more trainable parameters. For most narrow tasks, r=16 or 32 is plenty.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> When is <em>full</em> fine-tuning (updating all weights) most clearly the right choice over LoRA?",
      "choices": {
        "A": "Whenever the output quality from LoRA falls short of the target",
        "B": "When you can only access a single consumer-grade GPU for training",
        "C": "When your training dataset consists of just a few hundred labeled examples",
        "D": "Need large capability shift, have substantial dataset, and compute budget exists"
      },
      "explain": "<p>Full FT costs 5–6× more memory than LoRA and risks catastrophic forgetting. It's the right tool only when LoRA has been tried and demonstrably isn't enough — and you have both the data and the compute to justify it.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> What does DPO (Direct Preference Optimization) train on that supervised fine-tuning does not?",
      "choices": {
        "A": "Unannotated raw text corpus from the web without any labels",
        "B": "Paired completions with preference ratings (output A better than B)",
        "C": "Image-caption pairs teaching multimodal alignment goals",
        "D": "Gradient magnitudes sampled during base model pretraining"
      },
      "explain": "<p>DPO uses <em>pairwise preference</em> data. You give it two completions and say which is better. It became the default for open-source alignment in 2024 because it gets RLHF-like results without a separate reward model or RL loop — much simpler to train.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> A team has 50,000 mediocre training examples and 500 carefully curated ones. For a narrow task, which typically produces a better fine-tune?",
      "choices": {
        "A": "50,000 mediocre examples win because scale always dominates in LLM training",
        "B": "500 curated ones typically win — data quality beats quantity on narrow tasks",
        "C": "Performance is statistically identical either way in real-world settings",
        "D": "The outcome hinges entirely on choice of learning rate schedule"
      },
      "explain": "<p>For narrow supervised fine-tuning, the shape of good data is far more valuable than volume. 500 high-signal examples will usually outperform 50,000 noisy ones, which can actively push the model toward the wrong distribution. This is why data curation is most of the work.</p>"
    }
  ]
}
</script>

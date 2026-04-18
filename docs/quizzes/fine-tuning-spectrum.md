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
        "A": "Full fine-tune on the product catalog",
        "B": "Retrieval-augmented generation (RAG) that pulls catalog data at query time",
        "C": "LoRA on the catalog PDF",
        "D": "Prompt-engineer the model harder"
      },
      "explain": "<p>Fine-tuning teaches <em>style</em>, not facts. Models trained on factual text learn to sound like they know, not to actually know — increasing hallucination. RAG keeps facts in context where they stay fresh and auditable. This is rule #1 of fine-tuning in 2025: don't fine-tune for knowledge.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What's the main memory advantage of QLoRA over standard LoRA?",
      "choices": {
        "A": "Trainable parameters become 10× smaller",
        "B": "QLoRA eliminates the need for gradients entirely",
        "C": "The frozen base model is held in 4-bit precision, dramatically cutting VRAM for the static weights",
        "D": "QLoRA runs only on CPU, avoiding GPUs altogether"
      },
      "explain": "<p>QLoRA quantizes the base to 4-bit (stored statically, dequantized on-the-fly for compute) while training the LoRA adapters in BF16. That's what lets a 70B model fit on a single 80GB GPU — a feat impossible with standard LoRA's BF16 base.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> In LoRA, what is the rank <em>r</em>?",
      "choices": {
        "A": "The inner dimension of the two small matrices B and A whose product forms ΔW",
        "B": "The number of GPUs needed for the training run",
        "C": "The number of layers being adapted",
        "D": "A learning-rate multiplier for the adapters"
      },
      "explain": "<p>LoRA factorizes the weight update as ΔW = B·A, where B and A are rank-r matrices (typical r = 8, 16, 32, 64). The rank sets how expressive the update can be; higher r = more capacity but more trainable parameters. For most narrow tasks, r=16 or 32 is plenty.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> When is <em>full</em> fine-tuning (updating all weights) most clearly the right choice over LoRA?",
      "choices": {
        "A": "Whenever you want better quality than LoRA gave you",
        "B": "When you're on a single consumer GPU",
        "C": "When you only have a few hundred examples",
        "D": "When you need a substantial capability shift (not just style), have a large dataset, and can afford the compute"
      },
      "explain": "<p>Full FT costs 5–6× more memory than LoRA and risks catastrophic forgetting. It's the right tool only when LoRA has been tried and demonstrably isn't enough — and you have both the data and the compute to justify it.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> What does DPO (Direct Preference Optimization) train on that supervised fine-tuning does not?",
      "choices": {
        "A": "Raw text documents (unlabeled)",
        "B": "Pairs of completions with a preference label (A is better than B)",
        "C": "Images aligned to captions",
        "D": "Gradient norms from the base model's original training"
      },
      "explain": "<p>DPO uses <em>pairwise preference</em> data. You give it two completions and say which is better. It became the default for open-source alignment in 2024 because it gets RLHF-like results without a separate reward model or RL loop — much simpler to train.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> A team has 50,000 mediocre training examples and 500 carefully curated ones. For a narrow task, which typically produces a better fine-tune?",
      "choices": {
        "A": "The 50,000 mediocre examples — more data always wins",
        "B": "The 500 curated ones — quality dominates quantity for narrow tasks",
        "C": "Both give identical results in practice",
        "D": "It depends only on the learning rate"
      },
      "explain": "<p>For narrow supervised fine-tuning, the shape of good data is far more valuable than volume. 500 high-signal examples will usually outperform 50,000 noisy ones, which can actively push the model toward the wrong distribution. This is why data curation is most of the work.</p>"
    }
  ]
}
</script>

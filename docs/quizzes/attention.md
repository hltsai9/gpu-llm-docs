# Quiz — Attention, explained slowly

Six questions on Q/K/V, softmax, and FlashAttention. Chapter: [Attention, explained slowly](../03-llm-inference/attention.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "A",
      "stem": "<strong>Q1.</strong> Which vector represents \"what is this token looking for?\"",
      "choices": {
        "A": "Query (Q), which represents the \"what am I searching for\" vector",
        "B": "Key (K), which represents \"what each token in the sequence is\" for matching",
        "C": "Value (V), which represents \"what information each token carries\" in content",
        "D": "Embedding, which is the raw representation of the input token"
      },
      "explain": "<p>Q is the \"what am I searching for\" vector. K is \"what I represent\" — used to match against queries. V is \"what information I carry\" — mixed into the output based on attention weights.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> For a sequence of length L, what shape is the attention score matrix (QKᵀ)?",
      "choices": {
        "A": "L × d representing sequence length by embedding dimension",
        "B": "d × d representing embedding dimension by embedding dimension",
        "C": "L × L (sequence length by sequence length)",
        "D": "1 × L representing a single row for each query position"
      },
      "explain": "<p>Every token is scored against every other token: L × L entries. That's the origin of attention's quadratic cost in sequence length.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> In attention's cost, what is quadratic in sequence length L?",
      "choices": {
        "A": "The number of tokens generated during decoding for all users",
        "B": "The attention score matrix (QKᵀ) and the weighted-V operation — both scale as L²",
        "C": "The number of GPUs required to parallelize the computation",
        "D": "The model depth or number of transformer layers stacked"
      },
      "explain": "<p>The QKᵀ matrix is L × L, and multiplying the L × L weight matrix by V does L × L × d work. That's why 128K-context inference is so much harder than 4K-context inference.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does the causal mask enforce during generation?",
      "choices": {
        "A": "That every attention head attends to only one specific other head within each layer",
        "B": "That attention weights are completely symmetric and equal across all token pairs",
        "C": "That only the first token in the sequence is utilized for all position predictions",
        "D": "That token i cannot attend to any future token j where j > i, masking the score before softmax"
      },
      "explain": "<p>Language models are autoregressive. At generation time, future tokens don't exist yet; at training time, attending to them would leak the answer. The mask zeroes out future-position scores before softmax.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> What does FlashAttention change?",
      "choices": {
        "A": "The memory layout — it never materializes the full L × L score matrix in HBM, keeping scratch data on-chip. The math is unchanged.",
        "B": "It replaces the mathematically exact softmax with a cheaper approximation that trades off precision",
        "C": "It removes half of the total attention heads to dramatically reduce computation",
        "D": "It introduces new learnable parameters and weights to the attention mechanism"
      },
      "explain": "<p>FlashAttention is a smarter kernel, not a new algorithm. It tiles the computation so the score matrix stays in shared memory and registers — trading a little redundant compute for a large reduction in HBM traffic.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why do transformers use multiple attention <em>heads</em>?",
      "choices": {
        "A": "To double the total parameter count at no additional computational cost",
        "B": "So different heads can specialize in different kinds of relationships (syntactic, coreference, numerical, etc.)",
        "C": "Because a single attention head is too large to fit in GPU memory",
        "D": "To randomize the attention weight distributions for robustness"
      },
      "explain": "<p>Multi-head attention splits the hidden dim across heads; each head has its own Q/K/V projections. Heads learn to attend to different aspects in parallel — different \"lenses\" on the same input at the same total FLOP cost.</p>"
    }
  ]
}
</script>

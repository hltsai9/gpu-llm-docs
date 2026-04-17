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
        "A": "Query (Q)",
        "B": "Key (K)",
        "C": "Value (V)",
        "D": "Embedding"
      },
      "explain": "<p>Q is the \"what am I searching for\" vector. K is \"what I represent\" — used to match against queries. V is \"what information I carry\" — mixed into the output based on attention weights.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> For a sequence of length L, what shape is the attention score matrix (QKᵀ)?",
      "choices": {
        "A": "L × d",
        "B": "d × d",
        "C": "L × L",
        "D": "1 × L"
      },
      "explain": "<p>Every token is scored against every other token: L × L entries. That's the origin of attention's quadratic cost in sequence length.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> In attention's cost, what is quadratic in sequence length L?",
      "choices": {
        "A": "The number of tokens generated",
        "B": "The attention score matrix (QKᵀ) and the weighted-V operation — both scale as L²",
        "C": "The number of GPUs required",
        "D": "The model depth"
      },
      "explain": "<p>The QKᵀ matrix is L × L, and multiplying the L × L weight matrix by V does L × L × d work. That's why 128K-context inference is so much harder than 4K-context inference.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What does the causal mask enforce during generation?",
      "choices": {
        "A": "That each head attends to only one other head",
        "B": "That attention is symmetric across tokens",
        "C": "That only the first token is used",
        "D": "That token i cannot attend to future tokens j > i"
      },
      "explain": "<p>Language models are autoregressive. At generation time, future tokens don't exist yet; at training time, attending to them would leak the answer. The mask zeroes out future-position scores before softmax.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q5.</strong> What does FlashAttention change?",
      "choices": {
        "A": "The memory layout — it never materializes the full L × L score matrix in HBM, keeping scratch data on-chip. The math is unchanged.",
        "B": "It replaces softmax with a cheaper approximation",
        "C": "It prunes half of the attention heads",
        "D": "It adds new learnable parameters"
      },
      "explain": "<p>FlashAttention is a smarter kernel, not a new algorithm. It tiles the computation so the score matrix stays in shared memory and registers — trading a little redundant compute for a large reduction in HBM traffic.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why do transformers use multiple attention <em>heads</em>?",
      "choices": {
        "A": "To double the parameter count at no extra cost",
        "B": "So different heads can specialize in different kinds of relationships (syntactic, coreference, numerical, etc.)",
        "C": "Because a single head doesn't fit on one GPU",
        "D": "To randomize the attention scores"
      },
      "explain": "<p>Multi-head attention splits the hidden dim across heads; each head has its own Q/K/V projections. Heads learn to attend to different aspects in parallel — different \"lenses\" on the same input at the same total FLOP cost.</p>"
    }
  ]
}
</script>

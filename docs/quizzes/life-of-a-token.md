# Quiz — The life of a token

Six questions on the end-to-end flow. Chapter: [The life of a token](../03-llm-inference/life-of-a-token.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> What does tokenization convert text into?",
      "choices": {
        "A": "Floating-point vectors directly",
        "B": "Raw bytes passed straight to the GPU",
        "C": "A list of integer IDs that index into a vocabulary table",
        "D": "One token per word, always"
      },
      "explain": "<p>Tokenization produces integer IDs (~50K–200K possible values). Those IDs are looked up in an embedding table at the next step to become vectors.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Where does a token's embedding vector come from?",
      "choices": {
        "A": "It's generated freshly each time from a small neural network",
        "B": "Looked up by integer ID from the model's embedding table (one row per vocab entry)",
        "C": "It's computed from the token's Unicode bytes",
        "D": "From the attention layer"
      },
      "explain": "<p>The embedding is a learned lookup table: token ID → 4,096-dim (or similar) vector. This one matrix multiply maps discrete tokens to continuous space for the rest of the model.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> A transformer layer typically consists of…",
      "choices": {
        "A": "Just a single matrix multiplication",
        "B": "Attention only",
        "C": "Feedforward only",
        "D": "Layer norm → attention → residual → layer norm → feedforward → residual"
      },
      "explain": "<p>Each layer: normalize, attend, add the attention output to the input (residual), normalize again, run the feedforward MLP, add again. Stack 32–96 of these, depending on the model.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> What does the LM head do at the end of the stack?",
      "choices": {
        "A": "Projects the last token's vector into a probability distribution over the full vocabulary",
        "B": "Re-tokenizes the output",
        "C": "Computes attention across layers",
        "D": "Decides which GPU to run on"
      },
      "explain": "<p>The LM head is a big linear projection from hidden dim (~4,096) to vocab size (~50,000+), followed by a sampling strategy (greedy, top-k, top-p, temperature…) to pick the next token.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> What is autoregression?",
      "choices": {
        "A": "The model's self-evaluation step after generation",
        "B": "Generating one token at a time, appending it to the sequence, and feeding the extended sequence back in",
        "C": "A regularization technique during training",
        "D": "Running multiple models and voting"
      },
      "explain": "<p>Autoregressive generation: token t conditions on tokens 1…t-1. Each new token is one forward pass that sees everything before it — which is why streaming token-by-token output feels \"alive.\"</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> For a 70B-parameter model at FP16, producing one token per user means moving about how much data per second per user at ~100 tokens/sec?",
      "choices": {
        "A": "A few MB/s",
        "B": "A few hundred MB/s",
        "C": "Around 14 TB/s (100 forward passes × ~140 GB of weights)",
        "D": "Nothing — the weights stay in the GPU registers"
      },
      "explain": "<p>Each forward pass pulls ~140 GB of weights from HBM. 100 tokens/sec × 140 GB = ~14 TB/s. That's 4–5 full H100s' worth of HBM bandwidth per user — which is why batching is mandatory.</p>"
    }
  ]
}
</script>

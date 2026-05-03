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
        "A": "Floating-point vectors immediately using the embedding lookup table",
        "B": "Raw bytes that are passed straight to the GPU without any processing",
        "C": "A list of integer IDs that index into a vocabulary table",
        "D": "One token per word, always, regardless of subword splits"
      },
      "explain": "<p>Tokenization produces integer IDs (~50K–200K possible values). Those IDs are looked up in an embedding table at the next step to become vectors.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Where does a token's embedding vector come from?",
      "choices": {
        "A": "It's generated freshly each time from a small neural network in the embedding layer",
        "B": "Looked up by integer ID from the model's embedding table (one row per vocab entry)",
        "C": "It's computed on-the-fly from the token's Unicode bytes using a hash function",
        "D": "It's derived from the attention mechanism based on context vectors"
      },
      "explain": "<p>The embedding is a learned lookup table: token ID → 4,096-dim (or similar) vector. This one matrix multiply maps discrete tokens to continuous space for the rest of the model.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> A transformer layer typically consists of…",
      "choices": {
        "A": "Just a single matrix multiplication from embedding to output",
        "B": "An attention mechanism applied to all token positions in parallel",
        "C": "A feedforward MLP applied independently to each token",
        "D": "Layer norm → attention → residual → layer norm → feedforward → residual"
      },
      "explain": "<p>Each layer: normalize, attend, add the attention output to the input (residual), normalize again, run the feedforward MLP, add again. Stack 32–96 of these, depending on the model.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> What does the LM head do at the end of the stack?",
      "choices": {
        "A": "Projects the last token's vector into a probability distribution over the full vocabulary",
        "B": "Re-tokenizes the model's output back into text using the tokenizer",
        "C": "Computes attention across multiple transformer layers to aggregate information",
        "D": "Decides which GPU to run on and routes computation accordingly"
      },
      "explain": "<p>The LM head is a big linear projection from hidden dim (~4,096) to vocab size (~50,000+), followed by a sampling strategy (greedy, top-k, top-p, temperature…) to pick the next token.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> What is autoregression?",
      "choices": {
        "A": "The model's built-in evaluation step that measures generation quality after sampling",
        "B": "Generating one token at a time, appending it to the sequence, and feeding the extended sequence back in",
        "C": "A regularization technique applied during training to prevent overfitting the model",
        "D": "Running multiple models in ensemble and voting on the most likely next token"
      },
      "explain": "<p>Autoregressive generation: token t conditions on tokens 1…t-1. Each new token is one forward pass that sees everything before it — which is why streaming token-by-token output feels \"alive.\"</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> For a 70B-parameter model at FP16, producing one token per user means moving about how much data per second per user at ~100 tokens/sec?",
      "choices": {
        "A": "A few megabytes per second on average across all users",
        "B": "A few hundred megabytes per second, same as a single GPU forward pass",
        "C": "Around 14 TB/s (100 forward passes × ~140 GB of weights)",
        "D": "Essentially nothing because the weights are cached in GPU registers permanently"
      },
      "explain": "<p>Each forward pass pulls ~140 GB of weights from HBM. 100 tokens/sec × 140 GB = ~14 TB/s. That's 4–5 full H100s' worth of HBM bandwidth per user — which is why batching is mandatory.</p>"
    }
  ]
}
</script>

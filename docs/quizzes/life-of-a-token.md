# Quiz — The life of a token

Six questions on the end-to-end flow. Chapter: [The life of a token](../03-llm-inference/life-of-a-token.md).

<div class="quiz">

<div class="q" data-answer="C">
<p class="stem"><strong>Q1.</strong> What does tokenization convert text into?</p>
<button data-choice="A">Floating-point vectors directly</button>
<button data-choice="B">Raw bytes passed straight to the GPU</button>
<button data-choice="C">A list of integer IDs that index into a vocabulary table</button>
<button data-choice="D">One token per word, always</button>
<div class="explain"><p>Tokenization produces integer IDs (~50K–200K possible values). Those IDs are looked up in an embedding table at the next step to become vectors.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q2.</strong> Where does a token's embedding vector come from?</p>
<button data-choice="A">It's generated freshly each time from a small neural network</button>
<button data-choice="B">Looked up by integer ID from the model's embedding table (one row per vocab entry)</button>
<button data-choice="C">It's computed from the token's Unicode bytes</button>
<button data-choice="D">From the attention layer</button>
<div class="explain"><p>The embedding is a learned lookup table: token ID → 4,096-dim (or similar) vector. This one matrix multiply maps discrete tokens to continuous space for the rest of the model.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q3.</strong> A transformer layer typically consists of…</p>
<button data-choice="A">Just a single matrix multiplication</button>
<button data-choice="B">Attention only</button>
<button data-choice="C">Feedforward only</button>
<button data-choice="D">Layer norm → attention → residual → layer norm → feedforward → residual</button>
<div class="explain"><p>Each layer: normalize, attend, add the attention output to the input (residual), normalize again, run the feedforward MLP, add again. Stack 32–96 of these, depending on the model.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q4.</strong> What does the LM head do at the end of the stack?</p>
<button data-choice="A">Projects the last token's vector into a probability distribution over the full vocabulary</button>
<button data-choice="B">Re-tokenizes the output</button>
<button data-choice="C">Computes attention across layers</button>
<button data-choice="D">Decides which GPU to run on</button>
<div class="explain"><p>The LM head is a big linear projection from hidden dim (~4,096) to vocab size (~50,000+), followed by a sampling strategy (greedy, top-k, top-p, temperature…) to pick the next token.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> What is autoregression?</p>
<button data-choice="A">The model's self-evaluation step after generation</button>
<button data-choice="B">Generating one token at a time, appending it to the sequence, and feeding the extended sequence back in</button>
<button data-choice="C">A regularization technique during training</button>
<button data-choice="D">Running multiple models and voting</button>
<div class="explain"><p>Autoregressive generation: token t conditions on tokens 1…t-1. Each new token is one forward pass that sees everything before it — which is why streaming token-by-token output feels "alive."</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q6.</strong> For a 70B-parameter model at FP16, producing one token per user means moving about how much data per second per user at ~100 tokens/sec?</p>
<button data-choice="A">A few MB/s</button>
<button data-choice="B">A few hundred MB/s</button>
<button data-choice="C">Around 14 TB/s (100 forward passes × ~140 GB of weights)</button>
<button data-choice="D">Nothing — the weights stay in the GPU registers</button>
<div class="explain"><p>Each forward pass pulls ~140 GB of weights from HBM. 100 tokens/sec × 140 GB = ~14 TB/s. That's 4–5 full H100s' worth of HBM bandwidth per user — which is why batching is mandatory.</p></div>
</div>

</div>

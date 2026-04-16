# Quiz — Batching many diners at once

Six questions on amortization and continuous batching. Chapter: [Batching many diners at once](../03-llm-inference/batching.md).

<div class="quiz">

<div class="q" data-answer="A">
<p class="stem"><strong>Q1.</strong> What does batching <em>amortize</em> during decode?</p>
<button data-choice="A">The HBM read of each layer's weights — the same weights serve every sequence in the batch in one pass</button>
<button data-choice="B">The CUDA kernel launch overhead</button>
<button data-choice="C">The softmax calculation</button>
<button data-choice="D">Nothing — each request is independent</button>
<div class="explain"><p>Weights are read from HBM once per step, regardless of batch size. Running that one weight-read against 64 sequences produces 64× more useful work — arithmetic intensity jumps proportionally.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> What's the key difference between static and continuous batching?</p>
<button data-choice="A">Static batching is faster per token</button>
<button data-choice="B">Continuous batching has no batch size</button>
<button data-choice="C">Static batches requests together until the slowest finishes; continuous batching (iteration-level) adds and drops sequences between decode steps</button>
<button data-choice="D">Only static batching uses the GPU</button>
<div class="explain"><p>Static batching is the tour bus — you wait for the latest passenger. Continuous batching is a rideshare van — passengers get on and off along the route, so the GPU is always nearly full.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q3.</strong> What sets the practical ceiling on how big the decode batch can be?</p>
<button data-choice="A">CUDA's thread-block limit</button>
<button data-choice="B">The length of the prompt</button>
<button data-choice="C">The model's parameter count alone</button>
<button data-choice="D">KV cache memory — each concurrent sequence needs its own cache in HBM</button>
<div class="explain"><p>Weights are shared across the batch, but KV cache is per-sequence. Total HBM divided by per-sequence KV cache sets how many conversations you can keep alive at once.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q4.</strong> Does batching help <em>prefill</em> the same way it helps decode?</p>
<button data-choice="A">Yes — identical benefit</button>
<button data-choice="B">Less so — a single large prefill already saturates tensor cores (compute-bound), so adding more prefills doesn't speed things up further</button>
<button data-choice="C">No, batching hurts prefill</button>
<button data-choice="D">Prefill doesn't use HBM</button>
<div class="explain"><p>Prefill is already compute-bound at ordinary sizes. Batching many short prefills together helps, but once one prefill fills the chip, more don't make it faster — they queue.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q5.</strong> Continuous batching batches at which granularity?</p>
<button data-choice="A">Per token (iteration) — each decode step is a fresh batch of whatever sequences happen to be active</button>
<button data-choice="B">Per day</button>
<button data-choice="C">Per epoch</button>
<button data-choice="D">Per model</button>
<div class="explain"><p>Token-level / iteration-level batching: on every decode step, the scheduler rebuilds the batch from active requests. Sequences finish and leave immediately; new ones join as soon as prefill completes.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q6.</strong> As batch size grows, what starts to dominate HBM traffic (eventually replacing weights)?</p>
<button data-choice="A">The embedding table</button>
<button data-choice="B">The model's bias vectors</button>
<button data-choice="C">The KV cache reads — they scale linearly with batch size, while weight reads stay constant</button>
<button data-choice="D">The warp scheduler</button>
<div class="explain"><p>Weights: 1× per step no matter the batch. KV cache: N× for a batch of N. Eventually KV cache traffic exceeds weight traffic and becomes the new bottleneck — which is why shrinking the KV cache is so important.</p></div>
</div>

</div>

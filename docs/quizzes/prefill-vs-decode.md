# Quiz — Prefill vs. decode

Six questions on the two-phase split. Chapter: [Prefill vs. decode](../03-llm-inference/prefill-vs-decode.md).

<div class="quiz">

<div class="q" data-answer="A">
<p class="stem"><strong>Q1.</strong> Which phase is compute-bound?</p>
<button data-choice="A">Prefill — all prompt tokens flow through the model in parallel, with high arithmetic intensity</button>
<button data-choice="B">Decode — one token at a time</button>
<button data-choice="C">Both, equally</button>
<button data-choice="D">Neither — they're both memory-bound</button>
<div class="explain"><p>Prefill processes thousands of tokens in one pass, so weights are heavily reused across those tokens. The tensor cores are the bottleneck there. Decode, by contrast, does minimal work per HBM byte moved.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> What does TTFT stand for — and what does it mostly depend on?</p>
<button data-choice="A">Tokens-To-Free-Time; depends on the GPU cooler</button>
<button data-choice="B">Total Transformer Float Tally; independent of prompt length</button>
<button data-choice="C">Time-To-First-Token; dominated by prefill and grows with prompt length</button>
<button data-choice="D">Transformer Tensor-Format Timing; a precision setting</button>
<div class="explain"><p>TTFT = time to first token. Since the first token requires a full prefill pass over the whole prompt, TTFT scales roughly linearly with prompt length.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q3.</strong> Why is decode memory-bound even though per-token arithmetic is small?</p>
<button data-choice="A">Because decode uses CUDA cores instead of tensor cores</button>
<button data-choice="B">Because each step still reads the entire set of weights and KV cache from HBM for a tiny amount of work on one token's activations</button>
<button data-choice="C">Because decode writes to disk</button>
<button data-choice="D">Because causal masks slow things down</button>
<div class="explain"><p>The weights don't get smaller just because only one token is being processed. 140 GB of weights still have to stream from HBM for each decode step — huge memory traffic per token produced.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q4.</strong> Which H200 feature helps <em>decode</em> throughput more than prefill?</p>
<button data-choice="A">Larger, faster HBM — more bandwidth for the memory-bound phase</button>
<button data-choice="B">More tensor cores</button>
<button data-choice="C">Higher clock speed</button>
<button data-choice="D">A different instruction set</button>
<div class="explain"><p>Prefill is compute-bound, so extra FLOPs help. Decode is bandwidth-bound, so extra HBM bandwidth translates almost 1:1 into tokens/sec.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q5.</strong> What's the value of disaggregated serving (separating prefill and decode onto different GPUs)?</p>
<button data-choice="A">It makes prompts shorter</button>
<button data-choice="B">It reduces the parameter count</button>
<button data-choice="C">It's the same as batching</button>
<button data-choice="D">The two phases have opposite bottlenecks, so dedicating one pool of GPUs to each stops a single machine from juggling both jobs badly</button>
<div class="explain"><p>A prefill pool runs compute-saturating kernels at high arithmetic intensity. A decode pool runs bandwidth-saturating kernels with large batches. Mixing them on one GPU means neither is fully utilized.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q6.</strong> What problem does "chunked prefill" solve?</p>
<button data-choice="A">Quantization numerical errors</button>
<button data-choice="B">KV cache fragmentation</button>
<button data-choice="C">A very long prefill otherwise blocking ongoing decode steps for other users on the same GPU</button>
<button data-choice="D">Warp divergence</button>
<div class="explain"><p>Splitting a long prompt into 256/512-token chunks lets the scheduler interleave those chunks with decode steps from other requests, so a giant prompt doesn't freeze everyone else.</p></div>
</div>

</div>

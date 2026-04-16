# Quiz — The KV cache

Seven questions on the notebook that makes streaming feasible. Chapter: [The KV cache](../03-llm-inference/kv-cache.md).

<div class="quiz">

<div class="q" data-answer="C">
<p class="stem"><strong>Q1.</strong> Why do we cache K and V but not Q?</p>
<button data-choice="A">Q takes too much memory</button>
<button data-choice="B">Q is also cached</button>
<button data-choice="C">K and V for past tokens don't change from step to step; the new token's Q is used against the cached history</button>
<button data-choice="D">Q is stored in the CPU</button>
<div class="explain"><p>Token 3's K and V in layer 17 are identical when generating token 100 as they were when generating token 4 — so we compute them once and keep them. The <em>new</em> token's Q is what we actually need each step.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q2.</strong> Without a KV cache, how does the cost of generating token t grow?</p>
<button data-choice="A">Roughly linearly (or worse) with t — you'd be recomputing all prior K/V every step</button>
<button data-choice="B">Constant regardless of t</button>
<button data-choice="C">Only depends on batch size</button>
<button data-choice="D">Sublinearly — caches aren't needed</button>
<div class="explain"><p>Each new token would require re-running the full prefix through the model. By token 2,000, you'd repeat 2,000× the work. The cache converts this into roughly constant work per new token (plus the growing attention cost).</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q3.</strong> Approximately how much KV cache does a 70B parameter model (Llama-2-70B-ish, no GQA) use per token at FP16?</p>
<button data-choice="A">~25 KB</button>
<button data-choice="B">~2.5 MB</button>
<button data-choice="C">~2.5 GB</button>
<button data-choice="D">~25 MB</button>
<div class="explain"><p>~2.5 MB per token. At 32K context that's ~82 GB — more than an H100's entire HBM. It's why KV-cache optimization is the central memory problem of LLM serving.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> What does Grouped-Query Attention (GQA) do?</p>
<button data-choice="A">Runs attention across grouped GPUs</button>
<button data-choice="B">Doubles the number of attention heads</button>
<button data-choice="C">Replaces softmax with a grouped operation</button>
<button data-choice="D">Lets groups of Q-heads share one K/V pair, shrinking the KV cache</button>
<div class="explain"><p>Llama-2 70B has 64 Q-heads and 8 KV-heads — an 8× KV cache reduction at tiny quality cost. GQA is standard in modern open models because KV cache size is so critical.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q5.</strong> What's the main benefit of a paged KV cache (vLLM-style)?</p>
<button data-choice="A">Reduces memory fragmentation and enables sharing pages between sequences that have common prefixes</button>
<button data-choice="B">Makes attention numerically more accurate</button>
<button data-choice="C">Speeds up tensor cores</button>
<button data-choice="D">Eliminates the KV cache altogether</button>
<div class="explain"><p>Paging is borrowed from OS virtual memory. Fixed-size pages let the server pack more sequences per GPU and let multiple sequences point at the same pages for shared prefixes (e.g., identical system prompts).</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q6.</strong> During decoding, each new token's forward pass must read…</p>
<button data-choice="A">Only the new token's activations</button>
<button data-choice="B">Only the embedding table</button>
<button data-choice="C">All weight matrices <em>and</em> the full KV cache up to now</button>
<button data-choice="D">Only the LM head</button>
<div class="explain"><p>Weights: every layer's matmul reads the full weight tensor. KV cache: attention against prior tokens reads the entire cache. That's why decode is memory-bound — lots of HBM reads, tiny arithmetic per byte.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q7.</strong> Quantizing the KV cache from FP16 to INT8 primarily helps by…</p>
<button data-choice="A">Reducing accuracy to make training faster</button>
<button data-choice="B">Halving the bytes read per decode step — which directly speeds up memory-bound decode</button>
<button data-choice="C">Allowing more attention heads</button>
<button data-choice="D">Disabling the causal mask</button>
<div class="explain"><p>Same idea as weight quantization: every byte saved is a byte the HBM doesn't have to move. Decode throughput scales inversely with KV cache bytes.</p></div>
</div>

</div>

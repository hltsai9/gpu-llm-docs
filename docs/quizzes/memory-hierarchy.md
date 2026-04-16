# Quiz — The memory hierarchy

Seven questions on the storage pyramid and arithmetic intensity. Chapter: [The memory hierarchy](../02-gpu-architecture/memory-hierarchy.md).

<div class="quiz">

<div class="q" data-answer="A">
<p class="stem"><strong>Q1.</strong> Which storage level is closest to the arithmetic units — fastest, smallest?</p>
<button data-choice="A">Registers</button>
<button data-choice="B">Shared memory</button>
<button data-choice="C">L2 cache</button>
<button data-choice="D">HBM</button>
<div class="explain"><p>Registers are "in the cook's hand" — 1-cycle access, but only ~256 KB per SM and split across all active threads. Shared memory is the next step out.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> What does "coalesced" memory access mean?</p>
<button data-choice="A">Loads that use compression to save bandwidth</button>
<button data-choice="B">Loads that bypass the cache</button>
<button data-choice="C">The 32 threads of a warp load 32 contiguous bytes, so the hardware satisfies them in one wide transaction</button>
<button data-choice="D">Loads that span multiple GPUs at once</button>
<div class="explain"><p>HBM rewards wide contiguous transactions. If a warp's 32 threads request 32 adjacent bytes, one transaction serves everyone. If they jump to random addresses, you pay the latency 32 times and throughput collapses.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q3.</strong> What's the approximate "break-even" arithmetic intensity on an H100 (BF16) — ops per byte needed to saturate tensor cores from HBM alone?</p>
<button data-choice="A">~5 ops/byte</button>
<button data-choice="B">~295 ops/byte</button>
<button data-choice="C">~10,000 ops/byte</button>
<button data-choice="D">There's no crossover — compute is always the ceiling</button>
<div class="explain"><p>~989 TFLOPs of BF16 compute divided by ~3.35 TB/s of HBM bandwidth ≈ 295 ops/byte. Below that, you're memory-bound; above, compute-bound.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> Why does quantization (e.g., FP16 → FP8) usually speed up decode?</p>
<button data-choice="A">Because the tensor cores run faster at lower voltages</button>
<button data-choice="B">Because it reduces the number of FLOPs needed</button>
<button data-choice="C">Because it unlocks more CUDA cores</button>
<button data-choice="D">Because each HBM read moves half as many bytes — and decode is bandwidth-bound</button>
<div class="explain"><p>Decode is memory-bound. Shrink every weight to half the bytes and HBM delivers the same work in half the time. Tensor cores were never the bottleneck to begin with.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> Arithmetic intensity measures…</p>
<button data-choice="A">How accurate the computation is</button>
<button data-choice="B">FLOPs per byte moved from HBM</button>
<button data-choice="C">The GPU's clock frequency</button>
<button data-choice="D">The model's parameter count</button>
<div class="explain"><p>Arithmetic intensity is FLOPs ÷ bytes. High intensity means each loaded byte contributes to many operations — the only way to sustain peak compute when the memory pipe is slower than the cores.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q6.</strong> Why is HBM described as high <em>bandwidth</em> but high <em>latency</em>?</p>
<button data-choice="A">It takes hundreds of cycles to start a transfer, but once moving it delivers huge bytes-per-second</button>
<button data-choice="B">It's slow overall and nobody uses it</button>
<button data-choice="C">Latency and bandwidth are the same thing</button>
<button data-choice="D">It's fast per byte but hits a total cap quickly</button>
<div class="explain"><p>Like a freight train: slow to start, huge payload once moving. That's why GPUs love large contiguous transfers — you pay the latency once, then ride the bandwidth.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q7.</strong> If a weight matrix is read once from HBM, which of these increases arithmetic intensity the <em>most</em>?</p>
<button data-choice="A">Running the same single vector through it 10 times in a row, discarding results each time</button>
<button data-choice="B">Reading the matrix with twice as many threads</button>
<button data-choice="C">Batching 64 different input vectors through it together in one matmul</button>
<button data-choice="D">Converting the output to FP32</button>
<div class="explain"><p>One matrix read, 64× the arithmetic on that single read. The ratio of work-to-bytes-moved jumps proportionally. That's why batching is the central lever for decode throughput.</p></div>
</div>

</div>

# Quiz — Memory-bound vs. compute-bound

Seven questions on the roofline, the unifying mental model. Chapter: [Memory-bound vs. compute-bound](../03-llm-inference/roofline.md).

<div class="quiz">

<div class="q" data-answer="C">
<p class="stem"><strong>Q1.</strong> What two ceilings define the roofline?</p>
<button data-choice="A">Core count and clock speed</button>
<button data-choice="B">Cache size and HBM capacity</button>
<button data-choice="C">Peak compute throughput (FLOPs/sec) and peak memory bandwidth (bytes/sec)</button>
<button data-choice="D">Power draw and temperature</button>
<div class="explain"><p>Every operation is limited by one or the other. Low arithmetic intensity → bandwidth is the ceiling. High arithmetic intensity → compute is the ceiling. The roofline graph shows where the switch happens.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q2.</strong> Batch-1 decode on a 70B model at FP16 has an arithmetic intensity of roughly…</p>
<button data-choice="A">~1 op/byte — deeply memory-bound, using less than 1% of tensor-core capacity</button>
<button data-choice="B">~1,000 ops/byte — compute-bound</button>
<button data-choice="C">~295 ops/byte — exactly at the roofline crossover</button>
<button data-choice="D">It depends on the prompt's content</button>
<div class="explain"><p>140 GB of weights moved for ~140 GFLOPs of work → about 1 op/byte. On a chip that wants 295 ops/byte to saturate, that leaves tensor cores mostly idle.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q3.</strong> Reducing bytes moved from HBM directly speeds up which kind of operation?</p>
<button data-choice="A">A compute-bound op — the bytes were never the bottleneck</button>
<button data-choice="B">A memory-bound op — bandwidth was the bottleneck</button>
<button data-choice="C">Neither — byte counts don't affect speed</button>
<button data-choice="D">Both equally</button>
<div class="explain"><p>If you were compute-bound, fewer bytes moved does little. If you were memory-bound, every byte saved is proportional speedup. That's why quantization helps decode so much more than prefill.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> Why have GPU rooflines drifted <em>rightward</em> (higher crossover ops/byte) across generations?</p>
<button data-choice="A">HBM got slower</button>
<button data-choice="B">Workloads require less compute</button>
<button data-choice="C">Clock speeds dropped</button>
<button data-choice="D">Compute grew faster than memory bandwidth — so each new GPU needs higher arithmetic intensity to saturate</button>
<div class="explain"><p>From Pascal (~15) to Hopper (~295) ops/byte, compute throughput has consistently outpaced HBM bandwidth. The same workload that was compute-bound on old hardware can become memory-bound on new hardware — driving the complexity of modern inference engines.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q5.</strong> How does FlashAttention move attention on the roofline graph?</p>
<button data-choice="A">It increases arithmetic intensity (fewer HBM bytes for the same math), shifting attention from memory-bound toward compute-bound</button>
<button data-choice="B">It increases FLOPs, moving it leftward</button>
<button data-choice="C">It lowers the compute ceiling</button>
<button data-choice="D">It doesn't affect the roofline</button>
<div class="explain"><p>FlashAttention doesn't change the math or the FLOPs; it changes the memory layout so the L×L score matrix never goes to HBM. Bytes moved drop sharply → intensity rises → compute-bound regime.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q6.</strong> Which of these is <em>not</em> a motion on the roofline graph?</p>
<button data-choice="A">Batching many sequences through shared weights (rightward on x-axis)</button>
<button data-choice="B">Rewriting a Python function in Rust on the CPU (stays off the GPU roofline entirely)</button>
<button data-choice="C">Quantizing weights to FP8 (rightward on x-axis)</button>
<button data-choice="D">Upgrading from H100 to H200 (raises the memory-bandwidth line)</button>
<div class="explain"><p>CPU-side rewrites don't change GPU performance characteristics. The other three are all genuine roofline motions — either along the x-axis (intensity) or raising a ceiling line.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q7.</strong> What's the cleanest one-line test for whether a new optimization will help a memory-bound op?</p>
<button data-choice="A">Does it add more cores?</button>
<button data-choice="B">Does it increase FLOPs per operation?</button>
<button data-choice="C">Does it reduce bytes moved from HBM for the same work?</button>
<button data-choice="D">Does it raise clock speeds?</button>
<div class="explain"><p>For memory-bound ops, less HBM traffic ≈ more speed. If the technique doesn't reduce bytes moved, it probably won't help — or might even slow things down by adding complexity.</p></div>
</div>

</div>

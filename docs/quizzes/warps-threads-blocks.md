# Quiz — Warps, threads, and blocks

Six questions on the thread hierarchy and occupancy. Chapter: [Warps, threads, and blocks](../02-gpu-architecture/warps-threads-blocks.md).

<div class="quiz">

<div class="q" data-answer="B">
<p class="stem"><strong>Q1.</strong> Order from smallest to largest:</p>
<button data-choice="A">Block → Thread → Warp → Grid</button>
<button data-choice="B">Thread → Warp → Block → Grid</button>
<button data-choice="C">Warp → Thread → Grid → Block</button>
<button data-choice="D">Grid → Block → Warp → Thread</button>
<div class="explain"><p>One thread is one cook. 32 threads = one warp. Up to 1,024 threads = one block (assigned to one SM, sharing shared memory). All blocks together = the grid.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q2.</strong> Threads in the same block can share what two superpowers that threads in different blocks cannot?</p>
<button data-choice="A">Shared memory and a synchronization barrier (<code>__syncthreads</code>)</button>
<button data-choice="B">Registers and branch predictors</button>
<button data-choice="C">HBM and L2 cache</button>
<button data-choice="D">Tensor cores and warp schedulers</button>
<div class="explain"><p>Within a block: on-chip shared memory and the ability to synchronize. Across blocks: you can only communicate through HBM, and you can't synchronize inside a single kernel launch.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q3.</strong> Can two different blocks talk directly to each other while a kernel is running?</p>
<button data-choice="A">Yes, through shared memory</button>
<button data-choice="B">Yes, through the warp scheduler</button>
<button data-choice="C">Yes, via <code>__syncthreads</code></button>
<button data-choice="D">Not directly — they can only communicate through HBM, and there's no in-kernel barrier across blocks</button>
<div class="explain"><p>Block independence is deliberate: it lets the hardware run them on any SM, in any order, at any time — which is what makes GPU code scale from a 20-SM chip to a 132-SM chip without changes.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q4.</strong> What does "occupancy" measure on a GPU?</p>
<button data-choice="A">Percentage of the chip that's plugged in</button>
<button data-choice="B">Fraction of HBM currently used</button>
<button data-choice="C">Fraction of each SM's maximum concurrent threads/warps actually in flight</button>
<button data-choice="D">Count of active thread blocks across the grid</button>
<div class="explain"><p>Occupancy = active warps per SM ÷ max possible warps per SM. Higher occupancy means more warps available to cover memory-latency stalls — but very high isn't always best (FlashAttention uses low occupancy with fat per-thread register use).</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> Why does a low-occupancy SM hurt performance?</p>
<button data-choice="A">The chip overheats</button>
<button data-choice="B">Few warps to switch between — when one stalls on memory, the cores stand idle instead of hiding latency</button>
<button data-choice="C">Occupancy is always directly proportional to throughput</button>
<button data-choice="D">Blocks can't find shared memory</button>
<div class="explain"><p>Latency hiding depends on having alternate warps ready to run. If an SM holds only a few warps and they all stall together, the arithmetic units go quiet.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q6.</strong> In a typical matmul kernel, what is the job of one <em>block</em>?</p>
<button data-choice="A">Compute one tile (e.g., 128×128) of the output matrix, cooperatively loading strips of A and B into shared memory</button>
<button data-choice="B">Compute a single output element</button>
<button data-choice="C">Manage the HBM controller</button>
<button data-choice="D">Decide which SM to run on</button>
<div class="explain"><p>The dominant pattern: one block → one output tile. The block's threads cooperatively stream strips of the inputs into shared memory, sync, feed tensor cores, and accumulate the tile before writing it back to HBM.</p></div>
</div>

</div>

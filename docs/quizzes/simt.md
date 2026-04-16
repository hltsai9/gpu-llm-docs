# Quiz — The synchronized kitchen (SIMT)

Six questions on warps, SIMT, and divergence. Chapter: [The synchronized kitchen (SIMT)](../01-why-gpu/simt.md).

<div class="quiz">

<div class="q" data-answer="B">
<p class="stem"><strong>Q1.</strong> On NVIDIA GPUs, a warp contains how many threads?</p>
<button data-choice="A">16</button>
<button data-choice="B">32</button>
<button data-choice="C">64</button>
<button data-choice="D">128</button>
<div class="explain"><p>A warp is 32 threads — the hardware's smallest unit of lockstep execution. AMD's equivalent (a "wavefront") is 32 or 64 depending on generation.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> What does "warp divergence" look like when threads in a warp take different branches of an <code>if</code>?</p>
<button data-choice="A">The compiler refuses the code</button>
<button data-choice="B">Only the first branch runs; the other threads get wrong results</button>
<button data-choice="C">Both branches run serially — the inactive threads sit masked off, wasting cycles</button>
<button data-choice="D">Each thread gets its own private instruction pointer</button>
<div class="explain"><p>All 32 threads share one instruction pointer. The hardware runs the <code>if</code> branch with half the threads masked on, then the <code>else</code> branch with the other half masked on. Both paths execute; the "wrong" half stands idle for each.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q3.</strong> Why is a pure matrix multiplication basically divergence-free?</p>
<button data-choice="A">Every thread executes the same multiply-add on different numbers — no branches</button>
<button data-choice="B">Matmul kernels run on CUDA cores, which don't have warps</button>
<button data-choice="C">The driver automatically rewrites branches</button>
<button data-choice="D">Matmul actually does diverge badly</button>
<div class="explain"><p>Matmul is the ideal SIMT workload: same instruction for every thread, just on different operands. That's why GPUs trounce CPUs on it by orders of magnitude.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q4.</strong> What's the main difference between SIMD (on a CPU) and SIMT (on a GPU)?</p>
<button data-choice="A">SIMT is slower; SIMD is faster</button>
<button data-choice="B">SIMD is instruction-level (one core, vector-wide op); SIMT is thread-level (many threads quietly forced into lockstep)</button>
<button data-choice="C">They are the same thing with different names</button>
<button data-choice="D">SIMT only works on integers; SIMD works on floats</button>
<div class="explain"><p>SIMD is a single instruction with a vector operand on one CPU core. SIMT presents as many independent threads to the programmer; the lockstep grouping is the hardware's secret.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q5.</strong> Which transformer-era operation can introduce warp divergence?</p>
<button data-choice="A">A standard dense matmul</button>
<button data-choice="B">A layer norm</button>
<button data-choice="C">A pointwise ReLU</button>
<button data-choice="D">Masked attention or sparse Mixture-of-Experts routing, where threads follow different paths</button>
<div class="explain"><p>Causal masks and MoE routing have condition-dependent control flow — different threads want to do different things. Well-written kernels minimize this, but it's the place where divergence shows up in real LLM code.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q6.</strong> Why did GPU designers adopt SIMT's lockstep rule in the first place?</p>
<button data-choice="A">To share one instruction decoder across 32 threads, saving silicon for more arithmetic units</button>
<button data-choice="B">To prevent race conditions</button>
<button data-choice="C">Because it's easier to debug</button>
<button data-choice="D">To keep programmers from writing branches</button>
<div class="explain"><p>One shared decoder per 32 threads is ~32× less decoder hardware per op. That's how you fit tens of thousands of arithmetic units on one die — by pooling the expensive control logic across many threads.</p></div>
</div>

</div>

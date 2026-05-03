# Quiz — The synchronized kitchen (SIMT)

Six questions on warps, SIMT, and divergence. Chapter: [The synchronized kitchen (SIMT)](../01-why-gpu/simt.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> On NVIDIA GPUs, a warp contains how many threads?",
      "choices": {
        "A": "A warp on NVIDIA GPUs contains 16 threads executing in lockstep",
        "B": "A warp on NVIDIA GPUs contains 32 threads executing in lockstep",
        "C": "A warp on NVIDIA GPUs contains 64 threads executing in lockstep",
        "D": "A warp on NVIDIA GPUs contains 128 threads executing in lockstep"
      },
      "explain": "<p>A warp is 32 threads — the hardware's smallest unit of lockstep execution. AMD's equivalent (a \"wavefront\") is 32 or 64 depending on generation.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What does \"warp divergence\" look like when threads in a warp take different branches of an <code>if</code>?",
      "choices": {
        "A": "The compiler refuses to accept or compile the code",
        "B": "Only the if-branch executes while other threads receive wrong results",
        "C": "Both branches run serially — the inactive threads sit masked off, wasting cycles",
        "D": "Each thread maintains its own independent instruction pointer"
      },
      "explain": "<p>All 32 threads share one instruction pointer. The hardware runs the <code>if</code> branch with half the threads masked on, then the <code>else</code> branch with the other half masked on. Both paths execute; the \"wrong\" half stands idle for each.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> Why is a pure matrix multiplication basically divergence-free?",
      "choices": {
        "A": "Every thread executes the same multiply-add operations on different numbers",
        "B": "Matmul kernels run directly on CUDA cores, which don't organize into warps",
        "C": "The driver automatically rewrites and removes all branch statements",
        "D": "Matmul kernels actually do have severe divergence problems in practice"
      },
      "explain": "<p>Matmul is the ideal SIMT workload: same instruction for every thread, just on different operands. That's why GPUs trounce CPUs on it by orders of magnitude.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> What's the main difference between SIMD (on a CPU) and SIMT (on a GPU)?",
      "choices": {
        "A": "SIMT performance is slower than SIMD performance in almost all practical scenarios",
        "B": "SIMD is instruction-level (one core, vector op); SIMT is thread-level (many threads forced into lockstep)",
        "C": "They represent identical architectural concepts using only different technical terminology",
        "D": "SIMT only works with integer data; SIMD only works with floating-point data types"
      },
      "explain": "<p>SIMD is a single instruction with a vector operand on one CPU core. SIMT presents as many independent threads to the programmer; the lockstep grouping is the hardware's secret.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q5.</strong> Which transformer-era operation can introduce warp divergence?",
      "choices": {
        "A": "A standard dense matmul computation where all threads do identical multiply-add operations",
        "B": "A layer normalization step applied uniformly across the entire activation tensor",
        "C": "A pointwise ReLU activation function applied uniformly to all elements in parallel",
        "D": "Masked attention or sparse Mixture-of-Experts routing where different threads follow different execution paths"
      },
      "explain": "<p>Causal masks and MoE routing have condition-dependent control flow — different threads want to do different things. Well-written kernels minimize this, but it's the place where divergence shows up in real LLM code.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Why did GPU designers adopt SIMT's lockstep rule in the first place?",
      "choices": {
        "A": "To share one instruction decoder across 32 threads, saving silicon for arithmetic units",
        "B": "To prevent data races and synchronization bugs in concurrent code",
        "C": "Because it makes debugging kernel code much more straightforward",
        "D": "To prevent programmers from accidentally writing branch statements"
      },
      "explain": "<p>One shared decoder per 32 threads is ~32× less decoder hardware per op. That's how you fit tens of thousands of arithmetic units on one die — by pooling the expensive control logic across many threads.</p>"
    }
  ]
}
</script>

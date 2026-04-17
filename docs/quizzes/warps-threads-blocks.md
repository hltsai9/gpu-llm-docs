# Quiz — Warps, threads, and blocks

Six questions on the thread hierarchy and occupancy. Chapter: [Warps, threads, and blocks](../02-gpu-architecture/warps-threads-blocks.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> Order from smallest to largest:",
      "choices": {
        "A": "Block → Thread → Warp → Grid",
        "B": "Thread → Warp → Block → Grid",
        "C": "Warp → Thread → Grid → Block",
        "D": "Grid → Block → Warp → Thread"
      },
      "explain": "<p>One thread is one cook. 32 threads = one warp. Up to 1,024 threads = one block (assigned to one SM, sharing shared memory). All blocks together = the grid.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Threads in the same block can share what two superpowers that threads in different blocks cannot?",
      "choices": {
        "A": "Shared memory and a synchronization barrier (<code>__syncthreads</code>)",
        "B": "Registers and branch predictors",
        "C": "HBM and L2 cache",
        "D": "Tensor cores and warp schedulers"
      },
      "explain": "<p>Within a block: on-chip shared memory and the ability to synchronize. Across blocks: you can only communicate through HBM, and you can't synchronize inside a single kernel launch.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Can two different blocks talk directly to each other while a kernel is running?",
      "choices": {
        "A": "Yes, through shared memory",
        "B": "Yes, through the warp scheduler",
        "C": "Yes, via <code>__syncthreads</code>",
        "D": "Not directly — they can only communicate through HBM, and there's no in-kernel barrier across blocks"
      },
      "explain": "<p>Block independence is deliberate: it lets the hardware run them on any SM, in any order, at any time — which is what makes GPU code scale from a 20-SM chip to a 132-SM chip without changes.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q4.</strong> What does \"occupancy\" measure on a GPU?",
      "choices": {
        "A": "Percentage of the chip that's plugged in",
        "B": "Fraction of HBM currently used",
        "C": "Fraction of each SM's maximum concurrent threads/warps actually in flight",
        "D": "Count of active thread blocks across the grid"
      },
      "explain": "<p>Occupancy = active warps per SM ÷ max possible warps per SM. Higher occupancy means more warps available to cover memory-latency stalls — but very high isn't always best (FlashAttention uses low occupancy with fat per-thread register use).</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> Why does a low-occupancy SM hurt performance?",
      "choices": {
        "A": "The chip overheats",
        "B": "Few warps to switch between — when one stalls on memory, the cores stand idle instead of hiding latency",
        "C": "Occupancy is always directly proportional to throughput",
        "D": "Blocks can't find shared memory"
      },
      "explain": "<p>Latency hiding depends on having alternate warps ready to run. If an SM holds only a few warps and they all stall together, the arithmetic units go quiet.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> In a typical matmul kernel, what is the job of one <em>block</em>?",
      "choices": {
        "A": "Compute one tile (e.g., 128×128) of the output matrix, cooperatively loading strips of A and B into shared memory",
        "B": "Compute a single output element",
        "C": "Manage the HBM controller",
        "D": "Decide which SM to run on"
      },
      "explain": "<p>The dominant pattern: one block → one output tile. The block's threads cooperatively stream strips of the inputs into shared memory, sync, feed tensor cores, and accumulate the tile before writing it back to HBM.</p>"
    }
  ]
}
</script>

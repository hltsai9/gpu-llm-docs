# Quiz — The cafeteria vs. the steakhouse

Six questions on CPU vs GPU design philosophy. Chapter: [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> In the chapter's analogy, which restaurant represents the GPU?",
      "choices": {
        "A": "The steakhouse — a few expert chefs, each handling a full order",
        "B": "The cafeteria — one head chef directing a thousand line cooks in lockstep",
        "C": "Both work equally well as analogies",
        "D": "A food truck — one cook, one specialty"
      },
      "explain": "<p>The GPU is the cafeteria: many simple workers doing the same thing at the same time. The steakhouse (few skilled chefs, each handling complex customized orders independently) maps to a CPU.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> Most of a modern CPU's transistor budget goes toward…",
      "choices": {
        "A": "Arithmetic units (multipliers and adders)",
        "B": "More cores running in parallel",
        "C": "Caches, branch predictors, and out-of-order execution logic",
        "D": "Graphics rendering pipelines"
      },
      "explain": "<p>A CPU spends most of its silicon making one thread fast: branch predictors guess which way <code>if</code>s will go, out-of-order engines avoid stalls, and large L1/L2/L3 caches keep hot data close. Arithmetic units are a relatively small share.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Why is a large matrix multiplication a natural fit for a GPU?",
      "choices": {
        "A": "Because matmul has many data-dependent branches the GPU can predict",
        "B": "Because it fits entirely inside the L1 cache",
        "C": "Because GPUs have faster single-threaded performance than CPUs",
        "D": "Because each output cell is independent, so thousands of cores can compute different cells in parallel without coordinating"
      },
      "explain": "<p>Computing output cell (i, j) of a matmul doesn't depend on computing cell (i, j+1). That independence is what lets the cafeteria hand each cell to a different line cook — the exact work the hardware is shaped for.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Roughly how many CUDA cores are on an NVIDIA H100?",
      "choices": {
        "A": "~16,000",
        "B": "~128",
        "C": "~1,000",
        "D": "~500,000"
      },
      "explain": "<p>An H100 has 132 SMs, each with ~128 CUDA cores — about 16,896 in total. That's the numerical shape of \"lots of simple cores in lockstep.\"</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> Which workload plays to the CPU's strengths, not the GPU's?",
      "choices": {
        "A": "Dense matrix multiplication on multi-GB tensors",
        "B": "A database query planner making branching decisions over a few rows",
        "C": "A convolution across millions of image pixels",
        "D": "Attention over a long sequence"
      },
      "explain": "<p>Database query planning is branch-heavy, latency-sensitive, and operates on small data. That's the steakhouse's specialty. The other three are dense, parallel, and predictable — cafeteria work.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> What is the single most common reason naive GPU code runs slowly?",
      "choices": {
        "A": "GPUs are actually slower at floating-point than CPUs",
        "B": "GPUs don't have enough cores",
        "C": "The programmer treats the GPU as \"a faster CPU\" instead of a different kind of machine",
        "D": "GPUs run Python interpreters too slowly"
      },
      "explain": "<p>The chapter's parting line: a GPU isn't a faster CPU, it's a differently shaped machine. Code written with steakhouse assumptions (branches, latency-sensitive, one-thread-fast) runs badly on cafeteria hardware.</p>"
    }
  ]
}
</script>

# Quiz — The cafeteria vs. the steakhouse

Six questions on CPU vs GPU design philosophy. Chapter: [The cafeteria vs. the steakhouse](../01-why-gpu/cpu-vs-gpu.md).

<div class="quiz">

<div class="q" data-answer="B">
<p class="stem"><strong>Q1.</strong> In the chapter's analogy, which restaurant represents the GPU?</p>
<button data-choice="A">The steakhouse — a few expert chefs, each handling a full order</button>
<button data-choice="B">The cafeteria — one head chef directing a thousand line cooks in lockstep</button>
<button data-choice="C">Both work equally well as analogies</button>
<button data-choice="D">A food truck — one cook, one specialty</button>
<div class="explain"><p>The GPU is the cafeteria: many simple workers doing the same thing at the same time. The steakhouse (few skilled chefs, each handling complex customized orders independently) maps to a CPU.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> Most of a modern CPU's transistor budget goes toward…</p>
<button data-choice="A">Arithmetic units (multipliers and adders)</button>
<button data-choice="B">More cores running in parallel</button>
<button data-choice="C">Caches, branch predictors, and out-of-order execution logic</button>
<button data-choice="D">Graphics rendering pipelines</button>
<div class="explain"><p>A CPU spends most of its silicon making one thread fast: branch predictors guess which way <code>if</code>s will go, out-of-order engines avoid stalls, and large L1/L2/L3 caches keep hot data close. Arithmetic units are a relatively small share.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q3.</strong> Why is a large matrix multiplication a natural fit for a GPU?</p>
<button data-choice="A">Because matmul has many data-dependent branches the GPU can predict</button>
<button data-choice="B">Because it fits entirely inside the L1 cache</button>
<button data-choice="C">Because GPUs have faster single-threaded performance than CPUs</button>
<button data-choice="D">Because each output cell is independent, so thousands of cores can compute different cells in parallel without coordinating</button>
<div class="explain"><p>Computing output cell (i, j) of a matmul doesn't depend on computing cell (i, j+1). That independence is what lets the cafeteria hand each cell to a different line cook — the exact work the hardware is shaped for.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q4.</strong> Roughly how many CUDA cores are on an NVIDIA H100?</p>
<button data-choice="A">~16,000</button>
<button data-choice="B">~128</button>
<button data-choice="C">~1,000</button>
<button data-choice="D">~500,000</button>
<div class="explain"><p>An H100 has 132 SMs, each with ~128 CUDA cores — about 16,896 in total. That's the numerical shape of "lots of simple cores in lockstep."</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> Which workload plays to the CPU's strengths, not the GPU's?</p>
<button data-choice="A">Dense matrix multiplication on multi-GB tensors</button>
<button data-choice="B">A database query planner making branching decisions over a few rows</button>
<button data-choice="C">A convolution across millions of image pixels</button>
<button data-choice="D">Attention over a long sequence</button>
<div class="explain"><p>Database query planning is branch-heavy, latency-sensitive, and operates on small data. That's the steakhouse's specialty. The other three are dense, parallel, and predictable — cafeteria work.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q6.</strong> What is the single most common reason naive GPU code runs slowly?</p>
<button data-choice="A">GPUs are actually slower at floating-point than CPUs</button>
<button data-choice="B">GPUs don't have enough cores</button>
<button data-choice="C">The programmer treats the GPU as "a faster CPU" instead of a different kind of machine</button>
<button data-choice="D">GPUs run Python interpreters too slowly</button>
<div class="explain"><p>The chapter's parting line: a GPU isn't a faster CPU, it's a differently shaped machine. Code written with steakhouse assumptions (branches, latency-sensitive, one-thread-fast) runs badly on cafeteria hardware.</p></div>
</div>

</div>

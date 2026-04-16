# Quiz — Throughput over latency

Five questions on the latency/throughput tradeoff. Chapter: [Throughput over latency](../01-why-gpu/throughput-vs-latency.md).

<div class="quiz">

<div class="q" data-answer="B">
<p class="stem"><strong>Q1.</strong> In the highway analogy, which strategy wins for moving 10,000 people from SF to LA?</p>
<button data-choice="A">The Ferrari — fast per trip, turn around and repeat</button>
<button data-choice="B">The freight train — slower per trip, but carries 10,000 at once</button>
<button data-choice="C">They take the same total time</button>
<button data-choice="D">Neither — latency always wins over throughput</button>
<div class="explain"><p>The train wins by enormous margins despite being slower per trip, because it moves the whole crowd in parallel. GPUs are the train: often slower per op than a CPU, but vastly higher total throughput.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> When a warp on a GPU stalls waiting for memory, what does the SM do?</p>
<button data-choice="A">Halt all cores until the memory load returns</button>
<button data-choice="B">Restart the warp from the beginning</button>
<button data-choice="C">Switch to another ready warp so the arithmetic units stay busy</button>
<button data-choice="D">Ask the CPU to fetch the data instead</button>
<div class="explain"><p>This is <strong>latency hiding</strong>: the SM keeps dozens of warps in flight, and when one stalls, the scheduler runs another. Per-thread latency can be huge, but aggregate throughput stays near peak.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q3.</strong> Why are small batches bad for GPU utilization when serving an LLM?</p>
<button data-choice="A">A tiny batch under-uses the tensor cores — you're sending a freight train half-empty</button>
<button data-choice="B">Small batches cause the GPU to overheat</button>
<button data-choice="C">The CUDA driver refuses them</button>
<button data-choice="D">Small batches have higher total FLOPs than large ones</button>
<div class="explain"><p>A GPU earns its throughput by running many pieces of work in parallel. A batch of 1 leaves thousands of cores idle — the train is half-empty.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> What's typically true about a <em>single</em> operation on a GPU versus on a CPU?</p>
<button data-choice="A">The GPU's single-op latency is always lower</button>
<button data-choice="B">They're identical</button>
<button data-choice="C">GPU latency is lower when running Python</button>
<button data-choice="D">A single op often takes <em>longer</em> on the GPU — but the GPU does millions in parallel</button>
<div class="explain"><p>Any one thread on a GPU is unremarkable in speed. The chip wins on aggregate: thousands of threads making progress at once while any given one waits.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> A system produces 100 tokens/sec for one user versus 10,000 tokens/sec across 100 users. These numbers describe…</p>
<button data-choice="A">The same metric measured two ways</button>
<button data-choice="B">Two different targets — per-user latency vs overall throughput — which usually trade off against each other</button>
<button data-choice="C">A bug in the measurement</button>
<button data-choice="D">CPU vs GPU comparison</button>
<div class="explain"><p>Latency (tokens/sec for one user) and throughput (total tokens/sec across users) are different. Serving systems pick a target; you generally can't max both at the same time.</p></div>
</div>

</div>

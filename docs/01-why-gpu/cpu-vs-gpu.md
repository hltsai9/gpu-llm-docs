# The cafeteria vs. the steakhouse

Imagine two restaurants across the street from each other.

**The steakhouse** employs eight chefs. Each is a veteran. Any of them can take an order, walk to the walk-in for ingredients, start a sauce, taste it, adjust, sear a filet, plate it, garnish it, and send it to a table. They make decisions constantly: *"this cut looks thick, I'll cook it two minutes longer"*; *"that table seems in a hurry, I'll start their sides first."* Each chef works on a different order from start to finish. Orders are complicated, customized, and unpredictable. Service is slow but the food is exactly what you asked for.

**The cafeteria** across the street employs one head chef and a thousand line cooks. The head chef barks instructions: *"everyone, chop an onion."* A thousand knives come down. *"Everyone, add the onion to the pan."* A thousand pans sizzle. Individually, the line cooks are not geniuses — most of them can barely make a sandwich without being told each step. But together, under a single synchronized instruction, they can feed a stadium before the steakhouse has finished its first eight orders.

<div class="analogy" markdown>
A CPU is the steakhouse. A GPU is the cafeteria.
</div>

Everything about GPU design follows from that choice, and so does everything about why they are magical for LLMs and merely okay for the code on your laptop.

## What the steakhouse optimizes for

A CPU is built to handle **unpredictable, sequential work well**. Its design priorities are:

- **Low latency per task.** Finish any single instruction as fast as possible.
- **Branching and decisions.** Code says `if user.is_admin: ... else: ...` all day. A CPU has giant circuits (branch predictors, out-of-order execution engines) dedicated to *guessing* what the next instruction will be, so it doesn't have to wait.
- **Large, intelligent caches.** The CPU's L1/L2/L3 caches are its mise en place — if the chef touched an ingredient recently, it's right there on the counter. If not, the CPU has clever logic to guess what it will need next.
- **Few, wide cores.** A modern server CPU has maybe 32–128 cores. Each one is a small city of silicon dedicated to being excellent at one thread.

Most of a CPU's transistor budget goes to making *one thread* run as fast as possible, with as few stalls as possible. That's why CPUs are fantastic at databases, operating systems, compilers, spreadsheets — anything that branches a lot and serves requests one at a time.

## What the cafeteria optimizes for

A GPU is built for **huge amounts of predictable, identical work**. Its design priorities are:

- **Throughput over latency.** It's fine if any one operation is slow, as long as we finish *millions* of them per second in aggregate.
- **Minimal branching.** Most cores are running the exact same instruction on different data. There's almost no machinery for guessing what's next — everyone just does what the head chef said.
- **Tiny caches per core, huge memory pipes.** Less per-thread intelligence, more raw bandwidth from the pantry.
- **Thousands of simple cores.** An H100 has ~16,000 CUDA cores. Each one is not very bright, but there are a *lot* of them, and they work in lockstep.

The H100's transistor budget is flipped from a CPU's. Most of the silicon is arithmetic units — multipliers and adders — with just enough control logic to keep them fed.

## Why LLMs love the cafeteria

Now the payoff. What does a transformer actually *do* during inference? At its core, for every layer, for every token, it computes a giant matrix multiplication:

$$
Y = X W
$$

Where $X$ and $W$ are matrices with thousands of rows and columns. A single matmul between two 4096×4096 matrices requires about **137 billion** multiply-add operations. And those operations are almost perfectly independent: computing output cell $(i, j)$ doesn't depend on computing output cell $(i, j+1)$. You can hand each cell to a different worker.

This is the *exact* shape of work the cafeteria is built for. "Everyone, multiply your assigned row of X by your assigned column of W. Go." Ten thousand cores, ten thousand independent little dot products, no branches, no drama.

<div class="analogy" markdown>
Asking a CPU to do a 70B-parameter matmul is like asking eight steakhouse chefs to prepare ten thousand identical burgers, one at a time, each deliberating whether this particular burger needs more salt. Asking a GPU to do the same is like telling a cafeteria: *"everyone, flip your patty."*
</div>

## Where the analogy breaks (and why that's useful)

Every analogy has edges. Here are the edges of this one, because they will matter later.

**Line cooks aren't independent.** In a real cafeteria, if two cooks are slower than the others, the head chef simply works around them. On a GPU, the thousand cooks move in groups of 32 called **warps**, and they must all execute the *same* instruction at the *same* time. If one cook has to `if`-branch to a different action, the other 31 stand idle waiting. We'll get to this in [SIMT](simt.md), and it is the #1 reason naive GPU code is slow.

**The pantry is not close.** In a kitchen you imagine ingredients within arm's reach. On a GPU, the main memory (called **HBM**, for high-bandwidth memory) is fast by computer standards but *slow* compared to how fast the cores can multiply. A large part of writing good GPU code is about not running back to the pantry. We'll dig into that in [the memory hierarchy](../02-gpu-architecture/memory-hierarchy.md).

**The head chef isn't just yelling.** Real GPU kernels have scheduling, synchronization, and memory movement happening constantly underneath. The "single instruction" model is a clean first picture, not the full one.

Keep the cafeteria image anyway. When you later read that "warp divergence is expensive" or "HBM bandwidth is the bottleneck," the image tells you exactly why — cooks standing idle, or cooks waiting for ingredients to be wheeled in from the warehouse.

## In one sentence

CPUs are designed to finish one hard task quickly. GPUs are designed to finish a mountain of easy, identical tasks at the same time. LLMs are a mountain of easy, identical tasks.

Next: [Throughput over latency →](throughput-vs-latency.md)

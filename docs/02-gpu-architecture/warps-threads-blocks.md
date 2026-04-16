# Warps, threads, and blocks

We know an SM has thousands of cores. We know threads run in lockstep groups of 32 called warps. Now we need the full organizational chart — the way CUDA (and GPU programs in general) actually carve up work.

There are four levels in the hierarchy. From smallest to largest:

1. **Thread** — one cook.
2. **Warp** — a brigade of 32 cooks who must execute the same instruction.
3. **Block** (also called *cooperative thread array*) — a crew of up to 1,024 threads that live together in one SM, can share memory, and can synchronize.
4. **Grid** — the entire kitchen's worth of blocks, distributed across all the SMs in the GPU.

<div class="analogy" markdown>
Threads are cooks. Warps are brigades of 32 cooks in lockstep. Blocks are the crew assigned to a single workshop — they share a stockroom and can talk to each other. The grid is the whole factory park: dozens of crews in dozens of workshops, each working on their assigned piece of the order.
</div>

## How work is organized

When you launch a kernel (a GPU function), you specify two shapes:

```cuda
kernel<<<gridDim, blockDim>>>(args);
// gridDim  = how many blocks (e.g., 1024)
// blockDim = how many threads per block (e.g., 256)
```

Each thread gets coordinates: its thread index within its block, and its block's index within the grid. Inside the kernel, each thread uses its coordinates to figure out which element of the problem it's responsible for:

```cuda
int i = blockIdx.x * blockDim.x + threadIdx.x;
output[i] = input[i] * 2.0f;  // each thread handles one element
```

This is how you map, say, a 1,000,000-element array onto the hardware: 1,000,000 threads, maybe 256 per block, 3,907 blocks in the grid. The GigaThread engine distributes those 3,907 blocks across the 132 SMs on an H100, each SM running as many blocks as its resources allow.

## The block as a cooperative unit

Threads in the same block have two superpowers that threads in different blocks don't:

**Shared memory.** Threads in a block can read and write a small (~100 KB on H100) block-private chunk of fast on-chip memory. This is where you stage tiles of weights and activations so the block can reuse them many times without going back to HBM.

**Synchronization.** All threads in a block can hit a `__syncthreads()` barrier, which means: *"everyone wait here until the whole block has arrived."* You use this after staging data into shared memory — no thread can start computing until all threads have finished loading.

Threads in *different* blocks can't do either of these efficiently. There is no direct communication between blocks other than through HBM, and no way to synchronize them within a kernel (short of launching a new one). This is a deliberate tradeoff: by making blocks independent, the hardware can run them on any SM, in any order, at any time, without coordination.

<div class="analogy" markdown>
A crew in one workshop can shout across the room to each other and share the stockroom. But workshops don't talk to each other mid-job — they just deliver finished work to the central warehouse. This independence is what lets the factory scale.
</div>

## Occupancy: how many crews fit per workshop

An SM has finite resources — register file, shared memory, warp slots. The number of concurrent blocks an SM can host depends on how much each block wants:

- If each thread needs lots of registers, fewer threads fit.
- If each block wants lots of shared memory, fewer blocks fit.
- If each block has many threads, fewer blocks fit (there's a hard max on threads per SM).

The fraction of the SM's thread capacity you're actually using is called **occupancy**. Higher isn't always better — some kernels perform best at low occupancy with fat per-thread register usage (FlashAttention is the famous example). But if occupancy is too low, the SM has few warps to juggle, and latency hiding breaks down.

!!! info "The latency-hiding math"
    An H100 SM can keep ~2,048 threads in flight at once — that's 64 warps per SM. When one warp stalls on a 500-cycle HBM load, the scheduler needs other warps ready to run. If the SM only has 4 warps, everyone stalls together and the cores go idle.

Picking `blockDim` and the per-thread resource use is one of the core tuning decisions in CUDA. Framework-level LLM code (cuBLAS, cuDNN, FlashAttention) has these knobs carefully set per GPU generation.

## What threads, warps, blocks look like in an LLM kernel

Take a matrix multiplication, which is the heart of every transformer layer. A typical tiling strategy looks like this:

1. **Problem:** compute $C = A \times B$, where $C$ is $M \times N$. Split $C$ into tiles of, say, $128 \times 128$.
2. **One block = one tile of C.** A block of 256 threads is responsible for computing one 128×128 tile of the output. That's 16,384 output elements across 256 threads → 64 elements per thread.
3. **Staging:** the block cooperatively loads strips of $A$ and $B$ from HBM into shared memory.
4. **Syncthreads.** Everyone waits until the strips are loaded.
5. **Tensor cores.** Warps within the block issue tensor-core instructions that consume the strips from shared memory and update per-thread accumulator registers.
6. **Repeat** steps 3–5 along the shared dimension $K$ until the tile is complete.
7. **Write** the accumulated tile back to HBM.

Every level of the hierarchy is doing its job:

- **Threads** hold accumulators and do the final elementwise work.
- **Warps** drive tensor-core instructions in lockstep.
- **Blocks** coordinate loading strips into shared memory, using it across many iterations.
- **The grid** covers the full output matrix, with the GigaThread engine spreading blocks across SMs.

<div class="analogy" markdown>
The grid is the whole factory's job. The blocks are workshops, each responsible for a square of the final product. The workshops load raw material from the loading dock in batches, stash it in their stockroom, and have their brigades (warps) of cooks (threads) turn it into finished product before sending it back out.
</div>

## A cleaner mental picture

```
 Grid  ────────────────────────────────────────────────────────
  │
  ├── Block 0   ──┐
  ├── Block 1   ──┤  distributed across SMs by the GigaThread engine
  ├── Block 2   ──┤
  │              ...
  └── Block N-1 ──┘

 Inside one block:

   Block ─── Threads 0..255 ──┬── Warp 0 (threads 0..31)
                              ├── Warp 1 (threads 32..63)
                              ├── ...
                              └── Warp 7 (threads 224..255)

   Plus: shared memory visible to all 256 threads.
         syncthreads() barrier across the whole block.
```

## The newer wrinkle: thread block clusters

On Hopper (H100) and newer, NVIDIA added an additional level: the **thread block cluster**, which groups multiple blocks so they can share a slightly larger on-chip memory region (Distributed Shared Memory). It's a tool for making tile-based LLM kernels even more efficient on very large matmuls. You don't need it in the mental model yet — just know that the hierarchy is extensible and keeps growing new levels.

## What to take away

- Work is organized **thread → warp → block → grid**.
- A block is the unit of **cooperation**: shared memory and synchronization.
- A grid is the unit of **distribution**: blocks get spread across SMs automatically.
- Occupancy — how full you keep each SM — is the knob that enables latency hiding.
- Every LLM operator you care about (matmul, attention, layer norm) is built by cleverly tiling the problem into blocks and keeping those blocks' shared memory hot.

Next: [Tensor Cores: power tools →](tensor-cores.md)

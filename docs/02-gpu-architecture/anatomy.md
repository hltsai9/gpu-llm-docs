# Anatomy of a GPU

Let's walk the factory floor.

A modern data-center GPU — an NVIDIA H100, for example — is a single piece of silicon roughly the size of a postage stamp, with 80 billion transistors. If we zoom in, we find it isn't one giant machine. It's a neighborhood of **smaller, identical machines**, each called a **Streaming Multiprocessor (SM)**. An H100 has 132 of them.

<div class="analogy" markdown>
Think of the GPU as a factory park containing 132 identical workshops. Each workshop is an SM. Inside each workshop, there are benches, tools, a small stockroom, and a crew. The workshops all look the same and all do the same kind of work. The park's job is to keep every workshop busy.
</div>

## What lives inside one SM

Open the door to a single SM and you find, roughly:

- **~128 CUDA cores.** These are the line cooks. Each is a simple arithmetic unit that can do a multiply-add per cycle on 32-bit floats. Not smart, but quick, and there are a lot of them per SM.
- **4 Tensor Cores.** Specialty power tools for matrix multiplication. A single tensor core can do a small matmul (like 4×4 × 4×4) in one step instead of many. For LLM math, this is where most of the actual arithmetic happens. [More on these](tensor-cores.md).
- **A warp scheduler (usually 4 of them).** The foreman. Each warp scheduler can issue one instruction per cycle to one warp (32 threads). With 4 schedulers, an SM can keep 4 warps actively executing every cycle.
- **A register file.** The workbench. ~64K 32-bit registers per SM — split across all active threads. This is where variables live while a thread is running. Fastest storage on the chip.
- **Shared memory / L1 cache.** The workshop stockroom. ~256 KB per SM, shared by all threads in a block. Orders of magnitude faster than main memory.
- **Load/store units and special function units.** The plumbing for moving data in and out, plus hardware for transcendentals (sin, cos, exp).

Multiply that by 132 workshops on an H100 and you have:

<div class="numbers" markdown>
<div class="cell"><div class="n">~16,896</div><div class="l">CUDA cores total</div></div>
<div class="cell"><div class="n">528</div><div class="l">Tensor cores total</div></div>
<div class="cell"><div class="n">~33 MB</div><div class="l">Combined register file</div></div>
<div class="cell"><div class="n">~33 MB</div><div class="l">Combined shared memory</div></div>
</div>

## The control tower and the pantry

Surrounding the 132 workshops are two chip-wide shared resources:

**The L2 cache.** A large, chip-wide cache (~50 MB on H100) that sits between the SMs and main memory. Think of it as the **central dispatch warehouse** in the factory park — if any SM recently touched a piece of data, it's probably sitting here, and other SMs can grab it quickly too.

**HBM (High Bandwidth Memory).** The main memory. On an H100 this is 80 GB of specialized DRAM stacked *right next to* the GPU die, connected by a 5,120-bit-wide memory bus running at ~3 TB/s. HBM is what lets the GPU be so fast at memory-heavy work — it is literally one of the widest memory interfaces in computing.

<div class="analogy" markdown>
If the register file is your tool bench and shared memory is the workshop stockroom, HBM is the enormous loading dock where full pallets of ingredients arrive on forklifts. It's fast by any normal standard — but it's further away than the stockroom, and every trip costs time.
</div>

We dig into this distance and its consequences in [the memory hierarchy](memory-hierarchy.md). For now, just absorb the shape: **fast, small storage near the cores; slow, huge storage far away.**

## The GigaThread engine (the shift manager)

Who decides which workshop gets which work? The **GigaThread engine** is the chip's global scheduler. When you launch a kernel (a GPU function) with, say, 1,024 thread blocks, the GigaThread engine distributes those blocks across the 132 SMs. As each SM finishes a block, the engine hands it another.

The programmer does not pick which SM runs which block. You just say "I want to run this function across a 1D/2D/3D grid of thread blocks," and the hardware decides who gets what. This decoupling is one reason GPU programs scale automatically — the same code runs on a 20-SM consumer card or a 132-SM data-center card, just slower or faster, with no source changes.

## A map to keep in your head

```
        ┌────────────────────────────────────────────────────────────┐
        │                         GPU die                            │
        │                                                            │
        │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       ┌──────┐       │
        │   │ SM 0 │ │ SM 1 │ │ SM 2 │ │ SM 3 │  ...  │SM 131│       │
        │   └──────┘ └──────┘ └──────┘ └──────┘       └──────┘       │
        │                                                            │
        │   ┌──────────────────────────────────────────────────────┐ │
        │   │                   L2 cache (~50 MB)                  │ │
        │   └──────────────────────────────────────────────────────┘ │
        │                         │                                  │
        └─────────────────────────┼──────────────────────────────────┘
                                  │
                          ┌───────┴────────┐
                          │  HBM (80 GB)   │
                          │   ~3 TB/s      │
                          └────────────────┘

Inside each SM:

   ┌───────────────────────── SM ──────────────────────────┐
   │  Warp sched ×4   Register file (64K × 32-bit)         │
   │  CUDA cores ×128    Tensor cores ×4                   │
   │  Shared memory / L1 (~256 KB)                         │
   └───────────────────────────────────────────────────────┘
```

## What the scale means for LLMs

When you run a transformer forward pass on an H100, the model's 70B parameters live in HBM (at, say, FP16, that's ~140 GB — more than one GPU, but we'll get to that later). To multiply a weight matrix by an activation:

1. The relevant weight tiles must travel from HBM into each SM's shared memory / registers.
2. The tensor cores perform the matmul in registers.
3. Results go back out to HBM (or stay on-chip if they're intermediate).

The bottleneck is almost never the tensor cores. They are so fast that they finish faster than HBM can feed them. The whole art of efficient LLM inference is **keeping the tensor cores fed** — which means being clever about what data you move, when, and how much you can reuse it on-chip before it gets evicted.

This is the setup for [the memory hierarchy](memory-hierarchy.md), which you should read next.

<div class="analogy" markdown>
The tensor cores are overqualified power tools. They finish their work faster than the loading dock can deliver materials. The whole game is making sure they never stand idle.
</div>

Next: [The memory hierarchy →](memory-hierarchy.md)

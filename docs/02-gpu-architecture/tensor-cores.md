# Tensor Cores: power tools

Most of the factory floor looks the same: CUDA cores, memory, warp schedulers. But tucked inside each SM are a handful of **tensor cores**, and they are the reason LLMs run as fast as they do.

Think of them as **purpose-built power tools**, the industrial machines next to the general workbenches. A CUDA core is a skilled hand holding a hammer. A tensor core is a hydraulic press that stamps out whole matrices in one motion.

<div class="analogy" markdown>
CUDA cores are hands with hammers. Tensor cores are hydraulic stamping machines. Both have their place, but if your product is sheet metal, you don't hammer it — you stamp it.
</div>

## What a tensor core actually does

A CUDA core performs one multiply-add per cycle on scalar operands:

```
accumulator += a * b    // 1 multiply-add, per cycle, per core
```

A tensor core performs a whole small **matrix multiply-accumulate** per cycle — something like:

```
D = A × B + C   // where A, B, C, D are small matrices (e.g. 16×16 × 16×8)
```

That's hundreds of multiply-adds at once, in a single hardware instruction, using reduced-precision data types (FP16, BF16, FP8, INT8, and on Blackwell, FP4). The tensor core's operands come from registers; it produces results into registers; the warp of threads acts as a cooperative front-end, feeding the machine.

Numbers, for scale. An H100 SXM can deliver:

<div class="numbers" markdown>
<div class="cell"><div class="n">67 TFLOPs</div><div class="l">FP32 — regular CUDA cores</div></div>
<div class="cell"><div class="n">989 TFLOPs</div><div class="l">BF16 — tensor cores</div></div>
<div class="cell"><div class="n">1,979 TFLOPs</div><div class="l">FP8 — tensor cores (sparse: ~2× more)</div></div>
</div>

A ~15× jump going from CUDA cores at FP32 to tensor cores at BF16. The ratio is even more extreme at FP8. **If you aren't using tensor cores for your LLM math, you are leaving about 90% of the chip on the table.** Frameworks like PyTorch, cuBLAS, cuDNN, and FlashAttention ensure your matmuls hit them automatically — but you should know they're there.

## Why reduced precision is everywhere

Notice that tensor cores are fastest at *lower* precision: FP16, BF16, FP8, INT8. That's deliberate. Lower precision means:

- Smaller operands → more fit in registers and shared memory at once.
- Narrower datapaths → more multiplies per cycle at the same silicon cost.
- Less memory bandwidth consumed per value.

For LLM inference, the industry has mostly converged on:

- **BF16 or FP16** for training and higher-quality inference.
- **FP8** for aggressive inference on H100/Blackwell-class GPUs.
- **INT8, INT4** for quantized inference, especially for weights.

Each step down trades a little bit of numerical accuracy for large gains in throughput and memory footprint. Transformers are surprisingly robust to this — the attention and feedforward layers can absorb a lot of rounding without visible quality loss if calibrated well.

<div class="analogy" markdown>
A stamping press that runs at half the pressure but twice the speed still produces more parts per hour — as long as the parts meet spec. Quantization is the industry's ongoing calibration: how low can we turn the pressure before the parts start failing quality control?
</div>

## Sparsity: getting away with less

Hopper and Blackwell tensor cores support **2:4 structured sparsity** — if, in every group of 4 weights, you can zero out 2, the tensor core will skip those multiplications and run twice as fast. Not all models tolerate this, but for those that do (often enabled via pruning + fine-tuning), it's nearly a free 2×.

The direction of travel is clear: each new generation makes tensor cores wider, cheaper in power, and better at lower-precision and sparsity formats. The CUDA cores are along for the ride.

## How a warp uses a tensor core

You don't program a tensor core one thread at a time. A tensor core instruction is issued by a **whole warp cooperatively** — each thread contributes its piece of the operands and collects its piece of the result. CUDA exposes this through APIs like `wmma` (Warp Matrix Multiply Accumulate) and its successor `wgmma` (Warp Group Matrix Multiply Accumulate) on Hopper:

```cuda
// Conceptually (CUDA WMMA):
wmma::fragment<matrix_a, 16, 16, 16, half> a_frag;
wmma::fragment<matrix_b, 16, 16, 16, half> b_frag;
wmma::fragment<accumulator, 16, 16, 16, float> c_frag;

wmma::load_matrix_sync(a_frag, A_ptr, 16);
wmma::load_matrix_sync(b_frag, B_ptr, 16);
wmma::mma_sync(c_frag, a_frag, b_frag, c_frag);  // tensor-core op
wmma::store_matrix_sync(C_ptr, c_frag, 16, wmma::mem_row_major);
```

You rarely write this yourself. cuBLAS and cuDNN contain millions of lines of hand-tuned kernels that dispatch to the right tensor-core instructions for each GPU generation. FlashAttention's entire value proposition is a carefully orchestrated dance of tensor-core `mma` instructions with clever memory management, hidden behind a clean API.

## Why this matters for LLM intuition

A transformer forward pass is, arithmetically, ~99% matrix multiplication. Everything else — layer norms, activations, elementwise adds — is a rounding error next to the matmuls. The matmuls run on tensor cores. The tensor cores are so fast that they are almost never the bottleneck.

This is why every LLM performance story ends up being a memory story: the tensor cores can process data faster than HBM can deliver it, so the only way to make things faster is to move less data. Quantization, FlashAttention, operator fusion, KV cache compression — all aimed at the same thing: **keep the power tools fed.**

<div class="analogy" markdown>
The hydraulic press runs at full pressure for about 0.3 seconds before standing idle waiting for the next sheet of metal. The factory manager's job is not to buy a faster press. It's to hire more forklifts.
</div>

## What to take away

- Tensor cores are **specialized matrix-multiply engines**, one small matmul per cycle.
- They dominate a GPU's compute throughput — ~15× more than CUDA cores on the same chip.
- They work at lower precisions (FP16/BF16/FP8/INT8) — which is why quantization is so central to modern LLMs.
- They are fed cooperatively by a warp, usually via library-provided kernels.
- On modern LLM workloads, they are **almost never the bottleneck**. Memory is.

That last point is the bridge to Part 3: once you understand that tensor cores are waiting on memory, the design of an LLM inference engine becomes very legible.

Next: [Part 3 — LLM Inference →](../03-llm-inference/index.md)

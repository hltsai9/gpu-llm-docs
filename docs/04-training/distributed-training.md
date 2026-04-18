# Distributed training

A 70B model in BF16 training state needs roughly 800 GB of memory. The biggest single GPU in common use is 141 GB (H200). So training a frontier-scale model is, by necessity, a *distributed systems* problem.

This chapter is about *how* that distribution happens — the three parallelism axes, the ZeRO / FSDP family of memory shards, and the choices a practitioner actually has to make.

## The three parallelism axes

When you have many GPUs and one model, you can split the work along one or more of:

1. **Data parallel** — every GPU holds a full copy of the model, each processes a different slice of the batch. Gradients are averaged at the end of the step.
2. **Tensor parallel** — a single matrix multiply is split across GPUs. Each GPU holds a slice of the weights; activations are reassembled after each op.
3. **Pipeline parallel** — different *layers* live on different GPUs. Activations flow through like a pipeline, with batches split into micro-batches so multiple stages can overlap.

In practice, frontier-scale training uses all three at once (**3D parallelism**). For most smaller runs, one or two axes are enough.

<div class="analogy" markdown>
If a single recipe is too big for one cook:
— **Data parallel:** give each cook the whole recipe but a different pile of ingredients; merge results at the end.
— **Tensor parallel:** give each cook one third of every step in the recipe — they're all working the same stage but on different shelves of the recipe page.
— **Pipeline parallel:** give cook 1 chapter 1, cook 2 chapter 2, cook 3 chapter 3; hand the dish down the line.
</div>

## Data parallel — the simple starting point

Every GPU has a full copy of the model and optimizer state. Each gets a different slice of the batch. At the end of the backward pass, gradients are averaged across GPUs (via **all-reduce** — a collective operation on NVLink or InfiniBand).

**Pros:**

- Simple. Works with almost any model.
- Scales linearly up to the point where communication cost starts to dominate.

**Cons:**

- **Every GPU needs enough memory for the whole model plus its training state.** For big models, that's the ceiling.
- Gradient all-reduce is pure network traffic; at hundreds of GPUs it becomes the bottleneck.

Rule of thumb: **use data parallel up to the size where one GPU can't hold the training state.** Above that, you need memory sharding (ZeRO/FSDP) or tensor parallel.

## ZeRO / FSDP — sharded data parallel

Most "data parallel" training at scale is actually **sharded data parallel**: the optimizer state, gradients, and/or parameters are split across GPUs so no single GPU has to hold all of them. Two equivalent lineages exist:

- **DeepSpeed ZeRO** (Microsoft, 2019) — three stages of increasing sharding.
- **PyTorch FSDP** (Fully Sharded Data Parallel) — PyTorch-native equivalent, now the default for most new training code.

The ZeRO stages:

- **ZeRO-1:** shard the optimizer state. Cuts training memory roughly 4× vs. pure data parallel (Adam state is the biggest term).
- **ZeRO-2:** also shard gradients. Another 2× saving, at the cost of more communication.
- **ZeRO-3 / FSDP:** shard parameters too. Each GPU only materializes the current layer's weights during forward/backward, gathering them from peers as needed. Maximum memory savings, highest communication cost.

The practical guidance:

- Start with **ZeRO-1 or FSDP with `SHARD_GRAD_OP`** — most of the savings for the least communication.
- Go to **ZeRO-3 / full FSDP** only if you still can't fit, because its network cost can be significant for models with small hidden dimensions.
- On well-connected nodes (NVLink + InfiniBand), ZeRO-3 scales much better than on loosely-connected clusters.

<div class="numbers" markdown>
<div class="cell"><div class="n">4×</div><div class="l">Memory savings from ZeRO-1 (optimizer sharded)</div></div>
<div class="cell"><div class="n">~8×</div><div class="l">ZeRO-2 (gradients also sharded)</div></div>
<div class="cell"><div class="n">~N×</div><div class="l">ZeRO-3 (parameters too), where N is world size</div></div>
</div>

## Tensor parallel — splitting the matrices

Take a linear layer $Y = X W$ with $W$ of shape $[H, H]$. Split $W$ column-wise into $[H, H/k]$ chunks, one per GPU. Each GPU computes a $[B, L, H/k]$ slice of the output. Concatenate (or all-reduce, depending on the op) at the end.

**Pros:**

- Shrinks activations and weights proportionally to the number of parallel GPUs.
- Good for very wide models (large hidden dim).

**Cons:**

- Communication happens *inside* the layer, not just between steps. Needs very fast interconnect (NVLink within a node).
- Doesn't scale well across machines — put tensor-parallel groups *within* a node, not across.

Typical deployment: tensor-parallel degree of 4 or 8 within a node (one NVLink-connected group), data parallel across nodes.

## Pipeline parallel — splitting by layer

Layers 1–20 live on GPU 1, layers 21–40 on GPU 2, and so on. A batch is split into micro-batches so that while GPU 2 is processing micro-batch 1, GPU 1 can start on micro-batch 2.

**Pros:**

- Reduces per-GPU activation memory dramatically (only one "stage" of layers lives per GPU).
- Communication is point-to-point between neighbors — less total traffic than all-reduces.

**Cons:**

- **Pipeline bubble:** early GPUs are idle waiting for the first micro-batch to reach them, and late GPUs are idle waiting for the last micro-batch to depart. Smaller batches hit the bubble harder.
- Implementation is intricate. Debugging a pipeline schedule is someone's full-time job.

In practice, pipeline parallel is used in frontier-scale training combined with tensor and data parallel. For most small and medium runs, skip it.

## Putting it together: 3D parallelism

Frontier-scale training typically combines:

- **Tensor parallel** within a node (e.g., 8-way TP across NVLink-connected GPUs).
- **Pipeline parallel** across a small number of nodes.
- **Data parallel** across the rest, often sharded (FSDP/ZeRO).

Example: training a 70B model on 512 H100s might use 8-way TP, 4-way PP, and 16-way data parallel. The topology is chosen to keep heavy traffic within NVLink boundaries and lighter traffic across InfiniBand.

Not every practitioner needs this. For a team fine-tuning a 7B or 13B model on 8–32 GPUs, FSDP alone is usually plenty.

## Communication cost: the hidden bottleneck

Distributed training is a memory-bandwidth problem between nodes just as much as it is within a GPU. Key metrics:

- **NVLink bandwidth** (intra-node GPU-to-GPU): ~900 GB/s on Hopper. Very fast.
- **InfiniBand bandwidth** (inter-node): ~400 Gb/s = ~50 GB/s for a single NIC on modern clusters. Much slower than NVLink.

Design your parallelism to put the heaviest traffic where the bandwidth is. Tensor parallel generates the most traffic; put it where NVLink is. Data parallel gradient all-reduce is more forgiving; it can go across InfiniBand.

<div class="analogy" markdown>
Within a node, GPUs talk to each other via a fast local highway. Between nodes, the bandwidth drops an order of magnitude. A good parallelism plan puts the chatty conversations in the same room and the quiet updates across the office.
</div>

## MFU: the number to watch

**Model FLOPs Utilization** is the fraction of theoretical peak FLOPs you are actually sustaining end-to-end during a training step. It's the single best metric for "am I using this cluster well?"

Good targets:

- **30–50% MFU on well-tuned dense transformer training** is the going rate for BF16 on H100. Higher is excellent.
- **Below 25% MFU** usually indicates a bottleneck — activation memory, communication, or data loading.
- **50%+** is what the frontier labs report; getting there requires careful co-design of architecture, precision, and parallelism.

If your MFU is low, the diagnostic order:

1. Is the data loader starving the GPU? (Check CPU utilization and prefetch queues.)
2. Is communication time a large fraction of step time? (NCCL profiling.)
3. Are you bottlenecked on activation recomputation?
4. Are your tensor-parallel groups crossing NVLink boundaries?

## Checkpointing and fault tolerance

Training runs are long. GPUs fail. Checkpoints are not optional. Key considerations:

- **Checkpoint frequency.** Often every 100–1000 steps. Too frequent wastes bandwidth; too infrequent loses hours on failure.
- **Checkpoint size.** A 70B model in FP32 master-weight form is ~280 GB. Saving one to remote storage can take minutes.
- **Resume behavior.** Test it. Many teams discover their resume doesn't quite reproduce training only after a real failure.
- **Sharded checkpoints.** Modern frameworks save checkpoints in parallel across ranks; loading is also parallel.

## Cost reality

<div class="numbers" markdown>
<div class="cell"><div class="n">~$4/hr</div><div class="l">On-demand H100 rental, big providers</div></div>
<div class="cell"><div class="n">~2M GPU-hours</div><div class="l">Training a 70B model on 2T tokens at 40% MFU</div></div>
<div class="cell"><div class="n">~$8M</div><div class="l">Rough cost of the above at list rates</div></div>
<div class="cell"><div class="n">~3 weeks</div><div class="l">Wall-clock time on 4096 H100s</div></div>
</div>

This is why most teams *don't* train from scratch. Fine-tuning, in contrast, is usually hundreds of GPU-hours — closer to $1–10k.

## Common mistakes

- **Using ZeRO-3 when ZeRO-1 would do.** Extra communication for no gain if memory wasn't the issue.
- **Tensor-parallel across nodes.** Kills performance. Keep TP within NVLink.
- **Ignoring data loading.** A starved GPU is a slow GPU; sometimes the bottleneck is the dataset pipeline, not the model.
- **Not measuring MFU.** "Training runs" is not a metric. Bytes/sec and tokens/sec are.
- **Skipping warm-up runs.** Kernel autotuning and caching take the first few hundred steps. Measure after warmup.

## In one sentence

Distributed training is about fitting training state onto a cluster while keeping communication off the critical path — pick the smallest parallelism mix that makes the model fit, measure MFU to confirm the cluster is working, and resist reaching for 3D parallelism until you have measured that you need it.

Back to [Part 4 index](index.md).

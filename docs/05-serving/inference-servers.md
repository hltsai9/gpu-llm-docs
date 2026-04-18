# Inference servers

The first time someone in your team says, "let's just run this with `transformers.generate()` in a Flask app," fight the urge to nod. In 2020 that was reasonable. In 2025 you will leave 10–20× of throughput on the table. Modern inference servers exist because the optimizations in [Part 3](../03-llm-inference/index.md) — continuous batching, paged KV cache, prefix caching, speculative decoding — are enormously valuable and none of them are easy to implement well.

This chapter is a field guide to the major options.

## What an inference server actually does

The responsibilities of a modern LLM inference server:

1. **Load the model.** Onto one or many GPUs, at the chosen precision, with any quantization artifacts.
2. **Accept requests.** Over HTTP (REST, OpenAI-compatible) or gRPC.
3. **Schedule.** Fit new requests into the running batch at every decode step (continuous batching).
4. **Manage KV cache.** Allocate pages, evict when full, share prefixes when possible.
5. **Decode efficiently.** CUDA graphs, FlashAttention, fused kernels, tensor-parallel splits.
6. **Stream.** Emit tokens as they're generated, not after the full response.
7. **Quantize.** Support at minimum FP16/BF16, usually also FP8, INT8, and INT4.
8. **Observe itself.** Expose metrics for GPU utilization, batch size, queue depth, tokens/sec, per-request traces.

A hand-rolled server will miss most of these for a long time.

<div class="numbers" markdown>
<div class="cell"><div class="n">~10–20×</div><div class="l">Throughput gap: naive PyTorch vs. vLLM/TGI</div></div>
<div class="cell"><div class="n">~2–4×</div><div class="l">Gap: vLLM vs. TensorRT-LLM, on favorable workloads</div></div>
</div>

## The major options

### vLLM

The most broadly-used open-source LLM inference server. Introduced **PagedAttention** (KV cache as pages, like OS virtual memory) in 2023, which is now the standard everyone else copied.

- **Maintained by:** community, originally UC Berkeley.
- **Runs on:** NVIDIA (excellent), AMD (growing), Intel (early), TPU (via some forks).
- **Models:** very broad — Llama, Mistral, Qwen, DeepSeek, Mixtral, and most Hugging Face architectures work out of the box.
- **Strengths:** continuous batching, paged KV cache, prefix caching, speculative decoding, solid OpenAI-compatible API, good default configs.
- **Weaknesses:** less raw performance than TensorRT-LLM on NVIDIA for tuned workloads; newer features sometimes land before they're fully stable.

**Pick vLLM if:** you want a production-capable, open-source server that works for most models without a PhD. This is the default choice.

### Text Generation Inference (TGI)

Hugging Face's inference server. Long-standing project, runs behind the Hugging Face Inference Endpoints product.

- **Maintained by:** Hugging Face.
- **Runs on:** NVIDIA, AMD, Intel.
- **Models:** Hugging Face model hub, broadly.
- **Strengths:** tight integration with HF tooling, good tensor-parallel support, Rust-based router with low overhead.
- **Weaknesses:** smaller community than vLLM; feature parity varies by model.

**Pick TGI if:** you're already in the Hugging Face ecosystem, or you want the specific router it provides.

### TensorRT-LLM

NVIDIA's purpose-built, tensor-core-optimized LLM inference library. The highest performance on NVIDIA hardware when tuned.

- **Maintained by:** NVIDIA.
- **Runs on:** NVIDIA only (A100, H100, L40S, Grace, Blackwell).
- **Models:** a curated set, with an engine-building step that compiles the model to a TRT engine.
- **Strengths:** best-in-class latency and throughput on NVIDIA hardware for the supported model set. Tight FP8 support. Custom kernels for common patterns.
- **Weaknesses:** complexity. Engine-building adds an operational step. Model support lags vLLM. Lock-in to NVIDIA.

**Pick TensorRT-LLM if:** you're running on NVIDIA H100/H200/B200, need the last 30% of performance, and have the engineering budget to maintain the engines.

### SGLang

Newer (2024+) server that specializes in **structured workloads** — agent-like flows with tool use, constrained generation, multi-turn prompts with shared prefixes.

- **Maintained by:** community, originated from UC Berkeley.
- **Runs on:** NVIDIA primarily.
- **Strengths:** RadixAttention for aggressive prefix sharing, excellent constrained decoding, strong performance on agent/tool-use workloads where many requests share overlapping prefixes.
- **Weaknesses:** newer; smaller community; less battle-tested than vLLM/TGI for pure text completion.

**Pick SGLang if:** your workload is heavy on structured outputs, tool use, or multi-turn conversations with shared prefixes.

### llama.cpp

C++ inference engine originally for running Llama on CPU. Now the standard for Apple Silicon, edge devices, quantized inference on consumer hardware, and desktop apps.

- **Maintained by:** community.
- **Runs on:** everything. CPU, Apple Metal, CUDA, Vulkan, ROCm, OpenCL.
- **Strengths:** portability, small binary, extensive quantization options (GGUF format), low operational overhead. The only serious option for Apple Silicon and CPU-only deployments.
- **Weaknesses:** not designed for high-concurrency server workloads. For heavy-batched GPU serving, use vLLM or TGI.

**Pick llama.cpp if:** you're running on Apple Silicon, CPUs, edge hardware, or inside a desktop application. Also a strong default for single-user local inference.

### Ollama

A user-friendly wrapper around llama.cpp that makes local model management trivial (`ollama run llama3`). Not a production serving framework, but worth knowing about for developer laptops and internal tools.

### Other options worth knowing

- **MLC LLM** — compiles models for edge, WebGPU, mobile. Useful for novel deployment targets.
- **DeepSpeed-Inference / DeepSpeed-MII** — Microsoft's equivalent. Less widely used than vLLM now.
- **OpenLLM / BentoML** — packaging layers that wrap vLLM or other servers with lifecycle management.
- **Ray Serve / Nvidia Triton** — orchestration layers that can sit in front of vLLM/TensorRT-LLM to add routing, autoscaling, and multi-model management.

## How to choose

A decision tree that holds for most teams:

1. **Single user, laptop or desktop?** llama.cpp or Ollama.
2. **Apple Silicon or CPU-only?** llama.cpp.
3. **Need max performance on NVIDIA + have engineering bandwidth?** TensorRT-LLM.
4. **Heavy agent/tool-use workload?** SGLang.
5. **Everything else?** vLLM is the default.

**Don't build your own serving layer** unless (a) you've tried the above and one is missing a critical feature, and (b) you have the engineering capacity to sustain it. The gap from "hand-rolled loop" to "vLLM" is a person-year of work.

## Operational comparison

| Dimension | vLLM | TGI | TensorRT-LLM | SGLang | llama.cpp |
|---|---|---|---|---|---|
| OSS license | Apache 2.0 | Apache 2.0 | Apache 2.0 | Apache 2.0 | MIT |
| NVIDIA perf | Very good | Good | Best | Very good | Good |
| AMD support | Growing | Yes | No | Limited | Yes |
| Apple Silicon | No | No | No | No | Excellent |
| CPU | No | No | No | No | Excellent |
| OpenAI API | Yes | Yes | Via wrapper | Yes | Via wrapper |
| Model coverage | Broad | Broad | Curated | Moderate | Very broad |
| Operational complexity | Low | Low | High (engine build) | Medium | Very low |

## Common mistakes

- **Leaving defaults.** Max batch size, tensor-parallel degree, KV cache fraction — all have defaults that work but rarely match your workload. Tune for your traffic shape.
- **Running in eager mode.** For production, compile (TorchInductor, CUDA graphs, or a TRT engine). The speedup is substantial and the cost is one-time.
- **One process per GPU on a multi-GPU server.** For tensor parallelism across GPUs, you want *one process* spanning them, not one per GPU.
- **Autoscaling on CPU metrics.** LLM pods are bottlenecked on GPU work. Scale on tokens-per-second, queue depth, or KV cache utilization. See [cluster ops](cluster-ops.md).

## In one sentence

Pick vLLM by default, llama.cpp for edge/Apple, TensorRT-LLM when you need the last drop of NVIDIA performance, and SGLang for heavy structured/agent workloads — and don't roll your own.

Next: [Continuous batching →](continuous-batching.md)

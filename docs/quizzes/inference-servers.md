# Quiz — Inference servers

Six questions on picking and operating vLLM, TGI, TensorRT-LLM, SGLang, and llama.cpp. Chapter: [Inference servers](../05-serving/inference-servers.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> A Python team wants to put a Llama-3 70B model behind an internal API. What's the default recommendation in 2025?",
      "choices": {
        "A": "Write a custom serving loop around transformers.generate() with manual batching and KV cache management",
        "B": "Use vLLM with continuous batching, paged KV cache, and prefix caching all included",
        "C": "Build on TensorRT-LLM for maximum performance and hardware-specific optimization",
        "D": "Use llama.cpp since it has the simplest API and fastest model loading"
      },
      "explain": "<p>vLLM is the default serving framework for NVIDIA GPUs with good reason: continuous batching, paged KV cache, prefix caching, and speculative decoding all ship in the box. TensorRT-LLM wins on raw perf but requires engine-building and ongoing engineering. llama.cpp is for Apple/CPU/edge. A hand-rolled loop leaves 10–20× throughput on the table.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What does vLLM's PagedAttention do?",
      "choices": {
        "A": "It swaps attention weights between HBM and CPU RAM to support longer context windows for individual requests",
        "B": "It splits attention computation across multiple GPUs within a single node to parallelize the work",
        "C": "It manages the KV cache in fixed-size pages (like OS virtual memory), avoiding memory fragmentation",
        "D": "It replaces softmax with a numerical method that reduces overflow and underflow errors"
      },
      "explain": "<p>PagedAttention treats the KV cache like OS virtual memory — fixed-size pages instead of contiguous per-request buffers. That's what lets continuous batching add and remove requests cleanly, enables prefix sharing across users, and why every other modern server has copied the idea.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> When is TensorRT-LLM the right choice over vLLM?",
      "choices": {
        "A": "You need maximum performance on NVIDIA hardware and have engineers to maintain engine builds",
        "B": "You want to run the same serving code on multiple hardware vendors without recompilation",
        "C": "You need a single binary that works efficiently on both CPU and GPU simultaneously",
        "D": "Your team is new to machine learning ops and needs the easiest solution"
      },
      "explain": "<p>TensorRT-LLM offers best-in-class NVIDIA performance but with real operational costs: engine-building is a compile step, model support lags, and you're locked into NVIDIA. The perf gain is real (~2-4× vs. vLLM on favorable workloads) but so is the engineering tax. Worth it only at scale.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What workload profile is SGLang specifically good for?",
      "choices": {
        "A": "Optimizing time-to-first-token for single request latency benchmarks",
        "B": "CPU-only inference without any GPU acceleration available",
        "C": "Training pipelines that frequently checkpoint model weights between epochs",
        "D": "Agent workflows with structured generation and many overlapping system prompts"
      },
      "explain": "<p>SGLang specializes in agent and tool-use workloads where requests share long overlapping prefixes. RadixAttention stores a trie of shared prefixes for aggressive prefix sharing, and constrained decoding is first-class. For plain text completion, vLLM is usually still the default; for heavy structured workloads, SGLang shines.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> A developer wants to run a 13B model on their MacBook. What's the natural choice?",
      "choices": {
        "A": "vLLM, which has native Metal GPU support for Apple Silicon",
        "B": "llama.cpp with GGUF quantization for efficient Apple Silicon inference",
        "C": "TensorRT-LLM compiled for ARM architecture on macOS",
        "D": "SGLang with constrained decoding for structured outputs"
      },
      "explain": "<p>llama.cpp is the standard for Apple Silicon and CPUs. It uses the GGUF quantization format, has tiny operational overhead, and runs well on unified-memory Macs. Ollama wraps it with a friendlier CLI. vLLM doesn't run on Metal; TensorRT-LLM is NVIDIA-only.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> What's the main reason not to build your own LLM serving layer?",
      "choices": {
        "A": "Most open-source licenses prohibit custom serving implementations entirely",
        "B": "Performance in compiled languages like Rust will always lag behind Python significantly",
        "C": "Continuous batching, paged KV, chunked prefill, and CUDA graphs require person-years of engineering",
        "D": "Custom servers cannot stream tokens to clients during decoding like open-source frameworks can"
      },
      "explain": "<p>Modern inference servers bundle a decade of optimizations that would take a small team a year to re-implement. Unless you've tried the majors and one is missing something critical — and you have the engineering capacity to sustain the code — you'll be slower and more bug-prone than vLLM.</p>"
    }
  ]
}
</script>

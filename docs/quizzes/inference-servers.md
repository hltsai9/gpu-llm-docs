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
        "A": "Write a custom serving loop around transformers.generate()",
        "B": "Use vLLM — production-capable, open-source, broad model coverage, OpenAI-compatible API",
        "C": "Build on TensorRT-LLM for maximum performance",
        "D": "Use llama.cpp for its simplicity"
      },
      "explain": "<p>vLLM is the default serving framework for NVIDIA GPUs with good reason: continuous batching, paged KV cache, prefix caching, and speculative decoding all ship in the box. TensorRT-LLM wins on raw perf but requires engine-building and ongoing engineering. llama.cpp is for Apple/CPU/edge. A hand-rolled loop leaves 10–20× throughput on the table.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q2.</strong> What does vLLM's PagedAttention do?",
      "choices": {
        "A": "It swaps attention weights between HBM and CPU RAM for larger context windows",
        "B": "It splits attention across multiple GPUs within a node",
        "C": "It manages the KV cache in fixed-size pages (like OS virtual memory), enabling fragmentation-free allocation across many concurrent requests",
        "D": "It's an alternative to softmax with better numerical properties"
      },
      "explain": "<p>PagedAttention treats the KV cache like OS virtual memory — fixed-size pages instead of contiguous per-request buffers. That's what lets continuous batching add and remove requests cleanly, enables prefix sharing across users, and why every other modern server has copied the idea.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> When is TensorRT-LLM the right choice over vLLM?",
      "choices": {
        "A": "You're locked in on NVIDIA hardware, need the last 20–30% of performance, and have engineering capacity to maintain compiled engines",
        "B": "You want broad hardware portability",
        "C": "You need to deploy the same binary on CPU and GPU",
        "D": "Your team has zero MLOps experience"
      },
      "explain": "<p>TensorRT-LLM offers best-in-class NVIDIA performance but with real operational costs: engine-building is a compile step, model support lags, and you're locked into NVIDIA. The perf gain is real (~2-4× vs. vLLM on favorable workloads) but so is the engineering tax. Worth it only at scale.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> What workload profile is SGLang specifically good for?",
      "choices": {
        "A": "Single-request latency benchmarks",
        "B": "Pure CPU serving",
        "C": "Training workloads with frequent checkpointing",
        "D": "Structured/agent-like flows with constrained generation and many overlapping prefixes (RadixAttention)"
      },
      "explain": "<p>SGLang specializes in agent and tool-use workloads where requests share long overlapping prefixes. RadixAttention stores a trie of shared prefixes for aggressive prefix sharing, and constrained decoding is first-class. For plain text completion, vLLM is usually still the default; for heavy structured workloads, SGLang shines.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> A developer wants to run a 13B model on their MacBook. What's the natural choice?",
      "choices": {
        "A": "vLLM",
        "B": "llama.cpp (or Ollama, which wraps it)",
        "C": "TensorRT-LLM",
        "D": "SGLang"
      },
      "explain": "<p>llama.cpp is the standard for Apple Silicon and CPUs. It uses the GGUF quantization format, has tiny operational overhead, and runs well on unified-memory Macs. Ollama wraps it with a friendlier CLI. vLLM doesn't run on Metal; TensorRT-LLM is NVIDIA-only.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q6.</strong> What's the main reason not to build your own LLM serving layer?",
      "choices": {
        "A": "Open-source licenses forbid it",
        "B": "It's impossible to match Python's performance in Rust",
        "C": "The gap from a hand-rolled loop to vLLM is roughly a person-year of work — continuous batching, paged KV, chunked prefill, prefix caching, CUDA graphs all have to be reimplemented",
        "D": "Custom servers can't support streaming"
      },
      "explain": "<p>Modern inference servers bundle a decade of optimizations that would take a small team a year to re-implement. Unless you've tried the majors and one is missing something critical — and you have the engineering capacity to sustain the code — you'll be slower and more bug-prone than vLLM.</p>"
    }
  ]
}
</script>

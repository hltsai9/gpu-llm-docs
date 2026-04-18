# Quiz — Continuous batching

Six questions on iteration-level batching and the throughput wins it unlocks. Chapter: [Continuous batching](../05-serving/continuous-batching.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> What's wrong with <em>static</em> batching in the style of \"collect N requests, pad to the longest, run one big forward pass\"?",
      "choices": {
        "A": "Modern GPUs can't handle padded tensors",
        "B": "Static batching requires exclusively FP32 precision",
        "C": "Head-of-line blocking: one request generating 1000 tokens holds up every other request in its batch, wasting compute and leaving the GPU idle between batches",
        "D": "Static batches can't use tensor cores"
      },
      "explain": "<p>Static batching is limited by the slowest request in the batch. Short replies wait under the heat lamp while the long one cooks; the GPU sits idle between batches. Continuous batching fixes this by adding and removing requests at every decode step — no waiting, no padding to the longest.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Why is it <em>possible</em> to switch requests in and out at every decode step?",
      "choices": {
        "A": "Each decode step produces exactly one new token per request; the work decomposes into per-request, per-step units with no coupling to the previous or next step's batch composition",
        "B": "Modern transformers are stateless",
        "C": "All requests in a batch must agree on a token at each step",
        "D": "Decoding is a single-user operation"
      },
      "explain": "<p>The decode loop fundamentally processes one token per request per step. That means the batch at step t+1 doesn't have to match the batch at step t — you can add, remove, or re-order at any step boundary. This is why continuous batching works and why static batching is leaving huge throughput on the table.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Continuous batching depends on which three infrastructure pieces?",
      "choices": {
        "A": "FP8 tensor cores, NVLink, and InfiniBand",
        "B": "Speculative decoding, MoE routing, and LoRA hot-swap",
        "C": "CPU offload, disk swap, and zero-copy RDMA",
        "D": "Paged KV cache (to allocate/free pages per request), efficient single-step kernels (CUDA graphs), and a request-level scheduler"
      },
      "explain": "<p>Without paged KV cache, per-request allocation fragments memory. Without efficient single-step kernels, the per-step cost makes the frequent scheduling too expensive. Without a scheduler, you can't decide which pending request enters the batch next. All three need to be solid — which is why rolling your own is so hard.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> Once continuous batching is working, the new bottleneck is typically:",
      "choices": {
        "A": "Disk I/O for model weights",
        "B": "KV cache capacity — how many requests' caches fit in HBM simultaneously",
        "C": "Tokenizer throughput on CPU",
        "D": "CUDA kernel launch overhead"
      },
      "explain": "<p>Continuous batching makes GPU compute roughly optimal. What limits concurrency then is KV cache memory — each in-flight request occupies some KV pages, and when they fill HBM, new requests must wait or existing ones must be preempted/evicted. Tuning max_num_seqs and KV cache fraction becomes the next lever.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What does <em>chunked prefill</em> solve?",
      "choices": {
        "A": "It compresses input prompts with dictionary encoding",
        "B": "It caches the prefill results to disk",
        "C": "It splits a long prefill into chunks and interleaves them with decode steps, so existing decoding requests don't stall while a new long prompt is being processed",
        "D": "It moves prefill to a second GPU"
      },
      "explain": "<p>A long prefill is compute-heavy and can block decode for other users. Chunked prefill breaks the prefill into smaller pieces that can be interleaved with decode steps across the batch, keeping decode responsive. Most modern serving frameworks support it; leaving it off is a common tuning mistake.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Prefix sharing in a continuous-batching server saves cost when:",
      "choices": {
        "A": "Many concurrent requests share a long system prompt — the prefix's KV pages are computed once and shared, and the prefill step is skipped for the shared portion",
        "B": "All users ask exactly the same question",
        "C": "The system prompt changes on every request",
        "D": "Only the first token of each request matters"
      },
      "explain": "<p>If user A and user B share a long system prompt, their KV cache for that prefix is identical. Paged attention lets them point to the same pages — one computation, two (or more) readers — halving cache usage and skipping the prefill for the shared part. For chat apps with a fixed system prompt, this is free throughput.</p>"
    }
  ]
}
</script>

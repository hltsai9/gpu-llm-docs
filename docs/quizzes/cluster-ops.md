# Quiz — GPU cluster operations

Six questions on running an LLM fleet reliably: autoscaling, MIG, observability, cold-start. Chapter: [GPU cluster operations](../05-serving/cluster-ops.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> A team autoscales their LLM pods on CPU utilization. What's likely to go wrong?",
      "choices": {
        "A": "Nothing — CPU utilization is the right signal for LLM serving",
        "B": "Pods will overscale because CPUs are always busy",
        "C": "CPU is not the bottleneck; the GPU is. Scaling on tokens/sec, queue depth, KV cache utilization, or TTFT catches real load; CPU barely moves while the GPU maxes out",
        "D": "Only GPU utilization (nvidia-smi %) works as a signal"
      },
      "explain": "<p>LLM pods are bottlenecked on GPU work. CPU can look fine while the GPU is saturated. Use framework-exposed metrics (tokens/sec, queue depth, KV cache %) via KEDA or Prometheus Adapter. nvidia-smi's % is also a poor signal because it reflects kernel occupancy, not useful work.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Why is autoscaling LLM pods reactively (\"when load is high, add replicas\") usually too slow?",
      "choices": {
        "A": "Kubernetes doesn't support fast scaling",
        "B": "Cold-start for an LLM pod is minutes — image pull, model weight load (50–150 GB), CUDA graph capture, warm-up — so by the time new pods are serving, the load spike may be over",
        "C": "Autoscalers can't schedule GPU workloads at all",
        "D": "Replicas must be powered off between uses"
      },
      "explain": "<p>A web pod starts in seconds; an LLM pod takes minutes. Reactive autoscaling hits the peak just as capacity arrives, which is too late. Either pre-provision headroom, predict demand from upstream signals (front-page traffic, business hours), or keep warm standby replicas.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> When is <em>MIG</em> (Multi-Instance GPU) useful on an A100/H100?",
      "choices": {
        "A": "Running many small models on one large GPU with hardware-enforced isolation between tenants",
        "B": "Serving a single large model that needs all the GPU's HBM",
        "C": "Training at frontier scale across many nodes",
        "D": "Edge deployment on Apple Silicon"
      },
      "explain": "<p>MIG partitions a single GPU into up to 7 smaller, isolated GPUs — great for multi-tenant inference of small models, or for giving developers cheap per-slice access. It's <em>not</em> right for serving a large model (you lose NVLink between partitions) or dynamic workloads (reconfiguring MIG requires a reboot).</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> On an LLM serving dashboard, which of these is NOT a GPU-era signal you actually need?",
      "choices": {
        "A": "TTFT (time to first token) P50 / P95",
        "B": "KV cache utilization",
        "C": "Running batch size and queue depth",
        "D": "Average CPU load per replica"
      },
      "explain": "<p>CPU load is a CPU-era proxy that barely correlates with LLM health. The signals that matter: per-request TTFT and TPOT, batch size, queue depth, KV cache %, tokens/sec, HBM used. A healthy-looking CPU graph tells you nothing about whether the GPU is overloaded.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> Why do tensor-parallel workloads require special scheduling in Kubernetes?",
      "choices": {
        "A": "They need dedicated nodes with no other pods",
        "B": "They require AMD GPUs",
        "C": "TP groups need multiple GPUs on the <em>same</em> node (for NVLink), so nodeSelector or labels like gpu-count=8 are needed to target hosts with enough co-located GPUs",
        "D": "They must run exclusively on preemptible instances"
      },
      "explain": "<p>Tensor parallel traffic only performs at NVLink bandwidth. If TP groups get split across nodes (onto InfiniBand), throughput craters. Kubernetes by default doesn't know this, so you label nodes and constrain pod placement to keep TP groups co-located.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> What's the value of keeping an old model version warm for at least a week after a deploy?",
      "choices": {
        "A": "It reduces the memory footprint of the new version",
        "B": "If the new deploy causes a silent quality regression, you can route traffic back instantly — rollback from a cold start takes minutes and makes every bad minute worse",
        "C": "Kubernetes requires two versions at all times",
        "D": "Old versions run on different hardware"
      },
      "explain": "<p>Model-version regressions often show up as subtle quality drift, not hard errors. Instant rollback means your response to \"users are complaining\" is seconds, not minutes. Paying for a warm spare for a week is cheap insurance compared to an hour of degraded output going to every user.</p>"
    }
  ]
}
</script>

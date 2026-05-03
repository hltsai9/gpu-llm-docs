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
        "A": "Nothing — CPU utilization is the standard metric for scaling inference workloads",
        "B": "Autoscaler will overscale because CPUs are continuously running background tasks",
        "C": "GPU is the real bottleneck, not CPU; use tokens/sec, queue depth, or KV cache % instead",
        "D": "Only nvidia-smi % can be used reliably, other GPU signals are noise"
      },
      "explain": "<p>LLM pods are bottlenecked on GPU work. CPU can look fine while the GPU is saturated. Use framework-exposed metrics (tokens/sec, queue depth, KV cache %) via KEDA or Prometheus Adapter. nvidia-smi's % is also a poor signal because it reflects kernel occupancy, not useful work.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Why is autoscaling LLM pods reactively (\"when load is high, add replicas\") usually too slow?",
      "choices": {
        "A": "Kubernetes control plane doesn't have fast enough scaling APIs",
        "B": "LLM pod cold-start takes minutes: image pull, weight loading, CUDA graphs, warmup",
        "C": "Kubernetes autoscalers fundamentally cannot schedule GPU workloads",
        "D": "Each replica must power-cycle before it can start serving traffic again"
      },
      "explain": "<p>A web pod starts in seconds; an LLM pod takes minutes. Reactive autoscaling hits the peak just as capacity arrives, which is too late. Either pre-provision headroom, predict demand from upstream signals (front-page traffic, business hours), or keep warm standby replicas.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> When is <em>MIG</em> (Multi-Instance GPU) useful on an A100/H100?",
      "choices": {
        "A": "Running multiple small models on one GPU with tenant isolation",
        "B": "Serving one large model using the entire GPU's memory",
        "C": "Large-scale training workloads across many nodes",
        "D": "Deploying edge inference on Apple Silicon hardware"
      },
      "explain": "<p>MIG partitions a single GPU into up to 7 smaller, isolated GPUs — great for multi-tenant inference of small models, or for giving developers cheap per-slice access. It's <em>not</em> right for serving a large model (you lose NVLink between partitions) or dynamic workloads (reconfiguring MIG requires a reboot).</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> On an LLM serving dashboard, which of these is NOT a GPU-era signal you actually need?",
      "choices": {
        "A": "TTFT (time to first token) at P50 and P95 percentiles",
        "B": "How much KV cache memory is currently being used",
        "C": "Current batch size and requests waiting in queue",
        "D": "Average CPU load percentage across the replicas"
      },
      "explain": "<p>CPU load is a CPU-era proxy that barely correlates with LLM health. The signals that matter: per-request TTFT and TPOT, batch size, queue depth, KV cache %, tokens/sec, HBM used. A healthy-looking CPU graph tells you nothing about whether the GPU is overloaded.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> Why do tensor-parallel workloads require special scheduling in Kubernetes?",
      "choices": {
        "A": "Tensor-parallel workloads must have exclusive nodes with no competing pods",
        "B": "Tensor-parallel only works on AMD GPUs with specific interconnects",
        "C": "TP requires co-located GPUs on one node for NVLink; use nodeSelector/labels",
        "D": "Tensor-parallel cannot run on preemptible/spot instances reliably"
      },
      "explain": "<p>Tensor parallel traffic only performs at NVLink bandwidth. If TP groups get split across nodes (onto InfiniBand), throughput craters. Kubernetes by default doesn't know this, so you label nodes and constrain pod placement to keep TP groups co-located.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> What's the value of keeping an old model version warm for at least a week after a deploy?",
      "choices": {
        "A": "It reduces the total memory requirement by sharing weights with the new version",
        "B": "Instant traffic rollback if the new version has quality issues; cold restart takes minutes",
        "C": "Kubernetes cluster requirements mandate at least two active versions simultaneously",
        "D": "Legacy model versions run on different hardware than the current generation"
      },
      "explain": "<p>Model-version regressions often show up as subtle quality drift, not hard errors. Instant rollback means your response to \"users are complaining\" is seconds, not minutes. Paying for a warm spare for a week is cheap insurance compared to an hour of degraded output going to every user.</p>"
    }
  ]
}
</script>

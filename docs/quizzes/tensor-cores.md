# Quiz — Tensor Cores

Six questions on the matmul power tools. Chapter: [Tensor Cores: power tools](../02-gpu-architecture/tensor-cores.md).

<div class="quiz">

<div class="q" data-answer="C">
<p class="stem"><strong>Q1.</strong> Roughly how much faster are tensor cores at BF16 compared to CUDA cores at FP32 on the same H100?</p>
<button data-choice="A">About the same</button>
<button data-choice="B">~2×</button>
<button data-choice="C">~15×</button>
<button data-choice="D">~1,000×</button>
<div class="explain"><p>H100: ~67 TFLOPs FP32 on CUDA cores vs ~989 TFLOPs BF16 on tensor cores — about a 15× jump. Miss the tensor cores and you're leaving most of the chip on the table.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q2.</strong> A single tensor-core instruction computes…</p>
<button data-choice="A">One multiply-add on scalars</button>
<button data-choice="B">A small matrix multiply-accumulate (e.g., 16×16 × 16×8 → 16×8)</button>
<button data-choice="C">A full attention operation</button>
<button data-choice="D">A single convolution layer</button>
<div class="explain"><p>Tensor cores do matrix-matrix ops in hardware. A CUDA core multiplies scalars; a tensor core stamps out entire small matmuls per cycle.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q3.</strong> Which of these precisions is <em>fastest</em> on Hopper-generation tensor cores?</p>
<button data-choice="A">FP64</button>
<button data-choice="B">FP32</button>
<button data-choice="C">FP16</button>
<button data-choice="D">FP8 (or INT8)</button>
<div class="explain"><p>Lower precision = smaller operands = more multiplies per cycle at the same silicon cost. FP8 on H100 nearly doubles BF16 throughput. On Blackwell, FP4 goes further still.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q4.</strong> How is a tensor core invoked at the programming level?</p>
<button data-choice="A">By a warp cooperatively — each thread contributes a fragment of the operands and collects a fragment of the result</button>
<button data-choice="B">By a single thread, as an ordinary arithmetic op</button>
<button data-choice="C">Only by the CPU via PCIe</button>
<button data-choice="D">Only from PyTorch Python code, never from CUDA</button>
<div class="explain"><p>Tensor-core instructions are warp-level: all 32 threads participate, each owning a slice of the operands and result. Libraries like cuBLAS, cuDNN, and FlashAttention handle the orchestration.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q5.</strong> What does "2:4 structured sparsity" give you on a Hopper tensor core?</p>
<button data-choice="A">Half the accuracy, no speed change</button>
<button data-choice="B">4× higher clock speed</button>
<button data-choice="C">Roughly 2× more effective compute — if 2 of every 4 weights are zero, those multiplications are skipped</button>
<button data-choice="D">Sparsity only affects memory, not compute</button>
<div class="explain"><p>The hardware recognizes the 2-of-4 pattern and skips half the multiplies, giving ~2× speedup for models (typically pruned and fine-tuned) that tolerate it.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q6.</strong> Why do most performance stories in LLM inference end up being about <em>memory</em> rather than <em>tensor cores</em>?</p>
<button data-choice="A">Tensor cores only work during training</button>
<button data-choice="B">Tensor cores are so fast they finish before HBM can deliver the next tile — the real bottleneck is data movement</button>
<button data-choice="C">Tensor cores are inaccurate at inference</button>
<button data-choice="D">Inference uses CUDA cores, not tensor cores</button>
<div class="explain"><p>A transformer is ~99% matmul, all running on tensor cores that are rarely the bottleneck. The whole optimization playbook — quantization, FlashAttention, KV cache tricks, batching — is about keeping those tensor cores fed.</p></div>
</div>

</div>

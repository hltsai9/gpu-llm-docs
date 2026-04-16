# Quiz — Anatomy of a GPU

Six questions on SMs, CUDA cores, tensor cores, and HBM. Chapter: [Anatomy of a GPU](../02-gpu-architecture/anatomy.md).

<div class="quiz">

<div class="q" data-answer="B">
<p class="stem"><strong>Q1.</strong> An NVIDIA H100 is built from how many Streaming Multiprocessors (SMs)?</p>
<button data-choice="A">32</button>
<button data-choice="B">132</button>
<button data-choice="C">1,024</button>
<button data-choice="D">16,384</button>
<div class="explain"><p>The H100 has 132 SMs — 132 "workshops" that share an L2 cache and HBM. Each SM contains its own cores, schedulers, register file, and shared memory.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> What does the GigaThread engine do?</p>
<button data-choice="A">Runs graphics workloads on the GPU</button>
<button data-choice="B">Boosts clock speeds during heavy kernels</button>
<button data-choice="C">Distributes thread blocks across the SMs when a kernel is launched</button>
<button data-choice="D">Compresses data before writing to HBM</button>
<div class="explain"><p>The GigaThread engine is the chip-wide scheduler. You say "launch this kernel across N blocks"; it decides which SM runs which block, and hands out more blocks as SMs finish.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q3.</strong> Where does shared memory physically live?</p>
<button data-choice="A">Inside each SM — fast, small, private to that SM's thread blocks</button>
<button data-choice="B">In HBM, off-die</button>
<button data-choice="C">In CPU RAM, accessible over PCIe</button>
<button data-choice="D">It's a software fiction backed by L2</button>
<div class="explain"><p>Shared memory (~256 KB per SM on H100) is on-die inside each SM. It's many times faster than HBM and is the "workshop stockroom" where blocks stage data they'll reuse.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> What's the approximate HBM bandwidth on an H100 SXM?</p>
<button data-choice="A">30 GB/s</button>
<button data-choice="B">300 MB/s</button>
<button data-choice="C">300 GB/s</button>
<button data-choice="D">~3 TB/s</button>
<div class="explain"><p>H100 ships ~3.35 TB/s of HBM3 bandwidth through a 5,120-bit memory bus. This is one of the widest memory interfaces in mainstream computing.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q5.</strong> Which on-chip structure actually performs the bulk of LLM arithmetic?</p>
<button data-choice="A">CUDA cores (FP32 scalar ops)</button>
<button data-choice="B">Tensor cores — purpose-built for small matrix multiply-accumulate</button>
<button data-choice="C">The L2 cache</button>
<button data-choice="D">The warp scheduler</button>
<div class="explain"><p>Tensor cores dominate an H100's usable FLOPs: ~989 TFLOPs at BF16 vs ~67 TFLOPs on CUDA cores at FP32. Modern LLM kernels funnel work into tensor cores.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q6.</strong> Why don't tensor cores become the bottleneck during LLM inference?</p>
<button data-choice="A">They finish faster than HBM can feed them — the chip is memory-bound on most workloads</button>
<button data-choice="B">They're too slow for modern models</button>
<button data-choice="C">They're only active during training</button>
<button data-choice="D">CUDA cores do all the real work</button>
<div class="explain"><p>Tensor cores are "overqualified" — they could consume far more data than HBM can deliver. The bottleneck is almost always memory bandwidth, not compute.</p></div>
</div>

</div>

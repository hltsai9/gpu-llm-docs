# GPUs and LLMs — A Story-Driven Guide

A documentation site that explains GPU hardware and how it runs large language models, using analogies (kitchens, factories, cities) to build intuition. Built with [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.

## Site structure

```
gpu-llm-docs/
├── mkdocs.yml                    # Site config + navigation
├── README.md                     # This file
└── docs/
    ├── index.md                  # Homepage
    ├── stylesheets/extra.css     # Custom styling for analogy callouts
    ├── 01-why-gpu/               # Part 1 — Why GPUs
    │   ├── index.md
    │   ├── cpu-vs-gpu.md
    │   ├── throughput-vs-latency.md
    │   └── simt.md
    ├── 02-gpu-architecture/      # Part 2 — GPU Architecture
    │   ├── index.md
    │   ├── anatomy.md
    │   ├── memory-hierarchy.md
    │   ├── warps-threads-blocks.md
    │   └── tensor-cores.md
    └── 03-llm-inference/         # Part 3 — LLM Inference
        ├── index.md
        ├── life-of-a-token.md
        ├── attention.md
        ├── kv-cache.md
        ├── prefill-vs-decode.md
        ├── batching.md
        └── roofline.md
```

## Preview locally

You need Python 3.8+.

```bash
# Install MkDocs Material (includes all extensions used)
pip install mkdocs-material

# From the gpu-llm-docs/ directory:
mkdocs serve
# → open http://127.0.0.1:8000
```

Edits to any `docs/*.md` file or to `mkdocs.yml` will hot-reload.

## Build a static site

```bash
mkdocs build
# → outputs a self-contained static site into ./site/
```

You can deploy `./site/` to GitHub Pages, Netlify, Cloudflare Pages, S3, or any static host. For GitHub Pages specifically:

```bash
mkdocs gh-deploy
```

## Extending the guide

Each chapter is a standalone Markdown file with a light set of custom classes (`analogy`, `hero`, `numbers`) defined in `docs/stylesheets/extra.css`. To add a new chapter:

1. Create the `.md` file under the appropriate `docs/0X-*/` folder.
2. Add it to the `nav:` section in `mkdocs.yml`.
3. Follow the tone of the existing chapters: open with an analogy, keep prose-first, use admonitions (`!!! tip`, `!!! info`) for sidebars, and circle back to the concrete mechanics at the end.

Suggested callouts you can use:

```markdown
<div class="analogy" markdown>
...use this for pull-quote-style analogies...
</div>

!!! tip "A title"
    Use Material admonitions for tips, warnings, info boxes.

<div class="numbers" markdown>
<div class="cell"><div class="n">3 TB/s</div><div class="l">HBM bandwidth</div></div>
...repeat for more scoreboard cells...
</div>
```

Math renders via MathJax (`$inline$` and `$$display$$`).

## Topics covered

**Part 1 — Why GPUs (conceptual foundations)**

- The cafeteria vs. the steakhouse (CPU vs GPU design philosophy)
- Throughput over latency (why per-op speed isn't the goal)
- SIMT (warps in lockstep, divergence, why it matters)

**Part 2 — GPU Architecture (hardware mechanics)**

- Anatomy of a GPU (SMs, CUDA cores, L2, HBM)
- The memory hierarchy (registers → shared → L2 → HBM → RAM → disk)
- Warps, threads, blocks, grids (work organization and scheduling)
- Tensor cores (the matmul power tools)

**Part 3 — LLM Inference (workload × hardware)**

- The life of a token (end-to-end flow)
- Attention, explained slowly (Q/K/V, softmax, masking)
- The KV cache (why it exists, how big it is, how to shrink it)
- Prefill vs. decode (the two-phase split)
- Batching many diners at once (continuous batching, the KV-cache ceiling)
- The roofline (memory-bound vs compute-bound, the unifying model)

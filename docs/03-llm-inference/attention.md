# Attention, explained slowly

Attention is the thing that makes transformers transformers. It's also the thing most often waved past. This chapter walks through it in slow, concrete steps — just enough to understand *why* it's expensive, and *what* the KV cache is actually caching.

## The problem attention solves

Each token in a sequence needs context. *"Bank"* means something very different in *"river bank"* versus *"bank account"*. To understand the current token, the model has to look at other tokens. Which ones? It depends on the sentence. Attention is the mechanism that lets each token **decide for itself which other tokens matter**, and pull information from them.

<div class="analogy" markdown>
Imagine a meeting room where every participant has a sticky note. Before saying anything, each person scans the room, figures out which other participants are most relevant to what they want to contribute, and silently copies useful bits from those participants' sticky notes onto their own. Then each person speaks, using their updated notes. That's attention.
</div>

## Three vectors per token

For each token, the model produces three vectors, computed by three separate matrix multiplications against the token's current representation:

- **Query (Q)** — "what am I looking for?"
- **Key (K)** — "what do I represent?"
- **Value (V)** — "what information do I carry?"

For a hidden size of 4,096, each of Q, K, V is a 4,096-dim vector per token. In practice, modern models split these across **heads** — say, 32 heads of 128 dimensions each, which lets each head pay attention to a different kind of relationship. We'll ignore the multi-head detail for now; the single-head math is the same, just shorter vectors.

## Step 1: Score every pair

Token $i$'s query $Q_i$ gets compared with every token $j$'s key $K_j$ by dot product. Higher dot product = more relevant.

$$
\text{score}_{ij} = \frac{Q_i \cdot K_j}{\sqrt{d_k}}
$$

The $\sqrt{d_k}$ divisor keeps the numbers from blowing up as dimension grows — a nicety for numerical stability, not a core idea.

For a sequence of length $L$, you get an $L \times L$ matrix of scores. Every token scored against every other token.

<div class="analogy" markdown>
Every person in the room (Q) glances at everyone else's sticky note (K). The glance produces a rating: "how relevant is this person to me right now?"
</div>

## Step 2: Softmax — turn scores into weights

Take each row of the score matrix and apply a softmax. This converts raw scores into a probability distribution: for token $i$, how much attention to pay to each other token $j$. The weights are non-negative and sum to 1.

$$
a_{ij} = \frac{\exp(\text{score}_{ij})}{\sum_k \exp(\text{score}_{ik})}
$$

You can read each row of this matrix: *"token $i$ gives 40% of its attention to token 3, 25% to token 7, 10% to itself, and spreads the rest thin."*

## Step 3: Weighted sum of values

For each token $i$, build its new representation as a weighted sum of everyone's value vectors, using the attention weights:

$$
\text{output}_i = \sum_j a_{ij} \, V_j
$$

The output vector for token $i$ is a mixture of information from the tokens it attended to, weighted by the softmax scores. This becomes the input to the next layer.

<div class="analogy" markdown>
Each participant copies bits from the sticky notes of the people they found most relevant, weighted by how relevant each one was. After this round, each person's notes have been updated with useful context from the rest of the room. Do this over and over through the layers, and eventually every participant's note contains a deep summary of the whole meeting.
</div>

## Why this is expensive

Count the operations for a sequence of length $L$ at a hidden size of $d$:

- Computing Q, K, V: three matrix multiplies, each $L \times d \times d$.
- Computing scores $QK^T$: an $L \times d \times L$ matmul → output is $L \times L$.
- Softmax over the $L \times L$ matrix.
- Multiplying by V: an $L \times L \times d$ matmul → output is $L \times d$.

The $QK^T$ and softmax-times-V operations are **quadratic in sequence length**. Double the context, quadruple the attention cost. This is why long-context models are so hard: going from 4K to 128K context isn't 32× more expensive — it's 1,024× more expensive *for the attention operations*, though other parts of the model scale linearly.

<div class="analogy" markdown>
If the meeting doubles in size, every person has twice as many other people to consider. The total number of pairwise glances is $L \times L$, not $L$.
</div>

## Causal attention (for language models)

Language models are **autoregressive** — they generate one token at a time, left-to-right. During generation, token $i$ cannot attend to tokens $j > i$, because those tokens haven't been generated yet. We enforce this with a **causal mask** that sets all scores for "future" positions to $-\infty$ before softmax, making them effectively zero.

This doesn't reduce the computational cost at training time — you still compute the full $L \times L$ matrix and then mask half of it. But it does matter at inference time: since token $i$ only attends to tokens $1..i$, we can compute attention *incrementally*, adding one row at a time as we generate. That incrementality is what makes the KV cache possible.

## Why attention is relatively kind to GPUs (with the right trick)

At first glance, attention looks scary — quadratic cost, a materialized $L \times L$ matrix that for long sequences is bigger than shared memory. Early transformer implementations did materialize that matrix in HBM, and they paid for it: attention was bandwidth-bound on the score matrix read/write.

Enter **FlashAttention** (2022 onwards). The trick: never materialize the full score matrix at all. Tile the computation, recompute parts of the softmax as you go, keep everything in shared memory / registers. Same math, much less HBM traffic.

FlashAttention isn't a new algorithm for attention; it's a new *layout*. It's a kernel that trades a small amount of redundant compute for a massive reduction in memory movement. On the roofline graph (next chapter), it shifts attention from memory-bound-and-sad to happily compute-bound.

<div class="analogy" markdown>
Instead of writing the whole seating chart of glances to a big poster on the wall (HBM) and then reading it back, FlashAttention works in small groups: each cluster of participants does their glances, computes their weighted updates, and writes only the final result to the poster. The scratch work stays on the whiteboard in the cluster (shared memory).
</div>

## Multi-head attention in one paragraph

Modern LLMs don't have one attention; they have many **heads** running in parallel, each with its own Q, K, V projections and each producing a different output. Concatenate the heads' outputs and pass through a final projection. Think of heads as specialists: one might focus on syntactic relationships, another on coreference, another on numerical alignment. Multi-head attention is cheaper than it sounds because the per-head dimension is $d / h$, so total FLOPs don't change — you just get $h$ different lenses at the same cost.

## What to take away

- Attention = each token decides, for itself, which others to listen to, then pulls information from them.
- Three per-token vectors: Q (query), K (key), V (value).
- Scores = $QK^T$, weights = softmax, output = weights $\times$ V.
- Cost is **quadratic in sequence length**.
- FlashAttention removes the memory bottleneck by keeping scratch data on-chip.
- K and V vectors of all past tokens get reused on every new token — which is why we cache them. Next chapter.

Next: [The KV cache →](kv-cache.md)

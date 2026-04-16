# The life of a token

Let's follow one token from birth to screen.

You type *"The capital of France is"* and press enter. Somewhere between your keyboard and the answer, a chain of events runs inside a GPU cluster. Here's the whole arc, cafeteria-style, before we zoom in.

## Step 1: Tokenization — chopping the order

The prompt is converted from a string into a list of **token IDs**. Tokens are sub-word units — for the sentence above, maybe `["The", "capital", "of", "France", "is"]`, but in practice something like `[464, 3139, 286, 4881, 318]`, integer indices into a vocabulary of ~50,000–200,000 entries.

<div class="analogy" markdown>
Tokenization is the waiter translating your order ("medium rare, no onions") into the kitchen's shorthand ("#14, mod -onion"). From here on, the kitchen doesn't think in words — it thinks in numbers.
</div>

This step runs on the CPU. It's fast. It rarely matters for performance — unless you have absurdly long prompts, in which case the token count itself becomes a load.

## Step 2: Embedding — looking up ingredients

Each token ID becomes a vector (typically 4,096 to 12,288 dimensions for modern models) by looking it up in an **embedding table**. The table has one row per vocabulary entry. This single matrix multiply maps discrete words to continuous vectors the rest of the model can do arithmetic with.

Now you have a matrix of shape `(prompt_length, hidden_dim)`. For a 5-token prompt on a model with 4,096-dim embeddings, that's a 5×4,096 matrix of floats.

## Step 3: The transformer stack — the assembly line

The matrix is now passed through **N transformer layers** — 32, 48, 80, 96, depending on the model size. Each layer does roughly the same thing:

1. **Layer norm.** Normalize the activations (cheap elementwise op).
2. **Attention.** Each token looks at all the previous tokens and decides which ones to pay attention to. This is where the famous "attention is all you need" happens. [Full chapter](attention.md).
3. **Residual connection.** Add the attention output back to the input.
4. **Layer norm.** Normalize again.
5. **Feedforward (MLP).** A two-layer MLP that transforms each token's representation independently. Usually 4× larger hidden dim inside.
6. **Residual connection.** Add the MLP output back.

Each of these operations is a matrix multiplication (or a few) against weight tensors that live in HBM. A model with 70B parameters stores those weights across HBM — for our 80-layer model, each layer has about 900M parameters' worth of weight matrices.

<div class="analogy" markdown>
Each layer is a workstation on the assembly line. The activation matrix is the piece being assembled. At each station, weights (tools and parts) are pulled from the loading dock (HBM), applied to the piece, and the piece moves on to the next station. 80 stations later, the piece is ready.
</div>

## Step 4: The LM head — picking the next word

After the final layer, each token's vector is projected through the **language modeling head** — a big matrix multiply that turns the 4,096-dim vector back into a 50,000-entry vector, one logit per vocabulary token. Softmax over that vector gives a probability distribution.

We only actually care about the **last** token's logits, because we want to predict what comes after the prompt. So we pick a word — greedy, top-k, top-p sampling, temperature, nucleus, whatever — and out comes the next token: `" Paris"`.

## Step 5: Streaming — autoregression

Now the trick. Instead of throwing everything away and starting over, we **append the new token to the sequence** and run the model again, one more step, to get the token after that. Then we append that one too. Then again, and again, until the model emits an end-of-sequence token or we hit a length limit.

This is **autoregressive generation**. Each new token is a full forward pass through the model, conditioned on everything before it.

And here is where the performance story gets interesting. If every new token required re-running attention on the *entire* history, cost per token would explode as the response gets longer. Instead, LLMs use a clever shortcut called the **KV cache** — a way to remember what attention needed to know about earlier tokens, so each new token's forward pass only has to work on itself plus a lookup of the cache.

We'll cover the KV cache in its own chapter, because it's central. For now, the mental picture is:

<div class="analogy" markdown>
The kitchen keeps a running notebook. Every time a new item is cooked, the chef scribbles a few notes about it. When the next item comes through, the chef consults the notebook instead of re-cooking everything from scratch. Without the notebook, each new dish would take longer than the last. With it, each new dish is roughly constant effort.
</div>

## Two phases of very different character

Already you can sense that inference has two phases:

**Prefill.** The first forward pass processes the *entire* prompt at once, in parallel. Lots of work, but also lots of parallelism — the GPU is happy, tensor cores busy, compute-bound.

**Decode.** Each subsequent token is generated one at a time. Even with the KV cache, every new token means pulling all model weights from HBM for a tiny amount of arithmetic per token. Very little parallelism per step. Memory-bound. The GPU is *unhappy*.

The [prefill vs. decode](prefill-vs-decode.md) chapter digs into this in detail. It's the single biggest split in how LLM inference behaves.

## What actually gets streamed to you

Modern chat interfaces show tokens appearing one at a time. That's genuine — each token you see corresponds to one full forward pass through the network. If the server is generating 100 tokens per second for your request, it is completing 100 forward passes per second, each touching ~140 GB of weights (for a 70B model at FP16).

That means for *your* request alone, the server is moving roughly 14 TB/s of data through HBM. On an H100 with ~3.35 TB/s of HBM bandwidth, that's 4–5 GPUs working full tilt *just for you*. Which is why LLM serving has to be clever: you can't afford 5 GPUs per user. The system has to batch your request with dozens of others so those HBM reads are amortized. [Full chapter on batching](batching.md).

## The whole picture in one line

- **Tokens in →** embedding table lookup
- **→ N transformer layers →** each with attention (using KV cache) and feedforward
- **→ LM head →** pick next token
- **→ append to sequence →** repeat

…with the GPU alternately happy (prefill) and unhappy (decode), and the serving system working hard to batch everything so HBM is never idle.

The next chapters zoom in on each piece.

Next: [Attention, explained slowly →](attention.md)

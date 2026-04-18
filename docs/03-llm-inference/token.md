# What is a token?

Before we watch one travel through the model, we should look at it up close.

You have heard *token* thrown around as casually as "word." They are not the same. A token is a piece of text — sometimes a whole word, sometimes a fragment, sometimes a single byte — paired with an integer ID. Everything an LLM does, it does in units of tokens: prompts are counted in tokens, context windows are measured in tokens, prices are quoted per token, and throughput is reported in tokens per second.

If the rest of the guide keeps using this word, it is worth spending one chapter asking: what *is* the thing?

## A token is an integer

From the model's point of view, the sentence *"The capital of France is"* is not English. It is something like:

```
[464, 3139, 286, 4881, 318]
```

Five integers. Each one indexes a row in a vocabulary table of maybe 50,000 to 200,000 entries. The table was decided once, at training time, and will never change for the life of the model.

<div class="analogy" markdown>
Think of a diner menu with 50,000 numbered items. You do not order *"a ham and cheese on rye with mustard"*; you order *#14, mod +mustard*. The kitchen never sees English — it sees numbers. Tokenization is the waiter who does the translation on the way in, and detokenization is the cashier printing a receipt on the way out.
</div>

The model itself — every matrix multiply, every attention head, every layer — operates on those integers (well, on the vectors they look up). The English you see on your screen is re-assembled at the last step by reversing the same table.

## Why not just use words?

The obvious idea is: one token = one word. It fails, quickly, for a few reasons.

**Unknown words break everything.** A word-level tokenizer trained in 2018 would have no entry for *ChatGPT*, *rizz*, or *Llama-3*. You need a plan for words you have never seen.

**The vocabulary explodes.** English has hundreds of thousands of inflected forms (*run, runs, ran, running, runner*), and languages with agglutinative morphology like Finnish or Turkish have *millions*. The embedding and LM-head tables scale linearly with vocab size, and a million-row table is brutal both in memory and in compute at the output layer.

**Names, code, and URLs aren't words.** `s3://my-bucket/logs-2024-04-17.parquet` is not a word. Neither is `np.linalg.svd` nor `x0bf3c2e1`. A useful tokenizer must handle them gracefully.

## Why not use characters?

The other extreme: one token per character. That solves the vocabulary-size and unknown-word problems — there are only ~150,000 Unicode code points, and nothing is ever out of vocabulary. But it is terrible for efficiency.

A character-level model burns its attention budget modelling that `t-h-e` goes together before it can learn anything interesting. Sequence lengths balloon 4–5×, and every operation in a transformer scales with sequence length — attention is $O(n^2)$ in $n$. Training and inference both become 4–5× slower for the same text. It's a cost nobody pays for production LLMs.

## The sub-word compromise

Modern tokenizers pick a middle ground: **sub-word units** that are long enough to be efficient and short enough that any string can be built from them.

Common words stay whole: `" the"`, `" and"`, `" is"`. Rare words get split: `"antidisestablishmentarianism"` might become `["anti", "dis", "establish", "ment", "arian", "ism"]`. Anything weird — names, code, emoji, arbitrary bytes — can always be reached by falling back to smaller and smaller pieces.

This gives you:

- **Bounded vocabulary.** 30K–200K entries, not millions.
- **No unknown words.** The fallback path always terminates, because the tokenizer knows about every byte.
- **Reasonable sequence lengths.** Usually 1.2–1.5 tokens per English word.

The most widely used family of algorithms for building such a vocabulary is **Byte-Pair Encoding (BPE)**.

## How BPE builds a vocabulary

BPE starts from the smallest possible alphabet — bytes, or Unicode characters — and *merges greedily*.

1. Start with a vocabulary of every individual byte (256 entries) or every Unicode character that appears in the training corpus.
2. Count how often each pair of adjacent symbols occurs in the corpus.
3. The most frequent pair gets merged into a new vocabulary entry.
4. Replace every occurrence of that pair with the new symbol and go back to step 2.
5. Stop when the vocabulary hits its target size (say, 50,000 entries).

Each merge is recorded, in order. At inference time, the tokenizer replays the same merges against your input: start with bytes, then greedily apply the learned merges in training order. Whatever comes out is the tokenization.

<div class="analogy" markdown>
Imagine reading a giant corpus and noting: *t and h appear next to each other constantly — let me stop treating them as two letters and start treating `th` as one thing.* Then *`th` and `e` appear together a lot — make `the` one thing.* Then *space-and-`the`*. After tens of thousands of such greedy merges, the common chunks of English have all become single tokens, and only the rarer stuff stays split.
</div>

This is why in GPT-family tokenizers you will see tokens like `" the"` (with a leading space) as single entries. The space is part of the token because it genuinely is adjacent to *the* most of the time in text.

## Byte-level BPE: the trick that handles everything

GPT-2 introduced a small but consequential twist: run BPE over **bytes**, not characters. The starting alphabet is exactly 256 symbols (the byte values 0–255). Every string on Earth — English, Chinese, emoji, raw binary, malformed Unicode — is a sequence of bytes, so *nothing is ever out of vocabulary*. Worst case, a weird input gets tokenized byte by byte, one token per byte.

This is the reason you can paste anything into a modern LLM and it will at least tokenize. The tokenizer never crashes. The only cost is that unfamiliar text may consume a lot of tokens.

!!! note "Unicode, bytes, and why it matters"
    A single Chinese character is typically 3 bytes in UTF-8. If the tokenizer has never seen Chinese during training, each character may take 3 tokens. If it has seen Chinese, common characters and words merge into 1–2 tokens. This is directly visible in your bill: the same sentence in Chinese often costs 2–3× more tokens than in English on older tokenizers, and maybe 1.2–1.5× on newer multilingual ones.

## Vocabulary size — the tradeoff

Why not just use a *bigger* vocabulary so everything is one token?

**The output layer gets expensive.** The LM head projects from hidden dim (~4,096) to vocab size (~50,000). Doubling vocab size doubles both the parameter count of that layer and the compute for every forward pass.

**The embedding table gets big.** At 4,096 × 200,000 × 2 bytes (FP16), that is 1.6 GB just for the input/output embedding, often tied between the two.

**Diminishing returns.** Past ~100K entries, each new token entry captures an increasingly rare fragment of text. You are paying a lot of parameters to shave a small fraction of tokens off average sequence length.

Modern LLMs land at 32K (Llama 2), 128K (Llama 3, GPT-4 turbo), or 200K (Claude, GPT-4o). The trend is upward, mostly because multilingual coverage benefits from a bigger vocab.

## Special tokens

Not every token is a piece of English. Tokenizers reserve a small number of *special tokens* that mean things to the system, not to the reader.

| Token | Meaning |
|---|---|
| `<bos>` / `<s>` | Beginning of sequence. |
| `<eos>` / `</s>` | End of sequence. The model emits this to say *"I'm done."* |
| `<pad>` | Padding, used to make all sequences in a batch the same length. |
| `<unk>` | Unknown. Rare in byte-level BPE, but present in older tokenizers. |
| `<|system|>`, `<|user|>`, `<|assistant|>` | Role markers in chat-tuned models, separating the system prompt, user turns, and the model's own output. |

Special tokens live in the same vocabulary as ordinary tokens and have normal integer IDs. But they do not appear in the user-facing text — they are stripped on detokenization, or rendered specially by the chat UI.

<div class="analogy" markdown>
Special tokens are the stage directions in a play script. They are written into the text so the actors (the model) know when a scene starts and ends, but the audience (the user) never hears them spoken. If you forget to insert the right role markers when constructing a prompt, the model gets confused about whose turn it is — the same way an actor would if the script had no scene breaks.
</div>

## Why Chinese costs more

Sub-word tokenizers are trained on a corpus. Whatever language is over-represented in the corpus gets efficient tokens; everything else pays a premium.

For OpenAI's older `cl100k_base` tokenizer, the ratio of tokens per unit of information looks roughly like:

- English text: ~1.3 tokens per word, ~4 characters per token.
- Spanish / French / German: ~1.5–2× English.
- Chinese / Japanese / Korean: ~2–3× English.
- Thai / Arabic / Hindi: sometimes 3–4× English.

Newer tokenizers (GPT-4o's `o200k_base`, Llama 3's 128K vocab, Claude's 200K) close the gap considerably but do not eliminate it. The practical consequence: an API call that costs $0.01 to summarize a paragraph of English may cost $0.02–$0.03 for the same paragraph in Chinese, and you hit the context window proportionally faster too.

!!! tip "How to check your tokenizer"
    OpenAI publishes `tiktoken` (`pip install tiktoken`) so you can count tokens exactly for GPT models. Hugging Face's `AutoTokenizer` does the same for open-weight models. For rough estimates: one English word ≈ 1.3 tokens, one Chinese character ≈ 1–2 tokens on modern tokenizers.

## What this means for the GPU

Tokens are the unit the whole performance story is told in.

- **Throughput.** Serving benchmarks report *tokens per second per GPU* (TPS). That is the fundamental currency.
- **Latency.** Time to first token (TTFT) and inter-token latency (ITL) are both measured in tokens.
- **Context.** A 128K context window means the model can see 128,000 tokens at once — not characters, not words, tokens.
- **Cost.** API pricing is literally dollars per million input tokens and dollars per million output tokens.

Every chapter after this one assumes you know what the integer in `[464, 3139, 286, 4881, 318]` *is*. Now you do.

## The whole chapter in four bullets

- A token is an integer ID pointing at a sub-word unit of text. Vocabulary size is typically 30K–200K.
- Sub-word tokenization (usually BPE) is the compromise between word-level (too big, too fragile) and character-level (too slow).
- Byte-level BPE guarantees any input can be tokenized. Nothing is ever out of vocabulary.
- Not all languages get equal treatment — non-English text usually costs more tokens per unit of meaning, which translates directly into slower responses and higher bills.

Next: [The life of a token →](life-of-a-token.md)

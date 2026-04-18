# Quiz — What is a token?

Six questions on tokens and tokenization. Chapter: [What is a token?](../03-llm-inference/token.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> From the model's point of view, what is a token?",
      "choices": {
        "A": "A whole English word",
        "B": "A single Unicode character",
        "C": "An integer ID that indexes a fixed vocabulary table chosen at training time",
        "D": "A floating-point vector learned per input"
      },
      "explain": "<p>A token is an integer ID. Those IDs point into a vocabulary table (typically 30K–200K entries) that was decided once, at training time. The embedding step then turns each ID into a vector.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q2.</strong> Why do modern LLMs use sub-word tokenization instead of word-level?",
      "choices": {
        "A": "Sub-word is strictly simpler to implement",
        "B": "Word-level would require more GPU memory at inference time",
        "C": "Sub-word makes attention O(n) instead of O(n²)",
        "D": "Word-level explodes the vocabulary across morphology and can't handle unseen words, names, URLs, or code"
      },
      "explain": "<p>Word-level fails on new words (<em>ChatGPT</em>, <em>rizz</em>), blows up on inflected languages, and can't represent names, code, or URLs. Sub-word gets bounded vocab size, no unknown-word problem, and reasonable sequence lengths — a practical compromise.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> How does BPE (Byte-Pair Encoding) build its vocabulary?",
      "choices": {
        "A": "It uses a neural network to predict the best tokenization for each sentence",
        "B": "It starts with individual bytes/characters and greedily merges the most frequent adjacent pair, repeating until the vocab hits a target size",
        "C": "It assigns a token to every word in a dictionary, then splits unknown ones randomly",
        "D": "It hashes each word to a fixed-size integer"
      },
      "explain": "<p>BPE is iterative greedy merging. Count adjacent-pair frequencies in the corpus, merge the most common pair into a new symbol, repeat. The ordered list of merges is what the tokenizer replays on new input at inference time.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> What's the key property of byte-level BPE (the variant GPT-2 and successors use)?",
      "choices": {
        "A": "The starting alphabet is the 256 byte values, so every possible string is representable — nothing is ever out of vocabulary",
        "B": "It's faster to tokenize than character-level BPE",
        "C": "It eliminates the need for special tokens like <eos>",
        "D": "It compresses text more aggressively than character-level BPE"
      },
      "explain": "<p>Byte-level BPE guarantees any input can be tokenized because every string is a byte sequence and all 256 byte values are in the base vocabulary. The worst case is one token per byte for truly unfamiliar text — never a crash or &lt;unk&gt;.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What's the purpose of special tokens like <code>&lt;eos&gt;</code> or <code>&lt;|user|&gt;</code>?",
      "choices": {
        "A": "They are punctuation marks that the tokenizer treats as ordinary text",
        "B": "They are reserved for unknown inputs",
        "C": "They encode structural signals (end-of-sequence, role boundaries, padding) that the system needs but that aren't shown to the user",
        "D": "They are only used during training and stripped from production models"
      },
      "explain": "<p>Special tokens are meta-signals: end-of-sequence, beginning, padding, role markers. They share the vocabulary with ordinary tokens but don't appear in user-visible text — they're stripped on detokenization or rendered specially by the chat UI. Missing or wrong role markers confuse chat models about whose turn it is.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why does Chinese (or Japanese, Korean, Thai, Arabic…) text typically consume more tokens per unit of meaning than English?",
      "choices": {
        "A": "The model's attention pays extra weight to those languages",
        "B": "The BPE vocabulary was trained on a mostly-English corpus, so common non-English sequences didn't merge into single tokens and fall back to smaller pieces",
        "C": "Unicode characters are encoded as two tokens each regardless of language",
        "D": "Non-English languages are always stored as raw bytes without any merging"
      },
      "explain": "<p>BPE merges the most frequent adjacent pairs in the training corpus. If a language is underrepresented in that corpus, its common sequences never rose to the top of the merge list — so they tokenize into many small pieces. Newer multilingual tokenizers (o200k, Llama 3's 128K, Claude's 200K) close the gap but don't eliminate it, so non-English calls still cost more tokens and hit the context window faster.</p>"
    }
  ]
}
</script>

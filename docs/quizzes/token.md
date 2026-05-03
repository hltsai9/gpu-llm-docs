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
        "A": "A complete English word from the training dictionary, mapped to a single ID",
        "B": "A single Unicode character or byte from the input, treated without any merging",
        "C": "An integer ID that indexes a fixed vocabulary table chosen at training time",
        "D": "A floating-point vector learned dynamically for each input token"
      },
      "explain": "<p>A token is an integer ID. Those IDs point into a vocabulary table (typically 30K–200K entries) that was decided once, at training time. The embedding step then turns each ID into a vector.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q2.</strong> Why do modern LLMs use sub-word tokenization instead of word-level?",
      "choices": {
        "A": "Sub-word tokenization is significantly simpler to implement in production systems",
        "B": "Word-level approaches require much more GPU memory when running inference on large batches",
        "C": "Sub-word encoding guarantees that attention complexity becomes O(n) instead of O(n²)",
        "D": "Word-level explodes the vocabulary across morphology and can't handle unseen words, names, URLs, or code"
      },
      "explain": "<p>Word-level fails on new words (<em>ChatGPT</em>, <em>rizz</em>), blows up on inflected languages, and can't represent names, code, or URLs. Sub-word gets bounded vocab size, no unknown-word problem, and reasonable sequence lengths — a practical compromise.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> How does BPE (Byte-Pair Encoding) build its vocabulary?",
      "choices": {
        "A": "It uses a neural network trained end-to-end to predict the best tokenization for each sentence dynamically",
        "B": "It starts with individual bytes/characters and greedily merges the most frequent adjacent pair, repeating until the vocab hits a target size",
        "C": "It assigns one token to every word in a dictionary, then splits any unknown words randomly into subwords",
        "D": "It applies a fixed hash function to each word or phrase to map them to fixed-size integer codes"
      },
      "explain": "<p>BPE is iterative greedy merging. Count adjacent-pair frequencies in the corpus, merge the most common pair into a new symbol, repeat. The ordered list of merges is what the tokenizer replays on new input at inference time.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> What's the key property of byte-level BPE (the variant GPT-2 and successors use)?",
      "choices": {
        "A": "The starting alphabet is the 256 byte values, so every possible string is representable — nothing is ever out of vocabulary",
        "B": "It tokenizes significantly faster than character-level BPE due to early merging in the base alphabet",
        "C": "It eliminates the need for special tokens like <eos> or role markers during generation",
        "D": "It compresses text much more aggressively than character-level BPE in most cases"
      },
      "explain": "<p>Byte-level BPE guarantees any input can be tokenized because every string is a byte sequence and all 256 byte values are in the base vocabulary. The worst case is one token per byte for truly unfamiliar text — never a crash or &lt;unk&gt;.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What's the purpose of special tokens like <code>&lt;eos&gt;</code> or <code>&lt;|user|&gt;</code>?",
      "choices": {
        "A": "They are punctuation-like tokens that the tokenizer treats as ordinary text like commas, periods, and quotes",
        "B": "They are reserved placeholders for representing words that don't appear in the training vocabulary",
        "C": "They encode structural signals (end-of-sequence, role boundaries, padding) that the system needs but that aren't shown to the user",
        "D": "They are only used during the training phase and completely removed from models before deployment"
      },
      "explain": "<p>Special tokens are meta-signals: end-of-sequence, beginning, padding, role markers. They share the vocabulary with ordinary tokens but don't appear in user-visible text — they're stripped on detokenization or rendered specially by the chat UI. Missing or wrong role markers confuse chat models about whose turn it is.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why does Chinese (or Japanese, Korean, Thai, Arabic…) text typically consume more tokens per unit of meaning than English?",
      "choices": {
        "A": "The model's attention weights dynamically shift to assign extra processing to non-English language sequences",
        "B": "The BPE vocabulary was trained on a mostly-English corpus, so common non-English sequences didn't merge into single tokens and fall back to smaller pieces",
        "C": "Unicode characters in non-Latin scripts are inherently encoded as multiple tokens by design specification",
        "D": "Non-English languages store text as unmerged raw bytes without applying any merging operations"
      },
      "explain": "<p>BPE merges the most frequent adjacent pairs in the training corpus. If a language is underrepresented in that corpus, its common sequences never rose to the top of the merge list — so they tokenize into many small pieces. Newer multilingual tokenizers (o200k, Llama 3's 128K, Claude's 200K) close the gap but don't eliminate it, so non-English calls still cost more tokens and hit the context window faster.</p>"
    }
  ]
}
</script>

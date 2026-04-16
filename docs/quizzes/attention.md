# Quiz — Attention, explained slowly

Six questions on Q/K/V, softmax, and FlashAttention. Chapter: [Attention, explained slowly](../03-llm-inference/attention.md).

<div class="quiz">

<div class="q" data-answer="A">
<p class="stem"><strong>Q1.</strong> Which vector represents "what is this token looking for?"</p>
<button data-choice="A">Query (Q)</button>
<button data-choice="B">Key (K)</button>
<button data-choice="C">Value (V)</button>
<button data-choice="D">Embedding</button>
<div class="explain"><p>Q is the "what am I searching for" vector. K is "what I represent" — used to match against queries. V is "what information I carry" — mixed into the output based on attention weights.</p></div>
</div>

<div class="q" data-answer="C">
<p class="stem"><strong>Q2.</strong> For a sequence of length L, what shape is the attention score matrix (QKᵀ)?</p>
<button data-choice="A">L × d</button>
<button data-choice="B">d × d</button>
<button data-choice="C">L × L</button>
<button data-choice="D">1 × L</button>
<div class="explain"><p>Every token is scored against every other token: L × L entries. That's the origin of attention's quadratic cost in sequence length.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q3.</strong> In attention's cost, what is quadratic in sequence length L?</p>
<button data-choice="A">The number of tokens generated</button>
<button data-choice="B">The attention score matrix (QKᵀ) and the weighted-V operation — both scale as L²</button>
<button data-choice="C">The number of GPUs required</button>
<button data-choice="D">The model depth</button>
<div class="explain"><p>The QKᵀ matrix is L × L, and multiplying the L × L weight matrix by V does L × L × d work. That's why 128K-context inference is so much harder than 4K-context inference.</p></div>
</div>

<div class="q" data-answer="D">
<p class="stem"><strong>Q4.</strong> What does the causal mask enforce during generation?</p>
<button data-choice="A">That each head attends to only one other head</button>
<button data-choice="B">That attention is symmetric across tokens</button>
<button data-choice="C">That only the first token is used</button>
<button data-choice="D">That token i cannot attend to future tokens j > i</button>
<div class="explain"><p>Language models are autoregressive. At generation time, future tokens don't exist yet; at training time, attending to them would leak the answer. The mask zeroes out future-position scores before softmax.</p></div>
</div>

<div class="q" data-answer="A">
<p class="stem"><strong>Q5.</strong> What does FlashAttention change?</p>
<button data-choice="A">The memory layout — it never materializes the full L × L score matrix in HBM, keeping scratch data on-chip. The math is unchanged.</button>
<button data-choice="B">It replaces softmax with a cheaper approximation</button>
<button data-choice="C">It prunes half of the attention heads</button>
<button data-choice="D">It adds new learnable parameters</button>
<div class="explain"><p>FlashAttention is a smarter kernel, not a new algorithm. It tiles the computation so the score matrix stays in shared memory and registers — trading a little redundant compute for a large reduction in HBM traffic.</p></div>
</div>

<div class="q" data-answer="B">
<p class="stem"><strong>Q6.</strong> Why do transformers use multiple attention <em>heads</em>?</p>
<button data-choice="A">To double the parameter count at no extra cost</button>
<button data-choice="B">So different heads can specialize in different kinds of relationships (syntactic, coreference, numerical, etc.)</button>
<button data-choice="C">Because a single head doesn't fit on one GPU</button>
<button data-choice="D">To randomize the attention scores</button>
<div class="explain"><p>Multi-head attention splits the hidden dim across heads; each head has its own Q/K/V projections. Heads learn to attend to different aspects in parallel — different "lenses" on the same input at the same total FLOP cost.</p></div>
</div>

</div>

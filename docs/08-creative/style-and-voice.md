# Style and voice in AI-assisted work

A language model's output, without intervention, drifts toward a specific flavor — generally agreeable, structurally orderly, fond of tricolons, prone to "In conclusion" and "It's important to note that." It's polite, competent, and forgettable. If you use it without fighting it, your work will trend that way too.

This chapter is about fighting it.

## Why the average pulls so hard

The mechanism: language models are trained to predict the most likely next token given prior tokens, across an enormous corpus. "Most likely" is a statistical tendency, which means the untouched output gravitates toward the statistical center — the voice of the internet's median writer, smoothed further by instruction tuning that rewards cautious, helpful-sounding prose.

<div class="analogy" markdown>
If you take a million photos of sunsets and average them, you get a blurry orange-pink gradient. That's the model's default output: the average. Anyone who's taken one actually good sunset photo knows the good one doesn't look like the average — it has one specific angle, one specific silhouette, one specific mistake that makes it feel like a place. Your job with AI is to prompt it toward a specific sunset, not let it give you the gradient.
</div>

**What a "generic" AI output looks like in practice:**

- Starts with "In today's fast-paced world" or similar.
- Uses lots of parallelism and tricolons.
- Smooths contrarian or specific observations into balanced neutrality.
- Closes with "Ultimately, X is a multifaceted issue" or "striking the right balance."
- Paragraph-level structure is orderly but flavorless.
- Metaphors are familiar: "journey," "landscape," "tapestry."

If your draft pattern-matches that list, you have a genericity problem.

## The diagnostic questions

Before worrying about fixing output, check honestly:

1. **Would I recognize this as mine in a lineup?** If you saw this paragraph in another author's work, would you blink?
2. **Does this have a claim only I could make?** A specific observation from experience, a contrarian take, a named detail.
3. **Does the *structure* of the argument reflect how I actually think?** Not "intro → three points → conclusion" unless that's how you naturally argue.
4. **Is there a moment where a reader would stop and reread?** A surprise, a joke, a sharp turn of phrase. Those moments are your signature.

If you can't answer yes to most of these, the piece is generic, and the AI contributed to that.

## Techniques for preserving voice

### Feed it your voice first

Before asking for anything, paste 300–500 words of your own writing and say:

> "Here is a sample of my writing. Match this voice in what follows."

Then describe the task. This is by far the highest-leverage intervention. Voice transfer from examples works dramatically better than voice description ("write casually but with precision").

### Constrain vocabulary and structure

Be specific about what not to do:

- "No 'ultimately', no 'multifaceted', no 'strike a balance'."
- "Avoid parallelism of three. Use two-item lists or bare sentences."
- "Sentences vary in length, not smooth — short, sharp, sometimes a longer one that winds."

The model obeys specific constraints more reliably than vague style notes.

### Two-pass: draft, then critique

Draft in one call, then in another call ask:

> "Here's a draft. Identify five places it sounds generic — specifically, places where a lazy writer would use exactly this phrasing. Then rewrite those five passages to be more specific, more surprising, and sharper."

This works because the model is often better at *recognizing* generic prose than at *avoiding* it in one shot.

### Rewrite toward yourself, not the model

When editing AI output, don't polish it toward "smoother." Rewrite toward your ear:

- Replace abstract with concrete.
- Replace balanced with opinionated.
- Replace smooth with uneven.
- Replace "important to note" and its siblings with the point.

A rewrite pass is fast once you're looking for the right things.

### Use it for structure, write the sentences yourself

One of the best patterns: ask the model to outline, argue with the outline, adopt what survives, then write the sentences yourself. You keep the hard work (sentence-level voice) and offload the mechanical work (brainstorming structure).

### Don't accept "fine"

"Fine" is the average's uniform. If a paragraph is fine, it's almost never the best it could be. Keep iterating — either in prompts or by hand — until the paragraph is either bad (rewrite) or good (a specific observation, a sharp turn of phrase, a distinctive rhythm).

## For visual work

Similar principles apply to image generation, with different failure modes:

- **"Default Midjourney aesthetic."** Dramatic lighting, shallow depth of field, rich colors. Beautiful in isolation; forgettable at volume. Counter by explicitly citing the aesthetic you want: documentary, Polaroid, 1970s magazine, hand-drawn, specific artists or movements.
- **Composition clichés.** Centered subject, rule-of-thirds horizon, golden hour. Vary framing explicitly.
- **Character consistency.** If your character keeps slightly changing face, the average is pulling. Use references, LoRAs, or pinned seeds (see [diffusion basics](diffusion-basics.md)).

## The taste question

The most honest observation in this part: AI tools amplify whoever is using them. If you have strong taste and specific preferences, AI accelerates your work toward better output. If you don't — or if you stop exercising them — AI accelerates your work toward average output.

This is not pessimism. It means the *taste* itself is the scarce skill. Writers who spent years developing a specific eye find AI useful for the same reason a power drill is useful to a cabinetmaker. Writers who haven't developed that eye find AI seductive because it sands the edges off their work, including the edges that were going to become their voice.

If you're early in a creative career, use AI carefully. Draft by hand sometimes. Write without tools. Your ability to recognize which AI output is good and which is generic *comes from* the practice you skip by always accepting the first output.

## The "AI sounds obviously AI" myth

A common claim is that AI writing is detectable. Sometimes it is — when it's been used lazily. Lightly-edited AI prose is usually indistinguishable to casual readers. What makes a piece "feel AI" is most often not any specific tell; it's the absence of specifics. A piece that could have been written about any product, any experience, any place, by any author, has an empty quality. That's the signature you're trying to avoid, not the word choice.

The reverse is also true: AI-assisted writing with strong voice doesn't read as AI-assisted. The bottleneck is voice, not tool choice.

## Checklist before publishing

A short pre-ship routine for AI-assisted writing:

- **Specific claims only you could make** — at least one per section.
- **Surprise moments** — at least one per ~500 words.
- **Rhythm variance** — check that sentences vary in length, not all medium.
- **Banned-word scan** — your personal list of AI tells. Grep them.
- **Read aloud** — generic prose sounds generic out loud. Your voice doesn't.
- **Print** — on paper, read slowly. Errors and genericity hide on screens.

This doesn't take long. It makes the difference between "fine AI draft" and "a piece that happens to have used AI."

## Common mistakes

- **Accepting first drafts.** The first draft is the average.
- **Describing voice in words rather than showing it.** Examples beat instructions.
- **Heavy-handed prompting** ("write like a Pulitzer winner"). Flattery doesn't improve output.
- **Relying on AI for the creative step itself.** Outline, structure, mechanical work — yes. The sentences — write them yourself if voice matters.
- **Not noticing the drift.** Over months, your AI-assisted work starts averaging together. Pull representative samples and audit them quarterly.

## In one sentence

AI tools pull output toward an average; your craft is recognizing that pull and writing against it, and the craft doesn't go away just because the tool is new — it becomes more important.

Next: [Creative workflow integration →](creative-integration.md)

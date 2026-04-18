# Creative workflow integration

This chapter is tactical: specific workflows for specific kinds of work. It assumes you've read [diffusion basics](diffusion-basics.md) and [style and voice](style-and-voice.md) — tool knowledge without taste produces a lot of fine, forgettable output.

## Writing: essay, article, blog post

A workflow that works for most long-form text:

1. **Brief yourself in writing.** One paragraph: what's the claim, who's the reader, what surprises you about this topic. (Do this without AI.)
2. **Brainstorm with the model.** Paste the brief; ask for 20 angles or claims. Most are mediocre. The 3–4 sharp ones justify the step.
3. **Outline by hand.** Take your brief + the sharp angles. Structure by thinking, not prompting.
4. **Draft the hard parts yourself.** The opening, the central claim, the examples only you would know.
5. **Model-draft the mechanical parts.** Context paragraphs, smooth transitions, "here's what we've covered so far" rephrasings. Things where voice matters less.
6. **Two-pass the whole thing.** Ask the model to flag generic passages; rewrite them by hand.
7. **Read aloud. Print. Edit one more time.**

Notice the division: you keep the creative work (claim, voice, examples, rhythm); you offload the mechanical work (brainstorming, context, smoothing). Reverse the division and you get generic.

## Writing: marketing copy

Marketing has variants and formats; this is where AI is at its strongest.

**Workflow for variant generation:**

- One extremely clear brief: product, audience, desired action, voice constraints, length.
- Generate 10–20 variants.
- Reject 70% — they'll be bland.
- Iterate on 5–10 that have something.
- Hand-polish the 2–3 finalists.

**Workflow for brand voice consistency:**

- Build a *style pack*: 1,500–3,000 words of brand-aligned writing you've approved.
- Use it as the first few pages of every prompt. Every call sees it.
- Periodically audit — have a non-AI writer evaluate a batch for voice drift.

## Writing: ghostwriting / voice-imitating

A special case: you're writing as someone else — a CEO, a founder, a podcast co-host.

- Paste 3,000–5,000 words of the person's actual writing, labeled clearly.
- Describe the task explicitly: "match this voice."
- Draft with the model; **edit by listening to the person talk**, not by reading other AI output.
- Send drafts for approval early and often. Voice drift in ghostwritten content is especially costly because the person can't detect it the way the reader can.

## Research and synthesis

Research tasks where AI helps a lot:

- **"Summarize these 20 articles into a brief."** Paste them, ask for a synthesis with citations.
- **"Find five counterarguments to my claim."** Useful for stress-testing.
- **"Compare these three positions."** Works well when the source material is in-context.

Research tasks where AI is dangerous:

- **Factual questions without sources.** High hallucination risk. Use retrieval-augmented tools (Perplexity, or your own RAG) for anything you'll cite.
- **Quoting specific sources.** Quotes can be invented. Verify every quote against the source.
- **Finding recent / niche information.** Models are trained on a snapshot; niche topics were underrepresented. Treat outputs as leads to verify, not facts.

## Image generation: concept art

For mood boards and early visual development:

1. **Write a visual brief.** Subject, mood, palette, lighting, reference styles. Short — 30–50 words.
2. **Generate in batches of 4–8.** You're sampling a distribution, not refining one image.
3. **Pick the best composition; discard aesthetic.** Aesthetic is easier to transfer than composition.
4. **Iterate: same composition, vary style via reference images.** This is where most of the quality work happens.
5. **Select 2–3 directions; share them.** Let collaborators respond before polishing.

## Image generation: for shipping

For production visuals (ad, hero image, character art):

- **Use reference-based or ControlNet workflows.** Unconstrained generation is unreliable at the required polish.
- **Composite manually.** AI generates elements; you compose them in Photoshop/Figma. More control, fewer artifacts.
- **Upscale and clean.** Most AI output needs upscaling for print; inpaint any artifacts (hands, text, small errors).
- **Keep seeds and prompts.** When revisions come, you need to reproduce and adjust.

## Scripts and longer narrative

For screenplays, stories, game dialogue:

- **Outline all the way down.** Plot, character arcs, scene beats. By hand. The model is a bad judge of pacing and dramatic structure — it tends toward the generic.
- **Draft scenes one at a time.** Long auto-generated narratives drift into inconsistency.
- **Preserve character consistency.** Include character bios and recent dialogue in every generation prompt. The model won't remember across long sessions.
- **Edit voice per character.** Characters should not all sound like the model's default. Give each their own lexical range, cadence, and quirks. Enforce in editing.

## Video: assistance, not automation

Video tools as of 2025 work well as components, not standalone directors:

- **Storyboarding:** diffusion models for frames. Fast and useful.
- **B-roll generation:** short video clips where specifics don't matter. Works.
- **Character-driven scenes:** difficult. Consistency across cuts is not yet reliable without specialized tools.
- **Voice-over:** ElevenLabs et al. work well for narration, drafts; finals often need a human recording.
- **Music:** Suno and Udio produce usable stems; full production usually needs a human composer's edit.

A pattern that works today: use AI for *components* (storyboard, b-roll, narration draft, music stem, foley), then assemble and direct in traditional tools.

## Email and correspondence

A specific workflow:

- **Have a "voice library."** A text file with 5–10 examples of how you typically open, close, and handle common topics.
- **Quick drafts.** Paste the thread + your intent + the voice library. Model drafts the reply.
- **Edit for *specificity*.** AI-drafted emails tend to sound polite-but-generic; edit in a specific observation or a callback to the other person's last message.

Avoid fully-automated email replies for anything beyond pure transactional acknowledgments. The uncanny valley is real and reputation-damaging.

## Slide decks and presentations

A two-pass pattern:

1. **Write the talk first, as prose.** What are you actually saying? What is the claim on each slide?
2. **Generate the deck from that.** AI handles layout, bullet distillation, visual suggestions. Much better than generating directly from an idea.

Deck tools with AI: Gamma, Tome, Canva's generators, Figma AI, and native PowerPoint/Keynote assistants. Useful for first drafts; polish is manual.

## Team workflows

Working with AI in a team setting:

- **Prompt libraries.** Shared doc of working prompts for common tasks. Saves re-inventing.
- **Style guides as prompts.** Turn your brand voice doc into a drop-in prompt prefix.
- **Disclosure norms.** Decide internally what warrants disclosure and to whom. Be consistent.
- **Review policies.** What AI output gets human review before publishing? Everything client-facing, usually.
- **Training gaps.** Juniors who never write without AI have trouble developing taste. Plan for some by-hand work.

## Disclosure and client expectations

A practical framing that works for most creative-service relationships:

- **Assume disclosure is expected for voice-heavy work.** Byline pieces, ghostwriting, creative content sold on the strength of *you*. If AI was meaningful to the work, say so.
- **Assume disclosure is not expected for mechanical work.** Research assistance, first-pass translation, background reading, meeting notes. The tool is invisible.
- **When unsure, ask.** Clients are forming opinions on this; a direct conversation beats finding out later.

## Craft habits that scale

Small habits that preserve quality at volume:

- **Write something AI-free each week.** Stays your ear honest.
- **Read output aloud before shipping.** Generic prose sounds generic.
- **Maintain a "banned words" list.** Your personal AI tells. Grep before publishing.
- **Keep a prompt journal.** What worked for what tasks. Compounds into real expertise.
- **Audit old work quarterly.** Spot-check past AI-assisted pieces. Do they hold up? What drifted?

## Common mistakes

- **Starting with AI.** The brief and outline are your work. Don't delegate them.
- **No voice examples in prompts.** Biggest single quality gain is feeding the model your writing.
- **Shipping first drafts.** The first draft is the average.
- **Over-relying on AI for structure in long narrative.** The model is bad at pacing.
- **Letting junior staff skip the by-hand phase.** Develops no taste, no voice.
- **No disclosure strategy.** Decide proactively, not under pressure.

## In one sentence

AI is a tool for the mechanical parts of creative work; the creative parts — brief, voice, specific observations, rhythm, dramatic structure, taste — are still yours, and the quality of your output scales with how vigorously you defend them.

Back to [Part 8 index](index.md).

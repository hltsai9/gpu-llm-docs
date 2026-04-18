# Diffusion basics for creatives

LLMs predict the next token. Image models don't. They work on a fundamentally different principle called *diffusion*, and the practical implications show up every time you're surprised by what Midjourney or Stable Diffusion did.

This chapter is not a full engineering explainer. It's the mental model a working creative needs to prompt image models *intentionally* rather than hopefully.

## What's going on under the hood

Start with a plain insight: take any image, and add a little random noise to every pixel. Keep adding. Do this enough times and you end up with pure static.

Now flip that. Train a neural network to look at a noisy image and predict *what noise should be removed* to make it slightly less noisy. Run that repeatedly and — starting from pure static — the model can gradually denoise its way to a clean image.

That's a diffusion model. It's trained to be really good at "reduce the noise one step." Generation is repeated application of that step, perhaps 20–50 times, from fully noisy to final image.

<div class="analogy" markdown>
A sculptor starts with a rough block of stone and chisels away "everything that isn't the sculpture." A diffusion model starts with a block of random noise and chisels away "everything that isn't the image your prompt describes." The difference is the sculptor knows what they're making; the model is reading your prompt at every step to decide which direction to chisel.
</div>

## Where the prompt comes in

The model's guidance at each step is a vector encoding of your text prompt, produced by a separate text encoder (CLIP or similar). That vector pulls the denoising process toward images whose representations match the text.

Implications:

- **The prompt is a direction, not a template.** "A cat on a chair" pushes the denoising toward cat-on-chair-looking outputs. Different seeds (starting noise) produce different cats and chairs.
- **Specific words have specific weights.** "Oil painting" carries learned associations with a whole visual style, built up from training images labeled that way.
- **Prompt order and emphasis matter.** Most tools support `(word:1.3)` syntax or weight-by-position conventions. The encoder is sensitive to them.
- **"Not X" often doesn't work.** Prompting "no people" can *add* people (the model latches on the "people" token). Use negative prompts (a separate parameter) for exclusions.

## The seed: determinism in a stochastic tool

Every generation starts from a block of random noise. The *seed* picks that starting point.

- **Same prompt + same seed = same image.** Useful for reproducibility.
- **Same prompt + different seed = different composition, same style.** Useful for variations.
- **Different prompt + same seed** = structurally similar but differently rendered. Useful for subtle edits.

Seeds are why you can get a composition you love and then struggle to reproduce it — you need the seed, not just the prompt.

## Sampling steps and CFG

Two other knobs that matter:

- **Steps.** How many denoising iterations. More = more detail, up to a point. 20–40 is typical. Beyond 60, diminishing returns and occasional overcooking.
- **CFG (classifier-free guidance).** How hard to pull toward the prompt. Low CFG (3–5) = looser interpretation, more creative. High CFG (10+) = literal, but can look overcooked or plastic. 7–9 is a common sweet spot.

Understanding these lets you diagnose outputs. "Looks over-baked" usually means CFG is too high. "Looks nothing like my prompt" often means CFG is too low or steps too few.

## Prompt patterns that work

### Structure the prompt

A common scaffold:

1. **Subject.** "A weathered lighthouse"
2. **Action / environment.** "on a rocky cliff during a storm"
3. **Style.** "in the style of an oil painting"
4. **Lighting.** "dramatic backlighting, long shadows"
5. **Composition / framing.** "wide angle, from below"
6. **Quality hints.** "highly detailed, cinematic"

The order isn't magical but the structure helps you remember what's missing.

### Reference-based prompting

Modern tools support reference images. Two main kinds:

- **Image-to-image.** The model starts from your reference instead of pure noise. The prompt guides changes. Good for variations on a composition.
- **Style reference.** The model matches the style of your reference while generating new content from the prompt.

Reference images give you far more control than text alone. When describing a style in words isn't working, find a visual reference.

### ControlNet and structural references

ControlNet (and its cousins) let you specify structure: pose, edge map, depth map, line drawing. The model generates the image while matching that structure.

Example: sketch a stick-figure pose → ControlNet enforces that exact pose in the output → prompt describes the character. The pose is locked in, the style and identity come from the prompt.

For reliable, reproducible art direction, ControlNet is transformative.

### Inpainting and outpainting

- **Inpainting.** Mask a region; ask the model to re-generate just that region according to a prompt. Great for fixing details, swapping elements, iterating.
- **Outpainting.** Extend the canvas; the model fills in the new area consistently with the original. Great for adjusting composition after the fact.

Both work because diffusion naturally handles "generate under constraints" — the existing pixels are just "already-denoised" regions, and the model fills in around them.

## The common surprises, explained

### "Why does the same prompt give completely different images?"

Different seeds. Set a seed for reproducibility.

### "Why does a small prompt change sometimes reshuffle the whole image?"

The prompt changes the guidance vector. If the change moves the vector into a different region of the learned space, the whole denoising path shifts. Small text changes can = big image changes, and vice versa.

### "Why can't it do hands / text / specific fingers?"

Hands are hard because they're structurally complex (many articulated joints, self-occlusion, lots of correct configurations) and training data is noisy. Text is hard because it requires pixel-exact character shapes, which diffusion is poorly suited to. Newer models (SDXL-Lightning, FLUX, Midjourney v6+) have made progress; neither is fully solved. For text, use a separate tool or composite.

### "Why does it sometimes generate near-copies of specific training images?"

Diffusion models don't "search" for matches (addressed in the [creative learning path](../learning-paths/creative.md) misconception section), but they *can* reproduce images that were extremely overrepresented in training data or very distinctive — especially famous paintings, iconic photos, or known product shots. Be aware when prompting famous subjects.

### "Why did my character change faces across generations?"

Without a reference or consistency tool, each generation samples character identity fresh. Use:

- **Reference image** of the character.
- **Character LoRAs** (small fine-tunes attached to the base model) for specific characters.
- **Fixed seed** for consistency within a scene.

## Tool landscape, as of 2025

- **Midjourney.** Strong aesthetic defaults, easiest to get to good-looking output, Discord-based workflow (web UI improving). Paid.
- **DALL·E (in ChatGPT, Bing, etc.).** Tight integration with LLM prompting, natural-language revisions. Conservative content policy.
- **Stable Diffusion (and descendants: SDXL, SD3).** Open-source, self-hostable, massive ecosystem of LoRAs and ControlNets. Requires more setup.
- **FLUX.** 2024 open release, strong image quality, excellent text rendering relative to peers.
- **Ideogram.** Specializes in images with text.
- **Adobe Firefly.** Commercial-safe training data, tight integration with Creative Cloud.

Pick based on:

- Your tolerance for setup (Midjourney vs. SD local).
- Your need for commercial-safe training provenance (Firefly).
- Your workflow integration (ChatGPT for iterative natural-language, Photoshop for inpainting-in-context).
- Your need for character consistency or specific styles (SD with LoRAs).

## What this doesn't cover

- **Video models** (Sora, Runway, Veo, Kling) — similar diffusion principles, but temporal consistency adds complexity. Worth its own chapter later.
- **3D** (Gaussian splatting, NeRFs with AI assist) — evolving fast; production use still emerging.
- **Audio and music** (Suno, Udio, ElevenLabs) — different model families, often closer to language models than diffusion.

## Common mistakes

- **Ignoring seeds.** You keep trying to recover a composition you loved. Save seeds.
- **Prompting for exclusions positively.** "No people" often fails; use negative prompts.
- **Over-describing.** A 60-word prompt often produces worse output than 15 well-chosen words.
- **Expecting consistency without a reference.** Character identity doesn't persist without help.
- **One generation and done.** Batch generate 4 or 8; the distribution is how you find the good one.
- **CFG cranked to max.** Produces plasticky, over-saturated images. Dial back.

## In one sentence

Diffusion is iterative denoising guided by your prompt — so prompts are directions, seeds pick your starting point, and the craft is learning which knobs (steps, CFG, references, masks) influence which aspects of the output.

Next: [Style and voice →](style-and-voice.md)

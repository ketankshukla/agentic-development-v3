# Ebook Cover Prompt Generation

You are generating 5 detailed image generation prompts for ebook covers.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate 5 distinct cover prompt variants. Each prompt should produce a different visual interpretation while maintaining genre consistency.

### Cover Requirements

**Dimensions:** 1600 x 2400 pixels (2:3 aspect ratio)
**Style:** Photorealistic cinematic quality — NOT illustrated, NOT painted, NOT anime
**Text:** Title and author name will be added separately — DO NOT include text in the image prompt

### Prompt Structure

Each prompt must include these sections in order:

1. **Subject** — The central figure or scene (be specific about pose, expression, attire)
2. **Composition** — Camera angle, framing, positioning within frame
3. **Setting** — Background environment, depth, atmosphere
4. **Lighting** — Light source, direction, quality, shadows
5. **Color Palette** — Dominant colors, mood through color
6. **Style Modifiers** — Technical quality terms (8K, cinematic, photorealistic, etc.)
7. **Negative Prompts** — What to avoid (text, watermarks, low quality, etc.)

### Genre Considerations

For {{GENRE}}, consider:
- What visual elements immediately signal this genre?
- What colors dominate successful covers in this space?
- What poses/compositions suggest action/tension?
- What atmospheric elements enhance mood?

### Variant Approaches

Create 5 distinctly different approaches:
1. **Hero Shot** — Protagonist front and center, dramatic pose
2. **Environment Focus** — Setting dominates, figure smaller in scene
3. **Action Moment** — Mid-action scene, movement and energy
4. **Symbolic** — Object or element that represents the story
5. **Atmospheric** — Mood-driven, mysterious or dramatic

## Output Format

Wrap each cover prompt in EBOOK_COVER tags:

<EBOOK_COVER:01-hero-shot.md>
## Ebook Cover Prompt 1: Hero Shot

### Subject
[Detailed subject description]

### Composition
[Camera and framing details]

### Setting
[Background and environment]

### Lighting
[Light source and quality]

### Color Palette
[Colors and mood]

### Style Modifiers
[Technical quality terms]

### Negative Prompts
[What to avoid]

### Full Prompt
[Single paragraph combining all elements for direct use in image generator]
</EBOOK_COVER>

<EBOOK_COVER:02-environment.md>
[Continue for all 5 variants...]
</EBOOK_COVER>

## Important

- Each prompt should be usable directly in GPT Image 1 or similar
- Be extremely specific — vague prompts produce generic results
- Avoid clichés unless they're genre-essential
- No text in the image — covers will have typography added separately
- Photorealistic only — never illustrated or painted style

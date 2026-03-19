# Audiobook Cover Prompt Generation

You are generating 5 detailed image generation prompts for audiobook covers.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate 5 distinct audiobook cover prompt variants. Audiobook covers have different requirements than ebook covers.

### Audiobook Cover Requirements

**Dimensions:** 2400 x 2400 pixels (1:1 square aspect ratio)
**Style:** Photorealistic cinematic quality — NOT illustrated, NOT painted, NOT anime
**Text:** Title and author name will be added separately — DO NOT include text in the image prompt
**Platform:** ACX/Audible specifications

### Key Differences from Ebook

- **Square format** requires centered composition
- **Thumbnail visibility** — must read clearly at 300x300 pixels
- **Simpler composition** — less detail, bolder shapes
- **Face prominence** — character faces should be larger and more visible
- **High contrast** — must stand out in small format

### Prompt Structure

Each prompt must include these sections in order:

1. **Subject** — The central figure or scene (be specific, consider thumbnail size)
2. **Composition** — Square framing, centered, bold positioning
3. **Setting** — Background (simpler than ebook — avoid busy backgrounds)
4. **Lighting** — High contrast, dramatic, clear face visibility
5. **Color Palette** — Bold, saturated colors that pop at small sizes
6. **Style Modifiers** — Technical quality terms (8K, cinematic, photorealistic, etc.)
7. **Negative Prompts** — What to avoid (text, watermarks, busy backgrounds, etc.)

### Variant Approaches

Create 5 distinctly different approaches:
1. **Close Portrait** — Face/upper body filling most of frame
2. **Profile Dramatic** — Side view with dramatic lighting
3. **Figure in Environment** — Full figure but environment simplified
4. **Dual Subject** — Two characters or character with key object
5. **Symbolic Bold** — Key symbol or object, very simple composition

## Output Format

Wrap each cover prompt in AUDIOBOOK_COVER tags:

<AUDIOBOOK_COVER:01-close-portrait.md>
## Audiobook Cover Prompt 1: Close Portrait

### Subject
[Detailed subject description optimized for square format]

### Composition
[Square framing details, centered, bold]

### Setting
[Simplified background for thumbnail clarity]

### Lighting
[High contrast, dramatic lighting]

### Color Palette
[Bold, saturated colors]

### Style Modifiers
[Technical quality terms]

### Negative Prompts
[What to avoid]

### Full Prompt
[Single paragraph combining all elements for direct use in image generator]
</AUDIOBOOK_COVER>

<AUDIOBOOK_COVER:02-profile-dramatic.md>
[Continue for all 5 variants...]
</AUDIOBOOK_COVER>

## Important

- Square format changes everything — center your subject
- Simplify backgrounds — they compress poorly at thumbnail size
- Bold colors and high contrast are essential
- Faces must be clearly visible at 300x300
- No text in the image — typography added separately
- Photorealistic only — never illustrated or painted style

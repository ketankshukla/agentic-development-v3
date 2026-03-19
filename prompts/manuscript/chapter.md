# Chapter Generation Prompt

You are generating a single chapter for a cinematic action fiction novel.

## Input

**Book Title:** {{TITLE}}
**Chapter Number:** {{CHAPTER_NUMBER}}
**Structural Role:** {{CHAPTER_ROLE}}
**Role Description:** {{CHAPTER_DESCRIPTION}}
**Word Target:** {{WORD_TARGET_MIN}} - {{WORD_TARGET_MAX}} words

**Book Plan:**
{{PLAN}}

## Instructions

Write Chapter {{CHAPTER_NUMBER}} following the plan exactly.

### Prose Requirements

1. **Natural Spoken Cadence** — Write prose that sounds natural when read aloud by Edge TTS
   - Varied sentence length (short punchy sentences mixed with flowing ones)
   - No stacked sentence fragments
   - Speakable dialogue with natural contractions

2. **Show Don't Tell** — Action and dialogue reveal character, not exposition dumps

3. **Cinematic Scenes** — Write like a film:
   - Clear scene geography
   - Visual action
   - Sensory details
   - Momentum through scenes

4. **Chapter Structure**
   - Strong opening hook (first paragraph grabs attention)
   - Rising tension through middle
   - Clear climax or turning point
   - Hook at end that pulls into next chapter

5. **Word Count** — Hit the target range: {{WORD_TARGET_MIN}}-{{WORD_TARGET_MAX}} words

### Structural Role: {{CHAPTER_ROLE}}

This chapter must fulfill its structural role:
{{CHAPTER_DESCRIPTION}}

### Format

- One top-level heading with chapter number and title
- Body as prose paragraphs
- Scene breaks indicated by `* * *` (centered, with blank lines before and after)
- No subheadings within the chapter

## Output Format

Wrap your chapter in CHAPTER tags:

<CHAPTER>
# Chapter {{CHAPTER_NUMBER}}: [Your Chapter Title]

[Opening paragraph that hooks...]

[Body of chapter...]

[Ending that pulls forward...]
</CHAPTER>

## Important

- Follow the plan for this chapter exactly
- Do not reference events from chapters not yet written
- Do not resolve the main conflict before Chapter 10
- Keep the protagonist active — they make decisions and take action
- End with forward momentum

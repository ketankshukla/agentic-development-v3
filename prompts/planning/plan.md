# Book Plan Generation Prompt

You are generating a detailed chapter-by-chapter plan for a cinematic action fiction novel.

## Input

**Book Brief:**
{{BRIEF}}

**Chapter Structure Template:**
{{CHAPTER_STRUCTURE}}

## Instructions

Using the book brief, create a detailed plan for all 10 chapters. This plan is the SOLE SOURCE for all manuscript content. After this plan is written, the original brief and concept are not referenced again.

For each chapter, provide:

1. **Chapter Number and Title** — An evocative title (not the structural role)

2. **Structural Role** — Which of the 10 roles this chapter fulfills

3. **Word Count Target** — Between 4,500 and 6,000 words

4. **POV** — Whose perspective (usually protagonist)

5. **Setting** — Primary location(s) for this chapter

6. **Opening State** — Where the protagonist is emotionally/physically at chapter start

7. **Key Events** — 4-6 major beats that happen in this chapter

8. **Conflict** — The primary tension/obstacle in this chapter

9. **Character Development** — How the protagonist changes

10. **Chapter-Ending Hook** — The moment that pulls reader into next chapter

11. **Notes for Prose** — Specific instructions for writing this chapter:
    - Pacing (fast/slow/builds)
    - Emotional tone
    - Any specific scenes to highlight
    - Dialogue vs action balance

## Output Format

Wrap your complete plan in <PLAN> tags:

<PLAN>
# Book Plan: [Title]

## Chapter 1: [Chapter Title]

**Role:** The Inciting World
**Word Target:** 5,000 words
**POV:** [Character name]
**Setting:** [Location]

**Opening State:**
[Description]

**Key Events:**
1. [Event]
2. [Event]
3. [Event]
4. [Event]

**Conflict:**
[Description]

**Character Development:**
[Description]

**Chapter-Ending Hook:**
[The moment that pulls reader forward]

**Prose Notes:**
[Specific writing instructions]

---

## Chapter 2: [Chapter Title]
[Continue for all 10 chapters...]

</PLAN>

## Important

- Every chapter must have a clear beginning, middle, and end
- Every chapter must end with forward momentum
- The 10-chapter structure must be followed exactly
- Chapter titles should be evocative, not generic ("The Storm Breaks" not "Chapter One")
- This plan must be detailed enough that a writer could draft each chapter without additional guidance

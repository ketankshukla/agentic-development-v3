# Book Brief Generation Prompt

You are generating a complete book brief for a cinematic action fiction novel.

## Input

**Genre:** {{GENRE}}
**Genre Details:**
{{GENRE_INFO}}

**Concept File:**
{{CONCEPT}}

## Instructions

Read the concept file carefully. Generate a complete production brief that contains everything needed to write this book.

The brief must include:

1. **Title** — The final book title (evocative, marketable, genre-appropriate)

2. **Logline** — One sentence that captures the entire story. Format: "When [PROTAGONIST] [INCITING INCIDENT], they must [GOAL] before [STAKES]."

3. **Protagonist Profile**
   - Name, age, key physical description
   - Background and skills
   - Core wound / internal flaw
   - What they want vs what they need
   - Voice / speech patterns

4. **Antagonist Profile**
   - Name (if individual) or description (if force/organization)
   - Motivation — why they oppose the protagonist
   - Methods — how they pursue their goal
   - Connection to protagonist

5. **Supporting Characters** (2-4 key characters)
   - Name and role
   - Relationship to protagonist
   - Function in the story

6. **Setting**
   - Primary locations
   - Time period
   - Atmosphere and tone
   - World rules (if fantasy/sci-fi)

7. **Central Conflict**
   - External conflict (plot)
   - Internal conflict (character arc)
   - Thematic conflict (ideas at stake)

8. **Stakes**
   - Personal stakes for protagonist
   - Broader stakes for world/others
   - What happens if protagonist fails

9. **10-Chapter Summary**
   - One paragraph per chapter describing key events
   - Must follow the cinematic structure: Inciting World → Pull → First Contact → Escalation → Push → Reversal → Descent → Reckoning → Assault → Resolution

10. **Thematic Core**
    - Central theme
    - How it manifests in the plot
    - The argument the book makes

11. **Tone Notes**
    - Pacing (fast/measured/varied)
    - Emotional register
    - Violence level (for action scenes)
    - Comparable titles / "X meets Y"

12. **Cinematic Set Pieces**
    - 3-5 major action sequences
    - What makes each visually distinctive

## Output Format

Wrap your complete brief in <BRIEF> tags:

<BRIEF>
# [Title]

## Logline
[One sentence]

## Protagonist
[Full profile]

## Antagonist
[Full profile]

## Supporting Characters
[Character list]

## Setting
[Full description]

## Central Conflict
[Conflicts described]

## Stakes
[Stakes described]

## 10-Chapter Summary
[All 10 chapters]

## Thematic Core
[Theme analysis]

## Tone Notes
[Tone guidance]

## Cinematic Set Pieces
[Major sequences]
</BRIEF>

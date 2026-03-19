# Backmatter Generation Prompt

You are generating the backmatter files for a cinematic action fiction novel.

## Input

**Title:** {{TITLE}}
**Author:** {{AUTHOR}}
**Publisher:** {{PUBLISHER}}

**Book Plan:**
{{PLAN}}

## Instructions

Generate the following 7 files:

### 1. Epilogue (14-epilogue.md)
Standard markdown with heading. 1000-1500 words.

The epilogue should:
- Show the new equilibrium after the climax
- Give the protagonist a moment of reflection
- Provide satisfying closure
- May hint at future possibilities (but NO cliffhangers)
- End on an emotionally resonant note

### 2. Acknowledgments (15-acknowledgments.md)
Standard markdown. Two elements only:

1. **Real verifiable facts** about real people or organizations relevant to the book's subject matter (historical figures, real places, research sources)
2. **Thematic tribute** to what the protagonist embodies

No invented experts. No fake beta readers. No personal relationships.

Example:
```
# Acknowledgments

The siege tactics described in this novel draw from historical accounts of the Ottoman siege of Vienna in 1683. The courage of those defenders inspired elements of this story.

This book is a tribute to those who stand their ground when the odds seem impossible — who find strength not in certainty of victory, but in the refusal to yield.
```

### 3. A Favour Please (16-a-favour-please.md)
Standard markdown. Exact content:

```
# A Favour, Please

If this story stayed with you, I'd be grateful if you'd leave a review wherever you found it.

A few words is all it takes. Reviews help other readers discover books they might enjoy, and they help independent authors keep writing.

Thank you for reading. I hope to see you in the next adventure.

{{AUTHOR}}
```

### 4. About the Author (17-about-the-author.md)
Standard markdown. 100-150 words.

Professional author bio for {{AUTHOR}}:
- Focus on writing career and genre specialization
- Mention Metronagon Media as publisher
- Keep tone confident but not boastful
- End with where they're based (San Diego, CA)

### 5. Also By (18-also-by.md)
Standard markdown. Placeholder content:

```
# Also By {{AUTHOR}}

*Coming Soon*

More cinematic action fiction from Metronagon Media.

Visit metronagon.com to discover new releases.
```

### 6. Closing Credits (19-closing-credits.md)
Plain text only. No markdown headings. No horizontal rules.
This plays at the end of the audiobook.

Format exactly:
```
{{TITLE}}

Written by {{AUTHOR}}

Published by {{PUBLISHER}}

Copyright {{YEAR}} {{AUTHOR}}
```

### 7. Retail Sample (20-retail-sample.md)
Plain text only. No markdown headings.

A compelling 500-800 word excerpt from Chapter 1 suitable as an audiobook retail preview. Choose the most gripping opening section that hooks listeners.

## Output Format

Wrap each file in FILE tags:

<FILE:14-epilogue.md>
[content]
</FILE>

<FILE:15-acknowledgments.md>
[content]
</FILE>

<FILE:16-a-favour-please.md>
[content]
</FILE>

<FILE:17-about-the-author.md>
[content]
</FILE>

<FILE:18-also-by.md>
[content]
</FILE>

<FILE:19-closing-credits.md>
[content]
</FILE>

<FILE:20-retail-sample.md>
[content]
</FILE>

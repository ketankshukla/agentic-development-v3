# Summary Generation Prompt

You are generating book summaries at three different lengths.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate three summaries:

### 1. One-Line Summary (summary-one-line.md)
- Maximum 150 characters
- Captures the essence in one punchy line
- Format: "[Protagonist type] must [action] before [stakes]"
- No spoilers

### 2. Short Summary (summary-short.md)
- 50-100 words
- Paragraph format
- Covers protagonist, conflict, stakes
- Hooks without spoiling
- Suitable for social media, quick descriptions

### 3. Extended Summary (summary-extended.md)
- 200-300 words
- Multiple paragraphs
- Deeper dive into world, characters, conflict
- Still no major spoilers
- Suitable for detailed book descriptions

## Output Format

<METADATA:summary-one-line.md>
[Single line, under 150 characters]
</METADATA>

<METADATA:summary-short.md>
[50-100 word paragraph]
</METADATA>

<METADATA:summary-extended.md>
[200-300 words in 2-3 paragraphs]
</METADATA>

# Description Generation Prompt

You are generating book descriptions for different platforms.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate three platform-specific descriptions:

### 1. Amazon Description (description-amazon.md)
- HTML formatted for KDP
- 4000 characters maximum
- Use `<h2>`, `<p>`, `<b>`, `<i>` tags
- Structure: Hook → Setup → Conflict → Stakes → Call to action
- End with genre/comparable titles
- Optimized for conversion

### 2. Plain Text Description (description-plain.md)
- No HTML or markdown
- Pure text with line breaks
- 500-700 words
- Suitable for wide distribution platforms
- Same content arc as Amazon version

### 3. ACX Description (description-acx.md)
- Audible/ACX specific
- 2000 characters maximum
- Mention audiobook-specific appeal (narrator, listening experience)
- Hook focused on audio experience

## Output Format

<METADATA:description-amazon.md>
<h2>A Gripping [Genre] Adventure</h2>

<p><b>[Hook sentence]</b></p>

<p>[Setup paragraph...]</p>

<p>[Conflict paragraph...]</p>

<p><i>[Stakes/tension line]</i></p>

<p>[Call to action]</p>

<p><b>Perfect for fans of:</b> [Comparable authors/titles]</p>
</METADATA>

<METADATA:description-plain.md>
[Plain text version with line breaks only]
</METADATA>

<METADATA:description-acx.md>
[Audiobook-focused description]
</METADATA>

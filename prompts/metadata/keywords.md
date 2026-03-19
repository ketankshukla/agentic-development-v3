# Keywords Generation Prompt

You are generating search keywords for book discovery.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate keywords using the **Reader Search Methodology**:

Think like a reader who wants exactly this book but doesn't know it exists. What would they search for?

### Keyword Categories to Cover

1. **Genre terms** — How readers describe this type of book
2. **Setting terms** — Where/when the story takes place
3. **Character types** — Who the protagonist is
4. **Theme terms** — What the book is about thematically
5. **Comparable terms** — "Books like X" / "X fans will love"
6. **Mood terms** — How the book feels
7. **Plot elements** — Key story elements readers search for

### Amazon Keywords (keywords-amazon.md)
- Exactly 7 keywords/phrases
- Each keyword can be up to 50 characters
- No commas within keywords (Amazon interprets as separate terms)
- Focus on high-intent search terms
- No author name or title

### Wide Platform Keywords (keywords-wide.md)
- 15 keywords/phrases
- For D2D, Kobo, Apple, Google Play, B&N
- Can include broader terms
- Comma-separated list

## Output Format

<METADATA:keywords-amazon.md>
1. [keyword phrase]
2. [keyword phrase]
3. [keyword phrase]
4. [keyword phrase]
5. [keyword phrase]
6. [keyword phrase]
7. [keyword phrase]
</METADATA>

<METADATA:keywords-wide.md>
[keyword 1], [keyword 2], [keyword 3], [keyword 4], [keyword 5], [keyword 6], [keyword 7], [keyword 8], [keyword 9], [keyword 10], [keyword 11], [keyword 12], [keyword 13], [keyword 14], [keyword 15]
</METADATA>

# Categories Generation Prompt

You are generating book categories for different platforms.

## Input

**Title:** {{TITLE}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

### Amazon Categories (categories-amazon.md)
- Provide 3 Amazon category paths
- Format: Category > Subcategory > Sub-subcategory
- Choose categories where this book could compete
- Note: These are best-effort suggestions — verify in KDP dashboard

### BISAC Codes (categories-bisac.md)
- Provide 3 BISAC codes with descriptions
- Format: CODE / Description
- These are industry-standard categories

### Wide Platform Categories (categories-wide.md)
- General category suggestions for:
  - Kobo
  - Apple Books
  - Google Play
  - Barnes & Noble
- List 2-3 categories per platform

## Output Format

<METADATA:categories-amazon.md>
## Amazon Categories (Verify in KDP)

1. Kindle Store > Kindle eBooks > [Path] > [Path] > [Path]
2. Kindle Store > Kindle eBooks > [Path] > [Path] > [Path]
3. Kindle Store > Kindle eBooks > [Path] > [Path] > [Path]

**Note:** Amazon categories change frequently. Verify these paths exist in the KDP dashboard before publishing.
</METADATA>

<METADATA:categories-bisac.md>
## BISAC Categories

1. FIC000000 / FICTION / [Category] / [Subcategory]
2. FIC000000 / FICTION / [Category] / [Subcategory]
3. FIC000000 / FICTION / [Category] / [Subcategory]
</METADATA>

<METADATA:categories-wide.md>
## Wide Distribution Categories

### Kobo
- [Category 1]
- [Category 2]

### Apple Books
- [Category 1]
- [Category 2]

### Google Play Books
- [Category 1]
- [Category 2]

### Barnes & Noble Press
- [Category 1]
- [Category 2]
</METADATA>

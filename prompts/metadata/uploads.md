# Upload Checklists Generation Prompt

You are generating platform-specific upload checklists for book publishing.

## Input

**Title:** {{TITLE}}
**Author:** {{AUTHOR}}
**Publisher:** {{PUBLISHER}}
**Genre:** {{GENRE}}

**Book Brief:**
{{BRIEF}}

## Instructions

Generate upload checklists for 9 platforms. Each checklist should be a ready-to-use form where the user can select all, copy, and paste directly into the platform.

### Platforms to Cover

1. **Amazon KDP** (upload-amazon.md)
2. **Draft2Digital** (upload-draft2digital.md)
3. **Kobo Writing Life** (upload-kobo.md)
4. **Apple Books** (upload-apple.md)
5. **Google Play Books** (upload-google-play.md)
6. **Barnes & Noble Press** (upload-bn-press.md)
7. **ACX/Audible** (upload-acx.md)
8. **Findaway Voices** (upload-findaway.md)
9. **IngramSpark** (upload-ingram.md)

### Common Fields

All platforms need some combination of:
- Title
- Subtitle (if applicable)
- Author name
- Publisher name
- Description
- Keywords/Tags
- Categories
- Language (English)
- Publication date
- Price suggestions
- Rights/Territory
- Age rating / Content warnings

### Platform-Specific Notes

**Amazon KDP:**
- AI Disclosure: YES (always check this box)
- Kindle Unlimited enrollment: User decision
- Price: $4.99 suggested for ebook

**ACX:**
- Narrator: Already recorded (Azure Neural TTS)
- Rights: Exclusive vs Non-Exclusive choice
- Retail price: User decision

**IngramSpark:**
- ISBN required
- Print specifications needed

## Output Format

<METADATA:upload-amazon.md>
# Amazon KDP Upload Checklist

## Ebook Details

**Title:** {{TITLE}}
**Subtitle:** [Leave blank or suggest]
**Series:** Standalone
**Edition:** 1
**Author:** {{AUTHOR}}
**Contributors:** None

## Description
[Copy from description-amazon.md]

## Keywords
[Copy from keywords-amazon.md]

## Categories
[Copy from categories-amazon.md]

## Content Settings
- **Language:** English
- **Publication Date:** [Today's date]
- **AI-Generated Content:** ✅ YES — Check this box

## Pricing
- **KDP Select Enrollment:** [User decision]
- **Territories:** Worldwide
- **Primary Marketplace:** Amazon.com
- **List Price:** $4.99 USD (suggested)

## Files Required
- [ ] Manuscript: EPUB or DOCX
- [ ] Cover: 1600x2400 PNG or JPG
</METADATA>

<METADATA:upload-draft2digital.md>
[D2D specific checklist...]
</METADATA>

[Continue for all 9 platforms...]

# Chapter Summaries Generation Prompt

You are generating summaries for all 10 chapters.

## Input

**Title:** {{TITLE}}

**Book Plan:**
{{PLAN}}

## Instructions

Generate a summary for each of the 10 chapters. These summaries are used for:
- ACX chapter markers
- Marketing materials
- Reader reference

### Summary Requirements

- 100-200 words per chapter
- Written in past tense
- Cover key events without major spoilers
- Capture the emotional arc of the chapter
- End with the chapter's key turning point

### Format

Each summary should:
1. Open with the chapter's main action
2. Describe 2-3 key events
3. Note character development
4. End with the state at chapter's close

## Output Format

<CHAPTER_SUMMARY:ch01>
[100-200 word summary of Chapter 1]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch02>
[100-200 word summary of Chapter 2]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch03>
[100-200 word summary of Chapter 3]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch04>
[100-200 word summary of Chapter 4]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch05>
[100-200 word summary of Chapter 5]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch06>
[100-200 word summary of Chapter 6]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch07>
[100-200 word summary of Chapter 7]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch08>
[100-200 word summary of Chapter 8]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch09>
[100-200 word summary of Chapter 9]
</CHAPTER_SUMMARY>

<CHAPTER_SUMMARY:ch10>
[100-200 word summary of Chapter 10]
</CHAPTER_SUMMARY>

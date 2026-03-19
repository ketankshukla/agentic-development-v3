/**
 * lib/parser.js
 * Structured output parsing for all response types
 * 
 * OpenClaw Pattern: Parse structured outputs into clean data.
 * The model outputs in a predictable format, the parser extracts it.
 * Never rely on regex for complex content — use delimiters.
 */

// ============================================================================
// SECTION EXTRACTORS
// ============================================================================

/**
 * Extract content between XML-style tags
 * 
 * Usage: extractSection(text, "BRIEF") extracts content from <BRIEF>...</BRIEF>
 */
export function extractSection(text, sectionName) {
  const regex = new RegExp(
    `<${sectionName}>([\\s\\S]*?)</${sectionName}>`,
    "i"
  );
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract all sections matching a pattern
 * 
 * Usage: extractAllSections(text, "CHAPTER") returns array of chapter contents
 */
export function extractAllSections(text, sectionName) {
  const regex = new RegExp(
    `<${sectionName}>([\\s\\S]*?)</${sectionName}>`,
    "gi"
  );
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

// ============================================================================
// FILE PARSERS
// ============================================================================

/**
 * Parse manuscript files from model output
 * 
 * Expected format:
 * <FILE:00-opening-credits.md>
 * content here
 * </FILE>
 */
export function parseManuscriptFiles(text) {
  const files = {};
  const regex = /<FILE:([\w-]+\.md)>([\s\S]*?)<\/FILE>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1];
    const content = match[2].trim();
    files[filename] = content;
  }
  return files;
}

/**
 * Parse cover prompt files from model output
 * 
 * Expected format:
 * <EBOOK_COVER:01-dramatic-hero.md>
 * prompt content
 * </EBOOK_COVER>
 */
export function parseCoverFiles(text) {
  const ebook = {};
  const audiobook = {};
  
  // Parse ebook covers
  const ebookRegex = /<EBOOK_COVER:([\w-]+\.md)>([\s\S]*?)<\/EBOOK_COVER>/gi;
  let match;
  while ((match = ebookRegex.exec(text)) !== null) {
    ebook[match[1]] = match[2].trim();
  }
  
  // Parse audiobook covers
  const audioRegex = /<AUDIOBOOK_COVER:([\w-]+\.md)>([\s\S]*?)<\/AUDIOBOOK_COVER>/gi;
  while ((match = audioRegex.exec(text)) !== null) {
    audiobook[match[1]] = match[2].trim();
  }
  
  return { ebook, audiobook };
}

/**
 * Parse metadata files from model output
 * 
 * Expected format:
 * <METADATA:summary-one-line.md>
 * content
 * </METADATA>
 */
export function parseMetadataFiles(text) {
  const files = {};
  const regex = /<METADATA:([\w-]+\.md)>([\s\S]*?)<\/METADATA>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    files[match[1]] = match[2].trim();
  }
  return files;
}

/**
 * Parse chapter summaries from model output
 * 
 * Expected format:
 * <CHAPTER_SUMMARY:ch01>
 * summary content
 * </CHAPTER_SUMMARY>
 */
export function parseChapterSummaries(text) {
  const summaries = {};
  const regex = /<CHAPTER_SUMMARY:(ch\d{2})>([\s\S]*?)<\/CHAPTER_SUMMARY>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    summaries[match[1]] = match[2].trim();
  }
  return summaries;
}

// ============================================================================
// CONTENT EXTRACTORS
// ============================================================================

/**
 * Extract the book title from brief content
 */
export function extractTitle(briefContent) {
  // Try markdown heading
  const h1Match = briefContent.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  
  // Try "Title:" format
  const titleMatch = briefContent.match(/^Title:\s*(.+)$/mi);
  if (titleMatch) return titleMatch[1].trim();
  
  // Try first line
  const firstLine = briefContent.split("\n")[0];
  return firstLine.replace(/^#+\s*/, "").trim();
}

/**
 * Extract chapter title from chapter content
 */
export function extractChapterTitle(chapterContent) {
  const match = chapterContent.match(/^#\s+(?:Chapter\s+\d+[:\s-]+)?(.+)$/mi);
  return match ? match[1].trim() : "Untitled Chapter";
}

/**
 * Count words in content
 */
export function countWords(content) {
  return content
    .replace(/[#*_`]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that all required sections are present
 */
export function validateSections(text, requiredSections) {
  const missing = [];
  for (const section of requiredSections) {
    if (!extractSection(text, section)) {
      missing.push(section);
    }
  }
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate manuscript file completeness
 */
export function validateManuscriptFiles(files, expectedFiles) {
  const missing = [];
  const present = Object.keys(files);
  
  for (const expected of expectedFiles) {
    if (!present.includes(expected)) {
      missing.push(expected);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    present,
    total: present.length,
  };
}

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * Extract and parse JSON from model output
 * Handles markdown code blocks and raw JSON
 */
export function extractJSON(text) {
  // Try to extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // Fall through to try raw parse
    }
  }
  
  // Try to find JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      return null;
    }
  }
  
  return null;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  extractSection,
  extractAllSections,
  parseManuscriptFiles,
  parseCoverFiles,
  parseMetadataFiles,
  parseChapterSummaries,
  extractTitle,
  extractChapterTitle,
  countWords,
  validateSections,
  validateManuscriptFiles,
  extractJSON,
};

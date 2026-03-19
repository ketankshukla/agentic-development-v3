/**
 * lib/files.js
 * File system utilities for the book generation pipeline
 * 
 * OpenClaw Pattern: All file operations go through a single module.
 * This makes it easy to test, mock, and change storage backends.
 */

import fs from "fs/promises";
import path from "path";

// ============================================================================
// DIRECTORY OPERATIONS
// ============================================================================

/**
 * Create directory structure for a new book
 */
export async function createBookStructure(bookPath) {
  const dirs = [
    bookPath,
    path.join(bookPath, "01-planning"),
    path.join(bookPath, "02-manuscript"),
    path.join(bookPath, "03-covers"),
    path.join(bookPath, "03-covers", "prompts"),
    path.join(bookPath, "03-covers", "prompts", "ebook"),
    path.join(bookPath, "03-covers", "prompts", "audiobook"),
    path.join(bookPath, "03-covers", "images"),
    path.join(bookPath, "04-metadata"),
    path.join(bookPath, "04-metadata", "chapter-summaries"),
    path.join(bookPath, "05-output"),
    path.join(bookPath, "05-output", "mp3"),
    path.join(bookPath, "05-output", "m4b"),
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  return dirs;
}

/**
 * Check if a directory exists
 */
export async function dirExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * List all files in a directory matching a pattern
 */
export async function listFiles(dirPath, pattern = "*") {
  try {
    const files = await fs.readdir(dirPath);
    if (pattern === "*") {
      return files;
    }
    const regex = new RegExp(pattern.replace("*", ".*"));
    return files.filter((f) => regex.test(f));
  } catch {
    return [];
  }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Read a file as UTF-8 text
 */
export async function readFile(filePath) {
  return fs.readFile(filePath, "utf-8");
}

/**
 * Write content to a file
 */
export async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Append content to a file
 */
export async function appendFile(filePath, content) {
  await fs.appendFile(filePath, content, "utf-8");
}

/**
 * Copy a file
 */
export async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

/**
 * Delete a file
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// BOOK-SPECIFIC OPERATIONS
// ============================================================================

/**
 * Write multiple manuscript files at once
 */
export async function writeManuscriptFiles(bookPath, files) {
  const manuscriptDir = path.join(bookPath, "02-manuscript");
  const written = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(manuscriptDir, filename);
    await writeFile(filePath, content);
    written.push(filename);
  }
  
  return written;
}

/**
 * Write cover prompt files
 */
export async function writeCoverFiles(bookPath, covers) {
  const baseDir = path.join(bookPath, "03-covers", "prompts");
  const written = { ebook: [], audiobook: [] };
  
  for (const [filename, content] of Object.entries(covers.ebook || {})) {
    const filePath = path.join(baseDir, "ebook", filename);
    await writeFile(filePath, content);
    written.ebook.push(filename);
  }
  
  for (const [filename, content] of Object.entries(covers.audiobook || {})) {
    const filePath = path.join(baseDir, "audiobook", filename);
    await writeFile(filePath, content);
    written.audiobook.push(filename);
  }
  
  return written;
}

/**
 * Write metadata files
 */
export async function writeMetadataFiles(bookPath, files) {
  const metadataDir = path.join(bookPath, "04-metadata");
  const written = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(metadataDir, filename);
    await writeFile(filePath, content);
    written.push(filename);
  }
  
  return written;
}

/**
 * Write chapter summaries
 */
export async function writeChapterSummaries(bookPath, summaries) {
  const summaryDir = path.join(bookPath, "04-metadata", "chapter-summaries");
  const written = [];
  
  for (const [chapterId, content] of Object.entries(summaries)) {
    const filename = `${chapterId}-summary.md`;
    const filePath = path.join(summaryDir, filename);
    await writeFile(filePath, content);
    written.push(filename);
  }
  
  return written;
}

/**
 * Read the concept file for a book
 */
export async function readConcept(conceptPath) {
  return readFile(conceptPath);
}

/**
 * Read the book brief
 */
export async function readBrief(bookPath) {
  return readFile(path.join(bookPath, "01-planning", "book-brief.md"));
}

/**
 * Read the book plan
 */
export async function readPlan(bookPath) {
  return readFile(path.join(bookPath, "01-planning", "book-plan.md"));
}

/**
 * Read a prompt template
 */
export async function readPrompt(promptsPath, category, name) {
  const filePath = path.join(promptsPath, category, `${name}.md`);
  return readFile(filePath);
}

// ============================================================================
// CONCEPT FILE OPERATIONS
// ============================================================================

/**
 * List all concept files for a genre
 */
export async function listConcepts(conceptsPath, genre) {
  const genrePath = path.join(conceptsPath, genre);
  const files = await listFiles(genrePath, "*.md");
  return files.filter((f) => f !== ".gitkeep");
}

/**
 * List all genres with concepts
 */
export async function listGenresWithConcepts(conceptsPath) {
  const genres = await fs.readdir(conceptsPath);
  const withConcepts = [];
  
  for (const genre of genres) {
    const concepts = await listConcepts(conceptsPath, genre);
    if (concepts.length > 0) {
      withConcepts.push({ genre, count: concepts.length });
    }
  }
  
  return withConcepts;
}

// ============================================================================
// TRACKING & LOGGING
// ============================================================================

/**
 * Update the book completion tracker
 */
export async function updateCompletionTracker(docsPath, entry) {
  const trackerPath = path.join(docsPath, "book-completion-tracker.md");
  const line = `| ${entry.date} | ${entry.genre} | ${entry.slug} | ${entry.title} | ${entry.status} |\n`;
  
  if (await fileExists(trackerPath)) {
    await appendFile(trackerPath, line);
  } else {
    const header = `# Book Completion Tracker\n\n| Date | Genre | Slug | Title | Status |\n|------|-------|------|-------|--------|\n`;
    await writeFile(trackerPath, header + line);
  }
}

/**
 * Write generation log
 */
export async function writeGenerationLog(bookPath, log) {
  const logPath = path.join(bookPath, "generation-log.json");
  await writeFile(logPath, JSON.stringify(log, null, 2));
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  createBookStructure,
  dirExists,
  fileExists,
  listFiles,
  readFile,
  writeFile,
  appendFile,
  copyFile,
  deleteFile,
  writeManuscriptFiles,
  writeCoverFiles,
  writeMetadataFiles,
  writeChapterSummaries,
  readConcept,
  readBrief,
  readPlan,
  readPrompt,
  listConcepts,
  listGenresWithConcepts,
  updateCompletionTracker,
  writeGenerationLog,
};

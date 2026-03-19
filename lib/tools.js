/**
 * lib/tools.js
 * Tool runners for Python and PowerShell scripts
 * 
 * OpenClaw Pattern: External tools are wrapped in a consistent interface.
 * Each tool has clear inputs, outputs, and error handling.
 */

import { spawn } from "child_process";
import path from "path";
import { paths, getVoice, sanitizeFilename, author } from "../config.js";

// ============================================================================
// BASE RUNNERS
// ============================================================================

/**
 * Run a Python script with arguments
 */
export function runPython(script, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(paths.python, [script, ...args], {
      stdio: "pipe",
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject(new Error(`Python script failed (exit ${code}): ${stderr || stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

/**
 * Run a PowerShell script with parameters
 */
export function runPowerShell(script, params = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      "-ExecutionPolicy", "Bypass",
      "-File", script,
    ];

    // Add parameters
    for (const [key, value] of Object.entries(params)) {
      args.push(`-${key}`, value);
    }

    const proc = spawn("powershell", args, {
      stdio: "pipe",
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject(new Error(`PowerShell script failed (exit ${code}): ${stderr || stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start PowerShell: ${err.message}`));
    });
  });
}

// ============================================================================
// AUDIOBOOK TOOLS
// ============================================================================

/**
 * Generate MP3 files from manuscript
 * 
 * Input: book path, voice name
 * Output: MP3 files in 05-output/mp3/
 */
export async function generateMP3s(bookPath, genre) {
  const script = path.join(paths.tools, "audiobook", "generate-mp3s.py");
  const voice = getVoice(genre);
  
  return runPython(script, [
    "--book-path", bookPath,
    "--voice", voice,
  ]);
}

/**
 * Upscale audiobook cover to 2400x2400
 * 
 * Input: path to audiobook-cover.png
 * Output: upscaled image at same path
 */
export async function upscaleAudiobookCover(bookPath) {
  const script = path.join(paths.tools, "audiobook", "upscale-audiobook-cover.py");
  const coverPath = path.join(bookPath, "03-covers", "images", "audiobook-cover.png");
  
  return runPython(script, [coverPath]);
}

/**
 * Create M4B audiobook
 * 
 * Input: book path, author, title
 * Output: M4B file in 05-output/m4b/
 */
export async function createM4B(bookPath, title) {
  const script = path.join(paths.tools, "audiobook", "create-m4b.py");
  const safeTitle = sanitizeFilename(title);
  
  return runPython(script, [
    "--book-path", bookPath,
    "--author", author.name,
    "--title", safeTitle,
  ]);
}

// ============================================================================
// DOCUMENT TOOLS
// ============================================================================

/**
 * Generate DOCX from manuscript
 * 
 * Input: book path, author, title
 * Output: DOCX file in 05-output/
 */
export async function generateDOCX(bookPath, title) {
  const script = path.join(paths.tools, "docx", "generate-docx.ps1");
  const safeTitle = sanitizeFilename(title);
  
  return runPowerShell(script, {
    BookPath: bookPath,
    Author: author.name,
    Title: safeTitle,
  });
}

/**
 * Generate EPUB from manuscript
 * 
 * Input: book path, author, title
 * Output: EPUB file in 05-output/
 */
export async function generateEPUB(bookPath, title) {
  const script = path.join(paths.tools, "epub", "generate-epub.py");
  const safeTitle = sanitizeFilename(title);
  
  return runPython(script, [
    "--book-path", bookPath,
    "--author", author.name,
    "--title", safeTitle,
  ]);
}

/**
 * Generate PDF with cover
 * 
 * Input: book path, author, title
 * Output: PDF file in 05-output/
 */
export async function generatePDF(bookPath, title) {
  const script = path.join(paths.tools, "pdf", "generate-pdf.py");
  const safeTitle = sanitizeFilename(title);
  
  return runPython(script, [
    "--book-path", bookPath,
    "--author", author.name,
    "--title", safeTitle,
  ]);
}

/**
 * Generate KDP PDF without cover
 * 
 * Input: book path, author, title
 * Output: PDF file in 05-output/
 */
export async function generatePDFKDP(bookPath, title) {
  const script = path.join(paths.tools, "pdf", "generate-pdf-kdp.py");
  const safeTitle = sanitizeFilename(title);
  
  return runPython(script, [
    "--book-path", bookPath,
    "--author", author.name,
    "--title", safeTitle,
  ]);
}

// ============================================================================
// ORCHESTRATION
// ============================================================================

/**
 * Run all output generation tools in sequence
 * 
 * This is the Phase 5 execution — all tools that convert manuscript to final outputs.
 * Tools are run in order. Failures are logged but don't stop the sequence.
 */
export async function runAllOutputTools(bookPath, title, genre, onProgress) {
  const results = {
    mp3: { status: "pending" },
    docx: { status: "pending" },
    epub: { status: "pending" },
    pdf: { status: "pending" },
    pdfKdp: { status: "pending" },
    m4b: { status: "pending" },
  };

  const steps = [
    { id: "mp3", name: "MP3 Audiobook", fn: () => generateMP3s(bookPath, genre) },
    { id: "docx", name: "DOCX", fn: () => generateDOCX(bookPath, title) },
    { id: "epub", name: "EPUB", fn: () => generateEPUB(bookPath, title) },
    { id: "pdf", name: "PDF with Cover", fn: () => generatePDF(bookPath, title) },
    { id: "pdfKdp", name: "PDF for KDP", fn: () => generatePDFKDP(bookPath, title) },
    // M4B requires cover — may fail if cover not present
    { id: "m4b", name: "M4B Audiobook", fn: () => createM4B(bookPath, title) },
  ];

  for (const step of steps) {
    if (onProgress) {
      onProgress(`Running: ${step.name}...`);
    }

    try {
      const result = await step.fn();
      results[step.id] = { status: "success", ...result };
    } catch (error) {
      results[step.id] = { status: "failed", error: error.message };
      // Continue with next tool — don't stop on failure
    }
  }

  return results;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check that all required tools are available
 */
export async function validateTools() {
  const checks = [];

  // Check Python
  try {
    await runPython("-c", ["print('ok')"]);
    checks.push({ tool: "Python", status: "ok", path: paths.python });
  } catch (error) {
    checks.push({ tool: "Python", status: "missing", path: paths.python, error: error.message });
  }

  // Check PowerShell (always available on Windows)
  checks.push({ tool: "PowerShell", status: "ok", path: "powershell" });

  return checks;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  runPython,
  runPowerShell,
  generateMP3s,
  upscaleAudiobookCover,
  createM4B,
  generateDOCX,
  generateEPUB,
  generatePDF,
  generatePDFKDP,
  runAllOutputTools,
  validateTools,
};

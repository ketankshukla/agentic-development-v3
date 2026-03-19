/**
 * config.js
 * Central configuration for agentic-development-v3
 * 
 * OpenClaw Pattern: All configuration in one place, no magic strings scattered through code.
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// PATHS — Windows paths for your machine
// ============================================================================

export const paths = {
  // Project root (this folder)
  root: "e:\\agentic-development-v3",
  
  // Subfolders
  concepts: "e:\\agentic-development-v3\\concepts",
  books: "e:\\agentic-development-v3\\books",
  prompts: "e:\\agentic-development-v3\\prompts",
  tools: "e:\\agentic-development-v3\\tools",
  docs: "e:\\agentic-development-v3\\docs",
  
  // External tools (verified on your machine)
  python: "C:\\Python314\\python.exe",
  pandoc: "C:\\Users\\ketan\\AppData\\Local\\Pandoc\\pandoc.exe",
  xelatex: "C:\\Users\\ketan\\AppData\\Local\\Programs\\MiKTeX\\miktex\\bin\\x64\\xelatex.exe",
  ffmpeg: "C:\\ffmpeg\\bin\\ffmpeg.exe",
};

// ============================================================================
// MODELS — Claude models for different tasks
// ============================================================================

export const models = {
  // Primary generation model — best creative output
  primary: "claude-sonnet-4-20250514",
  
  // Thinking model for planning phases
  thinking: "claude-sonnet-4-20250514",
  
  // Fast model for simple tasks (metadata, summaries)
  fast: "claude-sonnet-4-20250514",
  
  // Max tokens for different task types
  tokens: {
    brief: 8000,
    plan: 12000,
    chapter: 16000,
    frontmatter: 2000,
    backmatter: 2000,
    coverPrompt: 4000,
    metadata: 4000,
    summary: 2000,
  },
};

// ============================================================================
// AUTHOR — Single author for all books in v3
// ============================================================================

export const author = {
  name: "Ketan Shukla",
  publisher: "Metronagon Media",
  copyright: "2026",
  voice: "en-US-GuyNeural", // Default TTS voice
};

// ============================================================================
// GENRES — All 13 cinematic action fiction genres with voices and comparables
// ============================================================================

export const genres = {
  "epic-fantasy": {
    name: "Epic Fantasy",
    voice: "en-GB-RyanNeural",
    description: "Sweeping fantasy with world-ending stakes, chosen ones, and epic battles. Think Lord of the Rings meets Game of Thrones.",
    comparables: ["Brandon Sanderson", "Joe Abercrombie", "Robert Jordan"],
  },
  "sword-and-sorcery": {
    name: "Sword and Sorcery",
    voice: "en-US-GuyNeural",
    description: "Personal-scale fantasy focused on a lone warrior or small band. Magic is dangerous and rare. Think Conan, Elric, Fafhrd and the Gray Mouser.",
    comparables: ["Robert E. Howard", "Fritz Leiber", "Michael Moorcock"],
  },
  "military-fantasy": {
    name: "Military Fantasy",
    voice: "en-US-ChristopherNeural",
    description: "Fantasy warfare with tactical depth. Armies, sieges, military hierarchy. Think Black Company meets Band of Brothers.",
    comparables: ["Glen Cook", "Brian McClellan", "Django Wexler"],
  },
  "mythological-action": {
    name: "Mythological Action",
    voice: "en-GB-RyanNeural",
    description: "Gods, demigods, and mythic heroes in action-driven plots. Greek, Norse, Hindu, Egyptian — any pantheon, treated as real.",
    comparables: ["Madeline Miller", "Rick Riordan (adult)", "Neil Gaiman"],
  },
  "historical-action": {
    name: "Historical Action",
    voice: "en-US-AndrewNeural",
    description: "Real historical settings with action-adventure plots. Gladiators, samurai, knights, pirates — grounded in authentic detail.",
    comparables: ["Bernard Cornwell", "Conn Iggulden", "Christian Cameron"],
  },
  "action-adventure": {
    name: "Action-Adventure",
    voice: "en-US-DavisNeural",
    description: "Modern or near-modern adventure thrillers. Treasure hunts, globe-trotting, high-octane set pieces. Indiana Jones energy.",
    comparables: ["Clive Cussler", "James Rollins", "Matthew Reilly"],
  },
  "lost-world": {
    name: "Lost World",
    voice: "en-GB-RyanNeural",
    description: "Hidden civilizations, uncharted territories, impossible ecosystems. The wonder of discovery meets survival danger.",
    comparables: ["Michael Crichton", "Preston & Child", "James Rollins"],
  },
  "pirate-naval": {
    name: "Pirate & Naval Adventure",
    voice: "en-GB-RyanNeural",
    description: "Age of sail adventures. Ship combat, treasure, naval warfare, Caribbean or beyond. Swashbuckling at sea.",
    comparables: ["Patrick O'Brian", "Naomi Novik", "Tim Powers"],
  },
  "supernatural-thriller": {
    name: "Supernatural Thriller",
    voice: "en-US-EricNeural",
    description: "Horror-adjacent thrillers with supernatural elements. Tension-driven, often investigative, always unsettling.",
    comparables: ["Dean Koontz", "Peter Straub", "Paul Tremblay"],
  },
  "techno-thriller": {
    name: "Techno-Thriller",
    voice: "en-US-ChristopherNeural",
    description: "Technology-driven thrillers. Cyber warfare, AI, military tech, near-future speculation with real-world grounding.",
    comparables: ["Tom Clancy", "Michael Crichton", "Daniel Suarez"],
  },
  "survival-thriller": {
    name: "Survival Thriller",
    voice: "en-US-GuyNeural",
    description: "Protagonist vs environment. Wilderness survival, disaster scenarios, isolation. Man vs nature at its most primal.",
    comparables: ["Andy Weir", "Blake Crouch", "C.J. Box"],
  },
  "post-apocalyptic": {
    name: "Post-Apocalyptic",
    voice: "en-US-EricNeural",
    description: "After the fall. Survival in collapsed civilizations. Resource scarcity, tribal conflict, the struggle to rebuild.",
    comparables: ["Cormac McCarthy", "Emily St. John Mandel", "Hugh Howey"],
  },
  "gladiatorial": {
    name: "Gladiatorial",
    voice: "en-US-AndrewNeural",
    description: "Arena combat, blood sport, forced warriors. Roman gladiators, fantasy arenas, death games — the spectacle of survival.",
    comparables: ["Simon Scarrow", "Ben Kane", "Suzanne Collins (adult)"],
  },
};

// ============================================================================
// CHAPTER STRUCTURE — The 10-chapter cinematic template
// ============================================================================

export const chapterStructure = [
  {
    number: 1,
    role: "The Inciting World",
    description: "Establish the protagonist in their world at the moment everything is about to change. End with the disruption that makes the old life impossible.",
    wordTarget: [4500, 6000],
  },
  {
    number: 2,
    role: "The Pull",
    description: "The protagonist is drawn into the conflict. They resist, then cross the threshold. The central problem becomes undeniable.",
    wordTarget: [4500, 6000],
  },
  {
    number: 3,
    role: "First Contact",
    description: "First direct encounter with the antagonistic force. The protagonist learns what they're truly up against. Stakes become personal.",
    wordTarget: [4500, 6000],
  },
  {
    number: 4,
    role: "Escalation",
    description: "Complications multiply. Allies and enemies crystallize. The protagonist commits fully. No turning back.",
    wordTarget: [4500, 6000],
  },
  {
    number: 5,
    role: "The Push",
    description: "Protagonist takes offensive action. Early victories or progress. Confidence builds. The plan seems to be working.",
    wordTarget: [4500, 6000],
  },
  {
    number: 6,
    role: "The Reversal",
    description: "Everything goes wrong. The plan fails catastrophically. The protagonist suffers their greatest loss. All seems lost.",
    wordTarget: [4500, 6000],
  },
  {
    number: 7,
    role: "The Descent",
    description: "The protagonist hits bottom. Dark night of the soul. They must confront their deepest flaw or fear to continue.",
    wordTarget: [4500, 6000],
  },
  {
    number: 8,
    role: "The Reckoning",
    description: "The protagonist rises with new understanding. They forge a new plan. Allies rally. The final push begins.",
    wordTarget: [4500, 6000],
  },
  {
    number: 9,
    role: "The Assault",
    description: "The climactic confrontation. Maximum action, maximum stakes. The protagonist faces the antagonist directly.",
    wordTarget: [4500, 6000],
  },
  {
    number: 10,
    role: "Resolution",
    description: "The aftermath. New equilibrium established. The protagonist is transformed. The story resolves completely — no cliffhangers.",
    wordTarget: [4500, 6000],
  },
];

// ============================================================================
// MANUSCRIPT FILES — All 21 files in order
// ============================================================================

export const manuscriptFiles = [
  { id: "00", name: "opening-credits", type: "audiobook-only", format: "plain" },
  { id: "01", name: "copyright", type: "frontmatter", format: "markdown" },
  { id: "02", name: "dedication", type: "frontmatter", format: "markdown" },
  { id: "03", name: "prologue", type: "frontmatter", format: "markdown" },
  { id: "04", name: "ch01", type: "chapter", format: "markdown" },
  { id: "05", name: "ch02", type: "chapter", format: "markdown" },
  { id: "06", name: "ch03", type: "chapter", format: "markdown" },
  { id: "07", name: "ch04", type: "chapter", format: "markdown" },
  { id: "08", name: "ch05", type: "chapter", format: "markdown" },
  { id: "09", name: "ch06", type: "chapter", format: "markdown" },
  { id: "10", name: "ch07", type: "chapter", format: "markdown" },
  { id: "11", name: "ch08", type: "chapter", format: "markdown" },
  { id: "12", name: "ch09", type: "chapter", format: "markdown" },
  { id: "13", name: "ch10", type: "chapter", format: "markdown" },
  { id: "14", name: "epilogue", type: "backmatter", format: "markdown" },
  { id: "15", name: "acknowledgments", type: "backmatter", format: "markdown" },
  { id: "16", name: "a-favour-please", type: "backmatter", format: "markdown" },
  { id: "17", name: "about-the-author", type: "backmatter", format: "markdown" },
  { id: "18", name: "also-by", type: "backmatter", format: "markdown" },
  { id: "19", name: "closing-credits", type: "audiobook-only", format: "plain" },
  { id: "20", name: "retail-sample", type: "audiobook-only", format: "plain" },
];

// ============================================================================
// METADATA FILES — All files generated in Phase 4
// ============================================================================

export const metadataFiles = [
  "summary-one-line",
  "summary-short",
  "summary-extended",
  "description-amazon",
  "description-plain",
  "description-acx",
  "keywords-amazon",
  "keywords-wide",
  "categories-amazon",
  "categories-bisac",
  "categories-wide",
  "target-audience",
  "upload-amazon",
  "upload-draft2digital",
  "upload-kobo",
  "upload-apple",
  "upload-google-play",
  "upload-bn-press",
  "upload-acx",
  "upload-findaway",
  "upload-ingram",
];

// ============================================================================
// PIPELINE PHASES — OpenClaw-style phase definitions
// ============================================================================

export const phases = [
  {
    id: "planning",
    name: "Planning",
    tasks: ["brief", "plan", "readme"],
    description: "Generate book brief and detailed chapter plan",
  },
  {
    id: "manuscript",
    name: "Manuscript",
    tasks: ["frontmatter", "chapters", "backmatter"],
    description: "Generate all 21 manuscript files",
  },
  {
    id: "covers",
    name: "Cover Prompts",
    tasks: ["ebook-prompts", "audiobook-prompts"],
    description: "Generate 5 ebook and 5 audiobook cover prompts",
  },
  {
    id: "metadata",
    name: "Metadata",
    tasks: ["summaries", "descriptions", "keywords", "categories", "uploads", "chapter-summaries"],
    description: "Generate all metadata and upload checklists",
  },
  {
    id: "output",
    name: "Output Generation",
    tasks: ["mp3", "docx", "epub", "pdf", "pdf-kdp", "m4b"],
    description: "Run tools to generate final output files",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the book path for a given genre and slug
 */
export function getBookPath(genre, bookSlug) {
  return path.join(paths.books, genre, bookSlug);
}

/**
 * Get the concept path for a given genre and concept slug
 */
export function getConceptPath(genre, conceptSlug) {
  return path.join(paths.concepts, genre, `${conceptSlug}.md`);
}

/**
 * Derive book slug from concept slug (strip NNN- prefix)
 */
export function deriveBookSlug(conceptSlug) {
  return conceptSlug.replace(/^\d{3}-/, "");
}

/**
 * Get TTS voice for a genre
 */
export function getVoice(genre) {
  return genres[genre]?.voice || author.voice;
}

/**
 * Sanitize a title for use as a filename
 */
export function sanitizeFilename(title) {
  return title.replace(/[:/\\*?"<>|]/g, "-").trim();
}

export default {
  paths,
  models,
  author,
  genres,
  chapterStructure,
  manuscriptFiles,
  metadataFiles,
  phases,
  getBookPath,
  getConceptPath,
  deriveBookSlug,
  getVoice,
  sanitizeFilename,
};

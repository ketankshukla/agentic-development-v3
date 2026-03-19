/**
 * lib/brain.js
 * Main orchestrator for the book generation pipeline
 * 
 * OpenClaw Pattern: The "brain" coordinates all phases and tasks.
 * It maintains state, sequences operations, and handles errors.
 * Intelligence lives in prompts — the brain just runs the playbook.
 */

import path from "path";
import { 
  paths, 
  models, 
  author, 
  genres, 
  chapterStructure,
  manuscriptFiles,
  metadataFiles,
  getBookPath, 
  getConceptPath, 
  deriveBookSlug,
  getVoice,
  sanitizeFilename,
} from "../config.js";
import { createAgent } from "./agent.js";
import * as parser from "./parser.js";
import * as files from "./files.js";
import * as tools from "./tools.js";

// ============================================================================
// BRAIN CLASS
// ============================================================================

export class Brain {
  constructor(options = {}) {
    this.agent = createAgent(options.apiKey);
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    
    // State
    this.genre = null;
    this.conceptSlug = null;
    this.bookSlug = null;
    this.bookPath = null;
    this.concept = null;
    this.brief = null;
    this.plan = null;
    this.title = null;
    this.voice = null;
    
    // Progress tracking
    this.currentPhase = null;
    this.currentTask = null;
    this.log = [];
  }

  /**
   * Log a message
   */
  logMessage(level, message) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      phase: this.currentPhase,
      task: this.currentTask,
      message,
    };
    this.log.push(entry);
    if (this.verbose) {
      console.log(`[${level}] ${message}`);
    }
  }

  /**
   * Initialize the brain for a specific book
   */
  async initialize(genre, conceptSlug, mode = "generate") {
    this.logMessage("info", `Initializing for ${conceptSlug} in ${genre}`);
    
    // Validate genre
    if (!genres[genre]) {
      throw new Error(`Unknown genre: ${genre}. Valid genres: ${Object.keys(genres).join(", ")}`);
    }
    
    this.genre = genre;
    this.conceptSlug = conceptSlug;
    this.bookSlug = deriveBookSlug(conceptSlug);
    this.bookPath = getBookPath(genre, this.bookSlug);
    this.voice = getVoice(genre);
    this.mode = mode;
    
    // Read concept file
    const conceptPath = getConceptPath(genre, conceptSlug);
    try {
      this.concept = await files.readFile(conceptPath);
    } catch (error) {
      throw new Error(`Concept file not found: ${conceptPath}`);
    }
    
    // Create book folder structure
    if (!this.dryRun) {
      await files.createBookStructure(this.bookPath);
    }
    
    this.logMessage("info", `Book path: ${this.bookPath}`);
    this.logMessage("info", `TTS Voice: ${this.voice}`);
    
    return {
      genre: this.genre,
      conceptSlug: this.conceptSlug,
      bookSlug: this.bookSlug,
      bookPath: this.bookPath,
      voice: this.voice,
    };
  }

  // ==========================================================================
  // PHASE 1: PLANNING
  // ==========================================================================

  /**
   * Generate the book brief
   */
  async generateBrief() {
    this.currentPhase = "planning";
    this.currentTask = "brief";
    this.logMessage("info", "Generating book brief...");

    const prompt = await files.readPrompt(paths.prompts, "planning", "brief");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{CONCEPT}}", this.concept)
        .replace("{{GENRE}}", this.genre)
        .replace("{{GENRE_INFO}}", JSON.stringify(genres[this.genre], null, 2)),
      system: systemPrompt,
      model: models.thinking,
      maxTokens: models.tokens.brief,
    });

    if (!result.success) {
      throw new Error(`Brief generation failed: ${result.error}`);
    }

    // Extract the brief content
    const briefContent = parser.extractSection(result.content, "BRIEF") || result.content;
    this.brief = briefContent;
    this.title = parser.extractTitle(briefContent);

    // Write to file
    if (!this.dryRun) {
      await files.writeFile(
        path.join(this.bookPath, "01-planning", "book-brief.md"),
        briefContent
      );
    }

    this.logMessage("info", `Brief generated. Title: ${this.title}`);
    return { title: this.title, wordCount: parser.countWords(briefContent) };
  }

  /**
   * Generate the book plan
   */
  async generatePlan() {
    this.currentTask = "plan";
    this.logMessage("info", "Generating book plan...");

    if (!this.brief) {
      this.brief = await files.readBrief(this.bookPath);
    }

    const prompt = await files.readPrompt(paths.prompts, "planning", "plan");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{BRIEF}}", this.brief)
        .replace("{{CHAPTER_STRUCTURE}}", JSON.stringify(chapterStructure, null, 2)),
      system: systemPrompt,
      model: models.thinking,
      maxTokens: models.tokens.plan,
    });

    if (!result.success) {
      throw new Error(`Plan generation failed: ${result.error}`);
    }

    const planContent = parser.extractSection(result.content, "PLAN") || result.content;
    this.plan = planContent;

    if (!this.dryRun) {
      await files.writeFile(
        path.join(this.bookPath, "01-planning", "book-plan.md"),
        planContent
      );
    }

    this.logMessage("info", "Plan generated.");
    return { wordCount: parser.countWords(planContent) };
  }

  /**
   * Generate README for the book folder
   */
  async generateReadme() {
    this.currentTask = "readme";
    
    const readme = `# ${this.title}

**Genre:** ${genres[this.genre].name}
**Author:** ${author.name}
**Publisher:** ${author.publisher}
**TTS Voice:** ${this.voice}

## Generation Status

- [x] Concept loaded
- [x] Book brief generated
- [x] Book plan generated
- [ ] Manuscript generated
- [ ] Cover prompts generated
- [ ] Metadata generated
- [ ] Output files generated

## Folder Structure

- \`01-planning/\` — Brief and plan
- \`02-manuscript/\` — All chapter and section files
- \`03-covers/\` — Cover prompts and images
- \`04-metadata/\` — All metadata files
- \`05-output/\` — Final deliverables (EPUB, PDF, MP3, M4B)

Generated by agentic-development-v3
`;

    if (!this.dryRun) {
      await files.writeFile(path.join(this.bookPath, "README.md"), readme);
    }

    return { success: true };
  }

  // ==========================================================================
  // PHASE 2: MANUSCRIPT
  // ==========================================================================

  /**
   * Generate all manuscript files
   */
  async generateManuscript() {
    this.currentPhase = "manuscript";
    this.logMessage("info", "Generating manuscript...");

    if (!this.plan) {
      this.plan = await files.readPlan(this.bookPath);
    }

    // Generate frontmatter
    await this.generateFrontmatter();
    
    // Generate chapters
    await this.generateChapters();
    
    // Generate backmatter
    await this.generateBackmatter();

    this.logMessage("info", "Manuscript complete.");
    return { success: true };
  }

  /**
   * Generate frontmatter (opening credits, copyright, dedication, prologue)
   */
  async generateFrontmatter() {
    this.currentTask = "frontmatter";
    this.logMessage("info", "Generating frontmatter...");

    const prompt = await files.readPrompt(paths.prompts, "manuscript", "frontmatter");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{AUTHOR}}", author.name)
        .replace("{{PUBLISHER}}", author.publisher)
        .replace("{{YEAR}}", author.copyright)
        .replace("{{PLAN}}", this.plan),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.frontmatter,
    });

    if (!result.success) {
      throw new Error(`Frontmatter generation failed: ${result.error}`);
    }

    const fileContents = parser.parseManuscriptFiles(result.content);
    
    if (!this.dryRun) {
      await files.writeManuscriptFiles(this.bookPath, fileContents);
    }

    this.logMessage("info", `Frontmatter: ${Object.keys(fileContents).length} files`);
    return fileContents;
  }

  /**
   * Generate all 10 chapters
   */
  async generateChapters() {
    this.currentTask = "chapters";
    this.logMessage("info", "Generating chapters...");

    const prompt = await files.readPrompt(paths.prompts, "manuscript", "chapter");
    const systemPrompt = this.buildSystemPrompt();

    for (let i = 1; i <= 10; i++) {
      const chapter = chapterStructure[i - 1];
      const fileId = String(i + 3).padStart(2, "0"); // 04-ch01 through 13-ch10
      
      this.logMessage("info", `Chapter ${i}: ${chapter.role}`);

      const result = await this.agent.executeWithRetry({
        prompt: prompt
          .replace("{{CHAPTER_NUMBER}}", String(i))
          .replace("{{CHAPTER_ROLE}}", chapter.role)
          .replace("{{CHAPTER_DESCRIPTION}}", chapter.description)
          .replace("{{WORD_TARGET_MIN}}", String(chapter.wordTarget[0]))
          .replace("{{WORD_TARGET_MAX}}", String(chapter.wordTarget[1]))
          .replace("{{PLAN}}", this.plan)
          .replace("{{TITLE}}", this.title),
        system: systemPrompt,
        model: models.primary,
        maxTokens: models.tokens.chapter,
      });

      if (!result.success) {
        throw new Error(`Chapter ${i} generation failed: ${result.error}`);
      }

      const chapterContent = parser.extractSection(result.content, "CHAPTER") || result.content;
      const chapterTitle = parser.extractChapterTitle(chapterContent);
      const filename = `${fileId}-ch${String(i).padStart(2, "0")}-${sanitizeFilename(chapterTitle).toLowerCase().replace(/\s+/g, "-")}.md`;

      if (!this.dryRun) {
        await files.writeFile(
          path.join(this.bookPath, "02-manuscript", filename),
          chapterContent
        );
      }

      const wordCount = parser.countWords(chapterContent);
      this.logMessage("info", `  → ${filename} (${wordCount} words)`);
    }

    return { success: true, chapters: 10 };
  }

  /**
   * Generate backmatter (epilogue, acknowledgments, etc.)
   */
  async generateBackmatter() {
    this.currentTask = "backmatter";
    this.logMessage("info", "Generating backmatter...");

    const prompt = await files.readPrompt(paths.prompts, "manuscript", "backmatter");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{AUTHOR}}", author.name)
        .replace("{{PUBLISHER}}", author.publisher)
        .replace("{{PLAN}}", this.plan),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.backmatter,
    });

    if (!result.success) {
      throw new Error(`Backmatter generation failed: ${result.error}`);
    }

    const fileContents = parser.parseManuscriptFiles(result.content);
    
    if (!this.dryRun) {
      await files.writeManuscriptFiles(this.bookPath, fileContents);
    }

    this.logMessage("info", `Backmatter: ${Object.keys(fileContents).length} files`);
    return fileContents;
  }

  // ==========================================================================
  // PHASE 3: COVER PROMPTS
  // ==========================================================================

  /**
   * Generate all cover prompts
   */
  async generateCoverPrompts() {
    this.currentPhase = "covers";
    this.logMessage("info", "Generating cover prompts...");

    // Generate ebook cover prompts
    await this.generateEbookPrompts();
    
    // Generate audiobook cover prompts
    await this.generateAudiobookPrompts();

    this.logMessage("info", "Cover prompts complete.");
    return { success: true };
  }

  async generateEbookPrompts() {
    this.currentTask = "ebook-prompts";
    this.logMessage("info", "Generating ebook cover prompts...");

    const prompt = await files.readPrompt(paths.prompts, "covers", "ebook");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{GENRE}}", genres[this.genre].name)
        .replace("{{BRIEF}}", this.brief),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.coverPrompt,
    });

    if (!result.success) {
      throw new Error(`Ebook prompt generation failed: ${result.error}`);
    }

    const covers = parser.parseCoverFiles(result.content);
    
    if (!this.dryRun) {
      await files.writeCoverFiles(this.bookPath, { ebook: covers.ebook });
    }

    this.logMessage("info", `Ebook prompts: ${Object.keys(covers.ebook || {}).length} files`);
    return covers.ebook;
  }

  async generateAudiobookPrompts() {
    this.currentTask = "audiobook-prompts";
    this.logMessage("info", "Generating audiobook cover prompts...");

    const prompt = await files.readPrompt(paths.prompts, "covers", "audiobook");
    const systemPrompt = this.buildSystemPrompt();

    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{GENRE}}", genres[this.genre].name)
        .replace("{{BRIEF}}", this.brief),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.coverPrompt,
    });

    if (!result.success) {
      throw new Error(`Audiobook prompt generation failed: ${result.error}`);
    }

    const covers = parser.parseCoverFiles(result.content);
    
    if (!this.dryRun) {
      await files.writeCoverFiles(this.bookPath, { audiobook: covers.audiobook });
    }

    this.logMessage("info", `Audiobook prompts: ${Object.keys(covers.audiobook || {}).length} files`);
    return covers.audiobook;
  }

  // ==========================================================================
  // PHASE 4: METADATA
  // ==========================================================================

  /**
   * Generate all metadata files
   */
  async generateMetadata() {
    this.currentPhase = "metadata";
    this.logMessage("info", "Generating metadata...");

    await this.generateSummaries();
    await this.generateDescriptions();
    await this.generateKeywords();
    await this.generateCategories();
    await this.generateUploadChecklists();
    await this.generateChapterSummaries();

    this.logMessage("info", "Metadata complete.");
    return { success: true };
  }

  async generateSummaries() {
    this.currentTask = "summaries";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "summaries");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{BRIEF}}", this.brief)
        .replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });

    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      if (!this.dryRun) {
        await files.writeMetadataFiles(this.bookPath, metadata);
      }
      this.logMessage("info", `Summaries: ${Object.keys(metadata).length} files`);
    }
  }

  async generateDescriptions() {
    this.currentTask = "descriptions";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "descriptions");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{BRIEF}}", this.brief)
        .replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });

    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      if (!this.dryRun) {
        await files.writeMetadataFiles(this.bookPath, metadata);
      }
      this.logMessage("info", `Descriptions: ${Object.keys(metadata).length} files`);
    }
  }

  async generateKeywords() {
    this.currentTask = "keywords";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "keywords");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{BRIEF}}", this.brief)
        .replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });

    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      if (!this.dryRun) {
        await files.writeMetadataFiles(this.bookPath, metadata);
      }
      this.logMessage("info", `Keywords: ${Object.keys(metadata).length} files`);
    }
  }

  async generateCategories() {
    this.currentTask = "categories";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "categories");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{BRIEF}}", this.brief)
        .replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });

    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      if (!this.dryRun) {
        await files.writeMetadataFiles(this.bookPath, metadata);
      }
      this.logMessage("info", `Categories: ${Object.keys(metadata).length} files`);
    }
  }

  async generateUploadChecklists() {
    this.currentTask = "uploads";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "uploads");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{AUTHOR}}", author.name)
        .replace("{{PUBLISHER}}", author.publisher)
        .replace("{{BRIEF}}", this.brief)
        .replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });

    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      if (!this.dryRun) {
        await files.writeMetadataFiles(this.bookPath, metadata);
      }
      this.logMessage("info", `Upload checklists: ${Object.keys(metadata).length} files`);
    }
  }

  async generateChapterSummaries() {
    this.currentTask = "chapter-summaries";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "chapter-summaries");
    
    const result = await this.agent.executeWithRetry({
      prompt: prompt
        .replace("{{TITLE}}", this.title)
        .replace("{{PLAN}}", this.plan),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.summary * 10,
    });

    if (result.success) {
      const summaries = parser.parseChapterSummaries(result.content);
      if (!this.dryRun) {
        await files.writeChapterSummaries(this.bookPath, summaries);
      }
      this.logMessage("info", `Chapter summaries: ${Object.keys(summaries).length} files`);
    }
  }

  // ==========================================================================
  // PHASE 5: OUTPUT GENERATION
  // ==========================================================================

  /**
   * Run all output generation tools
   */
  async generateOutputs() {
    this.currentPhase = "output";
    this.logMessage("info", "Generating output files...");

    if (this.dryRun) {
      this.logMessage("info", "Dry run — skipping tool execution");
      return { dryRun: true };
    }

    const results = await tools.runAllOutputTools(
      this.bookPath,
      this.title,
      this.genre,
      (msg) => this.logMessage("info", msg)
    );

    this.logMessage("info", "Output generation complete.");
    return results;
  }

  // ==========================================================================
  // FULL PIPELINE
  // ==========================================================================

  /**
   * Run the complete book generation pipeline
   */
  async generateBook(genre, conceptSlug, options = {}) {
    const startTime = Date.now();

    try {
      // Initialize
      await this.initialize(genre, conceptSlug, options.mode);

      // Phase 1: Planning
      await this.generateBrief();
      await this.generatePlan();
      await this.generateReadme();

      // Phase 2: Manuscript
      await this.generateManuscript();

      // Phase 3: Cover Prompts
      await this.generateCoverPrompts();

      // Phase 4: Metadata
      await this.generateMetadata();

      // Phase 5: Output (optional — can be run separately)
      if (options.runOutputTools !== false) {
        await this.generateOutputs();
      }

      // Update completion tracker
      if (!this.dryRun) {
        await files.updateCompletionTracker(paths.docs, {
          date: new Date().toISOString().split("T")[0],
          genre: this.genre,
          slug: this.bookSlug,
          title: this.title,
          status: "Complete",
        });

        await files.writeGenerationLog(this.bookPath, {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString(),
          duration: `${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes`,
          usage: this.agent.getUsage(),
          cost: this.agent.estimateCost(),
          log: this.log,
        });
      }

      return {
        success: true,
        title: this.title,
        bookPath: this.bookPath,
        duration: `${((Date.now() - startTime) / 1000 / 60).toFixed(1)} minutes`,
        usage: this.agent.getUsage(),
        cost: this.agent.estimateCost(),
      };
    } catch (error) {
      this.logMessage("error", error.message);
      return {
        success: false,
        error: error.message,
        phase: this.currentPhase,
        task: this.currentTask,
      };
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Build the system prompt with all context
   */
  buildSystemPrompt() {
    return `You are an expert commercial fiction generation system for Metronagon Media.

AUTHOR: ${author.name}
PUBLISHER: ${author.publisher}
GENRE: ${genres[this.genre]?.name || this.genre}

BRAND POSITIONING:
All books are cinematic action fiction. The brand filter: could this book be a summer blockbuster with a $150 million budget? Every concept, every protagonist, every plot must answer yes.

WRITING RULES:
- All prose must be suitable for Edge TTS audiobook narration
- Natural spoken cadence, varied sentence length
- Speakable dialogue — no robotic phrasing, no stacked fragments
- No cliffhangers — every book resolves completely
- Standalone stories — no series arcs

OUTPUT FORMAT:
Always wrap your output in the appropriate XML tags as specified in the prompt.
`;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createBrain(options = {}) {
  return new Brain(options);
}

export default { Brain, createBrain };

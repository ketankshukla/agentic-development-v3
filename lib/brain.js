/**
 * lib/brain.js
 * Main orchestrator for the book generation pipeline
 */

import path from "path";
import {
  paths,
  models,
  author,
  genres,
  chapterStructure,
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

export class Brain {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.agent = createAgent(options.apiKey, { dryRun: this.dryRun });

    this.genre = null;
    this.conceptSlug = null;
    this.bookSlug = null;
    this.bookPath = null;
    this.concept = null;
    this.brief = null;
    this.plan = null;
    this.title = null;
    this.voice = null;
    this.mode = "generate";

    this.currentPhase = null;
    this.currentTask = null;
    this.log = [];

    this.mockAssets = {
      brief: null,
      plan: null,
      manuscript: {},
      covers: { ebook: {}, audiobook: {} },
      metadata: {},
      chapterSummaries: {},
      outputs: {},
    };
  }

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

  async initialize(genre, conceptSlug, mode = "generate") {
    this.logMessage("info", `Initializing for ${conceptSlug} in ${genre}`);

    if (!genres[genre]) {
      throw new Error(`Unknown genre: ${genre}. Valid genres: ${Object.keys(genres).join(", ")}`);
    }

    this.genre = genre;
    this.conceptSlug = conceptSlug;
    this.bookSlug = deriveBookSlug(conceptSlug);
    this.bookPath = getBookPath(genre, this.bookSlug);
    this.voice = getVoice(genre);
    this.mode = mode;

    const conceptPath = getConceptPath(genre, conceptSlug);
    try {
      this.concept = await files.readFile(conceptPath);
    } catch (error) {
      throw new Error(`Concept file not found: ${conceptPath}`);
    }

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

  async generateBrief() {
    this.currentPhase = "planning";
    this.currentTask = "brief";
    this.logMessage("info", "Generating book brief...");

    if (this.dryRun) {
      const briefContent = this.buildMockBrief();
      this.brief = briefContent;
      this.title = parser.extractTitle(briefContent);
      this.mockAssets.brief = briefContent;
      this.logMessage("info", `Dry run brief generated. Title: ${this.title}`);
      return { title: this.title, wordCount: parser.countWords(briefContent) };
    }

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

    if (!result.success) throw new Error(`Brief generation failed: ${result.error}`);

    const briefContent = parser.extractSection(result.content, "BRIEF") || result.content;
    this.brief = briefContent;
    this.title = parser.extractTitle(briefContent);

    await files.writeFile(path.join(this.bookPath, "01-planning", "book-brief.md"), briefContent);

    this.logMessage("info", `Brief generated. Title: ${this.title}`);
    return { title: this.title, wordCount: parser.countWords(briefContent) };
  }

  async generatePlan() {
    this.currentTask = "plan";
    this.logMessage("info", "Generating book plan...");

    if (this.dryRun) {
      if (!this.brief) this.brief = this.buildMockBrief();
      const planContent = this.buildMockPlan();
      this.plan = planContent;
      this.mockAssets.plan = planContent;
      this.logMessage("info", "Dry run plan generated.");
      return { wordCount: parser.countWords(planContent) };
    }

    if (!this.brief) this.brief = await files.readBrief(this.bookPath);

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

    if (!result.success) throw new Error(`Plan generation failed: ${result.error}`);

    const planContent = parser.extractSection(result.content, "PLAN") || result.content;
    this.plan = planContent;
    await files.writeFile(path.join(this.bookPath, "01-planning", "book-plan.md"), planContent);

    this.logMessage("info", "Plan generated.");
    return { wordCount: parser.countWords(planContent) };
  }

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

  async generateManuscript() {
    this.currentPhase = "manuscript";
    this.logMessage("info", "Generating manuscript...");

    if (!this.plan) {
      this.plan = this.dryRun ? this.buildMockPlan() : await files.readPlan(this.bookPath);
    }

    await this.generateFrontmatter();
    await this.generateChapters();
    await this.generateBackmatter();

    this.logMessage("info", "Manuscript complete.");
    return { success: true };
  }

  async generateFrontmatter() {
    this.currentTask = "frontmatter";
    this.logMessage("info", "Generating frontmatter...");

    if (this.dryRun) {
      const fileContents = this.buildMockFrontmatterFiles();
      Object.assign(this.mockAssets.manuscript, fileContents);
      this.logMessage("info", `Frontmatter: ${Object.keys(fileContents).length} files`);
      return fileContents;
    }

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

    if (!result.success) throw new Error(`Frontmatter generation failed: ${result.error}`);
    const fileContents = parser.parseManuscriptFiles(result.content);
    await files.writeManuscriptFiles(this.bookPath, fileContents);
    this.logMessage("info", `Frontmatter: ${Object.keys(fileContents).length} files`);
    return fileContents;
  }

  async generateChapters() {
    this.currentTask = "chapters";
    this.logMessage("info", "Generating chapters...");

    if (this.dryRun) {
      for (let i = 1; i <= 10; i++) {
        const chapter = chapterStructure[i - 1];
        const fileId = String(i + 3).padStart(2, "0");
        const chapterTitle = this.mockChapterTitle(i, chapter.role);
        const chapterContent = this.buildMockChapterContent(i, chapterTitle, chapter.role, chapter.description);
        const filename = `${fileId}-ch${String(i).padStart(2, "0")}-${sanitizeFilename(chapterTitle).toLowerCase().replace(/\s+/g, "-")}.md`;
        this.mockAssets.manuscript[filename] = chapterContent;
        this.logMessage("info", `  → ${filename} (${parser.countWords(chapterContent)} words)`);
      }
      return { success: true, chapters: 10 };
    }

    const prompt = await files.readPrompt(paths.prompts, "manuscript", "chapter");
    const systemPrompt = this.buildSystemPrompt();

    for (let i = 1; i <= 10; i++) {
      const chapter = chapterStructure[i - 1];
      const fileId = String(i + 3).padStart(2, "0");
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

      if (!result.success) throw new Error(`Chapter ${i} generation failed: ${result.error}`);

      const chapterContent = parser.extractSection(result.content, "CHAPTER") || result.content;
      const chapterTitle = parser.extractChapterTitle(chapterContent);
      const filename = `${fileId}-ch${String(i).padStart(2, "0")}-${sanitizeFilename(chapterTitle).toLowerCase().replace(/\s+/g, "-")}.md`;
      await files.writeFile(path.join(this.bookPath, "02-manuscript", filename), chapterContent);
      this.logMessage("info", `  → ${filename} (${parser.countWords(chapterContent)} words)`);
    }

    return { success: true, chapters: 10 };
  }

  async generateBackmatter() {
    this.currentTask = "backmatter";
    this.logMessage("info", "Generating backmatter...");

    if (this.dryRun) {
      const fileContents = this.buildMockBackmatterFiles();
      Object.assign(this.mockAssets.manuscript, fileContents);
      this.logMessage("info", `Backmatter: ${Object.keys(fileContents).length} files`);
      return fileContents;
    }

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

    if (!result.success) throw new Error(`Backmatter generation failed: ${result.error}`);
    const fileContents = parser.parseManuscriptFiles(result.content);
    await files.writeManuscriptFiles(this.bookPath, fileContents);
    this.logMessage("info", `Backmatter: ${Object.keys(fileContents).length} files`);
    return fileContents;
  }

  async generateCoverPrompts() {
    this.currentPhase = "covers";
    this.logMessage("info", "Generating cover prompts...");
    await this.generateEbookPrompts();
    await this.generateAudiobookPrompts();
    this.logMessage("info", "Cover prompts complete.");
    return { success: true };
  }

  async generateEbookPrompts() {
    this.currentTask = "ebook-prompts";
    this.logMessage("info", "Generating ebook cover prompts...");

    if (this.dryRun) {
      const covers = this.buildMockEbookCovers();
      this.mockAssets.covers.ebook = covers;
      this.logMessage("info", `Ebook prompts: ${Object.keys(covers).length} files`);
      return covers;
    }

    const prompt = await files.readPrompt(paths.prompts, "covers", "ebook");
    const systemPrompt = this.buildSystemPrompt();
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{GENRE}}", genres[this.genre].name).replace("{{BRIEF}}", this.brief),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.coverPrompt,
    });
    if (!result.success) throw new Error(`Ebook prompt generation failed: ${result.error}`);
    const covers = parser.parseCoverFiles(result.content);
    await files.writeCoverFiles(this.bookPath, { ebook: covers.ebook });
    this.logMessage("info", `Ebook prompts: ${Object.keys(covers.ebook || {}).length} files`);
    return covers.ebook;
  }

  async generateAudiobookPrompts() {
    this.currentTask = "audiobook-prompts";
    this.logMessage("info", "Generating audiobook cover prompts...");

    if (this.dryRun) {
      const covers = this.buildMockAudiobookCovers();
      this.mockAssets.covers.audiobook = covers;
      this.logMessage("info", `Audiobook prompts: ${Object.keys(covers).length} files`);
      return covers;
    }

    const prompt = await files.readPrompt(paths.prompts, "covers", "audiobook");
    const systemPrompt = this.buildSystemPrompt();
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{GENRE}}", genres[this.genre].name).replace("{{BRIEF}}", this.brief),
      system: systemPrompt,
      model: models.primary,
      maxTokens: models.tokens.coverPrompt,
    });
    if (!result.success) throw new Error(`Audiobook prompt generation failed: ${result.error}`);
    const covers = parser.parseCoverFiles(result.content);
    await files.writeCoverFiles(this.bookPath, { audiobook: covers.audiobook });
    this.logMessage("info", `Audiobook prompts: ${Object.keys(covers.audiobook || {}).length} files`);
    return covers.audiobook;
  }

  async generateMetadata() {
    this.currentPhase = "metadata";
    this.logMessage("info", "Generating metadata...");

    if (this.dryRun) {
      this.mockAssets.metadata = this.buildMockMetadataFiles();
      this.mockAssets.chapterSummaries = this.buildMockChapterSummaries();
      this.logMessage("info", `Metadata files: ${Object.keys(this.mockAssets.metadata).length} files`);
      this.logMessage("info", `Chapter summaries: ${Object.keys(this.mockAssets.chapterSummaries).length} files`);
      this.logMessage("info", "Metadata complete.");
      return { success: true };
    }

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
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{BRIEF}}", this.brief).replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });
    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      await files.writeMetadataFiles(this.bookPath, metadata);
      this.logMessage("info", `Summaries: ${Object.keys(metadata).length} files`);
    }
  }

  async generateDescriptions() {
    this.currentTask = "descriptions";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "descriptions");
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{BRIEF}}", this.brief).replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });
    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      await files.writeMetadataFiles(this.bookPath, metadata);
      this.logMessage("info", `Descriptions: ${Object.keys(metadata).length} files`);
    }
  }

  async generateKeywords() {
    this.currentTask = "keywords";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "keywords");
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{BRIEF}}", this.brief).replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });
    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      await files.writeMetadataFiles(this.bookPath, metadata);
      this.logMessage("info", `Keywords: ${Object.keys(metadata).length} files`);
    }
  }

  async generateCategories() {
    this.currentTask = "categories";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "categories");
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{BRIEF}}", this.brief).replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });
    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      await files.writeMetadataFiles(this.bookPath, metadata);
      this.logMessage("info", `Categories: ${Object.keys(metadata).length} files`);
    }
  }

  async generateUploadChecklists() {
    this.currentTask = "uploads";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "uploads");
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{AUTHOR}}", author.name).replace("{{PUBLISHER}}", author.publisher).replace("{{BRIEF}}", this.brief).replace("{{GENRE}}", genres[this.genre].name),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.metadata,
    });
    if (result.success) {
      const metadata = parser.parseMetadataFiles(result.content);
      await files.writeMetadataFiles(this.bookPath, metadata);
      this.logMessage("info", `Upload checklists: ${Object.keys(metadata).length} files`);
    }
  }

  async generateChapterSummaries() {
    this.currentTask = "chapter-summaries";
    const prompt = await files.readPrompt(paths.prompts, "metadata", "chapter-summaries");
    const result = await this.agent.executeWithRetry({
      prompt: prompt.replace("{{TITLE}}", this.title).replace("{{PLAN}}", this.plan),
      system: this.buildSystemPrompt(),
      model: models.fast,
      maxTokens: models.tokens.summary * 10,
    });
    if (result.success) {
      const summaries = parser.parseChapterSummaries(result.content);
      await files.writeChapterSummaries(this.bookPath, summaries);
      this.logMessage("info", `Chapter summaries: ${Object.keys(summaries).length} files`);
    }
  }

  async generateOutputs() {
    this.currentPhase = "output";
    this.logMessage("info", "Generating output files...");

    if (this.dryRun) {
      const baseTitle = sanitizeFilename(this.title || this.humanizeSlug(this.bookSlug));
      const outputs = {
        mp3: { status: "success", dryRun: true, files: Array.from({ length: 21 }, (_, i) => `${String(i + 1).padStart(2, "0")}-${baseTitle}.mp3`) },
        docx: { status: "success", dryRun: true, file: `${baseTitle}.docx` },
        epub: { status: "success", dryRun: true, file: `${baseTitle}.epub` },
        pdf: { status: "success", dryRun: true, file: `${baseTitle}.pdf` },
        pdfKdp: { status: "success", dryRun: true, file: `${baseTitle}-KDP.pdf` },
        m4b: { status: "success", dryRun: true, file: `${baseTitle}.m4b` },
      };
      this.mockAssets.outputs = outputs;
      this.logMessage("info", "Dry run — mocked all output assets");
      return outputs;
    }

    const results = await tools.runAllOutputTools(this.bookPath, this.title, this.genre, (msg) => this.logMessage("info", msg));
    this.logMessage("info", "Output generation complete.");
    return results;
  }

  async generateBook(genre, conceptSlug, options = {}) {
    const startTime = Date.now();
    try {
      await this.initialize(genre, conceptSlug, options.mode);
      await this.generateBrief();
      await this.generatePlan();
      await this.generateReadme();
      await this.generateManuscript();
      await this.generateCoverPrompts();
      await this.generateMetadata();
      if (options.runOutputTools !== false) await this.generateOutputs();

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
      return { success: false, error: error.message, phase: this.currentPhase, task: this.currentTask };
    }
  }

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

  humanizeSlug(slug) {
    return String(slug || "untitled-book")
      .replace(/^\d+-/, "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  conceptExcerpt() {
    return String(this.concept || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ")
      .slice(0, 400);
  }

  ensureTitle() {
    if (!this.title) this.title = this.humanizeSlug(this.bookSlug || this.conceptSlug);
    return this.title;
  }

  buildMockBrief() {
    const title = this.ensureTitle();
    const genreName = genres[this.genre]?.name || this.genre;
    const excerpt = this.conceptExcerpt();
    return `# ${title}

Title: ${title}
Genre: ${genreName}
Author: ${author.name}
Publisher: ${author.publisher}

## Hook
A high-concept ${genreName.toLowerCase()} novel built for a full-pipeline dry run. This mock brief mirrors the shape of a real brief so every downstream asset can be generated without touching the Anthropic API.

## Premise
${excerpt || `${title} follows a protagonist forced into a fast-moving conflict that escalates from personal danger to world-shaping stakes.`}

## Protagonist
A determined lead with cinematic presence, emotional wounds, and a clear external objective tied to the core conflict.

## Antagonistic Force
A powerful opposition network with superior reach, escalating leverage, and a visible plan that pressures every act of the story.

## Promise of the Book
Action, reversals, escalating set pieces, emotional payoffs, and a complete standalone ending.
`;
  }

  buildMockPlan() {
    const title = this.ensureTitle();
    const chapterLines = chapterStructure.map((chapter, idx) => {
      const n = idx + 1;
      return `## Chapter ${n}: ${this.mockChapterTitle(n, chapter.role)}\n- Role: ${chapter.role}\n- Function: ${chapter.description}\n- Target: ${chapter.wordTarget[0]}-${chapter.wordTarget[1]} words\n- Dry-run beat: Mocked escalation for pipeline validation.`;
    }).join("\n\n");

    return `# ${title} — Book Plan

## Story Engine
- Opening disturbance
- Escalating confrontation
- Midpoint reversal
- Siege-level climax
- Clean standalone resolution

## Core Promise
This plan exists to generate every downstream asset in dry-run mode with plausible structure and stable filenames.

${chapterLines}
`;
  }

  mockChapterTitle(i, role) {
    const roleText = String(role || `chapter ${i}`).replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const cleaned = roleText || `Chapter ${i}`;
    return `${cleaned}`.replace(/\s+/g, " ").replace(/^./, (m) => m.toUpperCase());
  }

  buildMockFrontmatterFiles() {
    const title = this.ensureTitle();
    return {
      "00-opening-credits.md": `# ${title}\n\nBy ${author.name}\n\nPublished by ${author.publisher}.\n`,
      "01-copyright.md": `# Copyright\n\nCopyright ${author.copyright} ${author.name}. All rights reserved.\n`,
      "02-dedication.md": `# Dedication\n\nFor readers who love cinematic fiction and reliable automation.\n`,
      "03-prologue.md": `# Prologue\n\nThe world tilts before the hero understands why. This dry-run prologue stands in for the real opening set piece and proves the manuscript pipeline can carry structured content from frontmatter into the book body.\n`,
    };
  }

  buildMockChapterContent(i, chapterTitle, role, description) {
    const title = this.ensureTitle();
    const repeated = Array.from({ length: 18 }, (_, idx) => `Paragraph ${idx + 1}: In ${title}, chapter ${i} pushes the story through ${String(role).toLowerCase()}. ${description} The hero makes a choice, the pressure rises, and the scene ends with momentum rather than a cliffhanger.`).join("\n\n");
    return `# Chapter ${i}: ${chapterTitle}\n\n${repeated}\n`;
  }

  buildMockBackmatterFiles() {
    const title = this.ensureTitle();
    return {
      "14-epilogue.md": `# Epilogue\n\n${title} closes with a hard-won calm, visible consequences, and a complete emotional release.\n`,
      "15-acknowledgments.md": `# Acknowledgments\n\nThanks to every tool, workflow, and reader that helps a story ship.\n`,
      "16-about-the-author.md": `# About the Author\n\n${author.name} writes cinematic commercial fiction for Metronagon Media.\n`,
      "17-about-the-publisher.md": `# About the Publisher\n\n${author.publisher} develops design-forward, blockbuster-minded fiction properties.\n`,
      "18-teaser.md": `# More from ${author.publisher}\n\nExpect more standalone stories with high stakes and strong visual identity.\n`,
      "19-reader-note.md": `# Reader Note\n\nThis asset was created as part of a zero-cost dry run for pipeline validation.\n`,
      "20-call-to-action.md": `# Stay Connected\n\nVisit the publisher portfolio and catalog for future releases.\n`,
    };
  }

  buildMockEbookCovers() {
    const title = this.ensureTitle();
    const variants = ["hero-portrait", "battle-scene", "throne-room", "final-confrontation", "victory-dawn"];
    return Object.fromEntries(variants.map((name, idx) => [
      `${String(idx + 1).padStart(2, "0")}-${name}.md`,
      `# ${title} — Ebook Cover Variant ${idx + 1}\n\nFormat: 1600x2400 portrait ebook cover\nStyle: photorealistic cinematic blockbuster poster\nFocus: ${name.replace(/-/g, " ")}\nGenre: ${genres[this.genre]?.name || this.genre}\n`,
    ]));
  }

  buildMockAudiobookCovers() {
    const title = this.ensureTitle();
    const variants = ["hero-closeup", "symbolic-emblem", "siege-tableau", "fire-and-steel", "new-dawn"];
    return Object.fromEntries(variants.map((name, idx) => [
      `${String(idx + 1).padStart(2, "0")}-${name}.md`,
      `# ${title} — Audiobook Cover Variant ${idx + 1}\n\nFormat: 2400x2400 square audiobook cover\nStyle: photorealistic cinematic blockbuster poster\nFocus: ${name.replace(/-/g, " ")}\nGenre: ${genres[this.genre]?.name || this.genre}\n`,
    ]));
  }

  buildMockMetadataFiles() {
    const title = this.ensureTitle();
    const metadata = {};
    const add = (name, content) => { metadata[name] = content; };

    add("summary-one-line.md", `${title} is a high-stakes standalone novel with cinematic momentum and decisive resolution.`);
    add("summary-short.md", `A concise dry-run summary for ${title}, suitable for internal testing and downstream metadata validation.`);
    add("summary-medium.md", `This mock medium summary positions ${title} as a commercial, action-driven story with a strong protagonist and escalating conflict.`);
    add("summary-long.md", `This long-form dry-run summary gives marketplace-friendly language for ${title}, highlighting spectacle, emotional stakes, and a satisfying ending.`);

    add("description-amazon-short.md", `An explosive standalone adventure about pressure, sacrifice, and survival.`);
    add("description-amazon-long.md", `${title} delivers scale, danger, and resolution in a market-ready package.`);
    add("description-kobo.md", `Kobo description copy for ${title}.`);
    add("description-apple.md", `Apple Books description copy for ${title}.`);
    add("description-google.md", `Google Play Books description copy for ${title}.`);
    add("description-audio.md", `Audiobook description copy for ${title}.`);

    add("keywords-amazon.md", `${title.toLowerCase()}, blockbuster fantasy, cinematic action, standalone fantasy, epic conflict, heroic lead, siege novel`);
    add("keywords-kobo.md", `cinematic fiction, standalone action fantasy, high stakes, immersive worldbuilding, fast-paced novel`);
    add("keywords-apple.md", `adventure, fantasy, action, standalone, dramatic, commercial fiction`);
    add("keywords-google.md", `fantasy action, siege story, hero journey, commercial novel, audiobook-friendly prose`);
    add("keywords-audio.md", `audiobook, narrated fiction, cinematic pacing, dramatic fantasy, immersive action`);
    add("keywords-ads.md", `book marketing, metadata test, dry-run keywords, mock launch assets`);

    add("categories-amazon.md", `Fiction / Fantasy / Epic\nFiction / Action & Adventure / General\nFiction / Fantasy / Action & Adventure`);
    add("categories-bisac.md", `FIC009020\nFIC002000\nFIC009090`);
    add("categories-kdp.md", `Epic Fantasy\nSword & Sorcery\nAction Adventure`);
    add("categories-audio.md", `Fantasy\nAction\nAdventure`);

    add("upload-checklist-kindle.md", `- Manuscript ready\n- Cover ready\n- Metadata ready\n- Categories ready\n- Pricing pending`);
    add("upload-checklist-paperback.md", `- Interior PDF ready\n- KDP PDF ready\n- Full wrap cover pending\n- Metadata approved`);
    add("upload-checklist-audiobook.md", `- MP3 set ready\n- Square cover ready\n- Description ready\n- Narration QA pending`);

    add("title-and-subtitle.md", `Title: ${title}\nSubtitle: A Standalone ${genres[this.genre]?.name || this.genre} Novel`);
    add("series-positioning.md", `Standalone title with blockbuster positioning and no unresolved series dependency.`);
    add("author-bio-short.md", `${author.name} writes cinematic fiction for readers who want momentum, atmosphere, and payoff.`);
    add("author-bio-long.md", `${author.name} develops commercial fiction projects under ${author.publisher}, focusing on design-forward branding and story-first execution.`);
    add("retailer-notes.md", `Use the strongest action-forward positioning across retailer descriptions.`);
    add("launch-copy.md", `A ready-to-market dry-run launch blurb for ${title}.`);
    add("ad-copy.md", `Bold, dramatic ad copy emphasizing spectacle, danger, and resolution.`);
    add("social-copy.md", `Social media launch copy for ${title} with hooks for cover reveal, release day, and audiobook promotion.`);

    return metadata;
  }

  buildMockChapterSummaries() {
    const summaries = {};
    for (let i = 1; i <= 10; i++) {
      summaries[`ch${String(i).padStart(2, "0")}`] = `Chapter ${i} summary: the protagonist faces escalating pressure, gains a costly insight, and drives the story toward the next turning point.`;
    }
    return summaries;
  }
}

export function createBrain(options = {}) {
  return new Brain(options);
}

export default { Brain, createBrain };

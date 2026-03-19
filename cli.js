#!/usr/bin/env node

/**
 * cli.js
 * Main CLI entry point for agentic-development-v3
 * 
 * Usage:
 *   node cli.js generate --genre epic-fantasy --concept 001-the-ashen-throne
 *   node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --dry-run
 *   node cli.js list-genres
 *   node cli.js list-concepts --genre epic-fantasy
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";
import { createBrain } from "./lib/brain.js";
import { genres, paths } from "./config.js";
import * as files from "./lib/files.js";

// Load environment variables
dotenv.config();

const program = new Command();

// ============================================================================
// CLI CONFIGURATION
// ============================================================================

program
  .name("generate-book")
  .description("OpenClaw-based agentic book generation for Metronagon Media")
  .version("1.0.0");

// ============================================================================
// GENERATE COMMAND
// ============================================================================

program
  .command("generate")
  .description("Generate a complete book from a concept file")
  .requiredOption("-g, --genre <genre>", "Genre slug (e.g., epic-fantasy)")
  .requiredOption("-c, --concept <slug>", "Concept slug (e.g., 001-the-ashen-throne)")
  .option("-m, --mode <mode>", "Generation mode: generate or regenerate", "generate")
  .option("--dry-run", "Run without writing files or calling API")
  .option("--verbose", "Show detailed progress")
  .option("--skip-outputs", "Skip output file generation (MP3, EPUB, PDF, etc.)")
  .option("--phase <phase>", "Run only a specific phase (planning, manuscript, covers, metadata, output)")
  .action(async (options) => {
    console.log(chalk.bold.cyan("\n📚 Agentic Book Generator v3\n"));
    
    // Validate API key
    if (!options.dryRun && !process.env.ANTHROPIC_API_KEY) {
      console.error(chalk.red("Error: ANTHROPIC_API_KEY not found in environment"));
      console.log(chalk.gray("Set it in .env file or export ANTHROPIC_API_KEY=sk-..."));
      process.exit(1);
    }

    // Validate genre
    if (!genres[options.genre]) {
      console.error(chalk.red(`Error: Unknown genre "${options.genre}"`));
      console.log(chalk.gray("Valid genres: " + Object.keys(genres).join(", ")));
      process.exit(1);
    }

    const spinner = ora();

    try {
      // Create brain
      const brain = createBrain({
        apiKey: process.env.ANTHROPIC_API_KEY,
        verbose: options.verbose,
        dryRun: options.dryRun,
      });

      // If running a specific phase, handle that
      if (options.phase) {
        await runSinglePhase(brain, options, spinner);
        return;
      }

      // Full generation
      spinner.start(chalk.cyan("Initializing..."));
      
      const init = await brain.initialize(options.genre, options.concept, options.mode);
      spinner.succeed(chalk.green(`Initialized: ${init.bookSlug}`));
      
      console.log(chalk.gray(`  Book path: ${init.bookPath}`));
      console.log(chalk.gray(`  TTS voice: ${init.voice}`));
      console.log();

      // Phase 1: Planning
      spinner.start(chalk.cyan("Phase 1: Generating brief..."));
      const brief = await brain.generateBrief();
      spinner.succeed(chalk.green(`Brief: "${brief.title}" (${brief.wordCount} words)`));

      spinner.start(chalk.cyan("Phase 1: Generating plan..."));
      await brain.generatePlan();
      spinner.succeed(chalk.green("Plan generated"));

      await brain.generateReadme();
      console.log();

      // Phase 2: Manuscript
      spinner.start(chalk.cyan("Phase 2: Generating manuscript..."));
      await brain.generateManuscript();
      spinner.succeed(chalk.green("Manuscript complete (21 files)"));
      console.log();

      // Phase 3: Cover Prompts
      spinner.start(chalk.cyan("Phase 3: Generating cover prompts..."));
      await brain.generateCoverPrompts();
      spinner.succeed(chalk.green("Cover prompts complete (10 files)"));
      console.log();

      // Phase 4: Metadata
      spinner.start(chalk.cyan("Phase 4: Generating metadata..."));
      await brain.generateMetadata();
      spinner.succeed(chalk.green("Metadata complete (31 files)"));
      console.log();

      // Phase 5: Output Generation
      if (!options.skipOutputs) {
        spinner.start(chalk.cyan("Phase 5: Generating output files..."));
        const outputs = await brain.generateOutputs();
        spinner.succeed(chalk.green("Output files generated"));
        
        // Show output status
        for (const [tool, result] of Object.entries(outputs)) {
          if (result.status === "success") {
            console.log(chalk.gray(`  ✓ ${tool}`));
          } else if (result.status === "failed") {
            console.log(chalk.yellow(`  ✗ ${tool}: ${result.error}`));
          }
        }
      } else {
        console.log(chalk.gray("Skipping output generation (--skip-outputs)"));
      }
      console.log();

      // Summary
      const usage = brain.agent.getUsage();
      const cost = brain.agent.estimateCost();

      console.log(chalk.bold.green("✅ Generation Complete!\n"));
      console.log(chalk.white(`  Title: ${brain.title}`));
      console.log(chalk.white(`  Path:  ${brain.bookPath}`));
      console.log();
      console.log(chalk.gray(`  Tokens: ${usage.totalTokens.toLocaleString()} (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`));
      console.log(chalk.gray(`  Est. Cost: $${cost.totalCost}`));

    } catch (error) {
      spinner.fail(chalk.red(error.message));
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

// ============================================================================
// LIST GENRES COMMAND
// ============================================================================

program
  .command("list-genres")
  .description("List all available genres")
  .action(() => {
    console.log(chalk.bold.cyan("\n📚 Available Genres\n"));
    
    for (const [slug, info] of Object.entries(genres)) {
      console.log(chalk.bold.white(info.name) + chalk.gray(` (${slug})`));
      console.log(chalk.gray(`  Voice: ${info.voice}`));
      console.log(chalk.gray(`  Comparables: ${info.comparables.join(", ")}`));
      console.log();
    }
  });

// ============================================================================
// LIST CONCEPTS COMMAND
// ============================================================================

program
  .command("list-concepts")
  .description("List concept files for a genre")
  .requiredOption("-g, --genre <genre>", "Genre slug")
  .action(async (options) => {
    console.log(chalk.bold.cyan(`\n📚 Concepts: ${options.genre}\n`));
    
    try {
      const concepts = await files.listConcepts(paths.concepts, options.genre);
      
      if (concepts.length === 0) {
        console.log(chalk.gray("No concept files found."));
        console.log(chalk.gray(`Expected location: ${paths.concepts}/${options.genre}/`));
      } else {
        for (const concept of concepts) {
          const slug = concept.replace(".md", "");
          console.log(chalk.white(`  ${slug}`));
        }
        console.log();
        console.log(chalk.gray(`Total: ${concepts.length} concepts`));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// ============================================================================
// STATUS COMMAND
// ============================================================================

program
  .command("status")
  .description("Show project status and concept counts")
  .action(async () => {
    console.log(chalk.bold.cyan("\n📚 Project Status\n"));
    
    try {
      const genresWithConcepts = await files.listGenresWithConcepts(paths.concepts);
      
      let totalConcepts = 0;
      for (const { genre, count } of genresWithConcepts) {
        console.log(chalk.white(`  ${genres[genre]?.name || genre}: `) + chalk.cyan(`${count} concepts`));
        totalConcepts += count;
      }
      
      console.log();
      console.log(chalk.bold.white(`  Total: ${totalConcepts} concepts across ${genresWithConcepts.length} genres`));
      
      // Check for generated books
      const bookGenres = await files.listFiles(paths.books);
      let totalBooks = 0;
      for (const genre of bookGenres) {
        if (genre === ".gitkeep") continue;
        const books = await files.listFiles(`${paths.books}/${genre}`);
        totalBooks += books.filter(b => b !== ".gitkeep").length;
      }
      
      console.log(chalk.bold.white(`  Generated: ${totalBooks} books`));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function runSinglePhase(brain, options, spinner) {
  spinner.start(chalk.cyan("Initializing..."));
  await brain.initialize(options.genre, options.concept, options.mode);
  spinner.succeed(chalk.green(`Initialized: ${brain.bookSlug}`));

  // Load existing state if needed
  if (options.phase !== "planning") {
    try {
      brain.brief = await files.readBrief(brain.bookPath);
      brain.title = brain.extractTitle(brain.brief);
    } catch (e) {
      console.error(chalk.red("Error: Brief not found. Run planning phase first."));
      process.exit(1);
    }
  }

  if (["manuscript", "covers", "metadata", "output"].includes(options.phase)) {
    try {
      brain.plan = await files.readPlan(brain.bookPath);
    } catch (e) {
      console.error(chalk.red("Error: Plan not found. Run planning phase first."));
      process.exit(1);
    }
  }

  switch (options.phase) {
    case "planning":
      spinner.start(chalk.cyan("Generating brief..."));
      await brain.generateBrief();
      spinner.succeed(chalk.green("Brief generated"));
      
      spinner.start(chalk.cyan("Generating plan..."));
      await brain.generatePlan();
      spinner.succeed(chalk.green("Plan generated"));
      
      await brain.generateReadme();
      break;

    case "manuscript":
      spinner.start(chalk.cyan("Generating manuscript..."));
      await brain.generateManuscript();
      spinner.succeed(chalk.green("Manuscript complete"));
      break;

    case "covers":
      spinner.start(chalk.cyan("Generating cover prompts..."));
      await brain.generateCoverPrompts();
      spinner.succeed(chalk.green("Cover prompts complete"));
      break;

    case "metadata":
      spinner.start(chalk.cyan("Generating metadata..."));
      await brain.generateMetadata();
      spinner.succeed(chalk.green("Metadata complete"));
      break;

    case "output":
      spinner.start(chalk.cyan("Generating outputs..."));
      await brain.generateOutputs();
      spinner.succeed(chalk.green("Outputs complete"));
      break;

    default:
      console.error(chalk.red(`Unknown phase: ${options.phase}`));
      console.log(chalk.gray("Valid phases: planning, manuscript, covers, metadata, output"));
      process.exit(1);
  }

  console.log(chalk.bold.green(`\n✅ Phase "${options.phase}" complete!\n`));
}

// ============================================================================
// RUN
// ============================================================================

program.parse();

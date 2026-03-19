# Agentic Development v3

OpenClaw-based book generation pipeline for Metronagon Media.

## Overview

This is a complete rewrite of the book generation system using OpenClaw agentic AI patterns. Key improvements over v2:

- **Node.js CLI** — Run from terminal instead of pasting into Windsurf
- **Prompt/Logic Separation** — All prompts in `/prompts`, all logic in `/lib`
- **Structured Output Parsing** — Clean extraction of all generated content
- **Phase Control** — Run individual phases or the full pipeline
- **Cost Tracking** — Token usage and cost estimates after each run
- **Resumable** — Pick up from any phase if generation is interrupted

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Install Python dependencies (for output tools)
pip install -r tools/requirements.txt

# 4. Generate a book
node cli.js generate --genre epic-fantasy --concept 001-the-ashen-throne
```

## Commands

### Generate a Book

```bash
# Full generation
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne

# Dry run (no API calls, no files written)
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --dry-run

# Verbose output
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --verbose

# Skip output file generation
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --skip-outputs

# Run single phase
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --phase planning
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --phase manuscript
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --phase covers
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --phase metadata
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne --phase output
```

### List Available Genres

```bash
node cli.js list-genres
```

### List Concepts

```bash
node cli.js list-concepts -g epic-fantasy
```

### Check Status

```bash
node cli.js status
```

## Project Structure

```
agentic-development-v3/
├── cli.js                 # Main entry point
├── config.js              # All configuration
├── package.json
├── .env                   # API keys (not tracked)
├── .env.example
│
├── lib/                   # Core library
│   ├── agent.js           # Claude API wrapper
│   ├── brain.js           # Main orchestrator
│   ├── parser.js          # Output parsing
│   ├── files.js           # File operations
│   └── tools.js           # Tool runners
│
├── prompts/               # All prompt templates
│   ├── planning/
│   │   ├── brief.md
│   │   └── plan.md
│   ├── manuscript/
│   │   ├── frontmatter.md
│   │   ├── chapter.md
│   │   └── backmatter.md
│   ├── covers/
│   │   ├── ebook.md
│   │   └── audiobook.md
│   └── metadata/
│       ├── summaries.md
│       ├── descriptions.md
│       ├── keywords.md
│       ├── categories.md
│       ├── uploads.md
│       └── chapter-summaries.md
│
├── tools/                 # Output generation tools
│   ├── audiobook/
│   │   ├── generate-mp3s.py
│   │   ├── create-m4b.py
│   │   └── upscale-audiobook-cover.py
│   ├── epub/
│   │   ├── generate-epub.py
│   │   └── epub-style.css
│   ├── pdf/
│   │   ├── generate-pdf.py
│   │   └── generate-pdf-kdp.py
│   ├── docx/
│   │   └── generate-docx.ps1
│   └── requirements.txt
│
├── concepts/              # Concept files by genre
│   ├── epic-fantasy/
│   ├── sword-and-sorcery/
│   └── ...
│
├── books/                 # Generated books by genre
│   └── [genre]/
│       └── [book-slug]/
│           ├── 01-planning/
│           ├── 02-manuscript/
│           ├── 03-covers/
│           ├── 04-metadata/
│           └── 05-output/
│
└── docs/
    └── README.md
```

## Generation Pipeline

### Phase 1: Planning
- Read concept file
- Generate book brief (title, characters, plot, themes)
- Generate chapter plan (all 10 chapters detailed)
- Create README for book folder

### Phase 2: Manuscript
- Generate frontmatter (opening credits, copyright, dedication, prologue)
- Generate all 10 chapters (4,500-6,000 words each)
- Generate backmatter (epilogue, acknowledgments, author bio, etc.)

### Phase 3: Cover Prompts
- Generate 5 ebook cover prompts
- Generate 5 audiobook cover prompts

### Phase 4: Metadata
- Generate summaries (one-line, short, extended)
- Generate descriptions (Amazon HTML, plain, ACX)
- Generate keywords (Amazon 7, wide 15)
- Generate categories (Amazon, BISAC, wide)
- Generate upload checklists (9 platforms)
- Generate chapter summaries (10 chapters)

### Phase 5: Output
- Generate MP3 files (Edge TTS)
- Generate DOCX (Pandoc)
- Generate EPUB (Pandoc)
- Generate PDF with cover (Pandoc + XeLaTeX)
- Generate PDF for KDP (no cover)
- Generate M4B audiobook (FFmpeg)

## Configuration

Edit `config.js` to customize:

- File paths (project root, tools, concepts, books)
- Claude models (primary, thinking, fast)
- Author info (name, publisher, default voice)
- Genre definitions (voices, descriptions, comparables)
- Chapter structure
- Manuscript file definitions

## Requirements

### Node.js
- Node.js 18+
- npm packages: @anthropic-ai/sdk, commander, chalk, ora, dotenv

### Python
- Python 3.10+
- edge-tts (TTS generation)
- Pillow (image processing)

### External Tools
- Pandoc (document conversion)
- XeLaTeX (PDF generation)
- FFmpeg (audio processing)

## Costs

Estimated costs per book (Claude Sonnet):
- Brief: ~$0.05
- Plan: ~$0.08
- 10 Chapters: ~$0.80
- Frontmatter/Backmatter: ~$0.10
- Covers: ~$0.05
- Metadata: ~$0.10
- **Total: ~$1.20 per book**

## OpenClaw Patterns Used

1. **Separation of Concerns** — Prompts, logic, config all in separate files
2. **Atomic Tasks** — Each API call does one thing
3. **Structured Outputs** — XML tags for reliable parsing
4. **Observable State** — Progress tracking throughout
5. **Resumable Pipeline** — Run phases independently
6. **Cost Awareness** — Token tracking and estimates

## License

Private — Metronagon Media

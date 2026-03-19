# Agentic Development v3

**OpenClaw-based agentic book generation pipeline for Metronagon Media**

Generate complete commercial fiction books from concept to published outputs using Claude AI.

## Features

- 🚀 **Node.js CLI** — Run from terminal, no Windsurf required
- 📚 **13 Genres** — Epic fantasy, action-adventure, thrillers, and more
- 🎯 **10-Chapter Structure** — Cinematic story architecture
- 🎨 **Cover Prompts** — 5 ebook + 5 audiobook prompts per book
- 📊 **Full Metadata** — Keywords, categories, descriptions for 9 platforms
- 🔊 **Audiobook Ready** — MP3 chapters + M4B with chapters
- 📖 **Multi-Format** — EPUB, PDF, DOCX outputs
- 💰 **Cost Tracking** — Token usage and estimates after each run

## Quick Start

```bash
# Install Node dependencies
npm install

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Install Python tools
pip install -r tools/requirements.txt

# Generate your first book
node cli.js generate -g epic-fantasy -c 001-the-ashen-throne
```

## Documentation

See [docs/README.md](docs/README.md) for full documentation.

## Author

Ketan Shukla | Metronagon Media | 2026

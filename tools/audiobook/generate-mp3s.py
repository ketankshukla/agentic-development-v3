#!/usr/bin/env python3
"""
generate-mp3s.py
Generates individual MP3 files for each manuscript file using Edge TTS.
Outputs to books/[genre]/[book-slug]/05-output/mp3/

Usage:
    python generate-mp3s.py --book-path "path/to/book" --voice "en-GB-RyanNeural"
"""

import argparse
import asyncio
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("ERROR: edge-tts not found. Install with: pip install edge-tts")
    sys.exit(1)


def clean_text_for_tts(text: str) -> str:
    """Remove markdown formatting and clean text for TTS narration."""
    # Remove markdown headings
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    # Remove horizontal rules
    text = re.sub(r'^[-*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    # Remove bold and italic markers
    text = re.sub(r'\*{1,3}(.+?)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,3}(.+?)_{1,3}', r'\1', text)
    # Remove inline code
    text = re.sub(r'`(.+?)`', r'\1', text)
    # Remove links but keep text
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Clean up scene breaks
    text = re.sub(r'\*\s*\*\s*\*', '...', text)
    return text.strip()


async def generate_mp3(text: str, voice: str, output_path: Path) -> None:
    """Generate a single MP3 file from text using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_path))


def get_manuscript_files(manuscript_dir: Path) -> list[Path]:
    """Get all manuscript markdown files in numbered order."""
    files = sorted(manuscript_dir.glob("*.md"))
    return files


async def main():
    parser = argparse.ArgumentParser(description="Generate MP3 audiobook files from manuscript")
    parser.add_argument("--book-path", required=True, help="Full path to the book folder")
    parser.add_argument("--voice", required=True, help="Edge TTS voice name (e.g., en-GB-RyanNeural)")
    args = parser.parse_args()

    book_path = Path(args.book_path)
    manuscript_dir = book_path / "02-manuscript"
    output_dir = book_path / "05-output" / "mp3"

    if not manuscript_dir.exists():
        print(f"ERROR: Manuscript directory not found: {manuscript_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    manuscript_files = get_manuscript_files(manuscript_dir)
    if not manuscript_files:
        print(f"ERROR: No manuscript files found in {manuscript_dir}")
        sys.exit(1)

    print(f"Found {len(manuscript_files)} manuscript files")
    print(f"Using voice: {args.voice}")
    print(f"Output directory: {output_dir}")
    print()

    for i, md_file in enumerate(manuscript_files, 1):
        # Read and clean text
        raw_text = md_file.read_text(encoding="utf-8")
        clean_text = clean_text_for_tts(raw_text)
        
        if not clean_text.strip():
            print(f"  Skipping {md_file.name} (empty after cleaning)")
            continue

        # Output filename matches input but with .mp3
        output_name = md_file.stem + ".mp3"
        output_path = output_dir / output_name

        print(f"  [{i}/{len(manuscript_files)}] {md_file.name} → {output_name}")
        
        try:
            await generate_mp3(clean_text, args.voice, output_path)
        except Exception as e:
            print(f"    ERROR: {e}")
            continue

    print()
    print("MP3 generation complete!")
    print(f"Files saved to: {output_dir}")


if __name__ == "__main__":
    asyncio.run(main())

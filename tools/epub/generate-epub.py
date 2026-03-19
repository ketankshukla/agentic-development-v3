#!/usr/bin/env python3
"""
generate-epub.py
Generates EPUB from manuscript markdown files using Pandoc.
Outputs to books/[genre]/[book-slug]/05-output/

Usage:
    python generate-epub.py --book-path "path/to/book" --author "Author" --title "Title"
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

# Pandoc path - update this for your system
PANDOC = "pandoc"


def sanitize_filename(title: str) -> str:
    """Sanitize title for use as filename."""
    for char in ':/\\*?"<>|':
        title = title.replace(char, "-")
    return title.strip()


def get_manuscript_files(manuscript_dir: Path) -> list[Path]:
    """Get manuscript files excluding audiobook-only files (00, 19, 20)."""
    excluded_prefixes = ("00-", "19-", "20-")
    files = sorted(manuscript_dir.glob("*.md"))
    return [f for f in files if not any(f.name.startswith(p) for p in excluded_prefixes)]


def combine_manuscript(files: list[Path]) -> str:
    """Combine all manuscript files into a single string."""
    combined = []
    for f in files:
        content = f.read_text(encoding="utf-8").strip()
        combined.append(content)
    return "\n\n---\n\n".join(combined)


def main():
    parser = argparse.ArgumentParser(description="Generate EPUB from manuscript")
    parser.add_argument("--book-path", required=True, help="Full path to the book folder")
    parser.add_argument("--author", required=True, help="Author name")
    parser.add_argument("--title", required=True, help="Book title")
    args = parser.parse_args()

    book_path = Path(args.book_path)
    manuscript_dir = book_path / "02-manuscript"
    output_dir = book_path / "05-output"
    css_path = Path(__file__).parent / "epub-style.css"
    cover_path = book_path / "03-covers" / "images" / "ebook-cover.png"
    
    safe_title = sanitize_filename(args.title)
    output_path = output_dir / f"{args.author} - {safe_title}.epub"

    if not manuscript_dir.exists():
        print(f"ERROR: Manuscript directory not found: {manuscript_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    manuscript_files = get_manuscript_files(manuscript_dir)
    if not manuscript_files:
        print(f"ERROR: No manuscript files found in {manuscript_dir}")
        sys.exit(1)

    print(f"Found {len(manuscript_files)} manuscript files")
    print(f"Output: {output_path}")

    # Combine manuscript files
    combined_text = combine_manuscript(manuscript_files)

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, encoding="utf-8") as f:
        tmp_input = f.name
        f.write(combined_text)

    try:
        # Build pandoc command
        cmd = [
            PANDOC,
            tmp_input,
            "-o", str(output_path),
            "--epub-chapter-level=1",
            f"--metadata=title:{args.title}",
            f"--metadata=author:{args.author}",
            "--metadata=publisher:Metronagon Media",
            "--toc",
            "--toc-depth=1",
        ]

        # Add CSS if available
        if css_path.exists():
            cmd.append(f"--css={css_path}")

        # Add cover if available
        if cover_path.exists():
            cmd.append(f"--epub-cover-image={cover_path}")
        else:
            print("WARNING: No ebook cover found. EPUB will be generated without cover.")

        print("Running pandoc...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"ERROR: Pandoc failed")
            print(result.stderr)
            sys.exit(1)

        print("EPUB generation complete!")
        print(f"Output: {output_path}")

    finally:
        Path(tmp_input).unlink(missing_ok=True)


if __name__ == "__main__":
    main()

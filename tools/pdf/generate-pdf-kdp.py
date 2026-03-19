#!/usr/bin/env python3
"""
generate-pdf-kdp.py
Generates PDF without cover for KDP interior upload using Pandoc + XeLaTeX.
KDP requires separate cover upload - this is interior only.
Outputs to books/[genre]/[book-slug]/05-output/

Usage:
    python generate-pdf-kdp.py --book-path "path/to/book" --author "Author" --title "Title"
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

# Tool paths - update these for your system
PANDOC = "pandoc"
XELATEX = "xelatex"


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
    """Combine all manuscript files with page breaks."""
    combined = []
    for f in files:
        content = f.read_text(encoding="utf-8").strip()
        combined.append(content)
    return "\n\n\\newpage\n\n".join(combined)


def main():
    parser = argparse.ArgumentParser(description="Generate KDP PDF (no cover) from manuscript")
    parser.add_argument("--book-path", required=True, help="Full path to the book folder")
    parser.add_argument("--author", required=True, help="Author name")
    parser.add_argument("--title", required=True, help="Book title")
    args = parser.parse_args()

    book_path = Path(args.book_path)
    manuscript_dir = book_path / "02-manuscript"
    output_dir = book_path / "05-output"
    
    safe_title = sanitize_filename(args.title)
    output_path = output_dir / f"{args.author} - {safe_title} (KDP).pdf"

    if not manuscript_dir.exists():
        print(f"ERROR: Manuscript directory not found: {manuscript_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    manuscript_files = get_manuscript_files(manuscript_dir)
    if not manuscript_files:
        print(f"ERROR: No manuscript files found")
        sys.exit(1)

    print(f"Found {len(manuscript_files)} manuscript files")
    print(f"Output: {output_path}")
    print("Note: This is interior-only for KDP (no cover)")

    # Combine manuscript
    combined_text = combine_manuscript(manuscript_files)

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, encoding="utf-8") as f:
        tmp_input = f.name
        f.write(combined_text)

    try:
        # Build pandoc command - KDP specs
        cmd = [
            PANDOC,
            tmp_input,
            "-o", str(output_path),
            "--pdf-engine", XELATEX,
            f"--metadata=title:{args.title}",
            f"--metadata=author:{args.author}",
            # KDP standard trim size 6x9
            "-V", "geometry:papersize={6in,9in}",
            # KDP recommended margins
            "-V", "geometry:top=0.75in",
            "-V", "geometry:bottom=0.75in",
            "-V", "geometry:inner=0.875in",  # Larger inner margin for binding
            "-V", "geometry:outer=0.625in",
            "-V", "fontsize=11pt",
            "-V", "linestretch=1.3",
            "-V", "mainfont=Georgia",
            "--toc",
        ]

        print("Running pandoc with XeLaTeX (KDP specs)...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"ERROR: Pandoc/XeLaTeX failed")
            print(result.stderr)
            sys.exit(1)

        print("KDP PDF generation complete!")
        print(f"Output: {output_path}")
        print("Remember: Upload cover separately in KDP dashboard")

    finally:
        Path(tmp_input).unlink(missing_ok=True)


if __name__ == "__main__":
    main()

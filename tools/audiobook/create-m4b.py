#!/usr/bin/env python3
"""
create-m4b.py
Combines MP3 files into a single M4B audiobook with chapter markers.
Requires ffmpeg to be installed.

Usage:
    python create-m4b.py --book-path "path/to/book" --author "Author Name" --title "Book Title"
"""

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

# FFmpeg path - update this for your system
FFMPEG = "ffmpeg"


def get_mp3_files(mp3_dir: Path) -> list[Path]:
    """Get all MP3 files in order."""
    return sorted(mp3_dir.glob("*.mp3"))


def get_mp3_duration(mp3_path: Path) -> float:
    """Get duration of an MP3 file in seconds using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(mp3_path)
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return float(result.stdout.strip())


def create_chapter_metadata(mp3_files: list[Path], title: str) -> str:
    """Create FFmpeg metadata file content with chapter markers."""
    lines = [";FFMETADATA1", f"title={title}", ""]
    
    current_time_ms = 0
    
    for mp3_file in mp3_files:
        # Get duration
        duration = get_mp3_duration(mp3_file)
        duration_ms = int(duration * 1000)
        
        # Chapter name from filename
        chapter_name = mp3_file.stem
        # Clean up the name (remove leading numbers)
        chapter_name = chapter_name.split("-", 1)[-1] if "-" in chapter_name else chapter_name
        chapter_name = chapter_name.replace("-", " ").title()
        
        lines.extend([
            "[CHAPTER]",
            "TIMEBASE=1/1000",
            f"START={current_time_ms}",
            f"END={current_time_ms + duration_ms}",
            f"title={chapter_name}",
            ""
        ])
        
        current_time_ms += duration_ms
    
    return "\n".join(lines)


def sanitize_filename(title: str) -> str:
    """Sanitize title for use as filename."""
    for char in ':/\\*?"<>|':
        title = title.replace(char, "-")
    return title.strip()


def main():
    parser = argparse.ArgumentParser(description="Create M4B audiobook from MP3 files")
    parser.add_argument("--book-path", required=True, help="Full path to the book folder")
    parser.add_argument("--author", required=True, help="Author name")
    parser.add_argument("--title", required=True, help="Book title")
    args = parser.parse_args()

    book_path = Path(args.book_path)
    mp3_dir = book_path / "05-output" / "mp3"
    output_dir = book_path / "05-output" / "m4b"
    cover_path = book_path / "03-covers" / "images" / "audiobook-cover.png"
    
    safe_title = sanitize_filename(args.title)
    output_path = output_dir / f"{args.author} - {safe_title}.m4b"

    if not mp3_dir.exists():
        print(f"ERROR: MP3 directory not found: {mp3_dir}")
        print("Run generate-mp3s.py first.")
        sys.exit(1)

    mp3_files = get_mp3_files(mp3_dir)
    if not mp3_files:
        print(f"ERROR: No MP3 files found in {mp3_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Found {len(mp3_files)} MP3 files")
    print(f"Output: {output_path}")
    print()

    # Create temporary files
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as concat_file:
        # Write concat list
        for mp3_file in mp3_files:
            concat_file.write(f"file '{mp3_file}'\n")
        concat_path = concat_file.name

    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as meta_file:
        # Write chapter metadata
        metadata = create_chapter_metadata(mp3_files, args.title)
        meta_file.write(metadata)
        meta_path = meta_file.name

    try:
        # Build ffmpeg command
        cmd = [
            FFMPEG,
            "-y",  # Overwrite output
            "-f", "concat",
            "-safe", "0",
            "-i", concat_path,
            "-i", meta_path,
        ]

        # Add cover art if available
        if cover_path.exists():
            cmd.extend(["-i", str(cover_path)])
            cmd.extend([
                "-map", "0:a",
                "-map", "2:v",
                "-c:v", "copy",
                "-disposition:v:0", "attached_pic",
            ])
        else:
            print("WARNING: No audiobook cover found. M4B will be created without cover art.")
            cmd.extend(["-map", "0:a"])

        # Add metadata and encoding settings
        cmd.extend([
            "-map_metadata", "1",
            "-c:a", "aac",
            "-b:a", "128k",
            "-metadata", f"title={args.title}",
            "-metadata", f"artist={args.author}",
            "-metadata", f"album={args.title}",
            "-metadata", "genre=Audiobook",
            str(output_path)
        ])

        print("Running ffmpeg...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"ERROR: ffmpeg failed")
            print(result.stderr)
            sys.exit(1)

        print()
        print("M4B creation complete!")
        print(f"Output: {output_path}")

    finally:
        # Clean up temp files
        Path(concat_path).unlink(missing_ok=True)
        Path(meta_path).unlink(missing_ok=True)


if __name__ == "__main__":
    main()

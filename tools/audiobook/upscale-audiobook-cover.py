#!/usr/bin/env python3
"""
upscale-audiobook-cover.py
Upscales audiobook cover to 2400x2400 for ACX/Audible requirements.
GPT Image 1 outputs 1024x1024 - this upscales to the required size.

Usage:
    python upscale-audiobook-cover.py "path/to/audiobook-cover.png"
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not found. Install with: pip install Pillow")
    sys.exit(1)


def upscale_cover(input_path: Path, target_size: int = 2400) -> None:
    """Upscale cover image to target size (square)."""
    
    if not input_path.exists():
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    # Open image
    img = Image.open(input_path)
    original_size = img.size
    
    print(f"Input: {input_path}")
    print(f"Original size: {original_size[0]}x{original_size[1]}")
    
    # Check if already at target size
    if original_size[0] >= target_size and original_size[1] >= target_size:
        print(f"Image already at or above {target_size}x{target_size}. No upscaling needed.")
        return

    # Upscale using high-quality Lanczos resampling
    upscaled = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
    
    # Save, overwriting original
    upscaled.save(input_path, "PNG", quality=95)
    
    print(f"Upscaled to: {target_size}x{target_size}")
    print(f"Saved to: {input_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python upscale-audiobook-cover.py <path-to-cover.png>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    upscale_cover(input_path)
    print("Done!")


if __name__ == "__main__":
    main()

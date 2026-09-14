#!/usr/bin/env python3
"""Remove the saturated magenta studio background from generated game art."""

from pathlib import Path
import sys

from PIL import Image


def remove_magenta(source, target):
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            strongly_magenta = red > 65 and blue > 65 and red > green * 1.45 and blue > green * 1.45
            balanced_key = abs(red - blue) < 105
            if strongly_magenta and balanced_key:
                pixels[x, y] = (red, green, blue, 0)
    Path(target).parent.mkdir(parents=True, exist_ok=True)
    image.save(target)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: chroma_key_magenta.py INPUT OUTPUT")
    remove_magenta(sys.argv[1], sys.argv[2])

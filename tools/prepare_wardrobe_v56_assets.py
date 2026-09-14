#!/usr/bin/env python3
"""Convert generated wardrobe art into production RGBA paper-doll assets."""

from __future__ import annotations

from pathlib import Path
import os

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT.parent / "generated_images"
OUTPUT = ROOT / "assets" / "wardrobe_v56"

SOURCES = {
    "doll_bear": "exec-137e8f23-bc45-40a2-b663-f675c97d328e.png",
    "doll_sister": "exec-5b2db343-ca98-44c0-a8f1-0e019bd90633.png",
    "doll_squirrel": "exec-502270b7-f58c-4f91-84f1-0f7949b71f1d.png",
    "doll_owl": "exec-a8ae7b2e-c156-4f01-a9f4-58261f20382f.png",
    "doll_rainbow": "exec-ed4f57bd-3fa7-404d-88cc-f4c35ec7e2a7.png",
    "hat_fox": "exec-5f00578c-d21c-4e2e-96fc-7eeff7517b2a.png",
    "hat_mushroom": "exec-25a8d255-25be-4721-a493-c7619eb5dae7.png",
    "hat_bunny": "exec-f22f15e5-03ae-4983-ba01-32ff7edfe102.png",
    "hat_flower": "exec-e01071aa-8c74-46bc-ba7e-b73c10f38140.png",
    "hat_antennae": "exec-bbd214fd-8b4a-45c3-88e6-438886648f1d.png",
}


def remove_connected_checkerboard(image: Image.Image, *, neutral_range: int = 14) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    channel_range = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
    luminance = rgb.mean(axis=2)

    # Generated transparency previews use an almost-neutral warped checkerboard.
    # Only neutral pixels connected to the canvas edge are removed, which keeps
    # enclosed white fabric, flower petals and highlights intact.
    removable = (channel_range <= neutral_range) & (luminance >= 72)
    seeds = np.zeros(removable.shape, dtype=bool)
    seeds[0, :] = removable[0, :]
    seeds[-1, :] = removable[-1, :]
    seeds[:, 0] |= removable[:, 0]
    seeds[:, -1] |= removable[:, -1]
    background = ndimage.binary_propagation(seeds, mask=removable)

    # Closed spaces between braids, ears, capes or wreath ribbons can trap a
    # sizeable patch of the same checkerboard. Remove only large enclosed
    # neutral components; small neutral details on the character stay intact.
    neutral_labels, neutral_count = ndimage.label(removable)
    if neutral_count:
        neutral_sizes = np.bincount(neutral_labels.ravel())
        large_neutral = neutral_sizes >= 1000
        large_neutral[0] = False
        background |= large_neutral[neutral_labels]

    foreground = ~background
    labels, count = ndimage.label(foreground)
    if count:
        sizes = np.bincount(labels.ravel())
        keep = sizes >= 24
        keep[0] = False
        foreground = keep[labels]

    # Pull the matte one pixel inward and feather one pixel to avoid gray fringe.
    solid = ndimage.binary_erosion(foreground, iterations=1)
    fringe = foreground & ~solid
    alpha = np.zeros(foreground.shape, dtype=np.uint8)
    alpha[solid] = 255
    alpha[fringe] = 170

    rgba = np.dstack((rgb, alpha))
    return Image.fromarray(rgba, mode="RGBA")


def tight_icon(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 8)
    if len(xs) == 0:
        return image.copy()
    left, right = int(xs.min()), int(xs.max()) + 1
    top, bottom = int(ys.min()), int(ys.max()) + 1
    width, height = right - left, bottom - top
    pad = max(18, int(max(width, height) * 0.08))
    return image.crop((max(0, left - pad), max(0, top - pad), min(image.width, right + pad), min(image.height, bottom + pad)))


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, filename in SOURCES.items():
        source = GENERATED / filename
        if not source.exists():
            raise FileNotFoundError(source)
        cleaned = remove_connected_checkerboard(
            Image.open(source), neutral_range=32 if name.startswith("hat_") else 14
        )
        target_size = (1024, 1800) if name.startswith("hat_") else (1024, 1536)
        if cleaned.size != target_size:
            cleaned = cleaned.resize(target_size, Image.Resampling.LANCZOS)
        target = OUTPUT / f"{name}.png"
        temporary = target.with_suffix(".tmp.png")
        cleaned.save(temporary)
        os.replace(temporary, target)
        if name.startswith("hat_"):
            slug = name.removeprefix("hat_")
            icon_target = OUTPUT / f"icon_{slug}.png"
            icon_temporary = icon_target.with_suffix(".tmp.png")
            tight_icon(cleaned).save(icon_temporary)
            os.replace(icon_temporary, icon_target)


if __name__ == "__main__":
    main()

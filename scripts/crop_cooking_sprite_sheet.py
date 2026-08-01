from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


SPRITE_NAMES = [
    "soft-bread",
    "multigrain-toast",
    "top-bun",
    "lettuce",
    "tomato",
    "cheese",
    "ham",
    "egg-salad",
    "patty",
    "mayonnaise",
]

# Hand-tuned safe cells for the generated 1672x941 sheet. The model placed a few
# silhouettes across the mathematical 5x2 grid boundaries, so these gaps avoid
# pulling a sliver of the neighboring ingredient into the trimmed sprite.
SPRITE_CROP_BOXES = [
    (35, 125, 355, 465),
    (370, 125, 695, 465),
    (690, 125, 1035, 465),
    (1035, 125, 1360, 465),
    (1350, 125, 1672, 465),
    (35, 490, 345, 825),
    (355, 480, 690, 825),
    (690, 490, 1035, 815),
    (1035, 485, 1375, 820),
    (1380, 585, 1650, 805),
]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split the generated 5x2 cooking sprite sheet into trimmed PNGs."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    scale_x = source.width / 1672
    scale_y = source.height / 941

    for name, crop_box in zip(SPRITE_NAMES, SPRITE_CROP_BOXES, strict=True):
        left, top, right, bottom = crop_box
        left = round(left * scale_x)
        top = round(top * scale_y)
        right = round(right * scale_x)
        bottom = round(bottom * scale_y)
        cell = source.crop((left, top, right, bottom))
        alpha = cell.getchannel("A")
        bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
        if bbox is None:
            raise RuntimeError(f"No visible pixels found for {name}")

        sprite = cell.crop(bbox)
        padded = Image.new(
            "RGBA", (sprite.width + 24, sprite.height + 24), (0, 0, 0, 0)
        )
        padded.alpha_composite(sprite, (12, 12))
        padded.save(args.output_dir / f"{name}.png", optimize=True)


if __name__ == "__main__":
    main()

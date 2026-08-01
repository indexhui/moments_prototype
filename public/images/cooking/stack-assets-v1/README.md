# Stack Ingredient Assets v1

Generated with the built-in ImageGen tool from the user-provided sandwich-game
screenshot as a style reference. The mouse character and original UI were not
used as assets.

## Final files

- `ingredient-sheet-clean.png`: transparent 5x2 contact sheet
- `sprites-clean/*.png`: ten trimmed transparent sprites used by the game
- `ingredient-sheet-chroma.png`: original flat-blue removal source

The crop step is reproducible with:

```sh
python3 scripts/crop_cooking_sprite_sheet.py \
  public/images/cooking/stack-assets-v1/ingredient-sheet-clean.png \
  public/images/cooking/stack-assets-v1/sprites-clean
```

## Generation prompt

```text
Use case: stylized-concept
Asset type: production game ingredient sprite sheet for a mobile cooking minigame.
Input image: Image 1 is a STYLE REFERENCE ONLY. Derive the handmade food illustration language from it; do not copy the mouse character or the original UI layout.
Primary request: create exactly ten isolated food sprites arranged in a precise 5-column by 2-row grid with generous equal spacing. Row 1, left to right: soft white sandwich bread slice; seeded whole-grain toast slice; rounded golden top bun; crisp green lettuce leaf; red tomato slice. Row 2, left to right: square yellow cheese slice; pink ham slice; chunky yellow egg-salad scoop; dark brown hamburger patty; small pale-yellow mayonnaise swirl.
Style/medium: coherent Japanese children's picture-book cut-paper illustration, soft crayon and paper-fiber grain, slightly imperfect hand-cut silhouettes, flat matte color, subtle darker hand-drawn edge, tactile fuzzy texture. Match the reference image's ingredient style and scale consistently across every sprite.
Composition: orthographic front/top hybrid view suitable for stacking food layers; every sprite centered in its own invisible cell, fully separated from every other sprite, no overlap, identical visual scale.
Scene/backdrop: perfectly flat solid #00AEEF chroma-key background for background removal. One uniform color only, no texture, no gradient, no shadow, no floor plane.
Constraints: no mouse, no animal, no character, no cutting board, no plates, no sandwich assembly, no text, no letters, no numbers, no arrows, no dotted grid, no UI frame, no watermark. Do not use #00AEEF anywhere inside the food sprites. Crisp readable silhouettes and generous padding around every sprite.
```

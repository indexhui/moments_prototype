/** The artist's layers share the background's 786 × 1704 canvas. */
export const DESSERT_SHOP_BACKGROUND = "/images/dessert_shop/甜點店.jpg";
export const DESSERT_BAG_FRAMES = Array.from(
  { length: 10 }, (_, index) => `/images/dessert_shop/${index + 1}.png`,
);
export const DESSERT_BAG_EMPTY_FRAME = 4;
export const DESSERT_FROG_IMAGE = "/images/dessert_shop/3a.png";
export const DESSERT_REVEAL_ASSETS = [
  DESSERT_SHOP_BACKGROUND, ...DESSERT_BAG_FRAMES, DESSERT_FROG_IMAGE,
];

// A short rustle, then a pause: the bag keeps attracting attention until tapped.
export const DESSERT_BAG_IDLE_BEATS = [
  { frame: 1, durationMs: 720 },
  { frame: 2, durationMs: 150 },
  { frame: 3, durationMs: 160 },
  { frame: 2, durationMs: 130 },
  { frame: 1, durationMs: 180 },
  { frame: 3, durationMs: 140 },
  { frame: 1, durationMs: 900 },
];
export const DESSERT_BAG_REVEAL_BEATS = [
  { frame: 4, durationMs: 180 },
  { frame: 5, durationMs: 260 },
  { frame: 6, durationMs: 330 },
  { frame: 7, durationMs: 150 },
  { frame: 6, durationMs: 230 },
  { frame: 7, durationMs: 180 },
  { frame: 8, durationMs: 120 },
  { frame: 9, durationMs: 110 },
  { frame: 10, durationMs: 100 },
];

export const DESSERT_BAG_HIT_RECT = { x: 0.39, y: 0.36, width: 0.29, height: 0.22 };

// Scale the original 3a layer to 65%; its feet meet the display cabinet at y=510.
export const DESSERT_FROG_LAYER_RECT = {
  x: (25 - 273 * 0.65) / 786,
  y: (510 - 1081 * 0.65) / 1704,
  width: 0.65,
  height: 0.65,
};
export const DESSERT_FROG_TARGET_RECT = {
  x: 25 / 786,
  y: (510 - 240 * 0.65) / 1704,
  width: (280 * 0.65) / 786,
  height: (240 * 0.65) / 1704,
};
export const DESSERT_PHOTO_OVERLAYS = [
  {
    id: "dessert-empty-bag",
    imageSrc: DESSERT_BAG_FRAMES[DESSERT_BAG_EMPTY_FRAME - 1],
    rectNormalized: { x: 0, y: 0, width: 1, height: 1 },
  },
  {
    id: "dessert-cabinet-frog",
    imageSrc: DESSERT_FROG_IMAGE,
    rectNormalized: DESSERT_FROG_LAYER_RECT,
  },
];

export const CABINET_BOX_STICKERS = [
  { id: "normal", label: "N", url: "/slot/golden.png", points: 50 },
  { id: "r", label: "R", url: "/images/minigame/box_stacking/sticker/sticker_r.png", points: 100 },
  { id: "sr", label: "SR", url: "/images/minigame/box_stacking/sticker/sticker_sr.png", points: 150 },
] as const;

export type CabinetBoxStickerId = (typeof CABINET_BOX_STICKERS)[number]["id"];
export type CabinetBoxStickerCounts = Record<CabinetBoxStickerId, number>;

export const CABINET_BOX_STAR_THRESHOLDS = [700, 1400, 2200] as const;
export const CABINET_BOX_LAYER_POINTS = 100;
export const CABINET_BOX_QUICK_FLIP_POINTS = 100;
export const CABINET_BOX_QUICK_FLIP_WINDOW_MS = 400;
export const CABINET_BOX_FAST_SECONDS_PER_LAYER = 1.5;
export const CABINET_BOX_SLOW_SECONDS_PER_LAYER = 4;
export const CABINET_BOX_MAX_SPEED_POINTS_PER_LAYER = 50;

export function getCabinetBoxSticker(sequenceIndex: number) {
  return CABINET_BOX_STICKERS[sequenceIndex % CABINET_BOX_STICKERS.length];
}

export function getCabinetBoxStarCount(score: number) {
  return CABINET_BOX_STAR_THRESHOLDS.filter((threshold) => score >= threshold).length;
}

export function isCabinetBoxQuickFlip({
  correctedAtMs,
  placedAtMs,
  directionChanges,
}: {
  correctedAtMs: number | null;
  placedAtMs: number;
  directionChanges: number;
}) {
  if (correctedAtMs === null || directionChanges !== 0) return false;
  const delay = placedAtMs - correctedAtMs;
  return delay >= 0 && delay <= CABINET_BOX_QUICK_FLIP_WINDOW_MS;
}

/** Speed is measured over the successful stack, ending at its last placement.
 * The final missed box and result-screen reading time never reduce earned points.
 */
export function calculateCabinetBoxScore({
  layers,
  stackingElapsedMs,
  stickers,
  quickFlips,
}: {
  layers: number;
  stackingElapsedMs: number;
  stickers: CabinetBoxStickerCounts;
  quickFlips: number;
}) {
  const layerPoints = layers * CABINET_BOX_LAYER_POINTS;
  const averageSeconds = layers > 0 ? stackingElapsedMs / 1000 / layers : 0;
  const speedRatio = Math.max(0, Math.min(1,
    (CABINET_BOX_SLOW_SECONDS_PER_LAYER - averageSeconds) /
    (CABINET_BOX_SLOW_SECONDS_PER_LAYER - CABINET_BOX_FAST_SECONDS_PER_LAYER),
  ));
  const speedPoints = Math.round(layers * CABINET_BOX_MAX_SPEED_POINTS_PER_LAYER * speedRatio);
  const stickerPoints = CABINET_BOX_STICKERS.reduce((sum, sticker) => sum + stickers[sticker.id] * sticker.points, 0);
  const quickFlipPoints = quickFlips * CABINET_BOX_QUICK_FLIP_POINTS;
  const total = layerPoints + speedPoints + stickerPoints + quickFlipPoints;
  return {
    layers,
    stackingElapsedMs,
    stickers,
    quickFlips,
    layerPoints,
    speedPoints,
    stickerPoints,
    quickFlipPoints,
    total,
    stars: getCabinetBoxStarCount(total),
  };
}

export type CabinetBoxScore = ReturnType<typeof calculateCabinetBoxScore>;

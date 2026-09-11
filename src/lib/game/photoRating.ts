export type PhotoRect = { x: number; y: number; width: number; height: number };
export type PhotoStarCount = 0 | 1 | 2 | 3;

export type PhotoStarRule = {
  /** Strictly greater than this displayed accuracy, as specified by the level. */
  scoreAbove?: number;
  /** All regions must be inside the saved crop, in normalized source-image coordinates. */
  requiredRegions?: readonly PhotoRect[];
};

export type PhotoStarCriteria = readonly [PhotoStarRule, PhotoStarRule, PhotoStarRule];

// Preserve the existing accuracy target; full-body framing is a separate condition.
export const GOLDEN_RETRIEVER_PHOTO_TARGET: PhotoRect = {
  x: 0.29, y: 0.51, width: 0.58, height: 0.2,
};

// Bounds include both metro poses on the 786 × 1704 source canvas.
export const GOLDEN_RETRIEVER_PHOTO_EYES: PhotoRect = {
  x: 0.424, y: 0.522, width: 0.093, height: 0.014,
};
export const GOLDEN_RETRIEVER_PHOTO_BODY: PhotoRect = {
  x: 0.268, y: 0.486, width: 0.52, height: 0.268,
};

export const GOLDEN_RETRIEVER_PHOTO_STARS: PhotoStarCriteria = [
  { scoreAbove: 50 },
  { scoreAbove: 60, requiredRegions: [GOLDEN_RETRIEVER_PHOTO_EYES] },
  { requiredRegions: [GOLDEN_RETRIEVER_PHOTO_BODY] },
];

function containsRegion(crop: PhotoRect, region: PhotoRect) {
  const epsilon = 1e-7;
  return crop.width > 0 && crop.height > 0 &&
    crop.x <= region.x + epsilon && crop.y <= region.y + epsilon &&
    crop.x + crop.width >= region.x + region.width - epsilon &&
    crop.y + crop.height >= region.y + region.height - epsilon;
}

export function getPhotoStarCount(
  score: number,
  capturedRect: PhotoRect,
  criteria: PhotoStarCriteria,
): PhotoStarCount {
  // Each entry describes a rating. The highest matching rating wins.
  for (let index = criteria.length - 1; index >= 0; index -= 1) {
    const rule = criteria[index];
    if (rule.scoreAbove !== undefined && !(score > rule.scoreAbove)) continue;
    if (rule.requiredRegions && !rule.requiredRegions.every((region) => containsRegion(capturedRect, region))) continue;
    return (index + 1) as PhotoStarCount;
  }
  return 0;
}

export const PHOTO_RESULT_TIMING = {
  developMs: 460,
  countMs: 550,
  scoreHoldMs: 140,
  firstStarMs: 200,
  starIntervalMs: 440,
  starSettleMs: 640,
} as const;

export function samplePhotoResultReveal(elapsedMs: number, score: number, stars?: PhotoStarCount) {
  const t = PHOTO_RESULT_TIMING;
  const countProgress = Math.max(0, Math.min(1, (elapsedMs - t.developMs) / t.countMs));
  const displayedScore = Math.min(score, Math.floor(score * countProgress));
  const starsStart = t.developMs + t.countMs + t.scoreHoldMs;
  const showStars = stars !== undefined && stars > 0 && elapsedMs >= starsStart;
  const litStars = showStars
    ? Math.min(stars, Math.max(0, 1 + Math.floor((elapsedMs - starsStart - t.firstStarMs) / t.starIntervalMs)))
    : 0;
  const completeAt = stars !== undefined && stars > 0
    ? starsStart + t.firstStarMs + (stars - 1) * t.starIntervalMs + t.starSettleMs
    : starsStart;
  return { displayedScore, showStars, litStars, complete: elapsedMs >= completeAt };
}

export type PhotoHopKeyframe = {
  at: number;
  x: number;
  y: number;
  frameIndex: number;
  /** Vertical interpolation to the next pose; horizontal travel stays steady. */
  verticalEase?: "ease-in" | "ease-out";
};

/** Sample one jump cycle; artwork holds its pose between timed keyframes. */
export function samplePhotoHopMotion(
  progress: number,
  keyframes: readonly PhotoHopKeyframe[],
) {
  const last = keyframes[keyframes.length - 1];
  if (!last) return { x: 0, y: 0, frameIndex: 0 };
  const nextIndex = keyframes.findIndex((frame) => frame.at > progress);
  if (nextIndex < 0) return last;
  const from = keyframes[Math.max(0, nextIndex - 1)];
  const to = keyframes[nextIndex];
  const span = to.at - from.at;
  const amount = span > 0 ? Math.max(0, Math.min(1, (progress - from.at) / span)) : 0;
  const verticalAmount = from.verticalEase === "ease-in"
    ? amount * amount
    : from.verticalEase === "ease-out"
      ? 1 - (1 - amount) * (1 - amount)
      : amount;
  return {
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * verticalAmount,
    frameIndex: from.frameIndex,
  };
}

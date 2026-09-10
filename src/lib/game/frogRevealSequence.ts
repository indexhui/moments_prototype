export const FROG_REVEAL_ART_ROOT = "/images/takepicture/拍青蛙";
export const FROG_REVEAL_BACKGROUND_SRC = `${FROG_REVEAL_ART_ROOT}/背景.jpg`;
export const FROG_REVEAL_FRAME_SOURCES = Array.from(
  { length: 9 }, (_, index) => `${FROG_REVEAL_ART_ROOT}/青蛙跳出來/${index + 1}.png`,
);
export const FROG_REVEAL_FRAME_DURATION_MS = [280, 280, 280, 280, 280, 1000, 360, 320, 220] as const;

export function sampleFrogRevealFrame(elapsedMs: number) {
  if (elapsedMs < 0) return -1;
  let boundary = 0;
  for (const [index, duration] of FROG_REVEAL_FRAME_DURATION_MS.entries()) {
    boundary += duration;
    if (elapsedMs < boundary) return index;
  }
  return FROG_REVEAL_FRAME_SOURCES.length - 1;
}

import type { PhotoHopKeyframe } from "@/lib/game/photoHopMotion";

// The supplied video holds most drawn poses for about 100–170 ms. Keep the
// landing poses at 130 ms, and allow more time for the added continuous travel
// across the game screen: 920 ms in, 1020 ms settled, then 860 ms out.
// Ease the ascent to a single apex, then accelerate down; plant the feet
// during the takeoff pose instead of sliding that pose through the air.
export const CONVENIENCE_STORE_HOP_DURATION_MS = 2800;
export const CONVENIENCE_STORE_HOP_KEYFRAMES = ([
  { atMs: 0, x: 0.78, y: 0, frameIndex: 0, verticalEase: "ease-out" },
  { atMs: 460, x: 0.39, y: -0.15, frameIndex: 0, verticalEase: "ease-in" },
  { atMs: 920, x: 0, y: 0, frameIndex: 1 },
  { atMs: 1050, x: 0, y: 0, frameIndex: 2 },
  { atMs: 1180, x: 0, y: 0, frameIndex: 3 },
  { atMs: 1940, x: 0, y: 0, frameIndex: 4 },
  { atMs: 2070, x: 0, y: 0, frameIndex: 5, verticalEase: "ease-out" },
  { atMs: 2435, x: -0.55, y: -0.14, frameIndex: 5, verticalEase: "ease-in" },
  { atMs: 2800, x: -1.10, y: 0, frameIndex: 5 },
] satisfies (Omit<PhotoHopKeyframe, "at"> & { atMs: number })[]).map(({ atMs, ...pose }) => ({
  ...pose,
  at: atMs / CONVENIENCE_STORE_HOP_DURATION_MS,
})) satisfies readonly PhotoHopKeyframe[];

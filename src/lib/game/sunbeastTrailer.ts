import { CONVENIENCE_STORE_HOP_DURATION_MS, CONVENIENCE_STORE_HOP_KEYFRAMES } from "@/lib/game/convenienceStorePhotoMotion";
import { samplePhotoHopMotion } from "@/lib/game/photoHopMotion";

export const SUNBEAST_TRAILER_ART = {
  dogBackground: "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg",
  dogFrames: [
    "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_1.png",
    "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_2.png",
  ],
  frogBackground: "/images/store/便利商店_無店員.jpg",
  frogFrames: [1, 2, 3, 4, 5, 6].map((frame) => `/images/store/青蛙${frame}.png`),
  ticketFrames: [1, 2, 3, 4, 5].map((frame) => `/images/store/抽獎卷${frame}.png`),
  star: "/images/exhibition/ending/star.svg",
} as const;

export type SunbeastTrailerTiming = { wait: number; focus: number; gap: number };
export const DEFAULT_SUNBEAST_TRAILER_TIMING: SunbeastTrailerTiming = { wait: 0.1, focus: 0.6, gap: 1.5 };
export const TRAILER_FLASH_SECONDS = 0.52;
export const TRAILER_PANEL_REVEAL_SECONDS = 0.35;
export const TRAILER_FROG_HOP_SECONDS = CONVENIENCE_STORE_HOP_DURATION_MS / 1000;
export type SunbeastTrailerSide = "dog" | "frog";

// Position within the visible half-screen, plus its crop of the source artwork.
export const SUNBEAST_TRAILER_FRAMING = {
  dog: { x: 0.53, y: 0.46, width: 0.64, artAnchor: 0.8 },
  frog: { x: 0.55, y: 0.53, width: 0.56, artAnchor: 0.62 },
} as const;

export function getSunbeastTrailerPhotoCrop(side: SunbeastTrailerSide) {
  const frame = SUNBEAST_TRAILER_FRAMING[side];
  const sourceAspect = 786 / 1704;
  const visibleHeight = 9 / 8 * sourceAspect;
  const height = frame.width * sourceAspect;
  return {
    x: frame.x - frame.width / 2,
    y: (1 - visibleHeight) * frame.artAnchor + frame.y * visibleHeight - height / 2,
    width: frame.width,
    height,
  };
}

export function sampleTrailerFrogHop(time: number, shotAt: number) {
  // Reuse the game's six poses and right-to-left jump arcs.
  // Anchor each take to a grounded pose at the shutter, including custom timings.
  const elapsed = Math.min(time, shotAt) - shotAt + 1.4;
  const cycleTime = ((elapsed % TRAILER_FROG_HOP_SECONDS) + TRAILER_FROG_HOP_SECONDS) % TRAILER_FROG_HOP_SECONDS;
  const pose = samplePhotoHopMotion(cycleTime / TRAILER_FROG_HOP_SECONDS, CONVENIENCE_STORE_HOP_KEYFRAMES);
  return { x: pose.x, y: pose.y, frameIndex: pose.frameIndex };
}

export function getSunbeastTrailerTimeline(timing: SunbeastTrailerTiming) {
  const dogReveal = 0.1;
  const frogReveal = dogReveal + TRAILER_PANEL_REVEAL_SECONDS + 0.1;
  const revealComplete = frogReveal + TRAILER_PANEL_REVEAL_SECONDS;
  const dogFocus = revealComplete + timing.wait;
  const dogShot = dogFocus + timing.focus;
  const frogFocus = dogShot + timing.gap;
  const frogShot = frogFocus + timing.focus;
  // Leave enough time for the last Polaroid and all three stars to finish.
  return { dogReveal, frogReveal, revealComplete, dogFocus, dogShot, frogFocus, frogShot, duration: frogShot + 1.8 };
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => 1 - (1 - clamp(value)) ** 3;

// Same flash envelope as EventPhotoCaptureLayer, sampled rather than CSS-driven
// so scrubbing, pausing, and replaying always produce the same frame.
function flashOpacity(seconds: number) {
  const t = seconds / TRAILER_FLASH_SECONDS;
  if (t <= 0 || t >= 1) return 0;
  const keys = [[0, 0], [0.07, 1], [0.22, 0.98], [0.52, 0.42], [1, 0]];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [start, from] = keys[i - 1];
      const [end, to] = keys[i];
      return from + (to - from) * (t - start) / (end - start);
    }
  }
  return 0;
}

export function sampleSunbeastTrailer(time: number, timing: SunbeastTrailerTiming, side: SunbeastTrailerSide) {
  const timeline = getSunbeastTrailerTimeline(timing);
  const focusAt = side === "dog" ? timeline.dogFocus : timeline.frogFocus;
  const shotAt = side === "dog" ? timeline.dogShot : timeline.frogShot;
  const appearanceAt = side === "dog" ? timeline.dogReveal : timeline.frogReveal;
  const afterShot = time - shotAt;
  const subjectTime = Math.min(time, shotAt);
  const frogPose = sampleTrailerFrogHop(subjectTime, timeline.frogShot);
  const polaroidTime = afterShot - 0.32;
  const polaroidProgress = ease(polaroidTime / 0.46);
  return {
    appearance: ease((time - appearanceAt) / TRAILER_PANEL_REVEAL_SECONDS),
    focusProgress: ease((time - focusAt) / timing.focus),
    viewfinderOpacity: clamp((time - focusAt) / 0.22) * (1 - clamp((afterShot - 0.22) / 0.32)),
    flashOpacity: flashOpacity(afterShot),
    captured: afterShot >= 0,
    subjectTime,
    frame: side === "dog" ? Math.floor(subjectTime / 0.48) % 2 : frogPose.frameIndex,
    frogPose,
    ticket: {
      x: frogPose.x + Math.cos(subjectTime / 5.2 * Math.PI * 2) * 0.085,
      y: frogPose.y + Math.sin(subjectTime / 5.2 * Math.PI * 2) * 0.028,
      frame: Math.floor(subjectTime / 0.42) % SUNBEAST_TRAILER_ART.ticketFrames.length,
    },
    polaroidProgress,
    photoDevelop: ease(polaroidTime / 0.7),
    lightSweep: clamp((polaroidTime - 0.2) / 0.72),
    stars: [0, 1, 2].map((index) => ease((polaroidTime - 0.5 - index * 0.16) / 0.28)),
  };
}

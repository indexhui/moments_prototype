import type { ExhibitionLocale } from "./exhibitionI18n";
import { TRAILER_COPY } from "./trailerI18n";
import { sampleTrailerTyping } from "./trailerTyping";

const ROOT = "/images/428出圖";
const PICKUP_ROOT = `${ROOT}/20260822/發光小白`;

export const BAI_DIARY_TRAILER_ART = {
  room: `${ROOT}/追加作畫/發光小白拆解/背景.png`,
  glow: `${ROOT}/追加作畫/發光小白拆解/發光背景.png`,
  bai: `${ROOT}/追加作畫/發光小白拆解/漂浮小白.png`,
  portraits: [`${ROOT}/立繪/小麥/4_無奈困擾.png`, `${ROOT}/立繪/小麥/29_慌亂2.png`],
  backgrounds: [1, 2, 3, 4].map((index) => `${PICKUP_ROOT}/發光小白_展覽${index}.png`),
  diary: [1, 2, 3, 4, 5].map((index) => `${PICKUP_ROOT}/拿起日記${index}.png`),
  continueArrow: "/images/recording/metro/continue.svg",
} as const;

export const DEFAULT_BAI_DIARY_DURATION = 5.5;
export const BAI_DIARY_BEATS = { discover: 0.18, call: 1.45, clear: 3.05, pickup: 3.25, glow: 3.61 } as const;
// Mainline scene-47 / exhibition EX-FB-20, then EX-FB-21.
export const BAI_DIARY_LINES = TRAILER_COPY.bai.map(line => line.zh);

// Same frame rhythm as ExhibitionBaiDiaryPickupSequence; the final light holds at Figma's frame 2.
export const BAI_DIARY_PICKUP_FRAMES = [
  { at: 0, frame: 0 }, { at: 0.16, frame: 1 }, { at: 0.32, frame: 0 },
  { at: 0.48, frame: 1 }, { at: 0.65, frame: 2 }, { at: 0.83, frame: 3 }, { at: 1.01, frame: 4 },
] as const;
const LIGHT_FRAMES = [
  { at: 0, frame: 0 }, { at: 0.36, frame: 1 }, { at: 0.49, frame: 2 },
  { at: 0.62, frame: 3 }, { at: 1.11, frame: 2 }, { at: 1.24, frame: 1 },
] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const pulse = (value: number) => value > 0 && value < 1 ? Math.sin(value * Math.PI) : 0;

/** Pure recording-clock sampling keeps all poses, frame changes, and light fades seekable. */
export function sampleBaiDiaryTrailer(time: number, duration = DEFAULT_BAI_DIARY_DURATION, locale: ExhibitionLocale = "zh") {
  const t = Math.max(0, Math.min(duration, time)) * DEFAULT_BAI_DIARY_DURATION / duration;
  const beats = BAI_DIARY_BEATS;
  const lineIndex = t < beats.discover || t >= beats.clear + 0.16 ? null : t < beats.call ? 0 : 1;
  const lineStart = lineIndex === 0 ? beats.discover : beats.call;
  const dialogue = lineIndex === null ? null : TRAILER_COPY.bai[lineIndex][locale];
  const typing = sampleTrailerTyping(dialogue, t - lineStart, (lineIndex === 0 ? beats.call : beats.clear) - lineStart);
  const uiOpacity = easeOut((t - beats.discover) / 0.18) * (1 - easeOut((t - beats.clear) / 0.16));
  const pickupTime = Math.max(0, t - beats.pickup);
  const diaryEntry = easeOut((t - beats.pickup) / 0.24);
  const diaryFrame = BAI_DIARY_PICKUP_FRAMES.findLast((entry) => pickupTime >= entry.at)?.frame ?? 0;
  const lightIndex = Math.max(0, LIGHT_FRAMES.findLastIndex((entry) => pickupTime >= entry.at));
  const light = LIGHT_FRAMES[lightIndex];
  const settle = 1 - easeOut((t - (beats.clear - 0.2)) / 0.4);
  const floatWave = (1 - Math.cos(t / 3.6 * Math.PI * 2)) / 2 * settle;
  const callMotion = clamp((t - beats.call) / 0.52);

  return {
    phase: t < beats.discover ? "opening" : t < beats.call ? "discover" : t < beats.clear ? "call"
      : t < beats.pickup ? "clear" : pickupTime < 1.37 ? "pickup" : "hold",
    lineIndex,
    dialogue,
    ...typing,
    uiOpacity,
    lineOpacity: easeOut((t - lineStart) / 0.12),
    mai: {
      x: -26 * (1 - easeOut((t - beats.discover) / 0.18)),
      y: -10 * pulse((t - beats.discover) / 0.36),
      rotation: lineIndex === 1 ? Math.sin(callMotion * Math.PI * 4) * 1.2 * (1 - callMotion) : 0,
    },
    bai: { y: -8 * floatWave, scale: 1 + 0.02 * floatWave, glowOpacity: 0.88 + 0.12 * floatWave },
    // Always composite over an opaque prior frame so the room never flashes through a dissolve.
    light: {
      opacity: easeOut((t - beats.pickup) / 0.2),
      from: LIGHT_FRAMES[Math.max(0, lightIndex - 1)].frame,
      to: light.frame,
      mix: lightIndex === 0 ? 1 : clamp((pickupTime - light.at) / 0.13),
    },
    diary: { visible: t >= beats.pickup, frame: diaryFrame, opacity: diaryEntry, y: 60 * (1 - diaryEntry), scale: 0.96 + 0.04 * diaryEntry },
  };
}

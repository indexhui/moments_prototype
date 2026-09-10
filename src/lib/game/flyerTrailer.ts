import { FLYER_FEEDBACK_DURATION_MS, WIND_STEPS, getFlyerPosition } from "./flyerWindMotion";

const ROOT = "/images/428出圖/20260822/追傳單";
export const FLYER_TRAILER_ART = {
  chase: `${ROOT}/追傳單.png`,
  street: "/images/428出圖/背景/公司附近街道_白天.jpg",
  pointer: "/images/pointer_up.png",
} as const;
// Alpha bounds of the original full-stage document art. Crop with CSS, keeping the source bytes intact.
export const FLYER_TRANSITION_PAPERS = [
  { src: `${ROOT}/文件/右.png`, left: 206, top: 975, width: 99, height: 122 },
  { src: `${ROOT}/文件/上.png`, left: 204, top: 996, width: 153, height: 71 },
  { src: `${ROOT}/文件/左.png`, left: 195, top: 963, width: 128, height: 122 },
  { src: `${ROOT}/文件/下.png`, left: 195, top: 986, width: 134, height: 74 },
] as const;
export const DEFAULT_FLYER_TRAILER_DURATION = 9;
export const FLYER_TRAILER_BEATS = { paperStart: 0.2, paperEnd: 2.12, sceneChange: 0.98, sceneReady: 1.24 } as const;
export const FLYER_TRAILER_ATTEMPTS = [
  { start: 1.85, tap: 2.35, step: WIND_STEPS[0], result: "missed" },
  { start: 3.85, tap: 4.22, step: WIND_STEPS[1], result: "missed" },
  { start: 5.7, tap: 5.7 + WIND_STEPS[2].durationMs / 1000 * WIND_STEPS[2].targetProgress, step: WIND_STEPS[2], result: "bonus" },
] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// Fixed variation keeps the loose paper group identical when replaying or scrubbing.
const paperVariation = (index: number, seed: number) => {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const PAPER_FLIGHTS = Array.from({ length: 36 }, (_, index) => ({
  delay: paperVariation(index, 1) * 0.36,
  duration: 1.38 + paperVariation(index, 2) * 0.18,
  width: 72 + paperVariation(index, 3) * 60,
  startY: 190 + paperVariation(index, 4) * 690,
  drift: -110 + paperVariation(index, 5) * 210,
  sway: 20 + paperVariation(index, 6) * 24,
  phase: paperVariation(index, 7) * Math.PI * 2,
  turn: -35 + paperVariation(index, 8) * 70,
}));

export function sampleFlyerTrailer(time: number, duration = DEFAULT_FLYER_TRAILER_DURATION) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_FLYER_TRAILER_DURATION;
  const rawTime = clamp((Number.isFinite(time) ? time : 0) / safeDuration) * DEFAULT_FLYER_TRAILER_DURATION;
  const lastTap = FLYER_TRAILER_ATTEMPTS[2].tap;
  const holdAt = lastTap + 0.9;
  const t = Math.min(rawTime, holdAt);
  const mix = ease((t - FLYER_TRAILER_BEATS.sceneChange) / (FLYER_TRAILER_BEATS.sceneReady - FLYER_TRAILER_BEATS.sceneChange));
  const attemptIndex = FLYER_TRAILER_ATTEMPTS.findLastIndex((attempt) => t >= attempt.start);
  const attempt = FLYER_TRAILER_ATTEMPTS[Math.max(0, attemptIndex)];
  const localTime = Math.max(0, t - attempt.start);
  const age = Math.max(0, t - attempt.tap);
  const tapped = t >= attempt.tap;
  const inFeedback = tapped && age < FLYER_FEEDBACK_DURATION_MS / 1000;
  const result = tapped ? attempt.result : null;
  const tapProgress = (attempt.tap - attempt.start) * 1000 / attempt.step.durationMs;
  const progress = !tapped ? clamp(localTime * 1000 / attempt.step.durationMs)
    : result === "bonus" ? attempt.step.targetProgress : lerp(tapProgress, 1, easeOut(age / 0.34));
  const catchPosition = getFlyerPosition(attempt.step.track, attempt.step.targetProgress);
  const handEntry = ease((t - attempt.tap + 0.26) / 0.16);
  const handExit = 1 - ease(age / 0.26);
  const press = ease((t - attempt.tap + 0.12) / 0.12);
  const scene = {
    clock: t,
    attempt: attemptIndex + 1,
    step: attempt.step,
    progress,
    localTime,
    feedbackAge: age,
    result,
    inFeedback,
    showLane: attemptIndex >= 0 && (!tapped || inFeedback),
    documentVisible: attemptIndex >= 0 && (!tapped || age < (result === "bonus" ? 0.48 : 0.36)),
    documentOpacity: result === "missed" ? 1 - ease((age - 0.2) / 0.16) : 1,
    ready: result === "bonus" || (!tapped && Math.abs(progress - attempt.step.targetProgress) <= attempt.step.hitWindow),
    hearts: 3 - FLYER_TRAILER_ATTEMPTS.filter((beat) => beat.result === "missed" && t >= beat.tap).length,
    mood: inFeedback ? result === "missed" ? "nervous" as const : "happy" as const : "normal" as const,
    hand: {
      xPct: catchPosition.xPct + 8,
      yPct: catchPosition.yPct + 3 + (1 - press) * 1.8,
      opacity: attemptIndex < 0 ? 0 : handEntry * handExit,
      scale: 1 - 0.12 * press * (1 - ease(age / 0.16)),
    },
  };
  const papers = PAPER_FLIGHTS.map((flight, index) => {
    const start = FLYER_TRAILER_BEATS.paperStart + flight.delay;
    const p = clamp((t - start) / flight.duration);
    const flutter = flight.phase + p * Math.PI * 2;
    return {
      id: index, art: index % 4,
      visible: t > start && t < start + flight.duration,
      x: lerp(-160, 2080, p + Math.sin(p * Math.PI) * 0.035),
      y: flight.startY + flight.drift * p - Math.sin(p * Math.PI) * 45
        + (Math.sin(flutter) - Math.sin(flight.phase)) * flight.sway,
      width: flight.width,
      rotation: flight.turn + Math.sin(flutter) * 18 + (index % 2 ? 20 : -20) * p,
      scaleX: 0.84 + Math.cos(flutter) * 0.16,
      opacity: ease(p / 0.06) * (1 - ease((p - 0.94) / 0.06)),
    };
  });
  return {
    phase: rawTime >= holdAt ? "hold" : t < FLYER_TRAILER_BEATS.paperStart ? "diary"
      : t < FLYER_TRAILER_BEATS.paperEnd ? "transition" : inFeedback ? result === "missed" ? "miss" : "great" : "playing",
    diaryOpacity: 1 - mix, gameOpacity: mix, papers, scene,
  };
}

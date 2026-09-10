import type { ExhibitionLocale } from "./exhibitionI18n";
import { TRAILER_COPY } from "./trailerI18n";
import { sampleTrailerTyping } from "./trailerTyping";

const ROOT = "/images/428出圖";

// Reuse original artwork; portraits were pixel-checked against Figma 13009:17742.
export const METRO_COMIC_TRAILER_ART = {
  background: `${ROOT}/背景/捷運.png`,
  rightBackground: `${ROOT}/追加作畫/黃金獵犬/黃金獵犬_背景.jpg`,
  comics: [
    `${ROOT}/日常事件漫畫格/捷運_滿員電車.png`,
    `${ROOT}/日常事件漫畫格/捷運公車_背包晃過來.png`,
    `${ROOT}/日常事件漫畫格/捷運_隔壁開腿.png`,
    `${ROOT}/漫畫格/第一章/蠕動的袋子.png`,
    `${ROOT}/漫畫格/第一章/探頭的小貝狗１.png`,
    `${ROOT}/漫畫格/第一章/探頭的小貝狗２.png`,
  ],
  portraits: [
    `${ROOT}/立繪/小麥/37_思考1.png`,
    `${ROOT}/立繪/小麥/11_痛！.png`,
    `${ROOT}/立繪/小麥/4_無奈困擾.png`,
    `${ROOT}/立繪/小麥/26_驚嚇.png`,
  ],
  continueArrow: "/images/recording/metro/continue.svg",
  choicePointer: "/images/pointer_up.png",
} as const;

export const DEFAULT_METRO_COMIC_DURATION = 5.5;
export const METRO_COMIC_BEATS = {
  panStart: 0.1,
  panEnd: 1.4,
  crowded: 0.55,
  backpack: 1.55,
  pain: 1.95,
  cramped: 2.6,
  choice: 3.45,
  choiceMoveStart: 3.77,
  choiceMoveEnd: 4.04,
  bagEnter: 4.3,
  bagOpen: 4.62,
  beigoReveal: 4.94,
} as const;

export const METRO_COMIC_LABELS = ["滿員電車", "背包晃過來", "隔壁開腿", "蠕動的袋子", "袋子打開", "小貝狗探頭"] as const;
export const METRO_MAI_EXPRESSIONS = ["思考", "吃痛", "無奈困擾", "驚訝"] as const;
const beats = METRO_COMIC_BEATS;
const COMIC_ENTRIES = [beats.crowded, beats.backpack, beats.cramped, beats.bagEnter, beats.bagOpen, beats.beigoReveal];
const PHASES = [
  { id: "opening", start: 0, comic: null, portrait: null, dialogue: null, choices: false },
  { id: "crowded", start: beats.crowded, comic: 0, portrait: 0, dialogue: TRAILER_COPY.metro.crowded, choices: false },
  { id: "backpack", start: beats.backpack, comic: 1, portrait: null, dialogue: TRAILER_COPY.metro.backpack, choices: false },
  { id: "pain", start: beats.pain, comic: 1, portrait: 1, dialogue: TRAILER_COPY.metro.pain, choices: false },
  { id: "cramped", start: beats.cramped, comic: 2, portrait: 2, dialogue: TRAILER_COPY.metro.cramped, choices: false },
  { id: "choice", start: beats.choice, comic: 2, portrait: 2, dialogue: null, choices: true },
  { id: "bag", start: beats.bagEnter, comic: 3, portrait: null, dialogue: null, choices: false },
  { id: "bag-open", start: beats.bagOpen, comic: 4, portrait: null, dialogue: null, choices: false },
  { id: "beigo", start: beats.beigoReveal, comic: 5, portrait: 3, dialogue: TRAILER_COPY.metro.beigo, choices: false },
] as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;
const easeInOut = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
};
const pulse = (value: number) => value > 0 && value < 1 ? Math.sin(value * Math.PI) : 0;

export function getMetroComicSoundCues(duration = DEFAULT_METRO_COMIC_DURATION) {
  return COMIC_ENTRIES.map((time) => time * duration / DEFAULT_METRO_COMIC_DURATION);
}

/** Poses, dialogue, and the simulated choice follow one clock, including reverse scrubbing. */
export function sampleMetroComicTrailer(time: number, duration = DEFAULT_METRO_COMIC_DURATION, locale: ExhibitionLocale = "zh") {
  const t = Math.max(0, Math.min(duration, time)) * DEFAULT_METRO_COMIC_DURATION / duration;
  const phaseIndex = Math.max(0, PHASES.findLastIndex((entry) => t >= entry.start));
  const phase = PHASES[phaseIndex];
  const dialogue = phase.dialogue?.[locale] ?? null;
  const phaseDuration = (PHASES[phaseIndex + 1]?.start ?? DEFAULT_METRO_COMIC_DURATION) - phase.start;
  const typing = sampleTrailerTyping(dialogue, t - phase.start, phaseDuration);
  const pan = easeInOut((t - beats.panStart) / (beats.panEnd - beats.panStart));
  const bagSequence = phase.comic !== null && phase.comic >= 3;
  // The three bag drawings replace one another without re-entering or changing crop.
  const comicStart = bagSequence ? beats.bagEnter : COMIC_ENTRIES[phase.comic ?? 0];
  const comicEnter = phase.comic === null ? 0 : easeOut((t - comicStart) / 0.18);
  const beigo = phase.comic === 5;
  const reactionStart = phase.choices ? beats.cramped : phase.start;
  const elapsed = t - reactionStart;
  const painProgress = clamp(elapsed / 0.38);
  const swayProgress = clamp(elapsed / 0.52);
  const choiceEnter = phase.choices ? easeOut((t - beats.choice) / 0.16) : 0;
  const choiceMove = easeInOut((t - beats.choiceMoveStart) / (beats.choiceMoveEnd - beats.choiceMoveStart));
  const bagWiggle = clamp((t - beats.bagEnter) / (beats.bagOpen - beats.bagEnter));

  return {
    phase: phase.id,
    // Move only the left artwork upward, so the camera travels down to the seats.
    backgroundY: -806 * pan,
    rightBackgroundY: -725,
    comic: {
      index: phase.comic,
      opacity: comicEnter,
      // Figma coordinates within the left 1055 px of the 1920 × 1080 stage.
      x: bagSequence ? 516 : 501.5,
      y: bagSequence ? 516 : 562,
      width: bagSequence ? 728 : 801,
      offsetY: 28 * (1 - comicEnter),
      rotation: phase.id === "bag" ? Math.sin(bagWiggle * Math.PI * 4) * pulse(bagWiggle) * 1.4 : 0,
      scale: 0.94 + 0.06 * comicEnter + (beigo ? 0.025 * pulse(elapsed / 0.3) : 0),
    },
    mai: {
      index: phase.portrait,
      opacity: phase.portrait === null ? 0 : easeOut(elapsed / 0.1),
      width: phase.portrait === 0 || phase.portrait === 1 ? 454 : 500,
      bottom: 400 + 29 * choiceEnter,
      flip: phase.portrait !== 2,
      x: phase.portrait === 1 ? Math.sin(painProgress * Math.PI * 6) * 15 * (1 - painProgress) : 0,
      y: phase.portrait === 0 ? 9 * pulse(elapsed / 0.36) : phase.portrait === 3 ? -22 * pulse(elapsed / 0.42) : 0,
      rotation: phase.portrait === 2 ? Math.sin(swayProgress * Math.PI * 4) * 1.5 * (1 - swayProgress) : 0,
      scale: phase.portrait === 3 ? 1 + 0.055 * pulse(elapsed / 0.3) : 1,
    },
    dialogue,
    ...typing,
    dialogueOpacity: easeOut((t - phase.start) / 0.12),
    choices: phase.choices,
    choiceOpacity: choiceEnter,
    choiceFocusY: 151 * choiceMove,
    consideredChoice: choiceMove < 0.5 ? 0 : 1,
  };
}

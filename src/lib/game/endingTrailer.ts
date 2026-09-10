import { FROG_REVEAL_BACKGROUND_SRC, FROG_REVEAL_FRAME_DURATION_MS, FROG_REVEAL_FRAME_SOURCES, sampleFrogRevealFrame } from "./frogRevealSequence";

const ROOT = "/images/recording/ending";
export const DEFAULT_ENDING_TRAILER_DURATION = 9;
// Figma 13031:2231 export bounds include the wordmark's white outline.
export const ENDING_ENGLISH_LOGO_BOUNDS = { x: 127, y: 37, width: 648, height: 274 } as const;
export const ENDING_TRAILER_GREEN = "#B4D78F";
export const ENDING_TRAILER_BEATS = {
  frogStart: 0.22,
  greenStart: 3.3,
  greenCovered: 3.52,
  titleScene: 3.6,
  greenExit: 3.83,
  greenGone: 4.23,
  titleReady: 5.25,
} as const;
export const ENDING_FROG_JUMP_CUE = ENDING_TRAILER_BEATS.frogStart
  + FROG_REVEAL_FRAME_DURATION_MS.slice(0, 6).reduce((sum, duration) => sum + duration, 0) / 1000;
export const ENDING_BEIGO_FRAMES = [
  "/images/428出圖/20260822/追傳單/小貝狗/開心/1.png",
  "/images/428出圖/20260822/追傳單/小貝狗/開心/2.png",
] as const;

type LayerEntry = { at: number; duration: number; x?: number; y?: number; scale?: number };
type LayerFloat = { x: number; y: number; rotation: number; period: number; phase: number };
type LayerImage = { x: number; y: number; width: number; height: number; rotation?: number; flipY?: boolean };
export type EndingTitleLayer = {
  id: string; src: string; alt: string;
  x: number; y: number; width: number; height: number;
  clip?: boolean; image?: LayerImage;
  entry: LayerEntry; float?: LayerFloat;
};

// Figma 13010:17982: preserve its clipped artwork and transformed image bounds.
export const ENDING_TITLE_LAYERS: readonly EndingTitleLayer[] = [
  { id: "street", src: `${ROOT}/street.png`, alt: "結尾街道", x: -57, y: 0, width: 2035, height: 1150,
    entry: { at: 3.6, duration: .35 } },
  { id: "top-paper", src: `${ROOT}/paper-blue-dark.png`, alt: "", x: -293, y: -1458, width: 2730.065, height: 1738.281,
    image: { x: (2730.065 - 2581) / 2, y: (1738.281 - 1453) / 2, width: 2581, height: 1453, rotation: -6.56 },
    entry: { at: 3.6, duration: .6, y: -100 } },
  { id: "bottom-paper", src: `${ROOT}/paper-blue-light.png`, alt: "", x: -93, y: 800, width: 2646.418, height: 1130.796,
    image: { x: (2646.418 - 2568.451) / 2, y: (1130.796 - 856.15) / 2, width: 2568.451, height: 856.15, rotation: -6.25 },
    entry: { at: 3.68, duration: .6, y: 100 } },
  { id: "golden", src: "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_1.png", alt: "街道上的黃金獵犬", x: 1072, y: 540, width: 158, height: 344,
    entry: { at: 3.86, duration: .5, y: 12 }, float: { x: 0, y: 1.5, rotation: 0, period: 2.4, phase: .6 } },
  { id: "friend", src: `${ROOT}/friend.png`, alt: "右下角的藍髮角色", x: 953, y: 396, width: 967, height: 684, clip: true,
    image: { x: 0, y: 0, width: 2260, height: 684 },
    entry: { at: 4.28, duration: .65, y: 70 }, float: { x: 0, y: 6, rotation: 0, period: 4, phase: 1.1 } },
  { id: "promoter", src: `${ROOT}/promoter.png`, alt: "追傳單的工讀生", x: 248, y: 510, width: 284, height: 404, clip: true,
    image: { x: -187.0708, y: -45.8136, width: 1697.9792, height: 513.6456 },
    entry: { at: 3.86, duration: .55, x: -22, y: 10 } },
  { id: "kid", src: `${ROOT}/kid.png`, alt: "街道上的孩子", x: 149, y: 575, width: 247, height: 382, clip: true,
    image: { x: -12.1524, y: -59.5156, width: 1525.2003, height: 462.4874 },
    entry: { at: 3.98, duration: .55, x: -18, y: 10 } },
  { id: "mai", src: "/images/428出圖/20260822/追傳單/great_miss/great/人.png", alt: "小麥接住傳單", x: 29, y: 53, width: 1600.014, height: 1370.975,
    image: { x: (1600.014 - 1511) / 2, y: (1370.975 - 1263) / 2, width: 1511, height: 1263, rotation: 4.23 },
    entry: { at: 3.96, duration: .68, x: -28, y: 95, scale: .97 }, float: { x: 3, y: 7, rotation: .25, period: 3.6, phase: .4 } },
  { id: "beigo", src: ENDING_BEIGO_FRAMES[0], alt: "小貝狗", x: 29, y: 805, width: 822.164, height: 1298.442,
    image: { x: (822.164 - 554.25) / 2, y: (1298.442 - 1201.581) / 2, width: 554.25, height: 1201.581, rotation: 166.35, flipY: true },
    entry: { at: 4.38, duration: .64, y: 75, scale: .95 }, float: { x: 3, y: 11, rotation: .3, period: 2.7, phase: 2 } },
  { id: "frog", src: FROG_REVEAL_FRAME_SOURCES[7], alt: "探入畫面的青蛙", x: 1436, y: 0, width: 511, height: 1107,
    entry: { at: 4.14, duration: .68, x: 88, y: -75, scale: .97 }, float: { x: 5, y: 13, rotation: .55, period: 3, phase: .9 } },
  { id: "logo", src: "/images/logo/logo_svg.svg", alt: "走走小日", x: 137, y: 59, width: 732.757, height: 221,
    entry: { at: 4.58, duration: .67, y: -24, scale: .97 } },
];
export const ENDING_TRAILER_ASSETS = [...new Set([
  FROG_REVEAL_BACKGROUND_SRC, ...FROG_REVEAL_FRAME_SOURCES, ...ENDING_BEIGO_FRAMES, ...ENDING_TITLE_LAYERS.map(layer => layer.src),
])];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;

export function sampleEndingTrailer(time: number, duration = DEFAULT_ENDING_TRAILER_DURATION) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_ENDING_TRAILER_DURATION;
  const t = clamp((Number.isFinite(time) ? time : 0) / safeDuration) * DEFAULT_ENDING_TRAILER_DURATION;
  const beats = ENDING_TRAILER_BEATS;
  const beigoEntry = ENDING_TITLE_LAYERS.find(layer => layer.id === "beigo")!.entry.at;
  const greenOpacity = smooth((t - beats.greenStart) / (beats.greenCovered - beats.greenStart))
    * (1 - smooth((t - beats.greenExit) / (beats.greenGone - beats.greenExit)));
  const layers = ENDING_TITLE_LAYERS.map(layer => {
    const age = Math.max(0, t - layer.entry.at);
    const enter = easeOut(age / layer.entry.duration);
    const floatStrength = smooth((age - layer.entry.duration) / .6);
    const wave = layer.float ? Math.sin(age * Math.PI * 2 / layer.float.period + layer.float.phase) * floatStrength : 0;
    return {
      id: layer.id,
      opacity: smooth(age / Math.min(.3, layer.entry.duration)),
      x: (layer.entry.x ?? 0) * (1 - enter) + (layer.float?.x ?? 0) * wave,
      y: (layer.entry.y ?? 0) * (1 - enter) + (layer.float?.y ?? 0) * wave,
      scale: 1 - (1 - (layer.entry.scale ?? 1)) * (1 - enter),
      rotation: (layer.float?.rotation ?? 0) * wave,
    };
  });
  return {
    phase: t < beats.frogStart ? "box" : t < beats.greenStart ? "frog"
      : t < beats.greenGone ? "green" : t < beats.titleReady ? "title" : "float",
    frogFrame: sampleFrogRevealFrame((t - beats.frogStart) * 1000),
    // Match the gameplay's 720 ms two-drawing loop on the recording clock.
    beigoFrame: Math.floor((Math.max(0, t - beigoEntry) + 1e-9) / .36) % ENDING_BEIGO_FRAMES.length,
    boxVisible: t < beats.titleScene,
    titleVisible: t >= beats.titleScene,
    greenOpacity,
    layers,
  };
}

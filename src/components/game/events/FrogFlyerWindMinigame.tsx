"use client";

import type { ComponentProps, PointerEvent as ReactPointerEvent } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Image, Text, useMediaQuery } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PiHandPointingFill } from "react-icons/pi";
import {
  playFmodGameEvent,
  prepareFmodGameMusicTrack,
  setFmodGameMusicTrack,
} from "@/lib/game/fmodWeb";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import { playGameSfx } from "@/lib/game/soundEffects";

type WindZoneId = "right" | "top" | "left" | "bottom";
type FlyerPhase = "flying" | "feedback" | "complete" | "frog-reveal";
type FlyerResult = "base" | "bonus" | "missed";
type DogMood = "normal" | "nervous" | "happy";

type TrackPoint = {
  xPct: number;
  yPct: number;
};

type WindTrack = {
  start: TrackPoint;
  end: TrackPoint;
  rotate: number;
  curvePct: number;
  curveSecondaryPct?: number;
  thicknessPct: number;
};

type WindStep = {
  id: string;
  arrow: string;
  zoneId: WindZoneId;
  durationMs: number;
  hitWindow: number;
  targetProgress: number;
  track: WindTrack;
};

type FlyerBeatConfig = Omit<WindStep, "id" | "arrow" | "hitWindow"> & {
  hitWindow?: number;
};

type FlyerPosition = TrackPoint & {
  rotate: number;
};

type FlyerFeedback = {
  id: string;
  kind: "caught" | "missed";
};

type ActiveFlyer = {
  id: string;
  step: WindStep;
  delayMs: number;
  progress: number;
  hasStarted: boolean;
  result: FlyerResult | null;
};

type FlyerResolution = {
  kind: FlyerResult;
  progress: number;
};

type TapRipple = {
  id: number;
  xPct: number;
  yPct: number;
};

type TutorialDemoResult = "success" | "miss";

const FLYER_COPY = {
  zh: {
    caughtAria: "成功獲得風帶加分",
    missedAria: "沒有撿到傳單",
    tutorialAlt: "傳單沿著風道飛行的示意",
    streetAlt: "公司附近街道",
    laneLabel: (arrow: string) => `${arrow} 風帶，傳單進入虛線時點擊加分`,
    liveStatus: (collected: number, bonus: number) =>
      `已收回 ${collected} 張傳單，風帶加分 ${bonus} 次。`,
    successTitle: "傳單收集完成！",
    failTitle: "挑戰失敗",
    failArtworkAlt: "工讀生追著被風吹散的傳單",
    stars: (count: number) => `獲得 ${count} 顆星`,
    score: (bonus: number) => `風帶加分 ${bonus}/9`,
    complete: "完成",
    retry: "再次挑戰",
    frogRevealAlt: "青蛙從裝滿傳單的箱子裡跳出來",
    tutorialInstruction: "當傳單飛進虛線，點擊！\n點擊風帶分數更高",
    start: "開始",
  },
  ja: {
    caughtAria: "チラシをキャッチしました",
    missedAria: "チラシを取り逃しました",
    tutorialAlt: "風の通り道に沿って飛ぶチラシの説明",
    streetAlt: "オフィス街",
    laneLabel: (arrow: string) => `${arrow} の風の帯。点線に入ったらタップでボーナス`,
    liveStatus: (collected: number, bonus: number) =>
      `チラシを ${collected} 枚回収、風の帯ボーナスは ${bonus} 回。`,
    successTitle: "チラシ回収完了！",
    failTitle: "チャレンジ失敗",
    failArtworkAlt: "風に飛ばされたチラシを追いかけるスタッフ",
    stars: (count: number) => `${count}つ星を獲得`,
    score: (bonus: number) => `風の帯ボーナス ${bonus}/9`,
    complete: "完了",
    retry: "もう一度挑戦",
    frogRevealAlt: "チラシが入った箱からカエルが飛び出す",
    tutorialInstruction: "チラシが点線に入ったらタップ！\n風の帯をタップするとスコアアップ",
    start: "スタート",
  },
  en: {
    caughtAria: "Flyer caught",
    missedAria: "Flyer missed",
    tutorialAlt: "A flyer moving along a wind path",
    streetAlt: "Office district",
    laneLabel: (arrow: string) => `${arrow} wind band. Tap inside the dotted target for bonus points`,
    liveStatus: (collected: number, bonus: number) =>
      `${collected} flyers collected, ${bonus} wind-band bonuses.`,
    successTitle: "Flyers Collected!",
    failTitle: "Challenge Failed",
    failArtworkAlt: "A flyer distributor chasing windblown flyers",
    stars: (count: number) => `${count} stars earned`,
    score: (bonus: number) => `Wind-band bonus ${bonus}/9`,
    complete: "Done",
    retry: "Try Again",
    frogRevealAlt: "A frog jumps out of the box of flyers",
    tutorialInstruction: "Tap when the flyer enters the dotted line!\nTap the wind band for a higher score",
    start: "Start",
  },
} as const;

const ART_ROOT = "/images/428出圖/20260822/追傳單";
const FLYER_CHASE_ART_ROOT = "/images/minigame/flyer_chase";
const TOP_BANNER_LINE_SRC = `${FLYER_CHASE_ART_ROOT}/top_banner_line.png`;
const REACTION_EDGE_LINE_SRC = `${FLYER_CHASE_ART_ROOT}/line.png`;
const TUTORIAL_WIND_SRC = `${FLYER_CHASE_ART_ROOT}/tutorial_wind_right.png`;
const TUTORIAL_WIND_OVERLAY_SRC = `${FLYER_CHASE_ART_ROOT}/tutorial_wind_overlay.svg`;
const WIND_CATCH_TARGET_TOP_SRC = `${FLYER_CHASE_ART_ROOT}/wind_catch_target_top.png`;
const FLYER_OUTLINE_DOWN_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_down.svg`;
const FLYER_OUTLINE_LEFT_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_left.svg`;
const FLYER_OUTLINE_RIGHT_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_right.svg`;
const WIND_CORRIDOR_BG_UP_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_bg_up.png`;
const WIND_CORRIDOR_DOWN_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_down.png`;
const WIND_CORRIDOR_LEFT_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_left.png`;
const WIND_CORRIDOR_RIGHT_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_right.png`;
const STREET_SCENE_SRC = "/images/428出圖/背景/公司附近街道_白天.jpg";
const FLYER_FAIL_RESULT_SRC = `${ART_ROOT}/追傳單.png`;
const FROG_REVEAL_ART_ROOT = "/images/takepicture/拍青蛙";
const FROG_REVEAL_BACKGROUND_SRC = `${FROG_REVEAL_ART_ROOT}/背景.jpg`;
const FROG_REVEAL_FRAME_SOURCES = Array.from(
  { length: 9 },
  (_, index) => `${FROG_REVEAL_ART_ROOT}/青蛙跳出來/${index + 1}.png`,
);
const FROG_PHOTO_LAYER_SOURCES = [
  `${FROG_REVEAL_ART_ROOT}/青蛙1.png`,
  `${FROG_REVEAL_ART_ROOT}/青蛙2.png`,
  `${FROG_REVEAL_ART_ROOT}/傳單1.png`,
  `${FROG_REVEAL_ART_ROOT}/傳單2.png`,
] as const;
const FROG_REVEAL_FRAME_DURATION_MS = [
  280,
  280,
  280,
  280,
  280,
  1000,
  360,
  320,
  220,
] as const;
const DEFAULT_HIT_WINDOW = 0.115;
const REQUIRED_CAUGHT_FLYERS = 9;
const DISPLAY_HEART_COUNT = 3;
const GREAT_FEEDBACK_DURATION_MS = 1250;
const MISS_FEEDBACK_DURATION_MS = 1250;
const FLYER_INTER_STEP_BLANK_MS = 130;
const DOUBLE_WIND_START_FLYER_INDEX = 7;
const DOUBLE_WIND_STAGGER_MS = 700;
const TUTORIAL_DEMO_DURATION_MS = 2000;

const WIND_ART_BY_ZONE: Record<WindZoneId, string> = {
  right: WIND_CORRIDOR_RIGHT_SRC,
  top: WIND_CORRIDOR_BG_UP_SRC,
  left: WIND_CORRIDOR_LEFT_SRC,
  bottom: WIND_CORRIDOR_DOWN_SRC,
};

const WIND_TARGET_ART_BY_ZONE: Record<
  WindZoneId,
  { src: string; aspectRatio: string; rotation: number; width: string }
> = {
  right: { src: FLYER_OUTLINE_RIGHT_SRC, aspectRatio: "124 / 152", rotation: 0, width: "15.78%" },
  top: { src: WIND_CATCH_TARGET_TOP_SRC, aspectRatio: "466 / 216", rotation: 0, width: "24%" },
  left: { src: FLYER_OUTLINE_LEFT_SRC, aspectRatio: "133 / 128", rotation: 0, width: "16.92%" },
  bottom: { src: FLYER_OUTLINE_DOWN_SRC, aspectRatio: "135 / 78", rotation: 0, width: "17.18%" },
};

const WIND_CORRIDOR_PLACEMENT_BY_ZONE: Record<
  WindZoneId,
  { left: string; top: string; width: string; height: string }
> = {
  right: { left: "0%", top: "42.84%", width: "100%", height: "35.21%" },
  top: { left: "29.14%", top: "6.92%", width: "56.76%", height: "84.51%" },
  left: { left: "0%", top: "45.19%", width: "100%", height: "30.52%" },
  bottom: { left: "0%", top: "6.92%", width: "62.47%", height: "84.51%" },
};

// Transparent corridor bounds, used only for pointer hit testing. The rendered
// artwork itself is never clipped.
const WIND_CLICK_CLIP_PATH_BY_ZONE: Record<WindZoneId, string> = {
  right: "polygon(0 0, 100% 44%, 100% 100%, 0 63%)",
  top: "polygon(3% 0, 93% 0, 98% 100%, 37% 100%)",
  left: "polygon(100% 0, 100% 52%, 0 100%, 0 33%)",
  bottom: "polygon(27% 0, 99% 0, 93% 100%, 1% 100%)",
};

const DOCUMENT_ART_BY_ZONE: Record<WindZoneId, string> = {
  right: `${ART_ROOT}/文件/右.png`,
  top: `${ART_ROOT}/文件/上.png`,
  left: `${ART_ROOT}/文件/左.png`,
  bottom: `${ART_ROOT}/文件/下.png`,
};

const DIRECTION_ART_BY_ZONE: Record<WindZoneId, readonly [string, string]> = {
  right: [`${ART_ROOT}/矢印/右1.png`, `${ART_ROOT}/矢印/右2.png`],
  top: [`${ART_ROOT}/矢印/上1.png`, `${ART_ROOT}/矢印/上2.png`],
  left: [`${ART_ROOT}/矢印/左1.png`, `${ART_ROOT}/矢印/左2.png`],
  bottom: [`${ART_ROOT}/矢印/下1.png`, `${ART_ROOT}/矢印/下2.png`],
};

const DOCUMENT_ANCHOR_BY_ZONE: Record<WindZoneId, TrackPoint> = {
  right: { xPct: 32.5, yPct: 60.8 },
  top: { xPct: 35.7, yPct: 60.5 },
  left: { xPct: 33, yPct: 60.1 },
  bottom: { xPct: 33.3, yPct: 60 },
};

const TOP_BANNER_ART_BY_MOOD: Record<DogMood, { background: string; frame1: string; frame2: string }> = {
  normal: {
    background: `${FLYER_CHASE_ART_ROOT}/top_banner_normal.png`,
    frame1: `${FLYER_CHASE_ART_ROOT}/beigo_normal_01.png`,
    frame2: `${FLYER_CHASE_ART_ROOT}/beigo_normal_02.png`,
  },
  nervous: {
    background: `${FLYER_CHASE_ART_ROOT}/top_banner_nervous.png`,
    frame1: `${FLYER_CHASE_ART_ROOT}/beigo_nervous_01.png`,
    frame2: `${FLYER_CHASE_ART_ROOT}/beigo_nervous_02.png`,
  },
  happy: {
    background: `${FLYER_CHASE_ART_ROOT}/top_banner_happy.png`,
    frame1: `${FLYER_CHASE_ART_ROOT}/beigo_happy_01.png`,
    frame2: `${FLYER_CHASE_ART_ROOT}/beigo_happy_02.png`,
  },
};

const FLYER_ART_PRELOAD_SOURCES = [
  STREET_SCENE_SRC,
  FLYER_FAIL_RESULT_SRC,
  FROG_REVEAL_BACKGROUND_SRC,
  ...FROG_REVEAL_FRAME_SOURCES,
  ...FROG_PHOTO_LAYER_SOURCES,
  ...Object.values(WIND_ART_BY_ZONE),
  ...Object.values(DOCUMENT_ART_BY_ZONE),
  ...Object.values(DIRECTION_ART_BY_ZONE).flat(),
  ...Object.values(TOP_BANNER_ART_BY_MOOD).flatMap((art) => [art.background, art.frame1, art.frame2]),
  TOP_BANNER_LINE_SRC,
  REACTION_EDGE_LINE_SRC,
  TUTORIAL_WIND_SRC,
  TUTORIAL_WIND_OVERLAY_SRC,
  WIND_CATCH_TARGET_TOP_SRC,
  FLYER_OUTLINE_DOWN_SRC,
  FLYER_OUTLINE_LEFT_SRC,
  FLYER_OUTLINE_RIGHT_SRC,
  `${ART_ROOT}/愛心/背景.png`,
  `${ART_ROOT}/愛心/正常.png`,
  `${ART_ROOT}/愛心/扣掉.png`,
  ...["great", "miss"].flatMap((resultFolder) => [
    `${ART_ROOT}/great_miss/${resultFolder}/人.png`,
    `${ART_ROOT}/great_miss/${resultFolder}/文字.png`,
    `${ART_ROOT}/great_miss/${resultFolder}/流線1.png`,
    `${ART_ROOT}/great_miss/${resultFolder}/流線2.png`,
  ]),
  `${ART_ROOT}/great_miss/great/背景.jpg`,
  `${ART_ROOT}/great_miss/miss/背景.png`,
] as const;

// Tracks follow the brightest painted wind ribbon in each finished corridor.
// The down corridor has an S-curve, so it also uses a second harmonic.
const WIND_TRACK_BY_ZONE: Record<WindZoneId, WindTrack> = {
  right: {
    start: { xPct: 3, yPct: 55.1 },
    end: { xPct: 97, yPct: 65.3 },
    rotate: 0,
    curvePct: 2,
    thicknessPct: 28,
  },
  top: {
    start: { xPct: 72.2, yPct: 91 },
    end: { xPct: 56.9, yPct: 13 },
    rotate: 0,
    curvePct: -16,
    thicknessPct: 30,
  },
  left: {
    start: { xPct: 97, yPct: 53.6 },
    end: { xPct: 3, yPct: 62.8 },
    rotate: 0,
    curvePct: -0.25,
    thicknessPct: 29,
  },
  bottom: {
    start: { xPct: 38, yPct: 13 },
    end: { xPct: 29.6, yPct: 91 },
    rotate: 0,
    curvePct: -10.5,
    curveSecondaryPct: 7.5,
    thicknessPct: 31,
  },
};

const RHYTHM_FLYER_BEATS: readonly FlyerBeatConfig[] = [
  {
    zoneId: "right",
    durationMs: 1320,
    targetProgress: 0.63,
    track: WIND_TRACK_BY_ZONE.right,
  },
  {
    zoneId: "top",
    durationMs: 1240,
    targetProgress: 0.58,
    track: WIND_TRACK_BY_ZONE.top,
  },
  {
    zoneId: "left",
    durationMs: 1160,
    targetProgress: 0.62,
    track: WIND_TRACK_BY_ZONE.left,
  },
  {
    zoneId: "bottom",
    durationMs: 1100,
    targetProgress: 0.55,
    track: WIND_TRACK_BY_ZONE.bottom,
  },
  {
    zoneId: "right",
    durationMs: 1030,
    targetProgress: 0.68,
    track: WIND_TRACK_BY_ZONE.right,
  },
  {
    zoneId: "left",
    durationMs: 960,
    hitWindow: 0.125,
    targetProgress: 0.5,
    track: WIND_TRACK_BY_ZONE.left,
  },
  {
    zoneId: "top",
    durationMs: 920,
    hitWindow: 0.13,
    targetProgress: 0.57,
    track: WIND_TRACK_BY_ZONE.top,
  },
  {
    zoneId: "bottom",
    durationMs: 880,
    hitWindow: 0.13,
    targetProgress: 0.56,
    track: WIND_TRACK_BY_ZONE.bottom,
  },
  {
    zoneId: "right",
    durationMs: 840,
    hitWindow: 0.135,
    targetProgress: 0.64,
    track: WIND_TRACK_BY_ZONE.right,
  },
] as const;

const WIND_ARROW_BY_ZONE: Record<WindZoneId, string> = {
  right: "→",
  top: "↑",
  left: "←",
  bottom: "↓",
};

const WIND_STEPS: readonly WindStep[] = RHYTHM_FLYER_BEATS.map((beat, index) => ({
  ...beat,
  id: `flyer-beat-${index + 1}-${beat.zoneId}`,
  arrow: WIND_ARROW_BY_ZONE[beat.zoneId],
  hitWindow: beat.hitWindow ?? DEFAULT_HIT_WINDOW,
}));

function createWaveFlyers(startFlyerIndex: number): ActiveFlyer[] {
  const flyerCount = startFlyerIndex >= DOUBLE_WIND_START_FLYER_INDEX ? 2 : 1;
  return Array.from({ length: flyerCount }, (_, index) => {
    const flyerIndex = startFlyerIndex + index;
    return {
      id: `flyer-${flyerIndex + 1}`,
      step: WIND_STEPS[flyerIndex % WIND_STEPS.length],
      delayMs: index * DOUBLE_WIND_STAGGER_MS,
      progress: 0,
      hasStarted: index === 0,
      result: null,
    };
  });
}

const laneAppear = keyframes`
  0% { opacity: 0; filter: saturate(0.72) brightness(1.18); }
  100% { opacity: 1; filter: saturate(1) brightness(1); }
`;

const arrowReadyPulse = keyframes`
  0%, 100% { opacity: 0.72; filter: drop-shadow(0 0 0 rgba(138, 218, 89, 0)); }
  50% { opacity: 1; filter: drop-shadow(0 0 10px rgba(138, 218, 89, 0.92)); }
`;

const windClickAreaPulse = keyframes`
  0%, 100% { opacity: 0.86; }
  50% { opacity: 1; }
`;

const dogFrameOne = keyframes`
  0%, 46% { opacity: 1; }
  50%, 96% { opacity: 0; }
  100% { opacity: 1; }
`;

const dogFrameTwo = keyframes`
  0%, 46% { opacity: 0; }
  50%, 96% { opacity: 1; }
  100% { opacity: 0; }
`;

const reactionBackgroundIn = keyframes`
  0% { opacity: 0; transform: scale(1.035); }
  4%, 94% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.01); }
`;

const greatReactionPersonIn = keyframes`
  0%, 10% { opacity: 1; transform: translate(-35%, 28%); }
  26% { opacity: 1; transform: translate(2.5%, -2.5%); }
  36%, 92% { opacity: 1; transform: translate(0, 0); }
  100% { opacity: 1; transform: translate(2%, -2%); }
`;

const missReactionPersonIn = keyframes`
  0%, 16% { opacity: 1; transform: translateX(70%); }
  64% { opacity: 1; transform: translateX(2.25%); }
  72%, 92% { opacity: 1; transform: translateX(3%); }
  100% { opacity: 1; transform: translateX(3%); }
`;

const reactionTextIn = keyframes`
  0%, 26% { opacity: 0; }
  38%, 92% { opacity: 1; }
  100% { opacity: 0; }
`;

const reactionStreamOne = keyframes`
  0%, 4% { opacity: 0; }
  6%, 14% { opacity: 1; }
  15%, 23% { opacity: 0; }
  24%, 32% { opacity: 1; }
  33%, 41% { opacity: 0; }
  42%, 50% { opacity: 1; }
  51%, 59% { opacity: 0; }
  60%, 68% { opacity: 1; }
  69%, 77% { opacity: 0; }
  78%, 86% { opacity: 1; }
  87%, 100% { opacity: 0; }
`;

const reactionStreamTwo = keyframes`
  0%, 14% { opacity: 0; }
  15%, 23% { opacity: 1; }
  24%, 32% { opacity: 0; }
  33%, 41% { opacity: 1; }
  42%, 50% { opacity: 0; }
  51%, 59% { opacity: 1; }
  60%, 68% { opacity: 0; }
  69%, 77% { opacity: 1; }
  78%, 86% { opacity: 0; }
  87%, 95% { opacity: 1; }
  96%, 100% { opacity: 0; }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(14px) scale(0.94); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const heartDamageFlash = keyframes`
  0%, 100% { opacity: 1; filter: brightness(1); }
  35% { opacity: 0.28; filter: brightness(1.7); }
  66% { opacity: 1; filter: brightness(1.12); }
`;

const tapRippleWave = keyframes`
  0% {
    opacity: 0.92;
    transform: translate(-50%, -50%) scale(0.32);
  }
  55% { opacity: 0.58; }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.5);
  }
`;

const tutorialSuccessDocumentSweep = keyframes`
  0% { transform: translate(260%, 17%) scale(0.92); opacity: 0; }
  8% { transform: translate(230%, 14%) scale(0.96); opacity: 1; }
  18% { transform: translate(160%, 9%) scale(1); opacity: 1; }
  32% { transform: translate(55%, 2%) scale(1); opacity: 1; }
  48% { transform: translate(-65%, -9%) scale(1); opacity: 1; }
  62% { transform: translate(-170%, -23%) scale(1); opacity: 1; }
  64% { transform: translate(-179%, -25%) scale(1); opacity: 1; }
  72%, 90% { transform: translate(-179%, -25%) scale(0.58); opacity: 1; }
  100% { transform: translate(-179%, -25%) scale(0.45); opacity: 0; }
`;

const tutorialMissDocumentSweep = keyframes`
  0% { transform: translate(260%, 17%) scale(0.92); opacity: 0; }
  8% { transform: translate(230%, 14%) scale(0.96); opacity: 1; }
  18% { transform: translate(160%, 9%) scale(1); opacity: 1; }
  25% { transform: translate(108%, 5%) scale(1); opacity: 1; }
  30% { transform: translate(70%, 1%) scale(1); opacity: 1; }
  38% { transform: translate(-15%, -7%) scale(1); opacity: 1; }
  48% { transform: translate(-140%, -20%) scale(1); opacity: 1; }
  60% { transform: translate(-320%, -38%) scale(1); opacity: 1; }
  74% { transform: translate(-565%, -60%) scale(1); opacity: 0.88; }
  88% { transform: translate(-845%, -82%) scale(0.96); opacity: 0.4; }
  100% { transform: translate(-1085%, -100%) scale(0.92); opacity: 0; }
`;

const tutorialSuccessPaperFlutter = keyframes`
  0% { transform: rotate(6deg) translateY(1%); }
  14% { transform: rotate(-3deg) translateY(-1.5%); }
  30% { transform: rotate(3.5deg) translateY(1%); }
  46% { transform: rotate(-2.5deg) translateY(-1%); }
  60% { transform: rotate(2deg) translateY(0.5%); }
  70%, 100% { transform: rotate(0deg) translateY(0); }
`;

const tutorialMissPaperFlutter = keyframes`
  0% { transform: rotate(6deg) translateY(1%); }
  14% { transform: rotate(-3deg) translateY(-1.5%); }
  27% { transform: rotate(3.5deg) translateY(1%); }
  42% { transform: rotate(-5deg) translateY(-1.5%); }
  58% { transform: rotate(6deg) translateY(1.5%); }
  76% { transform: rotate(-7deg) translateY(-2%); }
  100% { transform: rotate(-9deg) translateY(-2.5%); }
`;

const tutorialSuccessTargetGlow = keyframes`
  0%, 50%, 92%, 100% {
    opacity: 0.56;
    filter: brightness(0.86) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
  }
  60%, 84% {
    opacity: 1;
    filter: brightness(2.2) drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 18px rgba(225, 213, 255, 0.92));
  }
`;

const tutorialMissTargetAlert = keyframes`
  0%, 27% { opacity: 0; transform: scale(0.94); }
  30% { opacity: 1; transform: scale(1.06); }
  36%, 48% { opacity: 0.58; transform: scale(1); }
  42%, 56% { opacity: 1; transform: scale(1.08); }
  72% { opacity: 0.7; transform: scale(1.03); }
  100% { opacity: 0; transform: scale(1.1); }
`;

const tutorialSuccessRipple = keyframes`
  0%, 57% { opacity: 0; transform: translate(-50%, -50%) scale(0.28); }
  59% { opacity: 0.94; transform: translate(-50%, -50%) scale(0.35); }
  73% { opacity: 0; transform: translate(-50%, -50%) scale(2.45); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.45); }
`;

const tutorialMissRipple = keyframes`
  0%, 23% { opacity: 0; transform: translate(-50%, -50%) scale(0.28); }
  25% { opacity: 0.94; transform: translate(-50%, -50%) scale(0.35); }
  40% { opacity: 0; transform: translate(-50%, -50%) scale(2.45); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.45); }
`;

const tutorialSuccessFingerTap = keyframes`
  0%, 48% { opacity: 0; transform: translate(14px, 13px) scale(0.92); }
  52% { opacity: 1; transform: translate(8px, 7px) scale(0.96); }
  57% { opacity: 1; transform: translate(0, 0) scale(1); }
  60% { opacity: 1; transform: translate(0, 7px) scale(0.9); }
  64% { opacity: 1; transform: translate(0, 1px) scale(0.98); }
  71%, 100% { opacity: 0; transform: translate(0, -3px) scale(1); }
`;

const tutorialMissFingerTap = keyframes`
  0%, 13% { opacity: 0; transform: translate(14px, 13px) scale(0.92); }
  17% { opacity: 1; transform: translate(8px, 7px) scale(0.96); }
  22% { opacity: 1; transform: translate(0, 0) scale(1); }
  25% { opacity: 1; transform: translate(0, 7px) scale(0.9); }
  29% { opacity: 1; transform: translate(0, 1px) scale(0.98); }
  36%, 100% { opacity: 0; transform: translate(0, -3px) scale(1); }
`;

const tutorialGreatLabelIn = keyframes`
  0%, 66% { opacity: 0; transform: translateY(8px) scale(0.82); }
  72% { opacity: 1; transform: translateY(0) scale(1.08); }
  80%, 92% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-3px) scale(1); }
`;

const tutorialMissLabelIn = keyframes`
  0%, 34% { opacity: 0; transform: translateY(8px) scale(0.82); }
  41% { opacity: 1; transform: translateY(0) scale(1.08); }
  49%, 90% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-3px) scale(1); }
`;

const gameplayFlyerCatchShrink = keyframes`
  0% { opacity: 1; transform: scale(1); filter: brightness(1); }
  38% { opacity: 1; transform: scale(0.72); filter: brightness(1.45); }
  72% { opacity: 0.9; transform: scale(0.38); filter: brightness(1.8); }
  100% { opacity: 0; transform: scale(0.24); filter: brightness(2); }
`;

const gameplayInlineJudgmentIn = keyframes`
  0% { opacity: 0; transform: translateY(7px) scale(0.72); }
  18% { opacity: 1; transform: translateY(0) scale(1.12); }
  32%, 72% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.96); }
`;

const gameplayReactionReveal = keyframes`
  0%, 34% { opacity: 0; }
  35%, 100% { opacity: 1; }
`;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getFlyerStarRating(bonusCount: number) {
  if (bonusCount >= 9) return 3;
  if (bonusCount >= 5) return 2;
  return 1;
}

function isHorizontalTrack(track: WindTrack) {
  return Math.abs(track.end.xPct - track.start.xPct) >= Math.abs(track.end.yPct - track.start.yPct);
}

function getFlyerPosition(track: WindTrack, progress: number): FlyerPosition {
  const safeProgress = clampProgress(progress);
  const curveWeight = Math.sin(Math.PI * safeProgress);
  const secondaryCurveWeight = Math.sin(Math.PI * safeProgress * 2);
  const curveOffset =
    curveWeight * track.curvePct +
    secondaryCurveWeight * (track.curveSecondaryPct ?? 0);
  const flutterWeight = Math.sin(Math.PI * safeProgress * 4.2) * (1 - safeProgress * 0.3);
  const isHorizontal = isHorizontalTrack(track);

  return {
    xPct:
      track.start.xPct +
      (track.end.xPct - track.start.xPct) * safeProgress +
      (isHorizontal ? 0 : curveOffset + flutterWeight * 0.6),
    yPct:
      track.start.yPct +
      (track.end.yPct - track.start.yPct) * safeProgress +
      (isHorizontal ? curveOffset + flutterWeight * 0.6 : 0),
    rotate: track.rotate,
  };
}

type FullCanvasImageProps = {
  src: string;
  alt?: string;
} & Omit<ComponentProps<typeof Image>, "src" | "alt">;

function FullCanvasImage({ src, alt = "", ...props }: FullCanvasImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      position="absolute"
      inset="0"
      w="100%"
      h="100%"
      objectFit="fill"
      draggable={false}
      {...props}
    />
  );
}

function CenterCroppedReactionImage({
  src,
  alt = "",
  animation,
  zIndex,
  imageHeight = "100%",
  imageLeft = "50%",
  overflow = "hidden",
}: {
  src: string;
  alt?: string;
  animation: string;
  zIndex?: number;
  imageHeight?: string;
  imageLeft?: string;
  overflow?: "hidden" | "visible";
}) {
  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={zIndex}
      overflow={overflow}
      animation={animation}
    >
      <Image
        src={src}
        alt={alt}
        position="absolute"
        top="50%"
        left={imageLeft}
        w="auto"
        h={imageHeight}
        maxW="none"
        objectFit="contain"
        transform="translate(-50%, -50%)"
        draggable={false}
      />
    </Box>
  );
}

function ArtistWindLane({ zoneId, isCatchWindowOpen }: { zoneId: WindZoneId; isCatchWindowOpen: boolean }) {
  const corridorPlacement = WIND_CORRIDOR_PLACEMENT_BY_ZONE[zoneId];

  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={2}
      animation={`${laneAppear} 160ms ease both`}
      filter={isCatchWindowOpen ? "brightness(1.12) saturate(1.08)" : undefined}
      transition="filter 100ms linear"
      pointerEvents="none"
    >
      <Image
        src={WIND_ART_BY_ZONE[zoneId]}
        alt=""
        position="absolute"
        // Every direction now uses its artist-cut transparent corridor at its
        // source-stage position; no legacy polygon mask is applied.
        left={corridorPlacement.left}
        top={corridorPlacement.top}
        w={corridorPlacement.width}
        h={corridorPlacement.height}
        maxW="none"
        objectFit="fill"
        draggable={false}
      />
    </Box>
  );
}

function ArtistWindClickArea({
  step,
  label,
  isReady,
  isInteractive,
  onClick,
}: {
  step: WindStep;
  label: string;
  isReady: boolean;
  isInteractive: boolean;
  onClick: () => void;
}) {
  const catchPosition = getFlyerPosition(step.track, step.targetProgress);
  const targetArt = WIND_TARGET_ART_BY_ZONE[step.zoneId];
  const corridorPlacement = WIND_CORRIDOR_PLACEMENT_BY_ZONE[step.zoneId];
  const layeredTargetImage = Array.from({ length: 3 }, () => `url("${targetArt.src}")`).join(", ");

  return (
    <>
      {isInteractive ? (
        <Box
          as="button"
          aria-label={label}
          position="absolute"
          left={corridorPlacement.left}
          top={corridorPlacement.top}
          w={corridorPlacement.width}
          h={corridorPlacement.height}
          zIndex={3}
          border="0"
          p="0"
          bgColor="transparent"
          clipPath={WIND_CLICK_CLIP_PATH_BY_ZONE[step.zoneId]}
          cursor="pointer"
          touchAction="manipulation"
          data-wind-lane-click-area={step.zoneId}
          data-wind-lane-ready={isReady ? "true" : "false"}
          onClick={onClick}
        />
      ) : null}

      <Box
        aria-hidden="true"
        position="absolute"
        left={`${catchPosition.xPct}%`}
        top={`${catchPosition.yPct}%`}
        w={targetArt.width}
        aspectRatio={targetArt.aspectRatio}
        zIndex={5}
        border="0"
        bgColor="transparent"
        bgImage={layeredTargetImage}
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        backgroundSize="contain"
        filter={
          isReady
            ? "brightness(2.5) drop-shadow(0 0 9px rgba(255, 255, 255, 1)) drop-shadow(0 0 20px rgba(225, 213, 255, 0.98))"
            : "brightness(1.28) drop-shadow(0 0 6px rgba(255, 255, 255, 0.72))"
        }
        transform={`translate(-50%, -50%) rotate(${targetArt.rotation}deg)`}
        animation={`${windClickAreaPulse} ${isReady ? 520 : 920}ms ease-in-out infinite`}
        transition="filter 100ms linear"
        pointerEvents="none"
        data-wind-catch-target-bright={isReady ? "true" : "false"}
      />
    </>
  );
}

function ArtistDocument({
  zoneId,
  position,
  isCaught,
  prefersReducedMotion,
}: {
  zoneId: WindZoneId;
  position: FlyerPosition;
  isCaught: boolean;
  prefersReducedMotion: boolean;
}) {
  const anchor = DOCUMENT_ANCHOR_BY_ZONE[zoneId];
  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={4}
      transform={`translate(${position.xPct - anchor.xPct}%, ${position.yPct - anchor.yPct}%)`}
      pointerEvents="none"
      willChange="transform"
    >
      <Box
        key={isCaught ? "caught" : "flying"}
        data-flyer-document-caught={isCaught ? "true" : "false"}
        position="absolute"
        inset="0"
        transformOrigin={`${anchor.xPct}% ${anchor.yPct}%`}
        transform={prefersReducedMotion && isCaught ? "scale(0.24)" : undefined}
        opacity={prefersReducedMotion && isCaught ? 0 : 1}
        animation={
          isCaught && !prefersReducedMotion
            ? `${gameplayFlyerCatchShrink} 480ms ease-in both`
            : undefined
        }
        willChange={isCaught ? "transform, opacity, filter" : undefined}
      >
        <FullCanvasImage src={DOCUMENT_ART_BY_ZONE[zoneId]} />
      </Box>
    </Box>
  );
}

function ArtistInlineJudgment({
  step,
  kind,
  prefersReducedMotion,
}: {
  step: WindStep;
  kind: FlyerResult;
  prefersReducedMotion: boolean;
}) {
  const catchPosition = getFlyerPosition(step.track, step.targetProgress);
  const isGreat = kind !== "missed";

  return (
    <Box
      position="absolute"
      left={`${catchPosition.xPct}%`}
      top={`${catchPosition.yPct - 10}%`}
      zIndex={8}
      transform="translateX(-50%)"
      pointerEvents="none"
    >
      <Text
        data-flyer-inline-judgment={isGreat ? "GREAT" : "MISS"}
        color="white"
        fontSize="clamp(14px, 4.8cqw, 24px)"
        fontWeight="900"
        fontStyle="italic"
        lineHeight="1"
        letterSpacing="0.04em"
        whiteSpace="nowrap"
        textShadow={
          isGreat
            ? "0 2px 0 #9F3517, 0 0 8px rgba(255, 229, 187, 0.95)"
            : "0 2px 0 #138F81, 0 0 8px rgba(185, 255, 244, 0.9)"
        }
        css={{
          WebkitTextStroke: isGreat ? "1.5px #BF451E" : "1.5px #18AD9A",
        }}
        animation={
          prefersReducedMotion
            ? undefined
            : `${gameplayInlineJudgmentIn} 820ms ease-out both`
        }
      >
        {isGreat ? "GREAT" : "MISS"}
      </Text>
    </Box>
  );
}

function ArtistDirectionPrompt({ zoneId, isReady }: { zoneId: WindZoneId; isReady: boolean }) {
  return (
    <FullCanvasImage
      src={DIRECTION_ART_BY_ZONE[zoneId][isReady ? 1 : 0]}
      zIndex={7}
      animation={isReady ? `${arrowReadyPulse} 360ms ease-in-out infinite` : undefined}
      pointerEvents="none"
    />
  );
}

function ArtistTopBanner({ mood }: { mood: DogMood }) {
  const art = TOP_BANNER_ART_BY_MOOD[mood];
  const normalDogMask = Array.from({ length: 5 }, () => `url("${art.frame1}")`).join(", ");
  const normalDogMaskPositions = "0 0, 1px 0, -1px 0, 0 1px, 0 -1px";
  const normalDogMaskSizes = Array.from({ length: 5 }, () => "100% 100%").join(", ");
  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      w="100%"
      aspectRatio="786 / 236"
      zIndex={12}
      overflow="hidden"
      pointerEvents="none"
    >
      <FullCanvasImage src={art.background} />
      {mood === "normal" ? (
        // The current normal banner export already contains frame 1. Restore the
        // patterned area before rendering the mutually exclusive animation frames.
        <Box
          position="absolute"
          inset="0"
          css={{
            maskImage: normalDogMask,
            maskPosition: normalDogMaskPositions,
            maskRepeat: "no-repeat",
            maskSize: normalDogMaskSizes,
            WebkitMaskImage: normalDogMask,
            WebkitMaskPosition: normalDogMaskPositions,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: normalDogMaskSizes,
          }}
        >
          <FullCanvasImage src={art.background} transform="translateX(33.46%)" />
        </Box>
      ) : null}
      <FullCanvasImage
        src={art.frame1}
        clipPath="inset(0 0 1px 0)"
        animation={`${dogFrameOne} 720ms steps(1, end) infinite`}
      />
      <FullCanvasImage
        src={art.frame2}
        clipPath="inset(0 0 1px 0)"
        animation={`${dogFrameTwo} 720ms steps(1, end) infinite`}
      />
      <Image
        src={TOP_BANNER_LINE_SRC}
        alt=""
        position="absolute"
        left="50%"
        bottom="-1px"
        zIndex={1}
        w="100.64%"
        h="3px"
        maxW="none"
        objectFit="fill"
        transform="translateX(-50%)"
        draggable={false}
      />
    </Box>
  );
}

function ArtistHeartHud({
  remainingHearts = DISPLAY_HEART_COUNT,
  isMissed = false,
}: {
  remainingHearts?: number;
  isMissed?: boolean;
}) {
  return (
    <Box position="absolute" inset="0" zIndex={13} pointerEvents="none">
      <FullCanvasImage src={`${ART_ROOT}/愛心/背景.png`} />
      {Array.from({ length: DISPLAY_HEART_COUNT }).map((_, index) => {
        const isActive = index < remainingHearts;
        const translateXPct = isActive ? index * 14.63 : (index - 1) * 14.63;
        const isJustLost = isMissed && index === remainingHearts;
        return (
          <Box
            key={index}
            position="absolute"
            inset="0"
            transform={`translateX(${translateXPct}%)`}
          >
            <FullCanvasImage
              src={`${ART_ROOT}/愛心/${isActive ? "正常" : "扣掉"}.png`}
              animation={isJustLost ? `${heartDamageFlash} 480ms ease both` : undefined}
            />
          </Box>
        );
      })}
    </Box>
  );
}

function ArtistReaction({ feedback, locale }: { feedback: FlyerFeedback; locale: ExhibitionLocale }) {
  const isGreat = feedback.kind === "caught";
  const resultFolder = feedback.kind === "caught" ? "great" : "miss";
  const backgroundExtension = feedback.kind === "caught" ? "jpg" : "png";
  const resultLabel = feedback.kind === "caught" ? "GREAT" : "MISS";
  const clipPath = feedback.kind === "caught"
    ? "polygon(0 22%, 100% 0, 100% 78%, 0 100%)"
    : "polygon(0 0, 100% 22%, 100% 100%, 0 78%)";
  const durationMs = isGreat ? GREAT_FEEDBACK_DURATION_MS : MISS_FEEDBACK_DURATION_MS;
  const personAnimation = isGreat ? greatReactionPersonIn : missReactionPersonIn;
  const textImageLeft = isGreat ? "30%" : "70%";
  const edgeRotation = isGreat ? -19.5 : 19.5;

  return (
    <Box
      key={feedback.id}
      role="status"
      aria-label={feedback.kind === "caught" ? FLYER_COPY[locale].caughtAria : FLYER_COPY[locale].missedAria}
      position="absolute"
      top="13.79%"
      right="0"
      bottom="12%"
      left="0"
      zIndex={9}
      overflow="hidden"
      clipPath={clipPath}
      pointerEvents="none"
    >
      <CenterCroppedReactionImage
        src={`${ART_ROOT}/great_miss/${resultFolder}/背景.${backgroundExtension}`}
        animation={`${reactionBackgroundIn} ${durationMs}ms ease-out both`}
      />
      <CenterCroppedReactionImage
        src={`${ART_ROOT}/great_miss/${resultFolder}/流線1.png`}
        animation={`${reactionStreamOne} ${durationMs}ms linear both`}
        imageLeft={isGreat ? "94.2%" : "14.6%"}
      />
      <CenterCroppedReactionImage
        src={`${ART_ROOT}/great_miss/${resultFolder}/人.png`}
        alt={resultLabel}
        animation={`${personAnimation} ${durationMs}ms ease-out both`}
        zIndex={1}
        imageHeight={isGreat ? "86.5%" : "74%"}
        imageLeft={isGreat ? "46.9%" : "59.7%"}
        overflow="visible"
      />
      <CenterCroppedReactionImage
        src={`${ART_ROOT}/great_miss/${resultFolder}/流線2.png`}
        animation={`${reactionStreamTwo} ${durationMs}ms linear both`}
        imageLeft={isGreat ? "15.2%" : "85.6%"}
      />
      <CenterCroppedReactionImage
        src={`${ART_ROOT}/great_miss/${resultFolder}/文字.png`}
        animation={`${reactionTextIn} ${durationMs}ms ease-out both`}
        zIndex={2}
        imageHeight={isGreat ? "100%" : "92%"}
        imageLeft={textImageLeft}
      />
      <Box
        position="absolute"
        inset="0"
        zIndex={3}
        animation={`${reactionBackgroundIn} ${durationMs}ms ease-out both`}
      >
        {["calc(11.5% - 3px)", "calc(88.5% + 3px)"].map((top) => (
          <Image
            key={top}
            src={REACTION_EDGE_LINE_SRC}
            alt=""
            position="absolute"
            top={top}
            left="50%"
            w="108%"
            h="auto"
            maxW="none"
            transform={`translate(-50%, -50%) rotate(${edgeRotation}deg)`}
            draggable={false}
          />
        ))}
      </Box>
    </Box>
  );
}

function FlyerReactionLoopPreview({
  kind,
  locale = "zh",
}: {
  kind: FlyerFeedback["kind"];
  locale?: ExhibitionLocale;
}) {
  const [loopIndex, setLoopIndex] = useState(0);
  const isGreat = kind === "caught";
  const loopLabel = isGreat ? "great" : "miss";
  const durationMs = isGreat ? GREAT_FEEDBACK_DURATION_MS : MISS_FEEDBACK_DURATION_MS;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoopIndex((index) => index + 1);
    }, durationMs);

    return () => window.clearInterval(timer);
  }, [durationMs]);

  return (
    <Box
      data-flyer-great-loop-preview={isGreat ? "true" : undefined}
      data-flyer-miss-loop-preview={isGreat ? undefined : "true"}
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#DDE8E2"
    >
      <FullCanvasImage
        src={STREET_SCENE_SRC}
        alt={FLYER_COPY[locale].streetAlt}
        zIndex={0}
      />
      <ArtistReaction
        key={`${loopLabel}-loop-${loopIndex}`}
        feedback={{ id: `${loopLabel}-loop-${loopIndex}`, kind }}
        locale={locale}
      />
      <ArtistTopBanner mood={isGreat ? "happy" : "nervous"} />
      <ArtistHeartHud />
    </Box>
  );
}

export function FlyerGreatReactionLoopPreview({ locale = "zh" }: { locale?: ExhibitionLocale }) {
  return <FlyerReactionLoopPreview kind="caught" locale={locale} />;
}

export function FlyerMissReactionLoopPreview({ locale = "zh" }: { locale?: ExhibitionLocale }) {
  return <FlyerReactionLoopPreview kind="missed" locale={locale} />;
}

function ArtistTutorialPreview({
  locale,
  onDemoComplete,
}: {
  locale: ExhibitionLocale;
  onDemoComplete: () => void;
}) {
  const [demoResult, setDemoResult] = useState<TutorialDemoResult>("success");
  const [prefersReducedMotion] = useMediaQuery(["(prefers-reduced-motion: reduce)"], {
    fallback: [false],
    ssr: false,
  });
  const isSuccessDemo = demoResult === "success";

  useEffect(() => {
    if (prefersReducedMotion) {
      onDemoComplete();
      return;
    }

    const phaseTimer = window.setInterval(() => {
      setDemoResult((result) => (result === "success" ? "miss" : "success"));
    }, TUTORIAL_DEMO_DURATION_MS);
    const completionTimer = window.setTimeout(
      onDemoComplete,
      TUTORIAL_DEMO_DURATION_MS * 2,
    );

    return () => {
      window.clearInterval(phaseTimer);
      window.clearTimeout(completionTimer);
    };
  }, [onDemoComplete, prefersReducedMotion]);

  return (
    <Box
      data-tutorial-demo-result={demoResult}
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      borderRadius="20px"
      bgColor="white"
      aria-label={FLYER_COPY[locale].tutorialAlt}
    >
      <Image
        src={STREET_SCENE_SRC}
        alt=""
        position="absolute"
        left="0"
        top="-182.37%"
        w="100%"
        h="367.78%"
        maxW="none"
        objectFit="fill"
        draggable={false}
      />
      <Image
        src={TUTORIAL_WIND_OVERLAY_SRC}
        alt=""
        position="absolute"
        left="0"
        top="10.64%"
        w="100%"
        h="79.64%"
        maxW="none"
        objectFit="fill"
        draggable={false}
      />
      <Image
        src={TUTORIAL_WIND_SRC}
        alt=""
        position="absolute"
        left="0"
        bottom="-87.84%"
        w="100%"
        h="368.09%"
        maxW="none"
        objectFit="fill"
        draggable={false}
      />
      <Image
        src={FLYER_OUTLINE_RIGHT_SRC}
        alt=""
        position="absolute"
        left="18.28%"
        top="23.71%"
        w="16.67%"
        h="34.35%"
        maxW="none"
        objectFit="fill"
        opacity={isSuccessDemo ? undefined : 0.62}
        animation={
          isSuccessDemo && !prefersReducedMotion
            ? `${tutorialSuccessTargetGlow} ${TUTORIAL_DEMO_DURATION_MS}ms ease-in-out both`
            : undefined
        }
        draggable={false}
      />
      {!isSuccessDemo && (
        <Image
          data-tutorial-target-alert="true"
          src={FLYER_OUTLINE_RIGHT_SRC}
          alt=""
          position="absolute"
          left="18.28%"
          top="23.71%"
          zIndex={3}
          w="16.67%"
          h="34.35%"
          maxW="none"
          objectFit="fill"
          filter="brightness(0) saturate(100%) invert(22%) sepia(93%) saturate(3790%) hue-rotate(351deg) brightness(104%) contrast(92%) drop-shadow(0 0 7px rgba(255, 65, 65, 0.92))"
          transformOrigin="center"
          animation={
            prefersReducedMotion
              ? undefined
              : `${tutorialMissTargetAlert} ${TUTORIAL_DEMO_DURATION_MS}ms ease-in-out both`
          }
          draggable={false}
        />
      )}
      <Box
        key={`tutorial-flyer-${demoResult}`}
        data-tutorial-demo-flyer="true"
        position="absolute"
        left="50%"
        top="31.61%"
        zIndex={4}
        w="18.1%"
        h="37.69%"
        overflow="visible"
        transformOrigin="center"
        transform={prefersReducedMotion ? "translate(-179%, -25%) scale(0.58)" : undefined}
        animation={
          prefersReducedMotion
            ? undefined
            : `${
                isSuccessDemo ? tutorialSuccessDocumentSweep : tutorialMissDocumentSweep
              } ${TUTORIAL_DEMO_DURATION_MS}ms linear both`
        }
        willChange="transform, opacity"
      >
        <Box
          position="absolute"
          inset="0"
          overflow="hidden"
          transformOrigin="center"
          animation={
            prefersReducedMotion
              ? undefined
              : `${
                  isSuccessDemo ? tutorialSuccessPaperFlutter : tutorialMissPaperFlutter
                } ${TUTORIAL_DEMO_DURATION_MS}ms ease-in-out both`
          }
          willChange="transform"
        >
          <Image
            src={DOCUMENT_ART_BY_ZONE.right}
            alt=""
            position="absolute"
            left="-202.97%"
            top="-785.48%"
            w="778.22%"
            h="1374.19%"
            maxW="none"
            objectFit="fill"
            draggable={false}
          />
        </Box>
      </Box>
      <Box
        key={`tutorial-finger-${demoResult}`}
        data-tutorial-demo-finger="true"
        position="absolute"
        left="72.5%"
        top="49%"
        zIndex={6}
        w="12%"
        aspectRatio="1"
        color="rgba(255, 247, 235, 0.98)"
        filter="drop-shadow(0 2px 1px rgba(63, 45, 76, 0.5)) drop-shadow(0 0 3px rgba(255, 255, 255, 0.85))"
        opacity={0}
        pointerEvents="none"
        transformOrigin="50% 0%"
        animation={
          prefersReducedMotion
            ? undefined
            : `${
                isSuccessDemo ? tutorialSuccessFingerTap : tutorialMissFingerTap
              } ${TUTORIAL_DEMO_DURATION_MS}ms ease-in-out both`
        }
        willChange="transform, opacity"
      >
        <PiHandPointingFill aria-hidden="true" size="100%" />
      </Box>
      <Box
        key={`tutorial-ripple-${demoResult}`}
        data-tutorial-demo-ripple="true"
        position="absolute"
        left="78.5%"
        top="52%"
        zIndex={5}
        w="13%"
        aspectRatio="1"
        border="3px solid rgba(255, 255, 255, 0.95)"
        borderRadius="full"
        boxShadow="0 0 0 2px rgba(255, 255, 255, 0.24), 0 0 18px rgba(255, 255, 255, 0.92)"
        opacity={0}
        pointerEvents="none"
        animation={
          prefersReducedMotion
            ? undefined
            : `${
                isSuccessDemo ? tutorialSuccessRipple : tutorialMissRipple
              } ${TUTORIAL_DEMO_DURATION_MS}ms ease-out both`
        }
        willChange="transform, opacity"
      />
      <Box
        key={`tutorial-result-${demoResult}`}
        data-tutorial-result-label={isSuccessDemo ? "GREAT" : "MISS"}
        position="absolute"
        inset="0"
        zIndex={7}
        overflow="hidden"
        opacity={prefersReducedMotion ? 1 : 0}
        pointerEvents="none"
        transformOrigin="center"
        animation={
          prefersReducedMotion
            ? undefined
            : `${
                isSuccessDemo ? tutorialGreatLabelIn : tutorialMissLabelIn
              } ${TUTORIAL_DEMO_DURATION_MS}ms ease-out both`
        }
        willChange="transform, opacity"
      >
        <Image
          src={`${ART_ROOT}/great_miss/${isSuccessDemo ? "great" : "miss"}/文字.png`}
          alt=""
          position="absolute"
          top={isSuccessDemo ? "0" : "4%"}
          left={isSuccessDemo ? "35%" : "50%"}
          w="auto"
          h={isSuccessDemo ? "100%" : "92%"}
          maxW="none"
          objectFit="contain"
          transform="translateX(-50%)"
          draggable={false}
        />
      </Box>
    </Box>
  );
}

export function FrogFlyerWindMinigame({
  locale = "zh",
  onComplete,
}: {
  locale?: ExhibitionLocale;
  onComplete: () => void;
}) {
  const copy = FLYER_COPY[locale];
  const [prefersReducedGameplayMotion] = useMediaQuery(["(prefers-reduced-motion: reduce)"], {
    fallback: [false],
    ssr: false,
  });
  const animationFrameRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const waveDefinitionRef = useRef<ActiveFlyer[]>(createWaveFlyers(0));
  const waveResultsRef = useRef<Record<string, FlyerResolution>>({});
  const waveSettledRef = useRef(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isTutorialDemoComplete, setIsTutorialDemoComplete] = useState(false);
  const [waveStartIndex, setWaveStartIndex] = useState(0);
  const [waveFlyers, setWaveFlyers] = useState<ActiveFlyer[]>(() => createWaveFlyers(0));
  const [collectedCount, setCollectedCount] = useState(0);
  const [bonusCount, setBonusCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [flyerPhase, setFlyerPhase] = useState<FlyerPhase>("flying");
  const [feedback, setFeedback] = useState<FlyerFeedback | null>(null);
  const [tapRipple, setTapRipple] = useState<TapRipple | null>(null);
  const [isWindBlank, setIsWindBlank] = useState(false);
  const [runNonce, setRunNonce] = useState(0);
  const [frogRevealFrameIndex, setFrogRevealFrameIndex] = useState(0);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    void Promise.all(
      FLYER_ART_PRELOAD_SOURCES.map((src) =>
        preloadGameImage(src).catch(() => undefined),
      ),
    );
  }, []);

  useEffect(() => {
    prepareFmodGameMusicTrack("flyerMinigame");
    setFmodGameMusicTrack("flyerMinigame");
    return () => {
      setFmodGameMusicTrack("mainTheme");
    };
  }, []);

  const isComplete = flyerPhase === "complete";
  const isFrogReveal = flyerPhase === "frog-reveal";
  const isWindVisible =
    !isTutorialOpen && !isComplete && !isFrogReveal && !isWindBlank;
  const isWindInteractive = isWindVisible && flyerPhase === "flying";
  const earnedStars = getFlyerStarRating(bonusCount);
  const remainingHearts = Math.max(0, DISPLAY_HEART_COUNT - missCount);
  const hasFailed = remainingHearts === 0;
  const dogMood: DogMood = feedback?.kind === "caught"
    ? "happy"
    : feedback?.kind === "missed"
      ? "nervous"
      : "normal";
  const handleTutorialDemoComplete = useCallback(() => {
    setIsTutorialDemoComplete(true);
  }, []);

  const clearTimers = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  const beginWave = useCallback((startFlyerIndex: number) => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const nextWave = createWaveFlyers(startFlyerIndex);
    waveDefinitionRef.current = nextWave;
    waveResultsRef.current = {};
    waveSettledRef.current = false;
    setWaveStartIndex(startFlyerIndex);
    setWaveFlyers(nextWave);
    setFeedback(null);
    setIsWindBlank(false);
    setFlyerPhase("flying");
    setRunNonce((nonce) => nonce + 1);
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    setCollectedCount(0);
    setBonusCount(0);
    setMissCount(0);
    setTapRipple(null);
    beginWave(0);
  }, [beginWave, clearTimers]);

  const settleWave = useCallback((definitions: ActiveFlyer[]) => {
    if (waveSettledRef.current) return;
    const resolutions = definitions.map((flyer) => waveResultsRef.current[flyer.id]);
    if (resolutions.some((resolution) => !resolution)) return;

    waveSettledRef.current = true;
    const bonusThisWave = resolutions.filter((resolution) => resolution.kind === "bonus").length;
    const didMissWave = resolutions.some((resolution) => resolution.kind === "missed");
    const nextCollectedCount = Math.min(
      REQUIRED_CAUGHT_FLYERS,
      collectedCount + definitions.length,
    );
    const nextBonusCount = bonusCount + bonusThisWave;
    const nextMissCount = Math.min(
      DISPLAY_HEART_COUNT,
      missCount + (didMissWave ? 1 : 0),
    );
    const didCatchWholeWave = !didMissWave;
    const feedbackDurationMs = didCatchWholeWave
      ? GREAT_FEEDBACK_DURATION_MS
      : MISS_FEEDBACK_DURATION_MS;
    const shouldComplete =
      nextCollectedCount >= REQUIRED_CAUGHT_FLYERS ||
      nextMissCount >= DISPLAY_HEART_COUNT;

    setCollectedCount(nextCollectedCount);
    setBonusCount(nextBonusCount);
    setMissCount(nextMissCount);
    setFeedback({
      id: `wave-${waveStartIndex}-${runNonce}`,
      kind: didCatchWholeWave ? "caught" : "missed",
    });
    if (!didCatchWholeWave) playGameSfx("flyerMiss");
    setFlyerPhase("feedback");

    nextTimerRef.current = window.setTimeout(() => {
      nextTimerRef.current = null;
      setFeedback(null);
      setIsWindBlank(true);

      nextTimerRef.current = window.setTimeout(() => {
        nextTimerRef.current = null;
        setIsWindBlank(false);
        if (shouldComplete) {
          setFlyerPhase("complete");
          return;
        }
        beginWave(waveStartIndex + definitions.length);
      }, FLYER_INTER_STEP_BLANK_MS);
    }, feedbackDurationMs);
  }, [beginWave, bonusCount, collectedCount, missCount, runNonce, waveStartIndex]);

  const resolveFlyerTap = useCallback((flyerId: string, hitWindBand: boolean) => {
    if (isTutorialOpen || flyerPhase !== "flying") return;
    const flyer = waveFlyers.find((item) => item.id === flyerId);
    if (!flyer || !flyer.hasStarted || flyer.result) return;

    const timingOffset = Math.abs(flyer.progress - flyer.step.targetProgress);
    const isInCatchWindow = timingOffset <= flyer.step.hitWindow;
    const resolution: FlyerResolution = isInCatchWindow
      ? { kind: hitWindBand ? "bonus" : "base", progress: flyer.progress }
      : { kind: "missed", progress: 1 };

    if (isInCatchWindow) {
      const isGreatCatch = timingOffset <= flyer.step.hitWindow * 0.45;
      playGameSfx("flyerCatchSuccess", {
        playbackRate: isGreatCatch ? 1.08 : 0.96,
      });
    }

    waveResultsRef.current[flyerId] = resolution;
    setWaveFlyers((current) =>
      current.map((item) =>
        item.id === flyerId
          ? { ...item, progress: resolution.progress, result: resolution.kind }
          : item,
      ),
    );
    settleWave(waveDefinitionRef.current);
  }, [
    flyerPhase,
    isTutorialOpen,
    settleWave,
    waveFlyers,
  ]);

  const handleStagePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isWindInteractive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    setTapRipple((current) => ({
      id: (current?.id ?? 0) + 1,
      xPct: ((event.clientX - rect.left) / rect.width) * 100,
      yPct: ((event.clientY - rect.top) / rect.height) * 100,
    }));

    const clickedWindBand =
      event.target instanceof Element &&
      event.target.closest("[data-wind-lane-click-area]");
    if (clickedWindBand) return;

    const activeFlyer = waveFlyers
      .filter((flyer) => flyer.hasStarted && !flyer.result)
      .sort(
        (left, right) =>
          Math.abs(left.progress - left.step.targetProgress) -
          Math.abs(right.progress - right.step.targetProgress),
      )[0];
    if (activeFlyer) resolveFlyerTap(activeFlyer.id, false);
  }, [isWindInteractive, resolveFlyerTap, waveFlyers]);

  useEffect(() => {
    if (isTutorialOpen || flyerPhase !== "flying") return;

    const definitions = waveDefinitionRef.current;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextFlyers = definitions.map((flyer) => {
        const existingResolution = waveResultsRef.current[flyer.id];
        if (existingResolution) {
          return {
            ...flyer,
            hasStarted: true,
            progress: existingResolution.progress,
            result: existingResolution.kind,
          };
        }

        const elapsedMs = now - startedAt - flyer.delayMs;
        if (elapsedMs < 0) {
          return { ...flyer, hasStarted: false, progress: 0, result: null };
        }

        const nextProgress = Math.min(1, elapsedMs / flyer.step.durationMs);
        if (nextProgress >= 1) {
          waveResultsRef.current[flyer.id] = { kind: "missed", progress: 1 };
          return { ...flyer, hasStarted: true, progress: 1, result: "missed" as const };
        }
        return { ...flyer, hasStarted: true, progress: nextProgress, result: null };
      });

      setWaveFlyers(nextFlyers);
      if (nextFlyers.every((flyer) => flyer.result)) {
        animationFrameRef.current = null;
        settleWave(definitions);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [flyerPhase, isTutorialOpen, runNonce, settleWave]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!isComplete) return;
    playGameSfx(hasFailed ? "flyerRoundFail" : "flyerRoundSuccess");
  }, [hasFailed, isComplete]);

  useEffect(() => {
    if (!isFrogReveal) return;

    const timer = window.setTimeout(() => {
      if (frogRevealFrameIndex >= FROG_REVEAL_FRAME_SOURCES.length - 1) {
        onCompleteRef.current();
        return;
      }

      const nextFrameIndex = frogRevealFrameIndex + 1;
      if (nextFrameIndex === 6) playGameSfx("frogJump");
      setFrogRevealFrameIndex(nextFrameIndex);
    }, FROG_REVEAL_FRAME_DURATION_MS[frogRevealFrameIndex]);

    return () => window.clearTimeout(timer);
  }, [frogRevealFrameIndex, isFrogReveal]);

  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={50}
      data-flyer-wind-minigame="true"
      overflow="hidden"
      bgColor="#DDE8E2"
      onPointerDown={handleStagePointerDown}
    >
      <FullCanvasImage
        src={STREET_SCENE_SRC}
        alt={isFrogReveal ? "" : copy.streetAlt}
        aria-hidden={isFrogReveal ? "true" : undefined}
        zIndex={0}
        opacity={isFrogReveal ? 0 : 1}
        pointerEvents="none"
      />
      <FullCanvasImage
        src={FROG_REVEAL_BACKGROUND_SRC}
        alt={isFrogReveal ? copy.frogRevealAlt : ""}
        aria-hidden={isFrogReveal ? undefined : "true"}
        zIndex={0}
        opacity={isFrogReveal ? 1 : 0}
        pointerEvents="none"
      />

      {FROG_REVEAL_FRAME_SOURCES.map((src, index) => {
        const isActiveFrame = isFrogReveal && index === frogRevealFrameIndex;
        return (
          <FullCanvasImage
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            data-frog-reveal-frame={index + 1}
            data-frog-reveal-frame-active={isActiveFrame ? "true" : "false"}
            zIndex={1}
            opacity={isActiveFrame ? 1 : 0}
            pointerEvents="none"
          />
        );
      })}

      {isWindVisible
        ? waveFlyers.map((flyer) => {
            if (!flyer.hasStarted) return null;
            const isCatchWindowOpen =
              flyerPhase === "flying" &&
              !flyer.result &&
              Math.abs(flyer.progress - flyer.step.targetProgress) <= flyer.step.hitWindow;
            const displayProgress =
              flyer.result === "base" || flyer.result === "bonus"
                ? flyer.step.targetProgress
                : flyer.progress;
            const flyerPosition = getFlyerPosition(flyer.step.track, displayProgress);

            return (
              <Fragment key={flyer.id}>
                <ArtistWindLane
                  zoneId={flyer.step.zoneId}
                  isCatchWindowOpen={isCatchWindowOpen}
                />
                <ArtistWindClickArea
                  step={flyer.step}
                  label={copy.laneLabel(flyer.step.arrow)}
                  isReady={isCatchWindowOpen}
                  isInteractive={isWindInteractive && !flyer.result}
                  onClick={() => resolveFlyerTap(flyer.id, true)}
                />
                <ArtistDocument
                  zoneId={flyer.step.zoneId}
                  position={flyerPosition}
                  isCaught={flyer.result === "base" || flyer.result === "bonus"}
                  prefersReducedMotion={prefersReducedGameplayMotion}
                />
                {flyer.result ? (
                  <ArtistInlineJudgment
                    step={flyer.step}
                    kind={flyer.result}
                    prefersReducedMotion={prefersReducedGameplayMotion}
                  />
                ) : null}
                <ArtistDirectionPrompt
                  zoneId={flyer.step.zoneId}
                  isReady={isCatchWindowOpen}
                />
              </Fragment>
            );
          })
        : null}

      {tapRipple ? (
        <Box
          key={tapRipple.id}
          aria-hidden="true"
          data-flyer-tap-ripple="true"
          position="absolute"
          left={`${tapRipple.xPct}%`}
          top={`${tapRipple.yPct}%`}
          zIndex={19}
          w="44px"
          h="44px"
          border="3px solid rgba(255, 255, 255, 0.94)"
          borderRadius="50%"
          bgColor="rgba(220, 205, 255, 0.18)"
          boxShadow="0 0 14px rgba(220, 205, 255, 0.82), inset 0 0 10px rgba(255, 255, 255, 0.48)"
          animation={`${tapRippleWave} 480ms ease-out both`}
          pointerEvents="none"
        />
      ) : null}

      {feedback ? (
        <Box
          position="absolute"
          inset="0"
          zIndex={9}
          pointerEvents="none"
          animation={
            prefersReducedGameplayMotion
              ? undefined
              : `${gameplayReactionReveal} ${
                  feedback.kind === "caught"
                    ? GREAT_FEEDBACK_DURATION_MS
                    : MISS_FEEDBACK_DURATION_MS
                }ms linear both`
          }
        >
          <ArtistReaction feedback={feedback} locale={locale} />
        </Box>
      ) : null}

      {!isFrogReveal ? <ArtistTopBanner mood={dogMood} /> : null}
      {!isFrogReveal ? (
        <ArtistHeartHud
          remainingHearts={remainingHearts}
          isMissed={feedback?.kind === "missed"}
        />
      ) : null}

      <Text position="absolute" w="1px" h="1px" overflow="hidden" clip="rect(0 0 0 0)" aria-live="polite">
        {copy.liveStatus(collectedCount, bonusCount)}
      </Text>

      {isComplete ? (
        <Flex
          position="absolute"
          top="13.79%"
          right="0"
          bottom="8.57%"
          left="0"
          zIndex={20}
          align="center"
          justify="center"
          p="24px"
          bgColor="rgba(37, 49, 55, 0.62)"
        >
          {hasFailed ? (
            <Box
              w="100%"
              maxW="350px"
              aspectRatio="602 / 620"
              position="relative"
              overflow="hidden"
              borderRadius="24px"
              bgColor="#FFFDF9"
              boxShadow="0 16px 34px rgba(0,0,0,0.28)"
              animation={`${successFadeUp} 300ms ease both`}
              css={{ containerType: "inline-size" }}
            >
              <Text
                position="absolute"
                top="6.4%"
                left="4%"
                right="4%"
                color="#9C775C"
                fontSize="clamp(16px, 5.32cqw, 32px)"
                fontWeight="600"
                lineHeight="1.2"
                textAlign="center"
              >
                {copy.failTitle}
              </Text>

              <Box
                position="absolute"
                top="17.4%"
                left="3.82%"
                w="92.69%"
                h="58.2%"
                overflow="hidden"
                borderRadius="clamp(6px, 1.66cqw, 10px)"
              >
                <Image
                  src={FLYER_FAIL_RESULT_SRC}
                  alt={copy.failArtworkAlt}
                  position="absolute"
                  top="-119.15%"
                  left="0"
                  w="100.36%"
                  h="auto"
                  maxW="none"
                  draggable={false}
                />
              </Box>

              <Flex
                as="button"
                position="absolute"
                top="82.26%"
                left="4.65%"
                w="90.86%"
                h="13.23%"
                align="center"
                justify="center"
                borderRadius="999px"
                border="0"
                bgColor="#9C775C"
                color="white"
                fontSize="clamp(18px, 5.32cqw, 32px)"
                fontWeight="400"
                cursor="pointer"
                _hover={{ bgColor: "#8E6D52" }}
                _active={{ bgColor: "#805F48", transform: "translateY(1px)" }}
                onClick={() => {
                  playGameSfx("uiDialogContinue", { volumeScale: 0.8 });
                  resetGame();
                }}
              >
                {copy.retry}
              </Flex>
            </Box>
          ) : (
            <Box
              w="100%"
              maxW="350px"
              aspectRatio="602 / 620"
              position="relative"
              overflow="hidden"
              borderRadius="24px"
              bgColor="#FFFDF9"
              boxShadow="0 16px 34px rgba(0,0,0,0.28)"
              animation={`${successFadeUp} 300ms ease both`}
              css={{ containerType: "inline-size" }}
            >
            <Text
              position="absolute"
              top="4.6%"
              left="4%"
              right="4%"
              color="#9C775C"
              fontSize="clamp(16px, 5.32cqw, 32px)"
              fontWeight="600"
              lineHeight="1.2"
              textAlign="center"
              whiteSpace={locale === "zh" ? "nowrap" : "normal"}
            >
              {copy.successTitle}
            </Text>

            <Flex
              position="absolute"
              top="11.2%"
              left="0"
              right="0"
              align="center"
              justify="center"
              gap="clamp(4px, 1.5cqw, 9px)"
              aria-label={copy.stars(earnedStars)}
            >
              {Array.from({ length: 3 }, (_, index) => (
                <Text
                  key={`flyer-result-star-${index}`}
                  color={index < earnedStars ? "#FFD66B" : "#DED4C9"}
                  fontSize="clamp(22px, 7.3cqw, 44px)"
                  lineHeight="1"
                  textShadow={
                    index < earnedStars
                      ? "0 3px 8px rgba(184, 126, 34, 0.28)"
                      : undefined
                  }
                >
                  ★
                </Text>
              ))}
            </Flex>

            <Text
              position="absolute"
              top="19.1%"
              left="4%"
              right="4%"
              color="#9C775C"
              fontSize="clamp(11px, 3.33cqw, 20px)"
              fontWeight="700"
              lineHeight="1.2"
              textAlign="center"
            >
              {copy.score(bonusCount)}
            </Text>

            <Box
              position="absolute"
              top="24.35%"
              left="3.82%"
              w="92.69%"
              h="51.3%"
              overflow="hidden"
              borderRadius="clamp(6px, 1.66cqw, 10px)"
            >
              <Image
                src={FROG_REVEAL_BACKGROUND_SRC}
                alt={copy.frogRevealAlt}
                position="absolute"
                top="-139.5%"
                left="-0.36%"
                w="100.36%"
                h="auto"
                maxW="none"
                draggable={false}
              />
            </Box>

            <Flex
              as="button"
              position="absolute"
              top="82.26%"
              left="4.65%"
              w="90.86%"
              h="13.23%"
              align="center"
              justify="center"
              borderRadius="999px"
              border="0"
              bgColor="#9C775C"
              color="white"
              fontSize="clamp(18px, 5.32cqw, 32px)"
              fontWeight="400"
              cursor="pointer"
              _hover={{ bgColor: "#8E6D52" }}
              _active={{ bgColor: "#805F48", transform: "translateY(1px)" }}
              onClick={() => {
                playGameSfx("flyerHandOff");
                setFrogRevealFrameIndex(0);
                setFlyerPhase("frog-reveal");
              }}
            >
              {copy.complete}
            </Flex>
            </Box>
          )}
        </Flex>
      ) : null}

      {isTutorialOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={40}
          align="center"
          justify="center"
          p="24px"
          bgColor="rgba(42, 37, 34, 0.52)"
        >
          <Flex
            w="100%"
            maxW="350px"
            aspectRatio="602 / 620"
            position="relative"
            overflow="hidden"
            borderRadius="24px"
            bgColor="#FFFDF9"
            boxShadow="0 16px 34px rgba(0,0,0,0.28)"
            css={{ containerType: "inline-size" }}
          >
            <Text
              position="absolute"
              top="6.94%"
              left="4%"
              right="4%"
              color="#9C775C"
              fontSize="clamp(16px, 5.32cqw, 32px)"
              fontWeight="600"
              lineHeight="1.25"
              textAlign="center"
              whiteSpace="pre-line"
            >
              {copy.tutorialInstruction}
            </Text>

            <Box position="absolute" top="24.35%" left="3.65%" w="92.7%" h="53.06%">
              <ArtistTutorialPreview
                locale={locale}
                onDemoComplete={handleTutorialDemoComplete}
              />
            </Box>

            {isTutorialDemoComplete ? (
              <Flex
                data-tutorial-start-ready="true"
                as="button"
                position="absolute"
                left="4.49%"
                top="82.26%"
                w="90.86%"
                h="13.23%"
                align="center"
                justify="center"
                borderRadius="999px"
                border="0"
                bgColor="#9C775C"
                color="white"
                fontSize="clamp(18px, 5.32cqw, 32px)"
                fontWeight="400"
                cursor="pointer"
                animation={`${successFadeUp} 260ms ease-out both`}
                _hover={{ bgColor: "#8E6D52" }}
                _active={{ bgColor: "#805F48", transform: "translateY(1px)" }}
                onClick={() => {
                  playFmodGameEvent("paperScattered");
                  beginWave(0);
                  setIsTutorialOpen(false);
                }}
              >
                {copy.start}
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      ) : null}
    </Box>
  );
}

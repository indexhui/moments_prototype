"use client";

import type { ComponentProps } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  playFmodGameEvent,
  prepareFmodGameMusicTrack,
  setFmodGameMusicTrack,
} from "@/lib/game/fmodWeb";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { playGameSfx } from "@/lib/game/soundEffects";

type WindZoneId = "right" | "top" | "left" | "bottom";
type FlyerPhase = "flying" | "feedback" | "complete";
type FlyerResult = "caught" | "missed";
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

const FLYER_COPY = {
  zh: {
    caughtAria: "成功撿到傳單",
    missedAria: "沒有撿到傳單",
    tutorialAlt: "傳單沿著風道飛行的示意",
    streetAlt: "公司附近街道",
    laneLabel: (arrow: string) => `${arrow} 風向路徑，點擊撿起傳單`,
    liveStatus: (caught: number, missed: number) => `已撿到 ${caught} 張傳單，失誤 ${missed} 次。`,
    successTitle: "9 張都撿回來啦！",
    failTitle: "三顆愛心用完了！",
    successDetail: (hearts: number, streak: number) => `保住 ${hearts} 顆愛心，最高 ${streak} combo。`,
    failDetail: (caught: number) => `撿到 ${caught}/9 張，再試一次就好。`,
    handOff: "交還傳單",
    retry: "再撿一次",
    tutorialInstruction: "當傳單飛進虛線，點擊風道",
    start: "開始",
  },
  ja: {
    caughtAria: "チラシをキャッチしました",
    missedAria: "チラシを取り逃しました",
    tutorialAlt: "風の通り道に沿って飛ぶチラシの説明",
    streetAlt: "オフィス街",
    laneLabel: (arrow: string) => `${arrow} の風の通り道。タップしてチラシを拾う`,
    liveStatus: (caught: number, missed: number) => `チラシを ${caught} 枚回収、ミスは ${missed} 回。`,
    successTitle: "9枚ぜんぶ拾えた！",
    failTitle: "ハートを3つ使い切った！",
    successDetail: (hearts: number, streak: number) => `ハートを ${hearts} 個残して、最高 ${streak} コンボ。`,
    failDetail: (caught: number) => `${caught}/9 枚拾えたよ。もう一度挑戦しよう。`,
    handOff: "チラシを返す",
    retry: "もう一度拾う",
    tutorialInstruction: "チラシが点線に入ったら、風の道をタップ",
    start: "スタート",
  },
  en: {
    caughtAria: "Flyer caught",
    missedAria: "Flyer missed",
    tutorialAlt: "A flyer moving along a wind path",
    streetAlt: "Office district",
    laneLabel: (arrow: string) => `${arrow} wind path. Tap to catch the flyer`,
    liveStatus: (caught: number, missed: number) => `${caught} flyers caught, ${missed} misses.`,
    successTitle: "All 9 flyers recovered!",
    failTitle: "You're out of hearts!",
    successDetail: (hearts: number, streak: number) => `${hearts} hearts left, with a best combo of ${streak}.`,
    failDetail: (caught: number) => `You caught ${caught}/9. Give it another try.`,
    handOff: "Return the flyers",
    retry: "Try again",
    tutorialInstruction: "When the flyer enters the dotted line, tap the wind path",
    start: "Start",
  },
} as const;

const ART_ROOT = "/images/428出圖/20260822/追傳單";
const FLYER_CHASE_ART_ROOT = "/images/minigame/flyer_chase";
const TOP_BANNER_LINE_SRC = `${FLYER_CHASE_ART_ROOT}/top_banner_line.png`;
const REACTION_EDGE_LINE_SRC = `${FLYER_CHASE_ART_ROOT}/line.png`;
const TUTORIAL_WIND_SRC = `${FLYER_CHASE_ART_ROOT}/tutorial_wind_right.png`;
const WIND_CATCH_TARGET_TOP_SRC = `${FLYER_CHASE_ART_ROOT}/wind_catch_target_top.png`;
const FLYER_OUTLINE_DOWN_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_down.svg`;
const FLYER_OUTLINE_LEFT_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_left.svg`;
const FLYER_OUTLINE_RIGHT_SRC = `${FLYER_CHASE_ART_ROOT}/flyer_outline_right.svg`;
const WIND_CORRIDOR_BG_UP_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_bg_up.png`;
const WIND_CORRIDOR_DOWN_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_down.png`;
const WIND_CORRIDOR_LEFT_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_left.png`;
const WIND_CORRIDOR_RIGHT_SRC = `${FLYER_CHASE_ART_ROOT}/wind_corridor_right.png`;
const STREET_SCENE_SRC = "/images/428出圖/背景/公司附近街道_白天.jpg";
const DISPLAY_HEART_COUNT = 3;
const DEFAULT_HIT_WINDOW = 0.115;
const REQUIRED_CAUGHT_FLYERS = 9;
const MAX_MISSES = DISPLAY_HEART_COUNT;
const GREAT_FEEDBACK_DURATION_MS = 1250;
const MISS_FEEDBACK_DURATION_MS = 1250;
const FLYER_INTER_STEP_BLANK_MS = 130;
const DOUBLE_WIND_START_FLYER_INDEX = 7;
const DOUBLE_WIND_STAGGER_MS = 700;

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
  ...Object.values(WIND_ART_BY_ZONE),
  ...Object.values(DOCUMENT_ART_BY_ZONE),
  ...Object.values(DIRECTION_ART_BY_ZONE).flat(),
  ...Object.values(TOP_BANNER_ART_BY_MOOD).flatMap((art) => [art.background, art.frame1, art.frame2]),
  TOP_BANNER_LINE_SRC,
  REACTION_EDGE_LINE_SRC,
  TUTORIAL_WIND_SRC,
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

const tutorialDocumentSweep = keyframes`
  0%, 8% { transform: translate(55%, 20%); opacity: 0; }
  16% { opacity: 1; }
  56%, 66% { transform: translate(-299%, -135%); opacity: 1; }
  91% { transform: translate(-533%, -191%); opacity: 1; }
  100% { transform: translate(-570%, -205%); opacity: 0; }
`;

const tutorialTargetGlow = keyframes`
  0%, 47%, 76%, 100% {
    opacity: 0.56;
    filter: brightness(0.86) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
  }
  54%, 68% {
    opacity: 1;
    filter: brightness(2.2) drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 18px rgba(225, 213, 255, 0.92));
  }
`;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
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
  onClick,
}: {
  step: WindStep;
  label: string;
  isReady: boolean;
  onClick: () => void;
}) {
  const catchPosition = getFlyerPosition(step.track, step.targetProgress);
  const targetArt = WIND_TARGET_ART_BY_ZONE[step.zoneId];
  const corridorPlacement = WIND_CORRIDOR_PLACEMENT_BY_ZONE[step.zoneId];
  const layeredTargetImage = Array.from({ length: 3 }, () => `url("${targetArt.src}")`).join(", ");

  return (
    <>
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

function ArtistDocument({ zoneId, position }: { zoneId: WindZoneId; position: FlyerPosition }) {
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
      <FullCanvasImage src={DOCUMENT_ART_BY_ZONE[zoneId]} />
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
  remainingHearts,
  caughtCount,
  isMissed,
}: {
  remainingHearts: number;
  caughtCount: number;
  isMissed: boolean;
}) {
  return (
    <Box position="absolute" inset="0" zIndex={13} pointerEvents="none">
      <FullCanvasImage src={`${ART_ROOT}/愛心/背景.png`} />
      {Array.from({ length: DISPLAY_HEART_COUNT }).map((_, index) => {
        const isActive = index < remainingHearts;
        const translateXPct = isActive ? index * 14.63 : (index - 1) * 14.63;
        const isJustLost = isMissed && index === remainingHearts;
        return (
          <Box key={index} position="absolute" inset="0" transform={`translateX(${translateXPct}%)`}>
            <FullCanvasImage
              src={`${ART_ROOT}/愛心/${isActive ? "正常" : "扣掉"}.png`}
              animation={isJustLost ? `${heartDamageFlash} 480ms ease both` : undefined}
            />
          </Box>
        );
      })}
      <Text
        position="absolute"
        right="4.8%"
        bottom="2.35%"
        px="7px"
        py="2px"
        borderRadius="999px"
        bgColor="rgba(112, 62, 53, 0.4)"
        color="#F8DDD0"
        fontSize="10px"
        fontWeight="800"
        lineHeight="1"
      >
        {caughtCount}/{REQUIRED_CAUGHT_FLYERS}
      </Text>
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
      <ArtistHeartHud
        remainingHearts={isGreat ? 3 : 2}
        caughtCount={isGreat ? 1 : 0}
        isMissed={!isGreat}
      />
    </Box>
  );
}

export function FlyerGreatReactionLoopPreview({ locale = "zh" }: { locale?: ExhibitionLocale }) {
  return <FlyerReactionLoopPreview kind="caught" locale={locale} />;
}

export function FlyerMissReactionLoopPreview({ locale = "zh" }: { locale?: ExhibitionLocale }) {
  return <FlyerReactionLoopPreview kind="missed" locale={locale} />;
}

function ArtistTutorialPreview({ locale }: { locale: ExhibitionLocale }) {
  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      borderRadius="20px"
      bgColor="#503F6A"
      aria-label={FLYER_COPY[locale].tutorialAlt}
    >
      <Image
        src={TUTORIAL_WIND_SRC}
        alt=""
        position="absolute"
        left="0"
        bottom="-91.5%"
        w="100.36%"
        h="369.3%"
        maxW="none"
        objectFit="fill"
        draggable={false}
      />
      <Image
        src={FLYER_OUTLINE_RIGHT_SRC}
        alt=""
        position="absolute"
        left="24.7%"
        top="20.4%"
        w="22.2%"
        h="46.2%"
        maxW="none"
        objectFit="fill"
        animation={`${tutorialTargetGlow} 3000ms ease-in-out infinite`}
        draggable={false}
      />
      <Box
        position="absolute"
        left="80.3%"
        top="74.5%"
        w="18.1%"
        h="37.7%"
        animation={`${tutorialDocumentSweep} 3000ms ease-in-out infinite`}
        willChange="transform, opacity"
      >
        <Image
          src={DOCUMENT_ART_BY_ZONE.right}
          alt=""
          position="absolute"
          left="-203%"
          top="-785%"
          w="778%"
          h="1374%"
          maxW="none"
          objectFit="fill"
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
  const animationFrameRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const waveDefinitionRef = useRef<ActiveFlyer[]>(createWaveFlyers(0));
  const waveResultsRef = useRef<Record<string, FlyerResolution>>({});
  const waveSettledRef = useRef(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [waveStartIndex, setWaveStartIndex] = useState(0);
  const [waveFlyers, setWaveFlyers] = useState<ActiveFlyer[]>(() => createWaveFlyers(0));
  const [caughtCount, setCaughtCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [flyerPhase, setFlyerPhase] = useState<FlyerPhase>("flying");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<FlyerFeedback | null>(null);
  const [isWindBlank, setIsWindBlank] = useState(false);
  const [runNonce, setRunNonce] = useState(0);

  useEffect(() => {
    FLYER_ART_PRELOAD_SOURCES.forEach((src) => {
      const image = new window.Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    prepareFmodGameMusicTrack("flyerMinigame");
    setFmodGameMusicTrack("flyerMinigame");
    return () => {
      setFmodGameMusicTrack("mainTheme");
    };
  }, []);

  const isComplete = flyerPhase === "complete";
  const isWindVisible = !isTutorialOpen && !isComplete && !isWindBlank;
  const isWindInteractive = isWindVisible && flyerPhase === "flying";
  const hasPassed = caughtCount >= REQUIRED_CAUGHT_FLYERS && missCount < MAX_MISSES;
  const remainingHearts = Math.max(0, DISPLAY_HEART_COUNT - missCount);
  const dogMood: DogMood = feedback?.kind === "caught"
    ? "happy"
    : feedback?.kind === "missed"
      ? "nervous"
      : "normal";

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
    setCaughtCount(0);
    setMissCount(0);
    setStreak(0);
    setBestStreak(0);
    beginWave(0);
  }, [beginWave, clearTimers]);

  const settleWave = useCallback((definitions: ActiveFlyer[]) => {
    if (waveSettledRef.current) return;
    const resolutions = definitions.map((flyer) => waveResultsRef.current[flyer.id]);
    if (resolutions.some((resolution) => !resolution)) return;

    waveSettledRef.current = true;
    const caughtThisWave = resolutions.filter((resolution) => resolution.kind === "caught").length;
    const missedThisWave = resolutions.length - caughtThisWave;
    const didLoseHeart = missedThisWave > 0;
    const nextCaughtCount = caughtCount + caughtThisWave;
    const nextMissCount = missCount + (didLoseHeart ? 1 : 0);
    const didCatchWholeWave = missedThisWave === 0;
    const feedbackDurationMs = didCatchWholeWave
      ? GREAT_FEEDBACK_DURATION_MS
      : MISS_FEEDBACK_DURATION_MS;
    const nextStreak = didCatchWholeWave ? streak + caughtThisWave : 0;
    const shouldComplete =
      nextCaughtCount >= REQUIRED_CAUGHT_FLYERS || nextMissCount >= MAX_MISSES;

    setCaughtCount(nextCaughtCount);
    setMissCount(nextMissCount);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    setFeedback({
      id: `wave-${waveStartIndex}-${runNonce}`,
      kind: didCatchWholeWave ? "caught" : "missed",
    });
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
  }, [beginWave, caughtCount, missCount, runNonce, streak, waveStartIndex]);

  useEffect(() => {
    if (isTutorialOpen || flyerPhase !== "flying") return;

    const definitions = waveDefinitionRef.current;
    const startedAt = performance.now();
    const tick = (now: number) => {
      let didAutoMiss = false;
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
          didAutoMiss = true;
          return { ...flyer, hasStarted: true, progress: 1, result: "missed" as const };
        }
        return { ...flyer, hasStarted: true, progress: nextProgress, result: null };
      });

      setWaveFlyers(nextFlyers);
      if (didAutoMiss) playGameSfx("flyerMiss");

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

  const handleLaneClick = useCallback((flyerId: string) => {
    if (isTutorialOpen || flyerPhase !== "flying") return;
    const flyer = waveFlyers.find((item) => item.id === flyerId);
    if (!flyer || !flyer.hasStarted || flyer.result) return;

    const timingOffset = Math.abs(flyer.progress - flyer.step.targetProgress);
    const isInCatchWindow = timingOffset <= flyer.step.hitWindow;
    if (isInCatchWindow) {
      const isGreatCatch = timingOffset <= flyer.step.hitWindow * 0.45;
      playGameSfx("flyerCatchSuccess", {
        playbackRate: isGreatCatch ? 1.08 : 0.96,
      });
      waveResultsRef.current[flyerId] = { kind: "caught", progress: flyer.progress };
    } else {
      playGameSfx("flyerMiss");
      waveResultsRef.current[flyerId] = { kind: "missed", progress: flyer.progress };
    }
    setWaveFlyers((current) =>
      current.map((item) =>
        item.id === flyerId
          ? { ...item, result: waveResultsRef.current[flyerId].kind }
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

  useEffect(() => {
    if (!isComplete) return;
    playGameSfx(hasPassed ? "flyerRoundSuccess" : "flyerRoundFail");
  }, [hasPassed, isComplete]);

  return (
    <Box position="absolute" inset="0" zIndex={50} overflow="hidden" bgColor="#DDE8E2">
      <FullCanvasImage
        src={STREET_SCENE_SRC}
        alt={copy.streetAlt}
        zIndex={0}
      />

      {isWindVisible
        ? waveFlyers.map((flyer) => {
            if (!flyer.hasStarted) return null;
            const isCatchWindowOpen =
              flyerPhase === "flying" &&
              !flyer.result &&
              Math.abs(flyer.progress - flyer.step.targetProgress) <= flyer.step.hitWindow;
            const flyerPosition = getFlyerPosition(flyer.step.track, flyer.progress);

            return (
              <Fragment key={flyer.id}>
                <ArtistWindLane
                  zoneId={flyer.step.zoneId}
                  isCatchWindowOpen={isCatchWindowOpen}
                />
                {isWindInteractive && !flyer.result ? (
                  <ArtistWindClickArea
                    step={flyer.step}
                    label={copy.laneLabel(flyer.step.arrow)}
                    isReady={isCatchWindowOpen}
                    onClick={() => handleLaneClick(flyer.id)}
                  />
                ) : null}
                <ArtistDocument zoneId={flyer.step.zoneId} position={flyerPosition} />
                <ArtistDirectionPrompt
                  zoneId={flyer.step.zoneId}
                  isReady={isCatchWindowOpen}
                />
              </Fragment>
            );
          })
        : null}

      {feedback ? <ArtistReaction feedback={feedback} locale={locale} /> : null}

      <ArtistTopBanner mood={dogMood} />
      <ArtistHeartHud
        remainingHearts={remainingHearts}
        caughtCount={caughtCount}
        isMissed={feedback?.kind === "missed"}
      />

      <Text position="absolute" w="1px" h="1px" overflow="hidden" clip="rect(0 0 0 0)" aria-live="polite">
        {copy.liveStatus(caughtCount, missCount)}
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
          <Flex
            w="min(310px, 100%)"
            direction="column"
            align="center"
            gap="12px"
            px="20px"
            py="22px"
            borderRadius="20px"
            border="4px solid #7B665D"
            outline="4px solid #FFF8EC"
            bg={hasPassed ? "linear-gradient(180deg, #FFF6BA, #F8CE64)" : "linear-gradient(180deg, #FFF0EA, #E8A993)"}
            boxShadow="0 12px 0 rgba(62, 48, 43, 0.72), 0 24px 42px rgba(31, 27, 24, 0.38)"
            animation={`${successFadeUp} 300ms ease both`}
          >
            <Text color="#67443A" fontSize="25px" fontWeight="900" textAlign="center" lineHeight="1.1">
              {hasPassed ? copy.successTitle : copy.failTitle}
            </Text>
            <Text color="#78574D" fontSize="13px" fontWeight="800" lineHeight="1.45" textAlign="center">
              {hasPassed
                ? copy.successDetail(remainingHearts, bestStreak)
                : copy.failDetail(caughtCount)}
            </Text>
            <Flex
              as="button"
              w="100%"
              h="44px"
              align="center"
              justify="center"
              borderRadius="999px"
              border="3px solid white"
              bgColor={hasPassed ? "#E98759" : "#B66D62"}
              boxShadow={hasPassed ? "0 5px 0 #A75C3E" : "0 5px 0 #7E4C45"}
              color="white"
              fontSize="16px"
              fontWeight="900"
              cursor="pointer"
              onClick={() => {
                if (hasPassed) {
                  playGameSfx("flyerHandOff");
                  onComplete();
                  return;
                }
                playGameSfx("uiDialogContinue", { volumeScale: 0.8 });
                resetGame();
              }}
            >
              {hasPassed ? copy.handOff : copy.retry}
            </Flex>
          </Flex>
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
            aspectRatio="602 / 576"
            position="relative"
            overflow="hidden"
            borderRadius="24px"
            bgColor="#FFFDF9"
            boxShadow="0 16px 34px rgba(0,0,0,0.28)"
            css={{ containerType: "inline-size" }}
          >
            <Text
              position="absolute"
              top="5.7%"
              left="4%"
              right="4%"
              color="#9C775C"
              fontSize="clamp(16px, 5.32cqw, 32px)"
              fontWeight="700"
              lineHeight="1.2"
              textAlign="center"
              whiteSpace={locale === "zh" ? "nowrap" : "normal"}
            >
              {copy.tutorialInstruction}
            </Text>

            <Box position="absolute" top="18.4%" left="3.65%" w="92.7%" h="57.1%">
              <ArtistTutorialPreview locale={locale} />
            </Box>

            <Flex
              as="button"
              position="absolute"
              left="4.65%"
              top="81.6%"
              w="90.9%"
              h="14.25%"
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
                playFmodGameEvent("paperScattered");
                beginWave(0);
                setIsTutorialOpen(false);
              }}
            >
              {copy.start}
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Box>
  );
}

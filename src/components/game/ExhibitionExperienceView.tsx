"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiExternalLink, FiRotateCcw } from "react-icons/fi";
import { IoArrowBack } from "react-icons/io5";
import {
  DiaryBookOpenPromptPage,
  DiaryOverlay,
  ExhibitionIncompleteBaiEntry1DiaryPuzzle,
  NaotaroDiaryUnlockPage,
  NaotaroPhotoDiaryRevealPage,
  PhotoDiarySlidePage,
} from "@/components/game/DiaryOverlay";
import {
  CharacterIntroOverlay,
  MAI_CHARACTER_INTRO_CARD,
  type CharacterIntroCard,
} from "@/components/game/CharacterIntroOverlay";
import {
  OpeningCloudBurstOverlay,
  OPENING_CLOUD_BURST_DURATION_MS,
} from "@/components/game/OpeningCloudBurstOverlay";
import {
  ExhibitionStreetStoreRouteView,
  ExhibitionWorkLunchConvenienceRouteView,
} from "@/components/game/StorySimpleMetroRouteView";
import { CabinetBoxStackMinigameModal } from "@/components/game/events/CabinetBoxStackMinigameModal";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { FrogDiaryClueEventModal } from "@/components/game/events/FrogDiaryClueEventModal";
import { OfficeWorkValueMinigame } from "@/components/game/events/OfficeWorkValueMinigame";
import { OfficeTodoIncrementalMinigame } from "@/components/game/events/OfficeTodoIncrementalMinigame";
import { OfficePackingDeskMinigame } from "@/components/game/events/OfficePackingDeskMinigame";
import { OfficeSocialCanvasMinigame } from "@/components/game/events/OfficeSocialCanvasMinigame";
import { OfficeFileMatchMinigame } from "@/components/game/events/OfficeFileMatchMinigame";
import { OfficeWorkflowAutomationMinigame } from "@/components/game/events/OfficeWorkflowAutomationMinigame";
import { OfficeCreatorStudioIncrementalMinigame } from "@/components/game/events/OfficeCreatorStudioIncrementalMinigame";
import { DepartureTransitionOverlay } from "@/components/game/events/DepartureTransitionOverlay";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { playGameSfx, playGameSfxSequence } from "@/lib/game/soundEffects";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import { BAI_ROOM_GLOW_1_BACKGROUND_LAYERS } from "@/lib/game/scenes";
import {
  EXHIBITION_DIARY_READ_LINES,
  EXHIBITION_FORGOT_LUNCH_LINES,
  EXHIBITION_METRO_COMIC_NARRATION,
  EXHIBITION_METRO_DOG_AFTER_PHOTO,
  EXHIBITION_METRO_DOG_BEFORE_PHOTO,
  EXHIBITION_NARRATIVE_LINES,
  EXHIBITION_NARRATIVE_NEXT_PHASE,
  type ExhibitionNarrativePhase,
  type ExhibitionPhase,
} from "@/lib/game/exhibitionFlow";
import {
  getDefaultExhibitionSceneStepId,
  getExhibitionDiaryReadLineIndex,
  getExhibitionFrogReadLineIndex,
  getExhibitionForgotLunchLineIndex,
  getExhibitionSceneJumpSteps,
  isExhibitionFrogDiaryStep,
  isExhibitionSceneStep,
} from "@/lib/game/exhibitionSceneJump";
import { FROG_DIARY_CLUE_STAGES } from "@/lib/game/frogDiaryClueFlow";
import { EXHIBITION_STREET_FLYER_STAGE } from "@/lib/game/exhibitionFrogStreetFlow";
import { EXHIBITION_CONVENIENCE_FROG_STAGE } from "@/lib/game/exhibitionFrogConvenienceFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import {
  playFmodGameEvent,
  prepareFmodGameMusicTrack,
  setFmodGameMusicTrack,
  setFmodOfficeAmbienceActive,
  stopFmodWebEvent,
} from "@/lib/game/fmodWeb";

const panelFromRight = keyframes`
  from { opacity: 0; transform: translateX(42px) rotate(2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const panelFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-42px) rotate(-2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const singleComicPanelFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const exhibitionBeigoPeekOut = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const exhibitionBeigoRushPanelFromRight = keyframes`
  0% { opacity: 0; transform: translateX(calc(-50% + 72px)); }
  100% { opacity: 1; transform: translateX(-50%); }
`;

const clueCardIn = keyframes`
  from { opacity: 0; transform: translateY(10px) rotate(-2deg) scale(0.97); }
  to { opacity: 1; transform: translateY(0) rotate(-1deg) scale(1); }
`;

const exhibitionRestDarken = keyframes`
  0% { opacity: 0; }
  38% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const exhibitionRestTopLidClose = keyframes`
  0% { transform: translateY(-108%); }
  22% { transform: translateY(-92%); }
  100% { transform: translateY(0); }
`;

const exhibitionRestBottomLidClose = keyframes`
  0% { transform: translateY(108%); }
  22% { transform: translateY(92%); }
  100% { transform: translateY(0); }
`;

const exhibitionRestTitleIn = keyframes`
  0%, 28% { opacity: 0; transform: translateY(12px); filter: blur(8px); }
  58%, 86% { opacity: 1; transform: translateY(0); filter: blur(0); }
  100% { opacity: 0; transform: translateY(-6px); filter: blur(5px); }
`;

const exhibitionWakeBlackOpen = keyframes`
  0%, 38% { opacity: 1; }
  72%, 100% { opacity: 0; }
`;

const exhibitionWakeTopLidOpen = keyframes`
  0%, 38% { transform: translateY(0); }
  100% { transform: translateY(-108%); }
`;

const exhibitionWakeBottomLidOpen = keyframes`
  0%, 38% { transform: translateY(0); }
  100% { transform: translateY(108%); }
`;

const exhibitionAlarmRing = keyframes`
  0%, 100% { transform: translate(-50%, -50%) rotate(-1.6deg); }
  28% { transform: translate(-50%, -50%) rotate(1.8deg); }
  55% { transform: translate(-50%, -50%) rotate(-1deg); }
  78% { transform: translate(-50%, -50%) rotate(1.2deg); }
`;

const exhibitionAlarmStop = keyframes`
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  35% { opacity: 1; transform: translate(-50%, -50%) scale(0.93); }
  100% { opacity: 0; transform: translate(-145%, -50%) scale(0.96); }
`;

const lightOrbFloat = keyframes`
  0% { opacity: 0; transform: translate(-42px, 86px) scale(0.55); }
  35% { opacity: 1; transform: translate(-4px, 22px) scale(1); }
  100% { opacity: 0.78; transform: translate(42px, -54px) scale(0.72); }
`;

const completeGlow = keyframes`
  0%, 100% { opacity: 0.42; transform: scale(0.92); }
  50% { opacity: 0.88; transform: scale(1.08); }
`;

const exhibitionDoorSwipeArrowNudge = keyframes`
  0%, 100% { transform: translateX(5px); }
  50% { transform: translateX(-7px); }
`;

const exhibitionDoorSwipePromptFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const EXHIBITION_DOOR_SWIPE_THRESHOLD_PX = 74;
const EXHIBITION_DOOR_SWIPE_MAX_DISTANCE_PX = 128;

const EXHIBITION_NAOTARO_PHOTO_FALLBACK = "/images/428出圖/拍照動物/黃金獵犬.png";
const EXHIBITION_FROG_PHOTO_FALLBACK = "/images/animals/青蛙_撲.png";
const EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY = "moment-exhibition-naotaro-photo";
const EXHIBITION_OFFICIAL_SITE_URL = "https://moments.mugio.studio";
const EXHIBITION_FROG_PHOTO_INTRO_TEXTS = [
  "完成街道上的傳單任務後，青蛙從紙箱裡跳了出來",
  "看著店員手忙腳亂地處理涼麵，青蛙也在櫃台旁跳來跳去",
  "蛋糕紙袋裡鑽出的青蛙，終於被完整拍下來了",
] as const;

type ExhibitionPhotoDiaryStage = "book" | "photo-slide" | "photo-detail" | "diary-unlock";

function isExhibitionPhotoDiaryStage(value: string | null): value is ExhibitionPhotoDiaryStage {
  return value === "book" || value === "photo-slide" || value === "photo-detail" || value === "diary-unlock";
}

type ExhibitionDiaryRestoreStage = "book" | "restoration";

function isExhibitionDiaryRestoreStage(
  value: string | null,
): value is ExhibitionDiaryRestoreStage {
  return value === "book" || value === "restoration";
}

type ExhibitionFrogDiaryStage = "book" | "catalog";

type ExhibitionStreetFrogStage = "event" | "diary";
type ExhibitionConvenienceFrogStage = "intro" | "route" | "event" | "diary";
type ExhibitionDessertFrogStage = "event" | "diary";
type ExhibitionDayOneRestStep = "rest-transition" | "wake-up";
type ExhibitionMorningRouteStep = "route-game" | "open-diary";

function isExhibitionFrogDiaryStage(
  value: string | null,
): value is ExhibitionFrogDiaryStage {
  return value === "book" || value === "catalog";
}

type ExhibitionInitialViewState = {
  phase: ExhibitionPhase;
  lineIndex: number;
  photoDiaryStage: ExhibitionPhotoDiaryStage;
  diaryRestoreStage: ExhibitionDiaryRestoreStage;
  diaryReadLineIndex: number | null;
  frogDiaryStage: ExhibitionFrogDiaryStage;
  dayOneRestStep: ExhibitionDayOneRestStep;
  morningRouteStep: ExhibitionMorningRouteStep;
  streetFrogStage: ExhibitionStreetFrogStage;
  convenienceFrogStage: ExhibitionConvenienceFrogStage;
  dessertFrogStage: ExhibitionDessertFrogStage;
  forgotLunchLineIndex: number;
  isOpeningTransitionVisible: boolean;
};

const exhibitionOpeningBlackFade = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const exhibitionOpeningCameraSettle = keyframes`
  0% {
    transform: translate3d(0, 22px, 0) scale(1.12);
    filter: brightness(1.08) saturate(0.9) blur(1px);
  }
  42% {
    transform: translate3d(0, 12px, 0) scale(1.075);
    filter: brightness(1.04) saturate(0.95) blur(0);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: brightness(1) saturate(1) blur(0);
  }
`;

const exhibitionOpeningLocationTitle = keyframes`
  0%, 24% {
    opacity: 0;
    transform: translateY(10px);
    letter-spacing: 0.08em;
  }
  40%, 76% {
    opacity: 1;
    transform: translateY(0);
    letter-spacing: 0.16em;
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
    letter-spacing: 0.2em;
  }
`;

const exhibitionMetroArrivalSettle = keyframes`
  0% {
    transform: translate3d(0, 18px, 0) scale(1.1);
    filter: brightness(1.08) saturate(0.9) blur(1.2px);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: brightness(1) saturate(1) blur(0);
  }
`;

const exhibitionDialogUiIn = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const exhibitionWorkDuskReveal = keyframes`
  0%, 8% { opacity: 0; }
  100% { opacity: 1; }
`;

// Reuse the mainline floating Bai / blank diary page composition and motion.
const exhibitionFloatingBaiDrift = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
`;

const exhibitionFloatingBaiGlow = keyframes`
  0%, 100% { opacity: 0.76; transform: scale(0.995); }
  50% { opacity: 1; transform: scale(1.015); }
`;

const exhibitionFloatingDiaryPageBack = keyframes`
  0%, 100% { transform: translateY(2px); }
  50% { transform: translateY(-5px); }
`;

const exhibitionFloatingDiaryPageMiddle = keyframes`
  0%, 100% { transform: translateY(-3px); }
  50% { transform: translateY(6px); }
`;

const exhibitionFloatingDiaryPageFront = keyframes`
  0%, 100% { transform: translateY(3px); }
  50% { transform: translateY(-7px); }
`;

const exhibitionBaiRoomCurtainReveal = keyframes`
  0% { transform: translateX(0); }
  12% { transform: translateX(0); }
  42% { transform: translateX(-18%); }
  100% { transform: translateX(-104%); }
`;

const exhibitionBaiRoomDoorLightReveal = keyframes`
  0% { opacity: 0; transform: scaleY(0.94); }
  12% { opacity: 0.75; transform: scaleY(0.94); }
  44% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0.28; transform: scaleY(1); }
`;

const getExhibitionBaiGlowLayerAnimation = (
  layer: (typeof BAI_ROOM_GLOW_1_BACKGROUND_LAYERS)[number],
  index: number,
) => {
  const animationName =
    layer.motion === "glow"
      ? exhibitionFloatingBaiGlow
      : layer.motion === "float-bai"
        ? exhibitionFloatingBaiDrift
        : layer.motion === "float-back"
          ? exhibitionFloatingDiaryPageBack
          : layer.motion === "float-middle"
            ? exhibitionFloatingDiaryPageMiddle
            : exhibitionFloatingDiaryPageFront;
  return `${animationName} ${layer.durationMs}ms ease-in-out ${index * -370}ms infinite both`;
};

const exhibitionBeigoBookPanelIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Keep these timings and transforms aligned with the mainline scene-51 reveal.
const exhibitionBeigoRevealWhiteBurst = keyframes`
  0% { opacity: 0.96; }
  18% { opacity: 0.9; }
  64% { opacity: 0.18; }
  100% { opacity: 0; }
`;

const exhibitionBeigoRevealLightBloom = keyframes`
  0% { opacity: 0.95; transform: translate(-50%, -50%) scale(0.58); filter: blur(2px); }
  32% { opacity: 0.86; transform: translate(-50%, -50%) scale(1); filter: blur(1px); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.68); filter: blur(8px); }
`;

const exhibitionBeigoRevealPagesSweep = keyframes`
  0% { opacity: 1; transform: translateY(-18px) scale(1.06); filter: brightness(1.3) blur(0.8px); }
  42% { opacity: 1; transform: translateY(-8px) scale(1.02); filter: brightness(1.12) blur(0); }
  100% { opacity: 0; transform: translateY(18px) scale(0.97); filter: brightness(1) blur(0); }
`;

const exhibitionBeigoRevealPagesSettle = keyframes`
  0% { opacity: 1; transform: translateY(-26px) scale(1.08) rotate(-1deg); filter: brightness(1.24) blur(0.8px); }
  48% { opacity: 0.92; transform: translateY(-8px) scale(1.02) rotate(0deg); filter: brightness(1.1) blur(0); }
  100% { opacity: 0; transform: translateY(20px) scale(0.98) rotate(1deg); filter: brightness(1) blur(0); }
`;

const exhibitionBeigoRevealStarsTwinkle = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.94); filter: brightness(1.35); }
  28% { opacity: 0.88; transform: translateY(0) scale(1); filter: brightness(1.5); }
  72% { opacity: 0.66; transform: translateY(-5px) scale(1.02); filter: brightness(1.24); }
  100% { opacity: 0.28; transform: translateY(-10px) scale(1.04); filter: brightness(1); }
`;

const NARRATIVE_PHASES: readonly ExhibitionNarrativePhase[] = [
  "departure-opening",
  "departure-plan",
  "metro-opening",
  "argument-flashback",
  "post-flashback-diary",
  "post-puzzle-metro",
  "post-flashback-metro",
  "work-arrival",
  "work-complete",
  "work-leave",
  "home-search",
  "bai-change-first",
  "bai-after-flashback",
  "morning-route-intro",
  "no-sunbeast-summary",
  "work-return",
  "convenience-photo-return",
  "dessert-transition",
  "home-final",
];

const EXHIBITION_OFFICE_AMBIENCE_PHASES: readonly ExhibitionPhase[] = [
  "office-opening",
  "street-office-arrival",
  "work-arrival",
  "box-game",
  "work-complete",
  "work-dusk",
  "work-value",
  "work-todo",
  "work-pack",
  "work-social",
  "work-files",
  "work-flow",
  "work-clicker",
  "convenience-work-resume",
];

const EXHIBITION_NARRATIVE_BACKGROUND_IMAGES = Array.from(
  new Set(
    NARRATIVE_PHASES.flatMap((phase) =>
      EXHIBITION_NARRATIVE_LINES[phase].map((line) => line.backgroundImage),
    ),
  ),
);

const EXHIBITION_HOME_TO_METRO_TRANSITION_POINTS = [
  {
    key: "home",
    visual: { label: "家", iconPath: "/images/icon/house.png" },
    positionPercent: 9,
  },
  {
    key: "metro-station",
    visual: { label: "捷運", iconPath: "/images/icon/mrt.png" },
    positionPercent: 50,
  },
] as const;

const EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS = [
  ...EXHIBITION_HOME_TO_METRO_TRANSITION_POINTS,
  {
    key: "company",
    visual: { label: "公司", iconPath: "/images/icon/company.png" },
    positionPercent: 91,
  },
] as const;

const EXHIBITION_STREET_TO_COMPANY_TRANSITION_POINTS = [
  {
    key: "street",
    visual: { label: "街道", iconPath: "/images/icon/street.png" },
    positionPercent: 9,
  },
  {
    key: "company",
    visual: { label: "公司", iconPath: "/images/icon/company.png" },
    positionPercent: 91,
  },
] as const;

const EXHIBITION_CONVENIENCE_TO_COMPANY_TRANSITION_POINTS = [
  {
    key: "convenience-store",
    visual: { label: "便利商店", iconPath: "/images/icon/mart.png" },
    positionPercent: 9,
  },
  {
    key: "company",
    visual: { label: "公司", iconPath: "/images/icon/company.png" },
    positionPercent: 91,
  },
] as const;

const METRO_BACKGROUND = "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg";
const METRO_DOG_FRAMES = [
  "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_1.png",
  "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_2.png",
] as const;
const METRO_DOG_TARGET_RECT_NORMALIZED = {
  x: 0.29,
  y: 0.51,
  width: 0.58,
  height: 0.2,
};
const CAMERA_COMIC = "/images/428出圖/漫畫格/第一章/相機.png";
const DIARY_IN_BAG_COMIC = "/images/428出圖/漫畫格/第一章/袋子裡的日記本.png";
const BEIGO_REVEAL_BOOK_COMIC = "/images/428出圖/特別演出/CH01_SC03_SE03_Book.png";
const BEIGO_REVEAL_STAND_BOOK_COMIC =
  "/images/428出圖/特別演出/CH01_SC02_SE03_Beigo_Stand_Book.png";
const BEIGO_RUSH_BAI_ROOM_COMIC =
  "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物_小白房間.png";
const BEIGO_REVEAL_BACKGROUND = "/images/428出圖/特別演出/Beigo_Reveal_Bg.png";
const EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES = {
  pageBehind: "/images/428出圖/特別演出/Beigo_Reveal_Page_Behind.png",
  page01: "/images/428出圖/特別演出/Beigo_Reveal_Page_01.png",
  page02: "/images/428出圖/特別演出/Beigo_Reveal_Page_02.png",
  page03: "/images/428出圖/特別演出/Beigo_Reveal_Page_03.png",
  stars: "/images/428出圖/特別演出/Beigo_Reveal_Star.png",
} as const;
const EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGE_URLS = Object.values(
  EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES,
);
const EXHIBITION_BAI_DIARY_PICKUP_BACKGROUND_FRAMES = [
  "/images/428出圖/20260822/發光小白/發光小白_展覽1.png",
  "/images/428出圖/20260822/發光小白/發光小白_展覽2.png",
  "/images/428出圖/20260822/發光小白/發光小白_展覽3.png",
  "/images/428出圖/20260822/發光小白/發光小白_展覽4.png",
] as const;
const EXHIBITION_BAI_DIARY_PICKUP_COMIC_FRAMES = [
  "/images/428出圖/20260822/發光小白/拿起日記1.png",
  "/images/428出圖/20260822/發光小白/拿起日記2.png",
  "/images/428出圖/20260822/發光小白/拿起日記3.png",
  "/images/428出圖/20260822/發光小白/拿起日記4.png",
  "/images/428出圖/20260822/發光小白/拿起日記5.png",
] as const;
const EXHIBITION_BAI_DIARY_PICKUP_IMAGE_URLS = [
  ...EXHIBITION_BAI_DIARY_PICKUP_BACKGROUND_FRAMES,
  ...EXHIBITION_BAI_DIARY_PICKUP_COMIC_FRAMES,
] as const;
const EXHIBITION_BAI_DIARY_PICKUP_FRAME_MS = 130;
const EXHIBITION_BAI_DIARY_PICKUP_COMPLETE_MS = 1700;

function ExhibitionBaiDiaryPickupSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [backgroundFrameIndex, setBackgroundFrameIndex] = useState(0);
  const [comicFrameIndex, setComicFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const backgroundTimeline = [
      { frameIndex: 1, delayMs: 360 },
      { frameIndex: 2, delayMs: 490 },
      { frameIndex: 3, delayMs: 620 },
      { frameIndex: 2, delayMs: 1110 },
      { frameIndex: 1, delayMs: 1240 },
      { frameIndex: 0, delayMs: 1370 },
    ] as const;
    const comicTimeline = [
      { frameIndex: 1, delayMs: 160 },
      { frameIndex: 0, delayMs: 320 },
      { frameIndex: 1, delayMs: 480 },
      { frameIndex: 2, delayMs: 650 },
      { frameIndex: 3, delayMs: 830 },
      { frameIndex: 4, delayMs: 1010 },
    ] as const;
    const sequenceTimers = [
      ...backgroundTimeline.map(({ frameIndex, delayMs }) =>
        window.setTimeout(() => setBackgroundFrameIndex(frameIndex), delayMs),
      ),
      ...comicTimeline.map(({ frameIndex, delayMs }) =>
        window.setTimeout(() => setComicFrameIndex(frameIndex), delayMs),
      ),
    ];
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_BAI_DIARY_PICKUP_COMPLETE_MS);

    return () => {
      sequenceTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={2}
      overflow="hidden"
      pointerEvents="none"
      data-exhibition-bai-diary-pickup="playing"
      data-exhibition-bai-background-frame={backgroundFrameIndex + 1}
      data-exhibition-bai-comic-frame={comicFrameIndex + 1}
    >
      {EXHIBITION_BAI_DIARY_PICKUP_BACKGROUND_FRAMES.map((imagePath, index) => (
        <img
          key={imagePath}
          src={imagePath}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            maxWidth: "none",
            objectFit: "cover",
            objectPosition: "center bottom",
            display: "block",
            opacity: backgroundFrameIndex === index ? 1 : 0,
            transition: `opacity ${EXHIBITION_BAI_DIARY_PICKUP_FRAME_MS}ms linear`,
            willChange: "opacity",
          }}
        />
      ))}

      <Flex
        position="absolute"
        left="50%"
        top="66px"
        w="89.3%"
        maxW="351px"
        transform="translateX(-50%)"
        filter="drop-shadow(0 8px 16px rgba(25, 23, 42, 0.3))"
      >
        {EXHIBITION_BAI_DIARY_PICKUP_COMIC_FRAMES.map((imagePath, index) => (
          <img
            key={imagePath}
            src={imagePath}
            alt={index === comicFrameIndex ? "小麥拿起發光的交換日記" : ""}
            aria-hidden={index === comicFrameIndex ? undefined : true}
            draggable={false}
            style={{
              position: index === 0 ? "relative" : "absolute",
              inset: 0,
              width: "100%",
              height: "auto",
              display: "block",
              opacity: comicFrameIndex === index ? 1 : 0,
            }}
          />
        ))}
      </Flex>
    </Flex>
  );
}

function DiaryInBagComicPanel() {
  return (
    <Flex
      position="absolute"
      left="50%"
      top="142px"
      zIndex={8}
      w="80%"
      maxW="290px"
      transform="translateX(-50%)"
      pointerEvents="none"
      animation={`${singleComicPanelFadeIn} 360ms ease-out both`}
      filter="drop-shadow(0 8px 14px rgba(33, 26, 22, 0.22))"
      data-exhibition-comic="diary-in-bag"
    >
      <img
        src={DIARY_IN_BAG_COMIC}
        alt="包包裡露出的日記本漫畫格"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </Flex>
  );
}
const GOLDEN_RETRIEVER_RUN_COMIC =
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_黃金獵犬.png";
const GOLDEN_RETRIEVER_DOOR_COMICS = [
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運3.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運２.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運１.png",
] as const;
const BEIGO_BAG_REVEAL_COMICS = [
  "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
] as const;
const FLASHBACK_FALL_COMIC_PANELS = [
  "/images/428出圖/追加作畫/漫畫格/踩到.png",
  "/images/428出圖/追加作畫/漫畫格/跌倒.png",
] as const;
const FLASHBACK_FALL_FULLSCREEN_FRAMES = [
  "/images/428出圖/追加作畫/小麥跌倒/小麥跌倒.jpg",
  "/images/428出圖/追加作畫/小麥跌倒/小麥跌倒_差分.jpg",
] as const;
const FLASHBACK_FALL_FIRST_FRAME_MS = 360;
const FLASHBACK_FALL_SECOND_FRAME_MS = 560;
const EXHIBITION_BEIGO_BOOK_STAGE_MS = 1800;
const EXHIBITION_BEIGO_REVEAL_STAGE_MS = 1500;
const EXHIBITION_BEIGO_BAG_PEEK_DELAY_MS = 420;
const EXHIBITION_BEIGO_BAG_FINAL_DELAY_MS = 980;
const EXHIBITION_BEIGO_BAG_COMPLETE_MS = 1680;
const FLASHBACK_DOOR_CLOSE_COMIC = "/images/428出圖/追加作畫/漫畫格/關門.png";
const EXHIBITION_OPENING_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const EXHIBITION_OFFICE_BACKGROUND = "/images/428出圖/背景/公司_白天.jpg";
const EXHIBITION_OFFICE_WORK_FRAMES = [
  "/images/work/Office_Work_Day_Focus_01.png",
  "/images/work/Office_Work_Day_Focus_02.png",
  "/images/work/Office_Work_Day_Focus_03.png",
  "/images/work/Office_Work_Day_Focus_02.png",
] as const;
const EXHIBITION_OFFICE_WORK_LOOK_FRAME = "/images/work/Office_Work_Day_Look.png";
const EXHIBITION_OFFICE_WORK_DUSK_FRAMES = [
  "/images/work/Office_Work_Dusk_Focus_01.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
  "/images/work/Office_Work_Dusk_Focus_03.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
] as const;
const EXHIBITION_OPENING_BLACK_HOLD_MS = 420;
const EXHIBITION_OPENING_BLACK_FADE_MS = 320;
const EXHIBITION_OPENING_CAMERA_DURATION_MS = OPENING_CLOUD_BURST_DURATION_MS + 800;
const EXHIBITION_OPENING_ESTABLISH_HOLD_MS = 360;
const EXHIBITION_LOCATION_TRANSITION_MS = 1650;
const EXHIBITION_MAINLINE_DOOR_TRANSITION_MS = 620;
const EXHIBITION_BAI_ROOM_FULL_IMAGE_INTRO_MS = 1380;
const EXHIBITION_OFFICE_WORK_START_MS = EXHIBITION_LOCATION_TRANSITION_MS;
const EXHIBITION_OFFICE_LOOK_DELAY_MS = 3350;
const EXHIBITION_OFFICE_CONTINUE_DELAY_MS = 3620;
const EXHIBITION_OFFICE_OPENING_DURATION_MS = 4620;
const EXHIBITION_WORK_DUSK_DURATION_MS = 4200;
const EXHIBITION_DAY_ONE_REST_DURATION_MS = 2500;
const EXHIBITION_WAKE_OPEN_DURATION_MS = 1250;
const EXHIBITION_WAKE_PROMPT_DELAY_MS = 1150;
const EXHIBITION_WAKE_EXIT_DURATION_MS = 620;
const EXHIBITION_REST_BACKGROUND = "/images/428出圖/背景/客廳_晚上.jpg";
const EXHIBITION_WAKE_BACKGROUND = "/images/428出圖/20260805/起床.jpg";
const EXHIBITION_ALARM_COMIC = "/images/428出圖/漫畫格/第一章/響了的鬧鐘.png";
const EXHIBITION_MAI_CHARACTER_INTRO_CARD: CharacterIntroCard = {
  ...MAI_CHARACTER_INTRO_CARD,
  sceneId: "exhibition-mai-intro",
  descriptionLines: [
    "剛出社會兩年的職場新鮮人",
    "認真踏實，愛買折價便當，有一個叫做小白的室友",
  ],
  spriteSheetPath: "/images/428出圖/立繪/小麥/19_釋懷.png",
  spriteCols: 1,
  spriteRows: 1,
  spriteFrameIndex: 0,
  theme: {
    topBar: "rgba(246, 174, 157, 0.98)",
    band: "rgba(183, 141, 128, 0.94)",
    bandBorder: "rgba(139, 94, 82, 0.76)",
    button: "#A86E61",
    buttonText: "#FFF8F4",
  },
};

function isNarrativePhase(phase: ExhibitionPhase): phase is ExhibitionNarrativePhase {
  return NARRATIVE_PHASES.includes(phase as ExhibitionNarrativePhase);
}

function getInitialExhibitionViewState(
  initialPreview: ExhibitionPhase | null,
  initialSceneStep: string | null,
): ExhibitionInitialViewState {
  const phase = initialPreview ?? "departure-opening";
  const narrativeLines = isNarrativePhase(phase)
    ? EXHIBITION_NARRATIVE_LINES[phase]
    : null;
  const requestedLineIndex = narrativeLines?.findIndex(
    (line) => line.id === initialSceneStep,
  ) ?? -1;
  const diaryReadLineIndex = getExhibitionDiaryReadLineIndex(initialSceneStep);
  const isFrogDiaryStep = isExhibitionFrogDiaryStep(initialSceneStep);

  return {
    phase,
    lineIndex: requestedLineIndex >= 0 ? requestedLineIndex : 0,
    photoDiaryStage:
      phase === "dog-photo-diary" && isExhibitionPhotoDiaryStage(initialSceneStep)
        ? initialSceneStep
        : "book",
    diaryRestoreStage:
      phase === "diary-restore" && diaryReadLineIndex !== null
        ? "restoration"
        : phase === "diary-restore" && isExhibitionDiaryRestoreStage(initialSceneStep)
          ? initialSceneStep
        : "book",
    diaryReadLineIndex,
    frogDiaryStage:
      phase === "frog-diary-fragment" && Boolean(initialSceneStep) && initialSceneStep !== "book"
        ? "catalog"
        : phase === "frog-diary-fragment" && isExhibitionFrogDiaryStage(initialSceneStep)
          ? initialSceneStep
        : "book",
    dayOneRestStep:
      phase === "day-one-rest" && isExhibitionDayOneRestStep(initialSceneStep)
        ? initialSceneStep
        : "rest-transition",
    morningRouteStep:
      phase === "morning-route" &&
      (initialSceneStep === "route-game" || initialSceneStep === "open-diary")
        ? initialSceneStep
        : "route-game",
    streetFrogStage:
      phase === "street-flyer" && isFrogDiaryStep ? "diary" : "event",
    convenienceFrogStage:
      phase !== "convenience-clerk"
        ? "intro"
        : initialSceneStep?.startsWith("intro-")
          ? "intro"
          : initialSceneStep === "route"
            ? "route"
            : isFrogDiaryStep
              ? "diary"
              : "event",
    dessertFrogStage:
      phase === "frog-dessert" && isFrogDiaryStep ? "diary" : "event",
    forgotLunchLineIndex: getExhibitionForgotLunchLineIndex(initialSceneStep),
    isOpeningTransitionVisible: initialPreview === null,
  };
}

function replaceExhibitionPhaseInUrl(phase: ExhibitionPhase, sceneStep?: string) {
  const url = new URL(window.location.href);
  const currentSceneStep = url.searchParams.get("sceneStep");
  if (
    url.searchParams.get("preview") === phase &&
    currentSceneStep === (sceneStep ?? null)
  ) {
    return;
  }
  url.searchParams.set("preview", phase);
  if (sceneStep) {
    url.searchParams.set("sceneStep", sceneStep);
  } else {
    url.searchParams.delete("sceneStep");
  }
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function ExhibitionOpeningTransition({ onComplete }: { onComplete: () => void }) {
  const [hasCloudOpeningStarted, setHasCloudOpeningStarted] = useState(false);

  useEffect(() => {
    const cloudOpeningTimer = window.setTimeout(() => {
      setHasCloudOpeningStarted(true);
    }, EXHIBITION_OPENING_BLACK_HOLD_MS);
    const completeTimer = window.setTimeout(
      onComplete,
      EXHIBITION_OPENING_BLACK_HOLD_MS +
        EXHIBITION_OPENING_CAMERA_DURATION_MS +
        EXHIBITION_OPENING_ESTABLISH_HOLD_MS,
    );

    return () => {
      window.clearTimeout(cloudOpeningTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#242326"
      data-exhibition-opening-stage={hasCloudOpeningStarted ? "establishing" : "black"}
    >
      <Box
        position="absolute"
        inset="0"
        bgImage={`url("${EXHIBITION_OPENING_BACKGROUND}")`}
        bgSize="cover"
        backgroundPosition="center bottom"
        bgRepeat="no-repeat"
        transformOrigin="50% 56%"
        animation={
          hasCloudOpeningStarted
            ? `${exhibitionOpeningCameraSettle} ${EXHIBITION_OPENING_CAMERA_DURATION_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`
            : undefined
        }
        willChange="transform, filter"
      />
      {hasCloudOpeningStarted ? <OpeningCloudBurstOverlay /> : null}
      {hasCloudOpeningStarted ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={82}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Flex
            direction="column"
            alignItems="center"
            color="#5E554F"
            textAlign="center"
            textShadow="0 2px 14px rgba(255,255,255,0.94), 0 1px 2px rgba(255,255,255,0.8)"
            animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_OPENING_CAMERA_DURATION_MS}ms ease-in-out both`}
          >
            <Flex alignItems="center" justifyContent="center" gap="16px">
              <Box w="52px" h="1px" bgColor="rgba(94,85,79,0.42)" />
              <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                家門外
              </Text>
              <Box w="52px" h="1px" bgColor="rgba(94,85,79,0.42)" />
            </Flex>
            <Text mt="12px" fontSize="13px" fontWeight="800" lineHeight="1" letterSpacing="0.32em" ml="0.32em">
              早晨
            </Text>
          </Flex>
        </Flex>
      ) : null}
      <Box
        position="absolute"
        inset="0"
        zIndex={83}
        bgColor="#000"
        pointerEvents="none"
        animation={
          hasCloudOpeningStarted
            ? `${exhibitionOpeningBlackFade} ${EXHIBITION_OPENING_BLACK_FADE_MS}ms ease-out both`
            : undefined
        }
      />
    </Flex>
  );
}

function CluePaper({ text }: { text: string }) {
  return (
    <Flex
      position="absolute"
      zIndex={5}
      left="50%"
      top="102px"
      w="calc(100% - 62px)"
      minH="88px"
      px="20px"
      py="15px"
      direction="column"
      justifyContent="center"
      transform="translateX(-50%) rotate(-1deg)"
      bgColor="rgba(255,252,241,0.96)"
      border="1px solid rgba(134,101,72,0.32)"
      borderRadius="4px"
      boxShadow="0 14px 24px rgba(53,38,27,0.25)"
      animation={`${clueCardIn} 420ms ease both`}
      pointerEvents="none"
    >
      <Text color="#A57C58" fontSize="10px" fontWeight="900" letterSpacing="0.14em">
        日記線索
      </Text>
      <Text mt="6px" color="#665044" fontSize="15px" fontWeight="800" lineHeight="1.5">
        {text}
      </Text>
    </Flex>
  );
}

function ExhibitionFlashbackFallFullscreenSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    playFmodGameEvent("characterFall");
    const secondFrameTimer = window.setTimeout(() => {
      setFrameIndex(1);
    }, FLASHBACK_FALL_FIRST_FRAME_MS);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, FLASHBACK_FALL_FIRST_FRAME_MS + FLASHBACK_FALL_SECOND_FRAME_MS);

    return () => {
      window.clearTimeout(secondFrameTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={40}
      overflow="hidden"
      bgColor="#D6C3A9"
      pointerEvents="none"
      data-exhibition-flashback-fall-fullscreen={frameIndex + 1}
    >
      <img
        src={FLASHBACK_FALL_FULLSCREEN_FRAMES[frameIndex]}
        alt={frameIndex === 0 ? "跌坐在地上的小麥" : "小白趕來查看跌倒的小麥"}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </Flex>
  );
}

function ExhibitionBeigoBagRevealSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<"bag" | "peek" | "final">("bag");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    playGameSfx("comicPanelPop");
    const peekTimer = window.setTimeout(() => {
      playGameSfx("comicPanelPop");
      setStage("peek");
    }, EXHIBITION_BEIGO_BAG_PEEK_DELAY_MS);
    const finalTimer = window.setTimeout(() => {
      setStage("final");
    }, EXHIBITION_BEIGO_BAG_FINAL_DELAY_MS);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_BEIGO_BAG_COMPLETE_MS);

    return () => {
      window.clearTimeout(peekTimer);
      window.clearTimeout(finalTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={7}
      overflow="hidden"
      pointerEvents="none"
      data-exhibition-beigo-bag-reveal={stage}
    >
      <Flex
        position="absolute"
        top="80px"
        right="0"
        zIndex={7}
        w="280px"
        h="170px"
        overflow="hidden"
        animation={`${panelFromRight} 380ms ease both`}
      >
        <img
          src={BEIGO_BAG_REVEAL_COMICS[0]}
          alt="蠕動的袋子"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </Flex>

      <Flex
        position="absolute"
        top="280px"
        left="0"
        zIndex={8}
        w="280px"
        h="170px"
        overflow="hidden"
        animation={`${panelFromLeft} 380ms ease ${EXHIBITION_BEIGO_BAG_PEEK_DELAY_MS}ms both`}
      >
        <img
          src={BEIGO_BAG_REVEAL_COMICS[1]}
          alt="從袋子裡探頭出來的小貝狗"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
        {stage === "final" ? (
          <img
            src={BEIGO_BAG_REVEAL_COMICS[2]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              animation: `${exhibitionBeigoPeekOut} 260ms ease-out both`,
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  );
}

function ExhibitionBeigoDiaryRevealSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<"book" | "reveal">("book");
  const [isStandBookVisible, setIsStandBookVisible] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const standBookTimer = window.setTimeout(() => {
      setIsStandBookVisible(true);
    }, 660);
    const revealTimer = window.setTimeout(() => {
      playGameSfx("beigoDiaryReveal");
      setStage("reveal");
    }, EXHIBITION_BEIGO_BOOK_STAGE_MS);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_BEIGO_BOOK_STAGE_MS + EXHIBITION_BEIGO_REVEAL_STAGE_MS);

    return () => {
      window.clearTimeout(standBookTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={40}
      overflow="hidden"
      pointerEvents="none"
      data-exhibition-beigo-diary-reveal={stage}
    >
      {stage === "book" ? (
        <Flex
          position="absolute"
          top="304px"
          left="8%"
          w="84%"
          h="210px"
          zIndex={2}
          overflow="hidden"
          animation={`${exhibitionBeigoBookPanelIn} 240ms ease both`}
        >
          <img
            src={BEIGO_REVEAL_BOOK_COMIC}
            alt="翻開的交換日記"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <img
            src={BEIGO_REVEAL_STAND_BOOK_COMIC}
            alt="小貝狗跑上交換日記"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: isStandBookVisible ? 1 : 0,
              transition: "opacity 320ms ease",
            }}
          />
        </Flex>
      ) : (
        <Flex
          position="absolute"
          inset="0"
          overflow="hidden"
          bgImage={`url("${BEIGO_REVEAL_BACKGROUND}")`}
          bgSize="cover"
          backgroundPosition="center"
          bgRepeat="no-repeat"
        >
          <Flex
            position="absolute"
            inset="0"
            zIndex={1}
            animation={`${exhibitionBeigoRevealStarsTwinkle} 1500ms ease-out both`}
          >
            <img
              src={EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES.stars}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Flex>
          <Flex
            position="absolute"
            inset="0"
            zIndex={2}
            animation={`${exhibitionBeigoRevealPagesSweep} 1320ms cubic-bezier(0.2, 0.78, 0.24, 1) both`}
          >
            <img
              src={EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES.pageBehind}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Flex>
          <Flex
            position="absolute"
            inset="0"
            zIndex={3}
            animation={`${exhibitionBeigoRevealPagesSettle} 1420ms cubic-bezier(0.18, 0.76, 0.22, 1) both`}
          >
            <img
              src={EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES.page01}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Flex>
          <Flex
            position="absolute"
            inset="0"
            zIndex={4}
            animation={`${exhibitionBeigoRevealPagesSweep} 1380ms cubic-bezier(0.18, 0.76, 0.22, 1) 60ms both`}
          >
            <img
              src={EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES.page02}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Flex>
          <Flex
            position="absolute"
            inset="0"
            zIndex={5}
            animation={`${exhibitionBeigoRevealPagesSettle} 1340ms cubic-bezier(0.18, 0.76, 0.22, 1) 120ms both`}
          >
            <img
              src={EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGES.page03}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Flex>
          <Flex
            position="absolute"
            inset="0"
            zIndex={6}
            bg="rgba(255,255,255,0.94)"
            mixBlendMode="screen"
            animation={`${exhibitionBeigoRevealWhiteBurst} 980ms ease-out both`}
          />
          <Flex
            position="absolute"
            left="50%"
            top="56%"
            w="520px"
            h="520px"
            zIndex={7}
            transform="translate(-50%, -50%)"
            bg="radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(188,226,255,0.74) 26%, rgba(125,152,255,0.26) 48%, rgba(255,255,255,0) 74%)"
            mixBlendMode="screen"
            animation={`${exhibitionBeigoRevealLightBloom} 1320ms ease-out both`}
          />
        </Flex>
      )}
    </Flex>
  );
}

function ExhibitionMainlineDoorTransition({ onComplete }: { onComplete: () => void }) {
  const [doorPhase, setDoorPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-start",
  );
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 完整沿用主線 scene-40：180ms 開門、420ms 關門、620ms 進入玄關對白。
    const openDoorTimer = window.setTimeout(() => {
      playFmodGameEvent("roomDoorOpen");
      setDoorPhase("opened");
    }, 180);
    const closeDoorTimer = window.setTimeout(() => {
      playFmodGameEvent("roomDoorClose");
      setDoorPhase("closed-end");
    }, 420);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_MAINLINE_DOOR_TRANSITION_MS);

    return () => {
      window.clearTimeout(openDoorTimer);
      window.clearTimeout(closeDoorTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      pointerEvents="none"
      position="absolute"
      inset="0"
      zIndex={20}
      bgColor="rgba(14,14,18,0.92)"
      alignItems="center"
      justifyContent="center"
      data-exhibition-transition="mainline-door"
    >
      <Flex
        w="82%"
        maxW="320px"
        borderRadius="12px"
        overflow="hidden"
        border="2px solid rgba(255,255,255,0.28)"
        boxShadow="0 10px 24px rgba(0,0,0,0.38)"
      >
        <img
          src={
            doorPhase === "opened"
              ? "/images/背景/玄關_開門.jpg"
              : "/images/背景/玄關_關門.jpg"
          }
          alt={doorPhase === "opened" ? "玄關門打開" : "玄關門關上"}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Flex>
    </Flex>
  );
}

function ExhibitionDoorSwipeInteraction({
  closedImage,
  openImage,
  instruction = "往左滑開門",
  promptDelayMs = 520,
  advanceDelayMs = 560,
  onComplete,
}: {
  closedImage: string;
  openImage: string;
  instruction?: string;
  promptDelayMs?: number;
  advanceDelayMs?: number;
  onComplete: () => void;
}) {
  const [doorPhase, setDoorPhase] = useState<"waiting" | "prompt" | "opened">(
    "waiting",
  );
  const [dragDistance, setDragDistance] = useState(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const completedRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const interactionRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const promptTimer = window.setTimeout(() => {
      setDoorPhase("prompt");
    }, promptDelayMs);
    return () => window.clearTimeout(promptTimer);
  }, [promptDelayMs]);

  useEffect(() => {
    if (doorPhase === "prompt") {
      interactionRef.current?.focus();
    }
  }, [doorPhase]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
    },
    [],
  );

  const completeDoorSwipe = useCallback(() => {
    if (doorPhase !== "prompt" || completedRef.current) return;
    completedRef.current = true;
    playFmodGameEvent("roomDoorOpen");
    pointerStartRef.current = null;
    setDragDistance(EXHIBITION_DOOR_SWIPE_THRESHOLD_PX);
    setDoorPhase("opened");
    advanceTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current();
      advanceTimerRef.current = null;
    }, advanceDelayMs);
  }, [advanceDelayMs, doorPhase]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (doorPhase !== "prompt") return;
      event.preventDefault();
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [doorPhase],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (doorPhase !== "prompt") return;
      const pointerStart = pointerStartRef.current;
      if (!pointerStart) return;
      event.preventDefault();
      setDragDistance(
        Math.min(
          EXHIBITION_DOOR_SWIPE_MAX_DISTANCE_PX,
          Math.max(0, pointerStart.x - event.clientX),
        ),
      );
    },
    [doorPhase],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (doorPhase !== "prompt") return;
      const pointerStart = pointerStartRef.current;
      if (!pointerStart) return;
      const finalDistance = Math.min(
        EXHIBITION_DOOR_SWIPE_MAX_DISTANCE_PX,
        Math.max(0, pointerStart.x - event.clientX),
      );
      pointerStartRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (finalDistance >= EXHIBITION_DOOR_SWIPE_THRESHOLD_PX) {
        completeDoorSwipe();
        return;
      }
      setDragDistance(0);
    },
    [completeDoorSwipe, doorPhase],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (
        doorPhase !== "prompt" ||
        (event.key !== "ArrowLeft" && event.key !== "Enter" && event.key !== " ")
      ) {
        return;
      }
      event.preventDefault();
      completeDoorSwipe();
    },
    [completeDoorSwipe, doorPhase],
  );

  const doorSwipeProgress =
    doorPhase === "opened"
      ? 1
      : Math.min(1, dragDistance / EXHIBITION_DOOR_SWIPE_THRESHOLD_PX);

  return (
    <Flex
      ref={interactionRef}
      position="absolute"
      inset="0"
      zIndex={24}
      role="button"
      tabIndex={doorPhase === "prompt" ? 0 : -1}
      aria-label={instruction}
      data-no-story-advance="true"
      data-exhibition-door-swipe={doorPhase}
      cursor={doorPhase === "prompt" ? "grab" : "default"}
      touchAction="none"
      outline="none"
      bgImage={`url("${closedImage}")`}
      bgSize="cover"
      backgroundPosition="center bottom"
      bgRepeat="no-repeat"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      _active={{ cursor: doorPhase === "prompt" ? "grabbing" : "default" }}
    >
      <Flex
        position="absolute"
        inset="0"
        pointerEvents="none"
        bgImage={`url("${openImage}")`}
        bgSize="cover"
        backgroundPosition="center bottom"
        bgRepeat="no-repeat"
        opacity={doorSwipeProgress}
        transition={
          doorPhase === "opened" || dragDistance === 0 ? "opacity 180ms ease-out" : "none"
        }
      />
      <Flex
        position="absolute"
        inset="0"
        pointerEvents="none"
        bg="linear-gradient(180deg, rgba(21,17,14,0.08), rgba(21,17,14,0.36))"
        opacity={
          doorPhase === "opened" ? 0 : Math.max(0.16, 0.42 - doorSwipeProgress * 0.22)
        }
        transition="opacity 180ms ease"
      />
      <Flex
        position="absolute"
        left="0"
        right="0"
        top="calc(52% + 40px)"
        zIndex={1}
        pointerEvents="none"
        alignItems="center"
        justifyContent="center"
        opacity={
          doorPhase === "prompt" ? Math.max(0.18, 1 - doorSwipeProgress * 1.2) : 0
        }
        transform={`translate(-${Math.min(34, dragDistance * 0.38)}px, -50%)`}
        transition={
          dragDistance === 0
            ? "opacity 180ms ease, transform 220ms ease"
            : "opacity 180ms ease"
        }
      >
        <Flex
          h="48px"
          px="18px"
          borderRadius="999px"
          bgColor="rgba(60, 44, 34, 0.82)"
          border="1px solid rgba(255, 244, 230, 0.4)"
          boxShadow="0 12px 26px rgba(32, 22, 16, 0.22)"
          alignItems="center"
          gap="10px"
          animation={`${exhibitionDoorSwipePromptFloat} 1.8s ease-in-out infinite`}
        >
          <Flex
            w="30px"
            h="30px"
            borderRadius="999px"
            bgColor="rgba(255, 244, 230, 0.18)"
            alignItems="center"
            justifyContent="center"
            animation={`${exhibitionDoorSwipeArrowNudge} 1.05s ease-in-out infinite`}
          >
            <IoArrowBack color="#FFF4E6" size={22} />
          </Flex>
          <Text color="#FFF4E6" fontSize="15px" fontWeight="800" lineHeight="1">
            {instruction}
          </Text>
        </Flex>
      </Flex>
      <Flex
        position="absolute"
        left="0"
        right="0"
        top="calc(52% + 78px)"
        zIndex={1}
        pointerEvents="none"
        alignItems="center"
        justifyContent="center"
        opacity={
          doorPhase === "prompt" ? Math.max(0.16, 0.76 - doorSwipeProgress * 0.7) : 0
        }
        transition="opacity 180ms ease"
      >
        <Flex
          w="154px"
          h="4px"
          borderRadius="999px"
          bgColor="rgba(255, 244, 230, 0.28)"
          overflow="hidden"
        >
          <Flex
            h="100%"
            w={`${Math.max(18, doorSwipeProgress * 154)}px`}
            borderRadius="999px"
            bgColor="#FFF4E6"
            transition={dragDistance === 0 ? "width 180ms ease" : "none"}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

function isExhibitionDayOneRestStep(
  value: string | null | undefined,
): value is ExhibitionDayOneRestStep {
  return value === "rest-transition" || value === "wake-up";
}

function ExhibitionDayOneRestTransition({
  initialStep,
  onStepChange,
  onComplete,
}: {
  initialStep?: string | null;
  onStepChange: (step: ExhibitionDayOneRestStep) => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<ExhibitionDayOneRestStep>(() =>
    isExhibitionDayOneRestStep(initialStep) ? initialStep : "rest-transition",
  );
  const [isWakePromptReady, setIsWakePromptReady] = useState(false);
  const [isAlarmStopping, setIsAlarmStopping] = useState(false);

  const moveToStep = useCallback((nextStep: ExhibitionDayOneRestStep) => {
    setStep(nextStep);
    onStepChange(nextStep);
  }, [onStepChange]);

  useEffect(() => {
    if (step !== "rest-transition") return;
    const restTimer = window.setTimeout(() => {
      moveToStep("wake-up");
    }, EXHIBITION_DAY_ONE_REST_DURATION_MS);
    return () => window.clearTimeout(restTimer);
  }, [moveToStep, step]);

  useEffect(() => {
    if (step !== "wake-up") return;
    setIsWakePromptReady(false);
    const alarmTimer = window.setTimeout(() => {
      playFmodGameEvent("clockAlarm");
    }, 80);
    const promptTimer = window.setTimeout(() => {
      setIsWakePromptReady(true);
    }, EXHIBITION_WAKE_PROMPT_DELAY_MS);
    return () => {
      window.clearTimeout(alarmTimer);
      window.clearTimeout(promptTimer);
      stopFmodWebEvent();
    };
  }, [step]);

  useEffect(() => {
    if (!isAlarmStopping) return;
    const exitTimer = window.setTimeout(onComplete, EXHIBITION_WAKE_EXIT_DURATION_MS);
    return () => window.clearTimeout(exitTimer);
  }, [isAlarmStopping, onComplete]);

  const handleAlarmStop = () => {
    if (!isWakePromptReady || isAlarmStopping) return;
    stopFmodWebEvent();
    setIsAlarmStopping(true);
  };

  if (step === "rest-transition") {
    return (
      <Flex
        position="absolute"
        inset="0"
        overflow="hidden"
        bgColor="#111018"
        bgImage={`url("${EXHIBITION_REST_BACKGROUND}")`}
        bgSize="cover"
        backgroundPosition="center bottom"
        aria-label="第一天結束，休息"
        data-exhibition-day-one-step="rest-transition"
      >
        <Box
          position="absolute"
          inset="0"
          bgColor="#090910"
          opacity={0}
          animation={`${exhibitionRestDarken} ${EXHIBITION_DAY_ONE_REST_DURATION_MS}ms ease forwards`}
        />
        <Box
          position="absolute"
          left="-8%"
          right="-8%"
          top="-4%"
          h="58%"
          zIndex={2}
          bgColor="#090910"
          clipPath="ellipse(88% 100% at 50% 0%)"
          animation={`${exhibitionRestTopLidClose} 1280ms cubic-bezier(0.45, 0, 0.18, 1) forwards`}
        />
        <Box
          position="absolute"
          left="-8%"
          right="-8%"
          bottom="-4%"
          h="58%"
          zIndex={2}
          bgColor="#090910"
          clipPath="ellipse(88% 100% at 50% 100%)"
          animation={`${exhibitionRestBottomLidClose} 1280ms cubic-bezier(0.45, 0, 0.18, 1) forwards`}
        />
        <Flex
          position="absolute"
          inset="0"
          zIndex={3}
          direction="column"
          alignItems="center"
          justifyContent="center"
          color="#F7EEE0"
          textAlign="center"
          animation={`${exhibitionRestTitleIn} ${EXHIBITION_DAY_ONE_REST_DURATION_MS}ms ease both`}
        >
          <Text fontSize="31px" fontWeight="900" letterSpacing="0.12em" ml="0.12em">
            第一天結束
          </Text>
          <Text mt="9px" fontSize="15px" fontWeight="800" letterSpacing="0.36em" ml="0.36em" opacity={0.82}>
            休息
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex
      as="button"
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#CFC7A9"
      bgImage={`url("${EXHIBITION_WAKE_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center"
      cursor={isWakePromptReady && !isAlarmStopping ? "pointer" : "default"}
      onClick={handleAlarmStop}
      aria-label="關掉鬧鐘，讓小麥起床"
      data-exhibition-day-one-step="wake-up"
    >
      <Box
        position="absolute"
        inset="0"
        zIndex={2}
        bgColor="#090910"
        animation={`${exhibitionWakeBlackOpen} ${EXHIBITION_WAKE_OPEN_DURATION_MS}ms ease forwards`}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        top="-4%"
        h="58%"
        zIndex={3}
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 0%)"
        animation={`${exhibitionWakeTopLidOpen} ${EXHIBITION_WAKE_OPEN_DURATION_MS}ms cubic-bezier(0.24, 0.74, 0.22, 1) forwards`}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left="-8%"
        right="-8%"
        bottom="-4%"
        h="58%"
        zIndex={3}
        bgColor="#090910"
        clipPath="ellipse(88% 100% at 50% 100%)"
        animation={`${exhibitionWakeBottomLidOpen} ${EXHIBITION_WAKE_OPEN_DURATION_MS}ms cubic-bezier(0.24, 0.74, 0.22, 1) forwards`}
        pointerEvents="none"
      />
      <Flex
        position="absolute"
        left="50%"
        top="47%"
        zIndex={4}
        w="292px"
        maxW="calc(100% - 56px)"
        alignItems="center"
        justifyContent="center"
        filter="drop-shadow(0 18px 24px rgba(0,0,0,0.38))"
        animation={
          isAlarmStopping
            ? `${exhibitionAlarmStop} ${EXHIBITION_WAKE_EXIT_DURATION_MS}ms cubic-bezier(0.2, 0.72, 0.18, 1) both`
            : `${exhibitionAlarmRing} 980ms ease-in-out infinite`
        }
        pointerEvents="none"
      >
        <img
          src={EXHIBITION_ALARM_COMIC}
          alt="響鈴的鬧鐘"
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Flex>
      <Flex
        position="absolute"
        left="0"
        right="0"
        top="calc(47% + 138px)"
        zIndex={5}
        justifyContent="center"
        px="24px"
        opacity={isWakePromptReady && !isAlarmStopping ? 1 : 0}
        transition="opacity 280ms ease"
        pointerEvents="none"
      >
        <Text
          color="rgba(255,255,255,0.96)"
          fontSize="14px"
          fontWeight="800"
          px="18px"
          py="8px"
          borderRadius="999px"
          border="1px solid rgba(255,255,255,0.38)"
          bgColor="rgba(0,0,0,0.34)"
          textShadow="0 2px 10px rgba(0,0,0,0.72)"
        >
          關掉鬧鐘
        </Text>
      </Flex>
    </Flex>
  );
}

function NarrativeScene({
  phase,
  lineIndex,
  onAdvance,
}: {
  phase: ExhibitionNarrativePhase;
  lineIndex: number;
  onAdvance: () => void;
}) {
  const lines = EXHIBITION_NARRATIVE_LINES[phase];
  const line = lines[Math.min(lineIndex, lines.length - 1)];
  const isNarration = line.speaker === "旁白";
  const isInnerThought = Boolean(line.isInnerThought);
  const [typingMode] = useState(loadDialogTypingMode);
  const shouldPlayLocationTransition = Boolean(line.locationTransition);
  const [completedLocationTransitionLineId, setCompletedLocationTransitionLineId] = useState<string | null>(null);
  const shouldPlayAutomaticDoorTransition = Boolean(line.automaticDoorTransition);
  const [completedAutomaticDoorLineId, setCompletedAutomaticDoorLineId] = useState<string | null>(null);
  const shouldPlayBaiRoomFullImageIntro = Boolean(line.baiRoomFullImageIntro);
  const [completedBaiRoomFullImageIntroLineId, setCompletedBaiRoomFullImageIntroLineId] =
    useState<string | null>(null);
  const [isFallFullscreenPlaying, setIsFallFullscreenPlaying] = useState(false);
  const [isBeigoDiaryRevealPlaying, setIsBeigoDiaryRevealPlaying] = useState(false);
  const [isBaiDiaryPickupCompleting, setIsBaiDiaryPickupCompleting] = useState(false);
  const [completedBeigoBagRevealLineId, setCompletedBeigoBagRevealLineId] =
    useState<string | null>(null);
  const [activeDoorSwipeLineId, setActiveDoorSwipeLineId] = useState<string | null>(null);
  const [isNarrativeAvatarExiting, setIsNarrativeAvatarExiting] = useState(false);
  const narrativeAvatarExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLocationTransitionPlaying =
    shouldPlayLocationTransition && completedLocationTransitionLineId !== line.id;
  const isAutomaticDoorTransitionPlaying =
    shouldPlayAutomaticDoorTransition && completedAutomaticDoorLineId !== line.id;
  const isBaiRoomFullImageIntroPlaying =
    shouldPlayBaiRoomFullImageIntro && completedBaiRoomFullImageIntroLineId !== line.id;
  const isBeigoBagRevealPlaying =
    Boolean(line.beigoBagRevealSequence) && completedBeigoBagRevealLineId !== line.id;
  const isIntroTransitionPlaying =
    isLocationTransitionPlaying ||
    isAutomaticDoorTransitionPlaying ||
    isBaiRoomFullImageIntroPlaying ||
    isBeigoBagRevealPlaying;
  const isDoorSwipeInteractionPlaying =
    Boolean(line.doorSwipeInteraction) && activeDoorSwipeLineId === line.id;
  const [displayedAvatarFrameIndex, setDisplayedAvatarFrameIndex] = useState(
    line.avatar?.frameSequence?.[0] ?? line.avatar?.frameIndex,
  );

  useEffect(
    () => () => {
      if (narrativeAvatarExitTimerRef.current) {
        clearTimeout(narrativeAvatarExitTimerRef.current);
        narrativeAvatarExitTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isLocationTransitionPlaying) return;
    const transitionTimer = window.setTimeout(() => {
      setCompletedLocationTransitionLineId(line.id);
    }, EXHIBITION_LOCATION_TRANSITION_MS);
    return () => window.clearTimeout(transitionTimer);
  }, [isLocationTransitionPlaying, line.id]);

  useEffect(() => {
    if (!isBaiRoomFullImageIntroPlaying) return;
    const introTimer = window.setTimeout(() => {
      setCompletedBaiRoomFullImageIntroLineId(line.id);
    }, EXHIBITION_BAI_ROOM_FULL_IMAGE_INTRO_MS);
    return () => window.clearTimeout(introTimer);
  }, [isBaiRoomFullImageIntroPlaying, line.id]);

  useEffect(() => {
    if (!line.doorSwipeInteraction?.openImage) return;
    void preloadGameImage(line.doorSwipeInteraction.openImage).catch(() => undefined);
  }, [line.doorSwipeInteraction?.openImage]);

  useEffect(() => {
    const frameSequence = line.avatar?.frameSequence;
    setDisplayedAvatarFrameIndex(frameSequence?.[0] ?? line.avatar?.frameIndex);
    if (!frameSequence || frameSequence.length < 2) return;

    let frameSequenceIndex = 0;
    const frameTimer = window.setInterval(() => {
      frameSequenceIndex = (frameSequenceIndex + 1) % frameSequence.length;
      setDisplayedAvatarFrameIndex(frameSequence[frameSequenceIndex]);
    }, line.avatar?.frameDurationMs ?? 680);

    return () => window.clearInterval(frameTimer);
  }, [line.avatar, line.id]);

  useEffect(() => {
    if (phase !== "bai-change-first") return;
    EXHIBITION_BAI_DIARY_PICKUP_IMAGE_URLS.forEach((imagePath) => {
      void preloadGameImage(imagePath).catch(() => undefined);
    });
  }, [phase]);

  useEffect(() => {
    setIsFallFullscreenPlaying(false);
    setIsBeigoDiaryRevealPlaying(false);
    setIsBaiDiaryPickupCompleting(false);
    setIsNarrativeAvatarExiting(false);
    if (narrativeAvatarExitTimerRef.current) {
      clearTimeout(narrativeAvatarExitTimerRef.current);
      narrativeAvatarExitTimerRef.current = null;
    }
    if (!line.beigoBagRevealSequence) {
      setCompletedBeigoBagRevealLineId(null);
    }
  }, [line.beigoBagRevealSequence, line.id]);

  useEffect(() => {
    if (line.comicPresentation !== "door-close-single") return;
    playGameSfx("comicDoorClose");
  }, [line.comicPresentation, line.id]);

  useEffect(() => {
    if (line.id !== "EX-METRO-OPEN-00") return;
    return playGameSfxSequence(["metroAnnouncement1"]);
  }, [line.id]);

  useEffect(() => {
    if (!line.soundEffectId) return;
    playGameSfx(line.soundEffectId);
  }, [line.id, line.soundEffectId]);

  const handleNarrativeContinue = () => {
    if (isNarrativeAvatarExiting) return;
    if (isBeigoDiaryRevealPlaying) return;
    if (isBaiDiaryPickupCompleting) return;
    if (line.baiDiaryPickupSequence) {
      setIsBaiDiaryPickupCompleting(true);
      return;
    }
    if (line.beigoDiaryRevealSequence) {
      setIsBeigoDiaryRevealPlaying(true);
      return;
    }
    if (line.comicPresentation === "fall-double" && !isFallFullscreenPlaying) {
      setIsFallFullscreenPlaying(true);
      return;
    }
    if (line.doorSwipeInteraction && activeDoorSwipeLineId !== line.id) {
      setActiveDoorSwipeLineId(line.id);
      return;
    }
    if (line.avatar?.exitMotionId) {
      setIsNarrativeAvatarExiting(true);
      narrativeAvatarExitTimerRef.current = setTimeout(() => {
        narrativeAvatarExitTimerRef.current = null;
        onAdvance();
      }, line.avatar.exitDurationMs ?? 420);
      return;
    }
    onAdvance();
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#2A292E"
      bgImage={`url("${line.backgroundImage}")`}
      bgSize={line.backgroundSize ?? "cover"}
      backgroundPosition={line.backgroundPosition ?? "center bottom"}
      bgRepeat="no-repeat"
      filter={line.flashback && !isFallFullscreenPlaying ? "sepia(0.2) saturate(0.78)" : undefined}
    >
      {line.floatingDiaryPages ? (
        <Flex position="absolute" inset="0" zIndex={0} pointerEvents="none">
          {BAI_ROOM_GLOW_1_BACKGROUND_LAYERS.map((layer, index) => (
            <Box
              key={layer.image}
              position="absolute"
              inset="0"
              animation={getExhibitionBaiGlowLayerAnimation(layer, index)}
              willChange="transform, opacity"
            >
              <img
                src={layer.image}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "none",
                  objectFit: "cover",
                  objectPosition: "center bottom",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </Box>
          ))}
        </Flex>
      ) : null}

      {!line.hideBackgroundShade && !isBaiRoomFullImageIntroPlaying ? (
        <Box
          position="absolute"
          inset="0"
          zIndex={1}
          bg={
            line.flashback
              ? "linear-gradient(180deg, rgba(74,54,43,0.25), rgba(25,18,18,0.55))"
              : "linear-gradient(180deg, rgba(20,18,18,0.2) 0%, transparent 38%, rgba(20,15,12,0.52) 100%)"
          }
          pointerEvents="none"
        />
      ) : null}

      {line.clueText ? <CluePaper text={line.clueText} /> : null}

      {line.showLightOrb ? (
        <Box
          position="absolute"
          zIndex={4}
          left="42%"
          top="42%"
          w="54px"
          h="54px"
          borderRadius="999px"
          bg="radial-gradient(circle, rgba(255,252,211,1) 0%, rgba(255,219,112,0.92) 26%, rgba(255,188,65,0.18) 72%, transparent 74%)"
          boxShadow="0 0 28px rgba(255,227,126,0.82), 0 0 72px rgba(255,190,69,0.42)"
          animation={`${lightOrbFloat} 1800ms ease-in-out infinite alternate`}
          pointerEvents="none"
        />
      ) : null}

      {line.baiDiaryPickupSequence && isBaiDiaryPickupCompleting ? (
        <ExhibitionBaiDiaryPickupSequence onComplete={onAdvance} />
      ) : null}

      {line.comicPresentation === "fall-double"
        ? FLASHBACK_FALL_COMIC_PANELS.map((panel, index) => (
            <Flex
              key={panel}
              position="absolute"
              top={index === 0 ? "80px" : "280px"}
              left={index === 0 ? undefined : "0"}
              right={index === 0 ? "0" : undefined}
              zIndex={7 + index}
              w="280px"
              h="177px"
              overflow="hidden"
              pointerEvents="none"
              animation={`${index === 0 ? panelFromRight : panelFromLeft} 430ms ease ${index * 180}ms both`}
            >
              <img
                src={panel}
                alt={index === 0 ? "小麥踩到地上草稿的漫畫格" : "小麥跌倒撞落日記的漫畫格"}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Flex>
          ))
        : null}

      {line.comicPresentation === "door-close-single" ? (
        <Flex
          position="absolute"
          left="50%"
          top="142px"
          zIndex={8}
          w="80%"
          maxW="290px"
          transform="translateX(-50%)"
          overflow="hidden"
          pointerEvents="none"
        >
          <Flex w="100%" animation={`${panelFromRight} 430ms ease both`}>
            <img
              src={FLASHBACK_DOOR_CLOSE_COMIC}
              alt="小麥關門離開的漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        </Flex>
      ) : null}

      {line.comicPresentation === "beigo-rush-single" ? (
        <Flex
          position="absolute"
          left="50%"
          top="142px"
          zIndex={8}
          w="80%"
          maxW="290px"
          transform="translateX(-50%)"
          overflow="hidden"
          pointerEvents="none"
          animation={
            line.beigoRushComicEnter
              ? `${exhibitionBeigoRushPanelFromRight} 460ms cubic-bezier(0.2, 0.78, 0.22, 1) both`
              : undefined
          }
        >
          <img
            src={BEIGO_RUSH_BAI_ROOM_COMIC}
            alt="小貝狗一閃而過衝進小白房間的漫畫格"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Flex>
      ) : null}

      {line.beigoBagRevealSequence ? (
        <ExhibitionBeigoBagRevealSequence
          key={line.id}
          onComplete={() => setCompletedBeigoBagRevealLineId(line.id)}
        />
      ) : null}

      {line.comicPresentation === "blank-diary-single" ? (
        <Flex
          position="absolute"
          left="50%"
          top="142px"
          zIndex={8}
          w="80%"
          maxW="290px"
          transform="translateX(-50%)"
          overflow="hidden"
          pointerEvents="none"
        >
          <img
            src={BEIGO_REVEAL_BOOK_COMIC}
            alt="翻開後只剩空白頁的交換日記"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Flex>
      ) : null}

      {line.comicPresentation === "diary-in-bag-single" ? (
        <DiaryInBagComicPanel />
      ) : null}

      {isLocationTransitionPlaying ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={20}
          overflow="hidden"
          bgColor="#E8DFD2"
          pointerEvents="none"
          data-exhibition-transition="location-arrival"
        >
          <Box
            position="absolute"
            inset="0"
            bgImage={`url("${line.backgroundImage}")`}
            bgSize={line.backgroundSize ?? "cover"}
            backgroundPosition={line.backgroundPosition ?? "center bottom"}
            bgRepeat="no-repeat"
            transformOrigin="50% 58%"
            animation={`${exhibitionMetroArrivalSettle} ${EXHIBITION_LOCATION_TRANSITION_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`}
            willChange="transform, filter"
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(255,248,235,0.08), rgba(44,36,32,0.18))"
          />
          <Flex
            position="absolute"
            inset="0"
            zIndex={2}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              direction="column"
              alignItems="center"
              color="#5E554F"
              textAlign="center"
              textShadow="0 2px 14px rgba(255,255,255,0.96), 0 1px 2px rgba(255,255,255,0.86)"
              animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_LOCATION_TRANSITION_MS}ms ease-in-out both`}
            >
              <Flex alignItems="center" justifyContent="center" gap="16px">
                <Box w="46px" h="1px" bgColor="rgba(94,85,79,0.42)" />
                <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                  {line.locationTransition?.title}
                </Text>
                <Box w="46px" h="1px" bgColor="rgba(94,85,79,0.42)" />
              </Flex>
              {line.locationTransition?.subtitle ? (
                <Text mt="12px" fontSize="13px" fontWeight="800" lineHeight="1" letterSpacing="0.32em" ml="0.32em">
                  {line.locationTransition.subtitle}
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isAutomaticDoorTransitionPlaying ? (
        <ExhibitionMainlineDoorTransition
          onComplete={() => setCompletedAutomaticDoorLineId(line.id)}
        />
      ) : null}

      {isBaiRoomFullImageIntroPlaying ? (
        <>
          <Flex
            position="absolute"
            inset="0"
            zIndex={17}
            pointerEvents="none"
            bg="radial-gradient(circle at 50% 36%, rgba(255,232,170,0.12), transparent 42%), rgba(0,0,0,0.08)"
            data-exhibition-transition="bai-room-full-image"
          />
          <Flex
            position="absolute"
            top="0"
            bottom="0"
            left="0"
            w="108%"
            zIndex={18}
            pointerEvents="none"
            overflow="visible"
            bg="linear-gradient(90deg, #010101 0%, #020202 86%, #080706 96%, rgba(0,0,0,0.9) 100%)"
            boxShadow="22px 0 34px rgba(0,0,0,0.52)"
            animation={`${exhibitionBaiRoomCurtainReveal} ${EXHIBITION_BAI_ROOM_FULL_IMAGE_INTRO_MS - 20}ms cubic-bezier(0.22, 0.74, 0.18, 1) both`}
          >
            <Flex
              position="absolute"
              top="0"
              right="-4px"
              bottom="0"
              w="10px"
              bg="linear-gradient(90deg, rgba(0,0,0,0.08), rgba(255,229,158,0.52), rgba(255,247,211,0.92))"
              filter="blur(0.4px)"
              animation={`${exhibitionBaiRoomDoorLightReveal} ${EXHIBITION_BAI_ROOM_FULL_IMAGE_INTRO_MS - 20}ms ease-out both`}
            />
          </Flex>
        </>
      ) : null}

      {line.doorSwipeInteraction && isDoorSwipeInteractionPlaying ? (
        <ExhibitionDoorSwipeInteraction
          key={line.id}
          closedImage={line.backgroundImage}
          openImage={line.doorSwipeInteraction.openImage}
          instruction={line.doorSwipeInteraction.instruction}
          promptDelayMs={line.doorSwipeInteraction.promptDelayMs}
          advanceDelayMs={line.doorSwipeInteraction.advanceDelayMs}
          onComplete={() => {
            setActiveDoorSwipeLineId(null);
            onAdvance();
          }}
        />
      ) : null}

      {isFallFullscreenPlaying ? (
        <ExhibitionFlashbackFallFullscreenSequence
          onComplete={() => {
            setIsFallFullscreenPlaying(false);
            onAdvance();
          }}
        />
      ) : null}

      {isBeigoDiaryRevealPlaying ? (
        <ExhibitionBeigoDiaryRevealSequence
          onComplete={() => {
            setIsBeigoDiaryRevealPlaying(false);
            onAdvance();
          }}
        />
      ) : null}

      <Flex flex="1" minH="0" position="relative" />

      {!isIntroTransitionPlaying &&
      !isFallFullscreenPlaying &&
      !isBeigoDiaryRevealPlaying &&
      !isBaiDiaryPickupCompleting &&
      !isDoorSwipeInteractionPlaying ? (
        <Flex
          w="100%"
          flexShrink={0}
          position="relative"
          zIndex={12}
          animation={
            shouldPlayLocationTransition ||
            shouldPlayAutomaticDoorTransition ||
            Boolean(line.beigoBagRevealSequence)
              ? `${exhibitionDialogUiIn} 360ms ease-out both`
              : undefined
          }
        >
          <StoryDialogPanel
            key={line.id}
            characterName={line.speaker}
            dialogue={line.text}
            dialogueItalicPrefix={isNarration ? line.text : undefined}
            onContinue={handleNarrativeContinue}
            showAvatarSprite={Boolean(line.avatar)}
            showCharacterName={!isNarration}
            avatarSpriteId={line.avatar?.spriteId}
            avatarFrameIndex={displayedAvatarFrameIndex}
            avatarMotionId={
              isNarrativeAvatarExiting ? line.avatar?.exitMotionId : line.avatar?.motionId
            }
            isInnerThought={isInnerThought}
            typingMode={typingMode}
          />
        </Flex>
      ) : null}
    </Flex>
  );
}

function ExhibitionMaiIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgImage={`url("${EXHIBITION_OPENING_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center bottom"
    >
      <CharacterIntroOverlay
        intro={EXHIBITION_MAI_CHARACTER_INTRO_CARD}
        onClose={onComplete}
        showAvatarGlow={false}
        avatarBottom={0}
        enableDecorativeMotion
        typewriterDescription
      />
    </Flex>
  );
}

function ExhibitionOfficeOpening({
  onComplete,
  showLookBack = true,
}: {
  onComplete: () => void;
  showLookBack?: boolean;
}) {
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const [isWorkVisible, setIsWorkVisible] = useState(false);
  const [isMaiLookingBack, setIsMaiLookingBack] = useState(false);
  const [isContinueReady, setIsContinueReady] = useState(false);
  const hasCompletedRef = useRef(false);

  const complete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const workFrameTimer = window.setInterval(() => {
      setWorkFrameIndex(
        (current) => (current + 1) % EXHIBITION_OFFICE_WORK_FRAMES.length,
      );
    }, 260);
    const workStartTimer = window.setTimeout(() => {
      setIsWorkVisible(true);
    }, EXHIBITION_OFFICE_WORK_START_MS);
    const lookTimer = showLookBack
      ? window.setTimeout(() => {
          setIsMaiLookingBack(true);
        }, EXHIBITION_OFFICE_LOOK_DELAY_MS)
      : null;
    const continueReadyTimer = window.setTimeout(() => {
      setIsContinueReady(true);
    }, EXHIBITION_OFFICE_CONTINUE_DELAY_MS);
    const completeTimer = window.setTimeout(complete, EXHIBITION_OFFICE_OPENING_DURATION_MS);

    return () => {
      window.clearInterval(workFrameTimer);
      window.clearTimeout(workStartTimer);
      if (lookTimer !== null) window.clearTimeout(lookTimer);
      window.clearTimeout(continueReadyTimer);
      window.clearTimeout(completeTimer);
    };
  }, [showLookBack]);

  const workFrame = isMaiLookingBack
    ? EXHIBITION_OFFICE_WORK_LOOK_FRAME
    : EXHIBITION_OFFICE_WORK_FRAMES[workFrameIndex];

  return (
    <Flex
      as="button"
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#A7A7A7"
      alignItems="center"
      justifyContent="center"
      onClick={() => {
        if (isContinueReady) complete();
      }}
      aria-disabled={!isContinueReady}
      aria-label="公司與小麥工作的開場動畫，點擊繼續"
      data-exhibition-office-opening
    >
      {!isWorkVisible ? (
        <Flex
          position="absolute"
          inset="0"
          overflow="hidden"
          bgColor="#D9E5DE"
          data-exhibition-transition="office-arrival"
        >
          <Box
            position="absolute"
            inset="0"
            bgImage={`url("${EXHIBITION_OFFICE_BACKGROUND}")`}
            bgSize="cover"
            backgroundPosition="center bottom"
            bgRepeat="no-repeat"
            transformOrigin="50% 58%"
            animation={`${exhibitionMetroArrivalSettle} ${EXHIBITION_OFFICE_WORK_START_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`}
            willChange="transform, filter"
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(255,248,235,0.04), rgba(44,36,32,0.16))"
          />
          <Flex
            position="absolute"
            inset="0"
            zIndex={2}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              direction="column"
              alignItems="center"
              px="22px"
              py="15px"
              borderRadius="12px"
              bgColor="rgba(24,22,21,0.5)"
              boxShadow="0 8px 24px rgba(36,31,28,0.16)"
              color="white"
              textAlign="center"
              textShadow="0 1px 3px rgba(0,0,0,0.32)"
              animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_OFFICE_WORK_START_MS}ms ease-in-out both`}
            >
              <Flex alignItems="center" justifyContent="center" gap="14px">
                <Box w="42px" h="1px" bgColor="rgba(255,255,255,0.62)" />
                <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                  公司
                </Text>
                <Box w="42px" h="1px" bgColor="rgba(255,255,255,0.62)" />
              </Flex>
              <Text
                mt="12px"
                fontSize="13px"
                fontWeight="800"
                lineHeight="1"
                letterSpacing="0.32em"
                ml="0.32em"
              >
                上午
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex
          position="absolute"
          inset="0"
          overflow="hidden"
          bgColor="#DCE7E0"
          animation={`${panelFromRight} 460ms cubic-bezier(0.22, 0.78, 0.2, 1) both`}
        >
          <img
            src={workFrame}
            alt={isMaiLookingBack ? "小麥聽見同事叫她而回頭" : "小麥正在座位上工作"}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
          />
        </Flex>
      )}

      <Text
        position="absolute"
        left="50%"
        bottom="22px"
        transform="translateX(-50%)"
        color="rgba(255,255,255,0.82)"
        fontSize="12px"
        fontWeight="700"
        letterSpacing="0.08em"
        whiteSpace="nowrap"
        opacity={isContinueReady ? 1 : 0}
        transition="opacity 240ms ease"
      >
        點一下繼續
      </Text>
    </Flex>
  );
}

function ExhibitionWorkDuskTransition({ onComplete }: { onComplete: () => void }) {
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const workFrameTimer = window.setInterval(() => {
      setWorkFrameIndex(
        (current) => (current + 1) % EXHIBITION_OFFICE_WORK_FRAMES.length,
      );
    }, 260);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_WORK_DUSK_DURATION_MS);

    return () => {
      window.clearInterval(workFrameTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#DCE7E0"
      aria-label="小麥繼續工作，窗外逐漸變成黃昏"
      data-exhibition-work-dusk
    >
      <img
        src={EXHIBITION_OFFICE_WORK_FRAMES[workFrameIndex]}
        alt="小麥繼續在座位上工作"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
      <img
        src={EXHIBITION_OFFICE_WORK_DUSK_FRAMES[workFrameIndex]}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          animation: `${exhibitionWorkDuskReveal} ${EXHIBITION_WORK_DUSK_DURATION_MS}ms linear both`,
        }}
      />
    </Flex>
  );
}

function MetroComicScene({ onAdvance }: { onAdvance: () => void }) {
  const [visibleDoorFrameCount, setVisibleDoorFrameCount] = useState(0);
  const [typingMode] = useState(loadDialogTypingMode);
  const narration = EXHIBITION_METRO_COMIC_NARRATION;

  useEffect(() => {
    // 與主線 ch01MetroDogRun 相同：下格進場完成後再開始播三張車門圖。
    playGameSfx("comicPanelPop");
    const lowerPanelSoundTimer = window.setTimeout(() => playGameSfx("comicPanelPop"), 420);
    const doorTimerOne = window.setTimeout(() => setVisibleDoorFrameCount(1), 980);
    const doorTimerTwo = window.setTimeout(() => setVisibleDoorFrameCount(2), 1200);
    return () => {
      window.clearTimeout(lowerPanelSoundTimer);
      window.clearTimeout(doorTimerOne);
      window.clearTimeout(doorTimerTwo);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      overflow="hidden"
      bgImage={`url("${METRO_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center"
    >
      <Flex
        position="absolute"
        top="80px"
        right="0"
        zIndex={7}
        w="280px"
        h="171px"
        overflow="hidden"
        pointerEvents="none"
        animation={`${panelFromRight} 360ms ease both`}
      >
        <img
          src={GOLDEN_RETRIEVER_RUN_COMIC}
          alt="黃金獵犬衝進捷運車廂的漫畫格"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </Flex>
      <Flex
        position="absolute"
        top="280px"
        left="0"
        zIndex={8}
        w="280px"
        h="164px"
        overflow="hidden"
        pointerEvents="none"
        animation={`${panelFromLeft} 340ms ease 420ms both`}
      >
        {GOLDEN_RETRIEVER_DOOR_COMICS.map((image, frameIndex) => (
          <img
            key={image}
            src={image}
            alt={frameIndex === 0 ? "捷運車門關閉的連續漫畫格" : ""}
            aria-hidden={frameIndex === 0 ? undefined : true}
            style={{
              position: frameIndex === 0 ? "relative" : "absolute",
              inset: frameIndex === 0 ? undefined : 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: frameIndex === 0 || visibleDoorFrameCount >= frameIndex ? 1 : 0,
              transition: frameIndex === 0 ? undefined : "opacity 120ms ease",
            }}
          />
        ))}
      </Flex>
      <Flex flex="1" minH="0" />
      <StoryDialogPanel
        characterName="旁白"
        dialogue={narration}
        dialogueItalicPrefix={narration}
        onContinue={onAdvance}
        showAvatarSprite={false}
        showCharacterName={false}
        typingMode={typingMode}
      />
    </Flex>
  );
}

type ExhibitionMetroDogProgress = {
  stage: "before" | "photo" | "after";
  lineIndex: number;
  sceneStep: string;
};

function getExhibitionMetroDogProgress(sceneStep: string | null): ExhibitionMetroDogProgress {
  const fallback: ExhibitionMetroDogProgress = {
    stage: "before",
    lineIndex: 0,
    sceneStep: "before-0",
  };
  if (sceneStep === "photo") {
    return {
      stage: "photo",
      lineIndex: EXHIBITION_METRO_DOG_BEFORE_PHOTO.length - 1,
      sceneStep,
    };
  }

  const match = sceneStep?.match(/^(before|after)-(\d+)$/);
  if (!match) return fallback;
  const stage = match[1] as "before" | "after";
  const lineIndex = Number(match[2]);
  const lines = stage === "after"
    ? EXHIBITION_METRO_DOG_AFTER_PHOTO
    : EXHIBITION_METRO_DOG_BEFORE_PHOTO;
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length) {
    return fallback;
  }
  return { stage, lineIndex, sceneStep: `${stage}-${lineIndex}` };
}

function ExhibitionMetroDogCapture({
  initialSceneStep,
  onPhotoCaptured,
  onComplete,
}: {
  initialSceneStep: string | null;
  onPhotoCaptured: (result: PhotoCaptureResult) => void;
  onComplete: () => void;
}) {
  const [initialProgress] = useState(() =>
    getExhibitionMetroDogProgress(initialSceneStep),
  );
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [lineIndex, setLineIndex] = useState(initialProgress.lineIndex);
  const [isPhotoMode, setIsPhotoMode] = useState(initialProgress.stage === "photo");
  const [isAfterPhoto, setIsAfterPhoto] = useState(initialProgress.stage === "after");
  const [dogFrameIndex, setDogFrameIndex] = useState(0);
  const hasPlayedCameraComicSfxRef = useRef(false);
  const [typingMode] = useState(loadDialogTypingMode);
  const activeLines = isAfterPhoto
    ? EXHIBITION_METRO_DOG_AFTER_PHOTO
    : EXHIBITION_METRO_DOG_BEFORE_PHOTO;
  const line = activeLines[Math.min(lineIndex, activeLines.length - 1)];
  const dogFrameImage = METRO_DOG_FRAMES[dogFrameIndex];

  useEffect(() => {
    const currentStepId = isPhotoMode
      ? "photo"
      : `${isAfterPhoto ? "after" : "before"}-${lineIndex}`;
    const steps = getExhibitionSceneJumpSteps("metro-dog");
    const currentStep = steps.find((step) => step.id === currentStepId);
    if (!currentStep) return;
    dispatchSceneJumpContextChange({
      optionId: "metro-dog",
      kindLabel: currentStep.kindLabel,
      speaker: currentStep.speaker,
      text: currentStep.text,
      steps: [...steps],
      currentStepId,
    });
  }, [isAfterPhoto, isPhotoMode, lineIndex]);

  useEffect(() => {
    replaceExhibitionPhaseInUrl("metro-dog", initialProgress.sceneStep);
  }, [initialProgress.sceneStep]);

  useEffect(() => {
    const image = new Image();
    image.src = METRO_BACKGROUND;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, []);

  useEffect(() => {
    if (isAfterPhoto) return;
    const timer = window.setInterval(() => {
      setDogFrameIndex((current) => (current + 1) % METRO_DOG_FRAMES.length);
    }, 300);
    return () => window.clearInterval(timer);
  }, [isAfterPhoto]);

  useEffect(() => {
    if (isPhotoMode || !line.showCameraComic || hasPlayedCameraComicSfxRef.current) return;
    hasPlayedCameraComicSfxRef.current = true;
    playGameSfx("cameraComicReveal");
  }, [isPhotoMode, line.showCameraComic]);

  const advance = () => {
    if (lineIndex < activeLines.length - 1) {
      const nextLineIndex = lineIndex + 1;
      setLineIndex(nextLineIndex);
      replaceExhibitionPhaseInUrl(
        "metro-dog",
        `${isAfterPhoto ? "after" : "before"}-${nextLineIndex}`,
      );
      return;
    }
    if (!isAfterPhoto) {
      setIsPhotoMode(true);
      replaceExhibitionPhaseInUrl("metro-dog", "photo");
      return;
    }
    onComplete();
  };

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#1B1A18">
      <Flex
        ref={backgroundRef}
        position="relative"
        flex="1"
        minH="0"
        bgImage={'url("' + METRO_BACKGROUND + '")'}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center"
        bgRepeat="no-repeat"
      >
        {!isAfterPhoto && !isPhotoMode ? (
          <img
            src={dogFrameImage}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              pointerEvents: "none",
            }}
          />
        ) : null}

        {!isPhotoMode && line.showCameraComic ? (
          <Flex
            position="absolute"
            left="50%"
            top="142px"
            zIndex={5}
            w="80%"
            maxW="290px"
            transform="translateX(-50%)"
            pointerEvents="none"
          >
            <img
              src={CAMERA_COMIC}
              alt="小貝狗拿出的相機漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {!isPhotoMode && line.showDiaryInBagComic ? <DiaryInBagComicPanel /> : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          backgroundRef={backgroundRef}
          backgroundImageSrc={METRO_BACKGROUND}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          captureOverlays={[
            {
              imageSrc: dogFrameImage,
              rectNormalized: { x: 0, y: 0, width: 1, height: 1 },
            },
          ]}
          targetRectNormalized={METRO_DOG_TARGET_RECT_NORMALIZED}
          passScore={60}
          hintText="點擊畫面或空白鍵捕捉小日獸"
          tutorialTitle="拍下小日獸"
          tutorialLines={["白框對準時，按下快門！"]}
          tutorialDemoImageSrc="/images/428出圖/拍照動物/黃金獵犬.png"
          tutorialDemoImageAlt="黃金獵犬小日獸"
          tutorialConfirmLabel="開始拍照"
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          frameSweepFromY={20}
          frameSweepToY={604}
          targetFadeLeadPx={50}
          onConfirm={(result) => {
            onPhotoCaptured(result);
            setIsPhotoMode(false);
            setIsAfterPhoto(true);
            setLineIndex(0);
            replaceExhibitionPhaseInUrl("metro-dog", "after-0");
          }}
        />
      </Flex>

      {!isPhotoMode ? (
        <StoryDialogPanel
          key={(isAfterPhoto ? "after-" : "before-") + lineIndex}
          characterName={line.speaker}
          dialogue={line.text}
          onContinue={advance}
          showAvatarSprite={Boolean(line.spriteId)}
          avatarSpriteId={line.spriteId}
          avatarFrameIndex={line.frameIndex}
          avatarMotionId={line.motionId}
          typingMode={typingMode}
        />
      ) : null}
    </Flex>
  );
}

function PhotoDiaryTransition({
  stage,
  photoImagePath,
  onBookOpen,
  onPhotoContinue,
  onDiaryContinue,
}: {
  stage: ExhibitionPhotoDiaryStage;
  photoImagePath: string;
  onBookOpen: () => void;
  onPhotoContinue: () => void;
  onDiaryContinue: () => void;
}) {
  return (
    <Flex position="absolute" inset="0" zIndex={72} direction="column">
      {stage === "book" ? (
        <DiaryBookOpenPromptPage onOpen={onBookOpen} />
      ) : stage === "photo-detail" ? (
        <NaotaroPhotoDiaryRevealPage
          photoImagePath={photoImagePath}
          onContinue={onPhotoContinue}
        />
      ) : stage === "diary-unlock" ? (
        <NaotaroDiaryUnlockPage onContinue={onDiaryContinue} />
      ) : (
        <PhotoDiarySlidePage
          photoImagePath={photoImagePath}
          photoRevealName="直太郎"
        />
      )}
    </Flex>
  );
}

function ExhibitionForgotLunchIntro({
  initialLineIndex = 0,
  onComplete,
}: {
  initialLineIndex?: number;
  onComplete: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(initialLineIndex);
  const [typingMode] = useState(loadDialogTypingMode);
  const line = EXHIBITION_FORGOT_LUNCH_LINES[lineIndex];

  useEffect(() => {
    const currentStepId = `intro-${lineIndex}`;
    const steps = getExhibitionSceneJumpSteps("convenience-clerk");
    const currentStep = steps.find((step) => step.id === currentStepId);
    if (!currentStep) return;
    dispatchSceneJumpContextChange({
      optionId: "convenience-clerk",
      kindLabel: currentStep.kindLabel,
      speaker: currentStep.speaker,
      text: currentStep.text,
      steps: [...steps],
      currentStepId,
    });
  }, [lineIndex]);

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#D8D0C8"
      bgImage={`url("${EXHIBITION_OFFICE_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center bottom"
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(20,18,18,0.12) 0%, transparent 40%, rgba(20,15,12,0.5) 100%)"
      />
      <Flex flex="1" minH="0" />
      <Flex position="relative" zIndex={2} w="100%" flexShrink={0}>
        <StoryDialogPanel
          key={`exhibition-lunch-${lineIndex}`}
          characterName={line.speaker}
          dialogue={line.text}
          onContinue={() => {
            if (lineIndex < EXHIBITION_FORGOT_LUNCH_LINES.length - 1) {
              const nextLineIndex = lineIndex + 1;
              setLineIndex(nextLineIndex);
              replaceExhibitionPhaseInUrl("convenience-clerk", `intro-${nextLineIndex}`);
              return;
            }
            onComplete();
          }}
          showAvatarSprite={"spriteId" in line}
          showCharacterName
          avatarSpriteId={"spriteId" in line ? line.spriteId : undefined}
          avatarFrameIndex={"frameIndex" in line ? line.frameIndex : undefined}
          avatarMotionId={"motionId" in line ? line.motionId : undefined}
          typingMode={typingMode}
        />
      </Flex>
    </Flex>
  );
}

function CompleteCard({
  onRestart,
  naotaroPhotoImagePath,
  frogPhotoImagePath,
}: {
  onRestart: () => void;
  naotaroPhotoImagePath: string;
  frogPhotoImagePath: string;
}) {
  const completedActivities = ["小日獸拍照", "寬窄路線", "傳單任務", "日記修復", "工作挑戰"];
  return (
    <Flex position="absolute" inset="0" direction="column" alignItems="center" justifyContent="center" px="22px" py="26px" bg="linear-gradient(160deg, #3D342F 0%, #6F5543 52%, #2E2928 100%)" overflow="hidden">
      <Box position="absolute" w="330px" h="330px" borderRadius="999px" bg="radial-gradient(circle, rgba(255,219,121,0.34), transparent 68%)" animation={`${completeGlow} 2400ms ease-in-out infinite`} />
      <Flex position="relative" zIndex={2} w="100%" direction="column" alignItems="center" textAlign="center">
        <Text color="#EBCB82" fontSize="11px" fontWeight="900" letterSpacing="0.18em">DEMO COMPLETE</Text>
        <Text mt="10px" color="#FFF5DF" fontSize="26px" fontWeight="900" lineHeight="1.25">感謝你完成 Demo 體驗</Text>
        <Text mt="8px" color="rgba(255,245,223,0.76)" fontSize="13px" fontWeight="700" lineHeight="1.6">
          你幫小麥找回日記，也收服了青蛙小日獸。
        </Text>

        <Flex mt="16px" w="100%" gap="10px">
          {[
            { label: "直太郎", imagePath: naotaroPhotoImagePath },
            { label: "青蛙", imagePath: frogPhotoImagePath },
          ].map((photo) => (
            <Flex key={photo.label} flex="1" direction="column" p="6px" pb="9px" bgColor="#FFF8E8" borderRadius="10px" transform={photo.label === "直太郎" ? "rotate(-1.5deg)" : "rotate(1.5deg)"} boxShadow="0 10px 18px rgba(20,14,12,0.26)">
              <Box h="112px" borderRadius="6px" bgColor="#D7C7B4" bgImage={`url("${photo.imagePath}")`} bgSize="cover" backgroundPosition="center" bgRepeat="no-repeat" />
              <Text mt="7px" color="#6E5545" fontSize="13px" fontWeight="900">拍到：{photo.label}</Text>
            </Flex>
          ))}
        </Flex>

        <Text mt="18px" color="#F0D9A5" fontSize="13px" fontWeight="900" letterSpacing="0.08em">這次完成的小遊戲</Text>
        <Flex mt="9px" justifyContent="center" wrap="wrap" gap="7px">
          {completedActivities.map((activity) => (
            <Flex key={activity} h="27px" px="10px" borderRadius="999px" alignItems="center" bgColor="rgba(255,245,223,0.12)" border="1px solid rgba(240,217,165,0.28)">
              <Text color="#FFF2D8" fontSize="11px" fontWeight="800">{activity}</Text>
            </Flex>
          ))}
        </Flex>

        <a
          href={EXHIBITION_OFFICIAL_SITE_URL}
          target="_blank"
          rel="noreferrer"
          style={{ width: "100%", maxWidth: "280px", marginTop: "20px", textDecoration: "none" }}
        >
          <Flex
            h="46px"
            w="100%"
            px="22px"
            borderRadius="999px"
            bgColor="#E39A48"
            color="white"
            alignItems="center"
            justifyContent="center"
            gap="9px"
            boxShadow="0 10px 22px rgba(24,18,15,0.32)"
          >
            <Text fontSize="14px" fontWeight="900">前往 Moments 官網</Text>
            <FiExternalLink size={16} />
          </Flex>
        </a>
        <Flex as="button" mt="10px" h="36px" px="18px" borderRadius="999px" color="#F0D9A5" alignItems="center" justifyContent="center" gap="7px" onClick={onRestart}>
          <FiRotateCcw size={14} />
          <Text fontSize="12px" fontWeight="800">重新體驗</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export function ExhibitionExperienceView({
  initialPreview = null,
  initialSceneStep = null,
}: {
  initialPreview?: ExhibitionPhase | null;
  initialSceneStep?: string | null;
}) {
  const [initialViewState] = useState(() =>
    getInitialExhibitionViewState(initialPreview, initialSceneStep),
  );
  const [phase, setPhase] = useState<ExhibitionPhase>(initialViewState.phase);
  const [lineIndex, setLineIndex] = useState(initialViewState.lineIndex);
  const [runKey, setRunKey] = useState(0);
  const [photoDiaryStage, setPhotoDiaryStage] = useState<ExhibitionPhotoDiaryStage>(
    initialViewState.photoDiaryStage,
  );
  const [diaryRestoreStage, setDiaryRestoreStage] =
    useState<ExhibitionDiaryRestoreStage>(initialViewState.diaryRestoreStage);
  const [frogDiaryStage, setFrogDiaryStage] =
    useState<ExhibitionFrogDiaryStage>(initialViewState.frogDiaryStage);
  const [dayOneRestStep, setDayOneRestStep] = useState<ExhibitionDayOneRestStep>(
    initialViewState.dayOneRestStep,
  );
  const [morningRouteStep, setMorningRouteStep] = useState<ExhibitionMorningRouteStep>(
    initialViewState.morningRouteStep,
  );
  const [streetFrogStage, setStreetFrogStage] = useState<ExhibitionStreetFrogStage>(
    initialViewState.streetFrogStage,
  );
  const [convenienceFrogStage, setConvenienceFrogStage] =
    useState<ExhibitionConvenienceFrogStage>(initialViewState.convenienceFrogStage);
  const [dessertFrogStage, setDessertFrogStage] = useState<ExhibitionDessertFrogStage>(
    initialViewState.dessertFrogStage,
  );
  const [frogPhotoImagePaths, setFrogPhotoImagePaths] = useState<string[]>(() =>
    Array.from({ length: 3 }, () => EXHIBITION_FROG_PHOTO_FALLBACK),
  );
  const [naotaroPhotoImagePath, setNaotaroPhotoImagePath] = useState(
    EXHIBITION_NAOTARO_PHOTO_FALLBACK,
  );
  const [isOpeningTransitionVisible, setIsOpeningTransitionVisible] = useState(
    initialViewState.isOpeningTransitionVisible,
  );

  const activeNarrativeLines = useMemo(
    () => (isNarrativePhase(phase) ? EXHIBITION_NARRATIVE_LINES[phase] : null),
    [phase],
  );
  const streetFlyerStage = EXHIBITION_STREET_FLYER_STAGE;
  const convenienceStage = EXHIBITION_CONVENIENCE_FROG_STAGE;
  const dessertStage = useMemo(() => {
    const source = FROG_DIARY_CLUE_STAGES[2];
    return {
      ...source,
      lines: source.lines.map((line, index) =>
        index === 0
          ? {
              ...line,
              text: "下班後，小麥和同事走進那間熟悉的甜點店。",
            }
          : line,
      ),
    };
  }, []);

  useEffect(() => {
    const isChildManagedSceneJump =
      phase === "metro-dog" ||
      phase === "street-flyer" ||
      phase === "frog-dessert" ||
      (phase === "convenience-clerk" && convenienceFrogStage !== "route");
    if (isChildManagedSceneJump) return;

    const currentStepId = isNarrativePhase(phase)
      ? activeNarrativeLines?.[lineIndex]?.id
      : phase === "dog-photo-diary"
        ? photoDiaryStage
        : phase === "diary-restore"
          ? getExhibitionDiaryReadLineIndex(initialSceneStep) !== null
            ? initialSceneStep ?? diaryRestoreStage
            : diaryRestoreStage
          : phase === "frog-diary-fragment"
            ? initialPreview === phase && isExhibitionSceneStep(phase, initialSceneStep)
              ? initialSceneStep ?? frogDiaryStage
              : frogDiaryStage
            : phase === "day-one-rest"
              ? dayOneRestStep
            : phase === "morning-route"
              ? morningRouteStep
            : phase === "convenience-clerk"
              ? "route"
              : getDefaultExhibitionSceneStepId(phase);
    const steps = getExhibitionSceneJumpSteps(phase);
    const currentStep = steps.find((step) => step.id === currentStepId) ?? steps[0];
    if (!currentStep) return;

    dispatchSceneJumpContextChange({
      optionId: phase,
      kindLabel: currentStep.kindLabel,
      speaker: currentStep.speaker,
      text: currentStep.text,
      steps: [...steps],
      currentStepId: currentStep.id,
    });
  }, [
    activeNarrativeLines,
    convenienceFrogStage,
    dayOneRestStep,
    diaryRestoreStage,
    frogDiaryStage,
    initialPreview,
    initialSceneStep,
    lineIndex,
    morningRouteStep,
    phase,
    photoDiaryStage,
  ]);

  useEffect(
    () => () => {
      dispatchSceneJumpContextChange({ clear: true });
    },
    [],
  );

  useEffect(() => {
    prepareFmodGameMusicTrack("exhibitionFlashback");
  }, []);

  useEffect(() => {
    if (phase !== "convenience-clerk" || convenienceFrogStage !== "route") return;
    prepareFmodGameMusicTrack("convenienceStore");
  }, [convenienceFrogStage, phase]);

  useEffect(() => {
    // The flyer minigame owns its temporary Poppy Shop track and restores the
    // main theme when it unmounts. Avoid overwriting it from this parent effect.
    if (phase === "street-flyer") return;
    const isInsideConvenienceStore =
      (phase === "convenience-clerk" &&
        (convenienceFrogStage === "event" || convenienceFrogStage === "diary")) ||
      phase === "convenience-photo-return";
    setFmodGameMusicTrack(
      phase === "argument-flashback"
        ? "exhibitionFlashback"
        : isInsideConvenienceStore
          ? "convenienceStore"
          : "mainTheme",
    );
  }, [convenienceFrogStage, phase]);

  const shouldPlayOfficeAmbience =
    EXHIBITION_OFFICE_AMBIENCE_PHASES.includes(phase) ||
    (phase === "work-leave" && lineIndex === 0) ||
    (phase === "convenience-clerk" && convenienceFrogStage === "intro") ||
    (phase === "dessert-transition" && lineIndex === 0);

  useEffect(() => {
    setFmodOfficeAmbienceActive(shouldPlayOfficeAmbience);
    return () => {
      setFmodOfficeAmbienceActive(false);
    };
  }, [shouldPlayOfficeAmbience]);

  useEffect(
    () => () => {
      setFmodGameMusicTrack("mainTheme");
    },
    [],
  );

  useEffect(() => {
    [
      ...EXHIBITION_NARRATIVE_BACKGROUND_IMAGES,
      ...BAI_ROOM_GLOW_1_BACKGROUND_LAYERS.map((layer) => layer.image),
      EXHIBITION_OFFICE_BACKGROUND,
      ...EXHIBITION_OFFICE_WORK_FRAMES,
      EXHIBITION_OFFICE_WORK_LOOK_FRAME,
      ...EXHIBITION_OFFICE_WORK_DUSK_FRAMES,
      ...FLASHBACK_FALL_FULLSCREEN_FRAMES,
      BEIGO_REVEAL_BOOK_COMIC,
      BEIGO_REVEAL_STAND_BOOK_COMIC,
      BEIGO_RUSH_BAI_ROOM_COMIC,
      ...BEIGO_BAG_REVEAL_COMICS,
      DIARY_IN_BAG_COMIC,
      BEIGO_REVEAL_BACKGROUND,
      EXHIBITION_REST_BACKGROUND,
      EXHIBITION_WAKE_BACKGROUND,
      EXHIBITION_ALARM_COMIC,
      ...EXHIBITION_BEIGO_REVEAL_SPECIAL_IMAGE_URLS,
    ].forEach((imageUrl) => {
      void preloadGameImage(imageUrl).catch(() => undefined);
    });
    try {
      const savedPhoto = window.sessionStorage.getItem(EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY);
      if (savedPhoto) setNaotaroPhotoImagePath(savedPhoto);
    } catch {
      // The exhibition flow still has a bundled fallback when session storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const initialPhase = initialPreview ?? "departure-opening";
    const expectedSceneStep =
      isNarrativePhase(initialPhase)
        ? EXHIBITION_NARRATIVE_LINES[initialPhase][initialViewState.lineIndex]?.id
        : isExhibitionSceneStep(initialPhase, initialSceneStep)
          ? initialSceneStep ?? undefined
          : getDefaultExhibitionSceneStepId(initialPhase);

    if (initialPreview !== initialPhase || initialSceneStep !== expectedSceneStep) {
      replaceExhibitionPhaseInUrl(initialPhase, expectedSceneStep);
    }
  }, [initialPreview, initialSceneStep, initialViewState]);

  useEffect(() => {
    if (phase !== "dog-photo-diary") {
      return;
    }
    if (photoDiaryStage !== "photo-slide") return;
    const timer = window.setTimeout(() => {
      setPhotoDiaryStage("photo-detail");
      replaceExhibitionPhaseInUrl("dog-photo-diary", "photo-detail");
    }, 1280);
    return () => window.clearTimeout(timer);
  }, [phase, photoDiaryStage]);

  const goToPhase = (nextPhase: ExhibitionPhase, nextSceneStep?: string) => {
    setLineIndex(0);
    if (nextPhase === "dog-photo-diary") {
      setPhotoDiaryStage("book");
    }
    if (nextPhase === "diary-restore") {
      setDiaryRestoreStage("book");
    }
    if (nextPhase === "frog-diary-fragment") {
      setFrogDiaryStage("book");
    }
    if (nextPhase === "day-one-rest") {
      setDayOneRestStep("rest-transition");
    }
    if (nextPhase === "morning-route") {
      setMorningRouteStep(nextSceneStep === "open-diary" ? "open-diary" : "route-game");
    }
    if (nextPhase === "street-flyer") {
      setStreetFrogStage("event");
    }
    if (nextPhase === "convenience-clerk") {
      setConvenienceFrogStage("intro");
    }
    if (nextPhase === "frog-dessert") {
      setDessertFrogStage("event");
    }
    setPhase(nextPhase);
    replaceExhibitionPhaseInUrl(
      nextPhase,
      nextSceneStep ?? getDefaultExhibitionSceneStepId(nextPhase),
    );
  };

  const advanceNarrative = () => {
    if (!isNarrativePhase(phase) || !activeNarrativeLines) return;
    if (lineIndex < activeNarrativeLines.length - 1) {
      const nextLineIndex = lineIndex + 1;
      setLineIndex(nextLineIndex);
      replaceExhibitionPhaseInUrl(phase, activeNarrativeLines[nextLineIndex]?.id);
      return;
    }
    if (phase === "no-sunbeast-summary") {
      goToPhase("morning-route", "open-diary");
      return;
    }
    goToPhase(EXHIBITION_NARRATIVE_NEXT_PHASE[phase]);
  };

  const restart = () => {
    setRunKey((current) => current + 1);
    setLineIndex(0);
    setPhotoDiaryStage("book");
    setDiaryRestoreStage("book");
    setFrogDiaryStage("book");
    setDayOneRestStep("rest-transition");
    setMorningRouteStep("route-game");
    setStreetFrogStage("event");
    setConvenienceFrogStage("intro");
    setDessertFrogStage("event");
    setFrogPhotoImagePaths(Array.from({ length: 3 }, () => EXHIBITION_FROG_PHOTO_FALLBACK));
    setNaotaroPhotoImagePath(EXHIBITION_NAOTARO_PHOTO_FALLBACK);
    try {
      window.sessionStorage.removeItem(EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions; the in-memory fallback is enough for replay.
    }
    setPhase("departure-opening");
    setIsOpeningTransitionVisible(true);
    replaceExhibitionPhaseInUrl(
      "departure-opening",
      EXHIBITION_NARRATIVE_LINES["departure-opening"][0]?.id,
    );
  };

  return (
    <Flex
      key={runKey}
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      bgColor="#242326"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.14)" }}
      data-exhibition-phase={phase}
    >
      {isOpeningTransitionVisible ? (
        <ExhibitionOpeningTransition onComplete={() => setIsOpeningTransitionVisible(false)} />
      ) : null}

      {!isOpeningTransitionVisible && isNarrativePhase(phase) ? (
        <NarrativeScene phase={phase} lineIndex={lineIndex} onAdvance={advanceNarrative} />
      ) : null}

      {phase === "mai-intro" ? <ExhibitionMaiIntro onComplete={() => goToPhase("departure-plan")} /> : null}

      {phase === "departure-route" ? (
        <DepartureTransitionOverlay
          mapPoints={EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={9}
          mapEndPercent={50}
          onFinish={() => goToPhase("metro-opening")}
        />
      ) : null}

      {phase === "metro-comic" ? <MetroComicScene onAdvance={() => goToPhase("metro-dog")} /> : null}

      {phase === "metro-dog" ? (
        <ExhibitionMetroDogCapture
          key={`exhibition-metro-${runKey}`}
          initialSceneStep={
            runKey === 0 && initialPreview === "metro-dog" ? initialSceneStep : null
          }
          onPhotoCaptured={(result) => {
            setNaotaroPhotoImagePath(result.polaroidUrl);
            try {
              window.sessionStorage.setItem(
                EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY,
                result.polaroidUrl,
              );
            } catch {
              // Keep the captured photo in memory when session storage is unavailable.
            }
          }}
          onComplete={() => goToPhase("dog-photo-diary")}
        />
      ) : null}

      {phase === "dog-photo-diary" ? (
        <PhotoDiaryTransition
          stage={photoDiaryStage}
          photoImagePath={naotaroPhotoImagePath}
          onBookOpen={() => {
            setPhotoDiaryStage("photo-slide");
            replaceExhibitionPhaseInUrl("dog-photo-diary", "photo-slide");
          }}
          onPhotoContinue={() => {
            setPhotoDiaryStage("diary-unlock");
            replaceExhibitionPhaseInUrl("dog-photo-diary", "diary-unlock");
          }}
          onDiaryContinue={() => goToPhase("diary-incomplete")}
        />
      ) : null}

      {phase === "diary-incomplete" ? <ExhibitionIncompleteBaiEntry1DiaryPuzzle onComplete={() => goToPhase("post-puzzle-metro")} /> : null}

      {phase === "metro-to-company" ? (
        <DepartureTransitionOverlay
          mapPoints={EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={50}
          mapEndPercent={91}
          onFinish={() => goToPhase("office-opening")}
        />
      ) : null}

      {phase === "office-opening" ? (
        <ExhibitionOfficeOpening onComplete={() => goToPhase("work-arrival")} />
      ) : null}

      {phase === "street-to-company" ? (
        <DepartureTransitionOverlay
          mapPoints={EXHIBITION_STREET_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={9}
          mapEndPercent={91}
          onFinish={() => goToPhase("street-office-arrival")}
        />
      ) : null}

      {phase === "street-office-arrival" ? (
        <ExhibitionOfficeOpening
          showLookBack={false}
          onComplete={() => goToPhase("work-value")}
        />
      ) : null}

      {phase === "convenience-to-company" ? (
        <DepartureTransitionOverlay
          mapPoints={EXHIBITION_CONVENIENCE_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={9}
          mapEndPercent={91}
          onFinish={() => goToPhase("convenience-work-resume")}
        />
      ) : null}

      {phase === "convenience-work-resume" ? (
        <ExhibitionWorkDuskTransition onComplete={() => goToPhase("dessert-transition")} />
      ) : null}

      {phase === "box-game" ? (
        <CabinetBoxStackMinigameModal
          key={`exhibition-box-${runKey}`}
          baseFatigue={0}
          title="幫同事整理資料箱"
          successRewardHeading="上午的小插曲"
          successRewardLabel="資料箱整理完成"
          successFootnote="箱子疊回櫃子，下班後就能趕回家確認小白的狀況"
          onSolved={() => undefined}
          onSkip={() => goToPhase("work-complete")}
          onComplete={() => goToPhase("work-complete")}
        />
      ) : null}

      {phase === "work-dusk" ? (
        <ExhibitionWorkDuskTransition onComplete={() => goToPhase("work-leave")} />
      ) : null}

      {phase === "diary-restore" ? (
        diaryRestoreStage === "book" ? (
          <DiaryBookOpenPromptPage
            onOpen={() => {
              setDiaryRestoreStage("restoration");
              replaceExhibitionPhaseInUrl("diary-restore", "restoration");
            }}
          />
        ) : (
          <DiaryOverlay
            key={`exhibition-diary-${runKey}`}
            open
            unlockedEntryIds={["bai-entry-1"]}
            initialJournalView="entry-bai-1"
            initialBaiEntry1RestorationPreview
            baiEntry1ReadTalkLines={[...EXHIBITION_DIARY_READ_LINES]}
            initialBaiEntry1ReadTalkIndex={initialViewState.diaryReadLineIndex ?? 0}
            onBaiEntry1ReadTalkIndexChange={(index) => {
              const currentStepId = `read-${index}`;
              const steps = getExhibitionSceneJumpSteps("diary-restore");
              const currentStep = steps.find((step) => step.id === currentStepId);
              replaceExhibitionPhaseInUrl("diary-restore", currentStepId);
              if (!currentStep) return;
              dispatchSceneJumpContextChange({
                optionId: "diary-restore",
                kindLabel: currentStep.kindLabel,
                speaker: currentStep.speaker,
                text: currentStep.text,
                steps: [...steps],
                currentStepId,
              });
            }}
            hideBaiEntry1BackButton
            completeBaiEntry1NaotaroRevealOnRead
            splitBaiEntry1RestorationTextPages
            onClose={() => goToPhase("bai-change-first")}
            onDiaryRevealEntryComplete={() => goToPhase("bai-change-first")}
          />
        )
      ) : null}

      {phase === "frog-diary-fragment" ? (
        frogDiaryStage === "book" ? (
          <DiaryBookOpenPromptPage
            onOpen={() => {
              setFrogDiaryStage("catalog");
              replaceExhibitionPhaseInUrl("frog-diary-fragment", "catalog");
            }}
          />
        ) : (
          <DiaryOverlay
            key={`exhibition-frog-diary-${runKey}`}
            open
            unlockedEntryIds={["bai-entry-1"]}
            initialJournalView="list"
            previewFrogDiaryFragmentPhotoAttemptCount={0}
            initialFrogDiaryClueText="街道"
            frogDiaryLocationOrder="street-first"
            initialFrogSceneJumpStepId={
              runKey === 0 && initialPreview === "frog-diary-fragment"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onClose={() => {
              setFrogDiaryStage("book");
              replaceExhibitionPhaseInUrl("frog-diary-fragment", "book");
            }}
            onFragmentedDiaryComplete={() => goToPhase("day-one-rest")}
          />
        )
      ) : null}

      {phase === "day-one-rest" ? (
        <ExhibitionDayOneRestTransition
          initialStep={dayOneRestStep}
          onStepChange={(nextStep) => {
            setDayOneRestStep(nextStep);
            replaceExhibitionPhaseInUrl("day-one-rest", nextStep);
          }}
          onComplete={() => goToPhase("morning-route-intro")}
        />
      ) : null}

      {phase === "morning-route" ? (
        <ExhibitionStreetStoreRouteView
          initialDiaryOpen={morningRouteStep === "open-diary"}
          onDiaryOpenChange={(isOpen) => {
            const nextStep = isOpen ? "open-diary" : "route-game";
            setMorningRouteStep(nextStep);
            replaceExhibitionPhaseInUrl("morning-route", nextStep);
          }}
          onComplete={(outcome) =>
            goToPhase(outcome === "street" ? "street-flyer" : "no-sunbeast-workday")
          }
        />
      ) : null}

      {phase === "no-sunbeast-workday" ? (
        <ExhibitionWorkDuskTransition onComplete={() => goToPhase("no-sunbeast-summary")} />
      ) : null}

      {phase === "street-flyer" ? (
        streetFrogStage === "event" ? (
          <FrogDiaryClueEventModal
            key={`exhibition-street-${runKey}`}
            stage={streetFlyerStage}
            savings={12720}
            actionPower={72}
            fatigue={24}
            photoAttemptNumber={1}
            recordProgress={false}
            finishAfterPhotoCapture
            initialSceneJumpStepId={
              runKey === 0 && initialPreview === "street-flyer"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[0] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setStreetFrogStage("diary");
              replaceExhibitionPhaseInUrl("street-flyer", "diary-photo-slide");
            }}
          />
        ) : (
          <DiaryOverlay
            key={`exhibition-street-diary-${runKey}`}
            open
            mode="frog-fragmented-diary"
            unlockedEntryIds={["bai-entry-1"]}
            previewFrogDiaryFragmentPhotoAttemptCount={1}
            previewFrogPhotoImagePaths={frogPhotoImagePaths}
            frogPhotoIntroTexts={EXHIBITION_FROG_PHOTO_INTRO_TEXTS}
            frogDiaryLocationOrder="street-first"
            sceneJumpEventId={streetFlyerStage.eventId}
            initialFrogSceneJumpStepId={
              runKey === 0 && initialPreview === "street-flyer"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onClose={() => goToPhase("work-return")}
            onFragmentedDiaryComplete={() => goToPhase("work-return")}
          />
        )
      ) : null}

      {phase === "convenience-clerk" ? (
        convenienceFrogStage === "intro" ? (
          <ExhibitionForgotLunchIntro
            initialLineIndex={initialViewState.forgotLunchLineIndex}
            onComplete={() => {
              setConvenienceFrogStage("route");
              replaceExhibitionPhaseInUrl("convenience-clerk", "route");
            }}
          />
        ) : convenienceFrogStage === "route" ? (
          <ExhibitionWorkLunchConvenienceRouteView
            onComplete={() => {
              setConvenienceFrogStage("event");
              replaceExhibitionPhaseInUrl("convenience-clerk", "line-0");
            }}
          />
        ) : convenienceFrogStage === "event" ? (
          <FrogDiaryClueEventModal
            key={`exhibition-store-${runKey}`}
            stage={convenienceStage}
            savings={12640}
            actionPower={68}
            fatigue={27}
            photoAttemptNumber={2}
            recordProgress={false}
            initialSceneJumpStepId={
              runKey === 0 && initialPreview === "convenience-clerk"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[1] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setConvenienceFrogStage("diary");
              replaceExhibitionPhaseInUrl("convenience-clerk", "diary-photo-slide");
            }}
          />
        ) : (
          <DiaryOverlay
            key={`exhibition-store-diary-${runKey}`}
            open
            mode="frog-fragmented-diary"
            unlockedEntryIds={["bai-entry-1"]}
            previewFrogDiaryFragmentPhotoAttemptCount={2}
            previewFrogPhotoImagePaths={frogPhotoImagePaths}
            frogPhotoIntroTexts={EXHIBITION_FROG_PHOTO_INTRO_TEXTS}
            frogDiaryLocationOrder="street-first"
            sceneJumpEventId={convenienceStage.eventId}
            initialFrogSceneJumpStepId={
              runKey === 0 && initialPreview === "convenience-clerk"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onClose={() => goToPhase("convenience-photo-return")}
            onFragmentedDiaryComplete={() => goToPhase("convenience-photo-return")}
          />
        )
      ) : null}

      {phase === "work-value" ? <OfficeWorkValueMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-todo" ? <OfficeTodoIncrementalMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-pack" ? <OfficePackingDeskMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-social" ? <OfficeSocialCanvasMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-files" ? <OfficeFileMatchMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-flow" ? <OfficeWorkflowAutomationMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}
      {phase === "work-clicker" ? <OfficeCreatorStudioIncrementalMinigame onSkip={() => goToPhase("convenience-clerk")} onComplete={() => goToPhase("convenience-clerk")} /> : null}

      {phase === "frog-dessert" ? (
        dessertFrogStage === "event" ? (
          <FrogDiaryClueEventModal
            key={`exhibition-dessert-${runKey}`}
            stage={dessertStage}
            savings={12480}
            actionPower={58}
            fatigue={34}
            photoAttemptNumber={3}
            requiredPhotoAttempts={3}
            recordProgress={false}
            initialSceneJumpStepId={
              runKey === 0 && initialPreview === "frog-dessert"
                ? initialSceneStep ?? undefined
                : undefined
            }
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[2] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setDessertFrogStage("diary");
              replaceExhibitionPhaseInUrl("frog-dessert", "diary-photo-slide");
            }}
          />
        ) : (
          <DiaryOverlay
            key={`exhibition-dessert-diary-${runKey}`}
            open
            mode="frog-fragmented-diary"
            unlockedEntryIds={["bai-entry-1"]}
            previewFrogDiaryFragmentPhotoAttemptCount={3}
            previewFrogPhotoImagePaths={frogPhotoImagePaths}
            frogPhotoIntroTexts={EXHIBITION_FROG_PHOTO_INTRO_TEXTS}
            frogDiaryLocationOrder="street-first"
            completeFrogDiaryOnRead
            sceneJumpEventId={dessertStage.eventId}
            initialFrogSceneJumpStepId={
              runKey === 0 && initialPreview === "frog-dessert"
                ? getExhibitionFrogReadLineIndex(initialSceneStep) !== null
                  ? "frog-diary-reaction"
                  : initialSceneStep ?? undefined
                : undefined
            }
            initialDiaryReadTalkIndex={
              runKey === 0 && initialPreview === "frog-dessert"
                ? getExhibitionFrogReadLineIndex(initialSceneStep) ?? 0
                : 0
            }
            onDiaryReadTalkIndexChange={(index) => {
              const currentStepId = `diary-read-${index}`;
              const steps = getExhibitionSceneJumpSteps("frog-dessert");
              const currentStep = steps.find((step) => step.id === currentStepId);
              replaceExhibitionPhaseInUrl("frog-dessert", currentStepId);
              if (!currentStep) return;
              dispatchSceneJumpContextChange({
                optionId: "frog-dessert",
                kindLabel: currentStep.kindLabel,
                speaker: currentStep.speaker,
                text: currentStep.text,
                steps: [...steps],
                currentStepId,
              });
            }}
            onClose={() => goToPhase("home-final")}
            onFragmentedDiaryComplete={() => goToPhase("home-final")}
          />
        )
      ) : null}

      {phase === "complete" ? (
        <CompleteCard
          onRestart={restart}
          naotaroPhotoImagePath={naotaroPhotoImagePath}
          frogPhotoImagePath={frogPhotoImagePaths[2] ?? EXHIBITION_FROG_PHOTO_FALLBACK}
        />
      ) : null}

    </Flex>
  );
}

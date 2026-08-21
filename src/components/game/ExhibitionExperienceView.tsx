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
  ExhibitionHomeMetroRouteView,
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
  EXHIBITION_NARRATIVE_LINES,
  EXHIBITION_NARRATIVE_NEXT_PHASE,
  type ExhibitionNarrativePhase,
  type ExhibitionPhase,
} from "@/lib/game/exhibitionFlow";
import { FROG_DIARY_CLUE_STAGES } from "@/lib/game/frogDiaryClueFlow";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import {
  playFmodGameEvent,
  prepareFmodGameMusicTrack,
  setFmodGameMusicTrack,
  setFmodOfficeAmbienceActive,
} from "@/lib/game/fmodWeb";

const panelFromRight = keyframes`
  from { opacity: 0; transform: translateX(42px) rotate(2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const panelFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-42px) rotate(-2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const exhibitionBeigoRushPanelFromRight = keyframes`
  0% { opacity: 0; transform: translateX(calc(-50% + 72px)); }
  100% { opacity: 1; transform: translateX(-50%); }
`;

const clueCardIn = keyframes`
  from { opacity: 0; transform: translateY(10px) rotate(-2deg) scale(0.97); }
  to { opacity: 1; transform: translateY(0) rotate(-1deg) scale(1); }
`;

const lightOrbFloat = keyframes`
  0% { opacity: 0; transform: translate(-42px, 86px) scale(0.55); }
  35% { opacity: 1; transform: translate(-4px, 22px) scale(1); }
  100% { opacity: 0.78; transform: translate(42px, -54px) scale(0.72); }
`;

const exhibitionDiaryOpenIn = keyframes`
  from { opacity: 0; transform: translate(-50%, 24px) scale(0.88); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
`;

const exhibitionDiaryGridPulse = keyframes`
  0%, 100% { opacity: 0.72; transform: translate(-50%, -50%) scale(0.9); filter: brightness(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); filter: brightness(1.3); }
`;

const exhibitionDiaryGridFly = keyframes`
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate3d(0, 0, 0) rotate(-4deg) scale(1);
    filter: brightness(1.1) blur(0);
  }
  72% {
    opacity: 1;
    transform: translate(-50%, -50%) translate3d(18px, -78px, 0) rotate(3deg) scale(0.78);
    filter: brightness(1.45) blur(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate3d(22px, -92px, 0) rotate(5deg) scale(0.3);
    filter: brightness(2) blur(1px);
  }
`;

const exhibitionDiaryGridAbsorb = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.22); }
  28% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.1); }
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
  frogDiaryStage: ExhibitionFrogDiaryStage;
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
  "metro-arrival",
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
  "work-return",
  "dessert-transition",
  "home-final",
];

const EXHIBITION_OFFICE_AMBIENCE_PHASES: readonly ExhibitionPhase[] = [
  "office-opening",
  "work-arrival",
  "box-game",
  "work-complete",
  "work-dusk",
  "work-return",
  "work-value",
  "work-todo",
  "work-pack",
  "work-social",
  "work-files",
  "work-flow",
  "work-clicker",
];

const EXHIBITION_NARRATIVE_BACKGROUND_IMAGES = Array.from(
  new Set(
    NARRATIVE_PHASES.flatMap((phase) =>
      EXHIBITION_NARRATIVE_LINES[phase].map((line) => line.backgroundImage),
    ),
  ),
);

const EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS = [
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
const GOLDEN_RETRIEVER_RUN_COMIC =
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_黃金獵犬.png";
const GOLDEN_RETRIEVER_DOOR_COMICS = [
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運3.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運２.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運１.png",
] as const;
const BEIGO_BAG_COMICS = [
  "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
] as const;
const BEIGO_REVEAL_COMIC_COMPLETE_MS = 1180;
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
const EXHIBITION_MAI_CHARACTER_INTRO_CARD: CharacterIntroCard = {
  ...MAI_CHARACTER_INTRO_CARD,
  sceneId: "exhibition-mai-intro",
  descriptionLines: ["職場新鮮人", "有一個室友小白"],
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

  return {
    phase,
    lineIndex: requestedLineIndex >= 0 ? requestedLineIndex : 0,
    photoDiaryStage:
      phase === "dog-photo-diary" && isExhibitionPhotoDiaryStage(initialSceneStep)
        ? initialSceneStep
        : "book",
    diaryRestoreStage:
      phase === "diary-restore" && isExhibitionDiaryRestoreStage(initialSceneStep)
        ? initialSceneStep
        : "book",
    frogDiaryStage:
      phase === "frog-diary-fragment" && isExhibitionFrogDiaryStage(initialSceneStep)
        ? initialSceneStep
        : "book",
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

function ExhibitionDiaryLightTransfer({
  stage,
}: {
  stage: "page" | "flying" | "absorbed";
}) {
  const showDiary = stage !== "absorbed";
  const showGrid = stage === "page" || stage === "flying";

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={5}
      overflow="hidden"
      pointerEvents="none"
      data-exhibition-diary-light-transfer={stage}
    >
      {showDiary ? (
        <Flex
          position="absolute"
          left="50%"
          bottom="178px"
          w="74%"
          maxW="292px"
          transform="translateX(-50%)"
          borderRadius="6px"
          overflow="hidden"
          boxShadow="0 14px 28px rgba(13,18,39,0.46)"
          animation={`${exhibitionDiaryOpenIn} 420ms cubic-bezier(0.2, 0.74, 0.18, 1) both`}
        >
          <img
            src="/images/comic/book.jpg"
            alt="攤開的交換日記"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Flex>
      ) : null}

      {showGrid ? (
        <Box
          position="absolute"
          left="44%"
          top="58%"
          w="48px"
          h="48px"
          border="2px solid rgba(255,255,255,0.94)"
          borderRadius="7px"
          bgColor="rgba(255,246,185,0.88)"
          boxShadow="0 0 14px rgba(255,249,210,0.96), 0 0 34px rgba(255,214,96,0.78), 0 0 72px rgba(255,177,48,0.38)"
          animation={
            stage === "flying"
              ? `${exhibitionDiaryGridFly} 1180ms cubic-bezier(0.2, 0.72, 0.14, 1) both`
              : `${exhibitionDiaryGridPulse} 920ms ease-in-out infinite`
          }
        />
      ) : null}

      {stage === "absorbed" ? (
        <Box
          position="absolute"
          left="50%"
          top="47%"
          w="74px"
          h="74px"
          borderRadius="999px"
          bg="radial-gradient(circle, rgba(255,255,244,1) 0 16%, rgba(255,228,124,0.92) 28%, rgba(255,194,74,0.24) 56%, transparent 72%)"
          boxShadow="0 0 32px rgba(255,239,162,0.92), 0 0 84px rgba(255,189,70,0.58)"
          animation={`${exhibitionDiaryGridAbsorb} 980ms ease-out both`}
        />
      ) : null}
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
  const [activeDoorSwipeLineId, setActiveDoorSwipeLineId] = useState<string | null>(null);
  const isLocationTransitionPlaying =
    shouldPlayLocationTransition && completedLocationTransitionLineId !== line.id;
  const isAutomaticDoorTransitionPlaying =
    shouldPlayAutomaticDoorTransition && completedAutomaticDoorLineId !== line.id;
  const isBaiRoomFullImageIntroPlaying =
    shouldPlayBaiRoomFullImageIntro && completedBaiRoomFullImageIntroLineId !== line.id;
  const isIntroTransitionPlaying =
    isLocationTransitionPlaying ||
    isAutomaticDoorTransitionPlaying ||
    isBaiRoomFullImageIntroPlaying;
  const isDoorSwipeInteractionPlaying =
    Boolean(line.doorSwipeInteraction) && activeDoorSwipeLineId === line.id;
  const [displayedAvatarFrameIndex, setDisplayedAvatarFrameIndex] = useState(
    line.avatar?.frameSequence?.[0] ?? line.avatar?.frameIndex,
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
    setIsFallFullscreenPlaying(false);
    setIsBeigoDiaryRevealPlaying(false);
  }, [line.id]);

  useEffect(() => {
    if (line.comicPresentation !== "door-close-single") return;
    playGameSfx("comicDoorClose");
  }, [line.comicPresentation, line.id]);

  useEffect(() => {
    if (line.id !== "EX-METRO-01C") return;
    return playGameSfxSequence(["metroAnnouncement1"]);
  }, [line.id]);

  const handleNarrativeContinue = () => {
    if (isBeigoDiaryRevealPlaying) return;
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

      {line.diaryLightTransfer ? (
        <ExhibitionDiaryLightTransfer stage={line.diaryLightTransfer} />
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

      {isLocationTransitionPlaying ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={20}
          overflow="hidden"
          bgColor="#E8DFD2"
          pointerEvents="none"
          data-exhibition-transition="metro-arrival"
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
      !isDoorSwipeInteractionPlaying ? (
        <Flex
          w="100%"
          flexShrink={0}
          position="relative"
          zIndex={12}
          animation={
            shouldPlayLocationTransition || shouldPlayAutomaticDoorTransition
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
            avatarMotionId={line.avatar?.motionId}
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
      />
    </Flex>
  );
}

function ExhibitionOfficeOpening({ onComplete }: { onComplete: () => void }) {
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
    const lookTimer = window.setTimeout(() => {
      setIsMaiLookingBack(true);
    }, EXHIBITION_OFFICE_LOOK_DELAY_MS);
    const continueReadyTimer = window.setTimeout(() => {
      setIsContinueReady(true);
    }, EXHIBITION_OFFICE_CONTINUE_DELAY_MS);
    const completeTimer = window.setTimeout(complete, EXHIBITION_OFFICE_OPENING_DURATION_MS);

    return () => {
      window.clearInterval(workFrameTimer);
      window.clearTimeout(workStartTimer);
      window.clearTimeout(lookTimer);
      window.clearTimeout(continueReadyTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

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
  const onAdvanceRef = useRef(onAdvance);

  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    // 與主線 ch01MetroDogRun 相同：下格進場完成後再開始播三張車門圖。
    playGameSfx("comicPanelPop");
    const lowerPanelSoundTimer = window.setTimeout(() => playGameSfx("comicPanelPop"), 420);
    const doorTimerOne = window.setTimeout(() => setVisibleDoorFrameCount(1), 980);
    const doorTimerTwo = window.setTimeout(() => setVisibleDoorFrameCount(2), 1200);
    const advanceTimer = window.setTimeout(() => onAdvanceRef.current(), 1800);
    return () => {
      window.clearTimeout(lowerPanelSoundTimer);
      window.clearTimeout(doorTimerOne);
      window.clearTimeout(doorTimerTwo);
      window.clearTimeout(advanceTimer);
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
    </Flex>
  );
}

function BeigoBagComic({ presentation }: { presentation: "bag" | "reveal" }) {
  const [showFinalPeek, setShowFinalPeek] = useState(false);
  const hasPlayedEnterSfxRef = useRef(false);

  useEffect(() => {
    const playEnterSfx = () => {
      if (hasPlayedEnterSfxRef.current) return;
      hasPlayedEnterSfxRef.current = true;
      playGameSfx("comicPanelPop");
    };

    if (presentation === "bag") {
      playEnterSfx();
      return;
    }

    const enterSfxTimer = window.setTimeout(playEnterSfx, 140);
    // 主線下格：140ms 後進場、380ms 完成、400ms 後替換最終圖。
    const finalPeekTimer = window.setTimeout(() => setShowFinalPeek(true), 920);
    return () => {
      window.clearTimeout(enterSfxTimer);
      window.clearTimeout(finalPeekTimer);
    };
  }, [presentation]);

  return (
    <>
      <Flex
        position="absolute"
        top="80px"
        right="0"
        zIndex={7}
        w="280px"
        h="170px"
        overflow="hidden"
        pointerEvents="none"
        animation={presentation === "bag" ? `${panelFromRight} 380ms ease both` : undefined}
      >
        <img
          src={BEIGO_BAG_COMICS[0]}
          alt="蠕動的袋子"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </Flex>
      {presentation === "reveal" ? (
        <Flex
          position="absolute"
          top="280px"
          left="0"
          zIndex={8}
          w="280px"
          h="170px"
          overflow="hidden"
          pointerEvents="none"
          animation={`${panelFromLeft} 380ms ease 140ms both`}
        >
          <img
            src={BEIGO_BAG_COMICS[1]}
            alt="小貝狗從袋子裡探頭"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <img
            src={BEIGO_BAG_COMICS[2]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: showFinalPeek ? 1 : 0,
              transition: "opacity 260ms ease",
            }}
          />
        </Flex>
      ) : null}
    </>
  );
}

type ExhibitionMetroDogLine = {
  speaker: "小麥" | "小貝狗";
  text: string;
  spriteId: "mai" | "beigo";
  frameIndex: number;
  motionId?: "jump-once" | "sway-horizontal" | "pop-scale";
  showCameraComic?: boolean;
  beigoComicPresentation?: "bag" | "reveal";
  typingPauseAfterText?: string;
  typingPauseDelayMs?: number;
};

const EXHIBITION_METRO_DOG_BEFORE_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "呃！怎麼會有黃金獵犬？",
    spriteId: "mai",
    frameIndex: 33,
  },
  {
    speaker: "小麥",
    text: "等等……車門關上了，牠的尾巴還被夾住了！",
    spriteId: "mai",
    frameIndex: 33,
  },
  {
    speaker: "小麥",
    text: "嗯？怎麼感覺包裡有東西在動……",
    spriteId: "mai",
    frameIndex: 32,
    beigoComicPresentation: "bag",
  },
  {
    speaker: "小麥",
    text: "哇！你什麼時候跟過來的！",
    spriteId: "mai",
    frameIndex: 25,
    beigoComicPresentation: "reveal",
    typingPauseAfterText: "哇！",
    typingPauseDelayMs: BEIGO_REVEAL_COMIC_COMPLETE_MS,
  },
  {
    speaker: "小貝狗",
    text: "小日獸！小日獸！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "jump-once",
  },
  {
    speaker: "小麥",
    text: "你說的小日獸……是指牠？",
    spriteId: "mai",
    frameIndex: 34,
  },
  {
    speaker: "小貝狗",
    text: "拍照！拍照！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "sway-horizontal",
  },
  {
    speaker: "小麥",
    text: "拍照？你是要我拍牠？",
    spriteId: "mai",
    frameIndex: 33,
    showCameraComic: true,
  },
  {
    speaker: "小麥",
    text: "好啦好啦，別催！我按就是了……",
    spriteId: "mai",
    frameIndex: 21,
    showCameraComic: true,
  },
] as const;

const EXHIBITION_METRO_DOG_AFTER_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "咦？黃金獵犬呢？",
    spriteId: "mai",
    frameIndex: 35,
  },
  {
    speaker: "小貝狗",
    text: "嗷！小日獸是從小白的交換日記裡逃出來的日記片段！",
    spriteId: "beigo",
    frameIndex: 2,
    motionId: "jump-once",
  },
  {
    speaker: "小麥",
    text: "所以……剛才那隻黃金獵犬，是從小白的日記裡跑出來的？",
    spriteId: "mai",
    frameIndex: 36,
  },
  {
    speaker: "小貝狗",
    text: "嗷！拍下來，就能把小日獸帶回去！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "jump-once",
  },
  {
    speaker: "小麥",
    text: "小白的日記……難道那天的異狀，也和小日獸有關？",
    spriteId: "mai",
    frameIndex: 37,
  },
] as const;

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

        {!isPhotoMode && line.beigoComicPresentation ? (
          <BeigoBagComic
            key={`${lineIndex}-${line.beigoComicPresentation}`}
            presentation={line.beigoComicPresentation}
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
          showAvatarSprite
          avatarSpriteId={line.spriteId}
          avatarFrameIndex={line.frameIndex}
          avatarMotionId={line.motionId}
          typingMode={typingMode}
          typingPauseAfterText={line.typingPauseAfterText}
          typingPauseDelayMs={line.typingPauseDelayMs}
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

const EXHIBITION_FORGOT_LUNCH_LINES = [
  { speaker: "旁白", text: "中午時間。" },
  { speaker: "小麥", text: "糟糕，早上急著出門，忘記帶便當了⋯⋯", spriteId: "mai" as const, frameIndex: 34 },
  { speaker: "小貝狗", text: "嗷，怎麼辦？", spriteId: "beigo" as const, frameIndex: 1, motionId: "sway-horizontal" as const },
  { speaker: "小麥", text: "沒關係，那就去便利商店買午餐好了。", spriteId: "mai" as const, frameIndex: 18 },
  { speaker: "小貝狗", text: "嗷！", spriteId: "beigo" as const, frameIndex: 2, motionId: "jump-once" as const },
] as const;

function ExhibitionForgotLunchIntro({ onComplete }: { onComplete: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [typingMode] = useState(loadDialogTypingMode);
  const line = EXHIBITION_FORGOT_LUNCH_LINES[lineIndex];
  const isNarration = line.speaker === "旁白";

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
          dialogueItalicPrefix={isNarration ? line.text : undefined}
          onContinue={() => {
            if (lineIndex < EXHIBITION_FORGOT_LUNCH_LINES.length - 1) {
              setLineIndex((current) => current + 1);
              return;
            }
            onComplete();
          }}
          showAvatarSprite={"spriteId" in line}
          showCharacterName={!isNarration}
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
  const [streetFrogStage, setStreetFrogStage] = useState<ExhibitionStreetFrogStage>(
    initialPreview === "street-flyer" && initialSceneStep === "diary" ? "diary" : "event",
  );
  const [convenienceFrogStage, setConvenienceFrogStage] =
    useState<ExhibitionConvenienceFrogStage>(() => {
      if (initialPreview !== "convenience-clerk") return "intro";
      return initialSceneStep === "route" || initialSceneStep === "event" || initialSceneStep === "diary"
        ? initialSceneStep
        : "intro";
    });
  const [dessertFrogStage, setDessertFrogStage] = useState<ExhibitionDessertFrogStage>(
    initialPreview === "frog-dessert" && initialSceneStep === "diary" ? "diary" : "event",
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
  const streetFlyerStage = FROG_DIARY_CLUE_STAGES[1];
  const convenienceStage = FROG_DIARY_CLUE_STAGES[0];
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
    prepareFmodGameMusicTrack("exhibitionFlashback");
  }, []);

  useEffect(() => {
    setFmodGameMusicTrack(
      phase === "argument-flashback" ? "exhibitionFlashback" : "mainTheme",
    );
  }, [phase]);

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
      BEIGO_REVEAL_BACKGROUND,
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
    if (initialPreview === null) {
      replaceExhibitionPhaseInUrl(
        "departure-opening",
        EXHIBITION_NARRATIVE_LINES["departure-opening"][0]?.id,
      );
      return;
    }

    if (isNarrativePhase(initialPreview)) {
      const initialLine = EXHIBITION_NARRATIVE_LINES[initialPreview][initialViewState.lineIndex];
      if (initialSceneStep !== initialLine?.id) {
        replaceExhibitionPhaseInUrl(initialPreview, initialLine?.id);
      }
      return;
    }

    if (initialPreview === "dog-photo-diary") {
      if (initialSceneStep !== initialViewState.photoDiaryStage) {
        replaceExhibitionPhaseInUrl(initialPreview, initialViewState.photoDiaryStage);
      }
      return;
    }

    if (initialPreview === "diary-restore") {
      if (initialSceneStep !== initialViewState.diaryRestoreStage) {
        replaceExhibitionPhaseInUrl(initialPreview, initialViewState.diaryRestoreStage);
      }
      return;
    }

    if (initialPreview === "frog-diary-fragment") {
      if (initialSceneStep !== initialViewState.frogDiaryStage) {
        replaceExhibitionPhaseInUrl(initialPreview, initialViewState.frogDiaryStage);
      }
      return;
    }

    if (initialPreview === "street-flyer") {
      const expectedStreetStage = initialSceneStep === "diary" ? "diary" : "event";
      if (initialSceneStep !== expectedStreetStage) {
        replaceExhibitionPhaseInUrl(initialPreview, expectedStreetStage);
      }
      return;
    }

    if (initialPreview === "convenience-clerk") {
      const expectedConvenienceStage =
        initialSceneStep === "route" || initialSceneStep === "event" || initialSceneStep === "diary"
          ? initialSceneStep
          : "intro";
      if (initialSceneStep !== expectedConvenienceStage) {
        replaceExhibitionPhaseInUrl(initialPreview, expectedConvenienceStage);
      }
      return;
    }

    if (initialPreview === "frog-dessert") {
      const expectedDessertStage = initialSceneStep === "diary" ? "diary" : "event";
      if (initialSceneStep !== expectedDessertStage) {
        replaceExhibitionPhaseInUrl(initialPreview, expectedDessertStage);
      }
      return;
    }

    if (initialPreview !== "metro-dog" && initialSceneStep !== null) {
      replaceExhibitionPhaseInUrl(initialPreview);
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

  const goToPhase = (nextPhase: ExhibitionPhase) => {
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
      nextPhase === "dog-photo-diary"
        ? "book"
        : nextPhase === "diary-restore"
          ? "book"
        : nextPhase === "frog-diary-fragment"
          ? "book"
        : isNarrativePhase(nextPhase)
        ? EXHIBITION_NARRATIVE_LINES[nextPhase][0]?.id
        : undefined,
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
    goToPhase(EXHIBITION_NARRATIVE_NEXT_PHASE[phase]);
  };

  const restart = () => {
    setRunKey((current) => current + 1);
    setLineIndex(0);
    setPhotoDiaryStage("book");
    setDiaryRestoreStage("book");
    setFrogDiaryStage("book");
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

      {phase === "departure-route" ? <ExhibitionHomeMetroRouteView onComplete={() => goToPhase("metro-arrival")} /> : null}

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
          onComplete={() => goToPhase("argument-flashback")}
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
            onClose={() => {
              setFrogDiaryStage("book");
              replaceExhibitionPhaseInUrl("frog-diary-fragment", "book");
            }}
            onFragmentedDiaryComplete={() => goToPhase("morning-route-intro")}
          />
        )
      ) : null}

      {phase === "morning-route" ? <ExhibitionStreetStoreRouteView onComplete={() => goToPhase("street-flyer")} /> : null}

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
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[0] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setStreetFrogStage("diary");
              replaceExhibitionPhaseInUrl("street-flyer", "diary");
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
            onClose={() => goToPhase("work-return")}
            onFragmentedDiaryComplete={() => goToPhase("work-return")}
          />
        )
      ) : null}

      {phase === "convenience-clerk" ? (
        convenienceFrogStage === "intro" ? (
          <ExhibitionForgotLunchIntro
            onComplete={() => {
              setConvenienceFrogStage("route");
              replaceExhibitionPhaseInUrl("convenience-clerk", "route");
            }}
          />
        ) : convenienceFrogStage === "route" ? (
          <ExhibitionWorkLunchConvenienceRouteView
            onComplete={() => {
              setConvenienceFrogStage("event");
              replaceExhibitionPhaseInUrl("convenience-clerk", "event");
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
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[1] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setConvenienceFrogStage("diary");
              replaceExhibitionPhaseInUrl("convenience-clerk", "diary");
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
            onClose={() => goToPhase("dessert-transition")}
            onFragmentedDiaryComplete={() => goToPhase("dessert-transition")}
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
            onPhotoCaptured={(capture) => {
              setFrogPhotoImagePaths((current) => {
                const next = [...current];
                next[2] = capture.framePreviewUrl;
                return next;
              });
            }}
            onFinish={() => {
              setDessertFrogStage("diary");
              replaceExhibitionPhaseInUrl("frog-dessert", "diary");
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
            completeFrogDiaryOnRead
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

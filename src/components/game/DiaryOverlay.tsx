"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaBook, FaLocationDot, FaPaw } from "react-icons/fa6";
import { TbHandFinger } from "react-icons/tb";
import { EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { GAME_EMOTION_CUE_TRIGGER } from "@/lib/game/emotionCueBus";
import {
  FROG_ACTIVE_CLUE_TEXT,
  FROG_SUNBEAST_NAME,
} from "@/lib/game/frogVariant";
import {
  buildFrogDiaryClueSceneJumpSteps,
  FROG_MOVING_DIARY_FRAGMENT,
  getFrogDiaryClueAttemptNumberByEventId,
  getFrogDiaryClueStageByAttempt,
  getFrogDiaryClueStageByEventId,
  type FrogDiaryClueEventId,
} from "@/lib/game/frogDiaryClueFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";
import {
  convertPhotoScoreToPoints,
  finalizeDiaryFirstRevealReward,
  getLatestSunbeastPhotoCapture,
  getStickerRollWeightsByPoints,
  getSunbeastPhotoCaptures,
  loadPlayerProgress,
  savePlayerProgress,
  rollStickerByPoints,
  type DiaryEntryId,
  type PhotoCaptureSnapshot,
  type PlayerProgress,
  type StickerId,
} from "@/lib/game/playerProgress";
import {
  SUNBEAST_REGISTRY,
  isSunbeastId,
  type SunbeastId,
} from "@/lib/game/sunbeastRegistry";

type DiaryOverlayProps = {
  open: boolean;
  onClose: () => void;
  unlockedEntryIds: string[];
  mode?: DiaryOverlayMode;
  revealEntryId?: DiaryEntryId;
  initialJournalView?: DiaryJournalView;
  initialBaiEntry1RestorationPreview?: boolean;
  previewFrogDiaryFragmentPhotoAttemptCount?: number;
  initialSunbeastCardId?: string | null;
  sceneJumpEventId?: FrogDiaryClueEventId | null;
  onGuidedFlowComplete?: () => void;
  onDiaryRevealEntryComplete?: () => void;
  onSunbeastHintGuideComplete?: () => void;
  onBeigoProfileComplete?: () => void;
  onFragmentedDiaryComplete?: () => void;
  onFrogReturnHomeDiaryGuideComplete?: () => void;
  showReturnButton?: boolean;
};

export type DiaryOverlayMode =
  | "default"
  | "diary-reveal"
  | "first-photo-diary-reveal"
  | "second-photo-diary-reveal"
  | "sunbeast-koala-reveal"
  | "sunbeast-chicken-reveal"
  | "sunbeast-cat-reveal"
  | "sunbeast-reveal"
  | "beigo-profile"
  | "fragmented-diary"
  | "frog-fragmented-diary"
  | "frog-diary-catalog-guide"
  | "frog-return-home-diary-guide"
  | "marketing-diary-thread"
  | "sunbeast";

export type DiaryJournalView =
  | "list"
  | "entry-bai-1"
  | "entry-bai-2-fragment"
  | "entry-bai-2"
  | "entry-bai-3"
  | "entry-bai-5";

const unlockPulse = keyframes`
  0% { transform: scale(0.98); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
  30% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(255, 220, 145, 0.24); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
`;

const diaryBgFloat = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-4px, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

const diaryDotDrift = keyframes`
  0% {
    background-position: 0 0, 18px 10px, 34px 22px, 4px 34px, 52px 6px, 10px 54px, 62px 30px, 28px 70px, 76px 48px, 46px 88px, 88px 12px, 6px 92px;
  }
  100% {
    background-position: -78px 72px, -80px 96px, -42px 118px, -104px 108px, -10px 96px, -104px 148px, -18px 138px, -78px 142px, -4px 126px, -62px 166px, -2px 102px, -100px 172px;
  }
`;

const fingerUpSwipe = keyframes`
  0% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
  50% { transform: translateX(-50%) translateY(-8px) rotate(180deg); opacity: 1; }
  100% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
`;

const diaryEntryPointerNudge = keyframes`
  0% { transform: translateY(-50%) translateX(-2px) rotate(90deg); opacity: 0.78; }
  50% { transform: translateY(-50%) translateX(7px) rotate(90deg); opacity: 1; }
  100% { transform: translateY(-50%) translateX(-2px) rotate(90deg); opacity: 0.78; }
`;

const diaryMaskInkWaver = keyframes`
  0% {
    background-position: 0 0, 46px 12px, 18px 8px, 104px 18px;
  }
  45% {
    background-position: 2px 0, 43px 12px, 14px 8px, 108px 18px;
  }
  72% {
    background-position: -1px 0, 49px 12px, 20px 8px, 100px 18px;
  }
  100% {
    background-position: 0 0, 46px 12px, 18px 8px, 104px 18px;
  }
`;

const polaroidStickIn = keyframes`
  0% { transform: translateY(24px) rotate(-4deg) scale(0.9); opacity: 0; }
  45% { transform: translateY(-6px) rotate(7deg) scale(1.03); opacity: 1; }
  100% { transform: translateY(0) rotate(5deg) scale(1); opacity: 1; }
`;

const frogPhotoStackSlideIn = keyframes`
  0% {
    transform: translate3d(var(--frog-stack-enter-x), var(--frog-stack-enter-y), 0) rotate(var(--frog-stack-enter-rotate)) scale(0.82);
    opacity: 0;
    filter: blur(1.5px);
  }
  54% {
    transform: translate3d(var(--frog-stack-settle-x), -8px, 0) rotate(var(--frog-stack-settle-rotate)) scale(1.035);
    opacity: var(--frog-stack-opacity);
    filter: blur(0);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(var(--frog-stack-rotate)) scale(1);
    opacity: var(--frog-stack-opacity);
    filter: blur(0);
  }
`;

const frogDiscoveryPhotoSlideIn = keyframes`
  0% { transform: translateY(150px) rotate(var(--frog-photo-enter-rotate)) scale(0.78); opacity: 0; }
  46% { transform: translateY(-8px) rotate(var(--frog-photo-settle-rotate)) scale(1.03); opacity: 1; }
  100% { transform: translateY(0) rotate(var(--frog-photo-rotate)) scale(1); opacity: 1; }
`;

const frogPhotoChargeGlow = keyframes`
  0%, 28% { opacity: 0; transform: scale(0.92); }
  52% { opacity: 0.76; transform: scale(1.03); }
  100% { opacity: 0; transform: scale(1.12); }
`;

const frogPhotoProgressLightTrail = keyframes`
  0% {
    opacity: 0;
    transform: translate3d(-50%, 0, 0) rotate(-8deg) scale(0.58);
    filter: blur(0.5px);
  }
  18% {
    opacity: 0.9;
    filter: blur(0);
  }
  72% {
    opacity: 0.78;
    filter: blur(0);
  }
  100% {
    opacity: 0;
    transform: translate3d(-50%, -36vh, 0) rotate(-8deg) scale(0.24);
    filter: blur(1.4px);
  }
`;

const frogCaptureMeterFillAdvance = keyframes`
  0% { width: var(--frog-meter-start-width); }
  100% { width: var(--frog-meter-end-width); }
`;

const frogShadowResolveOut = keyframes`
  0%, 38% { opacity: 1; transform: scale(1); filter: brightness(0) saturate(100%) invert(45%) sepia(24%) saturate(739%) hue-rotate(350deg) brightness(85%) contrast(86%); }
  100% { opacity: 0; transform: scale(1.04); filter: brightness(1.04) saturate(1); }
`;

const frogResolvedRevealIn = keyframes`
  0%, 34% { opacity: 0; transform: scale(0.88); }
  72% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

const firstPhotoSlideAcross = keyframes`
  0% { transform: translateX(-185px) rotate(-7deg); opacity: 0; }
  16% { opacity: 1; }
  84% { opacity: 1; }
  100% { transform: translateX(185px) rotate(6deg); opacity: 0; }
`;

const revealStageIn = keyframes`
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const diarySlidePageIn = keyframes`
  0% { transform: translateX(34px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const diaryPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const diaryTypeCursorBlink = keyframes`
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
`;

const diaryKeywordCircleIn = keyframes`
  0% { transform: scale(0.92) rotate(-2deg); opacity: 0.6; }
  62% { transform: scale(1.06) rotate(-2deg); opacity: 1; }
  100% { transform: scale(1) rotate(-2deg); opacity: 1; }
`;

const diaryKeywordResolveIn = keyframes`
  0% { filter: blur(2px); transform: translateY(2px); opacity: 0.72; }
  100% { filter: blur(0); transform: translateY(0); opacity: 1; }
`;

const metroPuzzleCompleteGlow = keyframes`
  0% { box-shadow: 0 8px 18px rgba(95, 67, 44, 0.08), inset 0 0 0 1px rgba(255,255,255,0.68); }
  44% { box-shadow: 0 0 0 7px rgba(214, 165, 93, 0.2), 0 14px 24px rgba(95, 67, 44, 0.14), inset 0 0 0 1px rgba(255,255,255,0.82); }
  100% { box-shadow: 0 8px 18px rgba(95, 67, 44, 0.08), inset 0 0 0 1px rgba(255,255,255,0.68); }
`;

const metroPuzzleRitualSettle = keyframes`
  0% { transform: translate3d(0, 0, 0) scale(1); filter: saturate(1); }
  42% { transform: translate3d(0, -3px, 0) scale(1.008); filter: saturate(1.08) brightness(1.04); }
  68% { transform: translate3d(0, 1px, 0) scale(0.998); filter: saturate(1.03); }
  100% { transform: translate3d(0, 0, 0) scale(1); filter: saturate(1.03) brightness(1.01); }
`;

const metroPuzzleFramePulse = keyframes`
  0% { border-color: rgba(100,112,125,0.88); box-shadow: inset 0 0 0 rgba(255,255,255,0); }
  42% { border-color: rgba(155,124,95,0.96); box-shadow: inset 0 0 0 3px rgba(255,255,255,0.42); }
  100% { border-color: rgba(100,112,125,0.9); box-shadow: inset 0 0 0 rgba(255,255,255,0); }
`;

const metroPuzzleDividerPulse = keyframes`
  0% { background-color: rgba(100,112,125,0.88); }
  42% { background-color: rgba(155,124,95,0.96); }
  100% { background-color: rgba(100,112,125,0.9); }
`;

const metroPuzzleQuestionPulse = keyframes`
  0% { transform: scale(0.92); opacity: 0.72; text-shadow: none; }
  42% { transform: scale(1.14); opacity: 1; text-shadow: 0 0 14px rgba(255,255,255,0.76); }
  100% { transform: scale(1); opacity: 1; text-shadow: 0 1px 0 rgba(100,112,125,0.18); }
`;

const baiEntry1PhotoPieceRestoreIn = keyframes`
  0%, 24% { opacity: 0; filter: brightness(1.8) blur(2px) saturate(0.84); }
  58% { opacity: 1; filter: brightness(1.18) blur(0) saturate(1.08); }
  100% { opacity: 1; filter: brightness(1) blur(0) saturate(1); }
`;

const baiEntry1PhotoPieceFlashOut = keyframes`
  0% { opacity: 0; background-color: rgba(255,255,255,0); box-shadow: inset 0 0 0 rgba(255,255,255,0); }
  18% { opacity: 1; background-color: rgba(255,255,255,0.96); box-shadow: inset 0 0 24px rgba(255,255,255,0.96), 0 0 22px rgba(255,255,255,0.72); }
  48% { opacity: 0.88; background-color: rgba(255,255,255,0.82); box-shadow: inset 0 0 18px rgba(255,255,255,0.9), 0 0 18px rgba(255,255,255,0.52); }
  100% { opacity: 0; background-color: rgba(255,255,255,0); box-shadow: inset 0 0 0 rgba(255,255,255,0); }
`;

const baiEntry1TextTileRestoreUp = keyframes`
  0% { opacity: 0; transform: translateY(16px) scaleY(0.18); }
  48% { opacity: 1; transform: translateY(-5px) scaleY(1.04); }
  72% { opacity: 1; transform: translateY(2px) scaleY(1); }
  100% { opacity: 1; transform: translateY(0) scaleY(1); }
`;

const baiEntry1TextCharacterRestoreIn = keyframes`
  0%, 24% { opacity: 0; transform: translateY(2px); }
  100% { opacity: 0.82; transform: translateY(0); }
`;

const metroFragmentTextBeat = keyframes`
  0% { transform: translateY(0) scale(1); box-shadow: 0 1px 0 rgba(126, 97, 72, 0.08); }
  48% { transform: translateY(-2px) scale(1.055); box-shadow: 0 6px 12px rgba(126, 97, 72, 0.13); }
  100% { transform: translateY(0) scale(1); box-shadow: 0 1px 0 rgba(126, 97, 72, 0.08); }
`;

const diaryCatalogCardPop = keyframes`
  0% { transform: translateY(22px) scale(0.86); opacity: 0; }
  58% { transform: translateY(-5px) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const photoCardFloat = keyframes`
  0% { transform: rotate(-1.8deg) translateY(0); }
  50% { transform: rotate(-0.6deg) translateY(-5px); }
  100% { transform: rotate(-1.8deg) translateY(0); }
`;

const meterFill = keyframes`
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
`;

const pointPulse = keyframes`
  0% { transform: scale(0.9); opacity: 0; }
  45% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const gachaFlip = keyframes`
  0% { transform: rotateY(0deg) scale(0.92); }
  45% { transform: rotateY(180deg) scale(1.06); }
  100% { transform: rotateY(360deg) scale(1); }
`;

const rewardGlow = keyframes`
  0% { box-shadow: 0 0 0 rgba(245, 201, 91, 0); }
  50% { box-shadow: 0 0 0 10px rgba(245, 201, 91, 0.18); }
  100% { box-shadow: 0 0 0 rgba(245, 201, 91, 0); }
`;

const overlayLiftFadeOut = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-88px); opacity: 0; }
`;

const diaryClueHintFade = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const diaryClueRewardIn = keyframes`
  0% { opacity: 0; transform: translateY(16px) scale(0.96); }
  58% { opacity: 1; transform: translateY(-3px) scale(1.02); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const DIARY_COMIC_PAGES = [
  "/images/diary/diary_demo_01.png",
  "/images/diary/diary_demo_02.png",
  "/images/diary/diary_demo_03.png",
] as const;

const DIARY_PAGE_STRIPE_BACKGROUND =
  "repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)";
const DIARY_DIALOG_SCROLL_BOTTOM_PADDING = 720;
const FRAGMENTED_DIARY_CLUE_HINT_DURATION_MS = 420;
const METRO_FRAGMENT_PUZZLE_SOLVED_ORDER = [0, 1, 2, 3] as const;
const METRO_FRAGMENT_PUZZLE_INITIAL_ORDER = [3, 0, 1, 2] as const;
const METRO_FRAGMENT_PUZZLE_TEXT_LINES = [
  "今天和朋友約練團，有點睡過頭，",
  "眼看捷運快要開走，趕緊跑下樓梯，",
  "好不容易趕上去，一上車",
  "發現大家都在看我!是我腳步太大聲嚇到大家嗎？",
] as const;
const METRO_FRAGMENT_DIARY_CLUE_TEXT = METRO_FRAGMENT_PUZZLE_TEXT_LINES.join("");
const METRO_FRAGMENT_TEXT_TOKEN_COUNT = Array.from(METRO_FRAGMENT_DIARY_CLUE_TEXT).length;
const METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT = 11;
const METRO_FRAGMENT_TEXT_GRID_ROW_COUNT = 8;
const METRO_FRAGMENT_TEXT_MAX_DISPLAY_INDEX =
  METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT * METRO_FRAGMENT_TEXT_GRID_ROW_COUNT - 1;
const METRO_FRAGMENT_TEXT_TILE_SIZE = 24;
const METRO_FRAGMENT_TEXT_COLUMN_GAP = 6;
const METRO_FRAGMENT_TEXT_ROW_GAP = 7;
const METRO_FRAGMENT_TEXT_GRID_WIDTH =
  METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT * METRO_FRAGMENT_TEXT_TILE_SIZE +
  (METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT - 1) * METRO_FRAGMENT_TEXT_COLUMN_GAP;
const METRO_FRAGMENT_TEXT_GRID_HEIGHT =
  METRO_FRAGMENT_TEXT_GRID_ROW_COUNT * METRO_FRAGMENT_TEXT_TILE_SIZE +
  (METRO_FRAGMENT_TEXT_GRID_ROW_COUNT - 1) * METRO_FRAGMENT_TEXT_ROW_GAP;
const METRO_FRAGMENT_TEXT_PANEL_HEIGHT = METRO_FRAGMENT_TEXT_GRID_HEIGHT + 24;
const METRO_FRAGMENT_TEXT_PIECE_SEQUENCE = [
  0, 1, 3,
  1, 3, 0,
  3, 0, 1,
  0, 3, 1,
] as const;
const METRO_FRAGMENT_TEXT_SCATTER_SLOT_COLUMNS = [
  [0, 2, 3, 5, 6, 8, 9, 10],
  [0, 1, 3, 4, 6, 7, 9, 10],
  [0, 2, 3, 5, 6, 8, 9, 10],
  [0, 1, 3, 4, 6, 7, 9, 10],
  [0, 2, 3, 5, 7, 8, 9, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [1, 2, 4, 5, 7, 8, 10],
  [0, 1, 3, 6, 8, 10],
] as const;
const METRO_FRAGMENT_SETTLE_EASING = "cubic-bezier(0.18, 0.76, 0.24, 1)";
const METRO_FRAGMENT_LAND_EASING = "cubic-bezier(0.2, 0.74, 0.26, 1)";
const METRO_FRAGMENT_SWAP_SLIDE_EASING = "cubic-bezier(0.16, 0.78, 0.22, 1)";
const METRO_FRAGMENT_TILE_SETTLE_MS = 300;
const METRO_FRAGMENT_TEXT_SETTLE_MS = 320;
const METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS = 560;
const METRO_FRAGMENT_SWAPPED_TEXT_SETTLE_MS = 520;
const METRO_FRAGMENT_SWAP_COVER_HOLD_MS = 120;
const METRO_FRAGMENT_LIFT_MS = 120;
const METRO_FRAGMENT_LAND_DELAY_MS = 42;
const METRO_FRAGMENT_LAND_MS = 220;
const METRO_FRAGMENT_COMPLETION_SETTLE_DELAY_MS = 560;
const METRO_FRAGMENT_COMPLETION_TALK_DELAY_MS = 1680;
const METRO_FRAGMENT_RHYTHM_STEP_MS = 620;
const METRO_FRAGMENT_RESOLVE_HOLD_MS = 920;

type MetroFragmentRhythmGroupId = "band" | "overslept" | "metro" | "stairs" | "footsteps";

const METRO_FRAGMENT_RHYTHM_GROUPS: readonly MetroFragmentRhythmGroupId[] = [
  "band",
  "overslept",
  "metro",
  "stairs",
  "footsteps",
] as const;

type MetroFragmentPuzzleTextToken = {
  text: string;
  pieceId: number;
  scatterIndex: number;
  displayIndex?: number;
  keyword?: boolean;
  rhythmGroupId?: MetroFragmentRhythmGroupId;
};

type MetroFragmentPuzzlePiece = {
  backgroundPosition: string;
};

type DiaryPuzzleTextGridLayout = {
  columnCount: number;
  rowCount: number;
  tileSize: number;
  columnGap: number;
  rowGap: number;
  width: number;
  height: number;
  panelHeight: number;
};

const METRO_FRAGMENT_TEXT_GRID_LAYOUT: DiaryPuzzleTextGridLayout = {
  columnCount: METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT,
  rowCount: METRO_FRAGMENT_TEXT_GRID_ROW_COUNT,
  tileSize: METRO_FRAGMENT_TEXT_TILE_SIZE,
  columnGap: METRO_FRAGMENT_TEXT_COLUMN_GAP,
  rowGap: METRO_FRAGMENT_TEXT_ROW_GAP,
  width: METRO_FRAGMENT_TEXT_GRID_WIDTH,
  height: METRO_FRAGMENT_TEXT_GRID_HEIGHT,
  panelHeight: METRO_FRAGMENT_TEXT_PANEL_HEIGHT,
};

function getMetroFragmentTextPieceId(globalIndex: number) {
  return METRO_FRAGMENT_TEXT_PIECE_SEQUENCE[
    globalIndex % METRO_FRAGMENT_TEXT_PIECE_SEQUENCE.length
  ];
}

function buildMetroFragmentTextScatterSlots() {
  return METRO_FRAGMENT_TEXT_SCATTER_SLOT_COLUMNS.flatMap((columns, rowIndex) =>
    columns.map((columnIndex) => rowIndex * METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT + columnIndex),
  ).slice(0, METRO_FRAGMENT_TEXT_TOKEN_COUNT);
}

function getMetroFragmentRhythmGroupId(globalIndex: number): MetroFragmentRhythmGroupId | undefined {
  if (globalIndex >= 6 && globalIndex <= 7) return "band";
  if (globalIndex >= 11 && globalIndex <= 13) return "overslept";
  if (globalIndex >= 17 && globalIndex <= 18) return "metro";
  if (globalIndex >= 28 && globalIndex <= 29) return "stairs";
  if (globalIndex >= 53 && globalIndex <= 54) return "footsteps";
  return undefined;
}

function clampMetroFragmentTextDisplayIndex(displayIndex: number) {
  return Math.max(0, Math.min(METRO_FRAGMENT_TEXT_MAX_DISPLAY_INDEX, displayIndex));
}

function getMetroFragmentTextSlotPoint(displayIndex: number) {
  return getDiaryPuzzleTextSlotPoint(displayIndex, METRO_FRAGMENT_TEXT_GRID_LAYOUT);
}

function getDiaryPuzzleTextSlotPoint(
  displayIndex: number,
  layout: DiaryPuzzleTextGridLayout,
) {
  const maxDisplayIndex = layout.columnCount * layout.rowCount - 1;
  const clampedIndex = Math.max(0, Math.min(maxDisplayIndex, displayIndex));
  const columnIndex = clampedIndex % layout.columnCount;
  const rowIndex = Math.floor(clampedIndex / layout.columnCount);

  return {
    left: columnIndex * (layout.tileSize + layout.columnGap),
    top: rowIndex * (layout.tileSize + layout.rowGap),
  };
}

function lerpMetroFragmentTextPoint(
  from: ReturnType<typeof getMetroFragmentTextSlotPoint>,
  to: ReturnType<typeof getMetroFragmentTextSlotPoint>,
  progress: number,
) {
  return lerpDiaryPuzzleTextPoint(from, to, progress);
}

function lerpDiaryPuzzleTextPoint(
  from: ReturnType<typeof getDiaryPuzzleTextSlotPoint>,
  to: ReturnType<typeof getDiaryPuzzleTextSlotPoint>,
  progress: number,
) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return {
    left: from.left + (to.left - from.left) * clampedProgress,
    top: from.top + (to.top - from.top) * clampedProgress,
  };
}

function buildMetroFragmentTextTokens(): MetroFragmentPuzzleTextToken[] {
  let globalIndex = 0;
  const scatterSlots = buildMetroFragmentTextScatterSlots();

  return METRO_FRAGMENT_PUZZLE_TEXT_LINES.flatMap((line) =>
    Array.from(line).map((text) => {
      const pieceId = getMetroFragmentTextPieceId(globalIndex);
      const scatterIndex = scatterSlots[globalIndex] ?? globalIndex;
      const token = {
        text,
        pieceId,
        scatterIndex,
        keyword: text === "捷" || text === "運",
        rhythmGroupId: getMetroFragmentRhythmGroupId(globalIndex),
      };

      globalIndex += 1;
      return token;
    }),
  );
}

const METRO_FRAGMENT_PUZZLE_PIECES = [
  {
    backgroundPosition: "0% 50%",
  },
  {
    backgroundPosition: "33% 50%",
  },
  {
    backgroundPosition: "66% 50%",
  },
  {
    backgroundPosition: "100% 50%",
  },
] satisfies readonly MetroFragmentPuzzlePiece[];
const METRO_FRAGMENT_TEXT_TOKENS = buildMetroFragmentTextTokens();

const ENABLE_SUNBEAST_GUIDANCE_SYSTEM = false;
const ENABLE_SUNBEAST_HINT_SYSTEM = true;

const BAI_ENTRY_1_RESTORED_PAGE_1_TEXT =
  METRO_FRAGMENT_DIARY_CLUE_TEXT;
const BAI_ENTRY_1_RESTORED_PAGE_2_TEXT =
  "緩過神來，原來是因為我吉他的袋子夾在門上，好險沒有夾得很嚴重，在一下站的時候解救了\n忍不住在車上大笑起來";
const BAI_ENTRY_1_IMAGE_PATH = "/images/diary/diray_photo_01.jpg";
const BAI_ENTRY_1_IMAGE_ASPECT_RATIO = "640 / 461";
const BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID = 2;
const BAI_ENTRY_1_REVEAL_TEXT_GRID_COLUMN_COUNT = METRO_FRAGMENT_TEXT_GRID_COLUMN_COUNT;
const BAI_ENTRY_1_RESTORED_PAGE_2_CHARACTER_COUNT =
  Array.from(BAI_ENTRY_1_RESTORED_PAGE_2_TEXT).filter((character) => character !== "\n").length;
const BAI_ENTRY_1_REVEAL_TEXT_PLACEHOLDER_COUNT = BAI_ENTRY_1_RESTORED_PAGE_2_CHARACTER_COUNT;
const BAI_ENTRY_1_VISUAL_PAGES = [
  {
    imagePath: BAI_ENTRY_1_IMAGE_PATH,
    imageAspectRatio: BAI_ENTRY_1_IMAGE_ASPECT_RATIO,
    text: BAI_ENTRY_1_RESTORED_PAGE_1_TEXT,
  },
] as const;
const BAI_ENTRY_2_IMAGE_PATH = "/images/diary/diary_02_01.jpg";
const BAI_ENTRY_2_IMAGE_ASPECT_RATIO = "640 / 460";
const DIARY_IMAGE_PUZZLE_SOLVED_ORDER = [0, 1, 2, 3] as const;
const BAI_ENTRY_2_PUZZLE_INITIAL_ORDER = [2, 0, 3, 1] as const;
const BAI_ENTRY_2_PUZZLE_TEXT_LINES = [
  "今天和小麥請搬家公司搬家。",
  "整理到一半，客廳出現幾瓶便利商店飲料，",
  "我以為是小麥買的，就很自然地全部喝掉了。",
] as const;
const BAI_ENTRY_2_PUZZLE_KEYWORD = "便利商店";
const BAI_ENTRY_2_TEXT_GRID_LAYOUT = METRO_FRAGMENT_TEXT_GRID_LAYOUT;
const BAI_ENTRY_2_TEXT_PIECE_SEQUENCE = [
  0, 1, 2, 3,
  1, 3, 0, 2,
  2, 0, 3, 1,
  3, 2, 1, 0,
] as const;
const BAI_ENTRY_1_DAMAGED_VISUAL_TEXT =
  METRO_FRAGMENT_DIARY_CLUE_TEXT;
const BAI_ENTRY_1_RESTORE_INITIAL_TEXT =
  METRO_FRAGMENT_DIARY_CLUE_TEXT;
const MARKETING_DIARY_THREAD_IMAGE_PATH = "/images/diary/diary_thread.jpg";
const MARKETING_DIARY_THREAD_IMAGE_ASPECT_RATIO = "640 / 461";
const MARKETING_DIARY_THREAD_PUZZLE_WIDTH = 292;
const MARKETING_DIARY_THREAD_PUZZLE_HEIGHT = Math.round(
  MARKETING_DIARY_THREAD_PUZZLE_WIDTH * 461 / 640,
);
const MARKETING_DIARY_THREAD_PIECES = [
  { id: 0, backgroundPosition: "0% 50%" },
  { id: 1, backgroundPosition: "33.333% 50%" },
  { id: 2, backgroundPosition: "66.667% 50%" },
  { id: 3, backgroundPosition: "100% 50%" },
] as const;
const MARKETING_DIARY_THREAD_SCRAMBLED_ORDER = [2, 0, 3, 1] as const;
const MARKETING_DIARY_THREAD_SOLVED_ORDER = [0, 1, 2, 3] as const;
const MARKETING_DIARY_THREAD_LINES = [
  "天氣雨",
  "發現走在路上的小日獸了！",
  "毛那麼長確實會很討厭洗澡",
  "我也不喜歡洗澡汪嗚 大家要",
  "(´・ω・`)",
  "#小日獸出沒筆記",
] as const;
const MARKETING_DIARY_THREAD_SETTLE_MS = 620;
const MARKETING_DIARY_THREAD_RESOLVE_MS = 820;
const MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT = 11;
const MARKETING_DIARY_THREAD_TEXT_GRID_ROW_COUNT = 9;
const MARKETING_DIARY_THREAD_TEXT_TILE_SIZE = 21;
const MARKETING_DIARY_THREAD_TEXT_COLUMN_GAP = 4;
const MARKETING_DIARY_THREAD_TEXT_ROW_GAP = 6;
const MARKETING_DIARY_THREAD_TEXT_GRID_WIDTH =
  MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT * MARKETING_DIARY_THREAD_TEXT_TILE_SIZE +
  (MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT - 1) * MARKETING_DIARY_THREAD_TEXT_COLUMN_GAP;
const MARKETING_DIARY_THREAD_TEXT_GRID_HEIGHT =
  MARKETING_DIARY_THREAD_TEXT_GRID_ROW_COUNT * MARKETING_DIARY_THREAD_TEXT_TILE_SIZE +
  (MARKETING_DIARY_THREAD_TEXT_GRID_ROW_COUNT - 1) * MARKETING_DIARY_THREAD_TEXT_ROW_GAP;
const MARKETING_DIARY_THREAD_TEXT_PANEL_HEIGHT =
  MARKETING_DIARY_THREAD_TEXT_GRID_HEIGHT + 24;
const MARKETING_DIARY_THREAD_TEXT_TOTAL_SLOT_COUNT =
  MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT *
  MARKETING_DIARY_THREAD_TEXT_GRID_ROW_COUNT;
const MARKETING_DIARY_THREAD_TEXT_SCATTER_STEP = 17;
const MARKETING_DIARY_THREAD_TEXT_SCATTER_OFFSET = 29;

type MarketingDiaryThreadDragState = {
  slotIndex: number;
  pieceId: number;
  pointerId: number;
  startClientX: number;
  deltaX: number;
};

type MarketingDiaryThreadCompletionStage = "idle" | "settle" | "resolved";

type MarketingDiaryThreadSwapMotion = {
  draggedPieceId: number;
  swappedPieceId: number;
  originSlotIndex: number;
  targetSlotIndex: number;
  phase: "cover" | "slide";
};

type MarketingDiaryThreadTextToken = {
  text: string;
  tokenIndex: number;
  pieceId: number;
  pieceTokenIndex: number;
  scatterIndex: number;
  row: number;
  col: number;
};

function isMarketingDiaryThreadSolved(order: readonly number[]) {
  return (
    order.length === MARKETING_DIARY_THREAD_SOLVED_ORDER.length &&
    order.every((pieceId, index) => pieceId === MARKETING_DIARY_THREAD_SOLVED_ORDER[index])
  );
}

function getMarketingDiaryThreadGridPoint(index: number) {
  const safeIndex = Math.max(
    0,
    Math.min(
      MARKETING_DIARY_THREAD_TEXT_TOTAL_SLOT_COUNT - 1,
      index,
    ),
  );
  return {
    left:
      (safeIndex % MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT) *
      (MARKETING_DIARY_THREAD_TEXT_TILE_SIZE + MARKETING_DIARY_THREAD_TEXT_COLUMN_GAP),
    top:
      Math.floor(safeIndex / MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT) *
      (MARKETING_DIARY_THREAD_TEXT_TILE_SIZE + MARKETING_DIARY_THREAD_TEXT_ROW_GAP),
  };
}

function lerpMarketingDiaryThreadGridPoint(
  from: ReturnType<typeof getMarketingDiaryThreadGridPoint>,
  to: ReturnType<typeof getMarketingDiaryThreadGridPoint>,
  progress: number,
) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return {
    left: from.left + (to.left - from.left) * safeProgress,
    top: from.top + (to.top - from.top) * safeProgress,
  };
}

function getMarketingDiaryThreadScatterIndex(tokenIndex: number) {
  return (
    tokenIndex * MARKETING_DIARY_THREAD_TEXT_SCATTER_STEP +
    MARKETING_DIARY_THREAD_TEXT_SCATTER_OFFSET
  ) % MARKETING_DIARY_THREAD_TEXT_TOTAL_SLOT_COUNT;
}

function buildMarketingDiaryThreadTextTokens(): MarketingDiaryThreadTextToken[] {
  const pieceTokenCounts = [0, 0, 0, 0];
  let tokenIndex = 0;
  let row = 0;

  return MARKETING_DIARY_THREAD_LINES.flatMap((line) => {
    const tokens: MarketingDiaryThreadTextToken[] = [];
    let col = 0;

    Array.from(line).forEach((character) => {
      if (character === " ") {
        col += 1;
        if (col >= MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT) {
          col = 0;
          row += 1;
        }
        return;
      }

      if (col >= MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT) {
        col = 0;
        row += 1;
      }

      const pieceId = tokenIndex % MARKETING_DIARY_THREAD_SOLVED_ORDER.length;
      const pieceTokenIndex = pieceTokenCounts[pieceId];
      pieceTokenCounts[pieceId] += 1;
      tokens.push({
        text: character,
        tokenIndex,
        pieceId,
        pieceTokenIndex,
        scatterIndex: getMarketingDiaryThreadScatterIndex(tokenIndex),
        row,
        col,
      });
      tokenIndex += 1;
      col += 1;
    });

    row += 1;
    return tokens;
  });
}

const MARKETING_DIARY_THREAD_TEXT_TOKENS = buildMarketingDiaryThreadTextTokens();

function isPuzzleOrderSolved(order: readonly number[], solvedOrder: readonly number[]) {
  return (
    order.length === solvedOrder.length &&
    order.every((pieceId, index) => pieceId === solvedOrder[index])
  );
}

function isMetroFragmentPuzzleSolved(order: readonly number[]) {
  return isPuzzleOrderSolved(order, METRO_FRAGMENT_PUZZLE_SOLVED_ORDER);
}

const NEXT_DIARY_FIRST_FRAGMENT = FROG_MOVING_DIARY_FRAGMENT;
const BAI_ENTRY_2_FIRST_DAMAGED_TEXT =
  "今天和小麥請[[搬家公司]]搬家。\n整理到一半，客廳出現幾瓶便利商店飲料，我以為是小麥買的，就很自然地[[全部喝掉了]]。";
const BAI_ENTRY_2_SECOND_DAMAGED_TEXT =
  "正當她要開口，突然聽到外面街道上有[[OO]]哭鬧的聲音...\n原來是有[[OO]]在街道上[[OOO]]砸到路人，路人的[[OOO]]灑了一地";
const BAI_ENTRY_2_THIRD_DAMAGED_TEXT =
  "[[OOOOO]]，路人表示感謝，[[OOO]]餐廳[[OOO]]，回到家後[[OOOO]]";

function getBaiEntry2TextPieceId(globalIndex: number) {
  return BAI_ENTRY_2_TEXT_PIECE_SEQUENCE[
    globalIndex % BAI_ENTRY_2_TEXT_PIECE_SEQUENCE.length
  ];
}

function buildBaiEntry2PuzzleTextTokens(): MetroFragmentPuzzleTextToken[] {
  const flatText = BAI_ENTRY_2_PUZZLE_TEXT_LINES.join("");
  const keywordStartIndex = flatText.indexOf(BAI_ENTRY_2_PUZZLE_KEYWORD);
  const keywordEndIndex = keywordStartIndex + Array.from(BAI_ENTRY_2_PUZZLE_KEYWORD).length;
  const scatterSlots = METRO_FRAGMENT_TEXT_SCATTER_SLOT_COLUMNS.flatMap((columns, rowIndex) =>
    columns.map((columnIndex) => rowIndex * BAI_ENTRY_2_TEXT_GRID_LAYOUT.columnCount + columnIndex),
  );
  let globalIndex = 0;
  let rowIndex = 0;

  return BAI_ENTRY_2_PUZZLE_TEXT_LINES.flatMap((line) => {
    const tokens: MetroFragmentPuzzleTextToken[] = [];
    let columnIndex = 0;

    Array.from(line).forEach((text) => {
      if (columnIndex >= BAI_ENTRY_2_TEXT_GRID_LAYOUT.columnCount) {
        columnIndex = 0;
        rowIndex += 1;
      }

      tokens.push({
        text,
        pieceId: getBaiEntry2TextPieceId(globalIndex),
        scatterIndex: scatterSlots[globalIndex] ?? globalIndex,
        displayIndex: rowIndex * BAI_ENTRY_2_TEXT_GRID_LAYOUT.columnCount + columnIndex,
        keyword: keywordStartIndex >= 0 && globalIndex >= keywordStartIndex && globalIndex < keywordEndIndex,
      });
      globalIndex += 1;
      columnIndex += 1;
    });

    rowIndex += 1;
    return tokens;
  });
}

const BAI_ENTRY_2_PUZZLE_TEXT_TOKENS = buildBaiEntry2PuzzleTextTokens();
const BAI_ENTRY_2_FRAGMENT_COMPLETE_TEXTS = [
  FROG_MOVING_DIARY_FRAGMENT.firstText,
  "正當她要開口，突然聽到外面街道上有小孩哭鬧的聲音...原來是有小孩在街道上玩球砸到路人，路人的橘子灑了一地，阻擾了搬家工人。",
  "我們前去把橘子撿起來，路人表示感謝，贈送一張餐廳優惠券，回到家後。搬家工人問起飲料，我才發現原來飲料是工人的，我還大聲的說好喝太尷尬了QAQ。\n為了賠罪，也謝謝今天的搬家工人幫忙，請他吃晚餐。",
] as const;
const BAI_ENTRY_2_COMPLETE_TEXTS = [
  ...BAI_ENTRY_2_FRAGMENT_COMPLETE_TEXTS,
] as const;
const BAI_ENTRY_5_COMPLETE_TEXTS = [
  "小麥總是很擅長安排晚餐，只要那天有直得慶祝得事情，就會想要問小麥 .....",
] as const;

type VisualDiaryPageItem = {
  imagePath: string;
  imageAspectRatio?: string;
  text: string;
  initialText?: string;
  variant?: "living-room" | "question";
  imageEffect?: "fade";
  textEffect?: "fade" | "typewriter" | "fragmented-typewriter" | "restore-completion" | "damaged-fragment";
  selectableMetroClue?: {
    selected: boolean;
    reconstructed: boolean;
    completionStage?: MetroFragmentCompletionStage;
    activeRhythmGroupId?: MetroFragmentRhythmGroupId | null;
    puzzleImagePath: string;
    puzzleImageAspectRatio?: string;
    puzzleOrder: readonly number[];
    puzzleSolvedOrder?: readonly number[];
    puzzlePieces?: readonly MetroFragmentPuzzlePiece[];
    puzzleQuestionPieceId?: number | null;
    puzzleTextTokens?: readonly MetroFragmentPuzzleTextToken[];
    puzzleTextGridLayout?: DiaryPuzzleTextGridLayout;
    selectedPuzzleSlotIndex: number | null;
    onPuzzleSlotSelect: (slotIndex: number) => void;
    onPuzzleSlotSwap: (fromSlotIndex: number, toSlotIndex: number) => void;
    onSelect: () => void;
    onRhythmGroupSelect?: (groupId: MetroFragmentRhythmGroupId | null) => void;
  };
};

function isVisualDiaryImageAssetPath(imagePath: string) {
  return imagePath.startsWith("/images/");
}

type BaiEntry2FragmentRevealLevel = "initial" | "first-photo" | "second-photo";

function buildBaiEntry2FragmentPages(revealLevel: BaiEntry2FragmentRevealLevel): VisualDiaryPageItem[] {
  if (revealLevel === "initial") {
    return [
      {
        imagePath: BAI_ENTRY_2_IMAGE_PATH,
        imageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
        text: BAI_ENTRY_2_FIRST_DAMAGED_TEXT,
        imageEffect: "fade",
        textEffect: "damaged-fragment",
      },
    ];
  }

  const pages: VisualDiaryPageItem[] = [
    {
      imagePath: BAI_ENTRY_2_IMAGE_PATH,
      imageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
      text: NEXT_DIARY_FIRST_FRAGMENT.firstText,
      imageEffect: "fade",
      textEffect: "fade",
    },
    {
      imagePath: "bai-entry-2-fragment-2",
      text: revealLevel === "second-photo" ? BAI_ENTRY_2_FRAGMENT_COMPLETE_TEXTS[1] : BAI_ENTRY_2_SECOND_DAMAGED_TEXT,
      imageEffect: "fade",
      textEffect: revealLevel === "second-photo" ? "fade" : "damaged-fragment",
    },
  ];

  if (revealLevel === "second-photo") {
    pages.push(
      {
        imagePath: "bai-entry-2-fragment-3",
        text: BAI_ENTRY_2_THIRD_DAMAGED_TEXT,
        imageEffect: "fade",
        textEffect: "damaged-fragment",
      },
    );
  }

  return pages;
}

function getBaiEntry2FragmentRevealLevel(photoAttemptCount: number): BaiEntry2FragmentRevealLevel {
  if (photoAttemptCount <= 0) return "initial";
  if (photoAttemptCount === 1) return "first-photo";
  return "second-photo";
}

const BAI_ENTRY_2_COMPLETE_VISUAL_PAGES: readonly VisualDiaryPageItem[] = BAI_ENTRY_2_COMPLETE_TEXTS.map(
  (text, index) => ({
    imagePath: index === 0 ? BAI_ENTRY_2_IMAGE_PATH : `bai-entry-2-complete-${index + 1}`,
    imageAspectRatio: index === 0 ? BAI_ENTRY_2_IMAGE_ASPECT_RATIO : undefined,
    text,
    imageEffect: "fade",
    textEffect: "fade",
  }),
);

function isDiaryImagePuzzleSolved(order: readonly number[]) {
  return isPuzzleOrderSolved(order, DIARY_IMAGE_PUZZLE_SOLVED_ORDER);
}

function MovingDiaryIllustration({ variant = "living-room" }: { variant?: "living-room" | "question" }) {
  if (variant === "question") {
    return (
      <Flex
        h="100%"
        w="100%"
        bgColor="#EBE3DB"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#A57C58" fontSize="48px" fontWeight="700" lineHeight="1">
          ?
        </Text>
      </Flex>
    );
  }

  return <Flex h="100%" w="100%" bgColor="#EBE3DB" />;
}

type MetroFragmentPuzzleDragState = {
  pieceId: number;
  originSlotIndex: number;
  pointerId: number;
  startClientX: number;
  deltaX: number;
};

type MetroFragmentPuzzleSwapMotion = {
  draggedPieceId: number;
  swappedPieceId: number;
  originSlotIndex: number;
  targetSlotIndex: number;
  phase: "cover" | "slide";
};

function MetroCluePuzzleControl({
  imagePath,
  imageAspectRatio = BAI_ENTRY_1_IMAGE_ASPECT_RATIO,
  order,
  solvedOrder = METRO_FRAGMENT_PUZZLE_SOLVED_ORDER,
  pieces = METRO_FRAGMENT_PUZZLE_PIECES,
  questionPieceId = BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID,
  textTokens = METRO_FRAGMENT_TEXT_TOKENS,
  textGridLayout = METRO_FRAGMENT_TEXT_GRID_LAYOUT,
  selectedSlotIndex,
  isClueSelected,
  completionStage = "idle",
  activeRhythmGroupId = null,
  onSlotSelect,
  onSlotSwap,
  onClueSelect,
  onRhythmGroupSelect,
}: {
  imagePath: string;
  imageAspectRatio?: string;
  order: readonly number[];
  solvedOrder?: readonly number[];
  pieces?: readonly MetroFragmentPuzzlePiece[];
  questionPieceId?: number | null;
  textTokens?: readonly MetroFragmentPuzzleTextToken[];
  textGridLayout?: DiaryPuzzleTextGridLayout;
  selectedSlotIndex: number | null;
  isClueSelected: boolean;
  completionStage?: MetroFragmentCompletionStage;
  activeRhythmGroupId?: MetroFragmentRhythmGroupId | null;
  onSlotSelect: (slotIndex: number) => void;
  onSlotSwap: (fromSlotIndex: number, toSlotIndex: number) => void;
  onClueSelect: () => void;
  onRhythmGroupSelect?: (groupId: MetroFragmentRhythmGroupId | null) => void;
}) {
  const isSolved = isPuzzleOrderSolved(order, solvedOrder);
  const isCompletionActive = completionStage !== "idle";
  const shouldPlayCompletionPhotoBeat = completionStage === "settle";
  const isRhythmStage = completionStage === "rhythm";
  const imagePuzzleRef = useRef<HTMLDivElement | null>(null);
  const swapMotionSlideTimerRef = useRef<number | null>(null);
  const swapMotionClearTimerRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<MetroFragmentPuzzleDragState | null>(null);
  const [swapMotion, setSwapMotion] = useState<MetroFragmentPuzzleSwapMotion | null>(null);
  const [swappedPieceSettlingId, setSwappedPieceSettlingId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (swapMotionSlideTimerRef.current !== null) {
        window.clearTimeout(swapMotionSlideTimerRef.current);
      }
      if (swapMotionClearTimerRef.current !== null) {
        window.clearTimeout(swapMotionClearTimerRef.current);
      }
    };
  }, []);

  const getDropSlotIndex = (clientX: number) => {
    const rect = imagePuzzleRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const relativeX = clientX - rect.left;

    return Array.from({ length: solvedOrder.length }).reduce<number>(
      (bestSlotIndex, _pieceId, slotIndex) => {
        const slotCenterX = rect.width * ((slotIndex + 0.5) / solvedOrder.length);
        const bestCenterX = rect.width * ((bestSlotIndex + 0.5) / solvedOrder.length);
        const distance = Math.abs(relativeX - slotCenterX);
        const bestDistance = Math.abs(relativeX - bestCenterX);
        return distance < bestDistance ? slotIndex : bestSlotIndex;
      },
      0,
    );
  };

  const releasePointerCapture = (element: Element, pointerId: number) => {
    if (element instanceof HTMLElement && element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  };

  const clearSwapMotionTimers = () => {
    if (swapMotionSlideTimerRef.current !== null) {
      window.clearTimeout(swapMotionSlideTimerRef.current);
      swapMotionSlideTimerRef.current = null;
    }
    if (swapMotionClearTimerRef.current !== null) {
      window.clearTimeout(swapMotionClearTimerRef.current);
      swapMotionClearTimerRef.current = null;
    }
  };

  const markSwapMotion = ({
    draggedPieceId,
    swappedPieceId,
    originSlotIndex,
    targetSlotIndex,
  }: Omit<MetroFragmentPuzzleSwapMotion, "phase">) => {
    clearSwapMotionTimers();
    setSwappedPieceSettlingId(swappedPieceId);
    setSwapMotion({
      draggedPieceId,
      swappedPieceId,
      originSlotIndex,
      targetSlotIndex,
      phase: "cover",
    });
    swapMotionSlideTimerRef.current = window.setTimeout(() => {
      setSwapMotion((current) =>
        current?.draggedPieceId === draggedPieceId &&
        current.swappedPieceId === swappedPieceId &&
        current.originSlotIndex === originSlotIndex &&
        current.targetSlotIndex === targetSlotIndex
          ? { ...current, phase: "slide" }
          : current,
      );
      swapMotionSlideTimerRef.current = null;
    }, METRO_FRAGMENT_SWAP_COVER_HOLD_MS);
    swapMotionClearTimerRef.current = window.setTimeout(() => {
      setSwapMotion(null);
      setSwappedPieceSettlingId(null);
      swapMotionClearTimerRef.current = null;
    }, METRO_FRAGMENT_SWAP_COVER_HOLD_MS + METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS + 90);
  };

  return (
    <Flex
      mt="0"
      w="100%"
      justifyContent="center"
      data-no-story-advance="true"
      animation={`${diaryKeywordResolveIn} 260ms ease-out both`}
    >
      <Flex w="100%" maxW="430px" direction="column" gap="20px" alignItems="stretch">
        <Box
          w="100%"
          p="0"
          border="0"
          borderRadius="0"
          bgColor="transparent"
          boxShadow="none"
          animation={
            shouldPlayCompletionPhotoBeat
              ? `${metroPuzzleCompleteGlow} 920ms ease-out both`
              : isSolved
                ? `${metroPuzzleCompleteGlow} 920ms ease-out both`
                : undefined
          }
        >
          <Box
            ref={imagePuzzleRef}
            position="relative"
            w="100%"
            aspectRatio={imageAspectRatio}
            overflow="hidden"
            borderRadius="0"
            bgColor="transparent"
            transition="overflow 360ms ease"
            animation={
              shouldPlayCompletionPhotoBeat
                ? `${metroPuzzleRitualSettle} 760ms cubic-bezier(0.18, 0.78, 0.24, 1) both`
                : undefined
            }
          >
            {pieces.map((piece, pieceId) => {
              const slotIndex = Math.max(0, order.indexOf(pieceId));
              const isSelected = selectedSlotIndex === slotIndex;
              const activeDrag = dragState?.pieceId === pieceId ? dragState : null;
              const dragX = activeDrag?.deltaX ?? 0;
              const isQuestionPiece = questionPieceId !== null && pieceId === questionPieceId;
              const activeSwapMotion = swapMotion && !activeDrag
                ? swapMotion
                : null;
              const isDroppedPieceHoldingFront = activeSwapMotion?.draggedPieceId === pieceId;
              const isSwappedPieceSlidingOut = activeSwapMotion?.swappedPieceId === pieceId;
              const swappedPieceOffsetPercent = activeSwapMotion && isSwappedPieceSlidingOut
                ? (activeSwapMotion.targetSlotIndex - activeSwapMotion.originSlotIndex) * 100
                : 0;
              const isSwappedPieceSettling = swappedPieceSettlingId === pieceId && !activeDrag;
              const tileSettleMs = isSwappedPieceSettling
                ? METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS
                : METRO_FRAGMENT_TILE_SETTLE_MS;
              const tileSettleEasing = isSwappedPieceSettling
                ? METRO_FRAGMENT_SWAP_SLIDE_EASING
                : METRO_FRAGMENT_SETTLE_EASING;
              const tileTransform = activeDrag
                ? `translate3d(${dragX}px, 0, 0)`
                : isSwappedPieceSlidingOut && activeSwapMotion?.phase === "cover"
                  ? `translate3d(${swappedPieceOffsetPercent}%, 0, 0)`
                  : "translate3d(0, 0, 0)";
              const tileTransition = activeDrag
                ? "none"
                : isSwappedPieceSlidingOut
                  ? activeSwapMotion?.phase === "cover"
                    ? "none"
                    : `transform ${METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS}ms ${METRO_FRAGMENT_SWAP_SLIDE_EASING}`
                  : [
                      `left ${tileSettleMs}ms ${tileSettleEasing}`,
                      `transform ${tileSettleMs}ms ${tileSettleEasing}`,
                    ].join(", ");

              return (
                <Box
                  as="button"
                  key={`metro-fragment-puzzle-piece-${pieceId}`}
                  position="absolute"
                  top="0"
                  left={`${slotIndex * (100 / pieces.length)}%`}
                  w={`${100 / pieces.length}%`}
                  h="100%"
                  px="0"
                  border="0"
                  bgColor="transparent"
                  cursor={isSolved ? "default" : activeDrag ? "grabbing" : "grab"}
                  touchAction="none"
                  transition={tileTransition}
                  transform={tileTransform}
                  zIndex={
                    activeDrag
                      ? 10
                      : isDroppedPieceHoldingFront
                        ? 9
                        : isSwappedPieceSlidingOut
                          ? 3
                          : isSelected
                            ? 4
                            : 2
                  }
                  aria-label={`日記插圖碎片 ${pieceId + 1}`}
                  onPointerDown={(event) => {
                    if (isSolved) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragState({
                      pieceId,
                      originSlotIndex: slotIndex,
                      pointerId: event.pointerId,
                      startClientX: event.clientX,
                      deltaX: 0,
                    });
                    clearSwapMotionTimers();
                    setSwapMotion(null);
                    setSwappedPieceSettlingId(null);
                  }}
                  onPointerMove={(event) => {
                    if (!dragState || dragState.pieceId !== pieceId || dragState.pointerId !== event.pointerId) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDragState((current) => current && current.pointerId === event.pointerId
                      ? {
                          ...current,
                          deltaX: event.clientX - current.startClientX,
                        }
                      : current);
                  }}
                  onPointerUp={(event) => {
                    if (!dragState || dragState.pieceId !== pieceId || dragState.pointerId !== event.pointerId) return;
                    event.preventDefault();
                    event.stopPropagation();
                    releasePointerCapture(event.currentTarget, event.pointerId);

                    const movedDistance = Math.abs(dragState.deltaX);
                    if (movedDistance < 8) {
                      onSlotSelect(dragState.originSlotIndex);
                    } else {
                      const targetSlotIndex = getDropSlotIndex(event.clientX);
                      if (targetSlotIndex !== dragState.originSlotIndex) {
                        const swappedPieceId = order[targetSlotIndex];
                        if (typeof swappedPieceId === "number") {
                          markSwapMotion({
                            draggedPieceId: dragState.pieceId,
                            swappedPieceId,
                            originSlotIndex: dragState.originSlotIndex,
                            targetSlotIndex,
                          });
                        }
                        onSlotSwap(dragState.originSlotIndex, targetSlotIndex);
                      }
                    }
                    setDragState(null);
                  }}
                  onPointerCancel={(event) => {
                    if (dragState?.pointerId === event.pointerId) {
                      releasePointerCapture(event.currentTarget, event.pointerId);
                      setDragState(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (isSolved || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    event.stopPropagation();
                    onSlotSelect(slotIndex);
                  }}
                >
                  <Box
                    position="relative"
                    w="100%"
                    h="100%"
                    boxSizing="border-box"
                    border="0"
                    borderRadius="0"
                    overflow="hidden"
                    bgColor={isQuestionPiece ? "#CBDDDD" : "#FFFFFF"}
                    boxShadow="none"
                    transform="translateY(0) scale(1)"
                    transition={
                      activeDrag
                        ? [
                            `transform ${METRO_FRAGMENT_LIFT_MS}ms ease-out`,
                          ].join(", ")
                        : [
                            `transform ${METRO_FRAGMENT_LAND_MS}ms ${METRO_FRAGMENT_LAND_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms`,
                          ].join(", ")
                    }
                    style={isQuestionPiece
                      ? {
                          backgroundImage: "none",
                          backgroundSize: "100% 100%",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }
                      : {
                          backgroundImage: `url("${imagePath}")`,
                          backgroundSize: `${pieces.length * 100}% 100%`,
                          backgroundPosition: piece.backgroundPosition,
                          backgroundRepeat: "no-repeat",
                        }}
                  >
                    <Box
                      position="absolute"
                      inset="0"
                      bgColor="transparent"
                    />
                    <Box
                      position="absolute"
                      inset="0"
                      bgImage="linear-gradient(94deg, rgba(255,255,255,0.42) 0 3%, transparent 3% 100%)"
                      opacity={0}
                    />
                    {isQuestionPiece ? (
                      <Flex
                        position="absolute"
                        inset="0"
                        alignItems="center"
                        justifyContent="center"
                        pointerEvents="none"
                      >
                        <Text
                          color="#FFFFFF"
                          fontSize="48px"
                          fontWeight="900"
                          lineHeight="1"
                          textShadow="none"
                          animation={
                            shouldPlayCompletionPhotoBeat
                              ? `${metroPuzzleQuestionPulse} 720ms ease-out 180ms both`
                              : undefined
                          }
                        >
                          ?
                        </Text>
                      </Flex>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
            <Box
              position="absolute"
              inset="0"
              zIndex={12}
              pointerEvents="none"
              border="4px solid rgba(100,112,125,0.88)"
              borderRadius="2px"
              boxSizing="border-box"
              animation={
                shouldPlayCompletionPhotoBeat
                  ? `${metroPuzzleFramePulse} 780ms ease-out both`
                  : undefined
              }
            >
              {Array.from({ length: Math.max(0, pieces.length - 1) }, (_item, index) => index + 1).map((dividerIndex) => (
                <Box
                  key={`metro-fragment-fixed-divider-${dividerIndex}`}
                  position="absolute"
                  top="0"
                  bottom="0"
                  left={`${dividerIndex * (100 / pieces.length)}%`}
                  w="4px"
                  bgColor="rgba(100,112,125,0.88)"
                  transform="translateX(-50%)"
                  animation={
                    shouldPlayCompletionPhotoBeat
                      ? `${metroPuzzleDividerPulse} 780ms ease-out ${dividerIndex * 90}ms both`
                      : undefined
                  }
                />
              ))}
            </Box>
          </Box>
        </Box>

          <Box
            position="relative"
            w="100%"
            h={`${textGridLayout.panelHeight}px`}
          border="0"
          borderRadius="0"
          bgColor="transparent"
          overflow="hidden"
          boxShadow="none"
        >
          <Box
            position="absolute"
            left="0"
            right="0"
            top="10px"
            bottom="12px"
            bgImage="repeating-linear-gradient(180deg, transparent 0 30px, rgba(157,120,89,0.09) 30px 31px)"
            opacity={0.58}
          />
          <Box
            position="absolute"
            left="50%"
            top="12px"
            w={`${textGridLayout.width}px`}
            h={`${textGridLayout.height}px`}
            transform="translateX(-50%)"
            overflow="hidden"
          >
            {textTokens.map((token, tokenIndex) => {
              const isKeyword = token.keyword === true;
              const canSelectKeyword =
                isSolved && isKeyword && !isCompletionActive && !onRhythmGroupSelect;
              const isCircledKeyword = isClueSelected && isKeyword;
              const isActiveRhythmGroup =
                isRhythmStage &&
                Boolean(token.rhythmGroupId) &&
                token.rhythmGroupId === activeRhythmGroupId;
              const isRhythmCandidate =
                isRhythmStage && Boolean(token.rhythmGroupId);
              const canSelectRhythmGroup =
                isActiveRhythmGroup &&
                token.rhythmGroupId === "metro" &&
                Boolean(onRhythmGroupSelect);
              const pieceSlotIndex = Math.max(0, order.indexOf(token.pieceId));
              const isPieceRestored = pieceSlotIndex === token.pieceId;
              const isDragAffected = dragState?.pieceId === token.pieceId;
              const slotWidth = Math.max(1, (imagePuzzleRef.current?.clientWidth ?? 0) / solvedOrder.length);
              const activeSlotFloat = isDragAffected && dragState
                ? dragState.originSlotIndex + dragState.deltaX / slotWidth
                : pieceSlotIndex;
              const originDistanceToCorrect = isDragAffected && dragState
                ? Math.max(1, Math.abs(dragState.originSlotIndex - token.pieceId))
                : 1;
              const currentDistanceToCorrect = Math.abs(activeSlotFloat - token.pieceId);
              const restoreProgress = isPieceRestored
                ? 1
                : isDragAffected
                  ? 1 - Math.min(1, currentDistanceToCorrect / originDistanceToCorrect)
                  : 0;
              const isTokenRestored = restoreProgress >= 0.98;
              const scatterPoint = getDiaryPuzzleTextSlotPoint(token.scatterIndex, textGridLayout);
              const solvedPoint = getDiaryPuzzleTextSlotPoint(token.displayIndex ?? tokenIndex, textGridLayout);
              const displayPoint = lerpDiaryPuzzleTextPoint(
                scatterPoint,
                solvedPoint,
                restoreProgress,
              );
              const isSwapAffected = swappedPieceSettlingId === token.pieceId;
              const textSettleMs = isSwapAffected
                ? METRO_FRAGMENT_SWAPPED_TEXT_SETTLE_MS
                : METRO_FRAGMENT_TEXT_SETTLE_MS;
              const activeTextNudgeX = isDragAffected && restoreProgress < 0.98 && dragState
                ? Math.max(-3, Math.min(3, dragState.deltaX * 0.018))
                : 0;
              const activeTextNudgeY = isDragAffected && restoreProgress < 0.98 ? ((tokenIndex % 3) - 1) * 0.8 : 0;
              const tileTransform = [
                isDragAffected ? `translate3d(${activeTextNudgeX}px, ${activeTextNudgeY}px, 0)` : undefined,
                isCircledKeyword ? "scale(1.08) rotate(-3deg)" : undefined,
              ].filter(Boolean).join(" ") || undefined;
              const completionBeatDelayMs = isRhythmStage ? 0 : Math.min(620, tokenIndex * 8);

              return (
                <Box
                  key={`metro-fragment-puzzle-token-${tokenIndex}`}
                  as="span"
                  position="absolute"
                  left={`${displayPoint.left}px`}
                  top={`${displayPoint.top}px`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w={`${textGridLayout.tileSize}px`}
                  h={`${textGridLayout.tileSize}px`}
                  minW="0"
                  minH="0"
                  overflow="hidden"
                  borderRadius="2px"
                  border={
                    isCircledKeyword
                      ? "2px solid #AD8363"
                      : isActiveRhythmGroup
                        ? token.rhythmGroupId === "metro"
                          ? "2px solid #B87945"
                          : "2px solid rgba(173, 131, 99, 0.46)"
                        : canSelectKeyword
                        ? "1.5px solid rgba(173, 131, 99, 0.32)"
                        : "1px solid rgba(255,255,255,0.76)"
                  }
                  bgColor={
                    isCircledKeyword
                      ? "rgba(245, 231, 209, 0.9)"
                      : isActiveRhythmGroup
                        ? token.rhythmGroupId === "metro"
                          ? "rgba(250, 222, 158, 0.96)"
                          : "rgba(225, 212, 195, 0.95)"
                      : isTokenRestored
                        ? "rgba(247, 240, 228, 0.74)"
                        : isDragAffected
                          ? "rgba(204, 225, 224, 0.95)"
                          : "rgba(206, 226, 225, 0.78)"
                  }
                  opacity={
                    isActiveRhythmGroup
                      ? 1
                      : isRhythmCandidate
                        ? 0.46
                        : isTokenRestored
                          ? 0.88
                          : isDragAffected
                            ? 1
                            : 0.72
                  }
                  zIndex={isActiveRhythmGroup ? 8 : isCircledKeyword ? 6 : isDragAffected ? 4 : undefined}
                  boxShadow={
                    isCircledKeyword
                      ? "0 0 0 4px rgba(245, 231, 209, 0.34), 0 6px 12px rgba(126, 79, 47, 0.16)"
                      : isActiveRhythmGroup
                        ? "0 0 0 3px rgba(255,255,255,0.34), 0 7px 14px rgba(126, 97, 72, 0.16)"
                      : "0 1px 0 rgba(126, 97, 72, 0.08)"
                  }
                  cursor={canSelectRhythmGroup || canSelectKeyword ? "pointer" : undefined}
                  pointerEvents={canSelectRhythmGroup || canSelectKeyword ? "auto" : "none"}
                  transition={`left ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms, top ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms, opacity 180ms ease, border 160ms ease, background 160ms ease, box-shadow 220ms ease, transform 160ms ease`}
                  transform={tileTransform}
                  animation={
                    isCircledKeyword
                      ? `${diaryKeywordCircleIn} 260ms ease-out both`
                      : isActiveRhythmGroup && isTokenRestored
                        ? `${metroFragmentTextBeat} 520ms ease-out ${completionBeatDelayMs}ms both`
                        : undefined
                  }
                  onClick={(event) => {
                    if (canSelectRhythmGroup) {
                      event.stopPropagation();
                      onRhythmGroupSelect?.(token.rhythmGroupId ?? null);
                      return;
                    }
                    if (!canSelectKeyword) return;
                    event.stopPropagation();
                    onClueSelect();
                  }}
                >
                  <Text
                    as="span"
                    color={
                      isCircledKeyword
                        ? "#7E4F2F"
                        : isActiveRhythmGroup
                          ? token.rhythmGroupId === "metro"
                            ? "#77451E"
                            : "#6B5748"
                          : isTokenRestored
                            ? "#302A25"
                            : "#8B9AA0"
                    }
                    fontSize={isCircledKeyword ? "14px" : "13px"}
                    fontWeight={isCircledKeyword ? "900" : "800"}
                    lineHeight="1"
                    letterSpacing="0"
                    textAlign="center"
                    whiteSpace="nowrap"
                    textShadow={isTokenRestored || isCircledKeyword ? "0 1px 0 rgba(255,255,255,0.72)" : undefined}
                    transition={`transform ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms, color 160ms ease, font-size 180ms ease`}
                  >
                    {token.text}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}

function VisualDiaryPageText({
  text,
  effect,
  initialText,
  selectableMetroClue,
}: {
  text: string;
  effect?: VisualDiaryPageItem["textEffect"];
  initialText?: string;
  selectableMetroClue?: VisualDiaryPageItem["selectableMetroClue"];
}) {
  const characters = useMemo(() => Array.from(text), [text]);
  const restoreInitialCharacters = useMemo(() => Array.from(initialText ?? text), [initialText, text]);
  const usesRestoreCompletion = effect === "restore-completion";
  const usesTypewriter = effect === "typewriter" || effect === "fragmented-typewriter" || usesRestoreCompletion;
  const fragmentedCharacterIndexes = useMemo(() => new Set([4, 11, 14, 21]), []);
  const restorePrefixLength = useMemo(() => {
    if (!usesRestoreCompletion) return 0;
    let index = 0;
    while (
      index < characters.length &&
      index < restoreInitialCharacters.length &&
      characters[index] === restoreInitialCharacters[index]
    ) {
      index += 1;
    }
    return index;
  }, [characters, restoreInitialCharacters, usesRestoreCompletion]);
  const restoreTargetSuffixCharacters = useMemo(
    () => characters.slice(restorePrefixLength),
    [characters, restorePrefixLength],
  );
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(
    usesTypewriter ? 0 : characters.length,
  );
  const isTyping = usesRestoreCompletion
    ? visibleCharacterCount < restoreTargetSuffixCharacters.length
    : usesTypewriter && visibleCharacterCount < characters.length;

  useEffect(() => {
    if (usesRestoreCompletion) {
      setVisibleCharacterCount(0);
      let intervalId: number | null = null;
      const startTimer = setTimeout(() => {
        intervalId = window.setInterval(() => {
          setVisibleCharacterCount((current) => {
            if (current >= restoreTargetSuffixCharacters.length) {
              if (intervalId !== null) window.clearInterval(intervalId);
              return current;
            }
            return current + 1;
          });
        }, 104);
      }, 220);

      return () => {
        clearTimeout(startTimer);
        if (intervalId !== null) window.clearInterval(intervalId);
      };
    }

    if (!usesTypewriter) {
      setVisibleCharacterCount(characters.length);
      return;
    }

    setVisibleCharacterCount(0);
    let intervalId: number | null = null;
    const startTimer = setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCharacterCount((current) => {
          if (current >= characters.length) {
            if (intervalId !== null) window.clearInterval(intervalId);
            return current;
          }
          return current + 1;
        });
      }, 34);
    }, 260);

    return () => {
      clearTimeout(startTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [characters.length, restoreTargetSuffixCharacters.length, text, usesRestoreCompletion, usesTypewriter]);

  const visibleCharacters = usesRestoreCompletion
    ? visibleCharacterCount === 0
      ? restoreInitialCharacters
      : [
          ...characters.slice(0, restorePrefixLength),
          ...restoreTargetSuffixCharacters.slice(0, visibleCharacterCount),
        ]
    : usesTypewriter
      ? characters.slice(0, visibleCharacterCount)
      : characters;
  const renderDamagedMask = (hiddenText: string, key: string) => {
    const preset = hiddenText.match(/^bar:(full|medium|short)$/)?.[1];
    const hiddenLength = Array.from(hiddenText).length;
    const width = preset === "full"
      ? "96%"
      : preset === "medium"
        ? "44%"
        : preset === "short"
          ? "30%"
          : `${Math.max(5.6, Math.min(13.4, hiddenLength * 0.92))}em`;

    return (
      <Box
        key={key}
        as="span"
        display="inline-flex"
        w={width}
        maxW="100%"
        h={preset ? "18px" : "1.06em"}
        borderRadius="999px"
        bgColor="#BDA28D"
        bgImage={[
          "repeating-linear-gradient(2deg, rgba(94,68,50,0.1) 0 1px, transparent 1px 11px)",
          "repeating-linear-gradient(91deg, transparent 0 18px, rgba(94,68,50,0.055) 18px 19px, transparent 19px 38px)",
          "radial-gradient(ellipse at 22% 48%, rgba(94,68,50,0.12) 0 10%, transparent 30%)",
          "radial-gradient(ellipse at 74% 58%, rgba(94,68,50,0.09) 0 9%, transparent 28%)",
        ].join(",")}
        bgAttachment="fixed"
        bgSize="112px 72px, 128px 72px, 214px 96px, 238px 104px"
        boxShadow="inset 0 0 0 1px rgba(126,97,72,0.08)"
        opacity={0.96}
        transform={preset ? undefined : "translateY(0.16em)"}
        animation={`${diaryMaskInkWaver} 3.4s steps(3, end) infinite`}
        flexShrink={0}
        aria-label={preset ? "遮住的內容" : hiddenText}
      />
    );
  };

  const renderPlainDamagedSegment = (segment: string, key: string) => {
    if (!selectableMetroClue || !segment.includes("捷運")) {
      return (
        <Text key={key} as="span" whiteSpace="pre-wrap">
          {segment}
        </Text>
      );
    }

    const parts = segment.split("捷運");
    const puzzleDisorder = selectableMetroClue.puzzleOrder.reduce(
      (total, pieceId, slotIndex) => total + Math.abs(pieceId - slotIndex),
      0,
    );
    const clueDrift = Math.max(4, Math.min(10, puzzleDisorder * 2.2));

    return (
      <Text key={key} as="span" whiteSpace="pre-wrap">
        {parts.map((part, index) => (
          <Fragment key={`${key}-metro-part-${index}`}>
            {part}
            {index < parts.length - 1 && !selectableMetroClue.reconstructed ? (
              <Box
                as="span"
                display="inline-flex"
                position="relative"
                verticalAlign="baseline"
                mx="2px"
                w="2.55em"
                h="1.18em"
                overflow="hidden"
                borderRadius="5px"
                color="#94857E"
                filter="blur(1.4px)"
                opacity={0.72}
                transform="translateY(0.12em)"
                aria-label="破損的捷運線索"
              >
                <Text
                  as="span"
                  position="absolute"
                  left="0.08em"
                  top="0"
                  fontSize="inherit"
                  fontWeight="800"
                  lineHeight="1.18"
                  letterSpacing="0"
                  transform={`translateX(${clueDrift}px)`}
                  transition="transform 120ms ease-out"
                  clipPath="polygon(0 0, 58% 0, 50% 100%, 0 100%)"
                >
                  捷運
                </Text>
                <Text
                  as="span"
                  position="absolute"
                  left="0.08em"
                  top="0"
                  fontSize="inherit"
                  fontWeight="800"
                  lineHeight="1.18"
                  letterSpacing="0"
                  transform={`translateX(${-clueDrift}px)`}
                  transition="transform 120ms ease-out"
                  clipPath="polygon(48% 0, 100% 0, 100% 100%, 38% 100%)"
                >
                  捷運
                </Text>
                <Box
                  position="absolute"
                  inset="0"
                  bgImage="repeating-linear-gradient(102deg, transparent 0 6px, rgba(247, 240, 228, 0.74) 6px 9px, transparent 9px 15px)"
                />
              </Box>
            ) : index < parts.length - 1 ? (
              <Text
                as="button"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                verticalAlign="baseline"
                mx="1px"
                px="5px"
                py="1px"
                borderRadius="999px"
                border={
                  selectableMetroClue.selected
                    ? "2px solid #AD8363"
                    : "2px solid transparent"
                }
                bgColor={
                  selectableMetroClue.selected
                    ? "rgba(245, 231, 209, 0.82)"
                    : "transparent"
                }
                color="#94857E"
                fontSize="inherit"
                fontWeight="800"
                lineHeight="1.2"
                letterSpacing="0"
                cursor="pointer"
                boxShadow={
                  selectableMetroClue.selected
                    ? "0 2px 0 rgba(126, 97, 72, 0.12)"
                    : undefined
                }
                transform={selectableMetroClue.selected ? "rotate(-2deg)" : undefined}
                animation={
                  selectableMetroClue.selected
                    ? `${diaryKeywordCircleIn} 260ms ease-out both`
                    : `${diaryKeywordResolveIn} 220ms ease-out both`
                }
                _hover={{ borderColor: "rgba(173, 131, 99, 0.42)" }}
                onClick={(event) => {
                  event.stopPropagation();
                  selectableMetroClue.onSelect();
                }}
              >
                捷運
              </Text>
            ) : null}
          </Fragment>
        ))}
      </Text>
    );
  };

  const renderDamagedFragment = (content: string) => {
    if (selectableMetroClue) {
      return (
        <Box w="100%" color="#94857E" textAlign="left">
          <MetroCluePuzzleControl
            imagePath={selectableMetroClue.puzzleImagePath}
            imageAspectRatio={selectableMetroClue.puzzleImageAspectRatio}
            order={selectableMetroClue.puzzleOrder}
            solvedOrder={selectableMetroClue.puzzleSolvedOrder}
            pieces={selectableMetroClue.puzzlePieces}
            questionPieceId={selectableMetroClue.puzzleQuestionPieceId}
            textTokens={selectableMetroClue.puzzleTextTokens}
            textGridLayout={selectableMetroClue.puzzleTextGridLayout}
            selectedSlotIndex={selectableMetroClue.selectedPuzzleSlotIndex}
            isClueSelected={selectableMetroClue.selected}
            completionStage={selectableMetroClue.completionStage}
            activeRhythmGroupId={selectableMetroClue.activeRhythmGroupId}
            onSlotSelect={selectableMetroClue.onPuzzleSlotSelect}
            onSlotSwap={selectableMetroClue.onPuzzleSlotSwap}
            onClueSelect={selectableMetroClue.onSelect}
            onRhythmGroupSelect={selectableMetroClue.onRhythmGroupSelect}
          />
        </Box>
      );
    }

    const lines = content.split("\n");

    return (
      <Box
        w="100%"
        color="#94857E"
        fontSize="16px"
        fontWeight="700"
        lineHeight="1.52"
        textAlign="left"
      >
        {lines.map((line, lineIndex) => {
          const segments = line.split(/(\[\[[^\]]+\]\])/g);
          return (
            <Flex
              key={`damaged-line-${lineIndex}`}
              as="span"
              display="flex"
              alignItems="center"
              flexWrap="wrap"
              columnGap="0.7em"
              rowGap="0.26em"
              minH="1.52em"
              mb={lineIndex === lines.length - 1 ? 0 : "8px"}
            >
              {segments.map((segment, segmentIndex) => {
                const hiddenText = segment.match(/^\[\[([^\]]+)\]\]$/)?.[1];
                if (hiddenText) return renderDamagedMask(hiddenText, `damaged-${lineIndex}-${segmentIndex}`);
                if (!segment) return null;
                return renderPlainDamagedSegment(segment, `plain-${lineIndex}-${segmentIndex}`);
              })}
            </Flex>
          );
        })}
      </Box>
    );
  };

  if (effect === "damaged-fragment") {
    return renderDamagedFragment(text);
  }

  return (
    <Text
      w="100%"
      color="#94857E"
      fontSize="16px"
      fontWeight="700"
      lineHeight="1.45"
      whiteSpace="pre-line"
      textAlign="left"
    >
      {effect === "fragmented-typewriter"
        ? visibleCharacters.map((character, index) => {
            if (character === "\n") return <Fragment key={`line-${index}`}>{"\n"}</Fragment>;
            if (fragmentedCharacterIndexes.has(index)) {
              return (
                <Text
                  key={`${character}-${index}`}
                  as="span"
                  display="inline-block"
                  w="0.86em"
                  h="0.78em"
                  mx="0.02em"
                  borderRadius="3px"
                  bgColor="rgba(230, 224, 220, 0.74)"
                  backgroundImage="linear-gradient(180deg, transparent 0 22%, rgba(255,255,255,0.92) 22% 38%, transparent 38% 52%, rgba(255,255,255,0.68) 52% 67%, transparent 67% 100%)"
                  boxShadow="0 0 5px rgba(255,255,255,0.78), inset 0 0 0 1px rgba(148,133,126,0.08)"
                  filter="blur(0.28px)"
                  transform="translateY(0.08em)"
                />
              );
            }
            return <Fragment key={`${character}-${index}`}>{character}</Fragment>;
          })
        : visibleCharacters.join("")}
      {isTyping ? (
        <Text
          as="span"
          color="#9D7859"
          fontWeight="800"
          animation={`${diaryTypeCursorBlink} 760ms step-end infinite`}
        >
          ▌
        </Text>
      ) : null}
    </Text>
  );
}

function MarketingDiaryThreadTextGrid({
  order,
  dragState,
  completionStage,
  swappedPieceSettlingId,
}: {
  order: readonly number[];
  dragState: MarketingDiaryThreadDragState | null;
  completionStage: MarketingDiaryThreadCompletionStage;
  swappedPieceSettlingId: number | null;
}) {
  const isResolved = completionStage === "resolved";
  const isCompletionActive = completionStage !== "idle";

  return (
    <Box
      position="relative"
      w="100%"
      h={`${MARKETING_DIARY_THREAD_TEXT_PANEL_HEIGHT}px`}
      mt="12px"
      border="0"
      bgColor="transparent"
      overflow="hidden"
      animation={`${diaryKeywordResolveIn} 360ms ease-out both`}
    >
      <Box
        position="absolute"
        left="0"
        right="0"
        top="6px"
        bottom="10px"
        bgImage="repeating-linear-gradient(180deg, transparent 0 30px, rgba(157,120,89,0.09) 30px 31px)"
        opacity={0.62}
      />
      <Box
        position="absolute"
        left="50%"
        top="6px"
        w={`${MARKETING_DIARY_THREAD_TEXT_GRID_WIDTH}px`}
        h={`${MARKETING_DIARY_THREAD_TEXT_GRID_HEIGHT}px`}
        transform="translateX(-50%)"
        overflow="hidden"
      >
        {MARKETING_DIARY_THREAD_TEXT_TOKENS.map((token) => {
          const pieceSlotIndex = Math.max(0, order.indexOf(token.pieceId));
          const isPieceRestored = pieceSlotIndex === token.pieceId;
          const isDragAffected = dragState?.pieceId === token.pieceId;
          const slotWidth =
            MARKETING_DIARY_THREAD_PUZZLE_WIDTH /
            MARKETING_DIARY_THREAD_SOLVED_ORDER.length;
          const activeSlotFloat = isDragAffected && dragState
            ? dragState.slotIndex + dragState.deltaX / slotWidth
            : pieceSlotIndex;
          const originDistanceToCorrect = isDragAffected && dragState
            ? Math.max(1, Math.abs(dragState.slotIndex - token.pieceId))
            : 1;
          const currentDistanceToCorrect = Math.abs(activeSlotFloat - token.pieceId);
          const restoreProgress = isResolved
            ? 1
            : isPieceRestored
              ? 1
              : isDragAffected
                ? 1 - Math.min(1, currentDistanceToCorrect / originDistanceToCorrect)
                : 0;
          const isTokenRestored = restoreProgress >= 0.98;
          const scatterPoint = getMarketingDiaryThreadGridPoint(token.scatterIndex);
          const solvedPoint = getMarketingDiaryThreadGridPoint(
            token.row * MARKETING_DIARY_THREAD_TEXT_GRID_COLUMN_COUNT + token.col,
          );
          const displayPoint = lerpMarketingDiaryThreadGridPoint(
            scatterPoint,
            solvedPoint,
            restoreProgress,
          );
          const isSwapAffected = swappedPieceSettlingId === token.pieceId;
          const textSettleMs = isSwapAffected
            ? METRO_FRAGMENT_SWAPPED_TEXT_SETTLE_MS
            : METRO_FRAGMENT_TEXT_SETTLE_MS;
          const activeTextNudgeX = isDragAffected && restoreProgress < 0.98 && dragState
            ? Math.max(-3, Math.min(3, dragState.deltaX * 0.018))
            : 0;
          const activeTextNudgeY = isDragAffected && restoreProgress < 0.98
            ? ((token.tokenIndex % 3) - 1) * 0.8
            : 0;
          const tokenTransform = isDragAffected
            ? `translate3d(${activeTextNudgeX}px, ${activeTextNudgeY}px, 0)`
            : undefined;
          const completionBeatDelayMs = Math.min(560, token.tokenIndex * 9);

          return (
            <Box
              key={`marketing-diary-thread-text-token-${token.tokenIndex}`}
              as="span"
              position="absolute"
              left={`${displayPoint.left}px`}
              top={`${displayPoint.top}px`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w={`${MARKETING_DIARY_THREAD_TEXT_TILE_SIZE}px`}
              h={`${MARKETING_DIARY_THREAD_TEXT_TILE_SIZE}px`}
              minW="0"
              minH="0"
              overflow="hidden"
              borderRadius="2px"
              border={
                isTokenRestored
                  ? "1px solid rgba(173, 131, 99, 0.22)"
                  : "1px solid rgba(255,255,255,0.82)"
              }
              bgColor={
                isTokenRestored
                  ? isCompletionActive
                    ? "rgba(255, 246, 225, 0.96)"
                    : "rgba(247, 240, 228, 0.86)"
                  : isDragAffected
                    ? "rgba(204, 225, 224, 0.98)"
                    : "rgba(206, 226, 225, 0.92)"
              }
              opacity={isTokenRestored || isDragAffected ? 1 : 0.9}
              zIndex={isDragAffected ? 4 : isTokenRestored ? 3 : 1}
              boxShadow={
                isTokenRestored
                  ? "0 1px 0 rgba(126, 97, 72, 0.08)"
                  : "0 1px 0 rgba(72, 92, 96, 0.08)"
              }
              pointerEvents="none"
              transition={`left ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms, top ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING} ${METRO_FRAGMENT_LAND_DELAY_MS}ms, opacity 180ms ease, border 160ms ease, background 160ms ease, box-shadow 220ms ease, transform 160ms ease`}
              transform={tokenTransform}
              animation={
                isResolved
                  ? `${metroFragmentTextBeat} 520ms ease-out ${completionBeatDelayMs}ms both`
                  : undefined
              }
            >
              <Text
                as="span"
                color={isTokenRestored ? "#302A25" : "#47656C"}
                fontSize="13px"
                fontWeight={isTokenRestored ? "900" : "800"}
                lineHeight="1"
                letterSpacing="0"
                textAlign="center"
                whiteSpace="nowrap"
                textShadow={isTokenRestored ? "0 1px 0 rgba(255,255,255,0.72)" : undefined}
                transition={`color 160ms ease, font-weight 160ms ease, transform ${textSettleMs}ms ${METRO_FRAGMENT_SETTLE_EASING}`}
              >
                {token.text}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function MarketingDiaryThreadPage({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const puzzleRef = useRef<HTMLDivElement | null>(null);
  const pieceOrderRef = useRef<number[]>([...MARKETING_DIARY_THREAD_SCRAMBLED_ORDER]);
  const dragStateRef = useRef<MarketingDiaryThreadDragState | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<number | null>(null);
  const swapMotionSlideTimerRef = useRef<number | null>(null);
  const swapMotionClearTimerRef = useRef<number | null>(null);
  const [pieceOrder, setPieceOrder] = useState<number[]>(
    () => [...MARKETING_DIARY_THREAD_SCRAMBLED_ORDER],
  );
  const [selectedPieceSlotIndex, setSelectedPieceSlotIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<MarketingDiaryThreadDragState | null>(null);
  const [completionStage, setCompletionStage] =
    useState<MarketingDiaryThreadCompletionStage>("idle");
  const [swapMotion, setSwapMotion] = useState<MarketingDiaryThreadSwapMotion | null>(null);
  const [swappedPieceSettlingId, setSwappedPieceSettlingId] = useState<number | null>(null);
  const isSolved = isMarketingDiaryThreadSolved(pieceOrder);
  const isResolved = completionStage === "resolved";

  useEffect(() => {
    if (!open) return;
    const initialOrder = [...MARKETING_DIARY_THREAD_SCRAMBLED_ORDER];
    pieceOrderRef.current = initialOrder;
    dragStateRef.current = null;
    setPieceOrder(initialOrder);
    setSelectedPieceSlotIndex(null);
    setDragState(null);
    setCompletionStage("idle");
    setSwapMotion(null);
    setSwappedPieceSettlingId(null);
  }, [open]);

  useEffect(() => {
    pieceOrderRef.current = pieceOrder;
  }, [pieceOrder]);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      if (resolveTimerRef.current !== null) window.clearTimeout(resolveTimerRef.current);
      if (swapMotionSlideTimerRef.current !== null) window.clearTimeout(swapMotionSlideTimerRef.current);
      if (swapMotionClearTimerRef.current !== null) window.clearTimeout(swapMotionClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!isSolved) {
      if (completionStage !== "idle") setCompletionStage("idle");
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      if (resolveTimerRef.current !== null) {
        window.clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
      return;
    }
    if (completionStage !== "idle") return;

    settleTimerRef.current = window.setTimeout(() => {
      setCompletionStage("settle");
      settleTimerRef.current = null;
    }, 180);
    resolveTimerRef.current = window.setTimeout(() => {
      setCompletionStage("resolved");
      resolveTimerRef.current = null;
    }, MARKETING_DIARY_THREAD_SETTLE_MS + MARKETING_DIARY_THREAD_RESOLVE_MS);

    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      if (resolveTimerRef.current !== null) {
        window.clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = null;
      }
    };
  }, [completionStage, isSolved, open]);

  const clearMarketingSwapMotionTimers = () => {
    if (swapMotionSlideTimerRef.current !== null) {
      window.clearTimeout(swapMotionSlideTimerRef.current);
      swapMotionSlideTimerRef.current = null;
    }
    if (swapMotionClearTimerRef.current !== null) {
      window.clearTimeout(swapMotionClearTimerRef.current);
      swapMotionClearTimerRef.current = null;
    }
  };

  const markMarketingSwapMotion = ({
    draggedPieceId,
    swappedPieceId,
    originSlotIndex,
    targetSlotIndex,
  }: Omit<MarketingDiaryThreadSwapMotion, "phase">) => {
    clearMarketingSwapMotionTimers();
    setSwappedPieceSettlingId(swappedPieceId);
    setSwapMotion({
      draggedPieceId,
      swappedPieceId,
      originSlotIndex,
      targetSlotIndex,
      phase: "cover",
    });
    swapMotionSlideTimerRef.current = window.setTimeout(() => {
      setSwapMotion((current) =>
        current?.draggedPieceId === draggedPieceId &&
        current.swappedPieceId === swappedPieceId &&
        current.originSlotIndex === originSlotIndex &&
        current.targetSlotIndex === targetSlotIndex
          ? { ...current, phase: "slide" }
          : current,
      );
      swapMotionSlideTimerRef.current = null;
    }, METRO_FRAGMENT_SWAP_COVER_HOLD_MS);
    swapMotionClearTimerRef.current = window.setTimeout(() => {
      setSwapMotion(null);
      setSwappedPieceSettlingId(null);
      swapMotionClearTimerRef.current = null;
    }, METRO_FRAGMENT_SWAP_COVER_HOLD_MS + METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS + 90);
  };

  const swapPieceSlots = (fromSlotIndex: number, toSlotIndex: number) => {
    if (fromSlotIndex === toSlotIndex) return;
    const currentOrder = pieceOrderRef.current;
    const draggedPieceId = currentOrder[fromSlotIndex];
    const swappedPieceId = currentOrder[toSlotIndex];
    if (typeof draggedPieceId === "number" && typeof swappedPieceId === "number") {
      markMarketingSwapMotion({
        draggedPieceId,
        swappedPieceId,
        originSlotIndex: fromSlotIndex,
        targetSlotIndex: toSlotIndex,
      });
    }
    setPieceOrder((current) => {
      if (
        fromSlotIndex < 0 ||
        toSlotIndex < 0 ||
        fromSlotIndex >= current.length ||
        toSlotIndex >= current.length
      ) {
        return current;
      }
      const next = [...current];
      [next[fromSlotIndex], next[toSlotIndex]] = [
        next[toSlotIndex],
        next[fromSlotIndex],
      ];
      pieceOrderRef.current = next;
      return next;
    });
  };

  const handlePieceSelect = (slotIndex: number) => {
    if (isResolved) return;
    if (selectedPieceSlotIndex === null) {
      setSelectedPieceSlotIndex(slotIndex);
      return;
    }
    if (selectedPieceSlotIndex === slotIndex) {
      setSelectedPieceSlotIndex(null);
      return;
    }

    swapPieceSlots(selectedPieceSlotIndex, slotIndex);
    setSelectedPieceSlotIndex(null);
  };

  const getDropSlotIndex = (clientX: number) => {
    const rect = puzzleRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    const relativeX = clientX - rect.left;

    return Array.from({ length: MARKETING_DIARY_THREAD_PIECES.length }).reduce<number>(
      (bestSlotIndex, _pieceId, slotIndex) => {
        const slotCenterX = rect.width * ((slotIndex + 0.5) / MARKETING_DIARY_THREAD_PIECES.length);
        const bestCenterX = rect.width * ((bestSlotIndex + 0.5) / MARKETING_DIARY_THREAD_PIECES.length);
        const distance = Math.abs(relativeX - slotCenterX);
        const bestDistance = Math.abs(relativeX - bestCenterX);
        return distance < bestDistance ? slotIndex : bestSlotIndex;
      },
      0,
    );
  };

  const releaseMarketingPiecePointer = (
    target: EventTarget & Element,
    pointerId: number,
  ) => {
    if ("releasePointerCapture" in target) {
      try {
        (target as Element & { releasePointerCapture: (id: number) => void }).releasePointerCapture(pointerId);
      } catch {
        // Pointer capture can already be released when the pointer leaves the element.
      }
    }
  };

  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      overflow="hidden"
      bgColor="#F7F0E4"
      bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
    >
      <Flex
        as="button"
        position="absolute"
        left="12px"
        bottom="28px"
        zIndex={8}
        h="42px"
        minW="86px"
        px="12px"
        borderRadius="6px"
        bgColor="#A57C58"
        alignItems="center"
        justifyContent="center"
        gap="6px"
        boxShadow="0 8px 18px rgba(80,54,33,0.18)"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
          ‹
        </Text>
        <Text color="white" fontSize="14px" fontWeight="700" lineHeight="1">
          返回
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="27px"
        right="0"
        top="28px"
        bottom="22px"
        direction="column"
        overflow="hidden"
        bgColor="#FFFEFC"
        border="2px solid #9D7859"
        borderRight="0"
        borderRadius="4px 0 0 4px"
        boxShadow="0 2px 0 rgba(128,105,91,0.18)"
      >
        <Flex
          h="54px"
          w="100%"
          bgColor="rgba(197, 218, 218, 0.96)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text
            key={isResolved ? "resolved-title" : "mystery-title"}
            color="#FFFFFF"
            fontSize="30px"
            fontWeight="900"
            lineHeight="1"
            letterSpacing="0"
            animation={`${revealStageIn} 280ms ease both`}
          >
            {isResolved ? "雨天散步" : "???"}
          </Text>
        </Flex>

        <Flex
          flex="1"
          minH="0"
          overflowY="auto"
          direction="column"
          px="16px"
          pt="82px"
          pb="92px"
          css={{ scrollbarWidth: "none" }}
        >
          <Box
            ref={puzzleRef}
            w={`${MARKETING_DIARY_THREAD_PUZZLE_WIDTH}px`}
            maxW="100%"
            h={`${MARKETING_DIARY_THREAD_PUZZLE_HEIGHT}px`}
            mx="auto"
            aspectRatio={MARKETING_DIARY_THREAD_IMAGE_ASPECT_RATIO}
            position="relative"
            overflow="hidden"
            bgColor="#CADCDC"
            border="0"
            borderRadius="2px"
            boxShadow="0 12px 20px rgba(80, 72, 60, 0.08)"
            animation={completionStage === "settle" ? `${metroPuzzleRitualSettle} 760ms cubic-bezier(0.18, 0.78, 0.24, 1) both` : undefined}
            style={{ aspectRatio: MARKETING_DIARY_THREAD_IMAGE_ASPECT_RATIO }}
          >
            {MARKETING_DIARY_THREAD_PIECES.map((piece, pieceId) => {
              const slotIndex = Math.max(0, pieceOrder.indexOf(pieceId));
              const activeDrag = dragState?.pieceId === pieceId ? dragState : null;
              const dragDistance = activeDrag?.deltaX ?? 0;
              const isSelected = selectedPieceSlotIndex === slotIndex;
              const activeSwapMotion = swapMotion && !activeDrag ? swapMotion : null;
              const isDroppedPieceHoldingFront = activeSwapMotion?.draggedPieceId === pieceId;
              const isSwappedPieceSlidingOut = activeSwapMotion?.swappedPieceId === pieceId;
              const swappedPieceOffsetPercent = activeSwapMotion && isSwappedPieceSlidingOut
                ? (activeSwapMotion.targetSlotIndex - activeSwapMotion.originSlotIndex) * 100
                : 0;
              const isSwappedPieceSettling = swappedPieceSettlingId === pieceId && !activeDrag;
              const tileSettleMs = isSwappedPieceSettling
                ? METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS
                : METRO_FRAGMENT_TILE_SETTLE_MS;
              const tileSettleEasing = isSwappedPieceSettling
                ? METRO_FRAGMENT_SWAP_SLIDE_EASING
                : METRO_FRAGMENT_SETTLE_EASING;
              const tileTransform = activeDrag
                ? `translate3d(${dragDistance}px, 0, 0)`
                : isSwappedPieceSlidingOut && activeSwapMotion?.phase === "cover"
                  ? `translate3d(${swappedPieceOffsetPercent}%, 0, 0)`
                  : "translate3d(0, 0, 0)";
              const tileTransition = activeDrag
                ? "none"
                : isSwappedPieceSlidingOut
                  ? activeSwapMotion?.phase === "cover"
                    ? "none"
                    : `transform ${METRO_FRAGMENT_SWAPPED_TILE_SETTLE_MS}ms ${METRO_FRAGMENT_SWAP_SLIDE_EASING}`
                  : [
                      `left ${tileSettleMs}ms ${tileSettleEasing}`,
                      `transform ${tileSettleMs}ms ${tileSettleEasing}`,
                    ].join(", ");
              return (
                <Flex
                  as="button"
                  key={`marketing-diary-thread-piece-${pieceId}`}
                  position="absolute"
                  top="0"
                  left={`${slotIndex * 25}%`}
                  w="25%"
                  h="100%"
                  border="0"
                  p="0"
                  bgColor="#FFFFFF"
                  overflow="hidden"
                  cursor={isSolved ? "default" : activeDrag ? "grabbing" : "grab"}
                  aria-label={`日記 thread 插圖碎片 ${pieceId + 1}`}
                  touchAction="none"
                  transform={tileTransform}
                  transition={tileTransition}
                  zIndex={
                    activeDrag
                      ? 10
                      : isDroppedPieceHoldingFront
                        ? 9
                        : isSwappedPieceSlidingOut
                          ? 3
                          : isSelected
                            ? 4
                            : 2
                  }
                  onPointerDown={(event) => {
                    if (isSolved) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const nextDragState = {
                      slotIndex,
                      pieceId,
                      pointerId: event.pointerId,
                      startClientX: event.clientX,
                      deltaX: 0,
                    };
                    dragStateRef.current = nextDragState;
                    setDragState(nextDragState);
                    clearMarketingSwapMotionTimers();
                    setSwapMotion(null);
                    setSwappedPieceSettlingId(null);
                  }}
                  onPointerMove={(event) => {
                    const currentDragState = dragStateRef.current;
                    if (
                      !currentDragState ||
                      currentDragState.pointerId !== event.pointerId ||
                      currentDragState.pieceId !== pieceId
                    ) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const nextDragState = {
                      ...currentDragState,
                      deltaX: event.clientX - currentDragState.startClientX,
                    };
                    dragStateRef.current = nextDragState;
                    setDragState(nextDragState);
                  }}
                  onPointerUp={(event) => {
                    const currentDragState = dragStateRef.current;
                    if (
                      !currentDragState ||
                      currentDragState.pointerId !== event.pointerId ||
                      currentDragState.pieceId !== pieceId
                    ) return;
                    event.preventDefault();
                    event.stopPropagation();
                    releaseMarketingPiecePointer(event.currentTarget, event.pointerId);
                    const movedDistance = Math.abs(currentDragState.deltaX);
                    if (movedDistance >= 10) {
                      const targetSlotIndex = getDropSlotIndex(event.clientX);
                      swapPieceSlots(currentDragState.slotIndex, targetSlotIndex);
                      setSelectedPieceSlotIndex(null);
                    } else {
                      handlePieceSelect(currentDragState.slotIndex);
                    }
                    dragStateRef.current = null;
                    setDragState(null);
                  }}
                  onPointerCancel={(event) => {
                    const currentDragState = dragStateRef.current;
                    if (
                      !currentDragState ||
                      currentDragState.pointerId !== event.pointerId ||
                      currentDragState.pieceId !== pieceId
                    ) return;
                    releaseMarketingPiecePointer(event.currentTarget, event.pointerId);
                    dragStateRef.current = null;
                    setDragState(null);
                  }}
                  onKeyDown={(event) => {
                    if (isSolved || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    event.stopPropagation();
                    handlePieceSelect(slotIndex);
                  }}
                >
                  <Box
                    w="100%"
                    h="100%"
                    backgroundImage={`url("${MARKETING_DIARY_THREAD_IMAGE_PATH}")`}
                    backgroundSize="400% 100%"
                    backgroundPosition={piece.backgroundPosition}
                    backgroundRepeat="no-repeat"
                    filter={
                      completionStage === "settle"
                        ? "saturate(1.06) brightness(1.04)"
                        : isResolved
                          ? "none"
                          : "saturate(0.86) contrast(0.96)"
                    }
                    opacity={isResolved || completionStage === "settle" ? 1 : 0.88}
                    transition="filter 320ms ease, opacity 320ms ease"
                    animation={isResolved ? `${revealStageIn} 320ms ease both` : undefined}
                  />
                </Flex>
              );
            })}
            <Box
              position="absolute"
              inset="0"
              zIndex={12}
              pointerEvents="none"
              border="4px solid rgba(100,112,125,0.88)"
              borderRadius="2px"
              boxSizing="border-box"
              animation={
                completionStage === "settle"
                  ? `${metroPuzzleFramePulse} 780ms ease-out both`
                  : undefined
              }
            >
              {isSolved
                ? null
                : [1, 2, 3].map((dividerIndex) => (
                    <Box
                      key={`marketing-thread-divider-${dividerIndex}`}
                      position="absolute"
                      top="0"
                      bottom="0"
                      left={`${dividerIndex * 25}%`}
                      w="4px"
                      bgColor="rgba(100,112,125,0.88)"
                      transform="translateX(-50%)"
                      animation={
                        completionStage === "settle"
                          ? `${metroPuzzleDividerPulse} 780ms ease-out ${dividerIndex * 90}ms both`
                          : undefined
                      }
                    />
                  ))}
            </Box>
          </Box>

          <MarketingDiaryThreadTextGrid
            order={pieceOrder}
            dragState={dragState}
            completionStage={completionStage}
            swappedPieceSettlingId={swappedPieceSettlingId}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

function VisualDiaryBookPage({
  title,
  pages,
  stagedReveal = false,
  isRevealComplete = true,
  keepSinglePageCentered = false,
  showBackButton = false,
  onBack,
  onContinue,
  continueLabel = "繼續",
  overlay,
  animateTitleChange = false,
  fadeFirstPage = false,
  rhythm = "default",
  pageMode = "scroll",
  slideTotalPages,
  slidePageNumberOffset = 0,
  controlledSlidePageIndex,
  deferSlideTextUntilReady = false,
  scrollBottomPadding = 48,
}: {
  title: string;
  pages: readonly VisualDiaryPageItem[];
  stagedReveal?: boolean;
  isRevealComplete?: boolean;
  keepSinglePageCentered?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  overlay?: ReactNode;
  animateTitleChange?: boolean;
  fadeFirstPage?: boolean;
  rhythm?: "default" | "restoration";
  pageMode?: "scroll" | "slide";
  slideTotalPages?: number;
  slidePageNumberOffset?: number;
  controlledSlidePageIndex?: number;
  deferSlideTextUntilReady?: boolean;
  scrollBottomPadding?: number;
}) {
  const [slidePageIndex, setSlidePageIndex] = useState(0);
  const isOpeningStage = stagedReveal && !isRevealComplete;
  const visiblePages = isOpeningStage ? pages.slice(0, 1) : pages;
  const currentSlideIndex = Math.min(
    Math.max(0, controlledSlidePageIndex ?? slidePageIndex),
    Math.max(0, visiblePages.length - 1),
  );
  const currentSlidePage = visiblePages[currentSlideIndex];
  const shouldKeepSinglePageCentered = keepSinglePageCentered && visiblePages.length === 1;
  const shouldShowContinue = !isOpeningStage && Boolean(onContinue);
  const shouldUseSlideMode = pageMode === "slide";
  const shouldUseMetroPuzzleSlideLayout = shouldUseSlideMode && Boolean(currentSlidePage?.selectableMetroClue);
  const shouldShowSlidePagingControls =
    shouldUseSlideMode && !shouldShowContinue && !isOpeningStage && visiblePages.length > 1;
  const isRestorationRhythm = rhythm === "restoration";
  const titleRevealDurationMs = isRestorationRhythm ? 460 : 320;
  const pageRevealDurationMs = isRestorationRhythm ? 680 : 520;
  const textRevealDurationMs = isRestorationRhythm ? 520 : 360;
  const effectiveScrollBottomPadding = scrollBottomPadding + (showBackButton ? 62 : 0);
  const scrollTransition = isRestorationRhythm
    ? "padding-top 860ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "padding-top 560ms ease";

  useEffect(() => {
    setSlidePageIndex(0);
  }, [isRevealComplete, pages.length, title]);

  const handleSlideContinue = () => {
    if (currentSlideIndex < visiblePages.length - 1) {
      setSlidePageIndex((current) => Math.min(current + 1, visiblePages.length - 1));
      return;
    }
    onContinue?.();
  };

  const goToPreviousSlidePage = () => {
    setSlidePageIndex((current) => Math.max(0, current - 1));
  };

  const goToNextSlidePage = () => {
    setSlidePageIndex((current) => Math.min(visiblePages.length - 1, current + 1));
  };

  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      overflow="hidden"
      bgColor="#F7F0E4"
      bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
    >
      {showBackButton ? (
        <Flex
          as="button"
          position="absolute"
          left="12px"
          bottom="28px"
          zIndex={6}
          h="42px"
          minW="86px"
          px="12px"
          borderRadius="6px"
          bgColor="#A57C58"
          alignItems="center"
          justifyContent="center"
          gap="6px"
          boxShadow="0 8px 18px rgba(80,54,33,0.18)"
          onClick={(event) => {
            event.stopPropagation();
            onBack?.();
          }}
        >
          <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
            ‹
          </Text>
          <Text color="white" fontSize="14px" fontWeight="700" lineHeight="1">
            返回
          </Text>
        </Flex>
      ) : null}

      {shouldShowSlidePagingControls ? (
        <Flex
          position="absolute"
          right="14px"
          bottom="28px"
          zIndex={6}
          gap="8px"
          alignItems="center"
        >
          <Flex
            as="button"
            h="42px"
            minW="86px"
            px="12px"
            borderRadius="6px"
            bgColor="#A57C58"
            alignItems="center"
            justifyContent="center"
            gap="6px"
            boxShadow="0 8px 18px rgba(80,54,33,0.18)"
            cursor={currentSlideIndex > 0 ? "pointer" : "default"}
            opacity={currentSlideIndex > 0 ? 1 : 0.42}
            aria-label="上一頁"
            onClick={(event) => {
              event.stopPropagation();
              if (currentSlideIndex <= 0) return;
              goToPreviousSlidePage();
            }}
          >
            <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
              ‹
            </Text>
            <Text color="white" fontSize="14px" fontWeight="700" lineHeight="1">
              上一頁
            </Text>
          </Flex>
          <Flex
            as="button"
            h="42px"
            minW="86px"
            px="12px"
            borderRadius="6px"
            bgColor="#A57C58"
            alignItems="center"
            justifyContent="center"
            gap="6px"
            boxShadow="0 8px 18px rgba(80,54,33,0.18)"
            cursor={currentSlideIndex < visiblePages.length - 1 ? "pointer" : "default"}
            opacity={currentSlideIndex < visiblePages.length - 1 ? 1 : 0.42}
            aria-label="下一頁"
            onClick={(event) => {
              event.stopPropagation();
              if (currentSlideIndex >= visiblePages.length - 1) return;
              goToNextSlidePage();
            }}
          >
            <Text color="white" fontSize="14px" fontWeight="700" lineHeight="1">
              下一頁
            </Text>
            <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
              ›
            </Text>
          </Flex>
        </Flex>
      ) : null}

      <Flex
        position="absolute"
        left="27px"
        right="0"
        top="28px"
        bottom="22px"
        direction="column"
        overflow="hidden"
        bgColor="#FFFEFC"
        border="2px solid #9D7859"
        borderRight="0"
        borderRadius="4px 0 0 4px"
        boxShadow="0 2px 0 rgba(128,105,91,0.18)"
      >
        <Flex
          h="54px"
          w="100%"
          bgColor="rgba(157,120,89,0.2)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text
            key={animateTitleChange ? title : "static-title"}
            color="#9D7859"
            fontSize="20px"
            fontWeight="500"
            lineHeight="1"
            animation={animateTitleChange ? `${revealStageIn} ${titleRevealDurationMs}ms ease both` : undefined}
          >
            {title}
          </Text>
        </Flex>
        {shouldUseSlideMode && currentSlidePage ? (
          <Flex
            flex="1"
            minH="0"
            overflow="hidden"
            direction="column"
            px={shouldUseMetroPuzzleSlideLayout ? "16px" : "36px"}
            pt={shouldUseMetroPuzzleSlideLayout ? "58px" : "76px"}
            pb="30px"
            alignItems="stretch"
          >
            <Flex
              key={`${currentSlideIndex}-${currentSlidePage.imagePath}`}
              direction="column"
              h="100%"
              minH="0"
              animation={`${diarySlidePageIn} 420ms cubic-bezier(0.2, 0.82, 0.24, 1) both`}
            >
              {!shouldUseMetroPuzzleSlideLayout ? (
                <>
                  <Text
                    color="#9D7859"
                    fontSize="30px"
                    fontWeight="800"
                    lineHeight="1"
                    textAlign="center"
                    mb="34px"
                  >
                    {currentSlideIndex + 1 + slidePageNumberOffset}/{slideTotalPages ?? visiblePages.length}
                  </Text>
                  <Flex
                    w="100%"
                    aspectRatio={currentSlidePage.imageAspectRatio ?? "577 / 362"}
                    overflow="hidden"
                    border="2px solid #9D7859"
                    borderRadius="2px"
                    bgColor="#EBE3DB"
                    animation={currentSlidePage.imageEffect === "fade" ? `${diaryPanelFadeIn} 620ms ease both` : undefined}
                    flexShrink={0}
                  >
                    {isVisualDiaryImageAssetPath(currentSlidePage.imagePath) ? (
                      <img
                        src={currentSlidePage.imagePath}
                        alt="日記插圖"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ) : (
                      <MovingDiaryIllustration variant={currentSlidePage.variant} />
                    )}
                  </Flex>
                </>
              ) : null}
              <Box
                mt={shouldUseMetroPuzzleSlideLayout ? "0" : "24px"}
                key={`slide-text-${currentSlideIndex}-${currentSlidePage.imagePath}`}
                animation={currentSlidePage.textEffect === "fade" ? `${revealStageIn} ${textRevealDurationMs}ms ease both` : undefined}
              >
                {isOpeningStage && deferSlideTextUntilReady ? (
                  <Flex direction="column" gap="10px" pt="4px">
                    {[0, 1, 2].map((index) => (
                      <Flex
                        key={`slide-placeholder-${index}`}
                        h={index === 2 ? "16px" : "18px"}
                        w={index === 2 ? "34%" : "100%"}
                        borderRadius="999px"
                        bgColor="#BDA28D"
                        opacity={0.92}
                      />
                    ))}
                  </Flex>
                ) : (
                  <VisualDiaryPageText
                    key={`slide-${currentSlideIndex}-${currentSlidePage.textEffect ?? "plain"}`}
                    text={currentSlidePage.text}
                    effect={currentSlidePage.textEffect}
                    initialText={currentSlidePage.initialText}
                    selectableMetroClue={currentSlidePage.selectableMetroClue}
                  />
                )}
              </Box>
              {shouldShowContinue ? (
                <Flex justifyContent="center" mt="auto" pt="22px">
                  <Flex
                    as="button"
                    h="44px"
                    w="168px"
                    maxW="100%"
                    px="24px"
                    borderRadius="999px"
                    bgColor="#9D7859"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    boxShadow="0 8px 18px rgba(80,54,33,0.14)"
                    onClick={handleSlideContinue}
                  >
                    <Text color="#FFFFFF" fontSize="16px" fontWeight="700" lineHeight="1">
                      {currentSlideIndex < visiblePages.length - 1 ? "下一頁" : continueLabel}
                    </Text>
                  </Flex>
                </Flex>
              ) : null}
            </Flex>
          </Flex>
        ) : (
          <Flex
            flex="1"
            minH="0"
            overflowY="auto"
            px="24px"
            pt={shouldKeepSinglePageCentered ? "100px" : isOpeningStage ? "150px" : "32px"}
            pb="0"
            transition={scrollTransition}
            css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
          >
            <Flex w="100%" direction="column" alignItems="stretch" gap="32px">
              {visiblePages.map((page, index) => (
              <Flex
                key={`${page.imagePath}-${index}`}
                direction="column"
                gap="18px"
                animation={
                  (stagedReveal && (index > 0 || fadeFirstPage)) || (!stagedReveal && index === 0)
                    ? `${revealStageIn} ${pageRevealDurationMs}ms ease both`
                    : undefined
                }
              >
                  <Flex
                    w="100%"
                    aspectRatio={page.imageAspectRatio ?? "577 / 362"}
                    overflow="hidden"
                    border="2px solid #9D7859"
                    borderRadius="2px"
                    bgColor="#EBE3DB"
                    animation={page.imageEffect === "fade" ? `${diaryPanelFadeIn} 620ms ease both` : undefined}
                  >
                    {isVisualDiaryImageAssetPath(page.imagePath) ? (
                      <img
                        src={page.imagePath}
                        alt="日記插圖"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    ) : (
                      <MovingDiaryIllustration variant={page.variant} />
                    )}
                  </Flex>
                <Box
                  key={`text-${index}-${page.imagePath}`}
                  animation={page.textEffect === "fade" ? `${revealStageIn} ${textRevealDurationMs}ms ease both` : undefined}
                >
                  <VisualDiaryPageText
                    key={`${index}-${page.textEffect ?? "plain"}`}
                    text={page.text}
                    effect={page.textEffect}
                    initialText={page.initialText}
                    selectableMetroClue={page.selectableMetroClue}
                  />
                </Box>
              </Flex>
            ))}
            {shouldShowContinue ? (
              <Flex
                justifyContent="center"
                pt={visiblePages.length > 1 ? "28px" : "8px"}
                pb="44px"
                animation={stagedReveal ? `${revealStageIn} 420ms ease both` : undefined}
              >
                <Flex
                  as="button"
                  h="56px"
                  w="228px"
                  maxW="100%"
                  px="30px"
                  borderRadius="6px"
                  bgColor="#7E6148"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 18px rgba(80,54,33,0.18)"
                  onClick={onContinue}
                >
                  <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                    {continueLabel}
                  </Text>
                </Flex>
              </Flex>
            ) : null}
            <Box h={`${effectiveScrollBottomPadding}px`} flexShrink={0} aria-hidden="true" />
          </Flex>
        </Flex>
        )}
      </Flex>

      {overlay}
    </Flex>
  );
}

function BaiEntry1RevealTileGrid({
  text,
  tone,
  placeholderCount = BAI_ENTRY_1_REVEAL_TEXT_PLACEHOLDER_COUNT,
  restoreFromBottom = false,
  settled = false,
}: {
  text?: string;
  tone: "cream" | "teal";
  placeholderCount?: number;
  restoreFromBottom?: boolean;
  settled?: boolean;
}) {
  const characters = useMemo(
    () => (text ? Array.from(text).filter((character) => character !== "\n") : []),
    [text],
  );
  const isPlaceholder = !text;
  const cellCount = isPlaceholder ? placeholderCount : characters.length;
  const rowCount = Math.max(
    1,
    Math.ceil(cellCount / BAI_ENTRY_1_REVEAL_TEXT_GRID_COLUMN_COUNT),
  );
  const tileBgColor =
    settled || tone === "cream"
      ? settled
        ? "#F9F4EB"
        : "rgba(248, 241, 229, 0.94)"
      : "rgba(198, 219, 220, 0.98)";
  const tileTextColor = settled ? "#6B5748" : tone === "cream" ? "#6B5748" : "#47656C";
  const tileBorderColor =
    settled || tone === "cream"
      ? settled
        ? "rgba(173, 131, 99, 0.08)"
        : "rgba(173, 131, 99, 0.08)"
      : "rgba(255,255,255,0.76)";

  return (
    <Box
      display="grid"
      gridTemplateColumns={`repeat(${BAI_ENTRY_1_REVEAL_TEXT_GRID_COLUMN_COUNT}, clamp(18px, 5.05vw, 22px))`}
      gap="4px"
      w="fit-content"
      maxW="100%"
      mx="auto"
      p="0"
      borderRadius="3px"
      bgColor="transparent"
      aria-label={isPlaceholder ? "尚未揭露的日記文字" : text}
    >
      {Array.from({ length: cellCount }).map((_, index) => {
        const rowIndex = Math.floor(index / BAI_ENTRY_1_REVEAL_TEXT_GRID_COLUMN_COUNT);
        const columnIndex = index % BAI_ENTRY_1_REVEAL_TEXT_GRID_COLUMN_COUNT;
        const restoreDelayMs = restoreFromBottom
          ? (rowCount - rowIndex - 1) * 100 + columnIndex * 10
          : 0;

        return (
          <Flex
            key={`bai-entry-1-reveal-text-tile-${restoreFromBottom ? "restore" : "static"}-${index}`}
            as="span"
            alignItems="center"
            justifyContent="center"
            aspectRatio="1 / 1"
            minW="0"
            minH="0"
            overflow="hidden"
            borderRadius="2px"
            border={`1px solid ${tileBorderColor}`}
            bgColor={tileBgColor}
            boxShadow="0 1px 0 rgba(126, 97, 72, 0.08)"
            transformOrigin="bottom center"
            transition="background-color 520ms ease, border-color 520ms ease, box-shadow 420ms ease"
            animation={
              restoreFromBottom && !settled
                ? `${baiEntry1TextTileRestoreUp} 820ms cubic-bezier(0.18, 0.76, 0.24, 1) ${restoreDelayMs}ms both`
                : undefined
            }
            aria-hidden="true"
          >
            {isPlaceholder ? null : (
              <Text
                as="span"
                color={tileTextColor}
                fontSize="13px"
                fontWeight="800"
                lineHeight="1"
                letterSpacing="0"
                textAlign="center"
                whiteSpace="nowrap"
                opacity={settled || tone === "cream" ? 1 : 0.82}
                transition="color 680ms ease, opacity 520ms ease"
                animation={
                  restoreFromBottom && !settled
                    ? `${baiEntry1TextCharacterRestoreIn} 820ms ease-out ${restoreDelayMs}ms both`
                    : undefined
                }
              >
                {characters[index]}
              </Text>
            )}
          </Flex>
        );
      })}
    </Box>
  );
}

function BaiEntry1NaotaroDiaryRevealPage({
  imageRevealed,
  textRevealed,
  titleRevealed,
  showBackButton,
  onBack,
  onContinue,
  overlay,
}: {
  imageRevealed: boolean;
  textRevealed: boolean;
  titleRevealed: boolean;
  showBackButton: boolean;
  onBack: () => void;
  onContinue: () => void;
  overlay?: ReactNode;
}) {
  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      overflow="hidden"
      bgColor="#F7F0E4"
      bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
    >
      {showBackButton ? (
        <Flex
          as="button"
          position="absolute"
          left="12px"
          bottom="28px"
          zIndex={6}
          h="42px"
          minW="86px"
          px="12px"
          borderRadius="6px"
          bgColor="#A57C58"
          alignItems="center"
          justifyContent="center"
          gap="6px"
          boxShadow="0 8px 18px rgba(80,54,33,0.18)"
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
        >
          <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
            ‹
          </Text>
          <Text color="white" fontSize="14px" fontWeight="700" lineHeight="1">
            返回
          </Text>
        </Flex>
      ) : null}

      <Flex
        position="absolute"
        left="27px"
        right="0"
        top="28px"
        bottom="22px"
        direction="column"
        overflow="hidden"
        bgColor={titleRevealed ? "#F9F4EB" : "#FFFEFC"}
        border="2px solid #9D7859"
        borderRight="0"
        borderRadius="4px 0 0 4px"
        boxShadow="0 2px 0 rgba(128,105,91,0.18)"
        transition="background-color 760ms ease"
      >
        <Flex
          h="54px"
          w="100%"
          bgColor={titleRevealed ? "#9D7859" : "rgba(197, 218, 218, 0.96)"}
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          transition="background-color 760ms ease"
        >
          <Text
            key={titleRevealed ? "bai-entry-1-restored-title" : "bai-entry-1-mystery-title"}
            color="#FFFFFF"
            fontSize={titleRevealed ? "22px" : "30px"}
            fontWeight="900"
            lineHeight="1"
            letterSpacing="0"
            animation={`${revealStageIn} 360ms ease both`}
          >
            {titleRevealed ? "捷運上夾到了" : "???"}
          </Text>
        </Flex>

        <Flex
          flex="1"
          minH="0"
          overflow="hidden"
          position="relative"
          zIndex={2}
          direction="column"
          px="18px"
          pt="28px"
          pb="88px"
          gap="20px"
        >
          <Flex w="100%" justifyContent="center">
            <Flex w="100%" maxW="430px" direction="column" alignItems="stretch">
              <Box
                w="100%"
                p="0"
                border="0"
                borderRadius="0"
                bgColor="transparent"
                boxShadow="0 12px 20px rgba(80, 72, 60, 0.08)"
              >
                <Box
                  position="relative"
                  w="100%"
                  aspectRatio={BAI_ENTRY_1_IMAGE_ASPECT_RATIO}
                  overflow="hidden"
                  borderRadius="0"
                  bgColor="transparent"
                  style={{ aspectRatio: BAI_ENTRY_1_IMAGE_ASPECT_RATIO }}
                >
                  {METRO_FRAGMENT_PUZZLE_PIECES.map((piece, pieceId) => {
                    const isMissingPiece =
                      pieceId === BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID && !imageRevealed;
                    const isRestoredPiece =
                      pieceId === BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID && imageRevealed;

                    return (
                      <Box
                        key={`bai-entry-1-reveal-piece-${pieceId}`}
                        position="absolute"
                        top="0"
                        left={`${pieceId * 25}%`}
                        w="25%"
                        h="100%"
                        overflow="hidden"
                        bgColor={isMissingPiece ? "#CBDDDD" : "#FFFFFF"}
                        zIndex={isRestoredPiece ? 3 : 2}
                      >
                        {isMissingPiece ? (
                          <Flex
                            w="100%"
                            h="100%"
                            alignItems="center"
                            justifyContent="center"
                            bgColor="#CBDDDD"
                          >
                            <Text
                              color="#FFFFFF"
                              fontSize="48px"
                              fontWeight="900"
                              lineHeight="1"
                              textShadow="none"
                              animation={`${metroPuzzleQuestionPulse} 960ms ease-out infinite alternate`}
                            >
                              ?
                            </Text>
                          </Flex>
                        ) : (
                          <Box position="relative" w="100%" h="100%">
                            <Box
                              w="100%"
                              h="100%"
                              backgroundImage={`url("${BAI_ENTRY_1_IMAGE_PATH}")`}
                              backgroundSize="400% 100%"
                              backgroundPosition={piece.backgroundPosition}
                              backgroundRepeat="no-repeat"
                              filter={imageRevealed ? "none" : "saturate(0.9) contrast(0.97)"}
                              opacity={imageRevealed ? 1 : 0.9}
                              transition="filter 320ms ease, opacity 320ms ease"
                              animation={
                                isRestoredPiece
                                  ? `${baiEntry1PhotoPieceRestoreIn} 980ms ease-out both`
                                  : undefined
                              }
                            />
                            {isRestoredPiece ? (
                              <Box
                                position="absolute"
                                inset="0"
                                pointerEvents="none"
                                animation={`${baiEntry1PhotoPieceFlashOut} 980ms ease-out both`}
                              />
                            ) : null}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                  <Box
                    position="absolute"
                    inset="0"
                    zIndex={12}
                    pointerEvents="none"
                    border="4px solid rgba(100,112,125,0.88)"
                    borderRadius="2px"
                    boxSizing="border-box"
                  >
                    {[1, 2, 3].map((dividerIndex) => (
                      <Box
                        key={`bai-entry-1-reveal-divider-${dividerIndex}`}
                        position="absolute"
                        top="0"
                        bottom="0"
                        left={`${dividerIndex * 25}%`}
                        w="4px"
                        bgColor="rgba(100,112,125,0.88)"
                        opacity={titleRevealed ? 0 : 1}
                        transform="translateX(-50%)"
                        transition="opacity 620ms ease"
                        animation={
                          imageRevealed && !titleRevealed
                            ? `${metroPuzzleDividerPulse} 780ms ease-out ${dividerIndex * 90}ms both`
                            : undefined
                        }
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            </Flex>
          </Flex>

          <Flex direction="column" gap="18px" alignItems="center">
            <BaiEntry1RevealTileGrid text={BAI_ENTRY_1_RESTORED_PAGE_1_TEXT} tone="cream" />
            {textRevealed ? (
              <BaiEntry1RevealTileGrid
                text={BAI_ENTRY_1_RESTORED_PAGE_2_TEXT}
                tone={titleRevealed ? "cream" : "teal"}
                restoreFromBottom
                settled={titleRevealed}
              />
            ) : (
              <Box h="112px" flexShrink={0} aria-hidden="true" />
            )}
          </Flex>
        </Flex>

        {titleRevealed ? (
          <Box
            position="absolute"
            right="18px"
            bottom="82px"
            zIndex={1}
            w="106px"
            pointerEvents="none"
            opacity={0.82}
            animation={`${revealStageIn} 620ms ease 260ms both`}
            aria-hidden="true"
          >
            <img
              src="/collection/naotaro_lg.png"
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                filter: "drop-shadow(0 10px 14px rgba(91, 69, 49, 0.13))",
              }}
            />
          </Box>
        ) : null}

        {titleRevealed ? (
          <Flex
            position="absolute"
            left="0"
            right="0"
            bottom="20px"
            zIndex={4}
            justifyContent="center"
            animation={`${revealStageIn} 520ms ease 420ms both`}
          >
            <Flex
              as="button"
              h="56px"
              w="228px"
              maxW="calc(100% - 36px)"
              px="30px"
              borderRadius="6px"
              bgColor="#7E6148"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              boxShadow="0 8px 18px rgba(80,54,33,0.18)"
              onClick={onContinue}
            >
              <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                繼續
              </Text>
            </Flex>
          </Flex>
        ) : null}
      </Flex>

      {overlay}
    </Flex>
  );
}

type FragmentedDiaryClueStage = "idle" | "hint" | "reward";

function FragmentedDiaryClueOverlay({
  stage,
  headingText = "獲得線索",
  clueText = "安排行程時經過捷運",
  hintContinueLabel = "繼續",
  rewardContinueLabel = "繼續",
  onHintComplete,
  onFinish,
}: {
  stage: FragmentedDiaryClueStage;
  headingText?: string;
  clueText?: string;
  hintContinueLabel?: string;
  rewardContinueLabel?: string;
  onHintComplete?: () => void;
  onFinish: () => void;
}) {
  if (stage === "idle") return null;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={30}
      bgColor="rgba(0,0,0,0.78)"
      alignItems="center"
      justifyContent="center"
      pointerEvents="auto"
      cursor="default"
    >
      {stage === "hint" ? (
        <Flex
          direction="column"
          alignItems="center"
          gap="34px"
          px="30px"
          animation={`${diaryClueHintFade} ${FRAGMENTED_DIARY_CLUE_HINT_DURATION_MS}ms ease both`}
        >
          <Text
            color="white"
            fontSize="22px"
            fontWeight="500"
            lineHeight="1.7"
            letterSpacing="0"
            textAlign="left"
            maxW="250px"
          >
            小日獸會出現在日記
            <br />
            提到的人、事、物
          </Text>
          <Flex
            as="button"
            h="44px"
            minW="142px"
            px="24px"
            borderRadius="999px"
            bgColor="#AD8363"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 12px 24px rgba(0,0,0,0.24)"
            cursor="pointer"
            onClick={(event) => {
              event.stopPropagation();
              onHintComplete?.();
            }}
          >
            <Text color="#FFFFFF" fontSize="16px" fontWeight="700" lineHeight="1">
              {hintContinueLabel}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex
          direction="column"
          alignItems="center"
          gap="18px"
          w="100%"
          px="26px"
          animation={`${diaryClueRewardIn} 460ms cubic-bezier(0.2, 0.82, 0.24, 1) both`}
        >
          <Flex alignItems="center" gap="12px">
            <Flex
              w="48px"
              h="48px"
              borderRadius="7px"
              bgColor="#FFFEFC"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 10px 20px rgba(0,0,0,0.22)"
            >
              <Text color="#8A6A50" fontSize="24px" lineHeight="1">
                <FaPaw />
              </Text>
            </Flex>
            <Text color="white" fontSize="24px" fontWeight="800" lineHeight="1.2">
              {headingText}
            </Text>
          </Flex>
          <Flex
            w="100%"
            maxW="320px"
            minH="78px"
            px="24px"
            py="18px"
            borderRadius="8px"
            bgColor="#AD8363"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 16px 28px rgba(0,0,0,0.28)"
          >
            <Text color="white" fontSize="22px" fontWeight="500" lineHeight="1.35" textAlign="center">
              {clueText}
            </Text>
          </Flex>
          <Flex
            as="button"
            h="44px"
            minW="142px"
            px="24px"
            borderRadius="999px"
            bgColor="#AD8363"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 12px 24px rgba(0,0,0,0.24)"
            cursor="pointer"
            onClick={(event) => {
              event.stopPropagation();
              onFinish();
            }}
          >
            <Text color="#FFFFFF" fontSize="16px" fontWeight="700" lineHeight="1">
              {rewardContinueLabel}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

type ReturnHomeDiaryClueEntry = "entry-bai-5";

const RETURN_HOME_DIARY_CLUE_ITEMS: Record<ReturnHomeDiaryClueEntry, string[]> = {
  "entry-bai-5": ["同事的請託 1", "同事的請託 2", "同事的請託 3"],
};

function ReturnHomeDiaryClueOverlay({
  clueItems,
  onFinish,
}: {
  clueItems: string[] | null;
  onFinish: () => void;
}) {
  if (!clueItems) return null;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={32}
      bgColor="#151515"
      alignItems="center"
      justifyContent="center"
      px="30px"
      cursor="pointer"
      animation={`${diaryClueRewardIn} 380ms cubic-bezier(0.2, 0.82, 0.24, 1) both`}
      onClick={onFinish}
    >
      <Flex direction="column" alignItems="stretch" w="100%" maxW="410px" gap="24px">
        <Flex alignItems="center" justifyContent="center" gap="14px">
          <Flex
            w="44px"
            h="44px"
            borderRadius="6px"
            bgColor="#FFFEFC"
            boxShadow="0 12px 24px rgba(0,0,0,0.22)"
          />
          <Text color="#FFFFFF" fontSize="22px" fontWeight="500" lineHeight="1">
            獲得線索
          </Text>
        </Flex>
        <Flex direction="column" gap="22px">
          {clueItems.map((clueText) => (
            <Flex
              key={clueText}
              as="button"
              w="100%"
              minH="70px"
              px="24px"
              py="16px"
              borderRadius="8px"
              bgColor="#AD8363"
              alignItems="center"
              justifyContent="flex-start"
              boxShadow="0 16px 28px rgba(0,0,0,0.28)"
              cursor="pointer"
              onClick={(event) => {
                event.stopPropagation();
                onFinish();
              }}
            >
              <Text color="#FFFFFF" fontSize="18px" fontWeight="400" lineHeight="1.35" textAlign="left">
                {clueText}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}

const STICKER_META: Record<StickerId, { title: string; subtitle: string; image: string }> = {
  "naotaro-basic": {
    title: "直太郎貼紙",
    subtitle: "元氣基本款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
  "naotaro-smile": {
    title: "直太郎貼紙",
    subtitle: "開心笑臉款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
  "naotaro-rare": {
    title: "直太郎貼紙",
    subtitle: "閃亮稀有款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
};

type DiaryReadTalkLine = {
  speaker: "小麥" | "小貝狗" | "旁白";
  text: string;
  spriteId?: "mai" | "beigo";
  frameIndex?: number;
  showName?: boolean;
};

const BAI_ENTRY_1_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "這是⋯⋯！", spriteId: "mai", frameIndex: 34 },
  { speaker: "小麥", text: "本來消失的日記內容⋯⋯浮現了！", spriteId: "mai", frameIndex: 34 },
  { speaker: "小麥", text: "小白今天和朋友約練團，睡過頭後一路衝去趕捷運⋯⋯", spriteId: "mai", frameIndex: 18 },
  { speaker: "小麥", text: "原來大家都在看她，是因為吉他的袋子夾在車門上。", spriteId: "mai", frameIndex: 18 },
  { speaker: "小麥", text: "這真的好像剛剛那隻傻乎乎的黃金獵犬，也很像小白。", spriteId: "mai", frameIndex: 18 },
  { speaker: "旁白", text: "小貝狗拍打著日記本上的黃金獵犬，口裡重複著「小日獸」這個詞。", showName: false },
  { speaker: "小貝狗", text: "小日獸！小日獸！", spriteId: "beigo", frameIndex: 0, showName: true },
  { speaker: "小麥", text: "小日獸⋯⋯是指這隻被吸進去日記本的黃金獵犬嗎？", spriteId: "mai", frameIndex: 36 },
  { speaker: "旁白", text: "小麥看了看日記本剩下空白的頁面，終於恍然大悟。", showName: false },
  { speaker: "小麥", text: "難不成⋯⋯日記本會變成一片空白，是因為上面的「小日獸」跑了出來？", spriteId: "mai", frameIndex: 38 },
  { speaker: "小麥", text: "小白的異狀，一定跟這本日記本有關吧。", spriteId: "mai", frameIndex: 38 },
  { speaker: "小麥", text: "那只要將這些日記片段搜集回來，小白就會醒來了⋯⋯？", spriteId: "mai", frameIndex: 8 },
  { speaker: "小貝狗", text: "嗷～～嗷！嗷嗷！", spriteId: "beigo", frameIndex: 1 },
];

const NEXT_DIARY_CATALOG_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "第二篇日記出現了。", spriteId: "mai", frameIndex: 34 },
];

const INCOMPLETE_DIARY_REACTION_LINE: DiaryReadTalkLine = {
  speaker: "小麥",
  text: "但是一樣是不完整的。",
  spriteId: "mai",
  frameIndex: 36,
};

const FRAGMENTED_DIARY_INTRO_TALK_LINES: DiaryReadTalkLine[] = [
  {
    speaker: "小麥",
    text: "日記只剩這一篇，文字還亂成一團",
    spriteId: "mai",
    frameIndex: 36,
  },
];

function DiaryReactionOverlay({
  line,
  onContinue,
  continueLabel = "點擊繼續",
}: {
  line: DiaryReadTalkLine;
  onContinue: () => void;
  continueLabel?: string;
}) {
  const shouldShowAvatar = Boolean(line.spriteId);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={20}
      direction="column"
      justifyContent="flex-end"
      pointerEvents="none"
      onClick={onContinue}
    >
      {shouldShowAvatar ? (
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          zIndex={6}
          pointerEvents="none"
        >
          <EventAvatarSprite spriteId={line.spriteId!} frameIndex={line.frameIndex ?? 0} />
        </Flex>
      ) : null}
      <EventDialogPanel
        w="100%"
        borderRadius="0"
        overflow="hidden"
        pointerEvents="auto"
        cursor="pointer"
        onClick={onContinue}
      >
        {line.showName === false ? null : (
          <Text color="white" fontWeight="700">
            {line.speaker}
          </Text>
        )}
        <Flex flex="1" minH="0" direction="column" justifyContent="center">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {line.text}
          </Text>
        </Flex>
        <EventContinueAction label={continueLabel} onClick={onContinue} />
      </EventDialogPanel>
    </Flex>
  );
}

const BAI_ENTRY_2_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "噗……這真的很像小白會做的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "以為飲料是我買的，就在搬家公司員工面前全部喝掉，還一臉自然。", spriteId: "mai", frameIndex: 2 },
  { speaker: "小麥", text: "結果那其實是搬家工人買給自己的飲料……她一定尷尬到只想原地消失吧。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "小白總是這樣，每次都少一根筋，鬧出一堆尷尬事。", spriteId: "mai", frameIndex: 3 },
];

const BAI_ENTRY_5_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "小白以前就是這樣，只要有值得慶祝的事，第一個就會跑來問我要吃什麼。", spriteId: "mai", frameIndex: 8 },
  { speaker: "小麥", text: "雖然常常說得很像她自己很會安排，其實最後都還是要我幫她決定。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "可是看到這種片段，反而覺得……能一起煩惱晚餐的日子好像很珍貴。", spriteId: "mai", frameIndex: 5 },
];

const BAI_ENTRY_3_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "早上還醒著的時候，我真的都會先以為她又熬夜了。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "原來她壓力大的時候，會跑去早餐店畫畫啊……", spriteId: "mai", frameIndex: 36 },
  { speaker: "小麥", text: "下午的下落也許能從早餐店問到。明天去看看吧。", spriteId: "mai", frameIndex: 38 },
];

const BAI_ENTRY_1_BODY_LINES = [
  "今天和朋友約練團，有點睡過頭，眼看捷運快要開走，趕緊跑下樓梯。",
  "好不容易趕上去，一上車發現大家都在看我!",
  "是我腳步太大聲嚇到大家嗎？",
  "緩過神來，原來是因為我吉他的袋子夾在門上，好險沒有夾得很嚴重，在一下站的時候解救了",
  "忍不住在車上大笑起來",
] as const;

const BAI_ENTRY_2_BODY_LINES = [
  ...BAI_ENTRY_2_COMPLETE_TEXTS,
];

const BAI_ENTRY_5_BODY_LINES = [
  ...BAI_ENTRY_5_COMPLETE_TEXTS,
];

const BAI_ENTRY_3_BODY_LINES = [
  "小麥看到我早上還醒著，就會問我是不是還沒睡覺，跟我早睡不是早上才睡。",
  "但今天才不是這樣呢，像今天壓力很大又想一個人專心的時候，就會去早餐店畫畫。然後到了下午就 ....",
] as const;

type SunbeastCollectionState = "discovered" | "hint" | "unknown";
type SunbeastView =
  | "collection"
  | "detail-naotaro"
  | "detail-frog"
  | "detail-chicken"
  | "detail-generic"
  | "detail-unknown";
type SunbeastDetailRevealStep =
  | "idle"
  | "dialog"
  | "unlock-intro"
  | "unlock-diary"
  | "unlock-street"
  | "unlock-clues"
  | "unlock-outro"
  | "complete";
type FragmentedDiaryStage = "enter" | "first" | "second" | "ready";
type MetroFragmentCompletionStage = "idle" | "settle" | "beigo" | "mai" | "rhythm" | "resolved";

function getFrogFragmentedDiarySceneJumpStepId({
  firstPhotoDiaryStage,
  fragmentedDiaryStage,
  frogFragmentIntroStage,
  isFrogCompleteDiaryRevealMode,
}: {
  firstPhotoDiaryStage: "idle" | "photo-slide";
  fragmentedDiaryStage: FragmentedDiaryStage;
  frogFragmentIntroStage: "photo" | "updated" | "diary";
  isFrogCompleteDiaryRevealMode: boolean;
}) {
  if (frogFragmentIntroStage === "photo" && firstPhotoDiaryStage === "photo-slide") {
    return "diary-photo-slide";
  }
  if (frogFragmentIntroStage === "photo") {
    return isFrogCompleteDiaryRevealMode ? "frog-diary-collected" : "frog-match-progress";
  }
  if (frogFragmentIntroStage === "updated") return "diary-fragment-updated";
  if (isFrogCompleteDiaryRevealMode && fragmentedDiaryStage === "enter") {
    return "frog-diary-collected";
  }
  if (fragmentedDiaryStage === "first") return "diary-fragment-first";
  if (fragmentedDiaryStage === "second") return "diary-fragment-second";
  if (fragmentedDiaryStage === "ready") return "diary-fragment-ready";
  return "diary-fragment-enter";
}

type SunbeastCollectionCard = {
  id: string;
  name: string;
  state: SunbeastCollectionState;
  imagePath?: string;
  sunbeastId?: SunbeastId;
  isClickable?: boolean;
};
type GuidedSunbeastHintId = "frog" | "chicken";

const SUNBEAST_FILTERS = [
  { id: "all", label: "全部" },
  { id: "discovered", label: "已發現" },
  { id: "hint", label: "有線索" },
  { id: "unknown", label: "未知" },
] as const;

const FROG_IMAGE_PATH = "/images/animals/青蛙.png";
const FROG_SHADOW_IMAGE_PATH = "/images/animals/青蛙_剪影.png";
const KOALA_IMAGE_PATH = "/images/animals/放視大賞 5/無尾熊替身.png";
const ROOSTER_IMAGE_PATH = "/images/animals/公雞.png";
const ROOSTER_SHADOW_IMAGE_PATH = "/images/animals/公雞_剪影.png";

type SunbeastFilterId = (typeof SUNBEAST_FILTERS)[number]["id"];

function getFrogDiaryPhotoAttemptCount(progress: PlayerProgress | null) {
  return Math.max(0, Math.min(3, progress?.streetForgotLunchFrogPhotoAttemptCount ?? 0));
}

function hasFrogDiaryLead(progress: PlayerProgress | null) {
  return Boolean(
    progress?.hasCompletedStreetForgotLunchFrogEvent ||
      progress?.hasUnlockedSunbeastFrogHint ||
      progress?.hasPendingFrogDiaryFragmentHubGuide ||
      progress?.hasPendingFrogDiarySleepGuide ||
      getFrogDiaryPhotoAttemptCount(progress) > 0,
  );
}

function buildSunbeastCollectionCards(progress: PlayerProgress | null): SunbeastCollectionCard[] {
  const hasNaotaro = Boolean(progress?.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-")));
  const hasFrog = Boolean(progress?.hasCompletedStreetForgotLunchFrogEvent);
  const frogPhotoAttemptCount = getFrogDiaryPhotoAttemptCount(progress);
  const hasFrogHint = ENABLE_SUNBEAST_HINT_SYSTEM && hasFrogDiaryLead(progress);
  const hasKoala = Boolean(progress?.hasTriggeredOfficeSunbeastKoalaEvent);
  const hasChicken = Boolean(progress?.hasTriggeredOfficeSunbeastChickenEvent);
  const hasChickenHint =
    ENABLE_SUNBEAST_HINT_SYSTEM &&
    (Boolean(progress?.hasUnlockedSunbeastChickenHint) || Boolean(progress?.hasUnlockedSpecialMap));
  const hasCat = Boolean(progress?.hasTriggeredBusSunbeastCatEvent);
  return [
    {
      id: "naotaro",
      name: hasNaotaro ? "直太郎" : "???",
      state: hasNaotaro ? "discovered" : "unknown",
      imagePath: hasNaotaro ? SUNBEAST_REGISTRY.naotaro.imagePath : undefined,
      sunbeastId: "naotaro",
      isClickable: true,
    },
    {
      id: "frog",
      name: hasFrog || hasFrogHint ? FROG_SUNBEAST_NAME : "???",
      state: hasFrog ? "discovered" : hasFrogHint ? "hint" : "unknown",
      imagePath: hasFrog ? FROG_IMAGE_PATH : hasFrogHint && frogPhotoAttemptCount > 0 ? FROG_SHADOW_IMAGE_PATH : undefined,
      sunbeastId: "frog",
      isClickable: hasFrog || (ENABLE_SUNBEAST_HINT_SYSTEM && hasFrogHint),
    },
    {
      id: "koala",
      name: hasKoala ? "無尾熊" : "???",
      state: hasKoala ? "discovered" : "unknown",
      imagePath: hasKoala ? KOALA_IMAGE_PATH : undefined,
      sunbeastId: "koala",
      isClickable: hasKoala,
    },
    {
      id: "chicken",
      name: hasChicken ? "公雞" : "???",
      state: hasChicken ? "discovered" : hasChickenHint ? "hint" : "unknown",
      imagePath: hasChicken ? ROOSTER_IMAGE_PATH : hasChickenHint ? ROOSTER_SHADOW_IMAGE_PATH : undefined,
      sunbeastId: "chicken",
      isClickable: hasChicken || (ENABLE_SUNBEAST_HINT_SYSTEM && hasChickenHint),
    },
    {
      id: "cat",
      name: hasCat ? "貓" : "???",
      state: hasCat ? "discovered" : "unknown",
      imagePath: hasCat ? SUNBEAST_REGISTRY.cat.imagePath : undefined,
      sunbeastId: "cat",
      isClickable: hasCat,
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `unknown-${index + 1}`,
      name: "???",
      state: "unknown" as const,
      isClickable: false,
    })),
  ];
}

function getSunbeastDetailView(card: SunbeastCollectionCard): SunbeastView {
  if (card.id === "naotaro" && card.state === "discovered") return "detail-naotaro";
  if (card.id === "frog" && card.state === "discovered") return "detail-frog";
  if (card.id === "chicken" && card.state === "discovered") return "detail-chicken";
  if (card.sunbeastId && card.state === "discovered") return "detail-generic";
  return "detail-unknown";
}

function getInitialSunbeastView(cardId: string | null): SunbeastView {
  if (cardId === "naotaro") return "detail-naotaro";
  if (cardId === "frog") return "detail-frog";
  if (cardId === "chicken") return "detail-chicken";
  if (cardId && isSunbeastId(cardId)) return "detail-generic";
  return "collection";
}

function getPhotoRevealSunbeastId(params: {
  mode: DiaryOverlayMode;
  initialSunbeastCardId: string | null;
}): SunbeastId {
  if (params.mode === "sunbeast-chicken-reveal") return "chicken";
  if (params.mode === "sunbeast-koala-reveal") return "koala";
  if (params.mode === "sunbeast-cat-reveal") return "cat";
  if (params.mode === "second-photo-diary-reveal" || params.mode === "frog-fragmented-diary") return "frog";
  if (params.initialSunbeastCardId && isSunbeastId(params.initialSunbeastCardId)) {
    return params.initialSunbeastCardId;
  }
  return "naotaro";
}

const FROG_PHOTO_REVIEW_LABELS = ["便利商店", "街道", "餐廳"] as const;
const FROG_DISCOVERY_PHOTO_CARDS = [
  {
    label: FROG_PHOTO_REVIEW_LABELS[0],
    imagePath: "/images/428出圖/日常事件漫畫格/商店_飲料出餐.png",
    left: "32px",
    top: "46px",
    rotate: "-5deg",
    enterRotate: "-13deg",
    settleRotate: "-2deg",
    delay: "60ms",
    frogLeft: "53%",
    frogTop: "58%",
    frogWidth: "76px",
  },
  {
    label: FROG_PHOTO_REVIEW_LABELS[1],
    imagePath: "/images/428出圖/日常事件漫畫格/街道_推銷.png",
    right: "30px",
    top: "58px",
    rotate: "5deg",
    enterRotate: "13deg",
    settleRotate: "2deg",
    delay: "180ms",
    frogLeft: "58%",
    frogTop: "58%",
    frogWidth: "74px",
  },
  {
    label: FROG_PHOTO_REVIEW_LABELS[2],
    imagePath: "/images/428出圖/日常事件漫畫格/早餐店_內用出餐.png",
    left: "46px",
    top: "278px",
    rotate: "4deg",
    enterRotate: "12deg",
    settleRotate: "1deg",
    delay: "300ms",
    frogLeft: "56%",
    frogTop: "57%",
    frogWidth: "78px",
  },
] as const;

const SUNBEAST_HINT_DETAIL_CONTENT: Record<string, { imagePath: string }> = {
  frog: {
    imagePath: FROG_SHADOW_IMAGE_PATH,
  },
  chicken: {
    imagePath: ROOSTER_SHADOW_IMAGE_PATH,
  },
};

const SUNBEAST_HINT_PLACE_ICON_PATHS: Record<string, string> = {
  街道: "/images/icon/street.png",
  便利商店: "/images/icon/mart.png",
  餐廳: "/images/icon/breakfast.png",
  轉角的公車: "/images/icon/road.png",
};

type SunbeastDetailInfoKind = "journal" | "place" | "clue";

const MAI_THINKING_FRAME_INDICES = {
  thinking1: 36,
  thinking2: 37,
} as const;
type MaiThinkingFrameIndex =
  (typeof MAI_THINKING_FRAME_INDICES)[keyof typeof MAI_THINKING_FRAME_INDICES];

const SUNBEAST_DETAIL_INFO = [
  {
    kind: "journal",
    eyebrow: "相關的日記",
    body: "趕捷運時的小插曲，慌張又困惑的樣子似乎跟直太郎很像。",
    action: "閱讀",
  },
  {
    kind: "place",
    eyebrow: "新的地點",
    body: "街道，是直太郎很喜歡在街道散步。下次安排經過吧！",
    action: "查看",
  },
  {
    kind: "clue",
    eyebrow: "小日獸行蹤",
    body: FROG_ACTIVE_CLUE_TEXT,
    action: "查看",
  },
] as const satisfies Array<{
  kind: SunbeastDetailInfoKind;
  eyebrow: string;
  body: string;
  action: string;
}>;

function SunbeastInfoIcon({ kind }: { kind: SunbeastDetailInfoKind }) {
  if (kind === "journal") return <FaBook />;
  if (kind === "place") return <FaLocationDot />;
  return <FaPaw />;
}

function PhotoDiarySlidePage({
  photoImagePath,
  photoRevealName,
}: {
  photoImagePath: string;
  photoRevealName: string;
}) {
  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      overflow="hidden"
      bgColor="#977458"
      backgroundImage="url('/images/pattern/gz.svg')"
      backgroundRepeat="repeat"
      backgroundSize="86px 86px"
      alignItems="center"
      justifyContent="center"
    >
      <Flex position="absolute" inset="0" bgColor="rgba(93,64,40,0.12)" pointerEvents="none" />
      <Flex
        w="150px"
        h="184px"
        borderRadius="4px"
        bgColor="#FFFDF9"
        border="1px solid rgba(180,164,142,0.55)"
        boxShadow="0 18px 32px rgba(64,44,24,0.2)"
        p="9px 9px 28px"
        direction="column"
        gap="8px"
        position="relative"
        animation={`${firstPhotoSlideAcross} 1.25s ease-in-out both`}
      >
        <Flex
          position="absolute"
          top="-7px"
          left="50%"
          transform="translateX(-50%) rotate(2deg)"
          w="62px"
          h="14px"
          bgColor="#E7D7C4"
          opacity={0.95}
        />
        <Flex
          flex="1"
          minH="0"
          borderRadius="3px"
          overflow="hidden"
          bgColor="#DDD2C6"
          backgroundImage={`url(${photoImagePath})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        />
        <Flex direction="column" alignItems="center" gap="4px">
          <Text color="#9D7859" fontSize="13px" fontWeight="700" lineHeight="1">
            {photoRevealName}
          </Text>
          <Text color="#F2C84B" fontSize="16px" lineHeight="1">
            ★ ★ ★
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function SunbeastPhotoSlots({
  captures,
  requirement,
  fallbackImagePath,
  label,
  compact = false,
}: {
  captures: readonly PhotoCaptureSnapshot[];
  requirement: number;
  fallbackImagePath: string;
  label: string;
  compact?: boolean;
}) {
  const safeRequirement = Math.max(1, requirement);
  const visibleCaptures =
    captures.length > 0
      ? captures.slice(0, safeRequirement)
      : fallbackImagePath
        ? [{
            sourceImage: fallbackImagePath,
            previewImage: fallbackImagePath,
            dogCoveragePercent: 0,
            cameraFrameRect: { x: 0, y: 0, width: 1, height: 1 },
            capturedRect: { x: 0, y: 0, width: 1, height: 1 },
            capturedAt: "",
          } satisfies PhotoCaptureSnapshot]
        : [];
  const slotCount = Math.max(safeRequirement, visibleCaptures.length);

  return (
    <Flex
      w="100%"
      justifyContent="center"
      alignItems="center"
      gap={compact ? "8px" : "12px"}
      wrap="wrap"
    >
      {Array.from({ length: slotCount }, (_, index) => {
        const capture = visibleCaptures[index] ?? null;
        const isMissing = !capture || (captures.length === 0 && index > 0);
        return (
          <Flex
            key={`${label}-photo-slot-${index}`}
            direction="column"
            alignItems="center"
            gap={compact ? "5px" : "7px"}
            w={compact ? "94px" : "128px"}
            h={compact ? "126px" : "164px"}
            borderRadius="4px"
            bgColor={isMissing ? "rgba(255,253,249,0.64)" : "#FFFDF9"}
            border={isMissing ? "2px dashed rgba(255,255,255,0.72)" : "1px solid rgba(180,164,142,0.55)"}
            p={compact ? "7px 7px 14px" : "9px 9px 20px"}
            boxShadow={isMissing ? "none" : "0 10px 18px rgba(88,59,33,0.18)"}
            position="relative"
            transform={index % 2 === 0 ? "rotate(-3deg)" : "rotate(3deg)"}
          >
            {!isMissing ? (
              <Flex
                position="absolute"
                top="-7px"
                left="50%"
                transform={`translateX(-50%) rotate(${index % 2 === 0 ? "-2deg" : "3deg"})`}
                w={compact ? "50px" : "62px"}
                h={compact ? "11px" : "14px"}
                bgColor="#E7D7C4"
                opacity={0.95}
              />
            ) : null}
            <Flex
              w="100%"
              flex="1"
              minH="0"
              borderRadius="3px"
              overflow="hidden"
              bgColor={isMissing ? "rgba(126,97,72,0.22)" : "#DDD2C6"}
              backgroundImage={capture && !isMissing ? `url(${capture.previewImage})` : undefined}
              backgroundSize="cover"
              backgroundPosition="center"
              backgroundRepeat="no-repeat"
              alignItems="center"
              justifyContent="center"
            >
              {isMissing ? (
                <Text color="rgba(255,255,255,0.9)" fontSize={compact ? "22px" : "28px"} fontWeight="800" lineHeight="1">
                  ?
                </Text>
              ) : null}
            </Flex>
            <Text color={isMissing ? "#FFFDF9" : "#9D7859"} fontSize={compact ? "11px" : "13px"} fontWeight="800" lineHeight="1">
              {isMissing ? `缺 ${index + 1}` : label}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

const FROG_FRAGMENT_INTRO_TALK_LINES = [
  {
    speaker: "小麥",
    text: "青蛙這隻小日獸……還沒有被收集起來。",
    spriteId: "mai",
    frameIndex: 36,
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！照片只是讓牠在日記裡留下剪影。",
    spriteId: "beigo",
    frameIndex: 2,
  },
  {
    speaker: "小麥",
    text: "那來看看這篇日記吧。",
    spriteId: "mai",
    frameIndex: 18,
  },
] as const;

function FrogCaptureMatchMeter({
  percent,
  previousPercent = 0,
  animate = true,
  animationKey,
  animationDelayMs = 0,
}: {
  percent: number;
  previousPercent?: number;
  animate?: boolean;
  animationKey?: string;
  animationDelayMs?: number;
}) {
  const normalizedPercent = Math.max(0, Math.min(100, percent));
  const normalizedPreviousPercent = Math.max(0, Math.min(normalizedPercent, previousPercent));
  const shouldAnimate = animate && normalizedPercent > normalizedPreviousPercent;

  return (
    <Flex
      role="progressbar"
      aria-label={`青蛙符合度 ${Math.round(normalizedPercent)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedPercent)}
      w="176px"
      maxW="100%"
      h="16px"
      border="2px solid #8B6D54"
      borderRadius="999px"
      overflow="hidden"
      bgColor="rgba(139,109,84,0.16)"
      boxShadow="inset 0 1px 2px rgba(126,97,72,0.18)"
    >
      <Flex
        key={animationKey}
        w={`${normalizedPercent}%`}
        h="100%"
        bgColor="#C9A15E"
        backgroundImage="repeating-linear-gradient(135deg, rgba(255,255,255,0.34) 0 6px, rgba(255,255,255,0) 6px 12px)"
        boxShadow="inset 0 -1px 0 rgba(126,97,72,0.22)"
        animation={
          shouldAnimate
            ? `${frogCaptureMeterFillAdvance} 760ms ease-out ${animationDelayMs}ms both`
            : undefined
        }
        css={{
          "--frog-meter-start-width": `${normalizedPreviousPercent}%`,
          "--frog-meter-end-width": `${normalizedPercent}%`,
        }}
      />
    </Flex>
  );
}

function FrogFragmentPhotoIntroPage({
  photoImagePath,
  photoImagePaths = [photoImagePath],
  photoAttemptCount = 1,
  isResolved = false,
  variant = "photo",
  ctaLabel,
  onNext,
}: {
  photoImagePath: string;
  photoImagePaths?: readonly string[];
  photoAttemptCount?: number;
  isResolved?: boolean;
  variant?: "photo" | "updated";
  ctaLabel?: string;
  onNext: () => void;
}) {
  const isUpdatedStage = variant === "updated";
  const creatureLabel = isResolved ? FROG_SUNBEAST_NAME : isUpdatedStage ? "呱？" : "呱呱？";
  const safePhotoAttemptCount = Math.max(1, Math.min(3, Math.floor(photoAttemptCount)));
  const previousFrogCaptureMatchPercent = ((safePhotoAttemptCount - 1) / 3) * 100;
  const frogCaptureMatchPercent = (safePhotoAttemptCount / 3) * 100;
  const frogCaptureMeterKey = `frog-meter-${safePhotoAttemptCount}-${variant}`;
  const shouldPlayPhotoProgressFx = !isResolved && !isUpdatedStage;
  const frogProgressLightDelayMs = 960;
  const frogCaptureMeterDelayMs = shouldPlayPhotoProgressFx ? 1440 : 0;
  const frogCtaDelayMs = shouldPlayPhotoProgressFx ? 2140 : 0;
  const effectiveCtaLabel = ctaLabel ?? (isUpdatedStage ? "日記更新了" : "下一步");
  const [introTalkIndex, setIntroTalkIndex] = useState<number | null>(null);
  const introTalkLine =
    introTalkIndex === null ? null : FROG_FRAGMENT_INTRO_TALK_LINES[introTalkIndex] ?? null;
  const resolvedPhotoCards = [
    {
      id: "first",
      imagePath: photoImagePaths[0] ?? photoImagePath,
      left: "-66px",
      top: "82px",
      rotate: "-7deg",
      enterX: "-210px",
      enterY: "16px",
      enterRotate: "-14deg",
      settleX: "10px",
      settleRotate: "-4deg",
      delay: "90ms",
      opacity: "0.9",
      zIndex: 1,
      width: "148px",
      height: "176px",
      imageHeight: "112px",
      tapeRotate: "-3deg",
    },
    {
      id: "second",
      imagePath: photoImagePaths[1] ?? photoImagePaths[0] ?? photoImagePath,
      right: "-66px",
      top: "82px",
      rotate: "7deg",
      enterX: "210px",
      enterY: "16px",
      enterRotate: "14deg",
      settleX: "-10px",
      settleRotate: "4deg",
      delay: "300ms",
      opacity: "0.9",
      zIndex: 2,
      width: "148px",
      height: "176px",
      imageHeight: "112px",
      tapeRotate: "4deg",
    },
    {
      id: "latest",
      imagePath: photoImagePaths[2] ?? photoImagePaths[1] ?? photoImagePath,
      left: "calc(50% - 82px)",
      top: "94px",
      rotate: "5deg",
      enterX: "-260px",
      enterY: "8px",
      enterRotate: "-8deg",
      settleX: "14px",
      settleRotate: "7deg",
      delay: "540ms",
      opacity: "1",
      zIndex: 3,
      width: "164px",
      height: "198px",
      imageHeight: "128px",
      tapeRotate: "-2deg",
    },
  ] as const;

  useEffect(() => {
    setIntroTalkIndex(null);
  }, [isResolved, photoImagePath]);

  const advanceIntroTalk = () => {
    if (introTalkIndex === null) return;
    if (introTalkIndex < FROG_FRAGMENT_INTRO_TALK_LINES.length - 1) {
      setIntroTalkIndex((current) => (current === null ? null : current + 1));
      return;
    }
    setIntroTalkIndex(null);
  };

  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      direction="column"
      overflow="hidden"
      bgColor="#F6F0E4"
    >
      <Flex
        position="absolute"
        inset="0"
        opacity={0.64}
        bgImage={[
          "radial-gradient(circle at 28px 24px, rgba(151,116,88,0.28) 0 4px, transparent 5px)",
          "radial-gradient(circle at 104px 66px, rgba(151,116,88,0.22) 0 3px, transparent 4px)",
          "radial-gradient(circle at 172px 38px, rgba(151,116,88,0.24) 0 3px, transparent 4px)",
        ].join(",")}
        bgSize="164px 164px"
        pointerEvents="none"
      />

      {shouldPlayPhotoProgressFx ? (
        <Flex
          aria-hidden="true"
          position="absolute"
          left="50%"
          top="73%"
          w="72px"
          h="18px"
          zIndex={4}
          pointerEvents="none"
          opacity={0}
          borderRadius="999px"
          bgImage="linear-gradient(90deg, rgba(255,242,179,0), rgba(255,242,179,0.94), rgba(255,255,255,0.72), rgba(255,242,179,0))"
          boxShadow="0 0 14px rgba(255,231,151,0.68), 0 8px 18px rgba(89,58,34,0.12)"
          animation={`${frogPhotoProgressLightTrail} 620ms cubic-bezier(0.34, 0.04, 0.18, 1) ${frogProgressLightDelayMs}ms both`}
        />
      ) : null}

      <Flex
        position="relative"
        zIndex={1}
        flex="0 0 45%"
        minH="280px"
        maxH="390px"
        overflow="hidden"
        bgColor="#FFFDF9"
      >
        <Flex
          position="absolute"
          left="18px"
          top="26px"
          bottom="-28px"
          w="92%"
          opacity={0.86}
          pointerEvents="none"
        >
          <img
            src="/images/diary/diary_bg.png"
            alt=""
            style={{
              width: "108%",
              height: "112%",
              objectFit: "fill",
              objectPosition: "left top",
              transform: "rotate(-4deg) translate(-8px, 0)",
              transformOrigin: "top left",
            }}
          />
        </Flex>

        <Flex
          position="relative"
          zIndex={2}
          direction="column"
          w="100%"
          h="100%"
          px="42px"
          pt="62px"
          pb="24px"
        >
          {isResolved ? (
            <Flex
              alignSelf="flex-end"
              border="2px solid #8B6D54"
              px="16px"
              py="7px"
              bgColor="rgba(255,255,255,0.88)"
            >
              <Text color="#8B6D54" fontSize="20px" fontWeight="700" lineHeight="1">
                {creatureLabel}
              </Text>
            </Flex>
          ) : null}
          <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt="4px">
            <Flex position="relative" w="190px" maxW="74%" h="190px" alignItems="center" justifyContent="center">
              <Flex
                position="absolute"
                inset="0"
                alignItems="center"
                justifyContent="center"
                animation={isResolved ? `${frogShadowResolveOut} 980ms ease both` : undefined}
              >
                <img
                  src={FROG_SHADOW_IMAGE_PATH}
                  alt={isResolved ? "" : "青蛙剪影"}
                  aria-hidden={isResolved ? true : undefined}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                    filter: "brightness(0) saturate(100%) invert(45%) sepia(24%) saturate(739%) hue-rotate(350deg) brightness(85%) contrast(86%)",
                  }}
                />
              </Flex>
              {isResolved ? (
                <Flex
                  position="absolute"
                  inset="0"
                  alignItems="center"
                  justifyContent="center"
                  animation={`${frogResolvedRevealIn} 980ms ease both`}
                >
                  <img
                    src={FROG_IMAGE_PATH}
                    alt={FROG_SUNBEAST_NAME}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </Flex>
              ) : null}
            </Flex>
          </Flex>
          <Flex justifyContent="center">
            {isResolved ? (
              <Text color="#977458" fontSize="15px" fontWeight="500" lineHeight="1.35" textAlign="center">
                {creatureLabel}
              </Text>
            ) : (
              <FrogCaptureMatchMeter
                percent={frogCaptureMatchPercent}
                previousPercent={previousFrogCaptureMatchPercent}
                animate={!isUpdatedStage}
                animationKey={frogCaptureMeterKey}
                animationDelayMs={frogCaptureMeterDelayMs}
              />
            )}
          </Flex>
        </Flex>
      </Flex>

      <Flex
        position="relative"
        zIndex={1}
        flex="1"
        minH="0"
        bgColor="#977458"
        backgroundImage="url('/images/pattern/gz.svg')"
        backgroundRepeat="repeat"
        backgroundSize="84px 84px"
        backgroundPosition="top left"
        borderTop="8px solid #BD9A7E"
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap="18px"
        px="28px"
        pt="34px"
        pb="112px"
        overflow="hidden"
      >
        {!isResolved && !isUpdatedStage ? (
          <Text
            color="#FFFDF9"
            fontSize="20px"
            fontWeight="800"
            lineHeight="1.35"
            textAlign="center"
            textShadow="0 2px 8px rgba(70,45,28,0.22)"
            animation={`${revealStageIn} 260ms ease both`}
          >
            看著工讀生慌忙地撿傳單，青蛙也在旁邊跳來跳去
          </Text>
        ) : null}

        {isUpdatedStage ? (
          <Flex
            w="244px"
            h="112px"
            borderRadius="5px"
            bgColor="#F8EECF"
            boxShadow="0 0 18px rgba(248,238,207,0.5), inset 0 0 0 1px rgba(255,255,255,0.56)"
            animation={`${revealStageIn} 320ms ease both`}
          />
        ) : isResolved ? (
          resolvedPhotoCards.map((card) => (
            <Flex
              key={card.id}
              bgColor="#FFFDF9"
              borderRadius="4px"
              p={card.id === "latest" ? "9px 9px 24px" : "8px 8px 20px"}
              boxShadow={
                card.id === "latest"
                  ? "0 12px 22px rgba(88,59,33,0.22)"
                  : "0 8px 16px rgba(88,59,33,0.16)"
              }
              w={card.width}
              h={card.height}
              position="absolute"
              left={"left" in card ? card.left : undefined}
              right={"right" in card ? card.right : undefined}
              top={card.top}
              overflow="visible"
              zIndex={card.zIndex}
              animation={`${frogPhotoStackSlideIn} 0.78s cubic-bezier(0.19, 0.84, 0.24, 1) ${card.delay} both`}
              transformOrigin="50% 100%"
              css={{
                "--frog-stack-enter-x": card.enterX,
                "--frog-stack-enter-y": card.enterY,
                "--frog-stack-enter-rotate": card.enterRotate,
                "--frog-stack-settle-x": card.settleX,
                "--frog-stack-settle-rotate": card.settleRotate,
                "--frog-stack-rotate": card.rotate,
                "--frog-stack-opacity": card.opacity,
              }}
            >
              <Flex
                position="absolute"
                top="-7px"
                left="50%"
                transform={`translateX(-50%) rotate(${card.tapeRotate})`}
                w={card.id === "latest" ? "64px" : "62px"}
                h="14px"
                bgColor="#E7D7C4"
                opacity={0.95}
              />
              <Flex direction="column" gap={card.id === "latest" ? "8px" : "7px"} w="100%" h="100%">
                <Flex
                  w="100%"
                  h={card.imageHeight}
                  borderRadius="3px"
                  overflow="hidden"
                  bgColor="#DDD2C6"
                  backgroundImage={`url(${card.imagePath})`}
                  backgroundSize="cover"
                  backgroundPosition="center"
                  backgroundRepeat="no-repeat"
                />
                <Flex direction="column" alignItems="center" gap={card.id === "latest" ? "5px" : "4px"}>
                  <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                    呱
                  </Text>
                  <Text color="#F2C84B" fontSize={card.id === "latest" ? "18px" : "16px"} lineHeight="1">
                    ★ ★ ★
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ))
        ) : (
          <Flex
            bgColor="#FFFDF9"
            borderRadius="4px"
            p="9px 9px 24px"
            boxShadow="0 10px 18px rgba(88,59,33,0.2)"
            w="164px"
            h="198px"
            position="relative"
            overflow="visible"
            flexShrink={0}
            animation={`${frogDiscoveryPhotoSlideIn} 720ms cubic-bezier(0.19, 0.84, 0.24, 1) both`}
            transformOrigin="50% 100%"
            css={{
              "--frog-photo-enter-rotate": "-6deg",
              "--frog-photo-settle-rotate": "8deg",
              "--frog-photo-rotate": "5deg",
            }}
          >
            {shouldPlayPhotoProgressFx ? (
              <Flex
                aria-hidden="true"
                position="absolute"
                inset="-10px"
                zIndex={1}
                pointerEvents="none"
                borderRadius="10px"
                bgImage="radial-gradient(circle at 50% 34%, rgba(255,248,210,0.86) 0 16%, rgba(255,229,146,0.26) 35%, rgba(255,229,146,0) 68%)"
                boxShadow="0 0 24px rgba(255,233,160,0.46)"
                opacity={0}
                animation={`${frogPhotoChargeGlow} 560ms ease-out 620ms both`}
              />
            ) : null}
            <Flex
              position="absolute"
              top="-7px"
              left="50%"
              transform="translateX(-50%) rotate(-2deg)"
              w="64px"
              h="14px"
              bgColor="#E7D7C4"
              opacity={0.95}
            />
            <Flex direction="column" gap="8px" w="100%" h="100%">
              <Flex
                w="100%"
                h="128px"
                borderRadius="3px"
                overflow="hidden"
                bgColor="#DDD2C6"
                backgroundImage={`url(${photoImagePath})`}
                backgroundSize="cover"
                backgroundPosition="center"
                backgroundRepeat="no-repeat"
              />
              <Flex direction="column" alignItems="center" gap="5px">
                <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                  呱
                </Text>
                <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                  ★ ★ ★
                </Text>
              </Flex>
            </Flex>
          </Flex>
        )}

        {!introTalkLine ? (
          <Flex
            as="button"
            position="absolute"
            left="50%"
            bottom="48px"
            transform="translateX(-50%)"
            h="46px"
            minW="226px"
            px="28px"
            borderRadius="6px"
            bgColor="#7E6148"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 8px 16px rgba(64,42,28,0.18)"
            cursor="pointer"
            onClick={onNext}
            animation={`${revealStageIn} 300ms ease ${frogCtaDelayMs}ms both`}
          >
            <Text color="#FFFFFF" fontSize="18px" fontWeight="700" lineHeight="1">
              {effectiveCtaLabel}
            </Text>
          </Flex>
        ) : null}
      </Flex>

      {introTalkLine ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={8}
          direction="column"
          justifyContent="flex-end"
          pointerEvents="none"
          onClick={advanceIntroTalk}
        >
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            zIndex={6}
            pointerEvents="none"
          >
            <EventAvatarSprite
              spriteId={introTalkLine.spriteId}
              frameIndex={introTalkLine.frameIndex}
            />
          </Flex>
          <EventDialogPanel
            w="100%"
            borderRadius="0"
            overflow="hidden"
            pointerEvents="auto"
            cursor="pointer"
            onClick={advanceIntroTalk}
          >
            <Text color="white" fontWeight="700">
              {introTalkLine.speaker}
            </Text>
            <Flex flex="1" minH="0" direction="column" justifyContent="center">
              <Text color="white" fontSize="16px" lineHeight="1.5">
                {introTalkLine.text}
              </Text>
            </Flex>
            <EventContinueAction label="點擊繼續" onClick={advanceIntroTalk} />
          </EventDialogPanel>
        </Flex>
      ) : null}
    </Flex>
  );
}

export function DiaryOverlay({
  open,
  onClose,
  unlockedEntryIds,
  mode = "default",
  revealEntryId = "bai-entry-1",
  initialJournalView,
  initialBaiEntry1RestorationPreview = false,
  previewFrogDiaryFragmentPhotoAttemptCount,
  initialSunbeastCardId = null,
  sceneJumpEventId = null,
  onGuidedFlowComplete,
  onDiaryRevealEntryComplete,
  onSunbeastHintGuideComplete,
  onBeigoProfileComplete,
  onFragmentedDiaryComplete,
  onFrogReturnHomeDiaryGuideComplete,
  showReturnButton = false,
}: DiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "sunbeast">("journal");
  const [journalView, setJournalView] = useState<DiaryJournalView>("list");
  const [baiEntry1VisualPageIndex, setBaiEntry1VisualPageIndex] = useState<0 | 1>(0);
  const [isBaiEntry1VisualRevealComplete, setIsBaiEntry1VisualRevealComplete] = useState(false);
  const [isBaiEntry1TitleRevealed, setIsBaiEntry1TitleRevealed] = useState(false);
  const [isBaiEntry1FirstTextRevealed, setIsBaiEntry1FirstTextRevealed] = useState(false);
  const [isBaiEntry1NaotaroOpenReveal, setIsBaiEntry1NaotaroOpenReveal] = useState(false);
  const [isComicReadMode, setIsComicReadMode] = useState(false);
  const [isComicControlsVisible, setIsComicControlsVisible] = useState(false);
  const [showComicReadHint, setShowComicReadHint] = useState(false);
  const [hasShownComicReadHint, setHasShownComicReadHint] = useState(false);
  const [comicPageIndex, setComicPageIndex] = useState(0);
  const [isDiaryReadTalkVisible, setIsDiaryReadTalkVisible] = useState(false);
  const [diaryReadTalkIndex, setDiaryReadTalkIndex] = useState(0);
  const [isNextDiaryFragmentPreviewVisible, setIsNextDiaryFragmentPreviewVisible] = useState(false);
  const [nextDiaryCatalogRevealStage, setNextDiaryCatalogRevealStage] =
    useState<"idle" | "revealing" | "ready" | "talked">("idle");
  const [nextDiaryCatalogTalkIndex, setNextDiaryCatalogTalkIndex] = useState<number | null>(null);
  const [isFragmentedDiaryReactionVisible, setIsFragmentedDiaryReactionVisible] = useState(false);
  const [isIncompleteDiaryReactionVisible, setIsIncompleteDiaryReactionVisible] = useState(false);
  const [diaryRevealStep, setDiaryRevealStep] = useState<"idle" | "book" | "unlocking" | "ready">("idle");
  const [fragmentedDiaryStage, setFragmentedDiaryStage] = useState<FragmentedDiaryStage>("enter");
  const [fragmentedDiaryIntroTalkIndex, setFragmentedDiaryIntroTalkIndex] = useState<number | null>(null);
  const [metroFragmentPuzzleOrder, setMetroFragmentPuzzleOrder] = useState<number[]>(
    () => [...METRO_FRAGMENT_PUZZLE_INITIAL_ORDER],
  );
  const [selectedMetroFragmentPuzzleSlotIndex, setSelectedMetroFragmentPuzzleSlotIndex] =
    useState<number | null>(null);
  const [baiEntry2PuzzleOrder, setBaiEntry2PuzzleOrder] = useState<number[]>(
    () => [...BAI_ENTRY_2_PUZZLE_INITIAL_ORDER],
  );
  const [selectedBaiEntry2PuzzleSlotIndex, setSelectedBaiEntry2PuzzleSlotIndex] =
    useState<number | null>(null);
  const [hasCompletedBaiEntry2Puzzle, setHasCompletedBaiEntry2Puzzle] = useState(false);
  const [hasSelectedMetroFragmentClue, setHasSelectedMetroFragmentClue] = useState(false);
  const [metroFragmentCompletionStage, setMetroFragmentCompletionStage] =
    useState<MetroFragmentCompletionStage>("idle");
  const [metroFragmentRhythmGroupIndex, setMetroFragmentRhythmGroupIndex] = useState(0);
  const [fragmentedDiaryClueStage, setFragmentedDiaryClueStage] =
    useState<FragmentedDiaryClueStage>("idle");
  const [returnHomeDiaryClueEntry, setReturnHomeDiaryClueEntry] =
    useState<ReturnHomeDiaryClueEntry | null>(null);
  const [returnHomeDiarySeenClueEntries, setReturnHomeDiarySeenClueEntries] =
    useState<ReturnHomeDiaryClueEntry[]>([]);
  const [frogFragmentIntroStage, setFrogFragmentIntroStage] = useState<"photo" | "updated" | "diary">("diary");
  const [firstPhotoDiaryStage, setFirstPhotoDiaryStage] = useState<"idle" | "photo-slide">("idle");
  const [stickerCollection, setStickerCollection] = useState<StickerId[]>([]);
  const [sunbeastIntroStep, setSunbeastIntroStep] = useState<0 | 1 | null>(null);
  const [sunbeastFirstRevealPhase, setSunbeastFirstRevealPhase] = useState<
    "idle" | "questions" | "naotaro" | "done"
  >("idle");
  const [sunbeastFirstRevealQuestionCount, setSunbeastFirstRevealQuestionCount] = useState(0);
  const [introStage, setIntroStage] = useState<
    "none" | "photo" | "score" | "points" | "gacha" | "result"
  >("none");
  const [introReward, setIntroReward] = useState<{
    score: number;
    points: number;
    stickerId: StickerId;
    isNewSticker: boolean;
    weights: { basic: number; smile: number; rare: number };
  } | null>(null);
  const [latestPhotoSnapshot, setLatestPhotoSnapshot] = useState<PhotoCaptureSnapshot | null>(null);
  const [sunbeastProgress, setSunbeastProgress] = useState<PlayerProgress | null>(null);
  const [sunbeastView, setSunbeastView] = useState<SunbeastView>("collection");
  const [selectedSunbeastCardId, setSelectedSunbeastCardId] = useState<string | null>(null);
  const [sunbeastDetailRevealStep, setSunbeastDetailRevealStep] = useState<SunbeastDetailRevealStep>("idle");
  const [isSunbeastHintTalkVisible, setIsSunbeastHintTalkVisible] = useState(false);
  const [sunbeastHintTalkStep, setSunbeastHintTalkStep] = useState<0 | 1>(0);
  const [sunbeastHintTalkFrameIndex, setSunbeastHintTalkFrameIndex] = useState<MaiThinkingFrameIndex>(
    MAI_THINKING_FRAME_INDICES.thinking1,
  );
  const [isSunbeastShadowGuideVisible, setIsSunbeastShadowGuideVisible] = useState(false);
  const [sunbeastShadowGuideStep, setSunbeastShadowGuideStep] = useState<0 | 1 | 2>(0);
  const [sunbeastShadowGuideTargetId, setSunbeastShadowGuideTargetId] =
    useState<GuidedSunbeastHintId>("frog");
  const [activeGuidedSunbeastHintId, setActiveGuidedSunbeastHintId] =
    useState<GuidedSunbeastHintId | null>(null);
  const [activeSunbeastDetailTab, setActiveSunbeastDetailTab] =
    useState<SunbeastDetailInfoKind>("journal");
  const [activeSunbeastFilter, setActiveSunbeastFilter] = useState<SunbeastFilterId>("all");
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sunbeastRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unlockFxTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comicHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comicScrollRef = useRef<HTMLDivElement | null>(null);
  const sunbeastDetailScrollRef = useRef<HTMLDivElement | null>(null);
  const sunbeastSpotlightRootRef = useRef<HTMLDivElement | null>(null);
  const sunbeastCollectionRootRef = useRef<HTMLDivElement | null>(null);
  const sunbeastCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const hasPlayedSunbeastHeartRef = useRef(false);
  const [sunbeastShadowTargetRect, setSunbeastShadowTargetRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [sunbeastSpotlightSize, setSunbeastSpotlightSize] = useState({
    width: 0,
    height: 0,
  });
  const [journalUnlockFxStage, setJournalUnlockFxStage] = useState<
    "idle" | "locked" | "unlocking" | "done"
  >("idle");
  const measureSunbeastShadowTarget = () => {
    const root = sunbeastSpotlightRootRef.current;
    const target =
      root?.querySelector<HTMLElement>(
        `[data-sunbeast-card-id="${sunbeastShadowGuideTargetId}"]`,
      ) ?? sunbeastCardRefs.current[sunbeastShadowGuideTargetId];
    if (!root || !target) return false;

    const rootRect = root.getBoundingClientRect();
    setSunbeastSpotlightSize((prev) => {
      if (
        Math.abs(prev.width - rootRect.width) < 0.5 &&
        Math.abs(prev.height - rootRect.height) < 0.5
      ) {
        return prev;
      }
      return { width: rootRect.width, height: rootRect.height };
    });
    const targetRect = target.getBoundingClientRect();
    if (targetRect.width <= 0 || targetRect.height <= 0) return false;

    const nextRect = {
      left: targetRect.left - rootRect.left,
      top: targetRect.top - rootRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
    setSunbeastShadowTargetRect((prev) => {
      if (
        prev &&
        Math.abs(prev.left - nextRect.left) < 0.5 &&
        Math.abs(prev.top - nextRect.top) < 0.5 &&
        Math.abs(prev.width - nextRect.width) < 0.5 &&
        Math.abs(prev.height - nextRect.height) < 0.5
      ) {
        return prev;
      }
      return nextRect;
    });
    return true;
  };
  const isDiaryRevealMode = mode === "diary-reveal";
  const isFirstPhotoDiaryRevealMode = mode === "first-photo-diary-reveal";
  const isSecondPhotoDiaryRevealMode = mode === "second-photo-diary-reveal";
  const isKoalaPhotoDiaryRevealMode = mode === "sunbeast-koala-reveal";
  const isChickenPhotoDiaryRevealMode = mode === "sunbeast-chicken-reveal";
  const isCatPhotoDiaryRevealMode = mode === "sunbeast-cat-reveal";
  const isPhotoDiaryRevealMode =
    isFirstPhotoDiaryRevealMode ||
    isSecondPhotoDiaryRevealMode ||
    isKoalaPhotoDiaryRevealMode ||
    isChickenPhotoDiaryRevealMode ||
    isCatPhotoDiaryRevealMode;
  const isSunbeastRevealMode = mode === "sunbeast-reveal";
  const isSunbeastDirectMode = mode === "sunbeast";
  const isBeigoProfileMode = mode === "beigo-profile";
  const isFragmentedDiaryMode = mode === "fragmented-diary";
  const isFrogFragmentedDiaryMode = mode === "frog-fragmented-diary";
  const isFrogDiaryCatalogGuideMode = mode === "frog-diary-catalog-guide";
  const isFrogReturnHomeDiaryGuideMode = mode === "frog-return-home-diary-guide";
  const isMarketingDiaryThreadMode = mode === "marketing-diary-thread";
  const isNextDiaryCatalogGuideMode = isFirstPhotoDiaryRevealMode || isFrogDiaryCatalogGuideMode;
  const isAnyFragmentedDiaryMode = isFragmentedDiaryMode || isFrogFragmentedDiaryMode;
  const isSunbeastGuidedMode = isSunbeastRevealMode || isFirstPhotoDiaryRevealMode || isChickenPhotoDiaryRevealMode;
  const isGuidedJournalRevealMode =
    isDiaryRevealMode ||
    isFirstPhotoDiaryRevealMode ||
    isSecondPhotoDiaryRevealMode ||
    isKoalaPhotoDiaryRevealMode ||
    isChickenPhotoDiaryRevealMode ||
    isCatPhotoDiaryRevealMode;
  const hasBaiEntry1 = unlockedEntryIds.includes("bai-entry-1");
  const hasBaiEntry2 = unlockedEntryIds.includes("bai-entry-2");
  const hasBaiEntry3 = unlockedEntryIds.includes("bai-entry-3");
  const hasBaiEntry5 = unlockedEntryIds.includes("bai-entry-5");
  const frogDiarySceneJumpPhotoAttemptCount =
    isFrogFragmentedDiaryMode ? getFrogDiaryClueAttemptNumberByEventId(sceneJumpEventId) : null;
  const frogDiaryFragmentPhotoAttemptCount = Math.max(
    0,
    Math.min(
      3,
      previewFrogDiaryFragmentPhotoAttemptCount ??
        frogDiarySceneJumpPhotoAttemptCount ??
        sunbeastProgress?.streetForgotLunchFrogPhotoAttemptCount ??
        0,
    ),
  );
  const hasBaiEntry2FirstPhotoFragment = frogDiaryFragmentPhotoAttemptCount >= 1;
  const hasBaiEntry2SecondFragment =
    Boolean(sunbeastProgress?.hasCompletedStreetForgotLunchFrogEvent) ||
    frogDiaryFragmentPhotoAttemptCount >= 2;
  const isFrogCompleteDiaryRevealMode = isFrogFragmentedDiaryMode && frogDiaryFragmentPhotoAttemptCount >= 3;
  const isBaiEntry2FragmentOpen = hasBaiEntry1 && !hasBaiEntry2;
  const shouldUseFigmaJournalShell =
    (!isComicReadMode && activeTab === "journal") ||
    isAnyFragmentedDiaryMode ||
    isMarketingDiaryThreadMode;
  const shouldUseSunbeastShell = activeTab === "sunbeast" || isBeigoProfileMode;
  const isJournalEntryGuideActive =
    isGuidedJournalRevealMode &&
    journalView === "list" &&
    diaryRevealStep === "ready" &&
    journalUnlockFxStage === "done";
  const activeDiaryReadTalkLines =
    isFrogCompleteDiaryRevealMode
      ? BAI_ENTRY_2_READ_TALK_LINES
      : journalView === "entry-bai-5"
        ? BAI_ENTRY_5_READ_TALK_LINES
      : journalView === "entry-bai-3"
        ? BAI_ENTRY_3_READ_TALK_LINES
        : journalView === "entry-bai-2"
          ? BAI_ENTRY_2_READ_TALK_LINES
          : BAI_ENTRY_1_READ_TALK_LINES;
  const activeReturnHomeDiaryClueItems = returnHomeDiaryClueEntry
    ? RETURN_HOME_DIARY_CLUE_ITEMS[returnHomeDiaryClueEntry]
    : null;
  const effectivePhotoSnapshot = latestPhotoSnapshot ?? {
    sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    dogCoveragePercent: 90,
    // 測試假資料：對齊黃金獵犬所在區域，方便驗收取景還原
    cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
    capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
    capturedAt: new Date().toISOString(),
  };
  const activePhotoRevealSunbeastId = getPhotoRevealSunbeastId({ mode, initialSunbeastCardId });
  const activePhotoRevealEntry = SUNBEAST_REGISTRY[activePhotoRevealSunbeastId];
  const activePhotoRevealSnapshot =
    sunbeastProgress
      ? getLatestSunbeastPhotoCapture(sunbeastProgress, activePhotoRevealSunbeastId) ?? effectivePhotoSnapshot
      : effectivePhotoSnapshot;
  const frogFragmentPhotoImagePaths = Array.from({ length: 3 }, (_, index) => {
    const frogCaptures = sunbeastProgress?.streetForgotLunchFrogPhotoCaptures ?? [];
    return (
      frogCaptures[index]?.previewImage ??
      frogCaptures[frogCaptures.length - 1]?.previewImage ??
      effectivePhotoSnapshot.previewImage
    );
  });
  const currentFrogFragmentPhotoImagePath =
    frogFragmentPhotoImagePaths[Math.max(0, Math.min(2, frogDiaryFragmentPhotoAttemptCount - 1))] ??
    effectivePhotoSnapshot.previewImage;
  const frogDiarySceneJumpStage = useMemo(() => {
    if (!isFrogFragmentedDiaryMode) return null;
    return (
      getFrogDiaryClueStageByEventId(sceneJumpEventId) ??
      getFrogDiaryClueStageByAttempt(Math.max(0, frogDiaryFragmentPhotoAttemptCount - 1))
    );
  }, [frogDiaryFragmentPhotoAttemptCount, isFrogFragmentedDiaryMode, sceneJumpEventId]);
  const frogDiarySceneJumpSteps = useMemo(() => {
    if (!frogDiarySceneJumpStage) return [];
    return buildFrogDiaryClueSceneJumpSteps({
      stage: frogDiarySceneJumpStage,
      photoAttemptNumber: Math.max(1, frogDiaryFragmentPhotoAttemptCount),
      requiredPhotoAttempts: 3,
    });
  }, [frogDiaryFragmentPhotoAttemptCount, frogDiarySceneJumpStage]);
  const frogDiarySceneJumpCurrentStepId = getFrogFragmentedDiarySceneJumpStepId({
    firstPhotoDiaryStage,
    fragmentedDiaryStage,
    frogFragmentIntroStage,
    isFrogCompleteDiaryRevealMode,
  });
  const currentPhotoScore = Math.max(0, Math.min(100, Math.floor(effectivePhotoSnapshot.dogCoveragePercent)));
  const currentPhotoPoints = introReward?.points ?? convertPhotoScoreToPoints(currentPhotoScore);
  const currentStickerMeta = STICKER_META[introReward?.stickerId ?? "naotaro-basic"];
  const clearIntroTimers = () => {
    introTimersRef.current.forEach((timer) => clearTimeout(timer));
    introTimersRef.current = [];
  };

  const clearUnlockFxTimers = () => {
    unlockFxTimersRef.current.forEach((timer) => clearTimeout(timer));
    unlockFxTimersRef.current = [];
  };
  const clearSunbeastRevealTimers = () => {
    sunbeastRevealTimersRef.current.forEach((timer) => clearTimeout(timer));
    sunbeastRevealTimersRef.current = [];
  };
  const clearComicHintTimer = () => {
    if (!comicHintTimerRef.current) return;
    clearTimeout(comicHintTimerRef.current);
    comicHintTimerRef.current = null;
  };

  useEffect(() => {
    if (!open || !isFrogFragmentedDiaryMode || !frogDiarySceneJumpStage) return;
    if (frogDiarySceneJumpSteps.length <= 0) return;

    const currentStep =
      frogDiarySceneJumpSteps.find((step) => step.id === frogDiarySceneJumpCurrentStepId) ??
      frogDiarySceneJumpSteps[frogDiarySceneJumpSteps.length - 1];

    dispatchSceneJumpContextChange({
      eventId: frogDiarySceneJumpStage.eventId,
      kindLabel: currentStep?.kindLabel ?? "日記",
      speaker: currentStep?.speaker,
      text: currentStep?.text ?? "青蛙日記更新",
      steps: frogDiarySceneJumpSteps,
      currentStepId: currentStep?.id ?? frogDiarySceneJumpCurrentStepId,
    });
  }, [
    frogDiarySceneJumpCurrentStepId,
    frogDiarySceneJumpStage,
    frogDiarySceneJumpSteps,
    isFrogFragmentedDiaryMode,
    open,
  ]);

  useEffect(() => {
    if (!open || !isFrogFragmentedDiaryMode || !frogDiarySceneJumpStage) return;
    const eventId = frogDiarySceneJumpStage.eventId;
    return () => {
      dispatchSceneJumpContextChange({ eventId, clear: true });
    };
  }, [frogDiarySceneJumpStage, isFrogFragmentedDiaryMode, open]);

  const finishFragmentedDiaryClue = useCallback(() => {
    setFragmentedDiaryClueStage("idle");
    if (isFirstPhotoDiaryRevealMode && journalView === "entry-bai-2-fragment") {
      onDiaryRevealEntryComplete?.();
      return;
    }
    onFragmentedDiaryComplete?.();
  }, [
    isFirstPhotoDiaryRevealMode,
    journalView,
    onDiaryRevealEntryComplete,
    onFragmentedDiaryComplete,
  ]);

  const startFragmentedDiaryClueReward = useCallback(() => {
    setFragmentedDiaryClueStage("reward");
  }, []);

  const startFragmentedDiaryRuleHint = useCallback(() => {
    setFragmentedDiaryClueStage("hint");
  }, []);

  const advanceFragmentedDiaryIntroTalk = useCallback(() => {
    setFragmentedDiaryIntroTalkIndex((current) => {
      if (current === null) return null;
      if (current >= FRAGMENTED_DIARY_INTRO_TALK_LINES.length - 1) return null;
      return current + 1;
    });
  }, []);

  const completeMetroFragmentPuzzleReward = useCallback(() => {
    onFragmentedDiaryComplete?.();
  }, [onFragmentedDiaryComplete]);

  const completeFragmentedDiaryReaction = useCallback(() => {
    if (fragmentedDiaryClueStage !== "idle") return;
    if (showReturnButton) {
      onFragmentedDiaryComplete?.();
      return;
    }
    startFragmentedDiaryRuleHint();
  }, [fragmentedDiaryClueStage, onFragmentedDiaryComplete, showReturnButton, startFragmentedDiaryRuleHint]);

  const completeReturnHomeDiaryClue = useCallback(() => {
    const nextSeenEntries = new Set(returnHomeDiarySeenClueEntries);
    if (returnHomeDiaryClueEntry) {
      nextSeenEntries.add(returnHomeDiaryClueEntry);
      setReturnHomeDiarySeenClueEntries((prev) =>
        prev.includes(returnHomeDiaryClueEntry) ? prev : [...prev, returnHomeDiaryClueEntry],
      );
    }
    setReturnHomeDiaryClueEntry(null);
    if (nextSeenEntries.has("entry-bai-5")) {
      onFrogReturnHomeDiaryGuideComplete?.();
    }
    if (isFrogReturnHomeDiaryGuideMode) {
      setJournalView("list");
    }
  }, [
    isFrogReturnHomeDiaryGuideMode,
    onFrogReturnHomeDiaryGuideComplete,
    returnHomeDiaryClueEntry,
    returnHomeDiarySeenClueEntries,
  ]);

  const startJournalUnlockFx = () => {
    clearUnlockFxTimers();
    setJournalUnlockFxStage("locked");
    unlockFxTimersRef.current.push(
      setTimeout(() => {
        setJournalUnlockFxStage("unlocking");
      }, 360),
    );
    unlockFxTimersRef.current.push(
      setTimeout(() => {
        setJournalUnlockFxStage("done");
      }, 980),
    );
  };

  const scrollToComicPage = (nextIndex: number) => {
    const scroller = comicScrollRef.current;
    if (!scroller) return;
    const safeIndex = Math.max(0, Math.min(DIARY_COMIC_PAGES.length - 1, nextIndex));
    const pages = Array.from(scroller.children) as HTMLElement[];
    const target = pages[safeIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setComicPageIndex(safeIndex);
  };

  const getCurrentComicPageIndex = () => {
    const scroller = comicScrollRef.current;
    if (!scroller) return comicPageIndex;
    const pageHeight = Math.max(1, scroller.clientHeight);
    return Math.max(
      0,
      Math.min(
        DIARY_COMIC_PAGES.length - 1,
        Math.round(scroller.scrollTop / pageHeight),
      ),
    );
  };

  const handleComicScroll = () => {
    const scroller = comicScrollRef.current;
    if (!scroller) return;
    if (showComicReadHint) setShowComicReadHint(false);
    const nextIndex = getCurrentComicPageIndex();
    setComicPageIndex(nextIndex);
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const isNearBottom = maxScrollTop > 0 && scroller.scrollTop >= maxScrollTop - 20;
    if (isNearBottom && !isDiaryReadTalkVisible) {
      setIsComicControlsVisible(true);
    }
  };

  const advanceDiaryReadTalk = useCallback(() => {
    if (diaryReadTalkIndex >= activeDiaryReadTalkLines.length - 1) {
      setIsDiaryReadTalkVisible(false);
      setDiaryReadTalkIndex(0);
      if (isComicReadMode) {
        setIsComicReadMode(false);
        setIsComicControlsVisible(false);
        setComicPageIndex(0);
        onGuidedFlowComplete?.();
        return;
      }
      if (isFirstPhotoDiaryRevealMode && journalView === "entry-bai-1") {
        setJournalView("list");
        setBaiEntry1VisualPageIndex(0);
        setIsBaiEntry1VisualRevealComplete(false);
        setIsBaiEntry1TitleRevealed(false);
        setIsBaiEntry1FirstTextRevealed(false);
        setIsBaiEntry1NaotaroOpenReveal(false);
        setNextDiaryCatalogRevealStage("revealing");
        return;
      }
      if (isFrogCompleteDiaryRevealMode) {
        onFragmentedDiaryComplete?.();
        return;
      }
      if (
        isFrogReturnHomeDiaryGuideMode &&
        journalView === "entry-bai-5"
      ) {
        setReturnHomeDiaryClueEntry(journalView);
        return;
      }
      if (isGuidedJournalRevealMode) {
        onDiaryRevealEntryComplete?.();
      }
      return;
    }
    setDiaryReadTalkIndex((prev) => prev + 1);
  }, [
    activeDiaryReadTalkLines.length,
    diaryReadTalkIndex,
    isFrogCompleteDiaryRevealMode,
    isFrogReturnHomeDiaryGuideMode,
    isFirstPhotoDiaryRevealMode,
    isComicReadMode,
    isGuidedJournalRevealMode,
    journalView,
    onDiaryRevealEntryComplete,
    onFragmentedDiaryComplete,
    onGuidedFlowComplete,
  ]);

  const completeNextDiaryFragmentPreview = useCallback(() => {
    setIsNextDiaryFragmentPreviewVisible(false);
    onDiaryRevealEntryComplete?.();
  }, [onDiaryRevealEntryComplete]);

  const advanceNextDiaryCatalogTalk = useCallback(() => {
    setNextDiaryCatalogTalkIndex((current) => {
      if (current === null) return current;
      if (current >= NEXT_DIARY_CATALOG_TALK_LINES.length - 1) return null;
      return current + 1;
    });
  }, []);

  const startDiaryRevealAfterPhoto = () => {
    setIntroStage("score");
  };

  const goToPointsStage = () => {
    const score = effectivePhotoSnapshot.dogCoveragePercent;
    const points = convertPhotoScoreToPoints(score);
    setIntroReward({
      score,
      points,
      stickerId: "naotaro-basic",
      isNewSticker: false,
      weights: getStickerRollWeightsByPoints(points),
    });
    setIntroStage("points");
  };

  const runGacha = () => {
    if (!introReward) return;
    setIntroStage("gacha");
    clearIntroTimers();
    introTimersRef.current.push(
      setTimeout(() => {
        const stickerId = rollStickerByPoints(introReward.points);
        setIntroReward((prev) =>
          prev
            ? {
                ...prev,
                stickerId,
                isNewSticker: !stickerCollection.includes(stickerId),
              }
            : prev,
        );
        setIntroStage("result");
      }, 950),
    );
  };

  const collectReward = () => {
    if (!introReward) return;
    const before = loadPlayerProgress();
    const result = finalizeDiaryFirstRevealReward(introReward.stickerId);
    setIntroReward((prev) => (prev ? { ...prev, isNewSticker: result.isNewSticker } : prev));
    const next = loadPlayerProgress();
    setStickerCollection(next.stickerCollection);
    setSunbeastProgress(next);
    setActiveTab("sunbeast");
    setSunbeastView("collection");
    if (before.hasSeenSunbeastFirstReveal) {
      setSunbeastFirstRevealPhase("done");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
    } else {
      setSunbeastFirstRevealPhase("questions");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
    }
    setIntroStage("none");
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    clearComicHintTimer();
    setActiveTab(isSunbeastRevealMode || isSunbeastDirectMode || isBeigoProfileMode ? "sunbeast" : "journal");
    setJournalView(initialJournalView ?? "list");
    setBaiEntry1VisualPageIndex(0);
    setIsBaiEntry1VisualRevealComplete(false);
    setIsBaiEntry1TitleRevealed(false);
    setIsBaiEntry1FirstTextRevealed(false);
    setIsBaiEntry1NaotaroOpenReveal(initialBaiEntry1RestorationPreview);
    setIsComicReadMode(false);
    setIsComicControlsVisible(false);
    setShowComicReadHint(false);
    setHasShownComicReadHint(false);
    setComicPageIndex(0);
    setIsDiaryReadTalkVisible(false);
    setDiaryReadTalkIndex(0);
    setIsNextDiaryFragmentPreviewVisible(false);
    setIsFragmentedDiaryReactionVisible(false);
    setNextDiaryCatalogRevealStage(isFrogDiaryCatalogGuideMode ? "revealing" : "idle");
    setNextDiaryCatalogTalkIndex(null);
    setIsIncompleteDiaryReactionVisible(false);
    setDiaryRevealStep(isGuidedJournalRevealMode ? "book" : "idle");
    setFragmentedDiaryStage("enter");
    setFragmentedDiaryIntroTalkIndex(isFragmentedDiaryMode ? 0 : null);
    setMetroFragmentPuzzleOrder([...METRO_FRAGMENT_PUZZLE_INITIAL_ORDER]);
    setSelectedMetroFragmentPuzzleSlotIndex(null);
    setBaiEntry2PuzzleOrder([...BAI_ENTRY_2_PUZZLE_INITIAL_ORDER]);
    setSelectedBaiEntry2PuzzleSlotIndex(null);
    setHasCompletedBaiEntry2Puzzle(false);
    setHasSelectedMetroFragmentClue(false);
    setMetroFragmentCompletionStage("idle");
    setMetroFragmentRhythmGroupIndex(0);
    setFragmentedDiaryClueStage("idle");
    setReturnHomeDiaryClueEntry(null);
    setReturnHomeDiarySeenClueEntries([]);
    const progressAtOpen = loadPlayerProgress();
    const shouldShowFrogPhotoIntro =
      isFrogFragmentedDiaryMode && progressAtOpen.streetForgotLunchFrogPhotoAttemptCount > 0;
    setFrogFragmentIntroStage(
      shouldShowFrogPhotoIntro ? "photo" : "diary",
    );
    setFirstPhotoDiaryStage(shouldShowFrogPhotoIntro ? "photo-slide" : "idle");
    setSunbeastIntroStep(null);
    setSunbeastFirstRevealPhase("idle");
    setSunbeastFirstRevealQuestionCount(0);
    setSunbeastView(getInitialSunbeastView(initialSunbeastCardId));
    setSelectedSunbeastCardId(initialSunbeastCardId);
    setSunbeastDetailRevealStep("idle");
    setIsSunbeastShadowGuideVisible(false);
    setSunbeastShadowGuideStep(0);
    setSunbeastShadowGuideTargetId("frog");
    setActiveGuidedSunbeastHintId(null);
    setActiveSunbeastDetailTab("journal");
    setActiveSunbeastFilter("all");
    hasPlayedSunbeastHeartRef.current = false;
    setJournalUnlockFxStage("idle");
    if (isFirstPhotoDiaryRevealMode) {
      finalizeDiaryFirstRevealReward("naotaro-basic");
      const next = loadPlayerProgress();
      setStickerCollection(next.stickerCollection);
      setSunbeastProgress(next);
    }
  }, [hasBaiEntry1, initialBaiEntry1RestorationPreview, initialJournalView, initialSunbeastCardId, isBeigoProfileMode, isChickenPhotoDiaryRevealMode, isAnyFragmentedDiaryMode, isFirstPhotoDiaryRevealMode, isFragmentedDiaryMode, isFrogDiaryCatalogGuideMode, isFrogFragmentedDiaryMode, isGuidedJournalRevealMode, isSunbeastDirectMode, isSunbeastRevealMode, open]);

  useEffect(() => {
    if (!open) return;
    if (!isAnyFragmentedDiaryMode) return;
    if (isFrogFragmentedDiaryMode && frogFragmentIntroStage !== "diary") return;
    if (isFragmentedDiaryMode && fragmentedDiaryIntroTalkIndex !== null) return;
    setFragmentedDiaryStage("enter");
    const shouldRevealSecondFragment =
      isFrogFragmentedDiaryMode
        ? frogDiaryFragmentPhotoAttemptCount >= 2
        : !isFragmentedDiaryMode && hasBaiEntry2SecondFragment;
    const singleFragmentReadyDelay = isFragmentedDiaryMode ? 1900 : 1280;
    const timers = shouldRevealSecondFragment
      ? [
          setTimeout(() => setFragmentedDiaryStage("first"), 180),
          setTimeout(() => setFragmentedDiaryStage("second"), 1280),
          setTimeout(() => setFragmentedDiaryStage("ready"), 2400),
        ]
      : [
          setTimeout(() => setFragmentedDiaryStage("first"), 180),
          setTimeout(() => setFragmentedDiaryStage("ready"), singleFragmentReadyDelay),
        ];
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [
    frogDiaryFragmentPhotoAttemptCount,
    frogFragmentIntroStage,
    fragmentedDiaryIntroTalkIndex,
    hasBaiEntry2SecondFragment,
    isAnyFragmentedDiaryMode,
    isFragmentedDiaryMode,
    isFrogFragmentedDiaryMode,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isFragmentedDiaryMode || showReturnButton) return;
    if (fragmentedDiaryIntroTalkIndex !== null) return;
    if (metroFragmentCompletionStage !== "idle") return;
    if (!isMetroFragmentPuzzleSolved(metroFragmentPuzzleOrder)) return;

    const settleTimer = setTimeout(() => {
      setMetroFragmentCompletionStage("settle");
    }, METRO_FRAGMENT_COMPLETION_SETTLE_DELAY_MS);

    return () => {
      clearTimeout(settleTimer);
    };
  }, [
    fragmentedDiaryIntroTalkIndex,
    isFragmentedDiaryMode,
    metroFragmentCompletionStage,
    metroFragmentPuzzleOrder,
    open,
    showReturnButton,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isFragmentedDiaryMode || showReturnButton) return;
    if (metroFragmentCompletionStage !== "settle") return;

    const talkTimer = setTimeout(() => {
      setMetroFragmentCompletionStage("beigo");
    }, METRO_FRAGMENT_COMPLETION_TALK_DELAY_MS);

    return () => {
      clearTimeout(talkTimer);
    };
  }, [isFragmentedDiaryMode, metroFragmentCompletionStage, open, showReturnButton]);

  useEffect(() => {
    if (!open) return;
    if (!isFragmentedDiaryMode || showReturnButton) return;
    if (metroFragmentCompletionStage !== "rhythm") {
      setMetroFragmentRhythmGroupIndex(0);
      return;
    }

    const rhythmTimer = window.setInterval(() => {
      setMetroFragmentRhythmGroupIndex((current) =>
        (current + 1) % METRO_FRAGMENT_RHYTHM_GROUPS.length,
      );
    }, METRO_FRAGMENT_RHYTHM_STEP_MS);

    return () => {
      window.clearInterval(rhythmTimer);
    };
  }, [isFragmentedDiaryMode, metroFragmentCompletionStage, open, showReturnButton]);

  useEffect(() => {
    if (!open) return;
    if (!isFragmentedDiaryMode || showReturnButton) return;
    if (metroFragmentCompletionStage !== "resolved") return;

    const resolveTimer = setTimeout(() => {
      completeMetroFragmentPuzzleReward();
    }, METRO_FRAGMENT_RESOLVE_HOLD_MS);

    return () => {
      clearTimeout(resolveTimer);
    };
  }, [
    completeMetroFragmentPuzzleReward,
    isFragmentedDiaryMode,
    metroFragmentCompletionStage,
    open,
    showReturnButton,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isNextDiaryCatalogGuideMode) return;
    if (journalView !== "list") return;
    if (nextDiaryCatalogRevealStage !== "revealing") return;
    const readyTimer = setTimeout(() => {
      setNextDiaryCatalogRevealStage("ready");
    }, 760);
    return () => {
      clearTimeout(readyTimer);
    };
  }, [isNextDiaryCatalogGuideMode, journalView, nextDiaryCatalogRevealStage, open]);

  useEffect(() => {
    if (!open) return;
    if (!isNextDiaryCatalogGuideMode) return;
    if (journalView !== "list") return;
    if (nextDiaryCatalogRevealStage !== "ready") return;
    const talkTimer = setTimeout(() => {
      setNextDiaryCatalogTalkIndex(0);
      setNextDiaryCatalogRevealStage("talked");
    }, 520);
    return () => {
      clearTimeout(talkTimer);
    };
  }, [isNextDiaryCatalogGuideMode, journalView, nextDiaryCatalogRevealStage, open]);

  useEffect(() => {
    if (!open) return;
    if (journalView !== "entry-bai-1") return;
    if (!isFirstPhotoDiaryRevealMode && !isBaiEntry1NaotaroOpenReveal) return;
    setBaiEntry1VisualPageIndex(0);
    setIsBaiEntry1VisualRevealComplete(false);
    setIsBaiEntry1TitleRevealed(false);
    setIsBaiEntry1FirstTextRevealed(false);
    const firstTextRevealTimer = isBaiEntry1NaotaroOpenReveal
      ? setTimeout(() => {
          setIsBaiEntry1FirstTextRevealed(true);
        }, 2300)
      : null;
    const revealTimer = setTimeout(() => {
      setIsBaiEntry1VisualRevealComplete(true);
    }, isBaiEntry1NaotaroOpenReveal ? 1180 : 1000);
    return () => {
      if (firstTextRevealTimer) clearTimeout(firstTextRevealTimer);
      clearTimeout(revealTimer);
    };
  }, [isBaiEntry1NaotaroOpenReveal, isFirstPhotoDiaryRevealMode, journalView, open]);

  useEffect(() => {
    if (!open) return;
    if (!isBaiEntry1NaotaroOpenReveal) return;
    if (journalView !== "entry-bai-1") return;
    if (!isBaiEntry1FirstTextRevealed) return;
    if (isBaiEntry1TitleRevealed) return;
    const titleTimer = setTimeout(() => {
      setIsBaiEntry1TitleRevealed(true);
    }, 1500);
    return () => clearTimeout(titleTimer);
  }, [
    isBaiEntry1FirstTextRevealed,
    isBaiEntry1NaotaroOpenReveal,
    isBaiEntry1TitleRevealed,
    journalView,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isGuidedJournalRevealMode) return;
    if (diaryRevealStep !== "unlocking") return;
    startJournalUnlockFx();
    const readyTimer = setTimeout(() => {
      setDiaryRevealStep("ready");
    }, 1050);
    return () => clearTimeout(readyTimer);
  }, [diaryRevealStep, isGuidedJournalRevealMode, open]);

  useEffect(() => {
    if (!open) return;
    if (sunbeastIntroStep !== 1) return;
    if (hasPlayedSunbeastHeartRef.current) return;
    hasPlayedSunbeastHeartRef.current = true;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_EMOTION_CUE_TRIGGER, { detail: { cueId: "heart" } }),
      );
    }, 120);
    return () => clearTimeout(timer);
  }, [open, sunbeastIntroStep]);

  useEffect(() => {
    if (!open) return;
    if (activeTab !== "sunbeast") return;
    if (sunbeastView === "collection") return;
    sunbeastDetailScrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab, open, sunbeastView]);

  useEffect(() => {
    if (!open) return;
    if (activeTab !== "sunbeast") return;
    if (sunbeastView !== "detail-naotaro") return;
    if (sunbeastDetailRevealStep === "unlock-diary") {
      setActiveSunbeastDetailTab("journal");
      return;
    }
    if (sunbeastDetailRevealStep === "unlock-street") {
      setActiveSunbeastDetailTab("place");
      return;
    }
    if (sunbeastDetailRevealStep === "unlock-clues") {
      setActiveSunbeastDetailTab("clue");
    }
  }, [activeTab, open, sunbeastDetailRevealStep, sunbeastView]);

  useEffect(() => {
    if (!open) return;
    clearSunbeastRevealTimers();
    if (sunbeastFirstRevealPhase !== "questions") return;
    for (let index = 1; index <= 12; index += 1) {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastFirstRevealQuestionCount(index);
        }, 120 + (index - 1) * 90),
      );
    }
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setSunbeastFirstRevealPhase("naotaro");
      }, 120 + 12 * 90 + 140),
    );
    return () => {
      clearSunbeastRevealTimers();
    };
  }, [open, sunbeastFirstRevealPhase]);

  useEffect(() => {
    if (!open) return;
    if (sunbeastFirstRevealPhase !== "naotaro") return;
    clearSunbeastRevealTimers();
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setSunbeastFirstRevealPhase("done");
        setSunbeastIntroStep(0);
      }, 320),
    );
    return () => {
      clearSunbeastRevealTimers();
    };
  }, [open, sunbeastFirstRevealPhase]);

  useEffect(() => {
    if (!open) return;
    clearSunbeastRevealTimers();
    if (!isSunbeastRevealMode) return;

    if (sunbeastDetailRevealStep === "unlock-intro") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-diary");
        }, 420),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-diary") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-street");
        }, 860),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-street") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-clues");
        }, 860),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-clues") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-outro");
        }, 980),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-outro") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("complete");
        }, 980),
      );
    }

    return () => {
      clearSunbeastRevealTimers();
    };
  }, [isSunbeastRevealMode, open, sunbeastDetailRevealStep]);

  useEffect(() => {
    if (!open) return;
    if (!isPhotoDiaryRevealMode && !isFrogFragmentedDiaryMode) return;
    if (firstPhotoDiaryStage !== "photo-slide") return;

    clearSunbeastRevealTimers();
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setFirstPhotoDiaryStage("idle");
        if (isFrogCompleteDiaryRevealMode) {
          setFrogFragmentIntroStage("diary");
          setFragmentedDiaryStage("enter");
          return;
        }
        if (isFrogFragmentedDiaryMode) {
          return;
        }
        if (isChickenPhotoDiaryRevealMode) {
          setActiveTab("sunbeast");
          setSelectedSunbeastCardId("chicken");
          setSunbeastView("detail-chicken");
          setActiveSunbeastDetailTab("journal");
          setSunbeastDetailRevealStep("dialog");
          return;
        }
        if (isKoalaPhotoDiaryRevealMode || isCatPhotoDiaryRevealMode) {
          setActiveTab("sunbeast");
          setSelectedSunbeastCardId(activePhotoRevealSunbeastId);
          setSunbeastView("detail-generic");
          setActiveSunbeastDetailTab("journal");
          setSunbeastDetailRevealStep("dialog");
          return;
        }
        if (isSecondPhotoDiaryRevealMode) {
          setActiveTab("journal");
          setJournalView("list");
          setDiaryRevealStep("unlocking");
          return;
        }
        setActiveTab("sunbeast");
        setSelectedSunbeastCardId("naotaro");
        setSunbeastView("detail-naotaro");
        setActiveSunbeastDetailTab("journal");
        setSunbeastDetailRevealStep("dialog");
      }, 1320),
    );

    return () => {
      clearSunbeastRevealTimers();
    };
  }, [
    firstPhotoDiaryStage,
    isFrogCompleteDiaryRevealMode,
    isFrogFragmentedDiaryMode,
    isPhotoDiaryRevealMode,
    isChickenPhotoDiaryRevealMode,
    isKoalaPhotoDiaryRevealMode,
    isSecondPhotoDiaryRevealMode,
    isCatPhotoDiaryRevealMode,
    activePhotoRevealSunbeastId,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!ENABLE_SUNBEAST_GUIDANCE_SYSTEM) return;
    if (!isSunbeastRevealMode) return;
    if (sunbeastDetailRevealStep !== "unlock-clues") return;

    const current = loadPlayerProgress();
    if (current.hasUnlockedSunbeastFrogHint && current.hasUnlockedSunbeastChickenHint) {
      setSunbeastProgress(current);
      return;
    }

    const next = {
      ...current,
      hasUnlockedSunbeastFrogHint: true,
      hasUnlockedSunbeastChickenHint: true,
    };
    savePlayerProgress(next);
    setSunbeastProgress(next);
  }, [isSunbeastRevealMode, open, sunbeastDetailRevealStep]);

  useEffect(() => {
    if (!open) return;
    if (!ENABLE_SUNBEAST_GUIDANCE_SYSTEM) return;
    if (!isSunbeastDirectMode) return;
    const current = loadPlayerProgress();
    if (current.hasSeenSunbeastShadowGuide) return;
    if (!current.hasSeenSunbeastFirstReveal) return;
    const next = {
      ...current,
      hasUnlockedSunbeastFrogHint: true,
      hasUnlockedSunbeastChickenHint: true,
    };
    savePlayerProgress(next);
    setSunbeastProgress(next);
    setActiveTab("sunbeast");
    setSunbeastView("collection");
    setSelectedSunbeastCardId(null);
    setActiveSunbeastFilter("all");
    setSunbeastShadowGuideTargetId("frog");
    setActiveGuidedSunbeastHintId(null);
    setSunbeastShadowGuideStep(0);
    setIsSunbeastShadowGuideVisible(true);
  }, [isSunbeastDirectMode, open]);

  useLayoutEffect(() => {
    if (!open || !isSunbeastShadowGuideVisible || sunbeastShadowGuideStep !== 2) {
      setSunbeastShadowTargetRect(null);
      return;
    }

    let frameId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const update = () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      frameId = window.requestAnimationFrame(() => {
        const rootRect = sunbeastSpotlightRootRef.current?.getBoundingClientRect();
        if (rootRect) {
          setSunbeastSpotlightSize((prev) => {
            if (
              Math.abs(prev.width - rootRect.width) < 0.5 &&
              Math.abs(prev.height - rootRect.height) < 0.5
            ) {
              return prev;
            }
            return { width: rootRect.width, height: rootRect.height };
          });
        }
        const measured = measureSunbeastShadowTarget();
        if (!measured) {
          if (retryCount < 20) {
            retryCount += 1;
            timeoutId = setTimeout(update, 50);
          } else {
            setSunbeastShadowTargetRect(null);
          }
        }
      });
    };

    update();
    const root = sunbeastSpotlightRootRef.current;
    const resizeObserver = new ResizeObserver(update);
    if (root) {
      resizeObserver.observe(root);
      root.addEventListener("scroll", update, true);
    }
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      root?.removeEventListener("scroll", update, true);
    };
  }, [sunbeastShadowGuideTargetId, isSunbeastShadowGuideVisible, open, sunbeastShadowGuideStep]);

  useEffect(() => {
    if (!open || sunbeastView !== "detail-unknown") {
      setIsSunbeastHintTalkVisible(false);
      setSunbeastHintTalkStep(0);
    }
  }, [open, sunbeastView]);

  useEffect(() => {
    if (!isSunbeastHintTalkVisible || sunbeastHintTalkStep !== 0) return;
    setSunbeastHintTalkFrameIndex(MAI_THINKING_FRAME_INDICES.thinking1);
    const intervalId = window.setInterval(() => {
      setSunbeastHintTalkFrameIndex((current) =>
        current === MAI_THINKING_FRAME_INDICES.thinking1
          ? MAI_THINKING_FRAME_INDICES.thinking2
          : MAI_THINKING_FRAME_INDICES.thinking1,
      );
    }, 560);
    return () => window.clearInterval(intervalId);
  }, [isSunbeastHintTalkVisible, sunbeastHintTalkStep]);

  useEffect(() => {
    if (!open) return;
    clearIntroTimers();
    const progress = loadPlayerProgress();
    setStickerCollection(progress.stickerCollection);
    setSunbeastProgress(progress);
    setLatestPhotoSnapshot(progress.lastDogPhotoCapture);
    setIntroReward(null);
    if (
      isSunbeastRevealMode &&
      progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
      !progress.hasSeenSunbeastFirstReveal
    ) {
      finalizeDiaryFirstRevealReward("naotaro-basic");
      const next = loadPlayerProgress();
      setStickerCollection(next.stickerCollection);
      setSunbeastProgress(next);
      setLatestPhotoSnapshot(next.lastDogPhotoCapture);
      setActiveTab("sunbeast");
      setSelectedSunbeastCardId("naotaro");
      setSunbeastView("detail-naotaro");
      setActiveSunbeastDetailTab("journal");
      setSunbeastDetailRevealStep("dialog");
      setSunbeastFirstRevealPhase("done");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
      setIntroStage("none");
      return;
    }
    setIntroStage("none");
    return () => {
      clearIntroTimers();
    };
  }, [isSunbeastRevealMode, open, unlockedEntryIds]);

  useEffect(() => {
    return () => {
      clearIntroTimers();
      clearSunbeastRevealTimers();
      clearUnlockFxTimers();
      clearComicHintTimer();
    };
  }, []);

  const hasReconstructedMetroFragmentClue =
    hasSelectedMetroFragmentClue ||
    isMetroFragmentPuzzleSolved(metroFragmentPuzzleOrder);

  const handleMetroFragmentPuzzleSlotSelect = useCallback(
    (slotIndex: number) => {
      if (hasReconstructedMetroFragmentClue) return;
      if (selectedMetroFragmentPuzzleSlotIndex === null) {
        setSelectedMetroFragmentPuzzleSlotIndex(slotIndex);
        return;
      }
      if (selectedMetroFragmentPuzzleSlotIndex === slotIndex) {
        setSelectedMetroFragmentPuzzleSlotIndex(null);
        return;
      }
      setMetroFragmentPuzzleOrder((currentOrder) => {
        const nextOrder = [...currentOrder];
        const previousPieceId = nextOrder[selectedMetroFragmentPuzzleSlotIndex];
        nextOrder[selectedMetroFragmentPuzzleSlotIndex] = nextOrder[slotIndex];
        nextOrder[slotIndex] = previousPieceId;
        return nextOrder;
      });
      setSelectedMetroFragmentPuzzleSlotIndex(null);
    },
    [hasReconstructedMetroFragmentClue, selectedMetroFragmentPuzzleSlotIndex],
  );

  const handleMetroFragmentPuzzleSlotSwap = useCallback(
    (fromSlotIndex: number, toSlotIndex: number) => {
      if (hasReconstructedMetroFragmentClue || fromSlotIndex === toSlotIndex) return;
      setMetroFragmentPuzzleOrder((currentOrder) => {
        const nextOrder = [...currentOrder];
        const previousPieceId = nextOrder[fromSlotIndex];
        nextOrder[fromSlotIndex] = nextOrder[toSlotIndex];
        nextOrder[toSlotIndex] = previousPieceId;
        return nextOrder;
      });
      setSelectedMetroFragmentPuzzleSlotIndex(null);
    },
    [hasReconstructedMetroFragmentClue],
  );

  const isBaiEntry2PuzzleSolved = isDiaryImagePuzzleSolved(baiEntry2PuzzleOrder);

  const handleBaiEntry2PuzzleSlotSelect = useCallback(
    (slotIndex: number) => {
      if (isBaiEntry2PuzzleSolved) return;
      if (selectedBaiEntry2PuzzleSlotIndex === null) {
        setSelectedBaiEntry2PuzzleSlotIndex(slotIndex);
        return;
      }
      if (selectedBaiEntry2PuzzleSlotIndex === slotIndex) {
        setSelectedBaiEntry2PuzzleSlotIndex(null);
        return;
      }
      setBaiEntry2PuzzleOrder((currentOrder) => {
        const nextOrder = [...currentOrder];
        const previousPieceId = nextOrder[selectedBaiEntry2PuzzleSlotIndex];
        nextOrder[selectedBaiEntry2PuzzleSlotIndex] = nextOrder[slotIndex];
        nextOrder[slotIndex] = previousPieceId;
        return nextOrder;
      });
      setSelectedBaiEntry2PuzzleSlotIndex(null);
    },
    [isBaiEntry2PuzzleSolved, selectedBaiEntry2PuzzleSlotIndex],
  );

  const handleBaiEntry2PuzzleSlotSwap = useCallback(
    (fromSlotIndex: number, toSlotIndex: number) => {
      if (isBaiEntry2PuzzleSolved || fromSlotIndex === toSlotIndex) return;
      setBaiEntry2PuzzleOrder((currentOrder) => {
        const nextOrder = [...currentOrder];
        const previousPieceId = nextOrder[fromSlotIndex];
        nextOrder[fromSlotIndex] = nextOrder[toSlotIndex];
        nextOrder[toSlotIndex] = previousPieceId;
        return nextOrder;
      });
      setSelectedBaiEntry2PuzzleSlotIndex(null);
    },
    [isBaiEntry2PuzzleSolved],
  );

  const continueAfterBaiEntry2Puzzle = useCallback(() => {
    if (!isBaiEntry2PuzzleSolved) return;
    setSelectedBaiEntry2PuzzleSlotIndex(null);
    if (
      isFirstPhotoDiaryRevealMode ||
      isFrogDiaryCatalogGuideMode ||
      isFrogFragmentedDiaryMode
    ) {
      startFragmentedDiaryClueReward();
      return;
    }
    setHasCompletedBaiEntry2Puzzle(true);
  }, [
    isBaiEntry2PuzzleSolved,
    isFirstPhotoDiaryRevealMode,
    isFrogDiaryCatalogGuideMode,
    isFrogFragmentedDiaryMode,
    startFragmentedDiaryClueReward,
  ]);

  const continueMetroFragmentCompletionTalk = useCallback(() => {
    setMetroFragmentCompletionStage((current) => {
      if (current === "beigo") return "mai";
      if (current === "mai") return "rhythm";
      return current;
    });
  }, []);

  const handleMetroFragmentRhythmGroupSelect = useCallback((groupId: MetroFragmentRhythmGroupId | null) => {
    if (groupId !== "metro") return;
    setHasSelectedMetroFragmentClue(true);
    setMetroFragmentCompletionStage("resolved");
  }, []);

  const content = useMemo(() => {
    if (isMarketingDiaryThreadMode) {
      return <MarketingDiaryThreadPage open={open} onClose={onClose} />;
    }

    if (isFragmentedDiaryMode) {
      const canAdvanceFragmentedDiary = fragmentedDiaryStage !== "enter";
      const activeMetroFragmentRhythmGroupId =
        metroFragmentCompletionStage === "rhythm"
          ? METRO_FRAGMENT_RHYTHM_GROUPS[metroFragmentRhythmGroupIndex] ?? null
          : null;
      const shouldShowFragmentedDiaryReaction =
        canAdvanceFragmentedDiary && !showReturnButton && isFragmentedDiaryReactionVisible;
      const fragmentedDiaryIntroTalkLine =
        fragmentedDiaryIntroTalkIndex === null
          ? null
          : FRAGMENTED_DIARY_INTRO_TALK_LINES[fragmentedDiaryIntroTalkIndex] ?? null;

      return (
        <VisualDiaryBookPage
          title="???"
          pages={[
            {
              imagePath: BAI_ENTRY_1_VISUAL_PAGES[0].imagePath,
              text: BAI_ENTRY_1_DAMAGED_VISUAL_TEXT,
              imageEffect: "fade",
              textEffect: "damaged-fragment",
              selectableMetroClue: {
                selected: hasSelectedMetroFragmentClue,
                reconstructed: hasReconstructedMetroFragmentClue,
                completionStage: metroFragmentCompletionStage,
                activeRhythmGroupId: activeMetroFragmentRhythmGroupId,
                puzzleImagePath: BAI_ENTRY_1_VISUAL_PAGES[0].imagePath,
                puzzleOrder: metroFragmentPuzzleOrder,
                selectedPuzzleSlotIndex: selectedMetroFragmentPuzzleSlotIndex,
                onPuzzleSlotSelect: handleMetroFragmentPuzzleSlotSelect,
                onPuzzleSlotSwap: handleMetroFragmentPuzzleSlotSwap,
                onSelect: () => {
                  setHasSelectedMetroFragmentClue(true);
                  setMetroFragmentCompletionStage("resolved");
                },
                onRhythmGroupSelect: handleMetroFragmentRhythmGroupSelect,
              },
            },
          ]}
          stagedReveal
          isRevealComplete={canAdvanceFragmentedDiary}
          keepSinglePageCentered
          rhythm="restoration"
          fadeFirstPage
          pageMode="slide"
          slideTotalPages={2}
          onContinue={undefined}
          continueLabel="點擊繼續"
          scrollBottomPadding={shouldShowFragmentedDiaryReaction ? DIARY_DIALOG_SCROLL_BOTTOM_PADDING : 48}
          overlay={showReturnButton ? (
            <Flex
              as="button"
              position="absolute"
              left="38px"
              bottom="38px"
              zIndex={20}
              h="44px"
              minW="96px"
              px="18px"
              borderRadius="6px"
              bgColor="#7E6148"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 8px 18px rgba(80,54,33,0.18)"
              cursor="pointer"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
            >
              <Text color="#FFFFFF" fontSize="16px" fontWeight="600" lineHeight="1">
                返回
              </Text>
            </Flex>
          ) : fragmentedDiaryIntroTalkLine ? (
            <DiaryReactionOverlay
              line={fragmentedDiaryIntroTalkLine}
              onContinue={advanceFragmentedDiaryIntroTalk}
            />
          ) : metroFragmentCompletionStage === "beigo" ? (
            <DiaryReactionOverlay
              line={{
                speaker: "小貝狗",
                text: "嗷嗷！",
                spriteId: "beigo",
                frameIndex: 2,
              }}
              onContinue={continueMetroFragmentCompletionTalk}
            />
          ) : metroFragmentCompletionStage === "mai" ? (
            <DiaryReactionOverlay
              line={{
                speaker: "小麥",
                text: "日記還原了一些，有什麼關鍵嗎？",
                spriteId: "mai",
                frameIndex: 35,
              }}
              onContinue={continueMetroFragmentCompletionTalk}
            />
          ) : shouldShowFragmentedDiaryReaction ? (
            <>
              <DiaryReactionOverlay
                line={{
                  speaker: "小麥",
                  text: "僅存的日記也只有一點點就斷掉了",
                  spriteId: "mai",
                  frameIndex: 36,
                }}
                onContinue={completeFragmentedDiaryReaction}
              />
              <FragmentedDiaryClueOverlay
                stage={fragmentedDiaryClueStage}
                onHintComplete={startFragmentedDiaryClueReward}
                onFinish={finishFragmentedDiaryClue}
              />
            </>
          ) : null}
        />
      );
    }

    if (isFrogFragmentedDiaryMode) {
      const revealLevel = getBaiEntry2FragmentRevealLevel(frogDiaryFragmentPhotoAttemptCount);
      const isFragmentedDiaryReady = fragmentedDiaryStage === "ready";

      if (frogFragmentIntroStage === "photo" && firstPhotoDiaryStage === "photo-slide") {
        return (
          <PhotoDiarySlidePage
            photoImagePath={
              isFrogCompleteDiaryRevealMode
                ? frogFragmentPhotoImagePaths[2] ?? effectivePhotoSnapshot.previewImage
                : currentFrogFragmentPhotoImagePath
            }
            photoRevealName={isFrogCompleteDiaryRevealMode ? "青蛙" : "呱"}
          />
        );
      }

      if (frogFragmentIntroStage === "photo") {
        return (
          <FrogFragmentPhotoIntroPage
            photoImagePath={currentFrogFragmentPhotoImagePath}
            photoImagePaths={frogFragmentPhotoImagePaths}
            photoAttemptCount={frogDiaryFragmentPhotoAttemptCount}
            isResolved={isFrogCompleteDiaryRevealMode}
            onNext={() => {
              if (isFrogCompleteDiaryRevealMode) {
                setFirstPhotoDiaryStage("photo-slide");
                return;
              }
              setFrogFragmentIntroStage("updated");
            }}
          />
        );
      }

      if (frogFragmentIntroStage === "updated") {
        return (
          <FrogFragmentPhotoIntroPage
            photoImagePath={currentFrogFragmentPhotoImagePath}
            photoImagePaths={frogFragmentPhotoImagePaths}
            photoAttemptCount={frogDiaryFragmentPhotoAttemptCount}
            variant="updated"
            onNext={() => {
              setFrogFragmentIntroStage("diary");
              setFragmentedDiaryStage("enter");
            }}
          />
        );
      }

      if (
        !isFrogCompleteDiaryRevealMode &&
        !hasCompletedBaiEntry2Puzzle &&
        revealLevel === "initial"
      ) {
        return (
          <VisualDiaryBookPage
            title="???"
            pages={[
              {
                imagePath: BAI_ENTRY_2_IMAGE_PATH,
                imageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
                text: BAI_ENTRY_2_FIRST_DAMAGED_TEXT,
                textEffect: "damaged-fragment",
                selectableMetroClue: {
                  selected: false,
                  reconstructed: isBaiEntry2PuzzleSolved,
                  puzzleImagePath: BAI_ENTRY_2_IMAGE_PATH,
                  puzzleImageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
                  puzzleSolvedOrder: DIARY_IMAGE_PUZZLE_SOLVED_ORDER,
                  puzzlePieces: METRO_FRAGMENT_PUZZLE_PIECES,
                  puzzleQuestionPieceId: BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID,
                  puzzleTextTokens: BAI_ENTRY_2_PUZZLE_TEXT_TOKENS,
                  puzzleTextGridLayout: BAI_ENTRY_2_TEXT_GRID_LAYOUT,
                  puzzleOrder: baiEntry2PuzzleOrder,
                  selectedPuzzleSlotIndex: selectedBaiEntry2PuzzleSlotIndex,
                  onPuzzleSlotSelect: handleBaiEntry2PuzzleSlotSelect,
                  onPuzzleSlotSwap: handleBaiEntry2PuzzleSlotSwap,
                  onSelect: continueAfterBaiEntry2Puzzle,
                },
              },
            ]}
            pageMode="slide"
            slideTotalPages={3}
            onContinue={isBaiEntry2PuzzleSolved ? continueAfterBaiEntry2Puzzle : undefined}
            continueLabel="繼續"
            rhythm="restoration"
            scrollBottomPadding={118}
            overlay={
              <FragmentedDiaryClueOverlay
                stage={fragmentedDiaryClueStage}
                clueText="便利商店"
                onHintComplete={startFragmentedDiaryClueReward}
                onFinish={finishFragmentedDiaryClue}
              />
            }
          />
        );
      }

      if (isFrogCompleteDiaryRevealMode) {
        const frogCompleteTalkLine = activeDiaryReadTalkLines[diaryReadTalkIndex];
        const isFrogCompleteTalkAvatarVisible =
          isDiaryReadTalkVisible && Boolean(frogCompleteTalkLine?.spriteId);

        return (
          <VisualDiaryBookPage
            title={FROG_MOVING_DIARY_FRAGMENT.title}
            pages={BAI_ENTRY_2_COMPLETE_VISUAL_PAGES}
            stagedReveal
            isRevealComplete={isFragmentedDiaryReady}
            onContinue={
              isFragmentedDiaryReady && !isDiaryReadTalkVisible
                ? () => {
                    setDiaryReadTalkIndex(0);
                    setIsDiaryReadTalkVisible(true);
                  }
                : undefined
            }
            continueLabel="點擊繼續"
            rhythm="restoration"
            fadeFirstPage
            scrollBottomPadding={isDiaryReadTalkVisible ? DIARY_DIALOG_SCROLL_BOTTOM_PADDING : 118}
            overlay={isDiaryReadTalkVisible ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={20}
                direction="column"
                justifyContent="flex-end"
                pointerEvents="none"
                onClick={advanceDiaryReadTalk}
              >
                {isFrogCompleteTalkAvatarVisible ? (
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={frogCompleteTalkLine.spriteId}
                      frameIndex={frogCompleteTalkLine.frameIndex}
                    />
                  </Flex>
                ) : null}
                <EventDialogPanel
                  w="100%"
                  borderRadius="0"
                  overflow="hidden"
                  pointerEvents="auto"
                  cursor="pointer"
                  onClick={advanceDiaryReadTalk}
                >
                  {frogCompleteTalkLine?.showName === false ? null : (
                    <Text color="white" fontWeight="700">
                      {frogCompleteTalkLine?.speaker}
                    </Text>
                  )}
                  <Flex flex="1" minH="0" direction="column" justifyContent="center">
                    <Text color="white" fontSize="16px" lineHeight="1.5">
                      {frogCompleteTalkLine?.text}
                    </Text>
                  </Flex>
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={advanceDiaryReadTalk}
                  />
                </EventDialogPanel>
              </Flex>
            ) : null}
          />
        );
      }

      const fragmentPages = buildBaiEntry2FragmentPages(revealLevel);
      const shouldFocusSecondFrogFragment = revealLevel === "second-photo";
      const visibleFragmentPages = shouldFocusSecondFrogFragment ? fragmentPages.slice(1) : fragmentPages;

      return (
        <VisualDiaryBookPage
          title={FROG_MOVING_DIARY_FRAGMENT.title}
          pages={visibleFragmentPages}
          stagedReveal
          isRevealComplete={isFragmentedDiaryReady}
          keepSinglePageCentered={revealLevel === "initial"}
          onContinue={
            isFragmentedDiaryReady
              ? () => {
                startFragmentedDiaryClueReward();
              }
              : undefined
          }
          continueLabel="繼續"
          rhythm="restoration"
          fadeFirstPage
          pageMode="slide"
          slideTotalPages={3}
          slidePageNumberOffset={shouldFocusSecondFrogFragment ? 1 : 0}
          deferSlideTextUntilReady={shouldFocusSecondFrogFragment}
          scrollBottomPadding={118}
          overlay={
            <FragmentedDiaryClueOverlay
              stage={fragmentedDiaryClueStage}
              headingText="獲得提示"
              clueText={shouldFocusSecondFrogFragment ? "前往餐廳" : "前往街道"}
              onHintComplete={startFragmentedDiaryClueReward}
              onFinish={finishFragmentedDiaryClue}
            />
          }
        />
      );
    }

    if (isBeigoProfileMode) {
      return (
        <Flex
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#F6F0E4"
        >
          <Flex
            position="absolute"
            inset="0"
            opacity={0.62}
            bgImage={[
              "radial-gradient(circle at 28px 24px, rgba(183,155,128,0.22) 0 4px, transparent 5px)",
              "radial-gradient(circle at 104px 66px, rgba(183,155,128,0.15) 0 3px, transparent 4px)",
              "radial-gradient(circle at 172px 38px, rgba(183,155,128,0.18) 0 3px, transparent 4px)",
            ].join(",")}
            bgSize="164px 164px"
            pointerEvents="none"
          />
          <Flex position="relative" zIndex={1} direction="column" flex="1" minH="0">
            <Flex
              position="relative"
              flex="1"
              minH="0"
              direction="column"
              overflow="hidden"
              bgColor="#F6F0E4"
            >
              <Flex
                position="relative"
                h="356px"
                minH="356px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={`beigo-dot-${dotLeft}`}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt="54px"
                  pb="34px"
                >
                  <Flex
                    alignSelf="flex-end"
                    border="2px solid #8B6D54"
                    px="12px"
                    py="5px"
                    bgColor="rgba(255,255,255,0.86)"
                  >
                    <Text color="#8B6D54" fontSize="20px" fontWeight="700" lineHeight="1">
                      小貝狗
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt="6px">
                    <img
                      src="/images/428出圖/立繪/小貝狗/3_開心.png"
                      alt="小貝狗"
                      style={{
                        width: "216px",
                        maxWidth: "86%",
                        height: "216px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text color="#111111" fontSize="18px" fontWeight="800" lineHeight="1.35" textAlign="center">
                    總是開開心心的小可愛
                  </Text>
                </Flex>
              </Flex>
              <Flex
                position="relative"
                flex="1"
                minH="0"
                bgColor="#977458"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                borderTop="8px solid #BD9A7E"
                direction="column"
                alignItems="center"
                justifyContent="center"
                px="28px"
                pt="46px"
                pb="48px"
              >
                <Flex flex="1" minH="0" />
                <Flex
                  as="button"
                  h="44px"
                  minW="204px"
                  px="30px"
                  borderRadius="6px"
                  bgColor="#806248"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={onBeigoProfileComplete}
                >
                  <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                    繼續
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
    }

    if (isPhotoDiaryRevealMode && firstPhotoDiaryStage === "photo-slide") {
      return (
        <PhotoDiarySlidePage
          photoImagePath={activePhotoRevealSnapshot.previewImage}
          photoRevealName={activePhotoRevealEntry.discoveryLabel}
        />
      );
    }

    if (isGuidedJournalRevealMode && diaryRevealStep === "book") {
      return (
          <Flex
            h="100%"
            minH="0"
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap="18px"
            px="28px"
            bgColor="#F7F0E4"
            position="relative"
            overflow="hidden"
          >
            <Flex
              position="absolute"
              inset="0"
              pointerEvents="none"
              opacity={0.72}
              backgroundImage={[
                "radial-gradient(circle at 18px 22px, rgba(128, 94, 63, 0.22) 0 2px, transparent 2.7px)",
                "radial-gradient(circle at 52px 64px, rgba(128, 94, 63, 0.17) 0 1.5px, transparent 2.2px)",
                "radial-gradient(circle at 94px 18px, rgba(128, 94, 63, 0.2) 0 1.8px, transparent 2.5px)",
                "radial-gradient(circle at 126px 72px, rgba(128, 94, 63, 0.16) 0 1.5px, transparent 2.2px)",
                "radial-gradient(circle at 24px 100px, rgba(128, 94, 63, 0.16) 0 1.4px, transparent 2px)",
                "radial-gradient(circle at 78px 108px, rgba(128, 94, 63, 0.14) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 142px 34px, rgba(128, 94, 63, 0.18) 0 1.6px, transparent 2.3px)",
                "radial-gradient(circle at 112px 124px, rgba(128, 94, 63, 0.13) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 38px 42px, rgba(128, 94, 63, 0.15) 0 1.4px, transparent 2px)",
                "radial-gradient(circle at 72px 18px, rgba(128, 94, 63, 0.13) 0 1.2px, transparent 1.9px)",
                "radial-gradient(circle at 104px 86px, rgba(128, 94, 63, 0.14) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 12px 72px, rgba(128, 94, 63, 0.12) 0 1.2px, transparent 1.9px)",
              ].join(", ")}
              backgroundSize="78px 72px, 86px 84px, 68px 94px, 98px 76px, 58px 88px, 106px 92px, 74px 106px, 92px 68px, 82px 74px, 64px 102px, 112px 78px, 72px 112px"
              backgroundPosition="0 0, 18px 10px, 34px 22px, 4px 34px, 52px 6px, 10px 54px, 62px 30px, 28px 70px, 76px 48px, 46px 88px, 88px 12px, 6px 92px"
              animation={`${diaryDotDrift} 13s linear infinite`}
            />
            <Flex
              w="72%"
              maxW="280px"
              borderRadius="12px"
              overflow="hidden"
              boxShadow="0 14px 28px rgba(64,44,24,0.16)"
              position="relative"
              zIndex={1}
            >
              <img
                src="/images/comic/book.jpg"
                alt="日記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
            <Text color="#6C5641" fontSize="15px" fontWeight="700" textAlign="center" lineHeight="1.6" position="relative" zIndex={1}>
              交換日記
            </Text>
            <Flex
              as="button"
              h="42px"
              px="18px"
              borderRadius="999px"
              bgColor="#9D7859"
              alignItems="center"
              justifyContent="center"
              position="relative"
              zIndex={1}
              cursor="pointer"
              boxShadow="0 8px 18px rgba(100,72,45,0.18)"
              transition="transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease"
              _hover={{ bgColor: "#A98362", boxShadow: "0 10px 20px rgba(100,72,45,0.22)" }}
              _active={{ bgColor: "#806248", transform: "translateY(2px) scale(0.97)", boxShadow: "0 3px 8px rgba(100,72,45,0.18)" }}
              onClick={() => {
                if (isPhotoDiaryRevealMode) {
                  if (isFirstPhotoDiaryRevealMode) {
                    finalizeDiaryFirstRevealReward("naotaro-basic");
                    const next = loadPlayerProgress();
                    setStickerCollection(next.stickerCollection);
                    setSunbeastProgress(next);
                    setSunbeastFirstRevealPhase("done");
                    setSunbeastFirstRevealQuestionCount(0);
                    setSunbeastIntroStep(null);
                  }
                  setFirstPhotoDiaryStage("photo-slide");
                  setDiaryRevealStep("idle");
                  return;
                }
                setDiaryRevealStep("unlocking");
              }}
            >
              <Text color="white" fontSize="14px" fontWeight="700">
                打開日記
              </Text>
            </Flex>
          </Flex>
      );
    }

    if (activeTab === "sunbeast") {
      const collectionCards = buildSunbeastCollectionCards(sunbeastProgress);
      const isSunbeastFirstRevealAnimating =
        isSunbeastGuidedMode &&
        (sunbeastFirstRevealPhase === "questions" || sunbeastFirstRevealPhase === "naotaro");
      const animatedQuestionCards = Array.from({ length: 12 }, (_, index) => ({
        id: `first-reveal-${index + 1}`,
        name: "???",
        state: "unknown" as const,
        isClickable: false,
      }));
      const animatedRevealCards =
        sunbeastFirstRevealPhase === "questions"
          ? animatedQuestionCards.slice(0, sunbeastFirstRevealQuestionCount)
          : sunbeastFirstRevealPhase === "naotaro"
            ? [
                {
                  id: "naotaro",
                  name: "直太郎",
                  state: "discovered" as const,
                  imagePath: SUNBEAST_REGISTRY.naotaro.imagePath,
                  sunbeastId: "naotaro" as const,
                  isClickable: false,
                },
                ...animatedQuestionCards.slice(1),
              ]
            : collectionCards;
      const visibleCollectionCards =
        isSunbeastFirstRevealAnimating
          ? animatedRevealCards
          : activeSunbeastFilter === "all"
            ? collectionCards
            : collectionCards.filter((card) => card.state === activeSunbeastFilter);
      const visibleSunbeastFilters = ENABLE_SUNBEAST_HINT_SYSTEM
        ? SUNBEAST_FILTERS
        : SUNBEAST_FILTERS.filter((filter) => filter.id !== "hint");
      const showSunbeastIntroDialog = ENABLE_SUNBEAST_GUIDANCE_SYSTEM && sunbeastIntroStep !== null;
      const isSunbeastNaotaroGuideStep = sunbeastIntroStep === 1;
      const isSunbeastShadowPointerStep =
        ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && sunbeastShadowGuideStep === 2;
      const isSunbeastCollectionBlocked =
        showSunbeastIntroDialog ||
        (ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && !isSunbeastShadowPointerStep);
      const activeShadowGuideCard = collectionCards.find(
        (card) => card.id === sunbeastShadowGuideTargetId,
      );
      const chickenGuideCard = collectionCards.find(
        (card) => card.id === "chicken" && card.state === "hint",
      );
      const introSpeaker = sunbeastIntroStep === 1 ? "小貝狗" : "小麥";
      const introAvatarSpriteId = sunbeastIntroStep === 1 ? "beigo" : "mai";
      const introAvatarFrameIndex = sunbeastIntroStep === 1 ? 1 : 1; // 小貝狗開心表情／小麥表情2（0-based index）
      const introText =
        sunbeastIntroStep === 0
          ? "黃金獵犬出現在日記上了！對，是小白常常提到的直太郎。"
          : "點點看小日獸吧。";

      const handleSunbeastTopBack = () => {
        if (sunbeastView === "detail-naotaro") {
          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "complete" : "idle");
          setSunbeastView("collection");
          return;
        }
        if (
          sunbeastView === "detail-frog" ||
          sunbeastView === "detail-chicken" ||
          sunbeastView === "detail-generic" ||
          sunbeastView === "detail-unknown"
        ) {
          setSunbeastView("collection");
          return;
        }
        onClose();
      };
      const completeSunbeastShadowGuide = () => {
        const current = loadPlayerProgress();
        const next = {
          ...current,
          hasSeenSunbeastShadowGuide: true,
          hasUnlockedSunbeastFrogHint: true,
          hasUnlockedSunbeastChickenHint: true,
        };
        savePlayerProgress(next);
        setSunbeastProgress(next);
        setIsSunbeastShadowGuideVisible(false);
        setSunbeastShadowGuideStep(0);
      };
      const openSunbeastHintCard = (card: SunbeastCollectionCard) => {
        completeSunbeastShadowGuide();
        setSelectedSunbeastCardId(card.id);
        setActiveGuidedSunbeastHintId(
          card.id === "chicken" ? "chicken" : card.id === "frog" ? "frog" : null,
        );
        setSunbeastHintTalkStep(0);
        setIsSunbeastHintTalkVisible(true);
        setSunbeastView(getSunbeastDetailView(card));
      };
      const isNaotaroDetail = sunbeastView === "detail-naotaro";
      const isFrogDetail = sunbeastView === "detail-frog";
      const isChickenDetail = sunbeastView === "detail-chicken";
      const isGenericSunbeastDetail = sunbeastView === "detail-generic";
      const isGuidedChickenDetail = isSunbeastGuidedMode && isChickenDetail;
      const selectedSunbeastCard = selectedSunbeastCardId
        ? collectionCards.find((card) => card.id === selectedSunbeastCardId)
        : null;
      const selectedSunbeastId =
        selectedSunbeastCard?.sunbeastId ??
        (selectedSunbeastCardId && isSunbeastId(selectedSunbeastCardId) ? selectedSunbeastCardId : null);
      const selectedSunbeastEntry = selectedSunbeastId ? SUNBEAST_REGISTRY[selectedSunbeastId] : null;
      const selectedSunbeastCaptures =
        sunbeastProgress && selectedSunbeastId
          ? getSunbeastPhotoCaptures(sunbeastProgress, selectedSunbeastId)
          : [];
      const selectedSunbeastPhotoRequirement = selectedSunbeastEntry?.photoRequirement ?? 1;
      const selectedSunbeastPhotoCount = Math.min(
        selectedSunbeastPhotoRequirement,
        selectedSunbeastCaptures.length,
      );
      const selectedLatestSunbeastCapture =
        selectedSunbeastCaptures[selectedSunbeastCaptures.length - 1] ?? null;
      const selectedSunbeastMissingPhotoCount = Math.max(
        0,
        selectedSunbeastPhotoRequirement - selectedSunbeastPhotoCount,
      );
      const isSelectedSunbeastResolved =
        selectedSunbeastMissingPhotoCount === 0 || selectedSunbeastCard?.state === "discovered";
      const isGuidedGenericDetail = isGuidedJournalRevealMode && isGenericSunbeastDetail;
      const selectedHintDetail =
        ENABLE_SUNBEAST_HINT_SYSTEM && selectedSunbeastCard?.state === "hint" && selectedSunbeastCardId
          ? SUNBEAST_HINT_DETAIL_CONTENT[selectedSunbeastCardId]
          : null;
      const isChickenHintSelected = selectedSunbeastCardId === "chicken";
      const isFrogHintSelected = selectedSunbeastCardId === "frog";
      const frogHintPhotoAttemptCount = getFrogDiaryPhotoAttemptCount(sunbeastProgress);
      const isFrogDiaryLeadUnlocked = hasFrogDiaryLead(sunbeastProgress);
      const frogDiaryHintItems = [
        {
          key: "mart",
          label: "便利商店",
          icon: SUNBEAST_HINT_PLACE_ICON_PATHS["便利商店"],
          unlocked: isFrogDiaryLeadUnlocked,
          hintText: "日記提到客廳出現幾瓶便利商店飲料，線索指向便利商店。",
        },
        {
          key: "street",
          label: "街道",
          icon: SUNBEAST_HINT_PLACE_ICON_PATHS["街道"],
          unlocked: frogHintPhotoAttemptCount >= 1,
          hintText: "便利商店的青蛙影子留下了下一段線索：前往街道。",
        },
        {
          key: "restaurant",
          label: "餐廳",
          icon: SUNBEAST_HINT_PLACE_ICON_PATHS["餐廳"],
          unlocked: frogHintPhotoAttemptCount >= 2,
          hintText: "街道線索補上後，日記又指向餐廳。",
        },
      ] as const;
      const advanceSunbeastHintTalk = () => {
        if (sunbeastHintTalkStep === 0 && selectedHintDetail) {
          setSunbeastHintTalkStep(1);
          return;
        }
        setIsSunbeastHintTalkVisible(false);
        setSunbeastHintTalkStep(0);
        if (activeGuidedSunbeastHintId === "frog" && selectedSunbeastCardId === "frog") {
          if (chickenGuideCard) {
            setSelectedSunbeastCardId(null);
            setActiveGuidedSunbeastHintId(null);
            setSunbeastView("collection");
            setSunbeastShadowGuideTargetId("chicken");
            setSunbeastShadowTargetRect(null);
            setSunbeastShadowGuideStep(2);
            setIsSunbeastShadowGuideVisible(true);
            return;
          }
          setActiveGuidedSunbeastHintId(null);
          onSunbeastHintGuideComplete?.();
          return;
        }
        if (activeGuidedSunbeastHintId === "chicken" && selectedSunbeastCardId === "chicken") {
          setActiveGuidedSunbeastHintId(null);
          onSunbeastHintGuideComplete?.();
        }
      };
      const isChickenHintOneUnlocked = Boolean(
        sunbeastProgress?.hasUnlockedSunbeastChickenHint ||
          sunbeastProgress?.hasUnlockedSpecialMap ||
          sunbeastProgress?.hasTriggeredOfficeSunbeastChickenEvent,
      );
      const isChickenHintTwoUnlocked = Boolean(
        sunbeastProgress?.hasUnlockedSpecialMap || sunbeastProgress?.hasTriggeredOfficeSunbeastChickenEvent,
      );
      const selectedHintTalkReply = isChickenHintSelected ? (
        isChickenHintTwoUnlocked ? (
          "嗷～通過特殊地圖，到達指定地點看看嗷！"
        ) : (
          "嗷～先前往街道打聽看看嗷！"
        )
      ) : (
        FROG_ACTIVE_CLUE_TEXT
      );
      const isNaotaroUnlockOverlayOpen =
        isNaotaroDetail &&
        (sunbeastDetailRevealStep === "unlock-intro" ||
          sunbeastDetailRevealStep === "unlock-diary" ||
          sunbeastDetailRevealStep === "unlock-street" ||
          sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "unlock-outro");
      const isNaotaroDialogOpen = isNaotaroDetail && sunbeastDetailRevealStep === "dialog";
      const isDiaryUnlockedInReveal =
        sunbeastDetailRevealStep === "unlock-diary" ||
        sunbeastDetailRevealStep === "unlock-street" ||
        sunbeastDetailRevealStep === "unlock-clues" ||
        sunbeastDetailRevealStep === "complete";
      const shouldUseInlinePhotoDialog = isSunbeastGuidedMode && isNaotaroDialogOpen;
      const shouldUseInlineDiaryUnlock = isSunbeastGuidedMode && sunbeastDetailRevealStep === "unlock-diary";
      const shouldUseInlineRevealPanel = shouldUseInlinePhotoDialog || shouldUseInlineDiaryUnlock;
      const isStreetUnlockedInReveal =
        !isFirstPhotoDiaryRevealMode &&
        (sunbeastDetailRevealStep === "unlock-street" ||
          sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "complete");
      const isClueUnlockedInReveal =
        !isFirstPhotoDiaryRevealMode &&
        (sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "unlock-outro" ||
          sunbeastDetailRevealStep === "complete");
      const isGuidedNaotaroDetail = isSunbeastGuidedMode && isNaotaroDetail;
      const isUnlockOutro = sunbeastDetailRevealStep === "unlock-outro";
      const isDiaryUnlockAnimating = sunbeastDetailRevealStep === "unlock-diary";
      const isStreetUnlockAnimating = sunbeastDetailRevealStep === "unlock-street";
      const isClueUnlockAnimating = sunbeastDetailRevealStep === "unlock-clues";
      const naotaroRevealFooterText =
        sunbeastDetailRevealStep === "dialog"
          ? "早上拍下來的直太郎照片出現在這裡"
          : sunbeastDetailRevealStep === "unlock-intro"
            ? "咦，好像有新的內容出現了。"
            : sunbeastDetailRevealStep === "unlock-diary"
              ? "先看看這篇日記吧。"
              : sunbeastDetailRevealStep === "unlock-street"
                ? "也解鎖了新的地點：街道。"
                : "還留下了兩個小日獸線索。";
      const advanceNaotaroRevealFooter = () => {
        setSunbeastDetailRevealStep(isFirstPhotoDiaryRevealMode ? "unlock-diary" : "unlock-intro");
      };
      const visibleSunbeastDetailInfo = isFirstPhotoDiaryRevealMode
        ? SUNBEAST_DETAIL_INFO.filter((item) => item.kind === "journal")
        : SUNBEAST_DETAIL_INFO;
      const activeSunbeastDetailItem =
        visibleSunbeastDetailInfo.find((item) => item.kind === activeSunbeastDetailTab) ??
        SUNBEAST_DETAIL_INFO[0];
      const isActiveDetailJournal = activeSunbeastDetailItem.kind === "journal";
      const isActiveDetailPlace = activeSunbeastDetailItem.kind === "place";
      const isActiveDetailClue = activeSunbeastDetailItem.kind === "clue";
      const isActiveDetailUnlocked =
        isActiveDetailJournal
          ? isDiaryUnlockedInReveal
          : isActiveDetailPlace
            ? isStreetUnlockedInReveal
            : isClueUnlockedInReveal;
      const isActiveDetailAnimating =
        isActiveDetailJournal
          ? isDiaryUnlockAnimating
          : isActiveDetailPlace
            ? isStreetUnlockAnimating
            : isClueUnlockAnimating;
      const sunbeastDetailSection = (
        <Flex
          ref={sunbeastDetailScrollRef}
          position="relative"
          flex="1"
          minH="0"
          direction="column"
          overflow="hidden"
          css={{ scrollbarWidth: "none" }}
          bgColor="#F6F0E4"
        >
          {isNaotaroDetail ? (
            <>
              <Flex
                position="relative"
                h={isGuidedNaotaroDetail ? "356px" : "260px"}
                minH={isGuidedNaotaroDetail ? "356px" : "260px"}
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt={isGuidedNaotaroDetail ? "54px" : "40px"}
                  pb={isGuidedNaotaroDetail ? "34px" : "10px"}
                >
                  <Flex
                    alignSelf="flex-end"
                    border="2px solid #8B6D54"
                    px="12px"
                    py="5px"
                    bgColor="rgba(255,255,255,0.86)"
                  >
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      直太郎
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt={isGuidedNaotaroDetail ? "6px" : "2px"}>
                    <img
                      src="/images/428出圖/拍照動物/黃金獵犬.png"
                      alt="直太郎"
                      style={{
                        width: isGuidedNaotaroDetail ? "224px" : "156px",
                        maxWidth: "86%",
                        height: isGuidedNaotaroDetail ? "224px" : "156px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text
                    color="#977458"
                    fontSize={isGuidedNaotaroDetail ? "18px" : "15px"}
                    fontWeight="500"
                    lineHeight="1.35"
                    textAlign="right"
                  >
                    脫線的善良狗狗!
                  </Text>
                </Flex>
              </Flex>

              <Flex
                position="relative"
                order={2}
                flex="1"
                minH="0"
                bgColor="#977458"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                borderTop="8px solid #BD9A7E"
                overflow="hidden"
              >
                {isSunbeastGuidedMode ? (
                  <Flex direction="column" w="100%" h="100%" px="28px" pt="46px" pb="48px" alignItems="center">
                    {sunbeastDetailRevealStep === "dialog" ? (
                      <>
                        <Flex
                          flex="1"
                          minH="0"
                          w="100%"
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          gap="24px"
                        >
                          <Flex
                            bgColor="#FFFDF9"
                            borderRadius="4px"
                            p="9px 9px 24px"
                            transform="rotate(5deg)"
                            boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                            w="160px"
                            h="196px"
                            position="relative"
                            overflow="visible"
                            flexShrink={0}
                            animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                            transformOrigin="50% 100%"
                          >
                            <Flex
                              position="absolute"
                              top="-7px"
                              left="50%"
                              transform="translateX(-50%) rotate(-2deg)"
                              w="62px"
                              h="14px"
                              bgColor="#E7D7C4"
                              opacity={0.95}
                            />
                            <Flex direction="column" gap="8px" w="100%" h="100%">
                              <Flex
                                w="100%"
                                h="126px"
                                borderRadius="3px"
                                overflow="hidden"
                                bgColor="#DDD2C6"
                                backgroundImage={`url(${selectedLatestSunbeastCapture?.previewImage ?? effectivePhotoSnapshot.previewImage})`}
                                backgroundSize="cover"
                                backgroundPosition="center"
                                backgroundRepeat="no-repeat"
                              />
                              <Flex direction="column" alignItems="center" gap="5px">
                                <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                                  直太郎
                                </Text>
                                <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                                  ★ ★ ★
                                </Text>
                              </Flex>
                            </Flex>
                          </Flex>

                          <Text color="#FFFFFF" fontSize="16px" fontWeight="400" lineHeight="1.45" textAlign="center" w="112%" maxW="340px">
                            差點趕不上捷運，尾巴被夾到了，
                            <br />
                            不過似乎還是不影響開心趕上車呢
                          </Text>
                        </Flex>

                        <Flex
                          as="button"
                          h="44px"
                          minW="204px"
                          px="30px"
                          borderRadius="6px"
                          bgColor="#806248"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => setSunbeastDetailRevealStep("unlock-diary")}
                        >
                          <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                            下一步
                          </Text>
                        </Flex>
                      </>
                    ) : shouldUseInlineDiaryUnlock ? (
                      <>
                        <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="34px">
                          <Flex
                            w="330px"
                            maxW="100%"
                            h="216px"
                            borderRadius="6px"
                            overflow="hidden"
                            bgColor="#EFE6D9"
                            border="1.5px solid #FFFFFF"
                            boxShadow="0 8px 16px rgba(88,59,33,0.12)"
                          >
                            <img
                              src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                              alt="相關的日記"
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </Flex>
                          <Text color="#FFFFFF" fontSize="17px" fontWeight="400" lineHeight="1.45" textAlign="center">
                            還原完整的日記。
                          </Text>
                        </Flex>

                        <Flex
                          as="button"
                          h="44px"
                          minW="204px"
                          px="30px"
                          borderRadius="6px"
                          bgColor="#806248"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setActiveTab("journal");
                            setJournalView("entry-bai-1");
                            setBaiEntry1VisualPageIndex(0);
                            setIsBaiEntry1VisualRevealComplete(false);
                            setIsBaiEntry1TitleRevealed(false);
                            setIsBaiEntry1FirstTextRevealed(false);
                            setIsBaiEntry1NaotaroOpenReveal(true);
                            setIsDiaryReadTalkVisible(false);
                            setDiaryReadTalkIndex(0);
                            setIsComicReadMode(false);
                            setIsComicControlsVisible(false);
                            setShowComicReadHint(false);
                            setComicPageIndex(0);
                            setDiaryRevealStep("idle");
                          }}
                        >
                          <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
                            還原完整的日記。
                          </Text>
                        </Flex>
                      </>
                    ) : null}
                  </Flex>
                ) : (
                  <Flex direction="column" w="100%" h="100%">
                    <Flex
                      flex="1"
                      minH="0"
                      px="24px"
                      pt="16px"
                      pb="18px"
                      w="100%"
                      alignItems="center"
                      gap="22px"
                    >
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px"
                        transform="rotate(5deg)"
                        boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                        w="140px"
                        h="166px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        transformOrigin="50% 100%"
                      >
                        <Flex
                          position="absolute"
                          top="-7px"
                          left="50%"
                          transform="translateX(-50%) rotate(-2deg)"
                          w="62px"
                          h="14px"
                          bgColor="#E7D7C4"
                          opacity={0.95}
                        />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="100px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url(${selectedLatestSunbeastCapture?.previewImage ?? effectivePhotoSnapshot.previewImage})`}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              直太郎
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>

                      <Text
                        color="#FFFFFF"
                        fontSize="14px"
                        fontWeight="400"
                        lineHeight="1.48"
                        textAlign="left"
                        flex="1"
                        minW="0"
                      >
                        差點趕不上捷運，尾巴被夾到了，不過似乎還是不影響開心趕上車呢
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Flex>

              {isSunbeastGuidedMode ? null : (
              <Flex
                position="relative"
                order={1}
                h="180px"
                minH="180px"
                borderTop="0"
                bgColor="#BD9A7E"
                flexShrink={0}
                animation={isActiveDetailAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                opacity={isActiveDetailUnlocked || !isSunbeastGuidedMode ? 1 : 0.48}
              >
                <Flex
                  w="54px"
                  flexShrink={0}
                  pt="16px"
                  alignItems="center"
                  direction="column"
                  gap="16px"
                  color="rgba(255,255,255,0.9)"
                  borderRight="1px solid rgba(128,98,72,0.55)"
                >
                  {visibleSunbeastDetailInfo.map((railItem) => {
                    const isRailActive = railItem.kind === activeSunbeastDetailTab;
                    const isRailUnlocked =
                      railItem.kind === "journal"
                        ? isDiaryUnlockedInReveal
                        : railItem.kind === "place"
                          ? isStreetUnlockedInReveal
                          : isClueUnlockedInReveal;

                    return (
                      <Flex
                        key={railItem.kind}
                        as="button"
                        w="30px"
                        h="30px"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="999px"
                        bgColor={isRailActive ? "rgba(255,255,255,0.22)" : "transparent"}
                        color={isRailActive ? "#FFFFFF" : "rgba(255,255,255,0.72)"}
                        fontSize={railItem.kind === "clue" ? "17px" : "15px"}
                        opacity={isRailUnlocked || !isSunbeastGuidedMode ? 1 : 0.46}
                        cursor={isRailUnlocked || !isSunbeastGuidedMode ? "pointer" : "default"}
                        aria-label={railItem.eyebrow}
                        onClick={() => {
                          if (isSunbeastGuidedMode && !isRailUnlocked) return;
                          setActiveSunbeastDetailTab(railItem.kind);
                        }}
                      >
                        <SunbeastInfoIcon kind={railItem.kind} />
                      </Flex>
                    );
                  })}
                </Flex>

                <Flex flex="1" minW="0" px="20px" py="14px" alignItems="center" gap="14px">
                  <Flex direction="column" flex="1" minW="0" gap="9px" alignItems="flex-start">
                    <Flex bgColor="#FFFFFF" borderRadius="4px" px="12px" py="4px">
                      <Text color="#806248" fontSize="16px" fontWeight="400" lineHeight="1.2">
                        {activeSunbeastDetailItem.eyebrow}
                      </Text>
                    </Flex>
                    <Text
                      color="#FFFFFF"
                      fontSize="14px"
                      fontWeight="400"
                      lineHeight="1.35"
                      whiteSpace="pre-line"
                    >
                      {activeSunbeastDetailItem.body}
                    </Text>
                    <Flex
                      as="button"
                      h="28px"
                      minW="82px"
                      px="16px"
                      borderRadius="4px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor={isActiveDetailJournal || isActiveDetailClue ? "pointer" : "default"}
                      onClick={() => {
                        if (isActiveDetailJournal) {
                          setActiveTab("journal");
                          setBaiEntry1VisualPageIndex(0);
                          setIsBaiEntry1VisualRevealComplete(false);
                          setIsBaiEntry1TitleRevealed(false);
                          setIsBaiEntry1FirstTextRevealed(false);
                          setIsBaiEntry1NaotaroOpenReveal(isNaotaroDetail);
                          setIsDiaryReadTalkVisible(false);
                          setDiaryReadTalkIndex(0);
                          setJournalView("entry-bai-1");
                          return;
                        }
                        if (isActiveDetailClue) {
                          setSelectedSunbeastCardId("frog");
                          setSunbeastHintTalkStep(0);
                          setIsSunbeastHintTalkVisible(true);
                          setSunbeastView("detail-unknown");
                          setSunbeastDetailRevealStep("complete");
                        }
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="14px" fontWeight="500" lineHeight="1">
                        {activeSunbeastDetailItem.action}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex
                    w="126px"
                    h="82px"
                    flexShrink={0}
                    border="1.5px solid #FFFFFF"
                    borderRadius="6px"
                    overflow="hidden"
                    bgColor={isActiveDetailClue ? "#BD9A7E" : "#EFE6D9"}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isActiveDetailJournal ? (
                      <img
                        src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                        alt="相關的日記"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : isActiveDetailPlace ? (
                      <img
                        src="/walk/Sidewalk_Day.png"
                        alt="街道"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Flex alignItems="center" justifyContent="center" gap="10px">
                        <img
                          src={FROG_SHADOW_IMAGE_PATH}
                          alt="青蛙線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                        <img
                          src={ROOSTER_SHADOW_IMAGE_PATH}
                          alt="公雞線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>
              )}

              {isSunbeastGuidedMode ? null : (
                <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                  <Flex
                    as="button"
                    h="40px"
                    w="104px"
                    borderRadius="0 4px 4px 0"
                    bgColor="#9D7859"
                    alignItems="center"
                    justifyContent="center"
                    gap="8px"
                    boxShadow="0 4px 7px rgba(10,10,10,0.25)"
                    onClick={handleSunbeastTopBack}
                  >
                    <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">
                      ‹
                    </Text>
                    <Text color="#FFFFFF" fontSize="17px" fontWeight="400">
                      返回
                    </Text>
                  </Flex>
                </Flex>
              )}
            </>
          ) : isFrogDetail ? (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[28, 92, 148, 214, 286, 348].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "28px" : "14px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-12px"
                  right="-28px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "112%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt="36px"
                  pb="18px"
                >
                  <Flex
                    alignSelf="flex-end"
                    border="2px solid #8B6D54"
                    px="12px"
                    py="5px"
                    bgColor="rgba(255,255,255,0.88)"
                  >
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      青蛙
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center">
                    <img
                      src={FROG_IMAGE_PATH}
                      alt="青蛙"
                      style={{
                        width: "180px",
                        maxWidth: "86%",
                        height: "180px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text color="#977458" fontSize="15px" fontWeight="500" lineHeight="1.35" textAlign="right">
                    青蛙
                  </Text>
                </Flex>
              </Flex>

              <Flex
                position="relative"
                flex="1"
                minH="0"
                bgColor="#977458"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="74px 74px"
                backgroundPosition="top left"
                borderTop="8px solid #BD9A7E"
                overflow="hidden"
              >
                <Flex
                  w="100%"
                  h="100%"
                  position="relative"
                  px="0"
                  py="0"
                >
                  {FROG_DISCOVERY_PHOTO_CARDS.map((card, index) => {
                    const cardLeft = "left" in card ? card.left : undefined;
                    const cardRight = "right" in card ? card.right : undefined;
                    return (
                      <Flex
                        key={card.label}
                        direction="column"
                        alignItems="center"
                        gap="7px"
                        w="148px"
                        h="194px"
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px 9px 14px"
                        boxShadow="0 12px 22px rgba(78,54,32,0.18)"
                        transform={`rotate(${card.rotate})`}
                        transformOrigin="50% 14px"
                        position="absolute"
                        left={cardLeft}
                        right={cardRight}
                        top={card.top}
                        zIndex={index === 2 ? 1 : 2}
                        animation={`${frogDiscoveryPhotoSlideIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) ${card.delay} both`}
                        css={{
                          "--frog-photo-rotate": card.rotate,
                          "--frog-photo-enter-rotate": card.enterRotate,
                          "--frog-photo-settle-rotate": card.settleRotate,
                        }}
                      >
                        <Flex
                          position="absolute"
                          top="-8px"
                          left="50%"
                          transform={`translateX(-50%) rotate(${index === 0 ? "-3deg" : index === 1 ? "4deg" : "2deg"})`}
                          w="66px"
                          h="15px"
                          bgColor="#E6D4C0"
                          opacity={0.95}
                          boxShadow="0 2px 4px rgba(92,63,40,0.08)"
                        />
                        <Flex
                          w="100%"
                          h="118px"
                          borderRadius="3px"
                          overflow="hidden"
                          bgColor="#FBFAF6"
                          border="1px solid rgba(92,75,60,0.18)"
                          alignItems="center"
                          justifyContent="center"
                          position="relative"
                        >
                          <img
                            src={card.imagePath}
                            alt=""
                            aria-hidden="true"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              filter: "grayscale(1) contrast(1.6) brightness(1.24)",
                              opacity: 0.68,
                              mixBlendMode: "multiply",
                            }}
                          />
                          <Flex
                            position="absolute"
                            inset="0"
                            pointerEvents="none"
                            bgImage="linear-gradient(rgba(255,255,255,0.32), rgba(255,255,255,0.32))"
                          />
                          <img
                            src={FROG_IMAGE_PATH}
                            alt={`青蛙照片：${card.label}`}
                            style={{
                              position: "absolute",
                              left: card.frogLeft,
                              top: card.frogTop,
                              width: card.frogWidth,
                              height: "auto",
                              objectFit: "contain",
                              transform: "translate(-50%, -50%)",
                              display: "block",
                              filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.62))",
                            }}
                          />
                        </Flex>
                        <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                          呱
                        </Text>
                        <Text color="#F2C84B" fontSize="17px" lineHeight="1">
                          ★ ★ ★
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>

              <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                <Flex
                  as="button"
                  h="40px"
                  w="104px"
                  borderRadius="0 4px 4px 0"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 4px 7px rgba(10,10,10,0.25)"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">
                    ‹
                  </Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </>
          ) : isChickenDetail ? (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex position="relative" zIndex={2} direction="column" w="100%" h="100%" pl="52px" pr="24px" pt="36px" pb="18px">
                  <Flex alignSelf="flex-end" border="2px solid #8B6D54" px="12px" py="5px" bgColor="rgba(255,255,255,0.86)">
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      公雞
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center">
                    <img
                      src={ROOSTER_IMAGE_PATH}
                      alt="公雞"
                      style={{ width: "180px", maxWidth: "86%", height: "180px", objectFit: "contain", display: "block" }}
                    />
                  </Flex>
                  <Text color="#977458" fontSize="15px" fontWeight="500" lineHeight="1.35" textAlign="right">
                    專心工作的白色公雞
                  </Text>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="0"
                px={isGuidedChickenDetail ? "28px" : "24px"}
                pt={isGuidedChickenDetail ? "46px" : "24px"}
                pb={isGuidedChickenDetail ? "48px" : "72px"}
                bgColor="#977458"
                borderTop="8px solid #BD9A7E"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                direction="column"
                gap="16px"
                overflow="hidden"
                alignItems={isGuidedChickenDetail ? "center" : undefined}
              >
                {isGuidedChickenDetail && sunbeastDetailRevealStep === "dialog" ? (
                  <>
                    <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="24px">
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px 9px 24px"
                        transform="rotate(-5deg)"
                        boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                        w="160px"
                        h="196px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                        transformOrigin="50% 100%"
                      >
                        <Flex position="absolute" top="-7px" left="50%" transform="translateX(-50%) rotate(2deg)" w="62px" h="14px" bgColor="#E7D7C4" opacity={0.95} />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="126px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url('${selectedLatestSunbeastCapture?.previewImage ?? ROOSTER_IMAGE_PATH}')`}
                            backgroundSize={selectedLatestSunbeastCapture ? "cover" : "contain"}
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              公雞
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>

                      <Text color="#FFFFFF" fontSize="16px" fontWeight="400" lineHeight="1.45" textAlign="center" w="112%" maxW="340px">
                        在辦公室裡意外拍下的小日獸。
                        <br />
                        牠看起來非常專心，似乎會被工作的氣氛吸引。
                      </Text>
                    </Flex>

                    <Flex
                      as="button"
                      h="44px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => setSunbeastDetailRevealStep("unlock-diary")}
                    >
                      <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                        下一步
                      </Text>
                    </Flex>
                  </>
                ) : isGuidedChickenDetail && sunbeastDetailRevealStep === "unlock-diary" ? (
                  <>
                    <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="34px">
                      <Flex
                        w="330px"
                        maxW="100%"
                        h="216px"
                        borderRadius="6px"
                        overflow="hidden"
                        bgColor="#EFE6D9"
                        border="1.5px solid #FFFFFF"
                        boxShadow="0 8px 16px rgba(88,59,33,0.12)"
                      >
                        <img
                          src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                          alt="相關的日記"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </Flex>
                      <Text color="#FFFFFF" fontSize="17px" fontWeight="400" lineHeight="1.45" textAlign="center">
                        還原完整的日記。
                      </Text>
                    </Flex>

                    <Flex
                      as="button"
                      h="44px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setActiveTab("journal");
                        setJournalView("list");
                        setIsComicReadMode(false);
                        setIsComicControlsVisible(false);
                        setShowComicReadHint(false);
                        setComicPageIndex(0);
                        setDiaryRevealStep("unlocking");
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
                        還原完整的日記。
                      </Text>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex alignItems="center" gap="18px">
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px 9px 22px"
                        transform="rotate(-3deg)"
                        boxShadow="0 10px 18px rgba(88,59,33,0.18)"
                        w="142px"
                        h="176px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                      >
                        <Flex position="absolute" top="-7px" left="50%" transform="translateX(-50%) rotate(2deg)" w="62px" h="14px" bgColor="#E7D7C4" opacity={0.95} />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="106px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url('${selectedLatestSunbeastCapture?.previewImage ?? ROOSTER_IMAGE_PATH}')`}
                            backgroundSize={selectedLatestSunbeastCapture ? "cover" : "contain"}
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              公雞
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Text color="#FFFFFF" fontSize="15px" lineHeight="1.55" flex="1" minW="0">
                        在辦公室裡意外拍下的小日獸。牠看起來非常專心，似乎會被工作的氣氛吸引。
                      </Text>
                    </Flex>
                    <Flex borderRadius="4px" bgColor="#FFFFFF" px="14px" py="12px" direction="column" gap="6px" boxShadow="0 4px 10px rgba(109,82,55,0.08)">
                      <Text color="#806248" fontSize="16px" fontWeight="700" lineHeight="1.2">
                        相關的日記
                      </Text>
                      <Text color="#806248" fontSize="13px" lineHeight="1.45">
                        小日獸記錄出現在圖鑑裡，也帶來了一篇新的交換日記。
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>
              <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                <Flex as="button" h="40px" w="104px" borderRadius="0 4px 4px 0" bgColor="#9D7859" alignItems="center" justifyContent="center" gap="8px" boxShadow="0 4px 7px rgba(10,10,10,0.25)" onClick={handleSunbeastTopBack}>
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">‹</Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">返回</Text>
                </Flex>
              </Flex>
            </>
          ) : isGenericSunbeastDetail && selectedSunbeastEntry ? (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex position="relative" zIndex={2} direction="column" w="100%" h="100%" pl="52px" pr="24px" pt="36px" pb="18px">
                  <Flex alignSelf="flex-end" border="2px solid #8B6D54" px="12px" py="5px" bgColor="rgba(255,255,255,0.86)">
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      {isSelectedSunbeastResolved ? selectedSunbeastEntry.name : selectedSunbeastEntry.unknownName}
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center">
                    <img
                      src={
                        isSelectedSunbeastResolved
                          ? selectedSunbeastEntry.imagePath
                          : selectedSunbeastEntry.shadowImagePath ?? selectedSunbeastEntry.imagePath
                      }
                      alt={isSelectedSunbeastResolved ? selectedSunbeastEntry.name : selectedSunbeastEntry.unknownName}
                      style={{
                        width: "178px",
                        maxWidth: "86%",
                        height: "178px",
                        objectFit: "contain",
                        display: "block",
                        filter: isSelectedSunbeastResolved
                          ? undefined
                          : "brightness(0) saturate(100%) invert(45%) sepia(24%) saturate(739%) hue-rotate(350deg) brightness(85%) contrast(86%)",
                      }}
                    />
                  </Flex>
                  <Text color="#977458" fontSize="15px" fontWeight="500" lineHeight="1.35" textAlign="right">
                    {isSelectedSunbeastResolved ? selectedSunbeastEntry.name : "剪影"}
                  </Text>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="0"
                px={isGuidedGenericDetail ? "24px" : "18px"}
                pt={isGuidedGenericDetail ? "34px" : "24px"}
                pb={isGuidedGenericDetail ? "48px" : "72px"}
                bgColor="#977458"
                borderTop="8px solid #BD9A7E"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                direction="column"
                alignItems="center"
                justifyContent="center"
                gap="18px"
                overflow="hidden"
              >
                {sunbeastDetailRevealStep === "unlock-diary" ? (
                  <>
                    <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="28px">
                      <Flex
                        w="318px"
                        maxW="100%"
                        h="204px"
                        borderRadius="6px"
                        overflow="hidden"
                        bgColor="#EFE6D9"
                        border="1.5px solid #FFFFFF"
                        boxShadow="0 8px 16px rgba(88,59,33,0.12)"
                      >
                        <img
                          src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                          alt="相關的日記"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </Flex>
                      <Text color="#FFFFFF" fontSize="17px" fontWeight="400" lineHeight="1.45" textAlign="center">
                        照片回到日記裡，新的內容開始還原。
                      </Text>
                    </Flex>
                    <Flex
                      as="button"
                      h="44px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setActiveTab("journal");
                        setJournalView("list");
                        setIsComicReadMode(false);
                        setIsComicControlsVisible(false);
                        setShowComicReadHint(false);
                        setComicPageIndex(0);
                        setDiaryRevealStep("unlocking");
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
                        還原日記
                      </Text>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex direction="column" alignItems="center" gap="14px" w="100%">
                      <SunbeastPhotoSlots
                        captures={selectedSunbeastCaptures}
                        requirement={selectedSunbeastPhotoRequirement}
                        fallbackImagePath={selectedSunbeastEntry.imagePath}
                        label={selectedSunbeastEntry.discoveryLabel}
                        compact={selectedSunbeastPhotoRequirement > 1}
                      />
                      <Text color="#FFFFFF" fontSize="15px" lineHeight="1.55" textAlign="center" maxW="320px">
                        {isSelectedSunbeastResolved
                          ? selectedSunbeastEntry.detailCaption
                          : `${selectedSunbeastEntry.incompleteCaption} 還缺 ${selectedSunbeastMissingPhotoCount} 張照片。`}
                      </Text>
                    </Flex>
                    {isGuidedGenericDetail ? (
                      <Flex
                        as="button"
                        h="44px"
                        minW="204px"
                        px="30px"
                        borderRadius="6px"
                        bgColor="#806248"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => {
                          if (selectedSunbeastEntry.diaryEntryIds.length > 0) {
                            setSunbeastDetailRevealStep("unlock-diary");
                            return;
                          }
                          setSunbeastDetailRevealStep("complete");
                          onGuidedFlowComplete?.();
                        }}
                      >
                        <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                          下一步
                        </Text>
                      </Flex>
                    ) : null}
                  </>
                )}
              </Flex>
              {!isGuidedGenericDetail ? (
                <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                  <Flex as="button" h="40px" w="104px" borderRadius="0 4px 4px 0" bgColor="#9D7859" alignItems="center" justifyContent="center" gap="8px" boxShadow="0 4px 7px rgba(10,10,10,0.25)" onClick={handleSunbeastTopBack}>
                    <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">‹</Text>
                    <Text color="#FFFFFF" fontSize="17px" fontWeight="400">返回</Text>
                  </Flex>
                </Flex>
              ) : null}
            </>
          ) : (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt="36px"
                  pb="18px"
                >
                  <Flex
                    alignSelf="flex-end"
                    px="22px"
                    py="8px"
                    border="2px solid #AB9E90"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.9)"
                  >
                    <Text color="#8B6D54" fontSize="20px" fontWeight="700" lineHeight="1">
                      ???
                    </Text>
                  </Flex>
                  <Flex flex="1" alignItems="center" justifyContent="center" minH="0" position="relative">
                    {selectedHintDetail ? (
                      <Flex
                        w="172px"
                        h="172px"
                        borderRadius="999px"
                        bgColor="rgba(218,191,138,0.18)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {selectedSunbeastCard?.imagePath ? (
                          <img
                            src={selectedSunbeastCard.imagePath}
                            alt=""
                            style={{ width: "156px", height: "156px", objectFit: "contain", display: "block" }}
                          />
                        ) : (
                          <Text color="#9D7859" fontSize="76px" lineHeight="1" fontWeight="700">
                            ?
                          </Text>
                        )}
                      </Flex>
                    ) : (
                      <Flex w="172px" h="172px" borderRadius="16px" bgColor="#E8D8C8" alignItems="center" justifyContent="center">
                        <Text color="#9D7859" fontSize="72px" lineHeight="1" fontWeight="500">?</Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="0"
                px="18px"
                pt="22px"
                pb={isSunbeastHintTalkVisible ? `calc(${EVENT_DIALOG_HEIGHT} + 18px)` : "22px"}
                bgColor="#977458"
                borderTop="8px solid #BD9A7E"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                direction="column"
                gap="14px"
                overflowY={isSunbeastHintTalkVisible ? "auto" : "hidden"}
                css={{ scrollbarWidth: "none" }}
              >
                <Text color="#FFFFFF" fontSize="22px" fontWeight="700" lineHeight="1.25">
                  從日記上獲得的線索
                </Text>
                {isChickenHintSelected ? (
                  <>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      wrap="wrap"
                      alignItems="center"
                      gap="8px 10px"
                      opacity={isChickenHintOneUnlocked ? 1 : 0.58}
                    >
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                        前往
                      </Text>
                      <Flex
                        h="34px"
                        px="14px"
                        borderRadius="999px"
                        bgColor="#E8D8C8"
                        alignItems="center"
                        gap="8px"
                        boxShadow="0 3px 0 rgba(255,255,255,0.12) inset"
                      >
                        <img
                          src={SUNBEAST_HINT_PLACE_ICON_PATHS["街道"]}
                          alt=""
                          style={{ width: "24px", height: "24px", objectFit: "contain", display: "block" }}
                        />
                        <Text color="#7B5C43" fontSize="16px" fontWeight="800" lineHeight="1">
                          街道
                        </Text>
                      </Flex>
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                        打聽看看。
                      </Text>
                    </Flex>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      minH="62px"
                      alignItems="center"
                      justifyContent={isChickenHintTwoUnlocked ? "flex-start" : "center"}
                    >
                      {isChickenHintTwoUnlocked ? (
                        <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                          通過特殊地圖到達指定地點
                        </Text>
                      ) : (
                        <Flex
                          h="38px"
                          px="18px"
                          borderRadius="999px"
                          bgColor="#F4EEE8"
                          alignItems="center"
                          gap="8px"
                        >
                          <Text color="#70553F" fontSize="16px" fontWeight="700" lineHeight="1">
                            線索二
                          </Text>
                          <Text color="#70553F" fontSize="17px" lineHeight="1">
                            🔒
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </>
                ) : isFrogHintSelected ? (
                  <>
                    {frogDiaryHintItems.map((clue, index) => (
                      <Flex
                        key={clue.key}
                        borderRadius="14px"
                        bgColor="rgba(98,73,52,0.72)"
                        px="16px"
                        py="14px"
                        wrap="wrap"
                        alignItems="center"
                        justifyContent={clue.unlocked ? "flex-start" : "center"}
                        gap="8px 10px"
                        opacity={clue.unlocked ? 1 : 0.58}
                      >
                        {clue.unlocked ? (
                          <>
                            <Flex
                              h="34px"
                              px="14px"
                              borderRadius="999px"
                              bgColor="#E8D8C8"
                              alignItems="center"
                              gap="8px"
                              boxShadow="0 3px 0 rgba(255,255,255,0.12) inset"
                            >
                              <img
                                src={clue.icon}
                                alt=""
                                style={{ width: "24px", height: "24px", objectFit: "contain", display: "block" }}
                              />
                              <Text color="#7B5C43" fontSize="16px" fontWeight="800" lineHeight="1">
                                {clue.label}
                              </Text>
                            </Flex>
                            <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                              {clue.hintText}
                            </Text>
                          </>
                        ) : (
                          <Flex
                            h="38px"
                            px="18px"
                            borderRadius="999px"
                            bgColor="#F4EEE8"
                            alignItems="center"
                            gap="8px"
                          >
                            <Text color="#70553F" fontSize="16px" fontWeight="700" lineHeight="1">
                              {(["線索一", "線索二", "線索三"] as const)[index] ?? `線索${index + 1}`}
                            </Text>
                            <Text color="#70553F" fontSize="17px" lineHeight="1">
                              🔒
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                    ))}
                  </>
                ) : (
                  <Flex
                    borderRadius="14px"
                    bgColor="rgba(98,73,52,0.72)"
                    px="16px"
                    py="16px"
                    wrap="wrap"
                    alignItems="center"
                    gap="8px 10px"
                  >
                    <Text color="#FFFFFF" fontSize="16px" lineHeight="1.65" whiteSpace="pre-line">
                      {FROG_ACTIVE_CLUE_TEXT}
                    </Text>
                  </Flex>
                )}
              </Flex>
              {isSunbeastHintTalkVisible ? (
                <Flex
                  position="absolute"
                  inset="0"
                  zIndex={12}
                  direction="column"
                  justifyContent="flex-end"
                  cursor="pointer"
                  onClick={advanceSunbeastHintTalk}
                >
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={sunbeastHintTalkStep === 0 ? "mai" : "beigo"}
                      frameIndex={sunbeastHintTalkStep === 0 ? sunbeastHintTalkFrameIndex : 2}
                    />
                  </Flex>
                  <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                    <Text color="white" fontWeight="700">
                      {sunbeastHintTalkStep === 0 ? "小麥" : "小貝狗"}
                    </Text>
                    <Flex flex="1" minH="0" direction="column" justifyContent="center">
                      <Text color="white" fontSize="16px" lineHeight="1.5">
                        {sunbeastHintTalkStep === 0 ? (
                          "這是下一隻小日獸的提示嗎"
                        ) : (
                          selectedHintTalkReply
                        )}
                      </Text>
                    </Flex>
                    <EventContinueAction
                      label="點擊繼續"
                      onClick={advanceSunbeastHintTalk}
                    />
                  </EventDialogPanel>
                </Flex>
              ) : null}
              <Flex
                position="absolute"
                left="0"
                bottom={isSunbeastHintTalkVisible ? `calc(${EVENT_DIALOG_HEIGHT} + 12px)` : "32px"}
                zIndex={14}
                alignItems="center"
              >
                <Flex
                  as="button"
                  h="40px"
                  w="104px"
                  borderRadius="0 4px 4px 0"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 4px 7px rgba(10,10,10,0.25)"
                  cursor="pointer"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">
                    ‹
                  </Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      );
      const sunbeastCollectionSection = (
        <Flex
          ref={sunbeastCollectionRootRef}
          position="relative"
          w="100%"
          minH="0"
          overflow={isSunbeastShadowPointerStep ? "visible" : "hidden"}
        >
          <Flex
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            w="100%"
            pointerEvents="none"
            opacity={1}
          >
            <img
              src="/images/diary/diary_bg.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "fill", objectPosition: "left top" }}
            />
          </Flex>
          <Flex position="relative" zIndex={1} flex="1" minW="0" minH="0" pl="0" pr="0" pt="0" pb="0">
            <Flex
              direction="column"
              flex="1"
              minH="0"
              pl="34px"
              pr="16px"
              pt="18px"
              pb="18px"
              overflow={isSunbeastShadowPointerStep ? "visible" : "hidden"}
            >
              <Flex
                alignItems="center"
                justifyContent="space-between"
                gap="8px"
                wrap="wrap"
                pb="14px"
                borderBottom="1px solid rgba(156,119,90,0.12)"
              >
                {visibleSunbeastFilters.map((filter) => {
                  const isActive = filter.id === activeSunbeastFilter;
                  return (
                    <Flex
                      key={filter.id}
                      as="button"
                      h="44px"
                      px={isActive ? "18px" : "6px"}
                      minW={isActive ? "94px" : "auto"}
                      borderRadius={isActive ? "999px" : "0"}
                      border={isActive ? "1.5px solid #B88D61" : "none"}
                      bgColor={isActive ? "#FDF6D8" : "transparent"}
                      alignItems="center"
                      justifyContent="center"
                      onClick={() => {
                        if (isSunbeastFirstRevealAnimating || isSunbeastCollectionBlocked || isSunbeastShadowPointerStep) return;
                        setActiveSunbeastFilter(filter.id);
                      }}
                      opacity={isSunbeastFirstRevealAnimating || isSunbeastShadowGuideVisible ? 0.5 : 1}
                    >
                      <Text color="#9D7859" fontSize="16px" fontWeight="700" lineHeight="1">
                        {filter.label}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>

              <Flex
                flex="1"
                minH="0"
                overflowY={isSunbeastShadowPointerStep ? "visible" : "auto"}
                pt="16px"
                pr="2px"
                css={{ scrollbarWidth: "none" }}
              >
                <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="12px" w="100%" alignContent="start">
                  {visibleCollectionCards.map((card) => (
                    <Flex
                      ref={(node) => {
                        sunbeastCardRefs.current[card.id] = node;
                        if (card.id === sunbeastShadowGuideTargetId && node && isSunbeastShadowPointerStep) {
                          window.requestAnimationFrame(measureSunbeastShadowTarget);
                        }
                      }}
                      key={card.id}
                      data-sunbeast-card-id={card.id}
                      as="button"
                      direction="column"
                      alignItems="center"
                      justifyContent="flex-start"
                      bgColor={card.state === "hint" ? "#FFF8EA" : "#FFFFFF"}
                      minH="122px"
                      px="8px"
                      pt="14px"
                      pb={isSunbeastNaotaroGuideStep && card.id === "naotaro" ? "28px" : "12px"}
                      gap="10px"
                      position="relative"
                      zIndex={isSunbeastShadowPointerStep && card.id === sunbeastShadowGuideTargetId ? 11 : undefined}
                      opacity={1}
                      border={card.state === "hint" ? "1.5px solid rgba(184,141,97,0.55)" : "1px solid transparent"}
                      boxShadow={
                        isSunbeastShadowPointerStep && card.id === sunbeastShadowGuideTargetId
                          ? "0 0 0 4px rgba(255,255,255,0.86), 0 12px 26px rgba(46,36,26,0.34)"
                          : card.state === "hint"
                            ? "0 8px 18px rgba(128,98,72,0.12)"
                            : undefined
                      }
                      cursor={
                        card.isClickable === false ||
                        isSunbeastFirstRevealAnimating ||
                        (isSunbeastShadowGuideVisible &&
                          (!isSunbeastShadowPointerStep || card.id !== sunbeastShadowGuideTargetId))
                          ? "default"
                          : "pointer"
                      }
                      onClick={() => {
                        if (isSunbeastShadowGuideVisible) {
                          if (!isSunbeastShadowPointerStep || card.id !== sunbeastShadowGuideTargetId) return;
                          openSunbeastHintCard(card);
                          return;
                        }
                        if (isSunbeastFirstRevealAnimating || card.isClickable === false) return;
                        if (isSunbeastNaotaroGuideStep) {
                          if (card.id !== "naotaro") return;
                          setSunbeastIntroStep(null);
                          setSelectedSunbeastCardId("naotaro");
                          setSunbeastView("detail-naotaro");
                          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "dialog" : "complete");
                          return;
                        }
                        const nextView = getSunbeastDetailView(card);
                        setSelectedSunbeastCardId(card.id);
                        setSunbeastView(nextView);
                        if (nextView === "detail-naotaro") {
                          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "complete" : "complete");
                        } else if (nextView === "detail-frog") {
                          setSunbeastDetailRevealStep("complete");
                        } else if (nextView === "detail-chicken") {
                          setSunbeastDetailRevealStep("complete");
                        } else if (nextView === "detail-generic") {
                          setSunbeastDetailRevealStep("complete");
                        }
                      }}
                    >
                      {card.state === "hint" ? (
                        <Flex
                          position="absolute"
                          right="6px"
                          top="6px"
                          h="20px"
                          px="7px"
                          borderRadius="999px"
                          bgColor="#DABF8A"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#806248" fontSize="11px" fontWeight="800" lineHeight="1">
                            線索
                          </Text>
                        </Flex>
                      ) : null}
                      <Flex h="72px" alignItems="center" justifyContent="center">
                        {card.state === "discovered" ? (
                          <Flex w="72px" h="72px" alignItems="center" justifyContent="center">
                            <img
                              src={card.imagePath ?? "/images/428出圖/拍照動物/黃金獵犬.png"}
                              alt={card.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            />
                          </Flex>
                        ) : card.state === "hint" ? (
                          <Flex
                            w="72px"
                            h="72px"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="999px"
                            bgColor="rgba(218,191,138,0.18)"
                          >
                            {card.imagePath ? (
                              <img
                                src={card.imagePath}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: 0.94 }}
                              />
                            ) : (
                              <Text color="#9D7859" fontSize="34px" fontWeight="700" lineHeight="1">
                                ?
                              </Text>
                            )}
                          </Flex>
                        ) : (
                          <Flex
                            w="58px"
                            h="58px"
                            borderRadius="12px"
                            bgColor="#9D7859"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="white" fontSize="28px" fontWeight="500" lineHeight="1">
                              ?
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                      <Text
                        color="#9D7859"
                        fontSize={card.state === "hint" ? "15px" : "18px"}
                        fontWeight={card.state === "hint" ? "700" : "500"}
                        lineHeight="1"
                        textAlign="center"
                      >
                        {card.state === "hint" ? "有線索" : card.name}
                      </Text>
                      {isSunbeastNaotaroGuideStep && card.id === "naotaro" ? (
                        <Flex
                          position="absolute"
                          left="50%"
                          top="-6px"
                          transform="translateX(-50%)"
                          color="#A57C58"
                          fontSize="28px"
                          lineHeight="1"
                          pointerEvents="none"
                          zIndex={2}
                          animation={`${fingerUpSwipe} 1s ease-in-out infinite`}
                        >
                          <TbHandFinger />
                        </Flex>
                      ) : null}
                    </Flex>
                  ))}
                </Grid>
              </Flex>
              <Flex pt="14px" justifyContent="center" flexShrink={0}>
                <Flex
                  as="button"
                  h="44px"
                  minW="132px"
                  px="20px"
                  borderRadius="999px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 6px 14px rgba(78,55,31,0.12)"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="white" fontSize="26px" fontWeight="400" lineHeight="1" transform="translateY(-2px)">
                    ‹
                  </Text>
                  <Text color="white" fontSize="16px" fontWeight="700" lineHeight="1">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
      const isSunbeastDetailView = !showSunbeastIntroDialog && sunbeastView !== "collection";
      const sunbeastShadowMaskWidth =
        sunbeastSpotlightSize.width || sunbeastSpotlightRootRef.current?.clientWidth || 360;
      const sunbeastShadowMaskHeight =
        sunbeastSpotlightSize.height || sunbeastSpotlightRootRef.current?.clientHeight || 640;
      const sunbeastShadowMaskRect =
        sunbeastShadowTargetRect ?? {
          left: sunbeastShadowMaskWidth * (sunbeastShadowGuideTargetId === "chicken" ? 0.71 : 0.425),
          top: sunbeastShadowMaskHeight * 0.205,
          width: sunbeastShadowMaskWidth * 0.235,
          height: sunbeastShadowMaskHeight * 0.145,
        };

      return (
        <Flex
          ref={sunbeastSpotlightRootRef}
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#F6F0E4"
        >
          <Flex
            position="absolute"
            inset="0"
            opacity={0.62}
            bgImage={[
              "radial-gradient(circle at 28px 24px, rgba(183,155,128,0.22) 0 4px, transparent 5px)",
              "radial-gradient(circle at 104px 66px, rgba(183,155,128,0.15) 0 3px, transparent 4px)",
              "radial-gradient(circle at 172px 38px, rgba(183,155,128,0.18) 0 3px, transparent 4px)",
            ].join(",")}
            bgSize="164px 164px"
          />
          <Flex
            position="relative"
            zIndex={1}
            direction="column"
            flex="1"
            minH="0"
            pl={isSunbeastDetailView ? "0" : "16px"}
            pr="0"
            pt={isSunbeastDetailView ? "0" : "18px"}
          >
            {isSunbeastDetailView ? null : (
              <Flex alignItems="center" justifyContent="space-between" minH="52px">
                <Flex w="84px" />
                <Text color="#9D7859" fontSize="26px" fontWeight="700" lineHeight="1">
                  小日獸們
                </Text>
                <Flex w="84px" />
              </Flex>
            )}

            <Flex position="relative" flex="1" minH="0" mt={isSunbeastDetailView ? "0" : "8px"}>
              {showSunbeastIntroDialog || sunbeastView === "collection" ? (
                sunbeastCollectionSection
              ) : (
                <Flex
                  position="relative"
                  flex="1"
                  minH="0"
                >
                  {sunbeastDetailSection}
                  {((isNaotaroDialogOpen && !shouldUseInlinePhotoDialog) || isNaotaroUnlockOverlayOpen) &&
                  !shouldUseInlineRevealPanel ? (
                    <Flex
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      zIndex={8}
                      bgImage="linear-gradient(to top, rgba(92,63,40,0.88) 0%, rgba(92,63,40,0.82) 34%, rgba(92,63,40,0.5) 62%, rgba(92,63,40,0.14) 82%, rgba(92,63,40,0) 100%)"
                      pointerEvents="none"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.72s ease-out both` : undefined}
                    />
                  ) : null}
                  {isNaotaroDialogOpen && !shouldUseInlinePhotoDialog ? (
                    <Flex
                      position="absolute"
                      left="0"
                      right="0"
                      top="260px"
                      bottom="0"
                      zIndex={9}
                      bgColor="#BD9A7E"
                      px="22px"
                      pt="24px"
                      pb="116px"
                      direction="column"
                      alignItems="center"
                      gap="16px"
                      overflow="hidden"
                      boxShadow="0 -10px 24px rgba(55,40,27,0.18)"
                    >
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="10px"
                        transform="rotate(-3deg)"
                        boxShadow="0 10px 18px rgba(88,59,33,0.18)"
                        w="168px"
                        minH="198px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                        transformOrigin="50% 100%"
                      >
                        <Flex
                          position="absolute"
                          top="-8px"
                          left="50%"
                          transform="translateX(-50%) rotate(2deg)"
                          w="70px"
                          h="16px"
                          bgColor="#E7D7C4"
                          opacity={0.95}
                        />
                        <Flex direction="column" gap="9px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="122px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="15px" fontWeight="700" lineHeight="1">
                              直太郎
                            </Text>
                            <Text color="#F2C84B" fontSize="19px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Flex
                        w="100%"
                        borderRadius="4px"
                        bgColor="#FFFFFF"
                        px="14px"
                        py="12px"
                        direction="column"
                        gap="6px"
                        boxShadow="0 4px 10px rgba(109,82,55,0.08)"
                      >
                        <Text color="#806248" fontSize="16px" fontWeight="700" lineHeight="1.2">
                          拍到的照片
                        </Text>
                        <Text color="#806248" fontSize="13px" lineHeight="1.45">
                          早上拍下來的直太郎照片出現在這裡。
                        </Text>
                      </Flex>
                    </Flex>
                  ) : null}
                  {isNaotaroUnlockOverlayOpen && !shouldUseInlineRevealPanel ? (
                    <Flex
                      position="absolute"
                      left="0"
                      right="0"
                      top="260px"
                      bottom="0"
                      zIndex={9}
                      bgColor="#BD9A7E"
                      px="20px"
                      pt="18px"
                      pb="104px"
                      direction="column"
                      gap="12px"
                      overflow="hidden"
                      boxShadow="0 -10px 24px rgba(55,40,27,0.18)"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.66s ease-out both` : undefined}
                    >
                      <Flex
                        as="button"
                        bgColor={isDiaryUnlockedInReveal ? "#FFFFFF" : "#806248"}
                        borderRadius="4px"
                        px="12px"
                        py="10px"
                        alignItems="center"
                        gap="12px"
                        transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                        animation={isDiaryUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                        boxShadow={isDiaryUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                        onClick={() => {
                          if (!isDiaryUnlockedInReveal) return;
                          setActiveTab("journal");
                          setJournalView("entry-bai-1");
                        }}
                        cursor={isDiaryUnlockedInReveal ? "pointer" : "default"}
                      >
                        <Flex
                          w="68px"
                          h="48px"
                          flexShrink={0}
                          borderRadius="4px"
                          overflow="hidden"
                          bgColor="#EFE6D9"
                        >
                          <img
                            src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                            alt="相關的日記"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </Flex>
                        <Flex direction="column" flex="1" minW="0" gap="4px">
                          <Text color={isDiaryUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                            相關的日記
                          </Text>
                          <Text color={isDiaryUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                            趕捷運時的小插曲，似乎跟直太郎很像。
                          </Text>
                        </Flex>
                        <Flex
                          h="22px"
                          px="12px"
                          borderRadius="999px"
                          bgColor={isDiaryUnlockedInReveal ? "#806248" : "rgba(255,255,255,0.18)"}
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                          flexShrink={0}
                        >
                          <Text color="white" fontSize="11px" fontWeight="700" lineHeight="1">
                            閱讀
                          </Text>
                        </Flex>
                      </Flex>
                      {isFirstPhotoDiaryRevealMode ? null : (
                        <Flex direction="column" gap="10px">
                          <Flex
                          minH="72px"
                          borderRadius="4px"
                          bgColor={isStreetUnlockedInReveal ? "#FFFFFF" : "#806248"}
                          px="12px"
                          py="10px"
                          alignItems="center"
                          gap="12px"
                          transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                          animation={isStreetUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                          boxShadow={isStreetUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                        >
                          <Flex w="68px" h="48px" flexShrink={0} borderRadius="4px" overflow="hidden" bgColor="#EFE6D9">
                            <img
                              src="/walk/Sidewalk_Day.png"
                              alt="街道"
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </Flex>
                          <Flex direction="column" flex="1" minW="0" gap="4px">
                            <Text color={isStreetUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                              新的地點
                            </Text>
                            <Text color={isStreetUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                              街道，是直太郎很喜歡散步的地方。
                            </Text>
                          </Flex>
                          </Flex>
                          <Flex
                          as="button"
                          minH="72px"
                          borderRadius="4px"
                          bgColor={isClueUnlockedInReveal ? "#FFFFFF" : "#806248"}
                          px="12px"
                          py="10px"
                          alignItems="center"
                          gap="12px"
                          transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                          animation={isClueUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                          boxShadow={isClueUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                          onClick={() => {
                            if (!isClueUnlockedInReveal) return;
                            setSelectedSunbeastCardId("frog");
                            setSunbeastHintTalkStep(0);
                            setIsSunbeastHintTalkVisible(true);
                            setSunbeastView("detail-unknown");
                            setSunbeastDetailRevealStep("complete");
                          }}
                        >
                          <Flex w="68px" h="48px" flexShrink={0} alignItems="center" justifyContent="center" gap="8px">
                            <img
                              src={FROG_SHADOW_IMAGE_PATH}
                              alt="青蛙線索"
                              style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                            />
                            <img
                              src={ROOSTER_SHADOW_IMAGE_PATH}
                              alt="公雞線索"
                              style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                            />
                          </Flex>
                          <Flex direction="column" flex="1" minW="0" gap="4px">
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                              小日獸行蹤
                            </Text>
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                              {FROG_ACTIVE_CLUE_TEXT}
                            </Text>
                          </Flex>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  ) : null}
                  {(((isNaotaroDialogOpen && !shouldUseInlinePhotoDialog) || isNaotaroUnlockOverlayOpen) &&
                    !shouldUseInlineRevealPanel) ? (
                    <Flex
                      position="absolute"
                      inset="0"
                      zIndex={10}
                      direction="column"
                      justifyContent="flex-end"
                      cursor={sunbeastDetailRevealStep === "dialog" ? "pointer" : undefined}
                      onClick={sunbeastDetailRevealStep === "dialog" ? advanceNaotaroRevealFooter : undefined}
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.62s ease-out both` : undefined}
                    >
                      <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                        <Flex flex="1" minH="0" direction="column" justifyContent="center">
                          <Text color="white" fontSize="16px" lineHeight="1.5" textAlign="center">
                            {naotaroRevealFooterText}
                          </Text>
                        </Flex>
                        {sunbeastDetailRevealStep === "dialog" ? (
                          <EventContinueAction
                            label="點擊繼續"
                            onClick={advanceNaotaroRevealFooter}
                          />
                        ) : null}
                      </EventDialogPanel>
                    </Flex>
                  ) : null}
                </Flex>
              )}
            </Flex>
          </Flex>

          {isSunbeastShadowPointerStep ? (
            <>
              <Flex
                position="absolute"
                inset="0"
                zIndex={20}
                pointerEvents="auto"
                cursor="pointer"
                onClick={(event) => {
                  if (!activeShadowGuideCard) return;
                  const overlayRect = event.currentTarget.getBoundingClientRect();
                  const clickX =
                    ((event.clientX - overlayRect.left) / overlayRect.width) * sunbeastShadowMaskWidth;
                  const clickY =
                    ((event.clientY - overlayRect.top) / overlayRect.height) * sunbeastShadowMaskHeight;
                  const targetLeft = sunbeastShadowMaskRect.left - 12;
                  const targetTop = sunbeastShadowMaskRect.top - 12;
                  const targetRight = sunbeastShadowMaskRect.left + sunbeastShadowMaskRect.width + 12;
                  const targetBottom = sunbeastShadowMaskRect.top + sunbeastShadowMaskRect.height + 12;
                  if (
                    clickX >= targetLeft &&
                    clickX <= targetRight &&
                    clickY >= targetTop &&
                    clickY <= targetBottom
                  ) {
                    openSunbeastHintCard(activeShadowGuideCard);
                  }
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(1, Math.round(sunbeastShadowMaskWidth))} ${Math.max(1, Math.round(sunbeastShadowMaskHeight))}`}
                  preserveAspectRatio="none"
                  style={{ display: "block" }}
                >
                  <defs>
                    <mask
                      id="sunbeast-shadow-guide-mask"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width={sunbeastShadowMaskWidth}
                      height={sunbeastShadowMaskHeight}
                    >
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={sunbeastShadowMaskRect.left - 8}
                        y={sunbeastShadowMaskRect.top - 8}
                        width={sunbeastShadowMaskRect.width + 16}
                        height={sunbeastShadowMaskRect.height + 16}
                        rx="8"
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.24)"
                    mask="url(#sunbeast-shadow-guide-mask)"
                  />
                </svg>
              </Flex>
              <Flex
                position="absolute"
                left={`${sunbeastShadowMaskRect.left - 50}px`}
                top={`${sunbeastShadowMaskRect.top + 52}px`}
                zIndex={21}
                w="44px"
                h="44px"
                pointerEvents="none"
                animation={`${diaryEntryPointerNudge} 1.02s ease-in-out infinite`}
              >
                <img
                  src="/images/pointer_up.png"
                  alt=""
                  aria-hidden="true"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </Flex>
            </>
          ) : null}

          {showSunbeastIntroDialog ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={9}
              direction="column"
              justifyContent="flex-end"
              cursor={sunbeastIntroStep === 0 ? "pointer" : undefined}
              onClick={sunbeastIntroStep === 0 ? () => setSunbeastIntroStep(1) : undefined}
            >
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite
                  spriteId={introAvatarSpriteId}
                  frameIndex={introAvatarFrameIndex}
                />
              </Flex>
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                <Text color="white" fontWeight="700">
                  {introSpeaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {isFirstPhotoDiaryRevealMode && sunbeastIntroStep === 0 ? (
                      <>
                        黃金獵犬，出現在
                        <Text as="span" color="#F6D982" fontWeight="800">
                          交換日記
                        </Text>
                        的
                        <Text as="span" color="#9DE0C3" fontWeight="800">
                          小日獸
                        </Text>
                        裡了
                      </>
                    ) : (
                      introText
                    )}
                  </Text>
                </Flex>
                {sunbeastIntroStep === 0 ? (
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={() => setSunbeastIntroStep(1)}
                  />
                ) : null}
              </EventDialogPanel>
            </Flex>
          ) : null}
          {ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && !isSunbeastShadowPointerStep ? (
            <>
              <Flex position="absolute" inset="0" zIndex={8} bgColor="rgba(0, 0, 0, 0.22)" pointerEvents="auto" />
              {(
                <Flex
                  position="absolute"
                  inset="0"
                  zIndex={9}
                  direction="column"
                  justifyContent="flex-end"
                  cursor="pointer"
                  onClick={() => {
                    if (sunbeastShadowGuideStep === 0) {
                      setSunbeastShadowGuideStep(1);
                      return;
                    }
                    setSunbeastShadowGuideStep(2);
                  }}
                >
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={sunbeastShadowGuideStep === 0 ? "mai" : "beigo"}
                      frameIndex={sunbeastShadowGuideStep === 0 ? 36 : 0}
                    />
                  </Flex>
                  <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                    <Text color="white" fontWeight="700">
                      {sunbeastShadowGuideStep === 0 ? "小麥" : "小貝狗"}
                    </Text>
                    <Flex flex="1" minH="0" direction="column" justifyContent="center">
                      <Text color="white" fontSize="16px" lineHeight="1.5">
                        {sunbeastShadowGuideStep === 0 ? (
                          <>
                            除了直太郎外，
                            <br />
                            出現了兩隻小日獸的影子！
                          </>
                        ) : (
                          <>嗷！點點看牠們，有遇見牠們的線索。</>
                        )}
                      </Text>
                    </Flex>
                    <EventContinueAction
                      label="點擊繼續"
                      onClick={() => {
                        if (sunbeastShadowGuideStep === 0) {
                          setSunbeastShadowGuideStep(1);
                          return;
                        }
                        setSunbeastShadowGuideStep(2);
                      }}
                    />
                  </EventDialogPanel>
                </Flex>
              )}
            </>
          ) : null}
        </Flex>
      );
    }

    const diaryCards = [
      {
        id: "bai-entry-1",
        title: "趕上捷運",
        unlocked: hasBaiEntry1,
        imagePath: BAI_ENTRY_1_IMAGE_PATH,
      },
      {
        id: "bai-entry-2",
        title: "搬家",
        unlocked: hasBaiEntry2,
        imagePath: BAI_ENTRY_2_IMAGE_PATH,
      },
      {
        id: "bai-entry-5",
        title: "無尾熊的晚餐",
        unlocked: hasBaiEntry5,
        imagePath: "/images/diary/diary_demo.jpg",
      },
      {
        id: "bai-entry-3",
        title: "早餐店裡的公雞",
        unlocked: hasBaiEntry3,
        imagePath: ROOSTER_IMAGE_PATH,
      },
    ] as const;
    const nextDiaryCatalogTalkLine =
      nextDiaryCatalogTalkIndex === null ? null : NEXT_DIARY_CATALOG_TALK_LINES[nextDiaryCatalogTalkIndex] ?? null;
    const isNextDiaryCatalogTalkAvatarVisible = Boolean(nextDiaryCatalogTalkLine?.spriteId);
    if (journalView === "entry-bai-2-fragment") {
      const baiEntry2FragmentRevealLevel =
        getBaiEntry2FragmentRevealLevel(frogDiaryFragmentPhotoAttemptCount);
      const shouldShowBaiEntry2Puzzle =
        !hasCompletedBaiEntry2Puzzle && baiEntry2FragmentRevealLevel === "initial";
      const shouldGuideFragmentToClue = isFirstPhotoDiaryRevealMode || isFrogDiaryCatalogGuideMode;
      const shouldShowFragmentContinueButton =
        shouldGuideFragmentToClue &&
        !isIncompleteDiaryReactionVisible &&
        fragmentedDiaryClueStage === "idle";
      const completeIncompleteDiaryReaction = () => {
        if (fragmentedDiaryClueStage !== "idle") return;
        setIsIncompleteDiaryReactionVisible(false);
      };
      const continueAfterReadingFragment = () => {
        if (shouldGuideFragmentToClue) {
          startFragmentedDiaryClueReward();
          return;
        }
        onFragmentedDiaryComplete?.();
      };
      if (shouldShowBaiEntry2Puzzle) {
        return (
          <VisualDiaryBookPage
            title="???"
            pages={[
              {
                imagePath: BAI_ENTRY_2_IMAGE_PATH,
                imageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
                text: BAI_ENTRY_2_FIRST_DAMAGED_TEXT,
                textEffect: "damaged-fragment",
                selectableMetroClue: {
                  selected: false,
                  reconstructed: isBaiEntry2PuzzleSolved,
                  puzzleImagePath: BAI_ENTRY_2_IMAGE_PATH,
                  puzzleImageAspectRatio: BAI_ENTRY_2_IMAGE_ASPECT_RATIO,
                  puzzleSolvedOrder: DIARY_IMAGE_PUZZLE_SOLVED_ORDER,
                  puzzlePieces: METRO_FRAGMENT_PUZZLE_PIECES,
                  puzzleQuestionPieceId: BAI_ENTRY_1_REVEAL_MISSING_PIECE_ID,
                  puzzleTextTokens: BAI_ENTRY_2_PUZZLE_TEXT_TOKENS,
                  puzzleTextGridLayout: BAI_ENTRY_2_TEXT_GRID_LAYOUT,
                  puzzleOrder: baiEntry2PuzzleOrder,
                  selectedPuzzleSlotIndex: selectedBaiEntry2PuzzleSlotIndex,
                  onPuzzleSlotSelect: handleBaiEntry2PuzzleSlotSelect,
                  onPuzzleSlotSwap: handleBaiEntry2PuzzleSlotSwap,
                  onSelect: continueAfterBaiEntry2Puzzle,
                },
              },
            ]}
            showBackButton={!isFirstPhotoDiaryRevealMode && !isFrogDiaryCatalogGuideMode}
            onBack={() => setJournalView("list")}
            pageMode="slide"
            slideTotalPages={3}
            onContinue={isBaiEntry2PuzzleSolved ? continueAfterBaiEntry2Puzzle : undefined}
            continueLabel="繼續"
            rhythm="restoration"
            scrollBottomPadding={118}
            overlay={
              <FragmentedDiaryClueOverlay
                stage={fragmentedDiaryClueStage}
                clueText="便利商店"
                onHintComplete={startFragmentedDiaryClueReward}
                onFinish={finishFragmentedDiaryClue}
              />
            }
          />
        );
      }
      return (
        <VisualDiaryBookPage
          title="???"
          pages={buildBaiEntry2FragmentPages(baiEntry2FragmentRevealLevel)}
          showBackButton={!isFirstPhotoDiaryRevealMode && !isFrogDiaryCatalogGuideMode}
          onBack={() => setJournalView("list")}
          pageMode="slide"
          slideTotalPages={3}
          onContinue={
            shouldShowFragmentContinueButton
              ? continueAfterReadingFragment
              : undefined
          }
          continueLabel="繼續"
          scrollBottomPadding={
            isIncompleteDiaryReactionVisible
              ? DIARY_DIALOG_SCROLL_BOTTOM_PADDING
              : shouldGuideFragmentToClue
                ? 118
                : 48
          }
          overlay={
            <>
              {isIncompleteDiaryReactionVisible ? (
                <DiaryReactionOverlay
                  line={INCOMPLETE_DIARY_REACTION_LINE}
                  onContinue={completeIncompleteDiaryReaction}
                />
              ) : null}
              <FragmentedDiaryClueOverlay
                stage={fragmentedDiaryClueStage}
                clueText="便利商店"
                onHintComplete={startFragmentedDiaryClueReward}
                onFinish={finishFragmentedDiaryClue}
              />
            </>
          }
        />
      );
    }

    if (
      journalView === "entry-bai-1" ||
      journalView === "entry-bai-2" ||
      journalView === "entry-bai-3" ||
      journalView === "entry-bai-5"
    ) {
      const isSecondEntry = journalView === "entry-bai-2";
      const isThirdEntry = journalView === "entry-bai-3";
      const isFifthEntry = journalView === "entry-bai-5";
      const activeBodyLines = isFifthEntry
          ? BAI_ENTRY_5_BODY_LINES
        : isThirdEntry
          ? BAI_ENTRY_3_BODY_LINES
          : isSecondEntry
            ? BAI_ENTRY_2_BODY_LINES
            : BAI_ENTRY_1_BODY_LINES;
      const activeEntryDate = isFifthEntry
          ? "XX年X月X日 晚餐那天"
        : isThirdEntry
          ? "XX年X月X日 早餐店那天"
          : isSecondEntry
            ? "XX年X月X日 搬家那天"
            : "XX年X月X日 練團那天";
      const activeEntryTitle = isFifthEntry
          ? "無尾熊的晚餐"
        : isThirdEntry
          ? "早餐店裡的公雞"
          : isSecondEntry
            ? "搬家的飲料"
            : "趕上捷運";
      const activeEntrySketch = isThirdEntry ? (
        <>
          早餐店桌邊的速寫，
          <br />
          上面畫了一隻很專心的公雞
        </>
      ) : isFifthEntry ? (
        <>
          餐桌旁的速寫，
          <br />
          旁邊畫了一隻抱著菜單的無尾熊
        </>
      ) : isSecondEntry ? (
        <>
          搬家紙箱旁的速寫，
          <br />
          旁邊畫了一隻滿臉通紅的青蛙
        </>
      ) : (
        <>
          趕上捷運後，小白一臉困惑的日記插圖，
          <br />
          旁邊畫了一隻黃金獵犬
        </>
      );
      const talkLine = activeDiaryReadTalkLines[diaryReadTalkIndex];
      const isTalkAvatarVisible = isDiaryReadTalkVisible && Boolean(talkLine?.spriteId);
      if (isComicReadMode) {
        return (
          <Flex direction="column" h="100%" minH="0" position="relative" overflow="hidden" bgColor="#0F0F0F">
              <Flex
                ref={comicScrollRef}
                flex="1"
                minH="0"
                overflowY="auto"
              onScroll={handleComicScroll}
              css={{ scrollbarWidth: "none" }}
            >
              <Flex direction="column" w="100%" alignItems="stretch" gap="0" py="0">
                {DIARY_COMIC_PAGES.map((pagePath, index) => (
                  <Flex
                    key={pagePath}
                    w="100%"
                    overflow="hidden"
                    bgColor="#000"
                    minH="100%"
                  >
                    <img
                      src={pagePath}
                      alt={`日記漫畫第 ${index + 1} 頁`}
                      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    />
                  </Flex>
                ))}
              </Flex>
              </Flex>

            {isDiaryReadTalkVisible ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={12}
                direction="column"
                justifyContent="flex-end"
                cursor="pointer"
                onClick={advanceDiaryReadTalk}
              >
                {isTalkAvatarVisible ? (
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={talkLine.spriteId}
                      frameIndex={talkLine.frameIndex}
                    />
                  </Flex>
                ) : null}
                <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                  {talkLine.showName === false ? null : (
                    <Text color="white" fontWeight="700">
                      {talkLine.speaker}
                    </Text>
                  )}
                  <Flex flex="1" minH="0" direction="column" justifyContent="center">
                    <Text color="white" fontSize="16px" lineHeight="1.5">
                      {talkLine.text}
                    </Text>
                  </Flex>
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={advanceDiaryReadTalk}
                  />
                </EventDialogPanel>
              </Flex>
            ) : null}

            {!isComicControlsVisible ? (
              <Flex
                position="absolute"
                left="24%"
                right="24%"
                top="24%"
                bottom="24%"
                zIndex={6}
                onClick={() => setIsComicControlsVisible(true)}
              />
            ) : null}

            {isComicControlsVisible ? (
              <>
                <Flex position="absolute" top="10px" left="50%" transform="translateX(-50%)" px="12px" py="6px" borderRadius="999px" bgColor="rgba(70,55,40,0.75)" zIndex={8}>
                  <Text color="#FFF" fontSize="12px" fontWeight="700">
                    第 {comicPageIndex + 1} / {DIARY_COMIC_PAGES.length} 頁
                  </Text>
                </Flex>
                {showComicReadHint ? (
                  <Flex
                    position="absolute"
                    bottom="52px"
                    left="50%"
                    transform="translateX(-50%)"
                    px="14px"
                    py="6px"
                    borderRadius="999px"
                    bgColor="rgba(157,120,89,0.92)"
                    zIndex={8}
                  >
                    <Text color="#FFF" fontSize="14px" fontWeight="700">
                      往下滑動閱讀
                    </Text>
                  </Flex>
                ) : null}

                <Flex position="absolute" bottom="12px" left="50%" transform="translateX(-50%)" gap="8px" zIndex={8}>
                  <Flex as="button" px="12px" py="6px" borderRadius="999px" bgColor="rgba(70,55,40,0.75)" onClick={() => setIsComicControlsVisible(false)}>
                    <Text color="#FFF" fontSize="12px" fontWeight="700">隱藏操作</Text>
                  </Flex>
                  <Flex as="button" px="12px" py="6px" borderRadius="999px" bgColor="#9D7859" onClick={() => {
                    const currentIndex = getCurrentComicPageIndex();
                    const isReadFinished = currentIndex >= DIARY_COMIC_PAGES.length - 1;
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    if (isReadFinished) {
                      setIsDiaryReadTalkVisible(true);
                      setDiaryReadTalkIndex(0);
                      return;
                    }
                    setIsComicReadMode(false);
                    setComicPageIndex(0);
                  }}>
                    <Text color="#FFF" fontSize="12px" fontWeight="700">結束閱讀</Text>
                  </Flex>
                </Flex>
              </>
            ) : null}
          </Flex>
        );
	      }

	      if (journalView === "entry-bai-1") {
	          const shouldStageBaiEntry1Reveal =
	            isFirstPhotoDiaryRevealMode || isBaiEntry1NaotaroOpenReveal;
	          const hasCompletedBaiEntry1FirstPageReveal =
	            !shouldStageBaiEntry1Reveal ||
	            (isBaiEntry1NaotaroOpenReveal
	              ? isBaiEntry1VisualRevealComplete && isBaiEntry1TitleRevealed
	              : isBaiEntry1VisualRevealComplete);
	          const shouldRevealBaiEntry1Title = isBaiEntry1NaotaroOpenReveal;
	          const baiEntry1Pages = isBaiEntry1NaotaroOpenReveal
	            ? [
	                {
	                  ...BAI_ENTRY_1_VISUAL_PAGES[0],
	                  text: isBaiEntry1FirstTextRevealed
	                    ? BAI_ENTRY_1_VISUAL_PAGES[0].text
	                    : BAI_ENTRY_1_DAMAGED_VISUAL_TEXT,
	                  initialText: BAI_ENTRY_1_RESTORE_INITIAL_TEXT,
	                  textEffect: isBaiEntry1FirstTextRevealed
	                    ? "restore-completion" as const
	                    : "damaged-fragment" as const,
	                },
	              ]
	            : BAI_ENTRY_1_VISUAL_PAGES;
		        const startEntryReadTalk = () => {
		          setDiaryReadTalkIndex(0);
		          setIsDiaryReadTalkVisible(true);
		        };
          const baiEntry1ReadTalkOverlay = isDiaryReadTalkVisible ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={20}
              direction="column"
              justifyContent="flex-end"
              pointerEvents="none"
              onClick={advanceDiaryReadTalk}
            >
              {isTalkAvatarVisible ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite spriteId={talkLine.spriteId} frameIndex={talkLine.frameIndex} />
                </Flex>
              ) : null}
              <EventDialogPanel
                w="100%"
                borderRadius="0"
                overflow="hidden"
                pointerEvents="auto"
                cursor="pointer"
                onClick={advanceDiaryReadTalk}
              >
                {talkLine.showName === false ? null : (
                  <Text color="white" fontWeight="700">
                    {talkLine.speaker}
                  </Text>
                )}
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {talkLine.text}
                  </Text>
                </Flex>
                <EventContinueAction
                  label="點擊繼續"
                  onClick={advanceDiaryReadTalk}
                />
              </EventDialogPanel>
            </Flex>
          ) : null;

          if (isNextDiaryFragmentPreviewVisible) {
            return (
              <Flex
                position="relative"
                h="100%"
                minH="0"
                overflow="hidden"
                bgColor="#F7F0E4"
                bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
                cursor="pointer"
                onClick={completeNextDiaryFragmentPreview}
              >
                <Flex
                  position="absolute"
                  right="0"
                  bottom="0"
                  w="90%"
                  h="calc(100% - 64px)"
                  overflow="hidden"
                  pointerEvents="none"
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt="日記背景"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "left bottom",
                      opacity: 0.98,
                      animation: `${diaryBgFloat} 12s ease-in-out infinite`,
                    }}
                  />
                </Flex>

                <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="16px" mt="8px">
                  <Flex justifyContent="center" alignItems="center" pb="10px">
                    <Flex
                      minW="178px"
                      h="40px"
                      px="20px"
                      borderRadius="8px"
                      bgColor="#A57C58"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontSize="14px" fontWeight="500">
                        下一篇日記線索
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px" mr="0">
                    <Flex
                      flex="1"
                      minH="0"
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      pl="48px"
                      pr="0"
                      pt="26px"
                      pb="18px"
                      gap="22px"
                    >
                      <Flex
                        w="100%"
                        maxW="328px"
                        borderRadius="5px 0 0 5px"
                        bgColor="#FFFDF9"
                        border="1px solid rgba(151,116,88,0.28)"
                        boxShadow="0 8px 18px rgba(80,54,33,0.1)"
                        overflow="hidden"
                        direction="column"
                      >
	                        <Flex w="100%" aspectRatio="577 / 362" overflow="hidden" bgColor="#EBE3DB">
	                          <MovingDiaryIllustration />
	                        </Flex>
	                        <Flex px="18px" py="18px" bgColor="#FFFDF9">
	                          <Text
	                            color="#94857E"
	                            fontSize="16px"
	                            fontWeight="700"
	                            lineHeight="1.45"
                            whiteSpace="pre-line"
                          >
                            只看得見一小段：
                            {"\n"}「搬家那天……」
                          </Text>
                        </Flex>
                      </Flex>

	                      <Flex
	                        w="100%"
	                        maxW="328px"
	                        aspectRatio="577 / 362"
	                        borderRadius="5px 0 0 5px"
	                        bgColor="#EBE3DB"
	                        border="1.5px dashed rgba(151,116,88,0.42)"
	                        alignItems="center"
	                        justifyContent="center"
                      >
                        <Text color="#A57C58" fontSize="30px" fontWeight="700" letterSpacing="0">
                          ?
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex position="relative" zIndex={5} justifyContent="center" pb="26px">
                    <Flex
                      as="button"
                      h="52px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#7E6148"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      boxShadow="0 8px 18px rgba(80,54,33,0.18)"
                      onClick={(event) => {
                        event.stopPropagation();
                        completeNextDiaryFragmentPreview();
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                        繼續
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            );
          }

          if (isBaiEntry1NaotaroOpenReveal) {
            return (
              <BaiEntry1NaotaroDiaryRevealPage
                imageRevealed={isBaiEntry1VisualRevealComplete}
                textRevealed={isBaiEntry1FirstTextRevealed}
                titleRevealed={isBaiEntry1TitleRevealed}
                showBackButton={!isFirstPhotoDiaryRevealMode}
                onBack={() => {
                  setJournalView("list");
                  setBaiEntry1VisualPageIndex(0);
                  setIsBaiEntry1VisualRevealComplete(false);
                  setIsBaiEntry1TitleRevealed(false);
                  setIsBaiEntry1FirstTextRevealed(false);
                  setIsBaiEntry1NaotaroOpenReveal(false);
                  setIsComicReadMode(false);
                  setIsComicControlsVisible(false);
                  setShowComicReadHint(false);
                  setComicPageIndex(0);
                }}
                onContinue={startEntryReadTalk}
                overlay={baiEntry1ReadTalkOverlay}
              />
            );
          }

		        return (
		          <VisualDiaryBookPage
		            title={
		              shouldRevealBaiEntry1Title && !isBaiEntry1TitleRevealed
		              ? "???"
		                : "雪板卡住"
		            }
		            pages={baiEntry1Pages}
		            stagedReveal={shouldStageBaiEntry1Reveal}
		            isRevealComplete={hasCompletedBaiEntry1FirstPageReveal}
		            animateTitleChange={shouldRevealBaiEntry1Title}
		            fadeFirstPage={shouldRevealBaiEntry1Title}
		            rhythm={isBaiEntry1NaotaroOpenReveal ? "restoration" : "default"}
		            pageMode="slide"
		            slideTotalPages={baiEntry1Pages.length}
		            controlledSlidePageIndex={
		              shouldStageBaiEntry1Reveal && !isBaiEntry1VisualRevealComplete
		                ? baiEntry1VisualPageIndex
		                : undefined
		            }
		            scrollBottomPadding={isDiaryReadTalkVisible ? DIARY_DIALOG_SCROLL_BOTTOM_PADDING : 48}
		            showBackButton={!isFirstPhotoDiaryRevealMode}
		            onBack={() => {
		              setJournalView("list");
		              setBaiEntry1VisualPageIndex(0);
		              setIsBaiEntry1VisualRevealComplete(false);
		              setIsBaiEntry1TitleRevealed(false);
		              setIsBaiEntry1FirstTextRevealed(false);
		              setIsBaiEntry1NaotaroOpenReveal(false);
		              setIsComicReadMode(false);
		              setIsComicControlsVisible(false);
		              setShowComicReadHint(false);
		              setComicPageIndex(0);
		            }}
		            onContinue={startEntryReadTalk}
		            overlay={baiEntry1ReadTalkOverlay}
		          />
		        );
		      }

          if (journalView === "entry-bai-2") {
            const startEntryReadTalk = () => {
              setDiaryReadTalkIndex(0);
              setIsDiaryReadTalkVisible(true);
            };

            return (
              <VisualDiaryBookPage
                title="搬家的飲料"
                pages={BAI_ENTRY_2_COMPLETE_VISUAL_PAGES}
                scrollBottomPadding={isDiaryReadTalkVisible ? DIARY_DIALOG_SCROLL_BOTTOM_PADDING : 48}
                showBackButton={!isGuidedJournalRevealMode}
                onBack={() => {
                  setJournalView("list");
                  setIsComicReadMode(false);
                  setIsComicControlsVisible(false);
                  setShowComicReadHint(false);
                  setComicPageIndex(0);
                }}
                onContinue={isDiaryReadTalkVisible ? undefined : startEntryReadTalk}
                overlay={isDiaryReadTalkVisible ? (
                  <Flex
                    position="absolute"
                    inset="0"
                    zIndex={20}
                    direction="column"
                    justifyContent="flex-end"
                    pointerEvents="none"
                    onClick={advanceDiaryReadTalk}
                  >
                    {isTalkAvatarVisible ? (
                      <Flex
                        position="absolute"
                        left="14px"
                        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                        zIndex={6}
                        pointerEvents="none"
                      >
                        <EventAvatarSprite spriteId={talkLine.spriteId} frameIndex={talkLine.frameIndex} />
                      </Flex>
                    ) : null}
                    <EventDialogPanel
                      w="100%"
                      borderRadius="0"
                      overflow="hidden"
                      pointerEvents="auto"
                      cursor="pointer"
                      onClick={advanceDiaryReadTalk}
                    >
                      {talkLine.showName === false ? null : (
                        <Text color="white" fontWeight="700">
                          {talkLine.speaker}
                        </Text>
                      )}
                      <Flex flex="1" minH="0" direction="column" justifyContent="center">
                        <Text color="white" fontSize="16px" lineHeight="1.5">
                          {talkLine.text}
                        </Text>
                      </Flex>
                      <EventContinueAction
                        label="點擊繼續"
                        onClick={advanceDiaryReadTalk}
                      />
                    </EventDialogPanel>
                  </Flex>
                ) : null}
              />
            );
          }

	      return (
	        <Flex position="relative" h="100%" minH="0" overflow="hidden" bgColor="#F7F0E4">
          <Flex
            position="absolute"
            inset="0"
            bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
          />
          <Flex
            position="absolute"
            right="0"
            bottom="0"
            w="90%"
            h="calc(100% - 64px)"
            overflow="hidden"
            pointerEvents="none"
          >
            <img
              src="/images/diary/diary_bg.png"
              alt="日記背景"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "left bottom",
                opacity: 0.98,
                animation: `${diaryBgFloat} 12s ease-in-out infinite`,
              }}
            />
          </Flex>

          <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="16px" mt="8px">
            <Flex justifyContent="space-between" alignItems="center" pb="10px">
              <Flex
                as="button"
                w="86px"
                h="38px"
                borderRadius="0 6px 6px 0"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
                onClick={() => {
                  setReturnHomeDiaryClueEntry(null);
                  setJournalView("list");
                  setIsComicReadMode(false);
                  setIsComicControlsVisible(false);
                  setShowComicReadHint(false);
                  setComicPageIndex(0);
                  setBaiEntry1VisualPageIndex(0);
                  setIsBaiEntry1VisualRevealComplete(false);
                }}
              >
                <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
                  ‹
                </Text>
              </Flex>
              <Flex
                minW="132px"
                h="40px"
                px="20px"
                borderRadius="8px"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontSize="16px" fontWeight="400">
                  交換日記
                </Text>
              </Flex>
            </Flex>

                <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px" mr="0">
                  <Flex
                    flex="1"
                    minH="0"
                    direction="column"
                    overflowY="auto"
                    pl="48px"
                    pr="16px"
                    pt="50px"
                    pb={
                      isDiaryReadTalkVisible
                        ? `${DIARY_DIALOG_SCROLL_BOTTOM_PADDING}px`
                        : isGuidedJournalRevealMode
                          ? "96px"
                          : "18px"
                    }
                    css={{ scrollbarWidth: "none" }}
                  >
                <Text color="#151515" fontSize="16px" fontWeight="400" lineHeight="1.5" mb="18px">
                  {activeEntryDate}
                </Text>
                <Text color="#6C5641" fontSize="20px" fontWeight="700" lineHeight="1.3" mb="18px">
                  {activeEntryTitle}
                </Text>
                <Flex
                  h="178px"
                  borderRadius="8px"
                  bgColor="#FAF3E7"
                  px="18px"
                  py="16px"
                  mb="28px"
                  alignItems="flex-end"
                >
                  <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6">
                    {activeEntrySketch}
                  </Text>
                </Flex>
                <Flex direction="column" gap="10px">
                  {activeBodyLines.map((line) => (
                    <Text key={line} color="#111111" fontSize="15px" fontWeight="400" lineHeight="1.55">
                      {line}
                    </Text>
                  ))}
                </Flex>
                </Flex>
              </Flex>
            </Flex>

            {(isGuidedJournalRevealMode ||
              isThirdEntry ||
              (isFrogReturnHomeDiaryGuideMode && (isThirdEntry || isFifthEntry))) &&
            !isDiaryReadTalkVisible &&
            !activeReturnHomeDiaryClueItems ? (
              <Flex
                position="absolute"
                left="0"
                right="0"
                bottom="20px"
                zIndex={20}
                justifyContent="center"
                px="20px"
              >
                <Flex
                  as="button"
                  w="220px"
                  maxW="100%"
                  h="44px"
                  borderRadius="999px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(70,46,24,0.14)"
                  onClick={() => {
                    setReturnHomeDiaryClueEntry(null);
                    setDiaryReadTalkIndex(0);
                    setIsDiaryReadTalkVisible(true);
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    繼續
                  </Text>
                </Flex>
              </Flex>
            ) : null}

            {isDiaryReadTalkVisible ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={20}
              direction="column"
              justifyContent="flex-end"
              pointerEvents="none"
              onClick={advanceDiaryReadTalk}
            >
              {isTalkAvatarVisible ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite
                    spriteId={talkLine.spriteId}
                    frameIndex={talkLine.frameIndex}
                  />
                </Flex>
              ) : null}
              <EventDialogPanel
                w="100%"
                borderRadius="0"
                overflow="hidden"
                pointerEvents="auto"
                cursor="pointer"
                onClick={advanceDiaryReadTalk}
              >
                {talkLine.showName === false ? null : (
                  <Text color="white" fontWeight="700">
                    {talkLine.speaker}
                  </Text>
                )}
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {talkLine.text}
                  </Text>
                </Flex>
                <EventContinueAction
                  label="點擊繼續"
                  onClick={advanceDiaryReadTalk}
                />
              </EventDialogPanel>
            </Flex>
          ) : null}
          <ReturnHomeDiaryClueOverlay
            clueItems={activeReturnHomeDiaryClueItems}
            onFinish={completeReturnHomeDiaryClue}
          />
        </Flex>
      );
    }

    return (
      <Flex position="relative" h="100%" minH="0" overflow="hidden" bgColor="#F7F0E4">
        <Flex
          position="absolute"
          inset="0"
          bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
        />
        <Flex
          position="absolute"
          right="0"
          bottom="0"
          w="90%"
          h="calc(100% - 64px)"
          overflow="hidden"
          pointerEvents="none"
        >
          <img
            src="/images/diary/diary_bg.png"
            alt="日記背景"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "left bottom",
              opacity: 0.98,
              animation: `${diaryBgFloat} 12s ease-in-out infinite`,
            }}
          />
        </Flex>
        <Flex
          position="relative"
          zIndex={1}
          flex="1"
          minH="0"
          direction="column"
          ml="0"
          mr="16px"
          mt="8px"
          mb="0"
        >
          <Flex justifyContent="space-between" alignItems="center" pb="10px">
            <Flex w="86px" h="38px" />
            <Flex
              minW="132px"
              h="40px"
              px="20px"
              borderRadius="8px"
              bgColor="#A57C58"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontSize="16px" fontWeight="400">
                交換日記
              </Text>
            </Flex>
          </Flex>

          <Flex
            position="relative"
            flex="1"
            minH="0"
            overflow="hidden"
            ml="10%"
            mt="12px"
            mr="0"
          >
            <Flex
              flex="1"
              minH="0"
              direction="column"
              gap="18px"
              overflowY="auto"
              pl="48px"
              pr="16px"
              pt="50px"
              pb="18px"
              css={{ scrollbarWidth: "none" }}
            >
            {diaryCards.map((card) => {
              const isRevealTargetCard = card.id === revealEntryId;
              const isFxLocked = isRevealTargetCard && journalUnlockFxStage === "locked";
              const isFxUnlocking = isRevealTargetCard && journalUnlockFxStage === "unlocking";
              const isCardOpenable =
                card.id === "bai-entry-1" ||
                card.id === "bai-entry-2" ||
                card.id === "bai-entry-3" ||
                card.id === "bai-entry-5";
              const shouldShowEntryPointer =
                (isPhotoDiaryRevealMode || isChickenPhotoDiaryRevealMode) &&
                isRevealTargetCard &&
                diaryRevealStep === "ready" &&
                journalUnlockFxStage === "done";
              const cardUnlocked =
                isFxLocked || isFxUnlocking
                  ? false
                  : card.unlocked || (isRevealTargetCard && journalUnlockFxStage === "done");
              const isIncompleteSecondEntryCard =
                card.id === "bai-entry-2" &&
                isBaiEntry2FragmentOpen &&
                !isFxLocked &&
                !isFxUnlocking &&
                !(isRevealTargetCard && journalUnlockFxStage === "done");
              const isNextDiaryCatalogRevealCard =
                isNextDiaryCatalogGuideMode &&
                card.id === "bai-entry-2" &&
                nextDiaryCatalogRevealStage !== "idle";
              const isNextDiaryCatalogRevealing =
                isNextDiaryCatalogRevealCard && nextDiaryCatalogRevealStage === "revealing";
              const shouldShowNextDiaryCatalogPointer =
                isNextDiaryCatalogRevealCard &&
                (nextDiaryCatalogRevealStage === "ready" || nextDiaryCatalogRevealStage === "talked");
              const canOpenCard =
                (cardUnlocked || isIncompleteSecondEntryCard) &&
                isCardOpenable &&
                !isNextDiaryCatalogRevealing;
              const returnHomeDiaryClueEntryForCard =
                card.id === "bai-entry-5"
                  ? "entry-bai-5"
                  : null;
              const isFrogReturnHomeDiaryCardSeen =
                returnHomeDiaryClueEntryForCard !== null &&
                returnHomeDiarySeenClueEntries.includes(returnHomeDiaryClueEntryForCard);
              const nextFrogReturnHomePointerEntry: ReturnHomeDiaryClueEntry = "entry-bai-5";
              const isFrogReturnHomeNewDiaryCard =
                isFrogReturnHomeDiaryGuideMode &&
                cardUnlocked &&
                returnHomeDiaryClueEntryForCard !== null &&
                !isFrogReturnHomeDiaryCardSeen;
              const shouldShowFrogReturnHomeDiaryPointer =
                isFrogReturnHomeNewDiaryCard &&
                returnHomeDiaryClueEntryForCard === nextFrogReturnHomePointerEntry;
                return (
                  <Flex key={card.id} position="relative">
                    {shouldShowEntryPointer || shouldShowNextDiaryCatalogPointer || shouldShowFrogReturnHomeDiaryPointer ? (
                      <Flex
                        position="absolute"
                        left="-52px"
                        top="50%"
                        zIndex={3}
                        w="44px"
                        h="44px"
                        pointerEvents="none"
                        animation={`${diaryEntryPointerNudge} 1.12s ease-in-out infinite`}
                      >
                        <img
                          src="/images/pointer_up.png"
                          alt=""
                          aria-hidden="true"
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    ) : null}
                    <Flex
                      as="button"
	                      onClick={() => {
	                        if (!canOpenCard) return;
                          setReturnHomeDiaryClueEntry(null);
                          setIsBaiEntry1NaotaroOpenReveal(false);
                          if (isIncompleteSecondEntryCard) {
                            setNextDiaryCatalogTalkIndex(null);
                            setJournalView("entry-bai-2-fragment");
                            if (isFirstPhotoDiaryRevealMode || isFrogDiaryCatalogGuideMode) {
                              setIsIncompleteDiaryReactionVisible(true);
                            }
                            return;
                          }
	                        if (card.id === "bai-entry-1") {
	                          setBaiEntry1VisualPageIndex(0);
	                          setIsBaiEntry1VisualRevealComplete(false);
	                          setJournalView("entry-bai-1");
	                        }
	                        if (card.id === "bai-entry-2") setJournalView("entry-bai-2");
	                        if (card.id === "bai-entry-3") setJournalView("entry-bai-3");
	                        if (card.id === "bai-entry-5") setJournalView("entry-bai-5");
	                      }}
                      cursor={canOpenCard ? "pointer" : "default"}
                      position="relative"
                      w="100%"
                      h="162px"
                      minH="162px"
                      flexShrink={0}
                      borderRadius="8px"
                      overflow="hidden"
                      bgColor="#FAF3E7"
                      border="1px solid rgba(205,192,177,0.22)"
                      animation={
                        isFxUnlocking
                          ? `${unlockPulse} 620ms ease-out 1`
                          : isNextDiaryCatalogRevealing
                            ? `${diaryCatalogCardPop} 620ms ease-out both, ${unlockPulse} 760ms ease-out 1`
                            : undefined
                      }
	                    >
	                      {cardUnlocked ? (
	                        card.id === "bai-entry-1" ? (
	                          <Flex h="100%" w="100%" bgColor="#EBE3DB" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#9D7859" fontSize="15px" fontWeight="800" lineHeight="1">
	                              {card.title}
	                            </Text>
	                          </Flex>
	                        ) : card.id === "bai-entry-3" ? (
	                          <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
	                              早餐店桌邊的速寫，
	                              <br />
	                              上面畫了一隻很專心的公雞
	                            </Text>
	                          </Flex>
	                        ) : card.id === "bai-entry-5" ? (
	                          <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
	                              餐桌旁的速寫，
	                              <br />
	                              旁邊畫了一隻抱著菜單的無尾熊
	                            </Text>
	                          </Flex>
	                        ) : (
	                          <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
	                              搬家紙箱旁的速寫，
	                              <br />
	                              旁邊畫了一隻滿臉通紅的青蛙
	                            </Text>
	                          </Flex>
	                        )
                      ) : isIncompleteSecondEntryCard ? (
                        <Flex h="100%" w="100%" position="relative" overflow="hidden" bgColor="#FFFDF8">
                          <Flex
                            position="absolute"
                            inset="0"
                            bg="linear-gradient(180deg, rgba(255,253,249,0.34) 0%, rgba(255,253,249,0.86) 100%)"
                          />
                          <Flex
                            position="absolute"
                            left="0"
                            top="0"
                            w={hasBaiEntry2FirstPhotoFragment ? "56%" : "64%"}
                            h="70%"
                            overflow="hidden"
                            borderRight="2px dashed rgba(165,124,88,0.38)"
                            borderBottom="2px dashed rgba(165,124,88,0.38)"
                            bgColor="#E9DFD2"
                            clipPath="polygon(0 0, 100% 0, 92% 78%, 74% 70%, 62% 86%, 45% 74%, 0 86%)"
                            boxShadow="0 8px 14px rgba(80,54,33,0.1)"
                          >
                            <MovingDiaryIllustration />
                          </Flex>
                          {hasBaiEntry2FirstPhotoFragment ? (
                            <Flex
                              position="absolute"
                              right="0"
                              top="34px"
                              w="58%"
                              h="64%"
                              overflow="hidden"
                              borderLeft="2px dashed rgba(165,124,88,0.34)"
                              borderBottom="2px dashed rgba(165,124,88,0.34)"
                              bgColor="#E9DFD2"
                              clipPath="polygon(8% 0, 100% 0, 100% 86%, 84% 78%, 72% 90%, 56% 80%, 0 88%, 0 18%)"
                              boxShadow="0 8px 14px rgba(80,54,33,0.1)"
                            >
                              <MovingDiaryIllustration />
                            </Flex>
                          ) : null}
                          <Flex
                            position="absolute"
                            top="12px"
                            right="12px"
                            h="28px"
                            px="12px"
                            borderRadius="999px"
                            bgColor="#A57C58"
                            alignItems="center"
                            boxShadow="0 4px 10px rgba(80,54,33,0.12)"
                          >
                            <Text color="#FFFFFF" fontSize="12px" fontWeight="800" lineHeight="1">
                              殘缺篇章
                            </Text>
                          </Flex>
                          <Flex
                            position="absolute"
                            left="16px"
                            right="16px"
                            bottom="16px"
                            direction="column"
                            gap="6px"
                          >
                            <Text color="#8F6A4D" fontSize="16px" fontWeight="800" lineHeight="1">
                              {card.title}
                            </Text>
                            <Text color="#A57C58" fontSize="13px" fontWeight="600" lineHeight="1.45">
                              {hasBaiEntry2SecondFragment
                                ? "第一格已完整，第二格已補完，第三格殘缺線索也浮現了。"
                                : hasBaiEntry2FirstPhotoFragment
                                  ? "第一格已補完，第二格殘缺線索浮現了。"
                                  : "只浮現了第一格，後面的日記還缺著。"}
                            </Text>
                          </Flex>
                        </Flex>
	                      ) : (
                        <>
                          <Flex position="absolute" inset="0" bgColor="#EBE3DB" />
                          <Flex
                            position="absolute"
                            inset="0"
                            bgColor="rgba(240,236,231,0.68)"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="#7E7A76" fontSize="36px" lineHeight="1">
                              🔒
                            </Text>
                          </Flex>
                        </>
                      )}

                      {isFxUnlocking ? (
                        <Flex
                          position="absolute"
                          inset="0"
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                        >
                          <Flex
                            px="12px"
                            py="4px"
                            borderRadius="999px"
                            bgColor="rgba(255, 248, 220, 0.92)"
                            border="1px solid rgba(175, 137, 94, 0.5)"
                          >
                            <Text color="#6A5037" fontSize="13px" fontWeight="700">
                              🔓 已解鎖
                            </Text>
                          </Flex>
                        </Flex>
                      ) : null}
                      {isNextDiaryCatalogRevealing ? (
                        <Flex
                          position="absolute"
                          inset="0"
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                          bgColor="rgba(255, 253, 249, 0.12)"
                        >
                          <Flex
                            px="14px"
                            py="6px"
                            borderRadius="999px"
                            bgColor="rgba(255, 248, 220, 0.94)"
                            border="1px solid rgba(175, 137, 94, 0.55)"
                            boxShadow="0 8px 18px rgba(80,54,33,0.16)"
                          >
                            <Text color="#6A5037" fontSize="13px" fontWeight="800">
                              新篇章浮現
                            </Text>
                          </Flex>
                        </Flex>
                      ) : null}
                      {isFrogReturnHomeNewDiaryCard ? (
                        <Flex
                          position="absolute"
                          top="12px"
                          right="12px"
                          h="26px"
                          minW="52px"
                          px="10px"
                          borderRadius="999px"
                          bgColor="#FF5C3D"
                          border="2px solid #FFFDF8"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 5px 12px rgba(80,54,33,0.18)"
                          pointerEvents="none"
                        >
                          <Text color="#FFFFFF" fontSize="12px" fontWeight="900" lineHeight="1" letterSpacing="0">
                            NEW
                          </Text>
                        </Flex>
                      ) : null}
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
          {isJournalEntryGuideActive || isFirstPhotoDiaryRevealMode ? null : (
            <Flex pt="14px" pb="18px" justifyContent="center" flexShrink={0}>
              <Flex
                as="button"
                h="44px"
                minW="132px"
                px="20px"
                borderRadius="999px"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
                gap="8px"
                boxShadow="0 6px 14px rgba(78,55,31,0.12)"
                onClick={onClose}
              >
                <Text color="white" fontSize="26px" fontWeight="400" lineHeight="1" transform="translateY(-2px)">
                  ‹
                </Text>
                <Text color="white" fontSize="16px" fontWeight="700" lineHeight="1">
                  返回
                </Text>
              </Flex>
            </Flex>
          )}
          {nextDiaryCatalogTalkLine ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={20}
              direction="column"
              justifyContent="flex-end"
              pointerEvents="auto"
              cursor="pointer"
              onClick={advanceNextDiaryCatalogTalk}
            >
              {isNextDiaryCatalogTalkAvatarVisible ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite
                    spriteId={nextDiaryCatalogTalkLine.spriteId}
                    frameIndex={nextDiaryCatalogTalkLine.frameIndex}
                  />
                </Flex>
              ) : null}
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                {nextDiaryCatalogTalkLine.showName === false ? null : (
                  <Text color="white" fontWeight="700">
                    {nextDiaryCatalogTalkLine.speaker}
                  </Text>
                )}
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {nextDiaryCatalogTalkLine.text}
                  </Text>
                </Flex>
                <EventContinueAction
                  label="點擊繼續"
                  onClick={advanceNextDiaryCatalogTalk}
                />
              </EventDialogPanel>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    );
  }, [
	    activeTab,
    activeReturnHomeDiaryClueItems,
	    activeSunbeastFilter,
	    baiEntry1VisualPageIndex,
    baiEntry2PuzzleOrder,
	    isBaiEntry1VisualRevealComplete,
	    isBaiEntry1TitleRevealed,
	    isBaiEntry1FirstTextRevealed,
	    isBaiEntry1NaotaroOpenReveal,
	    comicPageIndex,
    diaryRevealStep,
    diaryReadTalkIndex,
    firstPhotoDiaryStage,
    fragmentedDiaryClueStage,
    fragmentedDiaryIntroTalkIndex,
    metroFragmentCompletionStage,
    fragmentedDiaryStage,
    completeMetroFragmentPuzzleReward,
    continueAfterBaiEntry2Puzzle,
    continueMetroFragmentCompletionTalk,
    handleBaiEntry2PuzzleSlotSwap,
    handleBaiEntry2PuzzleSlotSelect,
    handleMetroFragmentRhythmGroupSelect,
    handleMetroFragmentPuzzleSlotSelect,
    handleMetroFragmentPuzzleSlotSwap,
    hasReconstructedMetroFragmentClue,
    hasSelectedMetroFragmentClue,
    hasCompletedBaiEntry2Puzzle,
    isBaiEntry2PuzzleSolved,
    metroFragmentRhythmGroupIndex,
    metroFragmentPuzzleOrder,
    selectedMetroFragmentPuzzleSlotIndex,
    selectedBaiEntry2PuzzleSlotIndex,
    frogDiaryFragmentPhotoAttemptCount,
    frogFragmentIntroStage,
    nextDiaryCatalogRevealStage,
    nextDiaryCatalogTalkIndex,
    hasBaiEntry1,
    hasBaiEntry2,
    hasBaiEntry3,
    hasBaiEntry5,
    hasBaiEntry2FirstPhotoFragment,
    hasBaiEntry2SecondFragment,
    isBeigoProfileMode,
    isDiaryReadTalkVisible,
    isNextDiaryFragmentPreviewVisible,
    isFragmentedDiaryReactionVisible,
    isIncompleteDiaryReactionVisible,
    isComicControlsVisible,
    isComicReadMode,
    isDiaryRevealMode,
    isChickenPhotoDiaryRevealMode,
    isFirstPhotoDiaryRevealMode,
    isFrogDiaryCatalogGuideMode,
    isFragmentedDiaryMode,
    isFrogFragmentedDiaryMode,
    isFrogReturnHomeDiaryGuideMode,
    isMarketingDiaryThreadMode,
    isNextDiaryCatalogGuideMode,
    isPhotoDiaryRevealMode,
    isSecondPhotoDiaryRevealMode,
    isGuidedJournalRevealMode,
    isBaiEntry2FragmentOpen,
    isJournalEntryGuideActive,
    isSunbeastDirectMode,
    journalUnlockFxStage,
    journalView,
    revealEntryId,
    returnHomeDiarySeenClueEntries,
    hasShownComicReadHint,
    isSunbeastRevealMode,
    isSunbeastGuidedMode,
    onClose,
    showComicReadHint,
    stickerCollection,
    selectedSunbeastCardId,
    activeSunbeastDetailTab,
    sunbeastDetailRevealStep,
    sunbeastFirstRevealPhase,
    sunbeastFirstRevealQuestionCount,
    sunbeastIntroStep,
    isSunbeastHintTalkVisible,
    sunbeastHintTalkStep,
    sunbeastHintTalkFrameIndex,
    isSunbeastShadowGuideVisible,
    sunbeastShadowGuideStep,
    sunbeastShadowGuideTargetId,
    activeGuidedSunbeastHintId,
    sunbeastProgress,
    sunbeastView,
    onBeigoProfileComplete,
    onFragmentedDiaryComplete,
    onGuidedFlowComplete,
    onDiaryRevealEntryComplete,
    onSunbeastHintGuideComplete,
    open,
    showReturnButton,
    activeDiaryReadTalkLines,
    advanceDiaryReadTalk,
    advanceFragmentedDiaryIntroTalk,
    advanceNextDiaryCatalogTalk,
    completeFragmentedDiaryReaction,
    completeNextDiaryFragmentPreview,
    completeReturnHomeDiaryClue,
    finishFragmentedDiaryClue,
    startFragmentedDiaryClueReward,
  ]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={70}
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      opacity={open ? 1 : 0}
      pointerEvents={open ? "auto" : "none"}
      transition="opacity 0.22s ease"
    >
      <Flex
        position="absolute"
        inset="0"
        bgColor="rgba(0, 0, 0, 0.25)"
        onClick={onClose}
      />
      <Flex
        w="100%"
        h="100%"
        bgColor="#F1E7D7"
        direction="column"
        transform={open ? "translateY(0)" : "translateY(12px)"}
        transition="transform 0.22s ease"
      >
        {isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? null : (
          <>
            <Flex
              h="72px"
              px="16px"
              bgColor="#9D7859"
              borderBottom="1px solid rgba(255,255,255,0.28)"
              alignItems="center"
              justifyContent="space-between"
            >
              <Flex onClick={onClose} cursor="pointer">
                <Text color="white" fontSize="18px" fontWeight="700">
                  {isGuidedJournalRevealMode ? "< 繼續劇情" : "< 返回"}
                </Text>
              </Flex>
              <Text color="#FFF7EE" fontSize="20px" fontWeight="700" lineHeight="1">
                交換日記
              </Text>
              <Flex w="64px" />
            </Flex>

            {isGuidedJournalRevealMode ? (
              <Flex px="16px" py="8px" bgColor="#E7D5BF">
                <Text color="#6D5B48" fontSize="12px" fontWeight="700">
	                  {isPhotoDiaryRevealMode
	                    ? "剛剛拍到的小日獸，好像跑進交換日記裡了。"
	                    : "先找到恢復的那一頁日記。"}
                </Text>
              </Flex>
            ) : isSunbeastRevealMode ? (
              <Flex px="16px" py="8px" bgColor="#E7D5BF">
                <Flex
                  h="30px"
                  px="14px"
                  borderRadius="999px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="#9D7859"
                >
                  <Text color="white" fontSize="12px" fontWeight="700">
                    小日獸
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex px="16px" py="10px" gap="6px" bgColor="#E7D5BF">
                <Flex
                  flex="1"
                  h="30px"
                  borderRadius="8px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="#9D7859"
                  cursor="pointer"
                  onClick={() => {
                    setActiveTab("journal");
                    setJournalView("list");
                    setIsComicReadMode(false);
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    setComicPageIndex(0);
                  }}
                >
                  <Text color={activeTab === "journal" ? "white" : "#6D5B48"} fontSize="12px" fontWeight="700">
                    日記頁
                  </Text>
                </Flex>
                <Flex
                  flex="1"
                  h="30px"
                  borderRadius="8px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="rgba(157,120,89,0.2)"
                  cursor="pointer"
                  onClick={() => {
                    setActiveTab("sunbeast");
                    setJournalView("list");
                    setIsComicReadMode(false);
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    setComicPageIndex(0);
                  }}
                >
                  <Text color="#6D5B48" fontSize="12px" fontWeight="700">
                    小日獸
                  </Text>
                </Flex>
              </Flex>
            )}
          </>
        )}

        <Flex
          flex="1"
          px={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "16px"}
          pt={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "12px"}
          pb={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "16px"}
          direction="column"
          overflow="hidden"
          bgColor={isComicReadMode ? "#0F0F0F" : shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "#F7F0E4" : "#FBF5EA"}
          bgImage={isAnyFragmentedDiaryMode ? DIARY_PAGE_STRIPE_BACKGROUND : undefined}
          position="relative"
        >
          {content}
        </Flex>
      </Flex>
      {introStage === "photo" || introStage === "score" || introStage === "points" || introStage === "gacha" || introStage === "result" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={120}
          bgColor="#FBFAF5"
          direction="column"
          alignItems="center"
          justifyContent="space-between"
          px="16px"
          py="34px"
          overflow="hidden"
        >
          <Flex
            position="absolute"
            inset="0"
            backgroundImage="radial-gradient(circle at 50% 26%, rgba(238,219,187,0.34), transparent 32%), linear-gradient(180deg, #F8F5EC 0%, #FFFFFF 42%, #F8F1E8 100%)"
          />

          <Flex position="relative" zIndex={1} direction="column" alignItems="center" gap="8px" pt="6px">
            <Text color="#5F4C3B" fontSize="21px" fontWeight="800" textAlign="center">
              {introStage === "result" ? "抽到貼紙了" : introStage === "gacha" ? "抽取貼紙" : "拍到的照片"}
            </Text>
            <Text color="#9D7859" fontSize="12px" fontWeight="700" textAlign="center">
              {introStage === "photo"
                ? "先確認這次捕捉到的小日獸"
                : introStage === "score"
                  ? "精準度會轉換成抽獎點數"
                  : introStage === "points"
                    ? "點數越高，稀有貼紙機率越高"
                    : introStage === "gacha"
                      ? "日記能量正在翻成貼紙"
                      : introReward?.isNewSticker
                        ? "新的收藏已經亮起來了"
                        : "已收集過，收藏仍會保留紀錄"}
            </Text>
          </Flex>

          <Flex
            position="relative"
            zIndex={1}
            flex="1"
            minH="0"
            w="100%"
            maxW="344px"
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="18px"
          >
            <Flex
              key={`photo-card-${introStage}`}
              w={introStage === "result" ? "210px" : "min(100%, 274px)"}
              h={introStage === "result" ? "252px" : "326px"}
              borderRadius="10px"
              bgColor="#FFFDF9"
              border="1px solid rgba(180,164,142,0.55)"
              boxShadow="0 18px 36px rgba(77,58,38,0.18)"
              p={introStage === "result" ? "10px 10px 34px" : "12px 12px 42px"}
              position="relative"
              direction="column"
              animation={
                introStage === "photo"
                  ? `${photoCardFloat} 3.8s ease-in-out infinite`
                  : `${revealStageIn} 360ms ease both`
              }
            >
              <Flex w="100%" flex="1" minH="0" borderRadius="5px" bgColor="#EFE8DC" border="1px solid rgba(130,112,90,0.22)" overflow="hidden" alignItems="center" justifyContent="center">
                {introStage === "result" ? (
                  <img
                    src={currentStickerMeta.image}
                    alt={currentStickerMeta.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <img
                    src={effectivePhotoSnapshot.previewImage}
                    alt="還原拍攝結果"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                )}
              </Flex>
              {introStage === "result" ? (
                <Flex position="absolute" left="0" right="0" bottom="9px" direction="column" alignItems="center" gap="2px">
                  <Text color="#5C4937" fontSize="14px" fontWeight="800" lineHeight="1">
                    {currentStickerMeta.title}
                  </Text>
                  <Text color="#A98362" fontSize="10px" fontWeight="700" lineHeight="1">
                    {currentStickerMeta.subtitle}
                  </Text>
                </Flex>
              ) : null}
            </Flex>

            {introStage === "score" ? (
              <Flex
                key="score-panel"
                w="100%"
                borderRadius="18px"
                bgColor="#FFF7EA"
                border="1px solid rgba(169,131,98,0.18)"
                boxShadow="0 10px 24px rgba(91,68,45,0.08)"
                p="14px"
                direction="column"
                gap="10px"
                animation={`${revealStageIn} 320ms ease both`}
              >
                <Flex alignItems="center" justifyContent="space-between">
                  <Text color="#6E5844" fontSize="13px" fontWeight="800">
                    拍攝精準度
                  </Text>
                  <Text color="#5F4C3B" fontSize="26px" fontWeight="900" lineHeight="1">
                    {currentPhotoScore}%
                  </Text>
                </Flex>
                <Flex h="10px" borderRadius="999px" bgColor="#E8D8C4" overflow="hidden">
                  <Flex
                    w={`${currentPhotoScore}%`}
                    h="100%"
                    bgColor={currentPhotoScore >= 85 ? "#F0BE4A" : currentPhotoScore >= 70 ? "#CFA36A" : "#A98362"}
                    borderRadius="999px"
                    transformOrigin="left center"
                    animation={`${meterFill} 720ms ease-out both`}
                  />
                </Flex>
              </Flex>
            ) : null}

            {introStage === "points" ? (
              <Flex
                key="points-panel"
                w="100%"
                borderRadius="20px"
                bgColor="#6E5844"
                p="16px"
                direction="column"
                alignItems="center"
                gap="8px"
                boxShadow="0 14px 30px rgba(58,42,28,0.22)"
                animation={`${pointPulse} 420ms ease both`}
              >
                <Text color="#F6E7D2" fontSize="12px" fontWeight="800">
                  轉換完成
                </Text>
                <Flex alignItems="baseline" gap="7px">
                  <Text color="white" fontSize="44px" fontWeight="900" lineHeight="1">
                    {currentPhotoPoints}
                  </Text>
                  <Text color="#F6E7D2" fontSize="15px" fontWeight="800">
                    點
                  </Text>
                </Flex>
                <Text color="#D8BE9F" fontSize="11px" fontWeight="700">
                  {currentPhotoScore}% 精準度換算
                </Text>
              </Flex>
            ) : null}

            {introStage === "gacha" ? (
              <Flex key="gacha-panel" alignItems="center" justifyContent="center" direction="column" gap="12px" animation={`${revealStageIn} 260ms ease both`}>
                <Flex
                  w="106px"
                  h="132px"
                  borderRadius="12px"
                  bgColor="#A98362"
                  border="3px solid #F2E2C9"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 14px 28px rgba(72,52,34,0.22)"
                  animation={`${gachaFlip} 950ms ease-in-out infinite`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Text color="#FFF7EA" fontSize="54px" fontWeight="900" lineHeight="1">
                    ?
                  </Text>
                </Flex>
                <Text color="#6E5844" fontSize="13px" fontWeight="800">
                  抽取中...
                </Text>
              </Flex>
            ) : null}

            {introStage === "result" ? (
              <Flex key="result-panel" direction="column" alignItems="center" gap="8px" animation={`${revealStageIn} 300ms ease both`}>
                <Flex px="12px" py="7px" borderRadius="999px" bgColor={introReward?.isNewSticker ? "#F0BE4A" : "#A98362"} animation={introReward?.isNewSticker ? `${rewardGlow} 1.2s ease-in-out infinite` : undefined}>
                  <Text color="white" fontSize="12px" fontWeight="900">
                    {introReward?.isNewSticker ? "NEW" : "已收藏"}
                  </Text>
                </Flex>
                <Text color="#5C4937" fontSize="16px" fontWeight="900" textAlign="center">
                  {currentStickerMeta.subtitle}
                </Text>
              </Flex>
            ) : null}
          </Flex>

          <Flex
            position="relative"
            zIndex={1}
            w="86%"
            maxW="320px"
            direction="column"
            gap="8px"
            alignItems="stretch"
            pb="6px"
          >
            {introStage === "photo" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={startDiaryRevealAfterPhoto} boxShadow="0 10px 24px rgba(100,72,45,0.16)">
                <Text color="white" fontSize="15px" fontWeight="800">
                  查看精準度
                </Text>
              </Flex>
            ) : null}
            {introStage === "score" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={goToPointsStage}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  轉換成點數
                </Text>
              </Flex>
            ) : null}
            {introStage === "points" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={runGacha}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  用 {currentPhotoPoints} 點抽貼紙
                </Text>
              </Flex>
            ) : null}
            {introStage === "result" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={collectReward}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  收藏貼紙
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

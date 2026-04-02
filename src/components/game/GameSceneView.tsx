"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { FaMusic } from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  AFTER_REWARD_SCENE_ID,
  getChapterScenesUntilScene,
  type GameScene,
  type StoryComicImageId,
  type StoryComicOverlay,
} from "@/lib/game/scenes";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  UnlockFeedbackOverlay,
  type UnlockFeedbackItem,
} from "@/components/game/UnlockFeedbackOverlay";
import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
} from "@/lib/game/avatarCheatBus";
import { GAME_BACKGROUND_SHAKE_TRIGGER } from "@/lib/game/backgroundShakeBus";
import {
  GAME_SCENE_TRANSITION_TRIGGER,
  type SceneTransitionPayload,
} from "@/lib/game/sceneTransitionBus";
import {
  claimOffworkRewardBatch,
  claimOffworkReward,
  FIRST_OFFWORK_REWARD_PATTERN,
  generateOffworkRewardPattern,
  loadPlayerProgress,
  rolloverDailyEventFlags,
  savePlayerProgress,
  setEncounteredCharacter,
  unlockDiaryEntry,
  recordPhotoCapture,
  type PlaceTileId,
  type RewardPlaceTile,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";
import {
  DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL,
  applyWorkTransitionFatigue,
  isWorkTransitionSceneId,
} from "@/lib/game/workTransition";
import {
  GAME_DIALOG_TYPING_MODE_CHANGE,
  loadDialogTypingMode,
  saveDialogTypingMode,
  type DialogTypingMode,
} from "@/lib/game/dialogTyping";
import { AVATAR_MOTION_DURATION_MS } from "@/lib/game/avatarPerformance";

const GAME_COMIC_CHEAT_TRIGGER = "moment:comic-cheat-trigger";
const LEGACY_ROUTE_TUTORIAL_SCENE_ID = "__legacy-scene-41";
const LEGACY_QA_SCENE_ID = "__legacy-scene-44";
const LEGACY_NIGHT_HUB_SCENE_ID = "scene-night-hub";
const COMIC_IMAGE_BY_ID = {
  freshen: "/images/comic/freshen.jpg",
  puppet: "/images/comic/comic_%20puppet.png",
  book: "/images/comic/book.jpg",
  throwBook: "/images/comic/throw_book.png",
  beigoJumpBed: "/images/comic/beigoJumpBed.jpg",
  beigoBag01: "/images/comic2/ch01_bego_bag_01.jpg",
  beigoBag02: "/images/comic2/ch01_bego_bag_02.jpg",
  comicCamera: "/images/comic/Comic_Camera.png",
  diaryDemo: "/images/diary/diary_demo.jpg",
} satisfies Record<StoryComicImageId, string>;

type OffworkRewardOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
};

type WeekendDestinationOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
  effectLabel: string;
  resultText: string;
  applyStatus: (status: PlayerStatus) => PlayerStatus;
};

type EndDaySummaryContent = {
  title: string;
  body: string;
  chips: [string, string];
};

type CharacterIntroCard = {
  sceneId: string;
  name: string;
  englishName: string;
  descriptionLines: [string, string];
  spriteSheetPath: string;
  spriteCols: number;
  spriteRows: number;
  spriteFrameIndex: number;
  theme: {
    topBar: string;
    band: string;
    bandBorder: string;
    button: string;
    buttonText: string;
  };
};

const STREET_OPTION: OffworkRewardOption = {
  id: "street",
  title: "街道",
  icon: "💡",
  subtitle: "熟悉路線",
};

const METRO_OPTION: OffworkRewardOption = {
  id: "metro-station",
  title: "捷運",
  icon: "🚉",
  subtitle: "通勤節點",
};

const REWARD_POOL_OPTIONS: OffworkRewardOption[] = [
  { id: "park", title: "公園", icon: "🌳", subtitle: "喘口氣" },
  STREET_OPTION,
  METRO_OPTION,
  { id: "breakfast-shop", title: "早餐店", icon: "🥪", subtitle: "補充元氣" },
];
const FIRST_NON_CORE_PLACE_PATTERN: TilePattern3x3 = [
  [0, 0, 0],
  [0, 1, 1],
  [0, 1, 0],
];
const SECOND_NON_CORE_PLACE_PATTERN: TilePattern3x3 = [
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 0],
];
const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const fadeOutToBlack = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const fadeInFromBlack = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;
const fadeOutInBlack = keyframes`
  0% { opacity: 0; }
  45% { opacity: 1; }
  55% { opacity: 1; }
  100% { opacity: 0; }
`;
const summaryCardIn = keyframes`
  0% { opacity: 0; transform: translateY(10px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;
const summaryCardOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-6px) scale(0.99); }
`;
const dayDateOldFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  42% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
`;
const dayDateNewFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  42% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroBgFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const characterIntroBandSlideIn = keyframes`
  0% { opacity: 0; transform: translateX(120%) rotate(-16deg); }
  100% { opacity: 1; transform: translateX(0) rotate(-16deg); }
`;
const characterIntroTextFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroAvatarRise = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.94); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;
const characterIntroGlowPulse = keyframes`
  0%, 100% { opacity: 0.28; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.45; transform: translateX(-50%) scale(1.05); }
`;
const characterIntroOkPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(77,120,133,0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(77,120,133,0.0); }
`;
const scene5OutfitPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const scene5HappyAvatarFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const scene6SpeechBubbleFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg); }
  50% { transform: translateY(-6px) rotate(1deg); }
`;
const scene6MusicIconSwing = keyframes`
  0%, 100% { transform: rotate(-10deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-1px); }
`;
const scene20DropletFall = keyframes`
  0% { opacity: 0; transform: translateY(-8px) scale(0.88); }
  20% { opacity: 1; transform: translateY(-2px) scale(1); }
  78% { opacity: 1; transform: translateY(9px) scale(0.98); }
  100% { opacity: 0; transform: translateY(14px) scale(0.92); }
`;
const creatureFlashBy = keyframes`
  0% { opacity: 0; transform: translateX(52px) scale(0.82); filter: blur(5px); }
  18% { opacity: 0.92; transform: translateX(6px) scale(0.96); filter: blur(2px); }
  78% { opacity: 0.92; transform: translateX(-88px) scale(1.02); filter: blur(1px); }
  100% { opacity: 0; transform: translateX(-132px) scale(1.04); filter: blur(6px); }
`;
const floatingBaiDrift = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
`;
const floatingBaiGlow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(0.98); }
  50% { opacity: 0.92; transform: scale(1.08); }
`;
const glowingBookPulse = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.92); }
  18% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  72% { opacity: 1; transform: translate(-50%, -2px) scale(1.03); }
  100% { opacity: 0; transform: translate(-50%, -10px) scale(1.08); }
`;
const glowingBookRay = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  22% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.28); }
`;

const CHARACTER_INTRO_BY_SCENE_ID: Record<string, CharacterIntroCard> = {
  "scene-3": {
    sceneId: "scene-3",
    name: "小麥",
    englishName: "MUGI",
    descriptionLines: [
      "剛出社會兩年的職場新鮮人",
      "平時省吃儉用，但看到喜歡的東西還是會手滑的平凡女孩",
    ],
    spriteSheetPath: "/images/mai/Mai_Spirt.png",
    spriteCols: 6,
    spriteRows: 3,
    spriteFrameIndex: 13,
    theme: {
      topBar: "rgba(220, 193, 178, 0.92)",
      band: "rgba(183, 141, 128, 0.94)",
      bandBorder: "rgba(139, 94, 82, 0.76)",
      button: "#A86E61",
      buttonText: "#FFF4F0",
    },
  },
  "scene-13": {
    sceneId: "scene-13",
    name: "小白",
    englishName: "SHIRO",
    descriptionLines: [
      "小麥的現任室友兼大學好友",
      "自由接案的動畫師，時常燃燒生命趕稿",
    ],
    spriteSheetPath: "/images/bai/Bai_Spirt.png",
    spriteCols: 7,
    spriteRows: 1,
    spriteFrameIndex: 2,
    theme: {
      topBar: "rgba(181, 208, 214, 0.9)",
      band: "rgba(131, 170, 179, 0.94)",
      bandBorder: "rgba(84,127,137,0.74)",
      button: "#4D7885",
      buttonText: "#EFF8FB",
    },
  },
};

type PendingSceneTransitionPayload = {
  toSceneId: string;
  preset: "fade-black" | "next-day";
  durationMs: number;
  createdAt: number;
};

type Scene4FreshenPhase = "idle" | "avatar-exit" | "comic-visible" | "comic-fade" | "done";
type Scene5OutfitRevealPhase = "hidden" | "modal-enter" | "pose-rise" | "modal-exit" | "dialog";
type Scene9PuppetRevealPhase = "hidden" | "prop" | "dialog";
type Scene10ExitPhase = "idle" | "exiting";
type Scene14PuppetPhase = "hidden" | "visible";
type Scene55BookPhase = "glow" | "dialog";
type ComicCheatId = keyof typeof COMIC_IMAGE_BY_ID;
type StoryComicId = keyof typeof COMIC_IMAGE_BY_ID;

function areStoryComicOverlaysEquivalent(
  left: StoryComicOverlay,
  right: StoryComicOverlay,
) {
  return (
    left.imageId === right.imageId &&
    left.alt === right.alt &&
    left.top === right.top &&
    left.left === right.left &&
    left.right === right.right &&
    left.width === right.width &&
    left.height === right.height &&
    left.maxWidth === right.maxWidth &&
    left.zIndex === right.zIndex
  );
}

function pickTwoRandomFromPool(pool: OffworkRewardOption[]): OffworkRewardOption[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 2);
}

function pickOffworkRewardOptions(
  offworkRewardClaimCount: number,
  hasPassedThroughStreet: boolean,
): OffworkRewardOption[] {
  const attempt = offworkRewardClaimCount + 1;
  if (attempt === 1) return [METRO_OPTION, STREET_OPTION];
  if (attempt === 2) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3 && !hasPassedThroughStreet) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3) return pickTwoRandomFromPool(REWARD_POOL_OPTIONS);
  return [METRO_OPTION, STREET_OPTION];
}
type CustomRouteStep = "size" | "entry" | "exit" | "result";
type CustomRouteSize = "1x1" | "2x1";

const ENTRY_PATTERN_OPTIONS_6: number[][] = [
  [1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1],
];

const ENTRY_PATTERN_OPTIONS_3: number[][] = [
  [1, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const IN_GAME_CALENDAR_BASE = new Date(2024, 2, 11); // 星期一 3/11
const WEEKDAY_LABELS = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function formatInGameDateLabel(day: number): string {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const month = date.getMonth() + 1;
  const dateNumber = date.getDate();
  return `${weekday} ${month}/${dateNumber}`;
}

function getInGameWeekday(day: number) {
  const safeDay = Number.isFinite(day) && day >= 1 ? Math.floor(day) : 1;
  const date = new Date(IN_GAME_CALENDAR_BASE);
  date.setDate(IN_GAME_CALENDAR_BASE.getDate() + safeDay - 1);
  return date.getDay();
}

function isWeekendInGameDay(day: number) {
  const weekday = getInGameWeekday(day);
  return weekday === 0 || weekday === 6;
}

function buildWeekendDestinationOptions(progress: ReturnType<typeof loadPlayerProgress>): WeekendDestinationOption[] {
  const unlockedPlaceIds = new Set(progress.ownedPlaceTileIds);
  const options: WeekendDestinationOption[] = [
    {
      id: "metro-station",
      title: "捷運站",
      icon: "🚉",
      subtitle: "去熟悉的地方走走",
      effectLabel: "行動力 +1 / 疲勞 -4",
      resultText: "你搭著熟悉的路線晃了一圈，沒有趕時間的通勤變得輕鬆許多，心情也慢慢放鬆。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 4),
      }),
    },
  ];

  if (progress.hasPassedThroughStreet || unlockedPlaceIds.has("street")) {
    options.push({
      id: "street",
      title: "街道",
      icon: "💡",
      subtitle: "隨意散步看看",
      effectLabel: "疲勞 -6",
      resultText: "你在街道上慢慢散步，邊走邊看著周圍小店與行人，腦袋裡悶住的感覺淡了一些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 6),
      }),
    });
  }

  if (unlockedPlaceIds.has("park")) {
    options.push({
      id: "park",
      title: "公園",
      icon: "🌳",
      subtitle: "去透透氣",
      effectLabel: "疲勞 -10",
      resultText: "你在公園找了個舒服角落坐下來，吹著風發呆了一陣子，整個人都鬆開了些。",
      applyStatus: (status) => ({
        ...status,
        fatigue: Math.max(0, status.fatigue - 10),
      }),
    });
  }

  if (unlockedPlaceIds.has("breakfast-shop")) {
    options.push({
      id: "breakfast-shop",
      title: "早餐店",
      icon: "🥪",
      subtitle: "慢慢吃一頓",
      effectLabel: "儲蓄 -1 / 行動力 +1 / 疲勞 -8",
      resultText: "你點了一份喜歡的早餐坐著慢慢吃，週末的節奏讓這頓飯比平常更有安定感。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 8),
      }),
    });
  }

  if (unlockedPlaceIds.has("convenience-store")) {
    options.push({
      id: "convenience-store",
      title: "便利商店",
      icon: "🏪",
      subtitle: "買點小東西",
      effectLabel: "儲蓄 -1 / 行動力 +1",
      resultText: "你在便利商店裡慢慢晃，挑了點喜歡的小東西，覺得今天有一種被自己照顧到的感覺。",
      applyStatus: (status) => ({
        ...status,
        savings: Math.max(0, status.savings - 1),
        actionPower: Math.min(6, status.actionPower + 1),
      }),
    });
  }

  if (unlockedPlaceIds.has("bus-stop")) {
    options.push({
      id: "bus-stop",
      title: "公車站",
      icon: "🚌",
      subtitle: "換個方向晃晃",
      effectLabel: "行動力 +1 / 疲勞 -5",
      resultText: "你在公車站隨興搭了一小段，看看不熟悉的街景，像替這週留了一個空白又舒服的句點。",
      applyStatus: (status) => ({
        ...status,
        actionPower: Math.min(6, status.actionPower + 1),
        fatigue: Math.max(0, status.fatigue - 5),
      }),
    });
  }

  return options.slice(0, 3);
}

function normalizeEdgePatternToWidth(pattern: number[], width: 3 | 6): number[] {
  const normalized = pattern.map((cell) => (cell ? 1 : 0));
  if (normalized.length === width) return normalized;
  if (normalized.length === 6 && width === 3) {
    return [
      normalized[0] || normalized[1] ? 1 : 0,
      normalized[2] || normalized[3] ? 1 : 0,
      normalized[4] || normalized[5] ? 1 : 0,
    ];
  }
  if (normalized.length === 3 && width === 6) {
    return [normalized[0], normalized[0], normalized[1], normalized[1], normalized[2], normalized[2]];
  }
  return [
    normalized[0] ? 1 : 0,
    normalized[1] ? 1 : 0,
    normalized[2] ? 1 : 0,
  ];
}

function buildCustomRoutePattern(
  size: CustomRouteSize,
  entryPattern6: number[],
  exitPattern6: number[],
): number[][] {
  const width = size === "2x1" ? 6 : 3;
  const pattern = Array.from({ length: 3 }, () => Array.from({ length: width }, () => 0));
  const normalizedEntry = normalizeEdgePatternToWidth(entryPattern6, width as 3 | 6);
  const normalizedExit = normalizeEdgePatternToWidth(exitPattern6, width as 3 | 6);
  normalizedEntry.forEach((cell, index) => {
    pattern[0][index] = cell ? 1 : 0;
  });
  normalizedExit.forEach((cell, index) => {
    pattern[2][index] = cell ? 1 : 0;
  });

  const entryIndexes = normalizedEntry
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);
  const exitIndexes = normalizedExit
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);

  let entryAnchor = Math.floor((width - 1) / 2);
  let exitAnchor = Math.floor((width - 1) / 2);
  if (entryIndexes.length > 0) entryAnchor = entryIndexes[0];
  if (exitIndexes.length > 0) exitAnchor = exitIndexes[0];
  if (entryIndexes.length > 0 && exitIndexes.length > 0) {
    let bestPair: [number, number] = [entryIndexes[0], exitIndexes[0]];
    let bestDistance = Math.abs(bestPair[0] - bestPair[1]);
    entryIndexes.forEach((entryIndex) => {
      exitIndexes.forEach((exitIndex) => {
        const distance = Math.abs(entryIndex - exitIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPair = [entryIndex, exitIndex];
        }
      });
    });
    [entryAnchor, exitAnchor] = bestPair;
  }

  const start = Math.min(entryAnchor, exitAnchor);
  const end = Math.max(entryAnchor, exitAnchor);
  for (let col = start; col <= end; col += 1) {
    pattern[1][col] = 1;
  }

  // Ensure every chosen inlet/outlet column is connected into the center row,
  // while keeping top/bottom rows exactly as selected by the player.
  entryIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });
  exitIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });

  return pattern;
}

function toPattern3x3(pattern: number[][]): TilePattern3x3 {
  return [
    [pattern[0][0] ? 1 : 0, pattern[0][1] ? 1 : 0, pattern[0][2] ? 1 : 0],
    [pattern[1][0] ? 1 : 0, pattern[1][1] ? 1 : 0, pattern[1][2] ? 1 : 0],
    [pattern[2][0] ? 1 : 0, pattern[2][1] ? 1 : 0, pattern[2][2] ? 1 : 0],
  ];
}

function tilePatternKey(pattern: TilePattern3x3): string {
  return pattern.map((row) => row.map((value) => (value ? "1" : "0")).join("")).join("_");
}

function tileSourceLabel(sourceId: PlaceTileId): string {
  if (sourceId === "metro-station") return "捷運";
  if (sourceId === "street") return "街道";
  if (sourceId === "breakfast-shop") return "早餐店";
  if (sourceId === "park") return "公園";
  return "公車站";
}

const INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "010_010_010": "/images/route/rt_010_010_010.png",
  "010_110_000": "/images/route/rt_010_110_000.jpg",
  "000_011_010": "/images/route/rt_000_011_010.jpg",
  "100_010_001": "/images/route/rt_100_010_001.jpg",
  "100_010_010": "/images/route/rt_100_010_010.jpg",
  "111_010_010": "/images/route/rt_1111_010_010.jpg",
  "111_100_100": "/images/route/rt_1111_100_100.jpg",
};

function resolveInventoryTileImagePath(params: {
  category: "place" | "route";
  pattern: TilePattern3x3;
  sourceId?: PlaceTileId;
}) {
  const key = tilePatternKey(params.pattern);
  if (params.category === "place" && params.sourceId === "metro-station") {
    return "/images/route/rt_MRT_111_010_111.png";
  }
  return INVENTORY_ROUTE_IMAGE_BY_PATTERN_KEY[key];
}

const BASE_ROUTE_INVENTORY_PREVIEWS: Array<{
  label: string;
  pattern: TilePattern3x3;
}> = [
  { label: "0-3 -> 2-2", pattern: [[1, 1, 1], [0, 1, 0], [0, 1, 0]] },
  { label: "0-3 -> 2-1", pattern: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { label: "左上彎", pattern: [[0, 1, 0], [1, 1, 0], [0, 0, 0]] },
  { label: "右下彎短", pattern: [[0, 0, 0], [0, 1, 1], [0, 1, 0]] },
  { label: "左到右", pattern: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { label: "右到左", pattern: [[1, 0, 0], [0, 1, 0], [0, 1, 0]] },
];
export function GameSceneView({
  scene,
  onOffworkRewardOpenChange,
}: {
  scene: GameScene;
  onOffworkRewardOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSceneMenuOpen, setIsSceneMenuOpen] = useState(false);
  const [dialogTypingMode, setDialogTypingMode] = useState<DialogTypingMode>(() => loadDialogTypingMode());
  const historyScenes = getChapterScenesUntilScene(scene);
  const historyLines = useMemo(
    () =>
      historyScenes.map((item) => ({
        id: item.id,
        speaker: item.characterName,
        text: item.dialogue,
      })),
    [historyScenes],
  );
  const isImageOnlyScene = scene.showDialogueUI === false;
  const isOffworkScene = scene.id === "scene-offwork";
  const isWorkTransitionScene = isWorkTransitionSceneId(scene.id);
  const workTransitionBaseFatigue = useMemo(() => {
    const progress = loadPlayerProgress();
    return progress.status.fatigue;
  }, [scene.id]);
  const [isOffworkLabelVisible, setIsOffworkLabelVisible] = useState(isOffworkScene);
  const [isOffworkRewardOpen, setIsOffworkRewardOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<PlaceTileId | null>(null);
  const [selectedRewardActionCost, setSelectedRewardActionCost] = useState<0 | 1>(0);
  const [isFirstStreetPlaceReward, setIsFirstStreetPlaceReward] = useState(false);
  const [offworkRewardChoices, setOffworkRewardChoices] = useState<OffworkRewardOption[]>(
    [METRO_OPTION, STREET_OPTION],
  );
  const [offworkRewardClaimCount, setOffworkRewardClaimCount] = useState(0);
  const [nonCorePlaceRewardClaimCount, setNonCorePlaceRewardClaimCount] = useState(0);
  const [offworkModalStatus, setOffworkModalStatus] = useState<PlayerStatus>(INITIAL_PLAYER_STATUS);
  const [customRouteCostError, setCustomRouteCostError] = useState("");
  const [placeRewardCostError, setPlaceRewardCostError] = useState("");
  const [offworkRewardPattern, setOffworkRewardPattern] = useState<TilePattern3x3>(
    FIRST_OFFWORK_REWARD_PATTERN,
  );
  const [customRouteStep, setCustomRouteStep] = useState<CustomRouteStep | null>(null);
  const [customRouteSize, setCustomRouteSize] = useState<CustomRouteSize>("1x1");
  const [customRouteEntryPattern, setCustomRouteEntryPattern] = useState<number[] | null>(null);
  const [customRouteExitPattern, setCustomRouteExitPattern] = useState<number[] | null>(null);
  const storyComicTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const storyComicOverlayTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const previousStoryComicOverlaysRef = useRef<StoryComicOverlay[]>([]);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const [activeStoryComicId, setActiveStoryComicId] = useState<StoryComicId | null>(null);
  const [isStoryComicVisible, setIsStoryComicVisible] = useState(false);
  const [isStoryComicFading, setIsStoryComicFading] = useState(false);
  const [visibleStoryComicOverlayCount, setVisibleStoryComicOverlayCount] = useState(0);
  const [scenePhotoNaturalImageSize, setScenePhotoNaturalImageSize] = useState<NaturalImageSize | null>(
    null,
  );
  const scene4SequenceTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene4FreshenPhase, setScene4FreshenPhase] = useState<Scene4FreshenPhase>("idle");
  const scene5RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene5OutfitRevealPhase, setScene5OutfitRevealPhase] =
    useState<Scene5OutfitRevealPhase>("hidden");
  const scene9RevealTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [scene9PuppetRevealPhase, setScene9PuppetRevealPhase] =
    useState<Scene9PuppetRevealPhase>("hidden");
  const scene10ExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene10ExitPhase, setScene10ExitPhase] = useState<Scene10ExitPhase>("idle");
  const continueExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isContinueExitActive, setIsContinueExitActive] = useState(false);
  const scene14PuppetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene14PuppetPhase, setScene14PuppetPhase] = useState<Scene14PuppetPhase>("hidden");
  const scene55BookTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scene55BookPhase, setScene55BookPhase] = useState<Scene55BookPhase>("dialog");
  const comicCheatTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeComicCheatId, setActiveComicCheatId] = useState<ComicCheatId | null>(null);
  const [isComicCheatVisible, setIsComicCheatVisible] = useState(false);
  const [isComicCheatFading, setIsComicCheatFading] = useState(false);
  const diaryOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workTransitionDoneRef = useRef(false);
  const [doorTransitionPhase, setDoorTransitionPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-end",
  );
  const [isDoorTransitionVisible, setIsDoorTransitionVisible] = useState(false);
  const [outgoingTransition, setOutgoingTransition] = useState<{
    preset: "fade-black" | "next-day";
    durationMs: number;
  } | null>(null);
  const [incomingTransition, setIncomingTransition] = useState<{
    preset: "fade-black" | "next-day";
    durationMs: number;
  } | null>(null);
  const [previewTransitionDurationMs, setPreviewTransitionDurationMs] = useState<number | null>(null);
  const [previewTransitionNonce, setPreviewTransitionNonce] = useState(0);
  const [scene44Step, setScene44Step] = useState<"intro" | "choose" | "qa" | "final">("intro");
  const [scene44Asked, setScene44Asked] = useState<{ metro: boolean; dog: boolean }>({
    metro: false,
    dog: false,
  });
  const [scene44Topic, setScene44Topic] = useState<"metro" | "dog" | null>(null);
  const [scene44QATurn, setScene44QATurn] = useState<0 | 1>(0);
  const [scene44FinalTurn, setScene44FinalTurn] = useState<0 | 1>(0);
  const [nightHubStep, setNightHubStep] = useState<"choose" | "talk">("choose");
  const [nightHubAsked, setNightHubAsked] = useState<{ bai: boolean; beigo: boolean }>({
    bai: false,
    beigo: false,
  });
  const [nightHubTopic, setNightHubTopic] = useState<"bai" | "beigo" | null>(null);
  const [isNightHubMode, setIsNightHubMode] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const [weekendDestinationOptions, setWeekendDestinationOptions] = useState<WeekendDestinationOption[]>([]);
  const [weekendSelectedDestination, setWeekendSelectedDestination] = useState<WeekendDestinationOption | null>(null);
  const [endDaySequencePhase, setEndDaySequencePhase] = useState<"none" | "black" | "summary">("none");
  const [isEndDaySummaryLeaving, setIsEndDaySummaryLeaving] = useState(false);
  const [endDayTransitionText, setEndDayTransitionText] = useState<{
    toDayLabel: string;
    fromDateLabel: string;
    toDateLabel: string;
  } | null>(null);
  const [endDaySummaryContent, setEndDaySummaryContent] = useState<EndDaySummaryContent | null>(null);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);
  const [isRewardInventoryOpen, setIsRewardInventoryOpen] = useState(false);
  const [rewardInventoryTiles, setRewardInventoryTiles] = useState<RewardPlaceTile[]>([]);
  const [isOffworkRewardTutorialOpen, setIsOffworkRewardTutorialOpen] = useState(false);
  const [unlockFeedbackItems, setUnlockFeedbackItems] = useState<UnlockFeedbackItem[]>([]);
  const [isCharacterIntroOpen, setIsCharacterIntroOpen] = useState(false);
  const [characterIntroNonce, setCharacterIntroNonce] = useState(0);
  const [isCharacterIntroPending, setIsCharacterIntroPending] = useState(false);
  const transitionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasTriggeredCharacterIntroRef = useRef(false);
  const unlockFeedbackTimerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const playStoryComic = (
    comicId: StoryComicId,
    timings: { fadeAtMs: number; hideAtMs: number },
  ) => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(comicId);
    setIsStoryComicVisible(true);
    setIsStoryComicFading(false);
    storyComicTimerRefs.current = [
      setTimeout(() => setIsStoryComicFading(true), timings.fadeAtMs),
      setTimeout(() => {
        setIsStoryComicVisible(false);
        setIsStoryComicFading(false);
        setActiveStoryComicId(null);
      }, timings.hideAtMs),
    ];
  };

  const pushUnlockFeedback = (items: UnlockFeedbackItem[]) => {
    if (items.length <= 0) return;
    setUnlockFeedbackItems((prev) => [...prev, ...items]);
    items.forEach((item) => {
      if (unlockFeedbackTimerRefs.current[item.id]) {
        clearTimeout(unlockFeedbackTimerRefs.current[item.id]);
      }
      unlockFeedbackTimerRefs.current[item.id] = setTimeout(() => {
        setUnlockFeedbackItems((prev) => prev.filter((entry) => entry.id !== item.id));
        delete unlockFeedbackTimerRefs.current[item.id];
      }, 2800);
    });
  };

  const groupedRewardInventory = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        category: "place" | "route";
        pattern: TilePattern3x3;
        count: number;
        sourceId?: PlaceTileId;
      }
    >();
    BASE_ROUTE_INVENTORY_PREVIEWS.forEach((routeTile) => {
      const key = `route::${routeTile.label}::${tilePatternKey(routeTile.pattern)}`;
      map.set(key, {
        key,
        label: routeTile.label,
        category: "route",
        pattern: routeTile.pattern,
        count: 1,
        sourceId: undefined,
      });
    });
    rewardInventoryTiles.forEach((tile) => {
      const labelPrefix = tile.label?.trim().length ? tile.label.trim() : tileSourceLabel(tile.sourceId);
      const key = `${tile.category}::${labelPrefix}::${tilePatternKey(tile.pattern)}`;
      const exists = map.get(key);
      if (exists) {
        exists.count += 1;
        return;
      }
      map.set(key, {
        key,
        label: labelPrefix,
        category: tile.category,
        pattern: tile.pattern,
        count: 1,
        sourceId: tile.sourceId,
      });
    });
    return Array.from(map.values());
  }, [rewardInventoryTiles]);

  const ownedPlaceGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "place"),
    [groupedRewardInventory],
  );
  const ownedRouteGroups = useMemo(
    () => groupedRewardInventory.filter((item) => item.category === "route"),
    [groupedRewardInventory],
  );

  useEffect(() => {
    workTransitionDoneRef.current = false;
    setOutgoingTransition(null);
    setEndDaySequencePhase("none");
    setIsEndDaySummaryLeaving(false);
    setEndDayTransitionText(null);
    setIsSceneMenuOpen(false);
    setIsNightHubMode(false);
    transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
    transitionTimersRef.current = [];
    setIncomingTransition(null);

    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(SCENE_TRANSITION_STORAGE_KEY);
    if (!raw) return;

    try {
      const payload = JSON.parse(raw) as PendingSceneTransitionPayload;
      const isExpired = Date.now() - payload.createdAt > payload.durationMs + 800;
      if (payload.toSceneId !== scene.id || isExpired) {
        window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
        return;
      }
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
      setIncomingTransition({ preset: payload.preset, durationMs: payload.durationMs });
      const clearTimer = setTimeout(() => {
        setIncomingTransition(null);
      }, payload.durationMs);
      transitionTimersRef.current.push(clearTimer);
    } catch {
      window.sessionStorage.removeItem(SCENE_TRANSITION_STORAGE_KEY);
    }
  }, [scene.id]);

  useEffect(() => {
    scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene5RevealTimerRefs.current = [];

    if (scene.scenePresentation !== "outfit-reveal") {
      setScene5OutfitRevealPhase("hidden");
      return () => {
        scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
        scene5RevealTimerRefs.current = [];
      };
    }

    setScene5OutfitRevealPhase("hidden");
    scene5RevealTimerRefs.current = [
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-enter");
      }, 40),
      setTimeout(() => {
        setScene5OutfitRevealPhase("pose-rise");
      }, 260),
      setTimeout(() => {
        setScene5OutfitRevealPhase("modal-exit");
      }, 2080),
      setTimeout(() => {
        setScene5OutfitRevealPhase("dialog");
      }, 2460),
    ];

    return () => {
      scene5RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene5RevealTimerRefs.current = [];
    };
  }, [scene.id, scene.scenePresentation]);

  useEffect(() => {
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
    const progress = loadPlayerProgress();
    setCurrentDay(Math.max(1, Math.floor(progress.currentDay || 1)));
    setWeekendDestinationOptions(buildWeekendDestinationOptions(progress));
    setWeekendSelectedDestination(null);
  }, [scene.id]);

  useEffect(() => {
    if (scene.characterName === "小麥") {
      setEncounteredCharacter("mai", true);
      return;
    }
    if (scene.characterName === "小白") {
      setEncounteredCharacter("bai", true);
      return;
    }
    if (scene.characterName === "小貝狗") {
      setEncounteredCharacter("beigo", true);
    }
  }, [scene.characterName, scene.id]);

  useEffect(() => {
    if (diaryOpenTimerRef.current) {
      clearTimeout(diaryOpenTimerRef.current);
      diaryOpenTimerRef.current = null;
    }
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID) {
      setIsDiaryOpen(false);
      return;
    }
    // 保障 legacy 夜間 hub 線到達該節點時一定可看到第一篇解鎖日記。
    unlockDiaryEntry("bai-entry-1");
    const latestProgress = loadPlayerProgress();
    setUnlockedDiaryEntryIds(latestProgress.unlockedDiaryEntryIds);
    if (latestProgress.hasSeenDiaryFirstReveal) {
      setIsNightHubMode(true);
    }
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== LEGACY_QA_SCENE_ID) return;
    setScene44Step("intro");
    setScene44Asked({ metro: false, dog: false });
    setScene44Topic(null);
    setScene44QATurn(0);
    setScene44FinalTurn(0);
  }, [scene.id]);

  useEffect(() => {
    if (scene55BookTimerRef.current) {
      clearTimeout(scene55BookTimerRef.current);
      scene55BookTimerRef.current = null;
    }
    if (scene.id !== "scene-55") {
      setScene55BookPhase("dialog");
      return;
    }
    setScene55BookPhase("glow");
    scene55BookTimerRef.current = setTimeout(() => {
      setScene55BookPhase("dialog");
      scene55BookTimerRef.current = null;
    }, 980);
    return () => {
      if (scene55BookTimerRef.current) {
        clearTimeout(scene55BookTimerRef.current);
        scene55BookTimerRef.current = null;
      }
    };
  }, [scene.id]);

  useEffect(() => {
    const characterIntro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
    if (!characterIntro) {
      setIsCharacterIntroOpen(false);
      setIsCharacterIntroPending(false);
      hasTriggeredCharacterIntroRef.current = false;
      return;
    }
    if (hasTriggeredCharacterIntroRef.current) return;
    hasTriggeredCharacterIntroRef.current = true;
    if (scene.autoOpenCharacterIntro) {
      setIsCharacterIntroPending(false);
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    setIsCharacterIntroPending(true);
  }, [scene.id]);

  const handleCloseCharacterIntro = () => {
    setIsCharacterIntroOpen(false);
    setIsCharacterIntroPending(false);
    if (scene.advanceAfterCharacterIntro && scene.nextSceneId) {
      router.push(ROUTES.gameScene(scene.nextSceneId));
    }
  };

  useEffect(() => {
    if (!isCharacterIntroOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      event.preventDefault();
      handleCloseCharacterIntro();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCharacterIntroOpen, scene.advanceAfterCharacterIntro, scene.nextSceneId]);

  useEffect(() => {
    if (scene.id !== LEGACY_NIGHT_HUB_SCENE_ID || !isNightHubMode) return;
    setNightHubStep("choose");
    setNightHubAsked({ bai: false, beigo: false });
    setNightHubTopic(null);
  }, [scene.id, isNightHubMode]);

  useEffect(() => {
    const isDoorTransitionScene = scene.id === "scene-40" || scene.id === LEGACY_NIGHT_HUB_SCENE_ID;
    if (!isDoorTransitionScene) {
      setDoorTransitionPhase("closed-end");
      setIsDoorTransitionVisible(false);
      return;
    }
    setDoorTransitionPhase("closed-start");
    setIsDoorTransitionVisible(true);
    const openDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("opened");
    }, 180);
    const closeDoorTimer = setTimeout(() => {
      setDoorTransitionPhase("closed-end");
    }, 420);
    const showDialogTimer =
      scene.id === LEGACY_NIGHT_HUB_SCENE_ID
        ? setTimeout(() => {
            setIsDoorTransitionVisible(false);
          }, 620)
        : null;
    return () => {
      clearTimeout(openDoorTimer);
      clearTimeout(closeDoorTimer);
      if (showDialogTimer) clearTimeout(showDialogTimer);
    };
  }, [scene.id]);

  useEffect(() => {
    return () => {
      transitionTimersRef.current.forEach((timer) => clearTimeout(timer));
      transitionTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const handleTransitionPreview = (event: Event) => {
      const customEvent = event as CustomEvent<SceneTransitionPayload>;
      const preset = customEvent.detail?.preset;
      if (preset !== "fade-black") return;
      const durationMs = customEvent.detail?.durationMs ?? 380;
      setPreviewTransitionDurationMs(durationMs);
      setPreviewTransitionNonce((prev) => prev + 1);
      const clearTimer = setTimeout(() => {
        setPreviewTransitionDurationMs(null);
      }, durationMs * 2 + 40);
      transitionTimersRef.current.push(clearTimer);
    };
    window.addEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    return () => {
      window.removeEventListener(GAME_SCENE_TRANSITION_TRIGGER, handleTransitionPreview);
    };
  }, []);

  useEffect(() => {
    if (isWorkTransitionScene) return;
    if (!scene.autoAdvanceMs || !scene.nextSceneId) return;
    const timer = setTimeout(() => {
      router.push(ROUTES.gameScene(scene.nextSceneId!));
    }, scene.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [isWorkTransitionScene, router, scene.autoAdvanceMs, scene.nextSceneId]);

  useEffect(() => {
    if (!isOffworkRewardOpen) {
      setIsRewardInventoryOpen(false);
      return;
    }
    if (isRewardInventoryOpen) {
      setRewardInventoryTiles(loadPlayerProgress().rewardPlaceTiles);
    }
  }, [isOffworkRewardOpen, isRewardInventoryOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleTypingModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: DialogTypingMode }>;
      if (!customEvent.detail?.mode) return;
      setDialogTypingMode(customEvent.detail.mode);
    };
    window.addEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    return () => {
      window.removeEventListener(GAME_DIALOG_TYPING_MODE_CHANGE, handleTypingModeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleComicCheat = (event: Event) => {
      const customEvent = event as CustomEvent<{ comicId?: ComicCheatId }>;
      const comicId = customEvent.detail?.comicId;
      if (!comicId || !(comicId in COMIC_IMAGE_BY_ID)) return;
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      comicCheatTimerRefs.current = [];
      setActiveComicCheatId(comicId);
      setIsComicCheatVisible(true);
      setIsComicCheatFading(false);
      comicCheatTimerRefs.current = [
        setTimeout(() => setIsComicCheatFading(true), 980),
        setTimeout(() => {
          setIsComicCheatVisible(false);
          setIsComicCheatFading(false);
          setActiveComicCheatId(null);
        }, 1360),
      ];
    };
    window.addEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    return () => {
      window.removeEventListener(GAME_COMIC_CHEAT_TRIGGER, handleComicCheat);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(unlockFeedbackTimerRefs.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!isOffworkScene) {
      setIsOffworkLabelVisible(false);
      setIsOffworkRewardOpen(false);
      setIsOffworkRewardTutorialOpen(false);
      setSelectedRewardId(null);
      return;
    }

    setIsOffworkLabelVisible(true);
    setIsOffworkRewardOpen(false);
    setSelectedRewardId(null);
    setSelectedRewardActionCost(0);
    const progress = loadPlayerProgress();
    setOffworkRewardClaimCount(progress.offworkRewardClaimCount);
    setNonCorePlaceRewardClaimCount(
      progress.rewardPlaceTiles.filter(
        (tile) =>
          tile.category === "place" &&
          tile.sourceId !== "metro-station" &&
          tile.sourceId !== "street",
      ).length,
    );
    setOffworkModalStatus(progress.status);
    setIsFirstStreetPlaceReward(
      !progress.rewardPlaceTiles.some(
        (tile) => tile.category === "place" && tile.sourceId === "street",
      ),
    );
    setOffworkRewardChoices(
      pickOffworkRewardOptions(progress.offworkRewardClaimCount, progress.hasPassedThroughStreet),
    );
    setCustomRouteCostError("");
    setPlaceRewardCostError("");
    setOffworkRewardPattern(
      generateOffworkRewardPattern(progress.offworkRewardClaimCount === 0, progress.rewardPlaceTiles),
    );
    const shouldShowRewardPoolUnlock =
      progress.hasPassedThroughStreet &&
      progress.offworkRewardClaimCount + 1 >= 3 &&
      !progress.hasSeenRewardPoolUnlockFeedback;
    if (shouldShowRewardPoolUnlock) {
      savePlayerProgress({
        ...progress,
        hasSeenRewardPoolUnlockFeedback: true,
      });
      pushUnlockFeedback([
        {
          id: `reward-pool-${Date.now()}`,
          badge: "🧩",
          title: "拼圖池已開啟",
          description: "下班後開始會出現更多非核心地點，能自由擴充你的路線組合。",
          tone: "feature",
        },
      ]);
    }
    setCustomRouteStep(null);
    setCustomRouteSize("1x1");
    setCustomRouteEntryPattern(null);
    setCustomRouteExitPattern(null);

    const labelTimer = setTimeout(() => {
      setIsOffworkLabelVisible(false);
    }, 900);
    const modalTimer = setTimeout(() => {
      setIsOffworkRewardOpen(true);
      if (!progress.hasSeenOffworkRewardTutorial) {
        setIsOffworkRewardTutorialOpen(true);
      }
    }, 1200);

    return () => {
      clearTimeout(labelTimer);
      clearTimeout(modalTimer);
    };
  }, [isOffworkScene, scene.id]);

  useEffect(() => {
    onOffworkRewardOpenChange?.(isOffworkRewardOpen);
    return () => onOffworkRewardOpenChange?.(false);
  }, [isOffworkRewardOpen, onOffworkRewardOpenChange]);

  useEffect(() => {
    if (scene.id !== "scene-7") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 第 7 格跌倒演出：先驚呼，再左倒消失爬起，最後停在擔心 2。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 6 } }),
        );
      }, 320),
    );
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, {
            detail: { motionId: "fall-left-recover" },
          }),
        );
        window.dispatchEvent(
          new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
            detail: { shakeId: "shake-strong" },
          }),
        );
      }, 560),
    );
    // 爬起後切回擔心 2（index 5）。
    timers.push(
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex: 5 } }),
        );
      }, 1380),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [scene.id]);

  useEffect(() => {
    scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene9RevealTimerRefs.current = [];

    if (scene.id !== "scene-9") {
      setScene9PuppetRevealPhase("hidden");
      return;
    }

    setScene9PuppetRevealPhase("hidden");
    scene9RevealTimerRefs.current = [
      setTimeout(() => {
        setScene9PuppetRevealPhase("prop");
      }, 120),
      setTimeout(() => {
        setScene9PuppetRevealPhase("dialog");
      }, 560),
    ];

    return () => {
      scene9RevealTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene9RevealTimerRefs.current = [];
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-85" || !scene.backgroundImage) {
      setScenePhotoNaturalImageSize(null);
      return;
    }
    const image = new Image();
    image.src = scene.backgroundImage;
    image.onload = () => {
      setScenePhotoNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [scene.backgroundImage, scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-30") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 80);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-75") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-43" && scene.id !== "scene-49") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-84") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "flash-white" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene.id !== "scene-64") return;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
          detail: { shakeId: "shake-weak" },
        }),
      );
    }, 60);
    return () => {
      clearTimeout(timer);
    };
  }, [scene.id]);

  useEffect(() => {
    if (scene10ExitTimerRef.current) {
      clearTimeout(scene10ExitTimerRef.current);
      scene10ExitTimerRef.current = null;
    }
    setScene10ExitPhase("idle");
  }, [scene.id]);

  useEffect(() => {
    if (scene14PuppetTimerRef.current) {
      clearTimeout(scene14PuppetTimerRef.current);
      scene14PuppetTimerRef.current = null;
    }
    setScene14PuppetPhase("hidden");
  }, [scene.id]);

  useEffect(() => {
    storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicTimerRefs.current = [];
    setActiveStoryComicId(null);
    setIsStoryComicVisible(false);
    setIsStoryComicFading(false);
    storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicOverlayTimerRefs.current = [];
    setScene4FreshenPhase("idle");
    scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
    scene4SequenceTimerRefs.current = [];
    comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
    comicCheatTimerRefs.current = [];
    setActiveComicCheatId(null);
    setIsComicCheatVisible(false);
    setIsComicCheatFading(false);
    setIsContinueExitActive(false);
    if (continueExitTimerRef.current) {
      clearTimeout(continueExitTimerRef.current);
      continueExitTimerRef.current = null;
    }
  }, [scene.id]);

  useLayoutEffect(() => {
    storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
    storyComicOverlayTimerRefs.current = [];
    const previousOverlays = previousStoryComicOverlaysRef.current ?? [];
    const nextOverlays = scene.storyComicOverlays ?? [];

    let preservedCount = 0;
    while (
      preservedCount < previousOverlays.length &&
      preservedCount < nextOverlays.length &&
      areStoryComicOverlaysEquivalent(previousOverlays[preservedCount], nextOverlays[preservedCount])
    ) {
      preservedCount += 1;
    }

    setVisibleStoryComicOverlayCount(preservedCount);
    previousStoryComicOverlaysRef.current = nextOverlays;

    if (nextOverlays.length === 0) return;

    storyComicOverlayTimerRefs.current = nextOverlays
      .map((overlay, index) => {
        if (index < preservedCount) return null;
        return setTimeout(() => {
          setVisibleStoryComicOverlayCount((current) => Math.max(current, index + 1));
        }, overlay.enterDelayMs ?? 0);
      })
      .filter((timer): timer is ReturnType<typeof setTimeout> => timer !== null);

    return () => {
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current = [];
    };
  }, [scene.id, scene.storyComicOverlays]);

  useEffect(() => {
    return () => {
      storyComicTimerRefs.current.forEach((timer) => clearTimeout(timer));
      storyComicOverlayTimerRefs.current.forEach((timer) => clearTimeout(timer));
      scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
      comicCheatTimerRefs.current.forEach((timer) => clearTimeout(timer));
      if (continueExitTimerRef.current) {
        clearTimeout(continueExitTimerRef.current);
        continueExitTimerRef.current = null;
      }
      if (scene55BookTimerRef.current) {
        clearTimeout(scene55BookTimerRef.current);
        scene55BookTimerRef.current = null;
      }
      if (diaryOpenTimerRef.current) {
        clearTimeout(diaryOpenTimerRef.current);
        diaryOpenTimerRef.current = null;
      }
    };
  }, []);

  const selectedReward = offworkRewardChoices.find((item) => item.id === selectedRewardId) ?? null;
  const selectedPlaceRewardPattern = useMemo<TilePattern3x3>(() => {
    if (selectedReward?.id === "street" && isFirstStreetPlaceReward) {
      return FIRST_OFFWORK_REWARD_PATTERN;
    }
    const isNonCorePlace =
      selectedReward?.id &&
      selectedReward.id !== "street" &&
      selectedReward.id !== "metro-station";
    if (isNonCorePlace && nonCorePlaceRewardClaimCount === 0) {
      return FIRST_NON_CORE_PLACE_PATTERN;
    }
    if (isNonCorePlace && nonCorePlaceRewardClaimCount === 1) {
      return SECOND_NON_CORE_PLACE_PATTERN;
    }
    return offworkRewardPattern;
  }, [isFirstStreetPlaceReward, nonCorePlaceRewardClaimCount, offworkRewardPattern, selectedReward?.id]);
  const edgePatternOptions = customRouteSize === "2x1" ? ENTRY_PATTERN_OPTIONS_6 : ENTRY_PATTERN_OPTIONS_3;
  const edgePatternWidth = customRouteSize === "2x1" ? 6 : 3;
  const edgePatternColumns = customRouteSize === "2x1" ? 4 : 3;
  const customRouteCost = 2;
  const customRouteCostLabel = "本次花費：2";
  const customRoutePattern = useMemo<number[][]>(() => {
    if (customRouteEntryPattern === null || customRouteExitPattern === null) {
      return FIRST_OFFWORK_REWARD_PATTERN;
    }
    return buildCustomRoutePattern(customRouteSize, customRouteEntryPattern, customRouteExitPattern);
  }, [customRouteEntryPattern, customRouteExitPattern, customRouteSize]);

  const startSceneTransition = (
    nextSceneId: string,
    preset: "fade-black" | "next-day" = "fade-black",
    durationMs = 420,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs });

    if (typeof window !== "undefined") {
      const payload: PendingSceneTransitionPayload = {
        toSceneId: nextSceneId,
        preset,
        durationMs,
        createdAt: Date.now(),
      };
      window.sessionStorage.setItem(SCENE_TRANSITION_STORAGE_KEY, JSON.stringify(payload));
    }

    const pushTimer = setTimeout(() => {
      router.push(ROUTES.gameScene(nextSceneId));
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const startPathTransition = (
    nextPath: string,
    preset: "fade-black" | "next-day" = "fade-black",
    durationMs = 420,
  ) => {
    if (outgoingTransition) return;
    setOutgoingTransition({ preset, durationMs });
    const pushTimer = setTimeout(() => {
      router.push(nextPath);
    }, durationMs);
    transitionTimersRef.current.push(pushTimer);
  };

  const handleStoryRequestNext = (nextSceneId: string) => {
    if (CHARACTER_INTRO_BY_SCENE_ID[scene.id] && isCharacterIntroPending) {
      setIsCharacterIntroOpen(true);
      setCharacterIntroNonce((prev) => prev + 1);
      return;
    }
    if (scene.id === LEGACY_ROUTE_TUTORIAL_SCENE_ID) {
      router.push(`${ROUTES.gameArrangeRoute}?tutorial=story41`);
      return;
    }
    if (scene.id === "scene-68") {
      startPathTransition(`${ROUTES.gameArrangeRoute}?tutorial=story41`, "fade-black", 420);
      return;
    }
    if (scene.id === "scene-88") {
      unlockDiaryEntry("bai-entry-1");
      router.push(ROUTES.gameScene(nextSceneId));
      return;
    }
    if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
      router.push(ROUTES.gameArrangeRoute);
      return;
    }
    if (scene.id === "scene-10") {
      if (scene10ExitPhase === "exiting") return;
      setScene10ExitPhase("exiting");
      scene10ExitTimerRef.current = setTimeout(() => {
        router.push(ROUTES.gameScene(nextSceneId));
      }, 420);
      return;
    }
    if (scene.continueExitMotionId) {
      if (isContinueExitActive) return;
      setIsContinueExitActive(true);
      const durationMs =
        scene.continueExitDurationMs ?? AVATAR_MOTION_DURATION_MS[scene.continueExitMotionId] ?? 420;
      continueExitTimerRef.current = setTimeout(() => {
        router.push(ROUTES.gameScene(nextSceneId));
      }, durationMs);
      return;
    }
    const transition = scene.nextSceneTransition;
    if (!transition) {
      router.push(ROUTES.gameScene(nextSceneId));
      return;
    }
    const durationMs = transition.durationMs ?? (transition.preset === "next-day" ? 920 : 420);
    startSceneTransition(nextSceneId, transition.preset, durationMs);
  };

  const displayedBackgroundImage = scene.backgroundImage;
  const isScene44Interactive = scene.id === LEGACY_QA_SCENE_ID;
  const isNightHubInteractive = scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode;
  const isMorningHubInteractive = scene.id === "scene-morning-hub";
  const afterOffworkRewardSceneId = loadPlayerProgress().hasSeenDiaryFirstReveal
    ? LEGACY_NIGHT_HUB_SCENE_ID
    : AFTER_REWARD_SCENE_ID;
  const isScene44InnerThought =
    scene.id === LEGACY_QA_SCENE_ID && (scene44Step === "intro" || scene44Step === "choose");
  const isInnerThoughtScene = isScene44InnerThought;
  const allScene44Asked = scene44Asked.metro && scene44Asked.dog;
  const scene44QAPack = {
    metro: {
      question: "早上怎麼知道小日獸會出現在捷運站",
      answer:
        "一整晚很擔心的待在小白旁邊，忽然感覺到一股能量，感應到那邊有我最熟悉的小日獸",
    },
    dog: {
      question: "黃金獵犬拍攝到後回到日記上？",
      answer: "對是直太郎，他最親近了",
    },
  } as const;
  const scene44FinalPack = {
    question: "那交換日記跟小白昏迷的關係嗎",
    answer: "突然有股能量將我和小日獸從日記中擠出來，那些日記片段也都消失了",
  } as const;
  const scene44Speaker =
    scene44Step === "intro"
      ? "小麥（心裡話）"
      : scene44Step === "choose"
        ? "小麥（心裡話）"
        : scene44Step === "qa"
          ? scene44QATurn === 0
            ? "小麥"
            : "小貝狗"
          : scene44FinalTurn === 0
            ? "小麥"
            : "小貝狗";
  const scene44Text =
    scene44Step === "intro"
      ? scene.dialogue
      : scene44Step === "choose"
        ? allScene44Asked
          ? "線索都問到了，最後再確認一件事..."
          : "先問問小貝狗，釐清目前的線索。"
        : scene44Step === "qa"
          ? scene44Topic
            ? scene44QATurn === 0
              ? scene44QAPack[scene44Topic].question
              : scene44QAPack[scene44Topic].answer
            : ""
          : scene44FinalTurn === 0
            ? scene44FinalPack.question
            : scene44FinalPack.answer;

  const nightHubSpeaker =
    nightHubStep === "choose" ? "小麥" : nightHubTopic === "beigo" ? "小貝狗" : "小麥";
  const nightHubText =
    nightHubStep === "choose"
      ? "要做什麼呢？"
      : nightHubTopic === "bai"
        ? "先去門口看了一下，小白房間還是安安靜靜的……先讓她休息吧。"
        : "我會陪著妳，我們明天再一起找線索，嗷。";

  const handleNightHubSelectTopic = (topic: "bai" | "beigo") => {
    setNightHubTopic(topic);
    setNightHubStep("talk");
  };

  const handleOpenDiary = () => {
    const latestUnlocked = loadPlayerProgress().unlockedDiaryEntryIds;
    setUnlockedDiaryEntryIds(latestUnlocked);
    setIsDiaryOpen(true);
    setIsSceneMenuOpen(false);
  };

  const handleNightHubContinue = () => {
    if (nightHubStep !== "talk" || !nightHubTopic) return;
    setNightHubAsked((prev) => ({ ...prev, [nightHubTopic]: true }));
    setNightHubStep("choose");
    setNightHubTopic(null);
  };

  const advanceToNextDay = (summaryOverride?: EndDaySummaryContent) => {
    if (endDaySequencePhase !== "none") return;
    const latestProgress = loadPlayerProgress();
    const currentDay = Math.max(1, Math.floor(latestProgress.currentDay || 1));
    const nextDay = currentDay + 1;
    savePlayerProgress({
      ...latestProgress,
      currentDay: nextDay,
      status: {
        ...latestProgress.status,
        fatigue: Math.max(0, latestProgress.status.fatigue - 20),
        actionPower: Math.max(0, Math.min(6, latestProgress.status.actionPower + 1)),
      },
    });
    rolloverDailyEventFlags();
    setCurrentDay(nextDay);
    setWeekendDestinationOptions(buildWeekendDestinationOptions(loadPlayerProgress()));
    setWeekendSelectedDestination(null);
    setEndDayTransitionText({
      toDayLabel: `第${nextDay}天`,
      fromDateLabel: formatInGameDateLabel(currentDay),
      toDateLabel: formatInGameDateLabel(nextDay),
    });
    setEndDaySummaryContent(
      summaryOverride ?? {
        title: "今天先告一段落",
        body: "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。",
        chips: ["疲勞 -20", "行動力 +1"],
      },
    );

    setIsEndDaySummaryLeaving(false);
    setEndDaySequencePhase("summary");
    const leaveSummaryTimer = setTimeout(() => {
      setIsEndDaySummaryLeaving(true);
    }, 2100);
    const showDay2Timer = setTimeout(() => {
      setEndDaySequencePhase("black");
      setIsEndDaySummaryLeaving(false);
    }, 2520);
    const nextMorningTimer = setTimeout(() => {
      if (scene.id === "scene-morning-hub") {
        setEndDaySequencePhase("none");
        setIsEndDaySummaryLeaving(false);
        setEndDayTransitionText(null);
        setEndDaySummaryContent(null);
        return;
      }
      router.push(ROUTES.gameScene("scene-morning-hub"));
    }, 4300);
    transitionTimersRef.current.push(leaveSummaryTimer, showDay2Timer, nextMorningTimer);
  };

  const handleNightHubSleep = () => {
    advanceToNextDay();
  };

  const handleWeekendDestinationSelect = (destination: WeekendDestinationOption) => {
    const latestProgress = loadPlayerProgress();
    const nextStatus = destination.applyStatus(latestProgress.status);
    savePlayerProgress({
      ...latestProgress,
      status: nextStatus,
    });
    setWeekendSelectedDestination(destination);
  };

  const handleWeekendEndDay = () => {
    if (!weekendSelectedDestination) return;
    advanceToNextDay({
      title: `${weekendSelectedDestination.title}的小旅行結束了`,
      body: weekendSelectedDestination.resultText,
      chips: [weekendSelectedDestination.effectLabel, "今晚早點休息"],
    });
  };

  const handleScene44Continue = () => {
    if (scene44Step === "intro") {
      setScene44Step("choose");
      return;
    }
    if (scene44Step === "qa") {
      if (scene44QATurn === 0) {
        setScene44QATurn(1);
        return;
      }
      if (scene44Topic) {
        setScene44Asked((prev) => ({ ...prev, [scene44Topic]: true }));
      }
      if (allScene44Asked || (scene44Topic === "metro" && scene44Asked.dog) || (scene44Topic === "dog" && scene44Asked.metro)) {
        setScene44Step("final");
        setScene44FinalTurn(0);
        return;
      }
      setScene44Step("choose");
      setScene44Topic(null);
      setScene44QATurn(0);
      return;
    }
    if (scene44Step === "final") {
      if (scene44FinalTurn === 0) {
        setScene44FinalTurn(1);
        return;
      }
      router.push(ROUTES.gameScene("scene-45"));
    }
  };

  const handleScene44SelectTopic = (topic: "metro" | "dog") => {
    setScene44Topic(topic);
    setScene44QATurn(0);
    setScene44Step("qa");
  };
  const isWeekendMorningHub = isMorningHubInteractive && isWeekendInGameDay(currentDay);
  const isScene5OutfitReveal = scene.scenePresentation === "outfit-reveal";
  const shouldHideDialogByDoorTransition =
    (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isDoorTransitionVisible) ||
    (scene.id === "scene-55" && scene55BookPhase !== "dialog") ||
    (isScene5OutfitReveal && scene5OutfitRevealPhase !== "dialog") ||
    scene.autoOpenCharacterIntro === true ||
    isCharacterIntroOpen;
  const shouldShowSceneDialogPanel = !shouldHideDialogByDoorTransition;
  const shouldShowSceneQuickActions = !shouldHideDialogByDoorTransition;
  const isMetroDogPhotoCaptureScene = scene.id === "scene-85";

  const handleMetroDogPhotoConfirm = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    if (!scene.nextSceneId) return;
    router.push(ROUTES.gameScene(scene.nextSceneId));
  };

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        ref={sceneBackgroundRef}
        w="100%"
        h="100%"
        bgColor={scene.backgroundColor ?? "#D6D4B9"}
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
        direction="column"
        backgroundImage={displayedBackgroundImage ? `url('${displayedBackgroundImage}')` : undefined}
        backgroundSize={isMetroDogPhotoCaptureScene ? "contain" : "cover"}
        backgroundPosition={isMetroDogPhotoCaptureScene ? "center center" : "center bottom"}
        backgroundRepeat="no-repeat"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        {isMetroDogPhotoCaptureScene && displayedBackgroundImage ? (
          <EventPhotoCaptureLayer
            enabled
            backgroundRef={sceneBackgroundRef}
            backgroundImageSrc={displayedBackgroundImage}
            naturalImageSize={scenePhotoNaturalImageSize}
            fitMode="contain"
            targetRectNormalized={{ x: 0.54, y: 0.68, width: 0.24, height: 0.16 }}
            passScore={30}
            hintText="點擊快門捕捉小日獸"
            frameSweepFromY={20}
            frameSweepToY={500}
            onConfirm={handleMetroDogPhotoConfirm}
          />
        ) : null}
        <UnlockFeedbackOverlay items={unlockFeedbackItems} />
        {isInnerThoughtScene ? (
          <Flex pointerEvents="none" position="absolute" inset="0" zIndex={1}>
            <Flex
              position="absolute"
              inset="0"
              bg="linear-gradient(180deg, rgba(28,24,36,0.48) 0%, rgba(15,12,20,0.56) 100%)"
            />
            <Flex
              position="absolute"
              top="18px"
              right="18px"
              px="10px"
              py="4px"
              borderRadius="999px"
              bgColor="rgba(20,18,28,0.72)"
              border="1px solid rgba(255,255,255,0.22)"
            >
              <Text color="#E6DAFF" fontSize="12px" fontWeight="700" letterSpacing="0.04em">
                心裡話
              </Text>
            </Flex>
          </Flex>
        ) : null}
        {isImageOnlyScene ? (
          <>
            {scene.sceneLabel && (!isOffworkScene || isOffworkLabelVisible) ? (
              <Flex
                position="absolute"
                top="50%"
                left="0"
                right="0"
                transform="translateY(-50%)"
                bgColor="rgba(132, 104, 76, 0.92)"
                h="104px"
                alignItems="center"
                justifyContent="center"
                opacity={isOffworkScene && !isOffworkLabelVisible ? 0 : 1}
                transition="opacity 0.25s ease"
              >
                <Text color="white" fontSize="56px" fontWeight="700" letterSpacing="2px">
                  {scene.sceneLabel}
                </Text>
              </Flex>
            ) : null}
          </>
        ) : (
          <Flex position="absolute" top="18px" left="18px">
            <Text color="white" fontWeight="700" fontSize="24px" textShadow="0 2px 6px rgba(0,0,0,0.35)">
              {scene.sceneLabel ?? ""}
            </Text>
          </Flex>
        )}

        {scene.characterAvatar ? (
          <Flex position="absolute" top="140px" left="50%" transform="translateX(-50%)">
            <Flex
              w="88px"
              h="88px"
              borderRadius="999px"
              overflow="hidden"
              border="3px solid white"
              boxShadow="0 4px 14px rgba(0,0,0,0.25)"
              alignItems="center"
              justifyContent="center"
              bgColor="#E8E1D8"
            >
              <img
                src={scene.characterAvatar}
                alt={scene.characterName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isCharacterIntroOpen ? (
          <Flex
            key={`character-intro-${scene.id}-${characterIntroNonce}`}
            position="absolute"
            inset="0"
            zIndex={76}
            onClick={handleCloseCharacterIntro}
            bg="linear-gradient(180deg, rgba(20,25,28,0.26) 0%, rgba(18,20,22,0.46) 100%)"
            animation={`${characterIntroBgFadeIn} 360ms ease-out`}
            overflow="hidden"
          >
            {(() => {
              const intro = CHARACTER_INTRO_BY_SCENE_ID[scene.id];
              if (!intro) return null;
              const spriteScale = 0.48;
              const spriteWidth = 500;
              const spriteHeight = 627;
              const spriteCol = intro.spriteFrameIndex % intro.spriteCols;
              const spriteRow = Math.floor(intro.spriteFrameIndex / intro.spriteCols);

              return (
                <>
                  <Flex
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    h="122px"
                    bgColor={intro.theme.topBar}
                    borderBottom="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex
                    position="absolute"
                    left="-32%"
                    top="31%"
                    w="175%"
                    h="228px"
                    bgColor={intro.theme.band}
                    borderTop={`6px solid ${intro.theme.bandBorder}`}
                    borderBottom={`6px solid ${intro.theme.bandBorder}`}
                    transform="rotate(-16deg)"
                    transformOrigin="center"
                    animation={`${characterIntroBandSlideIn} 520ms cubic-bezier(0.2, 0.8, 0.2, 1)`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="40px"
                    top="244px"
                    zIndex={3}
                    direction="column"
                    gap="5px"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 110ms both`}
                  >
                    <Text color="white" fontSize="43px" fontWeight="800" lineHeight="1">
                      {intro.name}
                    </Text>
                    <Text color="rgba(255,255,255,0.95)" fontSize="34px" fontWeight="800" lineHeight="1.1" letterSpacing="0.05em">
                      {intro.englishName}
                    </Text>
                    <Text color="white" fontSize="17px" lineHeight="1.5" fontWeight="600">
                      {intro.descriptionLines[0]}
                      <br />
                      {intro.descriptionLines[1]}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    right="20px"
                    top="226px"
                    zIndex={3}
                    transform="rotate(90deg)"
                    transformOrigin="center"
                    animation={`${characterIntroTextFadeIn} 380ms ease-out 180ms both`}
                  >
                    <Text color="rgba(255,255,255,0.96)" fontSize="16px" fontWeight="800" letterSpacing="0.2em">
                      {intro.englishName}
                    </Text>
                  </Flex>
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="152px"
                    w="220px"
                    h="46px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.82)"
                    filter="blur(6px)"
                    transform="translateX(-50%)"
                    animation={`${characterIntroGlowPulse} 1.7s ease-in-out infinite`}
                  />
                  <Flex
                    pointerEvents="none"
                    position="absolute"
                    left="50%"
                    bottom="20px"
                    zIndex={4}
                    w="238px"
                    h="300px"
                    transform="translateX(-50%)"
                    animation={`${characterIntroAvatarRise} 500ms ease-out 120ms both`}
                    overflow="hidden"
                  >
                    <img
                      src={intro.spriteSheetPath}
                      alt={`${intro.name} intro sprite`}
                      style={{
                        width: `${spriteWidth * intro.spriteCols * spriteScale}px`,
                        height: `${spriteHeight * intro.spriteRows * spriteScale}px`,
                        transform: `translate(${-spriteCol * spriteWidth * spriteScale}px, -${spriteRow * spriteHeight * spriteScale}px)`,
                        display: "block",
                        maxWidth: "none",
                      }}
                    />
                  </Flex>
                  <Flex
                    position="absolute"
                    right="30px"
                    top="466px"
                    zIndex={5}
                    h="42px"
                    minW="116px"
                    px="18px"
                    borderRadius="999px"
                    border="2px solid rgba(255,255,255,0.5)"
                    bgColor={intro.theme.button}
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    animation={`${characterIntroOkPulse} 1.4s ease-in-out infinite`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseCharacterIntro();
                    }}
                  >
                    <Text color={intro.theme.buttonText} fontSize="24px" fontWeight="800" letterSpacing="0.16em" ml="4px">
                      OK
                    </Text>
                  </Flex>
                  <Flex
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    h="108px"
                    bgColor={intro.theme.topBar}
                    borderTop="4px solid rgba(255,255,255,0.42)"
                  />
                  <Flex position="absolute" inset="0" onClick={handleCloseCharacterIntro} />
                </>
              );
            })()}
          </Flex>
        ) : null}

        {isImageOnlyScene || !shouldShowSceneQuickActions ? null : (
          <DialogQuickActions
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenOptions={() => setIsSceneMenuOpen(true)}
            onOpenDiary={
              scene.id === LEGACY_NIGHT_HUB_SCENE_ID
                ? () => {
                  handleOpenDiary();
                }
                : undefined
            }
          />
        )}

        {isSceneMenuOpen ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={72}
            bgColor="rgba(18,14,10,0.52)"
            alignItems="center"
            justifyContent="center"
            p="24px"
            onClick={() => setIsSceneMenuOpen(false)}
          >
            <Flex
              w="100%"
              maxW="280px"
              borderRadius="14px"
              border="2px solid rgba(255,255,255,0.3)"
              bgColor="rgba(95,74,56,0.96)"
              boxShadow="0 14px 30px rgba(0,0,0,0.35)"
              p="14px"
              direction="column"
              gap="10px"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Text color="#FFF2E3" fontSize="15px" fontWeight="700" px="6px">
                選單
              </Text>
              <Flex
                h="40px"
                borderRadius="10px"
                bgColor={
                  scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.18)"
                }
                border="1px solid rgba(255,255,255,0.26)"
                alignItems="center"
                justifyContent="center"
                cursor={scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "default" : "pointer"}
                onClick={() => {
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode) return;
                  setIsSceneMenuOpen(false);
                  if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
                    const latestProgress = loadPlayerProgress();
                    if (!latestProgress.hasSeenDiaryFirstReveal) {
                      handleOpenDiary();
                      return;
                    }
                    setIsNightHubMode(true);
                    return;
                  }
                  router.push(ROUTES.gameScene(LEGACY_NIGHT_HUB_SCENE_ID));
                }}
              >
                <Text color="white" fontSize="14px" fontWeight="700">
                  {scene.id === LEGACY_NIGHT_HUB_SCENE_ID && isNightHubMode ? "目前已在夜間 Hub" : "前往夜間 Hub"}
                </Text>
              </Flex>
              <Flex
                h="40px"
                borderRadius="10px"
                bgColor={
                  unlockedDiaryEntryIds.length > 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)"
                }
                border="1px solid rgba(255,255,255,0.26)"
                alignItems="center"
                justifyContent="center"
                cursor={unlockedDiaryEntryIds.length > 0 ? "pointer" : "default"}
                onClick={() => {
                  if (unlockedDiaryEntryIds.length <= 0) return;
                  handleOpenDiary();
                }}
              >
                <Text color="white" fontSize="14px" fontWeight="700">
                  {unlockedDiaryEntryIds.length > 0 ? "查看日記" : "日記尚未解鎖"}
                </Text>
              </Flex>
              <Flex direction="column" gap="6px" px="4px" py="2px">
                <Text color="#FCECDD" fontSize="12px" fontWeight="700">
                  對話速度
                </Text>
                <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="6px">
                  {([
                    { key: "char", label: "逐字" },
                    { key: "double-char", label: "雙字" },
                    { key: "punctuated", label: "標點" },
                    { key: "pause", label: "停頓" },
                  ] as Array<{ key: DialogTypingMode; label: string }>).map((mode) => (
                    <Flex
                      key={mode.key}
                      h="28px"
                      borderRadius="999px"
                      border="1px solid rgba(255,255,255,0.26)"
                      bgColor={
                        dialogTypingMode === mode.key
                          ? "rgba(255,255,255,0.26)"
                          : "rgba(255,255,255,0.08)"
                      }
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setDialogTypingMode(mode.key);
                        saveDialogTypingMode(mode.key);
                      }}
                    >
                      <Text color="white" fontSize="11px" fontWeight="700">
                        {mode.label}
                      </Text>
                    </Flex>
                  ))}
                </Grid>
              </Flex>
              <Flex
                h="36px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.12)"
                border="1px solid rgba(255,255,255,0.22)"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => setIsSceneMenuOpen(false)}
              >
                <Text color="#FCECDD" fontSize="13px" fontWeight="700">
                  關閉
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-4" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={isStoryComicVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={scene4FreshenPhase === "comic-visible" ? 1 : scene4FreshenPhase === "comic-fade" ? 0 : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID.freshen}
              alt="freshen comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.storySingleComicPanel ? (
          <Flex
            position="absolute"
            top={scene.storySingleComicPanel.top}
            left={scene.storySingleComicPanel.centered ? "50%" : scene.storySingleComicPanel.left}
            right={scene.storySingleComicPanel.right}
            zIndex={scene.storySingleComicPanel.zIndex ?? 7}
            w={scene.storySingleComicPanel.width}
            h={scene.storySingleComicPanel.height}
            maxW={scene.storySingleComicPanel.maxWidth}
            pointerEvents="none"
            transform={scene.storySingleComicPanel.centered ? "translateX(-50%)" : undefined}
          >
            <img
              src={COMIC_IMAGE_BY_ID[scene.storySingleComicPanel.imageId]}
              alt={scene.storySingleComicPanel.alt}
              style={{
                width: "100%",
                height: scene.storySingleComicPanel.height ? "100%" : "auto",
                display: "block",
              }}
            />
          </Flex>
        ) : null}

        {scene.storyComicOverlays?.map((overlay, index) => {
          const isVisible = visibleStoryComicOverlayCount > index;
          const hiddenTransform =
            overlay.enterFrom === "left"
              ? "translateX(-72px)"
              : overlay.enterFrom === "right"
                ? "translateX(72px)"
                : overlay.enterFrom === "bottom"
                  ? "translateY(32px)"
                  : "translate(0, 0)";

          return (
            <Flex
              key={`${scene.id}-${overlay.imageId}-${index}`}
              position="absolute"
              top={overlay.top}
              left={overlay.left}
              right={overlay.right}
              zIndex={overlay.zIndex ?? 7}
              w={overlay.width}
              h={overlay.height}
              maxW={overlay.maxWidth}
              pointerEvents="none"
              opacity={isVisible ? 1 : 0}
              transform={isVisible ? "translate(0, 0)" : hiddenTransform}
              transition={`opacity ${overlay.enterDurationMs ?? 360}ms ease, transform ${overlay.enterDurationMs ?? 360}ms ease`}
            >
              <img
                src={COMIC_IMAGE_BY_ID[overlay.imageId]}
                alt={overlay.alt}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Flex>
          );
        })}

        {isScene5OutfitReveal &&
        scene5OutfitRevealPhase !== "hidden" &&
        scene5OutfitRevealPhase !== "dialog" ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={18}
            pointerEvents="none"
            alignItems="center"
            justifyContent="center"
            opacity={scene5OutfitRevealPhase === "modal-exit" ? 0 : 1}
            transition="opacity 360ms ease"
            bg="rgba(35, 27, 20, 0.46)"
          >
            <Flex
              w="84%"
              maxW="310px"
              h="63%"
              maxH="540px"
              minH="420px"
              position="relative"
              overflow="hidden"
              borderRadius="16px"
              border="3px solid rgba(148, 116, 87, 0.94)"
              boxShadow="0 18px 34px rgba(32, 22, 16, 0.24)"
              bgColor="#E6DFC3"
              backgroundImage={`
                radial-gradient(circle, rgba(192, 156, 118, 0.9) 0 2.5px, transparent 2.6px),
                linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(219,208,176,0.12) 100%)
              `}
              backgroundSize="38px 38px, 100% 100%"
              backgroundPosition="19px 19px, 0 0"
              animation={`${scene5OutfitPanelFadeIn} 180ms ease-out`}
            >
              <Flex
                position="absolute"
                inset="0"
                bg="linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 100%)"
              />
              <Flex
                position="absolute"
                left="50%"
                bottom="-8px"
                w="74%"
                maxW="228px"
                transform={
                  scene5OutfitRevealPhase === "modal-enter"
                    ? "translateX(-50%) translateY(-58%)"
                    : "translateX(-50%) translateY(100px)"
                }
                transition="transform 980ms linear"
                filter="drop-shadow(0 10px 22px rgba(105, 76, 54, 0.14))"
              >
                <img
                  src="/images/mai/mai_pose.png"
                  alt="小麥穿搭站姿"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {isScene5OutfitReveal && scene5OutfitRevealPhase === "dialog" ? (
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            zIndex={6}
            pointerEvents="none"
            animation={`${scene5HappyAvatarFadeIn} 420ms ease-out`}
          >
            <EventAvatarSprite
              spriteId="mai"
              frameIndex={scene.dialogAvatarFrameIndex ?? 1}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-6" ? (
          <Flex
            position="absolute"
            left="140px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 130px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="開心哼歌泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex
                position="relative"
                w="20px"
                h="20px"
                alignItems="center"
                justifyContent="center"
                animation={`${scene6MusicIconSwing} 1.1s ease-in-out infinite`}
              >
                <FaMusic color="#8B6C54" size={20} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-14" ? (
          <>
            <Flex
              position="absolute"
              top="142px"
              left="50%"
              transform={
                scene14PuppetPhase === "visible" ? "translate(-50%, 0)" : "translate(-50%, 8px)"
              }
              zIndex={7}
              w="80%"
              maxW="290px"
              pointerEvents="none"
              opacity={scene14PuppetPhase === "visible" ? 1 : 0}
              transition="opacity 260ms ease, transform 320ms ease"
            >
              <img
                src={COMIC_IMAGE_BY_ID.puppet}
                alt="人偶漫畫格"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="生氣泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="4px"
            >
              <Text color="#D95B17" fontSize="24px" lineHeight="1">
                💢
              </Text>
            </Flex>
          </Flex>
          </>
        ) : null}

        {scene.id === "scene-20" ? (
          <Flex
            position="absolute"
            left="138px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 132px)`}
            zIndex={7}
            w="72px"
            pointerEvents="none"
            animation={`${scene6SpeechBubbleFloat} 1.8s ease-in-out infinite`}
            filter="drop-shadow(0 4px 10px rgba(92, 70, 53, 0.12))"
          >
            <img
              src="/images/UI/speechBubble.png"
              alt="雨滴泡泡"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <Flex
              position="absolute"
              inset="0"
              alignItems="center"
              justifyContent="center"
              pb="2px"
            >
              <Flex animation={`${scene20DropletFall} 1.05s ease-in infinite`}>
                <FaDroplet color="#4C8CCF" size={18} />
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-22" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.book}
              alt="隨手亂丟的日記本漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-30" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.throwBook}
              alt="throw book comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-31" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.book}
              alt="book comic"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-43" || scene.id === "scene-49" ? (
          <Flex
            position="absolute"
            right="36px"
            top="248px"
            zIndex={12}
            pointerEvents="none"
            animation={`${creatureFlashBy} 460ms ease-out 1`}
          >
            <Flex
              transform="scale(0.9)"
              opacity={0.94}
              filter="drop-shadow(0 0 12px rgba(255,255,255,0.28))"
            >
              <EventAvatarSprite spriteId="beigo" frameIndex={0} />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-47" || scene.id === "scene-48" ? (
          <Flex
            position="absolute"
            left="50%"
            top="128px"
            transform="translateX(-50%)"
            zIndex={8}
            pointerEvents="none"
          >
            <Flex
              position="absolute"
              left="50%"
              top="50%"
              w="148px"
              h="148px"
              borderRadius="999px"
              bg="radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(170,228,255,0.44) 42%, rgba(255,255,255,0) 74%)"
              transform="translate(-50%, -50%)"
              animation={`${floatingBaiGlow} 1.8s ease-in-out infinite`}
            />
            <Flex
              position="relative"
              w="154px"
              animation={`${floatingBaiDrift} 2s ease-in-out infinite`}
              filter="drop-shadow(0 10px 16px rgba(184,234,255,0.34))"
            >
              <img
                src="/images/bai/shiro_portrait_white.png"
                alt="漂浮發光的小白"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-52" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.book}
              alt="掉在地上的日記本"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-64" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
          >
            <img
              src={COMIC_IMAGE_BY_ID.beigoJumpBed}
              alt="小貝狗撲到床上"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {scene.id === "scene-55" ? (
          <Flex position="absolute" inset="0" zIndex={14} pointerEvents="none">
            {scene55BookPhase === "glow" ? (
              <Flex
                position="absolute"
                left="50%"
                top="142px"
                w="250px"
                h="250px"
                transform="translate(-50%, -18%)"
                bg="radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(187,233,255,0.56) 32%, rgba(255,255,255,0) 72%)"
                animation={`${glowingBookRay} 920ms ease-out 1`}
              />
            ) : null}
            <Flex
              position="absolute"
              top="142px"
              left="50%"
              w="80%"
              maxW="290px"
              transform="translate(-50%, 0)"
              animation={scene55BookPhase === "glow" ? `${glowingBookPulse} 920ms ease-out 1` : undefined}
              filter={
                scene55BookPhase === "glow"
                  ? "drop-shadow(0 0 26px rgba(255,255,255,0.62))"
                  : "drop-shadow(0 6px 12px rgba(0,0,0,0.18))"
              }
            >
              <img
                src={COMIC_IMAGE_BY_ID.book}
                alt="發光的筆記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-57" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform="translate(-50%, 0)"
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            filter="grayscale(0.92) brightness(1.16)"
          >
            <Flex position="relative" w="100%">
              <img
                src={COMIC_IMAGE_BY_ID.book}
                alt="內頁空白的筆記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <Flex
                position="absolute"
                inset="16% 18% 20% 18%"
                bg="rgba(255,255,255,0.74)"
                borderRadius="10px"
                boxShadow="inset 0 0 0 1px rgba(255,255,255,0.88)"
              />
            </Flex>
          </Flex>
        ) : null}

        {scene.id === "scene-9" ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={
              scene9PuppetRevealPhase === "hidden"
                ? "translate(-50%, 8px)"
                : "translate(-50%, 0)"
            }
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={scene9PuppetRevealPhase === "hidden" ? 0 : 1}
            transition="opacity 260ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID.puppet}
              alt="掉落在地上的人偶"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {activeComicCheatId ? (
          <Flex
            position="absolute"
            top="142px"
            left="50%"
            transform={isComicCheatVisible ? "translate(-50%, 0)" : "translate(-50%, 8px)"}
            zIndex={7}
            w="80%"
            maxW="290px"
            pointerEvents="none"
            opacity={isComicCheatVisible ? (isComicCheatFading ? 0 : 1) : 0}
            transition="opacity 320ms ease, transform 320ms ease"
          >
            <img
              src={COMIC_IMAGE_BY_ID[activeComicCheatId]}
              alt={`${activeComicCheatId} comic`}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        {(scene.id === "scene-40" || scene.id === LEGACY_NIGHT_HUB_SCENE_ID) && isDoorTransitionVisible ? (
          <Flex
            pointerEvents="none"
            position="absolute"
            inset="0"
            zIndex={20}
            bgColor="rgba(14,14,18,0.92)"
            alignItems="center"
            justifyContent="center"
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
                  doorTransitionPhase === "opened"
                    ? "/images/背景/玄關_開門.jpg"
                    : "/images/背景/玄關_關門.jpg"
                }
                alt="door-transition"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isImageOnlyScene || !shouldShowSceneDialogPanel ? null : isScene44Interactive ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId="mai-beigo"
                frameIndex={scene44Speaker === "小貝狗" ? 1 : 0}
              />
            </Flex>
            <EventDialogPanel w="100%">
              <Text color="white" fontWeight="700">
                {scene44Speaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {scene44Text}
                </Text>
                {scene44Step === "choose" ? (
                  <Flex direction="column" gap="8px">
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.metro ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.metro ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.metro) return;
                        handleScene44SelectTopic("metro");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        捷運站 {scene44Asked.metro ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      h="34px"
                      borderRadius="8px"
                      bgColor={scene44Asked.dog ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={scene44Asked.dog ? "default" : "pointer"}
                      onClick={() => {
                        if (scene44Asked.dog) return;
                        handleScene44SelectTopic("dog");
                      }}
                    >
                      <Text color="white" fontSize="13px" fontWeight="700">
                        黃金獵犬 {scene44Asked.dog ? "（已詢問）" : ""}
                      </Text>
                    </Flex>
                    {allScene44Asked ? (
                      <Flex
                        h="34px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.9)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => {
                          setScene44Step("final");
                          setScene44FinalTurn(0);
                        }}
                      >
                        <Text color="#5F4C3B" fontSize="13px" fontWeight="700">
                          問交換日記
                        </Text>
                      </Flex>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>
              {scene44Step === "intro" || scene44Step === "qa" || scene44Step === "final" ? (
                <EventContinueAction onClick={handleScene44Continue} />
              ) : null}
            </EventDialogPanel>
          </Flex>
        ) : isNightHubInteractive ? (
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId="mai-beigo"
                frameIndex={nightHubSpeaker === "小貝狗" ? 1 : 0}
              />
            </Flex>
            <EventDialogPanel w="100%">
              <Text color="white" fontWeight="700">
                {nightHubSpeaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {nightHubText}
                </Text>
                {nightHubStep === "choose" ? (
                  <Flex direction="column" gap="8px">
                    <Flex
                      h="38px"
                      borderRadius="8px"
                      bgColor={nightHubAsked.bai ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={nightHubAsked.bai ? "default" : "pointer"}
                      onClick={() => {
                        if (nightHubAsked.bai) return;
                        handleNightHubSelectTopic("bai");
                      }}
                    >
                      <Text color="white" fontSize="14px" fontWeight="700">
                        去小白的房間看看 {nightHubAsked.bai ? "（已查看）" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      h="38px"
                      borderRadius="8px"
                      bgColor={nightHubAsked.beigo ? "rgba(140,140,140,0.38)" : "rgba(255,255,255,0.14)"}
                      border="1px solid rgba(255,255,255,0.26)"
                      alignItems="center"
                      justifyContent="center"
                      cursor={nightHubAsked.beigo ? "default" : "pointer"}
                      onClick={() => {
                        if (nightHubAsked.beigo) return;
                        handleNightHubSelectTopic("beigo");
                      }}
                    >
                      <Text color="white" fontSize="14px" fontWeight="700">
                        跟小貝狗聊天 {nightHubAsked.beigo ? "（已聊天）" : ""}
                      </Text>
                    </Flex>
                    <Flex
                      h="38px"
                      borderRadius="999px"
                      bgColor="rgba(255,255,255,0.9)"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        handleNightHubSleep();
                      }}
                    >
                      <Text color="#5F4C3B" fontSize="14px" fontWeight="700">
                        去睡覺（進入隔天）
                      </Text>
                    </Flex>
                  </Flex>
                ) : null}
              </Flex>
              {nightHubStep === "talk" ? (
                <EventContinueAction onClick={handleNightHubContinue} />
              ) : null}
            </EventDialogPanel>
          </Flex>
        ) : isMorningHubInteractive ? (
          isWeekendMorningHub ? (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom="316px"
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite spriteId="mai" frameIndex={0} />
              </Flex>
              <Flex
                w="100%"
                minH="316px"
                bg="linear-gradient(180deg, rgba(142,109,82,0.95) 0%, rgba(130,98,73,0.98) 100%)"
                borderTopRadius="22px"
                px="16px"
                pt="16px"
                pb="18px"
                direction="column"
                gap="12px"
                position="relative"
                zIndex={8}
                boxShadow="0 -10px 24px rgba(36,24,16,0.22)"
              >
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" gap="10px">
                  <Text color="white" fontSize="18px" lineHeight="1.55">
                    {weekendSelectedDestination
                      ? `${weekendSelectedDestination.title}已經決定好了，今天就照自己的步調過吧。`
                      : "今天是自由安排日，不用趕著上班。想去哪裡走走呢？"}
                  </Text>
                  {weekendSelectedDestination ? (
                    <>
                      <Flex
                        flex="1"
                        borderRadius="16px"
                        bgColor="rgba(255,255,255,0.14)"
                        border="1px solid rgba(255,255,255,0.22)"
                        px="14px"
                        py="12px"
                        direction="column"
                        gap="8px"
                        justifyContent="center"
                      >
                        <Text color="#FFF3E3" fontSize="18px" fontWeight="700">
                          {weekendSelectedDestination.icon} {weekendSelectedDestination.title}
                        </Text>
                        <Text color="#F6E8D5" fontSize="14px" lineHeight="1.6">
                          {weekendSelectedDestination.resultText}
                        </Text>
                        <Text color="#FDE8C4" fontSize="13px" fontWeight="700">
                          {weekendSelectedDestination.effectLabel}
                        </Text>
                      </Flex>
                      <Flex
                        h="46px"
                        borderRadius="999px"
                        bgColor="rgba(255,255,255,0.92)"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={handleWeekendEndDay}
                      >
                        <Text color="#5F4C3B" fontSize="15px" fontWeight="700">
                          今天就先這樣，回家休息
                        </Text>
                      </Flex>
                    </>
                  ) : (
                    <>
                      <Text color="#EEDFCB" fontSize="13px" fontWeight="700">
                        {formatInGameDateLabel(currentDay)} ・ 週末自由安排日
                      </Text>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="12px">
                        {weekendDestinationOptions.map((option, index) => (
                          <Flex
                            key={option.id}
                            minH="158px"
                            borderRadius="18px"
                            bgColor="rgba(255,255,255,0.14)"
                            border="1px solid rgba(255,255,255,0.22)"
                            px="14px"
                            py="14px"
                            direction="column"
                            alignItems="center"
                            justifyContent="space-between"
                            textAlign="center"
                            cursor="pointer"
                            gridColumn={
                              weekendDestinationOptions.length % 2 === 1 &&
                              index === weekendDestinationOptions.length - 1
                                ? "span 2"
                                : undefined
                            }
                            onClick={() => handleWeekendDestinationSelect(option)}
                          >
                            <Text color="#FFF2E0" fontSize="34px" lineHeight="1">
                              {option.icon}
                            </Text>
                            <Text color="white" fontSize="18px" fontWeight="700" lineHeight="1.2">
                              {option.title}
                            </Text>
                            <Text color="#EEDFCB" fontSize="13px" lineHeight="1.4">
                              {option.subtitle}
                            </Text>
                            <Text color="#FDE8C4" fontSize="12px" fontWeight="700" lineHeight="1.4">
                              {option.effectLabel}
                            </Text>
                          </Flex>
                        ))}
                      </Grid>
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
          ) : (
            <Flex mt="auto" w="100%" position="relative">
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite spriteId="mai" frameIndex={0} />
              </Flex>
              <EventDialogPanel w="100%">
                <Text color="white" fontWeight="700">
                  小麥
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center" gap="8px">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    時間差不多了
                  </Text>
                  <Flex
                    h="38px"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.9)"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={() => {
                      startPathTransition(`${ROUTES.gameArrangeRoute}?day=next`, "fade-black", 420);
                    }}
                  >
                    <Text color="#5F4C3B" fontSize="14px" fontWeight="700">
                      出門安排通勤路線
                    </Text>
                  </Flex>
                </Flex>
              </EventDialogPanel>
            </Flex>
          )
        ) : (
          <StoryDialogPanel
            characterName={scene.characterName}
            dialogue={scene.dialogue}
            nextSceneId={scene.nextSceneId}
            onRequestNextScene={handleStoryRequestNext}
            showAvatarSprite={scene.showDialogAvatar ?? true}
            showCharacterName={scene.showCharacterName ?? true}
            avatarFrameIndex={scene.dialogAvatarFrameIndex}
            avatarSpriteId={scene.dialogAvatarSpriteId ?? "mai"}
            avatarMotionId={
              isContinueExitActive && scene.continueExitMotionId
                ? scene.continueExitMotionId
                : scene.dialogAvatarMotionId
            }
            avatarMotionLoop={scene.dialogAvatarMotionLoop ?? false}
            avatarTransform={
              scene.id === "scene-4"
                ? scene4FreshenPhase !== "idle"
                  ? "translateX(120px)"
                  : undefined
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? "translateX(120px)"
                    : undefined
                  : undefined
            }
            avatarOpacity={
              scene.id === "scene-4"
                ? scene4FreshenPhase !== "idle"
                  ? 0
                  : 1
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                : scene.id === "scene-9"
                  ? scene9PuppetRevealPhase === "dialog"
                    ? 1
                    : 0
                  : 1
            }
            avatarTransition={
              scene.id === "scene-4" ||
              scene.id === "scene-9" ||
              scene.id === "scene-10"
                ? "transform 680ms ease, opacity 680ms ease"
                : undefined
            }
            panelOpacity={
              scene.id === "scene-9"
                ? scene9PuppetRevealPhase === "dialog"
                  ? 1
                  : 0
                : scene.id === "scene-10"
                  ? scene10ExitPhase === "exiting"
                    ? 0
                    : 1
                  : 1
            }
            panelTransition={
              scene.id === "scene-9" || scene.id === "scene-10" ? "opacity 320ms ease" : undefined
            }
            showContinueAction={
              scene.id === "scene-4"
                ? scene4FreshenPhase === "done"
                : scene.id === "scene-9"
                  ? scene9PuppetRevealPhase === "dialog"
                  : scene.id === "scene-10"
                  ? scene10ExitPhase !== "exiting"
                  : isContinueExitActive
                    ? false
                  : true
            }
            typingMode={dialogTypingMode}
            onTypingComplete={
              scene.id === "scene-4" ||
              scene.id === "scene-14" ||
              scene.id === "scene-29" ||
              scene.id === LEGACY_NIGHT_HUB_SCENE_ID
                ? () => {
                    if (scene.id === "scene-4") {
                      setScene4FreshenPhase("avatar-exit");
                      scene4SequenceTimerRefs.current.forEach((timer) => clearTimeout(timer));
                      scene4SequenceTimerRefs.current = [
                        setTimeout(() => {
                          setScene4FreshenPhase("comic-visible");
                          playStoryComic("freshen", { fadeAtMs: 980, hideAtMs: 1360 });
                        }, 720),
                        setTimeout(() => {
                          setScene4FreshenPhase("comic-fade");
                        }, 1700),
                        setTimeout(() => {
                          setScene4FreshenPhase("done");
                        }, 2080),
                      ];
                    }
                    if (scene.id === "scene-14") {
                      if (scene14PuppetTimerRef.current) clearTimeout(scene14PuppetTimerRef.current);
                      scene14PuppetTimerRef.current = setTimeout(() => {
                        setScene14PuppetPhase("visible");
                        scene14PuppetTimerRef.current = null;
                      }, 120);
                    }
                    if (scene.id === "scene-29") {
                      window.dispatchEvent(
                        new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, {
                          detail: { shakeId: "flash-white" },
                        }),
                      );
                    }
                    if (scene.id === LEGACY_NIGHT_HUB_SCENE_ID) {
                      const latestProgress = loadPlayerProgress();
                      if (latestProgress.hasSeenDiaryFirstReveal) {
                        setIsNightHubMode(true);
                        return;
                      }
                      if (diaryOpenTimerRef.current) clearTimeout(diaryOpenTimerRef.current);
                      diaryOpenTimerRef.current = setTimeout(() => {
                        setIsDiaryOpen(true);
                        diaryOpenTimerRef.current = null;
                      }, 180);
                    }
                  }
                : undefined
            }
          />
        )}
      </Flex>

      {isImageOnlyScene ? null : (
        <EventHistoryOverlay
          title="回顧"
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          lines={historyLines}
        />
      )}
      <DiaryOverlay
        open={isDiaryOpen}
        unlockedEntryIds={unlockedDiaryEntryIds}
        onGuidedFlowComplete={() => {
          setIsDiaryOpen(false);
          setIsNightHubMode(true);
        }}
        onClose={() => {
          setIsDiaryOpen(false);
        }}
      />

      {endDaySequencePhase === "black" || endDaySequencePhase === "summary" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={85}
          bgColor="rgba(12,10,14,0.96)"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          {endDaySequencePhase === "black" ? (
            <Flex direction="column" alignItems="center" gap="8px">
              <Text color="#F7EEE0" fontSize="34px" fontWeight="700" letterSpacing="2px">
                {endDayTransitionText?.toDayLabel ?? "第二天"}
              </Text>
              <Flex
                position="relative"
                h="24px"
                minW="170px"
                justifyContent="center"
                alignItems="center"
                color="#EADBC8"
                fontSize="16px"
                fontWeight="700"
                letterSpacing="1px"
              >
                <Text animation={`${dayDateOldFadeOut} 1100ms ease forwards`}>
                  {endDayTransitionText?.fromDateLabel ?? "星期一 3/11"}
                </Text>
                <Flex
                  position="absolute"
                  alignItems="center"
                  animation={`${dayDateNewFadeIn} 1100ms ease forwards`}
                >
                  <Text>{endDayTransitionText?.toDateLabel ?? "星期二 3/12"}</Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
          {endDaySequencePhase === "summary" ? (
            <Flex
              w="100%"
              maxW="320px"
              direction="column"
              gap="14px"
              borderRadius="16px"
              border="1px solid rgba(255,255,255,0.22)"
              bg="linear-gradient(180deg, rgba(72,56,44,0.88) 0%, rgba(49,38,30,0.9) 100%)"
              p="18px"
              boxShadow="0 12px 30px rgba(0,0,0,0.35)"
              animation={`${isEndDaySummaryLeaving ? summaryCardOut : summaryCardIn} ${isEndDaySummaryLeaving ? 320 : 380}ms ease forwards`}
            >
              <Flex alignItems="center" justifyContent="space-between">
                <Text color="#FCEEDC" fontSize="16px" fontWeight="700">
                  {endDaySummaryContent?.title ?? "今天先告一段落"}
                </Text>
                <Text color="#FDE8C4" fontSize="18px" lineHeight="1">
                  🌙
                </Text>
              </Flex>
              <Text color="#F6E8D5" fontSize="14px" lineHeight="1.65">
                {endDaySummaryContent?.body ??
                  "回到家後好好休息了一下，把今天的疲累慢慢放下，準備迎接明天。"}
              </Text>
              <Flex h="1px" bgColor="rgba(255,255,255,0.22)" />
              <Flex gap="10px">
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[0] ?? "疲勞 -20"}
                  </Text>
                </Flex>
                <Flex
                  flex="1"
                  h="34px"
                  borderRadius="999px"
                  bgColor="rgba(255,255,255,0.1)"
                  border="1px solid rgba(255,255,255,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#FFF4E6" fontSize="14px" fontWeight="700">
                    {endDaySummaryContent?.chips[1] ?? "行動力 +1"}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      ) : null}

      {outgoingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={40}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeOutToBlack} ${outgoingTransition.durationMs}ms ease forwards`}
          alignItems="center"
          justifyContent="center"
        >
          {outgoingTransition.preset === "next-day" ? (
            <Text color="#F7EEE0" fontSize="30px" fontWeight="700" letterSpacing="2px">
              隔天早晨
            </Text>
          ) : null}
        </Flex>
      ) : null}

      {incomingTransition ? (
        <Flex
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={39}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeInFromBlack} ${incomingTransition.durationMs}ms ease forwards`}
          alignItems="center"
          justifyContent="center"
        >
          {incomingTransition.preset === "next-day" ? (
            <Text color="#F7EEE0" fontSize="30px" fontWeight="700" letterSpacing="2px">
              隔天早晨
            </Text>
          ) : null}
        </Flex>
      ) : null}

      {previewTransitionDurationMs ? (
        <Flex
          key={`preview-transition-${previewTransitionNonce}`}
          pointerEvents="none"
          position="absolute"
          inset="0"
          zIndex={41}
          bgColor="rgba(25,18,14,0.92)"
          animation={`${fadeOutInBlack} ${previewTransitionDurationMs * 2}ms ease forwards`}
        />
      ) : null}

      {isWorkTransitionScene ? (
        <WorkTransitionModal
          baseFatigue={workTransitionBaseFatigue}
          fatigueIncreaseTotal={DEFAULT_WORK_TRANSITION_FATIGUE_INCREASE_TOTAL}
          onFinish={(fatigueIncrease) => {
            if (workTransitionDoneRef.current) return;
            workTransitionDoneRef.current = true;
            const progress = loadPlayerProgress();
            savePlayerProgress(applyWorkTransitionFatigue(progress, fatigueIncrease));
            if (scene.nextSceneId) {
              router.push(ROUTES.gameScene(scene.nextSceneId));
            }
          }}
        />
      ) : null}

      {isOffworkScene && isOffworkRewardOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(0,0,0,0.38)" alignItems="center" justifyContent="center" p="22px">
          <Flex
            w="100%"
            maxW="340px"
            minH="350px"
            bgColor="#A27F5D"
            borderRadius="12px"
            border="3px solid #D9C4A7"
            boxShadow="0 12px 26px rgba(0,0,0,0.25)"
            direction="column"
            alignItems="center"
            p="20px 16px 18px"
            gap="14px"
          >
            <Text color="white" fontSize="22px" lineHeight="1">
              下班獎勵
            </Text>
            <Text color="white" fontSize="32px" lineHeight="1">
              挑選一個
            </Text>
            <Flex
              w="100%"
              borderRadius="10px"
              bgColor="rgba(255,255,255,0.2)"
              px="10px"
              py="8px"
              justifyContent="space-between"
              gap="8px"
            >
              <Text color="#F9F0E2" fontSize="13px">
                儲蓄：{offworkModalStatus.savings}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                行動力：{offworkModalStatus.actionPower}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                疲勞值：{offworkModalStatus.fatigue}
              </Text>
            </Flex>
            {offworkRewardClaimCount >= 1 ? (
              <Text color="#F8EACD" fontSize="12px" fontWeight="700">
                自組路徑：{customRouteCostLabel}
              </Text>
            ) : null}

            {customRouteStep ? (
              <>
                <Text color="white" fontSize="24px" lineHeight="1">
                  一組路徑拼圖
                </Text>
                {customRouteStep === "size" ? (
                  <Flex w="100%" justifyContent="center" gap="12px">
                    {(["1x1", "2x1"] as const).map((sizeOption) => (
                      <Flex
                        key={sizeOption}
                        w="132px"
                        h="132px"
                        borderRadius="12px"
                        bgColor="#ECECEC"
                        border={customRouteSize === sizeOption ? "2px solid #4FAE87" : "2px solid transparent"}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        gap="14px"
                        cursor="pointer"
                        onClick={() => {
                          setCustomRouteSize(sizeOption);
                          setCustomRouteEntryPattern(null);
                          setCustomRouteExitPattern(null);
                          setCustomRouteCostError("");
                          setCustomRouteStep("entry");
                        }}
                      >
                        <Flex
                          w={sizeOption === "1x1" ? "58px" : "96px"}
                          h="58px"
                          borderRadius="8px"
                          border="3px solid #B38C5C"
                          bgColor="#DCD3C1"
                        />
                        <Text color="#6B5240" fontSize="34px" fontWeight="700" lineHeight="1">
                          {sizeOption}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                ) : null}
                {customRouteStep === "entry" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇入口（上排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((entryPattern, optionIndex) => (
                        <Flex
                          key={`entry-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteEntryPattern(entryPattern);
                            setCustomRouteStep("exit");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isTopRow = index < edgePatternWidth;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isTopRow ? entryPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`entry-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "exit" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇出口（下排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((exitPattern, optionIndex) => (
                        <Flex
                          key={`exit-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteExitPattern(exitPattern);
                            setCustomRouteStep("result");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isBottomRow = index >= edgePatternWidth * 2;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isBottomRow ? exitPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`exit-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "result" ? (
                  <>
                    <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                      獲得路徑拼圖
                    </Text>
                    <Flex
                      w="130px"
                      h="130px"
                      borderRadius="8px"
                      bgColor="#E8E8E8"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Grid
                        templateColumns={`repeat(${customRouteSize === "2x1" ? 6 : 3}, 16px)`}
                        templateRows="repeat(3, 16px)"
                        gap="2px"
                      >
                        {customRoutePattern.flat().map((cell, index) => (
                          <Flex
                            key={index}
                            w="16px"
                            h="16px"
                            borderRadius="3px"
                            bgColor={cell ? "#A38765" : "#DADADA"}
                          />
                        ))}
                      </Grid>
                    </Flex>
                    <Flex
                      mt="2px"
                      px="18px"
                      py="8px"
                      borderRadius="999px"
                      bgColor="#6F533A"
                      cursor="pointer"
                      onClick={() => {
                        const latestProgress = loadPlayerProgress();
                        if (latestProgress.status.savings < customRouteCost) {
                          setCustomRouteCostError("儲蓄不足，需要 2 才能購買自組路徑");
                          return;
                        }
                        const nextProgress = {
                          ...latestProgress,
                          status: {
                            ...latestProgress.status,
                            savings: latestProgress.status.savings - customRouteCost,
                          },
                        };
                        savePlayerProgress(nextProgress);
                        setOffworkModalStatus(nextProgress.status);
                        setCustomRouteCostError("");
                        if (customRouteSize === "2x1") {
                          claimOffworkRewardBatch([
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(0, 3))),
                              options: { label: "自組路徑A", centerEmoji: "🧩", category: "route" },
                            },
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(3, 6))),
                              options: { label: "自組路徑B", centerEmoji: "🧩", category: "route" },
                            },
                          ]);
                        } else {
                          claimOffworkReward("street", toPattern3x3(customRoutePattern), {
                            label: "自組路徑",
                            centerEmoji: "🧩",
                            category: "route",
                          });
                        }
                        setIsOffworkRewardOpen(false);
                        startSceneTransition(afterOffworkRewardSceneId, "fade-black", 420);
                      }}
                    >
                      <Text color="white" fontSize="18px" fontWeight="700">
                        收下
                      </Text>
                    </Flex>
                    <Text color={offworkRewardClaimCount === 0 ? "#F8EACD" : "#FFD8A8"} fontSize="13px" fontWeight="700">
                      {customRouteCostLabel}
                    </Text>
                    {customRouteCostError ? (
                      <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                        {customRouteCostError}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {customRouteStep !== "size" ? (
                  <Flex
                    px="14px"
                    py="6px"
                    borderRadius="999px"
                    bgColor="rgba(111,83,58,0.6)"
                    cursor="pointer"
                    onClick={() => {
                      if (customRouteStep === "entry") setCustomRouteStep("size");
                      if (customRouteStep === "exit") setCustomRouteStep("entry");
                      if (customRouteStep === "result") setCustomRouteStep("exit");
                    }}
                  >
                    <Text color="white" fontSize="14px">
                      返回上一步
                    </Text>
                  </Flex>
                ) : null}
              </>
            ) : selectedReward ? (
              <>
                <Flex
                  w="130px"
                  h="130px"
                  borderRadius="8px"
                  bgColor="#E8E8E8"
                  alignItems="center"
                  justifyContent="center"
                  direction="column"
                  gap="8px"
                >
                  <Text color="#7A6048" fontSize="22px" fontWeight="700" lineHeight="1">
                    {selectedReward.title}
                  </Text>
                  <Grid templateColumns="repeat(3, 18px)" templateRows="repeat(3, 18px)" gap="2px">
                    {selectedPlaceRewardPattern.flat().map((cell, index) => (
                      <Flex
                        key={index}
                        w="18px"
                        h="18px"
                        borderRadius="3px"
                        bgColor={cell ? "#A38765" : "#DADADA"}
                      />
                    ))}
                  </Grid>
                </Flex>
                <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                  已獲得地點拼圖
                </Text>
                <Flex
                  mt="2px"
                  px="18px"
                  py="8px"
                  borderRadius="999px"
                  bgColor="#6F533A"
                  cursor="pointer"
                  onClick={() => {
                    if (!selectedReward) return;
                    const latestProgress = loadPlayerProgress();
                    const isNewPlaceUnlock = !latestProgress.ownedPlaceTileIds.includes(selectedReward.id);
                    if (selectedRewardActionCost > 0 && latestProgress.status.actionPower < selectedRewardActionCost) {
                      setPlaceRewardCostError("行動力不足，需要 1 才能選擇這個地點");
                      return;
                    }
                    if (selectedRewardActionCost > 0) {
                      const nextProgress = {
                        ...latestProgress,
                        status: {
                          ...latestProgress.status,
                          actionPower: latestProgress.status.actionPower - selectedRewardActionCost,
                        },
                      };
                      savePlayerProgress(nextProgress);
                      setOffworkModalStatus(nextProgress.status);
                    }
                    setPlaceRewardCostError("");
                    claimOffworkReward(selectedReward.id, selectedPlaceRewardPattern, {
                      category: "place",
                      label: selectedReward.title,
                      centerEmoji: selectedReward.icon,
                    });
                    if (isNewPlaceUnlock) {
                      pushUnlockFeedback([
                        {
                          id: `place-reward-${selectedReward.id}-${Date.now()}`,
                          badge: selectedReward.icon,
                          title: `新地點解鎖：${selectedReward.title}`,
                          description: "新的地點拼圖已加入收藏，之後安排路線時可以放進版面。",
                          tone: "place",
                        },
                      ]);
                    }
                    setIsOffworkRewardOpen(false);
                    startSceneTransition(afterOffworkRewardSceneId, "fade-black", 420);
                  }}
                >
                  <Text color="white" fontSize="18px" fontWeight="700">
                    收下
                  </Text>
                </Flex>
                {placeRewardCostError ? (
                  <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                    {placeRewardCostError}
                  </Text>
                ) : null}
              </>
            ) : (
              <Flex w="100%" justifyContent="center" gap="12px">
                {offworkRewardChoices.map((item, optionIndex) => (
                  <Flex
                    key={item.id}
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    position="relative"
                    onClick={() => {
                      setCustomRouteStep(null);
                      setSelectedRewardId(item.id);
                      setSelectedRewardActionCost(optionIndex === 0 ? 0 : 1);
                      setPlaceRewardCostError("");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      {item.icon}
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      {item.title}
                    </Text>
                    <Text color="#8E6D52" fontSize="16px" lineHeight="1">
                      {item.subtitle}
                    </Text>
                    <Text
                      color={optionIndex === 0 ? "#5F9C64" : "#B06A2A"}
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      {optionIndex === 0 ? "免費" : "行動力 -1"}
                    </Text>
                  </Flex>
                ))}
                {offworkRewardClaimCount >= 1 ? (
                  <Flex
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedRewardId(null);
                      setCustomRouteStep("size");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      🧩
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      自組
                    </Text>
                    <Text color="#8E6D52" fontSize="14px" lineHeight="1">
                      自訂路徑
                    </Text>
                    <Text
                      color="#B06A2A"
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      儲蓄 -2
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            )}
          </Flex>
          <Flex
            position="absolute"
            left="50%"
            bottom="18px"
            transform="translateX(-50%)"
            zIndex={53}
            h="36px"
            px="14px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.9)"
            border="1px solid rgba(120,95,70,0.25)"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => {
              setRewardInventoryTiles(loadPlayerProgress().rewardPlaceTiles);
              setIsRewardInventoryOpen(true);
            }}
          >
            <Text color="#6B5240" fontSize="13px" fontWeight="700">
              查看目前拼圖（地點 / 路徑）
            </Text>
          </Flex>
        </Flex>
      ) : null}

      {isOffworkScene && isOffworkRewardOpen && isRewardInventoryOpen ? (
            <Flex
              position="absolute"
              left="50%"
              bottom="64px"
              transform="translateX(-50%)"
              zIndex={54}
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
                <Flex
                  w="100%"
                  maxW="330px"
                  maxH="46vh"
                  borderRadius="16px"
                  bgColor="#F3EEE4"
                  border="2px solid #D9C4A7"
                  boxShadow="0 12px 28px rgba(0,0,0,0.3)"
                  direction="column"
                  p="14px"
                  gap="14px"
                  overflow="hidden"
                  pointerEvents="auto"
                >
                  <Flex alignItems="center" justifyContent="center" position="relative">
                    <Text color="#6B5240" fontSize="20px" fontWeight="700" lineHeight="1">
                      目前持有拼圖
                    </Text>
                    <Flex
                      as="button"
                      position="absolute"
                      right="0"
                      top="0"
                      w="34px"
                      h="34px"
                      borderRadius="999px"
                      bgColor="#A27F5D"
                      alignItems="center"
                      justifyContent="center"
                      onClick={() => setIsRewardInventoryOpen(false)}
                    >
                      <IoClose color="white" size={20} />
                    </Flex>
                  </Flex>
                  <Flex direction="column" gap="10px" overflowY="auto" pr="2px">
                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1">
                      地點拼圖
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="118px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedPlaceGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有地點拼圖</Text>
                      ) : (
                        ownedPlaceGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "place",
                            pattern: item.pattern,
                            sourceId: item.sourceId,
                          });
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-place-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>

                    <Text color="#7C6148" fontSize="16px" fontWeight="700" lineHeight="1" mt="2px">
                      路徑拼圖
                    </Text>
                    <Grid
                      borderRadius="10px"
                      border="1px solid rgba(163,135,101,0.35)"
                      bgColor="white"
                      p="10px"
                      minH="150px"
                      templateColumns="repeat(4, 64px)"
                      gridAutoRows="64px"
                      justifyContent="start"
                      alignContent="start"
                      gap="8px"
                    >
                      {ownedRouteGroups.length === 0 ? (
                        <Text color="#9B8A78" fontSize="12px">目前沒有路徑拼圖</Text>
                      ) : (
                        ownedRouteGroups.map((item) => {
                          const imagePath = resolveInventoryTileImagePath({
                            category: "route",
                            pattern: item.pattern,
                          });
                          return (
                            <Flex
                              key={item.key}
                              w="64px"
                              h="64px"
                              borderRadius="8px"
                              overflow="hidden"
                              border="1px solid rgba(130,106,83,0.36)"
                              bgColor="#F7F3EA"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={item.label}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" w="100%" h="100%" gap="2px" p="4px">
                                  {item.pattern.flat().map((cell, index) => (
                                    <Flex
                                      key={`${item.key}-route-fallback-${index}`}
                                      borderRadius="2px"
                                      bgColor={cell ? "#A38765" : "#E2DBCF"}
                                    />
                                  ))}
                                </Grid>
                              )}
                            </Flex>
                          );
                        })
                      )}
                    </Grid>
                  </Flex>
                </Flex>
        </Flex>
      ) : null}

      {isOffworkScene && isOffworkRewardOpen && isOffworkRewardTutorialOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={70}
          bgColor="rgba(0,0,0,0.48)"
          alignItems="center"
          justifyContent="center"
          p="22px"
        >
          <Flex
            w="100%"
            maxW="320px"
            borderRadius="14px"
            border="2px solid #D9C4A7"
            bgColor="#F3EEE4"
            boxShadow="0 14px 30px rgba(0,0,0,0.35)"
            direction="column"
            gap="12px"
            p="16px"
          >
            <Text color="#6B5240" fontSize="20px" fontWeight="700">
              下班獎勵教學
            </Text>
            <Text color="#7A6048" fontSize="14px" lineHeight="1.6">
              每次下班可挑選一個獎勵。先看上方資源（儲蓄／行動力／疲勞），再決定拿地點、路徑，或自組路徑。
            </Text>
            <Text color="#7A6048" fontSize="14px" lineHeight="1.6">
              可以點「查看目前拼圖」確認你已擁有的地點拼圖與路徑拼圖，幫助這次做最適合的選擇。
            </Text>
            <Flex
              mt="4px"
              h="38px"
              borderRadius="999px"
              bgColor="#A27F5D"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => {
                setIsOffworkRewardTutorialOpen(false);
                const latest = loadPlayerProgress();
                if (!latest.hasSeenOffworkRewardTutorial) {
                  savePlayerProgress({
                    ...latest,
                    hasSeenOffworkRewardTutorial: true,
                  });
                }
              }}
            >
              <Text color="white" fontSize="14px" fontWeight="700">
                我知道了
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

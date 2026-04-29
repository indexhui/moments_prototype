"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiX } from "react-icons/fi";
import { FaLocationDot, FaPaw, FaTrainSubway } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import type { GameEventId } from "@/lib/game/events";
import {
  METRO_CUTE_BAG_CHAT_EVENT_COPY,
  METRO_CARD_SEARCH_EVENT_COPY,
  METRO_DOOR_SPRINT_EVENT_COPY,
  METRO_BACKPACK_HIT_EVENT_COPY,
  METRO_COMMUTE_LAUGH_EVENT_COPY,
  METRO_KID_CRY_EVENT_COPY,
  METRO_MILK_TEA_SHOES_EVENT_COPY,
  METRO_PET_STROLLER_EVENT_COPY,
  METRO_SEAT_SPREAD_EVENT_COPY,
  STREET_BREEZE_EVENT_COPY,
  STREET_HUMID_EVENT_COPY,
} from "@/lib/game/events";
import { GAME_EVENT_CHEAT_TRIGGER } from "@/lib/game/eventCheatBus";
import { GAME_WORK_CHEAT_TRIGGER } from "@/lib/game/workCheatBus";
import { GAME_WORK_MINIGAME_CHEAT_TRIGGER } from "@/lib/game/workMinigameCheatBus";
import { MetroSeatEventModal } from "@/components/game/events/MetroSeatEventModal";
import { BreakfastShopEventModal } from "@/components/game/events/BreakfastShopEventModal";
import {
  ConvenienceStoreHubEventModal,
  type ConvenienceStoreFinishPayload,
} from "@/components/game/events/ConvenienceStoreHubEventModal";
import { ParkHubEventModal } from "@/components/game/events/ParkHubEventModal";
import { ParkGossipEventModal } from "@/components/game/events/ParkGossipEventModal";
import { StreetCookieEventModal } from "@/components/game/events/StreetCookieEventModal";
import { StreetNoChoiceEventModal } from "@/components/game/events/StreetNoChoiceEventModal";
import { StreetForgotLunchFrogEventModal } from "@/components/game/events/StreetForgotLunchFrogEventModal";
import { MetroFirstSunbeastDogEventModal } from "@/components/game/events/MetroFirstSunbeastDogEventModal";
import { MetroSunbeastGoatEventModal } from "@/components/game/events/MetroSunbeastGoatEventModal";
import { BusSunbeastCatEventModal } from "@/components/game/events/BusSunbeastCatEventModal";
import { OfficeSunbeastChickenEventModal } from "@/components/game/events/OfficeSunbeastChickenEventModal";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  UnlockFeedbackOverlay,
  type UnlockFeedbackItem,
} from "@/components/game/UnlockFeedbackOverlay";
import { ArrangeRouteDialogOverlay } from "@/components/game/ArrangeRouteDialogOverlay";
import { ArrangeRouteMapOverlay } from "@/components/game/ArrangeRouteMapOverlay";
import type { PlayerStatus } from "@/lib/game/playerStatus";
import { OFFWORK_SCENE_ID } from "@/lib/game/scenes";
import {
  claimPlaceUnlockIntroReward,
  grantInventoryItem,
  consumeInventoryItems,
  grantEventRewardTile,
  loadPlayerProgress,
  markBusSunbeastCatEventTriggered,
  buildStreetVisitProgress,
  getPlaceUnlockSnapshot,
  markMetroSunbeastGoatEventTriggered,
  markStreetForgotLunchFrogEventCompleted,
  markNegativeEventToday,
  recordWorkShiftResult,
  recordArrangeRouteDeparture,
  savePlayerProgress,
  syncDerivedPlaceUnlocks,
  unlockDiaryEntry,
  FIRST_STREET_REWARD_PATTERNS,
  type DiaryEntryId,
  type PlaceTileId,
  type RewardPlaceTile,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";
import { DiaryOverlay, type DiaryOverlayMode } from "@/components/game/DiaryOverlay";
import { PlaceUnlockIntroOverlay } from "@/components/game/PlaceUnlockIntroOverlay";

const DEFAULT_BOARD_COLS = 3;
const DEFAULT_BOARD_ROWS = 4;
const INTRO_BOARD_COLS = 1;
const INTRO_BOARD_ROWS = 3;
const SECOND_BOARD_COLS = 1;
const SECOND_BOARD_ROWS = 4;
const CONVENIENCE_BOARD_COLS = 2;
const CONVENIENCE_BOARD_ROWS = 4;
const EXPANDED_BOARD_COLS = 4;
const EXPANDED_BOARD_ROWS = 5;
const INTRO_START_POS = { r: 0, c: 0 };
const INTRO_END_POS = { r: 2, c: 0 };
const SECOND_START_POS = { r: 0, c: 0 };
const SECOND_END_POS = { r: 3, c: 0 };
const CONVENIENCE_START_POS = { r: 0, c: 0 };
const CONVENIENCE_END_POS = { r: 3, c: 0 };
const CONVENIENCE_STORE_POS = { r: 2, c: 1 };
const DEFAULT_START_POS = { r: 0, c: 1 };
const SHIFTED_START_POS = { r: 0, c: 2 };
const EXPANDED_START_POS = { r: 0, c: 3 };
const DEFAULT_END_POS = { r: 3, c: 1 };
const EXPANDED_END_POS = { r: 4, c: 2 };
const PET_ABILITIES_ENABLED = false;
const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen";
const ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY = "moment:arrange-route-tile-tutorial-seen";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY = "moment:arrange-route-convenience-tutorial-seen";
const SECOND_TUTORIAL_ROUTE_REWARDS = [
  {
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ] as number[][],
    label: "路徑拼圖 1",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ] as number[][],
    label: "路徑拼圖 2",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ] as number[][],
    label: "路徑拼圖 3",
    centerEmoji: "🛣️",
  },
] as const;
const CONVENIENCE_ROUTE_REWARDS = [
  {
    pattern: [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ] as number[][],
    label: "轉角拼圖 1",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ] as number[][],
    label: "轉角拼圖 2",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 0],
    ] as number[][],
    label: "轉角拼圖 3",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 0, 0],
      [0, 1, 1],
      [0, 1, 0],
    ] as number[][],
    label: "轉角拼圖 4",
    centerEmoji: "🛣️",
  },
] as const;
const FIRST_STREET_REWARD_LABELS = ["巷口街道", "騎樓街道", "轉角街道"] as const;
const ARRANGE_ROUTE_LOGIC_TUTORIAL_STEPS = [
  {
    title: "安排路線教學",
    description: "從家裡出發到公司",
    buttonLabel: "下一步",
    kind: "overview",
  },
  {
    title: "安排路線教學",
    description: "從有家的拼圖開始",
    accentText: "家",
    buttonLabel: "下一步",
    kind: "start",
  },
  {
    title: "安排路線教學",
    description: "根據邊緣來銜接路徑",
    accentText: "邊緣",
    buttonLabel: "下一步",
    kind: "edge",
  },
  {
    title: "安排路線教學",
    description: "上下道路要對齊，才能連在一起",
    accentText: "道路",
    buttonLabel: "下一步",
    kind: "match",
  },
  {
    title: "安排路線教學",
    description: "寬度不一樣時，無法連在一起",
    buttonLabel: "開始",
    kind: "mismatch",
  },
];
const ARRANGE_ROUTE_TILE_TUTORIAL_STEPS = [
  {
    title: "路徑拼圖教學",
    description: "除了地點拼圖外，還有路徑拼圖",
    buttonLabel: "下一步",
    kind: "route-intro",
  },
  {
    title: "路徑拼圖教學",
    description: "可以連接路徑拼圖來將路線連起來",
    buttonLabel: "下一步",
    kind: "route-connect",
  },
];
const ARRANGE_ROUTE_TILE_TUTORIAL_REWARD_STEP = {
  title: "路徑拼圖教學",
  description: "獲得三個路徑拼圖",
  buttonLabel: "開始",
  kind: "reward",
} as const;
const ARRANGE_ROUTE_TILE_TUTORIAL_REPLAY_FINAL_STEP = {
  title: "安排路線教學",
  description: "獲得三個路徑拼圖",
  buttonLabel: "開始",
  kind: "reward",
} as const;
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_STEPS = [
  {
    title: "解鎖任務",
    description: "小貝狗會提供任務",
    buttonLabel: "下一步",
    kind: "place-mission-intro",
  },
  {
    title: "解鎖任務",
    description: "任務會是遇到小日獸的線索",
    buttonLabel: "下一步",
    kind: "place-mission-clue",
  },
  {
    title: "解鎖任務",
    description: "收到第一項任務！\n前往街道兩次",
    accentText: "前往街道兩次",
    buttonLabel: "確認",
    kind: "place-mission-first-task",
  },
] as const;
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_STEPS = [
  {
    title: "便利商店教學",
    description: "偶爾路徑拼圖會有隱藏地點出現，有機會的話，去路過吧！\n不想路過，想直接去上班，也可以。",
    accentText: "隱藏地點",
    buttonLabel: "下一步",
    kind: "convenience-hidden-place",
  },
  {
    title: "便利商店教學",
    description: "提供四個轉角拼圖",
    buttonLabel: "開始",
    kind: "convenience-reward",
  },
] as const;
const metroGuidePulse = keyframes`
  0%, 100% {
    border-color: #F0C84A;
    box-shadow: 0 0 0 2px rgba(240,200,74,0.30), 0 0 0 0 rgba(240,200,74,0.55);
    transform: translateY(0px);
  }
  50% {
    border-color: #FFE27B;
    box-shadow: 0 0 0 3px rgba(240,200,74,0.42), 0 0 0 9px rgba(240,200,74,0.16);
    transform: translateY(-1px);
  }
`;
const metroGuideBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;
const thirdArrangeUnlockFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;
const routeMismatchPulse = keyframes`
  0%, 100% {
    opacity: 0.42;
    box-shadow: 0 0 0 rgba(233, 96, 35, 0);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 8px rgba(233, 96, 35, 0.52);
  }
`;
const petTabGuidePulse = keyframes`
  0%, 100% {
    background-color: rgba(169, 131, 98, 0.16);
    box-shadow: inset 0 0 0 0 rgba(232, 116, 50, 0.25);
  }
  50% {
    background-color: rgba(169, 131, 98, 0.34);
    box-shadow: inset 0 0 0 2px rgba(232, 116, 50, 0.85);
  }
`;
const departureDiagonalBackdrop = keyframes`
  0% { transform: translate3d(-12%, -12%, 0) scale(1.08); }
  100% { transform: translate3d(10%, 10%, 0) scale(1.18); }
`;
const departureHorizontalBackdrop = keyframes`
  0% { transform: translate3d(0%, 0, 0) scale(1.08); }
  100% { transform: translate3d(-15%, 0, 0) scale(1.08); }
`;
const departureMaiStride = keyframes`
  0% { transform: translate3d(-190px, 10px, 0) scale(0.96); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate3d(190px, -4px, 0) scale(1.08); opacity: 1; }
`;
const departureCaptionRise = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(0.98); }
  18% { opacity: 1; }
  100% { opacity: 1; transform: translateY(0px) scale(1); }
`;
const departureGlowSweep = keyframes`
  0% { transform: translate3d(-120%, -8%, 0) rotate(-10deg); opacity: 0; }
  18% { opacity: 0.75; }
  100% { transform: translate3d(120%, 8%, 0) rotate(-10deg); opacity: 0; }
`;
const departureSpeedLines = keyframes`
  0% { transform: translate3d(-18%, 0, 0); opacity: 0.2; }
  50% { opacity: 0.7; }
  100% { transform: translate3d(18%, 0, 0); opacity: 0.2; }
`;
const departurePatternDrift = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-32px, 32px, 0); }
`;
const departurePulseRing = keyframes`
  0% { transform: scale(0.82); opacity: 0.15; }
  55% { opacity: 0.38; }
  100% { transform: scale(1.18); opacity: 0; }
`;
const departureLogoFloatUp = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-0.4deg); }
  18% { transform: translateY(-4px) rotate(0.2deg); }
  46% { transform: translateY(-7px) rotate(0.6deg); }
  72% { transform: translateY(-2px) rotate(-0.2deg); }
`;
const departureLogoFloatDown = keyframes`
  0%, 100% { transform: translateY(-5px) rotate(0.5deg); }
  22% { transform: translateY(-1px) rotate(-0.2deg); }
  54% { transform: translateY(3px) rotate(-0.7deg); }
  78% { transform: translateY(-3px) rotate(0.2deg); }
`;
const departureMrtPan = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-460px, 0, 0); }
`;
const departureMaiIconTilt = keyframes`
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(10deg); }
`;
const DEPARTURE_TRANSITION_DURATION_MS = 2300;
const STREET_DEPARTURE_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "street-cookie-sale",
];
const METRO_DAILY_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "metro-commute-laugh",
  "metro-backpack-hit",
  "metro-card-search",
  "metro-kid-cry",
  "metro-door-sprint",
  "metro-pet-stroller",
  "metro-milk-tea-shoes",
  "metro-cute-bag-chat",
  "metro-seat-spread",
  "metro-commute-laugh",
  "metro-seat-choice",
];
const TILE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "metro-station::111_010_111": "/images/route/rt_MRT_111_010_111.png",
  "default::010_010_010": "/images/route/rt_010_010_010.png",
};
const ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "010_010_010": "/images/route/rt_010_010_010.png",
  "010_110_000": "/images/route/rt_010_110_000.jpg",
  "010_010_111": "/images/route/rt_010_010_111.jpg",
  "000_011_010": "/images/route/rt_000_011_010.jpg",
  "000_110_010": "/images/route/rt_000_110_010.jpg",
  "010_011_000": "/images/route/rt_010_011_000.jpg",
  "100_010_001": "/images/route/rt_100_010_001.jpg",
  "100_010_010": "/images/route/rt_100_010_010.jpg",
  "111_100_100": "/images/route/rt_1111_100_100.jpg",
  "111_010_111": "/images/route/rt_111_010_111.jpg",
  "111_010_010": "/images/route/rt_1111_010_010.jpg",
};
const CONVENIENCE_STORE_FIXED_PATTERN = [
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 0],
] as number[][];

function patternToKey(pattern: number[][]) {
  return pattern
    .map((row) => row.map((value) => (value === 1 ? "1" : "0")).join(""))
    .join("_");
}

function flipPatternHorizontally(pattern: number[][]): number[][] {
  return pattern.map((row) => [...row].reverse());
}

function resolvePlaceTileImagePath(params: {
  tileId: string;
  sourceId?: string;
  pattern: number[][];
}) {
  const { tileId, sourceId, pattern } = params;
  const patternKey = patternToKey(pattern);
  const isMetroTile =
    tileId === "metro-station" ||
    tileId.startsWith("metro-station-") ||
    sourceId === "metro-station";
  if (isMetroTile) {
    return TILE_IMAGE_BY_PATTERN_KEY[`metro-station::${patternKey}`];
  }
  if (sourceId === "convenience-store" && patternKey === patternToKey(CONVENIENCE_STORE_FIXED_PATTERN)) {
    return "/images/route/rt_store_010,110,000.jpg";
  }
  const routeImagePath = resolveRouteTileImagePath(pattern);
  if (routeImagePath) return routeImagePath;
  const defaultImagePath = TILE_IMAGE_BY_PATTERN_KEY[`default::${patternKey}`];
  if (defaultImagePath) return defaultImagePath;
  return undefined;
}

function resolveRouteTileImagePath(pattern: number[][]) {
  return ROUTE_IMAGE_BY_PATTERN_KEY[patternToKey(pattern)];
}

function hasSecondTutorialRewardPatterns(
  rewardPlaceTiles: Array<{ category: "place" | "route"; pattern: number[][] }>,
) {
  const existingPatternKeys = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "route")
      .map((tile) => patternToKey(tile.pattern)),
  );
  return SECOND_TUTORIAL_ROUTE_REWARDS.every((tile) =>
    existingPatternKeys.has(patternToKey(tile.pattern)),
  );
}

function hasFirstStreetRewardPatterns(
  rewardPlaceTiles: Array<{ category: "place" | "route"; sourceId?: string; pattern: number[][] }>,
) {
  const existingPatternKeys = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "street")
      .map((tile) => patternToKey(tile.pattern)),
  );
  return FIRST_STREET_REWARD_PATTERNS.every((tile) =>
    existingPatternKeys.has(patternToKey(tile)),
  );
}

function resolvePlaceTileOverlayIconPath(sourceId?: string) {
  if (sourceId === "street") return "/images/icon/street.png";
  return undefined;
}

type DepartureMapVisual = {
  label: string;
  iconPath: string;
};

type DepartureMapLeg = {
  points: DepartureMapPoint[];
  startPercent: number;
  endPercent: number;
  destinationSourceId: DepartureMapPoint["sourceId"];
};

type DepartureUnlockCue = {
  badge: string;
  title: string;
  description: string;
};

type DepartureMapPoint = {
  key: string;
  visual: DepartureMapVisual;
  positionPercent: number;
  sourceId?: PlaceTileId | "home" | "company";
};

type DepartureRouteWaypoint = {
  sourceId: PlaceTileId;
  visual: DepartureMapVisual;
  distance: number;
};

function resolveDepartureVisualFromSource(sourceId: string): DepartureMapVisual | null {
  if (sourceId === "metro-station") return { label: "捷運", iconPath: "/images/icon/mrt.png" };
  if (sourceId === "convenience-store") return { label: "便利商店", iconPath: "/images/icon/mart.png" };
  if (sourceId === "breakfast-shop") return { label: "早餐店", iconPath: "/images/icon/mart.png" };
  if (sourceId === "street") return { label: "街道", iconPath: "/images/icon/street.png" };
  if (sourceId === "park") return { label: "公園", iconPath: "/images/icon/park.png" };
  if (sourceId === "bus-stop") return { label: "公車站", iconPath: "/images/icon/road.png" };
  return null;
}

type Connector = {
  top: number[];
  right: number[];
  bottom: number[];
  left: number[];
};

type RouteTile = {
  id: string;
  label: string;
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  overlayIconPath?: string;
};
type RoutePaletteTile = RouteTile & {
  pairIds?: [string, string];
};
type PlaceTileStackItem = {
  stackId: string;
  sourceId: string;
  label: string;
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  overlayIconPath?: string;
  totalCount: number;
  instanceIds: string[];
};
type PlaceTileCandidate = {
  id: string;
  sourceId: string;
  label: string;
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  overlayIconPath?: string;
  count: number;
};

type ArrangeTabKey = "metro" | "street" | "convenience" | "route" | "pet";
type ThirdArrangeIntroStep = "unlock" | "mai" | "beigo" | "mission";
type ArrangeRoutePromptId = "intro-depart-to-metro";
type ConvenienceStoreIntroStep = "beigo" | "mai";

const ARRANGE_TAB_ICON_PROPS: Record<
  ArrangeTabKey,
  { label: string; icon: typeof FaTrainSubway }
> = {
  metro: {
    label: "捷運",
    icon: FaTrainSubway,
  },
  street: {
    label: "街道",
    icon: FaLocationDot,
  },
  convenience: {
    label: "便利商店",
    icon: FaLocationDot,
  },
  route: {
    label: "路徑",
    icon: FaTrainSubway,
  },
  pet: {
    label: "小日獸",
    icon: FaPaw,
  },
};

const NAOTARO_DIG_TILE_BASE_ID = "naotaro-dig";
const NAOTARO_DUG_BORDER_COLOR = "#F08A24";
const FROG_BRIDGE_TILE_BASE_ID = "frog-bridge";
const FROG_BRIDGE_BORDER_COLOR = "#4E9A8A";
const GOAT_FLIP_TILE_BASE_ID = "goat-flip";
const GOAT_FLIP_BORDER_COLOR = "#D37B49";

function isNaotaroDugTileId(tileId: string) {
  return tileId.startsWith(`${NAOTARO_DIG_TILE_BASE_ID}-`);
}
function isFrogBridgeTileId(tileId: string) {
  return tileId.startsWith(`${FROG_BRIDGE_TILE_BASE_ID}-`);
}
function isGoatFlipTileId(tileId: string) {
  return tileId.startsWith(`${GOAT_FLIP_TILE_BASE_ID}-`);
}

function isSecondTutorialRouteLabel(label?: string) {
  return Boolean(label?.startsWith("路徑拼圖 "));
}

const BASE_PLACE_TILE_STOCKS = [
  {
    sourceId: "metro-station",
    label: "捷運拼圖 1",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
    ] as number[][],
    centerEmoji: "🚋",
    imagePath: TILE_IMAGE_BY_PATTERN_KEY["metro-station::111_010_111"],
    count: 1,
  },
  {
    sourceId: "metro-station",
    label: "捷運拼圖 2",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ] as number[][],
    centerEmoji: "🚋",
    imagePath: "/images/route/rt_MRT_111_010_010.jpg",
    count: 1,
  },
  {
    sourceId: "metro-station",
    label: "捷運拼圖 3",
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ] as number[][],
    centerEmoji: "🚋",
    imagePath: "/images/route/rt_MRT_010_010_111.jpg",
    count: 1,
  },
] as const;
const PLACE_REDEEM_COST = 10;

// Can be adjusted per level: which 3x3 edge slots are valid exits/entries.
// Home starts with full-width exit (0~3 semantics mapped to [0,1,2]).
const START_CONNECTOR: Connector = {
  top: [],
  right: [],
  bottom: [0, 1, 2],
  left: [],
};
const NARROW_START_CONNECTOR: Connector = {
  top: [],
  right: [],
  bottom: [1],
  left: [],
};
const END_CONNECTOR: Connector = { top: [1], right: [], bottom: [], left: [] };

const NEIGHBOR_MAP: Record<
  keyof Connector,
  { dr: number; dc: number; opposite: keyof Connector }
> = {
  top: { dr: -1, dc: 0, opposite: "bottom" },
  right: { dr: 0, dc: 1, opposite: "left" },
  bottom: { dr: 1, dc: 0, opposite: "top" },
  left: { dr: 0, dc: -1, opposite: "right" },
};

function getEdgeSlots(pattern: number[][]): Connector {
  const top: number[] = [];
  const right: number[] = [];
  const bottom: number[] = [];
  const left: number[] = [];

  for (let i = 0; i < 3; i += 1) {
    if (pattern[0][i] === 1) top.push(i);
    if (pattern[2][i] === 1) bottom.push(i);
  }

  // Side exits use middle slot only, to avoid corner cells being treated as side connectors.
  if (pattern[1][0] === 1) left.push(1);
  if (pattern[1][2] === 1) right.push(1);

  return { top, right, bottom, left };
}

function isExactMatch(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, index) => value === sortedB[index]);
}

function ConnectorHints({ connector }: { connector: Connector }) {
  const slotPos = ["16%", "50%", "84%"];
  return (
    <>
      {connector.top.map((slot) => (
        <Box
          key={`top-${slot}`}
          position="absolute"
          top="4px"
          left={slotPos[slot]}
          transform="translateX(-50%)"
          w="8px"
          h="8px"
          borderRadius="999px"
          bgColor="#2AAEE0"
        />
      ))}
      {connector.bottom.map((slot) => (
        <Box
          key={`bottom-${slot}`}
          position="absolute"
          bottom="4px"
          left={slotPos[slot]}
          transform="translateX(-50%)"
          w="8px"
          h="8px"
          borderRadius="999px"
          bgColor="#2AAEE0"
        />
      ))}
      {connector.left.map((slot) => (
        <Box
          key={`left-${slot}`}
          position="absolute"
          left="4px"
          top={slotPos[slot]}
          transform="translateY(-50%)"
          w="8px"
          h="8px"
          borderRadius="999px"
          bgColor="#2AAEE0"
        />
      ))}
      {connector.right.map((slot) => (
        <Box
          key={`right-${slot}`}
          position="absolute"
          right="4px"
          top={slotPos[slot]}
          transform="translateY(-50%)"
          w="8px"
          h="8px"
          borderRadius="999px"
          bgColor="#2AAEE0"
        />
      ))}
    </>
  );
}

function EndpointVisual({
  mode,
  startImagePath,
}: {
  mode: "start" | "end";
  startImagePath?: string;
}) {
  const imagePath =
    mode === "start"
      ? startImagePath ?? "/images/route/start_end/start_home_111.jpg"
      : "/images/route/start_end/end_company_010.jpg";
  return (
    <Flex
      w="92%"
      h="92%"
      borderRadius="8px"
      overflow="hidden"
      border="1px solid rgba(130,106,83,0.36)"
      bgColor="rgba(255,255,255,0.55)"
    >
      <img
        src={imagePath}
        alt={mode === "start" ? "起點拼圖" : "終點拼圖"}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Flex>
  );
}

function FixedBoardTileVisual({
  imagePath,
  alt,
}: {
  imagePath: string;
  alt: string;
}) {
  return (
    <Flex
      w="92%"
      h="92%"
      borderRadius="8px"
      overflow="hidden"
      border="2px solid #8E7A62"
      bgColor="#D5E8B7"
    >
      <img
        src={imagePath}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Flex>
  );
}

function GridPattern({
  pattern,
  centerEmoji,
  imagePath,
  overlayIconPath,
}: {
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  overlayIconPath?: string;
}) {
  if (imagePath || overlayIconPath) {
    return (
      <Flex
        w="100%"
        h="100%"
        borderRadius="8px"
        overflow="hidden"
        bgColor="rgba(255,255,255,0.55)"
        position="relative"
      >
        {imagePath ? (
          <img
            src={imagePath}
            alt="拼圖圖塊"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : null}
        {overlayIconPath ? (
          <Box
            position="absolute"
            right="8%"
            bottom="8%"
            w="34%"
            h="34%"
          >
            <img
              src={overlayIconPath}
              alt="地點圖示"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </Box>
        ) : null}
      </Flex>
    );
  }

  const columnCount = pattern[0]?.length ?? 3;
  const flat = pattern.flat();
  return (
    <Grid
      templateColumns={`repeat(${columnCount}, 1fr)`}
      templateRows="repeat(3, 1fr)"
      w="80%"
      h="80%"
      gap="1px"
    >
      {flat.map((point, index) => {
        const isCenterCell = index === 4;
        return (
          <Box
            key={index}
            bgColor={point ? "#A38765" : "rgba(255,255,255,0.36)"}
            borderRadius="2px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {centerEmoji && isCenterCell ? (
              <Text
                fontSize="10px"
                lineHeight="1"
                maxW="100%"
                maxH="100%"
                textAlign="center"
              >
                {centerEmoji}
              </Text>
            ) : null}
          </Box>
        );
      })}
    </Grid>
  );
}

type TutorialStep =
  | (typeof ARRANGE_ROUTE_LOGIC_TUTORIAL_STEPS)[number]
  | (typeof ARRANGE_ROUTE_TILE_TUTORIAL_STEPS)[number]
  | typeof ARRANGE_ROUTE_TILE_TUTORIAL_REWARD_STEP
  | typeof ARRANGE_ROUTE_TILE_TUTORIAL_REPLAY_FINAL_STEP
  | (typeof ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_STEPS)[number]
  | (typeof ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_STEPS)[number];

function TutorialDescription({
  text,
  accentText,
}: {
  text: string;
  accentText?: string;
}) {
  if (!accentText || !text.includes(accentText)) {
    return (
      <Text
        color="#171717"
        fontSize="15px"
        lineHeight="1.6"
        textAlign="center"
        fontWeight="700"
        whiteSpace="pre-line"
      >
        {text}
      </Text>
    );
  }

  const [before, after] = text.split(accentText);
  return (
    <Text
      color="#171717"
      fontSize="15px"
      lineHeight="1.6"
      textAlign="center"
      fontWeight="700"
      whiteSpace="pre-line"
    >
      {before}
      <Text as="span" color="#E89A3C">
        {accentText}
      </Text>
      {after}
    </Text>
  );
}

function TutorialTileImage({
  src,
  alt,
  w = "92px",
  h = "130px",
}: {
  src: string;
  alt: string;
  w?: string;
  h?: string;
}) {
  return (
    <Flex
      w={w}
      h={h}
      borderRadius="10px"
      overflow="hidden"
      bgColor="#F3EBDD"
      alignItems="center"
      justifyContent="center"
    >
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Flex>
  );
}

function TutorialIllustration({ kind }: { kind: TutorialStep["kind"] }) {
  const topTile = "/images/route/start_end/start_home_111.jpg";
  const bottomTile = "/images/route/start_end/end_company_010.jpg";
  const goodRoute = "/images/route/rt_1111_010_010.jpg";
  const wrongRoute = "/images/route/rt_100_010_001.jpg";
  const routeB = "/images/route/rt_010_010_010.png";
  const routeTileIntro = "/images/route/rt_1111_010_010.jpg";
  const routeTileConnect = "/images/route/rt_010_010_010.png";
  const secondTutorialRewardImages = SECOND_TUTORIAL_ROUTE_REWARDS.map((tile, index) => ({
    src: resolveRouteTileImagePath(tile.pattern),
    alt: `路徑拼圖${index + 1}`,
    key: `${tile.label}-${patternToKey(tile.pattern)}`,
  })).filter((tile): tile is { src: string; alt: string; key: string } => Boolean(tile.src));

  const stackLayout = (topSrc: string, bottomSrc: string, marker?: ReactNode) => (
    <Flex direction="column" alignItems="center" position="relative" py="6px">
      {marker ? (
        <Flex position="absolute" top="-8px" left="50%" transform="translateX(-50%)" zIndex={1}>
          {marker}
        </Flex>
      ) : null}
      <TutorialTileImage src={topSrc} alt="上方拼圖" w="92px" h="64px" />
      <Box
        w="108px"
        h="0"
        borderTop="2px dashed #FFB25D"
        my="6px"
      />
      <TutorialTileImage src={bottomSrc} alt="下方拼圖" w="92px" h="64px" />
    </Flex>
  );

  switch (kind) {
    case "overview":
      return (
        <Flex direction="column" alignItems="center" justifyContent="center" gap="14px" minH="190px">
          <Flex alignItems="center" gap="20px" color="#C49268">
            <img
              src="/images/icon/house.png"
              alt="家"
              style={{ width: "56px", height: "56px", objectFit: "contain", display: "block" }}
            />
            <Text fontSize="32px" fontWeight="500">→</Text>
            <img
              src="/images/icon/company.png"
              alt="公司"
              style={{ width: "56px", height: "56px", objectFit: "contain", display: "block" }}
            />
          </Flex>
        </Flex>
      );
    case "start":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          <TutorialTileImage src={topTile} alt="從家的拼圖開始" w="96px" h="96px" />
        </Flex>
      );
    case "edge":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(topTile, goodRoute)}
        </Flex>
      );
    case "match":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(
            goodRoute,
            routeB,
            <Text color="#2AB9D7" fontSize="30px" fontWeight="700">○</Text>,
          )}
        </Flex>
      );
    case "mismatch":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(
            goodRoute,
            wrongRoute,
            <Text color="#FF4E88" fontSize="28px" fontWeight="700">×</Text>,
          )}
        </Flex>
      );
    case "reward":
      return (
        <Flex alignItems="center" justifyContent="center" gap="10px" minH="190px">
          {secondTutorialRewardImages.map((tile) => (
            <TutorialTileImage key={tile.key} src={tile.src} alt={tile.alt} w="78px" h="78px" />
          ))}
        </Flex>
      );
    case "route-intro":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          <TutorialTileImage src={routeTileIntro} alt="路徑拼圖" w="96px" h="96px" />
        </Flex>
      );
    case "route-connect":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          <TutorialTileImage src={routeTileConnect} alt="連接路徑拼圖" w="96px" h="96px" />
        </Flex>
      );
    case "place-mission-intro":
      return (
        <Flex direction="column" alignItems="center" justifyContent="center" gap="14px" minH="190px">
          <img
            src="/images/beigo/Beigo_Spirt.png"
            alt="小貝狗"
            style={{ width: "84px", height: "84px", objectFit: "contain", display: "block" }}
          />
        </Flex>
      );
    case "place-mission-clue":
      return (
        <Flex direction="column" alignItems="center" justifyContent="center" gap="14px" minH="190px">
          <Text color="#B1845E" fontSize="56px" lineHeight="1">📝</Text>
        </Flex>
      );
    case "place-mission-first-task":
      return (
        <Flex direction="column" alignItems="center" justifyContent="center" gap="14px" minH="190px">
          <Flex alignItems="center" gap="16px">
            <Text fontSize="42px" lineHeight="1">💡</Text>
            <Text color="#C49268" fontSize="30px" fontWeight="700">→</Text>
            <Text fontSize="42px" lineHeight="1">💡</Text>
          </Flex>
        </Flex>
      );
    case "convenience-hidden-place":
      return (
        <Flex direction="column" alignItems="center" justifyContent="center" gap="14px" minH="190px">
          <TutorialTileImage
            src="/images/route/rt_store_010,110,000.jpg"
            alt="便利商店隱藏地點"
            w="112px"
            h="112px"
          />
        </Flex>
      );
    case "convenience-reward":
      return (
        <Flex alignItems="center" justifyContent="center" gap="10px" minH="190px" wrap="wrap">
          {CONVENIENCE_ROUTE_REWARDS.map((tile) => {
            const src = resolveRouteTileImagePath(tile.pattern);
            if (!src) return null;
            return (
              <TutorialTileImage
                key={`${tile.label}-${patternToKey(tile.pattern)}`}
                src={src}
                alt={tile.label}
                w="78px"
                h="78px"
              />
            );
          })}
        </Flex>
      );
    default:
      return null;
  }
}

function ArrangeTabBadge({
  activeTab,
}: {
  activeTab: ArrangeTabKey;
}) {
  return (
    <Flex
      w="60px"
      h="34px"
      borderRadius="999px"
      bgColor="#FCF1A7"
      border="2px solid #B88B64"
      color="#7C5E47"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      {activeTab === "route" ? (
        <img
          src="/images/icon/mrt.png"
          alt="捷運"
          style={{ width: "24px", height: "24px", objectFit: "contain", display: "block" }}
        />
      ) : (
        (() => {
          const Icon = ARRANGE_TAB_ICON_PROPS[activeTab].icon;
          return <Icon size={20} />;
        })()
      )}
    </Flex>
  );
}

function SimpleTrayTabButton({
  tabKey,
  isActive,
  isAvailable = true,
  onClick,
}: {
  tabKey: "metro" | "street" | "convenience" | "route" | "park";
  isActive: boolean;
  isAvailable?: boolean;
  onClick: () => void;
}) {
  const imagePath =
    tabKey === "metro"
      ? "/images/icon/mrt.png"
      : tabKey === "street"
        ? "/images/icon/street.png"
        : tabKey === "convenience"
          ? "/images/icon/mart.png"
          : tabKey === "park"
            ? "/images/icon/park.png"
        : "/images/icon/road.png";
  const label =
    tabKey === "metro"
      ? "捷運"
      : tabKey === "street"
        ? "街道"
        : tabKey === "convenience"
          ? "商店"
          : tabKey === "park"
            ? "公園"
        : "路徑";
  const alt =
    tabKey === "metro"
      ? "捷運拼圖"
      : tabKey === "street"
        ? "街道拼圖"
        : tabKey === "convenience"
          ? "便利商店拼圖"
          : tabKey === "park"
            ? "公園拼圖"
        : "路徑拼圖";
  return (
    <Flex
      as="button"
      w="100%"
      h="42px"
      borderRadius="5px"
      bgColor={isActive ? "rgba(255,255,255,0.94)" : "transparent"}
      alignItems="center"
      justifyContent="flex-start"
      gap="8px"
      px="7px"
      onClick={() => {
        if (!isAvailable) return;
        onClick();
      }}
      cursor={isAvailable ? "pointer" : "not-allowed"}
      opacity={isAvailable ? 1 : 0.46}
    >
      <img
        src={imagePath}
        alt={alt}
        style={{ width: "24px", height: "24px", objectFit: "contain", display: "block", flexShrink: 0 }}
      />
      <Text
        color="#BD9A7E"
        fontSize="14px"
        fontWeight={isActive ? "800" : "700"}
        lineHeight="1"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
  );
}

type ArrangeRouteViewProps = {
  arrangeRouteAttempt: number;
  isStoryTutorialArrange?: boolean;
  workShiftCount?: number;
  playerStatus: PlayerStatus;
  rewardPlaceTiles: RewardPlaceTile[];
  onPlayerStatusChange: Dispatch<SetStateAction<PlayerStatus>>;
  offworkRewardClaimCount?: number;
  /** 是否曾在安排路線中出發且經過街道（起點變化需與第 4 次一併達成） */
  hasPassedThroughStreet?: boolean;
  /** 是否已解鎖便利商店地點 */
  hasUnlockedConvenienceStore?: boolean;
  /** 是否已完整完成便利商店青蛙事件，之後盤面會擴成便利商店版 */
  hasCompletedStreetForgotLunchFrogEvent?: boolean;
  hasSeenSunbeastFirstReveal?: boolean;
  unlockedDiaryEntryIds?: DiaryEntryId[];
  placeUnlockSnapshot: ReturnType<typeof getPlaceUnlockSnapshot>;
  /** 當進度被寫入後呼叫（例如標記「經過街道」後），讓上層可重新載入進度 */
  onProgressSaved?: () => void;
};

export function ArrangeRouteView({
  arrangeRouteAttempt,
  isStoryTutorialArrange = false,
  workShiftCount = 0,
  playerStatus,
  rewardPlaceTiles,
  onPlayerStatusChange,
  offworkRewardClaimCount = 0,
  hasPassedThroughStreet = false,
  hasUnlockedConvenienceStore = false,
  hasCompletedStreetForgotLunchFrogEvent = false,
  hasSeenSunbeastFirstReveal = false,
  unlockedDiaryEntryIds = [],
  placeUnlockSnapshot,
  onProgressSaved,
}: ArrangeRouteViewProps) {
  const router = useRouter();
  const isIntroArrange = arrangeRouteAttempt === 1;
  const isSecondArrange = arrangeRouteAttempt === 2;
  const isThirdArrange = arrangeRouteAttempt === 3;
  const useSimpleArrangeUi = true;
  const [placedRoutes, setPlacedRoutes] = useState<Record<number, string>>({});
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ArrangeTabKey>("metro");
  const [dropError, setDropError] = useState("");
  const [isDropErrorVisible, setIsDropErrorVisible] = useState(false);
  const [dropMessageType, setDropMessageType] = useState<"error" | "hint">("error");
  const [activeEventId, setActiveEventId] = useState<GameEventId | null>(null);
  const [isWorkTransitionOpen, setIsWorkTransitionOpen] = useState(false);
  const [isWorkMinigameOpen, setIsWorkMinigameOpen] = useState(false);
  const [activeDepartureTransition, setActiveDepartureTransition] = useState<{
    nonce: number;
    destinationLabel: string;
    unlockCue?: DepartureUnlockCue;
    mapPoints: DepartureMapPoint[];
    mapStartPercent: number;
    mapEndPercent: number;
  } | null>(null);
  const [departureTravelProgress, setDepartureTravelProgress] = useState(0);
  const [routeSlideIndex, setRouteSlideIndex] = useState(0);
  const [routeDragOffsetPx, setRouteDragOffsetPx] = useState(0);
  const [isRouteDragging, setIsRouteDragging] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [activeArrangeRoutePromptId, setActiveArrangeRoutePromptId] =
    useState<ArrangeRoutePromptId | null>(null);
  const [isMapOverlayOpen, setIsMapOverlayOpen] = useState(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isSunbeastDexOpen, setIsSunbeastDexOpen] = useState(false);
  const [sunbeastDiaryMode, setSunbeastDiaryMode] = useState<DiaryOverlayMode>("sunbeast");
  const [sunbeastDiaryRevealEntryId, setSunbeastDiaryRevealEntryId] = useState<DiaryEntryId>("bai-entry-1");
  const [isStreetUnlockOverlayOpen, setIsStreetUnlockOverlayOpen] = useState(false);
  const [isConvenienceStoreIntroOpen, setIsConvenienceStoreIntroOpen] = useState(false);
  const [convenienceStoreIntroStep, setConvenienceStoreIntroStep] =
    useState<ConvenienceStoreIntroStep>("beigo");
  const [thirdArrangeIntroStep, setThirdArrangeIntroStep] = useState<ThirdArrangeIntroStep>("unlock");
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isStoryRouteTutorialFlow, setIsStoryRouteTutorialFlow] = useState(false);
  const [hasMetroGuideGrabbed, setHasMetroGuideGrabbed] = useState(false);
  const [isNaotaroDigMode, setIsNaotaroDigMode] = useState(false);
  const [isFrogBridgeMode, setIsFrogBridgeMode] = useState(false);
  const [isGoatFlipMode, setIsGoatFlipMode] = useState(false);
  const [hasUsedNaotaroDigInThisArrange, setHasUsedNaotaroDigInThisArrange] = useState(false);
  const [hasUsedFrogBridgeInThisArrange, setHasUsedFrogBridgeInThisArrange] = useState(false);
  const [hasUsedGoatFlipInThisArrange, setHasUsedGoatFlipInThisArrange] = useState(false);
  const [naotaroDugTiles, setNaotaroDugTiles] = useState<Record<string, RouteTile>>({});
  const [frogBridgeTiles, setFrogBridgeTiles] = useState<Record<string, RouteTile>>({});
  const [goatFlippedTiles, setGoatFlippedTiles] = useState<Record<string, RouteTile>>({});
  const [consumedPlaceTileInstanceIds, setConsumedPlaceTileInstanceIds] = useState<string[]>([]);
  const [isPetTabGuideActive, setIsPetTabGuideActive] = useState(false);
  const [unlockFeedbackItems, setUnlockFeedbackItems] = useState<UnlockFeedbackItem[]>([]);
  const [activePlaceUnlockIntroId, setActivePlaceUnlockIntroId] = useState<PlaceTileId | null>(null);
  const hasShownPetTabGuideToastRef = useRef(false);
  const unlockFeedbackTimerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const placeUnlockIntroNextActionRef = useRef<(() => void) | null>(null);
  const sunbeastDiaryNextActionRef = useRef<(() => void) | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeTouchStartRef = useRef<{
    x: number;
    y: number;
    fromTile: boolean;
    isHorizontalDrag: boolean;
  } | null>(null);
  const routeTrackRef = useRef<HTMLDivElement | null>(null);
  const departureTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departureTransitionNextActionRef = useRef<(() => void) | null>(null);
  const departureTransitionNonceRef = useRef(0);
  const departureTransitionFrameRef = useRef<number | null>(null);
  const departureTransitionDestinationSourceRef = useRef<DepartureMapPoint["sourceId"] | null>(null);
  const departureLastReachedSourceRef = useRef<DepartureMapPoint["sourceId"]>("home");
  const departureRouteMapPointsRef = useRef<DepartureMapPoint[] | null>(null);

  const isConvenienceStoreBoard = hasCompletedStreetForgotLunchFrogEvent;
  const shouldShowStreetMission =
    hasSeenSunbeastFirstReveal && !hasUnlockedConvenienceStore;
  const isExpandedBoard = !isConvenienceStoreBoard && arrangeRouteAttempt >= 5 && hasPassedThroughStreet;
  const boardCols = isIntroArrange
    ? INTRO_BOARD_COLS
    : isConvenienceStoreBoard
      ? CONVENIENCE_BOARD_COLS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_BOARD_COLS
    : isExpandedBoard
      ? EXPANDED_BOARD_COLS
      : DEFAULT_BOARD_COLS;
  const boardRows = isIntroArrange
    ? INTRO_BOARD_ROWS
    : isConvenienceStoreBoard
      ? CONVENIENCE_BOARD_ROWS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_BOARD_ROWS
    : isExpandedBoard
      ? EXPANDED_BOARD_ROWS
      : DEFAULT_BOARD_ROWS;
  const boardCellCount = boardCols * boardRows;
  const indexToPos = (index: number) => ({ r: Math.floor(index / boardCols), c: index % boardCols });
  const posToIndex = (r: number, c: number) => r * boardCols + c;
  const startPos = isIntroArrange
    ? INTRO_START_POS
    : isConvenienceStoreBoard
      ? CONVENIENCE_START_POS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_START_POS
    : isExpandedBoard
      ? EXPANDED_START_POS
      : offworkRewardClaimCount >= 3 && hasPassedThroughStreet
        ? SHIFTED_START_POS
        : DEFAULT_START_POS;
  const endPos = isIntroArrange
    ? INTRO_END_POS
    : isConvenienceStoreBoard
      ? CONVENIENCE_END_POS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_END_POS
    : isExpandedBoard
        ? EXPANDED_END_POS
        : DEFAULT_END_POS;
  const startCell = posToIndex(startPos.r, startPos.c);
  const endCell = posToIndex(endPos.r, endPos.c);
  const blockedCells = useMemo(
    () =>
      isConvenienceStoreBoard
        ? new Set([
            posToIndex(0, 1),
            posToIndex(3, 1),
          ])
        : new Set<number>(),
    [isConvenienceStoreBoard],
  );
  const fixedConvenienceStoreCell = isConvenienceStoreBoard
    ? posToIndex(CONVENIENCE_STORE_POS.r, CONVENIENCE_STORE_POS.c)
    : null;
  const startConnector = isConvenienceStoreBoard ? NARROW_START_CONNECTOR : START_CONNECTOR;
  const endConnector = END_CONNECTOR;

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

  const redeemPlaceTile = (params: {
    tileId: PlaceTileId;
    label: string;
    patterns: TilePattern3x3[];
    centerEmoji: string;
  }) => {
    const current = loadPlayerProgress();
    if (current.status.savings < PLACE_REDEEM_COST) {
      showDropToast("小日幣不足，還不能兌換這塊拼圖", {
        type: "error",
        hideMs: 2200,
        clearMs: 2600,
      });
      return;
    }

    const randomPattern = params.patterns[Math.floor(Math.random() * params.patterns.length)];
    const rewardTile: RewardPlaceTile = {
      instanceId: `${params.tileId}-redeem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: params.tileId,
      category: "place",
      label: params.label,
      centerEmoji: params.centerEmoji,
      pattern: randomPattern,
    };

    savePlayerProgress({
      ...current,
      ownedPlaceTileIds: current.ownedPlaceTileIds.includes(params.tileId)
        ? current.ownedPlaceTileIds
        : [...current.ownedPlaceTileIds, params.tileId],
      status: {
        ...current.status,
        savings: Math.max(0, current.status.savings - PLACE_REDEEM_COST),
      },
      rewardPlaceTiles: [...current.rewardPlaceTiles, rewardTile],
    });
    onProgressSaved?.();
    pushUnlockFeedback([
      {
        id: `redeem-${params.tileId}-${Date.now()}`,
        badge: "🧩",
        title: `${params.label}兌換成功`,
        description: `消耗 ${PLACE_REDEEM_COST} 小日幣，獲得 1 塊${params.label}拼圖。`,
        tone: "place",
      },
    ]);
  };

  const handleRedeemMetroTile = () => {
    redeemPlaceTile({
      tileId: "metro-station",
      label: "捷運",
      patterns: BASE_PLACE_TILE_STOCKS.map((tile) => tile.pattern as TilePattern3x3),
      centerEmoji: "🚋",
    });
  };

  const handleRedeemStreetTile = () => {
    if (!hasSeenSunbeastFirstReveal) {
      showDropToast("要先收集第一隻小日獸，才能兌換街道拼圖", {
        type: "hint",
        hideMs: 2400,
        clearMs: 2800,
      });
      return;
    }
    redeemPlaceTile({
      tileId: "street",
      label: "街道",
      patterns: FIRST_STREET_REWARD_PATTERNS,
      centerEmoji: "💡",
    });
  };

  const finishEventFlow = (nextAction?: () => void) => {
    const continueAction = nextAction ?? startDepartureRouteFromCurrentLocation;
    const syncedProgress = syncDerivedPlaceUnlocks();
    onProgressSaved?.();
    setActiveEventId(null);
    if (syncedProgress.pendingPlaceUnlockIntroIds.length > 0) {
      placeUnlockIntroNextActionRef.current = continueAction;
      setActivePlaceUnlockIntroId(syncedProgress.pendingPlaceUnlockIntroIds[0]);
      return;
    }
    continueAction();
  };

  const handlePlaceUnlockIntroConfirm = () => {
    if (!activePlaceUnlockIntroId) return;
    const nextProgress = claimPlaceUnlockIntroReward(activePlaceUnlockIntroId);
    onProgressSaved?.();
    if (nextProgress.pendingPlaceUnlockIntroIds.length > 0) {
      setActivePlaceUnlockIntroId(nextProgress.pendingPlaceUnlockIntroIds[0]);
      return;
    }
    setActivePlaceUnlockIntroId(null);
    const nextAction = placeUnlockIntroNextActionRef.current;
    placeUnlockIntroNextActionRef.current = null;
    nextAction?.();
  };

  const openSunbeastDiaryBeforeContinue = (
    nextAction: () => void,
    options?: { mode?: DiaryOverlayMode; revealEntryId?: DiaryEntryId },
  ) => {
    setSunbeastDiaryMode(options?.mode ?? "sunbeast");
    setSunbeastDiaryRevealEntryId(options?.revealEntryId ?? "bai-entry-1");
    sunbeastDiaryNextActionRef.current = nextAction;
    setIsSunbeastDexOpen(true);
  };

  const handleSunbeastDiaryClose = () => {
    setIsSunbeastDexOpen(false);
    const nextAction = sunbeastDiaryNextActionRef.current;
    sunbeastDiaryNextActionRef.current = null;
    nextAction?.();
  };

  const rewardRouteTiles = useMemo(
    () =>
      rewardPlaceTiles
        .filter((tile) => tile.category === "route")
        .map(
        (tile): RouteTile => ({
          id: tile.instanceId,
          label: tile.label,
          pattern: tile.pattern,
          centerEmoji: tile.centerEmoji,
          imagePath: resolveRouteTileImagePath(tile.pattern),
        }),
      ),
    [rewardPlaceTiles],
  );
  const secondTutorialRouteTiles = useMemo<RouteTile[]>(
    () =>
      SECOND_TUTORIAL_ROUTE_REWARDS.reduce<RouteTile[]>((acc, tile, index) => {
        const patternKey = patternToKey(tile.pattern);
        const existingRewardTile = rewardRouteTiles.find(
          (rewardTile) => patternToKey(rewardTile.pattern) === patternKey,
        );
        if (!existingRewardTile) return acc;

        acc.push({
          id: existingRewardTile.id,
          label: existingRewardTile.label ?? tile.label,
          pattern: tile.pattern,
          centerEmoji: existingRewardTile.centerEmoji,
          imagePath:
            existingRewardTile.imagePath ?? resolveRouteTileImagePath(tile.pattern),
        } satisfies RouteTile);
        return acc;
      }, []),
    [rewardRouteTiles],
  );
  const rewardPlaceCategoryTiles = useMemo<PlaceTileCandidate[]>(
    () =>
      rewardPlaceTiles
        .filter((tile) => tile.category === "place")
        .map((tile) => ({
          id: tile.instanceId,
          sourceId: tile.sourceId,
          label: tile.label,
          pattern: tile.pattern,
          centerEmoji: tile.centerEmoji,
          imagePath: resolvePlaceTileImagePath({
            tileId: tile.instanceId,
            sourceId: tile.sourceId,
            pattern: tile.pattern,
          }),
          overlayIconPath: resolvePlaceTileOverlayIconPath(tile.sourceId),
          count: 1,
        })),
    [rewardPlaceTiles],
  );
  const placeTileStacks = useMemo<PlaceTileStackItem[]>(() => {
    const candidates: PlaceTileCandidate[] = [
      ...BASE_PLACE_TILE_STOCKS.map((tile) => ({
        id: `base::${tile.sourceId}`,
        sourceId: tile.sourceId,
        label: tile.label,
        pattern: tile.pattern as number[][],
        centerEmoji: tile.centerEmoji,
        imagePath: tile.imagePath,
        count: tile.count,
      })),
      ...rewardPlaceCategoryTiles,
    ];

    const merged = new Map<string, Omit<PlaceTileStackItem, "instanceIds">>();
    candidates.forEach((item) => {
      const stackId = `${item.sourceId}::${patternToKey(item.pattern)}`;
      const existing = merged.get(stackId);
      if (!existing) {
        merged.set(stackId, {
          stackId,
          sourceId: item.sourceId,
          label: item.label,
          pattern: item.pattern,
          centerEmoji: item.centerEmoji,
          imagePath: item.imagePath,
          overlayIconPath: item.overlayIconPath,
          totalCount: item.count,
        });
        return;
      }
      existing.totalCount += item.count;
    });

    return Array.from(merged.values()).map((item) => ({
      ...item,
      instanceIds: Array.from(
        { length: item.totalCount },
        (_, index) => `${item.sourceId}::${item.stackId}::${index + 1}`,
      ),
    }));
  }, [rewardPlaceCategoryTiles]);
  const allPlaceTileInstances = useMemo<RouteTile[]>(
    () =>
      placeTileStacks.flatMap((stack) =>
        stack.instanceIds.map((instanceId) => ({
          id: instanceId,
          label: stack.label,
          pattern: stack.pattern,
          centerEmoji: stack.centerEmoji,
          imagePath: stack.imagePath,
          overlayIconPath: stack.overlayIconPath,
        })),
      ),
    [placeTileStacks],
  );
  const routeTiles = useMemo(
    () =>
      isSecondArrange
        ? secondTutorialRouteTiles
        : rewardRouteTiles,
    [isSecondArrange, rewardRouteTiles, secondTutorialRouteTiles],
  );
  const paletteRouteTiles = useMemo<RoutePaletteTile[]>(() => {
    const consumed = new Set<string>();
    const result: RoutePaletteTile[] = [];

    routeTiles.forEach((tile) => {
      if (consumed.has(tile.id)) return;
      if (tile.label !== "自組路徑A") {
        result.push(tile);
        return;
      }

      const partner = routeTiles.find(
        (candidate) => !consumed.has(candidate.id) && candidate.id !== tile.id && candidate.label === "自組路徑B",
      );
      if (!partner) {
        result.push(tile);
        return;
      }

      consumed.add(tile.id);
      consumed.add(partner.id);
      result.push({
        id: `pair::${tile.id}::${partner.id}`,
        label: "自組路徑2x1",
        pattern: tile.pattern.map((row, rowIndex) => [...row, ...partner.pattern[rowIndex]]),
        pairIds: [tile.id, partner.id],
      });
    });

    return result;
  }, [routeTiles]);
  const tileMap = useMemo(
    () =>
      Object.fromEntries(
        [
          ...routeTiles,
          ...allPlaceTileInstances,
          ...Object.values(naotaroDugTiles),
          ...Object.values(frogBridgeTiles),
          ...Object.values(goatFlippedTiles),
        ].map((item) => [item.id, item]),
      ) as Record<string, RouteTile>,
    [allPlaceTileInstances, frogBridgeTiles, goatFlippedTiles, naotaroDugTiles, routeTiles],
  );

  const tileEdgeMap = useMemo(
    () =>
      Object.fromEntries(
        [
          ...routeTiles,
          ...allPlaceTileInstances,
          ...Object.values(naotaroDugTiles),
          ...Object.values(frogBridgeTiles),
          ...Object.values(goatFlippedTiles),
        ].map((tile) => [
          tile.id,
          getEdgeSlots(tile.pattern),
        ]),
      ) as Record<string, Connector>,
    [allPlaceTileInstances, frogBridgeTiles, goatFlippedTiles, naotaroDugTiles, routeTiles],
  );
  const placedTileIds = useMemo(() => new Set(Object.values(placedRoutes)), [placedRoutes]);
  const consumedPlaceTileIdSet = useMemo(
    () => new Set(consumedPlaceTileInstanceIds),
    [consumedPlaceTileInstanceIds],
  );
  const availablePlaceTileStacks = useMemo(
    () =>
      placeTileStacks
        .map((stack) => ({
          ...stack,
          remainingCount: stack.instanceIds.filter(
            (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
          ).length,
        }))
        .filter((stack) => stack.remainingCount > 0),
    [consumedPlaceTileIdSet, placeTileStacks, placedTileIds],
  );
  const routeSlides = useMemo(() => {
    const MAX_COLS_PER_ROW = 5;
    const MAX_ROWS_PER_PAGE = 2;
    const slides: RoutePaletteTile[][] = [];
    let currentSlide: RoutePaletteTile[] = [];
    let currentRow = 0;
    let remainingCols = MAX_COLS_PER_ROW;

    const flushSlide = () => {
      if (currentSlide.length > 0) slides.push(currentSlide);
      currentSlide = [];
      currentRow = 0;
      remainingCols = MAX_COLS_PER_ROW;
    };

    paletteRouteTiles.forEach((tile) => {
      const span = tile.pairIds ? 2 : 1;

      if (span > remainingCols) {
        currentRow += 1;
        remainingCols = MAX_COLS_PER_ROW;
      }

      if (currentRow >= MAX_ROWS_PER_PAGE) {
        flushSlide();
      }

      currentSlide.push(tile);
      remainingCols -= span;

      if (remainingCols === 0) {
        currentRow += 1;
        remainingCols = MAX_COLS_PER_ROW;
      }
    });

    if (currentSlide.length > 0) slides.push(currentSlide);
    return slides.length > 0 ? slides : [[]];
  }, [paletteRouteTiles]);

  useEffect(() => {
    setRouteSlideIndex((prev) => Math.min(prev, routeSlides.length - 1));
  }, [routeSlides.length]);

  useEffect(() => {
    return () => {
      if (departureTransitionTimerRef.current) {
        clearTimeout(departureTransitionTimerRef.current);
      }
      if (departureTransitionFrameRef.current !== null) {
        cancelAnimationFrame(departureTransitionFrameRef.current);
      }
    };
  }, []);

  function finishDepartureTransition() {
    if (departureTransitionTimerRef.current) {
      clearTimeout(departureTransitionTimerRef.current);
      departureTransitionTimerRef.current = null;
    }
    if (departureTransitionFrameRef.current !== null) {
      cancelAnimationFrame(departureTransitionFrameRef.current);
      departureTransitionFrameRef.current = null;
    }
    setDepartureTravelProgress(0);
    setActiveDepartureTransition(null);
    if (departureTransitionDestinationSourceRef.current) {
      departureLastReachedSourceRef.current = departureTransitionDestinationSourceRef.current;
      departureTransitionDestinationSourceRef.current = null;
    }
    const action = departureTransitionNextActionRef.current;
    departureTransitionNextActionRef.current = null;
    action?.();
  }

  function startDepartureTransition(
    destinationLabel: string,
    nextAction?: () => void,
    mapLeg?: DepartureMapLeg,
    unlockCue?: DepartureUnlockCue,
  ) {
    if (departureTransitionTimerRef.current) {
      clearTimeout(departureTransitionTimerRef.current);
    }
    if (departureTransitionFrameRef.current !== null) {
      cancelAnimationFrame(departureTransitionFrameRef.current);
      departureTransitionFrameRef.current = null;
    }
    departureTransitionNextActionRef.current = nextAction ?? null;
    departureTransitionNonceRef.current += 1;
    const resolvedMapLeg = mapLeg ?? resolveDepartureMapLeg(destinationLabel);
    departureTransitionDestinationSourceRef.current = resolvedMapLeg.destinationSourceId;
    setDepartureTravelProgress(0);
    setActiveDepartureTransition({
      nonce: departureTransitionNonceRef.current,
      destinationLabel,
      unlockCue,
      mapPoints: resolvedMapLeg.points,
      mapStartPercent: resolvedMapLeg.startPercent,
      mapEndPercent: resolvedMapLeg.endPercent,
    });
    const startedAt = performance.now();
    const tick = (now: number) => {
      const totalProgress = Math.min(1, (now - startedAt) / DEPARTURE_TRANSITION_DURATION_MS);
      setDepartureTravelProgress(totalProgress);
      if (totalProgress >= 1) {
        finishDepartureTransition();
        return;
      }
      departureTransitionFrameRef.current = requestAnimationFrame(tick);
    };
    departureTransitionFrameRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (isIntroArrange) {
      setActiveTab("metro");
    }
  }, [isIntroArrange]);

  useEffect(() => {
    return () => {
      Object.values(unlockFeedbackTimerRefs.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const progress = loadPlayerProgress();
    setConsumedPlaceTileInstanceIds(progress.consumedPlaceTileInstanceIds ?? []);
  }, [offworkRewardClaimCount, rewardPlaceTiles.length]);

  useEffect(() => {
    const allPlaceIds = new Set(allPlaceTileInstances.map((tile) => tile.id));
    const sourcePrefixes = new Set(placeTileStacks.map((stack) => `${stack.sourceId}::`));
    setPlacedRoutes((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(next).forEach(([cellIndex, tileId]) => {
        const isLegacyOrStackPlaceTile =
          tileId === "metro-station" ||
          tileId.startsWith("metro-station-") ||
          Array.from(sourcePrefixes).some((prefix) => tileId.startsWith(prefix)) ||
          tileId.startsWith("base::") ||
          tileId.startsWith("reward::");
        const isConsumed = consumedPlaceTileIdSet.has(tileId);
        if (isLegacyOrStackPlaceTile && (!allPlaceIds.has(tileId) || isConsumed)) {
          delete next[Number(cellIndex)];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [allPlaceTileInstances, consumedPlaceTileIdSet, placeTileStacks]);

  useEffect(() => {
    setPlacedRoutes((prev) => {
      const next: Record<number, string> = {};
      let changed = false;
      Object.entries(prev).forEach(([key, tileId]) => {
        const index = Number(key);
        if (!Number.isFinite(index) || index < 0 || index >= boardCellCount) {
          changed = true;
          return;
        }
        if (index === startCell || index === endCell) {
          changed = true;
          return;
        }
        next[index] = tileId;
      });
      return changed ? next : prev;
    });
  }, [boardCellCount, startCell, endCell]);

  const setDragPayload = (
    event: DragEvent,
    payload: { routeId: string; sourceCell?: number },
  ) => {
    event.dataTransfer.setData("text/route-payload", JSON.stringify(payload));
    event.dataTransfer.setData("text/route-id", payload.routeId);
  };

  const readDragPayload = (event: DragEvent) => {
    const raw = event.dataTransfer.getData("text/route-payload");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { routeId?: string; sourceCell?: number };
        if (parsed.routeId) return { routeId: parsed.routeId, sourceCell: parsed.sourceCell };
      } catch {}
    }
    const routeId = event.dataTransfer.getData("text/route-id");
    if (routeId) return { routeId };
    return null;
  };

  const isPairPaletteId = (routeId: string) => routeId.startsWith("pair::");
  const readPairRouteIds = (routeId: string): [string, string] | null => {
    if (!isPairPaletteId(routeId)) return null;
    const parts = routeId.split("::");
    if (parts.length !== 3) return null;
    return [parts[1], parts[2]];
  };
  const buildPairLeftMarker = (leftId: string, rightId: string) =>
    `pair-left::${leftId}::${rightId}`;
  const buildPairRightMarker = (leftId: string, rightId: string) =>
    `pair-right::${leftId}::${rightId}`;
  const parsePairMarker = (value: string): { side: "left" | "right"; leftId: string; rightId: string } | null => {
    const parts = value.split("::");
    if (parts.length !== 3) return null;
    if (parts[0] !== "pair-left" && parts[0] !== "pair-right") return null;
    return {
      side: parts[0] === "pair-left" ? "left" : "right",
      leftId: parts[1],
      rightId: parts[2],
    };
  };
  const removePlacedAtCell = (map: Record<number, string>, cellIndex: number) => {
    const value = map[cellIndex];
    if (!value) return;
    const pair = parsePairMarker(value);
    if (!pair) {
      delete map[cellIndex];
      return;
    }
    const { r, c } = indexToPos(cellIndex);
    const siblingIndex =
      pair.side === "left"
        ? posToIndex(r, c + 1)
        : posToIndex(r, c - 1);
    delete map[cellIndex];
    delete map[siblingIndex];
  };

  const getConnectorAtCellFromMap = (
    index: number,
    routeMap: Record<number, string>,
  ): Connector | null => {
    if (index === startCell) return startConnector;
    if (index === endCell) return endConnector;
    if (fixedConvenienceStoreCell !== null && index === fixedConvenienceStoreCell) {
      return getEdgeSlots(CONVENIENCE_STORE_FIXED_PATTERN);
    }
    const tileId = routeMap[index];
    if (!tileId) return null;
    const pair = parsePairMarker(tileId);
    if (pair) {
      return pair.side === "left"
        ? tileEdgeMap[pair.leftId] ?? null
        : tileEdgeMap[pair.rightId] ?? null;
    }
    return tileEdgeMap[tileId] ?? null;
  };

  const isMapRouteConnected = (routeMap: Record<number, string>) => {
    const visited = new Set<number>();
    const queue = [startCell];
    visited.add(startCell);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === endCell) return true;
      const currentConnector = getConnectorAtCellFromMap(current, routeMap);
      if (!currentConnector) continue;

      const { r, c } = indexToPos(current);
      (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
        const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;
        const neighborIndex = posToIndex(nr, nc);
        const neighborConnector = getConnectorAtCellFromMap(neighborIndex, routeMap);
        if (!neighborConnector) return;
        if (!isExactMatch(currentConnector[dir], neighborConnector[opposite])) return;
        if (visited.has(neighborIndex)) return;
        visited.add(neighborIndex);
        queue.push(neighborIndex);
      });
    }

    return false;
  };

  const isCellReachableFromStart = (
    routeMap: Record<number, string>,
    targetCell: number,
  ) => {
    const visited = new Set<number>();
    const queue = [startCell];
    visited.add(startCell);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetCell) return true;
      const currentConnector = getConnectorAtCellFromMap(current, routeMap);
      if (!currentConnector) continue;

      const { r, c } = indexToPos(current);
      (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
        const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;
        const neighborIndex = posToIndex(nr, nc);
        const neighborConnector = getConnectorAtCellFromMap(neighborIndex, routeMap);
        if (!neighborConnector) return;
        if (!isExactMatch(currentConnector[dir], neighborConnector[opposite])) return;
        if (visited.has(neighborIndex)) return;
        visited.add(neighborIndex);
        queue.push(neighborIndex);
      });
    }

    return false;
  };

  const getReachableDistanceFromStart = (
    routeMap: Record<number, string>,
    targetCell: number,
  ) => {
    const visited = new Set<number>();
    const queue: Array<{ index: number; distance: number }> = [{ index: startCell, distance: 0 }];
    visited.add(startCell);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.index === targetCell) return current.distance;
      const currentConnector = getConnectorAtCellFromMap(current.index, routeMap);
      if (!currentConnector) continue;

      const { r, c } = indexToPos(current.index);
      (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
        const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;
        const neighborIndex = posToIndex(nr, nc);
        const neighborConnector = getConnectorAtCellFromMap(neighborIndex, routeMap);
        if (!neighborConnector) return;
        if (!isExactMatch(currentConnector[dir], neighborConnector[opposite])) return;
        if (visited.has(neighborIndex)) return;
        visited.add(neighborIndex);
        queue.push({ index: neighborIndex, distance: current.distance + 1 });
      });
    }

    return null;
  };

  const canPlaceRouteInMap = (
    routeMap: Record<number, string>,
    cellIndex: number,
    routeId: string,
  ) => {
    if (blockedCells.has(cellIndex) || (fixedConvenienceStoreCell !== null && cellIndex === fixedConvenienceStoreCell)) {
      return false;
    }
    const nextMap = { ...routeMap, [cellIndex]: routeId };
    const currentConnector = getConnectorAtCellFromMap(cellIndex, nextMap);
    if (!currentConnector) return false;

    let hasValidNeighborConnection = false;
    let hasMismatch = false;
    const { r, c } = indexToPos(cellIndex);

    (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
      const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;

      const neighborIndex = posToIndex(nr, nc);
      const neighborConnector = getConnectorAtCellFromMap(neighborIndex, nextMap);
      if (!neighborConnector) return;

      const selfSide = currentConnector[dir];
      const neighborSide = neighborConnector[opposite];
      const exactMatch = isExactMatch(selfSide, neighborSide);
      const eitherHasExit = selfSide.length > 0 || neighborSide.length > 0;

      if (eitherHasExit && !exactMatch) {
        hasMismatch = true;
        return;
      }

      if (exactMatch && selfSide.length > 0) {
        hasValidNeighborConnection = true;
      }
    });

    return !hasMismatch && hasValidNeighborConnection;
  };
  const canPlaceRoute = (
    cellIndex: number,
    routeId: string,
    sourceCell?: number,
  ) => {
    const baseMap = { ...placedRoutes };
    if (typeof sourceCell === "number") removePlacedAtCell(baseMap, sourceCell);
    return canPlaceRouteInMap(baseMap, cellIndex, routeId);
  };

  const showDropToast = (
    message: string,
    options?: { type?: "error" | "hint"; hideMs?: number; clearMs?: number },
  ) => {
    const { type = "hint", hideMs = 3600, clearMs = 4000 } = options ?? {};
    setDropMessageType(type);
    setDropError(message);
    setIsDropErrorVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsDropErrorVisible(false);
    }, hideMs);
    clearTimerRef.current = setTimeout(() => {
      setDropError("");
      if (type === "hint") setDropMessageType("error");
    }, clearMs);
  };

  const dismissDropToast = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setIsDropErrorVisible(false);
    setDropError("");
    setDropMessageType("error");
  };

  const markBoardInteraction = () => {};

  const getNeighborMatchCount = (routeMap: Record<number, string>, cellIndex: number, connector: Connector) => {
    let matches = 0;
    const { r, c } = indexToPos(cellIndex);
    (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
      const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;
      const neighborIndex = posToIndex(nr, nc);
      const neighborConnector = getConnectorAtCellFromMap(neighborIndex, routeMap);
      if (!neighborConnector) return;
      if (isExactMatch(connector[dir], neighborConnector[opposite]) && connector[dir].length > 0) {
        matches += 1;
      }
    });
    return matches;
  };

  const hasBothEndpointAnchorsReady = (routeMap: Record<number, string>) => {
    const startPos = indexToPos(startCell);
    const endPos = indexToPos(endCell);
    const afterStartIndex = posToIndex(startPos.r + 1, startPos.c);
    const beforeEndIndex = posToIndex(endPos.r - 1, endPos.c);
    const afterStartConnector = getConnectorAtCellFromMap(afterStartIndex, routeMap);
    const beforeEndConnector = getConnectorAtCellFromMap(beforeEndIndex, routeMap);

    return Boolean(
      afterStartConnector &&
      beforeEndConnector &&
      isExactMatch(startConnector.bottom, afterStartConnector.top) &&
      isExactMatch(beforeEndConnector.bottom, endConnector.top),
    );
  };

  const getEndpointMismatchCells = (routeMap: Record<number, string>) => {
    const startPos = indexToPos(startCell);
    const endPos = indexToPos(endCell);
    const afterStartIndex = posToIndex(startPos.r + 1, startPos.c);
    const beforeEndIndex = posToIndex(endPos.r - 1, endPos.c);

    const mismatchCells: number[] = [];

    const afterStartConnector = getConnectorAtCellFromMap(afterStartIndex, routeMap);
    if (
      afterStartConnector &&
      !isExactMatch(startConnector.bottom, afterStartConnector.top)
    ) {
      mismatchCells.push(afterStartIndex);
    }

    const beforeEndConnector = getConnectorAtCellFromMap(beforeEndIndex, routeMap);
    if (
      beforeEndConnector &&
      !isExactMatch(beforeEndConnector.bottom, endConnector.top)
    ) {
      mismatchCells.push(beforeEndIndex);
    }

    return mismatchCells;
  };

  const handleDropToCell = (
    cellIndex: number,
    routeId: string,
    sourceCell?: number,
  ) => {
    if (
      metroFirstStepActive &&
      routeId !== "metro-station" &&
      !routeId.startsWith("metro-station-") &&
      !routeId.startsWith("metro-station::")
    ) {
      setDropError("教學第一步：先放捷運站");
      setIsDropErrorVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsDropErrorVisible(false);
      }, 900);
      clearTimerRef.current = setTimeout(() => {
        setDropError("");
      }, 1300);
      return;
    }
    const pairIds = readPairRouteIds(routeId);
    if (pairIds) {
      const [leftId, rightId] = pairIds;
      const { r, c } = indexToPos(cellIndex);
      if (c >= boardCols - 1) return;
      const rightCellIndex = posToIndex(r, c + 1);
      if (rightCellIndex === startCell || rightCellIndex === endCell) return;

      const previousMap = { ...placedRoutes };
      const nextMap = { ...previousMap };
      if (typeof sourceCell === "number") removePlacedAtCell(nextMap, sourceCell);
      nextMap[cellIndex] = buildPairLeftMarker(leftId, rightId);
      nextMap[rightCellIndex] = buildPairRightMarker(leftId, rightId);
      const bothEndpointAnchorsReady = hasBothEndpointAnchorsReady(nextMap);

      const leftValid = canPlaceRouteInMap(nextMap, cellIndex, leftId);
      const rightValid = canPlaceRouteInMap(nextMap, rightCellIndex, rightId);
      if (!leftValid || !rightValid) {
        if (bothEndpointAnchorsReady) {
          const mismatchCells = getEndpointMismatchCells(nextMap);
          const rollbackMap =
            mismatchCells.length > 0
              ? (() => {
                  const next = { ...nextMap };
                  mismatchCells.forEach((cell) => {
                    delete next[cell];
                  });
                  return next;
                })()
              : previousMap;

          setPlacedRoutes(nextMap);
          setDropError("路線銜接不起來");
          setIsDropErrorVisible(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
          if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
          rollbackTimerRef.current = setTimeout(() => {
            setPlacedRoutes(rollbackMap);
          }, 900);
          hideTimerRef.current = setTimeout(() => {
            setIsDropErrorVisible(false);
          }, 900);
          clearTimerRef.current = setTimeout(() => {
            setDropError("");
          }, 1300);
        } else {
          setPlacedRoutes(nextMap);
        }
        return;
      }

      const endpointMismatchCellsAfterPair = bothEndpointAnchorsReady
        ? getEndpointMismatchCells(nextMap)
        : [];
      if (endpointMismatchCellsAfterPair.length > 0) {
        const rollbackMap = { ...nextMap };
        endpointMismatchCellsAfterPair.forEach((cell) => {
          delete rollbackMap[cell];
        });
        setPlacedRoutes(nextMap);
        setDropError("路線銜接不起來");
        setIsDropErrorVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
        rollbackTimerRef.current = setTimeout(() => {
          setPlacedRoutes(rollbackMap);
        }, 900);
        hideTimerRef.current = setTimeout(() => {
          setIsDropErrorVisible(false);
        }, 900);
        clearTimerRef.current = setTimeout(() => {
          setDropError("");
        }, 1300);
        return;
      }

      setDropError("");
      setIsDropErrorVisible(false);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      setPlacedRoutes(nextMap);
      if (bothEndpointAnchorsReady && !isMapRouteConnected(nextMap)) {
        setDropMessageType("hint");
        setDropError("路線還沒接通，請再補一塊");
        setIsDropErrorVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setIsDropErrorVisible(false);
        }, 900);
        clearTimerRef.current = setTimeout(() => {
          setDropError("");
          setDropMessageType("error");
        }, 1300);
      }
      return;
    }

    if (cellIndex === startCell || cellIndex === endCell) return;
    if (sourceCell === cellIndex) return;
    const previousMap = { ...placedRoutes };
    const nextMap = { ...previousMap };
    if (typeof sourceCell === "number") removePlacedAtCell(nextMap, sourceCell);
    nextMap[cellIndex] = routeId;
    const bothEndpointAnchorsReady = hasBothEndpointAnchorsReady(nextMap);

    if (!canPlaceRoute(cellIndex, routeId, sourceCell)) {
      const mismatchCells = bothEndpointAnchorsReady ? getEndpointMismatchCells(nextMap) : [];
      const shouldWarnAndRollback = mismatchCells.length > 0;

      if (shouldWarnAndRollback) {
        const rollbackMap =
          mismatchCells.length > 0
            ? (() => {
                const next = { ...nextMap };
                mismatchCells.forEach((cell) => {
                  delete next[cell];
                });
                return next;
              })()
            : previousMap;

        // Show invalid placement first, then rollback for learning feedback.
        setPlacedRoutes(nextMap);
        setDropError("路線銜接不起來");
        setIsDropErrorVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
        rollbackTimerRef.current = setTimeout(() => {
          setPlacedRoutes(rollbackMap);
        }, 900);
        hideTimerRef.current = setTimeout(() => {
          setIsDropErrorVisible(false);
        }, 900);
        clearTimerRef.current = setTimeout(() => {
          setDropError("");
        }, 1300);
      } else {
        // Early exploration phase: allow temporary non-perfect placement.
        setPlacedRoutes(nextMap);
      }
      return;
    }

    const endpointMismatchCellsAfterSingle = bothEndpointAnchorsReady
      ? getEndpointMismatchCells(nextMap)
      : [];
    if (endpointMismatchCellsAfterSingle.length > 0) {
      const rollbackMap = { ...nextMap };
      endpointMismatchCellsAfterSingle.forEach((cell) => {
        delete rollbackMap[cell];
      });
      setPlacedRoutes(nextMap);
      setDropError("路線銜接不起來");
      setIsDropErrorVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      rollbackTimerRef.current = setTimeout(() => {
        setPlacedRoutes(rollbackMap);
      }, 900);
      hideTimerRef.current = setTimeout(() => {
        setIsDropErrorVisible(false);
      }, 900);
      clearTimerRef.current = setTimeout(() => {
        setDropError("");
      }, 1300);
      return;
    }

    setDropError("");
    setIsDropErrorVisible(false);
    if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
    setPlacedRoutes(nextMap);
    if (bothEndpointAnchorsReady && !isMapRouteConnected(nextMap)) {
      setDropMessageType("hint");
      setDropError("路線還沒接通，請再補一塊");
      setIsDropErrorVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setIsDropErrorVisible(false);
      }, 900);
      clearTimerRef.current = setTimeout(() => {
        setDropError("");
        setDropMessageType("error");
      }, 1300);
    }
  };

  useEffect(() => {
    const handleCheatTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ eventId?: GameEventId }>;
      const eventId = customEvent.detail?.eventId;
      if (!eventId) return;
      setActiveEventId(eventId);
    };
    const handleWorkCheatTrigger = () => {
      setActiveEventId(null);
      setIsWorkMinigameOpen(false);
      setIsWorkTransitionOpen(true);
    };
    const handleWorkMinigameCheatTrigger = () => {
      setActiveEventId(null);
      setIsWorkTransitionOpen(false);
      setIsWorkMinigameOpen(true);
    };

    window.addEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
    window.addEventListener(GAME_WORK_CHEAT_TRIGGER, handleWorkCheatTrigger);
    window.addEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      window.removeEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
      window.removeEventListener(GAME_WORK_CHEAT_TRIGGER, handleWorkCheatTrigger);
      window.removeEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);
    };
  }, []);

  useEffect(() => {
    const progress = loadPlayerProgress();
    const logicTutorialSeen =
      window.localStorage.getItem(ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY) === "1";
    const legacyTileTutorialSeen =
      window.localStorage.getItem(ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY) === "1";
    const hasSecondTutorialRewardsInProgress = hasSecondTutorialRewardPatterns(
      progress.rewardPlaceTiles,
    );
    const tileTutorialSeen =
      (progress.hasSeenArrangeRouteTileTutorial || legacyTileTutorialSeen) &&
      hasSecondTutorialRewardsInProgress;
    const placeMissionTutorialSeen =
      window.localStorage.getItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY) === "1";
    const convenienceTutorialSeen =
      window.localStorage.getItem(ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY) === "1";
    if (isConvenienceStoreBoard) {
      setIsStoryRouteTutorialFlow(false);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      if (convenienceTutorialSeen) {
        setIsConvenienceStoreIntroOpen(false);
        setIsTutorialModalOpen(false);
        return;
      }
      setConvenienceStoreIntroStep("beigo");
      setIsMissionModalOpen(false);
      setIsStreetUnlockOverlayOpen(false);
      setIsConvenienceStoreIntroOpen(true);
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(false);
      return;
    }
    if (shouldShowStreetMission) {
      if (placeMissionTutorialSeen) {
        setIsStreetUnlockOverlayOpen(false);
      } else {
        if (!hasFirstStreetRewardPatterns(progress.rewardPlaceTiles)) {
          savePlayerProgress({
            ...progress,
            ownedPlaceTileIds: Array.from(new Set([...progress.ownedPlaceTileIds, "street"])),
            rewardPlaceTiles: [
              ...progress.rewardPlaceTiles,
              ...FIRST_STREET_REWARD_PATTERNS.filter(
                (pattern) =>
                  !progress.rewardPlaceTiles.some(
                    (tile) =>
                      tile.category === "place" &&
                      tile.sourceId === "street" &&
                      patternToKey(tile.pattern) === patternToKey(pattern),
                  ),
              ).map((pattern, index) => ({
                instanceId: `street-intro-${patternToKey(pattern)}-${index}`,
                sourceId: "street" as const,
                category: "place" as const,
                label: FIRST_STREET_REWARD_LABELS[index] ?? `街道 ${index + 1}`,
                centerEmoji: "💡",
                pattern,
              })),
            ],
          });
          onProgressSaved?.();
        }
        setThirdArrangeIntroStep("unlock");
        setIsMissionModalOpen(false);
        setIsStreetUnlockOverlayOpen(true);
        setIsTutorialModalOpen(false);
        return;
      }
    }
    if (isIntroArrange) {
      setIsStoryRouteTutorialFlow(isStoryTutorialArrange);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      if (logicTutorialSeen && !isStoryTutorialArrange) {
        setIsTutorialModalOpen(false);
        return;
      }
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(true);
      return;
    }
    if (isSecondArrange) {
      setIsStoryRouteTutorialFlow(false);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      if (tileTutorialSeen) {
        setIsTutorialModalOpen(false);
        return;
      }
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(true);
      return;
    }
    if (isThirdArrange) {
      setIsStoryRouteTutorialFlow(false);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      if (placeMissionTutorialSeen) {
        setIsTutorialModalOpen(false);
        return;
      }
      setThirdArrangeIntroStep("unlock");
      setIsMissionModalOpen(false);
      setIsStreetUnlockOverlayOpen(true);
      setIsTutorialModalOpen(false);
      return;
    }
    if (isStoryTutorialArrange) {
      setIsStoryRouteTutorialFlow(true);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(true);
      return;
    }
    setIsStoryRouteTutorialFlow(false);
    setActiveArrangeRoutePromptId(null);
    if (logicTutorialSeen) return;
    setTutorialStepIndex(0);
    setIsTutorialModalOpen(true);
  }, [
    isConvenienceStoreBoard,
    isIntroArrange,
    isSecondArrange,
    isStoryTutorialArrange,
    isThirdArrange,
    onProgressSaved,
    shouldShowStreetMission,
  ]);

  const isRouteConnected = useMemo(
    () => isMapRouteConnected(placedRoutes),
    [placedRoutes],
  );
  const mismatchHintMap = useMemo(() => {
    const hintMap = new Map<number, Set<"right" | "bottom">>();
    const addHint = (cellIndex: number, dir: "right" | "bottom") => {
      const existing = hintMap.get(cellIndex) ?? new Set<"right" | "bottom">();
      existing.add(dir);
      hintMap.set(cellIndex, existing);
    };

    for (let r = 0; r < boardRows; r += 1) {
      for (let c = 0; c < boardCols; c += 1) {
        const index = posToIndex(r, c);
        const currentConnector = getConnectorAtCellFromMap(index, placedRoutes);
        if (!currentConnector) continue;

        if (c < boardCols - 1) {
          const rightIndex = posToIndex(r, c + 1);
          const rightConnector = getConnectorAtCellFromMap(rightIndex, placedRoutes);
          if (rightConnector) {
            const selfSide = currentConnector.right;
            const neighborSide = rightConnector.left;
            const eitherHasExit = selfSide.length > 0 || neighborSide.length > 0;
            if (eitherHasExit && !isExactMatch(selfSide, neighborSide)) {
              addHint(index, "right");
            }
          }
        }

        if (r < boardRows - 1) {
          const bottomIndex = posToIndex(r + 1, c);
          const bottomConnector = getConnectorAtCellFromMap(bottomIndex, placedRoutes);
          if (bottomConnector) {
            const selfSide = currentConnector.bottom;
            const neighborSide = bottomConnector.top;
            const eitherHasExit = selfSide.length > 0 || neighborSide.length > 0;
            if (eitherHasExit && !isExactMatch(selfSide, neighborSide)) {
              addHint(index, "bottom");
            }
          }
        }
      }
    }

    return hintMap;
  }, [boardCols, boardRows, placedRoutes]);

  const placedCount = Object.keys(placedRoutes).length;
  const hasMetroStationPlaced = Object.values(placedRoutes).some(
    (tileId) =>
      tileId === "metro-station" ||
      tileId.startsWith("metro-station-") ||
      tileId.startsWith("metro-station::"),
  );
  const hasBreakfastShopPlaced = Object.values(placedRoutes).some(
    (tileId) =>
      tileId === "breakfast-shop" ||
      tileId.startsWith("breakfast-shop-") ||
      tileId.startsWith("breakfast-shop::"),
  );
  const convenienceStorePlaceTileIds = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "convenience-store")
      .map((tile) => tile.instanceId),
  );
  const hasConvenienceStorePlaced = Object.values(placedRoutes).some((tileId) =>
    tileId === "convenience-store" ||
    tileId.startsWith("convenience-store-") ||
    tileId.startsWith("convenience-store::") ||
    convenienceStorePlaceTileIds.has(tileId),
  ) || (
    fixedConvenienceStoreCell !== null &&
    isCellReachableFromStart(placedRoutes, fixedConvenienceStoreCell)
  );
  const hasParkPlaced = Object.values(placedRoutes).some(
    (tileId) => tileId === "park" || tileId.startsWith("park-") || tileId.startsWith("park::"),
  );
  const busStopPlaceTileIds = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "bus-stop")
      .map((tile) => tile.instanceId),
  );
  const hasBusStopPlaced = Object.values(placedRoutes).some((tileId) =>
    tileId === "bus-stop" ||
    tileId.startsWith("bus-stop::") ||
    tileId.startsWith("bus-stop-") ||
    busStopPlaceTileIds.has(tileId),
  );
  const streetPlaceTileIds = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "street")
      .map((tile) => tile.instanceId),
  );
  const hasStreetPlaced = Object.values(placedRoutes).some((tileId) =>
    tileId === "street" ||
    tileId.startsWith("street::") ||
    tileId.startsWith("street-") ||
    streetPlaceTileIds.has(tileId),
  );
  const streetReachDistances = Object.entries(placedRoutes).reduce<number[]>((acc, [key, tileId]) => {
    const isStreetTile =
      tileId === "street" ||
      tileId.startsWith("street::") ||
      tileId.startsWith("street-") ||
      streetPlaceTileIds.has(tileId);
    if (!isStreetTile) return acc;
    const distance = getReachableDistanceFromStart(placedRoutes, Number(key));
    if (distance !== null) acc.push(distance);
    return acc;
  }, []);
  const earliestStreetReachDistance =
    streetReachDistances.length > 0 ? Math.min(...streetReachDistances) : null;
  const convenienceStoreReachDistance =
    fixedConvenienceStoreCell !== null
      ? getReachableDistanceFromStart(placedRoutes, fixedConvenienceStoreCell)
      : Object.entries(placedRoutes).reduce<number | null>((closest, [key, tileId]) => {
          const isConvenienceTile =
            tileId === "convenience-store" ||
            tileId.startsWith("convenience-store-") ||
            tileId.startsWith("convenience-store::") ||
            convenienceStorePlaceTileIds.has(tileId);
          if (!isConvenienceTile) return closest;
          const distance = getReachableDistanceFromStart(placedRoutes, Number(key));
          if (distance === null) return closest;
          if (closest === null) return distance;
          return Math.min(closest, distance);
        }, null);
  const hasOrderedStreetThenConvenience =
    earliestStreetReachDistance !== null &&
    convenienceStoreReachDistance !== null &&
    earliestStreetReachDistance < convenienceStoreReachDistance;

  function resolvePlacedTileSourceId(tileId: string): PlaceTileId | null {
    if (tileId === "metro-station" || tileId.startsWith("metro-station-") || tileId.startsWith("metro-station::")) {
      return "metro-station";
    }
    if (tileId === "breakfast-shop" || tileId.startsWith("breakfast-shop-") || tileId.startsWith("breakfast-shop::")) {
      return "breakfast-shop";
    }
    if (tileId === "convenience-store" || tileId.startsWith("convenience-store-") || tileId.startsWith("convenience-store::")) {
      return "convenience-store";
    }
    if (tileId === "street" || tileId.startsWith("street-") || tileId.startsWith("street::")) {
      return "street";
    }
    if (tileId === "park" || tileId.startsWith("park-") || tileId.startsWith("park::")) {
      return "park";
    }
    if (tileId === "bus-stop" || tileId.startsWith("bus-stop-") || tileId.startsWith("bus-stop::")) {
      return "bus-stop";
    }
    return rewardPlaceTiles.find((tile) => tile.instanceId === tileId)?.sourceId ?? null;
  }

  function resolveDepartureMapLeg(
    destinationLabel: string,
    startSourceId: DepartureMapPoint["sourceId"] = "home",
  ): DepartureMapLeg {
    const destinationSourceId = (() => {
      if (destinationLabel.includes("捷運")) return "metro-station";
      if (destinationLabel.includes("便利商店")) return "convenience-store";
      if (destinationLabel.includes("早餐")) return "breakfast-shop";
      if (destinationLabel.includes("街道")) return "street";
      if (destinationLabel.includes("公園")) return "park";
      if (destinationLabel.includes("公車")) return "bus-stop";
      return "company";
    })();
    return resolveDepartureMapLegToSource(destinationSourceId, startSourceId);
  }

  function resolveDepartureMapLegToSource(
    destinationSourceId: DepartureMapPoint["sourceId"],
    startSourceId: DepartureMapPoint["sourceId"] = "home",
  ): DepartureMapLeg {
    const points = departureRouteMapPointsRef.current ?? buildDepartureMapPoints();
    const destinationPoint =
      points.find((point) => point.sourceId === destinationSourceId) ??
      points[points.length - 1];
    const companyPoint = points[points.length - 1];
    const requestedStartPoint = points.find((point) => point.sourceId === startSourceId);
    const fallbackStartPoint = points.length > 2 ? points[points.length - 2] : points[0];
    const isGoingToCompany = destinationPoint.sourceId === "company";

    return {
      points,
      startPercent: isGoingToCompany
        ? (requestedStartPoint ?? fallbackStartPoint).positionPercent
        : points[0].positionPercent,
      endPercent: isGoingToCompany ? companyPoint.positionPercent : destinationPoint.positionPercent,
      destinationSourceId: destinationPoint.sourceId,
    };
  }

  function buildDepartureMapPoints(): DepartureMapPoint[] {
    const homeVisual = { label: "家", iconPath: "/images/icon/house.png" };
    const companyVisual = { label: "公司", iconPath: "/images/icon/company.png" };
    const waypoints = getDepartureRouteWaypoints();
    const rawPoints: Array<{
      key: string;
      visual: DepartureMapVisual;
      sourceId: DepartureMapPoint["sourceId"];
    }> = [
      { key: "home", visual: homeVisual, sourceId: "home" },
      ...waypoints.map((waypoint) => ({
        key: waypoint.sourceId,
        visual: waypoint.visual,
        sourceId: waypoint.sourceId,
      })),
      { key: "company", visual: companyVisual, sourceId: "company" },
    ];
    const stepCount = Math.max(1, rawPoints.length - 1);
    return rawPoints.map((point, index) => ({
      ...point,
      positionPercent: 9 + (82 * index) / stepCount,
    }));
  }

  function getDepartureRouteWaypoints(): DepartureRouteWaypoint[] {
    const waypoints = Object.entries(placedRoutes)
      .map(([cellIndex, tileId]) => {
        const sourceId = resolvePlacedTileSourceId(tileId);
        const visual = sourceId ? resolveDepartureVisualFromSource(sourceId) : null;
        if (!sourceId || !visual) return null;
        const distance = getReachableDistanceFromStart(placedRoutes, Number(cellIndex));
        if (distance === null) return null;
        return { sourceId, visual, distance };
      })
      .filter((waypoint): waypoint is { sourceId: PlaceTileId; visual: DepartureMapVisual; distance: number } =>
        Boolean(waypoint),
      )
      .sort((a, b) => a.distance - b.distance);

    if (fixedConvenienceStoreCell !== null && isCellReachableFromStart(placedRoutes, fixedConvenienceStoreCell)) {
      const distance = getReachableDistanceFromStart(placedRoutes, fixedConvenienceStoreCell);
      if (distance !== null) {
        waypoints.push({
          sourceId: "convenience-store",
          visual: { label: "便利商店", iconPath: "/images/icon/mart.png" },
          distance,
        });
        waypoints.sort((a, b) => a.distance - b.distance);
      }
    }

    const seenSourceIds = new Set<PlaceTileId>();
    const uniqueWaypoints = waypoints.filter((waypoint) => {
      if (seenSourceIds.has(waypoint.sourceId)) return false;
      seenSourceIds.add(waypoint.sourceId);
      return true;
    });
    const hasNonMetroWaypoint = uniqueWaypoints.some((waypoint) => waypoint.sourceId !== "metro-station");
    return hasNonMetroWaypoint
      ? uniqueWaypoints.filter((waypoint) => waypoint.sourceId !== "metro-station")
      : uniqueWaypoints;
  }

  function startDepartureRouteToWork() {
    startDepartureTransition(
      "前往公司",
      () => {
        setIsWorkTransitionOpen(true);
      },
      resolveDepartureMapLeg("前往公司", departureLastReachedSourceRef.current),
    );
  }

  function startDepartureRouteFromCurrentLocation() {
    const points = departureRouteMapPointsRef.current ?? buildDepartureMapPoints();
    const currentIndex = points.findIndex((point) => point.sourceId === departureLastReachedSourceRef.current);
    const nextWaypoint = points
      .slice(Math.max(0, currentIndex + 1))
      .find((point) => point.sourceId && point.sourceId !== "home" && point.sourceId !== "company");

    if (!nextWaypoint?.sourceId) {
      startDepartureRouteToWork();
      return;
    }
    const nextSourceId = nextWaypoint.sourceId;

    startDepartureTransition(
      `前往${nextWaypoint.visual.label}`,
      () => {
        departureLastReachedSourceRef.current = nextSourceId;
        startDepartureRouteFromCurrentLocation();
      },
      resolveDepartureMapLegToSource(nextSourceId, departureLastReachedSourceRef.current),
    );
  }

  const hasSecondTutorialRouteRewards =
    secondTutorialRouteTiles.length >= SECOND_TUTORIAL_ROUTE_REWARDS.length;
  const tutorialSteps = useMemo(
    () => {
      if (isIntroArrange) {
        return ARRANGE_ROUTE_LOGIC_TUTORIAL_STEPS;
      }
      if (isConvenienceStoreBoard) {
        return ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_STEPS;
      }
      if (isSecondArrange) {
        return hasSecondTutorialRouteRewards
          ? [...ARRANGE_ROUTE_TILE_TUTORIAL_STEPS, ARRANGE_ROUTE_TILE_TUTORIAL_REPLAY_FINAL_STEP]
          : [...ARRANGE_ROUTE_TILE_TUTORIAL_STEPS, ARRANGE_ROUTE_TILE_TUTORIAL_REWARD_STEP];
      }
      if (isThirdArrange) {
        return ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_STEPS;
      }
      return ARRANGE_ROUTE_LOGIC_TUTORIAL_STEPS;
    },
    [hasSecondTutorialRouteRewards, isConvenienceStoreBoard, isIntroArrange, isSecondArrange, isThirdArrange],
  );
  const tutorialStep = tutorialSteps[tutorialStepIndex];
  const streetUnlockPreviewImagePath =
    rewardPlaceCategoryTiles.find((tile) => tile.sourceId === "street")?.imagePath ?? "/images/icon/street.png";
  const showMetroGuide = isStoryRouteTutorialFlow && !isTutorialModalOpen && !isIntroArrange;
  const metroFirstStepActive = showMetroGuide && !hasMetroStationPlaced;
  const showMetroDropHint = metroFirstStepActive && hasMetroGuideGrabbed;
  const startPosForGuide = indexToPos(startCell);
  const metroGuideDropCellIndex = posToIndex(startPosForGuide.r + 1, startPosForGuide.c);
  const metroSelectionTooltipVisible = metroFirstStepActive && activeTab === "metro";
  const visiblePlaceTileStacks = metroFirstStepActive
    ? availablePlaceTileStacks.filter((tile) => tile.stackId.includes("metro-station"))
    : availablePlaceTileStacks;
  const hasNaotaroAbility = useMemo(() => {
    if (!PET_ABILITIES_ENABLED) return false;
    const progress = loadPlayerProgress();
    return progress.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"));
  }, [offworkRewardClaimCount, rewardPlaceTiles.length]);
  const hasFrogAbility = useMemo(() => {
    if (!PET_ABILITIES_ENABLED) return false;
    const progress = loadPlayerProgress();
    return Boolean(progress.hasTriggeredStreetForgotLunchEvent);
  }, [offworkRewardClaimCount, rewardPlaceTiles.length]);
  const hasGoatAbility = useMemo(() => {
    if (!PET_ABILITIES_ENABLED) return false;
    const progress = loadPlayerProgress();
    return Boolean(progress.hasTriggeredMetroSunbeastGoatEvent);
  }, [offworkRewardClaimCount, rewardPlaceTiles.length]);
  const canUseNaotaroDig =
    hasNaotaroAbility &&
    !hasUsedNaotaroDigInThisArrange &&
    playerStatus.actionPower > 0;
  const canUseFrogBridge =
    hasFrogAbility &&
    !hasUsedFrogBridgeInThisArrange &&
    playerStatus.actionPower > 0;
  const canUseGoatFlip =
    hasGoatAbility &&
    !hasUsedGoatFlipInThisArrange &&
    playerStatus.actionPower > 0;

  const markPetTabGuideSeen = () => {
    const progress = loadPlayerProgress();
    if (progress.hasSeenNaotaroPetTabGuide) return;
    savePlayerProgress({
      ...progress,
      hasSeenNaotaroPetTabGuide: true,
    });
  };

  useEffect(() => {
    if (hasNaotaroAbility) return;
    setIsNaotaroDigMode(false);
  }, [hasNaotaroAbility]);
  useEffect(() => {
    if (hasFrogAbility) return;
    setIsFrogBridgeMode(false);
  }, [hasFrogAbility]);
  useEffect(() => {
    if (hasGoatAbility) return;
    setIsGoatFlipMode(false);
  }, [hasGoatAbility]);

  useEffect(() => {
    if (canUseNaotaroDig) return;
    setIsNaotaroDigMode(false);
  }, [canUseNaotaroDig]);
  useEffect(() => {
    if (canUseFrogBridge) return;
    setIsFrogBridgeMode(false);
  }, [canUseFrogBridge]);
  useEffect(() => {
    if (canUseGoatFlip) return;
    setIsGoatFlipMode(false);
  }, [canUseGoatFlip]);

  useEffect(() => {
    if (!hasNaotaroAbility || metroFirstStepActive) {
      setIsPetTabGuideActive(false);
      hasShownPetTabGuideToastRef.current = false;
      return;
    }
    const progress = loadPlayerProgress();
    if (progress.hasSeenNaotaroPetTabGuide) {
      setIsPetTabGuideActive(false);
      return;
    }
    if (activeTab === "pet") {
      setIsPetTabGuideActive(false);
      markPetTabGuideSeen();
      return;
    }

    setIsPetTabGuideActive(true);
    if (!hasShownPetTabGuideToastRef.current) {
      showDropToast("直太郎已可使用，點一下「小日獸」試試看吧！", {
        type: "hint",
        hideMs: 4000,
        clearMs: 4400,
      });
      hasShownPetTabGuideToastRef.current = true;
    }
  }, [activeTab, hasNaotaroAbility, metroFirstStepActive]);

  const toSlotRow = (slots: number[]) => {
    const row: [number, number, number] = [0, 0, 0];
    slots.forEach((slot) => {
      if (slot >= 0 && slot <= 2) {
        row[slot] = 1;
      }
    });
    return row;
  };

  const showAbilityError = (message: string) => {
    setDropError(message);
    setIsDropErrorVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsDropErrorVisible(false), 900);
    clearTimerRef.current = setTimeout(() => setDropError(""), 1300);
  };

  const buildNaotaroBridgePattern = (cellIndex: number): number[][] | null => {
    const { r, c } = indexToPos(cellIndex);
    if (r <= 0 || r >= boardRows - 1) return null;
    const topConnector = getConnectorAtCellFromMap(posToIndex(r - 1, c), placedRoutes);
    const bottomConnector = getConnectorAtCellFromMap(posToIndex(r + 1, c), placedRoutes);
    if (!topConnector || !bottomConnector) return null;
    if (topConnector.bottom.length === 0 || bottomConnector.top.length === 0) return null;
    return [
      toSlotRow(topConnector.bottom),
      [0, 1, 0],
      toSlotRow(bottomConnector.top),
    ];
  };
  const buildFrogBridgePattern = (cellIndex: number): number[][] | null => {
    const { r, c } = indexToPos(cellIndex);
    if (c <= 0 || c >= boardCols - 1) return null;
    const leftConnector = getConnectorAtCellFromMap(posToIndex(r, c - 1), placedRoutes);
    const rightConnector = getConnectorAtCellFromMap(posToIndex(r, c + 1), placedRoutes);
    if (!leftConnector || !rightConnector) return null;
    if (leftConnector.right.length === 0 || rightConnector.left.length === 0) return null;
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
  };

  const handleNaotaroDigToCell = (cellIndex: number) => {
    if (!hasNaotaroAbility || !isNaotaroDigMode) return;
    if (hasUsedNaotaroDigInThisArrange) {
      showAbilityError("直太郎能力本次安排已使用");
      setIsNaotaroDigMode(false);
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用直太郎能力");
      setIsNaotaroDigMode(false);
      return;
    }
    if (cellIndex === startCell || cellIndex === endCell) return;
    if (placedRoutes[cellIndex]) return;

    const pattern = buildNaotaroBridgePattern(cellIndex);
    if (!pattern) {
      showAbilityError("直太郎：這格上下要先有路線才挖得動");
      return;
    }

    const { r, c } = indexToPos(cellIndex);
    const leftNeighbor = c > 0 ? getConnectorAtCellFromMap(posToIndex(r, c - 1), placedRoutes) : null;
    const rightNeighbor = c < boardCols - 1 ? getConnectorAtCellFromMap(posToIndex(r, c + 1), placedRoutes) : null;
    if ((leftNeighbor?.right.length ?? 0) > 0 || (rightNeighbor?.left.length ?? 0) > 0) {
      showAbilityError("直太郎：左右連接會衝突，換一格再挖");
      return;
    }

    const tileId = `${NAOTARO_DIG_TILE_BASE_ID}-${Date.now()}-${cellIndex}`;
    const newTile: RouteTile = {
      id: tileId,
      label: "直太郎挖格",
      pattern,
      centerEmoji: "🐾",
      imagePath: resolveRouteTileImagePath(pattern),
    };

    setNaotaroDugTiles((prev) => ({ ...prev, [tileId]: newTile }));
    setPlacedRoutes((prev) => {
      const previousMap = { ...prev };
      const nextMap = { ...prev, [cellIndex]: tileId };
      const bothEndpointAnchorsReady = hasBothEndpointAnchorsReady(nextMap);
      if (bothEndpointAnchorsReady && !isMapRouteConnected(nextMap)) {
        return previousMap;
      }
      return nextMap;
    });
    onPlayerStatusChange((prev) => ({
      ...prev,
      actionPower: Math.max(0, prev.actionPower - 1),
    }));
    setHasUsedNaotaroDigInThisArrange(true);
    setDropError("");
    setIsDropErrorVisible(false);
    setIsNaotaroDigMode(false);
    setIsFrogBridgeMode(false);
    setIsGoatFlipMode(false);
  };

  const handleToggleNaotaroDigMode = () => {
    if (!hasNaotaroAbility) return;
    if (hasUsedNaotaroDigInThisArrange) {
      showAbilityError("直太郎能力本次安排已使用");
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用直太郎能力");
      return;
    }
    setIsNaotaroDigMode((prev) => !prev);
    setIsFrogBridgeMode(false);
    setIsGoatFlipMode(false);
  };

  const handleFrogBridgeToCell = (cellIndex: number) => {
    if (!hasFrogAbility || !isFrogBridgeMode) return;
    if (hasUsedFrogBridgeInThisArrange) {
      showAbilityError("青蛙能力本次安排已使用");
      setIsFrogBridgeMode(false);
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用青蛙能力");
      setIsFrogBridgeMode(false);
      return;
    }
    if (cellIndex === startCell || cellIndex === endCell) return;
    if (placedRoutes[cellIndex]) return;

    const pattern = buildFrogBridgePattern(cellIndex);
    if (!pattern) {
      showAbilityError("青蛙：這格左右要先有路線才能銜接");
      return;
    }

    const { r, c } = indexToPos(cellIndex);
    const topNeighbor = r > 0 ? getConnectorAtCellFromMap(posToIndex(r - 1, c), placedRoutes) : null;
    const bottomNeighbor = r < boardRows - 1 ? getConnectorAtCellFromMap(posToIndex(r + 1, c), placedRoutes) : null;
    if ((topNeighbor?.bottom.length ?? 0) > 0 || (bottomNeighbor?.top.length ?? 0) > 0) {
      showAbilityError("青蛙：上下連接會衝突，換一格再試");
      return;
    }

    const tileId = `${FROG_BRIDGE_TILE_BASE_ID}-${Date.now()}-${cellIndex}`;
    const newTile: RouteTile = {
      id: tileId,
      label: "青蛙銜接",
      pattern,
      centerEmoji: "🐸",
      imagePath: resolveRouteTileImagePath(pattern),
    };

    setFrogBridgeTiles((prev) => ({ ...prev, [tileId]: newTile }));
    setPlacedRoutes((prev) => {
      const previousMap = { ...prev };
      const nextMap = { ...prev, [cellIndex]: tileId };
      const bothEndpointAnchorsReady = hasBothEndpointAnchorsReady(nextMap);
      if (bothEndpointAnchorsReady && !isMapRouteConnected(nextMap)) {
        return previousMap;
      }
      return nextMap;
    });
    onPlayerStatusChange((prev) => ({
      ...prev,
      actionPower: Math.max(0, prev.actionPower - 1),
    }));
    setHasUsedFrogBridgeInThisArrange(true);
    setDropError("");
    setIsDropErrorVisible(false);
    setIsFrogBridgeMode(false);
    setIsNaotaroDigMode(false);
    setIsGoatFlipMode(false);
  };

  const handleToggleFrogBridgeMode = () => {
    if (!hasFrogAbility) return;
    if (hasUsedFrogBridgeInThisArrange) {
      showAbilityError("青蛙能力本次安排已使用");
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用青蛙能力");
      return;
    }
    setIsFrogBridgeMode((prev) => !prev);
    setIsNaotaroDigMode(false);
    setIsGoatFlipMode(false);
  };

  const handleGoatFlipAtCell = (cellIndex: number) => {
    if (!hasGoatAbility || !isGoatFlipMode) return;
    if (hasUsedGoatFlipInThisArrange) {
      showAbilityError("山羊能力本次安排已使用");
      setIsGoatFlipMode(false);
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用山羊能力");
      setIsGoatFlipMode(false);
      return;
    }
    if (cellIndex === startCell || cellIndex === endCell) return;
    const currentTileId = placedRoutes[cellIndex];
    if (!currentTileId) {
      showAbilityError("山羊：請先點一塊已放置路徑拼圖");
      return;
    }
    const pairMarker = parsePairMarker(currentTileId);
    if (pairMarker) {
      showAbilityError("山羊：目前不支援翻轉 2x1 路徑拼圖");
      return;
    }
    if (allPlaceTileInstances.some((tile) => tile.id === currentTileId)) {
      showAbilityError("山羊：地點拼圖不能左右翻轉");
      return;
    }
    const sourceTile = tileMap[currentTileId];
    if (!sourceTile) return;
    const flippedPattern = flipPatternHorizontally(sourceTile.pattern);
    if (patternToKey(flippedPattern) === patternToKey(sourceTile.pattern)) {
      showAbilityError("山羊：這塊翻轉後沒有變化");
      return;
    }
    const tileId = `${GOAT_FLIP_TILE_BASE_ID}-${Date.now()}-${cellIndex}`;
    const newTile: RouteTile = {
      id: tileId,
      label: "山羊翻轉",
      pattern: flippedPattern,
      centerEmoji: sourceTile.centerEmoji ?? "🐐",
      imagePath: resolveRouteTileImagePath(flippedPattern),
    };

    setGoatFlippedTiles((prev) => ({ ...prev, [tileId]: newTile }));
    setPlacedRoutes((prev) => {
      const previousMap = { ...prev };
      const nextMap = { ...prev, [cellIndex]: tileId };
      const bothEndpointAnchorsReady = hasBothEndpointAnchorsReady(nextMap);
      if (bothEndpointAnchorsReady && !isMapRouteConnected(nextMap)) {
        return previousMap;
      }
      return nextMap;
    });
    onPlayerStatusChange((prev) => ({
      ...prev,
      actionPower: Math.max(0, prev.actionPower - 1),
    }));
    setHasUsedGoatFlipInThisArrange(true);
    setDropError("");
    setIsDropErrorVisible(false);
    setIsGoatFlipMode(false);
    setIsNaotaroDigMode(false);
    setIsFrogBridgeMode(false);
  };

  const handleToggleGoatFlipMode = () => {
    if (!hasGoatAbility) return;
    if (hasUsedGoatFlipInThisArrange) {
      showAbilityError("山羊能力本次安排已使用");
      return;
    }
    if (playerStatus.actionPower <= 0) {
      showAbilityError("行動力不足，無法使用山羊能力");
      return;
    }
    setIsGoatFlipMode((prev) => !prev);
    setIsNaotaroDigMode(false);
    setIsFrogBridgeMode(false);
  };

  const handleDeparture = () => {
    if (!isRouteConnected) return;
    if (activeDepartureTransition) return;
    departureLastReachedSourceRef.current = "home";
    departureTransitionDestinationSourceRef.current = null;
    departureRouteMapPointsRef.current = buildDepartureMapPoints();
    const placedPlaceInstanceIds = Array.from(
      new Set(
        Object.values(placedRoutes).filter((tileId) =>
          allPlaceTileInstances.some((placeTile) => placeTile.id === tileId),
        ),
      ),
    );
    if (placedPlaceInstanceIds.length > 0) {
      const progress = loadPlayerProgress();
      const nextConsumed = Array.from(
        new Set([...progress.consumedPlaceTileInstanceIds, ...placedPlaceInstanceIds]),
      );
      savePlayerProgress({
        ...progress,
        consumedPlaceTileInstanceIds: nextConsumed,
      });
      setConsumedPlaceTileInstanceIds(nextConsumed);
      onProgressSaved?.();
    }
    recordArrangeRouteDeparture();
    if (isStoryRouteTutorialFlow && (isIntroArrange || hasMetroStationPlaced)) {
      startDepartureTransition("前往捷運站", () => {
        router.push(ROUTES.gameScene("scene-69"));
      });
      return;
    }
    const startDepartureOutcome = (
      destinationLabel: string,
      destinationSourceId: DepartureMapPoint["sourceId"],
      nextAction: () => void,
      unlockCue?: DepartureUnlockCue,
    ) => {
      startDepartureTransition(destinationLabel, () => {
        departureLastReachedSourceRef.current = destinationSourceId;
        nextAction();
      }, undefined, unlockCue);
    };
    if (hasBreakfastShopPlaced) {
      startDepartureOutcome("前往早餐店", "breakfast-shop", () => {
        setActiveEventId("breakfast-shop-choice");
      });
      return;
    }
    if (hasConvenienceStorePlaced) {
      const progress = loadPlayerProgress();
      if (hasOrderedStreetThenConvenience && !progress.hasCompletedStreetForgotLunchFrogEvent) {
        savePlayerProgress({
          ...progress,
          hasTriggeredStreetForgotLunchEvent: true,
        });
        onProgressSaved?.();
        startDepartureOutcome("前往便利商店", "convenience-store", () => {
          setActiveEventId("street-forgot-lunch-frog");
        }, {
          badge: "線索",
          title: "路線線索已解開",
          description: "街道接到便利商店，接下來好像會有新的相遇。",
        });
        return;
      }
      startDepartureOutcome("前往便利商店", "convenience-store", () => {
        setActiveEventId("convenience-store-hub");
      });
      return;
    }
    if (hasBusStopPlaced) {
      const progress = loadPlayerProgress();
      const hasBusCatItems =
        progress.inventoryItems.includes("yarn") &&
        progress.inventoryItems.includes("cat-treat") &&
        progress.inventoryItems.includes("cat-grass");
      if (hasBusCatItems && !progress.hasTriggeredBusSunbeastCatEvent) {
        consumeInventoryItems("yarn", 1);
        consumeInventoryItems("cat-treat", 1);
        consumeInventoryItems("cat-grass", 1);
        markBusSunbeastCatEventTriggered();
        onProgressSaved?.();
        startDepartureOutcome("前往公車站", "bus-stop", () => {
          setActiveEventId("bus-sunbeast-cat");
        });
        return;
      }
    }
    if (hasStreetPlaced) {
      const progress = loadPlayerProgress();
      const nextProgress = buildStreetVisitProgress(progress);
      savePlayerProgress(nextProgress);
      onProgressSaved?.();
      const randomIndex = Math.floor(Math.random() * STREET_DEPARTURE_EVENT_IDS.length);
      startDepartureOutcome("前往街道", "street", () => {
        setActiveEventId(STREET_DEPARTURE_EVENT_IDS[randomIndex]);
      });
      return;
    }
    if (hasParkPlaced) {
      startDepartureOutcome("前往公園", "park", () => {
        setActiveEventId("park-hub");
      });
      return;
    }
    if (hasMetroStationPlaced) {
      const progress = loadPlayerProgress();
      const canTriggerMetroGoatEvent =
        !progress.hasTriggeredMetroSunbeastGoatEvent &&
        (
          playerStatus.fatigue >= 60 ||
          progress.hadOvertimeYesterday ||
          progress.hasNegativeEventToday ||
          progress.hasNegativeEventYesterday
        );
      if (canTriggerMetroGoatEvent) {
        markMetroSunbeastGoatEventTriggered();
        onProgressSaved?.();
        startDepartureOutcome("前往捷運站", "metro-station", () => {
          setActiveEventId("metro-sunbeast-goat");
        });
        return;
      }
      const randomIndex = Math.floor(Math.random() * METRO_DAILY_EVENT_IDS.length);
      startDepartureOutcome("前往捷運站", "metro-station", () => {
        setActiveEventId(METRO_DAILY_EVENT_IDS[randomIndex]);
      });
      return;
    }
    startDepartureRouteToWork();
  };

  const grantMetroPuzzleFragment = () => {
    grantInventoryItem("puzzle-fragment");
    onProgressSaved?.();
  };

  const grantSecondTutorialRoutesIfMissing = () => {
    const progress = loadPlayerProgress();
    const existingPatternKeys = new Set(
      progress.rewardPlaceTiles
        .filter((tile) => tile.category === "route")
        .map((tile) => patternToKey(tile.pattern)),
    );
    const missingTiles = SECOND_TUTORIAL_ROUTE_REWARDS.filter(
      (tile) => !existingPatternKeys.has(patternToKey(tile.pattern)),
    );
    if (missingTiles.length <= 0) return;

    savePlayerProgress({
      ...progress,
      ownedPlaceTileIds: Array.from(new Set([...progress.ownedPlaceTileIds, "metro-station"])),
      rewardPlaceTiles: [
        ...progress.rewardPlaceTiles,
        ...missingTiles.map((tile, index) => ({
          instanceId: `metro-station-intro-${patternToKey(tile.pattern)}-${index}`,
          sourceId: "metro-station" as const,
          category: "route" as const,
          label: tile.label,
          centerEmoji: tile.centerEmoji,
          pattern: tile.pattern as [
            [number, number, number],
            [number, number, number],
            [number, number, number],
          ],
        })),
      ],
    });
    onProgressSaved?.();
  };

  const grantConvenienceRouteRewardsIfMissing = () => {
    const progress = loadPlayerProgress();
    const existingPatternKeys = new Set(
      progress.rewardPlaceTiles
        .filter((tile) => tile.category === "route")
        .map((tile) => patternToKey(tile.pattern)),
    );
    const missingTiles = CONVENIENCE_ROUTE_REWARDS.filter(
      (tile) => !existingPatternKeys.has(patternToKey(tile.pattern)),
    );
    if (missingTiles.length <= 0) return;

    savePlayerProgress({
      ...progress,
      rewardPlaceTiles: [
        ...progress.rewardPlaceTiles,
        ...missingTiles.map((tile, index) => ({
          instanceId: `convenience-route-${patternToKey(tile.pattern)}-${index}`,
          sourceId: "convenience-store" as const,
          category: "route" as const,
          label: tile.label,
          centerEmoji: tile.centerEmoji,
          pattern: tile.pattern as [
            [number, number, number],
            [number, number, number],
            [number, number, number],
          ],
        })),
      ],
    });
    onProgressSaved?.();
  };

  const closeTutorialModal = () => {
    const shouldGrantSecondTutorialRewards =
      isSecondArrange && !hasSecondTutorialRouteRewards && tutorialStep.kind === "reward";
    const shouldGrantConvenienceRewards =
      isConvenienceStoreBoard && tutorialStep.kind === "convenience-reward";
    if (shouldGrantSecondTutorialRewards) {
      grantSecondTutorialRoutesIfMissing();
      setActiveTab("route");
    }
    if (shouldGrantConvenienceRewards) {
      grantConvenienceRouteRewardsIfMissing();
      setActiveTab("route");
    }
    if (isSecondArrange) {
      const progress = loadPlayerProgress();
      savePlayerProgress({
        ...progress,
        hasSeenArrangeRouteTileTutorial: true,
      });
      onProgressSaved?.();
    }
    setIsTutorialModalOpen(false);
    if (isIntroArrange) {
      setActiveArrangeRoutePromptId("intro-depart-to-metro");
    }
    if (typeof window !== "undefined") {
      const seenKey = isConvenienceStoreBoard
        ? ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY
        : isSecondArrange
        ? ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY
        : isThirdArrange
          ? ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY
        : ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY;
      window.localStorage.setItem(seenKey, "1");
    }
  };

  const openTutorialModal = () => {
    setTutorialStepIndex(0);
    setIsTutorialModalOpen(true);
  };

  const completeThirdArrangeIntro = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
    }
    setIsStreetUnlockOverlayOpen(false);
    setIsMissionModalOpen(true);
    if (isSecondArrange && !hasSecondTutorialRouteRewards) {
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(true);
    }
  };

  const handleThirdArrangeIntroContinue = () => {
    if (thirdArrangeIntroStep === "unlock") {
      setThirdArrangeIntroStep("mai");
      return;
    }
    if (thirdArrangeIntroStep === "mai") {
      setThirdArrangeIntroStep("beigo");
      return;
    }
    if (thirdArrangeIntroStep === "beigo") {
      setThirdArrangeIntroStep("mission");
      return;
    }
    completeThirdArrangeIntro();
  };

  const handleConvenienceStoreIntroContinue = () => {
    if (convenienceStoreIntroStep === "beigo") {
      setConvenienceStoreIntroStep("mai");
      return;
    }
    setIsConvenienceStoreIntroOpen(false);
    setTutorialStepIndex(0);
    setIsTutorialModalOpen(true);
  };

  const boardMaxWidth =
    useSimpleArrangeUi && isIntroArrange
      ? "152px"
      : useSimpleArrangeUi && isConvenienceStoreBoard
        ? "218px"
      : useSimpleArrangeUi && (isSecondArrange || arrangeRouteAttempt >= 2)
        ? "112px"
        : "360px";
  const boardHeight =
    useSimpleArrangeUi && isIntroArrange ? "100%" : isExpandedBoard ? "500px" : "430px";
  const routeTrayTiles = routeSlides.flat();
  const metroTrayTiles = visiblePlaceTileStacks.filter((tile) => tile.stackId.includes("metro-station"));
  const streetTrayTiles = visiblePlaceTileStacks.filter((tile) => tile.stackId.includes("street"));
  const convenienceTrayTiles = visiblePlaceTileStacks.filter((tile) =>
    tile.stackId.includes("convenience-store"),
  );
  const shouldShowRoutePuzzleTab = !isIntroArrange && hasSecondTutorialRouteRewards;
  const shouldShowStreetPlaceTab = streetTrayTiles.length > 0;
  const shouldShowConveniencePlaceTab = convenienceTrayTiles.length > 0;
  const displayedTab: ArrangeTabKey =
    activeTab === "route" && shouldShowRoutePuzzleTab
      ? "route"
      : activeTab === "street" && shouldShowStreetPlaceTab
        ? "street"
        : activeTab === "convenience" && shouldShowConveniencePlaceTab
          ? "convenience"
        : "metro";

  useEffect(() => {
    if (!isSecondArrange) return;
    if (!shouldShowRoutePuzzleTab) return;
    setActiveTab((prev) => (prev === "route" ? prev : "route"));
  }, [isSecondArrange, shouldShowRoutePuzzleTab]);

  useEffect(() => {
    if (!shouldShowStreetMission) return;
    if (!shouldShowStreetPlaceTab) return;
    setActiveTab((prev) => (prev === "street" ? prev : "street"));
  }, [shouldShowStreetMission, shouldShowStreetPlaceTab]);

  useEffect(() => {
    if (shouldShowStreetMission) return;
    setIsMissionModalOpen(false);
  }, [shouldShowStreetMission]);

  const departureMapPoints =
    activeDepartureTransition?.mapPoints ?? [
      {
        key: "home",
        visual: { label: "家", iconPath: "/images/icon/house.png" },
        sourceId: "home" as const,
        positionPercent: 9,
      },
      {
        key: "company",
        visual: { label: "公司", iconPath: "/images/icon/company.png" },
        sourceId: "company" as const,
        positionPercent: 91,
      },
    ];
  const departureMaiMapLeftPercent =
    (activeDepartureTransition?.mapStartPercent ?? 9) +
    ((activeDepartureTransition?.mapEndPercent ?? 91) - (activeDepartureTransition?.mapStartPercent ?? 9)) *
      departureTravelProgress;

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      bgColor={useSimpleArrangeUi ? "#F4EFE4" : "#DAD6C8"}
      direction="column"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <UnlockFeedbackOverlay items={unlockFeedbackItems} />
      {isConvenienceStoreIntroOpen ? (
        <Flex position="absolute" inset="0" zIndex={81} bgColor="rgba(27,23,20,0.84)" direction="column">
          <Flex mt="auto" w="100%" position="relative">
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId={convenienceStoreIntroStep === "beigo" ? "beigo" : "mai"}
                frameIndex={convenienceStoreIntroStep === "beigo" ? 1 : 0}
              />
            </Flex>
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                {convenienceStoreIntroStep === "beigo" ? (
                  <Text color="white" fontSize="16px" lineHeight="1.7">
                    便利...商店 .... 好玩
                  </Text>
                ) : (
                  <Text color="white" fontSize="16px" lineHeight="1.7">
                    反正就在轉角，有空的時候就路過吧
                  </Text>
                )}
              </Flex>
              <EventContinueAction onClick={handleConvenienceStoreIntroContinue} />
            </EventDialogPanel>
          </Flex>
        </Flex>
      ) : null}
      {isStreetUnlockOverlayOpen ? (
        <Flex position="absolute" inset="0" zIndex={80} bgColor="rgba(27,23,20,0.84)" direction="column">
          {thirdArrangeIntroStep === "unlock" ? (
            <>
              <Flex
                flex="1"
                direction="column"
                alignItems="center"
                justifyContent="center"
                px="24px"
                pt="42px"
                pb="120px"
                gap="18px"
              >
                <Flex
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  gap="18px"
                  animation={`${thirdArrangeUnlockFadeIn} 520ms ease-out`}
                >
                  <Flex
                    w="198px"
                    h="198px"
                    borderRadius="2px"
                    overflow="hidden"
                    alignItems="center"
                    justifyContent="center"
                    bgColor="#D8D0C0"
                    boxShadow="0 12px 24px rgba(0,0,0,0.22)"
                  >
                    <img
                      src={streetUnlockPreviewImagePath}
                      alt="街道"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Flex>
                  <Text color="white" fontSize="24px" fontWeight="800" lineHeight="1.5" textAlign="center">
                    直太郎把新的地點
                    <br />
                    帶回來了！
                  </Text>
                  <Text color="#FFF3BF" fontSize="22px" fontWeight="800" lineHeight="1">
                    解鎖地點：街道
                  </Text>
                  <Flex alignItems="center" justifyContent="center" gap="10px" wrap="wrap">
                    {FIRST_STREET_REWARD_PATTERNS.map((pattern, index) => (
                      <Flex
                        key={`street-intro-pattern-${index}`}
                        direction="column"
                        alignItems="center"
                        gap="6px"
                      >
                        <Flex
                          w="62px"
                          h="62px"
                          borderRadius="10px"
                          bgColor="#F3E8D0"
                          border="2px solid rgba(255,255,255,0.42)"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <GridPattern
                            pattern={pattern}
                            centerEmoji="💡"
                            overlayIconPath="/images/icon/street.png"
                          />
                        </Flex>
                        <Text color="#FFF6D8" fontSize="11px" fontWeight="700" lineHeight="1">
                          {FIRST_STREET_REWARD_LABELS[index]}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Text color="#FFF6D8" fontSize="14px" fontWeight="700" lineHeight="1.6" textAlign="center">
                    收下 3 個街道拼圖，今天開始可以把街道排進行程了。
                  </Text>
                </Flex>
              </Flex>
              <Flex
                as="button"
                mt="auto"
                w="100%"
                h="72px"
                alignItems="center"
                justifyContent="center"
                borderTop="1px solid rgba(255,255,255,0.1)"
                bgColor="rgba(61,46,34,0.92)"
                color="rgba(255,255,255,0.96)"
                fontSize="16px"
                fontWeight="700"
                cursor="pointer"
                onClick={handleThirdArrangeIntroContinue}
              >
                點擊繼續
              </Flex>
            </>
          ) : (
            <Flex mt="auto" w="100%" position="relative">
              {thirdArrangeIntroStep === "mai" ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite spriteId="mai" frameIndex={0} />
                </Flex>
              ) : null}
              {thirdArrangeIntroStep === "beigo" ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite spriteId="beigo" frameIndex={1} />
                </Flex>
              ) : null}
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  {thirdArrangeIntroStep === "mai" ? (
                    <Text color="white" fontSize="16px" lineHeight="1.7">
                      直太郎出現在圖鑑之後，連街道也一起浮現了……
                    </Text>
                  ) : null}
                  {thirdArrangeIntroStep === "beigo" ? (
                    <Text color="white" fontSize="16px" lineHeight="1.7">
                      先把這三塊街道拼圖收下嗷！巷口、騎樓、轉角都能排進今天的行程。
                    </Text>
                  ) : null}
                  {thirdArrangeIntroStep === "mission" ? (
                    <Flex direction="column" gap="10px">
                      <Text color="white" fontSize="16px" lineHeight="1.7">
                        先從街道開始找吧，新的線索應該就藏在那附近。
                      </Text>
                      <Text color="#FFE3AE" fontSize="16px" fontWeight="800" lineHeight="1.7">
                        收到任務：在接下來的安排行程中，前往街道兩次
                      </Text>
                    </Flex>
                  ) : null}
                </Flex>
                <EventContinueAction onClick={handleThirdArrangeIntroContinue} />
              </EventDialogPanel>
            </Flex>
          )}
        </Flex>
      ) : null}
      <Flex
        h="100px"
        minH="100px"
        maxH="100px"
        px="12px"
        pt="10px"
        pb="10px"
        bgColor="#B88E6D"
      >
        <Flex direction="column" w="100%" gap="12px">
          <Flex alignItems="center" justifyContent="space-between" gap="12px">
            <Text color="white" fontWeight="800" fontSize="24px" lineHeight="1.1">
              安排行程
            </Text>
            <Flex alignItems="center" gap="8px">
              <Flex
                h="32px"
                px="10px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.96)"
                alignItems="center"
                justifyContent="center"
                gap="6px"
              >
                <Text color="#705B46" fontSize="14px" lineHeight="1">
                  💰
                </Text>
                <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                  {playerStatus.savings} 小日幣
                </Text>
              </Flex>
              <Flex
                as="button"
                w="32px"
                h="32px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.96)"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                position="relative"
                onClick={openTutorialModal}
                aria-label="打開安排路線教學"
              >
                <Text color="#705B46" fontSize="18px">?</Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex gap="8px">
            <Flex
              as="button"
              flex="1"
              minW="0"
              h="36px"
              borderRadius="999px"
              bgColor={hasSeenSunbeastFirstReveal ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.56)"}
              border="2px solid rgba(112,91,70,0.18)"
              alignItems="center"
              justifyContent="center"
              gap="6px"
              cursor={hasSeenSunbeastFirstReveal ? "pointer" : "not-allowed"}
              opacity={hasSeenSunbeastFirstReveal ? 1 : 0.72}
              onClick={() => {
                if (!hasSeenSunbeastFirstReveal) return;
                setIsSunbeastDexOpen(true);
              }}
              aria-label="打開小日獸圖鑑"
            >
              <FaPaw size={14} color="#705B46" />
              <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                小日獸
              </Text>
            </Flex>
            <Flex
              as="button"
              flex="1"
              minW="0"
              h="36px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.96)"
              border="2px solid rgba(112,91,70,0.18)"
              alignItems="center"
              justifyContent="center"
              gap="6px"
              cursor="pointer"
              onClick={() => {
                setIsMapOverlayOpen(true);
              }}
              aria-label="打開地點"
            >
              <FaLocationDot size={14} color="#705B46" />
              <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                地點
              </Text>
            </Flex>
            <Flex
              as="button"
              flex="1"
              minW="0"
              h="36px"
              borderRadius="999px"
              bgColor={shouldShowStreetMission ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.56)"}
              border="2px solid rgba(112,91,70,0.18)"
              alignItems="center"
              justifyContent="center"
              gap="6px"
              position="relative"
              cursor={shouldShowStreetMission ? "pointer" : "not-allowed"}
              opacity={shouldShowStreetMission ? 1 : 0.72}
              onClick={() => {
                if (!shouldShowStreetMission) return;
                setIsMissionModalOpen((prev) => !prev);
              }}
              aria-label="打開任務"
            >
              <Text color="#705B46" fontSize="14px" lineHeight="1">
                📝
              </Text>
              <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                任務
              </Text>
              {shouldShowStreetMission ? (
                <Box
                  position="absolute"
                  top="4px"
                  right="6px"
                  w="7px"
                  h="7px"
                  borderRadius="999px"
                  bgColor="#E96023"
                  boxShadow="0 0 0 2px rgba(255,255,255,0.95)"
                />
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        px="12px"
        py="16px"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/road_pattern_ bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
      >
        {shouldShowStreetMission && isMissionModalOpen ? (
          <Flex
            position="absolute"
            top="18px"
            left="48px"
            zIndex={16}
            w="calc(100% - 96px)"
            maxW="320px"
            direction="column"
            borderRadius="16px"
            overflow="hidden"
            bgColor="#F6F2EC"
            border="3px solid #B88E6D"
            boxShadow="0 10px 24px rgba(112,84,54,0.18)"
          >
            <Flex
              h="52px"
              px="18px"
              bgColor="#B88E6D"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text color="white" fontSize="16px" fontWeight="800" lineHeight="1">
                任務
              </Text>
              <Flex
                as="button"
                w="28px"
                h="28px"
                alignItems="center"
                justifyContent="center"
                color="white"
                cursor="pointer"
                aria-label="關閉任務"
                onClick={() => {
                  setIsMissionModalOpen(false);
                }}
              >
                <FiX size={22} />
              </Flex>
            </Flex>
            <Flex
              h="62px"
              px="18px"
              bgColor="rgba(255,255,255,0.96)"
              alignItems="center"
              justifyContent="space-between"
              gap="10px"
            >
              <Text color="#161616" fontSize="14px" fontWeight="800" lineHeight="1.2">
                在接下來的安排行程中，前往街道兩次
              </Text>
              <Text color="#B88E6D" fontSize="14px" fontWeight="700" whiteSpace="nowrap">
                10小日幣
              </Text>
            </Flex>
          </Flex>
        ) : null}
        <Grid
          templateColumns={`repeat(${boardCols}, 1fr)`}
          templateRows={`repeat(${boardRows}, 1fr)`}
          gap="10px"
          w="100%"
          maxW={boardMaxWidth}
          h={boardHeight}
          maxH={useSimpleArrangeUi ? "400px" : undefined}
          p="10px"
          bgColor="rgba(255,255,255,0.88)"
          border="3px solid #B99873"
          borderRadius="18px"
          boxShadow="0 8px 18px rgba(115,86,45,0.12)"
        >
          {Array.from({ length: boardCellCount }).map((_, index) => {
          const isStart = index === startCell;
          const isEnd = index === endCell;
          const isBlockedCell = blockedCells.has(index);
          const isFixedConvenienceStoreCell =
            fixedConvenienceStoreCell !== null && index === fixedConvenienceStoreCell;
          const cellValue = placedRoutes[index];
          const pairMarker = cellValue ? parsePairMarker(cellValue) : null;
          const isPairRightCell = pairMarker?.side === "right";
          const isPairLeftCell = pairMarker?.side === "left";
          const renderTileId = pairMarker
            ? pairMarker.side === "left"
              ? pairMarker.leftId
              : pairMarker.rightId
            : cellValue ?? null;
          const isNaotaroDugPlacedTile = renderTileId ? isNaotaroDugTileId(renderTileId) : false;
          const isFrogBridgePlacedTile = renderTileId ? isFrogBridgeTileId(renderTileId) : false;
          const isGoatFlipPlacedTile = renderTileId ? isGoatFlipTileId(renderTileId) : false;
          const isOccupied = Boolean(cellValue);
          const isDroppable = !isStart && !isEnd && !isBlockedCell && !isFixedConvenienceStoreCell;
          const isPetAbilityTarget =
            ((isNaotaroDigMode || isFrogBridgeMode) && isDroppable && !isOccupied) ||
            (isGoatFlipMode && isDroppable && isOccupied);
          const mismatchHints = mismatchHintMap.get(index);
          const showRightMismatchHint = mismatchHints?.has("right") ?? false;
          const showBottomMismatchHint = mismatchHints?.has("bottom") ?? false;
          if (isBlockedCell) {
            return <Box key={index} />;
          }
          return (
            <Flex
              key={index}
              border="none"
              bgColor="rgba(244,236,223,0.95)"
              borderRadius="10px"
              outline={
                showMetroDropHint && index === metroGuideDropCellIndex
                  ? "2px dashed rgba(240,200,74,0.95)"
                  : "none"
              }
              outlineOffset={
                showMetroDropHint && index === metroGuideDropCellIndex ? "-3px" : "0px"
              }
              alignItems="center"
              justifyContent="center"
              position="relative"
              onDragOver={(event) => {
                if (!isDroppable) return;
                event.preventDefault();
                setHoverCell(index);
              }}
              onDragLeave={() => {
                if (hoverCell === index) setHoverCell(null);
              }}
              onDrop={(event) => {
                if (!isDroppable) return;
                event.preventDefault();
                const payload = readDragPayload(event);
                if (payload) {
                  markBoardInteraction();
                  handleDropToCell(index, payload.routeId, payload.sourceCell);
                }
                setHoverCell(null);
              }}
              onDoubleClick={() => {
                if (!isDroppable || !isOccupied) return;
                markBoardInteraction();
                setPlacedRoutes((prev) => {
                  const next = { ...prev };
                  removePlacedAtCell(next, index);
                  return next;
                });
              }}
              onClick={() => {
                if (!isNaotaroDigMode && !isFrogBridgeMode && !isGoatFlipMode) return;
                markBoardInteraction();
                if (isNaotaroDigMode) {
                  handleNaotaroDigToCell(index);
                  return;
                }
                if (isFrogBridgeMode) {
                  handleFrogBridgeToCell(index);
                  return;
                }
                handleGoatFlipAtCell(index);
              }}
            >
              {isStart || isEnd ? (
                <EndpointVisual
                  mode={isStart ? "start" : "end"}
                  startImagePath={
                    isStart && isConvenienceStoreBoard
                      ? "/images/route/start_end/start_home_010.jpg"
                      : undefined
                  }
                />
              ) : isFixedConvenienceStoreCell ? (
                <FixedBoardTileVisual
                  imagePath="/images/route/rt_store_010,110,000.jpg"
                  alt="便利商店"
                />
              ) : isOccupied ? (
                isPairRightCell ? null : (
                <Flex
                  w={isPairLeftCell ? "196%" : "92%"}
                  h="92%"
                  borderRadius="8px"
                  border={`2px solid ${
                    isNaotaroDugPlacedTile
                      ? NAOTARO_DUG_BORDER_COLOR
                      : isFrogBridgePlacedTile
                        ? FROG_BRIDGE_BORDER_COLOR
                        : isGoatFlipPlacedTile
                          ? GOAT_FLIP_BORDER_COLOR
                        : "#8E7A62"
                  }`}
                  bgColor="#D5E8B7"
                  alignItems="center"
                  justifyContent="center"
                  draggable
                  cursor="grab"
                  position={isPairLeftCell ? "absolute" : "relative"}
                  left={isPairLeftCell ? "2%" : undefined}
                  zIndex={isPairLeftCell ? 2 : 1}
                  onDragStart={(event) => {
                    markBoardInteraction();
                    setDragPayload(event, {
                      routeId: cellValue!,
                      sourceCell: index,
                    });
                  }}
                >
                  <GridPattern
                    pattern={
                      isPairLeftCell
                        ? pairMarker
                          ? [...tileMap[pairMarker.leftId].pattern].map((row, rowIndex) => [
                              ...row,
                              ...tileMap[pairMarker.rightId].pattern[rowIndex],
                            ])
                          : tileMap[cellValue!].pattern
                        : tileMap[cellValue!].pattern
                    }
                    centerEmoji={isPairLeftCell ? "🧩" : tileMap[cellValue!].centerEmoji}
                    imagePath={isPairLeftCell ? undefined : tileMap[cellValue!].imagePath}
                    overlayIconPath={isPairLeftCell ? undefined : tileMap[cellValue!].overlayIconPath}
                  />
                </Flex>
                )
              ) : (
                <Text
                  position="absolute"
                  fontSize="22px"
                  opacity={hoverCell === index ? 0.95 : 0.28}
                  color={hoverCell === index ? "#53C5D5" : isPetAbilityTarget ? "#9D7859" : "#9D937E"}
                >
                  {isPetAbilityTarget ? "🐾" : "＋"}
                </Text>
              )}
              {showMetroDropHint && index === metroGuideDropCellIndex ? (
                <Flex
                  pointerEvents="none"
                  position="absolute"
                  top="6px"
                  left="50%"
                  transform="translateX(-50%)"
                  px="8px"
                  h="20px"
                  borderRadius="999px"
                  bgColor="rgba(240,200,74,0.95)"
                  color="#5D4C3A"
                  fontSize="11px"
                  fontWeight="700"
                  whiteSpace="nowrap"
                  animation={`${metroGuideBounce} 1s ease-in-out infinite`}
                >
                  先放這裡
                  <Box
                    position="absolute"
                    left="50%"
                    bottom="-4px"
                    transform="translateX(-50%) rotate(45deg)"
                    w="8px"
                    h="8px"
                    bgColor="rgba(240,200,74,0.95)"
                  />
                </Flex>
              ) : null}
              {showRightMismatchHint ? (
                <Box
                  pointerEvents="none"
                  position="absolute"
                  right="-2px"
                  top="10%"
                  h="80%"
                  w="4px"
                  bgColor="#E96023"
                  borderRadius="999px"
                  animation={`${routeMismatchPulse} 1s ease-in-out infinite`}
                />
              ) : null}
              {showBottomMismatchHint ? (
                <Box
                  pointerEvents="none"
                  position="absolute"
                  bottom="-2px"
                  left="10%"
                  w="80%"
                  h="4px"
                  bgColor="#E96023"
                  borderRadius="999px"
                  animation={`${routeMismatchPulse} 1s ease-in-out infinite`}
                />
              ) : null}
            </Flex>
          );
          })}
        </Grid>
      </Flex>

      {dropError ? (
        <Flex
          position="absolute"
          left="12px"
          right="12px"
          bottom="260px"
          zIndex={20}
          justifyContent="center"
          opacity={isDropErrorVisible ? 1 : 0}
          transform={isDropErrorVisible ? "translateY(0px)" : "translateY(8px)"}
          transition="opacity 0.28s ease, transform 0.28s ease"
          pointerEvents={dropMessageType === "hint" ? "auto" : "none"}
        >
          {dropMessageType === "hint" ? (
            <Flex
              w="100%"
              minH="84px"
              borderRadius="18px"
              border="2px solid #BCA289"
              bgColor="#F5F5F7"
              alignItems="center"
              px="14px"
              py="10px"
              gap="10px"
              boxShadow="0 8px 18px rgba(49,40,28,0.16)"
            >
              <Box
                w="62px"
                h="62px"
                flexShrink={0}
                backgroundImage="url('/images/beigo/Beigo_Spirt.png')"
                backgroundRepeat="no-repeat"
                backgroundSize="186px 62px"
                backgroundPosition="0 0"
              />
              <Text
                flex="1"
                color="#A67C5A"
                fontSize="14px"
                fontWeight="700"
                lineHeight="1.5"
              >
                {dropError}
              </Text>
              <Flex
                as="button"
                onClick={dismissDropToast}
                w="28px"
                h="28px"
                flexShrink={0}
                alignItems="center"
                justifyContent="center"
                color="#9E7758"
                aria-label="關閉提示"
              >
                <FiX size={22} />
              </Flex>
            </Flex>
          ) : (
            <Text
              color="white"
              fontSize="13px"
              fontWeight="700"
              bgColor="rgba(180, 74, 60, 0.94)"
              borderRadius="8px"
              px="10px"
              py="6px"
            >
              {dropError}
            </Text>
          )}
        </Flex>
      ) : null}

      <Flex
        bgColor="#FDF6EA"
        borderTop="1px solid rgba(185,152,115,0.12)"
        direction="column"
        overflow="hidden"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          const payload = readDragPayload(event);
          if (!payload || typeof payload.sourceCell !== "number") return;
          event.preventDefault();
          markBoardInteraction();
          setPlacedRoutes((prev) => {
            const next = { ...prev };
            removePlacedAtCell(next, payload.sourceCell!);
            return next;
          });
        }}
      >
        <Flex
          minH="214px"
          maxH="214px"
          bgColor="#FDF6EA"
          direction="row"
        >
          <Flex
            w="94px"
            minW="94px"
            h="100%"
            direction="column"
            gap="4px"
            bgColor="#FAECD4"
            pt="12px"
            px="4px"
          >
            {shouldShowRoutePuzzleTab ? (
              <SimpleTrayTabButton
                tabKey="route"
                isActive={displayedTab === "route"}
                isAvailable
                onClick={() => {
                  markBoardInteraction();
                  setActiveTab("route");
                }}
              />
            ) : null}
            <SimpleTrayTabButton
              tabKey="metro"
              isActive={displayedTab === "metro"}
              isAvailable
              onClick={() => {
                markBoardInteraction();
                setActiveTab("metro");
              }}
            />
            {shouldShowStreetPlaceTab ? (
              <SimpleTrayTabButton
                tabKey="street"
                isActive={displayedTab === "street"}
                isAvailable={shouldShowStreetPlaceTab}
                onClick={() => {
                  markBoardInteraction();
                  setActiveTab("street");
                }}
              />
            ) : null}
            {shouldShowConveniencePlaceTab ? (
              <SimpleTrayTabButton
                tabKey="convenience"
                isActive={displayedTab === "convenience"}
                isAvailable
                onClick={() => {
                  markBoardInteraction();
                  setActiveTab("convenience");
                }}
              />
            ) : null}
          </Flex>
          <Flex
            flex="1"
            minW="0"
            h="100%"
            gap="10px"
            overflowX="auto"
            overflowY="hidden"
            px="10px"
            pt="18px"
            pb="10px"
            alignItems="flex-start"
            wrap="nowrap"
            alignContent="flex-start"
          >
            {displayedTab === "metro"
              ? metroTrayTiles.map((tile) => {
                const nextInstanceId = tile.instanceIds.find(
                  (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                );
                const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                return (
                  <Flex
                    key={tile.stackId}
                    minW="84px"
                    w="84px"
                    h="84px"
                    borderRadius="2px"
                    overflow="hidden"
                    bgColor="#F3E8D0"
                    border="none"
                    boxShadow="none"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    position="relative"
                    draggable={canDrag}
                    cursor={canDrag ? "grab" : "not-allowed"}
                    opacity={canDrag ? 1 : 0.48}
                    onDragStart={(event) => {
                      if (!nextInstanceId) {
                        event.preventDefault();
                        return;
                      }
                      markBoardInteraction();
                      setDragPayload(event, { routeId: nextInstanceId });
                    }}
                    title={tile.label}
                  >
                    <GridPattern
                      pattern={tile.pattern}
                      centerEmoji={tile.centerEmoji}
                      imagePath={tile.imagePath}
                      overlayIconPath={tile.overlayIconPath}
                    />
                    {tile.remainingCount > 1 ? (
                      <Flex
                        position="absolute"
                        right="4px"
                        bottom="4px"
                        minW="26px"
                        h="26px"
                        px="6px"
                        borderRadius="999px"
                        bgColor="rgba(248,246,242,0.96)"
                        border="2px solid #A58A6C"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="#9D7859" fontSize="15px" fontWeight="800" lineHeight="1">
                          {tile.remainingCount}
                        </Text>
                      </Flex>
                    ) : null}
                  </Flex>
                );
              })
              : displayedTab === "street"
                ? streetTrayTiles.map((tile) => {
                  const nextInstanceId = tile.instanceIds.find(
                    (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                  );
                  const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                  return (
                    <Flex
                      key={tile.stackId}
                      minW="94px"
                      w="94px"
                      h="94px"
                      borderRadius="2px"
                      overflow="hidden"
                      bgColor="#F3E8D0"
                      border="none"
                      boxShadow="none"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      position="relative"
                      draggable={canDrag}
                      cursor={canDrag ? "grab" : "not-allowed"}
                      opacity={canDrag ? 1 : 0.48}
                      onDragStart={(event) => {
                        if (!nextInstanceId) {
                          event.preventDefault();
                          return;
                        }
                        markBoardInteraction();
                        setDragPayload(event, { routeId: nextInstanceId });
                      }}
                      title={tile.label}
                    >
                      <GridPattern
                        pattern={tile.pattern}
                        centerEmoji={tile.centerEmoji}
                        imagePath={tile.imagePath}
                        overlayIconPath={tile.overlayIconPath}
                      />
                      {tile.remainingCount > 1 ? (
                        <Flex
                          position="absolute"
                          right="4px"
                          bottom="4px"
                          minW="26px"
                          h="26px"
                          px="6px"
                          borderRadius="999px"
                          bgColor="rgba(248,246,242,0.96)"
                          border="2px solid #A58A6C"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#9D7859" fontSize="15px" fontWeight="800" lineHeight="1">
                            {tile.remainingCount}
                          </Text>
                        </Flex>
                      ) : null}
                    </Flex>
                  );
                })
              : displayedTab === "convenience"
                ? convenienceTrayTiles.map((tile) => {
                  const nextInstanceId = tile.instanceIds.find(
                    (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                  );
                  const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                  return (
                    <Flex
                      key={tile.stackId}
                      minW="94px"
                      w="94px"
                      h="94px"
                      borderRadius="2px"
                      overflow="hidden"
                      bgColor="#F3E8D0"
                      border="none"
                      boxShadow="none"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      position="relative"
                      draggable={canDrag}
                      cursor={canDrag ? "grab" : "not-allowed"}
                      opacity={canDrag ? 1 : 0.48}
                      onDragStart={(event) => {
                        if (!nextInstanceId) {
                          event.preventDefault();
                          return;
                        }
                        markBoardInteraction();
                        setDragPayload(event, { routeId: nextInstanceId });
                      }}
                      title={tile.label}
                    >
                      <GridPattern
                        pattern={tile.pattern}
                        centerEmoji={tile.centerEmoji}
                        imagePath={tile.imagePath}
                        overlayIconPath={tile.overlayIconPath}
                      />
                      {tile.remainingCount > 1 ? (
                        <Flex
                          position="absolute"
                          right="4px"
                          bottom="4px"
                          minW="26px"
                          h="26px"
                          px="6px"
                          borderRadius="999px"
                          bgColor="rgba(248,246,242,0.96)"
                          border="2px solid #A58A6C"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#9D7859" fontSize="15px" fontWeight="800" lineHeight="1">
                            {tile.remainingCount}
                          </Text>
                        </Flex>
                      ) : null}
                    </Flex>
                  );
                })
              : routeTrayTiles.map((tile) => (
                <Flex
                  key={tile.id}
                  minW="84px"
                  w="84px"
                  h="84px"
                  borderRadius="2px"
                  overflow="hidden"
                  bgColor="#F3E8D0"
                  border="none"
                  boxShadow="none"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  draggable
                  cursor="grab"
                  onDragStart={(event) => {
                    markBoardInteraction();
                    setDragPayload(event, { routeId: tile.id });
                  }}
                  title={`拖曳放入格子：${tile.label}`}
                >
                  <GridPattern
                    pattern={tile.pattern}
                    imagePath={tile.imagePath}
                    overlayIconPath={tile.overlayIconPath}
                  />
                </Flex>
              ))}
          </Flex>
        </Flex>
        <Flex
          minH="92px"
          bgColor="#B88E6D"
          alignItems="center"
          justifyContent="flex-end"
          px="18px"
          py="12px"
          borderTopLeftRadius="18px"
          borderTopRightRadius="18px"
        >
          <Flex
            as="button"
            w="100%"
            maxW="134px"
            h="50px"
            borderRadius="999px"
            bgColor="white"
            color="#986E53"
            fontSize="18px"
            fontWeight="800"
            alignItems="center"
            justifyContent="center"
            cursor={isRouteConnected ? "pointer" : "not-allowed"}
            opacity={isRouteConnected ? 1 : 0.5}
            pointerEvents={activeDepartureTransition ? "none" : "auto"}
            flexShrink={0}
            onClick={() => {
              if (!isRouteConnected) return;
              markBoardInteraction();
              handleDeparture();
            }}
          >
            出發！
          </Flex>
        </Flex>
      </Flex>

      {activeEventId === "metro-seat-choice" ? (
        <MetroSeatEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onChooseOption={(option) => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              actionPower: Math.max(0, Math.min(6, prev.actionPower + (option === "sit" ? 1 : -1))),
              fatigue: Math.max(0, prev.fatigue + (option === "stand" ? -10 : 0)),
            }));
          }}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "office-sunbeast-chicken" ? (
        <OfficeSunbeastChickenEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={(fatigueIncrease) => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + fatigueIncrease),
            }));
            recordWorkShiftResult(fatigueIncrease);
            onProgressSaved?.();
            finishEventFlow(() => {
              router.push(ROUTES.gameScene(OFFWORK_SCENE_ID));
            });
          }}
        />
      ) : null}

      {activeEventId === "bus-sunbeast-cat" ? (
        <BusSunbeastCatEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            const progress = loadPlayerProgress();
            const hasCatItems =
              progress.inventoryItems.includes("yarn") &&
              progress.inventoryItems.includes("cat-treat") &&
              progress.inventoryItems.includes("cat-grass");
            if (hasCatItems && !progress.hasTriggeredBusSunbeastCatEvent) {
              consumeInventoryItems("yarn", 1);
              consumeInventoryItems("cat-treat", 1);
              consumeInventoryItems("cat-grass", 1);
              markBusSunbeastCatEventTriggered();
              onProgressSaved?.();
            }
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-commute-laugh" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_COMMUTE_LAUGH_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_COMMUTE_LAUGH_EVENT_COPY.line}
          effectText={METRO_COMMUTE_LAUGH_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-backpack-hit" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_BACKPACK_HIT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_BACKPACK_HIT_EVENT_COPY.line}
          effectText={METRO_BACKPACK_HIT_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 10),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-card-search" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_CARD_SEARCH_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_CARD_SEARCH_EVENT_COPY.line}
          effectText={METRO_CARD_SEARCH_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-kid-cry" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_KID_CRY_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_KID_CRY_EVENT_COPY.line}
          effectText={METRO_KID_CRY_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-door-sprint" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_DOOR_SPRINT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_DOOR_SPRINT_EVENT_COPY.line}
          effectText={METRO_DOOR_SPRINT_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            finishEventFlow();
          }}
        />
      ) : null}

      <DiaryOverlay
        open={isSunbeastDexOpen}
        mode={sunbeastDiaryMode}
        revealEntryId={sunbeastDiaryRevealEntryId}
        unlockedEntryIds={unlockedDiaryEntryIds}
        onDiaryRevealEntryComplete={handleSunbeastDiaryClose}
        onClose={handleSunbeastDiaryClose}
        onGuidedFlowComplete={handleSunbeastDiaryClose}
      />

      {activeEventId === "metro-pet-stroller" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_PET_STROLLER_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_PET_STROLLER_EVENT_COPY.line}
          effectText={METRO_PET_STROLLER_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue - 20),
            }));
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-milk-tea-shoes" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_MILK_TEA_SHOES_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_MILK_TEA_SHOES_EVENT_COPY.line}
          effectText={METRO_MILK_TEA_SHOES_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 15),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-cute-bag-chat" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_CUTE_BAG_CHAT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_CUTE_BAG_CHAT_EVENT_COPY.line}
          effectText={METRO_CUTE_BAG_CHAT_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue - 10),
            }));
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-seat-spread" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_SEAT_SPREAD_EVENT_COPY.sceneTitle}
          backgroundImage="/images/428出圖/背景/捷運.png"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_SEAT_SPREAD_EVENT_COPY.line}
          effectText={METRO_SEAT_SPREAD_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 30),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-first-sunbeast-dog" ? (
        <MetroFirstSunbeastDogEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            unlockDiaryEntry("bai-entry-1");
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "metro-sunbeast-goat" ? (
        <MetroSunbeastGoatEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "breakfast-shop-choice" || activeEventId === "breakfast-bus-stop-unlock" ? (
        <BreakfastShopEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          forceOwnerChat={activeEventId === "breakfast-bus-stop-unlock"}
          hasUnlockedBusStop={rewardPlaceTiles.some((tile) => tile.category === "place" && tile.sourceId === "bus-stop")}
          onUnlockBusStop={() => {
            grantEventRewardTile(
              "bus-stop",
              [
                [0, 0, 0],
                [0, 1, 1],
                [0, 1, 0],
              ],
              {
                category: "place",
                label: "公車站",
                centerEmoji: "🚌",
              },
            );
            onProgressSaved?.();
            pushUnlockFeedback([
              {
                id: `place-bus-stop-${Date.now()}`,
                badge: "🚌",
                title: "新地點解鎖：公車站",
                description: "之後可以把公車站拼圖放進路線，拓展新的通勤選項。",
                tone: "place",
              },
              {
                id: `event-bus-${Date.now()}`,
                badge: "✨",
                title: "新事件類型開啟",
                description: "公車相關事件已加入可遇見內容。",
                tone: "event",
              },
            ]);
          }}
          onChooseOption={(option) => {
            onPlayerStatusChange((prev) => {
              if (option === "takeout") {
                return {
                  ...prev,
                  savings: Math.max(0, prev.savings - 1),
                  fatigue: Math.max(0, prev.fatigue - 5),
                };
              }
              if (option === "dinein") {
                return {
                  ...prev,
                  savings: Math.max(0, prev.savings - 1),
                  actionPower: Math.max(0, prev.actionPower - 1),
                  fatigue: Math.max(0, prev.fatigue - 8),
                };
              }
              return prev;
            });
          }}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "convenience-store-hub" ? (
        <ConvenienceStoreHubEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={({ purchasedItemId, purchasedPrice }: ConvenienceStoreFinishPayload) => {
            if (purchasedItemId) {
              onPlayerStatusChange((prev) => ({
                ...prev,
                savings: Math.max(0, prev.savings - purchasedPrice),
              }));
              grantInventoryItem(purchasedItemId);
              onProgressSaved?.();
            }
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "street-cookie-sale" ? (
        <StreetCookieEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onChooseOption={(option) => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              savings: Math.max(0, prev.savings + (option === "buy" ? -2 : 0)),
              actionPower: Math.max(0, Math.min(6, prev.actionPower + (option === "buy" ? 1 : 0))),
              fatigue: Math.max(0, prev.fatigue + (option === "decline" ? 5 : 0)),
            }));
            if (option === "decline") {
              markNegativeEventToday();
              onProgressSaved?.();
            }
          }}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "street-forgot-lunch-frog" ? (
        <StreetForgotLunchFrogEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onUnlockConvenienceStore={() => {}}
          onFinish={() => {
            markStreetForgotLunchFrogEventCompleted();
            const progress = loadPlayerProgress();
            savePlayerProgress({
              ...progress,
              hasUnlockedSunbeastFrogHint: true,
            });
            unlockDiaryEntry("bai-entry-2");
            onProgressSaved?.();
            setActiveEventId(null);
            openSunbeastDiaryBeforeContinue(() => {
              finishEventFlow();
            }, {
              mode: "diary-reveal",
              revealEntryId: "bai-entry-2",
            });
          }}
        />
      ) : null}

      {activeEventId === "street-comfy-breeze" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          line={STREET_BREEZE_EVENT_COPY.line}
          effectText={STREET_BREEZE_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue - 5),
            }));
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "street-humid-weather" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          line={STREET_HUMID_EVENT_COPY.line}
          effectText={STREET_HUMID_EVENT_COPY.effect}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              actionPower: Math.max(0, prev.actionPower - 1),
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "park-hub" ? (
        <ParkHubEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onTakeRest={(fatigueReduction) => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue - fatigueReduction),
            }));
          }}
          onWanderAround={() => {
            const parkEventPool: GameEventId[] = ["park-gossip"];
            const randomIndex = Math.floor(Math.random() * parkEventPool.length);
            setActiveEventId(parkEventPool[randomIndex]);
          }}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "park-gossip" ? (
        <ParkGossipEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activePlaceUnlockIntroId ? (
        <PlaceUnlockIntroOverlay
          placeId={activePlaceUnlockIntroId}
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onConfirm={handlePlaceUnlockIntroConfirm}
        />
      ) : null}

      {activeDepartureTransition ? (
        <Flex
          key={`departure-transition-${activeDepartureTransition.nonce}`}
          position="absolute"
          inset="0"
          zIndex={90}
          pointerEvents="none"
          overflow="hidden"
          bg="#F7F0E6"
        >
          <Box
            position="absolute"
            left="-452px"
            top="-25px"
            w="2568px"
            h="723px"
            animation={`${departureMrtPan} ${DEPARTURE_TRANSITION_DURATION_MS}ms linear both`}
          >
            <img
              src="/images/loading/wake_up.jpg"
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
            />
          </Box>

          <Flex
            position="absolute"
            right="18px"
            top="33px"
            w="126px"
            h="39px"
            align="flex-start"
            overflow="visible"
            filter="drop-shadow(0 3px 0 rgba(255,255,255,0.85))"
            aria-label="走走小日"
          >
            {[0, 1, 2, 3].map((index) => (
              <Box
                key={index}
                position="relative"
                w={index === 3 ? "28px" : "33px"}
                h="39px"
                overflow="hidden"
                animation={`${
                  index % 2 === 0 ? departureLogoFloatUp : departureLogoFloatDown
                } ${index === 1 ? 1.34 : index === 2 ? 1.18 : index === 3 ? 1.42 : 1.26}s cubic-bezier(0.45, 0, 0.25, 1) infinite`}
                style={{ animationDelay: `${index * -0.18}s` }}
              >
                <img
                  src="/images/logo/logo_svg.svg"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: `${index * -33}px`,
                    top: 0,
                    width: "132px",
                    height: "40px",
                    maxWidth: "none",
                  }}
                />
              </Box>
            ))}
          </Flex>

          {activeDepartureTransition.unlockCue ? (
            <Flex
              position="absolute"
              left="50%"
              top="92px"
              transform="translateX(-50%)"
              w="calc(100% - 44px)"
              maxW="306px"
              direction="column"
              gap="6px"
              px="14px"
              py="11px"
              borderRadius="14px"
              bg="rgba(249,244,235,0.94)"
              border="1px solid #D9B996"
              boxShadow="0 10px 20px rgba(92, 65, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.72)"
            >
              <Box
                position="absolute"
                left="11px"
                right="11px"
                top="6px"
                h="1px"
                bg="rgba(178,141,105,0.34)"
              />
              <Flex align="center" justify="space-between" gap="10px">
                <Flex direction="column" gap="4px" minW="0">
                  <Text color="#B28D69" fontSize="10px" fontWeight="900" letterSpacing="0.12em" lineHeight="1">
                    ROUTE CLUE
                  </Text>
                  <Text color="#6D4B1F" fontSize="15px" fontWeight="900" lineHeight="1.2">
                    {activeDepartureTransition.unlockCue.title}
                  </Text>
                </Flex>
                <Flex
                  minW="46px"
                  h="28px"
                  px="9px"
                  borderRadius="8px"
                  align="center"
                  justify="center"
                  bg="#FFF0A8"
                  border="1px solid #C3A580"
                  color="#7F6441"
                  transform="rotate(2deg)"
                >
                  <Text fontSize="12px" fontWeight="900" lineHeight="1">
                    {activeDepartureTransition.unlockCue.badge}
                  </Text>
                </Flex>
              </Flex>
              <Text color="#7F6441" fontSize="12px" fontWeight="700" lineHeight="1.5">
                {activeDepartureTransition.unlockCue.description}
              </Text>
            </Flex>
          ) : null}

          <Box
            position="absolute"
            left="50%"
            bottom="172px"
            transform="translateX(-50%)"
          >
            <img
              src="/images/mai/walk.gif"
              alt="小麥走路"
              style={{
                height: "276px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 6px 9px rgba(72,54,38,0.16))",
              }}
            />
          </Box>

          <Box
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            h="156px"
            bg="#F9F4EB"
            borderTop="1px solid #D9B996"
            overflow="hidden"
          >
            {departureMapPoints.map((point, index) => {
              const isMiddlePoint = index > 0 && index < departureMapPoints.length - 1;
              return (
                <Box
                  key={point.key}
                  position="absolute"
                  left={`${point.positionPercent}%`}
                  top={isMiddlePoint ? "23px" : "29px"}
                  w={isMiddlePoint ? "42px" : "45px"}
                  h={isMiddlePoint ? "42px" : "45px"}
                  transform="translateX(-50%)"
                  zIndex={2}
                >
                  <Image
                    src={point.visual.iconPath}
                    alt={point.visual.label}
                    w="100%"
                    h="100%"
                    objectFit="contain"
                  />
                </Box>
              );
            })}
            <Box
              position="absolute"
              left="17px"
              right="17px"
              bottom="45px"
              h="15px"
              bg="#D2BA9D"
              border="1px solid #C3A580"
              borderRadius="999px"
              zIndex={1}
            >
              <Flex position="absolute" inset="0" px="9px" align="center" justify="space-between">
                {[0, 0.25, 0.5, 0.75, 1].map((point, index) => (
                  <Box
                    key={point}
                    w={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                    h={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                    borderRadius="999px"
                    bg={departureTravelProgress >= point ? "#FFF0A8" : "#F8E8AF"}
                    border={index === 0 || index === 2 || index === 4 ? "1px solid #B28D69" : "0"}
                  />
                ))}
              </Flex>
            </Box>
            <Box
              position="absolute"
              left={`${departureMaiMapLeftPercent}%`}
              top="76px"
              w="48px"
              h="38px"
              transform="translateX(-50%)"
              filter="drop-shadow(0 2px 0 rgba(255,255,255,0.55))"
              zIndex={3}
            >
              <Image
                src="/images/icon/icon_mai.png"
                alt="小麥目前位置"
                w="100%"
                h="100%"
                objectFit="contain"
                animation={`${departureMaiIconTilt} 0.72s ease-in-out infinite`}
                transformOrigin="50% 80%"
              />
            </Box>
          </Box>
        </Flex>
      ) : null}

      {isWorkTransitionOpen ? (
        <WorkTransitionModal
          onFinish={() => {
            setIsWorkTransitionOpen(false);
            if (workShiftCount === 0) {
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(ROUTES.gameScene(OFFWORK_SCENE_ID));
              return;
            }
            setIsWorkMinigameOpen(true);
          }}
        />
      ) : null}

      {workShiftCount > 0 && isWorkMinigameOpen ? (
        <WorkMinigameTestModal
          baseFatigue={playerStatus.fatigue}
          onSkip={() => {
            setIsWorkMinigameOpen(false);
            recordWorkShiftResult(18);
            onProgressSaved?.();
            router.push(ROUTES.gameScene(OFFWORK_SCENE_ID));
          }}
          onComplete={() => {
            setIsWorkMinigameOpen(false);
            recordWorkShiftResult(0);
            onProgressSaved?.();
            router.push(ROUTES.gameScene(OFFWORK_SCENE_ID));
          }}
        />
      ) : null}

      {isTutorialModalOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={65}
          bgColor="rgba(31,24,18,0.42)"
          alignItems="center"
          justifyContent="center"
          px="14px"
        >
          <Flex
            w="100%"
            maxW="420px"
            borderRadius="14px"
            overflow="hidden"
            bgColor="white"
            border="2px solid #C89C6E"
            boxShadow="0 14px 30px rgba(0,0,0,0.3)"
          >
            <Flex
              w="100%"
              direction="column"
            >
              <Flex h="60px" px="24px" bgColor="#B88E6D" alignItems="center">
                <Text color="white" fontSize="17px" lineHeight="1.4" fontWeight="800">
                  {tutorialStep.title}
                </Text>
              </Flex>
              <Flex direction="column" px="22px" pt="24px" pb="22px" gap="14px" alignItems="center">
                <TutorialIllustration kind={tutorialStep.kind} />
                <TutorialDescription
                  text={tutorialStep.description}
                  accentText={
                    "accentText" in tutorialStep
                      ? (tutorialStep as { accentText?: string }).accentText
                      : undefined
                  }
                />
                <Flex
                  as="button"
                  mt="8px"
                  minW="146px"
                  h="44px"
                  borderRadius="999px"
                  bgColor="#C4A06E"
                  border="2px solid #A9814F"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={() => {
                    if (tutorialStepIndex < tutorialSteps.length - 1) {
                      setTutorialStepIndex((prev) => prev + 1);
                      return;
                    }
                    closeTutorialModal();
                  }}
                >
                  <Text color="white" fontSize="17px" fontWeight="800">
                    {tutorialStep.buttonLabel}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {activeArrangeRoutePromptId === "intro-depart-to-metro" ? (
        <ArrangeRouteDialogOverlay
          speaker="小麥"
          text="出發去捷運站吧"
          avatarSpriteId="mai"
          avatarFrameIndex={0}
          onContinue={() => setActiveArrangeRoutePromptId(null)}
        />
      ) : null}

      {isMapOverlayOpen ? (
        <ArrangeRouteMapOverlay
          placeUnlockSnapshot={placeUnlockSnapshot}
          coinCount={playerStatus.savings}
          canRedeemStreet={hasSeenSunbeastFirstReveal}
          onRedeemMetro={handleRedeemMetroTile}
          onRedeemStreet={handleRedeemStreetTile}
          onClose={() => setIsMapOverlayOpen(false)}
        />
      ) : null}
    </Flex>
  );
}

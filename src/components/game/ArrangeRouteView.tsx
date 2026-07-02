"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw, FiX } from "react-icons/fi";
import { FaBook, FaLocationDot, FaPaw, FaTrainSubway } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import type { GameEventId } from "@/lib/game/events";
import {
  GAME_EVENT_LIST,
  BUS_BACKPACK_HIT_EVENT_COPY,
  BUS_BRAKE_FALL_EVENT_COPY,
  METRO_CUTE_BAG_CHAT_EVENT_COPY,
  METRO_CARD_SEARCH_EVENT_COPY,
  METRO_DOOR_SPRINT_EVENT_COPY,
  METRO_BACKPACK_HIT_EVENT_COPY,
  METRO_COMMUTE_LAUGH_EVENT_COPY,
  METRO_KID_CRY_EVENT_COPY,
  METRO_MILK_TEA_SHOES_EVENT_COPY,
  METRO_PET_STROLLER_EVENT_COPY,
  METRO_SEAT_SPREAD_EVENT_COPY,
  RESTAURANT_QUICK_MEAL_EVENT_COPY,
  STREET_BREEZE_EVENT_COPY,
  STREET_HUMID_EVENT_COPY,
} from "@/lib/game/events";
import { GAME_EVENT_CHEAT_TRIGGER } from "@/lib/game/eventCheatBus";
import { GAME_MARKETING_DIARY_THREAD_TRIGGER } from "@/lib/game/marketingDiaryThreadBus";
import {
  GAME_WORK_MINIGAME_CHEAT_TRIGGER,
  type WorkMinigameCheatPayload,
} from "@/lib/game/workMinigameCheatBus";
import { MetroSeatEventModal } from "@/components/game/events/MetroSeatEventModal";
import {
  BreakfastShopEventModal,
  BreakfastShopMaiClueEventModal,
} from "@/components/game/events/BreakfastShopEventModal";
import {
  ConvenienceStoreHubEventModal,
  type ConvenienceStoreFinishPayload,
} from "@/components/game/events/ConvenienceStoreHubEventModal";
import { ParkHubEventModal } from "@/components/game/events/ParkHubEventModal";
import { ParkGossipEventModal } from "@/components/game/events/ParkGossipEventModal";
import { StreetCookieEventModal } from "@/components/game/events/StreetCookieEventModal";
import {
  StreetExploreEventModal,
  type StreetExploreOutcome,
} from "@/components/game/events/StreetExploreEventModal";
import { StreetNoChoiceEventModal } from "@/components/game/events/StreetNoChoiceEventModal";
import { FrogDiaryClueEventModal } from "@/components/game/events/FrogDiaryClueEventModal";
import { MetroFirstSunbeastDogEventModal } from "@/components/game/events/MetroFirstSunbeastDogEventModal";
import { OfficeSunbeastChickenEventModal } from "@/components/game/events/OfficeSunbeastChickenEventModal";
import { OfficeSunbeastKoalaEventModal } from "@/components/game/events/OfficeSunbeastKoalaEventModal";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import { WorkMinigameTestModal } from "@/components/game/events/WorkMinigameTestModal";
import { WorkStampMinigameModal } from "@/components/game/events/WorkStampMinigameModal";
import { WorkPdfExportMinigameModal } from "@/components/game/events/WorkPdfExportMinigameModal";
import { OfficeChickenFocusMinigameModal } from "@/components/game/events/OfficeChickenFocusMinigameModal";
import { ParkOstrichTickleMinigameModal } from "@/components/game/events/ParkOstrichTickleMinigameModal";
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
  grantEventRewardTile,
  loadPlayerProgress,
  buildStreetVisitProgress,
  getPlaceUnlockSnapshot,
  markMetroSeatSpreadEventTriggered,
  markMetroBackpackHitEventTriggered,
  markOfficeSunbeastKoalaEventTriggered,
  markStreetForgotLunchFrogEventCompleted,
  markNegativeEventToday,
  recordBreakfastShopMaiClueVisit,
  recordDependentCoworkerRequestCompleted,
  recordStreetForgotLunchFrogPhotoAttempt,
  recordWorkShiftResult,
  recordArrangeRouteDeparture,
  savePlayerProgress,
  shouldTriggerOfficeSunbeastKoalaEvent,
  syncDerivedPlaceUnlocks,
  unlockBaiEntry2SecondFragment,
  unlockDiaryEntry,
  FIRST_STREET_REWARD_PATTERNS,
  type DiaryEntryId,
  type PlaceTileId,
  type RewardPlaceTile,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";
import { DiaryOverlay, type DiaryOverlayMode } from "@/components/game/DiaryOverlay";
import { PlaceUnlockIntroOverlay } from "@/components/game/PlaceUnlockIntroOverlay";
import {
  ENABLE_DEPENDENT_COWORKER_REQUEST_WORK_FLOW,
  getWorkMinigameKindForSceneId,
  type WorkMinigameKind,
} from "@/lib/game/workTransition";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  getFrogDiaryClueStageByAttempt,
  getFrogDiaryClueStageByEventId,
} from "@/lib/game/frogDiaryClueFlow";

const DEFAULT_BOARD_COLS = 3;
const DEFAULT_BOARD_ROWS = 4;
const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const STORY_ROUTE_DEPARTURE_STORAGE_KEY = "moment:story-route-departure-itinerary";
const INTRO_BOARD_COLS = 1;
const INTRO_BOARD_ROWS = 3;
const SECOND_BOARD_COLS = 1;
const SECOND_BOARD_ROWS = 4;
const CONVENIENCE_BOARD_COLS = 2;
const CONVENIENCE_BOARD_ROWS = 4;
const SPECIAL_MAP_BOARD_COLS = 3;
const SPECIAL_MAP_BOARD_ROWS = 4;
const EXPANDED_BOARD_COLS = 4;
const EXPANDED_BOARD_ROWS = 5;
const INTRO_START_POS = { r: 2, c: 0 };
const INTRO_END_POS = { r: 0, c: 0 };
const SECOND_START_POS = { r: 3, c: 0 };
const SECOND_END_POS = { r: 0, c: 0 };
const CONVENIENCE_START_POS = { r: 3, c: 0 };
const CONVENIENCE_END_POS = { r: 0, c: 0 };
const CONVENIENCE_STORE_POS = { r: 1, c: 1 };
const SPECIAL_MAP_START_POS = { r: 3, c: 0 };
const ROUTE_TRAY_SCROLLBAR_CSS = {
  scrollbarWidth: "thin",
  scrollbarColor: "#C7A17C rgba(255, 248, 234, 0.76)",
  "&::-webkit-scrollbar": {
    height: "7px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(255, 248, 234, 0.76)",
    borderRadius: "999px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#C7A17C",
    border: "2px solid rgba(255, 248, 234, 0.9)",
    borderRadius: "999px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#B98A62",
  },
} as const;
const SPECIAL_MAP_END_POS = { r: 0, c: 2 };
const SPECIAL_MAP_MYSTERY_POS = { r: 2, c: 1 };
const SPECIAL_MAP_HIDDEN_POSITIONS = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
  { r: 3, c: 1 },
  { r: 3, c: 2 },
] as const;
const SPECIAL_MAP_ROTATION_LIMIT = 8;
const SPECIAL_MAP_PLAY_HINT = "提示：轉彎拼圖可以重複使用、點擊旋轉。問號不可以移動";
const DEFAULT_START_POS = { r: 3, c: 1 };
const SHIFTED_START_POS = { r: 3, c: 2 };
const EXPANDED_START_POS = { r: 4, c: 3 };
const DEFAULT_END_POS = { r: 0, c: 1 };
const EXPANDED_END_POS = { r: 0, c: 2 };
const ENABLE_PLACE_GUIDANCE_SYSTEM = false;
const ENABLE_ARRANGE_ROUTE_TUTORIALS = false;
const ENABLE_ARRANGE_ROUTE_LEGACY_HINTS = false;
const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen-v2";
const ARRANGE_ROUTE_TILE_TUTORIAL_SEEN_KEY = "moment:arrange-route-tile-tutorial-seen";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY = "moment:arrange-route-convenience-tutorial-seen";
const STREET_EXPLORE_CHEAT_TRIGGER = "moment:street-explore-cheat-trigger";

type DependentCoworkerRequestConfig = {
  requestNumber: 1 | 2 | 3;
  taskId: string;
  preludeDialogue: string;
  minigameTitle: string;
  successRewardLabel: string;
  successFootnote: string;
};

const DEPENDENT_COWORKER_REQUESTS: DependentCoworkerRequestConfig[] = [
  {
    requestNumber: 1,
    taskId: "dependent-coworker-cabinet",
    preludeDialogue:
      "同事跑來拜託小麥整理櫃子，說只要把東西擺整齊，後面找資料就會快很多。",
    minigameTitle: "整理櫃子",
    successRewardLabel: "櫃子整理完成",
    successFootnote: "先用便利貼整理暫代櫃子排序",
  },
  {
    requestNumber: 2,
    taskId: "dependent-coworker-shredded-document",
    preludeDialogue:
      "同事不小心把重要公文丟進碎紙機，只好拜託小麥一起把文件拼回來。",
    minigameTitle: "拼回公文",
    successRewardLabel: "公文暫時拼回",
    successFootnote: "先用便利貼整理暫代碎紙拼回",
  },
  {
    requestNumber: 3,
    taskId: "dependent-coworker-mixed-meeting-files",
    preludeDialogue:
      "同事把明天早上會議要用的重要文件搞混了，只好再次拜託小麥幫忙整理。",
    minigameTitle: "整理會議文件",
    successRewardLabel: "會議文件整理完成",
    successFootnote: "先用便利貼整理暫代文件分類",
  },
];
const REQUIRED_DEPENDENT_COWORKER_REQUESTS_BEFORE_ROOSTER = DEPENDENT_COWORKER_REQUESTS.length;

function getDependentCoworkerRequestConfig(
  progress: ReturnType<typeof loadPlayerProgress>,
) {
  if (!progress.hasCompletedStreetForgotLunchFrogEvent) return null;
  if (progress.hasPendingFrogReturnHomeDiaryGuide) return null;
  if (!progress.unlockedDiaryEntryIds.includes("bai-entry-5")) {
    return null;
  }
  return DEPENDENT_COWORKER_REQUESTS[progress.dependentCoworkerRequestCount] ?? null;
}

function hasCompletedKoalaCoworkerRequests(progress: ReturnType<typeof loadPlayerProgress>) {
  return progress.dependentCoworkerRequestCount >= REQUIRED_DEPENDENT_COWORKER_REQUESTS_BEFORE_ROOSTER;
}

const SECOND_TUTORIAL_ROUTE_REWARDS = [
  {
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ] as number[][],
    label: "一般 1",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1],
    ] as number[][],
    label: "一般 2",
    centerEmoji: "🛣️",
  },
  {
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ] as number[][],
    label: "一般 3",
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
const FIRST_STREET_REWARD_LABELS = [
  "寬接窄街道 1",
  "寬接窄街道 2",
  "寬接窄街道 3",
  "窄街道 1",
  "窄街道 2",
  "窄接寬街道 1",
  "窄接寬街道 2",
] as const;
const ARRANGE_ROUTE_LOGIC_TUTORIAL_STEPS = [
  {
    title: "安排路線教學",
    description: "由下到上\n從家裡出發到公司",
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
    title: "一般教學",
    description: "除了地點拼圖外，還有一般",
    buttonLabel: "下一步",
    kind: "route-intro",
  },
  {
    title: "一般教學",
    description: "一般沒有地點，但可以連接成路線",
    buttonLabel: "下一步",
    kind: "route-connect",
  },
];
const ARRANGE_ROUTE_TILE_TUTORIAL_REWARD_STEP = {
  title: "一般教學",
  description: "獲得三個一般",
  buttonLabel: "開始",
  kind: "reward",
} as const;
const ARRANGE_ROUTE_TILE_TUTORIAL_REPLAY_FINAL_STEP = {
  title: "安排路線教學",
  description: "獲得三個一般",
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
    description: "收到第一項任務！\n同時經過捷運和街道",
    accentText: "捷運和街道",
    buttonLabel: "確認",
    kind: "place-mission-first-task",
  },
] as const;
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_STEPS = [
  {
    title: "便利商店教學",
    description: "偶爾路線旁會有隱藏地點出現，有機會的話，去路過吧！\n不想路過，想直接去上班，也可以。",
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
const routeBoardSideArrowFloat = keyframes`
  0% {
    transform: translate3d(0, 42px, 0);
    opacity: 0;
  }
  24%, 72% {
    opacity: 1;
  }
  100% {
    transform: translate3d(0, -42px, 0);
    opacity: 0;
  }
`;
const routeBoardSideArrowDismiss = keyframes`
  0%, 94% {
    opacity: 1;
    visibility: visible;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
`;
const puzzleTypeTabGuideTap = keyframes`
  0%, 100% {
    transform: translate3d(0, -2px, 0) rotate(180deg);
  }
  52% {
    transform: translate3d(0, 8px, 0) rotate(180deg) scale(0.94);
  }
`;
const specialMapGuideTap = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) rotate(-8deg);
  }
  48% {
    transform: translate3d(-8px, -8px, 0) rotate(-8deg);
  }
  64% {
    transform: translate3d(-12px, -10px, 0) rotate(-8deg) scale(0.92);
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
const METRO_DAILY_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "metro-seat-spread",
  "metro-seat-spread",
  "metro-seat-spread",
  "metro-backpack-hit",
  "metro-backpack-hit",
  "metro-backpack-hit",
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
const BUS_DAILY_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "bus-brake-fall",
  "bus-backpack-hit",
];
const TILE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "metro-station::111_010_111": "/images/route/route_new/wide_to_wide_捷運.png",
  "default::010_010_010": "/images/route/rt_010_010_010.png",
};
const START_HOME_WIDE_IMAGE_PATH = "/images/route/start_end_new/start_home_wide.jpg";
const START_HOME_NARROW_IMAGE_PATH = "/images/route/start_end_new/start_home_narrow.jpg";
const END_COMPANY_NARROW_IMAGE_PATH = "/images/route/start_end_new/end_company_narror.jpg";
const HEBAN_SPECIAL_MAP_START_IMAGE_PATH = "/images/route/route_new/straight_早餐店.png";
const ROUTE_NEW_PLACE_IMAGE_BY_SOURCE_AND_PATTERN_KEY: Record<string, Record<string, string>> = {
  "metro-station": {
    "111_010_010": "/images/route/route_new/wide_to_narrow_捷運.png",
    "010_010_010": "/images/route/route_new/straight_捷運.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_捷運.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_捷運.png",
  },
  "convenience-store": {
    "111_010_010": "/images/route/route_new/wide_to_narrow_超商.png",
    "010_010_010": "/images/route/route_new/straight_超商.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_超商.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_超商.png",
  },
  street: {
    "111_010_010": "/images/route/route_new/wide_to_narrow_街道.png",
    "010_010_010": "/images/route/route_new/straight_街道.png",
    "111_010_111": "/images/route/route_new/wide_to_wide_街道.png",
    "010_010_111": "/images/route/route_new/narrow_to_wide_街道.png",
  },
};
const ROUTE_NEW_PLACE_SOURCE_IDS = new Set(["metro-station", "convenience-store", "street"]);
const LEGACY_METRO_ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "111_010_111": "/images/route/rt_MRT_111_010_111.png",
  "111_010_010": "/images/route/rt_MRT_111_010_010.jpg",
  "010_010_111": "/images/route/rt_MRT_010_010_111.jpg",
};
const METRO_ROUTE_IMAGE_BY_PATTERN_KEY: Record<string, string> = {
  "111_010_111": "/images/route/route_new/wide_to_wide_捷運.png",
  "111_010_010": "/images/route/rt_MRT_111_010_010.jpg",
  "010_010_111": "/images/route/rt_MRT_010_010_111.jpg",
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
const CONVENIENCE_STORE_STRAIGHT_PATTERN = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0],
] as number[][];
const CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH = "/images/route/straight_v1_mart.png";
const SPECIAL_CORNER_ROUTE_PREFIX = "special-corner::";
const SPECIAL_NORMAL_CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const SPECIAL_MYSTERY_CORNER_IMAGE_PATH = "/images/route/mystery_corner_leftTop.png";
type SpecialMysteryCornerCandidate = {
  id: "left-top" | "right-top" | "right-bottom" | "left-bottom";
  connector: Connector;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
};
const SPECIAL_MYSTERY_CORNER_CANDIDATES: SpecialMysteryCornerCandidate[] = [
  {
    id: "left-top",
    connector: { top: [1], right: [], bottom: [], left: [1] },
    rotationDeg: 0,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "right-top",
    connector: { top: [1], right: [1], bottom: [], left: [] },
    rotationDeg: 90,
    offsetX: 1,
    offsetY: -1,
  },
  {
    id: "right-bottom",
    connector: { top: [], right: [1], bottom: [1], left: [] },
    rotationDeg: 180,
    offsetX: 1,
    offsetY: 1,
  },
  {
    id: "left-bottom",
    connector: { top: [], right: [], bottom: [1], left: [1] },
    rotationDeg: -90,
    offsetX: -1,
    offsetY: 1,
  },
];
type SpecialCornerId = SpecialMysteryCornerCandidate["id"];
const DEFAULT_SPECIAL_CORNER_ID: SpecialCornerId = "left-top";
const SPECIAL_CORNER_ROTATION_ORDER: SpecialCornerId[] = [
  "left-top",
  "right-top",
  "right-bottom",
  "left-bottom",
];

function buildSpecialCornerRouteId(cornerId: SpecialCornerId = DEFAULT_SPECIAL_CORNER_ID) {
  return `${SPECIAL_CORNER_ROUTE_PREFIX}${cornerId}`;
}

function isSpecialCornerRouteId(routeId: string) {
  return routeId.startsWith(SPECIAL_CORNER_ROUTE_PREFIX);
}

function getSpecialCornerCandidate(routeId: string) {
  if (!isSpecialCornerRouteId(routeId)) return null;
  const cornerId = routeId.slice(SPECIAL_CORNER_ROUTE_PREFIX.length) as SpecialCornerId;
  return (
    SPECIAL_MYSTERY_CORNER_CANDIDATES.find((candidate) => candidate.id === cornerId) ??
    SPECIAL_MYSTERY_CORNER_CANDIDATES[0]
  );
}

function rotateSpecialCornerRouteId(routeId: string) {
  const currentCandidate = getSpecialCornerCandidate(routeId) ?? SPECIAL_MYSTERY_CORNER_CANDIDATES[0];
  const currentIndex = SPECIAL_CORNER_ROTATION_ORDER.indexOf(currentCandidate.id);
  const nextId =
    SPECIAL_CORNER_ROTATION_ORDER[(currentIndex + 1) % SPECIAL_CORNER_ROTATION_ORDER.length];
  return buildSpecialCornerRouteId(nextId);
}

function patternToKey(pattern: number[][]) {
  return pattern
    .map((row) => row.map((value) => (value === 1 ? "1" : "0")).join(""))
    .join("_");
}

function resolveRouteNewPlaceTileImagePath(sourceId: string | undefined, patternKey: string) {
  if (!sourceId) return undefined;
  return ROUTE_NEW_PLACE_IMAGE_BY_SOURCE_AND_PATTERN_KEY[sourceId]?.[patternKey];
}

function resolvePlaceTileEmbeddedImagePath(params: {
  tileId: string;
  sourceId?: string;
  pattern: number[][];
}) {
  const { tileId, sourceId, pattern } = params;
  const patternKey = patternToKey(pattern);
  const routeNewImagePath = resolveRouteNewPlaceTileImagePath(sourceId, patternKey);
  if (routeNewImagePath) return routeNewImagePath;

  const isMetroTile =
    tileId === "metro-station" ||
    tileId.startsWith("metro-station-") ||
    sourceId === "metro-station";
  if (isMetroTile) {
    return METRO_ROUTE_IMAGE_BY_PATTERN_KEY[patternKey];
  }
  if (sourceId === "convenience-store" && patternKey === patternToKey(CONVENIENCE_STORE_STRAIGHT_PATTERN)) {
    return CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH;
  }
  if (sourceId === "convenience-store" && patternKey === patternToKey(CONVENIENCE_STORE_FIXED_PATTERN)) {
    return "/images/route/rt_store_010,110,000.jpg";
  }
  return undefined;
}

function resolvePlaceTileLegacyImagePath(params: {
  tileId?: string;
  sourceId?: string;
  pattern: number[][];
}) {
  const patternKey = patternToKey(params.pattern);
  if (params.sourceId === "metro-station") {
    return LEGACY_METRO_ROUTE_IMAGE_BY_PATTERN_KEY[patternKey] ?? ROUTE_IMAGE_BY_PATTERN_KEY[patternKey];
  }
  if (params.sourceId === "convenience-store" && patternKey === patternToKey(CONVENIENCE_STORE_STRAIGHT_PATTERN)) {
    return CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH;
  }
  if (params.sourceId === "convenience-store" && patternKey === patternToKey(CONVENIENCE_STORE_FIXED_PATTERN)) {
    return "/images/route/rt_store_010,110,000.jpg";
  }
  return ROUTE_IMAGE_BY_PATTERN_KEY[patternKey];
}

function resolvePlaceTileImageFallbackPath(params: {
  tileId?: string;
  sourceId?: string;
  pattern: number[][];
}) {
  if (!params.sourceId || !ROUTE_NEW_PLACE_SOURCE_IDS.has(params.sourceId)) return undefined;
  return resolvePlaceTileLegacyImagePath(params);
}

function resolvePlaceTileImagePath(params: {
  tileId: string;
  sourceId?: string;
  pattern: number[][];
}) {
  const { tileId, sourceId, pattern } = params;
  const patternKey = patternToKey(pattern);
  const embeddedImagePath = resolvePlaceTileEmbeddedImagePath(params);
  if (embeddedImagePath) return embeddedImagePath;

  const routeImagePath = resolveRouteTileImagePath(pattern, sourceId);
  if (routeImagePath) return routeImagePath;
  const defaultImagePath = TILE_IMAGE_BY_PATTERN_KEY[`default::${patternKey}`];
  if (defaultImagePath) return defaultImagePath;
  return undefined;
}

function resolveRouteTileImagePath(pattern: number[][], sourceId?: string) {
  const key = patternToKey(pattern);
  if (sourceId === "metro-station") {
    const metroImagePath = METRO_ROUTE_IMAGE_BY_PATTERN_KEY[key];
    if (metroImagePath) return metroImagePath;
  }
  return ROUTE_IMAGE_BY_PATTERN_KEY[key];
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
  const existingPatternCounts = rewardPlaceTiles
    .filter((tile) => tile.category === "place" && tile.sourceId === "street")
    .reduce<Record<string, number>>((counts, tile) => {
      const key = patternToKey(tile.pattern);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});

  return FIRST_STREET_REWARD_PATTERNS.every((pattern) => {
    const key = patternToKey(pattern);
    const count = existingPatternCounts[key] ?? 0;
    if (count <= 0) return false;
    existingPatternCounts[key] = count - 1;
    return true;
  });
}

function buildMissingFirstStreetRewardTiles(
  rewardPlaceTiles: Array<{ category: "place" | "route"; sourceId?: string; pattern: number[][] }>,
) {
  const existingPatternCounts = rewardPlaceTiles
    .filter((tile) => tile.category === "place" && tile.sourceId === "street")
    .reduce<Record<string, number>>((counts, tile) => {
      const key = patternToKey(tile.pattern);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});

  return FIRST_STREET_REWARD_PATTERNS.flatMap((pattern, index) => {
    const key = patternToKey(pattern);
    const existingCount = existingPatternCounts[key] ?? 0;
    if (existingCount > 0) {
      existingPatternCounts[key] = existingCount - 1;
      return [];
    }
    return [
      {
        instanceId: `street-intro-${key}-${index}`,
        sourceId: "street" as const,
        category: "place" as const,
        label: FIRST_STREET_REWARD_LABELS[index] ?? `街道 ${index + 1}`,
        centerEmoji: "💡",
        pattern,
      },
    ];
  });
}

function resolvePlaceTileOverlayIconPath(sourceId?: string) {
  if (sourceId === "metro-station") return "/images/icon/mrt.png";
  if (sourceId === "street") return "/images/icon/street.png";
  if (sourceId === "convenience-store") return "/images/icon/mart.png";
  if (sourceId === "park") return "/images/icon/park.png";
  if (sourceId === "breakfast-shop") return "/images/icon/breakfast.png";
  if (sourceId === "bus-stop") return "/images/icon/road.png";
  return undefined;
}

function resolvePlaceTileFallbackOverlayIconPath(params: {
  tileId: string;
  sourceId?: string;
  pattern: number[][];
}) {
  if (params.sourceId && ROUTE_NEW_PLACE_SOURCE_IDS.has(params.sourceId)) return undefined;
  if (resolvePlaceTileEmbeddedImagePath(params)) return undefined;
  return resolvePlaceTileOverlayIconPath(params.sourceId);
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
  sourceId?: PlaceTileId | "home" | "company" | "special-map";
};

type DepartureRouteWaypoint = {
  sourceId: PlaceTileId;
  visual: DepartureMapVisual;
  distance: number;
};

function resolveDepartureVisualFromSource(sourceId: string): DepartureMapVisual | null {
  if (sourceId === "metro-station") return { label: "捷運", iconPath: "/images/icon/mrt.png" };
  if (sourceId === "convenience-store") return { label: "便利商店", iconPath: "/images/icon/mart.png" };
  if (sourceId === "breakfast-shop") return { label: "早餐店", iconPath: "/images/icon/breakfast.png" };
  if (sourceId === "street") return { label: "街道", iconPath: "/images/icon/street.png" };
  if (sourceId === "park") return { label: "公園", iconPath: "/images/icon/park.png" };
  if (sourceId === "bus-stop") return { label: "公車站", iconPath: "/images/icon/road.png" };
  if (sourceId === "special-map") return { label: "?", iconPath: "/images/icon/mystery.png" };
  return null;
}

const STORY_ROUTE_ITINERARY_SOURCE_IDS = new Set<PlaceTileId>([
  "metro-station",
  "street",
  "convenience-store",
  "breakfast-shop",
  "park",
  "bus-stop",
]);
const GAME_EVENT_ID_SET = new Set<GameEventId>(GAME_EVENT_LIST.map((event) => event.id));

function isStoryRouteItinerarySourceId(sourceId: unknown): sourceId is PlaceTileId {
  return typeof sourceId === "string" && STORY_ROUTE_ITINERARY_SOURCE_IDS.has(sourceId as PlaceTileId);
}

function isGameEventId(eventId: unknown): eventId is GameEventId {
  return typeof eventId === "string" && GAME_EVENT_ID_SET.has(eventId as GameEventId);
}

function resolveFrogDiaryClueSourceId(routeTileId: string): PlaceTileId | null {
  if (routeTileId === "shop") return "convenience-store";
  if (routeTileId === "street") return "street";
  if (routeTileId === "restaurant") return "breakfast-shop";
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
  imageFallbackPath?: string;
  overlayIconPath?: string;
};
type RoutePaletteTile = RouteTile & {
  pairIds?: [string, string];
};
type ArrangeDragPayload = {
  routeId: string;
  sourceCell?: number;
};
type ArrangeDragPreviewState = ArrangeDragPayload & {
  x: number;
  y: number;
  size: number;
};
type PlaceTileStackItem = {
  stackId: string;
  sourceId: string;
  label: string;
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  imageFallbackPath?: string;
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
  imageFallbackPath?: string;
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
    label: "一般",
    icon: FaTrainSubway,
  },
  pet: {
    label: "小日獸",
    icon: FaPaw,
  },
};

function isSecondTutorialRouteLabel(label?: string) {
  return Boolean(label?.startsWith("一般 ") || label?.startsWith("一般地圖 "));
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
// Home now sits at the bottom and exits upward into the route.
const START_CONNECTOR: Connector = {
  top: [0, 1, 2],
  right: [],
  bottom: [],
  left: [],
};
const NARROW_START_CONNECTOR: Connector = {
  top: [1],
  right: [],
  bottom: [],
  left: [],
};
const END_CONNECTOR: Connector = { top: [], right: [], bottom: [1], left: [] };

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

function hasOpenConnectorMatch(a: number[], b: number[]) {
  return a.length > 0 && isExactMatch(a, b);
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
      ? startImagePath ?? START_HOME_WIDE_IMAGE_PATH
      : END_COMPANY_NARROW_IMAGE_PATH;
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

function SpecialCornerRouteVisual({
  candidate,
  imagePath = SPECIAL_NORMAL_CORNER_IMAGE_PATH,
  alt = "特殊地圖轉角路徑",
  isMystery = false,
}: {
  candidate: SpecialMysteryCornerCandidate;
  imagePath?: string;
  alt?: string;
  isMystery?: boolean;
}) {
  return (
    <Flex
      pointerEvents="none"
      w="92%"
      h="92%"
      borderRadius="4px"
      overflow="hidden"
      border={isMystery ? "2px solid #FAD267" : "2px solid rgba(157,156,160,0.76)"}
      bgColor="#C2DB99"
      alignItems="center"
      justifyContent="center"
      position="relative"
      boxShadow={isMystery ? "0 3px 8px rgba(147,117,59,0.14)" : "none"}
    >
      <img
        src={imagePath}
        alt={alt}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transform: `translate3d(${candidate.offsetX}px, ${candidate.offsetY}px, 0) rotate(${candidate.rotationDeg}deg)`,
          transition: "transform 180ms ease",
        }}
      />
    </Flex>
  );
}

function SpecialMysteryCornerVisual({
  candidate,
  matchCount,
}: {
  candidate: SpecialMysteryCornerCandidate;
  matchCount: number;
}) {
  return (
    <Flex
      pointerEvents="none"
      w="100%"
      h="100%"
      alignItems="center"
      justifyContent="center"
      position="relative"
      boxShadow={matchCount > 0 ? "0 0 0 3px rgba(122,200,192,0.18)" : "none"}
      transition="box-shadow 180ms ease"
    >
      <SpecialCornerRouteVisual
        candidate={candidate}
        imagePath={SPECIAL_MYSTERY_CORNER_IMAGE_PATH}
        alt="特殊地圖未知轉角路徑"
        isMystery
      />
    </Flex>
  );
}

function GridPattern({
  pattern,
  centerEmoji,
  imagePath,
  imageFallbackPath,
  overlayIconPath,
  isSolidPreview = false,
}: {
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
  imageFallbackPath?: string;
  overlayIconPath?: string;
  isSolidPreview?: boolean;
}) {
  if (imagePath || overlayIconPath) {
    return (
      <Flex
        w="100%"
        h="100%"
        borderRadius="8px"
        overflow="hidden"
        bgColor={isSolidPreview ? "#F8E7CD" : "rgba(255,255,255,0.55)"}
        position="relative"
      >
        {imagePath ? (
          <img
            src={imagePath}
            alt="拼圖圖塊"
            draggable={false}
            onError={(event) => {
              if (!imageFallbackPath) return;
              const image = event.currentTarget;
              if (image.src.includes(imageFallbackPath)) return;
              image.src = imageFallbackPath;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 1 }}
          />
        ) : null}
        {overlayIconPath ? (
          <Box
            position="absolute"
            right="5%"
            bottom="5%"
            w="55%"
            h="55%"
          >
            <img
              src={overlayIconPath}
              alt="地點圖示"
              draggable={false}
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
      bgColor={isSolidPreview ? "#F8E7CD" : "transparent"}
    >
      {flat.map((point, index) => {
        const isCenterCell = index === 4;
        return (
          <Box
            key={index}
            bgColor={point ? "#A38765" : isSolidPreview ? "#FFF8EA" : "rgba(255,255,255,0.36)"}
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
  const startTile = START_HOME_WIDE_IMAGE_PATH;
  const goodRouteFromHome = "/images/route/rt_010_010_111.jpg";
  const wrongRoute = "/images/route/rt_100_010_001.jpg";
  const routeB = "/images/route/rt_010_010_010.png";
  const routeTileIntro = "/images/route/rt_1111_010_010.jpg";
  const routeTileConnect = "/images/route/rt_010_010_010.png";
  const secondTutorialRewardImages = SECOND_TUTORIAL_ROUTE_REWARDS.map((tile, index) => ({
    src: resolveRouteTileImagePath(tile.pattern),
    alt: `一般${index + 1}`,
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
          <Flex direction="column" alignItems="center" gap="10px" color="#C49268">
            <img
              src="/images/icon/company.png"
              alt="公司"
              style={{ width: "56px", height: "56px", objectFit: "contain", display: "block" }}
            />
            <Text fontSize="32px" fontWeight="500" lineHeight="1">↑</Text>
            <img
              src="/images/icon/house.png"
              alt="家"
              style={{ width: "56px", height: "56px", objectFit: "contain", display: "block" }}
            />
          </Flex>
        </Flex>
      );
    case "start":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          <TutorialTileImage src={startTile} alt="從家的拼圖開始" w="96px" h="96px" />
        </Flex>
      );
    case "edge":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(goodRouteFromHome, startTile)}
        </Flex>
      );
    case "match":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(
            routeB,
            goodRouteFromHome,
            <Text color="#2AB9D7" fontSize="30px" fontWeight="700">○</Text>,
          )}
        </Flex>
      );
    case "mismatch":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          {stackLayout(
            wrongRoute,
            goodRouteFromHome,
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
          <TutorialTileImage src={routeTileIntro} alt="一般" w="96px" h="96px" />
        </Flex>
      );
    case "route-connect":
      return (
        <Flex alignItems="center" justifyContent="center" minH="190px">
          <TutorialTileImage src={routeTileConnect} alt="連接一般" w="96px" h="96px" />
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
        : "一般";
  const alt =
    tabKey === "metro"
      ? "捷運拼圖"
      : tabKey === "street"
        ? "街道拼圖"
        : tabKey === "convenience"
          ? "便利商店拼圖"
          : tabKey === "park"
            ? "公園拼圖"
        : "一般";
  return (
    <Flex
      as="button"
      h="38px"
      minW="84px"
      flexShrink={0}
      borderRadius="999px"
      bgColor={isActive ? "#B98A62" : "#FFF8EA"}
      border={`2px solid ${isActive ? "#A77A56" : "#E3C7A4"}`}
      alignItems="center"
      justifyContent="center"
      gap="6px"
      px="12px"
      position="relative"
      boxShadow={isActive ? "0 5px 12px rgba(142,99,61,0.18)" : "0 3px 8px rgba(142,99,61,0.1)"}
      transition="background-color 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease"
      _hover={
        isAvailable
          ? {
              bgColor: isActive ? "#AD7F59" : "#FFFCF4",
              borderColor: isActive ? "#966D4D" : "#D7B68F",
              transform: "translateY(-1px)",
              boxShadow: isActive ? "0 6px 14px rgba(142,99,61,0.2)" : "0 5px 12px rgba(142,99,61,0.14)",
            }
          : undefined
      }
      _active={
        isAvailable
          ? {
              transform: "translateY(1px) scale(0.98)",
              boxShadow: "0 2px 6px rgba(142,99,61,0.16)",
            }
          : undefined
      }
      onClick={() => {
        if (!isAvailable) return;
        onClick();
      }}
      cursor={isAvailable ? "pointer" : "not-allowed"}
      opacity={isAvailable ? 1 : 0.46}
    >
      <Flex
        w={isActive ? "30px" : "22px"}
        h={isActive ? "26px" : "22px"}
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
        borderRadius="999px"
        bgColor={isActive ? "rgba(255, 248, 234, 0.92)" : "transparent"}
      >
        <img
          src={imagePath}
          alt={alt}
          style={{
            width: "22px",
            height: "22px",
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />
      </Flex>
      <Text
        color={isActive ? "#FFFFFF" : "#9B7354"}
        fontSize="13px"
        fontWeight="800"
        lineHeight="1"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    </Flex>
  );
}

function StackedTrayTile({
  size,
  count,
  canDrag,
  title,
  onPointerDown,
  children,
}: {
  size: number;
  count: number;
  canDrag: boolean;
  title: string;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const hasStack = count > 1;
  const outerSize = size + (hasStack ? 10 : 0);
  const tileSize = `${size}px`;

  return (
    <Flex
      minW={`${outerSize}px`}
      w={`${outerSize}px`}
      h={`${outerSize}px`}
      flexShrink={0}
      position="relative"
      alignItems="flex-start"
      justifyContent="flex-start"
      cursor={canDrag ? "grab" : "not-allowed"}
      opacity={canDrag ? 1 : 0.48}
      touchAction="none"
      userSelect="none"
      onPointerDown={canDrag ? onPointerDown : undefined}
      title={title}
    >
      {hasStack ? (
        <>
          <Flex
            position="absolute"
            left="0"
            top="5px"
            zIndex={0}
            w={tileSize}
            h={tileSize}
            borderRadius="5px"
            overflow="hidden"
            bgColor="#D8BF9C"
            border="1px solid rgba(255, 249, 239, 0.58)"
            outline="1px solid rgba(145, 103, 66, 0.2)"
            boxShadow="-3px 4px 8px rgba(92, 63, 38, 0.12), 0 9px 14px rgba(92, 63, 38, 0.16)"
            transform="rotate(-1.4deg)"
            transformOrigin="center"
            alignItems="center"
            justifyContent="center"
            filter="brightness(0.72) saturate(0.82)"
            pointerEvents="none"
            aria-hidden="true"
          >
            {children}
            <Box position="absolute" inset="0" bgColor="rgba(104, 74, 48, 0.22)" />
            <Box
              position="absolute"
              inset="0"
              boxShadow="inset 0 1px 0 rgba(255,255,255,0.48), inset -2px -2px 4px rgba(92,63,38,0.1)"
            />
          </Flex>
          <Flex
            position="absolute"
            left="5px"
            top="0"
            zIndex={1}
            w={tileSize}
            h={tileSize}
            borderRadius="5px"
            overflow="hidden"
            bgColor="#E8D2B1"
            border="1px solid rgba(255, 249, 239, 0.68)"
            outline="1px solid rgba(145, 103, 66, 0.16)"
            boxShadow="-2px 3px 7px rgba(92, 63, 38, 0.1), 0 7px 12px rgba(92, 63, 38, 0.13)"
            transform="rotate(1.1deg)"
            transformOrigin="center"
            alignItems="center"
            justifyContent="center"
            filter="brightness(0.82) saturate(0.88)"
            pointerEvents="none"
            aria-hidden="true"
          >
            {children}
            <Box position="absolute" inset="0" bgColor="rgba(104, 74, 48, 0.12)" />
            <Box
              position="absolute"
              inset="0"
              boxShadow="inset 0 1px 0 rgba(255,255,255,0.52), inset -2px -2px 4px rgba(92,63,38,0.08)"
            />
          </Flex>
        </>
      ) : null}
      <Flex
        position="relative"
        zIndex={2}
        left={hasStack ? "6px" : "0"}
        top={hasStack ? "6px" : "0"}
        w={tileSize}
        h={tileSize}
        borderRadius="5px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={hasStack ? "1px solid rgba(255, 249, 239, 0.78)" : "none"}
        outline={hasStack ? "1px solid rgba(145, 103, 66, 0.14)" : "none"}
        boxShadow={hasStack ? "-2px 3px 6px rgba(92, 63, 38, 0.08), 0 10px 16px rgba(92, 63, 38, 0.18)" : "none"}
        alignItems="center"
        justifyContent="center"
      >
        {children}
        {hasStack ? (
          <Box
            position="absolute"
            inset="0"
            pointerEvents="none"
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.44), inset 0 -2px 4px rgba(92,63,38,0.06)"
          />
        ) : null}
      </Flex>
      {hasStack ? (
        <Flex
          position="absolute"
          top="-2px"
          right="-1px"
          zIndex={3}
          h="24px"
          minW="34px"
          px="7px"
          borderRadius="999px"
          bgColor="#FFF9ED"
          border="2px solid #B98A62"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 2px 5px rgba(111, 78, 48, 0.18)"
        >
          <Text color="#956B4E" fontSize="13px" fontWeight="900" lineHeight="1">
            ×{count}
          </Text>
        </Flex>
      ) : null}
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
  /** 是否已從早餐店老闆娘取得河畔線索 */
  hasLearnedBaiSecretBaseHeban?: boolean;
  /** 是否曾獲得特殊地圖，用於線索與舊存檔相容 */
  hasUnlockedSpecialMap?: boolean;
  /** 是否持有尚未使用的特殊地圖拼圖 */
  hasAvailableSpecialMapPuzzle?: boolean;
  /** 是否已看過特殊地圖切換提示 */
  hasSeenSpecialMapGuide?: boolean;
  /** 是否已看過特殊地圖旋轉挑戰玩法提示 */
  hasSeenSpecialMapRotationGuide?: boolean;
  hasSeenSunbeastFirstReveal?: boolean;
  unlockedDiaryEntryIds?: DiaryEntryId[];
  initialEventId?: GameEventId;
  initialFrogRouteReturnMode?: "offwork" | null;
  initialStreetExplore?: boolean;
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
  hasLearnedBaiSecretBaseHeban = false,
  hasUnlockedSpecialMap = false,
  hasAvailableSpecialMapPuzzle = false,
  hasSeenSpecialMapGuide = false,
  hasSeenSpecialMapRotationGuide = false,
  hasSeenSunbeastFirstReveal = false,
  unlockedDiaryEntryIds = [],
  initialEventId,
  initialFrogRouteReturnMode = null,
  initialStreetExplore = false,
  placeUnlockSnapshot,
  onProgressSaved,
}: ArrangeRouteViewProps) {
  const router = useRouter();
  const isIntroArrange = arrangeRouteAttempt === 1;
  const isSecondArrange = arrangeRouteAttempt === 2;
  const isThirdArrange = arrangeRouteAttempt === 3;
  const useSimpleArrangeUi = true;
  const [placedRoutes, setPlacedRoutes] = useState<Record<number, string>>({});
  const [activeMapKind, setActiveMapKind] = useState<"normal" | "special">("normal");
  const [specialMapRotationCount, setSpecialMapRotationCount] = useState(0);
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [dragPreview, setDragPreview] = useState<ArrangeDragPreviewState | null>(null);
  const [activeTab, setActiveTab] = useState<ArrangeTabKey>("metro");
  const [dropError, setDropError] = useState("");
  const [isDropErrorVisible, setIsDropErrorVisible] = useState(false);
  const [dropMessageType, setDropMessageType] = useState<"error" | "hint">("error");
  const [isSpecialMapRotationLimitModalOpen, setIsSpecialMapRotationLimitModalOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<GameEventId | null>(null);
  const activeFrogDiaryClueStage =
    activeEventId === "street-forgot-lunch-frog"
      ? getFrogDiaryClueStageByAttempt(loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount)
      : getFrogDiaryClueStageByEventId(activeEventId);
  const shouldReturnToOffworkAfterFrogClue =
    initialFrogRouteReturnMode === "offwork" && Boolean(activeFrogDiaryClueStage);
  const [isStreetExploreOpen, setIsStreetExploreOpen] = useState(false);
  const [isWorkTransitionOpen, setIsWorkTransitionOpen] = useState(false);
  const [isWorkMinigameOpen, setIsWorkMinigameOpen] = useState(false);
  const [forcedWorkMinigameKind, setForcedWorkMinigameKind] = useState<WorkMinigameKind | null>(null);
  const activeDependentCoworkerRequest =
    ENABLE_DEPENDENT_COWORKER_REQUEST_WORK_FLOW && workShiftCount > 0
      ? getDependentCoworkerRequestConfig(loadPlayerProgress())
      : null;
  const activeWorkMinigameKind =
    forcedWorkMinigameKind ??
    (activeDependentCoworkerRequest
      ? "sticky-notes"
      : getWorkMinigameKindForSceneId("scene-98-work", workShiftCount));
  const shouldOpenWorkMinigameAfterTransition = Boolean(activeWorkMinigameKind);
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
  const [sunbeastDiaryUnlockedEntryIds, setSunbeastDiaryUnlockedEntryIds] =
    useState<DiaryEntryId[]>(unlockedDiaryEntryIds);
  const [sunbeastInitialCardId, setSunbeastInitialCardId] = useState<string | null>(null);
  const [isStreetUnlockOverlayOpen, setIsStreetUnlockOverlayOpen] = useState(false);
  const [isConvenienceStoreIntroOpen, setIsConvenienceStoreIntroOpen] = useState(false);
  const [convenienceStoreIntroStep, setConvenienceStoreIntroStep] =
    useState<ConvenienceStoreIntroStep>("beigo");
  const [thirdArrangeIntroStep, setThirdArrangeIntroStep] = useState<ThirdArrangeIntroStep>("unlock");
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isStoryRouteTutorialFlow, setIsStoryRouteTutorialFlow] = useState(false);
  const [hasMetroGuideGrabbed, setHasMetroGuideGrabbed] = useState(false);
  const [consumedPlaceTileInstanceIds, setConsumedPlaceTileInstanceIds] = useState<string[]>([]);
  const [isPuzzleTypeTabGuideActive, setIsPuzzleTypeTabGuideActive] = useState(false);
  const [unlockFeedbackItems, setUnlockFeedbackItems] = useState<UnlockFeedbackItem[]>([]);
  const [activePlaceUnlockIntroId, setActivePlaceUnlockIntroId] = useState<PlaceTileId | null>(null);
  const unlockFeedbackTimerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const placeUnlockIntroNextActionRef = useRef<(() => void) | null>(null);
  const sunbeastDiaryNextActionRef = useRef<(() => void) | null>(null);
  const streetExploreNextActionRef = useRef<(() => void) | null>(null);
  const initialEventOpenedRef = useRef(false);
  const initialStreetExploreOpenedRef = useRef(false);
  const activePointerDragIdRef = useRef<number | null>(null);
  const pointerDragPayloadRef = useRef<ArrangeDragPayload | null>(null);
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
  const departureKeepOverlayAfterFinishRef = useRef(false);
  const departureLastReachedSourceRef = useRef<DepartureMapPoint["sourceId"]>("home");
  const departureRouteMapPointsRef = useRef<DepartureMapPoint[] | null>(null);
  const storyRouteEventBySourceRef = useRef<Partial<Record<PlaceTileId, GameEventId>>>({});
  const pendingMetroAndStreetUnlockForDepartureRef = useRef(false);
  const forceOffworkAfterWorkTransitionRef = useRef(false);
  const routeTrayScrollerRef = useRef<HTMLDivElement | null>(null);
  const [routeTrayScrollState, setRouteTrayScrollState] = useState({
    scrollLeft: 0,
    clientWidth: 0,
    scrollWidth: 0,
  });
  const updateRouteTrayScrollState = () => {
    const scroller = routeTrayScrollerRef.current;
    if (!scroller) return;
    const next = {
      scrollLeft: scroller.scrollLeft,
      clientWidth: scroller.clientWidth,
      scrollWidth: scroller.scrollWidth,
    };
    setRouteTrayScrollState((prev) =>
      prev.scrollLeft === next.scrollLeft &&
      prev.clientWidth === next.clientWidth &&
      prev.scrollWidth === next.scrollWidth
        ? prev
        : next,
    );
  };

  const canUseSpecialMapPuzzle = hasUnlockedSpecialMap && hasAvailableSpecialMapPuzzle;
  const isSpecialMapBoard = canUseSpecialMapPuzzle && activeMapKind === "special";
  const shouldShowSpecialMapGuide =
    ENABLE_PLACE_GUIDANCE_SYSTEM && canUseSpecialMapPuzzle && !hasSeenSpecialMapGuide && activeMapKind === "normal";
  const shouldShowSpecialMapRotationGuide =
    ENABLE_PLACE_GUIDANCE_SYSTEM && isSpecialMapBoard && !hasSeenSpecialMapRotationGuide;
  const isConvenienceStoreBoard = !isSpecialMapBoard && hasCompletedStreetForgotLunchFrogEvent;
  const isStreetMissionAvailable =
    hasSeenSunbeastFirstReveal && !hasUnlockedConvenienceStore;
  const shouldShowStreetMission =
    ENABLE_PLACE_GUIDANCE_SYSTEM && isStreetMissionAvailable;
  const hasUnlockedDiaryEntries = unlockedDiaryEntryIds.length > 0;
  const isExpandedBoard = !isConvenienceStoreBoard && arrangeRouteAttempt >= 5 && hasPassedThroughStreet;

  useEffect(() => {
    setSunbeastDiaryUnlockedEntryIds(unlockedDiaryEntryIds);
  }, [unlockedDiaryEntryIds]);

  const boardCols = isIntroArrange
    ? INTRO_BOARD_COLS
    : isSpecialMapBoard
      ? SPECIAL_MAP_BOARD_COLS
    : isConvenienceStoreBoard
      ? CONVENIENCE_BOARD_COLS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_BOARD_COLS
    : isExpandedBoard
      ? EXPANDED_BOARD_COLS
      : DEFAULT_BOARD_COLS;
  const boardRows = isIntroArrange
    ? INTRO_BOARD_ROWS
    : isSpecialMapBoard
      ? SPECIAL_MAP_BOARD_ROWS
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
    : isSpecialMapBoard
      ? SPECIAL_MAP_START_POS
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
    : isSpecialMapBoard
      ? SPECIAL_MAP_END_POS
    : isConvenienceStoreBoard
      ? CONVENIENCE_END_POS
    : isSecondArrange || arrangeRouteAttempt >= 2
      ? SECOND_END_POS
    : isExpandedBoard
        ? EXPANDED_END_POS
        : DEFAULT_END_POS;
  const startCell = posToIndex(startPos.r, startPos.c);
  const endCell = posToIndex(endPos.r, endPos.c);
  const specialMapMysteryCell = isSpecialMapBoard
    ? posToIndex(SPECIAL_MAP_MYSTERY_POS.r, SPECIAL_MAP_MYSTERY_POS.c)
    : null;
  const blockedCells = useMemo(
    () => {
      if (isSpecialMapBoard) {
        return new Set(SPECIAL_MAP_HIDDEN_POSITIONS.map((pos) => posToIndex(pos.r, pos.c)));
      }
      if (isConvenienceStoreBoard) {
        return new Set([
          posToIndex(0, 1),
          posToIndex(3, 1),
        ]);
      }
      return new Set<number>();
    },
    [isConvenienceStoreBoard, isSpecialMapBoard, boardCols],
  );
  const fixedConvenienceStoreCell = isConvenienceStoreBoard
    ? posToIndex(CONVENIENCE_STORE_POS.r, CONVENIENCE_STORE_POS.c)
    : null;
  const startConnector = isConvenienceStoreBoard || isSpecialMapBoard ? NARROW_START_CONNECTOR : START_CONNECTOR;
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
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && syncedProgress.pendingPlaceUnlockIntroIds.length > 0) {
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
    options?: { mode?: DiaryOverlayMode; revealEntryId?: DiaryEntryId; initialCardId?: string | null },
  ) => {
    setSunbeastDiaryUnlockedEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
    setSunbeastDiaryMode(options?.mode ?? "sunbeast");
    setSunbeastDiaryRevealEntryId(options?.revealEntryId ?? "bai-entry-1");
    setSunbeastInitialCardId(options?.initialCardId ?? null);
    sunbeastDiaryNextActionRef.current = nextAction;
    setIsSunbeastDexOpen(true);
  };

  const openRoosterDiaryAfterKoalaCollection = (nextAction: () => void) => {
    markOfficeSunbeastKoalaEventTriggered();
    syncDerivedPlaceUnlocks();
    onProgressSaved?.();
    openSunbeastDiaryBeforeContinue(nextAction, {
      mode: "sunbeast-koala-reveal",
      revealEntryId: "bai-entry-3",
      initialCardId: "koala",
    });
  };

  const openJournalDiary = () => {
    if (!hasUnlockedDiaryEntries) return;
    const latestUnlockedEntryIds = loadPlayerProgress().unlockedDiaryEntryIds;
    setSunbeastDiaryUnlockedEntryIds(latestUnlockedEntryIds);
    sunbeastDiaryNextActionRef.current = null;
    setSunbeastDiaryMode("default");
    setSunbeastDiaryRevealEntryId(latestUnlockedEntryIds[0] ?? unlockedDiaryEntryIds[0] ?? "bai-entry-1");
    setSunbeastInitialCardId(null);
    setIsSunbeastDexOpen(true);
  };

  const openSunbeastDex = () => {
    if (!hasSeenSunbeastFirstReveal) return;
    setSunbeastDiaryUnlockedEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
    sunbeastDiaryNextActionRef.current = null;
    setSunbeastDiaryMode("sunbeast");
    setSunbeastDiaryRevealEntryId("bai-entry-1");
    setSunbeastInitialCardId(null);
    setIsSunbeastDexOpen(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleMarketingDiaryThread = () => {
      setSunbeastDiaryUnlockedEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
      sunbeastDiaryNextActionRef.current = null;
      setSunbeastDiaryMode("marketing-diary-thread");
      setSunbeastDiaryRevealEntryId("bai-entry-1");
      setSunbeastInitialCardId(null);
      setIsSunbeastDexOpen(true);
    };
    window.addEventListener(GAME_MARKETING_DIARY_THREAD_TRIGGER, handleMarketingDiaryThread);
    return () => {
      window.removeEventListener(GAME_MARKETING_DIARY_THREAD_TRIGGER, handleMarketingDiaryThread);
    };
  }, []);

  const handleSunbeastDiaryClose = () => {
    setIsSunbeastDexOpen(false);
    setSunbeastInitialCardId(null);
    const nextAction = sunbeastDiaryNextActionRef.current;
    sunbeastDiaryNextActionRef.current = null;
    nextAction?.();
  };

  const openStreetExplore = (nextAction?: () => void) => {
    const progress = loadPlayerProgress();
    const nextProgress = buildStreetVisitProgress(progress);
    savePlayerProgress(nextProgress);
    onProgressSaved?.();
    streetExploreNextActionRef.current = nextAction ?? startDepartureRouteFromCurrentLocation;
    setIsStreetExploreOpen(true);
  };

  const handleStreetExploreFinish = (
    outcome: StreetExploreOutcome,
    effect?: { fatigueDelta?: number },
  ) => {
    setIsStreetExploreOpen(false);

    if (outcome === "stroll") {
      onPlayerStatusChange((prev) => ({
        ...prev,
        fatigue: Math.max(0, prev.fatigue - 5),
      }));
    }
    if (outcome === "stationery-street" && typeof effect?.fatigueDelta === "number") {
      onPlayerStatusChange((prev) => ({
        ...prev,
        fatigue: Math.max(0, prev.fatigue + effect.fatigueDelta!),
      }));
      if (effect.fatigueDelta > 0) {
        markNegativeEventToday();
        onProgressSaved?.();
      }
    }
    const nextAction = streetExploreNextActionRef.current;
    streetExploreNextActionRef.current = null;
    const syncedProgress = syncDerivedPlaceUnlocks();
    onProgressSaved?.();
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && syncedProgress.pendingPlaceUnlockIntroIds.length > 0) {
      placeUnlockIntroNextActionRef.current = nextAction ?? startDepartureRouteFromCurrentLocation;
      setActivePlaceUnlockIntroId(syncedProgress.pendingPlaceUnlockIntroIds[0]);
      return;
    }
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
        .map((tile) => {
          const tileParams = {
            tileId: tile.instanceId,
            sourceId: tile.sourceId,
            pattern: tile.pattern,
          };
          return {
            id: tile.instanceId,
            sourceId: tile.sourceId,
            label: tile.label,
            pattern: tile.pattern,
            centerEmoji: tile.centerEmoji,
            imagePath: resolvePlaceTileImagePath(tileParams),
            imageFallbackPath: resolvePlaceTileImageFallbackPath(tileParams),
            overlayIconPath: resolvePlaceTileFallbackOverlayIconPath(tileParams),
            count: 1,
          };
        }),
    [rewardPlaceTiles],
  );
  const placeTileStacks = useMemo<PlaceTileStackItem[]>(() => {
    const candidates: PlaceTileCandidate[] = [
      ...BASE_PLACE_TILE_STOCKS.map((tile) => {
        const tileParams = {
          tileId: `base::${tile.sourceId}`,
          sourceId: tile.sourceId,
          pattern: tile.pattern as number[][],
        };
        return {
          id: `base::${tile.sourceId}`,
          sourceId: tile.sourceId,
          label: tile.label,
          pattern: tile.pattern as number[][],
          centerEmoji: tile.centerEmoji,
          imagePath: resolvePlaceTileImagePath(tileParams),
          imageFallbackPath: resolvePlaceTileImageFallbackPath(tileParams),
          overlayIconPath: resolvePlaceTileFallbackOverlayIconPath(tileParams),
          count: tile.count,
        };
      }),
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
          imageFallbackPath: item.imageFallbackPath,
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
          imageFallbackPath: stack.imageFallbackPath,
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
        ].map((item) => [item.id, item]),
      ) as Record<string, RouteTile>,
    [allPlaceTileInstances, routeTiles],
  );

  const tileEdgeMap = useMemo(
    () =>
      Object.fromEntries(
        [
          ...routeTiles,
          ...allPlaceTileInstances,
        ].map((tile) => [
          tile.id,
          getEdgeSlots(tile.pattern),
        ]),
      ) as Record<string, Connector>,
    [allPlaceTileInstances, routeTiles],
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

  useEffect(() => {
    if (canUseSpecialMapPuzzle) return;
    setActiveMapKind("normal");
    setSpecialMapRotationCount(0);
  }, [canUseSpecialMapPuzzle]);

  const switchArrangeMap = (nextKind: "normal" | "special") => {
    if (nextKind === activeMapKind) return;
    if (nextKind === "special") {
      const progress = loadPlayerProgress();
      if (!progress.hasSeenSpecialMapGuide) {
        savePlayerProgress({
          ...progress,
          hasSeenSpecialMapGuide: true,
        });
        onProgressSaved?.();
      }
    }
    setPlacedRoutes({});
    setSpecialMapRotationCount(0);
    setHoverCell(null);
    setDropError("");
    setIsDropErrorVisible(false);
    setActiveMapKind(nextKind);
  };

  const consumeSpecialMapPuzzle = () => {
    const progress = loadPlayerProgress();
    if (!progress.hasAvailableSpecialMapPuzzle) return;
    savePlayerProgress({
      ...progress,
      hasAvailableSpecialMapPuzzle: false,
    });
    onProgressSaved?.();
  };

  const canStartRoosterHebanEvent = () => {
    const progress = loadPlayerProgress();
    if (hasCompletedKoalaCoworkerRequests(progress)) return true;
    showDropToast(
      `先完成無尾熊線索中的同事請託（${progress.dependentCoworkerRequestCount}/${REQUIRED_DEPENDENT_COWORKER_REQUESTS_BEFORE_ROOSTER}），再前往河畔。`,
      {
        type: "hint",
        hideMs: 2600,
        clearMs: 3000,
      },
    );
    return false;
  };

  const startRoosterHebanEvent = () => {
    if (!canStartRoosterHebanEvent()) return false;
    consumeSpecialMapPuzzle();
    setActiveEventId("office-sunbeast-chicken");
    return true;
  };

  function setPendingSceneTransition(toSceneId: string, durationMs = 420) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      SCENE_TRANSITION_STORAGE_KEY,
      JSON.stringify({
        toSceneId,
        preset: "fade-black",
        durationMs,
        createdAt: Date.now(),
      }),
    );
  }

  function finishDepartureTransition() {
    if (departureTransitionTimerRef.current) {
      clearTimeout(departureTransitionTimerRef.current);
      departureTransitionTimerRef.current = null;
    }
    if (departureTransitionFrameRef.current !== null) {
      cancelAnimationFrame(departureTransitionFrameRef.current);
      departureTransitionFrameRef.current = null;
    }
    if (departureTransitionDestinationSourceRef.current) {
      departureLastReachedSourceRef.current = departureTransitionDestinationSourceRef.current;
      departureTransitionDestinationSourceRef.current = null;
    }
    const action = departureTransitionNextActionRef.current;
    departureTransitionNextActionRef.current = null;
    const shouldKeepOverlay = departureKeepOverlayAfterFinishRef.current;
    departureKeepOverlayAfterFinishRef.current = false;
    if (shouldKeepOverlay) {
      action?.();
      return;
    }
    setDepartureTravelProgress(0);
    setActiveDepartureTransition(null);
    action?.();
  }

  function startDepartureTransition(
    destinationLabel: string,
    nextAction?: () => void,
    mapLeg?: DepartureMapLeg,
    unlockCue?: DepartureUnlockCue,
    keepOverlayAfterFinish = false,
  ) {
    if (departureTransitionTimerRef.current) {
      clearTimeout(departureTransitionTimerRef.current);
    }
    if (departureTransitionFrameRef.current !== null) {
      cancelAnimationFrame(departureTransitionFrameRef.current);
      departureTransitionFrameRef.current = null;
    }
    departureTransitionNextActionRef.current = nextAction ?? null;
    departureKeepOverlayAfterFinishRef.current = keepOverlayAfterFinish;
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
        if (
          blockedCells.has(index) ||
          (fixedConvenienceStoreCell !== null && index === fixedConvenienceStoreCell) ||
          (specialMapMysteryCell !== null && index === specialMapMysteryCell)
        ) {
          changed = true;
          return;
        }
        next[index] = tileId;
      });
      return changed ? next : prev;
    });
  }, [blockedCells, boardCellCount, endCell, fixedConvenienceStoreCell, specialMapMysteryCell, startCell]);

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
  const isWideDragPreview = (routeId: string) =>
    Boolean(readPairRouteIds(routeId) || parsePairMarker(routeId));
  const renderDragPreviewTile = (routeId: string) => {
    const specialCorner = getSpecialCornerCandidate(routeId);
    if (specialCorner) {
      return <SpecialCornerRouteVisual candidate={specialCorner} />;
    }

    const pairIds = readPairRouteIds(routeId);
    if (pairIds) {
      const [leftId, rightId] = pairIds;
      const leftTile = tileMap[leftId];
      const rightTile = tileMap[rightId];
      if (!leftTile || !rightTile) return null;
      return (
        <GridPattern
          pattern={leftTile.pattern.map((row, rowIndex) => [
            ...row,
            ...rightTile.pattern[rowIndex],
          ])}
          centerEmoji="🧩"
          isSolidPreview
        />
      );
    }

    const pairMarker = parsePairMarker(routeId);
    if (pairMarker) {
      const leftTile = tileMap[pairMarker.leftId];
      const rightTile = tileMap[pairMarker.rightId];
      if (!leftTile || !rightTile) return null;
      return (
        <GridPattern
          pattern={leftTile.pattern.map((row, rowIndex) => [
            ...row,
            ...rightTile.pattern[rowIndex],
          ])}
          centerEmoji="🧩"
          isSolidPreview
        />
      );
    }

    const tile = tileMap[routeId];
    if (!tile) return null;
    return (
      <GridPattern
        pattern={tile.pattern}
        centerEmoji={tile.centerEmoji}
        imagePath={tile.imagePath}
        imageFallbackPath={tile.imageFallbackPath}
        overlayIconPath={tile.overlayIconPath}
        isSolidPreview
      />
    );
  };
  const getRouteCellIndexAtPoint = (x: number, y: number) => {
    if (typeof document === "undefined") return null;
    const target = document.elementFromPoint(x, y);
    const cellElement = target instanceof Element
      ? target.closest("[data-route-cell-index]")
      : null;
    if (!(cellElement instanceof HTMLElement)) return null;
    const cellIndex = Number(cellElement.dataset.routeCellIndex);
    return Number.isInteger(cellIndex) ? cellIndex : null;
  };
  const isRouteTrayDropPoint = (x: number, y: number) => {
    if (typeof document === "undefined") return false;
    const target = document.elementFromPoint(x, y);
    return target instanceof Element
      ? Boolean(target.closest("[data-route-tray-drop-zone='true']"))
      : false;
  };
  const startPointerDrag = (
    event: PointerEvent<HTMLDivElement>,
    payload: ArrangeDragPayload,
    preview: { size?: number } = {},
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    activePointerDragIdRef.current = event.pointerId;
    pointerDragPayloadRef.current = payload;
    setDragPreview({
      routeId: payload.routeId,
      sourceCell: payload.sourceCell,
      x: event.clientX,
      y: event.clientY,
      size: preview.size ?? 86,
    });
    setHoverCell(getRouteCellIndexAtPoint(event.clientX, event.clientY));
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

  const getStaticConnectorAtCellFromMap = (
    index: number,
    routeMap: Record<number, string>,
  ): Connector | null => {
    if (index === startCell) return startConnector;
    if (index === endCell) return endConnector;
    if (specialMapMysteryCell !== null && index === specialMapMysteryCell) return null;
    if (fixedConvenienceStoreCell !== null && index === fixedConvenienceStoreCell) {
      return getEdgeSlots(CONVENIENCE_STORE_FIXED_PATTERN);
    }
    const tileId = routeMap[index];
    if (!tileId) return null;
    const specialCorner = getSpecialCornerCandidate(tileId);
    if (specialCorner) return specialCorner.connector;
    const pair = parsePairMarker(tileId);
    if (pair) {
      return pair.side === "left"
        ? tileEdgeMap[pair.leftId] ?? null
        : tileEdgeMap[pair.rightId] ?? null;
    }
    return tileEdgeMap[tileId] ?? null;
  };

  const resolveSpecialMysteryCorner = (
    routeMap: Record<number, string>,
  ): { candidate: SpecialMysteryCornerCandidate; matchCount: number } => {
    const fallback = SPECIAL_MYSTERY_CORNER_CANDIDATES[0];
    if (specialMapMysteryCell === null) return { candidate: fallback, matchCount: 0 };

    const { r, c } = indexToPos(specialMapMysteryCell);
    const best = SPECIAL_MYSTERY_CORNER_CANDIDATES.reduce(
      (best, candidate) => {
        let matchCount = 0;
        let conflictCount = 0;

        (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
          const { dr, dc, opposite } = NEIGHBOR_MAP[dir];
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;

          const neighborConnector = getStaticConnectorAtCellFromMap(
            posToIndex(nr, nc),
            routeMap,
          );
          if (!neighborConnector) return;

          const selfSide = candidate.connector[dir];
          const neighborSide = neighborConnector[opposite];
          const eitherHasExit = selfSide.length > 0 || neighborSide.length > 0;
          if (!eitherHasExit) return;

          if (selfSide.length > 0 && isExactMatch(selfSide, neighborSide)) {
            matchCount += 1;
            return;
          }
          conflictCount += 1;
        });

        if (
          conflictCount < best.conflictCount ||
          (conflictCount === best.conflictCount && matchCount > best.matchCount)
        ) {
          return { candidate, matchCount, conflictCount };
        }
        return best;
      },
      { candidate: fallback, matchCount: 0, conflictCount: Number.POSITIVE_INFINITY },
    );
    return { candidate: best.candidate, matchCount: best.matchCount };
  };

  const getConnectorAtCellFromMap = (
    index: number,
    routeMap: Record<number, string>,
  ): Connector | null => {
    if (specialMapMysteryCell !== null && index === specialMapMysteryCell) {
      return resolveSpecialMysteryCorner(routeMap).candidate.connector;
    }
    return getStaticConnectorAtCellFromMap(index, routeMap);
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
        if (!hasOpenConnectorMatch(currentConnector[dir], neighborConnector[opposite])) return;
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
        if (!hasOpenConnectorMatch(currentConnector[dir], neighborConnector[opposite])) return;
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
        if (!hasOpenConnectorMatch(currentConnector[dir], neighborConnector[opposite])) return;
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
    if (
      blockedCells.has(cellIndex) ||
      (fixedConvenienceStoreCell !== null && cellIndex === fixedConvenienceStoreCell) ||
      (specialMapMysteryCell !== null && cellIndex === specialMapMysteryCell)
    ) {
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

  function resetSpecialMapPuzzle() {
    setPlacedRoutes({});
    setSpecialMapRotationCount(0);
    setHoverCell(null);
    dismissDropToast();
  }

  const getSpecialMapRotationCellIndices = (
    routeMap: Record<number, string>,
    cellIndex: number,
  ) => {
    const { r, c } = indexToPos(cellIndex);
    const rotationTargets = [cellIndex];
    (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).forEach((dir) => {
      const { dr, dc } = NEIGHBOR_MAP[dir];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return;
      const neighborIndex = posToIndex(nr, nc);
      const neighborRouteId = routeMap[neighborIndex];
      if (neighborRouteId && getSpecialCornerCandidate(neighborRouteId)) {
        rotationTargets.push(neighborIndex);
      }
    });
    return rotationTargets;
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

  const getEndpointAnchor = (endpointCell: number, endpointConnector: Connector) => {
    const side = (Object.keys(NEIGHBOR_MAP) as Array<keyof Connector>).find(
      (dir) => endpointConnector[dir].length > 0,
    );
    if (!side) return null;

    const { r, c } = indexToPos(endpointCell);
    const { dr, dc, opposite } = NEIGHBOR_MAP[side];
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= boardRows || nc < 0 || nc >= boardCols) return null;

    return {
      index: posToIndex(nr, nc),
      side,
      opposite,
    };
  };

  const hasBothEndpointAnchorsReady = (routeMap: Record<number, string>) => {
    const startAnchor = getEndpointAnchor(startCell, startConnector);
    const endAnchor = getEndpointAnchor(endCell, endConnector);
    if (!startAnchor || !endAnchor) return false;

    const afterStartConnector = getConnectorAtCellFromMap(startAnchor.index, routeMap);
    const beforeEndConnector = getConnectorAtCellFromMap(endAnchor.index, routeMap);

    return Boolean(
      afterStartConnector &&
      beforeEndConnector &&
      isExactMatch(startConnector[startAnchor.side], afterStartConnector[startAnchor.opposite]) &&
      isExactMatch(beforeEndConnector[endAnchor.opposite], endConnector[endAnchor.side]),
    );
  };

  const getEndpointMismatchCells = (routeMap: Record<number, string>) => {
    const startAnchor = getEndpointAnchor(startCell, startConnector);
    const endAnchor = getEndpointAnchor(endCell, endConnector);

    const mismatchCells: number[] = [];

    const afterStartConnector = startAnchor
      ? getConnectorAtCellFromMap(startAnchor.index, routeMap)
      : null;
    if (
      startAnchor &&
      afterStartConnector &&
      !isExactMatch(startConnector[startAnchor.side], afterStartConnector[startAnchor.opposite])
    ) {
      mismatchCells.push(startAnchor.index);
    }

    const beforeEndConnector = endAnchor
      ? getConnectorAtCellFromMap(endAnchor.index, routeMap)
      : null;
    if (
      endAnchor &&
      beforeEndConnector &&
      !isExactMatch(beforeEndConnector[endAnchor.opposite], endConnector[endAnchor.side])
    ) {
      mismatchCells.push(endAnchor.index);
    }

    return mismatchCells;
  };

  const handleDropToCell = (
    cellIndex: number,
    routeId: string,
    sourceCell?: number,
  ) => {
    if (isSpecialMapBoard) {
      const specialRouteId = getSpecialCornerCandidate(routeId)
        ? routeId
        : buildSpecialCornerRouteId();
      const isMovingExistingTile = typeof sourceCell === "number";
      const isReplacingTile = Boolean(placedRoutes[cellIndex]);
      if (!isMovingExistingTile && !isReplacingTile && specialMapActionCount >= specialMapActionLimit) {
        setDropMessageType("hint");
        setDropError("特殊地圖最多可以放 4 次，按重來可以重新安排");
        setIsDropErrorVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setIsDropErrorVisible(false);
        }, 1200);
        clearTimerRef.current = setTimeout(() => {
          setDropError("");
          setDropMessageType("error");
        }, 1600);
        return;
      }
      setPlacedRoutes((prev) => {
        const next = { ...prev };
        if (isMovingExistingTile) removePlacedAtCell(next, sourceCell!);
        next[cellIndex] = specialRouteId;
        return next;
      });
      dismissDropToast();
      return;
    }
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

  const isDragPreviewActive = dragPreview !== null;

  useEffect(() => {
    if (!isDragPreviewActive) return;

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";

    const clearPointerDrag = () => {
      activePointerDragIdRef.current = null;
      pointerDragPayloadRef.current = null;
      setDragPreview(null);
      setHoverCell(null);
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== activePointerDragIdRef.current) return;
      event.preventDefault();
      const cellIndex = getRouteCellIndexAtPoint(event.clientX, event.clientY);
      setHoverCell(cellIndex);
      setDragPreview((prev) =>
        prev
          ? {
              ...prev,
              x: event.clientX,
              y: event.clientY,
            }
          : prev,
      );
    };

    const handlePointerUp = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== activePointerDragIdRef.current) return;
      event.preventDefault();
      const payload = pointerDragPayloadRef.current;
      const cellIndex = getRouteCellIndexAtPoint(event.clientX, event.clientY);

      if (payload && cellIndex !== null) {
        markBoardInteraction();
        handleDropToCell(cellIndex, payload.routeId, payload.sourceCell);
      } else if (
        payload &&
        typeof payload.sourceCell === "number" &&
        isRouteTrayDropPoint(event.clientX, event.clientY)
      ) {
        markBoardInteraction();
        setPlacedRoutes((prev) => {
          const next = { ...prev };
          removePlacedAtCell(next, payload.sourceCell!);
          return next;
        });
      }

      clearPointerDrag();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", clearPointerDrag);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", clearPointerDrag);
    };
  }, [isDragPreviewActive]);

  function hydrateStoryRouteDepartureItinerary() {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(STORY_ROUTE_DEPARTURE_STORAGE_KEY);
    if (!raw) return;
    window.sessionStorage.removeItem(STORY_ROUTE_DEPARTURE_STORAGE_KEY);

    try {
      const parsed = JSON.parse(raw) as {
        sourceIds?: unknown;
        currentSourceId?: unknown;
        eventIdsBySource?: unknown;
        createdAt?: unknown;
      };
      const createdAt = typeof parsed.createdAt === "number" ? parsed.createdAt : 0;
      if (createdAt > 0 && Date.now() - createdAt > 10 * 60 * 1000) return;
      const sourceIds = Array.from(
        new Set(
          (Array.isArray(parsed.sourceIds) ? parsed.sourceIds : []).filter(
            isStoryRouteItinerarySourceId,
          ),
        ),
      );
      if (!isStoryRouteItinerarySourceId(parsed.currentSourceId)) return;
      const currentSourceId = parsed.currentSourceId;
      const normalizedSourceIds = sourceIds.includes(currentSourceId)
        ? sourceIds
        : [currentSourceId, ...sourceIds];
      const rawEventIdsBySource =
        parsed.eventIdsBySource && typeof parsed.eventIdsBySource === "object"
          ? (parsed.eventIdsBySource as Record<string, unknown>)
          : {};
      storyRouteEventBySourceRef.current = normalizedSourceIds.reduce<
        Partial<Record<PlaceTileId, GameEventId>>
      >((eventsBySource, sourceId) => {
        const eventId = rawEventIdsBySource[sourceId];
        if (isGameEventId(eventId)) {
          eventsBySource[sourceId] = eventId;
        }
        return eventsBySource;
      }, {});
      departureRouteMapPointsRef.current = buildDepartureMapPointsFromSourceIds(normalizedSourceIds);
      departureLastReachedSourceRef.current = currentSourceId;
    } catch {
      // Ignore stale or malformed story-route itinerary data.
    }
  }

  useEffect(() => {
    if (!initialEventId || initialEventOpenedRef.current) return;
    initialEventOpenedRef.current = true;
    hydrateStoryRouteDepartureItinerary();
    setActiveEventId(initialEventId);
  }, [initialEventId]);

  useEffect(() => {
    if (!initialStreetExplore || initialStreetExploreOpenedRef.current) return;
    initialStreetExploreOpenedRef.current = true;
    openStreetExplore(() => {});
  }, [initialStreetExplore]);

  useEffect(() => {
    const handleCheatTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<{ eventId?: GameEventId }>;
      const eventId = customEvent.detail?.eventId;
      if (!eventId) return;
      setActiveEventId(eventId);
    };
    const handleStreetExploreCheatTrigger = () => {
      setActiveEventId(null);
      setIsWorkTransitionOpen(false);
      setIsWorkMinigameOpen(false);
      openStreetExplore(() => {});
    };
    const handleWorkMinigameCheatTrigger = (event: Event) => {
      const customEvent = event as CustomEvent<WorkMinigameCheatPayload>;
      setActiveEventId(null);
      setIsWorkTransitionOpen(false);
      setForcedWorkMinigameKind(customEvent.detail?.kind ?? "sticky-notes");
      setIsWorkMinigameOpen(true);
    };

    window.addEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
    window.addEventListener(STREET_EXPLORE_CHEAT_TRIGGER, handleStreetExploreCheatTrigger);
    window.addEventListener(GAME_WORK_MINIGAME_CHEAT_TRIGGER, handleWorkMinigameCheatTrigger);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      window.removeEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
      window.removeEventListener(STREET_EXPLORE_CHEAT_TRIGGER, handleStreetExploreCheatTrigger);
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
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && isConvenienceStoreBoard) {
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
    if (isStreetMissionAvailable) {
      if (!hasFirstStreetRewardPatterns(progress.rewardPlaceTiles)) {
        savePlayerProgress({
          ...progress,
          ownedPlaceTileIds: Array.from(new Set([...progress.ownedPlaceTileIds, "street"])),
          rewardPlaceTiles: [
            ...progress.rewardPlaceTiles,
            ...buildMissingFirstStreetRewardTiles(progress.rewardPlaceTiles),
          ],
        });
        onProgressSaved?.();
      }
      if (!ENABLE_PLACE_GUIDANCE_SYSTEM) {
        setIsStreetUnlockOverlayOpen(false);
      } else if (placeMissionTutorialSeen) {
        setIsStreetUnlockOverlayOpen(false);
      } else {
        setThirdArrangeIntroStep("unlock");
        setIsMissionModalOpen(false);
        setIsStreetUnlockOverlayOpen(true);
        setIsTutorialModalOpen(false);
        return;
      }
    }
    if (!ENABLE_ARRANGE_ROUTE_TUTORIALS) {
      setIsStoryRouteTutorialFlow(false);
      setHasMetroGuideGrabbed(false);
      setActiveArrangeRoutePromptId(null);
      setIsTutorialModalOpen(false);
      setIsStreetUnlockOverlayOpen(false);
      setIsConvenienceStoreIntroOpen(false);
      return;
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
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && isThirdArrange) {
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
    isStreetMissionAvailable,
    isStoryTutorialArrange,
    isThirdArrange,
    onProgressSaved,
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
  const specialMapActionLimit = 4;
  const specialMapActionCount = isSpecialMapBoard
    ? Object.values(placedRoutes).filter((tileId) => isSpecialCornerRouteId(tileId)).length
    : 0;
  const specialMapRemainingRotations = Math.max(
    0,
    SPECIAL_MAP_ROTATION_LIMIT - specialMapRotationCount,
  );
  const rewardRouteTileIds = useMemo(
    () =>
      new Set(
        rewardPlaceTiles
          .filter((tile) => tile.category === "route")
          .map((tile) => tile.instanceId),
      ),
    [rewardPlaceTiles],
  );
  const isRewardRouteTile = (tileId: string) => rewardRouteTileIds.has(tileId);
  const hasMetroStationPlaced = Object.values(placedRoutes).some(
    (tileId) =>
      !isRewardRouteTile(tileId) &&
      (tileId === "metro-station" ||
        tileId.startsWith("metro-station-") ||
        tileId.startsWith("metro-station::")),
  );
  function resolvePlacedTileSourceId(tileId: string): PlaceTileId | null {
    const rewardTile = rewardPlaceTiles.find((tile) => tile.instanceId === tileId);
    if (rewardTile) return rewardTile.category === "place" ? rewardTile.sourceId : null;
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
    return null;
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
      if (destinationLabel.includes("特殊")) return "special-map";
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

  function buildDepartureMapPointsFromSourceIds(sourceIds: PlaceTileId[]): DepartureMapPoint[] {
    const homeVisual = { label: "家", iconPath: "/images/icon/house.png" };
    const companyVisual = { label: "公司", iconPath: "/images/icon/company.png" };
    const rawPoints: Array<{
      key: string;
      visual: DepartureMapVisual;
      sourceId: DepartureMapPoint["sourceId"];
    }> = [
      { key: "home", visual: homeVisual, sourceId: "home" },
      ...sourceIds
        .map((sourceId, index) => {
          const visual = resolveDepartureVisualFromSource(sourceId);
          if (!visual) return null;
          return {
            key: `${sourceId}-${index}`,
            visual,
            sourceId,
          };
        })
        .filter(
          (point): point is {
            key: string;
            visual: DepartureMapVisual;
            sourceId: PlaceTileId;
          } => Boolean(point),
        ),
      { key: "company", visual: companyVisual, sourceId: "company" },
    ];
    const stepCount = Math.max(1, rawPoints.length - 1);
    return rawPoints.map((point, index) => ({
      ...point,
      positionPercent: 9 + (82 * index) / stepCount,
    }));
  }

  function buildSpecialMapDepartureMapPoints(): DepartureMapPoint[] {
    const startPoint = hasLearnedBaiSecretBaseHeban
      ? {
          key: "breakfast-shop",
          visual: { label: "早餐店", iconPath: "/images/icon/breakfast.png" },
          sourceId: "breakfast-shop" as const,
        }
      : {
          key: "home",
          visual: { label: "家", iconPath: "/images/icon/house.png" },
          sourceId: "home" as const,
        };
    const specialPoint = hasLearnedBaiSecretBaseHeban
      ? {
          key: "special-map",
          visual: { label: "河畔", iconPath: "/images/icon/park.png" },
          sourceId: "special-map" as const,
          positionPercent: 50,
        }
      : {
          key: "special-map",
          visual: { label: "?", iconPath: "/images/icon/mystery.png" },
          sourceId: "special-map" as const,
          positionPercent: 50,
        };
    return [
      {
        ...startPoint,
        positionPercent: 9,
      },
      specialPoint,
      {
        key: "company",
        visual: { label: "公司", iconPath: "/images/icon/company.png" },
        sourceId: "company",
        positionPercent: 91,
      },
    ];
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
    return uniqueWaypoints;
  }

  function startDepartureRouteToWork() {
    const continueToWork = () => {
      startDepartureTransition(
        "前往公司",
        () => {
          setIsWorkTransitionOpen(true);
        },
        resolveDepartureMapLeg("前往公司", departureLastReachedSourceRef.current),
      );
    };

    if (!pendingMetroAndStreetUnlockForDepartureRef.current) {
      continueToWork();
      return;
    }

    pendingMetroAndStreetUnlockForDepartureRef.current = false;
    const progress = loadPlayerProgress();
    savePlayerProgress({
      ...progress,
      hasPassedThroughMetroAndStreet: true,
    });
    const syncedProgress = syncDerivedPlaceUnlocks();
    onProgressSaved?.();
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && syncedProgress.pendingPlaceUnlockIntroIds.length > 0) {
      placeUnlockIntroNextActionRef.current = continueToWork;
      setActivePlaceUnlockIntroId(syncedProgress.pendingPlaceUnlockIntroIds[0]);
      return;
    }
    continueToWork();
  }

  function startDepartureRouteToWorkAndOffwork() {
    forceOffworkAfterWorkTransitionRef.current = true;
    startDepartureRouteToWork();
  }

  function getFrogClueContinueAction(options?: { returnToWorkAndOffwork?: boolean }) {
    if (options?.returnToWorkAndOffwork) return startDepartureRouteToWorkAndOffwork;
    if (shouldReturnToOffworkAfterFrogClue) {
      return () => {
        router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
      };
    }
    return startDepartureRouteFromCurrentLocation;
  }

  function tryStartStreetForgotLunchFrogEvent(options?: { recordStreetVisit?: boolean; source?: PlaceTileId }) {
    if (options?.recordStreetVisit) {
      const progress = loadPlayerProgress();
      savePlayerProgress(buildStreetVisitProgress(progress));
      onProgressSaved?.();
    }

    const progress = loadPlayerProgress();
    const shouldUseFrogClueRoute =
      progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
      !progress.unlockedDiaryEntryIds.includes("bai-entry-2") &&
      !progress.hasCompletedStreetForgotLunchFrogEvent;
    if (!shouldUseFrogClueRoute) return false;

    const stage = getFrogDiaryClueStageByAttempt(progress.streetForgotLunchFrogPhotoAttemptCount);
    if (options?.source !== resolveFrogDiaryClueSourceId(stage.routeTileId)) return false;
    setActiveEventId(stage.eventId);
    onProgressSaved?.();
    return true;
  }

  function getStreetFrogUnlockCue() {
    return undefined;
  }

  function startMetroDepartureEvent() {
    const progress = loadPlayerProgress();
    if (!progress.hasTriggeredMetroSeatSpreadEvent) {
      markMetroSeatSpreadEventTriggered();
      onProgressSaved?.();
      setActiveEventId("metro-seat-spread");
      return;
    }

    if (!progress.hasTriggeredMetroBackpackHitEvent) {
      markMetroBackpackHitEventTriggered();
      onProgressSaved?.();
      setActiveEventId("metro-backpack-hit");
      return;
    }

    const randomIndex = Math.floor(Math.random() * METRO_DAILY_EVENT_IDS.length);
    setActiveEventId(METRO_DAILY_EVENT_IDS[randomIndex]);
  }

  function startBusStopDepartureEvent() {
    const randomIndex = Math.floor(Math.random() * BUS_DAILY_EVENT_IDS.length);
    setActiveEventId(BUS_DAILY_EVENT_IDS[randomIndex]);
    return true;
  }

  function startDepartureEventForSource(sourceId: PlaceTileId | "special-map") {
    if (sourceId !== "special-map") {
      const storyRouteEventId = storyRouteEventBySourceRef.current[sourceId];
      if (storyRouteEventId) {
        delete storyRouteEventBySourceRef.current[sourceId];
        setActiveEventId(storyRouteEventId);
        return true;
      }
    }
    if (sourceId === "metro-station") {
      startMetroDepartureEvent();
      return true;
    }
    if (sourceId === "street") {
      if (tryStartStreetForgotLunchFrogEvent({ recordStreetVisit: true, source: "street" })) return true;
      openStreetExplore();
      return true;
    }
    if (sourceId === "convenience-store") {
      if (tryStartStreetForgotLunchFrogEvent({ source: "convenience-store" })) return true;
      setActiveEventId("convenience-store-hub");
      return true;
    }
    if (sourceId === "breakfast-shop") {
      const progress = loadPlayerProgress();
      const canStartRoosterBreakfastClue =
        progress.unlockedDiaryEntryIds.includes("bai-entry-3") &&
        !progress.hasLearnedBaiSecretBaseHeban &&
        !progress.hasTriggeredOfficeSunbeastChickenEvent;
      if (!canStartRoosterBreakfastClue) return false;
      setActiveEventId("breakfast-shop-mai-clue");
      return true;
    }
    if (sourceId === "park") {
      setActiveEventId("park-hub");
      return true;
    }
    if (sourceId === "bus-stop") {
      return startBusStopDepartureEvent();
    }
    if (sourceId === "special-map") {
      startRoosterHebanEvent();
      return true;
    }
    return false;
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
    if (nextSourceId === "home" || nextSourceId === "company") {
      startDepartureRouteToWork();
      return;
    }

    startDepartureTransition(
      `前往${nextWaypoint.visual.label}`,
      () => {
        departureLastReachedSourceRef.current = nextSourceId;
        if (startDepartureEventForSource(nextSourceId)) return;
        window.setTimeout(() => startDepartureRouteFromCurrentLocation(), 0);
      },
      resolveDepartureMapLegToSource(nextSourceId, departureLastReachedSourceRef.current),
      nextSourceId === "street" ? getStreetFrogUnlockCue() : undefined,
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
  const showMetroGuide =
    ENABLE_ARRANGE_ROUTE_TUTORIALS &&
    ENABLE_ARRANGE_ROUTE_LEGACY_HINTS &&
    isStoryRouteTutorialFlow &&
    !isTutorialModalOpen &&
    !isIntroArrange;
  const metroFirstStepActive = showMetroGuide && !hasMetroStationPlaced;
  const showMetroDropHint = metroFirstStepActive && hasMetroGuideGrabbed;
  const metroGuideDropCellIndex = getEndpointAnchor(startCell, startConnector)?.index ?? -1;
  const metroSelectionTooltipVisible = metroFirstStepActive && activeTab === "metro";
  const visiblePlaceTileStacks = metroFirstStepActive
    ? availablePlaceTileStacks.filter((tile) => tile.stackId.includes("metro-station"))
    : availablePlaceTileStacks;
  const hasCollectedNaotaro = useMemo(() => {
    const progress = loadPlayerProgress();
    return progress.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"));
  }, [offworkRewardClaimCount, rewardPlaceTiles.length]);

  const markPuzzleTypeTabGuideSeen = () => {
    if (!isPuzzleTypeTabGuideActive) return;
    setIsPuzzleTypeTabGuideActive(false);
    const progress = loadPlayerProgress();
    if (progress.hasSeenNaotaroPuzzleTypeTabGuide) return;
    savePlayerProgress({
      ...progress,
      hasSeenNaotaroPuzzleTypeTabGuide: true,
    });
    onProgressSaved?.();
  };

  const handleDeparture = () => {
    if (!isRouteConnected) return;
    if (activeDepartureTransition) return;
    if (isSpecialMapBoard && !canStartRoosterHebanEvent()) return;
    departureLastReachedSourceRef.current = "home";
    departureTransitionDestinationSourceRef.current = null;
    storyRouteEventBySourceRef.current = {};
    const departureMapPointsForThisRoute = buildDepartureMapPoints();
    departureRouteMapPointsRef.current = departureMapPointsForThisRoute;
    const departureSourceIdsForThisRoute = new Set(
      departureMapPointsForThisRoute.map((point) => point.sourceId),
    );
    const hasPassedThroughMetroAndStreetForThisDeparture =
      departureSourceIdsForThisRoute.has("metro-station") &&
      departureSourceIdsForThisRoute.has("street");
    pendingMetroAndStreetUnlockForDepartureRef.current = hasPassedThroughMetroAndStreetForThisDeparture;
    const placedPlaceInstanceIds = Array.from(
      new Set(
        Object.values(placedRoutes).filter((tileId) =>
          allPlaceTileInstances.some((placeTile) => placeTile.id === tileId),
        ),
      ),
    );
    let shouldNotifyProgressSaved = false;
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
      shouldNotifyProgressSaved = true;
    }
    recordArrangeRouteDeparture();
    shouldNotifyProgressSaved = true;
    if (shouldNotifyProgressSaved) {
      onProgressSaved?.();
    }
    if (isSpecialMapBoard) {
      consumeSpecialMapPuzzle();
      setActiveMapKind("normal");
      setPlacedRoutes({});
      departureRouteMapPointsRef.current = buildSpecialMapDepartureMapPoints();
      startDepartureTransition(
        "前往特殊地點",
        () => {
          setActiveEventId("office-sunbeast-chicken");
        },
        resolveDepartureMapLegToSource("special-map"),
      );
      return;
    }
    if (isStoryRouteTutorialFlow && (isIntroArrange || hasMetroStationPlaced)) {
      startDepartureTransition("前往捷運站", () => {
        setPendingSceneTransition("scene-69");
        router.push(withTrialProfileSearch(ROUTES.gameScene("scene-69")));
      }, undefined, undefined, true);
      return;
    }
    startDepartureRouteFromCurrentLocation();
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
    if (ENABLE_PLACE_GUIDANCE_SYSTEM && isIntroArrange) {
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
      : useSimpleArrangeUi && isSpecialMapBoard
        ? "307px"
      : useSimpleArrangeUi && isConvenienceStoreBoard
        ? "218px"
      : useSimpleArrangeUi && (isSecondArrange || arrangeRouteAttempt >= 2)
        ? "112px"
        : "360px";
  const boardHeight =
    useSimpleArrangeUi && isIntroArrange
      ? "100%"
      : isSpecialMapBoard
        ? "392px"
      : isExpandedBoard
        ? "500px"
        : "430px";
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
    isSpecialMapBoard
      ? "route"
    : activeTab === "route" && shouldShowRoutePuzzleTab
      ? "route"
      : activeTab === "street" && shouldShowStreetPlaceTab
        ? "street"
        : activeTab === "convenience" && shouldShowConveniencePlaceTab
          ? "convenience"
        : "metro";
  const routeTrayScrollableDistance = Math.max(
    0,
    routeTrayScrollState.scrollWidth - routeTrayScrollState.clientWidth,
  );
  const shouldShowRouteTrayScrollHint = !isSpecialMapBoard && routeTrayScrollableDistance > 4;
  const routeTrayThumbWidthPercent = routeTrayScrollState.scrollWidth > 0
    ? Math.min(86, Math.max(24, (routeTrayScrollState.clientWidth / routeTrayScrollState.scrollWidth) * 100))
    : 100;
  const routeTrayThumbLeftPercent = shouldShowRouteTrayScrollHint
    ? Math.min(
        100 - routeTrayThumbWidthPercent,
        (routeTrayScrollState.scrollLeft / routeTrayScrollableDistance) *
          (100 - routeTrayThumbWidthPercent),
      )
    : 0;

  useEffect(() => {
    const canShowPuzzleTypeTabGuide =
      ENABLE_ARRANGE_ROUTE_LEGACY_HINTS &&
      hasCollectedNaotaro &&
      isSecondArrange &&
      shouldShowRoutePuzzleTab &&
      !isSpecialMapBoard &&
      !isTutorialModalOpen &&
      !isStreetUnlockOverlayOpen &&
      !isConvenienceStoreIntroOpen &&
      !activeDepartureTransition;
    if (!canShowPuzzleTypeTabGuide) {
      setIsPuzzleTypeTabGuideActive(false);
      return;
    }

    const progress = loadPlayerProgress();
    setIsPuzzleTypeTabGuideActive(!progress.hasSeenNaotaroPuzzleTypeTabGuide);
  }, [
    activeDepartureTransition,
    hasCollectedNaotaro,
    isConvenienceStoreIntroOpen,
    isSecondArrange,
    isSpecialMapBoard,
    isStreetUnlockOverlayOpen,
    isTutorialModalOpen,
    shouldShowRoutePuzzleTab,
  ]);

  useEffect(() => {
    if (isSpecialMapBoard) return;
    updateRouteTrayScrollState();
    const frameId = window.requestAnimationFrame(updateRouteTrayScrollState);
    const scroller = routeTrayScrollerRef.current;
    const resizeObserver =
      typeof ResizeObserver === "undefined" || !scroller
        ? null
        : new ResizeObserver(updateRouteTrayScrollState);
    if (scroller) {
      resizeObserver?.observe(scroller);
    }
    window.addEventListener("resize", updateRouteTrayScrollState);
    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateRouteTrayScrollState);
    };
  }, [
    isSpecialMapBoard,
    displayedTab,
    routeTrayTiles.length,
    metroTrayTiles.length,
    streetTrayTiles.length,
    convenienceTrayTiles.length,
  ]);

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
  const dragPreviewContent = dragPreview ? renderDragPreviewTile(dragPreview.routeId) : null;
  const dragPreviewIsWide = dragPreview ? isWideDragPreview(dragPreview.routeId) : false;
  const dragPreviewWidth = dragPreview
    ? dragPreviewIsWide
      ? dragPreview.size * 1.92
      : dragPreview.size
    : 0;

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
      {dragPreview && dragPreviewContent ? (
        <Flex
          position="fixed"
          left={`${dragPreview.x}px`}
          top={`${dragPreview.y}px`}
          zIndex={120}
          w={`${dragPreviewWidth}px`}
          h={`${dragPreview.size}px`}
          borderRadius="9px"
          overflow="hidden"
          bgColor="#F8E7CD"
          border="3px solid #FFF7EC"
          boxShadow="0 22px 42px rgba(81, 56, 34, 0.28), 0 7px 14px rgba(81, 56, 34, 0.18)"
          transform={`translate(-50%, -54%) rotate(${dragPreviewIsWide ? "-1.6deg" : "-3.2deg"}) scale(1.06)`}
          transformOrigin="center"
          pointerEvents="none"
          alignItems="center"
          justifyContent="center"
          transition="transform 80ms linear"
          opacity={1}
          isolation="isolate"
        >
          <Box position="absolute" inset="0" bgColor="#F8E7CD" zIndex={0} />
          <Flex
            position="relative"
            zIndex={1}
            w="100%"
            h="100%"
            alignItems="center"
            justifyContent="center"
            bgColor="#F8E7CD"
          >
            {dragPreviewContent}
          </Flex>
          <Box
            position="absolute"
            inset="0"
            zIndex={2}
            boxShadow="inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 5px rgba(103,72,45,0.12)"
          />
        </Flex>
      ) : null}
      {isConvenienceStoreIntroOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={81}
          bgColor="rgba(27,23,20,0.84)"
          direction="column"
          cursor="pointer"
          onClick={handleConvenienceStoreIntroContinue}
        >
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
        <Flex
          position="absolute"
          inset="0"
          zIndex={80}
          bgColor="rgba(27,23,20,0.84)"
          direction="column"
          cursor={thirdArrangeIntroStep === "unlock" ? undefined : "pointer"}
          onClick={thirdArrangeIntroStep === "unlock" ? undefined : handleThirdArrangeIntroContinue}
        >
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
                    {FIRST_STREET_REWARD_PATTERNS.map((pattern, index) => {
                      const tileParams = {
                        tileId: `street-intro-${index}`,
                        sourceId: "street",
                        pattern,
                      };
                      return (
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
                              imagePath={resolvePlaceTileImagePath(tileParams)}
                              imageFallbackPath={resolvePlaceTileImageFallbackPath(tileParams)}
                              overlayIconPath={resolvePlaceTileFallbackOverlayIconPath(tileParams)}
                            />
                          </Flex>
                          <Text color="#FFF6D8" fontSize="11px" fontWeight="700" lineHeight="1">
                            {FIRST_STREET_REWARD_LABELS[index]}
                          </Text>
                        </Flex>
                      );
                    })}
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
                        收到任務：同時經過捷運和街道，解鎖商店
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
        h="86px"
        minH="86px"
        maxH="86px"
        px="12px"
        pt="8px"
        pb="8px"
        bgColor="#B88E6D"
      >
        <Flex direction="column" w="100%" gap="8px">
          <Flex alignItems="center" justifyContent="space-between" gap="12px">
            <Text color="white" fontWeight="800" fontSize="22px" lineHeight="1.1">
              安排行程
            </Text>
            <Flex alignItems="center" gap="8px">
              <Flex
                h="30px"
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
                w="30px"
                h="30px"
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
              h="32px"
              borderRadius="999px"
              bgColor={hasUnlockedDiaryEntries ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.56)"}
              border="2px solid rgba(112,91,70,0.18)"
              alignItems="center"
              justifyContent="center"
              gap="6px"
              cursor={hasUnlockedDiaryEntries ? "pointer" : "not-allowed"}
              opacity={hasUnlockedDiaryEntries ? 1 : 0.72}
              onClick={openJournalDiary}
              aria-label={hasUnlockedDiaryEntries ? "打開交換日記" : "交換日記尚未解鎖"}
            >
              <FaBook size={13} color="#705B46" />
              <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                日記
              </Text>
            </Flex>
            <Flex
              as="button"
              flex="1"
              minW="0"
              h="32px"
              borderRadius="999px"
              bgColor={hasSeenSunbeastFirstReveal ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.56)"}
              border="2px solid rgba(112,91,70,0.18)"
              alignItems="center"
              justifyContent="center"
              gap="6px"
              cursor={hasSeenSunbeastFirstReveal ? "pointer" : "not-allowed"}
              opacity={hasSeenSunbeastFirstReveal ? 1 : 0.72}
              onClick={openSunbeastDex}
              aria-label={hasSeenSunbeastFirstReveal ? "打開小日獸圖鑑" : "小日獸圖鑑尚未解鎖"}
            >
              <FaPaw size={14} color="#705B46" />
              <Text color="#705B46" fontSize="13px" fontWeight="800" lineHeight="1">
                小日獸
              </Text>
            </Flex>
            {ENABLE_PLACE_GUIDANCE_SYSTEM ? (
              <Flex
                as="button"
                flex="1"
                minW="0"
                h="32px"
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
            ) : null}
            {ENABLE_PLACE_GUIDANCE_SYSTEM ? (
              <Flex
                as="button"
                flex="1"
                minW="0"
                h="32px"
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
            ) : null}
          </Flex>
        </Flex>
      </Flex>
      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        px="12px"
        pt={isSpecialMapBoard ? "18px" : "14px"}
        pb={isSpecialMapBoard ? "20px" : "16px"}
        bgColor={isSpecialMapBoard ? "#DDEFEA" : "#FFF4C7"}
        backgroundImage={
          isSpecialMapBoard
            ? "radial-gradient(circle at 18% 28%, rgba(255,255,255,0.28) 0 42px, transparent 43px), radial-gradient(circle at 47% 20%, rgba(255,255,255,0.22) 0 54px, transparent 55px), radial-gradient(circle at 83% 38%, rgba(255,255,255,0.25) 0 64px, transparent 65px), radial-gradient(circle at 30% 78%, rgba(255,255,255,0.3) 0 70px, transparent 71px)"
            : "url('/images/road_pattern_ bg.jpg')"
        }
        backgroundSize={isSpecialMapBoard ? "100% 100%" : "cover"}
        backgroundPosition="center"
        position="relative"
      >
        {canUseSpecialMapPuzzle ? (
          <Flex
            position="absolute"
            top="8px"
            right="10px"
            zIndex={15}
            h="30px"
            p="3px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.92)"
            border="1px solid rgba(157,120,89,0.18)"
            boxShadow="0 6px 14px rgba(115,86,45,0.12)"
            gap="2px"
          >
            {[
              { key: "normal" as const, label: "一般" },
              { key: "special" as const, label: "特殊地圖" },
            ].map((item) => {
              const isActive = activeMapKind === item.key;
              return (
                <Flex
                  key={item.key}
                  as="button"
                  h="24px"
                  minW="58px"
                  px="8px"
                  borderRadius="999px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor={isActive ? "#906D51" : "transparent"}
                  color={isActive ? "#FFFFFF" : "#806248"}
                  cursor="pointer"
                  transition="background-color 140ms ease, color 140ms ease"
                  onClick={() => switchArrangeMap(item.key)}
                >
                  <Text fontSize="11px" fontWeight="800" lineHeight="1">
                    {item.label}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        ) : null}
        <Flex
          position="absolute"
          right="14px"
          bottom="16px"
          zIndex={14}
          direction="column"
          gap="10px"
          alignItems="center"
        >
          <Flex
            as="button"
            w="62px"
            h="62px"
            borderRadius="14px"
            bgColor={hasSeenSunbeastFirstReveal ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.56)"}
            border="3px solid rgba(157,120,89,0.44)"
            boxShadow="0 8px 18px rgba(105,80,49,0.18)"
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="4px"
            cursor={hasSeenSunbeastFirstReveal ? "pointer" : "not-allowed"}
            opacity={hasSeenSunbeastFirstReveal ? 1 : 0.68}
            onClick={openSunbeastDex}
            aria-label={hasSeenSunbeastFirstReveal ? "打開小日獸圖鑑" : "小日獸圖鑑尚未解鎖"}
          >
            <FaPaw size={24} color="#705B46" />
            <Text color="#705B46" fontSize="14px" fontWeight="900" lineHeight="1">
              小日獸
            </Text>
          </Flex>
          <Flex
            as="button"
            w="62px"
            h="62px"
            borderRadius="14px"
            bgColor={hasUnlockedDiaryEntries ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.56)"}
            border="3px solid rgba(157,120,89,0.44)"
            boxShadow="0 8px 18px rgba(105,80,49,0.18)"
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="4px"
            cursor={hasUnlockedDiaryEntries ? "pointer" : "not-allowed"}
            opacity={hasUnlockedDiaryEntries ? 1 : 0.68}
            onClick={openJournalDiary}
            aria-label={hasUnlockedDiaryEntries ? "打開交換日記" : "交換日記尚未解鎖"}
          >
            <FaBook size={23} color="#705B46" />
            <Text color="#705B46" fontSize="15px" fontWeight="900" lineHeight="1">
              日記
            </Text>
          </Flex>
        </Flex>
        {shouldShowSpecialMapGuide ? (
          <Flex position="absolute" inset="0" zIndex={24} pointerEvents="none">
            <Box position="absolute" inset="0" bgColor="rgba(68, 48, 33, 0.18)" />
            <Flex
              position="absolute"
              top="44px"
              right="36px"
              w="46px"
              h="46px"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src="/images/pointer_up.png"
                alt=""
                aria-hidden="true"
                w="46px"
                h="46px"
                objectFit="contain"
                filter="drop-shadow(0 6px 9px rgba(66, 45, 29, 0.28))"
                animation={`${specialMapGuideTap} 1.1s ease-in-out infinite`}
              />
            </Flex>
            <Flex
              position="absolute"
              left="50%"
              top="50%"
              transform="translate(-50%, -50%)"
              w="calc(100% - 54px)"
              maxW="320px"
              direction="column"
              gap="16px"
              px="22px"
              py="22px"
              borderRadius="18px"
              bgColor="rgba(255, 253, 246, 0.98)"
              border="3px solid #A98565"
              boxShadow="0 16px 32px rgba(93, 64, 40, 0.24)"
              pointerEvents="auto"
            >
              <Flex direction="column" gap="8px">
                <Text color="#7B5C43" fontSize="20px" fontWeight="900" lineHeight="1.25">
                  特殊地圖已解鎖
                </Text>
                <Text color="#806248" fontSize="15px" fontWeight="700" lineHeight="1.65">
                  點擊右上角的「特殊地圖」切換地圖，前往未知地點，發現下一隻小日獸。
                </Text>
              </Flex>
              <Flex
                as="button"
                alignSelf="stretch"
                h="44px"
                borderRadius="999px"
                bgColor="#9D7859"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => {
                  const progress = loadPlayerProgress();
                  if (!progress.hasSeenSpecialMapGuide) {
                    savePlayerProgress({
                      ...progress,
                      hasSeenSpecialMapGuide: true,
                    });
                    onProgressSaved?.();
                  }
                }}
              >
                <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
                  確定
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}
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
                任務版
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
              minH="78px"
              px="18px"
              py="12px"
              bgColor="rgba(255,255,255,0.96)"
              alignItems="center"
              justifyContent="space-between"
              gap="12px"
            >
              <Flex direction="column" gap="5px" minW="0">
                <Text color="#8F6A4D" fontSize="12px" fontWeight="800" lineHeight="1">
                  01
                </Text>
                <Text color="#161616" fontSize="14px" fontWeight="800" lineHeight="1.35">
                  同時經過捷運和街道，解鎖商店
                </Text>
              </Flex>
              <Text color="#B88E6D" fontSize="14px" fontWeight="800" whiteSpace="nowrap">
                10金幣
              </Text>
            </Flex>
          </Flex>
        ) : null}
        <Grid
          templateColumns={`repeat(${boardCols}, 1fr)`}
          templateRows={`repeat(${boardRows}, 1fr)`}
          gap={isSpecialMapBoard ? "3px" : "10px"}
          w="100%"
          maxW={boardMaxWidth}
          h={boardHeight}
          maxH={useSimpleArrangeUi && !isSpecialMapBoard ? "400px" : undefined}
          p={isSpecialMapBoard ? "0" : "10px"}
          bgColor={isSpecialMapBoard ? "transparent" : "rgba(255,255,255,0.88)"}
          border={isSpecialMapBoard ? "0" : "3px solid"}
          borderColor={isSpecialMapBoard ? "transparent" : "#B99873"}
          borderRadius={isSpecialMapBoard ? "0" : "18px"}
          boxShadow={isSpecialMapBoard ? "none" : "0 8px 18px rgba(115,86,45,0.12)"}
          position="relative"
        >
          {ENABLE_ARRANGE_ROUTE_LEGACY_HINTS && !isSpecialMapBoard && !isTutorialModalOpen ? (
            <Flex
              pointerEvents="none"
              position="absolute"
              right="-34px"
              top="50%"
              transform="translateY(-50%)"
              zIndex={3}
              w="26px"
              h="138px"
              alignItems="center"
              justifyContent="center"
              animation={`${routeBoardSideArrowDismiss} 5s linear forwards`}
            >
              <Box
                position="absolute"
                top="8px"
                bottom="8px"
                left="50%"
                transform="translateX(-50%)"
                w="3px"
                borderRadius="999px"
                bgColor="rgba(255, 224, 105, 0.34)"
              />
              <Flex
                w="28px"
                h="28px"
                borderRadius="999px"
                alignItems="center"
                justifyContent="center"
                bgColor="rgba(255, 226, 110, 0.96)"
                border="2px solid rgba(168, 122, 70, 0.42)"
                boxShadow="0 5px 12px rgba(125, 87, 48, 0.20), 0 0 10px rgba(255, 226, 110, 0.58)"
                color="#8B6647"
                fontSize="21px"
                fontWeight="900"
                lineHeight="1"
                animation={`${routeBoardSideArrowFloat} 1.65s ease-in-out infinite`}
              >
                ↑
              </Flex>
            </Flex>
          ) : null}
          {Array.from({ length: boardCellCount }).map((_, index) => {
            const isStart = index === startCell;
            const isEnd = index === endCell;
            const isBlockedCell = blockedCells.has(index);
            const isFixedConvenienceStoreCell =
              fixedConvenienceStoreCell !== null && index === fixedConvenienceStoreCell;
            const isSpecialMysteryCell =
              specialMapMysteryCell !== null && index === specialMapMysteryCell;
            const cellValue = placedRoutes[index];
            const pairMarker = cellValue ? parsePairMarker(cellValue) : null;
            const isPairRightCell = pairMarker?.side === "right";
            const isPairLeftCell = pairMarker?.side === "left";
            const renderTileId = pairMarker
              ? pairMarker.side === "left"
                ? pairMarker.leftId
                : pairMarker.rightId
              : cellValue ?? null;
            const specialCornerTile = renderTileId ? getSpecialCornerCandidate(renderTileId) : null;
            const isOccupied = Boolean(cellValue);
            const isDroppable =
              !isStart &&
              !isEnd &&
              !isBlockedCell &&
              !isFixedConvenienceStoreCell &&
              !isSpecialMysteryCell;
            const isEmptyDropCell = isDroppable && !isOccupied;
            const isMetroGuideDropCell = showMetroDropHint && index === metroGuideDropCellIndex;
            const specialMysteryCorner = isSpecialMysteryCell
              ? resolveSpecialMysteryCorner(placedRoutes)
              : null;
            const mismatchHints = mismatchHintMap.get(index);
            const showRightMismatchHint = mismatchHints?.has("right") ?? false;
            const showBottomMismatchHint = mismatchHints?.has("bottom") ?? false;
            if (isBlockedCell) {
              return <Box key={index} />;
            }
            return (
              <Flex
                key={index}
                data-route-cell-index={isDroppable ? index : undefined}
                border={
                  isEmptyDropCell
                    ? `2px dashed ${
                        hoverCell === index || isMetroGuideDropCell
                          ? "rgba(83, 197, 213, 0.84)"
                          : "rgba(157, 120, 89, 0.42)"
                      }`
                    : "none"
                }
                bgColor={
                  isEmptyDropCell
                    ? "rgba(255, 251, 241, 0.96)"
                    : isSpecialMapBoard
                      ? "rgba(252,245,233,0.95)"
                      : "rgba(244,236,223,0.95)"
                }
                borderRadius={isSpecialMapBoard ? "4px" : "10px"}
                boxShadow={
                  isEmptyDropCell
                    ? "inset 0 0 0 2px rgba(255,255,255,0.58), 0 2px 5px rgba(107,78,51,0.08)"
                    : "none"
                }
                outline={
                  isMetroGuideDropCell
                    ? "2px dashed rgba(240,200,74,0.95)"
                    : "none"
                }
                outlineOffset={isMetroGuideDropCell ? "-3px" : "0px"}
                alignItems="center"
                justifyContent="center"
                position="relative"
                zIndex={1}
                onDoubleClick={() => {
                  if (isSpecialMapBoard) return;
                  if (!isDroppable || !isOccupied) return;
                  markBoardInteraction();
                  setPlacedRoutes((prev) => {
                    const next = { ...prev };
                    removePlacedAtCell(next, index);
                    return next;
                  });
                }}
                onClick={() => {
                  if (isSpecialMapBoard && isOccupied && cellValue && getSpecialCornerCandidate(cellValue)) {
                    markBoardInteraction();
                    if (specialMapRotationCount >= SPECIAL_MAP_ROTATION_LIMIT) {
                      setIsSpecialMapRotationLimitModalOpen(true);
                      return;
                    }
                    setPlacedRoutes((prev) => {
                      const clickedRouteId = prev[index];
                      if (!clickedRouteId || !getSpecialCornerCandidate(clickedRouteId)) return prev;
                      const next = { ...prev };
                      getSpecialMapRotationCellIndices(prev, index).forEach((targetIndex) => {
                        const routeId = prev[targetIndex];
                        if (routeId && getSpecialCornerCandidate(routeId)) {
                          next[targetIndex] = rotateSpecialCornerRouteId(routeId);
                        }
                      });
                      return next;
                    });
                    setSpecialMapRotationCount((prev) => Math.min(SPECIAL_MAP_ROTATION_LIMIT, prev + 1));
                    return;
                  }
                }}
            >
              {specialMysteryCorner ? (
                <SpecialMysteryCornerVisual
                  candidate={specialMysteryCorner.candidate}
                  matchCount={specialMysteryCorner.matchCount}
                />
              ) : isStart || isEnd ? (
                <EndpointVisual
                  mode={isStart ? "start" : "end"}
                  startImagePath={
                    isStart && isSpecialMapBoard && hasLearnedBaiSecretBaseHeban
                      ? HEBAN_SPECIAL_MAP_START_IMAGE_PATH
                      : isStart && (isConvenienceStoreBoard || isSpecialMapBoard)
                      ? START_HOME_NARROW_IMAGE_PATH
                      : undefined
                  }
                />
              ) : isFixedConvenienceStoreCell ? (
                <FixedBoardTileVisual
                  imagePath="/images/route/rt_store_010,110,000.jpg"
                  alt="便利商店"
                />
              ) : isOccupied ? (
                specialCornerTile ? (
                  <Flex
                    w="100%"
                    h="100%"
                    alignItems="center"
                    justifyContent="center"
                    cursor="grab"
                    touchAction="none"
                    userSelect="none"
                    onPointerDown={(event) => {
                      markBoardInteraction();
                      startPointerDrag(
                        event,
                        {
                          routeId: cellValue!,
                          sourceCell: index,
                        },
                        { size: 90 },
                      );
                    }}
                  >
                    <SpecialCornerRouteVisual candidate={specialCornerTile} />
                  </Flex>
                ) : isPairRightCell ? null : (
                <Flex
                  w={isPairLeftCell ? "196%" : "92%"}
                  h="92%"
                  borderRadius="8px"
                  border="2px solid #8E7A62"
                  bgColor="#D5E8B7"
                  alignItems="center"
                  justifyContent="center"
                  cursor="grab"
                  touchAction="none"
                  userSelect="none"
                  position={isPairLeftCell ? "absolute" : "relative"}
                  left={isPairLeftCell ? "2%" : undefined}
                  zIndex={isPairLeftCell ? 2 : 1}
                  onPointerDown={(event) => {
                    markBoardInteraction();
                    startPointerDrag(
                      event,
                      {
                        routeId: cellValue!,
                        sourceCell: index,
                      },
                      { size: isPairLeftCell ? 92 : 86 },
                    );
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
                    imageFallbackPath={isPairLeftCell ? undefined : tileMap[cellValue!].imageFallbackPath}
                    overlayIconPath={isPairLeftCell ? undefined : tileMap[cellValue!].overlayIconPath}
                  />
                </Flex>
                )
              ) : (
                <Text
                  position="absolute"
                  fontSize="28px"
                  fontWeight="900"
                  opacity={hoverCell === index ? 0.98 : 0.58}
                  color={hoverCell === index ? "#53C5D5" : "#9D7859"}
                  lineHeight="1"
                >
                  ＋
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
        {isSpecialMapBoard ? (
          <Flex
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            zIndex={10}
            h="38px"
            px="24px"
            bgColor="#5DBDA0"
            alignItems="center"
            justifyContent="flex-start"
            pointerEvents="none"
          >
            <Text
              color="#FFFFFF"
              fontSize="13px"
              fontWeight="700"
              lineHeight="1.2"
              whiteSpace="nowrap"
            >
              {SPECIAL_MAP_PLAY_HINT}
            </Text>
          </Flex>
        ) : null}
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
        data-route-tray-drop-zone="true"
        bgColor={isSpecialMapBoard ? "#FCF5E8" : "#FDF6EA"}
        borderTop="1px solid rgba(185,152,115,0.12)"
        direction="column"
        overflow={isPuzzleTypeTabGuideActive ? "visible" : "hidden"}
      >
        <Flex
          minH={isSpecialMapBoard ? "154px" : "166px"}
          maxH={isSpecialMapBoard ? "154px" : "166px"}
          bgColor={isSpecialMapBoard ? "#FCF5E8" : "#FDF6EA"}
          direction="column"
          position="relative"
        >
          {isSpecialMapBoard ? (
            <Flex w="100%" px="12px" pt="10px" gap="8px" alignItems="center">
              <Flex
                flex="1"
                h="42px"
                borderRadius="999px"
                bgColor="#B29164"
                alignItems="center"
                px="20px"
                justifyContent="center"
              >
                <Text color="white" fontSize="15px" fontWeight="700" lineHeight="1">
                  剩餘旋轉次數: {specialMapRemainingRotations}次
                </Text>
              </Flex>
              <Flex
                as="button"
                h="42px"
                minW="94px"
                px="14px"
                borderRadius="999px"
                bgColor="#B29164"
                alignItems="center"
                justifyContent="center"
                gap="8px"
                cursor="pointer"
                onClick={() => {
                  markBoardInteraction();
                  resetSpecialMapPuzzle();
                }}
              >
                <FiRefreshCw size={18} color="white" />
                <Text color="white" fontSize="15px" fontWeight="700" lineHeight="1">
                  重來
                </Text>
              </Flex>
            </Flex>
	          ) : (
	            <>
	              <Flex
	                w="100%"
	                h="52px"
	                minH="52px"
	                gap="8px"
	                bgColor="#F8E7CC"
	                px="10px"
	                py="4px"
	                overflowX="auto"
	                overflowY="hidden"
	                alignItems="center"
	                borderBottom="1px solid rgba(185,152,115,0.16)"
	                css={ROUTE_TRAY_SCROLLBAR_CSS}
	              >
	                {shouldShowRoutePuzzleTab ? (
	                  <SimpleTrayTabButton
	                    tabKey="route"
	                    isActive={displayedTab === "route"}
	                    isAvailable
	                    onClick={() => {
	                      markBoardInteraction();
	                      markPuzzleTypeTabGuideSeen();
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
	                    markPuzzleTypeTabGuideSeen();
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
	                      markPuzzleTypeTabGuideSeen();
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
	                      markPuzzleTypeTabGuideSeen();
	                      setActiveTab("convenience");
	                    }}
	                  />
	                ) : null}
	              </Flex>
	              {isPuzzleTypeTabGuideActive ? (
	                <Flex
	                  position="absolute"
	                  top="-42px"
	                  left="88px"
	                  zIndex={24}
	                  alignItems="center"
	                  gap="8px"
	                  pointerEvents="none"
	                >
	                  <Image
	                    src="/images/pointer_up.png"
	                    alt=""
	                    aria-hidden="true"
	                    w="42px"
	                    h="42px"
	                    objectFit="contain"
	                    filter="drop-shadow(0 6px 9px rgba(66, 45, 29, 0.28))"
	                    animation={`${puzzleTypeTabGuideTap} 1.05s ease-in-out infinite`}
	                  />
	                  <Flex
	                    position="relative"
	                    minH="34px"
	                    px="12px"
	                    py="8px"
	                    borderRadius="14px"
	                    bgColor="rgba(255, 250, 235, 0.98)"
	                    border="2px solid #B98A62"
	                    boxShadow="0 10px 20px rgba(86, 58, 35, 0.18)"
	                    alignItems="center"
	                  >
	                    <Box
	                      position="absolute"
	                      left="-6px"
	                      top="50%"
	                      transform="translateY(-50%) rotate(45deg)"
	                      w="10px"
	                      h="10px"
	                      bgColor="rgba(255, 250, 235, 0.98)"
	                      borderLeft="2px solid #B98A62"
	                      borderBottom="2px solid #B98A62"
	                    />
	                    <Text color="#7B5C43" fontSize="13px" fontWeight="900" lineHeight="1.25" whiteSpace="nowrap">
	                      點擊來切換拼圖類型
	                    </Text>
	                  </Flex>
	                </Flex>
	              ) : null}
	            </>
	          )}
	          <Flex
            ref={routeTrayScrollerRef}
            flex="1"
            minW="0"
            minH="0"
            gap="10px"
            overflowX="auto"
            overflowY="hidden"
            px={isSpecialMapBoard ? "14px" : "10px"}
            pt={isSpecialMapBoard ? "10px" : "10px"}
            pb={isSpecialMapBoard ? "10px" : "22px"}
            alignItems="flex-start"
            wrap="nowrap"
            alignContent="flex-start"
            css={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
            onScroll={updateRouteTrayScrollState}
          >
            {isSpecialMapBoard ? (
              <Flex
                minW="84px"
                w="84px"
                h="84px"
                borderRadius="4px"
                overflow="hidden"
                bgColor="transparent"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                cursor="grab"
                touchAction="none"
                userSelect="none"
                onPointerDown={(event) => {
                  markBoardInteraction();
                  startPointerDrag(event, { routeId: buildSpecialCornerRouteId() }, { size: 84 });
                }}
                title="拖曳放入格子：轉角路徑"
              >
                <SpecialCornerRouteVisual candidate={SPECIAL_MYSTERY_CORNER_CANDIDATES[0]} />
              </Flex>
            ) : displayedTab === "metro"
              ? metroTrayTiles.map((tile) => {
                const nextInstanceId = tile.instanceIds.find(
                  (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                );
                const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                return (
                  <StackedTrayTile
                    key={tile.stackId}
                    size={84}
                    count={tile.remainingCount}
                    canDrag={canDrag}
                    onPointerDown={(event) => {
                      if (!nextInstanceId) {
                        event.preventDefault();
                        return;
                      }
                      markBoardInteraction();
                      startPointerDrag(event, { routeId: nextInstanceId }, { size: 84 });
                    }}
                    title={tile.label}
                  >
                    <GridPattern
                      pattern={tile.pattern}
                      centerEmoji={tile.centerEmoji}
                      imagePath={tile.imagePath}
                      imageFallbackPath={tile.imageFallbackPath}
                      overlayIconPath={tile.overlayIconPath}
                    />
                  </StackedTrayTile>
                );
              })
              : displayedTab === "street"
                ? streetTrayTiles.map((tile) => {
                  const nextInstanceId = tile.instanceIds.find(
                    (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                  );
                  const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                  return (
                    <StackedTrayTile
                      key={tile.stackId}
                      size={86}
                      count={tile.remainingCount}
                      canDrag={canDrag}
                      onPointerDown={(event) => {
                        if (!nextInstanceId) {
                          event.preventDefault();
                          return;
                        }
                        markBoardInteraction();
                        startPointerDrag(event, { routeId: nextInstanceId }, { size: 86 });
                      }}
                      title={tile.label}
                    >
                      <GridPattern
                        pattern={tile.pattern}
                        centerEmoji={tile.centerEmoji}
                        imagePath={tile.imagePath}
                        imageFallbackPath={tile.imageFallbackPath}
                        overlayIconPath={tile.overlayIconPath}
                      />
                    </StackedTrayTile>
                  );
                })
              : displayedTab === "convenience"
                ? convenienceTrayTiles.map((tile) => {
                  const nextInstanceId = tile.instanceIds.find(
                    (id) => !placedTileIds.has(id) && !consumedPlaceTileIdSet.has(id),
                  );
                  const canDrag = Boolean(nextInstanceId) && tile.remainingCount > 0;
                  return (
                    <StackedTrayTile
                      key={tile.stackId}
                      size={86}
                      count={tile.remainingCount}
                      canDrag={canDrag}
                      onPointerDown={(event) => {
                        if (!nextInstanceId) {
                          event.preventDefault();
                          return;
                        }
                        markBoardInteraction();
                        startPointerDrag(event, { routeId: nextInstanceId }, { size: 86 });
                      }}
                      title={tile.label}
                    >
                      <GridPattern
                        pattern={tile.pattern}
                        centerEmoji={tile.centerEmoji}
                        imagePath={tile.imagePath}
                        imageFallbackPath={tile.imageFallbackPath}
                        overlayIconPath={tile.overlayIconPath}
                      />
                    </StackedTrayTile>
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
                  cursor="grab"
                  touchAction="none"
                  userSelect="none"
                  onPointerDown={(event) => {
                    markBoardInteraction();
                    startPointerDrag(event, { routeId: tile.id }, { size: 84 });
                  }}
                  title={`拖曳放入格子：${tile.label}`}
                >
                  <GridPattern
                    pattern={tile.pattern}
                    imagePath={tile.imagePath}
                    imageFallbackPath={tile.imageFallbackPath}
                    overlayIconPath={tile.overlayIconPath}
                  />
                </Flex>
              ))}
          </Flex>
          {shouldShowRouteTrayScrollHint ? (
            <Box
              position="absolute"
              left="18px"
              right="18px"
              bottom="8px"
              h="7px"
              borderRadius="999px"
              bgColor="rgba(218, 190, 153, 0.46)"
              border="1px solid rgba(255, 250, 239, 0.9)"
              pointerEvents="none"
              boxShadow="inset 0 1px 2px rgba(123, 86, 54, 0.12)"
            >
              <Box
                position="absolute"
                top="1px"
                bottom="1px"
                left={`${routeTrayThumbLeftPercent}%`}
                w={`${routeTrayThumbWidthPercent}%`}
                borderRadius="999px"
                bgColor="#B98A62"
                boxShadow="0 1px 3px rgba(123, 86, 54, 0.24)"
                transition="left 80ms linear, width 120ms ease"
              />
            </Box>
          ) : null}
        </Flex>
        <Flex
          minH="68px"
          bgColor="#B88E6D"
          alignItems="center"
          justifyContent="flex-end"
          px="18px"
          py="8px"
          borderTopLeftRadius="18px"
          borderTopRightRadius="18px"
          border="0"
          borderBottom="0"
        >
          <Flex
            as="button"
            w="100%"
            maxW="126px"
            h="42px"
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
          onStartCompanyTransition={(onArriveCompany) => {
            departureRouteMapPointsRef.current = buildSpecialMapDepartureMapPoints();
            startDepartureTransition(
              "前往公司",
              onArriveCompany,
              resolveDepartureMapLegToSource("company", "special-map"),
            );
          }}
          onOpenCollection={(onContinue) => {
            const progress = loadPlayerProgress();
            savePlayerProgress({
              ...progress,
              hasTriggeredOfficeSunbeastChickenEvent: true,
              hasUnlockedSunbeastChickenHint: true,
            });
            unlockDiaryEntry("bai-entry-3");
            onProgressSaved?.();
            openSunbeastDiaryBeforeContinue(onContinue, {
              mode: "sunbeast-chicken-reveal",
              revealEntryId: "bai-entry-3",
              initialCardId: "chicken",
            });
          }}
          onFinish={(fatigueIncrease) => {
            if (fatigueIncrease > 0) {
              onPlayerStatusChange((prev) => ({
                ...prev,
                fatigue: Math.max(0, prev.fatigue + fatigueIncrease),
              }));
            }
            const progress = loadPlayerProgress();
            savePlayerProgress({
              ...progress,
              hasTriggeredOfficeSunbeastChickenEvent: true,
              hasUnlockedSunbeastChickenHint: true,
            });
            onProgressSaved?.();
            finishEventFlow(() => {
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            });
          }}
        />
      ) : null}

      {activeEventId === "office-sunbeast-koala" ? (
        <OfficeSunbeastKoalaEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onOpenDiary={(onContinue) => {
            openRoosterDiaryAfterKoalaCollection(onContinue);
          }}
          onFinish={() => {
            setActiveEventId(null);
            router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
          }}
        />
      ) : null}

      {activeEventId === "bus-brake-fall" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={BUS_BRAKE_FALL_EVENT_COPY.sceneTitle}
          backgroundImage="/images/outside/bus.jpg"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          comicImage={BUS_BRAKE_FALL_EVENT_COPY.comicImage}
          line={BUS_BRAKE_FALL_EVENT_COPY.line}
          effectText={BUS_BRAKE_FALL_EVENT_COPY.effect}
          outcomeCue={{ label: "疲勞值", delta: 5 }}
          onResolveOutcome={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
          }}
          onFinish={() => {
            finishEventFlow();
          }}
        />
      ) : null}

      {activeEventId === "bus-backpack-hit" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={BUS_BACKPACK_HIT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/outside/bus.jpg"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          comicImage={BUS_BACKPACK_HIT_EVENT_COPY.comicImage}
          line={BUS_BACKPACK_HIT_EVENT_COPY.line}
          effectText={BUS_BACKPACK_HIT_EVENT_COPY.effect}
          outcomeCue={{ label: "疲勞值", delta: 5 }}
          onResolveOutcome={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
          }}
          onFinish={() => {
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
          comicImage={METRO_BACKPACK_HIT_EVENT_COPY.comicImage}
          line={METRO_BACKPACK_HIT_EVENT_COPY.line}
          effectText={METRO_BACKPACK_HIT_EVENT_COPY.effect}
          outcomeCue={{ label: "疲勞值", delta: 5 }}
          onResolveOutcome={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
          }}
          onFinish={() => {
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
        initialSunbeastCardId={sunbeastInitialCardId}
        unlockedEntryIds={sunbeastDiaryUnlockedEntryIds}
        onDiaryRevealEntryComplete={handleSunbeastDiaryClose}
        onFragmentedDiaryComplete={handleSunbeastDiaryClose}
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
          comicImage={METRO_SEAT_SPREAD_EVENT_COPY.comicImage}
          line={METRO_SEAT_SPREAD_EVENT_COPY.line}
          effectText={METRO_SEAT_SPREAD_EVENT_COPY.effect}
          outcomeCue={{ label: "疲勞值", delta: 5 }}
          onResolveOutcome={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + 5),
            }));
            markNegativeEventToday();
            onProgressSaved?.();
          }}
          onFinish={() => {
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
            onProgressSaved?.();
            setActiveEventId(null);
            openSunbeastDiaryBeforeContinue(() => {
              finishEventFlow();
            }, {
              mode: "first-photo-diary-reveal",
              revealEntryId: "bai-entry-1",
              initialCardId: "naotaro",
            });
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

      {activeEventId === "breakfast-shop-mai-clue" ? (
        <BreakfastShopMaiClueEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          visitNumber={Math.min(loadPlayerProgress().breakfastShopMaiClueVisitCount + 1, 3)}
          onFinish={() => {
            const nextVisitNumber = recordBreakfastShopMaiClueVisit();
            if (nextVisitNumber >= 3) {
              const progress = loadPlayerProgress();
              savePlayerProgress({
                ...progress,
                hasUnlockedSpecialMap: true,
                hasAvailableSpecialMapPuzzle: true,
                hasUnlockedSunbeastChickenHint: true,
              });
              setActiveEventId(null);
              setPlacedRoutes({});
              setSpecialMapRotationCount(0);
              setHoverCell(null);
              setActiveTab("route");
              setActiveMapKind("special");
              showDropToast("取得河畔地圖。安排特殊地圖後，直接出發。", {
                type: "hint",
                hideMs: 2800,
                clearMs: 3200,
              });
              onProgressSaved?.();
              return;
            }
            onProgressSaved?.();
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

      {isStreetExploreOpen ? (
        <StreetExploreEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          showShoppingStreetNotice={!hasUnlockedSpecialMap}
          onFinish={handleStreetExploreFinish}
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

      {activeFrogDiaryClueStage ? (
        <FrogDiaryClueEventModal
          stage={activeFrogDiaryClueStage}
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          photoAttemptNumber={Math.min(loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount + 1, 3)}
          requiredPhotoAttempts={3}
          onFirstClueDiaryReveal={(resumeEvent) => {
            recordStreetForgotLunchFrogPhotoAttempt();
            onProgressSaved?.();
            openSunbeastDiaryBeforeContinue(resumeEvent, {
              mode: "frog-fragmented-diary",
            });
          }}
          onFinish={(outcome) => {
            const photoAttemptCount = outcome.attemptAlreadyRecorded
              ? loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount
              : recordStreetForgotLunchFrogPhotoAttempt();
            const hasCapturedFrog = outcome.result === "captured" || photoAttemptCount >= 3;
            if (!hasCapturedFrog) {
              if (photoAttemptCount === 2) {
                unlockBaiEntry2SecondFragment();
              }
              if (photoAttemptCount <= 2) {
                onProgressSaved?.();
                if (outcome.diaryRevealCompleted) {
                  finishEventFlow(
                    getFrogClueContinueAction({
                      returnToWorkAndOffwork: outcome.returnToWorkAndOffwork,
                    }),
                  );
                  return;
                }
                setActiveEventId(null);
                openSunbeastDiaryBeforeContinue(() => {
                  finishEventFlow(getFrogClueContinueAction());
                }, {
                  mode: "frog-fragmented-diary",
                });
                return;
              }
              onProgressSaved?.();
              finishEventFlow(getFrogClueContinueAction());
              return;
            }
            markStreetForgotLunchFrogEventCompleted();
            const progress = loadPlayerProgress();
            savePlayerProgress({
              ...progress,
              hasUnlockedSunbeastFrogHint: true,
            });
            onProgressSaved?.();
            const continueAfterFrogDiary = getFrogClueContinueAction();
            setActiveEventId(null);
            openSunbeastDiaryBeforeContinue(() => {
              finishEventFlow(continueAfterFrogDiary);
            }, {
              mode: "frog-fragmented-diary",
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

      {activeEventId === "restaurant-quick-meal" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={RESTAURANT_QUICK_MEAL_EVENT_COPY.sceneTitle}
          backgroundImage="/images/breakfast.jpg"
          line={RESTAURANT_QUICK_MEAL_EVENT_COPY.line}
          effectText={RESTAURANT_QUICK_MEAL_EVENT_COPY.effect}
          showAvatar={false}
          speakerLabel={null}
          onFinish={() => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              savings: Math.max(0, prev.savings - 1),
              fatigue: Math.max(0, prev.fatigue - 4),
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

      {ENABLE_PLACE_GUIDANCE_SYSTEM && activePlaceUnlockIntroId ? (
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
          variant={activeDependentCoworkerRequest ? "sticky-prelude" : "plain"}
          preludeDialogueOverride={activeDependentCoworkerRequest?.preludeDialogue}
          preludeCharacterNameOverride={activeDependentCoworkerRequest ? "同事" : undefined}
          preludeAvatarSpriteIdOverride={activeDependentCoworkerRequest ? "coworker" : undefined}
          preludeAvatarFrameIndexOverride={activeDependentCoworkerRequest ? 1 : undefined}
          onFinish={() => {
            setIsWorkTransitionOpen(false);
            if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
              forceOffworkAfterWorkTransitionRef.current = false;
              recordWorkShiftResult(0);
              onProgressSaved?.();
              setActiveEventId("office-sunbeast-koala");
              return;
            }
            if (
              forceOffworkAfterWorkTransitionRef.current ||
              workShiftCount === 0 ||
              !shouldOpenWorkMinigameAfterTransition
            ) {
              forceOffworkAfterWorkTransitionRef.current = false;
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
              return;
            }
            setIsWorkMinigameOpen(true);
          }}
        />
      ) : null}

      {(workShiftCount > 0 || forcedWorkMinigameKind) &&
      isWorkMinigameOpen &&
      activeWorkMinigameKind ? (
        activeWorkMinigameKind === "park-ostrich" ? (
          <ParkOstrichTickleMinigameModal
            baseFatigue={playerStatus.fatigue}
            onSkip={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(18);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
          />
        ) : activeWorkMinigameKind === "office-chicken" ? (
          <OfficeChickenFocusMinigameModal
            baseFatigue={playerStatus.fatigue}
            onSkip={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(18);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
          />
        ) : activeWorkMinigameKind === "stamp-documents" ? (
          <WorkStampMinigameModal
            baseFatigue={playerStatus.fatigue}
            onSkip={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(18);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
          />
        ) : activeWorkMinigameKind === "export-pdf" ? (
          <WorkPdfExportMinigameModal
            baseFatigue={playerStatus.fatigue}
            onSkip={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(18);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(0);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
          />
        ) : (
          <WorkMinigameTestModal
            baseFatigue={playerStatus.fatigue}
            onSkip={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              recordWorkShiftResult(18);
              onProgressSaved?.();
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            onComplete={() => {
              setIsWorkMinigameOpen(false);
              setForcedWorkMinigameKind(null);
              if (activeDependentCoworkerRequest) {
                recordDependentCoworkerRequestCompleted();
              }
              recordWorkShiftResult(0);
              onProgressSaved?.();
              if (shouldTriggerOfficeSunbeastKoalaEvent(loadPlayerProgress())) {
                setActiveEventId("office-sunbeast-koala");
                return;
              }
              router.push(withTrialProfileSearch(ROUTES.gameScene(OFFWORK_SCENE_ID)));
            }}
            title={activeDependentCoworkerRequest?.minigameTitle}
            successRewardHeading={activeDependentCoworkerRequest ? "同事的請託" : undefined}
            successRewardLabel={activeDependentCoworkerRequest?.successRewardLabel}
            successFootnote={activeDependentCoworkerRequest?.successFootnote}
          />
        )
      ) : null}

      {ENABLE_ARRANGE_ROUTE_TUTORIALS && isTutorialModalOpen ? (
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

      {shouldShowSpecialMapRotationGuide ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={65}
          bgColor="rgba(31,24,18,0.42)"
          alignItems="center"
          justifyContent="center"
          px="22px"
        >
          <Flex
            w="100%"
            maxW="340px"
            direction="column"
            borderRadius="18px"
            overflow="hidden"
            bgColor="#FFFDF8"
            border="2px solid #B99873"
            boxShadow="0 16px 34px rgba(49,40,28,0.28)"
          >
            <Flex h="58px" px="22px" bgColor="#8E7758" alignItems="center">
              <Text color="white" fontSize="18px" fontWeight="800" lineHeight="1">
                旋轉挑戰
              </Text>
            </Flex>
            <Flex direction="column" px="22px" pt="22px" pb="20px" gap="18px">
              <Text color="#745A43" fontSize="16px" fontWeight="700" lineHeight="1.75">
                這個特殊地圖是旋轉挑戰。拼圖放置後，再次點擊會旋轉；相鄰的拼圖會一起旋轉。
              </Text>
              <Flex
                as="button"
                alignSelf="center"
                minW="132px"
                h="44px"
                borderRadius="999px"
                bgColor="#B29164"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => {
                  const progress = loadPlayerProgress();
                  if (!progress.hasSeenSpecialMapRotationGuide) {
                    savePlayerProgress({
                      ...progress,
                      hasSeenSpecialMapRotationGuide: true,
                    });
                    onProgressSaved?.();
                  }
                }}
              >
                <Text color="white" fontSize="17px" fontWeight="800" lineHeight="1">
                  確定
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isSpecialMapRotationLimitModalOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={66}
          bgColor="rgba(31,24,18,0.42)"
          alignItems="center"
          justifyContent="center"
          px="22px"
        >
          <Flex
            w="100%"
            maxW="340px"
            direction="column"
            borderRadius="18px"
            overflow="hidden"
            bgColor="#FFFDF8"
            border="2px solid #B99873"
            boxShadow="0 16px 34px rgba(49,40,28,0.28)"
          >
            <Flex h="58px" px="22px" bgColor="#B88E6D" alignItems="center">
              <Text color="white" fontSize="18px" fontWeight="800" lineHeight="1">
                旋轉次數用完了
              </Text>
            </Flex>
            <Flex direction="column" px="22px" pt="22px" pb="20px" gap="18px">
              <Text color="#745A43" fontSize="16px" fontWeight="700" lineHeight="1.7">
                拼圖會先歸位，請重新安排路徑。
              </Text>
              <Flex
                as="button"
                alignSelf="center"
                minW="132px"
                h="44px"
                borderRadius="999px"
                bgColor="#B29164"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => {
                  resetSpecialMapPuzzle();
                  setIsSpecialMapRotationLimitModalOpen(false);
                }}
              >
                <Text color="white" fontSize="17px" fontWeight="800" lineHeight="1">
                  確認
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {ENABLE_PLACE_GUIDANCE_SYSTEM && activeArrangeRoutePromptId === "intro-depart-to-metro" ? (
        <ArrangeRouteDialogOverlay
          speaker="小麥"
          text="出發去捷運站吧"
          avatarSpriteId="mai"
          avatarFrameIndex={0}
          onContinue={() => setActiveArrangeRoutePromptId(null)}
        />
      ) : null}

      {ENABLE_PLACE_GUIDANCE_SYSTEM && isMapOverlayOpen ? (
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

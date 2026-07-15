"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEye, FiHelpCircle, FiX } from "react-icons/fi";
import { DiaryOverlay, type DiaryOverlayMode } from "@/components/game/DiaryOverlay";
import {
  StoryRouteDragPreviewLayer,
  StoryRoutePuzzleBoardTile,
  useStoryRoutePointerDrag,
} from "@/components/game/StoryRoutePuzzleKit";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  loadPlayerProgress,
  markWorkLunchForgotBentoEventTriggered,
  recordArrangeRouteDeparture,
  type PlaceTileId,
} from "@/lib/game/playerProgress";
import type { GameEventId } from "@/lib/game/events";
import {
  getFrogDiaryClueStageByAttempt,
  type FrogDiaryClueRouteTileId,
} from "@/lib/game/frogDiaryClueFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";
import {
  WORK_LUNCH_SCENE_JUMP_OPTION_ID,
  WORK_LUNCH_SCENE_JUMP_STEPS,
} from "@/lib/game/workLunchSceneJump";
import { StoryMetroExitRouteView } from "@/components/game/StoryMetroExitRouteView";
import {
  getReachableRouteGridIndices,
  getRouteGridOrthogonalNeighborIndices,
  isRouteGridConnected,
  type RouteGridConnector,
} from "@/lib/game/routeGrid";

export type StoryRouteMode = "simple-metro" | "frog-clue" | "work-lunch-convenience" | "metro-exit";

type StorySimpleRouteStage = "intro" | "choice" | "ready" | "departing";
type RouteChoice = {
  id: string;
  label: string;
  imagePath: string;
  alt: string;
  mapIconPath: string;
  fallbackEventId: GameEventId;
  frogRouteTileId?: FrogDiaryClueRouteTileId;
};
type RouteEdgeWidth = "narrow" | "wide";
type RouteEdgeMismatch = {
  top: boolean;
  bottom: boolean;
};
type FrogRoutePuzzleChoice = RouteChoice & {
  topEdge: RouteEdgeWidth;
  bottomEdge: RouteEdgeWidth;
};
type FrogRouteSlotIndex = 0 | 1;
type FrogRouteSeamPlacement = "top" | "middle" | "bottom";
type FrogRestaurantCornerId = "left-top" | "right-top" | "right-bottom" | "left-bottom";
type FrogRestaurantSlotIndex = 0 | 1;
type FrogRestaurantCornerConnector = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};
type FrogRestaurantCornerCandidate = {
  id: FrogRestaurantCornerId;
  connector: FrogRestaurantCornerConnector;
  rotationDeg: number;
  offsetX: number;
  offsetY: number;
};
type FrogRestaurantPlacedCorner = {
  id: string;
  cornerId: FrogRestaurantCornerId;
  visualRotationDeg: number;
};

export type StoryDailyLevelOneLocationChoice = {
  id: string;
  label: string;
  imagePath: string;
  locationId: string;
  iconPath: string;
};

type StoryDailyLevelOnePlacedTile =
  | ({ kind: "corner" } & FrogRestaurantPlacedCorner)
  | {
      kind: "location";
      id: string;
      choice: StoryDailyLevelOneLocationChoice;
    };

type StoryDailyLevelOneHeldTile =
  | { kind: "corner" }
  | { kind: "location"; choice: StoryDailyLevelOneLocationChoice };

const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const STORY_ROUTE_DEPARTURE_STORAGE_KEY = "moment:story-route-departure-itinerary";
const START_HOME_WIDE_IMAGE_PATH = "/images/route/start_end_new/start_home_wide.jpg";
const END_COMPANY_WIDE_IMAGE_PATH = "/images/route/start_end_new/end_company_wide.jpg";
const START_HOME_NARROW_IMAGE_PATH = "/images/route/start_end_new/start_home_narrow.jpg";
const END_COMPANY_NARROW_IMAGE_PATH = "/images/route/start_end_new/end_company_narror.jpg";
const START_COMPANY_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_narrow_compnay.png";
const RESTAURANT_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/wide_to_narrow_pizza.png";
const SPECIAL_NORMAL_CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const METRO_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_捷運.png";
const STREET_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_街道.png";
const STREET_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_to_narrow_街道.png";
const STREET_WIDE_TO_WIDE_IMAGE_PATH = "/images/route/route_new/wide_to_wide_街道.png";
const METRO_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_to_narrow_捷運.png";
const METRO_WIDE_TO_WIDE_IMAGE_PATH = "/images/route/route_new/wide_to_wide_捷運.png";
const CONVENIENCE_STORE_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_to_narrow_超商.png";
const CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_超商.png";
const BREAKFAST_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_to_narrow_早餐店.png";
const BREAKFAST_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_早餐店.png";
const BREAKFAST_WIDE_TO_WIDE_IMAGE_PATH = "/images/route/route_new/wide_to_wide_早餐店.png";
const BREAKFAST_ICON_PATH = "/images/icon/breakfast.png";
const ROUTE_STRAIGHT_NARROW_IMAGE_PATH = "/images/route/rt_010_010_010.png";
const ROUTE_NARROW_TO_WIDE_IMAGE_PATH = "/images/route/rt_010_010_111.jpg";
const ROUTE_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/rt_1111_010_010.jpg";
const ROUTE_WIDE_TO_WIDE_IMAGE_PATH = "/images/route/rt_111_010_111.jpg";
const SIMPLE_METRO_ROUTE_CHOICE: RouteChoice = {
  id: "metro-station",
  label: "捷運",
  imagePath: METRO_STRAIGHT_IMAGE_PATH,
  alt: "捷運拼圖",
  mapIconPath: "/images/icon/mrt.png",
  fallbackEventId: "metro-commute-laugh",
};
const SIMPLE_STREET_ROUTE_CHOICE: RouteChoice = {
  id: "street",
  label: "街道",
  imagePath: STREET_STRAIGHT_IMAGE_PATH,
  alt: "街道拼圖",
  mapIconPath: "/images/icon/street.png",
  fallbackEventId: "street-comfy-breeze",
};
const SIMPLE_ROUTE_CHOICES: RouteChoice[] = [
  SIMPLE_METRO_ROUTE_CHOICE,
  SIMPLE_STREET_ROUTE_CHOICE,
];
const SIMPLE_STREET_DAILY_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "street-comfy-breeze",
  "street-humid-weather",
];
const FROG_ROUTE_PUZZLE_CHOICES: FrogRoutePuzzleChoice[] = [
  {
    id: "frog-street-wide-to-narrow",
    label: "街道",
    imagePath: STREET_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "街道路線拼圖",
    mapIconPath: "/images/icon/street.png",
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "street",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "frog-street-wide-to-wide",
    label: "街道",
    imagePath: STREET_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "街道路線拼圖",
    mapIconPath: "/images/icon/street.png",
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "street",
    topEdge: "wide",
    bottomEdge: "wide",
  },
  {
    id: "frog-metro-wide-to-narrow",
    label: "捷運",
    imagePath: METRO_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "frog-metro-straight",
    label: "捷運",
    imagePath: METRO_STRAIGHT_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "frog-shop-straight",
    label: "商店",
    imagePath: CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH,
    alt: "商店路線拼圖",
    mapIconPath: "/images/icon/mart.png",
    fallbackEventId: "convenience-store-hub",
    frogRouteTileId: "shop",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "frog-breakfast-wide-to-narrow",
    label: "早餐店",
    imagePath: BREAKFAST_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "早餐店路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "restaurant",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "frog-breakfast-straight",
    label: "早餐店",
    imagePath: BREAKFAST_STRAIGHT_IMAGE_PATH,
    alt: "早餐店路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "restaurant",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "frog-breakfast-wide-to-wide",
    label: "早餐店",
    imagePath: BREAKFAST_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "早餐店路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "restaurant",
    topEdge: "wide",
    bottomEdge: "wide",
  },
];
const FROG_RETURN_HOME_ROUTE_PUZZLE_CHOICES: FrogRoutePuzzleChoice[] = [
  {
    id: "frog-return-street-wide-to-narrow",
    label: "街道",
    imagePath: STREET_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "街道路線拼圖",
    mapIconPath: "/images/icon/street.png",
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "street",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "frog-return-street-wide-to-wide",
    label: "街道",
    imagePath: STREET_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "街道路線拼圖",
    mapIconPath: "/images/icon/street.png",
    fallbackEventId: "street-comfy-breeze",
    frogRouteTileId: "street",
    topEdge: "wide",
    bottomEdge: "wide",
  },
  {
    id: "frog-return-metro-wide-to-wide",
    label: "捷運",
    imagePath: METRO_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "wide",
    bottomEdge: "wide",
  },
  {
    id: "frog-return-metro-wide-to-narrow",
    label: "捷運",
    imagePath: METRO_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "frog-return-metro-straight",
    label: "捷運",
    imagePath: METRO_STRAIGHT_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "frog-return-shop-straight",
    label: "商店",
    imagePath: CONVENIENCE_STORE_STRAIGHT_IMAGE_PATH,
    alt: "商店路線拼圖",
    mapIconPath: "/images/icon/mart.png",
    fallbackEventId: "convenience-store-hub",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "frog-return-shop-wide-to-narrow",
    label: "商店",
    imagePath: CONVENIENCE_STORE_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "商店路線拼圖",
    mapIconPath: "/images/icon/mart.png",
    fallbackEventId: "convenience-store-hub",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
];
function getFrogRoutePuzzleChoices(photoAttemptCount: number) {
  return photoAttemptCount === 1
    ? FROG_RETURN_HOME_ROUTE_PUZZLE_CHOICES
    : FROG_ROUTE_PUZZLE_CHOICES;
}

function getRouteChoiceDepartureSourceId(choice: RouteChoice): PlaceTileId | null {
  if (choice.frogRouteTileId === "street") return "street";
  if (choice.frogRouteTileId === "shop") return "convenience-store";
  if (choice.frogRouteTileId === "restaurant") return "breakfast-shop";
  if (choice.id.includes("shop") || choice.label.includes("商店")) return "convenience-store";
  if (choice.id.includes("metro")) return "metro-station";
  if (choice.id.includes("bus")) return "bus-stop";
  return null;
}

function saveStoryRouteDepartureItinerary(params: {
  points: Array<{ sourceId: PlaceTileId; eventId: GameEventId }>;
  currentSourceId: PlaceTileId;
}) {
  if (typeof window === "undefined") return;
  const sourceIds = Array.from(
    new Set(
      params.points.some((point) => point.sourceId === params.currentSourceId)
        ? params.points.map((point) => point.sourceId)
        : [params.currentSourceId, ...params.points.map((point) => point.sourceId)],
    ),
  );
  const eventIdsBySource = params.points.reduce<Partial<Record<PlaceTileId, GameEventId>>>(
    (eventsBySource, point) => {
      if (!eventsBySource[point.sourceId]) {
        eventsBySource[point.sourceId] = point.eventId;
      }
      return eventsBySource;
    },
    {},
  );
  window.sessionStorage.setItem(
    STORY_ROUTE_DEPARTURE_STORAGE_KEY,
    JSON.stringify({
      sourceIds,
      currentSourceId: params.currentSourceId,
      eventIdsBySource,
      createdAt: Date.now(),
    }),
  );
}
const WORK_LUNCH_TUTORIAL_FIXED_ROUTE_IMAGE_PATH = ROUTE_WIDE_TO_NARROW_IMAGE_PATH;
const WORK_LUNCH_TUTORIAL_ROUTE_CHOICES: RouteChoice[] = [
  {
    id: "tutorial-narrow-to-wide-route",
    label: "窄接寬",
    imagePath: ROUTE_NARROW_TO_WIDE_IMAGE_PATH,
    alt: "窄接寬路徑拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
  {
    id: "tutorial-straight-narrow-route",
    label: "窄路徑",
    imagePath: ROUTE_STRAIGHT_NARROW_IMAGE_PATH,
    alt: "窄路徑拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
];
const WORK_LUNCH_CONVENIENCE_STORE_ROUTE_IMAGE_PATH = CONVENIENCE_STORE_WIDE_TO_NARROW_IMAGE_PATH;
const WORK_LUNCH_COMPANY_ROUTE_IMAGE_PATH = START_COMPANY_WIDE_TO_NARROW_IMAGE_PATH;
const WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID = "narrow-to-wide-route";
const WORK_LUNCH_ROUTE_CHOICES: RouteChoice[] = [
  {
    id: "wide-to-narrow-route",
    label: "寬接窄",
    imagePath: ROUTE_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "寬接窄路徑拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
  {
    id: "straight-route",
    label: "直路",
    imagePath: ROUTE_STRAIGHT_NARROW_IMAGE_PATH,
    alt: "直路拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
  {
    id: "wide-to-wide-route",
    label: "寬接寬",
    imagePath: ROUTE_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "寬接寬路徑拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
  {
    id: WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID,
    label: "窄接寬",
    imagePath: ROUTE_NARROW_TO_WIDE_IMAGE_PATH,
    alt: "窄接寬路徑拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
];
const WORK_LUNCH_REQUIRED_ROUTE_EDGES: { top: RouteEdgeWidth; bottom: RouteEdgeWidth } = {
  top: "narrow",
  bottom: "wide",
};
const WORK_LUNCH_ROUTE_EDGES_BY_CHOICE_ID: Record<string, { top: RouteEdgeWidth; bottom: RouteEdgeWidth }> = {
  "wide-to-narrow-route": { top: "wide", bottom: "narrow" },
  "straight-route": { top: "narrow", bottom: "narrow" },
  "wide-to-wide-route": { top: "wide", bottom: "wide" },
  "narrow-to-wide-route": { top: "narrow", bottom: "wide" },
};
const FROG_RESTAURANT_ROTATION_LIMIT = 4;
const FROG_RESTAURANT_TUTORIAL_STEPS = [
  "轉彎拼圖放上去，點擊可以轉向",
  "∞的拼圖可以重複使用",
  "當轉彎拼圖轉向時，鄰近的轉彎拼圖會跟著轉",
] as const;
const FROG_RESTAURANT_INITIAL_CORNER_ID: FrogRestaurantCornerId = "right-top";
const FROG_RESTAURANT_ROTATION_STEP_DEG = -90;
const FROG_RESTAURANT_CORNER_CANDIDATES: FrogRestaurantCornerCandidate[] = [
  {
    id: "left-top",
    connector: { top: true, right: false, bottom: false, left: true },
    rotationDeg: 0,
    offsetX: 0,
    offsetY: 0,
  },
  {
    id: "right-top",
    connector: { top: true, right: true, bottom: false, left: false },
    rotationDeg: 90,
    offsetX: 1,
    offsetY: -1,
  },
  {
    id: "right-bottom",
    connector: { top: false, right: true, bottom: true, left: false },
    rotationDeg: 180,
    offsetX: 1,
    offsetY: 1,
  },
  {
    id: "left-bottom",
    connector: { top: false, right: false, bottom: true, left: true },
    rotationDeg: -90,
    offsetX: -1,
    offsetY: 1,
  },
];
const FROG_RESTAURANT_CORNER_ROTATION_ORDER: FrogRestaurantCornerId[] = [
  "left-top",
  "left-bottom",
  "right-bottom",
  "right-top",
];
const DAILY_LEVEL_ONE_BOARD_ROWS = 3;
const DAILY_LEVEL_ONE_BOARD_COLS = 2;
const DAILY_LEVEL_ONE_GRAPH_ROWS = 5;
const DAILY_LEVEL_ONE_GRAPH_COLS = 2;
const DAILY_LEVEL_ONE_END_INDEX = 0;
const DAILY_LEVEL_ONE_START_INDEX = 8;
const DAILY_LEVEL_ONE_ROTATION_LIMIT = 8;
const DAILY_LEVEL_ONE_GOAL_IMAGE_PATH = "/images/route/route_new/wide_to_wide.png";
const DAILY_LEVEL_ONE_WIDE_TO_NARROW_CONNECTOR: RouteGridConnector = {
  top: [0, 1, 2],
  right: [],
  bottom: [1],
  left: [],
};
const DAILY_LEVEL_ONE_START_CONNECTOR: RouteGridConnector = {
  top: [1],
  right: [],
  bottom: [],
  left: [],
};
const DAILY_LEVEL_ONE_END_CONNECTOR: RouteGridConnector = {
  top: [],
  right: [],
  bottom: [0, 1, 2],
  left: [],
};

function getFrogRestaurantCornerCandidate(cornerId: FrogRestaurantCornerId) {
  return (
    FROG_RESTAURANT_CORNER_CANDIDATES.find((candidate) => candidate.id === cornerId) ??
    FROG_RESTAURANT_CORNER_CANDIDATES[0]
  );
}

function rotateFrogRestaurantCornerId(cornerId: FrogRestaurantCornerId) {
  const currentIndex = FROG_RESTAURANT_CORNER_ROTATION_ORDER.indexOf(cornerId);
  return FROG_RESTAURANT_CORNER_ROTATION_ORDER[
    (currentIndex + 1) % FROG_RESTAURANT_CORNER_ROTATION_ORDER.length
  ];
}

function makeDailyLevelOneCorner(
  cornerId: FrogRestaurantCornerId = "left-top",
): StoryDailyLevelOnePlacedTile {
  return {
    kind: "corner",
    id: `daily-level-one-corner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cornerId,
    visualRotationDeg: getFrogRestaurantCornerCandidate(cornerId).rotationDeg,
  };
}

function createDailyLevelOneInitialBoard(): Array<StoryDailyLevelOnePlacedTile | null> {
  return [null, null, null, null, null, makeDailyLevelOneCorner("left-top")];
}

function getDailyLevelOneTileConnector(
  tile: StoryDailyLevelOnePlacedTile | null,
): RouteGridConnector | null {
  if (!tile) return null;
  if (tile.kind === "location") return DAILY_LEVEL_ONE_WIDE_TO_NARROW_CONNECTOR;
  const connector = getFrogRestaurantCornerCandidate(tile.cornerId).connector;
  return {
    top: connector.top ? [1] : [],
    right: connector.right ? [1] : [],
    bottom: connector.bottom ? [1] : [],
    left: connector.left ? [1] : [],
  };
}

function dailyLevelOneBoardIndexToGraphIndex(boardIndex: number) {
  const row = Math.floor(boardIndex / DAILY_LEVEL_ONE_BOARD_COLS);
  const col = boardIndex % DAILY_LEVEL_ONE_BOARD_COLS;
  return (row + 1) * DAILY_LEVEL_ONE_GRAPH_COLS + col;
}

function getFrogRouteEventId(choice: RouteChoice, photoAttemptCount: number): GameEventId {
  const targetStage = getFrogDiaryClueStageByAttempt(photoAttemptCount);
  if (photoAttemptCount >= 3 && choice.frogRouteTileId === "restaurant") {
    return "breakfast-shop-mai-clue";
  }
  return choice.frogRouteTileId === targetStage.routeTileId ? targetStage.eventId : choice.fallbackEventId;
}

function getFrogRoutePuzzleEventChoice(
  placedChoices: readonly (FrogRoutePuzzleChoice | null)[],
  photoAttemptCount: number,
) {
  const targetStage = getFrogDiaryClueStageByAttempt(photoAttemptCount);
  return (
    placedChoices.find((choice) => choice?.frogRouteTileId === targetStage.routeTileId) ??
    placedChoices.find(Boolean) ??
    null
  );
}

function isFrogRoutePuzzleConnected(placedChoices: readonly (FrogRoutePuzzleChoice | null)[]) {
  const [firstChoice, secondChoice] = placedChoices;
  if (!firstChoice || !secondChoice) return false;
  return (
    firstChoice.topEdge === "wide" &&
    firstChoice.bottomEdge === secondChoice.topEdge &&
    secondChoice.bottomEdge === "narrow"
  );
}

function getFrogRoutePuzzleMismatchSeams(
  placedChoices: readonly (FrogRoutePuzzleChoice | null)[],
): FrogRouteSeamPlacement[] {
  const [firstChoice, secondChoice] = placedChoices;
  const seams: FrogRouteSeamPlacement[] = [];

  if (firstChoice && firstChoice.topEdge !== "wide") seams.push("top");
  if (firstChoice && secondChoice && firstChoice.bottomEdge !== secondChoice.topEdge) {
    seams.push("middle");
  }
  if (secondChoice && secondChoice.bottomEdge !== "narrow") seams.push("bottom");

  return seams;
}

const stageEnter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const tilePop = keyframes`
  0% { opacity: 0; transform: scale(0.86); }
  72% { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
`;

const cursorBlink = keyframes`
  0%, 42% { opacity: 1; }
  43%, 100% { opacity: 0; }
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

const simpleRouteTutorialEnter = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const simpleRouteTutorialCardIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const simpleRouteTutorialDragTile = keyframes`
  0%, 12% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  48% { opacity: 1; transform: translate3d(96px, -84px, 0) scale(1.02); }
  66% { opacity: 1; transform: translate3d(120px, -118px, 0) scale(0.96); }
  76%, 100% { opacity: 0; transform: translate3d(120px, -118px, 0) scale(0.96); }
`;

const simpleRouteTutorialSourceTile = keyframes`
  0%, 12% { opacity: 1; transform: scale(1); }
  18%, 72% { opacity: 0.34; transform: scale(0.96); }
  86%, 100% { opacity: 1; transform: scale(1); }
`;

const simpleRouteTutorialPlacedTile = keyframes`
  0%, 58% { opacity: 0; transform: scale(0.9); }
  68%, 88% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.96); }
`;

const simpleRouteTutorialSlotPulse = keyframes`
  0%, 100% { border-color: rgba(191, 166, 139, 0.68); box-shadow: none; }
  52%, 72% { border-color: rgba(181, 142, 106, 0.98); box-shadow: 0 0 0 5px rgba(255, 221, 157, 0.32); }
`;

const frogRestaurantTutorialTileIn = keyframes`
  0%, 58% { opacity: 0; transform: scale(0.9); }
  68%, 100% { opacity: 1; transform: scale(1); }
`;

const frogRestaurantTutorialSharedRotate = keyframes`
  0%, 68% { transform: rotate(0deg); }
  86%, 100% { transform: rotate(-90deg); }
`;

const frogRestaurantTutorialDragLeft = keyframes`
  0%, 10% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.6667); }
  18%, 42% { opacity: 1; transform: translate3d(0, 0, 0) scale(0.6667); }
  64% { opacity: 1; transform: translate3d(14px, -141px, 0) scale(0.854); }
  72%, 100% { opacity: 0; transform: translate3d(14px, -141px, 0) scale(0.854); }
`;

const frogRestaurantTutorialDragRight = keyframes`
  0%, 10% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.6667); }
  18%, 42% { opacity: 1; transform: translate3d(0, 0, 0) scale(0.6667); }
  64% { opacity: 1; transform: translate3d(102px, -141px, 0) scale(0.854); }
  72%, 100% { opacity: 0; transform: translate3d(102px, -141px, 0) scale(0.854); }
`;

const workLunchTutorialSuccessDragTile = keyframes`
  0%, 8% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  44%, 50% { opacity: 1; transform: translate3d(73px, -220px, 0) scale(1); }
  56%, 100% { opacity: 0; transform: translate3d(73px, -220px, 0) scale(0.98); }
`;

const workLunchTutorialErrorDragTile = keyframes`
  0%, 8% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  44%, 50% { opacity: 1; transform: translate3d(-15px, -220px, 0) scale(1); }
  56%, 100% { opacity: 0; transform: translate3d(-15px, -220px, 0) scale(0.98); }
`;

const workLunchTutorialPlacedTile = keyframes`
  0%, 54% { opacity: 0; transform: scale(0.94); }
  62%, 100% { opacity: 1; transform: scale(1); }
`;

const workLunchTutorialSourceTile = keyframes`
  0%, 8% { opacity: 1; transform: scale(1); }
  16%, 88% { opacity: 0.34; transform: scale(0.96); }
  96%, 100% { opacity: 1; transform: scale(1); }
`;

const workLunchTutorialResultMark = keyframes`
  0%, 62% { opacity: 0; transform: scale(0.72); }
  72%, 100% { opacity: 1; transform: scale(1); }
`;

const workLunchTutorialErrorSeam = keyframes`
  0%, 62% { opacity: 0; box-shadow: none; }
  66% { opacity: 1; box-shadow: 0 0 0 2px rgba(255, 73, 56, 0.2); }
  70% { opacity: 0; box-shadow: none; }
  74% { opacity: 1; box-shadow: 0 0 0 2px rgba(255, 73, 56, 0.2); }
  78% { opacity: 0; box-shadow: none; }
  84%, 100% { opacity: 1; box-shadow: 0 0 0 2px rgba(255, 73, 56, 0.16); }
`;

const workLunchMismatchEdgePulse = keyframes`
  0%, 100% { opacity: 0.86; box-shadow: 0 0 0 1px rgba(255, 83, 68, 0.18), 0 0 11px rgba(255, 83, 68, 0.26); }
  50% { opacity: 1; box-shadow: 0 0 0 2px rgba(255, 83, 68, 0.34), 0 0 16px rgba(255, 83, 68, 0.38); }
`;

const DEPARTURE_TRANSITION_DURATION_MS = 2300;
const STORY_ROUTE_CONNECT_DURATION_MS = 620;

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

function RouteTile({
  imagePath,
  alt,
  size = 122,
  empty = false,
}: {
  imagePath?: string;
  alt: string;
  size?: number;
  empty?: boolean;
}) {
  return (
    <Flex
      w={`${size}px`}
      h={`${size}px`}
      bgColor={empty ? "rgba(255, 250, 241, 0.4)" : "#C2DB99"}
      border={empty ? "2px dashed #FFFFFF" : "2px solid #FFFFFF"}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {imagePath ? (
        <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" draggable={false} />
      ) : null}
    </Flex>
  );
}

function Caption({ children, cursor = false }: { children: string; cursor?: boolean }) {
  return (
    <Text
      position="absolute"
      left="20px"
      right="20px"
      bottom="86px"
      color="#9B765C"
      fontSize="17px"
      fontWeight="800"
      lineHeight="1.35"
      textAlign="center"
    >
      {children}
      {cursor ? (
        <Box
          as="span"
          display="inline-block"
          ml="2px"
          w="2px"
          h="20px"
          verticalAlign="-4px"
          bgColor="#9B765C"
          animation={`${cursorBlink} 1s steps(1) infinite`}
        />
      ) : null}
    </Text>
  );
}

function PhonePanel({
  children,
  caption,
  cursor,
  onClick,
  labelledBy,
}: {
  children: ReactNode;
  caption?: string;
  cursor?: boolean;
  onClick?: () => void;
  labelledBy?: string;
}) {
  return (
    <Flex
      as={onClick ? "button" : "div"}
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#ECE1D0"
      border="0"
      p="0"
      textAlign="initial"
      cursor={onClick ? "pointer" : "default"}
      overflow="hidden"
      onClick={onClick}
      aria-labelledby={labelledBy}
    >
      <Box position="absolute" top="0" left="0" right="0" h="20px" bgColor="#917157" />
      <Box position="absolute" bottom="0" left="0" right="0" h="20px" bgColor="#917157" />
      <Flex position="absolute" inset="20px 0" alignItems="center" justifyContent="center">
        <Flex
          key={caption ?? labelledBy}
          alignItems="center"
          justifyContent="center"
          animation={`${stageEnter} 260ms ease-out both`}
        >
          {children}
        </Flex>
      </Flex>
      {caption ? <Caption cursor={cursor}>{caption}</Caption> : null}
    </Flex>
  );
}

function TransportCard({
  type,
  onClick,
}: {
  type: "metro" | "street";
  onClick: () => void;
}) {
  const isMetro = type === "metro";
  return (
    <Flex
      as="button"
      w="134px"
      h="190px"
      direction="column"
      alignItems="center"
      justifyContent="flex-start"
      gap="10px"
      pt="14px"
      borderRadius="3px"
      bgColor="#D4BB9A"
      border="2px solid #967254"
      p="0"
      cursor="pointer"
      transition="transform 140ms ease, box-shadow 140ms ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 14px rgba(103,77,54,0.16)" }}
      onClick={onClick}
    >
      <RouteTile
        imagePath={isMetro ? METRO_STRAIGHT_IMAGE_PATH : STREET_STRAIGHT_IMAGE_PATH}
        alt={isMetro ? "捷運拼圖" : "街道拼圖"}
        size={104}
      />
      <Text color="#FFFFFF" fontSize="20px" fontWeight="900" lineHeight="1">
        {isMetro ? "捷運" : "街道"}
      </Text>
    </Flex>
  );
}

function PuzzleChoiceCard({
  choice,
  onClick,
}: {
  choice: RouteChoice;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      w="104px"
      h="158px"
      direction="column"
      alignItems="center"
      justifyContent="flex-start"
      gap="10px"
      pt="12px"
      borderRadius="3px"
      bgColor="#D4BB9A"
      border="2px solid #967254"
      p="0"
      cursor="pointer"
      transition="transform 140ms ease, box-shadow 140ms ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 14px rgba(103,77,54,0.16)" }}
      onClick={onClick}
    >
      <RouteTile imagePath={choice.imagePath} alt={choice.alt} size={82} />
      <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
        {choice.label}
      </Text>
    </Flex>
  );
}

function FrogArrangeBoardTile({
  children,
  isEmpty = false,
  isActive = false,
  isConnected = false,
  size = "116px",
  cursor,
  ariaLabel,
  dropTarget,
  onClick,
}: {
  children?: ReactNode;
  isEmpty?: boolean;
  isActive?: boolean;
  isConnected?: boolean;
  size?: string;
  cursor?: string;
  ariaLabel?: string;
  dropTarget?: string;
  onClick?: () => void;
}) {
  return (
    <StoryRoutePuzzleBoardTile
      isEmpty={isEmpty}
      isActive={isActive}
      isConnected={isConnected}
      size={size}
      cursor={cursor}
      ariaLabel={ariaLabel}
      dropTarget={dropTarget}
      onClick={onClick}
    >
      {children}
    </StoryRoutePuzzleBoardTile>
  );
}

function FrogArrangePlacedTile({
  imagePath,
  alt,
  isConnected = false,
}: {
  imagePath: string;
  alt: string;
  isConnected?: boolean;
}) {
  return (
    <Flex
      w={isConnected ? "100%" : "92%"}
      h={isConnected ? "100%" : "92%"}
      borderRadius={isConnected ? "0" : "8px"}
      overflow="hidden"
      border={isConnected ? "0 solid transparent" : "2px solid #8E7A62"}
      bgColor="#D5E8B7"
      alignItems="center"
      justifyContent="center"
      transition="width 420ms ease, height 420ms ease, border-color 420ms ease, border-width 420ms ease, border-radius 420ms ease"
    >
      <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" draggable={false} />
    </Flex>
  );
}

function getWorkLunchRouteEdgeMismatch(choice: RouteChoice): RouteEdgeMismatch {
  const routeEdges = WORK_LUNCH_ROUTE_EDGES_BY_CHOICE_ID[choice.id];
  if (!routeEdges) return { top: false, bottom: false };

  return {
    top: routeEdges.top !== WORK_LUNCH_REQUIRED_ROUTE_EDGES.top,
    bottom: routeEdges.bottom !== WORK_LUNCH_REQUIRED_ROUTE_EDGES.bottom,
  };
}

function getWorkLunchRouteMismatchHint(choice: RouteChoice) {
  const mismatch = getWorkLunchRouteEdgeMismatch(choice);
  if (mismatch.top && mismatch.bottom) return "上下都不符合";
  if (mismatch.top) return "上面不符合";
  if (mismatch.bottom) return "下面不符合";
  return "寬度一致，可以連在一起。";
}

function WorkLunchMismatchSeam({ placement }: { placement: "top" | "bottom" }) {
  return (
    <Box
      position="absolute"
      left="50%"
      top={placement === "top" ? "129px" : "255px"}
      w="116px"
      h="5px"
      transform="translateX(-50%)"
      borderRadius="999px"
      bgColor="#FF5548"
      animation={`${workLunchMismatchEdgePulse} 780ms ease-in-out infinite`}
      zIndex={6}
      pointerEvents="none"
    />
  );
}

function FrogRouteMismatchSeam({ placement }: { placement: FrogRouteSeamPlacement }) {
  const topByPlacement: Record<FrogRouteSeamPlacement, string> = {
    top: "125px",
    middle: "243px",
    bottom: "361px",
  };

  return (
    <Box
      position="absolute"
      left="50%"
      top={topByPlacement[placement]}
      w="116px"
      h="4px"
      transform="translate(-50%, -50%)"
      borderRadius="999px"
      bgColor="#FF5548"
      animation={`${workLunchMismatchEdgePulse} 780ms ease-in-out infinite`}
      zIndex={6}
      pointerEvents="none"
    />
  );
}

function StoryRouteFloatingPictureButton({
  label,
  imagePath,
  ariaLabel,
  buttonSize,
  labelHeight,
  labelFontSize,
  labelBgColor,
  onClick,
}: {
  label: string;
  imagePath: string;
  ariaLabel: string;
  buttonSize: "58px" | "72px";
  labelHeight: string;
  labelFontSize: string;
  labelBgColor: string;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      position="relative"
      w={buttonSize}
      h={buttonSize}
      borderRadius="8px"
      bgColor="#FFFFFF"
      border="2px solid #FFFFFF"
      boxShadow="0 4px 10px rgba(55,48,82,0.18)"
      overflow="hidden"
      cursor="pointer"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Image
        position="absolute"
        inset="0"
        src={imagePath}
        alt=""
        w="100%"
        h="100%"
        objectFit="cover"
        objectPosition="center"
        aria-hidden="true"
      />
      <Flex
        position="absolute"
        left="-5px"
        right="-5px"
        bottom="-2px"
        h={labelHeight}
        bgColor={labelBgColor}
        transform="rotate(-6deg)"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#FFFFFF" fontSize={labelFontSize} fontWeight="500" lineHeight="1" transform="rotate(6deg)">
          {label}
        </Text>
      </Flex>
    </Flex>
  );
}

function StoryRouteFloatingJournalButtons({
  buttonSize,
  bottom,
  onOpenDiary,
  onOpenSunbeast,
}: {
  buttonSize: "58px" | "72px";
  bottom: string;
  onOpenDiary: () => void;
  onOpenSunbeast: () => void;
}) {
  const isCompact = buttonSize === "58px";
  return (
    <Flex
      position="absolute"
      right="18px"
      bottom={bottom}
      direction="column"
      gap={isCompact ? "8px" : "10px"}
      zIndex={2}
    >
      <StoryRouteFloatingPictureButton
        label="小日獸"
        imagePath="/images/animals/naotaro_sm.jpg"
        ariaLabel="查看小日獸"
        buttonSize={buttonSize}
        labelHeight={isCompact ? "25px" : "30px"}
        labelFontSize={isCompact ? "12px" : "14px"}
        labelBgColor="rgba(157,120,89,0.9)"
        onClick={onOpenSunbeast}
      />
      <StoryRouteFloatingPictureButton
        label="日記"
        imagePath="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
        ariaLabel="查看日記"
        buttonSize={buttonSize}
        labelHeight={isCompact ? "25px" : "30px"}
        labelFontSize={isCompact ? "15px" : "17px"}
        labelBgColor="rgba(128,159,140,0.9)"
        onClick={onOpenDiary}
      />
    </Flex>
  );
}

function FrogRoutePlacedPuzzleTile({
  choice,
  isConnected,
  onPointerDown,
}: {
  choice: FrogRoutePuzzleChoice;
  isConnected: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      w="100%"
      h="100%"
      alignItems="center"
      justifyContent="center"
      cursor={isConnected ? "default" : "grab"}
      touchAction="none"
      userSelect="none"
      onPointerDown={isConnected ? undefined : onPointerDown}
    >
      <FrogArrangePlacedTile imagePath={choice.imagePath} alt={choice.alt} isConnected={isConnected} />
    </Flex>
  );
}

function FrogRoutePuzzleTrayTile({
  choice,
  isSelected,
  isDisabled,
  onClick,
  onPointerDown,
}: {
  choice: RouteChoice;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      w="100%"
      aspectRatio="1"
      cursor={isDisabled ? "default" : "pointer"}
      opacity={isDisabled ? 0 : isSelected ? 1 : 0.96}
      pointerEvents={isDisabled ? "none" : "auto"}
      transform={isSelected && !isDisabled ? "translateY(-2px)" : "translateY(0)"}
      transition="transform 140ms ease, opacity 140ms ease"
      onClick={onClick}
      touchAction="none"
      userSelect="none"
      onPointerDown={isDisabled ? undefined : onPointerDown}
      aria-pressed={isSelected}
      aria-label={choice.alt}
    >
      <Flex
        w="100%"
        h="100%"
        borderRadius="3px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255, 249, 239, 0.82)"}
        outline="1px solid rgba(145, 103, 66, 0.12)"
        boxShadow={
          isSelected
            ? "0 10px 18px rgba(83,197,213,0.18), 0 8px 14px rgba(92,63,38,0.14)"
            : "0 6px 11px rgba(92,63,38,0.12)"
        }
        alignItems="center"
        justifyContent="center"
      >
        <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" draggable={false} />
      </Flex>
    </Flex>
  );
}

function WorkLunchPlacedRouteTile({
  choice,
  onPointerDown,
  isConnected = false,
}: {
  choice: RouteChoice;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  isConnected?: boolean;
}) {
  return (
    <Flex
      w="100%"
      h="100%"
      alignItems="center"
      justifyContent="center"
      cursor={isConnected ? "default" : "grab"}
      touchAction="none"
      userSelect="none"
      onPointerDown={isConnected ? undefined : onPointerDown}
    >
      <FrogArrangePlacedTile imagePath={choice.imagePath} alt={choice.alt} isConnected={isConnected} />
    </Flex>
  );
}

function FrogArrangeTrayTile({
  choice,
  isSelected,
  onClick,
  onPointerDown,
}: {
  choice: RouteChoice;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      direction="column"
      alignItems="center"
      gap="7px"
      minW="92px"
      cursor="pointer"
      opacity={isSelected ? 1 : 0.92}
      transform={isSelected ? "translateY(-3px)" : "translateY(0)"}
      transition="transform 140ms ease, opacity 140ms ease"
      onClick={onClick}
      touchAction="none"
      userSelect="none"
      onPointerDown={onPointerDown}
      aria-pressed={isSelected}
    >
      <Flex
        w="86px"
        h="86px"
        borderRadius="5px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255, 249, 239, 0.78)"}
        outline="1px solid rgba(145, 103, 66, 0.14)"
        boxShadow={
          isSelected
            ? "0 10px 18px rgba(83,197,213,0.18), 0 8px 14px rgba(92,63,38,0.14)"
            : "0 7px 12px rgba(92,63,38,0.13)"
        }
        alignItems="center"
        justifyContent="center"
      >
        <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" draggable={false} />
      </Flex>
      <Text color={isSelected ? "#79583F" : "#9B7354"} fontSize="14px" fontWeight="900" lineHeight="1">
        {choice.label}
      </Text>
    </Flex>
  );
}

function WorkLunchArrangeTrayTile({
  choice,
  isSelected,
  onClick,
  onPointerDown,
}: {
  choice: RouteChoice;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      flex="0 0 calc((100% - 24px) / 4)"
      maxW="calc((100% - 24px) / 4)"
      aspectRatio="1"
      cursor="pointer"
      opacity={isSelected ? 1 : 0.96}
      transform={isSelected ? "translateY(-3px)" : "translateY(0)"}
      transition="transform 140ms ease, opacity 140ms ease"
      onClick={onClick}
      touchAction="none"
      userSelect="none"
      onPointerDown={onPointerDown}
      aria-pressed={isSelected}
      aria-label={choice.alt}
    >
      <Flex
        w="100%"
        h="100%"
        borderRadius="3px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255, 249, 239, 0.82)"}
        outline="1px solid rgba(145, 103, 66, 0.12)"
        boxShadow={
          isSelected
            ? "0 10px 18px rgba(83,197,213,0.18), 0 8px 14px rgba(92,63,38,0.14)"
            : "0 6px 11px rgba(92,63,38,0.12)"
        }
        alignItems="center"
        justifyContent="center"
      >
        <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" draggable={false} />
      </Flex>
    </Flex>
  );
}

function FrogRestaurantCornerVisual({
  candidate,
  visualRotationDeg,
  isConnected = false,
}: {
  candidate: FrogRestaurantCornerCandidate;
  visualRotationDeg?: number;
  isConnected?: boolean;
}) {
  return (
    <Flex
      w={isConnected ? "100%" : "92%"}
      h={isConnected ? "100%" : "92%"}
      borderRadius={isConnected ? "0" : "4px"}
      overflow="hidden"
      bgColor="#C2DB99"
      border={isConnected ? "0" : "2px solid rgba(157,156,160,0.76)"}
      alignItems="center"
      justifyContent="center"
      position="relative"
      transition="width 420ms ease, height 420ms ease, border-radius 420ms ease, border-width 420ms ease"
    >
      <Image
        src={SPECIAL_NORMAL_CORNER_IMAGE_PATH}
        alt="轉彎路線拼圖"
        draggable={false}
        w="100%"
        h="100%"
        objectFit="cover"
        transform={`translate3d(${candidate.offsetX}px, ${candidate.offsetY}px, 0) rotate(${visualRotationDeg ?? candidate.rotationDeg}deg)`}
        transition="transform 180ms ease"
      />
    </Flex>
  );
}

function FrogRestaurantPlacedCornerTile({
  corner,
  isConnected,
  onPointerDown,
}: {
  corner: FrogRestaurantPlacedCorner;
  isConnected: boolean;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      w="100%"
      h="100%"
      alignItems="center"
      justifyContent="center"
      cursor={isConnected ? "default" : "grab"}
      touchAction="none"
      userSelect="none"
      onPointerDown={isConnected ? undefined : onPointerDown}
    >
      <FrogRestaurantCornerVisual
        candidate={getFrogRestaurantCornerCandidate(corner.cornerId)}
        visualRotationDeg={corner.visualRotationDeg}
        isConnected={isConnected}
      />
    </Flex>
  );
}

function FrogRestaurantInfiniteTrayTile({
  isSelected,
  isDisabled,
  keepOpaque = false,
  onClick,
  onPointerDown,
}: {
  isSelected: boolean;
  isDisabled: boolean;
  keepOpaque?: boolean;
  onClick: () => void;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      w="96px"
      h="96px"
      position="relative"
      cursor={isDisabled ? "default" : "pointer"}
      opacity={keepOpaque ? 1 : !isDisabled ? (isSelected ? 1 : 0.96) : 0.54}
      transform={isSelected && !isDisabled ? "translateY(-3px)" : "translateY(0)"}
      transition="transform 140ms ease, opacity 140ms ease"
      onClick={onClick}
      touchAction="none"
      userSelect="none"
      onPointerDown={isDisabled ? undefined : onPointerDown}
      aria-pressed={isSelected}
      aria-label="可重複使用的轉彎拼圖"
    >
      <Flex
        w="100%"
        h="100%"
        borderRadius="3px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255, 249, 239, 0.82)"}
        outline="1px solid rgba(145, 103, 66, 0.12)"
        boxShadow={
          isSelected
            ? "0 10px 18px rgba(83,197,213,0.18), 0 8px 14px rgba(92,63,38,0.14)"
            : "0 6px 11px rgba(92,63,38,0.12)"
        }
        alignItems="center"
        justifyContent="center"
      >
        <FrogRestaurantCornerVisual
          candidate={getFrogRestaurantCornerCandidate(FROG_RESTAURANT_INITIAL_CORNER_ID)}
        />
      </Flex>
      <Flex
        position="absolute"
        top="-7px"
        right="-7px"
        minW="28px"
        h="22px"
        px="6px"
        borderRadius="999px"
        bgColor="#FFF9ED"
        border="2px solid #B98A62"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 2px 5px rgba(111, 78, 48, 0.18)"
      >
        <Text color="#956B4E" fontSize="16px" fontWeight="900" lineHeight="1">
          ∞
        </Text>
      </Flex>
    </Flex>
  );
}

function isFrogRestaurantRouteConnected(
  placedCorners: readonly (FrogRestaurantPlacedCorner | null)[],
) {
  const leftCorner = placedCorners[0];
  const rightCorner = placedCorners[1];
  if (!leftCorner || !rightCorner) return false;

  const leftConnector = getFrogRestaurantCornerCandidate(leftCorner.cornerId).connector;
  const rightConnector = getFrogRestaurantCornerCandidate(rightCorner.cornerId).connector;

  return (
    leftConnector.bottom &&
    leftConnector.right &&
    rightConnector.left &&
    rightConnector.top
  );
}

function getFrogRestaurantRotationTargets(
  placedCorners: readonly (FrogRestaurantPlacedCorner | null)[],
  slotIndex: FrogRestaurantSlotIndex,
) {
  const targets: FrogRestaurantSlotIndex[] = [slotIndex];
  const neighborSlotIndex = slotIndex === 0 ? 1 : 0;
  if (placedCorners[neighborSlotIndex]) targets.push(neighborSlotIndex);
  return targets;
}

function FrogRestaurantRouteTutorialIllustration({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const shouldShowLeftCorner = stepIndex >= 1;
  const shouldShowRightCorner = stepIndex >= 2;
  const shouldAnimateRotation = stepIndex >= 1;

  return (
    <Box position="relative" h="303px" borderRadius="14px" bgColor="#FFF9EF" overflow="hidden">
      <Grid
        position="absolute"
        left="50%"
        top="74px"
        transform="translateX(-50%)"
        templateColumns="repeat(2, 82px)"
        gap="6px"
        aria-label="轉彎拼圖示範格"
      >
          {([0, 1] as const).map((slotIndex) => {
            const shouldShowCorner = slotIndex === 0 ? shouldShowLeftCorner : shouldShowRightCorner;
            const cornerId: FrogRestaurantCornerId = slotIndex === 0 ? "right-bottom" : "left-top";
            const shouldPlayDropIn =
              (stepIndex === 1 && slotIndex === 0) || (stepIndex === 2 && slotIndex === 1);
            return (
              <Flex
                key={slotIndex}
                w="82px"
                h="82px"
                border="2px dashed rgba(191, 166, 139, 0.68)"
                bgColor="rgba(255,255,255,0.72)"
                alignItems="center"
                justifyContent="center"
                animation={`${simpleRouteTutorialSlotPulse} 2600ms ease-in-out infinite`}
                overflow="hidden"
              >
                {shouldShowCorner ? (
                  <Box
                    w="100%"
                    h="100%"
                    animation={
                      shouldPlayDropIn
                        ? `${frogRestaurantTutorialTileIn} 2600ms ease-in-out infinite`
                        : undefined
                    }
                  >
                    <Box
                      w="100%"
                      h="100%"
                      transformOrigin="50% 50%"
                      animation={
                        shouldAnimateRotation
                          ? `${frogRestaurantTutorialSharedRotate} 2600ms ease-in-out infinite`
                          : undefined
                      }
                    >
                      <FrogRestaurantCornerVisual
                        candidate={getFrogRestaurantCornerCandidate(cornerId)}
                      />
                    </Box>
                  </Box>
                ) : null}
              </Flex>
            );
          })}
      </Grid>

      {stepIndex >= 1 ? (
        <Box
          position="absolute"
          left="56px"
          bottom="36px"
          w="96px"
          h="96px"
          transformOrigin="top left"
          pointerEvents="none"
          animation={`${
            stepIndex === 1 ? frogRestaurantTutorialDragLeft : frogRestaurantTutorialDragRight
          } 2600ms ease-in-out infinite`}
        >
          <FrogRestaurantCornerVisual
            candidate={getFrogRestaurantCornerCandidate(FROG_RESTAURANT_INITIAL_CORNER_ID)}
          />
        </Box>
      ) : null}

      <Flex
        position="absolute"
        left="14px"
        right="14px"
        bottom="14px"
        h="86px"
        borderRadius="12px"
        bgColor="rgba(244, 237, 222, 0.86)"
        alignItems="center"
        justifyContent="flex-start"
        px="42px"
      >
        <Box w="64px" h="64px" overflow="visible">
          <Box transform="scale(0.6667)" transformOrigin="top left">
            <FrogRestaurantInfiniteTrayTile
              isSelected={false}
              isDisabled
              keepOpaque
              onClick={() => {}}
              onPointerDown={() => {}}
            />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

function FrogRestaurantRouteTutorialModal({ onClose }: { onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % FROG_RESTAURANT_TUTORIAL_STEPS.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={82}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        gap="14px"
        px="18px"
        pt="24px"
        pb="20px"
        bgColor="#FFFDF8"
        borderRadius="10px"
        border="1px solid #E5D2B7"
        boxShadow="0 14px 28px rgba(62,45,26,0.18)"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Text
          color="#8E6D53"
          fontSize="16px"
          fontWeight="900"
          lineHeight="1.45"
          textAlign="center"
          maxW="270px"
          mx="auto"
          wordBreak="break-word"
          overflowWrap="anywhere"
        >
          {FROG_RESTAURANT_TUTORIAL_STEPS[stepIndex]}
        </Text>

        <FrogRestaurantRouteTutorialIllustration stepIndex={stepIndex} />

        <Flex
          as="button"
          h="52px"
          borderRadius="999px"
          bgColor="#A47A5C"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          boxShadow="0 6px 12px rgba(92,63,38,0.16)"
          onClick={onClose}
        >
          <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
            開始安排
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function FrogRouteNextDayTutorialIllustration({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 0) {
    return (
      <Box position="relative" h="246px" borderRadius="14px" bgColor="#FFF9EF" overflow="hidden">
        <Flex
          position="absolute"
          inset="0"
          bgImage="url('/images/road_pattern_ bg.jpg')"
          bgSize="cover"
          backgroundPosition="center"
          opacity={0.62}
        />
        <Flex
          position="absolute"
          left="50%"
          top="22px"
          transform="translateX(-50%)"
          direction="column"
          gap="8px"
          alignItems="center"
        >
          <Flex
            w="96px"
            h="96px"
            borderRadius="12px"
            bgColor="#FFFFFF"
            border="2px solid #B88E6D"
            overflow="hidden"
            boxShadow="0 8px 18px rgba(92,63,38,0.16)"
          >
            <Image
              src="/images/animals/青蛙_剪影.png"
              alt="青蛙線索"
              w="100%"
              h="100%"
              objectFit="contain"
              p="12px"
            />
          </Flex>
          <Text color="#7A5B43" fontSize="13px" fontWeight="900" lineHeight="1">
            青蛙留下了線索
          </Text>
        </Flex>

        <Flex
          position="absolute"
          right="16px"
          bottom="22px"
          direction="column"
          gap="8px"
          alignItems="center"
        >
          <Flex
            position="relative"
            w="64px"
            h="64px"
            borderRadius="8px"
            bgColor="#FFFFFF"
            border="2px solid #FFFFFF"
            overflow="hidden"
            boxShadow="0 0 0 5px rgba(255, 206, 112, 0.38), 0 10px 18px rgba(92,63,38,0.18)"
            animation={`${simpleRouteTutorialSlotPulse} 2200ms ease-in-out infinite`}
          >
            <Image
              src="/images/animals/naotaro_sm.jpg"
              alt="小日獸"
              w="100%"
              h="100%"
              objectFit="cover"
            />
            <Flex
              position="absolute"
              left="-4px"
              right="-4px"
              bottom="-2px"
              h="24px"
              bgColor="rgba(157,120,89,0.92)"
              transform="rotate(-6deg)"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#FFFFFF" fontSize="12px" fontWeight="700" lineHeight="1" transform="rotate(6deg)">
                小日獸
              </Text>
            </Flex>
          </Flex>
          <Box
            w="16px"
            h="16px"
            borderRadius="999px"
            bgColor="#FFFDF8"
            border="3px solid #B88E6D"
            boxShadow="0 5px 10px rgba(92,63,38,0.2)"
            transform="translate(-10px, -48px)"
          />
        </Flex>
      </Box>
    );
  }

  return (
    <Box position="relative" h="246px" borderRadius="14px" bgColor="#FFF9EF" overflow="hidden">
      <Flex
        position="absolute"
        left="50%"
        top="20px"
        transform="translateX(-50%)"
        direction="column"
        alignItems="center"
        gap="0"
      >
        <FrogArrangePlacedTile
          imagePath={END_COMPANY_WIDE_IMAGE_PATH}
          alt="公司拼圖"
          isConnected={false}
        />
        <Box position="relative" w="92px" h="92px" my="2px">
          <FrogArrangePlacedTile
            imagePath={STREET_WIDE_TO_NARROW_IMAGE_PATH}
            alt="街道拼圖"
            isConnected={false}
          />
          <Flex
            position="absolute"
            right="-10px"
            top="-10px"
            w="30px"
            h="30px"
            borderRadius="999px"
            bgColor="#1BD6A2"
            border="3px solid #FFFDF8"
            alignItems="center"
            justifyContent="center"
            color="#FFFFFF"
            fontSize="17px"
            fontWeight="900"
            lineHeight="1"
            boxShadow="0 6px 12px rgba(27,214,162,0.24)"
          >
            O
          </Flex>
        </Box>
        <FrogArrangePlacedTile
          imagePath={START_HOME_NARROW_IMAGE_PATH}
          alt="家的拼圖"
          isConnected={false}
        />
      </Flex>

      <Flex
        position="absolute"
        left="12px"
        right="12px"
        bottom="12px"
        h="72px"
        borderRadius="12px"
        bgColor="rgba(252, 246, 236, 0.96)"
        alignItems="center"
        justifyContent="center"
        gap="10px"
        px="10px"
      >
        <Flex direction="column" alignItems="center" gap="4px">
          <SimpleRouteTutorialThumb
            choice={{
              id: "frog-tutorial-diary-place",
              label: "日記地點",
              imagePath: STREET_WIDE_TO_NARROW_IMAGE_PATH,
              alt: "日記地點拼圖",
              mapIconPath: "/images/icon/road.png",
              fallbackEventId: "street-comfy-breeze",
            }}
          />
          <Text color="#8E6D53" fontSize="11px" fontWeight="900" lineHeight="1">
            日記地點
          </Text>
        </Flex>
        <Flex direction="column" alignItems="center" gap="4px">
          <SimpleRouteTutorialThumb
            choice={{
              id: "frog-tutorial-free-place",
              label: "自由安排",
              imagePath: METRO_WIDE_TO_NARROW_IMAGE_PATH,
              alt: "自由安排拼圖",
              mapIconPath: "/images/icon/mrt.png",
              fallbackEventId: "metro-commute-laugh",
            }}
          />
          <Text color="#8E6D53" fontSize="11px" fontWeight="900" lineHeight="1">
            自由安排
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
}

function FrogRouteNextDayTutorialModal({ onClose }: { onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    "可以點開「小日獸」查看青蛙留下的線索。",
    "可以安排日記上的地點，也可以自由安排；只要上下路線寬度接通就能出發。",
  ] as const;
  const isFinalStep = stepIndex >= steps.length - 1;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={82}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        gap="12px"
        px="18px"
        pt="22px"
        pb="20px"
        bgColor="#FFFDF8"
        borderRadius="10px"
        border="1px solid #E5D2B7"
        boxShadow="0 14px 28px rgba(62,45,26,0.18)"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex direction="column" alignItems="center" justifyContent="center" gap="6px">
          <Text color="#8E6D53" fontSize="18px" fontWeight="900" lineHeight="1.35" textAlign="center">
            青蛙線索教學
          </Text>
          <Flex gap="6px" aria-hidden="true">
            {steps.map((step, index) => (
              <Box
                key={step}
                w={index === stepIndex ? "18px" : "7px"}
                h="7px"
                borderRadius="999px"
                bgColor={index === stepIndex ? "#B88E6D" : "#E6D4BE"}
                transition="width 160ms ease, background-color 160ms ease"
              />
            ))}
          </Flex>
        </Flex>

        <Flex
          minH="74px"
          px="14px"
          py="12px"
          bgColor="#FFF7EC"
          border="1px solid #ECD7BA"
          borderRadius="10px"
          alignItems="center"
          gap="10px"
        >
          <Flex
            w="30px"
            h="30px"
            flexShrink={0}
            borderRadius="999px"
            bgColor="#B88E6D"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#FFFFFF" fontSize="15px" fontWeight="900" lineHeight="1">
              {stepIndex + 1}
            </Text>
          </Flex>
          <Text color="#6B543E" fontSize="15px" fontWeight="900" lineHeight="1.55">
            {steps[stepIndex]}
          </Text>
        </Flex>

        <FrogRouteNextDayTutorialIllustration stepIndex={stepIndex} />

        <Flex alignItems="center" gap="10px">
          {stepIndex > 0 ? (
            <Flex
              as="button"
              h="52px"
              w="78px"
              borderRadius="999px"
              bgColor="#FFF7EC"
              border="1px solid #E5D2B7"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              <Text color="#986E53" fontSize="15px" fontWeight="900" lineHeight="1">
                上一步
              </Text>
            </Flex>
          ) : null}

          <Flex
            as="button"
            h="52px"
            flex="1"
            borderRadius="999px"
            bgColor="#A47A5C"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            boxShadow="0 6px 12px rgba(92,63,38,0.16)"
            onClick={() => {
              if (isFinalStep) {
                onClose();
                return;
              }
              setStepIndex((current) => Math.min(steps.length - 1, current + 1));
            }}
          >
            <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
              {isFinalStep ? "開始安排" : "下一步"}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

type StoryRouteMapPoint = {
  key: string;
  label: string;
  iconPath: string;
  isTarget?: boolean;
};

type StoryLinearRouteMismatch =
  | { type: "work-lunch"; placement: "top" | "bottom" }
  | { type: "frog"; placement: FrogRouteSeamPlacement };

type StoryLinearRouteTrayVariant = "label-strip" | "square-strip" | "square-grid";

type StoryLinearRouteBoardConfig = {
  templateRows: string;
  expandedWidth: string;
  connectedWidth: string;
  expandedHeight: string;
  connectedHeight: string;
  expandedGap: string;
  connectedGap: string;
  tileSize?: string;
  expandedPadding?: string;
  connectedPadding?: string;
  expandedBackground?: string;
  expandedBorder?: string;
  expandedBorderRadius?: string;
  expandedBoxShadow?: string;
  fixedTop: {
    imagePath: string;
    alt: string;
  };
  fixedBottom: {
    imagePath: string;
    alt: string;
  };
};

type StoryLinearRoutePuzzleConfig<TChoice extends RouteChoice> = {
  id: string;
  choices: readonly TChoice[];
  slotCount: 1 | 2;
  slotTargetIds: readonly string[];
  boardDropTarget: string;
  removeDropTarget: string;
  initialHint: string;
  emptySlotHint: string;
  selectedHint: (choice: TChoice) => string;
  alreadyPlacedHint?: string | ((choice: TChoice) => string);
  departureButtonText: string;
  board: StoryLinearRouteBoardConfig;
  tray: {
    variant: StoryLinearRouteTrayVariant;
    height: string;
    headerText?: string;
    ariaOnlyHint?: boolean;
  };
  canPressDeparture: (placedChoices: readonly (TChoice | null)[]) => boolean;
  isSolved: (placedChoices: readonly (TChoice | null)[]) => boolean;
  validateDeparture: (placedChoices: readonly (TChoice | null)[]) => string | null;
  getMismatchSeams?: (
    placedChoices: readonly (TChoice | null)[],
  ) => StoryLinearRouteMismatch[];
  disablePlacedChoices?: boolean;
  journalButtons?: {
    buttonSize: "58px" | "72px";
    bottom: string;
  };
  renderBoardHint?: boolean;
  renderTutorial?: (onClose: () => void) => ReactNode;
  renderAnswerHint?: (onClose: () => void) => ReactNode;
  showHeaderHelpControls?: boolean;
  hideTutorialWhenDiaryOpen?: boolean;
  departureStartPoint?: StoryRouteMapPoint;
  departureEndPoint?: StoryRouteMapPoint;
  getDepartureMiddlePoint?: (
    placedChoices: readonly (TChoice | null)[],
  ) => StoryRouteMapPoint | StoryRouteMapPoint[] | null | undefined;
  onConnectComplete: (placedChoices: readonly (TChoice | null)[]) => void;
  onDepartComplete: (placedChoices: readonly (TChoice | null)[]) => void;
};

function renderStoryLinearMismatchSeam(mismatch: StoryLinearRouteMismatch) {
  if (mismatch.type === "work-lunch") {
    return <WorkLunchMismatchSeam placement={mismatch.placement} />;
  }
  return <FrogRouteMismatchSeam placement={mismatch.placement} />;
}

function useStoryRouteDepartureFlow<TSnapshot>({
  onConnectComplete,
  onDepartComplete,
}: {
  onConnectComplete: (snapshot: TSnapshot) => void;
  onDepartComplete: (snapshot: TSnapshot) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeparting, setIsDeparting] = useState(false);
  const [departureProgress, setDepartureProgress] = useState(0);
  const [departureSnapshot, setDepartureSnapshot] = useState<TSnapshot | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departureFrameRef = useRef<number | null>(null);
  const onConnectCompleteRef = useRef(onConnectComplete);
  const onDepartCompleteRef = useRef(onDepartComplete);

  useEffect(() => {
    onConnectCompleteRef.current = onConnectComplete;
    onDepartCompleteRef.current = onDepartComplete;
  }, [onConnectComplete, onDepartComplete]);

  useEffect(
    () => () => {
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      if (departureTimerRef.current) clearTimeout(departureTimerRef.current);
      if (departureFrameRef.current !== null) cancelAnimationFrame(departureFrameRef.current);
    },
    [],
  );

  const startDeparture = useCallback((snapshot: TSnapshot) => {
    if (connectTimerRef.current) return false;
    if (departureTimerRef.current) return false;

    setDepartureSnapshot(snapshot);
    setIsConnecting(true);
    connectTimerRef.current = setTimeout(() => {
      connectTimerRef.current = null;
      onConnectCompleteRef.current(snapshot);
      setDepartureProgress(0);
      setIsDeparting(true);

      const startedAt = performance.now();
      const tick = (now: number) => {
        const nextProgress = Math.min(1, (now - startedAt) / DEPARTURE_TRANSITION_DURATION_MS);
        setDepartureProgress(nextProgress);
        if (nextProgress < 1) {
          departureFrameRef.current = requestAnimationFrame(tick);
        }
      };
      departureFrameRef.current = requestAnimationFrame(tick);
      departureTimerRef.current = setTimeout(() => {
        if (departureFrameRef.current !== null) {
          cancelAnimationFrame(departureFrameRef.current);
          departureFrameRef.current = null;
        }
        setDepartureProgress(1);
        onDepartCompleteRef.current(snapshot);
      }, DEPARTURE_TRANSITION_DURATION_MS);
    }, STORY_ROUTE_CONNECT_DURATION_MS);
    return true;
  }, []);

  return {
    departureProgress,
    departureSnapshot,
    isDeparting,
    isRouteLocked: isConnecting || isDeparting,
    startDeparture,
  };
}

function StoryLinearRoutePuzzleStage<TChoice extends RouteChoice>({
  config,
}: {
  config: StoryLinearRoutePuzzleConfig<TChoice>;
}) {
  const [heldChoice, setHeldChoice] = useState<TChoice | null>(null);
  const [placedChoices, setPlacedChoices] = useState<Array<TChoice | null>>(() =>
    Array.from({ length: config.slotCount }, () => null),
  );
  const [hint, setHint] = useState(config.initialHint);
  const [isTutorialOpen, setIsTutorialOpen] = useState(Boolean(config.renderTutorial));
  const [isAnswerHintOpen, setIsAnswerHintOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryOverlayMode, setDiaryOverlayMode] = useState<DiaryOverlayMode>("fragmented-diary");
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);

  useEffect(() => {
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
  }, []);

  const departureFlow = useStoryRouteDepartureFlow<Array<TChoice | null>>({
    onConnectComplete: config.onConnectComplete,
    onDepartComplete: config.onDepartComplete,
  });
  const isRouteConnected = departureFlow.isRouteLocked;

  const placeChoice = useCallback(
    (choice: TChoice, slotIndex: number) => {
      setPlacedChoices((current) => {
        const next = [...current];
        next[slotIndex] = choice;
        return next;
      });
      setHeldChoice(null);
      setHint(config.selectedHint(choice));
    },
    [config],
  );

  const removePlacedChoice = useCallback(
    (slotIndex: number) => {
      setPlacedChoices((current) => {
        const next = [...current];
        next[slotIndex] = null;
        return next;
      });
      setHeldChoice(null);
      setHint(config.initialHint);
    },
    [config.initialHint],
  );

  const routeDrag = useStoryRoutePointerDrag<
    { source: "tray" | "slot"; choiceId: string; slotIndex?: number },
    string
  >({
    disabled: isRouteConnected,
    onDragStart: (payload) => {
      const choice = config.choices.find((candidate) => candidate.id === payload.choiceId);
      if (!choice) return;
      if (payload.source === "tray") {
        setHeldChoice(choice);
        setHint("把拼圖放進空格。");
        return;
      }
      setHint("拖到旁邊空白處，可以拿掉拼圖。");
    },
    onDrop: (payload, target) => {
      const targetSlotIndex = config.slotTargetIds.findIndex((slotTarget) => slotTarget === target);
      const droppedChoice =
        config.choices.find((choice) => choice.id === payload.choiceId) ??
        (payload.source === "slot" && typeof payload.slotIndex === "number"
          ? placedChoices[payload.slotIndex]
          : null);

      if (targetSlotIndex >= 0 && droppedChoice) {
        setPlacedChoices((current) => {
          const next = [...current];
          if (
            payload.source === "slot" &&
            typeof payload.slotIndex === "number" &&
            payload.slotIndex !== targetSlotIndex
          ) {
            next[payload.slotIndex] = null;
          }
          next[targetSlotIndex] = droppedChoice;
          return next;
        });
        setHeldChoice(null);
        setHint(config.selectedHint(droppedChoice));
        return;
      }

      if (
        target === config.removeDropTarget &&
        payload.source === "slot" &&
        typeof payload.slotIndex === "number"
      ) {
        removePlacedChoice(payload.slotIndex);
      }
    },
  });

  const canPressDeparture = config.canPressDeparture(placedChoices);
  const isSolved = config.isSolved(placedChoices);
  const placedChoiceIds = new Set(placedChoices.filter(Boolean).map((choice) => choice!.id));
  const mismatchSeams =
    isSolved || isRouteConnected ? [] : config.getMismatchSeams?.(placedChoices) ?? [];
  const departureSnapshot = departureFlow.departureSnapshot ?? placedChoices;
  const shouldShowHeaderHelpControls =
    (config.renderTutorial || config.renderAnswerHint) && config.showHeaderHelpControls !== false;

  const handleStartDeparture = () => {
    const snapshot = [...placedChoices];
    const validationMessage = config.validateDeparture(snapshot);
    if (validationMessage) {
      setHint(validationMessage);
      return;
    }
    setHint("");
    setHeldChoice(null);
    departureFlow.startDeparture(snapshot);
  };

  const renderPlacedTile = (choice: TChoice, slotIndex: number) => (
    <WorkLunchPlacedRouteTile
      choice={choice}
      onPointerDown={(event) =>
        routeDrag.startDrag(
          event,
          {
            source: "slot",
            choiceId: choice.id,
            slotIndex,
          },
          { size: 92 },
        )
      }
      isConnected={isRouteConnected}
    />
  );

  const renderTrayChoice = (choice: TChoice) => {
    const isPlaced = placedChoiceIds.has(choice.id);
    const isSelected = heldChoice?.id === choice.id || isPlaced;
    const isDisabled = isRouteConnected || Boolean(config.disablePlacedChoices && isPlaced);
    const handleClick = () => {
      if (isDisabled) return;
      if (isPlaced && config.alreadyPlacedHint) {
        setHint(
          typeof config.alreadyPlacedHint === "function"
            ? config.alreadyPlacedHint(choice)
            : config.alreadyPlacedHint,
        );
        return;
      }
      setHeldChoice(choice);
      setHint("點空格，或拖曳拼圖放上去。");
    };
    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      routeDrag.startDrag(event, { source: "tray", choiceId: choice.id }, { size: 88 });
    };

    if (config.tray.variant === "square-grid") {
      return (
        <FrogRoutePuzzleTrayTile
          key={choice.id}
          choice={choice}
          isSelected={isSelected}
          isDisabled={isDisabled}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
        />
      );
    }

    if (config.tray.variant === "square-strip") {
      return (
        <WorkLunchArrangeTrayTile
          key={choice.id}
          choice={choice}
          isSelected={isSelected}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
        />
      );
    }

    return (
      <FrogArrangeTrayTile
        key={choice.id}
        choice={choice}
        isSelected={isSelected}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      />
    );
  };

  const trayContent =
    config.tray.variant === "square-grid" ? (
      <Grid
        h={config.tray.height}
        flexShrink={0}
        bgColor="#FDF6EA"
        borderTop="1px solid rgba(185,152,115,0.12)"
        templateColumns="repeat(4, 1fr)"
        gap="5px"
        px="7px"
        py="12px"
        alignContent="start"
        data-story-route-drop-target={config.removeDropTarget}
      >
        {config.choices.map(renderTrayChoice)}
      </Grid>
    ) : (
      <Flex
        minH={config.tray.height}
        maxH={config.tray.height}
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(185,152,115,0.12)"
      >
        <Flex
          h="42px"
          px="14px"
          alignItems="center"
          justifyContent="center"
          bgColor="#F8E7CC"
          borderBottom="1px solid rgba(185,152,115,0.16)"
        >
          <Text color="#9B765C" fontSize="13px" fontWeight="900" lineHeight="1.35" textAlign="center">
            {config.tray.headerText ?? hint}
          </Text>
        </Flex>
        <Flex
          flex="1"
          minH="0"
          overflowX={config.tray.variant === "label-strip" ? "auto" : "hidden"}
          overflowY="hidden"
          px="14px"
          pt={config.tray.variant === "label-strip" ? "12px" : "14px"}
          pb="14px"
          alignItems={config.tray.variant === "label-strip" ? "flex-start" : "center"}
          gap={config.tray.variant === "label-strip" ? "14px" : "8px"}
          justifyContent="center"
          data-story-route-drop-target={config.removeDropTarget}
          css={
            config.tray.variant === "label-strip"
              ? {
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }
              : undefined
          }
        >
          {config.choices.map(renderTrayChoice)}
        </Flex>
      </Flex>
    );

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      direction="column"
      bgColor="#FDF6EA"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <StoryRouteDragPreviewLayer
        dragState={routeDrag.dragState}
        renderPreview={(payload) => {
          const choice = config.choices.find((candidate) => candidate.id === payload.choiceId);
          return choice ? (
            <Image
              src={choice.imagePath}
              alt={choice.alt}
              draggable={false}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : null;
        }}
      />

      <Flex
        h="50px"
        flexShrink={0}
        bgColor="#9B765C"
        alignItems="center"
        justifyContent="space-between"
        px="18px"
        gap="12px"
      >
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          安排行程
        </Text>
        {shouldShowHeaderHelpControls ? (
          <Flex alignItems="center" gap="8px" flexShrink={0}>
            {config.renderTutorial ? (
              <Flex
                as="button"
                h="32px"
                px="10px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.95)"
                color="#806047"
                alignItems="center"
                justifyContent="center"
                gap="5px"
                cursor={isRouteConnected ? "not-allowed" : "pointer"}
                opacity={isRouteConnected ? 0.52 : 1}
                onClick={() => {
                  if (isRouteConnected) return;
                  setIsAnswerHintOpen(false);
                  setIsTutorialOpen(true);
                }}
                aria-label="重新打開教學"
              >
                <FiHelpCircle size={15} />
                <Text color="#806047" fontSize="13px" fontWeight="900" lineHeight="1">
                  教學
                </Text>
              </Flex>
            ) : null}
            {config.renderAnswerHint ? (
              <Flex
                as="button"
                h="32px"
                px="10px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.95)"
                color="#806047"
                alignItems="center"
                justifyContent="center"
                gap="5px"
                cursor={isRouteConnected ? "not-allowed" : "pointer"}
                opacity={isRouteConnected ? 0.52 : 1}
                onClick={() => {
                  if (isRouteConnected) return;
                  setIsTutorialOpen(false);
                  setIsAnswerHintOpen(true);
                }}
                aria-label="查看正確答案提示"
              >
                <FiEye size={15} />
                <Text color="#806047" fontSize="13px" fontWeight="900" lineHeight="1">
                  提示
                </Text>
              </Flex>
            ) : null}
          </Flex>
        ) : null}
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        alignItems="center"
        justifyContent="center"
        px="12px"
        py="14px"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/road_pattern_ bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        data-story-route-drop-target={config.removeDropTarget}
      >
        {config.renderBoardHint ? (
          <Flex
            position="absolute"
            top="14px"
            left="18px"
            right="18px"
            minH="54px"
            px="14px"
            py="10px"
            borderRadius="14px"
            bgColor="rgba(255, 253, 247, 0.9)"
            border="1px solid rgba(185, 152, 115, 0.34)"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 7px 16px rgba(115,86,45,0.1)"
          >
            <Text
              color="#8E6D53"
              fontSize="14px"
              fontWeight="900"
              lineHeight="1.45"
              textAlign="center"
            >
              {hint}
            </Text>
          </Flex>
        ) : null}

        <Grid
          position="relative"
          templateRows={config.board.templateRows}
          justifyItems="center"
          alignItems="center"
          gap={isRouteConnected ? config.board.connectedGap : config.board.expandedGap}
          w={isRouteConnected ? config.board.connectedWidth : config.board.expandedWidth}
          h={isRouteConnected ? config.board.connectedHeight : config.board.expandedHeight}
          p={isRouteConnected ? config.board.connectedPadding ?? "0" : config.board.expandedPadding ?? "10px"}
          bgColor={isRouteConnected ? "transparent" : config.board.expandedBackground ?? "rgba(255,255,255,0.88)"}
          border={isRouteConnected ? "0 solid transparent" : config.board.expandedBorder ?? "3px solid #B99873"}
          borderRadius={isRouteConnected ? "0" : config.board.expandedBorderRadius ?? "18px"}
          boxShadow={isRouteConnected ? "none" : config.board.expandedBoxShadow ?? "0 8px 18px rgba(115,86,45,0.12)"}
          transition="width 420ms ease, height 420ms ease, padding 420ms ease, gap 420ms ease, border-color 420ms ease, border-width 420ms ease, border-radius 420ms ease, background-color 420ms ease, box-shadow 420ms ease"
          data-story-route-drop-target={config.boardDropTarget}
        >
          <FrogArrangeBoardTile size={config.board.tileSize} isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath={config.board.fixedTop.imagePath}
              alt={config.board.fixedTop.alt}
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>

          {placedChoices.map((placedChoice, slotIndex) => (
            <FrogArrangeBoardTile
              key={config.slotTargetIds[slotIndex]}
              size={config.board.tileSize}
              isEmpty={!placedChoice}
              isActive={Boolean(heldChoice) || Boolean(placedChoice)}
              isConnected={isRouteConnected}
              dropTarget={config.slotTargetIds[slotIndex]}
              cursor={heldChoice ? "pointer" : "default"}
              onClick={() => {
                if (isRouteConnected) return;
                if (!heldChoice) {
                  if (!placedChoice) setHint(config.emptySlotHint);
                  return;
                }
                placeChoice(heldChoice, slotIndex);
              }}
            >
              {placedChoice ? renderPlacedTile(placedChoice, slotIndex) : null}
            </FrogArrangeBoardTile>
          ))}

          <FrogArrangeBoardTile size={config.board.tileSize} isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath={config.board.fixedBottom.imagePath}
              alt={config.board.fixedBottom.alt}
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>

          {mismatchSeams.map((mismatch) => (
            <Box key={`${mismatch.type}-${mismatch.placement}`}>
              {renderStoryLinearMismatchSeam(mismatch)}
            </Box>
          ))}
        </Grid>

        {config.journalButtons ? (
          <StoryRouteFloatingJournalButtons
            buttonSize={config.journalButtons.buttonSize}
            bottom={config.journalButtons.bottom}
            onOpenDiary={() => {
              setDiaryOverlayMode("fragmented-diary");
              setIsDiaryOpen(true);
            }}
            onOpenSunbeast={() => {
              setDiaryOverlayMode("sunbeast");
              setIsDiaryOpen(true);
            }}
          />
        ) : null}
      </Flex>

      {trayContent}

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent={config.renderTutorial || config.renderAnswerHint ? "space-between" : "flex-end"}
        px="18px"
        py="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
        gap="12px"
      >
        {config.renderTutorial || config.renderAnswerHint ? (
          <Flex alignItems="center" gap="8px" minW="0" flexShrink={1}>
            {config.renderTutorial ? (
              <Flex
                as="button"
                h="40px"
                px="12px"
                borderRadius="999px"
                bgColor="#FFF7EC"
                color="#986E53"
                alignItems="center"
                justifyContent="center"
                gap="6px"
                cursor={isRouteConnected ? "not-allowed" : "pointer"}
                opacity={isRouteConnected ? 0.52 : 1}
                flexShrink={0}
                onClick={() => {
                  if (isRouteConnected) return;
                  setIsAnswerHintOpen(false);
                  setIsTutorialOpen(true);
                }}
                aria-label="重新打開教學"
              >
                <FiHelpCircle size={16} />
                <Text color="#986E53" fontSize="14px" fontWeight="900" lineHeight="1">
                  教學
                </Text>
              </Flex>
            ) : null}
            {config.renderAnswerHint ? (
              <Flex
                as="button"
                h="40px"
                px="12px"
                borderRadius="999px"
                bgColor="#FFF7EC"
                color="#986E53"
                alignItems="center"
                justifyContent="center"
                gap="6px"
                cursor={isRouteConnected ? "not-allowed" : "pointer"}
                opacity={isRouteConnected ? 0.52 : 1}
                flexShrink={0}
                onClick={() => {
                  if (isRouteConnected) return;
                  setIsTutorialOpen(false);
                  setIsAnswerHintOpen(true);
                }}
                aria-label="查看正確答案提示"
              >
                <FiEye size={16} />
                <Text color="#986E53" fontSize="14px" fontWeight="900" lineHeight="1">
                  提示
                </Text>
              </Flex>
            ) : null}
          </Flex>
        ) : null}
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
          cursor={canPressDeparture ? "pointer" : "not-allowed"}
          opacity={canPressDeparture || isRouteConnected ? 1 : 0.5}
          pointerEvents={isRouteConnected ? "none" : "auto"}
          flexShrink={0}
          onClick={handleStartDeparture}
        >
          {config.departureButtonText}
        </Flex>
      </Flex>

      {config.tray.ariaOnlyHint && hint ? (
        <Box
          position="absolute"
          w="1px"
          h="1px"
          overflow="hidden"
          clip="rect(0 0 0 0)"
          aria-live="polite"
        >
          {hint}
        </Box>
      ) : null}

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={config.departureStartPoint}
          middlePoint={config.getDepartureMiddlePoint?.(departureSnapshot)}
          endPoint={config.departureEndPoint}
        />
      ) : null}

      {config.renderTutorial &&
      isTutorialOpen &&
      !isRouteConnected &&
      !(config.hideTutorialWhenDiaryOpen && isDiaryOpen)
        ? config.renderTutorial(() => setIsTutorialOpen(false))
        : null}

      {config.renderAnswerHint &&
      isAnswerHintOpen &&
      !isRouteConnected &&
      !(config.hideTutorialWhenDiaryOpen && isDiaryOpen)
        ? config.renderAnswerHint(() => setIsAnswerHintOpen(false))
        : null}

      {config.journalButtons ? (
        <DiaryOverlay
          open={isDiaryOpen}
          onClose={() => setIsDiaryOpen(false)}
          unlockedEntryIds={unlockedDiaryEntryIds}
          mode={diaryOverlayMode}
          onFragmentedDiaryComplete={() => setIsDiaryOpen(false)}
          showReturnButton
        />
      ) : null}
    </Flex>
  );
}

export function StoryInfiniteCornerRouteView({
  onProgressSaved,
  headerTitle = "安排行程",
  onBack,
  destinationImagePath = RESTAURANT_WIDE_TO_NARROW_IMAGE_PATH,
  destinationAlt = "餐廳拼圖",
  destinationName = "餐廳",
  showTutorial = true,
  recordMainProgress = true,
  onRouteConnected,
  onDepartComplete,
  departureStartPoint = {
    key: "company",
    label: "公司",
    iconPath: "/images/icon/company.png",
  },
  departureMiddlePoint = {
    key: "restaurant",
    label: "餐廳",
    iconPath: "/images/icon/mart.png",
  },
  departureEndPoint = {
    key: "home",
    label: "家",
    iconPath: "/images/icon/house.png",
  },
}: {
  onProgressSaved?: () => void;
  headerTitle?: string;
  onBack?: () => void;
  destinationImagePath?: string;
  destinationAlt?: string;
  destinationName?: string;
  showTutorial?: boolean;
  recordMainProgress?: boolean;
  onRouteConnected?: () => void;
  onDepartComplete?: () => void;
  departureStartPoint?: StoryRouteMapPoint;
  departureMiddlePoint?: StoryRouteMapPoint | StoryRouteMapPoint[] | null;
  departureEndPoint?: StoryRouteMapPoint;
}) {
  const router = useRouter();
  const [heldCorner, setHeldCorner] = useState(false);
  const [placedCorners, setPlacedCorners] = useState<(FrogRestaurantPlacedCorner | null)[]>([
    null,
    null,
  ]);
  const [hint, setHint] = useState("重複使用轉彎拼圖，放上去後點擊轉向");
  const [isTutorialOpen, setIsTutorialOpen] = useState(showTutorial);
  const [rotationCount, setRotationCount] = useState(0);
  const departureFlow = useStoryRouteDepartureFlow<
    readonly (FrogRestaurantPlacedCorner | null)[]
  >({
    onConnectComplete: () => {
      if (recordMainProgress) {
        recordArrangeRouteDeparture();
        onProgressSaved?.();
      }
      onRouteConnected?.();
    },
    onDepartComplete: () => {
      if (onDepartComplete) {
        onDepartComplete();
        return;
      }
      const eventId = getFrogDiaryClueStageByAttempt(
        loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount,
      ).eventId;
      router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${eventId}&frogReturn=offwork`));
    },
  });

  const isRouteConnected = departureFlow.isRouteLocked;
  const routeCanDepart = isFrogRestaurantRouteConnected(placedCorners);
  const remainingRotations = Math.max(0, FROG_RESTAURANT_ROTATION_LIMIT - rotationCount);

  const makeCorner = () => ({
    id: `frog-restaurant-corner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cornerId: FROG_RESTAURANT_INITIAL_CORNER_ID,
    visualRotationDeg: getFrogRestaurantCornerCandidate(FROG_RESTAURANT_INITIAL_CORNER_ID).rotationDeg,
  });

  const placeCorner = useCallback((slotIndex: FrogRestaurantSlotIndex) => {
    setPlacedCorners((current) => {
      const next = [...current];
      next[slotIndex] = makeCorner();
      return next;
    });
    setHeldCorner(false);
    setHint("點擊已放上的轉彎拼圖可以轉向。");
  }, []);

  const removePlacedCorner = useCallback((slotIndex: FrogRestaurantSlotIndex) => {
    setPlacedCorners((current) => {
      const next = [...current];
      next[slotIndex] = null;
      return next;
    });
    setHeldCorner(false);
    setHint("已拿掉拼圖，可以重新安排。");
  }, []);

  const frogRestaurantDrag = useStoryRoutePointerDrag<
    {
      source: "tray" | "slot";
      cornerId: FrogRestaurantCornerId;
      visualRotationDeg: number;
      slotIndex?: FrogRestaurantSlotIndex;
    },
    | "frog-restaurant-slot-0"
    | "frog-restaurant-slot-1"
    | "frog-restaurant-remove"
    | "frog-restaurant-board"
  >({
    disabled: isRouteConnected,
    onDragStart: (payload) => {
      if (payload.source === "tray") {
        setHeldCorner(true);
        setHint("把轉彎拼圖放到空格裡。");
        return;
      }
      setHint("拖到旁邊空白處，可以拿掉拼圖。");
    },
    onDrop: (payload, target) => {
      const targetSlotIndex =
        target === "frog-restaurant-slot-0"
          ? 0
          : target === "frog-restaurant-slot-1"
            ? 1
            : null;

      if (targetSlotIndex !== null) {
        setPlacedCorners((current) => {
          const next = [...current];
          if (payload.source === "slot" && typeof payload.slotIndex === "number") {
            const movingCorner = current[payload.slotIndex];
            if (!movingCorner) return current;
            next[payload.slotIndex] = null;
            next[targetSlotIndex] = movingCorner;
            return next;
          }
          next[targetSlotIndex] = makeCorner();
          return next;
        });
        setHeldCorner(false);
        setHint("轉彎拼圖已放上去。");
        return;
      }

      if (
        target === "frog-restaurant-remove" &&
        payload.source === "slot" &&
        typeof payload.slotIndex === "number"
      ) {
        removePlacedCorner(payload.slotIndex);
      }
    },
  });

  const rotateCornerAtSlot = useCallback(
    (slotIndex: FrogRestaurantSlotIndex) => {
      if (isRouteConnected) return;
      if (!placedCorners[slotIndex]) return;
      if (rotationCount >= FROG_RESTAURANT_ROTATION_LIMIT) {
        setHint("轉彎次數用完了，按重來可以重新安排。");
        return;
      }
      setPlacedCorners((current) => {
        const next = [...current];
        getFrogRestaurantRotationTargets(current, slotIndex).forEach((targetIndex) => {
          const corner = next[targetIndex];
          if (!corner) return;
          next[targetIndex] = {
            ...corner,
            cornerId: rotateFrogRestaurantCornerId(corner.cornerId),
            visualRotationDeg: corner.visualRotationDeg + FROG_RESTAURANT_ROTATION_STEP_DEG,
          };
        });
        return next;
      });
      setRotationCount((current) => Math.min(FROG_RESTAURANT_ROTATION_LIMIT, current + 1));
      setHint("鄰近的轉彎拼圖也跟著轉向了。");
    },
    [isRouteConnected, placedCorners, rotationCount],
  );

  const resetPuzzle = () => {
    setHeldCorner(false);
    setPlacedCorners([null, null]);
    setRotationCount(0);
    setHint("重複使用轉彎拼圖，放上去後點擊轉向");
  };

  const startDeparture = useCallback(() => {
    if (!placedCorners[0] || !placedCorners[1]) {
      setHint("先把兩個空格都放上轉彎拼圖。");
      return;
    }
    if (!isFrogRestaurantRouteConnected(placedCorners)) {
      setHint(`路線還沒接到${destinationName}，點擊轉彎拼圖調整方向。`);
      return;
    }

    setHint("");
    setHeldCorner(false);
    departureFlow.startDeparture([...placedCorners]);
  }, [departureFlow, destinationName, placedCorners]);

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      direction="column"
      bgColor="#FDF6EA"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <StoryRouteDragPreviewLayer
        dragState={frogRestaurantDrag.dragState}
        renderPreview={(payload) => (
          <FrogRestaurantCornerVisual
            candidate={getFrogRestaurantCornerCandidate(payload.cornerId)}
            visualRotationDeg={payload.visualRotationDeg}
          />
        )}
      />
      <Flex h={onBack ? "58px" : "50px"} flexShrink={0} bgColor="#9B765C" alignItems="center" px={onBack ? "12px" : "18px"} gap="10px">
        {onBack ? (
          <Flex
            as="button"
            w="36px"
            h="36px"
            borderRadius="50%"
            bgColor="rgba(255,255,255,0.16)"
            color="white"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={onBack}
            aria-label="返回關卡"
          >
            <FiArrowLeft size={19} />
          </Flex>
        ) : null}
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          {headerTitle}
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/road_pattern_ bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        px="12px"
        py="14px"
        data-story-route-drop-target="frog-restaurant-remove"
      >
        <Grid
          position="relative"
          templateColumns="repeat(2, 112px)"
          templateRows="repeat(3, 112px)"
          justifyItems="center"
          alignItems="center"
          gap={isRouteConnected ? "0px" : "6px"}
          w={isRouteConnected ? "224px" : "256px"}
          h={isRouteConnected ? "336px" : "378px"}
          p={isRouteConnected ? "0" : "10px"}
          bgColor={isRouteConnected ? "transparent" : "rgba(255,255,255,0.58)"}
          border={isRouteConnected ? "0 solid transparent" : "0"}
          borderRadius={isRouteConnected ? "0" : "18px"}
          transition="width 420ms ease, height 420ms ease, padding 420ms ease, gap 420ms ease, border-radius 420ms ease, background-color 420ms ease"
          data-story-route-drop-target="frog-restaurant-board"
        >
          <Box />
          <FrogArrangeBoardTile size="112px" isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath={destinationImagePath}
              alt={destinationAlt}
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>

          {([0, 1] as FrogRestaurantSlotIndex[]).map((slotIndex) => {
            const placedCorner = placedCorners[slotIndex];
            return (
              <FrogArrangeBoardTile
                key={slotIndex}
                size="112px"
                isEmpty={!placedCorner}
                isActive={heldCorner || Boolean(placedCorner)}
                isConnected={isRouteConnected}
                dropTarget={`frog-restaurant-slot-${slotIndex}`}
                cursor={placedCorner ? "pointer" : heldCorner ? "pointer" : "default"}
                ariaLabel={
                  placedCorner
                    ? slotIndex === 0
                      ? "旋轉左側轉彎拼圖"
                      : "旋轉右側轉彎拼圖"
                    : slotIndex === 0
                      ? "放置左側轉彎拼圖"
                      : "放置右側轉彎拼圖"
                }
                onClick={() => {
                  if (isRouteConnected) return;
                  if (placedCorner) {
                    rotateCornerAtSlot(slotIndex);
                    return;
                  }
                  if (!heldCorner) {
                    setHint("先選下方的∞轉彎拼圖，或直接拖曳上來。");
                    return;
                  }
                  placeCorner(slotIndex);
                }}
              >
                {placedCorner ? (
                  <FrogRestaurantPlacedCornerTile
                    corner={placedCorner}
                    isConnected={isRouteConnected}
                    onPointerDown={(event) =>
                      frogRestaurantDrag.startDrag(
                        event,
                        {
                          source: "slot",
                          cornerId: placedCorner.cornerId,
                          visualRotationDeg: placedCorner.visualRotationDeg,
                          slotIndex,
                        },
                        { size: 92 },
                      )
                    }
                  />
                ) : null}
              </FrogArrangeBoardTile>
            );
          })}

          <FrogArrangeBoardTile size="112px" isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath={START_HOME_NARROW_IMAGE_PATH}
              alt="家的拼圖"
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>
          <Box />
        </Grid>
      </Flex>

      <Flex h="54px" flexShrink={0} bgColor="#B88E6D" alignItems="center" px="18px" gap="12px">
        <Text color="#FFFFFF" fontSize="15px" fontWeight="900" lineHeight="1">
          剩餘轉彎次數：{remainingRotations}次
        </Text>
        <Flex
          as="button"
          h="32px"
          minW="76px"
          ml="auto"
          borderRadius="999px"
          bgColor="#FFFFFF"
          color="#986E53"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={resetPuzzle}
        >
          <Text color="#986E53" fontSize="14px" fontWeight="900" lineHeight="1">
            重來
          </Text>
        </Flex>
      </Flex>

      <Flex
        minH="160px"
        maxH="160px"
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(185,152,115,0.12)"
      >
        <Flex
          h="44px"
          px="14px"
          alignItems="center"
          justifyContent="center"
          bgColor="#F8E7CC"
          borderBottom="1px solid rgba(185,152,115,0.16)"
        >
          <Text color="#9B765C" fontSize="13px" fontWeight="900" lineHeight="1.35" textAlign="center">
            {hint}
          </Text>
        </Flex>
        <Flex
          flex="1"
          minH="0"
          alignItems="center"
          justifyContent="flex-start"
          px="28px"
          py="14px"
          data-story-route-drop-target="frog-restaurant-remove"
        >
          <FrogRestaurantInfiniteTrayTile
            isSelected={heldCorner}
            isDisabled={isRouteConnected}
            onClick={() => {
              if (isRouteConnected) return;
              setHeldCorner(true);
              setHint("點空格，或拖曳拼圖放上去。");
            }}
            onPointerDown={(event) =>
              frogRestaurantDrag.startDrag(
                event,
                {
                  source: "tray",
                  cornerId: FROG_RESTAURANT_INITIAL_CORNER_ID,
                  visualRotationDeg: getFrogRestaurantCornerCandidate(FROG_RESTAURANT_INITIAL_CORNER_ID).rotationDeg,
                },
                { size: 96 },
              )
            }
          />
        </Flex>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent="flex-end"
        px="18px"
        py="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
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
          cursor={routeCanDepart ? "pointer" : "not-allowed"}
          opacity={routeCanDepart || isRouteConnected ? 1 : 0.5}
          pointerEvents={isRouteConnected ? "none" : "auto"}
          flexShrink={0}
          onClick={startDeparture}
        >
          出發
        </Flex>
      </Flex>

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={departureStartPoint}
          middlePoint={departureMiddlePoint}
          endPoint={departureEndPoint}
        />
      ) : null}

      {showTutorial && isTutorialOpen && !isRouteConnected ? (
        <FrogRestaurantRouteTutorialModal onClose={() => setIsTutorialOpen(false)} />
      ) : null}
    </Flex>
  );
}

export function StoryDailyLevelOneRouteView({
  locationChoices,
  onBack,
  onDepartComplete,
}: {
  locationChoices: StoryDailyLevelOneLocationChoice[];
  onBack: () => void;
  onDepartComplete: (visitedLocationIds: string[]) => void;
}) {
  const [placedTiles, setPlacedTiles] = useState<Array<StoryDailyLevelOnePlacedTile | null>>(
    createDailyLevelOneInitialBoard,
  );
  const [heldTile, setHeldTile] = useState<StoryDailyLevelOneHeldTile | null>(null);
  const [hint, setHint] = useState("轉彎時，相鄰的轉彎拼圖會跟著旋轉");
  const [rotationCount, setRotationCount] = useState(0);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [departureMiddlePoints, setDepartureMiddlePoints] = useState<StoryRouteMapPoint[]>([]);
  const departedLocationIdsRef = useRef<string[]>([]);
  const departureFlow = useStoryRouteDepartureFlow<
    readonly (StoryDailyLevelOnePlacedTile | null)[]
  >({
    onConnectComplete: () => {},
    onDepartComplete: () => onDepartComplete(departedLocationIdsRef.current),
  });
  const isRouteConnected = departureFlow.isRouteLocked;
  const remainingRotations = Math.max(0, DAILY_LEVEL_ONE_ROTATION_LIMIT - rotationCount);

  const getConnectorAtGraphIndex = useCallback(
    (graphIndex: number): RouteGridConnector | null => {
      if (graphIndex === DAILY_LEVEL_ONE_END_INDEX) return DAILY_LEVEL_ONE_END_CONNECTOR;
      if (graphIndex === DAILY_LEVEL_ONE_START_INDEX) return DAILY_LEVEL_ONE_START_CONNECTOR;
      const graphRow = Math.floor(graphIndex / DAILY_LEVEL_ONE_GRAPH_COLS);
      const graphCol = graphIndex % DAILY_LEVEL_ONE_GRAPH_COLS;
      if (graphRow < 1 || graphRow > DAILY_LEVEL_ONE_BOARD_ROWS) return null;
      const boardIndex = (graphRow - 1) * DAILY_LEVEL_ONE_BOARD_COLS + graphCol;
      return getDailyLevelOneTileConnector(placedTiles[boardIndex] ?? null);
    },
    [placedTiles],
  );

  const routeCanDepart = isRouteGridConnected({
    rows: DAILY_LEVEL_ONE_GRAPH_ROWS,
    cols: DAILY_LEVEL_ONE_GRAPH_COLS,
    startIndex: DAILY_LEVEL_ONE_START_INDEX,
    endIndex: DAILY_LEVEL_ONE_END_INDEX,
    getConnector: getConnectorAtGraphIndex,
  });

  useEffect(() => {
    if (routeCanDepart && !isRouteConnected) {
      setHint("路線接好了，可以出發！");
    }
  }, [isRouteConnected, routeCanDepart]);

  const placeHeldTile = useCallback(
    (boardIndex: number) => {
      if (!heldTile || isRouteConnected) return;
      setPlacedTiles((current) => {
        if (
          heldTile.kind === "location" &&
          current.some(
            (tile, index) =>
              index !== boardIndex &&
              tile?.kind === "location" &&
              tile.choice.id === heldTile.choice.id,
          )
        ) {
          return current;
        }
        const next = [...current];
        next[boardIndex] =
          heldTile.kind === "corner"
            ? makeDailyLevelOneCorner()
            : {
                kind: "location",
                id: `daily-level-one-location-${heldTile.choice.id}`,
                choice: heldTile.choice,
              };
        return next;
      });
      setHeldTile(null);
      setHint(heldTile.kind === "corner" ? "點擊轉彎拼圖可以旋轉。" : "地點拼圖已放上去。");
    },
    [heldTile, isRouteConnected],
  );

  const rotateCornerAt = useCallback(
    (boardIndex: number) => {
      if (isRouteConnected) return;
      if (placedTiles[boardIndex]?.kind !== "corner") return;
      if (rotationCount >= DAILY_LEVEL_ONE_ROTATION_LIMIT) {
        setHint("旋轉次數用完了，按提示後可以重來。");
        return;
      }
      setPlacedTiles((current) => {
        const targets = [
          boardIndex,
          ...getRouteGridOrthogonalNeighborIndices({
            index: boardIndex,
            rows: DAILY_LEVEL_ONE_BOARD_ROWS,
            cols: DAILY_LEVEL_ONE_BOARD_COLS,
          }).filter((neighborIndex) => current[neighborIndex]?.kind === "corner"),
        ];
        const next = [...current];
        targets.forEach((targetIndex) => {
          const tile = next[targetIndex];
          if (!tile || tile.kind !== "corner") return;
          next[targetIndex] = {
            ...tile,
            cornerId: rotateFrogRestaurantCornerId(tile.cornerId),
            visualRotationDeg: tile.visualRotationDeg + FROG_RESTAURANT_ROTATION_STEP_DEG,
          };
        });
        return next;
      });
      setRotationCount((current) => Math.min(DAILY_LEVEL_ONE_ROTATION_LIMIT, current + 1));
      setHint(`相鄰的轉彎拼圖也跟著旋轉了，還可旋轉 ${Math.max(0, remainingRotations - 1)} 次。`);
    },
    [isRouteConnected, placedTiles, remainingRotations, rotationCount],
  );

  const drag = useStoryRoutePointerDrag<
    {
      source: "tray" | "cell";
      held: StoryDailyLevelOneHeldTile;
      placedTile?: StoryDailyLevelOnePlacedTile;
      boardIndex?: number;
    },
    string
  >({
    disabled: isRouteConnected,
    onDragStart: (payload) => {
      if (payload.source === "tray") {
        setHeldTile(payload.held);
        setHint("拖到六個空格中的任一格。");
        return;
      }
      setHint("拖到別格移動，或拖回托盤移除。");
    },
    onTap: (payload) => {
      if (payload.source === "tray") {
        setHeldTile(payload.held);
        setHint(
          payload.held.kind === "corner"
            ? "∞ 轉彎拼圖可以重複使用，點空格放上去。"
            : `選了${payload.held.choice.label}，把它放進路線。`,
        );
        return;
      }
      if (heldTile && typeof payload.boardIndex === "number") {
        placeHeldTile(payload.boardIndex);
        return;
      }
      if (payload.placedTile?.kind === "corner" && typeof payload.boardIndex === "number") {
        setHeldTile(null);
        rotateCornerAt(payload.boardIndex);
        return;
      }
      if (payload.placedTile?.kind === "location" && typeof payload.boardIndex === "number") {
        setPlacedTiles((current) =>
          current.map((tile, index) => (index === payload.boardIndex ? null : tile)),
        );
        setHeldTile({ kind: "location", choice: payload.placedTile.choice });
        setHint("已拿起地點拼圖，點另一格重新放置。");
      }
    },
    onDrop: (payload, target) => {
      if (target?.startsWith("daily-level-one-cell-")) {
        const targetIndex = Number(target.slice("daily-level-one-cell-".length));
        if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= 6) return;
        setPlacedTiles((current) => {
          const next = [...current];
          if (payload.source === "cell" && typeof payload.boardIndex === "number") {
            next[payload.boardIndex] = null;
          }
          const nextTile =
            payload.source === "cell" && payload.placedTile
              ? payload.placedTile
              : payload.held.kind === "corner"
                ? makeDailyLevelOneCorner()
                : {
                    kind: "location" as const,
                    id: `daily-level-one-location-${payload.held.choice.id}`,
                    choice: payload.held.choice,
                  };
          if (
            nextTile.kind === "location" &&
            next.some(
              (tile, index) =>
                index !== targetIndex &&
                tile?.kind === "location" &&
                tile.choice.id === nextTile.choice.id,
            )
          ) {
            return current;
          }
          next[targetIndex] = nextTile;
          return next;
        });
        setHeldTile(null);
        setHint("拼圖已放上去。");
        return;
      }
      if (
        (target === "daily-level-one-tray" || target === "daily-level-one-remove") &&
        payload.source === "cell" &&
        typeof payload.boardIndex === "number"
      ) {
        setPlacedTiles((current) =>
          current.map((tile, index) => (index === payload.boardIndex ? null : tile)),
        );
        setHeldTile(null);
        setHint("已把拼圖拿回托盤。");
      }
    },
  });

  const resetPuzzle = () => {
    setPlacedTiles(createDailyLevelOneInitialBoard());
    setHeldTile(null);
    setRotationCount(0);
    setHint("轉彎時，相鄰的轉彎拼圖會跟著旋轉");
    setIsTutorialOpen(false);
  };

  const startDeparture = () => {
    if (!routeCanDepart || isRouteConnected) {
      setHint("路線還沒從 Start 接到旗幟，試著轉動相鄰拼圖。");
      return;
    }
    const reachable = getReachableRouteGridIndices({
      rows: DAILY_LEVEL_ONE_GRAPH_ROWS,
      cols: DAILY_LEVEL_ONE_GRAPH_COLS,
      startIndex: DAILY_LEVEL_ONE_START_INDEX,
      getConnector: getConnectorAtGraphIndex,
    });
    const visitedChoices = placedTiles.flatMap((tile, boardIndex) => {
      if (tile?.kind !== "location") return [];
      return reachable.has(dailyLevelOneBoardIndexToGraphIndex(boardIndex)) ? [tile.choice] : [];
    });
    const visitedLocationIds = Array.from(
      new Set(visitedChoices.map((choice) => choice.locationId)),
    );
    departedLocationIdsRef.current = visitedLocationIds;
    setDepartureMiddlePoints(
      visitedChoices.map((choice) => ({
        key: `daily-level-one-${choice.id}`,
        label: choice.label,
        iconPath: choice.iconPath,
        isTarget: true,
      })),
    );
    setHeldTile(null);
    setHint("");
    departureFlow.startDeparture([...placedTiles]);
  };

  const previewTile = (payload: {
    held: StoryDailyLevelOneHeldTile;
    placedTile?: StoryDailyLevelOnePlacedTile;
  }) => {
    const placedTile = payload.placedTile;
    if (placedTile?.kind === "corner") {
      return (
        <FrogRestaurantCornerVisual
          candidate={getFrogRestaurantCornerCandidate(placedTile.cornerId)}
          visualRotationDeg={placedTile.visualRotationDeg}
        />
      );
    }
    if (payload.held.kind === "corner") {
      return <FrogRestaurantCornerVisual candidate={getFrogRestaurantCornerCandidate("left-top")} />;
    }
    return (
      <Image
        src={payload.held.choice.imagePath}
        alt={payload.held.choice.label}
        w="100%"
        h="100%"
        objectFit="cover"
      />
    );
  };

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      direction="column"
      overflow="hidden"
      bgColor="#FFFFFF"
      borderRadius={{ base: "0", sm: "20px" }}
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <StoryRouteDragPreviewLayer dragState={drag.dragState} renderPreview={previewTile} />

      <Flex h="55px" flexShrink={0} bgColor="#B88E6D" alignItems="center" px="12px">
        <Flex
          as="button"
          w="36px"
          h="36px"
          borderRadius="50%"
          bgColor="rgba(255,255,255,0.24)"
          color="#FFFFFF"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={onBack}
          aria-label="返回關卡"
        >
          <FiArrowLeft size={20} />
        </Flex>
        <Text ml="auto" mr="10px" color="#FFFFFF" fontSize="27px" fontWeight="500" lineHeight="1">
          level 1
        </Text>
      </Flex>

      <Box
        position="relative"
        h="500px"
        flexShrink={0}
        bgColor="#FFFFFF"
        data-story-route-drop-target="daily-level-one-remove"
      >
        <Flex
          position="absolute"
          top="17px"
          left="106px"
          w="89px"
          h="89px"
          borderRadius="4px"
          overflow="hidden"
          bgColor="#C2DB99"
        >
          <Image src={DAILY_LEVEL_ONE_GOAL_IMAGE_PATH} alt="旗幟終點" w="100%" h="100%" objectFit="cover" />
          <Text
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -56%)"
            color="#FFF6D9"
            fontSize="42px"
            fontWeight="900"
            textShadow="0 2px 2px rgba(114,81,52,0.18)"
            aria-hidden="true"
          >
            ⚑
          </Text>
        </Flex>

        <Grid
          position="absolute"
          top="110px"
          left="100px"
          templateColumns="repeat(2, 90px)"
          templateRows="repeat(3, 89px)"
          gap={isRouteConnected ? "0px" : "4px"}
          transition="gap 420ms ease"
        >
          {placedTiles.map((tile, boardIndex) => (
            <Flex
              as="button"
              key={boardIndex}
              w="90px"
              h="89px"
              p="0"
              position="relative"
              borderRadius={isRouteConnected ? "0" : "6px"}
              overflow="hidden"
              bgColor={tile ? "#F4ECDF" : "#FAF3E8"}
              outline={heldTile && !isRouteConnected ? "2px solid rgba(83,197,213,0.34)" : "0"}
              outlineOffset="-2px"
              cursor={isRouteConnected ? "default" : tile?.kind === "corner" ? "pointer" : "grab"}
              transition="border-radius 420ms ease, outline-color 160ms ease"
              data-story-route-drop-target={`daily-level-one-cell-${boardIndex}`}
              aria-label={
                tile?.kind === "corner"
                  ? `第 ${boardIndex + 1} 格，轉彎拼圖，點擊旋轉`
                  : tile?.kind === "location"
                    ? `第 ${boardIndex + 1} 格，${tile.choice.label}拼圖`
                    : `第 ${boardIndex + 1} 格，空格`
              }
              onClick={() => {
                if (isRouteConnected) return;
                if (tile) return;
                if (heldTile) {
                  placeHeldTile(boardIndex);
                  return;
                }
                setHint("先從下方選一張拼圖。");
              }}
            >
              {tile?.kind === "corner" ? (
                <FrogRestaurantPlacedCornerTile
                  corner={tile}
                  isConnected={isRouteConnected}
                  onPointerDown={(event) =>
                    drag.startDrag(
                      event,
                      {
                        source: "cell",
                        held: { kind: "corner" },
                        placedTile: tile,
                        boardIndex,
                      },
                      { size: 86 },
                    )
                  }
                />
              ) : null}
              {tile?.kind === "location" ? (
                <Flex
                  w="100%"
                  h="100%"
                  alignItems="center"
                  justifyContent="center"
                  touchAction="none"
                  userSelect="none"
                  onPointerDown={(event) =>
                    drag.startDrag(
                      event,
                      {
                        source: "cell",
                        held: { kind: "location", choice: tile.choice },
                        placedTile: tile,
                        boardIndex,
                      },
                      { size: 86 },
                    )
                  }
                >
                  <FrogArrangePlacedTile
                    imagePath={tile.choice.imagePath}
                    alt={`${tile.choice.label}拼圖`}
                    isConnected={isRouteConnected}
                  />
                </Flex>
              ) : null}
            </Flex>
          ))}
        </Grid>

        <Flex
          position="absolute"
          top="389px"
          left="99px"
          w="92px"
          h="92px"
          borderRadius="3px"
          overflow="hidden"
          bgColor="#C2DB99"
        >
          <Image src={START_HOME_NARROW_IMAGE_PATH} alt="Start" w="100%" h="100%" objectFit="cover" />
          <Text
            position="absolute"
            left="50%"
            bottom="3px"
            transform="translateX(-50%)"
            color="#17120F"
            fontSize="17px"
            fontWeight="900"
          >
            Start
          </Text>
        </Flex>
      </Box>

      <Flex h="43px" flexShrink={0} bgColor="#E7CBA9" alignItems="center" justifyContent="center" px="12px">
        <Text color="#17120F" fontSize="15px" fontWeight="900" textAlign="center">
          {hint}
        </Text>
      </Flex>

      <Flex
        h="190px"
        flexShrink={0}
        bgColor="#FDF6EA"
        px="12px"
        alignItems="flex-start"
        gap="8px"
        pt="14px"
        data-story-route-drop-target="daily-level-one-tray"
      >
        <Flex
          as="button"
          position="relative"
          w="84px"
          h="84px"
          flexShrink={0}
          borderRadius="4px"
          bgColor="#F4ECDF"
          border={heldTile?.kind === "corner" ? "3px solid #53C5D5" : "2px solid rgba(142,122,98,0.65)"}
          alignItems="center"
          justifyContent="center"
          cursor={isRouteConnected ? "default" : "grab"}
          touchAction="none"
          onClick={() => {
            if (isRouteConnected) return;
            setHeldTile({ kind: "corner" });
            setHint("∞ 轉彎拼圖可以重複使用，點空格放上去。");
          }}
          onPointerDown={(event) =>
            drag.startDrag(event, { source: "tray", held: { kind: "corner" } }, { size: 84 })
          }
          aria-label="可無限重複使用的轉彎拼圖"
        >
          <FrogRestaurantCornerVisual candidate={getFrogRestaurantCornerCandidate("left-top")} />
          <Flex
            position="absolute"
            right="-4px"
            bottom="-4px"
            minW="24px"
            h="22px"
            px="5px"
            borderRadius="999px"
            bgColor="#FFF9ED"
            border="2px solid #B98A62"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#8F6548" fontSize="15px" fontWeight="900" lineHeight="1">
              ∞
            </Text>
          </Flex>
        </Flex>

        {locationChoices.map((choice) => {
          const isUsed = placedTiles.some(
            (tile) => tile?.kind === "location" && tile.choice.id === choice.id,
          );
          const isSelected = heldTile?.kind === "location" && heldTile.choice.id === choice.id;
          return (
            <Flex
              as="button"
              key={choice.id}
              w="78px"
              h="78px"
              flexShrink={0}
              borderRadius="3px"
              overflow="hidden"
              bgColor="#C2DB99"
              border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255,249,239,0.82)"}
              opacity={isUsed ? 0.38 : 1}
              cursor={isUsed || isRouteConnected ? "default" : "grab"}
              touchAction="none"
              onClick={() => {
                if (isUsed || isRouteConnected) return;
                setHeldTile({ kind: "location", choice });
                setHint(`選了${choice.label}，把它放進路線。`);
              }}
              onPointerDown={
                isUsed || isRouteConnected
                  ? undefined
                  : (event) =>
                      drag.startDrag(
                        event,
                        { source: "tray", held: { kind: "location", choice } },
                        { size: 78 },
                      )
              }
              aria-label={`${choice.label}・寬轉窄`}
              aria-disabled={isUsed || isRouteConnected}
            >
              <Image src={choice.imagePath} alt={`${choice.label}・寬轉窄`} w="100%" h="100%" objectFit="cover" />
            </Flex>
          );
        })}
      </Flex>

      <Flex h="64px" flexShrink={0} bgColor="#B88E6D" alignItems="center" px="19px" justifyContent="space-between">
        <Flex
          as="button"
          w="80px"
          h="43px"
          borderRadius="999px"
          bgColor="#FFFFFF"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={() => setIsTutorialOpen(true)}
        >
          <Text color="#17120F" fontSize="17px" fontWeight="900">
            提示
          </Text>
        </Flex>
        <Flex
          as="button"
          w="167px"
          h="43px"
          borderRadius="999px"
          bgColor="#FFFFFF"
          alignItems="center"
          justifyContent="center"
          cursor={routeCanDepart ? "pointer" : "not-allowed"}
          opacity={routeCanDepart || isRouteConnected ? 1 : 0.64}
          pointerEvents={isRouteConnected ? "none" : "auto"}
          onClick={startDeparture}
        >
          <Text color="#17120F" fontSize="20px" fontWeight="900">
            出發！
          </Text>
        </Flex>
      </Flex>

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={{ key: "daily-level-one-home", label: "家", iconPath: "/images/icon/house.png" }}
          middlePoint={departureMiddlePoints}
          endPoint={{ key: "daily-level-one-end", label: "終點", iconPath: "/images/icon/road.png" }}
        />
      ) : null}

      {isTutorialOpen && !isRouteConnected ? (
        <Box position="absolute" inset="0" zIndex={82}>
          <FrogRestaurantRouteTutorialModal onClose={() => setIsTutorialOpen(false)} />
          <Flex
            position="absolute"
            left="50%"
            bottom="118px"
            transform="translateX(-50%)"
            zIndex={83}
            as="button"
            h="34px"
            px="16px"
            borderRadius="999px"
            bgColor="#F3E1C9"
            color="#8A6044"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={resetPuzzle}
          >
            <Text color="inherit" fontSize="12px" fontWeight="900">
              重來（剩餘 {remainingRotations} 次旋轉）
            </Text>
          </Flex>
        </Box>
      ) : null}
    </Flex>
  );
}

function StoryFrogClueArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const [frogPhotoAttemptCount, setFrogPhotoAttemptCount] = useState(() =>
    loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount,
  );
  const [hasCompletedStreetForgotLunchFrogEvent, setHasCompletedStreetForgotLunchFrogEvent] =
    useState(() => loadPlayerProgress().hasCompletedStreetForgotLunchFrogEvent);

  useEffect(() => {
    const progress = loadPlayerProgress();
    setFrogPhotoAttemptCount(progress.streetForgotLunchFrogPhotoAttemptCount);
    setHasCompletedStreetForgotLunchFrogEvent(progress.hasCompletedStreetForgotLunchFrogEvent);
  }, []);

  const targetStage = getFrogDiaryClueStageByAttempt(frogPhotoAttemptCount);
  if (targetStage.id === "restaurant-wrong-order" && !hasCompletedStreetForgotLunchFrogEvent) {
    return <StoryInfiniteCornerRouteView onProgressSaved={onProgressSaved} />;
  }

  return (
    <StoryFrogDefaultClueArrangeRouteView
      onProgressSaved={onProgressSaved}
      initialFrogPhotoAttemptCount={frogPhotoAttemptCount}
    />
  );
}

function StoryFrogDefaultClueArrangeRouteView({
  onProgressSaved,
  initialFrogPhotoAttemptCount,
}: {
  onProgressSaved?: () => void;
  initialFrogPhotoAttemptCount: number;
}) {
  const router = useRouter();
  const [frogPhotoAttemptCount, setFrogPhotoAttemptCount] = useState(initialFrogPhotoAttemptCount);
  const routeChoices = getFrogRoutePuzzleChoices(frogPhotoAttemptCount);

  useEffect(() => {
    const progress = loadPlayerProgress();
    setFrogPhotoAttemptCount(progress.streetForgotLunchFrogPhotoAttemptCount);
  }, []);

  return (
    <StoryLinearRoutePuzzleStage<FrogRoutePuzzleChoice>
      config={{
        id: "frog-route",
        choices: routeChoices,
        slotCount: 2,
        slotTargetIds: ["frog-route-slot-0", "frog-route-slot-1"],
        boardDropTarget: "frog-route-board",
        removeDropTarget: "frog-route-remove",
        initialHint: "",
        emptySlotHint: "先選一塊拼圖，或直接拖曳上來。",
        selectedHint: () => "",
        departureButtonText: "出發",
        board: {
          templateRows: "repeat(4, 112px)",
          expandedWidth: "150px",
          connectedWidth: "112px",
          expandedHeight: "486px",
          connectedHeight: "448px",
          expandedGap: "6px",
          connectedGap: "0px",
          tileSize: "112px",
          fixedTop: {
            imagePath: END_COMPANY_WIDE_IMAGE_PATH,
            alt: "公司拼圖",
          },
          fixedBottom: {
            imagePath: START_HOME_NARROW_IMAGE_PATH,
            alt: "家的拼圖",
          },
        },
        tray: {
          variant: "square-grid",
          height: "210px",
          ariaOnlyHint: true,
        },
        canPressDeparture: (placedChoices) => isFrogRoutePuzzleConnected(placedChoices),
        isSolved: (placedChoices) => isFrogRoutePuzzleConnected(placedChoices),
        validateDeparture: (placedChoices) => {
          if (!placedChoices[0] || !placedChoices[1]) return "先把兩格路線排滿。";
          if (!isFrogRoutePuzzleConnected(placedChoices)) return "路線寬度還沒對齊。";
          return null;
        },
        getMismatchSeams: (placedChoices) =>
          getFrogRoutePuzzleMismatchSeams(placedChoices).map((placement) => ({
            type: "frog",
            placement,
          })),
        disablePlacedChoices: true,
        journalButtons: {
          buttonSize: "58px",
          bottom: "20px",
        },
        renderTutorial:
          frogPhotoAttemptCount === 1
            ? (onClose) => <FrogRouteNextDayTutorialModal onClose={onClose} />
            : undefined,
        hideTutorialWhenDiaryOpen: true,
        departureStartPoint: {
          key: "company",
          label: "公司",
          iconPath: "/images/icon/company.png",
        },
        departureEndPoint: {
          key: "home",
          label: "家",
          iconPath: "/images/icon/house.png",
        },
        getDepartureMiddlePoint: (placedChoices) => {
          const eventChoice = getFrogRoutePuzzleEventChoice(placedChoices, frogPhotoAttemptCount);
          const departurePoints = placedChoices.flatMap((choice, index): StoryRouteMapPoint[] =>
            choice
              ? [
                  {
                    key: `${choice.id}-${index}`,
                    label: choice.label,
                    iconPath: choice.mapIconPath,
                    isTarget: choice.id === eventChoice?.id,
                  },
                ]
              : [],
          );
          return departurePoints.length > 0 ? departurePoints : null;
        },
        onConnectComplete: () => {
          recordArrangeRouteDeparture();
          onProgressSaved?.();
        },
        onDepartComplete: (placedChoices) => {
          const eventChoice = getFrogRoutePuzzleEventChoice(placedChoices, frogPhotoAttemptCount);
          if (!eventChoice) return;
          const eventId = getFrogRouteEventId(eventChoice, frogPhotoAttemptCount);
          const orderedItineraryPoints = placedChoices
            .map((choice) => {
              if (!choice) return null;
              const sourceId = getRouteChoiceDepartureSourceId(choice);
              if (!sourceId) return null;
              return {
                sourceId,
                eventId: getFrogRouteEventId(choice, frogPhotoAttemptCount),
              };
            })
            .filter(
              (point): point is { sourceId: PlaceTileId; eventId: GameEventId } =>
                Boolean(point),
            );
          const currentSourceId = getRouteChoiceDepartureSourceId(eventChoice);
          if (currentSourceId) {
            saveStoryRouteDepartureItinerary({
              points: orderedItineraryPoints,
              currentSourceId,
            });
          }
          router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${eventId}`));
        },
      }}
    />
  );
}

function StoryWorkLunchConvenienceRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const routeStep = WORK_LUNCH_SCENE_JUMP_STEPS.find((step) => step.id === "route");
    if (!routeStep) return;

    dispatchSceneJumpContextChange({
      optionId: WORK_LUNCH_SCENE_JUMP_OPTION_ID,
      kindLabel: routeStep.kindLabel,
      text: routeStep.text,
      steps: WORK_LUNCH_SCENE_JUMP_STEPS,
      currentStepId: routeStep.id,
    });

    return () => {
      dispatchSceneJumpContextChange({ clear: true });
    };
  }, []);

  return (
    <StoryLinearRoutePuzzleStage<RouteChoice>
      config={{
        id: "work-lunch",
        choices: WORK_LUNCH_ROUTE_CHOICES,
        slotCount: 1,
        slotTargetIds: ["work-lunch-slot"],
        boardDropTarget: "work-lunch-board",
        removeDropTarget: "work-lunch-remove",
        initialHint: "將拼圖拖到空格裡，要符合道路寬度",
        emptySlotHint: "先在下方選一塊拼圖，或直接拖曳上來。",
        selectedHint: getWorkLunchRouteMismatchHint,
        alreadyPlacedHint: getWorkLunchRouteMismatchHint,
        departureButtonText: "出發",
        board: {
          templateRows: "repeat(3, 1fr)",
          expandedWidth: "150px",
          connectedWidth: "116px",
          expandedHeight: "398px",
          connectedHeight: "348px",
          expandedGap: "10px",
          connectedGap: "0px",
          fixedTop: {
            imagePath: WORK_LUNCH_CONVENIENCE_STORE_ROUTE_IMAGE_PATH,
            alt: "便利商店拼圖",
          },
          fixedBottom: {
            imagePath: WORK_LUNCH_COMPANY_ROUTE_IMAGE_PATH,
            alt: "公司拼圖",
          },
        },
        tray: {
          variant: "square-strip",
          height: "166px",
        },
        canPressDeparture: (placedChoices) => Boolean(placedChoices[0]),
        isSolved: (placedChoices) => placedChoices[0]?.id === WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID,
        validateDeparture: (placedChoices) => {
          const placedChoice = placedChoices[0];
          if (!placedChoice) return "先選一塊拼圖放進路線。";
          if (placedChoice.id !== WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID) {
            return getWorkLunchRouteMismatchHint(placedChoice);
          }
          return null;
        },
        getMismatchSeams: (placedChoices) => {
          const placedChoice = placedChoices[0];
          if (!placedChoice) return [];
          const mismatch = getWorkLunchRouteEdgeMismatch(placedChoice);
          return [
            ...(mismatch.top ? [{ type: "work-lunch" as const, placement: "top" as const }] : []),
            ...(mismatch.bottom ? [{ type: "work-lunch" as const, placement: "bottom" as const }] : []),
          ];
        },
        renderTutorial: (onClose) => <WorkLunchWidthTutorialModal onClose={onClose} />,
        renderAnswerHint: (onClose) => <WorkLunchAnswerHintModal onClose={onClose} />,
        departureStartPoint: {
          key: "company",
          label: "公司",
          iconPath: "/images/icon/company.png",
        },
        departureEndPoint: {
          key: "convenience-store",
          label: "便利商店",
          iconPath: "/images/icon/mart.png",
        },
        getDepartureMiddlePoint: () => null,
        onConnectComplete: () => {
          markWorkLunchForgotBentoEventTriggered();
          recordArrangeRouteDeparture();
          onProgressSaved?.();
        },
        onDepartComplete: () => {
          const eventId = getFrogDiaryClueStageByAttempt(
            loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount,
          ).eventId;
          router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${eventId}`));
        },
      }}
    />
  );
}

function StoryMetroArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();

  return (
    <StoryLinearRoutePuzzleStage<RouteChoice>
      config={{
        id: "simple-route",
        choices: SIMPLE_ROUTE_CHOICES,
        slotCount: 1,
        slotTargetIds: ["simple-route-slot"],
        boardDropTarget: "simple-route-board",
        removeDropTarget: "simple-route-remove",
        initialHint: "將下方的拼圖拉到空格裡，安排今天的出行路線。",
        emptySlotHint: "先在下方選一塊拼圖，或直接拖曳上來。",
        selectedHint: (choice) =>
          choice.id === SIMPLE_METRO_ROUTE_CHOICE.id
            ? "已安排捷運路線，今天就照日記線索出發。"
            : "已安排街道路線。這不是日記線索，但也可以照常出發。",
        alreadyPlacedHint: "這塊已經放上去了。",
        departureButtonText: "出發！",
        renderBoardHint: false,
        board: {
          templateRows: "repeat(3, 1fr)",
          expandedWidth: "150px",
          connectedWidth: "116px",
          expandedHeight: "398px",
          connectedHeight: "348px",
          expandedGap: "10px",
          connectedGap: "0px",
          fixedTop: {
            imagePath: END_COMPANY_NARROW_IMAGE_PATH,
            alt: "終點拼圖",
          },
          fixedBottom: {
            imagePath: START_HOME_NARROW_IMAGE_PATH,
            alt: "起點拼圖",
          },
        },
        tray: {
          variant: "label-strip",
          height: "166px",
          headerText: "選擇拼圖(將拼圖拖到空格裡)",
        },
        canPressDeparture: (placedChoices) => Boolean(placedChoices[0]),
        isSolved: (placedChoices) => Boolean(placedChoices[0]),
        validateDeparture: (placedChoices) =>
          placedChoices[0] ? null : "把下方的拼圖拉到中間空格。",
        journalButtons: {
          buttonSize: "72px",
          bottom: "24px",
        },
        renderTutorial: (onClose) => <SimpleRouteTutorialModal onClose={onClose} />,
        showHeaderHelpControls: false,
        hideTutorialWhenDiaryOpen: true,
        getDepartureMiddlePoint: (placedChoices) => {
          const placedChoice = placedChoices[0];
          return placedChoice
            ? {
                key: placedChoice.id,
                label: placedChoice.label,
                iconPath: placedChoice.mapIconPath,
              }
            : undefined;
        },
        onConnectComplete: () => {
          recordArrangeRouteDeparture();
          onProgressSaved?.();
        },
        onDepartComplete: (placedChoices) => {
          const placedChoice = placedChoices[0];
          if (!placedChoice) return;
          if (placedChoice.id === SIMPLE_METRO_ROUTE_CHOICE.id) {
            setPendingSceneTransition("scene-69");
            router.push(withTrialProfileSearch(ROUTES.gameScene("scene-69")));
            return;
          }
          const streetEventId =
            SIMPLE_STREET_DAILY_EVENT_IDS[Math.floor(Math.random() * SIMPLE_STREET_DAILY_EVENT_IDS.length)] ??
            placedChoice.fallbackEventId;
          router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${streetEventId}`));
        },
      }}
    />
  );
}

function SimpleRouteTutorialThumb({
  choice,
  animateSource = false,
}: {
  choice: RouteChoice;
  animateSource?: boolean;
}) {
  return (
    <Flex
      w="74px"
      h="74px"
      borderRadius="6px"
      overflow="hidden"
      bgColor="#F0E6D5"
      border="2px solid rgba(255,255,255,0.9)"
      boxShadow="0 4px 8px rgba(92,63,38,0.1)"
      animation={animateSource ? `${simpleRouteTutorialSourceTile} 2600ms ease-in-out infinite` : undefined}
    >
      <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" />
    </Flex>
  );
}

function SimpleRouteTutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={82}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex
          direction="column"
          bgColor="#FFFDF8"
          border="1px solid #E5D2B7"
          borderRadius="18px"
          boxShadow="0 14px 28px rgba(62,45,26,0.18)"
          p="14px"
          gap="12px"
          overflow="hidden"
        >
          <Box position="relative" h="246px" borderRadius="14px" bgColor="#FFF9EF" overflow="hidden">
            <Flex
              position="absolute"
              left="50%"
              top="22px"
              w="88px"
              h="88px"
              transform="translateX(-50%)"
              border="2px dashed rgba(191, 166, 139, 0.68)"
              borderRadius="13px"
              bgColor="rgba(255,255,255,0.58)"
              alignItems="center"
              justifyContent="center"
              animation={`${simpleRouteTutorialSlotPulse} 2600ms ease-in-out infinite`}
            >
              <Flex
                w="74px"
                h="74px"
                borderRadius="6px"
                overflow="hidden"
                animation={`${simpleRouteTutorialPlacedTile} 2600ms ease-in-out infinite`}
              >
                <Image
                  src={SIMPLE_METRO_ROUTE_CHOICE.imagePath}
                  alt=""
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  aria-hidden="true"
                />
              </Flex>
            </Flex>

            <Flex
              position="absolute"
              left="10px"
              right="10px"
              bottom="12px"
              h="94px"
              borderRadius="12px"
              bgColor="rgba(252, 246, 236, 0.96)"
              alignItems="center"
              gap="10px"
              px="10px"
            >
              <SimpleRouteTutorialThumb choice={SIMPLE_METRO_ROUTE_CHOICE} animateSource />
              <SimpleRouteTutorialThumb choice={SIMPLE_STREET_ROUTE_CHOICE} />
            </Flex>

            <Flex
              position="absolute"
              left="20px"
              bottom="24px"
              w="74px"
              h="74px"
              borderRadius="6px"
              overflow="hidden"
              bgColor="#F0E6D5"
              border="2px solid rgba(255,255,255,0.92)"
              boxShadow="0 10px 18px rgba(92,63,38,0.2)"
              animation={`${simpleRouteTutorialDragTile} 2600ms ease-in-out infinite`}
              zIndex={3}
              pointerEvents="none"
            >
              <Image
                src={SIMPLE_METRO_ROUTE_CHOICE.imagePath}
                alt=""
                w="100%"
                h="100%"
                objectFit="cover"
                aria-hidden="true"
              />
            </Flex>
          </Box>

          <Flex
            as="button"
            h="46px"
            borderRadius="999px"
            bgColor="#9B765C"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            boxShadow="0 6px 12px rgba(92,63,38,0.16)"
            onClick={onClose}
          >
            <Text color="#FFFFFF" fontSize="17px" fontWeight="900" lineHeight="1">
              開始安排
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

type WorkLunchTutorialScenario = "success" | "error";

const WORK_LUNCH_TUTORIAL_SCENARIOS: WorkLunchTutorialScenario[] = ["success", "error"];
const WORK_LUNCH_TUTORIAL_ANIMATION_DURATION_MS = 3200;
const WORK_LUNCH_TUTORIAL_ANIMATION_DURATION = `${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION_MS}ms`;

function WorkLunchTutorialPlacedTile({
  imagePath,
  alt,
}: {
  imagePath: string;
  alt: string;
}) {
  return (
    <Flex
      w="96px"
      h="96px"
      borderRadius="4px"
      overflow="hidden"
      bgColor="#F0E6D5"
      border="1px solid #9B8B59"
      boxShadow="0 4px 9px rgba(92,63,38,0.14)"
      flexShrink={0}
    >
      <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" />
    </Flex>
  );
}

function WorkLunchTutorialTrayThumb({
  choice,
  animateSource = false,
}: {
  choice: RouteChoice;
  animateSource?: boolean;
}) {
  return (
    <Flex
      w="78px"
      h="78px"
      borderRadius="6px"
      overflow="hidden"
      bgColor="#F0E6D5"
      border="2px solid rgba(255,255,255,0.92)"
      boxShadow="0 4px 8px rgba(92,63,38,0.1)"
      animation={
        animateSource
          ? `${workLunchTutorialSourceTile} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`
          : undefined
      }
      flexShrink={0}
    >
      <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" />
    </Flex>
  );
}

function WorkLunchTutorialDemo({ scenario }: { scenario: WorkLunchTutorialScenario }) {
  const isSuccess = scenario === "success";
  const activeChoice = isSuccess
    ? WORK_LUNCH_TUTORIAL_ROUTE_CHOICES[0]
    : WORK_LUNCH_TUTORIAL_ROUTE_CHOICES[1];

  return (
    <Box
      position="relative"
      h="360px"
      borderRadius="10px"
      bgColor="#FFF9EF"
      overflow="hidden"
    >
      <Flex
        position="absolute"
        left="50%"
        top="24px"
        transform="translateX(-50%)"
        direction="column"
        alignItems="center"
        gap="0"
      >
        <Flex
          w="96px"
          h="96px"
          border="2px dashed #D7BDA4"
          borderRadius="4px"
          bgColor="rgba(255,255,255,0.64)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          animation={`${simpleRouteTutorialSlotPulse} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
        >
          <Flex
            key={`placed-${scenario}`}
            animation={`${workLunchTutorialPlacedTile} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
          >
            <WorkLunchTutorialPlacedTile
              imagePath={activeChoice.imagePath}
              alt={isSuccess ? "寬度一致的路徑拼圖" : "寬度不一致的路徑拼圖"}
            />
          </Flex>
        </Flex>
        {!isSuccess ? (
          <Box
            w="96px"
            h="2px"
            bgColor="#FF4938"
            flexShrink={0}
            zIndex={2}
            animation={`${workLunchTutorialErrorSeam} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
          />
        ) : null}
        <WorkLunchTutorialPlacedTile
          imagePath={WORK_LUNCH_TUTORIAL_FIXED_ROUTE_IMAGE_PATH}
          alt="固定路徑拼圖"
        />
      </Flex>

      {isSuccess ? (
        <Box
          position="absolute"
          top="121px"
          right="56px"
          w="28px"
          h="28px"
          border="3px solid #1BD6A2"
          borderRadius="50%"
          animation={`${workLunchTutorialResultMark} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
        />
      ) : null}

      {!isSuccess ? (
        <Text
          position="absolute"
          top="114px"
          right="48px"
          color="#FF4938"
          fontSize="36px"
          fontWeight="400"
          lineHeight="1"
          animation={`${workLunchTutorialResultMark} ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
        >
          ×
        </Text>
      ) : null}

      <Flex
        position="absolute"
        left="14px"
        right="14px"
        bottom="14px"
        h="102px"
        borderRadius="12px"
        bgColor="rgba(244, 237, 222, 0.86)"
        alignItems="center"
        gap="10px"
        px="14px"
        overflow="hidden"
      >
        <WorkLunchTutorialTrayThumb
          choice={WORK_LUNCH_TUTORIAL_ROUTE_CHOICES[0]}
          animateSource={isSuccess}
        />
        <WorkLunchTutorialTrayThumb
          choice={WORK_LUNCH_TUTORIAL_ROUTE_CHOICES[1]}
          animateSource={!isSuccess}
        />
      </Flex>

      <Flex
        position="absolute"
        left={isSuccess ? "34px" : "122px"}
        top="248px"
        w="96px"
        h="96px"
        borderRadius="4px"
        overflow="hidden"
        bgColor="#F0E6D5"
        border="2px solid rgba(255,255,255,0.92)"
        boxShadow="0 10px 18px rgba(92,63,38,0.2)"
        key={`drag-${scenario}`}
        animation={`${
          isSuccess ? workLunchTutorialSuccessDragTile : workLunchTutorialErrorDragTile
        } ${WORK_LUNCH_TUTORIAL_ANIMATION_DURATION} ease-in-out infinite`}
        zIndex={3}
        pointerEvents="none"
      >
        <Image
          src={activeChoice.imagePath}
          alt=""
          w="100%"
          h="100%"
          objectFit="cover"
          aria-hidden="true"
        />
      </Flex>
    </Box>
  );
}

function WorkLunchAnswerHintModal({ onClose }: { onClose: () => void }) {
  const correctChoice =
    WORK_LUNCH_ROUTE_CHOICES.find((choice) => choice.id === WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID) ??
    WORK_LUNCH_ROUTE_CHOICES[WORK_LUNCH_ROUTE_CHOICES.length - 1];

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={83}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        gap="14px"
        px="18px"
        pt="20px"
        pb="20px"
        bgColor="#FFFDF8"
        borderRadius="10px"
        border="1px solid #E5D2B7"
        boxShadow="0 14px 28px rgba(62,45,26,0.18)"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex alignItems="flex-start" justifyContent="space-between" gap="12px">
          <Flex direction="column" gap="5px" minW="0">
            <Text color="#8E6D53" fontSize="18px" fontWeight="900" lineHeight="1.35">
              正確答案
            </Text>
            <Text color="#A98263" fontSize="14px" fontWeight="800" lineHeight="1.45">
              選「{correctChoice.label}」：上方接窄路，下方接寬路。
            </Text>
          </Flex>
          <Flex
            as="button"
            w="32px"
            h="32px"
            borderRadius="999px"
            bgColor="rgba(155,118,92,0.12)"
            color="#8E6D53"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            cursor="pointer"
            onClick={onClose}
            aria-label="關閉正確答案提示"
          >
            <FiX size={18} />
          </Flex>
        </Flex>

        <Flex
          direction="column"
          alignItems="center"
          justifyContent="center"
          gap="0"
          py="14px"
          borderRadius="12px"
          bgColor="#FFF9EF"
          border="1px solid rgba(185,152,115,0.16)"
        >
          <WorkLunchTutorialPlacedTile
            imagePath={WORK_LUNCH_CONVENIENCE_STORE_ROUTE_IMAGE_PATH}
            alt="便利商店拼圖"
          />
          <Box
            position="relative"
            w="96px"
            h="96px"
            boxShadow="0 0 0 4px rgba(44, 197, 154, 0.22)"
            borderRadius="4px"
          >
            <WorkLunchTutorialPlacedTile
              imagePath={correctChoice.imagePath}
              alt={correctChoice.alt}
            />
            <Flex
              position="absolute"
              right="-10px"
              top="-10px"
              w="30px"
              h="30px"
              borderRadius="999px"
              bgColor="#1BD6A2"
              border="3px solid #FFFDF8"
              alignItems="center"
              justifyContent="center"
              color="#FFFFFF"
              fontSize="17px"
              fontWeight="900"
              lineHeight="1"
              boxShadow="0 6px 12px rgba(27,214,162,0.24)"
            >
              O
            </Flex>
          </Box>
          <WorkLunchTutorialPlacedTile
            imagePath={WORK_LUNCH_COMPANY_ROUTE_IMAGE_PATH}
            alt="公司拼圖"
          />
        </Flex>

        <Text color="#8E6D53" fontSize="14px" fontWeight="800" lineHeight="1.55" textAlign="center">
          也就是下方拼圖列最右邊那一塊。
        </Text>

        <Flex
          as="button"
          h="48px"
          borderRadius="999px"
          bgColor="#A47A5C"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          boxShadow="0 6px 12px rgba(92,63,38,0.16)"
          onClick={onClose}
        >
          <Text color="#FFFFFF" fontSize="17px" fontWeight="900" lineHeight="1">
            知道了
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function WorkLunchWidthTutorialModal({ onClose }: { onClose: () => void }) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = WORK_LUNCH_TUTORIAL_SCENARIOS[scenarioIndex];
  const subtitle =
    scenario === "error" ? "寬度不一致，無法連接再一起" : "寬度一致的話可以連在一起";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setScenarioIndex(
        (currentIndex) => (currentIndex + 1) % WORK_LUNCH_TUTORIAL_SCENARIOS.length,
      );
    }, WORK_LUNCH_TUTORIAL_ANIMATION_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={82}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        gap="14px"
        px="18px"
        pt="28px"
        pb="20px"
        bgColor="#FFFDF8"
        borderRadius="10px"
        border="1px solid #E5D2B7"
        boxShadow="0 14px 28px rgba(62,45,26,0.18)"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex
          direction="column"
          alignItems="center"
          justifyContent="center"
          gap="4px"
        >
          <Text color="#8E6D53" fontSize="18px" fontWeight="900" lineHeight="1.35" textAlign="center">
            根據邊緣來銜接路徑
          </Text>
          <Text color="#A98263" fontSize="15px" fontWeight="800" lineHeight="1.35" textAlign="center">
            {subtitle}
          </Text>
        </Flex>

        <WorkLunchTutorialDemo scenario={scenario} />

        <Flex
          as="button"
          h="54px"
          borderRadius="999px"
          bgColor="#A47A5C"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          boxShadow="0 6px 12px rgba(92,63,38,0.16)"
          onClick={onClose}
        >
          <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
            開始安排
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function ReadyRouteStack({
  animateMiddle = false,
  startImagePath = START_HOME_WIDE_IMAGE_PATH,
  middleImagePath = METRO_STRAIGHT_IMAGE_PATH,
  middleAlt = "捷運拼圖",
  endImagePath = END_COMPANY_WIDE_IMAGE_PATH,
}: {
  animateMiddle?: boolean;
  startImagePath?: string;
  middleImagePath?: string;
  middleAlt?: string;
  endImagePath?: string;
}) {
  return (
    <Flex direction="column" alignItems="center" justifyContent="center">
      <RouteTile imagePath={endImagePath} alt="公司" size={118} />
      <Box animation={animateMiddle ? `${tilePop} 420ms ease-out both` : undefined}>
        <RouteTile imagePath={middleImagePath} alt={middleAlt} size={118} />
      </Box>
      <RouteTile imagePath={startImagePath} alt="家" size={118} />
    </Flex>
  );
}

function IntroRouteAnimation({
  step,
  startImagePath = START_HOME_WIDE_IMAGE_PATH,
  endImagePath = END_COMPANY_WIDE_IMAGE_PATH,
}: {
  step: 0 | 1 | 2;
  startImagePath?: string;
  endImagePath?: string;
}) {
  const tileSize = 122;
  const companyTop = step === 0 ? 0 : step === 1 ? 61 : 0;
  const emptyTop = 122;
  const homeTop = step === 0 ? 122 : step === 1 ? 183 : 244;

  return (
    <Box position="relative" w={`${tileSize}px`} h="366px">
      <Box
        position="absolute"
        left="0"
        top={`${companyTop}px`}
        opacity={step >= 1 ? 1 : 0}
        pointerEvents="none"
        transition="top 520ms cubic-bezier(0.33, 1, 0.68, 1), opacity 220ms ease"
        animation={step === 1 ? `${tilePop} 360ms ease-out both` : undefined}
      >
        <RouteTile imagePath={endImagePath} alt="公司" size={tileSize} />
      </Box>
      <Box
        position="absolute"
        left="0"
        top={`${emptyTop}px`}
        opacity={step >= 2 ? 1 : 0}
        transform={step >= 2 ? "scale(1)" : "scale(0.9)"}
        pointerEvents="none"
        transition="opacity 260ms ease, transform 360ms ease"
      >
        <RouteTile alt="空白路線格" size={tileSize} empty />
      </Box>
      <Box
        position="absolute"
        left="0"
        top={`${homeTop}px`}
        transition="top 560ms cubic-bezier(0.33, 1, 0.68, 1)"
      >
        <RouteTile imagePath={startImagePath} alt="家" size={tileSize} />
      </Box>
    </Box>
  );
}

function StoryRouteDepartureTransition({
  progress,
  startPoint = {
    key: "home",
    label: "家",
    iconPath: "/images/icon/house.png",
  },
  middlePoint = {
    key: "metro-station",
    label: "捷運",
    iconPath: "/images/icon/mrt.png",
  },
  endPoint = {
    key: "company",
    label: "公司",
    iconPath: "/images/icon/company.png",
  },
}: {
  progress: number;
  startPoint?: StoryRouteMapPoint;
  middlePoint?: StoryRouteMapPoint | StoryRouteMapPoint[] | null;
  endPoint?: StoryRouteMapPoint;
}) {
  const middlePoints = Array.isArray(middlePoint)
    ? middlePoint
    : middlePoint
      ? [middlePoint]
      : [];
  const routePoints = [startPoint, ...middlePoints, endPoint];
  const mapPoints = routePoints.map((point, index) => {
    const isMiddle = index > 0 && index < routePoints.length - 1;
    return {
      key: point.key,
      label: point.label,
      iconPath: point.iconPath,
      positionPercent: 9 + (82 * index) / Math.max(1, routePoints.length - 1),
      isMiddle,
      progressPoint: index / Math.max(1, routePoints.length - 1),
      isTarget: Boolean(point.isTarget),
    };
  });
  const targetPositionPercent =
    mapPoints.find((point) => point.isTarget)?.positionPercent ??
    (middlePoints.length > 0
      ? mapPoints[mapPoints.length - 2]?.positionPercent ?? 91
      : 91);
  const maiMapLeftPercent = 9 + (targetPositionPercent - 9) * progress;

  return (
    <Flex
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

      <Box position="absolute" left="50%" bottom="172px" transform="translateX(-50%)">
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
        {mapPoints.map((point) => (
          <Box
            key={point.key}
            position="absolute"
            left={`${point.positionPercent}%`}
            top={point.isMiddle ? "23px" : "29px"}
            w={point.isMiddle ? "42px" : "45px"}
            h={point.isMiddle ? "42px" : "45px"}
            transform="translateX(-50%)"
            zIndex={2}
          >
            <Image src={point.iconPath} alt={point.label} w="100%" h="100%" objectFit="contain" />
          </Box>
        ))}
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
            {mapPoints.map((point, index) => (
              <Box
                key={`track-${point.key}`}
                w={
                  index === 0 || index === mapPoints.length - 1 || point.isMiddle ? "11px" : "5px"
                }
                h={
                  index === 0 || index === mapPoints.length - 1 || point.isMiddle ? "11px" : "5px"
                }
                borderRadius="999px"
                bg={progress >= point.progressPoint ? "#FFF0A8" : "#F8E8AF"}
                border={
                  index === 0 || index === mapPoints.length - 1 || point.isMiddle
                    ? "1px solid #B28D69"
                    : "0"
                }
              />
            ))}
          </Flex>
        </Box>
        <Box
          position="absolute"
          left={`${maiMapLeftPercent}%`}
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
  );
}

export function StorySimpleMetroRouteView({
  mode = "simple-metro",
  onProgressSaved,
}: {
  mode?: StoryRouteMode;
  onProgressSaved?: () => void;
}) {
  if (mode === "metro-exit") {
    return <StoryMetroExitRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "work-lunch-convenience") {
    return <StoryWorkLunchConvenienceRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "frog-clue") {
    return <StoryFrogClueArrangeRouteView onProgressSaved={onProgressSaved} />;
  }

  return <StoryMetroArrangeRouteView onProgressSaved={onProgressSaved} />;
}

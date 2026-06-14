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
} from "@/lib/game/playerProgress";
import type { GameEventId } from "@/lib/game/events";
import {
  getFrogDiaryClueStageByAttempt,
  type FrogDiaryClueRouteTileId,
} from "@/lib/game/frogDiaryClueFlow";

export type StoryRouteMode = "simple-metro" | "frog-clue" | "work-lunch-convenience";

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

const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const START_HOME_WIDE_IMAGE_PATH = "/images/route/start_end_new/start_home_wide.jpg";
const END_COMPANY_WIDE_IMAGE_PATH = "/images/route/start_end_new/end_company_wide.jpg";
const START_HOME_NARROW_IMAGE_PATH = "/images/route/start_end_new/start_home_narrow.jpg";
const END_COMPANY_NARROW_IMAGE_PATH = "/images/route/start_end_new/end_company_narror.jpg";
const START_COMPANY_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/route_new/wide_narrow_compnay.png";
const RESTAURANT_WIDE_TO_NARROW_IMAGE_PATH = "/images/route/wide_to_narrow_pizza.png";
const SPECIAL_NORMAL_CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const METRO_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_捷運.png";
const BUS_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_公車.png";
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
const SIMPLE_BUS_ROUTE_CHOICE: RouteChoice = {
  id: "bus-stop",
  label: "公車",
  imagePath: BUS_STRAIGHT_IMAGE_PATH,
  alt: "公車拼圖",
  mapIconPath: "/images/icon/road.png",
  fallbackEventId: "bus-brake-fall",
};
const SIMPLE_ROUTE_CHOICES: RouteChoice[] = [
  SIMPLE_METRO_ROUTE_CHOICE,
  SIMPLE_BUS_ROUTE_CHOICE,
];
const SIMPLE_BUS_DAILY_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "bus-brake-fall",
  "bus-backpack-hit",
];
const FROG_ROUTE_PUZZLE_CHOICES: FrogRoutePuzzleChoice[] = [
  {
    id: "frog-street-wide-to-narrow",
    label: "街道",
    imagePath: STREET_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "街道路線拼圖",
    mapIconPath: "/images/icon/road.png",
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
    mapIconPath: "/images/icon/road.png",
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
    mapIconPath: "/images/icon/road.png",
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
    mapIconPath: "/images/icon/road.png",
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
  type: "metro" | "bus";
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
      <RouteTile imagePath={METRO_STRAIGHT_IMAGE_PATH} alt={isMetro ? "捷運拼圖" : "公車拼圖"} size={104} />
      <Text color="#FFFFFF" fontSize="20px" fontWeight="900" lineHeight="1">
        {isMetro ? "捷運" : "公車"}
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

type StoryRouteMapPoint = {
  key: string;
  label: string;
  iconPath: string;
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
  alreadyPlacedHint?: string;
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
  hideTutorialWhenDiaryOpen?: boolean;
  departureStartPoint?: StoryRouteMapPoint;
  departureEndPoint?: StoryRouteMapPoint;
  getDepartureMiddlePoint?: (
    placedChoices: readonly (TChoice | null)[],
  ) => StoryRouteMapPoint | null | undefined;
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
        setHint(config.alreadyPlacedHint);
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

      <Flex h="50px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          安排行程
        </Text>
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

function StoryFrogRestaurantRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [heldCorner, setHeldCorner] = useState(false);
  const [placedCorners, setPlacedCorners] = useState<(FrogRestaurantPlacedCorner | null)[]>([
    null,
    null,
  ]);
  const [hint, setHint] = useState("重複使用轉彎拼圖，放上去後點擊轉向");
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [rotationCount, setRotationCount] = useState(0);
  const departureFlow = useStoryRouteDepartureFlow<
    readonly (FrogRestaurantPlacedCorner | null)[]
  >({
    onConnectComplete: () => {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    },
    onDepartComplete: () => {
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
      setHint("路線還沒接到餐廳，點擊轉彎拼圖調整方向。");
      return;
    }

    setHint("");
    setHeldCorner(false);
    departureFlow.startDeparture([...placedCorners]);
  }, [departureFlow, placedCorners]);

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
      <Flex h="50px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          安排行程
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
              imagePath={RESTAURANT_WIDE_TO_NARROW_IMAGE_PATH}
              alt="餐廳拼圖"
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
          startPoint={{
            key: "company",
            label: "公司",
            iconPath: "/images/icon/company.png",
          }}
          middlePoint={{
            key: "restaurant",
            label: "餐廳",
            iconPath: "/images/icon/mart.png",
          }}
          endPoint={{
            key: "home",
            label: "家",
            iconPath: "/images/icon/house.png",
          }}
        />
      ) : null}

      {isTutorialOpen && !isRouteConnected ? (
        <FrogRestaurantRouteTutorialModal onClose={() => setIsTutorialOpen(false)} />
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
    return <StoryFrogRestaurantRouteView onProgressSaved={onProgressSaved} />;
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
          const departureChoice = getFrogRoutePuzzleEventChoice(
            placedChoices,
            frogPhotoAttemptCount,
          );
          return departureChoice
            ? {
                key: departureChoice.id,
                label: departureChoice.label,
                iconPath: departureChoice.mapIconPath,
              }
            : null;
        },
        onConnectComplete: () => {
          recordArrangeRouteDeparture();
          onProgressSaved?.();
        },
        onDepartComplete: (placedChoices) => {
          const eventChoice = getFrogRoutePuzzleEventChoice(placedChoices, frogPhotoAttemptCount);
          if (!eventChoice) return;
          const eventId = getFrogRouteEventId(eventChoice, frogPhotoAttemptCount);
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
        selectedHint: (choice) =>
          choice.id === WORK_LUNCH_CORRECT_ROUTE_CHOICE_ID
            ? "寬度一致，可以連在一起。"
            : "寬度不一致，無法連接再一起。",
        alreadyPlacedHint: "這塊已經放上去了。",
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
            return "寬度不一致，無法連接再一起。";
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
            : "已安排公車路線。這不是日記線索，但也可以照常出發。",
        alreadyPlacedHint: "這塊已經放上去了。",
        departureButtonText: "出發！",
        renderBoardHint: true,
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
          const busEventId =
            SIMPLE_BUS_DAILY_EVENT_IDS[Math.floor(Math.random() * SIMPLE_BUS_DAILY_EVENT_IDS.length)] ??
            placedChoice.fallbackEventId;
          router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${busEventId}`));
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
        gap="12px"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex
          minH="66px"
          px="20px"
          py="14px"
          borderRadius="18px"
          bgColor="#FFFDF8"
          border="1px solid #E5D2B7"
          boxShadow="0 10px 24px rgba(62,45,26,0.18)"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            color="#8E6D53"
            fontSize="16px"
            fontWeight="900"
            lineHeight="1.45"
            textAlign="center"
          >
            將下方的拼圖拉到空格裡，安排今天的出行路線。
          </Text>
        </Flex>

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
              <SimpleRouteTutorialThumb choice={SIMPLE_BUS_ROUTE_CHOICE} />
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
  startPoint?: {
    key: string;
    label: string;
    iconPath: string;
  };
  middlePoint?: {
    key: string;
    label: string;
    iconPath: string;
  } | null;
  endPoint?: {
    key: string;
    label: string;
    iconPath: string;
  };
}) {
  const hasMiddlePoint = Boolean(middlePoint);
  const mapPoints = [
    {
      key: startPoint.key,
      label: startPoint.label,
      iconPath: startPoint.iconPath,
      positionPercent: 9,
      isMiddle: false,
    },
    ...(middlePoint
      ? [
          {
            key: middlePoint.key,
            label: middlePoint.label,
            iconPath: middlePoint.iconPath,
            positionPercent: 50,
            isMiddle: true,
          },
        ]
      : []),
    {
      key: endPoint.key,
      label: endPoint.label,
      iconPath: endPoint.iconPath,
      positionPercent: 91,
      isMiddle: false,
    },
  ];
  const targetPositionPercent = hasMiddlePoint ? 50 : 91;
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
            {[0, 0.25, 0.5, 0.75, 1].map((point, index) => (
              <Box
                key={point}
                w={
                  index === 0 || index === 4 || (hasMiddlePoint && index === 2) ? "11px" : "5px"
                }
                h={
                  index === 0 || index === 4 || (hasMiddlePoint && index === 2) ? "11px" : "5px"
                }
                borderRadius="999px"
                bg={progress >= point ? "#FFF0A8" : "#F8E8AF"}
                border={
                  index === 0 || index === 4 || (hasMiddlePoint && index === 2)
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
  if (mode === "work-lunch-convenience") {
    return <StoryWorkLunchConvenienceRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "frog-clue") {
    return <StoryFrogClueArrangeRouteView onProgressSaved={onProgressSaved} />;
  }

  return <StoryMetroArrangeRouteView onProgressSaved={onProgressSaved} />;
}

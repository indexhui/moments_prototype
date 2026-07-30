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
import { ArrangeRouteDialogOverlay } from "@/components/game/ArrangeRouteDialogOverlay";
import {
  StoryRouteDragPreviewLayer,
  StoryRoutePuzzleBoardTile,
  useStoryRoutePointerDrag,
} from "@/components/game/StoryRoutePuzzleKit";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  loadPlayerProgress,
  markKoalaArrangeRouteIntroSeen,
  markWorkLunchForgotBentoEventTriggered,
  recordArrangeRouteDeparture,
  savePlayerProgress,
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
import { StoryDessertShopMechanismRouteView } from "@/components/game/StoryDessertShopMechanismRouteView";
import {
  StoryCatSunbeastRouteView,
  type CatRouteStage,
} from "@/components/game/StoryCatSunbeastRouteView";
import { RaccoonWideNarrowRouteMinigame } from "@/components/game/events/RaccoonWideNarrowRouteMinigame";
import {
  getReachableRouteGridIndices,
  getRouteGridOrthogonalNeighborIndices,
  isRouteGridConnected,
  type RouteGridConnector,
} from "@/lib/game/routeGrid";

export type StoryRouteMode =
  | "simple-metro"
  | "frog-clue"
  | "koala-work"
  | "rooster-clue"
  | "rooster-park"
  | "raccoon-park"
  | "cat-puff-shop"
  | "work-lunch-convenience"
  | "metro-exit";

type StorySimpleRouteStage = "intro" | "choice" | "ready" | "departing";
type RouteChoice = {
  id: string;
  label: string;
  imagePath: string;
  alt: string;
  mapIconPath: string;
  fallbackEventId: GameEventId;
  frogRouteTileId?: FrogDiaryClueRouteTileId;
  routeBadgeLabel?: string;
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
  topEdge: "narrow" | "wide";
  bottomEdge: "narrow" | "wide";
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
const BREAKFAST_NARROW_TO_WIDE_IMAGE_PATH = "/images/route/route_new/narrow_to_wide_早餐店.png";
const BREAKFAST_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_早餐店.png";
const BREAKFAST_WIDE_TO_WIDE_IMAGE_PATH = "/images/route/route_new/wide_to_wide_早餐店.png";
const BREAKFAST_ICON_PATH = "/images/icon/breakfast.png";
const ROUTE_NEW_NARROW_TO_WIDE_IMAGE_PATH = "/images/route/route_new/narrow_to_wide.png";
const ROUTE_NEW_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight.png";
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
const CAT_BUS_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_公車.png";
const CAT_GROCERY_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_超商.png";
const CAT_PUFF_SHOP_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_早餐店.png";
const CAT_ROUTE_STREET_CHOICE: RouteChoice = {
  id: "cat-street",
  label: "街道",
  imagePath: STREET_STRAIGHT_IMAGE_PATH,
  alt: "街道路線拼圖",
  mapIconPath: "/images/icon/street.png",
  fallbackEventId: "street-comfy-breeze",
  routeBadgeLabel: "街道",
};
const CAT_ROUTE_BUS_STOP_CHOICE: RouteChoice = {
  id: "cat-bus-stop",
  label: "公車站",
  imagePath: CAT_BUS_STRAIGHT_IMAGE_PATH,
  alt: "公車站路線拼圖",
  mapIconPath: "/images/icon/road.png",
  fallbackEventId: "bus-sunbeast-cat",
  routeBadgeLabel: "公車站",
};
const CAT_ROUTE_GROCERY_CHOICE: RouteChoice = {
  id: "cat-grocery",
  label: "雜貨店",
  imagePath: CAT_GROCERY_STRAIGHT_IMAGE_PATH,
  alt: "雜貨店路線拼圖",
  mapIconPath: "/images/icon/mart.png",
  fallbackEventId: "convenience-store-hub",
  routeBadgeLabel: "雜貨店",
};
const CAT_ROUTE_ALLEY_CHOICE: RouteChoice = {
  id: "cat-alley",
  label: "小巷子",
  imagePath: STREET_STRAIGHT_IMAGE_PATH,
  alt: "小巷子路線拼圖",
  mapIconPath: "/images/icon/mystery.png",
  fallbackEventId: "street-comfy-breeze",
  routeBadgeLabel: "小巷子",
};
const CAT_ROUTE_BREAKFAST_DECOY_CHOICE: RouteChoice = {
  id: "cat-breakfast-decoy",
  label: "早餐店",
  imagePath: CAT_PUFF_SHOP_STRAIGHT_IMAGE_PATH,
  alt: "早餐店路線拼圖",
  mapIconPath: "/images/icon/breakfast.png",
  fallbackEventId: "breakfast-bus-stop-unlock",
  routeBadgeLabel: "早餐店",
};
const CAT_ROUTE_CHOICES_BY_STAGE: Record<CatRouteStage, readonly RouteChoice[]> = {
  "route-1": [
    CAT_ROUTE_STREET_CHOICE,
    CAT_ROUTE_BUS_STOP_CHOICE,
    CAT_ROUTE_BREAKFAST_DECOY_CHOICE,
  ],
  "route-2": [
    CAT_ROUTE_STREET_CHOICE,
    CAT_ROUTE_GROCERY_CHOICE,
    CAT_ROUTE_BREAKFAST_DECOY_CHOICE,
  ],
  "route-3": [
    CAT_ROUTE_STREET_CHOICE,
    CAT_ROUTE_ALLEY_CHOICE,
    CAT_ROUTE_BREAKFAST_DECOY_CHOICE,
  ],
};
const CAT_ROUTE_REQUIRED_IDS_BY_STAGE: Record<CatRouteStage, readonly [string, string]> = {
  "route-1": [CAT_ROUTE_BUS_STOP_CHOICE.id, CAT_ROUTE_STREET_CHOICE.id],
  "route-2": [CAT_ROUTE_GROCERY_CHOICE.id, CAT_ROUTE_STREET_CHOICE.id],
  "route-3": [CAT_ROUTE_ALLEY_CHOICE.id, CAT_ROUTE_STREET_CHOICE.id],
};
const CAT_ROUTE_START_BY_STAGE: Record<
  CatRouteStage,
  {
    label: string;
    imagePath: string;
    iconPath: string;
  }
> = {
  "route-1": {
    label: "家",
    imagePath: START_HOME_NARROW_IMAGE_PATH,
    iconPath: "/images/icon/house.png",
  },
  "route-2": {
    label: "下車地點",
    imagePath: CAT_BUS_STRAIGHT_IMAGE_PATH,
    iconPath: "/images/icon/road.png",
  },
  "route-3": {
    label: "雜貨店",
    imagePath: CAT_GROCERY_STRAIGHT_IMAGE_PATH,
    iconPath: "/images/icon/mart.png",
  },
};
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
const ROOSTER_ROUTE_PUZZLE_CHOICES: FrogRoutePuzzleChoice[] = [
  {
    id: "rooster-street-wide-to-narrow",
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
    id: "rooster-street-wide-to-wide",
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
    id: "rooster-metro-wide-to-narrow",
    label: "捷運",
    imagePath: METRO_WIDE_TO_NARROW_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
  {
    id: "rooster-metro-wide-to-wide",
    label: "捷運",
    imagePath: METRO_WIDE_TO_WIDE_IMAGE_PATH,
    alt: "捷運路線拼圖",
    mapIconPath: "/images/icon/mrt.png",
    fallbackEventId: "metro-commute-laugh",
    topEdge: "wide",
    bottomEdge: "wide",
  },
  {
    id: "rooster-breakfast-narrow-to-wide",
    label: "早餐店",
    imagePath: BREAKFAST_NARROW_TO_WIDE_IMAGE_PATH,
    alt: "早餐店路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "breakfast-shop-mai-clue",
    frogRouteTileId: "restaurant",
    topEdge: "narrow",
    bottomEdge: "wide",
  },
  {
    id: "rooster-breakfast-straight",
    label: "早餐店",
    imagePath: BREAKFAST_STRAIGHT_IMAGE_PATH,
    alt: "早餐店路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "breakfast-shop-mai-clue",
    frogRouteTileId: "restaurant",
    topEdge: "narrow",
    bottomEdge: "narrow",
  },
  {
    id: "rooster-breakfast-time-narrow-to-wide",
    label: "早餐",
    imagePath: ROUTE_NEW_NARROW_TO_WIDE_IMAGE_PATH,
    alt: "早餐時段路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "breakfast-shop-mai-clue",
    frogRouteTileId: "restaurant",
    routeBadgeLabel: "早餐",
    topEdge: "narrow",
    bottomEdge: "wide",
  },
  {
    id: "rooster-breakfast-time-straight",
    label: "早餐",
    imagePath: ROUTE_NEW_STRAIGHT_IMAGE_PATH,
    alt: "早餐時段路線拼圖",
    mapIconPath: BREAKFAST_ICON_PATH,
    fallbackEventId: "breakfast-shop-mai-clue",
    frogRouteTileId: "restaurant",
    routeBadgeLabel: "早餐",
    topEdge: "narrow",
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
const FROG_RESTAURANT_ROTATION_LIMIT = 3;
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
  if (tile.kind === "location") {
    return {
      top: tile.choice.topEdge === "wide" ? [0, 1, 2] : [1],
      right: [],
      bottom: tile.choice.bottomEdge === "wide" ? [0, 1, 2] : [1],
      left: [],
    };
  }
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
  routeBadgeLabel,
  overlayIconPath,
}: {
  imagePath: string;
  alt: string;
  isConnected?: boolean;
  routeBadgeLabel?: string;
  overlayIconPath?: string;
}) {
  return (
    <Flex
      position="relative"
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
      {overlayIconPath ? (
        <Image
          position="absolute"
          left="50%"
          top="50%"
          src={overlayIconPath}
          alt=""
          aria-hidden="true"
          w="42%"
          h="42%"
          objectFit="contain"
          transform="translate(-50%, -50%)"
          pointerEvents="none"
          draggable={false}
        />
      ) : null}
      {routeBadgeLabel ? (
        <Flex
          position="absolute"
          left="50%"
          top="50%"
          minW="30px"
          h="22px"
          px="5px"
          transform="translate(-50%, -50%)"
          borderRadius="5px"
          bgColor="rgba(143, 143, 143, 0.92)"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 2px 5px rgba(83, 70, 55, 0.14)"
        >
          <Text color="#FFFFFF" fontSize="10px" fontWeight="800" lineHeight="1">
            {routeBadgeLabel}
          </Text>
        </Flex>
      ) : null}
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
  highlightDiary = false,
  tooltipText,
}: {
  buttonSize: "58px" | "72px";
  bottom: string;
  onOpenDiary: () => void;
  onOpenSunbeast: () => void;
  highlightDiary?: boolean;
  tooltipText?: string;
}) {
  const isCompact = buttonSize === "58px";
  return (
    <Flex
      position="absolute"
      right="18px"
      bottom={bottom}
      direction="column"
      gap={isCompact ? "8px" : "10px"}
      zIndex={highlightDiary ? 82 : 2}
    >
      <Box opacity={highlightDiary ? 0.28 : 1} pointerEvents={highlightDiary ? "none" : "auto"}>
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
      </Box>
      <Flex
        position="relative"
        borderRadius="14px"
        boxShadow={
          highlightDiary
            ? "0 0 0 5px rgba(255,255,255,0.96), 0 0 0 10px rgba(255,221,142,0.72), 0 14px 30px rgba(36,24,15,0.34)"
            : "none"
        }
      >
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
        {highlightDiary && tooltipText ? (
          <Flex
            position="absolute"
            right={`calc(${buttonSize} + 16px)`}
            bottom="-2px"
            w="230px"
            minH="76px"
            px="15px"
            py="12px"
            borderRadius="16px"
            bgColor="rgba(255,250,238,0.99)"
            border="2px solid #B98A62"
            boxShadow="0 14px 30px rgba(35,24,15,0.3)"
            alignItems="center"
            pointerEvents="none"
          >
            <Box
              position="absolute"
              right="-8px"
              top="50%"
              w="14px"
              h="14px"
              bgColor="rgba(255,250,238,0.99)"
              borderTop="2px solid #B98A62"
              borderRight="2px solid #B98A62"
              transform="translateY(-50%) rotate(45deg)"
            />
            <Text color="#6C4F3A" fontSize="14px" fontWeight="900" lineHeight="1.55">
              {tooltipText}
            </Text>
          </Flex>
        ) : null}
      </Flex>
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
      <FrogArrangePlacedTile
        imagePath={choice.imagePath}
        alt={choice.alt}
        isConnected={isConnected}
        routeBadgeLabel={choice.routeBadgeLabel}
      />
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
        position="relative"
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
        {choice.routeBadgeLabel ? (
          <Flex
            position="absolute"
            left="50%"
            top="50%"
            minW="28px"
            h="21px"
            px="5px"
            transform="translate(-50%, -50%)"
            borderRadius="5px"
            bgColor="rgba(143, 143, 143, 0.92)"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 2px 5px rgba(83, 70, 55, 0.14)"
          >
            <Text color="#FFFFFF" fontSize="9px" fontWeight="800" lineHeight="1">
              {choice.routeBadgeLabel}
            </Text>
          </Flex>
        ) : null}
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
      <FrogArrangePlacedTile
        imagePath={choice.imagePath}
        alt={choice.alt}
        isConnected={isConnected}
        routeBadgeLabel={choice.routeBadgeLabel}
      />
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
  isTarget?: boolean;
};

type StoryLinearRouteMismatch =
  | { type: "work-lunch"; placement: "top" | "bottom" }
  | { type: "frog"; placement: FrogRouteSeamPlacement };

type StoryLinearRouteTrayVariant = "label-strip" | "square-strip" | "square-grid";

type StoryLinearRouteBoardConfig = {
  templateRows: string;
  stageBackgroundColor?: string;
  stageBackgroundImage?: string;
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
    routeBadgeLabel?: string;
  };
  fixedBottom: {
    imagePath: string;
    alt: string;
    routeBadgeLabel?: string;
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
  journalGuideTooltip?: string;
  renderBoardHint?: boolean;
  renderTutorial?: (onClose: () => void) => ReactNode;
  renderAnswerHint?: (onClose: () => void) => ReactNode;
  overlay?: ReactNode;
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
  const [isJournalGuideOpen, setIsJournalGuideOpen] = useState(false);
  const [isAnswerHintOpen, setIsAnswerHintOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [diaryOverlayMode, setDiaryOverlayMode] = useState<DiaryOverlayMode>("default");
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);

  useEffect(() => {
    setIsJournalGuideOpen(Boolean(config.journalGuideTooltip));
  }, [config.journalGuideTooltip]);

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
  const isJournalGuideActive = Boolean(
    config.journalGuideTooltip &&
      isJournalGuideOpen &&
      !isRouteConnected &&
      !isDiaryOpen,
  );
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

      {isJournalGuideActive ? (
        <Box
          position="absolute"
          inset="0"
          zIndex={80}
          bgColor="rgba(35, 27, 19, 0.58)"
          aria-hidden="true"
        />
      ) : null}

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
        bgColor={config.board.stageBackgroundColor ?? "#FFF4C7"}
        backgroundImage={config.board.stageBackgroundImage ?? "url('/images/road_pattern_ bg.jpg')"}
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
              routeBadgeLabel={config.board.fixedTop.routeBadgeLabel}
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
              routeBadgeLabel={config.board.fixedBottom.routeBadgeLabel}
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
            highlightDiary={isJournalGuideActive}
            tooltipText={isJournalGuideActive ? config.journalGuideTooltip : undefined}
            onOpenDiary={() => {
              setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
              setIsJournalGuideOpen(false);
              setDiaryOverlayMode("default");
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
          progressReview
        />
      ) : null}

      {config.overlay}
    </Flex>
  );
}

export function StoryInfiniteCornerRouteView({
  onProgressSaved,
  headerTitle = "尋找甜點店",
  onBack,
  destinationImagePath = BREAKFAST_WIDE_TO_NARROW_IMAGE_PATH,
  destinationAlt = "甜點店拼圖",
  destinationName = "甜點店",
  destinationOverlayIconPath,
  showTutorial = true,
  rotationLimit = FROG_RESTAURANT_ROTATION_LIMIT,
  stageBackgroundColor = "#FFF4C7",
  stageBackgroundImage = "url('/images/road_pattern_ bg.jpg')",
  showSeparateInstructionBar = false,
  recordMainProgress = true,
  onRouteConnected,
  onDepartComplete,
  departureStartPoint = {
    key: "company",
    label: "公司",
    iconPath: "/images/icon/company.png",
  },
  departureMiddlePoint = {
    key: "dessert-shop",
    label: "甜點店",
    iconPath: BREAKFAST_ICON_PATH,
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
  destinationOverlayIconPath?: string;
  showTutorial?: boolean;
  rotationLimit?: number;
  stageBackgroundColor?: string;
  stageBackgroundImage?: string;
  showSeparateInstructionBar?: boolean;
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
  const remainingRotations = Math.max(0, rotationLimit - rotationCount);

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
      if (rotationCount >= rotationLimit) {
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
      setRotationCount((current) => Math.min(rotationLimit, current + 1));
      setHint("鄰近的轉彎拼圖也跟著轉向了。");
    },
    [isRouteConnected, placedCorners, rotationCount, rotationLimit],
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
        bgColor={stageBackgroundColor}
        backgroundImage={stageBackgroundImage}
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
              overlayIconPath={destinationOverlayIconPath}
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

      {showSeparateInstructionBar ? (
        <Flex
          h="44px"
          flexShrink={0}
          bgColor="#F8E7CC"
          borderTop="1px solid rgba(185,152,115,0.12)"
          alignItems="center"
          justifyContent="center"
          px="14px"
        >
          <Text color="#9B765C" fontSize="13px" fontWeight="900" lineHeight="1.35" textAlign="center">
            {hint}
          </Text>
        </Flex>
      ) : null}

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
        minH={showSeparateInstructionBar ? "116px" : "160px"}
        maxH={showSeparateInstructionBar ? "116px" : "160px"}
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(185,152,115,0.12)"
      >
        {!showSeparateInstructionBar ? (
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
        ) : null}
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
  levelLabel = "level 1",
  locationChoices,
  onBack,
  onDepartComplete,
}: {
  levelLabel?: string;
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
          {levelLabel}
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
  if (targetStage.id === "dessert-shop-birthday-cake" && !hasCompletedStreetForgotLunchFrogEvent) {
    return <StoryDessertShopMechanismRouteView onProgressSaved={onProgressSaved} />;
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
  routePurpose = "frog-clue",
  overlay,
}: {
  onProgressSaved?: () => void;
  initialFrogPhotoAttemptCount: number;
  routePurpose?: "frog-clue" | "koala-work";
  overlay?: ReactNode;
}) {
  const router = useRouter();
  const [frogPhotoAttemptCount, setFrogPhotoAttemptCount] = useState(initialFrogPhotoAttemptCount);
  const isKoalaWorkRoute = routePurpose === "koala-work";
  const activePhotoAttemptCount = isKoalaWorkRoute ? 1 : frogPhotoAttemptCount;
  const routeChoices = getFrogRoutePuzzleChoices(activePhotoAttemptCount);

  useEffect(() => {
    if (isKoalaWorkRoute) return;
    const progress = loadPlayerProgress();
    setFrogPhotoAttemptCount(progress.streetForgotLunchFrogPhotoAttemptCount);
  }, [isKoalaWorkRoute]);

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
        journalGuideTooltip:
          !isKoalaWorkRoute && activePhotoAttemptCount === 1
            ? "不確定去哪裡找小日獸，可以回顧日記"
            : undefined,
        overlay,
        departureStartPoint: isKoalaWorkRoute
          ? {
              key: "home",
              label: "家",
              iconPath: "/images/icon/house.png",
            }
          : {
              key: "company",
              label: "公司",
              iconPath: "/images/icon/company.png",
            },
        departureEndPoint: isKoalaWorkRoute
          ? {
              key: "company",
              label: "公司",
              iconPath: "/images/icon/company.png",
            }
          : {
              key: "home",
              label: "家",
              iconPath: "/images/icon/house.png",
            },
        getDepartureMiddlePoint: (placedChoices) => {
          const eventChoice = isKoalaWorkRoute
            ? null
            : getFrogRoutePuzzleEventChoice(placedChoices, activePhotoAttemptCount);
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
          if (isKoalaWorkRoute) {
            const nextRequestNumber = Math.min(
              3,
              loadPlayerProgress().dependentCoworkerRequestCount + 1,
            );
            router.push(
              withTrialProfileSearch(
                `${ROUTES.gameScene("scene-98-work")}?koalaRequest=${nextRequestNumber}`,
              ),
            );
            return;
          }

          const eventChoice = getFrogRoutePuzzleEventChoice(
            placedChoices,
            activePhotoAttemptCount,
          );
          if (!eventChoice) return;
          const eventId = getFrogRouteEventId(eventChoice, activePhotoAttemptCount);
          const orderedItineraryPoints = placedChoices
            .map((choice) => {
              if (!choice) return null;
              const sourceId = getRouteChoiceDepartureSourceId(choice);
              if (!sourceId) return null;
              return {
                sourceId,
                eventId: getFrogRouteEventId(choice, activePhotoAttemptCount),
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

function StoryKoalaArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const [isIntroDialogueOpen, setIsIntroDialogueOpen] = useState(false);

  useEffect(() => {
    const progress = loadPlayerProgress();
    setIsIntroDialogueOpen(
      !progress.hasSeenKoalaArrangeRouteIntro &&
        progress.dependentCoworkerRequestCount === 0,
    );
  }, []);

  const closeIntroDialogue = () => {
    markKoalaArrangeRouteIntroSeen();
    setIsIntroDialogueOpen(false);
    onProgressSaved?.();
  };

  return (
    <StoryFrogDefaultClueArrangeRouteView
      onProgressSaved={onProgressSaved}
      initialFrogPhotoAttemptCount={1}
      routePurpose="koala-work"
      overlay={
        isIntroDialogueOpen ? (
          <ArrangeRouteDialogOverlay
            speaker="小貝狗"
            text="嗷，日記沒有提到相關的地點，自由發揮吧～"
            avatarSpriteId="beigo"
            avatarFrameIndex={0}
            onContinue={closeIntroDialogue}
          />
        ) : null
      }
    />
  );
}

function StoryRoosterClueArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();

  return (
    <StoryLinearRoutePuzzleStage<FrogRoutePuzzleChoice>
      config={{
        id: "rooster-route",
        choices: ROOSTER_ROUTE_PUZZLE_CHOICES,
        slotCount: 2,
        slotTargetIds: ["rooster-route-slot-0", "rooster-route-slot-1"],
        boardDropTarget: "rooster-route-board",
        removeDropTarget: "rooster-route-remove",
        initialHint: "",
        emptySlotHint: "先選一塊拼圖，或直接拖曳上來。",
        selectedHint: () => "",
        departureButtonText: "出發",
        board: {
          templateRows: "repeat(4, 112px)",
          stageBackgroundColor: "#FFF0C6",
          stageBackgroundImage: "none",
          expandedWidth: "112px",
          connectedWidth: "112px",
          expandedHeight: "448px",
          connectedHeight: "448px",
          expandedGap: "0px",
          connectedGap: "0px",
          tileSize: "112px",
          expandedPadding: "0",
          expandedBackground: "transparent",
          expandedBorder: "0 solid transparent",
          expandedBorderRadius: "0",
          expandedBoxShadow: "none",
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
        departureStartPoint: {
          key: "home",
          label: "家",
          iconPath: "/images/icon/house.png",
        },
        departureEndPoint: {
          key: "company",
          label: "公司",
          iconPath: "/images/icon/company.png",
        },
        getDepartureMiddlePoint: (placedChoices) => {
          const eventChoice =
            placedChoices.find((choice) => choice?.frogRouteTileId === "restaurant") ??
            placedChoices.find(Boolean) ??
            null;
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
          const eventChoice =
            placedChoices.find((choice) => choice?.frogRouteTileId === "restaurant") ??
            placedChoices.find(Boolean) ??
            null;
          if (!eventChoice) return;

          const orderedItineraryPoints = placedChoices
            .map((choice) => {
              if (!choice) return null;
              const sourceId = getRouteChoiceDepartureSourceId(choice);
              if (!sourceId) return null;
              return {
                sourceId,
                eventId:
                  choice.frogRouteTileId === "restaurant"
                    ? ("breakfast-shop-mai-clue" as const)
                    : choice.fallbackEventId,
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

          const eventId =
            eventChoice.frogRouteTileId === "restaurant"
              ? "breakfast-shop-mai-clue"
              : eventChoice.fallbackEventId;
          router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${eventId}`));
        },
      }}
    />
  );
}

function StoryRoosterParkRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();

  return (
    <StoryInfiniteCornerRouteView
      onProgressSaved={onProgressSaved}
      headerTitle="安排行程"
      destinationImagePath="/images/route/route_new/wide_to_narrow.png"
      destinationAlt="公園拼圖"
      destinationName="公園"
      destinationOverlayIconPath="/images/icon/park.png"
      showTutorial={false}
      rotationLimit={4}
      stageBackgroundColor="#FFF0C6"
      stageBackgroundImage="none"
      showSeparateInstructionBar
      departureStartPoint={{
        key: "home",
        label: "家",
        iconPath: "/images/icon/house.png",
      }}
      departureMiddlePoint={null}
      departureEndPoint={{
        key: "park",
        label: "公園",
        iconPath: "/images/icon/park.png",
        isTarget: true,
      }}
      onDepartComplete={() => {
        const progress = loadPlayerProgress();
        savePlayerProgress({
          ...progress,
          hasUnlockedSpecialMap: false,
          hasAvailableSpecialMapPuzzle: false,
        });
        onProgressSaved?.();
        router.push(
          withTrialProfileSearch(
            `${ROUTES.gameArrangeRoute}?eventId=office-sunbeast-chicken`,
          ),
        );
      }}
    />
  );
}

type RaccoonRouteShuffleTileId =
  | "narrow-to-wide-street"
  | "wide-to-wide-street"
  | "wide-to-narrow-street";

type RaccoonRouteShuffleTile = {
  id: RaccoonRouteShuffleTileId;
  imagePath: string;
  alt: string;
  topEdge: RouteEdgeWidth;
  bottomEdge: RouteEdgeWidth;
};

const RACCOON_ROUTE_SHUFFLE_SWAP_LIMIT = 2;
const RACCOON_ROUTE_SHUFFLE_INITIAL_ORDER: RaccoonRouteShuffleTileId[] = [
  "wide-to-wide-street",
  "wide-to-narrow-street",
  "narrow-to-wide-street",
];
const RACCOON_ROUTE_SHUFFLE_TILES: Record<
  RaccoonRouteShuffleTileId,
  RaccoonRouteShuffleTile
> = {
  "narrow-to-wide-street": {
    id: "narrow-to-wide-street",
    imagePath: "/images/route/route_new/narrow_to_wide_街道.png",
    alt: "由窄路變寬路的街道路線",
    topEdge: "narrow",
    bottomEdge: "wide",
  },
  "wide-to-wide-street": {
    id: "wide-to-wide-street",
    imagePath: "/images/route/route_new/wide_to_wide_街道.png",
    alt: "前後都是寬路的街道路線",
    topEdge: "wide",
    bottomEdge: "wide",
  },
  "wide-to-narrow-street": {
    id: "wide-to-narrow-street",
    imagePath: "/images/route/route_new/wide_to_narrow_街道.png",
    alt: "由寬路變窄路的街道路線",
    topEdge: "wide",
    bottomEdge: "narrow",
  },
};

function getRaccoonRouteShuffleMismatchBoundaries(
  order: readonly RaccoonRouteShuffleTileId[],
) {
  const tiles = order.map((tileId) => RACCOON_ROUTE_SHUFFLE_TILES[tileId]);
  if (tiles.length !== 3) return [true, true, true, true];

  return [
    tiles[0].topEdge !== "narrow",
    tiles[0].bottomEdge !== tiles[1].topEdge,
    tiles[1].bottomEdge !== tiles[2].topEdge,
    tiles[2].bottomEdge !== "narrow",
  ];
}

function isRaccoonRouteShuffleSolved(order: readonly RaccoonRouteShuffleTileId[]) {
  return getRaccoonRouteShuffleMismatchBoundaries(order).every(
    (hasMismatch) => !hasMismatch,
  );
}

function RaccoonRouteShuffleMismatchSeam({
  boundaryIndex,
}: {
  boundaryIndex: number;
}) {
  return (
    <Box
      position="absolute"
      left="50%"
      top={`${12 + boundaryIndex * 102 - 3}px`}
      w="96px"
      h="6px"
      transform="translateX(-50%)"
      borderRadius="999px"
      bgColor="#FF5548"
      animation={`${workLunchMismatchEdgePulse} 780ms ease-in-out infinite`}
      boxShadow="0 0 0 2px rgba(255,255,255,0.7)"
      pointerEvents="none"
      zIndex={8}
    />
  );
}

function StoryRaccoonParkRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [tileOrder, setTileOrder] = useState<RaccoonRouteShuffleTileId[]>([
    ...RACCOON_ROUTE_SHUFFLE_INITIAL_ORDER,
  ]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [swapCount, setSwapCount] = useState(0);
  const [showMismatchSeams, setShowMismatchSeams] = useState(false);
  const [hint, setHint] = useState(
    "點選兩張路線交換位置，在2次內把家接到公園",
  );
  const departureFlow = useStoryRouteDepartureFlow<
    readonly RaccoonRouteShuffleTileId[]
  >({
    onConnectComplete: () => {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    },
    onDepartComplete: () => {
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-raccoon-park-arrival")));
    },
  });

  const isRouteConnected = departureFlow.isRouteLocked;
  const routeCanDepart = isRaccoonRouteShuffleSolved(tileOrder);
  const remainingSwaps = Math.max(
    0,
    RACCOON_ROUTE_SHUFFLE_SWAP_LIMIT - swapCount,
  );
  const mismatchBoundaries = getRaccoonRouteShuffleMismatchBoundaries(tileOrder);

  const selectTile = (index: number) => {
    if (isRouteConnected) return;
    if (routeCanDepart) {
      setSelectedIndex(null);
      setHint("路線已經接通，可以帶著漢堡出發了！");
      return;
    }
    if (swapCount >= RACCOON_ROUTE_SHUFFLE_SWAP_LIMIT) {
      setSelectedIndex(null);
      setShowMismatchSeams(true);
      setHint("交換次數用完了，按重來重新整理路線。");
      return;
    }
    if (selectedIndex === null) {
      setSelectedIndex(index);
      setHint("再選一張路線，兩張就會交換位置。");
      return;
    }
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setHint("已取消選取，重新選兩張路線交換。");
      return;
    }

    const nextOrder = [...tileOrder];
    [nextOrder[selectedIndex], nextOrder[index]] = [
      nextOrder[index],
      nextOrder[selectedIndex],
    ];
    const nextSwapCount = swapCount + 1;
    const nextIsSolved = isRaccoonRouteShuffleSolved(nextOrder);

    setTileOrder(nextOrder);
    setSelectedIndex(null);
    setSwapCount(nextSwapCount);
    setShowMismatchSeams(!nextIsSolved);
    if (nextIsSolved) {
      setHint("路線接通了！漢堡還是熱的，現在可以出發。");
      return;
    }
    if (nextSwapCount >= RACCOON_ROUTE_SHUFFLE_SWAP_LIMIT) {
      setHint("交換次數用完了，紅色位置還沒接好。");
      return;
    }
    setHint("還有接縫沒對齊，再交換一次看看。");
  };

  const resetPuzzle = () => {
    setTileOrder([...RACCOON_ROUTE_SHUFFLE_INITIAL_ORDER]);
    setSelectedIndex(null);
    setSwapCount(0);
    setShowMismatchSeams(false);
    setHint("點選兩張路線交換位置，在2次內把家接到公園");
  };

  const startDeparture = () => {
    if (!routeCanDepart) {
      setSelectedIndex(null);
      setShowMismatchSeams(true);
      setHint(
        remainingSwaps > 0
          ? "紅色接縫還沒對齊，先交換路線再出發。"
          : "交換次數用完了，按重來重新整理路線。",
      );
      return;
    }

    setHint("");
    setSelectedIndex(null);
    departureFlow.startDeparture([...tileOrder]);
  };

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
      <Flex
        h="50px"
        flexShrink={0}
        bgColor="#9B765C"
        alignItems="center"
        px="18px"
      >
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          浣熊篇・路線洗牌
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF0C6"
        px="12px"
        py="12px"
      >
        <Grid
          position="relative"
          templateColumns="96px"
          templateRows="repeat(5, 96px)"
          gap={isRouteConnected ? "0px" : "6px"}
          w={isRouteConnected ? "96px" : "120px"}
          h={isRouteConnected ? "480px" : "528px"}
          p={isRouteConnected ? "0" : "12px"}
          bgColor={isRouteConnected ? "transparent" : "rgba(255,255,255,0.62)"}
          borderRadius={isRouteConnected ? "0" : "18px"}
          transition="width 420ms ease, height 420ms ease, padding 420ms ease, gap 420ms ease, border-radius 420ms ease, background-color 420ms ease"
        >
          <FrogArrangeBoardTile size="96px" isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath="/images/route/route_new/wide_to_narrow_街道.png"
              alt="公園入口拼圖"
              overlayIconPath="/images/icon/park.png"
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>

          {tileOrder.map((tileId, index) => {
            const tile = RACCOON_ROUTE_SHUFFLE_TILES[tileId];
            const isSelected = selectedIndex === index;
            return (
              <FrogArrangeBoardTile
                key={tile.id}
                size="96px"
                isActive={isSelected}
                isConnected={isRouteConnected}
                cursor={isRouteConnected ? "default" : "pointer"}
                ariaLabel={
                  isSelected
                    ? `已選取第${index + 1}格，${tile.alt}`
                    : `選取第${index + 1}格，${tile.alt}`
                }
                onClick={() => selectTile(index)}
              >
                <FrogArrangePlacedTile
                  imagePath={tile.imagePath}
                  alt={tile.alt}
                  isConnected={isRouteConnected}
                />
                {isSelected ? (
                  <Flex
                    position="absolute"
                    right="5px"
                    top="5px"
                    minW="32px"
                    h="20px"
                    px="5px"
                    borderRadius="999px"
                    bgColor="#53C5D5"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={5}
                  >
                    <Text color="#FFFFFF" fontSize="10px" fontWeight="900" lineHeight="1">
                      已選
                    </Text>
                  </Flex>
                ) : null}
              </FrogArrangeBoardTile>
            );
          })}

          <FrogArrangeBoardTile size="96px" isConnected={isRouteConnected}>
            <FrogArrangePlacedTile
              imagePath={START_HOME_NARROW_IMAGE_PATH}
              alt="家的拼圖"
              isConnected={isRouteConnected}
            />
          </FrogArrangeBoardTile>

          {showMismatchSeams && !isRouteConnected
            ? mismatchBoundaries.map((hasMismatch, index) =>
                hasMismatch ? (
                  <RaccoonRouteShuffleMismatchSeam
                    key={`raccoon-route-mismatch-${index}`}
                    boundaryIndex={index + 1}
                  />
                ) : null,
              )
            : null}
        </Grid>
      </Flex>

      <Flex
        minH="50px"
        flexShrink={0}
        bgColor="#F8E7CC"
        borderTop="1px solid rgba(185,152,115,0.12)"
        alignItems="center"
        justifyContent="center"
        px="14px"
      >
        <Text
          color="#9B765C"
          fontSize="13px"
          fontWeight="900"
          lineHeight="1.35"
          textAlign="center"
        >
          {hint}
        </Text>
      </Flex>

      <Flex
        h="56px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        px="18px"
        gap="12px"
      >
        <Text color="#FFFFFF" fontSize="15px" fontWeight="900" lineHeight="1">
          剩餘交換次數：{remainingSwaps}次
        </Text>
        <Flex
          as="button"
          h="34px"
          minW="76px"
          ml="auto"
          borderRadius="999px"
          bgColor="#FFFFFF"
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
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent="flex-end"
        px="18px"
        py="8px"
        borderTop="1px solid rgba(255,255,255,0.18)"
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
            key: "home",
            label: "家",
            iconPath: "/images/icon/house.png",
          }}
          middlePoint={null}
          endPoint={{
            key: "park",
            label: "公園",
            iconPath: "/images/icon/park.png",
            isTarget: true,
          }}
        />
      ) : null}
    </Flex>
  );
}

type RaccoonSprintPosition = {
  row: number;
  col: number;
};

type RaccoonSprintCommandKind = "right-2" | "up-2" | "jump-up-2";

type RaccoonSprintCommand = {
  id: "right-a" | "right-b" | "up" | "jump-up";
  kind: RaccoonSprintCommandKind;
  label: string;
  shortLabel: string;
  color: string;
};

type RaccoonSprintSimulation = {
  positions: RaccoonSprintPosition[];
  success: boolean;
  failureStepIndex: number | null;
  failureReason: string | null;
};

const RACCOON_SPRINT_BOARD_SIZE = 5;
const RACCOON_SPRINT_TILE_SIZE = 54;
const RACCOON_SPRINT_TILE_GAP = 4;
const RACCOON_SPRINT_BOARD_PADDING = 6;
const RACCOON_SPRINT_STEP_DURATION_MS = 560;
const RACCOON_SPRINT_START: RaccoonSprintPosition = { row: 4, col: 0 };
const RACCOON_SPRINT_GOAL: RaccoonSprintPosition = { row: 0, col: 4 };
const RACCOON_SPRINT_OBSTACLE_KEYS = new Set(["1-2", "2-1", "2-3"]);
const RACCOON_SPRINT_ROAD_KEYS = new Set([
  "4-0",
  "4-1",
  "4-2",
  "3-2",
  "2-2",
  "0-2",
  "0-3",
  "0-4",
  "2-0",
  "2-4",
]);
const RACCOON_SPRINT_COMMANDS: RaccoonSprintCommand[] = [
  {
    id: "up",
    kind: "up-2",
    label: "上移 2 格",
    shortLabel: "↑ 2",
    color: "#7FA18B",
  },
  {
    id: "right-a",
    kind: "right-2",
    label: "右移 2 格",
    shortLabel: "→ 2",
    color: "#B78A68",
  },
  {
    id: "jump-up",
    kind: "jump-up-2",
    label: "跳過上方障礙",
    shortLabel: "跳 ↑",
    color: "#D59B4A",
  },
  {
    id: "right-b",
    kind: "right-2",
    label: "右移 2 格",
    shortLabel: "→ 2",
    color: "#B78A68",
  },
];

const raccoonSprintRunnerBounce = keyframes`
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -62%) scale(1.06); }
`;

const raccoonSprintRunnerJump = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); }
  42% { transform: translate(-50%, -95%) scale(1.12); }
  100% { transform: translate(-50%, -50%) scale(1); }
`;

function getRaccoonSprintKey(position: RaccoonSprintPosition) {
  return `${position.row}-${position.col}`;
}

function isRaccoonSprintInsideBoard(position: RaccoonSprintPosition) {
  return (
    position.row >= 0 &&
    position.row < RACCOON_SPRINT_BOARD_SIZE &&
    position.col >= 0 &&
    position.col < RACCOON_SPRINT_BOARD_SIZE
  );
}

function isRaccoonSprintObstacle(position: RaccoonSprintPosition) {
  return RACCOON_SPRINT_OBSTACLE_KEYS.has(getRaccoonSprintKey(position));
}

function simulateRaccoonSprint(
  plan: readonly RaccoonSprintCommand[],
): RaccoonSprintSimulation {
  let current = { ...RACCOON_SPRINT_START };
  const positions: RaccoonSprintPosition[] = [];

  for (let index = 0; index < plan.length; index += 1) {
    const command = plan[index];

    if (command.kind === "jump-up-2") {
      const obstaclePosition = { row: current.row - 1, col: current.col };
      const landingPosition = { row: current.row - 2, col: current.col };
      if (
        !isRaccoonSprintInsideBoard(landingPosition) ||
        !isRaccoonSprintObstacle(obstaclePosition) ||
        isRaccoonSprintObstacle(landingPosition)
      ) {
        return {
          positions,
          success: false,
          failureStepIndex: index,
          failureReason: "跳躍前方沒有可跨越的施工障礙。",
        };
      }
      current = landingPosition;
      positions.push({ ...current });
      continue;
    }

    const direction =
      command.kind === "right-2"
        ? { dr: 0, dc: 1 }
        : { dr: -1, dc: 0 };
    let next = { ...current };
    for (let distance = 0; distance < 2; distance += 1) {
      next = {
        row: next.row + direction.dr,
        col: next.col + direction.dc,
      };
      if (!isRaccoonSprintInsideBoard(next)) {
        return {
          positions,
          success: false,
          failureStepIndex: index,
          failureReason: "路線衝出地圖了。",
        };
      }
      if (isRaccoonSprintObstacle(next)) {
        return {
          positions,
          success: false,
          failureStepIndex: index,
          failureReason: "撞上施工障礙了。",
        };
      }
    }
    current = next;
    positions.push({ ...current });
  }

  const success =
    current.row === RACCOON_SPRINT_GOAL.row &&
    current.col === RACCOON_SPRINT_GOAL.col;
  return {
    positions,
    success,
    failureStepIndex: success ? null : Math.max(0, plan.length - 1),
    failureReason: success ? null : "指令執行完了，但還沒抵達公園。",
  };
}

function RaccoonSprintCommandTile({
  command,
  active = false,
  compact = false,
}: {
  command: RaccoonSprintCommand;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <Flex
      w="100%"
      h="100%"
      position="relative"
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="4px"
      borderRadius="10px"
      bgColor={command.color}
      border={active ? "3px solid #FFF4A8" : "2px solid rgba(255,255,255,0.72)"}
      boxShadow={
        active
          ? "0 0 0 2px rgba(181,132,69,0.54), 0 6px 14px rgba(91,65,40,0.2)"
          : "0 4px 9px rgba(91,65,40,0.16)"
      }
      overflow="hidden"
    >
      <Text
        color="#FFFFFF"
        fontSize={compact ? "17px" : "20px"}
        fontWeight="900"
        lineHeight="1"
      >
        {command.shortLabel}
      </Text>
      {!compact ? (
        <Text
          color="rgba(255,255,255,0.92)"
          fontSize="9px"
          fontWeight="800"
          lineHeight="1"
          whiteSpace="nowrap"
        >
          {command.kind === "jump-up-2" ? "跨越障礙" : "直行"}
        </Text>
      ) : null}
    </Flex>
  );
}

function StoryRaccoonSprintRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<RaccoonSprintCommand[]>([]);
  const [runnerPosition, setRunnerPosition] =
    useState<RaccoonSprintPosition>(RACCOON_SPRINT_START);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [isRunnerJumping, setIsRunnerJumping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hint, setHint] = useState(
    "把4張行動拼圖排好；按下後會一口氣執行，中途不能修改",
  );
  const runTimerRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const departureFlow = useStoryRouteDepartureFlow<
    readonly RaccoonSprintCommand[]
  >({
    onConnectComplete: () => {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    },
    onDepartComplete: () => {
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-raccoon-park-arrival")));
    },
  });

  useEffect(
    () => () => {
      runTimerRefs.current.forEach((timer) => clearTimeout(timer));
      runTimerRefs.current = [];
    },
    [],
  );

  const isLocked = isRunning || departureFlow.isRouteLocked;
  const availableCommands = RACCOON_SPRINT_COMMANDS.filter(
    (command) => !plan.some((plannedCommand) => plannedCommand.id === command.id),
  );

  const addCommand = (command: RaccoonSprintCommand) => {
    if (isLocked) return;
    if (plan.length >= RACCOON_SPRINT_COMMANDS.length) {
      setHint("執行列已排滿；點上方拼圖可以取回再調整。");
      return;
    }
    const nextPlan = [...plan, command];
    setPlan(nextPlan);
    setHint(
      nextPlan.length === RACCOON_SPRINT_COMMANDS.length
        ? "順序排好了，按「一口氣前進」看看能不能越過障礙。"
        : `已排入第${nextPlan.length}步，繼續選擇下一張行動拼圖。`,
    );
  };

  const removeCommand = (index: number) => {
    if (isLocked) return;
    setPlan((current) => current.filter((_, commandIndex) => commandIndex !== index));
    setRunnerPosition(RACCOON_SPRINT_START);
    setActiveCommandIndex(null);
    setIsRunnerJumping(false);
    setHint("已取回行動拼圖，重新安排執行順序。");
  };

  const resetPlan = () => {
    if (isLocked) return;
    runTimerRefs.current.forEach((timer) => clearTimeout(timer));
    runTimerRefs.current = [];
    setPlan([]);
    setRunnerPosition(RACCOON_SPRINT_START);
    setActiveCommandIndex(null);
    setIsRunnerJumping(false);
    setIsRunning(false);
    setHint("把4張行動拼圖排好；按下後會一口氣執行，中途不能修改");
  };

  const runPlan = () => {
    if (isLocked) return;
    if (plan.length !== RACCOON_SPRINT_COMMANDS.length) {
      setHint(`還缺${RACCOON_SPRINT_COMMANDS.length - plan.length}張行動拼圖。`);
      return;
    }

    runTimerRefs.current.forEach((timer) => clearTimeout(timer));
    runTimerRefs.current = [];
    const simulation = simulateRaccoonSprint(plan);
    setRunnerPosition(RACCOON_SPRINT_START);
    setActiveCommandIndex(null);
    setIsRunnerJumping(false);
    setIsRunning(true);
    setHint("路線開始執行——中途不能改指令！");

    simulation.positions.forEach((position, index) => {
      const timer = setTimeout(() => {
        setActiveCommandIndex(index);
        setIsRunnerJumping(plan[index]?.kind === "jump-up-2");
        setRunnerPosition(position);
      }, 160 + index * RACCOON_SPRINT_STEP_DURATION_MS);
      runTimerRefs.current.push(timer);
    });

    const finishTimer = setTimeout(
      () => {
        setIsRunnerJumping(false);
        if (simulation.success) {
          setActiveCommandIndex(null);
          setHint("成功！跨過施工障礙，一口氣抵達公園！");
          const departTimer = setTimeout(() => {
            departureFlow.startDeparture([...plan]);
          }, 520);
          runTimerRefs.current.push(departTimer);
          return;
        }

        setActiveCommandIndex(simulation.failureStepIndex);
        setIsRunning(false);
        setHint(
          `${simulation.failureReason ?? "路線失敗。"} 調整第${
            (simulation.failureStepIndex ?? 0) + 1
          }步附近的指令。`,
        );
      },
      240 +
        Math.max(1, simulation.positions.length) *
          RACCOON_SPRINT_STEP_DURATION_MS,
    );
    runTimerRefs.current.push(finishTimer);
  };

  const runnerLeft =
    RACCOON_SPRINT_BOARD_PADDING +
    runnerPosition.col *
      (RACCOON_SPRINT_TILE_SIZE + RACCOON_SPRINT_TILE_GAP) +
    RACCOON_SPRINT_TILE_SIZE / 2;
  const runnerTop =
    RACCOON_SPRINT_BOARD_PADDING +
    runnerPosition.row *
      (RACCOON_SPRINT_TILE_SIZE + RACCOON_SPRINT_TILE_GAP) +
    RACCOON_SPRINT_TILE_SIZE / 2;

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
      <Flex
        h="50px"
        flexShrink={0}
        bgColor="#9B765C"
        alignItems="center"
        px="18px"
      >
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          浣熊篇・漢堡衝刺
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF0C6"
        px="12px"
        py="10px"
      >
        <Box
          position="relative"
          w="298px"
          h="298px"
          p={`${RACCOON_SPRINT_BOARD_PADDING}px`}
          borderRadius="18px"
          bgColor="rgba(255,255,255,0.62)"
          boxShadow="inset 0 0 0 1px rgba(157,118,92,0.1)"
        >
          <Grid
            templateColumns={`repeat(${RACCOON_SPRINT_BOARD_SIZE}, ${RACCOON_SPRINT_TILE_SIZE}px)`}
            templateRows={`repeat(${RACCOON_SPRINT_BOARD_SIZE}, ${RACCOON_SPRINT_TILE_SIZE}px)`}
            gap={`${RACCOON_SPRINT_TILE_GAP}px`}
          >
            {Array.from({ length: RACCOON_SPRINT_BOARD_SIZE ** 2 }, (_, index) => {
              const row = Math.floor(index / RACCOON_SPRINT_BOARD_SIZE);
              const col = index % RACCOON_SPRINT_BOARD_SIZE;
              const position = { row, col };
              const key = getRaccoonSprintKey(position);
              const isObstacle = RACCOON_SPRINT_OBSTACLE_KEYS.has(key);
              const isRoad = RACCOON_SPRINT_ROAD_KEYS.has(key);
              const isStart =
                row === RACCOON_SPRINT_START.row &&
                col === RACCOON_SPRINT_START.col;
              const isGoal =
                row === RACCOON_SPRINT_GOAL.row &&
                col === RACCOON_SPRINT_GOAL.col;
              const isHorizontalRoad = row === 0 || row === 4;

              return (
                <Flex
                  key={`raccoon-sprint-cell-${key}`}
                  position="relative"
                  w={`${RACCOON_SPRINT_TILE_SIZE}px`}
                  h={`${RACCOON_SPRINT_TILE_SIZE}px`}
                  borderRadius="8px"
                  overflow="hidden"
                  bgColor={isObstacle ? "#D9B783" : "#BED99A"}
                  border="1px solid rgba(126,103,72,0.2)"
                  alignItems="center"
                  justifyContent="center"
                >
                  {isStart ? (
                    <Image
                      src={START_HOME_NARROW_IMAGE_PATH}
                      alt="家"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  ) : isGoal ? (
                    <>
                      <Image
                        src="/images/route/route_new/straight_街道.png"
                        alt="公園前的街道"
                        w="100%"
                        h="100%"
                        objectFit="cover"
                        transform="rotate(90deg) scale(1.03)"
                      />
                      <Image
                        position="absolute"
                        inset="12px"
                        src="/images/icon/park.png"
                        alt="公園"
                        w="30px"
                        h="30px"
                        objectFit="contain"
                      />
                    </>
                  ) : isObstacle ? (
                    <Flex
                      position="absolute"
                      inset="0"
                      bgImage="repeating-linear-gradient(135deg, rgba(130,91,54,0.16) 0 7px, rgba(255,244,204,0.62) 7px 14px)"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text
                        color="#8D6040"
                        fontSize="11px"
                        fontWeight="900"
                        lineHeight="1"
                        transform="rotate(-8deg)"
                      >
                        施工
                      </Text>
                    </Flex>
                  ) : isRoad ? (
                    <Image
                      src="/images/route/route_new/straight_街道.png"
                      alt=""
                      aria-hidden="true"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      transform={isHorizontalRoad ? "rotate(90deg) scale(1.03)" : undefined}
                    />
                  ) : (
                    <Box
                      w="7px"
                      h="7px"
                      borderRadius="999px"
                      bgColor="rgba(126,157,90,0.34)"
                    />
                  )}
                </Flex>
              );
            })}
          </Grid>

          <Box
            position="absolute"
            left={`${runnerLeft}px`}
            top={`${runnerTop}px`}
            w="38px"
            h="38px"
            transform="translate(-50%, -50%)"
            transition={`left ${RACCOON_SPRINT_STEP_DURATION_MS - 110}ms ease-in-out, top ${
              RACCOON_SPRINT_STEP_DURATION_MS - 110
            }ms ease-in-out`}
            zIndex={12}
          >
            <Image
              src="/images/icon/icon_mai.png"
              alt="小麥目前位置"
              w="100%"
              h="100%"
              objectFit="contain"
              filter="drop-shadow(0 2px 2px rgba(91,58,34,0.34))"
              animation={
                isRunnerJumping
                  ? `${raccoonSprintRunnerJump} ${RACCOON_SPRINT_STEP_DURATION_MS - 80}ms ease both`
                  : isRunning
                    ? `${raccoonSprintRunnerBounce} 420ms ease-in-out infinite`
                    : undefined
              }
            />
          </Box>
        </Box>
      </Flex>

      <Flex
        minH="48px"
        flexShrink={0}
        bgColor="#F8E7CC"
        borderTop="1px solid rgba(185,152,115,0.12)"
        alignItems="center"
        justifyContent="center"
        px="14px"
      >
        <Text
          color="#9B765C"
          fontSize="12px"
          fontWeight="900"
          lineHeight="1.35"
          textAlign="center"
        >
          {hint}
        </Text>
      </Flex>

      <Flex
        minH="170px"
        flexShrink={0}
        direction="column"
        bgColor="#FDF6EA"
        borderTop="1px solid rgba(185,152,115,0.12)"
        px="14px"
        py="10px"
        gap="8px"
      >
        <Text color="#8F6C51" fontSize="12px" fontWeight="900" lineHeight="1">
          一口氣執行順序
        </Text>
        <Grid templateColumns="repeat(4, 1fr)" gap="6px" h="62px">
          {Array.from({ length: RACCOON_SPRINT_COMMANDS.length }, (_, index) => {
            const command = plan[index];
            return (
              <Flex
                key={`raccoon-sprint-plan-slot-${index}`}
                as={command ? "button" : "div"}
                position="relative"
                borderRadius="10px"
                border={
                  command
                    ? "0"
                    : "2px dashed rgba(163,127,93,0.38)"
                }
                bgColor={command ? "transparent" : "rgba(255,255,255,0.7)"}
                alignItems="center"
                justifyContent="center"
                cursor={command && !isLocked ? "pointer" : "default"}
                onClick={command ? () => removeCommand(index) : undefined}
                aria-label={
                  command
                    ? `移除第${index + 1}步：${command.label}`
                    : undefined
                }
              >
                {command ? (
                  <RaccoonSprintCommandTile
                    command={command}
                    compact
                    active={activeCommandIndex === index}
                  />
                ) : (
                  <Text color="#B69A7E" fontSize="17px" fontWeight="900">
                    {index + 1}
                  </Text>
                )}
              </Flex>
            );
          })}
        </Grid>

        <Flex h="58px" gap="6px" alignItems="stretch">
          {availableCommands.map((command) => (
            <Flex
              key={command.id}
              as="button"
              flex="1"
              minW="0"
              cursor={isLocked ? "default" : "pointer"}
              opacity={isLocked ? 0.54 : 1}
              onClick={() => addCommand(command)}
              aria-label={`加入行動：${command.label}${
                command.id === "right-a"
                  ? " A"
                  : command.id === "right-b"
                    ? " B"
                    : ""
              }`}
            >
              <RaccoonSprintCommandTile command={command} />
            </Flex>
          ))}
          {availableCommands.length === 0 ? (
            <Flex
              flex="1"
              borderRadius="10px"
              border="2px dashed rgba(163,127,93,0.24)"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#B69A7E" fontSize="12px" fontWeight="800">
                拼圖已全部排入
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        px="18px"
        py="8px"
        gap="10px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
      >
        <Flex
          as="button"
          h="40px"
          minW="78px"
          borderRadius="999px"
          bgColor="rgba(255,255,255,0.2)"
          alignItems="center"
          justifyContent="center"
          cursor={isLocked ? "default" : "pointer"}
          opacity={isLocked ? 0.56 : 1}
          onClick={resetPlan}
        >
          <Text color="#FFFFFF" fontSize="14px" fontWeight="900" lineHeight="1">
            清空
          </Text>
        </Flex>
        <Flex
          as="button"
          flex="1"
          h="44px"
          borderRadius="999px"
          bgColor="#FFFFFF"
          color="#986E53"
          fontSize="17px"
          fontWeight="900"
          alignItems="center"
          justifyContent="center"
          cursor={
            plan.length === RACCOON_SPRINT_COMMANDS.length && !isLocked
              ? "pointer"
              : "not-allowed"
          }
          opacity={
            plan.length === RACCOON_SPRINT_COMMANDS.length || isLocked ? 1 : 0.56
          }
          pointerEvents={departureFlow.isRouteLocked ? "none" : "auto"}
          onClick={runPlan}
        >
          一口氣前進
        </Flex>
      </Flex>

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={{
            key: "home",
            label: "家",
            iconPath: "/images/icon/house.png",
          }}
          middlePoint={null}
          endPoint={{
            key: "park",
            label: "公園",
            iconPath: "/images/icon/park.png",
            isTarget: true,
          }}
        />
      ) : null}
    </Flex>
  );
}

type RaccoonOneStrokeCell = {
  col: number;
  row: number;
};

type RaccoonOneStrokeDirection = "up" | "right" | "down" | "left";

const RACCOON_ONE_STROKE_BOARD_SIZE = 5;
const RACCOON_ONE_STROKE_START: RaccoonOneStrokeCell = { col: 0, row: 4 };
const RACCOON_ONE_STROKE_GOAL: RaccoonOneStrokeCell = { col: 4, row: 0 };
const RACCOON_ONE_STROKE_OBSTACLE_KEYS = new Set([
  "2,1",
  "3,1",
]);
const RACCOON_ONE_STROKE_CLUES = [
  { col: 1, row: 2, label: "向上的浣熊腳印", direction: "up" },
  { col: 3, row: 3, label: "向右的浣熊腳印", direction: "right" },
] as const;
const RACCOON_ONE_STROKE_DIRECTION_LABEL: Record<
  RaccoonOneStrokeDirection,
  string
> = {
  up: "上方",
  right: "右方",
  down: "下方",
  left: "左方",
};
const RACCOON_ONE_STROKE_DIRECTION_ROTATION: Record<
  RaccoonOneStrokeDirection,
  number
> = {
  up: -90,
  right: 0,
  down: 90,
  left: 180,
};

const raccoonOneStrokeHintPulse = keyframes`
  0%, 100% {
    box-shadow: inset 0 0 0 3px rgba(255, 235, 133, 0);
  }
  50% {
    box-shadow: inset 0 0 0 3px rgba(255, 235, 133, 0.95), 0 0 14px rgba(235, 179, 64, 0.54);
  }
`;

const raccoonOneStrokeCluePop = keyframes`
  0% { transform: scale(1); }
  45% { transform: scale(1.28) rotate(-8deg); }
  100% { transform: scale(1); }
`;

const raccoonOneStrokeRunnerHop = keyframes`
  0%, 100% { transform: translate(-50%, -50%) translateY(0) scale(1); }
  50% { transform: translate(-50%, -50%) translateY(-7px) scale(1.05); }
`;

function getRaccoonOneStrokeKey(cell: RaccoonOneStrokeCell) {
  return `${cell.col},${cell.row}`;
}

function isRaccoonOneStrokeAdjacent(
  first: RaccoonOneStrokeCell,
  second: RaccoonOneStrokeCell,
) {
  return Math.abs(first.col - second.col) + Math.abs(first.row - second.row) === 1;
}

function getRaccoonOneStrokeDirection(
  from: RaccoonOneStrokeCell,
  to: RaccoonOneStrokeCell,
): RaccoonOneStrokeDirection {
  if (to.row < from.row) return "up";
  if (to.row > from.row) return "down";
  if (to.col < from.col) return "left";
  return "right";
}

function getRaccoonOneStrokeNeighbor(
  cell: RaccoonOneStrokeCell,
  direction: RaccoonOneStrokeDirection,
): RaccoonOneStrokeCell {
  if (direction === "up") return { col: cell.col, row: cell.row - 1 };
  if (direction === "down") return { col: cell.col, row: cell.row + 1 };
  if (direction === "left") return { col: cell.col - 1, row: cell.row };
  return { col: cell.col + 1, row: cell.row };
}

function StoryRaccoonOneStrokeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<RaccoonOneStrokeCell[]>([RACCOON_ONE_STROKE_START]);
  const draggingRef = useRef(false);
  const lastHoverKeyRef = useRef<string | null>(null);
  const runTimerRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [path, setPath] = useState<RaccoonOneStrokeCell[]>([
    RACCOON_ONE_STROKE_START,
  ]);
  const [runnerPathIndex, setRunnerPathIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintKeys, setHintKeys] = useState<string[]>([]);
  const [hint, setHint] = useState(
    "兩組腳印都能接近；先想想哪一組應該先走",
  );
  const departureFlow = useStoryRouteDepartureFlow<
    readonly RaccoonOneStrokeCell[]
  >({
    onConnectComplete: () => {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    },
    onDepartComplete: () => {
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-raccoon-park-arrival")));
    },
  });

  const clearRunTimers = useCallback(() => {
    runTimerRefs.current.forEach((timer) => clearTimeout(timer));
    runTimerRefs.current = [];
  }, []);

  useEffect(
    () => () => {
      clearRunTimers();
      if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current);
    },
    [clearRunTimers],
  );

  const isLocked = isRunning || departureFlow.isRouteLocked;
  const visitedKeys = new Set(path.map(getRaccoonOneStrokeKey));
  const collectedClueKeys = RACCOON_ONE_STROKE_CLUES.filter((clue) =>
    visitedKeys.has(getRaccoonOneStrokeKey(clue)),
  ).map(getRaccoonOneStrokeKey);
  const currentCell = path[path.length - 1] ?? RACCOON_ONE_STROKE_START;
  const isAtGoal =
    getRaccoonOneStrokeKey(currentCell) ===
    getRaccoonOneStrokeKey(RACCOON_ONE_STROKE_GOAL);
  const isRouteReady =
    isAtGoal && collectedClueKeys.length === RACCOON_ONE_STROKE_CLUES.length;

  const visitCell = useCallback(
    (candidate: RaccoonOneStrokeCell) => {
      if (isLocked) return;
      const candidateKey = getRaccoonOneStrokeKey(candidate);
      const currentPath = pathRef.current;
      const current = currentPath[currentPath.length - 1];
      if (!current || candidateKey === getRaccoonOneStrokeKey(current)) return;

      const previous = currentPath[currentPath.length - 2];
      if (previous && candidateKey === getRaccoonOneStrokeKey(previous)) {
        const nextPath = currentPath.slice(0, -1);
        pathRef.current = nextPath;
        setPath(nextPath);
        setRunnerPathIndex(0);
        setHintKeys([]);
        setHint("退回一格了，重新選下一塊道路拼圖。");
        return;
      }

      if (
        getRaccoonOneStrokeKey(current) ===
        getRaccoonOneStrokeKey(RACCOON_ONE_STROKE_GOAL)
      ) {
        setHint("公園必須是最後一格；往回一格才能調整路線。");
        return;
      }

      if (!isRaccoonOneStrokeAdjacent(current, candidate)) {
        setHint("只能接上、下、左、右相鄰的道路拼圖。");
        return;
      }

      const currentDirectionalClue = RACCOON_ONE_STROKE_CLUES.find(
        (clue) => getRaccoonOneStrokeKey(clue) === getRaccoonOneStrokeKey(current),
      );
      if (
        currentDirectionalClue &&
        getRaccoonOneStrokeDirection(current, candidate) !==
          currentDirectionalClue.direction
      ) {
        setHint(
          `腳印指向${RACCOON_ONE_STROKE_DIRECTION_LABEL[currentDirectionalClue.direction]}，下一格只能往這個方向前進。`,
        );
        return;
      }

      if (RACCOON_ONE_STROKE_OBSTACLE_KEYS.has(candidateKey)) {
        setHint("前方有石塊擋路，換一條路繼續找腳印！");
        return;
      }

      if (currentPath.some((cell) => getRaccoonOneStrokeKey(cell) === candidateKey)) {
        setHint("路線交叉了！走過的拼圖不能再次經過。");
        return;
      }

      const directionalClue = RACCOON_ONE_STROKE_CLUES.find(
        (clue) => getRaccoonOneStrokeKey(clue) === candidateKey,
      );
      if (directionalClue) {
        const directedExit = getRaccoonOneStrokeNeighbor(
          candidate,
          directionalClue.direction,
        );
        const directedExitKey = getRaccoonOneStrokeKey(directedExit);
        const exitIsOutsideBoard =
          directedExit.col < 0 ||
          directedExit.row < 0 ||
          directedExit.col >= RACCOON_ONE_STROKE_BOARD_SIZE ||
          directedExit.row >= RACCOON_ONE_STROKE_BOARD_SIZE;
        const exitIsBlocked =
          RACCOON_ONE_STROKE_OBSTACLE_KEYS.has(directedExitKey) ||
          currentPath.some(
            (cell) => getRaccoonOneStrokeKey(cell) === directedExitKey,
          );
        if (exitIsOutsideBoard || exitIsBlocked) {
          setHint(
            "從這側踩上去，箭頭會指向石塊或走過的路；換一側接近這組腳印。",
          );
          return;
        }
      }

      const nextPath = [...currentPath, candidate];
      const nextVisitedKeys = new Set(nextPath.map(getRaccoonOneStrokeKey));
      const nextCollectedClues = RACCOON_ONE_STROKE_CLUES.filter((clue) =>
        nextVisitedKeys.has(getRaccoonOneStrokeKey(clue)),
      ).length;
      pathRef.current = nextPath;
      setPath(nextPath);
      setRunnerPathIndex(0);
      setHintKeys([]);

      if (
        candidateKey === getRaccoonOneStrokeKey(RACCOON_ONE_STROKE_GOAL)
      ) {
        setHint(
          nextCollectedClues === RACCOON_ONE_STROKE_CLUES.length
            ? "路線完成！按「沿路出發」，小麥會一次走完整條路。"
            : `還少${
                RACCOON_ONE_STROKE_CLUES.length - nextCollectedClues
              }組腳印；往回一格，重新繞路。`,
        );
        return;
      }

      const hasUnvisitedExit = [
        { col: candidate.col - 1, row: candidate.row },
        { col: candidate.col + 1, row: candidate.row },
        { col: candidate.col, row: candidate.row - 1 },
        { col: candidate.col, row: candidate.row + 1 },
      ].some((neighbor) => {
        if (
          neighbor.col < 0 ||
          neighbor.row < 0 ||
          neighbor.col >= RACCOON_ONE_STROKE_BOARD_SIZE ||
          neighbor.row >= RACCOON_ONE_STROKE_BOARD_SIZE
        ) {
          return false;
        }
        const neighborKey = getRaccoonOneStrokeKey(neighbor);
        return (
          (!directionalClue ||
            getRaccoonOneStrokeDirection(candidate, neighbor) ===
              directionalClue.direction) &&
          !RACCOON_ONE_STROKE_OBSTACLE_KEYS.has(neighborKey) &&
          !nextVisitedKeys.has(neighborKey)
        );
      });

      if (!hasUnvisitedExit) {
        setHint("走進死路了，沿原路往回拖一格試試。");
      } else if (directionalClue) {
        setHint(
          `找到一組腳印！箭頭指向${
            RACCOON_ONE_STROKE_DIRECTION_LABEL[directionalClue.direction]
          }，下一格往那裡走；還剩${
            RACCOON_ONE_STROKE_CLUES.length - nextCollectedClues
          }組。`,
        );
      } else {
        setHint("道路拼圖接上了，繼續一筆往公園前進。");
      }
    },
    [isLocked],
  );

  const readCellFromElement = useCallback((element: Element | null) => {
    const cellElement = element?.closest<HTMLElement>("[data-raccoon-route-cell]");
    if (!cellElement) return null;
    const col = Number(cellElement.dataset.col);
    const row = Number(cellElement.dataset.row);
    if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
    return { col, row };
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (isLocked) return;
      event.preventDefault();
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const candidate = readCellFromElement(event.target as Element);
      if (candidate) {
        lastHoverKeyRef.current = getRaccoonOneStrokeKey(candidate);
        visitCell(candidate);
      }
    },
    [isLocked, readCellFromElement, visitCell],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || isLocked) return;
      const candidate = readCellFromElement(
        document.elementFromPoint(event.clientX, event.clientY),
      );
      if (!candidate) return;
      const candidateKey = getRaccoonOneStrokeKey(candidate);
      if (candidateKey === lastHoverKeyRef.current) return;
      lastHoverKeyRef.current = candidateKey;
      visitCell(candidate);
    },
    [isLocked, readCellFromElement, visitCell],
  );

  const handlePointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      draggingRef.current = false;
      lastHoverKeyRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const resetRoute = () => {
    if (isLocked) return;
    clearRunTimers();
    pathRef.current = [RACCOON_ONE_STROKE_START];
    setPath([RACCOON_ONE_STROKE_START]);
    setRunnerPathIndex(0);
    setHintKeys([]);
    setHint("兩組腳印都能接近；先想想哪一組應該先走");
  };

  const showRouteHint = () => {
    if (isLocked) return;
    const upwardClue = RACCOON_ONE_STROKE_CLUES.find(
      (clue) => clue.direction === "up",
    );
    const rightwardClue = RACCOON_ONE_STROKE_CLUES.find(
      (clue) => clue.direction === "right",
    );
    const hasUpwardClue =
      upwardClue &&
      collectedClueKeys.includes(getRaccoonOneStrokeKey(upwardClue));
    const hasRightwardClue =
      rightwardClue &&
      collectedClueKeys.includes(getRaccoonOneStrokeKey(rightwardClue));
    setHintKeys([]);

    if (hasUpwardClue && !hasRightwardClue) {
      setHint("向上的腳印會把路線帶到石牆上方；這個順序可能回不到另一組。");
      return;
    }
    if (hasRightwardClue && !hasUpwardClue) {
      setHint("已經留在石牆下方了；現在找一條不重複的路靠近向上腳印。");
      return;
    }
    setHint("別只看距離：先想踩完箭頭後，自己會被帶到石牆的哪一側。");
  };

  const runRoute = () => {
    if (isLocked) return;
    if (!isRouteReady) {
      setHint(
        isAtGoal
          ? "還有浣熊腳印沒找到，先退回去補完路線。"
          : "兩組腳印都要收集；先後順序不對，路線會被石牆切斷。",
      );
      return;
    }

    clearRunTimers();
    setIsRunning(true);
    setRunnerPathIndex(0);
    setHint("路線鎖定！小麥正沿著拼好的道路一口氣前進。");
    path.forEach((_, index) => {
      const timer = setTimeout(() => {
        setRunnerPathIndex(index);
      }, 120 + index * 165);
      runTimerRefs.current.push(timer);
    });
    const finishTimer = setTimeout(
      () => {
        setHint("兩組腳印都找到了，成功抵達公園！");
        const departureTimer = setTimeout(() => {
          departureFlow.startDeparture([...path]);
        }, 420);
        runTimerRefs.current.push(departureTimer);
      },
      260 + path.length * 165,
    );
    runTimerRefs.current.push(finishTimer);
  };

  const runnerCell = path[runnerPathIndex] ?? RACCOON_ONE_STROKE_START;

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
      <Flex
        h="50px"
        flexShrink={0}
        bgColor="#9B765C"
        alignItems="center"
        px="18px"
      >
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          浣熊篇・一筆鋪路
        </Text>
      </Flex>

      <Flex
        minH="55px"
        flexShrink={0}
        alignItems="center"
        justifyContent="space-between"
        bgColor="#F8E7CC"
        px="18px"
        gap="12px"
      >
        <Box>
          <Text color="#785943" fontSize="13px" fontWeight="900">
            判斷腳印順序，再前往公園
          </Text>
          <Text color="#9B765C" fontSize="11px" fontWeight="800">
            先走哪一組？・路線不能重複
          </Text>
        </Box>
        <Flex
          key={collectedClueKeys.length}
          h="31px"
          px="11px"
          gap="5px"
          borderRadius="999px"
          bgColor={
            collectedClueKeys.length === RACCOON_ONE_STROKE_CLUES.length
              ? "#D69548"
              : "rgba(155,118,92,0.16)"
          }
          color={
            collectedClueKeys.length === RACCOON_ONE_STROKE_CLUES.length
              ? "#FFFFFF"
              : "#8F7059"
          }
          alignItems="center"
          justifyContent="center"
          animation={`${raccoonOneStrokeCluePop} 320ms ease`}
        >
          <Text fontSize="13px" lineHeight="1">
            🐾
          </Text>
          <Text fontSize="12px" fontWeight="900">
            {collectedClueKeys.length}/{RACCOON_ONE_STROKE_CLUES.length}
          </Text>
        </Flex>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF0C6"
        px="14px"
        py="10px"
      >
        <Box
          ref={boardRef}
          position="relative"
          w="100%"
          maxW="316px"
          aspectRatio="1"
          p="4px"
          borderRadius="18px"
          bgColor="rgba(255,255,255,0.68)"
          border="1px solid rgba(157,118,92,0.15)"
          boxShadow="0 12px 24px rgba(105,75,49,0.12)"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{ touchAction: "none" }}
          aria-label="浣熊公園一筆路線拼圖"
        >
          <Grid
            position="absolute"
            inset="4px"
            templateColumns={`repeat(${RACCOON_ONE_STROKE_BOARD_SIZE}, 1fr)`}
            templateRows={`repeat(${RACCOON_ONE_STROKE_BOARD_SIZE}, 1fr)`}
            gap="3px"
          >
            {Array.from(
              { length: RACCOON_ONE_STROKE_BOARD_SIZE ** 2 },
              (_, index) => {
                const cell = {
                  col: index % RACCOON_ONE_STROKE_BOARD_SIZE,
                  row: Math.floor(index / RACCOON_ONE_STROKE_BOARD_SIZE),
                };
                const key = getRaccoonOneStrokeKey(cell);
                const pathIndex = path.findIndex(
                  (pathCell) => getRaccoonOneStrokeKey(pathCell) === key,
                );
                const isVisited = pathIndex >= 0;
                const previousCell = path[pathIndex - 1];
                const nextCell = path[pathIndex + 1];
                const connectedCells = [previousCell, nextCell].filter(
                  (connectedCell): connectedCell is RaccoonOneStrokeCell =>
                    Boolean(connectedCell),
                );
                const connectsTop = connectedCells.some(
                  (connectedCell) =>
                    connectedCell.col === cell.col &&
                    connectedCell.row === cell.row - 1,
                );
                const connectsBottom = connectedCells.some(
                  (connectedCell) =>
                    connectedCell.col === cell.col &&
                    connectedCell.row === cell.row + 1,
                );
                const connectsLeft = connectedCells.some(
                  (connectedCell) =>
                    connectedCell.col === cell.col - 1 &&
                    connectedCell.row === cell.row,
                );
                const connectsRight = connectedCells.some(
                  (connectedCell) =>
                    connectedCell.col === cell.col + 1 &&
                    connectedCell.row === cell.row,
                );
                const isTurn =
                  (connectsTop || connectsBottom) &&
                  (connectsLeft || connectsRight);
                const isObstacle = RACCOON_ONE_STROKE_OBSTACLE_KEYS.has(key);
                const clueIndex = RACCOON_ONE_STROKE_CLUES.findIndex(
                  (clue) => getRaccoonOneStrokeKey(clue) === key,
                );
                const isClue = clueIndex >= 0;
                const clueDefinition = isClue
                  ? RACCOON_ONE_STROKE_CLUES[clueIndex]
                  : null;
                const isStart =
                  key === getRaccoonOneStrokeKey(RACCOON_ONE_STROKE_START);
                const isGoal =
                  key === getRaccoonOneStrokeKey(RACCOON_ONE_STROKE_GOAL);
                const isHinted = hintKeys.includes(key);
                const cellLabel = isStart
                  ? "家，路線起點"
                  : isGoal
                    ? "公園，路線終點"
                    : isObstacle
                      ? `石塊障礙，第${cell.row + 1}列第${cell.col + 1}格`
                      : clueDefinition
                        ? `${clueDefinition.label}，下一步指向${RACCOON_ONE_STROKE_DIRECTION_LABEL[clueDefinition.direction]}`
                        : `道路拼圖，第${cell.row + 1}列第${cell.col + 1}格`;

                return (
                  <Flex
                    key={`raccoon-one-stroke-cell-${key}`}
                    as="button"
                    data-raccoon-route-cell={key}
                    data-col={cell.col}
                    data-row={cell.row}
                    position="relative"
                    minW="0"
                    minH="0"
                    borderRadius="8px"
                    overflow="hidden"
                    bgColor="#BDD99A"
                    border={
                      isTurn
                        ? "0"
                        : isVisited
                        ? "2px solid rgba(139,102,70,0.45)"
                        : "1px solid rgba(126,103,72,0.18)"
                    }
                    animation={
                      isHinted
                        ? `${raccoonOneStrokeHintPulse} 850ms ease-in-out infinite`
                        : undefined
                    }
                    cursor={isLocked ? "default" : "pointer"}
                    aria-label={cellLabel}
                    onClick={() => visitCell(cell)}
                  >
                    <Box
                      position="absolute"
                      inset="0"
                      opacity={isVisited ? 0.16 : 0.3}
                      backgroundImage="radial-gradient(circle at 28% 32%, rgba(105,139,72,0.55) 0 2px, transparent 3px), radial-gradient(circle at 68% 66%, rgba(105,139,72,0.45) 0 1px, transparent 2px)"
                    />

                    {isObstacle ? (
                      <Flex
                        position="absolute"
                        zIndex={4}
                        inset="7px"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="12px"
                        bgColor="rgba(255,249,229,0.48)"
                        boxShadow="inset 0 0 0 1px rgba(116,92,68,0.1)"
                      >
                        <Box
                          position="absolute"
                          left="9px"
                          bottom="10px"
                          w="24px"
                          h="18px"
                          borderRadius="55% 48% 42% 50%"
                          bgColor="#A89078"
                          boxShadow="inset 0 3px 0 rgba(255,255,255,0.16)"
                          transform="rotate(-7deg)"
                        />
                        <Box
                          position="absolute"
                          right="8px"
                          bottom="11px"
                          w="20px"
                          h="15px"
                          borderRadius="48% 55% 45% 50%"
                          bgColor="#B8A18A"
                          boxShadow="inset 0 3px 0 rgba(255,255,255,0.18)"
                          transform="rotate(8deg)"
                        />
                        <Box
                          position="absolute"
                          top="9px"
                          w="25px"
                          h="20px"
                          borderRadius="52% 45% 48% 43%"
                          bgColor="#927B66"
                          boxShadow="inset 0 3px 0 rgba(255,255,255,0.14)"
                        />
                      </Flex>
                    ) : null}

                    {isVisited ? (
                      <>
                        {connectsTop ? (
                          <Box
                            position="absolute"
                            left="34%"
                            top="-2px"
                            w="32%"
                            h="54%"
                            bgColor="#D7B68A"
                          />
                        ) : null}
                        {connectsBottom ? (
                          <Box
                            position="absolute"
                            left="34%"
                            bottom="-2px"
                            w="32%"
                            h="54%"
                            bgColor="#D7B68A"
                          />
                        ) : null}
                        {connectsLeft ? (
                          <Box
                            position="absolute"
                            left="-2px"
                            top="34%"
                            w="54%"
                            h="32%"
                            bgColor="#D7B68A"
                          />
                        ) : null}
                        {connectsRight ? (
                          <Box
                            position="absolute"
                            right="-2px"
                            top="34%"
                            w="54%"
                            h="32%"
                            bgColor="#D7B68A"
                          />
                        ) : null}
                        <Box
                          position="absolute"
                          left="31%"
                          top="31%"
                          w="38%"
                          h="38%"
                          borderRadius="8px"
                          bgColor="#D7B68A"
                          boxShadow={
                            isTurn
                              ? "none"
                              : "inset 0 0 0 2px rgba(255,244,211,0.36)"
                          }
                        />
                      </>
                    ) : null}

                    {clueDefinition ? (
                      <Flex
                        position="absolute"
                        zIndex={5}
                        inset="8px"
                        borderRadius="50%"
                        bgColor={
                          collectedClueKeys.includes(key)
                            ? "#D69548"
                            : "rgba(255,249,220,0.9)"
                        }
                        color={
                          collectedClueKeys.includes(key) ? "#FFFFFF" : "#9A6B47"
                        }
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 3px 7px rgba(105,75,49,0.2)"
                      >
                        <Flex
                          alignItems="center"
                          justifyContent="center"
                          gap="1px"
                          transform={`rotate(${
                            RACCOON_ONE_STROKE_DIRECTION_ROTATION[
                              clueDefinition.direction
                            ]
                          }deg)`}
                        >
                          <Text fontSize="16px" lineHeight="1">
                            🐾
                          </Text>
                          <Text
                            fontSize="13px"
                            fontWeight="900"
                            lineHeight="1"
                          >
                            ➜
                          </Text>
                        </Flex>
                        {collectedClueKeys.includes(key) ? (
                          <Flex
                            position="absolute"
                            top="-4px"
                            right="-4px"
                            w="17px"
                            h="17px"
                            borderRadius="50%"
                            bgColor="#FFFFFF"
                            color="#C27C38"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 2px 5px rgba(105,75,49,0.2)"
                          >
                            <Text fontSize="10px" fontWeight="900" lineHeight="1">
                              ✓
                            </Text>
                          </Flex>
                        ) : null}
                      </Flex>
                    ) : null}

                    {isStart ? (
                      <Image
                        position="absolute"
                        zIndex={6}
                        inset="7px"
                        src="/images/icon/house.png"
                        alt="家"
                        w="calc(100% - 14px)"
                        h="calc(100% - 14px)"
                        objectFit="contain"
                      />
                    ) : null}

                    {isGoal ? (
                      <Image
                        position="absolute"
                        zIndex={6}
                        inset="7px"
                        src="/images/icon/park.png"
                        alt="公園"
                        w="calc(100% - 14px)"
                        h="calc(100% - 14px)"
                        objectFit="contain"
                      />
                    ) : null}
                  </Flex>
                );
              },
            )}
          </Grid>

          <Box
            position="absolute"
            zIndex={12}
            left={`${((runnerCell.col + 0.5) / RACCOON_ONE_STROKE_BOARD_SIZE) * 100}%`}
            top={`${((runnerCell.row + 0.5) / RACCOON_ONE_STROKE_BOARD_SIZE) * 100}%`}
            w="36px"
            h="36px"
            transform="translate(-50%, -50%)"
            transition="left 130ms ease-out, top 130ms ease-out"
            animation={
              isRunning
                ? `${raccoonOneStrokeRunnerHop} 330ms ease-in-out infinite`
                : undefined
            }
            pointerEvents="none"
          >
            <Image
              src="/images/icon/icon_mai.png"
              alt="小麥目前位置"
              w="100%"
              h="100%"
              objectFit="contain"
              filter="drop-shadow(0 2px 2px rgba(91,58,34,0.35))"
            />
          </Box>
        </Box>
      </Flex>

      <Flex
        minH="62px"
        flexShrink={0}
        bgColor="#F8E7CC"
        borderTop="1px solid rgba(185,152,115,0.12)"
        alignItems="center"
        justifyContent="center"
        px="16px"
      >
        <Text
          color="#8F6C51"
          fontSize="12px"
          fontWeight="900"
          lineHeight="1.45"
          textAlign="center"
        >
          {hint}
        </Text>
      </Flex>

      <Flex
        minH="76px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        px="14px"
        py="10px"
        gap="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
      >
        <Flex
          as="button"
          h="42px"
          px="14px"
          borderRadius="999px"
          bgColor="rgba(255,255,255,0.2)"
          alignItems="center"
          justifyContent="center"
          cursor={isLocked ? "default" : "pointer"}
          opacity={isLocked ? 0.55 : 1}
          onClick={resetRoute}
          aria-label="重新規劃路線"
        >
          <Text color="#FFFFFF" fontSize="12px" fontWeight="900">
            重來
          </Text>
        </Flex>
        <Flex
          as="button"
          h="42px"
          px="13px"
          borderRadius="999px"
          bgColor="rgba(255,255,255,0.2)"
          alignItems="center"
          justifyContent="center"
          cursor={isLocked ? "default" : "pointer"}
          opacity={isLocked ? 0.55 : 1}
          onClick={showRouteHint}
          aria-label="顯示一筆路線提示"
        >
          <Text color="#FFFFFF" fontSize="12px" fontWeight="900">
            提示
          </Text>
        </Flex>
        <Flex
          as="button"
          flex="1"
          h="46px"
          borderRadius="999px"
          bgColor="#FFFFFF"
          color="#986E53"
          fontSize="16px"
          fontWeight="900"
          alignItems="center"
          justifyContent="center"
          cursor={isRouteReady && !isLocked ? "pointer" : "not-allowed"}
          opacity={isRouteReady || isLocked ? 1 : 0.55}
          pointerEvents={departureFlow.isRouteLocked ? "none" : "auto"}
          onClick={runRoute}
        >
          沿路出發
        </Flex>
      </Flex>

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={{
            key: "home",
            label: "家",
            iconPath: "/images/icon/house.png",
          }}
          middlePoint={null}
          endPoint={{
            key: "park",
            label: "公園",
            iconPath: "/images/icon/park.png",
            isTarget: true,
          }}
        />
      ) : null}
    </Flex>
  );
}

function StoryRaccoonWideNarrowRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const departureFlow = useStoryRouteDepartureFlow<string>({
    onConnectComplete: () => {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    },
    onDepartComplete: () => {
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-raccoon-park-arrival")));
    },
  });

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      direction="column"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <RaccoonWideNarrowRouteMinigame
        isExternallyLocked={departureFlow.isRouteLocked}
        onComplete={() => {
          departureFlow.startDeparture("raccoon-wide-narrow");
        }}
      />

      {departureFlow.isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureFlow.departureProgress}
          startPoint={{
            key: "home",
            label: "家",
            iconPath: "/images/icon/house.png",
          }}
          middlePoint={null}
          endPoint={{
            key: "park",
            label: "公園",
            iconPath: "/images/icon/park.png",
            isTarget: true,
          }}
        />
      ) : null}
    </Flex>
  );
}

function StoryCatLegacyRoutePuzzleView({
  stage,
  onComplete,
  onProgressSaved,
}: {
  stage: CatRouteStage;
  onComplete: () => void;
  onProgressSaved?: () => void;
}) {
  const choices = CAT_ROUTE_CHOICES_BY_STAGE[stage];
  const requiredIds = CAT_ROUTE_REQUIRED_IDS_BY_STAGE[stage];
  const start = CAT_ROUTE_START_BY_STAGE[stage];
  const isSolved = (placedChoices: readonly (RouteChoice | null)[]) => {
    const placedChoiceIds = placedChoices.flatMap((choice) => (choice ? [choice.id] : []));
    return (
      placedChoiceIds.length === requiredIds.length &&
      requiredIds.every((choiceId) => placedChoiceIds.includes(choiceId))
    );
  };

  return (
    <StoryLinearRoutePuzzleStage<RouteChoice>
      config={{
        id: `cat-${stage}`,
        choices,
        slotCount: 2,
        slotTargetIds: [`cat-${stage}-slot-0`, `cat-${stage}-slot-1`],
        boardDropTarget: `cat-${stage}-board`,
        removeDropTarget: `cat-${stage}-remove`,
        initialHint: "將拼圖拖到空格裡，安排前往泡芙店的路線。",
        emptySlotHint: "先在下方選一塊拼圖，或直接拖曳上來。",
        selectedHint: (choice) => `已選擇「${choice.label}」，繼續完成一筆路線。`,
        alreadyPlacedHint: "這塊拼圖已經放進路線了。",
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
            imagePath: CAT_PUFF_SHOP_STRAIGHT_IMAGE_PATH,
            alt: "泡芙店拼圖",
            routeBadgeLabel: "泡芙店",
          },
          fixedBottom: {
            imagePath: start.imagePath,
            alt: `${start.label}拼圖`,
            routeBadgeLabel: start.label,
          },
        },
        tray: {
          variant: "square-grid",
          height: "210px",
          ariaOnlyHint: true,
        },
        canPressDeparture: (placedChoices) => placedChoices.every(Boolean),
        isSolved,
        validateDeparture: (placedChoices) => {
          if (!placedChoices[0] || !placedChoices[1]) {
            return "先把兩格路線排滿。";
          }
          if (!isSolved(placedChoices)) {
            const routeLabels = [...requiredIds]
              .map(
                (choiceId) =>
                  choices.find((choice) => choice.id === choiceId)?.label ?? "",
              )
              .filter(Boolean)
              .join("、");
            return `這條路會錯過事件，請把「${routeLabels}」都放進路線。`;
          }
          return null;
        },
        disablePlacedChoices: true,
        departureStartPoint: {
          key: `cat-${stage}-start`,
          label: start.label,
          iconPath: start.iconPath,
        },
        departureEndPoint: {
          key: "cat-puff-shop",
          label: "泡芙店",
          iconPath: "/images/icon/breakfast.png",
          isTarget: true,
        },
        getDepartureMiddlePoint: (placedChoices) => {
          const routePoints = [...placedChoices]
            .reverse()
            .flatMap((choice, index): StoryRouteMapPoint[] =>
              choice
                ? [
                    {
                      key: `${stage}-${choice.id}-${index}`,
                      label: choice.label,
                      iconPath: choice.mapIconPath,
                    },
                  ]
                : [],
            );
          return routePoints.length > 0 ? routePoints : null;
        },
        onConnectComplete: () => {
          recordArrangeRouteDeparture();
          onProgressSaved?.();
        },
        onDepartComplete: onComplete,
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

  if (mode === "koala-work") {
    return <StoryKoalaArrangeRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "rooster-clue") {
    return <StoryRoosterClueArrangeRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "rooster-park") {
    return <StoryRoosterParkRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "raccoon-park") {
    return <StoryRaccoonOneStrokeRouteView onProgressSaved={onProgressSaved} />;
  }

  if (mode === "cat-puff-shop") {
    return (
      <StoryCatSunbeastRouteView
        onProgressSaved={onProgressSaved}
        renderRoutePuzzle={({ stage, onComplete }) => (
          <StoryCatLegacyRoutePuzzleView
            key={stage}
            stage={stage}
            onComplete={onComplete}
            onProgressSaved={onProgressSaved}
          />
        )}
      />
    );
  }

  return <StoryMetroArrangeRouteView onProgressSaved={onProgressSaved} />;
}

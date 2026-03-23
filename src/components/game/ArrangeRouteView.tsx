"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
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
import { MetroSeatEventModal } from "@/components/game/events/MetroSeatEventModal";
import { BreakfastShopEventModal } from "@/components/game/events/BreakfastShopEventModal";
import { ParkHubEventModal } from "@/components/game/events/ParkHubEventModal";
import { ParkCatGrassEventModal } from "@/components/game/events/ParkCatGrassEventModal";
import { ParkGossipEventModal } from "@/components/game/events/ParkGossipEventModal";
import { StreetCatTreatEventModal } from "@/components/game/events/StreetCatTreatEventModal";
import { StreetCookieEventModal } from "@/components/game/events/StreetCookieEventModal";
import { StreetNoChoiceEventModal } from "@/components/game/events/StreetNoChoiceEventModal";
import { MetroFirstSunbeastDogEventModal } from "@/components/game/events/MetroFirstSunbeastDogEventModal";
import { WorkTransitionModal } from "@/components/game/events/WorkTransitionModal";
import type { PlayerStatus } from "@/lib/game/playerStatus";
import { OFFWORK_SCENE_ID } from "@/lib/game/scenes";
import {
  grantEventRewardTile,
  grantInventoryItem,
  incrementWorkShiftCount,
  loadPlayerProgress,
  savePlayerProgress,
  unlockDiaryEntry,
  type RewardPlaceTile,
} from "@/lib/game/playerProgress";

const DEFAULT_BOARD_COLS = 3;
const DEFAULT_BOARD_ROWS = 4;
const EXPANDED_BOARD_COLS = 4;
const EXPANDED_BOARD_ROWS = 5;
const DEFAULT_START_POS = { r: 0, c: 1 };
const SHIFTED_START_POS = { r: 0, c: 2 };
const EXPANDED_START_POS = { r: 0, c: 3 };
const DEFAULT_END_POS = { r: 3, c: 1 };
const EXPANDED_END_POS = { r: 4, c: 2 };
const ARRANGE_ROUTE_TUTORIAL_SEEN_KEY = "moment:arrange-route-tutorial-seen";
const ARRANGE_ROUTE_TUTORIAL_STEPS = [
  {
    title: "1. 決定經過哪些地點",
    description: "先把想去的地點放到路徑上，建立今天的行程。",
    imagePath: "/images/tutorial/rt_MRT_111_010_111.png",
  },
  {
    title: "2. 安排必經的道路",
    description: "把必經路線放進格子裡，先大致鋪出方向。",
    imagePath: "/images/tutorial/rt_010_010_010.png",
  },
  {
    title: "3. 根據邊界來銜接出路徑",
    description: "觀察邊界連接點，讓每塊路徑能正確銜接。",
    imagePath: "/images/tutorial/touch_demo.png",
  },
  {
    title: "4. 都連結起來後就可以出發",
    description: "路線完整連通後，按下出發開始一天的行程。",
    imagePath: "/images/tutorial/touch_demo.png",
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
const STREET_DEPARTURE_EVENT_IDS: ReadonlyArray<GameEventId> = [
  "street-cookie-sale",
  "street-cat-treat",
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

function patternToKey(pattern: number[][]) {
  return pattern
    .map((row) => row.map((value) => (value === 1 ? "1" : "0")).join(""))
    .join("_");
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
  const defaultImagePath = TILE_IMAGE_BY_PATTERN_KEY[`default::${patternKey}`];
  if (defaultImagePath) return defaultImagePath;
  return undefined;
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
};
type RoutePaletteTile = RouteTile & {
  pairIds?: [string, string];
};

type ArrangeTabKey = "place" | "route" | "pet";

const ROUTE_TILES: RouteTile[] = [
  {
    id: "full-top-to-bottom-mid",
    label: "0-3 -> 2-2",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    id: "full-top-to-left-low",
    label: "0-3 -> 2-1",
    pattern: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
  },
  {
    id: "turn-left-up",
    label: "左上彎",
    pattern: [
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    id: "turn-right-down-short",
    label: "右下彎短",
    pattern: [
      [0, 0, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    id: "left-to-right",
    label: "左到右",
    pattern: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  {
    id: "right-to-left",
    label: "右到左",
    pattern: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
];

const BASE_PLACE_TILES: RouteTile[] = [
  {
    id: "metro-station",
    label: "捷運站",
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 1],
    ],
    centerEmoji: "🚋",
    imagePath: TILE_IMAGE_BY_PATTERN_KEY["metro-station::111_010_111"],
  },
];

// Can be adjusted per level: which 3x3 edge slots are valid exits/entries.
// Home starts with full-width exit (0~3 semantics mapped to [0,1,2]).
const START_CONNECTOR: Connector = {
  top: [],
  right: [],
  bottom: [0, 1, 2],
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
  icon,
  connector,
  mode,
}: {
  icon: string;
  connector: Connector;
  mode: "start" | "end";
}) {
  const activeSlots = mode === "start" ? connector.bottom : connector.top;
  return (
    <Flex
      w="92%"
      h="92%"
      borderRadius="8px"
      border="2px solid #65D7E7"
      bgColor="#BFE8A8"
      alignItems="stretch"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      <Flex
        position="absolute"
        top="8px"
        left="50%"
        transform="translateX(-50%)"
        zIndex={2}
      >
        <Text fontSize="26px">{icon}</Text>
      </Flex>

      <Flex
        w="100%"
        h="100%"
        alignItems={mode === "start" ? "flex-end" : "flex-start"}
        justifyContent="stretch"
        pt={mode === "start" ? "0" : "42px"}
        pb={mode === "start" ? "8px" : "0"}
      >
        <Grid templateColumns="repeat(3, 1fr)" w="100%" h="60%">
          {[0, 1, 2].map((slot) => (
            <Flex
              key={slot}
              alignItems="stretch"
              justifyContent="center"
              px="2px"
            >
              <Box
                w="100%"
                borderRadius="4px"
                bgColor={
                  activeSlots.includes(slot)
                    ? "rgba(255,255,255,0.88)"
                    : "rgba(255,255,255,0.12)"
                }
              />
            </Flex>
          ))}
        </Grid>
      </Flex>
    </Flex>
  );
}

function GridPattern({
  pattern,
  centerEmoji,
  imagePath,
}: {
  pattern: number[][];
  centerEmoji?: string;
  imagePath?: string;
}) {
  if (imagePath) {
    return (
      <Flex
        w="86%"
        h="86%"
        borderRadius="6px"
        overflow="hidden"
        border="1px solid rgba(130,106,83,0.36)"
        bgColor="rgba(255,255,255,0.55)"
      >
        <img
          src={imagePath}
          alt="拼圖圖塊"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
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

type ArrangeRouteViewProps = {
  playerStatus: PlayerStatus;
  rewardPlaceTiles: RewardPlaceTile[];
  onPlayerStatusChange: Dispatch<SetStateAction<PlayerStatus>>;
  offworkRewardClaimCount?: number;
  /** 是否曾在安排路線中出發且經過街道（起點變化需與第 4 次一併達成） */
  hasPassedThroughStreet?: boolean;
  /** 當進度被寫入後呼叫（例如標記「經過街道」後），讓上層可重新載入進度 */
  onProgressSaved?: () => void;
};

export function ArrangeRouteView({
  playerStatus,
  rewardPlaceTiles,
  onPlayerStatusChange,
  offworkRewardClaimCount = 0,
  hasPassedThroughStreet = false,
  onProgressSaved,
}: ArrangeRouteViewProps) {
  const router = useRouter();
  const [placedRoutes, setPlacedRoutes] = useState<Record<number, string>>({});
  const [hoverCell, setHoverCell] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ArrangeTabKey>("place");
  const [dropError, setDropError] = useState("");
  const [isDropErrorVisible, setIsDropErrorVisible] = useState(false);
  const [activeEventId, setActiveEventId] = useState<GameEventId | null>(null);
  const [isWorkTransitionOpen, setIsWorkTransitionOpen] = useState(false);
  const [routeSlideIndex, setRouteSlideIndex] = useState(0);
  const [routeDragOffsetPx, setRouteDragOffsetPx] = useState(0);
  const [isRouteDragging, setIsRouteDragging] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [isStoryRouteTutorialFlow, setIsStoryRouteTutorialFlow] = useState(false);
  const [hasMetroGuideGrabbed, setHasMetroGuideGrabbed] = useState(false);
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
  const arrangeRouteAttempt = offworkRewardClaimCount + 1;
  const isExpandedBoard = arrangeRouteAttempt >= 5 && hasPassedThroughStreet;
  const boardCols = isExpandedBoard ? EXPANDED_BOARD_COLS : DEFAULT_BOARD_COLS;
  const boardRows = isExpandedBoard ? EXPANDED_BOARD_ROWS : DEFAULT_BOARD_ROWS;
  const boardCellCount = boardCols * boardRows;
  const indexToPos = (index: number) => ({ r: Math.floor(index / boardCols), c: index % boardCols });
  const posToIndex = (r: number, c: number) => r * boardCols + c;
  const startPos = isExpandedBoard
    ? EXPANDED_START_POS
    : offworkRewardClaimCount >= 3 && hasPassedThroughStreet
      ? SHIFTED_START_POS
      : DEFAULT_START_POS;
  const endPos = isExpandedBoard ? EXPANDED_END_POS : DEFAULT_END_POS;
  const startCell = posToIndex(startPos.r, startPos.c);
  const endCell = posToIndex(endPos.r, endPos.c);

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
        }),
      ),
    [rewardPlaceTiles],
  );
  const rewardPlaceCategoryTiles = useMemo(
    () =>
      rewardPlaceTiles
        .filter((tile) => tile.category === "place")
        .map(
          (tile): RouteTile => ({
            id: tile.instanceId,
            label: tile.label,
            pattern: tile.pattern,
            centerEmoji: tile.centerEmoji,
            imagePath: resolvePlaceTileImagePath({
              tileId: tile.instanceId,
              sourceId: tile.sourceId,
              pattern: tile.pattern,
            }),
          }),
        ),
    [rewardPlaceTiles],
  );
  const routeTiles = useMemo(() => [...rewardRouteTiles, ...ROUTE_TILES], [rewardRouteTiles]);
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
  const placeTiles = useMemo(
    () => [
      ...BASE_PLACE_TILES,
      ...rewardPlaceCategoryTiles,
    ],
    [rewardPlaceCategoryTiles],
  );

  const tileMap = useMemo(
    () =>
      Object.fromEntries(
        [...routeTiles, ...placeTiles].map((item) => [item.id, item]),
      ) as Record<string, RouteTile>,
    [placeTiles, routeTiles],
  );

  const tileEdgeMap = useMemo(
    () =>
      Object.fromEntries(
        [...routeTiles, ...placeTiles].map((tile) => [
          tile.id,
          getEdgeSlots(tile.pattern),
        ]),
      ) as Record<string, Connector>,
    [placeTiles, routeTiles],
  );
  const availablePlaceTiles = useMemo(
    () => placeTiles,
    [placeTiles],
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
    const availableIds = new Set(availablePlaceTiles.map((tile) => tile.id));
    setPlacedRoutes((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(next).forEach(([cellIndex, tileId]) => {
        const isPlaceTile = placeTiles.some((tile) => tile.id === tileId);
        if (isPlaceTile && !availableIds.has(tileId)) {
          delete next[Number(cellIndex)];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [availablePlaceTiles, placeTiles]);

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
    if (index === startCell) return START_CONNECTOR;
    if (index === endCell) return END_CONNECTOR;
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

  const canPlaceRouteInMap = (
    routeMap: Record<number, string>,
    cellIndex: number,
    routeId: string,
  ) => {
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

  const hasBothKeyCellsPlaced = (routeMap: Record<number, string>) => {
    const startPos = indexToPos(startCell);
    const endPos = indexToPos(endCell);
    const afterStartIndex = posToIndex(startPos.r + 1, startPos.c);
    const beforeEndIndex = posToIndex(endPos.r - 1, endPos.c);

    return Boolean(routeMap[afterStartIndex] && routeMap[beforeEndIndex]);
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
      !isExactMatch(START_CONNECTOR.bottom, afterStartConnector.top)
    ) {
      mismatchCells.push(afterStartIndex);
    }

    const beforeEndConnector = getConnectorAtCellFromMap(beforeEndIndex, routeMap);
    if (
      beforeEndConnector &&
      !isExactMatch(beforeEndConnector.bottom, END_CONNECTOR.top)
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
      !routeId.startsWith("metro-station-")
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
      const bothKeyCellsPlaced = hasBothKeyCellsPlaced(nextMap);

      const leftValid = canPlaceRouteInMap(nextMap, cellIndex, leftId);
      const rightValid = canPlaceRouteInMap(nextMap, rightCellIndex, rightId);
      if (!leftValid || !rightValid) {
        if (bothKeyCellsPlaced) {
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

      if (bothKeyCellsPlaced && !isMapRouteConnected(nextMap)) {
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
        return;
      }

      setDropError("");
      setIsDropErrorVisible(false);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      setPlacedRoutes(nextMap);
      return;
    }

    if (cellIndex === startCell || cellIndex === endCell) return;
    if (sourceCell === cellIndex) return;
    const previousMap = { ...placedRoutes };
    const nextMap = { ...previousMap };
    if (typeof sourceCell === "number") removePlacedAtCell(nextMap, sourceCell);
    nextMap[cellIndex] = routeId;
    const bothKeyCellsPlaced = hasBothKeyCellsPlaced(nextMap);

    if (!canPlaceRoute(cellIndex, routeId, sourceCell)) {
      const shouldWarnAndRollback = bothKeyCellsPlaced;

      if (shouldWarnAndRollback) {
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

    // Even when this single placement is locally valid, once both key cells are filled
    // the whole route must connect start to end; otherwise rollback with guidance.
    if (bothKeyCellsPlaced && !isMapRouteConnected(nextMap)) {
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
      return;
    }

    setDropError("");
    setIsDropErrorVisible(false);
    if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
    setPlacedRoutes(nextMap);
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
      setIsWorkTransitionOpen(true);
    };

    window.addEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
    window.addEventListener(GAME_WORK_CHEAT_TRIGGER, handleWorkCheatTrigger);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      window.removeEventListener(GAME_EVENT_CHEAT_TRIGGER, handleCheatTrigger);
      window.removeEventListener(GAME_WORK_CHEAT_TRIGGER, handleWorkCheatTrigger);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const forceFromStory =
      new URLSearchParams(window.location.search).get("tutorial") === "story41";
    if (forceFromStory) {
      setIsStoryRouteTutorialFlow(true);
      setHasMetroGuideGrabbed(false);
      setTutorialStepIndex(0);
      setIsTutorialModalOpen(true);
      return;
    }
    setIsStoryRouteTutorialFlow(false);
    const seen = window.localStorage.getItem(ARRANGE_ROUTE_TUTORIAL_SEEN_KEY);
    if (seen === "1") return;
    setTutorialStepIndex(0);
    setIsTutorialModalOpen(true);
  }, []);

  const isRouteConnected = useMemo(
    () => isMapRouteConnected(placedRoutes),
    [placedRoutes],
  );

  const placedCount = Object.keys(placedRoutes).length;
  const hasMetroStationPlaced = Object.values(placedRoutes).some(
    (tileId) => tileId === "metro-station" || tileId.startsWith("metro-station-"),
  );
  const hasBreakfastShopPlaced = Object.values(placedRoutes).some(
    (tileId) => tileId === "breakfast-shop" || tileId.startsWith("breakfast-shop-"),
  );
  const hasParkPlaced = Object.values(placedRoutes).some(
    (tileId) => tileId === "park" || tileId.startsWith("park-"),
  );
  const streetPlaceTileIds = new Set(
    rewardPlaceTiles
      .filter((tile) => tile.category === "place" && tile.sourceId === "street")
      .map((tile) => tile.instanceId),
  );
  const hasStreetPlaced = Object.values(placedRoutes).some((tileId) =>
    tileId === "street" || streetPlaceTileIds.has(tileId),
  );
  const tutorialStep = ARRANGE_ROUTE_TUTORIAL_STEPS[tutorialStepIndex];
  const showMetroGuide = isStoryRouteTutorialFlow && !isTutorialModalOpen;
  const metroFirstStepActive = showMetroGuide && !hasMetroStationPlaced;
  const showMetroDropHint = metroFirstStepActive && hasMetroGuideGrabbed;
  const startPosForGuide = indexToPos(startCell);
  const metroGuideDropCellIndex = posToIndex(startPosForGuide.r + 1, startPosForGuide.c);
  const metroSelectionTooltipVisible = metroFirstStepActive && activeTab === "place";
  const visiblePlaceTiles = metroFirstStepActive
    ? availablePlaceTiles.filter(
        (tile) => tile.id === "metro-station" || tile.id.startsWith("metro-station-"),
      )
    : availablePlaceTiles;

  const handleDeparture = () => {
    if (!isRouteConnected) return;
    if (isStoryRouteTutorialFlow && hasMetroStationPlaced) {
      setActiveEventId("metro-first-sunbeast-dog");
      return;
    }
    if (hasBreakfastShopPlaced) {
      setActiveEventId("breakfast-shop-choice");
      return;
    }
    if (hasStreetPlaced) {
      const progress = loadPlayerProgress();
      if (!progress.hasPassedThroughStreet) {
        savePlayerProgress({ ...progress, hasPassedThroughStreet: true });
        onProgressSaved?.();
      }
      const randomIndex = Math.floor(Math.random() * STREET_DEPARTURE_EVENT_IDS.length);
      setActiveEventId(STREET_DEPARTURE_EVENT_IDS[randomIndex]);
      return;
    }
    if (hasParkPlaced) {
      setActiveEventId("park-hub");
      return;
    }
    if (hasMetroStationPlaced) {
      const randomIndex = Math.floor(Math.random() * METRO_DAILY_EVENT_IDS.length);
      setActiveEventId(METRO_DAILY_EVENT_IDS[randomIndex]);
      return;
    }
    setIsWorkTransitionOpen(true);
  };

  const grantMetroPuzzleFragment = () => {
    grantEventRewardTile(
      "metro-station",
      [
        [1, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      {
        category: "route",
        label: "捷運碎片",
        centerEmoji: "🚋",
      },
    );
    onProgressSaved?.();
  };

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      bgColor="#DAD6C8"
      direction="column"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <Flex p="10px" borderBottom="1px solid #C9C3B3">
        <Flex
          w="100%"
          h="64px"
          bgColor="#F4F1E8"
          border="2px solid #9F8A71"
          borderRadius="10px"
          alignItems="center"
          justifyContent="space-between"
          px="12px"
        >
          <Flex
            w="38px"
            h="38px"
            borderRadius="8px"
            border="1px solid #BEB4A0"
            alignItems="center"
            justifyContent="center"
          >
            <Text>🏠</Text>
          </Flex>
          <Text color="#5D4C3A" fontWeight="700" fontSize="28px">
            安排路線
          </Text>
          <Flex
            w="38px"
            h="38px"
            borderRadius="8px"
            border="1px solid #BEB4A0"
            alignItems="center"
            justifyContent="center"
          >
            <Text>🚋</Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex flex="1" alignItems="center" justifyContent="center" px="12px">
        <Grid
          templateColumns={`repeat(${boardCols}, 1fr)`}
          templateRows={`repeat(${boardRows}, 1fr)`}
          gap="0"
          w="100%"
          maxW="360px"
          h={isExpandedBoard ? "500px" : "430px"}
        >
          {Array.from({ length: boardCellCount }).map((_, index) => {
          const isStart = index === startCell;
          const isEnd = index === endCell;
          const cellValue = placedRoutes[index];
          const pairMarker = cellValue ? parsePairMarker(cellValue) : null;
          const isPairRightCell = pairMarker?.side === "right";
          const isPairLeftCell = pairMarker?.side === "left";
          const isOccupied = Boolean(cellValue);
          const isDroppable = !isStart && !isEnd;
          return (
            <Flex
              key={index}
              border="1px solid rgba(168,160,145,0.18)"
              bgColor={
                index % 2 === 0
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(244,239,226,0.4)"
              }
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
                if (payload) handleDropToCell(index, payload.routeId, payload.sourceCell);
                setHoverCell(null);
              }}
              onDoubleClick={() => {
                if (!isDroppable || !isOccupied) return;
                setPlacedRoutes((prev) => {
                  const next = { ...prev };
                  removePlacedAtCell(next, index);
                  return next;
                });
              }}
            >
              {isStart || isEnd ? (
                <EndpointVisual
                  icon={isStart ? "🏠" : "🏢"}
                  connector={isStart ? START_CONNECTOR : END_CONNECTOR}
                  mode={isStart ? "start" : "end"}
                />
              ) : isOccupied ? (
                isPairRightCell ? null : (
                <Flex
                  w={isPairLeftCell ? "196%" : "92%"}
                  h="92%"
                  borderRadius="8px"
                  border="2px solid #8E7A62"
                  bgColor="#D5E8B7"
                  alignItems="center"
                  justifyContent="center"
                  draggable
                  cursor="grab"
                  position={isPairLeftCell ? "absolute" : "relative"}
                  left={isPairLeftCell ? "2%" : undefined}
                  zIndex={isPairLeftCell ? 2 : 1}
                  onDragStart={(event) => {
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
                  />
                </Flex>
                )
              ) : (
                <Text
                  position="absolute"
                  fontSize="22px"
                  opacity={hoverCell === index ? 0.95 : 0.28}
                  color={hoverCell === index ? "#53C5D5" : "#9D937E"}
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
          bottom="220px"
          zIndex={20}
          justifyContent="center"
          opacity={isDropErrorVisible ? 1 : 0}
          transition="opacity 0.28s ease"
          pointerEvents="none"
        >
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
        </Flex>
      ) : null}

      <Flex
        h="220px"
        minH="220px"
        maxH="220px"
        bgColor="rgba(200,194,179,0.52)"
        direction="column"
        p="10px"
        gap="8px"
        overflow="hidden"
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          const payload = readDragPayload(event);
          if (!payload || typeof payload.sourceCell !== "number") return;
          event.preventDefault();
          setPlacedRoutes((prev) => {
            const next = { ...prev };
            removePlacedAtCell(next, payload.sourceCell!);
            return next;
          });
        }}
      >
        <Flex flex="1" minH="0">
          {activeTab === "route" ? (
            <Flex
              flex="1"
              minH="0"
              direction="column"
              gap="6px"
            >
              <Flex
                flex="1"
                minH="0"
                h="136px"
                overflow="hidden"
                position="relative"
                  touchAction="pan-y"
                  onTouchStart={(event) => {
                    const touch = event.touches[0];
                    const target = event.target as HTMLElement;
                    const fromTile = Boolean(target.closest("[data-route-tile='true']"));
                    routeTouchStartRef.current = {
                      x: touch.clientX,
                      y: touch.clientY,
                      fromTile,
                      isHorizontalDrag: false,
                    };
                    setRouteDragOffsetPx(0);
                    setIsRouteDragging(false);
                  }}
                  onTouchMove={(event) => {
                    const start = routeTouchStartRef.current;
                    if (!start || start.fromTile) return;
                    const touch = event.touches[0];
                    const dx = touch.clientX - start.x;
                    const dy = touch.clientY - start.y;

                    if (!start.isHorizontalDrag) {
                      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
                        start.isHorizontalDrag = true;
                        setIsRouteDragging(true);
                      } else {
                        return;
                      }
                    }

                    if (start.isHorizontalDrag) {
                      const width = routeTrackRef.current?.clientWidth ?? 1;
                      const maxOffset = width * 0.9;
                      const clamped = Math.max(-maxOffset, Math.min(maxOffset, dx));
                      setRouteDragOffsetPx(clamped);
                      event.preventDefault();
                    }
                  }}
                  onTouchEnd={(event) => {
                    const start = routeTouchStartRef.current;
                    routeTouchStartRef.current = null;
                    if (!start || start.fromTile) return;
                    if (!start.isHorizontalDrag) return;
                    const width = routeTrackRef.current?.clientWidth ?? 1;
                    const threshold = Math.max(36, width * 0.18);
                    const finalDx = routeDragOffsetPx;
                    setRouteSlideIndex((prev) => {
                      let next = prev;
                      if (finalDx < -threshold) next = prev + 1;
                      if (finalDx > threshold) next = prev - 1;
                      if (next < 0) next = 0;
                      if (next > routeSlides.length - 1) next = routeSlides.length - 1;
                      return next;
                    });
                    setRouteDragOffsetPx(0);
                    setIsRouteDragging(false);
                  }}
                  onTouchCancel={() => {
                    routeTouchStartRef.current = null;
                    setRouteDragOffsetPx(0);
                    setIsRouteDragging(false);
                  }}
              >
                <Flex
                  ref={routeTrackRef}
                  w="100%"
                  h="100%"
                  transition={isRouteDragging ? "none" : "transform 0.28s ease"}
                  transform={`translateX(calc(-${routeSlideIndex * 100}% + ${routeDragOffsetPx}px))`}
                >
                  {routeSlides.map((slide, slideIndex) => (
                    <Grid
                      key={`route-slide-${slideIndex}`}
                      flex="0 0 100%"
                      h="100%"
                      templateColumns="repeat(5, minmax(0, 1fr))"
                      autoRows="64px"
                      columnGap="8px"
                      rowGap="8px"
                      alignContent="start"
                    >
                      {slide.map((tile) => (
                        <Flex
                          key={tile.id}
                          data-route-tile="true"
                          h="64px"
                          gridColumn={tile.pairIds ? "span 2" : "span 1"}
                          borderRadius="8px"
                          bgColor="#BFE8A8"
                          border="2px solid #A38765"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          draggable
                          cursor="grab"
                          onDragStart={(event) => {
                            setDragPayload(event, { routeId: tile.id });
                          }}
                          title={`拖曳放入格子：${tile.label}`}
                        >
                          <GridPattern pattern={tile.pattern} imagePath={tile.imagePath} />
                        </Flex>
                      ))}
                    </Grid>
                  ))}
                </Flex>
              </Flex>
              {routeSlides.length > 1 ? (
                <Flex justifyContent="center" alignItems="center" gap="6px">
                  {routeSlides.map((_, pageIndex) => (
                    <Flex
                      key={`route-dot-${pageIndex}`}
                      w="8px"
                      h="8px"
                      borderRadius="999px"
                      bgColor={pageIndex === routeSlideIndex ? "#8F775E" : "#C8BEAE"}
                      cursor="pointer"
                      onClick={() => setRouteSlideIndex(pageIndex)}
                    />
                  ))}
                </Flex>
              ) : null}
            </Flex>
          ) : (
            <Flex flex="1" minH="0" gap="8px" overflowX="auto" overflowY="hidden" pb="2px" alignItems="flex-start">
              {activeTab === "place" ? (
                visiblePlaceTiles.length > 0 ? (
                  <Flex direction="column" gap="6px" w="100%">
                    <Flex
                      position="relative"
                      gap="8px"
                      overflowX="auto"
                      overflowY="visible"
                      pt={metroSelectionTooltipVisible ? "24px" : "0px"}
                      pb="2px"
                      alignItems="flex-start"
                    >
                      {metroSelectionTooltipVisible ? (
                        <Flex
                          pointerEvents="none"
                          position="absolute"
                          top="0px"
                          left="34px"
                          transform="translateX(-50%)"
                          px="10px"
                          h="22px"
                          borderRadius="999px"
                          bgColor="#F0C84A"
                          color="#5D4C3A"
                          fontSize="11px"
                          fontWeight="700"
                          whiteSpace="nowrap"
                          animation={`${metroGuideBounce} 1s ease-in-out infinite`}
                        >
                          抓取捷運
                          <Box
                            position="absolute"
                            left="50%"
                            bottom="-4px"
                            transform="translateX(-50%) rotate(45deg)"
                            w="8px"
                            h="8px"
                            bgColor="#F0C84A"
                          />
                        </Flex>
                      ) : null}
                      {visiblePlaceTiles.map((tile) => {
                        const isMetroGuideTarget =
                          metroFirstStepActive &&
                          (tile.id === "metro-station" || tile.id.startsWith("metro-station-"));
                        return (
                          <Flex
                            key={tile.id}
                            position="relative"
                            minW="66px"
                            w="66px"
                            h="66px"
                            borderRadius="8px"
                            bgColor={isMetroGuideTarget ? "#EFE7CB" : "#E4E0D2"}
                            border={isMetroGuideTarget ? "2px solid #F0C84A" : "2px solid #B8AE9A"}
                            boxShadow={
                              isMetroGuideTarget ? "0 0 0 3px rgba(240,200,74,0.35)" : "none"
                            }
                            animation={isMetroGuideTarget ? `${metroGuidePulse} 1s ease-in-out infinite` : "none"}
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            draggable
                            cursor="grab"
                            onDragStart={(event) => {
                              setDragPayload(event, { routeId: tile.id });
                              if (isMetroGuideTarget && metroFirstStepActive) {
                                setHasMetroGuideGrabbed(true);
                              }
                            }}
                            title={isMetroGuideTarget ? `${tile.label}（先放這塊）` : tile.label}
                          >
                            <GridPattern
                              pattern={tile.pattern}
                              centerEmoji={tile.centerEmoji}
                              imagePath={tile.imagePath}
                            />
                          </Flex>
                        );
                      })}
                    </Flex>
                  </Flex>
                ) : (
                  <Flex h="66px" alignItems="center" justifyContent="center" w="100%">
                    <Text color="#988E7A" fontSize="12px">
                      尚未擁有地點拼圖
                    </Text>
                  </Flex>
                )
              ) : (
                [0, 1, 2, 3].map((index) => (
                  <Flex
                    key={index}
                    minW="66px"
                    w="66px"
                    h="66px"
                    borderRadius="8px"
                    bgColor="#E4E0D2"
                    border="2px solid #B8AE9A"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text color="#988E7A" fontSize="12px">
                      小日獸
                    </Text>
                  </Flex>
                ))
              )}
            </Flex>
          )}
        </Flex>
        <Flex
          h="36px"
          mt="auto"
          bgColor={isRouteConnected ? "#9D7859" : "#BAA894"}
          color="white"
          borderRadius="8px"
          alignItems="center"
          justifyContent="center"
          cursor={isRouteConnected ? "pointer" : "not-allowed"}
          onClick={handleDeparture}
        >
          {isRouteConnected
            ? `出發（路線已接通，已配置 ${placedCount}）`
            : `尚未接通（已配置 ${placedCount}）`}
        </Flex>
      </Flex>

      <Flex h="62px" bgColor="#E7E2D6" borderTop="1px solid #D4CCBA">
        <Flex
          flex="1"
          alignItems="center"
          justifyContent="center"
          bgColor={activeTab === "place" ? "#A98362" : "transparent"}
          cursor="pointer"
          onClick={() => setActiveTab("place")}
        >
          <Text color={activeTab === "place" ? "white" : "#B4AB98"} fontWeight="700">
            地點
          </Text>
        </Flex>
        <Flex
          flex="1"
          alignItems="center"
          justifyContent="center"
          bgColor={activeTab === "route" ? "#A98362" : "transparent"}
          cursor={metroFirstStepActive ? "not-allowed" : "pointer"}
          opacity={metroFirstStepActive ? 0.55 : 1}
          onClick={() => {
            if (metroFirstStepActive) return;
            setActiveTab("route");
          }}
        >
          <Text color={activeTab === "route" ? "white" : "#B4AB98"} fontWeight="700">
            路徑
          </Text>
        </Flex>
        <Flex
          flex="1"
          alignItems="center"
          justifyContent="center"
          bgColor={activeTab === "pet" ? "#A98362" : "transparent"}
          cursor={metroFirstStepActive ? "not-allowed" : "pointer"}
          opacity={metroFirstStepActive ? 0.55 : 1}
          onClick={() => {
            if (metroFirstStepActive) return;
            setActiveTab("pet");
          }}
        >
          <Text color={activeTab === "pet" ? "white" : "#B4AB98"} fontWeight="700">
            小日獸
          </Text>
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-commute-laugh" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_COMMUTE_LAUGH_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_COMMUTE_LAUGH_EVENT_COPY.line}
          effectText={METRO_COMMUTE_LAUGH_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-backpack-hit" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_BACKPACK_HIT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-card-search" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_CARD_SEARCH_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_CARD_SEARCH_EVENT_COPY.line}
          effectText={METRO_CARD_SEARCH_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-kid-cry" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_KID_CRY_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-door-sprint" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_DOOR_SPRINT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
          showAvatar={false}
          speakerLabel={null}
          revealEffectAfterTyping
          line={METRO_DOOR_SPRINT_EVENT_COPY.line}
          effectText={METRO_DOOR_SPRINT_EVENT_COPY.effect}
          onFinish={() => {
            grantMetroPuzzleFragment();
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-pet-stroller" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_PET_STROLLER_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-milk-tea-shoes" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_MILK_TEA_SHOES_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-cute-bag-chat" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_CUTE_BAG_CHAT_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "metro-seat-spread" ? (
        <StreetNoChoiceEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          sceneTitle={METRO_SEAT_SPREAD_EVENT_COPY.sceneTitle}
          backgroundImage="/images/mrt_01.jpg"
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "breakfast-shop-choice" ? (
        <BreakfastShopEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
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
          }}
          onFinish={() => {
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "street-cat-treat" ? (
        <StreetCatTreatEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            grantInventoryItem("cat-treat");
            onProgressSaved?.();
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
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
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
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
            const parkEventPool: GameEventId[] = ["park-cat-grass", "park-gossip"];
            const randomIndex = Math.floor(Math.random() * parkEventPool.length);
            setActiveEventId(parkEventPool[randomIndex]);
          }}
          onFinish={() => {
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "park-cat-grass" ? (
        <ParkCatGrassEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            grantInventoryItem("cat-grass");
            onProgressSaved?.();
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {activeEventId === "park-gossip" ? (
        <ParkGossipEventModal
          savings={playerStatus.savings}
          actionPower={playerStatus.actionPower}
          fatigue={playerStatus.fatigue}
          onFinish={() => {
            setActiveEventId(null);
            setIsWorkTransitionOpen(true);
          }}
        />
      ) : null}

      {isWorkTransitionOpen ? (
        <WorkTransitionModal
          baseFatigue={playerStatus.fatigue}
          onFinish={(fatigueIncrease) => {
            onPlayerStatusChange((prev) => ({
              ...prev,
              fatigue: Math.max(0, prev.fatigue + fatigueIncrease),
            }));
            incrementWorkShiftCount();
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
            maxW="360px"
            minH="320px"
            borderRadius="12px"
            bgColor="#CFA67F"
            border="4px solid #E4D1BC"
            boxShadow="0 14px 30px rgba(0,0,0,0.3)"
            p="10px"
          >
            <Flex
              w="100%"
              borderRadius="8px"
              border="2px solid #9D7859"
              bgColor="#A37B58"
              direction="column"
              overflow="hidden"
            >
              <Flex flex="1" direction="column" px="16px" pt="16px" pb="14px" gap="10px">
                <Text color="#FFF4E8" fontSize="17px" lineHeight="1.4" textAlign="center" fontWeight="700">
                  {tutorialStep.title}
                </Text>
                <Flex
                  flex="1"
                  minH="160px"
                  borderRadius="8px"
                  border="1px solid rgba(255,255,255,0.28)"
                  bgColor="rgba(255,255,255,0.18)"
                  alignItems="center"
                  justifyContent="center"
                  overflow="hidden"
                >
                  <img
                    src={tutorialStep.imagePath}
                    alt={tutorialStep.title}
                    style={{ width: "100px", height: "auto", objectFit: "contain" }}
                  />
                </Flex>
                <Text color="white" fontSize="15px" lineHeight="1.6" textAlign="center" fontWeight="500">
                  {tutorialStep.description}
                </Text>
              </Flex>
              <Flex
                h="58px"
                borderTop="1px solid rgba(255,255,255,0.2)"
                bgColor="rgba(154,115,79,0.74)"
                alignItems="center"
                justifyContent="flex-end"
                px="18px"
                cursor="pointer"
                onClick={() => {
                  if (tutorialStepIndex < ARRANGE_ROUTE_TUTORIAL_STEPS.length - 1) {
                    setTutorialStepIndex((prev) => prev + 1);
                    return;
                  }
                  setIsTutorialModalOpen(false);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(ARRANGE_ROUTE_TUTORIAL_SEEN_KEY, "1");
                  }
                }}
              >
                <Text color="#F8EFE4" fontSize="18px" fontWeight="500">
                  ☝︎ 點擊繼續（{tutorialStepIndex + 1}/{ARRANGE_ROUTE_TUTORIAL_STEPS.length}）
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

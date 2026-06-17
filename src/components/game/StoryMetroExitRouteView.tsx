"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import {
  StoryRouteDragPreviewLayer,
  StoryRoutePuzzleBoardTile,
  useStoryRoutePointerDrag,
} from "@/components/game/StoryRoutePuzzleKit";
import type { GameEventId } from "@/lib/game/events";
import { recordArrangeRouteDeparture } from "@/lib/game/playerProgress";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { ROUTES } from "@/lib/routes";

type MetroExitDirection = "top" | "right" | "bottom" | "left";
type MetroExitConnector = Record<MetroExitDirection, boolean>;
type MetroExitTileId =
  | "narrow-straight"
  | "horizontal"
  | "corner-up-right"
  | "corner-up-left"
  | "corner-bottom-right"
  | "corner-bottom-left";
type MetroExitDestinationId = "exit-1" | "exit-2" | "exit-3" | "exit-4" | "exit-8";
type MetroExitFixedCellType = "start" | "toggle" | "way01" | "way02" | "way03" | MetroExitDestinationId;
type MetroExitDepartureStage = "idle" | "closing" | "lighting" | "flipping" | "departing";

type MetroExitTileChoice = {
  id: MetroExitTileId;
  label: string;
  imagePath: string;
  alt: string;
  connector: MetroExitConnector;
  rotationDeg?: number;
};

type MetroExitDestination = {
  id: MetroExitDestinationId;
  label: string;
  shortLabel: string;
  resultLabel: string;
  eventId: GameEventId;
  color: string;
  frontImagePath: string;
  backImagePath: string;
  backAlt: string;
};

const METRO_EXIT_BOARD_COLS = 4;
const METRO_EXIT_BOARD_ROWS = 5;
const METRO_EXIT_CELL_COUNT = METRO_EXIT_BOARD_COLS * METRO_EXIT_BOARD_ROWS;
const METRO_EXIT_CELL_SIZE_PX = 88;
const METRO_EXIT_BOARD_GAP_PX = 2;
const METRO_EXIT_BORDER_COLOR = "rgba(255,255,255,0.72)";
const METRO_EXIT_BORDER_ACTIVE_COLOR = "rgba(255,255,255,0.92)";

const METRO_EXIT_START_CELL = 16;
const METRO_EXIT_TOGGLE_CELL = 9;
const METRO_EXIT_WAY_CELLS = {
  way01: 7,
  way02: 17,
  way03: 11,
} as const;
const METRO_EXIT_DESTINATION_CELLS: Record<MetroExitDestinationId, number> = {
  "exit-1": 18,
  "exit-2": 3,
  "exit-3": 1,
  "exit-4": 2,
  "exit-8": 19,
};
const METRO_EXIT_FIXED_CELL_TYPES: Partial<Record<number, MetroExitFixedCellType>> = {
  [METRO_EXIT_DESTINATION_CELLS["exit-3"]]: "exit-3",
  [METRO_EXIT_DESTINATION_CELLS["exit-4"]]: "exit-4",
  [METRO_EXIT_DESTINATION_CELLS["exit-2"]]: "exit-2",
  [METRO_EXIT_WAY_CELLS.way01]: "way01",
  [METRO_EXIT_TOGGLE_CELL]: "toggle",
  [METRO_EXIT_WAY_CELLS.way03]: "way03",
  [METRO_EXIT_START_CELL]: "start",
  [METRO_EXIT_WAY_CELLS.way02]: "way02",
  [METRO_EXIT_DESTINATION_CELLS["exit-1"]]: "exit-1",
  [METRO_EXIT_DESTINATION_CELLS["exit-8"]]: "exit-8",
};

const METRO_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight.png";
const METRO_NARROW_TO_WIDE_IMAGE_PATH = "/images/route/route_new/narrow_to_wide_捷運.png";
const SPECIAL_NORMAL_CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const MRT_EXIT_IMAGE_BASE = "/images/route/mrt_exit";
const MRT_EXIT_ASSETS = {
  exit1Front: `${MRT_EXIT_IMAGE_BASE}/top＿exit1.png`,
  exit1Back: `${MRT_EXIT_IMAGE_BASE}/exit1_place_mart.png`,
  exit2Front: `${MRT_EXIT_IMAGE_BASE}/right_exit2.png`,
  exit2Back: `${MRT_EXIT_IMAGE_BASE}/exit2_place_.png`,
  exit3Front: `${MRT_EXIT_IMAGE_BASE}/left_exit3.png`,
  exit3Back: `${MRT_EXIT_IMAGE_BASE}/exit3_place_park.png`,
  exit4Front: `${MRT_EXIT_IMAGE_BASE}/top＿exit4.png`,
  exit4Back: `${MRT_EXIT_IMAGE_BASE}/exit4_place_breakfast.png`,
  exit8Front: `${MRT_EXIT_IMAGE_BASE}/right_exit8.png`,
  exit8Back: `${MRT_EXIT_IMAGE_BASE}/exit8_park_8.png`,
  straightToggleClose: `${MRT_EXIT_IMAGE_BASE}/straight_toggle_close.png`,
  straightToggleOpen: `${MRT_EXIT_IMAGE_BASE}/straight_toggle_open.png`,
  way01Close: `${MRT_EXIT_IMAGE_BASE}/way01_close.png`,
  way01Open: `${MRT_EXIT_IMAGE_BASE}/way01_open.png`,
  way02: `${MRT_EXIT_IMAGE_BASE}/way02.png`,
  way03: `${MRT_EXIT_IMAGE_BASE}/way03.png`,
} as const;

const METRO_EXIT_OPPOSITE: Record<MetroExitDirection, MetroExitDirection> = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};
const METRO_EXIT_NEIGHBORS: Record<MetroExitDirection, { dr: number; dc: number }> = {
  top: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  bottom: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};

const METRO_EXIT_TILE_CHOICES: MetroExitTileChoice[] = [
  {
    id: "narrow-straight",
    label: "直路",
    imagePath: METRO_STRAIGHT_IMAGE_PATH,
    alt: "直路拼圖",
    connector: { top: true, right: false, bottom: true, left: false },
  },
  {
    id: "horizontal",
    label: "橫路",
    imagePath: METRO_STRAIGHT_IMAGE_PATH,
    alt: "橫路拼圖",
    connector: { top: false, right: true, bottom: false, left: true },
    rotationDeg: 90,
  },
  {
    id: "corner-up-right",
    label: "右上轉",
    imagePath: SPECIAL_NORMAL_CORNER_IMAGE_PATH,
    alt: "右上轉角拼圖",
    connector: { top: true, right: true, bottom: false, left: false },
    rotationDeg: 90,
  },
  {
    id: "corner-up-left",
    label: "左上轉",
    imagePath: SPECIAL_NORMAL_CORNER_IMAGE_PATH,
    alt: "左上轉角拼圖",
    connector: { top: true, right: false, bottom: false, left: true },
    rotationDeg: 0,
  },
  {
    id: "corner-bottom-right",
    label: "右下轉",
    imagePath: SPECIAL_NORMAL_CORNER_IMAGE_PATH,
    alt: "右下轉角拼圖",
    connector: { top: false, right: true, bottom: true, left: false },
    rotationDeg: 180,
  },
  {
    id: "corner-bottom-left",
    label: "左下轉",
    imagePath: SPECIAL_NORMAL_CORNER_IMAGE_PATH,
    alt: "左下轉角拼圖",
    connector: { top: false, right: false, bottom: true, left: true },
    rotationDeg: -90,
  },
];
const METRO_EXIT_TRAY_TILE_IDS: MetroExitTileId[] = [
  "narrow-straight",
  "corner-up-right",
];
const METRO_EXIT_CORNER_ROTATION_ORDER: MetroExitTileId[] = [
  "corner-up-right",
  "corner-bottom-right",
  "corner-bottom-left",
  "corner-up-left",
];
const METRO_EXIT_DESTINATION_PRIORITY: MetroExitDestinationId[] = [
  "exit-8",
  "exit-2",
  "exit-4",
  "exit-1",
  "exit-3",
];

const METRO_EXIT_DESTINATIONS: Record<MetroExitDestinationId, MetroExitDestination> = {
  "exit-1": {
    id: "exit-1",
    label: "1號出口",
    shortLabel: "1號",
    resultLabel: "便利商店",
    eventId: "convenience-store-hub",
    color: "#4D7B6F",
    frontImagePath: MRT_EXIT_ASSETS.exit1Front,
    backImagePath: MRT_EXIT_ASSETS.exit1Back,
    backAlt: "1號出口附近的便利商店",
  },
  "exit-2": {
    id: "exit-2",
    label: "2號出口",
    shortLabel: "2號",
    resultLabel: "街道路口",
    eventId: "street-comfy-breeze",
    color: "#8E7A62",
    frontImagePath: MRT_EXIT_ASSETS.exit2Front,
    backImagePath: MRT_EXIT_ASSETS.exit2Back,
    backAlt: "2號出口附近的街道路口",
  },
  "exit-3": {
    id: "exit-3",
    label: "3號出口",
    shortLabel: "3號",
    resultLabel: "公園",
    eventId: "park-hub",
    color: "#607C67",
    frontImagePath: MRT_EXIT_ASSETS.exit3Front,
    backImagePath: MRT_EXIT_ASSETS.exit3Back,
    backAlt: "3號出口附近的公園",
  },
  "exit-4": {
    id: "exit-4",
    label: "4號出口",
    shortLabel: "4號",
    resultLabel: "早餐店",
    eventId: "breakfast-shop-choice",
    color: "#A47758",
    frontImagePath: MRT_EXIT_ASSETS.exit4Front,
    backImagePath: MRT_EXIT_ASSETS.exit4Back,
    backAlt: "4號出口附近的早餐店",
  },
  "exit-8": {
    id: "exit-8",
    label: "8號出口",
    shortLabel: "8號",
    resultLabel: "公園深處",
    eventId: "park-gossip",
    color: "#556C7B",
    frontImagePath: MRT_EXIT_ASSETS.exit8Front,
    backImagePath: MRT_EXIT_ASSETS.exit8Back,
    backAlt: "8號出口附近的公園線索",
  },
};

const metroExitPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(93, 164, 146, 0.0); }
  50% { box-shadow: 0 0 0 6px rgba(93, 164, 146, 0.22); }
`;

const metroExitDepartIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

function getMetroExitTileChoice(tileId: MetroExitTileId | undefined) {
  return METRO_EXIT_TILE_CHOICES.find((choice) => choice.id === tileId) ?? null;
}

function isMetroExitCornerTileId(tileId: MetroExitTileId | undefined) {
  return Boolean(tileId && METRO_EXIT_CORNER_ROTATION_ORDER.includes(tileId));
}

function isMetroExitRotatableTileId(tileId: MetroExitTileId | undefined) {
  return tileId === "narrow-straight" || tileId === "horizontal" || isMetroExitCornerTileId(tileId);
}

function isMetroExitDestinationType(type: MetroExitFixedCellType): type is MetroExitDestinationId {
  return type.startsWith("exit-");
}

function rotateMetroExitTileId(tileId: MetroExitTileId) {
  if (tileId === "narrow-straight") return "horizontal";
  if (tileId === "horizontal") return "narrow-straight";
  const currentIndex = METRO_EXIT_CORNER_ROTATION_ORDER.indexOf(tileId);
  if (currentIndex < 0) return tileId;
  return METRO_EXIT_CORNER_ROTATION_ORDER[
    (currentIndex + 1) % METRO_EXIT_CORNER_ROTATION_ORDER.length
  ];
}

function metroExitIndexToPos(index: number) {
  return {
    r: Math.floor(index / METRO_EXIT_BOARD_COLS),
    c: index % METRO_EXIT_BOARD_COLS,
  };
}

function metroExitPosToIndex(r: number, c: number) {
  return r * METRO_EXIT_BOARD_COLS + c;
}

function isMetroExitPlaceableCell(index: number) {
  return index >= 0 && index < METRO_EXIT_CELL_COUNT && !METRO_EXIT_FIXED_CELL_TYPES[index];
}

function getMetroExitFixedConnector(index: number, isWay01Open: boolean): MetroExitConnector | null {
  const fixedType = METRO_EXIT_FIXED_CELL_TYPES[index];
  if (!fixedType) return null;

  switch (fixedType) {
    case "start":
      return { top: true, right: false, bottom: false, left: false };
    case "toggle":
      return { top: false, right: true, bottom: false, left: true };
    case "way01":
      return isWay01Open ? { top: false, right: false, bottom: false, left: true } : null;
    case "way02":
      return { top: true, right: false, bottom: false, left: false };
    case "way03":
      return { top: false, right: true, bottom: false, left: true };
    case "exit-1":
      return { top: true, right: false, bottom: false, left: false };
    case "exit-3":
      return { top: false, right: false, bottom: true, left: true };
    case "exit-2":
    case "exit-4":
    case "exit-8":
      return null;
    default:
      return null;
  }
}

function getMetroExitConnectorAtCell(
  index: number,
  placedTiles: Record<number, MetroExitTileId>,
  isWay01Open: boolean,
) {
  const fixedConnector = getMetroExitFixedConnector(index, isWay01Open);
  if (fixedConnector) return fixedConnector;
  const tileChoice = getMetroExitTileChoice(placedTiles[index]);
  return tileChoice?.connector ?? null;
}

function getReachableMetroExitCells(
  placedTiles: Record<number, MetroExitTileId>,
  isWay01Open: boolean,
) {
  const visited = new Set<number>([METRO_EXIT_START_CELL]);
  const queue = [METRO_EXIT_START_CELL];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentConnector = getMetroExitConnectorAtCell(current, placedTiles, isWay01Open);
    if (!currentConnector) continue;
    const { r, c } = metroExitIndexToPos(current);

    (Object.keys(METRO_EXIT_NEIGHBORS) as MetroExitDirection[]).forEach((direction) => {
      if (!currentConnector[direction]) return;
      const neighborOffset = METRO_EXIT_NEIGHBORS[direction];
      const nr = r + neighborOffset.dr;
      const nc = c + neighborOffset.dc;
      if (nr < 0 || nr >= METRO_EXIT_BOARD_ROWS || nc < 0 || nc >= METRO_EXIT_BOARD_COLS) {
        return;
      }
      const neighborIndex = metroExitPosToIndex(nr, nc);
      if (visited.has(neighborIndex)) return;
      const neighborConnector = getMetroExitConnectorAtCell(
        neighborIndex,
        placedTiles,
        isWay01Open,
      );
      if (!neighborConnector?.[METRO_EXIT_OPPOSITE[direction]]) return;
      visited.add(neighborIndex);
      queue.push(neighborIndex);
    });
  }

  return visited;
}

function getMetroExitReachableDestinationIds(
  reachableCells: Set<number>,
  isWay01Open: boolean,
) {
  const destinationIds = new Set<MetroExitDestinationId>();

  if (reachableCells.has(METRO_EXIT_DESTINATION_CELLS["exit-1"])) destinationIds.add("exit-1");
  if (reachableCells.has(METRO_EXIT_DESTINATION_CELLS["exit-3"])) destinationIds.add("exit-3");
  if (reachableCells.has(METRO_EXIT_WAY_CELLS.way02)) destinationIds.add("exit-4");
  if (reachableCells.has(METRO_EXIT_WAY_CELLS.way03)) destinationIds.add("exit-2");
  if (isWay01Open && reachableCells.has(METRO_EXIT_WAY_CELLS.way01)) destinationIds.add("exit-8");

  return METRO_EXIT_DESTINATION_PRIORITY.filter((destinationId) =>
    destinationIds.has(destinationId),
  );
}

function resolveMetroExitDestination(
  reachableDestinationIds: MetroExitDestinationId[],
): MetroExitDestination | null {
  const destinationId = METRO_EXIT_DESTINATION_PRIORITY.find((id) =>
    reachableDestinationIds.includes(id),
  );
  return destinationId ? METRO_EXIT_DESTINATIONS[destinationId] : null;
}

function getMetroExitPlacementHint(tileId: MetroExitTileId) {
  return isMetroExitRotatableTileId(tileId) ? "點拼圖可旋轉方向。" : "路線已放上。";
}

function MetroExitRouteTileVisual({
  tile,
  isConnected = false,
  isLit = false,
  isPlaced = false,
}: {
  tile: MetroExitTileChoice;
  isConnected?: boolean;
  isLit?: boolean;
  isPlaced?: boolean;
}) {
  const isCorner = tile.id.startsWith("corner");
  const isHorizontal = tile.id === "horizontal";
  const shouldFillCell = isConnected || isPlaced;
  return (
    <Flex
      position="relative"
      w={shouldFillCell ? "100%" : "90%"}
      h={shouldFillCell ? "100%" : "90%"}
      borderRadius={isConnected ? "0" : "7px"}
      overflow="hidden"
      bgColor="#D5E8B7"
      border={shouldFillCell ? "0" : `2px solid ${METRO_EXIT_BORDER_COLOR}`}
      alignItems="center"
      justifyContent="center"
      boxShadow={isLit ? "0 0 0 4px rgba(255,226,123,0.24)" : "none"}
      transform={isConnected ? "scale(1.018)" : "scale(1)"}
      transition="width 420ms cubic-bezier(0.22, 1, 0.36, 1), height 420ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 420ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
    >
      <Image
        src={tile.imagePath}
        alt={tile.alt}
        w="100%"
        h="100%"
        objectFit="cover"
        draggable={false}
        transform={isCorner || isHorizontal ? `rotate(${tile.rotationDeg ?? 0}deg)` : undefined}
      />
    </Flex>
  );
}

function MetroExitFlippingImage({
  destination,
  isFlipped,
}: {
  destination: MetroExitDestination;
  isFlipped: boolean;
}) {
  return (
    <Box position="absolute" inset="0" style={{ perspective: "720px" }}>
      <Box
        position="absolute"
        inset="0"
        transition="transform 300ms ease"
        transform={isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"}
        style={{ transformStyle: "preserve-3d" }}
      >
        <Image
          src={destination.frontImagePath}
          alt={destination.label}
          position="absolute"
          inset="0"
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
          style={{ backfaceVisibility: "hidden" }}
        />
        <Image
          src={destination.backImagePath}
          alt={destination.backAlt}
          position="absolute"
          inset="0"
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
          transform="rotateY(180deg)"
          style={{ backfaceVisibility: "hidden" }}
        />
      </Box>
    </Box>
  );
}

function MetroExitFixedCell({
  type,
  isWay01Open = false,
  isToggleReached = false,
  isFlipped = false,
  isReachable = false,
  isLit = false,
  isConnected = false,
}: {
  type: MetroExitFixedCellType;
  isWay01Open?: boolean;
  isToggleReached?: boolean;
  isFlipped?: boolean;
  isReachable?: boolean;
  isLit?: boolean;
  isConnected?: boolean;
}) {
  const isActive = isReachable || isLit;
  const borderColor = isActive ? METRO_EXIT_BORDER_ACTIVE_COLOR : METRO_EXIT_BORDER_COLOR;
  const borderWidth = isActive ? "3px" : "2px";
  const cellBorder = isConnected && !isLit ? "0" : `${borderWidth} solid ${borderColor}`;
  const cellRadius = isConnected ? "0" : "8px";

  if (type === "start") {
    return (
      <Flex position="relative" w="100%" h="100%" overflow="hidden" borderRadius={cellRadius}>
        <Image
          src={METRO_NARROW_TO_WIDE_IMAGE_PATH}
          alt="月台起點"
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
        />
        <Flex
          position="absolute"
          left="4px"
          right="4px"
          bottom="4px"
          h="22px"
          borderRadius="999px"
          bgColor="rgba(80, 93, 108, 0.88)"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="#FFFFFF" fontSize="12px" fontWeight="900" lineHeight="1">
            月台
          </Text>
        </Flex>
      </Flex>
    );
  }

  if (type === "toggle") {
    return (
      <Flex
        position="relative"
        w="100%"
        h="100%"
        borderRadius={cellRadius}
        border={cellBorder}
        overflow="hidden"
        bgColor="#C5DD9C"
        boxShadow={isActive && !isConnected ? "0 0 0 4px rgba(255,226,123,0.28)" : "none"}
        animation={isActive ? `${metroExitPulse} 1.2s ease-in-out infinite` : undefined}
      >
        <Image
          src={isToggleReached ? MRT_EXIT_ASSETS.straightToggleOpen : MRT_EXIT_ASSETS.straightToggleClose}
          alt="通過後會亮起的橫向開關道路"
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
        />
      </Flex>
    );
  }

  if (type === "way01" || type === "way02" || type === "way03") {
    const imagePath =
      type === "way01"
        ? isWay01Open
          ? MRT_EXIT_ASSETS.way01Open
          : MRT_EXIT_ASSETS.way01Close
        : type === "way02"
          ? MRT_EXIT_ASSETS.way02
          : MRT_EXIT_ASSETS.way03;
    const alt =
      type === "way01"
        ? "連到8號出口的機關道路"
        : type === "way02"
          ? "通往4號出口的道路"
          : "通往2號出口的道路";

    return (
      <Flex
        position="relative"
        w="100%"
        h="100%"
        borderRadius={cellRadius}
        border={cellBorder}
        overflow="hidden"
        bgColor="#C5DD9C"
        boxShadow={isActive && !isConnected ? "0 0 0 4px rgba(255,226,123,0.24)" : "none"}
      >
        <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" draggable={false} />
        {type === "way01" && !isWay01Open ? (
          <Box position="absolute" inset="0" bgColor="rgba(83, 73, 60, 0.08)" />
        ) : null}
      </Flex>
    );
  }

  const destination = METRO_EXIT_DESTINATIONS[type];

  return (
    <Flex
      position="relative"
      w="100%"
      h="100%"
      borderRadius={cellRadius}
      border="0"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      bgColor="#C5DD9C"
      boxShadow={isActive || isFlipped ? "0 0 0 4px rgba(255,226,123,0.24)" : "none"}
    >
      <MetroExitFlippingImage destination={destination} isFlipped={isFlipped} />
    </Flex>
  );
}

function MetroExitTrayTile({
  tile,
  isSelected,
  onClick,
  onPointerDown,
}: {
  tile: MetroExitTileChoice;
  isSelected: boolean;
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      direction="column"
      alignItems="center"
      p="0"
      bg="transparent"
      border="0"
      cursor="pointer"
      transform={isSelected ? "translateY(-2px)" : "translateY(0)"}
      transition="transform 140ms ease"
      onClick={onClick}
      onPointerDown={onPointerDown}
      touchAction="none"
      userSelect="none"
      aria-pressed={isSelected}
    >
      <Flex
        w="62px"
        h="62px"
        borderRadius="8px"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255,249,239,0.82)"}
        boxShadow={
          isSelected
            ? "0 8px 14px rgba(83,197,213,0.2), 0 5px 10px rgba(92,63,38,0.12)"
            : "0 4px 8px rgba(92,63,38,0.12)"
        }
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <MetroExitRouteTileVisual tile={tile} />
      </Flex>
    </Flex>
  );
}

function MetroExitDepartureOverlay({ destination }: { destination: MetroExitDestination }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={90}
      direction="column"
      bgColor="rgba(247, 240, 230, 0.96)"
      alignItems="center"
      justifyContent="center"
      gap="18px"
      animation={`${metroExitDepartIn} 220ms ease-out both`}
    >
      <Flex
        w="118px"
        h="118px"
        borderRadius="24px"
        bgColor={destination.color}
        border="4px solid #FFFFFF"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        boxShadow="0 16px 28px rgba(92,63,38,0.18)"
      >
        <Image src={destination.backImagePath} alt={destination.backAlt} w="100%" h="100%" objectFit="cover" />
      </Flex>
      <Flex direction="column" alignItems="center" gap="6px">
        <Text color="#6F513B" fontSize="18px" fontWeight="900" lineHeight="1">
          正在前往
        </Text>
        <Text color="#4D7B6F" fontSize="28px" fontWeight="900" lineHeight="1.1">
          {destination.resultLabel}
        </Text>
      </Flex>
    </Flex>
  );
}

export function StoryMetroExitRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [selectedTileId, setSelectedTileId] = useState<MetroExitTileId | null>("narrow-straight");
  const [placedTiles, setPlacedTiles] = useState<Record<number, MetroExitTileId>>({});
  const [hint, setHint] = useState("從月台接出一條路。");
  const [departingDestination, setDepartingDestination] = useState<MetroExitDestination | null>(null);
  const [departureStage, setDepartureStage] = useState<MetroExitDepartureStage>("idle");
  const departTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearDepartureTimers = useCallback(() => {
    departTimerRefs.current.forEach((timer) => clearTimeout(timer));
    departTimerRefs.current = [];
  }, []);

  useEffect(
    () => () => {
      clearDepartureTimers();
    },
    [clearDepartureTimers],
  );

  const selectedTile = getMetroExitTileChoice(selectedTileId ?? undefined);
  const baseReachableCells = useMemo(
    () => getReachableMetroExitCells(placedTiles, false),
    [placedTiles],
  );
  const isToggleReached = baseReachableCells.has(METRO_EXIT_TOGGLE_CELL);
  const isWay01Open = isToggleReached;
  const reachableCells = useMemo(
    () => getReachableMetroExitCells(placedTiles, isWay01Open),
    [isWay01Open, placedTiles],
  );
  const reachableDestinationIds = useMemo(
    () => getMetroExitReachableDestinationIds(reachableCells, isWay01Open),
    [isWay01Open, reachableCells],
  );
  const destination = resolveMetroExitDestination(reachableDestinationIds);
  const isDeparting = departureStage !== "idle";
  const isRouteMerging = departureStage === "closing" || departureStage === "lighting" || departureStage === "flipping" || departureStage === "departing";
  const isRouteLit = departureStage === "lighting" || departureStage === "flipping" || departureStage === "departing";
  const shouldShowDepartureOverlay = departureStage === "departing" && Boolean(departingDestination);

  const placeTileAtCell = useCallback((tileId: MetroExitTileId, cellIndex: number) => {
    if (!isMetroExitPlaceableCell(cellIndex)) return false;
    setPlacedTiles((current) => ({
      ...current,
      [cellIndex]: tileId,
    }));
    setHint(getMetroExitPlacementHint(tileId));
    return true;
  }, []);

  const removeTileAtCell = useCallback((cellIndex: number) => {
    setPlacedTiles((current) => {
      if (!current[cellIndex]) return current;
      const next = { ...current };
      delete next[cellIndex];
      return next;
    });
    setHint("已拿掉拼圖，可以重新安排出口方向。");
  }, []);

  const rotateTileAtCell = useCallback((cellIndex: number) => {
    setPlacedTiles((current) => {
      const tileId = current[cellIndex];
      if (!isMetroExitRotatableTileId(tileId)) return current;
      return {
        ...current,
        [cellIndex]: rotateMetroExitTileId(tileId),
      };
    });
    setHint("拼圖轉向了。");
  }, []);

  const drag = useStoryRoutePointerDrag<
    { source: "tray" | "cell"; tileId: MetroExitTileId; cellIndex?: number },
    string
  >({
    disabled: isDeparting,
    onDragStart: (payload) => {
      setSelectedTileId(payload.tileId);
      setHint(payload.source === "tray" ? "把拼圖拖到捷運站空格裡。" : "拖回下方拼圖區可以拿掉。");
    },
    onDrop: (payload, target) => {
      const cellPrefix = "metro-exit-cell-";
      if (target?.startsWith(cellPrefix)) {
        const targetCell = Number(target.slice(cellPrefix.length));
        if (!Number.isInteger(targetCell) || !isMetroExitPlaceableCell(targetCell)) {
          return;
        }
        setPlacedTiles((current) => {
          const next = { ...current };
          if (payload.source === "cell" && typeof payload.cellIndex === "number") {
            delete next[payload.cellIndex];
          }
          next[targetCell] = payload.tileId;
          return next;
        });
        setHint(getMetroExitPlacementHint(payload.tileId));
        return;
      }

      if (
        target === "metro-exit-remove" &&
        payload.source === "cell" &&
        typeof payload.cellIndex === "number"
      ) {
        removeTileAtCell(payload.cellIndex);
      }
    },
  });

  const statusText = (() => {
    if (departureStage === "closing") return "路線接合中。";
    if (departureStage === "lighting") return "出口亮起了。";
    if (departureStage === "flipping") return "出口翻面。";
    if (departureStage === "departing" && departingDestination) {
      return `${departingDestination.shortLabel}｜${departingDestination.resultLabel}`;
    }
    if (destination) return `${destination.shortLabel}｜${destination.resultLabel}`;
    if (isWay01Open) return "way01 已開啟。";
    if (isToggleReached) return "開關亮起了。";
    return hint || "路線還沒接到出口。";
  })();

  const startDeparture = () => {
    if (!destination) {
      setHint("還沒接到出口。");
      return;
    }

    setHint("");
    setDepartingDestination(destination);
    setDepartureStage("closing");
    recordArrangeRouteDeparture();
    onProgressSaved?.();

    clearDepartureTimers();
    const scheduleDepartureStep = (callback: () => void, delayMs: number) => {
      const timer = setTimeout(callback, delayMs);
      departTimerRefs.current.push(timer);
    };

    scheduleDepartureStep(() => setDepartureStage("lighting"), 420);
    scheduleDepartureStep(() => setDepartureStage("flipping"), 980);
    scheduleDepartureStep(() => setDepartureStage("departing"), 1550);
    scheduleDepartureStep(() => {
      router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${destination.eventId}`));
    }, 2250);
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
      <StoryRouteDragPreviewLayer
        dragState={drag.dragState}
        renderPreview={(payload) => {
          const tile = getMetroExitTileChoice(payload.tileId);
          return tile ? <MetroExitRouteTileVisual tile={tile} /> : null;
        }}
      />

      <Flex h="50px" flexShrink={0} bgColor="#6F7E8B" alignItems="center" px="18px" justifyContent="space-between">
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          捷運出口
        </Text>
        <Text color="#FDEBC9" fontSize="12px" fontWeight="900" lineHeight="1">
          出口接線
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap="12px"
        px="4px"
        py="10px"
        bgColor="#E9F0E7"
        backgroundImage="linear-gradient(0deg, rgba(255,255,255,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)"
        backgroundSize="28px 28px"
        data-story-route-drop-target="metro-exit-remove"
      >
        <Grid
          templateColumns={`repeat(${METRO_EXIT_BOARD_COLS}, ${METRO_EXIT_CELL_SIZE_PX}px)`}
          templateRows={`repeat(${METRO_EXIT_BOARD_ROWS}, ${METRO_EXIT_CELL_SIZE_PX}px)`}
          gap={isRouteMerging ? "0px" : `${METRO_EXIT_BOARD_GAP_PX}px`}
          transition="gap 420ms cubic-bezier(0.22, 1, 0.36, 1)"
        >
          {Array.from({ length: METRO_EXIT_CELL_COUNT }, (_, cellIndex) => {
            const placedTile = getMetroExitTileChoice(placedTiles[cellIndex]);
            const isReachable = reachableCells.has(cellIndex);
            const fixedType = METRO_EXIT_FIXED_CELL_TYPES[cellIndex] ?? null;
            const isPlaceable = isMetroExitPlaceableCell(cellIndex);
            const isDestination = Boolean(fixedType && isMetroExitDestinationType(fixedType));
            const isTargetDepartureDestination = Boolean(
              fixedType &&
                isMetroExitDestinationType(fixedType) &&
                departingDestination?.id === fixedType,
            );
            const isFlipped =
              isTargetDepartureDestination &&
              (departureStage === "flipping" || departureStage === "departing");
            const isDestinationLit = isTargetDepartureDestination && isRouteLit;
            const fixedReachable = isDestination ? isDestinationLit : isReachable;
            const shouldConnectCell = isRouteMerging && isReachable;
            const shouldHideUnrelatedPlacedTile = Boolean(isRouteMerging && placedTile && !isReachable);
            const shouldHideUnusedFixedCell = Boolean(
              isRouteMerging && fixedType && !isReachable && !isTargetDepartureDestination,
            );
            const shouldHideUnusedCell = Boolean(
              isRouteMerging && !isReachable && !isTargetDepartureDestination,
            );

            return (
              <StoryRoutePuzzleBoardTile
                key={cellIndex}
                size={`${METRO_EXIT_CELL_SIZE_PX}px`}
                isEmpty={!placedTile && !fixedType}
                isActive={!isRouteMerging && (Boolean(placedTile) || (Boolean(selectedTile) && isPlaceable))}
                isConnected={shouldConnectCell || shouldHideUnusedCell}
                emptyBorderColor="rgba(255,255,255,0.64)"
                activeOutlineColor="rgba(255,255,255,0.72)"
                dropTarget={isPlaceable ? `metro-exit-cell-${cellIndex}` : undefined}
                cursor={
                  isDeparting
                    ? "default"
                    : placedTile
                      ? "grab"
                      : selectedTile && isPlaceable
                        ? "pointer"
                        : "default"
                }
                onClick={
                  isDeparting
                    ? undefined
                    : () => {
                        if (placedTile) {
                          if (isMetroExitRotatableTileId(placedTile.id)) {
                            rotateTileAtCell(cellIndex);
                            return;
                          }
                          removeTileAtCell(cellIndex);
                          return;
                        }
                        if (!selectedTile || !isPlaceable) return;
                        placeTileAtCell(selectedTile.id, cellIndex);
                      }
                }
              >
                {fixedType ? (
                  <Flex
                    w="100%"
                    h="100%"
                    opacity={shouldHideUnusedFixedCell ? 0 : 1}
                    transform={shouldHideUnusedFixedCell ? "scale(0.86)" : "scale(1)"}
                    transition="opacity 240ms ease, transform 280ms ease"
                  >
                    <MetroExitFixedCell
                      type={fixedType}
                      isWay01Open={isWay01Open}
                      isToggleReached={isToggleReached}
                      isFlipped={isFlipped}
                      isReachable={fixedReachable}
                      isLit={isDestinationLit}
                      isConnected={shouldConnectCell}
                    />
                  </Flex>
                ) : placedTile ? (
                  <Flex
                    w="100%"
                    h="100%"
                    alignItems="center"
                    justifyContent="center"
                    touchAction="none"
                    userSelect="none"
                    opacity={shouldHideUnrelatedPlacedTile ? 0 : 1}
                    transform={shouldHideUnrelatedPlacedTile ? "scale(0.86)" : "scale(1)"}
                    transition="opacity 180ms ease, transform 220ms ease"
                    onPointerDown={(event) =>
                      drag.startDrag(
                        event,
                        {
                          source: "cell",
                          tileId: placedTile.id,
                          cellIndex,
                        },
                        { size: 88 },
                      )
                    }
                  >
                    <MetroExitRouteTileVisual
                      tile={placedTile}
                      isPlaced
                      isConnected={isRouteMerging && isReachable}
                      isLit={isRouteLit && isReachable}
                    />
                  </Flex>
                ) : null}
              </StoryRoutePuzzleBoardTile>
            );
          })}
        </Grid>
      </Flex>

      <Flex
        minH="166px"
        maxH="166px"
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(111,126,139,0.16)"
      >
        <Flex
          h="28px"
          px="14px"
          alignItems="center"
          justifyContent="center"
          bgColor="#E5EBE2"
          borderBottom="1px solid rgba(111,126,139,0.14)"
        >
          <Text color="#6F7E8B" fontSize="12px" fontWeight="900" lineHeight="1.35" textAlign="center">
            點已放上的拼圖可旋轉
          </Text>
        </Flex>
        <Grid
          flex="1"
          minH="0"
          templateColumns="repeat(2, 82px)"
          gap="8px"
          px="14px"
          py="10px"
          alignContent="center"
          justifyContent="center"
          data-story-route-drop-target="metro-exit-remove"
        >
          {METRO_EXIT_TRAY_TILE_IDS.map((tileId) => getMetroExitTileChoice(tileId)).filter(Boolean).map((tile) => (
            <MetroExitTrayTile
              key={tile!.id}
              tile={tile!}
              isSelected={selectedTileId === tile!.id}
              onClick={() => {
                setSelectedTileId(tile!.id);
                setHint("放上後點拼圖可旋轉。");
              }}
              onPointerDown={(event) =>
                drag.startDrag(event, { source: "tray", tileId: tile!.id }, { size: 74 })
              }
            />
          ))}
        </Grid>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#6F7E8B"
        alignItems="center"
        justifyContent="space-between"
        px="18px"
        py="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
        gap="12px"
      >
        <Text color="#FFFFFF" fontSize="13px" fontWeight="900" lineHeight="1.35" flex="1">
          {statusText}
        </Text>
        <Flex
          as="button"
          w="112px"
          h="42px"
          borderRadius="999px"
          bgColor="white"
          color="#5F6F7A"
          fontSize="18px"
          fontWeight="900"
          alignItems="center"
          justifyContent="center"
          cursor={destination && !isDeparting ? "pointer" : "not-allowed"}
          opacity={destination || isDeparting ? 1 : 0.5}
          pointerEvents={isDeparting ? "none" : "auto"}
          onClick={startDeparture}
        >
          出發
        </Flex>
      </Flex>

      {shouldShowDepartureOverlay && departingDestination ? (
        <MetroExitDepartureOverlay destination={departingDestination} />
      ) : null}
    </Flex>
  );
}

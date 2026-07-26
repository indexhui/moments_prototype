"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const CHASE_SPRITE_ATLAS = "/images/office-chase/chase-sprites-v3.png";

const STAGE_WIDTH = 360;
const HUD_HEIGHT = 62;
const GRID_COLUMNS = 12;
const GRID_ROWS = 17;
const CELL_SIZE = STAGE_WIDTH / GRID_COLUMNS;
const STAGE_HEIGHT = HUD_HEIGHT + GRID_ROWS * CELL_SIZE;
const TARGET_CATCH_COUNT = 1;
const CHICKEN_STEP_MS = 272;
const WORM_STEP_MS = 232;
const WORM_BURROW_DURATION_MS = 520;
const WORM_BURROW_COOLDOWN_MS = 5200;
const SUCCESS_DELAY_MS = 2800;

type GamePhase = "intro" | "playing" | "success";
type WormBurrowPhase = "idle" | "sinking" | "emerging";
type Facing = "left" | "right" | "up" | "down";
type GridPoint = { col: number; row: number };
type Direction = GridPoint;
type ActorState = {
  worm: GridPoint;
  chicken: GridPoint;
  wormFacing: Facing;
  chickenFacing: Facing;
  wormFrame: number;
  chickenFrame: number;
};
type OfficeObjectKind =
  | "chair"
  | "whiteboard"
  | "cart"
  | "cabinet"
  | "boxes"
  | "shelf";
type MovableOfficeObject = GridPoint & {
  id: string;
  kind: OfficeObjectKind;
  label: string;
  width: number;
  height: number;
};
type FixedFurniture = GridPoint & {
  id: string;
  kind:
    | "desk"
    | "storage"
    | "printer"
    | "plant"
    | "partition"
    | "meeting"
    | "sofa"
    | "server"
    | "water"
    | "coffee";
  width: number;
  height: number;
};
type ObjectDragState = {
  id: string;
  pointerId: number;
  offsetCol: number;
  offsetRow: number;
  origin: GridPoint;
  preview: GridPoint;
  canDrop: boolean;
  isExact: boolean;
};
type ObjectDragPreview = {
  id: string;
  point: GridPoint;
  canDrop: boolean;
  isExact: boolean;
};
type OfficeZone = GridPoint & {
  id: string;
  label: string;
  width: number;
  height: number;
  color: string;
};

const DIRECTIONS: Direction[] = [
  { col: 1, row: 0 },
  { col: -1, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: -1 },
];

const FIXED_FURNITURE: FixedFurniture[] = [
  { id: "partition-top", kind: "partition", col: 5, row: 0, width: 1, height: 2 },
  { id: "desk-top", kind: "desk", col: 1, row: 1, width: 3, height: 2 },
  { id: "storage-top", kind: "storage", col: 7, row: 1, width: 2, height: 2 },
  { id: "printer", kind: "printer", col: 11, row: 2, width: 1, height: 2 },
  { id: "plant-left", kind: "plant", col: 0, row: 1, width: 1, height: 1 },
  { id: "plant-right", kind: "plant", col: 11, row: 1, width: 1, height: 1 },
  { id: "coffee", kind: "coffee", col: 0, row: 3, width: 2, height: 1 },
  { id: "meeting", kind: "meeting", col: 1, row: 5, width: 3, height: 2 },
  { id: "partition-center", kind: "partition", col: 5, row: 5, width: 1, height: 2 },
  { id: "sofa", kind: "sofa", col: 8, row: 5, width: 3, height: 2 },
  { id: "server", kind: "server", col: 0, row: 10, width: 1, height: 2 },
  { id: "storage-lower-left", kind: "storage", col: 2, row: 10, width: 2, height: 2 },
  { id: "partition-lower", kind: "partition", col: 6, row: 10, width: 1, height: 2 },
  { id: "storage-lower-right", kind: "storage", col: 8, row: 10, width: 2, height: 2 },
  { id: "water", kind: "water", col: 11, row: 11, width: 1, height: 1 },
  { id: "desk-bottom-left", kind: "desk", col: 0, row: 14, width: 4, height: 2 },
  { id: "desk-bottom-right", kind: "desk", col: 8, row: 14, width: 4, height: 2 },
  { id: "plant-bottom", kind: "plant", col: 0, row: 16, width: 1, height: 1 },
];

const DEFAULT_MOVABLE_OBJECTS: MovableOfficeObject[] = [
  {
    id: "chair",
    kind: "chair",
    label: "辦公椅",
    col: 4,
    row: 3,
    width: 1,
    height: 1,
  },
  {
    id: "whiteboard",
    kind: "whiteboard",
    label: "移動白板",
    col: 7,
    row: 3,
    width: 3,
    height: 1,
  },
  {
    id: "cart",
    kind: "cart",
    label: "文件推車",
    col: 0,
    row: 5,
    width: 1,
    height: 2,
  },
  {
    id: "cabinet",
    kind: "cabinet",
    label: "活動櫃",
    col: 11,
    row: 5,
    width: 1,
    height: 2,
  },
  {
    id: "boxes",
    kind: "boxes",
    label: "紙箱",
    col: 1,
    row: 16,
    width: 2,
    height: 1,
  },
  {
    id: "shelf",
    kind: "shelf",
    label: "矮書架",
    col: 7,
    row: 16,
    width: 2,
    height: 1,
  },
];

const OFFICE_ZONES: OfficeZone[] = [
  {
    id: "meeting-zone",
    label: "會議區",
    col: 0,
    row: 4,
    width: 5,
    height: 5,
    color: "rgba(94,132,132,0.11)",
  },
  {
    id: "lounge-zone",
    label: "休息區",
    col: 7,
    row: 4,
    width: 5,
    height: 5,
    color: "rgba(194,145,83,0.10)",
  },
  {
    id: "utility-zone",
    label: "檔案與設備區",
    col: 0,
    row: 9,
    width: 12,
    height: 4,
    color: "rgba(84,107,120,0.10)",
  },
  {
    id: "work-zone",
    label: "工作區",
    col: 0,
    row: 13,
    width: 12,
    height: 4,
    color: "rgba(151,111,72,0.08)",
  },
];

const OFFICE_CORRIDORS = [
  { id: "north-corridor", col: 0, row: 4, width: 12, height: 1 },
  { id: "cross-corridor", col: 0, row: 8, width: 12, height: 2 },
  { id: "archive-corridor", col: 0, row: 12, width: 12, height: 2 },
  { id: "main-corridor", col: 5, row: 3, width: 2, height: 11 },
] as const;

const ACTOR_SPAWNS = [
  {
    worm: { col: 7, row: 6 },
    chicken: { col: 1, row: 8 },
  },
  {
    worm: { col: 10, row: 9 },
    chicken: { col: 2, row: 4 },
  },
  {
    worm: { col: 1, row: 9 },
    chicken: { col: 10, row: 4 },
  },
  {
    worm: { col: 6, row: 13 },
    chicken: { col: 4, row: 9 },
  },
] as const;

const routePulse = keyframes`
  0%, 100% { opacity: 0.34; transform: translate(-50%, -50%) scale(0.82); }
  50% { opacity: 0.88; transform: translate(-50%, -50%) scale(1); }
`;

const actorStride = keyframes`
  0%, 100% { transform: translateY(1px); }
  50% { transform: translateY(-2px); }
`;

const tutorialObjectSlide = keyframes`
  0%, 100% { transform: translateX(-7px); }
  50% { transform: translateX(7px); }
`;

const wormBurrowSink = keyframes`
  0% { opacity: 1; transform: scale(1, 1); }
  45% { opacity: 0.72; transform: scale(0.82, 0.42); }
  100% { opacity: 0; transform: scale(0.28, 0.12); }
`;

const wormBurrowBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
  38% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.45); }
`;

const wormBurrowEmerge = keyframes`
  0% { opacity: 0; transform: scale(0.28, 0.12); }
  55% { opacity: 0.82; transform: scale(0.86, 0.48); }
  100% { opacity: 1; transform: scale(1, 1); }
`;

const caughtBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.55); }
  28% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  100% { opacity: 0; transform: translate(-50%, -62%) scale(1.22); }
`;

const cardAppear = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

function pointKey(point: GridPoint) {
  return `${point.col}:${point.row}`;
}

function samePoint(a: GridPoint, b: GridPoint) {
  return a.col === b.col && a.row === b.row;
}

function isInsideBoard(point: GridPoint) {
  return (
    point.col >= 0 &&
    point.col < GRID_COLUMNS &&
    point.row >= 0 &&
    point.row < GRID_ROWS
  );
}

function directionFacing(from: GridPoint, to: GridPoint, fallback: Facing): Facing {
  if (to.col > from.col) return "right";
  if (to.col < from.col) return "left";
  if (to.row > from.row) return "down";
  if (to.row < from.row) return "up";
  return fallback;
}

function facingDirection(facing: Facing): Direction {
  if (facing === "left") return { col: -1, row: 0 };
  if (facing === "right") return { col: 1, row: 0 };
  if (facing === "up") return { col: 0, row: -1 };
  return { col: 0, row: 1 };
}

function getSpawn(index: number): ActorState {
  const spawn = ACTOR_SPAWNS[index % ACTOR_SPAWNS.length];
  return {
    worm: { ...spawn.worm },
    chicken: { ...spawn.chicken },
    wormFacing: "left",
    chickenFacing: "right",
    wormFrame: 0,
    chickenFrame: 0,
  };
}

function getOccupiedCells(
  item: Pick<MovableOfficeObject | FixedFurniture, "col" | "row" | "width" | "height">,
) {
  const cells: GridPoint[] = [];
  for (let row = item.row; row < item.row + item.height; row += 1) {
    for (let col = item.col; col < item.col + item.width; col += 1) {
      cells.push({ col, row });
    }
  }
  return cells;
}

function createBlockedSet(objects: MovableOfficeObject[]) {
  return new Set([
    ...FIXED_FURNITURE.flatMap(getOccupiedCells).map(pointKey),
    ...objects.flatMap(getOccupiedCells).map(pointKey),
  ]);
}

function findPath(
  start: GridPoint,
  target: GridPoint,
  blocked: Set<string>,
): GridPoint[] {
  if (samePoint(start, target)) return [start];

  const queue: GridPoint[] = [start];
  const startKey = pointKey(start);
  const targetKey = pointKey(target);
  const visited = new Set([startKey]);
  const previous = new Map<string, string>();
  const points = new Map<string, GridPoint>([[startKey, start]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const orderedDirections = [...DIRECTIONS].sort((a, b) => {
      const distanceA =
        Math.abs(target.col - (current.col + a.col)) +
        Math.abs(target.row - (current.row + a.row));
      const distanceB =
        Math.abs(target.col - (current.col + b.col)) +
        Math.abs(target.row - (current.row + b.row));
      return distanceA - distanceB;
    });

    for (const direction of orderedDirections) {
      const next = {
        col: current.col + direction.col,
        row: current.row + direction.row,
      };
      const nextKey = pointKey(next);
      if (
        !isInsideBoard(next) ||
        visited.has(nextKey) ||
        (blocked.has(nextKey) && nextKey !== targetKey)
      ) {
        continue;
      }

      visited.add(nextKey);
      previous.set(nextKey, pointKey(current));
      points.set(nextKey, next);

      if (nextKey === targetKey) {
        const route: GridPoint[] = [next];
        let routeKey = nextKey;
        let priorKey = previous.get(routeKey);
        while (priorKey) {
          const priorPoint = points.get(priorKey);
          if (priorPoint) route.unshift(priorPoint);
          if (priorKey === startKey) break;
          routeKey = priorKey;
          priorKey = previous.get(routeKey);
        }
        return route;
      }

      queue.push(next);
    }
  }

  return [start];
}

function getChickenStep(
  chicken: GridPoint,
  worm: GridPoint,
  blocked: Set<string>,
) {
  return findPath(chicken, worm, blocked)[1] ?? chicken;
}

function getPathDistance(
  start: GridPoint,
  target: GridPoint,
  blocked: Set<string>,
) {
  if (samePoint(start, target)) return 0;
  const path = findPath(start, target, blocked);
  return path.length > 1 ? path.length - 1 : GRID_COLUMNS + GRID_ROWS;
}

function getReachableArea(
  start: GridPoint,
  blocked: Set<string>,
  maxDepth = 4,
) {
  const queue = [{ point: start, depth: 0 }];
  const visited = new Set([pointKey(start)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= maxDepth) continue;

    for (const direction of DIRECTIONS) {
      const next = {
        col: current.point.col + direction.col,
        row: current.point.row + direction.row,
      };
      const key = pointKey(next);
      if (
        !isInsideBoard(next) ||
        blocked.has(key) ||
        visited.has(key)
      ) {
        continue;
      }
      visited.add(key);
      queue.push({ point: next, depth: current.depth + 1 });
    }
  }

  return visited.size;
}

function getWormStep(
  worm: GridPoint,
  chicken: GridPoint,
  blocked: Set<string>,
  facing: Facing,
  moveCount: number,
  recentTrail: GridPoint[],
) {
  const forward = facingDirection(facing);
  const predictedChicken = getChickenStep(chicken, worm, blocked);
  const candidates = DIRECTIONS.map((direction) => ({
    direction,
    point: {
      col: worm.col + direction.col,
      row: worm.row + direction.row,
    },
  })).filter(
    ({ point }) =>
      isInsideBoard(point) &&
      !blocked.has(pointKey(point)) &&
      !samePoint(point, chicken),
  );

  if (candidates.length === 0) return worm;

  const scored = candidates.map(({ direction, point }, index) => {
    const routeDistance = getPathDistance(predictedChicken, point, blocked);
    const nextOptions = DIRECTIONS.map((nextDirection) => {
      const next = {
        col: point.col + nextDirection.col,
        row: point.row + nextDirection.row,
      };
      return next;
    }).filter(
      (next) =>
        isInsideBoard(next) &&
        !blocked.has(pointKey(next)) &&
        !samePoint(next, predictedChicken),
    );
    const exits = nextOptions.length;
    const bestNextDistance = nextOptions.reduce(
      (best, next) =>
        Math.max(best, getPathDistance(predictedChicken, next, blocked)),
      routeDistance,
    );
    const escapeArea = getReachableArea(point, blocked);
    const straightBonus =
      direction.col === forward.col && direction.row === forward.row ? 0.9 : 0;
    const recentIndex = recentTrail.findIndex((trailPoint) =>
      samePoint(trailPoint, point),
    );
    const trailPenalty =
      recentIndex < 0 ? 0 : Math.max(0.7, 4.2 - recentIndex * 0.65);
    const deadEndPenalty = exits <= 1 ? 4.8 : exits === 2 ? 0.8 : 0;
    const edgePenalty =
      point.col === 0 ||
      point.col === GRID_COLUMNS - 1 ||
      point.row === 0 ||
      point.row === GRID_ROWS - 1
        ? 1.1
        : 0;
    const variation = ((moveCount * 5 + index * 3) % 11) * 0.045;
    return {
      point,
      score:
        routeDistance * 2.55 +
        bestNextDistance * 0.72 +
        escapeArea * 0.34 +
        exits * 0.8 +
        straightBonus +
        variation -
        trailPenalty -
        deadEndPenalty -
        edgePenalty,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  if (
    moveCount % 7 === 4 &&
    scored[1] &&
    scored[0].score - scored[1].score < 1.8
  ) {
    return scored[1].point;
  }
  return scored[0]?.point ?? worm;
}

function getOpenNeighborCount(
  point: GridPoint,
  blocked: Set<string>,
  chicken: GridPoint,
) {
  return DIRECTIONS.filter((direction) => {
    const next = {
      col: point.col + direction.col,
      row: point.row + direction.row,
    };
    return (
      isInsideBoard(next) &&
      !blocked.has(pointKey(next)) &&
      !samePoint(next, chicken)
    );
  }).length;
}

function getWormBurrowExit(
  worm: GridPoint,
  chicken: GridPoint,
  blocked: Set<string>,
) {
  const candidates: Array<{
    point: GridPoint;
    score: number;
    crossesObstacle: boolean;
  }> = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      const point = { col, row };
      const directDistance =
        Math.abs(point.col - worm.col) + Math.abs(point.row - worm.row);
      if (
        directDistance < 2 ||
        directDistance > 5 ||
        blocked.has(pointKey(point)) ||
        samePoint(point, chicken)
      ) {
        continue;
      }

      const normalRouteDistance = getPathDistance(worm, point, blocked);
      const chickenDistance = getPathDistance(chicken, point, blocked);
      const escapeArea = getReachableArea(point, blocked, 4);
      const exits = getOpenNeighborCount(point, blocked, chicken);
      if (exits === 0 || escapeArea <= 2) continue;

      candidates.push({
        point,
        crossesObstacle: normalRouteDistance > directDistance + 1,
        score:
          chickenDistance * 2.3 +
          escapeArea * 0.52 +
          exits * 1.2 +
          Math.min(normalRouteDistance, 12) * 0.18 -
          directDistance * 0.65,
      });
    }
  }

  const tunnelCandidates = candidates.filter(
    (candidate) => candidate.crossesObstacle,
  );
  const candidatePool =
    tunnelCandidates.length > 0 ? tunnelCandidates : candidates;
  candidatePool.sort((a, b) => b.score - a.score);
  return candidatePool[0]?.point ?? null;
}

function shouldWormBurrow(
  worm: GridPoint,
  chicken: GridPoint,
  nextWorm: GridPoint,
  blocked: Set<string>,
  recentTrail: GridPoint[],
) {
  if (samePoint(nextWorm, worm)) return true;
  if (recentTrail[0] && samePoint(nextWorm, recentTrail[0])) return true;
  const currentExits = getOpenNeighborCount(worm, blocked, chicken);
  if (currentExits <= 1) return true;

  const nextExits = getOpenNeighborCount(nextWorm, blocked, chicken);
  const nextEscapeArea = getReachableArea(nextWorm, blocked, 3);
  if (nextExits <= 1 && nextEscapeArea <= 5) return true;

  const connectedEscapeArea = getReachableArea(
    worm,
    blocked,
    GRID_COLUMNS + GRID_ROWS,
  );
  return connectedEscapeArea <= 14;
}

function getBoardPointFromPointer(
  event: ReactPointerEvent<HTMLElement>,
  stageElement: HTMLDivElement,
) {
  const rect = stageElement.getBoundingClientRect();
  const logicalX = ((event.clientX - rect.left) / rect.width) * STAGE_WIDTH;
  const logicalY = ((event.clientY - rect.top) / rect.height) * STAGE_HEIGHT;
  return {
    col: Math.floor(logicalX / CELL_SIZE),
    row: Math.floor((logicalY - HUD_HEIGHT) / CELL_SIZE),
  };
}

function canPlaceObject(
  point: GridPoint,
  item: MovableOfficeObject,
  objects: MovableOfficeObject[],
  actors: ActorState,
) {
  const candidate = { ...item, ...point };
  const candidateCells = getOccupiedCells(candidate);
  if (candidateCells.some((cell) => !isInsideBoard(cell))) return false;

  const occupiedByFixed = new Set(
    FIXED_FURNITURE.flatMap(getOccupiedCells).map(pointKey),
  );
  const occupiedByOthers = new Set(
    objects
      .filter((object) => object.id !== item.id)
      .flatMap(getOccupiedCells)
      .map(pointKey),
  );

  return candidateCells.every((cell) => {
    const key = pointKey(cell);
    return (
      !occupiedByFixed.has(key) &&
      !occupiedByOthers.has(key) &&
      !samePoint(cell, actors.worm) &&
      !samePoint(cell, actors.chicken)
    );
  });
}

function clampObjectPoint(point: GridPoint, item: MovableOfficeObject) {
  return {
    col: Math.max(0, Math.min(GRID_COLUMNS - item.width, point.col)),
    row: Math.max(0, Math.min(GRID_ROWS - item.height, point.row)),
  };
}

function getNearestPlacement(
  point: GridPoint,
  item: MovableOfficeObject,
  objects: MovableOfficeObject[],
  actors: ActorState,
) {
  const clampedPoint = clampObjectPoint(point, item);
  if (canPlaceObject(clampedPoint, item, objects, actors)) {
    return {
      point: clampedPoint,
      canDrop: true,
      isExact: samePoint(point, clampedPoint),
    };
  }

  const candidates: GridPoint[] = [];
  for (let row = 0; row <= GRID_ROWS - item.height; row += 1) {
    for (let col = 0; col <= GRID_COLUMNS - item.width; col += 1) {
      const candidate = { col, row };
      const distance =
        Math.abs(candidate.col - clampedPoint.col) +
        Math.abs(candidate.row - clampedPoint.row);
      if (
        distance <= 2 &&
        canPlaceObject(candidate, item, objects, actors)
      ) {
        candidates.push(candidate);
      }
    }
  }

  candidates.sort((a, b) => {
    const distanceA =
      Math.abs(a.col - clampedPoint.col) + Math.abs(a.row - clampedPoint.row);
    const distanceB =
      Math.abs(b.col - clampedPoint.col) + Math.abs(b.row - clampedPoint.row);
    const originDistanceA =
      Math.abs(a.col - item.col) + Math.abs(a.row - item.row);
    const originDistanceB =
      Math.abs(b.col - item.col) + Math.abs(b.row - item.row);
    return distanceA - distanceB || originDistanceA - originDistanceB;
  });

  if (candidates[0]) {
    return {
      point: candidates[0],
      canDrop: true,
      isExact: false,
    };
  }

  return {
    point: clampedPoint,
    canDrop: false,
    isExact: false,
  };
}

function getWormPreview(
  actors: ActorState,
  blocked: Set<string>,
  recentTrail: GridPoint[],
  moveCount: number,
) {
  const preview: GridPoint[] = [];
  let worm = actors.worm;
  let facing = actors.wormFacing;
  let trail = recentTrail;

  for (let index = 0; index < 3; index += 1) {
    const next = getWormStep(
      worm,
      actors.chicken,
      blocked,
      facing,
      moveCount + index,
      trail,
    );
    if (samePoint(next, worm)) break;
    preview.push(next);
    facing = directionFacing(worm, next, facing);
    trail = [worm, ...trail].slice(0, 7);
    worm = next;
  }

  return preview;
}

function ChaseSprite({
  actor,
  frame,
  size,
}: {
  actor: "chicken" | "worm";
  frame: number;
  size: string;
}) {
  const safeFrame = Math.max(0, Math.min(5, frame));
  return (
    <Box
      w={size}
      h={size}
      bgImage={`url("${CHASE_SPRITE_ATLAS}")`}
      bgRepeat="no-repeat"
      bgSize="600% 200%"
      backgroundPosition={`${safeFrame * 20}% ${actor === "chicken" ? "0%" : "100%"}`}
      filter="drop-shadow(0 3px 0 rgba(64,50,40,0.22))"
      pointerEvents="none"
    />
  );
}

function WormSprite({ frame = 0, size = "38px" }: { frame?: number; size?: string }) {
  return <ChaseSprite actor="worm" frame={frame} size={size} />;
}

function ChickenSprite({
  frame = 0,
  size = "54px",
}: {
  frame?: number;
  size?: string;
}) {
  return <ChaseSprite actor="chicken" frame={frame} size={size} />;
}

function MovableObjectSprite({ kind }: { kind: OfficeObjectKind }) {
  if (kind === "chair") {
    return (
      <Flex
        position="relative"
        w="78%"
        h="82%"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          position="absolute"
          top="0"
          w="78%"
          h="32%"
          borderRadius="7px 7px 3px 3px"
          bgColor="#7A9254"
          border="2px solid #566B3D"
        />
        <Box
          w="64%"
          h="56%"
          mt="5px"
          borderRadius="5px"
          bgColor="#91A964"
          border="2px solid #5C7141"
          boxShadow="0 3px 0 rgba(57,69,44,0.28)"
        />
        <Box
          position="absolute"
          bottom="-1px"
          w="88%"
          h="3px"
          bgColor="#46504A"
          boxShadow="0 -5px 0 -1px #59645E"
        />
      </Flex>
    );
  }

  if (kind === "whiteboard") {
    return (
      <Flex
        position="relative"
        w="94%"
        h="82%"
        borderRadius="5px"
        bgColor="#47737A"
        border="4px solid #627176"
        boxShadow="0 4px 0 #3C474B, inset 0 0 0 2px #A6C9C7"
      >
        <Box
          position="absolute"
          left="4%"
          right="4%"
          bottom="-7px"
          h="4px"
          bgColor="#525E62"
          _before={{
            content: '""',
            position: "absolute",
            left: "-2px",
            bottom: "-3px",
            width: "7px",
            height: "7px",
            borderRadius: "999px",
            background: "#374044",
          }}
          _after={{
            content: '""',
            position: "absolute",
            right: "-2px",
            bottom: "-3px",
            width: "7px",
            height: "7px",
            borderRadius: "999px",
            background: "#374044",
          }}
        />
      </Flex>
    );
  }

  if (kind === "cart") {
    return (
      <Flex
        position="relative"
        w="78%"
        h="91%"
        direction="column"
        justifyContent="space-around"
        px="3px"
        py="8px"
        borderRadius="4px"
        bgColor="#657178"
        border="2px solid #3F484D"
        boxShadow="0 4px 0 #30373B"
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            h="22%"
            borderRadius="2px"
            bgColor={index === 1 ? "#EADCB7" : "#F5E9CB"}
            border="1px solid #B7A986"
            transform={`rotate(${index === 1 ? -3 : 2}deg)`}
          />
        ))}
      </Flex>
    );
  }

  if (kind === "cabinet") {
    return (
      <Flex
        w="80%"
        h="92%"
        direction="column"
        justifyContent="space-evenly"
        p="3px"
        borderRadius="4px"
        bgColor="#60727B"
        border="2px solid #3E5058"
        boxShadow="0 4px 0 #35454C"
      >
        {[0, 1, 2].map((index) => (
          <Flex
            key={index}
            h="28%"
            borderRadius="2px"
            bgColor="#788A91"
            border="1px solid #4D6068"
            alignItems="center"
            justifyContent="center"
          >
            <Box w="38%" h="2px" bgColor="#D4D8D5" />
          </Flex>
        ))}
      </Flex>
    );
  }

  if (kind === "shelf") {
    return (
      <Flex
        position="relative"
        w="94%"
        h="84%"
        alignItems="flex-end"
        px="6px"
        pb="4px"
        gap="3px"
        borderRadius="4px"
        bgColor="#8E694D"
        border="2px solid #604531"
        boxShadow="0 4px 0 #4F392A"
      >
        {["#D46B58", "#E2B658", "#6F9B8B", "#7089AA", "#C98B57"].map(
          (color, index) => (
            <Box
              key={color}
              flex="1"
              h={`${48 + (index % 3) * 13}%`}
              borderRadius="2px 2px 0 0"
              bgColor={color}
              border="1px solid rgba(64,46,34,0.36)"
            />
          ),
        )}
      </Flex>
    );
  }

  return (
    <Flex position="relative" w="92%" h="86%" alignItems="flex-end">
      <Box
        position="absolute"
        left="2%"
        bottom="0"
        w="56%"
        h="78%"
        borderRadius="3px"
        bgColor="#C68C4C"
        border="2px solid #966839"
        boxShadow="0 4px 0 #7D572F"
        _after={{
          content: '""',
          position: "absolute",
          left: "46%",
          top: 0,
          width: "7%",
          height: "100%",
          background: "#E2B16E",
        }}
      />
      <Box
        position="absolute"
        right="2%"
        bottom="1px"
        w="50%"
        h="62%"
        borderRadius="3px"
        bgColor="#D99C56"
        border="2px solid #A6723E"
        boxShadow="0 4px 0 #845B32"
      />
    </Flex>
  );
}

function FixedFurnitureSprite({ item }: { item: FixedFurniture }) {
  if (item.kind === "desk") {
    return (
      <Flex
        position="relative"
        w="96%"
        h="88%"
        borderRadius="5px"
        bgColor="#B67A3E"
        border="2px solid #835127"
        boxShadow="0 5px 0 #704321"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          w="25%"
          h="46%"
          borderRadius="3px"
          bgColor="#3E4A4D"
          border="2px solid #283135"
          boxShadow="0 4px 0 #6D492D"
        />
        <Box
          position="absolute"
          bottom="11%"
          w="36%"
          h="8%"
          borderRadius="2px"
          bgColor="#4F5758"
        />
        <Box
          position="absolute"
          right="7%"
          top="13%"
          w="15%"
          h="24%"
          borderRadius="2px"
          bgColor="#F0E5CE"
          transform="rotate(5deg)"
          boxShadow="0 2px 0 #91795A"
        />
      </Flex>
    );
  }

  if (item.kind === "storage") {
    return (
      <Flex
        w="96%"
        h="86%"
        borderRadius="4px"
        bgColor="#6E7E83"
        border="2px solid #45575D"
        boxShadow="0 4px 0 #37464A"
        alignItems="center"
        justifyContent="space-evenly"
        px="4px"
      >
        {[0, 1, 2].map((index) => (
          <Flex
            key={index}
            w="29%"
            h="70%"
            borderRadius="2px"
            bgColor="#819196"
            border="1px solid #52656B"
            alignItems="center"
            justifyContent="center"
          >
            <Box w="48%" h="2px" bgColor="#D5D9D6" />
          </Flex>
        ))}
      </Flex>
    );
  }

  if (item.kind === "printer") {
    return (
      <Flex
        w="82%"
        h="91%"
        direction="column"
        alignItems="center"
        justifyContent="space-around"
        py="5px"
        borderRadius="4px"
        bgColor="#65757A"
        border="2px solid #3E4D52"
        boxShadow="0 4px 0 #324045"
      >
        <Box
          w="76%"
          h="35%"
          borderRadius="3px"
          bgColor="#D8D8D0"
          border="2px solid #92958F"
        />
        <Box w="62%" h="18%" borderRadius="2px" bgColor="#29373B" />
        <Box w="66%" h="4px" borderRadius="2px" bgColor="#C8D0CD" />
      </Flex>
    );
  }

  if (item.kind === "partition") {
    return (
      <Flex
        position="relative"
        w="88%"
        h="94%"
        borderRadius="4px"
        bgColor="#8EB0AF"
        border="3px solid #526D70"
        boxShadow="0 4px 0 #3F5558, inset 0 0 0 2px rgba(227,245,240,0.45)"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="13%"
          opacity={0.55}
          bgImage="linear-gradient(135deg, rgba(255,255,255,0.42) 0 18%, transparent 18% 38%, rgba(255,255,255,0.28) 38% 55%, transparent 55%)"
        />
        <Box
          position="absolute"
          left="50%"
          top="0"
          bottom="0"
          w="2px"
          bgColor="rgba(65,87,89,0.55)"
        />
      </Flex>
    );
  }

  if (item.kind === "meeting") {
    return (
      <Flex position="relative" w="98%" h="94%" alignItems="center" justifyContent="center">
        <Box
          w="78%"
          h="70%"
          borderRadius="48%"
          bgColor="#AA754B"
          border="3px solid #745039"
          boxShadow="0 5px 0 #654432"
        />
        {[8, 38, 68].map((left) => (
          <Box
            key={`top-${left}`}
            position="absolute"
            left={`${left}%`}
            top="0"
            w="18%"
            h="22%"
            borderRadius="6px"
            bgColor="#597A78"
            border="2px solid #3F5B5A"
          />
        ))}
        {[8, 38, 68].map((left) => (
          <Box
            key={`bottom-${left}`}
            position="absolute"
            left={`${left}%`}
            bottom="0"
            w="18%"
            h="22%"
            borderRadius="6px"
            bgColor="#597A78"
            border="2px solid #3F5B5A"
          />
        ))}
      </Flex>
    );
  }

  if (item.kind === "sofa") {
    return (
      <Flex
        position="relative"
        w="96%"
        h="86%"
        borderRadius="10px"
        bgColor="#557D7B"
        border="3px solid #385958"
        boxShadow="0 5px 0 #304C4B"
        alignItems="center"
        justifyContent="space-evenly"
        px="5px"
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            w="28%"
            h="66%"
            borderRadius="7px"
            bgColor={index === 1 ? "#6C9290" : "#638A88"}
            border="1px solid #456B69"
          />
        ))}
      </Flex>
    );
  }

  if (item.kind === "server") {
    return (
      <Flex
        w="82%"
        h="96%"
        direction="column"
        justifyContent="space-evenly"
        p="4px"
        borderRadius="5px"
        bgColor="#38464C"
        border="2px solid #253237"
        boxShadow="0 4px 0 #202B2F"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <Flex
            key={index}
            h="15%"
            borderRadius="2px"
            bgColor="#4D5C62"
            border="1px solid #28373D"
            alignItems="center"
            px="3px"
            gap="2px"
          >
            <Box w="3px" h="3px" borderRadius="999px" bgColor="#74D5A6" />
            <Box w="3px" h="3px" borderRadius="999px" bgColor="#E9C86B" />
          </Flex>
        ))}
      </Flex>
    );
  }

  if (item.kind === "water") {
    return (
      <Flex
        position="relative"
        w="74%"
        h="88%"
        direction="column"
        alignItems="center"
        justifyContent="flex-end"
        pb="3px"
        borderRadius="4px"
        bgColor="#D9E1DE"
        border="2px solid #8A9998"
        boxShadow="0 4px 0 #71807F"
      >
        <Box
          position="absolute"
          top="-9px"
          w="62%"
          h="44%"
          borderRadius="45% 45% 20% 20%"
          bgColor="#8DCDD5"
          border="2px solid #5E969E"
        />
        <Box w="48%" h="23%" borderRadius="2px" bgColor="#435B5F" />
      </Flex>
    );
  }

  if (item.kind === "coffee") {
    return (
      <Flex
        position="relative"
        w="95%"
        h="84%"
        borderRadius="4px"
        bgColor="#8C6A50"
        border="2px solid #624934"
        boxShadow="0 4px 0 #523C2B"
        alignItems="center"
        justifyContent="space-around"
        px="5px"
      >
        <Box
          w="34%"
          h="62%"
          borderRadius="4px"
          bgColor="#38474A"
          border="2px solid #273437"
          _after={{
            content: '""',
            position: "absolute",
            width: "7px",
            height: "7px",
            borderRadius: "999px",
            background: "#E5D7B7",
          }}
        />
        <Box w="16%" h="34%" borderRadius="2px 2px 6px 6px" bgColor="#E8E0CF" />
        <Box w="20%" h="46%" borderRadius="3px" bgColor="#C58B58" />
      </Flex>
    );
  }

  return (
    <Flex position="relative" w="100%" h="100%" alignItems="center" justifyContent="center">
      <Box
        position="absolute"
        bottom="10%"
        w="55%"
        h="38%"
        borderRadius="6px 6px 10px 10px"
        bgColor="#9B7048"
        border="2px solid #6F4C31"
        boxShadow="0 3px 0 #5F402A"
      />
      {[0, 1, 2, 3, 4].map((index) => (
        <Box
          key={index}
          position="absolute"
          left={`${16 + index * 13}%`}
          top={`${8 + (index % 2) * 10}%`}
          w="24%"
          h="48%"
          borderRadius="80% 10% 80% 10%"
          bgColor={index % 2 ? "#688C49" : "#789D53"}
          border="1px solid #4C7137"
          transform={`rotate(${-38 + index * 19}deg)`}
          transformOrigin="50% 100%"
        />
      ))}
    </Flex>
  );
}

export function OfficeChickenFocusMinigameModal({
  baseFatigue: _baseFatigue,
  onSkip,
  onSolved,
  onComplete,
  successSavingsTotal,
}: {
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  successSavingsTotal?: number | null;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastWormStepRef = useRef(0);
  const lastChickenStepRef = useRef(0);
  const wormMoveCountRef = useRef(0);
  const wormTrailRef = useRef<GridPoint[]>([]);
  const wormBurrowUntilRef = useRef(0);
  const wormBurrowCooldownUntilRef = useRef(0);
  const wormBurrowTargetRef = useRef<GridPoint | null>(null);
  const wormBurrowPhaseRef = useRef<WormBurrowPhase>("idle");
  const burrowCooldownDisplayRef = useRef(0);
  const actorsRef = useRef<ActorState>(getSpawn(0));
  const objectsRef = useRef<MovableOfficeObject[]>(DEFAULT_MOVABLE_OBJECTS);
  const dragRef = useRef<ObjectDragState | null>(null);
  const caughtRef = useRef(0);
  const solvedNotifiedRef = useRef(false);
  const completeTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [actors, setActors] = useState<ActorState>(() => getSpawn(0));
  const [objects, setObjects] = useState<MovableOfficeObject[]>(
    DEFAULT_MOVABLE_OBJECTS,
  );
  const [caughtCount, setCaughtCount] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<ObjectDragPreview | null>(null);
  const [wormBurrowPhase, setWormBurrowPhase] =
    useState<WormBurrowPhase>("idle");
  const [wormBurrowTarget, setWormBurrowTarget] = useState<GridPoint | null>(null);
  const [burrowCooldownSeconds, setBurrowCooldownSeconds] = useState(0);
  const [burrowBurstPoint, setBurrowBurstPoint] = useState<GridPoint | null>(null);
  const [burrowBurstNonce, setBurrowBurstNonce] = useState(0);
  const [caughtBurstPoint, setCaughtBurstPoint] = useState<GridPoint | null>(null);
  const [caughtBurstNonce, setCaughtBurstNonce] = useState(0);
  const [isHintOpen, setIsHintOpen] = useState(false);

  const blockedCells = useMemo(() => createBlockedSet(objects), [objects]);
  const routePreview = useMemo(
    () => findPath(actors.chicken, actors.worm, blockedCells).slice(1, 11),
    [actors.chicken, actors.worm, blockedCells],
  );
  const wormPreview = useMemo(
    () =>
      getWormPreview(
        actors,
        blockedCells,
        wormTrailRef.current,
        wormMoveCountRef.current,
    ),
    [actors, blockedCells],
  );

  const clearAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = null;
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
    }
    completeTimerRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    clearAnimation();
    clearCompleteTimer();
    const initialActors = getSpawn(0);
    actorsRef.current = initialActors;
    objectsRef.current = DEFAULT_MOVABLE_OBJECTS;
    caughtRef.current = 0;
    wormMoveCountRef.current = 0;
    wormTrailRef.current = [{ ...initialActors.worm }];
    solvedNotifiedRef.current = false;
    const startAt = window.performance.now();
    wormBurrowUntilRef.current = 0;
    wormBurrowCooldownUntilRef.current = 0;
    wormBurrowTargetRef.current = null;
    wormBurrowPhaseRef.current = "idle";
    burrowCooldownDisplayRef.current = 0;
    lastWormStepRef.current = startAt;
    lastChickenStepRef.current = startAt;
    dragRef.current = null;
    setActors(initialActors);
    setObjects(DEFAULT_MOVABLE_OBJECTS);
    setCaughtCount(0);
    setDraggingId(null);
    setDragPreview(null);
    setWormBurrowPhase("idle");
    setWormBurrowTarget(null);
    setBurrowCooldownSeconds(0);
    setBurrowBurstPoint(null);
    setBurrowBurstNonce(0);
    setCaughtBurstPoint(null);
    setCaughtBurstNonce(0);
    setIsHintOpen(false);
    setPhase("playing");
  }, [clearAnimation, clearCompleteTimer]);

  const startObjectDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      item: MovableOfficeObject,
    ) => {
      if (phase !== "playing") return;
      const stageElement = stageRef.current;
      if (!stageElement) return;
      event.preventDefault();
      event.stopPropagation();
      const pointerPoint = getBoardPointFromPointer(event, stageElement);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        id: item.id,
        pointerId: event.pointerId,
        offsetCol: pointerPoint.col - item.col,
        offsetRow: pointerPoint.row - item.row,
        origin: { col: item.col, row: item.row },
        preview: { col: item.col, row: item.row },
        canDrop: true,
        isExact: true,
      };
      setDraggingId(item.id);
      setDragPreview({
        id: item.id,
        point: { col: item.col, row: item.row },
        canDrop: true,
        isExact: true,
      });
    },
    [phase],
  );

  const moveObject = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const stageElement = stageRef.current;
    const drag = dragRef.current;
    if (!stageElement || !drag) return;

    const pointerPoint = getBoardPointFromPointer(event, stageElement);
    const item = objectsRef.current.find((object) => object.id === drag.id);
    if (!item) return;

    const nextPoint = {
      col: pointerPoint.col - drag.offsetCol,
      row: pointerPoint.row - drag.offsetRow,
    };
    const placement = getNearestPlacement(
      nextPoint,
      item,
      objectsRef.current,
      actorsRef.current,
    );
    drag.preview = placement.point;
    drag.canDrop = placement.canDrop;
    drag.isExact = placement.isExact;
    setDragPreview({
      id: item.id,
      point: placement.point,
      canDrop: placement.canDrop,
      isExact: placement.isExact,
    });
  }, []);

  const stopObjectDrag = useCallback(() => {
    const drag = dragRef.current;
    if (drag?.canDrop) {
      const item = objectsRef.current.find((object) => object.id === drag.id);
      if (
        item &&
        canPlaceObject(
          drag.preview,
          item,
          objectsRef.current,
          actorsRef.current,
        )
      ) {
        const nextObjects = objectsRef.current.map((object) =>
          object.id === drag.id ? { ...object, ...drag.preview } : object,
        );
        objectsRef.current = nextObjects;
        setObjects(nextObjects);
      }
    }
    dragRef.current = null;
    setDraggingId(null);
    setDragPreview(null);
  }, []);

  useEffect(() => {
    if (phase !== "playing") {
      clearAnimation();
      return;
    }

    const tick = (timestamp: number) => {
      let nextActors = actorsRef.current;
      let actorChanged = false;
      const blocked = createBlockedSet(objectsRef.current);
      const displayedBurrowCooldown = Math.max(
        0,
        Math.ceil(
          (wormBurrowCooldownUntilRef.current - timestamp) / 1000,
        ),
      );
      if (displayedBurrowCooldown !== burrowCooldownDisplayRef.current) {
        burrowCooldownDisplayRef.current = displayedBurrowCooldown;
        setBurrowCooldownSeconds(displayedBurrowCooldown);
      }

      let currentBurrowPhase = wormBurrowPhaseRef.current;
      if (
        currentBurrowPhase === "sinking" &&
        timestamp >= wormBurrowUntilRef.current
      ) {
        let target = wormBurrowTargetRef.current;
        if (
          target &&
          (blocked.has(pointKey(target)) ||
            samePoint(target, nextActors.chicken))
        ) {
          target = getWormBurrowExit(
            nextActors.worm,
            nextActors.chicken,
            blocked,
          );
          wormBurrowTargetRef.current = target;
          setWormBurrowTarget(target);
        }

        if (target) {
          const from = nextActors.worm;
          nextActors = {
            ...nextActors,
            worm: target,
            wormFacing: directionFacing(
              from,
              target,
              nextActors.wormFacing,
            ),
            wormFrame: 4,
          };
          wormTrailRef.current = [{ ...target }];
          setBurrowBurstPoint(target);
          setBurrowBurstNonce(Date.now());
          actorChanged = true;
        }

        currentBurrowPhase = "emerging";
        wormBurrowPhaseRef.current = "emerging";
        wormBurrowUntilRef.current = timestamp + 280;
        setWormBurrowPhase("emerging");
        lastWormStepRef.current = timestamp;
      }

      if (
        currentBurrowPhase === "emerging" &&
        timestamp >= wormBurrowUntilRef.current
      ) {
        currentBurrowPhase = "idle";
        wormBurrowPhaseRef.current = "idle";
        wormBurrowTargetRef.current = null;
        setWormBurrowPhase("idle");
        setWormBurrowTarget(null);
        lastWormStepRef.current = timestamp;
      }

      if (
        currentBurrowPhase === "idle" &&
        timestamp - lastWormStepRef.current >= WORM_STEP_MS
      ) {
        const nextWorm = getWormStep(
          nextActors.worm,
          nextActors.chicken,
          blocked,
          nextActors.wormFacing,
          wormMoveCountRef.current,
          wormTrailRef.current,
        );
        wormMoveCountRef.current += 1;
        const canBurrow =
          timestamp >= wormBurrowCooldownUntilRef.current &&
          shouldWormBurrow(
            nextActors.worm,
            nextActors.chicken,
            nextWorm,
            blocked,
            wormTrailRef.current,
          );
        const burrowExit = canBurrow
          ? getWormBurrowExit(
              nextActors.worm,
              nextActors.chicken,
              blocked,
            )
          : null;

        if (burrowExit) {
          currentBurrowPhase = "sinking";
          wormBurrowPhaseRef.current = "sinking";
          wormBurrowUntilRef.current =
            timestamp + WORM_BURROW_DURATION_MS;
          wormBurrowCooldownUntilRef.current =
            timestamp + WORM_BURROW_COOLDOWN_MS;
          wormBurrowTargetRef.current = burrowExit;
          burrowCooldownDisplayRef.current = Math.ceil(
            WORM_BURROW_COOLDOWN_MS / 1000,
          );
          setWormBurrowPhase("sinking");
          setWormBurrowTarget(burrowExit);
          setBurrowCooldownSeconds(burrowCooldownDisplayRef.current);
          nextActors = {
            ...nextActors,
            wormFrame: 4,
          };
          actorChanged = true;
        } else if (!samePoint(nextWorm, nextActors.worm)) {
          const nextWormFacing = directionFacing(
            nextActors.worm,
            nextWorm,
            nextActors.wormFacing,
          );
          wormTrailRef.current = [
            { ...nextActors.worm },
            ...wormTrailRef.current,
          ].slice(0, 7);
          nextActors = {
            ...nextActors,
            worm: nextWorm,
            wormFacing: nextWormFacing,
            wormFrame:
              nextWormFacing === nextActors.wormFacing
                ? (nextActors.wormFrame + 1) % 4
                : 4,
          };
          actorChanged = true;
        }
        lastWormStepRef.current = timestamp;
      }

      if (timestamp - lastChickenStepRef.current >= CHICKEN_STEP_MS) {
        const nextChicken = getChickenStep(
          nextActors.chicken,
          nextActors.worm,
          blocked,
        );
        if (!samePoint(nextChicken, nextActors.chicken)) {
          nextActors = {
            ...nextActors,
            chicken: nextChicken,
            chickenFacing: directionFacing(
              nextActors.chicken,
              nextChicken,
              nextActors.chickenFacing,
            ),
            chickenFrame:
              Math.abs(nextChicken.col - nextActors.worm.col) +
                Math.abs(nextChicken.row - nextActors.worm.row) <=
              1
                ? 5
                : Math.abs(nextChicken.col - nextActors.worm.col) +
                      Math.abs(nextChicken.row - nextActors.worm.row) <=
                    3
                  ? 4
                  : (nextActors.chickenFrame + 1) % 4,
          };
          actorChanged = true;
        }
        lastChickenStepRef.current = timestamp;
      }

      if (
        wormBurrowPhaseRef.current === "idle" &&
        samePoint(nextActors.chicken, nextActors.worm)
      ) {
        const catchPoint = nextActors.worm;
        const nextCaughtCount = caughtRef.current + 1;
        caughtRef.current = nextCaughtCount;
        setCaughtCount(nextCaughtCount);
        setCaughtBurstPoint(catchPoint);
        setCaughtBurstNonce(Date.now());
        nextActors = getSpawn(nextCaughtCount);
        wormTrailRef.current = [{ ...nextActors.worm }];
        lastWormStepRef.current = timestamp + 720;
        lastChickenStepRef.current = timestamp + 720;
        actorChanged = true;

        if (nextCaughtCount >= TARGET_CATCH_COUNT) {
          actorsRef.current = nextActors;
          setActors(nextActors);
          setPhase("success");
          return;
        }
      }

      actorsRef.current = nextActors;
      if (actorChanged) setActors(nextActors);

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return clearAnimation;
  }, [clearAnimation, phase]);

  useEffect(() => {
    if (phase !== "success") return;
    clearAnimation();
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    completeTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, SUCCESS_DELAY_MS);
    return clearCompleteTimer;
  }, [clearAnimation, clearCompleteTimer, onComplete, onSolved, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        resetGame();
      }
      if (key === "h" || key === "?") {
        event.preventDefault();
        setIsHintOpen((current) => !current);
      }
      if (key === "escape") {
        event.preventDefault();
        if (isHintOpen) {
          setIsHintOpen(false);
          return;
        }
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHintOpen, onSkip, resetGame]);

  useEffect(
    () => () => {
      clearAnimation();
      clearCompleteTimer();
    },
    [clearAnimation, clearCompleteTimer],
  );

  const cellLeft = (col: number) => `${(col / GRID_COLUMNS) * 100}%`;
  const boardTop = (row: number) =>
    `${((HUD_HEIGHT + row * CELL_SIZE) / STAGE_HEIGHT) * 100}%`;
  const itemWidth = (width: number) => `${(width / GRID_COLUMNS) * 100}%`;
  const itemHeight = (height: number) =>
    `${((height * CELL_SIZE) / STAGE_HEIGHT) * 100}%`;
  const actorLeft = (point: GridPoint) =>
    `${(((point.col + 0.5) * CELL_SIZE) / STAGE_WIDTH) * 100}%`;
  const actorTop = (point: GridPoint) =>
    `${((HUD_HEIGHT + (point.row + 0.5) * CELL_SIZE) / STAGE_HEIGHT) * 100}%`;
  const draggedObject = dragPreview
    ? objects.find((object) => object.id === dragPreview.id) ?? null
    : null;
  const isWormUnderground = wormBurrowPhase !== "idle";
  const facingTransform = (facing: Facing) => {
    const scale = facing === "left" ? -1 : 1;
    const rotation = facing === "up" ? -7 : facing === "down" ? 7 : 0;
    return `scaleX(${scale}) rotate(${rotation}deg)`;
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      bgColor="#263238"
      overflow="hidden"
      alignItems="stretch"
    >
      <Flex
        ref={stageRef}
        flex="1"
        minW="0"
        position="relative"
        overflow="hidden"
        bgColor="#D8D2C7"
        touchAction="none"
        borderTop="4px solid #D5A858"
        onPointerMove={moveObject}
        onPointerUp={stopObjectDrag}
        onPointerCancel={stopObjectDrag}
      >
        <Box
          position="absolute"
          left="0"
          right="0"
          top={`${(HUD_HEIGHT / STAGE_HEIGHT) * 100}%`}
          bottom="0"
          bgColor="#D9D5CB"
          bgImage="linear-gradient(rgba(108,110,105,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(108,110,105,0.12) 1px, transparent 1px), radial-gradient(circle at 50% 18%, rgba(255,255,255,0.42), transparent 44%)"
          bgSize={`${100 / GRID_COLUMNS}% ${100 / GRID_ROWS}%`}
          boxShadow="inset 0 0 42px rgba(75,64,50,0.22)"
          pointerEvents="none"
        />

        {OFFICE_CORRIDORS.map((corridor) => (
          <Box
            key={corridor.id}
            position="absolute"
            left={cellLeft(corridor.col)}
            top={boardTop(corridor.row)}
            w={itemWidth(corridor.width)}
            h={itemHeight(corridor.height)}
            zIndex={1}
            bgColor="rgba(249,246,237,0.42)"
            borderTop="1px solid rgba(128,118,101,0.12)"
            borderBottom="1px solid rgba(128,118,101,0.12)"
            pointerEvents="none"
          />
        ))}

        {OFFICE_ZONES.map((zone) => (
          <Box
            key={zone.id}
            position="absolute"
            left={cellLeft(zone.col)}
            top={boardTop(zone.row)}
            w={itemWidth(zone.width)}
            h={itemHeight(zone.height)}
            zIndex={1}
            bgColor={zone.color}
            border="1px solid rgba(78,91,91,0.15)"
            borderRadius="5px"
            boxShadow="inset 0 0 14px rgba(255,255,255,0.16)"
            pointerEvents="none"
          >
            <Text
              position="absolute"
              left="6px"
              top="4px"
              px="4px"
              py="1px"
              borderRadius="4px"
              bgColor="rgba(77,88,87,0.62)"
              fontSize="6px"
              fontWeight="900"
              letterSpacing="0.06em"
              color="rgba(255,251,240,0.94)"
            >
              {zone.label}
            </Text>
          </Box>
        ))}

        {[1, 2, 3, 7, 8, 9].map((col) => (
          <Box
            key={`window-${col}`}
            position="absolute"
            left={cellLeft(col)}
            top={boardTop(0)}
            w={itemWidth(1)}
            h={itemHeight(0.34)}
            zIndex={2}
            bgColor="#A7CAD0"
            border="2px solid #667B7F"
            boxShadow="inset 0 0 0 2px rgba(229,246,244,0.55)"
            pointerEvents="none"
          />
        ))}

        <Flex
          position="absolute"
          left={cellLeft(5)}
          bottom="0"
          w={itemWidth(2)}
          h={itemHeight(0.52)}
          zIndex={2}
          bgColor="#8D725C"
          border="2px solid #604A39"
          borderBottom="0"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Text fontSize="6px" fontWeight="900" color="#E9DCC8">
            EXIT
          </Text>
        </Flex>

        <Flex
          position="absolute"
          left="0"
          top="0"
          right="0"
          h={`${(HUD_HEIGHT / STAGE_HEIGHT) * 100}%`}
          zIndex={40}
          px="9px"
          alignItems="center"
          gap="8px"
          bgColor="#2F3437"
          color="#FFF8E9"
          boxShadow="0 4px 0 rgba(50,39,28,0.18)"
        >
          <Flex
            as="button"
            aria-label="離開遊戲"
            w="34px"
            h="34px"
            flexShrink={0}
            borderRadius="9px"
            bgColor="#1F2427"
            border="1px solid rgba(255,255,255,0.12)"
            alignItems="center"
            justifyContent="center"
            fontSize="13px"
            fontWeight="900"
            onClick={onSkip}
          >
            Ⅱ
          </Flex>
          <Flex direction="column" minW="0">
            <Text
              fontSize="8px"
              fontWeight="900"
              letterSpacing="0.14em"
              color="#E7C47E"
            >
              OFFICE CHASE
            </Text>
            <Text
              fontSize="13px"
              fontWeight="900"
              lineHeight="1.15"
              whiteSpace="nowrap"
            >
              公雞追蟲大作戰
            </Text>
          </Flex>
          <Flex ml="auto" alignItems="center" gap="10px">
            <Flex direction="column" alignItems="center" minW="38px">
              <Text fontSize="7px" fontWeight="900" color="#B7C6C5">
                鑽地 CD
              </Text>
              <Text
                fontSize="11px"
                fontWeight="900"
                lineHeight="1.1"
                color={
                  isWormUnderground
                    ? "#F0B85D"
                    : burrowCooldownSeconds > 0
                      ? "#D9A0A0"
                      : "#8ED09B"
                }
              >
                {isWormUnderground
                  ? "使用中"
                  : burrowCooldownSeconds > 0
                    ? `${burrowCooldownSeconds}s`
                    : "READY"}
              </Text>
            </Flex>
            <Flex direction="column" alignItems="center">
              <Text fontSize="7px" fontWeight="900" color="#B7C6C5">
                CATCH
              </Text>
              <Text fontSize="15px" fontWeight="900" lineHeight="1">
                {caughtCount}/{TARGET_CATCH_COUNT}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {routePreview.map((point, index) => (
          <Box
            key={`${pointKey(point)}:${index}`}
            position="absolute"
            left={actorLeft(point)}
            top={actorTop(point)}
            zIndex={3}
            w="9px"
            h="5px"
            borderRadius="999px"
            bgColor="#67D6E2"
            boxShadow="0 0 8px rgba(103,214,226,0.92)"
            transform="translate(-50%, -50%)"
            animation={`${routePulse} 920ms ease-in-out ${index * 70}ms infinite`}
            pointerEvents="none"
          />
        ))}

        {!isWormUnderground ? wormPreview.map((point, index) => (
          <Box
            key={`worm-preview:${pointKey(point)}:${index}`}
            position="absolute"
            left={actorLeft(point)}
            top={actorTop(point)}
            zIndex={4}
            w={index === 0 ? "9px" : "7px"}
            h={index === 0 ? "9px" : "7px"}
            borderRadius="999px"
            bgColor="#F1B94D"
            border="1px solid rgba(113,73,24,0.52)"
            boxShadow="0 0 7px rgba(241,185,77,0.84)"
            transform="translate(-50%, -50%)"
            opacity={1 - index * 0.22}
            pointerEvents="none"
          />
        )) : null}

        {FIXED_FURNITURE.map((item) => (
          <Flex
            key={item.id}
            position="absolute"
            left={cellLeft(item.col)}
            top={boardTop(item.row)}
            w={itemWidth(item.width)}
            h={itemHeight(item.height)}
            zIndex={5}
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <FixedFurnitureSprite item={item} />
          </Flex>
        ))}

        {dragPreview && draggedObject ? (
          <Flex
            position="absolute"
            left={cellLeft(dragPreview.point.col)}
            top={boardTop(dragPreview.point.row)}
            w={itemWidth(draggedObject.width)}
            h={itemHeight(draggedObject.height)}
            zIndex={11}
            border={`2px solid ${
              dragPreview.canDrop
                ? dragPreview.isExact
                  ? "#79C88C"
                  : "#F0B94F"
                : "#D85D62"
            }`}
            borderRadius="8px"
            bgColor={
              dragPreview.canDrop
                ? dragPreview.isExact
                  ? "rgba(121,200,140,0.2)"
                  : "rgba(240,185,79,0.22)"
                : "rgba(216,93,98,0.2)"
            }
            boxShadow={`0 0 0 3px ${
              dragPreview.canDrop
                ? "rgba(121,200,140,0.12)"
                : "rgba(216,93,98,0.12)"
            }`}
            pointerEvents="none"
          />
        ) : null}

        {objects.map((item) => {
          const isDragging = draggingId === item.id;
          const displayPoint =
            isDragging && dragPreview ? dragPreview.point : item;
          return (
            <Flex
              key={item.id}
              as="button"
              aria-label={`拖動${item.label}`}
              position="absolute"
              left={cellLeft(displayPoint.col)}
              top={boardTop(displayPoint.row)}
              w={itemWidth(item.width)}
              h={itemHeight(item.height)}
              zIndex={isDragging ? 22 : 12}
              alignItems="center"
              justifyContent="center"
              cursor={phase === "playing" ? (isDragging ? "grabbing" : "grab") : "default"}
              touchAction="none"
              transform={isDragging ? "scale(1.06)" : "scale(1)"}
              opacity={isDragging && !dragPreview?.canDrop ? 0.58 : 1}
              filter={
                isDragging
                  ? dragPreview?.canDrop
                    ? "drop-shadow(0 0 4px rgba(255,255,255,1)) drop-shadow(0 0 9px rgba(255,207,88,0.98))"
                    : "drop-shadow(0 0 8px rgba(216,93,98,0.95))"
                  : "drop-shadow(0 0 3px rgba(255,255,255,0.98)) drop-shadow(0 0 6px rgba(255,207,88,0.72))"
              }
              transition="left 90ms ease-out, top 90ms ease-out, filter 120ms ease, transform 120ms ease, opacity 120ms ease"
              onPointerDown={(event) => startObjectDrag(event, item)}
            >
              <MovableObjectSprite kind={item.kind} />
              {isDragging && dragPreview ? (
                <Text
                  position="absolute"
                  left="50%"
                  bottom="calc(100% + 3px)"
                  transform="translateX(-50%)"
                  px="6px"
                  py="2px"
                  borderRadius="999px"
                  bgColor={
                    dragPreview.canDrop
                      ? dragPreview.isExact
                        ? "#568D66"
                        : "#B67B28"
                      : "#A94249"
                  }
                  color="white"
                  fontSize="6px"
                  fontWeight="900"
                  whiteSpace="nowrap"
                  boxShadow="0 2px 4px rgba(40,34,28,0.28)"
                  pointerEvents="none"
                >
                  {dragPreview.canDrop
                    ? dragPreview.isExact
                      ? "放開即可放置"
                      : "已吸附最近空位"
                    : "此處有設備"}
                </Text>
              ) : null}
              <Box
                position="absolute"
                inset="2px"
                borderRadius="6px"
                border={
                  isDragging
                    ? "3px solid #FFFFFF"
                    : "2px solid rgba(255,255,255,0.96)"
                }
                boxShadow={
                  isDragging
                    ? "0 0 0 2px #F2C85F, 0 0 11px rgba(255,255,255,0.92)"
                    : "0 0 0 1px rgba(220,166,55,0.92), 0 0 7px rgba(255,255,255,0.7)"
                }
                pointerEvents="none"
              />
            </Flex>
          );
        })}

        {wormBurrowTarget && wormBurrowPhase === "sinking" ? (
          <Box
            position="absolute"
            left={actorLeft(wormBurrowTarget)}
            top={actorTop(wormBurrowTarget)}
            zIndex={16}
            w="30px"
            h="13px"
            borderRadius="50%"
            bgColor="rgba(100,70,43,0.54)"
            border="2px dashed rgba(87,58,34,0.82)"
            boxShadow="0 0 0 4px rgba(150,106,62,0.16)"
            transform="translate(-50%, -50%)"
            pointerEvents="none"
          />
        ) : null}

        {burrowBurstPoint ? (
          <Box
            key={burrowBurstNonce}
            position="absolute"
            left={actorLeft(burrowBurstPoint)}
            top={actorTop(burrowBurstPoint)}
            zIndex={17}
            w="38px"
            h="19px"
            borderRadius="50%"
            border="4px solid rgba(146,98,55,0.72)"
            boxShadow="0 0 0 3px rgba(222,180,117,0.28)"
            animation={`${wormBurrowBurst} 520ms ease-out forwards`}
            pointerEvents="none"
          />
        ) : null}

        <Flex
          position="absolute"
          left={actorLeft(actors.worm)}
          top={actorTop(actors.worm)}
          w="48px"
          h="48px"
          transform="translate(-50%, -50%)"
          transition={
            isWormUnderground
              ? "none"
              : `left ${Math.round(WORM_STEP_MS * 0.94)}ms cubic-bezier(0.22, 0.61, 0.36, 1), top ${Math.round(WORM_STEP_MS * 0.94)}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
          }
          zIndex={18}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          aria-label="持續逃跑的蟲"
        >
          <Flex
            transform={facingTransform(actors.wormFacing)}
            alignItems="center"
            justifyContent="center"
          >
            <Box
              animation={
                wormBurrowPhase === "sinking"
                  ? `${wormBurrowSink} ${WORM_BURROW_DURATION_MS}ms ease-in forwards`
                  : wormBurrowPhase === "emerging"
                    ? `${wormBurrowEmerge} 280ms ease-out forwards`
                    : `${actorStride} ${WORM_STEP_MS * 2}ms ease-in-out infinite`
              }
            >
              <WormSprite
                frame={isWormUnderground ? 3 : actors.wormFrame}
                size="46px"
              />
            </Box>
          </Flex>
          {isWormUnderground ? (
            <Text
              position="absolute"
              left="50%"
              bottom="calc(100% - 2px)"
              transform="translateX(-50%)"
              px="6px"
              py="2px"
              borderRadius="999px"
              bgColor="rgba(125,79,53,0.9)"
              color="#FFF8E9"
              fontSize="6px"
              fontWeight="900"
              whiteSpace="nowrap"
              boxShadow="0 2px 4px rgba(55,38,27,0.26)"
            >
              {wormBurrowPhase === "sinking" ? "鑽地！" : "冒出來！"}
            </Text>
          ) : null}
        </Flex>

        <Flex
          position="absolute"
          left={actorLeft(actors.chicken)}
          top={actorTop(actors.chicken)}
          w="58px"
          h="58px"
          transform="translate(-50%, -54%)"
          transition={`left ${Math.round(CHICKEN_STEP_MS * 0.94)}ms cubic-bezier(0.22, 0.61, 0.36, 1), top ${Math.round(CHICKEN_STEP_MS * 0.94)}ms cubic-bezier(0.22, 0.61, 0.36, 1)`}
          zIndex={19}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Flex
            w="100%"
            h="100%"
            transform={facingTransform(actors.chickenFacing)}
            alignItems="center"
            justifyContent="center"
            aria-label="自動追蟲的公雞"
          >
            <Box
              animation={`${actorStride} ${CHICKEN_STEP_MS * 2}ms ease-in-out infinite`}
            >
              <ChickenSprite frame={actors.chickenFrame} size="58px" />
            </Box>
          </Flex>
        </Flex>

        {caughtBurstPoint ? (
          <Flex
            key={caughtBurstNonce}
            position="absolute"
            left={actorLeft(caughtBurstPoint)}
            top={actorTop(caughtBurstPoint)}
            zIndex={34}
            transform="translate(-50%, -50%)"
            direction="column"
            alignItems="center"
            color="#9B4B35"
            fontWeight="900"
            textShadow="0 2px 0 white"
            animation={`${caughtBurst} 760ms ease-out forwards`}
            pointerEvents="none"
          >
            <Flex alignItems="flex-end" gap="-6px">
              <ChickenSprite frame={5} size="48px" />
              <WormSprite frame={5} size="34px" />
            </Flex>
            <Text fontSize="23px" lineHeight="1">
              抓到！
            </Text>
            <Text fontSize="18px" lineHeight="1">
              ✦
            </Text>
          </Flex>
        ) : null}

        {phase === "playing" ? (
          <Flex
            position="absolute"
            right="9px"
            bottom="9px"
            zIndex={31}
            alignItems="center"
          >
            <Flex
              as="button"
              aria-label="查看玩法"
              w="38px"
              h="38px"
              flexShrink={0}
              borderRadius="999px"
              border="2px solid #D5A858"
              bgColor="#FFF7E6"
              color="#5D4935"
              fontSize="17px"
              fontWeight="900"
              alignItems="center"
              justifyContent="center"
              onClick={() => setIsHintOpen(true)}
            >
              ?
            </Flex>
          </Flex>
        ) : null}

        {phase === "intro" ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={50}
            bgColor="rgba(34,39,41,0.64)"
            alignItems="center"
            justifyContent="center"
            p="18px"
          >
            <Flex
              w="100%"
              maxW="318px"
              direction="column"
              alignItems="center"
              borderRadius="18px"
              overflow="hidden"
              bgColor="#E6F1EC"
              boxShadow="0 9px 0 rgba(30,35,36,0.34)"
              animation={`${cardAppear} 260ms ease-out`}
            >
              <Flex
                w="100%"
                direction="column"
                alignItems="center"
                px="22px"
                pt="25px"
                pb="20px"
                color="#314E52"
              >
                <Text fontSize="24px" fontWeight="900" letterSpacing="0.03em">
                  公雞追蟲大作戰
                </Text>
                <Flex mt="14px" alignItems="center" gap="12px">
                  <ChickenSprite frame={1} size="64px" />
                  <Text fontSize="21px" fontWeight="900" color="#62AEB7">
                    · · · →
                  </Text>
                  <WormSprite frame={3} size="44px" />
                </Flex>
                <Flex mt="14px" gap="6px" alignItems="center">
                  {(["chair", "whiteboard", "cart"] as OfficeObjectKind[]).map(
                    (kind, index) => (
                      <Flex
                        key={kind}
                        w={kind === "whiteboard" ? "68px" : "38px"}
                        h="42px"
                        alignItems="center"
                        justifyContent="center"
                        border="2px solid rgba(255,255,255,0.96)"
                        borderRadius="7px"
                        boxShadow="0 0 0 1px rgba(220,166,55,0.84)"
                        animation={`${tutorialObjectSlide} 900ms ease-in-out ${
                          index * 130
                        }ms infinite`}
                      >
                        <MovableObjectSprite kind={kind} />
                      </Flex>
                    ),
                  )}
                </Flex>
              </Flex>
              <Flex
                w="100%"
                px="22px"
                pt="17px"
                pb="22px"
                direction="column"
                alignItems="center"
                bgColor="#584331"
                color="white"
                textAlign="center"
              >
                <Text fontSize="13px" fontWeight="800" lineHeight="1.7">
                  拖動有白色外框的辦公物件
                  <br />
                  改變追逐路線，幫助公雞追到蟲
                </Text>
                <Flex
                  as="button"
                  mt="15px"
                  px="31px"
                  py="9px"
                  borderRadius="999px"
                  bgColor="#F2C86E"
                  color="#4D3A29"
                  fontSize="15px"
                  fontWeight="900"
                  boxShadow="0 4px 0 #A9783A"
                  onClick={resetGame}
                >
                  開始追蟲
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {phase === "success" ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={54}
            bgColor="rgba(34,39,41,0.66)"
            alignItems="center"
            justifyContent="center"
            p="18px"
          >
            <Flex
              w="100%"
              maxW="300px"
              direction="column"
              alignItems="center"
              borderRadius="18px"
              bgColor="#E8F2EC"
              color="#314E52"
              px="24px"
              py="27px"
              textAlign="center"
              boxShadow="0 9px 0 rgba(30,35,36,0.34)"
              animation={`${cardAppear} 260ms ease-out`}
            >
              <ChickenSprite frame={5} size="96px" />
              <Text mt="7px" fontSize="24px" fontWeight="900">
                追蟲成功
              </Text>
              <Text mt="7px" fontSize="14px" fontWeight="800">
                公雞成功抓到蟲了
              </Text>
              {typeof successSavingsTotal === "number" ? (
                <Text mt="10px" fontSize="13px" fontWeight="800" color="#8B6537">
                  獲得 {successSavingsTotal} 小日幣
                </Text>
              ) : null}
            </Flex>
          </Flex>
        ) : null}

        {isHintOpen ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={58}
            bgColor="rgba(34,39,41,0.76)"
            alignItems="center"
            justifyContent="center"
            p="20px"
            onClick={() => setIsHintOpen(false)}
          >
            <Flex
              w="100%"
              maxW="302px"
              direction="column"
              borderRadius="16px"
              bgColor="#FFF7E9"
              color="#5D4935"
              px="22px"
              py="22px"
              boxShadow="0 9px 0 rgba(30,35,36,0.34)"
              onClick={(event) => event.stopPropagation()}
            >
              <Text fontSize="20px" fontWeight="900">
                玩法
              </Text>
              <Text mt="12px" fontSize="13px" fontWeight="700" lineHeight="1.8">
                1. 蟲與公雞開場就會移動；黃點預測蟲接下來的方向。
                <br />
                2. 蟲被逼入死角時會鑽過家具，逃到附近較安全的空位。
                <br />
                3. 鑽地有 CD；先逼牠使用，再於 CD 期間完成第二次包圍。
                <br />
                4. 青色虛線是公雞路線；拖設備可改變各區之間的通道。
                <br />
                5. 綠框可直接放置；黃框會吸附最近空位；紅框則會回到原位。
                <br />
                6. 幫公雞追上蟲一次即可完成。
              </Text>
              <Flex
                as="button"
                mt="16px"
                alignSelf="center"
                px="24px"
                py="8px"
                borderRadius="999px"
                bgColor="#5E7776"
                color="white"
                fontWeight="900"
                onClick={() => setIsHintOpen(false)}
              >
                知道了
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}

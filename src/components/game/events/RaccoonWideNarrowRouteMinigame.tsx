"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type RouteWidth = "wide" | "narrow";
type RouteDirection = "top" | "right" | "bottom" | "left";
type RouteEdge = RouteWidth | null;

type RouteCell = {
  col: number;
  row: number;
};

type RouteStep = {
  cell: RouteCell;
  widthBefore: RouteWidth;
  widthAfter: RouteWidth;
};

type KeyNodeDefinition = {
  label: "寬轉窄" | "窄轉寬";
  imagePath: string;
  rotationDeg: number;
  edges: Record<RouteDirection, RouteEdge>;
};

const BOARD_SIZE = 5;
const START_CELL: RouteCell = { col: 0, row: 4 };
const GOAL_CELL: RouteCell = { col: 4, row: 0 };
const START_WIDTH: RouteWidth = "narrow";
const GOAL_WIDTH: RouteWidth = "wide";
const GOAL_ENTRY_SIDE: RouteDirection = "bottom";
const ROUTE_SURFACE_COLOR = "#DBC19C";
const ROUTE_GRASS_COLOR = "#C2DB99";

const OBSTACLE_KEYS = new Set([
  "0,1",
  "0,2",
  "3,3",
  "4,3",
]);

const KEY_NODES: Record<string, KeyNodeDefinition> = {
  "1,4": {
    label: "窄轉寬",
    imagePath: "/images/route/route_new/narrow_to_wide_街道.png",
    rotationDeg: -90,
    edges: { top: null, right: "wide", bottom: null, left: "narrow" },
  },
  "2,2": {
    label: "寬轉窄",
    imagePath: "/images/route/route_new/wide_to_narrow_街道.png",
    rotationDeg: 180,
    edges: { top: "narrow", right: null, bottom: "wide", left: null },
  },
  "3,1": {
    label: "窄轉寬",
    imagePath: "/images/route/route_new/narrow_to_wide_街道.png",
    rotationDeg: -90,
    edges: { top: null, right: "wide", bottom: null, left: "narrow" },
  },
};

const CLUE_CELLS = [
  { col: 2, row: 3, label: "第一組浣熊腳印" },
  { col: 2, row: 1, label: "第二組浣熊腳印" },
  { col: 4, row: 1, label: "第三組浣熊腳印" },
] as const;

const SOLUTION_CELLS: RouteCell[] = [
  { col: 0, row: 4 },
  { col: 1, row: 4 },
  { col: 2, row: 4 },
  { col: 2, row: 3 },
  { col: 2, row: 2 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
  { col: 4, row: 1 },
  { col: 4, row: 0 },
];

const hintPulse = keyframes`
  0%, 100% {
    box-shadow: inset 0 0 0 3px rgba(255, 235, 133, 0);
  }
  50% {
    box-shadow: inset 0 0 0 3px rgba(255, 235, 133, 0.96), 0 0 15px rgba(235, 179, 64, 0.58);
  }
`;

const statusPop = keyframes`
  0% { transform: scale(0.8); opacity: 0.35; }
  55% { transform: scale(1.14); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const runnerHop = keyframes`
  0%, 100% { transform: translate(-50%, -50%) translateY(0) scale(1); }
  50% { transform: translate(-50%, -50%) translateY(-7px) scale(1.05); }
`;

function cellKey(cell: RouteCell) {
  return `${cell.col},${cell.row}`;
}

function isAdjacent(first: RouteCell, second: RouteCell) {
  return Math.abs(first.col - second.col) + Math.abs(first.row - second.row) === 1;
}

function connectionDirections(
  from: RouteCell,
  to: RouteCell,
): { from: RouteDirection; to: RouteDirection } {
  if (to.row < from.row) return { from: "top", to: "bottom" };
  if (to.row > from.row) return { from: "bottom", to: "top" };
  if (to.col < from.col) return { from: "left", to: "right" };
  return { from: "right", to: "left" };
}

function getNodeExit(
  node: KeyNodeDefinition,
  entrySide: RouteDirection,
) {
  return (
    Object.entries(node.edges) as Array<[RouteDirection, RouteEdge]>
  ).find(([direction, width]) => direction !== entrySide && Boolean(width));
}

function getMoveResult(
  current: RouteStep,
  candidate: RouteCell,
):
  | {
      ok: true;
      widthAfter: RouteWidth;
      enteredNode: KeyNodeDefinition | null;
    }
  | { ok: false; message: string } {
  const candidateKey = cellKey(candidate);
  if (OBSTACLE_KEYS.has(candidateKey)) {
    return { ok: false, message: "前方是施工障礙，這格不能通過。" };
  }

  const directions = connectionDirections(current.cell, candidate);
  const currentNode = KEY_NODES[cellKey(current.cell)] ?? null;
  if (currentNode) {
    const exitWidth = currentNode.edges[directions.from];
    if (!exitWidth) {
      return {
        ok: false,
        message: "拼圖節點只能從另一側直直離開，不能在節點裡轉彎。",
      };
    }
    if (exitWidth !== current.widthAfter) {
      return {
        ok: false,
        message: "節點出口粗細不符，請從正確的另一側離開。",
      };
    }
  }

  if (candidateKey === cellKey(GOAL_CELL)) {
    if (directions.to !== GOAL_ENTRY_SIDE) {
      return { ok: false, message: "公園入口方向沒有對到。" };
    }
    if (current.widthAfter !== GOAL_WIDTH) {
      return {
        ok: false,
        message: "公園是寬街口，要先經過窄轉寬節點。",
      };
    }
    return { ok: true, widthAfter: GOAL_WIDTH, enteredNode: null };
  }

  const candidateNode = KEY_NODES[candidateKey] ?? null;
  if (!candidateNode) {
    return {
      ok: true,
      widthAfter: current.widthAfter,
      enteredNode: null,
    };
  }

  const entryWidth = candidateNode.edges[directions.to];
  if (!entryWidth) {
    return {
      ok: false,
      message: "拼圖節點的街口方向沒有對到，要從有開口的一側進入。",
    };
  }
  if (entryWidth !== current.widthAfter) {
    return {
      ok: false,
      message: `節點入口是${entryWidth === "wide" ? "寬街口" : "窄街口"}，目前路線是${
        current.widthAfter === "wide" ? "寬路" : "窄路"
      }。`,
    };
  }

  const exit = getNodeExit(candidateNode, directions.to);
  if (!exit?.[1]) {
    return {
      ok: false,
      message: "這張關鍵拼圖沒有可用的另一側出口。",
    };
  }

  return {
    ok: true,
    widthAfter: exit[1],
    enteredNode: candidateNode,
  };
}

function RoutePathShape({
  directions,
  width,
}: {
  directions: RouteDirection[];
  width: RouteWidth;
}) {
  const edgePoint: Record<RouteDirection, string> = {
    top: "50 0",
    right: "100 50",
    bottom: "50 100",
    left: "0 50",
  };
  const pathData =
    directions.length >= 2
      ? `M ${edgePoint[directions[0]]} L 50 50 L ${edgePoint[directions[1]]}`
      : directions.length === 1
        ? `M 50 50 L ${edgePoint[directions[0]]}`
        : "";

  return (
    <Box
      position="absolute"
      zIndex={3}
      inset="0"
      pointerEvents="none"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={ROUTE_SURFACE_COLOR}
          strokeWidth={width === "wide" ? 100 : 36}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}

export function RaccoonWideNarrowRouteMinigame({
  isExternallyLocked = false,
  onComplete,
}: {
  isExternallyLocked?: boolean;
  onComplete: () => void;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<RouteStep[]>([
    {
      cell: START_CELL,
      widthBefore: START_WIDTH,
      widthAfter: START_WIDTH,
    },
  ]);
  const draggingRef = useRef(false);
  const lastHoverKeyRef = useRef<string | null>(null);
  const runTimerRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [path, setPath] = useState<RouteStep[]>(pathRef.current);
  const [runnerPathIndex, setRunnerPathIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintKeys, setHintKeys] = useState<string[]>([]);
  const [mismatchKeys, setMismatchKeys] = useState<string[]>([]);
  const [hint, setHint] = useState(
    "從家畫出一筆路線；進入原始拼圖節點時，街道粗細會跟著轉換",
  );

  const clearRunTimers = useCallback(() => {
    runTimerRefs.current.forEach((timer) => clearTimeout(timer));
    runTimerRefs.current = [];
  }, []);

  useEffect(
    () => () => {
      clearRunTimers();
      if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current);
      if (mismatchTimerRef.current !== null) clearTimeout(mismatchTimerRef.current);
    },
    [clearRunTimers],
  );

  const isLocked = isRunning || isExternallyLocked;
  const visitedKeys = new Set(path.map((step) => cellKey(step.cell)));
  const currentStep = path[path.length - 1] ?? path[0];
  const currentWidth = currentStep?.widthAfter ?? START_WIDTH;
  const collectedClueKeys = CLUE_CELLS.filter((clue) =>
    visitedKeys.has(cellKey(clue)),
  ).map(cellKey);
  const visitedKeyNodeCount = Object.keys(KEY_NODES).filter((key) =>
    visitedKeys.has(key),
  ).length;
  const isAtGoal = cellKey(currentStep.cell) === cellKey(GOAL_CELL);
  const isRouteReady =
    isAtGoal &&
    collectedClueKeys.length === CLUE_CELLS.length &&
    visitedKeyNodeCount === Object.keys(KEY_NODES).length;

  const visitCell = useCallback(
    (candidate: RouteCell) => {
      if (isLocked) return;
      const currentPath = pathRef.current;
      const current = currentPath[currentPath.length - 1];
      if (!current) return;
      const candidateKey = cellKey(candidate);
      if (candidateKey === cellKey(current.cell)) return;

      const previous = currentPath[currentPath.length - 2];
      if (previous && candidateKey === cellKey(previous.cell)) {
        const nextPath = currentPath.slice(0, -1);
        pathRef.current = nextPath;
        setPath(nextPath);
        setRunnerPathIndex(0);
        setHintKeys([]);
        setMismatchKeys([]);
        setHint(
          `退回一格了，目前路線恢復成${
            nextPath[nextPath.length - 1]?.widthAfter === "wide" ? "寬路" : "窄路"
          }。`,
        );
        return;
      }

      if (cellKey(current.cell) === cellKey(GOAL_CELL)) {
        setHint("公園必須是最後一格；往回一格才能調整路線。");
        return;
      }
      if (!isAdjacent(current.cell, candidate)) {
        setHint("只能連接上、下、左、右相鄰的路徑格。");
        return;
      }
      if (currentPath.some((step) => cellKey(step.cell) === candidateKey)) {
        setHint("路線交叉了！走過的格子不能再次經過。");
        return;
      }

      const result = getMoveResult(current, candidate);
      if (!result.ok) {
        setHint(result.message);
        setMismatchKeys([cellKey(current.cell), candidateKey]);
        if (mismatchTimerRef.current !== null) {
          clearTimeout(mismatchTimerRef.current);
        }
        mismatchTimerRef.current = setTimeout(() => {
          setMismatchKeys([]);
          mismatchTimerRef.current = null;
        }, 720);
        return;
      }

      const nextStep: RouteStep = {
        cell: candidate,
        widthBefore: current.widthAfter,
        widthAfter: result.widthAfter,
      };
      const nextPath = [...currentPath, nextStep];
      const nextVisitedKeys = new Set(nextPath.map((step) => cellKey(step.cell)));
      const nextCollectedClues = CLUE_CELLS.filter((clue) =>
        nextVisitedKeys.has(cellKey(clue)),
      ).length;
      const nextVisitedKeyNodes = Object.keys(KEY_NODES).filter((key) =>
        nextVisitedKeys.has(key),
      ).length;
      pathRef.current = nextPath;
      setPath(nextPath);
      setRunnerPathIndex(0);
      setHintKeys([]);
      setMismatchKeys([]);

      if (candidateKey === cellKey(GOAL_CELL)) {
        const hasCompletedRoute =
          nextCollectedClues === CLUE_CELLS.length &&
          nextVisitedKeyNodes === Object.keys(KEY_NODES).length;
        setHint(
          hasCompletedRoute
            ? "路線和三個關鍵節點都接好了！按「沿路出發」。"
            : "還沒通過全部節點並收齊腳印，先沿路退回。",
        );
        return;
      }

      if (result.enteredNode) {
        setHint(
          `進入${result.enteredNode.label}節點，離開後變成${
            result.widthAfter === "wide" ? "寬路" : "窄路"
          }。`,
        );
        return;
      }

      const clueIndex = CLUE_CELLS.findIndex(
        (clue) => cellKey(clue) === candidateKey,
      );
      if (clueIndex >= 0) {
        setHint(
          `找到第${nextCollectedClues}組腳印！目前維持${
            result.widthAfter === "wide" ? "寬路" : "窄路"
          }。`,
        );
        return;
      }

      const hasExit = [
        { col: candidate.col - 1, row: candidate.row },
        { col: candidate.col + 1, row: candidate.row },
        { col: candidate.col, row: candidate.row - 1 },
        { col: candidate.col, row: candidate.row + 1 },
      ].some((neighbor) => {
        if (
          neighbor.col < 0 ||
          neighbor.row < 0 ||
          neighbor.col >= BOARD_SIZE ||
          neighbor.row >= BOARD_SIZE ||
          nextVisitedKeys.has(cellKey(neighbor))
        ) {
          return false;
        }
        return getMoveResult(nextStep, neighbor).ok;
      });

      setHint(
        hasExit
          ? `路線延伸了，目前維持${result.widthAfter === "wide" ? "寬路" : "窄路"}。`
          : "這條路沒有出口了，沿原路退回一格試試。",
      );
    },
    [isLocked],
  );

  const readCellFromElement = useCallback((element: Element | null) => {
    const cellElement = element?.closest<HTMLElement>("[data-key-node-route-cell]");
    if (!cellElement) return null;
    const col = Number(cellElement.dataset.col);
    const row = Number(cellElement.dataset.row);
    if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
    return { col, row };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isLocked) return;
      event.preventDefault();
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const candidate = readCellFromElement(event.target as Element);
      if (candidate) {
        lastHoverKeyRef.current = cellKey(candidate);
        visitCell(candidate);
      }
    },
    [isLocked, readCellFromElement, visitCell],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || isLocked) return;
      const candidate = readCellFromElement(
        document.elementFromPoint(event.clientX, event.clientY),
      );
      if (!candidate) return;
      const candidateKey = cellKey(candidate);
      if (candidateKey === lastHoverKeyRef.current) return;
      lastHoverKeyRef.current = candidateKey;
      visitCell(candidate);
    },
    [isLocked, readCellFromElement, visitCell],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
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
    const initialPath: RouteStep[] = [
      {
        cell: START_CELL,
        widthBefore: START_WIDTH,
        widthAfter: START_WIDTH,
      },
    ];
    pathRef.current = initialPath;
    setPath(initialPath);
    setRunnerPathIndex(0);
    setHintKeys([]);
    setMismatchKeys([]);
    setHint("從家畫出一筆路線；進入原始拼圖節點時，街道粗細會跟著轉換");
  };

  const showHint = () => {
    if (isLocked) return;
    const currentPath = pathRef.current;
    const followsSolution = currentPath.every(
      (step, index) =>
        cellKey(step.cell) === cellKey(SOLUTION_CELLS[index]),
    );
    if (!followsSolution) {
      setHint("目前已偏離安全路線；先沿原路退回，再按提示。");
      return;
    }
    setHintKeys(
      SOLUTION_CELLS.slice(currentPath.length, currentPath.length + 3).map(cellKey),
    );
    setHint("發亮的三格會依序通過下一個粗細轉換節點。");
    if (hintTimerRef.current !== null) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setHintKeys([]);
      hintTimerRef.current = null;
    }, 2200);
  };

  const runRoute = () => {
    if (isLocked) return;
    if (!isRouteReady) {
      setHint(
        isAtGoal
          ? "還有腳印沒找到，先退回去補完路線。"
          : "先通過三個關鍵拼圖節點、收齊腳印，再接到公園。",
      );
      return;
    }

    clearRunTimers();
    setIsRunning(true);
    setRunnerPathIndex(0);
    setHint("路線鎖定！小麥正沿著規劃好的粗細路線前進。");
    path.forEach((_, index) => {
      const timer = setTimeout(() => {
        setRunnerPathIndex(index);
      }, 120 + index * 180);
      runTimerRefs.current.push(timer);
    });
    const finishTimer = setTimeout(
      () => {
        setHint("三個轉換節點全部通過，成功抵達公園！");
        const completeTimer = setTimeout(onComplete, 420);
        runTimerRefs.current.push(completeTimer);
      },
      260 + path.length * 180,
    );
    runTimerRefs.current.push(finishTimer);
  };

  const runnerCell = path[runnerPathIndex]?.cell ?? START_CELL;

  return (
    <Flex
      w="100%"
      h="100%"
      position="relative"
      direction="column"
      bgColor="#FDF6EA"
      overflow="hidden"
    >
      <Flex
        h="50px"
        flexShrink={0}
        bgColor="#9B765C"
        alignItems="center"
        px="18px"
      >
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          浣熊篇・節點鋪路
        </Text>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        alignItems="center"
        justifyContent="space-between"
        bgColor="#F8E7CC"
        px="16px"
        gap="10px"
      >
        <Box>
          <Text color="#785943" fontSize="13px" fontWeight="900">
            通過拼圖節點，切換路線粗細
          </Text>
          <Flex mt="4px" gap="5px">
            {CLUE_CELLS.map((clue, index) => {
              const isCollected = collectedClueKeys.includes(cellKey(clue));
              return (
                <Flex
                  key={clue.label}
                  w="24px"
                  h="24px"
                  borderRadius="50%"
                  bgColor={isCollected ? "#D69548" : "rgba(155,118,92,0.16)"}
                  color={isCollected ? "#FFFFFF" : "#A48770"}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="11px" fontWeight="900">
                    {isCollected ? "✓" : index + 1}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        </Box>
        <Flex
          key={currentWidth}
          px="13px"
          py="8px"
          borderRadius="999px"
          bgColor={currentWidth === "wide" ? "#C9844D" : "#5F8F82"}
          color="#FFFFFF"
          direction="column"
          alignItems="center"
          animation={`${statusPop} 260ms ease`}
          minW="76px"
        >
          <Text fontSize="9px" fontWeight="800" opacity={0.88}>
            目前路寬
          </Text>
          <Text fontSize="13px" fontWeight="900" lineHeight="1.1">
            {currentWidth === "wide" ? "寬路" : "窄路"}
          </Text>
        </Flex>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF0C6"
        backgroundImage="radial-gradient(circle at 16% 24%, rgba(194,219,153,0.32), transparent 30%), radial-gradient(circle at 84% 76%, rgba(219,193,156,0.28), transparent 32%)"
        px="10px"
        py="8px"
      >
        <Box
          ref={boardRef}
          position="relative"
          w="100%"
          maxW="348px"
          aspectRatio="1"
          p="7px"
          borderRadius="24px"
          bgColor={ROUTE_GRASS_COLOR}
          border="1px solid rgba(111,135,77,0.2)"
          boxShadow="0 16px 30px rgba(105,75,49,0.14)"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{ touchAction: "none" }}
          aria-label="浣熊公園關鍵節點一筆路線"
        >
          <Grid
            position="absolute"
            inset="7px"
            templateColumns={`repeat(${BOARD_SIZE}, 1fr)`}
            templateRows={`repeat(${BOARD_SIZE}, 1fr)`}
            gap="0"
            overflow="hidden"
            borderRadius="17px"
          >
            {Array.from({ length: BOARD_SIZE ** 2 }, (_, index) => {
              const cell = {
                col: index % BOARD_SIZE,
                row: Math.floor(index / BOARD_SIZE),
              };
              const key = cellKey(cell);
              const pathIndex = path.findIndex((step) => cellKey(step.cell) === key);
              const step = path[pathIndex];
              const previousStep = path[pathIndex - 1];
              const nextStep = path[pathIndex + 1];
              const isVisited = Boolean(step);
              const isObstacle = OBSTACLE_KEYS.has(key);
              const keyNode = KEY_NODES[key] ?? null;
              const clueIndex = CLUE_CELLS.findIndex(
                (clue) => cellKey(clue) === key,
              );
              const isClue = clueIndex >= 0;
              const isCollected = collectedClueKeys.includes(key);
              const isStart = key === cellKey(START_CELL);
              const isGoal = key === cellKey(GOAL_CELL);
              const isHinted = hintKeys.includes(key);
              const isMismatch = mismatchKeys.includes(key);
              const baseLabel = isStart
                ? "家，窄路起點"
                : isGoal
                  ? "公園，寬路入口"
                  : isObstacle
                    ? `施工障礙，第${cell.row + 1}列第${cell.col + 1}格`
                    : keyNode
                      ? `${keyNode.label}關鍵節點，第${cell.row + 1}列第${cell.col + 1}格`
                      : `普通路徑格，第${cell.row + 1}列第${cell.col + 1}格`;
              const cellLabel =
                isClue && !isGoal
                  ? `${baseLabel}，${CLUE_CELLS[clueIndex].label}`
                  : baseLabel;

              return (
                <Flex
                  key={`raccoon-node-route-cell-${key}`}
                  as="button"
                  data-key-node-route-cell={key}
                  data-col={cell.col}
                  data-row={cell.row}
                  position="relative"
                  minW="0"
                  minH="0"
                  borderRadius="0"
                  overflow="hidden"
                  bgColor={ROUTE_GRASS_COLOR}
                  border="0"
                  animation={
                    isHinted ? `${hintPulse} 850ms ease-in-out infinite` : undefined
                  }
                  cursor={isLocked ? "default" : "pointer"}
                  aria-label={cellLabel}
                  onClick={() => visitCell(cell)}
                >
                  {!isObstacle ? (
                    <Box
                      position="absolute"
                      inset="0"
                      opacity={0.28}
                      backgroundImage="radial-gradient(circle at 28% 32%, rgba(105,139,72,0.55) 0 2px, transparent 3px), radial-gradient(circle at 68% 66%, rgba(105,139,72,0.45) 0 1px, transparent 2px)"
                    />
                  ) : null}

                  {isObstacle ? (
                    <Flex
                      position="absolute"
                      inset="8px"
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      gap="3px"
                      borderRadius="10px"
                      bgColor="#D1C3B1"
                      border="1px solid rgba(126,101,76,0.18)"
                      boxShadow="0 3px 8px rgba(105,75,49,0.09)"
                    >
                      <Box
                        w="24px"
                        h="3px"
                        borderRadius="999px"
                        bgColor="#A98E72"
                        opacity={0.62}
                      />
                      <Text
                        color="#806A55"
                        fontSize="9px"
                        fontWeight="900"
                        lineHeight="1"
                      >
                        施工
                      </Text>
                      <Box
                        w="24px"
                        h="3px"
                        borderRadius="999px"
                        bgColor="#A98E72"
                        opacity={0.62}
                      />
                    </Flex>
                  ) : null}

                  {isVisited && step && !keyNode ? (
                    <RoutePathShape
                      directions={[
                        ...(previousStep
                          ? [
                              connectionDirections(step.cell, previousStep.cell)
                                .from,
                            ]
                          : []),
                        ...(nextStep
                          ? [
                              connectionDirections(step.cell, nextStep.cell)
                                .from,
                            ]
                          : []),
                      ]}
                      width={step.widthAfter}
                    />
                  ) : null}

                  {keyNode ? (
                    <Image
                      position="absolute"
                      zIndex={4}
                      inset="0"
                      src={keyNode.imagePath}
                      alt=""
                      aria-hidden="true"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      transform={`rotate(${keyNode.rotationDeg}deg) scale(1.02)`}
                    />
                  ) : null}

                  {isClue ? (
                    <Flex
                      position="absolute"
                      zIndex={6}
                      top="5px"
                      right="5px"
                      w="25px"
                      h="25px"
                      borderRadius="50%"
                      bgColor={isCollected ? "#D69548" : "rgba(255,249,220,0.94)"}
                      color={isCollected ? "#FFFFFF" : "#9A6B47"}
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 3px 7px rgba(105,75,49,0.2)"
                    >
                      <Text fontSize="13px" lineHeight="1">
                        {isCollected ? "✓" : "🐾"}
                      </Text>
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

                  {isMismatch ? (
                    <Box
                      position="absolute"
                      zIndex={10}
                      inset="1px"
                      borderRadius="5px"
                      border="3px solid #B95043"
                      pointerEvents="none"
                    />
                  ) : null}
                </Flex>
              );
            })}
          </Grid>

          <Box
            position="absolute"
            zIndex={12}
            left={`${((runnerCell.col + 0.5) / BOARD_SIZE) * 100}%`}
            top={`${((runnerCell.row + 0.5) / BOARD_SIZE) * 100}%`}
            w="36px"
            h="36px"
            transform="translate(-50%, -50%)"
            transition="left 145ms ease-out, top 145ms ease-out"
            animation={isRunning ? `${runnerHop} 340ms ease-in-out infinite` : undefined}
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
          aria-label="重新規劃節點路線"
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
          onClick={showHint}
          aria-label="顯示關鍵節點提示"
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
          onClick={runRoute}
        >
          沿路出發
        </Flex>
      </Flex>
    </Flex>
  );
}

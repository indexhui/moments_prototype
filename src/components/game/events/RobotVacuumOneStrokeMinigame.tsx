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
import { FiChevronRight, FiRotateCcw, FiZap } from "react-icons/fi";

type Cell = {
  col: number;
  row: number;
};

type FurnitureDefinition = Cell & {
  width: number;
  height: number;
  kind: "bed" | "sofa" | "cabinet" | "small-cabinet" | "bookcase";
};

type LevelDefinition = {
  id: string;
  name: string;
  roomLabel: string;
  cols: number;
  rows: number;
  start: Cell;
  dock: Cell;
  blocked: Cell[];
  solution: Cell[];
  furniture: FurnitureDefinition;
  extraFurniture?: FurnitureDefinition[];
};

type GamePhase = "intro" | "playing" | "level-clear" | "success";
type NoticeTone = "normal" | "warning" | "secret";

type Notice = {
  text: string;
  tone: NoticeTone;
  nonce: number;
};

const LEVELS: LevelDefinition[] = [
  {
    id: "bedroom",
    name: "沙發外圈",
    roomLabel: "客廳地毯",
    cols: 6,
    rows: 5,
    start: { col: 2, row: 4 },
    dock: { col: 3, row: 4 },
    blocked: [
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
      { col: 1, row: 2 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 1, row: 3 },
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 4, row: 3 },
    ],
    solution: [
      { col: 2, row: 4 },
      { col: 1, row: 4 },
      { col: 0, row: 4 },
      { col: 0, row: 3 },
      { col: 0, row: 2 },
      { col: 0, row: 1 },
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 5, row: 1 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 5, row: 4 },
      { col: 4, row: 4 },
      { col: 3, row: 4 },
    ],
    furniture: {
      kind: "sofa",
      col: 1,
      row: 1,
      width: 4,
      height: 3,
    },
  },
  {
    id: "living-room",
    name: "櫃子外圍",
    roomLabel: "收納區地板",
    cols: 6,
    rows: 7,
    start: { col: 0, row: 6 },
    dock: { col: 5, row: 4 },
    blocked: [
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 2, row: 3 },
      { col: 3, row: 3 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
    ],
    solution: [
      { col: 0, row: 6 },
      { col: 1, row: 6 },
      { col: 2, row: 6 },
      { col: 3, row: 6 },
      { col: 4, row: 6 },
      { col: 5, row: 6 },
      { col: 5, row: 5 },
      { col: 4, row: 5 },
      { col: 3, row: 5 },
      { col: 2, row: 5 },
      { col: 1, row: 5 },
      { col: 0, row: 5 },
      { col: 0, row: 4 },
      { col: 1, row: 4 },
      { col: 1, row: 3 },
      { col: 0, row: 3 },
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 1, row: 1 },
      { col: 0, row: 1 },
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 5, row: 1 },
      { col: 4, row: 1 },
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 4, row: 3 },
      { col: 4, row: 4 },
      { col: 5, row: 4 },
    ],
    furniture: {
      kind: "cabinet",
      col: 2,
      row: 2,
      width: 2,
      height: 3,
    },
  },
  {
    id: "compact-storage",
    name: "雙櫃小徑",
    roomLabel: "小型收納間",
    cols: 5,
    rows: 5,
    start: { col: 0, row: 4 },
    dock: { col: 2, row: 3 },
    blocked: [
      { col: 2, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 3 },
    ],
    solution: [
      { col: 0, row: 4 },
      { col: 1, row: 4 },
      { col: 2, row: 4 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
      { col: 4, row: 3 },
      { col: 4, row: 2 },
      { col: 3, row: 2 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
      { col: 4, row: 0 },
      { col: 3, row: 0 },
      { col: 2, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 1, row: 2 },
      { col: 0, row: 2 },
      { col: 0, row: 3 },
      { col: 1, row: 3 },
      { col: 2, row: 3 },
    ],
    furniture: {
      kind: "cabinet",
      col: 2,
      row: 1,
      width: 1,
      height: 2,
    },
    extraFurniture: [
      {
        kind: "small-cabinet",
        col: 3,
        row: 3,
        width: 1,
        height: 1,
      },
    ],
  },
  {
    id: "reading-corner",
    name: "多櫃窄道",
    roomLabel: "收納角落",
    cols: 6,
    rows: 7,
    start: { col: 5, row: 6 },
    dock: { col: 3, row: 3 },
    blocked: [
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 2 },
      { col: 2, row: 3 },
      { col: 2, row: 4 },
      { col: 4, row: 3 },
    ],
    solution: [
      { col: 5, row: 6 },
      { col: 4, row: 6 },
      { col: 3, row: 6 },
      { col: 3, row: 5 },
      { col: 2, row: 5 },
      { col: 2, row: 6 },
      { col: 1, row: 6 },
      { col: 0, row: 6 },
      { col: 0, row: 5 },
      { col: 1, row: 5 },
      { col: 1, row: 4 },
      { col: 0, row: 4 },
      { col: 0, row: 3 },
      { col: 1, row: 3 },
      { col: 1, row: 2 },
      { col: 0, row: 2 },
      { col: 0, row: 1 },
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
      { col: 5, row: 1 },
      { col: 4, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 3 },
      { col: 5, row: 4 },
      { col: 5, row: 5 },
      { col: 4, row: 5 },
      { col: 4, row: 4 },
      { col: 3, row: 4 },
      { col: 3, row: 3 },
    ],
    furniture: {
      kind: "cabinet",
      col: 2,
      row: 1,
      width: 1,
      height: 4,
    },
    extraFurniture: [
      {
        kind: "small-cabinet",
        col: 1,
        row: 1,
        width: 1,
        height: 1,
      },
      {
        kind: "small-cabinet",
        col: 4,
        row: 3,
        width: 1,
        height: 1,
      },
    ],
  },
];

const dustClean = keyframes`
  0% {
    transform: scale(1);
    border-radius: 0;
    opacity: 1;
  }
  99% {
    transform: scale(0.5);
    border-radius: 50%;
    opacity: 0;
  }
  100% {
    transform: scale(1);
    border-radius: 100%;
    opacity: 0;
  }
`;

const robotBump = keyframes`
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  30% { transform: translate(-50%, -50%) rotate(-9deg) scale(0.96); }
  65% { transform: translate(-50%, -50%) rotate(8deg) scale(0.98); }
`;

const noticePop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 7px) scale(0.94); }
  18% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  78% { opacity: 1; transform: translate(-50%, -2px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -12px) scale(0.98); }
`;

const cardIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const hintPulse = keyframes`
  0%, 100% { box-shadow: inset 0 0 0 3px rgba(255,230,138,0), 0 0 0 rgba(255,218,98,0); }
  50% { box-shadow: inset 0 0 0 3px rgba(255,239,172,0.95), 0 0 18px rgba(255,210,72,0.8); }
`;

const sweepSpin = keyframes`
  to { transform: rotate(360deg); }
`;

const giftPop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.45) rotate(-8deg); }
  24% { opacity: 1; transform: translate(-50%, -7px) scale(1.12) rotate(5deg); }
  68% { opacity: 1; transform: translate(-50%, -12px) scale(1) rotate(0deg); }
  100% { opacity: 0; transform: translate(-50%, -24px) scale(0.92) rotate(0deg); }
`;

function cellKey(cell: Cell) {
  return `${cell.col},${cell.row}`;
}

function isAdjacent(a: Cell, b: Cell) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function RoomFurniture({
  furniture,
  cols,
  rows,
  isYellowPillowFixed = true,
  showGift = false,
  onYellowPillowClick,
}: {
  furniture: FurnitureDefinition;
  cols: number;
  rows: number;
  isYellowPillowFixed?: boolean;
  showGift?: boolean;
  onYellowPillowClick?: () => void;
}) {
  const positionStyle = {
    left: `${(furniture.col / cols) * 100}%`,
    top: `${(furniture.row / rows) * 100}%`,
    width: `${(furniture.width / cols) * 100}%`,
    height: `${(furniture.height / rows) * 100}%`,
  };

  if (furniture.kind === "bed") {
    return (
      <Box position="absolute" zIndex={5} p="5px" pointerEvents="none" style={positionStyle}>
        <Box
          position="relative"
          w="100%"
          h="100%"
          borderRadius="10px"
          bgColor="#B87835"
          boxShadow="0 13px 20px rgba(54,38,32,0.36)"
          overflow="hidden"
        >
          <Box
            position="absolute"
            inset="4px"
            borderRadius="48% 12px 12px 48%"
            bgColor="#D85270"
            transform="rotate(-1.2deg)"
          >
            <Box
              position="absolute"
              top="14%"
              bottom="10%"
              left="36%"
              right="-2%"
              borderRadius="42% 8px 8px 42%"
              bgColor="#F07071"
              boxShadow="inset 15px 0 0 rgba(183,58,92,0.42), inset -18px 0 0 rgba(255,141,132,0.16)"
            />
            <Box
              position="absolute"
              left="18%"
              top="23%"
              w="27%"
              h="56%"
              borderRadius="38% 28% 32% 34%"
              bgColor="#FFD36C"
              boxShadow="inset 9px 0 0 rgba(255,239,153,0.3), 0 5px 9px rgba(102,48,53,0.18)"
              transform="rotate(1.5deg)"
            />
          </Box>
        </Box>
      </Box>
    );
  }

  if (furniture.kind === "sofa") {
    return (
      <Box position="absolute" zIndex={5} p="5px" pointerEvents="none" style={positionStyle}>
        <Flex
          position="relative"
          w="100%"
          h="100%"
          borderRadius="15px 15px 24px 24px"
          bgColor="#C94E5D"
          border="4px solid #A83E4C"
          boxShadow="0 13px 20px rgba(47,41,36,0.34), inset 0 5px 0 rgba(255,255,255,0.14)"
          overflow="hidden"
        >
          <Box
            position="absolute"
            left="6px"
            right="6px"
            top="6px"
            h="24%"
            borderRadius="9px"
            bgColor="#E96C70"
            boxShadow="inset 0 -6px 0 rgba(162,55,73,0.2)"
          />
          <Flex position="absolute" left="7px" right="7px" top="27%" bottom="7px" gap="5px">
            {[0, 1].map((seat) => (
              <Box
                key={seat}
                position="relative"
                flex="1"
                borderRadius="10px 10px 16px 16px"
                bgColor={seat === 0 ? "#ED7072" : "#F07875"}
                boxShadow="inset 0 -8px 0 rgba(174,59,76,0.17)"
              >
                {seat === 0 ? (
                  <Box
                    as={onYellowPillowClick ? "button" : "div"}
                    position="absolute"
                    left="21%"
                    top="12%"
                    w="58%"
                    h="24%"
                    borderRadius="42%"
                    bgColor="#F2C968"
                    border="none"
                    boxShadow={
                      isYellowPillowFixed
                        ? "0 4px 7px rgba(103,50,52,0.17)"
                        : "0 6px 9px rgba(103,50,52,0.27), 0 0 0 2px rgba(255,232,137,0.35)"
                    }
                    transform={
                      isYellowPillowFixed
                        ? "rotate(0deg) translateY(0)"
                        : "rotate(-18deg) translateY(7px)"
                    }
                    transition="transform 420ms cubic-bezier(0.2, 0.9, 0.25, 1.2), box-shadow 300ms ease"
                    transformOrigin="center"
                    cursor={onYellowPillowClick && !isYellowPillowFixed ? "pointer" : "default"}
                    pointerEvents={onYellowPillowClick ? "auto" : "none"}
                    aria-label={onYellowPillowClick ? "擺正黃色枕頭" : undefined}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onYellowPillowClick?.();
                    }}
                  />
                ) : (
                  <Box
                    position="absolute"
                    left="21%"
                    top="12%"
                    w="58%"
                    h="24%"
                    borderRadius="42%"
                    bgColor="#FFF4E7"
                    boxShadow="0 4px 7px rgba(103,50,52,0.17)"
                    transform="rotate(4deg)"
                  />
                )}
              </Box>
            ))}
          </Flex>
          {showGift ? (
            <Flex
              position="absolute"
              left="27%"
              top="45%"
              zIndex={8}
              w="38px"
              h="38px"
              borderRadius="50%"
              bgColor="rgba(255,247,213,0.94)"
              boxShadow="0 8px 15px rgba(89,48,45,0.28)"
              align="center"
              justify="center"
              fontSize="22px"
              animation={`${giftPop} 1700ms ease-out both`}
              pointerEvents="none"
            >
              🎁
            </Flex>
          ) : null}
        </Flex>
      </Box>
    );
  }

  if (furniture.kind === "cabinet") {
    return (
      <Box position="absolute" zIndex={5} p="5px" pointerEvents="none" style={positionStyle}>
        <Flex
          position="relative"
          w="100%"
          h="100%"
          direction="column"
          p="7px"
          gap="5px"
          borderRadius="10px"
          bgColor="#815837"
          border="4px solid #5F402C"
          boxShadow="9px 13px 19px rgba(47,34,27,0.36), inset 0 4px 0 rgba(255,255,255,0.13)"
        >
          {[0, 1].map((door) => (
            <Box
              key={door}
              position="relative"
              flex="1"
              borderRadius="6px"
              bgColor={door === 0 ? "#B98350" : "#AD7646"}
              border="2px solid #6D492F"
              boxShadow="inset 0 0 0 3px rgba(235,190,127,0.12), inset 0 -6px 0 rgba(83,53,35,0.12)"
            >
              <Box
                position="absolute"
                right="9px"
                top="50%"
                w="7px"
                h="16px"
                borderRadius="999px"
                bgColor="#E3BD70"
                border="2px solid #76572E"
                transform="translateY(-50%)"
                boxShadow="0 2px 3px rgba(54,35,23,0.22)"
              />
            </Box>
          ))}
          <Box
            position="absolute"
            left="7px"
            right="7px"
            top="50%"
            h="5px"
            bgColor="#5F402C"
            transform="translateY(-50%)"
          />
        </Flex>
      </Box>
    );
  }

  if (furniture.kind === "small-cabinet") {
    return (
      <Box
        position="absolute"
        zIndex={5}
        p="7px"
        pointerEvents="none"
        style={positionStyle}
        data-furniture-kind="small-cabinet"
      >
        <Box
          position="relative"
          w="100%"
          h="100%"
          borderRadius="8px"
          bgColor="#A36D42"
          border="4px solid #68452E"
          boxShadow="7px 9px 13px rgba(47,34,27,0.34), inset 0 4px 0 rgba(255,255,255,0.13)"
        >
          <Box
            position="absolute"
            inset="6px"
            borderRadius="4px"
            bgColor="#BF8751"
            border="2px solid #765033"
            boxShadow="inset 0 -5px 0 rgba(83,53,35,0.12)"
          />
          <Box
            position="absolute"
            right="12px"
            top="50%"
            w="7px"
            h="7px"
            borderRadius="50%"
            bgColor="#E9C478"
            border="2px solid #76572E"
            transform="translateY(-50%)"
          />
          <Box
            position="absolute"
            left="8px"
            right="8px"
            bottom="-7px"
            h="7px"
            borderRadius="0 0 5px 5px"
            bgColor="#563A2A"
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box position="absolute" zIndex={5} p="4px" pointerEvents="none" style={positionStyle}>
      <Flex
        position="relative"
        w="100%"
        h="100%"
        direction="column"
        borderRadius="7px"
        bgColor="#7B5239"
        border="4px solid #563A2A"
        boxShadow="8px 10px 17px rgba(45,35,31,0.32)"
        overflow="hidden"
      >
        {[0, 1, 2, 3].map((row) => (
          <Flex key={row} flex="1" align="flex-end" gap="2px" px="3px" borderBottom="3px solid #563A2A">
            {[0, 1, 2].map((book) => (
              <Box
                key={book}
                flex="1"
                h={`${54 + ((row * 17 + book * 13) % 34)}%`}
                borderRadius="2px 2px 0 0"
                bgColor={["#D86E62", "#E5B857", "#5E8F86"][(row + book) % 3]}
              />
            ))}
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

function ChargingDock({
  cell,
  cols,
  rows,
}: {
  cell: Cell;
  cols: number;
  rows: number;
}) {
  return (
    <Flex
      position="absolute"
      zIndex={6}
      left={`${((cell.col + 0.5) / cols) * 100}%`}
      top={`${((cell.row + 0.5) / rows) * 100}%`}
      w={`${68 / cols}%`}
      aspectRatio="1"
      transform="translate(-50%, -50%)"
      align="center"
      justify="center"
      pointerEvents="none"
    >
      <Box
        position="absolute"
        bottom="5%"
        w="82%"
        h="46%"
        borderRadius="8px 8px 15px 15px"
        bgColor="#554D49"
        boxShadow="0 5px 8px rgba(38,31,28,0.3)"
      />
      <Box position="absolute" bottom="16%" w="45%" h="5px" borderRadius="999px" bgColor="#85D8B3" />
    </Flex>
  );
}

function RobotVacuum({
  cell,
  cols,
  rows,
  remaining,
  isBumping,
}: {
  cell: Cell;
  cols: number;
  rows: number;
  remaining: number;
  isBumping: boolean;
}) {
  return (
    <Flex
      position="absolute"
      zIndex={12}
      left={`${((cell.col + 0.5) / cols) * 100}%`}
      top={`${((cell.row + 0.5) / rows) * 100}%`}
      w={`${76 / cols}%`}
      aspectRatio="1"
      transform="translate(-50%, -50%)"
      transition="left 105ms ease-out, top 105ms ease-out"
      animation={isBumping ? `${robotBump} 240ms ease` : undefined}
      align="center"
      justify="center"
      pointerEvents="none"
      filter="drop-shadow(0 6px 5px rgba(43,34,31,0.34))"
    >
      <Box
        position="absolute"
        inset="0"
        borderRadius="50%"
        bgColor="#292D31"
        border="4px solid #151719"
        boxShadow="inset 0 0 0 3px #666B70, inset 0 -8px 10px rgba(0,0,0,0.32)"
      />
      <Box
        position="absolute"
        inset="15%"
        borderRadius="50%"
        border="3px solid #E53935"
        boxShadow="0 0 8px rgba(244,58,52,0.36)"
      />
      <Flex position="absolute" inset="24%" align="center" justify="center">
        <Text color="white" fontSize="clamp(11px, 3.6vw, 18px)" fontWeight="900" textShadow="0 2px 2px #000">
          {remaining === 0 ? "✓" : remaining}
        </Text>
      </Flex>
      <Box position="absolute" top="11%" left="44%" w="12%" aspectRatio="1" borderRadius="50%" bgColor="#83E0B7" />
      <Box
        position="absolute"
        right="-13%"
        bottom="-5%"
        w="31%"
        h="5px"
        borderRadius="999px"
        bgColor="#4D4540"
        transformOrigin="left center"
        animation={`${sweepSpin} 900ms linear infinite`}
      />
      <Box
        position="absolute"
        right="-5%"
        bottom="-14%"
        w="5px"
        h="30%"
        borderRadius="999px"
        bgColor="#4D4540"
        transformOrigin="center top"
        animation={`${sweepSpin} 900ms linear infinite reverse`}
      />
    </Flex>
  );
}

export function RobotVacuumOneStrokeMinigame({
  onSkip,
  onSolved,
  onComplete,
}: {
  onSkip: () => void;
  onSolved?: () => void;
  onComplete: () => void;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<Cell[]>([LEVELS[0].start]);
  const draggingRef = useRef(false);
  const lastHoverKeyRef = useRef<string | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const giftTimerRef = useRef<number | null>(null);
  const solvedNotifiedRef = useRef(false);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<Cell[]>([LEVELS[0].start]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hintKeys, setHintKeys] = useState<string[]>([]);
  const [isBumping, setIsBumping] = useState(false);
  const [foundSecret, setFoundSecret] = useState(false);
  const [isYellowPillowFixed, setIsYellowPillowFixed] = useState(false);
  const [hasSmallGift, setHasSmallGift] = useState(false);
  const [isGiftPopping, setIsGiftPopping] = useState(false);

  const level = LEVELS[levelIndex];
  const blockedKeys = useMemo(() => new Set(level.blocked.map(cellKey)), [level]);
  const activeCells = useMemo(() => {
    const cells: Cell[] = [];
    for (let row = 0; row < level.rows; row += 1) {
      for (let col = 0; col < level.cols; col += 1) {
        if (!blockedKeys.has(`${col},${row}`)) cells.push({ col, row });
      }
    }
    return cells;
  }, [blockedKeys, level.cols, level.rows]);
  const activeKeys = useMemo(() => new Set(activeCells.map(cellKey)), [activeCells]);
  const visitedKeys = useMemo(() => new Set(path.map(cellKey)), [path]);
  const currentCell = path[path.length - 1] ?? level.start;
  const remaining = activeCells.length - path.length;
  const progressPct = (path.length / activeCells.length) * 100;

  const clearNoticeTimer = useCallback(() => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  const showNotice = useCallback(
    (text: string, tone: NoticeTone = "normal", durationMs = 1450) => {
      clearNoticeTimer();
      setNotice((previous) => ({
        text,
        tone,
        nonce: (previous?.nonce ?? 0) + 1,
      }));
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice(null);
        noticeTimerRef.current = null;
      }, durationMs);
    },
    [clearNoticeTimer],
  );

  const resetLevel = useCallback(
    (nextLevelIndex = levelIndex, nextPhase: GamePhase = "playing") => {
      const nextLevel = LEVELS[nextLevelIndex];
      const initialPath = [nextLevel.start];
      pathRef.current = initialPath;
      setLevelIndex(nextLevelIndex);
      setPath(initialPath);
      setHintKeys([]);
      setIsBumping(false);
      setPhase(nextPhase);
      lastHoverKeyRef.current = null;
      draggingRef.current = false;
    },
    [levelIndex],
  );

  const handleYellowPillowClick = useCallback(() => {
    if (levelIndex !== 0 || isYellowPillowFixed) return;
    setIsYellowPillowFixed(true);
    setHasSmallGift(true);
    setIsGiftPopping(true);
    showNotice("枕頭擺正了！找到一個小禮物 🎁", "secret", 2200);
    triggerHaptic([20, 35, 55]);

    if (giftTimerRef.current !== null) window.clearTimeout(giftTimerRef.current);
    giftTimerRef.current = window.setTimeout(() => {
      setIsGiftPopping(false);
      giftTimerRef.current = null;
    }, 1750);
  }, [isYellowPillowFixed, levelIndex, showNotice]);

  const bump = useCallback(() => {
    setIsBumping(false);
    window.requestAnimationFrame(() => setIsBumping(true));
    window.setTimeout(() => setIsBumping(false), 260);
    triggerHaptic(35);
  }, []);

  const finishLevel = useCallback(() => {
    triggerHaptic([35, 45, 80]);
    clearTimerRef.current = window.setTimeout(() => {
      setPhase("level-clear");
      clearTimerRef.current = null;
      if (levelIndex === LEVELS.length - 1 && !solvedNotifiedRef.current) {
        solvedNotifiedRef.current = true;
        onSolved?.();
      }
    }, 320);
  }, [levelIndex, onSolved]);

  const visitCell = useCallback(
    (candidate: Cell) => {
      if (phase !== "playing") return;
      const candidateKey = cellKey(candidate);
      if (!activeKeys.has(candidateKey)) return;

      const currentPath = pathRef.current;
      const current = currentPath[currentPath.length - 1];
      if (!current || cellKey(current) === candidateKey) return;

      const previous = currentPath[currentPath.length - 2];
      if (previous && cellKey(previous) === candidateKey) {
        const nextPath = currentPath.slice(0, -1);
        pathRef.current = nextPath;
        setPath(nextPath);
        setHintKeys([]);
        triggerHaptic(8);
        return;
      }

      if (!isAdjacent(current, candidate)) {
        bump();
        showNotice("只能走相鄰的地板格", "warning");
        return;
      }

      if (currentPath.some((cell) => cellKey(cell) === candidateKey)) {
        bump();
        showNotice("這裡已經清過，不能重複經過", "warning");
        return;
      }

      const willComplete = currentPath.length + 1 === activeCells.length;
      if (candidateKey === cellKey(level.dock) && !willComplete) {
        bump();
        showNotice("充電座要留到最後再回去", "warning");
        return;
      }

      const nextPath = [...currentPath, candidate];
      pathRef.current = nextPath;
      setPath(nextPath);
      setHintKeys([]);
      triggerHaptic(7);

      if (levelIndex === 0 && candidateKey === "0,2" && !foundSecret) {
        setFoundSecret(true);
        showNotice("彩蛋：床底找到一隻海豹襪！", "secret", 2100);
      }

      if (willComplete) {
        finishLevel();
        return;
      }

      const nextVisitedKeys = new Set(nextPath.map(cellKey));
      const hasExit = activeCells.some(
        (cell) =>
          !nextVisitedKeys.has(cellKey(cell)) &&
          cellKey(cell) !== cellKey(level.dock) &&
          isAdjacent(candidate, cell),
      );
      const canFinishAtDock =
        nextPath.length + 1 === activeCells.length && isAdjacent(candidate, level.dock);
      if (!hasExit && !canFinishAtDock) {
        showNotice("進入死角了，往回拖一格試試", "warning", 1900);
      }
    },
    [
      activeCells,
      activeKeys,
      bump,
      finishLevel,
      foundSecret,
      level.dock,
      levelIndex,
      phase,
      showNotice,
    ],
  );

  const readCellFromElement = useCallback((element: Element | null) => {
    const cellElement = element?.closest<HTMLElement>("[data-floor-cell]");
    if (!cellElement) return null;
    const col = Number(cellElement.dataset.col);
    const row = Number(cellElement.dataset.row);
    if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
    return { col, row };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "playing") return;
      event.preventDefault();
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const candidate = readCellFromElement(event.target as Element);
      if (candidate) {
        lastHoverKeyRef.current = cellKey(candidate);
        visitCell(candidate);
      }
    },
    [phase, readCellFromElement, visitCell],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || phase !== "playing") return;
      const candidate = readCellFromElement(document.elementFromPoint(event.clientX, event.clientY));
      if (!candidate) return;
      const nextKey = cellKey(candidate);
      if (lastHoverKeyRef.current === nextKey) return;
      lastHoverKeyRef.current = nextKey;
      visitCell(candidate);
    },
    [phase, readCellFromElement, visitCell],
  );

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    lastHoverKeyRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const showHint = useCallback(() => {
    if (phase !== "playing") return;
    const currentPath = pathRef.current;
    const followsHintRoute = currentPath.every(
      (cell, index) => cellKey(cell) === cellKey(level.solution[index]),
    );

    if (!followsHintRoute) {
      showNotice("先退回目前路線，提示才能接上喔", "normal", 1800);
      return;
    }

    const nextKeys = level.solution
      .slice(currentPath.length, currentPath.length + 3)
      .map(cellKey);
    setHintKeys(nextKeys);
    showNotice("發亮的三格是一條安全路線", "normal", 1600);
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => {
      setHintKeys([]);
      hintTimerRef.current = null;
    }, 2200);
  }, [level.solution, phase, showNotice]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "playing") return;
      const delta =
        event.key === "ArrowLeft"
          ? { col: -1, row: 0 }
          : event.key === "ArrowRight"
            ? { col: 1, row: 0 }
            : event.key === "ArrowUp"
              ? { col: 0, row: -1 }
              : event.key === "ArrowDown"
                ? { col: 0, row: 1 }
                : null;
      if (!delta) return;
      event.preventDefault();
      const current = pathRef.current[pathRef.current.length - 1];
      if (!current) return;
      visitCell({ col: current.col + delta.col, row: current.row + delta.row });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, visitCell]);

  useEffect(
    () => () => {
      clearNoticeTimer();
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
      if (clearTimerRef.current !== null) window.clearTimeout(clearTimerRef.current);
      if (giftTimerRef.current !== null) window.clearTimeout(giftTimerRef.current);
    },
    [clearNoticeTimer],
  );

  const handleLevelContinue = () => {
    if (levelIndex < LEVELS.length - 1) {
      resetLevel(levelIndex + 1);
      return;
    }
    setPhase("success");
  };

  const noticeColors =
    notice?.tone === "warning"
      ? { bg: "#7B4336", color: "#FFF0DE" }
      : notice?.tone === "secret"
        ? { bg: "#5D4A79", color: "#FFF1B8" }
        : { bg: "#51473E", color: "#FFF5E6" };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      direction="column"
      bgColor="#C8B39A"
      overflow="hidden"
      userSelect="none"
    >
      <Box
        position="absolute"
        inset="0"
        opacity={0.5}
        backgroundImage="radial-gradient(circle at 18% 12%, rgba(255,243,207,0.72), transparent 31%), linear-gradient(145deg, rgba(255,255,255,0.12), rgba(92,62,47,0.14))"
        pointerEvents="none"
      />

      <Flex
        position="relative"
        zIndex={2}
        px="18px"
        pt="18px"
        pb="12px"
        direction="column"
        gap="9px"
      >
        <Flex align="center" justify="space-between">
          <Box>
            <Text color="#4C3D35" fontSize="12px" fontWeight="800" letterSpacing="0.08em">
              海豹篇・居家清掃
            </Text>
            <Text color="#3A302C" fontSize="22px" fontWeight="900" lineHeight="1.2">
              一筆掃乾淨
            </Text>
          </Box>
          <Flex
            px="11px"
            py="7px"
            borderRadius="999px"
            bgColor="rgba(255,248,231,0.68)"
            border="1px solid rgba(91,65,49,0.14)"
            boxShadow="0 5px 12px rgba(75,51,39,0.1)"
          >
            <Text color="#6A5144" fontSize="12px" fontWeight="900">
              {levelIndex + 1} / {LEVELS.length}
            </Text>
          </Flex>
        </Flex>

        <Flex align="center" justify="space-between" gap="12px">
          <Box>
            <Text color="#6B5143" fontSize="13px" fontWeight="900">
              {level.name}
            </Text>
            <Text color="#866D5D" fontSize="11px" fontWeight="700">
              {level.roomLabel}・剩下 {remaining} 格
            </Text>
          </Box>
          <Box flex="1" maxW="154px" h="8px" borderRadius="999px" bgColor="rgba(90,69,58,0.16)" overflow="hidden">
            <Box
              w={`${progressPct}%`}
              h="100%"
              borderRadius="999px"
              bgColor="#DF8D35"
              boxShadow="0 0 9px rgba(232,151,61,0.5)"
              transition="width 150ms ease"
            />
          </Box>
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={2} flex="1" minH="0" px="16px" align="center" justify="center">
        <Box
          ref={boardRef}
          position="relative"
          w="100%"
          maxW="350px"
          aspectRatio={`${level.cols} / ${level.rows}`}
          borderRadius="15px"
          overflow="hidden"
          border="5px solid #705746"
          boxShadow="0 17px 25px rgba(57,42,34,0.28), inset 0 0 0 2px rgba(255,255,255,0.14)"
          backgroundColor="#CD853F"
          backgroundImage="linear-gradient(45deg, #B27039 25%, transparent 25%, transparent 75%, #B27039 75%), linear-gradient(45deg, #B27039 25%, transparent 25%, transparent 75%, #B27039 75%)"
          backgroundPosition="0 0, 29px 29px"
          backgroundSize="58px 58px"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{ touchAction: "none" }}
          aria-label="掃地機器人一筆畫地板"
        >
          <Box
            position="absolute"
            inset="0"
            display="grid"
            gridTemplateColumns={`repeat(${level.cols}, 1fr)`}
            gridTemplateRows={`repeat(${level.rows}, 1fr)`}
            zIndex={2}
          >
            {Array.from({ length: level.cols * level.rows }, (_, index) => {
              const cell = {
                col: index % level.cols,
                row: Math.floor(index / level.cols),
              };
              const key = cellKey(cell);
              const blocked = blockedKeys.has(key);
              const visited = visitedKeys.has(key);
              const hinted = hintKeys.includes(key);

              return (
                <Box
                  key={key}
                  data-floor-cell={blocked ? undefined : key}
                  data-col={blocked ? undefined : cell.col}
                  data-row={blocked ? undefined : cell.row}
                  data-cleaned={!blocked ? String(visited) : undefined}
                  position="relative"
                  bgColor="transparent"
                  animation={hinted ? `${hintPulse} 850ms ease-in-out infinite` : undefined}
                >
                  {!blocked ? (
                    <Box
                      className={visited ? "dust clean" : "dust"}
                      data-dust-layer={key}
                      position="absolute"
                      inset="0"
                      zIndex={0}
                      bgColor="rgba(125,125,125,0.6)"
                      opacity={visited ? 0 : 1}
                      outline="2px dotted rgba(0,0,0,0.1)"
                      transform={visited ? undefined : "scale(1)"}
                      transformOrigin="center"
                      animation={visited ? `${dustClean} 500ms linear forwards` : undefined}
                      pointerEvents="none"
                    />
                  ) : null}
                  {!blocked && !visited ? (
                    <>
                      <Box
                        position="absolute"
                        zIndex={1}
                        left={`${18 + ((cell.col * 19 + cell.row * 11) % 45)}%`}
                        top={`${17 + ((cell.col * 7 + cell.row * 23) % 48)}%`}
                        w="3px"
                        h="3px"
                        borderRadius="50%"
                        bgColor="rgba(74,57,51,0.4)"
                      />
                      <Box
                        position="absolute"
                        zIndex={1}
                        right={`${16 + ((cell.col * 13 + cell.row * 5) % 34)}%`}
                        bottom={`${18 + ((cell.col * 17 + cell.row * 9) % 38)}%`}
                        w="2px"
                        h="2px"
                        borderRadius="50%"
                        bgColor="rgba(74,57,51,0.34)"
                      />
                    </>
                  ) : null}
                </Box>
              );
            })}
          </Box>

          <RoomFurniture
            furniture={level.furniture}
            cols={level.cols}
            rows={level.rows}
            isYellowPillowFixed={levelIndex === 0 ? isYellowPillowFixed : true}
            showGift={levelIndex === 0 && isGiftPopping}
            onYellowPillowClick={levelIndex === 0 ? handleYellowPillowClick : undefined}
          />
          {level.extraFurniture?.map((furniture, index) => (
            <RoomFurniture
              key={`${level.id}-extra-furniture-${index}`}
              furniture={furniture}
              cols={level.cols}
              rows={level.rows}
            />
          ))}
          <ChargingDock cell={level.dock} cols={level.cols} rows={level.rows} />
          <RobotVacuum
            cell={currentCell}
            cols={level.cols}
            rows={level.rows}
            remaining={remaining}
            isBumping={isBumping}
          />
        </Box>
      </Flex>

      <Flex
        position="relative"
        zIndex={3}
        px="18px"
        pt="12px"
        pb="18px"
        align="center"
        justify="space-between"
        gap="10px"
      >
        <Box>
          <Text color="#4D3C33" fontSize="12px" fontWeight="900">
            每次移動一格，讓地板全部變亮
          </Text>
          <Text color="#806858" fontSize="11px" fontWeight="700">
            點擊或拖向相鄰格・回拖一格可以反悔
          </Text>
        </Box>
        <Flex gap="8px">
          <Flex
            as="button"
            w="38px"
            h="38px"
            borderRadius="50%"
            bgColor="rgba(255,248,231,0.74)"
            color="#694E3E"
            align="center"
            justify="center"
            border="1px solid rgba(91,65,49,0.14)"
            boxShadow="0 5px 12px rgba(75,51,39,0.1)"
            cursor="pointer"
            onClick={() => resetLevel()}
            aria-label="重新開始本關"
          >
            <FiRotateCcw size={18} />
          </Flex>
          <Flex
            as="button"
            w="38px"
            h="38px"
            borderRadius="50%"
            bgColor="#665044"
            color="#FFF4DA"
            align="center"
            justify="center"
            boxShadow="0 5px 12px rgba(75,51,39,0.2)"
            cursor="pointer"
            onClick={showHint}
            aria-label="顯示提示"
          >
            <FiZap size={18} />
          </Flex>
        </Flex>
      </Flex>

      {foundSecret ? (
        <Flex
          position="absolute"
          left="16px"
          bottom="78px"
          zIndex={10}
          px="9px"
          py="5px"
          borderRadius="999px"
          bgColor="rgba(91,70,118,0.88)"
          boxShadow="0 5px 12px rgba(61,44,73,0.2)"
          align="center"
          gap="5px"
          pointerEvents="none"
        >
          <Text fontSize="13px">🦭</Text>
          <Text color="#FFF1C5" fontSize="10px" fontWeight="900">
            海豹襪已找到
          </Text>
        </Flex>
      ) : null}

      {hasSmallGift ? (
        <Flex
          position="absolute"
          left="16px"
          bottom={foundSecret ? "110px" : "78px"}
          zIndex={11}
          px="9px"
          py="5px"
          borderRadius="999px"
          bgColor="rgba(146,91,38,0.92)"
          boxShadow="0 5px 12px rgba(84,51,24,0.22)"
          align="center"
          gap="5px"
          pointerEvents="none"
        >
          <Text fontSize="13px">🎁</Text>
          <Text color="#FFF4C7" fontSize="10px" fontWeight="900">
            小禮物 ×1
          </Text>
        </Flex>
      ) : null}

      {notice ? (
        <Flex
          key={notice.nonce}
          position="absolute"
          zIndex={30}
          left="50%"
          bottom="92px"
          maxW="310px"
          px="14px"
          py="9px"
          borderRadius="999px"
          bgColor={noticeColors.bg}
          boxShadow="0 8px 18px rgba(48,34,29,0.24)"
          animation={`${noticePop} 1450ms ease both`}
          pointerEvents="none"
        >
          <Text color={noticeColors.color} fontSize="12px" fontWeight="900" textAlign="center">
            {notice.text}
          </Text>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={40}
          bgColor="rgba(58,44,37,0.5)"
          backdropFilter="blur(3px)"
          align="center"
          justify="center"
          px="25px"
        >
          <Flex
            w="100%"
            maxW="326px"
            direction="column"
            borderRadius="22px"
            bgColor="#FFF7E7"
            boxShadow="0 22px 42px rgba(45,32,27,0.34)"
            overflow="hidden"
            animation={`${cardIn} 300ms ease-out both`}
          >
            <Flex h="156px" position="relative" bgColor="#CD853F" align="center" justify="center" overflow="hidden">
              <Box
                position="absolute"
                inset="0"
                backgroundImage="linear-gradient(45deg, #B27039 25%, transparent 25%, transparent 75%, #B27039 75%), linear-gradient(45deg, #B27039 25%, transparent 25%, transparent 75%, #B27039 75%)"
                backgroundPosition="0 0, 29px 29px"
                backgroundSize="58px 58px"
              />
              <Flex
                position="relative"
                w="92px"
                h="92px"
                borderRadius="50%"
                bgColor="#2A2E32"
                border="6px solid #17191B"
                boxShadow="inset 0 0 0 5px #686D72, 0 13px 18px rgba(65,39,27,0.3)"
                align="center"
                justify="center"
              >
                <Box position="absolute" inset="17%" borderRadius="50%" border="4px solid #E33B36" />
                <Text color="white" fontSize="28px" fontWeight="900">
                  3
                </Text>
                <Box position="absolute" top="10px" w="10px" h="10px" borderRadius="50%" bgColor="#86DDB8" />
              </Flex>
            </Flex>
            <Flex direction="column" p="20px" gap="12px">
              <Box>
                <Text color="#3E312B" fontSize="22px" fontWeight="900">
                  一筆掃乾淨！
                </Text>
                <Text color="#765E50" fontSize="13px" lineHeight="1.75" mt="5px">
                  從機器人所在的位置出發，一次走亮所有灰暗地板，最後回到充電座。走過的格子不能再經過。
                </Text>
              </Box>
              <Flex gap="7px" wrap="wrap">
                {["上下左右", "不能重複", "終點充電"].map((label) => (
                  <Flex key={label} px="9px" py="5px" borderRadius="999px" bgColor="#F0E3CD">
                    <Text color="#725A49" fontSize="10px" fontWeight="900">
                      {label}
                    </Text>
                  </Flex>
                ))}
              </Flex>
              <Flex
                as="button"
                h="46px"
                borderRadius="14px"
                bgColor="#D87F32"
                boxShadow="0 8px 15px rgba(160,86,34,0.25)"
                color="white"
                align="center"
                justify="center"
                gap="8px"
                cursor="pointer"
                onClick={() => resetLevel(0)}
              >
                <Text fontSize="14px" fontWeight="900">
                  開始清掃
                </Text>
                <FiChevronRight size={18} />
              </Flex>
              <Text
                as="button"
                color="#9A8171"
                fontSize="11px"
                fontWeight="800"
                textAlign="center"
                cursor="pointer"
                onClick={onSkip}
              >
                略過小遊戲
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "level-clear" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={45}
          bgColor="rgba(72,51,39,0.44)"
          backdropFilter="blur(2px)"
          align="center"
          justify="center"
          px="28px"
        >
          <Flex
            w="100%"
            maxW="310px"
            direction="column"
            align="center"
            p="24px"
            gap="12px"
            borderRadius="22px"
            bgColor="#FFF7E7"
            boxShadow="0 22px 42px rgba(45,32,27,0.34)"
            animation={`${cardIn} 280ms ease-out both`}
          >
            <Flex w="68px" h="68px" borderRadius="50%" bgColor="#E8A24D" align="center" justify="center" boxShadow="0 9px 16px rgba(162,92,35,0.2)">
              <Text color="white" fontSize="31px" fontWeight="900">
                ✓
              </Text>
            </Flex>
            <Box textAlign="center">
              <Text color="#3F312B" fontSize="20px" fontWeight="900">
                {level.name}完成
              </Text>
              <Text color="#806858" fontSize="12px" fontWeight="700" mt="4px">
                沒有重複路線，整片地板都亮起來了
              </Text>
            </Box>
            <Flex
              as="button"
              w="100%"
              h="44px"
              mt="4px"
              borderRadius="13px"
              bgColor="#D87F32"
              color="white"
              align="center"
              justify="center"
              gap="7px"
              cursor="pointer"
              onClick={handleLevelContinue}
            >
              <Text fontSize="13px" fontWeight="900">
                {levelIndex < LEVELS.length - 1 ? "下一個房間" : "查看結果"}
              </Text>
              <FiChevronRight size={17} />
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "success" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={50}
          direction="column"
          align="center"
          justify="center"
          px="28px"
          bgColor="#655043"
          backgroundImage="radial-gradient(circle at 50% 30%, rgba(244,178,89,0.38), transparent 38%), linear-gradient(160deg, #806354, #443831)"
        >
          <Flex
            w="116px"
            h="116px"
            position="relative"
            borderRadius="50%"
            bgColor="#2A2E32"
            border="7px solid #17191B"
            boxShadow="inset 0 0 0 6px #686D72, 0 18px 25px rgba(29,21,18,0.34)"
            align="center"
            justify="center"
            animation={`${cardIn} 320ms ease-out both`}
          >
            <Box position="absolute" inset="18%" borderRadius="50%" border="5px solid #E33B36" />
            <Text color="#92E5BF" fontSize="39px" fontWeight="900">
              ✓
            </Text>
          </Flex>
          <Text color="#FFF4DE" fontSize="26px" fontWeight="900" mt="24px">
            全屋清掃完成
          </Text>
          <Text color="rgba(255,244,222,0.76)" fontSize="13px" fontWeight="700" textAlign="center" lineHeight="1.75" mt="8px" maxW="285px">
            {hasSmallGift
              ? "三個房間都用一筆路線掃乾淨了，歪掉的枕頭也已擺正，還找到了一個小禮物。"
              : "三個房間都用一筆路線掃乾淨了。機器人回到充電座，床底還多找回了一隻海豹襪。"}
          </Text>
          <Flex
            as="button"
            w="100%"
            maxW="286px"
            h="48px"
            mt="26px"
            borderRadius="14px"
            bgColor="#E6963F"
            color="white"
            boxShadow="0 10px 20px rgba(39,27,23,0.26)"
            align="center"
            justify="center"
            cursor="pointer"
            onClick={onComplete}
          >
            <Text fontSize="14px" fontWeight="900">
              完成清掃
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

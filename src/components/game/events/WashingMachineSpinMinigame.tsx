"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const TOTAL_GIF_FRAMES = 149;
const FULL_TURN = Math.PI * 2;
const GIF_LOOP_MS = 4470;
const FRAME_SHEET_COLUMNS = 5;
const FRAME_SHEET_ROWS = 3;
const FRAMES_PER_SHEET = 15;
const FRAME_SHEET_COUNT = Math.ceil(TOTAL_GIF_FRAMES / FRAMES_PER_SHEET);
const DISPLAY_FRAME_WIDTH = 390;
const DISPLAY_FRAME_HEIGHT = 418;
const FRAME_SHEET_ROOT =
  "/images/mini_game/washing_machine/spin-frames";

type GamePhase = "playing" | "success";

type CircleGesture = {
  pointerId: number;
  lastX: number;
  lastY: number;
  lastMoveAngle: number | null;
  direction: -1 | 0 | 1;
  curveAmount: number;
  pathLength: number;
};

const hintBreathe = keyframes`
  0%, 100% {
    opacity: 0.58;
    transform: translateY(1px) rotate(-2deg);
  }
  50% {
    opacity: 0.96;
    transform: translateY(-2px) rotate(1deg);
  }
`;

const hintDraw = keyframes`
  0% {
    stroke-dashoffset: 190;
  }
  42%, 100% {
    stroke-dashoffset: 0;
  }
`;

const storyAppear = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

function normalizeAngleDelta(delta: number) {
  if (delta > Math.PI) return delta - FULL_TURN;
  if (delta < -Math.PI) return delta + FULL_TURN;
  return delta;
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function HandDrawnTurnHint() {
  return (
    <Box
      position="relative"
      mt="5px"
      w="142px"
      h="66px"
      color="#84958D"
      animation={`${hintBreathe} 1.8s ease-in-out infinite`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 142 66"
        width="142"
        height="66"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M31 45C19 35 23 20 39 12C56 3 86 5 103 16C119 27 118 42 103 51C87 61 58 60 39 49"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="190"
          style={{ animation: `${hintDraw} 2.2s ease-out infinite` }}
        />
        <path
          d="M33 47C20 38 22 23 37 14"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.38"
        />
        <path
          d="M39 49L28 51M39 49L35 59"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g>
          <circle cx="107" cy="48" r="4.2" fill="#C97A58" opacity="0.22" />
          <circle cx="107" cy="48" r="2.3" fill="#C97A58" />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 70 33"
            to="360 70 33"
            dur="1.65s"
            repeatCount="indefinite"
          />
        </g>
        <path
          d="M117 12L120 8M123 16L128 14M113 8L113 4"
          stroke="#C97A58"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </Box>
  );
}

export function WashingMachineSpinMinigame({
  onSkip,
  onComplete,
}: {
  onSkip: () => void;
  onComplete: () => void;
}) {
  const gestureRef = useRef<CircleGesture | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const movementIdleTimerRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("playing");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const frameSheetIndex = Math.floor(frameIndex / FRAMES_PER_SHEET);
  const localFrameIndex = frameIndex % FRAMES_PER_SHEET;
  const frameColumn = localFrameIndex % FRAME_SHEET_COLUMNS;
  const frameRow = Math.floor(localFrameIndex / FRAME_SHEET_COLUMNS);
  const frameSheetPath = `${FRAME_SHEET_ROOT}/sheet-${String(
    frameSheetIndex,
  ).padStart(2, "0")}.webp`;

  useEffect(() => {
    const preloadedSheets = Array.from(
      { length: FRAME_SHEET_COUNT },
      (_, index) => {
        const image = new window.Image();
        image.src = `${FRAME_SHEET_ROOT}/sheet-${String(index).padStart(
          2,
          "0",
        )}.webp`;
        return image;
      },
    );
    return () => {
      preloadedSheets.forEach((image) => {
        image.src = "";
      });
    };
  }, []);

  useEffect(
    () => () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
      if (movementIdleTimerRef.current !== null) {
        window.clearTimeout(movementIdleTimerRef.current);
      }
    },
    [],
  );

  const finishLaundry = useCallback(() => {
    gestureRef.current = null;
    setIsDrawing(false);
    setIsSpinning(false);
    setFrameIndex(TOTAL_GIF_FRAMES - 1);
    triggerHaptic([16, 28, 48]);
    completionTimerRef.current = window.setTimeout(() => {
      setPhase("success");
      completionTimerRef.current = null;
    }, 520);
  }, []);

  useEffect(() => {
    if (!isSpinning || phase !== "playing") return;

    let frameId = 0;
    let lastTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const delta = Math.min(48, Math.max(0, timestamp - lastTimestamp));
      lastTimestamp = timestamp;
      elapsedMsRef.current = Math.min(
        GIF_LOOP_MS,
        elapsedMsRef.current + delta,
      );

      const nextProgress = elapsedMsRef.current / GIF_LOOP_MS;
      setPlaybackProgress(nextProgress);
      setFrameIndex(
        Math.min(
          TOTAL_GIF_FRAMES - 1,
          Math.floor(nextProgress * TOTAL_GIF_FRAMES),
        ),
      );

      if (nextProgress >= 1) {
        finishLaundry();
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [finishLaundry, isSpinning, phase]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "playing") return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      gestureRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        lastMoveAngle: null,
        direction: 0,
        curveAmount: 0,
        pathLength: 0,
      };
      setIsDrawing(true);
      setIsSpinning(false);
      triggerHaptic(7);
    },
    [phase],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      event.preventDefault();

      const moveX = event.clientX - gesture.lastX;
      const moveY = event.clientY - gesture.lastY;
      const distance = Math.hypot(moveX, moveY);
      if (distance < 2) return;

      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      gesture.pathLength += distance;

      const moveAngle = Math.atan2(moveY, moveX);
      if (gesture.lastMoveAngle !== null) {
        const delta = normalizeAngleDelta(
          moveAngle - gesture.lastMoveAngle,
        );
        const absoluteDelta = Math.abs(delta);

        if (absoluteDelta >= 0.015 && absoluteDelta <= 1.35) {
          const direction = delta > 0 ? 1 : -1;
          if (gesture.direction === 0 || gesture.direction === direction) {
            gesture.direction = direction;
            gesture.curveAmount += absoluteDelta;
          } else {
            gesture.direction = direction;
            gesture.curveAmount *= 0.45;
          }
        }
      }
      gesture.lastMoveAngle = moveAngle;

      if (gesture.curveAmount >= 0.42 && gesture.pathLength >= 30) {
        if (!hasStarted) {
          setHasStarted(true);
          triggerHaptic(14);
        }
        setIsSpinning(true);

        if (movementIdleTimerRef.current !== null) {
          window.clearTimeout(movementIdleTimerRef.current);
        }
        movementIdleTimerRef.current = window.setTimeout(() => {
          setIsSpinning(false);
          movementIdleTimerRef.current = null;
        }, 150);
      }
    },
    [hasStarted],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      gestureRef.current = null;
      setIsDrawing(false);
      setIsSpinning(false);
      if (movementIdleTimerRef.current !== null) {
        window.clearTimeout(movementIdleTimerRef.current);
        movementIdleTimerRef.current = null;
      }
    },
    [],
  );

  const storyText =
    phase === "success"
      ? "洗好了。"
      : playbackProgress >= 0.62
        ? "衣服和泡泡，在滾筒裡繞成一圈又一圈。"
        : playbackProgress >= 0.2
          ? "洗衣機慢慢轉了起來。"
          : hasStarted
            ? "轉動之後，洗衣機自己跑了起來。"
            : "把衣服放進洗衣機。";

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      direction="column"
      bgColor="#FFFDF8"
      backgroundImage="radial-gradient(circle at 50% 72%, rgba(230,215,177,0.3), transparent 34%)"
      overflow="hidden"
      userSelect="none"
      touchAction="none"
      data-washing-machine-story
      data-engine="dom-circle-trigger-story"
      data-playback-progress={Math.round(playbackProgress * 100)}
      data-frame-index={frameIndex}
      data-is-drawing={isDrawing ? "true" : "false"}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label="在洗衣機畫面上畫圈"
        position="absolute"
        inset="0"
        cursor={isDrawing ? "grabbing" : "pointer"}
        touchAction="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <Box
          position="absolute"
          left="50%"
          top="45%"
          w={`${DISPLAY_FRAME_WIDTH}px`}
          h={`${DISPLAY_FRAME_HEIGHT}px`}
          ml={`-${DISPLAY_FRAME_WIDTH / 2}px`}
          mt={`-${DISPLAY_FRAME_HEIGHT / 2}px`}
          role="img"
          aria-label="狐狸和正在轉動的洗衣機"
          backgroundImage={`url("${frameSheetPath}")`}
          backgroundRepeat="no-repeat"
          backgroundSize={`${
            FRAME_SHEET_COLUMNS * DISPLAY_FRAME_WIDTH
          }px ${FRAME_SHEET_ROWS * DISPLAY_FRAME_HEIGHT}px`}
          backgroundPosition={`-${
            frameColumn * DISPLAY_FRAME_WIDTH
          }px -${frameRow * DISPLAY_FRAME_HEIGHT}px`}
          pointerEvents="none"
        />
      </Box>

      <Flex
        position="absolute"
        left="22px"
        right="22px"
        bottom={phase === "success" ? "80px" : "54px"}
        zIndex={8}
        direction="column"
        align="center"
        pointerEvents="none"
      >
        <Text
          key={storyText}
          maxW="330px"
          color="#4E6157"
          fontSize={phase === "success" ? "21px" : "15px"}
          fontWeight="900"
          lineHeight="1.7"
          textAlign="center"
          textShadow="0 2px 12px rgba(255,255,255,0.95)"
          animation={`${storyAppear} 260ms ease-out both`}
        >
          {storyText}
        </Text>

        {phase === "playing" ? (
          <HandDrawnTurnHint />
        ) : null}
      </Flex>

      {phase === "playing" ? (
        <Flex
          as="button"
          position="absolute"
          top="16px"
          right="15px"
          zIndex={12}
          px="8px"
          py="5px"
          color="rgba(78,97,87,0.42)"
          cursor="pointer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onSkip}
        >
          <Text fontSize="10px" fontWeight="800">
            略過
          </Text>
        </Flex>
      ) : null}

      {phase === "success" ? (
        <Flex
          as="button"
          position="absolute"
          left="50%"
          bottom="24px"
          zIndex={12}
          transform="translateX(-50%)"
          px="18px"
          py="9px"
          color="#C87548"
          cursor="pointer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onComplete}
        >
          <Text fontSize="22px" fontWeight="900" lineHeight="1">
            →
          </Text>
        </Flex>
      ) : null}
    </Flex>
  );
}

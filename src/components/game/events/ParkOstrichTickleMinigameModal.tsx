"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiCamera } from "react-icons/fi";

const PARK_BACKGROUND_IMAGE = "/images/背景/公園.png";
const OSTRICH_HIDDEN_IMAGE = "/images/ostrich/ostrich_hidden.png";
const OSTRICH_NORMAL_IMAGE = "/images/ostrich/ostrich_normal.png";
const OSTRICH_HI_IMAGE = "/images/ostrich/ostrich_hi.png";
const TICKLE_REQUIRED_MS = 2000;
const MIN_TICKLE_SPEED_PX_PER_SECOND = 220;
const MAX_TICKLE_SPEED_PX_PER_SECOND = 1050;
const SPEED_METER_MAX_PX_PER_SECOND = 1300;
const TICKLE_ZONE_RADIUS_PX = 150;
const COMPLETE_DELAY_MS = 3400;
const TICKLE_SECONDS_LABEL = (TICKLE_REQUIRED_MS / 1000).toFixed(1);

type GamePhase = "intro" | "tickle" | "photo" | "result";
type FeedbackTone = "good" | "warn" | "idle";
type TickleTempo = "idle" | "outside" | "too-slow" | "steady" | "too-fast" | "needs-updown";
type StagePoint = { x: number; y: number };
type PointerState = StagePoint & {
  isActive: boolean;
  pointerType: string;
};
type GestureSnapshot = {
  speed: number;
  verticality: number;
  lastMoveMs: number;
};
type FeedbackState = {
  text: string;
  tone: FeedbackTone;
  nonce: number;
};

const ostrichWiggle = keyframes`
  0%, 100% { transform: rotate(-1.5deg) translateY(0); }
  25% { transform: rotate(2deg) translateY(-3px); }
  50% { transform: rotate(-2deg) translateY(1px); }
  75% { transform: rotate(1.5deg) translateY(-2px); }
`;

const ostrichPeek = keyframes`
  0% { transform: translateY(18px) scaleY(0.94); opacity: 0.78; }
  100% { transform: translateY(0) scaleY(1); opacity: 1; }
`;

const sparkleRise = keyframes`
  0% { transform: translateY(12px) scale(0.72); opacity: 0; }
  24% { opacity: 1; }
  100% { transform: translateY(-18px) scale(1.08); opacity: 0; }
`;

const feedbackPop = keyframes`
  0% { transform: translate(-50%, 8px); opacity: 0; }
  24% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -10px); opacity: 0; }
`;

const shutterFlash = keyframes`
  0% { opacity: 0; }
  14% { opacity: 0.92; }
  100% { opacity: 0; }
`;

const successCoverTop = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(0); }
`;

const successCoverBottom = keyframes`
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

function getDistance(a: StagePoint, b: StagePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getTicklePoint(rect: DOMRect): StagePoint {
  return {
    x: rect.width * 0.52,
    y: rect.height * 0.62,
  };
}

function getTempoCaption(tempo: TickleTempo, phase: GamePhase) {
  if (phase === "photo") return "抬頭了，可以拍照";
  if (phase === "result") return "拍照完成";

  switch (tempo) {
    case "steady":
      return "節奏剛好";
    case "too-fast":
      return "太快了，放慢一點";
    case "too-slow":
      return "太慢了，再明確一點";
    case "needs-updown":
      return "要上下來回搔癢";
    case "outside":
      return "靠近鴕鳥再搔癢";
    case "idle":
    default:
      return "在鴕鳥身上上下移動";
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getSpeedStateLabel(tempo: TickleTempo) {
  if (tempo === "too-fast") return "太快";
  if (tempo === "steady") return "剛好";
  if (tempo === "too-slow") return "太慢";
  return "等待搔癢";
}

export function ParkOstrichTickleMinigameModal({
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
  const previousFrameTimeRef = useRef<number | null>(null);
  const tickleMsRef = useRef(0);
  const pointerRef = useRef<PointerState | null>(null);
  const lastPointerSampleRef = useRef<(StagePoint & { at: number }) | null>(null);
  const gestureRef = useRef<GestureSnapshot>({
    speed: 0,
    verticality: 0,
    lastMoveMs: 0,
  });
  const lastDirectionRef = useRef<-1 | 0 | 1>(0);
  const lastDirectionChangeMsRef = useRef(0);
  const solvedNotifiedRef = useRef(false);
  const completeTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [tickleMs, setTickleMs] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [tempo, setTempo] = useState<TickleTempo>("idle");
  const [isTickling, setIsTickling] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [photoTakenNonce, setPhotoTakenNonce] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({
    text: "低頭的鴕鳥拍不到，先讓牠抬頭",
    tone: "idle",
    nonce: 0,
  });

  const tickleProgressPct = Math.min(100, (tickleMs / TICKLE_REQUIRED_MS) * 100);
  const tickleSecondsLabel = (Math.min(tickleMs, TICKLE_REQUIRED_MS) / 1000).toFixed(1);
  const speedPointerPct = clampPercent((currentSpeed / SPEED_METER_MAX_PX_PER_SECOND) * 100);
  const validSpeedStartPct = clampPercent(
    (MIN_TICKLE_SPEED_PX_PER_SECOND / SPEED_METER_MAX_PX_PER_SECOND) * 100,
  );
  const validSpeedWidthPct = clampPercent(
    ((MAX_TICKLE_SPEED_PX_PER_SECOND - MIN_TICKLE_SPEED_PX_PER_SECOND) /
      SPEED_METER_MAX_PX_PER_SECOND) *
      100,
  );
  const canTakePhoto = phase === "photo";
  const shownOstrichImage =
    phase === "result" ? OSTRICH_HI_IMAGE : phase === "photo" ? OSTRICH_NORMAL_IMAGE : OSTRICH_HIDDEN_IMAGE;
  const stageCaption = getTempoCaption(tempo, phase);
  const speedStateLabel = getSpeedStateLabel(tempo);

  const clearAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    previousFrameTimeRef.current = null;
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current !== null) window.clearTimeout(completeTimerRef.current);
    completeTimerRef.current = null;
  }, []);

  const setFeedbackMessage = useCallback((text: string, tone: FeedbackTone) => {
    setFeedback({ text, tone, nonce: Date.now() });
  }, []);

  const resetGesture = useCallback(() => {
    tickleMsRef.current = 0;
    pointerRef.current = null;
    lastPointerSampleRef.current = null;
    gestureRef.current = {
      speed: 0,
      verticality: 0,
      lastMoveMs: 0,
    };
    lastDirectionRef.current = 0;
    lastDirectionChangeMsRef.current = 0;
    setTickleMs(0);
    setCurrentSpeed(0);
    setTempo("idle");
    setIsTickling(false);
  }, []);

  const startTickle = useCallback(() => {
    clearAnimation();
    clearCompleteTimer();
    solvedNotifiedRef.current = false;
    resetGesture();
    setIsHintOpen(false);
    setPhotoTakenNonce(0);
    setFeedbackMessage(`上下搔癢 ${TICKLE_SECONDS_LABEL} 秒，速度要剛剛好`, "idle");
    setPhase("tickle");
  }, [clearAnimation, clearCompleteTimer, resetGesture, setFeedbackMessage]);

  const takePhoto = useCallback(() => {
    if (phase === "intro") {
      startTickle();
      return;
    }
    if (phase === "tickle") {
      setFeedbackMessage("鴕鳥還低著頭，先搔癢到牠抬頭", "warn");
      return;
    }
    if (phase === "result") {
      startTickle();
      return;
    }

    setPhotoTakenNonce(Date.now());
    setFeedbackMessage("拍到了！抬頭瞬間剛剛好", "good");
    window.setTimeout(() => {
      setPhase("result");
    }, 280);
  }, [phase, setFeedbackMessage, startTickle]);

  const rememberPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, forceActive = false) => {
      const stageElement = stageRef.current;
      if (!stageElement) return;
      const rect = stageElement.getBoundingClientRect();
      const now = performance.now();
      const nextPointer: PointerState = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        isActive: forceActive || event.pointerType === "mouse" || event.buttons > 0,
        pointerType: event.pointerType,
      };
      const previousSample = lastPointerSampleRef.current;

      if (previousSample) {
        const elapsedSeconds = Math.max(0.001, (now - previousSample.at) / 1000);
        const dx = nextPointer.x - previousSample.x;
        const dy = nextPointer.y - previousSample.y;
        const absDy = Math.abs(dy);
        const absDx = Math.abs(dx);
        const speed = absDy / elapsedSeconds;
        const verticality = absDy / Math.max(1, absDx + absDy);
        const direction: -1 | 0 | 1 = absDy < 2 ? 0 : dy > 0 ? 1 : -1;

        if (
          direction !== 0 &&
          lastDirectionRef.current !== 0 &&
          direction !== lastDirectionRef.current &&
          speed >= MIN_TICKLE_SPEED_PX_PER_SECOND * 0.45
        ) {
          lastDirectionChangeMsRef.current = now;
        }
        if (direction !== 0) {
          lastDirectionRef.current = direction;
        }

        gestureRef.current = {
          speed,
          verticality,
          lastMoveMs: now,
        };
      } else {
        gestureRef.current = {
          speed: 0,
          verticality: 0,
          lastMoveMs: now,
        };
      }

      pointerRef.current = nextPointer;
      lastPointerSampleRef.current = {
        x: nextPointer.x,
        y: nextPointer.y,
        at: now,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      rememberPointer(event, true);
    },
    [rememberPointer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      rememberPointer(event);
    },
    [rememberPointer],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (pointerRef.current && event.pointerType !== "mouse") {
      pointerRef.current = {
        ...pointerRef.current,
        isActive: false,
      };
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
    lastPointerSampleRef.current = null;
    gestureRef.current = {
      speed: 0,
      verticality: 0,
      lastMoveMs: 0,
    };
    setIsTickling(false);
    setTempo("idle");
    setCurrentSpeed(0);
  }, []);

  useEffect(() => {
    if (phase !== "tickle") {
      clearAnimation();
      return;
    }

    const tick = (timestamp: number) => {
      const previousTimestamp = previousFrameTimeRef.current ?? timestamp;
      const deltaMs = Math.min(64, timestamp - previousTimestamp);
      previousFrameTimeRef.current = timestamp;

      const stageElement = stageRef.current;
      const pointer = pointerRef.current;
      const gesture = gestureRef.current;
      let nextTempo: TickleTempo = "idle";
      let nextSpeed = 0;

      if (stageElement && pointer?.isActive) {
        const rect = stageElement.getBoundingClientRect();
        const ticklePoint = getTicklePoint(rect);
        const zoneRadius = Math.min(TICKLE_ZONE_RADIUS_PX, rect.width * 0.42);
        const isInsideZone = getDistance(pointer, ticklePoint) <= zoneRadius;
        const hasRecentMove = timestamp - gesture.lastMoveMs <= 170;
        nextSpeed = hasRecentMove ? gesture.speed : 0;
        const hasRecentDirectionChange =
          lastDirectionChangeMsRef.current > 0 && timestamp - lastDirectionChangeMsRef.current <= 720;

        if (!isInsideZone) {
          nextTempo = "outside";
        } else if (!hasRecentMove || gesture.speed < MIN_TICKLE_SPEED_PX_PER_SECOND) {
          nextTempo = "too-slow";
        } else if (gesture.speed > MAX_TICKLE_SPEED_PX_PER_SECOND) {
          nextTempo = "too-fast";
        } else if (gesture.verticality < 0.56 || !hasRecentDirectionChange) {
          nextTempo = "needs-updown";
        } else {
          nextTempo = "steady";
        }
      }

      const isSteady = nextTempo === "steady";
      tickleMsRef.current = isSteady
        ? Math.min(TICKLE_REQUIRED_MS, tickleMsRef.current + deltaMs)
        : Math.max(0, tickleMsRef.current - deltaMs * 0.45);
      setTempo(nextTempo);
      setIsTickling(isSteady);
      setTickleMs(tickleMsRef.current);
      setCurrentSpeed(nextSpeed);

      if (tickleMsRef.current >= TICKLE_REQUIRED_MS) {
        setPhase("photo");
        setTempo("steady");
        setIsTickling(false);
        setTickleMs(TICKLE_REQUIRED_MS);
        setFeedbackMessage("鴕鳥抬頭了，現在可以拍照", "good");
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return clearAnimation;
  }, [clearAnimation, phase, setFeedbackMessage]);

  useEffect(() => {
    if (phase !== "result") return;
    clearAnimation();
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    completeTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, COMPLETE_DELAY_MS);
    return clearCompleteTimer;
  }, [clearAnimation, clearCompleteTimer, onComplete, onSolved, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        takePhoto();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        startTickle();
        return;
      }
      if (event.key.toLowerCase() === "h" || event.key === "?") {
        event.preventDefault();
        setIsHintOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip, startTickle, takePhoto]);

  useEffect(
    () => () => {
      clearAnimation();
      clearCompleteTimer();
    },
    [clearAnimation, clearCompleteTimer],
  );

  const feedbackColor =
    feedback.tone === "good" ? "#E9FFD4" : feedback.tone === "warn" ? "#FFE0BE" : "#FFF8EA";
  const progressColor = tempo === "steady" || phase === "photo" || phase === "result" ? "#DFF6A8" : "#DDAA6D";
  const speedStatusColor =
    tempo === "steady"
      ? "#DFF6A8"
      : tempo === "too-fast" || tempo === "too-slow"
        ? "#FFE0BE"
        : "rgba(255,248,234,0.82)";

  return (
    <Flex position="absolute" inset="0" zIndex={72} bgColor="#263725" overflow="hidden">
      <Flex
        ref={stageRef}
        flex="1"
        minW="0"
        position="relative"
        overflow="hidden"
        bgColor="#9ED5BD"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: "none" }}
      >
        <img
          src={PARK_BACKGROUND_IMAGE}
          alt="公園背景"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Box
          position="absolute"
          inset="0"
          bgImage="linear-gradient(180deg, rgba(87,125,83,0.06) 0%, rgba(38,55,37,0.04) 48%, rgba(38,55,37,0.42) 100%)"
        />

        <Flex position="absolute" left="12px" right="12px" top="12px" direction="column" gap="8px" zIndex={6} pointerEvents="none">
          <Flex
            direction="column"
            gap="8px"
            px="12px"
            py="10px"
            borderRadius="10px"
            bgColor="rgba(39,53,31,0.78)"
            border="1px solid rgba(255,255,255,0.18)"
            boxShadow="0 10px 24px rgba(25,38,22,0.2)"
          >
            <Flex align="center" justify="space-between" gap="8px">
              <Text color="#FFF8EA" fontSize="17px" fontWeight="900" textShadow="0 2px 8px rgba(35,45,28,0.35)">
                公園鴕鳥搔癢
              </Text>
              <Flex
                px="9px"
                py="4px"
                borderRadius="999px"
                bgColor={canTakePhoto ? "rgba(223,246,168,0.22)" : "rgba(255,248,234,0.14)"}
                border="1px solid rgba(255,255,255,0.14)"
              >
                <Text color={canTakePhoto ? "#DFF6A8" : "rgba(255,248,234,0.78)"} fontSize="11px" fontWeight="900">
                  拍照 {canTakePhoto ? "已解鎖" : "未解鎖"}
                </Text>
              </Flex>
            </Flex>
            <Flex gap="7px" align="center" justify="space-between">
              <Text color={tempo === "steady" ? "#E9FFD4" : "rgba(255,248,234,0.86)"} fontSize="12px" fontWeight="900">
                {stageCaption}
              </Text>
              <Text color="rgba(255,248,234,0.84)" fontSize="12px" fontWeight="900">
                {tickleSecondsLabel}/{TICKLE_SECONDS_LABEL} 秒
              </Text>
            </Flex>
            <Box h="8px" borderRadius="999px" bgColor="rgba(255,248,234,0.22)" overflow="hidden">
              <Box
                w={`${tickleProgressPct}%`}
                h="100%"
                bgColor={progressColor}
                transition="width 70ms linear, background-color 120ms ease"
              />
            </Box>
          </Flex>

          {phase === "tickle" ? (
            <Flex
              direction="column"
              gap="8px"
              px="12px"
              py="10px"
              borderRadius="10px"
              bgColor="rgba(39,53,31,0.72)"
              border="1px solid rgba(255,255,255,0.16)"
              boxShadow="0 10px 24px rgba(25,38,22,0.18)"
            >
              <Flex align="baseline" justify="space-between" gap="10px">
                <Text color="#FFF8EA" fontSize="12px" fontWeight="900">
                  搔癢速率
                </Text>
                <Text color={speedStatusColor} fontSize="12px" fontWeight="900">
                  {speedStateLabel}
                </Text>
              </Flex>
              <Box position="relative" h="30px">
                <Box
                  position="absolute"
                  left="0"
                  right="0"
                  top="8px"
                  h="10px"
                  borderRadius="999px"
                  bgColor="rgba(255,224,190,0.34)"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    left={`${validSpeedStartPct}%`}
                    top="0"
                    h="100%"
                    w={`${validSpeedWidthPct}%`}
                    bgColor="rgba(223,246,168,0.78)"
                  />
                </Box>
                <Box
                  position="absolute"
                  left={`${speedPointerPct}%`}
                  top="2px"
                  w="3px"
                  h="22px"
                  borderRadius="999px"
                  bgColor="#FFF8EA"
                  boxShadow="0 0 0 2px rgba(39,53,31,0.55), 0 0 10px rgba(255,255,220,0.72)"
                  transform="translateX(-50%)"
                  transition="left 70ms linear"
                />
                <Flex position="absolute" left="0" right="0" bottom="0" justify="space-between">
                  <Text color="rgba(255,248,234,0.78)" fontSize="10px" fontWeight="900">
                    太慢
                  </Text>
                  <Text color="#E9FFD4" fontSize="10px" fontWeight="900">
                    剛好
                  </Text>
                  <Text color="rgba(255,248,234,0.78)" fontSize="10px" fontWeight="900">
                    太快
                  </Text>
                </Flex>
              </Box>
            </Flex>
          ) : null}
        </Flex>

        <Box
          position="absolute"
          left="52%"
          bottom={phase === "photo" || phase === "result" ? "82px" : "72px"}
          w={phase === "photo" || phase === "result" ? "min(48%, 208px)" : "min(58%, 238px)"}
          transform="translateX(-50%)"
          transition="width 220ms ease, bottom 220ms ease"
          zIndex={3}
          pointerEvents="none"
        >
          <img
            src={shownOstrichImage}
            alt={phase === "tickle" ? "低下頭的鴕鳥" : "抬頭的鴕鳥"}
            draggable={false}
            style={{
              width: "100%",
              height: "auto",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 16px 18px rgba(45, 43, 32, 0.24))",
              animation:
                phase === "photo" || phase === "result"
                  ? `${ostrichPeek} 260ms ease both`
                  : isTickling
                    ? `${ostrichWiggle} 260ms ease-in-out infinite`
                    : undefined,
              transformOrigin: "50% 88%",
            }}
          />
        </Box>

        {isTickling ? (
          <Flex position="absolute" left="53%" top="58%" zIndex={4} pointerEvents="none">
            {[0, 1, 2, 3].map((item) => (
              <Box
                key={item}
                position="absolute"
                left={`${item * 13 - 20}px`}
                top={`${item % 2 === 0 ? -4 : 10}px`}
                w="8px"
                h="8px"
                borderRadius="999px"
                bgColor={item % 2 === 0 ? "#E9FFD4" : "#FFE9A8"}
                boxShadow="0 0 12px rgba(255,255,220,0.72)"
                animation={`${sparkleRise} 520ms ease ${item * 70}ms infinite`}
              />
            ))}
          </Flex>
        ) : null}

        {phase === "photo" ? (
          <Flex
            position="absolute"
            left="52%"
            bottom="80px"
            w="218px"
            h="318px"
            transform="translateX(-50%)"
            border="4px solid rgba(255,248,234,0.94)"
            borderRadius="18px"
            boxShadow="0 0 0 999px rgba(24, 42, 25, 0.16)"
            zIndex={4}
            pointerEvents="none"
          >
            <Box position="absolute" left="12px" top="12px" w="24px" h="24px" borderLeft="4px solid #DFF6A8" borderTop="4px solid #DFF6A8" borderTopLeftRadius="8px" />
            <Box position="absolute" right="12px" top="12px" w="24px" h="24px" borderRight="4px solid #DFF6A8" borderTop="4px solid #DFF6A8" borderTopRightRadius="8px" />
            <Box position="absolute" left="12px" bottom="12px" w="24px" h="24px" borderLeft="4px solid #DFF6A8" borderBottom="4px solid #DFF6A8" borderBottomLeftRadius="8px" />
            <Box position="absolute" right="12px" bottom="12px" w="24px" h="24px" borderRight="4px solid #DFF6A8" borderBottom="4px solid #DFF6A8" borderBottomRightRadius="8px" />
          </Flex>
        ) : null}

        <Flex
          key={`feedback-${feedback.nonce}`}
          position="absolute"
          left="50%"
          bottom="14%"
          transform="translateX(-50%)"
          zIndex={6}
          px="12px"
          py="7px"
          borderRadius="999px"
          bgColor="rgba(39,53,31,0.78)"
          border="1px solid rgba(255,255,255,0.18)"
          color={feedbackColor}
          fontSize="12px"
          fontWeight="900"
          pointerEvents="none"
          animation={`${feedbackPop} 1150ms ease both`}
          whiteSpace="nowrap"
        >
          {feedback.text}
        </Flex>

        <Flex position="absolute" left="14px" right="14px" bottom="14px" zIndex={6} align="center" justify="space-between" gap="8px">
          <Flex px="10px" py="7px" borderRadius="999px" bgColor="rgba(39,53,31,0.74)" border="1px solid rgba(255,255,255,0.16)">
            <Text color="#FFF8EA" fontSize="11px" fontWeight="900">
              QTE：搔癢 {TICKLE_SECONDS_LABEL} 秒
            </Text>
          </Flex>
          <Flex px="10px" py="7px" borderRadius="999px" bgColor="rgba(39,53,31,0.74)" border="1px solid rgba(255,255,255,0.16)">
            <Text color={canTakePhoto ? "#E9FFD4" : "rgba(255,248,234,0.72)"} fontSize="11px" fontWeight="900">
              拍照 {canTakePhoto ? "已解鎖" : "未解鎖"}
            </Text>
          </Flex>
        </Flex>

        {phase === "photo" ? (
          <Flex
            as="button"
            position="absolute"
            left="50%"
            bottom="56px"
            transform="translateX(-50%)"
            zIndex={8}
            h="52px"
            minW="118px"
            px="20px"
            borderRadius="999px"
            bgColor="#FFF8EA"
            border="3px solid #DFF6A8"
            align="center"
            justify="center"
            gap="8px"
            color="#526438"
            cursor="pointer"
            boxShadow="0 12px 28px rgba(37, 51, 30, 0.28)"
            onClick={takePhoto}
            _active={{ transform: "translateX(-50%) scale(0.96)" }}
          >
            <FiCamera size={19} />
            <Text color="#526438" fontSize="15px" fontWeight="900" lineHeight="1">
              拍照
            </Text>
          </Flex>
        ) : null}

        {photoTakenNonce > 0 ? (
          <Box
            key={`photo-flash-${photoTakenNonce}`}
            position="absolute"
            inset="0"
            bgColor="#FFFFFF"
            zIndex={50}
            pointerEvents="none"
            animation={`${shutterFlash} 420ms ease-out both`}
          />
        ) : null}
      </Flex>

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={40} bgColor="rgba(31,42,28,0.38)" align="center" justify="center" p="24px">
          <Flex
            w="100%"
            maxW="318px"
            borderRadius="10px"
            bgColor="#F8F1DF"
            boxShadow="0 14px 28px rgba(34,43,26,0.24)"
            direction="column"
            overflow="hidden"
          >
            <Flex h="176px" position="relative" bgColor="#92CBAE" align="center" justify="center" overflow="hidden">
              <img
                src={PARK_BACKGROUND_IMAGE}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.72 }}
              />
              <img
                src={OSTRICH_HIDDEN_IMAGE}
                alt="低頭的鴕鳥"
                draggable={false}
                style={{ position: "relative", width: "118px", height: "184px", objectFit: "contain", display: "block", marginTop: "26px" }}
              />
            </Flex>
            <Flex px="18px" pt="18px" pb="10px" direction="column" gap="9px">
              <Text color="#526438" fontSize="18px" fontWeight="900">
                公園鴕鳥搔癢
              </Text>
              <Text color="#6C6A4B" fontSize="14px" lineHeight="1.7">
                hidden 狀態的鴕鳥低著頭，現在無法拍照。用滑鼠或手指在鴕鳥身上上下搔癢，讓指針停在「剛好」區間，連續累積 {TICKLE_SECONDS_LABEL} 秒後才會抬頭。
              </Text>
            </Flex>
            <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
              <Flex
                as="button"
                onClick={startTickle}
                minW="96px"
                h="38px"
                px="14px"
                borderRadius="999px"
                bgColor="#667A42"
                align="center"
                justify="center"
                color="white"
                fontSize="13px"
                fontWeight="900"
                cursor="pointer"
              >
                開始 QTE
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isHintOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(31,42,28,0.42)" align="center" justify="center" p="24px">
          <Flex
            w="100%"
            maxW="300px"
            minH="260px"
            borderRadius="10px"
            bgColor="#F8F1DF"
            boxShadow="0 14px 28px rgba(34,43,26,0.22)"
            direction="column"
            overflow="hidden"
          >
            <Flex px="18px" pt="18px" pb="10px" direction="column" gap="10px" flex="1">
              <Text color="#526438" fontSize="18px" fontWeight="900">
                QTE 提示
              </Text>
              <Text color="#6C6A4B" fontSize="14px" lineHeight="1.8">
                判定點在鴕鳥身上。畫面上的搔癢速率量表分成「太慢、剛好、太快」，指針停在剛好區間時才會穩定累積進度。
              </Text>
              <Text color="#6C6A4B" fontSize="13px" lineHeight="1.7">
                離太遠或只往單一方向滑動時也不算。鴕鳥抬頭後會進入拍照階段；按 Space 或點下方快門都可以拍照。
              </Text>
            </Flex>
            <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
              <Flex
                as="button"
                onClick={() => setIsHintOpen(false)}
                minW="76px"
                h="36px"
                px="12px"
                borderRadius="999px"
                bgColor="#667A42"
                align="center"
                justify="center"
                color="white"
                fontSize="12px"
                fontWeight="800"
                cursor="pointer"
              >
                關閉
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "result" ? (
        <Flex position="absolute" inset="0" zIndex={60} pointerEvents="none">
          <Box position="absolute" top="0" left="0" right="0" h="50%" bgColor="#6F8248" animation={`${successCoverTop} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
          <Box position="absolute" bottom="0" left="0" right="0" h="50%" bgColor="#526438" animation={`${successCoverBottom} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
          <Flex position="absolute" inset="0" align="center" justify="center">
            <Flex direction="column" align="center" gap="8px" animation={`${successFadeUp} 260ms ease 520ms both`}>
              <img
                src={OSTRICH_HI_IMAGE}
                alt="抬頭的鴕鳥"
                draggable={false}
                style={{ width: "96px", height: "150px", objectFit: "contain", display: "block" }}
              />
              <Text color="white" fontSize="20px" fontWeight="900">
                拍照完成
              </Text>
              <Text color="rgba(255,255,255,0.84)" fontSize="13px" fontWeight="700" textAlign="center" maxW="260px">
                你抓住剛剛好的搔癢節奏，等牠抬頭後拍下了公園裡的鴕鳥。
              </Text>
              <Text color="#FFF5D6" fontSize="20px" fontWeight="900">
                QTE 搔癢 {TICKLE_SECONDS_LABEL} 秒
              </Text>
              <Text color="rgba(255,255,255,0.92)" fontSize="14px" fontWeight="900">
                小遊戲獎勵
              </Text>
              <Text color="#FFF5D6" fontSize="18px" fontWeight="900">
                小日幣 x10
              </Text>
              {successSavingsTotal !== null && successSavingsTotal !== undefined ? (
                <Text color="rgba(255,255,255,0.82)" fontSize="12px" fontWeight="700">
                  目前共有 {successSavingsTotal} 小日幣
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

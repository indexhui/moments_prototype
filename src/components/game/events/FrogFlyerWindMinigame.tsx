"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiCheck } from "react-icons/fi";
import { MdTouchApp } from "react-icons/md";

type WindZoneId = "right" | "top" | "left" | "bottom";
type FlyerPhase = "flying" | "caught" | "missed" | "complete";

type WindStep = {
  id: string;
  arrow: string;
  zoneId: WindZoneId;
  durationMs: number;
  hitWindow: number;
  targetProgress: number;
  track: WindTrack;
};

type TrackPoint = {
  xPct: number;
  yPct: number;
};

type WindTrack = {
  start: TrackPoint;
  end: TrackPoint;
  rotate: number;
  thicknessPct: number;
};

type FlyerPosition = TrackPoint & {
  rotate: number;
};

type FlyerBeatConfig = {
  zoneId: WindZoneId;
  durationMs: number;
  hitWindow?: number;
  targetProgress: number;
  track: WindTrack;
};

type FlyerFeedback = {
  id: string;
  kind: "caught" | "missed";
  text: string;
  xPct: number;
  yPct: number;
};

type LaneTheme = {
  fill: string;
  edge: string;
  glow: string;
  label: string;
  clipPath: string;
};

const DEFAULT_HIT_WINDOW = 0.11;
const FLYER_IMAGE_SRC = "/images/mini_game/flyers.png";
const FLYER_DASH_IMAGE_SRC = "/images/mini_game/flyers_dash.svg";
const STREET_SCENE_SRC = "/images/背景/公司附近街道_白天.jpg";
const MASCOT_BANNER_SRC = "/images/mini_game/flyer_ui/mascot_banner.png";
const LIFE_HUD_SRC = "/images/mini_game/flyer_ui/life_hud.png";
const HEART_SRC = "/images/mini_game/flyer_ui/heart.png";
const FLYER_WIDTH_PX = 64;
const FLYER_HEIGHT_PX = 58;
const DISPLAY_HEART_COUNT = 3;

const RHYTHM_FLYER_BEATS: readonly FlyerBeatConfig[] = [
  {
    zoneId: "right",
    durationMs: 1120,
    targetProgress: 0.64,
    track: {
      start: { xPct: 12, yPct: 43 },
      end: { xPct: 88, yPct: 43 },
      rotate: 8,
      thicknessPct: 28,
    },
  },
  {
    zoneId: "top",
    durationMs: 1040,
    targetProgress: 0.58,
    track: {
      start: { xPct: 68, yPct: 88 },
      end: { xPct: 68, yPct: 12 },
      rotate: -5,
      thicknessPct: 28,
    },
  },
  {
    zoneId: "left",
    durationMs: 960,
    targetProgress: 0.62,
    track: {
      start: { xPct: 88, yPct: 60 },
      end: { xPct: 12, yPct: 60 },
      rotate: -8,
      thicknessPct: 28,
    },
  },
  {
    zoneId: "bottom",
    durationMs: 900,
    targetProgress: 0.54,
    track: {
      start: { xPct: 38, yPct: 12 },
      end: { xPct: 38, yPct: 88 },
      rotate: 7,
      thicknessPct: 28,
    },
  },
  {
    zoneId: "right",
    durationMs: 840,
    targetProgress: 0.7,
    track: {
      start: { xPct: 12, yPct: 31 },
      end: { xPct: 88, yPct: 31 },
      rotate: 6,
      thicknessPct: 26,
    },
  },
  {
    zoneId: "left",
    durationMs: 780,
    hitWindow: 0.12,
    targetProgress: 0.48,
    track: {
      start: { xPct: 88, yPct: 73 },
      end: { xPct: 12, yPct: 73 },
      rotate: -7,
      thicknessPct: 26,
    },
  },
] as const;

const WIND_ARROW_BY_ZONE: Record<WindZoneId, string> = {
  right: "→",
  top: "↑",
  left: "←",
  bottom: "↓",
};

const WIND_STEPS: readonly WindStep[] = RHYTHM_FLYER_BEATS.map((beat, index) => ({
  id: `flyer-beat-${index + 1}-${beat.zoneId}`,
  arrow: WIND_ARROW_BY_ZONE[beat.zoneId],
  zoneId: beat.zoneId,
  durationMs: beat.durationMs,
  hitWindow: beat.hitWindow ?? DEFAULT_HIT_WINDOW,
  targetProgress: beat.targetProgress,
  track: beat.track,
}));

const LANE_THEME_BY_ZONE: Record<WindZoneId, LaneTheme> = {
  right: {
    fill: "rgba(255, 192, 55, 0.32)",
    edge: "#FFD35A",
    glow: "rgba(255, 203, 55, 0.52)",
    label: "RIGHT",
    clipPath: "polygon(0 7%, 100% 0, 100% 91%, 0 100%)",
  },
  top: {
    fill: "rgba(89, 184, 226, 0.3)",
    edge: "#8DE2F4",
    glow: "rgba(74, 186, 226, 0.5)",
    label: "UP",
    clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
  },
  left: {
    fill: "rgba(111, 196, 114, 0.3)",
    edge: "#A9E76D",
    glow: "rgba(116, 205, 93, 0.5)",
    label: "LEFT",
    clipPath: "polygon(0 0, 100% 8%, 100% 100%, 0 92%)",
  },
  bottom: {
    fill: "rgba(244, 126, 91, 0.3)",
    edge: "#FFAD75",
    glow: "rgba(244, 126, 91, 0.5)",
    label: "DOWN",
    clipPath: "polygon(0 0, 92% 0, 100% 100%, 8% 100%)",
  },
};

const FLYER_INTER_STEP_BLANK_MS = 200;
const FLYER_FEEDBACK_DURATION_MS = 420;
const MIN_CAUGHT_FLYERS_TO_PASS = 5;

const flyerFlutter = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  30% { transform: translateY(-5px) rotate(3deg); }
  62% { transform: translateY(2px) rotate(-4deg); }
`;

const windSweepHorizontal = keyframes`
  0% { transform: translateX(-150%) skewX(-14deg); opacity: 0; }
  24% { opacity: 0.8; }
  100% { transform: translateX(150%) skewX(-14deg); opacity: 0; }
`;

const windSweepVertical = keyframes`
  0% { transform: translateY(150%) skewY(-14deg); opacity: 0; }
  24% { opacity: 0.8; }
  100% { transform: translateY(-150%) skewY(-14deg); opacity: 0; }
`;

const laneAppear = keyframes`
  0% { opacity: 0; filter: saturate(0.7) brightness(1.2); }
  100% { opacity: 1; filter: saturate(1) brightness(1); }
`;

const targetPulse = keyframes`
  0%, 100% { transform: translate(-50%, -50%) scale(0.95); }
  50% { transform: translate(-50%, -50%) scale(1.08); }
`;

const bannerSparkle = keyframes`
  0%, 100% { opacity: 0.42; transform: scale(0.82) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.16) rotate(12deg); }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(14px) scale(0.94); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const feedbackPop = keyframes`
  0% { opacity: 0; transform: translate(-50%, -45%) scale(0.82); }
  24% { opacity: 1; transform: translate(-50%, -72%) scale(1.12); }
  72% { opacity: 1; transform: translate(-50%, -76%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -92%) scale(0.96); }
`;

const heartHit = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  32% { transform: scale(1.2) rotate(-7deg); }
  62% { transform: scale(0.82) rotate(6deg); }
`;

const tutorialWindReveal = keyframes`
  0% { opacity: 0; transform: translateY(-50%) rotate(-11deg) scaleX(0.28); }
  100% { opacity: 1; transform: translateY(-50%) rotate(-11deg) scaleX(1); }
`;

const tutorialTargetReveal = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(0.92); }
`;

const tutorialFlyerArrival = keyframes`
  0%, 8% { left: 8%; top: 60%; opacity: 0; transform: translate(-50%, -50%) rotate(-13deg) scale(0.92); }
  16% { left: 8%; top: 60%; opacity: 1; transform: translate(-50%, -50%) rotate(-10deg) scale(1); }
  88%, 100% { left: 68%; top: 46%; opacity: 1; transform: translate(-50%, -50%) rotate(3deg) scale(1); }
`;

const tutorialFlyerPass = keyframes`
  0% { left: 8%; top: 60%; opacity: 0; transform: translate(-50%, -50%) rotate(-13deg) scale(0.92); }
  5% { left: 8%; top: 60%; opacity: 1; transform: translate(-50%, -50%) rotate(-10deg) scale(1); }
  60% { left: 68%; top: 46%; opacity: 1; transform: translate(-50%, -50%) rotate(3deg) scale(1); }
  82% { left: 68%; top: 46%; opacity: 1; transform: translate(-50%, -50%) rotate(3deg) scale(1); }
  88% { left: 68%; top: 46%; opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(0.76); filter: drop-shadow(0 0 15px #FFE052); }
  94%, 100% { left: 68%; top: 46%; opacity: 0; transform: translate(-50%, -50%) rotate(0deg) scale(0.58); filter: drop-shadow(0 0 20px #FFE052); }
`;

const tutorialTargetCue = keyframes`
  0%, 35%, 82%, 100% { transform: translate(-50%, -50%) scale(0.92); border-color: rgba(255,239,148,0.72); box-shadow: 0 0 0 0 rgba(255,211,67,0.2); }
  48%, 67% { transform: translate(-50%, -50%) scale(1.08); border-color: #FFD943; box-shadow: 0 0 0 12px rgba(255,211,67,0.22), 0 0 28px rgba(255,211,67,0.72); }
`;

const tutorialTapCue = keyframes`
  0%, 58%, 96%, 100% { opacity: 0; transform: translate(-15%, 18%) scale(1.22); }
  64% { opacity: 1; transform: translate(-15%, 8%) scale(1.08); }
  70%, 82% { opacity: 1; transform: translate(-15%, 0) scale(0.82); }
  90% { opacity: 1; transform: translate(-15%, 5%) scale(1); }
`;

const tutorialTapRipple = keyframes`
  0%, 65%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.32); }
  70% { opacity: 0.92; transform: translate(-50%, -50%) scale(0.42); }
  84% { opacity: 0; transform: translate(-50%, -50%) scale(1.34); }
`;

const tutorialCaughtCue = keyframes`
  0%, 82%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.45) rotate(-12deg); }
  88%, 96% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
`;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function isHorizontalTrack(track: WindTrack) {
  return Math.abs(track.end.xPct - track.start.xPct) >= Math.abs(track.end.yPct - track.start.yPct);
}

function getLaneRect(track: WindTrack) {
  const isHorizontal = isHorizontalTrack(track);
  if (isHorizontal) {
    return {
      leftPct: 0,
      topPct: Math.max(0, track.start.yPct - track.thicknessPct / 2),
      widthPct: 100,
      heightPct: track.thicknessPct,
    };
  }
  return {
    leftPct: Math.max(0, track.start.xPct - track.thicknessPct / 2),
    topPct: 0,
    widthPct: track.thicknessPct,
    heightPct: 100,
  };
}

function getFlyerPosition(track: WindTrack, progress: number): FlyerPosition {
  const safeProgress = clampProgress(progress);
  const isHorizontal = isHorizontalTrack(track);
  const flutterWeight = Math.sin(Math.PI * safeProgress * 4.6) * (1 - safeProgress * 0.32);
  return {
    xPct: track.start.xPct + (track.end.xPct - track.start.xPct) * safeProgress + (isHorizontal ? 0 : flutterWeight * 1.2),
    yPct: track.start.yPct + (track.end.yPct - track.start.yPct) * safeProgress + (isHorizontal ? flutterWeight * 1.2 : 0),
    rotate: track.rotate + flutterWeight * 2.4,
  };
}

function ForecastChip({
  step,
  index,
  isCurrent,
  isCaught,
}: {
  step: WindStep;
  index: number;
  isCurrent: boolean;
  isCaught: boolean;
}) {
  const theme = LANE_THEME_BY_ZONE[step.zoneId];
  return (
    <Flex
      w="34px"
      h="38px"
      direction="column"
      align="center"
      justify="center"
      borderRadius="9px"
      border={isCurrent ? `3px solid ${theme.edge}` : "2px solid rgba(31,25,20,0.78)"}
      bgColor={isCaught ? "#FFF2A8" : isCurrent ? "rgba(255,255,255,0.94)" : "rgba(255,248,226,0.9)"}
      boxShadow={isCurrent ? `0 0 0 3px white, 0 0 15px ${theme.glow}` : "0 3px 0 rgba(20,16,13,0.62)"}
      transform={isCurrent ? "translateY(-2px)" : "none"}
      transition="transform 160ms ease, background 160ms ease"
      flexShrink={0}
    >
      <Text color="#8D5730" fontSize="8px" fontWeight="900" lineHeight="1">
        {index + 1}
      </Text>
      <Text color="#2E3E47" fontSize="18px" fontWeight="900" lineHeight="1">
        {isCaught ? <FiCheck /> : step.arrow}
      </Text>
    </Flex>
  );
}

function PathColorBand({ step, isCatchWindowOpen }: { step: WindStep; isCatchWindowOpen: boolean }) {
  const laneRect = getLaneRect(step.track);
  const isHorizontal = isHorizontalTrack(step.track);
  const theme = LANE_THEME_BY_ZONE[step.zoneId];
  const targetPosition = getFlyerPosition(step.track, step.targetProgress);
  const innerInset = 5;

  return (
    <>
      <Box
        key={step.id}
        position="absolute"
        left={`${laneRect.leftPct}%`}
        top={`${laneRect.topPct}%`}
        w={`${laneRect.widthPct}%`}
        h={`${laneRect.heightPct}%`}
        zIndex={1}
        bgColor="#11100F"
        clipPath={theme.clipPath}
        filter="drop-shadow(0 7px 0 rgba(0,0,0,0.78))"
        animation={`${laneAppear} 180ms ease both`}
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left={isHorizontal ? `${laneRect.leftPct}%` : `calc(${laneRect.leftPct}% + ${innerInset}px)`}
        top={isHorizontal ? `calc(${laneRect.topPct}% + ${innerInset}px)` : `${laneRect.topPct}%`}
        w={isHorizontal ? `${laneRect.widthPct}%` : `calc(${laneRect.widthPct}% - ${innerInset * 2}px)`}
        h={isHorizontal ? `calc(${laneRect.heightPct}% - ${innerInset * 2}px)` : `${laneRect.heightPct}%`}
        zIndex={2}
        overflow="hidden"
        bgColor={theme.fill}
        border={`2px solid ${theme.edge}`}
        clipPath={theme.clipPath}
        backdropFilter="saturate(1.15) brightness(1.06)"
        boxShadow={isCatchWindowOpen ? `inset 0 0 28px ${theme.glow}` : "inset 0 0 18px rgba(255,255,255,0.14)"}
        animation={`${laneAppear} 180ms ease both`}
        pointerEvents="none"
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            position="absolute"
            left={isHorizontal ? "-42%" : `${24 + index * 22}%`}
            top={isHorizontal ? `${20 + index * 26}%` : "110%"}
            w={isHorizontal ? "52%" : "8px"}
            h={isHorizontal ? "8px" : "42%"}
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.72)"
            filter="blur(3px)"
            animation={`${isHorizontal ? windSweepHorizontal : windSweepVertical} ${950 + index * 120}ms ease-in-out infinite`}
            animationDelay={`${index * 140}ms`}
          />
        ))}
        <Text
          position="absolute"
          right={isHorizontal ? "4%" : undefined}
          left={isHorizontal ? undefined : "50%"}
          top={isHorizontal ? "50%" : "4%"}
          transform={isHorizontal ? "translateY(-50%)" : "translateX(-50%)"}
          color="rgba(255,255,255,0.86)"
          fontSize="10px"
          fontWeight="900"
          letterSpacing="0.12em"
          textShadow="0 2px 0 rgba(39,30,22,0.42)"
        >
          {theme.label}
        </Text>
      </Box>

      <Flex
        position="absolute"
        left={`${targetPosition.xPct}%`}
        top={`${targetPosition.yPct}%`}
        w="96px"
        h="96px"
        zIndex={4}
        align="center"
        justify="center"
        borderRadius="999px"
        border={isCatchWindowOpen ? "6px solid #FFD943" : "4px solid rgba(255,236,132,0.88)"}
        bgColor={isCatchWindowOpen ? "rgba(255,216,56,0.26)" : "rgba(255,248,204,0.15)"}
        boxShadow={isCatchWindowOpen ? "0 0 0 7px rgba(255,255,255,0.82), 0 0 26px rgba(255,203,40,0.94)" : "0 0 0 4px rgba(255,255,255,0.62)"}
        transform="translate(-50%, -50%)"
        animation={isCatchWindowOpen ? `${targetPulse} 500ms ease-in-out infinite` : undefined}
        pointerEvents="none"
      >
        <Image src={FLYER_DASH_IMAGE_SRC} alt="" w="52px" h="48px" objectFit="contain" opacity={0.94} />
      </Flex>
    </>
  );
}

function FlyerPaper({ isCaught }: { isCaught: boolean }) {
  return (
    <Flex
      w={`${FLYER_WIDTH_PX}px`}
      h={`${FLYER_HEIGHT_PX}px`}
      align="center"
      justify="center"
      animation={isCaught ? undefined : `${flyerFlutter} 720ms ease-in-out infinite`}
      transform={isCaught ? "scale(0.88)" : "scale(1)"}
      filter={isCaught ? "drop-shadow(0 0 15px rgba(255,226,77,0.96))" : "drop-shadow(0 10px 10px rgba(43,31,20,0.34))"}
      transition="filter 180ms ease, transform 160ms ease"
    >
      <Image src={FLYER_IMAGE_SRC} alt="" w="100%" h="100%" objectFit="contain" draggable={false} />
    </Flex>
  );
}

function FlyerTrail({ track, progress }: { track: WindTrack; progress: number }) {
  return (
    <>
      {[0.1, 0.2, 0.3].map((offset, index) => {
        const trailProgress = progress - offset;
        if (trailProgress <= 0) return null;
        const point = getFlyerPosition(track, trailProgress);
        return (
          <Box
            key={offset}
            position="absolute"
            left={`${point.xPct}%`}
            top={`${point.yPct}%`}
            w={`${12 - index * 2}px`}
            h={`${12 - index * 2}px`}
            zIndex={5}
            borderRadius="999px"
            bgColor="rgba(255, 239, 148, 0.88)"
            border="1px solid white"
            transform="translate(-50%, -50%)"
            boxShadow="0 0 8px rgba(255,199,40,0.82)"
            opacity={0.84 - index * 0.16}
            pointerEvents="none"
          />
        );
      })}
    </>
  );
}

export function FrogFlyerWindMinigame({ onComplete }: { onComplete: () => void }) {
  const animationFrameRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialCycleNonce, setTutorialCycleNonce] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [caughtStepIds, setCaughtStepIds] = useState<string[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [flyerProgress, setFlyerProgress] = useState(0);
  const [flyerPhase, setFlyerPhase] = useState<FlyerPhase>("flying");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<FlyerFeedback | null>(null);
  const [isWindBlank, setIsWindBlank] = useState(false);
  const [runNonce, setRunNonce] = useState(0);

  const currentStep = WIND_STEPS[stepIndex];
  const caughtStepSet = useMemo(() => new Set(caughtStepIds), [caughtStepIds]);
  const caughtCount = caughtStepIds.length;
  const isComplete = flyerPhase === "complete";
  const isWindVisible = !isComplete && !isWindBlank;
  const isWindInteractive = isWindVisible && flyerPhase === "flying";
  const currentLaneRect = useMemo(() => (currentStep ? getLaneRect(currentStep.track) : null), [currentStep]);
  const flyerPosition = useMemo(
    () => getFlyerPosition(currentStep?.track ?? WIND_STEPS[0].track, flyerProgress),
    [currentStep?.track, flyerProgress],
  );
  const hasPassed = caughtCount >= MIN_CAUGHT_FLYERS_TO_PASS;
  const remainingToPass = Math.max(0, MIN_CAUGHT_FLYERS_TO_PASS - caughtCount);
  const remainingHearts = Math.max(0, DISPLAY_HEART_COUNT - missCount);
  const isCatchWindowOpen =
    !!currentStep &&
    flyerPhase === "flying" &&
    Math.abs(flyerProgress - currentStep.targetProgress) <= currentStep.hitWindow;

  const clearTimers = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    setStepIndex(0);
    setCaughtStepIds([]);
    setMissCount(0);
    setFlyerProgress(0);
    setFlyerPhase("flying");
    setStreak(0);
    setBestStreak(0);
    setFeedback(null);
    setIsWindBlank(false);
    setRunNonce((nonce) => nonce + 1);
  }, [clearTimers]);

  const advanceToNextFlyer = useCallback((fromStepIndex: number) => {
    const nextStepIndex = fromStepIndex + 1;
    nextTimerRef.current = window.setTimeout(() => {
      nextTimerRef.current = null;
      setFeedback(null);
      setIsWindBlank(true);

      nextTimerRef.current = window.setTimeout(() => {
        nextTimerRef.current = null;
        setIsWindBlank(false);
        if (nextStepIndex >= WIND_STEPS.length) {
          setFlyerPhase("complete");
          return;
        }
        setStepIndex(nextStepIndex);
        setFlyerProgress(0);
        setFlyerPhase("flying");
        setRunNonce((nonce) => nonce + 1);
      }, FLYER_INTER_STEP_BLANK_MS);
    }, FLYER_FEEDBACK_DURATION_MS);
  }, []);

  useEffect(() => {
    if (isTutorialOpen || flyerPhase !== "flying" || !currentStep) return;

    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / currentStep.durationMs);
      setFlyerProgress(nextProgress);

      if (nextProgress >= 1) {
        animationFrameRef.current = null;
        setMissCount((count) => count + 1);
        setStreak(0);
        setFeedback({
          id: `${currentStep.id}-missed-${runNonce}`,
          kind: "missed",
          text: "MISS",
          ...getFlyerPosition(currentStep.track, 1),
        });
        setFlyerPhase("missed");
        advanceToNextFlyer(stepIndex);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [advanceToNextFlyer, currentStep, flyerPhase, isTutorialOpen, runNonce, stepIndex]);

  useEffect(() => clearTimers, [clearTimers]);

  const handleLaneClick = useCallback(() => {
    if (isTutorialOpen || !currentStep || flyerPhase !== "flying") return;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const timingOffset = Math.abs(flyerProgress - currentStep.targetProgress);
    const isInCatchWindow = timingOffset <= currentStep.hitWindow;
    if (isInCatchWindow) {
      setFlyerPhase("caught");
      setCaughtStepIds((ids) => (ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]));
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setFeedback({
        id: `${currentStep.id}-caught-${runNonce}`,
        kind: "caught",
        text: timingOffset <= currentStep.hitWindow * 0.45 ? "GREAT" : "GOOD",
        xPct: flyerPosition.xPct,
        yPct: flyerPosition.yPct,
      });
    } else {
      setFlyerPhase("missed");
      setMissCount((count) => count + 1);
      setStreak(0);
      setFeedback({
        id: `${currentStep.id}-mistimed-${runNonce}`,
        kind: "missed",
        text: "MISS",
        xPct: flyerPosition.xPct,
        yPct: flyerPosition.yPct,
      });
    }

    advanceToNextFlyer(stepIndex);
  }, [
    advanceToNextFlyer,
    currentStep,
    flyerPhase,
    flyerPosition.xPct,
    flyerPosition.yPct,
    flyerProgress,
    isTutorialOpen,
    runNonce,
    stepIndex,
    streak,
  ]);

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" overflow="hidden" bgColor="#FFF5DB">
      <Box position="relative" flex="0 0 112px" overflow="hidden" bgColor="#FFC451">
        <Image src={MASCOT_BANNER_SRC} alt="小白替撿傳單關卡加油" position="absolute" inset="0" w="100%" h="100%" objectFit="cover" />
        <Box position="absolute" left="17px" top="19px" zIndex={2}>
          <Text color="white" fontSize="15px" fontWeight="900" lineHeight="1" textShadow="0 2px 0 #A85C24, 1px 0 #A85C24, -1px 0 #A85C24">
            撿傳單
          </Text>
          <Text mt="6px" color="#8C5429" fontSize="11px" fontWeight="900">
            {caughtCount}/{MIN_CAUGHT_FLYERS_TO_PASS}
          </Text>
        </Box>
        <Flex
          position="absolute"
          right="17px"
          top="16px"
          zIndex={2}
          direction="column"
          align="center"
          opacity={isWindVisible ? 1 : 0}
          transition="opacity 60ms linear"
        >
          <Flex w="44px" h="44px" align="center" justify="center" borderRadius="999px" border="3px solid white" bgColor="#F07D2D" boxShadow="0 4px 0 #A94D1E">
            <Text color="white" fontSize="24px" fontWeight="900" lineHeight="1">
              {currentStep?.arrow ?? "✓"}
            </Text>
          </Flex>
          <Text mt="5px" color="#7B4825" fontSize="9px" fontWeight="900">
            {streak > 0 ? `${streak} COMBO` : "WIND"}
          </Text>
        </Flex>
        {[{ left: "25%", top: "22%" }, { right: "24%", top: "34%" }].map((position, index) => (
          <Text key={index} position="absolute" {...position} zIndex={2} color="white" fontSize="22px" lineHeight="1" animation={`${bannerSparkle} ${900 + index * 180}ms ease-in-out infinite`} pointerEvents="none">
            ✦
          </Text>
        ))}
      </Box>

      <Box
        flex="1"
        minH="0"
        position="relative"
        overflow="hidden"
        borderLeft="6px solid #11100F"
        borderRight="6px solid #11100F"
        bgImage={`url("${STREET_SCENE_SRC}")`}
        bgSize="cover"
        backgroundPosition="center 56%"
        bgColor="#B8DCEA"
      >
        <Flex
          position="absolute"
          top="9px"
          left="50%"
          zIndex={10}
          display={isTutorialOpen ? "none" : "flex"}
          gap="5px"
          align="center"
          transform="translateX(-50%)"
        >
          {WIND_STEPS.map((step, index) => (
            <ForecastChip key={step.id} step={step} index={index} isCurrent={isWindVisible && index === stepIndex} isCaught={caughtStepSet.has(step.id)} />
          ))}
        </Flex>

        {isWindVisible && currentStep ? <PathColorBand step={currentStep} isCatchWindowOpen={isCatchWindowOpen} /> : null}

        {isWindInteractive && currentStep && currentLaneRect ? (
          <Flex
            as="button"
            aria-label={`${LANE_THEME_BY_ZONE[currentStep.zoneId].label} 風向路徑，點擊撿起傳單`}
            position="absolute"
            left={`${currentLaneRect.leftPct}%`}
            top={`${currentLaneRect.topPct}%`}
            w={`${currentLaneRect.widthPct}%`}
            h={`${currentLaneRect.heightPct}%`}
            zIndex={6}
            border="0"
            bgColor="transparent"
            cursor={flyerPhase === "flying" ? "pointer" : "default"}
            pointerEvents={flyerPhase === "flying" ? "auto" : "none"}
            touchAction="manipulation"
            onClick={handleLaneClick}
          />
        ) : null}

        {isWindInteractive && currentStep ? <FlyerTrail track={currentStep.track} progress={flyerProgress} /> : null}

        {isWindVisible && currentStep ? (
          <Flex
            position="absolute"
            left={`${flyerPosition.xPct}%`}
            top={`${flyerPosition.yPct}%`}
            zIndex={7}
            w="90px"
            h="96px"
            align="center"
            justify="center"
            transform={`translate(-50%, -50%) rotate(${flyerPosition.rotate}deg)`}
            opacity={flyerPhase === "missed" ? 0.18 : 1}
            pointerEvents="none"
            transition="opacity 120ms ease"
          >
            <FlyerPaper isCaught={flyerPhase === "caught"} />
          </Flex>
        ) : null}

        {feedback ? (
          <Text
            key={feedback.id}
            position="absolute"
            left={`${Math.min(88, Math.max(12, feedback.xPct))}%`}
            top={`${Math.min(88, Math.max(14, feedback.yPct))}%`}
            zIndex={12}
            px="11px"
            py="6px"
            borderRadius="999px"
            border="3px solid white"
            bgColor={feedback.kind === "caught" ? "#F27E2B" : "#E96F58"}
            color="white"
            fontSize="16px"
            fontWeight="900"
            lineHeight="1"
            whiteSpace="nowrap"
            textShadow="0 2px 0 rgba(116,48,20,0.5)"
            boxShadow="0 4px 0 rgba(40,28,20,0.72)"
            animation={`${feedbackPop} ${FLYER_FEEDBACK_DURATION_MS}ms ease-out both`}
            pointerEvents="none"
          >
            {feedback.text}
          </Text>
        ) : null}

        {isComplete ? (
          <Flex position="absolute" inset="0" zIndex={14} align="center" justify="center" p="24px" bgColor="rgba(25,20,16,0.56)">
            <Flex
              w="min(310px, 100%)"
              direction="column"
              align="center"
              gap="12px"
              px="20px"
              py="22px"
              borderRadius="20px"
              border="5px solid #171513"
              outline="4px solid white"
              bg={hasPassed ? "linear-gradient(180deg, #FFF5B0, #FFC94C)" : "linear-gradient(180deg, #FFF0DD, #F4A17A)"}
              boxShadow="0 12px 0 rgba(18,15,13,0.76), 0 24px 42px rgba(20,14,10,0.42)"
              animation={`${successFadeUp} 300ms ease both`}
            >
              <Text color="#56331F" fontSize="25px" fontWeight="900" textAlign="center" lineHeight="1.1">
                {hasPassed ? "傳單撿完啦！" : "差一點點！"}
              </Text>
              <Text color="#74492E" fontSize="13px" fontWeight="800" lineHeight="1.45" textAlign="center">
                {hasPassed ? `撿回 ${caughtCount} 張，最高 ${bestStreak} combo。` : `只撿到 ${caughtCount} 張，還差 ${remainingToPass} 張。`}
              </Text>
              <Flex
                as="button"
                w="100%"
                h="44px"
                align="center"
                justify="center"
                borderRadius="999px"
                border="3px solid white"
                bgColor={hasPassed ? "#EF782D" : "#D96D52"}
                boxShadow={hasPassed ? "0 5px 0 #A34C1D" : "0 5px 0 #974837"}
                color="white"
                fontSize="16px"
                fontWeight="900"
                cursor="pointer"
                onClick={hasPassed ? onComplete : resetGame}
              >
                {hasPassed ? "交還傳單" : "再撿一次"}
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Box>

      <Box position="relative" flex="0 0 94px" overflow="hidden" bgColor="#B98254">
        <Image src={LIFE_HUD_SRC} alt="" position="absolute" inset="0" w="100%" h="100%" objectFit="cover" draggable={false} />
        <Text position="absolute" left="24px" top="23px" zIndex={2} color="#FFF0C5" fontSize="10px" fontWeight="900" textShadow="0 2px 0 rgba(95,53,27,0.48)">
          MISS {missCount}
        </Text>
        <Flex position="absolute" left="50%" top="50%" zIndex={2} gap="8px" transform="translate(-50%, -50%)" align="center">
          {Array.from({ length: DISPLAY_HEART_COUNT }).map((_, index) => {
            const isActive = index < remainingHearts;
            const isJustLost = flyerPhase === "missed" && index === remainingHearts;
            return (
              <Image
                key={index}
                src={HEART_SRC}
                alt={isActive ? "剩餘愛心" : "失去的愛心"}
                w="48px"
                h="48px"
                objectFit="contain"
                opacity={isActive ? 1 : 0.22}
                filter={isActive ? "drop-shadow(0 3px 0 rgba(45,28,20,0.34))" : "grayscale(1)"}
                animation={isJustLost ? `${heartHit} 420ms ease both` : undefined}
                draggable={false}
              />
            );
          })}
        </Flex>
        <Text position="absolute" right="28px" top="20px" zIndex={2} color="#FFE09A" fontSize="10px" fontWeight="900" textAlign="right" textShadow="0 2px 0 rgba(95,53,27,0.48)">
          SCORE<br />{caughtCount}/{MIN_CAUGHT_FLYERS_TO_PASS}
        </Text>
      </Box>

      {isTutorialOpen ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={30}
          align="center"
          justify="center"
          p="24px"
          bgColor="rgba(18,14,12,0.46)"
        >
          <Flex
            w="100%"
            maxW="320px"
            direction="column"
            overflow="hidden"
            borderRadius="10px"
            bgColor="#F7EFE2"
            boxShadow="0 14px 28px rgba(0,0,0,0.22)"
          >
            <Flex
              minH="72px"
              px="18px"
              py="14px"
              align="center"
              justify="center"
              textAlign="center"
            >
              <Text color="#2F2924" fontSize="16px" fontWeight="700" lineHeight="1.45">
                {tutorialStepIndex === 0
                  ? "傳單會從風向飛來"
                  : "飛進框框時點擊風向任意處"}
              </Text>
            </Flex>

            <Box
              key={
                tutorialStepIndex === 0
                  ? "flyer-tutorial-step-0"
                  : `flyer-tutorial-step-1-${tutorialCycleNonce}`
              }
              aria-label={
                tutorialStepIndex === 0
                  ? "傳單沿著斜向風帶飛進框框的示意動畫"
                  : "傳單飛進框框時點擊斜向風帶任意處的示意動畫"
              }
              position="relative"
              h="220px"
              overflow="hidden"
              bgImage={`linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url("${STREET_SCENE_SRC}")`}
              bgSize="cover"
              backgroundPosition="center 58%"
            >
                <Box
                  position="absolute"
                  left="-6%"
                  top="50%"
                  w="112%"
                  h="76px"
                  transform="translateY(-50%) rotate(-11deg)"
                  bgColor="#171513"
                  boxShadow="0 7px 0 rgba(0,0,0,0.52)"
                  animation={tutorialStepIndex === 0 ? `${tutorialWindReveal} 700ms ease-out 650ms 1 both` : undefined}
                />
                <Box
                  position="absolute"
                  left="-4%"
                  top="50%"
                  w="108%"
                  h="62px"
                  transform="translateY(-50%) rotate(-11deg)"
                  border="3px solid #FFD35A"
                  bgColor="rgba(255,192,55,0.42)"
                  overflow="hidden"
                  animation={tutorialStepIndex === 0 ? `${tutorialWindReveal} 700ms ease-out 650ms 1 both` : undefined}
                >
                  {[0, 1, 2].map((index) => (
                    <Box
                      key={index}
                      position="absolute"
                      left="-42%"
                      top={`${12 + index * 20}px`}
                      w="48%"
                      h="7px"
                      borderRadius="999px"
                      bgColor="rgba(255,255,255,0.76)"
                      filter="blur(2px)"
                      animation={`${windSweepHorizontal} ${900 + index * 120}ms ease-in-out infinite`}
                      animationDelay={`${index * 110}ms`}
                    />
                  ))}
                  <Text position="absolute" right="8px" top="50%" transform="translateY(-50%)" color="white" fontSize="26px" fontWeight="900" textShadow="0 2px 0 rgba(80,50,26,0.48)">
                    →
                  </Text>
                </Box>

                <Flex
                  position="absolute"
                  left="68%"
                  top="46%"
                  w="96px"
                  h="96px"
                  zIndex={3}
                  align="center"
                  justify="center"
                  borderRadius="999px"
                  border="4px solid rgba(255,236,132,0.88)"
                  bgColor="rgba(255,248,204,0.15)"
                  boxShadow="0 0 0 4px rgba(255,255,255,0.62)"
                  animation={
                    tutorialStepIndex === 0
                      ? `${tutorialTargetReveal} 750ms ease-out 650ms 1 both`
                      : `${tutorialTargetCue} 3200ms ease-in-out 1 both`
                  }
                >
                  <Image src={FLYER_DASH_IMAGE_SRC} alt="" w="52px" h="48px" objectFit="contain" opacity={0.94} />
                </Flex>

                <Flex
                  key={`flyer-tutorial-paper-${tutorialStepIndex}-${tutorialCycleNonce}`}
                  position="absolute"
                  left="8%"
                  top="60%"
                  zIndex={5}
                  w="52px"
                  h="48px"
                  align="center"
                  justify="center"
                  animation={
                    tutorialStepIndex === 0
                      ? `${tutorialFlyerArrival} 1900ms ease-in-out 1450ms 1 both`
                      : `${tutorialFlyerPass} 3200ms ease-in-out 1 both`
                  }
                  onAnimationEnd={(event) => {
                    if (event.currentTarget !== event.target) return;
                    setTutorialCycleNonce((nonce) => nonce + 1);
                  }}
                >
                  <Image src={FLYER_IMAGE_SRC} alt="" w="100%" h="100%" objectFit="contain" draggable={false} />
                </Flex>

                {tutorialStepIndex === 1 ? (
                  <>
                    <Box
                      position="absolute"
                      left="38%"
                      top="52%"
                      zIndex={6}
                      w="58px"
                      h="58px"
                      borderRadius="999px"
                      border="4px solid rgba(255,255,255,0.92)"
                      boxShadow="0 0 18px rgba(255,227,104,0.74)"
                      animation={`${tutorialTapRipple} 3200ms ease-out 1 both`}
                      pointerEvents="none"
                    />

                    <Flex
                      position="absolute"
                      left="38%"
                      top="52%"
                      zIndex={7}
                      color="white"
                      filter="drop-shadow(0 3px 0 rgba(71,43,25,0.62))"
                      animation={`${tutorialTapCue} 3200ms ease-in-out 1 both`}
                      pointerEvents="none"
                    >
                      <MdTouchApp size={46} />
                    </Flex>

                    <Flex
                      position="absolute"
                      left="68%"
                      top="46%"
                      zIndex={8}
                      w="48px"
                      h="48px"
                      align="center"
                      justify="center"
                      borderRadius="999px"
                      border="4px solid white"
                      bgColor="#F07D2D"
                      color="white"
                      fontSize="25px"
                      boxShadow="0 0 24px rgba(255,211,67,0.86)"
                      animation={`${tutorialCaughtCue} 3200ms ease-in-out 1 both`}
                      pointerEvents="none"
                    >
                      <FiCheck />
                    </Flex>
                  </>
                ) : null}
            </Box>

            <Flex minH="72px" px="18px" py="18px" justify="flex-end">
              <Flex
                as="button"
                minW="84px"
                h="36px"
                px="14px"
                align="center"
                justify="center"
                borderRadius="999px"
                bgColor="#8E6D52"
                color="white"
                fontSize="13px"
                fontWeight="700"
                cursor="pointer"
                onClick={() => {
                  if (tutorialStepIndex === 0) {
                    setTutorialCycleNonce(0);
                    setTutorialStepIndex(1);
                    return;
                  }
                  setFlyerProgress(0);
                  setRunNonce((nonce) => nonce + 1);
                  setIsTutorialOpen(false);
                }}
              >
                {tutorialStepIndex === 0 ? "下一步" : "開始"}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

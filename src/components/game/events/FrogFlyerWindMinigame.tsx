"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiCheck } from "react-icons/fi";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";

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

const DEFAULT_HIT_WINDOW = 0.11;
const FLYER_IMAGE_SRC = "/images/mini_game/flyers.png";
const FLYER_DASH_IMAGE_SRC = "/images/mini_game/flyers_dash.svg";
const FLYER_BACKGROUND_SRC = "/images/mini_game/flyers_bg.png";
const FLYER_WIDTH_PX = 66;
const FLYER_HEIGHT_PX = 60;

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

const FLYER_NEXT_DELAY_MS = 230;
const MIN_CAUGHT_FLYERS_TO_PASS = 5;

const flyerFlutter = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  30% { transform: translateY(-5px) rotate(3deg); }
  62% { transform: translateY(2px) rotate(-4deg); }
`;

const laneWindSweepHorizontal = keyframes`
  0% { transform: translateX(-128%) skewX(-10deg); opacity: 0; }
  22% { opacity: 0.52; }
  100% { transform: translateX(128%) skewX(-10deg); opacity: 0; }
`;

const laneWindSweepVertical = keyframes`
  0% { transform: translateY(-128%) skewY(-10deg); opacity: 0; }
  22% { opacity: 0.52; }
  100% { transform: translateY(128%) skewY(-10deg); opacity: 0; }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const feedbackPop = keyframes`
  0% { opacity: 0; transform: translate(-50%, -34%) scale(0.9); }
  18% { opacity: 1; transform: translate(-50%, -64%) scale(1); }
  78% { opacity: 1; transform: translate(-50%, -72%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -88%) scale(0.96); }
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
  const flutterX = isHorizontal ? 0 : flutterWeight * 1.2;
  const flutterY = isHorizontal ? flutterWeight * 1.2 : 0;

  return {
    xPct: track.start.xPct + (track.end.xPct - track.start.xPct) * safeProgress + flutterX,
    yPct: track.start.yPct + (track.end.yPct - track.start.yPct) * safeProgress + flutterY,
    rotate: track.rotate + flutterWeight * 2.4,
  };
}

function TargetPaperOutline({
  position,
  isActive,
}: {
  position: FlyerPosition;
  isActive: boolean;
}) {
  return (
    <Flex
      position="absolute"
      left={`${position.xPct}%`}
      top={`${position.yPct}%`}
      w={`${FLYER_WIDTH_PX}px`}
      h={`${FLYER_HEIGHT_PX}px`}
      align="center"
      justify="center"
      transform={`translate(-50%, -50%) rotate(${position.rotate}deg)`}
      filter={isActive ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.34))" : "none"}
      opacity={isActive ? 1 : 0.88}
      pointerEvents="none"
      zIndex={3}
      transition="filter 0.12s ease, opacity 0.12s ease"
    >
      <Image
        src={FLYER_DASH_IMAGE_SRC}
        alt=""
        w="100%"
        h="100%"
        objectFit="contain"
        draggable={false}
        pointerEvents="none"
      />
    </Flex>
  );
}

function FlyerPaper({ isCaught }: { isCaught: boolean }) {
  return (
    <Flex
      w={`${FLYER_WIDTH_PX}px`}
      h={`${FLYER_HEIGHT_PX}px`}
      position="relative"
      align="center"
      justify="center"
      animation={isCaught ? undefined : `${flyerFlutter} 720ms ease-in-out infinite`}
      transform={isCaught ? "scale(0.88)" : "scale(1)"}
      filter={isCaught ? "saturate(0.86) brightness(0.98)" : "drop-shadow(0 12px 14px rgba(62, 53, 43, 0.22))"}
      transition="filter 0.18s ease, transform 0.16s ease"
    >
      <Image
        src={FLYER_IMAGE_SRC}
        alt=""
        w="100%"
        h="100%"
        objectFit="contain"
        draggable={false}
        pointerEvents="none"
      />
    </Flex>
  );
}

function ForecastCard({
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
  return (
    <Flex
      minW="0"
      w="44px"
      h="52px"
      direction="column"
      align="center"
      justify="center"
      gap="4px"
      px="4px"
      py="7px"
      borderRadius="7px"
      border={isCurrent ? "2px solid #6F8798" : "1px solid rgba(101, 82, 59, 0.15)"}
      bgColor={isCaught ? "rgba(147, 164, 130, 0.24)" : isCurrent ? "#EAF2F4" : "rgba(255, 250, 240, 0.94)"}
      boxShadow={isCurrent ? "0 0 0 3px rgba(111,135,152,0.16)" : "0 4px 10px rgba(73, 62, 49, 0.05)"}
      transition="background-color 0.18s ease, border 0.18s ease, box-shadow 0.18s ease"
      flexShrink={0}
    >
      <Text color="#725A42" fontSize="9px" fontWeight="900" lineHeight="1">
        {index + 1}
      </Text>
      <Text color="#56677A" fontSize="19px" fontWeight="900" lineHeight="1">
        {isCaught ? <FiCheck /> : step.arrow}
      </Text>
    </Flex>
  );
}

function MissCard({ missCount }: { missCount: number }) {
  const hasMissed = missCount > 0;

  return (
    <Flex
      w="44px"
      h="52px"
      direction="column"
      align="center"
      justify="center"
      gap="4px"
      px="5px"
      py="6px"
      borderRadius="7px"
      border={hasMissed ? "2px solid rgba(184, 101, 67, 0.62)" : "1px solid rgba(101, 82, 59, 0.14)"}
      bgColor={hasMissed ? "rgba(255, 226, 207, 0.9)" : "rgba(255, 250, 240, 0.78)"}
      flexShrink={0}
    >
      <Text color={hasMissed ? "#B86543" : "#8A7A68"} fontSize="9px" fontWeight="900" lineHeight="1">
        MISS
      </Text>
      <Text color={hasMissed ? "#B86543" : "#8A7A68"} fontSize="18px" fontWeight="900" lineHeight="1">
        {missCount}
      </Text>
    </Flex>
  );
}

function TrackGuide({
  step,
  isCatchWindowOpen,
}: {
  step: WindStep;
  isCatchWindowOpen: boolean;
}) {
  const track = step.track;
  const laneRect = getLaneRect(track);
  const isHorizontal = isHorizontalTrack(track);
  const targetPosition = getFlyerPosition(track, step.targetProgress);

  return (
    <>
      <Box
        position="absolute"
        left={`${laneRect.leftPct}%`}
        top={`${laneRect.topPct}%`}
        w={`${laneRect.widthPct}%`}
        h={`${laneRect.heightPct}%`}
        overflow="hidden"
        bgColor={isCatchWindowOpen ? "rgba(237, 229, 213, 0.6)" : "rgba(226, 222, 213, 0.34)"}
        pointerEvents="none"
        zIndex={1}
        transition="background-color 0.12s ease"
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            position="absolute"
            left={isHorizontal ? "-34%" : "50%"}
            top={isHorizontal ? `${28 + index * 19}%` : "-34%"}
            w={isHorizontal ? "42%" : "13px"}
            h={isHorizontal ? "12px" : "42%"}
            borderRadius="999px"
            bgColor="rgba(255, 255, 255, 0.32)"
            filter="blur(7px)"
            transform={isHorizontal ? undefined : "translateX(-50%)"}
            opacity={0}
            animation={`${isHorizontal ? laneWindSweepHorizontal : laneWindSweepVertical} ${1200 + index * 170}ms ease-in-out infinite`}
            animationDelay={`${index * 180}ms`}
          />
        ))}
      </Box>
      <Box
        position="absolute"
        left={isHorizontal ? "0%" : `${track.start.xPct}%`}
        top={isHorizontal ? `${track.start.yPct}%` : "0%"}
        w={isHorizontal ? `${laneRect.widthPct}%` : "2px"}
        h={isHorizontal ? "2px" : `${laneRect.heightPct}%`}
        bgColor="rgba(255, 250, 240, 0.18)"
        transform={isHorizontal ? "translateY(-50%)" : "translateX(-50%)"}
        pointerEvents="none"
        zIndex={2}
      />
      <TargetPaperOutline position={targetPosition} isActive={isCatchWindowOpen} />
    </>
  );
}

function FlyerTrail({
  track,
  progress,
}: {
  track: WindTrack;
  progress: number;
}) {
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
            borderRadius="999px"
            bgColor="rgba(255, 240, 198, 0.42)"
            transform="translate(-50%, -50%)"
            filter="blur(1px)"
            opacity={0.58 - index * 0.12}
            pointerEvents="none"
          />
        );
      })}
    </>
  );
}

export function FrogFlyerWindMinigame({
  sceneImage,
  sceneColor,
  savings,
  actionPower,
  fatigue,
  onComplete,
}: {
  sceneImage: string;
  sceneColor: string;
  savings: number;
  actionPower: number;
  fatigue: number;
  onComplete: () => void;
}) {
  const animationFrameRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [caughtStepIds, setCaughtStepIds] = useState<string[]>([]);
  const [missCount, setMissCount] = useState(0);
  const [flyerProgress, setFlyerProgress] = useState(0);
  const [flyerPhase, setFlyerPhase] = useState<FlyerPhase>("flying");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState<FlyerFeedback | null>(null);
  const [runNonce, setRunNonce] = useState(0);

  const currentStep = WIND_STEPS[stepIndex];
  const caughtStepSet = useMemo(() => new Set(caughtStepIds), [caughtStepIds]);
  const caughtCount = caughtStepIds.length;
  const isComplete = flyerPhase === "complete";
  const activeBeatNumber = isComplete ? WIND_STEPS.length : stepIndex + 1;
  const currentLaneRect = useMemo(() => (currentStep ? getLaneRect(currentStep.track) : null), [currentStep]);
  const flyerPosition = useMemo(
    () => getFlyerPosition(currentStep?.track ?? WIND_STEPS[0].track, flyerProgress),
    [currentStep?.track, flyerProgress],
  );
  const hasPassed = caughtCount >= MIN_CAUGHT_FLYERS_TO_PASS;
  const remainingToPass = Math.max(0, MIN_CAUGHT_FLYERS_TO_PASS - caughtCount);
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
    setRunNonce((nonce) => nonce + 1);
  }, [clearTimers]);

  const advanceToNextFlyer = useCallback(
    (fromStepIndex: number) => {
      const nextStepIndex = fromStepIndex + 1;
      if (nextStepIndex >= WIND_STEPS.length) {
        nextTimerRef.current = window.setTimeout(() => {
          nextTimerRef.current = null;
          setFlyerPhase("complete");
        }, FLYER_NEXT_DELAY_MS);
        return;
      }

      nextTimerRef.current = window.setTimeout(() => {
        nextTimerRef.current = null;
        setStepIndex(nextStepIndex);
        setFlyerProgress(0);
        setFlyerPhase("flying");
        setRunNonce((nonce) => nonce + 1);
      }, FLYER_NEXT_DELAY_MS);
    },
    [],
  );

  useEffect(() => {
    if (flyerPhase !== "flying" || !currentStep) return;

    const startedAt = performance.now();
    const durationMs = currentStep.durationMs;
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / durationMs);
      setFlyerProgress(nextProgress);

      if (nextProgress >= 1) {
        animationFrameRef.current = null;
        setMissCount((count) => count + 1);
        setStreak(0);
        setFeedback({
          id: `${currentStep.id}-missed-${runNonce}`,
          kind: "missed",
          text: "飛走了",
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
  }, [advanceToNextFlyer, currentStep, flyerPhase, runNonce, stepIndex]);

  useEffect(() => clearTimers, [clearTimers]);

  const handleLaneClick = useCallback(() => {
    if (!currentStep || flyerPhase !== "flying") return;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const isInCatchWindow = Math.abs(flyerProgress - currentStep.targetProgress) <= currentStep.hitWindow;

    if (isInCatchWindow) {
      setFlyerPhase("caught");
      setCaughtStepIds((ids) => (ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]));
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setFeedback({
        id: `${currentStep.id}-caught-${runNonce}`,
        kind: "caught",
        text: nextStreak >= 3 ? `${nextStreak} combo` : "撿到",
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
        text: flyerProgress < currentStep.targetProgress ? "太早" : "太晚",
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
    runNonce,
    stepIndex,
    streak,
  ]);

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor={sceneColor}>
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        flex="1"
        minH="0"
        direction="column"
        align="center"
        justify="center"
        px="18px"
        py="22px"
        bgImage={`linear-gradient(180deg, rgba(247, 246, 238, 0.95), rgba(239, 241, 232, 0.92)), url("${sceneImage}")`}
        bgSize="cover"
        backgroundPosition="center center"
        overflow="hidden"
      >
        <Flex w="100%" maxW="356px" direction="column" align="center" gap="10px">
          <Flex w="100%" align="center" justify="space-between" px="3px">
            <Text color="#554B3F" fontSize="13px" fontWeight="900" letterSpacing="0">
              {activeBeatNumber}/{MIN_CAUGHT_FLYERS_TO_PASS}
            </Text>
            <Text color="#6F553B" fontSize="12px" fontWeight="900">
              {hasPassed ? `OK・combo ${bestStreak}` : `差 ${remainingToPass}・combo ${streak}`}
            </Text>
          </Flex>

          <Flex
            w="100%"
            minH="78px"
            position="relative"
            align="center"
            justify="center"
            px="10px"
            py="12px"
            borderRadius="8px"
            bgColor="rgba(255, 248, 234, 0.84)"
            boxShadow="inset 0 0 0 1px rgba(111, 85, 59, 0.08)"
          >
            <Flex gap="5px" align="center" justify="center">
              {WIND_STEPS.map((step, index) => (
                <ForecastCard
                  key={step.id}
                  step={step}
                  index={index}
                  isCurrent={!isComplete && index === stepIndex}
                  isCaught={caughtStepSet.has(step.id)}
                />
              ))}
              <MissCard missCount={missCount} />
            </Flex>
          </Flex>

          <Flex
            w="100%"
            maxW="320px"
            aspectRatio="1"
            position="relative"
            overflow="hidden"
            borderRadius="8px"
            bgColor="#B7C3C8"
            bgImage={`url("${FLYER_BACKGROUND_SRC}")`}
            bgSize="cover"
            backgroundPosition="center"
            boxShadow="0 14px 28px rgba(63, 61, 55, 0.16), inset 0 0 0 1px rgba(255,255,255,0.18)"
          >
            {!isComplete && currentStep ? <TrackGuide step={currentStep} isCatchWindowOpen={isCatchWindowOpen} /> : null}
            {!isComplete && currentStep && currentLaneRect ? (
              <Flex
                as="button"
                aria-label="在傳單軌道上撿起傳單"
                position="absolute"
                left={`${currentLaneRect.leftPct}%`}
                top={`${currentLaneRect.topPct}%`}
                w={`${currentLaneRect.widthPct}%`}
                h={`${currentLaneRect.heightPct}%`}
                bgColor="transparent"
                border="0"
                cursor={flyerPhase === "flying" ? "pointer" : "default"}
                pointerEvents={flyerPhase === "flying" ? "auto" : "none"}
                touchAction="manipulation"
                zIndex={4}
                onClick={handleLaneClick}
              />
            ) : null}
            {!isComplete && currentStep && flyerPhase === "flying" ? (
              <FlyerTrail track={currentStep.track} progress={flyerProgress} />
            ) : null}

            {!isComplete && currentStep ? (
              <Flex
                aria-hidden="true"
                position="absolute"
                left={`${flyerPosition.xPct}%`}
                top={`${flyerPosition.yPct}%`}
                w="96px"
                h="104px"
                align="center"
                justify="center"
                transform={`translate(-50%, -50%) rotate(${flyerPosition.rotate}deg)`}
                bgColor="transparent"
                border="0"
                opacity={flyerPhase === "missed" ? 0.18 : 1}
                pointerEvents="none"
                zIndex={5}
                transition="opacity 0.18s ease"
              >
                <FlyerPaper isCaught={flyerPhase === "caught"} />
              </Flex>
            ) : null}

            {feedback ? (
              <Text
                key={feedback.id}
                position="absolute"
                left={`${feedback.xPct}%`}
                top={`${feedback.yPct}%`}
                px="9px"
                py="5px"
                borderRadius="999px"
                bgColor={feedback.kind === "caught" ? "rgba(232, 239, 218, 0.96)" : "rgba(255, 226, 207, 0.96)"}
                color={feedback.kind === "caught" ? "#5D6F48" : "#B86543"}
                fontSize="12px"
                fontWeight="900"
                lineHeight="1"
                boxShadow="0 8px 16px rgba(40, 34, 28, 0.18)"
                pointerEvents="none"
                zIndex={8}
                animation={`${feedbackPop} 680ms ease both`}
              >
                {feedback.text}
              </Text>
            ) : null}

            {isComplete ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={9}
                align="center"
                justify="center"
                p="18px"
                bgColor="rgba(54, 51, 46, 0.58)"
              >
                <Flex
                  w="min(292px, 100%)"
                  direction="column"
                  align="center"
                  gap="12px"
                  px="18px"
                  py="20px"
                  borderRadius="8px"
                  bgColor="#FFF8EA"
                  border="2px solid rgba(111, 85, 59, 0.18)"
                  boxShadow="0 18px 38px rgba(44, 38, 31, 0.28)"
                  animation={`${successFadeUp} 300ms ease both`}
                >
                  <Flex direction="column" align="center" gap="7px">
                    <Text color="#4A382A" fontSize="20px" fontWeight="900" textAlign="center">
                      {hasPassed ? "成功" : "失敗"}
                    </Text>
                    <Text color="#715740" fontSize="13px" fontWeight="700" lineHeight="1.45" textAlign="center">
                      {hasPassed
                        ? `傳單都收攏了，最高 ${bestStreak} combo。`
                        : `只撿到 ${caughtCount} 張，還差 ${remainingToPass} 張。`}
                    </Text>
                  </Flex>
                  <Flex
                    as="button"
                    w="100%"
                    h="42px"
                    align="center"
                    justify="center"
                    borderRadius="8px"
                    bgColor={hasPassed ? "#6F8B73" : "#C98260"}
                    color="white"
                    fontSize="14px"
                    fontWeight="900"
                    boxShadow={hasPassed ? "0 8px 16px rgba(86, 111, 89, 0.24)" : "0 8px 16px rgba(146, 91, 62, 0.24)"}
                    cursor="pointer"
                    onClick={hasPassed ? onComplete : resetGame}
                  >
                    {hasPassed ? "交還傳單" : "再撿一次"}
                  </Flex>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

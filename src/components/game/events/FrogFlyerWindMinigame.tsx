"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiCheck, FiRefreshCw } from "react-icons/fi";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";

type WindZoneId = "right" | "top" | "left" | "bottom";
type FlyerPhase = "flying" | "caught" | "missed" | "complete";

type WindStep = {
  id: string;
  arrow: string;
  forecastLabel: string;
  zoneId: WindZoneId;
  flyerLabel: string;
};

type TrackPoint = {
  xPct: number;
  yPct: number;
};

type WindTrack = {
  start: TrackPoint;
  end: TrackPoint;
  rotate: number;
};

type FlyerPosition = TrackPoint & {
  rotate: number;
};

type FlyerBeatConfig = {
  zoneId: WindZoneId;
  forecastLabel: string;
};

const RHYTHM_FLYER_BEATS: readonly FlyerBeatConfig[] = [
  {
    zoneId: "right",
    forecastLabel: "右側騎樓",
  },
  {
    zoneId: "top",
    forecastLabel: "招牌上方",
  },
  {
    zoneId: "left",
    forecastLabel: "左側店門",
  },
  {
    zoneId: "bottom",
    forecastLabel: "排水溝邊",
  },
  {
    zoneId: "right",
    forecastLabel: "路燈旁",
  },
  {
    zoneId: "left",
    forecastLabel: "攤車後方",
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
  forecastLabel: beat.forecastLabel,
  zoneId: beat.zoneId,
  flyerLabel: String(index + 1).padStart(2, "0"),
}));

const WIND_TRACKS: Record<WindZoneId, WindTrack> = {
  right: {
    start: { xPct: 16, yPct: 48 },
    end: { xPct: 84, yPct: 48 },
    rotate: 8,
  },
  top: {
    start: { xPct: 50, yPct: 84 },
    end: { xPct: 50, yPct: 16 },
    rotate: -6,
  },
  left: {
    start: { xPct: 84, yPct: 52 },
    end: { xPct: 16, yPct: 52 },
    rotate: -8,
  },
  bottom: {
    start: { xPct: 52, yPct: 16 },
    end: { xPct: 52, yPct: 84 },
    rotate: 6,
  },
};

const FLYER_TRAVEL_DURATION_MS = 820;
const FLYER_NEXT_DELAY_MS = 180;
const MIN_CAUGHT_FLYERS_TO_PASS = 3;

const flyerFlutter = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  30% { transform: translateY(-5px) rotate(3deg); }
  62% { transform: translateY(2px) rotate(-4deg); }
`;

const windSweep = keyframes`
  0% { transform: translateX(-120%) skewX(-8deg); opacity: 0; }
  22% { opacity: 0.32; }
  100% { transform: translateX(120%) skewX(-8deg); opacity: 0; }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
`;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getFlyerPosition(zoneId: WindZoneId, progress: number): FlyerPosition {
  const safeProgress = clampProgress(progress);
  const track = WIND_TRACKS[zoneId];

  return {
    xPct: track.start.xPct + (track.end.xPct - track.start.xPct) * safeProgress,
    yPct: track.start.yPct + (track.end.yPct - track.start.yPct) * safeProgress,
    rotate: track.rotate,
  };
}

function FlyerPaper({
  label,
  isCaught,
}: {
  label: string;
  isCaught: boolean;
}) {
  return (
    <Flex
      w="44px"
      h="58px"
      position="relative"
      align="center"
      justify="center"
      bgColor={isCaught ? "#DDE9DF" : "#FFF5D7"}
      border="2px solid rgba(116, 86, 60, 0.3)"
      boxShadow={isCaught ? "0 8px 18px rgba(64, 120, 83, 0.22)" : "0 11px 20px rgba(55, 41, 29, 0.2)"}
      animation={isCaught ? undefined : `${flyerFlutter} 720ms ease-in-out infinite`}
      transition="background-color 0.18s ease, box-shadow 0.18s ease"
    >
      <Box
        position="absolute"
        top="-2px"
        right="-2px"
        w="13px"
        h="13px"
        bgColor={isCaught ? "#B6D8C0" : "#F4D8A7"}
        borderLeft="2px solid rgba(116, 86, 60, 0.22)"
        borderBottom="2px solid rgba(116, 86, 60, 0.22)"
      />
      <Text color="#765640" fontSize="12px" fontWeight="900" lineHeight="1">
        {isCaught ? <FiCheck /> : label}
      </Text>
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
      h="62px"
      direction="column"
      align="center"
      justify="center"
      gap="2px"
      px="4px"
      py="6px"
      borderRadius="7px"
      border={isCurrent ? "2px solid #FF8A5B" : "1px solid rgba(105, 83, 62, 0.2)"}
      bgColor={isCaught ? "rgba(108, 177, 129, 0.22)" : isCurrent ? "#FFF3DF" : "rgba(255, 255, 255, 0.86)"}
      boxShadow={isCurrent ? "0 0 0 3px rgba(255,138,91,0.14)" : "none"}
      transition="background-color 0.18s ease, border 0.18s ease, box-shadow 0.18s ease"
      flexShrink={0}
    >
      <Text color="#6B503B" fontSize="9px" fontWeight="900" lineHeight="1">
        {index + 1}
      </Text>
      <Text color="#2E5C66" fontSize="18px" fontWeight="900" lineHeight="1">
        {isCaught ? <FiCheck /> : step.arrow}
      </Text>
      <Text
        color="#614938"
        fontSize="8px"
        fontWeight="800"
        lineHeight="1.1"
        textAlign="center"
      >
        {step.forecastLabel}
      </Text>
    </Flex>
  );
}

function MissCard({ missCount }: { missCount: number }) {
  const hasMissed = missCount > 0;

  return (
    <Flex
      w="44px"
      h="62px"
      direction="column"
      align="center"
      justify="center"
      gap="4px"
      px="5px"
      py="6px"
      borderRadius="7px"
      border={hasMissed ? "2px solid rgba(184, 101, 67, 0.72)" : "1px solid rgba(105, 83, 62, 0.2)"}
      bgColor={hasMissed ? "rgba(255, 231, 214, 0.92)" : "rgba(255, 255, 255, 0.7)"}
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

function TrackGuide({ zoneId }: { zoneId: WindZoneId }) {
  const track = WIND_TRACKS[zoneId];
  const isHorizontal = zoneId === "right" || zoneId === "left";
  const midX = (track.start.xPct + track.end.xPct) / 2;
  const midY = (track.start.yPct + track.end.yPct) / 2;

  return (
    <>
      <Box
        position="absolute"
        left={isHorizontal ? "12%" : `${track.start.xPct}%`}
        right={isHorizontal ? "12%" : undefined}
        top={isHorizontal ? `${track.start.yPct}%` : "12%"}
        bottom={isHorizontal ? undefined : "12%"}
        w={isHorizontal ? undefined : "2px"}
        h={isHorizontal ? "2px" : undefined}
        transform="translate(-1px, -1px)"
        bgColor="rgba(255,255,255,0.22)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        left={`${midX}%`}
        top={`${midY}%`}
        w="108px"
        h="116px"
        transform="translate(-50%, -50%)"
        border="2px dashed rgba(255, 245, 215, 0.48)"
        borderRadius="8px"
        boxShadow="0 0 0 1px rgba(55, 49, 43, 0.12)"
        pointerEvents="none"
      />
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
  const [runNonce, setRunNonce] = useState(0);

  const currentStep = WIND_STEPS[stepIndex];
  const caughtStepSet = useMemo(() => new Set(caughtStepIds), [caughtStepIds]);
  const caughtCount = caughtStepIds.length;
  const isComplete = flyerPhase === "complete";
  const activeBeatNumber = isComplete ? WIND_STEPS.length : stepIndex + 1;
  const flyerPosition = useMemo(
    () => getFlyerPosition(currentStep?.zoneId ?? "right", flyerProgress),
    [currentStep?.zoneId, flyerProgress],
  );
  const remainingPct = Math.max(0, Math.min(100, (1 - flyerProgress) * 100));
  const hasPassed = caughtCount >= MIN_CAUGHT_FLYERS_TO_PASS;

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
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / FLYER_TRAVEL_DURATION_MS);
      setFlyerProgress(nextProgress);

      if (nextProgress >= 1) {
        animationFrameRef.current = null;
        setMissCount((count) => count + 1);
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

  const handleCatchFlyer = useCallback(() => {
    if (!currentStep || flyerPhase !== "flying") return;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setFlyerPhase("caught");
    setCaughtStepIds((ids) => (ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]));

    advanceToNextFlyer(stepIndex);
  }, [advanceToNextFlyer, currentStep, flyerPhase, stepIndex]);

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
        bgImage={`linear-gradient(180deg, rgba(244,246,236,0.94), rgba(235,240,230,0.9)), url("${sceneImage}")`}
        bgSize="cover"
        backgroundPosition="center center"
        overflow="hidden"
      >
        <Flex w="100%" maxW="356px" direction="column" align="center" gap="10px">
          <Flex w="100%" align="center" justify="space-between" px="3px">
            <Text color="#4A382A" fontSize="12px" fontWeight="900">
              節拍 {activeBeatNumber}/{WIND_STEPS.length}
            </Text>
            <Text color="#4A382A" fontSize="12px" fontWeight="900">
              撿到 {caughtCount}/{WIND_STEPS.length}・目標 {MIN_CAUGHT_FLYERS_TO_PASS}
            </Text>
          </Flex>

          <Flex
            w="100%"
            minH="92px"
            position="relative"
            align="center"
            justify="center"
            px="10px"
            py="13px"
            bgColor="rgba(255, 247, 232, 0.9)"
          >
            <Flex gap="4px" align="center" justify="center">
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
            bgColor="#969696"
            boxShadow="0 14px 26px rgba(45, 43, 39, 0.12)"
          >
            <Box
              position="absolute"
              top="20%"
              left="-16%"
              w="132%"
              h="20px"
              bgColor="rgba(255,255,255,0.25)"
              filter="blur(8px)"
              animation={`${windSweep} 2100ms ease-in-out infinite`}
            />

            {!isComplete && currentStep ? <TrackGuide zoneId={currentStep.zoneId} /> : null}

            {!isComplete && currentStep ? (
              <Flex
                as="button"
                aria-label="撿起飛行中的傳單"
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
                cursor={flyerPhase === "flying" ? "pointer" : "default"}
                opacity={flyerPhase === "missed" ? 0.18 : 1}
                pointerEvents={flyerPhase === "flying" ? "auto" : "none"}
                touchAction="manipulation"
                zIndex={5}
                onClick={handleCatchFlyer}
                transition="opacity 0.18s ease"
              >
                <FlyerPaper label={currentStep.flyerLabel} isCaught={flyerPhase === "caught"} />
              </Flex>
            ) : null}

            <Flex
              position="absolute"
              left="10px"
              top="10px"
              minW="118px"
              direction="column"
              gap="5px"
              px="9px"
              py="7px"
              borderRadius="7px"
              bgColor="rgba(48, 51, 50, 0.72)"
              color="white"
              boxShadow="0 8px 18px rgba(40, 34, 28, 0.16)"
            >
              <Flex justify="space-between" gap="10px">
                <Text fontSize="11px" fontWeight="900">
                  判定
                </Text>
                <Text fontSize="11px" fontWeight="900">
                  {Math.ceil(remainingPct)}%
                </Text>
              </Flex>
              <Box h="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.26)" overflow="hidden">
                <Box
                  h="100%"
                  w={`${remainingPct}%`}
                  borderRadius="999px"
                  bgColor={remainingPct > 34 ? "#DFF6A8" : "#FFB36E"}
                  transition="width 0.08s linear"
                />
              </Box>
            </Flex>

            {isComplete ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={9}
                align="center"
                justify="center"
                p="18px"
                bgColor="rgba(39, 50, 48, 0.58)"
              >
                <Flex
                  w="min(292px, 100%)"
                  direction="column"
                  align="center"
                  gap="12px"
                  p="18px"
                  borderRadius="8px"
                  bgColor="#FFF8EA"
                  border="2px solid rgba(113, 85, 61, 0.24)"
                  boxShadow="0 18px 38px rgba(30, 24, 19, 0.28)"
                  animation={`${successFadeUp} 300ms ease both`}
                >
                  <Flex
                    w="46px"
                    h="46px"
                    borderRadius="999px"
                    align="center"
                    justify="center"
                    bgColor={hasPassed ? "#DDEEDB" : "#FFE2CF"}
                    color={hasPassed ? "#3C8055" : "#B86543"}
                    fontSize="25px"
                  >
                    {hasPassed ? <FiCheck /> : <FiRefreshCw />}
                  </Flex>
                  <Flex direction="column" align="center" gap="5px">
                    <Text color="#4A382A" fontSize="18px" fontWeight="900" textAlign="center">
                      {hasPassed ? "傳單撿回來了" : "再試一次"}
                    </Text>
                    <Text color="#715740" fontSize="13px" fontWeight="700" lineHeight="1.45" textAlign="center">
                      {hasPassed
                        ? `撿到 ${caughtCount}/${WIND_STEPS.length} 張，足夠把傳單收好。`
                        : `只撿到 ${caughtCount}/${WIND_STEPS.length} 張，至少要撿到 ${MIN_CAUGHT_FLYERS_TO_PASS} 張。`}
                    </Text>
                  </Flex>
                  <Flex
                    as="button"
                    w="100%"
                    h="42px"
                    align="center"
                    justify="center"
                    borderRadius="8px"
                    bgColor="#FF8A5B"
                    color="white"
                    fontSize="14px"
                    fontWeight="900"
                    boxShadow="0 8px 16px rgba(171, 82, 46, 0.24)"
                    cursor="pointer"
                    onClick={hasPassed ? onComplete : resetGame}
                  >
                    {hasPassed ? "回到街道" : "重新挑戰"}
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

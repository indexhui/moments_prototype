"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaFileLines } from "react-icons/fa6";
import {
  PhaserGoatRunnerCanvas,
  type GoatRunnerBreakthroughKind,
} from "@/components/game/events/PhaserGoatRunnerCanvas";
import { GOAT_INITIAL_WORK_PROGRESS } from "@/lib/game/goatSceneFlow";

type GoatDocumentRunnerProps = {
  variant: "metro" | "office";
  initialProgress: number;
  targetProgress: number;
  initialSeconds: number;
  onComplete: (result: { progress: number; secondsRemaining: number }) => void;
};

const feedbackPop = keyframes`
  0% { transform: translateY(8px) scale(0.72); opacity: 0; }
  42% { transform: translateY(-5px) scale(1.12); opacity: 1; }
  100% { transform: translateY(-18px) scale(1); opacity: 0; }
`;

const hudBump = keyframes`
  0% { transform: scale(1); }
  45% { transform: scale(1.16); box-shadow: 0 0 0 6px rgba(73,198,207,0.2); }
  100% { transform: scale(1); }
`;

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function GoatDocumentRunner({
  variant,
  initialProgress,
  targetProgress,
  initialSeconds,
  onComplete,
}: GoatDocumentRunnerProps) {
  const startingProgress = clampProgress(initialProgress);
  const startingSeconds = Math.max(1, Math.round(initialSeconds));
  const shouldShowTutorialOnEntry =
    variant === "metro" &&
    startingProgress === GOAT_INITIAL_WORK_PROGRESS &&
    targetProgress === 45;
  const [progress, setProgress] = useState(startingProgress);
  const [secondsRemaining, setSecondsRemaining] = useState(startingSeconds);
  const [combo, setCombo] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [rewardPulseNonce, setRewardPulseNonce] = useState(0);
  const [breakthroughNonce, setBreakthroughNonce] = useState(0);
  const [breakthroughKind, setBreakthroughKind] =
    useState<GoatRunnerBreakthroughKind>("rise");
  const [penaltyNonce, setPenaltyNonce] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
  const [hasStarted, setHasStarted] = useState(!shouldShowTutorialOnEntry);
  const [showControlHint, setShowControlHint] = useState(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setProgress(startingProgress);
    setSecondsRemaining(startingSeconds);
    setCombo(0);
    setIsFailed(false);
    setRewardPulseNonce(0);
    setBreakthroughNonce(0);
    setBreakthroughKind("rise");
    setPenaltyNonce(0);
    setHasStarted(!shouldShowTutorialOnEntry);
    hasCompletedRef.current = false;
  }, [shouldShowTutorialOnEntry, startingProgress, startingSeconds, targetProgress, variant]);

  useEffect(() => {
    if (!hasStarted || isFailed) {
      setShowControlHint(false);
      return;
    }
    setShowControlHint(true);
    const timer = window.setTimeout(() => setShowControlHint(false), 4200);
    return () => window.clearTimeout(timer);
  }, [hasStarted, isFailed, resetNonce, variant]);

  const handleStatsChange = useCallback(
    (stats: { progress: number; secondsRemaining: number }) => {
      setProgress(stats.progress);
      setSecondsRemaining(stats.secondsRemaining);
    },
    [],
  );
  const handleCollect = useCallback(() => {
    setRewardPulseNonce((current) => current + 1);
  }, []);
  const handleFocusCollect = useCallback(() => {
    setRewardPulseNonce((current) => current + 1);
  }, []);
  const handleBreakthrough = useCallback((kind: GoatRunnerBreakthroughKind) => {
    setBreakthroughKind(kind);
    setBreakthroughNonce((current) => current + 1);
  }, []);
  const handleBreak = useCallback(() => {
    setRewardPulseNonce((current) => current + 1);
  }, []);
  const handleRebound = useCallback((kind: GoatRunnerBreakthroughKind) => {
    setBreakthroughKind(kind);
    setRewardPulseNonce((current) => current + 1);
  }, []);
  const handlePenalty = useCallback(() => {
    setPenaltyNonce((current) => current + 1);
  }, []);
  const handleRunnerComplete = useCallback(
    (result: { progress: number; secondsRemaining: number }) => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      setProgress(result.progress);
      setSecondsRemaining(result.secondsRemaining);
      onCompleteRef.current(result);
    },
    [],
  );
  const handleRunnerFail = useCallback(() => {
    if (!hasCompletedRef.current) setIsFailed(true);
  }, []);

  const resetAttempt = () => {
    hasCompletedRef.current = false;
    setProgress(startingProgress);
    setSecondsRemaining(startingSeconds);
    setCombo(0);
    setIsFailed(false);
    setRewardPulseNonce(0);
    setBreakthroughNonce(0);
    setBreakthroughKind("rise");
    setPenaltyNonce(0);
    setResetNonce((current) => current + 1);
  };

  const landscapeImage =
    variant === "metro"
      ? "/images/428出圖/背景/捷運.png"
      : "/images/office/Office_Desk_Day.png";
  const documentsRemaining = Math.max(0, targetProgress - progress);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={12}
      direction="column"
      bgColor="#F5EBDD"
      touchAction="none"
    >
      <Flex
        h="56%"
        minH="0"
        position="relative"
        overflow="hidden"
        bgColor="#E7E4CF"
        borderBottom="4px solid #7D624A"
      >
        {hasStarted ? (
          <PhaserGoatRunnerCanvas
            variant={variant}
            initialProgress={startingProgress}
            targetProgress={targetProgress}
            initialSeconds={startingSeconds}
            resetNonce={resetNonce}
            onStatsChange={handleStatsChange}
            onCollect={handleCollect}
            onFocusCollect={handleFocusCollect}
            onBreakthrough={handleBreakthrough}
            onBreakthroughBreak={handleBreak}
            onRebound={handleRebound}
            onComboChange={setCombo}
            onPenalty={handlePenalty}
            onComplete={handleRunnerComplete}
            onFail={handleRunnerFail}
          />
        ) : null}

        <Flex
          position="absolute"
          left="18px"
          top="14px"
          right="18px"
          zIndex={20}
          alignItems="center"
          gap="10px"
          pointerEvents="none"
        >
          <Flex
            flex="1"
            h="12px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.82)"
            border="1px solid rgba(90,71,53,0.2)"
            overflow="hidden"
            boxShadow="0 4px 10px rgba(73,55,39,0.1)"
          >
            <Box
              h="100%"
              w={`${progress}%`}
              borderRadius="999px"
              bg="linear-gradient(90deg, #E2A85F 0%, #B97952 100%)"
              transition="width 130ms ease"
            />
          </Flex>
          <Text color="#654E3D" fontSize="15px" fontWeight="900" minW="44px" textAlign="right">
            {progress}%
          </Text>
          <Flex
            h="34px"
            minW="58px"
            px="10px"
            borderRadius="999px"
            bgColor={secondsRemaining <= 8 ? "#B85F53" : "#6C8067"}
            alignItems="center"
            justifyContent="center"
            boxShadow="0 5px 12px rgba(73,55,39,0.16)"
          >
            <Text color="white" fontSize="15px" fontWeight="900">
              {secondsRemaining}s
            </Text>
          </Flex>
        </Flex>

        <Flex
          key={`reward-hud-${rewardPulseNonce}`}
          position="absolute"
          top="62px"
          right="16px"
          zIndex={20}
          px="10px"
          py="6px"
          borderRadius="999px"
          bgColor="rgba(255,253,248,0.9)"
          border="1px solid rgba(117,86,60,0.18)"
          alignItems="center"
          gap="6px"
          pointerEvents="none"
          animation={rewardPulseNonce > 0 ? `${hudBump} 300ms ease-out` : undefined}
        >
          <FaFileLines color="#B97952" size={12} />
          <Text color="#765B46" fontSize="11px" fontWeight="900">
            還差 {documentsRemaining}%
          </Text>
        </Flex>

        {combo >= 2 ? (
          <Flex
            position="absolute"
            top="62px"
            left="16px"
            zIndex={20}
            px="11px"
            py="6px"
            borderRadius="999px"
            bgColor="rgba(101,78,61,0.88)"
            pointerEvents="none"
          >
            <Text color="#FFE2A7" fontSize="12px" fontWeight="900">
              COMBO ×{combo}
            </Text>
          </Flex>
        ) : null}

        {penaltyNonce > 0 ? (
          <Flex
            key={`penalty-${penaltyNonce}`}
            position="absolute"
            left="45%"
            top="36%"
            zIndex={23}
            px="12px"
            py="6px"
            borderRadius="999px"
            bgColor="#B85F53"
            animation={`${feedbackPop} 720ms ease-out both`}
            pointerEvents="none"
          >
            <Text color="white" fontSize="14px" fontWeight="900">
              -2s
            </Text>
          </Flex>
        ) : null}

        {breakthroughNonce > 0 ? (
          <Flex
            key={`breakthrough-${breakthroughNonce}`}
            position="absolute"
            left="18%"
            top="31%"
            zIndex={23}
            px="12px"
            py="6px"
            borderRadius="999px"
            bgColor="#287F88"
            border="2px solid #B6FFFF"
            animation={`${feedbackPop} 680ms ease-out both`}
            pointerEvents="none"
          >
            <Text color="#FFF8E8" fontSize="13px" fontWeight="900">
              {breakthroughKind === "slam" ? "向下重擊！" : "向上斜衝！"}
            </Text>
          </Flex>
        ) : null}

        {showControlHint && !isFailed ? (
          <Flex
            position="absolute"
            left="50%"
            bottom="12px"
            transform="translateX(-50%)"
            zIndex={20}
            px="11px"
            py="6px"
            borderRadius="999px"
            bgColor="rgba(72,55,42,0.72)"
            border="1px solid rgba(255,246,221,0.36)"
            pointerEvents="none"
          >
            <Text color="#FFF5DF" fontSize="10px" fontWeight="900" whiteSpace="nowrap">
              單點跳躍　雙點上半＝上衝　雙點下半＝下撞
            </Text>
          </Flex>
        ) : null}
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        overflow="hidden"
        bgImage={`linear-gradient(180deg, rgba(28,24,21,0.02), rgba(28,24,21,0.2)), url("${landscapeImage}")`}
        bgSize="cover"
        backgroundPosition={variant === "metro" ? "center center" : "center 42%"}
      />

      {!hasStarted ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={32}
          bgColor="rgba(45,35,28,0.66)"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          <Flex
            w="100%"
            maxW="344px"
            direction="column"
            gap="11px"
            p="19px"
            borderRadius="20px"
            bgColor="#FFFDF8"
            border="2px solid #D9B97A"
            boxShadow="0 18px 44px rgba(0,0,0,0.3)"
          >
            <Text color="#684E3C" fontSize="21px" fontWeight="900" textAlign="center">
              通勤路線衝刺
            </Text>
            <Flex direction="column" gap="7px">
              <Text color="#79614F" fontSize="13px" fontWeight="800" lineHeight="1.5">
                ● 點一下：一般跳躍，跟著文件與靈感路線前進
              </Text>
              <Text color="#287F88" fontSize="13px" fontWeight="900" lineHeight="1.5">
                ● 雙點畫面上半：向上斜衝，越過擋路高櫃
              </Text>
              <Text color="#9B682E" fontSize="13px" fontWeight="900" lineHeight="1.5">
                ● 雙點畫面下半：向下重擊，撞開黃色卡關
              </Text>
            </Flex>
            <Flex wrap="wrap" gap="6px">
              {[
                ["#E2A85F", "金色文件 +1%"],
                ["#49C6CF", "青色靈感 +3%"],
                ["#DCA84E", "黃色卡關：下撞"],
                ["#536B76", "藍灰高櫃：會卡住"],
              ].map(([color, label]) => (
                <Flex
                  key={label}
                  flex="1 1 46%"
                  minW="0"
                  h="30px"
                  px="8px"
                  borderRadius="9px"
                  bgColor="#F5EFE6"
                  alignItems="center"
                  gap="6px"
                >
                  <Box w="9px" h="9px" flexShrink={0} borderRadius="999px" bgColor={color} />
                  <Text color="#725A45" fontSize="10px" fontWeight="900" whiteSpace="nowrap">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
            <Text color="#287F88" fontSize="11px" fontWeight="800" textAlign="center">
              收集物與撞開的卡關，都會化成獎勵飛向右上角
            </Text>
            <Flex
              as="button"
              h="46px"
              borderRadius="999px"
              bgColor="#9D7859"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              aria-label="開始通勤路線衝刺"
              onClick={() => setHasStarted(true)}
            >
              <Text color="white" fontSize="16px" fontWeight="900">
                開始衝刺
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isFailed ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={30}
          bgColor="rgba(32,26,22,0.72)"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          <Flex
            w="100%"
            maxW="320px"
            direction="column"
            gap="14px"
            p="22px"
            borderRadius="18px"
            bgColor="#FFFDF8"
            boxShadow="0 18px 44px rgba(0,0,0,0.3)"
            textAlign="center"
          >
            <Text color="#6D523D" fontSize="20px" fontWeight="900">
              時間到了
            </Text>
            <Text color="#8A7563" fontSize="14px" fontWeight="700" lineHeight="1.55">
              高櫃會真的卡住路線：雙點上半向上斜衝；黃色卡關則雙點下半向下撞開。
            </Text>
            <Flex
              as="button"
              h="46px"
              borderRadius="999px"
              bgColor="#9D7859"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={resetAttempt}
            >
              <Text color="white" fontSize="16px" fontWeight="900">
                再試一次
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

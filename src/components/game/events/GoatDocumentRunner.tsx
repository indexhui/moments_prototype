"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaFileLines } from "react-icons/fa6";
import {
  GOAT_RUNNER_DOCUMENT_PROGRESS_VALUE,
  GOAT_RUNNER_JUMP_REQUEST_EVENT,
  PhaserGoatRunnerCanvas,
} from "@/components/game/events/PhaserGoatRunnerCanvas";

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
  const [progress, setProgress] = useState(startingProgress);
  const [secondsRemaining, setSecondsRemaining] = useState(startingSeconds);
  const [combo, setCombo] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [collectNonce, setCollectNonce] = useState(0);
  const [penaltyNonce, setPenaltyNonce] = useState(0);
  const [resetNonce, setResetNonce] = useState(0);
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
    setCollectNonce(0);
    setPenaltyNonce(0);
    hasCompletedRef.current = false;
  }, [startingProgress, startingSeconds, targetProgress, variant]);

  const handleStatsChange = useCallback(
    (stats: { progress: number; secondsRemaining: number }) => {
      setProgress(stats.progress);
      setSecondsRemaining(stats.secondsRemaining);
    },
    [],
  );
  const handleCollect = useCallback(() => {
    setCollectNonce((current) => current + 1);
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
    setCollectNonce(0);
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
      onPointerDown={() => {
        if (!isFailed) {
          window.dispatchEvent(new Event(GOAT_RUNNER_JUMP_REQUEST_EVENT));
        }
      }}
    >
      <Flex
        h="56%"
        minH="0"
        position="relative"
        overflow="hidden"
        bgColor="#E7E4CF"
        borderBottom="4px solid #7D624A"
      >
        <PhaserGoatRunnerCanvas
          variant={variant}
          initialProgress={startingProgress}
          targetProgress={targetProgress}
          initialSeconds={startingSeconds}
          resetNonce={resetNonce}
          onStatsChange={handleStatsChange}
          onCollect={handleCollect}
          onComboChange={setCombo}
          onPenalty={handlePenalty}
          onComplete={handleRunnerComplete}
          onFail={handleRunnerFail}
        />

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
        >
          <FaFileLines color="#B97952" size={12} />
          <Text color="#765B46" fontSize="11px" fontWeight="900">
            還差 {documentsRemaining} 份
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

        {collectNonce > 0 ? (
          <Flex
            key={`collect-${collectNonce}`}
            position="absolute"
            left="27%"
            top="44%"
            zIndex={22}
            px="10px"
            py="5px"
            borderRadius="999px"
            bgColor="#FFF6D7"
            border="1px solid #E2A85F"
            animation={`${feedbackPop} 600ms ease-out both`}
            pointerEvents="none"
          >
            <Text color="#9B633F" fontSize="12px" fontWeight="900">
              +{GOAT_RUNNER_DOCUMENT_PROGRESS_VALUE}%
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
              避開突發工作，沿著文件軌跡掌握跳躍時機。
            </Text>
            <Flex
              as="button"
              h="46px"
              borderRadius="999px"
              bgColor="#9D7859"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onPointerDown={(event) => event.stopPropagation()}
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

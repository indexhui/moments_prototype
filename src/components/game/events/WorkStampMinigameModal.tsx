"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw } from "react-icons/fi";

const GAME_BG = "#8888A8";
const MACHINE_BG = "#9594AF";
const DOC_FRAME_BG = "#F5F3F0";
const DOC_LINE_BG = "#C8C8C8";
const DOC_BLOCK_BG = "#D9D9D9";
const APPROVAL_BOX_BG = "#D4D4D4";
const APPROVED_BG = "#A27F5D";
const STAMP_START_OVERLAY_BG = "rgba(38, 138, 137, 0.88)";
const DOC_WIDTH = 188;
const DOC_HEIGHT = 290;
const APPROVAL_BOX_WIDTH = 84;
const TOTAL_DOCS = 5;
const STAMP_ZONE_WIDTH = 112;
const START_BANNER_DURATION_MS = 1000;
const MAX_SCORE_PER_DOC = 100;
const APPROVAL_BOX_HEIGHT = 36;
const APPROVAL_BOX_BOTTOM = 12;
const DOC_ENTRY_DURATION_MS = 340;
const DOC_GLIDE_DURATION_MS = 860;
const DOC_EXIT_DURATION_MS = 540;
const DOC_STAGGER_MS = 1460;

const floatInBoard = keyframes`
  0% { opacity: 0; transform: translateY(14px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const successFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
`;

const startBannerFade = keyframes`
  0% { opacity: 0; }
  18% { opacity: 1; }
  100% { opacity: 0; }
`;

const judgmentFloat = keyframes`
  0% { opacity: 0; transform: translate(-50%, 8px); }
  18% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -10px); }
`;

const successCoverTop = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(0); }
`;

const successCoverBottom = keyframes`
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
`;

type GamePhase = "idle" | "running" | "result";

type StampDoc = {
  id: string;
  sequenceIndex: number;
  stamped: boolean;
  stampOffsetX: number | null;
  stampOffsetY: number | null;
  score: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function easeInCubic(progress: number) {
  return progress ** 3;
}

function easeInOutSine(progress: number) {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
}

function getSpeedRhythmMultiplier(progress: number) {
  const primaryPulse = Math.sin(progress * Math.PI * 4);
  const secondaryPulse = Math.sin(progress * Math.PI * 10);
  return clamp(1 + primaryPulse * 0.1 + secondaryPulse * 0.04, 0.88, 1.16);
}

function StampSeal({
  tone = "paper",
  scale = 1,
}: {
  tone?: "paper" | "success";
  scale?: number;
}) {
  const isSuccess = tone === "success";
  const rimColor = isSuccess ? "#6DBA73" : "#F06B68";
  const coreColor = isSuccess ? "#6DBA73" : "#F06B68";
  const fillColor = isSuccess ? "rgba(109,186,115,0.08)" : "rgba(240,107,104,0.08)";
  const size = 42 * scale;

  return (
    <Flex
      position="relative"
      w={`${size}px`}
      h={`${size}px`}
      align="center"
      justify="center"
      borderRadius="999px"
      border={`4px solid ${rimColor}`}
      bgColor={fillColor}
    >
      <Box position="absolute" inset="0" borderRadius="999px" border={`2px solid ${rimColor}`} opacity={tone === "success" ? 0.7 : 0.55} />
      <Box
        w={`${size * 0.48}px`}
        h={`${size * 0.48}px`}
        borderRadius="999px"
        border={`3px solid ${coreColor}`}
      />
    </Flex>
  );
}

const WorkStampDocument = forwardRef<HTMLDivElement, {
  doc: StampDoc;
  stampLocalTop: number;
}>(function WorkStampDocument({
  doc,
  stampLocalTop,
}, ref) {
  return (
    <Flex
      ref={ref}
      position="absolute"
      left="0"
      top="50%"
      w={`${DOC_WIDTH}px`}
      h={`${DOC_HEIGHT}px`}
      transform={`translate3d(${DOC_WIDTH + 72}px, -50%, 0)`}
      direction="column"
      bgColor={DOC_FRAME_BG}
      px="10px"
      pt="16px"
      pb="12px"
      boxShadow="0 2px 0 rgba(0,0,0,0.08)"
      overflow="hidden"
    >
      <Flex direction="column" gap="9px">
        <Box h="8px" bgColor={DOC_LINE_BG} />
        <Box h="8px" w="88%" bgColor={DOC_LINE_BG} />
        <Box h="8px" w="84%" bgColor={DOC_LINE_BG} />
      </Flex>

      <Flex mt="18px" gap="8px">
        <Box flex="1" h="66px" bgColor={DOC_BLOCK_BG} />
        <Box flex="1" h="66px" bgColor={DOC_BLOCK_BG} />
      </Flex>

      <Box
        position="absolute"
        right="16px"
        bottom="12px"
        w={`${APPROVAL_BOX_WIDTH}px`}
        h="36px"
        borderRadius="4px"
        border="1.5px solid rgba(122,118,118,0.45)"
        bgColor={
          doc.stamped
            ? doc.score > 0
              ? "rgba(109,186,115,0.18)"
              : "rgba(240,107,104,0.18)"
            : APPROVAL_BOX_BG
        }
        overflow="visible"
      />
      {doc.stamped && doc.stampOffsetX !== null ? (
        <Flex
          position="absolute"
          left={`${doc.stampOffsetX}px`}
          top={`${doc.stampOffsetY ?? stampLocalTop}px`}
          transform="translate(-50%, -50%)"
          opacity={0.95}
          pointerEvents="none"
        >
          <StampSeal tone={doc.score > 0 ? "success" : "paper"} />
        </Flex>
      ) : null}
    </Flex>
  );
});

function buildInitialDocs(stageWidth: number): StampDoc[] {
  return Array.from({ length: TOTAL_DOCS }, (_, index) => ({
    id: `doc-${index}`,
    sequenceIndex: index,
    stamped: false,
    stampOffsetX: null,
    stampOffsetY: null,
    score: 0,
  }));
}

function getTotalRunDurationMs() {
  return (TOTAL_DOCS - 1) * DOC_STAGGER_MS + DOC_ENTRY_DURATION_MS + DOC_GLIDE_DURATION_MS + DOC_EXIT_DURATION_MS;
}

function getDocLeftForElapsed(params: {
  elapsedMs: number;
  sequenceIndex: number;
  stageWidth: number;
  stampCenterX: number;
}) {
  const { elapsedMs, sequenceIndex, stageWidth, stampCenterX } = params;
  const startMs = sequenceIndex * DOC_STAGGER_MS;
  const localElapsedMs = elapsedMs - startMs;

  if (localElapsedMs < 0) return null;

  const targetApprovalCenterLeft = stampCenterX - (DOC_WIDTH - 16 - APPROVAL_BOX_WIDTH / 2);
  const entryStartLeft = stageWidth + DOC_WIDTH + 36;
  const glideStartLeft = targetApprovalCenterLeft + 126;
  const glideEndLeft = targetApprovalCenterLeft - 108;
  const exitEndLeft = -DOC_WIDTH - 108;

  if (localElapsedMs <= DOC_ENTRY_DURATION_MS) {
    const progress = easeOutCubic(localElapsedMs / DOC_ENTRY_DURATION_MS);
    return entryStartLeft + (glideStartLeft - entryStartLeft) * progress;
  }

  if (localElapsedMs <= DOC_ENTRY_DURATION_MS + DOC_GLIDE_DURATION_MS) {
    const progress = easeInOutSine((localElapsedMs - DOC_ENTRY_DURATION_MS) / DOC_GLIDE_DURATION_MS);
    const rhythmOffset = Math.sin(progress * Math.PI * 3) * 10;
    return glideStartLeft + (glideEndLeft - glideStartLeft) * progress + rhythmOffset;
  }

  if (localElapsedMs <= DOC_ENTRY_DURATION_MS + DOC_GLIDE_DURATION_MS + DOC_EXIT_DURATION_MS) {
    const progress = easeInCubic(
      (localElapsedMs - DOC_ENTRY_DURATION_MS - DOC_GLIDE_DURATION_MS) / DOC_EXIT_DURATION_MS,
    );
    return glideEndLeft + (exitEndLeft - glideEndLeft) * progress;
  }

  return null;
}

export function WorkStampMinigameModal({
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
  const boardRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const docNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const stampResetTimerRef = useRef<number | null>(null);
  const startBannerTimerRef = useRef<number | null>(null);
  const judgmentTimerRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);
  const solvedNotifiedRef = useRef(false);

  const [boardWidth, setBoardWidth] = useState(0);
  const [stageWidth, setStageWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isIntroOpen, setIsIntroOpen] = useState(true);
  const [isStamping, setIsStamping] = useState(false);
  const [isStartBannerVisible, setIsStartBannerVisible] = useState(true);
  const [docs, setDocs] = useState<StampDoc[]>([]);
  const [judgmentNonce, setJudgmentNonce] = useState(0);
  const [judgmentText, setJudgmentText] = useState<string | null>(null);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;
    const updateWidth = () => setBoardWidth(boardElement.getBoundingClientRect().width);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(boardElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stageElement = stageRef.current;
    if (!stageElement) return;
    const updateSize = () => {
      const rect = stageElement.getBoundingClientRect();
      setStageWidth(rect.width);
      setStageHeight(rect.height);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stageElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntroOpen || !isStartBannerVisible || stageWidth <= 0) return;
    if (startBannerTimerRef.current !== null) window.clearTimeout(startBannerTimerRef.current);
    startBannerTimerRef.current = window.setTimeout(() => {
      setIsStartBannerVisible(false);
      setDocs(buildInitialDocs(stageWidth));
      elapsedMsRef.current = 0;
      setPhase("running");
      previousTimestampRef.current = null;
    }, START_BANNER_DURATION_MS);
    return () => {
      if (startBannerTimerRef.current !== null) {
        window.clearTimeout(startBannerTimerRef.current);
        startBannerTimerRef.current = null;
      }
    };
  }, [isIntroOpen, isStartBannerVisible, stageWidth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onSkip();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  useEffect(() => {
    if (phase !== "running") return;
    const activeStampCenterX = boardWidth / 2;
    const animate = (timestamp: number) => {
      const previous = previousTimestampRef.current ?? timestamp;
      const deltaMs = timestamp - previous;
      previousTimestampRef.current = timestamp;
      const totalDurationMs = getTotalRunDurationMs();
      const overallProgress = totalDurationMs > 0 ? clamp(elapsedMsRef.current / totalDurationMs, 0, 1) : 0;
      elapsedMsRef.current += deltaMs * getSpeedRhythmMultiplier(overallProgress);

      docs.forEach((doc) => {
        const left = getDocLeftForElapsed({
          elapsedMs: elapsedMsRef.current,
          sequenceIndex: doc.sequenceIndex,
          stageWidth,
          stampCenterX: activeStampCenterX,
        });
        const node = docNodeRefs.current[doc.id];
        if (!node) return;
        node.style.opacity = left === null ? "0" : "1";
        node.style.transform = `translate3d(${left ?? -DOC_WIDTH - 108}px, -50%, 0)`;
      });

      if (elapsedMsRef.current >= totalDurationMs) {
        setPhase("result");
        return;
      }
      animationFrameRef.current = window.requestAnimationFrame(animate);
    };
    animationFrameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [boardWidth, docs, phase, stageWidth]);

  useEffect(() => {
    if (phase !== "result") return;
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, 3400);
    return () => window.clearTimeout(completeTimer);
  }, [onComplete, onSolved, phase]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      if (stampResetTimerRef.current !== null) window.clearTimeout(stampResetTimerRef.current);
      if (startBannerTimerRef.current !== null) window.clearTimeout(startBannerTimerRef.current);
      if (judgmentTimerRef.current !== null) window.clearTimeout(judgmentTimerRef.current);
    };
  }, []);

  useEffect(() => {
    docs.forEach((doc) => {
      const node = docNodeRefs.current[doc.id];
      if (!node) return;
      node.style.opacity = "0";
      node.style.transform = `translate3d(${stageWidth + DOC_WIDTH + 36}px, -50%, 0)`;
    });
  }, [docs, stageWidth]);

  const stampZoneLeft = useMemo(() => boardWidth / 2 - STAMP_ZONE_WIDTH / 2, [boardWidth]);
  const stampCenterX = useMemo(() => stampZoneLeft + STAMP_ZONE_WIDTH / 2, [stampZoneLeft]);
  const docTopY = useMemo(() => stageHeight / 2 - DOC_HEIGHT / 2, [stageHeight]);
  const approvalBoxCenterY = useMemo(
    () => docTopY + DOC_HEIGHT - APPROVAL_BOX_BOTTOM - APPROVAL_BOX_HEIGHT / 2,
    [docTopY],
  );
  const stampLocalTop = useMemo(() => approvalBoxCenterY - docTopY, [approvalBoxCenterY, docTopY]);
  const totalRunDurationMs = useMemo(() => getTotalRunDurationMs(), []);
  const totalScore = useMemo(() => docs.reduce((sum, doc) => sum + doc.score, 0), [docs]);
  const stampedCount = useMemo(() => docs.filter((doc) => doc.score > 0).length, [docs]);
  const scoreLabel = `${totalScore} 分`;
  const resultTitle =
    totalScore >= TOTAL_DOCS * 85 ? "總算跑完簽核了" : totalScore >= TOTAL_DOCS * 55 ? "大部分都蓋到了" : "今天跑簽有點手忙腳亂";
  const resultBody =
    totalScore >= TOTAL_DOCS * 85
      ? "文件順順送出去，今天總算能安心收尾。"
      : totalScore >= TOTAL_DOCS * 55
      ? "還算有撐住節奏，但中間還是漏了幾份。"
        : "簽核節奏太快了，改天得再更俐落一點。";

  const triggerMissFeedback = () => {
    setJudgmentNonce((prev) => prev + 1);
    setJudgmentText("MISS");
    if (judgmentTimerRef.current !== null) window.clearTimeout(judgmentTimerRef.current);
    judgmentTimerRef.current = window.setTimeout(() => setJudgmentText(null), 520);
  };

  const triggerJudgmentFeedback = (score: number) => {
    if (judgmentTimerRef.current !== null) window.clearTimeout(judgmentTimerRef.current);
    setJudgmentNonce((prev) => prev + 1);
    if (score >= 85) {
      setJudgmentText("PERFECT");
      judgmentTimerRef.current = window.setTimeout(() => setJudgmentText(null), 520);
      return;
    }
    if (score >= 55) {
      setJudgmentText("GOOD");
      judgmentTimerRef.current = window.setTimeout(() => setJudgmentText(null), 520);
      return;
    }
    if (score > 0) {
      setJudgmentText("OK");
      judgmentTimerRef.current = window.setTimeout(() => setJudgmentText(null), 520);
      return;
    }
    setJudgmentText("MISS");
    judgmentTimerRef.current = window.setTimeout(() => setJudgmentText(null), 520);
  };

  const resetGame = () => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    previousTimestampRef.current = null;
    solvedNotifiedRef.current = false;
    setPhase("idle");
    setIsIntroOpen(true);
    setIsStartBannerVisible(true);
    setDocs([]);
    elapsedMsRef.current = 0;
    setIsStamping(false);
    setJudgmentText(null);
    Object.values(docNodeRefs.current).forEach((node) => {
      if (!node) return;
      node.style.opacity = "0";
      node.style.transform = `translate3d(${stageWidth + DOC_WIDTH + 36}px, -50%, 0)`;
    });
    if (judgmentTimerRef.current !== null) {
      window.clearTimeout(judgmentTimerRef.current);
      judgmentTimerRef.current = null;
    }
  };

  const handleStamp = () => {
    if (phase !== "running") return;
    setIsStamping(true);
    if (stampResetTimerRef.current !== null) window.clearTimeout(stampResetTimerRef.current);
    stampResetTimerRef.current = window.setTimeout(() => setIsStamping(false), 220);

    const target = docs.find((doc) => {
      const renderedLeft = getDocLeftForElapsed({
        elapsedMs: elapsedMsRef.current,
        sequenceIndex: doc.sequenceIndex,
        stageWidth,
        stampCenterX,
      });
      if (renderedLeft === null) return false;
      return stampCenterX >= renderedLeft && stampCenterX <= renderedLeft + DOC_WIDTH;
    });
    if (!target) {
      triggerMissFeedback();
      return;
    }

    const renderedLeft =
      getDocLeftForElapsed({
        elapsedMs: elapsedMsRef.current,
        sequenceIndex: target.sequenceIndex,
        stageWidth,
        stampCenterX,
      }) ?? 0;
    const approvalBoxLeft = renderedLeft + DOC_WIDTH - 16 - APPROVAL_BOX_WIDTH;
    const approvalBoxRight = approvalBoxLeft + APPROVAL_BOX_WIDTH;
    const approvalBoxCenterX = approvalBoxLeft + APPROVAL_BOX_WIDTH / 2;
    const isInApprovalBox = stampCenterX >= approvalBoxLeft && stampCenterX <= approvalBoxRight;
    const distance = Math.abs(approvalBoxCenterX - stampCenterX);
    const scoreRatio = isInApprovalBox
      ? clamp(1 - distance / (APPROVAL_BOX_WIDTH * 0.5), 0, 1)
      : 0;
    const appliedScore = Math.round(scoreRatio * MAX_SCORE_PER_DOC);
    const stampOffsetX = clamp(stampCenterX - renderedLeft, 18, DOC_WIDTH - 18);
    const stampOffsetY = clamp(approvalBoxCenterY - docTopY, 18, DOC_HEIGHT - 18);

    setDocs((current) =>
      current.map((doc) =>
        doc.id === target.id
          ? {
              ...doc,
              stamped: true,
              stampOffsetX,
              stampOffsetY,
              score: appliedScore,
            }
          : doc,
      ),
    );

    triggerJudgmentFeedback(appliedScore);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={70} bgColor={GAME_BG}>
      <Flex w="100%" direction="column" overflow="hidden" bgColor={GAME_BG}>
        <Flex position="relative" px="16px" pt="16px" justify="space-between" align="center">
          <Flex
            as="button"
            onClick={resetGame}
            w="34px"
            h="34px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.86)"
            align="center"
            justify="center"
            color="#7C624B"
          >
            <FiRefreshCw size={16} />
          </Flex>
          <Flex justify="flex-end" gap="8px">
            <Flex
              as="button"
              onClick={() => setIsHintOpen(true)}
              minW="60px"
              h="34px"
              px="12px"
              borderRadius="999px"
              bgColor="rgba(46,36,30,0.24)"
              align="center"
              justify="center"
              color="white"
              fontSize="12px"
              fontWeight="700"
            >
              提示
            </Flex>
            <Flex
              as="button"
              onClick={onSkip}
              minW="72px"
              h="34px"
              px="12px"
              borderRadius="999px"
              bgColor="rgba(46,36,30,0.24)"
              align="center"
              justify="center"
              color="white"
              fontSize="12px"
              fontWeight="700"
            >
              先放著
            </Flex>
          </Flex>
        </Flex>

        <Flex flex="1" px="16px" pb="16px">
          <Flex
            ref={boardRef}
            position="relative"
            flex="1"
            minH="0"
            borderRadius="0"
            bgColor={MACHINE_BG}
            overflow="hidden"
            animation={`${floatInBoard} 220ms ease both`}
            onPointerDown={handleStamp}
          >
            <Flex position="absolute" top="16px" left="0" right="0" zIndex={4} justify="center" pointerEvents="none">
              <Text color="white" fontSize="18px" fontWeight="800">
                點擊螢幕來蓋印章
              </Text>
            </Flex>

            <Flex position="absolute" inset="72px 18px 54px" direction="column">
              <Flex ref={stageRef} position="relative" flex="1" bgColor={MACHINE_BG} overflow="hidden">
                {docs.map((doc) => (
                  <WorkStampDocument
                    key={doc.id}
                    doc={doc}
                    stampLocalTop={stampLocalTop}
                    ref={(node) => {
                      docNodeRefs.current[doc.id] = node;
                    }}
                  />
                ))}

                {isStartBannerVisible ? (
                  <Flex
                    position="absolute"
                    left="0"
                    right="0"
                    top="50%"
                    h="146px"
                    transform="translateY(-50%)"
                    bgColor={STAMP_START_OVERLAY_BG}
                    color="white"
                    align="center"
                    justify="center"
                    fontSize="32px"
                    fontStyle="italic"
                    fontWeight="800"
                    letterSpacing="2px"
                    animation={`${startBannerFade} ${START_BANNER_DURATION_MS}ms ease forwards`}
                    pointerEvents="none"
                  >
                    START
                  </Flex>
                ) : null}

                {judgmentText ? (
                  <Flex
                    key={`judgment-${judgmentNonce}`}
                    position="absolute"
                    left="50%"
                    top="96px"
                    transform="translateX(-50%)"
                    align="center"
                    color="#FFFFFF"
                    animation={`${judgmentFloat} 520ms ease forwards`}
                    pointerEvents="none"
                  >
                    <Text
                      fontSize="24px"
                      fontWeight="900"
                      letterSpacing="1px"
                      color={
                        judgmentText === "PERFECT"
                          ? "#C8FFD0"
                          : judgmentText === "GOOD"
                            ? "#EAF7FF"
                            : judgmentText === "OK"
                              ? "#FFF4C7"
                              : "#FFD0D0"
                      }
                    >
                      {judgmentText}
                    </Text>
                  </Flex>
                ) : null}

              </Flex>
            </Flex>

            <Flex
              position="absolute"
              right="16px"
              bottom="14px"
              zIndex={5}
              px="10px"
              py="6px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.12)"
              color="white"
              fontSize="11px"
              fontWeight="700"
              direction="column"
              align="center"
              pointerEvents="none"
            >
              分數 {scoreLabel}
              <Text color="rgba(255,255,255,0.8)" fontSize="10px" fontWeight="600">
                命中 {stampedCount}/{TOTAL_DOCS} 份
              </Text>
            </Flex>

            {phase === "result" ? (
              <Flex position="absolute" inset="0" zIndex={50} pointerEvents="none">
                <Box position="absolute" top="0" left="0" right="0" h="50%" bgColor={APPROVED_BG} animation={`${successCoverTop} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
                <Box position="absolute" bottom="0" left="0" right="0" h="50%" bgColor={APPROVED_BG} animation={`${successCoverBottom} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
                <Flex position="absolute" inset="0" align="center" justify="center">
                  <Flex
                    position="absolute"
                    direction="column"
                    align="center"
                    gap="8px"
                    animation={`${successFadeUp} 260ms ease 320ms both, ${successFadeOut} 240ms ease 960ms forwards`}
                  >
                    <Text color="white" fontSize="20px" fontWeight="800">
                      {resultTitle}
                    </Text>
                    <Text color="rgba(255,255,255,0.84)" fontSize="13px" fontWeight="700">
                      {resultBody}
                    </Text>
                  </Flex>
                  <Flex direction="column" align="center" gap="6px" animation={`${successFadeUp} 260ms ease 2220ms both`}>
                    <StampSeal tone="success" scale={1.3} />
                    <Text color="rgba(255,255,255,0.92)" fontSize="16px" fontWeight="800">
                      本次得分
                    </Text>
                    <Text color="#FFF1D9" fontSize="20px" fontWeight="800">
                      {scoreLabel}
                    </Text>
                    <Text color="rgba(255,255,255,0.82)" fontSize="12px" fontWeight="700">
                      命中 {stampedCount}/{TOTAL_DOCS} 份
                    </Text>
                    <Text color="rgba(255,255,255,0.92)" fontSize="14px" fontWeight="800">
                      小遊戲獎勵
                    </Text>
                    <Text color="#FFF1D9" fontSize="18px" fontWeight="800">
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
        </Flex>

        {isHintOpen ? (
          <Flex position="absolute" inset="0" zIndex={80} bgColor="rgba(18,14,12,0.42)" align="center" justify="center" p="24px">
            <Flex
              w="100%"
              maxW="300px"
              minH="300px"
              borderRadius="8px"
              bgColor="#F7EFE2"
              boxShadow="0 14px 28px rgba(0,0,0,0.22)"
              direction="column"
              overflow="hidden"
            >
              <Flex px="16px" pt="16px" pb="8px" direction="column" gap="12px" flex="1">
                <Text color="#6D5443" fontSize="18px" fontWeight="800">
                  提示
                </Text>
                <Text color="#7B6352" fontSize="14px" lineHeight="1.8">
                  一開始會先出現滿版 START 橫條，淡入後自動消失；之後 5 份文件會持續由右往左移動。
                </Text>
                <Text color="#7B6352" fontSize="14px" lineHeight="1.8">
                  印章固定蓋在畫面中央，點擊後才會落章；同一份文件在離開前都能重蓋調整，最後採用當下章位分數。整局約 {totalRunDurationMs > 0 ? (totalRunDurationMs / 1000).toFixed(1) : "--"} 秒。
                </Text>
              </Flex>
              <Flex px="16px" pb="16px" pt="8px" justify="flex-end">
                <Flex
                  as="button"
                  onClick={() => setIsHintOpen(false)}
                  minW="68px"
                  h="34px"
                  px="12px"
                  borderRadius="999px"
                  bgColor="#8E6D52"
                  align="center"
                  justify="center"
                  color="white"
                  fontSize="12px"
                  fontWeight="700"
                >
                  關閉
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}

        {isIntroOpen ? (
          <Flex position="absolute" inset="0" zIndex={90} bgColor="rgba(18,14,12,0.48)" align="center" justify="center" p="24px">
            <Flex
              w="100%"
              maxW="320px"
              borderRadius="10px"
              bgColor="#F7EFE2"
              boxShadow="0 14px 28px rgba(0,0,0,0.22)"
              direction="column"
              overflow="hidden"
            >
              <Image
                src="/images/office/mini_game/stamp_example.jpg"
                alt="stamp example"
                w="100%"
                h="220px"
                objectFit="cover"
              />
              <Flex px="18px" pt="18px" pb="10px" direction="column" gap="10px">
                <Text color="#6D5443" fontSize="18px" fontWeight="800">
                  蓋章說明
                </Text>
                <Text color="#7B6352" fontSize="14px" lineHeight="1.8">
                  當文件蓋章區出現在螢幕中央，點下去！
                </Text>
                <Text color="#7B6352" fontSize="13px" lineHeight="1.7">
                  章會固定落在畫面中央，抓準文件移動節奏就能拿到更高分。
                </Text>
              </Flex>
              <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
                <Flex
                  as="button"
                  onClick={() => setIsIntroOpen(false)}
                  minW="84px"
                  h="36px"
                  px="14px"
                  borderRadius="999px"
                  bgColor="#8E6D52"
                  align="center"
                  justify="center"
                  color="white"
                  fontSize="13px"
                  fontWeight="700"
                >
                  開始
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}

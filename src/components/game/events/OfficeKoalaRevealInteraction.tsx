"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaCamera, FaRegFileLines } from "react-icons/fa6";
import { IoArrowBack } from "react-icons/io5";

const COWORKER_IMAGE = "/images/428出圖/路人立繪/同事_找小麥.png";
const KOALA_IMAGE = "/images/animals/放視大賞 5/無尾熊替身.png";
const PAPER_DRAG_THRESHOLD_PX = 48;
const ANGLE_DRAG_DISTANCE_PX = 106;

const revealPulse = keyframes`
  0%, 100% { opacity: 0.48; transform: scale(0.96); }
  50% { opacity: 0.9; transform: scale(1.04); }
`;

const earPeek = keyframes`
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-4px) rotate(1deg); }
`;

const promptNudgeLeft = keyframes`
  0%, 100% { transform: translateX(5px); }
  50% { transform: translateX(-7px); }
`;

const foundPop = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

type RevealPaperDefinition = {
  id: string;
  label: string;
  code: string;
  left: string;
  top: string;
  rotate: number;
  accent: string;
};

const REVEAL_PAPERS: RevealPaperDefinition[] = [
  {
    id: "meeting",
    label: "會議資料",
    code: "MEETING / 03",
    left: "58%",
    top: "39%",
    rotate: -7,
    accent: "#D9A86C",
  },
  {
    id: "revision",
    label: "修改版",
    code: "REV. 12",
    left: "68%",
    top: "52%",
    rotate: 8,
    accent: "#8DB5AE",
  },
  {
    id: "approval",
    label: "待簽核",
    code: "URGENT",
    left: "39%",
    top: "56%",
    rotate: -4,
    accent: "#D98F84",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function RevealPaper({
  paper,
  onCleared,
}: {
  paper: RevealPaperDefinition;
  onCleared: (paperId: string) => void;
}) {
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const clearPaper = (directionX = Number.parseFloat(paper.left) < 50 ? -1 : 1) => {
    if (isClearing) return;
    setIsClearing(true);
    setOffset({ x: directionX * 190, y: 28 });
    clearTimerRef.current = setTimeout(() => {
      onCleared(paper.id);
      clearTimerRef.current = null;
    }, 190);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isClearing) return;
    event.preventDefault();
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || isClearing) return;
    event.preventDefault();
    setOffset({
      x: clamp(event.clientX - start.x, -170, 170),
      y: clamp(event.clientY - start.y, -120, 150),
    });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || isClearing) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    dragStartRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (Math.hypot(deltaX, deltaY) >= PAPER_DRAG_THRESHOLD_PX) {
      clearPaper(deltaX === 0 ? 1 : Math.sign(deltaX));
      return;
    }
    setOffset({ x: 0, y: 0 });
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    clearPaper();
  };

  return (
    <Flex
      role="button"
      tabIndex={0}
      aria-label={`移開${paper.label}`}
      position="absolute"
      left={paper.left}
      top={paper.top}
      zIndex={7}
      w="104px"
      h="128px"
      direction="column"
      justifyContent="space-between"
      p="10px"
      borderRadius="5px"
      border="1px solid rgba(125, 91, 61, 0.32)"
      bgColor="#FFF9ED"
      boxShadow="0 10px 22px rgba(68, 45, 29, 0.24)"
      cursor={isClearing ? "default" : "grab"}
      touchAction="none"
      userSelect="none"
      opacity={isClearing ? 0 : 1}
      transform={`translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${paper.rotate}deg)`}
      transition={
        isClearing || dragStartRef.current === null
          ? "transform 190ms ease, opacity 170ms ease"
          : "none"
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
      _focusVisible={{ outline: "3px solid rgba(255, 235, 173, 0.95)" }}
      _active={{ cursor: "grabbing" }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <FaRegFileLines color="#8B6A4E" size={18} />
        <Flex w="42px" h="7px" borderRadius="999px" bgColor={paper.accent} />
      </Flex>
      <Flex direction="column" gap="6px">
        <Text color="#6B513C" fontSize="13px" fontWeight="900" lineHeight="1.2">
          {paper.label}
        </Text>
        <Text color="#9A826B" fontSize="9px" fontWeight="800" letterSpacing="0.08em">
          {paper.code}
        </Text>
        <Flex direction="column" gap="4px">
          <Flex h="3px" w="100%" borderRadius="999px" bgColor="rgba(127,105,84,0.2)" />
          <Flex h="3px" w="82%" borderRadius="999px" bgColor="rgba(127,105,84,0.18)" />
          <Flex h="3px" w="90%" borderRadius="999px" bgColor="rgba(127,105,84,0.18)" />
        </Flex>
      </Flex>
    </Flex>
  );
}

export function OfficeKoalaRevealInteraction({ onComplete }: { onComplete: () => void }) {
  const angleDragRef = useRef<{ startX: number; startProgress: number } | null>(null);
  const angleMovedRef = useRef(false);
  const [clearedPaperIds, setClearedPaperIds] = useState<string[]>([]);
  const [angleProgress, setAngleProgress] = useState(0);
  const [isAngleAligned, setIsAngleAligned] = useState(false);
  const areDocumentsCleared = clearedPaperIds.length >= REVEAL_PAPERS.length;
  const phaseLabel = isAngleAligned
    ? "找到了！"
    : areDocumentsCleared
      ? "再調整同事的角度"
      : "先清出拍照視線";
  const instruction = isAngleAligned
    ? "無尾熊完整露出來了"
    : areDocumentsCleared
      ? "在同事身上向左滑，讓她稍微側過去"
      : "把擋在同事周圍的文件拖開";

  const updateAngleProgress = (nextProgress: number) => {
    const next = clamp(nextProgress, 0, 1);
    setAngleProgress(next);
    if (next >= 0.82) {
      setAngleProgress(1);
      setIsAngleAligned(true);
    }
  };

  const handleAnglePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!areDocumentsCleared || isAngleAligned) return;
    event.preventDefault();
    angleMovedRef.current = false;
    angleDragRef.current = {
      startX: event.clientX,
      startProgress: angleProgress,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleAnglePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = angleDragRef.current;
    if (!start || isAngleAligned) return;
    event.preventDefault();
    const deltaX = start.startX - event.clientX;
    if (Math.abs(deltaX) > 5) angleMovedRef.current = true;
    updateAngleProgress(start.startProgress + deltaX / ANGLE_DRAG_DISTANCE_PX);
  };

  const handleAnglePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!angleDragRef.current) return;
    angleDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleAngleClick = () => {
    if (!areDocumentsCleared || isAngleAligned || angleMovedRef.current) return;
    updateAngleProgress(angleProgress + 0.34);
  };

  const handleAngleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!areDocumentsCleared || isAngleAligned) return;
    if (event.key !== "ArrowLeft" && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    updateAngleProgress(angleProgress + 0.34);
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={10}
      overflow="hidden"
      data-koala-reveal-phase={
        isAngleAligned ? "revealed" : areDocumentsCleared ? "angle" : "documents"
      }
    >
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(75,48,34,0.05) 0%, rgba(63,42,30,0.2) 100%)"
        pointerEvents="none"
      />

      <Flex
        position="absolute"
        left="18px"
        right="18px"
        top="18px"
        zIndex={12}
        minH="82px"
        px="16px"
        py="13px"
        borderRadius="16px"
        bgColor="rgba(255, 250, 238, 0.94)"
        border="1px solid rgba(142, 103, 73, 0.28)"
        boxShadow="0 10px 24px rgba(66, 42, 28, 0.18)"
        direction="column"
        gap="6px"
      >
        <Flex alignItems="center" justifyContent="space-between" gap="12px">
          <Text color="#684D39" fontSize="17px" fontWeight="900" lineHeight="1.2">
            {phaseLabel}
          </Text>
          <Flex alignItems="center" gap="5px">
            {[0, 1].map((index) => {
              const isComplete = index === 0 ? areDocumentsCleared : isAngleAligned;
              const isCurrent = index === 0 ? !areDocumentsCleared : areDocumentsCleared;
              return (
                <Flex
                  key={`reveal-progress-${index}`}
                  w={isCurrent ? "24px" : "9px"}
                  h="9px"
                  borderRadius="999px"
                  bgColor={isComplete ? "#7E9F8F" : isCurrent ? "#B78962" : "#D8C5B3"}
                  transition="width 220ms ease, background-color 220ms ease"
                />
              );
            })}
          </Flex>
        </Flex>
        <Text color="#82664F" fontSize="13px" fontWeight="700" lineHeight="1.45">
          {instruction}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        right="33%"
        bottom="190px"
        zIndex={2}
        w="46%"
        maxW="184px"
        pointerEvents="none"
        opacity={isAngleAligned ? 1 : 0.88 + angleProgress * 0.12}
        filter={
          isAngleAligned
            ? "drop-shadow(0 0 18px rgba(255, 226, 145, 0.78)) drop-shadow(0 12px 18px rgba(42,28,20,0.28))"
            : "drop-shadow(0 10px 16px rgba(42,28,20,0.25))"
        }
        animation={isAngleAligned ? `${earPeek} 1.15s ease-in-out infinite` : undefined}
        transition="filter 260ms ease, opacity 220ms ease"
      >
        <img
          src={KOALA_IMAGE}
          alt="逐漸從同事背後露出的無尾熊"
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
        />
      </Flex>

      {!areDocumentsCleared ? (
        <Text
          position="absolute"
          right="26%"
          top="31%"
          zIndex={6}
          color="rgba(91, 63, 45, 0.8)"
          fontSize="24px"
          fontWeight="900"
          pointerEvents="none"
          animation={`${revealPulse} 1.4s ease-in-out infinite`}
        >
          ……？
        </Text>
      ) : null}

      <Flex
        role="slider"
        tabIndex={areDocumentsCleared && !isAngleAligned ? 0 : -1}
        aria-label="向左滑動調整同事角度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(angleProgress * 100)}
        position="absolute"
        left="8%"
        bottom="68px"
        zIndex={4}
        w="68%"
        maxW="278px"
        cursor={areDocumentsCleared && !isAngleAligned ? "grab" : "default"}
        touchAction="none"
        outline="none"
        transform={`translateX(${-66 * angleProgress}px) rotateY(${-18 * angleProgress}deg)`}
        transformOrigin="50% 100%"
        transformStyle="preserve-3d"
        transition={angleDragRef.current ? "none" : "transform 240ms ease"}
        onPointerDown={handleAnglePointerDown}
        onPointerMove={handleAnglePointerMove}
        onPointerUp={handleAnglePointerEnd}
        onPointerCancel={handleAnglePointerEnd}
        onClick={handleAngleClick}
        onKeyDown={handleAngleKeyDown}
        _focusVisible={{ filter: "drop-shadow(0 0 10px rgba(255, 234, 167, 0.9))" }}
        _active={{ cursor: areDocumentsCleared && !isAngleAligned ? "grabbing" : "default" }}
      >
        <img
          src={COWORKER_IMAGE}
          alt="抱著工作來找小麥的同事"
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
        />
      </Flex>

      {!areDocumentsCleared
        ? REVEAL_PAPERS.filter((paper) => !clearedPaperIds.includes(paper.id)).map((paper) => (
            <RevealPaper
              key={paper.id}
              paper={paper}
              onCleared={(paperId) => {
                setClearedPaperIds((current) =>
                  current.includes(paperId) ? current : [...current, paperId],
                );
              }}
            />
          ))
        : null}

      {areDocumentsCleared && !isAngleAligned ? (
        <Flex
          position="absolute"
          left="50%"
          bottom="24px"
          zIndex={9}
          transform="translateX(-50%)"
          w="calc(100% - 40px)"
          h="48px"
          px="16px"
          borderRadius="999px"
          bgColor="rgba(79, 57, 42, 0.84)"
          border="1px solid rgba(255, 244, 225, 0.34)"
          boxShadow="0 10px 24px rgba(40, 27, 19, 0.24)"
          alignItems="center"
          gap="11px"
          pointerEvents="none"
        >
          <Flex animation={`${promptNudgeLeft} 0.95s ease-in-out infinite`}>
            <IoArrowBack color="#FFF2DA" size={23} />
          </Flex>
          <Flex flex="1" h="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.22)" overflow="hidden">
            <Flex
              h="100%"
              w={`${Math.max(6, angleProgress * 100)}%`}
              borderRadius="999px"
              bgColor="#F2D69D"
              transition={angleDragRef.current ? "none" : "width 180ms ease"}
            />
          </Flex>
          <Text color="#FFF2DA" fontSize="13px" fontWeight="900" whiteSpace="nowrap">
            向左滑
          </Text>
        </Flex>
      ) : null}

      {isAngleAligned ? (
        <>
          <Box
            position="absolute"
            right="28%"
            bottom="171px"
            zIndex={1}
            w="52%"
            h="220px"
            borderRadius="999px"
            bg="radial-gradient(circle, rgba(255,226,143,0.38) 0%, rgba(255,226,143,0.12) 48%, transparent 72%)"
            pointerEvents="none"
            animation={`${revealPulse} 1.5s ease-in-out infinite`}
          />
          <Flex
            role="button"
            tabIndex={0}
            aria-label="拿出相機"
            position="absolute"
            left="20px"
            right="20px"
            bottom="22px"
            zIndex={12}
            h="54px"
            px="22px"
            borderRadius="999px"
            bgColor="#8D694C"
            color="white"
            alignItems="center"
            justifyContent="center"
            gap="10px"
            cursor="pointer"
            boxShadow="0 12px 26px rgba(58, 39, 27, 0.32)"
            animation={`${foundPop} 260ms ease-out both`}
            onClick={onComplete}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onComplete();
            }}
            _focusVisible={{ outline: "3px solid rgba(255, 235, 173, 0.95)" }}
          >
            <FaCamera size={20} />
            <Text color="white" fontSize="17px" fontWeight="900" lineHeight="1">
              拿出相機
            </Text>
          </Flex>
        </>
      ) : null}
    </Flex>
  );
}

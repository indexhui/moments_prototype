"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw } from "react-icons/fi";

type ShredPiece = {
  id: string;
  correctOrder: number;
  scatter: { leftPct: number; topPct: number; rotateDeg: number };
};

type PieceLayout = {
  leftPct: number;
  topPct: number;
  rotateDeg: number;
  slotIndex: number | null;
};

type DragSession = {
  pieceId: string;
  boardRect: DOMRect;
  offsetX: number;
  offsetY: number;
};

const STRIP_COUNT = 6;
const STRIP_WIDTH = 40;
const STRIP_HEIGHT = 270;
const DOCUMENT_WIDTH = STRIP_WIDTH * STRIP_COUNT;
const SLOT_TOP_PCT = 42;
const SLOT_LEFT_PCTS = [22.6, 33.55, 44.5, 55.45, 66.4, 77.35] as const;
const TUTORIAL_KEY = "moment:shredded-document-tutorial-v1";
const FALLBACK_SCRAMBLED_ORDER = [2, 5, 1, 4, 0, 3] as const;

const SHRED_PIECES: ShredPiece[] = [
  { id: "shred-1", correctOrder: 0, scatter: { leftPct: 11, topPct: 75, rotateDeg: -8 } },
  { id: "shred-2", correctOrder: 1, scatter: { leftPct: 27, topPct: 73, rotateDeg: 6 } },
  { id: "shred-3", correctOrder: 2, scatter: { leftPct: 43, topPct: 76, rotateDeg: -4 } },
  { id: "shred-4", correctOrder: 3, scatter: { leftPct: 58, topPct: 73, rotateDeg: 8 } },
  { id: "shred-5", correctOrder: 4, scatter: { leftPct: 74, topPct: 76, rotateDeg: -6 } },
  { id: "shred-6", correctOrder: 5, scatter: { leftPct: 90, topPct: 74, rotateDeg: 5 } },
];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const stripSnap = keyframes`
  0% { filter: brightness(1); }
  40% { filter: brightness(1.24) drop-shadow(0 0 8px rgba(255,224,143,0.9)); }
  100% { filter: brightness(1); }
`;

const wrongShake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
`;

const successSeal = keyframes`
  from { opacity: 0; transform: translateY(-24px) scaleY(0.3); }
  to { opacity: 0.94; transform: translateY(0) scaleY(1); }
`;

const successGlow = keyframes`
  0% { opacity: 0; transform: scale(0.86); }
  42% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
`;

function buildLayouts(pieceOrder: readonly number[], randomizePose = false) {
  return Object.fromEntries(
    pieceOrder.map((pieceIndex, scatterIndex) => {
      const piece = SHRED_PIECES[pieceIndex];
      const scatter = SHRED_PIECES[scatterIndex].scatter;
      const poseJitter = randomizePose ? Math.random() * 3 - 1.5 : 0;
      return [
        piece.id,
        {
          leftPct: scatter.leftPct,
          topPct: scatter.topPct + poseJitter,
          rotateDeg: scatter.rotateDeg + poseJitter,
          slotIndex: null,
        },
      ];
    }),
  ) as Record<string, PieceLayout>;
}

function shuffledPieceOrder() {
  const pieceOrder = SHRED_PIECES.map((_, index) => index);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    for (let index = pieceOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pieceOrder[index], pieceOrder[swapIndex]] = [pieceOrder[swapIndex], pieceOrder[index]];
    }
    if (pieceOrder.every((pieceIndex, scatterIndex) => pieceIndex !== scatterIndex)) {
      return pieceOrder;
    }
  }
  return [...FALLBACK_SCRAMBLED_ORDER];
}

function initialLayouts() {
  return buildLayouts(FALLBACK_SCRAMBLED_ORDER);
}

function shuffledLayouts() {
  return buildLayouts(shuffledPieceOrder(), true);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function nearestSlotIndex(leftPct: number) {
  return SLOT_LEFT_PCTS.reduce(
    (best, current, index, slots) =>
      Math.abs(current - leftPct) < Math.abs(slots[best] - leftPct) ? index : best,
    0,
  );
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function DocumentArtwork() {
  return (
    <Box
      position="absolute"
      inset="0"
      bgColor="#FFFCF0"
      backgroundImage="linear-gradient(90deg, rgba(173,154,117,0.08) 1px, transparent 1px), linear-gradient(rgba(173,154,117,0.07) 1px, transparent 1px)"
      backgroundSize="18px 18px"
      color="#44463F"
      overflow="hidden"
    >
      <Text position="absolute" left="18px" top="16px" fontSize="9px" fontWeight="900" letterSpacing="0.15em" color="#3F6970">
        EVERGREEN CLIENT GROUP
      </Text>
      <Box position="absolute" left="18px" right="18px" top="34px" borderTop="2px solid #64818A" />
      <Text position="absolute" left="18px" top="45px" fontSize="18px" fontWeight="900" whiteSpace="nowrap">
        客戶提案修訂稿
      </Text>
      <Text position="absolute" right="18px" top="51px" fontSize="8px" fontWeight="800" color="#8A5D52">
        重要・勿銷毀
      </Text>
      <Text position="absolute" left="18px" top="82px" fontSize="9px" fontWeight="800" whiteSpace="nowrap">
        專案編號：EVG-0721　　負責窗口：小麥
      </Text>
      {[112, 132, 152, 172, 192, 212].map((top, index) => (
        <Box
          key={`document-line-${top}`}
          position="absolute"
          left="18px"
          top={`${top}px`}
          w={index === 5 ? "168px" : index % 2 === 0 ? "204px" : "188px"}
          h="4px"
          borderRadius="999px"
          bgColor={index === 0 ? "rgba(69,104,111,0.5)" : "rgba(63,65,59,0.31)"}
        />
      ))}
      <Flex
        position="absolute"
        right="20px"
        bottom="18px"
        w="62px"
        h="28px"
        border="3px double rgba(165,74,62,0.72)"
        color="#A54A3E"
        align="center"
        justify="center"
        fontSize="9px"
        fontWeight="900"
        transform="rotate(-7deg)"
      >
        URGENT
      </Flex>
    </Box>
  );
}

function PaperStrip({ piece, placed }: { piece: ShredPiece; placed: boolean }) {
  const leftTear = piece.correctOrder % 2 === 0 ? "2px" : "0px";
  const rightTear = piece.correctOrder % 2 === 0 ? "0px" : "2px";
  return (
    <Box
      aria-hidden="true"
      position="relative"
      w={`${STRIP_WIDTH}px`}
      h={`${STRIP_HEIGHT}px`}
      overflow="hidden"
      bgColor="#FFFCF0"
      clipPath={`polygon(${leftTear} 0, calc(100% - ${rightTear}) 0, 100% 4%, calc(100% - 2px) 9%, 100% 15%, calc(100% - 2px) 22%, 100% 31%, calc(100% - 1px) 43%, 100% 57%, calc(100% - 2px) 68%, 100% 81%, calc(100% - 1px) 92%, calc(100% - ${rightTear}) 100%, ${leftTear} 100%, 0 94%, 2px 84%, 0 72%, 2px 59%, 0 45%, 2px 31%, 0 17%, 2px 8%)`}
      boxShadow={placed ? "0 3px 5px rgba(57,48,37,0.14)" : "0 8px 14px rgba(37,32,28,0.28)"}
    >
      <Box position="absolute" top="0" left={`${-piece.correctOrder * STRIP_WIDTH}px`} w={`${DOCUMENT_WIDTH}px`} h={`${STRIP_HEIGHT}px`}>
        <DocumentArtwork />
      </Box>
      <Box position="absolute" insetY="0" left="0" w="2px" bgColor="rgba(132,111,78,0.13)" />
      <Box position="absolute" insetY="0" right="0" w="2px" bgColor="rgba(132,111,78,0.16)" />
    </Box>
  );
}

export function ShreddedDocumentMinigameModal({
  onSkip,
  onSolved,
  onComplete,
}: {
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const solvedNotifiedRef = useRef(false);
  const onSolvedRef = useRef(onSolved);
  const onCompleteRef = useRef(onComplete);
  const [layouts, setLayouts] = useState<Record<string, PieceLayout>>(() => initialLayouts());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [snapId, setSnapId] = useState<string | null>(null);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const placedCount = useMemo(
    () => Object.values(layouts).filter((layout) => layout.slotIndex !== null).length,
    [layouts],
  );
  const correctCount = useMemo(
    () =>
      SHRED_PIECES.filter((piece) => layouts[piece.id].slotIndex === piece.correctOrder).length,
    [layouts],
  );
  const isFilledWrong = placedCount === STRIP_COUNT && correctCount !== STRIP_COUNT;

  useEffect(() => {
    onSolvedRef.current = onSolved;
  }, [onSolved]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const closeTutorial = useCallback(() => {
    window.localStorage.setItem(TUTORIAL_KEY, "1");
    setIsTutorialOpen(false);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(TUTORIAL_KEY) === "1") return;
    setIsTutorialOpen(true);
  }, []);

  useEffect(() => {
    setLayouts(shuffledLayouts());
  }, []);

  useEffect(() => {
    if (correctCount !== STRIP_COUNT) return;
    setIsSuccess(true);
    triggerHaptic([24, 18, 38, 18, 62]);
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolvedRef.current?.();
    }
    const timer = window.setTimeout(() => onCompleteRef.current?.(), 2800);
    return () => window.clearTimeout(timer);
  }, [correctCount]);

  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (event: PointerEvent) => {
      const session = dragRef.current;
      if (!session || session.pieceId !== draggingId) return;
      const leftPct = clamp(
        ((event.clientX - session.boardRect.left - session.offsetX) / session.boardRect.width) * 100,
        5,
        95,
      );
      const topPct = clamp(
        ((event.clientY - session.boardRect.top - session.offsetY) / session.boardRect.height) * 100,
        20,
        82,
      );
      setLayouts((current) => ({
        ...current,
        [draggingId]: {
          ...current[draggingId],
          leftPct,
          topPct,
          rotateDeg: current[draggingId].rotateDeg * 0.82,
          slotIndex: null,
        },
      }));
    };
    const handleUp = () => {
      const piece = SHRED_PIECES.find((candidate) => candidate.id === draggingId);
      if (!piece) return;
      setLayouts((current) => {
        const layout = current[draggingId];
        const isNearPage = layout.topPct >= 24 && layout.topPct <= 59;
        const slotIndex = nearestSlotIndex(layout.leftPct);
        const slotOccupied = SHRED_PIECES.some(
          (candidate) => candidate.id !== draggingId && current[candidate.id].slotIndex === slotIndex,
        );
        if (isNearPage && !slotOccupied) {
          setSnapId(draggingId);
          window.setTimeout(() => setSnapId(null), 320);
          triggerHaptic(18);
          return {
            ...current,
            [draggingId]: {
              leftPct: SLOT_LEFT_PCTS[slotIndex],
              topPct: SLOT_TOP_PCT,
              rotateDeg: 0,
              slotIndex,
            },
          };
        }
        return {
          ...current,
          [draggingId]: {
            ...layout,
            rotateDeg: piece.scatter.rotateDeg,
            slotIndex: null,
          },
        };
      });
      dragRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [draggingId]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isTutorialOpen) {
        closeTutorial();
        return;
      }
      if (isHintOpen) {
        setIsHintOpen(false);
        return;
      }
      onSkip();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeTutorial, isHintOpen, isTutorialOpen, onSkip]);

  const reset = () => {
    dragRef.current = null;
    solvedNotifiedRef.current = false;
    setDraggingId(null);
    setSnapId(null);
    setIsSuccess(false);
    setLayouts(shuffledLayouts());
  };

  const startDrag = (piece: ShredPiece, event: React.PointerEvent<HTMLDivElement>) => {
    if (isSuccess) return;
    const board = boardRef.current;
    if (!board) return;
    event.preventDefault();
    const boardRect = board.getBoundingClientRect();
    const stripRect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pieceId: piece.id,
      boardRect,
      offsetX: event.clientX - stripRect.left - stripRect.width / 2,
      offsetY: event.clientY - stripRect.top - stripRect.height / 2,
    };
    setDraggingId(piece.id);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={76} direction="column" overflow="hidden" bg="linear-gradient(180deg, #E7E3D9, #BFC7C4)">
      <Flex h="58px" flexShrink={0} px="14px" align="center" justify="space-between">
        <Flex as="button" aria-label="重新開始" onClick={reset} w="34px" h="34px" borderRadius="999px" bgColor="#FFF9EC" color="#745338" align="center" justify="center" boxShadow="0 4px 12px rgba(75,52,34,0.15)">
          <FiRefreshCw size={16} />
        </Flex>
        <Flex direction="column" align="center">
          <Text color="#35464A" fontSize="18px" fontWeight="900">拼回碎紙文件</Text>
          <Text color="#657479" fontSize="11px" fontWeight="800">已拼入 {placedCount}/{STRIP_COUNT} 條</Text>
        </Flex>
        <Flex gap="7px">
          <Flex as="button" onClick={() => setIsHintOpen(true)} h="32px" px="11px" borderRadius="999px" bgColor="rgba(61,80,84,0.14)" color="#40565A" align="center" fontSize="11px" fontWeight="800">提示</Flex>
          <Flex as="button" onClick={onSkip} h="32px" px="11px" borderRadius="999px" bgColor="rgba(61,80,84,0.14)" color="#40565A" align="center" fontSize="11px" fontWeight="800">稍後再做</Flex>
        </Flex>
      </Flex>

      <Box px="13px" pb="13px" flex="1" minH="0">
        <Box ref={boardRef} data-shredder-puzzle="true" position="relative" w="100%" h="100%" overflow="hidden" borderRadius="9px" border="2px solid #49595B" bg="linear-gradient(180deg, #737E7D 0%, #A6AAA3 20%, #8D948E 100%)" boxShadow="inset 0 0 28px rgba(34,42,42,0.3), 0 12px 24px rgba(48,58,58,0.2)" touchAction="none">
          <Flex position="absolute" top="0" left="8%" right="8%" h="66px" borderRadius="0 0 12px 12px" bg="linear-gradient(180deg, #424D4F, #5E6B6C)" border="2px solid #344144" direction="column" align="center" justify="center" gap="7px" boxShadow="0 8px 16px rgba(37,45,45,0.28)">
            <Text color="#D8E1DD" fontSize="8px" fontWeight="900" letterSpacing="0.2em">OFFICE SHREDDER</Text>
            <Box w="74%" h="7px" borderRadius="999px" bgColor="#1D2527" boxShadow="inset 0 2px 2px rgba(0,0,0,0.55)" />
          </Flex>

          <Box position="absolute" left="16.8%" top="21%" w={`${DOCUMENT_WIDTH + 12}px`} h={`${STRIP_HEIGHT + 12}px`} border="2px dashed rgba(255,248,226,0.52)" borderRadius="5px" bgColor="rgba(255,252,236,0.12)" transform="translateX(-2px)" animation={isFilledWrong ? `${wrongShake} 280ms ease` : undefined} pointerEvents="none">
            {SLOT_LEFT_PCTS.map((_, index) => (
              <Box key={`slot-guide-${index}`} position="absolute" left={`${index * STRIP_WIDTH + 5}px`} top="5px" w={`${STRIP_WIDTH}px`} h={`${STRIP_HEIGHT}px`} borderRight={index < STRIP_COUNT - 1 ? "1px solid rgba(255,255,255,0.12)" : undefined} />
            ))}
          </Box>

          {SHRED_PIECES.map((piece) => {
            const layout = layouts[piece.id];
            const isDragging = draggingId === piece.id;
            const isPlaced = layout.slotIndex !== null;
            return (
              <Box
                key={piece.id}
                data-shred-piece={piece.correctOrder}
                data-slot-index={layout.slotIndex ?? ""}
                role="button"
                aria-label={`碎紙條 ${piece.correctOrder + 1}`}
                position="absolute"
                left={`${layout.leftPct}%`}
                top={`${layout.topPct}%`}
                transform={`translate(-50%, -50%) rotate(${layout.rotateDeg}deg) scale(${isDragging ? 1.035 : 1})`}
                transformOrigin="50% 50%"
                zIndex={isDragging ? 40 : isPlaced ? 20 + piece.correctOrder : 10 + piece.correctOrder}
                cursor={isDragging ? "grabbing" : "grab"}
                onPointerDown={(event) => startDrag(piece, event)}
                transition={isDragging ? "none" : "left 210ms ease, top 210ms ease, transform 210ms ease"}
                animation={snapId === piece.id ? `${stripSnap} 300ms ease` : undefined}
              >
                <PaperStrip piece={piece} placed={isPlaced} />
              </Box>
            );
          })}

          <Flex position="absolute" left="0" right="0" bottom="8px" justify="center" pointerEvents="none">
            <Text color="rgba(255,255,255,0.76)" fontSize="11px" fontWeight="800" bgColor="rgba(48,58,58,0.54)" borderRadius="999px" px="12px" py="5px">
              {isFilledWrong ? "文字還接不起來，再換換位置" : "拖曳紙條，讓文字從左到右接起來"}
            </Text>
          </Flex>

          {isSuccess ? (
            <Flex position="absolute" inset="0" zIndex={80} bgColor="rgba(39,49,48,0.7)" align="center" justify="center" px="24px">
              <Flex w="100%" maxW="290px" minH="330px" position="relative" direction="column" align="center" justify="center" gap="12px" borderRadius="12px" bgColor="#FFF9EA" boxShadow="0 18px 38px rgba(25,32,31,0.34)" animation={`${successGlow} 360ms ease both`} overflow="hidden">
                <Box position="absolute" insetY="0" left="50%" w="20px" bgColor="rgba(231,181,92,0.58)" transform="translateX(-50%)" animation={`${successSeal} 420ms ease 180ms both`} />
                <Text position="relative" color="#5C4434" fontSize="22px" fontWeight="900">文件拼回來了！</Text>
                <Text position="relative" color="#8A674D" fontSize="13px" fontWeight="800">六條紙片重新接成可讀文件</Text>
                <Flex position="relative" color="#D49A3D" fontSize="24px" letterSpacing="0.12em">✦ ✦ ✦</Flex>
              </Flex>
            </Flex>
          ) : null}
        </Box>
      </Box>

      {isHintOpen ? (
        <Flex position="absolute" inset="0" zIndex={100} bgColor="rgba(45,37,30,0.54)" align="center" justify="center" p="24px">
          <Flex w="100%" maxW="300px" borderRadius="14px" bgColor="#FFF8EA" direction="column" gap="12px" p="20px" boxShadow="0 18px 36px rgba(34,26,20,0.3)" animation={`${fadeUp} 220ms ease both`}>
            <Text color="#65462F" fontSize="19px" fontWeight="900">拼紙提示</Text>
            <Text color="#7D5C43" fontSize="14px" lineHeight="1.7">先看頁首的英文字與藍色橫線，再確認中間的標題、專案編號和底部印章能否連起來。紙條靠近文件框時會吸附到欄位。</Text>
            <Flex justify="flex-end"><Flex as="button" onClick={() => setIsHintOpen(false)} h="36px" px="18px" borderRadius="999px" bgColor="#845839" color="white" align="center" fontSize="12px" fontWeight="900">知道了</Flex></Flex>
          </Flex>
        </Flex>
      ) : null}

      {isTutorialOpen ? (
        <Flex position="absolute" inset="0" zIndex={110} bgColor="rgba(45,37,30,0.58)" align="center" justify="center" p="22px">
          <Flex w="100%" maxW="312px" borderRadius="16px" overflow="hidden" bgColor="#FFF8EA" boxShadow="0 18px 38px rgba(32,24,18,0.34)" direction="column" animation={`${fadeUp} 240ms ease both`}>
            <Flex h="145px" position="relative" bg="linear-gradient(180deg, #697576, #9DA39D)" align="center" justify="center" gap="4px">
              {[0, 1, 2, 3].map((index) => (
                <Box key={`tutorial-strip-${index}`} w="24px" h="92px" bgColor="#FFFCF0" transform={`translateY(${index % 2 === 0 ? 4 : -4}px) rotate(${index % 2 === 0 ? -3 : 3}deg)`} boxShadow="0 5px 10px rgba(35,30,25,0.24)" />
              ))}
            </Flex>
            <Flex p="19px" direction="column" gap="10px">
              <Text color="#60422D" fontSize="20px" fontWeight="900">把碎紙拼回原樣</Text>
              <Text color="#7A5941" fontSize="13px" lineHeight="1.65">拖曳六條碎紙到中央文件框，依照文字與線條判斷左右順序。放錯可以直接再拖出來交換。</Text>
              <Flex justify="flex-end" mt="4px"><Flex as="button" onClick={closeTutorial} h="38px" px="20px" borderRadius="999px" bgColor="#845839" color="white" align="center" fontSize="13px" fontWeight="900">開始搶救</Flex></Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

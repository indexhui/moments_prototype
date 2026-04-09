"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw, FiX } from "react-icons/fi";

type StickyPiece = {
  id: string;
  imagePath: string;
  correctOrder: number;
  sourceSize: {
    width: number;
    height: number;
  };
  scatter: {
    topPct: number;
    leftPct: number;
    rotateDeg: number;
    width: number;
  };
};

type PieceLayout = {
  topPct: number;
  leftPct: number;
  rotateDeg: number;
  centered: boolean;
  slotIndex: number | null;
};

type DragSession = {
  pieceId: string;
  boardRect: DOMRect;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

const BOARD_BG = "#8484A4";
const CENTER_ZONE_MIN_LEFT = 25;
const CENTER_ZONE_MAX_LEFT = 75;
const CENTER_ZONE_CENTER = 50;
const CENTER_ZONE_PULL_RANGE = 25;
const SLOT_PULL_RANGE = 10;
const SLOT_SNAP_RANGE = 7;
const SLOT_POSITIONS = [16, 30.5, 45, 59.5, 74] as const;

const STICKY_PIECES: StickyPiece[] = [
  {
    id: "sticky-01",
    imagePath: "/images/sticky/sticky_01.png",
    correctOrder: 0,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 54, leftPct: 56, rotateDeg: 7, width: 120 },
  },
  {
    id: "sticky-02",
    imagePath: "/images/sticky/sticky_02.png",
    correctOrder: 1,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 18, leftPct: 12, rotateDeg: -6, width: 132 },
  },
  {
    id: "sticky-03",
    imagePath: "/images/sticky/sticky_03.png",
    correctOrder: 2,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 78, leftPct: 52, rotateDeg: -8, width: 124 },
  },
  {
    id: "sticky-04",
    imagePath: "/images/sticky/sticky_04.png",
    correctOrder: 3,
    sourceSize: { width: 306, height: 307 },
    scatter: { topPct: 34, leftPct: 68, rotateDeg: 6, width: 120 },
  },
  {
    id: "sticky-05",
    imagePath: "/images/sticky/sticky_05.png",
    correctOrder: 4,
    sourceSize: { width: 310, height: 311 },
    scatter: { topPct: 46, leftPct: 20, rotateDeg: -7, width: 114 },
  },
] as const;

const floatInBoard = keyframes`
  0% {
    opacity: 0;
    transform: translateY(14px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const successFadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const successCoverTop = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
`;

const successCoverBottom = keyframes`
  0% {
    transform: translateY(100%);
  }
  100% {
    transform: translateY(0);
  }
`;

function getInitialPieceLayouts() {
  return Object.fromEntries(
    STICKY_PIECES.map((piece) => [
      piece.id,
      {
        topPct: piece.scatter.topPct,
        leftPct: piece.scatter.leftPct,
        rotateDeg: piece.scatter.rotateDeg,
        centered: false,
        slotIndex: null,
      },
    ]),
  ) as Record<string, PieceLayout>;
}

function getCenteredPosition() {
  return {
    leftPct: CENTER_ZONE_CENTER,
    rotateDeg: 0,
    width: 124,
  };
}

function getCenteredStickyHeightPx(piece: StickyPiece) {
  return (piece.sourceSize.height / piece.sourceSize.width) * getCenteredPosition().width;
}

function getCenterZoneFrame() {
  const lastPiece = STICKY_PIECES[STICKY_PIECES.length - 1];
  const topPct = SLOT_POSITIONS[0];
  const bottomPct = SLOT_POSITIONS[SLOT_POSITIONS.length - 1];
  const topPaddingPx = 8;
  const bottomPaddingPx = 8;

  return {
    top: `calc(${topPct}% - ${topPaddingPx}px)`,
    height: `calc(${bottomPct - topPct}% + ${getCenteredStickyHeightPx(lastPiece) + topPaddingPx + bottomPaddingPx}px)`,
  };
}

function getSuccessSlotTopPct(order: number, boardHeight: number) {
  if (boardHeight <= 0) {
    return SLOT_POSITIONS[order] ?? SLOT_POSITIONS[0];
  }

  const heights = STICKY_PIECES.map((piece) => getCenteredStickyHeightPx(piece));
  const overlapGapPx = -8;
  const totalHeight =
    heights.reduce((sum, height) => sum + height, 0) + overlapGapPx * (heights.length - 1);
  const startPx = Math.max(56, (boardHeight - totalHeight) / 2);
  const topPx =
    startPx +
    heights.slice(0, order).reduce((sum, height) => sum + height, 0) +
    overlapGapPx * order;

  return toPercent(topPx, boardHeight);
}

function getSlotPosition(correctOrder: number) {
  return {
    topPct: SLOT_POSITIONS[correctOrder] ?? SLOT_POSITIONS[0],
    leftPct: CENTER_ZONE_CENTER,
    rotateDeg: 0,
    width: 124,
  };
}

function getNearestSlotIndex(topPct: number) {
  return SLOT_POSITIONS.reduce(
    (bestIndex, currentTop, index, slots) =>
      Math.abs(currentTop - topPct) < Math.abs(slots[bestIndex] - topPct) ? index : bestIndex,
    0,
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

function applyMagneticPull(piece: StickyPiece, leftPct: number, topPct: number) {
  const centerTarget = getCenteredPosition();
  const nearestSlotIndex = getNearestSlotIndex(topPct);
  const slotTarget = getSlotPosition(nearestSlotIndex);
  const horizontalDistance = Math.abs(leftPct - centerTarget.leftPct);

  if (horizontalDistance > CENTER_ZONE_PULL_RANGE) {
    return { leftPct, topPct, rotateDeg: piece.scatter.rotateDeg };
  }

  const horizontalStrength = 1 - horizontalDistance / CENTER_ZONE_PULL_RANGE;
  const verticalDistance = Math.abs(topPct - slotTarget.topPct);
  const slotStrength = verticalDistance > SLOT_PULL_RANGE ? 0 : 1 - verticalDistance / SLOT_PULL_RANGE;
  const rotateStrength = Math.max(horizontalStrength, slotStrength);

  return {
    leftPct: leftPct + (centerTarget.leftPct - leftPct) * horizontalStrength * 0.36,
    topPct: topPct + (slotTarget.topPct - topPct) * slotStrength * 0.3,
    rotateDeg: piece.scatter.rotateDeg * (1 - rotateStrength * 0.9),
  };
}

function getReleasedRotateDeg(piece: StickyPiece, leftPct: number) {
  const target = getCenteredPosition();
  const horizontalDistance = Math.abs(leftPct - target.leftPct);

  if (horizontalDistance <= 6) return piece.scatter.rotateDeg * 0.18;
  if (horizontalDistance <= 12) return piece.scatter.rotateDeg * 0.45;
  return piece.scatter.rotateDeg;
}

export function WorkMinigameTestModal({
  baseFatigue: _baseFatigue,
  onClose,
  onComplete,
}: {
  baseFatigue: number;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);

  const [pieceLayouts, setPieceLayouts] = useState<Record<string, PieceLayout>>(() =>
    getInitialPieceLayouts(),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [boardHeight, setBoardHeight] = useState(0);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const centeredCount = useMemo(
    () => Object.values(pieceLayouts).filter((layout) => layout.centered).length,
    [pieceLayouts],
  );

  const slottedCount = useMemo(
    () => Object.values(pieceLayouts).filter((layout) => layout.slotIndex !== null).length,
    [pieceLayouts],
  );
  const centerZoneFrame = useMemo(() => getCenterZoneFrame(), []);

  const isSolved = useMemo(() => {
    if (slottedCount !== STICKY_PIECES.length) return false;
    return STICKY_PIECES.every((piece) => pieceLayouts[piece.id].slotIndex === piece.correctOrder);
  }, [pieceLayouts, slottedCount]);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updateHeight = () => {
      setBoardHeight(boardElement.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(boardElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isSolved) return;
    setIsSuccessAnimating(true);
    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, 1600);
    return () => window.clearTimeout(completeTimer);
  }, [isSolved, onComplete]);

  useEffect(() => {
    if (!draggingId) return;

    const handlePointerMove = (event: PointerEvent) => {
      const session = dragSessionRef.current;
      if (!session || session.pieceId !== draggingId) return;

      const boardWidth = session.boardRect.width;
      const boardHeight = session.boardRect.height;
      const leftPx = clamp(
        event.clientX - session.boardRect.left - session.offsetX,
        0,
        boardWidth - session.width,
      );
      const topPx = clamp(
        event.clientY - session.boardRect.top - session.offsetY,
        0,
        boardHeight - session.height,
      );
      const piece = STICKY_PIECES.find((item) => item.id === draggingId);
      if (!piece) return;
      const nextLeftPct = toPercent(leftPx, boardWidth);
      const nextTopPct = toPercent(topPx, boardHeight);
      const magnetized = applyMagneticPull(piece, nextLeftPct, nextTopPct);

      setPieceLayouts((current) => ({
        ...current,
        [draggingId]: {
          ...current[draggingId],
          leftPct: magnetized.leftPct,
          topPct: magnetized.topPct,
          rotateDeg: magnetized.rotateDeg,
        },
      }));
    };

    const handlePointerUp = () => {
      const session = dragSessionRef.current;
      if (!session || session.pieceId !== draggingId) {
        setDraggingId(null);
        return;
      }

      const piece = STICKY_PIECES.find((item) => item.id === draggingId);
      if (!piece) {
        dragSessionRef.current = null;
        setDraggingId(null);
        return;
      }

      const currentLayout = pieceLayouts[draggingId];
      const isInsideCenterZone =
        currentLayout.leftPct >= CENTER_ZONE_MIN_LEFT &&
        currentLayout.leftPct <= CENTER_ZONE_MAX_LEFT;

      if (isInsideCenterZone) {
        const centerTarget = getCenteredPosition();
        const nearestSlotIndex = getNearestSlotIndex(currentLayout.topPct);
        const slotTarget = getSlotPosition(nearestSlotIndex);
        const nearSlot = Math.abs(currentLayout.topPct - slotTarget.topPct) <= SLOT_SNAP_RANGE;
        const slotTakenByOtherPiece = STICKY_PIECES.some(
          (otherPiece) =>
            otherPiece.id !== draggingId && pieceLayouts[otherPiece.id].slotIndex === nearestSlotIndex,
        );

        setPieceLayouts((current) => ({
            ...current,
            [draggingId]: {
              ...current[draggingId],
              leftPct: centerTarget.leftPct,
              topPct: nearSlot && !slotTakenByOtherPiece ? slotTarget.topPct : current[draggingId].topPct,
              rotateDeg:
                nearSlot && !slotTakenByOtherPiece
                  ? centerTarget.rotateDeg
                  : getReleasedRotateDeg(piece, centerTarget.leftPct),
              centered: true,
              slotIndex: nearSlot && !slotTakenByOtherPiece ? nearestSlotIndex : null,
            },
          }));
      } else {
        setPieceLayouts((current) => ({
          ...current,
          [draggingId]: {
            ...current[draggingId],
            rotateDeg: getReleasedRotateDeg(piece, current[draggingId].leftPct),
            centered: false,
            slotIndex: null,
          },
        }));
      }

      dragSessionRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingId, pieceLayouts]);

  const handlePointerDown = (
    piece: StickyPiece,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    event.preventDefault();

    const boardRect = boardElement.getBoundingClientRect();
    const pieceRect = event.currentTarget.getBoundingClientRect();
    const currentLeftPct = toPercent(pieceRect.left - boardRect.left, boardRect.width);
    const currentTopPct = toPercent(pieceRect.top - boardRect.top, boardRect.height);

    setPieceLayouts((current) => ({
      ...current,
      [piece.id]: {
        leftPct: currentLeftPct,
        topPct: currentTopPct,
        rotateDeg: current[piece.id]?.rotateDeg ?? piece.scatter.rotateDeg,
        centered: false,
        slotIndex: null,
      },
    }));

    dragSessionRef.current = {
      pieceId: piece.id,
      boardRect,
      offsetX: event.clientX - pieceRect.left,
      offsetY: event.clientY - pieceRect.top,
      width: pieceRect.width,
      height: pieceRect.height,
    };
    setDraggingId(piece.id);
  };

  const resetPuzzle = () => {
    dragSessionRef.current = null;
    setDraggingId(null);
    setIsSuccessAnimating(false);
    setPieceLayouts(getInitialPieceLayouts());
  };

  return (
    <Flex position="absolute" inset="0" zIndex={70} bgColor={BOARD_BG}>
      <Flex w="100%" direction="column" overflow="hidden" bgColor={BOARD_BG}>
        <Flex position="relative" px="16px" pt="16px" justify="flex-end">
          <Flex justify="flex-end" gap="8px">
            <Flex
              as="button"
              onClick={resetPuzzle}
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
            <Flex
              as="button"
              onClick={onClose}
              w="34px"
              h="34px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.86)"
              align="center"
              justify="center"
              color="#7C624B"
            >
              <FiX size={18} />
            </Flex>
          </Flex>
        </Flex>

        <Flex flex="1" direction="column" px="16px" pb="16px" overflow="hidden">
          <Flex
            ref={boardRef}
            position="relative"
            flex="1"
            minH="0"
            bgColor={BOARD_BG}
            overflow="hidden"
            animation={`${floatInBoard} 220ms ease both`}
            touchAction="none"
          >
            <Flex
              position="absolute"
              top="12px"
              left="0"
              right="0"
              zIndex={5}
              direction="column"
              align="center"
              gap="4px"
              px="16px"
              pointerEvents="none"
            >
              <Text color="white" fontSize="18px" fontWeight="800">
                整理便利貼
              </Text>
              <Text color="rgba(255,255,255,0.9)" fontSize="12px" lineHeight="1.7" textAlign="center">
                把線條碎片拖到正確位置
              </Text>
              <Text color="rgba(255,255,255,0.72)" fontSize="10px" textAlign="center">
                先整理到中央，再排出正確順序
              </Text>
            </Flex>

            <Box
              position="absolute"
              top={centerZoneFrame.top}
              height={centerZoneFrame.height}
              left={`${CENTER_ZONE_MIN_LEFT}%`}
              width={`${CENTER_ZONE_MAX_LEFT - CENTER_ZONE_MIN_LEFT}%`}
              bgColor="rgba(255,255,255,0.04)"
              pointerEvents="none"
            />

            {STICKY_PIECES.map((piece) => {
              const layout = pieceLayouts[piece.id];
              const slotTarget = layout.slotIndex !== null ? getSlotPosition(layout.slotIndex) : null;
              const isPlaced = layout.slotIndex !== null;
              const isDragging = draggingId === piece.id;
              const width = layout.centered ? getCenteredPosition().width : piece.scatter.width;
              const rotateDeg = isPlaced ? getCenteredPosition().rotateDeg : layout.rotateDeg;
              const renderedTopPct =
                isSuccessAnimating && isPlaced
                  ? getSuccessSlotTopPct(piece.correctOrder, boardHeight)
                  : slotTarget
                    ? slotTarget.topPct
                    : layout.topPct;

              return (
                <Box
                  key={piece.id}
                  position="absolute"
                  top={`${renderedTopPct}%`}
                  left={`${layout.leftPct}%`}
                  transform={isPlaced ? `translateX(-50%) rotate(${rotateDeg}deg)` : `rotate(${rotateDeg}deg)`}
                  transition={
                    isDragging
                      ? "none"
                      : "top 260ms cubic-bezier(0.2, 0.9, 0.22, 1), left 260ms cubic-bezier(0.2, 0.9, 0.22, 1), transform 260ms cubic-bezier(0.2, 0.9, 0.22, 1), box-shadow 180ms ease"
                  }
                  zIndex={isDragging ? 40 : isPlaced ? 20 + piece.correctOrder : 10 + piece.correctOrder}
                >
                  <Box
                    as="button"
                    onPointerDown={(event) => handlePointerDown(piece, event)}
                    cursor={isDragging ? "grabbing" : "grab"}
                    pointerEvents={isSuccessAnimating ? "none" : "auto"}
                    borderRadius="0"
                    overflow="hidden"
                    bgColor="#F6E99B"
                    boxShadow={
                      isDragging
                        ? "0 18px 28px rgba(31,24,18,0.22)"
                        : isPlaced
                          ? "0 10px 16px rgba(31,24,18,0.14)"
                          : "0 12px 18px rgba(31,24,18,0.16)"
                    }
                    _active={{ cursor: "grabbing" }}
                  >
                    <img
                      src={piece.imagePath}
                      alt={`便利貼片段 ${piece.correctOrder + 1}`}
                      draggable={false}
                      style={{
                        width: `${width}px`,
                        height: "auto",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  </Box>
                </Box>
              );
            })}

            <Flex
              position="absolute"
              right="16px"
              bottom="16px"
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
            >
              中央區 {centeredCount}/{STICKY_PIECES.length}
              <Text color="rgba(255,255,255,0.8)" fontSize="10px" fontWeight="600">
                格位 {slottedCount}/{STICKY_PIECES.length}
              </Text>
            </Flex>

            {isSuccessAnimating ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={50}
                pointerEvents="none"
              >
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  right="0"
                  h="50%"
                  bgColor="#A57E5D"
                  animation={`${successCoverTop} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`}
                />
                <Box
                  position="absolute"
                  bottom="0"
                  left="0"
                  right="0"
                  h="50%"
                  bgColor="#8E6B4E"
                  animation={`${successCoverBottom} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`}
                />
                <Flex
                  position="absolute"
                  inset="0"
                  align="center"
                  justify="center"
                  animation={`${successFadeUp} 260ms ease 320ms both`}
                >
                  <Text color="white" fontSize="22px" fontWeight="800" letterSpacing="1px">
                    順利完成～下班～
                  </Text>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

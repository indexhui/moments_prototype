"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw } from "react-icons/fi";

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
const STICKY_RENDER_WIDTH = 110;
const STICKY_STAGE_REWARD_IMAGE = "/images/sticky/sticky_03.png";

const STICKY_PIECES: StickyPiece[] = [
  {
    id: "sticky-01",
    imagePath: "/images/sticky/sticky_01.png",
    correctOrder: 0,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 54, leftPct: 56, rotateDeg: 7 },
  },
  {
    id: "sticky-02",
    imagePath: "/images/sticky/sticky_02.png",
    correctOrder: 1,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 18, leftPct: 12, rotateDeg: -6 },
  },
  {
    id: "sticky-03",
    imagePath: "/images/sticky/sticky_03.png",
    correctOrder: 2,
    sourceSize: { width: 373, height: 330 },
    scatter: { topPct: 78, leftPct: 52, rotateDeg: -8 },
  },
  {
    id: "sticky-04",
    imagePath: "/images/sticky/sticky_04.png",
    correctOrder: 3,
    sourceSize: { width: 306, height: 307 },
    scatter: { topPct: 34, leftPct: 68, rotateDeg: 6 },
  },
  {
    id: "sticky-05",
    imagePath: "/images/sticky/sticky_05.png",
    correctOrder: 4,
    sourceSize: { width: 310, height: 311 },
    scatter: { topPct: 46, leftPct: 20, rotateDeg: -7 },
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

const successFadeOut = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
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
    width: STICKY_RENDER_WIDTH,
  };
}

function getRenderedWidth(piece: StickyPiece) {
  void piece;
  return STICKY_RENDER_WIDTH;
}

function getCenteredStickyHeightPx(piece: StickyPiece) {
  return (piece.sourceSize.height / piece.sourceSize.width) * STICKY_RENDER_WIDTH;
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
    width: STICKY_RENDER_WIDTH,
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
  const dragSessionRef = useRef<DragSession | null>(null);
  const solvedNotifiedRef = useRef(false);

  const [pieceLayouts, setPieceLayouts] = useState<Record<string, PieceLayout>>(() =>
    getInitialPieceLayouts(),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [boardHeight, setBoardHeight] = useState(0);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [activeHintPage, setActiveHintPage] = useState<1 | 2>(1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onSkip();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

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
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    const completeTimer = window.setTimeout(() => {
      onComplete?.();
    }, 3400);
    return () => window.clearTimeout(completeTimer);
  }, [isSolved, onComplete, onSolved]);

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
    solvedNotifiedRef.current = false;
    setDraggingId(null);
    setIsSuccessAnimating(false);
    setPieceLayouts(getInitialPieceLayouts());
  };

  return (
    <Flex position="absolute" inset="0" zIndex={70} bgColor={BOARD_BG}>
      <Flex w="100%" direction="column" overflow="hidden" bgColor={BOARD_BG}>
        <Flex position="relative" px="16px" pt="16px" justify="space-between" align="center">
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
          <Flex justify="flex-end" gap="8px">
            <Flex
              as="button"
              onClick={() => {
                setActiveHintPage(1);
                setIsHintOpen(true);
              }}
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
              const width = getRenderedWidth(piece);
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
                      : "top 260ms cubic-bezier(0.2, 0.9, 0.22, 1), left 260ms cubic-bezier(0.2, 0.9, 0.22, 1), transform 260ms cubic-bezier(0.2, 0.9, 0.22, 1)"
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
                    bgColor="transparent"
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
                >
                  <Flex
                    position="absolute"
                    direction="column"
                    align="center"
                    gap="6px"
                    animation={`${successFadeUp} 260ms ease 320ms both, ${successFadeOut} 240ms ease 960ms forwards`}
                  >
                    <Text color="white" fontSize="22px" fontWeight="800">
                      順利完成！
                    </Text>
                  </Flex>
                  <Flex
                    direction="column"
                    align="center"
                    gap="6px"
                    animation={`${successFadeUp} 260ms ease 2220ms both`}
                  >
                    <img
                      src={STICKY_STAGE_REWARD_IMAGE}
                      alt="便利貼整理關卡獎勵圖示"
                      draggable={false}
                      style={{
                        width: "84px",
                        height: "auto",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    />
                    <Text color="rgba(255,255,255,0.92)" fontSize="16px" fontWeight="800">
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
                    <Text color="rgba(255,255,255,0.8)" fontSize="12px" fontWeight="700">
                      桌面清爽多了，今天可以順順收尾
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>

        {isHintOpen ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={80}
            bgColor="rgba(18,14,12,0.42)"
            align="center"
            justify="center"
            p="24px"
            >
              <Flex
                w="100%"
                maxW="300px"
                minH="340px"
                borderRadius="8px"
                bgColor="#F7EFE2"
                boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                direction="column"
                overflow="hidden"
              >
              <Flex px="16px" pt="16px" pb="8px" direction="column" gap="10px" flex="1">
                <Flex justify="space-between" align="center">
                  <Text color="#6D5443" fontSize="18px" fontWeight="800">
                    提示
                  </Text>
                  <Flex gap="8px">
                    {([1, 2] as const).map((page) => (
                      <Flex
                        key={page}
                        as="button"
                        onClick={() => setActiveHintPage(page)}
                        minW="54px"
                        h="28px"
                        px="10px"
                        borderRadius="999px"
                        bgColor={activeHintPage === page ? "#8E6D52" : "rgba(142,109,82,0.14)"}
                        align="center"
                        justify="center"
                        color={activeHintPage === page ? "white" : "#7B6352"}
                        fontSize="12px"
                        fontWeight="700"
                      >
                        提示{page}
                      </Flex>
                    ))}
                  </Flex>
                </Flex>

                {activeHintPage === 1 ? (
                  <Flex flex="1" align="center" justify="center" px="8px">
                    <Text color="#7B6352" fontSize="14px" lineHeight="1.7" textAlign="center">
                      先整理到中央，再排出正確順序
                    </Text>
                  </Flex>
                ) : (
                  <Flex flex="1" direction="column" justify="center" gap="12px">
                      <Flex align="center" gap="10px">
                        <Text color="#8E6D52" fontSize="12px" fontWeight="700" minW="36px">
                          開頭
                        </Text>
                        <img
                          src={STICKY_PIECES[0].imagePath}
                          alt="提示開頭便利貼"
                          draggable={false}
                          style={{
                            width: "48px",
                            height: "auto",
                            display: "block",
                            flexShrink: 0,
                          }}
                        />
                      </Flex>
                      <Flex align="center" gap="10px">
                        <Text color="#8E6D52" fontSize="12px" fontWeight="700" minW="36px">
                          中間
                        </Text>
                        <Flex direction="column" gap="8px">
                          {Array.from({ length: STICKY_PIECES.length - 2 }).map((_, index) => (
                            <Box
                              key={`hint-gap-${index}`}
                              w="30px"
                              h="30px"
                              borderRadius="6px"
                              border="2px dashed rgba(142,109,82,0.45)"
                              bgColor="rgba(142,109,82,0.06)"
                              flexShrink={0}
                            />
                          ))}
                        </Flex>
                      </Flex>
                      <Flex align="center" gap="10px">
                        <Text color="#8E6D52" fontSize="12px" fontWeight="700" minW="36px">
                          結尾
                        </Text>
                        <img
                          src={STICKY_PIECES[STICKY_PIECES.length - 1].imagePath}
                          alt="提示結尾便利貼"
                          draggable={false}
                          style={{
                            width: "48px",
                            height: "auto",
                            display: "block",
                            flexShrink: 0,
                          }}
                        />
                      </Flex>
                  </Flex>
                )}
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
      </Flex>
    </Flex>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type TidyItemId =
  | "vase"
  | "storage-box"
  | "clock"
  | "tv"
  | "calendar"
  | "photo-frame"
  | "bill";

type GamePhase = "playing" | "success";

type Point = {
  left: number;
  top: number;
};

type ItemDefinition = {
  id: TidyItemId;
  name: string;
  imagePath: string;
  final: Point & {
    width: number;
    height: number;
  };
  scatter: Point & {
    scale: number;
    rotateDeg: number;
  };
  viewIndex: number;
  kind?: "clock";
};

type DragSession = {
  pointerId: number;
  itemId: TidyItemId;
  grabOffsetX: number;
  grabOffsetY: number;
  currentLeft: number;
  currentTop: number;
  lastClientX: number;
  lastClientY: number;
  movementPx: number;
};

const WORLD_WIDTH = 1178;
const WORLD_HEIGHT = 852;
const VIEW_WIDTH = 440;
const VIEW_OFFSETS = [0, 369, 738] as const;
const ROOM_IMAGE = "/images/mini_game/room_tidy/room2-clean.png";
const COAT_IMAGE = "/images/mini_game/room_tidy/coat.png";
const SCARF_IMAGE = "/images/mini_game/room_tidy/scarf.png";
const ITEM_ORDER: TidyItemId[] = [
  "vase",
  "storage-box",
  "clock",
  "tv",
  "calendar",
  "photo-frame",
  "bill",
];

const ITEMS: Record<TidyItemId, ItemDefinition> = {
  vase: {
    id: "vase",
    name: "盆栽",
    imagePath: "/images/mini_game/room_tidy/vase.png",
    final: { left: 0, top: 416, width: 118, height: 420 },
    scatter: { left: 306, top: 420, scale: 0.58, rotateDeg: 4 },
    viewIndex: 0,
  },
  "storage-box": {
    id: "storage-box",
    name: "收納盒",
    imagePath: "/images/mini_game/room_tidy/storage-box.png",
    final: { left: 67, top: 541, width: 106, height: 61 },
    scatter: { left: 248, top: 686, scale: 0.88, rotateDeg: -6 },
    viewIndex: 0,
  },
  clock: {
    id: "clock",
    name: "時鐘",
    imagePath: "/images/mini_game/room_tidy/clock.png",
    final: { left: 161, top: 159, width: 113, height: 117 },
    scatter: { left: 48, top: 342, scale: 0.86, rotateDeg: -7 },
    viewIndex: 0,
    kind: "clock",
  },
  tv: {
    id: "tv",
    name: "電視",
    imagePath: "/images/mini_game/room_tidy/tv.png",
    final: { left: 356, top: 416, width: 305, height: 192 },
    scatter: { left: 455, top: 640, scale: 0.66, rotateDeg: 2 },
    viewIndex: 1,
  },
  calendar: {
    id: "calendar",
    name: "桌曆",
    imagePath: "/images/mini_game/room_tidy/calendar.png",
    final: { left: 704, top: 548, width: 81, height: 60 },
    scatter: { left: 685, top: 696, scale: 1, rotateDeg: 7 },
    viewIndex: 1,
  },
  "photo-frame": {
    id: "photo-frame",
    name: "相框",
    imagePath: "/images/mini_game/room_tidy/photo-frame.png",
    final: { left: 797, top: 542, width: 68, height: 62 },
    scatter: { left: 790, top: 690, scale: 1, rotateDeg: -8 },
    viewIndex: 2,
  },
  bill: {
    id: "bill",
    name: "帳單",
    imagePath: "/images/mini_game/room_tidy/bill.png",
    final: { left: 1001, top: 594, width: 68, height: 27 },
    scatter: { left: 1010, top: 714, scale: 1.16, rotateDeg: 9 },
    viewIndex: 2,
  },
};

const targetBreathe = keyframes`
  0%, 100% { opacity: 0.1; filter: grayscale(1) brightness(1.08); }
  50% { opacity: 0.2; filter: grayscale(0.7) brightness(1.16); }
`;

const successIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function getInitialPositions() {
  return Object.fromEntries(
    ITEM_ORDER.map((itemId) => [
      itemId,
      {
        left: ITEMS[itemId].scatter.left,
        top: ITEMS[itemId].scatter.top,
      },
    ]),
  ) as Record<TidyItemId, Point>;
}

function ItemArtwork({
  item,
  isTarget = false,
}: {
  item: ItemDefinition;
  isTarget?: boolean;
}) {
  if (item.kind === "clock") {
    return (
      <Box position="relative" w="100%" h="100%" pointerEvents="none">
        <Image
          src={item.imagePath}
          alt=""
          position="absolute"
          inset="0"
          w="100%"
          h="100%"
          objectFit="fill"
        />
        <Image
          src="/images/mini_game/room_tidy/clock-seven.png"
          alt=""
          position="absolute"
          left="38.94%"
          top="21.37%"
          w="13.27%"
          h="46.15%"
          objectFit="fill"
        />
      </Box>
    );
  }

  return (
    <Image
      src={item.imagePath}
      alt=""
      display="block"
      w="100%"
      h="100%"
      objectFit="fill"
      pointerEvents="none"
      opacity={isTarget ? 1 : undefined}
    />
  );
}

export function RoomTidyMinigame({
  onSkip,
  onComplete,
}: {
  onSkip: () => void;
  onComplete: () => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const ignoreNextClickRef = useRef(false);
  const successTimerRef = useRef<number | null>(null);
  const viewTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("playing");
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [positions, setPositions] = useState(getInitialPositions);
  const [placedIds, setPlacedIds] = useState<TidyItemId[]>([]);
  const [draggingId, setDraggingId] = useState<TidyItemId | null>(null);
  const [selectedId, setSelectedId] = useState<TidyItemId | null>(null);

  const placedSet = useMemo(() => new Set(placedIds), [placedIds]);
  const viewOffset = VIEW_OFFSETS[activeViewIndex] ?? 0;
  const itemsInActiveView = useMemo(
    () => ITEM_ORDER.filter((itemId) => ITEMS[itemId].viewIndex === activeViewIndex),
    [activeViewIndex],
  );
  const isActiveViewComplete = useMemo(
    () => itemsInActiveView.every((itemId) => placedSet.has(itemId)),
    [itemsInActiveView, placedSet],
  );

  useEffect(
    () => () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
      if (viewTimerRef.current !== null) {
        window.clearTimeout(viewTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isActiveViewComplete || placedIds.length === ITEM_ORDER.length) return;
    const nextIncompleteView = VIEW_OFFSETS.findIndex((_, index) =>
      ITEM_ORDER.some((itemId) => ITEMS[itemId].viewIndex === index && !placedSet.has(itemId)),
    );
    if (nextIncompleteView < 0 || nextIncompleteView === activeViewIndex) return;

    viewTimerRef.current = window.setTimeout(() => {
      setActiveViewIndex(nextIncompleteView);
      setSelectedId(null);
      viewTimerRef.current = null;
    }, 620);

    return () => {
      if (viewTimerRef.current !== null) {
        window.clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [activeViewIndex, isActiveViewComplete, placedIds.length, placedSet]);

  const placeItem = useCallback((itemId: TidyItemId) => {
    const item = ITEMS[itemId];
    setPositions((previous) => ({
      ...previous,
      [itemId]: {
        left: item.final.left,
        top: item.final.top,
      },
    }));
    setSelectedId(null);
    setPlacedIds((previous) => {
      if (previous.includes(itemId)) return previous;
      const next = [...previous, itemId];
      triggerHaptic(next.length === ITEM_ORDER.length ? [16, 30, 48] : 13);
      if (next.length === ITEM_ORDER.length) {
        successTimerRef.current = window.setTimeout(() => {
          setPhase("success");
          successTimerRef.current = null;
        }, 650);
      }
      return next;
    });
  }, []);

  const returnItemToScatter = useCallback((itemId: TidyItemId) => {
    const item = ITEMS[itemId];
    setPositions((previous) => ({
      ...previous,
      [itemId]: {
        left: item.scatter.left,
        top: item.scatter.top,
      },
    }));
    triggerHaptic(7);
  }, []);

  const resetGame = useCallback(() => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (viewTimerRef.current !== null) {
      window.clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
    dragSessionRef.current = null;
    ignoreNextClickRef.current = false;
    setPhase("playing");
    setActiveViewIndex(0);
    setPositions(getInitialPositions());
    setPlacedIds([]);
    setDraggingId(null);
    setSelectedId(null);
  }, []);

  const changeView = useCallback(
    (nextViewIndex: number) => {
      if (phase !== "playing") return;
      setActiveViewIndex(clamp(nextViewIndex, 0, VIEW_OFFSETS.length - 1));
      setSelectedId(null);
      dragSessionRef.current = null;
      setDraggingId(null);
    },
    [phase],
  );

  const getWorldPoint = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return null;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * VIEW_WIDTH + viewOffset,
        y: ((clientY - rect.top) / rect.height) * WORLD_HEIGHT,
      };
    },
    [viewOffset],
  );

  const handlePointerDown = useCallback(
    (itemId: TidyItemId, event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "playing" || placedSet.has(itemId)) return;
      const point = getWorldPoint(event.clientX, event.clientY);
      if (!point) return;
      const position = positions[itemId];

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      ignoreNextClickRef.current = false;
      dragSessionRef.current = {
        pointerId: event.pointerId,
        itemId,
        grabOffsetX: point.x - position.left,
        grabOffsetY: point.y - position.top,
        currentLeft: position.left,
        currentTop: position.top,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        movementPx: 0,
      };
      setDraggingId(itemId);
      triggerHaptic(5);
    },
    [getWorldPoint, phase, placedSet, positions],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragSessionRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const point = getWorldPoint(event.clientX, event.clientY);
      if (!point) return;

      event.preventDefault();
      const item = ITEMS[drag.itemId];
      const renderWidth = item.final.width * item.scatter.scale;
      const renderHeight = item.final.height * item.scatter.scale;
      const nextLeft = clamp(
        point.x - drag.grabOffsetX,
        viewOffset - 12,
        viewOffset + VIEW_WIDTH - renderWidth + 12,
      );
      const nextTop = clamp(point.y - drag.grabOffsetY, 96, WORLD_HEIGHT - renderHeight + 12);

      drag.movementPx += Math.hypot(
        event.clientX - drag.lastClientX,
        event.clientY - drag.lastClientY,
      );
      drag.lastClientX = event.clientX;
      drag.lastClientY = event.clientY;
      drag.currentLeft = nextLeft;
      drag.currentTop = nextTop;
      setPositions((previous) => ({
        ...previous,
        [drag.itemId]: { left: nextLeft, top: nextTop },
      }));
    },
    [getWorldPoint, viewOffset],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragSessionRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const item = ITEMS[drag.itemId];
      const renderWidth = item.final.width * item.scatter.scale;
      const renderHeight = item.final.height * item.scatter.scale;
      const centerX = drag.currentLeft + renderWidth / 2;
      const centerY = drag.currentTop + renderHeight / 2;
      const marginX = Math.max(24, item.final.width * 0.2);
      const marginY = Math.max(24, item.final.height * 0.14);
      const isCorrect =
        centerX >= item.final.left - marginX &&
        centerX <= item.final.left + item.final.width + marginX &&
        centerY >= item.final.top - marginY &&
        centerY <= item.final.top + item.final.height + marginY;

      dragSessionRef.current = null;
      setDraggingId(null);
      if (drag.movementPx < 7) return;
      ignoreNextClickRef.current = true;
      if (isCorrect) {
        placeItem(drag.itemId);
        return;
      }
      returnItemToScatter(drag.itemId);
    },
    [placeItem, returnItemToScatter],
  );

  const handleItemClick = useCallback(
    (itemId: TidyItemId) => {
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }
      if (phase !== "playing" || placedSet.has(itemId)) return;
      setSelectedId((current) => (current === itemId ? null : itemId));
    },
    [phase, placedSet],
  );

  const handleTargetClick = useCallback(
    (targetId: TidyItemId) => {
      if (phase !== "playing" || placedSet.has(targetId)) return;
      if (selectedId !== targetId) {
        triggerHaptic(7);
        return;
      }
      placeItem(targetId);
    },
    [phase, placeItem, placedSet, selectedId],
  );

  return (
    <Flex
      ref={stageRef}
      position="absolute"
      inset="0"
      zIndex={72}
      overflow="hidden"
      bgColor="#F3E4D1"
      userSelect="none"
      touchAction="none"
      data-room-tidy-game
      data-phase={phase}
      data-active-view={activeViewIndex}
      data-placed-count={placedIds.length}
    >
      <Box
        position="absolute"
        left="0"
        top="0"
        w={`${WORLD_WIDTH}px`}
        h={`${WORLD_HEIGHT}px`}
        transform={`translateX(-${viewOffset}px)`}
        transition="transform 430ms cubic-bezier(0.22, 0.8, 0.2, 1)"
      >
        <Image
          src={ROOM_IMAGE}
          alt=""
          position="absolute"
          inset="0"
          w={`${WORLD_WIDTH}px`}
          h={`${WORLD_HEIGHT}px`}
          maxW="none"
          objectFit="fill"
          pointerEvents="none"
        />

        <Image
          src={COAT_IMAGE}
          alt="已掛好的外套"
          position="absolute"
          left="791px"
          top="283px"
          w="209px"
          h="261px"
          objectFit="fill"
          pointerEvents="none"
        />
        <Image
          src={SCARF_IMAGE}
          alt="已掛好的圍巾"
          position="absolute"
          left="1024px"
          top="317px"
          w="90px"
          h="231px"
          objectFit="fill"
          pointerEvents="none"
        />

        {ITEM_ORDER.map((itemId) => {
          if (placedSet.has(itemId)) return null;
          const item = ITEMS[itemId];
          return (
            <Box
              key={`target-${itemId}`}
              as="button"
              aria-label={`把${item.name}放回這裡`}
              position="absolute"
              left={`${item.final.left}px`}
              top={`${item.final.top}px`}
              w={`${item.final.width}px`}
              h={`${item.final.height}px`}
              zIndex={4}
              cursor={selectedId === itemId ? "pointer" : "default"}
              opacity={selectedId && selectedId !== itemId ? 0.05 : 1}
              animation={`${targetBreathe} 1.9s ease-in-out infinite`}
              onClick={() => handleTargetClick(itemId)}
            >
              <ItemArtwork item={item} isTarget />
            </Box>
          );
        })}

        {ITEM_ORDER.map((itemId) => {
          const item = ITEMS[itemId];
          const isPlaced = placedSet.has(itemId);
          const isDragging = draggingId === itemId;
          const isSelected = selectedId === itemId;
          const position = positions[itemId];
          const scale = isPlaced ? 1 : item.scatter.scale;
          const renderWidth = item.final.width * scale;
          const renderHeight = item.final.height * scale;

          return (
            <Box
              key={itemId}
              role={isPlaced ? "img" : "button"}
              tabIndex={isPlaced ? -1 : 0}
              aria-label={isPlaced ? `已歸位的${item.name}` : `移動${item.name}`}
              data-tidy-item={itemId}
              data-placed={isPlaced ? "true" : "false"}
              position="absolute"
              left={`${position.left}px`}
              top={`${position.top}px`}
              w={`${renderWidth}px`}
              h={`${renderHeight}px`}
              zIndex={isDragging ? 24 : isPlaced ? 8 : isSelected ? 14 : 10}
              cursor={isPlaced ? "default" : isDragging ? "grabbing" : "grab"}
              touchAction="none"
              transition={
                isDragging
                  ? "none"
                  : "left 360ms cubic-bezier(0.2, 0.8, 0.2, 1), top 360ms cubic-bezier(0.2, 0.8, 0.2, 1), width 360ms ease, height 360ms ease, transform 180ms ease"
              }
              transform={`rotate(${isPlaced || isDragging ? 0 : item.scatter.rotateDeg}deg) scale(${
                isDragging ? 1.05 : isSelected ? 1.04 : 1
              })`}
              filter={
                isDragging
                  ? "drop-shadow(0 15px 13px rgba(59,42,32,0.29))"
                  : "drop-shadow(0 6px 6px rgba(59,42,32,0.18))"
              }
              outline={isSelected ? "3px solid rgba(221,161,100,0.58)" : "none"}
              outlineOffset="5px"
              borderRadius="8px"
              onPointerDown={(event) => handlePointerDown(itemId, event)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onClick={() => handleItemClick(itemId)}
            >
              <ItemArtwork item={item} />
            </Box>
          );
        })}
      </Box>

      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(91,65,47,0.2) 0%, transparent 18%, transparent 76%, rgba(72,52,40,0.12) 100%)"
        pointerEvents="none"
      />

      <Flex
        position="absolute"
        top="15px"
        left="15px"
        right="15px"
        zIndex={40}
        align="flex-start"
        justify="space-between"
        gap="10px"
      >
        <Flex
          px="13px"
          py="9px"
          direction="column"
          gap="2px"
          borderRadius="14px"
          bgColor="rgba(255,252,244,0.91)"
          boxShadow="0 5px 18px rgba(104,77,55,0.14)"
          backdropFilter="blur(7px)"
        >
          <Text color="#775B46" fontSize="15px" fontWeight="900" lineHeight="1.15">
            整理房間
          </Text>
          <Text color="#9A7C63" fontSize="10px" fontWeight="800">
            把散落的物品放回原位
          </Text>
        </Flex>

        <Flex direction="column" align="flex-end" gap="5px">
          <Text
            px="9px"
            py="4px"
            borderRadius="999px"
            bgColor="rgba(255,252,244,0.9)"
            color="#8D6C52"
            fontSize="11px"
            fontWeight="900"
          >
            {placedIds.length} / {ITEM_ORDER.length}
          </Text>
          {phase === "playing" ? (
            <Flex gap="4px">
              <Text
                as="button"
                px="6px"
                py="3px"
                color="rgba(91,69,52,0.62)"
                fontSize="10px"
                fontWeight="800"
                cursor="pointer"
                onClick={resetGame}
              >
                重來
              </Text>
              <Text
                as="button"
                px="6px"
                py="3px"
                color="rgba(91,69,52,0.48)"
                fontSize="10px"
                fontWeight="800"
                cursor="pointer"
                onClick={onSkip}
              >
                略過
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      {phase === "playing" ? (
        <>
          {activeViewIndex > 0 ? (
            <Flex
              as="button"
              aria-label="查看房間左側"
              position="absolute"
              left="10px"
              top="50%"
              zIndex={42}
              w="36px"
              h="52px"
              transform="translateY(-50%)"
              align="center"
              justify="center"
              borderRadius="999px"
              bgColor="rgba(255,250,240,0.78)"
              color="#916E54"
              boxShadow="0 5px 15px rgba(79,57,42,0.15)"
              backdropFilter="blur(5px)"
              cursor="pointer"
              onClick={() => changeView(activeViewIndex - 1)}
            >
              <Text fontSize="25px" fontWeight="900" lineHeight="1">
                ‹
              </Text>
            </Flex>
          ) : null}

          {activeViewIndex < VIEW_OFFSETS.length - 1 ? (
            <Flex
              as="button"
              aria-label="查看房間右側"
              position="absolute"
              right="10px"
              top="50%"
              zIndex={42}
              w="36px"
              h="52px"
              transform="translateY(-50%)"
              align="center"
              justify="center"
              borderRadius="999px"
              bgColor="rgba(255,250,240,0.78)"
              color="#916E54"
              boxShadow="0 5px 15px rgba(79,57,42,0.15)"
              backdropFilter="blur(5px)"
              cursor="pointer"
              onClick={() => changeView(activeViewIndex + 1)}
            >
              <Text fontSize="25px" fontWeight="900" lineHeight="1">
                ›
              </Text>
            </Flex>
          ) : null}

          <Flex
            position="absolute"
            left="50%"
            bottom="17px"
            zIndex={42}
            transform="translateX(-50%)"
            gap="7px"
            px="10px"
            py="7px"
            borderRadius="999px"
            bgColor="rgba(255,250,240,0.72)"
            backdropFilter="blur(4px)"
          >
            {VIEW_OFFSETS.map((_, index) => (
              <Box
                key={`view-dot-${index}`}
                as="button"
                aria-label={`查看房間第 ${index + 1} 區`}
                w={activeViewIndex === index ? "19px" : "7px"}
                h="7px"
                borderRadius="999px"
                bgColor={activeViewIndex === index ? "#B27B57" : "rgba(151,112,84,0.3)"}
                cursor="pointer"
                transition="width 180ms ease, background-color 180ms ease"
                onClick={() => changeView(index)}
              />
            ))}
          </Flex>
        </>
      ) : null}

      {phase === "success" ? (
        <>
          <Box
            position="absolute"
            inset="0"
            zIndex={44}
            bg="linear-gradient(180deg, transparent 49%, rgba(251,243,230,0.12) 63%, rgba(255,249,238,0.92) 100%)"
            pointerEvents="none"
          />
          <Flex
            position="absolute"
            left="20px"
            right="20px"
            bottom="28px"
            zIndex={46}
            direction="column"
            align="center"
            gap="10px"
            animation={`${successIn} 320ms ease-out both`}
          >
            <Text
              color="#765742"
              fontSize="21px"
              fontWeight="900"
              textShadow="0 2px 12px rgba(255,255,255,0.96)"
            >
              房間整理好了。
            </Text>
            <Text
              maxW="286px"
              color="#8C705B"
              fontSize="12px"
              fontWeight="800"
              lineHeight="1.7"
              textAlign="center"
            >
              每樣東西都有自己的位置，客廳看起來舒服多了。
            </Text>
            <Flex
              as="button"
              minW="72px"
              h="38px"
              px="20px"
              borderRadius="999px"
              align="center"
              justify="center"
              bgColor="#C9855E"
              color="#FFFDF8"
              boxShadow="0 7px 16px rgba(134,83,52,0.23)"
              cursor="pointer"
              onClick={onComplete}
            >
              <Text fontSize="20px" fontWeight="900" lineHeight="1">
                →
              </Text>
            </Flex>
          </Flex>
        </>
      ) : null}
    </Flex>
  );
}

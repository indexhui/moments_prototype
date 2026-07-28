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

type GarmentId = "short-scarf" | "coat" | "long-scarf";
type GamePhase = "playing" | "success";

type GarmentDefinition = {
  id: GarmentId;
  accessibleName: string;
  imagePath: string;
  widthPct: number;
  topPct: number;
  rank: number;
  rotateDeg: number;
};

type DragSession = {
  pointerId: number;
  garmentId: GarmentId;
  grabOffsetXPct: number;
  currentLeftPct: number;
  lastClientX: number;
  lastClientY: number;
  movementPx: number;
};

const ROOM_IMAGE = "/images/mini_game/laundry_hanging/room2-clean.png";
const SLOT_CENTER_PCTS = [23.5, 50.5, 78.2] as const;
const INITIAL_ORDER: GarmentId[] = ["long-scarf", "short-scarf", "coat"];
const CORRECT_ORDERS: GarmentId[][] = [
  ["short-scarf", "coat", "long-scarf"],
  ["long-scarf", "coat", "short-scarf"],
];

const GARMENTS: Record<GarmentId, GarmentDefinition> = {
  "short-scarf": {
    id: "short-scarf",
    accessibleName: "第一條圍巾",
    imagePath: "/images/mini_game/laundry_hanging/scarf.png",
    widthPct: 12,
    topPct: 34.8,
    rank: 0,
    rotateDeg: -1,
  },
  coat: {
    id: "coat",
    accessibleName: "外套",
    imagePath: "/images/mini_game/laundry_hanging/coat.png",
    widthPct: 34,
    topPct: 34.8,
    rank: 1,
    rotateDeg: 0,
  },
  "long-scarf": {
    id: "long-scarf",
    accessibleName: "第二條圍巾",
    imagePath: "/images/mini_game/laundry_hanging/scarf.png",
    widthPct: 21.5,
    topPct: 34.8,
    rank: 2,
    rotateDeg: 1,
  },
};

const successIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const selectedBreathe = keyframes`
  0%, 100% { filter: drop-shadow(0 7px 7px rgba(80,56,42,0.2)); }
  50% { filter: drop-shadow(0 10px 12px rgba(203,133,82,0.46)); }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function isCorrectOrder(order: GarmentId[]) {
  return CORRECT_ORDERS.some((correctOrder) =>
    order.every((garmentId, index) => garmentId === correctOrder[index]),
  );
}

function getNearestSlotIndex(centerPct: number) {
  return SLOT_CENTER_PCTS.reduce(
    (bestIndex, slotCenter, index, centers) =>
      Math.abs(slotCenter - centerPct) < Math.abs(centers[bestIndex] - centerPct)
        ? index
        : bestIndex,
    0,
  );
}

export function LaundryHangingSortMinigame({
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

  const [phase, setPhase] = useState<GamePhase>("playing");
  const [order, setOrder] = useState<GarmentId[]>(INITIAL_ORDER);
  const [draggingId, setDraggingId] = useState<GarmentId | null>(null);
  const [dragLeftPct, setDragLeftPct] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<GarmentId | null>(null);
  const [moveCount, setMoveCount] = useState(0);

  const solved = useMemo(() => isCorrectOrder(order), [order]);

  useEffect(
    () => () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!solved || moveCount === 0 || phase !== "playing") return;
    triggerHaptic([16, 28, 48]);
    successTimerRef.current = window.setTimeout(() => {
      setPhase("success");
      successTimerRef.current = null;
    }, 620);

    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, [moveCount, phase, solved]);

  const swapGarments = useCallback(
    (firstId: GarmentId, secondId: GarmentId) => {
      if (firstId === secondId || phase !== "playing") return;

      setOrder((previous) => {
        const firstIndex = previous.indexOf(firstId);
        const secondIndex = previous.indexOf(secondId);
        if (firstIndex < 0 || secondIndex < 0) return previous;

        const next = [...previous];
        next[firstIndex] = secondId;
        next[secondIndex] = firstId;
        return next;
      });
      setMoveCount((count) => count + 1);
      setSelectedId(null);
      triggerHaptic(12);
    },
    [phase],
  );

  const moveGarmentToSlot = useCallback(
    (garmentId: GarmentId, targetSlotIndex: number) => {
      const sourceSlotIndex = order.indexOf(garmentId);
      if (sourceSlotIndex < 0 || sourceSlotIndex === targetSlotIndex) {
        return;
      }
      const targetGarmentId = order[targetSlotIndex];
      if (!targetGarmentId) return;
      swapGarments(garmentId, targetGarmentId);
    },
    [order, swapGarments],
  );

  const resetGame = useCallback(() => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    dragSessionRef.current = null;
    ignoreNextClickRef.current = false;
    setPhase("playing");
    setOrder(INITIAL_ORDER);
    setDraggingId(null);
    setDragLeftPct(null);
    setSelectedId(null);
    setMoveCount(0);
  }, []);

  const getStageXPct = useCallback((clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return ((clientX - rect.left) / rect.width) * 100;
  }, []);

  const handlePointerDown = useCallback(
    (garmentId: GarmentId, event: ReactPointerEvent<HTMLDivElement>) => {
      if (phase !== "playing") return;
      const stageXPct = getStageXPct(event.clientX);
      if (stageXPct === null) return;

      const slotIndex = order.indexOf(garmentId);
      const garment = GARMENTS[garmentId];
      const leftPct = SLOT_CENTER_PCTS[slotIndex] - garment.widthPct / 2;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      ignoreNextClickRef.current = false;
      dragSessionRef.current = {
        pointerId: event.pointerId,
        garmentId,
        grabOffsetXPct: stageXPct - leftPct,
        currentLeftPct: leftPct,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        movementPx: 0,
      };
      setDraggingId(garmentId);
      setDragLeftPct(leftPct);
      triggerHaptic(5);
    },
    [getStageXPct, order, phase],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragSessionRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const stageXPct = getStageXPct(event.clientX);
      if (stageXPct === null) return;

      event.preventDefault();
      const garment = GARMENTS[drag.garmentId];
      const nextLeftPct = clamp(
        stageXPct - drag.grabOffsetXPct,
        -2,
        102 - garment.widthPct,
      );
      drag.movementPx += Math.hypot(
        event.clientX - drag.lastClientX,
        event.clientY - drag.lastClientY,
      );
      drag.lastClientX = event.clientX;
      drag.lastClientY = event.clientY;
      drag.currentLeftPct = nextLeftPct;
      setDragLeftPct(nextLeftPct);
    },
    [getStageXPct],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragSessionRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      dragSessionRef.current = null;
      setDraggingId(null);
      setDragLeftPct(null);

      if (drag.movementPx < 7) return;
      ignoreNextClickRef.current = true;
      const garment = GARMENTS[drag.garmentId];
      const centerPct = drag.currentLeftPct + garment.widthPct / 2;
      moveGarmentToSlot(drag.garmentId, getNearestSlotIndex(centerPct));
    },
    [moveGarmentToSlot],
  );

  const handleGarmentClick = useCallback(
    (garmentId: GarmentId) => {
      if (ignoreNextClickRef.current) {
        ignoreNextClickRef.current = false;
        return;
      }
      if (phase !== "playing") return;

      if (!selectedId) {
        setSelectedId(garmentId);
        return;
      }
      if (selectedId === garmentId) {
        setSelectedId(null);
        return;
      }
      swapGarments(selectedId, garmentId);
    },
    [phase, selectedId, swapGarments],
  );

  return (
    <Flex
      ref={stageRef}
      position="absolute"
      inset="0"
      zIndex={72}
      direction="column"
      overflow="hidden"
      bgColor="#F3E4D1"
      userSelect="none"
      touchAction="none"
      data-laundry-hanging-game
      data-phase={phase}
      data-order={order.join(",")}
      data-move-count={moveCount}
    >
      <Image
        src={ROOM_IMAGE}
        alt=""
        position="absolute"
        top="0"
        right="0"
        h="100%"
        w="auto"
        maxW="none"
        pointerEvents="none"
      />

      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(91,65,47,0.2) 0%, transparent 19%, transparent 67%, rgba(72,52,40,0.15) 100%)"
        pointerEvents="none"
      />

      <Flex
        position="absolute"
        top="15px"
        left="15px"
        right="15px"
        zIndex={30}
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
            排好衣服
          </Text>
          <Text color="#9A7C63" fontSize="10px" fontWeight="800">
            依長度排整齊，方向不限
          </Text>
        </Flex>

        {phase === "playing" ? (
          <Flex pt="3px" gap="4px">
            <Text
              as="button"
              px="7px"
              py="5px"
              borderRadius="999px"
              bgColor="rgba(255,252,244,0.84)"
              color="rgba(91,69,52,0.64)"
              fontSize="10px"
              fontWeight="800"
              cursor="pointer"
              onClick={resetGame}
            >
              重來
            </Text>
            <Text
              as="button"
              px="7px"
              py="5px"
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

      {SLOT_CENTER_PCTS.map((centerPct, index) => (
        <Box
          key={`slot-${centerPct}`}
          position="absolute"
          left={`${centerPct}%`}
          top="31.8%"
          zIndex={3}
          transform="translateX(-50%)"
          pointerEvents="none"
        >
          <Box
            w="8px"
            h="8px"
            borderRadius="999px"
            bgColor={
              phase === "success" ? "rgba(126,159,116,0.72)" : "rgba(180,132,91,0.38)"
            }
            boxShadow="0 1px 5px rgba(72,50,37,0.16)"
          />
          <Text
            position="absolute"
            top="-21px"
            left="50%"
            transform="translateX(-50%)"
            color="rgba(119,89,67,0.55)"
            fontSize="9px"
            fontWeight="900"
          >
            {index + 1}
          </Text>
        </Box>
      ))}

      {order.map((garmentId, slotIndex) => {
        const garment = GARMENTS[garmentId];
        const isDragging = draggingId === garmentId;
        const isSelected = selectedId === garmentId;
        const leftPct =
          isDragging && dragLeftPct !== null
            ? dragLeftPct
            : SLOT_CENTER_PCTS[slotIndex] - garment.widthPct / 2;

        return (
          <Box
            key={garmentId}
            role="button"
            tabIndex={0}
            aria-label={`移動${garment.accessibleName}`}
            data-garment-id={garmentId}
            data-slot-index={slotIndex}
            position="absolute"
            left={`${leftPct}%`}
            top={`${garment.topPct}%`}
            w={`${garment.widthPct}%`}
            zIndex={isDragging ? 24 : isSelected ? 14 : 10}
            cursor={phase === "playing" ? (isDragging ? "grabbing" : "grab") : "default"}
            touchAction="none"
            transition={
              isDragging
                ? "none"
                : "left 390ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 180ms ease"
            }
            transform={`rotate(${isDragging ? 0 : garment.rotateDeg}deg) scale(${
              isDragging ? 1.06 : isSelected ? 1.04 : 1
            })`}
            filter={
              isDragging
                ? "drop-shadow(0 16px 14px rgba(59,42,32,0.3))"
                : "drop-shadow(0 7px 7px rgba(59,42,32,0.2))"
            }
            outline={isSelected ? "3px solid rgba(221,161,100,0.56)" : "none"}
            outlineOffset="5px"
            borderRadius="10px"
            animation={isSelected ? `${selectedBreathe} 1.35s ease-in-out infinite` : undefined}
            onPointerDown={(event) => handlePointerDown(garmentId, event)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onClick={() => handleGarmentClick(garmentId)}
          >
            <Image
              src={garment.imagePath}
              alt=""
              display="block"
              w="100%"
              h="auto"
              pointerEvents="none"
            />
          </Box>
        );
      })}

      {phase === "success" ? (
        <>
          <Box
            position="absolute"
            inset="0"
            zIndex={18}
            bg="linear-gradient(180deg, transparent 48%, rgba(251,243,230,0.1) 62%, rgba(255,249,238,0.91) 100%)"
            pointerEvents="none"
          />
          <Flex
            position="absolute"
            left="20px"
            right="20px"
            bottom="28px"
            zIndex={22}
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
              整齊了。
            </Text>
            <Text
              maxW="286px"
              color="#8C705B"
              fontSize="12px"
              fontWeight="800"
              lineHeight="1.7"
              textAlign="center"
            >
              依長度排成一列，拿衣服時一眼就找得到。
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

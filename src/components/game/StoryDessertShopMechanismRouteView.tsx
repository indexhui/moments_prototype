"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { FiHelpCircle, FiRefreshCw } from "react-icons/fi";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { getFrogDiaryClueStageByAttempt } from "@/lib/game/frogDiaryClueFlow";
import { loadPlayerProgress, recordArrangeRouteDeparture } from "@/lib/game/playerProgress";

type SlidingTileId =
  | "vertical"
  | "corner-bottom-right"
  | "horizontal"
  | "corner-left-top"
  | "decoy-corner";

type SlidingSlot = SlidingTileId | null;

const CELL_SIZE = 88;
const CELL_GAP = 5;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const BOARD_WIDTH = CELL_SIZE * 3 + CELL_GAP * 2;
const BOARD_HEIGHT = CELL_SIZE * 4 + CELL_GAP * 3;
const ROUTE_COMPLETE_DELAY_MS = 1050;

const STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight.png";
const CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const DESSERT_SHOP_IMAGE_PATH = "/images/route/route_new/wide_to_narrow_早餐店.png";

const INITIAL_SLOTS: SlidingSlot[] = [
  "vertical",
  "corner-bottom-right",
  "corner-left-top",
  "horizontal",
  "decoy-corner",
  null,
];

const SOLVED_ROUTE_SLOTS: SlidingTileId[] = [
  "corner-bottom-right",
  "horizontal",
  "corner-left-top",
  "vertical",
];

const TILE_VISUALS: Record<
  SlidingTileId,
  { imagePath: string; rotationDeg: number; label: string }
> = {
  vertical: {
    imagePath: STRAIGHT_IMAGE_PATH,
    rotationDeg: 0,
    label: "直線道路拼圖",
  },
  "corner-bottom-right": {
    imagePath: CORNER_IMAGE_PATH,
    rotationDeg: 180,
    label: "右下轉彎拼圖",
  },
  horizontal: {
    imagePath: STRAIGHT_IMAGE_PATH,
    rotationDeg: 90,
    label: "橫向道路拼圖",
  },
  "corner-left-top": {
    imagePath: CORNER_IMAGE_PATH,
    rotationDeg: 0,
    label: "左上轉彎拼圖",
  },
  "decoy-corner": {
    imagePath: CORNER_IMAGE_PATH,
    rotationDeg: 90,
    label: "右上轉彎拼圖",
  },
};

const tutorialModalEnter = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const tutorialCardIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const tutorialStraightMove = keyframes`
  0%, 15% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
  19% { transform: translate3d(0, 0, 0) scale(0.94); border-radius: 8px; }
  29%, 83% { transform: translate3d(0, -86px, 0) scale(1); border-radius: 8px; }
  87%, 91% { transform: translate3d(-8px, -86px, 0) scale(1); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
`;

const tutorialRightCornerMove = keyframes`
  0%, 30% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
  34% { transform: translate3d(0, 0, 0) scale(0.94); border-radius: 8px; }
  45%, 83% { transform: translate3d(86px, 0, 0) scale(1); border-radius: 8px; }
  87%, 91% { transform: translate3d(78px, -8px, 0) scale(1); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
`;

const tutorialDownCornerMove = keyframes`
  0%, 50% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
  54% { transform: translate3d(0, 0, 0) scale(0.94); border-radius: 8px; }
  65%, 83% { transform: translate3d(0, 86px, 0) scale(1); border-radius: 8px; }
  87%, 91% { transform: translate3d(0, 78px, 0) scale(1); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0) scale(1); border-radius: 8px; }
`;

const tutorialSlotTopRightMerge = keyframes`
  0%, 83% { transform: translate3d(0, 0, 0); border-radius: 8px; }
  87%, 91% { transform: translate3d(-8px, 0, 0); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0); border-radius: 8px; }
`;

const tutorialSlotBottomLeftMerge = keyframes`
  0%, 83% { transform: translate3d(0, 0, 0); border-radius: 8px; }
  87%, 91% { transform: translate3d(0, -8px, 0); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0); border-radius: 8px; }
`;

const tutorialSlotBottomRightMerge = keyframes`
  0%, 83% { transform: translate3d(0, 0, 0); border-radius: 8px; }
  87%, 91% { transform: translate3d(-8px, -8px, 0); border-radius: 0; }
  91.01%, 100% { transform: translate3d(0, 0, 0); border-radius: 8px; }
`;

const tutorialSequencePointer = keyframes`
  0%, 10%, 26%, 29%, 42%, 46%, 59%, 95%, 100% { opacity: 0; }
  12% { opacity: 1; left: 126px; top: 126px; transform: scale(1); }
  18%, 21% { opacity: 1; left: 126px; top: 126px; transform: scale(0.8); }
  31% { opacity: 1; left: 40px; top: 126px; transform: scale(1); }
  35%, 38% { opacity: 1; left: 40px; top: 126px; transform: scale(0.8); }
  48% { opacity: 1; left: 40px; top: 40px; transform: scale(1); }
  53%, 56% { opacity: 1; left: 40px; top: 40px; transform: scale(0.8); }
`;

const successPop = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

function getCentralSlotPosition(index: number) {
  const row = index < 3 ? 1 : 2;
  const col = index % 3;
  return {
    left: `${col * CELL_STEP}px`,
    top: `${row * CELL_STEP}px`,
  };
}

function getFixedPosition(row: number, col: number) {
  return {
    left: `${col * CELL_STEP}px`,
    top: `${row * CELL_STEP}px`,
  };
}

function areSlotsAdjacent(first: number, second: number) {
  const firstRow = Math.floor(first / 3);
  const firstCol = first % 3;
  const secondRow = Math.floor(second / 3);
  const secondCol = second % 3;
  return Math.abs(firstRow - secondRow) + Math.abs(firstCol - secondCol) === 1;
}

function isSolved(slots: SlidingSlot[]) {
  return SOLVED_ROUTE_SLOTS.every((tileId, index) => tileId === slots[index]);
}

function FixedBoardTile({
  row,
  col,
  children,
}: {
  row: number;
  col: number;
  children: ReactNode;
}) {
  return (
    <Flex
      position="absolute"
      {...getFixedPosition(row, col)}
      w={`${CELL_SIZE}px`}
      h={`${CELL_SIZE}px`}
      borderRadius="13px"
      border="3px solid #8E7962"
      bgColor="#D9C29E"
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      boxShadow="0 4px 0 rgba(128,91,60,0.2)"
      zIndex={4}
    >
      {children}
    </Flex>
  );
}

function SlidingRouteTile({
  tileId,
  slotIndex,
  isMovable,
  isRouteSolved,
  onClick,
}: {
  tileId: SlidingTileId;
  slotIndex: number;
  isMovable: boolean;
  isRouteSolved: boolean;
  onClick: () => void;
}) {
  const visual = TILE_VISUALS[tileId];
  const canMove = isMovable && !isRouteSolved;
  return (
    <Flex
      as="button"
      aria-label={`${visual.label}${canMove ? "，可滑動" : ""}`}
      aria-disabled={!canMove}
      position="absolute"
      {...getCentralSlotPosition(slotIndex)}
      w={`${CELL_SIZE}px`}
      h={`${CELL_SIZE}px`}
      borderRadius="13px"
      border={isRouteSolved ? "3px solid #76956B" : "3px solid #8E7962"}
      bgColor="#D9C29E"
      overflow="hidden"
      boxShadow="0 4px 0 rgba(128,91,60,0.2)"
      transition="left 280ms cubic-bezier(0.34, 1.25, 0.64, 1), top 280ms cubic-bezier(0.34, 1.25, 0.64, 1), border-color 180ms ease"
      cursor={canMove ? "pointer" : "default"}
      onClick={onClick}
      zIndex={8}
      _focusVisible={{ outline: "3px solid #FFFFFF", outlineOffset: "2px" }}
    >
      <Image
        src={visual.imagePath}
        alt={visual.label}
        w="100%"
        h="100%"
        objectFit="cover"
        transform={`rotate(${visual.rotationDeg}deg) scale(1.04)`}
        draggable={false}
        pointerEvents="none"
      />
    </Flex>
  );
}

function SlidingRouteTutorial({ onClose }: { onClose: () => void }) {
  const animationDuration = "6.4s";
  const tutorialCellSize = 78;
  const tutorialCellStep = 86;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={40}
      bgColor="rgba(91,67,48,0.52)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${tutorialModalEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        px="20px"
        pt="18px"
        pb="10px"
        bgColor="#FFFDF7"
        borderRadius="16px"
        boxShadow="0 14px 28px rgba(62,45,26,0.24)"
        animation={`${tutorialCardIn} 240ms ease-out both`}
      >
        <Flex direction="column" alignItems="center" gap="3px">
          <Text color="#81624B" fontSize="22px" fontWeight="900" lineHeight="1.45">
            移動拼圖完成路徑
          </Text>
          <Text color="#81624B" fontSize="14px" fontWeight="700" lineHeight="1.5">
            點擊鄰近空格處的拼圖來進行移動
          </Text>
        </Flex>

        <Box
          position="relative"
          w="294px"
          h="203px"
          mx="auto"
          mt="14px"
          bgColor="#FEF6EA"
          overflow="hidden"
          aria-label="三塊道路拼圖依序滑動三次，最後連成完整路徑的循環示意動畫"
        >
          <Box
            position="absolute"
            left="65px"
            top="20px"
            w={`${tutorialCellSize * 2 + 8}px`}
            h={`${tutorialCellSize * 2 + 8}px`}
          >
            {[
              { left: 0, top: 0, animation: undefined },
              { left: tutorialCellStep, top: 0, animation: tutorialSlotTopRightMerge },
              { left: 0, top: tutorialCellStep, animation: tutorialSlotBottomLeftMerge },
              {
                left: tutorialCellStep,
                top: tutorialCellStep,
                animation: tutorialSlotBottomRightMerge,
              },
            ].map((emptySlot) => (
              <Box
                key={`${emptySlot.left}-${emptySlot.top}`}
                position="absolute"
                left={`${emptySlot.left}px`}
                top={`${emptySlot.top}px`}
                w={`${tutorialCellSize}px`}
                h={`${tutorialCellSize}px`}
                borderRadius="8px"
                bgColor="#FFFFFF"
                boxShadow="0 2px 7px rgba(129,98,75,0.08)"
                animation={
                  emptySlot.animation
                    ? `${emptySlot.animation} ${animationDuration} ease-in-out infinite`
                    : undefined
                }
                zIndex={1}
              />
            ))}

            <Flex
              position="absolute"
              left={`${tutorialCellStep}px`}
              top={`${tutorialCellStep}px`}
              w={`${tutorialCellSize}px`}
              h={`${tutorialCellSize}px`}
              borderRadius="8px"
              overflow="hidden"
              animation={`${tutorialStraightMove} ${animationDuration} ease-in-out infinite`}
              zIndex={2}
            >
              <Image
                src={STRAIGHT_IMAGE_PATH}
                alt="直線道路拼圖"
                w="100%"
                h="100%"
                objectFit="cover"
                transform="scale(1.04)"
                draggable={false}
              />
            </Flex>

            <Flex
              position="absolute"
              left="0"
              top={`${tutorialCellStep}px`}
              w={`${tutorialCellSize}px`}
              h={`${tutorialCellSize}px`}
              borderRadius="8px"
              overflow="hidden"
              animation={`${tutorialRightCornerMove} ${animationDuration} ease-in-out infinite`}
              zIndex={2}
            >
              <Image
                src={CORNER_IMAGE_PATH}
                alt="左上轉彎道路拼圖"
                w="100%"
                h="100%"
                objectFit="cover"
                transform="scale(1.04)"
                draggable={false}
              />
            </Flex>

            <Flex
              position="absolute"
              left="0"
              top="0"
              w={`${tutorialCellSize}px`}
              h={`${tutorialCellSize}px`}
              borderRadius="8px"
              overflow="hidden"
              animation={`${tutorialDownCornerMove} ${animationDuration} ease-in-out infinite`}
              zIndex={2}
            >
              <Image
                src={CORNER_IMAGE_PATH}
                alt="右下轉彎道路拼圖"
                w="100%"
                h="100%"
                objectFit="cover"
                transform="rotate(180deg) scale(1.04)"
                draggable={false}
              />
            </Flex>

            <Image
              src="/images/pointer_up.png"
              alt=""
              aria-hidden="true"
              position="absolute"
              left="126px"
              top="126px"
              w="36px"
              h="36px"
              objectFit="contain"
              filter="drop-shadow(0 4px 6px rgba(66,45,29,0.24))"
              animation={`${tutorialSequencePointer} ${animationDuration} linear infinite`}
              zIndex={4}
              pointerEvents="none"
            />
          </Box>
        </Box>

        <Flex
          as="button"
          h="50px"
          mt="12px"
          borderRadius="999px"
          bgColor="#976F54"
          color="white"
          alignItems="center"
          justifyContent="center"
          fontSize="21px"
          fontWeight="700"
          cursor="pointer"
          onClick={onClose}
        >
          開始
        </Flex>
      </Flex>
    </Flex>
  );
}

export function StoryDessertShopMechanismRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const [slots, setSlots] = useState<SlidingSlot[]>(INITIAL_SLOTS);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [hint, setHint] = useState("點擊空格旁的拼圖，讓道路滑動。");

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, []);

  const routeSolved = isSolved(slots);
  const emptySlotIndex = slots.indexOf(null);

  const moveTile = useCallback(
    (tileId: SlidingTileId) => {
      if (isComplete || routeSolved) return;
      const tileSlotIndex = slots.indexOf(tileId);
      const currentEmptySlotIndex = slots.indexOf(null);
      if (!areSlotsAdjacent(tileSlotIndex, currentEmptySlotIndex)) {
        setHint("這塊拼圖碰不到空格，請先移動空格旁的拼圖。");
        return;
      }

      const nextSlots = [...slots];
      nextSlots[currentEmptySlotIndex] = tileId;
      nextSlots[tileSlotIndex] = null;
      setSlots(nextSlots);
      setHint(
        isSolved(nextSlots)
          ? "道路接通了！現在可以出發前往甜點店。"
          : "拼圖滑進空格了，繼續調整道路。",
      );
    },
    [isComplete, routeSolved, slots],
  );

  const resetPuzzle = useCallback(() => {
    if (isComplete) return;
    setSlots(INITIAL_SLOTS);
    setHint("點擊空格旁的拼圖，讓道路滑動。");
  }, [isComplete]);

  const depart = useCallback(() => {
    if (!routeSolved || hasCompletedRef.current) {
      setHint("先把公司到甜點店的道路完整接起來。");
      return;
    }

    hasCompletedRef.current = true;
    setIsComplete(true);
    setHint("找到甜點店了！");
    recordArrangeRouteDeparture();
    onProgressSaved?.();
    completionTimerRef.current = setTimeout(() => {
      const eventId = getFrogDiaryClueStageByAttempt(
        loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount,
      ).eventId;
      router.push(
        withTrialProfileSearch(
          `${ROUTES.gameArrangeRoute}?eventId=${eventId}&frogReturn=offwork`,
        ),
      );
    }, ROUTE_COMPLETE_DELAY_MS);
  }, [onProgressSaved, routeSolved, router]);

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      direction="column"
      bgColor="#FDF6EA"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <Flex h="56px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
        <Text color="white" fontSize="18px" fontWeight="900">
          尋找甜點店
        </Text>
        <Flex
          as="button"
          ml="auto"
          w="34px"
          h="34px"
          borderRadius="50%"
          bgColor="rgba(255,255,255,0.16)"
          color="white"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          aria-label="查看玩法"
          onClick={() => setIsTutorialOpen(true)}
        >
          <FiHelpCircle size={19} />
        </Flex>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        alignItems="center"
        justifyContent="center"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/events/frog-dessert-shop/sliding-puzzle-background-integrated-v2.png')"
        backgroundSize="cover"
        backgroundPosition="center"
        px="12px"
        py="12px"
      >
        <Flex
          w="316px"
          h="430px"
          borderRadius="24px"
          bgColor="rgba(255,248,235,0.84)"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 8px 20px rgba(139,102,72,0.11)"
        >
          <Box position="relative" w={`${BOARD_WIDTH}px`} h={`${BOARD_HEIGHT}px`}>
            {Array.from({ length: 6 }).map((_, slotIndex) => (
              <Flex
                key={`slot-${slotIndex}`}
                position="absolute"
                {...getCentralSlotPosition(slotIndex)}
                w={`${CELL_SIZE}px`}
                h={`${CELL_SIZE}px`}
                borderRadius="13px"
                border="2px dashed rgba(159,125,92,0.38)"
                bgColor={slotIndex === emptySlotIndex ? "rgba(255,251,239,0.88)" : "rgba(255,255,255,0.24)"}
                alignItems="center"
                justifyContent="center"
                zIndex={1}
              />
            ))}

            <FixedBoardTile row={0} col={2}>
              <Image
                src={DESSERT_SHOP_IMAGE_PATH}
                alt="甜點店"
                w="100%"
                h="100%"
                objectFit="cover"
                transform="scale(1.04)"
                draggable={false}
              />
              <Flex
                position="absolute"
                top="5px"
                left="50%"
                transform="translateX(-50%)"
                px="7px"
                h="19px"
                borderRadius="999px"
                bgColor="rgba(255,250,238,0.92)"
                color="#8A6045"
                alignItems="center"
                fontSize="10px"
                fontWeight="900"
                whiteSpace="nowrap"
              >
                甜點店
              </Flex>
            </FixedBoardTile>

            <FixedBoardTile row={3} col={0}>
              <Image
                src={STRAIGHT_IMAGE_PATH}
                alt="公司前的道路"
                w="100%"
                h="100%"
                objectFit="cover"
                transform="scale(1.04)"
                draggable={false}
              />
              <Flex
                position="absolute"
                left="7px"
                right="7px"
                bottom="4px"
                h="43px"
                borderRadius="8px"
                bgColor="rgba(255,247,229,0.92)"
                alignItems="center"
                justifyContent="center"
                direction="column"
                boxShadow="0 -1px 0 rgba(125,94,66,0.12)"
              >
                <Image src="/images/icon/company.png" alt="公司" w="29px" h="27px" objectFit="contain" />
                <Text color="#815E43" fontSize="9px" fontWeight="900" lineHeight="1">
                  公司
                </Text>
              </Flex>
            </FixedBoardTile>

            {slots.map((tileId, slotIndex) =>
              tileId ? (
                <SlidingRouteTile
                  key={tileId}
                  tileId={tileId}
                  slotIndex={slotIndex}
                  isMovable={areSlotsAdjacent(slotIndex, emptySlotIndex)}
                  isRouteSolved={routeSolved}
                  onClick={() => moveTile(tileId)}
                />
              ) : null,
            )}
          </Box>
        </Flex>
      </Flex>

      <Flex h="54px" flexShrink={0} bgColor="#B88E6D" alignItems="center" px="18px" gap="12px">
        <Text color="white" fontSize="14px" fontWeight="900">
          滑動拼圖接路
        </Text>
        <Text color="rgba(255,255,255,0.8)" fontSize="12px" fontWeight="800">
          {routeSolved ? "道路已接通" : "自由調整"}
        </Text>
        <Flex
          as="button"
          ml="auto"
          h="32px"
          px="13px"
          borderRadius="999px"
          bgColor="white"
          color="#8F694E"
          alignItems="center"
          gap="5px"
          cursor={isComplete ? "default" : "pointer"}
          opacity={isComplete ? 0.55 : 1}
          onClick={resetPuzzle}
        >
          <FiRefreshCw size={13} />
          <Text fontSize="12px" fontWeight="900">
            重來
          </Text>
        </Flex>
      </Flex>

      <Flex
        h="54px"
        flexShrink={0}
        bgColor="#F8E7CC"
        px="18px"
        alignItems="center"
        justifyContent="center"
        borderBottom="1px solid rgba(176,132,91,0.12)"
      >
        <Text color="#936F53" fontSize="13px" fontWeight="900" lineHeight="1.45" textAlign="center">
          {hint}
        </Text>
      </Flex>

      <Flex
        h="80px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent="flex-end"
        px="18px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
      >
        <Flex
          as="button"
          w="132px"
          h="46px"
          borderRadius="999px"
          bgColor={routeSolved ? "#FFF9ED" : "rgba(255,255,255,0.48)"}
          color={routeSolved ? "#8A6143" : "rgba(119,84,61,0.56)"}
          alignItems="center"
          justifyContent="center"
          fontSize="18px"
          fontWeight="900"
          cursor={routeSolved ? "pointer" : "not-allowed"}
          boxShadow={routeSolved ? "0 4px 0 rgba(116,77,51,0.2)" : "none"}
          onClick={depart}
        >
          出發
        </Flex>
      </Flex>

      {isTutorialOpen && !isComplete ? (
        <SlidingRouteTutorial onClose={() => setIsTutorialOpen(false)} />
      ) : null}

      {isComplete ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={50}
          bgColor="rgba(92,67,47,0.54)"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Flex
            px="34px"
            py="24px"
            borderRadius="24px"
            bgColor="#FFF9ED"
            direction="column"
            alignItems="center"
            gap="8px"
            boxShadow="0 18px 40px rgba(70,49,34,0.3)"
            animation={`${successPop} 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both`}
          >
            <Text fontSize="30px">🍰</Text>
            <Text color="#8A6145" fontSize="21px" fontWeight="900">
              找到甜點店了！
            </Text>
            <Text color="#A17B5E" fontSize="13px" fontWeight="800">
              道路拼圖順利接通
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

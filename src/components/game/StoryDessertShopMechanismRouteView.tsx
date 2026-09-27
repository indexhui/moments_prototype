"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { DessertRouteDepartureBadge } from "@/components/game/DessertRouteDepartureBadge";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { getFrogDiaryClueStageByAttempt } from "@/lib/game/frogDiaryClueFlow";
import { loadPlayerProgress, recordArrangeRouteDeparture } from "@/lib/game/playerProgress";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import {
  INITIAL_DESSERT_ROUTE_SLOTS as INITIAL_SLOTS,
  areDessertRouteSlotsAdjacent as areSlotsAdjacent,
  getConnectedDessertRoute,
  solveDessertRoute,
  type SlidingTileId,
  type SlidingSlot,
} from "@/lib/game/dessertShopRoutePuzzle";

const CELL_SIZE = 88;
const CELL_GAP = 5;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const BOARD_WIDTH = CELL_SIZE * 3 + CELL_GAP * 2;
const BOARD_HEIGHT = CELL_SIZE * 4 + CELL_GAP * 3;
const ROUTE_COMPLETE_DELAY_MS = 1050;

const STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight.png";
const CORNER_IMAGE_PATH = "/images/route/normal_corner_leftTop.png";
const DESSERT_SHOP_IMAGE_PATH = "/images/dessert_shop/wide_to_narrow_甜點店.jpg";
const OFFICE_IMAGE_PATH = "/images/dessert_shop/end_company_wide.jpg";

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
  "vertical-alternate": {
    imagePath: STRAIGHT_IMAGE_PATH,
    rotationDeg: 0,
    label: "直線道路拼圖 2",
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

function isSolved(slots: SlidingSlot[]) {
  return getConnectedDessertRoute(slots).length > 0;
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
  isSuggested,
  isLocked,
}: {
  isSuggested: boolean;
  isLocked: boolean;
  tileId: SlidingTileId;
  slotIndex: number;
  isMovable: boolean;
  isRouteSolved: boolean;
  onClick: () => void;
}) {
  const visual = TILE_VISUALS[tileId];
  const canMove = isMovable && !isRouteSolved && !isLocked;
  return (
    <Flex
      as="button"
      aria-label={`${visual.label}${canMove ? "，可滑動" : ""}`}
      aria-disabled={!canMove}
      data-dessert-tile={tileId}
      data-dessert-slot={slotIndex}
      data-dessert-suggested={isSuggested || undefined}
      position="absolute"
      {...getCentralSlotPosition(slotIndex)}
      w={`${CELL_SIZE}px`}
      h={`${CELL_SIZE}px`}
      borderRadius="13px"
      outline={isSuggested ? "3px solid #E8B65D" : undefined}
      outlineOffset="3px"
      border={isRouteSolved ? "3px solid #76956B" : "3px solid #8E7962"}
      bgColor="#D9C29E"
      overflow="hidden"
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

function SlidingRouteTutorial({
  locale,
  onClose,
}: {
  locale: ExhibitionLocale;
  onClose: () => void;
}) {
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
            {locale === "zh" ? "移動拼圖完成路徑" : locale === "ja" ? "ピースを動かして道を完成させよう" : "Slide Tiles to Complete the Route"}
          </Text>
          <Text color="#81624B" fontSize="14px" fontWeight="700" lineHeight="1.5">
            {locale === "zh" ? "點擊鄰近空格處的拼圖來進行移動" : locale === "ja" ? "空きマスの隣にあるピースをタップして動かします" : "Tap a tile beside the empty slot to move it"}
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
          aria-label={
            locale === "zh"
              ? "三塊道路拼圖依序滑動三次，最後連成完整路徑的循環示意動畫"
              : locale === "ja"
                ? "3枚の道路ピースが順番に3回スライドし、最後に道が完成するループアニメーション"
                : "Looping demonstration of three road tiles sliding three times to complete the route"
          }
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
          {locale === "zh" ? "開始" : locale === "ja" ? "はじめる" : "Start"}
        </Flex>
      </Flex>
    </Flex>
  );
}

function BeigoHelpPrompt({ speaker, text, accept, later, onAccept, onLater }: {
  speaker: string; text: string; accept: string; later: string;
  onAccept: () => void; onLater: () => void;
}) {
  const acceptRef = useRef<HTMLButtonElement>(null);
  const laterRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    acceptRef.current?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <Flex position="absolute" inset="0" zIndex={60} bgColor="rgba(61,43,29,0.36)"
      alignItems="center" justifyContent="center" p="22px"
      role="dialog" aria-modal="true" aria-labelledby="dessert-help-speaker" aria-describedby="dessert-help-offer"
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); onLater(); }
        if (event.key === "Tab") {
          event.preventDefault();
          (document.activeElement === acceptRef.current ? laterRef : acceptRef).current?.focus();
        }
      }}>
      <Flex direction="column" alignItems="center" w="100%" maxW="320px" p="22px" gap="12px"
        bgColor="#FFF8EB" border="2px solid #D9C29E" borderRadius="24px"
        boxShadow="0 12px 36px rgba(70,49,34,0.24)" animation={`${tutorialCardIn} 220ms ease-out both`}>
        <Box w="112px" h="142px"><Box transform="scale(0.7)" transformOrigin="top left"><EventAvatarSprite spriteId="beigo" frameIndex={2} /></Box></Box>
        <Text id="dessert-help-speaker" color="#865F42" fontSize="18px" fontWeight="900">{speaker}</Text>
        <Text id="dessert-help-offer" color="#795D46" fontSize="16px" lineHeight="1.7" textAlign="center">{text}</Text>
        <Flex w="100%" gap="10px" mt="4px">
          <Box as="button" ref={laterRef} flex="1" minH="46px" px="10px" borderRadius="999px"
            bgColor="#EFE1CC" color="#795D46" fontWeight="700" cursor="pointer" onClick={onLater}>{later}</Box>
          <Box as="button" ref={acceptRef} flex="1" minH="46px" px="10px" borderRadius="999px"
            bgColor="#976F54" color="white" fontWeight="700" cursor="pointer" onClick={onAccept}>{accept}</Box>
        </Flex>
      </Flex>
    </Flex>
  );
}

export function StoryDessertShopMechanismRouteView({
  locale = "zh",
  onProgressSaved,
  onComplete,
  recordProgress = true,
}: {
  locale?: ExhibitionLocale;
  onProgressSaved?: () => void;
  onComplete?: () => void;
  recordProgress?: boolean;
}) {
  const router = useRouter();
  const copy = {
    zh: {
      find: "尋找甜點店",
      help: "查看玩法",
      dessert: "甜點店",
      office: "公司",
      route: "滑動拼圖接路",
      connected: "道路已接通",
      adjust: "自由調整",
      reset: "重來",
      ready: "完成",
      departNearby: "順利出發",
      initial: "點擊空格旁的拼圖，讓道路滑動。",
      unreachable: "這塊拼圖碰不到空格，請先移動空格旁的拼圖。",
      solved: "道路接通了！現在可以出發前往甜點店。",
      moved: "拼圖滑進空格了，繼續調整道路。",
      incomplete: "先把公司到甜點店的道路完整接起來。",
      found: "找到甜點店了！",
      success: "道路拼圖順利接通",
      beigo: "小貝狗",
      offer: "嗷！要我來幫忙嗎？我可以幫你移到只剩最後一步喔！",
      accept: "要",
      later: "先等等",
      askHelp: "小貝狗幫忙",
      helping: "小貝狗正在幫忙移動拼圖……",
      lastStep: "嗷！只剩一步了，試著移動亮起來的拼圖吧！",
    },
    ja: {
      find: "スイーツ店を探そう",
      help: "遊び方を見る",
      dessert: "スイーツ店",
      office: "会社",
      route: "ピースを動かして道をつなぐ",
      connected: "道がつながった",
      adjust: "自由に調整",
      reset: "やり直す",
      ready: "完成",
      departNearby: "さあ、出発",
      initial: "空きマスの隣にあるピースをタップして動かそう。",
      unreachable: "そのピースは空きマスに届きません。まず隣のピースを動かしてください。",
      solved: "道がつながった！ スイーツ店へ出発できます。",
      moved: "ピースが動きました。続けて道を整えよう。",
      incomplete: "会社からスイーツ店までの道を完成させてください。",
      found: "スイーツ店を見つけた！",
      success: "道路パズルがつながりました",
      beigo: "ベイゴ",
      offer: "わん！手伝おうか？あと一手のところまで動かすよ！",
      accept: "お願い",
      later: "まだ大丈夫",
      askHelp: "ベイゴに手伝ってもらう",
      helping: "ベイゴがピースを動かしています……",
      lastStep: "わん！あと一手！光っているピースを動かしてみて！",
    },
    en: {
      find: "Find the Dessert Shop",
      help: "View instructions",
      dessert: "Dessert Shop",
      office: "Office",
      route: "Slide Tiles to Connect the Route",
      connected: "Route connected",
      adjust: "Free movement",
      reset: "Reset",
      ready: "Complete",
      departNearby: "Let’s go",
      initial: "Tap a tile beside the empty slot to slide it.",
      unreachable: "That tile cannot reach the empty slot. Move an adjacent tile first.",
      solved: "Route connected! You can now leave for the dessert shop.",
      moved: "Tile moved. Keep adjusting the route.",
      incomplete: "Connect the full route from the office to the dessert shop first.",
      found: "Dessert shop found!",
      success: "The route puzzle is complete",
      beigo: "Beigo",
      offer: "Woof! Want some help? I can move the tiles until there’s just one move left!",
      accept: "Yes",
      later: "Not yet",
      askHelp: "Ask Beigo for help",
      helping: "Beigo is moving the tiles…",
      lastStep: "Woof! One move left! Try sliding the highlighted tile!",
    },
  }[locale];
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const [slots, setSlots] = useState<SlidingSlot[]>(INITIAL_SLOTS);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [hint, setHint] = useState(copy.initial);
  const [moveCount, setMoveCount] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpMoves, setHelpMoves] = useState<SlidingTileId[]>([]);
  const [suggestedTile, setSuggestedTile] = useState<SlidingTileId | null>(null);
  const isAssisting = helpMoves.length > 0;

  useEffect(() => {
    if (!helpMoves.length) return;
    const timer = setTimeout(() => {
      const tile = helpMoves[0];
      setSlots((current) => {
        const next = [...current];
        const empty = next.indexOf(null);
        const index = next.indexOf(tile);
        [next[index], next[empty]] = [next[empty], next[index]];
        return next;
      });
      setHelpMoves((moves) => moves.slice(1));
      if (helpMoves.length === 1) setHint(copy.lastStep);
    }, 360);
    return () => clearTimeout(timer);
  }, [helpMoves, copy.lastStep]);

  useEffect(() => {
    if (!isComplete) setHint(copy.initial);
  }, [copy.initial, isComplete]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, []);

  const routeSolved = isSolved(slots);
  const emptySlotIndex = slots.indexOf(null);

  const moveTile = useCallback(
    (tileId: SlidingTileId) => {
      if (isComplete || routeSolved || isHelpOpen || isAssisting || isTutorialOpen) return;
      const tileSlotIndex = slots.indexOf(tileId);
      const currentEmptySlotIndex = slots.indexOf(null);
      if (!areSlotsAdjacent(tileSlotIndex, currentEmptySlotIndex)) {
        setHint(copy.unreachable);
        return;
      }

      const nextSlots = [...slots];
      nextSlots[currentEmptySlotIndex] = tileId;
      nextSlots[tileSlotIndex] = null;
      setSlots(nextSlots);
      setSuggestedTile(null);
      setMoveCount(moveCount + 1);
      if (moveCount === 12 && !isSolved(nextSlots)) setIsHelpOpen(true);
      setHint(
        isSolved(nextSlots)
          ? copy.solved
          : copy.moved,
      );
    },
    [copy.moved, copy.solved, copy.unreachable, isComplete, routeSolved, slots, moveCount, isHelpOpen, isAssisting, isTutorialOpen],
  );

  const resetPuzzle = useCallback(() => {
    if (isComplete || isAssisting || isHelpOpen) return;
    setMoveCount(0);
    setHelpMoves([]);
    setSuggestedTile(null);
    setIsHelpOpen(false);
    setSlots(INITIAL_SLOTS);
    setHint(copy.initial);
  }, [copy.initial, isComplete, isAssisting, isHelpOpen]);

  const acceptHelp = () => {
    if (!isHelpOpen || isAssisting) return;
    const solution = solveDessertRoute(slots);
    setIsHelpOpen(false);
    if (!solution?.length) return;
    setSuggestedTile(solution[solution.length - 1]);
    setHelpMoves(solution.slice(0, -1));
    setHint(solution.length > 1 ? copy.helping : copy.lastStep);
  };

  const depart = useCallback(() => {
    if (!routeSolved || hasCompletedRef.current) {
      setHint(copy.incomplete);
      return;
    }

    hasCompletedRef.current = true;
    setIsComplete(true);
    setHint(copy.found);
    if (recordProgress) {
      recordArrangeRouteDeparture();
      onProgressSaved?.();
    }
    completionTimerRef.current = setTimeout(() => {
      if (onComplete) {
        onComplete();
        return;
      }
      const eventId = getFrogDiaryClueStageByAttempt(
        loadPlayerProgress().streetForgotLunchFrogPhotoAttemptCount,
      ).eventId;
      router.push(
        withTrialProfileSearch(
          `${ROUTES.gameArrangeRoute}?eventId=${eventId}&frogReturn=offwork`,
        ),
      );
    }, ROUTE_COMPLETE_DELAY_MS);
  }, [copy.found, copy.incomplete, onComplete, onProgressSaved, recordProgress, routeSolved, router]);

  return (
    <Flex
      data-game-viewport="true"
      data-dessert-moves={moveCount}
      data-dessert-assisting={isAssisting}
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
      <Flex direction="column" flex="1" minH="0" inert={isHelpOpen || isAssisting}>
        <Flex h="56px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
          <Text color="white" fontSize="18px" fontWeight="900">
            {copy.find}
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
            aria-label={copy.help}
            onClick={() => setIsTutorialOpen(true)}
          >
            <Text fontSize="22px" lineHeight="1">?</Text>
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
          direction="column"
        >
          <Flex flex="1" minH="0" w="100%" alignItems="center" justifyContent="center" css={{ containerType: "size" }}>
            <Flex
              data-dessert-board-card="true"
              flexShrink={0}
              css={{
                "@container (max-height: 453px)": { transform: "scale(0.8)" },
                "@container (max-height: 360px)": { transform: "scale(0.64)" },
              }}
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
                    border="2px solid rgba(159,125,92,0.26)"
                    bgColor={slotIndex === emptySlotIndex ? "rgba(255,251,239,0.88)" : "rgba(255,255,255,0.24)"}
                    alignItems="center"
                    justifyContent="center"
                    zIndex={1}
                  />
                ))}

                <FixedBoardTile row={0} col={2}>
                  <Image
                    src={DESSERT_SHOP_IMAGE_PATH}
                    alt={copy.dessert}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    transform="scale(1.04)"
                    draggable={false}
                  />
                </FixedBoardTile>

                <FixedBoardTile row={3} col={0}>
                  <Image
                    src={OFFICE_IMAGE_PATH}
                    alt={copy.office}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    transform="scale(1.04)"
                    draggable={false}
                  />
                </FixedBoardTile>

                {slots.map((tileId, slotIndex) =>
                  tileId ? (
                    <SlidingRouteTile
                      key={tileId}
                      tileId={tileId}
                      slotIndex={slotIndex}
                      isMovable={areSlotsAdjacent(slotIndex, emptySlotIndex)}
                      isRouteSolved={routeSolved}
                      isLocked={isAssisting || isHelpOpen || isTutorialOpen}
                      isSuggested={!isAssisting && suggestedTile === tileId}
                      onClick={() => moveTile(tileId)}
                    />
                  ) : null,
                )}

              </Box>
            </Flex>
          </Flex>
          {routeSolved && !isComplete ? (
            <DessertRouteDepartureBadge
              ready={copy.ready}
              depart={copy.departNearby}
              locale={locale}
              onClick={depart}
            />
          ) : null}
        </Flex>

        <Flex h="54px" flexShrink={0} bgColor="#B88E6D" alignItems="center" px="18px" gap="12px">
          <Flex
            as="button"
            ml="auto"
            h="32px"
            w="70px"
            justifyContent="center"
            borderRadius="999px"
            bgColor="white"
            color="#8F694E"
            alignItems="center"
            gap="5px"
            cursor={isComplete ? "default" : "pointer"}
            opacity={isComplete ? 0.55 : 1}
            onClick={resetPuzzle}
          >
            <Text fontSize="12px" fontWeight="900">
              {copy.reset}
            </Text>
          </Flex>
        </Flex>

        <Flex
          minH="54px"
          pt="8px"
          pb="max(8px, env(safe-area-inset-bottom))"
          gap="4px"
          direction="column"
          flexShrink={0}
          bgColor="#F8E7CC"
          px="18px"
          alignItems="center"
          justifyContent="center"
          borderBottom="1px solid rgba(176,132,91,0.12)"
        >
          {moveCount > 12 && !routeSolved && !isAssisting && !suggestedTile ? (
            <Box as="button" color="#936F53" fontSize="13px" fontWeight="900"
              minH="38px" px="16px" cursor="pointer" onClick={() => setIsHelpOpen(true)}>
              {copy.askHelp}
            </Box>
          ) : (
            <Text role="status" color="#936F53" fontSize="13px" fontWeight="900" lineHeight="1.45" textAlign="center">
              {hint}
            </Text>
          )}
        </Flex>


      </Flex>

      {isHelpOpen ? (
        <BeigoHelpPrompt speaker={copy.beigo} text={copy.offer} accept={copy.accept} later={copy.later}
          onAccept={acceptHelp} onLater={() => setIsHelpOpen(false)} />
      ) : null}

      {isTutorialOpen && !isComplete ? (
        <SlidingRouteTutorial locale={locale} onClose={() => setIsTutorialOpen(false)} />
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
              {copy.found}
            </Text>
            <Text color="#A17B5E" fontSize="13px" fontWeight="800">
              {copy.success}
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

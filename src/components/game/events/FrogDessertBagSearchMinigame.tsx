"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { playGameSfx } from "@/lib/game/soundEffects";

const BAG_IDS = [0, 1, 2] as const;
const TARGET_BAG_ID = 1;
const SHUFFLE_ORDERS: ReadonlyArray<ReadonlyArray<number>> = [
  [1, 0, 2],
  [2, 0, 1],
  [2, 1, 0],
  [1, 2, 0],
];
const BAG_SLOT_LEFT = [5, 36, 67] as const;

const bagAttention = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  18% { transform: translateY(-8px) rotate(-5deg); }
  38% { transform: translateY(0) rotate(5deg); }
  58% { transform: translateY(-5px) rotate(-4deg); }
  78% { transform: translateY(0) rotate(3deg); }
`;

const bagShuffleTurn = keyframes`
  0% { transform: rotateY(0deg) scale(1); }
  46% { transform: rotateY(180deg) scale(0.9); }
  100% { transform: rotateY(360deg) scale(1); }
`;

const bagWrongShake = keyframes`
  0%, 100% { transform: translateX(0) rotate(0deg); }
  22% { transform: translateX(-8px) rotate(-4deg); }
  44% { transform: translateX(8px) rotate(4deg); }
  66% { transform: translateX(-5px) rotate(-2deg); }
  82% { transform: translateX(4px) rotate(2deg); }
`;

const bagReveal = keyframes`
  0% { opacity: 0; transform: translateY(14px) scale(0.82); }
  62% { opacity: 1; transform: translateY(-7px) scale(1.07); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

const revealGlow = keyframes`
  0% { opacity: 0; transform: scale(0.5); }
  42% { opacity: 0.86; transform: scale(1.08); }
  100% { opacity: 0; transform: scale(1.45); }
`;

type BagSearchPhase = "watch" | "shuffle" | "choose" | "revealed";

export function FrogDessertBagSearchMinigame({
  backgroundImage,
  closedBagImage,
  revealedBagImage,
  savings,
  actionPower,
  fatigue,
  onComplete,
}: {
  backgroundImage: string;
  closedBagImage: string;
  revealedBagImage: string;
  savings: number;
  actionPower: number;
  fatigue: number;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<BagSearchPhase>("watch");
  const [bagOrder, setBagOrder] = useState<ReadonlyArray<number>>(BAG_IDS);
  const [shuffleEpoch, setShuffleEpoch] = useState(0);
  const [wrongBagId, setWrongBagId] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const schedule = (callback: () => void, delayMs: number) => {
      timersRef.current.push(window.setTimeout(callback, delayMs));
    };

    schedule(() => {
      setPhase("shuffle");
      playGameSfx("cardDuelShuffle");
    }, 1300);

    SHUFFLE_ORDERS.forEach((order, index) => {
      schedule(() => {
        setBagOrder(order);
        setShuffleEpoch((current) => current + 1);
      }, 1550 + index * 640);
    });

    schedule(() => setPhase("choose"), 1550 + SHUFFLE_ORDERS.length * 640 + 260);

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const handleBagSelect = (bagId: number) => {
    if (phase !== "choose") return;
    if (bagId !== TARGET_BAG_ID) {
      playGameSfx("photoResultNegative");
      setWrongBagId(bagId);
      timersRef.current.push(window.setTimeout(() => setWrongBagId(null), 720));
      return;
    }

    playGameSfx("frogJump");
    setWrongBagId(null);
    setPhase("revealed");
    timersRef.current.push(window.setTimeout(onComplete, 1550));
  };

  const instruction =
    phase === "watch"
      ? "有一個提袋在動……記住它！"
      : phase === "shuffle"
        ? "提袋正在轉位"
        : phase === "revealed"
          ? "找到了！青蛙躲在裡面！"
          : wrongBagId !== null
            ? "這袋只有蛋糕，再找找看！"
            : "剛才在動的是哪個提袋？";

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#E8D5BE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Box
        position="relative"
        flex="1"
        minH="0"
        overflow="hidden"
        bgImage={`url("${backgroundImage}")`}
        bgSize="cover"
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        data-frog-dessert-bag-search={phase}
      >
        <Box
          position="absolute"
          inset="0"
          bgImage="linear-gradient(180deg, rgba(69,45,30,0.08) 0%, rgba(69,45,30,0) 28%, rgba(69,45,30,0.14) 100%)"
          pointerEvents="none"
        />

        <Flex
          position="absolute"
          top="18px"
          left="24px"
          right="24px"
          minH="58px"
          px="18px"
          py="12px"
          borderRadius="18px"
          bgColor="rgba(255,250,239,0.94)"
          border="2px solid rgba(151,108,74,0.54)"
          boxShadow="0 10px 24px rgba(91,58,34,0.18)"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          zIndex={4}
        >
          <Text color="#7C5B43" fontSize="16px" fontWeight="900" lineHeight="1.45">
            {instruction}
          </Text>
        </Flex>

        <Box
          position="absolute"
          left="0"
          right="0"
          top="258px"
          h="230px"
          style={{ perspective: "720px" }}
        >
          {BAG_IDS.map((bagId) => {
            const slotIndex = bagOrder.indexOf(bagId);
            const isTarget = bagId === TARGET_BAG_ID;
            const isRevealed = isTarget && phase === "revealed";
            const isWrong = wrongBagId === bagId;
            const isSelectable = phase === "choose";

            return (
              <Flex
                as="button"
                key={bagId}
                aria-label={`打開第 ${slotIndex + 1} 個提袋`}
                aria-disabled={!isSelectable}
                tabIndex={isSelectable ? 0 : -1}
                position="absolute"
                left={`${BAG_SLOT_LEFT[slotIndex]}%`}
                top={slotIndex === 1 ? "8px" : "22px"}
                w="28%"
                maxW="116px"
                h="158px"
                border="0"
                bgColor="transparent"
                alignItems="flex-end"
                justifyContent="center"
                cursor={isSelectable ? "pointer" : "default"}
                transition="left 580ms cubic-bezier(0.22, 0.78, 0.2, 1), top 580ms ease"
                zIndex={isRevealed ? 5 : slotIndex === 1 ? 3 : 2}
                onClick={() => handleBagSelect(bagId)}
                _focusVisible={
                  isSelectable
                    ? { outline: "3px solid #F1B55A", outlineOffset: "4px" }
                    : { outline: "none" }
                }
              >
                {isRevealed ? (
                  <>
                    <Box
                      position="absolute"
                      left="50%"
                      bottom="1px"
                      w="118px"
                      h="118px"
                      ml="-59px"
                      borderRadius="999px"
                      bgColor="rgba(255,225,124,0.7)"
                      animation={`${revealGlow} 1100ms ease-out both`}
                    />
                    <Image
                      src={revealedBagImage}
                      alt="青蛙從甜點提袋裡探出頭"
                      position="relative"
                      w="142px"
                      maxW="none"
                      h="142px"
                      objectFit="contain"
                      animation={`${bagReveal} 660ms cubic-bezier(0.18, 0.88, 0.2, 1.1) both`}
                      filter="drop-shadow(0 12px 14px rgba(91,58,34,0.24))"
                    />
                  </>
                ) : (
                  <Image
                    key={`${bagId}-${shuffleEpoch}`}
                    src={closedBagImage}
                    alt="甜點店提袋"
                    w="126px"
                    maxW="none"
                    h="126px"
                    objectFit="contain"
                    filter="drop-shadow(0 10px 12px rgba(91,58,34,0.22))"
                    animation={
                      phase === "watch" && isTarget
                        ? `${bagAttention} 820ms ease-in-out 2 both`
                        : phase === "shuffle"
                          ? `${bagShuffleTurn} 610ms ease-in-out both`
                          : isWrong
                            ? `${bagWrongShake} 520ms ease-out both`
                            : undefined
                    }
                  />
                )}
              </Flex>
            );
          })}
        </Box>

        {phase === "watch" ? (
          <Flex
            position="absolute"
            left="50%"
            top="232px"
            transform="translateX(-50%)"
            px="12px"
            h="28px"
            borderRadius="999px"
            bgColor="#A87A58"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 6px 12px rgba(91,58,34,0.2)"
            zIndex={6}
            pointerEvents="none"
          >
            <Text color="white" fontSize="12px" fontWeight="900">
              在動！
            </Text>
          </Flex>
        ) : null}
      </Box>
    </Flex>
  );
}

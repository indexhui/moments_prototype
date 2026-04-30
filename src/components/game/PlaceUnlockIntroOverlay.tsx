"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiChevronRight, FiLock, FiMapPin, FiPackage } from "react-icons/fi";
import {
  PLACE_UNLOCK_INTRO_REWARD_PATTERNS,
  type PlaceTileId,
} from "@/lib/game/playerProgress";

type PlaceUnlockIntroOverlayProps = {
  placeId: PlaceTileId;
  savings: number;
  actionPower: number;
  fatigue: number;
  onConfirm: () => void;
};

function getPlaceMeta(placeId: PlaceTileId) {
  if (placeId === "convenience-store") {
    return {
      name: "便利商店",
      iconPath: "/images/icon/mart.png",
      imagePath: "/images/outside/mart.jpg",
      unlockCondition: "兩次行程經過便利商店",
      summary: "剛剛解鎖了新的地點。補給、短暫停留，還有新的支線都可能從這裡開始。",
      silhouetteLabel: "青蛙小日獸可能出沒",
      silhouetteHint: "在便利商店附近，偶爾會看見一個熟悉又匆忙的剪影。",
    };
  }
  if (placeId === "breakfast-shop") {
    return {
      name: "早餐店",
      iconPath: null,
      imagePath: "/images/breakfast.jpg",
      unlockCondition: "發現 2 隻小日獸",
      summary: "剛剛解鎖了新的地點。忙碌早晨裡的短暫停留，也可能帶來新的相遇。",
      silhouetteLabel: "新的小日獸線索",
      silhouetteHint: "早餐香氣旁邊，似乎還藏著下一隻小日獸的身影。",
    };
  }
  if (placeId === "park") {
    return {
      name: "公園",
      iconPath: "/images/icon/park.png",
      imagePath: "/images/park.jpg",
      unlockCondition: "完成目前路線探索",
      summary: "剛剛解鎖了新的地點。放慢腳步時，也許會遇見意想不到的小互動。",
      silhouetteLabel: "小日獸可能出沒",
      silhouetteHint: "樹影和長椅旁，偶爾會出現安靜觀察你的輪廓。",
    };
  }
  return {
    name: "公車站",
    iconPath: null,
    imagePath: "/images/outside/bus.jpg",
    unlockCondition: "取得早餐店通勤情報",
    summary: "剛剛解鎖了新的地點。新的通勤節奏，會把你帶往不同的遭遇。",
    silhouetteLabel: "小日獸可能出沒",
    silhouetteHint: "在人群與站牌之間，也許有新的小日獸正在等你發現。",
  };
}

const panelIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const unlockFlash = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.7);
  }
  35% {
    opacity: 1;
    transform: scale(1.04);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
`;

const unlockFloat = keyframes`
  0% {
    transform: translateY(16px) scale(0.9) rotate(-2deg);
    opacity: 0;
  }
  35% {
    opacity: 1;
  }
  100% {
    transform: translateY(-18px) scale(1.04) rotate(1deg);
    opacity: 0;
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-130%) rotate(12deg);
  }
  100% {
    transform: translateX(130%) rotate(12deg);
  }
`;

const progressFill = keyframes`
  0% {
    width: 50%;
  }
  100% {
    width: 100%;
  }
`;

const progressCountOut = keyframes`
  0%, 45% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
  }
`;

const progressCountIn = keyframes`
  0%, 45% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

function TilePreview({ placeId }: { placeId: PlaceTileId }) {
  const pattern = PLACE_UNLOCK_INTRO_REWARD_PATTERNS[placeId];
  if (!pattern) return null;
  const iconPath = placeId === "convenience-store"
    ? "/images/icon/mart.png"
    : placeId === "park"
      ? "/images/icon/park.png"
      : null;
  const flat = pattern.flat();

  return (
    <Flex
      w="104px"
      h="104px"
      borderRadius="20px"
      border="1px solid rgba(142, 102, 69, 0.28)"
      bg="#FFF9EE"
      align="center"
      justify="center"
      position="relative"
      boxShadow="0 16px 28px rgba(92, 58, 35, 0.12)"
    >
      <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" gap="4px" w="72px" h="72px">
        {flat.map((cell, index) => (
          <Flex
            key={index}
            borderRadius="4px"
            bg={cell === 1 ? "#B9875E" : "#ECDCC7"}
            align="center"
            justify="center"
          >
            {index === 4 ? (
              iconPath ? (
                <img
                  src={iconPath}
                  alt="地點拼圖"
                  style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                />
              ) : (
                <Text color="#FFF7EF" fontSize="11px" fontWeight="800" lineHeight="1">
                  {placeId === "breakfast-shop" ? "早餐" : "轉乘"}
                </Text>
              )
            ) : null}
          </Flex>
        ))}
      </Grid>
    </Flex>
  );
}

export function PlaceUnlockIntroOverlay({
  placeId,
  onConfirm,
}: PlaceUnlockIntroOverlayProps) {
  const meta = getPlaceMeta(placeId);
  const [step, setStep] = useState<"criteria" | "unlocking" | "revealed">("criteria");
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const startUnlock = () => {
    setStep("unlocking");
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => {
      setStep("revealed");
    }, 1380);
  };

  return (
    <Flex position="absolute" inset="0" zIndex={95} direction="column" bg="#F4EFE4" overflow="hidden">
      <Box position="absolute" inset="0" bg="radial-gradient(circle at 50% 8%, rgba(255,246,218,0.92), transparent 42%)" />
      <Box
        position="absolute"
        left="-30%"
        right="-30%"
        top="-130px"
        h="260px"
        bg="linear-gradient(90deg, transparent, rgba(183,134,91,0.16), transparent)"
        transform="rotate(-8deg)"
      />

      {step === "criteria" ? (
        <Flex
          flex="1"
          direction="column"
          px="22px"
          pt="30px"
          pb="18px"
          gap="12px"
          minH="0"
          position="relative"
          animation={`${panelIn} 420ms ease-out`}
        >
          <Flex align="center" justify="space-between">
            <Flex direction="column" gap="5px">
              <Text color="#B98651" fontSize="12px" fontWeight="900" letterSpacing="0.12em">
                UNLOCK READY
              </Text>
              <Text color="#594534" fontSize="27px" fontWeight="900" lineHeight="1.16">
                解鎖條件已達成
              </Text>
            </Flex>
            <Flex
              w="48px"
              h="48px"
              borderRadius="16px"
              align="center"
              justify="center"
              bg="#FAF2E4"
              border="1px solid rgba(124, 91, 61, 0.2)"
              color="#9B6C43"
              boxShadow="0 12px 20px rgba(91, 58, 35, 0.1)"
            >
              <FiLock size={22} />
            </Flex>
          </Flex>

          <Flex
            borderRadius="28px"
            overflow="hidden"
            h="272px"
            flexShrink={0}
            position="relative"
            bg="#D8C8B4"
            boxShadow="0 20px 44px rgba(73, 49, 31, 0.18)"
          >
            <img
              src={meta.imagePath}
              alt={meta.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "saturate(0.94)" }}
            />
            <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(38,29,22,0.06) 0%, rgba(38,29,22,0.76) 100%)" />
            <Flex position="absolute" left="18px" right="18px" bottom="18px" direction="column" gap="8px">
              <Flex align="center" gap="8px" color="#FFF8ED">
                <FiMapPin size={17} />
                <Text fontSize="13px" fontWeight="900" letterSpacing="0.08em">
                  即將開放
                </Text>
              </Flex>
              <Text color="#FFFDF7" fontSize="34px" fontWeight="900" lineHeight="1.05">
                {meta.name}
              </Text>
            </Flex>
          </Flex>

          <Flex
            direction="column"
            gap="12px"
            borderRadius="22px"
            bg="rgba(255, 252, 246, 0.86)"
            border="1px solid rgba(133, 100, 72, 0.18)"
            px="15px"
            py="15px"
            boxShadow="0 14px 28px rgba(92, 58, 35, 0.08)"
            flexShrink={0}
          >
            <Flex align="center" justify="space-between" gap="12px">
              <Text color="#5E4938" fontSize="16px" fontWeight="900">
                {meta.unlockCondition}
              </Text>
              <Flex position="relative" minW="40px" h="22px" align="center" justify="flex-end">
                <Text
                  position="absolute"
                  color="#9C7A60"
                  fontSize="14px"
                  fontWeight="900"
                  animation={`${progressCountOut} 1100ms ease-out forwards`}
                >
                  1/2
                </Text>
                <Text
                  position="absolute"
                  color="#2F7E66"
                  fontSize="14px"
                  fontWeight="900"
                  opacity={0}
                  animation={`${progressCountIn} 1100ms ease-out forwards`}
                >
                  2/2
                </Text>
              </Flex>
            </Flex>
            <Flex h="10px" borderRadius="999px" bg="#E9DCCB" overflow="hidden">
              <Box
                h="100%"
                borderRadius="999px"
                bg="linear-gradient(90deg, #7DC7B5 0%, #3A927B 100%)"
                animation={`${progressFill} 1100ms ease-out forwards`}
              />
            </Flex>
          </Flex>

          <Flex
            as="button"
            mt="auto"
            h="58px"
            flexShrink={0}
            borderRadius="999px"
            bg="#5E4938"
            color="#FFF8EF"
            fontSize="17px"
            fontWeight="900"
            align="center"
            justify="center"
            gap="10px"
            boxShadow="0 16px 30px rgba(76, 48, 30, 0.22)"
            onClick={startUnlock}
          >
            <Text>解鎖 {meta.name}</Text>
            <FiChevronRight size={21} strokeWidth={3} />
          </Flex>
        </Flex>
      ) : null}

      {step === "unlocking" ? (
        <Flex position="relative" flex="1" align="center" justify="center" direction="column" gap="24px" color="#FFF8EE">
          <Box position="absolute" inset="0" bg="rgba(37, 28, 22, 0.86)" />
          <Box
            position="absolute"
            w="300px"
            h="300px"
            borderRadius="999px"
            bg="radial-gradient(circle, rgba(255,244,205,0.95), rgba(221,171,94,0.26) 46%, transparent 70%)"
            animation={`${unlockFlash} 1380ms ease-out forwards`}
          />
          <Flex
            position="relative"
            w="118px"
            h="118px"
            borderRadius="32px"
            align="center"
            justify="center"
            bg="#FFF4D8"
            color="#6D4C32"
            border="1px solid rgba(255,255,255,0.52)"
            boxShadow="0 22px 48px rgba(0,0,0,0.32)"
            animation={`${unlockFloat} 1380ms ease-in-out forwards`}
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-20%"
              bottom="-20%"
              w="54px"
              bg="rgba(255,255,255,0.62)"
              filter="blur(6px)"
              animation={`${shimmer} 920ms ease-in-out 150ms 1`}
            />
            {meta.iconPath ? (
              <img
                src={meta.iconPath}
                alt={meta.name}
                style={{ width: "54px", height: "54px", objectFit: "contain", display: "block", position: "relative" }}
              />
            ) : (
              <Text position="relative" fontSize="20px" fontWeight="900">
                {meta.name.slice(0, 2)}
              </Text>
            )}
          </Flex>
          <Text position="relative" fontSize="19px" fontWeight="900" letterSpacing="0.08em">
            地圖更新中
          </Text>
        </Flex>
      ) : null}

      {step === "revealed" ? (
        <Flex flex="1" direction="column" px="20px" pt="28px" pb="20px" gap="14px" position="relative" animation={`${panelIn} 420ms ease-out`}>
          <Flex
            h="214px"
            borderRadius="28px"
            overflow="hidden"
            position="relative"
            bg="#D8C8B4"
            boxShadow="0 18px 38px rgba(73, 49, 31, 0.16)"
          >
            <img
              src={meta.imagePath}
              alt={meta.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(48,36,28,0.08) 0%, rgba(48,36,28,0.76) 100%)" />
            <Flex position="absolute" left="18px" right="18px" bottom="18px" direction="column" gap="7px">
              <Text color="#F8D59A" fontSize="12px" fontWeight="900" letterSpacing="0.14em">
                NEW PLACE
              </Text>
              <Text color="#FFFDF8" fontSize="33px" fontWeight="900" lineHeight="1">
                {meta.name}
              </Text>
              <Text color="#FFF2DD" fontSize="13px" lineHeight="1.55" fontWeight="750">
                {meta.summary}
              </Text>
            </Flex>
          </Flex>

          <Flex
            direction="column"
            gap="10px"
            align="stretch"
            minH="0"
          >
            <Flex
              minH="132px"
              borderRadius="24px"
              bg="#FFFCF6"
              border="1px solid rgba(133, 100, 72, 0.18)"
              align="center"
              px="16px"
              py="16px"
              gap="12px"
              boxShadow="0 12px 26px rgba(92, 58, 35, 0.08)"
            >
              <Flex w="44px" h="44px" borderRadius="16px" bg="#F2E5D2" color="#7B5B42" align="center" justify="center" flexShrink={0}>
                <FiMapPin size={22} />
              </Flex>
              <Flex direction="column" gap="6px" minW="0">
                <Text color="#5F4938" fontSize="16px" fontWeight="900" lineHeight="1.35">
                  {meta.silhouetteLabel}
                </Text>
                <Text color="#8B705A" fontSize="13px" lineHeight="1.6" fontWeight="700">
                  {meta.silhouetteHint}
                </Text>
              </Flex>
            </Flex>

            <Flex
              minH="132px"
              borderRadius="24px"
              bg="#FFFCF6"
              border="1px solid rgba(133, 100, 72, 0.18)"
              align="center"
              px="16px"
              py="16px"
              gap="12px"
              boxShadow="0 12px 26px rgba(92, 58, 35, 0.08)"
            >
              <TilePreview placeId={placeId} />
              <Flex direction="column" gap="7px" minW="0">
                <Flex align="center" gap="7px" color="#6F523C">
                  <FiPackage size={17} />
                  <Text fontSize="14px" fontWeight="900">
                    獲得 1 個拼圖
                  </Text>
                </Flex>
                <Text color="#8B705A" fontSize="12px" lineHeight="1.55" fontWeight="700">
                  之後安排行程時，這個地點也有機會出現在你的路線上。
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex
            as="button"
            mt="auto"
            h="56px"
            borderRadius="999px"
            bg="#B9865F"
            color="#FFF9F1"
            fontSize="16px"
            fontWeight="900"
            align="center"
            justify="center"
            boxShadow="0 14px 26px rgba(122, 82, 47, 0.2)"
            onClick={onConfirm}
          >
            收下拼圖，繼續前進
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

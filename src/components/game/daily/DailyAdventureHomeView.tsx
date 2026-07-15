"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoAlbumsOutline, IoChevronForward, IoMapOutline, IoSparkles } from "react-icons/io5";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_COMPANIONS,
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_STAGES,
  getDailyAdventureRouteTilesForLocation,
  grantDailyAdventureTestActionPower,
  hasSeenDailyAdventureOnboarding,
  markDailyAdventureOnboardingSeen,
} from "@/lib/game/dailyAdventure";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";
import { DailyAdventureOnboardingModal } from "./DailyAdventureOnboardingModal";

export function DailyAdventureHomeView() {
  const router = useRouter();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { state } = useDailyAdventureData();
  const companion = DAILY_ADVENTURE_COMPANIONS[state.selectedCompanionId];
  const currentStage = DAILY_ADVENTURE_STAGES.find(
    (stage) => stage.id === state.highestUnlockedStage,
  );
  const go = (path: string) => router.push(withTrialProfileSearch(path));

  useEffect(() => {
    grantDailyAdventureTestActionPower();
    if (!hasSeenDailyAdventureOnboarding()) setIsOnboardingOpen(true);
  }, []);

  const completeOnboarding = () => {
    markDailyAdventureOnboardingSeen();
    setIsOnboardingOpen(false);
  };

  return (
    <DailyAdventureShell
      title="日常冒險"
      overlay={
        isOnboardingOpen ? (
          <DailyAdventureOnboardingModal onComplete={completeOnboarding} />
        ) : null
      }
    >
      <Flex
        position="relative"
        minH="228px"
        borderRadius="22px"
        overflow="hidden"
        bgColor="#D8B17B"
        boxShadow="0 10px 22px rgba(98,69,42,0.16)"
      >
        <img
          src="/images/lobby/daily_adventure.png"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
        />
        <Box position="absolute" inset="0" bg="linear-gradient(90deg, rgba(68,48,32,0.52), rgba(68,48,32,0.04))" />
        <Flex position="relative" zIndex={2} direction="column" p="18px" w="68%">
          <Flex
            alignSelf="flex-start"
            h="27px"
            px="10px"
            borderRadius="999px"
            bgColor="rgba(255,255,255,0.92)"
            alignItems="center"
            gap="5px"
          >
            <IoSparkles size={14} color="#A26D46" />
            <Text color="#8C6043" fontSize="11px" fontWeight="900">
              冒險 {state.highestUnlockedStage}
            </Text>
          </Flex>
          <Text mt="10px" color="#FFFFFF" fontSize="24px" fontWeight="900" lineHeight="1.16" textShadow="0 2px 6px rgba(60,40,26,0.3)">
            帶著喜歡的夥伴，去收集今天的故事
          </Text>
          <Text mt="7px" color="rgba(255,255,255,0.92)" fontSize="12px" fontWeight="800" lineHeight="1.45">
            收集不同接頭的地點拼圖，安排能走通的路線與旅途事件。
          </Text>
        </Flex>
        <Box position="absolute" right="-8px" bottom="-25px" w="150px" h="190px">
          <img src={companion.imagePath} alt={companion.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Box>
      </Flex>

      {state.activeRun ? (
        <Flex
          mt="12px"
          p="13px"
          borderRadius="16px"
          bgColor="#FFF8E9"
          border="1px solid #E6C790"
          alignItems="center"
          justifyContent="space-between"
          gap="10px"
        >
          <Flex direction="column">
            <Text color="#7B5941" fontSize="12px" fontWeight="900">冒險進行中</Text>
            <Text color="#9A765E" fontSize="11px">第 {state.activeRun.stageId} 關尚未完成</Text>
          </Flex>
          <Flex as="button" h="34px" px="13px" borderRadius="999px" bgColor="#9B704F" color="white" alignItems="center" gap="4px" cursor="pointer" onClick={() => go(ROUTES.gameDailyPlay)}>
            <Text color="white" fontSize="12px" fontWeight="900">繼續</Text>
            <IoChevronForward size={15} />
          </Flex>
        </Flex>
      ) : null}

      <Flex mt="14px" direction="column" gap="9px">
        <Text color="#6B5140" fontSize="15px" fontWeight="900">這次帶上</Text>
        <Flex gap="9px">
          <Flex
            flex="1"
            h="86px"
            borderRadius="16px"
            bgColor="#FFFFFF"
            p="9px"
            alignItems="center"
            gap="9px"
            boxShadow="0 6px 14px rgba(79,57,40,0.08)"
          >
            <Flex w="58px" h="66px" borderRadius="13px" bgColor="#F8E9D8" alignItems="center" justifyContent="center" overflow="hidden">
              <img src={companion.imagePath} alt={companion.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </Flex>
            <Flex direction="column" minW="0">
              <Text color="#A17A5B" fontSize="10px" fontWeight="900">同行夥伴</Text>
              <Text color="#5E493A" fontSize="16px" fontWeight="900">{companion.name}</Text>
            </Flex>
          </Flex>
          <Flex
            flex="1"
            minW="0"
            h="86px"
            borderRadius="16px"
            bgColor="#FFFFFF"
            p="9px"
            alignItems="center"
            gap="7px"
            boxShadow="0 6px 14px rgba(79,57,40,0.08)"
          >
            <Flex gap="-3px">
              {state.selectedLocationIds.slice(0, 2).map((id) => {
                const location = DAILY_ADVENTURE_LOCATIONS[id];
                const collectedTile = getDailyAdventureRouteTilesForLocation(
                  id,
                  state.collectedRouteTileIds,
                )[0];
                return (
                  <Flex key={id} w="42px" h="58px" borderRadius="10px" bgColor="#EEE0CC" overflow="hidden" border="2px solid white">
                    <img src={collectedTile?.imagePath ?? location.tileImagePath} alt={location.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Flex>
                );
              })}
            </Flex>
            <Flex direction="column" minW="0">
              <Text color="#A17A5B" fontSize="10px" fontWeight="900">冒險地點</Text>
              <Text color="#5E493A" fontSize="13px" fontWeight="900" lineHeight="1.25">
                {state.selectedLocationIds.map((id) => DAILY_ADVENTURE_LOCATIONS[id].name).join("、")}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Flex
        as="button"
        mt="13px"
        w="100%"
        h="58px"
        borderRadius="18px"
        bgColor="#9B704F"
        color="#FFFFFF"
        alignItems="center"
        justifyContent="center"
        gap="8px"
        boxShadow="0 8px 16px rgba(108,72,45,0.18)"
        cursor="pointer"
        onClick={() => go(ROUTES.gameDailyPrepare)}
      >
        <Text color="white" fontSize="18px" fontWeight="900">準備這次冒險</Text>
        <IoChevronForward size={21} />
      </Flex>

      <Flex mt="14px" gap="10px">
        <Flex as="button" flex="1" minH="116px" borderRadius="18px" bgColor="#E8D5B7" p="14px" direction="column" alignItems="flex-start" cursor="pointer" onClick={() => go(ROUTES.gameDailyStages)}>
          <IoMapOutline size={25} color="#8B6548" />
          <Text mt="10px" color="#604A3A" fontSize="15px" fontWeight="900">冒險關卡</Text>
          <Text color="#8F7059" fontSize="11px" lineHeight="1.4">目前到第 {currentStage?.id ?? 1} 關</Text>
        </Flex>
        <Flex as="button" flex="1" minH="116px" borderRadius="18px" bgColor="#D8DDC5" p="14px" direction="column" alignItems="flex-start" cursor="pointer" onClick={() => go(ROUTES.gameDailyCollection)}>
          <IoAlbumsOutline size={25} color="#66745D" />
          <Text mt="10px" color="#4F594B" fontSize="15px" fontWeight="900">冒險收藏</Text>
          <Text color="#76816F" fontSize="11px" lineHeight="1.4">已收集 {state.collectedRecords.length} 則</Text>
        </Flex>
      </Flex>
    </DailyAdventureShell>
  );
}

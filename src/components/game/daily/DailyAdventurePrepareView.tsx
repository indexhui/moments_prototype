"use client";

import { Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoCheckmarkCircle, IoChevronForward, IoLockClosed } from "react-icons/io5";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_COMPANIONS,
  DAILY_ADVENTURE_LOCATIONS,
  getDailyAdventureRouteTilesForLocation,
  getDailyAdventureAvailableLocationIds,
  isDailyAdventureCompanionUnlocked,
  updateDailyAdventureSelection,
  type DailyAdventureCompanionId,
  type DailyAdventureLocationId,
} from "@/lib/game/dailyAdventure";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";

export function DailyAdventurePrepareView() {
  const router = useRouter();
  const { state, progress } = useDailyAdventureData();
  const availableLocationIds = getDailyAdventureAvailableLocationIds(state);
  const companionIds = Object.keys(DAILY_ADVENTURE_COMPANIONS) as DailyAdventureCompanionId[];
  const locationIds = Object.keys(DAILY_ADVENTURE_LOCATIONS) as DailyAdventureLocationId[];

  const selectCompanion = (id: DailyAdventureCompanionId) => {
    if (!isDailyAdventureCompanionUnlocked(id, progress)) return;
    updateDailyAdventureSelection({ companionId: id });
  };

  const toggleLocation = (id: DailyAdventureLocationId) => {
    if (!availableLocationIds.includes(id)) return;
    const selected = state.selectedLocationIds.includes(id);
    const next = selected
      ? state.selectedLocationIds.filter((item) => item !== id)
      : [...state.selectedLocationIds, id].slice(-2);
    updateDailyAdventureSelection({ locationIds: next });
  };

  return (
    <DailyAdventureShell title="出發準備" backHref={ROUTES.gameDaily} showBottomNav={false}>
      <Flex p="12px" borderRadius="16px" bgColor="#FFF9EE" border="1px solid #E8D3B4" direction="column">
        <Text color="#795B44" fontSize="13px" fontWeight="900">先決定同行夥伴，再選最多兩個冒險地點。</Text>
        <Text mt="3px" color="#9A806C" fontSize="11px" lineHeight="1.4">關卡只會帶入你已收集的該地點拼圖；每一張寬窄拼圖都要分開取得。</Text>
      </Flex>

      <Text mt="16px" mb="8px" color="#604A3A" fontSize="16px" fontWeight="900">1. 同行夥伴</Text>
      <Flex gap="9px" overflowX="auto" pb="5px" css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {companionIds.map((id) => {
          const companion = DAILY_ADVENTURE_COMPANIONS[id];
          const unlocked = isDailyAdventureCompanionUnlocked(id, progress);
          const selected = state.selectedCompanionId === id;
          return (
            <Flex
              as="button"
              key={id}
              position="relative"
              minW="112px"
              h="154px"
              borderRadius="17px"
              bgColor={selected ? "#F4DDC4" : "#FFFFFF"}
              border={selected ? "2px solid #B77B51" : "2px solid transparent"}
              direction="column"
              alignItems="center"
              overflow="hidden"
              opacity={unlocked ? 1 : 0.58}
              cursor={unlocked ? "pointer" : "default"}
              boxShadow="0 6px 14px rgba(79,57,40,0.08)"
              onClick={() => selectCompanion(id)}
            >
              <Flex w="100%" h="100px" bgColor="#F7EDDE" alignItems="center" justifyContent="center" overflow="hidden">
                <img src={companion.imagePath} alt={unlocked ? companion.name : "未解鎖夥伴"} style={{ width: "90%", height: "95%", objectFit: "contain", filter: unlocked ? "none" : "grayscale(1) brightness(0.45)" }} />
              </Flex>
              <Text mt="7px" color="#5E493A" fontSize="14px" fontWeight="900">{unlocked ? companion.name : "???"}</Text>
              <Text px="7px" color="#9A7D67" fontSize="9px" lineHeight="1.25" textAlign="center">{unlocked ? companion.role : "主線遇見後開放"}</Text>
              {selected ? <Flex position="absolute" right="6px" top="6px" color="#A86D47"><IoCheckmarkCircle size={21} /></Flex> : null}
              {!unlocked ? <Flex position="absolute" right="7px" top="7px" w="22px" h="22px" borderRadius="50%" bgColor="rgba(255,255,255,0.88)" alignItems="center" justifyContent="center"><IoLockClosed size={12} color="#74665D" /></Flex> : null}
            </Flex>
          );
        })}
      </Flex>

      <Flex mt="16px" mb="8px" alignItems="baseline" justifyContent="space-between">
        <Text color="#604A3A" fontSize="16px" fontWeight="900">2. 冒險地點</Text>
        <Text color="#9B7B62" fontSize="11px" fontWeight="900">{state.selectedLocationIds.length}/2</Text>
      </Flex>
      <Flex wrap="wrap" gap="9px">
        {locationIds.map((id) => {
          const location = DAILY_ADVENTURE_LOCATIONS[id];
          const routeTiles = getDailyAdventureRouteTilesForLocation(id);
          const collectedRouteTiles = getDailyAdventureRouteTilesForLocation(
            id,
            state.collectedRouteTileIds,
          );
          const previewTile = collectedRouteTiles[0] ?? routeTiles[0];
          const unlocked = availableLocationIds.includes(id);
          const selected = state.selectedLocationIds.includes(id);
          return (
            <Flex
              as="button"
              key={id}
              position="relative"
              w="calc(50% - 5px)"
              minH="126px"
              borderRadius="16px"
              bgColor="#FFFFFF"
              border={selected ? "3px solid #B77B51" : "3px solid #FFFFFF"}
              overflow="hidden"
              direction="column"
              opacity={unlocked ? 1 : 0.55}
              cursor={unlocked ? "pointer" : "default"}
              boxShadow="0 6px 14px rgba(79,57,40,0.08)"
              onClick={() => toggleLocation(id)}
            >
              <Flex h="78px" w="100%" overflow="hidden" bgColor="#D6C3AA">
                <img src={previewTile?.imagePath ?? location.tileImagePath} alt={unlocked ? `${location.name}拼圖` : "未收集地點"} style={{ width: "100%", height: "100%", objectFit: "cover", filter: unlocked ? "none" : "grayscale(1) brightness(0.5)" }} />
              </Flex>
              <Flex flex="1" px="9px" py="7px" alignItems="center" justifyContent="space-between">
                <Flex direction="column" alignItems="flex-start">
                  <Text color="#5E493A" fontSize="14px" fontWeight="900">{unlocked ? location.name : "未收集"}</Text>
                  <Text color="#9B816E" fontSize="9px">
                    {routeTiles.length === 0
                      ? "等待對應模式素材"
                      : unlocked
                        ? `已收集 ${collectedRouteTiles.length}/${routeTiles.length} 張`
                        : `尚未收集・共 ${routeTiles.length} 張`}
                  </Text>
                </Flex>
                {selected ? <IoCheckmarkCircle size={22} color="#A86D47" /> : !unlocked ? <IoLockClosed size={15} color="#74665D" /> : null}
              </Flex>
            </Flex>
          );
        })}
      </Flex>

      <Flex
        as="button"
        mt="17px"
        mb="8px"
        w="100%"
        h="56px"
        borderRadius="18px"
        bgColor={state.selectedLocationIds.length > 0 ? "#9B704F" : "#C8B8AB"}
        color="#FFFFFF"
        alignItems="center"
        justifyContent="center"
        gap="7px"
        cursor={state.selectedLocationIds.length > 0 ? "pointer" : "not-allowed"}
        onClick={() => {
          if (state.selectedLocationIds.length === 0) return;
          router.push(withTrialProfileSearch(ROUTES.gameDailyStages));
        }}
      >
        <Text color="white" fontSize="17px" fontWeight="900">選擇冒險關卡</Text>
        <IoChevronForward size={20} />
      </Flex>
    </DailyAdventureShell>
  );
}

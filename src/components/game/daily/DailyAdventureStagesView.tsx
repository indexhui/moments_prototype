"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoCheckmark, IoChevronForward, IoFlash, IoFlaskOutline, IoLockClosed } from "react-icons/io5";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_ROUTE_TILES,
  DAILY_ADVENTURE_STAGES,
  beginDailyAdventureStage,
} from "@/lib/game/dailyAdventure";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";

const MODE_TONE = {
  "route-width": { bg: "#DDE5CF", color: "#5F7657" },
  "infinite-corner": { bg: "#F0D7C3", color: "#996146" },
  "metro-exit": { bg: "#D8DFE4", color: "#617583" },
} as const;

export function DailyAdventureStagesView() {
  const router = useRouter();
  const { state } = useDailyAdventureData();
  const [message, setMessage] = useState("");

  const startStage = (stageId: number) => {
    if (state.activeRun && state.activeRun.stageId !== stageId) {
      setMessage(`第 ${state.activeRun.stageId} 關還在進行中，請先完成。`);
      return;
    }
    const result = beginDailyAdventureStage(stageId);
    if (!result.ok) {
      setMessage(result.reason);
      return;
    }
    router.push(withTrialProfileSearch(ROUTES.gameDailyPlay));
  };

  return (
    <DailyAdventureShell title="冒險關卡" backHref={ROUTES.gameDaily}>
      <Flex p="12px" borderRadius="16px" bgColor="#FFF9EE" border="1px solid #E8D3B4" direction="column">
        <Text color="#795B44" fontSize="13px" fontWeight="900">關卡控制路線玩法，地點拼圖控制可能遇見的收藏。</Text>
        <Text mt="3px" color="#9A806C" fontSize="11px">首通會取得一張新路線拼圖；重玩可繼續補齊所選地點的其他接頭。</Text>
      </Flex>

      {message ? (
        <Flex mt="9px" minH="38px" px="11px" borderRadius="12px" bgColor="#F4E0D2" alignItems="center">
          <Text color="#966047" fontSize="11px" fontWeight="900">{message}</Text>
        </Flex>
      ) : null}

      <Flex mt="13px" direction="column" gap="10px">
        {DAILY_ADVENTURE_STAGES.map((stage, index) => {
          const unlocked = stage.id <= state.highestUnlockedStage;
          const completed = state.completedStageIds.includes(stage.id);
          const developing = stage.status === "development";
          const tone = MODE_TONE[stage.mode];
          const rewardTile = stage.firstClearRouteTileRewardId
            ? DAILY_ADVENTURE_ROUTE_TILES[stage.firstClearRouteTileRewardId]
            : null;
          const rewardLocation = rewardTile
            ? DAILY_ADVENTURE_LOCATIONS[rewardTile.locationId]
            : null;
          return (
            <Flex key={stage.id} position="relative" alignItems="stretch" gap="9px">
              <Flex w="36px" direction="column" alignItems="center">
                <Flex
                  w="34px"
                  h="34px"
                  borderRadius="50%"
                  bgColor={completed ? "#78916C" : unlocked ? "#A87653" : "#C9BCAF"}
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  zIndex={2}
                >
                  {completed ? <IoCheckmark size={18} /> : developing ? <IoFlaskOutline size={17} /> : <Text color="white" fontSize="13px" fontWeight="900">{stage.id}</Text>}
                </Flex>
                {index < DAILY_ADVENTURE_STAGES.length - 1 ? <Box w="3px" flex="1" minH="104px" bgColor={completed ? "#A9BA9F" : "#DDD2C7"} /> : null}
              </Flex>
              <Flex
                flex="1"
                minW="0"
                minH="128px"
                mb={index < DAILY_ADVENTURE_STAGES.length - 1 ? "2px" : "0"}
                borderRadius="18px"
                bgColor="#FFFFFF"
                p="13px"
                direction="column"
                opacity={unlocked || developing ? 1 : 0.62}
                boxShadow="0 6px 14px rgba(79,57,40,0.08)"
              >
                <Flex alignItems="center" justifyContent="space-between" gap="8px">
                  <Flex h="25px" px="9px" borderRadius="999px" bgColor={tone.bg} alignItems="center">
                    <Text color={tone.color} fontSize="10px" fontWeight="900">{stage.modeLabel}</Text>
                  </Flex>
                  <Flex alignItems="center" gap="3px" color="#A27758">
                    <IoFlash size={13} />
                    <Text color="#A27758" fontSize="10px" fontWeight="900">-{stage.actionCost}</Text>
                  </Flex>
                </Flex>
                <Text mt="8px" color="#594538" fontSize="17px" fontWeight="900">{stage.id}. {stage.title}</Text>
                <Text mt="2px" color="#927763" fontSize="11px" lineHeight="1.4">{stage.subtitle}</Text>
                <Flex mt="auto" pt="9px" alignItems="center" justifyContent="space-between" gap="8px">
                  <Text color="#A08169" fontSize="10px" fontWeight="800">
                    {developing
                      ? "開發設計中"
                      : completed
                        ? "可重玩收集"
                        : rewardTile && rewardLocation
                          ? `首通：${rewardLocation.name}・${rewardTile.variantLabel}`
                          : "首通：收藏加權"}
                  </Text>
                  <Flex
                    as="button"
                    h="32px"
                    minW="72px"
                    px="10px"
                    borderRadius="999px"
                    bgColor={developing ? "#D9E0E4" : unlocked ? "#9B704F" : "#D2C8BF"}
                    color={developing ? "#657783" : "white"}
                    alignItems="center"
                    justifyContent="center"
                    gap="3px"
                    cursor={unlocked && !developing ? "pointer" : "default"}
                    aria-disabled={!unlocked || developing}
                    tabIndex={unlocked && !developing ? 0 : -1}
                    onClick={() => {
                      if (!unlocked || developing) return;
                      startStage(stage.id);
                    }}
                  >
                    {!unlocked && !developing ? <IoLockClosed size={12} /> : null}
                    <Text color="inherit" fontSize="11px" fontWeight="900">
                      {developing
                        ? "預告"
                        : !unlocked
                          ? "鎖定"
                          : state.activeRun?.stageId === stage.id
                            ? "繼續"
                            : completed
                              ? "重玩"
                              : "開始"}
                    </Text>
                    {unlocked && !developing ? <IoChevronForward size={13} /> : null}
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </DailyAdventureShell>
  );
}

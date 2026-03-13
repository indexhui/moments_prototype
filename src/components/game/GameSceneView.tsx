"use client";

import { useEffect, useMemo, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getChapterScenesUntilScene, type GameScene } from "@/lib/game/scenes";
import { EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";
import {
  claimOffworkRewardBatch,
  claimOffworkReward,
  FIRST_OFFWORK_REWARD_PATTERN,
  generateOffworkRewardPattern,
  loadPlayerProgress,
  savePlayerProgress,
  type PlaceTileId,
  type TilePattern3x3,
} from "@/lib/game/playerProgress";

type OffworkRewardOption = {
  id: PlaceTileId;
  title: string;
  icon: string;
  subtitle: string;
};

const STREET_OPTION: OffworkRewardOption = {
  id: "street",
  title: "街道",
  icon: "💡",
  subtitle: "熟悉路線",
};

const METRO_OPTION: OffworkRewardOption = {
  id: "metro-station",
  title: "捷運",
  icon: "🚉",
  subtitle: "通勤節點",
};

const REWARD_POOL_OPTIONS: OffworkRewardOption[] = [
  { id: "park", title: "公園", icon: "🌳", subtitle: "喘口氣" },
  STREET_OPTION,
  METRO_OPTION,
  { id: "breakfast-shop", title: "早餐店", icon: "🥪", subtitle: "補充元氣" },
];

function pickTwoRandomFromPool(pool: OffworkRewardOption[]): OffworkRewardOption[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 2);
}

function pickOffworkRewardOptions(
  offworkRewardClaimCount: number,
  hasPassedThroughStreet: boolean,
): OffworkRewardOption[] {
  const attempt = offworkRewardClaimCount + 1;
  if (attempt === 1) return [METRO_OPTION, STREET_OPTION];
  if (attempt === 2) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3 && !hasPassedThroughStreet) return [METRO_OPTION, STREET_OPTION];
  if (attempt >= 3) return pickTwoRandomFromPool(REWARD_POOL_OPTIONS);
  return [METRO_OPTION, STREET_OPTION];
}
type CustomRouteStep = "size" | "entry" | "exit" | "result";
type CustomRouteSize = "1x1" | "2x1";

const ENTRY_PATTERN_OPTIONS_6: number[][] = [
  [1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 1],
  [1, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1],
];

const ENTRY_PATTERN_OPTIONS_3: number[][] = [
  [1, 1, 1],
  [1, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

function normalizeEdgePatternToWidth(pattern: number[], width: 3 | 6): number[] {
  const normalized = pattern.map((cell) => (cell ? 1 : 0));
  if (normalized.length === width) return normalized;
  if (normalized.length === 6 && width === 3) {
    return [
      normalized[0] || normalized[1] ? 1 : 0,
      normalized[2] || normalized[3] ? 1 : 0,
      normalized[4] || normalized[5] ? 1 : 0,
    ];
  }
  if (normalized.length === 3 && width === 6) {
    return [normalized[0], normalized[0], normalized[1], normalized[1], normalized[2], normalized[2]];
  }
  return [
    normalized[0] ? 1 : 0,
    normalized[1] ? 1 : 0,
    normalized[2] ? 1 : 0,
  ];
}

function buildCustomRoutePattern(
  size: CustomRouteSize,
  entryPattern6: number[],
  exitPattern6: number[],
): number[][] {
  const width = size === "2x1" ? 6 : 3;
  const pattern = Array.from({ length: 3 }, () => Array.from({ length: width }, () => 0));
  const normalizedEntry = normalizeEdgePatternToWidth(entryPattern6, width as 3 | 6);
  const normalizedExit = normalizeEdgePatternToWidth(exitPattern6, width as 3 | 6);
  normalizedEntry.forEach((cell, index) => {
    pattern[0][index] = cell ? 1 : 0;
  });
  normalizedExit.forEach((cell, index) => {
    pattern[2][index] = cell ? 1 : 0;
  });

  const entryIndexes = normalizedEntry
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);
  const exitIndexes = normalizedExit
    .map((cell, index) => (cell ? index : -1))
    .filter((index) => index >= 0);

  let entryAnchor = Math.floor((width - 1) / 2);
  let exitAnchor = Math.floor((width - 1) / 2);
  if (entryIndexes.length > 0) entryAnchor = entryIndexes[0];
  if (exitIndexes.length > 0) exitAnchor = exitIndexes[0];
  if (entryIndexes.length > 0 && exitIndexes.length > 0) {
    let bestPair: [number, number] = [entryIndexes[0], exitIndexes[0]];
    let bestDistance = Math.abs(bestPair[0] - bestPair[1]);
    entryIndexes.forEach((entryIndex) => {
      exitIndexes.forEach((exitIndex) => {
        const distance = Math.abs(entryIndex - exitIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPair = [entryIndex, exitIndex];
        }
      });
    });
    [entryAnchor, exitAnchor] = bestPair;
  }

  const start = Math.min(entryAnchor, exitAnchor);
  const end = Math.max(entryAnchor, exitAnchor);
  for (let col = start; col <= end; col += 1) {
    pattern[1][col] = 1;
  }

  // Ensure every chosen inlet/outlet column is connected into the center row,
  // while keeping top/bottom rows exactly as selected by the player.
  entryIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });
  exitIndexes.forEach((index) => {
    pattern[1][index] = 1;
  });

  return pattern;
}

function toPattern3x3(pattern: number[][]): TilePattern3x3 {
  return [
    [pattern[0][0] ? 1 : 0, pattern[0][1] ? 1 : 0, pattern[0][2] ? 1 : 0],
    [pattern[1][0] ? 1 : 0, pattern[1][1] ? 1 : 0, pattern[1][2] ? 1 : 0],
    [pattern[2][0] ? 1 : 0, pattern[2][1] ? 1 : 0, pattern[2][2] ? 1 : 0],
  ];
}
export function GameSceneView({
  scene,
  onOffworkRewardOpenChange,
}: {
  scene: GameScene;
  onOffworkRewardOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyScenes = getChapterScenesUntilScene(scene);
  const isImageOnlyScene = scene.showDialogueUI === false;
  const isOffworkScene = scene.id === "scene-offwork";
  const [isOffworkLabelVisible, setIsOffworkLabelVisible] = useState(isOffworkScene);
  const [isOffworkRewardOpen, setIsOffworkRewardOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<PlaceTileId | null>(null);
  const [selectedRewardActionCost, setSelectedRewardActionCost] = useState<0 | 1>(0);
  const [offworkRewardChoices, setOffworkRewardChoices] = useState<OffworkRewardOption[]>(
    [METRO_OPTION, STREET_OPTION],
  );
  const [offworkRewardClaimCount, setOffworkRewardClaimCount] = useState(0);
  const [offworkModalStatus, setOffworkModalStatus] = useState<PlayerStatus>(INITIAL_PLAYER_STATUS);
  const [customRouteCostError, setCustomRouteCostError] = useState("");
  const [placeRewardCostError, setPlaceRewardCostError] = useState("");
  const [offworkRewardPattern, setOffworkRewardPattern] = useState<TilePattern3x3>(
    FIRST_OFFWORK_REWARD_PATTERN,
  );
  const [customRouteStep, setCustomRouteStep] = useState<CustomRouteStep | null>(null);
  const [customRouteSize, setCustomRouteSize] = useState<CustomRouteSize>("1x1");
  const [customRouteEntryPattern, setCustomRouteEntryPattern] = useState<number[] | null>(null);
  const [customRouteExitPattern, setCustomRouteExitPattern] = useState<number[] | null>(null);

  useEffect(() => {
    if (!scene.autoAdvanceMs || !scene.nextSceneId) return;
    const timer = setTimeout(() => {
      router.push(ROUTES.gameScene(scene.nextSceneId!));
    }, scene.autoAdvanceMs);
    return () => clearTimeout(timer);
  }, [router, scene.autoAdvanceMs, scene.nextSceneId]);

  useEffect(() => {
    if (!isOffworkScene) {
      setIsOffworkLabelVisible(false);
      setIsOffworkRewardOpen(false);
      setSelectedRewardId(null);
      return;
    }

    setIsOffworkLabelVisible(true);
    setIsOffworkRewardOpen(false);
    setSelectedRewardId(null);
    setSelectedRewardActionCost(0);
    const progress = loadPlayerProgress();
    setOffworkRewardClaimCount(progress.offworkRewardClaimCount);
    setOffworkModalStatus(progress.status);
    setOffworkRewardChoices(
      pickOffworkRewardOptions(progress.offworkRewardClaimCount, progress.hasPassedThroughStreet),
    );
    setCustomRouteCostError("");
    setPlaceRewardCostError("");
    setOffworkRewardPattern(
      generateOffworkRewardPattern(progress.offworkRewardClaimCount === 0),
    );
    setCustomRouteStep(null);
    setCustomRouteSize("1x1");
    setCustomRouteEntryPattern(null);
    setCustomRouteExitPattern(null);

    const labelTimer = setTimeout(() => {
      setIsOffworkLabelVisible(false);
    }, 900);
    const modalTimer = setTimeout(() => {
      setIsOffworkRewardOpen(true);
    }, 1200);

    return () => {
      clearTimeout(labelTimer);
      clearTimeout(modalTimer);
    };
  }, [isOffworkScene, scene.id]);

  useEffect(() => {
    onOffworkRewardOpenChange?.(isOffworkRewardOpen);
    return () => onOffworkRewardOpenChange?.(false);
  }, [isOffworkRewardOpen, onOffworkRewardOpenChange]);

  const selectedReward = offworkRewardChoices.find((item) => item.id === selectedRewardId) ?? null;
  const edgePatternOptions = customRouteSize === "2x1" ? ENTRY_PATTERN_OPTIONS_6 : ENTRY_PATTERN_OPTIONS_3;
  const edgePatternWidth = customRouteSize === "2x1" ? 6 : 3;
  const edgePatternColumns = customRouteSize === "2x1" ? 4 : 3;
  const customRouteCost = 2;
  const customRouteCostLabel = "本次花費：2";
  const customRoutePattern = useMemo<number[][]>(() => {
    if (customRouteEntryPattern === null || customRouteExitPattern === null) {
      return FIRST_OFFWORK_REWARD_PATTERN;
    }
    return buildCustomRoutePattern(customRouteSize, customRouteEntryPattern, customRouteExitPattern);
  }, [customRouteEntryPattern, customRouteExitPattern, customRouteSize]);

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        w="100%"
        h="100%"
        bgColor={scene.backgroundColor ?? "#D6D4B9"}
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
        direction="column"
        backgroundImage={scene.backgroundImage ? `url('${scene.backgroundImage}')` : undefined}
        backgroundSize="cover"
        backgroundPosition="center bottom"
        backgroundRepeat="no-repeat"
      >
        {isImageOnlyScene ? (
          <>
            <Text position="absolute" top="18px" left="18px" color="#252525" fontSize="34px" fontWeight="700">
              back
            </Text>
            {scene.sceneLabel && (!isOffworkScene || isOffworkLabelVisible) ? (
              <Flex
                position="absolute"
                top="50%"
                left="0"
                right="0"
                transform="translateY(-50%)"
                bgColor="rgba(132, 104, 76, 0.92)"
                h="104px"
                alignItems="center"
                justifyContent="center"
                opacity={isOffworkScene && !isOffworkLabelVisible ? 0 : 1}
                transition="opacity 0.25s ease"
              >
                <Text color="white" fontSize="56px" fontWeight="700" letterSpacing="2px">
                  {scene.sceneLabel}
                </Text>
              </Flex>
            ) : null}
          </>
        ) : (
          <Flex position="absolute" top="18px" left="18px">
            <Text color="white" fontWeight="700" fontSize="24px" textShadow="0 2px 6px rgba(0,0,0,0.35)">
              {scene.sceneLabel ?? ""}
            </Text>
          </Flex>
        )}

        {scene.characterAvatar ? (
          <Flex position="absolute" top="140px" left="50%" transform="translateX(-50%)">
            <Flex
              w="88px"
              h="88px"
              borderRadius="999px"
              overflow="hidden"
              border="3px solid white"
              boxShadow="0 4px 14px rgba(0,0,0,0.25)"
              alignItems="center"
              justifyContent="center"
              bgColor="#E8E1D8"
            >
              <img
                src={scene.characterAvatar}
                alt={scene.characterName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Flex>
          </Flex>
        ) : null}

        {isImageOnlyScene ? null : (
          <Flex position="absolute" right="14px" bottom="186px" direction="column" gap="8px">
            <Flex w="38px" h="38px" bgColor="rgba(148, 110, 79, 0.9)" borderRadius="6px" alignItems="center" justifyContent="center">
              <Text color="white" fontSize="18px">
                ≡
              </Text>
            </Flex>
            <Flex
              w="38px"
              h="38px"
              bgColor="rgba(148, 110, 79, 0.9)"
              borderRadius="6px"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={() => setIsHistoryOpen(true)}
            >
              <Text color="white" fontSize="18px">
                ↺
              </Text>
            </Flex>
          </Flex>
        )}

        {isImageOnlyScene ? null : (
          <EventDialogPanel mt="auto">
            <Text color="white" fontWeight="700">
              {scene.characterName}
            </Text>
            <Flex flex="1" minH="0" direction="column" justifyContent="center">
              <Text color="white" fontSize="16px" lineHeight="1.5">
                {scene.dialogue}
              </Text>
            </Flex>
            {scene.nextSceneId ? (
              <NextLink href={ROUTES.gameScene(scene.nextSceneId)}>
                <Flex
                  h="52px"
                  mt="auto"
                  mx="-12px"
                  mb="-12px"
                  px="16px"
                  alignItems="center"
                  justifyContent="center"
                  backgroundImage="linear-gradient(90deg, #8F6D50 0%, #AA825F 100%)"
                  borderTop="1px solid rgba(255,255,255,0.12)"
                  cursor="pointer"
                >
                  <Text color="rgba(255,255,255,0.95)" fontSize="14px">
                    ☝ 點擊繼續
                  </Text>
                </Flex>
              </NextLink>
            ) : null}
          </EventDialogPanel>
        )}
      </Flex>

      {isImageOnlyScene ? null : (
        <Flex
          position="absolute"
          inset="0"
          zIndex={30}
          opacity={isHistoryOpen ? 1 : 0}
          pointerEvents={isHistoryOpen ? "auto" : "none"}
          transition="opacity 0.22s ease"
        >
          <Flex position="absolute" inset="0" bgColor="rgba(0, 0, 0, 0.25)" onClick={() => setIsHistoryOpen(false)} />
          <Flex
            w="100%"
            h="100%"
            bgColor="#9E795A"
            direction="column"
            transform={isHistoryOpen ? "translateY(0)" : "translateY(12px)"}
            transition="transform 0.22s ease"
          >
            <Flex
              h="78px"
              borderBottom="1px solid rgba(255,255,255,0.28)"
              alignItems="center"
              px="16px"
              justifyContent="space-between"
            >
              <Flex onClick={() => setIsHistoryOpen(false)} cursor="pointer">
                <Text color="white" fontSize="20px">
                  {"< 返回"}
                </Text>
              </Flex>
              <Text color="white" fontSize="40px" fontWeight="700" lineHeight="1">
                回顧
              </Text>
              <Flex w="72px" />
            </Flex>

            <Flex direction="column" gap="20px" p="18px" overflowY="auto">
              {historyScenes.map((item) => (
                <Flex key={item.id} direction="column" gap="6px">
                  <Text color="white" fontWeight="700" fontSize="36px" lineHeight="1.2">
                    {item.characterName}
                  </Text>
                  <Text color="white" fontSize="16px" lineHeight="1.45">
                    {item.dialogue}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Flex>
      )}

      {isOffworkScene && isOffworkRewardOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(0,0,0,0.38)" alignItems="center" justifyContent="center" p="22px">
          <Flex
            w="100%"
            maxW="340px"
            minH="350px"
            bgColor="#A27F5D"
            borderRadius="12px"
            border="3px solid #D9C4A7"
            boxShadow="0 12px 26px rgba(0,0,0,0.25)"
            direction="column"
            alignItems="center"
            p="20px 16px 18px"
            gap="14px"
          >
            <Text color="white" fontSize="22px" lineHeight="1">
              下班獎勵
            </Text>
            <Text color="white" fontSize="32px" lineHeight="1">
              挑選一個
            </Text>
            <Flex
              w="100%"
              borderRadius="10px"
              bgColor="rgba(255,255,255,0.2)"
              px="10px"
              py="8px"
              justifyContent="space-between"
              gap="8px"
            >
              <Text color="#F9F0E2" fontSize="13px">
                儲蓄：{offworkModalStatus.savings}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                行動力：{offworkModalStatus.actionPower}
              </Text>
              <Text color="#F9F0E2" fontSize="13px">
                疲勞值：{offworkModalStatus.fatigue}
              </Text>
            </Flex>
            {offworkRewardClaimCount >= 1 ? (
              <Text color="#F8EACD" fontSize="12px" fontWeight="700">
                自組路徑：{customRouteCostLabel}
              </Text>
            ) : null}

            {customRouteStep ? (
              <>
                <Text color="white" fontSize="24px" lineHeight="1">
                  一組路徑拼圖
                </Text>
                {customRouteStep === "size" ? (
                  <Flex w="100%" justifyContent="center" gap="12px">
                    {(["1x1", "2x1"] as const).map((sizeOption) => (
                      <Flex
                        key={sizeOption}
                        w="132px"
                        h="132px"
                        borderRadius="12px"
                        bgColor="#ECECEC"
                        border={customRouteSize === sizeOption ? "2px solid #4FAE87" : "2px solid transparent"}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        gap="14px"
                        cursor="pointer"
                        onClick={() => {
                          setCustomRouteSize(sizeOption);
                          setCustomRouteEntryPattern(null);
                          setCustomRouteExitPattern(null);
                          setCustomRouteCostError("");
                          setCustomRouteStep("entry");
                        }}
                      >
                        <Flex
                          w={sizeOption === "1x1" ? "58px" : "96px"}
                          h="58px"
                          borderRadius="8px"
                          border="3px solid #B38C5C"
                          bgColor="#DCD3C1"
                        />
                        <Text color="#6B5240" fontSize="34px" fontWeight="700" lineHeight="1">
                          {sizeOption}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                ) : null}
                {customRouteStep === "entry" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇入口（上排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((entryPattern, optionIndex) => (
                        <Flex
                          key={`entry-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteEntryPattern(entryPattern);
                            setCustomRouteStep("exit");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isTopRow = index < edgePatternWidth;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isTopRow ? entryPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`entry-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "exit" ? (
                  <Flex w="100%" direction="column" alignItems="center" gap="10px">
                    <Text color="#F8EACD" fontSize="18px" fontWeight="700">
                      選擇出口（下排）
                    </Text>
                    <Grid templateColumns={`repeat(${edgePatternColumns}, minmax(0, 1fr))`} gap="8px" w="100%">
                      {edgePatternOptions.map((exitPattern, optionIndex) => (
                        <Flex
                          key={`exit-pattern-${optionIndex}`}
                          h="54px"
                          borderRadius="10px"
                          bgColor="#ECECEC"
                          border="2px solid rgba(163,135,101,0.35)"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setCustomRouteExitPattern(exitPattern);
                            setCustomRouteStep("result");
                          }}
                        >
                          <Grid
                            templateColumns={`repeat(${edgePatternWidth}, 6px)`}
                            templateRows="repeat(3, 6px)"
                            gap="2px"
                          >
                            {Array.from({ length: edgePatternWidth * 3 }).map((_, index) => {
                              const isBottomRow = index >= edgePatternWidth * 2;
                              const cellIndex = index % edgePatternWidth;
                              const isFilled = isBottomRow ? exitPattern[cellIndex] === 1 : false;
                              return (
                              <Flex
                                key={`exit-cell-${optionIndex}-${index}`}
                                w="6px"
                                h="6px"
                                borderRadius="2px"
                                bgColor={isFilled ? "#A38765" : "#DADADA"}
                              />
                            );
                            })}
                          </Grid>
                        </Flex>
                      ))}
                    </Grid>
                  </Flex>
                ) : null}
                {customRouteStep === "result" ? (
                  <>
                    <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                      獲得路徑拼圖
                    </Text>
                    <Flex
                      w="130px"
                      h="130px"
                      borderRadius="8px"
                      bgColor="#E8E8E8"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Grid
                        templateColumns={`repeat(${customRouteSize === "2x1" ? 6 : 3}, 16px)`}
                        templateRows="repeat(3, 16px)"
                        gap="2px"
                      >
                        {customRoutePattern.flat().map((cell, index) => (
                          <Flex
                            key={index}
                            w="16px"
                            h="16px"
                            borderRadius="3px"
                            bgColor={cell ? "#A38765" : "#DADADA"}
                          />
                        ))}
                      </Grid>
                    </Flex>
                    <Flex
                      mt="2px"
                      px="18px"
                      py="8px"
                      borderRadius="999px"
                      bgColor="#6F533A"
                      cursor="pointer"
                      onClick={() => {
                        const latestProgress = loadPlayerProgress();
                        if (latestProgress.status.savings < customRouteCost) {
                          setCustomRouteCostError("儲蓄不足，需要 2 才能購買自組路徑");
                          return;
                        }
                        const nextProgress = {
                          ...latestProgress,
                          status: {
                            ...latestProgress.status,
                            savings: latestProgress.status.savings - customRouteCost,
                          },
                        };
                        savePlayerProgress(nextProgress);
                        setOffworkModalStatus(nextProgress.status);
                        setCustomRouteCostError("");
                        if (customRouteSize === "2x1") {
                          claimOffworkRewardBatch([
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(0, 3))),
                              options: { label: "自組路徑A", centerEmoji: "🧩", category: "route" },
                            },
                            {
                              tileId: "street",
                              rewardPattern: toPattern3x3(customRoutePattern.map((row) => row.slice(3, 6))),
                              options: { label: "自組路徑B", centerEmoji: "🧩", category: "route" },
                            },
                          ]);
                        } else {
                          claimOffworkReward("street", toPattern3x3(customRoutePattern), {
                            label: "自組路徑",
                            centerEmoji: "🧩",
                            category: "route",
                          });
                        }
                        setIsOffworkRewardOpen(false);
                        router.push(ROUTES.gameArrangeRoute);
                      }}
                    >
                      <Text color="white" fontSize="18px" fontWeight="700">
                        收下
                      </Text>
                    </Flex>
                    <Text color={offworkRewardClaimCount === 0 ? "#F8EACD" : "#FFD8A8"} fontSize="13px" fontWeight="700">
                      {customRouteCostLabel}
                    </Text>
                    {customRouteCostError ? (
                      <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                        {customRouteCostError}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {customRouteStep !== "size" ? (
                  <Flex
                    px="14px"
                    py="6px"
                    borderRadius="999px"
                    bgColor="rgba(111,83,58,0.6)"
                    cursor="pointer"
                    onClick={() => {
                      if (customRouteStep === "entry") setCustomRouteStep("size");
                      if (customRouteStep === "exit") setCustomRouteStep("entry");
                      if (customRouteStep === "result") setCustomRouteStep("exit");
                    }}
                  >
                    <Text color="white" fontSize="14px">
                      返回上一步
                    </Text>
                  </Flex>
                ) : null}
              </>
            ) : selectedReward ? (
              <>
                <Flex
                  w="130px"
                  h="130px"
                  borderRadius="8px"
                  bgColor="#E8E8E8"
                  alignItems="center"
                  justifyContent="center"
                  direction="column"
                  gap="8px"
                >
                  <Text color="#7A6048" fontSize="22px" fontWeight="700" lineHeight="1">
                    {selectedReward.title}
                  </Text>
                  <Grid templateColumns="repeat(3, 18px)" templateRows="repeat(3, 18px)" gap="2px">
                    {offworkRewardPattern.flat().map((cell, index) => (
                      <Flex
                        key={index}
                        w="18px"
                        h="18px"
                        borderRadius="3px"
                        bgColor={cell ? "#A38765" : "#DADADA"}
                      />
                    ))}
                  </Grid>
                </Flex>
                <Text color="#F8EACD" fontSize="20px" fontWeight="700">
                  已獲得地點拼圖
                </Text>
                <Flex
                  mt="2px"
                  px="18px"
                  py="8px"
                  borderRadius="999px"
                  bgColor="#6F533A"
                  cursor="pointer"
                  onClick={() => {
                    if (!selectedReward) return;
                    const latestProgress = loadPlayerProgress();
                    if (selectedRewardActionCost > 0 && latestProgress.status.actionPower < selectedRewardActionCost) {
                      setPlaceRewardCostError("行動力不足，需要 1 才能選擇這個地點");
                      return;
                    }
                    if (selectedRewardActionCost > 0) {
                      const nextProgress = {
                        ...latestProgress,
                        status: {
                          ...latestProgress.status,
                          actionPower: latestProgress.status.actionPower - selectedRewardActionCost,
                        },
                      };
                      savePlayerProgress(nextProgress);
                      setOffworkModalStatus(nextProgress.status);
                    }
                    setPlaceRewardCostError("");
                    claimOffworkReward(selectedReward.id, offworkRewardPattern, {
                      category: "place",
                      label: selectedReward.title,
                      centerEmoji: selectedReward.icon,
                    });
                    setIsOffworkRewardOpen(false);
                    router.push(ROUTES.gameArrangeRoute);
                  }}
                >
                  <Text color="white" fontSize="18px" fontWeight="700">
                    收下
                  </Text>
                </Flex>
                {placeRewardCostError ? (
                  <Text color="#FFE1E1" fontSize="12px" fontWeight="700">
                    {placeRewardCostError}
                  </Text>
                ) : null}
              </>
            ) : (
              <Flex w="100%" justifyContent="center" gap="12px">
                {offworkRewardChoices.map((item, optionIndex) => (
                  <Flex
                    key={item.id}
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    position="relative"
                    onClick={() => {
                      setCustomRouteStep(null);
                      setSelectedRewardId(item.id);
                      setSelectedRewardActionCost(optionIndex === 0 ? 0 : 1);
                      setPlaceRewardCostError("");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      {item.icon}
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      {item.title}
                    </Text>
                    <Text color="#8E6D52" fontSize="16px" lineHeight="1">
                      {item.subtitle}
                    </Text>
                    <Text
                      color={optionIndex === 0 ? "#5F9C64" : "#B06A2A"}
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      {optionIndex === 0 ? "免費" : "行動力 -1"}
                    </Text>
                  </Flex>
                ))}
                {offworkRewardClaimCount >= 1 ? (
                  <Flex
                    w="132px"
                    h="156px"
                    borderRadius="12px"
                    bgColor="#ECECEC"
                    direction="column"
                    alignItems="center"
                    justifyContent="space-between"
                    p="10px 8px 8px"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedRewardId(null);
                      setCustomRouteStep("size");
                    }}
                  >
                    <Text color="#6B5240" fontSize="30px" lineHeight="1">
                      🧩
                    </Text>
                    <Text color="#6B5240" fontSize="24px" fontWeight="700" lineHeight="1">
                      自組
                    </Text>
                    <Text color="#8E6D52" fontSize="14px" lineHeight="1">
                      自訂路徑
                    </Text>
                    <Text
                      color="#B06A2A"
                      fontSize="11px"
                      fontWeight="700"
                      lineHeight="1"
                    >
                      儲蓄 -2
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            )}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}


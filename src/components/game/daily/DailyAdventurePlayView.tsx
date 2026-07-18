"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import {
  StoryDailyLevelOneRouteView,
  StoryInfiniteCornerRouteView,
} from "@/components/game/StorySimpleMetroRouteView";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS,
  DAILY_ADVENTURE_ROUTE_TILES,
  DAILY_ADVENTURE_STAGES,
  completeDailyAdventureRun,
  type DailyAdventureEdgeWidth,
  type DailyAdventureLocationId,
  type DailyAdventureRouteTileId,
  type DailyAdventureRouteWidthVariant,
  type DailyAdventureRun,
  type DailyAdventureStage,
} from "@/lib/game/dailyAdventure";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  StoryRouteDragPreviewLayer,
  StoryRoutePuzzleBoardTile,
  useStoryRoutePointerDrag,
} from "@/components/game/StoryRoutePuzzleKit";
import { useDailyAdventureData } from "./DailyAdventureShell";

type DailyRouteChoice = {
  id: string;
  label: string;
  locationId: DailyAdventureLocationId | null;
  topEdge: DailyAdventureEdgeWidth;
  bottomEdge: DailyAdventureEdgeWidth;
  imagePath: string;
};

const ROUTE_VARIANTS: Array<{
  id: DailyAdventureRouteWidthVariant;
  topEdge: DailyAdventureEdgeWidth;
  bottomEdge: DailyAdventureEdgeWidth;
}> = [
  { id: "straight", topEdge: "narrow", bottomEdge: "narrow" },
  { id: "wide-to-narrow", topEdge: "wide", bottomEdge: "narrow" },
  { id: "narrow-to-wide", topEdge: "narrow", bottomEdge: "wide" },
  { id: "wide-to-wide", topEdge: "wide", bottomEdge: "wide" },
];

const GENERIC_ROUTE_IMAGES: Record<DailyAdventureRouteWidthVariant, string> = {
  straight: "/images/route/route_new/straight.png",
  "wide-to-narrow": "/images/route/route_new/wide_to_narrow.png",
  "narrow-to-wide": "/images/route/route_new/narrow_to_wide.png",
  "wide-to-wide": "/images/route/route_new/wide_to_wide.png",
};

function buildRouteChoices(
  routeTileIds: readonly DailyAdventureRouteTileId[],
  includeRoadChoices = true,
) {
  const locationChoices = routeTileIds.flatMap((id) => {
    const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
    if (!tile) return [];
    const location = DAILY_ADVENTURE_LOCATIONS[tile.locationId];
    return [{
      id: tile.id,
      label: location.name,
      locationId: tile.locationId,
      topEdge: tile.topEdge,
      bottomEdge: tile.bottomEdge,
      imagePath: tile.imagePath,
    } satisfies DailyRouteChoice];
  });
  const roadChoices = ROUTE_VARIANTS.map((variant) => ({
    id: `road:${variant.id}`,
    label: "一般道路",
    locationId: null,
    topEdge: variant.topEdge,
    bottomEdge: variant.bottomEdge,
    imagePath: GENERIC_ROUTE_IMAGES[variant.id],
  } satisfies DailyRouteChoice));
  return includeRoadChoices ? [...locationChoices, ...roadChoices] : locationChoices;
}

function DailyRouteTile({ choice, compact = false }: { choice: DailyRouteChoice; compact?: boolean }) {
  return (
    <Box position="relative" w="100%" h="100%" overflow="hidden" borderRadius={compact ? "8px" : "4px"}>
      <img src={choice.imagePath} alt={choice.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </Box>
  );
}

function edgeImage(kind: "start" | "end", edge: DailyAdventureEdgeWidth) {
  if (kind === "start") {
    return edge === "wide"
      ? "/images/route/start_end_new/start_home_wide.jpg"
      : "/images/route/start_end_new/start_home_narrow.jpg";
  }
  return edge === "wide"
    ? "/images/route/start_end_new/end_company_wide.jpg"
    : "/images/route/start_end_new/end_company_narror.jpg";
}

function DailyAdventurePhone({ children }: { children: React.ReactNode }) {
  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex w="100%" h="100%" position="relative" direction="column" borderRadius={{ base: "0", sm: "20px" }} overflow="hidden" bgColor="#FDF6EA" boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}>
        {children}
      </Flex>
    </Flex>
  );
}

function PlayHeader({ stage, onBack }: { stage: DailyAdventureStage; onBack: () => void }) {
  return (
    <Flex h="58px" flexShrink={0} bgColor="#8F684E" alignItems="center" px="12px" gap="10px">
      <Flex as="button" w="36px" h="36px" borderRadius="50%" bgColor="rgba(255,255,255,0.16)" color="white" alignItems="center" justifyContent="center" cursor="pointer" onClick={onBack} aria-label="返回關卡">
        <IoArrowBack size={19} />
      </Flex>
      <Flex direction="column" minW="0">
        <Text color="#F8E6D4" fontSize="10px" fontWeight="900">第 {stage.id} 關・{stage.modeLabel}</Text>
        <Text color="white" fontSize="16px" fontWeight="900" lineHeight="1.2">{stage.title}</Text>
      </Flex>
    </Flex>
  );
}

function RouteWidthStage({ stage, run }: { stage: DailyAdventureStage; run: DailyAdventureRun }) {
  const router = useRouter();
  const isLevelOne = stage.id === 1;
  const slotCount = (
    isLevelOne ? stage.slotCount : Math.max(stage.slotCount, run.locationIds.length)
  ) as 1 | 2;
  const choices = useMemo(
    () => buildRouteChoices(
      isLevelOne ? DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS : run.routeTileIds,
      !isLevelOne,
    ),
    [isLevelOne, run.routeTileIds],
  );
  const [placedChoices, setPlacedChoices] = useState<(DailyRouteChoice | null)[]>(
    Array.from({ length: slotCount }, () => null),
  );
  const [heldChoice, setHeldChoice] = useState<DailyRouteChoice | null>(null);
  const [hint, setHint] = useState(
    isLevelOne
      ? "選一塊地點拼圖，對照上下接頭的寬窄。 "
      : "選一塊地點或道路拼圖，接上起點與終點。 ",
  );
  const [isDeparting, setIsDeparting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const drag = useStoryRoutePointerDrag<
    { source: "tray" | "slot"; choice: DailyRouteChoice; slotIndex?: number },
    string
  >({
    disabled: isDeparting,
    onDragStart: (payload) => {
      setHeldChoice(payload.choice);
      setHint(payload.source === "tray" ? "拖到中間的空格裡。" : "拖到下方可以拿掉拼圖。");
    },
    onDrop: (payload, target) => {
      if (target?.startsWith("daily-route-slot-")) {
        const slotIndex = Number(target.slice("daily-route-slot-".length));
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= slotCount) return;
        setPlacedChoices((current) => {
          if (
            payload.source === "tray" &&
            current.some((choice) => choice?.id === payload.choice.id)
          ) {
            return current;
          }
          const next = [...current];
          if (payload.source === "slot" && typeof payload.slotIndex === "number") {
            next[payload.slotIndex] = null;
          }
          next[slotIndex] = payload.choice;
          return next;
        });
        setHeldChoice(null);
        return;
      }
      if (target === "daily-route-remove" && payload.source === "slot" && typeof payload.slotIndex === "number") {
        setPlacedChoices((current) => current.map((choice, index) => index === payload.slotIndex ? null : choice));
        setHeldChoice(null);
      }
    },
  });

  const validation = useMemo(() => {
    if (placedChoices.some((choice) => !choice)) return { solved: false, hint: "先把路線空格排滿。" };
    const filled = placedChoices as DailyRouteChoice[];
    if (filled[0].topEdge !== stage.endEdge) return { solved: false, hint: "最上方拼圖和終點寬度不同。" };
    for (let index = 0; index < filled.length - 1; index += 1) {
      if (filled[index].bottomEdge !== filled[index + 1].topEdge) {
        return { solved: false, hint: "中間兩塊拼圖的寬窄沒有對齊。" };
      }
    }
    if (filled[filled.length - 1].bottomEdge !== stage.startEdge) {
      return { solved: false, hint: "最下方拼圖和起點寬度不同。" };
    }
    if (!filled.some((choice) => choice.locationId)) {
      return { solved: false, hint: "至少經過一個你帶上的地點。" };
    }
    return { solved: true, hint: "路線接好了，可以出發。" };
  }, [placedChoices, stage.endEdge, stage.startEdge]);

  useEffect(() => {
    if (validation.solved && !isDeparting) {
      setHint("路線接好了，可以出發。 ");
    }
  }, [isDeparting, validation.solved]);

  const placeHeldAt = (slotIndex: number) => {
    if (isDeparting) return;
    if (heldChoice) {
      setPlacedChoices((current) => current.map((choice, index) => index === slotIndex ? heldChoice : choice));
      setHeldChoice(null);
      return;
    }
    if (placedChoices[slotIndex]) {
      setPlacedChoices((current) => current.map((choice, index) => index === slotIndex ? null : choice));
    } else {
      setHint("先從下方選一塊拼圖。 ");
    }
  };

  const depart = () => {
    if (!validation.solved || isDeparting) {
      setHint(validation.hint);
      return;
    }
    setHint("路線正在合起來……");
    setIsDeparting(true);
    timerRef.current = setTimeout(() => {
      const visited = placedChoices.flatMap((choice) => choice?.locationId ? [choice.locationId] : []);
      completeDailyAdventureRun(visited);
      router.push(withTrialProfileSearch(ROUTES.gameDailyResult));
    }, 850);
  };

  return (
    <DailyAdventurePhone>
      <StoryRouteDragPreviewLayer dragState={drag.dragState} renderPreview={(payload) => <DailyRouteTile choice={payload.choice} />} />
      <PlayHeader stage={stage} onBack={() => router.push(withTrialProfileSearch(ROUTES.gameDailyStages))} />
      <Flex flex="1" minH="0" position="relative" direction="column" alignItems="center" justifyContent="center" bgColor="#FFF1B9" backgroundImage="url('/images/road_pattern_ bg.jpg')" backgroundSize="cover" py="12px" data-story-route-drop-target="daily-route-remove">
        <Flex mb="8px" h="28px" px="11px" borderRadius="999px" bgColor="rgba(255,255,255,0.85)" alignItems="center">
          <Text color="#8B684E" fontSize="11px" fontWeight="900">窄路與寬路要完整接合</Text>
        </Flex>
        <Grid
          templateRows={`repeat(${slotCount + 2}, 102px)`}
          gap={isDeparting || validation.solved ? "0px" : "7px"}
          w={isDeparting || validation.solved ? "102px" : "132px"}
          p={isDeparting || validation.solved ? "0" : "8px 15px"}
          borderRadius="18px"
          bgColor={isDeparting || validation.solved ? "transparent" : "rgba(255,255,255,0.58)"}
          transition="all 360ms ease"
        >
          <StoryRoutePuzzleBoardTile size="102px" isConnected={isDeparting || validation.solved}>
            <img src={edgeImage("end", stage.endEdge)} alt="終點" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </StoryRoutePuzzleBoardTile>
          {placedChoices.map((choice, index) => (
            <StoryRoutePuzzleBoardTile
              key={index}
              size="102px"
              isEmpty={!choice}
              isActive={Boolean(choice || heldChoice)}
              isConnected={isDeparting || validation.solved}
              dropTarget={`daily-route-slot-${index}`}
              ariaLabel={`路線第 ${index + 1} 格${choice ? `，已放置${choice.label}` : "，空格"}`}
              cursor={isDeparting ? "default" : "pointer"}
              onClick={() => placeHeldAt(index)}
            >
              {choice ? (
                <Flex w="100%" h="100%" touchAction="none" userSelect="none" onPointerDown={(event) => drag.startDrag(event, { source: "slot", choice, slotIndex: index }, { size: 90 })}>
                  <DailyRouteTile choice={choice} />
                </Flex>
              ) : null}
            </StoryRoutePuzzleBoardTile>
          ))}
          <StoryRoutePuzzleBoardTile size="102px" isConnected={isDeparting || validation.solved}>
            <img src={edgeImage("start", stage.startEdge)} alt="起點" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </StoryRoutePuzzleBoardTile>
        </Grid>
      </Flex>

      <Flex h="36px" flexShrink={0} px="12px" bgColor="#E7CFB1" alignItems="center" justifyContent="center">
        <Text color="#795B45" fontSize="11px" fontWeight="900" textAlign="center">{hint}</Text>
      </Flex>
      <Flex h="174px" flexShrink={0} bgColor="#FFF9EF" direction="column" data-story-route-drop-target="daily-route-remove">
        <Flex h="30px" px="13px" alignItems="center" justifyContent="space-between">
          <Text color="#80614B" fontSize="11px" fontWeight="900">
            {isLevelOne ? "地點拼圖" : "地點與道路拼圖"}
          </Text>
          <Text color="#A38772" fontSize="9px">點一下或拖曳</Text>
        </Flex>
        <Flex flex="1" minH="0" px="10px" pb="9px" gap="8px" overflowX="auto" alignItems="center" css={{ scrollbarWidth: "thin" }}>
          {choices.map((choice) => {
            const selected = heldChoice?.id === choice.id;
            const used = placedChoices.some((placed) => placed?.id === choice.id);
            const disabled = used || isDeparting;
            return (
              <Flex
                as="button"
                key={choice.id}
                minW="78px"
                h="98px"
                p="4px"
                borderRadius="11px"
                bgColor={selected ? "#E9C79E" : "#F0E4D4"}
                border={selected ? "2px solid #A96F48" : "2px solid transparent"}
                direction="column"
                gap="2px"
                cursor={disabled ? "default" : "grab"}
                opacity={used ? 0.38 : 1}
                touchAction="none"
                aria-disabled={disabled}
                aria-label={`${choice.label}，上方${choice.topEdge === "wide" ? "寬" : "窄"}、下方${choice.bottomEdge === "wide" ? "寬" : "窄"}`}
                onClick={() => {
                  if (disabled) return;
                  setHeldChoice(choice);
                }}
                onPointerDown={disabled ? undefined : (event) => drag.startDrag(event, { source: "tray", choice }, { size: 82 })}
              >
                <Flex w="100%" flex="1" minH="0">
                  <DailyRouteTile choice={choice} compact />
                </Flex>
                <Text color="#725542" fontSize="9px" fontWeight="900" lineHeight="1.1">
                  {choice.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      <Flex h="66px" flexShrink={0} bgColor="#8F684E" px="15px" alignItems="center" justifyContent="flex-end">
        <Flex as="button" w="128px" h="43px" borderRadius="999px" bgColor="white" color="#805C45" alignItems="center" justifyContent="center" cursor={validation.solved ? "pointer" : "not-allowed"} opacity={validation.solved ? 1 : 0.52} aria-disabled={!validation.solved} onClick={depart}>
          <Text color="inherit" fontSize="17px" fontWeight="900">出發！</Text>
        </Flex>
      </Flex>
    </DailyAdventurePhone>
  );
}

export function DailyAdventurePlayView() {
  const router = useRouter();
  const { state } = useDailyAdventureData();
  const run = state.activeRun;
  const stage = run ? DAILY_ADVENTURE_STAGES.find((candidate) => candidate.id === run.stageId) : null;

  if (!run || !stage) {
    return (
      <DailyAdventurePhone>
        <Flex flex="1" direction="column" alignItems="center" justifyContent="center" px="28px">
          <Text color="#604A3A" fontSize="19px" fontWeight="900">沒有進行中的冒險</Text>
          <Text mt="5px" color="#957A66" fontSize="12px" textAlign="center">請先選好夥伴、地點拼圖與關卡。</Text>
          <Flex as="button" mt="16px" h="42px" px="18px" borderRadius="999px" bgColor="#9B704F" color="white" alignItems="center" cursor="pointer" onClick={() => router.push(withTrialProfileSearch(ROUTES.gameDailyPrepare))}><Text color="white" fontSize="13px" fontWeight="900">前往出發準備</Text></Flex>
        </Flex>
      </DailyAdventurePhone>
    );
  }

  if (stage.mode === "infinite-corner") {
    const location = DAILY_ADVENTURE_LOCATIONS[run.locationIds[0] ?? "metro-station"];
    const destinationTile = run.routeTileIds
      .map((id) => DAILY_ADVENTURE_ROUTE_TILES[id])
      .find((tile) => tile?.locationId === location.id);
    return (
      <StoryInfiniteCornerRouteView
        headerTitle={`第 ${stage.id} 關・${stage.title}`}
        onBack={() => router.push(withTrialProfileSearch(ROUTES.gameDailyStages))}
        destinationImagePath={destinationTile?.imagePath ?? location.tileImagePath}
        destinationAlt={`${location.name}拼圖`}
        destinationName={location.name}
        showTutorial={stage.id === 5}
        recordMainProgress={false}
        departureStartPoint={{
          key: "daily-home",
          label: "家",
          iconPath: "/images/icon/house.png",
        }}
        departureMiddlePoint={{
          key: `daily-${location.id}`,
          label: location.name,
          iconPath: location.iconPath,
          isTarget: true,
        }}
        departureEndPoint={{
          key: "daily-home-return",
          label: "回家",
          iconPath: "/images/icon/house.png",
        }}
        onDepartComplete={() => {
          completeDailyAdventureRun([location.id]);
          router.push(withTrialProfileSearch(ROUTES.gameDailyResult));
        }}
      />
    );
  }

  if (stage.id === 2) {
    const locationChoices = DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS.flatMap((id) => {
      if (!state.collectedRouteTileIds.includes(id)) return [];
      const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
      if (!tile) return [];
      const location = DAILY_ADVENTURE_LOCATIONS[tile.locationId];
      return [{
        id: tile.id,
        label: location.name,
        imagePath: tile.imagePath,
        locationId: location.id,
        iconPath: location.iconPath,
        topEdge: tile.topEdge,
        bottomEdge: tile.bottomEdge,
      }];
    });
    return (
      <StoryDailyLevelOneRouteView
        levelLabel="level 2"
        locationChoices={locationChoices}
        onBack={() => router.push(withTrialProfileSearch(ROUTES.gameDailyStages))}
        onDepartComplete={(visitedLocationIds) => {
          completeDailyAdventureRun(visitedLocationIds as DailyAdventureLocationId[]);
          router.push(withTrialProfileSearch(ROUTES.gameDailyResult));
        }}
      />
    );
  }

  return <RouteWidthStage stage={stage} run={run} />;
}

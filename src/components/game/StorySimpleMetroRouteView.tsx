"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { loadPlayerProgress, recordArrangeRouteDeparture } from "@/lib/game/playerProgress";
import type { GameEventId } from "@/lib/game/events";
import {
  getFrogDiaryClueRouteHint,
  getFrogDiaryClueRouteTileId,
  getFrogDiaryClueStageByAttempt,
  type FrogDiaryClueRouteTileId,
} from "@/lib/game/frogDiaryClueFlow";

export type StoryRouteMode = "simple-metro" | "frog-clue";

type StorySimpleRouteStage = "intro" | "choice" | "ready" | "departing";
type RouteChoice = {
  id: string;
  label: string;
  imagePath: string;
  alt: string;
  mapIconPath: string;
  fallbackEventId: GameEventId;
};

const SCENE_TRANSITION_STORAGE_KEY = "moment:scene-transition";
const START_HOME_WIDE_IMAGE_PATH = "/images/route/start_end_new/start_home_wide.jpg";
const END_COMPANY_WIDE_IMAGE_PATH = "/images/route/start_end_new/end_company_wide.jpg";
const START_HOME_NARROW_IMAGE_PATH = "/images/route/start_end_new/start_home_narrow.jpg";
const END_COMPANY_NARROW_IMAGE_PATH = "/images/route/start_end_new/end_company_narror.jpg";
const METRO_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_捷運.png";
const BUS_STRAIGHT_IMAGE_PATH = "/images/route/route_new/straight_公車.png";
const SIMPLE_METRO_ROUTE_CHOICE: RouteChoice = {
  id: "metro-station",
  label: "捷運",
  imagePath: METRO_STRAIGHT_IMAGE_PATH,
  alt: "捷運拼圖",
  mapIconPath: "/images/icon/mrt.png",
  fallbackEventId: "metro-commute-laugh",
};
const SIMPLE_BUS_ROUTE_CHOICE: RouteChoice = {
  id: "bus-stop",
  label: "公車",
  imagePath: BUS_STRAIGHT_IMAGE_PATH,
  alt: "公車拼圖",
  mapIconPath: "/images/icon/road.png",
  fallbackEventId: "breakfast-bus-stop-unlock",
};
const SIMPLE_ROUTE_CHOICES: RouteChoice[] = [
  SIMPLE_METRO_ROUTE_CHOICE,
  SIMPLE_BUS_ROUTE_CHOICE,
];
const FROG_ROUTE_CHOICES: RouteChoice[] = [
  {
    id: "restaurant",
    label: "餐廳",
    imagePath: "/images/route/route_new/straight_餐廳.png",
    alt: "餐廳拼圖",
    mapIconPath: "/images/icon/mart.png",
    fallbackEventId: "restaurant-quick-meal",
  },
  {
    id: "shop",
    label: "商店",
    imagePath: "/images/route/route_new/straight_超商.png",
    alt: "商店拼圖",
    mapIconPath: "/images/icon/mart.png",
    fallbackEventId: "convenience-store-hub",
  },
  {
    id: "street",
    label: "街道",
    imagePath: "/images/route/route_new/straight_街道.png",
    alt: "街道拼圖",
    mapIconPath: "/images/icon/road.png",
    fallbackEventId: "street-comfy-breeze",
  },
];

function getFrogRouteEventId(choice: RouteChoice, photoAttemptCount: number): GameEventId {
  const targetStage = getFrogDiaryClueStageByAttempt(photoAttemptCount);
  return choice.id === targetStage.routeTileId ? targetStage.eventId : choice.fallbackEventId;
}

const stageEnter = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
`;

const tilePop = keyframes`
  0% { opacity: 0; transform: scale(0.86); }
  72% { opacity: 1; transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
`;

const cursorBlink = keyframes`
  0%, 42% { opacity: 1; }
  43%, 100% { opacity: 0; }
`;

const departureLogoFloatUp = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-0.4deg); }
  18% { transform: translateY(-4px) rotate(0.2deg); }
  46% { transform: translateY(-7px) rotate(0.6deg); }
  72% { transform: translateY(-2px) rotate(-0.2deg); }
`;

const departureLogoFloatDown = keyframes`
  0%, 100% { transform: translateY(-5px) rotate(0.5deg); }
  22% { transform: translateY(-1px) rotate(-0.2deg); }
  54% { transform: translateY(3px) rotate(-0.7deg); }
  78% { transform: translateY(-3px) rotate(0.2deg); }
`;

const departureMrtPan = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-460px, 0, 0); }
`;

const departureMaiIconTilt = keyframes`
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(10deg); }
`;

const simpleRouteTutorialEnter = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const simpleRouteTutorialCardIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const simpleRouteTutorialDragTile = keyframes`
  0%, 12% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
  48% { opacity: 1; transform: translate3d(96px, -84px, 0) scale(1.02); }
  66% { opacity: 1; transform: translate3d(120px, -118px, 0) scale(0.96); }
  76%, 100% { opacity: 0; transform: translate3d(120px, -118px, 0) scale(0.96); }
`;

const simpleRouteTutorialSourceTile = keyframes`
  0%, 12% { opacity: 1; transform: scale(1); }
  18%, 72% { opacity: 0.34; transform: scale(0.96); }
  86%, 100% { opacity: 1; transform: scale(1); }
`;

const simpleRouteTutorialPlacedTile = keyframes`
  0%, 58% { opacity: 0; transform: scale(0.9); }
  68%, 88% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.96); }
`;

const simpleRouteTutorialSlotPulse = keyframes`
  0%, 100% { border-color: rgba(191, 166, 139, 0.68); box-shadow: none; }
  52%, 72% { border-color: rgba(181, 142, 106, 0.98); box-shadow: 0 0 0 5px rgba(255, 221, 157, 0.32); }
`;

const DEPARTURE_TRANSITION_DURATION_MS = 2300;

function setPendingSceneTransition(toSceneId: string, durationMs = 420) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    SCENE_TRANSITION_STORAGE_KEY,
    JSON.stringify({
      toSceneId,
      preset: "fade-black",
      durationMs,
      createdAt: Date.now(),
    }),
  );
}

function RouteTile({
  imagePath,
  alt,
  size = 122,
  empty = false,
}: {
  imagePath?: string;
  alt: string;
  size?: number;
  empty?: boolean;
}) {
  return (
    <Flex
      w={`${size}px`}
      h={`${size}px`}
      bgColor={empty ? "rgba(255, 250, 241, 0.4)" : "#C2DB99"}
      border={empty ? "2px dashed #FFFFFF" : "2px solid #FFFFFF"}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {imagePath ? (
        <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" />
      ) : null}
    </Flex>
  );
}

function Caption({ children, cursor = false }: { children: string; cursor?: boolean }) {
  return (
    <Text
      position="absolute"
      left="20px"
      right="20px"
      bottom="86px"
      color="#9B765C"
      fontSize="17px"
      fontWeight="800"
      lineHeight="1.35"
      textAlign="center"
    >
      {children}
      {cursor ? (
        <Box
          as="span"
          display="inline-block"
          ml="2px"
          w="2px"
          h="20px"
          verticalAlign="-4px"
          bgColor="#9B765C"
          animation={`${cursorBlink} 1s steps(1) infinite`}
        />
      ) : null}
    </Text>
  );
}

function PhonePanel({
  children,
  caption,
  cursor,
  onClick,
  labelledBy,
}: {
  children: ReactNode;
  caption?: string;
  cursor?: boolean;
  onClick?: () => void;
  labelledBy?: string;
}) {
  return (
    <Flex
      as={onClick ? "button" : "div"}
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#ECE1D0"
      border="0"
      p="0"
      textAlign="initial"
      cursor={onClick ? "pointer" : "default"}
      overflow="hidden"
      onClick={onClick}
      aria-labelledby={labelledBy}
    >
      <Box position="absolute" top="0" left="0" right="0" h="20px" bgColor="#917157" />
      <Box position="absolute" bottom="0" left="0" right="0" h="20px" bgColor="#917157" />
      <Flex position="absolute" inset="20px 0" alignItems="center" justifyContent="center">
        <Flex
          key={caption ?? labelledBy}
          alignItems="center"
          justifyContent="center"
          animation={`${stageEnter} 260ms ease-out both`}
        >
          {children}
        </Flex>
      </Flex>
      {caption ? <Caption cursor={cursor}>{caption}</Caption> : null}
    </Flex>
  );
}

function TransportCard({
  type,
  onClick,
}: {
  type: "metro" | "bus";
  onClick: () => void;
}) {
  const isMetro = type === "metro";
  return (
    <Flex
      as="button"
      w="134px"
      h="190px"
      direction="column"
      alignItems="center"
      justifyContent="flex-start"
      gap="10px"
      pt="14px"
      borderRadius="3px"
      bgColor="#D4BB9A"
      border="2px solid #967254"
      p="0"
      cursor="pointer"
      transition="transform 140ms ease, box-shadow 140ms ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 14px rgba(103,77,54,0.16)" }}
      onClick={onClick}
    >
      <RouteTile imagePath={METRO_STRAIGHT_IMAGE_PATH} alt={isMetro ? "捷運拼圖" : "公車拼圖"} size={104} />
      <Text color="#FFFFFF" fontSize="20px" fontWeight="900" lineHeight="1">
        {isMetro ? "捷運" : "公車"}
      </Text>
    </Flex>
  );
}

function PuzzleChoiceCard({
  choice,
  onClick,
}: {
  choice: RouteChoice;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      w="104px"
      h="158px"
      direction="column"
      alignItems="center"
      justifyContent="flex-start"
      gap="10px"
      pt="12px"
      borderRadius="3px"
      bgColor="#D4BB9A"
      border="2px solid #967254"
      p="0"
      cursor="pointer"
      transition="transform 140ms ease, box-shadow 140ms ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 14px rgba(103,77,54,0.16)" }}
      onClick={onClick}
    >
      <RouteTile imagePath={choice.imagePath} alt={choice.alt} size={82} />
      <Text color="#FFFFFF" fontSize="18px" fontWeight="900" lineHeight="1">
        {choice.label}
      </Text>
    </Flex>
  );
}

function FrogArrangeBoardTile({
  children,
  isEmpty = false,
  isActive = false,
  cursor,
  onClick,
  onDragOver,
  onDrop,
}: {
  children?: ReactNode;
  isEmpty?: boolean;
  isActive?: boolean;
  cursor?: string;
  onClick?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as={onClick ? "button" : "div"}
      w="116px"
      h="116px"
      p="0"
      borderRadius="10px"
      bgColor={isEmpty ? "rgba(255, 251, 241, 0.96)" : "rgba(244,236,223,0.95)"}
      border={isEmpty ? "2px dashed rgba(157, 120, 89, 0.42)" : "0"}
      outline={isActive ? "3px solid rgba(83, 197, 213, 0.52)" : "0"}
      outlineOffset="-3px"
      boxShadow={
        isEmpty
          ? "inset 0 0 0 2px rgba(255,255,255,0.58), 0 2px 5px rgba(107,78,51,0.08)"
          : "none"
      }
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      cursor={cursor}
      transition="outline-color 160ms ease, background-color 160ms ease"
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </Flex>
  );
}

function FrogArrangePlacedTile({
  imagePath,
  alt,
}: {
  imagePath: string;
  alt: string;
}) {
  return (
    <Flex
      w="92%"
      h="92%"
      borderRadius="8px"
      overflow="hidden"
      border="2px solid #8E7A62"
      bgColor="#D5E8B7"
      alignItems="center"
      justifyContent="center"
    >
      <Image src={imagePath} alt={alt} w="100%" h="100%" objectFit="cover" />
    </Flex>
  );
}

function FrogArrangeTrayTile({
  choice,
  isSelected,
  onClick,
  onDragStart,
}: {
  choice: RouteChoice;
  isSelected: boolean;
  onClick: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <Flex
      as="button"
      direction="column"
      alignItems="center"
      gap="7px"
      minW="92px"
      cursor="pointer"
      opacity={isSelected ? 1 : 0.92}
      transform={isSelected ? "translateY(-3px)" : "translateY(0)"}
      transition="transform 140ms ease, opacity 140ms ease"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      aria-pressed={isSelected}
    >
      <Flex
        w="86px"
        h="86px"
        borderRadius="5px"
        overflow="hidden"
        bgColor="#F3E8D0"
        border={isSelected ? "3px solid #53C5D5" : "1px solid rgba(255, 249, 239, 0.78)"}
        outline="1px solid rgba(145, 103, 66, 0.14)"
        boxShadow={
          isSelected
            ? "0 10px 18px rgba(83,197,213,0.18), 0 8px 14px rgba(92,63,38,0.14)"
            : "0 7px 12px rgba(92,63,38,0.13)"
        }
        alignItems="center"
        justifyContent="center"
      >
        <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" />
      </Flex>
      <Text color={isSelected ? "#79583F" : "#9B7354"} fontSize="14px" fontWeight="900" lineHeight="1">
        {choice.label}
      </Text>
    </Flex>
  );
}

function StoryFrogClueArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [heldChoice, setHeldChoice] = useState<RouteChoice | null>(null);
  const [placedChoice, setPlacedChoice] = useState<RouteChoice | null>(null);
  const [hint, setHint] = useState("");
  const [isDeparting, setIsDeparting] = useState(false);
  const [departureProgress, setDepartureProgress] = useState(0);
  const [frogPhotoAttemptCount, setFrogPhotoAttemptCount] = useState(0);
  const departureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departureFrameRef = useRef<number | null>(null);
  const frogRouteTargetTileId = getFrogDiaryClueRouteTileId(frogPhotoAttemptCount);

  useEffect(
    () => () => {
      if (departureTimerRef.current) clearTimeout(departureTimerRef.current);
      if (departureFrameRef.current !== null) cancelAnimationFrame(departureFrameRef.current);
    },
    [],
  );

  useEffect(() => {
    const progress = loadPlayerProgress();
    setFrogPhotoAttemptCount(progress.streetForgotLunchFrogPhotoAttemptCount);
    setHint(getFrogDiaryClueRouteHint(progress.streetForgotLunchFrogPhotoAttemptCount));
  }, []);

  const startDeparture = useCallback(() => {
    if (departureTimerRef.current) return;
    if (!placedChoice) {
      setHint("先選一塊拼圖放進路線。");
      return;
    }
    recordArrangeRouteDeparture();
    onProgressSaved?.();
    setHint("");
    setDepartureProgress(0);
    setIsDeparting(true);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / DEPARTURE_TRANSITION_DURATION_MS);
      setDepartureProgress(nextProgress);
      if (nextProgress < 1) {
        departureFrameRef.current = requestAnimationFrame(tick);
      }
    };
    departureFrameRef.current = requestAnimationFrame(tick);
    departureTimerRef.current = setTimeout(() => {
      if (departureFrameRef.current !== null) {
        cancelAnimationFrame(departureFrameRef.current);
        departureFrameRef.current = null;
      }
      setDepartureProgress(1);
      const eventId = getFrogRouteEventId(placedChoice, frogPhotoAttemptCount);
      router.push(withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?eventId=${eventId}`));
    }, DEPARTURE_TRANSITION_DURATION_MS);
  }, [frogPhotoAttemptCount, onProgressSaved, placedChoice, router]);

  const placeChoice = useCallback((choice: RouteChoice) => {
    setPlacedChoice(choice);
    setHeldChoice(null);
    setHint(
      choice.id === frogRouteTargetTileId
        ? "日記線索就在這裡。"
        : "這裡不是日記線索的位置，但也可以先去看看。",
    );
  }, [frogRouteTargetTileId]);

  const readDraggedChoice = (event: DragEvent<HTMLDivElement>) => {
    const choiceId = event.dataTransfer.getData("application/moment-frog-route-choice");
    return FROG_ROUTE_CHOICES.find((choice) => choice.id === choiceId) ?? null;
  };

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
      <Flex h="50px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          安排行程
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        alignItems="center"
        justifyContent="center"
        px="12px"
        py="14px"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/road_pattern_ bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
      >
        <Grid
          templateRows="repeat(3, 1fr)"
          gap="10px"
          w="150px"
          h="398px"
          p="10px"
          bgColor="rgba(255,255,255,0.88)"
          border="3px solid #B99873"
          borderRadius="18px"
          boxShadow="0 8px 18px rgba(115,86,45,0.12)"
        >
          <FrogArrangeBoardTile>
            <FrogArrangePlacedTile imagePath={END_COMPANY_NARROW_IMAGE_PATH} alt="終點拼圖" />
          </FrogArrangeBoardTile>
          <FrogArrangeBoardTile
            isEmpty={!placedChoice}
            isActive={Boolean(heldChoice) || Boolean(placedChoice)}
            cursor={heldChoice ? "pointer" : placedChoice ? "default" : "default"}
            onClick={() => {
              if (!heldChoice) {
                if (!placedChoice) setHint("先在下方選一塊拼圖。");
                return;
              }
              placeChoice(heldChoice);
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const droppedChoice = readDraggedChoice(event);
              if (!droppedChoice) return;
              placeChoice(droppedChoice);
            }}
          >
            {placedChoice ? (
              <FrogArrangePlacedTile
                imagePath={placedChoice.imagePath}
                alt={placedChoice.alt}
              />
            ) : null}
          </FrogArrangeBoardTile>
          <FrogArrangeBoardTile>
            <FrogArrangePlacedTile imagePath={START_HOME_NARROW_IMAGE_PATH} alt="起點拼圖" />
          </FrogArrangeBoardTile>
        </Grid>
      </Flex>

      <Flex
        minH="166px"
        maxH="166px"
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(185,152,115,0.12)"
      >
        <Flex
          h="42px"
          px="14px"
          alignItems="center"
          justifyContent="space-between"
          bgColor="#F8E7CC"
          borderBottom="1px solid rgba(185,152,115,0.16)"
        >
          <Text color="#9B765C" fontSize="13px" fontWeight="900" lineHeight="1">
            選擇拼圖
          </Text>
          <Text color="#B1845E" fontSize="12px" fontWeight="800" lineHeight="1">
            {hint}
          </Text>
        </Flex>
        <Flex
          flex="1"
          minH="0"
          gap="12px"
          overflowX="auto"
          overflowY="hidden"
          px="14px"
          pt="12px"
          pb="14px"
          alignItems="flex-start"
          justifyContent="center"
          css={{
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {FROG_ROUTE_CHOICES.map((choice) => (
            <FrogArrangeTrayTile
              key={choice.id}
              choice={choice}
              isSelected={heldChoice?.id === choice.id || placedChoice?.id === choice.id}
              onClick={() => {
                if (placedChoice?.id === choice.id) {
                  setHint("這塊已經放上去了。");
                  return;
                }
                setHeldChoice(choice);
                setHint("點中間空格，或拖曳拼圖放上去。");
              }}
              onDragStart={(event) => {
                setHeldChoice(choice);
                setHint("");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/moment-frog-route-choice", choice.id);
              }}
            />
          ))}
        </Flex>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent="flex-end"
        px="18px"
        py="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
      >
        <Flex
          as="button"
          w="100%"
          maxW="126px"
          h="42px"
          borderRadius="999px"
          bgColor="white"
          color="#986E53"
          fontSize="18px"
          fontWeight="800"
          alignItems="center"
          justifyContent="center"
          cursor={placedChoice ? "pointer" : "not-allowed"}
          opacity={placedChoice ? 1 : 0.5}
          pointerEvents={isDeparting ? "none" : "auto"}
          flexShrink={0}
          onClick={startDeparture}
        >
          出發！
        </Flex>
      </Flex>

      {isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureProgress}
          middlePoint={
            placedChoice
              ? {
                  key: placedChoice.id,
                  label: placedChoice.label,
                  iconPath: placedChoice.mapIconPath,
                }
              : undefined
          }
        />
      ) : null}
    </Flex>
  );
}

function StoryMetroArrangeRouteView({
  onProgressSaved,
}: {
  onProgressSaved?: () => void;
}) {
  const router = useRouter();
  const [heldChoice, setHeldChoice] = useState<RouteChoice | null>(null);
  const [placedChoice, setPlacedChoice] = useState<RouteChoice | null>(null);
  const [hint, setHint] = useState("將下方的拼圖拉到空格裡，安排今天的出行路線。");
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [unlockedDiaryEntryIds, setUnlockedDiaryEntryIds] = useState<string[]>([]);
  const [isDeparting, setIsDeparting] = useState(false);
  const [departureProgress, setDepartureProgress] = useState(0);
  const departureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const departureFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setUnlockedDiaryEntryIds(loadPlayerProgress().unlockedDiaryEntryIds);
  }, []);

  useEffect(
    () => () => {
      if (departureTimerRef.current) clearTimeout(departureTimerRef.current);
      if (departureFrameRef.current !== null) cancelAnimationFrame(departureFrameRef.current);
    },
    [],
  );

  const placeChoice = useCallback((choice: RouteChoice) => {
    setPlacedChoice(choice);
    setHeldChoice(null);
    setHint(
      choice.id === SIMPLE_METRO_ROUTE_CHOICE.id
        ? "已安排捷運路線，今天就照日記線索出發。"
        : "日記裡留下的是捷運線索。",
    );
  }, []);

  const readDraggedChoice = (event: DragEvent<HTMLDivElement>) => {
    const choiceId = event.dataTransfer.getData("application/moment-simple-route-choice");
    return SIMPLE_ROUTE_CHOICES.find((choice) => choice.id === choiceId) ?? null;
  };

  const startDeparture = useCallback(() => {
    if (departureTimerRef.current) return;
    if (!placedChoice) {
      setHint("把下方的拼圖拉到中間空格。");
      return;
    }
    if (placedChoice.id !== SIMPLE_METRO_ROUTE_CHOICE.id) {
      setHint("日記裡留下的是捷運線索。");
      return;
    }

    recordArrangeRouteDeparture();
    onProgressSaved?.();
    setHint("");
    setDepartureProgress(0);
    setIsDeparting(true);

    const startedAt = performance.now();
    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / DEPARTURE_TRANSITION_DURATION_MS);
      setDepartureProgress(nextProgress);
      if (nextProgress < 1) {
        departureFrameRef.current = requestAnimationFrame(tick);
      }
    };
    departureFrameRef.current = requestAnimationFrame(tick);
    departureTimerRef.current = setTimeout(() => {
      if (departureFrameRef.current !== null) {
        cancelAnimationFrame(departureFrameRef.current);
        departureFrameRef.current = null;
      }
      setDepartureProgress(1);
      setPendingSceneTransition("scene-69");
      router.push(withTrialProfileSearch(ROUTES.gameScene("scene-69")));
    }, DEPARTURE_TRANSITION_DURATION_MS);
  }, [onProgressSaved, placedChoice, router]);

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
      <Flex h="50px" flexShrink={0} bgColor="#9B765C" alignItems="center" px="18px">
        <Text color="#FFFFFF" fontSize="16px" fontWeight="900" lineHeight="1">
          安排行程
        </Text>
      </Flex>

      <Flex
        flex="1"
        minH="0"
        position="relative"
        alignItems="center"
        justifyContent="center"
        px="12px"
        py="14px"
        bgColor="#FFF4C7"
        backgroundImage="url('/images/road_pattern_ bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
      >
        <Flex
          position="absolute"
          top="14px"
          left="18px"
          right="18px"
          minH="54px"
          px="14px"
          py="10px"
          borderRadius="14px"
          bgColor="rgba(255, 253, 247, 0.9)"
          border="1px solid rgba(185, 152, 115, 0.34)"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 7px 16px rgba(115,86,45,0.1)"
        >
          <Text
            color="#8E6D53"
            fontSize="14px"
            fontWeight="900"
            lineHeight="1.45"
            textAlign="center"
          >
            {hint}
          </Text>
        </Flex>

        <Grid
          templateRows="repeat(3, 1fr)"
          gap="10px"
          w="150px"
          h="398px"
          p="10px"
          bgColor="rgba(255,255,255,0.88)"
          border="3px solid #B99873"
          borderRadius="18px"
          boxShadow="0 8px 18px rgba(115,86,45,0.12)"
        >
          <FrogArrangeBoardTile>
            <FrogArrangePlacedTile imagePath={END_COMPANY_NARROW_IMAGE_PATH} alt="終點拼圖" />
          </FrogArrangeBoardTile>
          <FrogArrangeBoardTile
            isEmpty={!placedChoice}
            isActive={Boolean(heldChoice) || Boolean(placedChoice)}
            cursor={heldChoice ? "pointer" : "default"}
            onClick={() => {
              if (!heldChoice) {
                if (!placedChoice) setHint("先在下方選一塊拼圖，或直接拖曳上來。");
                return;
              }
              placeChoice(heldChoice);
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const droppedChoice = readDraggedChoice(event);
              if (!droppedChoice) return;
              placeChoice(droppedChoice);
            }}
          >
            {placedChoice ? (
              <FrogArrangePlacedTile
                imagePath={placedChoice.imagePath}
                alt={placedChoice.alt}
              />
            ) : null}
          </FrogArrangeBoardTile>
          <FrogArrangeBoardTile>
            <FrogArrangePlacedTile imagePath={START_HOME_NARROW_IMAGE_PATH} alt="起點拼圖" />
          </FrogArrangeBoardTile>
        </Grid>

        <Flex
          as="button"
          position="absolute"
          right="18px"
          bottom="24px"
          w="72px"
          h="72px"
          borderRadius="8px"
          bgColor="#FFFFFF"
          border="2px solid #FFFFFF"
          boxShadow="0 4px 10px rgba(55,48,82,0.18)"
          overflow="hidden"
          cursor="pointer"
          zIndex={2}
          onClick={() => setIsDiaryOpen(true)}
          aria-label="查看日記"
        >
          <Image
            position="absolute"
            inset="0"
            src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
            alt=""
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center"
            aria-hidden="true"
          />
          <Flex
            position="absolute"
            left="-5px"
            right="-5px"
            bottom="-2px"
            h="30px"
            bgColor="rgba(128,159,140,0.9)"
            transform="rotate(-6deg)"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#FFFFFF" fontSize="17px" fontWeight="500" lineHeight="1" transform="rotate(6deg)">
              日記
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex
        minH="166px"
        maxH="166px"
        flexShrink={0}
        bgColor="#FDF6EA"
        direction="column"
        borderTop="1px solid rgba(185,152,115,0.12)"
      >
        <Flex
          h="42px"
          px="14px"
          alignItems="center"
          justifyContent="center"
          bgColor="#F8E7CC"
          borderBottom="1px solid rgba(185,152,115,0.16)"
        >
          <Text color="#9B765C" fontSize="13px" fontWeight="900" lineHeight="1" textAlign="center">
            選擇拼圖(將拼圖拖到空格裡)
          </Text>
        </Flex>
        <Flex
          flex="1"
          minH="0"
          overflowX="auto"
          overflowY="hidden"
          px="14px"
          pt="12px"
          pb="14px"
          alignItems="flex-start"
          gap="14px"
          justifyContent="center"
          css={{
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {SIMPLE_ROUTE_CHOICES.map((choice) => (
            <FrogArrangeTrayTile
              key={choice.id}
              choice={choice}
              isSelected={heldChoice?.id === choice.id || placedChoice?.id === choice.id}
              onClick={() => {
                if (placedChoice?.id === choice.id) {
                  setHint("這塊已經放上去了。");
                  return;
                }
                setHeldChoice(choice);
                setHint("點中間空格，或拖曳拼圖放上去。");
              }}
              onDragStart={(event) => {
                setHeldChoice(choice);
                setHint("把拼圖放進中間空格。");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(
                  "application/moment-simple-route-choice",
                  choice.id,
                );
              }}
            />
          ))}
        </Flex>
      </Flex>

      <Flex
        minH="68px"
        flexShrink={0}
        bgColor="#B88E6D"
        alignItems="center"
        justifyContent="flex-end"
        px="18px"
        py="8px"
        borderTopLeftRadius="18px"
        borderTopRightRadius="18px"
      >
        <Flex
          as="button"
          w="100%"
          maxW="126px"
          h="42px"
          borderRadius="999px"
          bgColor="white"
          color="#986E53"
          fontSize="18px"
          fontWeight="800"
          alignItems="center"
          justifyContent="center"
          cursor={placedChoice ? "pointer" : "not-allowed"}
          opacity={placedChoice ? 1 : 0.5}
          pointerEvents={isDeparting ? "none" : "auto"}
          flexShrink={0}
          onClick={startDeparture}
        >
          出發！
        </Flex>
      </Flex>

      {isDeparting ? (
        <StoryRouteDepartureTransition
          progress={departureProgress}
          middlePoint={
            placedChoice
              ? {
                  key: placedChoice.id,
                  label: placedChoice.label,
                  iconPath: placedChoice.mapIconPath,
                }
              : undefined
          }
        />
      ) : null}

      {isTutorialOpen && !isDiaryOpen && !isDeparting ? (
        <SimpleRouteTutorialModal onClose={() => setIsTutorialOpen(false)} />
      ) : null}

      <DiaryOverlay
        open={isDiaryOpen}
        onClose={() => setIsDiaryOpen(false)}
        unlockedEntryIds={unlockedDiaryEntryIds}
        mode="fragmented-diary"
        onFragmentedDiaryComplete={() => setIsDiaryOpen(false)}
        showReturnButton
      />
    </Flex>
  );
}

function SimpleRouteTutorialThumb({
  choice,
  animateSource = false,
}: {
  choice: RouteChoice;
  animateSource?: boolean;
}) {
  return (
    <Flex
      w="74px"
      h="74px"
      borderRadius="6px"
      overflow="hidden"
      bgColor="#F0E6D5"
      border="2px solid rgba(255,255,255,0.9)"
      boxShadow="0 4px 8px rgba(92,63,38,0.1)"
      animation={animateSource ? `${simpleRouteTutorialSourceTile} 2600ms ease-in-out infinite` : undefined}
    >
      <Image src={choice.imagePath} alt={choice.alt} w="100%" h="100%" objectFit="cover" />
    </Flex>
  );
}

function SimpleRouteTutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={82}
      bgColor="rgba(35, 27, 19, 0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      animation={`${simpleRouteTutorialEnter} 180ms ease both`}
    >
      <Flex
        w="100%"
        maxW="346px"
        direction="column"
        gap="12px"
        animation={`${simpleRouteTutorialCardIn} 240ms ease-out both`}
      >
        <Flex
          minH="66px"
          px="20px"
          py="14px"
          borderRadius="18px"
          bgColor="#FFFDF8"
          border="1px solid #E5D2B7"
          boxShadow="0 10px 24px rgba(62,45,26,0.18)"
          alignItems="center"
          justifyContent="center"
        >
          <Text
            color="#8E6D53"
            fontSize="16px"
            fontWeight="900"
            lineHeight="1.45"
            textAlign="center"
          >
            將下方的拼圖拉到空格裡，安排今天的出行路線。
          </Text>
        </Flex>

        <Flex
          direction="column"
          bgColor="#FFFDF8"
          border="1px solid #E5D2B7"
          borderRadius="18px"
          boxShadow="0 14px 28px rgba(62,45,26,0.18)"
          p="14px"
          gap="12px"
          overflow="hidden"
        >
          <Box position="relative" h="246px" borderRadius="14px" bgColor="#FFF9EF" overflow="hidden">
            <Flex
              position="absolute"
              left="50%"
              top="22px"
              w="88px"
              h="88px"
              transform="translateX(-50%)"
              border="2px dashed rgba(191, 166, 139, 0.68)"
              borderRadius="13px"
              bgColor="rgba(255,255,255,0.58)"
              alignItems="center"
              justifyContent="center"
              animation={`${simpleRouteTutorialSlotPulse} 2600ms ease-in-out infinite`}
            >
              <Flex
                w="74px"
                h="74px"
                borderRadius="6px"
                overflow="hidden"
                animation={`${simpleRouteTutorialPlacedTile} 2600ms ease-in-out infinite`}
              >
                <Image
                  src={SIMPLE_METRO_ROUTE_CHOICE.imagePath}
                  alt=""
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  aria-hidden="true"
                />
              </Flex>
            </Flex>

            <Flex
              position="absolute"
              left="10px"
              right="10px"
              bottom="12px"
              h="94px"
              borderRadius="12px"
              bgColor="rgba(252, 246, 236, 0.96)"
              alignItems="center"
              gap="10px"
              px="10px"
            >
              <SimpleRouteTutorialThumb choice={SIMPLE_METRO_ROUTE_CHOICE} animateSource />
              <SimpleRouteTutorialThumb choice={SIMPLE_BUS_ROUTE_CHOICE} />
            </Flex>

            <Flex
              position="absolute"
              left="20px"
              bottom="24px"
              w="74px"
              h="74px"
              borderRadius="6px"
              overflow="hidden"
              bgColor="#F0E6D5"
              border="2px solid rgba(255,255,255,0.92)"
              boxShadow="0 10px 18px rgba(92,63,38,0.2)"
              animation={`${simpleRouteTutorialDragTile} 2600ms ease-in-out infinite`}
              zIndex={3}
              pointerEvents="none"
            >
              <Image
                src={SIMPLE_METRO_ROUTE_CHOICE.imagePath}
                alt=""
                w="100%"
                h="100%"
                objectFit="cover"
                aria-hidden="true"
              />
            </Flex>
          </Box>

          <Flex
            as="button"
            h="46px"
            borderRadius="999px"
            bgColor="#9B765C"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            boxShadow="0 6px 12px rgba(92,63,38,0.16)"
            onClick={onClose}
          >
            <Text color="#FFFFFF" fontSize="17px" fontWeight="900" lineHeight="1">
              開始安排
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

function ReadyRouteStack({
  animateMiddle = false,
  startImagePath = START_HOME_WIDE_IMAGE_PATH,
  middleImagePath = METRO_STRAIGHT_IMAGE_PATH,
  middleAlt = "捷運拼圖",
  endImagePath = END_COMPANY_WIDE_IMAGE_PATH,
}: {
  animateMiddle?: boolean;
  startImagePath?: string;
  middleImagePath?: string;
  middleAlt?: string;
  endImagePath?: string;
}) {
  return (
    <Flex direction="column" alignItems="center" justifyContent="center">
      <RouteTile imagePath={endImagePath} alt="公司" size={118} />
      <Box animation={animateMiddle ? `${tilePop} 420ms ease-out both` : undefined}>
        <RouteTile imagePath={middleImagePath} alt={middleAlt} size={118} />
      </Box>
      <RouteTile imagePath={startImagePath} alt="家" size={118} />
    </Flex>
  );
}

function IntroRouteAnimation({
  step,
  startImagePath = START_HOME_WIDE_IMAGE_PATH,
  endImagePath = END_COMPANY_WIDE_IMAGE_PATH,
}: {
  step: 0 | 1 | 2;
  startImagePath?: string;
  endImagePath?: string;
}) {
  const tileSize = 122;
  const companyTop = step === 0 ? 0 : step === 1 ? 61 : 0;
  const emptyTop = 122;
  const homeTop = step === 0 ? 122 : step === 1 ? 183 : 244;

  return (
    <Box position="relative" w={`${tileSize}px`} h="366px">
      <Box
        position="absolute"
        left="0"
        top={`${companyTop}px`}
        opacity={step >= 1 ? 1 : 0}
        pointerEvents="none"
        transition="top 520ms cubic-bezier(0.33, 1, 0.68, 1), opacity 220ms ease"
        animation={step === 1 ? `${tilePop} 360ms ease-out both` : undefined}
      >
        <RouteTile imagePath={endImagePath} alt="公司" size={tileSize} />
      </Box>
      <Box
        position="absolute"
        left="0"
        top={`${emptyTop}px`}
        opacity={step >= 2 ? 1 : 0}
        transform={step >= 2 ? "scale(1)" : "scale(0.9)"}
        pointerEvents="none"
        transition="opacity 260ms ease, transform 360ms ease"
      >
        <RouteTile alt="空白路線格" size={tileSize} empty />
      </Box>
      <Box
        position="absolute"
        left="0"
        top={`${homeTop}px`}
        transition="top 560ms cubic-bezier(0.33, 1, 0.68, 1)"
      >
        <RouteTile imagePath={startImagePath} alt="家" size={tileSize} />
      </Box>
    </Box>
  );
}

function StoryRouteDepartureTransition({
  progress,
  middlePoint = {
    key: "metro-station",
    label: "捷運",
    iconPath: "/images/icon/mrt.png",
  },
}: {
  progress: number;
  middlePoint?: {
    key: string;
    label: string;
    iconPath: string;
  };
}) {
  const mapPoints = [
    {
      key: "home",
      label: "家",
      iconPath: "/images/icon/house.png",
      positionPercent: 9,
      isMiddle: false,
    },
    {
      key: middlePoint.key,
      label: middlePoint.label,
      iconPath: middlePoint.iconPath,
      positionPercent: 50,
      isMiddle: true,
    },
    {
      key: "company",
      label: "公司",
      iconPath: "/images/icon/company.png",
      positionPercent: 91,
      isMiddle: false,
    },
  ];
  const maiMapLeftPercent = 9 + (50 - 9) * progress;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={90}
      pointerEvents="none"
      overflow="hidden"
      bg="#F7F0E6"
    >
      <Box
        position="absolute"
        left="-452px"
        top="-25px"
        w="2568px"
        h="723px"
        animation={`${departureMrtPan} ${DEPARTURE_TRANSITION_DURATION_MS}ms linear both`}
      >
        <img
          src="/images/loading/wake_up.jpg"
          alt=""
          aria-hidden="true"
          style={{ width: "100%", height: "100%", objectFit: "fill", display: "block" }}
        />
      </Box>

      <Flex
        position="absolute"
        right="18px"
        top="33px"
        w="126px"
        h="39px"
        align="flex-start"
        overflow="visible"
        filter="drop-shadow(0 3px 0 rgba(255,255,255,0.85))"
        aria-label="走走小日"
      >
        {[0, 1, 2, 3].map((index) => (
          <Box
            key={index}
            position="relative"
            w={index === 3 ? "28px" : "33px"}
            h="39px"
            overflow="hidden"
            animation={`${
              index % 2 === 0 ? departureLogoFloatUp : departureLogoFloatDown
            } ${index === 1 ? 1.34 : index === 2 ? 1.18 : index === 3 ? 1.42 : 1.26}s cubic-bezier(0.45, 0, 0.25, 1) infinite`}
            style={{ animationDelay: `${index * -0.18}s` }}
          >
            <img
              src="/images/logo/logo_svg.svg"
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${index * -33}px`,
                top: 0,
                width: "132px",
                height: "40px",
                maxWidth: "none",
              }}
            />
          </Box>
        ))}
      </Flex>

      <Box position="absolute" left="50%" bottom="172px" transform="translateX(-50%)">
        <img
          src="/images/mai/walk.gif"
          alt="小麥走路"
          style={{
            height: "276px",
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 9px rgba(72,54,38,0.16))",
          }}
        />
      </Box>

      <Box
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        h="156px"
        bg="#F9F4EB"
        borderTop="1px solid #D9B996"
        overflow="hidden"
      >
        {mapPoints.map((point) => (
          <Box
            key={point.key}
            position="absolute"
            left={`${point.positionPercent}%`}
            top={point.isMiddle ? "23px" : "29px"}
            w={point.isMiddle ? "42px" : "45px"}
            h={point.isMiddle ? "42px" : "45px"}
            transform="translateX(-50%)"
            zIndex={2}
          >
            <Image src={point.iconPath} alt={point.label} w="100%" h="100%" objectFit="contain" />
          </Box>
        ))}
        <Box
          position="absolute"
          left="17px"
          right="17px"
          bottom="45px"
          h="15px"
          bg="#D2BA9D"
          border="1px solid #C3A580"
          borderRadius="999px"
          zIndex={1}
        >
          <Flex position="absolute" inset="0" px="9px" align="center" justify="space-between">
            {[0, 0.25, 0.5, 0.75, 1].map((point, index) => (
              <Box
                key={point}
                w={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                h={index === 0 || index === 2 || index === 4 ? "11px" : "5px"}
                borderRadius="999px"
                bg={progress >= point ? "#FFF0A8" : "#F8E8AF"}
                border={index === 0 || index === 2 || index === 4 ? "1px solid #B28D69" : "0"}
              />
            ))}
          </Flex>
        </Box>
        <Box
          position="absolute"
          left={`${maiMapLeftPercent}%`}
          top="76px"
          w="48px"
          h="38px"
          transform="translateX(-50%)"
          filter="drop-shadow(0 2px 0 rgba(255,255,255,0.55))"
          zIndex={3}
        >
          <Image
            src="/images/icon/icon_mai.png"
            alt="小麥目前位置"
            w="100%"
            h="100%"
            objectFit="contain"
            animation={`${departureMaiIconTilt} 0.72s ease-in-out infinite`}
            transformOrigin="50% 80%"
          />
        </Box>
      </Box>
    </Flex>
  );
}

export function StorySimpleMetroRouteView({
  mode = "simple-metro",
  onProgressSaved,
}: {
  mode?: StoryRouteMode;
  onProgressSaved?: () => void;
}) {
  if (mode === "frog-clue") {
    return <StoryFrogClueArrangeRouteView onProgressSaved={onProgressSaved} />;
  }

  return <StoryMetroArrangeRouteView onProgressSaved={onProgressSaved} />;
}

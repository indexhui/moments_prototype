"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  IoCalendarOutline,
  IoChevronForward,
  IoFlashOutline,
} from "react-icons/io5";
import { FaCoins } from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  getGameLobbyMainStoryTarget,
  type GameDailyTask,
} from "@/lib/game/lobbyFlow";
import {
  INITIAL_PLAYER_PROGRESS,
  PLAYER_PROGRESS_CHANGE_EVENT,
  loadPlayerProgress,
  markDailyAdventureMainStoryReturnGuideSeen,
  markGameLobbyGuideSeen,
  type PlayerProgress,
} from "@/lib/game/playerProgress";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { LobbyBeigoPlayground } from "./LobbyBeigoPlayground";
import {
  LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS,
  LobbyMainStoryCloudTransition,
} from "./LobbyMainStoryCloudTransition";

const PHONE_WIDTH = { base: "100vw", sm: "393px" };
const PHONE_HEIGHT = { base: "100dvh", sm: "852px" };

const LOBBY_ASSETS = {
  background: "/images/lobby/main_hub_bg.png",
  mainStory: "/images/lobby/main_story_card.png",
  dailyAdventure: "/images/lobby/daily_adventure.png",
  mission: "/images/lobby/mission_card.png",
  hibimon: "/images/lobby/hibimon_card.png",
} as const;

function useLivePlayerProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);

  useEffect(() => {
    const sync = () => setProgress(loadPlayerProgress());
    sync();
    window.addEventListener(PLAYER_PROGRESS_CHANGE_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(PLAYER_PROGRESS_CHANGE_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return progress;
}

function TopPill({
  children,
  minW,
  gap = "12px",
  px = "14px",
}: {
  children: ReactNode;
  minW?: string;
  gap?: string;
  px?: string;
}) {
  return (
    <Flex
      h="50px"
      minW={minW}
      px={px}
      borderRadius="22px"
      bgColor="#FFFFFF"
      alignItems="center"
      justifyContent="center"
      gap={gap}
      color="#80695B"
      boxShadow="0 5px 12px rgba(70, 48, 33, 0.12)"
      flexShrink={0}
    >
      {children}
    </Flex>
  );
}

function CardLabel({
  children,
  justifyContent = "flex-start",
}: {
  children: ReactNode;
  justifyContent?: "flex-start" | "space-between";
}) {
  return (
    <Flex
      position="absolute"
      left="-5px"
      right="-5px"
      bottom="-5px"
      h="40px"
      px="16px"
      bgColor="rgba(255,255,255,0.86)"
      alignItems="center"
      justifyContent={justifyContent}
      color="#9D7859"
      zIndex={2}
    >
      {children}
    </Flex>
  );
}

function SmallImageCard({
  image,
  label,
  onClick,
  objectPosition = "center",
}: {
  image: string;
  label: string;
  onClick: () => void;
  objectPosition?: string;
}) {
  return (
    <Flex
      as="button"
      position="relative"
      w="110px"
      h="84px"
      border="5px solid #FFFFFF"
      borderRadius="10px"
      overflow="hidden"
      bgColor="#FFFFFF"
      cursor="pointer"
      boxShadow="0 0 0 1px rgba(255,255,255,0.56), 0 8px 18px rgba(75, 52, 35, 0.16)"
      onClick={onClick}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition,
          display: "block",
        }}
      />
      <CardLabel>
        <Text color="#9D7859" fontSize="17px" fontWeight="800" lineHeight="1">
          {label}
        </Text>
      </CardLabel>
    </Flex>
  );
}

export function GameLobbyView() {
  const router = useRouter();
  const progress = useLivePlayerProgress();
  const mainStoryTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMainStoryTransitioning, setIsMainStoryTransitioning] = useState(false);
  const mainStoryTarget = useMemo(() => getGameLobbyMainStoryTarget(progress), [progress]);
  const shouldGuideDailyAdventure =
    progress.hasSeenGameLobbyGuide &&
    !progress.hasCompletedDailyAdventureLobbyGuideLevelOne &&
    !progress.hasSeenDailyAdventureMainStoryReturnGuide;
  const shouldGuideContinueMainStory =
    progress.hasSeenGameLobbyGuide &&
    progress.hasCompletedDailyAdventureLobbyGuideLevelOne &&
    !progress.hasSeenDailyAdventureMainStoryReturnGuide;

  useEffect(() => {
    markGameLobbyGuideSeen();
  }, []);

  useEffect(
    () => () => {
      if (mainStoryTransitionTimerRef.current) {
        clearTimeout(mainStoryTransitionTimerRef.current);
      }
    },
    [],
  );

  const navigateTo = (path: string) => {
    router.push(withTrialProfileSearch(path));
  };

  const handleMainStoryClick = () => {
    if (isMainStoryTransitioning) return;

    if (!shouldGuideContinueMainStory) {
      navigateTo(mainStoryTarget.path);
      return;
    }

    const separator = mainStoryTarget.path.includes("?") ? "&" : "?";
    const transitionTarget = `${mainStoryTarget.path}${separator}openingCloud=1`;
    markDailyAdventureMainStoryReturnGuideSeen();
    setIsMainStoryTransitioning(true);
    mainStoryTransitionTimerRef.current = setTimeout(() => {
      navigateTo(transitionTarget);
    }, LOBBY_MAIN_STORY_CLOUD_COVER_DURATION_MS);
  };

  const dailyTask: Pick<GameDailyTask, "title"> = { title: "日常冒險" };

  return (
    <Flex w={PHONE_WIDTH} maxW="393px" h={PHONE_HEIGHT} maxH="852px" position="relative">
      <Flex
        w="100%"
        h="100%"
        position="relative"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        bgColor="#CBBBA9"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
      >
        <Box position="absolute" inset="0">
          <img
            src={LOBBY_ASSETS.background}
            alt=""
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
        </Box>
        <Box
          position="absolute"
          inset="0"
          bgColor="rgba(144,112,84,0.4)"
          backdropFilter="blur(2px)"
        />

        <Flex position="absolute" left="11px" right="11px" top="11px" h="50px" gap="9px" zIndex={2}>
          <TopPill minW="181px">
            <Flex alignItems="center" gap="9px">
              <FaCoins size={22} color="#EFCB49" />
              <Text color="#9D7859" fontSize="24px" fontWeight="800" lineHeight="1">
                {progress.status.savings}
              </Text>
            </Flex>
            <Box w="1px" h="26px" bgColor="rgba(157,120,89,0.26)" />
            <Flex alignItems="center" gap="9px">
              <IoFlashOutline size={24} color="#F4C95A" />
              <Text color="#9D7859" fontSize="24px" fontWeight="800" lineHeight="1">
                {progress.status.actionPower}
              </Text>
            </Flex>
          </TopPill>
          <TopPill minW="86px" gap="5px" px="9px">
            <IoCalendarOutline size={16} color="#80695B" />
            <Text color="#80695B" fontSize="15px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
              第{Math.max(1, progress.currentDay)}天
            </Text>
          </TopPill>
          <TopPill minW="76px" px="10px">
            <Text color="#80695B" fontSize="18px" fontWeight="700" lineHeight="1" whiteSpace="nowrap">
              設定
            </Text>
          </TopPill>
        </Flex>

        <Flex
          as="button"
          position="absolute"
          left="19px"
          top="74px"
          w="calc(100% - 38px)"
          h="218px"
          border="5px solid #FFFFFF"
          borderRadius="10px"
          overflow="hidden"
          bgColor="#FFFFFF"
          cursor="pointer"
          aria-disabled={isMainStoryTransitioning}
          boxShadow={
            shouldGuideContinueMainStory
              ? "0 0 0 5px rgba(255,255,255,0.88), 0 20px 40px rgba(35, 24, 15, 0.46)"
              : "0 0 0 1px rgba(255,255,255,0.64), 0 12px 24px rgba(70, 48, 33, 0.2)"
          }
          onClick={handleMainStoryClick}
          textAlign="left"
          zIndex={shouldGuideContinueMainStory ? 8 : 2}
        >
          <img
            src={LOBBY_ASSETS.mainStory}
            alt=""
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 42%",
              display: "block",
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(118deg, rgba(0,0,0,0.54) 5%, rgba(0,0,0,0.38) 56%, rgba(0,0,0,0.15) 100%)"
          />
          <Flex
            position="absolute"
            left="17px"
            top="58px"
            h="29px"
            minW="142px"
            px="14px"
            borderRadius="999px"
            bgColor="#FEFEFE"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="#977450" fontSize="13px" fontWeight="900" lineHeight="1">
              {mainStoryTarget.badge === "新劇情" ? "ch. 第二隻小日獸" : mainStoryTarget.badge}
            </Text>
          </Flex>
          <Text
            position="absolute"
            left="21px"
            right="34px"
            top="96px"
            color="#FFFFFF"
            fontSize="18px"
            fontWeight="900"
            lineHeight="1.35"
            textShadow="0 2px 6px rgba(0,0,0,0.35)"
          >
            {mainStoryTarget.description}
          </Text>
          <Box
            position="absolute"
            left="0"
            right="0"
            bottom="0"
            h="74px"
            bgColor="rgba(157,120,89,0.92)"
            clipPath="polygon(0 28%, 100% 0, 100% 100%, 0 100%)"
          />
          <Flex
            position="absolute"
            left="21px"
            bottom="18px"
            alignItems="center"
            gap="8px"
          >
            <Text color="#FFFFFF" fontSize="25px" fontWeight="800" lineHeight="1">
              繼續旅程
            </Text>
            <IoChevronForward size={24} color="#FFFFFF" />
          </Flex>
        </Flex>

        <Flex
          as="button"
          position="absolute"
          left="17px"
          top="303px"
          w="245px"
          h="177px"
          border="5px solid #FFFFFF"
          borderRadius="10px"
          overflow="hidden"
          bgColor="#FFFFFF"
          cursor="pointer"
          boxShadow={
            shouldGuideDailyAdventure
              ? "0 0 0 5px rgba(255,255,255,0.88), 0 18px 36px rgba(35, 24, 15, 0.42)"
              : "0 0 0 1px rgba(255,255,255,0.56), 0 8px 18px rgba(75, 52, 35, 0.16)"
          }
          onClick={() => navigateTo(ROUTES.gameDaily)}
          textAlign="left"
          zIndex={shouldGuideDailyAdventure ? 8 : 2}
        >
          <img
            src={LOBBY_ASSETS.dailyAdventure}
            alt=""
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
          <CardLabel justifyContent="space-between">
            <Text color="#9D7859" fontSize="17px" fontWeight="800" lineHeight="1">
              {dailyTask.title}
            </Text>
            <Text color="#9D7859" fontSize="17px" fontWeight="800" lineHeight="1">
              體力({Math.max(0, progress.status.actionPower)}/3)
            </Text>
          </CardLabel>
        </Flex>

        <Flex position="absolute" right="16px" top="303px" direction="column" gap="9px" zIndex={2}>
          <SmallImageCard
            image={LOBBY_ASSETS.mission}
            label="任務"
            objectPosition="center 28%"
            onClick={() => navigateTo(ROUTES.gameDaily)}
          />
          <SmallImageCard
            image={LOBBY_ASSETS.hibimon}
            label="小日獸"
            objectPosition="center"
            onClick={() => navigateTo(`${ROUTES.gameScene("scene-night-hub")}?diary=1&tab=sunbeast`)}
          />
        </Flex>

        <LobbyBeigoPlayground />

        {shouldGuideDailyAdventure || shouldGuideContinueMainStory ? (
          <Box position="absolute" inset="0" zIndex={5} bgColor="rgba(30, 22, 16, 0.56)" pointerEvents="auto" />
        ) : null}
        {shouldGuideDailyAdventure ? (
          <Flex
            position="absolute"
            left="30px"
            top="488px"
            zIndex={9}
            w="278px"
            borderRadius="16px"
            bgColor="rgba(255,250,238,0.98)"
            border="2px solid #B98A62"
            boxShadow="0 14px 30px rgba(35, 24, 15, 0.3)"
            px="15px"
            py="13px"
            direction="column"
            gap="5px"
            pointerEvents="none"
          >
            <Box
              position="absolute"
              left="42px"
              top="-8px"
              w="14px"
              h="14px"
              bgColor="rgba(255,250,238,0.98)"
              borderLeft="2px solid #B98A62"
              borderTop="2px solid #B98A62"
              transform="rotate(45deg)"
            />
            <Text color="#6C4F3A" fontSize="14px" fontWeight="900" lineHeight="1.45">
              先來完成一次日常冒險 Level 1。
            </Text>
            <Text color="#92745C" fontSize="12px" fontWeight="800" lineHeight="1.45">
              這裡可以帶小貝狗出門，收集地點拼圖、事件和照片。
            </Text>
          </Flex>
        ) : null}
        {shouldGuideContinueMainStory ? (
          <Flex
            position="absolute"
            left="36px"
            top="301px"
            zIndex={9}
            w="306px"
            borderRadius="16px"
            bgColor="rgba(255,250,238,0.98)"
            border="2px solid #B98A62"
            boxShadow="0 14px 30px rgba(35, 24, 15, 0.3)"
            px="15px"
            py="13px"
            direction="column"
            gap="5px"
            pointerEvents="none"
          >
            <Box
              position="absolute"
              left="50%"
              top="-8px"
              w="14px"
              h="14px"
              bgColor="rgba(255,250,238,0.98)"
              borderLeft="2px solid #B98A62"
              borderTop="2px solid #B98A62"
              transform="translateX(-50%) rotate(45deg)"
            />
            <Text color="#6C4F3A" fontSize="14px" fontWeight="900" lineHeight="1.45">
              日常冒險完成了，回到主線吧。
            </Text>
            <Text color="#92745C" fontSize="12px" fontWeight="800" lineHeight="1.45">
              點上方「繼續旅程」，故事會接著往下一隻小日獸前進。
            </Text>
          </Flex>
        ) : null}
        {isMainStoryTransitioning ? <LobbyMainStoryCloudTransition /> : null}
      </Flex>
    </Flex>
  );
}

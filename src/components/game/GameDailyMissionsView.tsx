"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import {
  IoArrowBack,
  IoCalendarOutline,
  IoChevronForward,
  IoFlashOutline,
} from "react-icons/io5";
import { FaCoins } from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  GAME_DAILY_TASKS,
  getGameLobbyMainStoryTarget,
  type GameDailyTask,
} from "@/lib/game/lobbyFlow";
import {
  INITIAL_PLAYER_PROGRESS,
  PLAYER_PROGRESS_CHANGE_EVENT,
  loadPlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";

const PHONE_WIDTH = { base: "100vw", sm: "393px" };
const PHONE_HEIGHT = { base: "100dvh", sm: "852px" };

const DAILY_ASSETS = {
  background: "/images/lobby/main_hub_bg.png",
  route: "/images/lobby/daily_adventure.png",
  work: "/images/lobby/main_story_card.png",
  sunbeast: "/images/lobby/mission_card.png",
} as const;

const DAILY_IMAGE_BY_ID: Record<string, string> = {
  "daily-route": DAILY_ASSETS.route,
  "daily-work": DAILY_ASSETS.work,
  "daily-sunbeast": DAILY_ASSETS.sunbeast,
};

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

function DailyTaskCard({
  task,
  index,
  onStart,
}: {
  task: GameDailyTask;
  index: number;
  onStart: () => void;
}) {
  const image = DAILY_IMAGE_BY_ID[task.id] ?? DAILY_ASSETS.route;

  return (
    <Flex
      as="button"
      position="relative"
      w="100%"
      minH="148px"
      border="5px solid #FFFFFF"
      borderRadius="10px"
      overflow="hidden"
      bgColor="#FFFFFF"
      cursor="pointer"
      boxShadow="0 0 0 1px rgba(255,255,255,0.58), 0 8px 18px rgba(75, 52, 35, 0.16)"
      onClick={onStart}
      textAlign="left"
    >
      <Box position="absolute" inset="0">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: task.id === "daily-work" ? "center 42%" : "center",
            display: "block",
          }}
        />
      </Box>
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(90deg, rgba(54,39,28,0.62) 0%, rgba(54,39,28,0.34) 58%, rgba(54,39,28,0.08) 100%)"
      />
      <Flex
        position="absolute"
        left="12px"
        top="12px"
        h="31px"
        minW="112px"
        px="12px"
        borderRadius="999px"
        bgColor="#FEFEFE"
        alignItems="center"
        justifyContent="center"
        gap="7px"
      >
        <Text color="#977450" fontSize="13px" fontWeight="900" lineHeight="1">
          {index + 1}. {task.eyebrow}
        </Text>
      </Flex>
      <Flex position="absolute" left="16px" right="18px" top="50px" direction="column" gap="4px">
        <Text color="#FFFFFF" fontSize="23px" fontWeight="900" lineHeight="1.05" textShadow="0 2px 6px rgba(0,0,0,0.32)">
          {task.title}
        </Text>
        <Text
          color="rgba(255,255,255,0.94)"
          fontSize="13px"
          fontWeight="800"
          lineHeight="1.2"
          textShadow="0 2px 5px rgba(0,0,0,0.25)"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {task.description}
        </Text>
      </Flex>
      <Flex
        position="absolute"
        left="0"
        right="0"
        bottom="0"
        h="42px"
        px="16px"
        bgColor="rgba(255,255,255,0.86)"
        alignItems="center"
        justifyContent="space-between"
        color="#9D7859"
      >
        <Text color="#9D7859" fontSize="15px" fontWeight="900" lineHeight="1">
          {task.rewardLabel}
        </Text>
        <Flex alignItems="center" gap="4px">
          <Text color="#9D7859" fontSize="15px" fontWeight="900" lineHeight="1">
            {task.actionLabel}
          </Text>
          <IoChevronForward size={17} color="#9D7859" />
        </Flex>
      </Flex>
    </Flex>
  );
}

export function GameDailyMissionsView() {
  const router = useRouter();
  const progress = useLivePlayerProgress();
  const mainStoryTarget = useMemo(() => getGameLobbyMainStoryTarget(progress), [progress]);

  const navigateTo = (path: string) => {
    router.push(withTrialProfileSearch(path));
  };

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
            src={DAILY_ASSETS.background}
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
          <Flex
            as="button"
            h="50px"
            minW="76px"
            px="10px"
            border="0"
            borderRadius="22px"
            bgColor="#FFFFFF"
            alignItems="center"
            justifyContent="center"
            gap="6px"
            color="#80695B"
            boxShadow="0 5px 12px rgba(70, 48, 33, 0.12)"
            cursor="pointer"
            onClick={() => navigateTo(ROUTES.gameLobby)}
          >
            <IoArrowBack size={18} />
            <Text color="#80695B" fontSize="16px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
              返回
            </Text>
          </Flex>
        </Flex>

        <Flex position="absolute" left="19px" right="19px" top="82px" direction="column" gap="11px" zIndex={2}>
          <Flex direction="column" gap="7px" mb="2px">
            <Flex
              h="32px"
              alignSelf="flex-start"
              px="14px"
              borderRadius="999px"
              bgColor="#FFFFFF"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="#977450" fontSize="14px" fontWeight="900" lineHeight="1">
                DAILY
              </Text>
            </Flex>
            <Text color="#FFFFFF" fontSize="30px" fontWeight="900" lineHeight="1" textShadow="0 3px 8px rgba(66,45,28,0.35)">
              日常冒險
            </Text>
            <Text color="rgba(255,255,255,0.94)" fontSize="14px" fontWeight="800" lineHeight="1.45" textShadow="0 2px 6px rgba(66,45,28,0.28)">
              完成每日小遊戲，累積主線需要的資源。
            </Text>
          </Flex>

          {GAME_DAILY_TASKS.map((task, index) => (
            <DailyTaskCard
              key={task.id}
              task={task}
              index={index}
              onStart={() => navigateTo(task.path)}
            />
          ))}
        </Flex>

        <Flex
          as="button"
          position="absolute"
          left="19px"
          right="19px"
          bottom="18px"
          h="54px"
          border="0"
          borderRadius="10px"
          bgColor="#9D7859"
          alignItems="center"
          justifyContent="center"
          gap="8px"
          cursor="pointer"
          boxShadow="0 8px 18px rgba(72, 43, 25, 0.22)"
          onClick={() => navigateTo(mainStoryTarget.path)}
          zIndex={2}
        >
          <Text color="#FFFFFF" fontSize="21px" fontWeight="900" lineHeight="1">
            繼續旅程
          </Text>
          <IoChevronForward size={22} color="#FFFFFF" />
        </Flex>
      </Flex>
    </Flex>
  );
}

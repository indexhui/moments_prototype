"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import {
  IoAlbumsOutline,
  IoArrowBack,
  IoFlashOutline,
  IoMapOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import { FaCoins } from "react-icons/fa6";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_COMPANIONS,
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_STATE_CHANGE_EVENT,
  INITIAL_DAILY_ADVENTURE_STATE,
  isDailyAdventureCapturedPhotoRecord,
  loadDailyAdventureState,
  type DailyAdventureCollectedRecord,
  type DailyAdventureState,
} from "@/lib/game/dailyAdventure";
import {
  INITIAL_PLAYER_PROGRESS,
  PLAYER_PROGRESS_CHANGE_EVENT,
  loadPlayerProgress,
  type PlayerProgress,
} from "@/lib/game/playerProgress";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";

const PHONE_WIDTH = { base: "100vw", sm: "393px" };
const PHONE_HEIGHT = { base: "100dvh", sm: "852px" };

export function useDailyAdventureData() {
  const [state, setState] = useState<DailyAdventureState>(INITIAL_DAILY_ADVENTURE_STATE);
  const [progress, setProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);

  useEffect(() => {
    const syncDaily = () => setState(loadDailyAdventureState());
    const syncProgress = () => setProgress(loadPlayerProgress());
    syncDaily();
    syncProgress();
    window.addEventListener(DAILY_ADVENTURE_STATE_CHANGE_EVENT, syncDaily);
    window.addEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
    window.addEventListener("focus", syncDaily);
    window.addEventListener("focus", syncProgress);
    return () => {
      window.removeEventListener(DAILY_ADVENTURE_STATE_CHANGE_EVENT, syncDaily);
      window.removeEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
      window.removeEventListener("focus", syncDaily);
      window.removeEventListener("focus", syncProgress);
    };
  }, []);

  return { state, progress };
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <Flex
      h="36px"
      px="11px"
      borderRadius="999px"
      bgColor="rgba(255,255,255,0.92)"
      alignItems="center"
      gap="6px"
      boxShadow="0 4px 10px rgba(83,58,38,0.11)"
    >
      {children}
    </Flex>
  );
}

export function DailyAdventureShell({
  title,
  eyebrow = "DAILY ADVENTURE",
  backHref = ROUTES.gameLobby,
  children,
  showBottomNav = true,
  overlay,
}: {
  title: string;
  eyebrow?: string;
  backHref?: string;
  children: ReactNode;
  showBottomNav?: boolean;
  overlay?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { progress } = useDailyAdventureData();
  const go = (path: string) => router.push(withTrialProfileSearch(path));
  const navItems = [
    { id: "home", label: "冒險", icon: IoSparklesOutline, path: ROUTES.gameDaily },
    { id: "stages", label: "關卡", icon: IoMapOutline, path: ROUTES.gameDailyStages },
    { id: "collection", label: "收藏", icon: IoAlbumsOutline, path: ROUTES.gameDailyCollection },
  ];

  return (
    <Flex w={PHONE_WIDTH} maxW="393px" h={PHONE_HEIGHT} maxH="852px" position="relative">
      <Flex
        w="100%"
        h="100%"
        position="relative"
        direction="column"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        bgColor="#F8F0E3"
        bgImage="linear-gradient(180deg, #EBCFA8 0px, #F8F0E3 230px, #F8F0E3 100%)"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
      >
        <Box
          position="absolute"
          top="-90px"
          right="-100px"
          w="270px"
          h="270px"
          borderRadius="50%"
          bgColor="rgba(255,244,202,0.58)"
          pointerEvents="none"
        />
        <Flex
          position="relative"
          minH="104px"
          px="14px"
          pt="12px"
          pb="10px"
          direction="column"
          zIndex={2}
        >
          <Flex alignItems="center" justifyContent="space-between" gap="8px">
            <Flex
              as="button"
              w="38px"
              h="38px"
              borderRadius="50%"
              bgColor="rgba(255,255,255,0.92)"
              alignItems="center"
              justifyContent="center"
              color="#7E624D"
              boxShadow="0 4px 10px rgba(83,58,38,0.11)"
              cursor="pointer"
              onClick={() => go(backHref)}
              aria-label="返回"
            >
              <IoArrowBack size={20} />
            </Flex>
            <Flex gap="6px">
              <StatusPill>
                <FaCoins size={17} color="#E7B940" />
                <Text color="#80634E" fontWeight="900" fontSize="15px">
                  {progress.status.savings}
                </Text>
              </StatusPill>
              <StatusPill>
                <IoFlashOutline size={18} color="#E5A93D" />
                <Text color="#80634E" fontWeight="900" fontSize="15px">
                  {progress.status.actionPower}
                </Text>
              </StatusPill>
            </Flex>
          </Flex>
          <Flex mt="9px" direction="column">
            <Text color="#9A6C49" fontSize="10px" fontWeight="900" letterSpacing="0.13em">
              {eyebrow}
            </Text>
            <Text color="#5E493A" fontSize="25px" fontWeight="900" lineHeight="1.1">
              {title}
            </Text>
          </Flex>
        </Flex>

        <Box
          position="relative"
          zIndex={1}
          flex="1"
          minH="0"
          overflowY="auto"
          px="14px"
          pb={showBottomNav ? "92px" : "22px"}
          css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          {children}
        </Box>

        {showBottomNav ? (
          <Flex
            position="absolute"
            left="12px"
            right="12px"
            bottom="10px"
            h="64px"
            borderRadius="20px"
            bgColor="rgba(255,255,255,0.96)"
            boxShadow="0 10px 24px rgba(76,54,39,0.16)"
            zIndex={10}
            px="8px"
            alignItems="center"
            justifyContent="space-around"
          >
            {navItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Flex
                  as="button"
                  key={item.id}
                  minW="92px"
                  h="50px"
                  borderRadius="15px"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  gap="2px"
                  bgColor={active ? "#F3E3CC" : "transparent"}
                  color={active ? "#8A6044" : "#A18E7E"}
                  cursor="pointer"
                  onClick={() => go(item.path)}
                >
                  <Icon size={21} />
                  <Text color="inherit" fontSize="11px" fontWeight="900">
                    {item.label}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        ) : null}

        {overlay}
      </Flex>
    </Flex>
  );
}

export function DailyAdventureRecordArtwork({
  record,
  compact = false,
}: {
  record: DailyAdventureCollectedRecord;
  compact?: boolean;
}) {
  const location = DAILY_ADVENTURE_LOCATIONS[record.locationId];
  const companion = DAILY_ADVENTURE_COMPANIONS[record.companionId];
  const height = compact ? "116px" : "280px";
  const isCapturedPhoto = isDailyAdventureCapturedPhotoRecord(record);
  const imagePath = record.kind === "photo" && !isCapturedPhoto ? location.imagePath : record.imagePath;

  return (
    <Box
      position="relative"
      w="100%"
      h={height}
      overflow="hidden"
      bgColor="#D9C2A7"
      borderRadius={compact ? "12px" : "18px"}
    >
      <img
        src={imagePath}
        alt=""
        aria-hidden="true"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {record.kind === "photo" && !isCapturedPhoto ? (
        <>
          <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(255,255,255,0.08), rgba(69,46,29,0.2))" />
          <Box
            position="absolute"
            left="50%"
            bottom={compact ? "-7px" : "-24px"}
            transform="translateX(-50%)"
            w={compact ? "82px" : "190px"}
            h={compact ? "92px" : "220px"}
          >
            <img
              src={companion.imagePath}
              alt={companion.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </Box>
        </>
      ) : null}
      {record.kind === "comic" ? (
        <Box position="absolute" inset="6px" border="4px solid #FFF9EE" boxShadow="0 0 0 2px #6E5544" pointerEvents="none" />
      ) : null}
      {record.kind === "text" ? (
        <Flex
          position="absolute"
          left={compact ? "8px" : "18px"}
          right={compact ? "8px" : "18px"}
          bottom={compact ? "8px" : "18px"}
          minH={compact ? "42px" : "78px"}
          p={compact ? "7px" : "14px"}
          borderRadius={compact ? "8px" : "14px"}
          bgColor="rgba(255,253,247,0.92)"
          alignItems="center"
        >
          <Text color="#664D3D" fontSize={compact ? "10px" : "15px"} fontWeight="800" lineHeight="1.45">
            「{record.description}」
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
}

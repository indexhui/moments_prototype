"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoCheckmark, IoLockClosed } from "react-icons/io5";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_STAGES,
  beginDailyAdventureStage,
  grantDailyAdventureTestActionPower,
} from "@/lib/game/dailyAdventure";
import {
  DAILY_ADVENTURE_PROFILE_CHANGE_EVENT,
  DEFAULT_DAILY_ADVENTURE_AVATAR,
  loadDailyAdventureProfile,
  type DailyAdventureProfile,
} from "@/lib/game/dailyAdventureProfile";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { DailyAdventureAvatarPreview } from "./DailyAdventureAvatarPreview";
import { DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";

const MAP_NODE_POSITIONS = [
  { left: "58%", top: "84%" },
  { left: "18%", top: "70%" },
  { left: "64%", top: "54%" },
  { left: "24%", top: "39%" },
  { left: "61%", top: "23%" },
  { left: "13%", top: "8%" },
] as const;

export function DailyAdventureMapView({
  overlay,
}: {
  overlay?: ReactNode;
} = {}) {
  const router = useRouter();
  const { state } = useDailyAdventureData();
  const [message, setMessage] = useState("");
  const [departingStageId, setDepartingStageId] = useState<number | null>(null);
  const [profile, setProfile] = useState<DailyAdventureProfile | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    grantDailyAdventureTestActionPower();
    const syncProfile = () => setProfile(loadDailyAdventureProfile());
    syncProfile();
    window.addEventListener(DAILY_ADVENTURE_PROFILE_CHANGE_EVENT, syncProfile);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      window.removeEventListener(DAILY_ADVENTURE_PROFILE_CHANGE_EVENT, syncProfile);
    };
  }, []);

  const startStage = (stageId: number) => {
    if (departingStageId !== null) return;
    if (state.activeRun && state.activeRun.stageId !== stageId) {
      setMessage(`第 ${state.activeRun.stageId} 關還在進行中。`);
      return;
    }
    const result = beginDailyAdventureStage(stageId);
    if (!result.ok) {
      setMessage(result.reason);
      return;
    }
    setMessage("");
    setDepartingStageId(stageId);
    timerRef.current = window.setTimeout(() => {
      router.push(withTrialProfileSearch(ROUTES.gameDailyPlay));
    }, 1050);
  };

  return (
    <DailyAdventureShell
      title="冒險地圖"
      eyebrow="DAILY ADVENTURE"
      backHref={ROUTES.gameLobby}
      showBottomNav={false}
      showStatus={false}
      overlay={overlay}
    >
      {message ? (
        <Flex
          mb="9px"
          minH="36px"
          px="11px"
          borderRadius="12px"
          bgColor="#F4E0D2"
          alignItems="center"
        >
          <Text color="#966047" fontSize="11px" fontWeight="900">
            {message}
          </Text>
        </Flex>
      ) : null}

      <Box
        position="relative"
        h="610px"
        overflow="hidden"
        borderRadius="24px"
        border="1px solid rgba(122,103,78,0.18)"
        bgColor="#E7E8CE"
        bgImage="linear-gradient(rgba(245,241,214,0.72), rgba(218,226,197,0.82)), url('/images/lobby/daily_adventure.png')"
        bgSize="cover"
        backgroundPosition="center"
        boxShadow="inset 0 0 45px rgba(94,104,67,0.12)"
      >
        <Box
          position="absolute"
          inset="0"
          opacity={0.54}
          aria-hidden="true"
        >
          <svg width="100%" height="100%" viewBox="0 0 360 610" preserveAspectRatio="none">
            <path
              d="M244 570 C226 536, 123 543, 104 492 C74 406, 224 428, 260 372 C302 306, 132 326, 112 270 C88 198, 210 215, 248 166 C286 118, 190 92, 72 64"
              fill="none"
              stroke="#F8F1D8"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M244 570 C226 536, 123 543, 104 492 C74 406, 224 428, 260 372 C302 306, 132 326, 112 270 C88 198, 210 215, 248 166 C286 118, 190 92, 72 64"
              fill="none"
              stroke="#A5A883"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="3 10"
            />
          </svg>
        </Box>

        {DAILY_ADVENTURE_STAGES.slice(0, 6).map((stage, index) => {
          const unlocked = stage.id <= state.highestUnlockedStage;
          const completed = state.completedStageIds.includes(stage.id);
          const active = state.activeRun?.stageId === stage.id;
          const position = MAP_NODE_POSITIONS[index];
          return (
            <Flex
              key={stage.id}
              position="absolute"
              left={position.left}
              top={position.top}
              transform="translate(-50%, -50%)"
              direction="column"
              alignItems="center"
              gap="5px"
              zIndex={2}
            >
              <Flex
                as="button"
                w={active ? "72px" : "62px"}
                h={active ? "72px" : "62px"}
                borderRadius="50%"
                bgColor={
                  completed
                    ? "#7E9873"
                    : unlocked
                      ? "#C98D63"
                      : "rgba(150,145,128,0.72)"
                }
                border="5px solid rgba(255,253,239,0.92)"
                color="white"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 7px 16px rgba(80,65,45,0.2)"
                cursor={unlocked ? "pointer" : "default"}
                aria-label={
                  unlocked
                    ? `${active ? "繼續" : "開始"}第 ${stage.id} 關，${stage.title}`
                    : `第 ${stage.id} 關尚未解鎖`
                }
                aria-disabled={!unlocked}
                onClick={() => {
                  if (unlocked) startStage(stage.id);
                }}
              >
                {completed ? (
                  <IoCheckmark size={27} />
                ) : unlocked ? (
                  <Text color="white" fontSize="23px" fontWeight="900">
                    {stage.id}
                  </Text>
                ) : (
                  <IoLockClosed size={20} />
                )}
              </Flex>
              <Flex
                maxW="128px"
                px="9px"
                py="4px"
                borderRadius="999px"
                bgColor="rgba(255,253,245,0.9)"
                boxShadow="0 3px 8px rgba(76,63,45,0.1)"
              >
                <Text
                  color={unlocked ? "#5D4B3D" : "#8B857B"}
                  fontSize="10px"
                  fontWeight="900"
                  whiteSpace="nowrap"
                >
                  {active ? "繼續・" : ""}
                  Level {stage.id}
                </Text>
              </Flex>
            </Flex>
          );
        })}
      </Box>

      <Flex
        mt="10px"
        minH="64px"
        px="12px"
        py="8px"
        borderRadius="18px"
        bgColor="rgba(255,255,255,0.78)"
        border="1px solid rgba(144,117,89,0.16)"
        alignItems="center"
        gap="10px"
      >
        <DailyAdventureAvatarPreview
          avatar={profile?.avatar ?? DEFAULT_DAILY_ADVENTURE_AVATAR}
          name={profile?.name}
          size="48px"
          background="#DCE8D3"
        />
        <Flex direction="column" minW="0">
          <Text color="#5D4A3C" fontSize="14px" fontWeight="900">
            {profile?.name ?? "旅行者"}，今天想去哪裡？
          </Text>
          <Text color="#927661" fontSize="11px">
            點一下亮起的關卡，就能出發。
          </Text>
        </Flex>
      </Flex>

      {departingStageId !== null ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={90}
          bgColor="#F2F0DF"
          bgImage="radial-gradient(circle at 17% 24%, rgba(142,181,161,0.34) 0 4px, transparent 5px), radial-gradient(circle at 82% 70%, rgba(107,149,175,0.24) 0 5px, transparent 6px)"
          direction="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          px="40px"
        >
          <Flex
            w="116px"
            h="116px"
            borderRadius="50%"
            bgColor="#E4E7C9"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <img
              src="/images/lobby/beigo_idle.png"
              alt="準備出發的小貝狗"
              style={{ width: "104px", height: "104px", objectFit: "contain" }}
            />
          </Flex>
          <Text
            mt="24px"
            color="#4F5041"
            fontSize="22px"
            fontWeight="900"
            lineHeight="1.5"
          >
            和小日獸們一起，
            <br />
            開始今天的日常冒險！
          </Text>
          <Text mt="10px" color="#85826D" fontSize="12px" fontWeight="800">
            Level {departingStageId}
          </Text>
        </Flex>
      ) : null}
    </DailyAdventureShell>
  );
}

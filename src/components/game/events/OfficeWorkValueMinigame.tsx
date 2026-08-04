"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiClock, FiCommand, FiCpu, FiMousePointer, FiTrendingUp, FiZap } from "react-icons/fi";

type WorkPhase = "intro" | "playing" | "upgrade" | "complete";
type UpgradeId = "shortcut" | "automation" | "focus";

const WORK_MILESTONES = [
  { id: "mail", label: "回覆急件", target: 20 },
  { id: "deck", label: "整理企劃檔", target: 50 },
  { id: "report", label: "送出今日進度", target: 90 },
] as const;

const workPulse = keyframes`
  0% { transform: scale(1); filter: brightness(1); }
  42% { transform: scale(0.975); filter: brightness(1.12); }
  100% { transform: scale(1); filter: brightness(1); }
`;

const valueBurst = keyframes`
  0% { opacity: 0; transform: translate(-50%, 12px) scale(0.8); }
  24% { opacity: 1; transform: translate(-50%, -3px) scale(1.08); }
  100% { opacity: 0; transform: translate(-50%, -46px) scale(1); }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const completionGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(100, 219, 181, 0); }
  50% { box-shadow: 0 0 34px rgba(100, 219, 181, 0.42); }
`;

const UPGRADE_COPY: Record<UpgradeId, { title: string; detail: string; icon: typeof FiCommand }> = {
  shortcut: {
    title: "快捷鍵組合",
    detail: "每次點擊工作值 +2",
    icon: FiCommand,
  },
  automation: {
    title: "自動整理",
    detail: "每秒自動產生 2 工作值",
    icon: FiCpu,
  },
  focus: {
    title: "專注模式",
    detail: "每次點擊 +1，期限延長 6 秒",
    icon: FiZap,
  },
};

export function OfficeWorkValueMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<WorkPhase>("intro");
  const [workValue, setWorkValue] = useState(0);
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [clickPower, setClickPower] = useState(2);
  const [autoPower, setAutoPower] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(12);
  const [deadlineMisses, setDeadlineMisses] = useState(0);
  const [burstNonce, setBurstNonce] = useState(0);
  const [selectedUpgrades, setSelectedUpgrades] = useState<UpgradeId[]>([]);

  const milestone = WORK_MILESTONES[Math.min(milestoneIndex, WORK_MILESTONES.length - 1)];
  const previousTarget = milestoneIndex <= 0 ? 0 : WORK_MILESTONES[milestoneIndex - 1]?.target ?? 0;
  const milestoneProgress = Math.max(
    0,
    Math.min(100, ((workValue - previousTarget) / Math.max(1, milestone.target - previousTarget)) * 100),
  );
  const totalProgress = Math.min(100, (workValue / WORK_MILESTONES.at(-1)!.target) * 100);
  const availableUpgrades = useMemo<UpgradeId[]>(
    () =>
      milestoneIndex === 0
        ? ["shortcut", "automation"]
        : selectedUpgrades.includes("automation")
          ? ["shortcut", "focus"]
          : ["automation", "focus"],
    [milestoneIndex, selectedUpgrades],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    if (workValue < milestone.target) return;
    if (milestoneIndex >= WORK_MILESTONES.length - 1) {
      setPhase("complete");
      return;
    }
    setPhase("upgrade");
  }, [milestone.target, milestoneIndex, phase, workValue]);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = window.setInterval(() => {
      if (autoPower > 0) setWorkValue((current) => current + autoPower);
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;
        setDeadlineMisses((count) => count + 1);
        setClickPower((power) => power + 1);
        return 10;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [autoPower, phase]);

  const generateWorkValue = () => {
    if (phase !== "playing") return;
    setWorkValue((current) => current + clickPower);
    setBurstNonce((current) => current + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
  };

  const chooseUpgrade = (upgradeId: UpgradeId) => {
    setSelectedUpgrades((current) => [...current, upgradeId]);
    if (upgradeId === "shortcut") setClickPower((current) => current + 2);
    if (upgradeId === "automation") setAutoPower((current) => current + 2);
    if (upgradeId === "focus") {
      setClickPower((current) => current + 1);
      setSecondsLeft((current) => current + 6);
    }
    setMilestoneIndex((current) => current + 1);
    setSecondsLeft(12);
    setPhase("playing");
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={76}
      direction="column"
      overflow="hidden"
      bgColor="#121A22"
      backgroundImage="radial-gradient(circle at 50% 18%, rgba(71,115,130,0.36), transparent 38%), linear-gradient(160deg, #1E2B35 0%, #10161D 70%)"
      color="white"
      data-office-work-phase={phase}
    >
      <Flex px="18px" pt="18px" pb="13px" direction="column" gap="9px">
        <Flex alignItems="center" justifyContent="space-between">
          <Box>
            <Text color="#8ED7C1" fontSize="10px" fontWeight="900" letterSpacing="0.13em">
              下班前的工作桌
            </Text>
            <Text mt="2px" fontSize="22px" fontWeight="900">
              把工作值推到 90
            </Text>
          </Box>
          <Flex alignItems="center" gap="6px" px="10px" py="7px" borderRadius="999px" bgColor="rgba(255,255,255,0.09)">
            <FiClock size={15} />
            <Text fontSize="13px" fontWeight="900">{secondsLeft}s</Text>
          </Flex>
        </Flex>

        <Box h="8px" borderRadius="999px" overflow="hidden" bgColor="rgba(255,255,255,0.1)">
          <Box h="100%" w={`${totalProgress}%`} bg="linear-gradient(90deg, #55B59B, #A6E6C8)" transition="width 180ms ease" />
        </Box>
      </Flex>

      <Flex flex="1" minH="0" direction="column" px="18px" pb="20px" gap="13px">
        <Flex gap="8px">
          {WORK_MILESTONES.map((item, index) => {
            const done = workValue >= item.target;
            const active = index === milestoneIndex && phase !== "complete";
            return (
              <Flex
                key={item.id}
                flex="1"
                minW="0"
                direction="column"
                px="9px"
                py="8px"
                borderRadius="10px"
                border={active ? "1px solid rgba(142,215,193,0.72)" : "1px solid rgba(255,255,255,0.08)"}
                bgColor={done ? "rgba(77,153,128,0.3)" : "rgba(255,255,255,0.055)"}
              >
                <Text color={done ? "#A7E8CE" : "rgba(255,255,255,0.62)"} fontSize="9px" fontWeight="900">
                  {done ? "完成" : `${item.target} 值`}
                </Text>
                <Text mt="2px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" fontSize="11px" fontWeight="800">
                  {item.label}
                </Text>
              </Flex>
            );
          })}
        </Flex>

        <Flex
          flex="1"
          minH="0"
          direction="column"
          alignItems="center"
          justifyContent="center"
          position="relative"
          borderRadius="18px"
          border="1px solid rgba(150,201,213,0.24)"
          bgColor="rgba(6,12,18,0.56)"
          boxShadow="inset 0 0 42px rgba(66,128,142,0.12), 0 18px 36px rgba(0,0,0,0.22)"
          overflow="hidden"
        >
          <Flex position="absolute" top="13px" left="14px" right="14px" alignItems="center" justifyContent="space-between">
            <Text color="#89A9B3" fontSize="10px" fontWeight="900">DESKTOP / TASK_QUEUE</Text>
            <Text color={deadlineMisses > 0 ? "#F2BB78" : "#8ED7C1"} fontSize="10px" fontWeight="900">
              {deadlineMisses > 0 ? `催件 ${deadlineMisses}` : "進度正常"}
            </Text>
          </Flex>

          <Flex direction="column" alignItems="center" position="relative" zIndex={2}>
            <Text color="#91B7C1" fontSize="11px" fontWeight="900" letterSpacing="0.12em">
              WORK VALUE
            </Text>
            <Text mt="4px" color="#F7FAF8" fontSize="58px" fontWeight="900" lineHeight="1">
              {Math.floor(workValue)}
            </Text>
            <Text mt="8px" color="rgba(255,255,255,0.58)" fontSize="12px" fontWeight="700">
              每次 +{clickPower}{autoPower > 0 ? `・每秒 +${autoPower}` : ""}
            </Text>
          </Flex>

          {burstNonce > 0 ? (
            <Text
              key={burstNonce}
              position="absolute"
              left="50%"
              top="44%"
              zIndex={5}
              color="#B7F1D8"
              fontSize="20px"
              fontWeight="900"
              pointerEvents="none"
              animation={`${valueBurst} 720ms ease-out both`}
            >
              +{clickPower}
            </Text>
          ) : null}

          <Flex position="absolute" left="15px" right="15px" bottom="15px" direction="column" gap="7px">
            <Flex justifyContent="space-between">
              <Text color="rgba(255,255,255,0.64)" fontSize="10px" fontWeight="800">目前：{milestone.label}</Text>
              <Text color="#A7E8CE" fontSize="10px" fontWeight="900">{Math.min(workValue, milestone.target)} / {milestone.target}</Text>
            </Flex>
            <Box h="6px" borderRadius="999px" overflow="hidden" bgColor="rgba(255,255,255,0.1)">
              <Box h="100%" w={`${milestoneProgress}%`} bgColor="#6AC1A7" transition="width 140ms ease" />
            </Box>
          </Flex>
        </Flex>

        <Flex
          as="button"
          h="66px"
          flexShrink={0}
          borderRadius="16px"
          alignItems="center"
          justifyContent="center"
          gap="11px"
          bg="linear-gradient(180deg, #4F9F8A 0%, #337866 100%)"
          color="white"
          boxShadow="0 9px 0 #24584B, 0 15px 24px rgba(0,0,0,0.3)"
          cursor={phase === "playing" ? "pointer" : "default"}
          pointerEvents={phase === "playing" ? "auto" : "none"}
          _active={{ transform: "translateY(5px)", boxShadow: "0 4px 0 #24584B" }}
          animation={burstNonce > 0 ? `${workPulse} 180ms ease` : undefined}
          onClick={generateWorkValue}
        >
          <FiMousePointer size={22} />
          <Text fontSize="17px" fontWeight="900">處理電腦桌面工作</Text>
        </Flex>
      </Flex>

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={20} px="24px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.76)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" gap="14px" p="22px" borderRadius="18px" bgColor="#F7F2E8" color="#3D3732" boxShadow="0 24px 48px rgba(0,0,0,0.4)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="48px" h="48px" borderRadius="14px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center"><FiTrendingUp size={24} /></Flex>
            <Box>
              <Text fontSize="23px" fontWeight="900">下班前，把工作值做出來</Text>
              <Text mt="7px" color="#71665C" fontSize="13px" fontWeight="700" lineHeight="1.7">
                點擊電腦桌面處理工作。每完成一件急件，就選一個增益，讓後面的工作跑得更快。
              </Text>
            </Box>
            <Flex as="button" h="48px" borderRadius="12px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center" onClick={() => setPhase("playing")}>
              <Text fontSize="14px" fontWeight="900">開始工作</Text>
            </Flex>
            <Text as="button" color="#9A8B7D" fontSize="11px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "upgrade" ? (
        <Flex position="absolute" inset="0" zIndex={20} px="20px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.76)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" gap="13px" p="20px" borderRadius="18px" bgColor="#F7F2E8" color="#3D3732" boxShadow="0 24px 48px rgba(0,0,0,0.4)" animation={`${panelIn} 260ms ease both`}>
            <Box>
              <Text color="#4E8D7C" fontSize="10px" fontWeight="900" letterSpacing="0.13em">急件完成</Text>
              <Text mt="4px" fontSize="22px" fontWeight="900">選一個工作增益</Text>
            </Box>
            {availableUpgrades.map((upgradeId) => {
              const copy = UPGRADE_COPY[upgradeId];
              const Icon = copy.icon;
              return (
                <Flex key={upgradeId} as="button" minH="68px" p="12px" borderRadius="13px" alignItems="center" gap="12px" textAlign="left" bgColor="#E9E1D4" border="1px solid #D7C9B6" onClick={() => chooseUpgrade(upgradeId)}>
                  <Flex w="42px" h="42px" borderRadius="12px" flexShrink={0} bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center"><Icon size={20} /></Flex>
                  <Box>
                    <Text fontSize="15px" fontWeight="900">{copy.title}</Text>
                    <Text mt="2px" color="#796C60" fontSize="12px" fontWeight="700">{copy.detail}</Text>
                  </Box>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={22} px="24px" alignItems="center" justifyContent="center" bgColor="rgba(7,11,15,0.82)" backdropFilter="blur(6px)">
          <Flex w="100%" direction="column" alignItems="center" textAlign="center" gap="12px" p="24px" borderRadius="20px" bgColor="#EFF8F4" color="#2F433D" animation={`${panelIn} 260ms ease both, ${completionGlow} 2200ms ease-in-out infinite`}>
            <Flex w="70px" h="70px" borderRadius="50%" bgColor="#4E9B84" color="white" alignItems="center" justifyContent="center"><FiZap size={31} /></Flex>
            <Text mt="4px" fontSize="25px" fontWeight="900">今日工作完成</Text>
            <Text color="#64756F" fontSize="13px" fontWeight="700" lineHeight="1.65">
              工作值達到 {Math.floor(workValue)}。小麥把最後一份進度送出，終於能去甜點店了。
            </Text>
            <Flex as="button" mt="7px" w="100%" h="48px" borderRadius="13px" bgColor="#4E8D7C" color="white" alignItems="center" justifyContent="center" onClick={onComplete}>
              <Text fontSize="14px" fontWeight="900">下班，前往甜點店</Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

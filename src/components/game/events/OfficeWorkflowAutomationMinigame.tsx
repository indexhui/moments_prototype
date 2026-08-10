"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiBell,
  FiCheck,
  FiDroplet,
  FiFileText,
  FiLock,
  FiPlay,
  FiRefreshCw,
  FiSettings,
  FiShield,
  FiStar,
  FiThermometer,
  FiTool,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";

type FactoryPhase = "intro" | "playing" | "upgrade" | "complete";
type Lane = "left" | "right";
type PacketKind = "normal" | "urgent" | "glitch" | "spark";
type UpgradeId = "router" | "scrubber" | "cooling";

type DataPacket = {
  id: number;
  kind: PacketKind;
  repaired: boolean;
  boosted: boolean;
};

type FactoryUpgrade = {
  id: UpgradeId;
  name: string;
  eyebrow: string;
  description: string;
  unlockAt: number;
  color: string;
};

const TARGET_OUTPUT = 30;

const PACKET_SEQUENCE: readonly PacketKind[] = [
  "normal", "urgent", "normal", "glitch", "urgent", "spark",
  "normal", "urgent", "glitch", "normal", "spark", "urgent",
  "glitch", "normal", "urgent", "spark", "normal", "glitch",
  "urgent", "normal", "spark", "glitch", "urgent", "normal",
];

const UPGRADES: readonly FactoryUpgrade[] = [
  {
    id: "router",
    name: "自動分流器",
    eyebrow: "MODULE 01",
    description: "機器記住藍件與橘件的去向，之後會自己切換軌道。",
    unlockAt: 6,
    color: "#65B9A3",
  },
  {
    id: "scrubber",
    name: "錯誤清洗器",
    eyebrow: "MODULE 02",
    description: "紅色壞資料進站時自動修復，不再造成堵塞。",
    unlockAt: 14,
    color: "#E8795E",
  },
  {
    id: "cooling",
    name: "智慧散熱器",
    eyebrow: "MODULE 03",
    description: "機器會持續降溫，讓自動化產線能越跑越快。",
    unlockAt: 22,
    color: "#69AFC4",
  },
] as const;

const packetTravel = keyframes`
  0% { left: -10%; transform: translate(-50%, -50%) rotate(-5deg) scale(.86); }
  42% { left: 42%; transform: translate(-50%, -50%) rotate(2deg) scale(1); }
  68% { left: 58%; transform: translate(-50%, -50%) rotate(-2deg) scale(.93); }
  100% { left: 108%; transform: translate(-50%, -50%) rotate(4deg) scale(.82); }
`;

const beltMove = keyframes`
  from { background-position-x: 0; }
  to { background-position-x: 28px; }
`;

const machineBreathe = keyframes`
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-3px); }
`;

const machineHit = keyframes`
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-50%, -50%) rotate(-2deg); }
  55% { transform: translate(-50%, -50%) rotate(2deg); }
  78% { transform: translate(-50%, -50%) rotate(-1deg); }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const noticePop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 12px) scale(.86); }
  18%, 78% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -8px) scale(.96); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,.18); }
  50% { box-shadow: 0 0 0 7px rgba(255,255,255,0); }
`;

const sparkSpin = keyframes`
  from { transform: rotate(-8deg) scale(.92); }
  to { transform: rotate(8deg) scale(1.08); }
`;

function PacketIcon({ kind, size = 18 }: { kind: PacketKind; size?: number }) {
  if (kind === "urgent") return <FiBell size={size} />;
  if (kind === "glitch") return <FiAlertTriangle size={size} />;
  if (kind === "spark") return <FiStar size={size} />;
  return <FiFileText size={size} />;
}

function packetMeta(kind: PacketKind) {
  if (kind === "urgent") return { label: "急件", color: "#EF7D58", dark: "#8B4735", instruction: "撥到右線" };
  if (kind === "glitch") return { label: "壞資料", color: "#D95E62", dark: "#7F373E", instruction: "拍一下修復" };
  if (kind === "spark") return { label: "靈感包", color: "#9B79C7", dark: "#5B4479", instruction: "拍一下加倍" };
  return { label: "普通件", color: "#69AFC4", dark: "#3A6979", instruction: "撥到左線" };
}

function UpgradeIcon({ id, size = 18 }: { id: UpgradeId; size?: number }) {
  if (id === "router") return <FiTrendingUp size={size} />;
  if (id === "scrubber") return <FiShield size={size} />;
  return <FiDroplet size={size} />;
}

export function OfficeWorkflowAutomationMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<FactoryPhase>("intro");
  const [packet, setPacket] = useState<DataPacket | null>(null);
  const [lane, setLane] = useState<Lane>("left");
  const [output, setOutput] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [heat, setHeat] = useState(8);
  const [jammed, setJammed] = useState(false);
  const [misses, setMisses] = useState(0);
  const [unlocked, setUnlocked] = useState<Record<UpgradeId, boolean>>({ router: false, scrubber: false, cooling: false });
  const [pendingUpgrade, setPendingUpgrade] = useState<FactoryUpgrade | null>(null);
  const [notice, setNotice] = useState<{ id: number; text: string; good: boolean } | null>(null);
  const [impactNonce, setImpactNonce] = useState(0);

  const packetIndexRef = useRef(0);
  const packetIdRef = useRef(0);
  const packetRef = useRef<DataPacket | null>(null);
  const laneRef = useRef<Lane>(lane);
  const outputRef = useRef(output);
  const comboRef = useRef(combo);
  const heatRef = useRef(heat);
  const unlockedRef = useRef(unlocked);
  const noticeIdRef = useRef(0);

  useEffect(() => { laneRef.current = lane; }, [lane]);
  useEffect(() => { unlockedRef.current = unlocked; }, [unlocked]);

  const showNotice = useCallback((text: string, good = true) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, text, good });
  }, []);

  const setActivePacket = useCallback((next: DataPacket | null) => {
    packetRef.current = next;
    setPacket(next);
  }, []);

  const updateHeat = useCallback((nextHeat: number) => {
    const clamped = Math.max(0, Math.min(100, nextHeat));
    heatRef.current = clamped;
    setHeat(clamped);
    if (clamped >= 92) {
      setJammed(true);
      setImpactNonce((value) => value + 1);
      showNotice("產線過熱！快按 COOL 降溫", false);
    }
  }, [showNotice]);

  const installUpgrade = useCallback((upgrade: FactoryUpgrade) => {
    const next = { ...unlockedRef.current, [upgrade.id]: true };
    unlockedRef.current = next;
    setUnlocked(next);
    setPendingUpgrade(upgrade);
    setPhase("upgrade");
  }, []);

  const resolvePacket = useCallback((packetId: number) => {
    const active = packetRef.current;
    if (!active || active.id !== packetId || phase !== "playing") return;

    const expectedLane: Lane | null = active.kind === "normal" ? "left" : active.kind === "urgent" ? "right" : null;
    const routeCorrect = expectedLane === null || unlockedRef.current.router || laneRef.current === expectedLane;
    const errorClean = active.kind !== "glitch" || active.repaired || unlockedRef.current.scrubber;
    const success = routeCorrect && errorClean;
    setActivePacket(null);

    if (!success) {
      comboRef.current = 0;
      setCombo(0);
      setMisses((value) => value + 1);
      updateHeat(heatRef.current + (errorClean ? 15 : 22));
      setImpactNonce((value) => value + 1);
      showNotice(!errorClean ? "壞資料卡住齒輪了！" : `送錯出口！${expectedLane === "left" ? "藍件要往左" : "橘件要往右"}`, false);
      return;
    }

    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    setCombo(nextCombo);
    setBestCombo((value) => Math.max(value, nextCombo));
    const gained = 10 + Math.min(nextCombo, 8) * 2 + (active.boosted ? 24 : 0);
    setScore((value) => value + gained);
    const nextOutput = outputRef.current + 1;
    outputRef.current = nextOutput;
    setOutput(nextOutput);
    updateHeat(heatRef.current + (active.kind === "spark" ? 9 : 6));
    showNotice(active.boosted ? `靈感加倍！＋${gained}` : `順利出貨・COMBO ${nextCombo}`);

    const upgrade = UPGRADES.find((item) => item.unlockAt === nextOutput);
    if (upgrade) {
      installUpgrade(upgrade);
      return;
    }
    if (nextOutput >= TARGET_OUTPUT) setPhase("complete");
  }, [installUpgrade, phase, setActivePacket, showNotice, updateHeat]);

  useEffect(() => {
    if (phase !== "playing" || packet || jammed) return;
    const timer = window.setTimeout(() => {
      packetIdRef.current += 1;
      const kind = PACKET_SEQUENCE[packetIndexRef.current % PACKET_SEQUENCE.length];
      packetIndexRef.current += 1;
      const next: DataPacket = {
        id: packetIdRef.current,
        kind,
        repaired: kind === "glitch" && unlockedRef.current.scrubber,
        boosted: false,
      };
      setActivePacket(next);
    }, 520);
    return () => window.clearTimeout(timer);
  }, [jammed, packet, phase, setActivePacket]);

  const activePacketId = packet?.id;

  useEffect(() => {
    if (phase !== "playing" || activePacketId === undefined) return;
    const timer = window.setTimeout(() => resolvePacket(activePacketId), 1900);
    return () => window.clearTimeout(timer);
  }, [activePacketId, phase, resolvePacket]);

  useEffect(() => {
    if (phase !== "playing" || !unlocked.cooling) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, heatRef.current - 3);
      heatRef.current = next;
      setHeat(next);
      if (next <= 70) setJammed(false);
    }, 700);
    return () => window.clearInterval(timer);
  }, [phase, unlocked.cooling]);

  const tapPacket = useCallback(() => {
    const active = packetRef.current;
    if (!active) return;
    if (active.kind === "glitch") {
      if (unlockedRef.current.scrubber || active.repaired) return;
      const next = { ...active, repaired: true };
      setActivePacket(next);
      showNotice("錯誤已清掉，繼續跑！");
      return;
    }
    if (active.kind === "spark") {
      if (active.boosted) return;
      const next = { ...active, boosted: true };
      setActivePacket(next);
      showNotice("靈感包充能成功・獎勵加倍！");
    }
  }, [setActivePacket, showNotice]);

  const coolMachine = useCallback(() => {
    const next = Math.max(0, heatRef.current - 30);
    heatRef.current = next;
    setHeat(next);
    if (next <= 70) setJammed(false);
    showNotice(jammed ? "堵塞解除，產線重新啟動！" : "嘶——機器舒服多了");
  }, [jammed, showNotice]);

  const currentMeta = packet ? packetMeta(packet.kind) : null;
  const progress = Math.min(100, (output / TARGET_OUTPUT) * 100);
  const nextUpgrade = useMemo(() => UPGRADES.find((item) => !unlocked[item.id]), [unlocked]);
  const instruction = jammed
    ? "機器過熱停機！連按 COOL 降到 70 以下"
    : packet?.kind === "glitch"
      ? unlocked.scrubber ? "錯誤清洗器正在自動修復" : packet.repaired ? "修好了！等它通過機器" : "紅色壞資料來了，直接拍它！"
      : packet?.kind === "spark"
        ? packet.boosted ? "加倍成功！" : "紫色靈感包來了，直接拍它！"
        : packet && unlocked.router
          ? "自動分流器正在判斷出口"
          : packet?.kind === "urgent"
            ? "橘色急件 → 撥到右線"
            : packet?.kind === "normal"
              ? "藍色普通件 → 撥到左線"
              : "下一包資料正在進站…";

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#E9E5D8" color="#263D3B" data-office-workflow-automation={phase}>
      <Box position="absolute" inset="0" bg="radial-gradient(circle at 50% 27%, rgba(255,255,255,.92), transparent 42%), linear-gradient(180deg, #F4F0E4 0%, #D9E2D9 100%)" />
      <Box position="absolute" inset="0" opacity={0.2} bgImage="linear-gradient(#78938C 1px, transparent 1px), linear-gradient(90deg, #78938C 1px, transparent 1px)" bgSize="24px 24px" />

      <Flex position="relative" zIndex={10} h="66px" flexShrink={0} alignItems="center" justifyContent="space-between" gap="8px" px="12px" borderBottom="3px solid #274845" bgColor="#FCFAF1">
        <Flex minW="0" alignItems="center" gap="8px">
          <Flex w="40px" h="40px" flexShrink={0} alignItems="center" justifyContent="center" border="3px solid #294D49" borderRadius="10px" bgColor="#68B39B" color="white" boxShadow="0 4px 0 #294D49"><FiSettings size={22} /></Flex>
          <Flex minW="0" direction="column">
            <Text color="#DE6E52" fontSize="8px" fontWeight="900" letterSpacing=".14em">FLOW FACTORY・SHIFT 06</Text>
            <Text fontSize="17px" fontWeight="900" lineHeight="1.05">自動化資料工廠</Text>
            <Text mt="3px" color="#71807B" fontSize="8px" fontWeight="800">分流・修復・散熱・讓產線自己跑</Text>
          </Flex>
        </Flex>
        <Flex gap="5px" flexShrink={0}>
          <Flex minW="47px" h="41px" direction="column" alignItems="center" justifyContent="center" border="2px solid #AEBBB5" borderRadius="8px" bgColor="#E7F2EA"><Text color="#728078" fontSize="7px" fontWeight="900">出貨</Text><Text fontSize="15px" fontWeight="900" lineHeight="1">{output}<Text as="span" color="#80908A" fontSize="8px">/{TARGET_OUTPUT}</Text></Text></Flex>
          <Flex minW="48px" h="41px" direction="column" alignItems="center" justifyContent="center" border="2px solid #D2B35D" borderRadius="8px" bgColor="#FFF0AF"><Text color="#8B722E" fontSize="7px" fontWeight="900">產值</Text><Text color="#5A4C26" fontSize="14px" fontWeight="900" lineHeight="1">{score}</Text></Flex>
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={9} h="60px" flexShrink={0} alignItems="center" gap="6px" px="9px" borderBottom="2px solid #91A49E" bgColor="rgba(223,231,221,.96)">
        {UPGRADES.map((upgrade) => {
          const isUnlocked = unlocked[upgrade.id];
          return (
            <Flex key={upgrade.id} flex="1" minW="0" h="45px" alignItems="center" gap="6px" px="7px" border={`2px solid ${isUnlocked ? upgrade.color : "#ABB7B1"}`} borderRadius="8px" bgColor={isUnlocked ? "#FFFCF1" : "rgba(191,200,194,.42)"} color={isUnlocked ? "#31534C" : "#89938F"} boxShadow={isUnlocked ? `0 3px 0 ${upgrade.color}` : "none"}>
              <Flex w="25px" h="25px" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="6px" bgColor={isUnlocked ? upgrade.color : "#AAB4AF"} color="white">{isUnlocked ? <UpgradeIcon id={upgrade.id} size={14} /> : <FiLock size={12} />}</Flex>
              <Flex minW="0" direction="column"><Text fontSize="7px" fontWeight="900" lineClamp={1}>{upgrade.name}</Text><Text mt="2px" fontSize="6px" fontWeight="800">{isUnlocked ? "ONLINE" : `${upgrade.unlockAt} 件解鎖`}</Text></Flex>
            </Flex>
          );
        })}
      </Flex>

      <Flex position="relative" zIndex={3} flex="1" minH="0" direction="column" px="9px" pt="8px">
        <Flex h="38px" flexShrink={0} alignItems="center" justifyContent="space-between" gap="8px" px="10px" border="3px solid #314F4C" borderRadius="9px 9px 0 0" bgColor="#274440" color="white">
          <Flex minW="0" alignItems="center" gap="7px"><Box w="8px" h="8px" flexShrink={0} borderRadius="999px" bgColor={jammed ? "#F06C62" : packet ? "#81D5AD" : "#F3C85A"} boxShadow="0 0 10px currentColor" /><Text minW="0" fontSize="9px" fontWeight="900" lineClamp={1}>{instruction}</Text></Flex>
          <Flex flexShrink={0} alignItems="center" gap="4px" color="#FFD879"><FiZap size={12} /><Text fontSize="9px" fontWeight="900">x{Math.max(1, combo)}</Text></Flex>
        </Flex>

        <Box position="relative" flex="1" minH="355px" borderX="3px solid #314F4C" borderBottom="3px solid #314F4C" borderRadius="0 0 12px 12px" bgColor="#D7DDD3" overflow="hidden">
          <Box position="absolute" inset="0" opacity={0.36} bgImage="linear-gradient(90deg, rgba(61,82,78,.14) 1px, transparent 1px)" bgSize="18px 18px" />
          <Box position="absolute" left="0" right="0" top="52%" h="54px" borderY="4px solid #2E4947" bgColor="#536562" bgImage="repeating-linear-gradient(90deg, #435653 0 18px, #697875 18px 22px)" animation={`${beltMove} 800ms linear infinite`} transform="translateY(-50%)" />

          <Flex position="absolute" left="5px" top="12px" minW="73px" h="43px" direction="column" justifyContent="center" px="8px" border="2px solid #75938A" borderRadius="7px" bgColor="rgba(255,253,243,.9)"><Text color="#75827E" fontSize="6px" fontWeight="900">ROUTE GATE</Text><Flex mt="2px" alignItems="center" gap="4px" color={lane === "left" ? "#4A91AA" : "#E67754"}>{lane === "left" ? <FiArrowLeft size={13} /> : <FiArrowRight size={13} />}<Text fontSize="10px" fontWeight="900">{unlocked.router ? "AUTO" : lane === "left" ? "LEFT" : "RIGHT"}</Text></Flex></Flex>
          <Flex position="absolute" right="5px" top="12px" minW="75px" h="43px" direction="column" justifyContent="center" px="8px" border={`2px solid ${heat >= 75 ? "#D76558" : "#75938A"}`} borderRadius="7px" bgColor="rgba(255,253,243,.9)"><Flex alignItems="center" gap="4px" color={heat >= 75 ? "#D76558" : "#56746D"}><FiThermometer size={12} /><Text fontSize="9px" fontWeight="900">{Math.round(heat)}°</Text></Flex><Box mt="4px" w="59px" h="5px" borderRadius="999px" bgColor="#CBD3CE" overflow="hidden"><Box w={`${heat}%`} h="100%" bgColor={heat >= 75 ? "#E46659" : heat >= 48 ? "#EDB94E" : "#68B9A2"} /></Box></Flex>

          <Image key={impactNonce} src="/images/work/workflow-factory/automation-machine.png" alt="自動化資料工廠機器" position="absolute" zIndex={3} left="50%" top="55%" w="min(362px, 102%)" maxW="none" transform="translate(-50%, -50%)" filter={jammed ? "saturate(.72) drop-shadow(0 8px 7px rgba(37,60,57,.28))" : "drop-shadow(0 9px 8px rgba(37,60,57,.23))"} animation={impactNonce > 0 ? `${machineHit} 360ms ease` : `${machineBreathe} 1800ms ease-in-out infinite`} pointerEvents="none" />

          {packet && currentMeta ? (
            <Flex key={packet.id} as="button" position="absolute" zIndex={6} left="-10%" top="52%" w="65px" h="51px" direction="column" alignItems="center" justifyContent="center" border={`3px solid ${currentMeta.dark}`} borderRadius="9px" bgColor={packet.repaired && packet.kind === "glitch" ? "#70B994" : currentMeta.color} color="white" boxShadow={`0 5px 0 ${currentMeta.dark}, 0 0 16px ${currentMeta.color}`} animation={`${packetTravel} 1900ms linear forwards, ${pulse} 700ms ease-in-out infinite`} onClick={tapPacket} aria-label={currentMeta.instruction}>
              <Box animation={packet.kind === "spark" && !packet.boosted ? `${sparkSpin} 340ms ease-in-out infinite alternate` : undefined}>{packet.repaired || packet.boosted ? <FiCheck size={18} /> : <PacketIcon kind={packet.kind} size={18} />}</Box>
              <Text mt="3px" fontSize="8px" fontWeight="900">{packet.repaired ? "已修復" : packet.boosted ? "×2 加倍" : currentMeta.label}</Text>
            </Flex>
          ) : null}

          <Flex position="absolute" zIndex={7} left="7px" bottom="9px" gap="5px">
            <Flex h="34px" alignItems="center" gap="5px" px="8px" border="2px solid #487064" borderRadius="7px" bgColor="#F8F8EF"><FiCheck size={12} /><Text fontSize="8px" fontWeight="900">連續 {combo}</Text></Flex>
            <Flex h="34px" alignItems="center" gap="5px" px="8px" border="2px solid #9C8077" borderRadius="7px" bgColor="#F8F8EF"><FiAlertTriangle size={12} /><Text fontSize="8px" fontWeight="900">堵塞 {misses}</Text></Flex>
          </Flex>
          <Flex position="absolute" zIndex={7} right="7px" bottom="9px" h="34px" alignItems="center" gap="5px" px="8px" border="2px solid #9B8650" borderRadius="7px" bgColor="#FFF3BF"><FiTool size={12} /><Text fontSize="8px" fontWeight="900">{nextUpgrade ? `再 ${nextUpgrade.unlockAt - output} 件升級` : "全模組運轉"}</Text></Flex>

          {jammed ? <Flex position="absolute" inset="0" zIndex={8} direction="column" alignItems="center" justifyContent="center" bgColor="rgba(111,47,43,.28)" pointerEvents="none"><Flex alignItems="center" gap="7px" px="15px" py="9px" border="3px solid #853F39" borderRadius="9px" bgColor="#F17869" color="white" boxShadow="0 5px 0 #853F39"><FiAlertTriangle size={18} /><Text fontSize="11px" fontWeight="900">OVERHEAT・產線停機</Text></Flex></Flex> : null}
        </Box>
      </Flex>

      <Flex position="relative" zIndex={12} h="161px" flexShrink={0} direction="column" px="9px" pt="7px" pb="9px" borderTop="2px solid #91A49E" bgColor="rgba(249,247,237,.98)">
        <Flex h="31px" alignItems="center" gap="8px">
          <Text flexShrink={0} color="#596D67" fontSize="8px" fontWeight="900">SHIFT PROGRESS</Text>
          <Box flex="1" h="10px" border="2px solid #738780" borderRadius="999px" bgColor="#D7DFD9" overflow="hidden"><Box h="100%" w={`${progress}%`} bg="linear-gradient(90deg, #66B79E, #F0BD50)" transition="width 240ms ease" /></Box>
          <Text flexShrink={0} fontSize="9px" fontWeight="900">{Math.round(progress)}%</Text>
        </Flex>
        <Grid flex="1" templateColumns="1fr 1fr 1.08fr" gap="7px">
          <Flex as="button" minW="0" direction="column" alignItems="center" justifyContent="center" gap="5px" border={`3px solid ${lane === "left" && !unlocked.router ? "#315C6A" : "#879A95"}`} borderRadius="10px" bgColor={lane === "left" && !unlocked.router ? "#68ABC0" : "#E0E5DE"} color={lane === "left" && !unlocked.router ? "white" : "#58706A"} boxShadow={lane === "left" && !unlocked.router ? "0 5px 0 #315C6A" : "0 4px 0 #879A95"} opacity={unlocked.router ? .48 : 1} onClick={() => !unlocked.router && setLane("left")}><FiArrowLeft size={25} /><Text fontSize="10px" fontWeight="900">藍件 LEFT</Text></Flex>
          <Flex as="button" minW="0" direction="column" alignItems="center" justifyContent="center" gap="5px" border={`3px solid ${lane === "right" && !unlocked.router ? "#8B4935" : "#879A95"}`} borderRadius="10px" bgColor={lane === "right" && !unlocked.router ? "#E87A57" : "#E0E5DE"} color={lane === "right" && !unlocked.router ? "white" : "#58706A"} boxShadow={lane === "right" && !unlocked.router ? "0 5px 0 #8B4935" : "0 4px 0 #879A95"} opacity={unlocked.router ? .48 : 1} onClick={() => !unlocked.router && setLane("right")}><FiArrowRight size={25} /><Text fontSize="10px" fontWeight="900">急件 RIGHT</Text></Flex>
          <Flex as="button" minW="0" direction="column" alignItems="center" justifyContent="center" gap="5px" border="3px solid #376777" borderRadius="10px" bgColor="#69AFC4" color="white" boxShadow="0 5px 0 #376777" animation={jammed ? `${pulse} 520ms ease-in-out infinite` : undefined} onClick={coolMachine}><FiDroplet size={25} /><Text fontSize="10px" fontWeight="900">COOL 降溫</Text><Text color="rgba(255,255,255,.78)" fontSize="7px" fontWeight="800">一次 −30°</Text></Flex>
        </Grid>
      </Flex>

      {notice ? <Flex key={notice.id} position="absolute" zIndex={80} left="50%" bottom="166px" minH="35px" maxW="315px" alignItems="center" gap="6px" px="11px" border={`2px solid ${notice.good ? "#356F5A" : "#863F3C"}`} borderRadius="8px" bgColor={notice.good ? "#3F9072" : "#D65F58"} color="white" boxShadow="0 6px 14px rgba(43,64,59,.3)" animation={`${noticePop} 1550ms ease both`} pointerEvents="none"><Text fontSize="9px" fontWeight="900">{notice.text}</Text></Flex> : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={120} alignItems="center" justifyContent="center" px="18px" bgColor="rgba(31,48,45,.8)" backdropFilter="blur(5px)">
          <Flex w="100%" maxH="94%" direction="column" alignItems="center" p="18px" border="4px solid #294C47" borderRadius="15px" bgColor="#FCF8E9" textAlign="center" boxShadow="8px 9px 0 rgba(31,43,40,.58)" animation={`${panelIn} 260ms ease both`}>
            <Image src="/images/work/workflow-factory/automation-machine.png" alt="資料自動化工廠" w="210px" maxH="184px" objectFit="contain" filter="drop-shadow(0 8px 6px rgba(42,68,62,.22))" />
            <Text mt="-5px" color="#DD6F53" fontSize="9px" fontWeight="900" letterSpacing=".16em">辦公遊戲方案 6</Text>
            <Text mt="3px" fontSize="24px" fontWeight="900">把混亂餵進機器</Text>
            <Text mt="8px" color="#687A74" fontSize="10px" fontWeight="800" lineHeight="1.55">資料包會不停從輸送帶進站。先親手分流、修錯與散熱；產線跑得越順，機器就會學會你的動作，逐步變成全自動。</Text>
            <Grid mt="12px" w="100%" templateColumns="repeat(4, 1fr)" gap="5px">
              {[
                { color: "#68ABC0", icon: <FiArrowLeft size={17} />, label: "藍件撥左" },
                { color: "#E87A57", icon: <FiArrowRight size={17} />, label: "急件撥右" },
                { color: "#D95E62", icon: <FiAlertTriangle size={17} />, label: "紅件拍掉" },
                { color: "#69AFC4", icon: <FiDroplet size={17} />, label: "過熱降溫" },
              ].map((item) => <Flex key={item.label} h="61px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px solid #9AACA5" borderRadius="8px" bgColor={item.color} color="white">{item.icon}<Text fontSize="7px" fontWeight="900">{item.label}</Text></Flex>)}
            </Grid>
            <Flex as="button" mt="15px" w="100%" h="48px" flexShrink={0} alignItems="center" justifyContent="center" gap="8px" border="3px solid #2B5B50" borderRadius="9px" bgColor="#58A98D" color="white" boxShadow="0 5px 0 #2B5B50" onClick={() => setPhase("playing")}><FiPlay size={17} fill="currentColor" /><Text fontSize="13px" fontWeight="900">啟動輸送帶</Text></Flex>
            <Text as="button" mt="10px" color="#87928E" fontSize="9px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "upgrade" && pendingUpgrade ? (
        <Flex position="absolute" inset="0" zIndex={125} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(28,44,41,.82)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" p="21px" border="4px solid #31534D" borderRadius="15px" bgColor="#FFF9E9" textAlign="center" boxShadow="8px 9px 0 rgba(27,39,36,.58)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="74px" h="74px" alignItems="center" justifyContent="center" border="4px solid #31534D" borderRadius="18px" bgColor={pendingUpgrade.color} color="white" boxShadow="0 6px 0 #31534D, 0 0 28px rgba(255,221,112,.58)"><UpgradeIcon id={pendingUpgrade.id} size={36} /></Flex>
            <Text mt="15px" color="#D16C50" fontSize="9px" fontWeight="900" letterSpacing=".16em">{pendingUpgrade.eyebrow} INSTALLED</Text>
            <Text mt="4px" fontSize="24px" fontWeight="900">{pendingUpgrade.name}上線！</Text>
            <Text mt="9px" color="#6F7D77" fontSize="11px" fontWeight="800" lineHeight="1.6">{pendingUpgrade.description}</Text>
            <Flex mt="14px" w="100%" alignItems="center" gap="8px" p="10px" border="2px solid #C5B15E" borderRadius="9px" bgColor="#FFF0B3"><FiZap size={17} /><Text textAlign="left" fontSize="9px" fontWeight="900">你剛才手動完成的工作，現在由機器接手。下一階段會加入新的忙亂！</Text></Flex>
            <Flex as="button" mt="17px" w="100%" h="48px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #2B5B50" borderRadius="9px" bgColor="#58A98D" color="white" boxShadow="0 5px 0 #2B5B50" onClick={() => { setPendingUpgrade(null); setPhase("playing"); }}><FiPlay size={17} /><Text fontSize="13px" fontWeight="900">裝上模組，繼續出貨</Text></Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={130} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(27,42,39,.84)" backdropFilter="blur(6px)">
          <Flex w="100%" direction="column" alignItems="center" p="22px" border="4px solid #31534D" borderRadius="15px" bgColor="#FFF9E9" textAlign="center" boxShadow="8px 9px 0 rgba(24,36,33,.62)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="76px" h="76px" alignItems="center" justifyContent="center" border="4px solid #31534D" borderRadius="999px" bgColor="#F1C45A" color="#31534D" boxShadow="0 6px 0 #31534D"><FiZap size={38} /></Flex>
            <Text mt="15px" color="#D16C50" fontSize="9px" fontWeight="900" letterSpacing=".16em">FULL AUTOMATION ONLINE</Text>
            <Text mt="4px" fontSize="25px" fontWeight="900">混亂，變成一條產線</Text>
            <Text mt="8px" color="#6D7A75" fontSize="11px" fontWeight="800" lineHeight="1.55">完成 {output} 件出貨、創造 {score} 產值。最長連續成功 {bestCombo} 件，過程中排除 {misses} 次堵塞。</Text>
            <Grid mt="14px" w="100%" templateColumns="repeat(3, 1fr)" gap="7px">
              {UPGRADES.map((upgrade) => <Flex key={upgrade.id} h="75px" direction="column" alignItems="center" justifyContent="center" gap="6px" border={`2px solid ${upgrade.color}`} borderRadius="9px" bgColor="#FFFEF6" color="#35554E"><UpgradeIcon id={upgrade.id} size={21} /><Text fontSize="8px" fontWeight="900">{upgrade.name}</Text><Text color="#6BA18F" fontSize="6px" fontWeight="900">RUNNING</Text></Flex>)}
            </Grid>
            <Flex mt="13px" alignItems="center" gap="6px" color="#47776A"><FiRefreshCw size={14} /><Text fontSize="10px" fontWeight="900">分流、修復與散熱都已自動循環</Text></Flex>
            <Flex as="button" mt="18px" w="100%" h="49px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #2B5B50" borderRadius="9px" bgColor="#58A98D" color="white" boxShadow="0 5px 0 #2B5B50" onClick={onComplete}><FiCheck size={18} /><Text fontSize="13px" fontWeight="900">工廠交班，前往便利商店</Text></Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

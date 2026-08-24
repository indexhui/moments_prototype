"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiArrowUp,
  FiBookOpen,
  FiCheck,
  FiCoffee,
  FiCpu,
  FiEdit3,
  FiHeart,
  FiImage,
  FiLock,
  FiPlay,
  FiSend,
  FiStar,
  FiTrendingUp,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import { playGameSfx } from "@/lib/game/soundEffects";

type StudioPhase = "intro" | "playing" | "posting" | "complete";
type MaterialKind = "art" | "photo" | "news" | "video";
type MaterialQuality = "normal" | "premium";
type SupportKind = "coffee" | "bubbleTea" | "energyDrink";
type SkillBranch = "ai" | "quality" | "support";

type Material = {
  id: number;
  kind: MaterialKind;
  quality: MaterialQuality;
};

type RenderingMaterial = Material;

type FlyingMaterial = Material & {
  targetIndex: number;
};

type PopularityRewardFlight = {
  id: number;
  amount: number;
};

type SupportDrop = {
  id: number;
  kind: SupportKind;
};

type ActiveBoost = SupportDrop & {
  multiplier: number;
  critChance: number;
  remaining: number;
};

type MaterialStockItem = {
  kind: MaterialKind;
  quality: MaterialQuality;
  count: number;
};

type Campaign = {
  id: string;
  title: string;
  brief: string;
  recipe: readonly MaterialKind[];
  popularity: number;
  color: string;
};

const CAMPAIGNS: readonly Campaign[] = [
  { id: "morning", title: "早晨限定", brief: "一張新鮮的商品相片", recipe: ["photo"], popularity: 12, color: "#50A8C6" },
  { id: "visual", title: "本週主視覺", brief: "一份醒目的美術素材", recipe: ["art"], popularity: 16, color: "#E78950" },
  { id: "news", title: "新品快訊", brief: "新聞內容搭配商品相片", recipe: ["news", "photo"], popularity: 22, color: "#5D9B79" },
  { id: "reel", title: "週末短影音", brief: "影片搭配美術封面", recipe: ["video", "art"], popularity: 28, color: "#8F71BE" },
  { id: "collab", title: "青蛙店長聯名", brief: "相片與影片共同曝光", recipe: ["photo", "video"], popularity: 36, color: "#68A577" },
  { id: "final", title: "本季主打貼文", brief: "新聞與美術完成最後 Campaign", recipe: ["news", "art"], popularity: 48, color: "#D29843" },
] as const;

const MATERIAL_META: Record<MaterialKind, { code: string; label: string; color: string; dark: string }> = {
  art: { code: "ART", label: "美術", color: "#EE8A51", dark: "#82462C" },
  photo: { code: "IMG", label: "相片", color: "#4FA7C8", dark: "#2D6278" },
  news: { code: "NEWS", label: "新聞", color: "#5E9A7A", dark: "#315E49" },
  video: { code: "MP4", label: "影片", color: "#9272C1", dark: "#553E77" },
};

const MATERIAL_KINDS: readonly MaterialKind[] = ["art", "photo", "news", "video"];
const MATERIAL_SEQUENCE: readonly MaterialKind[] = ["photo", "art", "news", "video", "photo", "news", "art", "video"];
const AI_INTERVALS = [0, 3200, 2200, 1400] as const;
const QUALITY_CHANCES = [0, 0.12, 0.24, 0.38] as const;
const SUPPORT_CHANCES = [0, 0.04, 0.07, 0.1] as const;
const SKILL_COSTS: Record<SkillBranch, readonly number[]> = {
  ai: [8, 20, 42],
  quality: [10, 24, 48],
  support: [12, 28, 54],
};
const SUPPORT_META: Record<SupportKind, { emoji: string; label: string; multiplier: number; critChance: number; clicks: number; color: string }> = {
  coffee: { emoji: "☕", label: "COFFEE", multiplier: 1.5, critChance: 0.1, clicks: 10, color: "#B87549" },
  bubbleTea: { emoji: "🧋", label: "BOBA", multiplier: 1.75, critChance: 0.18, clicks: 8, color: "#A66B82" },
  energyDrink: { emoji: "🥤", label: "ENERGY", multiplier: 2, critChance: 0.3, clicks: 6, color: "#5B8FC8" },
};
const WORK_BUTTON_IMAGES = {
  ready: "/images/work/creator-studio/work-button-ready-v3.png",
  pressed: "/images/work/creator-studio/work-button-pressed-v3.png",
  bottomed: "/images/work/creator-studio/work-button-bottomed-v3.png",
} as const;

const MATERIAL_BUILD_STEPS: Record<MaterialKind, readonly string[]> = {
  art: [
    "等待 AI 繪圖指令…",
    "輸入風格與構圖 PROMPT…",
    "生成低解析構圖草稿…",
    "細化角色、色彩與光影…",
    "放大並去除畫面雜訊…",
    "EXPORT ART 素材…",
  ],
  photo: [
    "等待相片處理指令…",
    "連接商品相片來源…",
    "校正對焦與白平衡…",
    "裁切商品主體構圖…",
    "調整曝光、色彩與銳利度…",
    "EXPORT IMG 素材…",
  ],
  news: [
    "等待文案撰寫指令…",
    "建立貼文文案草稿…",
    "輸入標題與商品賣點…",
    "逐字校對語氣與錯字…",
    "套用社群貼文格式…",
    "EXPORT NEWS 文案…",
  ],
  video: [
    "等待影片剪輯指令…",
    "匯入商品影片片段…",
    "排列鏡頭剪輯時間軸…",
    "加入字幕、節奏與轉場…",
    "混音並預覽完整影片…",
    "RENDER MP4 素材…",
  ],
};

const buttonPress = keyframes`
  0% { transform: translateY(-6px); }
  44% { transform: translateY(7px) scale(.985); }
  100% { transform: translateY(-6px); }
`;

const buttonIdle = keyframes`
  0%, 100% { transform: translateY(-6px); }
  50% { transform: translateY(-9px); }
`;

const stockPop = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(.45) rotate(-9deg); }
  65% { opacity: 1; transform: translateY(-4px) scale(1.08) rotate(4deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
`;

const flyToFolderLeft = keyframes`
  0% { opacity: 1; transform: translate(-50%, 0) scale(1) rotate(-4deg); }
  28% { opacity: 1; transform: translate(calc(-50% + 24px), -145px) scale(1.05) rotate(5deg); }
  72% { opacity: 1; transform: translate(calc(-50% + 52px), -355px) scale(.76) rotate(-3deg); }
  100% { opacity: 0; transform: translate(calc(-50% + 66px), -470px) scale(.42) rotate(5deg); }
`;

const flyToFolderRight = keyframes`
  0% { opacity: 1; transform: translate(-50%, 0) scale(1) rotate(-4deg); }
  28% { opacity: 1; transform: translate(calc(-50% + 38px), -145px) scale(1.05) rotate(5deg); }
  72% { opacity: 1; transform: translate(calc(-50% + 98px), -355px) scale(.76) rotate(-3deg); }
  100% { opacity: 0; transform: translate(calc(-50% + 124px), -470px) scale(.42) rotate(5deg); }
`;

const iconGlint = keyframes`
  0%, 38% { opacity: 0; transform: translateX(-26px) skewX(-20deg); }
  55% { opacity: .72; }
  78%, 100% { opacity: 0; transform: translateX(45px) skewX(-20deg); }
`;

const artLive = keyframes`
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(7deg) translateY(-2px); }
`;

const photoLive = keyframes`
  0%, 100% { transform: perspective(80px) rotateY(-6deg); filter: brightness(1); }
  50% { transform: perspective(80px) rotateY(8deg); filter: brightness(1.22); }
`;

const newsLive = keyframes`
  0%, 100% { transform: rotate(-2deg) skewY(0); }
  50% { transform: rotate(2deg) skewY(-2deg); }
`;

const videoLive = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const postSlideRight = keyframes`
  0% { opacity: 0; transform: translateX(-8px) scale(.98) rotate(-.5deg); }
  14% { opacity: 1; transform: translateX(0) scale(1) rotate(0); }
  54% { opacity: 1; transform: translateX(0) scale(1) rotate(0); }
  76% { opacity: 1; transform: translateX(34%) scale(.98) rotate(1.2deg); }
  100% { opacity: 0; transform: translateX(118%) scale(.94) rotate(2.4deg); }
`;

const popularityHeartFly = keyframes`
  0% { opacity: 0; left: 74%; top: 21%; transform: translate(-50%, -50%) scale(.35) rotate(-14deg); }
  12% { opacity: 1; left: 70%; top: 19%; transform: translate(-50%, -50%) scale(1.08) rotate(8deg); }
  38% { opacity: 1; left: 51%; top: 17%; transform: translate(-50%, -50%) scale(.92) rotate(-7deg); }
  68% { opacity: 1; left: 27%; top: 13%; transform: translate(-50%, -50%) scale(.74) rotate(7deg); }
  88% { opacity: 1; left: 13%; top: 10%; transform: translate(-50%, -50%) scale(.58) rotate(-4deg); }
  100% { opacity: 0; left: 10%; top: 6%; transform: translate(-50%, -50%) scale(.34) rotate(0); }
`;

const popularityCollect = keyframes`
  0% { transform: scale(1) rotate(0); filter: brightness(1); }
  28% { transform: scale(1.09) rotate(-1deg); filter: brightness(1.18) drop-shadow(0 0 10px rgba(238,117,128,.62)); }
  48% { transform: scale(.97) rotate(1deg); filter: brightness(1.08); }
  70% { transform: scale(1.04) rotate(-.4deg); filter: brightness(1.14); }
  100% { transform: scale(1) rotate(0); filter: brightness(1); }
`;

const skillCorePulse = keyframes`
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.06); filter: brightness(1.22) drop-shadow(0 0 12px rgba(239,111,128,.7)); }
`;

const skillNodeReady = keyframes`
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.18) drop-shadow(0 0 9px currentColor); }
`;

const supportFlyIn = keyframes`
  0% { opacity: 0; transform: translate(145px, -65px) rotate(14deg) scale(.45); }
  55% { opacity: 1; transform: translate(-14px, 8px) rotate(-7deg) scale(1.08); }
  76% { transform: translate(7px, -4px) rotate(4deg) scale(.98); }
  100% { opacity: 1; transform: translate(0, 0) rotate(0) scale(1); }
`;

const supportHover = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(3deg); }
`;

const wingFlap = keyframes`
  0%, 100% { transform: rotate(-18deg) scaleY(.78); }
  50% { transform: rotate(13deg) scaleY(1.12); }
`;

const rareGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 2px rgba(255,215,96,.4)); }
  50% { filter: drop-shadow(0 0 13px rgba(255,215,96,.95)) brightness(1.16); }
`;

const critBurstIn = keyframes`
  0% { opacity: 0; transform: translate(-50%, 18px) scale(.5) rotate(-7deg); }
  42% { opacity: 1; transform: translate(-50%, -8px) scale(1.16) rotate(3deg); }
  100% { opacity: 0; transform: translate(-50%, -44px) scale(.9) rotate(-2deg); }
`;

const autoFingerTap = keyframes`
  0%, 100% { transform: translateY(0) rotate(180deg) scale(1); }
  42% { transform: translateY(8px) rotate(180deg) scale(.98); }
  62% { transform: translateY(31px) rotate(180deg) scale(.91); }
  78% { transform: translateY(27px) rotate(180deg) scale(.94); }
`;

const autoFingerHover = keyframes`
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -5px); }
`;

const pressCounterBump = keyframes`
  0% { transform: translateX(-50%) scale(.86); }
  52% { transform: translateX(-50%) scale(1.12); }
  100% { transform: translateX(-50%) scale(1); }
`;

const monitorBoot = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(.98); filter: brightness(.72); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
`;

const monitorScan = keyframes`
  0% { transform: translateY(-18px); opacity: 0; }
  14% { opacity: .42; }
  82% { opacity: .14; }
  100% { transform: translateY(160px); opacity: 0; }
`;

const consoleTypeIn = keyframes`
  0% { opacity: 0; transform: translateX(-5px); clip-path: inset(0 100% 0 0); }
  12% { opacity: 1; }
  100% { opacity: 1; transform: translateX(0); clip-path: inset(0 0 0 0); }
`;

const consoleCursorBlink = keyframes`
  0%, 46% { opacity: 1; }
  47%, 100% { opacity: 0; }
`;

const monitorPulse = keyframes`
  0%, 100% { border-color: #75DBE8; box-shadow: inset 0 0 18px rgba(51,208,230,.08); }
  50% { border-color: #D7FCFF; box-shadow: inset 0 0 26px rgba(51,208,230,.2), 0 0 18px rgba(53,210,232,.2); }
`;

const materialCompile = keyframes`
  0% { opacity: 0; transform: scale(.28) rotate(-10deg); filter: brightness(2.2) blur(5px); }
  35% { opacity: 1; transform: scale(1.14) rotate(4deg); filter: brightness(1.45) blur(0); }
  58% { opacity: 1; transform: scale(.96) rotate(-2deg); filter: brightness(1.1); }
  76% { opacity: 1; transform: scale(1.03) rotate(0); filter: brightness(1); }
  100% { opacity: 0; transform: translateY(-58px) scale(.46) rotate(5deg); filter: brightness(1.65); }
`;

const outputTrayFlash = keyframes`
  0%, 100% { opacity: .38; transform: scaleX(.84); }
  50% { opacity: 1; transform: scaleX(1); box-shadow: 0 0 16px rgba(111,225,239,.9); }
`;

const workDeskGlow = keyframes`
  0%, 100% { opacity: .2; transform: scale(.94); }
  50% { opacity: .42; transform: scale(1.03); }
`;

const aiCanvasNoise = keyframes`
  0% { background-position: 0 0, 0 0; filter: hue-rotate(0deg) brightness(.9); }
  50% { background-position: 13px -9px, -11px 7px; filter: hue-rotate(18deg) brightness(1.2); }
  100% { background-position: -8px 12px, 9px -13px; filter: hue-rotate(-8deg) brightness(1); }
`;

const aiShapeResolve = keyframes`
  0%, 100% { transform: scale(.88) rotate(-5deg); border-radius: 46% 54% 58% 42%; }
  50% { transform: scale(1.06) rotate(4deg); border-radius: 58% 42% 44% 56%; }
`;

const photoFocusScan = keyframes`
  0% { top: 9px; opacity: 0; }
  18% { opacity: .9; }
  82% { opacity: .58; }
  100% { top: 55px; opacity: 0; }
`;

const copyCursorMove = keyframes`
  0%, 38% { opacity: 1; }
  39%, 100% { opacity: 0; }
`;

const videoPlayhead = keyframes`
  0% { left: 5%; }
  100% { left: 91%; }
`;

function MaterialGlyph({ kind, size = 18 }: { kind: MaterialKind; size?: number }) {
  if (kind === "art") return <FiEdit3 size={size} />;
  if (kind === "photo") return <FiImage size={size} />;
  if (kind === "news") return <FiBookOpen size={size} />;
  return <FiVideo size={size} />;
}

function MaterialAppIcon({ kind, size = 62, premium = false }: { kind: MaterialKind; size?: number; premium?: boolean }) {
  const meta = MATERIAL_META[kind];
  const liveAnimation = kind === "art"
    ? `${artLive} 980ms ease-in-out infinite`
    : kind === "photo"
      ? `${photoLive} 1180ms ease-in-out infinite`
      : kind === "news"
        ? `${newsLive} 1080ms ease-in-out infinite`
        : `${videoLive} 880ms ease-in-out infinite`;
  const innerSize = Math.round(size * .72);
  return (
    <Flex position="relative" w={`${size}px`} h={`${size}px`} alignItems="center" justifyContent="center" border={`3px solid ${premium ? "#FFD968" : meta.dark}`} borderRadius={kind === "news" ? "8px" : "13px"} bg={`linear-gradient(145deg, rgba(255,255,255,.34), transparent 43%), ${meta.color}`} color="white" boxShadow={premium ? `0 7px 0 #9B7021, 0 0 14px rgba(255,217,104,.82), inset 0 3px 0 rgba(255,255,255,.45)` : `0 7px 0 ${meta.dark}, inset 0 3px 0 rgba(255,255,255,.34)`} animation={premium ? `${rareGlow} 900ms ease-in-out infinite` : liveAnimation} overflow="hidden">
      <Box position="absolute" zIndex={4} top="-6px" bottom="-6px" left="4px" w="12px" bgColor="rgba(255,255,255,.42)" animation={`${iconGlint} 1900ms ease-in-out infinite`} />
      <Box position="absolute" right="3px" top="3px" w="0" h="0" borderLeft={`${Math.max(8, size * .16)}px solid transparent`} borderTop={`${Math.max(8, size * .16)}px solid rgba(255,255,255,.68)`} />
      {premium ? <Flex position="absolute" zIndex={8} right="2px" bottom="2px" w={`${Math.max(15, size * .28)}px`} h={`${Math.max(15, size * .28)}px`} alignItems="center" justifyContent="center" border="2px solid #8B641D" borderRadius="999px" bgColor="#FFD968" color="#6E4C13"><FiStar size={Math.max(8, size * .15)} fill="currentColor" /></Flex> : null}
      {kind === "news" ? (
        <Flex w={`${innerSize}px`} h={`${innerSize + 3}px`} direction="column" px="5px" py="4px" border="1px solid rgba(34,72,55,.42)" borderRadius="3px" bgColor="#FFFDF1" color={meta.dark} boxShadow="4px 4px 0 rgba(26,62,45,.34)"><Text fontFamily="monospace" fontSize={`${Math.max(5, size * .09)}px`} fontWeight="900" lineHeight="1">NEWS</Text><Box mt="3px" w="100%" h="7px" bgColor={meta.color} /><Box mt="3px" w="100%" borderTop={`2px solid ${meta.dark}`} opacity={0.55} /><Box mt="3px" w="72%" borderTop={`2px solid ${meta.dark}`} opacity={0.4} /></Flex>
      ) : kind === "art" ? (
        <Flex position="relative" w={`${innerSize}px`} h={`${innerSize}px`} alignItems="center" justifyContent="center" border="1px solid rgba(105,51,28,.4)" borderRadius="7px" bgColor="#FFF6DF" color={meta.dark} boxShadow="4px 4px 0 rgba(101,51,29,.35)"><FiEdit3 size={Math.round(size * .42)} /><Box position="absolute" left="5px" bottom="5px" w={`${size * .22}px`} h="5px" borderRadius="999px" bgColor="#E66C55" /></Flex>
      ) : kind === "photo" ? (
        <Flex w={`${innerSize}px`} h={`${innerSize * .82}px`} alignItems="center" justifyContent="center" border="4px solid #F6FBF5" borderRadius="6px" bgColor="#3F90AE" boxShadow="4px 4px 0 rgba(26,75,94,.45)"><FiImage size={Math.round(size * .4)} /></Flex>
      ) : (
        <Flex position="relative" w={`${innerSize}px`} h={`${innerSize * .78}px`} alignItems="center" justifyContent="center" border="4px solid #F4EDFF" borderRadius="7px" bgColor="#7655A7" boxShadow="4px 4px 0 rgba(57,36,86,.48)"><FiVideo size={Math.round(size * .36)} /><Box position="absolute" right="-8px" top="28%" w="0" h="0" borderTop="8px solid transparent" borderBottom="8px solid transparent" borderLeft="10px solid #FFF" /></Flex>
      )}
    </Flex>
  );
}

function SkillTreeBranchNode({
  title,
  stat,
  level,
  cost,
  accent,
  icon,
  affordable,
  onClick,
}: {
  title: string;
  stat: string;
  level: number;
  cost: number | null;
  accent: string;
  icon: ReactNode;
  affordable: boolean;
  onClick: () => void;
}) {
  const maxed = level >= 3;
  return (
    <Flex as="button" position="relative" minW="0" direction="column" alignItems="center" color={accent} onClick={onClick}>
      <Box position="absolute" left="50%" top="-23px" w="4px" h="25px" bgColor={level > 0 ? accent : "#49565B"} boxShadow={level > 0 ? `0 0 9px ${accent}` : "none"} transform="translateX(-50%)" />
      <Flex position="relative" w="68px" h="68px" alignItems="center" justifyContent="center" border={`4px solid ${level > 0 || affordable ? accent : "#536167"}`} borderRadius="999px" bg={`radial-gradient(circle at 35% 28%, ${level > 0 ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.05)"}, transparent 34%), #26343A`} color={level > 0 || affordable ? accent : "#69767B"} boxShadow={level > 0 ? `0 0 0 5px #162126, 0 0 18px ${accent}` : "0 0 0 5px #162126"} animation={affordable && !maxed ? `${skillNodeReady} 1200ms ease-in-out infinite` : undefined}>
        {icon}
        <Flex position="absolute" right="-5px" bottom="-4px" minW="26px" h="22px" alignItems="center" justifyContent="center" px="4px" border="3px solid #152126" borderRadius="999px" bgColor={level > 0 ? accent : "#46545A"} color="#FFF"><Text fontFamily="monospace" fontSize="8px" fontWeight="900">{level}/3</Text></Flex>
      </Flex>
      <Text mt="10px" color="#F1F5F2" fontFamily="monospace" fontSize="9px" fontWeight="900" lineHeight="1.15">{title}</Text>
      <Text mt="4px" minH="20px" color={level > 0 ? accent : "#849196"} fontFamily="monospace" fontSize="7px" fontWeight="900" lineHeight="1.3">{stat}</Text>
      <Grid mt="6px" templateColumns="repeat(3, 12px)" gap="4px">
        {[0, 1, 2].map((tier) => <Box key={tier} h="6px" borderRadius="2px" bgColor={tier < level ? accent : "#435158"} boxShadow={tier < level ? `0 0 6px ${accent}` : "none"} />)}
      </Grid>
      <Flex mt="7px" minW="58px" h="25px" alignItems="center" justifyContent="center" gap="4px" px="7px" border={`2px solid ${maxed ? "#4D5A60" : affordable ? accent : "#69767B"}`} borderRadius="999px" bgColor="#172226" color={maxed ? "#7D898D" : affordable ? "#FFF" : "#8E999D"}>
        {maxed ? <Text fontFamily="monospace" fontSize="8px" fontWeight="900">MAX</Text> : <><FiHeart size={10} fill="currentColor" /><Text fontFamily="monospace" fontSize="9px" fontWeight="900">{cost}</Text></>}
      </Flex>
    </Flex>
  );
}

function WorkButtonArtwork({
  state,
  width = 220,
}: {
  state: keyof typeof WORK_BUTTON_IMAGES;
  width?: number;
}) {
  const height = Math.round(width * 166 / 319);
  const states = Object.keys(WORK_BUTTON_IMAGES) as Array<keyof typeof WORK_BUTTON_IMAGES>;
  return (
    <Box position="relative" w={`${width}px`} h={`${height}px`} pointerEvents="none" userSelect="none">
      {states.map((view) => (
        <Image key={view} src={WORK_BUTTON_IMAGES[view]} alt="" position="absolute" inset="0" w="100%" h="100%" objectFit="contain" opacity={view === state ? 1 : 0} visibility={view === state ? "visible" : "hidden"} draggable={false} />
      ))}
    </Box>
  );
}

function HeaderStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Flex h="60px" alignItems="center" gap="9px" px="13px" border="3px solid #323B3B" borderRadius="5px" bgColor="#FFF" boxShadow="0 5px 0 rgba(49,57,57,.4)">
      <Flex w="34px" h="34px" alignItems="center" justifyContent="center" borderRadius="999px" bgColor="#EE7580" color="white"><FiHeart size={19} fill="currentColor" /></Flex>
      <Flex direction="column"><Text color="#737B78" fontSize="8px" fontWeight="900">{label}</Text><Text mt="2px" fontSize="21px" fontWeight="900" lineHeight="1">{value}</Text></Flex>
      {icon}
    </Flex>
  );
}

function MaterialProcessPreview({
  kind,
  energy,
  renderingMaterial,
}: {
  kind: MaterialKind;
  energy: number;
  renderingMaterial: RenderingMaterial | null;
}) {
  const meta = MATERIAL_META[kind];
  const stage = Math.min(5, Math.ceil(energy / 20));
  const isWorking = stage > 0;

  return (
    <Flex position="relative" minW="0" direction="column" alignItems="center" justifyContent="center" border="2px solid rgba(110,213,227,.38)" borderRadius="7px" bgColor="rgba(28,51,56,.76)" overflow="hidden">
      <Flex position="absolute" zIndex={5} top="5px" left="7px" right="7px" alignItems="center" justifyContent="space-between">
        <Text color="#74BEC8" fontFamily="monospace" fontSize="5px" fontWeight="900">{kind === "art" ? "AI CANVAS" : kind === "photo" ? "PHOTO LAB" : kind === "news" ? "COPY EDITOR" : "VIDEO CUT"}</Text>
        <Text color={meta.color} fontFamily="monospace" fontSize="5px" fontWeight="900">{meta.code}</Text>
      </Flex>

      {renderingMaterial ? (
        <Box
          key={renderingMaterial.id}
          mt="8px"
          animation={`${materialCompile} 880ms cubic-bezier(.2,.75,.2,1) both`}
        >
          <MaterialAppIcon kind={kind} size={50} premium={renderingMaterial.quality === "premium"} />
        </Box>
      ) : kind === "art" ? (
        <Box position="relative" mt="10px" w="91px" h="69px" border="2px solid #A66B45" borderRadius="6px" bgColor="#E9C48E" boxShadow="0 4px 0 rgba(103,57,35,.42)" overflow="hidden" opacity={isWorking ? 1 : .38}>
          <Box position="absolute" inset="0" bg="repeating-linear-gradient(37deg, rgba(235,112,86,.34) 0 6px, rgba(92,193,207,.32) 6px 12px, rgba(247,213,111,.3) 12px 18px), repeating-linear-gradient(-42deg, transparent 0 5px, rgba(255,255,255,.28) 5px 9px)" bgSize="31px 27px, 23px 25px" animation={isWorking ? `${aiCanvasNoise} 520ms steps(4, end) infinite` : undefined} />
          {stage >= 2 ? <Box position="absolute" left="17px" top="17px" w="38px" h="35px" bg="linear-gradient(145deg, #F4D66F, #E26E64 58%, #5AB9C7)" border="2px solid rgba(73,49,40,.48)" animation={`${aiShapeResolve} 820ms ease-in-out infinite`} /> : null}
          {stage >= 3 ? <Flex position="absolute" right="8px" bottom="8px" w="26px" h="26px" alignItems="center" justifyContent="center" border="2px solid #62455E" borderRadius="999px" bgColor="#9D72B2" color="#FFF"><FiStar size={13} /></Flex> : null}
          <Flex position="absolute" left="5px" right="5px" bottom="4px" h="10px" alignItems="center" gap="3px" px="4px" borderRadius="3px" bgColor="rgba(31,40,40,.76)" color="#DFFBFA"><FiCpu size={6} /><Text fontFamily="monospace" fontSize="4px" fontWeight="900">PROMPT {stage}/5</Text></Flex>
        </Box>
      ) : kind === "photo" ? (
        <Box position="relative" mt="10px" w="91px" h="69px" border="2px solid #5D9AB0" borderRadius="6px" bg="linear-gradient(145deg, #1E5367, #3A8DA8 58%, #99D6D9)" boxShadow="0 4px 0 rgba(24,64,79,.48)" overflow="hidden" opacity={isWorking ? 1 : .38}>
          <Box position="absolute" inset="8px" border="1px dashed rgba(233,255,255,.78)" borderRadius="4px" />
          <Flex position="absolute" inset="0" alignItems="center" justifyContent="center" color="#F2FFFF"><FiImage size={stage >= 3 ? 30 : 24} /></Flex>
          {isWorking ? <Box position="absolute" left="7px" right="7px" top="9px" h="2px" bgColor="#D8FFFF" boxShadow="0 0 9px #D8FFFF" animation={`${photoFocusScan} 1000ms ease-in-out infinite`} /> : null}
          <Flex position="absolute" left="5px" right="5px" bottom="4px" justifyContent="space-between" color="#E8FFFF" fontFamily="monospace"><Text fontSize="4px" fontWeight="900">AF {stage >= 2 ? "LOCK" : "SCAN"}</Text><Text fontSize="4px" fontWeight="900">EV +{Math.max(0, stage - 2)}</Text></Flex>
        </Box>
      ) : kind === "news" ? (
        <Flex position="relative" mt="10px" w="91px" h="69px" direction="column" px="8px" pt="9px" border="2px solid #446F59" borderRadius="5px" bgColor="#FFFBEA" color="#315E49" boxShadow="0 4px 0 rgba(37,76,57,.5)" opacity={isWorking ? 1 : .38} overflow="hidden">
          <Flex alignItems="center" justifyContent="space-between"><Text fontFamily="monospace" fontSize="6px" fontWeight="900">HEADLINE_</Text><Box w="4px" h="8px" bgColor="#579474" animation={isWorking ? `${copyCursorMove} 500ms steps(1, end) infinite` : undefined} /></Flex>
          {[88, 72, 94, 58].map((width, index) => {
            const visible = stage > index;
            return <Box key={width} mt="5px" w={visible ? `${width}%` : "12%"} borderTop={`3px solid ${visible ? index === 0 ? "#D6785F" : "#6A9A80" : "#D5D8C9"}`} transition="width 260ms steps(6, end)" />;
          })}
          <Flex position="absolute" right="5px" bottom="4px" alignItems="center" gap="2px" color="#638773"><FiCheck size={6} /><Text fontFamily="monospace" fontSize="4px" fontWeight="900">{stage >= 4 ? "PROOFED" : "TYPING"}</Text></Flex>
        </Flex>
      ) : (
        <Box position="relative" mt="10px" w="91px" h="69px" border="2px solid #73599B" borderRadius="6px" bgColor="#2E2442" boxShadow="0 4px 0 rgba(41,29,59,.55)" opacity={isWorking ? 1 : .38} overflow="hidden">
          <Flex h="43px" alignItems="center" justifyContent="center" bg="linear-gradient(145deg, #7354A1, #A678C4)" color="#FFF"><FiPlay size={22} fill="currentColor" /></Flex>
          <Grid position="absolute" left="5px" right="5px" bottom="7px" h="13px" templateColumns="1.1fr .7fr 1.3fr .9fr" gap="2px">
            {['#8E72BF', '#E18B64', '#67B09A', '#D6B85B'].map((color, index) => <Box key={color} borderRadius="2px" bgColor={index < stage ? color : "#554863"} />)}
            {isWorking ? <Box position="absolute" top="-3px" bottom="-3px" w="2px" bgColor="#FFF" boxShadow="0 0 7px #FFF" animation={`${videoPlayhead} 1100ms linear infinite`} /> : null}
          </Grid>
          <Text position="absolute" right="5px" top="4px" color="#FFF" fontFamily="monospace" fontSize="4px" fontWeight="900">00:0{stage}</Text>
        </Box>
      )}

      <Text position="absolute" bottom="5px" color={renderingMaterial?.quality === "premium" ? "#FFD968" : meta.color} fontFamily="monospace" fontSize="6px" fontWeight="900">{renderingMaterial ? "RENDERING" : stage === 0 ? "STANDBY" : `STEP ${stage}/5`}</Text>
      {renderingMaterial ? <Box position="absolute" left="13px" right="13px" bottom="16px" h="3px" borderRadius="999px" bgColor="#9AF4FF" animation={`${outputTrayFlash} 300ms ease-in-out infinite`} /> : null}
    </Flex>
  );
}

function CreatorStudioWorkstation({
  campaign,
  energy,
  energyResolving,
  pressNonce,
  queuedMaterialKind,
  renderingMaterial,
}: {
  campaign: Campaign;
  energy: number;
  energyResolving: boolean;
  pressNonce: number;
  queuedMaterialKind: MaterialKind;
  renderingMaterial: RenderingMaterial | null;
}) {
  const workStage = energyResolving ? 5 : Math.min(4, Math.ceil(energy / 20));
  const previewKind = renderingMaterial?.kind ?? queuedMaterialKind;
  const buildSteps = MATERIAL_BUILD_STEPS[previewKind];
  const completedLines = buildSteps.slice(1, Math.max(1, workStage)).slice(-2);
  const currentLine = buildSteps[workStage];

  return (
    <>
      <Box
        position="absolute"
        zIndex={1}
        inset="0"
        bg="radial-gradient(circle at 50% 60%, rgba(205,220,216,.26), transparent 34%), repeating-linear-gradient(90deg, rgba(49,57,55,.045) 0 1px, transparent 1px 24px)"
        pointerEvents="none"
      />

      <Box
        position="absolute"
        zIndex={4}
        left="24px"
        right="24px"
        bottom="15px"
        h="145px"
        border="3px solid rgba(55,64,62,.42)"
        borderRadius="18px 18px 11px 11px"
        bg="linear-gradient(180deg, rgba(226,231,227,.4), rgba(81,87,84,.22))"
        boxShadow="0 8px 0 rgba(49,56,53,.24), inset 0 3px 0 rgba(255,255,255,.28)"
        pointerEvents="none"
        overflow="hidden"
      >
        <Grid position="absolute" inset="11px 11px auto" templateColumns="repeat(10, 1fr)" gap="4px" opacity={0.42}>
          {Array.from({ length: 20 }, (_, index) => (
            <Box key={index} h="13px" border="2px solid rgba(48,57,55,.48)" borderRadius="4px" bgColor="rgba(235,239,235,.4)" />
          ))}
        </Grid>
        <Box position="absolute" left="50%" bottom="12px" w="72%" h="56px" border="2px solid rgba(51,61,59,.24)" borderRadius="11px" bgColor="rgba(39,46,44,.08)" transform="translateX(-50%)" />
      </Box>

      <Box
        position="absolute"
        zIndex={3}
        left="50%"
        top="348px"
        w="92px"
        h="42px"
        border="4px solid #374341"
        borderTop="0"
        bg="linear-gradient(90deg, #586461, #87918D 50%, #586461)"
        clipPath="polygon(29% 0, 71% 0, 84% 100%, 16% 100%)"
        transform="translateX(-50%)"
        pointerEvents="none"
      />
      <Box position="absolute" zIndex={3} left="50%" top="382px" w="146px" h="13px" border="4px solid #374341" borderRadius="999px" bgColor="#7D8784" transform="translateX(-50%)" pointerEvents="none" />

      <Flex
        position="absolute"
        zIndex={6}
        left="23px"
        right="23px"
        top="171px"
        h="185px"
        direction="column"
        p="7px"
        border="5px solid #35413F"
        borderRadius="17px"
        bgColor="#58625F"
        boxShadow="0 9px 0 rgba(48,56,53,.48), 0 16px 24px rgba(51,58,55,.18), inset 0 3px 0 rgba(255,255,255,.24)"
        animation={`${monitorBoot} 360ms ease-out both`}
        pointerEvents="none"
      >
        <Box
          position="relative"
          flex="1"
          minH="0"
          border="3px solid #75DBE8"
          borderRadius="8px"
          bg="linear-gradient(rgba(86,215,231,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(86,215,231,.045) 1px, transparent 1px), #172429"
          bgSize="13px 13px"
          color="#DDF9F8"
          boxShadow="inset 0 0 18px rgba(51,208,230,.08)"
          animation={energyResolving ? `${monitorPulse} 420ms ease-in-out infinite` : undefined}
          overflow="hidden"
        >
          <Flex h="25px" alignItems="center" justifyContent="space-between" px="8px" borderBottom="2px solid rgba(117,219,232,.34)" bgColor="rgba(54,82,87,.54)">
            <Flex alignItems="center" gap="4px">
              {['#EF7680', '#E6BD5B', '#67CFA4'].map((color) => <Box key={color} w="7px" h="7px" borderRadius="999px" bgColor={color} />)}
              <Text ml="4px" fontFamily="monospace" fontSize="7px" fontWeight="900" letterSpacing=".05em">POST_MAKER.EXE</Text>
            </Flex>
            <Flex alignItems="center" gap="4px" color="#7FE7B9"><Box w="6px" h="6px" borderRadius="999px" bgColor="currentColor" boxShadow="0 0 8px currentColor" /><Text fontFamily="monospace" fontSize="6px" fontWeight="900">ONLINE</Text></Flex>
          </Flex>

          <Grid h="calc(100% - 25px)" templateColumns="minmax(0, 1fr) 115px" gap="7px" p="7px">
            <Flex minW="0" direction="column">
              <Flex minW="0" alignItems="center" gap="5px" px="6px" py="4px" border="1px solid rgba(119,218,231,.25)" borderRadius="4px" bgColor="rgba(72,112,117,.2)">
                <Text flexShrink={0} color="#68D7E8" fontFamily="monospace" fontSize="6px" fontWeight="900">TASK</Text>
                <Text minW="0" color="#FFF" fontSize="7px" fontWeight="900" lineClamp={1}>{campaign.title}・{campaign.brief}</Text>
              </Flex>

              <Flex mt="6px" minH="47px" direction="column" justifyContent="flex-end" gap="3px" px="3px" fontFamily="monospace">
                {completedLines.map((line) => (
                  <Text key={line} color="#7FA7A9" fontSize="7px" fontWeight="800" lineHeight="1.15">✓ {line.replace("…", "")}</Text>
                ))}
                <Flex key={`${pressNonce}-${workStage}`} minW="0" alignItems="center" color={energyResolving ? "#FFE477" : workStage === 0 ? "#8EA7A8" : "#93F2EA"} animation={`${consoleTypeIn} 330ms steps(8, end) both`}>
                  <Text flexShrink={0} mr="4px" fontSize="7px" fontWeight="900">&gt;</Text>
                  <Text minW="0" fontSize="8px" fontWeight="900" lineClamp={1}>{currentLine}</Text>
                  <Box ml="3px" w="4px" h="10px" flexShrink={0} bgColor="currentColor" animation={`${consoleCursorBlink} 620ms steps(1, end) infinite`} />
                </Flex>
              </Flex>

              <Grid mt="auto" templateColumns="repeat(5, 1fr)" gap="4px">
                {Array.from({ length: 5 }, (_, index) => {
                  const lit = index < Math.ceil(energy / 20);
                  return <Box key={index} h="7px" border={`1px solid ${lit ? "#B5FAFF" : "rgba(133,180,182,.38)"}`} borderRadius="2px" bgColor={lit ? (energyResolving ? "#FFE06B" : "#54D8E8") : "rgba(69,93,95,.42)"} boxShadow={lit ? `0 0 7px ${energyResolving ? "#FFE06B" : "#54D8E8"}` : "none"} transition="all 120ms ease" />;
                })}
              </Grid>
            </Flex>

            <MaterialProcessPreview kind={previewKind} energy={energy} renderingMaterial={renderingMaterial} />
          </Grid>

          <Box position="absolute" zIndex={8} left="0" right="0" top="0" h="18px" bg="linear-gradient(180deg, transparent, rgba(129,242,248,.22), transparent)" animation={`${monitorScan} 2300ms linear infinite`} />
        </Box>
      </Flex>

      <Box position="absolute" zIndex={2} left="50%" top="393px" w="260px" h="64px" borderRadius="999px" bg="radial-gradient(ellipse, rgba(80,223,239,.38), transparent 68%)" transform="translateX(-50%)" animation={energy > 0 ? `${workDeskGlow} 1300ms ease-in-out infinite` : undefined} pointerEvents="none" />
    </>
  );
}

export function OfficeCreatorStudioIncrementalMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<StudioPhase>("intro");
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [filledSlots, setFilledSlots] = useState<boolean[]>(() => CAMPAIGNS[0].recipe.map(() => false));
  const [filledQualities, setFilledQualities] = useState<Array<MaterialQuality | null>>(() => CAMPAIGNS[0].recipe.map(() => null));
  const [energy, setEnergy] = useState(0);
  const [energyResolving, setEnergyResolving] = useState(false);
  const [renderingMaterial, setRenderingMaterial] = useState<RenderingMaterial | null>(null);
  const [materialStock, setMaterialStock] = useState<Record<MaterialKind, number>>({ art: 0, photo: 0, news: 0, video: 0 });
  const [premiumStock, setPremiumStock] = useState<Record<MaterialKind, number>>({ art: 0, photo: 0, news: 0, video: 0 });
  const [flyingMaterials, setFlyingMaterials] = useState<FlyingMaterial[]>([]);
  const [popularity, setPopularity] = useState(0);
  const [earnedPopularity, setEarnedPopularity] = useState(0);
  const [rewardFlight, setRewardFlight] = useState<PopularityRewardFlight | null>(null);
  const [lastPostReward, setLastPostReward] = useState(0);
  const [popularityPulseNonce, setPopularityPulseNonce] = useState(0);
  const [aiLevel, setAiLevel] = useState(0);
  const [qualityLevel, setQualityLevel] = useState(0);
  const [supportLevel, setSupportLevel] = useState(0);
  const [supportDrop, setSupportDrop] = useState<SupportDrop | null>(null);
  const [activeBoost, setActiveBoost] = useState<ActiveBoost | null>(null);
  const [critBurst, setCritBurst] = useState<{ id: number; power: number } | null>(null);
  const [pressCount, setPressCount] = useState(0);
  const [pressStreak, setPressStreak] = useState(0);
  const [pressNonce, setPressNonce] = useState(0);
  const [autoFingerNonce, setAutoFingerNonce] = useState(0);
  const [workButtonState, setWorkButtonState] = useState<keyof typeof WORK_BUTTON_IMAGES>("ready");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);

  const materialIdRef = useRef(0);
  const generationCountRef = useRef(0);
  const rewardIdRef = useRef(0);
  const supportIdRef = useRef(0);
  const critIdRef = useRef(0);
  const autoPressRef = useRef<(source?: "manual" | "auto") => void>(() => undefined);
  const workPressTimerRef = useRef<number | null>(null);
  const pressStreakTimerRef = useRef<number | null>(null);
  const spacePressActiveRef = useRef(false);
  const noticeIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const campaign = CAMPAIGNS[campaignIndex];
  const completedCount = filledSlots.filter(Boolean).length;
  const folderComplete = completedCount === campaign.recipe.length;
  const upgradeUnlocked = campaignIndex >= 1;
  const energyPerTap = 20;
  const qualityChance = QUALITY_CHANCES[qualityLevel];
  const supportChance = SUPPORT_CHANCES[supportLevel];
  const aiInterval = AI_INTERVALS[aiLevel];
  const displayedClickPower = Math.round(energyPerTap * (activeBoost?.multiplier ?? 1));
  const aiSkillStat = aiLevel === 0 ? "AUTO OFF" : (AI_INTERVALS[aiLevel] / 1000).toFixed(1) + "s / CLICK";
  const qualitySkillStat = Math.round(qualityChance * 100) + "% RARE";
  const supportSkillStat = Math.round(supportChance * 100) + "% DROP";
  const queuedMaterialKind = MATERIAL_SEQUENCE[generationCountRef.current % MATERIAL_SEQUENCE.length];
  const stockTotal = MATERIAL_KINDS.reduce((total, kind) => total + materialStock[kind], 0);
  const stockItems: MaterialStockItem[] = MATERIAL_KINDS.flatMap((kind) => [
    { kind, quality: "normal" as const, count: materialStock[kind] - premiumStock[kind] },
    { kind, quality: "premium" as const, count: premiumStock[kind] },
  ]).filter((item) => item.count > 0);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (workPressTimerRef.current !== null) window.clearTimeout(workPressTimerRef.current);
    if (pressStreakTimerRef.current !== null) window.clearTimeout(pressStreakTimerRef.current);
  }, []);

  const showNotice = useCallback((text: string) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, text });
  }, []);

  const beginWorkPress = useCallback(() => {
    if (phase !== "playing" || energyResolving || upgradeOpen) return;
    if (workPressTimerRef.current !== null) window.clearTimeout(workPressTimerRef.current);
    setWorkButtonState("pressed");
    workPressTimerRef.current = window.setTimeout(() => {
      setWorkButtonState("bottomed");
      workPressTimerRef.current = null;
    }, 70);
  }, [energyResolving, phase, upgradeOpen]);

  const releaseWorkPress = useCallback(() => {
    if (workPressTimerRef.current !== null) window.clearTimeout(workPressTimerRef.current);
    setWorkButtonState("bottomed");
    workPressTimerRef.current = window.setTimeout(() => {
      setWorkButtonState("ready");
      workPressTimerRef.current = null;
    }, 120);
  }, []);

  const cancelWorkPress = useCallback(() => {
    if (workPressTimerRef.current !== null) window.clearTimeout(workPressTimerRef.current);
    workPressTimerRef.current = null;
    setWorkButtonState("ready");
  }, []);

  const pressWork = useCallback((source: "manual" | "auto" = "manual") => {
    if (phase !== "playing" || energyResolving || upgradeOpen) return;
    const boostMultiplier = activeBoost?.multiplier ?? 1;
    const isCritical = Boolean(activeBoost && Math.random() < activeBoost.critChance);
    const clickPower = Math.round(energyPerTap * boostMultiplier * (isCritical ? 2 : 1));
    playGameSfx("creatorStudioWorkTap", {
      volumeScale: source === "auto" ? 0.38 : 0.72,
      playbackRate: source === "auto" ? 1.12 : 0.96 + Math.min(pressStreak, 4) * 0.025,
    });
    setPressCount((value) => value + 1);
    setPressStreak((value) => value + 1);
    if (pressStreakTimerRef.current !== null) window.clearTimeout(pressStreakTimerRef.current);
    pressStreakTimerRef.current = window.setTimeout(() => {
      setPressStreak(0);
      pressStreakTimerRef.current = null;
    }, aiLevel > 0 ? aiInterval + 700 : 1400);
    setPressNonce((value) => value + 1);
    if (activeBoost) {
      setActiveBoost((current) => current ? current.remaining <= 1 ? null : { ...current, remaining: current.remaining - 1 } : current);
    }
    if (isCritical) {
      playGameSfx("creatorStudioCritical");
      critIdRef.current += 1;
      const critId = critIdRef.current;
      setCritBurst({ id: critId, power: clickPower });
      const critTimer = window.setTimeout(() => setCritBurst((current) => current?.id === critId ? null : current), 620);
      timersRef.current.push(critTimer);
    }
    if (supportLevel > 0 && !supportDrop && !activeBoost && Math.random() < supportChance) {
      supportIdRef.current += 1;
      const supportKinds: readonly SupportKind[] = ["coffee", "bubbleTea", "energyDrink"];
      const drop: SupportDrop = { id: supportIdRef.current, kind: supportKinds[Math.floor(Math.random() * supportKinds.length)] };
      setSupportDrop(drop);
      playGameSfx("creatorStudioSupportArrive");
      const supportTimer = window.setTimeout(() => setSupportDrop((current) => current?.id === drop.id ? null : current), 9000);
      timersRef.current.push(supportTimer);
    }
    const nextEnergy = Math.min(100, energy + clickPower);
    setEnergy(nextEnergy);
    if (nextEnergy < 100) {
      return;
    }

    playGameSfx("creatorStudioEnergyFull");
    generationCountRef.current += 1;
    const kind = MATERIAL_SEQUENCE[(generationCountRef.current - 1) % MATERIAL_SEQUENCE.length];
    const quality: MaterialQuality = Math.random() < qualityChance ? "premium" : "normal";
    const material: RenderingMaterial = { id: generationCountRef.current, kind, quality };
    setEnergyResolving(true);
    setRenderingMaterial(material);

    const revealTimer = window.setTimeout(() => {
      if (quality === "premium") {
        playGameSfx("creatorStudioMaterialRare");
        showNotice(`RARE ${MATERIAL_META[kind].code} ★`);
      } else {
        playGameSfx("creatorStudioMaterialReady");
      }
    }, 300);

    const resolveTimer = window.setTimeout(() => {
      setEnergy(0);
      setEnergyResolving(false);
      setRenderingMaterial((current) => current?.id === material.id ? null : current);
      setMaterialStock((current) => ({ ...current, [kind]: current[kind] + 1 }));
      if (quality === "premium") setPremiumStock((current) => ({ ...current, [kind]: current[kind] + 1 }));
    }, 880);
    timersRef.current.push(revealTimer, resolveTimer);
  }, [activeBoost, aiInterval, aiLevel, energy, energyPerTap, energyResolving, phase, pressStreak, qualityChance, showNotice, supportChance, supportDrop, supportLevel, upgradeOpen]);

  useEffect(() => {
    if (phase === "playing" && !upgradeOpen) return;
    if (pressStreakTimerRef.current !== null) window.clearTimeout(pressStreakTimerRef.current);
    pressStreakTimerRef.current = null;
    setPressStreak(0);
  }, [phase, upgradeOpen]);

  useEffect(() => {
    autoPressRef.current = pressWork;
  }, [pressWork]);

  useEffect(() => {
    if (aiLevel === 0 || phase !== "playing" || upgradeOpen || energyResolving) return;
    const interval = window.setInterval(() => {
      setAutoFingerNonce((value) => value + 1);
      setWorkButtonState("pressed");
      autoPressRef.current("auto");
      const bottomTimer = window.setTimeout(() => setWorkButtonState("bottomed"), 70);
      const releaseTimer = window.setTimeout(() => setWorkButtonState("ready"), 190);
      timersRef.current.push(bottomTimer, releaseTimer);
    }, aiInterval);
    return () => window.clearInterval(interval);
  }, [aiInterval, aiLevel, energyResolving, phase, upgradeOpen]);

  useEffect(() => {
    if (phase !== "playing" || upgradeOpen) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) return;
      event.preventDefault();
      if (event.repeat || energyResolving) return;
      spacePressActiveRef.current = true;
      beginWorkPress();
      pressWork();
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isEditableTarget(event.target)) return;
      event.preventDefault();
      if (!spacePressActiveRef.current) return;
      spacePressActiveRef.current = false;
      releaseWorkPress();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [beginWorkPress, energyResolving, phase, pressWork, releaseWorkPress, upgradeOpen]);

  const collectMaterial = useCallback((kind: MaterialKind, quality: MaterialQuality) => {
    const availableCount = quality === "premium" ? premiumStock[kind] : materialStock[kind] - premiumStock[kind];
    if (availableCount <= 0 || phase !== "playing") return;
    const reservedTargets = new Set(flyingMaterials.map((item) => item.targetIndex));
    const targetIndex = campaign.recipe.findIndex((requiredKind, index) => requiredKind === kind && !filledSlots[index] && !reservedTargets.has(index));
    if (targetIndex < 0) {
      playGameSfx("creatorStudioDenied");
      showNotice(`${MATERIAL_META[kind].code} 先保留在素材庫`);
      return;
    }

    materialIdRef.current += 1;
    const material: FlyingMaterial = { id: materialIdRef.current, kind, quality, targetIndex };
    setMaterialStock((current) => ({ ...current, [kind]: current[kind] - 1 }));
    if (quality === "premium") setPremiumStock((current) => ({ ...current, [kind]: current[kind] - 1 }));
    setFlyingMaterials((current) => [...current, material]);
    playGameSfx("creatorStudioMaterialFly", { playbackRate: quality === "premium" ? 1.1 : 1 });

    const timer = window.setTimeout(() => {
      setFilledSlots((current) => current.map((filled, index) => index === material.targetIndex ? true : filled));
      setFilledQualities((current) => current.map((filledQuality, index) => index === material.targetIndex ? material.quality : filledQuality));
      setFlyingMaterials((current) => current.filter((item) => item.id !== material.id));
      playGameSfx("creatorStudioMaterialFiled", { playbackRate: material.targetIndex === 0 ? 0.98 : 1.04 });
      showNotice(material.quality === "premium" ? "稀有素材已收入資料夾" : "素材已收入資料夾");
    }, 720);
    timersRef.current.push(timer);
  }, [campaign.recipe, filledSlots, flyingMaterials, materialStock, phase, premiumStock, showNotice]);

  const publishPost = useCallback(() => {
    if (phase !== "playing") return;
    if (!folderComplete) {
      playGameSfx("creatorStudioDenied", { volumeScale: 0.72 });
      return;
    }
    const premiumCount = filledQualities.filter((quality) => quality === "premium").length;
    const gained = Math.round(campaign.popularity * (1 + premiumCount * .5));
    rewardIdRef.current += 1;
    const rewardId = rewardIdRef.current;
    setLastPostReward(gained);
    setRewardFlight({ id: rewardId, amount: gained });
    setPhase("posting");
    playGameSfx("creatorStudioPostSend");

    const collectTimer = window.setTimeout(() => {
      setPopularity((value) => value + gained);
      setEarnedPopularity((value) => value + gained);
      setPopularityPulseNonce((value) => value + 1);
      playGameSfx("creatorStudioPopularityGain", { playbackRate: 0.98 + Math.min(premiumCount, 2) * 0.08 });
    }, 780);
    timersRef.current.push(collectTimer);

    const clearRewardTimer = window.setTimeout(() => {
      setRewardFlight((current) => current?.id === rewardId ? null : current);
    }, 1140);
    timersRef.current.push(clearRewardTimer);

    const timer = window.setTimeout(() => {
      if (campaignIndex >= CAMPAIGNS.length - 1) {
        setPhase("complete");
        playGameSfx("creatorStudioKpiComplete");
        return;
      }
      const nextIndex = campaignIndex + 1;
      setCampaignIndex(nextIndex);
      setFilledSlots(CAMPAIGNS[nextIndex].recipe.map(() => false));
      setFilledQualities(CAMPAIGNS[nextIndex].recipe.map(() => null));
      setPhase("playing");
      showNotice(nextIndex === 1 ? "UPGRADE UNLOCKED" : `KPI ${nextIndex}/${CAMPAIGNS.length}`);
    }, 1200);
    timersRef.current.push(timer);
  }, [campaign.popularity, campaignIndex, filledQualities, folderComplete, phase, showNotice]);

  const openUpgrade = useCallback(() => {
    if (!upgradeUnlocked) {
      playGameSfx("creatorStudioDenied");
      showNotice("完成第一篇 PO 文後解鎖升級");
      return;
    }
    playGameSfx("creatorStudioSkillOpen");
    setUpgradeOpen(true);
  }, [showNotice, upgradeUnlocked]);

  const upgradeSkill = useCallback((branch: SkillBranch) => {
    const level = branch === "ai" ? aiLevel : branch === "quality" ? qualityLevel : supportLevel;
    if (level >= 3) {
      playGameSfx("creatorStudioDenied", { volumeScale: 0.7, playbackRate: 1.08 });
      return;
    }
    const cost = SKILL_COSTS[branch][level];
    if (popularity < cost) {
      playGameSfx("creatorStudioDenied");
      showNotice(`人氣還差 ${cost - popularity}`);
      return;
    }
    setPopularity((value) => value - cost);
    if (branch === "ai") setAiLevel((value) => value + 1);
    if (branch === "quality") setQualityLevel((value) => value + 1);
    if (branch === "support") setSupportLevel((value) => value + 1);
    playGameSfx("creatorStudioSkillUpgrade", { playbackRate: 1 + level * 0.06 });
    showNotice(branch === "ai" ? "AI CLICK UPGRADED" : branch === "quality" ? "RARE RATE UP" : "SUPPORT DROP UP");
  }, [aiLevel, popularity, qualityLevel, showNotice, supportLevel]);

  const claimSupport = useCallback(() => {
    if (!supportDrop) return;
    const meta = SUPPORT_META[supportDrop.kind];
    setActiveBoost({ ...supportDrop, multiplier: meta.multiplier, critChance: meta.critChance, remaining: meta.clicks });
    setSupportDrop(null);
    playGameSfx("creatorStudioSupportClaim", { playbackRate: 0.98 + meta.multiplier * 0.06 });
    showNotice(`${meta.label}・×${meta.multiplier}・CRIT ${Math.round(meta.critChance * 100)}%`);
  }, [showNotice, supportDrop]);

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#8F918F" color="#202625" data-office-creator-studio={phase}>
      <Box position="absolute" inset="0" bg="linear-gradient(150deg, rgba(255,255,255,.12), transparent 42%), #8F918F" />

      <Grid position="relative" zIndex={10} h="87px" flexShrink={0} templateColumns="1.55fr .92fr" gap="13px" px="12px" pt="12px" pb="10px">
        <Box key={popularityPulseNonce} animation={popularityPulseNonce > 0 ? `${popularityCollect} 460ms cubic-bezier(.2,.8,.2,1) both` : undefined}>
          <HeaderStat icon={null} label="人氣 POPULARITY" value={`${popularity}`} />
        </Box>
        <Flex as="button" h="60px" alignItems="center" justifyContent="center" gap="7px" border={`3px solid ${upgradeUnlocked ? "#333B39" : "#626865"}`} borderRadius="5px" bgColor={upgradeUnlocked ? "#FFF" : "#B7BAB8"} color={upgradeUnlocked ? "#222827" : "#707672"} boxShadow="0 5px 0 rgba(49,57,57,.4)" onClick={openUpgrade}>
          {upgradeUnlocked ? <FiTrendingUp size={20} /> : <FiLock size={18} />}
          <Text fontSize="17px" fontWeight="900">技能樹</Text>
        </Flex>
      </Grid>

      <Flex position="relative" zIndex={9} h="164px" flexShrink={0} mx="12px" px="12px" py="12px" gap="11px" border="3px solid #E8EAE8" borderRadius="16px" bgColor="#FFF" boxShadow="0 6px 0 rgba(63,68,66,.26)">
        <Flex position="relative" w="46%" minW="0" direction="column" alignItems="center" justifyContent="flex-end">
          <Flex position="absolute" top="0" left="0" right="0" h="92px" alignItems="flex-end" justifyContent="center" gap="0" overflow="hidden">
            {campaign.recipe.map((kind, index) => filledSlots[index] ? <Box key={`${campaign.id}-${index}`} mb="-13px" transform={`rotate(${index % 2 ? 5 : -5}deg)`}><MaterialAppIcon kind={kind} size={55} premium={filledQualities[index] === "premium"} /></Box> : null)}
          </Flex>
          <Box position="absolute" left="9px" right="9px" bottom="17px" h="79px" border="3px solid #235E79" borderRadius="10px" bg="linear-gradient(180deg, #54CAE9, #2C9FC4)" boxShadow="0 7px 0 #1B526A, inset 0 4px 0 rgba(255,255,255,.3)" />
          <Box position="absolute" left="9px" top="51px" w="45%" h="17px" border="3px solid #235E79" borderBottom="none" borderRadius="8px 8px 0 0" bgColor="#4BC2E2" />
          <Flex position="relative" zIndex={4} w="100%" direction="column" alignItems="center" pb="24px" color="white"><Text color="#D8F7FF" fontSize="6px" fontWeight="900">POST FOLDER</Text><Text mt="3px" maxW="118px" fontSize="10px" fontWeight="900" lineClamp={1}>{campaign.title}</Text><Text mt="4px" color="#D8F7FF" fontSize="6px" fontWeight="900">KPI {campaignIndex + 1}/{CAMPAIGNS.length}</Text></Flex>
        </Flex>

        <Flex flex="1" minW="0" direction="column" gap="8px">
          <Grid h="70px" templateColumns={`repeat(${campaign.recipe.length}, minmax(0, 1fr))`} gap="7px">
            {campaign.recipe.map((kind, slotIndex) => {
              const filled = filledSlots[slotIndex];
              const premium = filledQualities[slotIndex] === "premium";
              const meta = MATERIAL_META[kind];
              return (
                <Flex key={slotIndex} minW="0" direction="column" alignItems="center" justifyContent="center" gap="3px" border={`2px dashed ${premium ? "#D5A62E" : filled ? meta.color : "#D6D9D7"}`} borderRadius="9px" bgColor={premium ? "#FFF8D8" : filled ? "#F8FBF8" : "#EFEFEF"} color={meta.dark} boxShadow={premium ? "0 0 13px rgba(255,216,103,.68)" : "none"}>
                  {filled ? <MaterialAppIcon kind={kind} size={42} premium={premium} /> : <MaterialGlyph kind={kind} size={22} />}
                  {!filled ? <Text fontFamily="monospace" fontSize="6px" fontWeight="900">{meta.code}</Text> : null}
                </Flex>
              );
            })}
          </Grid>
          <Flex as="button" flex="1" minH="0" alignItems="center" justifyContent="center" gap="7px" border={`3px solid ${folderComplete ? "#733C35" : "#D6D9D7"}`} borderRadius="9px" bgColor={folderComplete ? "#E66A55" : "#EFEFEF"} color={folderComplete ? "white" : "#AEB2AF"} boxShadow={folderComplete ? "0 4px 0 #733C35" : "none"} onClick={publishPost}>
            {folderComplete ? <FiSend size={17} /> : <FiLock size={14} />}
            <Text fontFamily="monospace" fontSize="15px" fontWeight="900">SEND</Text>
            <FiHeart size={11} fill="currentColor" />
          </Flex>
        </Flex>
      </Flex>

      <Box position="relative" zIndex={3} flex="1" minH="0" mt="8px" overflow="hidden">
        <CreatorStudioWorkstation
          campaign={campaign}
          energy={energy}
          energyResolving={energyResolving}
          pressNonce={pressNonce}
          queuedMaterialKind={queuedMaterialKind}
          renderingMaterial={renderingMaterial}
        />

        <Flex position="absolute" zIndex={20} left="50%" top="18px" alignItems="center" gap="6px" px="10px" py="6px" borderRadius="999px" bgColor="rgba(70,73,71,.72)" color="#EEF1EE" boxShadow="0 4px 0 rgba(53,59,56,.18)" transform="translateX(-50%)"><Text fontSize="7px" fontWeight="900">{campaign.brief}</Text></Flex>

        <Flex position="absolute" zIndex={24} left="12px" right="12px" top="64px" minH="101px" alignItems="flex-start" justifyContent="center" gap="8px" wrap="wrap">
          {stockItems.map(({ kind, quality, count }) => {
            const premium = quality === "premium";
            const needed = campaign.recipe.some((requiredKind, index) => requiredKind === kind && !filledSlots[index] && !flyingMaterials.some((item) => item.targetIndex === index));
            return (
              <Flex key={kind + "-" + quality + "-" + count} as="button" position="relative" w="76px" h="88px" alignItems="center" justifyContent="center" border={`3px solid ${premium ? "#FFD968" : needed ? "#F8DE78" : "rgba(238,241,236,.72)"}`} borderRadius="15px" bgColor={premium ? "rgba(255,248,210,.96)" : needed ? "rgba(255,250,218,.92)" : "rgba(232,235,231,.84)"} boxShadow={premium ? "0 8px 0 rgba(113,80,22,.48), 0 0 25px rgba(255,216,94,.72)" : needed ? "0 8px 0 rgba(86,71,31,.4), 0 0 24px rgba(255,226,101,.58)" : "0 7px 0 rgba(55,62,58,.35)"} animation={`${stockPop} 280ms ease both`} onClick={() => collectMaterial(kind, quality)} aria-label={`使用 ${premium ? "稀有" : "普通"} ${MATERIAL_META[kind].code}`}>
                <MaterialAppIcon kind={kind} size={58} premium={premium} />
                <Flex position="absolute" right="-7px" top="-7px" minW="26px" h="26px" alignItems="center" justifyContent="center" px="5px" border="3px solid #313A37" borderRadius="999px" bgColor="#FFF" color="#303734"><Text fontFamily="monospace" fontSize="9px" fontWeight="900">×{count}</Text></Flex>
                {premium ? <Flex position="absolute" right="-6px" bottom="-7px" h="21px" alignItems="center" gap="2px" px="5px" border="2px solid #765417" borderRadius="999px" bgColor="#FFD968" color="#674611"><FiStar size={9} fill="currentColor" /><Text fontFamily="monospace" fontSize="7px" fontWeight="900">RARE</Text></Flex> : null}
                {needed ? <Flex position="absolute" left="-7px" bottom="-7px" w="24px" h="24px" alignItems="center" justifyContent="center" border="3px solid #68562C" borderRadius="999px" bgColor="#FFE071" color="#5E4B29"><FiArrowUp size={12} /></Flex> : null}
              </Flex>
            );
          })}
          {stockTotal === 0 ? <Flex h="47px" alignItems="center" gap="5px" px="12px" border="2px dashed rgba(245,247,243,.58)" borderRadius="999px" color="#E7EAE6"><FiZap size={13} /><Text fontFamily="monospace" fontSize="8px" fontWeight="900">EMPTY STOCK</Text></Flex> : null}
        </Flex>

        {supportDrop ? (
          <Flex key={`support-${supportDrop.id}`} as="button" position="absolute" zIndex={38} right="17px" top="183px" w="94px" h="82px" alignItems="center" justifyContent="center" border="0" bgColor="transparent" animation={`${supportFlyIn} 680ms cubic-bezier(.2,.8,.2,1) both`} onClick={claimSupport} aria-label={`取得 ${SUPPORT_META[supportDrop.kind].label} 應援`}>
            <Flex animation={`${supportHover} 1100ms ease-in-out 680ms infinite`} alignItems="center" justifyContent="center">
              <Text mr="-7px" fontSize="28px" lineHeight="1" animation={`${wingFlap} 360ms ease-in-out infinite`}>🪽</Text>
              <Flex position="relative" zIndex={2} w="53px" h="53px" alignItems="center" justifyContent="center" border={`4px solid ${SUPPORT_META[supportDrop.kind].color}`} borderRadius="999px" bgColor="#FFF" boxShadow={`0 7px 0 #3A4743, 0 0 18px ${SUPPORT_META[supportDrop.kind].color}`}><Text fontSize="29px" lineHeight="1">{SUPPORT_META[supportDrop.kind].emoji}</Text><Text position="absolute" bottom="-17px" px="5px" py="2px" border="2px solid #35413D" borderRadius="999px" bgColor="#FFF" color="#303936" fontFamily="monospace" fontSize="6px" fontWeight="900">TAP!</Text></Flex>
              <Text ml="-7px" fontSize="28px" lineHeight="1" transform="scaleX(-1)" animation={`${wingFlap} 360ms ease-in-out 90ms infinite`}>🪽</Text>
            </Flex>
          </Flex>
        ) : null}

        {activeBoost ? <Flex position="absolute" zIndex={35} left="50%" bottom="153px" alignItems="center" gap="7px" px="10px" py="6px" border={`3px solid ${SUPPORT_META[activeBoost.kind].color}`} borderRadius="999px" bgColor="rgba(255,255,255,.94)" color="#28322F" boxShadow={`0 5px 0 rgba(41,49,46,.38), 0 0 14px ${SUPPORT_META[activeBoost.kind].color}`} transform="translateX(-50%)"><Text fontSize="17px">{SUPPORT_META[activeBoost.kind].emoji}</Text><Text fontFamily="monospace" fontSize="8px" fontWeight="900">×{activeBoost.multiplier}・CRIT {Math.round(activeBoost.critChance * 100)}%</Text><Text color="#C84E5E" fontFamily="monospace" fontSize="8px" fontWeight="900">{activeBoost.remaining}</Text></Flex> : null}
        {critBurst ? <Flex key={`crit-${critBurst.id}`} position="absolute" zIndex={70} left="50%" bottom="144px" alignItems="center" gap="5px" px="11px" py="7px" border="3px solid #A96619" borderRadius="8px" bgColor="#FFE274" color="#764812" boxShadow="0 6px 0 rgba(107,67,18,.36), 0 0 20px rgba(255,223,103,.8)" animation={`${critBurstIn} 620ms ease-out both`} pointerEvents="none"><FiZap size={15} fill="currentColor" /><Text fontFamily="monospace" fontSize="12px" fontWeight="900">CRIT +{critBurst.power}</Text></Flex> : null}

        {aiLevel > 0 ? <Flex position="absolute" zIndex={18} left="50%" bottom="139px" w="62px" h="62px" alignItems="center" justifyContent="center" animation={`${autoFingerHover} 1200ms ease-in-out infinite`} pointerEvents="none"><Image key={autoFingerNonce} src="/images/pointer_up.png" alt="" w="62px" h="62px" objectFit="contain" transform="rotate(180deg)" transformOrigin="center" animation={autoFingerNonce > 0 ? `${autoFingerTap} 520ms cubic-bezier(.2,.75,.2,1) both` : undefined} draggable={false} /></Flex> : null}

        <Flex as="button" position="absolute" zIndex={8} left="50%" bottom="31px" w="220px" h="114px" alignItems="center" justifyContent="center" border="0" bgColor="transparent" transform="translateX(-50%)" onPointerDown={beginWorkPress} onPointerUp={releaseWorkPress} onPointerCancel={cancelWorkPress} onPointerLeave={cancelWorkPress} onClick={() => pressWork()} aria-label={`WORK，製作進度加 ${displayedClickPower}，電腦版可按空白鍵`}>
          <Flex key={pressNonce} w="100%" h="100%" alignItems="center" justifyContent="center" animation={pressNonce > 0 ? `${buttonPress} 320ms cubic-bezier(.2,.8,.2,1) both` : `${buttonIdle} 1600ms ease-in-out infinite`}>
            <WorkButtonArtwork state={phase === "playing" ? workButtonState : "ready"} />
          </Flex>
        </Flex>
        {pressStreak > 0 ? <Flex key={`press-streak-${pressNonce}`} position="absolute" zIndex={11} left="50%" bottom="20px" minW="68px" h="25px" alignItems="center" justifyContent="center" px="9px" border="3px solid #26383D" borderRadius="999px" bgColor="#F8FBF8" color="#E45F6F" boxShadow="0 4px 0 rgba(38,52,56,.35)" animation={`${pressCounterBump} 180ms ease-out both`} pointerEvents="none"><Text fontFamily="monospace" fontSize="11px" fontWeight="900">{pressStreak}次</Text></Flex> : null}
      </Box>

      {flyingMaterials.map((material) => <Flex key={material.id} position="absolute" zIndex={120} left="50%" bottom="190px" pointerEvents="none" animation={`${material.targetIndex === 0 ? flyToFolderLeft : flyToFolderRight} 720ms cubic-bezier(.2,.78,.25,1) both`}><MaterialAppIcon kind={material.kind} size={68} premium={material.quality === "premium"} /></Flex>)}

      {rewardFlight ? (
        <Box position="absolute" inset="0" zIndex={148} pointerEvents="none">
          {Array.from({ length: 7 }, (_, index) => (
            <Flex key={`${rewardFlight.id}-${index}`} position="absolute" left="51%" top="58%" w={index === 0 ? "42px" : `${24 - Math.min(index, 4) * 2}px`} h={index === 0 ? "42px" : `${24 - Math.min(index, 4) * 2}px`} alignItems="center" justifyContent="center" border={index === 0 ? "3px solid #913E4B" : "2px solid rgba(145,62,75,.82)"} borderRadius="999px" bgColor={index === 0 ? "#FFF" : "#EF7A86"} color="#D95566" boxShadow="0 4px 0 rgba(104,48,57,.3), 0 0 13px rgba(242,107,124,.42)" animation={`${popularityHeartFly} ${720 + index * 34}ms cubic-bezier(.2,.72,.25,1) ${index * 42}ms both`}>
              <FiHeart size={index === 0 ? 22 : 12} fill="currentColor" />
              {index === 0 ? <Text position="absolute" left="36px" top="5px" px="6px" py="2px" border="2px solid #913E4B" borderRadius="999px" bgColor="#FFF" fontFamily="monospace" fontSize="9px" fontWeight="900" whiteSpace="nowrap">+{rewardFlight.amount}</Text> : null}
            </Flex>
          ))}
        </Box>
      ) : null}

      {notice ? <Flex key={`notice-${notice.id}`} position="absolute" zIndex={170} left="50%" bottom={upgradeOpen ? "96px" : "270px"} minH="34px" maxW="320px" alignItems="center" justifyContent="center" px="12px" border="2px solid #323B38" borderRadius="8px" bgColor="#FFF" color="#3A4641" boxShadow="0 6px 14px rgba(36,45,41,.3)" transform="translateX(-50%)" animation={`${panelIn} 170ms ease both`} pointerEvents="none"><Text fontSize="9px" fontWeight="900">{notice.text}</Text></Flex> : null}

      {upgradeOpen ? (
        <Flex position="absolute" inset="0" zIndex={140} alignItems="center" justifyContent="center" px="12px" bgColor="rgba(20,27,29,.84)" backdropFilter="blur(6px)">
          <Flex position="relative" w="100%" direction="column" p="14px" border="4px solid #5E7076" borderRadius="15px" bg="linear-gradient(rgba(72,94,101,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(72,94,101,.13) 1px, transparent 1px), #172227" bgSize="18px 18px" color="#F2F5F3" boxShadow="8px 9px 0 rgba(7,12,13,.58), inset 0 0 30px rgba(44,211,233,.06)" animation={`${panelIn} 220ms ease both`} overflow="hidden">
            <Box position="absolute" inset="7px" border="1px solid rgba(113,142,151,.28)" borderRadius="9px" pointerEvents="none" />
            <Flex position="relative" zIndex={2} alignItems="center" justifyContent="space-between">
              <Flex direction="column"><Flex alignItems="center" gap="7px" color="#61D7EA"><FiTrendingUp size={19} /><Text fontFamily="monospace" fontSize="18px" fontWeight="900" letterSpacing=".06em">SKILL TREE</Text></Flex><Text mt="3px" color="#829399" fontFamily="monospace" fontSize="7px" fontWeight="900">SPEND POPULARITY・LIGHT THE BRANCHES</Text></Flex>
              <Flex as="button" w="34px" h="34px" alignItems="center" justifyContent="center" border="2px solid #687A80" borderRadius="8px" bgColor="#26343A" color="#DCE5E2" onClick={() => { playGameSfx("uiDialogContinue", { volumeScale: 0.65, playbackRate: 0.9 }); setUpgradeOpen(false); }}><FiX size={17} /></Flex>
            </Flex>

            <Box position="relative" zIndex={2} mt="12px">
              <Flex position="relative" zIndex={3} mx="auto" w="74px" h="74px" direction="column" alignItems="center" justifyContent="center" border="4px solid #E97582" borderRadius="999px" bg="radial-gradient(circle at 35% 28%, rgba(255,255,255,.32), transparent 30%), #9C4652" color="#FFF" boxShadow="0 0 0 6px #121C20, 0 0 24px rgba(233,117,130,.7)" animation={skillCorePulse + " 1500ms ease-in-out infinite"}><FiHeart size={26} fill="currentColor" /><Text mt="2px" fontFamily="monospace" fontSize="11px" fontWeight="900">{popularity}</Text></Flex>
              <Box position="absolute" zIndex={1} left="50%" top="70px" w="4px" h="30px" bgColor="#E97582" boxShadow="0 0 9px #E97582" transform="translateX(-50%)" />
              <Box position="absolute" zIndex={1} left="16.5%" right="16.5%" top="96px" h="4px" bg="linear-gradient(90deg, #62D7EA, #E97582 50%, #E4BD59)" boxShadow="0 0 9px rgba(112,210,220,.55)" />

              <Grid position="relative" zIndex={2} mt="47px" templateColumns="repeat(3, minmax(0, 1fr))" gap="7px">
                <SkillTreeBranchNode title="AI CLICK" stat={aiSkillStat} level={aiLevel} cost={SKILL_COSTS.ai[aiLevel] ?? null} accent="#62D7EA" icon={<FiCpu size={27} />} affordable={popularity >= (SKILL_COSTS.ai[aiLevel] ?? Infinity)} onClick={() => upgradeSkill("ai")} />
                <SkillTreeBranchNode title="RARE FILE" stat={qualitySkillStat} level={qualityLevel} cost={SKILL_COSTS.quality[qualityLevel] ?? null} accent="#D38ED9" icon={<FiStar size={27} fill={qualityLevel > 0 ? "currentColor" : "none"} />} affordable={popularity >= (SKILL_COSTS.quality[qualityLevel] ?? Infinity)} onClick={() => upgradeSkill("quality")} />
                <SkillTreeBranchNode title="SUPPORT" stat={supportSkillStat} level={supportLevel} cost={SKILL_COSTS.support[supportLevel] ?? null} accent="#E4BD59" icon={<FiCoffee size={27} />} affordable={popularity >= (SKILL_COSTS.support[supportLevel] ?? Infinity)} onClick={() => upgradeSkill("support")} />
              </Grid>
            </Box>

            <Grid position="relative" zIndex={2} mt="13px" templateColumns="repeat(3, 1fr)" gap="6px">
              <Text p="7px" border="1px solid #3D5961" borderRadius="6px" bgColor="rgba(36,57,64,.72)" color="#8FCBD5" fontSize="7px" fontWeight="800" lineHeight="1.35" textAlign="center">自動按下 WORK<br />升級縮短間隔</Text>
              <Text p="7px" border="1px solid #59435D" borderRadius="6px" bgColor="rgba(61,42,63,.62)" color="#CFA6D3" fontSize="7px" fontWeight="800" lineHeight="1.35" textAlign="center">稀有素材發光<br />貼文愛心增加</Text>
              <Text p="7px" border="1px solid #625832" borderRadius="6px" bgColor="rgba(64,57,34,.62)" color="#D7C27B" fontSize="7px" fontWeight="800" lineHeight="1.35" textAlign="center">應援品飛入<br />倍率與爆擊</Text>
            </Grid>
          </Flex>
        </Flex>
      ) : null}

      {phase === "posting" ? (
        <Flex position="absolute" zIndex={130} left="12px" right="12px" top="87px" h="164px" alignItems="center" gap="12px" p="12px" border="4px solid #303836" borderRadius="16px" bgColor="#FFF" boxShadow="0 8px 0 rgba(38,43,41,.42), 0 14px 22px rgba(36,42,39,.2)" animation={`${postSlideRight} 1160ms cubic-bezier(.22,.7,.2,1) both`} pointerEvents="none">
          <Flex position="relative" w="46%" h="100%" alignItems="center" justifyContent="center" gap="5px" border={`3px solid ${campaign.color}`} borderRadius="11px" bg={`linear-gradient(145deg, ${campaign.color}, #F8F4E7)`} overflow="hidden">
            <Box position="absolute" inset="0" bg="linear-gradient(145deg, rgba(255,255,255,.42), transparent 48%)" />
            {campaign.recipe.map((kind, index) => <Box key={`${kind}-${index}`} position="relative" zIndex={2} transform={`rotate(${index % 2 ? 5 : -5}deg)`}><MaterialAppIcon kind={kind} size={campaign.recipe.length === 1 ? 64 : 51} premium={filledQualities[index] === "premium"} /></Box>)}
            <Text position="absolute" zIndex={3} left="8px" bottom="7px" px="6px" py="3px" borderRadius="4px" bgColor="rgba(255,255,255,.9)" color="#343B38" fontFamily="monospace" fontSize="7px" fontWeight="900">POSTED</Text>
          </Flex>
          <Flex flex="1" minW="0" direction="column" alignItems="flex-start">
            <Text color={campaign.color} fontFamily="monospace" fontSize="8px" fontWeight="900" letterSpacing=".08em">POST PUBLISHED</Text>
            <Text mt="5px" maxW="100%" fontSize="17px" fontWeight="900" lineClamp={2}>{campaign.title}</Text>
            <Flex mt="13px" alignItems="center" gap="7px" px="9px" py="7px" border="3px solid #913E4B" borderRadius="999px" bgColor="#FBE3E5" color="#C84E5E" boxShadow="0 4px 0 rgba(145,62,75,.24)"><FiHeart size={18} fill="currentColor" /><Text fontFamily="monospace" fontSize="12px" fontWeight="900">+{lastPostReward}</Text></Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={150} alignItems="center" justifyContent="center" px="18px" bgColor="rgba(42,46,44,.8)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" p="20px" border="4px solid #323B38" borderRadius="15px" bgColor="#FFF" textAlign="center" boxShadow="8px 9px 0 rgba(35,41,38,.58)" animation={`${panelIn} 230ms ease both`}>
            <WorkButtonArtwork state="ready" width={220} />
            <Text mt="20px" color="#D25B68" fontSize="9px" fontWeight="900" letterSpacing=".15em">辦公遊戲方案 7</Text><Text mt="4px" fontSize="24px" fontWeight="900">把體力變成人氣</Text><Text mt="9px" color="#6E7974" fontSize="10px" fontWeight="800" lineHeight="1.65">按 WORK 增加體力；體力條滿後才會生成一個素材。點素材讓它飛進上方資料夾，滿足條件後 SEND 發佈貼文並獲得人氣。第一篇完成後可用人氣點亮 AI、稀有素材與應援品技能樹。</Text>
            <Grid mt="14px" w="100%" templateColumns="repeat(3, 1fr)" gap="7px"><Flex h="67px" direction="column" alignItems="center" justifyContent="center" gap="6px" border="2px solid #33758A" borderRadius="9px" bgColor="#DDF6FA"><FiZap size={20} /><Text fontSize="8px" fontWeight="900">按鍵充體力</Text></Flex><Flex h="67px" direction="column" alignItems="center" justifyContent="center" gap="6px" border="2px solid #8B7340" borderRadius="9px" bgColor="#FFF0B8"><FiArrowUp size={20} /><Text fontSize="8px" fontWeight="900">素材飛入袋</Text></Flex><Flex h="67px" direction="column" alignItems="center" justifyContent="center" gap="6px" border="2px solid #974753" borderRadius="9px" bgColor="#F8DADD"><FiHeart size={20} /><Text fontSize="8px" fontWeight="900">發佈賺人氣</Text></Flex></Grid>
            <Flex as="button" mt="17px" w="100%" h="49px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #276C7E" borderRadius="9px" bgColor="#35BDD7" color="white" boxShadow="0 5px 0 #276C7E" onClick={() => { playGameSfx("creatorStudioStart"); setPhase("playing"); }}><FiPlay size={17} fill="currentColor" /><Text fontSize="13px" fontWeight="900">開始第一篇 PO 文</Text></Flex><Text as="button" mt="10px" color="#8A938F" fontSize="9px" fontWeight="800" onClick={() => { playGameSfx("uiDialogContinue", { volumeScale: 0.6 }); onSkip(); }}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={155} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(41,45,43,.82)" backdropFilter="blur(6px)"><Flex w="100%" direction="column" alignItems="center" p="22px" border="4px solid #323B38" borderRadius="15px" bgColor="#FFF" textAlign="center" boxShadow="8px 9px 0 rgba(33,39,36,.58)" animation={`${panelIn} 230ms ease both`}><Flex w="76px" h="76px" alignItems="center" justifyContent="center" border="4px solid #913E4B" borderRadius="999px" bgColor="#E87580" color="white" boxShadow="0 6px 0 #913E4B"><FiHeart size={38} fill="currentColor" /></Flex><Text mt="15px" color="#D15A68" fontSize="9px" fontWeight="900" letterSpacing=".15em">KPI COMPLETE</Text><Text mt="4px" fontSize="25px" fontWeight="900">本季人氣達標</Text><Text mt="8px" color="#6C7772" fontSize="11px" fontWeight="800" lineHeight="1.55">完成 {CAMPAIGNS.length} 篇 PO 文、累積 {earnedPopularity} 人氣，共按下 WORK {pressCount} 次。</Text><Grid mt="14px" w="100%" templateColumns="repeat(3, 1fr)" gap="7px"><Flex h="80px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px solid #88948E" borderRadius="9px"><FiCpu size={21} /><Text fontSize="16px" fontWeight="900">{aiLevel > 0 ? `${(AI_INTERVALS[aiLevel] / 1000).toFixed(1)}s` : "OFF"}</Text><Text color="#78817D" fontSize="7px" fontWeight="900">AI CLICK</Text></Flex><Flex h="80px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px solid #88948E" borderRadius="9px"><FiStar size={21} /><Text fontSize="16px" fontWeight="900">{Math.round(qualityChance * 100)}%</Text><Text color="#78817D" fontSize="7px" fontWeight="900">稀有素材</Text></Flex><Flex h="80px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px solid #88948E" borderRadius="9px"><FiCoffee size={21} /><Text fontSize="16px" fontWeight="900">{Math.round(supportChance * 100)}%</Text><Text color="#78817D" fontSize="7px" fontWeight="900">應援機率</Text></Flex></Grid><Flex as="button" mt="18px" w="100%" h="49px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #315443" borderRadius="9px" bgColor="#58A77E" color="white" boxShadow="0 5px 0 #315443" onClick={() => { playGameSfx("uiDialogContinue"); onComplete(); }}><FiCheck size={18} /><Text fontSize="13px" fontWeight="900">完成</Text></Flex></Flex></Flex>
      ) : null}
    </Flex>
  );
}

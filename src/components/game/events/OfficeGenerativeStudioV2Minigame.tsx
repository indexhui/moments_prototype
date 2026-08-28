"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiCheck,
  FiCpu,
  FiFilm,
  FiHeart,
  FiImage,
  FiLock,
  FiMusic,
  FiPlay,
  FiRefreshCw,
  FiSliders,
  FiTrendingDown,
  FiTrendingUp,
  FiVideo,
  FiX,
  FiZap,
} from "react-icons/fi";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import { playGameSfx } from "@/lib/game/soundEffects";

type StudioPhase = "intro" | "playing" | "posting" | "complete";
type MediaKind = "video" | "music" | "image";
type UpgradeBranch = "quality" | "speed" | "agent";

type Campaign = {
  id: string;
  title: string;
  brief: string;
  prompt: string;
  baseViews: number;
  accent: string;
};

type GeneratedAsset = {
  id: number;
  kind: MediaKind;
  score: number;
  seed: number;
};

type GenerationJob = {
  id: number;
  kind: MediaKind;
  duration: number;
};

type TimelineState = Record<MediaKind, GeneratedAsset | null>;
type ProductionCounts = Record<MediaKind, number>;

const CAMPAIGNS_BY_LOCALE: Record<ExhibitionLocale, readonly Campaign[]> = {
  zh: [
    { id: "morning", title: "早晨限定", brief: "把清晨的好心情傳出去", prompt: "柔和晨光，商品旋轉特寫，輕快節奏，直式短影片", baseViews: 80, accent: "#63D8EA" },
    { id: "launch", title: "本週新品", brief: "讓大家忍不住停下來看", prompt: "快速開箱，微距質感，三段節奏剪輯，俐落電子配樂", baseViews: 110, accent: "#A98BE8" },
    { id: "story", title: "一個小故事", brief: "把真心變成可以分享的片刻", prompt: "日常紀錄感，手持鏡頭，溫暖顆粒，真誠旁白氛圍", baseViews: 145, accent: "#EF9B72" },
  ],
  ja: [
    { id: "morning", title: "朝限定", brief: "朝のごきげんをみんなに届けよう", prompt: "やわらかな朝日、商品の回転アップ、軽快なテンポ、縦型ショート動画", baseViews: 80, accent: "#63D8EA" },
    { id: "launch", title: "今週の新商品", brief: "思わずスクロールを止める映像に", prompt: "スピーディーな開封、質感の接写、三段テンポ編集、シャープな電子音楽", baseViews: 110, accent: "#A98BE8" },
    { id: "story", title: "小さな物語", brief: "心からの気持ちをシェアできる瞬間に", prompt: "日常ドキュメント、手持ちカメラ、暖かな粒子感、誠実なナレーション", baseViews: 145, accent: "#EF9B72" },
  ],
  en: [
    { id: "morning", title: "Morning Special", brief: "Share a little morning joy", prompt: "Soft morning light, rotating product close-up, upbeat rhythm, vertical short video", baseViews: 80, accent: "#63D8EA" },
    { id: "launch", title: "New This Week", brief: "Make everyone stop scrolling", prompt: "Fast unboxing, macro textures, three-beat edit, crisp electronic soundtrack", baseViews: 110, accent: "#A98BE8" },
    { id: "story", title: "A Little Story", brief: "Turn sincerity into a shareable moment", prompt: "Everyday documentary style, handheld camera, warm grain, sincere narration", baseViews: 145, accent: "#EF9B72" },
  ],
};

const STUDIO_COPY = {
  zh: {
    lockedKey: "這顆素材鍵還沒解鎖",
    finishCurrent: (code: string) => `先完成正在製作的 ${code}`,
    firstAssetDone: (code: string) => `${code} 完成・素材已放進作品中央`,
    extraAssetDone: (code: string) => `${code} 完成・作品多了一張小貼紙`,
    waitToPublish: "這次生成正在收尾，等一下再交件",
    musicUnlocked: "♪ AI MUSIC KEY UNLOCKED・配樂按鍵加入了",
    lastCampaign: "最後一個 Campaign 已載入",
    modelLocked: "發佈第一支短影片後解鎖 MODEL LAB",
    finishGeneration: "先完成目前正在生成的素材",
    imageNeeds: (amount: number) => `圖片生成還需要 ${amount} ECHO`,
    imageUnlocked: "✦ AI COVER KEY UNLOCKED・現在可以生成圖片",
    moreViews: (amount: number) => `還需要 ${amount} VIEWS`,
    audienceStayed: "觀眾停下來看了！",
    audienceLeft: "觀眾滑走了…",
    positiveDetail: "這個版本得到回響，人氣繼續增加",
    negativeDetail: "這次交得太早，人氣因此下降",
    qualityFloor: (score: number) => `品質底線 ${score}`,
    convergence: (ms: number) => `完成收斂 ${ms}ms`,
    introTitle: "一直按，作品就一直長",
    introBody: "看著成品自己決定要做多少；隨時都能按 Enter 交件，但太早送出可能會失去人氣。",
    skip: "略過 AI 回響花園",
    completeTitle: "人類今天也準時下班了",
    completeBody: "AI 完成了影片、配樂與自動剪輯。你做的事情，是決定何時再按一次。",
    finishWork: "完成今日行銷工作",
  },
  ja: {
    lockedKey: "この素材キーはまだ解放されていません",
    finishCurrent: (code: string) => `制作中の ${code} を先に完成させよう`,
    firstAssetDone: (code: string) => `${code} 完成・素材を作品の中央に配置しました`,
    extraAssetDone: (code: string) => `${code} 完成・作品にステッカーが増えました`,
    waitToPublish: "生成の仕上げ中です。少し待ってから投稿してください",
    musicUnlocked: "♪ AI MUSIC KEY UNLOCKED・音楽キーが追加されました",
    lastCampaign: "最後のキャンペーンを読み込みました",
    modelLocked: "最初のショート動画を投稿すると MODEL LAB が解放されます",
    finishGeneration: "生成中の素材を先に完成させよう",
    imageNeeds: (amount: number) => `画像生成にはあと ${amount} ECHO 必要です`,
    imageUnlocked: "✦ AI COVER KEY UNLOCKED・画像を生成できるようになりました",
    moreViews: (amount: number) => `あと ${amount} VIEWS 必要です`,
    audienceStayed: "視聴者が立ち止まった！",
    audienceLeft: "視聴者がスクロールしてしまった…",
    positiveDetail: "このバージョンに反響があり、人気が上がりました",
    negativeDetail: "投稿が早すぎて、人気が下がりました",
    qualityFloor: (score: number) => `品質の下限 ${score}`,
    convergence: (ms: number) => `仕上げ時間 ${ms}ms`,
    introTitle: "押すたびに、作品が育っていく",
    introBody: "完成形を見ながら、どこまで作るか決めよう。Enterでいつでも投稿できますが、早すぎると人気を失うことも。",
    skip: "AI エコーガーデンをスキップ",
    completeTitle: "今日も人間は定時に帰れました",
    completeBody: "AIが映像、音楽、自動編集を仕上げました。あなたが決めたのは、いつもう一度押すかです。",
    finishWork: "今日のマーケティング業務を終える",
  },
  en: {
    lockedKey: "This media key is still locked",
    finishCurrent: (code: string) => `Finish the current ${code} first`,
    firstAssetDone: (code: string) => `${code} complete · Asset placed in the reel`,
    extraAssetDone: (code: string) => `${code} complete · A new sticker was added`,
    waitToPublish: "This generation is wrapping up. Wait a moment before publishing.",
    musicUnlocked: "♪ AI MUSIC KEY UNLOCKED · Music key added",
    lastCampaign: "Final campaign loaded",
    modelLocked: "Publish your first short video to unlock MODEL LAB",
    finishGeneration: "Finish the asset currently being generated first",
    imageNeeds: (amount: number) => `Image generation needs ${amount} more ECHO`,
    imageUnlocked: "✦ AI COVER KEY UNLOCKED · You can now generate images",
    moreViews: (amount: number) => `${amount} more VIEWS needed`,
    audienceStayed: "The audience stopped to watch!",
    audienceLeft: "The audience scrolled away…",
    positiveDetail: "This version resonated, so your popularity grew",
    negativeDetail: "You delivered too early, so your popularity fell",
    qualityFloor: (score: number) => `Quality floor ${score}`,
    convergence: (ms: number) => `Final render ${ms}ms`,
    introTitle: "Keep pressing. Keep growing the reel.",
    introBody: "Watch the result and decide how far to take it. Press Enter to publish anytime, but publishing too early may cost popularity.",
    skip: "Skip AI Echo Garden",
    completeTitle: "The humans left work on time today",
    completeBody: "AI finished the video, music, and automatic edit. Your job was deciding when to press again.",
    finishWork: "Finish today's marketing work",
  },
} as const;

const MEDIA_SEQUENCE: readonly MediaKind[] = ["video", "music", "image"];
const FIRST_ENCOUNTER_KEY_COUNT = 2;

const MEDIA_META: Record<MediaKind, { code: string; label: string; lane: string; color: string; dark: string; icon: ReactNode }> = {
  video: { code: "VID", label: "AI VIDEO", lane: "V1・主影片", color: "#9B7AE3", dark: "#4C396F", icon: <FiVideo size={17} /> },
  music: { code: "BGM", label: "AI MUSIC", lane: "A1・配樂", color: "#E79A5F", dark: "#794A2C", icon: <FiMusic size={17} /> },
  image: { code: "IMG", label: "AI COVER", lane: "C1・封面", color: "#58BED4", dark: "#2A6473", icon: <FiImage size={17} /> },
};

const UPGRADE_COSTS: Record<UpgradeBranch, readonly number[]> = {
  quality: [60, 170, 380],
  speed: [80, 210, 440],
  agent: [120, 320, 680],
};

const FINALIZE_DURATIONS = [420, 330, 250, 180] as const;
const AGENT_INTERVALS = [0, 1350, 850, 520] as const;
const IMAGE_UNLOCK_COST = 80;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(15px) scale(.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const scanDown = keyframes`
  0% { top: 9%; opacity: 0; }
  18% { opacity: .9; }
  82% { opacity: .45; }
  100% { top: 88%; opacity: 0; }
`;

const diffusionNoise = keyframes`
  0% { background-position: 0 0, 0 0; filter: hue-rotate(0deg) brightness(.82); }
  50% { background-position: 17px -11px, -13px 9px; filter: hue-rotate(22deg) brightness(1.22); }
  100% { background-position: -9px 14px, 11px -15px; filter: hue-rotate(-8deg) brightness(.96); }
`;

const frameDrift = keyframes`
  0%, 100% { transform: translateX(-7px) scale(.94); opacity: .58; }
  50% { transform: translateX(8px) scale(1.04); opacity: 1; }
`;

const waveform = keyframes`
  0%, 100% { transform: scaleY(.34); }
  50% { transform: scaleY(1); }
`;

const viewFly = keyframes`
  0% { opacity: 0; transform: translate(-50%, 16px) scale(.55); }
  22% { opacity: 1; transform: translate(-50%, 0) scale(1.08); }
  70% { opacity: 1; transform: translate(-50%, -150px) scale(.82); }
  100% { opacity: 0; transform: translate(-50%, -260px) scale(.45); }
`;

const stickerLand = keyframes`
  0% { opacity: 0; transform: rotate(-8deg) translateY(12px) scale(.66); }
  72% { opacity: 1; transform: rotate(2deg) translateY(-2px) scale(1.06); }
  100% { opacity: 1; transform: rotate(0) translateY(0) scale(1); }
`;

const doodleWiggle = keyframes`
  0%, 100% { transform: rotate(-1.2deg) scale(1); }
  50% { transform: rotate(1.4deg) scale(1.025); }
`;

const happyHop = keyframes`
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-4px) rotate(4deg); }
`;

function MediaIcon({ kind, size = 17 }: { kind: MediaKind; size?: number }) {
  if (kind === "video") return <FiVideo size={size} />;
  if (kind === "music") return <FiMusic size={size} />;
  return <FiImage size={size} />;
}

function GenerationViewport({
  kind,
  job,
  stage,
  pulse,
}: {
  kind: MediaKind;
  job: GenerationJob | null;
  stage: number;
  pulse: number;
}) {
  const meta = MEDIA_META[kind];
  const visualStage = stage;
  const isGenerating = visualStage > 0;

  const videoFramesVisible = visualStage;
  const musicBarsVisible = Math.round(22 * (visualStage / 5));
  const imageTilesVisible = visualStage * 4;

  return (
    <Box position="relative" h="142px" flexShrink={0} border="3px solid #344449" borderRadius="14px 9px 16px 10px" bgColor="#0C1317" boxShadow="4px 4px 0 #BCAF98, inset 0 0 30px rgba(86,216,234,.05)" overflow="hidden">
      <Flex position="absolute" zIndex={8} left="8px" right="8px" top="7px" alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap="5px" color={meta.color}><MediaIcon kind={kind} size={11} /><Text fontFamily="monospace" fontSize="6px" fontWeight="900">{meta.label}</Text></Flex>
        <Flex alignItems="center" gap="4px" color={isGenerating ? "#F3CD69" : "#6BDFA8"}><Box w="5px" h="5px" borderRadius="999px" bgColor="currentColor" boxShadow="0 0 7px currentColor" /><Text fontFamily="monospace" fontSize="5px" fontWeight="900">{job ? "FINALIZING" : isGenerating ? "BUILDING" : "READY"}</Text></Flex>
      </Flex>

      {kind === "video" ? (
        <Flex position="absolute" inset="26px 10px 28px" alignItems="center" justifyContent="center" gap="5px" borderRadius="8px" bg="linear-gradient(145deg, #251C3C, #513C79 55%, #A16CA8)" overflow="hidden">
          {[0, 1, 2, 3, 4].map((frame) => {
            const visible = frame < videoFramesVisible;
            const colors = ["#7156A6", "#D47E86", "#4E9E99", "#D6A34F", "#677FC3"];
            return <Box key={frame} w="17%" h={`${48 + (frame % 3) * 15}%`} border="2px solid rgba(255,255,255,.62)" borderRadius="5px" bg={`linear-gradient(${125 + frame * 27}deg, rgba(255,255,255,.22), transparent), ${colors[frame]}`} opacity={visible ? 1 : 0} transform={visible ? "translateY(0) scale(1)" : "translateY(12px) scale(.72)"} transition={`opacity 180ms ease ${frame * 25}ms, transform 240ms cubic-bezier(.2,.8,.2,1) ${frame * 25}ms`} animation={visible && isGenerating ? `${frameDrift} ${620 + frame * 95}ms ease-in-out ${frame * 70}ms infinite` : undefined} />;
          })}
          <Flex position="absolute" w="42px" h="42px" alignItems="center" justifyContent="center" border="2px solid rgba(255,255,255,.8)" borderRadius="999px" bgColor="rgba(14,12,23,.56)" color="#FFF" opacity={visualStage >= 4 ? 1 : 0} transform={visualStage >= 4 ? "scale(1)" : "scale(.45)"} transition="opacity 220ms ease, transform 260ms cubic-bezier(.2,.8,.2,1)"><FiPlay size={18} fill="currentColor" /></Flex>
          {visualStage >= 5 ? <Box position="absolute" inset="0" border="3px solid rgba(212,246,255,.7)" borderRadius="8px" boxShadow="inset 0 0 24px rgba(143,224,239,.3)" /> : null}
        </Flex>
      ) : kind === "music" ? (
        <Flex position="absolute" inset="28px 12px 31px" alignItems="center" justifyContent="center" gap="3px" borderRadius="8px" bg="linear-gradient(145deg, #3A241C, #77492D 58%, #B97D4C)" overflow="hidden">
          {Array.from({ length: 22 }, (_, index) => {
            const visible = index < musicBarsVisible;
            return <Box key={index} w="3px" h={`${24 + ((index * 17) % 58)}%`} borderRadius="999px" bgColor={index % 3 === 0 ? "#FFE28C" : "#F3AE75"} opacity={visible ? 1 : 0} transformOrigin="center" transform={visible ? "scaleY(1)" : "scaleY(.08)"} transition={`opacity 130ms ease ${index * 10}ms, transform 190ms cubic-bezier(.2,.8,.2,1) ${index * 10}ms`} animation={visible && isGenerating ? `${waveform} ${360 + (index % 5) * 70}ms ease-in-out ${index * 25}ms infinite` : undefined} />;
          })}
          <Text position="absolute" bottom="6px" color="rgba(255,255,255,.76)" fontFamily="monospace" fontSize="5px" fontWeight="900">GENERATIVE STEMS・120 BPM</Text>
        </Flex>
      ) : (
        <Box position="absolute" inset="28px 12px 31px" borderRadius="8px" bgColor="#172428" overflow="hidden">
          <Grid position="absolute" inset="0" templateColumns="repeat(5, 1fr)" templateRows="repeat(4, 1fr)" gap="2px" p="2px">
            {Array.from({ length: 20 }, (_, index) => {
              const revealOrder = (index * 7) % 20;
              const visible = revealOrder < imageTilesVisible;
              const colors = ["#5FC5D7", "#DE7489", "#E2BB62", "#796CC2", "#65AE91"];
              return <Box key={index} borderRadius="2px" bg={`linear-gradient(${120 + index * 17}deg, rgba(255,255,255,.28), transparent), ${colors[index % colors.length]}`} opacity={visible ? 1 : 0} transform={visible ? "scale(1)" : "scale(.45)"} filter={visible && visualStage < 5 ? "blur(1.2px)" : "blur(0)"} transition={`opacity 170ms ease ${revealOrder * 8}ms, transform 230ms cubic-bezier(.2,.8,.2,1) ${revealOrder * 8}ms, filter 240ms ease`} animation={visible && isGenerating ? `${diffusionNoise} ${520 + (index % 4) * 70}ms steps(3, end) infinite` : undefined} />;
            })}
          </Grid>
          <Flex position="absolute" inset="0" alignItems="center" justifyContent="center" color="#E9FFFF" opacity={visualStage >= 4 ? 1 : 0} transform={visualStage >= 4 ? "scale(1)" : "scale(.55)"} transition="opacity 220ms ease, transform 260ms cubic-bezier(.2,.8,.2,1)"><FiImage size={38} /></Flex>
        </Box>
      )}

      {isGenerating ? <Box key={`scan-${pulse}`} position="absolute" zIndex={7} left="7px" right="7px" top="14%" h="2px" bgColor="#D9FDFF" boxShadow="0 0 13px #D9FDFF" animation={`${scanDown} 520ms ease-in-out 1 both`} /> : null}

      <Flex position="absolute" left="9px" right="9px" bottom="7px" h="14px" alignItems="center" gap="6px">
        <Box position="relative" flex="1" h="5px" borderRadius="999px" bgColor="#26353A" overflow="hidden">
          <Box position="absolute" insetY="0" left="0" w={`${visualStage * 20}%`} borderRadius="999px" bg={`linear-gradient(90deg, ${meta.color}, #D8FCFF)`} boxShadow={visualStage > 0 ? `0 0 10px ${meta.color}` : "none"} transition="width 220ms cubic-bezier(.2,.8,.2,1)" />
        </Box>
          <Text minW="45px" color="#89A1A6" fontFamily="monospace" fontSize="5px" fontWeight="900" textAlign="right">{job ? "FINALIZING" : visualStage > 0 ? "ASSEMBLING" : "STANDBY"}</Text>
      </Flex>
    </Box>
  );
}

function ReelLayerSticker({
  kind,
  index,
}: {
  kind: MediaKind;
  index: number;
}) {
  const meta = MEDIA_META[kind];
  const layouts: Record<MediaKind, Array<{ top?: string; right?: string; bottom?: string; left?: string; w: string; h: string; rotate: number }>> = {
    video: [
      { left: "23px", top: "59px", w: "46px", h: "29px", rotate: -5 },
      { left: "70px", top: "28px", w: "29px", h: "29px", rotate: 8 },
      { left: "20px", top: "108px", w: "39px", h: "31px", rotate: 5 },
      { left: "68px", top: "151px", w: "31px", h: "31px", rotate: -8 },
      { left: "29px", bottom: "24px", w: "42px", h: "28px", rotate: 6 },
      { left: "85px", bottom: "73px", w: "25px", h: "25px", rotate: -10 },
      { left: "84px", top: "77px", w: "27px", h: "27px", rotate: 11 },
    ],
    music: [
      { left: "22px", bottom: "53px", w: "46px", h: "29px", rotate: 3 },
      { left: "76px", bottom: "20px", w: "29px", h: "29px", rotate: -7 },
      { right: "73px", bottom: "19px", w: "31px", h: "31px", rotate: 8 },
      { right: "22px", bottom: "58px", w: "39px", h: "30px", rotate: -5 },
      { right: "76px", top: "149px", w: "29px", h: "29px", rotate: 10 },
      { left: "84px", bottom: "105px", w: "26px", h: "26px", rotate: -12 },
      { right: "87px", bottom: "96px", w: "25px", h: "25px", rotate: 6 },
    ],
    image: [
      { right: "23px", top: "59px", w: "46px", h: "29px", rotate: 5 },
      { right: "70px", top: "28px", w: "29px", h: "29px", rotate: -8 },
      { right: "20px", top: "108px", w: "39px", h: "31px", rotate: -5 },
      { right: "68px", top: "151px", w: "31px", h: "31px", rotate: 8 },
      { right: "29px", bottom: "24px", w: "42px", h: "28px", rotate: -6 },
      { right: "84px", top: "78px", w: "26px", h: "26px", rotate: 12 },
      { right: "84px", bottom: "74px", w: "27px", h: "27px", rotate: -10 },
    ],
  };
  const glyphs: Record<MediaKind, readonly string[]> = {
    video: [meta.code, "▶", "▣", "REC", "✦", "●", "▸"],
    music: [meta.code, "♪", "♫", "≋", "BEAT", "♬", "●"],
    image: [meta.code, "✦", "☀", "▧", "COLOR", "◆", "♥"],
  };
  const layout = layouts[kind][index];
  const isLabel = index === 0;
  return (
    <Flex position="absolute" zIndex={5 + index} top={layout.top} right={layout.right} bottom={layout.bottom} left={layout.left} w={layout.w} h={layout.h} alignItems="center" justifyContent="center" gap={isLabel ? "3px" : "5px"} px="3px" border="3px solid #344449" borderRadius={isLabel ? "9px 6px 10px 7px" : index % 2 === 0 ? "45% 55% 48% 52%" : "8px 12px 7px 11px"} bgColor={meta.color} color="#FFF" boxShadow="3px 4px 0 rgba(52,68,73,.28)" transform={`rotate(${layout.rotate}deg)`} animation={`${stickerLand} ${260 + index * 45}ms ease both`}>
      {isLabel ? <MediaIcon kind={kind} size={11} /> : null}
      <Text fontFamily="monospace" fontSize={isLabel ? "6px" : glyphs[kind][index].length > 2 ? "5px" : "12px"} fontWeight="900" lineHeight="1">{glyphs[kind][index]}</Text>
    </Flex>
  );
}

function ReelCollage({
  timeline,
  productionCounts,
  accent,
  pulse,
}: {
  timeline: TimelineState;
  productionCounts: ProductionCounts;
  accent: string;
  pulse: number;
}) {
  const stickerCount = (kind: MediaKind) => {
    if (!timeline[kind]) return 0;
    return Math.min(7, Math.max(0, productionCounts[kind] - 1));
  };
  const videoStickerCount = stickerCount("video");
  const musicStickerCount = stickerCount("music");
  const imageStickerCount = stickerCount("image");
  const filledCount = MEDIA_SEQUENCE.filter((kind) => timeline[kind]).length;
  const imageReady = Boolean(timeline.image);
  const videoReady = Boolean(timeline.video);
  const musicReady = Boolean(timeline.music);
  const videoCutCount = videoReady ? Math.min(6, 4 + Math.floor(videoStickerCount / 2)) : 0;
  const musicBarCount = musicReady ? 14 : 0;
  const imageShapeCount = imageReady ? 6 : 0;
  return (
    <Flex position="relative" flex="1" minH="0" alignItems="center" justifyContent="center" border="3px dashed #8E887C" borderRadius="17px 11px 20px 10px" bg="repeating-linear-gradient(0deg, rgba(91,82,68,.035) 0 1px, transparent 1px 5px), #EFE5CF" overflow="hidden">
      <Text position="absolute" left="10px" top="8px" color="#80786B" fontFamily="monospace" fontSize="6px" fontWeight="900">YOUR REEL PREVIEW</Text>
      <Box key={`reel-${pulse}`} position="relative" w="132px" h="206px" mt="9px" border="4px solid #344449" borderRadius="17px 10px 19px 12px" bg={imageReady ? `linear-gradient(145deg, ${accent}, #F49A89 52%, #FFE29B)` : videoReady ? "linear-gradient(150deg, #7565B9, #B17DB9 54%, #EFB06E)" : musicReady ? "linear-gradient(150deg, #B96F45, #EBA465 56%, #FFE39B)" : "#FFF9E9"} boxShadow="9px 10px 0 rgba(52,68,73,.25)" transform="rotate(-1.5deg)" animation={filledCount > 0 ? `${doodleWiggle} 720ms ease-in-out 1` : undefined} overflow="hidden">
        {!videoReady && !imageReady ? <Flex position="absolute" inset="17px" alignItems="center" justifyContent="center" border="3px dashed #B7AD9B" borderRadius="11px" color="#B1A694"><FiFilm size={37} /></Flex> : null}
        {imageReady ? Array.from({ length: imageShapeCount }, (_, index) => {
          const colors = ["rgba(255,255,255,.5)", "rgba(76,67,111,.24)", "rgba(87,202,210,.38)", "rgba(255,224,134,.52)", "rgba(233,105,127,.34)", "rgba(255,255,255,.3)"];
          const positions = [{ left: 10, top: 14 }, { left: 72, top: 49 }, { left: 18, top: 93 }, { left: 79, top: 122 }, { left: 9, top: 145 }, { left: 67, top: 12 }];
          const position = positions[index];
          return <Box key={`image-shape-${index}`} position="absolute" left={`${position.left}px`} top={`${position.top}px`} w={`${38 + (index % 3) * 11}px`} h={`${28 + ((index + 1) % 3) * 12}px`} borderRadius={index % 2 === 0 ? "45% 55% 50% 43%" : "52% 48% 42% 58%"} bgColor={colors[index]} transform={`rotate(${index % 2 === 0 ? -9 : 8}deg)`} animation={`${stickerLand} ${260 + index * 45}ms ease both`} />;
        }) : null}
        {videoReady ? <><Grid position="absolute" left="10px" right="10px" top="12px" bottom={musicReady ? "58px" : "12px"} templateColumns="repeat(2, 1fr)" gap="5px">{Array.from({ length: videoCutCount }, (_, index) => <Box key={`video-cut-${index}`} border="2px solid rgba(255,255,255,.76)" borderRadius="7px 4px 8px 5px" bg={`linear-gradient(${125 + index * 31}deg, rgba(255,255,255,.34), transparent), ${["#7C6FC7", "#E98291", "#5EB7BF", "#F1BC64", "#9575B9", "#67A58B"][index]}`} opacity={.78} transform={`rotate(${index % 2 === 0 ? -2 : 2}deg)`} />)}</Grid><Flex position="absolute" inset="0" alignItems="center" justifyContent="center" pb={musicReady ? "35px" : "0"}><Flex w="58px" h="58px" alignItems="center" justifyContent="center" border="4px solid #344449" borderRadius="999px" bgColor="#FFF9E9" color="#344449" boxShadow="4px 5px 0 rgba(52,68,73,.25)"><FiPlay size={25} fill="currentColor" /></Flex></Flex><Box position="absolute" left="0" right="0" top="48%" h="3px" bgColor="rgba(255,255,255,.72)" boxShadow="0 0 9px rgba(255,255,255,.7)" /></> : null}
        {musicReady ? <><Flex position="absolute" left="9px" right="9px" bottom={!videoReady && !imageReady ? "55px" : "9px"} h={!videoReady && !imageReady ? "82px" : "45px"} alignItems="center" justifyContent="center" gap="2px" px="5px" border="4px solid #344449" borderRadius="12px 7px 11px 8px" bgColor="#FFF5C3">{Array.from({ length: musicBarCount }, (_, index) => <Box key={`music-bar-${index}`} w="3px" h={`${11 + ((index * 13) % 28)}px`} borderRadius="999px" bgColor={index % 3 === 0 ? "#E37762" : "#F0A25F"} animation={`${waveform} ${380 + (index % 4) * 70}ms ease-in-out ${index * 24}ms infinite`} />)}</Flex><Text position="absolute" left="8px" top="6px" color="#FFF5C3" fontSize="20px" fontWeight="900" animation={`${happyHop} 680ms ease-in-out infinite`}>♪</Text><Text position="absolute" right="7px" top="34px" color="#FFF5C3" fontSize="15px" fontWeight="900" animation={`${happyHop} 820ms ease-in-out infinite`}>♫</Text></> : null}
        {imageReady ? <Text position="absolute" right="8px" top="7px" color="#FFF" fontSize="18px" fontWeight="900" textShadow="0 2px 0 rgba(52,68,73,.3)">✦</Text> : null}
      </Box>
      {Array.from({ length: videoStickerCount }, (_, index) => <ReelLayerSticker key={`video-sticker-${index}`} kind="video" index={index} />)}
      {Array.from({ length: musicStickerCount }, (_, index) => <ReelLayerSticker key={`music-sticker-${index}`} kind="music" index={index} />)}
      {Array.from({ length: imageStickerCount }, (_, index) => <ReelLayerSticker key={`image-sticker-${index}`} kind="image" index={index} />)}
      {filledCount >= 1 ? <FiHeart style={{ position: "absolute", left: 102, bottom: 23, color: "#E76F7C", transform: "rotate(-14deg)" }} size={23} fill="currentColor" /> : null}
      {filledCount >= 2 ? <FiHeart style={{ position: "absolute", right: 101, top: 37, color: "#6CBBC7", transform: "rotate(11deg)" }} size={18} fill="currentColor" /> : null}
      <Text position="absolute" right="12px" bottom="12px" color="#7E766A" fontFamily="monospace" fontSize="6px" fontWeight="900" transform="rotate(-3deg)">YOU DECIDE WHEN IT'S DONE ↗</Text>
    </Flex>
  );
}

function GeneratorKeyboard({
  nextKind,
  stage,
  job,
  visibleKeyCount,
  imageUnlocked,
  canUnlockImage,
  onGenerate,
  onUnlockImage,
  onSubmit,
}: {
  nextKind: MediaKind;
  stage: number;
  job: GenerationJob | null;
  visibleKeyCount: number;
  imageUnlocked: boolean;
  canUnlockImage: boolean;
  onGenerate: (kind: MediaKind) => void;
  onUnlockImage: () => void;
  onSubmit: () => void;
}) {
  const visibleKinds = MEDIA_SEQUENCE.slice(0, visibleKeyCount);
  const currentMeta = MEDIA_META[nextKind];

  return (
    <Grid mt="auto" h="74px" flexShrink={0} templateColumns={`repeat(${visibleKeyCount}, minmax(0, 1fr)) 112px`} gap="6px" alignItems="stretch">
      {visibleKinds.map((kind, index) => {
        const meta = MEDIA_META[kind];
        const locked = kind === "image" && !imageUnlocked;
        const building = stage > 0 && kind === nextKind;
        const enabled = locked ? !job && stage === 0 : !job && (stage === 0 || building);
        const rotation = index % 2 === 0 ? -.6 : .6;
        return (
          <Box key={kind} as="button" position="relative" minW="0" h="74px" border="3px solid #26383D" borderRadius={index % 2 === 0 ? "13px 8px 15px 9px" : "8px 14px 9px 13px"} bgColor="#26383D" opacity={enabled ? 1 : .48} boxShadow={enabled ? "1px 6px 0 #18282C" : "0 3px 0 #9C927F"} transform={`rotate(${rotation}deg)`} transition="transform 80ms ease, box-shadow 80ms ease" _active={enabled ? { transform: `translateY(5px) rotate(${rotation}deg)`, boxShadow: "0 1px 0 #18282C" } : undefined} animation={`${stickerLand} 280ms ease both`} onClick={enabled ? locked ? onUnlockImage : () => onGenerate(kind) : undefined} aria-label={locked ? `UNLOCK ${meta.label} FOR ${IMAGE_UNLOCK_COST} ECHO` : `${enabled ? "BUILD" : "WAIT"} ${meta.label}`}>
            <Flex position="absolute" inset="3px 3px 8px" direction="column" alignItems="center" justifyContent="center" gap="3px" border="2px solid rgba(255,255,255,.72)" borderBottomColor="rgba(31,48,53,.55)" borderRadius={index % 2 === 0 ? "9px 5px 10px 6px" : "5px 10px 6px 9px"} bg={locked ? `linear-gradient(160deg, rgba(255,255,255,.16), transparent 42%), ${canUnlockImage ? "#548995" : "#827F78"}` : `linear-gradient(160deg, rgba(255,255,255,.23), transparent 42%), ${meta.color}`} color="#FFF" boxShadow={building ? `inset 0 0 0 3px rgba(255,244,174,.45), 0 0 13px ${meta.color}` : "inset 0 2px 0 rgba(255,255,255,.26)"}>
              <Box position="absolute" left="6px" top="5px" w="8px" h="3px" borderRadius="999px" bgColor="rgba(255,255,255,.72)" />
              {locked ? <FiLock size={16} /> : <MediaIcon kind={kind} size={18} />}
              <Text fontFamily="monospace" fontSize="9px" fontWeight="900" lineHeight="1">{meta.code}</Text>
              <Text fontFamily="monospace" fontSize="4px" fontWeight="900" opacity={.84}>{locked ? `♥ ${IMAGE_UNLOCK_COST}` : building ? "PRESSING" : "GENERATE"}</Text>
            </Flex>
          </Box>
        );
      })}
      <Box as="button" position="relative" h="74px" border="3px solid #713744" borderRadius="9px 15px 8px 13px" bgColor="#713744" opacity={job ? .52 : 1} boxShadow={job ? "0 3px 0 #9C927F" : "1px 7px 0 #713744"} transform="rotate(.5deg)" transition="transform 80ms ease, box-shadow 80ms ease" _active={!job ? { transform: "translateY(5px) rotate(.5deg)", boxShadow: "0 2px 0 #713744" } : undefined} onClick={onSubmit} aria-label="PRESS ENTER TO SEND REEL">
        <Flex position="absolute" inset="3px 3px 9px" direction="column" alignItems="center" justifyContent="center" border="2px solid rgba(255,255,255,.76)" borderBottomColor="rgba(113,55,68,.7)" borderRadius="6px 11px 5px 10px" bg={job ? "#B8AD9C" : "linear-gradient(155deg, #F79AAD, #E96580)"} color={job ? "#70685D" : "#FFF"} boxShadow="inset 0 2px 0 rgba(255,255,255,.3)">
          <Text position="absolute" left="7px" top="5px" fontFamily="monospace" fontSize="4px" fontWeight="900">RETURN</Text>
          <Text fontFamily="monospace" fontSize="17px" fontWeight="900" lineHeight="1">ENTER ↵</Text>
          <Text mt="5px" fontFamily="monospace" fontSize="5px" fontWeight="900">{job ? `WAIT・${currentMeta.code}` : "DELIVER REEL"}</Text>
        </Flex>
      </Box>
    </Grid>
  );
}

function UpgradeRow({
  title,
  detail,
  level,
  cost,
  icon,
  affordable,
  onClick,
}: {
  title: string;
  detail: string;
  level: number;
  cost: number | null;
  icon: ReactNode;
  affordable: boolean;
  onClick: () => void;
}) {
  return (
    <Flex as="button" w="100%" minH="66px" alignItems="center" gap="10px" px="10px" py="8px" border={`2px solid ${affordable ? "#67DCEA" : "#405057"}`} borderRadius="9px" bgColor="#182328" color="#EFF8F7" onClick={onClick}>
      <Flex w="38px" h="38px" flexShrink={0} alignItems="center" justifyContent="center" borderRadius="9px" bgColor={level > 0 ? "#366C76" : "#2A383E"} color={level > 0 ? "#8AF2F5" : "#6C7C81"}>{icon}</Flex>
      <Flex flex="1" minW="0" direction="column" alignItems="flex-start"><Text fontFamily="monospace" fontSize="9px" fontWeight="900">{title}・LV {level}</Text><Text mt="3px" color="#82969B" fontSize="7px" fontWeight="800">{detail}</Text></Flex>
      <Flex minW="53px" h="27px" alignItems="center" justifyContent="center" gap="3px" px="7px" borderRadius="999px" bgColor="#0F171A" color={cost === null ? "#65757A" : affordable ? "#F3D06D" : "#718186"}><FiTrendingUp size={9} /><Text fontFamily="monospace" fontSize="7px" fontWeight="900">{cost ?? "MAX"}</Text></Flex>
    </Flex>
  );
}

export function OfficeGenerativeStudioV2Minigame({
  locale = "zh",
  onComplete,
  onSkip,
}: {
  locale?: ExhibitionLocale;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const copy = STUDIO_COPY[locale];
  const campaigns = CAMPAIGNS_BY_LOCALE[locale];
  const [phase, setPhase] = useState<StudioPhase>("intro");
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [views, setViews] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [timeline, setTimeline] = useState<TimelineState>({ video: null, music: null, image: null });
  const [productionCounts, setProductionCounts] = useState<ProductionCounts>({ video: 0, music: 0, image: 0 });
  const [imageUnlocked, setImageUnlocked] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [nextKind, setNextKind] = useState<MediaKind>("video");
  const [generationStage, setGenerationStage] = useState(0);
  const [generationPulse, setGenerationPulse] = useState(0);
  const [timelinePulse, setTimelinePulse] = useState(0);
  const [qualityLevel, setQualityLevel] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(0);
  const [agentLevel, setAgentLevel] = useState(0);
  const [modelOpen, setModelOpen] = useState(false);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);
  const [postingReward, setPostingReward] = useState(0);
  const [postingScore, setPostingScore] = useState(0);
  const [manualGenerations, setManualGenerations] = useState(0);
  const [agentGenerations, setAgentGenerations] = useState(0);

  const generationIdRef = useRef(0);
  const generationStageRef = useRef(0);
  const finalizingRef = useRef(false);
  const clickIdRef = useRef(0);
  const noticeIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const generateRef = useRef<(source?: "manual" | "agent", requestedKind?: MediaKind) => void>(() => undefined);
  const campaign = campaigns[campaignIndex];
  const modelUnlocked = publishedCount >= 1;
  const visibleKeyCount = Math.min(FIRST_ENCOUNTER_KEY_COUNT, campaignIndex + 1);
  const unlockedCount = visibleKeyCount === 3 && !imageUnlocked ? 2 : visibleKeyCount;
  const requiredKinds = MEDIA_SEQUENCE.slice(0, unlockedCount);
  const completedKinds = requiredKinds.filter((kind) => timeline[kind]);
  const averageScore = completedKinds.length > 0
    ? Math.round(completedKinds.reduce((sum, kind) => sum + (timeline[kind]?.score ?? 0), 0) / completedKinds.length)
    : 0;
  const deliveryScore = Math.round(averageScore * (completedKinds.length / requiredKinds.length));

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const showNotice = useCallback((text: string) => {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, text });
  }, []);

  const generateAsset = useCallback((source: "manual" | "agent" = "manual", requestedKind?: MediaKind) => {
    if (phase !== "playing" || job || finalizingRef.current || modelOpen) return;
    const requested = requestedKind ?? nextKind;
    if (!MEDIA_SEQUENCE.slice(0, unlockedCount).includes(requested)) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.lockedKey);
      return;
    }
    if (generationStageRef.current > 0 && requested !== nextKind) {
      playGameSfx("creatorStudioDenied", { volumeScale: .7 });
      showNotice(copy.finishCurrent(MEDIA_META[nextKind].code));
      return;
    }
    clickIdRef.current += 1;
    const clickId = clickIdRef.current;
    const kind = generationStageRef.current > 0 ? nextKind : requested;
    setNextKind(kind);
    const nextStage = Math.min(5, generationStageRef.current + 1);
    generationStageRef.current = nextStage;
    setGenerationStage(nextStage);
    setGenerationPulse((value) => value + 1);
    if (source === "manual") setManualGenerations((value) => value + 1);
    else setAgentGenerations((value) => value + 1);
    playGameSfx("creatorStudioWorkTap", { volumeScale: source === "agent" ? .38 : .75, playbackRate: source === "agent" ? 1.12 : .98 + (clickId % 4) * .025 });

    if (nextStage < 5) return;

    generationIdRef.current += 1;
    const id = generationIdRef.current;
    const duration = FINALIZE_DURATIONS[speedLevel];
    finalizingRef.current = true;
    setJob({ id, kind, duration });

    const timer = window.setTimeout(() => {
      const qualityFloor = 64 + qualityLevel * 7;
      const score = Math.min(99, qualityFloor + Math.floor(Math.random() * (29 - qualityLevel * 3)));
      const asset: GeneratedAsset = { id, kind, score, seed: 1000 + id * 37 };
      const isFirstProduction = productionCounts[kind] === 0;
      const existing = timeline[kind];
      const nextTimeline = existing && existing.score > score ? timeline : { ...timeline, [kind]: asset };
      setTimeline(nextTimeline);
      setProductionCounts((value) => ({ ...value, [kind]: value[kind] + 1 }));
      setTimelinePulse((value) => value + 1);
      setNextKind(requiredKinds.find((candidate) => !nextTimeline[candidate]) ?? kind);
      generationStageRef.current = 0;
      setGenerationStage(0);
      finalizingRef.current = false;
      setJob(null);
      playGameSfx(score >= 90 ? "creatorStudioMaterialRare" : "creatorStudioMaterialReady");
      showNotice(isFirstProduction ? copy.firstAssetDone(MEDIA_META[kind].code) : copy.extraAssetDone(MEDIA_META[kind].code));
    }, duration);
    timersRef.current.push(timer);
  }, [copy, job, modelOpen, nextKind, phase, productionCounts, qualityLevel, requiredKinds, showNotice, speedLevel, timeline, unlockedCount]);

  useEffect(() => {
    generateRef.current = generateAsset;
  }, [generateAsset]);

  useEffect(() => {
    if (agentLevel === 0 || phase !== "playing" || modelOpen) return;
    const interval = window.setInterval(() => generateRef.current("agent"), AGENT_INTERVALS[agentLevel]);
    return () => window.clearInterval(interval);
  }, [agentLevel, modelOpen, phase]);

  const publish = useCallback(() => {
    if (phase !== "playing") return;
    if (job || finalizingRef.current) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.waitToPublish);
      return;
    }
    const reward = Math.round(campaign.baseViews * ((deliveryScore - 40) / 45));
    setPostingReward(reward);
    setPostingScore(deliveryScore);
    generationStageRef.current = 0;
    setGenerationStage(0);
    setPhase("posting");
    playGameSfx("creatorStudioPostSend");

    const rewardTimer = window.setTimeout(() => {
      setViews((value) => value + reward);
      setTotalViews((value) => value + reward);
      setPublishedCount((value) => value + 1);
      playGameSfx(reward >= 0 ? "creatorStudioPopularityGain" : "creatorStudioDenied", { playbackRate: deliveryScore >= 90 ? 1.12 : 1, volumeScale: reward >= 0 ? 1 : .7 });
    }, 620);
    const nextTimer = window.setTimeout(() => {
      if (campaignIndex >= campaigns.length - 1) {
        setPhase("complete");
        playGameSfx("creatorStudioKpiComplete");
        return;
      }
      setCampaignIndex((value) => value + 1);
      setTimeline({ video: null, music: null, image: null });
      setProductionCounts({ video: 0, music: 0, image: 0 });
      setNextKind("video");
      generationStageRef.current = 0;
      finalizingRef.current = false;
      setGenerationStage(0);
      setPhase("playing");
      if (campaignIndex === 0) showNotice(copy.musicUnlocked);
      else showNotice(copy.lastCampaign);
    }, 1180);
    timersRef.current.push(rewardTimer, nextTimer);
  }, [campaign.baseViews, campaignIndex, campaigns.length, copy, deliveryScore, job, phase, showNotice]);

  useEffect(() => {
    if (phase !== "playing" || modelOpen) return;
    const handleEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("button, input, textarea, [contenteditable='true']")) return;
      event.preventDefault();
      publish();
    };
    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, [modelOpen, phase, publish]);

  const openModelLab = useCallback(() => {
    if (!modelUnlocked) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.modelLocked);
      return;
    }
    playGameSfx("creatorStudioSkillOpen");
    setModelOpen(true);
  }, [copy, modelUnlocked, showNotice]);

  const unlockImage = useCallback(() => {
    if (imageUnlocked) return;
    if (job || finalizingRef.current || generationStageRef.current > 0) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.finishGeneration);
      return;
    }
    if (views < IMAGE_UNLOCK_COST) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.imageNeeds(IMAGE_UNLOCK_COST - views));
      return;
    }
    setViews((value) => value - IMAGE_UNLOCK_COST);
    setImageUnlocked(true);
    playGameSfx("creatorStudioSkillUpgrade", { playbackRate: 1.08 });
    showNotice(copy.imageUnlocked);
  }, [copy, imageUnlocked, job, showNotice, views]);

  const upgrade = useCallback((branch: UpgradeBranch) => {
    const level = branch === "quality" ? qualityLevel : branch === "speed" ? speedLevel : agentLevel;
    if (level >= 3) {
      playGameSfx("creatorStudioDenied", { volumeScale: .7 });
      return;
    }
    const cost = UPGRADE_COSTS[branch][level];
    if (views < cost) {
      playGameSfx("creatorStudioDenied");
      showNotice(copy.moreViews(cost - views));
      return;
    }
    setViews((value) => value - cost);
    if (branch === "quality") setQualityLevel((value) => value + 1);
    if (branch === "speed") setSpeedLevel((value) => value + 1);
    if (branch === "agent") setAgentLevel((value) => value + 1);
    playGameSfx("creatorStudioSkillUpgrade", { playbackRate: 1 + level * .06 });
    showNotice(branch === "quality" ? "PROMPT IQ UPGRADED" : branch === "speed" ? "TURBO RENDER UPGRADED" : "AI AGENT ENABLED");
  }, [agentLevel, copy, qualityLevel, showNotice, speedLevel, views]);

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#F2E8D4" color="#2E3C40" data-office-generative-studio-v2={phase}>
      <Box position="absolute" inset="0" bg="radial-gradient(circle at 78% 18%, rgba(243,169,139,.19), transparent 29%), radial-gradient(circle at 16% 74%, rgba(91,194,207,.15), transparent 32%), repeating-linear-gradient(0deg, rgba(73,60,43,.035) 0 1px, transparent 1px 6px), #F2E8D4" />

      <Flex position="relative" zIndex={10} h="72px" flexShrink={0} alignItems="center" gap="8px" px="9px" py="8px" borderBottom="3px solid #344449" bgColor="rgba(255,249,232,.92)">
        <Flex flex="1" h="53px" alignItems="center" gap="8px" px="9px" border="3px solid #344449" borderRadius="14px 10px 16px 9px" bgColor="#FFF8E8" boxShadow="3px 3px 0 #C7B99F">
          <Flex w="33px" h="33px" alignItems="center" justifyContent="center" border="2px solid #344449" borderRadius="52% 48% 45% 55%" bgColor="#F38B8E" color="#FFF" transform="rotate(-5deg)"><FiHeart size={15} fill="currentColor" /></Flex>
          <Flex minW="55px" direction="column"><Text color="#857A6B" fontFamily="monospace" fontSize="5px" fontWeight="900">HAPPY ECHO</Text><Text mt="1px" fontFamily="monospace" fontSize="18px" fontWeight="900" lineHeight="1">{views}</Text></Flex>
          <Flex ml="auto" alignItems="flex-end" gap="2px">{Array.from({ length: 5 }, (_, index) => { const awake = index < Math.min(5, publishedCount + 1); return <Flex key={index} w="14px" h={`${17 + (index % 3) * 4}px`} alignItems="center" justifyContent="center" border="1.5px solid #344449" borderRadius="50% 50% 42% 45%" bgColor={awake ? ["#66C8D6", "#F3B566", "#E98492", "#9C89DB", "#73C69A"][index] : "#E5DAC4"} opacity={awake ? 1 : .48} transform={`rotate(${index % 2 === 0 ? -5 : 5}deg)`}>{awake ? <Text color="#344449" fontSize="6px" fontWeight="900">•ᴗ•</Text> : null}</Flex>; })}</Flex>
        </Flex>
        <Flex as="button" h="53px" minW="111px" alignItems="center" justifyContent="center" gap="6px" px="8px" border="3px solid #344449" borderRadius="10px 15px 9px 13px" bgColor={modelUnlocked ? "#DDD2FF" : "#E7DDC9"} color={modelUnlocked ? "#544681" : "#91897A"} boxShadow="3px 3px 0 #C7B99F" transform="rotate(1deg)" onClick={openModelLab}>{modelUnlocked ? <FiSliders size={15} /> : <FiLock size={14} />}<Flex direction="column" alignItems="flex-start"><Text fontFamily="monospace" fontSize="8px" fontWeight="900">AI TOOLBOX</Text><Text mt="2px" fontFamily="monospace" fontSize="5px" fontWeight="900">Q{qualityLevel}・S{speedLevel}・A{agentLevel}</Text></Flex></Flex>
      </Flex>

      <Flex position="relative" zIndex={8} h="340px" flexShrink={0} direction="column" gap="5px" mx="9px" mt="7px" p="8px" border="3px solid #344449" borderRadius="17px 11px 20px 10px" bgColor="#FFF8E8" boxShadow="5px 6px 0 #C6B89D">
        <Flex h="28px" alignItems="center" justifyContent="space-between"><Flex minW="0" direction="column"><Text color="#8A7E6B" fontFamily="monospace" fontSize="5px" fontWeight="900">REEL GARDEN・PATCH {campaignIndex + 1}/{campaigns.length}</Text><Text mt="1px" fontSize="11px" fontWeight="900" lineClamp={1}>{campaign.title}｜<Text as="span" color="#786F62" fontSize="8px">{campaign.brief}</Text></Text></Flex><Flex flexShrink={0} alignItems="center" gap="3px" px="5px" py="3px" border="2px solid #344449" borderRadius="999px" bgColor="#FFF4AE" transform="rotate(3deg)"><FiHeart size={8} fill="currentColor" /><Text fontFamily="monospace" fontSize="5px" fontWeight="900">{publishedCount} BLOOMED</Text></Flex></Flex>
        <ReelCollage timeline={timeline} productionCounts={productionCounts} accent={campaign.accent} pulse={timelinePulse} />
      </Flex>

      <Flex position="relative" zIndex={5} flex="1" minH="0" direction="column" gap="7px" px="9px" pt="8px" pb="9px">
        <Flex minH="63px" direction="column" gap="5px" p="8px" border="3px solid #344449" borderRadius="9px 15px 8px 12px" bgColor="#FFF8E8" boxShadow="3px 3px 0 #C4B69C" transform="rotate(.2deg)">
          <Flex alignItems="center" justifyContent="space-between"><Flex alignItems="center" gap="5px" color="#397B86"><FiCpu size={11} /><Text fontFamily="monospace" fontSize="6px" fontWeight="900">AI DOODLE PROMPT</Text></Flex><Text color="#8B8173" fontFamily="monospace" fontSize="5px" fontWeight="900">AUTO SCRIBBLE</Text></Flex>
          <Flex minW="0" alignItems="center" gap="6px" px="7px" py="6px" border="2px dashed #9D9382" borderRadius="8px 5px 9px 6px" bgColor="#F5EAD5"><Text color="#4D5657" fontSize="7px" fontWeight="800" lineClamp={2}>{campaign.prompt}</Text><FiRefreshCw size={11} color="#766F64" /></Flex>
        </Flex>

        <GenerationViewport kind={job?.kind ?? nextKind} job={job} stage={generationStage} pulse={generationPulse} />
        <GeneratorKeyboard nextKind={job?.kind ?? nextKind} stage={generationStage} job={job} visibleKeyCount={visibleKeyCount} imageUnlocked={imageUnlocked} canUnlockImage={views >= IMAGE_UNLOCK_COST} onGenerate={(kind) => generateAsset("manual", kind)} onUnlockImage={unlockImage} onSubmit={publish} />
      </Flex>

      {notice ? <Flex key={`notice-${notice.id}`} position="absolute" zIndex={170} left="50%" bottom="78px" minH="32px" maxW="330px" alignItems="center" justifyContent="center" px="11px" border="2px solid #506269" borderRadius="7px" bgColor="#EAF4F2" color="#263337" boxShadow="0 8px 18px rgba(0,0,0,.34)" transform="translateX(-50%)" animation={`${panelIn} 170ms ease both`} pointerEvents="none"><Text fontFamily="monospace" fontSize="7px" fontWeight="900">{notice.text}</Text></Flex> : null}

      {phase === "posting" ? (
        <Flex position="absolute" inset="0" zIndex={145} alignItems="center" justifyContent="center" bgColor="rgba(52,46,37,.68)" backdropFilter="blur(7px)">
          <Flex position="relative" w="84%" direction="column" alignItems="center" p="21px" border="3px solid #344449" borderRadius="18px 11px 21px 13px" bgColor="#FFF8E8" color="#2E3C40" boxShadow="8px 9px 0 rgba(52,68,73,.4)" animation={`${panelIn} 230ms ease both`}>
            <Flex position="relative" w="76px" h="76px" alignItems="center" justifyContent="center" border="3px solid #344449" borderRadius="52% 48% 45% 55%" bg={postingReward >= 0 ? "linear-gradient(145deg, #F4A56F, #F17B8E)" : "linear-gradient(145deg, #9BA4A2, #687578)"} color="#FFF" boxShadow="4px 5px 0 #344449" animation={`${happyHop} 700ms ease-in-out infinite`}>{postingReward >= 0 ? <FiHeart size={31} fill="currentColor" /> : <FiTrendingDown size={31} />}<Text position="absolute" right="-22px" top="-9px" fontSize="22px" transform="rotate(12deg)">{postingReward >= 0 ? "✦" : "…"}</Text></Flex>
            <Text mt="13px" color="#397B86" fontFamily="monospace" fontSize="7px" fontWeight="900">DELIVERY RESULT・IMPACT {postingScore}</Text>
            <Text mt="5px" fontSize="22px" fontWeight="900">{postingReward >= 0 ? copy.audienceStayed : copy.audienceLeft}</Text>
            <Text mt="7px" color="#756C5F" fontSize="9px" fontWeight="800">{postingReward >= 0 ? copy.positiveDetail : copy.negativeDetail}</Text>
            <Flex mt="14px" alignItems="center" gap="7px" px="13px" py="8px" border="3px solid #344449" borderRadius="50% 46% 52% 48%" bgColor={postingReward >= 0 ? "#FFF4AE" : "#E6D6D0"} color="#344449" boxShadow="3px 3px 0 #C8B56B" transform="rotate(-2deg)">{postingReward >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}<Text fontFamily="monospace" fontSize="15px" fontWeight="900">{postingReward >= 0 ? `+${postingReward}` : postingReward} ECHO</Text></Flex>
            <Text position="absolute" left="50%" bottom="-28px" color={postingReward >= 0 ? "#FFE89A" : "#D9DFDD"} fontFamily="monospace" fontSize="8px" fontWeight="900" animation={`${viewFly} 1120ms ease both`}>{postingReward >= 0 ? "♥ KEEP THE JOY GOING ♥" : "TOO SOON・TRY THE NEXT ONE"}</Text>
          </Flex>
        </Flex>
      ) : null}

      {modelOpen ? <Flex position="absolute" inset="0" zIndex={150} alignItems="center" justifyContent="center" px="14px" bgColor="rgba(5,10,12,.88)" backdropFilter="blur(7px)"><Flex w="100%" direction="column" gap="8px" p="13px" border="3px solid #4B5E65" borderRadius="14px" bg="linear-gradient(rgba(91,217,230,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(91,217,230,.045) 1px, transparent 1px), #111A1E" bgSize="17px 17px" boxShadow="0 14px 34px rgba(0,0,0,.55)" animation={`${panelIn} 220ms ease both`}>
        <Flex alignItems="center" justifyContent="space-between"><Flex direction="column"><Flex alignItems="center" gap="7px" color="#7EE2EB"><FiCpu size={17} /><Text fontFamily="monospace" fontSize="16px" fontWeight="900">MODEL LAB</Text></Flex><Text mt="3px" color="#6E8388" fontFamily="monospace" fontSize="6px" fontWeight="900">SPEND VIEWS・REMOVE MORE HUMAN WORK</Text></Flex><Flex as="button" w="32px" h="32px" alignItems="center" justifyContent="center" border="2px solid #45565C" borderRadius="7px" bgColor="#202B2F" onClick={() => { playGameSfx("uiDialogContinue", { volumeScale: .65 }); setModelOpen(false); }}><FiX size={15} /></Flex></Flex>
        <Flex h="52px" alignItems="center" justifyContent="space-between" px="12px" border="2px solid #394A50" borderRadius="9px" bgColor="#192429"><Text color="#7D9095" fontFamily="monospace" fontSize="7px" fontWeight="900">AVAILABLE VIEWS</Text><Text color="#F0CF70" fontFamily="monospace" fontSize="22px" fontWeight="900">{views}</Text></Flex>
        <UpgradeRow title="PROMPT IQ" detail={copy.qualityFloor(64 + qualityLevel * 7)} level={qualityLevel} cost={UPGRADE_COSTS.quality[qualityLevel] ?? null} icon={<FiTrendingUp size={18} />} affordable={views >= (UPGRADE_COSTS.quality[qualityLevel] ?? Infinity)} onClick={() => upgrade("quality")} />
        <UpgradeRow title="TURBO RENDER" detail={copy.convergence(FINALIZE_DURATIONS[speedLevel])} level={speedLevel} cost={UPGRADE_COSTS.speed[speedLevel] ?? null} icon={<FiZap size={18} />} affordable={views >= (UPGRADE_COSTS.speed[speedLevel] ?? Infinity)} onClick={() => upgrade("speed")} />
        <UpgradeRow title="AI AGENT" detail={agentLevel === 0 ? "AUTO GENERATE OFF" : `${(AGENT_INTERVALS[agentLevel] / 1000).toFixed(1)}s / AUTO CLICK`} level={agentLevel} cost={UPGRADE_COSTS.agent[agentLevel] ?? null} icon={<FiCpu size={18} />} affordable={views >= (UPGRADE_COSTS.agent[agentLevel] ?? Infinity)} onClick={() => upgrade("agent")} />
      </Flex></Flex> : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={160} alignItems="center" justifyContent="center" px="18px" bgColor="rgba(53,47,38,.62)" backdropFilter="blur(7px)">
          <Flex w="100%" direction="column" alignItems="center" p="20px" border="3px solid #344449" borderRadius="19px 12px 21px 13px" bgColor="#FFF8E8" color="#2E3C40" textAlign="center" boxShadow="8px 9px 0 rgba(52,68,73,.42)" animation={`${panelIn} 240ms ease both`}>
            <Flex w="76px" h="76px" alignItems="center" justifyContent="center" border="3px solid #344449" borderRadius="52% 48% 45% 55%" bg="linear-gradient(145deg, #5EDAE8, #8A73D4)" color="#FFF" boxShadow="4px 5px 0 #344449" transform="rotate(-4deg)"><FiFilm size={35} /></Flex>
            <Text mt="15px" color="#397B86" fontFamily="monospace" fontSize="7px" fontWeight="900">AI REEL GARDEN・A BUTTON STORY</Text>
            <Text mt="5px" fontSize="24px" fontWeight="900">{copy.introTitle}</Text>
            <Text mt="9px" color="#756C5F" fontSize="10px" fontWeight="800" lineHeight="1.65">{copy.introBody}</Text>
            <Grid mt="15px" w="100%" templateColumns={`repeat(${FIRST_ENCOUNTER_KEY_COUNT}, 1fr)`} gap="6px">{MEDIA_SEQUENCE.slice(0, FIRST_ENCOUNTER_KEY_COUNT).map((kind) => { const meta = MEDIA_META[kind]; return <Flex key={kind} h="64px" direction="column" alignItems="center" justifyContent="center" gap="6px" border="3px solid #344449" borderRadius={kind === "video" ? "11px 7px 12px 8px" : "7px 12px 8px 10px"} bgColor={meta.color} color="#FFF" boxShadow="3px 3px 0 rgba(52,68,73,.28)" transform={`rotate(${kind === "video" ? -2 : 2}deg)`}><MediaIcon kind={kind} size={19} /><Text fontFamily="monospace" fontSize="7px" fontWeight="900">{meta.label}</Text></Flex>; })}</Grid>
            <Flex as="button" mt="17px" w="100%" h="50px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #344449" borderRadius="12px 8px 14px 9px" bg="linear-gradient(145deg, #5DDAE8, #7D6BD0)" color="#FFF" boxShadow="4px 5px 0 #344449" transform="rotate(-.5deg)" onClick={() => { playGameSfx("creatorStudioStart"); setPhase("playing"); }}><FiPlay size={17} fill="currentColor" /><Text fontFamily="monospace" fontSize="12px" fontWeight="900">GROW THE FIRST REEL</Text></Flex>
            <Text as="button" mt="10px" color="#82796C" fontSize="8px" fontWeight="800" onClick={onSkip}>{copy.skip}</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? <Flex position="absolute" inset="0" zIndex={165} alignItems="center" justifyContent="center" px="18px" bgColor="rgba(5,9,11,.9)" backdropFilter="blur(8px)"><Flex w="100%" direction="column" alignItems="center" p="21px" border="3px solid #51646A" borderRadius="15px" bgColor="#172226" textAlign="center" boxShadow="0 16px 40px rgba(0,0,0,.55)" animation={`${panelIn} 230ms ease both`}><Flex w="72px" h="72px" alignItems="center" justifyContent="center" borderRadius="999px" bg="linear-gradient(145deg, #5DD9E7, #7862CB)" color="#FFF"><FiCheck size={31} /></Flex><Text mt="14px" color="#79E0E8" fontFamily="monospace" fontSize="7px" fontWeight="900">3 REELS COMPLETE</Text><Text mt="5px" fontSize="24px" fontWeight="900">{copy.completeTitle}</Text><Text mt="8px" color="#8FA1A5" fontSize="9px" fontWeight="800" lineHeight="1.6">{copy.completeBody}</Text><Grid mt="15px" w="100%" templateColumns="repeat(3, 1fr)" gap="6px"><Flex h="70px" direction="column" alignItems="center" justifyContent="center" border="2px solid #405158" borderRadius="8px"><Text fontFamily="monospace" fontSize="18px" fontWeight="900">{totalViews}</Text><Text mt="4px" color="#74888D" fontFamily="monospace" fontSize="6px" fontWeight="900">TOTAL VIEWS</Text></Flex><Flex h="70px" direction="column" alignItems="center" justifyContent="center" border="2px solid #405158" borderRadius="8px"><Text fontFamily="monospace" fontSize="18px" fontWeight="900">{manualGenerations}</Text><Text mt="4px" color="#74888D" fontFamily="monospace" fontSize="6px" fontWeight="900">YOUR CLICKS</Text></Flex><Flex h="70px" direction="column" alignItems="center" justifyContent="center" border="2px solid #405158" borderRadius="8px"><Text fontFamily="monospace" fontSize="18px" fontWeight="900">{agentGenerations}</Text><Text mt="4px" color="#74888D" fontFamily="monospace" fontSize="6px" fontWeight="900">AGENT CLICKS</Text></Flex></Grid><Flex as="button" mt="17px" w="100%" h="49px" alignItems="center" justifyContent="center" gap="7px" border="3px solid #347164" borderRadius="9px" bgColor="#59B092" color="#FFF" boxShadow="0 5px 0 #28574C" onClick={() => { playGameSfx("uiDialogContinue"); onComplete(); }}><FiCheck size={16} /><Text fontFamily="monospace" fontSize="11px" fontWeight="900">{copy.finishWork}</Text></Flex></Flex></Flex> : null}
    </Flex>
  );
}

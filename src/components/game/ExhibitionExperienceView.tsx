"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRotateCcw } from "react-icons/fi";
import {
  DiaryBookOpenPromptPage,
  DiaryOverlay,
  ExhibitionIncompleteBaiEntry1DiaryPuzzle,
  NaotaroDiaryUnlockPage,
  NaotaroPhotoDiaryRevealPage,
  PhotoDiarySlidePage,
} from "@/components/game/DiaryOverlay";
import {
  CharacterIntroOverlay,
  MAI_CHARACTER_INTRO_CARD,
  type CharacterIntroCard,
} from "@/components/game/CharacterIntroOverlay";
import {
  OpeningCloudBurstOverlay,
  OPENING_CLOUD_BURST_DURATION_MS,
} from "@/components/game/OpeningCloudBurstOverlay";
import {
  ExhibitionHomeMetroRouteView,
  ExhibitionStreetStoreRouteView,
} from "@/components/game/StorySimpleMetroRouteView";
import { CabinetBoxStackMinigameModal } from "@/components/game/events/CabinetBoxStackMinigameModal";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { FrogDiaryClueEventModal } from "@/components/game/events/FrogDiaryClueEventModal";
import { OfficeWorkValueMinigame } from "@/components/game/events/OfficeWorkValueMinigame";
import { RobotVacuumOneStrokeMinigame } from "@/components/game/events/RobotVacuumOneStrokeMinigame";
import { DepartureTransitionOverlay } from "@/components/game/events/DepartureTransitionOverlay";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { preloadGameImage } from "@/lib/game/preloadAssets";
import {
  EXHIBITION_DIARY_READ_LINES,
  EXHIBITION_NARRATIVE_LINES,
  EXHIBITION_NARRATIVE_NEXT_PHASE,
  type ExhibitionNarrativePhase,
  type ExhibitionPhase,
} from "@/lib/game/exhibitionFlow";
import { FROG_DIARY_CLUE_STAGES } from "@/lib/game/frogDiaryClueFlow";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";

const panelFromRight = keyframes`
  from { opacity: 0; transform: translateX(42px) rotate(2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const panelFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-42px) rotate(-2deg); }
  to { opacity: 1; transform: translateX(0) rotate(0deg); }
`;

const clueCardIn = keyframes`
  from { opacity: 0; transform: translateY(10px) rotate(-2deg) scale(0.97); }
  to { opacity: 1; transform: translateY(0) rotate(-1deg) scale(1); }
`;

const lightOrbFloat = keyframes`
  0% { opacity: 0; transform: translate(-42px, 86px) scale(0.55); }
  35% { opacity: 1; transform: translate(-4px, 22px) scale(1); }
  100% { opacity: 0.78; transform: translate(42px, -54px) scale(0.72); }
`;

const completeGlow = keyframes`
  0%, 100% { opacity: 0.42; transform: scale(0.92); }
  50% { opacity: 0.88; transform: scale(1.08); }
`;

const EXHIBITION_NAOTARO_PHOTO_FALLBACK = "/images/428出圖/拍照動物/黃金獵犬.png";
const EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY = "moment-exhibition-naotaro-photo";

type ExhibitionPhotoDiaryStage = "book" | "photo-slide" | "photo-detail" | "diary-unlock";

function isExhibitionPhotoDiaryStage(value: string | null): value is ExhibitionPhotoDiaryStage {
  return value === "book" || value === "photo-slide" || value === "photo-detail" || value === "diary-unlock";
}

type ExhibitionInitialViewState = {
  phase: ExhibitionPhase;
  lineIndex: number;
  photoDiaryStage: ExhibitionPhotoDiaryStage;
  isOpeningTransitionVisible: boolean;
};

const exhibitionOpeningBlackFade = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const exhibitionOpeningCameraSettle = keyframes`
  0% {
    transform: translate3d(0, 22px, 0) scale(1.12);
    filter: brightness(1.08) saturate(0.9) blur(1px);
  }
  42% {
    transform: translate3d(0, 12px, 0) scale(1.075);
    filter: brightness(1.04) saturate(0.95) blur(0);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: brightness(1) saturate(1) blur(0);
  }
`;

const exhibitionOpeningLocationTitle = keyframes`
  0%, 24% {
    opacity: 0;
    transform: translateY(10px);
    letter-spacing: 0.08em;
  }
  40%, 76% {
    opacity: 1;
    transform: translateY(0);
    letter-spacing: 0.16em;
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
    letter-spacing: 0.2em;
  }
`;

const exhibitionMetroArrivalSettle = keyframes`
  0% {
    transform: translate3d(0, 18px, 0) scale(1.1);
    filter: brightness(1.08) saturate(0.9) blur(1.2px);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: brightness(1) saturate(1) blur(0);
  }
`;

const exhibitionDialogUiIn = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const exhibitionWorkDuskReveal = keyframes`
  0%, 8% { opacity: 0; }
  100% { opacity: 1; }
`;

const exhibitionMemoryCarouselPanel = keyframes`
  0% { opacity: 0; transform: translate3d(62%, -50%, 0) rotate(2deg) scale(0.96); }
  16% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
  72% { opacity: 1; transform: translate3d(-50%, -50%, 0) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: translate3d(-162%, -50%, 0) rotate(-2deg) scale(0.96); }
`;

const exhibitionMemoryMarqueeFade = keyframes`
  0% { opacity: 0; }
  7%, 90% { opacity: 1; }
  100% { opacity: 0; }
`;

const NARRATIVE_PHASES: readonly ExhibitionNarrativePhase[] = [
  "departure-opening",
  "departure-plan",
  "metro-arrival",
  "metro-opening",
  "post-puzzle-metro",
  "work-arrival",
  "work-complete",
  "work-leave",
  "home-search",
  "bai-change-first",
  "bai-after-flashback",
  "morning-route-intro",
  "work-return",
  "dessert-transition",
  "home-final",
  "argument-flashback",
];

const EXHIBITION_NARRATIVE_BACKGROUND_IMAGES = Array.from(
  new Set(
    NARRATIVE_PHASES.flatMap((phase) =>
      EXHIBITION_NARRATIVE_LINES[phase].map((line) => line.backgroundImage),
    ),
  ),
);

const EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS = [
  {
    key: "home",
    visual: { label: "家", iconPath: "/images/icon/house.png" },
    positionPercent: 9,
  },
  {
    key: "metro-station",
    visual: { label: "捷運", iconPath: "/images/icon/mrt.png" },
    positionPercent: 50,
  },
  {
    key: "company",
    visual: { label: "公司", iconPath: "/images/icon/company.png" },
    positionPercent: 91,
  },
] as const;

const METRO_BACKGROUND = "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_背景.jpg";
const METRO_DOG_FRAMES = [
  "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_1.png",
  "/images/428出圖/追加作畫/黃金獵犬/黃金獵犬_2.png",
] as const;
const METRO_DOG_TARGET_RECT_NORMALIZED = {
  x: 0.29,
  y: 0.51,
  width: 0.58,
  height: 0.2,
};
const CAMERA_COMIC = "/images/428出圖/漫畫格/第一章/相機.png";
const BEIGO_BOOK_COMIC = "/images/428出圖/特別演出/CH01_SC02_SE03_Beigo_Stand_Book.png";
const GOLDEN_RETRIEVER_RUN_COMIC =
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_黃金獵犬.png";
const GOLDEN_RETRIEVER_DOOR_COMICS = [
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運3.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運２.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運１.png",
] as const;
const BEIGO_BAG_COMICS = [
  "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
] as const;
const BEIGO_REVEAL_COMIC_COMPLETE_MS = 1180;
const FLASHBACK_FALL_COMIC_PANELS = [
  "/images/428出圖/追加作畫/漫畫格/踩到.png",
  "/images/428出圖/追加作畫/漫畫格/跌倒.png",
] as const;
const FLASHBACK_FALL_FULLSCREEN_FRAMES = [
  "/images/428出圖/追加作畫/小麥跌倒/小麥跌倒.jpg",
  "/images/428出圖/追加作畫/小麥跌倒/小麥跌倒_差分.jpg",
] as const;
const FLASHBACK_FALL_FIRST_FRAME_MS = 360;
const FLASHBACK_FALL_SECOND_FRAME_MS = 560;
const FLASHBACK_DOOR_CLOSE_COMIC = "/images/428出圖/追加作畫/漫畫格/關門.png";
const EXHIBITION_OPENING_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const EXHIBITION_OFFICE_BACKGROUND = "/images/428出圖/背景/公司_白天.jpg";
const EXHIBITION_OFFICE_WORK_FRAMES = [
  "/images/work/Office_Work_Day_Focus_01.png",
  "/images/work/Office_Work_Day_Focus_02.png",
  "/images/work/Office_Work_Day_Focus_03.png",
  "/images/work/Office_Work_Day_Focus_02.png",
] as const;
const EXHIBITION_OFFICE_WORK_LOOK_FRAME = "/images/work/Office_Work_Day_Look.png";
const EXHIBITION_OFFICE_WORK_DUSK_FRAMES = [
  "/images/work/Office_Work_Dusk_Focus_01.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
  "/images/work/Office_Work_Dusk_Focus_03.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
] as const;
const EXHIBITION_OPENING_BLACK_HOLD_MS = 420;
const EXHIBITION_OPENING_BLACK_FADE_MS = 320;
const EXHIBITION_OPENING_CAMERA_DURATION_MS = OPENING_CLOUD_BURST_DURATION_MS + 800;
const EXHIBITION_OPENING_ESTABLISH_HOLD_MS = 360;
const EXHIBITION_LOCATION_TRANSITION_MS = 1650;
const EXHIBITION_MAINLINE_DOOR_TRANSITION_MS = 620;
const EXHIBITION_MEMORY_MARQUEE_DURATION_MS = 5400;
const EXHIBITION_MEMORY_PANEL_DURATION_MS = 1500;
const EXHIBITION_MEMORY_PANEL_STAGGER_MS = 1150;
const EXHIBITION_OFFICE_WORK_START_MS = EXHIBITION_LOCATION_TRANSITION_MS;
const EXHIBITION_OFFICE_LOOK_DELAY_MS = 3350;
const EXHIBITION_OFFICE_CONTINUE_DELAY_MS = 3620;
const EXHIBITION_OFFICE_OPENING_DURATION_MS = 4620;
const EXHIBITION_WORK_DUSK_DURATION_MS = 4200;
const EXHIBITION_MEMORY_IMAGES = [
  "/images/428出圖/暫時/memory_01.png",
  "/images/428出圖/暫時/memory_02.png",
  "/images/428出圖/暫時/memory_03.png",
  "/images/428出圖/暫時/memory_04.png",
] as const;
const EXHIBITION_MAI_CHARACTER_INTRO_CARD: CharacterIntroCard = {
  ...MAI_CHARACTER_INTRO_CARD,
  sceneId: "exhibition-mai-intro",
  spriteSheetPath: "/images/428出圖/立繪/小麥/19_釋懷.png",
  spriteCols: 1,
  spriteRows: 1,
  spriteFrameIndex: 0,
  theme: {
    topBar: "rgba(246, 174, 157, 0.98)",
    band: "rgba(183, 141, 128, 0.94)",
    bandBorder: "rgba(139, 94, 82, 0.76)",
    button: "#A86E61",
    buttonText: "#FFF8F4",
  },
};

function isNarrativePhase(phase: ExhibitionPhase): phase is ExhibitionNarrativePhase {
  return NARRATIVE_PHASES.includes(phase as ExhibitionNarrativePhase);
}

function getInitialExhibitionViewState(
  initialPreview: ExhibitionPhase | null,
  initialSceneStep: string | null,
): ExhibitionInitialViewState {
  const phase = initialPreview ?? "departure-opening";
  const narrativeLines = isNarrativePhase(phase)
    ? EXHIBITION_NARRATIVE_LINES[phase]
    : null;
  const requestedLineIndex = narrativeLines?.findIndex(
    (line) => line.id === initialSceneStep,
  ) ?? -1;

  return {
    phase,
    lineIndex: requestedLineIndex >= 0 ? requestedLineIndex : 0,
    photoDiaryStage:
      phase === "dog-photo-diary" && isExhibitionPhotoDiaryStage(initialSceneStep)
        ? initialSceneStep
        : "book",
    isOpeningTransitionVisible: initialPreview === null,
  };
}

function replaceExhibitionPhaseInUrl(phase: ExhibitionPhase, sceneStep?: string) {
  const url = new URL(window.location.href);
  const currentSceneStep = url.searchParams.get("sceneStep");
  if (
    url.searchParams.get("preview") === phase &&
    currentSceneStep === (sceneStep ?? null)
  ) {
    return;
  }
  url.searchParams.set("preview", phase);
  if (sceneStep) {
    url.searchParams.set("sceneStep", sceneStep);
  } else {
    url.searchParams.delete("sceneStep");
  }
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function ExhibitionOpeningTransition({ onComplete }: { onComplete: () => void }) {
  const [hasCloudOpeningStarted, setHasCloudOpeningStarted] = useState(false);

  useEffect(() => {
    const cloudOpeningTimer = window.setTimeout(() => {
      setHasCloudOpeningStarted(true);
    }, EXHIBITION_OPENING_BLACK_HOLD_MS);
    const completeTimer = window.setTimeout(
      onComplete,
      EXHIBITION_OPENING_BLACK_HOLD_MS +
        EXHIBITION_OPENING_CAMERA_DURATION_MS +
        EXHIBITION_OPENING_ESTABLISH_HOLD_MS,
    );

    return () => {
      window.clearTimeout(cloudOpeningTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#242326"
      data-exhibition-opening-stage={hasCloudOpeningStarted ? "establishing" : "black"}
    >
      <Box
        position="absolute"
        inset="0"
        bgImage={`url("${EXHIBITION_OPENING_BACKGROUND}")`}
        bgSize="cover"
        backgroundPosition="center bottom"
        bgRepeat="no-repeat"
        transformOrigin="50% 56%"
        animation={
          hasCloudOpeningStarted
            ? `${exhibitionOpeningCameraSettle} ${EXHIBITION_OPENING_CAMERA_DURATION_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`
            : undefined
        }
        willChange="transform, filter"
      />
      {hasCloudOpeningStarted ? <OpeningCloudBurstOverlay /> : null}
      {hasCloudOpeningStarted ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={82}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Flex
            direction="column"
            alignItems="center"
            color="#5E554F"
            textAlign="center"
            textShadow="0 2px 14px rgba(255,255,255,0.94), 0 1px 2px rgba(255,255,255,0.8)"
            animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_OPENING_CAMERA_DURATION_MS}ms ease-in-out both`}
          >
            <Flex alignItems="center" justifyContent="center" gap="16px">
              <Box w="52px" h="1px" bgColor="rgba(94,85,79,0.42)" />
              <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                家門外
              </Text>
              <Box w="52px" h="1px" bgColor="rgba(94,85,79,0.42)" />
            </Flex>
            <Text mt="12px" fontSize="13px" fontWeight="800" lineHeight="1" letterSpacing="0.32em" ml="0.32em">
              早晨
            </Text>
          </Flex>
        </Flex>
      ) : null}
      <Box
        position="absolute"
        inset="0"
        zIndex={83}
        bgColor="#000"
        pointerEvents="none"
        animation={
          hasCloudOpeningStarted
            ? `${exhibitionOpeningBlackFade} ${EXHIBITION_OPENING_BLACK_FADE_MS}ms ease-out both`
            : undefined
        }
      />
    </Flex>
  );
}

function CluePaper({ text }: { text: string }) {
  return (
    <Flex
      position="absolute"
      zIndex={5}
      left="50%"
      top="102px"
      w="calc(100% - 62px)"
      minH="88px"
      px="20px"
      py="15px"
      direction="column"
      justifyContent="center"
      transform="translateX(-50%) rotate(-1deg)"
      bgColor="rgba(255,252,241,0.96)"
      border="1px solid rgba(134,101,72,0.32)"
      borderRadius="4px"
      boxShadow="0 14px 24px rgba(53,38,27,0.25)"
      animation={`${clueCardIn} 420ms ease both`}
      pointerEvents="none"
    >
      <Text color="#A57C58" fontSize="10px" fontWeight="900" letterSpacing="0.14em">
        日記線索
      </Text>
      <Text mt="6px" color="#665044" fontSize="15px" fontWeight="800" lineHeight="1.5">
        {text}
      </Text>
    </Flex>
  );
}

function ExhibitionMemoryMarquee({ onComplete }: { onComplete: () => void }) {
  const [isReady, setIsReady] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      EXHIBITION_MEMORY_IMAGES.map(
        (src) =>
          new Promise<void>((resolve) => {
            const image = new window.Image();
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = src;
          }),
      ),
    ).then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_MEMORY_MARQUEE_DURATION_MS);
    return () => window.clearTimeout(completeTimer);
  }, [isReady]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={90}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      bg="rgba(8,7,11,0.7)"
      pointerEvents="none"
      data-exhibition-memory-marquee={isReady ? "playing" : "loading"}
      animation={isReady ? `${exhibitionMemoryMarqueeFade} ${EXHIBITION_MEMORY_MARQUEE_DURATION_MS}ms ease-in-out both` : undefined}
    >
      <Box
        position="absolute"
        inset="0"
        opacity={0.16}
        bgImage="repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,0.04) 5px 6px)"
      />
      <Box
        position="absolute"
        inset="0"
        bg="radial-gradient(circle at 50% 38%, transparent 18%, rgba(0,0,0,0.3) 86%)"
      />
      {isReady ? (
        <Flex
          position="absolute"
          left="18px"
          right="18px"
          top="164px"
          h="250px"
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
          borderRadius="20px"
          border="3px solid rgba(223,190,157,0.76)"
          bg="linear-gradient(145deg, rgba(112,78,58,0.98), rgba(151,108,78,0.98))"
          boxShadow="inset 0 0 0 2px rgba(255,245,226,0.12), 0 24px 42px rgba(0,0,0,0.42)"
        >
          <Box
            position="absolute"
            inset="0"
            opacity={0.16}
            bgImage="repeating-linear-gradient(128deg, rgba(255,246,224,0.16) 0 12px, transparent 12px 30px)"
          />
          {EXHIBITION_MEMORY_IMAGES.map((src, index) => (
            <Flex
              key={src}
              position="absolute"
              left="50%"
              top="50%"
              w="300px"
              h="198px"
              p="5px"
              overflow="hidden"
              borderRadius="13px"
              bgColor="#FFF9EA"
              border="2px solid rgba(132,103,91,0.88)"
              boxShadow="0 18px 34px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.34)"
              opacity={index === 0 ? 1 : 0}
              transform="translate(-50%, -50%)"
              animation={`${exhibitionMemoryCarouselPanel} ${EXHIBITION_MEMORY_PANEL_DURATION_MS}ms cubic-bezier(0.22, 0.76, 0.2, 1) ${index * EXHIBITION_MEMORY_PANEL_STAGGER_MS}ms both`}
              willChange="transform, opacity"
              css={{
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                  transform: "translate(-50%, -50%)",
                  opacity: index === 0 ? 1 : 0,
                },
              }}
            >
              <img
                src={src}
                alt={`昨天的回憶漫畫格 ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover",
                  borderRadius: "8px",
                  filter: "saturate(0.86) contrast(1.04)",
                }}
              />
            </Flex>
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
}

function ExhibitionFlashbackFallFullscreenSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const secondFrameTimer = window.setTimeout(() => {
      setFrameIndex(1);
    }, FLASHBACK_FALL_FIRST_FRAME_MS);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, FLASHBACK_FALL_FIRST_FRAME_MS + FLASHBACK_FALL_SECOND_FRAME_MS);

    return () => {
      window.clearTimeout(secondFrameTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={40}
      overflow="hidden"
      bgColor="#D6C3A9"
      pointerEvents="none"
      data-exhibition-flashback-fall-fullscreen={frameIndex + 1}
    >
      <img
        src={FLASHBACK_FALL_FULLSCREEN_FRAMES[frameIndex]}
        alt={frameIndex === 0 ? "跌坐在地上的小麥" : "小白趕來查看跌倒的小麥"}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </Flex>
  );
}

function ExhibitionMainlineDoorTransition({ onComplete }: { onComplete: () => void }) {
  const [doorPhase, setDoorPhase] = useState<"closed-start" | "opened" | "closed-end">(
    "closed-start",
  );
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 完整沿用主線 scene-40：180ms 開門、420ms 關門、620ms 進入玄關對白。
    const openDoorTimer = window.setTimeout(() => {
      setDoorPhase("opened");
    }, 180);
    const closeDoorTimer = window.setTimeout(() => {
      setDoorPhase("closed-end");
    }, 420);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_MAINLINE_DOOR_TRANSITION_MS);

    return () => {
      window.clearTimeout(openDoorTimer);
      window.clearTimeout(closeDoorTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      pointerEvents="none"
      position="absolute"
      inset="0"
      zIndex={20}
      bgColor="rgba(14,14,18,0.92)"
      alignItems="center"
      justifyContent="center"
      data-exhibition-transition="mainline-door"
    >
      <Flex
        w="82%"
        maxW="320px"
        borderRadius="12px"
        overflow="hidden"
        border="2px solid rgba(255,255,255,0.28)"
        boxShadow="0 10px 24px rgba(0,0,0,0.38)"
      >
        <img
          src={
            doorPhase === "opened"
              ? "/images/背景/玄關_開門.jpg"
              : "/images/背景/玄關_關門.jpg"
          }
          alt={doorPhase === "opened" ? "玄關門打開" : "玄關門關上"}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Flex>
    </Flex>
  );
}

function NarrativeScene({
  phase,
  lineIndex,
  onAdvance,
}: {
  phase: ExhibitionNarrativePhase;
  lineIndex: number;
  onAdvance: () => void;
}) {
  const lines = EXHIBITION_NARRATIVE_LINES[phase];
  const line = lines[Math.min(lineIndex, lines.length - 1)];
  const isNarration = line.speaker === "旁白";
  const isInnerThought = Boolean(line.isInnerThought);
  const [typingMode] = useState(loadDialogTypingMode);
  const shouldPlayLocationTransition = Boolean(line.locationTransition);
  const [completedLocationTransitionLineId, setCompletedLocationTransitionLineId] = useState<string | null>(null);
  const shouldPlayAutomaticDoorTransition = Boolean(line.automaticDoorTransition);
  const [completedAutomaticDoorLineId, setCompletedAutomaticDoorLineId] = useState<string | null>(null);
  const [isMemoryMarqueePlaying, setIsMemoryMarqueePlaying] = useState(false);
  const [isFallFullscreenPlaying, setIsFallFullscreenPlaying] = useState(false);
  const isLocationTransitionPlaying =
    shouldPlayLocationTransition && completedLocationTransitionLineId !== line.id;
  const isAutomaticDoorTransitionPlaying =
    shouldPlayAutomaticDoorTransition && completedAutomaticDoorLineId !== line.id;
  const isIntroTransitionPlaying =
    isLocationTransitionPlaying || isAutomaticDoorTransitionPlaying;
  const [displayedAvatarFrameIndex, setDisplayedAvatarFrameIndex] = useState(
    line.avatar?.frameSequence?.[0] ?? line.avatar?.frameIndex,
  );

  useEffect(() => {
    if (!isLocationTransitionPlaying) return;
    const transitionTimer = window.setTimeout(() => {
      setCompletedLocationTransitionLineId(line.id);
    }, EXHIBITION_LOCATION_TRANSITION_MS);
    return () => window.clearTimeout(transitionTimer);
  }, [isLocationTransitionPlaying, line.id]);

  useEffect(() => {
    const frameSequence = line.avatar?.frameSequence;
    setDisplayedAvatarFrameIndex(frameSequence?.[0] ?? line.avatar?.frameIndex);
    if (!frameSequence || frameSequence.length < 2) return;

    let frameSequenceIndex = 0;
    const frameTimer = window.setInterval(() => {
      frameSequenceIndex = (frameSequenceIndex + 1) % frameSequence.length;
      setDisplayedAvatarFrameIndex(frameSequence[frameSequenceIndex]);
    }, line.avatar?.frameDurationMs ?? 680);

    return () => window.clearInterval(frameTimer);
  }, [line.avatar, line.id]);

  useEffect(() => {
    setIsFallFullscreenPlaying(false);
  }, [line.id]);

  const handleNarrativeContinue = () => {
    if (phase === "metro-arrival" && lineIndex === 0 && !isMemoryMarqueePlaying) {
      setIsMemoryMarqueePlaying(true);
      return;
    }
    if (line.comicPresentation === "fall-double" && !isFallFullscreenPlaying) {
      setIsFallFullscreenPlaying(true);
      return;
    }
    onAdvance();
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#2A292E"
      bgImage={`url("${line.backgroundImage}")`}
      bgSize={line.backgroundSize ?? "cover"}
      backgroundPosition={line.backgroundPosition ?? "center bottom"}
      bgRepeat="no-repeat"
      filter={line.flashback && !isFallFullscreenPlaying ? "sepia(0.2) saturate(0.78)" : undefined}
    >
      {!line.hideBackgroundShade ? (
        <Box
          position="absolute"
          inset="0"
          bg={
            line.flashback
              ? "linear-gradient(180deg, rgba(74,54,43,0.25), rgba(25,18,18,0.55))"
              : "linear-gradient(180deg, rgba(20,18,18,0.2) 0%, transparent 38%, rgba(20,15,12,0.52) 100%)"
          }
          pointerEvents="none"
        />
      ) : null}

      {line.clueText ? <CluePaper text={line.clueText} /> : null}

      {line.showLightOrb ? (
        <Box
          position="absolute"
          zIndex={4}
          left="42%"
          top="42%"
          w="54px"
          h="54px"
          borderRadius="999px"
          bg="radial-gradient(circle, rgba(255,252,211,1) 0%, rgba(255,219,112,0.92) 26%, rgba(255,188,65,0.18) 72%, transparent 74%)"
          boxShadow="0 0 28px rgba(255,227,126,0.82), 0 0 72px rgba(255,190,69,0.42)"
          animation={`${lightOrbFloat} 1800ms ease-in-out infinite alternate`}
          pointerEvents="none"
        />
      ) : null}

      {line.comicPresentation === "fall-double"
        ? FLASHBACK_FALL_COMIC_PANELS.map((panel, index) => (
            <Flex
              key={panel}
              position="absolute"
              top={index === 0 ? "80px" : "280px"}
              left={index === 0 ? undefined : "0"}
              right={index === 0 ? "0" : undefined}
              zIndex={7 + index}
              w="280px"
              h="177px"
              overflow="hidden"
              pointerEvents="none"
              animation={`${index === 0 ? panelFromRight : panelFromLeft} 430ms ease ${index * 180}ms both`}
            >
              <img
                src={panel}
                alt={index === 0 ? "小麥踩到地上草稿的漫畫格" : "小麥跌倒撞落日記的漫畫格"}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Flex>
          ))
        : null}

      {line.comicPresentation === "door-close-single" ? (
        <Flex
          position="absolute"
          left="50%"
          top="142px"
          zIndex={8}
          w="80%"
          maxW="290px"
          transform="translateX(-50%)"
          overflow="hidden"
          pointerEvents="none"
        >
          <Flex w="100%" animation={`${panelFromRight} 430ms ease both`}>
            <img
              src={FLASHBACK_DOOR_CLOSE_COMIC}
              alt="小麥關門離開的漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        </Flex>
      ) : null}

      {line.comicPresentation === "beigo-book-single" ? (
        <Flex
          position="absolute"
          left="50%"
          top="142px"
          zIndex={8}
          w="80%"
          maxW="290px"
          transform="translateX(-50%)"
          overflow="hidden"
          pointerEvents="none"
        >
          <img
            src={BEIGO_BOOK_COMIC}
            alt="日記上的小貝狗漫畫格"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </Flex>
      ) : null}

      {isLocationTransitionPlaying ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={20}
          overflow="hidden"
          bgColor="#E8DFD2"
          pointerEvents="none"
          data-exhibition-transition="metro-arrival"
        >
          <Box
            position="absolute"
            inset="0"
            bgImage={`url("${line.backgroundImage}")`}
            bgSize={line.backgroundSize ?? "cover"}
            backgroundPosition={line.backgroundPosition ?? "center bottom"}
            bgRepeat="no-repeat"
            transformOrigin="50% 58%"
            animation={`${exhibitionMetroArrivalSettle} ${EXHIBITION_LOCATION_TRANSITION_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`}
            willChange="transform, filter"
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(255,248,235,0.08), rgba(44,36,32,0.18))"
          />
          <Flex
            position="absolute"
            inset="0"
            zIndex={2}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              direction="column"
              alignItems="center"
              color="#5E554F"
              textAlign="center"
              textShadow="0 2px 14px rgba(255,255,255,0.96), 0 1px 2px rgba(255,255,255,0.86)"
              animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_LOCATION_TRANSITION_MS}ms ease-in-out both`}
            >
              <Flex alignItems="center" justifyContent="center" gap="16px">
                <Box w="46px" h="1px" bgColor="rgba(94,85,79,0.42)" />
                <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                  {line.locationTransition?.title}
                </Text>
                <Box w="46px" h="1px" bgColor="rgba(94,85,79,0.42)" />
              </Flex>
              <Text mt="12px" fontSize="13px" fontWeight="800" lineHeight="1" letterSpacing="0.32em" ml="0.32em">
                {line.locationTransition?.subtitle}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isAutomaticDoorTransitionPlaying ? (
        <ExhibitionMainlineDoorTransition
          onComplete={() => setCompletedAutomaticDoorLineId(line.id)}
        />
      ) : null}

      {isMemoryMarqueePlaying ? (
        <ExhibitionMemoryMarquee
          onComplete={() => {
            setIsMemoryMarqueePlaying(false);
            onAdvance();
          }}
        />
      ) : null}

      {isFallFullscreenPlaying ? (
        <ExhibitionFlashbackFallFullscreenSequence
          onComplete={() => {
            setIsFallFullscreenPlaying(false);
            onAdvance();
          }}
        />
      ) : null}

      <Flex flex="1" minH="0" position="relative" />

      {!isIntroTransitionPlaying && !isFallFullscreenPlaying ? (
        <Flex
          w="100%"
          flexShrink={0}
          position="relative"
          zIndex={isMemoryMarqueePlaying ? 100 : undefined}
          animation={
            shouldPlayLocationTransition || shouldPlayAutomaticDoorTransition
              ? `${exhibitionDialogUiIn} 360ms ease-out both`
              : undefined
          }
        >
          <StoryDialogPanel
            key={line.id}
            characterName={line.speaker}
            dialogue={line.text}
            dialogueItalicPrefix={isNarration ? line.text : undefined}
            onContinue={handleNarrativeContinue}
            showAvatarSprite={Boolean(line.avatar)}
            showCharacterName={!isNarration}
            avatarSpriteId={line.avatar?.spriteId}
            avatarFrameIndex={displayedAvatarFrameIndex}
            avatarMotionId={line.avatar?.motionId}
            isInnerThought={isInnerThought}
            typingMode={typingMode}
          />
        </Flex>
      ) : null}
    </Flex>
  );
}

function ExhibitionMaiIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgImage={`url("${EXHIBITION_OPENING_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center bottom"
    >
      <CharacterIntroOverlay
        intro={EXHIBITION_MAI_CHARACTER_INTRO_CARD}
        onClose={onComplete}
        showAvatarGlow={false}
        avatarBottom={0}
        enableDecorativeMotion
      />
    </Flex>
  );
}

function ExhibitionOfficeOpening({ onComplete }: { onComplete: () => void }) {
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const [isWorkVisible, setIsWorkVisible] = useState(false);
  const [isMaiLookingBack, setIsMaiLookingBack] = useState(false);
  const [isContinueReady, setIsContinueReady] = useState(false);
  const hasCompletedRef = useRef(false);

  const complete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const workFrameTimer = window.setInterval(() => {
      setWorkFrameIndex(
        (current) => (current + 1) % EXHIBITION_OFFICE_WORK_FRAMES.length,
      );
    }, 260);
    const workStartTimer = window.setTimeout(() => {
      setIsWorkVisible(true);
    }, EXHIBITION_OFFICE_WORK_START_MS);
    const lookTimer = window.setTimeout(() => {
      setIsMaiLookingBack(true);
    }, EXHIBITION_OFFICE_LOOK_DELAY_MS);
    const continueReadyTimer = window.setTimeout(() => {
      setIsContinueReady(true);
    }, EXHIBITION_OFFICE_CONTINUE_DELAY_MS);
    const completeTimer = window.setTimeout(complete, EXHIBITION_OFFICE_OPENING_DURATION_MS);

    return () => {
      window.clearInterval(workFrameTimer);
      window.clearTimeout(workStartTimer);
      window.clearTimeout(lookTimer);
      window.clearTimeout(continueReadyTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  const workFrame = isMaiLookingBack
    ? EXHIBITION_OFFICE_WORK_LOOK_FRAME
    : EXHIBITION_OFFICE_WORK_FRAMES[workFrameIndex];

  return (
    <Flex
      as="button"
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#A7A7A7"
      alignItems="center"
      justifyContent="center"
      onClick={() => {
        if (isContinueReady) complete();
      }}
      aria-disabled={!isContinueReady}
      aria-label="公司與小麥工作的開場動畫，點擊繼續"
      data-exhibition-office-opening
    >
      {!isWorkVisible ? (
        <Flex
          position="absolute"
          inset="0"
          overflow="hidden"
          bgColor="#D9E5DE"
          data-exhibition-transition="office-arrival"
        >
          <Box
            position="absolute"
            inset="0"
            bgImage={`url("${EXHIBITION_OFFICE_BACKGROUND}")`}
            bgSize="cover"
            backgroundPosition="center bottom"
            bgRepeat="no-repeat"
            transformOrigin="50% 58%"
            animation={`${exhibitionMetroArrivalSettle} ${EXHIBITION_OFFICE_WORK_START_MS}ms cubic-bezier(0.18, 0.72, 0.18, 1) both`}
            willChange="transform, filter"
            css={{
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          />
          <Box
            position="absolute"
            inset="0"
            bg="linear-gradient(180deg, rgba(255,248,235,0.04), rgba(44,36,32,0.16))"
          />
          <Flex
            position="absolute"
            inset="0"
            zIndex={2}
            alignItems="center"
            justifyContent="center"
          >
            <Flex
              direction="column"
              alignItems="center"
              px="22px"
              py="15px"
              borderRadius="12px"
              bgColor="rgba(24,22,21,0.5)"
              boxShadow="0 8px 24px rgba(36,31,28,0.16)"
              color="white"
              textAlign="center"
              textShadow="0 1px 3px rgba(0,0,0,0.32)"
              animation={`${exhibitionOpeningLocationTitle} ${EXHIBITION_OFFICE_WORK_START_MS}ms ease-in-out both`}
            >
              <Flex alignItems="center" justifyContent="center" gap="14px">
                <Box w="42px" h="1px" bgColor="rgba(255,255,255,0.62)" />
                <Text fontSize="29px" fontWeight="800" lineHeight="1" whiteSpace="nowrap">
                  公司
                </Text>
                <Box w="42px" h="1px" bgColor="rgba(255,255,255,0.62)" />
              </Flex>
              <Text
                mt="12px"
                fontSize="13px"
                fontWeight="800"
                lineHeight="1"
                letterSpacing="0.32em"
                ml="0.32em"
              >
                上午
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex
          position="absolute"
          inset="0"
          overflow="hidden"
          bgColor="#DCE7E0"
          animation={`${panelFromRight} 460ms cubic-bezier(0.22, 0.78, 0.2, 1) both`}
        >
          <img
            src={workFrame}
            alt={isMaiLookingBack ? "小麥聽見同事叫她而回頭" : "小麥正在座位上工作"}
            style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
          />
        </Flex>
      )}

      <Text
        position="absolute"
        left="50%"
        bottom="22px"
        transform="translateX(-50%)"
        color="rgba(255,255,255,0.82)"
        fontSize="12px"
        fontWeight="700"
        letterSpacing="0.08em"
        whiteSpace="nowrap"
        opacity={isContinueReady ? 1 : 0}
        transition="opacity 240ms ease"
      >
        點一下繼續
      </Text>
    </Flex>
  );
}

function ExhibitionWorkDuskTransition({ onComplete }: { onComplete: () => void }) {
  const [workFrameIndex, setWorkFrameIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const workFrameTimer = window.setInterval(() => {
      setWorkFrameIndex(
        (current) => (current + 1) % EXHIBITION_OFFICE_WORK_FRAMES.length,
      );
    }, 260);
    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, EXHIBITION_WORK_DUSK_DURATION_MS);

    return () => {
      window.clearInterval(workFrameTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgColor="#DCE7E0"
      aria-label="小麥繼續工作，窗外逐漸變成黃昏"
      data-exhibition-work-dusk
    >
      <img
        src={EXHIBITION_OFFICE_WORK_FRAMES[workFrameIndex]}
        alt="小麥繼續在座位上工作"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
      <img
        src={EXHIBITION_OFFICE_WORK_DUSK_FRAMES[workFrameIndex]}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          animation: `${exhibitionWorkDuskReveal} ${EXHIBITION_WORK_DUSK_DURATION_MS}ms linear both`,
        }}
      />
    </Flex>
  );
}

function MetroComicScene({ onAdvance }: { onAdvance: () => void }) {
  const [visibleDoorFrameCount, setVisibleDoorFrameCount] = useState(0);
  const onAdvanceRef = useRef(onAdvance);

  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    // 與主線 ch01MetroDogRun 相同：下格進場完成後再開始播三張車門圖。
    const doorTimerOne = window.setTimeout(() => setVisibleDoorFrameCount(1), 980);
    const doorTimerTwo = window.setTimeout(() => setVisibleDoorFrameCount(2), 1200);
    const advanceTimer = window.setTimeout(() => onAdvanceRef.current(), 1800);
    return () => {
      window.clearTimeout(doorTimerOne);
      window.clearTimeout(doorTimerTwo);
      window.clearTimeout(advanceTimer);
    };
  }, []);

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      overflow="hidden"
      bgImage={`url("${METRO_BACKGROUND}")`}
      bgSize="cover"
      backgroundPosition="center"
    >
      <Flex
        position="absolute"
        top="80px"
        right="0"
        zIndex={7}
        w="280px"
        h="171px"
        overflow="hidden"
        pointerEvents="none"
        animation={`${panelFromRight} 360ms ease both`}
      >
        <img
          src={GOLDEN_RETRIEVER_RUN_COMIC}
          alt="黃金獵犬衝進捷運車廂的漫畫格"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </Flex>
      <Flex
        position="absolute"
        top="280px"
        left="0"
        zIndex={8}
        w="280px"
        h="164px"
        overflow="hidden"
        pointerEvents="none"
        animation={`${panelFromLeft} 340ms ease 420ms both`}
      >
        {GOLDEN_RETRIEVER_DOOR_COMICS.map((image, frameIndex) => (
          <img
            key={image}
            src={image}
            alt={frameIndex === 0 ? "捷運車門關閉的連續漫畫格" : ""}
            aria-hidden={frameIndex === 0 ? undefined : true}
            style={{
              position: frameIndex === 0 ? "relative" : "absolute",
              inset: frameIndex === 0 ? undefined : 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: frameIndex === 0 || visibleDoorFrameCount >= frameIndex ? 1 : 0,
              transition: frameIndex === 0 ? undefined : "opacity 120ms ease",
            }}
          />
        ))}
      </Flex>
    </Flex>
  );
}

function BeigoBagComic({ presentation }: { presentation: "bag" | "reveal" }) {
  const [showFinalPeek, setShowFinalPeek] = useState(false);

  useEffect(() => {
    if (presentation !== "reveal") return;
    // 主線下格：140ms 後進場、380ms 完成、400ms 後替換最終圖。
    const timer = window.setTimeout(() => setShowFinalPeek(true), 920);
    return () => window.clearTimeout(timer);
  }, [presentation]);

  return (
    <>
      <Flex
        position="absolute"
        top="80px"
        right="0"
        zIndex={7}
        w="280px"
        h="170px"
        overflow="hidden"
        pointerEvents="none"
        animation={presentation === "bag" ? `${panelFromRight} 380ms ease both` : undefined}
      >
        <img
          src={BEIGO_BAG_COMICS[0]}
          alt="蠕動的袋子"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </Flex>
      {presentation === "reveal" ? (
        <Flex
          position="absolute"
          top="280px"
          left="0"
          zIndex={8}
          w="280px"
          h="170px"
          overflow="hidden"
          pointerEvents="none"
          animation={`${panelFromLeft} 380ms ease 140ms both`}
        >
          <img
            src={BEIGO_BAG_COMICS[1]}
            alt="小貝狗從袋子裡探頭"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <img
            src={BEIGO_BAG_COMICS[2]}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: showFinalPeek ? 1 : 0,
              transition: "opacity 260ms ease",
            }}
          />
        </Flex>
      ) : null}
    </>
  );
}

type ExhibitionMetroDogLine = {
  speaker: "小麥" | "小貝狗";
  text: string;
  spriteId: "mai" | "beigo";
  frameIndex: number;
  motionId?: "jump-once" | "sway-horizontal" | "pop-scale";
  showCameraComic?: boolean;
  beigoComicPresentation?: "bag" | "reveal";
  typingPauseAfterText?: string;
  typingPauseDelayMs?: number;
};

const EXHIBITION_METRO_DOG_BEFORE_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "呃！怎麼會有黃金獵犬？",
    spriteId: "mai",
    frameIndex: 33,
  },
  {
    speaker: "小麥",
    text: "等等……車門關上了，牠的尾巴還被夾住了！",
    spriteId: "mai",
    frameIndex: 33,
  },
  {
    speaker: "小麥",
    text: "嗯？怎麼感覺包裡有東西在動……",
    spriteId: "mai",
    frameIndex: 32,
    beigoComicPresentation: "bag",
  },
  {
    speaker: "小麥",
    text: "哇！你什麼時候跟過來的！",
    spriteId: "mai",
    frameIndex: 25,
    beigoComicPresentation: "reveal",
    typingPauseAfterText: "哇！",
    typingPauseDelayMs: BEIGO_REVEAL_COMIC_COMPLETE_MS,
  },
  {
    speaker: "小貝狗",
    text: "小日獸！小日獸！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "jump-once",
  },
  {
    speaker: "小麥",
    text: "你說的小日獸……是指牠？",
    spriteId: "mai",
    frameIndex: 34,
  },
  {
    speaker: "小貝狗",
    text: "拍照！拍照！",
    spriteId: "beigo",
    frameIndex: 0,
    motionId: "sway-horizontal",
  },
  {
    speaker: "小麥",
    text: "拍照？你是要我拍牠？",
    spriteId: "mai",
    frameIndex: 33,
    showCameraComic: true,
  },
  {
    speaker: "小麥",
    text: "好啦好啦，別催！我按就是了……",
    spriteId: "mai",
    frameIndex: 21,
    showCameraComic: true,
  },
] as const;

const EXHIBITION_METRO_DOG_AFTER_PHOTO: readonly ExhibitionMetroDogLine[] = [
  {
    speaker: "小麥",
    text: "咦？黃金獵犬呢？",
    spriteId: "mai",
    frameIndex: 35,
  },
  {
    speaker: "小貝狗",
    text: "嗷嗷！日記！日記！",
    spriteId: "beigo",
    frameIndex: 2,
    motionId: "jump-once",
  },
  {
    speaker: "小麥",
    text: "這是……小白的日記？",
    spriteId: "mai",
    frameIndex: 14,
  },
] as const;

type ExhibitionMetroDogProgress = {
  stage: "before" | "photo" | "after";
  lineIndex: number;
  sceneStep: string;
};

function getExhibitionMetroDogProgress(sceneStep: string | null): ExhibitionMetroDogProgress {
  const fallback: ExhibitionMetroDogProgress = {
    stage: "before",
    lineIndex: 0,
    sceneStep: "before-0",
  };
  if (sceneStep === "photo") {
    return {
      stage: "photo",
      lineIndex: EXHIBITION_METRO_DOG_BEFORE_PHOTO.length - 1,
      sceneStep,
    };
  }

  const match = sceneStep?.match(/^(before|after)-(\d+)$/);
  if (!match) return fallback;
  const stage = match[1] as "before" | "after";
  const lineIndex = Number(match[2]);
  const lines = stage === "after"
    ? EXHIBITION_METRO_DOG_AFTER_PHOTO
    : EXHIBITION_METRO_DOG_BEFORE_PHOTO;
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length) {
    return fallback;
  }
  return { stage, lineIndex, sceneStep: `${stage}-${lineIndex}` };
}

function ExhibitionMetroDogCapture({
  initialSceneStep,
  onPhotoCaptured,
  onComplete,
}: {
  initialSceneStep: string | null;
  onPhotoCaptured: (result: PhotoCaptureResult) => void;
  onComplete: () => void;
}) {
  const [initialProgress] = useState(() =>
    getExhibitionMetroDogProgress(initialSceneStep),
  );
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [lineIndex, setLineIndex] = useState(initialProgress.lineIndex);
  const [isPhotoMode, setIsPhotoMode] = useState(initialProgress.stage === "photo");
  const [isAfterPhoto, setIsAfterPhoto] = useState(initialProgress.stage === "after");
  const [dogFrameIndex, setDogFrameIndex] = useState(0);
  const [typingMode] = useState(loadDialogTypingMode);
  const activeLines = isAfterPhoto
    ? EXHIBITION_METRO_DOG_AFTER_PHOTO
    : EXHIBITION_METRO_DOG_BEFORE_PHOTO;
  const line = activeLines[Math.min(lineIndex, activeLines.length - 1)];
  const dogFrameImage = METRO_DOG_FRAMES[dogFrameIndex];

  useEffect(() => {
    replaceExhibitionPhaseInUrl("metro-dog", initialProgress.sceneStep);
  }, [initialProgress.sceneStep]);

  useEffect(() => {
    const image = new Image();
    image.src = METRO_BACKGROUND;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, []);

  useEffect(() => {
    if (isAfterPhoto) return;
    const timer = window.setInterval(() => {
      setDogFrameIndex((current) => (current + 1) % METRO_DOG_FRAMES.length);
    }, 300);
    return () => window.clearInterval(timer);
  }, [isAfterPhoto]);

  const advance = () => {
    if (lineIndex < activeLines.length - 1) {
      const nextLineIndex = lineIndex + 1;
      setLineIndex(nextLineIndex);
      replaceExhibitionPhaseInUrl(
        "metro-dog",
        `${isAfterPhoto ? "after" : "before"}-${nextLineIndex}`,
      );
      return;
    }
    if (!isAfterPhoto) {
      setIsPhotoMode(true);
      replaceExhibitionPhaseInUrl("metro-dog", "photo");
      return;
    }
    onComplete();
  };

  return (
    <Flex position="absolute" inset="0" direction="column" overflow="hidden" bgColor="#1B1A18">
      <Flex
        ref={backgroundRef}
        position="relative"
        flex="1"
        minH="0"
        bgImage={'url("' + METRO_BACKGROUND + '")'}
        bgSize={isPhotoMode ? "contain" : "cover"}
        backgroundPosition="center"
        bgRepeat="no-repeat"
      >
        {!isAfterPhoto && !isPhotoMode ? (
          <img
            src={dogFrameImage}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              pointerEvents: "none",
            }}
          />
        ) : null}

        {!isPhotoMode && line.beigoComicPresentation ? (
          <BeigoBagComic
            key={`${lineIndex}-${line.beigoComicPresentation}`}
            presentation={line.beigoComicPresentation}
          />
        ) : null}

        {!isPhotoMode && line.showCameraComic ? (
          <Flex
            position="absolute"
            left="50%"
            top="142px"
            zIndex={5}
            w="80%"
            maxW="290px"
            transform="translateX(-50%)"
            pointerEvents="none"
          >
            <img
              src={CAMERA_COMIC}
              alt="小貝狗拿出的相機漫畫格"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          backgroundRef={backgroundRef}
          backgroundImageSrc={METRO_BACKGROUND}
          naturalImageSize={naturalImageSize}
          fitMode="contain"
          captureOverlays={[
            {
              imageSrc: dogFrameImage,
              rectNormalized: { x: 0, y: 0, width: 1, height: 1 },
            },
          ]}
          targetRectNormalized={METRO_DOG_TARGET_RECT_NORMALIZED}
          passScore={60}
          hintText="點擊畫面或空白鍵捕捉小日獸"
          tutorialTitle="拍下小日獸"
          tutorialLines={["白框對準時，按下快門！"]}
          tutorialDemoImageSrc="/images/428出圖/拍照動物/黃金獵犬.png"
          tutorialDemoImageAlt="黃金獵犬小日獸"
          tutorialConfirmLabel="開始拍照"
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          frameSweepFromY={20}
          frameSweepToY={604}
          targetFadeLeadPx={50}
          onConfirm={(result) => {
            onPhotoCaptured(result);
            setIsPhotoMode(false);
            setIsAfterPhoto(true);
            setLineIndex(0);
            replaceExhibitionPhaseInUrl("metro-dog", "after-0");
          }}
        />
      </Flex>

      {!isPhotoMode ? (
        <StoryDialogPanel
          key={(isAfterPhoto ? "after-" : "before-") + lineIndex}
          characterName={line.speaker}
          dialogue={line.text}
          onContinue={advance}
          showAvatarSprite
          avatarSpriteId={line.spriteId}
          avatarFrameIndex={line.frameIndex}
          avatarMotionId={line.motionId}
          typingMode={typingMode}
          typingPauseAfterText={line.typingPauseAfterText}
          typingPauseDelayMs={line.typingPauseDelayMs}
        />
      ) : null}
    </Flex>
  );
}

function PhotoDiaryTransition({
  stage,
  photoImagePath,
  onBookOpen,
  onPhotoContinue,
  onDiaryContinue,
}: {
  stage: ExhibitionPhotoDiaryStage;
  photoImagePath: string;
  onBookOpen: () => void;
  onPhotoContinue: () => void;
  onDiaryContinue: () => void;
}) {
  return (
    <Flex position="absolute" inset="0" zIndex={72} direction="column">
      {stage === "book" ? (
        <DiaryBookOpenPromptPage onOpen={onBookOpen} />
      ) : stage === "photo-detail" ? (
        <NaotaroPhotoDiaryRevealPage
          photoImagePath={photoImagePath}
          onContinue={onPhotoContinue}
        />
      ) : stage === "diary-unlock" ? (
        <NaotaroDiaryUnlockPage onContinue={onDiaryContinue} />
      ) : (
        <PhotoDiarySlidePage
          photoImagePath={photoImagePath}
          photoRevealName="直太郎"
        />
      )}
    </Flex>
  );
}

function CompleteCard({ onRestart }: { onRestart: () => void }) {
  return (
    <Flex position="absolute" inset="0" direction="column" alignItems="center" justifyContent="center" px="30px" bg="linear-gradient(160deg, #3D342F 0%, #6F5543 52%, #2E2928 100%)" overflow="hidden">
      <Box position="absolute" w="330px" h="330px" borderRadius="999px" bg="radial-gradient(circle, rgba(255,219,121,0.34), transparent 68%)" animation={`${completeGlow} 2400ms ease-in-out infinite`} />
      <Flex position="relative" zIndex={2} direction="column" alignItems="center" textAlign="center">
        <Text color="#EBCB82" fontSize="12px" fontWeight="900" letterSpacing="0.18em">EXHIBITION EXPERIENCE</Text>
        <Text mt="16px" color="#FFF5DF" fontSize="29px" fontWeight="900" lineHeight="1.25">小白又動了一點</Text>
        <Text mt="12px" color="rgba(255,245,223,0.76)" fontSize="15px" fontWeight="700" lineHeight="1.7">
          直太郎回到日記，青蛙留下新的片段。{`\n`}小麥還在等小白醒來，把前天沒說完的話說清楚。
        </Text>
        <Text mt="28px" color="#F0D9A5" fontSize="17px" fontWeight="900" letterSpacing="0.12em">未完待續</Text>
        <Flex as="button" mt="38px" h="48px" minW="214px" px="24px" borderRadius="999px" bgColor="#E39A48" color="white" alignItems="center" justifyContent="center" gap="9px" boxShadow="0 10px 22px rgba(24,18,15,0.32)" onClick={onRestart}>
          <FiRotateCcw size={17} />
          <Text fontSize="14px" fontWeight="900">重新體驗</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export function ExhibitionExperienceView({
  initialPreview = null,
  initialSceneStep = null,
}: {
  initialPreview?: ExhibitionPhase | null;
  initialSceneStep?: string | null;
}) {
  const [initialViewState] = useState(() =>
    getInitialExhibitionViewState(initialPreview, initialSceneStep),
  );
  const [phase, setPhase] = useState<ExhibitionPhase>(initialViewState.phase);
  const [lineIndex, setLineIndex] = useState(initialViewState.lineIndex);
  const [runKey, setRunKey] = useState(0);
  const [photoDiaryStage, setPhotoDiaryStage] = useState<ExhibitionPhotoDiaryStage>(
    initialViewState.photoDiaryStage,
  );
  const [naotaroPhotoImagePath, setNaotaroPhotoImagePath] = useState(
    EXHIBITION_NAOTARO_PHOTO_FALLBACK,
  );
  const [isOpeningTransitionVisible, setIsOpeningTransitionVisible] = useState(
    initialViewState.isOpeningTransitionVisible,
  );

  const activeNarrativeLines = useMemo(
    () => (isNarrativePhase(phase) ? EXHIBITION_NARRATIVE_LINES[phase] : null),
    [phase],
  );
  const streetFlyerStage = FROG_DIARY_CLUE_STAGES[1];
  const convenienceStage = FROG_DIARY_CLUE_STAGES[0];
  const dessertStage = useMemo(() => {
    const source = FROG_DIARY_CLUE_STAGES[2];
    return {
      ...source,
      lines: source.lines.map((line, index) =>
        index === 0
          ? {
              ...line,
              text: "下班後，小麥和同事走進那間熟悉的甜點店。",
            }
          : line,
      ),
    };
  }, []);

  useEffect(() => {
    [
      ...EXHIBITION_NARRATIVE_BACKGROUND_IMAGES,
      EXHIBITION_OFFICE_BACKGROUND,
      ...EXHIBITION_OFFICE_WORK_FRAMES,
      EXHIBITION_OFFICE_WORK_LOOK_FRAME,
      ...EXHIBITION_OFFICE_WORK_DUSK_FRAMES,
      ...FLASHBACK_FALL_FULLSCREEN_FRAMES,
    ].forEach((imageUrl) => {
      void preloadGameImage(imageUrl).catch(() => undefined);
    });
    try {
      const savedPhoto = window.sessionStorage.getItem(EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY);
      if (savedPhoto) setNaotaroPhotoImagePath(savedPhoto);
    } catch {
      // The exhibition flow still has a bundled fallback when session storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (initialPreview === null) {
      replaceExhibitionPhaseInUrl(
        "departure-opening",
        EXHIBITION_NARRATIVE_LINES["departure-opening"][0]?.id,
      );
      return;
    }

    if (isNarrativePhase(initialPreview)) {
      const initialLine = EXHIBITION_NARRATIVE_LINES[initialPreview][initialViewState.lineIndex];
      if (initialSceneStep !== initialLine?.id) {
        replaceExhibitionPhaseInUrl(initialPreview, initialLine?.id);
      }
      return;
    }

    if (initialPreview === "dog-photo-diary") {
      if (initialSceneStep !== initialViewState.photoDiaryStage) {
        replaceExhibitionPhaseInUrl(initialPreview, initialViewState.photoDiaryStage);
      }
      return;
    }

    if (initialPreview !== "metro-dog" && initialSceneStep !== null) {
      replaceExhibitionPhaseInUrl(initialPreview);
    }
  }, [initialPreview, initialSceneStep, initialViewState]);

  useEffect(() => {
    if (phase !== "dog-photo-diary") {
      return;
    }
    if (photoDiaryStage !== "photo-slide") return;
    const timer = window.setTimeout(() => {
      setPhotoDiaryStage("photo-detail");
      replaceExhibitionPhaseInUrl("dog-photo-diary", "photo-detail");
    }, 1280);
    return () => window.clearTimeout(timer);
  }, [phase, photoDiaryStage]);

  const goToPhase = (nextPhase: ExhibitionPhase) => {
    setLineIndex(0);
    if (nextPhase === "dog-photo-diary") {
      setPhotoDiaryStage("book");
    }
    setPhase(nextPhase);
    replaceExhibitionPhaseInUrl(
      nextPhase,
      nextPhase === "dog-photo-diary"
        ? "book"
        : isNarrativePhase(nextPhase)
        ? EXHIBITION_NARRATIVE_LINES[nextPhase][0]?.id
        : undefined,
    );
  };

  const advanceNarrative = () => {
    if (!isNarrativePhase(phase) || !activeNarrativeLines) return;
    if (lineIndex < activeNarrativeLines.length - 1) {
      const nextLineIndex = lineIndex + 1;
      setLineIndex(nextLineIndex);
      replaceExhibitionPhaseInUrl(phase, activeNarrativeLines[nextLineIndex]?.id);
      return;
    }
    goToPhase(EXHIBITION_NARRATIVE_NEXT_PHASE[phase]);
  };

  const restart = () => {
    setRunKey((current) => current + 1);
    setLineIndex(0);
    setPhotoDiaryStage("book");
    setNaotaroPhotoImagePath(EXHIBITION_NAOTARO_PHOTO_FALLBACK);
    try {
      window.sessionStorage.removeItem(EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions; the in-memory fallback is enough for replay.
    }
    setPhase("departure-opening");
    setIsOpeningTransitionVisible(true);
    replaceExhibitionPhaseInUrl(
      "departure-opening",
      EXHIBITION_NARRATIVE_LINES["departure-opening"][0]?.id,
    );
  };

  return (
    <Flex
      key={runKey}
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      bgColor="#242326"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.14)" }}
      data-exhibition-phase={phase}
    >
      {isOpeningTransitionVisible ? (
        <ExhibitionOpeningTransition onComplete={() => setIsOpeningTransitionVisible(false)} />
      ) : null}

      {!isOpeningTransitionVisible && isNarrativePhase(phase) ? (
        <NarrativeScene phase={phase} lineIndex={lineIndex} onAdvance={advanceNarrative} />
      ) : null}

      {phase === "mai-intro" ? <ExhibitionMaiIntro onComplete={() => goToPhase("departure-plan")} /> : null}

      {phase === "departure-route" ? <ExhibitionHomeMetroRouteView onComplete={() => goToPhase("metro-arrival")} /> : null}

      {phase === "metro-comic" ? <MetroComicScene onAdvance={() => goToPhase("metro-dog")} /> : null}

      {phase === "metro-dog" ? (
        <ExhibitionMetroDogCapture
          key={`exhibition-metro-${runKey}`}
          initialSceneStep={
            runKey === 0 && initialPreview === "metro-dog" ? initialSceneStep : null
          }
          onPhotoCaptured={(result) => {
            setNaotaroPhotoImagePath(result.polaroidUrl);
            try {
              window.sessionStorage.setItem(
                EXHIBITION_NAOTARO_PHOTO_STORAGE_KEY,
                result.polaroidUrl,
              );
            } catch {
              // Keep the captured photo in memory when session storage is unavailable.
            }
          }}
          onComplete={() => goToPhase("dog-photo-diary")}
        />
      ) : null}

      {phase === "dog-photo-diary" ? (
        <PhotoDiaryTransition
          stage={photoDiaryStage}
          photoImagePath={naotaroPhotoImagePath}
          onBookOpen={() => {
            setPhotoDiaryStage("photo-slide");
            replaceExhibitionPhaseInUrl("dog-photo-diary", "photo-slide");
          }}
          onPhotoContinue={() => {
            setPhotoDiaryStage("diary-unlock");
            replaceExhibitionPhaseInUrl("dog-photo-diary", "diary-unlock");
          }}
          onDiaryContinue={() => goToPhase("diary-incomplete")}
        />
      ) : null}

      {phase === "diary-incomplete" ? <ExhibitionIncompleteBaiEntry1DiaryPuzzle onComplete={() => goToPhase("post-puzzle-metro")} /> : null}

      {phase === "metro-to-company" ? (
        <DepartureTransitionOverlay
          mapPoints={EXHIBITION_METRO_TO_COMPANY_TRANSITION_POINTS}
          mapStartPercent={50}
          mapEndPercent={91}
          onFinish={() => goToPhase("office-opening")}
        />
      ) : null}

      {phase === "office-opening" ? (
        <ExhibitionOfficeOpening onComplete={() => goToPhase("work-arrival")} />
      ) : null}

      {phase === "box-game" ? (
        <CabinetBoxStackMinigameModal
          key={`exhibition-box-${runKey}`}
          baseFatigue={0}
          title="幫同事整理資料箱"
          successRewardHeading="上午的小插曲"
          successRewardLabel="資料箱整理完成"
          successFootnote="箱子疊回櫃子，缺少的日記相片留待回家尋找"
          onSolved={() => undefined}
          onSkip={() => goToPhase("work-complete")}
          onComplete={() => goToPhase("work-complete")}
        />
      ) : null}

      {phase === "work-dusk" ? (
        <ExhibitionWorkDuskTransition onComplete={() => goToPhase("work-leave")} />
      ) : null}

      {phase === "vacuum-game" ? (
        <RobotVacuumOneStrokeMinigame
          key={`exhibition-vacuum-${runKey}`}
          levelLimit={1}
          eyebrow="展覽篇・尋找缺少的相片"
          showSecrets={false}
          requireYellowPillow
          yellowPillowAriaLabel="翻開黃色枕頭尋找相片"
          yellowPillowNotice="翻開枕頭，找到缺少的日記相片！"
          yellowPillowFoundIcon="🖼️"
          yellowPillowFoundLabel="缺少的相片 ×1"
          successTitle="找到缺少的相片"
          successDescription="地板清掃完成，黃色枕頭下也找回了日記缺少的那一格。"
          onYellowPillowFound={() => undefined}
          onSolved={() => undefined}
          onSkip={() => goToPhase("diary-restore")}
          onComplete={() => goToPhase("diary-restore")}
        />
      ) : null}

      {phase === "diary-restore" ? (
        <DiaryOverlay
          key={`exhibition-diary-${runKey}`}
          open
          unlockedEntryIds={["bai-entry-1"]}
          initialJournalView="entry-bai-1"
          initialBaiEntry1RestorationPreview
          baiEntry1ReadTalkLines={[...EXHIBITION_DIARY_READ_LINES]}
          hideBaiEntry1BackButton
          completeBaiEntry1NaotaroRevealOnRead
          onClose={() => goToPhase("bai-change-first")}
          onDiaryRevealEntryComplete={() => goToPhase("bai-change-first")}
        />
      ) : null}

      {phase === "morning-route" ? <ExhibitionStreetStoreRouteView onComplete={() => goToPhase("street-flyer")} /> : null}

      {phase === "street-flyer" ? (
        <FrogDiaryClueEventModal
          key={`exhibition-street-${runKey}`}
          stage={streetFlyerStage}
          savings={12720}
          actionPower={72}
          fatigue={24}
          photoAttemptNumber={1}
          recordProgress={false}
          skipPhotoCapture
          onFinish={() => goToPhase("convenience-clerk")}
        />
      ) : null}

      {phase === "convenience-clerk" ? (
        <FrogDiaryClueEventModal
          key={`exhibition-store-${runKey}`}
          stage={convenienceStage}
          savings={12640}
          actionPower={68}
          fatigue={27}
          photoAttemptNumber={2}
          recordProgress={false}
          skipPhotoCapture
          onFinish={() => goToPhase("work-return")}
        />
      ) : null}

      {phase === "work-value" ? <OfficeWorkValueMinigame onSkip={() => goToPhase("dessert-transition")} onComplete={() => goToPhase("dessert-transition")} /> : null}

      {phase === "frog-dessert" ? (
        <FrogDiaryClueEventModal
          key={`exhibition-dessert-${runKey}`}
          stage={dessertStage}
          savings={12480}
          actionPower={58}
          fatigue={34}
          photoAttemptNumber={3}
          requiredPhotoAttempts={3}
          recordProgress={false}
          onFinish={() => goToPhase("home-final")}
        />
      ) : null}

      {phase === "complete" ? <CompleteCard onRestart={restart} /> : null}

    </Flex>
  );
}

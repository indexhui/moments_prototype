"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiArrowRight, FiRotateCcw } from "react-icons/fi";
import {
  DiaryOverlay,
  ExhibitionIncompleteBaiEntry1DiaryPuzzle,
  PhotoDiarySlidePage,
} from "@/components/game/DiaryOverlay";
import {
  CharacterIntroOverlay,
  MAI_CHARACTER_INTRO_CARD,
} from "@/components/game/CharacterIntroOverlay";
import {
  ExhibitionHomeMetroRouteView,
  ExhibitionStreetStoreRouteView,
} from "@/components/game/StorySimpleMetroRouteView";
import { CabinetBoxStackMinigameModal } from "@/components/game/events/CabinetBoxStackMinigameModal";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { FrogDiaryClueEventModal } from "@/components/game/events/FrogDiaryClueEventModal";
import { OfficeWorkValueMinigame } from "@/components/game/events/OfficeWorkValueMinigame";
import { RobotVacuumOneStrokeMinigame } from "@/components/game/events/RobotVacuumOneStrokeMinigame";
import { StoryDialogPanel } from "@/components/game/StoryDialogPanel";
import { loadDialogTypingMode } from "@/lib/game/dialogTyping";
import {
  EXHIBITION_DIARY_READ_LINES,
  EXHIBITION_NARRATIVE_LINES,
  EXHIBITION_NARRATIVE_NEXT_PHASE,
  isExhibitionPhase,
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

const NARRATIVE_PHASES: readonly ExhibitionNarrativePhase[] = [
  "departure-opening",
  "departure-plan",
  "metro-arrival",
  "metro-opening",
  "work-arrival",
  "home-search",
  "bai-change-first",
  "bai-after-flashback",
  "morning-route-intro",
  "work-return",
  "dessert-transition",
  "home-final",
  "argument-flashback",
];

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
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運１.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運２.png",
  "/images/428出圖/追加作畫/黃金獵犬/漫畫格_捷運3.png",
] as const;
const BEIGO_BAG_COMICS = [
  "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
] as const;
const FLASHBACK_FALL_COMIC_PANELS = [
  "/images/428出圖/追加作畫/漫畫格/踩到.png",
  "/images/428出圖/追加作畫/漫畫格/跌倒.png",
] as const;
const FLASHBACK_DOOR_CLOSE_COMIC = "/images/428出圖/追加作畫/漫畫格/關門.png";

function isNarrativePhase(phase: ExhibitionPhase): phase is ExhibitionNarrativePhase {
  return NARRATIVE_PHASES.includes(phase as ExhibitionNarrativePhase);
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

  return (
    <Flex
      key={line.id}
      position="absolute"
      inset="0"
      direction="column"
      bgColor="#2A292E"
      bgImage={`url("${line.backgroundImage}")`}
      bgSize={line.backgroundSize ?? "cover"}
      backgroundPosition={line.backgroundPosition ?? "center bottom"}
      bgRepeat="no-repeat"
      filter={line.flashback ? "sepia(0.2) saturate(0.78)" : undefined}
    >
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

      <Flex flex="1" minH="0" position="relative" />

      <StoryDialogPanel
        characterName={line.speaker}
        dialogue={line.text}
        dialogueItalicPrefix={isNarration ? line.text : undefined}
        onContinue={onAdvance}
        showAvatarSprite={Boolean(line.avatar)}
        showCharacterName={!isNarration}
        avatarSpriteId={line.avatar?.spriteId}
        avatarFrameIndex={line.avatar?.frameIndex}
        avatarMotionId={line.avatar?.motionId}
        isInnerThought={isInnerThought}
        typingMode={typingMode}
      />
    </Flex>
  );
}

function ExhibitionMaiIntro({ onComplete }: { onComplete: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      overflow="hidden"
      bgImage='url("/images/428出圖/背景/房間_開燈.jpg")'
      bgSize="cover"
      backgroundPosition="center"
    >
      <CharacterIntroOverlay intro={MAI_CHARACTER_INTRO_CARD} onClose={onComplete} />
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
    text: "……我居然真的在捷運上拍了一隻被夾住的黃金獵犬。",
    spriteId: "mai",
    frameIndex: 12,
  },
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

function ExhibitionMetroDogCapture({ onComplete }: { onComplete: () => void }) {
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [isAfterPhoto, setIsAfterPhoto] = useState(false);
  const [dogFrameIndex, setDogFrameIndex] = useState(0);
  const [typingMode] = useState(loadDialogTypingMode);
  const activeLines = isAfterPhoto
    ? EXHIBITION_METRO_DOG_AFTER_PHOTO
    : EXHIBITION_METRO_DOG_BEFORE_PHOTO;
  const line = activeLines[Math.min(lineIndex, activeLines.length - 1)];
  const dogFrameImage = METRO_DOG_FRAMES[dogFrameIndex];

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
      setLineIndex((current) => current + 1);
      return;
    }
    if (!isAfterPhoto) {
      setIsPhotoMode(true);
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
          tutorialLines={[
            "等白色框框移到黃金獵犬身上。",
            "覺得位置差不多了，就按下快門！",
          ]}
          tutorialConfirmLabel="開始拍照"
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          targetFadeLeadPx={50}
          onConfirm={() => {
            setIsPhotoMode(false);
            setIsAfterPhoto(true);
            setLineIndex(0);
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
        />
      ) : null}
    </Flex>
  );
}

function PhotoDiaryTransition({ ready, onContinue }: { ready: boolean; onContinue: () => void }) {
  return (
    <Flex position="absolute" inset="0" zIndex={72} direction="column">
      <PhotoDiarySlidePage
        photoImagePath="/images/428出圖/拍照動物/黃金獵犬.png"
        photoRevealName="直太郎"
      />
      {ready ? (
        <Flex
          as="button"
          position="absolute"
          left="50%"
          bottom="28px"
          transform="translateX(-50%)"
          minW="236px"
          h="50px"
          px="20px"
          borderRadius="999px"
          bgColor="#FFF9EC"
          color="#765942"
          alignItems="center"
          justifyContent="center"
          gap="8px"
          boxShadow="0 12px 26px rgba(52,35,22,0.28)"
          animation={`${clueCardIn} 260ms ease both`}
          onClick={onContinue}
        >
          <Text fontSize="14px" fontWeight="900">照片飛進了小白的日記</Text>
          <FiArrowRight size={18} />
        </Flex>
      ) : null}
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

export function ExhibitionExperienceView() {
  const [phase, setPhase] = useState<ExhibitionPhase>("departure-opening");
  const [lineIndex, setLineIndex] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [photoSlideReady, setPhotoSlideReady] = useState(false);

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
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (!isExhibitionPhase(preview)) return;
    setLineIndex(0);
    setPhase(preview);
  }, []);

  useEffect(() => {
    if (phase !== "dog-photo-diary") {
      setPhotoSlideReady(false);
      return;
    }
    const timer = window.setTimeout(() => setPhotoSlideReady(true), 1280);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const goToPhase = (nextPhase: ExhibitionPhase) => {
    setLineIndex(0);
    setPhase(nextPhase);
  };

  const advanceNarrative = () => {
    if (!isNarrativePhase(phase) || !activeNarrativeLines) return;
    if (lineIndex < activeNarrativeLines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    goToPhase(EXHIBITION_NARRATIVE_NEXT_PHASE[phase]);
  };

  const restart = () => {
    setRunKey((current) => current + 1);
    setLineIndex(0);
    setPhotoSlideReady(false);
    setPhase("departure-opening");
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
      {isNarrativePhase(phase) ? <NarrativeScene phase={phase} lineIndex={lineIndex} onAdvance={advanceNarrative} /> : null}

      {phase === "mai-intro" ? <ExhibitionMaiIntro onComplete={() => goToPhase("departure-plan")} /> : null}

      {phase === "departure-route" ? <ExhibitionHomeMetroRouteView onComplete={() => goToPhase("metro-arrival")} /> : null}

      {phase === "metro-comic" ? <MetroComicScene onAdvance={() => goToPhase("metro-dog")} /> : null}

      {phase === "metro-dog" ? (
        <ExhibitionMetroDogCapture
          key={`exhibition-metro-${runKey}`}
          onComplete={() => goToPhase("dog-photo-diary")}
        />
      ) : null}

      {phase === "dog-photo-diary" ? <PhotoDiaryTransition ready={photoSlideReady} onContinue={() => goToPhase("diary-incomplete")} /> : null}

      {phase === "diary-incomplete" ? <ExhibitionIncompleteBaiEntry1DiaryPuzzle onComplete={() => goToPhase("work-arrival")} /> : null}

      {phase === "box-game" ? (
        <CabinetBoxStackMinigameModal
          key={`exhibition-box-${runKey}`}
          baseFatigue={0}
          title="幫同事整理資料箱"
          successRewardHeading="上午的小插曲"
          successRewardLabel="資料箱整理完成"
          successFootnote="箱子疊回櫃子，缺少的日記相片留待回家尋找"
          onSolved={() => undefined}
          onSkip={() => goToPhase("home-search")}
          onComplete={() => goToPhase("home-search")}
        />
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

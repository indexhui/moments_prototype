"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FaCoins } from "react-icons/fa6";
import { IoAlbumsOutline, IoChevronForward, IoLocation } from "react-icons/io5";
import { EventAvatarSprite, type AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EVENT_DIALOG_HEIGHT, EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { ROUTES } from "@/lib/routes";
import {
  DAILY_ADVENTURE_COMPANIONS,
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_ROUTE_TILES,
  isDailyAdventureCapturedPhotoRecord,
  recordDailyAdventureBeigoPhotoCapture,
  type DailyAdventureLocationId,
  type DailyAdventureResult,
} from "@/lib/game/dailyAdventure";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { markDailyAdventureLobbyGuideLevelOneCompleted } from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import { DailyAdventureRecordArtwork, DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";

const KIND_LABEL = { text: "文字事件", comic: "日常漫畫格", photo: "小日獸照片" } as const;
const BEIGO_DAILY_PHOTO_IMAGE_PATH = "/images/lobby/beigo_idle.png";

type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const BEIGO_PHOTO_TARGET_BY_LOCATION: Record<DailyAdventureLocationId, NormalizedRect> = {
  street: { x: 0.33, y: 0.55, width: 0.34, height: 0.28 },
  "metro-station": { x: 0.36, y: 0.53, width: 0.34, height: 0.28 },
  "convenience-store": { x: 0.34, y: 0.56, width: 0.34, height: 0.27 },
  "breakfast-shop": { x: 0.35, y: 0.55, width: 0.34, height: 0.28 },
  park: { x: 0.34, y: 0.54, width: 0.34, height: 0.29 },
  "bus-stop": { x: 0.35, y: 0.54, width: 0.34, height: 0.28 },
};

type EncounterDialogueLine = {
  speaker: string;
  text: string;
  spriteId: AvatarSpriteId;
  frameIndex: number;
};

const LOCATION_OPENING: Record<DailyAdventureLocationId, EncounterDialogueLine> = {
  street: {
    speaker: "小麥",
    text: "咦，前面的招牌好像被風吹歪了。",
    spriteId: "mai",
    frameIndex: 33,
  },
  "metro-station": {
    speaker: "小麥",
    text: "下一班車還要等一下，我們慢慢走吧。",
    spriteId: "mai",
    frameIndex: 37,
  },
  "convenience-store": {
    speaker: "便利商店店員",
    text: "歡迎光臨。今天也帶著小日獸一起出門嗎？",
    spriteId: "convenience-clerk",
    frameIndex: 0,
  },
  "breakfast-shop": {
    speaker: "早餐店老闆",
    text: "早安，今天還是和這孩子一起來呀。",
    spriteId: "breakfast-owner",
    frameIndex: 0,
  },
  park: {
    speaker: "小麥",
    text: "這裡的風剛剛好，先坐一下吧。",
    spriteId: "mai",
    frameIndex: 6,
  },
  "bus-stop": {
    speaker: "小麥",
    text: "公車還沒來，我們再等一下。",
    spriteId: "mai",
    frameIndex: 37,
  },
};

function buildEncounterDialogue(result: DailyAdventureResult): EncounterDialogueLine[] {
  const companion = DAILY_ADVENTURE_COMPANIONS[result.record.companionId];
  const outcomeText = result.record.kind === "text"
    ? result.record.description
    : result.record.kind === "comic"
      ? "剛才那一幕很像完整的一格漫畫，我想把它記下來。"
      : `${companion.name}，先別動。這個表情一定要拍下來。`;
  return [
    LOCATION_OPENING[result.record.locationId],
    {
      speaker: "小麥",
      text: outcomeText,
      spriteId: "mai",
      frameIndex: result.record.kind === "photo" ? 6 : 19,
    },
  ];
}

function DailyAdventureEncounter({
  result,
  dialogueIndex,
  onContinue,
}: {
  result: DailyAdventureResult;
  dialogueIndex: number;
  onContinue: () => void;
}) {
  const location = DAILY_ADVENTURE_LOCATIONS[result.record.locationId];
  const dialogue = useMemo(() => buildEncounterDialogue(result), [result]);
  const line = dialogue[dialogueIndex];
  const isLastLine = dialogueIndex === dialogue.length - 1;

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        w="100%"
        h="100%"
        position="relative"
        direction="column"
        borderRadius={{ base: "0", sm: "20px" }}
        overflow="hidden"
        bgColor="#342B25"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
      >
        <img
          src={location.imagePath}
          alt={location.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(38,29,23,0.2), rgba(38,29,23,0.08) 52%, rgba(38,29,23,0.38))" />
        <Flex
          position="absolute"
          top="14px"
          left="14px"
          zIndex={7}
          h="30px"
          px="11px"
          borderRadius="999px"
          bgColor="rgba(65,48,37,0.76)"
          alignItems="center"
        >
          <Text color="white" fontSize="11px" fontWeight="900">日常事件・{location.name}</Text>
        </Flex>
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          zIndex={6}
          pointerEvents="none"
        >
          <EventAvatarSprite
            key={`${dialogueIndex}:${line.spriteId}`}
            spriteId={line.spriteId}
            frameIndex={line.frameIndex}
          />
        </Flex>
        <Flex mt="auto" w="100%" position="relative" zIndex={8}>
          <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
            <Text color="white" fontWeight="700">{line.speaker}</Text>
            <Flex flex="1" minH="0" direction="column" justifyContent="center">
              <Text color="white" fontSize="16px" lineHeight="1.55">{line.text}</Text>
            </Flex>
            <EventContinueAction
              label={isLastLine ? "查看冒險結果" : "點擊繼續"}
              onClick={onContinue}
            />
          </EventDialogPanel>
        </Flex>
      </Flex>
    </Flex>
  );
}

function DailyAdventureBeigoPhotoCapture({
  result,
  onComplete,
}: {
  result: DailyAdventureResult;
  onComplete: (updatedResult: DailyAdventureResult | null) => void;
}) {
  const location = DAILY_ADVENTURE_LOCATIONS[result.record.locationId];
  const backgroundImageSrc = location.imagePath;
  const targetRect = BEIGO_PHOTO_TARGET_BY_LOCATION[result.record.locationId];
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const captureOverlays = useMemo(
    () => [{ imageSrc: BEIGO_DAILY_PHOTO_IMAGE_PATH, rectNormalized: targetRect }],
    [targetRect],
  );

  useEffect(() => {
    let isCancelled = false;
    setNaturalImageSize(null);
    const image = new Image();
    image.src = backgroundImageSrc;
    image.onload = () => {
      if (isCancelled) return;
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    return () => {
      isCancelled = true;
    };
  }, [backgroundImageSrc]);

  const handleConfirmPhoto = (capture: PhotoCaptureResult) => {
    const updatedResult = recordDailyAdventureBeigoPhotoCapture(capture.framePreviewUrl);
    onComplete(updatedResult);
  };

  return (
    <Flex w={{ base: "100vw", sm: "393px" }} maxW="393px" h={{ base: "100dvh", sm: "852px" }} maxH="852px" position="relative">
      <Flex
        ref={backgroundRef}
        w="100%"
        h="100%"
        position="relative"
        direction="column"
        overflow="hidden"
        borderRadius={{ base: "0", sm: "20px" }}
        bgColor="#161311"
        bgImage={`url("${backgroundImageSrc}")`}
        bgSize="cover"
        backgroundPosition="center center"
        backgroundRepeat="no-repeat"
        boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
      >
        <Box position="absolute" inset="0" bg="linear-gradient(180deg, rgba(26,20,16,0.16), rgba(26,20,16,0.02) 50%, rgba(26,20,16,0.42))" pointerEvents="none" />
        <Flex
          position="absolute"
          top="14px"
          left="14px"
          zIndex={7}
          h="30px"
          px="11px"
          borderRadius="999px"
          bgColor="rgba(65,48,37,0.76)"
          alignItems="center"
          pointerEvents="none"
        >
          <Text color="white" fontSize="11px" fontWeight="900">
            日常拍照・{location.name}
          </Text>
        </Flex>
        <EventPhotoCaptureLayer
          enabled
          backgroundRef={backgroundRef}
          backgroundImageSrc={backgroundImageSrc}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={targetRect}
          captureOverlays={captureOverlays}
          passScore={55}
          hintText="點擊畫面或空白鍵拍下小貝狗"
          tutorialTitle="幫小貝狗拍照"
          tutorialLines={[
            "小貝狗會出現在你選到的地點場景裡。",
            "等白色框框移到小貝狗身上，就按下快門。",
          ]}
          tutorialConfirmLabel="開始拍照"
          targetFadeLeadPx={42}
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          onConfirm={handleConfirmPhoto}
        />
      </Flex>
    </Flex>
  );
}

export function DailyAdventureResultView() {
  const router = useRouter();
  const { state, progress } = useDailyAdventureData();
  const storedResult = state.lastResult;
  const [capturedPhotoResult, setCapturedPhotoResult] = useState<DailyAdventureResult | null>(null);
  const result = capturedPhotoResult ?? storedResult;
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const go = (path: string) => router.push(withTrialProfileSearch(path));

  useEffect(() => {
    setDialogueIndex(0);
    setCapturedPhotoResult(null);
  }, [storedResult?.completedAt]);

  const encounterDialogue = result ? buildEncounterDialogue(result) : [];
  const isEncounterDialogueComplete = Boolean(result && dialogueIndex >= encounterDialogue.length);
  const shouldCaptureBeigoPhoto = Boolean(
    result &&
      isEncounterDialogueComplete &&
      result.stageId === 1 &&
      result.record.companionId === "beigo" &&
      !isDailyAdventureCapturedPhotoRecord(result.record),
  );
  const isResultSummaryVisible = Boolean(
    result &&
      isEncounterDialogueComplete &&
      !shouldCaptureBeigoPhoto,
  );
  const shouldGuideBackToLobby = Boolean(
    result &&
      isResultSummaryVisible &&
      result.stageId === 1 &&
      progress.hasSeenGameLobbyGuide &&
      !progress.hasSeenDailyAdventureMainStoryReturnGuide,
  );
  const shouldMarkDailyGuideLevelOneCompleted =
    shouldGuideBackToLobby && !progress.hasCompletedDailyAdventureLobbyGuideLevelOne;

  useEffect(() => {
    if (!shouldMarkDailyGuideLevelOneCompleted) return;
    markDailyAdventureLobbyGuideLevelOneCompleted();
  }, [shouldMarkDailyGuideLevelOneCompleted]);

  if (!result) {
    return (
      <DailyAdventureShell title="冒險結果" backHref={ROUTES.gameDaily} showBottomNav={false}>
        <Flex minH="420px" direction="column" alignItems="center" justifyContent="center">
          <Text color="#6B5140" fontSize="18px" fontWeight="900">還沒有新的冒險結果</Text>
          <Flex as="button" mt="14px" h="42px" px="18px" borderRadius="999px" bgColor="#9B704F" alignItems="center" cursor="pointer" onClick={() => go(ROUTES.gameDaily)}>
            <Text color="white" fontSize="13px" fontWeight="900">回日常冒險</Text>
          </Flex>
        </Flex>
      </DailyAdventureShell>
    );
  }

  if (!isEncounterDialogueComplete) {
    return (
      <DailyAdventureEncounter
        result={result}
        dialogueIndex={dialogueIndex}
        onContinue={() => setDialogueIndex((index) => index + 1)}
      />
    );
  }

  if (shouldCaptureBeigoPhoto) {
    return (
      <DailyAdventureBeigoPhotoCapture
        result={result}
        onComplete={(updatedResult) => setCapturedPhotoResult(updatedResult)}
      />
    );
  }

  const location = DAILY_ADVENTURE_LOCATIONS[result.record.locationId];
  const unlockedRouteTile = result.unlockedRouteTileId
    ? DAILY_ADVENTURE_ROUTE_TILES[result.unlockedRouteTileId]
    : null;
  const unlockedRouteLocation = unlockedRouteTile
    ? DAILY_ADVENTURE_LOCATIONS[unlockedRouteTile.locationId]
    : null;

  return (
    <DailyAdventureShell title="冒險結果" backHref={ROUTES.gameDaily} showBottomNav={false}>
      <Flex alignItems="center" justifyContent="space-between" mb="9px">
        <Flex h="27px" px="10px" borderRadius="999px" bgColor="#E2D9C2" alignItems="center">
          <Text color="#6F7058" fontSize="10px" fontWeight="900">{KIND_LABEL[result.record.kind]}</Text>
        </Flex>
        {result.isNewRecord ? <Flex h="27px" px="10px" borderRadius="999px" bgColor="#D98B60" alignItems="center"><Text color="white" fontSize="10px" fontWeight="900">NEW</Text></Flex> : null}
      </Flex>
      <DailyAdventureRecordArtwork record={result.record} />
      <Flex mt="12px" direction="column" alignItems="center" px="10px">
        <Text color="#5B4638" fontSize="22px" fontWeight="900" textAlign="center">{result.record.title}</Text>
        <Text mt="6px" color="#907460" fontSize="13px" lineHeight="1.55" textAlign="center">{result.record.description}</Text>
        <Flex mt="8px" alignItems="center" gap="4px" color="#A07859"><IoLocation size={14} /><Text color="#A07859" fontSize="11px" fontWeight="900">{location.name}</Text></Flex>
      </Flex>

      <Flex mt="15px" gap="8px">
        <Flex flex="1" minH="72px" borderRadius="15px" bgColor="#FFF8E7" border="1px solid #E9D19C" p="11px" alignItems="center" gap="10px">
          <Flex w="38px" h="38px" borderRadius="50%" bgColor="#F4D36E" alignItems="center" justifyContent="center"><FaCoins size={20} color="#9A6B2F" /></Flex>
          <Flex direction="column"><Text color="#9A765B" fontSize="10px" fontWeight="900">冒險獎勵</Text><Text color="#5D493A" fontSize="17px" fontWeight="900">+{result.coins}</Text></Flex>
        </Flex>
        {unlockedRouteTile && unlockedRouteLocation ? (
          <Flex flex="1" minH="72px" borderRadius="15px" bgColor="#EEF2E2" border="1px solid #CBD7AF" p="8px" alignItems="center" gap="8px">
            <Flex w="44px" h="48px" borderRadius="9px" overflow="hidden"><img src={unlockedRouteTile.imagePath} alt={`${unlockedRouteLocation.name}${unlockedRouteTile.variantLabel}拼圖`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Flex>
            <Flex direction="column"><Text color="#758064" fontSize="9px" fontWeight="900">新路線拼圖</Text><Text color="#526047" fontSize="12px" fontWeight="900">{unlockedRouteLocation.name}・{unlockedRouteTile.variantLabel}</Text></Flex>
          </Flex>
        ) : null}
      </Flex>

      {shouldGuideBackToLobby ? (
        <Flex mt="14px" px="12px" py="10px" borderRadius="14px" bgColor="#FFF4DA" border="1px solid #E6C98D">
          <Text color="#805C45" fontSize="12px" fontWeight="900" lineHeight="1.45" textAlign="center">
            Level 1 完成了。回到大廳後，點「繼續旅程」接著推進主線。
          </Text>
        </Flex>
      ) : null}

      <Flex
        as="button"
        mt={shouldGuideBackToLobby ? "10px" : "16px"}
        w="100%"
        h="54px"
        borderRadius="17px"
        bgColor="#9B704F"
        color="white"
        alignItems="center"
        justifyContent="center"
        gap="6px"
        cursor="pointer"
        onClick={() => go(shouldGuideBackToLobby ? ROUTES.gameLobby : ROUTES.gameDailyPrepare)}
      >
        <Text color="white" fontSize="17px" fontWeight="900">
          {shouldGuideBackToLobby ? "回到大廳" : "再去一次冒險"}
        </Text>
        <IoChevronForward size={20} />
      </Flex>
      <Flex as="button" mt="8px" mb="5px" w="100%" h="46px" borderRadius="15px" bgColor="#E6D9C6" color="#735946" alignItems="center" justifyContent="center" gap="6px" cursor="pointer" onClick={() => go(ROUTES.gameDailyCollection)}>
        <IoAlbumsOutline size={18} /><Text color="inherit" fontSize="14px" fontWeight="900">查看冒險收藏</Text>
      </Flex>
    </DailyAdventureShell>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY } from "@/lib/game/events";
import { StreetForgotLunchFrogAEventModal } from "@/components/game/events/StreetForgotLunchFrogAEventModal";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";
import { recordPhotoCapture } from "@/lib/game/playerProgress";
import { isFrogBEventEnabled } from "@/lib/game/frogVariant";

const RESTAURANT_NO_FROG_PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600">
  <rect width="1200" height="1600" fill="#050505"/>
  <text x="600" y="540" text-anchor="middle" fill="#FFFFFF" font-size="54" font-family="sans-serif" font-weight="700">不知名餐廳圖片示意</text>
  <text x="600" y="640" text-anchor="middle" fill="#FFFFFF" font-size="34" font-family="sans-serif">小麥拿著抵用券兌換涼麵</text>
  <rect x="390" y="710" width="420" height="420" rx="56" fill="#111111" stroke="#FFFFFF" stroke-width="8" opacity="0.24"/>
  <text x="600" y="1240" text-anchor="middle" fill="#FFFFFF" font-size="30" font-family="sans-serif">餐廳場景示意</text>
</svg>
`)}`;

const FROG_POUNCE_IMAGE_PATH = "/images/animals/青蛙_撲.png";
const FROG_B_CAPTURE_RECT = { x: 0.33, y: 0.39, width: 0.34, height: 0.255 };
const FROG_B_CAPTURE_OVERLAYS = [{ imageSrc: FROG_POUNCE_IMAGE_PATH, rectNormalized: FROG_B_CAPTURE_RECT }];

const LINE_GROUPS = {
  homeLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.homeLines,
  streetIntroLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.streetIntroLines,
  orangeIntroLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.orangeIntroLines,
  orangeIgnoreLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.orangeIgnoreLines,
  orangeHelpLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.orangeHelpLines,
  kidIntroLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.kidIntroLines,
  kidIgnoreLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.kidIgnoreLines,
  kidHelpLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.kidHelpLines,
  restaurantLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.restaurantLines,
  postPhotoLines: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.postPhotoLines,
} as const;

type LineGroupKey = keyof typeof LINE_GROUPS;
type ChoiceKey = "orange" | "kid";
type ChoiceValue = "ignore" | "help";
export type StreetForgotLunchFrogEventOutcome = {
  result: "captured" | "hungry";
};

type Phase =
  | { kind: "line"; group: LineGroupKey; index: number }
  | { kind: "choice"; choice: ChoiceKey }
  | { kind: "photo" };

type SceneKey = "home" | "street" | "restaurant";
type SceneMeta = { title: string; bgImage: string; bgColor: string; bgSize?: string };

const LINE_GROUP_SCENE: Record<LineGroupKey, SceneKey> = {
  homeLines: "home",
  streetIntroLines: "street",
  orangeIntroLines: "street",
  orangeIgnoreLines: "street",
  orangeHelpLines: "street",
  kidIntroLines: "street",
  kidIgnoreLines: "street",
  kidHelpLines: "street",
  restaurantLines: "restaurant",
  postPhotoLines: "restaurant",
};

const SCENE_META: Record<SceneKey, SceneMeta> = {
  home: {
    title: "家",
    bgImage: "/images/428出圖/背景/玄關_關門.jpg",
    bgColor: "#2A241E",
  },
  street: {
    title: "街道",
    bgImage: "/images/428出圖/背景/公司附近街道_白天.jpg",
    bgColor: "#C8D5D2",
  },
  restaurant: {
    title: "不知名餐廳",
    bgImage: RESTAURANT_NO_FROG_PLACEHOLDER_IMAGE,
    bgColor: "#050505",
    bgSize: "cover",
  },
};

type StreetForgotLunchFrogEventModalProps = {
  onFinish: (outcome: StreetForgotLunchFrogEventOutcome) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

function getNextPhaseAfterGroup(group: LineGroupKey): Phase | null {
  if (group === "homeLines") return { kind: "line", group: "streetIntroLines", index: 0 };
  if (group === "streetIntroLines") return { kind: "line", group: "orangeIntroLines", index: 0 };
  if (group === "orangeIntroLines") return { kind: "choice", choice: "orange" };
  if (group === "orangeHelpLines") return { kind: "line", group: "kidIntroLines", index: 0 };
  if (group === "kidIntroLines") return { kind: "choice", choice: "kid" };
  if (group === "kidHelpLines") return { kind: "line", group: "restaurantLines", index: 0 };
  if (group === "restaurantLines") return { kind: "photo" };
  return null;
}

function getSceneKey(phase: Phase): SceneKey {
  if (phase.kind === "line") return LINE_GROUP_SCENE[phase.group];
  if (phase.kind === "photo") return "restaurant";
  return "street";
}

function hasFrogAppearedInRestaurant(phase: Phase) {
  if (phase.kind === "photo") return true;
  if (phase.kind !== "line") return false;
  if (phase.group === "postPhotoLines") return true;
  return phase.group === "restaurantLines" && phase.index >= 5;
}

function getSceneMeta(phase: Phase): SceneMeta {
  const sceneKey = getSceneKey(phase);
  if (sceneKey !== "restaurant") return SCENE_META[sceneKey];
  return SCENE_META.restaurant;
}

function getChoiceCopy(choice: ChoiceKey) {
  if (choice === "orange") {
    return {
      prompt: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.orangeChoicePrompt,
      options: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.orangeOptions,
    };
  }
  return {
    prompt: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.kidChoicePrompt,
    options: STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY.kidOptions,
  };
}

function getPhaseKey(phase: Phase) {
  if (phase.kind === "line") return `${phase.group}-${phase.index}`;
  return phase.kind === "choice" ? `choice-${phase.choice}` : "photo";
}

function getAvatar(line: { speaker: string; text: string } | null): { spriteId: AvatarSpriteId; frameIndex: number } | null {
  if (!line) return null;
  if (line.speaker === "小貝狗") return { spriteId: "beigo", frameIndex: line.text.includes("小日獸") ? 2 : 0 };
  if (line.speaker !== "小麥") return null;
  if (line.text.includes("奇怪，我是不是忘記了什麼")) return { spriteId: "mai", frameIndex: 36 };
  if (line.text.includes("偷跟出來")) return { spriteId: "mai", frameIndex: 29 };
  if (line.text.includes("結果到了辦公室才發現")) return { spriteId: "mai", frameIndex: 24 };
  if (line.text.includes("咦？剛剛好像聽到")) return { spriteId: "mai", frameIndex: 14 };
  if (line.text.includes("你還好嗎")) return { spriteId: "mai", frameIndex: 5 };
  if (line.text.includes("糟糕")) return { spriteId: "mai", frameIndex: 27 };
  if (line.text.includes("咦？真的耶")) return { spriteId: "mai", frameIndex: 34 };
  if (line.text.includes("噗")) return { spriteId: "mai", frameIndex: 6 };
  if (line.text.includes("收服到了")) return { spriteId: "mai", frameIndex: 34 };
  if (line.text.includes("要不是幫了")) return { spriteId: "mai", frameIndex: 36 };
  if (line.text.includes("幸運日")) return { spriteId: "mai", frameIndex: 18 };
  if (line.text.includes("咦")) return { spriteId: "mai", frameIndex: 14 };
  return { spriteId: "mai", frameIndex: 0 };
}

function StreetForgotLunchFrogBEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: StreetForgotLunchFrogEventModalProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "line", group: "homeLines", index: 0 });
  const [displayText, setDisplayText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [historyLines, setHistoryLines] = useState<Array<{ id: string; speaker: string; text: string }>>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  const typingMode = loadDialogTypingMode();
  const phaseKey = getPhaseKey(phase);
  const sceneMeta = getSceneMeta(phase);
  const isPhotoMode = phase.kind === "photo";
  const shouldShowFrogPounce = hasFrogAppearedInRestaurant(phase) && !isPhotoMode;
  const line = useMemo(() => {
    if (phase.kind !== "line") return null;
    return LINE_GROUPS[phase.group][phase.index] ?? null;
  }, [phase]);
  const choiceCopy = phase.kind === "choice" ? getChoiceCopy(phase.choice) : null;
  const sourceText = line?.text ?? "";
  const isTypingComplete = phase.kind === "choice" || phase.kind === "photo" || !sourceText || displayText === sourceText;
  const avatar = getAvatar(line);

  useEffect(() => {
    const image = new Image();
    image.src = sceneMeta.bgImage;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, [sceneMeta.bgImage]);

  useEffect(() => {
    if (phase.kind === "line" && line) {
      setHistoryLines((current) =>
        current.some((item) => item.id === phaseKey)
          ? current
          : [...current, { id: phaseKey, speaker: line.speaker, text: line.text }],
      );
    }
    if (phase.kind === "choice" && choiceCopy) {
      setHistoryLines((current) =>
        current.some((item) => item.id === phaseKey)
          ? current
          : [...current, { id: phaseKey, speaker: "選擇", text: choiceCopy.prompt }],
      );
    }
  }, [choiceCopy, line, phase.kind, phaseKey]);

  useEffect(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (!sourceText) {
      setDisplayText("");
      return;
    }
    let cursor = 0;
    setDisplayText("");
    const tick = () => {
      const previousChar = cursor > 0 ? sourceText[cursor - 1] : "";
      const { step, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(sourceText.length, cursor + step);
      setDisplayText(sourceText.slice(0, cursor));
      if (cursor < sourceText.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };
    typingTimerRef.current = setTimeout(tick, 90);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [sourceText, typingMode]);

  const completeTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setDisplayText(sourceText);
  };

  const handleFinishLineGroup = (group: LineGroupKey) => {
    if (group === "orangeIgnoreLines" || group === "kidIgnoreLines") {
      onFinish({ result: "hungry" });
      return;
    }
    if (group === "postPhotoLines") {
      onFinish({ result: "captured" });
      return;
    }
    const next = getNextPhaseAfterGroup(group);
    if (next) setPhase(next);
  };

  const handleContinue = () => {
    if (phase.kind !== "line") return;
    if (sourceText && displayText !== sourceText) {
      completeTyping();
      return;
    }
    const groupLines = LINE_GROUPS[phase.group];
    if (phase.index < groupLines.length - 1) {
      setPhase({ kind: "line", group: phase.group, index: phase.index + 1 });
      return;
    }
    handleFinishLineGroup(phase.group);
  };

  const handleChoose = (choice: ChoiceKey, value: ChoiceValue) => {
    const options = getChoiceCopy(choice).options;
    setHistoryLines((current) => [
      ...current,
      {
        id: `choice-${choice}-${value}`,
        speaker: "選擇",
        text: value === "ignore" ? options.ignore.label : options.help.label,
      },
    ]);
    if (choice === "orange") {
      setPhase({ kind: "line", group: value === "ignore" ? "orangeIgnoreLines" : "orangeHelpLines", index: 0 });
      return;
    }
    setPhase({ kind: "line", group: value === "ignore" ? "kidIgnoreLines" : "kidHelpLines", index: 0 });
  };

  const handleConfirmPolaroid = (capture: PhotoCaptureResult) => {
    recordPhotoCapture({
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    });
    setPhase({ kind: "line", group: "postPhotoLines", index: 0 });
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <Flex
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />
      </Flex>

      <Flex
        ref={backgroundRef}
        flex={isPhotoMode ? undefined : "1"}
        bgImage={`url("${sceneMeta.bgImage}")`}
        bgSize={sceneMeta.bgSize ?? "cover"}
        backgroundPosition="center center"
        bgRepeat="no-repeat"
        bgColor={isPhotoMode ? "#050505" : sceneMeta.bgColor}
        position={isPhotoMode ? "absolute" : "relative"}
        inset={isPhotoMode ? "0" : undefined}
        zIndex={isPhotoMode ? 3 : undefined}
        justifyContent="center"
        alignItems="flex-start"
        pt={isPhotoMode ? "0" : "18px"}
      >
        <Text
          color="#F5EFE5"
          fontSize="12px"
          textShadow="0 2px 6px rgba(0,0,0,0.45)"
          mt={isPhotoMode ? "18px" : "0"}
        >
          {sceneMeta.title}
        </Text>

        {shouldShowFrogPounce ? (
          <img
            src={FROG_POUNCE_IMAGE_PATH}
            alt=""
            aria-hidden="true"
            draggable={false}
            style={{
              position: "absolute",
              left: `${FROG_B_CAPTURE_RECT.x * 100}%`,
              top: `${FROG_B_CAPTURE_RECT.y * 100}%`,
              width: `${FROG_B_CAPTURE_RECT.width * 100}%`,
              height: `${FROG_B_CAPTURE_RECT.height * 100}%`,
              objectFit: "contain",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoMode}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={sceneMeta.bgImage}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={FROG_B_CAPTURE_RECT}
          captureOverlays={FROG_B_CAPTURE_OVERLAYS}
          passScore={60}
          hintText="點擊快門捕捉青蛙小日獸"
          tutorialTitle="拍下青蛙B"
          tutorialLines={["把取景框對準青蛙小日獸的位置。", "拍下牠跳出來的一瞬間。"]}
          onConfirm={handleConfirmPolaroid}
        />
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        zIndex={4}
        pointerEvents="none"
        opacity={isPhotoMode || !avatar ? 0 : 1}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        {avatar ? <EventAvatarSprite spriteId={avatar.spriteId} frameIndex={avatar.frameIndex} /> : null}
      </Flex>

      <Flex
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        <DialogQuickActions onOpenOptions={() => {}} onOpenHistory={() => setIsHistoryOpen(true)} />
      </Flex>

      <Flex
        w="100%"
        direction="column"
        opacity={isPhotoMode ? 0 : 1}
        transform={isPhotoMode ? "translateY(30px)" : "translateY(0px)"}
        pointerEvents={isPhotoMode ? "none" : "auto"}
        transition="opacity 0.35s ease, transform 0.35s ease"
      >
        {phase.kind === "choice" && choiceCopy ? (
          <EventDialogPanel>
            <Text color="white" fontSize="16px" fontWeight="700">
              {choiceCopy.prompt}
            </Text>
            <Flex
              bgColor="rgba(255,255,255,0.1)"
              borderRadius="8px"
              p="10px"
              justifyContent="space-between"
              alignItems="center"
              cursor="pointer"
              gap="12px"
              onClick={() => handleChoose(phase.choice, "ignore")}
            >
              <Text color="white" fontWeight="700">
                {choiceCopy.options.ignore.label}
              </Text>
              <Text color="#FCE9C8" fontSize="12px" textAlign="right">
                {choiceCopy.options.ignore.description}
              </Text>
            </Flex>
            <Flex
              bgColor="rgba(255,255,255,0.14)"
              borderRadius="8px"
              p="10px"
              justifyContent="space-between"
              alignItems="center"
              cursor="pointer"
              gap="12px"
              onClick={() => handleChoose(phase.choice, "help")}
            >
              <Text color="white" fontWeight="700">
                {choiceCopy.options.help.label}
              </Text>
              <Text color="#FCE9C8" fontSize="12px" textAlign="right">
                {choiceCopy.options.help.description}
              </Text>
            </Flex>
          </EventDialogPanel>
        ) : (
          <EventDialogPanel>
            {line ? (
              <Text color="white" fontWeight="700">
                {line.speaker}
              </Text>
            ) : (
              <Text color="white" fontWeight="700">
                旁白
              </Text>
            )}
            <Flex flex="1" minH="0" direction="column">
              <Text color="white" fontSize="16px" lineHeight="1.5">
                {displayText}
              </Text>
            </Flex>
            <EventContinueAction enabled={isTypingComplete} onClick={handleContinue} />
          </EventDialogPanel>
        )}
      </Flex>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}

export function StreetForgotLunchFrogEventModal(props: StreetForgotLunchFrogEventModalProps) {
  if (!isFrogBEventEnabled()) {
    return (
      <StreetForgotLunchFrogAEventModal
        savings={props.savings}
        actionPower={props.actionPower}
        fatigue={props.fatigue}
        onFinish={(outcome) => props.onFinish(outcome)}
      />
    );
  }

  return <StreetForgotLunchFrogBEventModal {...props} />;
}

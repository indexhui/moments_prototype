"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaTrainSubway } from "react-icons/fa6";
import {
  EventAvatarSprite,
  type AvatarSpriteId,
} from "@/components/game/events/EventAvatarSprite";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { GoatDocumentRunner } from "@/components/game/events/GoatDocumentRunner";
import { recordPhotoCapture, recordSunbeastPhotoCapture } from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";
import {
  GOAT_SCENE_JUMP_OPTION_ID,
  GOAT_SCENE_JUMP_STEPS,
} from "@/lib/game/goatSceneFlow";
import { dispatchSceneJumpContextChange } from "@/lib/game/sceneJumpContextBus";

const METRO_BACKGROUND_IMAGE = "/images/428出圖/背景/捷運.png";
const OFFICE_BACKGROUND_IMAGE = "/images/背景/公司_白天.jpg";
const STREET_BACKGROUND_IMAGE = "/images/背景/公司附近街道_黃昏.jpg";
const GOAT_IMAGE = "/images/animals/goat/goat-sunbeast.png";
const GOAT_PHOTO_RECT_NORMALIZED = {
  x: 0.34,
  y: 0.34,
  width: 0.42,
  height: 0.46,
};

type GoatPhase =
  | "metro-intro"
  | "metro-game-1"
  | "seat-request"
  | "seat-choice"
  | "seat-result-yield"
  | "seat-result-keep"
  | "metro-game-2"
  | "elevator-intro"
  | "elevator-choice"
  | "elevator-result"
  | "office-intro"
  | "office-game"
  | "office-result"
  | "trigger"
  | "photo"
  | "collected";

type SeatChoice = "yield" | "keep" | null;
type ElevatorChoice = "next" | "hold" | null;

type GoatDialogueLine = {
  speaker: "旁白" | "小麥" | "阿伯" | "電梯裡的女生" | "同事";
  text: string;
  avatarSpriteId?: AvatarSpriteId;
  avatarFrameIndex?: number;
  innerThought?: boolean;
  showGoat?: boolean;
};

type InitialGoatState = {
  phase: GoatPhase;
  progress: number;
  secondsRemaining: number;
  seatChoice: SeatChoice;
  elevatorChoice: ElevatorChoice;
};

type GoatCommuteWorkEventModalProps = {
  initialStepId?: string | null;
  onFinish: () => void;
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const goatReveal = keyframes`
  0% { opacity: 0; transform: translateY(34px) scale(0.82) rotate(-4deg); }
  72% { opacity: 1; transform: translateY(-4px) scale(1.04) rotate(1deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
`;

function getInitialGoatState(initialStepId?: string | null): InitialGoatState {
  if (initialStepId === "goat-metro-game-1") {
    return {
      phase: "metro-game-1",
      progress: 30,
      secondsRemaining: 30,
      seatChoice: null,
      elevatorChoice: null,
    };
  }
  if (initialStepId === "goat-seat-choice") {
    return {
      phase: "seat-choice",
      progress: 45,
      secondsRemaining: 23,
      seatChoice: null,
      elevatorChoice: null,
    };
  }
  if (initialStepId === "goat-metro-game-2") {
    return {
      phase: "metro-game-2",
      progress: 45,
      secondsRemaining: 23,
      seatChoice: "keep",
      elevatorChoice: null,
    };
  }
  if (initialStepId === "goat-elevator-choice") {
    return {
      phase: "elevator-choice",
      progress: 60,
      secondsRemaining: 18,
      seatChoice: "keep",
      elevatorChoice: null,
    };
  }
  if (initialStepId === "goat-office-game-75") {
    return {
      phase: "office-game",
      progress: 75,
      secondsRemaining: 18,
      seatChoice: "yield",
      elevatorChoice: "next",
    };
  }
  if (initialStepId === "goat-office-game-90") {
    return {
      phase: "office-game",
      progress: 90,
      secondsRemaining: 24,
      seatChoice: "keep",
      elevatorChoice: "hold",
    };
  }
  if (initialStepId === "goat-trigger") {
    return {
      phase: "trigger",
      progress: 100,
      secondsRemaining: 10,
      seatChoice: "keep",
      elevatorChoice: "hold",
    };
  }
  if (initialStepId === "goat-photo") {
    return {
      phase: "photo",
      progress: 100,
      secondsRemaining: 10,
      seatChoice: "keep",
      elevatorChoice: "hold",
    };
  }
  if (initialStepId === "goat-collected") {
    return {
      phase: "collected",
      progress: 100,
      secondsRemaining: 10,
      seatChoice: "keep",
      elevatorChoice: "hold",
    };
  }
  return {
    phase: "metro-intro",
    progress: 30,
    secondsRemaining: 30,
    seatChoice: null,
    elevatorChoice: null,
  };
}

function getBackgroundForPhase(phase: GoatPhase) {
  if (phase === "photo" || phase === "collected" || phase === "trigger") {
    return STREET_BACKGROUND_IMAGE;
  }
  if (phase.startsWith("metro") || phase.startsWith("seat")) {
    return METRO_BACKGROUND_IMAGE;
  }
  return OFFICE_BACKGROUND_IMAGE;
}

function getSceneJumpStepId(params: {
  phase: GoatPhase;
  elevatorChoice: ElevatorChoice;
}) {
  if (params.phase === "metro-intro") return "goat-metro-intro";
  if (params.phase === "metro-game-1") return "goat-metro-game-1";
  if (
    params.phase === "seat-request" ||
    params.phase === "seat-choice" ||
    params.phase === "seat-result-yield" ||
    params.phase === "seat-result-keep"
  ) {
    return "goat-seat-choice";
  }
  if (params.phase === "metro-game-2") return "goat-metro-game-2";
  if (
    params.phase === "elevator-intro" ||
    params.phase === "elevator-choice" ||
    params.phase === "elevator-result"
  ) {
    return "goat-elevator-choice";
  }
  if (params.phase === "office-intro" || params.phase === "office-game") {
    return params.elevatorChoice === "hold" ? "goat-office-game-90" : "goat-office-game-75";
  }
  if (params.phase === "office-result" || params.phase === "trigger") return "goat-trigger";
  if (params.phase === "photo") return "goat-photo";
  return "goat-collected";
}

function DialogChoiceButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Flex
      as="button"
      w="100%"
      minH="48px"
      px="12px"
      py="10px"
      borderRadius="8px"
      bgColor="rgba(255,255,255,0.1)"
      alignItems="center"
      justifyContent="center"
      textAlign="left"
      cursor="pointer"
      transition="background-color 120ms ease, transform 120ms ease"
      _hover={{ bgColor: "rgba(255,255,255,0.16)" }}
      _active={{ bgColor: "rgba(255,255,255,0.2)", transform: "translateY(1px)" }}
      onClick={onClick}
    >
      <Text w="100%" color="white" fontSize="15px" fontWeight="700">
        {label}
      </Text>
    </Flex>
  );
}

export function GoatCommuteWorkEventModal({
  initialStepId,
  onFinish,
}: GoatCommuteWorkEventModalProps) {
  const initialState = useMemo(() => getInitialGoatState(initialStepId), [initialStepId]);
  const [phase, setPhase] = useState<GoatPhase>(initialState.phase);
  const [progress, setProgress] = useState(initialState.progress);
  const [secondsRemaining, setSecondsRemaining] = useState(initialState.secondsRemaining);
  const [seatChoice, setSeatChoice] = useState<SeatChoice>(initialState.seatChoice);
  const [elevatorChoice, setElevatorChoice] =
    useState<ElevatorChoice>(initialState.elevatorChoice);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const backgroundImage = getBackgroundForPhase(phase);

  const dialogueLines = useMemo<GoatDialogueLine[]>(() => {
    if (phase === "metro-intro") {
      return [
        {
          speaker: "旁白",
          text: "捷運上，小麥打開筆電，想繼續趕完昨天沒完成的工作。",
        },
        {
          speaker: "小麥",
          text: "趁到站前能做多少算多少……昨天留下的文件真的太多了。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 3,
          innerThought: true,
        },
      ];
    }
    if (phase === "seat-request") {
      return [
        {
          speaker: "旁白",
          text: "工作做到一半，一名身體看起來不太舒服的阿伯停在小麥面前。",
        },
        {
          speaker: "阿伯",
          text: "小姐，不好意思……可以讓我坐一下嗎？",
        },
      ];
    }
    if (phase === "seat-result-yield") {
      return [
        {
          speaker: "小麥",
          text: "好，您坐吧。只是站著沒辦法繼續用電腦，工作只能先停在 45%。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 3,
        },
      ];
    }
    if (phase === "seat-result-keep") {
      return [
        {
          speaker: "小麥",
          text: "抱歉，我現在真的得把這份工作趕完。下一站就下車了。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 23,
        },
        {
          speaker: "旁白",
          text: "小麥重新看向螢幕，決定把剩下的通勤時間用完。",
        },
      ];
    }
    if (phase === "elevator-intro") {
      return [
        {
          speaker: "旁白",
          text: "抵達公司後，小麥趕到電梯前。門正要關上，裡面已經擠得滿滿的。",
        },
        {
          speaker: "電梯裡的女生",
          text: "妳就站旁邊一點嘛，大家擠一下就進得來了。",
        },
        {
          speaker: "小麥",
          text: "她明明斜站著佔了不少空間，卻像在等我退讓……",
          avatarSpriteId: "mai",
          avatarFrameIndex: 3,
          innerThought: true,
        },
      ];
    }
    if (phase === "elevator-result") {
      return elevatorChoice === "next"
        ? [
            {
              speaker: "旁白",
              text: `小麥改搭下一班電梯，晚了一點才到辦公室。最後趕工只剩 ${secondsRemaining} 秒。`,
            },
            {
              speaker: "小麥",
              text: "進度 75%。時間真的快不夠了……",
              avatarSpriteId: "mai",
              avatarFrameIndex: 13,
            },
          ]
        : [
            {
              speaker: "小麥",
              text: "不好意思，請妳先站好。這樣大家才有位置。",
              avatarSpriteId: "mai",
              avatarFrameIndex: 23,
            },
            {
              speaker: "旁白",
              text: `小麥準時抵達座位，還保住了 ${secondsRemaining} 秒。工作進度來到 90%。`,
            },
          ];
    }
    if (phase === "office-intro") {
      return [
        {
          speaker: "小麥",
          text:
            progress >= 90
              ? "太好了，只剩一點點就能完成。把最後幾份文件補上！"
              : "糟了，還有四分之一。得在剩下的時間把文件全部補上！",
          avatarSpriteId: "mai",
          avatarFrameIndex: progress >= 90 ? 38 : 13,
        },
      ];
    }
    if (phase === "office-result") {
      return [
        {
          speaker: "旁白",
          text: "小麥完成同事的工作，整理好文件交給主管。",
        },
        {
          speaker: "小麥",
          text: "完成了。這次總算沒有再把自己的工作拖到下班後。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 18,
        },
      ];
    }
    if (phase === "trigger") {
      return [
        {
          speaker: "旁白",
          text: "正當小麥想喘口氣時，另一名同事抱著資料跑了過來。",
        },
        {
          speaker: "同事",
          text: "小麥，可以再幫我處理這份嗎？妳做文件最快了。",
          avatarSpriteId: "coworker",
          avatarFrameIndex: 1,
        },
        {
          speaker: "小麥",
          text: "不行。這是你的工作，而且我今天的份已經完成了。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 23,
        },
        {
          speaker: "旁白",
          text: "小麥雖然不太開心，還是站穩立場，拒絕了同事無理的要求。",
        },
        {
          speaker: "旁白",
          text: "下班後，另一名同事追上來，稱讚小麥堅持自己立場的樣子很帥。",
        },
        {
          speaker: "同事",
          text: "很像我最近喜歡的卡通角色！你看，那邊還有人打扮成這隻角色耶！",
          avatarSpriteId: "coworker",
          avatarFrameIndex: 0,
        },
        {
          speaker: "旁白",
          text: "小麥轉頭一看，卻發現那不是卡通角色，而是一隻帶著山羊角的小日獸。",
          showGoat: true,
        },
        {
          speaker: "小麥",
          text: "山羊……小日獸！這次一定要拍下來。",
          avatarSpriteId: "mai",
          avatarFrameIndex: 34,
          showGoat: true,
        },
      ];
    }
    return [];
  }, [elevatorChoice, phase, progress, secondsRemaining]);

  const activeDialogue = dialogueLines[dialogueIndex] ?? null;
  const isGamePhase =
    phase === "metro-game-1" || phase === "metro-game-2" || phase === "office-game";
  const isChoicePhase = phase === "seat-choice" || phase === "elevator-choice";
  const isPhotoPhase = phase === "photo";
  const shouldShowGoat =
    isPhotoPhase || Boolean(activeDialogue?.showGoat) || phase === "collected";

  useEffect(() => {
    setDialogueIndex(0);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    setNaturalImageSize(null);
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.src = backgroundImage;
    return () => {
      cancelled = true;
    };
  }, [backgroundImage]);

  useEffect(() => {
    const stepId = getSceneJumpStepId({ phase, elevatorChoice });
    const step =
      GOAT_SCENE_JUMP_STEPS.find((candidate) => candidate.id === stepId) ??
      GOAT_SCENE_JUMP_STEPS[0];
    dispatchSceneJumpContextChange({
      optionId: GOAT_SCENE_JUMP_OPTION_ID,
      kindLabel: step?.kindLabel ?? "山羊",
      speaker: activeDialogue?.speaker === "旁白" ? undefined : activeDialogue?.speaker,
      text: activeDialogue?.text ?? step?.text ?? "山羊流程",
      steps: GOAT_SCENE_JUMP_STEPS,
      currentStepId: step?.id,
    });
  }, [activeDialogue, elevatorChoice, phase]);

  useEffect(() => {
    return () => {
      dispatchSceneJumpContextChange({ clear: true });
    };
  }, []);

  const advanceDialogue = () => {
    if (!activeDialogue) return;
    if (dialogueIndex < dialogueLines.length - 1) {
      setDialogueIndex((current) => current + 1);
      return;
    }
    if (phase === "metro-intro") setPhase("metro-game-1");
    if (phase === "seat-request") setPhase("seat-choice");
    if (phase === "seat-result-yield") setPhase("elevator-intro");
    if (phase === "seat-result-keep") setPhase("metro-game-2");
    if (phase === "elevator-intro") setPhase("elevator-choice");
    if (phase === "elevator-result") setPhase("office-intro");
    if (phase === "office-intro") setPhase("office-game");
    if (phase === "office-result") setPhase("trigger");
    if (phase === "trigger") {
      setPhotoResetNonce((current) => current + 1);
      setPhase("photo");
    }
  };

  const handleRunnerComplete = (result: {
    progress: number;
    secondsRemaining: number;
  }) => {
    setProgress(result.progress);
    setSecondsRemaining(result.secondsRemaining);
    if (phase === "metro-game-1") {
      setPhase("seat-request");
      return;
    }
    if (phase === "metro-game-2") {
      setPhase("elevator-intro");
      return;
    }
    if (phase === "office-game") {
      setProgress(100);
      setPhase("office-result");
    }
  };

  const chooseSeat = (choice: Exclude<SeatChoice, null>) => {
    setSeatChoice(choice);
    if (choice === "yield") {
      setProgress(45);
      setPhase("seat-result-yield");
      return;
    }
    setPhase("seat-result-keep");
  };

  const chooseElevator = (choice: Exclude<ElevatorChoice, null>) => {
    setElevatorChoice(choice);
    if (choice === "next") {
      setProgress(75);
      setSecondsRemaining((current) => Math.max(10, current - 8));
    } else {
      setProgress(90);
      setSecondsRemaining((current) => Math.min(30, current + 5));
    }
    setPhase("elevator-result");
  };

  const handlePhotoConfirm = (capture: PhotoCaptureResult) => {
    const snapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(snapshot);
    recordSunbeastPhotoCapture("goat", snapshot, { maxCaptures: 1 });
    setPhase("collected");
  };

  return (
    <Flex position="absolute" inset="0" zIndex={70} direction="column" bgColor="#EDE7DE">
      {isGamePhase ? (
        <Flex
          h="68px"
          flexShrink={0}
          px="18px"
          bgColor="#725A45"
          alignItems="center"
          justifyContent="space-between"
          gap="12px"
          position="relative"
          zIndex={30}
        >
          <Flex alignItems="center" gap="10px" minW="0">
            <Flex
              w="38px"
              h="38px"
              borderRadius="12px"
              bgColor="rgba(255,255,255,0.14)"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <FaTrainSubway color="#FFF7EC" size={20} />
            </Flex>
            <Flex direction="column" minW="0">
              <Text color="#E8D7C6" fontSize="11px" fontWeight="800">
                山羊篇
              </Text>
              <Text color="white" fontSize="16px" fontWeight="900" whiteSpace="nowrap">
                通勤文件衝刺
              </Text>
            </Flex>
          </Flex>
          <Text color="#E8D7C6" fontSize="12px" fontWeight="800">
            收集文件，推進工作
          </Text>
        </Flex>
      ) : null}

      <Flex
        ref={backgroundRef}
        flex="1"
        minH="0"
        position="relative"
        overflow="hidden"
        bgImage={`linear-gradient(180deg, rgba(22,20,18,0.03), rgba(22,20,18,0.22)), url("${backgroundImage}")`}
        bgSize="cover"
        backgroundPosition="center center"
        alignItems="flex-end"
      >
        {activeDialogue?.innerThought ? (
          <Box
            position="absolute"
            inset="0"
            zIndex={2}
            bgColor="rgba(36,29,24,0.28)"
            animation={`${fadeIn} 180ms ease-out both`}
          />
        ) : null}

        {shouldShowGoat && !isPhotoPhase ? (
          <Flex
            position="absolute"
            left="50%"
            top="38%"
            zIndex={4}
            w="230px"
            h="290px"
            transform="translate(-50%, -50%)"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
            animation={`${goatReveal} 520ms cubic-bezier(0.2, 0.82, 0.24, 1) both`}
          >
            <img
              src={GOAT_IMAGE}
              alt="山羊小日獸"
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </Flex>
        ) : null}

        {activeDialogue?.avatarSpriteId ? (
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            zIndex={8}
            pointerEvents="none"
          >
            <EventAvatarSprite
              spriteId={activeDialogue.avatarSpriteId}
              frameIndex={activeDialogue.avatarFrameIndex ?? 0}
              motionId="slide-in-left"
            />
          </Flex>
        ) : null}

        {activeDialogue ? (
          <Flex
            w="100%"
            position="relative"
            zIndex={10}
            cursor="pointer"
            onClick={advanceDialogue}
          >
            <EventDialogPanel w="100%" borderRadius="0">
              {activeDialogue.speaker !== "旁白" ? (
                <Text color="white" fontWeight="800">
                  {activeDialogue.speaker}
                </Text>
              ) : null}
              <Flex flex="1" minH="0" alignItems="center">
                <Text
                  color="white"
                  fontSize="16px"
                  lineHeight="1.6"
                  fontStyle={activeDialogue.innerThought ? "italic" : "normal"}
                >
                  {activeDialogue.text}
                </Text>
              </Flex>
              <EventContinueAction label="點擊繼續" onClick={advanceDialogue} />
            </EventDialogPanel>
          </Flex>
        ) : null}

        {phase === "seat-choice" ? (
          <EventDialogPanel w="100%" borderRadius="0" pb="12px" zIndex={14}>
            <Text color="white" fontSize="16px" fontWeight="700">
              阿伯正在等妳回應
            </Text>
            <DialogChoiceButton label="讓座" onClick={() => chooseSeat("yield")} />
            <DialogChoiceButton label="繼續工作" onClick={() => chooseSeat("keep")} />
          </EventDialogPanel>
        ) : null}

        {phase === "elevator-choice" ? (
          <EventDialogPanel w="100%" borderRadius="0" pb="12px" zIndex={14}>
            <Text color="white" fontSize="16px" fontWeight="700">
              電梯發出超重警示
            </Text>
            <DialogChoiceButton label="搭下一班" onClick={() => chooseElevator("next")} />
            <DialogChoiceButton label="不妥協" onClick={() => chooseElevator("hold")} />
          </EventDialogPanel>
        ) : null}

        {phase === "metro-game-1" ? (
          <GoatDocumentRunner
            variant="metro"
            initialProgress={30}
            targetProgress={45}
            initialSeconds={30}
            onComplete={handleRunnerComplete}
          />
        ) : null}
        {phase === "metro-game-2" ? (
          <GoatDocumentRunner
            variant="metro"
            initialProgress={45}
            targetProgress={60}
            initialSeconds={secondsRemaining}
            onComplete={handleRunnerComplete}
          />
        ) : null}
        {phase === "office-game" ? (
          <GoatDocumentRunner
            variant="office"
            initialProgress={progress}
            targetProgress={100}
            initialSeconds={secondsRemaining}
            onComplete={handleRunnerComplete}
          />
        ) : null}

        <EventPhotoCaptureLayer
          enabled={isPhotoPhase}
          resetNonce={photoResetNonce}
          backgroundRef={backgroundRef}
          backgroundImageSrc={STREET_BACKGROUND_IMAGE}
          naturalImageSize={naturalImageSize}
          fitMode="cover"
          targetRectNormalized={GOAT_PHOTO_RECT_NORMALIZED}
          captureOverlays={[
            {
              imageSrc: GOAT_IMAGE,
              rectNormalized: GOAT_PHOTO_RECT_NORMALIZED,
            },
          ]}
          passScore={45}
          frameSweepAxis="vertical"
          hintText="點擊畫面或空白鍵捕捉山羊"
          tutorialTitle="拍下山羊小日獸"
          tutorialLines={[
            "山羊站在街道中央，像是在等小麥做出自己的選擇。",
            "等牠進到取景框中央時按下快門。",
          ]}
          tutorialConfirmLabel="開始拍照"
          {...SUNBEAST_RETAKE_CAPTURE_PROPS}
          onConfirm={handlePhotoConfirm}
        />

        {phase === "collected" ? (
          <Flex
            position="absolute"
            inset="0"
            zIndex={24}
            bg="linear-gradient(180deg, rgba(255,248,235,0.76), rgba(239,214,177,0.94))"
            alignItems="center"
            justifyContent="center"
            px="24px"
          >
            <Flex
              w="100%"
              maxW="320px"
              direction="column"
              alignItems="center"
              gap="16px"
              px="24px"
              py="26px"
              borderRadius="24px"
              bgColor="#FFFDF8"
              border="2px solid #C99A63"
              boxShadow="0 22px 58px rgba(70,48,30,0.28)"
              animation={`${goatReveal} 520ms cubic-bezier(0.2, 0.82, 0.24, 1) both`}
            >
              <Flex
                w="170px"
                h="190px"
                alignItems="center"
                justifyContent="center"
                bg="radial-gradient(circle, rgba(240,190,111,0.34), rgba(240,190,111,0) 68%)"
              >
                <img
                  src={GOAT_IMAGE}
                  alt="已收服的山羊小日獸"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </Flex>
              <Flex direction="column" alignItems="center" gap="6px" textAlign="center">
                <Text color="#B7784F" fontSize="12px" fontWeight="900" letterSpacing="0.16em">
                  NEW SUNBEAST
                </Text>
                <Text color="#5F4937" fontSize="26px" fontWeight="900">
                  收服山羊
                </Text>
                <Text color="#8A7563" fontSize="14px" fontWeight="700" lineHeight="1.55">
                  堅持自己的立場，不代表沒有顧慮別人的感受。
                </Text>
              </Flex>
              <Flex
                as="button"
                w="100%"
                h="48px"
                borderRadius="999px"
                bgColor="#8B6749"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={onFinish}
              >
                <Text color="white" fontSize="16px" fontWeight="900">
                  回到夜間 Hub
                </Text>
              </Flex>
            </Flex>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}

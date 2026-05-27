"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiCamera } from "react-icons/fi";

const OFFICE_BACKGROUND_IMAGE = "/images/work/Office_Work_Day_Empty.png";
const CHICKEN_IMAGE = "/animals/chicken.png";
const FOLLOW_REQUIRED_MS = 2500;
const FOLLOW_RADIUS_PX = 108;
const COMPLETE_DELAY_MS = 3400;
const FOLLOW_SECONDS_LABEL = (FOLLOW_REQUIRED_MS / 1000).toFixed(1);

type GamePhase = "intro" | "qte" | "photo" | "result";
type FeedbackTone = "good" | "warn" | "idle";
type StagePoint = { x: number; y: number };
type ChickenPosition = { xPct: number; yPct: number; facing: 1 | -1 };

type FeedbackState = {
  text: string;
  tone: FeedbackTone;
  nonce: number;
};

const chickenRun = keyframes`
  0%, 100% { transform: translateY(0) rotate(-3deg) scaleY(0.98); }
  25% { transform: translateY(-7px) rotate(3deg) scaleY(1.04); }
  50% { transform: translateY(0) rotate(2deg) scaleY(0.98); }
  75% { transform: translateY(-5px) rotate(-2deg) scaleY(1.03); }
`;

const feedbackPop = keyframes`
  0% { transform: translate(-50%, 8px); opacity: 0; }
  24% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -10px); opacity: 0; }
`;

const shutterFlash = keyframes`
  0% { opacity: 0; }
  14% { opacity: 0.92; }
  100% { opacity: 0; }
`;

const successCoverTop = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(0); }
`;

const successCoverBottom = keyframes`
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
`;

const successFadeUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

function getChickenPosition(elapsedMs: number): ChickenPosition {
  const seconds = elapsedMs / 1000;
  const xPct = 50 + Math.sin(seconds * 1.35) * 34 + Math.sin(seconds * 3.2 + 0.4) * 5;
  const yPct = 56 + Math.sin(seconds * 1.9 + 0.8) * 8 + Math.sin(seconds * 7.4) * 2;
  const futureSeconds = seconds + 0.08;
  const futureXPct =
    50 + Math.sin(futureSeconds * 1.35) * 34 + Math.sin(futureSeconds * 3.2 + 0.4) * 5;

  return {
    xPct,
    yPct,
    facing: futureXPct >= xPct ? 1 : -1,
  };
}

function getDistance(a: StagePoint, b: StagePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function OfficeChickenFocusMinigameModal({
  baseFatigue: _baseFatigue,
  onSkip,
  onSolved,
  onComplete,
  successSavingsTotal,
}: {
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  successSavingsTotal?: number | null;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);
  const elapsedMsRef = useRef(0);
  const followMsRef = useRef(0);
  const pointerRef = useRef<StagePoint | null>(null);
  const solvedNotifiedRef = useRef(false);
  const completeTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [chickenPosition, setChickenPosition] = useState<ChickenPosition>({
    xPct: 50,
    yPct: 52,
    facing: 1,
  });
  const [pointerPosition, setPointerPosition] = useState<StagePoint | null>(null);
  const [followMs, setFollowMs] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [photoTakenNonce, setPhotoTakenNonce] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>({
    text: "先跟著小雞，不要急著拍",
    tone: "idle",
    nonce: 0,
  });

  const followProgressPct = Math.min(100, (followMs / FOLLOW_REQUIRED_MS) * 100);
  const followSecondsLabel = (Math.min(followMs, FOLLOW_REQUIRED_MS) / 1000).toFixed(1);
  const canTakePhoto = phase === "photo";

  const clearAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    previousFrameTimeRef.current = null;
  }, []);

  const clearCompleteTimer = useCallback(() => {
    if (completeTimerRef.current !== null) window.clearTimeout(completeTimerRef.current);
    completeTimerRef.current = null;
  }, []);

  const setFeedbackMessage = useCallback((text: string, tone: FeedbackTone) => {
    setFeedback({ text, tone, nonce: Date.now() });
  }, []);

  const startQte = useCallback(() => {
    clearAnimation();
    clearCompleteTimer();
    solvedNotifiedRef.current = false;
    elapsedMsRef.current = 0;
    followMsRef.current = 0;
    pointerRef.current = null;
    setPointerPosition(null);
    setFollowMs(0);
    setIsTracking(false);
    setIsHintOpen(false);
    setPhotoTakenNonce(0);
    setChickenPosition(getChickenPosition(0));
    setFeedbackMessage(`滑鼠貼著小雞，跟住 ${FOLLOW_SECONDS_LABEL} 秒`, "idle");
    setPhase("qte");
  }, [clearAnimation, clearCompleteTimer, setFeedbackMessage]);

  const takePhoto = useCallback(() => {
    if (phase === "intro") {
      startQte();
      return;
    }
    if (phase === "qte") {
      setFeedbackMessage(`先跟住小雞 ${FOLLOW_SECONDS_LABEL} 秒，拍照才會解鎖`, "warn");
      return;
    }
    if (phase === "result") {
      startQte();
      return;
    }

    setPhotoTakenNonce(Date.now());
    setFeedbackMessage("拍到了！小雞沒有被吵醒", "good");
    window.setTimeout(() => {
      setPhase("result");
    }, 280);
  }, [phase, setFeedbackMessage, startQte]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const stageElement = stageRef.current;
    if (!stageElement) return;
    const rect = stageElement.getBoundingClientRect();
    const nextPointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    pointerRef.current = nextPointer;
    setPointerPosition(nextPointer);
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
    setPointerPosition(null);
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (phase !== "qte" && phase !== "photo") {
      clearAnimation();
      return;
    }

    const tick = (timestamp: number) => {
      const previousTimestamp = previousFrameTimeRef.current ?? timestamp;
      const deltaMs = Math.min(64, timestamp - previousTimestamp);
      previousFrameTimeRef.current = timestamp;
      elapsedMsRef.current += deltaMs;

      const nextChickenPosition = getChickenPosition(elapsedMsRef.current);
      const stageElement = stageRef.current;
      const pointer = pointerRef.current;
      let tracking = false;

      if (phase === "qte" && stageElement && pointer) {
        const rect = stageElement.getBoundingClientRect();
        const chickenPoint = {
          x: (nextChickenPosition.xPct / 100) * rect.width,
          y: (nextChickenPosition.yPct / 100) * rect.height,
        };
        tracking = getDistance(pointer, chickenPoint) <= FOLLOW_RADIUS_PX;
      }

      setChickenPosition(nextChickenPosition);

      if (phase === "qte") {
        followMsRef.current = tracking
          ? Math.min(FOLLOW_REQUIRED_MS, followMsRef.current + deltaMs)
          : Math.max(0, followMsRef.current - deltaMs * 0.32);
        setIsTracking(tracking);
        setFollowMs(followMsRef.current);

        if (followMsRef.current >= FOLLOW_REQUIRED_MS) {
          setPhase("photo");
          setIsTracking(false);
          setFollowMs(FOLLOW_REQUIRED_MS);
          setFeedbackMessage("拍照解鎖，小雞還在跑", "good");
          return;
        }
      } else {
        setIsTracking(false);
        setFollowMs(FOLLOW_REQUIRED_MS);
      }

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return clearAnimation;
  }, [clearAnimation, phase, setFeedbackMessage]);

  useEffect(() => {
    if (phase !== "result") return;
    clearAnimation();
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }
    completeTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, COMPLETE_DELAY_MS);
    return clearCompleteTimer;
  }, [clearAnimation, clearCompleteTimer, onComplete, onSolved, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        takePhoto();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        startQte();
        return;
      }
      if (event.key.toLowerCase() === "h" || event.key === "?") {
        event.preventDefault();
        setIsHintOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSkip, startQte, takePhoto]);

  useEffect(
    () => () => {
      clearAnimation();
      clearCompleteTimer();
    },
    [clearAnimation, clearCompleteTimer],
  );

  const feedbackColor =
    feedback.tone === "good" ? "#FFE8A7" : feedback.tone === "warn" ? "#FFD2C0" : "#FFF8ED";
  const stageCaption =
    phase === "qte"
      ? isTracking
        ? "追蹤中"
        : pointerPosition
          ? "跟丟了，重新貼近小雞"
          : "把滑鼠移到小雞旁邊"
      : phase === "photo"
        ? "QTE 完成，拍正在跑的小雞"
        : phase === "result"
          ? "拍照完成"
          : "準備中";

  return (
    <Flex position="absolute" inset="0" zIndex={72} bgColor="#2D2922" overflow="hidden">
      <Flex
        ref={stageRef}
        flex="1"
        minW="0"
        position="relative"
        overflow="hidden"
        bgColor="#1E211E"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <img
          src={OFFICE_BACKGROUND_IMAGE}
          alt="辦公室背景"
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <Box
          position="absolute"
          inset="0"
          bgImage="linear-gradient(180deg, rgba(31,28,23,0.14) 0%, rgba(31,28,23,0.08) 46%, rgba(31,28,23,0.58) 100%)"
        />

        <Flex position="absolute" left="14px" top="14px" direction="column" gap="5px" zIndex={2}>
          <Text color="#FFF8ED" fontSize="18px" fontWeight="900" textShadow="0 2px 8px rgba(0,0,0,0.45)">
            加班小雞不要吵
          </Text>
          <Flex gap="7px" align="center">
            <Text color={isTracking ? "#FFE8A7" : "rgba(255,248,237,0.8)"} fontSize="11px" fontWeight="900">
              {stageCaption}
            </Text>
            <Box w="1px" h="10px" bgColor="rgba(255,248,237,0.34)" />
            <Text color="rgba(255,248,237,0.8)" fontSize="11px" fontWeight="800">
              {followSecondsLabel}/{FOLLOW_SECONDS_LABEL} 秒
            </Text>
          </Flex>
        </Flex>

        <Box
          position="absolute"
          left="14px"
          right="14px"
          top="64px"
          h="7px"
          borderRadius="999px"
          bgColor="rgba(255,248,237,0.24)"
          overflow="hidden"
          zIndex={2}
        >
          <Box
            w={`${followProgressPct}%`}
            h="100%"
            bgColor={isTracking || phase === "photo" || phase === "result" ? "#FFE8A7" : "#C99575"}
            transition="width 70ms linear, background-color 120ms ease"
          />
        </Box>

        <Flex
          position="absolute"
          left={`${chickenPosition.xPct}%`}
          top={`${chickenPosition.yPct}%`}
          w={phase === "photo" || phase === "result" ? "112px" : "96px"}
          h={phase === "photo" || phase === "result" ? "112px" : "96px"}
          align="center"
          justify="center"
          transform="translate(-50%, -50%)"
          transition="left 80ms linear, top 80ms linear, width 180ms ease, height 180ms ease"
          zIndex={3}
          pointerEvents="none"
        >
          <Flex
            w="100%"
            h="100%"
            align="center"
            justify="center"
            transform={`scaleX(${chickenPosition.facing})`}
            transition="transform 120ms ease"
          >
            <img
              src={CHICKEN_IMAGE}
              alt="辦公室裡的小雞"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
                animation: `${chickenRun} 360ms steps(2, end) infinite`,
                transformOrigin: "50% 92%",
              }}
            />
          </Flex>
        </Flex>

        {phase === "photo" ? (
          <Flex
            position="absolute"
            left={`${chickenPosition.xPct}%`}
            top={`${chickenPosition.yPct}%`}
            w="176px"
            h="176px"
            transform="translate(-50%, -50%)"
            border="4px solid rgba(255,248,237,0.92)"
            borderRadius="18px"
            boxShadow="0 0 0 999px rgba(14, 10, 8, 0.18)"
            zIndex={4}
            pointerEvents="none"
          >
            <Box position="absolute" left="12px" top="12px" w="24px" h="24px" borderLeft="4px solid #FFE8A7" borderTop="4px solid #FFE8A7" borderTopLeftRadius="8px" />
            <Box position="absolute" right="12px" top="12px" w="24px" h="24px" borderRight="4px solid #FFE8A7" borderTop="4px solid #FFE8A7" borderTopRightRadius="8px" />
            <Box position="absolute" left="12px" bottom="12px" w="24px" h="24px" borderLeft="4px solid #FFE8A7" borderBottom="4px solid #FFE8A7" borderBottomLeftRadius="8px" />
            <Box position="absolute" right="12px" bottom="12px" w="24px" h="24px" borderRight="4px solid #FFE8A7" borderBottom="4px solid #FFE8A7" borderBottomRightRadius="8px" />
          </Flex>
        ) : null}

        <Flex
          key={`feedback-${feedback.nonce}`}
          position="absolute"
          left="50%"
          bottom="14%"
          transform="translateX(-50%)"
          zIndex={6}
          px="12px"
          py="7px"
          borderRadius="999px"
          bgColor="rgba(44,34,26,0.78)"
          border="1px solid rgba(255,255,255,0.18)"
          color={feedbackColor}
          fontSize="12px"
          fontWeight="900"
          pointerEvents="none"
          animation={`${feedbackPop} 1150ms ease both`}
          whiteSpace="nowrap"
        >
          {feedback.text}
        </Flex>

        <Flex position="absolute" left="14px" right="14px" bottom="14px" zIndex={6} align="center" justify="space-between" gap="8px">
          <Flex px="10px" py="7px" borderRadius="999px" bgColor="rgba(31,24,18,0.72)" border="1px solid rgba(255,255,255,0.16)">
            <Text color="#FFF8ED" fontSize="11px" fontWeight="900">
              QTE：跟住小雞 {FOLLOW_SECONDS_LABEL} 秒
            </Text>
          </Flex>
          <Flex px="10px" py="7px" borderRadius="999px" bgColor="rgba(31,24,18,0.72)" border="1px solid rgba(255,255,255,0.16)">
            <Text color={canTakePhoto ? "#FFE8A7" : "rgba(255,248,237,0.72)"} fontSize="11px" fontWeight="900">
              拍照 {canTakePhoto ? "已解鎖" : "未解鎖"}
            </Text>
          </Flex>
        </Flex>

        {phase === "photo" ? (
          <Flex
            as="button"
            position="absolute"
            left="50%"
            bottom="56px"
            transform="translateX(-50%)"
            zIndex={8}
            h="52px"
            minW="118px"
            px="20px"
            borderRadius="999px"
            bgColor="#FFF8ED"
            border="3px solid #FFE8A7"
            align="center"
            justify="center"
            gap="8px"
            color="#6B4C34"
            cursor="pointer"
            boxShadow="0 12px 28px rgba(34, 22, 14, 0.28)"
            onClick={takePhoto}
            _active={{ transform: "translateX(-50%) scale(0.96)" }}
          >
            <FiCamera size={19} />
            <Text color="#6B4C34" fontSize="15px" fontWeight="900" lineHeight="1">
              拍照
            </Text>
          </Flex>
        ) : null}

        {photoTakenNonce > 0 ? (
          <Box
            key={`photo-flash-${photoTakenNonce}`}
            position="absolute"
            inset="0"
            bgColor="#FFFFFF"
            zIndex={50}
            pointerEvents="none"
            animation={`${shutterFlash} 420ms ease-out both`}
          />
        ) : null}
      </Flex>

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={40} bgColor="rgba(18,14,12,0.42)" align="center" justify="center" p="24px">
          <Flex
            w="100%"
            maxW="318px"
            borderRadius="10px"
            bgColor="#F7EFE2"
            boxShadow="0 14px 28px rgba(0,0,0,0.24)"
            direction="column"
            overflow="hidden"
          >
            <Flex h="164px" position="relative" bgColor="#2D2922" align="center" justify="center" overflow="hidden">
              <img
                src={OFFICE_BACKGROUND_IMAGE}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.62 }}
              />
              <img
                src={CHICKEN_IMAGE}
                alt="小雞"
                draggable={false}
                style={{ position: "relative", width: "104px", height: "104px", objectFit: "contain", display: "block" }}
              />
            </Flex>
            <Flex px="18px" pt="18px" pb="10px" direction="column" gap="9px">
              <Text color="#5E4634" fontSize="18px" fontWeight="900">
                加班小雞不要吵
              </Text>
              <Text color="#7B6352" fontSize="14px" lineHeight="1.7">
                先進行 QTE：小雞會一直在辦公室裡跑，滑鼠必須跟著牠 {FOLLOW_SECONDS_LABEL} 秒才會解鎖拍照。拍照解鎖後，按畫面下方快門或 Space 才能拍下牠。
              </Text>
            </Flex>
            <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
              <Flex
                as="button"
                onClick={startQte}
                minW="96px"
                h="38px"
                px="14px"
                borderRadius="999px"
                bgColor="#8E6D52"
                align="center"
                justify="center"
                color="white"
                fontSize="13px"
                fontWeight="900"
                cursor="pointer"
              >
                開始 QTE
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isHintOpen ? (
        <Flex position="absolute" inset="0" zIndex={50} bgColor="rgba(18,14,12,0.42)" align="center" justify="center" p="24px">
          <Flex
            w="100%"
            maxW="300px"
            minH="260px"
            borderRadius="10px"
            bgColor="#F7EFE2"
            boxShadow="0 14px 28px rgba(0,0,0,0.22)"
            direction="column"
            overflow="hidden"
          >
            <Flex px="18px" pt="18px" pb="10px" direction="column" gap="10px" flex="1">
              <Text color="#5E4634" fontSize="18px" fontWeight="900">
                QTE 提示
              </Text>
              <Text color="#7B6352" fontSize="14px" lineHeight="1.8">
                小雞會持續跑動，判定會跟著小雞本身移動。滑鼠離小雞太遠時，追蹤時間會慢慢下降，所以貼著牠移動會比較穩。
              </Text>
              <Text color="#7B6352" fontSize="13px" lineHeight="1.7">
                QTE 完成後會進入拍照階段；這時按 Space 或點畫面下方快門都可以。
              </Text>
            </Flex>
            <Flex px="18px" pb="18px" pt="6px" justify="flex-end">
              <Flex
                as="button"
                onClick={() => setIsHintOpen(false)}
                minW="76px"
                h="36px"
                px="12px"
                borderRadius="999px"
                bgColor="#8E6D52"
                align="center"
                justify="center"
                color="white"
                fontSize="12px"
                fontWeight="800"
                cursor="pointer"
              >
                關閉
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "result" ? (
        <Flex position="absolute" inset="0" zIndex={60} pointerEvents="none">
          <Box position="absolute" top="0" left="0" right="0" h="50%" bgColor="#8E6D52" animation={`${successCoverTop} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
          <Box position="absolute" bottom="0" left="0" right="0" h="50%" bgColor="#775B43" animation={`${successCoverBottom} 420ms cubic-bezier(0.2, 0.9, 0.22, 1) forwards`} />
          <Flex position="absolute" inset="0" align="center" justify="center">
            <Flex direction="column" align="center" gap="8px" animation={`${successFadeUp} 260ms ease 520ms both`}>
              <img
                src={CHICKEN_IMAGE}
                alt="小雞"
                draggable={false}
                style={{ width: "94px", height: "94px", objectFit: "contain", display: "block" }}
              />
              <Text color="white" fontSize="20px" fontWeight="900">
                拍照完成
              </Text>
              <Text color="rgba(255,255,255,0.84)" fontSize="13px" fontWeight="700" textAlign="center" maxW="260px">
                你先安靜跟上牠的步調，再把專心工作的瞬間拍了下來。
              </Text>
              <Text color="#FFF1D9" fontSize="20px" fontWeight="900">
                QTE 追蹤 {FOLLOW_SECONDS_LABEL} 秒
              </Text>
              <Text color="rgba(255,255,255,0.92)" fontSize="14px" fontWeight="900">
                小遊戲獎勵
              </Text>
              <Text color="#FFF1D9" fontSize="18px" fontWeight="900">
                小日幣 x10
              </Text>
              {successSavingsTotal !== null && successSavingsTotal !== undefined ? (
                <Text color="rgba(255,255,255,0.82)" fontSize="12px" fontWeight="700">
                  目前共有 {successSavingsTotal} 小日幣
                </Text>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

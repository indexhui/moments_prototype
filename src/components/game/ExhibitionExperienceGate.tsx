"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaMusic, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import { ExhibitionExperienceView } from "@/components/game/ExhibitionExperienceView";
import {
  GAME_AUDIO_STATE_CHANGE_EVENT,
  getGameAudioStateSnapshot,
  prepareGameAudioStateMachine,
  setGameSfxMuted,
  type GameAudioStateSnapshot,
} from "@/lib/game/audioStateMachine";
import {
  playFmodGameEvent,
  prepareFmodGameAudio,
  resumeFmodGameAudio,
  setFmodGameMusicMuted,
  startFmodGameMusic,
} from "@/lib/game/fmodWeb";
import { preloadGameImages } from "@/lib/game/preloadAssets";
import { playGameSfx } from "@/lib/game/soundEffects";
import type { ExhibitionPhase } from "@/lib/game/exhibitionFlow";

const START_BACKGROUND = "/images/exhibition/start/start-background.png";
const START_LIGHT = "/images/exhibition/start/start-light.png";
const START_LOGO = "/images/exhibition/start/start-logo.png";
const LOADING_BACKGROUND = "/images/exhibition/start/loading-background.png";
const LOADING_PETS = "/images/exhibition/start/loading-pets.png";
const LOADING_WALK = "/images/exhibition/start/loading-walk.png";

const MINIMUM_LOADING_DURATION_MS = 1_150;
const LOADING_COMPLETE_HOLD_MS = 220;
const LOADING_FADE_DURATION_MS = 320;

type EntryStage = "title" | "loading" | "leaving" | "playing";

const titleScreenIn = keyframes`
  from { opacity: 0; transform: scale(1.015); }
  to { opacity: 1; transform: scale(1); }
`;

const loadingScreenIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const walkBob = keyframes`
  0%, 100% { transform: translateY(0) rotate(-0.7deg); }
  50% { transform: translateY(-5px) rotate(0.7deg); }
`;

const loadingPetsBob = keyframes`
  0%, 100% { transform: translate(-50%, -50%) rotate(-16deg) translateY(0); }
  50% { transform: translate(-50%, -50%) rotate(-11deg) translateY(-3px); }
`;

function delay(durationMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, durationMs));
}

function AudioIconToggle({
  active,
  activeLabel,
  inactiveLabel,
  onClick,
  children,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const label = active ? activeLabel : inactiveLabel;

  return (
    <Flex
      as="button"
      data-audio-trigger-label={label}
      aria-label={label}
      aria-pressed={active}
      title={label}
      w="40px"
      h="40px"
      border="1px solid rgba(139,113,96,0.26)"
      borderRadius="999px"
      bgColor={active ? "rgba(255,255,255,0.9)" : "rgba(139,113,96,0.84)"}
      color={active ? "#8B7160" : "white"}
      boxShadow="0 4px 14px rgba(83,61,48,0.16)"
      backdropFilter="blur(9px)"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      fontSize="17px"
      transition="transform 150ms ease, background-color 150ms ease, color 150ms ease"
      _hover={{ transform: "translateY(-1px)" }}
      _active={{ transform: "translateY(1px) scale(0.97)" }}
      onClick={onClick}
    >
      {children}
    </Flex>
  );
}

function ExhibitionTitleScreen({
  audioState,
  onStart,
}: {
  audioState: GameAudioStateSnapshot;
  onStart: () => void;
}) {
  const musicActive = !audioState.music.muted;
  const sfxActive = !audioState.sfx.muted;

  return (
    <Flex
      data-defer-game-audio-start="true"
      w="100%"
      h="100%"
      position="relative"
      overflow="hidden"
      bgColor="white"
      animation={`${titleScreenIn} 420ms ease-out both`}
    >
      <Image
        src={START_BACKGROUND}
        alt="小麥在公車站向即將進站的公車揮手"
        position="absolute"
        inset="0"
        w="100%"
        h="100%"
        objectFit="cover"
        pointerEvents="none"
        userSelect="none"
      />
      <Image
        src={START_LIGHT}
        alt=""
        aria-hidden="true"
        position="absolute"
        top="47px"
        left="0"
        w="393px"
        h="707px"
        pointerEvents="none"
        userSelect="none"
      />
      <Image
        src={START_LOGO}
        alt="てくてく日和"
        position="absolute"
        top="47px"
        left="52px"
        w="273px"
        h="187px"
        objectFit="contain"
        pointerEvents="none"
        userSelect="none"
      />

      <Flex
        position="absolute"
        zIndex={3}
        top="16px"
        right="16px"
        gap="8px"
        p="5px"
        borderRadius="999px"
        bgColor="rgba(255,255,255,0.34)"
        backdropFilter="blur(7px)"
      >
        <AudioIconToggle
          active={musicActive}
          activeLabel="關閉背景音樂"
          inactiveLabel="開啟背景音樂"
          onClick={() => {
            setFmodGameMusicMuted(musicActive);
            playGameSfx("uiDialogContinue", { volumeScale: 0.62 });
          }}
        >
          <Box position="relative" display="flex" alignItems="center" justifyContent="center">
            <FaMusic />
            {!musicActive ? (
              <Box
                aria-hidden="true"
                position="absolute"
                w="23px"
                h="2px"
                borderRadius="999px"
                bgColor="white"
                transform="rotate(-42deg)"
              />
            ) : null}
          </Box>
        </AudioIconToggle>
        <AudioIconToggle
          active={sfxActive}
          activeLabel="關閉遊戲音效"
          inactiveLabel="開啟遊戲音效"
          onClick={() => {
            const muted = setGameSfxMuted(sfxActive);
            if (!muted) playGameSfx("uiDialogContinue", { volumeScale: 0.72 });
          }}
        >
          {sfxActive ? <FaVolumeHigh /> : <FaVolumeXmark />}
        </AudioIconToggle>
      </Flex>

      <Flex
        as="button"
        data-audio-trigger-label="開始遊戲"
        aria-label="開始遊戲"
        position="absolute"
        zIndex={2}
        top="661px"
        left="0"
        w="100%"
        h="87px"
        border="0"
        bg="linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.82) 48%, rgba(255,255,255,0) 100%)"
        color="#907054"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        transition="filter 160ms ease, transform 160ms ease"
        _hover={{ filter: "brightness(1.03)" }}
        _active={{ transform: "scale(0.99)", filter: "brightness(0.98)" }}
        onClick={onStart}
      >
        <Text
          mt="1px"
          fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
          fontSize="24px"
          fontWeight="400"
          letterSpacing="0.02em"
        >
          開始遊戲
        </Text>
      </Flex>
    </Flex>
  );
}

function ExhibitionLoadingScreen({
  progress,
  isLeaving,
}: {
  progress: number;
  isLeaving: boolean;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Flex
      data-defer-game-audio-start="true"
      w="100%"
      h="100%"
      position="relative"
      overflow="hidden"
      bgColor="#E8E5C9"
      opacity={isLeaving ? 0 : 1}
      transition={`opacity ${LOADING_FADE_DURATION_MS}ms ease`}
      animation={isLeaving ? undefined : `${loadingScreenIn} 280ms ease-out both`}
    >
      <Image
        src={LOADING_BACKGROUND}
        alt=""
        aria-hidden="true"
        position="absolute"
        inset="0"
        w="100%"
        h="100%"
        objectFit="cover"
        pointerEvents="none"
        userSelect="none"
      />

      <Flex
        position="absolute"
        top="169px"
        left="28px"
        w="338px"
        h="338px"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
      >
        <Image
          src={LOADING_WALK}
          alt="小麥步行中"
          h="316px"
          w="149px"
          objectFit="contain"
          imageRendering="auto"
          animation={`${walkBob} 720ms ease-in-out infinite`}
          userSelect="none"
        />
      </Flex>

      <Text
        position="absolute"
        top="518px"
        left="0"
        w="100%"
        color="#8B7160"
        fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
        fontSize="32px"
        fontWeight="500"
        lineHeight="1.2"
        textAlign="center"
      >
        讀取中...
      </Text>

      <Box
        position="absolute"
        top="583px"
        left="10px"
        w="373px"
        h="23px"
        p="2px"
        border="2px solid #9C8472"
        borderRadius="8px"
        bgColor="white"
        overflow="visible"
        role="progressbar"
        aria-label="遊戲資源讀取進度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedProgress)}
      >
        <Box
          position="absolute"
          inset="2px"
          borderRadius="5px"
          bgColor="rgba(156,132,114,0.15)"
          overflow="hidden"
        >
          <Box
            w={`${clampedProgress}%`}
            h="100%"
            borderRadius="4px"
            bgColor="#9C8472"
            transition="width 180ms ease-out"
          />
        </Box>
        <Image
          src={LOADING_PETS}
          alt=""
          aria-hidden="true"
          position="absolute"
          zIndex={2}
          top="50%"
          left={`clamp(25px, calc(${clampedProgress}% - 3px), 348px)`}
          w="49px"
          h="44px"
          objectFit="contain"
          pointerEvents="none"
          animation={`${loadingPetsBob} 780ms ease-in-out infinite`}
          transition="left 180ms ease-out"
          userSelect="none"
        />
      </Box>
    </Flex>
  );
}

export function ExhibitionExperienceGate({
  initialPreview = null,
  initialSceneStep = null,
}: {
  initialPreview?: ExhibitionPhase | null;
  initialSceneStep?: string | null;
}) {
  const [stage, setStage] = useState<EntryStage>(initialPreview ? "playing" : "title");
  const [progress, setProgress] = useState(0);
  const [audioState, setAudioState] = useState<GameAudioStateSnapshot>(
    getGameAudioStateSnapshot,
  );
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    prepareGameAudioStateMachine();
    setAudioState(getGameAudioStateSnapshot());
    void prepareFmodGameAudio();

    const handleAudioStateChange = (event: Event) => {
      const nextState = (event as CustomEvent<GameAudioStateSnapshot>).detail;
      if (nextState) setAudioState(nextState);
    };

    window.addEventListener(GAME_AUDIO_STATE_CHANGE_EVENT, handleAudioStateChange);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener(GAME_AUDIO_STATE_CHANGE_EVENT, handleAudioStateChange);
    };
  }, []);

  const handleStart = async () => {
    if (stage !== "title") return;
    const startedAt = window.performance.now();
    setStage("loading");
    setProgress(2);

    resumeFmodGameAudio();
    if (!playFmodGameEvent("startGame")) {
      playGameSfx("uiDialogContinue", { volumeScale: 0.72 });
    }
    startFmodGameMusic();

    await Promise.all([
      prepareFmodGameAudio(),
      preloadGameImages(({ loaded, total }) => {
        if (!isMountedRef.current) return;
        const imageProgress = total <= 0 ? 94 : Math.round((loaded / total) * 94);
        setProgress(Math.max(2, imageProgress));
      }),
    ]);

    const elapsed = window.performance.now() - startedAt;
    if (elapsed < MINIMUM_LOADING_DURATION_MS) {
      await delay(MINIMUM_LOADING_DURATION_MS - elapsed);
    }
    if (!isMountedRef.current) return;

    setProgress(100);
    await delay(LOADING_COMPLETE_HOLD_MS);
    if (!isMountedRef.current) return;
    setStage("leaving");
    await delay(LOADING_FADE_DURATION_MS);
    if (isMountedRef.current) setStage("playing");
  };

  if (stage === "playing") {
    return (
      <ExhibitionExperienceView
        initialPreview={initialPreview}
        initialSceneStep={initialSceneStep}
      />
    );
  }

  return (
    <Flex
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      position="relative"
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      bgColor="white"
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.14)" }}
      data-exhibition-entry-stage={stage}
    >
      {stage === "title" ? (
        <ExhibitionTitleScreen audioState={audioState} onStart={() => void handleStart()} />
      ) : (
        <ExhibitionLoadingScreen progress={progress} isLeaving={stage === "leaving"} />
      )}
    </Flex>
  );
}

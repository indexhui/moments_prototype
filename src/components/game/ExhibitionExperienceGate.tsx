"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaGear, FaMusic, FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
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
  setFmodGameMusicTrack,
  startFmodGameMusic,
} from "@/lib/game/fmodWeb";
import { preloadGameImages } from "@/lib/game/preloadAssets";
import { playGameSfx } from "@/lib/game/soundEffects";
import type { ExhibitionPhase } from "@/lib/game/exhibitionFlow";

const START_BACKGROUND = "/images/exhibition/start/start-background.png";
const START_LIGHT = "/images/exhibition/start/start-light.png";
const CHAPTER_SELECT_ARROW = "/images/exhibition/start/chapter-select-arrow.svg";
const CHAPTER_RESET = "/images/exhibition/start/chapter-reset.svg";
const LOADING_BACKGROUND = "/images/exhibition/start/loading-background.png";
const LOADING_PETS = "/images/exhibition/start/loading-pets.png";
const LOADING_WALK = "/images/exhibition/start/loading-walk.png";

const MINIMUM_LOADING_DURATION_MS = 1_150;
const LOADING_COMPLETE_HOLD_MS = 220;
const LOADING_FADE_DURATION_MS = 320;
const SHOW_EXHIBITION_LOADING_SCREEN = false;

type EntryStage = "title" | "loading" | "leaving" | "playing";
type ExhibitionLocale = "zh" | "ja" | "en";

type ExhibitionRecoveryChapter = {
  phase: ExhibitionPhase | "";
  labels: Record<ExhibitionLocale, string>;
};

const EXHIBITION_RECOVERY_CHAPTERS: readonly ExhibitionRecoveryChapter[] = [
  {
    phase: "",
    labels: { zh: "ch1.開場", ja: "ch1.オープニング", en: "ch1.Opening" },
  },
  {
    phase: "metro-opening",
    labels: { zh: "ch2.捷運", ja: "ch2.地下鉄", en: "ch2.Metro" },
  },
  {
    phase: "office-opening",
    labels: { zh: "ch3.公司", ja: "ch3.会社", en: "ch3.Office" },
  },
  {
    phase: "home-search",
    labels: { zh: "ch4.日記", ja: "ch4.日記", en: "ch4.Diary" },
  },
  {
    phase: "street-flyer",
    labels: { zh: "ch5.街道", ja: "ch5.街", en: "ch5.Street" },
  },
  {
    phase: "convenience-clerk",
    labels: { zh: "ch6.便利商店", ja: "ch6.コンビニ", en: "ch6.Store" },
  },
  {
    phase: "dessert-transition",
    labels: { zh: "ch7.甜點店", ja: "ch7.スイーツ店", en: "ch7.Dessert" },
  },
] as const;

const EXHIBITION_LOCALES: readonly {
  id: ExhibitionLocale;
  shortLabel: string;
  name: string;
  logo: string;
  logoAlt: string;
}[] = [
  {
    id: "zh",
    shortLabel: "中",
    name: "繁體中文",
    logo: "/images/exhibition/start/logo-zh.png",
    logoAlt: "走走小日",
  },
  {
    id: "ja",
    shortLabel: "日",
    name: "日本語",
    logo: "/images/exhibition/start/start-logo.png",
    logoAlt: "てくてく日和",
  },
  {
    id: "en",
    shortLabel: "英",
    name: "English",
    logo: "/images/exhibition/start/logo-en.svg",
    logoAlt: "Ditto MOMENTS",
  },
] as const;

const EXHIBITION_TITLE_COPY: Record<
  ExhibitionLocale,
  {
    startGame: string;
    language: string;
    languageTitle: string;
    settings: string;
    chapterTitle: string;
    openChapter: string;
    resetChapter: string;
    closeChapter: string;
    closeLanguage: string;
    closeSettings: string;
    music: string;
    sfx: string;
    musicOn: string;
    musicOff: string;
    sfxOn: string;
    sfxOff: string;
  }
> = {
  zh: {
    startGame: "開始遊戲",
    language: "切換語言",
    languageTitle: "選擇語言",
    settings: "設定",
    chapterTitle: "選擇接續章節",
    openChapter: "開啟章節選擇",
    resetChapter: "重設為第一章",
    closeChapter: "關閉章節選擇",
    closeLanguage: "關閉語言選擇",
    closeSettings: "關閉設定",
    music: "背景音樂",
    sfx: "遊戲音效",
    musicOn: "關閉背景音樂",
    musicOff: "開啟背景音樂",
    sfxOn: "關閉遊戲音效",
    sfxOff: "開啟遊戲音效",
  },
  ja: {
    startGame: "ゲーム開始",
    language: "言語を切り替える",
    languageTitle: "言語を選択",
    settings: "設定",
    chapterTitle: "チャプター選択",
    openChapter: "チャプター選択を開く",
    resetChapter: "チャプター1に戻す",
    closeChapter: "チャプター選択を閉じる",
    closeLanguage: "言語選択を閉じる",
    closeSettings: "設定を閉じる",
    music: "BGM",
    sfx: "効果音",
    musicOn: "BGMをオフにする",
    musicOff: "BGMをオンにする",
    sfxOn: "効果音をオフにする",
    sfxOff: "効果音をオンにする",
  },
  en: {
    startGame: "Start Game",
    language: "Change language",
    languageTitle: "Select Language",
    settings: "Settings",
    chapterTitle: "Select Chapter",
    openChapter: "Open chapter selection",
    resetChapter: "Reset to Chapter 1",
    closeChapter: "Close chapter selection",
    closeLanguage: "Close language selection",
    closeSettings: "Close settings",
    music: "Music",
    sfx: "Sound Effects",
    musicOn: "Turn music off",
    musicOff: "Turn music on",
    sfxOn: "Turn sound effects off",
    sfxOff: "Turn sound effects on",
  },
};

const TITLE_LOGO_PLACEMENT: Record<
  ExhibitionLocale,
  { top: string; left: string; width: string; height: string }
> = {
  zh: { top: "90px", left: "34px", width: "325px", height: "99px" },
  ja: { top: "68px", left: "52px", width: "273px", height: "187px" },
  en: { top: "88px", left: "49px", width: "295px", height: "116px" },
};

const titleScreenIn = keyframes`
  from { opacity: 0; transform: scale(1.015); }
  to { opacity: 1; transform: scale(1); }
`;

const titleLightBreathe = keyframes`
  0%, 100% { opacity: 0.82; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.025); }
`;

const titleLogoFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-4px) rotate(0.35deg); }
`;

const startBandBreathe = keyframes`
  0%, 100% { opacity: 0.72; transform: scaleX(0.94); }
  50% { opacity: 1; transform: scaleX(1.03); }
`;

const startBandSweep = keyframes`
  0%, 24% { opacity: 0; transform: translateX(-90px) skewX(-17deg); }
  34% { opacity: 0.7; }
  58%, 100% { opacity: 0; transform: translateX(470px) skewX(-17deg); }
`;

const chapterModalBackdropIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const chapterModalIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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

function TitleUtilityButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Flex
      as="button"
      aria-label={label}
      title={label}
      w="40px"
      h="40px"
      border="1px solid rgba(139,113,96,0.24)"
      borderRadius="999px"
      bgColor="rgba(255,255,255,0.9)"
      color="#8B7160"
      boxShadow="0 4px 14px rgba(83,61,48,0.14)"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      fontFamily="'Noto Sans TC', system-ui, sans-serif"
      fontSize="16px"
      fontWeight="700"
      lineHeight="1"
      transition="transform 150ms ease, background-color 150ms ease"
      _hover={{ transform: "translateY(-1px)", bgColor: "white" }}
      _active={{ transform: "translateY(1px) scale(0.97)" }}
      _focusVisible={{ outline: "3px solid rgba(83,170,184,0.7)", outlineOffset: "2px" }}
      onClick={onClick}
    >
      {children}
    </Flex>
  );
}

function ModalCloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Flex
      as="button"
      aria-label={label}
      w="34px"
      h="34px"
      border="1px solid rgba(139,113,96,0.16)"
      borderRadius="999px"
      bgColor="rgba(255,255,255,0.66)"
      color="#876B58"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      fontFamily="system-ui, sans-serif"
      fontSize="21px"
      fontWeight="300"
      lineHeight="1"
      transition="transform 140ms ease, background-color 140ms ease"
      _hover={{ bgColor: "white", transform: "rotate(5deg)" }}
      _active={{ transform: "scale(0.94)" }}
      onClick={onClick}
    >
      ×
    </Flex>
  );
}

function ExhibitionTitleScreen({
  audioState,
  onStart,
}: {
  audioState: GameAudioStateSnapshot;
  onStart: (phase: ExhibitionPhase | null) => void;
}) {
  const [locale, setLocale] = useState<ExhibitionLocale>("zh");
  const [selectedChapter, setSelectedChapter] = useState<ExhibitionPhase | "">("");
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const musicActive = !audioState.music.muted;
  const sfxActive = !audioState.sfx.muted;
  const copy = EXHIBITION_TITLE_COPY[locale];
  const localeOption = EXHIBITION_LOCALES.find((option) => option.id === locale) ?? EXHIBITION_LOCALES[0];
  const logoPlacement = TITLE_LOGO_PLACEMENT[locale];
  const selectedChapterLabel =
    EXHIBITION_RECOVERY_CHAPTERS.find((chapter) => chapter.phase === selectedChapter)?.labels[locale] ??
    EXHIBITION_RECOVERY_CHAPTERS[0].labels[locale];
  const hasOpenModal = isChapterModalOpen || isLanguageModalOpen || isSettingsModalOpen;

  const ensureTitleMusic = () => {
    resumeFmodGameAudio();
    if (!audioState.music.requested) startFmodGameMusic();
  };

  useEffect(() => {
    if (!hasOpenModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsChapterModalOpen(false);
      setIsLanguageModalOpen(false);
      setIsSettingsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasOpenModal]);

  return (
    <Flex
      data-defer-game-audio-start="true"
      w="100%"
      h="100%"
      position="relative"
      overflow="hidden"
      bgColor="white"
      animation={`${titleScreenIn} 420ms ease-out both`}
      onPointerDownCapture={ensureTitleMusic}
      onKeyDownCapture={(event) => {
        if (event.key === "Enter" || event.key === " ") ensureTitleMusic();
      }}
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
        transformOrigin="70% 72%"
        animation={`${titleLightBreathe} 3.8s ease-in-out infinite`}
      />
      <Image
        src={localeOption.logo}
        alt={localeOption.logoAlt}
        position="absolute"
        top={logoPlacement.top}
        left={logoPlacement.left}
        w={logoPlacement.width}
        h={logoPlacement.height}
        objectFit="contain"
        pointerEvents="none"
        userSelect="none"
        transformOrigin="50% 50%"
        animation={`${titleLogoFloat} 4.2s ease-in-out infinite`}
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
        <TitleUtilityButton
          label={copy.language}
          onClick={() => {
            setIsLanguageModalOpen(true);
            setIsSettingsModalOpen(false);
            setIsChapterModalOpen(false);
            playGameSfx("uiDialogContinue", { volumeScale: 0.55 });
          }}
        >
          {localeOption.shortLabel}
        </TitleUtilityButton>
        <TitleUtilityButton
          label={copy.settings}
          onClick={() => {
            setIsSettingsModalOpen(true);
            setIsLanguageModalOpen(false);
            setIsChapterModalOpen(false);
            playGameSfx("uiDialogContinue", { volumeScale: 0.55 });
          }}
        >
          <FaGear aria-hidden="true" />
        </TitleUtilityButton>
      </Flex>

      <Flex
        as="button"
        data-audio-trigger-label={copy.startGame}
        aria-label={copy.startGame}
        position="absolute"
        zIndex={2}
        top="611px"
        left="0"
        w="100%"
        h="87px"
        border="0"
        bgColor="transparent"
        color="#907054"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        cursor="pointer"
        fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
        fontSize="24px"
        fontWeight="500"
        transition="filter 160ms ease, transform 160ms ease"
        _hover={{ filter: "brightness(1.04)" }}
        _active={{ transform: "scale(0.99)", filter: "brightness(0.98)" }}
        _focusVisible={{ outline: "3px solid rgba(83,170,184,0.78)", outlineOffset: "-4px" }}
        onClick={() => onStart(selectedChapter || null)}
      >
        <Box
          aria-hidden="true"
          position="absolute"
          inset="0"
          bg="linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.82) 48%, rgba(255,255,255,0) 100%)"
          transformOrigin="center"
          animation={`${startBandBreathe} 2.4s ease-in-out infinite`}
        />
        <Box
          aria-hidden="true"
          position="absolute"
          top="-18px"
          left="0"
          w="54px"
          h="123px"
          bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.86), transparent)"
          filter="blur(1px)"
          animation={`${startBandSweep} 3.2s ease-in-out infinite`}
        />
        <Text position="relative" zIndex={1} fontSize="24px" fontWeight="500">
          {copy.startGame}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        zIndex={3}
        top="711px"
        left="119px"
        w="175px"
        h="28px"
        borderRadius="10px"
        bgColor="rgba(255,255,255,0.7)"
        overflow="hidden"
      >
        <Image
          src={CHAPTER_SELECT_ARROW}
          alt=""
          aria-hidden="true"
          position="absolute"
          zIndex={1}
          top="10px"
          left="12px"
          w="12px"
          h="7px"
          transform="scaleY(-1)"
          pointerEvents="none"
        />
        <Flex
          as="button"
          aria-label={`${copy.openChapter}：${selectedChapterLabel}`}
          position="absolute"
          zIndex={2}
          top="0"
          bottom="0"
          left="0"
          right="27px"
          border="0"
          borderRadius="10px 0 0 10px"
          bgColor="transparent"
          color="#937866"
          alignItems="center"
          pl="36px"
          cursor="pointer"
          fontFamily="'Noto Sans TC', system-ui, sans-serif"
          fontSize="12px"
          fontWeight="500"
          lineHeight="20px"
          letterSpacing="0.08em"
          transition="background-color 150ms ease"
          _hover={{ bgColor: "rgba(255,255,255,0.28)" }}
          _focusVisible={{ outline: "2px solid rgba(83,170,184,0.68)", outlineOffset: "-2px" }}
          onClick={() => {
            setIsChapterModalOpen(true);
            playGameSfx("uiDialogContinue", { volumeScale: 0.55 });
          }}
        >
          {selectedChapterLabel}
        </Flex>
        <Flex
          as="button"
          aria-label={copy.resetChapter}
          title={copy.resetChapter}
          position="absolute"
          zIndex={3}
          top="7px"
          right="7px"
          w="14px"
          h="14px"
          border="0"
          borderRadius="999px"
          bgColor="rgba(255,255,255,0.34)"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          transition="transform 150ms ease, background-color 150ms ease"
          _hover={{ transform: "rotate(-22deg)", bgColor: "rgba(255,255,255,0.78)" }}
          _active={{ transform: "rotate(-38deg) scale(0.92)" }}
          onClick={() => {
            setSelectedChapter("");
            playGameSfx("uiDialogContinue", { volumeScale: 0.52 });
          }}
        >
          <Image
            src={CHAPTER_RESET}
            alt=""
            aria-hidden="true"
            w="10px"
            h="10px"
            pointerEvents="none"
          />
        </Flex>
      </Flex>

      {isLanguageModalOpen ? (
        <Flex
          position="absolute"
          zIndex={20}
          inset="0"
          p="20px"
          bgColor="rgba(55,42,35,0.48)"
          backdropFilter="blur(4px)"
          alignItems="center"
          justifyContent="center"
          animation={`${chapterModalBackdropIn} 170ms ease-out both`}
          onClick={() => setIsLanguageModalOpen(false)}
        >
          <Flex
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
            w="325px"
            maxW="100%"
            direction="column"
            px="16px"
            pt="17px"
            pb="16px"
            border="1px solid rgba(255,255,255,0.86)"
            borderRadius="24px"
            bg="linear-gradient(160deg, rgba(255,253,247,0.98) 0%, rgba(240,230,212,0.98) 100%)"
            boxShadow="0 22px 50px rgba(48,31,22,0.32), inset 0 1px 0 white"
            animation={`${chapterModalIn} 230ms cubic-bezier(0.22, 1, 0.36, 1) both`}
            onClick={(event) => event.stopPropagation()}
          >
            <Flex alignItems="center" justifyContent="space-between" gap="12px" px="3px">
              <Text
                id="language-modal-title"
                color="#6F5544"
                fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
                fontSize="22px"
                fontWeight="600"
                lineHeight="1.3"
              >
                {copy.languageTitle}
              </Text>
              <ModalCloseButton label={copy.closeLanguage} onClick={() => setIsLanguageModalOpen(false)} />
            </Flex>

            <Flex direction="column" gap="8px" mt="15px">
              {EXHIBITION_LOCALES.map((option) => {
                const isSelected = option.id === locale;
                return (
                  <Flex
                    as="button"
                    key={option.id}
                    aria-label={option.name}
                    aria-pressed={isSelected}
                    w="100%"
                    minH="62px"
                    px="11px"
                    border={isSelected ? "1px solid rgba(87,156,169,0.5)" : "1px solid rgba(139,113,96,0.12)"}
                    borderRadius="16px"
                    bgColor={isSelected ? "rgba(224,244,246,0.9)" : "rgba(255,255,255,0.66)"}
                    color="#755A48"
                    alignItems="center"
                    textAlign="left"
                    cursor="pointer"
                    boxShadow={isSelected ? "0 5px 14px rgba(70,127,138,0.12)" : "0 3px 10px rgba(82,59,43,0.06)"}
                    transition="transform 140ms ease, background-color 140ms ease, border-color 140ms ease"
                    _hover={{ transform: "translateX(2px)", bgColor: isSelected ? "#E0F4F6" : "white" }}
                    _active={{ transform: "scale(0.985)" }}
                    onClick={() => {
                      setLocale(option.id);
                      setIsLanguageModalOpen(false);
                      playGameSfx("uiDialogContinue", { volumeScale: 0.62 });
                    }}
                  >
                    <Flex
                      flex="0 0 auto"
                      w="42px"
                      h="42px"
                      borderRadius="14px"
                      bgColor={isSelected ? "#67A9B5" : "#9A7E69"}
                      color="white"
                      alignItems="center"
                      justifyContent="center"
                      fontFamily="'Noto Sans TC', system-ui, sans-serif"
                      fontSize="18px"
                      fontWeight="800"
                    >
                      {option.shortLabel}
                    </Flex>
                    <Text
                      flex="1"
                      pl="13px"
                      fontFamily="'Noto Sans TC', system-ui, sans-serif"
                      fontSize="16px"
                      fontWeight="600"
                      letterSpacing="0.04em"
                    >
                      {option.name}
                    </Text>
                    <Text
                      aria-hidden="true"
                      w="25px"
                      color={isSelected ? "#4F929E" : "rgba(117,90,72,0.34)"}
                      fontSize="17px"
                      fontWeight="800"
                      textAlign="center"
                    >
                      {isSelected ? "✓" : "›"}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isSettingsModalOpen ? (
        <Flex
          position="absolute"
          zIndex={20}
          inset="0"
          p="20px"
          bgColor="rgba(55,42,35,0.48)"
          backdropFilter="blur(4px)"
          alignItems="center"
          justifyContent="center"
          animation={`${chapterModalBackdropIn} 170ms ease-out both`}
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <Flex
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            w="325px"
            maxW="100%"
            direction="column"
            px="16px"
            pt="17px"
            pb="16px"
            border="1px solid rgba(255,255,255,0.86)"
            borderRadius="24px"
            bg="linear-gradient(160deg, rgba(255,253,247,0.98) 0%, rgba(240,230,212,0.98) 100%)"
            boxShadow="0 22px 50px rgba(48,31,22,0.32), inset 0 1px 0 white"
            animation={`${chapterModalIn} 230ms cubic-bezier(0.22, 1, 0.36, 1) both`}
            onClick={(event) => event.stopPropagation()}
          >
            <Flex alignItems="center" justifyContent="space-between" gap="12px" px="3px">
              <Text
                id="settings-modal-title"
                color="#6F5544"
                fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
                fontSize="22px"
                fontWeight="600"
                lineHeight="1.3"
              >
                {copy.settings}
              </Text>
              <ModalCloseButton label={copy.closeSettings} onClick={() => setIsSettingsModalOpen(false)} />
            </Flex>

            <Flex direction="column" gap="9px" mt="15px">
              <Flex
                minH="66px"
                px="13px"
                border="1px solid rgba(139,113,96,0.12)"
                borderRadius="16px"
                bgColor="rgba(255,255,255,0.66)"
                alignItems="center"
                justifyContent="space-between"
              >
                <Flex alignItems="center" gap="11px" color="#755A48">
                  <FaMusic aria-hidden="true" />
                  <Text fontFamily="'Noto Sans TC', system-ui, sans-serif" fontSize="16px" fontWeight="600">
                    {copy.music}
                  </Text>
                </Flex>
                <AudioIconToggle
                  active={musicActive}
                  activeLabel={copy.musicOn}
                  inactiveLabel={copy.musicOff}
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
              </Flex>

              <Flex
                minH="66px"
                px="13px"
                border="1px solid rgba(139,113,96,0.12)"
                borderRadius="16px"
                bgColor="rgba(255,255,255,0.66)"
                alignItems="center"
                justifyContent="space-between"
              >
                <Flex alignItems="center" gap="11px" color="#755A48">
                  {sfxActive ? <FaVolumeHigh aria-hidden="true" /> : <FaVolumeXmark aria-hidden="true" />}
                  <Text fontFamily="'Noto Sans TC', system-ui, sans-serif" fontSize="16px" fontWeight="600">
                    {copy.sfx}
                  </Text>
                </Flex>
                <AudioIconToggle
                  active={sfxActive}
                  activeLabel={copy.sfxOn}
                  inactiveLabel={copy.sfxOff}
                  onClick={() => {
                    const muted = setGameSfxMuted(sfxActive);
                    if (!muted) playGameSfx("uiDialogContinue", { volumeScale: 0.72 });
                  }}
                >
                  {sfxActive ? <FaVolumeHigh /> : <FaVolumeXmark />}
                </AudioIconToggle>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isChapterModalOpen ? (
        <Flex
          position="absolute"
          zIndex={20}
          inset="0"
          p="20px"
          bgColor="rgba(55,42,35,0.48)"
          backdropFilter="blur(4px)"
          alignItems="center"
          justifyContent="center"
          animation={`${chapterModalBackdropIn} 170ms ease-out both`}
          onClick={() => setIsChapterModalOpen(false)}
        >
          <Flex
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-modal-title"
            w="325px"
            maxW="100%"
            maxH="calc(100% - 24px)"
            direction="column"
            px="16px"
            pt="17px"
            pb="15px"
            border="1px solid rgba(255,255,255,0.86)"
            borderRadius="24px"
            bg="linear-gradient(160deg, rgba(255,253,247,0.98) 0%, rgba(240,230,212,0.98) 100%)"
            boxShadow="0 22px 50px rgba(48,31,22,0.32), inset 0 1px 0 white"
            overflow="hidden"
            animation={`${chapterModalIn} 230ms cubic-bezier(0.22, 1, 0.36, 1) both`}
            onClick={(event) => event.stopPropagation()}
          >
            <Flex alignItems="center" justifyContent="space-between" gap="12px" px="3px">
              <Text
                id="chapter-modal-title"
                color="#6F5544"
                fontFamily="'TaiwanPearl', 'Noto Sans TC', system-ui, sans-serif"
                fontSize="22px"
                fontWeight="600"
                lineHeight="1.3"
              >
                {copy.chapterTitle}
              </Text>
              <ModalCloseButton label={copy.closeChapter} onClick={() => setIsChapterModalOpen(false)} />
            </Flex>

            <Flex direction="column" gap="7px" mt="14px" overflowY="auto" minH="0">
              {EXHIBITION_RECOVERY_CHAPTERS.map((chapter, index) => {
                const isSelected = chapter.phase === selectedChapter;
                return (
                  <Flex
                    as="button"
                    key={chapter.phase || "opening"}
                    aria-label={`${copy.chapterTitle}：${chapter.labels[locale]}`}
                    flex="0 0 auto"
                    w="100%"
                    minH="55px"
                    px="10px"
                    border={isSelected ? "1px solid rgba(87,156,169,0.5)" : "1px solid rgba(139,113,96,0.12)"}
                    borderRadius="15px"
                    bgColor={isSelected ? "rgba(224,244,246,0.9)" : "rgba(255,255,255,0.66)"}
                    color="#755A48"
                    alignItems="center"
                    textAlign="left"
                    cursor="pointer"
                    boxShadow={isSelected ? "0 5px 14px rgba(70,127,138,0.12)" : "0 3px 10px rgba(82,59,43,0.06)"}
                    transition="transform 140ms ease, background-color 140ms ease, border-color 140ms ease"
                    _hover={{ transform: "translateX(2px)", bgColor: isSelected ? "#E0F4F6" : "white" }}
                    _active={{ transform: "scale(0.985)" }}
                    onClick={() => {
                      setSelectedChapter(chapter.phase);
                      setIsChapterModalOpen(false);
                      playGameSfx("uiDialogContinue", { volumeScale: 0.62 });
                    }}
                  >
                    <Flex
                      aria-hidden="true"
                      flex="0 0 auto"
                      w="36px"
                      h="36px"
                      borderRadius="12px"
                      bgColor={isSelected ? "#67A9B5" : "#9A7E69"}
                      color="white"
                      alignItems="center"
                      justifyContent="center"
                      fontFamily="system-ui, sans-serif"
                      fontSize="13px"
                      fontWeight="800"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </Flex>
                    <Text
                      flex="1"
                      pl="12px"
                      fontFamily="'Noto Sans TC', system-ui, sans-serif"
                      fontSize="14px"
                      fontWeight="600"
                      letterSpacing="0.05em"
                    >
                      {chapter.labels[locale]}
                    </Text>
                    <Text
                      aria-hidden="true"
                      w="23px"
                      color={isSelected ? "#4F929E" : "rgba(117,90,72,0.38)"}
                      fontSize="15px"
                      fontWeight="800"
                      textAlign="center"
                    >
                      {isSelected ? "✓" : "›"}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
        </Flex>
      ) : null}
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
  const [selectedPreview, setSelectedPreview] = useState<ExhibitionPhase | null>(initialPreview);
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

  useEffect(() => {
    if (stage === "title") setFmodGameMusicTrack("themeMusic");
  }, [stage]);

  const handleStart = async (nextPreview: ExhibitionPhase | null) => {
    if (stage !== "title") return;
    const startedAt = window.performance.now();
    setSelectedPreview(nextPreview);

    if (nextPreview) {
      const url = new URL(window.location.href);
      url.searchParams.set("preview", nextPreview);
      url.searchParams.delete("sceneStep");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }

    setStage(SHOW_EXHIBITION_LOADING_SCREEN ? "loading" : "playing");
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

    if (!SHOW_EXHIBITION_LOADING_SCREEN) return;

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

  const handleReturnToTitle = () => {
    setSelectedPreview(null);
    setStage("title");

    const url = new URL(window.location.href);
    url.searchParams.delete("preview");
    url.searchParams.delete("sceneStep");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  if (stage === "playing") {
    return (
      <ExhibitionExperienceView
        audioState={audioState}
        initialPreview={selectedPreview}
        initialSceneStep={
          selectedPreview && selectedPreview === initialPreview ? initialSceneStep : null
        }
        onReturnToTitle={handleReturnToTitle}
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
        <ExhibitionTitleScreen
          audioState={audioState}
          onStart={(phase) => void handleStart(phase)}
        />
      ) : (
        <ExhibitionLoadingScreen progress={progress} isLeaving={stage === "leaving"} />
      )}
    </Flex>
  );
}

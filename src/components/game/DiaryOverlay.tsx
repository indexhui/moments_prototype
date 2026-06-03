"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaBook, FaLocationDot, FaPaw } from "react-icons/fa6";
import { TbHandFinger } from "react-icons/tb";
import { EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { GAME_EMOTION_CUE_TRIGGER } from "@/lib/game/emotionCueBus";
import {
  FROG_ACTIVE_CLUE_TEXT,
  FROG_SUNBEAST_NAME,
} from "@/lib/game/frogVariant";
import {
  CAT_B_CLUE_TEXT,
  SUNBEAST_B_CLUE_SUMMARY_TEXT,
  isSunbeastBEventEnabled,
} from "@/lib/game/sunbeastVariant";
import { FROG_MOVING_DIARY_FRAGMENT } from "@/lib/game/frogDiaryClueFlow";
import {
  convertPhotoScoreToPoints,
  finalizeDiaryFirstRevealReward,
  getStickerRollWeightsByPoints,
  loadPlayerProgress,
  savePlayerProgress,
  rollStickerByPoints,
  type DiaryEntryId,
  type PhotoCaptureSnapshot,
  type PlayerProgress,
  type StickerId,
} from "@/lib/game/playerProgress";

type DiaryOverlayProps = {
  open: boolean;
  onClose: () => void;
  unlockedEntryIds: string[];
  mode?: DiaryOverlayMode;
  revealEntryId?: DiaryEntryId;
  initialSunbeastCardId?: string | null;
  onGuidedFlowComplete?: () => void;
  onDiaryRevealEntryComplete?: () => void;
  onSunbeastHintGuideComplete?: () => void;
  onBeigoProfileComplete?: () => void;
  onFragmentedDiaryComplete?: () => void;
  showReturnButton?: boolean;
};

export type DiaryOverlayMode =
  | "default"
  | "diary-reveal"
  | "first-photo-diary-reveal"
  | "second-photo-diary-reveal"
  | "sunbeast-chicken-reveal"
  | "sunbeast-goat-reveal"
  | "sunbeast-reveal"
  | "beigo-profile"
  | "fragmented-diary"
  | "frog-fragmented-diary"
  | "sunbeast";

const unlockPulse = keyframes`
  0% { transform: scale(0.98); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
  30% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(255, 220, 145, 0.24); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
`;

const diaryBgFloat = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(-4px, 0, 0); }
  100% { transform: translate3d(0, 0, 0); }
`;

const diaryDotDrift = keyframes`
  0% {
    background-position: 0 0, 18px 10px, 34px 22px, 4px 34px, 52px 6px, 10px 54px, 62px 30px, 28px 70px, 76px 48px, 46px 88px, 88px 12px, 6px 92px;
  }
  100% {
    background-position: -78px 72px, -80px 96px, -42px 118px, -104px 108px, -10px 96px, -104px 148px, -18px 138px, -78px 142px, -4px 126px, -62px 166px, -2px 102px, -100px 172px;
  }
`;

const fingerUpSwipe = keyframes`
  0% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
  50% { transform: translateX(-50%) translateY(-8px) rotate(180deg); opacity: 1; }
  100% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
`;

const diaryEntryPointerNudge = keyframes`
  0% { transform: translateY(-50%) translateX(-2px) rotate(90deg); opacity: 0.78; }
  50% { transform: translateY(-50%) translateX(7px) rotate(90deg); opacity: 1; }
  100% { transform: translateY(-50%) translateX(-2px) rotate(90deg); opacity: 0.78; }
`;

const polaroidStickIn = keyframes`
  0% { transform: translateY(24px) rotate(-4deg) scale(0.9); opacity: 0; }
  45% { transform: translateY(-6px) rotate(7deg) scale(1.03); opacity: 1; }
  100% { transform: translateY(0) rotate(5deg) scale(1); opacity: 1; }
`;

const firstPhotoSlideAcross = keyframes`
  0% { transform: translateX(-185px) rotate(-7deg); opacity: 0; }
  16% { opacity: 1; }
  84% { opacity: 1; }
  100% { transform: translateX(185px) rotate(6deg); opacity: 0; }
`;

const revealStageIn = keyframes`
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const diaryPanelFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const diaryTypeCursorBlink = keyframes`
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
`;

const diaryCatalogCardPop = keyframes`
  0% { transform: translateY(22px) scale(0.86); opacity: 0; }
  58% { transform: translateY(-5px) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const fragmentedDiaryFocusGlow = keyframes`
  0% { opacity: 0; transform: scale(0.88); }
  42% { opacity: 0.62; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.18); }
`;

const photoCardFloat = keyframes`
  0% { transform: rotate(-1.8deg) translateY(0); }
  50% { transform: rotate(-0.6deg) translateY(-5px); }
  100% { transform: rotate(-1.8deg) translateY(0); }
`;

const meterFill = keyframes`
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
`;

const pointPulse = keyframes`
  0% { transform: scale(0.9); opacity: 0; }
  45% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const gachaFlip = keyframes`
  0% { transform: rotateY(0deg) scale(0.92); }
  45% { transform: rotateY(180deg) scale(1.06); }
  100% { transform: rotateY(360deg) scale(1); }
`;

const rewardGlow = keyframes`
  0% { box-shadow: 0 0 0 rgba(245, 201, 91, 0); }
  50% { box-shadow: 0 0 0 10px rgba(245, 201, 91, 0.18); }
  100% { box-shadow: 0 0 0 rgba(245, 201, 91, 0); }
`;

const overlayLiftFadeOut = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-88px); opacity: 0; }
`;

const DIARY_COMIC_PAGES = [
  "/images/diary/diary_demo_01.png",
  "/images/diary/diary_demo_02.png",
  "/images/diary/diary_demo_03.png",
] as const;

const DIARY_PAGE_STRIPE_BACKGROUND =
  "repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)";

const ENABLE_SUNBEAST_GUIDANCE_SYSTEM = false;
const ENABLE_SUNBEAST_HINT_SYSTEM = false;

const BAI_ENTRY_1_VISUAL_PAGES = [
  {
    imagePath: "/images/428出圖/日記/demo_dirary_01_01.jpg",
    text: "帶著滑雪板要去滑雪，結果上捷運時，\n車門一直關不起來。",
  },
  {
    imagePath: "/images/428出圖/日記/demo_diary_01_02.jpg",
    text: "轉頭一看才發現，自己的板頭有一半露在車廂外，\n車門才會一直夾到關不起來。",
  },
] as const;

const METRO_FRAGMENT_DIARY = {
  title: "在捷運....",
  firstImagePath: BAI_ENTRY_1_VISUAL_PAGES[0].imagePath,
  firstText: "今天搭車時，大家都在看。\n我卻完全不知道發生了什麼事。",
  secondImagePath: BAI_ENTRY_1_VISUAL_PAGES[1].imagePath,
  secondText: "????",
} as const;

const NEXT_DIARY_FIRST_FRAGMENT = FROG_MOVING_DIARY_FRAGMENT;

type VisualDiaryPageItem = {
  imagePath: string;
  text: string;
  initialText?: string;
  variant?: "living-room" | "question";
  imageEffect?: "fade";
  textEffect?: "fade" | "typewriter" | "fragmented-typewriter" | "restore-completion" | "damaged-fragment";
};

function MovingDiaryIllustration({ variant = "living-room" }: { variant?: "living-room" | "question" }) {
  if (variant === "question") {
    return (
      <Flex
        h="100%"
        w="100%"
        bgColor="#EBE3DB"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#A57C58" fontSize="48px" fontWeight="700" lineHeight="1">
          ?
        </Text>
      </Flex>
    );
  }

  return <Flex h="100%" w="100%" bgColor="#EBE3DB" />;
}

function VisualDiaryPageText({
  text,
  effect,
  initialText,
}: {
  text: string;
  effect?: VisualDiaryPageItem["textEffect"];
  initialText?: string;
}) {
  const characters = useMemo(() => Array.from(text), [text]);
  const restoreInitialCharacters = useMemo(() => Array.from(initialText ?? text), [initialText, text]);
  const usesRestoreCompletion = effect === "restore-completion";
  const usesTypewriter = effect === "typewriter" || effect === "fragmented-typewriter" || usesRestoreCompletion;
  const fragmentedCharacterIndexes = useMemo(() => new Set([4, 11, 14, 21]), []);
  const restorePrefixLength = useMemo(() => {
    if (!usesRestoreCompletion) return 0;
    let index = 0;
    while (
      index < characters.length &&
      index < restoreInitialCharacters.length &&
      characters[index] === restoreInitialCharacters[index]
    ) {
      index += 1;
    }
    return index;
  }, [characters, restoreInitialCharacters, usesRestoreCompletion]);
  const restoreTargetSuffixCharacters = useMemo(
    () => characters.slice(restorePrefixLength),
    [characters, restorePrefixLength],
  );
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(
    usesTypewriter ? 0 : characters.length,
  );
  const isTyping = usesRestoreCompletion
    ? visibleCharacterCount < restoreTargetSuffixCharacters.length
    : usesTypewriter && visibleCharacterCount < characters.length;

  useEffect(() => {
    if (usesRestoreCompletion) {
      setVisibleCharacterCount(0);
      let intervalId: number | null = null;
      const startTimer = setTimeout(() => {
        intervalId = window.setInterval(() => {
          setVisibleCharacterCount((current) => {
            if (current >= restoreTargetSuffixCharacters.length) {
              if (intervalId !== null) window.clearInterval(intervalId);
              return current;
            }
            return current + 1;
          });
        }, 104);
      }, 220);

      return () => {
        clearTimeout(startTimer);
        if (intervalId !== null) window.clearInterval(intervalId);
      };
    }

    if (!usesTypewriter) {
      setVisibleCharacterCount(characters.length);
      return;
    }

    setVisibleCharacterCount(0);
    let intervalId: number | null = null;
    const startTimer = setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCharacterCount((current) => {
          if (current >= characters.length) {
            if (intervalId !== null) window.clearInterval(intervalId);
            return current;
          }
          return current + 1;
        });
      }, 34);
    }, 260);

    return () => {
      clearTimeout(startTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [characters.length, restoreTargetSuffixCharacters.length, text, usesRestoreCompletion, usesTypewriter]);

  const visibleCharacters = usesRestoreCompletion
    ? visibleCharacterCount === 0
      ? restoreInitialCharacters
      : [
          ...characters.slice(0, restorePrefixLength),
          ...restoreTargetSuffixCharacters.slice(0, visibleCharacterCount),
        ]
    : usesTypewriter
      ? characters.slice(0, visibleCharacterCount)
      : characters;
  const renderDamagedFragment = (content: string) =>
    content.split(/(\[\[[^\]]+\]\])/g).map((segment, index) => {
      const hiddenText = segment.match(/^\[\[([^\]]+)\]\]$/)?.[1];
      if (!hiddenText) return <Fragment key={`plain-${index}`}>{segment}</Fragment>;
      return (
        <Text
          key={`damaged-${index}`}
          as="span"
          display="inline-flex"
          minW={`${Math.max(2, Array.from(hiddenText).length) * 0.78}em`}
          h="0.74em"
          mx="0.03em"
          borderRadius="2px"
          bgColor="rgba(148,133,126,0.2)"
          backgroundImage="linear-gradient(90deg, rgba(255,255,255,0.18) 0 18%, transparent 18% 34%, rgba(255,255,255,0.14) 34% 46%, transparent 46% 100%)"
          backgroundSize="1.1em 100%"
          boxShadow="inset 0 -2px 0 rgba(148,133,126,0.24)"
          transform="translateY(0.08em)"
          aria-label={hiddenText}
        />
      );
    });

  return (
    <Text
      w="100%"
      color="#94857E"
      fontSize="16px"
      fontWeight="700"
      lineHeight="1.45"
      whiteSpace="pre-line"
      textAlign="left"
    >
      {effect === "damaged-fragment"
        ? renderDamagedFragment(text)
        : effect === "fragmented-typewriter"
        ? visibleCharacters.map((character, index) => {
            if (character === "\n") return <Fragment key={`line-${index}`}>{"\n"}</Fragment>;
            if (fragmentedCharacterIndexes.has(index)) {
              return (
                <Text
                  key={`${character}-${index}`}
                  as="span"
                  display="inline-block"
                  w="0.86em"
                  h="0.74em"
                  mx="0.01em"
                  borderRadius="2px"
                  bgColor="rgba(148,133,126,0.18)"
                  boxShadow="inset 0 -2px 0 rgba(148,133,126,0.22)"
                  transform="translateY(0.08em)"
                />
              );
            }
            return <Fragment key={`${character}-${index}`}>{character}</Fragment>;
          })
        : visibleCharacters.join("")}
      {isTyping ? (
        <Text
          as="span"
          color="#9D7859"
          fontWeight="800"
          animation={`${diaryTypeCursorBlink} 760ms step-end infinite`}
        >
          ▌
        </Text>
      ) : null}
    </Text>
  );
}

function VisualDiaryBookPage({
  title,
  pages,
  stagedReveal = false,
  isRevealComplete = true,
  keepSinglePageCentered = false,
  showBackButton = false,
  onBack,
  onContinue,
  continueLabel = "繼續",
  overlay,
  animateTitleChange = false,
  fadeFirstPage = false,
  rhythm = "default",
  scrollBottomPadding = 48,
}: {
  title: string;
  pages: readonly VisualDiaryPageItem[];
  stagedReveal?: boolean;
  isRevealComplete?: boolean;
  keepSinglePageCentered?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  overlay?: ReactNode;
  animateTitleChange?: boolean;
  fadeFirstPage?: boolean;
  rhythm?: "default" | "restoration";
  scrollBottomPadding?: number;
}) {
  const isOpeningStage = stagedReveal && !isRevealComplete;
  const visiblePages = isOpeningStage ? pages.slice(0, 1) : pages;
  const shouldKeepSinglePageCentered = keepSinglePageCentered && visiblePages.length === 1;
  const shouldShowContinue = !isOpeningStage && Boolean(onContinue);
  const isRestorationRhythm = rhythm === "restoration";
  const titleRevealDurationMs = isRestorationRhythm ? 460 : 320;
  const pageRevealDurationMs = isRestorationRhythm ? 680 : 520;
  const textRevealDurationMs = isRestorationRhythm ? 520 : 360;
  const scrollTransition = isRestorationRhythm
    ? "padding-top 860ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "padding-top 560ms ease";

  return (
    <Flex
      position="relative"
      h="100%"
      minH="0"
      overflow="hidden"
      bgColor="#F7F0E4"
      bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
    >
      {showBackButton ? (
        <Flex
          as="button"
          position="absolute"
          left="0"
          top="36px"
          zIndex={6}
          w="58px"
          h="38px"
          borderRadius="0 6px 6px 0"
          bgColor="#A57C58"
          alignItems="center"
          justifyContent="center"
          onClick={(event) => {
            event.stopPropagation();
            onBack?.();
          }}
        >
          <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
            ‹
          </Text>
        </Flex>
      ) : null}

      <Flex
        position="absolute"
        left="27px"
        right="0"
        top="28px"
        bottom="22px"
        direction="column"
        overflow="hidden"
        bgColor="#FFFEFC"
        border="2px solid #9D7859"
        borderRight="0"
        borderRadius="4px 0 0 4px"
        boxShadow="0 2px 0 rgba(128,105,91,0.18)"
      >
        <Flex
          h="54px"
          w="100%"
          bgColor="rgba(157,120,89,0.2)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Text
            key={animateTitleChange ? title : "static-title"}
            color="#9D7859"
            fontSize="20px"
            fontWeight="500"
            lineHeight="1"
            animation={animateTitleChange ? `${revealStageIn} ${titleRevealDurationMs}ms ease both` : undefined}
          >
            {title}
          </Text>
        </Flex>
        <Flex
          flex="1"
          minH="0"
          overflowY="auto"
          px="24px"
          pt={shouldKeepSinglePageCentered ? "100px" : isOpeningStage ? "150px" : "32px"}
          pb={`${scrollBottomPadding}px`}
          transition={scrollTransition}
          css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        >
          <Flex w="100%" direction="column" alignItems="stretch" gap="32px">
            {visiblePages.map((page, index) => (
              <Flex
                key={`${page.imagePath}-${index}`}
                direction="column"
                gap="18px"
                animation={
                  (stagedReveal && (index > 0 || fadeFirstPage)) || (!stagedReveal && index === 0)
                    ? `${revealStageIn} ${pageRevealDurationMs}ms ease both`
                    : undefined
                }
              >
                  <Flex
                    w="100%"
                    aspectRatio="577 / 362"
                    overflow="hidden"
                    border="2px solid #9D7859"
                    borderRadius="2px"
                    bgColor="#EBE3DB"
                    animation={page.imageEffect === "fade" ? `${diaryPanelFadeIn} 620ms ease both` : undefined}
                  >
                    <MovingDiaryIllustration variant={page.variant} />
                  </Flex>
                <Box
                  key={`text-${index}-${page.imagePath}`}
                  animation={page.textEffect === "fade" ? `${revealStageIn} ${textRevealDurationMs}ms ease both` : undefined}
                >
                  <VisualDiaryPageText
                    key={`${index}-${page.textEffect ?? "plain"}`}
                    text={page.text}
                    effect={page.textEffect}
                    initialText={page.initialText}
                  />
                </Box>
              </Flex>
            ))}
            {shouldShowContinue ? (
              <Flex
                justifyContent="center"
                pt={visiblePages.length > 1 ? "28px" : "8px"}
                pb="4px"
                animation={stagedReveal ? `${revealStageIn} 420ms ease both` : undefined}
              >
                <Flex
                  as="button"
                  h="56px"
                  w="228px"
                  maxW="100%"
                  px="30px"
                  borderRadius="6px"
                  bgColor="#7E6148"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 18px rgba(80,54,33,0.18)"
                  onClick={onContinue}
                >
                  <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                    {continueLabel}
                  </Text>
                </Flex>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </Flex>

      {overlay}
    </Flex>
  );
}

const STICKER_META: Record<StickerId, { title: string; subtitle: string; image: string }> = {
  "naotaro-basic": {
    title: "直太郎貼紙",
    subtitle: "元氣基本款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
  "naotaro-smile": {
    title: "直太郎貼紙",
    subtitle: "開心笑臉款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
  "naotaro-rare": {
    title: "直太郎貼紙",
    subtitle: "閃亮稀有款",
    image: "/images/428出圖/拍照動物/黃金獵犬.png",
  },
};

type DiaryReadTalkLine = {
  speaker: "小麥" | "小貝狗" | "旁白";
  text: string;
  spriteId?: "mai" | "beigo";
  frameIndex?: number;
  showName?: boolean;
};

const BAI_ENTRY_1_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "這是⋯⋯！", spriteId: "mai", frameIndex: 34 },
  { speaker: "小麥", text: "本來消失的日記內容⋯⋯浮現了！", spriteId: "mai", frameIndex: 34 },
  { speaker: "小麥", text: "小白帶著滑雪板要去滑雪，結果上捷運時，車門一直關不起來⋯⋯", spriteId: "mai", frameIndex: 18 },
  { speaker: "小麥", text: "原來是自己的板頭有一半露在車廂外，車門才會一直夾到關不起來。", spriteId: "mai", frameIndex: 18 },
  { speaker: "小麥", text: "這真的好像剛剛那隻傻乎乎的黃金獵犬，也很像小白。", spriteId: "mai", frameIndex: 18 },
  { speaker: "旁白", text: "小貝狗拍打著日記本上的黃金獵犬，口裡重複著「小日獸」這個詞。", showName: false },
  { speaker: "小貝狗", text: "小日獸！小日獸！", spriteId: "beigo", frameIndex: 0, showName: true },
  { speaker: "小麥", text: "小日獸⋯⋯是指這隻被吸進去日記本的黃金獵犬嗎？", spriteId: "mai", frameIndex: 36 },
  { speaker: "旁白", text: "小麥看了看日記本剩下空白的頁面，終於恍然大悟。", showName: false },
  { speaker: "小麥", text: "難不成⋯⋯日記本會變成一片空白，是因為上面的「小日獸」跑了出來？", spriteId: "mai", frameIndex: 38 },
  { speaker: "小麥", text: "小白的異狀，一定跟這本日記本有關吧。", spriteId: "mai", frameIndex: 38 },
  { speaker: "小麥", text: "那只要將這些日記片段搜集回來，小白就會醒來了⋯⋯？", spriteId: "mai", frameIndex: 8 },
  { speaker: "小貝狗", text: "嗷～～嗷！嗷嗷！", spriteId: "beigo", frameIndex: 1 },
];

const NEXT_DIARY_CATALOG_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "第二則日記顯現出來了。", spriteId: "mai", frameIndex: 34 },
];

const INCOMPLETE_DIARY_REACTION_LINE: DiaryReadTalkLine = {
  speaker: "小麥",
  text: "但一樣是不完整的呀",
  spriteId: "mai",
  frameIndex: 36,
};

const BAI_ENTRY_2_A_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "噗……這真的很像小白會做的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "明明只是去便利商店買東西，還能認錯人，對著別人的背影講一大串。", spriteId: "mai", frameIndex: 2 },
  { speaker: "小麥", text: "等對方一轉頭，發現認錯人之後，她一定整個腦袋空白吧。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "最後居然只會丟下一句「哇……哇……！」就跑走，真的太有畫面了。", spriteId: "mai", frameIndex: 1 },
  { speaker: "小麥", text: "我突然想起那次租車旅行，她還認錯車，直接去拉別人的車門。", spriteId: "mai", frameIndex: 4 },
  { speaker: "小麥", text: "小白總是這樣，每次都少一根筋，鬧出一堆讓人又好氣又想笑的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "……那時候，我們偶爾還會一起去旅行呢。", spriteId: "mai", frameIndex: 8 },
];

const BAI_ENTRY_2_B_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "噗……這真的很像小白會做的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "以為飲料是我買給她的，就在搬家公司員工面前全部喝光，還大聲稱讚很好喝。", spriteId: "mai", frameIndex: 2 },
  { speaker: "小麥", text: "結果那其實是搬家工人買給自己的飲料……她一定尷尬到只想原地消失吧。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "我突然想起那次租車旅行，她還認錯車，跑去拉別人的車門，一邊拉還一邊跟對方聊天。", spriteId: "mai", frameIndex: 4 },
  { speaker: "小麥", text: "小白總是這樣，每次都少一根筋，鬧出一堆尷尬事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "同居以前，我們偶爾還會一起去旅行呢……", spriteId: "mai", frameIndex: 8 },
  { speaker: "小麥", text: "我也好不到哪裡去，因為臉盲，常常把別人的名字叫錯或認錯人，每次都羞得滿臉通紅。", spriteId: "mai", frameIndex: 10 },
];

const BAI_ENTRY_2_READ_TALK_LINES = isSunbeastBEventEnabled()
  ? BAI_ENTRY_2_B_READ_TALK_LINES
  : BAI_ENTRY_2_A_READ_TALK_LINES;

const BAI_ENTRY_3_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "……她到底在高興什麼啊。", spriteId: "mai", frameIndex: 23 },
  { speaker: "小麥", text: "一整天沒吃飯，還覺得省伙食費又可以減肥，這哪裡不壞了？", spriteId: "mai", frameIndex: 21 },
  { speaker: "小麥", text: "每次小白廢寢忘食，我都怕她營養不良，把身體搞壞。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "而且她一忙起來，垃圾、碗盤，還有該做的事也常常全都忘在一旁。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "每次都要人家操心她，本人卻完全不自覺！", spriteId: "mai", frameIndex: 22 },
  { speaker: "小麥", text: "妳倒是快點醒來呀……別讓我再操心妳了……", spriteId: "mai", frameIndex: 8 },
];

const BAI_ENTRY_4_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "……小白什麼時候變得這麼有稜角了？", spriteId: "mai", frameIndex: 23 },
  { speaker: "小麥", text: "印象中她以前都是不會跟人爭執、會把氣氛擺在前面的那種人。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "可是這篇看下來，她不僅沒有後悔，反而還有點得意？", spriteId: "mai", frameIndex: 21 },
  { speaker: "小麥", text: "「跩跩的」聽起來真的有點欠揍啦。", spriteId: "mai", frameIndex: 22 },
  { speaker: "小麥", text: "不過⋯⋯能堅持自己想法的人，其實也滿帥的。", spriteId: "mai", frameIndex: 8 },
  { speaker: "小麥", text: "希望妳醒來之後，也能繼續這樣有自己的稜角啊。", spriteId: "mai", frameIndex: 3 },
];

const BAI_ENTRY_1_BODY_LINES = [
  "小白帶著滑雪板要去滑雪，結果上捷運時，車門一直關不起來。",
  "小白轉頭一看才發現，自己的板頭有一半露在車廂外。",
  "原來車門才會一直夾到關不起來。",
] as const;

const BAI_ENTRY_2_B_BODY_LINES = [
  "今天和小麥請了搬家公司搬家，整理到一半時，我看到客廳有一杯便利商店買回來的手搖，還以為是小麥買給我的。",
  "我想都沒想就全部喝掉，還在小麥和搬家公司員工面前大聲稱讚飲料很好喝。",
  "結果那杯飲料是搬家工人買來給自己喝的。發現真相的瞬間，我覺得不知情還大聲嚷嚷的自己，又尷尬又像一隻呆叫的青蛙。",
] as const;

const BAI_ENTRY_2_BODY_LINES = BAI_ENTRY_2_B_BODY_LINES;

const BAI_ENTRY_3_BODY_LINES = [
  "今天太認真工作，回過神來才發現已經晚上了。",
  "我居然一整天都忘了吃飯，難怪肚子一直咕嚕咕嚕叫。",
  "不過這樣好像省了一餐伙食費，還可以順便減肥，似乎也不壞？",
] as const;

const BAI_ENTRY_4_BODY_LINES = [
  "今天的會議又演變成我一個人跟所有人對著幹的局面。",
  "明明知道附和一下就能省事，可是我就是說不出那種違心的話。",
  "事後同事跟我說「妳這樣有點欠揍欸」，可我反而覺得有點得意？",
] as const;

type SunbeastCollectionState = "discovered" | "hint" | "unknown";
type SunbeastView = "collection" | "detail-naotaro" | "detail-chicken" | "detail-unknown";
type SunbeastDetailRevealStep =
  | "idle"
  | "dialog"
  | "unlock-intro"
  | "unlock-diary"
  | "unlock-street"
  | "unlock-clues"
  | "unlock-outro"
  | "complete";
type FragmentedDiaryStage = "enter" | "first" | "second" | "ready";

type SunbeastCollectionCard = {
  id: string;
  name: string;
  state: SunbeastCollectionState;
  imagePath?: string;
  isClickable?: boolean;
};
type GuidedSunbeastHintId = "frog" | "chicken";

const SUNBEAST_FILTERS = [
  { id: "all", label: "全部" },
  { id: "discovered", label: "已發現" },
  { id: "hint", label: "有線索" },
  { id: "unknown", label: "未知" },
] as const;

const FROG_IMAGE_PATH = "/images/animals/青蛙.png";
const FROG_SHADOW_IMAGE_PATH = "/images/animals/青蛙_剪影.png";
const ROOSTER_IMAGE_PATH = "/images/animals/公雞.png";
const ROOSTER_SHADOW_IMAGE_PATH = "/images/animals/公雞_剪影.png";

type SunbeastFilterId = (typeof SUNBEAST_FILTERS)[number]["id"];

function buildSunbeastCollectionCards(progress: PlayerProgress | null): SunbeastCollectionCard[] {
  const hasNaotaro = Boolean(progress?.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-")));
  const hasFrog = Boolean(progress?.hasCompletedStreetForgotLunchFrogEvent);
  const hasFrogHint = ENABLE_SUNBEAST_HINT_SYSTEM && Boolean(progress?.hasUnlockedSunbeastFrogHint);
  const hasChicken = Boolean(progress?.hasTriggeredOfficeSunbeastChickenEvent);
  const hasChickenHint =
    ENABLE_SUNBEAST_HINT_SYSTEM &&
    (Boolean(progress?.hasUnlockedSunbeastChickenHint) || Boolean(progress?.hasUnlockedSpecialMap));
  const hasCat = Boolean(progress?.hasTriggeredBusSunbeastCatEvent);
  const hasCatHint = ENABLE_SUNBEAST_HINT_SYSTEM && isSunbeastBEventEnabled();
  const hasGoat = Boolean(progress?.hasTriggeredOfficeSunbeastGoatEvent);
  const hasGoatHint =
    ENABLE_SUNBEAST_HINT_SYSTEM && Boolean(progress?.hasCompletedStreetForgotLunchFrogEvent);

  return [
    {
      id: "naotaro",
      name: hasNaotaro ? "直太郎" : "???",
      state: hasNaotaro ? "discovered" : "unknown",
      imagePath: hasNaotaro ? "/images/428出圖/拍照動物/黃金獵犬.png" : undefined,
      isClickable: true,
    },
    {
      id: "frog",
      name: hasFrog || hasFrogHint ? FROG_SUNBEAST_NAME : "???",
      state: hasFrog ? "discovered" : hasFrogHint ? "hint" : "unknown",
      imagePath: hasFrog ? FROG_IMAGE_PATH : hasFrogHint ? FROG_SHADOW_IMAGE_PATH : undefined,
      isClickable: ENABLE_SUNBEAST_HINT_SYSTEM && (hasFrog || hasFrogHint),
    },
    {
      id: "chicken",
      name: hasChicken ? "公雞" : "???",
      state: hasChicken ? "discovered" : hasChickenHint ? "hint" : "unknown",
      imagePath: hasChicken ? ROOSTER_IMAGE_PATH : hasChickenHint ? ROOSTER_SHADOW_IMAGE_PATH : undefined,
      isClickable: hasChicken || (ENABLE_SUNBEAST_HINT_SYSTEM && hasChickenHint),
    },
    {
      id: "cat",
      name: hasCat ? "貓" : "???",
      state: hasCat ? "discovered" : hasCatHint ? "hint" : "unknown",
      imagePath: hasCat ? "/images/animals/demo_cat.png" : hasCatHint ? "/images/animals/demo_cat_shadow.png" : undefined,
      isClickable: ENABLE_SUNBEAST_HINT_SYSTEM && (hasCat || hasCatHint),
    },
    {
      id: "goat",
      name: hasGoat ? "山羊" : "???",
      state: hasGoat ? "discovered" : hasGoatHint ? "hint" : "unknown",
      imagePath: hasGoat ? "/animals/goat.png" : hasGoatHint ? "/animals/goat_shadow.png" : undefined,
      isClickable: ENABLE_SUNBEAST_HINT_SYSTEM && (hasGoat || hasGoatHint),
    },
    ...Array.from({ length: 7 }, (_, index) => ({
      id: `unknown-${index + 1}`,
      name: "???",
      state: "unknown" as const,
      isClickable: false,
    })),
  ];
}

function getSunbeastDetailView(card: SunbeastCollectionCard): SunbeastView {
  if (card.id === "naotaro" && card.state === "discovered") return "detail-naotaro";
  if (card.id === "chicken" && card.state === "discovered") return "detail-chicken";
  return "detail-unknown";
}

const SUNBEAST_HINT_DETAIL_CONTENT: Record<string, { imagePath: string }> = {
  frog: {
    imagePath: FROG_SHADOW_IMAGE_PATH,
  },
  chicken: {
    imagePath: ROOSTER_SHADOW_IMAGE_PATH,
  },
  cat: {
    imagePath: "/images/animals/demo_cat_shadow.png",
  },
  goat: {
    imagePath: "/animals/goat_shadow.png",
  },
};

const SUNBEAST_HINT_PLACE_ICON_PATHS: Record<string, string> = {
  街道: "/images/icon/street.png",
  便利商店: "/images/icon/mart.png",
  轉角的公車: "/images/icon/road.png",
};

type SunbeastDetailInfoKind = "journal" | "place" | "clue";

const MAI_THINKING_FRAME_INDICES = {
  thinking1: 36,
  thinking2: 37,
} as const;
type MaiThinkingFrameIndex =
  (typeof MAI_THINKING_FRAME_INDICES)[keyof typeof MAI_THINKING_FRAME_INDICES];

const SUNBEAST_DETAIL_INFO = [
  {
    kind: "journal",
    eyebrow: "相關的日記",
    body: "滑雪板上捷運時闖了點小禍，傻乎乎的樣子似乎跟直太郎很像。",
    action: "閱讀",
  },
  {
    kind: "place",
    eyebrow: "新的地點",
    body: "街道，是直太郎很喜歡在街道散步。下次安排經過吧！",
    action: "查看",
  },
  {
    kind: "clue",
    eyebrow: "小日獸行蹤",
    body: isSunbeastBEventEnabled() ? SUNBEAST_B_CLUE_SUMMARY_TEXT : FROG_ACTIVE_CLUE_TEXT,
    action: "查看",
  },
] as const satisfies Array<{
  kind: SunbeastDetailInfoKind;
  eyebrow: string;
  body: string;
  action: string;
}>;

function SunbeastInfoIcon({ kind }: { kind: SunbeastDetailInfoKind }) {
  if (kind === "journal") return <FaBook />;
  if (kind === "place") return <FaLocationDot />;
  return <FaPaw />;
}

export function DiaryOverlay({
  open,
  onClose,
  unlockedEntryIds,
  mode = "default",
  revealEntryId = "bai-entry-1",
  initialSunbeastCardId = null,
  onGuidedFlowComplete,
  onDiaryRevealEntryComplete,
  onSunbeastHintGuideComplete,
  onBeigoProfileComplete,
  onFragmentedDiaryComplete,
  showReturnButton = false,
}: DiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "sunbeast">("journal");
  const [journalView, setJournalView] = useState<
    "list" | "entry-bai-1" | "entry-bai-2-fragment" | "entry-bai-2" | "entry-bai-3" | "entry-bai-4"
  >("list");
  const [baiEntry1VisualPageIndex, setBaiEntry1VisualPageIndex] = useState<0 | 1>(0);
  const [isBaiEntry1TitleRevealed, setIsBaiEntry1TitleRevealed] = useState(false);
  const [isBaiEntry1FirstTextRevealed, setIsBaiEntry1FirstTextRevealed] = useState(false);
  const [isBaiEntry1NaotaroOpenReveal, setIsBaiEntry1NaotaroOpenReveal] = useState(false);
  const [isComicReadMode, setIsComicReadMode] = useState(false);
  const [isComicControlsVisible, setIsComicControlsVisible] = useState(false);
  const [showComicReadHint, setShowComicReadHint] = useState(false);
  const [hasShownComicReadHint, setHasShownComicReadHint] = useState(false);
  const [comicPageIndex, setComicPageIndex] = useState(0);
  const [isDiaryReadTalkVisible, setIsDiaryReadTalkVisible] = useState(false);
  const [diaryReadTalkIndex, setDiaryReadTalkIndex] = useState(0);
  const [isNextDiaryFragmentPreviewVisible, setIsNextDiaryFragmentPreviewVisible] = useState(false);
  const [nextDiaryCatalogRevealStage, setNextDiaryCatalogRevealStage] =
    useState<"idle" | "revealing" | "ready" | "talked">("idle");
  const [nextDiaryCatalogTalkIndex, setNextDiaryCatalogTalkIndex] = useState<number | null>(null);
  const [isIncompleteDiaryReactionVisible, setIsIncompleteDiaryReactionVisible] = useState(false);
  const [diaryRevealStep, setDiaryRevealStep] = useState<"idle" | "book" | "unlocking" | "ready">("idle");
  const [fragmentedDiaryStage, setFragmentedDiaryStage] = useState<FragmentedDiaryStage>("enter");
  const [firstPhotoDiaryStage, setFirstPhotoDiaryStage] = useState<"idle" | "photo-slide">("idle");
  const [stickerCollection, setStickerCollection] = useState<StickerId[]>([]);
  const [sunbeastIntroStep, setSunbeastIntroStep] = useState<0 | 1 | null>(null);
  const [sunbeastFirstRevealPhase, setSunbeastFirstRevealPhase] = useState<
    "idle" | "questions" | "naotaro" | "done"
  >("idle");
  const [sunbeastFirstRevealQuestionCount, setSunbeastFirstRevealQuestionCount] = useState(0);
  const [introStage, setIntroStage] = useState<
    "none" | "photo" | "score" | "points" | "gacha" | "result"
  >("none");
  const [introReward, setIntroReward] = useState<{
    score: number;
    points: number;
    stickerId: StickerId;
    isNewSticker: boolean;
    weights: { basic: number; smile: number; rare: number };
  } | null>(null);
  const [latestPhotoSnapshot, setLatestPhotoSnapshot] = useState<PhotoCaptureSnapshot | null>(null);
  const [sunbeastProgress, setSunbeastProgress] = useState<PlayerProgress | null>(null);
  const [sunbeastView, setSunbeastView] = useState<SunbeastView>("collection");
  const [selectedSunbeastCardId, setSelectedSunbeastCardId] = useState<string | null>(null);
  const [sunbeastDetailRevealStep, setSunbeastDetailRevealStep] = useState<SunbeastDetailRevealStep>("idle");
  const [isSunbeastHintTalkVisible, setIsSunbeastHintTalkVisible] = useState(false);
  const [sunbeastHintTalkStep, setSunbeastHintTalkStep] = useState<0 | 1>(0);
  const [sunbeastHintTalkFrameIndex, setSunbeastHintTalkFrameIndex] = useState<MaiThinkingFrameIndex>(
    MAI_THINKING_FRAME_INDICES.thinking1,
  );
  const [isSunbeastShadowGuideVisible, setIsSunbeastShadowGuideVisible] = useState(false);
  const [sunbeastShadowGuideStep, setSunbeastShadowGuideStep] = useState<0 | 1 | 2>(0);
  const [sunbeastShadowGuideTargetId, setSunbeastShadowGuideTargetId] =
    useState<GuidedSunbeastHintId>("frog");
  const [activeGuidedSunbeastHintId, setActiveGuidedSunbeastHintId] =
    useState<GuidedSunbeastHintId | null>(null);
  const [activeSunbeastDetailTab, setActiveSunbeastDetailTab] =
    useState<SunbeastDetailInfoKind>("journal");
  const [activeSunbeastFilter, setActiveSunbeastFilter] = useState<SunbeastFilterId>("all");
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sunbeastRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unlockFxTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comicHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comicScrollRef = useRef<HTMLDivElement | null>(null);
  const sunbeastDetailScrollRef = useRef<HTMLDivElement | null>(null);
  const sunbeastSpotlightRootRef = useRef<HTMLDivElement | null>(null);
  const sunbeastCollectionRootRef = useRef<HTMLDivElement | null>(null);
  const sunbeastCardRefs = useRef<Record<string, HTMLElement | null>>({});
  const hasPlayedSunbeastHeartRef = useRef(false);
  const [sunbeastShadowTargetRect, setSunbeastShadowTargetRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [sunbeastSpotlightSize, setSunbeastSpotlightSize] = useState({
    width: 0,
    height: 0,
  });
  const [journalUnlockFxStage, setJournalUnlockFxStage] = useState<
    "idle" | "locked" | "unlocking" | "done"
  >("idle");
  const measureSunbeastShadowTarget = () => {
    const root = sunbeastSpotlightRootRef.current;
    const target =
      root?.querySelector<HTMLElement>(
        `[data-sunbeast-card-id="${sunbeastShadowGuideTargetId}"]`,
      ) ?? sunbeastCardRefs.current[sunbeastShadowGuideTargetId];
    if (!root || !target) return false;

    const rootRect = root.getBoundingClientRect();
    setSunbeastSpotlightSize((prev) => {
      if (
        Math.abs(prev.width - rootRect.width) < 0.5 &&
        Math.abs(prev.height - rootRect.height) < 0.5
      ) {
        return prev;
      }
      return { width: rootRect.width, height: rootRect.height };
    });
    const targetRect = target.getBoundingClientRect();
    if (targetRect.width <= 0 || targetRect.height <= 0) return false;

    const nextRect = {
      left: targetRect.left - rootRect.left,
      top: targetRect.top - rootRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
    setSunbeastShadowTargetRect((prev) => {
      if (
        prev &&
        Math.abs(prev.left - nextRect.left) < 0.5 &&
        Math.abs(prev.top - nextRect.top) < 0.5 &&
        Math.abs(prev.width - nextRect.width) < 0.5 &&
        Math.abs(prev.height - nextRect.height) < 0.5
      ) {
        return prev;
      }
      return nextRect;
    });
    return true;
  };
  const isDiaryRevealMode = mode === "diary-reveal";
  const isFirstPhotoDiaryRevealMode = mode === "first-photo-diary-reveal";
  const isSecondPhotoDiaryRevealMode = mode === "second-photo-diary-reveal";
  const isChickenPhotoDiaryRevealMode = mode === "sunbeast-chicken-reveal";
  const isGoatPhotoDiaryRevealMode = mode === "sunbeast-goat-reveal";
  const isPhotoDiaryRevealMode =
    isFirstPhotoDiaryRevealMode || isSecondPhotoDiaryRevealMode || isGoatPhotoDiaryRevealMode;
  const isSunbeastRevealMode = mode === "sunbeast-reveal";
  const isSunbeastDirectMode = mode === "sunbeast";
  const isBeigoProfileMode = mode === "beigo-profile";
  const isFragmentedDiaryMode = mode === "fragmented-diary";
  const isFrogFragmentedDiaryMode = mode === "frog-fragmented-diary";
  const isAnyFragmentedDiaryMode = isFragmentedDiaryMode || isFrogFragmentedDiaryMode;
  const isSunbeastGuidedMode = isSunbeastRevealMode || isFirstPhotoDiaryRevealMode || isChickenPhotoDiaryRevealMode;
  const isGuidedJournalRevealMode =
    isDiaryRevealMode ||
    isFirstPhotoDiaryRevealMode ||
    isSecondPhotoDiaryRevealMode ||
    isChickenPhotoDiaryRevealMode ||
    isGoatPhotoDiaryRevealMode;
  const hasBaiEntry1 = unlockedEntryIds.includes("bai-entry-1");
  const hasBaiEntry2 = unlockedEntryIds.includes("bai-entry-2");
  const hasBaiEntry3 = unlockedEntryIds.includes("bai-entry-3");
  const hasBaiEntry4 = unlockedEntryIds.includes("bai-entry-4");
  const hasBaiEntry2SecondFragment = Boolean(sunbeastProgress?.hasUnlockedBaiEntry2SecondFragment);
  const isBaiEntry2FragmentOpen = hasBaiEntry1 && !hasBaiEntry2;
  const shouldUseFigmaJournalShell = (!isComicReadMode && activeTab === "journal") || isAnyFragmentedDiaryMode;
  const shouldUseSunbeastShell = activeTab === "sunbeast" || isBeigoProfileMode;
  const isJournalEntryGuideActive =
    isGuidedJournalRevealMode &&
    journalView === "list" &&
    diaryRevealStep === "ready" &&
    journalUnlockFxStage === "done";
  const activeDiaryReadTalkLines =
    journalView === "entry-bai-4"
      ? BAI_ENTRY_4_READ_TALK_LINES
      : journalView === "entry-bai-3"
        ? BAI_ENTRY_3_READ_TALK_LINES
        : journalView === "entry-bai-2"
          ? BAI_ENTRY_2_READ_TALK_LINES
          : BAI_ENTRY_1_READ_TALK_LINES;
  const effectivePhotoSnapshot = latestPhotoSnapshot ?? {
    sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
    dogCoveragePercent: 90,
    // 測試假資料：對齊黃金獵犬所在區域，方便驗收取景還原
    cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
    capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
    capturedAt: new Date().toISOString(),
  };
  const currentPhotoScore = Math.max(0, Math.min(100, Math.floor(effectivePhotoSnapshot.dogCoveragePercent)));
  const currentPhotoPoints = introReward?.points ?? convertPhotoScoreToPoints(currentPhotoScore);
  const currentStickerMeta = STICKER_META[introReward?.stickerId ?? "naotaro-basic"];
  const clearIntroTimers = () => {
    introTimersRef.current.forEach((timer) => clearTimeout(timer));
    introTimersRef.current = [];
  };

  const clearUnlockFxTimers = () => {
    unlockFxTimersRef.current.forEach((timer) => clearTimeout(timer));
    unlockFxTimersRef.current = [];
  };
  const clearSunbeastRevealTimers = () => {
    sunbeastRevealTimersRef.current.forEach((timer) => clearTimeout(timer));
    sunbeastRevealTimersRef.current = [];
  };
  const clearComicHintTimer = () => {
    if (!comicHintTimerRef.current) return;
    clearTimeout(comicHintTimerRef.current);
    comicHintTimerRef.current = null;
  };

  const startJournalUnlockFx = () => {
    clearUnlockFxTimers();
    setJournalUnlockFxStage("locked");
    unlockFxTimersRef.current.push(
      setTimeout(() => {
        setJournalUnlockFxStage("unlocking");
      }, 360),
    );
    unlockFxTimersRef.current.push(
      setTimeout(() => {
        setJournalUnlockFxStage("done");
      }, 980),
    );
  };

  const scrollToComicPage = (nextIndex: number) => {
    const scroller = comicScrollRef.current;
    if (!scroller) return;
    const safeIndex = Math.max(0, Math.min(DIARY_COMIC_PAGES.length - 1, nextIndex));
    const pages = Array.from(scroller.children) as HTMLElement[];
    const target = pages[safeIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setComicPageIndex(safeIndex);
  };

  const getCurrentComicPageIndex = () => {
    const scroller = comicScrollRef.current;
    if (!scroller) return comicPageIndex;
    const pageHeight = Math.max(1, scroller.clientHeight);
    return Math.max(
      0,
      Math.min(
        DIARY_COMIC_PAGES.length - 1,
        Math.round(scroller.scrollTop / pageHeight),
      ),
    );
  };

  const handleComicScroll = () => {
    const scroller = comicScrollRef.current;
    if (!scroller) return;
    if (showComicReadHint) setShowComicReadHint(false);
    const nextIndex = getCurrentComicPageIndex();
    setComicPageIndex(nextIndex);
    const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const isNearBottom = maxScrollTop > 0 && scroller.scrollTop >= maxScrollTop - 20;
    if (isNearBottom && !isDiaryReadTalkVisible) {
      setIsComicControlsVisible(true);
    }
  };

  const advanceDiaryReadTalk = useCallback(() => {
    if (diaryReadTalkIndex >= activeDiaryReadTalkLines.length - 1) {
      setIsDiaryReadTalkVisible(false);
      setDiaryReadTalkIndex(0);
      if (isComicReadMode) {
        setIsComicReadMode(false);
        setIsComicControlsVisible(false);
        setComicPageIndex(0);
        onGuidedFlowComplete?.();
        return;
      }
      if (isFirstPhotoDiaryRevealMode && journalView === "entry-bai-1") {
        setJournalView("list");
        setNextDiaryCatalogRevealStage("revealing");
        setNextDiaryCatalogTalkIndex(null);
        return;
      }
      if (isGuidedJournalRevealMode) {
        onDiaryRevealEntryComplete?.();
      }
      return;
    }
    setDiaryReadTalkIndex((prev) => prev + 1);
  }, [
    activeDiaryReadTalkLines.length,
    diaryReadTalkIndex,
    isFirstPhotoDiaryRevealMode,
    isComicReadMode,
    isGuidedJournalRevealMode,
    journalView,
    onDiaryRevealEntryComplete,
    onGuidedFlowComplete,
  ]);

  const completeNextDiaryFragmentPreview = useCallback(() => {
    setIsNextDiaryFragmentPreviewVisible(false);
    onDiaryRevealEntryComplete?.();
  }, [onDiaryRevealEntryComplete]);

  const advanceNextDiaryCatalogTalk = useCallback(() => {
    setNextDiaryCatalogTalkIndex((current) => {
      if (current === null) return current;
      if (current >= NEXT_DIARY_CATALOG_TALK_LINES.length - 1) return null;
      return current + 1;
    });
  }, []);

  const startDiaryRevealAfterPhoto = () => {
    setIntroStage("score");
  };

  const goToPointsStage = () => {
    const score = effectivePhotoSnapshot.dogCoveragePercent;
    const points = convertPhotoScoreToPoints(score);
    setIntroReward({
      score,
      points,
      stickerId: "naotaro-basic",
      isNewSticker: false,
      weights: getStickerRollWeightsByPoints(points),
    });
    setIntroStage("points");
  };

  const runGacha = () => {
    if (!introReward) return;
    setIntroStage("gacha");
    clearIntroTimers();
    introTimersRef.current.push(
      setTimeout(() => {
        const stickerId = rollStickerByPoints(introReward.points);
        setIntroReward((prev) =>
          prev
            ? {
                ...prev,
                stickerId,
                isNewSticker: !stickerCollection.includes(stickerId),
              }
            : prev,
        );
        setIntroStage("result");
      }, 950),
    );
  };

  const collectReward = () => {
    if (!introReward) return;
    const before = loadPlayerProgress();
    const result = finalizeDiaryFirstRevealReward(introReward.stickerId);
    setIntroReward((prev) => (prev ? { ...prev, isNewSticker: result.isNewSticker } : prev));
    const next = loadPlayerProgress();
    setStickerCollection(next.stickerCollection);
    setSunbeastProgress(next);
    setActiveTab("sunbeast");
    setSunbeastView("collection");
    if (before.hasSeenSunbeastFirstReveal) {
      setSunbeastFirstRevealPhase("done");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
    } else {
      setSunbeastFirstRevealPhase("questions");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
    }
    setIntroStage("none");
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    clearComicHintTimer();
    setActiveTab(isSunbeastRevealMode || isSunbeastDirectMode || isChickenPhotoDiaryRevealMode || isBeigoProfileMode ? "sunbeast" : "journal");
    setJournalView("list");
    setBaiEntry1VisualPageIndex(0);
    setIsBaiEntry1TitleRevealed(false);
    setIsBaiEntry1FirstTextRevealed(false);
    setIsBaiEntry1NaotaroOpenReveal(false);
    setIsComicReadMode(false);
    setIsComicControlsVisible(false);
    setShowComicReadHint(false);
    setHasShownComicReadHint(false);
    setComicPageIndex(0);
    setIsDiaryReadTalkVisible(false);
    setDiaryReadTalkIndex(0);
    setIsNextDiaryFragmentPreviewVisible(false);
    setNextDiaryCatalogRevealStage("idle");
    setNextDiaryCatalogTalkIndex(null);
    setIsIncompleteDiaryReactionVisible(false);
    setDiaryRevealStep(isGuidedJournalRevealMode ? "book" : "idle");
    setFragmentedDiaryStage("enter");
    setFirstPhotoDiaryStage("idle");
    setSunbeastIntroStep(null);
    setSunbeastFirstRevealPhase("idle");
    setSunbeastFirstRevealQuestionCount(0);
    setSunbeastView(initialSunbeastCardId === "chicken" ? "detail-chicken" : "collection");
    setSelectedSunbeastCardId(initialSunbeastCardId);
    setSunbeastDetailRevealStep(initialSunbeastCardId === "chicken" && isChickenPhotoDiaryRevealMode ? "dialog" : "idle");
    setIsSunbeastShadowGuideVisible(false);
    setSunbeastShadowGuideStep(0);
    setSunbeastShadowGuideTargetId("frog");
    setActiveGuidedSunbeastHintId(null);
    setActiveSunbeastDetailTab("journal");
    setActiveSunbeastFilter("all");
    hasPlayedSunbeastHeartRef.current = false;
    setJournalUnlockFxStage("idle");
    if (isFirstPhotoDiaryRevealMode) {
      finalizeDiaryFirstRevealReward("naotaro-basic");
      const next = loadPlayerProgress();
      setStickerCollection(next.stickerCollection);
      setSunbeastProgress(next);
    }
  }, [hasBaiEntry1, initialSunbeastCardId, isBeigoProfileMode, isChickenPhotoDiaryRevealMode, isAnyFragmentedDiaryMode, isFirstPhotoDiaryRevealMode, isGuidedJournalRevealMode, isSunbeastDirectMode, isSunbeastRevealMode, open]);

  useEffect(() => {
    if (!open) return;
    if (!isAnyFragmentedDiaryMode) return;
    setFragmentedDiaryStage("enter");
    const shouldRevealSecondFragment = !isFragmentedDiaryMode && hasBaiEntry2SecondFragment;
    const singleFragmentReadyDelay = isFragmentedDiaryMode ? 1900 : 1280;
    const timers = shouldRevealSecondFragment
      ? [
          setTimeout(() => setFragmentedDiaryStage("first"), 180),
          setTimeout(() => setFragmentedDiaryStage("second"), 1280),
          setTimeout(() => setFragmentedDiaryStage("ready"), 2400),
        ]
      : [
          setTimeout(() => setFragmentedDiaryStage("first"), 180),
          setTimeout(() => setFragmentedDiaryStage("ready"), singleFragmentReadyDelay),
        ];
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [hasBaiEntry2SecondFragment, isAnyFragmentedDiaryMode, isFragmentedDiaryMode, open]);

  useEffect(() => {
    if (!open) return;
    if (!isFirstPhotoDiaryRevealMode) return;
    if (journalView !== "list") return;
    if (nextDiaryCatalogRevealStage !== "revealing") return;
    const readyTimer = setTimeout(() => {
      setNextDiaryCatalogRevealStage("ready");
    }, 760);
    return () => {
      clearTimeout(readyTimer);
    };
  }, [isFirstPhotoDiaryRevealMode, journalView, nextDiaryCatalogRevealStage, open]);

  useEffect(() => {
    if (!open) return;
    if (!isFirstPhotoDiaryRevealMode) return;
    if (journalView !== "list") return;
    if (nextDiaryCatalogRevealStage !== "ready") return;
    const talkTimer = setTimeout(() => {
      setNextDiaryCatalogTalkIndex(0);
      setNextDiaryCatalogRevealStage("talked");
    }, 520);
    return () => {
      clearTimeout(talkTimer);
    };
  }, [isFirstPhotoDiaryRevealMode, journalView, nextDiaryCatalogRevealStage, open]);

  useEffect(() => {
    if (!open) return;
    if (journalView !== "entry-bai-1") return;
    if (!isFirstPhotoDiaryRevealMode && !isBaiEntry1NaotaroOpenReveal) return;
    setBaiEntry1VisualPageIndex(0);
    setIsBaiEntry1TitleRevealed(false);
    setIsBaiEntry1FirstTextRevealed(false);
    const firstTextRevealTimer = isBaiEntry1NaotaroOpenReveal
      ? setTimeout(() => {
          setIsBaiEntry1FirstTextRevealed(true);
        }, 1280)
      : null;
    const revealTimer = setTimeout(() => {
      setBaiEntry1VisualPageIndex(1);
    }, isBaiEntry1NaotaroOpenReveal ? 2850 : 1000);
    return () => {
      if (firstTextRevealTimer) clearTimeout(firstTextRevealTimer);
      clearTimeout(revealTimer);
    };
  }, [isBaiEntry1NaotaroOpenReveal, isFirstPhotoDiaryRevealMode, journalView, open]);

  useEffect(() => {
    if (!open) return;
    if (!isBaiEntry1NaotaroOpenReveal) return;
    if (journalView !== "entry-bai-1") return;
    if (baiEntry1VisualPageIndex !== 1) return;
    if (isBaiEntry1TitleRevealed) return;
    const titleTimer = setTimeout(() => {
      setIsBaiEntry1TitleRevealed(true);
    }, 920);
    return () => clearTimeout(titleTimer);
  }, [
    baiEntry1VisualPageIndex,
    isBaiEntry1NaotaroOpenReveal,
    isBaiEntry1TitleRevealed,
    journalView,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isBaiEntry1NaotaroOpenReveal) return;
    if (journalView !== "entry-bai-1") return;
    if (baiEntry1VisualPageIndex !== 1) return;
    if (!isBaiEntry1TitleRevealed) return;
    if (isDiaryReadTalkVisible) return;
    const talkTimer = setTimeout(() => {
      setDiaryReadTalkIndex(0);
      setIsDiaryReadTalkVisible(true);
    }, 1000);
    return () => clearTimeout(talkTimer);
  }, [
    baiEntry1VisualPageIndex,
    isBaiEntry1NaotaroOpenReveal,
    isBaiEntry1TitleRevealed,
    isDiaryReadTalkVisible,
    journalView,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!isGuidedJournalRevealMode) return;
    if (diaryRevealStep !== "unlocking") return;
    startJournalUnlockFx();
    const readyTimer = setTimeout(() => {
      setDiaryRevealStep("ready");
    }, 1050);
    return () => clearTimeout(readyTimer);
  }, [diaryRevealStep, isGuidedJournalRevealMode, open]);

  useEffect(() => {
    if (!open) return;
    if (sunbeastIntroStep !== 1) return;
    if (hasPlayedSunbeastHeartRef.current) return;
    hasPlayedSunbeastHeartRef.current = true;
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(GAME_EMOTION_CUE_TRIGGER, { detail: { cueId: "heart" } }),
      );
    }, 120);
    return () => clearTimeout(timer);
  }, [open, sunbeastIntroStep]);

  useEffect(() => {
    if (!open) return;
    if (activeTab !== "sunbeast") return;
    if (sunbeastView === "collection") return;
    sunbeastDetailScrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab, open, sunbeastView]);

  useEffect(() => {
    if (!open) return;
    if (activeTab !== "sunbeast") return;
    if (sunbeastView !== "detail-naotaro") return;
    if (sunbeastDetailRevealStep === "unlock-diary") {
      setActiveSunbeastDetailTab("journal");
      return;
    }
    if (sunbeastDetailRevealStep === "unlock-street") {
      setActiveSunbeastDetailTab("place");
      return;
    }
    if (sunbeastDetailRevealStep === "unlock-clues") {
      setActiveSunbeastDetailTab("clue");
    }
  }, [activeTab, open, sunbeastDetailRevealStep, sunbeastView]);

  useEffect(() => {
    if (!open) return;
    clearSunbeastRevealTimers();
    if (sunbeastFirstRevealPhase !== "questions") return;
    for (let index = 1; index <= 12; index += 1) {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastFirstRevealQuestionCount(index);
        }, 120 + (index - 1) * 90),
      );
    }
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setSunbeastFirstRevealPhase("naotaro");
      }, 120 + 12 * 90 + 140),
    );
    return () => {
      clearSunbeastRevealTimers();
    };
  }, [open, sunbeastFirstRevealPhase]);

  useEffect(() => {
    if (!open) return;
    if (sunbeastFirstRevealPhase !== "naotaro") return;
    clearSunbeastRevealTimers();
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setSunbeastFirstRevealPhase("done");
        setSunbeastIntroStep(0);
      }, 320),
    );
    return () => {
      clearSunbeastRevealTimers();
    };
  }, [open, sunbeastFirstRevealPhase]);

  useEffect(() => {
    if (!open) return;
    clearSunbeastRevealTimers();
    if (!isSunbeastRevealMode) return;

    if (sunbeastDetailRevealStep === "unlock-intro") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-diary");
        }, 420),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-diary") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-street");
        }, 860),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-street") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-clues");
        }, 860),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-clues") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("unlock-outro");
        }, 980),
      );
    }

    if (sunbeastDetailRevealStep === "unlock-outro") {
      sunbeastRevealTimersRef.current.push(
        setTimeout(() => {
          setSunbeastDetailRevealStep("complete");
        }, 980),
      );
    }

    return () => {
      clearSunbeastRevealTimers();
    };
  }, [isSunbeastRevealMode, open, sunbeastDetailRevealStep]);

  useEffect(() => {
    if (!open) return;
    if (!isPhotoDiaryRevealMode) return;
    if (firstPhotoDiaryStage !== "photo-slide") return;

    clearSunbeastRevealTimers();
    sunbeastRevealTimersRef.current.push(
      setTimeout(() => {
        setFirstPhotoDiaryStage("idle");
        if (isSecondPhotoDiaryRevealMode || isGoatPhotoDiaryRevealMode) {
          setActiveTab("journal");
          setJournalView("list");
          setDiaryRevealStep("unlocking");
          return;
        }
        setActiveTab("sunbeast");
        setSelectedSunbeastCardId("naotaro");
        setSunbeastView("detail-naotaro");
        setActiveSunbeastDetailTab("journal");
        setSunbeastDetailRevealStep("dialog");
      }, 1320),
    );

    return () => {
      clearSunbeastRevealTimers();
    };
  }, [
    firstPhotoDiaryStage,
    isPhotoDiaryRevealMode,
    isSecondPhotoDiaryRevealMode,
    isGoatPhotoDiaryRevealMode,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!ENABLE_SUNBEAST_GUIDANCE_SYSTEM) return;
    if (!isSunbeastRevealMode) return;
    if (sunbeastDetailRevealStep !== "unlock-clues") return;

    const current = loadPlayerProgress();
    if (current.hasUnlockedSunbeastFrogHint && current.hasUnlockedSunbeastChickenHint) {
      setSunbeastProgress(current);
      return;
    }

    const next = {
      ...current,
      hasUnlockedSunbeastFrogHint: true,
      hasUnlockedSunbeastChickenHint: true,
    };
    savePlayerProgress(next);
    setSunbeastProgress(next);
  }, [isSunbeastRevealMode, open, sunbeastDetailRevealStep]);

  useEffect(() => {
    if (!open) return;
    if (!ENABLE_SUNBEAST_GUIDANCE_SYSTEM) return;
    if (!isSunbeastDirectMode) return;
    const current = loadPlayerProgress();
    if (current.hasSeenSunbeastShadowGuide) return;
    if (!current.hasSeenSunbeastFirstReveal) return;
    const next = {
      ...current,
      hasUnlockedSunbeastFrogHint: true,
      hasUnlockedSunbeastChickenHint: true,
    };
    savePlayerProgress(next);
    setSunbeastProgress(next);
    setActiveTab("sunbeast");
    setSunbeastView("collection");
    setSelectedSunbeastCardId(null);
    setActiveSunbeastFilter("all");
    setSunbeastShadowGuideTargetId("frog");
    setActiveGuidedSunbeastHintId(null);
    setSunbeastShadowGuideStep(0);
    setIsSunbeastShadowGuideVisible(true);
  }, [isSunbeastDirectMode, open]);

  useLayoutEffect(() => {
    if (!open || !isSunbeastShadowGuideVisible || sunbeastShadowGuideStep !== 2) {
      setSunbeastShadowTargetRect(null);
      return;
    }

    let frameId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const update = () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      frameId = window.requestAnimationFrame(() => {
        const rootRect = sunbeastSpotlightRootRef.current?.getBoundingClientRect();
        if (rootRect) {
          setSunbeastSpotlightSize((prev) => {
            if (
              Math.abs(prev.width - rootRect.width) < 0.5 &&
              Math.abs(prev.height - rootRect.height) < 0.5
            ) {
              return prev;
            }
            return { width: rootRect.width, height: rootRect.height };
          });
        }
        const measured = measureSunbeastShadowTarget();
        if (!measured) {
          if (retryCount < 20) {
            retryCount += 1;
            timeoutId = setTimeout(update, 50);
          } else {
            setSunbeastShadowTargetRect(null);
          }
        }
      });
    };

    update();
    const root = sunbeastSpotlightRootRef.current;
    const resizeObserver = new ResizeObserver(update);
    if (root) {
      resizeObserver.observe(root);
      root.addEventListener("scroll", update, true);
    }
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      root?.removeEventListener("scroll", update, true);
    };
  }, [sunbeastShadowGuideTargetId, isSunbeastShadowGuideVisible, open, sunbeastShadowGuideStep]);

  useEffect(() => {
    if (!open || sunbeastView !== "detail-unknown") {
      setIsSunbeastHintTalkVisible(false);
      setSunbeastHintTalkStep(0);
    }
  }, [open, sunbeastView]);

  useEffect(() => {
    if (!isSunbeastHintTalkVisible || sunbeastHintTalkStep !== 0) return;
    setSunbeastHintTalkFrameIndex(MAI_THINKING_FRAME_INDICES.thinking1);
    const intervalId = window.setInterval(() => {
      setSunbeastHintTalkFrameIndex((current) =>
        current === MAI_THINKING_FRAME_INDICES.thinking1
          ? MAI_THINKING_FRAME_INDICES.thinking2
          : MAI_THINKING_FRAME_INDICES.thinking1,
      );
    }, 560);
    return () => window.clearInterval(intervalId);
  }, [isSunbeastHintTalkVisible, sunbeastHintTalkStep]);

  useEffect(() => {
    if (!open) return;
    clearIntroTimers();
    const progress = loadPlayerProgress();
    setStickerCollection(progress.stickerCollection);
    setSunbeastProgress(progress);
    setLatestPhotoSnapshot(progress.lastDogPhotoCapture);
    setIntroReward(null);
    if (
      isSunbeastRevealMode &&
      progress.unlockedDiaryEntryIds.includes("bai-entry-1") &&
      !progress.hasSeenSunbeastFirstReveal
    ) {
      finalizeDiaryFirstRevealReward("naotaro-basic");
      const next = loadPlayerProgress();
      setStickerCollection(next.stickerCollection);
      setSunbeastProgress(next);
      setLatestPhotoSnapshot(next.lastDogPhotoCapture);
      setActiveTab("sunbeast");
      setSelectedSunbeastCardId("naotaro");
      setSunbeastView("detail-naotaro");
      setActiveSunbeastDetailTab("journal");
      setSunbeastDetailRevealStep("dialog");
      setSunbeastFirstRevealPhase("done");
      setSunbeastFirstRevealQuestionCount(0);
      setSunbeastIntroStep(null);
      setIntroStage("none");
      return;
    }
    setIntroStage("none");
    return () => {
      clearIntroTimers();
    };
  }, [isSunbeastRevealMode, open, unlockedEntryIds]);

  useEffect(() => {
    return () => {
      clearIntroTimers();
      clearSunbeastRevealTimers();
      clearUnlockFxTimers();
      clearComicHintTimer();
    };
  }, []);

	  const content = useMemo(() => {
	    if (isFragmentedDiaryMode) {
	      const isFragmentedDiaryReady = fragmentedDiaryStage === "ready";

	      return (
	        <VisualDiaryBookPage
	          title="???"
	          pages={[
	            {
	              imagePath: BAI_ENTRY_1_VISUAL_PAGES[0].imagePath,
	              text: "帶著滑雪板要去滑雪，結果上捷運時，\n車門一直關不……",
	              imageEffect: "fade",
	              textEffect: "fragmented-typewriter",
	            },
		          ]}
		          stagedReveal
		          isRevealComplete={isFragmentedDiaryReady}
		          keepSinglePageCentered
	          overlay={showReturnButton ? (
	            <Flex
	              as="button"
	              position="absolute"
	              left="38px"
	              bottom="38px"
	              zIndex={20}
	              h="44px"
	              minW="96px"
	              px="18px"
	              borderRadius="6px"
	              bgColor="#7E6148"
	              alignItems="center"
	              justifyContent="center"
	              boxShadow="0 8px 18px rgba(80,54,33,0.18)"
	              cursor="pointer"
	              onClick={(event) => {
	                event.stopPropagation();
	                onClose();
	              }}
	            >
	              <Text color="#FFFFFF" fontSize="16px" fontWeight="600" lineHeight="1">
	                返回
	              </Text>
	            </Flex>
	          ) : isFragmentedDiaryReady ? (
	              <Flex
	                position="absolute"
	                inset="0"
	                zIndex={20}
	                direction="column"
	                justifyContent="flex-end"
	                pointerEvents="auto"
	                cursor="pointer"
	                onClick={onFragmentedDiaryComplete}
	              >
	                <Flex
	                  position="absolute"
	                  left="14px"
	                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
	                  zIndex={6}
	                  pointerEvents="none"
	                >
	                  <EventAvatarSprite spriteId="mai" frameIndex={36} />
	                </Flex>
	                <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
	                  <Text color="white" fontWeight="700">
	                    小麥
	                  </Text>
	                  <Flex flex="1" minH="0" direction="column" justifyContent="center">
	                    <Text color="white" fontSize="16px" lineHeight="1.5">
	                      僅存的日記也只有一點點就斷掉了
	                    </Text>
	                  </Flex>
	                  <EventContinueAction
	                    label="點擊繼續"
	                    onClick={onFragmentedDiaryComplete}
	                  />
	                </EventDialogPanel>
	              </Flex>
	          ) : null}
	        />
	      );
	    }

    if (isFrogFragmentedDiaryMode) {
      const hasFirstFragment = fragmentedDiaryStage !== "enter";
      const hasSecondFragment = fragmentedDiaryStage === "second" || fragmentedDiaryStage === "ready";
      const isFragmentedDiaryReady = fragmentedDiaryStage === "ready";

      return (
        <Flex
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#F7F0E4"
          bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
        >
          <Flex
            position="absolute"
            inset="0"
            bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
          />
          <Flex
            position="absolute"
            right="0"
            bottom="0"
            w="90%"
            h="calc(100% - 64px)"
            overflow="hidden"
            pointerEvents="none"
          >
            <img
              src="/images/diary/diary_bg.png"
              alt="日記背景"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "left bottom",
                opacity: 0.98,
                animation: `${diaryBgFloat} 12s ease-in-out infinite`,
              }}
            />
          </Flex>

          <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="16px" mt="8px">
            <Flex justifyContent="space-between" alignItems="center" pb="10px">
              <Flex w="86px" h="38px" />
              <Flex
                minW="178px"
                h="40px"
                px="20px"
                borderRadius="8px"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontSize="16px" fontWeight="500" lineHeight="1">
                  {NEXT_DIARY_FIRST_FRAGMENT.title}
                </Text>
              </Flex>
              <Flex w="86px" h="38px" />
            </Flex>

            <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px" mr="0">
              <Flex
                flex="1"
                minH="0"
                overflowY="auto"
                justifyContent="center"
                pl="48px"
                pr="0"
                pt="24px"
                pb="28px"
                css={{ scrollbarWidth: "none" }}
              >
                <Flex w="100%" maxW="328px" direction="column" alignItems="stretch" gap="22px">
                  {hasFirstFragment ? (
                    <Flex direction="column" gap="16px" animation={`${revealStageIn} 360ms ease both`}>
	                      <Flex
	                        w="100%"
	                        aspectRatio="577 / 362"
	                        border="2px solid #A57C58"
	                        borderRadius="4px"
	                        overflow="hidden"
	                        bgColor="#EBE3DB"
	                        boxShadow="0 6px 12px rgba(80,54,33,0.1)"
	                      >
                        <MovingDiaryIllustration />
                      </Flex>
	                      <Text
	                        color="#94857E"
	                        fontSize="16px"
	                        fontWeight="700"
	                        lineHeight="1.45"
                        whiteSpace="pre-line"
                        textAlign="left"
                      >
                        {NEXT_DIARY_FIRST_FRAGMENT.firstText}
                      </Text>
                    </Flex>
                  ) : null}

                  {hasSecondFragment ? (
                    <Flex direction="column" gap="16px" animation={`${revealStageIn} 360ms ease both`}>
	                      <Flex
	                        w="100%"
	                        aspectRatio="577 / 362"
	                        border="2px solid #A57C58"
	                        borderRadius="4px"
	                        overflow="hidden"
	                        bgColor="#EBE3DB"
	                        boxShadow="0 6px 12px rgba(80,54,33,0.1)"
	                      >
                        <MovingDiaryIllustration />
                      </Flex>
	                      <Text
	                        color="#94857E"
	                        fontSize="16px"
	                        fontWeight="700"
	                        lineHeight="1.45"
                        textAlign="left"
                      >
                        {NEXT_DIARY_FIRST_FRAGMENT.secondPreviewText}
                      </Text>
	                      <Flex
	                        w="100%"
	                        aspectRatio="577 / 362"
	                        border="2px dashed rgba(165,124,88,0.5)"
	                        borderRadius="4px"
	                        overflow="hidden"
	                        bgColor="#EBE3DB"
                        boxShadow="0 6px 12px rgba(80,54,33,0.07)"
                      >
                        <MovingDiaryIllustration variant="question" />
                      </Flex>
                    </Flex>
                  ) : null}

                  {(fragmentedDiaryStage === "first" || fragmentedDiaryStage === "second") ? (
                    <Flex
                      key={`fragmented-diary-focus-${fragmentedDiaryStage}`}
                      position="fixed"
                      left="50%"
                      top={fragmentedDiaryStage === "first" ? "31%" : "53%"}
                      transform="translateX(-50%)"
                      w="72%"
                      maxW="330px"
                      h="150px"
                      borderRadius="999px"
                      bg="radial-gradient(circle, rgba(255,255,255,0.58) 0%, rgba(165,124,88,0.18) 42%, rgba(255,255,255,0) 74%)"
                      pointerEvents="none"
                      animation={`${fragmentedDiaryFocusGlow} 960ms ease-out both`}
                    />
                  ) : null}

                  {isFragmentedDiaryReady ? (
                    <Flex justifyContent="center" pt="10px" pb="4px" animation={`${revealStageIn} 320ms ease both`}>
                      <Flex
                        as="button"
                        h="54px"
                        minW="204px"
                        px="30px"
                        borderRadius="6px"
                        bgColor="#7E6148"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        boxShadow="0 8px 18px rgba(80,54,33,0.18)"
                        onClick={onFragmentedDiaryComplete}
                      >
                        <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                          繼續
                        </Text>
                      </Flex>
                    </Flex>
                  ) : null}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
    }

    if (isBeigoProfileMode) {
      return (
        <Flex
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#F6F0E4"
        >
          <Flex
            position="absolute"
            inset="0"
            opacity={0.62}
            bgImage={[
              "radial-gradient(circle at 28px 24px, rgba(183,155,128,0.22) 0 4px, transparent 5px)",
              "radial-gradient(circle at 104px 66px, rgba(183,155,128,0.15) 0 3px, transparent 4px)",
              "radial-gradient(circle at 172px 38px, rgba(183,155,128,0.18) 0 3px, transparent 4px)",
            ].join(",")}
            bgSize="164px 164px"
            pointerEvents="none"
          />
          <Flex position="relative" zIndex={1} direction="column" flex="1" minH="0">
            <Flex
              position="relative"
              flex="1"
              minH="0"
              direction="column"
              overflow="hidden"
              bgColor="#F6F0E4"
            >
              <Flex
                position="relative"
                h="356px"
                minH="356px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={`beigo-dot-${dotLeft}`}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt="54px"
                  pb="34px"
                >
                  <Flex
                    alignSelf="flex-end"
                    border="2px solid #8B6D54"
                    px="12px"
                    py="5px"
                    bgColor="rgba(255,255,255,0.86)"
                  >
                    <Text color="#8B6D54" fontSize="20px" fontWeight="700" lineHeight="1">
                      小貝狗
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt="6px">
                    <img
                      src="/images/428出圖/立繪/小貝狗/3_開心.png"
                      alt="小貝狗"
                      style={{
                        width: "216px",
                        maxWidth: "86%",
                        height: "216px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text color="#111111" fontSize="18px" fontWeight="800" lineHeight="1.35" textAlign="center">
                    總是開開心心的小可愛
                  </Text>
                </Flex>
              </Flex>
              <Flex
                position="relative"
                flex="1"
                minH="0"
                bgColor="#977458"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                borderTop="8px solid #BD9A7E"
                direction="column"
                alignItems="center"
                justifyContent="center"
                px="28px"
                pt="46px"
                pb="48px"
              >
                <Flex flex="1" minH="0" />
                <Flex
                  as="button"
                  h="44px"
                  minW="204px"
                  px="30px"
                  borderRadius="6px"
                  bgColor="#806248"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={onBeigoProfileComplete}
                >
                  <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                    繼續
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
    }

    if (isPhotoDiaryRevealMode && firstPhotoDiaryStage === "photo-slide") {
      const photoRevealName = isGoatPhotoDiaryRevealMode
        ? "山羊"
        : isSecondPhotoDiaryRevealMode
          ? "青蛙"
          : "直太郎";
      return (
        <Flex
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#977458"
          backgroundImage="url('/images/pattern/gz.svg')"
          backgroundRepeat="repeat"
          backgroundSize="86px 86px"
          alignItems="center"
          justifyContent="center"
        >
          <Flex position="absolute" inset="0" bgColor="rgba(93,64,40,0.12)" pointerEvents="none" />
          <Flex
            w="150px"
            h="184px"
            borderRadius="4px"
            bgColor="#FFFDF9"
            border="1px solid rgba(180,164,142,0.55)"
            boxShadow="0 18px 32px rgba(64,44,24,0.2)"
            p="9px 9px 28px"
            direction="column"
            gap="8px"
            position="relative"
            animation={`${firstPhotoSlideAcross} 1.25s ease-in-out both`}
          >
            <Flex
              position="absolute"
              top="-7px"
              left="50%"
              transform="translateX(-50%) rotate(2deg)"
              w="62px"
              h="14px"
              bgColor="#E7D7C4"
              opacity={0.95}
            />
            <Flex
              flex="1"
              minH="0"
              borderRadius="3px"
              overflow="hidden"
              bgColor="#DDD2C6"
              backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
              backgroundSize="cover"
              backgroundPosition="center"
              backgroundRepeat="no-repeat"
            />
            <Flex direction="column" alignItems="center" gap="4px">
              <Text color="#9D7859" fontSize="13px" fontWeight="700" lineHeight="1">
                {photoRevealName}
              </Text>
              <Text color="#F2C84B" fontSize="16px" lineHeight="1">
                ★ ★ ★
              </Text>
            </Flex>
          </Flex>
        </Flex>
      );
    }

    if (isGuidedJournalRevealMode && diaryRevealStep === "book") {
      return (
          <Flex
            h="100%"
            minH="0"
            direction="column"
            justifyContent="center"
            alignItems="center"
            gap="18px"
            px="28px"
            bgColor="#F7F0E4"
            position="relative"
            overflow="hidden"
          >
            <Flex
              position="absolute"
              inset="0"
              pointerEvents="none"
              opacity={0.72}
              backgroundImage={[
                "radial-gradient(circle at 18px 22px, rgba(128, 94, 63, 0.22) 0 2px, transparent 2.7px)",
                "radial-gradient(circle at 52px 64px, rgba(128, 94, 63, 0.17) 0 1.5px, transparent 2.2px)",
                "radial-gradient(circle at 94px 18px, rgba(128, 94, 63, 0.2) 0 1.8px, transparent 2.5px)",
                "radial-gradient(circle at 126px 72px, rgba(128, 94, 63, 0.16) 0 1.5px, transparent 2.2px)",
                "radial-gradient(circle at 24px 100px, rgba(128, 94, 63, 0.16) 0 1.4px, transparent 2px)",
                "radial-gradient(circle at 78px 108px, rgba(128, 94, 63, 0.14) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 142px 34px, rgba(128, 94, 63, 0.18) 0 1.6px, transparent 2.3px)",
                "radial-gradient(circle at 112px 124px, rgba(128, 94, 63, 0.13) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 38px 42px, rgba(128, 94, 63, 0.15) 0 1.4px, transparent 2px)",
                "radial-gradient(circle at 72px 18px, rgba(128, 94, 63, 0.13) 0 1.2px, transparent 1.9px)",
                "radial-gradient(circle at 104px 86px, rgba(128, 94, 63, 0.14) 0 1.3px, transparent 2px)",
                "radial-gradient(circle at 12px 72px, rgba(128, 94, 63, 0.12) 0 1.2px, transparent 1.9px)",
              ].join(", ")}
              backgroundSize="78px 72px, 86px 84px, 68px 94px, 98px 76px, 58px 88px, 106px 92px, 74px 106px, 92px 68px, 82px 74px, 64px 102px, 112px 78px, 72px 112px"
              backgroundPosition="0 0, 18px 10px, 34px 22px, 4px 34px, 52px 6px, 10px 54px, 62px 30px, 28px 70px, 76px 48px, 46px 88px, 88px 12px, 6px 92px"
              animation={`${diaryDotDrift} 13s linear infinite`}
            />
            <Flex
              w="72%"
              maxW="280px"
              borderRadius="12px"
              overflow="hidden"
              boxShadow="0 14px 28px rgba(64,44,24,0.16)"
              position="relative"
              zIndex={1}
            >
              <img
                src="/images/comic/book.jpg"
                alt="日記本"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </Flex>
            <Text color="#6C5641" fontSize="15px" fontWeight="700" textAlign="center" lineHeight="1.6" position="relative" zIndex={1}>
              交換日記
            </Text>
            <Flex
              as="button"
              h="42px"
              px="18px"
              borderRadius="999px"
              bgColor="#9D7859"
              alignItems="center"
              justifyContent="center"
              position="relative"
              zIndex={1}
              cursor="pointer"
              boxShadow="0 8px 18px rgba(100,72,45,0.18)"
              transition="transform 120ms ease, background-color 120ms ease, box-shadow 120ms ease"
              _hover={{ bgColor: "#A98362", boxShadow: "0 10px 20px rgba(100,72,45,0.22)" }}
              _active={{ bgColor: "#806248", transform: "translateY(2px) scale(0.97)", boxShadow: "0 3px 8px rgba(100,72,45,0.18)" }}
              onClick={() => {
                if (isPhotoDiaryRevealMode) {
                  if (isFirstPhotoDiaryRevealMode) {
                    finalizeDiaryFirstRevealReward("naotaro-basic");
                    const next = loadPlayerProgress();
                    setStickerCollection(next.stickerCollection);
                    setSunbeastProgress(next);
                    setSunbeastFirstRevealPhase("done");
                    setSunbeastFirstRevealQuestionCount(0);
                    setSunbeastIntroStep(null);
                  }
                  setFirstPhotoDiaryStage("photo-slide");
                  setDiaryRevealStep("idle");
                  return;
                }
                setDiaryRevealStep("unlocking");
              }}
            >
              <Text color="white" fontSize="14px" fontWeight="700">
                打開日記
              </Text>
            </Flex>
          </Flex>
      );
    }

    if (activeTab === "sunbeast") {
      const collectionCards = buildSunbeastCollectionCards(sunbeastProgress);
      const isSunbeastFirstRevealAnimating =
        isSunbeastGuidedMode &&
        (sunbeastFirstRevealPhase === "questions" || sunbeastFirstRevealPhase === "naotaro");
      const animatedQuestionCards = Array.from({ length: 12 }, (_, index) => ({
        id: `first-reveal-${index + 1}`,
        name: "???",
        state: "unknown" as const,
        isClickable: false,
      }));
      const animatedRevealCards =
        sunbeastFirstRevealPhase === "questions"
          ? animatedQuestionCards.slice(0, sunbeastFirstRevealQuestionCount)
          : sunbeastFirstRevealPhase === "naotaro"
            ? [
                {
                  id: "naotaro",
                  name: "直太郎",
                  state: "discovered" as const,
                  imagePath: "/images/428出圖/拍照動物/黃金獵犬.png",
                  isClickable: false,
                },
                ...animatedQuestionCards.slice(1),
              ]
            : collectionCards;
      const visibleCollectionCards =
        isSunbeastFirstRevealAnimating
          ? animatedRevealCards
          : activeSunbeastFilter === "all"
            ? collectionCards
            : collectionCards.filter((card) => card.state === activeSunbeastFilter);
      const visibleSunbeastFilters = ENABLE_SUNBEAST_HINT_SYSTEM
        ? SUNBEAST_FILTERS
        : SUNBEAST_FILTERS.filter((filter) => filter.id !== "hint");
      const showSunbeastIntroDialog = ENABLE_SUNBEAST_GUIDANCE_SYSTEM && sunbeastIntroStep !== null;
      const isSunbeastNaotaroGuideStep = sunbeastIntroStep === 1;
      const isSunbeastShadowPointerStep =
        ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && sunbeastShadowGuideStep === 2;
      const isSunbeastCollectionBlocked =
        showSunbeastIntroDialog ||
        (ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && !isSunbeastShadowPointerStep);
      const activeShadowGuideCard = collectionCards.find(
        (card) => card.id === sunbeastShadowGuideTargetId,
      );
      const chickenGuideCard = collectionCards.find(
        (card) => card.id === "chicken" && card.state === "hint",
      );
      const introSpeaker = sunbeastIntroStep === 1 ? "小貝狗" : "小麥";
      const introAvatarSpriteId = sunbeastIntroStep === 1 ? "beigo" : "mai";
      const introAvatarFrameIndex = sunbeastIntroStep === 1 ? 1 : 1; // 小貝狗開心表情／小麥表情2（0-based index）
      const introText =
        sunbeastIntroStep === 0
          ? "黃金獵犬出現在日記上了！對，是小白常常提到的直太郎。"
          : "點點看小日獸吧。";

      const handleSunbeastTopBack = () => {
        if (sunbeastView === "detail-naotaro") {
          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "complete" : "idle");
          setSunbeastView("collection");
          return;
        }
        if (sunbeastView === "detail-chicken" || sunbeastView === "detail-unknown") {
          setSunbeastView("collection");
          return;
        }
        onClose();
      };
      const completeSunbeastShadowGuide = () => {
        const current = loadPlayerProgress();
        const next = {
          ...current,
          hasSeenSunbeastShadowGuide: true,
          hasUnlockedSunbeastFrogHint: true,
          hasUnlockedSunbeastChickenHint: true,
        };
        savePlayerProgress(next);
        setSunbeastProgress(next);
        setIsSunbeastShadowGuideVisible(false);
        setSunbeastShadowGuideStep(0);
      };
      const openSunbeastHintCard = (card: SunbeastCollectionCard) => {
        completeSunbeastShadowGuide();
        setSelectedSunbeastCardId(card.id);
        setActiveGuidedSunbeastHintId(
          card.id === "chicken" ? "chicken" : card.id === "frog" ? "frog" : null,
        );
        setSunbeastHintTalkStep(0);
        setIsSunbeastHintTalkVisible(true);
        setSunbeastView(getSunbeastDetailView(card));
      };
      const isNaotaroDetail = sunbeastView === "detail-naotaro";
      const isChickenDetail = sunbeastView === "detail-chicken";
      const isGuidedChickenDetail = isSunbeastGuidedMode && isChickenDetail;
      const selectedSunbeastCard = selectedSunbeastCardId
        ? collectionCards.find((card) => card.id === selectedSunbeastCardId)
        : null;
      const selectedHintDetail =
        ENABLE_SUNBEAST_HINT_SYSTEM && selectedSunbeastCard?.state === "hint" && selectedSunbeastCardId
          ? SUNBEAST_HINT_DETAIL_CONTENT[selectedSunbeastCardId]
          : null;
      const isChickenHintSelected = selectedSunbeastCardId === "chicken";
      const isCatHintSelected = selectedSunbeastCardId === "cat";
      const isGoatHintSelected = selectedSunbeastCardId === "goat";
      const advanceSunbeastHintTalk = () => {
        if (sunbeastHintTalkStep === 0 && selectedHintDetail) {
          setSunbeastHintTalkStep(1);
          return;
        }
        setIsSunbeastHintTalkVisible(false);
        setSunbeastHintTalkStep(0);
        if (activeGuidedSunbeastHintId === "frog" && selectedSunbeastCardId === "frog") {
          if (chickenGuideCard) {
            setSelectedSunbeastCardId(null);
            setActiveGuidedSunbeastHintId(null);
            setSunbeastView("collection");
            setSunbeastShadowGuideTargetId("chicken");
            setSunbeastShadowTargetRect(null);
            setSunbeastShadowGuideStep(2);
            setIsSunbeastShadowGuideVisible(true);
            return;
          }
          setActiveGuidedSunbeastHintId(null);
          onSunbeastHintGuideComplete?.();
          return;
        }
        if (activeGuidedSunbeastHintId === "chicken" && selectedSunbeastCardId === "chicken") {
          setActiveGuidedSunbeastHintId(null);
          onSunbeastHintGuideComplete?.();
        }
      };
      const isChickenHintOneUnlocked = Boolean(
        sunbeastProgress?.hasUnlockedSunbeastChickenHint ||
          sunbeastProgress?.hasUnlockedSpecialMap ||
          sunbeastProgress?.hasTriggeredOfficeSunbeastChickenEvent,
      );
      const isChickenHintTwoUnlocked = Boolean(
        sunbeastProgress?.hasUnlockedSpecialMap || sunbeastProgress?.hasTriggeredOfficeSunbeastChickenEvent,
      );
      const isGoatElevatorPreludeUnlocked = Boolean(
        sunbeastProgress?.hasTriggeredMetroElevatorGoatPrelude,
      );
      const isGoatStreetDodgePreludeUnlocked = Boolean(
        sunbeastProgress?.hasTriggeredStreetDodgeGoatPrelude,
      );
      const isGoatMartOneDollarPreludeUnlocked = Boolean(
        sunbeastProgress?.hasTriggeredMartOneDollarGoatPrelude,
      );
      const isGoatAllPreludesUnlocked =
        isGoatElevatorPreludeUnlocked &&
        isGoatStreetDodgePreludeUnlocked &&
        isGoatMartOneDollarPreludeUnlocked;
      const isGoatDiscovered = Boolean(sunbeastProgress?.hasTriggeredOfficeSunbeastGoatEvent);
      const selectedHintTalkReply = isChickenHintSelected ? (
        isChickenHintTwoUnlocked ? (
          "嗷～通過特殊地圖，到達指定地點看看嗷！"
        ) : (
          "嗷～先前往街道打聽看看嗷！"
        )
      ) : isCatHintSelected ? (
        "嗷～先準備貓咪喜歡的東西，再試試看不同交通方式嗷！"
      ) : isGoatHintSelected ? (
        isGoatDiscovered ? (
          "嗷～這隻山羊小日獸已經拍到了嗷！"
        ) : isGoatAllPreludesUnlocked ? (
          "嗷～線索都到齊了，下次上班的會議要小心觀察嗷！"
        ) : (
          <>
            嗷～試試看安排
            <Text as="span" color="#F6D982" fontWeight="800">
              捷運
            </Text>
            、
            <Text as="span" color="#F6D982" fontWeight="800">
              街道
            </Text>
            、
            <Text as="span" color="#F6D982" fontWeight="800">
              便利商店
            </Text>
            ，可能會找到線索嗷！
          </>
        )
      ) : (
        FROG_ACTIVE_CLUE_TEXT
      );
      const isNaotaroUnlockOverlayOpen =
        isNaotaroDetail &&
        (sunbeastDetailRevealStep === "unlock-intro" ||
          sunbeastDetailRevealStep === "unlock-diary" ||
          sunbeastDetailRevealStep === "unlock-street" ||
          sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "unlock-outro");
      const isNaotaroDialogOpen = isNaotaroDetail && sunbeastDetailRevealStep === "dialog";
      const isDiaryUnlockedInReveal =
        sunbeastDetailRevealStep === "unlock-diary" ||
        sunbeastDetailRevealStep === "unlock-street" ||
        sunbeastDetailRevealStep === "unlock-clues" ||
        sunbeastDetailRevealStep === "complete";
      const shouldUseInlinePhotoDialog = isSunbeastGuidedMode && isNaotaroDialogOpen;
      const shouldUseInlineDiaryUnlock = isSunbeastGuidedMode && sunbeastDetailRevealStep === "unlock-diary";
      const shouldUseInlineRevealPanel = shouldUseInlinePhotoDialog || shouldUseInlineDiaryUnlock;
      const isStreetUnlockedInReveal =
        !isFirstPhotoDiaryRevealMode &&
        (sunbeastDetailRevealStep === "unlock-street" ||
          sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "complete");
      const isClueUnlockedInReveal =
        !isFirstPhotoDiaryRevealMode &&
        (sunbeastDetailRevealStep === "unlock-clues" ||
          sunbeastDetailRevealStep === "unlock-outro" ||
          sunbeastDetailRevealStep === "complete");
      const isGuidedNaotaroDetail = isSunbeastGuidedMode && isNaotaroDetail;
      const isUnlockOutro = sunbeastDetailRevealStep === "unlock-outro";
      const isDiaryUnlockAnimating = sunbeastDetailRevealStep === "unlock-diary";
      const isStreetUnlockAnimating = sunbeastDetailRevealStep === "unlock-street";
      const isClueUnlockAnimating = sunbeastDetailRevealStep === "unlock-clues";
      const naotaroRevealFooterText =
        sunbeastDetailRevealStep === "dialog"
          ? "早上拍下來的直太郎照片出現在這裡"
          : sunbeastDetailRevealStep === "unlock-intro"
            ? "咦，好像有新的內容出現了。"
            : sunbeastDetailRevealStep === "unlock-diary"
              ? "先看看這篇日記吧。"
              : sunbeastDetailRevealStep === "unlock-street"
                ? "也解鎖了新的地點：街道。"
                : "還留下了兩個小日獸線索。";
      const advanceNaotaroRevealFooter = () => {
        setSunbeastDetailRevealStep(isFirstPhotoDiaryRevealMode ? "unlock-diary" : "unlock-intro");
      };
      const visibleSunbeastDetailInfo = isFirstPhotoDiaryRevealMode
        ? SUNBEAST_DETAIL_INFO.filter((item) => item.kind === "journal")
        : SUNBEAST_DETAIL_INFO;
      const activeSunbeastDetailItem =
        visibleSunbeastDetailInfo.find((item) => item.kind === activeSunbeastDetailTab) ??
        SUNBEAST_DETAIL_INFO[0];
      const isActiveDetailJournal = activeSunbeastDetailItem.kind === "journal";
      const isActiveDetailPlace = activeSunbeastDetailItem.kind === "place";
      const isActiveDetailClue = activeSunbeastDetailItem.kind === "clue";
      const isActiveDetailUnlocked =
        isActiveDetailJournal
          ? isDiaryUnlockedInReveal
          : isActiveDetailPlace
            ? isStreetUnlockedInReveal
            : isClueUnlockedInReveal;
      const isActiveDetailAnimating =
        isActiveDetailJournal
          ? isDiaryUnlockAnimating
          : isActiveDetailPlace
            ? isStreetUnlockAnimating
            : isClueUnlockAnimating;
      const sunbeastDetailSection = (
        <Flex
          ref={sunbeastDetailScrollRef}
          position="relative"
          flex="1"
          minH="0"
          direction="column"
          overflow="hidden"
          css={{ scrollbarWidth: "none" }}
          bgColor="#F6F0E4"
        >
          {isNaotaroDetail ? (
            <>
              <Flex
                position="relative"
                h={isGuidedNaotaroDetail ? "356px" : "260px"}
                minH={isGuidedNaotaroDetail ? "356px" : "260px"}
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt={isGuidedNaotaroDetail ? "54px" : "40px"}
                  pb={isGuidedNaotaroDetail ? "34px" : "10px"}
                >
                  <Flex
                    alignSelf="flex-end"
                    border="2px solid #8B6D54"
                    px="12px"
                    py="5px"
                    bgColor="rgba(255,255,255,0.86)"
                  >
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      直太郎
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt={isGuidedNaotaroDetail ? "6px" : "2px"}>
                    <img
                      src="/images/428出圖/拍照動物/黃金獵犬.png"
                      alt="直太郎"
                      style={{
                        width: isGuidedNaotaroDetail ? "224px" : "156px",
                        maxWidth: "86%",
                        height: isGuidedNaotaroDetail ? "224px" : "156px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text
                    color="#977458"
                    fontSize={isGuidedNaotaroDetail ? "18px" : "15px"}
                    fontWeight="500"
                    lineHeight="1.35"
                    textAlign="right"
                  >
                    脫線的善良狗狗!
                  </Text>
                </Flex>
              </Flex>

              <Flex
                position="relative"
                order={2}
                flex="1"
                minH="0"
                bgColor="#977458"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                borderTop="8px solid #BD9A7E"
                overflow="hidden"
              >
                {isSunbeastGuidedMode ? (
                  <Flex direction="column" w="100%" h="100%" px="28px" pt="46px" pb="48px" alignItems="center">
                    {sunbeastDetailRevealStep === "dialog" ? (
                      <>
                        <Flex
                          flex="1"
                          minH="0"
                          w="100%"
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          gap="24px"
                        >
                          <Flex
                            bgColor="#FFFDF9"
                            borderRadius="4px"
                            p="9px 9px 24px"
                            transform="rotate(5deg)"
                            boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                            w="160px"
                            h="196px"
                            position="relative"
                            overflow="visible"
                            flexShrink={0}
                            animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                            transformOrigin="50% 100%"
                          >
                            <Flex
                              position="absolute"
                              top="-7px"
                              left="50%"
                              transform="translateX(-50%) rotate(-2deg)"
                              w="62px"
                              h="14px"
                              bgColor="#E7D7C4"
                              opacity={0.95}
                            />
                            <Flex direction="column" gap="8px" w="100%" h="100%">
                              <Flex
                                w="100%"
                                h="126px"
                                borderRadius="3px"
                                overflow="hidden"
                                bgColor="#DDD2C6"
                                backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
                                backgroundSize="cover"
                                backgroundPosition="center"
                                backgroundRepeat="no-repeat"
                              />
                              <Flex direction="column" alignItems="center" gap="5px">
                                <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                                  直太郎
                                </Text>
                                <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                                  ★ ★ ★
                                </Text>
                              </Flex>
                            </Flex>
                          </Flex>

                          <Text color="#FFFFFF" fontSize="16px" fontWeight="400" lineHeight="1.45" textAlign="center" w="112%" maxW="340px">
                            差點趕不上捷運，尾巴被夾到了，
                            <br />
                            不過似乎還是不影響開心趕上車呢
                          </Text>
                        </Flex>

                        <Flex
                          as="button"
                          h="44px"
                          minW="204px"
                          px="30px"
                          borderRadius="6px"
                          bgColor="#806248"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => setSunbeastDetailRevealStep("unlock-diary")}
                        >
                          <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                            下一步
                          </Text>
                        </Flex>
                      </>
                    ) : shouldUseInlineDiaryUnlock ? (
                      <>
                        <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="34px">
                          <Flex
                            w="330px"
                            maxW="100%"
                            h="216px"
                            borderRadius="6px"
                            overflow="hidden"
                            bgColor="#EFE6D9"
                            border="1.5px solid #FFFFFF"
                            boxShadow="0 8px 16px rgba(88,59,33,0.12)"
                          >
                            <img
                              src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                              alt="相關的日記"
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </Flex>
                          <Text color="#FFFFFF" fontSize="17px" fontWeight="400" lineHeight="1.45" textAlign="center">
                            還原完整的日記。
                          </Text>
                        </Flex>

                        <Flex
                          as="button"
                          h="44px"
                          minW="204px"
                          px="30px"
                          borderRadius="6px"
                          bgColor="#806248"
                          alignItems="center"
                          justifyContent="center"
                          cursor="pointer"
                          onClick={() => {
                            setActiveTab("journal");
                            setJournalView("entry-bai-1");
                            setBaiEntry1VisualPageIndex(0);
                            setIsBaiEntry1TitleRevealed(false);
                            setIsBaiEntry1FirstTextRevealed(false);
                            setIsBaiEntry1NaotaroOpenReveal(true);
                            setIsDiaryReadTalkVisible(false);
                            setDiaryReadTalkIndex(0);
                            setIsComicReadMode(false);
                            setIsComicControlsVisible(false);
                            setShowComicReadHint(false);
                            setComicPageIndex(0);
                            setDiaryRevealStep("idle");
                          }}
                        >
                          <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
                            還原完整的日記。
                          </Text>
                        </Flex>
                      </>
                    ) : null}
                  </Flex>
                ) : (
                  <Flex direction="column" w="100%" h="100%">
                    <Flex
                      flex="1"
                      minH="0"
                      px="24px"
                      pt="16px"
                      pb="18px"
                      w="100%"
                      alignItems="center"
                      gap="22px"
                    >
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px"
                        transform="rotate(5deg)"
                        boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                        w="140px"
                        h="166px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        transformOrigin="50% 100%"
                      >
                        <Flex
                          position="absolute"
                          top="-7px"
                          left="50%"
                          transform="translateX(-50%) rotate(-2deg)"
                          w="62px"
                          h="14px"
                          bgColor="#E7D7C4"
                          opacity={0.95}
                        />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="100px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              直太郎
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>

                      <Text
                        color="#FFFFFF"
                        fontSize="14px"
                        fontWeight="400"
                        lineHeight="1.48"
                        textAlign="left"
                        flex="1"
                        minW="0"
                      >
                        差點趕不上捷運，尾巴被夾到了，不過似乎還是不影響開心趕上車呢
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Flex>

              {isSunbeastGuidedMode ? null : (
              <Flex
                position="relative"
                order={1}
                h="180px"
                minH="180px"
                borderTop="0"
                bgColor="#BD9A7E"
                flexShrink={0}
                animation={isActiveDetailAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                opacity={isActiveDetailUnlocked || !isSunbeastGuidedMode ? 1 : 0.48}
              >
                <Flex
                  w="54px"
                  flexShrink={0}
                  pt="16px"
                  alignItems="center"
                  direction="column"
                  gap="16px"
                  color="rgba(255,255,255,0.9)"
                  borderRight="1px solid rgba(128,98,72,0.55)"
                >
                  {visibleSunbeastDetailInfo.map((railItem) => {
                    const isRailActive = railItem.kind === activeSunbeastDetailTab;
                    const isRailUnlocked =
                      railItem.kind === "journal"
                        ? isDiaryUnlockedInReveal
                        : railItem.kind === "place"
                          ? isStreetUnlockedInReveal
                          : isClueUnlockedInReveal;

                    return (
                      <Flex
                        key={railItem.kind}
                        as="button"
                        w="30px"
                        h="30px"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="999px"
                        bgColor={isRailActive ? "rgba(255,255,255,0.22)" : "transparent"}
                        color={isRailActive ? "#FFFFFF" : "rgba(255,255,255,0.72)"}
                        fontSize={railItem.kind === "clue" ? "17px" : "15px"}
                        opacity={isRailUnlocked || !isSunbeastGuidedMode ? 1 : 0.46}
                        cursor={isRailUnlocked || !isSunbeastGuidedMode ? "pointer" : "default"}
                        aria-label={railItem.eyebrow}
                        onClick={() => {
                          if (isSunbeastGuidedMode && !isRailUnlocked) return;
                          setActiveSunbeastDetailTab(railItem.kind);
                        }}
                      >
                        <SunbeastInfoIcon kind={railItem.kind} />
                      </Flex>
                    );
                  })}
                </Flex>

                <Flex flex="1" minW="0" px="20px" py="14px" alignItems="center" gap="14px">
                  <Flex direction="column" flex="1" minW="0" gap="9px" alignItems="flex-start">
                    <Flex bgColor="#FFFFFF" borderRadius="4px" px="12px" py="4px">
                      <Text color="#806248" fontSize="16px" fontWeight="400" lineHeight="1.2">
                        {activeSunbeastDetailItem.eyebrow}
                      </Text>
                    </Flex>
                    <Text
                      color="#FFFFFF"
                      fontSize="14px"
                      fontWeight="400"
                      lineHeight="1.35"
                      whiteSpace="pre-line"
                    >
                      {activeSunbeastDetailItem.body}
                    </Text>
                    <Flex
                      as="button"
                      h="28px"
                      minW="82px"
                      px="16px"
                      borderRadius="4px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor={isActiveDetailJournal || isActiveDetailClue ? "pointer" : "default"}
                      onClick={() => {
                        if (isActiveDetailJournal) {
                          setActiveTab("journal");
                          setBaiEntry1VisualPageIndex(0);
                          setIsBaiEntry1TitleRevealed(false);
                          setIsBaiEntry1FirstTextRevealed(false);
                          setIsBaiEntry1NaotaroOpenReveal(isNaotaroDetail);
                          setIsDiaryReadTalkVisible(false);
                          setDiaryReadTalkIndex(0);
                          setJournalView("entry-bai-1");
                          return;
                        }
                        if (isActiveDetailClue) {
                          setSelectedSunbeastCardId("frog");
                          setSunbeastHintTalkStep(0);
                          setIsSunbeastHintTalkVisible(true);
                          setSunbeastView("detail-unknown");
                          setSunbeastDetailRevealStep("complete");
                        }
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="14px" fontWeight="500" lineHeight="1">
                        {activeSunbeastDetailItem.action}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex
                    w="126px"
                    h="82px"
                    flexShrink={0}
                    border="1.5px solid #FFFFFF"
                    borderRadius="6px"
                    overflow="hidden"
                    bgColor={isActiveDetailClue ? "#BD9A7E" : "#EFE6D9"}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isActiveDetailJournal ? (
                      <img
                        src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                        alt="相關的日記"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : isActiveDetailPlace ? (
                      <img
                        src="/walk/Sidewalk_Day.png"
                        alt="街道"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Flex alignItems="center" justifyContent="center" gap="10px">
                        <img
                          src={FROG_SHADOW_IMAGE_PATH}
                          alt="青蛙線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                        <img
                          src={ROOSTER_SHADOW_IMAGE_PATH}
                          alt="公雞線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>
              )}

              <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                <Flex
                  as="button"
                  h="40px"
                  w="104px"
                  borderRadius="0 4px 4px 0"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 4px 7px rgba(10,10,10,0.25)"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">
                    ‹
                  </Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </>
          ) : isChickenDetail ? (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex position="relative" zIndex={2} direction="column" w="100%" h="100%" pl="52px" pr="24px" pt="36px" pb="18px">
                  <Flex alignSelf="flex-end" border="2px solid #8B6D54" px="12px" py="5px" bgColor="rgba(255,255,255,0.86)">
                    <Text color="#8B6D54" fontSize="16px" fontWeight="700" lineHeight="1">
                      公雞
                    </Text>
                  </Flex>
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center">
                    <img
                      src={ROOSTER_IMAGE_PATH}
                      alt="公雞"
                      style={{ width: "180px", maxWidth: "86%", height: "180px", objectFit: "contain", display: "block" }}
                    />
                  </Flex>
                  <Text color="#977458" fontSize="15px" fontWeight="500" lineHeight="1.35" textAlign="right">
                    專心工作的白色公雞
                  </Text>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="0"
                px={isGuidedChickenDetail ? "28px" : "24px"}
                pt={isGuidedChickenDetail ? "46px" : "24px"}
                pb={isGuidedChickenDetail ? "48px" : "72px"}
                bgColor="#977458"
                borderTop="8px solid #BD9A7E"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                direction="column"
                gap="16px"
                overflow="hidden"
                alignItems={isGuidedChickenDetail ? "center" : undefined}
              >
                {isGuidedChickenDetail && sunbeastDetailRevealStep === "dialog" ? (
                  <>
                    <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="24px">
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px 9px 24px"
                        transform="rotate(-5deg)"
                        boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                        w="160px"
                        h="196px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                        transformOrigin="50% 100%"
                      >
                        <Flex position="absolute" top="-7px" left="50%" transform="translateX(-50%) rotate(2deg)" w="62px" h="14px" bgColor="#E7D7C4" opacity={0.95} />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="126px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url('${ROOSTER_IMAGE_PATH}')`}
                            backgroundSize="contain"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              公雞
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>

                      <Text color="#FFFFFF" fontSize="16px" fontWeight="400" lineHeight="1.45" textAlign="center" w="112%" maxW="340px">
                        在辦公室裡意外拍下的小日獸。
                        <br />
                        牠看起來非常專心，似乎會被工作的氣氛吸引。
                      </Text>
                    </Flex>

                    <Flex
                      as="button"
                      h="44px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => setSunbeastDetailRevealStep("unlock-diary")}
                    >
                      <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                        下一步
                      </Text>
                    </Flex>
                  </>
                ) : isGuidedChickenDetail && sunbeastDetailRevealStep === "unlock-diary" ? (
                  <>
                    <Flex flex="1" minH="0" w="100%" direction="column" alignItems="center" justifyContent="center" gap="34px">
                      <Flex
                        w="330px"
                        maxW="100%"
                        h="216px"
                        borderRadius="6px"
                        overflow="hidden"
                        bgColor="#EFE6D9"
                        border="1.5px solid #FFFFFF"
                        boxShadow="0 8px 16px rgba(88,59,33,0.12)"
                      >
                        <img
                          src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                          alt="相關的日記"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </Flex>
                      <Text color="#FFFFFF" fontSize="17px" fontWeight="400" lineHeight="1.45" textAlign="center">
                        還原完整的日記。
                      </Text>
                    </Flex>

                    <Flex
                      as="button"
                      h="44px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#806248"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      onClick={() => {
                        setActiveTab("journal");
                        setJournalView("list");
                        setIsComicReadMode(false);
                        setIsComicControlsVisible(false);
                        setShowComicReadHint(false);
                        setComicPageIndex(0);
                        setDiaryRevealStep("unlocking");
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="15px" fontWeight="500" lineHeight="1">
                        還原完整的日記。
                      </Text>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex alignItems="center" gap="18px">
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="9px 9px 22px"
                        transform="rotate(-3deg)"
                        boxShadow="0 10px 18px rgba(88,59,33,0.18)"
                        w="142px"
                        h="176px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                      >
                        <Flex position="absolute" top="-7px" left="50%" transform="translateX(-50%) rotate(2deg)" w="62px" h="14px" bgColor="#E7D7C4" opacity={0.95} />
                        <Flex direction="column" gap="8px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="106px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url('${ROOSTER_IMAGE_PATH}')`}
                            backgroundSize="contain"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="14px" fontWeight="700" lineHeight="1">
                              公雞
                            </Text>
                            <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Text color="#FFFFFF" fontSize="15px" lineHeight="1.55" flex="1" minW="0">
                        在辦公室裡意外拍下的小日獸。牠看起來非常專心，似乎會被工作的氣氛吸引。
                      </Text>
                    </Flex>
                    <Flex borderRadius="4px" bgColor="#FFFFFF" px="14px" py="12px" direction="column" gap="6px" boxShadow="0 4px 10px rgba(109,82,55,0.08)">
                      <Text color="#806248" fontSize="16px" fontWeight="700" lineHeight="1.2">
                        相關的日記
                      </Text>
                      <Text color="#806248" fontSize="13px" lineHeight="1.45">
                        小日獸記錄出現在圖鑑裡，也帶來了一篇新的交換日記。
                      </Text>
                    </Flex>
                  </>
                )}
              </Flex>
              <Flex position="absolute" left="0" bottom="32px" zIndex={4} alignItems="center">
                <Flex as="button" h="40px" w="104px" borderRadius="0 4px 4px 0" bgColor="#9D7859" alignItems="center" justifyContent="center" gap="8px" boxShadow="0 4px 7px rgba(10,10,10,0.25)" onClick={handleSunbeastTopBack}>
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">‹</Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">返回</Text>
                </Flex>
              </Flex>
            </>
          ) : (
            <>
              <Flex
                position="relative"
                h="260px"
                minH="260px"
                overflow="hidden"
                flexShrink={0}
                bgColor="#F6F0E4"
              >
                {[32, 92, 154, 216, 282, 350].map((dotLeft, dotIndex) => (
                  <Flex
                    key={dotLeft}
                    position="absolute"
                    left={`${dotLeft}px`}
                    top={dotIndex % 2 === 0 ? "20px" : "10px"}
                    w="7px"
                    h="7px"
                    borderRadius="999px"
                    bgColor="#9B8475"
                    pointerEvents="none"
                    zIndex={0}
                  />
                ))}
                <Flex
                  position="absolute"
                  left="-10px"
                  right="-26px"
                  top="28px"
                  bottom="-28px"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{
                      width: "110%",
                      height: "108%",
                      objectFit: "fill",
                      objectPosition: "left top",
                      transform: "rotate(-4deg) translate(-8px, 0)",
                      transformOrigin: "top left",
                    }}
                  />
                </Flex>
                <Flex
                  position="relative"
                  zIndex={2}
                  direction="column"
                  w="100%"
                  h="100%"
                  pl="52px"
                  pr="24px"
                  pt="36px"
                  pb="18px"
                >
                  <Flex
                    alignSelf="flex-end"
                    px="22px"
                    py="8px"
                    border="2px solid #AB9E90"
                    borderRadius="999px"
                    bgColor="rgba(255,255,255,0.9)"
                  >
                    <Text color="#8B6D54" fontSize="20px" fontWeight="700" lineHeight="1">
                      ???
                    </Text>
                  </Flex>
                  <Flex flex="1" alignItems="center" justifyContent="center" minH="0" position="relative">
                    {selectedHintDetail ? (
                      <Flex
                        w="172px"
                        h="172px"
                        borderRadius="999px"
                        bgColor="rgba(218,191,138,0.18)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <img
                          src={selectedHintDetail.imagePath}
                          alt=""
                          style={{ width: "156px", height: "156px", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    ) : (
                      <Flex w="172px" h="172px" borderRadius="16px" bgColor="#E8D8C8" alignItems="center" justifyContent="center">
                        <Text color="#9D7859" fontSize="72px" lineHeight="1" fontWeight="500">?</Text>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="0"
                px="18px"
                pt="22px"
                pb={isSunbeastHintTalkVisible ? `calc(${EVENT_DIALOG_HEIGHT} + 18px)` : "22px"}
                bgColor="#977458"
                borderTop="8px solid #BD9A7E"
                backgroundImage="url('/images/pattern/gz.svg')"
                backgroundRepeat="repeat"
                backgroundSize="84px 84px"
                backgroundPosition="top left"
                direction="column"
                gap="14px"
                overflowY={isSunbeastHintTalkVisible ? "auto" : "hidden"}
                css={{ scrollbarWidth: "none" }}
              >
                <Text color="#FFFFFF" fontSize="24px" fontWeight="700" lineHeight="1">
                  線索
                </Text>
                {isChickenHintSelected ? (
                  <>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      wrap="wrap"
                      alignItems="center"
                      gap="8px 10px"
                      opacity={isChickenHintOneUnlocked ? 1 : 0.58}
                    >
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                        前往
                      </Text>
                      <Flex
                        h="34px"
                        px="14px"
                        borderRadius="999px"
                        bgColor="#E8D8C8"
                        alignItems="center"
                        gap="8px"
                        boxShadow="0 3px 0 rgba(255,255,255,0.12) inset"
                      >
                        <img
                          src={SUNBEAST_HINT_PLACE_ICON_PATHS["街道"]}
                          alt=""
                          style={{ width: "24px", height: "24px", objectFit: "contain", display: "block" }}
                        />
                        <Text color="#7B5C43" fontSize="16px" fontWeight="800" lineHeight="1">
                          街道
                        </Text>
                      </Flex>
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                        打聽看看。
                      </Text>
                    </Flex>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      minH="62px"
                      alignItems="center"
                      justifyContent={isChickenHintTwoUnlocked ? "flex-start" : "center"}
                    >
                      {isChickenHintTwoUnlocked ? (
                        <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                          通過特殊地圖到達指定地點
                        </Text>
                      ) : (
                        <Flex
                          h="38px"
                          px="18px"
                          borderRadius="999px"
                          bgColor="#F4EEE8"
                          alignItems="center"
                          gap="8px"
                        >
                          <Text color="#70553F" fontSize="16px" fontWeight="700" lineHeight="1">
                            線索二
                          </Text>
                          <Text color="#70553F" fontSize="17px" lineHeight="1">
                            🔒
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </>
                ) : isGoatHintSelected ? (
                  <>
                    {(
                      [
                        {
                          key: "metro",
                          label: "捷運",
                          icon: "/images/icon/mrt.png",
                          unlocked: isGoatElevatorPreludeUnlocked,
                          hintText: "電梯裡與陌生人面對面的瞬間。",
                        },
                        {
                          key: "street",
                          label: "街道",
                          icon: SUNBEAST_HINT_PLACE_ICON_PATHS["街道"],
                          unlocked: isGoatStreetDodgePreludeUnlocked,
                          hintText: "走在路上和對向的人尷尬閃避時。",
                        },
                        {
                          key: "mart",
                          label: "便利商店",
                          icon: SUNBEAST_HINT_PLACE_ICON_PATHS["便利商店"],
                          unlocked: isGoatMartOneDollarPreludeUnlocked,
                          hintText: "排隊結帳時遇到一塊錢結帳的人。",
                        },
                      ] as const
                    ).map((clue) => (
                      <Flex
                        key={clue.key}
                        borderRadius="14px"
                        bgColor="rgba(98,73,52,0.72)"
                        px="16px"
                        py="14px"
                        wrap="wrap"
                        alignItems="center"
                        gap="8px 10px"
                        opacity={clue.unlocked ? 1 : 0.58}
                      >
                        <Flex
                          h="34px"
                          px="14px"
                          borderRadius="999px"
                          bgColor="#E8D8C8"
                          alignItems="center"
                          gap="8px"
                          boxShadow="0 3px 0 rgba(255,255,255,0.12) inset"
                        >
                          <img
                            src={clue.icon}
                            alt=""
                            style={{ width: "24px", height: "24px", objectFit: "contain", display: "block" }}
                          />
                          <Text color="#7B5C43" fontSize="16px" fontWeight="800" lineHeight="1">
                            {clue.label}
                          </Text>
                        </Flex>
                        <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                          {clue.unlocked ? clue.hintText : "線索未解鎖"}
                        </Text>
                      </Flex>
                    ))}
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      minH="62px"
                      alignItems="center"
                      justifyContent={isGoatAllPreludesUnlocked ? "flex-start" : "center"}
                    >
                      {isGoatAllPreludesUnlocked ? (
                        <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                          {isGoatDiscovered
                            ? "在公司會議中拍下了山羊小日獸。"
                            : "三條線索齊全，下次上班的會議要小心觀察。"}
                        </Text>
                      ) : (
                        <Flex
                          h="38px"
                          px="18px"
                          borderRadius="999px"
                          bgColor="#F4EEE8"
                          alignItems="center"
                          gap="8px"
                        >
                          <Text color="#70553F" fontSize="16px" fontWeight="700" lineHeight="1">
                            線索四
                          </Text>
                          <Text color="#70553F" fontSize="17px" lineHeight="1">
                            🔒
                          </Text>
                        </Flex>
                      )}
                    </Flex>
                  </>
                ) : isCatHintSelected ? (
                  <>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="16px"
                      alignItems="center"
                      gap="12px"
                    >
                      <Flex
                        w="58px"
                        h="58px"
                        flexShrink={0}
                        borderRadius="999px"
                        bgColor="rgba(255,248,234,0.82)"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <img
                          src="/images/animals/demo_cat_shadow.png"
                          alt="貓線索"
                          style={{ width: "48px", height: "48px", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.65" whiteSpace="pre-line">
                        {CAT_B_CLUE_TEXT}
                      </Text>
                    </Flex>
                    <Flex
                      borderRadius="14px"
                      bgColor="rgba(98,73,52,0.72)"
                      px="16px"
                      py="14px"
                      wrap="wrap"
                      alignItems="center"
                      gap="8px 10px"
                    >
                      <Text color="#FFFFFF" fontSize="16px" lineHeight="1.55">
                        先留意
                      </Text>
                      {["不同路線", "貓咪喜歡的東西"].map((label) => (
                        <Flex
                          key={label}
                          h="34px"
                          px="14px"
                          borderRadius="999px"
                          bgColor="#E8D8C8"
                          alignItems="center"
                          boxShadow="0 3px 0 rgba(255,255,255,0.12) inset"
                        >
                          <Text color="#7B5C43" fontSize="16px" fontWeight="800" lineHeight="1">
                            {label}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </>
                ) : (
                  <Flex
                    borderRadius="14px"
                    bgColor="rgba(98,73,52,0.72)"
                    px="16px"
                    py="16px"
                    wrap="wrap"
                    alignItems="center"
                    gap="8px 10px"
                  >
                    <Text color="#FFFFFF" fontSize="16px" lineHeight="1.65" whiteSpace="pre-line">
                      {FROG_ACTIVE_CLUE_TEXT}
                    </Text>
                  </Flex>
                )}
              </Flex>
              {isSunbeastHintTalkVisible ? (
                <Flex
                  position="absolute"
                  inset="0"
                  zIndex={12}
                  direction="column"
                  justifyContent="flex-end"
                  cursor="pointer"
                  onClick={advanceSunbeastHintTalk}
                >
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={sunbeastHintTalkStep === 0 ? "mai" : "beigo"}
                      frameIndex={sunbeastHintTalkStep === 0 ? sunbeastHintTalkFrameIndex : 2}
                    />
                  </Flex>
                  <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                    <Text color="white" fontWeight="700">
                      {sunbeastHintTalkStep === 0 ? "小麥" : "小貝狗"}
                    </Text>
                    <Flex flex="1" minH="0" direction="column" justifyContent="center">
                      <Text color="white" fontSize="16px" lineHeight="1.5">
                        {sunbeastHintTalkStep === 0 ? (
                          "這是下一隻小日獸的提示嗎"
                        ) : (
                          selectedHintTalkReply
                        )}
                      </Text>
                    </Flex>
                    <EventContinueAction
                      label="點擊繼續"
                      onClick={advanceSunbeastHintTalk}
                    />
                  </EventDialogPanel>
                </Flex>
              ) : null}
              <Flex
                position="absolute"
                left="0"
                bottom={isSunbeastHintTalkVisible ? `calc(${EVENT_DIALOG_HEIGHT} + 12px)` : "32px"}
                zIndex={14}
                alignItems="center"
              >
                <Flex
                  as="button"
                  h="40px"
                  w="104px"
                  borderRadius="0 4px 4px 0"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 4px 7px rgba(10,10,10,0.25)"
                  cursor="pointer"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="#FFFFFF" fontSize="28px" lineHeight="0.9" transform="translateY(-1px)">
                    ‹
                  </Text>
                  <Text color="#FFFFFF" fontSize="17px" fontWeight="400">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      );
      const sunbeastCollectionSection = (
        <Flex
          ref={sunbeastCollectionRootRef}
          position="relative"
          w="100%"
          minH="0"
          overflow={isSunbeastShadowPointerStep ? "visible" : "hidden"}
        >
          <Flex
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            w="100%"
            pointerEvents="none"
            opacity={1}
          >
            <img
              src="/images/diary/diary_bg.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "fill", objectPosition: "left top" }}
            />
          </Flex>
          <Flex position="relative" zIndex={1} flex="1" minW="0" minH="0" pl="0" pr="0" pt="0" pb="0">
            <Flex
              direction="column"
              flex="1"
              minH="0"
              pl="34px"
              pr="16px"
              pt="18px"
              pb="18px"
              overflow={isSunbeastShadowPointerStep ? "visible" : "hidden"}
            >
              <Flex
                alignItems="center"
                justifyContent="space-between"
                gap="8px"
                wrap="wrap"
                pb="14px"
                borderBottom="1px solid rgba(156,119,90,0.12)"
              >
                {visibleSunbeastFilters.map((filter) => {
                  const isActive = filter.id === activeSunbeastFilter;
                  return (
                    <Flex
                      key={filter.id}
                      as="button"
                      h="44px"
                      px={isActive ? "18px" : "6px"}
                      minW={isActive ? "94px" : "auto"}
                      borderRadius={isActive ? "999px" : "0"}
                      border={isActive ? "1.5px solid #B88D61" : "none"}
                      bgColor={isActive ? "#FDF6D8" : "transparent"}
                      alignItems="center"
                      justifyContent="center"
                      onClick={() => {
                        if (isSunbeastFirstRevealAnimating || isSunbeastCollectionBlocked || isSunbeastShadowPointerStep) return;
                        setActiveSunbeastFilter(filter.id);
                      }}
                      opacity={isSunbeastFirstRevealAnimating || isSunbeastShadowGuideVisible ? 0.5 : 1}
                    >
                      <Text color="#9D7859" fontSize="16px" fontWeight="700" lineHeight="1">
                        {filter.label}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>

              <Flex
                flex="1"
                minH="0"
                overflowY={isSunbeastShadowPointerStep ? "visible" : "auto"}
                pt="16px"
                pr="2px"
                css={{ scrollbarWidth: "none" }}
              >
                <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="12px" w="100%" alignContent="start">
                  {visibleCollectionCards.map((card) => (
                    <Flex
                      ref={(node) => {
                        sunbeastCardRefs.current[card.id] = node;
                        if (card.id === sunbeastShadowGuideTargetId && node && isSunbeastShadowPointerStep) {
                          window.requestAnimationFrame(measureSunbeastShadowTarget);
                        }
                      }}
                      key={card.id}
                      data-sunbeast-card-id={card.id}
                      as="button"
                      direction="column"
                      alignItems="center"
                      justifyContent="flex-start"
                      bgColor={card.state === "hint" ? "#FFF8EA" : "#FFFFFF"}
                      minH="122px"
                      px="8px"
                      pt="14px"
                      pb={isSunbeastNaotaroGuideStep && card.id === "naotaro" ? "28px" : "12px"}
                      gap="10px"
                      position="relative"
                      zIndex={isSunbeastShadowPointerStep && card.id === sunbeastShadowGuideTargetId ? 11 : undefined}
                      opacity={1}
                      border={card.state === "hint" ? "1.5px solid rgba(184,141,97,0.55)" : "1px solid transparent"}
                      boxShadow={
                        isSunbeastShadowPointerStep && card.id === sunbeastShadowGuideTargetId
                          ? "0 0 0 4px rgba(255,255,255,0.86), 0 12px 26px rgba(46,36,26,0.34)"
                          : card.state === "hint"
                            ? "0 8px 18px rgba(128,98,72,0.12)"
                            : undefined
                      }
                      cursor={
                        card.isClickable === false ||
                        isSunbeastFirstRevealAnimating ||
                        (isSunbeastShadowGuideVisible &&
                          (!isSunbeastShadowPointerStep || card.id !== sunbeastShadowGuideTargetId))
                          ? "default"
                          : "pointer"
                      }
                      onClick={() => {
                        if (isSunbeastShadowGuideVisible) {
                          if (!isSunbeastShadowPointerStep || card.id !== sunbeastShadowGuideTargetId) return;
                          openSunbeastHintCard(card);
                          return;
                        }
                        if (isSunbeastFirstRevealAnimating || card.isClickable === false) return;
                        if (isSunbeastNaotaroGuideStep) {
                          if (card.id !== "naotaro") return;
                          setSunbeastIntroStep(null);
                          setSelectedSunbeastCardId("naotaro");
                          setSunbeastView("detail-naotaro");
                          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "dialog" : "complete");
                          return;
                        }
                        const nextView = getSunbeastDetailView(card);
                        setSelectedSunbeastCardId(card.id);
                        setSunbeastView(nextView);
                        if (nextView === "detail-naotaro") {
                          setSunbeastDetailRevealStep(isSunbeastGuidedMode ? "complete" : "complete");
                        } else if (nextView === "detail-chicken") {
                          setSunbeastDetailRevealStep("complete");
                        }
                      }}
                    >
                      {card.state === "hint" ? (
                        <Flex
                          position="absolute"
                          right="6px"
                          top="6px"
                          h="20px"
                          px="7px"
                          borderRadius="999px"
                          bgColor="#DABF8A"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="#806248" fontSize="11px" fontWeight="800" lineHeight="1">
                            線索
                          </Text>
                        </Flex>
                      ) : null}
                      <Flex h="72px" alignItems="center" justifyContent="center">
                        {card.state === "discovered" ? (
                          <Flex w="72px" h="72px" alignItems="center" justifyContent="center">
                            <img
                              src={card.imagePath ?? "/images/428出圖/拍照動物/黃金獵犬.png"}
                              alt={card.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            />
                          </Flex>
                        ) : card.state === "hint" ? (
                          <Flex
                            w="72px"
                            h="72px"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="999px"
                            bgColor="rgba(218,191,138,0.18)"
                          >
                            <img
                              src={card.imagePath ?? FROG_SHADOW_IMAGE_PATH}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", opacity: 0.94 }}
                            />
                          </Flex>
                        ) : (
                          <Flex
                            w="58px"
                            h="58px"
                            borderRadius="12px"
                            bgColor="#9D7859"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="white" fontSize="28px" fontWeight="500" lineHeight="1">
                              ?
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                      <Text
                        color="#9D7859"
                        fontSize={card.state === "hint" ? "15px" : "18px"}
                        fontWeight={card.state === "hint" ? "700" : "500"}
                        lineHeight="1"
                        textAlign="center"
                      >
                        {card.state === "hint" ? "有線索" : card.name}
                      </Text>
                      {isSunbeastNaotaroGuideStep && card.id === "naotaro" ? (
                        <Flex
                          position="absolute"
                          left="50%"
                          top="-6px"
                          transform="translateX(-50%)"
                          color="#A57C58"
                          fontSize="28px"
                          lineHeight="1"
                          pointerEvents="none"
                          zIndex={2}
                          animation={`${fingerUpSwipe} 1s ease-in-out infinite`}
                        >
                          <TbHandFinger />
                        </Flex>
                      ) : null}
                    </Flex>
                  ))}
                </Grid>
              </Flex>
              <Flex pt="14px" justifyContent="center" flexShrink={0}>
                <Flex
                  as="button"
                  h="44px"
                  minW="132px"
                  px="20px"
                  borderRadius="999px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                  gap="8px"
                  boxShadow="0 6px 14px rgba(78,55,31,0.12)"
                  onClick={handleSunbeastTopBack}
                >
                  <Text color="white" fontSize="26px" fontWeight="400" lineHeight="1" transform="translateY(-2px)">
                    ‹
                  </Text>
                  <Text color="white" fontSize="16px" fontWeight="700" lineHeight="1">
                    返回
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      );
      const isSunbeastDetailView = !showSunbeastIntroDialog && sunbeastView !== "collection";
      const sunbeastShadowMaskWidth =
        sunbeastSpotlightSize.width || sunbeastSpotlightRootRef.current?.clientWidth || 360;
      const sunbeastShadowMaskHeight =
        sunbeastSpotlightSize.height || sunbeastSpotlightRootRef.current?.clientHeight || 640;
      const sunbeastShadowMaskRect =
        sunbeastShadowTargetRect ?? {
          left: sunbeastShadowMaskWidth * (sunbeastShadowGuideTargetId === "chicken" ? 0.71 : 0.425),
          top: sunbeastShadowMaskHeight * 0.205,
          width: sunbeastShadowMaskWidth * 0.235,
          height: sunbeastShadowMaskHeight * 0.145,
        };

      return (
        <Flex
          ref={sunbeastSpotlightRootRef}
          position="relative"
          h="100%"
          minH="0"
          overflow="hidden"
          bgColor="#F6F0E4"
        >
          <Flex
            position="absolute"
            inset="0"
            opacity={0.62}
            bgImage={[
              "radial-gradient(circle at 28px 24px, rgba(183,155,128,0.22) 0 4px, transparent 5px)",
              "radial-gradient(circle at 104px 66px, rgba(183,155,128,0.15) 0 3px, transparent 4px)",
              "radial-gradient(circle at 172px 38px, rgba(183,155,128,0.18) 0 3px, transparent 4px)",
            ].join(",")}
            bgSize="164px 164px"
          />
          <Flex
            position="relative"
            zIndex={1}
            direction="column"
            flex="1"
            minH="0"
            pl={isSunbeastDetailView ? "0" : "16px"}
            pr="0"
            pt={isSunbeastDetailView ? "0" : "18px"}
          >
            {isSunbeastDetailView ? null : (
              <Flex alignItems="center" justifyContent="space-between" minH="52px">
                <Flex w="84px" />
                <Text color="#9D7859" fontSize="26px" fontWeight="700" lineHeight="1">
                  小日獸們
                </Text>
                <Flex w="84px" />
              </Flex>
            )}

            <Flex position="relative" flex="1" minH="0" mt={isSunbeastDetailView ? "0" : "8px"}>
              {showSunbeastIntroDialog || sunbeastView === "collection" ? (
                sunbeastCollectionSection
              ) : (
                <Flex
                  position="relative"
                  flex="1"
                  minH="0"
                >
                  {sunbeastDetailSection}
                  {((isNaotaroDialogOpen && !shouldUseInlinePhotoDialog) || isNaotaroUnlockOverlayOpen) &&
                  !shouldUseInlineRevealPanel ? (
                    <Flex
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      zIndex={8}
                      bgImage="linear-gradient(to top, rgba(92,63,40,0.88) 0%, rgba(92,63,40,0.82) 34%, rgba(92,63,40,0.5) 62%, rgba(92,63,40,0.14) 82%, rgba(92,63,40,0) 100%)"
                      pointerEvents="none"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.72s ease-out both` : undefined}
                    />
                  ) : null}
                  {isNaotaroDialogOpen && !shouldUseInlinePhotoDialog ? (
                    <Flex
                      position="absolute"
                      left="0"
                      right="0"
                      top="260px"
                      bottom="0"
                      zIndex={9}
                      bgColor="#BD9A7E"
                      px="22px"
                      pt="24px"
                      pb="116px"
                      direction="column"
                      alignItems="center"
                      gap="16px"
                      overflow="hidden"
                      boxShadow="0 -10px 24px rgba(55,40,27,0.18)"
                    >
                      <Flex
                        bgColor="#FFFDF9"
                        borderRadius="4px"
                        p="10px"
                        transform="rotate(-3deg)"
                        boxShadow="0 10px 18px rgba(88,59,33,0.18)"
                        w="168px"
                        minH="198px"
                        position="relative"
                        overflow="visible"
                        flexShrink={0}
                        animation={`${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`}
                        transformOrigin="50% 100%"
                      >
                        <Flex
                          position="absolute"
                          top="-8px"
                          left="50%"
                          transform="translateX(-50%) rotate(2deg)"
                          w="70px"
                          h="16px"
                          bgColor="#E7D7C4"
                          opacity={0.95}
                        />
                        <Flex direction="column" gap="9px" w="100%" h="100%">
                          <Flex
                            w="100%"
                            h="122px"
                            borderRadius="3px"
                            overflow="hidden"
                            bgColor="#DDD2C6"
                            backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                          />
                          <Flex direction="column" alignItems="center" gap="5px">
                            <Text color="#9D7859" fontSize="15px" fontWeight="700" lineHeight="1">
                              直太郎
                            </Text>
                            <Text color="#F2C84B" fontSize="19px" lineHeight="1">
                              ★ ★ ★
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                      <Flex
                        w="100%"
                        borderRadius="4px"
                        bgColor="#FFFFFF"
                        px="14px"
                        py="12px"
                        direction="column"
                        gap="6px"
                        boxShadow="0 4px 10px rgba(109,82,55,0.08)"
                      >
                        <Text color="#806248" fontSize="16px" fontWeight="700" lineHeight="1.2">
                          拍到的照片
                        </Text>
                        <Text color="#806248" fontSize="13px" lineHeight="1.45">
                          早上拍下來的直太郎照片出現在這裡。
                        </Text>
                      </Flex>
                    </Flex>
                  ) : null}
                  {isNaotaroUnlockOverlayOpen && !shouldUseInlineRevealPanel ? (
                    <Flex
                      position="absolute"
                      left="0"
                      right="0"
                      top="260px"
                      bottom="0"
                      zIndex={9}
                      bgColor="#BD9A7E"
                      px="20px"
                      pt="18px"
                      pb="104px"
                      direction="column"
                      gap="12px"
                      overflow="hidden"
                      boxShadow="0 -10px 24px rgba(55,40,27,0.18)"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.66s ease-out both` : undefined}
                    >
                      <Flex
                        as="button"
                        bgColor={isDiaryUnlockedInReveal ? "#FFFFFF" : "#806248"}
                        borderRadius="4px"
                        px="12px"
                        py="10px"
                        alignItems="center"
                        gap="12px"
                        transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                        animation={isDiaryUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                        boxShadow={isDiaryUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                        onClick={() => {
                          if (!isDiaryUnlockedInReveal) return;
                          setActiveTab("journal");
                          setJournalView("entry-bai-1");
                        }}
                        cursor={isDiaryUnlockedInReveal ? "pointer" : "default"}
                      >
                        <Flex
                          w="68px"
                          h="48px"
                          flexShrink={0}
                          borderRadius="4px"
                          overflow="hidden"
                          bgColor="#EFE6D9"
                        >
                          <img
                            src="/images/428出圖/漫畫格/第一章/地上的筆記本.png"
                            alt="相關的日記"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </Flex>
                        <Flex direction="column" flex="1" minW="0" gap="4px">
                          <Text color={isDiaryUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                            相關的日記
                          </Text>
                          <Text color={isDiaryUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                            滑雪板上捷運時的小插曲，似乎跟直太郎很像。
                          </Text>
                        </Flex>
                        <Flex
                          h="22px"
                          px="12px"
                          borderRadius="999px"
                          bgColor={isDiaryUnlockedInReveal ? "#806248" : "rgba(255,255,255,0.18)"}
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                          flexShrink={0}
                        >
                          <Text color="white" fontSize="11px" fontWeight="700" lineHeight="1">
                            閱讀
                          </Text>
                        </Flex>
                      </Flex>
                      {isFirstPhotoDiaryRevealMode ? null : (
                        <Flex direction="column" gap="10px">
                          <Flex
                          minH="72px"
                          borderRadius="4px"
                          bgColor={isStreetUnlockedInReveal ? "#FFFFFF" : "#806248"}
                          px="12px"
                          py="10px"
                          alignItems="center"
                          gap="12px"
                          transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                          animation={isStreetUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                          boxShadow={isStreetUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                        >
                          <Flex w="68px" h="48px" flexShrink={0} borderRadius="4px" overflow="hidden" bgColor="#EFE6D9">
                            <img
                              src="/walk/Sidewalk_Day.png"
                              alt="街道"
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </Flex>
                          <Flex direction="column" flex="1" minW="0" gap="4px">
                            <Text color={isStreetUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                              新的地點
                            </Text>
                            <Text color={isStreetUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                              街道，是直太郎很喜歡散步的地方。
                            </Text>
                          </Flex>
                          </Flex>
                          <Flex
                          as="button"
                          minH="72px"
                          borderRadius="4px"
                          bgColor={isClueUnlockedInReveal ? "#FFFFFF" : "#806248"}
                          px="12px"
                          py="10px"
                          alignItems="center"
                          gap="12px"
                          transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                          animation={isClueUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                          boxShadow={isClueUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                          onClick={() => {
                            if (!isClueUnlockedInReveal) return;
                            setSelectedSunbeastCardId("frog");
                            setSunbeastHintTalkStep(0);
                            setIsSunbeastHintTalkVisible(true);
                            setSunbeastView("detail-unknown");
                            setSunbeastDetailRevealStep("complete");
                          }}
                        >
                          <Flex w="68px" h="48px" flexShrink={0} alignItems="center" justifyContent="center" gap="8px">
                            <img
                              src="/images/animals/demo_cat_shadow.png"
                              alt="貓線索"
                              style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                            />
                            <img
                              src={FROG_SHADOW_IMAGE_PATH}
                              alt="青蛙線索"
                              style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                            />
                            <img
                              src={ROOSTER_SHADOW_IMAGE_PATH}
                              alt="公雞線索"
                              style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                            />
                          </Flex>
                          <Flex direction="column" flex="1" minW="0" gap="4px">
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                              小日獸行蹤
                            </Text>
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                              {isSunbeastBEventEnabled() ? SUNBEAST_B_CLUE_SUMMARY_TEXT : FROG_ACTIVE_CLUE_TEXT}
                            </Text>
                          </Flex>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  ) : null}
                  {(((isNaotaroDialogOpen && !shouldUseInlinePhotoDialog) || isNaotaroUnlockOverlayOpen) &&
                    !shouldUseInlineRevealPanel) ? (
                    <Flex
                      position="absolute"
                      inset="0"
                      zIndex={10}
                      direction="column"
                      justifyContent="flex-end"
                      cursor={sunbeastDetailRevealStep === "dialog" ? "pointer" : undefined}
                      onClick={sunbeastDetailRevealStep === "dialog" ? advanceNaotaroRevealFooter : undefined}
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.62s ease-out both` : undefined}
                    >
                      <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                        <Flex flex="1" minH="0" direction="column" justifyContent="center">
                          <Text color="white" fontSize="16px" lineHeight="1.5" textAlign="center">
                            {naotaroRevealFooterText}
                          </Text>
                        </Flex>
                        {sunbeastDetailRevealStep === "dialog" ? (
                          <EventContinueAction
                            label="點擊繼續"
                            onClick={advanceNaotaroRevealFooter}
                          />
                        ) : null}
                      </EventDialogPanel>
                    </Flex>
                  ) : null}
                </Flex>
              )}
            </Flex>
          </Flex>

          {isSunbeastShadowPointerStep ? (
            <>
              <Flex
                position="absolute"
                inset="0"
                zIndex={20}
                pointerEvents="auto"
                cursor="pointer"
                onClick={(event) => {
                  if (!activeShadowGuideCard) return;
                  const overlayRect = event.currentTarget.getBoundingClientRect();
                  const clickX =
                    ((event.clientX - overlayRect.left) / overlayRect.width) * sunbeastShadowMaskWidth;
                  const clickY =
                    ((event.clientY - overlayRect.top) / overlayRect.height) * sunbeastShadowMaskHeight;
                  const targetLeft = sunbeastShadowMaskRect.left - 12;
                  const targetTop = sunbeastShadowMaskRect.top - 12;
                  const targetRight = sunbeastShadowMaskRect.left + sunbeastShadowMaskRect.width + 12;
                  const targetBottom = sunbeastShadowMaskRect.top + sunbeastShadowMaskRect.height + 12;
                  if (
                    clickX >= targetLeft &&
                    clickX <= targetRight &&
                    clickY >= targetTop &&
                    clickY <= targetBottom
                  ) {
                    openSunbeastHintCard(activeShadowGuideCard);
                  }
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${Math.max(1, Math.round(sunbeastShadowMaskWidth))} ${Math.max(1, Math.round(sunbeastShadowMaskHeight))}`}
                  preserveAspectRatio="none"
                  style={{ display: "block" }}
                >
                  <defs>
                    <mask
                      id="sunbeast-shadow-guide-mask"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width={sunbeastShadowMaskWidth}
                      height={sunbeastShadowMaskHeight}
                    >
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={sunbeastShadowMaskRect.left - 8}
                        y={sunbeastShadowMaskRect.top - 8}
                        width={sunbeastShadowMaskRect.width + 16}
                        height={sunbeastShadowMaskRect.height + 16}
                        rx="8"
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.24)"
                    mask="url(#sunbeast-shadow-guide-mask)"
                  />
                </svg>
              </Flex>
              <Flex
                position="absolute"
                left={`${sunbeastShadowMaskRect.left - 50}px`}
                top={`${sunbeastShadowMaskRect.top + 52}px`}
                zIndex={21}
                w="44px"
                h="44px"
                pointerEvents="none"
                animation={`${diaryEntryPointerNudge} 1.02s ease-in-out infinite`}
              >
                <img
                  src="/images/pointer_up.png"
                  alt=""
                  aria-hidden="true"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </Flex>
            </>
          ) : null}

          {showSunbeastIntroDialog ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={9}
              direction="column"
              justifyContent="flex-end"
              cursor={sunbeastIntroStep === 0 ? "pointer" : undefined}
              onClick={sunbeastIntroStep === 0 ? () => setSunbeastIntroStep(1) : undefined}
            >
              <Flex
                position="absolute"
                left="14px"
                bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                zIndex={6}
                pointerEvents="none"
              >
                <EventAvatarSprite
                  spriteId={introAvatarSpriteId}
                  frameIndex={introAvatarFrameIndex}
                />
              </Flex>
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                <Text color="white" fontWeight="700">
                  {introSpeaker}
                </Text>
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {isFirstPhotoDiaryRevealMode && sunbeastIntroStep === 0 ? (
                      <>
                        黃金獵犬，出現在
                        <Text as="span" color="#F6D982" fontWeight="800">
                          交換日記
                        </Text>
                        的
                        <Text as="span" color="#9DE0C3" fontWeight="800">
                          小日獸
                        </Text>
                        裡了
                      </>
                    ) : (
                      introText
                    )}
                  </Text>
                </Flex>
                {sunbeastIntroStep === 0 ? (
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={() => setSunbeastIntroStep(1)}
                  />
                ) : null}
              </EventDialogPanel>
            </Flex>
          ) : null}
          {ENABLE_SUNBEAST_GUIDANCE_SYSTEM && isSunbeastShadowGuideVisible && !isSunbeastShadowPointerStep ? (
            <>
              <Flex position="absolute" inset="0" zIndex={8} bgColor="rgba(0, 0, 0, 0.22)" pointerEvents="auto" />
              {(
                <Flex
                  position="absolute"
                  inset="0"
                  zIndex={9}
                  direction="column"
                  justifyContent="flex-end"
                  cursor="pointer"
                  onClick={() => {
                    if (sunbeastShadowGuideStep === 0) {
                      setSunbeastShadowGuideStep(1);
                      return;
                    }
                    setSunbeastShadowGuideStep(2);
                  }}
                >
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={sunbeastShadowGuideStep === 0 ? "mai" : "beigo"}
                      frameIndex={sunbeastShadowGuideStep === 0 ? 36 : 0}
                    />
                  </Flex>
                  <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                    <Text color="white" fontWeight="700">
                      {sunbeastShadowGuideStep === 0 ? "小麥" : "小貝狗"}
                    </Text>
                    <Flex flex="1" minH="0" direction="column" justifyContent="center">
                      <Text color="white" fontSize="16px" lineHeight="1.5">
                        {sunbeastShadowGuideStep === 0 ? (
                          <>
                            除了直太郎外，
                            <br />
                            出現了兩隻小日獸的影子！
                          </>
                        ) : (
                          <>熬！點點看牠們，有遇見牠們的線索。</>
                        )}
                      </Text>
                    </Flex>
                    <EventContinueAction
                      label="點擊繼續"
                      onClick={() => {
                        if (sunbeastShadowGuideStep === 0) {
                          setSunbeastShadowGuideStep(1);
                          return;
                        }
                        setSunbeastShadowGuideStep(2);
                      }}
                    />
                  </EventDialogPanel>
                </Flex>
              )}
            </>
          ) : null}
        </Flex>
      );
    }

    const diaryCards = [
      {
        id: "bai-entry-1",
        title: "滑雪板搭捷運",
        unlocked: hasBaiEntry1,
        imagePath: "/images/428出圖/日記/demo_dirary_01_01.jpg",
      },
      {
        id: "bai-entry-2",
        title: "搬家",
        unlocked: hasBaiEntry2,
        imagePath: "/images/diary/diary_demo.jpg",
      },
      {
        id: "bai-entry-3",
        title: "辦公室裡的公雞",
        unlocked: hasBaiEntry3,
        imagePath: ROOSTER_IMAGE_PATH,
      },
      {
        id: "bai-entry-4",
        title: "拍桌反對的山羊",
        unlocked: hasBaiEntry4,
        imagePath: "/images/diary/diary_demo.jpg",
      },
    ] as const;
    const nextDiaryCatalogTalkLine =
      nextDiaryCatalogTalkIndex === null ? null : NEXT_DIARY_CATALOG_TALK_LINES[nextDiaryCatalogTalkIndex] ?? null;
    const isNextDiaryCatalogTalkAvatarVisible = Boolean(nextDiaryCatalogTalkLine?.spriteId);
    if (journalView === "entry-bai-2-fragment") {
      const completeIncompleteDiaryReaction = () => {
        setIsIncompleteDiaryReactionVisible(false);
        if (isFirstPhotoDiaryRevealMode) {
          onDiaryRevealEntryComplete?.();
        }
      };
	      return (
	        <VisualDiaryBookPage
	          title="???"
	          pages={[
	            {
	              imagePath: "next-diary-fragment-first",
	              text: hasBaiEntry2SecondFragment
	                ? NEXT_DIARY_FIRST_FRAGMENT.firstText
	                : "[[搬家]]那天，[[家裡]]亂成一團。\n紙箱堆得[[到處都是]]。看到客廳桌上有[[一杯]]便利商店買回來的[[手搖]]。",
                textEffect: hasBaiEntry2SecondFragment ? undefined : "damaged-fragment",
	            },
	          ]}
	          showBackButton={!isFirstPhotoDiaryRevealMode}
	          onBack={() => setJournalView("list")}
	          overlay={isIncompleteDiaryReactionVisible ? (
	          <Flex
	            position="absolute"
	            inset="0"
            zIndex={20}
            direction="column"
            justifyContent="flex-end"
            pointerEvents="auto"
            cursor="pointer"
            onClick={completeIncompleteDiaryReaction}
          >
            <Flex
              position="absolute"
              left="14px"
              bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
              zIndex={6}
              pointerEvents="none"
            >
              <EventAvatarSprite
                spriteId={INCOMPLETE_DIARY_REACTION_LINE.spriteId}
                frameIndex={INCOMPLETE_DIARY_REACTION_LINE.frameIndex}
              />
            </Flex>
            <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
              <Text color="white" fontWeight="700">
                {INCOMPLETE_DIARY_REACTION_LINE.speaker}
              </Text>
              <Flex flex="1" minH="0" direction="column" justifyContent="center">
                <Text color="white" fontSize="16px" lineHeight="1.5">
                  {INCOMPLETE_DIARY_REACTION_LINE.text}
                </Text>
              </Flex>
              <EventContinueAction
                label="點擊繼續"
                onClick={completeIncompleteDiaryReaction}
	              />
	            </EventDialogPanel>
	          </Flex>
	          ) : null}
	        />
	      );
	    }

    if (
      journalView === "entry-bai-1" ||
      journalView === "entry-bai-2" ||
      journalView === "entry-bai-3" ||
      journalView === "entry-bai-4"
    ) {
      const isSecondEntry = journalView === "entry-bai-2";
      const isThirdEntry = journalView === "entry-bai-3";
      const isFourthEntry = journalView === "entry-bai-4";
      const activeBodyLines = isFourthEntry
        ? BAI_ENTRY_4_BODY_LINES
        : isThirdEntry
          ? BAI_ENTRY_3_BODY_LINES
          : isSecondEntry
            ? BAI_ENTRY_2_BODY_LINES
            : BAI_ENTRY_1_BODY_LINES;
      const activeEntryDate = isFourthEntry
        ? "XX年X月X日 會議室那天"
        : isThirdEntry
          ? "XX年X月X日 忙到忘記吃飯"
          : isSecondEntry
            ? "XX年X月X日 搬家那天"
            : "XX年X月X日 去滑雪那天";
      const activeEntryTitle = isFourthEntry
        ? "拍桌反對的山羊"
        : isThirdEntry
          ? "忘記吃飯也不壞？"
          : isSecondEntry
            ? "搬家的手搖"
            : "滑雪板搭捷運";
      const activeEntrySketch = isFourthEntry ? (
        <>
          會議桌的速寫，
          <br />
          上面畫了一隻拍桌反對的山羊
        </>
      ) : isThirdEntry ? (
        <>
          辦公室桌邊的速寫，
          <br />
          上面畫了一隻很專心的公雞
        </>
      ) : isSecondEntry ? (
        <>
          搬家紙箱旁的速寫，
          <br />
          旁邊畫了一隻滿臉通紅的青蛙
        </>
      ) : (
        <>
          滑雪板上捷運，小白一臉慌張的日記插圖，
          <br />
          旁邊畫了一隻黃金獵犬
        </>
      );
      const talkLine = activeDiaryReadTalkLines[diaryReadTalkIndex];
      const isTalkAvatarVisible = isDiaryReadTalkVisible && Boolean(talkLine?.spriteId);
      if (isComicReadMode) {
        return (
          <Flex direction="column" h="100%" minH="0" position="relative" overflow="hidden" bgColor="#0F0F0F">
              <Flex
                ref={comicScrollRef}
                flex="1"
                minH="0"
                overflowY="auto"
              onScroll={handleComicScroll}
              css={{ scrollbarWidth: "none" }}
            >
              <Flex direction="column" w="100%" alignItems="stretch" gap="0" py="0">
                {DIARY_COMIC_PAGES.map((pagePath, index) => (
                  <Flex
                    key={pagePath}
                    w="100%"
                    overflow="hidden"
                    bgColor="#000"
                    minH="100%"
                  >
                    <img
                      src={pagePath}
                      alt={`日記漫畫第 ${index + 1} 頁`}
                      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    />
                  </Flex>
                ))}
              </Flex>
              </Flex>

            {isDiaryReadTalkVisible ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={12}
                direction="column"
                justifyContent="flex-end"
                cursor="pointer"
                onClick={advanceDiaryReadTalk}
              >
                {isTalkAvatarVisible ? (
                  <Flex
                    position="absolute"
                    left="14px"
                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                    zIndex={6}
                    pointerEvents="none"
                  >
                    <EventAvatarSprite
                      spriteId={talkLine.spriteId}
                      frameIndex={talkLine.frameIndex}
                    />
                  </Flex>
                ) : null}
                <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                  {talkLine.showName === false ? null : (
                    <Text color="white" fontWeight="700">
                      {talkLine.speaker}
                    </Text>
                  )}
                  <Flex flex="1" minH="0" direction="column" justifyContent="center">
                    <Text color="white" fontSize="16px" lineHeight="1.5">
                      {talkLine.text}
                    </Text>
                  </Flex>
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={advanceDiaryReadTalk}
                  />
                </EventDialogPanel>
              </Flex>
            ) : null}

            {!isComicControlsVisible ? (
              <Flex
                position="absolute"
                left="24%"
                right="24%"
                top="24%"
                bottom="24%"
                zIndex={6}
                onClick={() => setIsComicControlsVisible(true)}
              />
            ) : null}

            {isComicControlsVisible ? (
              <>
                <Flex position="absolute" top="10px" left="50%" transform="translateX(-50%)" px="12px" py="6px" borderRadius="999px" bgColor="rgba(70,55,40,0.75)" zIndex={8}>
                  <Text color="#FFF" fontSize="12px" fontWeight="700">
                    第 {comicPageIndex + 1} / {DIARY_COMIC_PAGES.length} 頁
                  </Text>
                </Flex>
                {showComicReadHint ? (
                  <Flex
                    position="absolute"
                    bottom="52px"
                    left="50%"
                    transform="translateX(-50%)"
                    px="14px"
                    py="6px"
                    borderRadius="999px"
                    bgColor="rgba(157,120,89,0.92)"
                    zIndex={8}
                  >
                    <Text color="#FFF" fontSize="14px" fontWeight="700">
                      往下滑動閱讀
                    </Text>
                  </Flex>
                ) : null}

                <Flex position="absolute" bottom="12px" left="50%" transform="translateX(-50%)" gap="8px" zIndex={8}>
                  <Flex as="button" px="12px" py="6px" borderRadius="999px" bgColor="rgba(70,55,40,0.75)" onClick={() => setIsComicControlsVisible(false)}>
                    <Text color="#FFF" fontSize="12px" fontWeight="700">隱藏操作</Text>
                  </Flex>
                  <Flex as="button" px="12px" py="6px" borderRadius="999px" bgColor="#9D7859" onClick={() => {
                    const currentIndex = getCurrentComicPageIndex();
                    const isReadFinished = currentIndex >= DIARY_COMIC_PAGES.length - 1;
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    if (isReadFinished) {
                      setIsDiaryReadTalkVisible(true);
                      setDiaryReadTalkIndex(0);
                      return;
                    }
                    setIsComicReadMode(false);
                    setComicPageIndex(0);
                  }}>
                    <Text color="#FFF" fontSize="12px" fontWeight="700">結束閱讀</Text>
                  </Flex>
                </Flex>
              </>
            ) : null}
          </Flex>
        );
	      }

		      if (journalView === "entry-bai-1") {
	          const shouldStageBaiEntry1Reveal =
	            isFirstPhotoDiaryRevealMode || isBaiEntry1NaotaroOpenReveal;
	          const hasRevealedBaiEntry1SecondPanel =
	            !shouldStageBaiEntry1Reveal || baiEntry1VisualPageIndex === 1;
	          const shouldRevealBaiEntry1Title = isBaiEntry1NaotaroOpenReveal;
	          const baiEntry1Pages = isBaiEntry1NaotaroOpenReveal
	            ? [
	                {
	                  ...BAI_ENTRY_1_VISUAL_PAGES[0],
	                  text: isBaiEntry1FirstTextRevealed
	                    ? BAI_ENTRY_1_VISUAL_PAGES[0].text
	                    : "帶著滑雪板要去滑雪，結果上捷運時，\n車門一直關不……",
	                  initialText: "帶著滑雪板要去滑雪，結果上捷運時，\n車門一直關不……",
	                  textEffect: isBaiEntry1FirstTextRevealed ? "restore-completion" as const : undefined,
	                },
	                BAI_ENTRY_1_VISUAL_PAGES[1],
	              ]
	            : BAI_ENTRY_1_VISUAL_PAGES;
		        const startEntryReadTalk = () => {
		          setDiaryReadTalkIndex(0);
		          setIsDiaryReadTalkVisible(true);
		        };

          if (isNextDiaryFragmentPreviewVisible) {
            return (
              <Flex
                position="relative"
                h="100%"
                minH="0"
                overflow="hidden"
                bgColor="#F7F0E4"
                bgImage={DIARY_PAGE_STRIPE_BACKGROUND}
                cursor="pointer"
                onClick={completeNextDiaryFragmentPreview}
              >
                <Flex
                  position="absolute"
                  right="0"
                  bottom="0"
                  w="90%"
                  h="calc(100% - 64px)"
                  overflow="hidden"
                  pointerEvents="none"
                >
                  <img
                    src="/images/diary/diary_bg.png"
                    alt="日記背景"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      objectPosition: "left bottom",
                      opacity: 0.98,
                      animation: `${diaryBgFloat} 12s ease-in-out infinite`,
                    }}
                  />
                </Flex>

                <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="16px" mt="8px">
                  <Flex justifyContent="center" alignItems="center" pb="10px">
                    <Flex
                      minW="178px"
                      h="40px"
                      px="20px"
                      borderRadius="8px"
                      bgColor="#A57C58"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontSize="14px" fontWeight="500">
                        下一篇日記線索
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px" mr="0">
                    <Flex
                      flex="1"
                      minH="0"
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      pl="48px"
                      pr="0"
                      pt="26px"
                      pb="18px"
                      gap="22px"
                    >
                      <Flex
                        w="100%"
                        maxW="328px"
                        borderRadius="5px 0 0 5px"
                        bgColor="#FFFDF9"
                        border="1px solid rgba(151,116,88,0.28)"
                        boxShadow="0 8px 18px rgba(80,54,33,0.1)"
                        overflow="hidden"
                        direction="column"
                      >
	                        <Flex w="100%" aspectRatio="577 / 362" overflow="hidden" bgColor="#EBE3DB">
	                          <MovingDiaryIllustration />
	                        </Flex>
	                        <Flex px="18px" py="18px" bgColor="#FFFDF9">
	                          <Text
	                            color="#94857E"
	                            fontSize="16px"
	                            fontWeight="700"
	                            lineHeight="1.45"
                            whiteSpace="pre-line"
                          >
                            只看得見一小段：
                            {"\n"}「搬家那天……」
                          </Text>
                        </Flex>
                      </Flex>

	                      <Flex
	                        w="100%"
	                        maxW="328px"
	                        aspectRatio="577 / 362"
	                        borderRadius="5px 0 0 5px"
	                        bgColor="#EBE3DB"
	                        border="1.5px dashed rgba(151,116,88,0.42)"
	                        alignItems="center"
	                        justifyContent="center"
                      >
                        <Text color="#A57C58" fontSize="30px" fontWeight="700" letterSpacing="0">
                          ?
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Flex position="relative" zIndex={5} justifyContent="center" pb="26px">
                    <Flex
                      as="button"
                      h="52px"
                      minW="204px"
                      px="30px"
                      borderRadius="6px"
                      bgColor="#7E6148"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      boxShadow="0 8px 18px rgba(80,54,33,0.18)"
                      onClick={(event) => {
                        event.stopPropagation();
                        completeNextDiaryFragmentPreview();
                      }}
                    >
                      <Text color="#FFFFFF" fontSize="18px" fontWeight="500" lineHeight="1">
                        繼續
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            );
          }

		        return (
		          <VisualDiaryBookPage
		            title={
		              shouldRevealBaiEntry1Title && !isBaiEntry1TitleRevealed
		              ? "???"
		                : "雪板卡住"
		            }
		            pages={baiEntry1Pages}
		            stagedReveal={shouldStageBaiEntry1Reveal}
		            isRevealComplete={hasRevealedBaiEntry1SecondPanel}
		            animateTitleChange={shouldRevealBaiEntry1Title}
		            fadeFirstPage={shouldRevealBaiEntry1Title}
		            rhythm={isBaiEntry1NaotaroOpenReveal ? "restoration" : "default"}
		            scrollBottomPadding={isBaiEntry1NaotaroOpenReveal && isDiaryReadTalkVisible ? 448 : 48}
		            showBackButton={!isFirstPhotoDiaryRevealMode}
		            onBack={() => {
		              setJournalView("list");
		              setBaiEntry1VisualPageIndex(0);
		              setIsBaiEntry1TitleRevealed(false);
		              setIsBaiEntry1FirstTextRevealed(false);
		              setIsBaiEntry1NaotaroOpenReveal(false);
		              setIsComicReadMode(false);
		              setIsComicControlsVisible(false);
		              setShowComicReadHint(false);
		              setComicPageIndex(0);
		            }}
		            onContinue={isBaiEntry1NaotaroOpenReveal ? undefined : startEntryReadTalk}
		            overlay={isDiaryReadTalkVisible ? (
		              <Flex
		                position="absolute"
		                inset="0"
		                zIndex={20}
		                direction="column"
		                justifyContent="flex-end"
		                pointerEvents="auto"
		                cursor="pointer"
		                onClick={advanceDiaryReadTalk}
		              >
		                {isTalkAvatarVisible ? (
		                  <Flex
		                    position="absolute"
		                    left="14px"
		                    bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
		                    zIndex={6}
		                    pointerEvents="none"
		                  >
		                    <EventAvatarSprite spriteId={talkLine.spriteId} frameIndex={talkLine.frameIndex} />
		                  </Flex>
		                ) : null}
		                <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
		                  {talkLine.showName === false ? null : (
		                    <Text color="white" fontWeight="700">
		                      {talkLine.speaker}
		                    </Text>
		                  )}
		                  <Flex flex="1" minH="0" direction="column" justifyContent="center">
		                    <Text color="white" fontSize="16px" lineHeight="1.5">
		                      {talkLine.text}
		                    </Text>
		                  </Flex>
		                  <EventContinueAction
		                    label="點擊繼續"
		                    onClick={advanceDiaryReadTalk}
		                  />
		                </EventDialogPanel>
		              </Flex>
		            ) : null}
		          />
		        );
		      }

	      return (
	        <Flex position="relative" h="100%" minH="0" overflow="hidden" bgColor="#F7F0E4">
          <Flex
            position="absolute"
            inset="0"
            bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
          />
          <Flex
            position="absolute"
            right="0"
            bottom="0"
            w="90%"
            h="calc(100% - 64px)"
            overflow="hidden"
            pointerEvents="none"
          >
            <img
              src="/images/diary/diary_bg.png"
              alt="日記背景"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "left bottom",
                opacity: 0.98,
                animation: `${diaryBgFloat} 12s ease-in-out infinite`,
              }}
            />
          </Flex>

          <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" mr="16px" mt="8px">
            <Flex justifyContent="space-between" alignItems="center" pb="10px">
              <Flex
                as="button"
                w="86px"
                h="38px"
                borderRadius="0 6px 6px 0"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
                onClick={() => {
                  setJournalView("list");
                  setIsComicReadMode(false);
                  setIsComicControlsVisible(false);
                  setShowComicReadHint(false);
                  setComicPageIndex(0);
                  setBaiEntry1VisualPageIndex(0);
                }}
              >
                <Text color="white" fontSize="22px" fontWeight="700" lineHeight="1">
                  ‹
                </Text>
              </Flex>
              <Flex
                minW="132px"
                h="40px"
                px="20px"
                borderRadius="8px"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontSize="16px" fontWeight="400">
                  交換日記
                </Text>
              </Flex>
            </Flex>

                <Flex position="relative" flex="1" minH="0" overflow="hidden" ml="10%" mt="12px" mr="0">
                  <Flex
                    flex="1"
                    minH="0"
                    direction="column"
                    overflowY="auto"
                    pl="48px"
                    pr="16px"
                    pt="50px"
                    pb={isGuidedJournalRevealMode ? "96px" : "18px"}
                    css={{ scrollbarWidth: "none" }}
                  >
                <Text color="#151515" fontSize="16px" fontWeight="400" lineHeight="1.5" mb="18px">
                  {activeEntryDate}
                </Text>
                <Text color="#6C5641" fontSize="20px" fontWeight="700" lineHeight="1.3" mb="18px">
                  {activeEntryTitle}
                </Text>
                <Flex
                  h="178px"
                  borderRadius="8px"
                  bgColor="#FAF3E7"
                  px="18px"
                  py="16px"
                  mb="28px"
                  alignItems="flex-end"
                >
                  <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6">
                    {activeEntrySketch}
                  </Text>
                </Flex>
                <Flex direction="column" gap="10px">
                  {activeBodyLines.map((line) => (
                    <Text key={line} color="#111111" fontSize="15px" fontWeight="400" lineHeight="1.55">
                      {line}
                    </Text>
                  ))}
                </Flex>
                </Flex>
              </Flex>
            </Flex>

            {(isGuidedJournalRevealMode || isThirdEntry) && !isDiaryReadTalkVisible ? (
              <Flex
                position="absolute"
                left="0"
                right="0"
                bottom="20px"
                zIndex={20}
                justifyContent="center"
                px="20px"
              >
                <Flex
                  as="button"
                  w="220px"
                  maxW="100%"
                  h="44px"
                  borderRadius="999px"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  boxShadow="0 8px 20px rgba(70,46,24,0.14)"
                  onClick={() => {
                    setDiaryReadTalkIndex(0);
                    setIsDiaryReadTalkVisible(true);
                  }}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">
                    繼續
                  </Text>
                </Flex>
              </Flex>
            ) : null}

            {isDiaryReadTalkVisible ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={20}
              direction="column"
              justifyContent="flex-end"
              pointerEvents="auto"
              cursor="pointer"
              onClick={advanceDiaryReadTalk}
            >
              {isTalkAvatarVisible ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite
                    spriteId={talkLine.spriteId}
                    frameIndex={talkLine.frameIndex}
                  />
                </Flex>
              ) : null}
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                {talkLine.showName === false ? null : (
                  <Text color="white" fontWeight="700">
                    {talkLine.speaker}
                  </Text>
                )}
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {talkLine.text}
                  </Text>
                </Flex>
                <EventContinueAction
                  label="點擊繼續"
                  onClick={advanceDiaryReadTalk}
                />
              </EventDialogPanel>
            </Flex>
          ) : null}
        </Flex>
      );
    }

    return (
      <Flex position="relative" h="100%" minH="0" overflow="hidden" bgColor="#F7F0E4">
        <Flex
          position="absolute"
          inset="0"
          bg="repeating-linear-gradient(116deg, #F7F0E4 0px, #F7F0E4 28px, #EEE2D0 28px, #EEE2D0 50px)"
        />
        <Flex
          position="absolute"
          right="0"
          bottom="0"
          w="90%"
          h="calc(100% - 64px)"
          overflow="hidden"
          pointerEvents="none"
        >
          <img
            src="/images/diary/diary_bg.png"
            alt="日記背景"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "left bottom",
              opacity: 0.98,
              animation: `${diaryBgFloat} 12s ease-in-out infinite`,
            }}
          />
        </Flex>
        <Flex
          position="relative"
          zIndex={1}
          flex="1"
          minH="0"
          direction="column"
          ml="0"
          mr="16px"
          mt="8px"
          mb="0"
        >
          <Flex justifyContent="space-between" alignItems="center" pb="10px">
            <Flex w="86px" h="38px" />
            <Flex
              minW="132px"
              h="40px"
              px="20px"
              borderRadius="8px"
              bgColor="#A57C58"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="white" fontSize="16px" fontWeight="400">
                交換日記
              </Text>
            </Flex>
          </Flex>

          <Flex
            position="relative"
            flex="1"
            minH="0"
            overflow="hidden"
            ml="10%"
            mt="12px"
            mr="0"
          >
            <Flex
              flex="1"
              minH="0"
              direction="column"
              gap="18px"
              overflowY="auto"
              pl="48px"
              pr="16px"
              pt="50px"
              pb="18px"
              css={{ scrollbarWidth: "none" }}
            >
            {diaryCards.map((card) => {
              const isRevealTargetCard = card.id === revealEntryId;
              const isFxLocked = isRevealTargetCard && journalUnlockFxStage === "locked";
              const isFxUnlocking = isRevealTargetCard && journalUnlockFxStage === "unlocking";
              const isCardOpenable =
                card.id === "bai-entry-1" ||
                card.id === "bai-entry-2" ||
                card.id === "bai-entry-3" ||
                card.id === "bai-entry-4";
              const shouldShowEntryPointer =
                (isPhotoDiaryRevealMode || isChickenPhotoDiaryRevealMode) &&
                isRevealTargetCard &&
                diaryRevealStep === "ready" &&
                journalUnlockFxStage === "done";
              const cardUnlocked =
                isFxLocked || isFxUnlocking
                  ? false
                  : card.unlocked || (isRevealTargetCard && journalUnlockFxStage === "done");
              const isIncompleteSecondEntryCard =
                card.id === "bai-entry-2" &&
                isBaiEntry2FragmentOpen &&
                !isFxLocked &&
                !isFxUnlocking &&
                !(isRevealTargetCard && journalUnlockFxStage === "done");
              const isNextDiaryCatalogRevealCard =
                isFirstPhotoDiaryRevealMode &&
                card.id === "bai-entry-2" &&
                nextDiaryCatalogRevealStage !== "idle";
              const isNextDiaryCatalogRevealing =
                isNextDiaryCatalogRevealCard && nextDiaryCatalogRevealStage === "revealing";
              const shouldShowNextDiaryCatalogPointer =
                isNextDiaryCatalogRevealCard &&
                (nextDiaryCatalogRevealStage === "ready" || nextDiaryCatalogRevealStage === "talked");
              const canOpenCard =
                (cardUnlocked || isIncompleteSecondEntryCard) &&
                isCardOpenable &&
                !isNextDiaryCatalogRevealing;
                return (
                  <Flex key={card.id} position="relative">
                    {shouldShowEntryPointer || shouldShowNextDiaryCatalogPointer ? (
                      <Flex
                        position="absolute"
                        left="-52px"
                        top="50%"
                        zIndex={3}
                        w="44px"
                        h="44px"
                        pointerEvents="none"
                        animation={`${diaryEntryPointerNudge} 1.12s ease-in-out infinite`}
                      >
                        <img
                          src="/images/pointer_up.png"
                          alt=""
                          aria-hidden="true"
                          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    ) : null}
                    <Flex
                      as="button"
	                      onClick={() => {
	                        if (!canOpenCard) return;
                          setIsBaiEntry1NaotaroOpenReveal(false);
                          if (isIncompleteSecondEntryCard) {
                            setJournalView("entry-bai-2-fragment");
                            if (isFirstPhotoDiaryRevealMode) {
                              setIsIncompleteDiaryReactionVisible(true);
                            }
                            return;
                          }
	                        if (card.id === "bai-entry-1") {
	                          setBaiEntry1VisualPageIndex(0);
	                          setJournalView("entry-bai-1");
	                        }
	                        if (card.id === "bai-entry-2") setJournalView("entry-bai-2");
	                        if (card.id === "bai-entry-3") setJournalView("entry-bai-3");
	                        if (card.id === "bai-entry-4") setJournalView("entry-bai-4");
	                      }}
                      cursor={canOpenCard ? "pointer" : "default"}
                      position="relative"
                      w="100%"
                      h="162px"
                      minH="162px"
                      flexShrink={0}
                      borderRadius="8px"
                      overflow="hidden"
                      bgColor="#FAF3E7"
                      border="1px solid rgba(205,192,177,0.22)"
                      animation={
                        isFxUnlocking
                          ? `${unlockPulse} 620ms ease-out 1`
                          : isNextDiaryCatalogRevealing
                            ? `${diaryCatalogCardPop} 620ms ease-out both, ${unlockPulse} 760ms ease-out 1`
                            : undefined
                      }
	                    >
	                      {cardUnlocked ? (
	                        card.id === "bai-entry-1" || card.id === "bai-entry-3" ? (
	                          <Flex h="100%" w="100%" bgColor="#EBE3DB" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#9D7859" fontSize="15px" fontWeight="800" lineHeight="1">
	                              {card.title}
	                            </Text>
	                          </Flex>
	                        ) : card.id === "bai-entry-4" ? (
	                          <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
	                              會議桌的速寫，
	                              <br />
	                              上面畫了一隻拍桌反對的山羊
	                            </Text>
	                          </Flex>
	                        ) : (
	                          <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
	                            <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
	                              搬家紙箱旁的速寫，
	                              <br />
	                              旁邊畫了一隻滿臉通紅的青蛙
	                            </Text>
	                          </Flex>
	                        )
                      ) : isIncompleteSecondEntryCard ? (
                        <Flex h="100%" w="100%" position="relative" overflow="hidden" bgColor="#FFFDF8">
                          <Flex
                            position="absolute"
                            inset="0"
                            bg="linear-gradient(180deg, rgba(255,253,249,0.34) 0%, rgba(255,253,249,0.86) 100%)"
                          />
                          <Flex
                            position="absolute"
                            left="0"
                            top="0"
                            w={hasBaiEntry2SecondFragment ? "56%" : "64%"}
                            h="70%"
                            overflow="hidden"
                            borderRight="2px dashed rgba(165,124,88,0.38)"
                            borderBottom="2px dashed rgba(165,124,88,0.38)"
                            bgColor="#E9DFD2"
                            clipPath="polygon(0 0, 100% 0, 92% 78%, 74% 70%, 62% 86%, 45% 74%, 0 86%)"
                            boxShadow="0 8px 14px rgba(80,54,33,0.1)"
                          >
                            <MovingDiaryIllustration />
                          </Flex>
                          {hasBaiEntry2SecondFragment ? (
                            <Flex
                              position="absolute"
                              right="0"
                              top="34px"
                              w="58%"
                              h="64%"
                              overflow="hidden"
                              borderLeft="2px dashed rgba(165,124,88,0.34)"
                              borderBottom="2px dashed rgba(165,124,88,0.34)"
                              bgColor="#E9DFD2"
                              clipPath="polygon(8% 0, 100% 0, 100% 86%, 84% 78%, 72% 90%, 56% 80%, 0 88%, 0 18%)"
                              boxShadow="0 8px 14px rgba(80,54,33,0.1)"
                            >
                              <MovingDiaryIllustration />
                            </Flex>
                          ) : null}
                          <Flex
                            position="absolute"
                            top="12px"
                            right="12px"
                            h="28px"
                            px="12px"
                            borderRadius="999px"
                            bgColor="#A57C58"
                            alignItems="center"
                            boxShadow="0 4px 10px rgba(80,54,33,0.12)"
                          >
                            <Text color="#FFFFFF" fontSize="12px" fontWeight="800" lineHeight="1">
                              殘缺篇章
                            </Text>
                          </Flex>
                          <Flex
                            position="absolute"
                            left="16px"
                            right="16px"
                            bottom="16px"
                            direction="column"
                            gap="6px"
                          >
                            <Text color="#8F6A4D" fontSize="16px" fontWeight="800" lineHeight="1">
                              {card.title}
                            </Text>
                            <Text color="#A57C58" fontSize="13px" fontWeight="600" lineHeight="1.45">
                              {hasBaiEntry2SecondFragment
                                ? "第一格已完整，第二格預告與第三格問號也浮現了。"
                                : "只浮現了第一格，後面的日記還缺著。"}
                            </Text>
                          </Flex>
                        </Flex>
	                      ) : (
                        <>
                          <Flex position="absolute" inset="0" bgColor="#EBE3DB" />
                          <Flex
                            position="absolute"
                            inset="0"
                            bgColor="rgba(240,236,231,0.68)"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text color="#7E7A76" fontSize="36px" lineHeight="1">
                              🔒
                            </Text>
                          </Flex>
                        </>
                      )}

                      {isFxUnlocking ? (
                        <Flex
                          position="absolute"
                          inset="0"
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                        >
                          <Flex
                            px="12px"
                            py="4px"
                            borderRadius="999px"
                            bgColor="rgba(255, 248, 220, 0.92)"
                            border="1px solid rgba(175, 137, 94, 0.5)"
                          >
                            <Text color="#6A5037" fontSize="13px" fontWeight="700">
                              🔓 已解鎖
                            </Text>
                          </Flex>
                        </Flex>
                      ) : null}
                      {isNextDiaryCatalogRevealing ? (
                        <Flex
                          position="absolute"
                          inset="0"
                          alignItems="center"
                          justifyContent="center"
                          pointerEvents="none"
                          bgColor="rgba(255, 253, 249, 0.12)"
                        >
                          <Flex
                            px="14px"
                            py="6px"
                            borderRadius="999px"
                            bgColor="rgba(255, 248, 220, 0.94)"
                            border="1px solid rgba(175, 137, 94, 0.55)"
                            boxShadow="0 8px 18px rgba(80,54,33,0.16)"
                          >
                            <Text color="#6A5037" fontSize="13px" fontWeight="800">
                              新篇章浮現
                            </Text>
                          </Flex>
                        </Flex>
                      ) : null}
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
          {isJournalEntryGuideActive || isFirstPhotoDiaryRevealMode ? null : (
            <Flex pt="14px" pb="18px" justifyContent="center" flexShrink={0}>
              <Flex
                as="button"
                h="44px"
                minW="132px"
                px="20px"
                borderRadius="999px"
                bgColor="#A57C58"
                alignItems="center"
                justifyContent="center"
                gap="8px"
                boxShadow="0 6px 14px rgba(78,55,31,0.12)"
                onClick={onClose}
              >
                <Text color="white" fontSize="26px" fontWeight="400" lineHeight="1" transform="translateY(-2px)">
                  ‹
                </Text>
                <Text color="white" fontSize="16px" fontWeight="700" lineHeight="1">
                  返回
                </Text>
              </Flex>
            </Flex>
          )}
          {nextDiaryCatalogTalkLine ? (
            <Flex
              position="absolute"
              inset="0"
              zIndex={20}
              direction="column"
              justifyContent="flex-end"
              pointerEvents="auto"
              cursor="pointer"
              onClick={advanceNextDiaryCatalogTalk}
            >
              {isNextDiaryCatalogTalkAvatarVisible ? (
                <Flex
                  position="absolute"
                  left="14px"
                  bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
                  zIndex={6}
                  pointerEvents="none"
                >
                  <EventAvatarSprite
                    spriteId={nextDiaryCatalogTalkLine.spriteId}
                    frameIndex={nextDiaryCatalogTalkLine.frameIndex}
                  />
                </Flex>
              ) : null}
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                {nextDiaryCatalogTalkLine.showName === false ? null : (
                  <Text color="white" fontWeight="700">
                    {nextDiaryCatalogTalkLine.speaker}
                  </Text>
                )}
                <Flex flex="1" minH="0" direction="column" justifyContent="center">
                  <Text color="white" fontSize="16px" lineHeight="1.5">
                    {nextDiaryCatalogTalkLine.text}
                  </Text>
                </Flex>
                <EventContinueAction
                  label="點擊繼續"
                  onClick={advanceNextDiaryCatalogTalk}
                />
              </EventDialogPanel>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    );
  }, [
	    activeTab,
	    activeSunbeastFilter,
	    baiEntry1VisualPageIndex,
	    isBaiEntry1TitleRevealed,
	    isBaiEntry1FirstTextRevealed,
	    isBaiEntry1NaotaroOpenReveal,
	    comicPageIndex,
    diaryRevealStep,
    diaryReadTalkIndex,
    firstPhotoDiaryStage,
    fragmentedDiaryStage,
    nextDiaryCatalogRevealStage,
    nextDiaryCatalogTalkIndex,
    hasBaiEntry1,
    hasBaiEntry2,
    hasBaiEntry3,
    hasBaiEntry4,
    hasBaiEntry2SecondFragment,
    isBeigoProfileMode,
    isDiaryReadTalkVisible,
    isNextDiaryFragmentPreviewVisible,
    isIncompleteDiaryReactionVisible,
    isComicControlsVisible,
    isComicReadMode,
    isDiaryRevealMode,
    isChickenPhotoDiaryRevealMode,
    isFirstPhotoDiaryRevealMode,
    isFragmentedDiaryMode,
    isFrogFragmentedDiaryMode,
    isPhotoDiaryRevealMode,
    isSecondPhotoDiaryRevealMode,
    isGuidedJournalRevealMode,
    isBaiEntry2FragmentOpen,
    isJournalEntryGuideActive,
    isSunbeastDirectMode,
    journalUnlockFxStage,
    journalView,
    revealEntryId,
    hasShownComicReadHint,
    isSunbeastRevealMode,
    isSunbeastGuidedMode,
    onClose,
    showComicReadHint,
    stickerCollection,
    selectedSunbeastCardId,
    activeSunbeastDetailTab,
    sunbeastDetailRevealStep,
    sunbeastFirstRevealPhase,
    sunbeastFirstRevealQuestionCount,
    sunbeastIntroStep,
    isSunbeastHintTalkVisible,
    sunbeastHintTalkStep,
    sunbeastHintTalkFrameIndex,
    isSunbeastShadowGuideVisible,
    sunbeastShadowGuideStep,
    sunbeastShadowGuideTargetId,
    activeGuidedSunbeastHintId,
    sunbeastProgress,
    sunbeastView,
    onBeigoProfileComplete,
    onFragmentedDiaryComplete,
    onGuidedFlowComplete,
    onDiaryRevealEntryComplete,
    onSunbeastHintGuideComplete,
    showReturnButton,
    activeDiaryReadTalkLines,
    advanceDiaryReadTalk,
    advanceNextDiaryCatalogTalk,
    completeNextDiaryFragmentPreview,
  ]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={70}
      borderRadius={{ base: "0", sm: "20px" }}
      overflow="hidden"
      opacity={open ? 1 : 0}
      pointerEvents={open ? "auto" : "none"}
      transition="opacity 0.22s ease"
    >
      <Flex
        position="absolute"
        inset="0"
        bgColor="rgba(0, 0, 0, 0.25)"
        onClick={onClose}
      />
      <Flex
        w="100%"
        h="100%"
        bgColor="#F1E7D7"
        direction="column"
        transform={open ? "translateY(0)" : "translateY(12px)"}
        transition="transform 0.22s ease"
      >
        {isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? null : (
          <>
            <Flex
              h="72px"
              px="16px"
              bgColor="#9D7859"
              borderBottom="1px solid rgba(255,255,255,0.28)"
              alignItems="center"
              justifyContent="space-between"
            >
              <Flex onClick={onClose} cursor="pointer">
                <Text color="white" fontSize="18px" fontWeight="700">
                  {isGuidedJournalRevealMode ? "< 繼續劇情" : "< 返回"}
                </Text>
              </Flex>
              <Text color="#FFF7EE" fontSize="20px" fontWeight="700" lineHeight="1">
                交換日記
              </Text>
              <Flex w="64px" />
            </Flex>

            {isGuidedJournalRevealMode ? (
              <Flex px="16px" py="8px" bgColor="#E7D5BF">
                <Text color="#6D5B48" fontSize="12px" fontWeight="700">
	                  {isPhotoDiaryRevealMode
	                    ? "剛剛拍到的小日獸，好像跑進交換日記裡了。"
	                    : "先找到恢復的那一頁日記。"}
                </Text>
              </Flex>
            ) : isSunbeastRevealMode ? (
              <Flex px="16px" py="8px" bgColor="#E7D5BF">
                <Flex
                  h="30px"
                  px="14px"
                  borderRadius="999px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="#9D7859"
                >
                  <Text color="white" fontSize="12px" fontWeight="700">
                    小日獸
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <Flex px="16px" py="10px" gap="6px" bgColor="#E7D5BF">
                <Flex
                  flex="1"
                  h="30px"
                  borderRadius="8px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="#9D7859"
                  cursor="pointer"
                  onClick={() => {
                    setActiveTab("journal");
                    setJournalView("list");
                    setIsComicReadMode(false);
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    setComicPageIndex(0);
                  }}
                >
                  <Text color={activeTab === "journal" ? "white" : "#6D5B48"} fontSize="12px" fontWeight="700">
                    日記頁
                  </Text>
                </Flex>
                <Flex
                  flex="1"
                  h="30px"
                  borderRadius="8px"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="rgba(157,120,89,0.2)"
                  cursor="pointer"
                  onClick={() => {
                    setActiveTab("sunbeast");
                    setJournalView("list");
                    setIsComicReadMode(false);
                    setIsComicControlsVisible(false);
                    setShowComicReadHint(false);
                    setComicPageIndex(0);
                  }}
                >
                  <Text color="#6D5B48" fontSize="12px" fontWeight="700">
                    小日獸
                  </Text>
                </Flex>
              </Flex>
            )}
          </>
        )}

        <Flex
          flex="1"
          px={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "16px"}
          pt={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "12px"}
          pb={isComicReadMode || shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "0" : "16px"}
          direction="column"
          overflow="hidden"
          bgColor={isComicReadMode ? "#0F0F0F" : shouldUseFigmaJournalShell || shouldUseSunbeastShell ? "#F7F0E4" : "#FBF5EA"}
          bgImage={isAnyFragmentedDiaryMode ? DIARY_PAGE_STRIPE_BACKGROUND : undefined}
          position="relative"
        >
          {content}
        </Flex>
      </Flex>
      {introStage === "photo" || introStage === "score" || introStage === "points" || introStage === "gacha" || introStage === "result" ? (
        <Flex
          position="absolute"
          inset="0"
          zIndex={120}
          bgColor="#FBFAF5"
          direction="column"
          alignItems="center"
          justifyContent="space-between"
          px="16px"
          py="34px"
          overflow="hidden"
        >
          <Flex
            position="absolute"
            inset="0"
            backgroundImage="radial-gradient(circle at 50% 26%, rgba(238,219,187,0.34), transparent 32%), linear-gradient(180deg, #F8F5EC 0%, #FFFFFF 42%, #F8F1E8 100%)"
          />

          <Flex position="relative" zIndex={1} direction="column" alignItems="center" gap="8px" pt="6px">
            <Text color="#5F4C3B" fontSize="21px" fontWeight="800" textAlign="center">
              {introStage === "result" ? "抽到貼紙了" : introStage === "gacha" ? "抽取貼紙" : "拍到的照片"}
            </Text>
            <Text color="#9D7859" fontSize="12px" fontWeight="700" textAlign="center">
              {introStage === "photo"
                ? "先確認這次捕捉到的小日獸"
                : introStage === "score"
                  ? "精準度會轉換成抽獎點數"
                  : introStage === "points"
                    ? "點數越高，稀有貼紙機率越高"
                    : introStage === "gacha"
                      ? "日記能量正在翻成貼紙"
                      : introReward?.isNewSticker
                        ? "新的收藏已經亮起來了"
                        : "已收集過，收藏仍會保留紀錄"}
            </Text>
          </Flex>

          <Flex
            position="relative"
            zIndex={1}
            flex="1"
            minH="0"
            w="100%"
            maxW="344px"
            direction="column"
            alignItems="center"
            justifyContent="center"
            gap="18px"
          >
            <Flex
              key={`photo-card-${introStage}`}
              w={introStage === "result" ? "210px" : "min(100%, 274px)"}
              h={introStage === "result" ? "252px" : "326px"}
              borderRadius="10px"
              bgColor="#FFFDF9"
              border="1px solid rgba(180,164,142,0.55)"
              boxShadow="0 18px 36px rgba(77,58,38,0.18)"
              p={introStage === "result" ? "10px 10px 34px" : "12px 12px 42px"}
              position="relative"
              direction="column"
              animation={
                introStage === "photo"
                  ? `${photoCardFloat} 3.8s ease-in-out infinite`
                  : `${revealStageIn} 360ms ease both`
              }
            >
              <Flex w="100%" flex="1" minH="0" borderRadius="5px" bgColor="#EFE8DC" border="1px solid rgba(130,112,90,0.22)" overflow="hidden" alignItems="center" justifyContent="center">
                {introStage === "result" ? (
                  <img
                    src={currentStickerMeta.image}
                    alt={currentStickerMeta.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <img
                    src={effectivePhotoSnapshot.previewImage}
                    alt="還原拍攝結果"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                )}
              </Flex>
              {introStage === "result" ? (
                <Flex position="absolute" left="0" right="0" bottom="9px" direction="column" alignItems="center" gap="2px">
                  <Text color="#5C4937" fontSize="14px" fontWeight="800" lineHeight="1">
                    {currentStickerMeta.title}
                  </Text>
                  <Text color="#A98362" fontSize="10px" fontWeight="700" lineHeight="1">
                    {currentStickerMeta.subtitle}
                  </Text>
                </Flex>
              ) : null}
            </Flex>

            {introStage === "score" ? (
              <Flex
                key="score-panel"
                w="100%"
                borderRadius="18px"
                bgColor="#FFF7EA"
                border="1px solid rgba(169,131,98,0.18)"
                boxShadow="0 10px 24px rgba(91,68,45,0.08)"
                p="14px"
                direction="column"
                gap="10px"
                animation={`${revealStageIn} 320ms ease both`}
              >
                <Flex alignItems="center" justifyContent="space-between">
                  <Text color="#6E5844" fontSize="13px" fontWeight="800">
                    拍攝精準度
                  </Text>
                  <Text color="#5F4C3B" fontSize="26px" fontWeight="900" lineHeight="1">
                    {currentPhotoScore}%
                  </Text>
                </Flex>
                <Flex h="10px" borderRadius="999px" bgColor="#E8D8C4" overflow="hidden">
                  <Flex
                    w={`${currentPhotoScore}%`}
                    h="100%"
                    bgColor={currentPhotoScore >= 85 ? "#F0BE4A" : currentPhotoScore >= 70 ? "#CFA36A" : "#A98362"}
                    borderRadius="999px"
                    transformOrigin="left center"
                    animation={`${meterFill} 720ms ease-out both`}
                  />
                </Flex>
              </Flex>
            ) : null}

            {introStage === "points" ? (
              <Flex
                key="points-panel"
                w="100%"
                borderRadius="20px"
                bgColor="#6E5844"
                p="16px"
                direction="column"
                alignItems="center"
                gap="8px"
                boxShadow="0 14px 30px rgba(58,42,28,0.22)"
                animation={`${pointPulse} 420ms ease both`}
              >
                <Text color="#F6E7D2" fontSize="12px" fontWeight="800">
                  轉換完成
                </Text>
                <Flex alignItems="baseline" gap="7px">
                  <Text color="white" fontSize="44px" fontWeight="900" lineHeight="1">
                    {currentPhotoPoints}
                  </Text>
                  <Text color="#F6E7D2" fontSize="15px" fontWeight="800">
                    點
                  </Text>
                </Flex>
                <Text color="#D8BE9F" fontSize="11px" fontWeight="700">
                  {currentPhotoScore}% 精準度換算
                </Text>
              </Flex>
            ) : null}

            {introStage === "gacha" ? (
              <Flex key="gacha-panel" alignItems="center" justifyContent="center" direction="column" gap="12px" animation={`${revealStageIn} 260ms ease both`}>
                <Flex
                  w="106px"
                  h="132px"
                  borderRadius="12px"
                  bgColor="#A98362"
                  border="3px solid #F2E2C9"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 14px 28px rgba(72,52,34,0.22)"
                  animation={`${gachaFlip} 950ms ease-in-out infinite`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Text color="#FFF7EA" fontSize="54px" fontWeight="900" lineHeight="1">
                    ?
                  </Text>
                </Flex>
                <Text color="#6E5844" fontSize="13px" fontWeight="800">
                  抽取中...
                </Text>
              </Flex>
            ) : null}

            {introStage === "result" ? (
              <Flex key="result-panel" direction="column" alignItems="center" gap="8px" animation={`${revealStageIn} 300ms ease both`}>
                <Flex px="12px" py="7px" borderRadius="999px" bgColor={introReward?.isNewSticker ? "#F0BE4A" : "#A98362"} animation={introReward?.isNewSticker ? `${rewardGlow} 1.2s ease-in-out infinite` : undefined}>
                  <Text color="white" fontSize="12px" fontWeight="900">
                    {introReward?.isNewSticker ? "NEW" : "已收藏"}
                  </Text>
                </Flex>
                <Text color="#5C4937" fontSize="16px" fontWeight="900" textAlign="center">
                  {currentStickerMeta.subtitle}
                </Text>
              </Flex>
            ) : null}
          </Flex>

          <Flex
            position="relative"
            zIndex={1}
            w="86%"
            maxW="320px"
            direction="column"
            gap="8px"
            alignItems="stretch"
            pb="6px"
          >
            {introStage === "photo" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={startDiaryRevealAfterPhoto} boxShadow="0 10px 24px rgba(100,72,45,0.16)">
                <Text color="white" fontSize="15px" fontWeight="800">
                  查看精準度
                </Text>
              </Flex>
            ) : null}
            {introStage === "score" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={goToPointsStage}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  轉換成點數
                </Text>
              </Flex>
            ) : null}
            {introStage === "points" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={runGacha}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  用 {currentPhotoPoints} 點抽貼紙
                </Text>
              </Flex>
            ) : null}
            {introStage === "result" ? (
              <Flex as="button" h="46px" borderRadius="999px" bgColor="#9D7859" alignItems="center" justifyContent="center" cursor="pointer" onClick={collectReward}>
                <Text color="white" fontSize="15px" fontWeight="800">
                  收藏貼紙
                </Text>
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

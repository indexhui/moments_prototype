"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FaBook, FaLocationDot, FaPaw } from "react-icons/fa6";
import { TbHandFinger } from "react-icons/tb";
import { EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { GAME_EMOTION_CUE_TRIGGER } from "@/lib/game/emotionCueBus";
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
  onGuidedFlowComplete?: () => void;
  onDiaryRevealEntryComplete?: () => void;
};

export type DiaryOverlayMode = "default" | "diary-reveal" | "sunbeast-reveal" | "sunbeast";

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

const fingerUpSwipe = keyframes`
  0% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
  50% { transform: translateX(-50%) translateY(-8px) rotate(180deg); opacity: 1; }
  100% { transform: translateX(-50%) translateY(0) rotate(180deg); opacity: 0.78; }
`;

const polaroidStickIn = keyframes`
  0% { transform: translateY(24px) rotate(-4deg) scale(0.9); opacity: 0; }
  45% { transform: translateY(-6px) rotate(7deg) scale(1.03); opacity: 1; }
  100% { transform: translateY(0) rotate(5deg) scale(1); opacity: 1; }
`;

const revealStageIn = keyframes`
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
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
  { speaker: "小麥", text: "消失的日記內容浮現了⋯⋯！", spriteId: "mai", frameIndex: 12 },
  { speaker: "小麥", text: "這篇日記⋯⋯真的是典型的小白呢，粗心又糊裡糊塗", spriteId: "mai", frameIndex: 3 },
  {
    speaker: "小麥",
    text: "這隻被我吐槽後畫的黃金獵犬，我也記得。小白還幫牠取了名字，叫直太郎⋯⋯\n她最愛畫一些有的沒的小動物了⋯⋯",
    spriteId: "mai",
    frameIndex: 10,
  },
  { speaker: "小麥", text: "仔細想想⋯⋯日記⋯⋯拍照⋯⋯捕捉黃金獵犬⋯⋯", spriteId: "mai", frameIndex: 4 },
  { speaker: "小麥", text: "難道⋯⋯所謂的小日獸，就是小白畫的這些小動物嗎？", spriteId: "mai", frameIndex: 12 },
  { speaker: "小貝狗", text: "嗷嗷！嗷嗷！", spriteId: "beigo", frameIndex: 1 },
  { speaker: "小麥", text: "而那些消失的日記內容，都變成了小日獸！？", spriteId: "mai", frameIndex: 12 },
  { speaker: "小貝狗", text: "嗷～～嗷！嗷嗷！", spriteId: "beigo", frameIndex: 1 },
];

const BAI_ENTRY_2_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "噗……這真的很像小白會做的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "明明只是去便利商店買東西，還能認錯人，對著別人的背影講一大串。", spriteId: "mai", frameIndex: 2 },
  { speaker: "小麥", text: "等對方一轉頭，發現認錯人之後，她一定整個腦袋空白吧。", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "最後居然只會丟下一句「哇……哇……！」就跑走，真的太有畫面了。", spriteId: "mai", frameIndex: 1 },
  { speaker: "小麥", text: "我突然想起那次租車旅行，她還認錯車，直接去拉別人的車門。", spriteId: "mai", frameIndex: 4 },
  { speaker: "小麥", text: "小白總是這樣，每次都少一根筋，鬧出一堆讓人又好氣又想笑的事。", spriteId: "mai", frameIndex: 3 },
  { speaker: "小麥", text: "……那時候，我們偶爾還會一起去旅行呢。", spriteId: "mai", frameIndex: 8 },
];

const BAI_ENTRY_1_BODY_LINES = [
  "今天在家裡趕稿，沒想到軟體忽然閃退，辛苦了一整天的檔案就這樣全沒了⋯⋯",
  "為什麼我每次都忘記邊畫邊存呢 (இдஇ; )",
  "之前被小麥調侃說我就像隻傻乎乎的黃金獵犬，看來真的是這樣⋯⋯",
] as const;

const BAI_ENTRY_2_BODY_LINES = [
  "今天跟朋友去便利商店買東西，結果我遠遠看到一個超像她的背影，完全沒多想就湊上去嘰哩呱啦講了一堆。",
  "結果那個人一轉頭，我才發現根本認錯人了。當下腦袋一片空白，連道歉都講得結結巴巴。",
  "最後我居然只擠得出一句「哇⋯⋯哇⋯⋯！」就逃走了。現在想起來，真的好像一隻呆呆的青蛙喔。",
] as const;

type SunbeastCollectionState = "discovered" | "hint" | "unknown";
type SunbeastView = "collection" | "detail-naotaro" | "detail-unknown";
type SunbeastDetailRevealStep =
  | "idle"
  | "dialog"
  | "unlock-intro"
  | "unlock-diary"
  | "unlock-street"
  | "unlock-clues"
  | "unlock-outro"
  | "complete";

type SunbeastCollectionCard = {
  id: string;
  name: string;
  state: SunbeastCollectionState;
  imagePath?: string;
  isClickable?: boolean;
};

const SUNBEAST_FILTERS = [
  { id: "all", label: "全部" },
  { id: "discovered", label: "已發現" },
  { id: "hint", label: "有線索" },
  { id: "unknown", label: "未知" },
] as const;

type SunbeastFilterId = (typeof SUNBEAST_FILTERS)[number]["id"];

function buildSunbeastCollectionCards(progress: PlayerProgress | null): SunbeastCollectionCard[] {
  const hasNaotaro = Boolean(progress?.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-")));
  const hasFrog = Boolean(progress?.hasCompletedStreetForgotLunchFrogEvent);
  const hasFrogHint = Boolean(progress?.hasUnlockedSunbeastFrogHint) || hasFrog;
  const hasChicken = Boolean(progress?.hasTriggeredOfficeSunbeastChickenEvent);
  const hasChickenHint = Boolean(progress?.hasUnlockedSunbeastChickenHint) || hasChicken;

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
      name: hasFrog ? "青蛙" : "???",
      state: hasFrog ? "discovered" : hasFrogHint ? "hint" : "unknown",
      imagePath: hasFrog || hasFrogHint ? "/collection/frog_sm_shadow.png" : undefined,
    },
    {
      id: "chicken",
      name: hasChicken ? "小雞" : "???",
      state: hasChicken ? "discovered" : hasChickenHint ? "hint" : "unknown",
      imagePath: hasChicken || hasChickenHint ? "/collection/chicken_sm_shadow.png" : undefined,
    },
    ...Array.from({ length: 9 }, (_, index) => ({
      id: `unknown-${index + 1}`,
      name: "???",
      state: "unknown" as const,
      isClickable: true,
    })),
  ];
}

function getSunbeastDetailView(card: SunbeastCollectionCard): SunbeastView {
  if (card.id === "naotaro" && card.state === "discovered") return "detail-naotaro";
  return "detail-unknown";
}

const SUNBEAST_HINT_DETAIL_CONTENT: Record<string, { imagePath: string; methodText: string }> = {
  frog: {
    imagePath: "/collection/frog_sm_shadow.png",
    methodText: "同時經過街道和便利商店",
  },
  chicken: {
    imagePath: "/collection/chicken_sm_shadow.png",
    methodText: "同時經過轉角的公車和便利商店",
  },
};

type SunbeastDetailInfoKind = "journal" | "place" | "clue";

const SUNBEAST_DETAIL_INFO = [
  {
    kind: "journal",
    eyebrow: "相關的日記",
    body: "來不及存檔的檔案，雖然有點不小心造成了麻煩，還是很樂觀，似乎跟直太郎很像。",
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
    body: "發現了兩隻小日獸的行蹤。\n同時經過街道和便利商店。",
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
  onGuidedFlowComplete,
  onDiaryRevealEntryComplete,
}: DiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "sunbeast">("journal");
  const [journalView, setJournalView] = useState<"list" | "entry-bai-1" | "entry-bai-2">("list");
  const [isComicReadMode, setIsComicReadMode] = useState(false);
  const [isComicControlsVisible, setIsComicControlsVisible] = useState(false);
  const [showComicReadHint, setShowComicReadHint] = useState(false);
  const [hasShownComicReadHint, setHasShownComicReadHint] = useState(false);
  const [comicPageIndex, setComicPageIndex] = useState(0);
  const [isDiaryReadTalkVisible, setIsDiaryReadTalkVisible] = useState(false);
  const [diaryReadTalkIndex, setDiaryReadTalkIndex] = useState(0);
  const [diaryRevealStep, setDiaryRevealStep] = useState<"idle" | "book" | "unlocking" | "ready">("idle");
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
  const [activeSunbeastDetailTab, setActiveSunbeastDetailTab] =
    useState<SunbeastDetailInfoKind>("journal");
  const [activeSunbeastFilter, setActiveSunbeastFilter] = useState<SunbeastFilterId>("all");
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sunbeastRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unlockFxTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comicHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comicScrollRef = useRef<HTMLDivElement | null>(null);
  const sunbeastDetailScrollRef = useRef<HTMLDivElement | null>(null);
  const hasPlayedSunbeastHeartRef = useRef(false);
  const [journalUnlockFxStage, setJournalUnlockFxStage] = useState<
    "idle" | "locked" | "unlocking" | "done"
  >("idle");
  const isDiaryRevealMode = mode === "diary-reveal";
  const isSunbeastRevealMode = mode === "sunbeast-reveal";
  const isSunbeastDirectMode = mode === "sunbeast";
  const hasBaiEntry1 = unlockedEntryIds.includes("bai-entry-1");
  const hasBaiEntry2 = unlockedEntryIds.includes("bai-entry-2");
  const shouldUseFigmaJournalShell = !isComicReadMode && activeTab === "journal";
  const shouldUseSunbeastShell = activeTab === "sunbeast";
  const activeDiaryReadTalkLines =
    journalView === "entry-bai-2" ? BAI_ENTRY_2_READ_TALK_LINES : BAI_ENTRY_1_READ_TALK_LINES;
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
    setActiveTab(isSunbeastRevealMode || isSunbeastDirectMode ? "sunbeast" : "journal");
    setJournalView("list");
    setIsComicReadMode(false);
    setIsComicControlsVisible(false);
    setShowComicReadHint(false);
    setHasShownComicReadHint(false);
    setComicPageIndex(0);
    setIsDiaryReadTalkVisible(false);
    setDiaryReadTalkIndex(0);
    setDiaryRevealStep(isDiaryRevealMode ? "book" : "idle");
    setSunbeastIntroStep(null);
    setSunbeastFirstRevealPhase("idle");
    setSunbeastFirstRevealQuestionCount(0);
    setSunbeastView("collection");
    setSelectedSunbeastCardId(null);
    setSunbeastDetailRevealStep("idle");
    setActiveSunbeastDetailTab("journal");
    setActiveSunbeastFilter("all");
    hasPlayedSunbeastHeartRef.current = false;
    setJournalUnlockFxStage("idle");
  }, [hasBaiEntry1, isDiaryRevealMode, isSunbeastDirectMode, isSunbeastRevealMode, open]);

  useEffect(() => {
    if (!open) return;
    if (!isDiaryRevealMode) return;
    if (diaryRevealStep !== "unlocking") return;
    startJournalUnlockFx();
    const readyTimer = setTimeout(() => {
      setDiaryRevealStep("ready");
    }, 1050);
    return () => clearTimeout(readyTimer);
  }, [diaryRevealStep, isDiaryRevealMode, open]);

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
      setIntroStage("photo");
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
    if (isDiaryRevealMode && diaryRevealStep === "book") {
      return (
        <Flex h="100%" minH="0" direction="column" justifyContent="center" alignItems="center" gap="18px" px="28px">
          <Flex
            w="72%"
            maxW="280px"
            borderRadius="12px"
            overflow="hidden"
            boxShadow="0 14px 28px rgba(64,44,24,0.16)"
          >
            <img
              src="/images/comic/book.jpg"
              alt="日記本"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </Flex>
          <Text color="#6C5641" fontSize="15px" fontWeight="700" textAlign="center" lineHeight="1.6">
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
            onClick={() => setDiaryRevealStep("unlocking")}
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
        isSunbeastRevealMode &&
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
      const showSunbeastIntroDialog = sunbeastIntroStep !== null;
      const isSunbeastNaotaroGuideStep = sunbeastIntroStep === 1;
      const introSpeaker = "小麥";
      const introAvatarSpriteId = "mai";
      const introAvatarFrameIndex = 1; // 表情2（0-based index）
      const introText =
        sunbeastIntroStep === 0
          ? "黃金獵犬出現在日記上了！對，是小白常常提到的直太郎。"
          : "點點看直太郎吧。";

      const handleSunbeastTopBack = () => {
        if (sunbeastView === "detail-naotaro") {
          setSunbeastDetailRevealStep(isSunbeastRevealMode ? "complete" : "idle");
          setSunbeastView("collection");
          return;
        }
        if (sunbeastView === "detail-unknown") {
          setSunbeastView("collection");
          return;
        }
        onClose();
      };
      const isNaotaroDetail = sunbeastView === "detail-naotaro";
      const selectedHintDetail = selectedSunbeastCardId ? SUNBEAST_HINT_DETAIL_CONTENT[selectedSunbeastCardId] : null;
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
      const isStreetUnlockedInReveal =
        sunbeastDetailRevealStep === "unlock-street" ||
        sunbeastDetailRevealStep === "unlock-clues" ||
        sunbeastDetailRevealStep === "complete";
      const isClueUnlockedInReveal =
        sunbeastDetailRevealStep === "unlock-clues" ||
        sunbeastDetailRevealStep === "unlock-outro" ||
        sunbeastDetailRevealStep === "complete";
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
              ? "交換日記解鎖了新的內容。"
              : sunbeastDetailRevealStep === "unlock-street"
                ? "也解鎖了新的地點：街道。"
                : "還留下了兩個小日獸線索。";
      const activeSunbeastDetailItem =
        SUNBEAST_DETAIL_INFO.find((item) => item.kind === activeSunbeastDetailTab) ??
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
              <Flex position="relative" h="260px" minH="260px" overflow="hidden" flexShrink={0} bgColor="#F6F0E4">
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
                  pt="40px"
                  pb="10px"
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
                  <Flex flex="1" minH="0" alignItems="center" justifyContent="center" pt="2px">
                    <img
                      src="/images/428出圖/拍照動物/黃金獵犬.png"
                      alt="直太郎"
                      style={{
                        width: "156px",
                        maxWidth: "86%",
                        height: "156px",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </Flex>
                  <Text
                    color="#977458"
                    fontSize="15px"
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
                <Flex px="24px" pt="16px" pb="18px" w="100%" alignItems="center" gap="22px">
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
                    animation={
                      isSunbeastRevealMode && sunbeastDetailRevealStep === "dialog"
                        ? `${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`
                        : undefined
                    }
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

              <Flex
                position="relative"
                order={1}
                h="180px"
                minH="180px"
                borderTop="0"
                bgColor="#BD9A7E"
                flexShrink={0}
                animation={isActiveDetailAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                opacity={isActiveDetailUnlocked || !isSunbeastRevealMode ? 1 : 0.48}
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
                  {SUNBEAST_DETAIL_INFO.map((railItem) => {
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
                        opacity={isRailUnlocked || !isSunbeastRevealMode ? 1 : 0.46}
                        cursor={isRailUnlocked || !isSunbeastRevealMode ? "pointer" : "default"}
                        aria-label={railItem.eyebrow}
                        onClick={() => {
                          if (isSunbeastRevealMode && !isRailUnlocked) return;
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
                          setJournalView("entry-bai-1");
                          return;
                        }
                        if (isActiveDetailClue) {
                          setSelectedSunbeastCardId("frog");
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
                          src="/collection/frog_sm_shadow.png"
                          alt="青蛙線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                        <img
                          src="/collection/chicken_sm_shadow.png"
                          alt="小雞線索"
                          style={{ width: "40px", height: "40px", objectFit: "contain", display: "block" }}
                        />
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Flex>

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
          ) : (
            <>
              <Flex position="relative" minH="332px" overflow="hidden" flexShrink={0}>
                <Flex position="absolute" inset="0" pointerEvents="none">
                  <img
                    src="/images/diary/diary_bg.png"
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "fill", objectPosition: "left top" }}
                  />
                </Flex>
                <Flex position="relative" zIndex={1} direction="column" w="100%" pl="52px" pr="22px" pt="22px" pb="24px">
                  <Flex
                    alignSelf="flex-end"
                    px="18px"
                    py="6px"
                    border="2px solid #AB9E90"
                    borderRadius="16px"
                    bgColor="rgba(255,255,255,0.88)"
                  >
                    <Text color="#8B6D54" fontSize="18px" fontWeight="700" lineHeight="1">
                      ???
                    </Text>
                  </Flex>
                  <Flex flex="1" alignItems="center" justifyContent="center" minH="196px">
                    {selectedHintDetail ? (
                      <img
                        src={selectedHintDetail.imagePath}
                        alt=""
                        style={{ width: "180px", height: "180px", objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <Flex
                        w="190px"
                        h="180px"
                        borderRadius="16px"
                        bgColor="#E8D8C8"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="#9D7859" fontSize="84px" lineHeight="1" fontWeight="500">
                          ?
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                  <Text color="#111111" fontSize="18px" fontWeight="700" textAlign="center">
                    啊！？
                  </Text>
                </Flex>
              </Flex>
              <Flex
                flex="1"
                minH="236px"
                px="24px"
                pt="28px"
                pb="24px"
                bgColor="#977458"
                backgroundImage={[
                  "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
                  "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                ].join(",")}
                backgroundSize="20px 20px"
                direction="column"
                gap="18px"
              >
                <Text color="#FFFFFF" fontSize="20px" fontWeight="700" lineHeight="1">
                  發現方式
                </Text>
                <Flex h="48px" px="22px" borderRadius="999px" bgColor="#E8D8C8" alignItems="center">
                  <Text color="#7B5C43" fontSize="17px" fontWeight="700">
                    {selectedHintDetail?.methodText ?? "前往 ???"}
                  </Text>
                </Flex>
                <Flex mt="auto">
                  <Flex
                    as="button"
                    h="44px"
                    px="22px"
                    borderRadius="4px"
                    bgColor="#806248"
                    alignItems="center"
                    justifyContent="center"
                    onClick={handleSunbeastTopBack}
                  >
                    <Text color="#FFFFFF" fontSize="16px" fontWeight="500">
                      返回
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </>
          )}
        </Flex>
      );
      const sunbeastCollectionSection = (
        <Flex
          position="relative"
          zIndex={1}
          w="100%"
          minH="0"
          overflow="hidden"
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
            <Flex direction="column" flex="1" minH="0" pl="34px" pr="16px" pt="18px" pb="16px" overflow="hidden">
              <Flex
                alignItems="center"
                justifyContent="space-between"
                gap="8px"
                wrap="wrap"
                pb="14px"
                borderBottom="1px solid rgba(156,119,90,0.12)"
              >
                {SUNBEAST_FILTERS.map((filter) => {
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
                        if (isSunbeastFirstRevealAnimating) return;
                        setActiveSunbeastFilter(filter.id);
                      }}
                      opacity={isSunbeastFirstRevealAnimating ? 0.5 : 1}
                    >
                      <Text color="#9D7859" fontSize="16px" fontWeight="700" lineHeight="1">
                        {filter.label}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>

              <Flex flex="1" minH="0" overflowY="auto" pt="16px" pr="2px" css={{ scrollbarWidth: "none" }}>
                  <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="12px" w="100%" alignContent="start">
                  {visibleCollectionCards.map((card) => (
                    <Flex
                      key={card.id}
                      as="button"
                      direction="column"
                      alignItems="center"
                      justifyContent="flex-start"
                      bgColor="#FFFFFF"
                      minH="122px"
                      px="8px"
                      pt="14px"
                      pb={isSunbeastNaotaroGuideStep && card.id === "naotaro" ? "28px" : "12px"}
                      gap="10px"
                      position="relative"
                      cursor={card.isClickable === false || isSunbeastFirstRevealAnimating ? "default" : "pointer"}
                      onClick={() => {
                        if (isSunbeastFirstRevealAnimating || card.isClickable === false) return;
                        if (isSunbeastNaotaroGuideStep) {
                          if (card.id !== "naotaro") return;
                          setSunbeastIntroStep(null);
                          setSelectedSunbeastCardId("naotaro");
                          setSunbeastView("detail-naotaro");
                          setSunbeastDetailRevealStep(isSunbeastRevealMode ? "dialog" : "complete");
                          return;
                        }
                        const nextView = getSunbeastDetailView(card);
                        setSelectedSunbeastCardId(card.id);
                        setSunbeastView(nextView);
                        if (nextView === "detail-naotaro") {
                          setSunbeastDetailRevealStep(isSunbeastRevealMode ? "complete" : "complete");
                        }
                      }}
                    >
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
                          <Flex w="72px" h="72px" alignItems="center" justifyContent="center">
                            <img
                              src={card.imagePath ?? "/collection/frog_sm_shadow.png"}
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
                      <Text color="#9D7859" fontSize="18px" fontWeight="500" lineHeight="1" textAlign="center">
                        {card.name}
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
            </Flex>
          </Flex>
        </Flex>
      );
      const isSunbeastDetailView = !showSunbeastIntroDialog && sunbeastView !== "collection";

      return (
        <Flex position="relative" h="100%" minH="0" overflow="hidden" bgColor="#F6F0E4">
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
                  <Flex
                    as="button"
                    w="84px"
                  h="44px"
                  borderRadius="0 8px 8px 0"
                  bgColor="#A57C58"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 6px 14px rgba(78,55,31,0.12)"
                  onClick={handleSunbeastTopBack}
                  ml="-16px"
                >
                  <Text color="white" fontSize="34px" fontWeight="400" lineHeight="1" transform="translateY(-2px)">
                    ‹
                  </Text>
                </Flex>
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
                  {isNaotaroDialogOpen || isNaotaroUnlockOverlayOpen ? (
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
                  {isNaotaroDialogOpen ? (
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
                  {isNaotaroUnlockOverlayOpen ? (
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
                            來不及存檔的檔案，似乎跟直太郎很像。
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
                            setSunbeastView("detail-unknown");
                            setSunbeastDetailRevealStep("complete");
                          }}
                        >
                          <Flex w="68px" h="48px" flexShrink={0} alignItems="center" justifyContent="center" gap="8px">
                            <img
                              src="/collection/frog_sm_shadow.png"
                              alt="青蛙線索"
                              style={{ width: "30px", height: "30px", objectFit: "contain", display: "block" }}
                            />
                            <img
                              src="/collection/chicken_sm_shadow.png"
                              alt="小雞線索"
                              style={{ width: "30px", height: "30px", objectFit: "contain", display: "block" }}
                            />
                          </Flex>
                          <Flex direction="column" flex="1" minW="0" gap="4px">
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="15px" fontWeight="700">
                              小日獸行蹤
                            </Text>
                            <Text color={isClueUnlockedInReveal ? "#806248" : "white"} fontSize="12px" lineHeight="1.35">
                              同時經過街道和便利商店，可能會遇到牠們。
                            </Text>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Flex>
                  ) : null}
                  {isNaotaroDialogOpen || isNaotaroUnlockOverlayOpen ? (
                    <Flex
                      position="absolute"
                      left="0"
                      right="0"
                      bottom="0"
                      zIndex={10}
                      direction="column"
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
                            onClick={() => {
                              setSunbeastDetailRevealStep("unlock-intro");
                            }}
                          />
                        ) : null}
                      </EventDialogPanel>
                    </Flex>
                  ) : null}
                </Flex>
              )}
            </Flex>
          </Flex>

          {showSunbeastIntroDialog ? (
            <Flex
              position="absolute"
              left="0"
              right="0"
              bottom="0"
              zIndex={9}
              direction="column"
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
                    {introText}
                  </Text>
                </Flex>
                {sunbeastIntroStep === 0 ? (
                  <EventContinueAction
                    label="點擊繼續"
                    onClick={() => {
                      setSunbeastIntroStep(1);
                    }}
                  />
                ) : null}
              </EventDialogPanel>
            </Flex>
          ) : null}
        </Flex>
      );
    }

    const diaryCards = [
      {
        id: "bai-entry-1",
        title: "趕稿忘記存檔",
        unlocked: hasBaiEntry1,
        imagePath: "/images/diary/diary_demo.jpg",
      },
      {
        id: "bai-entry-2",
        title: "便利商店裡的奇怪店員",
        unlocked: hasBaiEntry2,
        imagePath: "/images/diary/diary_demo.jpg",
      },
      {
        id: "bai-entry-3",
        title: "小白日記 03",
        unlocked: false,
        imagePath: "/images/diary/diary_demo.jpg",
      },
      {
        id: "bai-entry-4",
        title: "小白日記 04",
        unlocked: false,
        imagePath: "/images/diary/diary_demo.jpg",
      },
    ] as const;

    if (journalView === "entry-bai-1" || journalView === "entry-bai-2") {
      const isSecondEntry = journalView === "entry-bai-2";
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
              <Flex position="absolute" left="0" right="0" bottom="0" zIndex={12} direction="column">
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
                    onClick={() => {
                      if (diaryReadTalkIndex >= activeDiaryReadTalkLines.length - 1) {
                        setIsDiaryReadTalkVisible(false);
                        setDiaryReadTalkIndex(0);
                        setIsComicReadMode(false);
                        setIsComicControlsVisible(false);
                        setComicPageIndex(0);
                        onGuidedFlowComplete?.();
                        return;
                      }
                      setDiaryReadTalkIndex((prev) => prev + 1);
                    }}
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
                    pb={isDiaryRevealMode ? "96px" : "18px"}
                    css={{ scrollbarWidth: "none" }}
                  >
                <Text color="#151515" fontSize="16px" fontWeight="400" lineHeight="1.5" mb="18px">
                  {isSecondEntry ? "XX年X月X日 中午天氣悶" : "XX年X月X日 天氣陰"}
                </Text>
                <Text color="#6C5641" fontSize="20px" fontWeight="700" lineHeight="1.3" mb="18px">
                  {isSecondEntry ? "便利商店的怪事" : "軟體閃退"}
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
                    {isSecondEntry ? (
                      <>
                        便利商店櫃檯前的速寫，
                        <br />
                        旁邊畫了一隻鼓著臉的青蛙
                      </>
                    ) : (
                      <>
                        軟體閃退，小白一臉悲痛的日記插圖，
                        <br />
                        旁邊畫了一隻黃金獵犬
                      </>
                    )}
                  </Text>
                </Flex>
                <Flex direction="column" gap="10px">
                  {(isSecondEntry ? BAI_ENTRY_2_BODY_LINES : BAI_ENTRY_1_BODY_LINES).map((line) => (
                    <Text key={line} color="#111111" fontSize="15px" fontWeight="400" lineHeight="1.55">
                      {line}
                    </Text>
                  ))}
                </Flex>
                </Flex>
              </Flex>
            </Flex>

            {isDiaryRevealMode && !isDiaryReadTalkVisible ? (
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
            <Flex position="absolute" left="0" right="0" bottom="0" zIndex={20} direction="column" pointerEvents="auto">
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
                  onClick={() => {
                    if (diaryReadTalkIndex >= activeDiaryReadTalkLines.length - 1) {
                      setIsDiaryReadTalkVisible(false);
                      setDiaryReadTalkIndex(0);
                      if (isDiaryRevealMode) {
                        onDiaryRevealEntryComplete?.();
                      }
                      return;
                    }
                    setDiaryReadTalkIndex((prev) => prev + 1);
                  }}
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
            <Flex
              as="button"
              w="86px"
              h="38px"
              borderRadius="0 6px 6px 0"
              bgColor="#A57C58"
              alignItems="center"
              justifyContent="center"
              onClick={onClose}
              ml="0"
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
              const cardUnlocked = isFxLocked || isFxUnlocking ? false : card.unlocked;
                return (
                  <Flex key={card.id}>
                    <Flex
                      as="button"
                      onClick={() => {
                        if (!cardUnlocked) return;
                        if (card.id === "bai-entry-1") setJournalView("entry-bai-1");
                        if (card.id === "bai-entry-2") setJournalView("entry-bai-2");
                      }}
                      cursor={cardUnlocked ? "pointer" : "default"}
                      position="relative"
                      w="100%"
                      minH="162px"
                      borderRadius="8px"
                      overflow="hidden"
                      bgColor="#FAF3E7"
                      border="1px solid rgba(205,192,177,0.22)"
                      animation={isFxUnlocking ? `${unlockPulse} 620ms ease-out 1` : undefined}
                    >
                      {cardUnlocked ? (
                        <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
                          <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
                            {card.id === "bai-entry-2" ? (
                              <>
                                便利商店櫃檯前的速寫，
                                <br />
                                旁邊畫了一隻鼓著臉的青蛙
                              </>
                            ) : (
                              <>
                                軟體閃退，小白一臉悲痛的日記插圖，
                                <br />
                                旁邊畫了一隻黃金獵犬
                              </>
                            )}
                          </Text>
                        </Flex>
                      ) : (
                        <>
                          <img
                            src={card.imagePath}
                            alt={card.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              filter: "grayscale(100%) blur(1px) brightness(1.04)",
                              opacity: 0.26,
                              transform: "scale(1.02)",
                            }}
                          />
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
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    );
  }, [
    activeTab,
    activeSunbeastFilter,
    comicPageIndex,
    diaryRevealStep,
    diaryReadTalkIndex,
    hasBaiEntry1,
    hasBaiEntry2,
    isDiaryReadTalkVisible,
    isComicControlsVisible,
    isComicReadMode,
    isDiaryRevealMode,
    journalUnlockFxStage,
    journalView,
    revealEntryId,
    hasShownComicReadHint,
    isSunbeastRevealMode,
    onClose,
    showComicReadHint,
    stickerCollection,
    activeSunbeastDetailTab,
    sunbeastDetailRevealStep,
    sunbeastFirstRevealPhase,
    sunbeastFirstRevealQuestionCount,
    sunbeastIntroStep,
    sunbeastProgress,
    sunbeastView,
    onGuidedFlowComplete,
    onDiaryRevealEntryComplete,
    activeDiaryReadTalkLines,
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
                  {isDiaryRevealMode ? "< 繼續劇情" : "< 返回"}
                </Text>
              </Flex>
              <Text color="#FFF7EE" fontSize="20px" fontWeight="700" lineHeight="1">
                交換日記
              </Text>
              <Flex w="64px" />
            </Flex>

            {isDiaryRevealMode ? (
              <Flex px="16px" py="8px" bgColor="#E7D5BF">
                <Text color="#6D5B48" fontSize="12px" fontWeight="700">
                  在捷運上先找到恢復的那一頁日記。
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

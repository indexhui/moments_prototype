"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
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

const overlayLiftFadeOut = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-88px); opacity: 0; }
`;

const DIARY_COMIC_PAGES = [
  "/images/diary/diary_demo_01.png",
  "/images/diary/diary_demo_02.png",
  "/images/diary/diary_demo_03.png",
] as const;

type DiaryReadTalkLine = {
  speaker: "小麥" | "小貝狗" | "旁白";
  text: string;
  spriteId?: "mai" | "beigo";
  frameIndex?: number;
  showName?: boolean;
};

const BAI_ENTRY_1_READ_TALK_LINES: DiaryReadTalkLine[] = [
  { speaker: "小麥", text: "哇…好慘……", spriteId: "mai", frameIndex: 6 },
  { speaker: "小貝狗", text: "嗷……全部不見了嗷……", spriteId: "beigo", frameIndex: 2 },
  { speaker: "小麥", text: "如果整個重畫……會超崩潰的吧……", spriteId: "mai", frameIndex: 9 },
  { speaker: "旁白", text: "（停一拍）", showName: false },
  { speaker: "小麥", text: "……", spriteId: "mai", frameIndex: 7 },
  { speaker: "小麥", text: "我記得……那天早上……", spriteId: "mai", frameIndex: 4 },
  { speaker: "小貝狗", text: "嗷？", spriteId: "beigo", frameIndex: 1 },
  { speaker: "小麥", text: "我起床的時候，小白還在畫圖……", spriteId: "mai", frameIndex: 4 },
  { speaker: "旁白", text: "（再停一拍）", showName: false },
  { speaker: "小麥", text: "後來她問我……能不能取消原本約好的野餐……", spriteId: "mai", frameIndex: 8 },
  { speaker: "旁白", text: "（短暫沉默）", showName: false },
  { speaker: "小麥", text: "我還笑她……又在拖稿、太大意……", spriteId: "mai", frameIndex: 5 },
  { speaker: "小麥", text: "雖然後來……還是有幫她買早餐……", spriteId: "mai", frameIndex: 5 },
  { speaker: "旁白", text: "（停一拍）", showName: false },
  { speaker: "小麥", text: "……但我好像完全沒問她發生什麼事。", spriteId: "mai", frameIndex: 8 },
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
      imagePath: hasNaotaro ? "/collection/naotaro_sm.png" : undefined,
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
  const [activeSunbeastFilter, setActiveSunbeastFilter] = useState<SunbeastFilterId>("all");
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sunbeastRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unlockFxTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comicHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comicScrollRef = useRef<HTMLDivElement | null>(null);
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
    sourceImage: "/images/CH/CH01_SC04_MRT_DogStuck.png",
    previewImage: "/images/CH/CH01_SC04_MRT_DogStuck.png",
    dogCoveragePercent: 68,
    // 測試假資料：對齊黃金獵犬所在區域，方便驗收取景還原
    cameraFrameRect: { x: 0.51, y: 0.44, width: 0.44, height: 0.30 },
    capturedRect: { x: 0.58, y: 0.48, width: 0.30, height: 0.38 },
    capturedAt: new Date().toISOString(),
  };
  const safeCameraRect = {
    x: Math.max(0, Math.min(1, effectivePhotoSnapshot.cameraFrameRect.x)),
    y: Math.max(0, Math.min(1, effectivePhotoSnapshot.cameraFrameRect.y)),
    width: Math.max(0.05, Math.min(1, effectivePhotoSnapshot.cameraFrameRect.width)),
    height: Math.max(0.05, Math.min(1, effectivePhotoSnapshot.cameraFrameRect.height)),
  };

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
                  imagePath: "/collection/naotaro_sm.png",
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
      const isNaotaroUnlockSummaryVisible =
        isNaotaroDetail &&
        (!isSunbeastRevealMode || sunbeastDetailRevealStep === "complete");
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
      const sunbeastDetailBookSection = (
        <Flex position="relative" w="100%" minH="300px" mr="0" overflow="hidden" flexShrink={0}>
          <Flex
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            w="100%"
            pointerEvents="none"
          >
            <img
              src="/images/diary/diary_bg.png"
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "fill", objectPosition: "left top" }}
            />
          </Flex>
          <Flex position="relative" zIndex={1} direction="column" w="100%" minH="288px" pl="52px" pr="18px" pt="14px" pb="12px">
            <Flex
              alignSelf="flex-end"
              px={isNaotaroDetail ? "14px" : "18px"}
              py={isNaotaroDetail ? "4px" : "6px"}
              border={isNaotaroDetail ? "2px solid #9D7859" : "2px solid #AB9E90"}
              borderRadius={isNaotaroDetail ? "0" : "16px"}
              bgColor="rgba(255,255,255,0.88)"
            >
              <Text
                color={isNaotaroDetail ? "#9D7859" : "#8B6D54"}
                fontSize="18px"
                fontWeight="700"
                lineHeight="1"
              >
                {isNaotaroDetail ? "直太郎" : "???"}
              </Text>
            </Flex>
            <Flex
              mt={isNaotaroDetail ? "12px" : "20px"}
              justifyContent="center"
              alignItems="center"
              minH="164px"
            >
              {isNaotaroDetail ? (
                <img
                  src="/collection/naotaro_lg.png"
                  alt="直太郎"
                  style={{
                    width: "196px",
                    maxWidth: "100%",
                    height: "196px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                selectedHintDetail ? (
                  <img
                    src={selectedHintDetail.imagePath}
                    alt=""
                    style={{
                      width: "196px",
                      maxWidth: "100%",
                      height: "196px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                ) : (
                  <Flex
                    w="212px"
                    h="192px"
                    borderRadius="16px"
                    bgColor="#E8D8C8"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="#9D7859" fontSize="88px" lineHeight="1" fontWeight="500">
                      ?
                    </Text>
                  </Flex>
                )
              )}
            </Flex>
            <Text color="#111111" fontSize="18px" fontWeight="700" textAlign="center" mt={isNaotaroDetail ? "14px" : "18px"}>
              {isNaotaroDetail ? "脫線的善良狗狗!" : "啊！？"}
            </Text>
          </Flex>
        </Flex>
      );
      const sunbeastDetailExpandedSections = (
        <Flex w="100%" minH="100%" direction="column" flexShrink={0}>
          <Flex w="100%" h="10px" bgColor="#BD9A7E" />

          {isNaotaroDetail ? (
            <Flex
              w="100%"
              direction="column"
              bgColor="#977458"
              backgroundImage="url('/images/pattern/gz.svg')"
              backgroundRepeat="repeat"
              backgroundSize="84px 84px"
              backgroundPosition="top left"
              position="relative"
            >
              <Flex px="20px" pt="22px" pb={isNaotaroUnlockSummaryVisible ? "18px" : "28px"} direction="column" gap="16px">
                <Flex direction="column" alignItems="flex-start" gap="16px">
                  <Flex
                    bgColor="#FFFDF9"
                    borderRadius="8px"
                    p="10px"
                    transform="rotate(5deg)"
                    boxShadow="0 8px 16px rgba(88,59,33,0.16)"
                    w="174px"
                    h="188px"
                    position="relative"
                    overflow="hidden"
                    animation={
                      isSunbeastRevealMode && sunbeastDetailRevealStep === "dialog"
                        ? `${polaroidStickIn} 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both`
                        : undefined
                    }
                    transformOrigin="50% 100%"
                  >
                    <Flex
                      direction="column"
                      gap="10px"
                      w="100%"
                      position="absolute"
                      left="0"
                      right="0"
                      bottom="10px"
                      px="10px"
                      boxSizing="border-box"
                    >
                      <Flex
                        w="100%"
                        h="88px"
                        borderRadius="6px"
                        overflow="hidden"
                        bgColor="#DDD2C6"
                        backgroundImage={`url(${effectivePhotoSnapshot.previewImage})`}
                        backgroundSize="cover"
                        backgroundPosition="center"
                        backgroundRepeat="no-repeat"
                      >
                      </Flex>
                      <Flex direction="column" alignItems="center" gap="4px">
                        <Text color="#9D7859" fontSize="16px" fontWeight="700" lineHeight="1">
                          直太郎
                        </Text>
                        <Text color="#F2C84B" fontSize="18px" lineHeight="1">
                          ★ ★ ★
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                  <Text color="#FFFFFF" fontSize="20px" fontWeight="700" lineHeight="1">
                    2025/ 12/20
                  </Text>
                </Flex>
              </Flex>

              {isNaotaroUnlockSummaryVisible ? (
                <Flex
                  w="100%"
                  bgColor="#F8F4EC"
                  borderTop="1px solid rgba(140,108,79,0.18)"
                  px="10px"
                  pt="16px"
                  pb="18px"
                  direction="column"
                  gap="12px"
                  position="relative"
                  zIndex={2}
                  pointerEvents="auto"
                >
                  <Flex
                    as="button"
                    bgColor="#FFFFFF"
                    borderRadius="10px"
                    px="14px"
                    py="10px"
                    alignItems="center"
                    justifyContent="space-between"
                    boxShadow="0 4px 10px rgba(109,82,55,0.06)"
                    onClick={() => {
                      setActiveTab("journal");
                      setJournalView("entry-bai-1");
                    }}
                    cursor="pointer"
                  >
                    <Text color="#A57C58" fontSize="14px" fontWeight="500">
                      來不及存檔的檔案
                    </Text>
                    <Flex
                      h="22px"
                      px="12px"
                      borderRadius="999px"
                      bgColor="#A57C58"
                      alignItems="center"
                      justifyContent="center"
                      pointerEvents="none"
                    >
                      <Text color="white" fontSize="11px" fontWeight="700" lineHeight="1">
                        閱讀
                      </Text>
                    </Flex>
                  </Flex>

                  <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="10px">
                    <Flex
                      as="button"
                      bgColor="#FFFFFF"
                      borderRadius="10px"
                      minH="118px"
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      gap="10px"
                      boxShadow="0 4px 10px rgba(109,82,55,0.06)"
                      onClick={() => {
                        // 地點 overlay 之後再接，先保留不可用狀態
                      }}
                      cursor="default"
                    >
                      <Text color="#111111" fontSize="16px" fontWeight="700">
                        解鎖 <Text as="span" color="#2D6AF9">街道</Text>
                      </Text>
                      <Flex
                        w="66px"
                        h="88px"
                        overflow="hidden"
                        bgColor="#F3E7D9"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <img
                          src="/images/route/rt_010_010_010.png"
                          alt="街道"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </Flex>
                    </Flex>

                    <Flex
                      bgColor="#FFFFFF"
                      borderRadius="10px"
                      minH="118px"
                      direction="column"
                      alignItems="center"
                      justifyContent="center"
                      gap="10px"
                      boxShadow="0 4px 10px rgba(109,82,55,0.06)"
                      position="relative"
                      zIndex={1}
                      pointerEvents="auto"
                    >
                      <Text color="#111111" fontSize="16px" fontWeight="700">
                        獲得線索
                      </Text>
                      <Flex alignItems="center" gap="10px">
                        <Flex
                          as="button"
                          alignItems="center"
                          justifyContent="center"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedSunbeastCardId("frog");
                            setSunbeastView("detail-unknown");
                          }}
                          cursor="pointer"
                        >
                          <img
                            src="/collection/frog_sm_shadow.png"
                            alt="青蛙線索"
                            style={{ width: "42px", height: "42px", objectFit: "contain", display: "block" }}
                          />
                        </Flex>
                        <Flex
                          as="button"
                          alignItems="center"
                          justifyContent="center"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedSunbeastCardId("chicken");
                            setSunbeastView("detail-unknown");
                          }}
                          cursor="pointer"
                        >
                          <img
                            src="/collection/chicken_sm_shadow.png"
                            alt="小雞線索"
                            style={{ width: "42px", height: "42px", objectFit: "contain", display: "block" }}
                          />
                        </Flex>
                      </Flex>
                    </Flex>
                  </Grid>
                </Flex>
              ) : null}
            </Flex>
          ) : (
            <Flex
              w="100%"
              bgColor="#FAF3E7"
              borderTop="2px solid rgba(157,120,89,0.55)"
              px="22px"
              py="18px"
              justifyContent="space-between"
              gap="20px"
            >
              <Flex direction="column" alignItems="center" gap="12px" flex="1">
                <Text color="#111111" fontSize="18px" fontWeight="700">
                  解鎖日記
                </Text>
                <Flex
                  w="76px"
                  h="96px"
                  borderRadius="8px"
                  bgColor="#E8D8C8"
                  alignItems="center"
                  justifyContent="center"
                  transform="rotate(18deg)"
                >
                  <Text color="#9D7859" fontSize="44px" lineHeight="1" fontWeight="500">
                    ?
                  </Text>
                </Flex>
              </Flex>

              <Flex direction="column" alignItems="center" gap="12px" flex="1">
                <Text color="#111111" fontSize="18px" fontWeight="700">
                  將會解鎖地點
                </Text>
                <Flex
                  w="96px"
                  h="76px"
                  borderRadius="8px"
                  bgColor="#E8D8C8"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="#9D7859" fontSize="28px" lineHeight="1">
                    •
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          )}
          {!isNaotaroDetail ? (
            <Flex
              w="100%"
              px="20px"
              pt="26px"
              pb="24px"
              flex="1 0 0"
              bgColor="#977458"
              backgroundImage={[
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
                "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              ].join(",")}
              backgroundSize="20px 20px"
              direction="column"
              gap="16px"
            >
              <Flex direction="column" flex="1" justifyContent="space-between">
                <Text color="#FFFFFF" fontSize="20px" fontWeight="700" lineHeight="1">
                  發現方式
                </Text>
                <Flex
                  h="46px"
                  px="22px"
                  borderRadius="999px"
                  bgColor="#E8D8C8"
                  alignItems="center"
                >
                  <Text color="#7B5C43" fontSize="18px" fontWeight="700">
                    {selectedHintDetail?.methodText ?? "前往 ???"}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ) : null}
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
                              src={card.imagePath ?? "/collection/naotaro_sm.png"}
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
          <Flex position="relative" zIndex={1} direction="column" flex="1" minH="0" pl="16px" pr="0" pt="18px">
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
                {sunbeastView === "collection" ? "小日獸們" : sunbeastView === "detail-naotaro" ? "直太郎" : "???"}
              </Text>
              <Flex w="84px" />
            </Flex>

            <Flex position="relative" flex="1" minH="0" mt="8px">
              {showSunbeastIntroDialog || sunbeastView === "collection" ? (
                sunbeastCollectionSection
              ) : (
                <Flex
                  position="relative"
                  flex="1"
                  minH="0"
                >
                  {sunbeastDetailBookSection}
                  <Flex
                    position="absolute"
                    top="300px"
                    left="-16px"
                    right="0"
                    bottom="0"
                    zIndex={3}
                    pointerEvents="auto"
                    overflowY="auto"
                    css={{ scrollbarWidth: "none" }}
                  >
                    {sunbeastDetailExpandedSections}
                  </Flex>
                  {isNaotaroUnlockOverlayOpen ? (
                    <Flex
                      position="absolute"
                      top="0"
                      left="-16px"
                      right="0"
                      bottom="0"
                      zIndex={8}
                      bgImage="linear-gradient(to top, rgba(92,63,40,0.88) 0%, rgba(92,63,40,0.82) 34%, rgba(92,63,40,0.5) 62%, rgba(92,63,40,0.14) 82%, rgba(92,63,40,0) 100%)"
                      pointerEvents="none"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.72s ease-out both` : undefined}
                    />
                  ) : null}
                  {isNaotaroUnlockOverlayOpen ? (
                    <Flex
                      position="absolute"
                      left="-16px"
                      right="0"
                      top="330px"
                      zIndex={9}
                      bgColor="#F8F4EC"
                      px="12px"
                      pt="12px"
                      pb="10px"
                      direction="column"
                      gap="10px"
                      boxShadow="0 10px 24px rgba(55,40,27,0.18)"
                      animation={isUnlockOutro ? `${overlayLiftFadeOut} 0.66s ease-out both` : undefined}
                    >
                      <Flex
                        as="button"
                        bgColor={isDiaryUnlockedInReveal ? "#FFFFFF" : "#A57C58"}
                        borderRadius="8px"
                        px="14px"
                        py="8px"
                        alignItems="center"
                        justifyContent="space-between"
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
                        <Text color={isDiaryUnlockedInReveal ? "#A57C58" : "white"} fontSize="14px" fontWeight="500">
                          日記
                        </Text>
                        {isDiaryUnlockedInReveal ? (
                          <Flex
                            h="20px"
                            px="12px"
                            borderRadius="999px"
                            bgColor="#A57C58"
                            alignItems="center"
                            justifyContent="center"
                            pointerEvents="none"
                          >
                            <Text color="white" fontSize="11px" fontWeight="700" lineHeight="1">
                              閱讀
                            </Text>
                          </Flex>
                        ) : null}
                      </Flex>
                      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="10px">
                        <Flex
                          minH="102px"
                          borderRadius="8px"
                          bgColor={isStreetUnlockedInReveal ? "#FFFFFF" : "#A57C58"}
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          gap="10px"
                          transition="background-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease"
                          animation={isStreetUnlockAnimating ? `${unlockPulse} 0.72s ease-out` : undefined}
                          boxShadow={isStreetUnlockedInReveal ? "0 4px 10px rgba(109,82,55,0.08)" : "none"}
                        >
                          <Text color={isStreetUnlockedInReveal ? "#111111" : "white"} fontSize="16px" fontWeight="700">
                            地點
                          </Text>
                          {isStreetUnlockedInReveal ? (
                            <Flex w="64px" h="84px" overflow="hidden">
                              <img
                                src="/images/route/rt_010_010_010.png"
                                alt="街道"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            </Flex>
                          ) : null}
                        </Flex>
                        <Flex
                          as="button"
                          minH="102px"
                          borderRadius="8px"
                          bgColor={isClueUnlockedInReveal ? "#FFFFFF" : "#A57C58"}
                          direction="column"
                          alignItems="center"
                          justifyContent="center"
                          gap="10px"
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
                          <Text color={isClueUnlockedInReveal ? "#111111" : "white"} fontSize="16px" fontWeight="700">
                            小日獸
                          </Text>
                          {isClueUnlockedInReveal ? (
                            <Flex alignItems="center" gap="10px">
                              <Flex
                                as="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedSunbeastCardId("frog");
                                  setSunbeastView("detail-unknown");
                                  setSunbeastDetailRevealStep("complete");
                                }}
                              >
                                <img
                                  src="/collection/frog_sm_shadow.png"
                                  alt="青蛙線索"
                                  style={{ width: "38px", height: "38px", objectFit: "contain", display: "block" }}
                                />
                              </Flex>
                              <Flex
                                as="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedSunbeastCardId("chicken");
                                  setSunbeastView("detail-unknown");
                                  setSunbeastDetailRevealStep("complete");
                                }}
                              >
                                <img
                                  src="/collection/chicken_sm_shadow.png"
                                  alt="小雞線索"
                                  style={{ width: "38px", height: "38px", objectFit: "contain", display: "block" }}
                                />
                              </Flex>
                            </Flex>
                          ) : null}
                        </Flex>
                      </Grid>
                    </Flex>
                  ) : null}
                  {isNaotaroDialogOpen || isNaotaroUnlockOverlayOpen ? (
                    <Flex
                      position="absolute"
                      left="-16px"
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
                left="48px"
                right="16px"
                bottom="20px"
                zIndex={20}
              >
                <Flex
                  as="button"
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
          bgColor="#FFFFFF"
          alignItems="center"
          justifyContent="center"
          px="16px"
        >
          <Flex direction="column" alignItems="center" gap="12px" w="86%" maxW="320px">
            <Text color="#5F4C3B" fontSize="18px" fontWeight="700" textAlign="center">
              拍到的照片
            </Text>
            <Flex
              w="100%"
              borderRadius="12px"
              border="2px solid rgba(162,127,93,0.68)"
              overflow="hidden"
              boxShadow="0 10px 24px rgba(0,0,0,0.15)"
              opacity={1}
              transition="opacity 320ms ease"
              position="relative"
              style={{ aspectRatio: `${safeCameraRect.width} / ${safeCameraRect.height}` }}
              bgColor="#EFE8DC"
            >
              <img
                src={effectivePhotoSnapshot.previewImage}
                alt="還原拍攝結果"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Flex>
          </Flex>
          <Flex
            position="absolute"
            bottom="34px"
            left="50%"
            transform="translateX(-50%)"
            w="86%"
            maxW="320px"
            direction="column"
            gap="8px"
            alignItems="stretch"
          >
            {introStage === "photo" ? (
              <Flex
                as="button"
                h="40px"
                borderRadius="999px"
                bgColor="#9D7859"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={startDiaryRevealAfterPhoto}
                boxShadow="0 8px 20px rgba(0,0,0,0.16)"
              >
                <Text color="white" fontSize="14px" fontWeight="700">
                  點擊繼續
                </Text>
              </Flex>
            ) : null}
            {introStage === "score" ? (
              <>
                <Flex h="36px" borderRadius="999px" bgColor="#A98362" px="14px" alignItems="center" justifyContent="space-between">
                  <Text color="white" fontSize="14px" fontWeight="700">拍攝精準度</Text>
                  <Text color="white" fontSize="16px" fontWeight="700">{effectivePhotoSnapshot.dogCoveragePercent}%</Text>
                </Flex>
                <Flex
                  as="button"
                  h="38px"
                  borderRadius="999px"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={goToPointsStage}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">轉換成點數</Text>
                </Flex>
              </>
            ) : null}
            {introStage === "points" ? (
              <>
                <Flex h="36px" borderRadius="999px" bgColor="#A98362" px="14px" alignItems="center" justifyContent="space-between">
                  <Text color="white" fontSize="14px" fontWeight="700">獲得點數</Text>
                  <Text color="white" fontSize="16px" fontWeight="700">{introReward?.points ?? 0}</Text>
                </Flex>
                <Flex
                  as="button"
                  h="38px"
                  borderRadius="999px"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={runGacha}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">{introReward?.points ?? 0} 點抽獎勵抽取獎勵</Text>
                </Flex>
              </>
            ) : null}
            {introStage === "gacha" ? (
              <Flex alignItems="center" justifyContent="center" direction="column" gap="8px">
                <Flex w="82px" h="82px" borderRadius="8px" bgColor="#A8A8A8" alignItems="center" justifyContent="center">
                  <Text color="#4E4E4E" fontSize="44px" lineHeight="1">?</Text>
                </Flex>
                <Text color="#6E5844" fontSize="13px" fontWeight="700">抽獎中...</Text>
              </Flex>
            ) : null}
            {introStage === "result" ? (
              <>
                <Flex alignItems="center" justifyContent="center">
                  <Flex w="112px" h="112px" borderRadius="6px" overflow="hidden" border="2px solid #E9DECD">
                    <img src="/images/animals/naotaro_sm.jpg" alt="直太郎貼紙" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Flex>
                </Flex>
                <Text color="#5C4937" fontSize="16px" fontWeight="700" textAlign="center">直太郎貼紙</Text>
                <Flex
                  as="button"
                  h="38px"
                  borderRadius="999px"
                  bgColor="#9D7859"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={collectReward}
                >
                  <Text color="white" fontSize="14px" fontWeight="700">收藏</Text>
                </Flex>
              </>
            ) : null}
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

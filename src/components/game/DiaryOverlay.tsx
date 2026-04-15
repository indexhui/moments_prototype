"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
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
  rollStickerByPoints,
  type PhotoCaptureSnapshot,
  type StickerId,
} from "@/lib/game/playerProgress";

type DiaryOverlayProps = {
  open: boolean;
  onClose: () => void;
  unlockedEntryIds: string[];
  mode?: DiaryOverlayMode;
  onGuidedFlowComplete?: () => void;
  onDiaryRevealEntryComplete?: () => void;
};

export type DiaryOverlayMode = "default" | "diary-reveal" | "sunbeast-reveal";

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

const DIARY_READ_TALK_LINES: DiaryReadTalkLine[] = [
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

const BAI_ENTRY_1_BODY_LINES = [
  "今天在家裡趕稿，沒想到軟體忽然閃退，辛苦了一整天的檔案就這樣全沒了⋯⋯",
  "為什麼我每次都忘記邊畫邊存呢 (இдஇ; )",
  "之前被小麥調侃說我就像隻傻乎乎的黃金獵犬，看來真的是這樣⋯⋯",
] as const;

export function DiaryOverlay({
  open,
  onClose,
  unlockedEntryIds,
  mode = "default",
  onGuidedFlowComplete,
  onDiaryRevealEntryComplete,
}: DiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "sunbeast">("journal");
  const [journalView, setJournalView] = useState<"list" | "entry-bai-1">("list");
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
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unlockFxTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const comicHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comicScrollRef = useRef<HTMLDivElement | null>(null);
  const hasPlayedSunbeastHeartRef = useRef(false);
  const [journalUnlockFxStage, setJournalUnlockFxStage] = useState<
    "idle" | "locked" | "unlocking" | "done"
  >("idle");
  const isDiaryRevealMode = mode === "diary-reveal";
  const isSunbeastRevealMode = mode === "sunbeast-reveal";
  const hasBaiEntry1 = unlockedEntryIds.includes("bai-entry-1");
  const shouldUseFigmaJournalShell = !isComicReadMode && activeTab === "journal";
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
    setActiveTab("sunbeast");
    setSunbeastIntroStep(before.hasSeenSunbeastFirstReveal ? null : 0);
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
    setActiveTab(isSunbeastRevealMode ? "sunbeast" : "journal");
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
    hasPlayedSunbeastHeartRef.current = false;
    setJournalUnlockFxStage("idle");
  }, [hasBaiEntry1, isDiaryRevealMode, isSunbeastRevealMode, open]);

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
    clearIntroTimers();
    const progress = loadPlayerProgress();
    setStickerCollection(progress.stickerCollection);
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
      const stickerToImage: Record<StickerId, string> = {
        "naotaro-basic": "/images/animals/naotaro_sm.jpg",
        "naotaro-smile": "/images/animals/naotaro_sm.jpg",
        "naotaro-rare": "/images/animals/naotaro_sm.jpg",
      };
      const stickerOrder: StickerId[] =
        stickerCollection.length > 0
          ? stickerCollection
          : hasBaiEntry1
            ? ["naotaro-basic"]
            : [];
      const collectionSlots = Array.from({ length: 10 }).map((_, index) => {
        const stickerId = stickerOrder[index] ?? null;
        return {
          id: `sunbeast-slot-${index + 1}`,
          unlocked: Boolean(stickerId),
          stickerId,
          imagePath: stickerId ? stickerToImage[stickerId] : null,
        };
      });
      const showSunbeastIntroDialog = sunbeastIntroStep !== null;
      const introSpeaker = sunbeastIntroStep === 0 ? "小麥" : "小貝狗";
      const introAvatarSpriteId = sunbeastIntroStep === 0 ? "mai" : "beigo";
      const introAvatarFrameIndex = 1; // 表情2（0-based index）
      const introText =
        sunbeastIntroStep === 0
          ? "黃金獵犬出現在日記上了！對，是小白常常提到的直太郎。"
          : isSunbeastRevealMode
            ? "沒錯，是我最好的夥伴！既然直太郎回來了，我們就離找回其他小日獸更近一步了。"
            : "沒錯，是我最好的夥伴！既然直太郎出現了，那表示應該有日記恢復了，我們來翻到日記來看看吧。";

      return (
        <Flex direction="column" gap="12px" h="100%" minH="0" position="relative">
          <Flex
            direction="column"
            borderRadius="10px"
            border="1px solid rgba(157,120,89,0.26)"
            bgColor="#F6F0E5"
            p="10px"
            gap="8px"
          >
            <Flex
              alignSelf="flex-start"
              px="8px"
              py="2px"
              borderRadius="4px"
              border="1px solid #A98662"
              bgColor="#FFF9F0"
            >
              <Text color="#5A4A3A" fontSize="18px" fontWeight="700">
                直太郎
              </Text>
            </Flex>
            <Flex justifyContent="center">
              <Flex
                w="146px"
                h="146px"
                borderRadius="10px"
                border="2px solid #A98662"
                overflow="hidden"
                bgColor="#EEE4D6"
              >
                <img
                  src="/images/animals/naotaro.jpg"
                  alt="直太郎"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "42% 38%",
                    filter: hasBaiEntry1 ? "none" : "grayscale(100%) blur(4px)",
                  }}
                />
              </Flex>
            </Flex>
            <Text color="#5F4C3B" fontSize="14px" fontWeight="700" textAlign="center">
              脫線的善良狗狗！
            </Text>
            <Flex direction="column" alignItems="flex-end">
              <Text color="#5F4C3B" fontSize="13px" fontWeight="700">
                稀有度：★
              </Text>
              <Text color="#5F4C3B" fontSize="13px" fontWeight="700">
                圖鑑度：★★☆
              </Text>
            </Flex>
          </Flex>

          {showSunbeastIntroDialog ? null : (
            <Flex direction="column" gap="8px" flex="1" minH="0" overflowY="auto" pr="2px">
              <Flex wrap="wrap" gap="10px">
                {collectionSlots.map((slot) => (
                  <Flex
                    key={slot.id}
                    w="64px"
                    h="64px"
                    borderRadius="12px"
                    border="1px solid rgba(120,98,74,0.45)"
                    bgColor={slot.unlocked ? "#F8F5F0" : "#8D6F52"}
                    alignItems="center"
                    justifyContent="center"
                    overflow="hidden"
                  >
                    {slot.unlocked ? (
                      <Flex
                        w="54px"
                        h="54px"
                        borderRadius="999px"
                        border="1px solid rgba(169,134,98,0.62)"
                        overflow="hidden"
                      >
                        <img
                          src={slot.imagePath ?? "/images/animals/naotaro_sm.jpg"}
                          alt="小日獸"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "42% 38%",
                          }}
                        />
                      </Flex>
                    ) : (
                      <Text color="#5C4732" fontSize="28px" lineHeight="1">
                        ?
                      </Text>
                    )}
                  </Flex>
                ))}
              </Flex>
            </Flex>
          )}
          {showSunbeastIntroDialog ? (
            <Flex
              position="absolute"
              left="-16px"
              right="-16px"
              bottom="-16px"
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
                <EventContinueAction
                  label={sunbeastIntroStep === 0 ? "點擊繼續" : isSunbeastRevealMode ? "收起來" : "翻到日記"}
                  onClick={() => {
                    if (sunbeastIntroStep === 0) {
                      setSunbeastIntroStep(1);
                      return;
                    }
                    setSunbeastIntroStep(null);
                    if (isSunbeastRevealMode) {
                      onGuidedFlowComplete?.();
                      return;
                    }
                    setActiveTab("journal");
                    startJournalUnlockFx();
                  }}
                />
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
        title: "小白日記 02",
        unlocked: false,
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

    if (journalView === "entry-bai-1") {
      const talkLine = DIARY_READ_TALK_LINES[diaryReadTalkIndex];
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
                      if (diaryReadTalkIndex >= DIARY_READ_TALK_LINES.length - 1) {
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
                  XX年X月X日 天氣陰
                </Text>
                <Text color="#6C5641" fontSize="20px" fontWeight="700" lineHeight="1.3" mb="18px">
                  軟體閃退
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
                    軟體閃退，小白一臉悲痛的日記插圖，
                    <br />
                    旁邊畫了一隻黃金獵犬
                  </Text>
                </Flex>
                <Flex direction="column" gap="10px">
                  {BAI_ENTRY_1_BODY_LINES.map((line) => (
                    <Text key={line} color="#111111" fontSize="15px" fontWeight="400" lineHeight="1.55">
                      {line}
                    </Text>
                  ))}
                </Flex>
                </Flex>
              </Flex>
            </Flex>

            {isDiaryRevealMode ? (
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
                    onDiaryRevealEntryComplete?.();
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
                  label={diaryReadTalkIndex >= DIARY_READ_TALK_LINES.length - 1 ? "點擊繼續" : "點擊繼續"}
                  onClick={() => {
                    if (diaryReadTalkIndex >= DIARY_READ_TALK_LINES.length - 1) {
                      setIsDiaryReadTalkVisible(false);
                      setDiaryReadTalkIndex(0);
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
              const isFirstUnlockCard = card.id === "bai-entry-1";
              const isFxLocked = isFirstUnlockCard && journalUnlockFxStage === "locked";
              const isFxUnlocking = isFirstUnlockCard && journalUnlockFxStage === "unlocking";
              const cardUnlocked = isFxLocked || isFxUnlocking ? false : card.unlocked;
                const isSummaryCard = isFirstUnlockCard && cardUnlocked;

                return (
                  <Flex key={card.id}>
                    <Flex
                      as="button"
                      onClick={() => {
                        if (cardUnlocked && card.id === "bai-entry-1") setJournalView("entry-bai-1");
                      }}
                      cursor={cardUnlocked && card.id === "bai-entry-1" ? "pointer" : "default"}
                      position="relative"
                      w="100%"
                      minH="162px"
                      borderRadius="8px"
                      overflow="hidden"
                      bgColor="#FAF3E7"
                      border="1px solid rgba(205,192,177,0.22)"
                      animation={isFxUnlocking ? `${unlockPulse} 620ms ease-out 1` : undefined}
                    >
                      {isSummaryCard ? (
                        <Flex h="100%" w="100%" alignItems="flex-end" px="16px" py="16px">
                          <Text color="#C0A38A" fontSize="13px" fontWeight="400" lineHeight="1.6" textAlign="left">
                            軟體閃退，小白一臉悲痛的日記插圖，
                            <br />
                            旁邊畫了一隻黃金獵犬
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
    comicPageIndex,
    diaryRevealStep,
    diaryReadTalkIndex,
    hasBaiEntry1,
    isDiaryReadTalkVisible,
    isComicControlsVisible,
    isComicReadMode,
    isDiaryRevealMode,
    journalUnlockFxStage,
    journalView,
    hasShownComicReadHint,
    isSunbeastRevealMode,
    showComicReadHint,
    stickerCollection,
    sunbeastIntroStep,
    onGuidedFlowComplete,
    onDiaryRevealEntryComplete,
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
        {isComicReadMode || shouldUseFigmaJournalShell ? null : (
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
                {isSunbeastRevealMode ? "小日獸圖鑑" : "交換日記"}
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
                  bgColor={activeTab === "journal" ? "#9D7859" : "rgba(157,120,89,0.2)"}
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
                  bgColor={activeTab === "sunbeast" ? "#9D7859" : "rgba(157,120,89,0.2)"}
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
                  <Text color={activeTab === "sunbeast" ? "white" : "#6D5B48"} fontSize="12px" fontWeight="700">
                    小日獸
                  </Text>
                </Flex>
              </Flex>
            )}
          </>
        )}

        <Flex
          flex="1"
          px={isComicReadMode || shouldUseFigmaJournalShell ? "0" : "16px"}
          pt={isComicReadMode || shouldUseFigmaJournalShell ? "0" : "12px"}
          pb={isComicReadMode || shouldUseFigmaJournalShell ? "0" : "16px"}
          direction="column"
          overflow="hidden"
          bgColor={isComicReadMode ? "#0F0F0F" : shouldUseFigmaJournalShell ? "#F7F0E4" : "#FBF5EA"}
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

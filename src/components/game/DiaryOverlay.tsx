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
  onGuidedFlowComplete?: () => void;
};

const unlockPulse = keyframes`
  0% { transform: scale(0.98); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
  30% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(255, 220, 145, 0.24); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 220, 145, 0); }
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

export function DiaryOverlay({
  open,
  onClose,
  unlockedEntryIds,
  onGuidedFlowComplete,
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
  const hasBaiEntry1 = unlockedEntryIds.includes("bai-entry-1");
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
    setSunbeastIntroStep(before.hasSeenDiaryFirstReveal ? null : 0);
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
    setActiveTab("journal");
    setJournalView("list");
    setIsComicReadMode(false);
    setIsComicControlsVisible(false);
    setShowComicReadHint(false);
    setHasShownComicReadHint(false);
    setComicPageIndex(0);
    setIsDiaryReadTalkVisible(false);
    setDiaryReadTalkIndex(0);
    setSunbeastIntroStep(null);
    hasPlayedSunbeastHeartRef.current = false;
    setJournalUnlockFxStage("idle");
  }, [open]);

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
    if (progress.unlockedDiaryEntryIds.includes("bai-entry-1") && !progress.hasSeenDiaryFirstReveal) {
      setIntroStage("photo");
      return;
    }
    setIntroStage("none");
    return () => {
      clearIntroTimers();
    };
  }, [open, unlockedEntryIds]);

  useEffect(() => {
    return () => {
      clearIntroTimers();
      clearUnlockFxTimers();
      clearComicHintTimer();
    };
  }, []);

  const content = useMemo(() => {
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
                  label={sunbeastIntroStep === 0 ? "點擊繼續" : "翻到日記"}
                  onClick={() => {
                    if (sunbeastIntroStep === 0) {
                      setSunbeastIntroStep(1);
                      return;
                    }
                    setSunbeastIntroStep(null);
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
                    top="46px"
                    left="50%"
                    transform="translateX(-50%)"
                    px="12px"
                    py="5px"
                    borderRadius="999px"
                    bgColor="rgba(157,120,89,0.92)"
                    zIndex={8}
                  >
                    <Text color="#FFF" fontSize="12px" fontWeight="700">
                      往下滑動閱讀
                    </Text>
                  </Flex>
                ) : null}

                <Flex position="absolute" left="8px" top="50%" transform="translateY(-50%)" zIndex={8}>
                  <Flex as="button" w="34px" h="56px" borderRadius="999px" bgColor="rgba(70,55,40,0.7)" alignItems="center" justifyContent="center" onClick={() => scrollToComicPage(comicPageIndex - 1)}>
                    <Text color="white" fontSize="22px" fontWeight="700">‹</Text>
                  </Flex>
                </Flex>

                <Flex position="absolute" right="8px" top="50%" transform="translateY(-50%)" zIndex={8}>
                  <Flex as="button" w="34px" h="56px" borderRadius="999px" bgColor="rgba(70,55,40,0.7)" alignItems="center" justifyContent="center" onClick={() => scrollToComicPage(comicPageIndex + 1)}>
                    <Text color="white" fontSize="22px" fontWeight="700">›</Text>
                  </Flex>
                </Flex>

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
        <Flex direction="column" h="100%" minH="0" position="relative" overflow="hidden">
          <Flex
            flex="1"
            minH="0"
            border="2px solid rgba(127, 101, 75, 0.42)"
            borderRadius="4px"
            bgColor="#F6F1E7"
            position="relative"
            overflow="hidden"
          >
            <Flex position="absolute" top="0" left="0" right="0" h="40px" borderBottom="2px solid rgba(127, 101, 75, 0.28)" alignItems="center" justifyContent="space-between" px="20px">
              <Text color="#6A5037" fontSize="24px" fontWeight="700" lineHeight="1">
                ←
              </Text>
              <Text color="#5E4833" fontSize="18px" fontWeight="700">
                星期天 天氣 ☀
              </Text>
              <Text color="#6A5037" fontSize="24px" fontWeight="700" lineHeight="1">
                →
              </Text>
            </Flex>

            <Flex
              position="absolute"
              top="54px"
              left="16px"
              right="16px"
              bottom="90px"
              direction="column"
              gap="12px"
            >
              <Flex
                flex="0 0 62%"
                border="2px solid rgba(127, 101, 75, 0.35)"
                borderRadius="3px"
                overflow="hidden"
                bgColor="#EFE6D8"
              >
                <img
                  src="/images/diary/diary_demo.jpg"
                  alt="第一篇日記"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </Flex>
              <Flex
                flex="1"
                border="2px solid rgba(127, 101, 75, 0.3)"
                borderRadius="3px"
                bg="repeating-linear-gradient(90deg, rgba(154,122,92,0.14) 0px, rgba(154,122,92,0.14) 2px, transparent 2px, transparent 22px)"
                px="10px"
                py="8px"
                direction="column"
                justifyContent="flex-start"
                gap="22px"
                color="#5C4732"
                fontSize="14px"
                fontWeight="700"
                writingMode="vertical-rl"
                textOrientation="mixed"
              >
                <Text>好像惹小麥生氣了...</Text>
                <Text>我真的不是故意的...</Text>
              </Flex>
            </Flex>

            <Flex
              as="button"
              position="absolute"
              left="16px"
              bottom="48px"
              px="8px"
              py="4px"
              borderRadius="4px"
              bgColor="rgba(255,255,255,0.72)"
              onClick={() => {
                setIsDiaryReadTalkVisible(false);
                setDiaryReadTalkIndex(0);
                setIsComicReadMode(true);
                setIsComicControlsVisible(true);
                if (!hasShownComicReadHint) {
                  setShowComicReadHint(true);
                  setHasShownComicReadHint(true);
                  clearComicHintTimer();
                  comicHintTimerRef.current = setTimeout(() => {
                    setShowComicReadHint(false);
                  }, 2000);
                } else {
                  setShowComicReadHint(false);
                }
                setComicPageIndex(0);
                setTimeout(() => scrollToComicPage(0), 0);
              }}
            >
              <Text color="#6C5641" fontSize="13px" fontWeight="700">
                ▶ 觀看故事回放
              </Text>
            </Flex>
          </Flex>

          <Flex
            position="absolute"
            left="6px"
            bottom="6px"
            w="38px"
            h="38px"
            borderRadius="999px"
            border="2px solid rgba(127,101,75,0.55)"
            bgColor="#FFFDF8"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            onClick={() => {
              setJournalView("list");
              setIsComicReadMode(false);
              setIsComicControlsVisible(false);
              setShowComicReadHint(false);
              setComicPageIndex(0);
            }}
          >
            <Text color="#6A5037" fontSize="24px" fontWeight="700" lineHeight="1">
              ×
            </Text>
          </Flex>

            <Flex position="absolute" right="8px" bottom="8px" direction="column" gap="6px" alignItems="flex-end">
            <Flex px="10px" py="4px" borderRadius="2px" bgColor="#D9F0EF" border="1px solid rgba(114,93,70,0.24)">
              <Text color="#554331" fontSize="26px" fontWeight="700" lineHeight="1">
                小日獸
              </Text>
            </Flex>
            <Flex px="10px" py="4px" borderRadius="2px" bgColor="#F1EDCF" border="1px solid rgba(114,93,70,0.24)">
              <Text color="#554331" fontSize="26px" fontWeight="700" lineHeight="1">
                🐾日記
              </Text>
            </Flex>
          </Flex>

          {isDiaryReadTalkVisible ? (
            <Flex position="absolute" left="-16px" right="-16px" bottom="-16px" zIndex={12} direction="column">
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
      <Flex direction="column" gap="12px" h="100%" minH="0">
        <Text color="#5F4C3B" fontSize="15px" fontWeight="700">
          解鎖日記頁
        </Text>
        <Flex direction="column" gap="14px" flex="1" minH="0" overflowY="auto" pr="2px">
          {diaryCards.map((card) => {
            const isFirstUnlockCard = card.id === "bai-entry-1";
            const isFxLocked = isFirstUnlockCard && journalUnlockFxStage === "locked";
            const isFxUnlocking = isFirstUnlockCard && journalUnlockFxStage === "unlocking";
            const cardUnlocked = isFxLocked ? false : card.unlocked;
            return (
            <Flex key={card.id} direction="column" gap="8px">
              <Flex
                as="button"
                onClick={() => {
                  if (cardUnlocked && card.id === "bai-entry-1") setJournalView("entry-bai-1");
                }}
                cursor={cardUnlocked && card.id === "bai-entry-1" ? "pointer" : "default"}
                position="relative"
                borderRadius="8px"
                border="2px solid #A98662"
                overflow="hidden"
                bgColor="#F4EBDD"
                animation={isFxUnlocking ? `${unlockPulse} 620ms ease-out 1` : undefined}
              >
                <img
                  src={card.imagePath}
                  alt={card.title}
                  style={{
                    width: "100%",
                    height: "136px",
                    objectFit: "cover",
                    filter: cardUnlocked ? "none" : "grayscale(100%) blur(4px) brightness(0.72)",
                    transform: "scale(1.03)",
                  }}
                />
                {cardUnlocked ? null : (
                  <Flex
                    position="absolute"
                    inset="0"
                    bgColor="rgba(190,184,176,0.45)"
                    alignItems="center"
                    justifyContent="center"
                    direction="column"
                    gap="6px"
                  >
                    <Text color="#54483B" fontSize="22px" lineHeight="1">
                      🔒
                    </Text>
                    <Text color="#54483B" fontSize="18px" fontWeight="700" letterSpacing="0.04em">
                      {isFxLocked ? "解鎖中..." : "未解鎖"}
                    </Text>
                  </Flex>
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
              <Flex alignItems="center" justifyContent="space-between" px="2px">
                <Text color="#403226" fontSize="14px" fontWeight="700">
                  {card.title}
                </Text>
                <Text
                  color={cardUnlocked ? "#33261A" : "#8B7F72"}
                  fontSize="14px"
                  fontWeight="700"
                >
                  {cardUnlocked ? "已解鎖" : "未解鎖"}
                </Text>
              </Flex>
            </Flex>
          )})}
        </Flex>
      </Flex>
    );
  }, [
    activeTab,
    comicPageIndex,
    diaryReadTalkIndex,
    hasBaiEntry1,
    isDiaryReadTalkVisible,
    isComicControlsVisible,
    isComicReadMode,
    journalUnlockFxStage,
    journalView,
    hasShownComicReadHint,
    showComicReadHint,
    stickerCollection,
    sunbeastIntroStep,
    onGuidedFlowComplete,
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
        {isComicReadMode ? null : (
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
                  {"< 返回"}
                </Text>
              </Flex>
              <Text color="#FFF7EE" fontSize="20px" fontWeight="700" lineHeight="1">
                交換日記
              </Text>
              <Flex w="64px" />
            </Flex>

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
          </>
        )}

        <Flex
          flex="1"
          px={isComicReadMode ? "0" : "16px"}
          pt={isComicReadMode ? "0" : "12px"}
          pb={isComicReadMode ? "0" : "16px"}
          direction="column"
          overflow="hidden"
          bgColor={isComicReadMode ? "#0F0F0F" : "#FBF5EA"}
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
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
};

export function DiaryOverlay({ open, onClose, unlockedEntryIds }: DiaryOverlayProps) {
  const [activeTab, setActiveTab] = useState<"journal" | "sunbeast">("journal");
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
  const hasPlayedSunbeastHeartRef = useRef(false);
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
    setActiveTab("journal");
    setSunbeastIntroStep(null);
    hasPlayedSunbeastHeartRef.current = false;
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

    return (
      <Flex direction="column" gap="12px" h="100%" minH="0">
        <Text color="#5F4C3B" fontSize="15px" fontWeight="700">
          解鎖日記頁
        </Text>
        <Flex direction="column" gap="14px" flex="1" minH="0" overflowY="auto" pr="2px">
          {diaryCards.map((card) => (
            <Flex key={card.id} direction="column" gap="8px">
              <Flex
                position="relative"
                borderRadius="8px"
                border="2px solid #A98662"
                overflow="hidden"
                bgColor="#F4EBDD"
              >
                <img
                  src={card.imagePath}
                  alt={card.title}
                  style={{
                    width: "100%",
                    height: "136px",
                    objectFit: "cover",
                    filter: card.unlocked ? "none" : "grayscale(100%) blur(4px) brightness(0.72)",
                    transform: "scale(1.03)",
                  }}
                />
                {card.unlocked ? null : (
                  <Flex
                    position="absolute"
                    inset="0"
                    bgColor="rgba(190,184,176,0.45)"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="#54483B" fontSize="18px" fontWeight="700" letterSpacing="0.04em">
                      未解鎖
                    </Text>
                  </Flex>
                )}
              </Flex>
              <Flex alignItems="center" justifyContent="space-between" px="2px">
                <Text color="#403226" fontSize="14px" fontWeight="700">
                  {card.title}
                </Text>
                <Text
                  color={card.unlocked ? "#33261A" : "#8B7F72"}
                  fontSize="14px"
                  fontWeight="700"
                >
                  {card.unlocked ? "已解鎖" : "未解鎖"}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Flex>
    );
  }, [activeTab, hasBaiEntry1, stickerCollection, sunbeastIntroStep]);

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
            onClick={() => setActiveTab("journal")}
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
            onClick={() => setActiveTab("sunbeast")}
          >
            <Text color={activeTab === "sunbeast" ? "white" : "#6D5B48"} fontSize="12px" fontWeight="700">
              小日獸
            </Text>
          </Flex>
        </Flex>

        <Flex
          flex="1"
          px="16px"
          pt="12px"
          pb="16px"
          direction="column"
          overflow="hidden"
          bgColor="#FBF5EA"
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

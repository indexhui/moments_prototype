"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/navigation";
import { DiaryOverlay } from "@/components/game/DiaryOverlay";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import {
  EventPhotoCaptureLayer,
  type NaturalImageSize,
  type PhotoCaptureResult,
} from "@/components/game/events/EventPhotoCaptureLayer";
import { ROUTES } from "@/lib/routes";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import {
  loadPlayerProgress,
  markBusSunbeastCatEventTriggered,
  recordPhotoCapture,
  recordSunbeastPhotoCapture,
  unlockDiaryEntry,
} from "@/lib/game/playerProgress";
import { SUNBEAST_RETAKE_CAPTURE_PROPS } from "@/lib/game/sunbeastRegistry";

type CatStoryStage =
  | "fragment"
  | "opening"
  | "route-1"
  | "bus-stop"
  | "route-2"
  | "grocery"
  | "route-3"
  | "alley"
  | "photo"
  | "photo-result"
  | "diary"
  | "closing";

export type CatRouteStage = Extract<CatStoryStage, "route-1" | "route-2" | "route-3">;

export type StoryCatRoutePuzzleRenderProps = {
  stage: CatRouteStage;
  onComplete: () => void;
};

type CatStoryLine = {
  speaker: string;
  text: string;
  avatarSpriteId?: "mai" | "beigo";
  avatarFrameIndex?: number;
};

const CAT_IMAGE_PATH = "/images/animals/demo_cat.png";
const CAT_SHADOW_IMAGE_PATH = "/images/animals/demo_cat_shadow.png";
const STREET_BACKGROUND = "/images/428出圖/背景/公司附近街道_白天.jpg";
const BUS_STOP_BACKGROUND = "/images/outside/bus.jpg";
const GROCERY_BACKGROUND = "/images/outside/mart.jpg";
const ALLEY_BACKGROUND = "/images/428出圖/背景/家門口巷弄_白天.jpg";
const PUFF_SHOP_BACKGROUND = "/images/events/frog-dessert-shop/dessert-shop-interior.png";

const CAT_ROUTE_NEXT_STAGE: Record<CatRouteStage, CatStoryStage> = {
  "route-1": "bus-stop",
  "route-2": "grocery",
  "route-3": "alley",
};

const STORY_LINES: Record<
  Extract<CatStoryStage, "opening" | "bus-stop" | "grocery" | "alley" | "photo-result" | "closing">,
  CatStoryLine[]
> = {
  opening: [
    {
      speaker: "旁白",
      text: "上一回合，小麥想起以前特地排隊買泡芙給小白，結果整盒都被小白吃光的事。",
    },
    {
      speaker: "小麥",
      text: "現在回想起她那副愛吃的模樣，還是覺得又好氣又好笑……",
      avatarSpriteId: "mai",
      avatarFrameIndex: 18,
    },
    {
      speaker: "小麥",
      text: "好懷念啊。乾脆再去買一次那間店的泡芙吧。",
      avatarSpriteId: "mai",
      avatarFrameIndex: 6,
    },
    {
      speaker: "小貝狗",
      text: "嗷！那就出發去泡芙店！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 2,
    },
  ],
  "bus-stop": [
    {
      speaker: "旁白",
      text: "前往泡芙店的路上，小麥經過一座公車站牌。",
    },
    {
      speaker: "小貝狗",
      text: "小麥，妳看遮雨棚上面！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 1,
    },
    {
      speaker: "小麥",
      text: "咦？那裡有一隻貓咪……是小日獸！",
      avatarSpriteId: "mai",
      avatarFrameIndex: 34,
    },
    {
      speaker: "旁白",
      text: "小麥立刻拿起相機。快門按下的瞬間，貓咪卻突然往前一跳。",
    },
    {
      speaker: "小麥",
      text: "啊，照片整張都糊掉了！",
      avatarSpriteId: "mai",
      avatarFrameIndex: 25,
    },
    {
      speaker: "旁白",
      text: "貓小日獸自信滿滿地盯著剛靠站的公車車頂，尾巴輕輕晃了兩下。",
    },
    {
      speaker: "小麥",
      text: "等等……牠不會是想跳到公車上吧？",
      avatarSpriteId: "mai",
      avatarFrameIndex: 14,
    },
    {
      speaker: "旁白",
      text: "貓咪奮力一躍，卻把距離算錯了。兩隻小手勉強搆住車頂邊緣，身體在半空中晃來晃去。",
    },
    {
      speaker: "小麥",
      text: "危險！快爬上去！",
      avatarSpriteId: "mai",
      avatarFrameIndex: 25,
    },
    {
      speaker: "旁白",
      text: "牠蹬了好幾下，總算狼狽地翻上車頂。公車也在這時緩緩起步。",
    },
    {
      speaker: "小貝狗",
      text: "牠要跑掉了！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 1,
    },
    {
      speaker: "小麥",
      text: "沒辦法，只能改路線了。先上同一班公車追牠！",
      avatarSpriteId: "mai",
      avatarFrameIndex: 37,
    },
  ],
  grocery: [
    {
      speaker: "旁白",
      text: "小麥下車後，貓咪已經不見蹤影。她只好站在街口四處張望。",
    },
    {
      speaker: "小麥",
      text: "跑去哪裡了……",
      avatarSpriteId: "mai",
      avatarFrameIndex: 14,
    },
    {
      speaker: "小貝狗",
      text: "那邊！雜貨店門口！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 1,
    },
    {
      speaker: "旁白",
      text: "貓咪一邊鬼鬼祟祟地觀察老闆，一邊死死盯著門口的一包柴魚片。",
    },
    {
      speaker: "小麥",
      text: "等等，不可以拿那個——",
      avatarSpriteId: "mai",
      avatarFrameIndex: 13,
    },
    {
      speaker: "旁白",
      text: "話還沒說完，貓咪已經叼起柴魚片，飛快地逃走了。",
    },
    {
      speaker: "雜貨店老闆",
      text: "抓小偷！小姐，那隻不是妳養的貓嗎？",
    },
    {
      speaker: "小麥",
      text: "不是！牠不是我的寵物……唉，這包我付就是了。",
      avatarSpriteId: "mai",
      avatarFrameIndex: 3,
    },
    {
      speaker: "旁白",
      text: "等小麥付完錢，貓咪早已不見。門口卻留下一串沾著灰塵的小腳印。",
    },
    {
      speaker: "小貝狗",
      text: "腳印拐進小巷子了。我們再改一次路線吧！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 0,
    },
  ],
  alley: [
    {
      speaker: "旁白",
      text: "小麥沿著腳印深入小巷，四周安靜得只剩下遠處的車聲。",
    },
    {
      speaker: "小麥",
      text: "腳印到這裡……找到了！",
      avatarSpriteId: "mai",
      avatarFrameIndex: 38,
    },
    {
      speaker: "旁白",
      text: "貓咪蹲在巷子深處，正專心舔著偷來的柴魚片，完全沒有注意到小麥。",
    },
    {
      speaker: "小貝狗",
      text: "趁現在，慢慢拿出相機。",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 0,
    },
  ],
  "photo-result": [
    {
      speaker: "旁白",
      text: "快門聲落下的瞬間，貓小日獸化成一道光，被收進了照片裡。",
    },
    {
      speaker: "小麥",
      text: "拍到了！這次沒有糊掉。",
      avatarSpriteId: "mai",
      avatarFrameIndex: 6,
    },
    {
      speaker: "小貝狗",
      text: "嗷！貓小日獸收服成功！",
      avatarSpriteId: "beigo",
      avatarFrameIndex: 2,
    },
  ],
  closing: [
    {
      speaker: "旁白",
      text: "小麥收起照片，從巷子的另一端走回原本的路線。泡芙店的招牌就在前方。",
    },
  ],
};

const catHop = keyframes`
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  45% { transform: translateY(-18px) rotate(3deg); }
`;

function CatDiaryFragmentPrompt({ onContinue }: { onContinue: () => void }) {
  return (
    <Flex position="absolute" inset="0" zIndex={20} bgColor="#F7F0E4" alignItems="center" justifyContent="center" p="20px">
      <Flex
        w="100%"
        maxW="362px"
        maxH="calc(100% - 32px)"
        overflowY="auto"
        direction="column"
        bgColor="#FFFDF9"
        border="2px solid #657179"
        borderRadius="8px"
        boxShadow="0 18px 36px rgba(80,54,33,0.18)"
      >
        <Flex h="48px" flexShrink={0} bgColor="#C7DADB" alignItems="center" justifyContent="center">
          <Text color="white" fontSize="19px" fontWeight="900">
            貓日記・碎片 1
          </Text>
        </Flex>
        <Flex direction="column" alignItems="center" gap="16px" p="20px">
          <Image src={CAT_SHADOW_IMAGE_PATH} alt="貓小日獸的影子" w="132px" h="132px" objectFit="contain" filter="brightness(0) opacity(0.56)" />
          <Text color="#5E554E" fontSize="15px" fontWeight="600" lineHeight="1.75" whiteSpace="pre-line">
            {"小白受共同朋友之託，製作婚禮用的喜帖、背板、似顏繪……\n\n小白對自己的作畫速度很有自信，一直拖著沒做，結果交稿日才發現畫不完。"}
          </Text>
          <Flex as="button" h="44px" w="100%" borderRadius="999px" bgColor="#7896AF" alignItems="center" justifyContent="center" onClick={onContinue}>
            <Text color="white" fontSize="16px" fontWeight="800">
              收起日記，前往街道
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

export function StoryCatSunbeastRouteView({
  onProgressSaved,
  renderRoutePuzzle,
}: {
  onProgressSaved?: () => void;
  renderRoutePuzzle: (props: StoryCatRoutePuzzleRenderProps) => ReactNode;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<CatStoryStage>("fragment");
  const [lineIndex, setLineIndex] = useState(0);
  const [photoResetNonce, setPhotoResetNonce] = useState(0);
  const [naturalImageSize, setNaturalImageSize] = useState<NaturalImageSize | null>(null);
  const [diaryUnlockedEntryIds, setDiaryUnlockedEntryIds] = useState<
    ReturnType<typeof loadPlayerProgress>["unlockedDiaryEntryIds"]
  >(["bai-entry-8"]);
  const photoBackgroundRef = useRef<HTMLDivElement | null>(null);
  const storyLines =
    stage === "opening" ||
    stage === "bus-stop" ||
    stage === "grocery" ||
    stage === "alley" ||
    stage === "photo-result" ||
    stage === "closing"
      ? STORY_LINES[stage]
      : null;
  const activeLine = storyLines?.[lineIndex] ?? null;

  useEffect(() => {
    const progress = loadPlayerProgress();
    setDiaryUnlockedEntryIds(
      Array.from(new Set([...progress.unlockedDiaryEntryIds, "bai-entry-8" as const])),
    );
  }, []);

  useEffect(() => {
    const image = new window.Image();
    image.src = ALLEY_BACKGROUND;
    image.onload = () => {
      setNaturalImageSize({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
  }, []);

  const advanceStoryLine = () => {
    if (!storyLines) return;
    if (lineIndex < storyLines.length - 1) {
      setLineIndex((current) => current + 1);
      return;
    }
    setLineIndex(0);
    if (stage === "opening") setStage("route-1");
    if (stage === "bus-stop") setStage("route-2");
    if (stage === "grocery") setStage("route-3");
    if (stage === "alley") {
      setPhotoResetNonce((current) => current + 1);
      setStage("photo");
    }
    if (stage === "photo-result") setStage("diary");
    if (stage === "closing") {
      router.push(withTrialProfileSearch(ROUTES.gameLobby));
    }
  };

  const handleConfirmPhoto = (capture: PhotoCaptureResult) => {
    const photoSnapshot = {
      sourceImage: capture.sourceImage,
      previewImage: capture.framePreviewUrl,
      dogCoveragePercent: capture.score,
      cameraFrameRect: capture.normalizedCameraFrameRect,
      capturedRect: capture.normalizedCroppedRect,
    };
    recordPhotoCapture(photoSnapshot);
    recordSunbeastPhotoCapture("cat", photoSnapshot, { maxCaptures: 1 });
    markBusSunbeastCatEventTriggered();
    unlockDiaryEntry("bai-entry-8");
    setDiaryUnlockedEntryIds((current) =>
      Array.from(new Set([...current, "bai-entry-8" as const])),
    );
    onProgressSaved?.();
    setLineIndex(0);
    setStage("photo-result");
  };

  if (stage === "route-1" || stage === "route-2" || stage === "route-3") {
    const routeStage = stage;
    return (
      <>
        {renderRoutePuzzle({
          stage: routeStage,
          onComplete: () => {
            setLineIndex(0);
            setStage(CAT_ROUTE_NEXT_STAGE[routeStage]);
          },
        })}
      </>
    );
  }

  const backgroundImage =
    stage === "opening"
      ? STREET_BACKGROUND
      : stage === "bus-stop"
        ? BUS_STOP_BACKGROUND
        : stage === "grocery"
          ? GROCERY_BACKGROUND
          : stage === "alley" || stage === "photo" || stage === "photo-result"
            ? ALLEY_BACKGROUND
            : stage === "closing"
              ? PUFF_SHOP_BACKGROUND
              : STREET_BACKGROUND;

  return (
    <Flex
      position="relative"
      w={{ base: "100vw", sm: "393px" }}
      maxW="393px"
      h={{ base: "100dvh", sm: "852px" }}
      maxH="852px"
      minH="0"
      overflow="hidden"
      direction="column"
      bgColor="#F4EBDD"
      borderRadius={{ base: "0", sm: "20px" }}
      boxShadow={{ base: "none", sm: "0 10px 30px rgba(0,0,0,0.12)" }}
    >
      <Flex
          ref={stage === "photo" ? photoBackgroundRef : undefined}
          position="relative"
          flex="1"
          minH="0"
          bgImage={`linear-gradient(rgba(25,22,18,0.08), rgba(25,22,18,0.2)), url('${backgroundImage}')`}
          bgSize={stage === "photo" ? "contain" : "cover"}
          backgroundPosition="center"
          bgRepeat="no-repeat"
          bgColor="#2B2924"
          overflow="hidden"
        >
          {stage === "fragment" ? <CatDiaryFragmentPrompt onContinue={() => setStage("opening")} /> : null}

          {(stage === "bus-stop" || stage === "alley" || stage === "photo" || stage === "photo-result") ? (
            <Image
              src={CAT_IMAGE_PATH}
              alt="貓小日獸"
              position="absolute"
              left={stage === "bus-stop" ? "51%" : "48%"}
              top={stage === "bus-stop" ? "12%" : "48%"}
              w={stage === "bus-stop" ? "28%" : "30%"}
              h={stage === "bus-stop" ? "28%" : "30%"}
              objectFit="contain"
              zIndex={3}
              pointerEvents="none"
              animation={stage === "bus-stop" ? `${catHop} 1.8s ease-in-out infinite` : undefined}
              filter="drop-shadow(0 8px 12px rgba(0,0,0,0.26))"
            />
          ) : null}

          {stage === "grocery" ? (
            <Flex position="absolute" right="28px" top="30%" zIndex={3} direction="column" alignItems="center" animation={`${catHop} 1.8s ease-in-out infinite`}>
              <Image src={CAT_IMAGE_PATH} alt="叼走柴魚片的貓小日獸" w="128px" h="128px" objectFit="contain" filter="drop-shadow(0 8px 12px rgba(0,0,0,0.3))" />
              <Flex px="10px" py="4px" borderRadius="999px" bgColor="rgba(255,250,238,0.9)">
                <Text color="#725A45" fontSize="12px" fontWeight="900">
                  柴魚片
                </Text>
              </Flex>
            </Flex>
          ) : null}

          {stage === "photo" ? (
            <EventPhotoCaptureLayer
              enabled
              resetNonce={photoResetNonce}
              backgroundRef={photoBackgroundRef}
              backgroundImageSrc={ALLEY_BACKGROUND}
              naturalImageSize={naturalImageSize}
              fitMode="contain"
              targetRectNormalized={{ x: 0.48, y: 0.48, width: 0.3, height: 0.3 }}
              captureOverlays={[
                {
                  imageSrc: CAT_IMAGE_PATH,
                  rectNormalized: { x: 0.48, y: 0.48, width: 0.3, height: 0.3 },
                },
              ]}
              passScore={58}
              hintText="趁貓咪專心舔柴魚片時按下快門"
              tutorialTitle="拍下貓小日獸"
              tutorialLines={[
                "讓貓小日獸進到取景框中央，再按下快門。",
                "照片會連同巷子裡的貓咪一起保存到日記。",
              ]}
              tutorialConfirmLabel="開始拍照"
              {...SUNBEAST_RETAKE_CAPTURE_PROPS}
              onConfirm={handleConfirmPhoto}
            />
          ) : null}

          {activeLine ? (
            <Flex position="absolute" inset="0" zIndex={stage === "photo" ? 0 : 10} direction="column" justifyContent="flex-end" bgColor="rgba(22,19,16,0.18)" cursor="pointer" onClick={advanceStoryLine}>
              {activeLine.avatarSpriteId ? (
                <Flex position="absolute" left="14px" bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`} zIndex={6} pointerEvents="none">
                  <EventAvatarSprite spriteId={activeLine.avatarSpriteId} frameIndex={activeLine.avatarFrameIndex ?? 0} />
                </Flex>
              ) : null}
              <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
                <Text color="white" fontWeight="700">
                  {activeLine.speaker}
                </Text>
                <Flex flex="1" minH="0" alignItems="center">
                  <Text color="white" fontSize="16px" lineHeight="1.65">
                    {activeLine.text}
                  </Text>
                </Flex>
                <EventContinueAction onClick={advanceStoryLine} />
              </EventDialogPanel>
            </Flex>
          ) : null}
        </Flex>

      {stage === "diary" ? (
        <DiaryOverlay
          open
          onClose={() => setStage("closing")}
          unlockedEntryIds={diaryUnlockedEntryIds}
          mode="sunbeast-cat-reveal"
          revealEntryId="bai-entry-8"
          initialSunbeastCardId="cat"
          onDiaryRevealEntryComplete={() => setStage("closing")}
          onGuidedFlowComplete={() => setStage("closing")}
          showReturnButton
        />
      ) : null}
    </Flex>
  );
}

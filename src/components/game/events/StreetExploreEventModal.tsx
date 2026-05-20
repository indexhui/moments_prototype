"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";
import { getTypingAdvance, loadDialogTypingMode } from "@/lib/game/dialogTyping";

const STREET_CARD_BG = "#FFFDF9";
const STREET_CARD_SHADOW = "0 8px 14px rgba(88,59,33,0.08)";
const STREET_THUMBNAIL_IMAGE = "/images/背景/公司附近街道_黃昏.jpg";
const STREET_HALFTONE_PATTERN = "/images/pattern/gradient_halftone_01.png";
const MARKET_STREET_COMIC_IMAGE = "/images/comic/comic_market_street.png";
const MARKET_STREET_ITEM_IMAGE = "/images/gamePlay_demo/gameplay_demo01.png";
const MARKET_STREET_GUIDE_TOP_IMAGE = "/images/gamePlay_demo/gameplay_demo02.png";
const MARKET_STREET_GUIDE_BOTTOM_IMAGE = "/images/gamePlay_demo/gameplay_demo03.png";

const comicPanelFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
`;

const marketItemFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, 12px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
`;

const marketGuideFadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const marketGuideBackgroundDrift = keyframes`
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(-32px, 32px);
  }
`;

export type StreetExploreOutcome =
  | "stroll"
  | "stationery-street"
  | "shopping-street"
  | "river-walk";

type StreetExploreEventModalProps = {
  onFinish: (outcome: StreetExploreOutcome) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

const STREET_EXPLORE_RESULTS: Record<
  StreetExploreOutcome,
  { title: string; line: string; effect: string }
> = {
  stroll: {
    title: "散步",
    line: "你放慢腳步，在街道上到處走走。路口的風和行人的聲音混在一起，讓腦袋裡悶住的感覺淡了一些。",
    effect: "疲勞值 -5",
  },
  "stationery-street": {
    title: "文具街",
    line: "你打聽到附近有一條文具街，有很多特別的文具，尤其是手帳和紙膠帶。",
    effect: "獲得地點情報",
  },
  "shopping-street": {
    title: "商店街",
    line: "你打聽到附近的商店街很熱鬧，店家也很熱情。",
    effect: "獲得地點情報",
  },
  "river-walk": {
    title: "河堤步道",
    line: "你打聽到河堤步道有很多人在散步、遛狗，氣氛比街口安靜一些。",
    effect: "獲得地點情報",
  },
};

const STREET_SCOUT_OPTIONS: Array<{
  outcome: StreetExploreOutcome;
  title: string;
  description: string;
}> = [
  {
    outcome: "stationery-street",
    title: "文具街",
    description: "有很多特別的文具，特別是手帳和紙膠帶很多",
  },
  {
    outcome: "shopping-street",
    title: "商店街",
    description: "很熱鬧，店家也很熱情",
  },
  {
    outcome: "river-walk",
    title: "河堤步道",
    description: "有很多人在散步、遛狗",
  },
];

const MARKET_STREET_EVENT_PHASES = [
  {
    kind: "line",
    speaker: "旁白",
    text: "在跟商店街的管理員聊天時，提到最近舊街區，早上會聽到沒聽過的叫聲。",
  },
  {
    kind: "line",
    speaker: "旁白",
    text: "再過問之下，管理員很熱情地提供我們前往舊街區的路線。",
  },
  {
    kind: "effect",
    speaker: "獲得",
    text: "獲得特殊地圖",
  },
  {
    kind: "line",
    speaker: "小麥",
    text: "如果是最近出現的聲音，那很有可能是小日獸吧。",
  },
  {
    kind: "line",
    speaker: "小貝狗",
    text: "嗯！可以去探探～",
  },
  {
    kind: "guide",
    speaker: "引導",
    text: "可以在 行程安排時切換地圖",
  },
] as const;

export function StreetExploreEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: StreetExploreEventModalProps) {
  const [step, setStep] = useState<"choice" | "scout" | "result" | "market-event">("choice");
  const [outcome, setOutcome] = useState<StreetExploreOutcome | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [marketPhaseIndex, setMarketPhaseIndex] = useState(0);
  const [marketDisplayText, setMarketDisplayText] = useState("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingMode = loadDialogTypingMode();

  const result = outcome ? STREET_EXPLORE_RESULTS[outcome] : null;
  const marketPhase = MARKET_STREET_EVENT_PHASES[marketPhaseIndex];
  const isMarketEffectPhase = marketPhase.kind === "effect";
  const isMarketGuidePhase = marketPhase.kind === "guide";
  const isMarketTypingComplete = marketDisplayText === marketPhase.text;
  const shouldShowMarketAvatar = marketPhase.speaker === "小麥" || marketPhase.speaker === "小貝狗";
  const marketAvatarSpriteId = marketPhase.speaker === "小貝狗" ? "beigo" : "mai";
  const historyLines = useMemo(() => {
    const lines = [
      {
        id: "intro",
        speaker: "旁白",
        text: "你進到公司附近的街道。今天沒有特別被什麼事攔住，可以先決定要打探附近，還是單純走走。",
      },
    ];
    if (step === "scout") {
      lines.push({ id: "scout", speaker: "旁白", text: "你開始打聽附近有哪些地方可以去。" });
    }
    if (result && step !== "market-event") {
      lines.push({ id: "result", speaker: "旁白", text: result.line });
    }
    if (step === "market-event") {
      MARKET_STREET_EVENT_PHASES.slice(0, marketPhaseIndex + 1).forEach((item, index) => {
        lines.push({
          id: `market-street-${index}`,
          speaker: item.speaker,
          text: item.text,
        });
      });
    }
    return lines;
  }, [marketPhaseIndex, result, step]);

  useEffect(() => {
    if (step !== "market-event") return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (marketPhase.kind === "guide") {
      setMarketDisplayText(marketPhase.text);
      return;
    }
    let cursor = 0;
    setMarketDisplayText("");
    const tick = () => {
      const previousChar = cursor > 0 ? marketPhase.text[cursor - 1] : "";
      const { step: advanceStep, delay } = getTypingAdvance(typingMode, previousChar);
      cursor = Math.min(marketPhase.text.length, cursor + advanceStep);
      setMarketDisplayText(marketPhase.text.slice(0, cursor));
      if (cursor < marketPhase.text.length) {
        typingTimerRef.current = setTimeout(tick, delay);
      }
    };
    typingTimerRef.current = setTimeout(tick, 140);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [marketPhase.text, step, typingMode]);

  const chooseOutcome = (nextOutcome: StreetExploreOutcome) => {
    if (nextOutcome === "shopping-street") {
      setOutcome(nextOutcome);
      setMarketPhaseIndex(0);
      setStep("market-event");
      return;
    }
    setOutcome(nextOutcome);
    setStep("result");
  };

  const handleMarketContinue = () => {
    if (isMarketGuidePhase) {
      onFinish("shopping-street");
      return;
    }
    if (!isMarketTypingComplete) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setMarketDisplayText(marketPhase.text);
      return;
    }
    if (marketPhaseIndex < MARKET_STREET_EVENT_PHASES.length - 1) {
      setMarketPhaseIndex((current) => current + 1);
      return;
    }
    onFinish("shopping-street");
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      {isMarketGuidePhase ? (
        <MarketStreetGuidePage onConfirm={() => onFinish("shopping-street")} />
      ) : null}

      <Flex
        flex="1"
        bgImage="url('/images/背景/公司附近街道_白天.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          left="0"
          right="0"
          bottom="-1px"
          h="112px"
          bgColor="#8B6D54"
          clipPath="polygon(0 100%, 100% 38%, 100% 100%)"
          pointerEvents="none"
        />

        <StreetLocationTitle title={step === "market-event" ? "商店街" : "街道"} />

        {step === "market-event" ? (
          <>
            {isMarketEffectPhase ? (
              <Flex
                position="absolute"
                top="74px"
                left="50%"
                w="calc(100% - 78px)"
                maxW="315px"
                pointerEvents="none"
                animation={`${marketItemFadeIn} 420ms ease-out both`}
                filter="drop-shadow(0 12px 18px rgba(72,50,31,0.16))"
              >
                <img
                  src={MARKET_STREET_ITEM_IMAGE}
                  alt="獲得的特殊地圖"
                  style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
                />
              </Flex>
            ) : (
              <Flex
                position="absolute"
                top="186px"
                left="50%"
                w="calc(100% - 42px)"
                maxW="351px"
                overflow="hidden"
                pointerEvents="none"
                animation={`${comicPanelFadeIn} 520ms ease-out both`}
                filter="drop-shadow(0 10px 14px rgba(72,50,31,0.16))"
              >
                <img
                  src={MARKET_STREET_COMIC_IMAGE}
                  alt="商店街漫畫格"
                  style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
                />
              </Flex>
            )}
          </>
        ) : null}

        {step === "market-event" ? null : (
          <Flex
            position="absolute"
            left="0"
            right="0"
            top={step === "scout" ? "198px" : "232px"}
            direction="column"
            gap="24px"
          >
            {step === "choice" ? (
              <>
                <StreetExploreChoiceButton
                  title="打探"
                  description="打聽探店，也許有小日獸的蹤跡"
                  onClick={() => setStep("scout")}
                />
                <StreetExploreChoiceButton
                  title="散步"
                  description="最近發生好多事，到處走走散散心"
                  onClick={() => chooseOutcome("stroll")}
                />
              </>
            ) : step === "scout" ? (
              <>
                {STREET_SCOUT_OPTIONS.map((option, index) => (
                  <StreetExploreChoiceButton
                    key={option.outcome}
                    title={option.title}
                    description={option.description}
                    onClick={() => chooseOutcome(option.outcome)}
                    size={index === 0 ? "large" : "default"}
                  />
                ))}
              </>
            ) : (
              <Flex direction="column" gap="16px" alignItems="center" px="20px">
                <Flex
                  w="100%"
                  minH="176px"
                  position="relative"
                  overflow="hidden"
                  alignItems="center"
                  gap="18px"
                  px="28px"
                  py="22px"
                  bgColor={STREET_CARD_BG}
                  boxShadow={STREET_CARD_SHADOW}
                >
                  <StreetHalftoneLayer />
                  <Flex w="76px" h="76px" flexShrink={0} overflow="hidden" bgColor="#EFE6D9">
                    <img
                      src={STREET_THUMBNAIL_IMAGE}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Flex>
                  <Flex direction="column" flex="1" minW="0" gap="8px">
                    <Text color="#8B6D54" fontSize="28px" fontWeight="700" lineHeight="1.15">
                      {result?.title}
                    </Text>
                    <Text color="#8B6D54" fontSize="15px" lineHeight="1.55">
                      {result?.line}
                    </Text>
                    <Flex alignSelf="flex-start" px="12px" py="5px" borderRadius="999px" bgColor="#9D7859">
                      <Text color="#FFFFFF" fontSize="12px" fontWeight="700" lineHeight="1">
                        {result?.effect}
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex
                  w="100%"
                  maxW="320px"
                  h="52px"
                  position="relative"
                  borderRadius="14px"
                  overflow="hidden"
                >
                  <EventContinueAction
                    enabled={Boolean(outcome)}
                    onClick={() => {
                      if (!outcome) return;
                      onFinish(outcome);
                    }}
                  />
                </Flex>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>

      {isMarketGuidePhase ? null : (
        <DialogQuickActions
          onOpenOptions={() => {}}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
      )}

      {step === "market-event" && !isMarketGuidePhase ? (
        <>
          <Flex
            position="absolute"
            left="14px"
            bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
            transform="none"
            zIndex={4}
            pointerEvents="none"
            opacity={shouldShowMarketAvatar ? 1 : 0}
          >
            <EventAvatarSprite spriteId={marketAvatarSpriteId} frameIndex={0} />
          </Flex>

          <EventDialogPanel>
            {marketPhase.speaker === "旁白" ? null : (
              <Text color={isMarketEffectPhase ? "#F9E17D" : "white"} fontWeight="700">
                {marketPhase.speaker}
              </Text>
            )}
            <Flex flex="1" minH="0" direction="column" justifyContent={isMarketEffectPhase ? "center" : "flex-start"}>
              <Text
                color={isMarketEffectPhase ? "#F9E17D" : "white"}
                fontSize={isMarketEffectPhase ? "18px" : "16px"}
                fontWeight={isMarketEffectPhase ? "700" : "400"}
                lineHeight="1.6"
              >
                {marketDisplayText}
              </Text>
            </Flex>
            <EventContinueAction enabled={isMarketTypingComplete} onClick={handleMarketContinue} />
          </EventDialogPanel>
        </>
      ) : null}

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}

function StreetLocationTitle({ title }: { title: string }) {
  return (
    <Flex
      position="absolute"
      left="50%"
      top="112px"
      transform="translateX(-50%)"
      w="186px"
      h="54px"
      borderRadius="999px"
      bgColor="#FFFDF9"
      border="2px solid #9D7859"
      alignItems="center"
      justifyContent="center"
      gap="18px"
      overflow="hidden"
      boxShadow="0 5px 10px rgba(88,59,33,0.08)"
    >
      <StreetHalftoneLayer />
      <Flex w="34px" h="34px" alignItems="center" justifyContent="center">
        <img
          src="/images/icon/street.png"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </Flex>
      <Text color="#9D7859" fontSize="25px" fontWeight="400" lineHeight="1">
        {title}
      </Text>
    </Flex>
  );
}

function MarketStreetGuidePage({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={90}
      direction="column"
      alignItems="center"
      bgColor="#A77F5C"
      px="62px"
      pt="42px"
      pb="34px"
      overflow="hidden"
      animation={`${marketGuideFadeIn} 300ms ease-out both`}
    >
      <Box
        position="absolute"
        inset="-36px"
        bgImage="linear-gradient(45deg, rgba(126,91,60,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(126,91,60,0.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(126,91,60,0.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(126,91,60,0.12) 75%)"
        bgSize="32px 32px"
        backgroundPosition="0 0, 0 16px, 16px -16px, -16px 0"
        pointerEvents="none"
        animation={`${marketGuideBackgroundDrift} 3.5s linear infinite`}
      />

      <Flex position="relative" zIndex={1} direction="column" gap="12px" w="100%" maxW="228px" alignItems="center">
        <Flex w="100%" bgColor="#F9E9B1" overflow="hidden">
          <img
            src={MARKET_STREET_GUIDE_TOP_IMAGE}
            alt=""
            style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
          />
        </Flex>
        <Flex w="100%" bgColor="#DDEFEA" overflow="hidden">
          <img
            src={MARKET_STREET_GUIDE_BOTTOM_IMAGE}
            alt=""
            style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
          />
        </Flex>
      </Flex>

      <Flex
        position="relative"
        zIndex={1}
        mt="22px"
        w="100%"
        maxW="356px"
        minH="142px"
        direction="column"
        alignItems="center"
        justifyContent="center"
        gap="20px"
        bgColor="#806248"
        borderRadius="6px"
        px="28px"
        py="22px"
        boxShadow="0 12px 20px rgba(72,50,31,0.18)"
      >
        <Text color="#FFFFFF" fontSize="16px" lineHeight="1.5" textAlign="center">
          可以在 行程安排時切換地圖
        </Text>
        <Flex
          as="button"
          w="134px"
          h="42px"
          borderRadius="999px"
          bgColor="#BF9270"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          transition="transform 140ms ease, background-color 140ms ease"
          _hover={{ bgColor: "#C89A77", transform: "translateY(-1px)" }}
          _active={{ bgColor: "#B68663", transform: "translateY(0)" }}
          onClick={onConfirm}
        >
          <Text color="#FFFFFF" fontSize="20px" fontWeight="700" lineHeight="1">
            確定
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function StreetHalftoneLayer() {
  return (
    <Box
      position="absolute"
      inset="0"
      bgImage={`url('${STREET_HALFTONE_PATTERN}')`}
      bgSize="cover"
      backgroundPosition="center"
      opacity={0.4}
      pointerEvents="none"
    />
  );
}

function StreetExploreChoiceButton({
  title,
  description,
  onClick,
  size = "default",
}: {
  title: string;
  description: string;
  onClick: () => void;
  size?: "default" | "large";
}) {
  return (
    <Flex
      as="button"
      w="calc(100% - 40px)"
      minH={size === "large" ? "120px" : "116px"}
      mx="20px"
      bgColor={STREET_CARD_BG}
      px="28px"
      py="18px"
      alignItems="center"
      gap="22px"
      cursor="pointer"
      textAlign="left"
      position="relative"
      overflow="hidden"
      boxShadow={STREET_CARD_SHADOW}
      transition="transform 140ms ease, background-color 140ms ease, box-shadow 140ms ease"
      _hover={{
        transform: "translateY(-2px)",
        bgColor: "#FDF6D8",
        boxShadow: "0 10px 18px rgba(88,59,33,0.2)",
      }}
      _active={{ transform: "translateY(0)", bgColor: "#EFE6D9" }}
      onClick={onClick}
    >
      <StreetHalftoneLayer />
      <Flex w="70px" h="70px" flexShrink={0} overflow="hidden" bgColor="#EFE6D9">
        <img
          src={STREET_THUMBNAIL_IMAGE}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </Flex>
      <Flex direction="column" flex="1" minW="0" gap="8px">
        <Text color="#8B6D54" fontSize="26px" fontWeight="700" lineHeight="1.15">
          {title}
        </Text>
        <Text color="#8B6D54" fontSize="14px" lineHeight="1.45">
          {description}
        </Text>
      </Flex>
    </Flex>
  );
}

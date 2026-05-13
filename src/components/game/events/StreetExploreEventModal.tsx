"use client";

import { useMemo, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import {
  EventDialogPanel,
  EVENT_DIALOG_HEIGHT,
} from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";

export type StreetExploreOutcome = "breeze" | "puzzle-fragments" | "cookie";

type StreetExploreEventModalProps = {
  onFinish: (outcome: StreetExploreOutcome) => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

const STREET_EXPLORE_RESULTS: Record<
  StreetExploreOutcome,
  { line: string; effect: string }
> = {
  breeze: {
    line: "你放慢腳步。騎樓邊吹來一陣剛剛好的風，連等紅燈的時間都變得沒那麼煩。",
    effect: "疲勞值 -5",
  },
  "puzzle-fragments": {
    line: "你在騎樓邊停了一下，注意到地上有兩片被風吹到牆角的小碎片。撿起來看，形狀剛好像能拼進行程裡。",
    effect: "獲得拼圖碎片 x2",
  },
  cookie: {
    line: "你停下來看了一眼騎樓邊的小攤。對方像是早就等到你抬頭，立刻熱情地招了招手。",
    effect: "遇到手工餅乾推銷",
  },
};

export function StreetExploreEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: StreetExploreEventModalProps) {
  const [step, setStep] = useState<"choice" | "result">("choice");
  const [outcome, setOutcome] = useState<StreetExploreOutcome | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const result = outcome ? STREET_EXPLORE_RESULTS[outcome] : null;
  const historyLines = useMemo(() => {
    const lines = [
      {
        id: "intro",
        speaker: "旁白",
        text: "街道比想像中熱鬧。騎樓下有人收起攤位，路口的機車聲一下近一下遠。",
      },
    ];
    if (result) {
      lines.push({ id: "result", speaker: "旁白", text: result.line });
    }
    return lines;
  }, [result]);

  const chooseLookAround = () => {
    const roll = Math.random();
    if (roll < 0.46) {
      setOutcome("breeze");
    } else if (roll < 0.76) {
      setOutcome("puzzle-fragments");
    } else {
      setOutcome("cookie");
    }
    setStep("result");
  };

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        flex="1"
        bgImage="url('/images/street.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
      >
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          街道
        </Text>
      </Flex>

      <Flex
        position="absolute"
        left="14px"
        bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
        transform="none"
        zIndex={4}
        pointerEvents="none"
      >
        <EventAvatarSprite />
      </Flex>

      <DialogQuickActions
        onOpenOptions={() => {}}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {step === "choice" ? (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            旁白
          </Text>
          <Text color="white" fontSize="16px" lineHeight="1.5">
            街道比想像中熱鬧。騎樓下有人收起攤位，路口的機車聲一下近一下遠。
          </Text>

          <Flex direction="column" gap="8px">
            <StreetExploreChoiceButton
              title="到處看看"
              description="多看一眼今天的街口。"
              onClick={chooseLookAround}
            />
          </Flex>
        </EventDialogPanel>
      ) : (
        <EventDialogPanel>
          <Text color="white" fontWeight="700">
            旁白
          </Text>
          <Flex flex="1" minH="0" direction="column">
            <Text color="white" fontSize="16px" lineHeight="1.5">
              {result?.line}
            </Text>
            <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px">
              {result?.effect}
            </Text>
          </Flex>
          <EventContinueAction
            enabled={Boolean(outcome)}
            onClick={() => {
              if (!outcome) return;
              onFinish(outcome);
            }}
          />
        </EventDialogPanel>
      )}

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={historyLines}
      />
    </Flex>
  );
}

function StreetExploreChoiceButton({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Flex
      bgColor="rgba(255,255,255,0.1)"
      borderRadius="8px"
      p="10px"
      direction="column"
      gap="3px"
      cursor="pointer"
      onClick={onClick}
    >
      <Text color="white" fontSize="15px" fontWeight="800">
        {title}
      </Text>
      <Text color="#FCE9C8" fontSize="12px" lineHeight="1.4">
        {description}
      </Text>
    </Flex>
  );
}

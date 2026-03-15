"use client";

import { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { PARK_GOSSIP_EVENT_COPY } from "@/lib/game/events";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { DialogQuickActions } from "@/components/game/events/DialogQuickActions";
import { EventHistoryOverlay } from "@/components/game/events/EventHistoryOverlay";

type ParkGossipEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
};

export function ParkGossipEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
}: ParkGossipEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`park-gossip-bg-${effectNonce}`}
        flex="1"
        bgImage="url('/images/park.jpg')"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
        position="relative"
        justifyContent="center"
        alignItems="flex-start"
        pt="18px"
        animation={backgroundShakeAnimation}
      >
        <EventBackgroundFxLayer effectId={activeEffectId} effectNonce={effectNonce} />
        <Text color="#F5EFE5" fontSize="12px" textShadow="0 2px 6px rgba(0,0,0,0.45)">
          {PARK_GOSSIP_EVENT_COPY.sceneTitle}
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

      <EventDialogPanel>
        <Text color="white" fontWeight="700">
          旁白
        </Text>
        <Flex flex="1" minH="0" direction="column">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {PARK_GOSSIP_EVENT_COPY.line}
          </Text>
          <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px">
            {PARK_GOSSIP_EVENT_COPY.effect}
          </Text>
        </Flex>
        <EventContinueAction onClick={onFinish} />
      </EventDialogPanel>

      <EventHistoryOverlay
        title="事件回顧"
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lines={[{ id: "line-1", speaker: "旁白", text: PARK_GOSSIP_EVENT_COPY.line }]}
      />
    </Flex>
  );
}

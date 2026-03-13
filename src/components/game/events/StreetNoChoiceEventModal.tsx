"use client";

import { Flex, Text } from "@chakra-ui/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";
import { useBackgroundShake } from "@/components/game/events/useBackgroundShake";
import { EventBackgroundFxLayer } from "@/components/game/events/EventBackgroundFxLayer";

type StreetNoChoiceEventModalProps = {
  onFinish: () => void;
  savings: number;
  actionPower: number;
  fatigue: number;
  line: string;
  effectText: string;
};

export function StreetNoChoiceEventModal({
  onFinish,
  savings,
  actionPower,
  fatigue,
  line,
  effectText,
}: StreetNoChoiceEventModalProps) {
  const {
    animation: backgroundShakeAnimation,
    effectNonce,
    activeEffectId,
  } = useBackgroundShake();

  return (
    <Flex position="absolute" inset="0" zIndex={50} direction="column" bgColor="#EDE7DE">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex
        key={`street-single-bg-${effectNonce}`}
        flex="1"
        bgImage="url('/images/street.jpg')"
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

      <EventDialogPanel>
        <Text color="white" fontWeight="700">
          旁白
        </Text>
        <Flex flex="1" minH="0" direction="column">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {line}
          </Text>
          <Text color="#F9E17D" fontSize="14px" fontWeight="700" mt="8px">
            {effectText}
          </Text>
        </Flex>
        <Flex
          h="52px"
          mt="auto"
          mx="-12px"
          mb="-12px"
          px="16px"
          alignItems="center"
          justifyContent="center"
          backgroundImage="linear-gradient(90deg, #8F6D50 0%, #AA825F 100%)"
          borderTop="1px solid rgba(255,255,255,0.12)"
          onClick={onFinish}
          cursor="pointer"
        >
          <Text color="rgba(255,255,255,0.95)" fontSize="14px">
            點擊繼續
          </Text>
        </Flex>
      </EventDialogPanel>
    </Flex>
  );
}

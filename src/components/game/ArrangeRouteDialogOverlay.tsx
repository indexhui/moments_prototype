"use client";

import { Flex, Text } from "@chakra-ui/react";
import { EventAvatarSprite } from "@/components/game/events/EventAvatarSprite";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";
import { EventDialogPanel, EVENT_DIALOG_HEIGHT } from "@/components/game/events/EventDialogPanel";

type ArrangeRouteDialogOverlayProps = {
  speaker: string;
  text: string;
  onContinue: () => void;
  avatarSpriteId?: "mai" | "beigo" | "bai";
  avatarFrameIndex?: number;
};

export function ArrangeRouteDialogOverlay({
  speaker,
  text,
  onContinue,
  avatarSpriteId = "mai",
  avatarFrameIndex = 0,
}: ArrangeRouteDialogOverlayProps) {
  return (
    <Flex position="absolute" inset="0" zIndex={66} bgColor="rgba(27,23,20,0.46)" direction="column">
      <Flex mt="auto" w="100%" position="relative">
        <Flex
          position="absolute"
          left="14px"
          bottom={`calc(${EVENT_DIALOG_HEIGHT} + 0px)`}
          zIndex={6}
          pointerEvents="none"
        >
          <EventAvatarSprite spriteId={avatarSpriteId} frameIndex={avatarFrameIndex} />
        </Flex>
        <EventDialogPanel w="100%" borderRadius="0" overflow="hidden">
          <Text color="white" fontWeight="700">
            {speaker}
          </Text>
          <Flex flex="1" minH="0" alignItems="center">
            <Text color="white" fontSize="16px" lineHeight="1.7">
              {text}
            </Text>
          </Flex>
          <EventContinueAction onClick={onContinue} />
        </EventDialogPanel>
      </Flex>
    </Flex>
  );
}

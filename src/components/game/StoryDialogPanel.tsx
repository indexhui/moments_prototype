"use client";

import { Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { ROUTES } from "@/lib/routes";
import { EventDialogPanel } from "@/components/game/events/EventDialogPanel";
import { EventContinueAction } from "@/components/game/events/EventContinueAction";

type StoryDialogPanelProps = {
  characterName: string;
  dialogue: string;
  nextSceneId?: string;
};

export function StoryDialogPanel({
  characterName,
  dialogue,
  nextSceneId,
}: StoryDialogPanelProps) {
  return (
    <Flex mt="auto" w="100%">
      <EventDialogPanel w="100%">
        <Text color="white" fontWeight="700">
          {characterName}
        </Text>
        <Flex flex="1" minH="0" direction="column" justifyContent="center">
          <Text color="white" fontSize="16px" lineHeight="1.5">
            {dialogue}
          </Text>
        </Flex>
        {nextSceneId ? (
          <NextLink href={ROUTES.gameScene(nextSceneId)}>
            <EventContinueAction />
          </NextLink>
        ) : null}
      </EventDialogPanel>
    </Flex>
  );
}

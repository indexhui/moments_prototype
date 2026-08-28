"use client";

import { Flex, Text } from "@chakra-ui/react";
import {
  EXHIBITION_UI_COPY,
  type ExhibitionLocale,
} from "@/lib/game/exhibitionI18n";
import { useExhibitionLocale } from "@/components/game/ExhibitionLocaleContext";
import {
  DialogueSemanticText,
  DialogueSpeakerName,
} from "@/components/game/DialogueSemanticText";

export type EventHistoryLine = {
  id: string;
  speaker: string;
  text: string;
  isItalic?: boolean;
};

type EventHistoryOverlayProps = {
  title?: string;
  open: boolean;
  onClose: () => void;
  lines: EventHistoryLine[];
  zIndex?: number;
  locale?: ExhibitionLocale;
};

export function EventHistoryOverlay({
  title,
  open,
  onClose,
  lines,
  zIndex = 70,
  locale,
}: EventHistoryOverlayProps) {
  const resolvedLocale = useExhibitionLocale(locale);
  const displayTitle = title ?? EXHIBITION_UI_COPY.history[resolvedLocale];

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={zIndex}
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
        bgColor="#9E795A"
        direction="column"
        transform={open ? "translateY(0)" : "translateY(12px)"}
        transition="transform 0.22s ease"
      >
        <Flex
          h="72px"
          borderBottom="1px solid rgba(255,255,255,0.28)"
          alignItems="center"
          px="16px"
          justifyContent="space-between"
        >
          <Flex onClick={onClose} cursor="pointer">
            <Text color="white" fontSize="18px" fontWeight="700">
              {`< ${EXHIBITION_UI_COPY.back[resolvedLocale]}`}
            </Text>
          </Flex>
          <Text color="white" fontSize="28px" fontWeight="700" lineHeight="1">
            {displayTitle}
          </Text>
          <Flex w="64px" />
        </Flex>

        <Flex direction="column" gap="16px" p="16px" overflowY="auto">
          {lines.length === 0 ? (
            <Text color="white" fontSize="15px" lineHeight="1.6">
              {EXHIBITION_UI_COPY.historyEmpty[resolvedLocale]}
            </Text>
          ) : (
            lines.map((item) => (
              <Flex key={item.id} direction="column" gap="6px">
                {item.speaker ? (
                  <DialogueSpeakerName speaker={item.speaker} fontSize="22px" />
                ) : null}
                <DialogueSemanticText
                  text={item.text}
                  locale={resolvedLocale}
                  color="white"
                  fontSize="16px"
                  lineHeight="1.55"
                  fontStyle={item.isItalic ? "italic" : undefined}
                />
              </Flex>
            ))
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

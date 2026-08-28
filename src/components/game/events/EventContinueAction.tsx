"use client";

import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { TbHandClick, TbHandFinger } from "react-icons/tb";
import {
  EVENT_DIALOG_ACTION_HEIGHT,
  EVENT_DIALOG_ACTION_INSET,
} from "@/components/game/events/EventDialogPanel";
import { playGameSfx } from "@/lib/game/soundEffects";
import { playFmodGameEvent } from "@/lib/game/fmodWeb";
import {
  EXHIBITION_UI_COPY,
  type ExhibitionLocale,
} from "@/lib/game/exhibitionI18n";
import { useExhibitionLocale } from "@/components/game/ExhibitionLocaleContext";

type EventContinueActionProps = {
  onClick?: () => void;
  enabled?: boolean;
  label?: string;
  locale?: ExhibitionLocale;
};

function playDialogueContinueSound() {
  if (!playFmodGameEvent("dialogueClick")) {
    playGameSfx("uiDialogContinue");
  }
}

export function EventContinueAction({
  onClick,
  enabled = true,
  label,
  locale,
}: EventContinueActionProps) {
  const resolvedLocale = useExhibitionLocale(locale);
  const [isFingerIconVisible, setIsFingerIconVisible] = useState(false);
  const displayLabel = label ?? EXHIBITION_UI_COPY.tapToContinue[resolvedLocale];

  useEffect(() => {
    if (!enabled) {
      setIsFingerIconVisible(false);
      return;
    }
    const timer = setInterval(() => {
      setIsFingerIconVisible((prev) => !prev);
    }, 430);
    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isEditable) return;

      event.preventDefault();
      playDialogueContinueSound();
      onClick?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onClick]);

  const handleActivate = (event?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) => {
    if (!enabled) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    playDialogueContinueSound();
    onClick?.();
  };

  return (
    <Flex
      as="button"
      h={EVENT_DIALOG_ACTION_HEIGHT}
      left={`calc(-1 * ${EVENT_DIALOG_ACTION_INSET})`}
      right={`calc(-1 * ${EVENT_DIALOG_ACTION_INSET})`}
      bottom="0"
      px="16px"
      alignItems="center"
      justifyContent="center"
      backgroundImage="linear-gradient(90deg, #8F6D50 0%, #AA825F 100%)"
      borderTop="1px solid rgba(255,255,255,0.12)"
      onClick={handleActivate}
      cursor={enabled ? "pointer" : "default"}
      opacity={enabled ? 1 : 0}
      transform={enabled ? "translateY(0)" : "translateY(6px)"}
      pointerEvents={enabled ? "auto" : "none"}
      touchAction="manipulation"
      userSelect="none"
      position="absolute"
      zIndex={2}
      transition="opacity 0.22s ease, transform 0.22s ease"
    >
      <Text color="rgba(255,255,255,0.95)" fontSize="14px">
        <span
          style={{
            display: "inline-flex",
            verticalAlign: "text-bottom",
            marginRight: "4px",
            transform: isFingerIconVisible ? "translateY(1px)" : "translateY(-1px)",
            transition: "transform 0.2s ease",
          }}
        >
          {isFingerIconVisible ? <TbHandFinger /> : <TbHandClick />}
        </span>
        {displayLabel}
      </Text>
    </Flex>
  );
}

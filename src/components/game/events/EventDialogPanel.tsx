"use client";

import { Children, cloneElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { Flex, Text, type FlexProps } from "@chakra-ui/react";
import { useExhibitionLocale } from "@/components/game/ExhibitionLocaleContext";
import {
  getDialogueSpeakerColor,
  renderDialogueSemanticText,
} from "@/components/game/DialogueSemanticText";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";

export const EVENT_DIALOG_HEIGHT = "200px";
export const EVENT_DIALOG_ACTION_HEIGHT = "52px";
export const EVENT_DIALOG_ACTION_INSET = "12px";

type EventDialogPanelProps = FlexProps & {
  children: ReactNode;
  semanticColoring?: boolean;
};

type ElementWithChildren = ReactElement<{ children?: ReactNode; [key: string]: unknown }>;

function getPlainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (!isValidElement(node)) return "";
  return getPlainText((node as ElementWithChildren).props.children);
}

function highlightDialogueTextNodes(node: ReactNode, locale: ExhibitionLocale): ReactNode {
  if (typeof node === "string") return renderDialogueSemanticText(node, locale);
  if (typeof node === "number" || node === null || typeof node === "boolean") return node;
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{highlightDialogueTextNodes(child, locale)}</Fragment>
    ));
  }
  if (!isValidElement(node)) return node;

  const element = node as ElementWithChildren;
  if (element.props["data-dialogue-skip-semantic"] === true) return element;
  if (element.props.children === undefined) return element;
  return cloneElement(element, {
    children: highlightDialogueTextNodes(element.props.children, locale),
  });
}

function applyDialogueSemantics(children: ReactNode, locale: ExhibitionLocale) {
  let hasStyledSpeaker = false;
  return Children.toArray(children).map((child) => {
    if (!isValidElement(child)) return child;
    const element = child as ElementWithChildren;

    if (!hasStyledSpeaker && element.type === Text) {
      const speaker = getPlainText(element.props.children).trim();
      if (speaker) {
        hasStyledSpeaker = true;
        return cloneElement(element, {
          color: getDialogueSpeakerColor(speaker),
          fontWeight: "800",
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(55, 37, 25, 0.5)",
          width: "fit-content",
          "data-dialogue-speaker": speaker,
        });
      }
    }

    if (hasStyledSpeaker) return highlightDialogueTextNodes(element, locale);
    return element;
  });
}

export function EventDialogPanel({
  children,
  semanticColoring = true,
  ...rest
}: EventDialogPanelProps) {
  const locale = useExhibitionLocale();
  const renderedChildren = semanticColoring
    ? applyDialogueSemantics(children, locale)
    : children;

  return (
    <Flex
      data-game-interface-ui="true"
      h={EVENT_DIALOG_HEIGHT}
      minH={EVENT_DIALOG_HEIGHT}
      maxH={EVENT_DIALOG_HEIGHT}
      bgColor="#8E6D52"
      p={EVENT_DIALOG_ACTION_INSET}
      pb={`calc(${EVENT_DIALOG_ACTION_HEIGHT} + ${EVENT_DIALOG_ACTION_INSET} * 2)`}
      direction="column"
      gap="8px"
      overflow="visible"
      position="relative"
      zIndex={8}
      {...rest}
    >
      {renderedChildren}
    </Flex>
  );
}

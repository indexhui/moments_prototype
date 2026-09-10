"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import type { CharacterIntroCard } from "@/components/game/CharacterIntroOverlay";
import { playFmodGameEvent } from "@/lib/game/fmodWeb";
import styles from "./ExhibitionCharacterIntroCard.module.css";

export function ExhibitionCharacterIntroCard({
  intro,
  visibleDescription,
  isDescriptionTyping,
  onClose,
}: {
  intro: CharacterIntroCard;
  visibleDescription: string;
  isDescriptionTyping: boolean;
  onClose: () => void;
}) {
  const lines = visibleDescription.split("\n");

  return (
    <Box className={styles.overlay} data-exhibition-character-intro="true" onClick={onClose}>
      <img
        className={styles.centerPaper}
        src="/images/exhibition/character-intro/center-deco.png"
        alt=""
        draggable={false}
      />
      <img
        className={styles.bottomPaper}
        src="/images/exhibition/character-intro/bottom-deco.png"
        alt=""
        draggable={false}
      />

      <Flex className={styles.names} alignItems="baseline">
        <Text as="h1" className={styles.name}>{intro.name}</Text>
        {intro.englishName !== intro.name ? (
          <Text className={styles.englishName}>{intro.englishName}</Text>
        ) : null}
      </Flex>
      <Box className={styles.description} role="paragraph" aria-label={intro.descriptionLines.join("\n")}>
        {lines.map((line, index) => (
          <Text key={index} aria-hidden="true">
            {line}
            {isDescriptionTyping && index === lines.length - 1 ? (
              <span className={styles.typingCursor}>▍</span>
            ) : null}
          </Text>
        ))}
      </Box>

      <Box className={styles.character}>
        <img
          className={intro.alternateSpritePath ? styles.thinkingFrame : undefined}
          src={intro.spriteSheetPath}
          alt={intro.name}
          draggable={false}
        />
        {intro.alternateSpritePath ? (
          <img
            className={styles.thinkingFrame}
            src={intro.alternateSpritePath}
            alt=""
            draggable={false}
          />
        ) : null}
      </Box>
      <button
        type="button"
        className={styles.confirm}
        onClick={(event) => {
          event.stopPropagation();
          playFmodGameEvent("dialogueClick");
          onClose();
        }}
      >
        OK
      </button>
    </Box>
  );
}

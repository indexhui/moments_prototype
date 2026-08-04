"use client";

import { Fragment } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

export type CharacterIntroCard = {
  sceneId: string;
  name: string;
  englishName: string;
  descriptionLines: string[];
  spriteSheetPath: string;
  spriteCols: number;
  spriteRows: number;
  spriteFrameIndex: number;
  theme: {
    topBar: string;
    band: string;
    bandBorder: string;
    button: string;
    buttonText: string;
  };
};

const characterIntroBgFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;
const characterIntroBandSlideIn = keyframes`
  0% { opacity: 0; transform: translateX(120%) rotate(-16deg); }
  100% { opacity: 1; transform: translateX(0) rotate(-16deg); }
`;
const characterIntroTextFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;
const characterIntroAvatarRise = keyframes`
  0% { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.94); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
`;
const characterIntroGlowPulse = keyframes`
  0%, 100% { opacity: 0.28; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.45; transform: translateX(-50%) scale(1.05); }
`;
const characterIntroOkPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(77,120,133,0.3); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 8px rgba(77,120,133,0.0); }
`;

export const MAI_CHARACTER_INTRO_CARD: CharacterIntroCard = {
  sceneId: "scene-3",
  name: "小麥",
  englishName: "MUGI",
  descriptionLines: [
    "剛出社會兩年的職場新鮮人",
    "平時省吃儉用，但看到喜歡的東西還是會手滑的平凡女孩",
  ],
  spriteSheetPath: "/images/mai/Mai_Spirt.png",
  spriteCols: 6,
  spriteRows: 3,
  spriteFrameIndex: 13,
  theme: {
    topBar: "rgba(220, 193, 178, 0.92)",
    band: "rgba(183, 141, 128, 0.94)",
    bandBorder: "rgba(139, 94, 82, 0.76)",
    button: "#A86E61",
    buttonText: "#FFF4F0",
  },
};

export const CHARACTER_INTRO_BY_SCENE_ID: Record<string, CharacterIntroCard> = {
  "scene-3": MAI_CHARACTER_INTRO_CARD,
  "scene-13": {
    sceneId: "scene-13",
    name: "小白",
    englishName: "SHIRO",
    descriptionLines: [
      "小麥的現任室友兼大學好友",
      "自由接案的動畫師，時常燃燒生命趕稿",
      "成為室友的第二個月",
    ],
    spriteSheetPath: "/images/bai/Bai_Spirt.png",
    spriteCols: 7,
    spriteRows: 1,
    spriteFrameIndex: 2,
    theme: {
      topBar: "rgba(181, 208, 214, 0.9)",
      band: "rgba(131, 170, 179, 0.94)",
      bandBorder: "rgba(84,127,137,0.74)",
      button: "#4D7885",
      buttonText: "#EFF8FB",
    },
  },
};

export function CharacterIntroOverlay({
  intro,
  onClose,
}: {
  intro: CharacterIntroCard | undefined;
  onClose: () => void;
}) {
  if (!intro) return null;

  const spriteScale = 0.48;
  const spriteWidth = 500;
  const spriteHeight = 627;
  const spriteCol = intro.spriteFrameIndex % intro.spriteCols;
  const spriteRow = Math.floor(intro.spriteFrameIndex / intro.spriteCols);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={76}
      onClick={onClose}
      bg="linear-gradient(180deg, rgba(20,25,28,0.26) 0%, rgba(18,20,22,0.46) 100%)"
      animation={`${characterIntroBgFadeIn} 360ms ease-out`}
      overflow="hidden"
    >
      <Flex
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="122px"
        bgColor={intro.theme.topBar}
        borderBottom="4px solid rgba(255,255,255,0.42)"
      />
      <Flex
        position="absolute"
        left="-32%"
        top="31%"
        w="175%"
        h="228px"
        bgColor={intro.theme.band}
        borderTop={`6px solid ${intro.theme.bandBorder}`}
        borderBottom={`6px solid ${intro.theme.bandBorder}`}
        transform="rotate(-16deg)"
        transformOrigin="center"
        animation={`${characterIntroBandSlideIn} 520ms cubic-bezier(0.2, 0.8, 0.2, 1)`}
      />
      <Flex
        pointerEvents="none"
        position="absolute"
        left="40px"
        top="244px"
        zIndex={3}
        direction="column"
        gap="5px"
        animation={`${characterIntroTextFadeIn} 380ms ease-out 110ms both`}
      >
        <Text color="white" fontSize="43px" fontWeight="800" lineHeight="1">
          {intro.name}
        </Text>
        <Text color="rgba(255,255,255,0.95)" fontSize="34px" fontWeight="800" lineHeight="1.1" letterSpacing="0.05em">
          {intro.englishName}
        </Text>
        <Text color="white" fontSize="17px" lineHeight="1.5" fontWeight="600">
          {intro.descriptionLines.map((line, index) => (
            <Fragment key={`${intro.sceneId}-description-${line}`}>
              {index > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </Text>
      </Flex>
      <Flex
        pointerEvents="none"
        position="absolute"
        right="20px"
        top="226px"
        zIndex={3}
        transform="rotate(90deg)"
        transformOrigin="center"
        animation={`${characterIntroTextFadeIn} 380ms ease-out 180ms both`}
      >
        <Text color="rgba(255,255,255,0.96)" fontSize="16px" fontWeight="800" letterSpacing="0.2em">
          {intro.englishName}
        </Text>
      </Flex>
      <Flex
        pointerEvents="none"
        position="absolute"
        left="50%"
        bottom="152px"
        w="220px"
        h="46px"
        borderRadius="999px"
        bgColor="rgba(255,255,255,0.82)"
        filter="blur(6px)"
        transform="translateX(-50%)"
        animation={`${characterIntroGlowPulse} 1.7s ease-in-out infinite`}
      />
      <Flex
        pointerEvents="none"
        position="absolute"
        left="50%"
        bottom="20px"
        zIndex={4}
        w="238px"
        h="300px"
        transform="translateX(-50%)"
        animation={`${characterIntroAvatarRise} 500ms ease-out 120ms both`}
        overflow="hidden"
      >
        <img
          src={intro.spriteSheetPath}
          alt={`${intro.name} intro sprite`}
          style={{
            width: `${spriteWidth * intro.spriteCols * spriteScale}px`,
            height: `${spriteHeight * intro.spriteRows * spriteScale}px`,
            transform: `translate(${-spriteCol * spriteWidth * spriteScale}px, -${spriteRow * spriteHeight * spriteScale}px)`,
            display: "block",
            maxWidth: "none",
          }}
        />
      </Flex>
      <Flex
        position="absolute"
        right="30px"
        top="466px"
        zIndex={5}
        h="42px"
        minW="116px"
        px="18px"
        borderRadius="999px"
        border="2px solid rgba(255,255,255,0.5)"
        bgColor={intro.theme.button}
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        animation={`${characterIntroOkPulse} 1.4s ease-in-out infinite`}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <Text color={intro.theme.buttonText} fontSize="24px" fontWeight="800" letterSpacing="0.16em" ml="4px">
          OK
        </Text>
      </Flex>
      <Flex
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        h="108px"
        bgColor={intro.theme.topBar}
        borderTop="4px solid rgba(255,255,255,0.42)"
      />
      <Flex position="absolute" inset="0" onClick={onClose} />
    </Flex>
  );
}

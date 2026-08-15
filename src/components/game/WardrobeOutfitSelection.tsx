"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useEffect, useRef } from "react";
import { playGameSfx } from "@/lib/game/soundEffects";

export type WardrobeOutfitChoice = 1 | 2 | 3;
export type WardrobeOutfitPhase =
  | "hidden"
  | "wardrobe"
  | "picking-up"
  | "changing"
  | "dialog"
  | "avatar-exit";

const WARDROBE_ASSET_ROOT = "/images/428出圖/20260805/換衣服";

export const WARDROBE_OUTFIT_ASSET_URLS = [
  `${WARDROBE_ASSET_ROOT}/衣櫃.jpg`,
  `${WARDROBE_ASSET_ROOT}/背景.jpg`,
  `${WARDROBE_ASSET_ROOT}/點點.png`,
  `${WARDROBE_ASSET_ROOT}/衣服1.png`,
  `${WARDROBE_ASSET_ROOT}/衣服2.png`,
  `${WARDROBE_ASSET_ROOT}/衣服3.png`,
  `${WARDROBE_ASSET_ROOT}/小麥1.png`,
  `${WARDROBE_ASSET_ROOT}/小麥2.png`,
  `${WARDROBE_ASSET_ROOT}/小麥3.png`,
] as const;

const wardrobeFadeIn = keyframes`
  from { opacity: 0; filter: brightness(0.86); }
  to { opacity: 1; filter: brightness(1); }
`;

const wardrobePromptIn = keyframes`
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const outfitResultIn = keyframes`
  0% { opacity: 0; transform: translateY(38px) scale(0.94); filter: blur(3px); }
  58% { opacity: 1; transform: translateY(-5px) scale(1.015); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`;

const dotsDriftIn = keyframes`
  0% { opacity: 0; transform: scale(1.08) rotate(-1deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

const changingVeil = keyframes`
  0% { opacity: 0; }
  22% { opacity: 0.82; }
  100% { opacity: 0; }
`;

const changingRing = keyframes`
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.45); }
  26% { opacity: 0.72; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
`;

const OUTFIT_CHOICES: Array<{
  id: WardrobeOutfitChoice;
  left: string;
  width: string;
}> = [
  { id: 3, left: "11%", width: "29%" },
  { id: 2, left: "36%", width: "28%" },
  { id: 1, left: "62%", width: "29%" },
];

export function WardrobeOutfitSelection({
  phase,
  selectedOutfit,
  onSelect,
}: {
  phase: WardrobeOutfitPhase;
  selectedOutfit: WardrobeOutfitChoice | null;
  onSelect: (choice: WardrobeOutfitChoice) => void;
}) {
  const previousPhaseRef = useRef(phase);

  useEffect(() => {
    if (phase === "changing" && previousPhaseRef.current !== "changing") {
      playGameSfx("wardrobeChange");
    }
    previousPhaseRef.current = phase;
  }, [phase]);

  if (phase === "hidden") return null;

  const isWardrobe = phase === "wardrobe";
  const isPickingUp = phase === "picking-up";
  const isWardrobeVisible = isWardrobe || isPickingUp;
  const isChanging = phase === "changing";

  return (
    <Box
      position="absolute"
      inset="0"
      zIndex={isWardrobeVisible || isChanging ? 18 : 5}
      overflow="hidden"
      pointerEvents={isWardrobe ? "auto" : "none"}
      data-no-story-advance="true"
      animation={`${wardrobeFadeIn} 360ms ease-out both`}
      bgColor="#EEE9DD"
    >
      {isWardrobeVisible ? (
        <>
          <img
            src={`${WARDROBE_ASSET_ROOT}/衣櫃.jpg`}
            alt="打開的衣櫃"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              userSelect: "none",
            }}
          />

          {[1, 2, 3].map((outfitId) => {
            const isSelected = selectedOutfit === outfitId;
            const pickUpX = outfitId === 3 ? "24px" : outfitId === 1 ? "-24px" : "0px";
            const pickUpRotation = outfitId === 3 ? "-0.8deg" : outfitId === 1 ? "0.8deg" : "0deg";
            return (
              <img
                key={outfitId}
                src={`${WARDROBE_ASSET_ROOT}/衣服${outfitId}.png`}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: isPickingUp && isSelected ? 3 : 1,
                  transformOrigin: "50% 43%",
                  transform:
                    isPickingUp && isSelected
                      ? `translate3d(${pickUpX}, -132px, 0) scale(1.065) rotate(${pickUpRotation})`
                      : "translate3d(0, 0, 0) scale(1) rotate(0deg)",
                  filter:
                    isPickingUp && isSelected
                      ? "drop-shadow(0 36px 24px rgba(67, 50, 36, 0.28))"
                      : "drop-shadow(0 0 0 rgba(67, 50, 36, 0))",
                  transition:
                    "transform 720ms cubic-bezier(0.18, 0.72, 0.2, 1), filter 720ms ease-out",
                }}
              />
            );
          })}

          <Flex
            position="absolute"
            top="5.6%"
            left="50%"
            transform="translateX(-50%)"
            zIndex={3}
            alignItems="center"
            justifyContent="center"
            px="18px"
            py="8px"
            borderRadius="999px"
            bg="rgba(248, 244, 233, 0.88)"
            border="1px solid rgba(126, 105, 83, 0.2)"
            boxShadow="0 5px 18px rgba(83, 66, 50, 0.12)"
            backdropFilter="blur(5px)"
            animation={`${wardrobePromptIn} 420ms ease-out 160ms both`}
            opacity={isPickingUp ? 0 : undefined}
            transition="opacity 160ms ease"
            whiteSpace="nowrap"
          >
            <Text
              color="#6D5C4E"
              fontSize="14px"
              fontWeight="700"
              letterSpacing="0.06em"
            >
              點一下想穿的衣服
            </Text>
          </Flex>

          {isWardrobe ? OUTFIT_CHOICES.map((choice) => (
            <Box
              as="button"
              key={choice.id}
              position="absolute"
              left={choice.left}
              top="26.5%"
              w={choice.width}
              h="41.5%"
              zIndex={4}
              cursor="pointer"
              border="1.5px solid transparent"
              borderRadius="45% 45% 28% 28%"
              bg="transparent"
              transition="background-color 160ms ease, border-color 160ms ease, transform 120ms ease, box-shadow 160ms ease"
              _hover={{
                bg: "rgba(255, 250, 235, 0.14)",
                borderColor: "rgba(255, 249, 226, 0.5)",
                boxShadow: "0 0 24px rgba(255, 247, 218, 0.3)",
              }}
              _focusVisible={{
                outline: "3px solid rgba(118, 91, 67, 0.72)",
                outlineOffset: "2px",
                bg: "rgba(255, 250, 235, 0.16)",
              }}
              _active={{ transform: "scale(0.97)", bg: "rgba(255, 250, 235, 0.22)" }}
              aria-label={`選擇第 ${choice.id} 套衣服`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                playGameSfx("wardrobePickUp");
                onSelect(choice.id);
              }}
            />
          )) : null}
        </>
      ) : (
        <>
          <img
            src={`${WARDROBE_ASSET_ROOT}/背景.jpg`}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              userSelect: "none",
            }}
          />
          <img
            src={`${WARDROBE_ASSET_ROOT}/點點.png`}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              userSelect: "none",
              animation: `${dotsDriftIn} 760ms ease-out both`,
            }}
          />
          {selectedOutfit ? (
            <img
              src={`${WARDROBE_ASSET_ROOT}/小麥${selectedOutfit}.png`}
              alt={`小麥換上第 ${selectedOutfit} 套衣服`}
              draggable={false}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                userSelect: "none",
                transformOrigin: "50% 72%",
                animation: `${outfitResultIn} 760ms cubic-bezier(0.18, 0.76, 0.22, 1) 110ms both`,
                opacity: phase === "avatar-exit" ? 0 : undefined,
                translate: phase === "avatar-exit" ? "90px 0" : undefined,
                transition: "opacity 420ms ease, translate 420ms ease",
              }}
            />
          ) : null}

          {isChanging ? (
            <>
              <Box
                position="absolute"
                inset="0"
                bg="rgba(255, 253, 245, 0.72)"
                animation={`${changingVeil} 780ms ease-out both`}
              />
              <Box
                position="absolute"
                left="50%"
                top="53%"
                w="110px"
                h="110px"
                borderRadius="50%"
                border="3px solid rgba(255, 255, 250, 0.86)"
                boxShadow="0 0 42px rgba(255, 251, 228, 0.72)"
                animation={`${changingRing} 780ms ease-out both`}
              />
            </>
          ) : null}
        </>
      )}
    </Box>
  );
}

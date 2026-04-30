"use client";

import { Flex } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const focusIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const barInTop = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const barInBottom = keyframes`
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const focusBreath = keyframes`
  0%, 100% { opacity: 0.28; transform: translate(-50%, -50%) scale(0.96); }
  50% { opacity: 0.42; transform: translate(-50%, -50%) scale(1.04); }
`;

type NarrativeFocusLayerProps = {
  animateIn?: boolean;
};

export function NarrativeFocusLayer({ animateIn = true }: NarrativeFocusLayerProps) {
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={2}
      pointerEvents="none"
      animation={animateIn ? `${focusIn} 360ms ease-out both` : undefined}
    >
      <Flex
        position="absolute"
        inset="0"
        bg="radial-gradient(circle at 50% 32%, rgba(255, 239, 190, 0.12) 0%, rgba(32, 22, 16, 0.12) 35%, rgba(15, 10, 8, 0.46) 100%)"
      />
      <Flex
        position="absolute"
        left="50%"
        top="34%"
        w="260px"
        h="260px"
        transform="translate(-50%, -50%)"
        borderRadius="999px"
        bg="radial-gradient(circle, rgba(255, 226, 156, 0.18) 0%, rgba(255, 226, 156, 0.07) 42%, transparent 72%)"
        animation={`${focusBreath} 3.2s ease-in-out infinite`}
      />
      <Flex
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="46px"
        bgColor="rgba(15, 10, 8, 0.82)"
        boxShadow="0 10px 24px rgba(15, 10, 8, 0.32)"
        animation={animateIn ? `${barInTop} 300ms ease-out both` : undefined}
      />
      <Flex
        position="absolute"
        left="0"
        right="0"
        bottom="200px"
        h="28px"
        bgColor="rgba(15, 10, 8, 0.68)"
        boxShadow="0 -10px 22px rgba(15, 10, 8, 0.22)"
        animation={animateIn ? `${barInBottom} 300ms ease-out both` : undefined}
      />
    </Flex>
  );
}

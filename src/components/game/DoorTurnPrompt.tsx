"use client";

import { Flex } from "@chakra-ui/react";
import { FiArrowDown } from "react-icons/fi";
import type { DoorHandlePosition } from "@/lib/game/doorTurnGesture";

export function DoorTurnPrompt({
  handlePosition,
  isPromptVisible,
  turnDegrees,
}: {
  handlePosition: DoorHandlePosition;
  isPromptVisible: boolean;
  turnDegrees: number;
}) {
  const visualTurnDegrees = Math.min(90, turnDegrees);

  return (
    <>
      <Flex
        position="absolute"
        left={`${handlePosition.xPercent}%`}
        top={`${handlePosition.yPercent}%`}
        w="116px"
        h="116px"
        zIndex={1}
        pointerEvents="none"
        transform="translate(-50%, -50%)"
        opacity={isPromptVisible ? 0.68 : 0}
        alignItems="center"
        justifyContent="center"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 116 116"
          width="116"
          height="116"
          style={{ position: "absolute", inset: 0 }}
        >
          <path
            d="M 8 58 A 50 50 0 0 0 58 108"
            fill="none"
            stroke="rgba(255, 244, 230, 0.48)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>

        <Flex
          position="absolute"
          inset="8px"
          borderRadius="999px"
          transform={`rotate(-${visualTurnDegrees}deg)`}
        >
          <Flex
            position="absolute"
            left="0"
            top="50%"
            w="34px"
            h="34px"
            borderRadius="999px"
            bgColor="rgba(60, 44, 34, 0.7)"
            boxShadow="0 6px 15px rgba(32, 22, 16, 0.22)"
            transform="translate(-50%, -50%)"
            alignItems="center"
            justifyContent="center"
          >
            <FiArrowDown color="rgba(255, 244, 230, 0.82)" size={22} strokeWidth={2.5} />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}

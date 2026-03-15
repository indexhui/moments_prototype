"use client";

import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { TbHandClick, TbHandFinger } from "react-icons/tb";

type EventContinueActionProps = {
  onClick?: () => void;
  enabled?: boolean;
  label?: string;
};

export function EventContinueAction({
  onClick,
  enabled = true,
  label = "點擊繼續",
}: EventContinueActionProps) {
  const [isFingerIconVisible, setIsFingerIconVisible] = useState(false);

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

  return (
    <Flex
      h="52px"
      mt="auto"
      mx="-12px"
      mb="-12px"
      px="16px"
      alignItems="center"
      justifyContent="center"
      backgroundImage="linear-gradient(90deg, #8F6D50 0%, #AA825F 100%)"
      borderTop="1px solid rgba(255,255,255,0.12)"
      onClick={enabled ? onClick : undefined}
      cursor={enabled ? "pointer" : "default"}
      opacity={enabled ? 1 : 0}
      transform={enabled ? "translateY(0)" : "translateY(6px)"}
      pointerEvents={enabled ? "auto" : "none"}
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
        {label}
      </Text>
    </Flex>
  );
}

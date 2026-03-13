"use client";

import { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";

export function WorkTransitionModal({ onFinish }: { onFinish: () => void }) {
  const [isImageVisible, setIsImageVisible] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => {
      setIsImageVisible(true);
    }, 80);
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={55}
      direction="column"
      bgImage="url('/images/office.jpg')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      justifyContent="center"
      alignItems="center"
      p="20px"
    >
      <Flex
        w="100%"
        maxW="330px"
        borderRadius="12px"
        overflow="hidden"
        border="2px solid rgba(157,120,89,0.9)"
        boxShadow="0 8px 24px rgba(0,0,0,0.2)"
        opacity={isImageVisible ? 1 : 0}
        transform={isImageVisible ? "translateY(0)" : "translateY(8px)"}
        transition="opacity 0.45s ease, transform 0.45s ease"
      >
        <img
          src="/images/mai_work.jpg"
          alt="上班過場"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Flex>

      <Text mt="14px" color="white" fontSize="14px" fontWeight="700" textShadow="0 2px 8px rgba(0,0,0,0.35)">
        上班中...
      </Text>
    </Flex>
  );
}


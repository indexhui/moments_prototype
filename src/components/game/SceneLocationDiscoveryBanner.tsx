"use client";

import { Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const bannerIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-12px) translateY(-4px);
  }
  100% {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
`;

export function SceneLocationDiscoveryBanner({
  title,
  iconPath,
}: {
  title: string;
  iconPath: string;
}) {
  return (
    <Flex
      position="absolute"
      top="108px"
      left="0"
      zIndex={12}
      direction="column"
      pointerEvents="none"
      animation={`${bannerIn} 260ms ease-out`}
    >
      <Flex
        h="34px"
        minW="150px"
        px="14px"
        alignItems="center"
        bg="linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0) 100%)"
      >
        <Text color="#9D7859" fontSize="16px" fontWeight="700" lineHeight="1">
          發現地點
        </Text>
      </Flex>
      <Flex
        h="48px"
        minW="176px"
        pl="12px"
        pr="18px"
        alignItems="center"
        gap="10px"
        bg="linear-gradient(90deg, rgba(157,120,89,0.96) 74%, rgba(157,120,89,0) 100%)"
      >
        <Flex
          w="32px"
          h="32px"
          borderRadius="999px"
          bgColor="white"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Image src={iconPath} alt={title} w="22px" h="22px" objectFit="contain" />
        </Flex>
        <Text color="white" fontSize="24px" fontWeight="700" lineHeight="1">
          {title}
        </Text>
      </Flex>
    </Flex>
  );
}

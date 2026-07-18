"use client";

import { Box, Flex, Image, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { TrialProfileId } from "@/lib/game/demoBuild";
import { withTrialProfileSearch } from "@/lib/game/demoBuild";
import { MARKETING_MATERIALS } from "@/lib/game/marketingMaterials";
import { ROUTES } from "@/lib/routes";

export function MarketingMaterialsView({
  trialProfile,
}: {
  trialProfile: TrialProfileId | null;
}) {
  return (
    <Flex
      data-marketing-materials-route="true"
      position="relative"
      w="100%"
      h={{ base: "100dvh", lg: "852px" }}
      minH="640px"
      maxW="393px"
      bgColor="#F7F4EA"
      color="#5F5B49"
      direction="column"
      overflow="hidden"
    >
      <Box
        aria-hidden="true"
        position="absolute"
        inset="0"
        opacity="0.7"
        backgroundImage="radial-gradient(circle, rgba(77,177,199,0.12) 4px, transparent 4.5px)"
        backgroundSize="68px 68px"
        backgroundPosition="18px 24px"
        pointerEvents="none"
      />

      <Flex
        position="relative"
        zIndex="1"
        px="22px"
        pt="34px"
        pb="24px"
        bgColor="#4DB1C7"
        color="white"
        direction="column"
        gap="7px"
        boxShadow="0 10px 30px rgba(77,177,199,0.18)"
      >
        <Text color="rgba(255,255,255,0.76)" fontSize="12px" fontWeight="900" letterSpacing="0.12em">
          MOMENT MARKETING
        </Text>
        <Text color="white" fontSize="27px" fontWeight="900" lineHeight="1.25">
          行銷素材路由
        </Text>
        <Text color="rgba(255,255,255,0.88)" fontSize="14px" fontWeight="700" lineHeight="1.55">
          社群、Thread 與錄影素材的專用快捷入口
        </Text>
      </Flex>

      <Flex
        position="relative"
        zIndex="1"
        flex="1"
        minH="0"
        px="18px"
        py="20px"
        direction="column"
        gap="13px"
        overflowY="auto"
      >
        {MARKETING_MATERIALS.map((material) => (
          <NextLink
            key={material.id}
            href={withTrialProfileSearch(material.href, trialProfile)}
            style={{ textDecoration: "none" }}
          >
            <Flex
              w="100%"
              minH="142px"
              borderRadius="16px"
              bgColor="rgba(255,255,255,0.94)"
              border="1px solid rgba(96,88,70,0.12)"
              boxShadow="0 10px 24px rgba(73,68,56,0.11)"
              overflow="hidden"
              cursor="pointer"
              transition="transform 160ms ease, box-shadow 160ms ease"
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 14px 30px rgba(73,68,56,0.16)" }}
              _active={{ transform: "translateY(1px) scale(0.995)" }}
            >
              <Box position="relative" w="112px" minW="112px" overflow="hidden" bgColor="#E9E6D8">
                <Image
                  src={material.previewImage}
                  alt=""
                  aria-hidden="true"
                  position="absolute"
                  inset="0"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
                <Box position="absolute" inset="0" bg="linear-gradient(90deg, transparent 55%, rgba(255,255,255,0.9) 100%)" />
              </Box>
              <Flex flex="1" minW="0" px="14px" py="15px" direction="column" justifyContent="center" gap="7px">
                <Text color={material.accent} fontSize="11px" fontWeight="900" letterSpacing="0.08em">
                  {material.category}
                </Text>
                <Text color="#514D40" fontSize="18px" fontWeight="900" lineHeight="1.35">
                  {material.title}
                </Text>
                <Text color="#777164" fontSize="12px" fontWeight="700" lineHeight="1.5">
                  {material.description}
                </Text>
                <Text color={material.accent} fontSize="12px" fontWeight="900">
                  開啟素材 →
                </Text>
              </Flex>
            </Flex>
          </NextLink>
        ))}
      </Flex>

      <Flex position="relative" zIndex="1" px="18px" pb="18px">
        <NextLink
          href={withTrialProfileSearch(ROUTES.gameRoot, trialProfile)}
          style={{ width: "100%", textDecoration: "none" }}
        >
          <Flex
            w="100%"
            h="46px"
            borderRadius="12px"
            bgColor="#8E6D52"
            color="white"
            alignItems="center"
            justifyContent="center"
            fontSize="14px"
            fontWeight="900"
            cursor="pointer"
          >
            返回遊戲
          </Flex>
        </NextLink>
      </Flex>
    </Flex>
  );
}

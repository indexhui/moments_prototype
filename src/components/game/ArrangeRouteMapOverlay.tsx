"use client";

import { Flex, Image, Text } from "@chakra-ui/react";
import { FiLock, FiX } from "react-icons/fi";

type ArrangeRouteMapOverlayProps = {
  hasStreetUnlocked: boolean;
  hasConvenienceStoreUnlocked: boolean;
  onClose: () => void;
};

type MapCardProps = {
  title: string;
  iconPath?: string;
  hint?: string;
  locked?: boolean;
  muted?: boolean;
};

function MapCard({ title, iconPath, hint, locked = false, muted = false }: MapCardProps) {
  if (muted) {
    return (
      <Flex
        h="87px"
        borderRadius="12px"
        border="3px solid #AE866B"
        bgColor="#DBC19C"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#785B47" fontSize="22px" fontWeight="400" lineHeight="1">
          尚未解鎖
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      h="87px"
      borderRadius="12px"
      border="3px solid #AE866B"
      bgColor="white"
      px="16px"
      alignItems="center"
      justifyContent="space-between"
      gap="12px"
    >
      <Flex alignItems="center" gap="12px" minW="0">
        {iconPath ? <Image src={iconPath} alt={title} w="54px" h="54px" objectFit="contain" flexShrink={0} /> : null}
        <Flex direction="column" minW="0" gap={hint ? "4px" : "0"}>
          <Text color="#AE866B" fontSize="23px" fontWeight="400" lineHeight="1">
            {title}
          </Text>
          {hint ? (
            <Text color="#AE866B" fontSize="14px" fontWeight="400" lineHeight="1.25">
              {hint}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      {locked ? <FiLock size={24} color="#AE866B" /> : null}
    </Flex>
  );
}

export function ArrangeRouteMapOverlay({
  hasStreetUnlocked,
  hasConvenienceStoreUnlocked,
  onClose,
}: ArrangeRouteMapOverlayProps) {
  return (
    <Flex position="absolute" inset="0" zIndex={72} bgColor="rgba(27,23,20,0.42)" alignItems="center" justifyContent="center" px="16px">
      <Flex
        w="100%"
        maxW="362px"
        h="740px"
        borderRadius="30px"
        bgColor="#FBC74C"
        direction="column"
        pt="16px"
        px="16px"
        pb="18px"
        boxShadow="0 16px 40px rgba(49,40,28,0.24)"
        position="relative"
      >
        <Flex
          as="button"
          position="absolute"
          top="18px"
          right="18px"
          w="32px"
          h="32px"
          borderRadius="999px"
          bgColor="rgba(255,255,255,0.96)"
          border="2px solid #E2D6C8"
          alignItems="center"
          justifyContent="center"
          color="#AE866B"
          onClick={onClose}
          aria-label="關閉地圖"
        >
          <FiX size={18} />
        </Flex>

        <Flex
          flex="1"
          minH="0"
          borderRadius="18px"
          bgColor="#FDF8E6"
          direction="column"
          overflow="hidden"
        >
          <Flex h="70px" bgColor="#FBE0A8" alignItems="center" justifyContent="center">
            <Text color="#AE866B" fontSize="23px" fontWeight="400" lineHeight="1">
              地圖
            </Text>
          </Flex>

          <Flex direction="column" gap="20px" px="18px" pt="18px">
            <MapCard title="捷運" iconPath="/images/icon/mrt.png" />
            <MapCard
              title="街道"
              iconPath="/images/icon/street.png"
              hint={hasStreetUnlocked ? "通勤路上會遇見更多事件" : "收集第一隻小日獸來解鎖"}
              locked={!hasStreetUnlocked}
            />
            {hasConvenienceStoreUnlocked ? (
              <MapCard
                title="便利商店"
                iconPath="/images/icon/road.png"
                hint="補給與支線會在這裡展開"
              />
            ) : (
              <MapCard title="尚未解鎖" muted />
            )}
          </Flex>
        </Flex>

        <Flex w="108px" h="20px" borderRadius="999px" bgColor="#DEB05F" alignSelf="center" mt="16px" />
      </Flex>
    </Flex>
  );
}

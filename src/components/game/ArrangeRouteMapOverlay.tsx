"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiX } from "react-icons/fi";
import type { getPlaceUnlockSnapshot } from "@/lib/game/playerProgress";

type ArrangeRouteMapOverlayProps = {
  placeUnlockSnapshot: ReturnType<typeof getPlaceUnlockSnapshot>;
  coinCount: number;
  canRedeemStreet?: boolean;
  isReadOnly?: boolean;
  highlightedPlaceId?: "street" | "convenience-store";
  unlockingPlaceId?: "street" | "convenience-store";
  onRedeemMetro?: () => void;
  onRedeemStreet?: () => void;
  onClose: () => void;
};

type PlaceNoteId = "metro-station" | "street" | "convenience-store" | "breakfast-shop";

type PlaceNote = {
  id: PlaceNoteId;
  title: string;
  description: ReactNode;
  iconPath?: string;
  placeholder?: string;
  isKnown: boolean;
  isActive?: boolean;
  isUnlocking?: boolean;
};

const revealPulse = keyframes`
  0% { transform: scale(0.96); opacity: 0.72; }
  52% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const revealShimmer = keyframes`
  0% { transform: translateX(-140%) rotate(10deg); opacity: 0; }
  20% { opacity: 0.6; }
  100% { transform: translateX(240%) rotate(10deg); opacity: 0; }
`;

function ClueKeyword({
  children,
  tone = "gold",
}: {
  children: ReactNode;
  tone?: "gold" | "mint";
}) {
  const palette =
    tone === "mint"
      ? { bg: "#DDF3E6", border: "rgba(99,160,124,0.26)", color: "#3F7259" }
      : { bg: "#F6D982", border: "rgba(176,128,50,0.2)", color: "#6D4D28" };

  return (
    <Text
      as="span"
      display="inline-block"
      px="5px"
      mx="2px"
      borderRadius="5px"
      bgColor={palette.bg}
      border="1px solid"
      borderColor={palette.border}
      color={palette.color}
      fontWeight="900"
      lineHeight="1.4"
      whiteSpace="nowrap"
    >
      {children}
    </Text>
  );
}

function KnownPlaceTile({ place }: { place: PlaceNote }) {
  return (
    <Flex
      direction="column"
      alignItems="center"
      gap="8px"
      w="82px"
      flexShrink={0}
      animation={place.isUnlocking ? `${revealPulse} 920ms ease-out forwards` : undefined}
    >
      <Flex
        position="relative"
        overflow="hidden"
        w="82px"
        h="82px"
        borderRadius="12px"
        bgColor={place.isActive ? "#FFF2CE" : "#FFF8EA"}
        border="1px solid"
        borderColor={place.isActive ? "#E0B76E" : "rgba(155,118,86,0.16)"}
        alignItems="center"
        justifyContent="center"
        boxShadow={place.isActive ? "0 0 0 4px rgba(255,255,255,0.72), 0 12px 22px rgba(93,61,34,0.16)" : "0 8px 18px rgba(92,63,39,0.08)"}
      >
        {place.isUnlocking ? (
          <Box
            position="absolute"
            top="-30%"
            bottom="-30%"
            left="0"
            w="28px"
            bgColor="rgba(255,255,255,0.58)"
            filter="blur(5px)"
            animation={`${revealShimmer} 920ms ease-in-out forwards`}
          />
        ) : null}
        {place.iconPath ? (
          <Image src={place.iconPath} alt={place.title} w="50px" h="50px" objectFit="contain" />
        ) : (
          <Text color="#8B664A" fontSize="13px" fontWeight="800" lineHeight="1">
            {place.placeholder}
          </Text>
        )}
      </Flex>
      <Text color="#73543F" fontSize="13px" fontWeight="800" lineHeight="1.1" textAlign="center">
        {place.title}
      </Text>
    </Flex>
  );
}

function LockedPlaceDescription({ place }: { place: PlaceNote }) {
  return (
    <Flex
      direction="column"
      gap="22px"
      pl={place.isActive ? "14px" : "0"}
      borderLeft={place.isActive ? "3px solid #DAB878" : "0 solid transparent"}
      animation={place.isUnlocking ? `${revealPulse} 920ms ease-out forwards` : undefined}
    >
      <Flex alignItems="center" gap="16px">
        <Flex
          w="64px"
          h="64px"
          borderRadius="10px"
          bgColor="#EFE3D2"
          border="1px solid rgba(155,118,86,0.12)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          {place.iconPath ? (
            <Image src={place.iconPath} alt={place.title} w="40px" h="40px" objectFit="contain" opacity={0.62} />
          ) : (
            <Text color="#9D7859" fontSize="12px" fontWeight="800" lineHeight="1">
              {place.placeholder}
            </Text>
          )}
        </Flex>
        <Text color="#1C1712" fontSize="22px" fontWeight="800" lineHeight="1.2" letterSpacing="0">
          {place.title}
        </Text>
      </Flex>
      <Text color="#1C1712" fontSize="16px" fontWeight="700" lineHeight="1.75" letterSpacing="0">
        {place.description}
      </Text>
    </Flex>
  );
}

export function ArrangeRouteMapOverlay({
  placeUnlockSnapshot,
  canRedeemStreet = false,
  highlightedPlaceId,
  unlockingPlaceId,
  onClose,
}: ArrangeRouteMapOverlayProps) {
  const [revealedUnlockPlaceId, setRevealedUnlockPlaceId] =
    useState<typeof unlockingPlaceId>(undefined);

  const isStreetUnlocking = unlockingPlaceId === "street" && revealedUnlockPlaceId !== "street";
  const isStreetKnown =
    (canRedeemStreet && unlockingPlaceId !== "street") || revealedUnlockPlaceId === "street";
  const isConvenienceUnlocking =
    unlockingPlaceId === "convenience-store" && revealedUnlockPlaceId !== "convenience-store";
  const isConvenienceKnown =
    (placeUnlockSnapshot.convenienceStore.isUnlocked && unlockingPlaceId !== "convenience-store") ||
    revealedUnlockPlaceId === "convenience-store";
  const isBreakfastKnown = placeUnlockSnapshot.breakfastShop.isUnlocked;
  const discoveredSunbeastCount = Math.min(placeUnlockSnapshot.breakfastShop.discoveredSunbeastCount, 2);

  useEffect(() => {
    setRevealedUnlockPlaceId(undefined);
    if (!unlockingPlaceId) return;
    const timer = window.setTimeout(() => {
      setRevealedUnlockPlaceId(unlockingPlaceId);
    }, 920);
    return () => window.clearTimeout(timer);
  }, [unlockingPlaceId]);

  const placeNotes: PlaceNote[] = [
    {
      id: "metro-station",
      title: "捷運",
      description: "一開始就知道的通勤地點。",
      iconPath: "/images/icon/mrt.png",
      isKnown: true,
    },
    {
      id: "street",
      title: "街道",
      description: (
        <>
          收集
          <ClueKeyword>第一隻小日獸</ClueKeyword>
          後，街道會加入已知地點
        </>
      ),
      iconPath: "/images/icon/street.png",
      isKnown: isStreetKnown,
      isActive: highlightedPlaceId === "street" || isStreetUnlocking,
      isUnlocking: isStreetUnlocking,
    },
    {
      id: "convenience-store",
      title: "商店",
      description: (
        <>
          安排行程時，經過
          <ClueKeyword>捷運</ClueKeyword>
          和
          <ClueKeyword tone="mint">街道</ClueKeyword>
          來解鎖
        </>
      ),
      iconPath: "/images/icon/mart.png",
      isKnown: isConvenienceKnown,
      isActive: highlightedPlaceId === "convenience-store" || isConvenienceUnlocking,
      isUnlocking: isConvenienceUnlocking,
    },
    {
      id: "breakfast-shop",
      title: "早餐店",
      description: (
        <>
          發現
          <ClueKeyword>2 隻小日獸</ClueKeyword>
          後解鎖，目前 {discoveredSunbeastCount}/2
        </>
      ),
      iconPath: "/images/icon/breakfast.png",
      isKnown: isBreakfastKnown,
    },
  ];

  const knownPlaces = placeNotes.filter((place) => place.isKnown);
  const lockedPlaces = placeNotes.filter((place) => !place.isKnown);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      bgColor="#FBF7EE"
      backgroundImage="linear-gradient(rgba(161,124,89,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(161,124,89,0.06) 1px, transparent 1px)"
      backgroundSize="24px 24px"
      direction="column"
      overflow="hidden"
    >
      <Flex
        position="relative"
        zIndex={1}
        minH="96px"
        px="20px"
        pt="14px"
        pb="12px"
        bgColor="#F8DFAE"
        flexShrink={0}
        alignItems="center"
        justifyContent="space-between"
        gap="12px"
        borderBottom="1px solid rgba(135,98,66,0.12)"
      >
        <Flex direction="column" gap="4px" minW="0">
          <Text color="#71503D" fontSize="27px" fontWeight="900" lineHeight="1" letterSpacing="0">
            地點
          </Text>
          <Text color="#9D7859" fontSize="13px" fontWeight="800" lineHeight="1.25">
            已知地點與未解開線索
          </Text>
        </Flex>
        <Flex
          as="button"
          w="40px"
          h="40px"
          borderRadius="999px"
          bgColor="rgba(255,253,248,0.94)"
          color="#7C5E47"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 6px 14px rgba(97,69,42,0.08)"
          onClick={onClose}
          aria-label="關閉地點"
        >
          <FiX size={24} strokeWidth={2.4} />
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={1} flex="1" minH="0" direction="column" overflowY="auto" css={{ scrollbarWidth: "none" }}>
        <Flex direction="column" px="22px" pt="24px" pb="26px" gap="18px" flexShrink={0}>
          <Text color="#71503D" fontSize="22px" fontWeight="900" lineHeight="1.2" letterSpacing="0">
            已知地點
          </Text>
          <Box
            display="grid"
            gridTemplateColumns="repeat(2, 82px)"
            gap="20px 24px"
            alignItems="start"
          >
            {knownPlaces.map((place) => (
              <KnownPlaceTile key={place.id} place={place} />
            ))}
          </Box>
        </Flex>

        <Box h="1px" bgColor="rgba(112,80,61,0.28)" flexShrink={0} />

        <Flex direction="column" px="32px" py="44px" gap="34px" flexShrink={0}>
          {lockedPlaces.length > 0 ? (
            lockedPlaces.map((place) => (
              <LockedPlaceDescription key={place.id} place={place} />
            ))
          ) : (
            <Text color="#9D7859" fontSize="15px" fontWeight="700" lineHeight="1.6">
              目前沒有尚未解開的地點線索。
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

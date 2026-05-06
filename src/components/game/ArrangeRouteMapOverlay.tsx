"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiLock, FiX } from "react-icons/fi";
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

type PlaceCardProps = {
  title: string;
  subtitle: ReactNode;
  iconPath?: string;
  placeholder?: string;
  isRedeemable?: boolean;
  cost?: number;
  muted?: boolean;
  isDisabled?: boolean;
  isHighlighted?: boolean;
  isUnlocking?: boolean;
  isUnlockRevealed?: boolean;
  statusLabel?: string;
  onRedeem?: () => void;
};

const cardUnlockPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 227, 174, 0); transform: scale(1); }
  42% { box-shadow: 0 0 0 7px rgba(255, 227, 174, 0.42), 0 14px 28px rgba(49,40,28,0.22); transform: scale(1.015); }
  100% { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.82), 0 14px 28px rgba(49,40,28,0.24); transform: scale(1); }
`;

const cardUnlockShimmer = keyframes`
  0% { transform: translateX(-150%) rotate(12deg); opacity: 0; }
  18% { opacity: 0.85; }
  100% { transform: translateX(210%) rotate(12deg); opacity: 0; }
`;

const cardUnlockBar = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

const lockBadgeFlip = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  46% { opacity: 0; transform: translateY(-5px) scale(0.94); }
  54% { opacity: 0; transform: translateY(5px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

function CoinBadge({ value }: { value: number }) {
  return (
    <Flex
      h="30px"
      px="10px"
      borderRadius="999px"
      bgColor="#FFFDFC"
      border="2px solid rgba(180,141,106,0.28)"
      alignItems="center"
      gap="6px"
    >
      <Image
        src="/slot/golden.png"
        alt="小日幣"
        w="20px"
        h="20px"
        objectFit="contain"
      />
      <Text color="#705B46" fontSize="14px" fontWeight="700" lineHeight="1">
        {value}
      </Text>
    </Flex>
  );
}

function PlaceIcon({
  title,
  iconPath,
  placeholder,
}: {
  title: string;
  iconPath?: string;
  placeholder?: string;
}) {
  if (iconPath) {
    return (
      <Flex
        w="48px"
        h="48px"
        borderRadius="12px"
        bgColor="#FFF8EA"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Image src={iconPath} alt={title} w="34px" h="34px" objectFit="contain" />
      </Flex>
    );
  }

  return (
    <Flex
      w="48px"
      h="48px"
      borderRadius="12px"
      bgColor="#B48D6A"
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
    >
      <Text color="#F5E7D1" fontSize="11px" fontWeight="600" lineHeight="1">
        {placeholder ?? ""}
      </Text>
    </Flex>
  );
}

function PlaceCard({
  title,
  subtitle,
  iconPath,
  placeholder,
  isRedeemable = false,
  cost = 10,
  muted = false,
  isDisabled = false,
  isHighlighted = false,
  isUnlocking = false,
  isUnlockRevealed = false,
  statusLabel,
  onRedeem,
}: PlaceCardProps) {
  const effectiveMuted = muted && !isUnlockRevealed;
  const effectiveHighlighted = isHighlighted || isUnlocking || isUnlockRevealed;
  const effectiveStatusLabel = isUnlockRevealed ? "已解鎖" : statusLabel;

  return (
    <Flex
      minH="78px"
      borderRadius="14px"
      border="2px solid"
      borderColor={
        effectiveHighlighted
          ? "rgba(255, 227, 174, 0.96)"
          : effectiveMuted
            ? "rgba(180,141,106,0.22)"
            : "rgba(180,141,106,0.38)"
      }
      bgColor={effectiveHighlighted ? "#FFF8DD" : effectiveMuted ? "rgba(226,199,159,0.42)" : "#FFFDFC"}
      px="12px"
      py="10px"
      alignItems="center"
      justifyContent="space-between"
      gap="10px"
      boxShadow={
        effectiveHighlighted
          ? "0 0 0 4px rgba(255, 255, 255, 0.82), 0 14px 28px rgba(49,40,28,0.24)"
          : effectiveMuted
            ? "none"
            : "0 6px 14px rgba(112,91,70,0.08)"
      }
      position="relative"
      zIndex={effectiveHighlighted ? 2 : undefined}
      overflow="hidden"
      animation={isUnlocking ? `${cardUnlockPulse} 920ms ease-out forwards` : undefined}
    >
      {isUnlocking ? (
        <>
          <Box
            position="absolute"
            top="-35%"
            bottom="-35%"
            left="0"
            w="48px"
            bgColor="rgba(255,255,255,0.58)"
            filter="blur(5px)"
            animation={`${cardUnlockShimmer} 920ms ease-in-out forwards`}
          />
          <Flex position="absolute" left="0" right="0" bottom="0" h="4px" bgColor="rgba(180,141,106,0.18)">
            <Box h="100%" bg="linear-gradient(90deg, #F6D982 0%, #9DE0C3 100%)" animation={`${cardUnlockBar} 920ms ease-out forwards`} />
          </Flex>
        </>
      ) : null}
      <Flex alignItems="center" gap="10px" minW="0" flex="1">
        <PlaceIcon title={title} iconPath={iconPath} placeholder={placeholder} />
        <Flex direction="column" minW="0" gap="5px">
          <Text color={effectiveMuted ? "#A88A70" : "#7C5E47"} fontSize="20px" fontWeight="600" lineHeight="1">
            {title}
          </Text>
          {subtitle ? (
            <Text
              color={effectiveMuted ? "#A88A70" : "#9D7859"}
              fontSize="12px"
              fontWeight="500"
              lineHeight="1.35"
              whiteSpace="pre-line"
            >
              {subtitle}
            </Text>
          ) : null}
        </Flex>
      </Flex>

      {isRedeemable ? (
        <Flex direction="column" alignItems="flex-end" gap="6px" flexShrink={0}>
          <CoinBadge value={cost} />
          <Flex
            as="button"
            h="34px"
            minW="76px"
            px="14px"
            borderRadius="999px"
            bgColor={isDisabled ? "#D8C1A6" : "#B48D6A"}
            alignItems="center"
            justifyContent="center"
            cursor={isDisabled ? "not-allowed" : "pointer"}
            opacity={isDisabled ? 0.72 : 1}
            onClick={isDisabled ? undefined : onRedeem}
          >
            <Text color="white" fontSize="14px" fontWeight="600" lineHeight="1">
              兌換
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex
          h="30px"
          px="9px"
          borderRadius="999px"
          bgColor="rgba(180,141,106,0.14)"
          alignItems="center"
          justifyContent="center"
          color="#B48D6A"
          gap="5px"
          flexShrink={0}
          animation={isUnlocking ? `${lockBadgeFlip} 920ms ease-out forwards` : undefined}
        >
          {effectiveStatusLabel ? null : <FiLock size={16} strokeWidth={2.5} />}
          <Text color="#9D7859" fontSize="12px" fontWeight="600" lineHeight="1">
            {effectiveStatusLabel ?? "未解鎖"}
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

export function ArrangeRouteMapOverlay({
  coinCount,
  placeUnlockSnapshot,
  canRedeemStreet = false,
  isReadOnly = false,
  highlightedPlaceId,
  unlockingPlaceId,
  onRedeemMetro,
  onRedeemStreet,
  onClose,
}: ArrangeRouteMapOverlayProps) {
  const [revealedUnlockPlaceId, setRevealedUnlockPlaceId] =
    useState<typeof unlockingPlaceId>(undefined);
  const isStreetUnlocking = unlockingPlaceId === "street" && revealedUnlockPlaceId !== "street";
  const isStreetUnlockRevealed =
    (canRedeemStreet && unlockingPlaceId !== "street") || revealedUnlockPlaceId === "street";
  const isConvenienceUnlocking = unlockingPlaceId === "convenience-store" && revealedUnlockPlaceId !== "convenience-store";
  const isConvenienceUnlockRevealed =
    (placeUnlockSnapshot.convenienceStore.isUnlocked && unlockingPlaceId !== "convenience-store") ||
    revealedUnlockPlaceId === "convenience-store";

  useEffect(() => {
    setRevealedUnlockPlaceId(undefined);
    if (!unlockingPlaceId) return;
    const timer = window.setTimeout(() => {
      setRevealedUnlockPlaceId(unlockingPlaceId);
    }, 920);
    return () => window.clearTimeout(timer);
  }, [unlockingPlaceId]);

  const convenienceSubtitle = isConvenienceUnlockRevealed
    ? "已解鎖"
    : "連續經過兩次 (0/2)";
  const breakfastSubtitle = placeUnlockSnapshot.breakfastShop.isUnlocked
    ? "已解鎖"
    : `解鎖第二隻小日獸來解鎖 (${Math.min(placeUnlockSnapshot.breakfastShop.discoveredSunbeastCount, 2)}/2)`;
  const streetSubtitle = isStreetUnlockRevealed ? "已解鎖" : "收集第一隻小日獸來解鎖";

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      bgColor="rgba(27,23,20,0.42)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      onClick={onClose}
    >
      <Flex
        w="100%"
        maxW="360px"
        maxH="76dvh"
        borderRadius="22px"
        bgColor="#FDF6EA"
        direction="column"
        overflow="hidden"
        border="2px solid rgba(180,141,106,0.42)"
        boxShadow="0 18px 44px rgba(49,40,28,0.24)"
        onClick={(event) => event.stopPropagation()}
      >
        <Flex
          minH="62px"
          px="14px"
          bgColor="#F8DFAE"
          alignItems="center"
          justifyContent="space-between"
          gap="10px"
        >
          <Flex direction="column" gap="4px" minW="0">
            <Text color="#7C5E47" fontSize="23px" fontWeight="600" lineHeight="1">
              地點
            </Text>
            <Text color="#9D7859" fontSize="12px" fontWeight="500" lineHeight="1">
              兌換與解鎖新的行程地點
            </Text>
          </Flex>
          <Flex alignItems="center" gap="8px">
            <CoinBadge value={coinCount} />
            <Flex
              as="button"
              w="30px"
              h="30px"
              borderRadius="999px"
              bgColor="#FFFDFC"
              color="#7C5E47"
              alignItems="center"
              justifyContent="center"
              onClick={onClose}
              aria-label="關閉地點"
            >
              <FiX size={18} strokeWidth={2.4} />
            </Flex>
          </Flex>
        </Flex>

        <Flex
          flex="1"
          minH="0"
          bgColor="#FDF6EA"
          direction="column"
          gap="9px"
          px="10px"
          py="10px"
          overflowY="auto"
        >
          <PlaceCard
            title="捷運"
            subtitle=""
            iconPath="/images/icon/mrt.png"
            isRedeemable={!isReadOnly}
            statusLabel={isReadOnly ? "已解鎖" : undefined}
            isDisabled={coinCount < 10}
            onRedeem={onRedeemMetro}
          />
          <PlaceCard
            title="街道"
            subtitle={streetSubtitle}
            iconPath="/images/icon/street.png"
            isRedeemable={isStreetUnlockRevealed && !isReadOnly}
            statusLabel={isReadOnly && isStreetUnlockRevealed ? "已解鎖" : undefined}
            isDisabled={coinCount < 10}
            muted={!isStreetUnlockRevealed}
            isHighlighted={highlightedPlaceId === "street"}
            isUnlocking={isStreetUnlocking}
            isUnlockRevealed={isStreetUnlockRevealed}
            onRedeem={onRedeemStreet}
          />
          <PlaceCard
            title="商店"
            subtitle={convenienceSubtitle}
            iconPath="/images/icon/mart.png"
            muted={!isConvenienceUnlockRevealed}
            isHighlighted={highlightedPlaceId === "convenience-store"}
            isUnlocking={isConvenienceUnlocking}
            isUnlockRevealed={isConvenienceUnlockRevealed}
          />
          <PlaceCard
            title="早餐店"
            subtitle={breakfastSubtitle}
            placeholder="早餐"
            muted={!placeUnlockSnapshot.breakfastShop.isUnlocked}
          />
          <PlaceCard
            title="公園"
            subtitle="經過特定拼圖來解鎖"
            iconPath="/images/icon/park.png"
            muted
          />
          <PlaceCard
            title="公車站"
            subtitle="需先解鎖早餐店"
            placeholder="轉乘"
            muted
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

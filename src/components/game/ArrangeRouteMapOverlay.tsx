"use client";

import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { FiLock } from "react-icons/fi";
import type { getPlaceUnlockSnapshot } from "@/lib/game/playerProgress";

type ArrangeRouteMapOverlayProps = {
  placeUnlockSnapshot: ReturnType<typeof getPlaceUnlockSnapshot>;
  coinCount: number;
  canRedeemStreet?: boolean;
  onRedeemMetro?: () => void;
  onRedeemStreet?: () => void;
  onClose: () => void;
};

type PlaceCardProps = {
  title: string;
  subtitle: string;
  iconPath?: string;
  placeholder?: string;
  isRedeemable?: boolean;
  cost?: number;
  muted?: boolean;
  isDisabled?: boolean;
  onRedeem?: () => void;
};

function CoinBadge({ value }: { value: number }) {
  return (
    <Flex alignItems="center" gap="8px">
      <Image
        src="/slot/golden.png"
        alt="小日幣"
        w="26px"
        h="26px"
        objectFit="contain"
      />
      <Text color="#745629" fontSize="18px" fontWeight="500" lineHeight="1">
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
    return <Image src={iconPath} alt={title} w="54px" h="54px" objectFit="contain" flexShrink={0} />;
  }

  return (
    <Flex
      w="54px"
      h="54px"
      bgColor="#B48D6A"
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
    >
      <Text color="#F5E7D1" fontSize="11px" fontWeight="700" lineHeight="1">
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
  onRedeem,
}: PlaceCardProps) {
  return (
    <Flex
      minH="108px"
      borderRadius="12px"
      border="3px solid #B48D6A"
      bgColor={muted ? "#E2C79F" : "#FCFCFD"}
      px="18px"
      py="14px"
      alignItems="center"
      justifyContent="space-between"
      gap="16px"
    >
      <Flex alignItems="center" gap="16px" minW="0" flex="1">
        <PlaceIcon title={title} iconPath={iconPath} placeholder={placeholder} />
        <Flex direction="column" minW="0" gap="8px">
          <Text color="#B48D6A" fontSize="26px" fontWeight="400" lineHeight="1">
            {title}
          </Text>
          <Text color="#B48D6A" fontSize="14px" fontWeight="400" lineHeight="1.25" whiteSpace="pre-line">
            {subtitle}
          </Text>
        </Flex>
      </Flex>

      {isRedeemable ? (
        <Flex direction="column" alignItems="flex-end" gap="10px" flexShrink={0}>
          <CoinBadge value={cost} />
          <Flex
            as="button"
            h="44px"
            minW="92px"
            px="18px"
            borderRadius="8px"
            bgColor={isDisabled ? "#D8C1A6" : "#B48D6A"}
            alignItems="center"
            justifyContent="center"
            cursor={isDisabled ? "not-allowed" : "pointer"}
            opacity={isDisabled ? 0.72 : 1}
            onClick={isDisabled ? undefined : onRedeem}
          >
            <Text color="white" fontSize="16px" fontWeight="500" lineHeight="1">
              兌換
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex
          w="42px"
          h="42px"
          alignItems="center"
          justifyContent="center"
          color="#B48D6A"
          flexShrink={0}
        >
          <FiLock size={34} strokeWidth={2.2} />
        </Flex>
      )}
    </Flex>
  );
}

export function ArrangeRouteMapOverlay({
  coinCount,
  placeUnlockSnapshot,
  canRedeemStreet = false,
  onRedeemMetro,
  onRedeemStreet,
  onClose,
}: ArrangeRouteMapOverlayProps) {
  const convenienceSubtitle = placeUnlockSnapshot.convenienceStore.isUnlocked
    ? "已解鎖"
    : `連續兩天經過街道來解鎖 (${placeUnlockSnapshot.convenienceStore.progressDays}/2)`;
  const breakfastSubtitle = placeUnlockSnapshot.breakfastShop.isUnlocked
    ? "已解鎖"
    : `解鎖第二隻小日獸來解鎖 (${Math.min(placeUnlockSnapshot.breakfastShop.discoveredSunbeastCount, 2)}/2)`;

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      bgColor="rgba(27,23,20,0.42)"
      alignItems="center"
      justifyContent="center"
      px="14px"
      onClick={onClose}
    >
      <Flex
        w="100%"
        maxW="362px"
        h="740px"
        borderRadius="30px"
        bgColor="#FBC74C"
        direction="column"
        pt="22px"
        px="18px"
        pb="18px"
        boxShadow="0 16px 40px rgba(49,40,28,0.24)"
        onClick={(event) => event.stopPropagation()}
      >
        <Flex
          h="82px"
          px="16px"
          borderTopLeftRadius="18px"
          borderTopRightRadius="18px"
          bgColor="#FBE0A8"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text color="#B48D6A" fontSize="24px" fontWeight="400" lineHeight="1">
            地點
          </Text>
          <CoinBadge value={coinCount} />
        </Flex>

        <Flex
          flex="1"
          minH="0"
          bgColor="#FDF8E6"
          direction="column"
          gap="18px"
          px="14px"
          py="18px"
          overflowY="auto"
        >
          <PlaceCard
            title="捷運"
            subtitle=""
            iconPath="/images/icon/mrt.png"
            isRedeemable
            isDisabled={coinCount < 10}
            onRedeem={onRedeemMetro}
          />
          <PlaceCard
            title="街道"
            subtitle="收集第一隻小日獸來解鎖"
            iconPath="/images/icon/street.png"
            isRedeemable={canRedeemStreet}
            isDisabled={coinCount < 10}
            onRedeem={onRedeemStreet}
          />
          <PlaceCard
            title="商店"
            subtitle={convenienceSubtitle}
            iconPath="/images/icon/mart.png"
            muted={!placeUnlockSnapshot.convenienceStore.isUnlocked}
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
          />
          <PlaceCard
            title="公車站"
            subtitle="需先解鎖早餐店"
            placeholder="轉乘"
          />
          <PlaceCard
            title="尚未解鎖"
            subtitle={"更多地點會隨著劇情與事\n件慢慢出現"}
            placeholder="?"
            muted
          />
        </Flex>

        <Box
          w="134px"
          h="30px"
          borderRadius="999px"
          bgColor="#DEB05F"
          alignSelf="center"
          mt="16px"
        />
      </Flex>
    </Flex>
  );
}

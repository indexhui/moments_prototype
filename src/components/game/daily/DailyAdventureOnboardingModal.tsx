"use client";

import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  IoCameraOutline,
  IoChatbubbleEllipsesOutline,
  IoChevronBack,
  IoChevronForward,
  IoImagesOutline,
  IoSparkles,
} from "react-icons/io5";
import {
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS,
  DAILY_ADVENTURE_ROUTE_TILES,
} from "@/lib/game/dailyAdventure";

const ENCOUNTER_ITEMS = [
  { label: "文字事件", icon: IoChatbubbleEllipsesOutline, color: "#A97957", bg: "#F4E4D3" },
  { label: "日常漫畫", icon: IoImagesOutline, color: "#73856A", bg: "#E5EAD9" },
  { label: "幫小貝狗拍照", icon: IoCameraOutline, color: "#73849A", bg: "#E2E8EE" },
] as const;

export function DailyAdventureOnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const isLastStep = stepIndex === 2;

  const handleContinue = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={80}
      bgColor="rgba(40, 29, 20, 0.52)"
      alignItems="center"
      justifyContent="center"
      px="18px"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-adventure-onboarding-title"
    >
      <Flex
        w="100%"
        maxW="346px"
        minH="510px"
        direction="column"
        overflow="hidden"
        borderRadius="24px"
        bgColor="#FFFDF8"
        border="1px solid #E5D2B7"
        boxShadow="0 20px 42px rgba(55, 38, 25, 0.28)"
      >
        <Flex
          h="76px"
          px="22px"
          bgColor="#B88E6D"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex alignItems="center" gap="8px">
            <Flex
              w="34px"
              h="34px"
              borderRadius="50%"
              bgColor="rgba(255,255,255,0.22)"
              alignItems="center"
              justifyContent="center"
            >
              <IoSparkles size={18} color="#FFFFFF" />
            </Flex>
            <Text color="#FFFFFF" fontSize="12px" fontWeight="900" letterSpacing="0.08em">
              DAILY ADVENTURE
            </Text>
          </Flex>
          <Text color="rgba(255,255,255,0.82)" fontSize="12px" fontWeight="900">
            {stepIndex + 1} / 3
          </Text>
        </Flex>

        <Flex flex="1" direction="column" px="20px" pt="22px" pb="18px">
          <Box flex="1">
            {stepIndex === 0 ? (
              <Flex direction="column" alignItems="center" textAlign="center">
                <Flex
                  position="relative"
                  w="100%"
                  h="178px"
                  borderRadius="18px"
                  overflow="hidden"
                  bgColor="#D7B082"
                >
                  <img
                    src="/images/lobby/daily_adventure.png"
                    alt="小貝狗準備出門冒險"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <Box
                    position="absolute"
                    inset="0"
                    bg="linear-gradient(180deg, rgba(65,42,27,0.02), rgba(65,42,27,0.3))"
                  />
                  <Box position="absolute" right="2px" bottom="-24px" w="112px" h="146px">
                    <img
                      src="/images/lobby/beigo_idle.png"
                      alt=""
                      aria-hidden="true"
                      style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    />
                  </Box>
                </Flex>
                <Text
                  id="daily-adventure-onboarding-title"
                  mt="18px"
                  color="#6B4E3A"
                  fontSize="23px"
                  fontWeight="900"
                  lineHeight="1.3"
                >
                  歡迎進入日常冒險
                </Text>
                <Text mt="9px" color="#8C6D57" fontSize="14px" fontWeight="700" lineHeight="1.65">
                  每天遊玩，都有機會發現走走小日世界各個角落裡，藏著的事情和場景。
                </Text>
              </Flex>
            ) : null}

            {stepIndex === 1 ? (
              <Flex direction="column" alignItems="center" textAlign="center">
                <Text
                  id="daily-adventure-onboarding-title"
                  color="#6B4E3A"
                  fontSize="23px"
                  fontWeight="900"
                  lineHeight="1.3"
                >
                  每次出門，都可能有新發現
                </Text>
                <Text mt="9px" color="#8C6D57" fontSize="14px" fontWeight="700" lineHeight="1.6">
                  帶上小貝狗或喜歡的小日獸，一起走進不同的日常。
                </Text>
                <Flex mt="22px" w="100%" direction="column" gap="10px">
                  {ENCOUNTER_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Flex
                        key={item.label}
                        h="66px"
                        px="14px"
                        borderRadius="16px"
                        bgColor={item.bg}
                        alignItems="center"
                        gap="13px"
                      >
                        <Flex
                          w="40px"
                          h="40px"
                          borderRadius="13px"
                          bgColor="rgba(255,255,255,0.82)"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon size={22} color={item.color} />
                        </Flex>
                        <Text color="#604A3A" fontSize="15px" fontWeight="900">
                          {item.label}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
            ) : null}

            {stepIndex === 2 ? (
              <Flex direction="column" alignItems="center" textAlign="center">
                <Text
                  id="daily-adventure-onboarding-title"
                  color="#6B4E3A"
                  fontSize="23px"
                  fontWeight="900"
                  lineHeight="1.3"
                >
                  想去哪裡，由你決定
                </Text>
                <Text mt="8px" color="#8C6D57" fontSize="14px" fontWeight="700" lineHeight="1.55">
                  收集地點拼圖，自己決定這次要去哪裡冒險。
                </Text>
                <Flex
                  mt="16px"
                  h="29px"
                  px="12px"
                  borderRadius="999px"
                  bgColor="#F3E1C9"
                  alignItems="center"
                  gap="6px"
                >
                  <IoSparkles size={14} color="#A36E47" />
                  <Text color="#8C6043" fontSize="12px" fontWeight="900">
                    已獲得 3 張地點拼圖
                  </Text>
                </Flex>
                <Flex mt="16px" w="100%" gap="8px" justifyContent="center">
                  {DAILY_ADVENTURE_ONBOARDING_ROUTE_TILE_IDS.map((id) => {
                    const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
                    if (!tile) return null;
                    const location = DAILY_ADVENTURE_LOCATIONS[tile.locationId];
                    return (
                      <Flex key={id} flex="1" minW="0" direction="column" alignItems="center" gap="7px">
                        <Flex
                          w="100%"
                          aspectRatio="1"
                          borderRadius="13px"
                          overflow="hidden"
                          border="3px solid #E7D6BF"
                          bgColor="#C2DB99"
                          boxShadow="0 5px 12px rgba(80,58,40,0.1)"
                        >
                          <img
                            src={tile.imagePath}
                            alt={`${location.name}・${tile.variantLabel}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </Flex>
                        <Text color="#665041" fontSize="11px" fontWeight="900" lineHeight="1.25">
                          {location.name}
                        </Text>
                      </Flex>
                    );
                  })}
                </Flex>
                <Text mt="19px" color="#6B5140" fontSize="16px" fontWeight="900">
                  準備好就開始吧！
                </Text>
              </Flex>
            ) : null}
          </Box>

          <Flex mt="18px" alignItems="center" justifyContent="space-between" gap="10px">
            <Flex minW="78px">
              {stepIndex > 0 ? (
                <Flex
                  as="button"
                  h="42px"
                  px="10px"
                  borderRadius="999px"
                  alignItems="center"
                  gap="3px"
                  color="#9A7B65"
                  cursor="pointer"
                  onClick={() => setStepIndex((current) => current - 1)}
                >
                  <IoChevronBack size={17} />
                  <Text color="inherit" fontSize="13px" fontWeight="900">
                    上一步
                  </Text>
                </Flex>
              ) : null}
            </Flex>

            <Flex gap="6px" alignItems="center" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <Box
                  key={index}
                  w={index === stepIndex ? "20px" : "7px"}
                  h="7px"
                  borderRadius="999px"
                  bgColor={index === stepIndex ? "#B88E6D" : "#DECDBB"}
                />
              ))}
            </Flex>

            <Flex
              as="button"
              minW={isLastStep ? "132px" : "92px"}
              h="44px"
              px="16px"
              borderRadius="999px"
              bgColor="#9B704F"
              alignItems="center"
              justifyContent="center"
              gap="4px"
              cursor="pointer"
              boxShadow="0 6px 12px rgba(92,63,38,0.16)"
              onClick={handleContinue}
              autoFocus
            >
              <Text color="#FFFFFF" fontSize="14px" fontWeight="900">
                {isLastStep ? "開始冒險" : "下一步"}
              </Text>
              {!isLastStep ? <IoChevronForward size={17} color="#FFFFFF" /> : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

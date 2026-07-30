"use client";

import { useMemo, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { IoArrowBack, IoChevronForward, IoShuffle } from "react-icons/io5";
import {
  DAILY_ADVENTURE_ACCESSORY_STYLES,
  DAILY_ADVENTURE_BACKGROUND_STYLES,
  DAILY_ADVENTURE_BLUSH_STYLES,
  DAILY_ADVENTURE_CLOTHES_STYLES,
  DAILY_ADVENTURE_EYEBROW_STYLES,
  DAILY_ADVENTURE_EYE_STYLES,
  DAILY_ADVENTURE_FACE_STYLES,
  DAILY_ADVENTURE_HAIR_COLORS,
  DAILY_ADVENTURE_HAIR_STYLES,
  DAILY_ADVENTURE_MAKEUP_STYLES,
  DAILY_ADVENTURE_MOLE_STYLES,
  DAILY_ADVENTURE_MOUTH_STYLES,
  DAILY_ADVENTURE_NOSE_STYLES,
  DAILY_ADVENTURE_ORNAMENT_STYLES,
  DAILY_ADVENTURE_SKIN_TONES,
  DAILY_ADVENTURE_STAMP_STYLES,
  DEFAULT_DAILY_ADVENTURE_AVATAR,
  saveDailyAdventureProfile,
  type DailyAdventureAvatarConfig,
} from "@/lib/game/dailyAdventureProfile";
import { DailyAdventureAvatarPreview } from "./DailyAdventureAvatarPreview";

const AVATAR_TABS = [
  { id: "face", label: "臉型", key: "faceStyle", options: DAILY_ADVENTURE_FACE_STYLES },
  { id: "hair", label: "髮型", key: "hairStyle", options: DAILY_ADVENTURE_HAIR_STYLES },
  {
    id: "eyebrows",
    label: "眉毛",
    key: "eyebrowStyle",
    options: DAILY_ADVENTURE_EYEBROW_STYLES,
  },
  { id: "eyes", label: "眼睛", key: "eyeStyle", options: DAILY_ADVENTURE_EYE_STYLES },
  { id: "nose", label: "鼻子", key: "noseStyle", options: DAILY_ADVENTURE_NOSE_STYLES },
  { id: "mouth", label: "嘴巴", key: "mouthStyle", options: DAILY_ADVENTURE_MOUTH_STYLES },
  {
    id: "clothes",
    label: "衣服",
    key: "clothesStyle",
    options: DAILY_ADVENTURE_CLOTHES_STYLES,
  },
  {
    id: "accessories",
    label: "配件",
    key: "accessoryStyle",
    options: DAILY_ADVENTURE_ACCESSORY_STYLES,
  },
  { id: "blush", label: "腮紅", key: "blushStyle", options: DAILY_ADVENTURE_BLUSH_STYLES },
  {
    id: "makeup",
    label: "妝容",
    key: "makeupStyle",
    options: DAILY_ADVENTURE_MAKEUP_STYLES,
  },
  { id: "mole", label: "痣／鬍", key: "moleStyle", options: DAILY_ADVENTURE_MOLE_STYLES },
  {
    id: "ornament",
    label: "頭飾",
    key: "ornamentStyle",
    options: DAILY_ADVENTURE_ORNAMENT_STYLES,
  },
  { id: "stamp", label: "貼紙", key: "stampStyle", options: DAILY_ADVENTURE_STAMP_STYLES },
  {
    id: "background",
    label: "背景",
    key: "backgroundStyle",
    options: DAILY_ADVENTURE_BACKGROUND_STYLES,
  },
] as const;

type AvatarTab = (typeof AVATAR_TABS)[number]["id"];

const HAIR_COLOR_SWATCHES = [
  "#55565B",
  "#6E5A4F",
  "#5E4438",
  "#7B5944",
  "#967052",
  "#AD845E",
  "#C1996C",
  "#DFC493",
  "#7A6670",
  "#9A7279",
  "#BB898A",
  "#D4B36F",
  "#E8D3A9",
];
const SKIN_COLOR_SWATCHES = ["#FBE5DA", "#F8D9CA", "#EFC3A9", "#DCA487"];

export function DailyAdventureOnboardingModal({
  onComplete,
  onExit,
}: {
  onComplete: () => void;
  onExit?: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<DailyAdventureAvatarConfig>(
    DEFAULT_DAILY_ADVENTURE_AVATAR,
  );
  const [avatarTab, setAvatarTab] = useState<AvatarTab>("hair");
  const trimmedName = name.trim();

  const activeAvatarTab = AVATAR_TABS.find((tab) => tab.id === avatarTab)!;
  const avatarOptions = useMemo(() => {
    const key = activeAvatarTab.key as keyof DailyAdventureAvatarConfig;
    const values = activeAvatarTab.options as readonly number[];
    return values.map((value) => ({
      value,
      selected: avatar[key] === value,
      avatar: { ...avatar, [key]: value } as DailyAdventureAvatarConfig,
      apply: () =>
        setAvatar(
          (current) =>
            ({ ...current, [key]: value }) as DailyAdventureAvatarConfig,
        ),
    }));
  }, [avatar, avatarTab]);

  const randomizeAvatar = () => {
    const pick = <T,>(items: readonly T[]) =>
      items[Math.floor(Math.random() * items.length)];
    setAvatar({
      faceStyle: pick(DAILY_ADVENTURE_FACE_STYLES),
      skinTone: pick(DAILY_ADVENTURE_SKIN_TONES),
      hairStyle: pick(DAILY_ADVENTURE_HAIR_STYLES),
      hairColor: pick(DAILY_ADVENTURE_HAIR_COLORS),
      eyebrowStyle: pick(DAILY_ADVENTURE_EYEBROW_STYLES),
      eyeStyle: pick(DAILY_ADVENTURE_EYE_STYLES),
      noseStyle: pick(DAILY_ADVENTURE_NOSE_STYLES),
      mouthStyle: pick(DAILY_ADVENTURE_MOUTH_STYLES),
      clothesStyle: pick(DAILY_ADVENTURE_CLOTHES_STYLES),
      accessoryStyle: pick(DAILY_ADVENTURE_ACCESSORY_STYLES),
      blushStyle: pick(DAILY_ADVENTURE_BLUSH_STYLES),
      ornamentStyle: pick(DAILY_ADVENTURE_ORNAMENT_STYLES),
      makeupStyle: pick(DAILY_ADVENTURE_MAKEUP_STYLES),
      moleStyle: pick(DAILY_ADVENTURE_MOLE_STYLES),
      stampStyle: pick(DAILY_ADVENTURE_STAMP_STYLES),
      backgroundStyle: pick(DAILY_ADVENTURE_BACKGROUND_STYLES),
    });
  };

  const continueFlow = () => {
    if (stepIndex === 1 && !trimmedName) return;
    if (stepIndex < 2) {
      setStepIndex((current) => current + 1);
      return;
    }
    const profile = saveDailyAdventureProfile({ name: trimmedName, avatar });
    if (profile) onComplete();
  };

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={80}
      overflow="hidden"
      bgColor="#F4F1E6"
      bgImage="radial-gradient(circle at 18% 20%, rgba(103,154,178,0.3) 0 4px, transparent 5px), radial-gradient(circle at 82% 16%, rgba(119,172,151,0.28) 0 3px, transparent 4px), radial-gradient(circle at 76% 76%, rgba(95,139,170,0.22) 0 5px, transparent 6px), radial-gradient(circle at 18% 82%, rgba(129,174,137,0.24) 0 4px, transparent 5px)"
      direction="column"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-adventure-onboarding-title"
    >
      <Flex
        h="64px"
        flexShrink={0}
        px="14px"
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex
          as="button"
          w="38px"
          h="38px"
          borderRadius="50%"
          bgColor="rgba(255,255,255,0.72)"
          color="#696959"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          aria-label={stepIndex === 0 ? "返回大廳" : "上一步"}
          onClick={() => {
            if (stepIndex === 0) {
              onExit?.();
              return;
            }
            setStepIndex((current) => current - 1);
          }}
        >
          <IoArrowBack size={20} />
        </Flex>
        <Flex gap="7px" alignItems="center" aria-label={`第 ${stepIndex + 1} 步，共 3 步`}>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              w={index === stepIndex ? "24px" : "7px"}
              h="7px"
              borderRadius="999px"
              bgColor={index === stepIndex ? "#6F8F83" : "#C8CABB"}
              transition="all 180ms ease"
            />
          ))}
        </Flex>
        <Box w="38px" />
      </Flex>

      {stepIndex === 0 ? (
        <Flex
          flex="1"
          direction="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          px="36px"
          pb="92px"
        >
          <Flex
            position="relative"
            w="230px"
            h="230px"
            borderRadius="50%"
            bgColor="rgba(220,229,207,0.8)"
            alignItems="center"
            justifyContent="center"
          >
            <Box w="148px" h="148px">
              <img
                src="/images/lobby/beigo_idle.png"
                alt="小貝狗"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </Box>
          </Flex>
          <Text
            id="daily-adventure-onboarding-title"
            mt="30px"
            color="#4F5045"
            fontSize="25px"
            fontWeight="900"
            lineHeight="1.35"
          >
            這裡是日常冒險！
          </Text>
          <Text mt="12px" color="#77786B" fontSize="14px" fontWeight="700" lineHeight="1.75">
            和小貝狗一起走進生活的角落，
            <br />
            找找小日獸留下的蹤跡。
          </Text>
        </Flex>
      ) : null}

      {stepIndex === 1 ? (
        <Flex
          flex="1"
          direction="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          px="38px"
          pb="106px"
        >
          <Text
            id="daily-adventure-onboarding-title"
            color="#4F5045"
            fontSize="24px"
            fontWeight="900"
          >
            你的名字
          </Text>
          <Text mt="10px" color="#7C7C70" fontSize="13px" lineHeight="1.6">
            小日獸們會用這個名字記住你。
          </Text>
          <Box
            mt="52px"
            w="100%"
            borderBottom="2px solid #8C9182"
            pb="8px"
          >
            <input
              value={name}
              maxLength={12}
              autoFocus
              aria-label="玩家名稱"
              placeholder="輸入名稱"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && trimmedName) continueFlow();
              }}
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background: "transparent",
                color: "#4F5045",
                fontSize: "22px",
                fontWeight: 800,
                textAlign: "center",
              }}
            />
          </Box>
          <Text mt="9px" color="#A1A093" fontSize="11px">
            最多 12 個字
          </Text>
        </Flex>
      ) : null}

      {stepIndex === 2 ? (
        <Flex flex="1" minH="0" direction="column" alignItems="center" px="14px">
          <Flex w="100%" alignItems="center" justifyContent="space-between" px="4px">
            <Flex direction="column">
              <Text
                id="daily-adventure-onboarding-title"
                color="#4F5045"
                fontSize="22px"
                fontWeight="900"
              >
                角色捏臉
              </Text>
              <Text color="#858579" fontSize="11px">
                做一個最像你的冒險角色。
              </Text>
            </Flex>
            <Flex
              as="button"
              h="36px"
              px="11px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.78)"
              color="#6F7468"
              alignItems="center"
              gap="5px"
              cursor="pointer"
              onClick={randomizeAvatar}
            >
              <IoShuffle size={16} />
              <Text color="inherit" fontSize="11px" fontWeight="900">
                隨機
              </Text>
            </Flex>
          </Flex>

          <Flex
            mt="10px"
            w="218px"
            h="218px"
            borderRadius="50%"
            bgColor="#DDE8D4"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 14px 30px rgba(83,94,72,0.13)"
          >
            <DailyAdventureAvatarPreview
              avatar={avatar}
              name={trimmedName || "玩家"}
              size="202px"
              background="transparent"
            />
          </Flex>

          <Flex mt="10px" alignItems="center" gap="11px">
            <Text color="#77796D" fontSize="10px" fontWeight="900">
              膚色
            </Text>
            {DAILY_ADVENTURE_SKIN_TONES.map((tone, index) => (
              <Flex
                as="button"
                key={tone}
                w="25px"
                h="25px"
                borderRadius="50%"
                bgColor={SKIN_COLOR_SWATCHES[index]}
                border={avatar.skinTone === tone ? "3px solid #71796B" : "3px solid white"}
                cursor="pointer"
                aria-label={`膚色 ${index + 1}`}
                onClick={() => setAvatar((current) => ({ ...current, skinTone: tone }))}
              />
            ))}
          </Flex>

          <Box
            mt="11px"
            w="100%"
            minH="70px"
            borderRadius="24px"
            bgColor="rgba(255,255,255,0.72)"
            p="4px"
            flexShrink={0}
            display="grid"
            gridTemplateColumns="repeat(7, minmax(0, 1fr))"
            gap="3px"
          >
            {AVATAR_TABS.map((tab) => (
              <Flex
                as="button"
                key={tab.id}
                minW="0"
                h="29px"
                px="2px"
                borderRadius="999px"
                bgColor={avatarTab === tab.id ? "#798F80" : "transparent"}
                color={avatarTab === tab.id ? "white" : "#76776D"}
                boxShadow={
                  avatarTab === tab.id ? "0 0 0 2px rgba(225, 179, 78, 0.72)" : "none"
                }
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={() => setAvatarTab(tab.id)}
              >
                <Text
                  color="inherit"
                  fontSize="10px"
                  fontWeight="900"
                  lineHeight="1"
                  whiteSpace="nowrap"
                >
                  {tab.label}
                </Text>
              </Flex>
            ))}
          </Box>

          {avatarTab === "hair" || avatarTab === "eyebrows" ? (
            <Flex
              mt="9px"
              w="100%"
              h="26px"
              px="8px"
              alignItems="center"
              gap="9px"
              overflowX="auto"
              flexShrink={0}
              css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
            >
              {DAILY_ADVENTURE_HAIR_COLORS.map((color, index) => (
                <Flex
                  as="button"
                  key={color}
                  minW="22px"
                  w="22px"
                  h="22px"
                  borderRadius="50%"
                  bgColor={HAIR_COLOR_SWATCHES[index]}
                  border={avatar.hairColor === color ? "3px solid #F8F5EA" : "2px solid transparent"}
                  outline={avatar.hairColor === color ? "2px solid #73796D" : "none"}
                  cursor="pointer"
                  aria-label={`髮色 ${index + 1}`}
                  onClick={() => setAvatar((current) => ({ ...current, hairColor: color }))}
                />
              ))}
            </Flex>
          ) : null}

          <Flex
            mt="9px"
            w="100%"
            minH="84px"
            overflowX="auto"
            gap="8px"
            pb="4px"
            css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
          >
            {avatarOptions.map((option) => (
              <Flex
                as="button"
                key={option.value}
                position="relative"
                minW="72px"
                h="72px"
                borderRadius="16px"
                overflow="hidden"
                bgColor={option.selected ? "#CCD9C5" : "rgba(255,255,255,0.76)"}
                border={option.selected ? "3px solid #788A78" : "3px solid transparent"}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                aria-label={`${activeAvatarTab.label} ${
                  option.value === 0 ? "無" : option.value
                }`}
                onClick={option.apply}
              >
                <DailyAdventureAvatarPreview
                  avatar={option.avatar}
                  size="66px"
                  background="transparent"
                />
                {option.value === 0 ? (
                  <Flex
                    position="absolute"
                    left="5px"
                    bottom="4px"
                    h="17px"
                    px="6px"
                    borderRadius="999px"
                    bgColor="rgba(77,78,69,0.72)"
                    alignItems="center"
                  >
                    <Text color="white" fontSize="9px" fontWeight="900">
                      無
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            ))}
          </Flex>
        </Flex>
      ) : null}

      <Flex
        position="absolute"
        left="18px"
        right="18px"
        bottom="18px"
        h="54px"
        as="button"
        borderRadius="18px"
        bgColor={stepIndex === 1 && !trimmedName ? "#B9B9AE" : "#728A7A"}
        color="white"
        alignItems="center"
        justifyContent="center"
        gap="6px"
        cursor={stepIndex === 1 && !trimmedName ? "not-allowed" : "pointer"}
        boxShadow="0 9px 20px rgba(69,87,70,0.18)"
        aria-disabled={stepIndex === 1 && !trimmedName}
        onClick={continueFlow}
      >
        <Text color="white" fontSize="16px" fontWeight="900">
          {stepIndex === 0 ? "開始" : stepIndex === 1 ? "下一步" : "完成，前往地圖"}
        </Text>
        <IoChevronForward size={19} />
      </Flex>
    </Flex>
  );
}

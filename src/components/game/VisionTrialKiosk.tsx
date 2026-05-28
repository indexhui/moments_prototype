"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";
import { StartGameButton } from "@/components/game/StartGameButton";
import {
  VISION_FEEDBACK_QR_SRC,
  VISION_RECRUIT_QR_SRC,
  VisionLogoMark,
  VisionQrPanel,
} from "@/components/game/VisionQrPanel";
import { setStoredTrialProfile, withTrialProfileSearch } from "@/lib/game/demoBuild";
import { resetPlayerProgress } from "@/lib/game/playerProgress";
import { prepareVisionNaotaroOffworkProgress } from "@/lib/game/visionTrialProgress";
import { ROUTES } from "@/lib/routes";

const VISION_SCENE_SHORTCUTS = [
  { label: "開場", path: ROUTES.gameRoot },
  { label: "安排路線", path: ROUTES.gameArrangeRoute },
  { label: "放視大賞小劇場", path: `${ROUTES.gameArrangeRoute}?event=street-vision-expo-promo` },
  { label: "收集後回家", path: ROUTES.gameScene("scene-offwork") },
  { label: "夜間日記", path: `${ROUTES.gameScene("scene-night-hub")}?diary=1` },
];

export function VisionTrialKiosk() {
  const [selectedShortcut, setSelectedShortcut] = useState("");

  const navigateVision = (path: string) => {
    setStoredTrialProfile("vision");
    window.location.assign(withTrialProfileSearch(path, "vision"));
  };

  const handleShortcutChange = (nextPath: string) => {
    setSelectedShortcut(nextPath);
    if (!nextPath) return;
    navigateVision(nextPath);
  };

  const handleNaotaroOffwork = () => {
    setStoredTrialProfile("vision");
    prepareVisionNaotaroOffworkProgress();
    window.location.assign(withTrialProfileSearch(ROUTES.gameScene("scene-offwork"), "vision"));
  };

  const handleReset = () => {
    setStoredTrialProfile("vision");
    resetPlayerProgress();
    window.location.assign(ROUTES.visionTrial);
  };

  return (
    <Flex minH="100dvh" bgColor="#EBF0E7" alignItems="center" justifyContent="center">
      <Flex
        w="100%"
        maxW="1800px"
        px={{ base: "0", lg: "16px", xl: "24px" }}
        py={{ base: "0", lg: "16px", xl: "24px" }}
        gap={{ base: "0", lg: "20px", xl: "24px" }}
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="260px"
          maxW="342px"
          h="800px"
          bgColor="#DDE8DD"
          borderRadius="14px"
          p="36px 26px 24px"
          alignItems="flex-start"
          overflow="hidden"
        >
          <VisionQrPanel
            title="試玩回饋"
            imageSrc={VISION_FEEDBACK_QR_SRC}
            alt="放視大賞試玩回饋 QR code"
            footer={
              <Flex
                as="button"
                w="100%"
                h="38px"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="12px"
                fontWeight="800"
                bgColor="#7F5A5A"
                border="0"
                borderRadius="10px"
                cursor="pointer"
                onClick={handleReset}
              >
                重新開始
              </Flex>
            }
          >
            <Flex direction="column" gap="18px" mt="10px">
              <select
                value={selectedShortcut}
                onChange={(event) =>
                  handleShortcutChange(event.currentTarget.value)
                }
                style={{
                  height: "44px",
                  width: "100%",
                  backgroundColor: "rgba(255,255,255,0.46)",
                  border: 0,
                  borderRadius: "10px",
                  color: "#5D7165",
                  fontSize: "13px",
                  fontWeight: 800,
                  padding: "0 12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">scene 選擇</option>
                {VISION_SCENE_SHORTCUTS.map((shortcut) => (
                  <option key={shortcut.path} value={shortcut.path}>
                    {shortcut.label}
                  </option>
                ))}
              </select>
              <Flex
                as="button"
                h="44px"
                w="100%"
                bgColor="#4F765D"
                color="white"
                border="0"
                borderRadius="10px"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="13px"
                fontWeight="900"
                onClick={handleNaotaroOffwork}
              >
                收集到直太郎回到家
              </Flex>
            </Flex>
          </VisionQrPanel>
        </Flex>

        <Flex w={{ base: "100vw", lg: "370px" }} justifyContent="center">
          <Flex
            w={{ base: "100vw", sm: "370px" }}
            maxW="393px"
            h={{ base: "100dvh", sm: "800px" }}
            maxH="852px"
            bgColor="#D6D4B9"
            position="relative"
            borderRadius={{ base: "0", sm: "18px" }}
            overflow="hidden"
            boxShadow={{ base: "none", sm: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
            backgroundImage="url('/images/title_screen.jpg')"
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
          >
            <Box
              position="absolute"
              inset="0"
              bgGradient="linear(to-b, rgba(27,43,34,0.28), rgba(27,43,34,0) 43%, rgba(27,43,34,0.36))"
              pointerEvents="none"
            />
            <Flex
              position="absolute"
              left="24px"
              right="24px"
              top="50px"
              direction="column"
              gap="8px"
            >
              <Text color="white" fontSize="13px" fontWeight="900" textShadow="0 2px 10px rgba(0,0,0,0.32)">
                放視大賞特別版
              </Text>
              <Text color="white" fontSize="34px" fontWeight="900" lineHeight="1" textShadow="0 3px 16px rgba(0,0,0,0.36)">
                走走小日
              </Text>
              <Text maxW="270px" color="rgba(255,255,255,0.92)" fontSize="13px" fontWeight="700" lineHeight="1.55" textShadow="0 2px 10px rgba(0,0,0,0.36)">
                展場限定入口，跟著小麥出門，收集路上的小日獸與小小靈感。
              </Text>
            </Flex>
            <StartGameButton
              label="開始體驗"
              loadingLabel="正在準備展場版本..."
              targetRoute={`${ROUTES.gameRoot}?trial=vision`}
              trialProfile="vision"
            />
          </Flex>
        </Flex>

        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="260px"
          maxW="342px"
          h="800px"
          bgColor="#DDE8DD"
          borderRadius="14px"
          p="36px 26px 24px"
          alignItems="flex-start"
          overflow="hidden"
        >
          <VisionQrPanel
            title="早期玩家募集"
            imageSrc={VISION_RECRUIT_QR_SRC}
            alt="早起玩家招募 QR code"
            header={<VisionLogoMark />}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

import type { Metadata } from "next";
import { Box, Flex, Text } from "@chakra-ui/react";
import { StartGameButton } from "@/components/game/StartGameButton";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Moment | GameWork 試玩入口",
  description: "給 GameWork 評審體驗的 Moment 試玩入口。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GameWorksTrialPage() {
  return (
    <Flex
      minH="100dvh"
      bgColor="#F2F1E7"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        w="100%"
        maxW="1800px"
        px={{ base: "0", xl: "32px" }}
        py={{ base: "0", xl: "24px" }}
        gap={{ base: "0", xl: "24px" }}
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          display={{ base: "none", xl: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#E7E2C9"
          borderRadius="16px"
          p="20px"
          direction="column"
          justifyContent="space-between"
        >
          <Text color="#3D3A32" fontSize="26px" fontWeight="900" lineHeight="1.15">
            走走小日
          </Text>

        </Flex>

        <Flex w={{ base: "100vw", xl: "393px" }} justifyContent="center">
          <Flex
            w={{ base: "100vw", sm: "393px" }}
            maxW="393px"
            h={{ base: "100dvh", sm: "852px" }}
            maxH="852px"
            bgColor="#D6D4B9"
            position="relative"
            borderRadius={{ base: "0", sm: "20px" }}
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
              bgGradient="linear(to-b, rgba(37,34,28,0.34), rgba(37,34,28,0) 44%, rgba(37,34,28,0.52))"
              pointerEvents="none"
            />
            <Flex
              position="absolute"
              left="24px"
              right="24px"
              top="54px"
              direction="column"
              gap="8px"
            >
              <Text color="white" fontSize="13px" fontWeight="800" textShadow="0 2px 10px rgba(0,0,0,0.32)">
                GameWork 試玩版
              </Text>
              <Text color="white" fontSize="34px" fontWeight="900" lineHeight="1" textShadow="0 3px 16px rgba(0,0,0,0.36)">
                Moment
              </Text>
            </Flex>
            <StartGameButton
              label="開始試玩"
              loadingLabel="正在準備試玩..."
              targetRoute={`${ROUTES.gameRoot}?trial=gameworks`}
              trialProfile="gameworks"
            />
          </Flex>
        </Flex>

        <Flex
          display={{ base: "none", xl: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#E7E2C9"
          borderRadius="16px"
          p="20px"
          direction="column"
          justifyContent="space-between"
        >
          <Flex direction="column" gap="14px">
            <Text color="#5F5B49" fontSize="18px" fontWeight="900">
              本次可玩內容
            </Text>
            <Flex direction="column" gap="10px">
              {[
                "第一章開場與角色互動",
                "安排通勤路線的拼圖流程",
                "捷運、街道、便利商店事件",
                "拍照、日記與小日獸收集",
              ].map((label) => (
                <Flex
                  key={label}
                  borderRadius="10px"
                  bgColor="rgba(255,255,255,0.38)"
                  px="12px"
                  py="10px"
                >
                  <Text color="#6E6A58" fontSize="13px" fontWeight="700" lineHeight="1.45">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
          <Text color="#7A7462" fontSize="12px" lineHeight="1.7">
            點擊開始後，遊戲內左右欄會切換成試玩資訊，不顯示內部測試工具。
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

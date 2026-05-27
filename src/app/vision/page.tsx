import type { Metadata } from "next";
import { Box, Flex, Text } from "@chakra-ui/react";
import { StartGameButton } from "@/components/game/StartGameButton";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "走走小日 | 放視大賞特別入口",
  description: "給放視大賞現場體驗的走走小日特別版本。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VisionTrialPage() {
  return (
    <Flex
      minH="100dvh"
      bgColor="#EBF0E7"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        w="100%"
        maxW="1800px"
        px={{ base: "0", lg: "16px", xl: "32px" }}
        py={{ base: "0", lg: "16px", xl: "24px" }}
        gap={{ base: "0", lg: "12px", xl: "24px" }}
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#DDE8DD"
          borderRadius="16px"
          p="20px"
          direction="column"
          justifyContent="space-between"
          overflow="hidden"
        >
          <Flex direction="column" gap="18px">
            <Flex direction="column" gap="8px">
              <Text color="#547060" fontSize="13px" fontWeight="900">
                放視大賞特別版
              </Text>
              <Text color="#283C32" fontSize="30px" fontWeight="900" lineHeight="1.08">
                在高雄，一起找找小日獸
              </Text>
              <Text color="#5D7165" fontSize="13px" lineHeight="1.75">
                這個入口會把遊戲切換成放視大賞現場版本，保留完整通勤流程，也放入本次展會專屬的宣傳小劇場。
              </Text>
            </Flex>
            <Flex
              h="260px"
              borderRadius="14px"
              overflow="hidden"
              position="relative"
              backgroundImage="url('/images/promo/comic_content_vision_01.png')"
              backgroundSize="cover"
              backgroundPosition="center"
              boxShadow="0 14px 28px rgba(58, 75, 61, 0.18)"
            >
              <Box
                position="absolute"
                inset="0"
                bgGradient="linear(to-b, rgba(21,34,27,0.08), rgba(21,34,27,0.52))"
              />
              <Text
                position="absolute"
                left="14px"
                right="14px"
                bottom="14px"
                color="white"
                fontSize="13px"
                fontWeight="800"
                lineHeight="1.45"
                textShadow="0 2px 8px rgba(0,0,0,0.35)"
              >
                小麥和小貝狗也準備到獨立遊戲展區和玩家碰面。
              </Text>
            </Flex>
          </Flex>
          <Text color="#6B7A6D" fontSize="12px" lineHeight="1.7">
            建議現場從這個入口開始，避免留下開發金手指或內部測試欄位。
          </Text>
        </Flex>

        <Flex w={{ base: "100vw", lg: "393px" }} justifyContent="center">
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
              bgGradient="linear(to-b, rgba(27,43,34,0.38), rgba(27,43,34,0) 43%, rgba(27,43,34,0.58))"
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
              <Text color="white" fontSize="13px" fontWeight="900" textShadow="0 2px 10px rgba(0,0,0,0.32)">
                放視大賞特別版
              </Text>
              <Text color="white" fontSize="34px" fontWeight="900" lineHeight="1" textShadow="0 3px 16px rgba(0,0,0,0.36)">
                走走小日
              </Text>
              <Text maxW="260px" color="rgba(255,255,255,0.9)" fontSize="13px" fontWeight="700" lineHeight="1.55" textShadow="0 2px 10px rgba(0,0,0,0.36)">
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
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#DDE8DD"
          borderRadius="16px"
          p="20px"
          direction="column"
          justifyContent="space-between"
          overflow="hidden"
        >
          <Flex direction="column" gap="16px">
            <Text color="#547060" fontSize="18px" fontWeight="900">
              現場可玩內容
            </Text>
            <Flex direction="column" gap="10px">
              {[
                "第一章開場與角色互動",
                "安排通勤路線的拼圖流程",
                "街道上的放視大賞宣傳小劇場",
                "拍照、日記與小日獸收集",
              ].map((label) => (
                <Flex
                  key={label}
                  borderRadius="10px"
                  bgColor="rgba(255,255,255,0.46)"
                  px="12px"
                  py="10px"
                >
                  <Text color="#5D7165" fontSize="13px" fontWeight="800" lineHeight="1.45">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
            <Flex
              h="300px"
              borderRadius="14px"
              overflow="hidden"
              position="relative"
              backgroundImage="url('/images/promo/comic_content_vision_02.png')"
              backgroundSize="cover"
              backgroundPosition="center"
              boxShadow="0 14px 28px rgba(58, 75, 61, 0.18)"
            >
              <Box
                position="absolute"
                inset="0"
                bgGradient="linear(to-b, rgba(21,34,27,0.02), rgba(21,34,27,0.46))"
              />
            </Flex>
          </Flex>
          <Text color="#6B7A6D" fontSize="12px" lineHeight="1.7">
            進入後側欄會自動切成放視大賞資訊，不顯示內部測試工具。
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

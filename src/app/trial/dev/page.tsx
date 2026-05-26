import type { Metadata } from "next";
import { Box, Flex, Text } from "@chakra-ui/react";
import { StartGameButton } from "@/components/game/StartGameButton";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "走走小日 | 開發測試入口",
  description: "給團隊測試用的開發版入口。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevTrialPage() {
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
        alignItems="center"
        justifyContent="center"
      >
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
                開發測試版
              </Text>
              <Text color="white" fontSize="34px" fontWeight="900" lineHeight="1" textShadow="0 3px 16px rgba(0,0,0,0.36)">
                走走小日
              </Text>
            </Flex>
            <StartGameButton
              label="開始測試"
              loadingLabel="正在準備測試..."
              targetRoute={`${ROUTES.gameRoot}?trial=dev`}
              trialProfile="dev"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

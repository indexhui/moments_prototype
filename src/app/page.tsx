import { Flex, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { ROUTES } from "@/lib/routes";

export default function Home() {
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
          bgColor="#E4E2C8"
          borderRadius="16px"
          p="20px"
          alignItems="flex-start"
        >
          <Text color="#5F5B49">左側資訊區（遊戲進度、任務等）</Text>
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
            <NextLink href={ROUTES.gameArrangeRoute}>
              <Flex
                position="absolute"
                bottom="100px"
                left="0"
                right="0"
                bgColor="white"
                h="80px"
                w="100%"
                color="black"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
              >
                開始遊戲
              </Flex>
            </NextLink>
          </Flex>
        </Flex>

        <Flex
          display={{ base: "none", xl: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#E4E2C8"
          borderRadius="16px"
          p="20px"
          alignItems="flex-start"
        >
          <Text color="#5F5B49">右側資訊區（背包、狀態、紀錄等）</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

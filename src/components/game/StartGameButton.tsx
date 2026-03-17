"use client";

import { useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { preloadGameImages } from "@/lib/game/preloadAssets";

export function StartGameButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState<string>("");

  const handleStart = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setProgressText("載入中 0%");
    router.prefetch(ROUTES.gameRoot);

    try {
      await preloadGameImages(({ loaded, total, failed }) => {
        const percent = total <= 0 ? 100 : Math.round((loaded / total) * 100);
        setProgressText(`載入中 ${percent}%（${loaded}/${total}${failed > 0 ? `，失敗 ${failed}` : ""}）`);
      });
    } finally {
      router.push(ROUTES.gameRoot);
    }
  };

  return (
    <Flex
      as="button"
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
      cursor={isLoading ? "default" : "pointer"}
      onClick={handleStart}
      opacity={isLoading ? 0.94 : 1}
      direction="column"
      gap="2px"
      pointerEvents={isLoading ? "none" : "auto"}
    >
      <Text fontSize="24px" fontWeight="700">
        {isLoading ? "正在載入資源..." : "開始遊戲"}
      </Text>
      {isLoading ? (
        <Text fontSize="12px" color="#4C4C4C">
          {progressText}
        </Text>
      ) : null}
    </Flex>
  );
}

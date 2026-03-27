"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Flex, Text } from "@chakra-ui/react";
import { ROUTES } from "@/lib/routes";
import { loadPlayerProgress, type PlayerProgress } from "@/lib/game/playerProgress";

type SunbeastCard = {
  id: string;
  name: string;
  title: string;
  imagePath: string;
  location: string;
  condition: string;
  ability: string;
  unlocked: boolean;
};

function buildSunbeastCards(progress: PlayerProgress): SunbeastCard[] {
  const hasNaotaro = progress.stickerCollection.some((stickerId) => stickerId.startsWith("naotaro-"));
  const hasFrog = progress.hasTriggeredStreetForgotLunchEvent;
  const hasGoat = progress.hasTriggeredMetroSunbeastGoatEvent;

  return [
    {
      id: "naotaro",
      name: "直太郎",
      title: "黃金獵犬系小日獸",
      imagePath: "/images/animals/naotaro.jpg",
      location: "捷運站車廂",
      condition: "首次安排路線進捷運事件，完成拍照並進入日記流程",
      ability: "挖格：上下兩格可銜接時，補出中間可通格（每次安排限一次，消耗 1 行動力）",
      unlocked: hasNaotaro,
    },
    {
      id: "frog",
      name: "青蛙",
      title: "便利商店小日獸",
      imagePath: "/images/CH/mart_frog.jpg",
      location: "便利商店",
      condition: "第二次經過街道觸發忘記便當事件，於便利商店完成拍照",
      ability: "左右銜接：左右兩格可銜接時，補出中間可通格（每次安排限一次，消耗 1 行動力）",
      unlocked: hasFrog,
    },
    {
      id: "goat",
      name: "山羊",
      title: "捷運尖峰小日獸",
      imagePath: "/images/outside/mrt_escalator_entrance.jpg",
      location: "捷運站電扶梯入口",
      condition: "符合其一：疲勞值 ≥ 60 / 前一天有加班 / 前一天或當天有負面事件",
      ability: "能力尚未開放（規劃中）",
      unlocked: hasGoat,
    },
  ];
}

export function SunbeastWikiPageClient() {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    const syncProgress = () => setProgress(loadPlayerProgress());
    syncProgress();
    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  const cards = useMemo(() => (progress ? buildSunbeastCards(progress) : []), [progress]);
  const unlockedCount = cards.filter((card) => card.unlocked).length;

  return (
    <Flex minH="100dvh" bgColor="#F2F1E7" alignItems="center" justifyContent="center" p={{ base: "0", md: "20px" }}>
      <Flex
        w="100%"
        maxW="980px"
        h={{ base: "100dvh", md: "88dvh" }}
        bgColor="#ECE6D7"
        borderRadius={{ base: "0", md: "18px" }}
        border={{ base: "none", md: "1px solid rgba(120,98,76,0.22)" }}
        overflow="hidden"
        direction="column"
      >
        <Flex
          h="64px"
          px="18px"
          bgColor="#9D7859"
          alignItems="center"
          justifyContent="space-between"
          borderBottom="1px solid rgba(255,255,255,0.2)"
          flexShrink={0}
        >
          <Text color="#FFF7ED" fontSize="20px" fontWeight="700">
            小日獸 Wiki
          </Text>
          <Flex alignItems="center" gap="8px">
            <Flex
              as="button"
              h="34px"
              px="12px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.18)"
              color="white"
              fontSize="12px"
              fontWeight="700"
              onClick={() => setProgress(loadPlayerProgress())}
            >
              重新整理
            </Flex>
            <NextLink href={ROUTES.gameRoot}>
              <Flex
                h="34px"
                px="12px"
                borderRadius="999px"
                bgColor="rgba(255,255,255,0.24)"
                color="white"
                fontSize="12px"
                fontWeight="700"
                alignItems="center"
              >
                回遊戲
              </Flex>
            </NextLink>
          </Flex>
        </Flex>

        <Flex p="16px" gap="10px" wrap="wrap" borderBottom="1px solid rgba(130,108,84,0.2)" flexShrink={0}>
          <Flex px="12px" py="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.72)">
            <Text color="#5F4C3B" fontSize="12px" fontWeight="700">
              已解鎖：{progress ? unlockedCount : 0}/{cards.length || 3}
            </Text>
          </Flex>
          <Flex px="12px" py="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.72)">
            <Text color="#5F4C3B" fontSize="12px" fontWeight="700">
              貼紙數：{progress?.stickerCollection.length ?? 0}
            </Text>
          </Flex>
        </Flex>

        <Flex flex="1" minH="0" overflowY="auto" p="16px" direction="column" gap="12px">
          {progress ? (
            cards.map((card) => (
              <Flex
                key={card.id}
                borderRadius="12px"
                border="1px solid rgba(126,105,82,0.28)"
                bgColor={card.unlocked ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.46)"}
                overflow="hidden"
                boxShadow={card.unlocked ? "0 6px 14px rgba(80,60,40,0.08)" : "none"}
              >
                <Flex
                  w={{ base: "120px", md: "180px" }}
                  minW={{ base: "120px", md: "180px" }}
                  bgImage={`url('${card.imagePath}')`}
                  bgSize="cover"
                  backgroundPosition="center"
                  position="relative"
                >
                  {!card.unlocked ? (
                    <Flex
                      position="absolute"
                      inset="0"
                      bgColor="rgba(34,28,24,0.42)"
                      backdropFilter="blur(1.5px)"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="#FFF6EB" fontSize="13px" fontWeight="700">
                        未解鎖
                      </Text>
                    </Flex>
                  ) : null}
                </Flex>

                <Flex direction="column" flex="1" p="12px" gap="6px">
                  <Flex alignItems="center" justifyContent="space-between" gap="8px">
                    <Text color="#4E4235" fontSize="18px" fontWeight="800" lineHeight="1.2">
                      {card.name}
                    </Text>
                    <Flex
                      px="10px"
                      h="24px"
                      borderRadius="999px"
                      alignItems="center"
                      bgColor={card.unlocked ? "rgba(96,143,94,0.2)" : "rgba(157,149,138,0.24)"}
                    >
                      <Text color={card.unlocked ? "#487346" : "#7F756B"} fontSize="11px" fontWeight="700">
                        {card.unlocked ? "已遇到" : "未遇到"}
                      </Text>
                    </Flex>
                  </Flex>
                  <Text color="#6A5A49" fontSize="12px" lineHeight="1.35">
                    {card.title}
                  </Text>
                  <Text color="#5A4A39" fontSize="12px" lineHeight="1.45">
                    地點：{card.location}
                  </Text>
                  <Text color="#5A4A39" fontSize="12px" lineHeight="1.45">
                    條件：{card.condition}
                  </Text>
                  <Text color="#5A4A39" fontSize="12px" lineHeight="1.45">
                    能力：{card.ability}
                  </Text>
                </Flex>
              </Flex>
            ))
          ) : (
            <Flex h="100%" alignItems="center" justifyContent="center">
              <Text color="#6A5A49" fontSize="14px">
                載入中...
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

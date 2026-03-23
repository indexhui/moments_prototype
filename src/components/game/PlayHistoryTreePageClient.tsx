"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ROUTES } from "@/lib/routes";
import { loadPlayerProgress, type PlayerProgress } from "@/lib/game/playerProgress";

type TreeNodeStatus = "done" | "active" | "locked";
type TreeNodeItem = {
  id: string;
  title: string;
  subtitle?: string;
  status: TreeNodeStatus;
  children?: TreeNodeItem[];
};

function statusColor(status: TreeNodeStatus) {
  if (status === "done") return "#5E8A5D";
  if (status === "active") return "#AF7F55";
  return "#9D958A";
}

function buildTimelineNodes(progress: PlayerProgress): TreeNodeItem[] {
  const arrangeCount = progress.offworkRewardClaimCount;
  const hasPhoto = Boolean(progress.lastDogPhotoCapture);
  const hasDiaryEntry = progress.unlockedDiaryEntryIds.includes("bai-entry-1");
  const hasGuidedDiaryFlow = progress.hasSeenDiaryFirstReveal;
  const hasSticker = progress.stickerCollection.length > 0;
  const enteredDay2 = arrangeCount >= 1 && hasGuidedDiaryFlow;

  return [
    {
      id: "start",
      title: "序章開始",
      subtitle: "起床到首次通勤準備",
      status: "done",
    },
    {
      id: "route-first",
      title: "第一次安排路線",
      subtitle: arrangeCount > 0 ? `已安排 ${arrangeCount} 次` : "尚未完成",
      status: arrangeCount > 0 ? "done" : "locked",
      children:
        arrangeCount > 0
          ? Array.from({ length: arrangeCount }).map((_, index) => ({
              id: `route-attempt-${index + 1}`,
              title: `第 ${index + 1} 次安排路線`,
              status: "done" as const,
            }))
          : undefined,
    },
    {
      id: "photo-dog",
      title: "拍攝第一隻小日獸（黃金獵犬）",
      subtitle: hasPhoto
        ? `拍攝精準度 ${progress.lastDogPhotoCapture?.dogCoveragePercent ?? progress.lastPhotoScore ?? 0}%`
        : "尚未拍攝",
      status: hasPhoto ? "done" : arrangeCount > 0 ? "active" : "locked",
    },
    {
      id: "diary-unlock",
      title: "交換日記首篇解鎖",
      subtitle: hasDiaryEntry ? "已解鎖：小白日記 01" : "尚未解鎖",
      status: hasDiaryEntry ? "done" : hasPhoto ? "active" : "locked",
    },
    {
      id: "guided-flow",
      title: "首次引導流程（日記 + 小日獸）",
      subtitle: hasGuidedDiaryFlow ? "已完成引導" : "尚未完成引導",
      status: hasGuidedDiaryFlow ? "done" : hasDiaryEntry ? "active" : "locked",
    },
    {
      id: "night-hub",
      title: "Night Hub（夜間行動）",
      subtitle: enteredDay2 ? "已進入夜間 Hub 流程" : "尚未進入",
      status: enteredDay2 ? "done" : hasGuidedDiaryFlow ? "active" : "locked",
      children: [
        {
          id: "hub-bai",
          title: "去小白房間看看",
          subtitle: "夜間互動分支",
          status: hasGuidedDiaryFlow ? "active" : "locked",
        },
        {
          id: "hub-beigo",
          title: "跟小貝狗聊天",
          subtitle: "夜間互動分支",
          status: hasGuidedDiaryFlow ? "active" : "locked",
        },
      ],
    },
    {
      id: "day2",
      title: "進入第二天",
      subtitle: enteredDay2 ? "已觸發隔天早晨" : "未觸發",
      status: enteredDay2 ? "done" : "locked",
    },
    {
      id: "collection",
      title: "收藏進度",
      subtitle: `貼紙 ${progress.stickerCollection.length} / 物品 ${progress.inventoryItems.length}`,
      status: hasSticker ? "done" : hasGuidedDiaryFlow ? "active" : "locked",
      children: [
        {
          id: "stickers",
          title: `小日獸貼紙：${progress.stickerCollection.length} 張`,
          status: progress.stickerCollection.length > 0 ? "done" : "locked",
        },
        {
          id: "items",
          title: `道具：${progress.inventoryItems.length} 個`,
          status: progress.inventoryItems.length > 0 ? "done" : "locked",
        },
        {
          id: "tiles",
          title: `拼圖：${progress.rewardPlaceTiles.length} 片`,
          status: progress.rewardPlaceTiles.length > 0 ? "done" : "locked",
        },
      ],
    },
  ];
}

function TreeNodeCard({
  node,
  isLast,
  depth = 0,
}: {
  node: TreeNodeItem;
  isLast: boolean;
  depth?: number;
}) {
  return (
    <Flex direction="column" position="relative" pl={depth > 0 ? "20px" : "0"}>
      {depth > 0 ? (
        <Box
          position="absolute"
          left="7px"
          top="-8px"
          bottom={isLast ? "26px" : "-8px"}
          borderLeft="1px solid rgba(132,112,90,0.45)"
        />
      ) : null}
      <Flex align="flex-start" gap="10px" position="relative">
        <Box
          mt="8px"
          w="14px"
          h="14px"
          borderRadius="999px"
          bgColor={statusColor(node.status)}
          border="2px solid rgba(255,255,255,0.8)"
          boxShadow="0 0 0 1px rgba(95,75,56,0.3)"
          flexShrink={0}
        />
        <Flex
          direction="column"
          gap="3px"
          px="12px"
          py="10px"
          borderRadius="10px"
          bgColor={
            node.status === "done"
              ? "rgba(108,142,94,0.16)"
              : node.status === "active"
                ? "rgba(157,120,89,0.18)"
                : "rgba(255,255,255,0.55)"
          }
          border="1px solid rgba(126,105,82,0.26)"
          flex="1"
        >
          <Text color="#4E4235" fontSize="14px" fontWeight="700" lineHeight="1.35">
            {node.title}
          </Text>
          {node.subtitle ? (
            <Text color="#6A5A49" fontSize="12px" lineHeight="1.4">
              {node.subtitle}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      {node.children && node.children.length > 0 ? (
        <Flex direction="column" gap="8px" mt="8px">
          {node.children.map((child, index) => (
            <TreeNodeCard key={child.id} node={child} isLast={index === node.children!.length - 1} depth={depth + 1} />
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
}

export function PlayHistoryTreePageClient() {
  const [progress, setProgress] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    const syncProgress = () => {
      setProgress(loadPlayerProgress());
    };
    syncProgress();
    window.addEventListener("storage", syncProgress);
    return () => {
      window.removeEventListener("storage", syncProgress);
    };
  }, []);

  const timelineNodes = useMemo(
    () => (progress ? buildTimelineNodes(progress) : []),
    [progress],
  );

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
            遊玩歷程樹
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
              >
                回遊戲
              </Flex>
            </NextLink>
          </Flex>
        </Flex>

        <Flex p="16px" gap="10px" wrap="wrap" borderBottom="1px solid rgba(130,108,84,0.2)" flexShrink={0}>
          <Flex px="12px" py="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.72)">
            <Text color="#5F4C3B" fontSize="12px" fontWeight="700">
              路線安排：{progress?.offworkRewardClaimCount ?? 0} 次
            </Text>
          </Flex>
          <Flex px="12px" py="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.72)">
            <Text color="#5F4C3B" fontSize="12px" fontWeight="700">
              上班次數：{progress?.workShiftCount ?? 0}
            </Text>
          </Flex>
          <Flex px="12px" py="6px" borderRadius="999px" bgColor="rgba(255,255,255,0.72)">
            <Text color="#5F4C3B" fontSize="12px" fontWeight="700">
              貼紙收藏：{progress?.stickerCollection.length ?? 0}
            </Text>
          </Flex>
        </Flex>

        <Flex flex="1" minH="0" overflowY="auto" p="16px" direction="column" gap="10px">
          {progress ? (
            timelineNodes.map((node, index) => (
              <TreeNodeCard key={node.id} node={node} isLast={index === timelineNodes.length - 1} />
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


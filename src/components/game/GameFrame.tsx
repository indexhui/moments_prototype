"use client";

import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { SCENE_ORDER, type GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import { useEffect, useState } from "react";
import type { GameEventId } from "@/lib/game/events";
import { GAME_EVENT_CHEAT_TRIGGER } from "@/lib/game/eventCheatBus";
import { GAME_WORK_CHEAT_TRIGGER } from "@/lib/game/workCheatBus";
import {
  AVATAR_EXPRESSION_LIST,
  AVATAR_MOTION_LIST,
  type AvatarMotionId,
} from "@/lib/game/avatarPerformance";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
} from "@/lib/game/avatarCheatBus";
import { INITIAL_PLAYER_STATUS, type PlayerStatus } from "@/lib/game/playerStatus";
import type { RewardPlaceTile } from "@/lib/game/playerProgress";
import { GAME_EMOTION_CUE_TRIGGER, type EmotionCueId } from "@/lib/game/emotionCueBus";
import {
  GAME_BACKGROUND_SHAKE_TRIGGER,
  type BackgroundShakeId,
} from "@/lib/game/backgroundShakeBus";
import {
  getCurrentFlowStage,
  getUnifiedExpansionTracks,
  type UnifiedExpansionItem,
} from "@/lib/game/gameFlow";
import type { InventoryItemId } from "@/lib/game/playerProgress";

function ExpansionItemCard({ item }: { item: UnifiedExpansionItem }) {
  const triggered = item.triggered;
  const statusLabel =
    item.type === "milestone"
      ? item.status === "completed"
        ? "已完成"
        : item.status === "current"
          ? "進行中"
          : "未開始"
      : item.status === "triggered"
        ? "已觸發"
        : "未觸發";
  const bgColor =
    item.type === "milestone"
      ? item.status === "current"
        ? "rgba(157,120,89,0.2)"
        : item.status === "completed"
          ? "rgba(108,142,94,0.18)"
          : "rgba(255,255,255,0.32)"
      : triggered
        ? "rgba(108,142,94,0.18)"
        : "rgba(255,255,255,0.32)";

  return (
    <Flex
      direction="column"
      gap="2px"
      borderRadius="8px"
      px="8px"
      py="6px"
      bgColor={bgColor}
    >
      <Flex align="center" justify="space-between" gap="8px">
        <Text color="#5A5648" fontSize="13px" fontWeight="700">
          {item.title}
        </Text>
        <Text
          color={triggered ? "#4E7A52" : item.type === "milestone" && item.status === "current" ? "#9D7859" : "#7C7666"}
          fontSize="11px"
          fontWeight="700"
        >
          {statusLabel}
        </Text>
      </Flex>
      {item.type === "milestone" ? (
        <Text color="#6E6A58" fontSize="12px">
          獎勵：{item.rewards}
        </Text>
      ) : (
        <>
          <Text color="#6E6A58" fontSize="12px">
            條件：{item.condition}
          </Text>
          <Text color="#6E6A58" fontSize="12px">
            變化：{item.effect}
          </Text>
        </>
      )}
    </Flex>
  );
}

const EVENT_CHEAT_SHORTCUTS: Array<{ id: GameEventId; title: string }> = [
  { id: "metro-seat-choice", title: "捷運：座位抉擇" },
  { id: "breakfast-shop-choice", title: "早餐店：外帶/內用" },
  { id: "street-cookie-sale", title: "街道：手工餅乾" },
  { id: "street-cat-treat", title: "街道：貓肉泥" },
  { id: "park-hub", title: "公園：休息/探索" },
  { id: "park-cat-grass", title: "公園：貓草" },
  { id: "park-gossip", title: "公園：打聽消息" },
];

export function GameFrame({
  children,
  scene,
  playerStatus,
  onResetProgress,
  rewardPlaceTiles,
  inventoryItems,
  workShiftCount,
  arrangeRouteAttempt,
  isOffworkRewardModal,
  hasPassedThroughStreet,
}: {
  children: React.ReactNode;
  scene: GameScene;
  playerStatus?: PlayerStatus;
  onResetProgress?: () => void;
  rewardPlaceTiles?: RewardPlaceTile[];
  inventoryItems?: InventoryItemId[];
  workShiftCount?: number;
  arrangeRouteAttempt?: number;
  /** 是否曾在安排路線中出發且路線經過街道（解鎖第 3 次拼圖池） */
  hasPassedThroughStreet?: boolean;
  /** 是否正在顯示下班獎勵選擇 modal（用於流程階段顯示） */
  isOffworkRewardModal?: boolean;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isBackgroundFxOpen, setIsBackgroundFxOpen] = useState(false);
  const [expansionTab, setExpansionTab] = useState<"all" | "triggered" | "waiting">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: "100dvh", backgroundColor: "#F2F1E7" }} />;
  }

  const triggerEventCheat = (eventId: string) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EVENT_CHEAT_TRIGGER, { detail: { eventId } }),
    );
  };
  const triggerWorkCheat = () => {
    window.dispatchEvent(new CustomEvent(GAME_WORK_CHEAT_TRIGGER));
  };
  const triggerAvatarMotion = (motionId: AvatarMotionId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, { detail: { motionId } }),
    );
  };
  const triggerAvatarExpression = (frameIndex: number) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, { detail: { frameIndex } }),
    );
  };
  const triggerEmotionCue = (cueId: EmotionCueId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EMOTION_CUE_TRIGGER, { detail: { cueId } }),
    );
  };
  const triggerBackgroundShake = (shakeId: BackgroundShakeId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_BACKGROUND_SHAKE_TRIGGER, { detail: { shakeId } }),
    );
  };

  const sceneIndex = SCENE_ORDER.indexOf(scene.id as (typeof SCENE_ORDER)[number]);
  const currentStep = sceneIndex >= 0 ? sceneIndex + 1 : 1;
  const progressPercent = Math.round((currentStep / SCENE_ORDER.length) * 100);
  const currentStatus = playerStatus ?? INITIAL_PLAYER_STATUS;
  const totalRewardTiles = rewardPlaceTiles?.length ?? 0;
  const routeRewardTiles = rewardPlaceTiles?.filter((tile) => tile.category === "route").length ?? 0;
  const placeRewardTiles = rewardPlaceTiles?.filter((tile) => tile.category === "place").length ?? 0;
  const inventoryItemList = inventoryItems ?? [];
  const totalWorkShifts = workShiftCount ?? 0;
  const passedStreet = hasPassedThroughStreet ?? false;
  const inventorySummary = Object.entries(
    inventoryItemList.reduce<Record<string, number>>((acc, itemId) => {
      acc[itemId] = (acc[itemId] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const currentFlowStageId = getCurrentFlowStage(
    pathname ?? "",
    scene.id,
    isOffworkRewardModal,
  );
  const attempt = typeof arrangeRouteAttempt === "number" ? arrangeRouteAttempt : 1;
  const allExpansionItems = getUnifiedExpansionTracks(attempt, passedStreet);
  const expansionItems =
    expansionTab === "all"
      ? allExpansionItems
      : expansionTab === "triggered"
        ? allExpansionItems.filter((x) => x.triggered)
        : allExpansionItems.filter((x) => !x.triggered);

  return (
    <Flex minH="100dvh" bgColor="#F2F1E7" alignItems="center" justifyContent="center">
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
          <Flex direction="column" w="100%" h="100%" justifyContent="space-between">
            <Flex direction="column" gap="14px" w="100%">
              <Flex align="baseline" justify="space-between" gap="8px" wrap="wrap">
                <Text color="#5F5B49" fontWeight="700" fontSize="18px">
                  進程與擴展
                </Text>
                <Text color="#6E6A58" fontSize="13px">
                  目前：第 {attempt} 次安排路線
                </Text>
              </Flex>
              <Flex gap="6px" mb="6px">
                {(["all", "triggered", "waiting"] as const).map((tab) => (
                  <Flex
                    key={tab}
                    flex="1"
                    h="28px"
                    borderRadius="6px"
                    bgColor={expansionTab === tab ? "rgba(157,120,89,0.35)" : "rgba(255,255,255,0.4)"}
                    align="center"
                    justify="center"
                    cursor="pointer"
                    onClick={() => setExpansionTab(tab)}
                  >
                    <Text
                      color={expansionTab === tab ? "#3D3A32" : "#6E6A58"}
                      fontSize="12px"
                      fontWeight={expansionTab === tab ? "700" : "500"}
                    >
                      {tab === "all" ? "全部" : tab === "triggered" ? "已觸發" : "未觸發"}
                    </Text>
                  </Flex>
                ))}
              </Flex>
              <Box
                h="250px"
                overflowY="auto"
                overflowX="hidden"
                borderRadius="8px"
                css={{ scrollbarWidth: "thin" }}
              >
                <Flex direction="column" gap="6px">
                  {expansionItems.map((item) => (
                    <ExpansionItemCard key={item.id} item={item} />
                  ))}
                </Flex>
              </Box>

              <Text color="#5F5B49" fontWeight="700" fontSize="18px" mt="4px">
                玩家進度
              </Text>
              <Flex direction="column" gap="4px" p="8px" borderRadius="8px" bgColor="rgba(255,255,255,0.32)">
                <Text color="#6E6A58" fontSize="13px">
                  場景：{scene.sceneLabel ?? "未命名"} · 角色：{scene.characterName} · {scene.id}
                </Text>
                <Text color="#6E6A58" fontSize="13px">
                  儲蓄：{currentStatus.savings} · 行動力：{currentStatus.actionPower} · 疲勞：{currentStatus.fatigue}
                </Text>
                <Text color="#6E6A58" fontSize="13px">
                  上班次數：{totalWorkShifts}
                </Text>
                <Text color="#6E6A58" fontSize="12px" mt="4px">
                  獎勵拼圖 總數：{totalRewardTiles}（路徑 {routeRewardTiles} / 地點 {placeRewardTiles}）
                </Text>
              </Flex>
              <Flex direction="column" gap="6px" mt="2px">
                <Text color="#6E6A58" fontSize="13px">
                  劇情：{currentStep}/{SCENE_ORDER.length} ({progressPercent}%)
                </Text>
                <Box h="6px" w="100%" bgColor="#D3CFB8" borderRadius="999px" overflow="hidden">
                  <Box h="100%" w={`${progressPercent}%`} bgColor="#9D7859" />
                </Box>
              </Flex>
              <Flex direction="column" gap="6px" mt="4px">
                <Text color="#5F5B49" fontWeight="700" fontSize="18px">
                  物品欄
                </Text>
                <Flex direction="column" gap="6px" p="8px" borderRadius="8px" bgColor="rgba(255,255,255,0.32)">
                  {inventorySummary.length === 0 ? (
                    <Text color="#6E6A58" fontSize="12px">
                      目前尚無道具
                    </Text>
                  ) : (
                    inventorySummary.map(([itemId, count]) => (
                      <Flex key={itemId} align="center" justify="space-between" gap="8px">
                        <Text color="#6E6A58" fontSize="13px">
                          {itemId === "cat-grass"
                            ? "🌿 貓草"
                            : itemId === "cat-treat"
                              ? "🐟 貓肉泥"
                              : itemId}
                        </Text>
                        <Text color="#5A5648" fontSize="12px" fontWeight="700">
                          x{count}
                        </Text>
                      </Flex>
                    ))
                  )}
                </Flex>
              </Flex>
            </Flex>
            <Flex gap="8px">
              <NextLink href={ROUTES.gameArrangeRoute}>
                <Flex
                  px="10px"
                  bgColor="#6C8E5E"
                  color="white"
                  h="38px"
                  borderRadius="10px"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="12px"
                  fontWeight="600"
                  whiteSpace="nowrap"
                >
                  金手指：安排路線
                </Flex>
              </NextLink>
              <NextLink href={ROUTES.gameRoot}>
                <Flex
                  px="10px"
                  bgColor="#9D7859"
                  color="white"
                  h="38px"
                  borderRadius="10px"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="12px"
                  fontWeight="600"
                  whiteSpace="nowrap"
                >
                  重新開始
                </Flex>
              </NextLink>
              <Flex
                px="10px"
                bgColor="#7F5A5A"
                color="white"
                h="38px"
                borderRadius="10px"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={onResetProgress}
                opacity={onResetProgress ? 1 : 0.55}
                pointerEvents={onResetProgress ? "auto" : "none"}
                fontSize="12px"
                fontWeight="600"
                whiteSpace="nowrap"
              >
                重置玩家資料
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex w={{ base: "100vw", xl: "393px" }} justifyContent="center">
          {children}
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
          <Flex direction="column" w="100%" gap="10px">
            <Text color="#5F5B49" fontWeight="700" fontSize="20px">
              事件金手指
            </Text>
            <Text color="#7A7462" fontSize="12px">
              以場景入口為主（公園可選休息/探索）
            </Text>
            <Flex
              h="30px"
              borderRadius="8px"
              bgColor="#6C8E5E"
              color="white"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={triggerWorkCheat}
            >
              金手指：直接上班
            </Flex>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
              {EVENT_CHEAT_SHORTCUTS.map((event) => (
                <Flex
                  key={event.id}
                  h="30px"
                  borderRadius="8px"
                  bgColor="#9D7859"
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="11px"
                  px="6px"
                  textAlign="center"
                  onClick={() => triggerEventCheat(event.id)}
                >
                  {event.title}
                </Flex>
              ))}
            </Grid>
            <Text color="#7A7462" fontSize="12px" mt="2px">
              表情符號金手指
            </Text>
            <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="6px">
              {[
                { id: "alert", label: "驚嘆號" },
                { id: "droplet", label: "雨滴" },
                { id: "question", label: "疑問" },
                { id: "heart", label: "愛心" },
                { id: "anger", label: "火氣" },
                { id: "dizzy", label: "眩暈" },
              ].map((cue) => (
                <Flex
                  key={cue.id}
                  h="30px"
                  borderRadius="8px"
                  bgColor="#9D7859"
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="11px"
                  onClick={() => triggerEmotionCue(cue.id as Parameters<typeof triggerEmotionCue>[0])}
                >
                  {cue.label}
                </Flex>
              ))}
            </Grid>
            <Text color="#7A7462" fontSize="12px" mt="2px">
              背景震動金手指
            </Text>
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(157,120,89,0.18)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="11px"
              fontWeight="700"
              onClick={() => setIsBackgroundFxOpen((prev) => !prev)}
            >
              {isBackgroundFxOpen ? "收合背景特效 ▲" : "展開背景特效 ▼"}
            </Flex>
            {isBackgroundFxOpen ? (
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
                {[
                  { id: "shake-weak", label: "震動（弱）" },
                  { id: "shake-strong", label: "震動（強）" },
                  { id: "flash-white", label: "閃白" },
                  { id: "vignette-dark", label: "漸暗" },
                  { id: "cool-filter", label: "冷色濾鏡" },
                  { id: "border-pulse", label: "邊框脈衝" },
                ].map((fx) => (
                  <Flex
                    key={fx.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#9D7859"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    onClick={() => triggerBackgroundShake(fx.id as BackgroundShakeId)}
                  >
                    {fx.label}
                  </Flex>
                ))}
              </Grid>
            ) : null}
            <Box h="1px" bgColor="rgba(90,86,72,0.25)" my="6px" />
            <Text color="#5F5B49" fontWeight="700" fontSize="16px">
              頭像動作金手指
            </Text>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
              {AVATAR_MOTION_LIST.map((motion) => (
                <Flex
                  key={motion.id}
                  h="30px"
                  borderRadius="8px"
                  bgColor="#8B6A4E"
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="11px"
                  px="6px"
                  textAlign="center"
                  onClick={() => triggerAvatarMotion(motion.id)}
                >
                  {motion.title}
                </Flex>
              ))}
            </Grid>
            <Box h="1px" bgColor="rgba(90,86,72,0.25)" my="6px" />
            <Text color="#5F5B49" fontWeight="700" fontSize="16px">
              角色表情金手指
            </Text>
            <Flex wrap="wrap" gap="6px">
              {AVATAR_EXPRESSION_LIST.map((expression) => (
                <Flex
                  key={expression.id}
                  minW="64px"
                  h="30px"
                  px="8px"
                  borderRadius="6px"
                  bgColor="#6F7E8B"
                  color="white"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  fontSize="12px"
                  onClick={() => triggerAvatarExpression(expression.frameIndex)}
                >
                  {expression.title}
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}

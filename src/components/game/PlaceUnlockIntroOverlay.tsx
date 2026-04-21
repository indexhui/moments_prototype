"use client";

import { Flex, Grid, Text } from "@chakra-ui/react";
import { PlayerStatusBar } from "@/components/game/PlayerStatusBar";
import {
  PLACE_UNLOCK_INTRO_REWARD_PATTERNS,
  type PlaceTileId,
} from "@/lib/game/playerProgress";

type PlaceUnlockIntroOverlayProps = {
  placeId: PlaceTileId;
  savings: number;
  actionPower: number;
  fatigue: number;
  onConfirm: () => void;
};

function getPlaceMeta(placeId: PlaceTileId) {
  if (placeId === "convenience-store") {
    return {
      name: "便利商店",
      iconPath: "/images/icon/mart.png",
      summary: "剛剛解鎖了新的地點。補給、短暫停留，還有新的支線都可能從這裡開始。",
      silhouetteLabel: "青蛙小日獸可能出沒",
      silhouetteHint: "在便利商店附近，偶爾會看見一個熟悉又匆忙的剪影。",
    };
  }
  if (placeId === "breakfast-shop") {
    return {
      name: "早餐店",
      iconPath: null,
      summary: "剛剛解鎖了新的地點。忙碌早晨裡的短暫停留，也可能帶來新的相遇。",
      silhouetteLabel: "新的小日獸線索",
      silhouetteHint: "早餐香氣旁邊，似乎還藏著下一隻小日獸的身影。",
    };
  }
  if (placeId === "park") {
    return {
      name: "公園",
      iconPath: "/images/icon/park.png",
      summary: "剛剛解鎖了新的地點。放慢腳步時，也許會遇見意想不到的小互動。",
      silhouetteLabel: "小日獸可能出沒",
      silhouetteHint: "樹影和長椅旁，偶爾會出現安靜觀察你的輪廓。",
    };
  }
  return {
    name: "公車站",
    iconPath: null,
    summary: "剛剛解鎖了新的地點。新的通勤節奏，會把你帶往不同的遭遇。",
    silhouetteLabel: "小日獸可能出沒",
    silhouetteHint: "在人群與站牌之間，也許有新的小日獸正在等你發現。",
  };
}

function TilePreview({ placeId }: { placeId: PlaceTileId }) {
  const pattern = PLACE_UNLOCK_INTRO_REWARD_PATTERNS[placeId];
  if (!pattern) return null;
  const iconPath = placeId === "convenience-store"
    ? "/images/icon/mart.png"
    : placeId === "park"
      ? "/images/icon/park.png"
      : null;
  const flat = pattern.flat();

  return (
    <Flex
      w="112px"
      h="112px"
      borderRadius="18px"
      border="2px solid #B78E67"
      bg="#FFFDF8"
      align="center"
      justify="center"
      position="relative"
      boxShadow="0 10px 24px rgba(117, 79, 36, 0.12)"
    >
      <Grid templateColumns="repeat(3, 1fr)" templateRows="repeat(3, 1fr)" gap="4px" w="72px" h="72px">
        {flat.map((cell, index) => (
          <Flex
            key={index}
            borderRadius="4px"
            bg={cell === 1 ? "#B48A67" : "#F1E2CF"}
            align="center"
            justify="center"
          >
            {index === 4 ? (
              iconPath ? (
                <img
                  src={iconPath}
                  alt="地點拼圖"
                  style={{ width: "22px", height: "22px", objectFit: "contain", display: "block" }}
                />
              ) : (
                <Text color="#FFF7EF" fontSize="11px" fontWeight="800" lineHeight="1">
                  {placeId === "breakfast-shop" ? "早餐" : "轉乘"}
                </Text>
              )
            ) : null}
          </Flex>
        ))}
      </Grid>
    </Flex>
  );
}

export function PlaceUnlockIntroOverlay({
  placeId,
  savings,
  actionPower,
  fatigue,
  onConfirm,
}: PlaceUnlockIntroOverlayProps) {
  const meta = getPlaceMeta(placeId);

  return (
    <Flex position="absolute" inset="0" zIndex={95} direction="column" bg="#F5EEDC">
      <PlayerStatusBar savings={savings} actionPower={actionPower} fatigue={fatigue} />

      <Flex flex="1" direction="column" px="20px" py="18px" gap="16px">
        <Flex
          direction="column"
          gap="8px"
          borderRadius="24px"
          bg="linear-gradient(180deg, #FFF7E8 0%, #F5E7CD 100%)"
          border="2px solid #D6AE72"
          px="18px"
          py="18px"
          boxShadow="0 16px 32px rgba(126, 89, 47, 0.14)"
        >
          <Text color="#C08843" fontSize="13px" fontWeight="800" letterSpacing="0.08em">
            NEW PLACE
          </Text>
          <Text color="#8A6546" fontSize="28px" fontWeight="900" lineHeight="1.2">
            解鎖新地點
          </Text>
          <Text color="#7C5E47" fontSize="16px" fontWeight="800">
            {meta.name}
          </Text>
          <Text color="#94735A" fontSize="13px" lineHeight="1.7" fontWeight="700">
            {meta.summary}
          </Text>
        </Flex>

        <Flex gap="14px" align="stretch">
          <Flex
            flex="1"
            minH="156px"
            borderRadius="22px"
            border="2px solid #B88F68"
            bg="rgba(255,255,255,0.78)"
            direction="column"
            align="center"
            justify="center"
            px="14px"
            py="16px"
            gap="10px"
          >
            <Flex
              w="84px"
              h="84px"
              borderRadius="999px"
              bg="rgba(90, 67, 54, 0.12)"
              align="center"
              justify="center"
              boxShadow="inset 0 0 28px rgba(64, 42, 29, 0.14)"
            >
              <Text color="rgba(53,35,23,0.78)" fontSize="30px" fontWeight="900" lineHeight="1">
                ???
              </Text>
            </Flex>
            <Text color="#7C5E47" fontSize="14px" fontWeight="800">
              {meta.silhouetteLabel}
            </Text>
            <Text color="#9A7A60" fontSize="12px" lineHeight="1.6" textAlign="center" fontWeight="700">
              {meta.silhouetteHint}
            </Text>
          </Flex>

          <Flex
            flex="1"
            minH="156px"
            borderRadius="22px"
            border="2px solid #B88F68"
            bg="rgba(255,255,255,0.78)"
            direction="column"
            align="center"
            justify="center"
            px="14px"
            py="16px"
            gap="10px"
          >
            <TilePreview placeId={placeId} />
            <Text color="#7C5E47" fontSize="14px" fontWeight="800">
              獲得 1 個 {meta.name}拼圖
            </Text>
            <Text color="#9A7A60" fontSize="12px" lineHeight="1.6" textAlign="center" fontWeight="700">
              之後安排行程時，這個地點也有機會出現在你的路線上。
            </Text>
          </Flex>
        </Flex>

        <Flex
          as="button"
          mt="auto"
          h="52px"
          borderRadius="999px"
          bg="#B98B63"
          color="#FFF9F1"
          fontSize="16px"
          fontWeight="900"
          align="center"
          justify="center"
          boxShadow="0 10px 20px rgba(122, 82, 47, 0.18)"
          onClick={onConfirm}
        >
          收下拼圖，繼續前進
        </Flex>
      </Flex>
    </Flex>
  );
}

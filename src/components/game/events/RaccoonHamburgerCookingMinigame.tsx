"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

type BreadId = "soft-bread" | "multigrain-toast";
type IngredientId =
  | "lettuce"
  | "tomato"
  | "cheese"
  | "ham"
  | "egg-salad"
  | "patty"
  | "mayonnaise";

type PlacedIngredient = {
  id: number;
  ingredientId: IngredientId;
  x: number;
  y: number;
  rotation: number;
};

type SandwichOrder = {
  id: string;
  customerName: string;
  customerImagePath: string;
  recipeName: string;
  dialogue: string;
  clueTitle: string;
  clueText: string;
};

type HeartScore = 1 | 2 | 3 | 4 | 5;
type CookingStep = "compose" | "cover" | "press" | "result";
type PressTexture = "soft" | "balanced" | "crispy";

type BreadDragState = {
  breadId: BreadId;
  pointerId: number;
  x: number;
  y: number;
};

type PressResult = {
  elapsedMs: number;
  softness: number;
  crispness: number;
  texture: PressTexture;
};

const MAX_PRESS_DURATION_MS = 9000;
const PRESS_TICK_MS = 100;
const OPEN_PRESS_IMAGE_PATH =
  "/images/cooking/press-assets-v1/hot-press-open-trim.png";
const CLOSED_PRESS_IMAGE_PATH =
  "/images/cooking/press-assets-v1/hot-press-closed-trim.png";

const INGREDIENT_IMAGE_PATHS: Record<BreadId | IngredientId, string> = {
  "soft-bread": "/images/cooking/stack-assets-v1/sprites-clean/soft-bread.png",
  "multigrain-toast":
    "/images/cooking/stack-assets-v1/sprites-clean/multigrain-toast.png",
  lettuce: "/images/cooking/stack-assets-v1/sprites-clean/lettuce.png",
  tomato: "/images/cooking/stack-assets-v1/sprites-clean/tomato.png",
  cheese: "/images/cooking/stack-assets-v1/sprites-clean/cheese.png",
  ham: "/images/cooking/stack-assets-v1/sprites-clean/ham.png",
  "egg-salad": "/images/cooking/stack-assets-v1/sprites-clean/egg-salad.png",
  patty: "/images/cooking/stack-assets-v1/sprites-clean/patty.png",
  mayonnaise: "/images/cooking/stack-assets-v1/sprites-clean/mayonnaise.png",
};

const BREAD_META: Record<BreadId, { label: string; shortLabel: string }> = {
  "soft-bread": { label: "軟綿白吐司", shortLabel: "白吐司" },
  "multigrain-toast": { label: "香烤全麥吐司", shortLabel: "全麥" },
};

const INGREDIENT_META: Record<
  IngredientId,
  { label: string; shortLabel: string }
> = {
  lettuce: { label: "爽脆生菜", shortLabel: "生菜" },
  tomato: { label: "多汁番茄", shortLabel: "番茄" },
  cheese: { label: "香濃起司", shortLabel: "起司" },
  ham: { label: "柔嫩火腿", shortLabel: "火腿" },
  "egg-salad": { label: "綿綿蛋沙拉", shortLabel: "蛋沙拉" },
  patty: { label: "香煎肉排", shortLabel: "肉排" },
  mayonnaise: { label: "滑順美乃滋", shortLabel: "美乃滋" },
};

const INGREDIENT_IDS = Object.keys(INGREDIENT_META) as IngredientId[];

const SANDWICH_ORDERS: SandwichOrder[] = [
  {
    id: "naotaro",
    customerName: "直太郎",
    customerImagePath: "/images/428出圖/拍照動物/黃金獵犬.png",
    recipeName: "柔柔靈感熱壓吐司",
    dialogue: "今天想吃柔柔、暖暖的，像剛曬好的棉被一樣。",
    clueTitle: "口感情報",
    clueText: "浣熊總說，拿起來像枕頭般柔軟的那片最對胃。",
  },
  {
    id: "frog",
    customerName: "青蛙",
    customerImagePath: "/images/animals/青蛙.png",
    recipeName: "池畔靈感熱壓吐司",
    dialogue: "呱！今天想吃清爽的，咬下去要像在池塘邊吹風。",
    clueTitle: "蔬菜情報",
    clueText: "牠吃熱壓吐司時，總會先找那片咬下去會喀滋作響的綠葉。",
  },
  {
    id: "chicken",
    customerName: "公雞",
    customerImagePath: "/images/animals/公雞.png",
    recipeName: "晨光靈感熱壓吐司",
    dialogue: "咕咕！我要一份顏色亮亮、看起來很有朝氣的早餐！",
    clueTitle: "酸甜情報",
    clueText: "每次吃完，浣熊嘴角都會留下紅紅、酸甜又多汁的痕跡。",
  },
  {
    id: "seal",
    customerName: "魯魯",
    customerImagePath: "/images/animals/seal/seal_03.png",
    recipeName: "浪花靈感熱壓吐司",
    dialogue: "我想要一口咬下去，能吃到好多種不同感覺。",
    clueTitle: "香味情報",
    clueText: "只要聞到濃濃奶香，浣熊那條藏起來的尾巴就會忍不住露出來。",
  },
  {
    id: "goat",
    customerName: "山羊",
    customerImagePath: "/images/animals/goat/goat-sunbeast.png",
    recipeName: "山丘靈感熱壓吐司",
    dialogue: "咩！肉少一點，其他配料越多越好，堆得像座小山吧！",
    clueTitle: "主角情報",
    clueText: "最中間那層要有烤過的焦香，而且厚厚疊成三層，牠才肯現身。",
  },
];

const FINAL_RACCOON_INGREDIENTS: Array<BreadId | IngredientId> = [
  "soft-bread",
  "lettuce",
  "tomato",
  "cheese",
  "patty",
];

const customerPop = keyframes`
  0% { transform: translateY(22px) scale(0.86); opacity: 0; }
  68% { transform: translateY(-3px) scale(1.04); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const toppingDrop = keyframes`
  0% { transform: translate(-50%, -50%) translateY(-22px) scale(1.3); opacity: 0; }
  70% { transform: translate(-50%, -50%) translateY(3px) scale(0.94); opacity: 1; }
  100% { transform: translate(-50%, -50%) translateY(0) scale(1); opacity: 1; }
`;

const clueReveal = keyframes`
  0% { transform: translateY(22px) scale(0.9); opacity: 0; }
  70% { transform: translateY(-4px) scale(1.025); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const successBounce = keyframes`
  0% { transform: translateY(18px) scale(0.9); opacity: 0; }
  66% { transform: translateY(-6px) scale(1.035); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const pressSteam = keyframes`
  0% { transform: translateY(10px) scale(0.76); opacity: 0; }
  35% { opacity: 0.72; }
  100% { transform: translateY(-34px) scale(1.18); opacity: 0; }
`;

const pressMachineHum = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
`;

const pressMachineTopDownHum = keyframes`
  0%, 100% { transform: translate(-50%, -50%) translateX(0); }
  25% { transform: translate(-50%, -50%) translateX(-1px); }
  75% { transform: translate(-50%, -50%) translateX(1px); }
`;

const coverBreadDrop = keyframes`
  0% { transform: translate(-50%, -50%) translateY(-105px) rotate(-8deg) scale(1.06); opacity: 0; }
  22% { opacity: 1; }
  72% { transform: translate(-50%, -50%) translateY(8px) rotate(1deg) scale(1); }
  86% { transform: translate(-50%, -50%) translateY(-5px) rotate(-0.5deg) scale(1); }
  100% { transform: translate(-50%, -50%) translateY(0) rotate(0) scale(1); opacity: 1; }
`;

const openMachineFade = keyframes`
  0%, 58% { opacity: 1; }
  76%, 100% { opacity: 0; }
`;

const closedMachineSwing = keyframes`
  0%, 52% { transform: translate(-18%, -50%) rotate(9deg) scale(1.04); opacity: 0; }
  72% { transform: translate(-52%, -50%) rotate(-1deg) scale(1); opacity: 1; }
  88% { transform: translate(-48%, -50%) rotate(0.5deg) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(0) scale(1); opacity: 1; }
`;

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

const HEART_REACTION_LINES: Record<HeartScore, string> = {
  1: "哇，原來熱壓吐司也能有這麼多留白。這個想法很特別！",
  2: "簡單、乾淨，是一份很有個性的作品。謝謝你！",
  3: "每一口開始有不同的驚喜了，我喜歡這個搭配。",
  4: "顏色和口感都很豐富，這份真的很有你的風格！",
  5: "從來沒吃過這樣的組合！這是獨一無二的熱壓吐司！",
};

/**
 * Non-blocking placeholder until the final taste rubric is decided.
 * It rewards variety only; every score still advances the story.
 */
function getProvisionalHeartScore(items: PlacedIngredient[]): HeartScore {
  const uniqueIngredientCount = new Set(items.map((item) => item.ingredientId)).size;
  if (items.length === 0) return 1;
  if (uniqueIngredientCount === 1) return 2;
  if (uniqueIngredientCount === 2) return 3;
  if (uniqueIngredientCount === 3) return 4;
  return 5;
}

function getPressResult(elapsedMs: number): PressResult {
  const ratio = Math.max(0, Math.min(1, elapsedMs / MAX_PRESS_DURATION_MS));
  const softness = Math.round(100 - ratio * 72);
  const crispness = Math.round(12 + ratio * 88);
  const texture: PressTexture = ratio < 0.36 ? "soft" : ratio < 0.7 ? "balanced" : "crispy";
  return { elapsedMs, softness, crispness, texture };
}

const PRESS_TEXTURE_META: Record<PressTexture, { label: string; description: string }> = {
  soft: { label: "柔軟熱壓", description: "吐司還保有蓬鬆水分，邊緣只有淡淡焦色。" },
  balanced: { label: "金黃平衡", description: "外層金黃、裡面柔軟，兩種口感都吃得到。" },
  crispy: { label: "酥脆熱壓", description: "表面焦香明顯，咬下去會發出清脆聲音。" },
};

function describeIngredient(ingredientId: BreadId | IngredientId) {
  if (ingredientId in BREAD_META) {
    return BREAD_META[ingredientId as BreadId].shortLabel;
  }
  return INGREDIENT_META[ingredientId as IngredientId].shortLabel;
}

function ingredientDisplaySize(ingredientId: IngredientId) {
  switch (ingredientId) {
    case "lettuce":
      return { w: "59px", h: "55px" };
    case "tomato":
      return { w: "47px", h: "47px" };
    case "cheese":
      return { w: "48px", h: "46px" };
    case "ham":
      return { w: "50px", h: "48px" };
    case "egg-salad":
      return { w: "52px", h: "46px" };
    case "patty":
      return { w: "52px", h: "48px" };
    case "mayonnaise":
      return { w: "48px", h: "30px" };
  }
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Flex
      as="button"
      w="100%"
      minH="44px"
      alignItems="center"
      justifyContent="center"
      borderRadius="18px"
      bgColor={disabled ? "#C9BBA9" : "#6F8D56"}
      border="3px solid #4E6141"
      boxShadow={disabled ? "none" : "0 4px 0 #3F5036"}
      color="#FFF8E9"
      fontSize="15px"
      fontWeight="900"
      cursor={disabled ? "default" : "pointer"}
      pointerEvents={disabled ? "none" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      onClick={disabled ? undefined : onClick}
    >
      {label}
    </Flex>
  );
}

function OrderProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <Flex alignItems="center" gap="5px" aria-label={`口味情報 ${currentIndex}/${SANDWICH_ORDERS.length}`}>
      {SANDWICH_ORDERS.map((order, index) => (
        <Box
          key={order.id}
          w={index < currentIndex ? "18px" : "9px"}
          h="9px"
          borderRadius="999px"
          bgColor={index < currentIndex ? "#6F8D56" : index === currentIndex ? "#D98B58" : "#D9C9B6"}
          border="1px solid rgba(89,67,48,0.22)"
          transition="all 180ms ease"
        />
      ))}
    </Flex>
  );
}

function CustomerOrder({
  order,
  orderIndex,
}: {
  order: SandwichOrder;
  orderIndex: number;
}) {
  return (
    <Box
      position="relative"
      w="100%"
      minH="112px"
      pt="9px"
      px="8px"
      overflow="hidden"
      borderRadius="24px"
      bgColor="#F4EBDD"
      border="2px solid #D5BEA3"
      boxShadow="inset 0 -8px 0 rgba(198,164,128,0.14)"
      data-customer-order={order.id}
    >
      <Flex alignItems="flex-start" gap="8px">
        <Flex
          position="relative"
          w="82px"
          h="88px"
          flexShrink={0}
          alignItems="flex-end"
          justifyContent="center"
          animation={`${customerPop} 380ms ease both`}
        >
          <Box
            position="absolute"
            left="6px"
            right="6px"
            bottom="0"
            h="21px"
            borderRadius="50%"
            bgColor="#DEC5A5"
          />
          <Image
            key={order.id}
            src={order.customerImagePath}
            alt={`${order.customerName}小日獸`}
            position="relative"
            zIndex={1}
            w="78px"
            h="82px"
            objectFit="contain"
            mixBlendMode={order.id === "naotaro" ? "multiply" : undefined}
          />
        </Flex>

        <Box
          position="relative"
          flex="1"
          minW={0}
          px="12px"
          py="9px"
          borderRadius="19px"
          bgColor="#D9BD91"
          border="2px solid #B9976E"
        >
          <Box
            position="absolute"
            left="-9px"
            top="27px"
            w="16px"
            h="16px"
            bgColor="#D9BD91"
            borderLeft="2px solid #B9976E"
            borderBottom="2px solid #B9976E"
            transform="rotate(45deg)"
          />
          <Text color="#62442F" fontSize="10px" fontWeight="900">
            第 {orderIndex + 1} 位・{order.customerName}想吃
          </Text>
          <Text mt="2px" color="#3E2D22" fontSize="14px" fontWeight="800" lineHeight="1.35">
            「{order.dialogue}」
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

function OpenHotPressBoard({
  bread,
  hasBread,
  topBread,
  cookingStep,
  selectedIngredient,
  placedIngredients,
  pressElapsedMs,
  onPlace,
  onCloseLid,
  onLiftLid,
  onServe,
}: {
  bread: BreadId;
  hasBread: boolean;
  topBread: BreadId | null;
  cookingStep: CookingStep;
  selectedIngredient: IngredientId | null;
  placedIngredients: PlacedIngredient[];
  pressElapsedMs: number;
  onPlace: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCloseLid: () => void;
  onLiftLid: () => void;
  onServe: () => void;
}) {
  const isComposing = cookingStep === "compose";
  const isCovering = cookingStep === "cover";
  const isPressing = cookingStep === "press";
  const isResult = cookingStep === "result";
  const heatRatio = Math.max(0, Math.min(1, pressElapsedMs / MAX_PRESS_DURATION_MS));
  const indicatorColor = heatRatio < 0.3
    ? "#FFD878"
    : heatRatio < 0.68
      ? "#F39A45"
      : "#C84C35";
  const hasTopBread = topBread !== null;
  const instruction = !hasBread
    ? "把上方吐司拖進左側烤盤"
    : isComposing
      ? hasTopBread
        ? "上層吐司已放好，點右側機蓋闔上"
        : selectedIngredient
          ? `點吐司放上${INGREDIENT_META[selectedIngredient].shortLabel}・完成後再拖一片吐司蓋上`
          : "放好配料後，再拖一片吐司蓋在上面"
      : isCovering
        ? "第二片吐司蓋好，機蓋正在闔起"
        : isPressing
          ? "觀察機蓋右側的小燈，覺得可以就點機蓋起鍋"
          : "機蓋打開了，點烤好的吐司送餐";

  return (
    <Box
      position="relative"
      w="100%"
      h="285px"
      overflow="hidden"
      borderRadius="24px"
      bg="linear-gradient(180deg, #E8CFAB 0%, #D2AE7D 100%)"
      border="3px solid #B08A63"
      boxShadow="inset 0 10px 22px rgba(91,57,35,0.12), 0 4px 0 rgba(114,78,50,0.2)"
      data-open-hot-press-board
      data-has-bread={hasBread ? "true" : "false"}
      data-has-top-bread={hasTopBread ? "true" : "false"}
      data-machine-step={cookingStep}
      data-heat-light={isPressing ? indicatorColor : undefined}
    >
      <Text
        position="absolute"
        top="5px"
        left="0"
        right="0"
        zIndex={8}
        color="#78573D"
        fontSize="10px"
        fontWeight="900"
        textAlign="center"
      >
        {instruction}
      </Text>

      <Box
        position="absolute"
        left="-8px"
        top="55%"
        w="520px"
        h="257px"
        transform="translateY(-50%)"
        data-open-press-canvas
      >
        {isPressing ? (
          <>
            <Image
              src={CLOSED_PRESS_IMAGE_PATH}
              alt="闔上的熱壓吐司機"
              position="absolute"
              left="49.7%"
              top="51%"
              w="240px"
              h="227px"
              objectFit="contain"
              transform="translate(-50%, -50%)"
              filter="drop-shadow(0 8px 7px rgba(82,49,27,0.28))"
              animation={`${pressMachineTopDownHum} 120ms linear infinite`}
              pointerEvents="none"
            />
            <Box
              position="absolute"
              left="62.9%"
              top="47%"
              w="7px"
              h="16px"
              borderRadius="999px"
              bgColor={indicatorColor}
              boxShadow={`0 0 ${7 + heatRatio * 12}px ${indicatorColor}`}
              transition="background-color 300ms linear, box-shadow 300ms linear"
              pointerEvents="none"
              data-heat-indicator
            />
            {[0, 1].map((index) => (
              <Box
                key={index}
                position="absolute"
                left={`${42.7 + index * 15}%`}
                top="31%"
                w="13px"
                h="34px"
                borderRadius="999px"
                bg="linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.72))"
                animation={`${pressSteam} ${760 + index * 120}ms ease-out infinite`}
                animationDelay={`${index * 150}ms`}
                pointerEvents="none"
              />
            ))}
            <Box
              role="button"
              tabIndex={0}
              position="absolute"
              left="27.7%"
              top="7%"
              w="44%"
              h="86%"
              cursor="pointer"
              onClick={onLiftLid}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onLiftLid();
                }
              }}
              aria-label="打開熱壓機起鍋"
              data-lift-press-lid
            />
          </>
        ) : (
          <>
            <Box
              position="absolute"
              inset="0"
              transform={isResult ? "translateX(127px)" : undefined}
              animation={isCovering ? `${openMachineFade} 1.25s ease both` : undefined}
            >
              <Image
                src={OPEN_PRESS_IMAGE_PATH}
                alt="打開的熱壓吐司機"
                position="absolute"
                inset="0"
                w="100%"
                h="100%"
                objectFit="contain"
                filter="drop-shadow(0 7px 6px rgba(82,49,27,0.22))"
                pointerEvents="none"
                draggable={false}
              />

              {!hasBread ? (
                <Flex
                  position="absolute"
                  left="27%"
                  top="51%"
                  w="172px"
                  h="182px"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="22px"
                  border="2px dashed rgba(231,193,127,0.68)"
                  transform="translate(-50%, -50%)"
                  color="#E8C88D"
                  fontSize="10px"
                  fontWeight="900"
                  textAlign="center"
                  pointerEvents="none"
                >
                  拖入吐司
                </Flex>
              ) : (
                <Image
                  src={INGREDIENT_IMAGE_PATHS[isResult && topBread ? topBread : bread]}
                  alt={BREAD_META[isResult && topBread ? topBread : bread].label}
                  position="absolute"
                  left="27%"
                  top="51%"
                  w="204px"
                  h="204px"
                  objectFit="contain"
                  transform="translate(-50%, -50%)"
                  filter={isResult
                    ? `sepia(${heatRatio * 0.72}) saturate(${1 + heatRatio * 0.9}) brightness(${1 - heatRatio * 0.2}) drop-shadow(0 4px 3px rgba(82,49,27,0.24))`
                    : "drop-shadow(0 4px 3px rgba(82,49,27,0.24))"}
                  pointerEvents="none"
                  draggable={false}
                />
              )}

              {isComposing || isCovering ? (
                <Box
                  position="absolute"
                  left="12.5%"
                  top="17%"
                  w="29%"
                  h="68%"
                  borderRadius="18px"
                  cursor={isComposing && hasBread && !hasTopBread && selectedIngredient ? "crosshair" : "default"}
                  touchAction="none"
                  onPointerDown={isComposing && hasBread && !hasTopBread ? onPlace : undefined}
                  aria-label={!hasBread
                    ? "空的左側烤盤"
                    : selectedIngredient
                      ? `點擊放上${INGREDIENT_META[selectedIngredient].label}`
                      : "吐司配料區"}
                  data-bread-hit-area
                  data-bread-drop-zone
                >
                  {hasBread ? placedIngredients.map((item) => {
                    const size = ingredientDisplaySize(item.ingredientId);
                    return (
                      <Image
                        key={item.id}
                        src={INGREDIENT_IMAGE_PATHS[item.ingredientId]}
                        alt=""
                        position="absolute"
                        left={`${item.x}%`}
                        top={`${item.y}%`}
                        w={`${parseFloat(size.w) * 1.1}px`}
                        h={`${parseFloat(size.h) * 1.1}px`}
                        objectFit="contain"
                        filter="drop-shadow(0 3px 2px rgba(79,45,28,0.2))"
                        transform={`translate(-50%, -50%) rotate(${item.rotation}deg)`}
                        transformOrigin="center"
                        animation={`${toppingDrop} 210ms ease both`}
                        pointerEvents="none"
                        draggable={false}
                        data-placed-ingredient={item.ingredientId}
                      />
                    );
                  }) : null}
                </Box>
              ) : null}

              {hasTopBread && !isResult ? (
                <Image
                  src={INGREDIENT_IMAGE_PATHS[topBread]}
                  alt="蓋上的吐司"
                  position="absolute"
                  left="27%"
                  top="51%"
                  w="204px"
                  h="204px"
                  objectFit="contain"
                  filter="drop-shadow(0 5px 4px rgba(82,49,27,0.22))"
                  animation={`${toppingDrop} 260ms ease both`}
                  pointerEvents="none"
                />
              ) : null}

              {isResult ? (
                <>
                  <Box
                    position="absolute"
                    left="17%"
                    top="27%"
                    w="20%"
                    h="48%"
                    borderRadius="18%"
                    opacity={heatRatio * 0.56}
                    backgroundImage="repeating-linear-gradient(135deg, transparent 0 13px, rgba(108,57,25,0.58) 13px 16px, transparent 16px 29px)"
                    mixBlendMode="multiply"
                    pointerEvents="none"
                  />
                  <Box
                    role="button"
                    tabIndex={0}
                    position="absolute"
                    left="12.5%"
                    top="17%"
                    w="29%"
                    h="68%"
                    borderRadius="18px"
                    cursor="pointer"
                    boxShadow="0 0 14px rgba(235,168,89,0.62)"
                    onClick={onServe}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onServe();
                      }
                    }}
                    aria-label="把烤好的吐司送給小日獸"
                    data-serve-cooked-toast
                  />
                </>
              ) : null}
            </Box>

            {isCovering ? (
              <Image
                src={CLOSED_PRESS_IMAGE_PATH}
                alt="正在闔上的熱壓吐司機"
                position="absolute"
                left="27%"
                top="51%"
                w="240px"
                h="227px"
                objectFit="contain"
                filter="drop-shadow(0 8px 7px rgba(82,49,27,0.28))"
                animation={`${closedMachineSwing} 1.25s cubic-bezier(.2,.8,.3,1) both`}
                pointerEvents="none"
              />
            ) : null}

            {isComposing ? (
              <Flex
                role="button"
                tabIndex={0}
                position="absolute"
                left="52%"
                top="11%"
                w="43%"
                h="78%"
                alignItems="flex-end"
                justifyContent="center"
                pb="9px"
                borderRadius="23px"
                border={hasTopBread ? "3px solid rgba(239,166,91,0.72)" : "3px solid transparent"}
                boxShadow={hasTopBread ? "inset 0 0 0 2px rgba(255,239,200,0.28), 0 0 13px rgba(218,126,61,0.36)" : undefined}
                cursor={hasTopBread ? "pointer" : "default"}
                color="#FFE8BC"
                textShadow="0 1px 2px rgba(46,28,17,0.9)"
                fontSize="9px"
                fontWeight="900"
                onClick={onCloseLid}
                onKeyDown={(event) => {
                  if (hasTopBread && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    onCloseLid();
                  }
                }}
                aria-label={hasTopBread ? "闔上右側熱壓機蓋" : "右側熱壓機蓋，請先放上第二片吐司"}
                data-press-lid
                data-ready={hasTopBread ? "true" : "false"}
              >
                {hasTopBread ? "點右側機蓋闔上" : ""}
              </Flex>
            ) : null}
          </>
        )}
      </Box>
    </Box>
  );
}

function IngredientTray({
  selectedIngredient,
  disabled,
  onSelect,
}: {
  selectedIngredient: IngredientId | null;
  disabled: boolean;
  onSelect: (ingredientId: IngredientId) => void;
}) {
  return (
    <Box
      w="100%"
      px="7px"
      pt="7px"
      pb="8px"
      borderRadius="20px"
      bgColor="#EFE4D4"
      border="2px solid #CFB99D"
      opacity={disabled ? 0.58 : 1}
      pointerEvents={disabled ? "none" : undefined}
      data-ingredient-tray
    >
      <Flex display="grid" gridTemplateColumns="repeat(4, minmax(0, 1fr))" gap="5px">
        {INGREDIENT_IDS.map((ingredientId) => {
          const meta = INGREDIENT_META[ingredientId];
          const isSelected = selectedIngredient === ingredientId;
          return (
            <Flex
              as="button"
              key={ingredientId}
              position="relative"
              minW={0}
              h="66px"
              direction="column"
              alignItems="center"
              justifyContent="center"
              gap="1px"
              borderRadius="14px"
              bgColor={isSelected ? "#D8E5B9" : "#DCC3A0"}
              border={isSelected ? "3px solid #617B4D" : "2px solid #B18E66"}
              boxShadow={isSelected ? "0 3px 0 #4E6141" : "inset 0 -3px 0 rgba(126,84,50,0.12)"}
              transform={isSelected ? "translateY(-2px)" : undefined}
              onClick={() => onSelect(ingredientId)}
              aria-label={`選擇${meta.label}`}
              data-ingredient-choice={ingredientId}
              data-selected={isSelected ? "true" : undefined}
            >
              <Image
                src={INGREDIENT_IMAGE_PATHS[ingredientId]}
                alt=""
                w="42px"
                h={ingredientId === "mayonnaise" ? "27px" : "40px"}
                objectFit="contain"
                pointerEvents="none"
              />
              <Text color="#5D422E" fontSize="9px" fontWeight="900" lineHeight="1">
                {meta.shortLabel}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}

function ClosingHotPressStage({
  bread,
  placedIngredients,
}: {
  bread: BreadId;
  placedIngredients: PlacedIngredient[];
}) {
  return (
    <Flex
      w="100%"
      maxW="390px"
      h="100%"
      minH={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="14px"
      overflow="hidden"
      data-closing-hot-press-stage
    >
      <Box textAlign="center">
        <Text color="#4E3829" fontSize="22px" fontWeight="900">
          蓋上吐司，闔起機蓋
        </Text>
        <Text mt="3px" color="#8D6043" fontSize="11px" fontWeight="800">
          把剛剛的創作好好夾在中間
        </Text>
      </Box>

      <Box
        position="relative"
        w="100%"
        h="292px"
        overflow="hidden"
        borderRadius="28px"
        bg="linear-gradient(180deg, #F3E7D5 0%, #D8B78D 100%)"
        border="3px solid #B08A63"
        boxShadow="inset 0 10px 22px rgba(255,255,255,0.38), 0 5px 0 rgba(114,78,50,0.2)"
      >
        <Flex
          position="absolute"
          left="17px"
          top="16px"
          alignItems="center"
          gap="6px"
        >
          <Box w="8px" h="8px" borderRadius="999px" bgColor="#D98B58" />
          <Text color="#74533C" fontSize="9px" fontWeight="900">
            CLOSING
          </Text>
        </Flex>

        <Box
          position="absolute"
          left="50%"
          top="56%"
          w="360px"
          h="178px"
          transform="translate(-50%, -50%)"
          animation={`${openMachineFade} 1.8s ease both`}
        >
          <Image
            src={OPEN_PRESS_IMAGE_PATH}
            alt="打開的熱壓吐司機"
            position="absolute"
            inset="0"
            w="100%"
            h="100%"
            objectFit="contain"
            filter="drop-shadow(0 7px 6px rgba(82,49,27,0.22))"
          />
          <Image
            src={INGREDIENT_IMAGE_PATHS[bread]}
            alt="熱壓吐司底層"
            position="absolute"
            left="27%"
            top="51%"
            w="119px"
            h="119px"
            objectFit="contain"
            transform="translate(-50%, -50%)"
            filter="drop-shadow(0 3px 3px rgba(82,49,27,0.24))"
          />
          {placedIngredients.map((item) => {
            const size = ingredientDisplaySize(item.ingredientId);
            return (
              <Image
                key={item.id}
                src={INGREDIENT_IMAGE_PATHS[item.ingredientId]}
                alt=""
                position="absolute"
                left={`${14 + item.x * 0.26}%`}
                top={`${29 + item.y * 0.45}%`}
                w={`${parseFloat(size.w) * 0.7}px`}
                h={`${parseFloat(size.h) * 0.7}px`}
                objectFit="contain"
                transform={`translate(-50%, -50%) rotate(${item.rotation}deg)`}
                filter="drop-shadow(0 2px 2px rgba(79,45,28,0.18))"
              />
            );
          })}
          <Image
            src={INGREDIENT_IMAGE_PATHS[bread]}
            alt="蓋上的吐司"
            position="absolute"
            left="27%"
            top="51%"
            w="119px"
            h="119px"
            objectFit="contain"
            filter="drop-shadow(0 5px 4px rgba(82,49,27,0.22))"
            animation={`${coverBreadDrop} 1s cubic-bezier(.24,.82,.34,1) both`}
          />
        </Box>

        <Image
          src={CLOSED_PRESS_IMAGE_PATH}
          alt="闔上的熱壓吐司機"
          position="absolute"
          left="27%"
          top="56%"
          w="180px"
          h="171px"
          objectFit="contain"
          filter="drop-shadow(0 8px 7px rgba(82,49,27,0.26))"
          animation={`${closedMachineSwing} 1.8s cubic-bezier(.2,.8,.3,1) both`}
        />
      </Box>

      <Flex alignItems="center" gap="7px" color="#76533A" fontSize="11px" fontWeight="900">
        <Box w="8px" h="8px" borderRadius="999px" bgColor="#D98B58" />
        機蓋闔上後就能開始熱壓
      </Flex>
    </Flex>
  );
}

function HotPressStage({
  bread,
  elapsedMs,
  isPressing,
  result,
  onTogglePress,
  onServe,
  onBack,
}: {
  bread: BreadId;
  elapsedMs: number;
  isPressing: boolean;
  result: PressResult | null;
  onTogglePress: () => void;
  onServe: () => void;
  onBack: () => void;
}) {
  const previewResult = result ?? getPressResult(elapsedMs);
  const pressRatio = Math.max(0, Math.min(1, elapsedMs / MAX_PRESS_DURATION_MS));
  const textureMeta = PRESS_TEXTURE_META[previewResult.texture];

  return (
    <Flex
      w="100%"
      maxW="390px"
      h="100%"
      minH={0}
      direction="column"
      alignItems="center"
      gap="8px"
      overflowY="auto"
      overscrollBehavior="contain"
      css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
      data-hot-press-stage
      data-pressing={isPressing ? "true" : "false"}
      data-press-elapsed-ms={elapsedMs}
      data-press-texture={result?.texture ?? undefined}
    >
      <Box textAlign="center" flexShrink={0}>
        <Text color="#4E3829" fontSize="20px" fontWeight="900">
          最後一步・熱壓吐司
        </Text>
        <Text mt="2px" color="#8D6043" fontSize="10px" fontWeight="800">
          自己決定何時起鍋；秒數會改變焦色、柔軟度與酥脆度
        </Text>
      </Box>

      <Box
        position="relative"
        w="100%"
        h="300px"
        flexShrink={0}
        overflow="hidden"
        borderRadius="25px"
        bg="linear-gradient(180deg, #E9E0D3 0%, #C7B39D 100%)"
        border="3px solid #82684F"
        boxShadow="inset 0 9px 18px rgba(255,255,255,0.4), 0 5px 0 rgba(83,58,40,0.22)"
      >
        <Flex
          position="absolute"
          top="12px"
          left="12px"
          right="12px"
          alignItems="center"
          justifyContent="space-between"
          zIndex={8}
        >
          <Flex alignItems="center" gap="6px">
            <Box
              w="10px"
              h="10px"
              borderRadius="999px"
              bgColor={isPressing ? "#E45E4F" : result ? "#6F8D56" : "#A89A8B"}
              boxShadow={isPressing ? "0 0 9px #F07B66" : undefined}
            />
            <Text color="#5B4636" fontSize="9px" fontWeight="900">
              {isPressing ? "HEATING" : result ? "READY" : "STANDBY"}
            </Text>
          </Flex>
          <Text color="#4C392C" fontSize="18px" fontWeight="900" fontFamily="ui-monospace, monospace">
            {(elapsedMs / 1000).toFixed(1)} 秒
          </Text>
        </Flex>

        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            position="absolute"
            left={`${39 + index * 11}%`}
            top="105px"
            zIndex={9}
            w="16px"
            h="44px"
            borderRadius="999px"
            bg="linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.78))"
            opacity={isPressing ? 0.82 : 0}
            animation={isPressing ? `${pressSteam} ${720 + index * 100}ms ease-out infinite` : undefined}
            animationDelay={`${index * 130}ms`}
          />
        ))}

        {result ? (
          <Box
            position="absolute"
            left="50%"
            top="56%"
            w="344px"
            h="170px"
            transform="translate(-50%, -50%)"
          >
            <Image
              src={OPEN_PRESS_IMAGE_PATH}
              alt="打開的熱壓吐司機"
              position="absolute"
              inset="0"
              w="100%"
              h="100%"
              objectFit="contain"
              filter="drop-shadow(0 7px 6px rgba(82,49,27,0.24))"
            />
            <Image
              src={INGREDIENT_IMAGE_PATHS[bread]}
              alt="熱壓完成的吐司"
              position="absolute"
              left="27%"
              top="51%"
              w="114px"
              h="114px"
              objectFit="contain"
              transform="translate(-50%, -50%)"
              filter={`sepia(${pressRatio * 0.72}) saturate(${1 + pressRatio * 0.9}) brightness(${1 - pressRatio * 0.2}) drop-shadow(0 4px 3px rgba(69,42,27,0.24))`}
            />
            <Box
              position="absolute"
              left="17%"
              top="27%"
              w="20%"
              h="48%"
              borderRadius="18%"
              opacity={pressRatio * 0.56}
              backgroundImage="repeating-linear-gradient(135deg, transparent 0 13px, rgba(108,57,25,0.58) 13px 16px, transparent 16px 29px)"
              mixBlendMode="multiply"
            />
          </Box>
        ) : (
          <Image
            src={CLOSED_PRESS_IMAGE_PATH}
            alt="闔上的熱壓吐司機"
            position="absolute"
            left="50%"
            top="56%"
            w="224px"
            h="212px"
            objectFit="contain"
            transform="translate(-50%, -50%)"
            filter={isPressing
              ? "drop-shadow(0 0 15px rgba(231,123,57,0.5)) drop-shadow(0 9px 7px rgba(82,49,27,0.26))"
              : "drop-shadow(0 9px 7px rgba(82,49,27,0.26))"}
            animation={isPressing ? `${pressMachineHum} 120ms linear infinite` : undefined}
          />
        )}

        <Text
          position="absolute"
          left="0"
          right="0"
          bottom="11px"
          color="#6B4D37"
          fontSize="9px"
          fontWeight="900"
          textAlign="center"
        >
          {result ? "機蓋打開，看看這次的焦色" : isPressing ? "機器正在熱壓中……" : "吐司已經夾在機器裡"}
        </Text>
      </Box>

      <Box w="100%" flexShrink={0}>
        <Flex mb="4px" alignItems="center" justifyContent="space-between">
          <Text color="#735239" fontSize="9px" fontWeight="900">柔軟</Text>
          <Text color="#735239" fontSize="9px" fontWeight="900">酥脆</Text>
        </Flex>
        <Box position="relative" w="100%" h="16px" borderRadius="999px" bgColor="#E4D5C1" border="2px solid #B49470" overflow="hidden">
          <Box
            position="absolute"
            inset="0"
            w={`${pressRatio * 100}%`}
            bg="linear-gradient(90deg, #F3D58E 0%, #D58A4A 62%, #8E4E2E 100%)"
            transition="width 100ms linear"
          />
          <Box
            position="absolute"
            top="50%"
            left={`${pressRatio * 100}%`}
            w="16px"
            h="16px"
            borderRadius="999px"
            bgColor="#FFF8E9"
            border="3px solid #744B31"
            transform="translate(-50%, -50%)"
          />
        </Box>
      </Box>

      <Flex w="100%" gap="6px" flexShrink={0}>
        {[
          { label: "柔軟度", value: previewResult.softness, color: "#7FA06A" },
          { label: "酥脆度", value: previewResult.crispness, color: "#D08348" },
        ].map((metric) => (
          <Box key={metric.label} flex="1" px="9px" py="7px" borderRadius="15px" bgColor="#FFF8E9" border="2px solid #C6AA88">
            <Flex alignItems="center" justifyContent="space-between">
              <Text color="#624733" fontSize="9px" fontWeight="900">{metric.label}</Text>
              <Text color={metric.color} fontSize="14px" fontWeight="900">{metric.value}</Text>
            </Flex>
            <Box mt="3px" h="6px" borderRadius="999px" bgColor="#E5D7C6" overflow="hidden">
              <Box w={`${metric.value}%`} h="100%" bgColor={metric.color} transition="width 100ms linear" />
            </Box>
          </Box>
        ))}
      </Flex>

      {result ? (
        <Box w="100%" px="12px" py="8px" borderRadius="15px" bgColor="#F6E7CA" border="2px solid #C89A60" textAlign="center">
          <Text color="#8C542F" fontSize="14px" fontWeight="900">{textureMeta.label}</Text>
          <Text mt="2px" color="#6A4C37" fontSize="10px" fontWeight="800">{textureMeta.description}</Text>
        </Box>
      ) : null}

      <Flex w="100%" gap="7px" pb="4px" flexShrink={0}>
        {!result && elapsedMs === 0 && !isPressing ? (
          <Flex
            as="button"
            w="74px"
            minH="46px"
            alignItems="center"
            justifyContent="center"
            borderRadius="16px"
            bgColor="#EFE4D4"
            border="2px solid #BDA385"
            color="#674A34"
            fontSize="10px"
            fontWeight="900"
            onClick={onBack}
          >
            回配料台
          </Flex>
        ) : null}
        <Box flex="1">
          {result ? (
            <ActionButton label="請小日獸品嚐" onClick={onServe} />
          ) : (
            <ActionButton
              label={isPressing ? "現在起鍋！" : elapsedMs > 0 ? "完成起鍋" : "開始熱壓"}
              onClick={onTogglePress}
            />
          )}
        </Box>
      </Flex>
    </Flex>
  );
}

function ClueCard({
  order,
  orderIndex,
  heartScore,
  pressResult,
  onContinue,
}: {
  order: SandwichOrder;
  orderIndex: number;
  heartScore: HeartScore;
  pressResult: PressResult;
  onContinue: () => void;
}) {
  const isLast = orderIndex === SANDWICH_ORDERS.length - 1;
  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={10}
      px="22px"
      alignItems="center"
      justifyContent="center"
      bgColor="rgba(74,57,43,0.5)"
      backdropFilter="blur(3px)"
      data-clue-reveal={order.id}
      data-heart-score={heartScore}
      data-press-texture={pressResult.texture}
    >
      <Flex
        w="100%"
        maxW="350px"
        direction="column"
        alignItems="center"
        gap="12px"
        px="18px"
        py="20px"
        borderRadius="28px"
        bgColor="#FFF8E9"
        border="4px solid #D4AF79"
        boxShadow="0 12px 0 rgba(83,58,39,0.2)"
        animation={`${clueReveal} 420ms ease both`}
      >
        <Flex
          px="12px"
          py="4px"
          borderRadius="999px"
          bgColor="#6F8D56"
          color="#FFFFFF"
          fontSize="11px"
          fontWeight="900"
        >
          浣熊口味情報 {orderIndex + 1}/{SANDWICH_ORDERS.length}
        </Flex>
        <Flex alignItems="center" gap="12px">
          <Image
            src={order.customerImagePath}
            alt=""
            w="82px"
            h="78px"
            objectFit="contain"
            mixBlendMode={order.id === "naotaro" ? "multiply" : undefined}
          />
          <Flex
            w="66px"
            h="66px"
            alignItems="center"
            justifyContent="center"
            borderRadius="22px"
            bgColor="#E9D9BE"
            border="3px dashed #A98258"
            color="#956B43"
            fontSize="34px"
            fontWeight="900"
          >
            ?
          </Flex>
        </Flex>
        <Box textAlign="center">
          <Text color="#A8643E" fontSize="11px" fontWeight="900">
            {order.customerName}的創意回饋
          </Text>
          <Flex mt="4px" justifyContent="center" gap="3px" aria-label={`${heartScore} 顆愛心`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Text
                key={index}
                color={index < heartScore ? "#E87375" : "#D8C9B8"}
                fontSize="25px"
                lineHeight="1"
                filter={index < heartScore ? "drop-shadow(0 2px 0 rgba(143,66,63,0.18))" : undefined}
              >
                ♥
              </Text>
            ))}
          </Flex>
          <Text mt="5px" color="#604431" fontSize="13px" fontWeight="800" lineHeight="1.4">
            {HEART_REACTION_LINES[heartScore]}
          </Text>
        </Box>
        <Box w="100%" borderTop="2px dashed #D7B98F" />
        <Box textAlign="center">
          <Text color="#A8643E" fontSize="12px" fontWeight="900">
            {order.clueTitle}
          </Text>
          <Text mt="4px" color="#4E3829" fontSize="18px" fontWeight="900" lineHeight="1.45">
            {order.clueText}
          </Text>
        </Box>
        <ActionButton
          label={isLast ? "拼出浣熊的口味" : "記下情報，接下一單"}
          onClick={onContinue}
        />
      </Flex>
    </Flex>
  );
}

function FinalHotPressPreview() {
  const toppings: Array<{ ingredientId: IngredientId; x: number; y: number; rotation: number }> = [
    { ingredientId: "lettuce", x: 33, y: 31, rotation: -8 },
    { ingredientId: "lettuce", x: 58, y: 32, rotation: 9 },
    { ingredientId: "lettuce", x: 47, y: 51, rotation: -3 },
    { ingredientId: "tomato", x: 28, y: 48, rotation: 4 },
    { ingredientId: "tomato", x: 68, y: 48, rotation: -6 },
    { ingredientId: "tomato", x: 37, y: 68, rotation: -3 },
    { ingredientId: "tomato", x: 61, y: 68, rotation: 5 },
    { ingredientId: "cheese", x: 40, y: 40, rotation: 8 },
    { ingredientId: "cheese", x: 58, y: 58, rotation: -8 },
    { ingredientId: "patty", x: 47, y: 43, rotation: 2 },
    { ingredientId: "patty", x: 34, y: 61, rotation: -5 },
    { ingredientId: "patty", x: 63, y: 62, rotation: 6 },
  ];
  return (
    <Box position="relative" w="210px" h="190px">
      <Image
        src={INGREDIENT_IMAGE_PATHS["soft-bread"]}
        alt="浣熊最喜歡的情報熱壓吐司"
        position="absolute"
        inset="0"
        w="100%"
        h="100%"
        objectFit="contain"
        filter="drop-shadow(0 9px 7px rgba(82,49,27,0.22))"
      />
      {toppings.map((item, index) => {
        const size = ingredientDisplaySize(item.ingredientId);
        return (
          <Image
            key={`${item.ingredientId}-${index}`}
            src={INGREDIENT_IMAGE_PATHS[item.ingredientId]}
            alt=""
            position="absolute"
            left={`${item.x}%`}
            top={`${item.y}%`}
            w={size.w}
            h={size.h}
            objectFit="contain"
            transform={`translate(-50%, -50%) rotate(${item.rotation}deg) scale(0.8)`}
            filter="drop-shadow(0 2px 2px rgba(79,45,28,0.18))"
          />
        );
      })}
      <Image
        src={INGREDIENT_IMAGE_PATHS["soft-bread"]}
        alt=""
        position="absolute"
        inset="-2px 0 0"
        w="100%"
        h="100%"
        objectFit="contain"
        opacity={0.94}
        filter="sepia(0.5) saturate(1.45) brightness(0.93) drop-shadow(0 7px 6px rgba(82,49,27,0.2))"
      />
      <Box
        position="absolute"
        left="28px"
        right="28px"
        top="35px"
        h="112px"
        borderRadius="22%"
        opacity={0.43}
        backgroundImage="repeating-linear-gradient(135deg, transparent 0 18px, rgba(108,57,25,0.58) 18px 22px, transparent 22px 40px)"
        mixBlendMode="multiply"
      />
    </Box>
  );
}

function CompletionView({ onComplete }: { onComplete: () => void }) {
  return (
    <Flex
      w="100%"
      h="100%"
      maxW="390px"
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="12px"
      animation={`${successBounce} 460ms ease both`}
      data-sandwich-information-complete
    >
      <Flex
        px="13px"
        py="5px"
        borderRadius="999px"
        bgColor="#6F8D56"
        color="#FFFFFF"
        fontSize="11px"
        fontWeight="900"
      >
        5/5 口味情報收集完成
      </Flex>
      <Box textAlign="center">
        <Text color="#4E3829" fontSize="25px" fontWeight="900">
          浣熊最愛熱壓吐司
        </Text>
        <Text mt="3px" color="#8D6043" fontSize="13px" fontWeight="800">
          每隻小日獸記得的一點，終於拼成完整配方！
        </Text>
      </Box>
      <FinalHotPressPreview />
      <Flex gap="5px" flexWrap="wrap" justifyContent="center">
        {FINAL_RACCOON_INGREDIENTS.map((ingredientId) => (
          <Flex
            key={ingredientId}
            alignItems="center"
            gap="3px"
            px="7px"
            py="4px"
            borderRadius="999px"
            bgColor="#FFF8E9"
            border="2px solid #C8A883"
          >
            <Image
              src={INGREDIENT_IMAGE_PATHS[ingredientId]}
              alt=""
              w="24px"
              h="24px"
              objectFit="contain"
            />
            <Text color="#654731" fontSize="10px" fontWeight="900">
              {describeIngredient(ingredientId)}
            </Text>
          </Flex>
        ))}
      </Flex>
      <Box w="100%" mt="4px">
        <ActionButton label="包好熱壓吐司，帶去公園" onClick={onComplete} />
      </Box>
    </Flex>
  );
}

export function RaccoonHamburgerCookingMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip?: () => void;
}) {
  const breadHitSequenceRef = useRef(0);
  const [orderIndex, setOrderIndex] = useState(0);
  const [selectedBread, setSelectedBread] = useState<BreadId>("soft-bread");
  const [hasBreadInMachine, setHasBreadInMachine] = useState(false);
  const [topBreadInMachine, setTopBreadInMachine] = useState<BreadId | null>(null);
  const [breadDrag, setBreadDrag] = useState<BreadDragState | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientId | null>(null);
  const [placedIngredients, setPlacedIngredients] = useState<PlacedIngredient[]>([]);
  const [feedback, setFeedback] = useState("選一片喜歡的吐司，自由搭配配料與份量吧。 ");
  const [feedbackTone, setFeedbackTone] = useState<"normal" | "error" | "success">("normal");
  const [showClue, setShowClue] = useState(false);
  const [heartScore, setHeartScore] = useState<HeartScore | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [cookingStep, setCookingStep] = useState<CookingStep>("compose");
  const [pressElapsedMs, setPressElapsedMs] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [pressResult, setPressResult] = useState<PressResult | null>(null);

  const activeOrder = SANDWICH_ORDERS[orderIndex];

  useEffect(() => {
    if (!isPressing) return;
    const intervalId = window.setInterval(() => {
      setPressElapsedMs((elapsedMs) =>
        Math.min(MAX_PRESS_DURATION_MS, elapsedMs + PRESS_TICK_MS),
      );
    }, PRESS_TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [isPressing]);

  useEffect(() => {
    if (isPressing && pressElapsedMs >= MAX_PRESS_DURATION_MS) {
      setIsPressing(false);
    }
  }, [isPressing, pressElapsedMs]);

  useEffect(() => {
    if (cookingStep !== "cover") return;
    const transitionId = window.setTimeout(() => {
      setCookingStep("press");
      setIsPressing(true);
      setFeedback("小燈亮起來了。看燈色，覺得剛好就點機蓋起鍋。 ");
      setFeedbackTone("normal");
    }, 1250);
    return () => window.clearTimeout(transitionId);
  }, [cookingStep]);

  const placeBreadInMachine = useCallback(
    (breadId: BreadId) => {
      if (cookingStep !== "compose") return;
      if (!hasBreadInMachine) {
        setSelectedBread(breadId);
        setHasBreadInMachine(true);
        setFeedback(`把${BREAD_META[breadId].label}放進左側烤盤。接著自由加配料。`);
      } else {
        setTopBreadInMachine(breadId);
        setSelectedIngredient(null);
        setFeedback(`親手蓋上${BREAD_META[breadId].label}。現在可以闔起右側機蓋。`);
      }
      setFeedbackTone("normal");
      triggerHaptic([7, 12, 7]);
    },
    [cookingStep, hasBreadInMachine],
  );

  const startBreadDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, breadId: BreadId) => {
      if (cookingStep !== "compose") return;
      event.preventDefault();
      setBreadDrag({ breadId, pointerId: event.pointerId, x: event.clientX, y: event.clientY });
      setFeedback(`把${BREAD_META[breadId].shortLabel}拖到左側烤盤。`);
      setFeedbackTone("normal");
      triggerHaptic(5);
    },
    [cookingStep],
  );

  const moveBreadDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setBreadDrag((current) => current && current.pointerId === event.pointerId
      ? { ...current, x: event.clientX, y: event.clientY }
      : current);
  }, []);

  const finishBreadDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!breadDrag || breadDrag.pointerId !== event.pointerId) return;
      const dropElement = document.elementFromPoint(event.clientX, event.clientY);
      if (dropElement?.closest("[data-bread-drop-zone]")) {
        placeBreadInMachine(breadDrag.breadId);
      } else {
        setFeedback("吐司沒有放進烤盤，再拖一次試試看。 ");
        setFeedbackTone("error");
        triggerHaptic(16);
      }
      setBreadDrag(null);
    },
    [breadDrag, placeBreadInMachine],
  );

  const chooseIngredient = useCallback((ingredientId: IngredientId) => {
    if (!hasBreadInMachine) {
      setFeedback("烤盤還是空的，先從上方選一片吐司。 ");
      setFeedbackTone("error");
      triggerHaptic(18);
      return;
    }
    if (topBreadInMachine) {
      setFeedback("上層吐司已經蓋好了；先復原上層吐司才能調整配料。 ");
      setFeedbackTone("error");
      triggerHaptic(18);
      return;
    }
    setSelectedIngredient(ingredientId);
    setFeedback(`已拿起${INGREDIENT_META[ingredientId].label}，點吐司可以連續放上多份。`);
    setFeedbackTone("normal");
    triggerHaptic(6);
  }, [hasBreadInMachine, topBreadInMachine]);

  const placeIngredient = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!hasBreadInMachine) {
        setFeedback("先把吐司放進左側烤盤。 ");
        setFeedbackTone("error");
        triggerHaptic(18);
        return;
      }
      if (topBreadInMachine) {
        setFeedback("先拿掉上層吐司，才能繼續調整配料。 ");
        setFeedbackTone("error");
        triggerHaptic(18);
        return;
      }
      if (!selectedIngredient) {
        setFeedback("先從下方配料區選一種食材。 ");
        setFeedbackTone("error");
        triggerHaptic(18);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const rawX = ((event.clientX - rect.left) / rect.width) * 100;
      const rawY = ((event.clientY - rect.top) / rect.height) * 100;
      const x = Math.max(12, Math.min(88, rawX));
      const y = Math.max(12, Math.min(88, rawY));
      const nextId = breadHitSequenceRef.current + 1;
      breadHitSequenceRef.current = nextId;
      setPlacedIngredients((items) => [
        ...items,
        {
          id: nextId,
          ingredientId: selectedIngredient,
          x,
          y,
          rotation: ((nextId * 37) % 29) - 14,
        },
      ]);
      setFeedback(`放上一份${INGREDIENT_META[selectedIngredient].shortLabel}。想放幾份、放在哪裡都可以。`);
      setFeedbackTone("normal");
      triggerHaptic(8);
    },
    [hasBreadInMachine, selectedIngredient, topBreadInMachine],
  );

  const undoLast = useCallback(() => {
    if (topBreadInMachine) {
      setTopBreadInMachine(null);
      setFeedback(`拿回上層的${BREAD_META[topBreadInMachine].shortLabel}，可以繼續調整配料。`);
      setFeedbackTone("normal");
      triggerHaptic(8);
      return;
    }
    setPlacedIngredients((items) => {
      const removed = items[items.length - 1];
      if (!removed) return items;
      setFeedback(`拿回最後一份${INGREDIENT_META[removed.ingredientId].shortLabel}。`);
      setFeedbackTone("normal");
      return items.slice(0, -1);
    });
    triggerHaptic(8);
  }, [topBreadInMachine]);

  const clearSandwich = useCallback(() => {
    setHasBreadInMachine(false);
    setTopBreadInMachine(null);
    setPlacedIngredients([]);
    setSelectedIngredient(null);
    setFeedback("把吐司和配料都拿出來了，烤盤重新空出來。 ");
    setFeedbackTone("normal");
    triggerHaptic(12);
  }, []);

  const closeMachineLid = useCallback(() => {
    if (!hasBreadInMachine || !topBreadInMachine) {
      setFeedback("要先親手放好上下兩片吐司，才能闔起機蓋。 ");
      setFeedbackTone("error");
      triggerHaptic(18);
      return;
    }
    setCookingStep("cover");
    setPressElapsedMs(0);
    setIsPressing(false);
    setPressResult(null);
    setFeedback("右側機蓋正在闔上…… ");
    setFeedbackTone("normal");
    triggerHaptic([8, 16, 8]);
  }, [hasBreadInMachine, topBreadInMachine]);

  const liftMachineLid = useCallback(() => {
    if (cookingStep !== "press") return;
    const finalElapsedMs = Math.max(PRESS_TICK_MS, pressElapsedMs);
    setIsPressing(false);
    setPressElapsedMs(finalElapsedMs);
    setPressResult(getPressResult(finalElapsedMs));
    setCookingStep("result");
    setFeedback("機蓋打開了。看看吐司的顏色，滿意就點它送餐。 ");
    setFeedbackTone("normal");
    triggerHaptic([14, 24, 18]);
  }, [cookingStep, pressElapsedMs]);

  const serveOrder = useCallback(() => {
    if (!pressResult) return;
    const nextHeartScore = getProvisionalHeartScore(placedIngredients);
    setHeartScore(nextHeartScore);
    setFeedback(`${activeOrder.customerName}收到你的「${activeOrder.recipeName}」了！`);
    setFeedbackTone("success");
    setShowClue(true);
    triggerHaptic([10, 18, 10, 28, 45]);
  }, [activeOrder, placedIngredients, pressResult]);

  const continueAfterClue = useCallback(() => {
    setShowClue(false);
    if (orderIndex >= SANDWICH_ORDERS.length - 1) {
      setIsPressing(false);
      setIsComplete(true);
      return;
    }
    const nextIndex = orderIndex + 1;
    setOrderIndex(nextIndex);
    setSelectedBread("soft-bread");
    setHasBreadInMachine(false);
    setTopBreadInMachine(null);
    setBreadDrag(null);
    setSelectedIngredient(null);
    setPlacedIngredients([]);
    setHeartScore(null);
    setCookingStep("compose");
    setPressElapsedMs(0);
    setIsPressing(false);
    setPressResult(null);
    setFeedback(`${SANDWICH_ORDERS[nextIndex].customerName}來點餐了。先聽清楚想吃什麼！`);
    setFeedbackTone("normal");
  }, [orderIndex]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={72}
      direction="column"
      overflow="hidden"
      px="14px"
      pt="14px"
      pb="16px"
      bgColor="#F7F0E4"
      userSelect="none"
      onPointerMove={breadDrag ? moveBreadDrag : undefined}
      onPointerUp={breadDrag ? finishBreadDrag : undefined}
      onPointerCancel={breadDrag ? () => setBreadDrag(null) : undefined}
      data-raccoon-sandwich-game
      data-order-index={orderIndex}
      data-order-id={activeOrder.id}
      data-selected-bread={hasBreadInMachine ? selectedBread : undefined}
      data-has-bread={hasBreadInMachine ? "true" : "false"}
      data-top-bread={topBreadInMachine ?? undefined}
      data-bread-dragging={breadDrag?.breadId ?? undefined}
      data-selected-ingredient={selectedIngredient ?? undefined}
      data-placed-count={placedIngredients.length}
      data-placed-ingredients={placedIngredients.map((item) => item.ingredientId).join(",")}
      data-cooking-step={cookingStep}
      data-press-elapsed-ms={pressElapsedMs}
      data-press-texture={pressResult?.texture ?? undefined}
      data-clue-open={showClue ? "true" : "false"}
      data-complete={isComplete ? "true" : "false"}
    >
      <Box
        position="absolute"
        inset="0"
        opacity={0.2}
        backgroundImage="radial-gradient(#A98A68 1px, transparent 1px)"
        backgroundSize="9px 9px"
        pointerEvents="none"
      />

      <Flex
        position="relative"
        zIndex={2}
        mb="8px"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Text color="#4E3829" fontSize="17px" fontWeight="900" lineHeight="1">
            小日獸熱壓吐司店
          </Text>
          <Text mt="3px" color="#8D6043" fontSize="9px" fontWeight="900">
            自由創作熱壓吐司，交換浣熊情報
          </Text>
        </Box>
        <Flex direction="column" alignItems="flex-end" gap="4px">
          {!isComplete ? <OrderProgress currentIndex={orderIndex} /> : <OrderProgress currentIndex={SANDWICH_ORDERS.length} />}
          {onSkip ? (
            <Flex
              as="button"
              px="7px"
              py="2px"
              borderRadius="999px"
              bgColor="rgba(255,255,255,0.72)"
              border="1px solid #BCA98F"
              color="#765943"
              fontSize="9px"
              fontWeight="900"
              onClick={onSkip}
            >
              略過
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={2} flex="1" minH={0} justifyContent="center">
        {isComplete ? (
          <CompletionView onComplete={onComplete} />
        ) : (
          <Flex
            w="100%"
            maxW="390px"
            h="100%"
            minH={0}
            direction="column"
            gap="7px"
            overflowY="auto"
            overscrollBehavior="contain"
            css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
          >
            <CustomerOrder
              order={activeOrder}
              orderIndex={orderIndex}
            />

            <Flex w="100%" gap="6px" alignItems="stretch">
              {(Object.keys(BREAD_META) as BreadId[]).map((breadId) => {
                const isUsed = (hasBreadInMachine && selectedBread === breadId) || topBreadInMachine === breadId;
                return (
                  <Flex
                    role="button"
                    tabIndex={0}
                    key={breadId}
                    flex="1"
                    minH="39px"
                    alignItems="center"
                    justifyContent="center"
                    gap="4px"
                    borderRadius="13px"
                    bgColor={isUsed ? "#D8E5B9" : "#EFE4D4"}
                    border={isUsed ? "3px solid #617B4D" : "2px solid #C5AD91"}
                    color="#5A3F2D"
                    fontSize="10px"
                    fontWeight="900"
                    cursor={cookingStep === "compose" ? "grab" : "default"}
                    touchAction="none"
                    opacity={cookingStep === "compose" ? 1 : 0.55}
                    pointerEvents={cookingStep === "compose" ? undefined : "none"}
                    onPointerDown={(event) => startBreadDrag(event, breadId)}
                    onKeyDown={(event) => {
                      if (cookingStep === "compose" && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        placeBreadInMachine(breadId);
                      }
                    }}
                    aria-label={`拖曳${BREAD_META[breadId].label}到左側烤盤`}
                    data-bread-choice={breadId}
                    data-selected={isUsed ? "true" : undefined}
                  >
                    <Image src={INGREDIENT_IMAGE_PATHS[breadId]} alt="" w="31px" h="31px" objectFit="contain" pointerEvents="none" />
                    {BREAD_META[breadId].label}
                  </Flex>
                );
              })}
            </Flex>

            <OpenHotPressBoard
              bread={selectedBread}
              hasBread={hasBreadInMachine}
              topBread={topBreadInMachine}
              cookingStep={cookingStep}
              selectedIngredient={selectedIngredient}
              placedIngredients={placedIngredients}
              pressElapsedMs={pressElapsedMs}
              onPlace={placeIngredient}
              onCloseLid={closeMachineLid}
              onLiftLid={liftMachineLid}
              onServe={serveOrder}
            />

            <IngredientTray
              selectedIngredient={selectedIngredient}
              disabled={cookingStep !== "compose" || Boolean(topBreadInMachine)}
              onSelect={chooseIngredient}
            />

            <Flex w="100%" gap="6px" alignItems="stretch">
              <Flex
                flex="1"
                minH="43px"
                px="8px"
                alignItems="center"
                justifyContent="center"
                borderRadius="14px"
                bgColor={feedbackTone === "error" ? "#F6D0C6" : feedbackTone === "success" ? "#D8E5B9" : "#FFF8E9"}
                border="2px solid #C6A987"
              >
                <Text
                  color={feedbackTone === "error" ? "#A74338" : "#644832"}
                  fontSize="10px"
                  fontWeight="900"
                  lineHeight="1.3"
                  textAlign="center"
                >
                  {feedback}
                </Text>
              </Flex>
              <Flex gap="4px">
                <Flex
                  as="button"
                  w="46px"
                  minH="43px"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="14px"
                  bgColor="#EFE4D4"
                  border="2px solid #BDA385"
                  color="#674A34"
                  fontSize="8px"
                  fontWeight="900"
                  opacity={cookingStep !== "compose" || (!topBreadInMachine && placedIngredients.length === 0) ? 0.45 : 1}
                  pointerEvents={cookingStep !== "compose" || (!topBreadInMachine && placedIngredients.length === 0) ? "none" : undefined}
                  aria-disabled={cookingStep !== "compose" || (!topBreadInMachine && placedIngredients.length === 0) ? "true" : undefined}
                  onClick={cookingStep !== "compose" || (!topBreadInMachine && placedIngredients.length === 0) ? undefined : undoLast}
                >
                  <Text fontSize="17px" lineHeight="1">↶</Text>
                  復原
                </Flex>
                <Flex
                  as="button"
                  w="46px"
                  minH="43px"
                  direction="column"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="14px"
                  bgColor="#EFE4D4"
                  border="2px solid #BDA385"
                  color="#674A34"
                  fontSize="8px"
                  fontWeight="900"
                  opacity={cookingStep !== "compose" || !hasBreadInMachine ? 0.45 : 1}
                  pointerEvents={cookingStep !== "compose" || !hasBreadInMachine ? "none" : undefined}
                  aria-disabled={cookingStep !== "compose" || !hasBreadInMachine ? "true" : undefined}
                  onClick={cookingStep !== "compose" || !hasBreadInMachine ? undefined : clearSandwich}
                >
                  <Text fontSize="15px" lineHeight="1">×</Text>
                  清空
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>

      {breadDrag ? (
        <Image
          src={INGREDIENT_IMAGE_PATHS[breadDrag.breadId]}
          alt=""
          position="fixed"
          left={`${breadDrag.x}px`}
          top={`${breadDrag.y}px`}
          zIndex={90}
          w="92px"
          h="92px"
          objectFit="contain"
          transform="translate(-50%, -50%) rotate(-4deg) scale(1.04)"
          filter="drop-shadow(0 10px 8px rgba(82,49,27,0.28))"
          pointerEvents="none"
          data-bread-drag-ghost
        />
      ) : null}

      {showClue && heartScore && pressResult ? (
        <ClueCard
          order={activeOrder}
          orderIndex={orderIndex}
          heartScore={heartScore}
          pressResult={pressResult}
          onContinue={continueAfterClue}
        />
      ) : null}
    </Flex>
  );
}

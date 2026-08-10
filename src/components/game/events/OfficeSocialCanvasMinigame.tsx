"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  FiCheck,
  FiDollarSign,
  FiEye,
  FiHeart,
  FiImage,
  FiLock,
  FiMaximize2,
  FiMousePointer,
  FiRotateCcw,
  FiRotateCw,
  FiSend,
  FiStar,
  FiTrash2,
  FiTrendingUp,
  FiUnlock,
} from "react-icons/fi";

type SocialCanvasPhase = "intro" | "editing" | "result" | "complete";
type StickerTag = "bread" | "drink" | "dessert" | "mood" | "sales" | "nature" | "tool" | "mascot";

type StickerDefinition = {
  id: string;
  label: string;
  sheetIndex: number;
  cost: number;
  appeal: number;
  unlockAt: number;
  tag: StickerTag;
};

type PlacedSticker = {
  instanceId: number;
  stickerId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

type Campaign = {
  id: string;
  brief: string;
  audience: string;
  title: string;
  subtitle: string;
  budget: number;
  goalTags: readonly StickerTag[];
  backgroundImage: string;
  backgroundPosition: string;
  tint: string;
  titleColor: string;
  titleAlign: "left" | "center";
};

type ResultSummary = {
  gain: number;
  themeHits: number;
  quadrants: number;
  leftover: number;
  newlyUnlocked: StickerDefinition[];
};

type StickerDrag = {
  instanceId: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

const STICKER_SHEET = "/images/work/social-canvas/sticker-sheet.png";

const STICKERS: readonly StickerDefinition[] = [
  { id: "croissant", label: "可頌", sheetIndex: 0, cost: 3, appeal: 24, unlockAt: 0, tag: "bread" },
  { id: "coffee", label: "咖啡", sheetIndex: 3, cost: 3, appeal: 25, unlockAt: 0, tag: "drink" },
  { id: "sparkle", label: "閃亮", sheetIndex: 6, cost: 1, appeal: 12, unlockAt: 0, tag: "mood" },
  { id: "price-tag", label: "小吊牌", sheetIndex: 8, cost: 2, appeal: 17, unlockAt: 0, tag: "sales" },
  { id: "heart", label: "愛心", sheetIndex: 7, cost: 2, appeal: 20, unlockAt: 80, tag: "mood" },
  { id: "baguette", label: "長棍麵包", sheetIndex: 1, cost: 3, appeal: 28, unlockAt: 110, tag: "bread" },
  { id: "cake", label: "草莓蛋糕", sheetIndex: 9, cost: 4, appeal: 38, unlockAt: 190, tag: "dessert" },
  { id: "flowers", label: "小花", sheetIndex: 10, cost: 2, appeal: 24, unlockAt: 250, tag: "nature" },
  { id: "loaf", label: "吐司", sheetIndex: 2, cost: 3, appeal: 32, unlockAt: 310, tag: "bread" },
  { id: "mixer", label: "攪拌器", sheetIndex: 4, cost: 4, appeal: 36, unlockAt: 370, tag: "tool" },
  { id: "mitt", label: "隔熱手套", sheetIndex: 5, cost: 3, appeal: 29, unlockAt: 410, tag: "tool" },
  { id: "frog", label: "青蛙店長", sheetIndex: 11, cost: 5, appeal: 52, unlockAt: 440, tag: "mascot" },
] as const;

const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "fresh-bake",
    brief: "新品麵包・開幕貼文",
    audience: "早晨通勤族",
    title: "今天也剛剛好",
    subtitle: "一份剛出爐的早晨",
    budget: 8,
    goalTags: ["bread", "mood"],
    backgroundImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
    backgroundPosition: "center 70%",
    tint: "linear-gradient(180deg, rgba(71,40,27,0.08) 15%, rgba(50,30,22,0.6) 100%)",
    titleColor: "#FFF7E4",
    titleAlign: "left",
  },
  {
    id: "afternoon",
    brief: "午後甜點・互動貼文",
    audience: "甜點收藏者",
    title: "留一點甜給自己",
    subtitle: "今天的下午茶選好了嗎？",
    budget: 10,
    goalTags: ["drink", "mood"],
    backgroundImage: "/images/events/frog-dessert-shop/dessert-shop-cake-bag.png",
    backgroundPosition: "center 62%",
    tint: "linear-gradient(180deg, rgba(255,240,214,0.08), rgba(104,64,51,0.42))",
    titleColor: "#FFF9E9",
    titleAlign: "center",
  },
  {
    id: "birthday",
    brief: "生日蛋糕・預訂宣傳",
    audience: "本月壽星",
    title: "把喜歡做成蛋糕",
    subtitle: "本週預訂，附手寫祝福小卡",
    budget: 12,
    goalTags: ["dessert", "sales"],
    backgroundImage: "/images/events/frog-dessert-shop/dessert-shop-interior.png",
    backgroundPosition: "center 82%",
    tint: "linear-gradient(155deg, rgba(98,54,68,0.12), rgba(80,38,42,0.62))",
    titleColor: "#FFF1E7",
    titleAlign: "left",
  },
  {
    id: "thanks",
    brief: "人氣里程碑・感謝貼文",
    audience: "追蹤小店的大家",
    title: "謝謝你們的喜歡",
    subtitle: "下一份甜，也一起慢慢完成",
    budget: 14,
    goalTags: ["mascot", "nature", "mood"],
    backgroundImage: "/images/events/frog-dessert-shop/dessert-shop-cake-bag.png",
    backgroundPosition: "center 47%",
    tint: "linear-gradient(155deg, rgba(51,85,68,0.16), rgba(33,65,57,0.64))",
    titleColor: "#FFF9DF",
    titleAlign: "center",
  },
] as const;

const TAG_LABELS: Record<StickerTag, string> = {
  bread: "麵包感",
  drink: "飲品感",
  dessert: "甜點感",
  mood: "氣氛感",
  sales: "促購感",
  nature: "生活感",
  tool: "職人氣息",
  mascot: "店長登場",
};

const DROP_POSITIONS = [
  { x: 20, y: 24, rotation: -8 },
  { x: 78, y: 27, rotation: 7 },
  { x: 22, y: 71, rotation: 5 },
  { x: 77, y: 73, rotation: -6 },
  { x: 50, y: 49, rotation: 3 },
  { x: 49, y: 79, rotation: -4 },
] as const;

const panelIn = keyframes`
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const stickerPop = keyframes`
  0% { opacity: 0; transform: scale(1.5) rotate(-12deg); }
  65% { opacity: 1; transform: scale(0.9) rotate(4deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
`;

const unlockGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 rgba(239,190,81,0); }
  50% { box-shadow: 0 0 0 5px rgba(239,190,81,0.3); }
`;

const publishSweep = keyframes`
  from { transform: translateX(-120%) skewX(-18deg); }
  to { transform: translateX(260%) skewX(-18deg); }
`;

const heartFloat = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.7); }
  28% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-58px) scale(1.15) rotate(8deg); }
`;

function sheetPosition(index: number) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  return `${column * 50}% ${row * (100 / 3)}%`;
}

function StickerSprite({
  sticker,
  size,
}: {
  sticker: StickerDefinition;
  size: string | number;
}) {
  return (
    <Box
      w={size}
      h={size}
      bgImage={`url("${STICKER_SHEET}")`}
      bgSize="300% 400%"
      backgroundPosition={sheetPosition(sticker.sheetIndex)}
      bgRepeat="no-repeat"
      pointerEvents="none"
    />
  );
}

function calculateQuadrants(placed: PlacedSticker[]) {
  const quadrants = new Set<string>();
  placed.forEach((item) => {
    quadrants.add(`${item.x < 50 ? "l" : "r"}${item.y < 50 ? "t" : "b"}`);
  });
  return quadrants.size;
}

export function OfficeSocialCanvasMinigame({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<SocialCanvasPhase>("intro");
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [budgetLeft, setBudgetLeft] = useState(CAMPAIGNS[0].budget);
  const [popularity, setPopularity] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drag, setDrag] = useState<StickerDrag | null>(null);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [notice, setNotice] = useState<{ nonce: number; text: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const instanceIdRef = useRef(0);
  const noticeNonceRef = useRef(0);
  const campaign = CAMPAIGNS[campaignIndex];

  const showNotice = useCallback((text: string) => {
    noticeNonceRef.current += 1;
    setNotice({ nonce: noticeNonceRef.current, text });
  }, []);

  const unlockedStickers = useMemo(
    () => STICKERS.filter((sticker) => popularity >= sticker.unlockAt),
    [popularity],
  );

  const selectedSticker = selectedId === null
    ? null
    : placed.find((item) => item.instanceId === selectedId) ?? null;

  const addSticker = useCallback(
    (sticker: StickerDefinition) => {
      if (phase !== "editing") return;
      if (popularity < sticker.unlockAt) {
        showNotice(`累積 ${sticker.unlockAt} 人氣後解鎖「${sticker.label}」`);
        return;
      }
      if (placed.some((item) => item.stickerId === sticker.id)) {
        showNotice(`畫布上已經有「${sticker.label}」了`);
        return;
      }
      if (budgetLeft < sticker.cost) {
        showNotice(`預算不足，還差 ${sticker.cost - budgetLeft} 點`);
        return;
      }
      if (placed.length >= DROP_POSITIONS.length) {
        showNotice("畫布已經很熱鬧了，先調整或移除一張貼紙");
        return;
      }

      const position = DROP_POSITIONS[placed.length];
      instanceIdRef.current += 1;
      const next: PlacedSticker = {
        instanceId: instanceIdRef.current,
        stickerId: sticker.id,
        x: position.x,
        y: position.y,
        rotation: position.rotation,
        scale: 1,
      };
      setPlaced((current) => [...current, next]);
      setBudgetLeft((current) => current - sticker.cost);
      setSelectedId(next.instanceId);
      showNotice(`加入「${sticker.label}」・花費 ${sticker.cost} 點預算`);
    },
    [budgetLeft, phase, placed, popularity, showNotice],
  );

  const updateSelected = useCallback(
    (update: (item: PlacedSticker) => PlacedSticker) => {
      if (selectedId === null) return;
      setPlaced((current) => current.map((item) => (item.instanceId === selectedId ? update(item) : item)));
    },
    [selectedId],
  );

  const removeSelected = useCallback(() => {
    if (!selectedSticker) return;
    const definition = STICKERS.find((sticker) => sticker.id === selectedSticker.stickerId);
    setPlaced((current) => current.filter((item) => item.instanceId !== selectedSticker.instanceId));
    if (definition) setBudgetLeft((current) => current + definition.cost);
    setSelectedId(null);
    showNotice("已移除貼紙，預算退回");
  }, [selectedSticker, showNotice]);

  const resetCanvas = useCallback(() => {
    setPlaced([]);
    setSelectedId(null);
    setBudgetLeft(campaign.budget);
    showNotice("畫布已重設");
  }, [campaign.budget, showNotice]);

  const handleStickerPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, item: PlacedSticker) => {
      if (phase !== "editing") return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setSelectedId(item.instanceId);
      setDrag({
        instanceId: item.instanceId,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: item.x,
        startY: item.y,
      });
    },
    [phase],
  );

  const handleStickerPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag || drag.pointerId !== event.pointerId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const nextX = Math.max(8, Math.min(92, drag.startX + ((event.clientX - drag.startClientX) / rect.width) * 100));
      const nextY = Math.max(8, Math.min(92, drag.startY + ((event.clientY - drag.startClientY) / rect.height) * 100));
      setPlaced((current) =>
        current.map((item) =>
          item.instanceId === drag.instanceId ? { ...item, x: nextX, y: nextY } : item,
        ),
      );
    },
    [drag],
  );

  const handleStickerPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDrag((current) => (current?.pointerId === event.pointerId ? null : current));
  }, []);

  const publishPost = useCallback(() => {
    if (placed.length < 2) {
      showNotice("至少放上 2 張貼紙，貼文才有完成感");
      return;
    }

    const usedDefinitions = placed
      .map((item) => STICKERS.find((sticker) => sticker.id === item.stickerId))
      .filter((sticker): sticker is StickerDefinition => Boolean(sticker));
    const usedTags = new Set(usedDefinitions.map((sticker) => sticker.tag));
    const themeHits = campaign.goalTags.filter((tag) => usedTags.has(tag)).length;
    const quadrants = calculateQuadrants(placed);
    const gain =
      30 +
      usedDefinitions.reduce((total, sticker) => total + sticker.appeal, 0) +
      themeHits * 25 +
      quadrants * 8 +
      budgetLeft * 2;
    const nextPopularity = popularity + gain;
    const newlyUnlocked = STICKERS.filter(
      (sticker) => sticker.unlockAt > popularity && sticker.unlockAt <= nextPopularity,
    );

    setPopularity(nextPopularity);
    setPublishedCount((current) => current + 1);
    setResult({ gain, themeHits, quadrants, leftover: budgetLeft, newlyUnlocked });
    setSelectedId(null);
    setPhase("result");
  }, [budgetLeft, campaign.goalTags, placed, popularity, showNotice]);

  const continueAfterResult = useCallback(() => {
    if (campaignIndex >= CAMPAIGNS.length - 1) {
      setPhase("complete");
      return;
    }
    const nextIndex = campaignIndex + 1;
    setCampaignIndex(nextIndex);
    setBudgetLeft(CAMPAIGNS[nextIndex].budget);
    setPlaced([]);
    setSelectedId(null);
    setResult(null);
    setPhase("editing");
  }, [campaignIndex]);

  return (
    <Flex
      position="absolute"
      inset="0"
      direction="column"
      overflow="hidden"
      bgColor="#E7E3DC"
      color="#3D4140"
      data-office-social-canvas={phase}
    >
      <Flex
        position="relative"
        zIndex={4}
        h="66px"
        flexShrink={0}
        alignItems="center"
        justifyContent="space-between"
        px="13px"
        bg="linear-gradient(135deg, #283E43 0%, #3E665F 100%)"
        color="white"
        borderBottom="4px solid #1D3135"
        boxShadow="0 5px 0 rgba(31,42,41,0.18)"
      >
        <Flex minW="0" alignItems="center" gap="9px">
          <Flex w="37px" h="37px" flexShrink={0} alignItems="center" justifyContent="center" border="2px solid rgba(255,255,255,0.34)" borderRadius="9px" bgColor="rgba(255,255,255,0.12)">
            <FiImage size={21} />
          </Flex>
          <Flex minW="0" direction="column">
            <Text color="#EACB76" fontSize="8px" fontWeight="900" letterSpacing="0.14em">SOCIAL CANVAS</Text>
            <Text fontSize="16px" fontWeight="900" lineHeight="1.1">小店貼文工作台</Text>
            <Text mt="2px" color="rgba(255,255,255,0.66)" fontSize="8px" fontWeight="800">第 {campaignIndex + 1}/{CAMPAIGNS.length} 篇・{campaign.brief}</Text>
          </Flex>
        </Flex>
        <Flex gap="6px" flexShrink={0}>
          <Flex minW="46px" h="40px" direction="column" alignItems="center" justifyContent="center" border="2px solid #18292C" borderRadius="7px" bgColor="#F0CC62" color="#443B2E" boxShadow="0 3px 0 #18292C">
            <Text fontSize="7px" fontWeight="900">預算</Text>
            <Flex alignItems="center" gap="1px"><FiDollarSign size={11} /><Text fontSize="15px" fontWeight="900" lineHeight="1">{budgetLeft}</Text></Flex>
          </Flex>
          <Flex minW="50px" h="40px" direction="column" alignItems="center" justifyContent="center" border="2px solid #18292C" borderRadius="7px" bgColor="#EFF2DC" color="#365048" boxShadow="0 3px 0 #18292C">
            <Text fontSize="7px" fontWeight="900">人氣</Text>
            <Flex alignItems="center" gap="2px"><FiHeart size={10} /><Text fontSize="14px" fontWeight="900" lineHeight="1">{popularity}</Text></Flex>
          </Flex>
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={3} h="52px" flexShrink={0} alignItems="center" justifyContent="space-between" gap="8px" px="12px" borderBottom="2px solid #C6C0B7" bgColor="#FAF7F0">
        <Flex minW="0" direction="column">
          <Text color="#8A7352" fontSize="7px" fontWeight="900" letterSpacing="0.1em">TODAY&apos;S BRIEF</Text>
          <Text fontSize="11px" fontWeight="900" lineHeight="1.25">受眾：{campaign.audience}</Text>
        </Flex>
        <Flex gap="4px" flexShrink={0}>
          {campaign.goalTags.map((tag) => (
            <Flex key={tag} h="24px" alignItems="center" px="7px" border="2px solid #94795A" borderRadius="999px" bgColor="#F2E1BC" color="#725A3F">
              <Text fontSize="7px" fontWeight="900">＋{TAG_LABELS[tag]}</Text>
            </Flex>
          ))}
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={2} flex="1" minH="0" direction="column" alignItems="center" px="10px" pt="7px">
        <Flex w="100%" h="32px" flexShrink={0} alignItems="center" justifyContent="space-between" px="7px" border="2px solid #B8B3AA" borderRadius="7px 7px 0 0" bgColor="#F5F3EF">
          <Flex alignItems="center" gap="5px">
            <Flex w="22px" h="22px" alignItems="center" justifyContent="center" border="1px solid #C8C2B9" borderRadius="5px" bgColor="white"><FiMousePointer size={12} /></Flex>
            <Text color="#716C65" fontSize="8px" fontWeight="900">拖曳調整位置</Text>
          </Flex>
          <Flex alignItems="center" gap="5px">
            <Text color="#9A938A" fontSize="7px" fontWeight="800">1080 × 1080</Text>
            <Flex as="button" w="23px" h="23px" alignItems="center" justifyContent="center" border="1px solid #C8C2B9" borderRadius="5px" bgColor="white" onClick={resetCanvas} aria-label="重設畫布"><FiRotateCcw size={12} /></Flex>
          </Flex>
        </Flex>

        <Flex w="100%" minH="0" flex="1" alignItems="center" justifyContent="center" borderX="2px solid #B8B3AA" bgColor="#D5D2CC" bgImage="radial-gradient(#B9B5AE 1px, transparent 1px)" bgSize="10px 10px">
          <Box
            ref={canvasRef}
            position="relative"
            w="min(304px, calc(100vw - 70px))"
            aspectRatio="1"
            overflow="hidden"
            bgColor="#D7B28C"
            bgImage={`url("${campaign.backgroundImage}")`}
            bgSize="cover"
            backgroundPosition={campaign.backgroundPosition}
            boxShadow="0 8px 18px rgba(45,39,35,0.24)"
            onPointerDown={() => setSelectedId(null)}
          >
            <Box position="absolute" inset="0" bg={campaign.tint} pointerEvents="none" />
            <Flex position="absolute" top="12px" left="14px" right="14px" zIndex={2} alignItems="center" justifyContent="space-between" color={campaign.titleColor} pointerEvents="none">
              <Text fontSize="7px" fontWeight="900" letterSpacing="0.14em">MOMENTS BAKE SHOP</Text>
              <Text fontSize="7px" fontWeight="900">◌ DAILY 04</Text>
            </Flex>
            <Flex
              position="absolute"
              zIndex={2}
              left="16px"
              right="16px"
              bottom="17px"
              direction="column"
              alignItems={campaign.titleAlign === "center" ? "center" : "flex-start"}
              color={campaign.titleColor}
              textAlign={campaign.titleAlign}
              textShadow="0 2px 8px rgba(52,31,23,0.48)"
              pointerEvents="none"
            >
              <Text fontSize="23px" fontWeight="900" lineHeight="1.08" letterSpacing="0.03em">{campaign.title}</Text>
              <Text mt="5px" fontSize="8px" fontWeight="900" letterSpacing="0.12em">{campaign.subtitle}</Text>
              <Box mt="7px" w={campaign.titleAlign === "center" ? "74px" : "48px"} borderTop="3px solid currentColor" opacity={0.85} />
            </Flex>

            {placed.map((item) => {
              const sticker = STICKERS.find((definition) => definition.id === item.stickerId);
              if (!sticker) return null;
              const isSelected = item.instanceId === selectedId;
              return (
                <Flex
                  key={item.instanceId}
                  position="absolute"
                  zIndex={isSelected ? 12 : 5}
                  left={`${item.x}%`}
                  top={`${item.y}%`}
                  w="67px"
                  h="67px"
                  alignItems="center"
                  justifyContent="center"
                  border={isSelected ? "2px dashed #2E7C75" : "2px solid transparent"}
                  cursor="grab"
                  touchAction="none"
                  transform={`translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`}
                  filter="drop-shadow(0 3px 2px rgba(38,27,22,0.2))"
                  onPointerDown={(event) => handleStickerPointerDown(event, item)}
                  onPointerMove={handleStickerPointerMove}
                  onPointerUp={handleStickerPointerUp}
                  onPointerCancel={handleStickerPointerUp}
                >
                  <Box animation={`${stickerPop} 250ms cubic-bezier(0.2,0.8,0.2,1) both`}>
                    <StickerSprite sticker={sticker} size="63px" />
                  </Box>
                  {isSelected ? (
                    <>
                      <Box position="absolute" left="-4px" top="-4px" w="7px" h="7px" border="1px solid white" bgColor="#2E7C75" />
                      <Box position="absolute" right="-4px" top="-4px" w="7px" h="7px" border="1px solid white" bgColor="#2E7C75" />
                      <Box position="absolute" left="-4px" bottom="-4px" w="7px" h="7px" border="1px solid white" bgColor="#2E7C75" />
                      <Box position="absolute" right="-4px" bottom="-4px" w="7px" h="7px" border="1px solid white" bgColor="#2E7C75" />
                    </>
                  ) : null}
                </Flex>
              );
            })}
          </Box>
        </Flex>

        <Flex w="100%" h="35px" flexShrink={0} alignItems="center" justifyContent="center" gap="6px" border="2px solid #B8B3AA" borderRadius="0 0 7px 7px" bgColor="#F5F3EF">
          {selectedSticker ? (
            <>
              <Text mr="3px" color="#716C65" fontSize="8px" fontWeight="900">已選：{STICKERS.find((item) => item.id === selectedSticker.stickerId)?.label}</Text>
              <Flex as="button" w="25px" h="25px" alignItems="center" justifyContent="center" border="1px solid #CBC5BC" borderRadius="5px" bgColor="white" aria-label="旋轉貼紙" onClick={() => updateSelected((item) => ({ ...item, rotation: item.rotation + 15 }))}><FiRotateCw size={12} /></Flex>
              <Flex as="button" w="25px" h="25px" alignItems="center" justifyContent="center" border="1px solid #CBC5BC" borderRadius="5px" bgColor="white" aria-label="調整貼紙大小" onClick={() => updateSelected((item) => ({ ...item, scale: item.scale >= 1.2 ? 0.8 : item.scale + 0.2 }))}><FiMaximize2 size={12} /></Flex>
              <Flex as="button" w="25px" h="25px" alignItems="center" justifyContent="center" border="1px solid #D8B4AD" borderRadius="5px" bgColor="#FFF0EC" color="#A44F49" aria-label="刪除貼紙" onClick={removeSelected}><FiTrash2 size={12} /></Flex>
            </>
          ) : (
            <Text color="#8D8780" fontSize="8px" fontWeight="800">從下方素材庫加入貼紙，點選後可旋轉、縮放或刪除</Text>
          )}
        </Flex>
      </Flex>

      <Flex position="relative" zIndex={4} flexShrink={0} direction="column" px="10px" pt="6px" pb="8px" borderTop="2px solid #C6C0B7" bgColor="#FAF8F3">
        <Flex h="23px" alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap="5px"><FiStar size={12} /><Text fontSize="9px" fontWeight="900">貼紙素材庫</Text><Text color="#9A938A" fontSize="7px" fontWeight="800">已解鎖 {unlockedStickers.length}/{STICKERS.length}</Text></Flex>
          <Text color="#947447" fontSize="8px" fontWeight="900">剩餘預算 {budgetLeft}</Text>
        </Flex>
        <Grid mt="3px" templateColumns="repeat(6, minmax(0, 1fr))" gap="4px">
          {STICKERS.map((sticker) => {
            const isUnlocked = popularity >= sticker.unlockAt;
            const isUsed = placed.some((item) => item.stickerId === sticker.id);
            const canAfford = budgetLeft >= sticker.cost;
            return (
              <Flex
                key={sticker.id}
                as="button"
                position="relative"
                minW="0"
                h="58px"
                direction="column"
                alignItems="center"
                justifyContent="center"
                border={isUsed ? "2px solid #3D8174" : "1px solid #D4CEC4"}
                borderRadius="7px"
                bgColor={isUsed ? "#E0F1E7" : "white"}
                opacity={!isUnlocked || !canAfford ? 0.56 : 1}
                overflow="hidden"
                cursor="pointer"
                onClick={() => addSticker(sticker)}
              >
                <StickerSprite sticker={sticker} size="39px" />
                <Flex position="absolute" right="2px" bottom="2px" h="14px" alignItems="center" gap="1px" px="3px" borderRadius="4px" bgColor={canAfford ? "#3C5550" : "#A5564F"} color="white">
                  <Text fontSize="7px" fontWeight="900">${sticker.cost}</Text>
                </Flex>
                {!isUnlocked ? (
                  <Flex position="absolute" inset="0" direction="column" alignItems="center" justifyContent="center" bgColor="rgba(54,52,49,0.72)" color="white">
                    <FiLock size={13} />
                    <Text mt="2px" fontSize="7px" fontWeight="900">{sticker.unlockAt}</Text>
                  </Flex>
                ) : null}
                {isUsed ? <Flex position="absolute" left="2px" top="2px" w="15px" h="15px" alignItems="center" justifyContent="center" borderRadius="999px" bgColor="#4F967F" color="white"><FiCheck size={9} /></Flex> : null}
              </Flex>
            );
          })}
        </Grid>
        <Flex
          as="button"
          position="relative"
          mt="7px"
          h="43px"
          alignItems="center"
          justifyContent="center"
          gap="8px"
          overflow="hidden"
          border="3px solid #244C42"
          borderRadius="8px"
          bgColor={placed.length >= 2 ? "#4C927B" : "#83928C"}
          color="white"
          boxShadow="0 4px 0 #244C42"
          onClick={publishPost}
        >
          <Box position="absolute" top="0" bottom="0" w="44px" bg="linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" animation={placed.length >= 2 ? `${publishSweep} 2100ms ease-in-out infinite` : undefined} />
          <FiSend size={15} />
          <Text fontSize="12px" fontWeight="900">發佈這篇貼文</Text>
          <Text color="rgba(255,255,255,0.74)" fontSize="8px" fontWeight="800">{placed.length}/6 個素材</Text>
        </Flex>
      </Flex>

      {notice ? (
        <Flex key={notice.nonce} position="absolute" zIndex={80} left="50%" bottom="181px" minH="32px" maxW="310px" alignItems="center" px="12px" border="2px solid #5C4D40" borderRadius="7px" bgColor="#FFF0CB" color="#665340" boxShadow="0 5px 12px rgba(39,30,24,0.28)" transform="translateX(-50%)" animation={`${panelIn} 180ms ease both`} pointerEvents="none">
          <Text fontSize="9px" fontWeight="900">{notice.text}</Text>
        </Flex>
      ) : null}

      {phase === "intro" ? (
        <Flex position="absolute" inset="0" zIndex={120} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(17,25,26,0.8)" backdropFilter="blur(4px)">
          <Flex w="100%" direction="column" alignItems="center" p="20px" border="4px solid #314941" borderRadius="13px" bgColor="#FFF3D4" color="#4B443E" textAlign="center" boxShadow="8px 9px 0 rgba(8,14,15,0.5)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="67px" h="67px" alignItems="center" justifyContent="center" border="4px solid #8D513F" borderRadius="13px" bgColor="#E46E55" color="#FFF8E8" boxShadow="0 5px 0 #8D513F"><FiImage size={34} /></Flex>
            <Text mt="15px" color="#9B6E32" fontSize="9px" fontWeight="900" letterSpacing="0.16em">辦公遊戲方案 4</Text>
            <Text mt="4px" fontSize="24px" fontWeight="900">小店貼文工作台</Text>
            <Text mt="9px" color="#76695D" fontSize="11px" fontWeight="800" lineHeight="1.65">
              用有限預算挑選貼紙，拖到社群貼文上完成構圖。貼紙越符合本次主題、版面分布越好，發佈後獲得的人氣越多；人氣還能解鎖新的素材。
            </Text>
            <Grid mt="13px" w="100%" templateColumns="repeat(3, 1fr)" gap="7px">
              {[
                { icon: <FiDollarSign size={19} />, label: "控制預算" },
                { icon: <FiMousePointer size={19} />, label: "自由排版" },
                { icon: <FiTrendingUp size={19} />, label: "人氣解鎖" },
              ].map((item) => (
                <Flex key={item.label} h="63px" direction="column" alignItems="center" justifyContent="center" gap="5px" border="2px dashed #C59D65" borderRadius="8px" bgColor="#F6E2B6" color="#725D44">{item.icon}<Text fontSize="8px" fontWeight="900">{item.label}</Text></Flex>
              ))}
            </Grid>
            <Flex as="button" mt="16px" w="100%" h="47px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #264A40" borderRadius="8px" bgColor="#4F8D78" color="white" boxShadow="0 5px 0 #264A40" onClick={() => setPhase("editing")}><FiMousePointer size={17} /><Text fontSize="13px" fontWeight="900">打開第一份行銷需求</Text></Flex>
            <Text as="button" mt="10px" color="#9A8B7D" fontSize="10px" fontWeight="800" onClick={onSkip}>略過工作小遊戲</Text>
          </Flex>
        </Flex>
      ) : null}

      {phase === "result" && result ? (
        <Flex position="absolute" inset="0" zIndex={125} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(18,25,26,0.78)" backdropFilter="blur(4px)">
          <Flex position="relative" w="100%" direction="column" alignItems="center" p="20px" border="4px solid #304A42" borderRadius="13px" bgColor="#F7F3E5" color="#405049" textAlign="center" boxShadow="8px 9px 0 rgba(8,14,15,0.5)" animation={`${panelIn} 260ms ease both`} overflow="hidden">
            {[0, 1, 2, 3].map((index) => <Box key={index} position="absolute" right={`${12 + index * 21}%`} top="42%" color={index % 2 ? "#E16D5B" : "#E0B64B"} animation={`${heartFloat} ${1200 + index * 130}ms ${index * 100}ms ease-out infinite`}><FiHeart size={16 + index * 2} fill="currentColor" /></Box>)}
            <Flex w="64px" h="64px" alignItems="center" justifyContent="center" border="4px solid #934C45" borderRadius="999px" bgColor="#E56E61" color="white" boxShadow="0 5px 0 #934C45"><FiHeart size={31} fill="currentColor" /></Flex>
            <Text mt="13px" color="#9A7632" fontSize="9px" fontWeight="900" letterSpacing="0.14em">POST PUBLISHED</Text>
            <Text mt="3px" fontSize="23px" fontWeight="900">貼文獲得 +{result.gain} 人氣</Text>
            <Text mt="5px" color="#748078" fontSize="10px" fontWeight="800">目前累積 {popularity} 人氣・已發佈 {publishedCount} 篇</Text>

            <Grid mt="14px" w="100%" templateColumns="repeat(3, 1fr)" gap="6px">
              {[
                { label: "主題命中", value: `${result.themeHits}/${campaign.goalTags.length}` },
                { label: "版面分區", value: `${result.quadrants}/4` },
                { label: "剩餘預算", value: `＋${result.leftover * 2}` },
              ].map((metric) => (
                <Flex key={metric.label} h="57px" direction="column" alignItems="center" justifyContent="center" border="2px solid #D1C5AE" borderRadius="8px" bgColor="#FFF9E9"><Text color="#8B7A64" fontSize="7px" fontWeight="900">{metric.label}</Text><Text mt="3px" fontSize="17px" fontWeight="900">{metric.value}</Text></Flex>
              ))}
            </Grid>

            {result.newlyUnlocked.length > 0 ? (
              <Flex mt="12px" w="100%" direction="column" p="9px" border="2px solid #D4A94B" borderRadius="9px" bgColor="#FFF0B9" animation={`${unlockGlow} 1200ms ease-in-out infinite`}>
                <Flex alignItems="center" justifyContent="center" gap="5px" color="#8B6929"><FiUnlock size={13} /><Text fontSize="9px" fontWeight="900">新貼紙解鎖</Text></Flex>
                <Flex mt="7px" justifyContent="center" gap="8px">
                  {result.newlyUnlocked.map((sticker) => (
                    <Flex key={sticker.id} alignItems="center" gap="3px" px="5px" py="3px" border="1px solid #D8B766" borderRadius="6px" bgColor="white"><StickerSprite sticker={sticker} size="28px" /><Text fontSize="7px" fontWeight="900">{sticker.label}</Text></Flex>
                  ))}
                </Flex>
              </Flex>
            ) : null}

            <Flex as="button" mt="15px" w="100%" h="47px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #264A40" borderRadius="8px" bgColor="#4F8D78" color="white" boxShadow="0 5px 0 #264A40" onClick={continueAfterResult}>
              {campaignIndex >= CAMPAIGNS.length - 1 ? <FiTrendingUp size={17} /> : <FiImage size={17} />}
              <Text fontSize="13px" fontWeight="900">{campaignIndex >= CAMPAIGNS.length - 1 ? "查看本日行銷成果" : "接下一份貼文需求"}</Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {phase === "complete" ? (
        <Flex position="absolute" inset="0" zIndex={130} alignItems="center" justifyContent="center" px="20px" bgColor="rgba(15,23,24,0.83)" backdropFilter="blur(5px)">
          <Flex w="100%" direction="column" alignItems="center" p="22px" border="4px solid #2B4940" borderRadius="13px" bgColor="#F1F1D8" color="#3D4D46" textAlign="center" boxShadow="8px 9px 0 rgba(7,13,14,0.52)" animation={`${panelIn} 260ms ease both`}>
            <Flex w="69px" h="69px" alignItems="center" justifyContent="center" border="4px solid #315E50" borderRadius="14px" bgColor="#64A58A" color="white" boxShadow="0 5px 0 #315E50"><FiTrendingUp size={35} /></Flex>
            <Text mt="14px" color="#8C7330" fontSize="9px" fontWeight="900" letterSpacing="0.14em">CAMPAIGN COMPLETE</Text>
            <Text mt="3px" fontSize="24px" fontWeight="900">今天的貼文排程完成</Text>
            <Text mt="8px" color="#6D7B74" fontSize="11px" fontWeight="800" lineHeight="1.6">你完成 {publishedCount} 篇社群貼文，累積 {popularity} 人氣，並解鎖 {unlockedStickers.length} 款手繪素材。</Text>
            <Flex mt="14px" justifyContent="center" gap="4px">
              {unlockedStickers.slice(-6).map((sticker) => <Flex key={sticker.id} w="42px" h="42px" alignItems="center" justifyContent="center" border="2px solid #CDBA8D" borderRadius="7px" bgColor="#FFF9E6" transform={`rotate(${sticker.sheetIndex % 2 ? 4 : -4}deg)`}><StickerSprite sticker={sticker} size="36px" /></Flex>)}
            </Flex>
            <Flex mt="13px" alignItems="center" gap="6px" color="#A8574E"><FiEye size={15} /><Text fontSize="10px" fontWeight="900">人氣會繼續替下一次創作帶來新素材</Text></Flex>
            <Flex as="button" mt="18px" w="100%" h="48px" alignItems="center" justifyContent="center" gap="8px" border="3px solid #264A40" borderRadius="8px" bgColor="#4F8D78" color="white" boxShadow="0 5px 0 #264A40" onClick={onComplete}><FiCheck size={18} /><Text fontSize="13px" fontWeight="900">關閉工作台，前往便利商店</Text></Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

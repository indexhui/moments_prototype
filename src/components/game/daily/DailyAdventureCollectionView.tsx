"use client";

import { useMemo, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import {
  DAILY_ADVENTURE_LOCATIONS,
  DAILY_ADVENTURE_ROUTE_TILES,
  type DailyAdventureRecordKind,
} from "@/lib/game/dailyAdventure";
import { ROUTES } from "@/lib/routes";
import { DailyAdventureRecordArtwork, DailyAdventureShell, useDailyAdventureData } from "./DailyAdventureShell";

const FILTERS: Array<{ id: "all" | DailyAdventureRecordKind; label: string }> = [
  { id: "all", label: "全部" },
  { id: "text", label: "事件" },
  { id: "comic", label: "漫畫" },
  { id: "photo", label: "照片" },
];

const KIND_LABEL: Record<DailyAdventureRecordKind, string> = {
  text: "文字事件",
  comic: "日常漫畫",
  photo: "冒險照片",
};

export function DailyAdventureCollectionView() {
  const { state } = useDailyAdventureData();
  const [filter, setFilter] = useState<"all" | DailyAdventureRecordKind>("all");
  const records = useMemo(
    () => state.collectedRecords.filter((record) => filter === "all" || record.kind === filter).reverse(),
    [filter, state.collectedRecords],
  );

  return (
    <DailyAdventureShell title="冒險收藏" backHref={ROUTES.gameDaily}>
      <Flex alignItems="baseline" justifyContent="space-between">
        <Text color="#604A3A" fontSize="15px" fontWeight="900">已收集的路線拼圖</Text>
        <Text color="#9A7D67" fontSize="11px" fontWeight="900">{state.collectedRouteTileIds.length} 張</Text>
      </Flex>
      <Flex mt="8px" gap="8px" overflowX="auto" pb="5px" css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {state.collectedRouteTileIds.map((id) => {
          const tile = DAILY_ADVENTURE_ROUTE_TILES[id];
          if (!tile) return null;
          const location = DAILY_ADVENTURE_LOCATIONS[tile.locationId];
          return (
            <Flex key={id} minW="104px" h="122px" borderRadius="15px" bgColor="#FFFFFF" direction="column" overflow="hidden" boxShadow="0 5px 12px rgba(79,57,40,0.08)">
              <Flex h="78px" overflow="hidden"><img src={tile.imagePath} alt={`${location.name}${tile.variantLabel}拼圖`} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></Flex>
              <Flex flex="1" px="8px" direction="column" justifyContent="center"><Text color="#654E3E" fontSize="11px" fontWeight="900">{location.name}</Text><Text color="#9A806C" fontSize="9px">{tile.variantLabel}</Text></Flex>
            </Flex>
          );
        })}
      </Flex>

      <Flex mt="16px" alignItems="baseline" justifyContent="space-between">
        <Text color="#604A3A" fontSize="15px" fontWeight="900">旅途紀錄</Text>
        <Text color="#9A7D67" fontSize="11px" fontWeight="900">{state.collectedRecords.length} 則</Text>
      </Flex>
      <Flex mt="8px" gap="6px">
        {FILTERS.map((item) => (
          <Flex as="button" key={item.id} h="31px" px="12px" borderRadius="999px" bgColor={filter === item.id ? "#9B704F" : "#E8DCCA"} color={filter === item.id ? "white" : "#806550"} alignItems="center" cursor="pointer" onClick={() => setFilter(item.id)}>
            <Text color="inherit" fontSize="11px" fontWeight="900">{item.label}</Text>
          </Flex>
        ))}
      </Flex>

      {records.length > 0 ? (
        <Flex mt="10px" wrap="wrap" gap="9px">
          {records.map((record) => (
            <Flex key={record.id} w="calc(50% - 5px)" minH="184px" borderRadius="16px" bgColor="#FFFFFF" p="6px" direction="column" boxShadow="0 6px 14px rgba(79,57,40,0.08)">
              <DailyAdventureRecordArtwork record={record} compact />
              <Text mt="7px" px="3px" color="#5E493A" fontSize="12px" fontWeight="900" lineHeight="1.25">{record.title}</Text>
              <Text mt="2px" px="3px" pb="4px" color="#9A806C" fontSize="9px">{KIND_LABEL[record.kind]}・{DAILY_ADVENTURE_LOCATIONS[record.locationId].name}</Text>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Flex mt="12px" minH="178px" borderRadius="18px" bgColor="rgba(255,255,255,0.72)" direction="column" alignItems="center" justifyContent="center" px="28px">
          <Text color="#7A604D" fontSize="15px" fontWeight="900">還沒有這類收藏</Text>
          <Text mt="5px" color="#A08A78" fontSize="11px" textAlign="center" lineHeight="1.45">選擇不同夥伴與已收集的路線拼圖，完成冒險後就會把內容收進這裡。</Text>
        </Flex>
      )}
    </DailyAdventureShell>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Box, Button, Flex, Grid, Image, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  CABINET_BOX_STICKERS,
  CABINET_BOX_STAR_THRESHOLDS,
  type CabinetBoxScore,
} from "@/lib/game/cabinetBoxScoring";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";

const ART_ROOT = "/images/minigame/box_stacking";
const paperIn = keyframes`
  from { opacity: 0; transform: translateY(18px) rotate(-2deg); }
  to { opacity: 1; transform: translateY(0) rotate(0); }
`;
const starIn = keyframes`
  0% { opacity: 0; transform: scale(0.4) translateY(8px); }
  65% { opacity: 1; transform: scale(1.16) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`;

export function CabinetBoxStackResultOverlay({
  locale,
  score,
  isAdvanced,
  isGameOver,
  rewardHeading,
  rewardLabel,
  footnote,
  onContinue,
  onRetry,
}: {
  locale: ExhibitionLocale;
  score: CabinetBoxScore;
  isAdvanced: boolean;
  isGameOver: boolean;
  rewardHeading?: string;
  rewardLabel?: string | null;
  footnote?: string;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const copy = {
    zh: {
      title: "結算", layers: "堆疊層數", layerUnit: "層", time: "堆疊用時", seconds: "秒",
      stickers: "貼紙加分", stickerUnit: "張", quickFlip: "瞬翻即放", times: "次",
      rewardStickers: "獎勵貼紙", total: "總分", points: "分",
      rating: (count: number) => `${count} 顆星，共 3 顆`, retry: "再試一次", finish: "完成",
    },
    ja: {
      title: "リザルト", layers: "積んだ高さ", layerUnit: "段", time: "積み時間", seconds: "秒",
      stickers: "シール加点", stickerUnit: "枚", quickFlip: "即回転", times: "回",
      rewardStickers: "獲得シール", total: "合計", points: "点",
      rating: (count: number) => `3つ星中${count}つ星`, retry: "もう一度", finish: "完了",
    },
    en: {
      title: "Results", layers: "Stack height", layerUnit: "layers", time: "Stack time", seconds: "sec",
      stickers: "Stickers", stickerUnit: "", quickFlip: "Quick flips", times: "",
      rewardStickers: "Rewards", total: "Total", points: "pts",
      rating: (count: number) => `${count} of 3 stars`, retry: "Try Again", finish: "Finish",
    },
  }[locale];
  const number = (value: number) => value.toLocaleString("en-US");
  const stickerCount = CABINET_BOX_STICKERS.reduce((sum, sticker) => sum + score.stickers[sticker.id], 0);
  const rows = [
    { id: "layers", label: copy.layers, value: score.layers, unit: copy.layerUnit, points: score.layerPoints },
    { id: "seconds", label: copy.time, value: (score.stackingElapsedMs / 1000).toFixed(1), unit: copy.seconds, points: score.speedPoints },
    { id: "stickers", label: copy.stickers, value: stickerCount, unit: copy.stickerUnit, points: score.stickerPoints },
    ...(isAdvanced ? [{ id: "quick-flips", label: copy.quickFlip, value: score.quickFlips, unit: copy.times, points: score.quickFlipPoints }] : []),
  ];

  useEffect(() => {
    primaryButtonRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Flex
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      data-box-stack-result={isGameOver ? "game-over" : "success"}
      data-result-mode={isAdvanced ? "advanced" : "standard"}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      position="absolute"
      inset="0"
      zIndex={310}
      bg="rgba(36, 31, 24, 0.54)"
      align="center"
      justify="safe center"
      direction="column"
      overflowY="auto"
      py="16px"
      containerType="size"
      cursor="default"
      touchAction="pan-y"
    >
      <Flex
        w="min(92cqw, 66cqh, 410px)"
        flexShrink={0}
        direction="column"
        align="center"
        containerType="inline-size"
        animation={`${paperIn} 420ms cubic-bezier(0.2,0.8,0.2,1) both`}
        css={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
      >
        <Box position="relative" w="100%" aspectRatio={643 / 758}>
          <Image
            src={`${ART_ROOT}/result-paper.png`}
            alt=""
            draggable={false}
            position="absolute"
            inset="0"
            w="100%"
            h="100%"
            objectFit="contain"
            pointerEvents="none"
            filter="drop-shadow(0 10px 14px rgba(25, 19, 12, 0.2))"
          />
          <Flex
            data-result-paper-content="true"
            position="absolute"
            top="18%"
            bottom="8%"
            left="12%"
            right="12%"
            direction="column"
            transform="rotate(1.9deg)"
            color="#70553F"
          >
            <Text
              as="h2"
              textAlign="center"
              pb={isAdvanced ? "2cqw" : "3cqw"}
              borderBottom="2px solid #9D8062"
              fontSize="8.5cqw"
              fontWeight="700"
              lineHeight="1.2"
              letterSpacing="0.12em"
            >{copy.title}</Text>
            <Box as="dl" py={isAdvanced ? "0.5cqw" : "1cqw"}>
              {rows.map((row, index) => (
                <Grid
                  key={row.id}
                  data-result-row={row.id}
                  templateColumns="1fr auto minmax(15cqw, auto)"
                  alignItems="baseline"
                  gap="1.5cqw"
                  lineHeight="1.2"
                  minH={isAdvanced ? "8cqw" : "10cqw"}
                  py="1.2cqw"
                  borderBottom={index < rows.length - 1 ? "1px dashed #C7B9A5" : undefined}
                >
                  <Text as="dt" fontSize="clamp(11px, 3.5cqw, 14px)" fontWeight="500" whiteSpace="nowrap">{row.label}</Text>
                  <Text as="dd" fontSize="clamp(10px, 3.3cqw, 13px)" color="#9A826A" whiteSpace="nowrap">
                    <Box as="span" data-result-value={row.id}>{row.value}</Box> {row.unit}
                  </Text>
                  <Text as="dd" data-result-points={row.id} textAlign="right" fontSize="4.7cqw" lineHeight="1.15" fontWeight="700" fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                    +{number(row.points)}
                  </Text>
                </Grid>
              ))}
            </Box>
            {isAdvanced ? (
              <Flex data-result-rewards="true" align="center" justify="space-between" gap="1cqw" py="1.5cqw" borderTop="1px dashed #C7B9A5">
                <Text fontSize="clamp(10px, 3cqw, 12px)" color="#9A826A" whiteSpace="nowrap">{copy.rewardStickers}</Text>
                {CABINET_BOX_STICKERS.map((sticker) => (
                  <Flex key={sticker.id} align="center" gap="0.5cqw" opacity={score.stickers[sticker.id] > 0 ? 1 : 0.4}>
                    <Image src={sticker.url} alt={`${sticker.label} ${copy.stickers}`} w="8.5cqw" h="8.5cqw" objectFit="contain" draggable={false} />
                    <Box fontSize="clamp(9px, 2.7cqw, 11px)" lineHeight="1.25">
                      <Text>{sticker.label}</Text>
                      <Text data-reward-sticker={sticker.id}>×{score.stickers[sticker.id]}</Text>
                    </Box>
                  </Flex>
                ))}
              </Flex>
            ) : null}
            <Flex align="baseline" justify="space-between" py="2cqw" borderTop="2px solid #9D8062">
              <Text fontSize="4.5cqw" fontWeight="700">{copy.total}</Text>
              <Flex align="baseline" gap="1cqw">
                <Text data-result-total="true" fontSize={isAdvanced ? "9cqw" : "11cqw"} fontWeight="800" lineHeight="1" fontVariantNumeric="tabular-nums">{number(score.total)}</Text>
                <Text fontSize="clamp(10px, 3cqw, 13px)">{copy.points}</Text>
              </Flex>
            </Flex>
            <Flex flex="1" align="center" justify="space-around" role="img" aria-label={copy.rating(score.stars)}>
              {CABINET_BOX_STAR_THRESHOLDS.map((threshold, index) => (
                <Flex key={threshold} direction="column" align="center" gap="0.7cqw" aria-hidden="true">
                  <Box transform={`rotate(${[-10, 2, 12][index]}deg)`}>
                    <Image
                      src={`${ART_ROOT}/result-star-${index < score.stars ? "earned" : "empty"}.png`}
                      alt=""
                      draggable={false}
                      w={isAdvanced ? "12cqw" : "15cqw"}
                      h={isAdvanced ? "11cqw" : "14cqw"}
                      objectFit="contain"
                      opacity={index < score.stars ? 1 : 0.55}
                      animation={index < score.stars ? `${starIn} 480ms cubic-bezier(0.2,0.8,0.2,1) ${300 + index * 180}ms both` : undefined}
                      css={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
                    />
                  </Box>
                  <Text fontSize="clamp(9px, 2.9cqw, 12px)" lineHeight="1.2" color={index < score.stars ? "#947039" : "#A79D8C"}>
                    {number(threshold)} {copy.points}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Box>
        {!isGameOver && rewardLabel ? (
          <Text mt="10px" maxW="90%" color="#FFF7E6" textAlign="center" fontSize="12px" lineHeight="1.6">
            {rewardHeading ? `${rewardHeading} · ` : ""}{rewardLabel}
          </Text>
        ) : null}
        {!isGameOver && footnote ? (
          <Text mt="5px" maxW="90%" color="#EEE7D9" textAlign="center" fontSize="11px" lineHeight="1.65">{footnote}</Text>
        ) : null}
        <Button
          ref={primaryButtonRef}
          type="button"
          onClick={isGameOver ? onRetry : onContinue}
          w="86%"
          mt="16px"
          minH="44px"
          borderRadius="999px"
          bg="#FEEA98"
          color="#6F5138"
          fontSize="14px"
          fontWeight="700"
          boxShadow="0 3px 0 #9A7850"
          _hover={{ bg: "#FFF0B2" }}
          _active={{ transform: "translateY(2px)", boxShadow: "0 1px 0 #9A7850" }}
          _focusVisible={{ outline: "3px solid #FFF6DC", outlineOffset: "4px" }}
        >{isGameOver ? copy.retry : copy.finish}</Button>
      </Flex>
    </Flex>
  );
}

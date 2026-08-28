"use client";

import { Fragment, type ReactNode } from "react";
import { Text, type TextProps } from "@chakra-ui/react";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";

type DialogueTermCategory =
  | "character"
  | "momentling"
  | "diary"
  | "photo"
  | "clue"
  | "location";

type DialogueTerm = {
  text: string;
  category: DialogueTermCategory;
  color?: string;
};

const CORE_SPEAKER_COLORS = {
  mugi: "#FFE08A",
  beigo: "#A8E6CF",
  shiro: "#8FCBFF",
  narrator: "#E8DED4",
  coworker: "#C8D8FF",
  partTimer: "#FFD0A8",
  clerk: "#BCE7F2",
  mover: "#D2C2F2",
  staff: "#C9DDAF",
  friend: "#F4C7A1",
  owner: "#F6D58B",
  passerby: "#B8DFD8",
  salesperson: "#E6C6E8",
  supervisor: "#C8D6F0",
  customer: "#F4C7A1",
  elder: "#D2C2F2",
  woman: "#FFD0A8",
  system: "#E8DED4",
} as const;

const SUPPORTING_SPEAKER_PALETTE = [
  "#F4C7A1",
  "#C9DDAF",
  "#C8D6F0",
  "#E6C6E8",
  "#F6D58B",
  "#B8DFD8",
] as const;

const SPEAKER_ALIASES: Record<string, string> = {
  "小麥": "mugi",
  "ムギ": "mugi",
  mugi: "mugi",
  "小貝狗": "beigo",
  "ベイゴ": "beigo",
  beigo: "beigo",
  "小白": "shiro",
  "シロ": "shiro",
  shiro: "shiro",
  "旁白": "narrator",
  "ナレーション": "narrator",
  narration: "narrator",
  "同事": "coworker",
  "同僚": "coworker",
  coworker: "coworker",
  "工讀生": "partTimer",
  "アルバイト": "partTimer",
  "part-timer": "partTimer",
  "店員": "clerk",
  clerk: "clerk",
  "搬家工人": "mover",
  "業者さん": "mover",
  mover: "mover",
  movers: "mover",
  "工作人員": "staff",
  "スタッフ": "staff",
  staff: "staff",
  "朋友": "friend",
  "友達": "friend",
  friend: "friend",
  "老闆": "owner",
  "老闆娘": "owner",
  "早餐店老闆": "owner",
  "雜貨店老闆": "owner",
  "路人": "passerby",
  "被擋住路的路人": "passerby",
  "逼卡機前的路人": "passerby",
  "推銷員": "salesperson",
  "主管": "supervisor",
  "顧客": "customer",
  "阿伯": "elder",
  "電梯裡的女生": "woman",
  "獲得": "system",
  "引導": "system",
  "效果": "system",
};

const CATEGORY_COLORS: Record<Exclude<DialogueTermCategory, "character">, string> = {
  momentling: "#FFE08A",
  diary: "#FFC7AA",
  photo: "#9FE4E0",
  clue: "#C6E99B",
  location: "#C7C9FF",
};

const COMMON_CHARACTER_TERMS = {
  zh: ["小麥", "小貝狗", "小白"],
  ja: ["ムギ", "ベイゴ", "シロ"],
  en: ["Mugi", "Beigo", "Shiro"],
} as const;

const DIALOGUE_TERMS: Record<ExhibitionLocale, readonly DialogueTerm[]> = {
  zh: [
    { text: "黃金獵犬", category: "momentling" },
    { text: "小日獸", category: "momentling" },
    { text: "青蛙", category: "momentling" },
    { text: "公雞", category: "momentling" },
    { text: "山羊", category: "momentling" },
    { text: "海豹", category: "momentling" },
    { text: "浣熊", category: "momentling" },
    { text: "無尾熊", category: "momentling" },
    { text: "交換日記", category: "diary" },
    { text: "日記殘篇", category: "diary" },
    { text: "日記", category: "diary" },
    { text: "紙膠帶", category: "clue" },
    { text: "線索", category: "clue" },
    { text: "提示", category: "clue" },
    { text: "特殊地圖", category: "clue" },
    { text: "地圖", category: "clue" },
    { text: "照片", category: "photo" },
    { text: "相機", category: "photo" },
    { text: "捷運", category: "location" },
    { text: "便利商店", category: "location" },
    { text: "甜點店", category: "location" },
    { text: "街道", category: "location" },
    { text: "公園", category: "location" },
  ],
  ja: [
    { text: "ゴールデンレトリバー", category: "momentling" },
    { text: "ヒビモン", category: "momentling" },
    { text: "カエル", category: "momentling" },
    { text: "ニワトリ", category: "momentling" },
    { text: "ヤギ", category: "momentling" },
    { text: "アザラシ", category: "momentling" },
    { text: "アライグマ", category: "momentling" },
    { text: "コアラ", category: "momentling" },
    { text: "交換日記", category: "diary" },
    { text: "日記の断片", category: "diary" },
    { text: "日記", category: "diary" },
    { text: "マスキングテープ", category: "clue" },
    { text: "手がかり", category: "clue" },
    { text: "ヒント", category: "clue" },
    { text: "特別な地図", category: "clue" },
    { text: "地図", category: "clue" },
    { text: "写真", category: "photo" },
    { text: "カメラ", category: "photo" },
    { text: "地下鉄", category: "location" },
    { text: "コンビニ", category: "location" },
    { text: "スイーツ店", category: "location" },
    { text: "街", category: "location" },
    { text: "公園", category: "location" },
  ],
  en: [
    { text: "Golden Retriever", category: "momentling" },
    { text: "Momentlings", category: "momentling" },
    { text: "Momentling", category: "momentling" },
    { text: "frog", category: "momentling" },
    { text: "rooster", category: "momentling" },
    { text: "goat", category: "momentling" },
    { text: "seal", category: "momentling" },
    { text: "raccoon", category: "momentling" },
    { text: "koala", category: "momentling" },
    { text: "shared diary", category: "diary" },
    { text: "diary fragment", category: "diary" },
    { text: "diaries", category: "diary" },
    { text: "diary", category: "diary" },
    { text: "masking tape", category: "clue" },
    { text: "clues", category: "clue" },
    { text: "clue", category: "clue" },
    { text: "hint", category: "clue" },
    { text: "special map", category: "clue" },
    { text: "map", category: "clue" },
    { text: "photos", category: "photo" },
    { text: "photo", category: "photo" },
    { text: "camera", category: "photo" },
    { text: "metro", category: "location" },
    { text: "convenience store", category: "location" },
    { text: "dessert shop", category: "location" },
    { text: "street", category: "location" },
    { text: "park", category: "location" },
  ],
};

function normalizeSpeakerName(speaker: string) {
  return speaker.trim().toLocaleLowerCase("en");
}

function getStablePaletteIndex(value: string) {
  let hash = 0;
  for (const character of Array.from(value)) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash % SUPPORTING_SPEAKER_PALETTE.length;
}

export function getDialogueSpeakerColor(speaker: string) {
  const normalizedSpeaker = normalizeSpeakerName(speaker);
  const alias = SPEAKER_ALIASES[normalizedSpeaker] ?? normalizedSpeaker;
  const coreColor = CORE_SPEAKER_COLORS[alias as keyof typeof CORE_SPEAKER_COLORS];
  if (coreColor) return coreColor;
  return SUPPORTING_SPEAKER_PALETTE[getStablePaletteIndex(normalizedSpeaker)];
}

function getDialogueTerms(locale: ExhibitionLocale) {
  const characterTerms: DialogueTerm[] = COMMON_CHARACTER_TERMS[locale].map((text) => ({
    text,
    category: "character",
    color: getDialogueSpeakerColor(text),
  }));
  return [...characterTerms, ...DIALOGUE_TERMS[locale]].sort(
    (left, right) => Array.from(right.text).length - Array.from(left.text).length,
  );
}

export function renderDialogueSemanticText(
  text: string,
  locale: ExhibitionLocale,
): ReactNode {
  if (!text) return text;
  const terms = getDialogueTerms(locale);
  const comparableText = locale === "en" ? text.toLocaleLowerCase("en") : text;
  const nodes: ReactNode[] = [];
  const highlightedCategories = new Set<DialogueTermCategory>();
  let plainTextStart = 0;
  let cursor = 0;
  let highlightCount = 0;
  let hasHighlightedGameplayTerm = false;

  while (cursor < text.length) {
    const matchingTerm = terms.find((term) => {
      const comparableTerm = locale === "en" ? term.text.toLocaleLowerCase("en") : term.text;
      if (!comparableText.startsWith(comparableTerm, cursor)) return false;
      if (locale !== "en") return true;
      const previousCharacter = cursor > 0 ? comparableText[cursor - 1] : "";
      const nextCharacter = comparableText[cursor + comparableTerm.length] ?? "";
      const isWordCharacter = (character: string) => /[a-z0-9]/i.test(character);
      return !isWordCharacter(previousCharacter) && !isWordCharacter(nextCharacter);
    });

    if (!matchingTerm) {
      cursor += 1;
      continue;
    }

    const shouldHighlight =
      highlightCount < 2 &&
      !highlightedCategories.has(matchingTerm.category) &&
      !(matchingTerm.category === "character" && hasHighlightedGameplayTerm);

    if (!shouldHighlight) {
      cursor += matchingTerm.text.length;
      continue;
    }

    if (plainTextStart < cursor) nodes.push(text.slice(plainTextStart, cursor));
    const matchedText = text.slice(cursor, cursor + matchingTerm.text.length);
    const color =
      matchingTerm.color ??
      CATEGORY_COLORS[matchingTerm.category as Exclude<DialogueTermCategory, "character">];
    nodes.push(
      <span
        key={`${cursor}-${matchingTerm.text}`}
        data-dialogue-term={matchingTerm.category}
        style={{
          color,
          fontWeight: 800,
          textShadow: "0 1px 1px rgba(55, 37, 25, 0.42)",
        }}
      >
        {matchedText}
      </span>,
    );
    highlightedCategories.add(matchingTerm.category);
    highlightCount += 1;
    if (matchingTerm.category !== "character") hasHighlightedGameplayTerm = true;
    cursor += matchingTerm.text.length;
    plainTextStart = cursor;
  }

  if (plainTextStart < text.length) nodes.push(text.slice(plainTextStart));
  return nodes.length > 0 ? nodes.map((node, index) => <Fragment key={index}>{node}</Fragment>) : text;
}

export function DialogueSpeakerName({
  speaker,
  ...textProps
}: Omit<TextProps, "children"> & { speaker: string }) {
  const color = getDialogueSpeakerColor(speaker);
  return (
    <Text
      color={color}
      fontWeight="800"
      lineHeight="1.2"
      letterSpacing="0.02em"
      textShadow="0 1px 2px rgba(55, 37, 25, 0.5)"
      w="fit-content"
      data-dialogue-speaker={speaker}
      {...textProps}
    >
      {speaker}
    </Text>
  );
}

export function DialogueSemanticText({
  text,
  locale,
  ...textProps
}: Omit<TextProps, "children"> & { text: string; locale: ExhibitionLocale }) {
  return (
    <Text {...textProps}>
      {renderDialogueSemanticText(text, locale)}
    </Text>
  );
}

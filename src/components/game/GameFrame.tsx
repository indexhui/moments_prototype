"use client";

import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FIRST_SCENE_ID, GAME_SCENES, SCENE_ORDER, type GameScene } from "@/lib/game/scenes";
import { ROUTES } from "@/lib/routes";
import { useEffect, useRef, useState } from "react";
import { GAME_EVENT_LIST, type GameEventId } from "@/lib/game/events";
import { GAME_EVENT_CHEAT_TRIGGER } from "@/lib/game/eventCheatBus";
import {
  AVATAR_EXPRESSION_OPTIONS_BY_TARGET,
  AVATAR_MOTION_LIST,
  type AvatarMotionId,
} from "@/lib/game/avatarPerformance";
import {
  GAME_AVATAR_EXPRESSION_TRIGGER,
  GAME_AVATAR_MOTION_TRIGGER,
  type AvatarTargetId,
} from "@/lib/game/avatarCheatBus";
import type { AvatarSpriteId } from "@/components/game/events/EventAvatarSprite";
import type { PlayerStatus } from "@/lib/game/playerStatus";
import type { RewardPlaceTile } from "@/lib/game/playerProgress";
import { GAME_EMOTION_CUE_TRIGGER, type EmotionCueId } from "@/lib/game/emotionCueBus";
import {
  GAME_BACKGROUND_SHAKE_TRIGGER,
  type BackgroundShakeId,
} from "@/lib/game/backgroundShakeBus";
import {
  GAME_SCENE_TRANSITION_TRIGGER,
  type SceneTransitionPresetId,
} from "@/lib/game/sceneTransitionBus";
import { MARKETING_MATERIALS } from "@/lib/game/marketingMaterials";
import type { InventoryItemId } from "@/lib/game/playerProgress";
import {
  ARRANGE_ROUTE_DEBUG_PRESETS,
  FIRST_STREET_REWARD_PATTERNS,
  INITIAL_PLAYER_PROGRESS,
  PLAYER_PROGRESS_CHANGE_EVENT,
  applyArrangeRouteDebugPreset,
  type ArrangeRouteDebugPresetId,
  type DiaryEntryId,
  loadPlayerProgress,
  resetPlayerProgress,
  savePlayerProgress,
  type PlaceTileId,
  type PlayerProgress,
  type StickerId,
} from "@/lib/game/playerProgress";
import {
  SHOULD_SHOW_GAME_DEBUG_TOOLS,
  STANDARD_TRIAL_PROFILE_VALUE,
  TRIAL_BUILD_LABEL,
  getActiveTrialProfile,
  parseTrialProfilePreference,
  setStoredTrialProfile,
  withTrialProfileSearch,
  type TrialProfileId,
  type TrialProfilePreference,
} from "@/lib/game/demoBuild";
import {
  buildFrogDiaryClueSceneJumpSteps,
  getFrogDiaryClueStageByEventId,
  isFrogDiaryRevealSceneJumpStepId,
  isFrogPostPhotoSceneJumpStepId,
  isKoalaChapterSceneJumpStepId,
  type FrogDiaryClueEventId,
} from "@/lib/game/frogDiaryClueFlow";
import {
  GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT,
  getSceneJumpContextSnapshot,
  type SceneJumpContextStep,
  type SceneJumpContextPayload,
} from "@/lib/game/sceneJumpContextBus";
import {
  WORK_LUNCH_SCENE_JUMP_OPTION_ID,
  WORK_LUNCH_SCENE_JUMP_STEPS,
} from "@/lib/game/workLunchSceneJump";
import {
  KOALA_SCENE_JUMP_STEPS,
  isKoalaPostPhotoSceneJumpStepId,
} from "@/lib/game/koalaSceneFlow";

const GAME_COMIC_CHEAT_TRIGGER = "moment:comic-cheat-trigger";
const STREET_EXPLORE_CHEAT_TRIGGER = "moment:street-explore-cheat-trigger";
const GAME_PROTOTYPE_CURSOR = "url('/images/pointer_up_cursor.png') 14 2, pointer";
const GAME_PROTOTYPE_ACTIVE_CURSOR = "url('/images/pointer_down_cursor.png') 15 4, pointer";
const ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY = "moment:arrange-route-logic-tutorial-seen-v2";
const ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY = "moment:arrange-route-place-mission-tutorial-seen";
const ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY = "moment:arrange-route-convenience-tutorial-seen";

function resolveGameFrameScene(pathname: string | null) {
  if (!pathname || pathname === ROUTES.gameRoot) return GAME_SCENES[FIRST_SCENE_ID];
  if (pathname === ROUTES.gameArrangeRoute) return GAME_SCENES[FIRST_SCENE_ID];
  if (pathname === ROUTES.gameLobby || pathname === ROUTES.gameDaily) {
    return GAME_SCENES["scene-night-hub"] ?? GAME_SCENES[FIRST_SCENE_ID];
  }

  const scenePrefix = `${ROUTES.gameRoot}/`;
  if (!pathname.startsWith(scenePrefix)) return GAME_SCENES[FIRST_SCENE_ID];

  const sceneId = decodeURIComponent(pathname.slice(scenePrefix.length).split("/")[0] ?? "");
  return GAME_SCENES[sceneId] ?? GAME_SCENES[FIRST_SCENE_ID];
}

function getRouteSearchString(path: string) {
  const hashIndex = path.indexOf("#");
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = pathWithoutHash.indexOf("?");
  return queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : "";
}

function withSceneJumpStep(path: string, stepId?: string) {
  if (!stepId) return path;
  const hashIndex = path.indexOf("#");
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const separator = pathWithoutHash.includes("?") ? "&" : "?";
  return `${pathWithoutHash}${separator}sceneStep=${encodeURIComponent(stepId)}${hash}`;
}

const EVENT_CHEAT_SHORTCUTS: Array<{ id: GameEventId; title: string }> = GAME_EVENT_LIST
  .filter((event) => event.cheatShortcut)
  .map((event) => ({
    id: event.id,
    title: event.title,
  }));
type EventCheatGroupId = "metro" | "bus" | "breakfast" | "mart" | "park" | "street";
type ComicCheatId = "freshen" | "puppet";

const COMIC_CHEAT_OPTIONS: Array<{ id: ComicCheatId; label: string }> = [
  { id: "freshen", label: "freshen" },
  { id: "puppet", label: "puppet" },
];

const EVENT_CHEAT_GROUPS: Array<{
  id: EventCheatGroupId;
  placeholder: string;
  events: Array<{ id: GameEventId; title: string }>;
}> = [
  {
    id: "metro",
    placeholder: "請選擇捷運事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("metro-")),
  },
  {
    id: "bus",
    placeholder: "請選擇公車事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("bus-")),
  },
  {
    id: "breakfast",
    placeholder: "請選擇早餐店事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("breakfast-")),
  },
  {
    id: "mart",
    placeholder: "請選擇便利商店事件",
    events: EVENT_CHEAT_SHORTCUTS.filter(
      (event) =>
        event.id.startsWith("mart-") ||
        event.id.startsWith("convenience-store-"),
    ),
  },
  {
    id: "park",
    placeholder: "請選擇公園事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("park-")),
  },
  {
    id: "street",
    placeholder: "請選擇街道事件",
    events: EVENT_CHEAT_SHORTCUTS.filter((event) => event.id.startsWith("street-")),
  },
];
type EventCheatGroup = (typeof EVENT_CHEAT_GROUPS)[number];
type SceneJumpOption = {
  id: string;
  path: string;
  pathForStep?: (step?: SceneJumpContextStep) => string;
  label: string;
  titleParts?: string[];
  preview?: string;
  /**
   * Some gameplay is presented by event layers rather than a standalone URL.
   * Keep its existing beats visible in the scene jump menu as well.
   */
  steps?: SceneJumpContextStep[];
  stepFilter?: (step: SceneJumpContextStep) => boolean;
  kind: SceneJumpFilter;
  orderIndex?: number;
  onBeforeSelect?: (step?: SceneJumpContextStep) => void;
};
type SceneJumpOptionDisplay = {
  titleParts: string[];
  preview?: string;
};
type DevShortcutTone = "green" | "amber" | "blue" | "purple" | "brown" | "neutral" | "danger";
type DevShortcutItem = {
  id: string;
  label: string;
  description?: string;
  tone?: DevShortcutTone;
  href?: string;
  onClick?: () => void;
};
type DevShortcutGroup = {
  id: string;
  title: string;
  items: DevShortcutItem[];
};
type SceneJumpFilter =
  | "prologue"
  | "golden"
  | "frog"
  | "frog-hub"
  | "frog-street"
  | "frog-dessert"
  | "koala";

const DEV_SHORTCUT_TONE_STYLES: Record<DevShortcutTone, { bg: string; border: string }> = {
  green: { bg: "#4D7B6F", border: "rgba(255,255,255,0.36)" },
  amber: { bg: "#B47A58", border: "rgba(255,255,255,0.32)" },
  blue: { bg: "#6F7E8B", border: "rgba(255,255,255,0.32)" },
  purple: { bg: "#7D6B9A", border: "rgba(255,255,255,0.32)" },
  brown: { bg: "#8B6A4E", border: "rgba(255,255,255,0.32)" },
  neutral: { bg: "#7E6A5A", border: "rgba(255,255,255,0.26)" },
  danger: { bg: "#7F5A5A", border: "rgba(255,255,255,0.3)" },
};
const SCENE_JUMP_FILTERS: Array<{ id: SceneJumpFilter; label: string }> = [
  { id: "prologue", label: "序章" },
  { id: "golden", label: "黃金獵犬" },
  { id: "frog", label: "青蛙" },
  { id: "frog-hub", label: "回家 Hub" },
  { id: "frog-street", label: "街道傳單" },
  { id: "frog-dessert", label: "甜點店" },
  { id: "koala", label: "無尾熊" },
];

function getSceneJumpKindLabel(kind: SceneJumpFilter) {
  return SCENE_JUMP_FILTERS.find((item) => item.id === kind)?.label ?? kind;
}

function buildSceneJumpOptionLabel(titleParts: string[], preview?: string) {
  return preview ? `${titleParts.join("｜")}｜${preview}` : titleParts.join("｜");
}

function getSceneJumpContextOptionId(context: SceneJumpContextPayload | null) {
  if (!context || context.clear) return null;
  if (context.optionId) return context.optionId;
  if (context.eventId === "frog-clue-shop-cold-noodles") return "frog-scene-2-shop-event";
  if (context.eventId === "frog-clue-street-flyer") return "frog-scene-6-street-event";
  if (context.eventId === "frog-clue-dessert-shop-birthday-cake") {
    return isKoalaChapterSceneJumpStepId(context.currentStepId)
      ? "koala-scene-1-diary"
      : "frog-scene-8-dessert-shop-event";
  }
  if (context.eventId === "office-sunbeast-koala") return "koala-scene-6-office-event";
  return null;
}

function getSceneJumpStepPreview(step: SceneJumpContextStep) {
  const speakerPrefix = step.speaker ? `${step.speaker}：` : "";
  const normalizedText = `${speakerPrefix}${step.text}`.replace(/\s+/g, " ").trim();
  return normalizedText.length > 42 ? `${normalizedText.slice(0, 42)}…` : normalizedText;
}

function getStoryChoiceJumpLabel(action: NonNullable<GameScene["choices"]>[number]["action"]) {
  if (action === "open-beigo-profile") return "打開小貝狗日記";
  if (action === "open-fragmented-diary") return "打開殘缺日記";
  return null;
}

function getSceneJumpNodeSummary(scene: GameScene) {
  if (scene.id === "scene-60d") {
    return "觀察四周圍：沈睡的小白／小貝狗／地上的日記（打開日記）";
  }

  if (scene.choices?.length) {
    const choiceLabels = scene.choices.map((choice) => {
      const actionLabel = getStoryChoiceJumpLabel(choice.action);
      return actionLabel ? `${choice.label}（${actionLabel}）` : choice.label;
    });
    return `選項：${choiceLabels.join("／")}`;
  }

  const dialogue = getSceneJumpPreviewText(scene.dialogue);
  if (dialogue) return dialogue;

  if (scene.storySingleComicPanel?.alt) {
    return getSceneJumpPreviewText(`漫畫：${scene.storySingleComicPanel.alt}`);
  }

  if (scene.storyComicOverlays?.length) {
    return getSceneJumpPreviewText(`漫畫：${scene.storyComicOverlays.map((item) => item.alt).join("／")}`);
  }

  if (scene.showDialogueUI === false) return "無台詞演出";

  return null;
}

function getSceneJumpNodeType(scene: GameScene) {
  if (scene.choices?.length) return "選項";
  if (scene.dialogue.trim()) return "對話";
  if (scene.storySingleComicPanel || scene.storyComicOverlays?.length) return "漫畫";
  if (scene.showDialogueUI === false) return "演出";
  return "節點";
}

function getSceneJumpPreviewText(text: string, maxLength = 20) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return "";
  return normalizedText.length > maxLength ? `${normalizedText.slice(0, maxLength)}…` : normalizedText;
}

function getFrogEventSceneJumpText(eventId: FrogDiaryClueEventId) {
  const stage = getFrogDiaryClueStageByEventId(eventId);
  if (!stage) return "";
  const firstLine = stage.lines[0];
  if (!firstLine) return "";
  return getSceneJumpPreviewText(`${firstLine.speaker}：${firstLine.text}`);
}

const EVENT_CHEAT_SELECT_STYLE = {
  height: "32px",
  width: "100%",
  borderRadius: "8px",
  border: "1px solid rgba(95,91,73,0.24)",
  backgroundColor: "rgba(255,255,255,0.72)",
  color: "#4F4B3F",
  fontSize: "12px",
  padding: "0 8px",
  outline: "none",
};

function EventCheatSelect({
  group,
  value,
  onSelect,
}: {
  group: EventCheatGroup;
  value: string;
  onSelect: (groupId: EventCheatGroupId, eventId: GameEventId) => void;
}) {
  return (
    <select
      aria-label={group.placeholder}
      value={value}
      onChange={(event) => {
        const selectedEventId = event.target.value as GameEventId;
        if (!selectedEventId) return;
        onSelect(group.id, selectedEventId);
      }}
      style={EVENT_CHEAT_SELECT_STYLE}
    >
      <option value="">{group.placeholder}</option>
      {group.events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.title}
        </option>
      ))}
    </select>
  );
}

function DevShortcutCard({ item }: { item: DevShortcutItem }) {
  const tone = DEV_SHORTCUT_TONE_STYLES[item.tone ?? "neutral"];
  const content = (
    <Flex
      as={item.href ? "div" : "button"}
      data-no-story-advance="true"
      w="100%"
      minH={item.description ? "54px" : "38px"}
      px="10px"
      py="8px"
      borderRadius="9px"
      bgColor={tone.bg}
      border="1px solid"
      borderColor={tone.border}
      color="white"
      direction="column"
      alignItems="flex-start"
      justifyContent="center"
      cursor="pointer"
      textAlign="left"
      boxShadow="0 6px 14px rgba(66,60,44,0.12)"
      onClick={item.onClick}
    >
      <Text color="white" fontSize="12px" fontWeight="800" lineHeight="1.25">
        {item.label}
      </Text>
      {item.description ? (
        <Text color="rgba(255,255,255,0.78)" fontSize="10px" fontWeight="700" lineHeight="1.35" mt="3px">
          {item.description}
        </Text>
      ) : null}
    </Flex>
  );

  if (!item.href) return content;

  return (
    <NextLink href={item.href} style={{ textDecoration: "none" }}>
      {content}
    </NextLink>
  );
}

function DevShortcutSection({ group }: { group: DevShortcutGroup }) {
  return (
    <Flex direction="column" gap="7px" p="9px" borderRadius="11px" bgColor="rgba(255,255,255,0.3)">
      <Text color="#5F5B49" fontSize="12px" fontWeight="900" lineHeight="1">
        {group.title}
      </Text>
      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="7px">
        {group.items.map((item) => (
          <DevShortcutCard key={item.id} item={item} />
        ))}
      </Grid>
    </Flex>
  );
}

function ArrangeRoutePresetPicker({
  presets,
  value,
  onChange,
  onApply,
}: {
  presets: typeof ARRANGE_ROUTE_DEBUG_PRESETS;
  value: ArrangeRouteDebugPresetId;
  onChange: (presetId: ArrangeRouteDebugPresetId) => void;
  onApply: () => void;
}) {
  const selectedPreset = presets.find((preset) => preset.id === value) ?? presets[0];

  return (
    <Flex direction="column" gap="8px" p="10px" borderRadius="12px" bgColor="rgba(255,255,255,0.32)">
      <Text color="#5F5B49" fontSize="13px" fontWeight="800">
        安排行程測試捷徑
      </Text>
      <Box maxH="146px" overflowY="auto" pr="2px" css={{ scrollbarWidth: "thin" }}>
        <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
          {presets.map((preset) => {
            const isSelected = preset.id === value;
            return (
              <Flex
                key={preset.id}
                as="button"
                minH="48px"
                px="8px"
                py="7px"
                borderRadius="9px"
                border="1px solid"
                borderColor={isSelected ? "rgba(94,125,145,0.52)" : "rgba(95,91,73,0.16)"}
                bgColor={isSelected ? "rgba(94,125,145,0.2)" : "rgba(255,255,255,0.5)"}
                color="#4F4B3F"
                direction="column"
                alignItems="flex-start"
                justifyContent="center"
                textAlign="left"
                cursor="pointer"
                boxShadow={isSelected ? "inset 0 0 0 1px rgba(94,125,145,0.22)" : undefined}
                onClick={() => onChange(preset.id)}
              >
                <Text color="#4F4B3F" fontSize="12px" fontWeight="900" lineHeight="1.25">
                  {preset.label}
                </Text>
              </Flex>
            );
          })}
        </Grid>
      </Box>
      {selectedPreset ? (
        <Text color="#6E6A58" fontSize="12px" lineHeight="1.45">
          {selectedPreset.description}
        </Text>
      ) : null}
      <Flex
        as="button"
        h="42px"
        borderRadius="10px"
        bgColor="#5E7D91"
        color="white"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        fontSize="13px"
        fontWeight="900"
        onClick={onApply}
      >
        套用進度並前往安排
      </Flex>
    </Flex>
  );
}

function SceneJumpOptionContent({
  display,
  isSelected,
  fontSize,
  compact = false,
}: {
  display: SceneJumpOptionDisplay;
  isSelected: boolean;
  fontSize: string;
  compact?: boolean;
}) {
  return (
    <Flex direction="column" gap="2px" minW="0" flex="1">
      <Text
        color="#4F4B3F"
        fontSize={fontSize}
        fontWeight={isSelected ? "900" : "800"}
        lineHeight="1.25"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        {display.titleParts.join(" / ")}
      </Text>
      {display.preview ? (
        <Text
          color="#6E6A58"
          fontSize={compact ? "11px" : "12px"}
          fontWeight={isSelected ? "750" : "650"}
          lineHeight="1.35"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace={compact ? "nowrap" : "normal"}
          css={
            compact
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }
          }
        >
          {display.preview}
        </Text>
      ) : null}
    </Flex>
  );
}

function SceneJumpDropdown({
  menuId,
  options,
  filters = SCENE_JUMP_FILTERS,
  activeContext = null,
  value,
  placeholder,
  height = "58px",
  fontSize = "12px",
  fontWeight = "600",
  bgColor = "rgba(255,255,255,0.68)",
  borderColor = "rgba(95,91,73,0.24)",
  onSelect,
}: {
  menuId: string;
  options: SceneJumpOption[];
  filters?: Array<{ id: SceneJumpFilter; label: string }>;
  activeContext?: SceneJumpContextPayload | null;
  value?: string | null;
  placeholder: string;
  height?: string;
  fontSize?: string;
  fontWeight?: string;
  bgColor?: string;
  borderColor?: string;
  onSelect: (option: SceneJumpOption, step?: SceneJumpContextStep) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SceneJumpFilter>("prologue");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = value ? options.find((option) => option.id === value) : null;
  const normalizedQuery = query.trim().toLowerCase();
  const activeContextOptionId = getSceneJumpContextOptionId(activeContext);
  const getOptionProgressSteps = (option: SceneJumpOption) => {
    const steps =
      activeContextOptionId === option.id ? activeContext?.steps ?? [] : option.steps ?? [];
    return option.stepFilter ? steps.filter(option.stepFilter) : steps;
  };
  const getOptionDisplay = (option: SceneJumpOption): SceneJumpOptionDisplay => {
    return {
      titleParts: option.titleParts ?? [option.label],
      preview: option.preview,
    };
  };
  const getStepDisplay = (
    option: SceneJumpOption,
    step: SceneJumpContextStep,
  ): SceneJumpOptionDisplay => {
    const optionDisplay = getOptionDisplay(option);
    return {
      titleParts: [
        optionDisplay.titleParts[0] ?? option.id,
        getSceneJumpKindLabel(option.kind),
        step.kindLabel,
      ],
      preview: getSceneJumpStepPreview(step),
    };
  };
  const selectedProgressStep =
    selectedOption && activeContext?.currentStepId
      ? getOptionProgressSteps(selectedOption).find((step) => step.id === activeContext.currentStepId)
      : null;
  const selectedDisplay = selectedOption
    ? selectedProgressStep
      ? getStepDisplay(selectedOption, selectedProgressStep)
      : getOptionDisplay(selectedOption)
    : null;
  const getOptionOrderIndex = (option: SceneJumpOption) =>
    option.orderIndex ?? options.findIndex((candidate) => candidate.id === option.id);
  const filteredOptions = options
    .filter((option) => {
      if (!normalizedQuery && option.kind !== filter) return false;
      if (!normalizedQuery) return true;
      const display = getOptionDisplay(option);
      const progressStepText = getOptionProgressSteps(option)
        .map((step) => `${step.kindLabel} ${step.speaker ?? ""} ${step.text}`)
        .join(" ");
      return `${option.id} ${option.label} ${display.titleParts.join(" ")} ${display.preview ?? ""} ${progressStepText}`
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) => getOptionOrderIndex(a) - getOptionOrderIndex(b));

  useEffect(() => {
    if (!isOpen || !selectedOption) return;
    setFilter(selectedOption.kind);
  }, [isOpen, selectedOption?.kind]);

  useEffect(() => {
    if (filters.some((item) => item.id === filter)) return;
    setFilter(filters[0]?.id ?? "prologue");
  }, [filter, filters]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-scene-jump-dropdown="${menuId}"]`)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, menuId]);

  useEffect(() => {
    if (!isOpen || !selectedOption) return;

    const frame = window.requestAnimationFrame(() => {
      const selectedElement = menuRef.current?.querySelector<HTMLElement>(
        '[data-scene-jump-option-selected="true"]',
      );
      selectedElement?.scrollIntoView({ block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeContext?.currentStepId, filter, isOpen, selectedOption?.id]);

  return (
    <Box position="relative" w="100%" data-scene-jump-dropdown={menuId}>
      <Flex
        as="button"
        data-no-story-advance="true"
        w="100%"
        h={height}
        px="10px"
        borderRadius="8px"
        border="1px solid"
        borderColor={borderColor}
        bgColor={bgColor}
        color="#4F4B3F"
        alignItems="center"
        justifyContent="space-between"
        gap="8px"
        cursor="pointer"
        textAlign="left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        {selectedOption && selectedDisplay ? (
          <SceneJumpOptionContent
            display={selectedDisplay}
            isSelected
            fontSize={fontSize}
            compact
          />
        ) : (
          <Text
            minW="0"
            flex="1"
            color="#6E6A58"
            fontSize={fontSize}
            fontWeight={fontWeight}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {placeholder}
          </Text>
        )}
        <Text color="#6E6A58" fontSize="11px" fontWeight="900" flexShrink={0}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </Flex>
      {isOpen ? (
        <Flex
          ref={menuRef}
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          zIndex={30}
          direction="column"
          maxH="420px"
          p="8px"
          gap="8px"
          borderRadius="10px"
          border="1px solid rgba(95,91,73,0.18)"
          bgColor="#F8F7EE"
          boxShadow="0 12px 28px rgba(61,58,50,0.18)"
        >
          <input
            data-no-story-advance="true"
            value={query}
            placeholder="搜尋 scene、場景、台詞"
            onChange={(event) => setQuery(event.currentTarget.value)}
            style={{
              height: "34px",
              width: "100%",
              borderRadius: "8px",
              border: "1px solid rgba(95,91,73,0.2)",
              backgroundColor: "rgba(255,255,255,0.72)",
              color: "#4F4B3F",
              fontSize: "12px",
              fontWeight: 700,
              padding: "0 10px",
              outline: "none",
            }}
          />
          <Flex gap="5px" wrap="wrap">
            {filters.map((item) => (
              <Flex
                key={item.id}
                as="button"
                data-no-story-advance="true"
                flex="0 0 auto"
                minW="0"
                h="28px"
                px="5px"
                borderRadius="7px"
                bgColor={filter === item.id ? "rgba(157,120,89,0.28)" : "rgba(255,255,255,0.5)"}
                color={filter === item.id ? "#4F4B3F" : "#6E6A58"}
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="11px"
                fontWeight={filter === item.id ? "900" : "700"}
                lineHeight="1"
                whiteSpace="nowrap"
                onClick={(event) => {
                  event.stopPropagation();
                  setFilter(item.id);
                }}
              >
                {item.label}
              </Flex>
            ))}
          </Flex>
          <Flex
            as="ul"
            role="listbox"
            direction="column"
            maxH="314px"
            m="0"
            p="0"
            gap="2px"
            overflowY="auto"
            css={{ scrollbarWidth: "thin" }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.id === value;
                const display = getOptionDisplay(option);
                const progressSteps = getOptionProgressSteps(option);
                if (progressSteps.length > 0) {
                  return progressSteps.map((step) => {
                    const isCurrentStep = isSelected && step.id === activeContext?.currentStepId;
                    const stepDisplay = getStepDisplay(option, step);
                    return (
                      <Box
                        as="li"
                        key={`${option.id}-${step.id}`}
                        role="option"
                        aria-selected={isCurrentStep}
                        listStyleType="none"
                      >
                        <Flex
                          as="button"
                          data-no-story-advance="true"
                          data-scene-jump-option-selected={isCurrentStep ? "true" : undefined}
                          w="100%"
                          minH="52px"
                          px="10px"
                          py="8px"
                          borderRadius="7px"
                          border="0"
                          bgColor={isCurrentStep ? "rgba(157,120,89,0.24)" : "transparent"}
                          color="#4F4B3F"
                          alignItems="center"
                          cursor="pointer"
                          textAlign="left"
                          _hover={{ bgColor: "rgba(157,120,89,0.18)" }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setIsOpen(false);
                            onSelect(option, step);
                          }}
                        >
                          <SceneJumpOptionContent
                            display={stepDisplay}
                            isSelected={isCurrentStep}
                            fontSize={fontSize}
                          />
                        </Flex>
                      </Box>
                    );
                  });
                }
                return (
                  <Box as="li" key={option.id} role="option" aria-selected={isSelected} listStyleType="none">
                    <Flex
                      as="button"
                      data-no-story-advance="true"
                      data-scene-jump-option-selected={isSelected ? "true" : undefined}
                      w="100%"
                      minH="52px"
                      px="10px"
                      py="8px"
                      borderRadius="7px"
                      border="0"
                      bgColor={isSelected ? "rgba(157,120,89,0.24)" : "transparent"}
                      color="#4F4B3F"
                      alignItems="center"
                      cursor="pointer"
                      textAlign="left"
                      _hover={{ bgColor: "rgba(157,120,89,0.18)" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsOpen(false);
                        onSelect(option);
                      }}
                    >
                      <SceneJumpOptionContent
                        display={display}
                        isSelected={isSelected}
                        fontSize={fontSize}
                      />
                    </Flex>
                  </Box>
                );
              })
            ) : (
              <Text color="#7C7666" fontSize="12px" fontWeight="700" py="12px" textAlign="center">
                找不到符合的 scene
              </Text>
            )}
          </Flex>
        </Flex>
      ) : null}
    </Box>
  );
}

const SPRITE_FRAME_WIDTH = 500;
const SPRITE_FRAME_HEIGHT = 627;
const PREVIEW_SCALE = 0.14;
const MAI_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小麥/1_一般.png",
  "/images/428出圖/立繪/小麥/2_一般（小貝狗）.png",
  "/images/428出圖/立繪/小麥/3_無表情.png",
  "/images/428出圖/立繪/小麥/4_無奈困擾.png",
  "/images/428出圖/立繪/小麥/5_無奈（小貝狗）.png",
  "/images/428出圖/立繪/小麥/6_擔心.png",
  "/images/428出圖/立繪/小麥/7_開心.png",
  "/images/428出圖/立繪/小麥/8_誒？.png",
  "/images/428出圖/立繪/小麥/9_擔心２.png",
  "/images/428出圖/立繪/小麥/10_慌亂2閉眼.png",
  "/images/428出圖/立繪/小麥/11_痛！.png",
  "/images/428出圖/立繪/小麥/12_生氣.png",
  "/images/428出圖/立繪/小麥/13_開心２.png",
  "/images/428出圖/立繪/小麥/14_慌張擔心.png",
  "/images/428出圖/立繪/小麥/15_問號.png",
  "/images/428出圖/立繪/小麥/16_問號（小貝狗）.png",
  "/images/428出圖/立繪/小麥/17_睡衣.png",
  "/images/428出圖/立繪/小麥/18_睡衣（小貝狗）.png",
  "/images/428出圖/立繪/小麥/19_釋懷.png",
  "/images/428出圖/立繪/小麥/20_釋懷（小貝狗）.png",
  "/images/428出圖/立繪/小麥/21_生氣（閉口）.png",
  "/images/428出圖/立繪/小麥/22_生氣（開口）.png",
  "/images/428出圖/立繪/小麥/23_嚴肅（開口）.png",
  "/images/428出圖/立繪/小麥/24_嚴肅（閉口）.png",
  "/images/428出圖/立繪/小麥/25_嘆氣.png",
  "/images/428出圖/立繪/小麥/26_驚嚇.png",
  "/images/428出圖/立繪/小麥/27_驚魂未定.png",
  "/images/428出圖/立繪/小麥/28_慌亂.png",
  "/images/428出圖/立繪/小麥/29_慌亂2.png",
  "/images/428出圖/立繪/小麥/30_驚嚇_小貝狗.png",
  "/images/428出圖/立繪/小麥/31_錯愕_小貝狗.png",
  "/images/428出圖/立繪/小麥/32_嘆氣_小貝狗_睡衣.png",
  "/images/428出圖/立繪/小麥/33_疑問.png",
  "/images/428出圖/立繪/小麥/34_疑問.png",
  "/images/428出圖/立繪/小麥/35_驚訝.png",
  "/images/428出圖/立繪/小麥/36_驚訝.png",
  "/images/428出圖/立繪/小麥/37_思考1.png",
  "/images/428出圖/立繪/小麥/38_思考2.png",
  "/images/428出圖/立繪/小麥/39_恍然大悟.png",
];
const BAI_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小白/1_一般.png",
  "/images/428出圖/立繪/小白/2_開心.png",
  "/images/428出圖/立繪/小白/3_委屈心虛.png",
  "/images/428出圖/立繪/小白/4_難過.png",
  "/images/428出圖/立繪/小白/5_開心２.png",
  "/images/428出圖/立繪/小白/6_裝傻心虛.png",
  "/images/428出圖/立繪/小白/7_熬夜一般.png",
  "/images/428出圖/立繪/小白/8_熬夜一般2.png",
  "/images/428出圖/立繪/小白/9_熬夜疑惑.png",
  "/images/428出圖/立繪/小白/10_熬夜委屈心虛.png",
  "/images/428出圖/立繪/小白/11_熬夜抱歉.png",
  "/images/428出圖/立繪/小白/12_熬夜難過.png",
];
const BEIGO_428_FRAME_PATHS = [
  "/images/428出圖/立繪/小貝狗/1_一般.png",
  "/images/428出圖/立繪/小貝狗/2_擔心.png",
  "/images/428出圖/立繪/小貝狗/3_開心.png",
];
const AVATAR_SPRITE_META: Record<
  AvatarTargetId | "mai-beigo",
  { imagePath: string; cols: number; rows: number; framePaths?: string[] }
> = {
  mai: { imagePath: "/images/mai/Mai_Spirt.png", cols: 6, rows: 3, framePaths: MAI_428_FRAME_PATHS },
  "mai-beigo": { imagePath: "/images/mai/mai&beigo_spirt.png", cols: 5, rows: 1 },
  bai: { imagePath: "/images/bai/Bai_Spirt.png", cols: 7, rows: 1, framePaths: BAI_428_FRAME_PATHS },
  beigo: { imagePath: "/images/beigo/Beigo_Spirt.png", cols: 2, rows: 1, framePaths: BEIGO_428_FRAME_PATHS },
};

export function GameFrame({
  children,
  scene: sceneProp,
  onResetProgress,
  initialTrialProfile,
}: {
  children: React.ReactNode;
  scene?: GameScene;
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
  initialTrialProfile?: TrialProfilePreference | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const scene = sceneProp ?? resolveGameFrameScene(pathname);
  const [currentSearchString, setCurrentSearchString] = useState("");
  const [frameProgress, setFrameProgress] = useState<PlayerProgress>(INITIAL_PLAYER_PROGRESS);
  const [activeTrialProfile, setActiveTrialProfile] = useState<TrialProfileId | null>(() =>
    initialTrialProfile === STANDARD_TRIAL_PROFILE_VALUE
      ? null
      : initialTrialProfile ?? null,
  );
  const effectiveTrialProfile = activeTrialProfile;
  const isDevTrialProfile = effectiveTrialProfile === "dev";
  const showDebugTools = isDevTrialProfile || SHOULD_SHOW_GAME_DEBUG_TOOLS;
  const isMarketingRoute =
    pathname === ROUTES.gameMarketing || pathname.startsWith(`${ROUTES.gameMarketing}/`);
  const [isBackgroundFxOpen, setIsBackgroundFxOpen] = useState(false);
  const [isEmotionCueOpen, setIsEmotionCueOpen] = useState(false);
  const [isComicCheatOpen, setIsComicCheatOpen] = useState(false);
  const [isAvatarMotionOpen, setIsAvatarMotionOpen] = useState(false);
  const [isAvatarExpressionOpen, setIsAvatarExpressionOpen] = useState(false);
  const [sceneJumpContext, setSceneJumpContext] = useState<SceneJumpContextPayload | null>(null);
  const [expressionCheatTab, setExpressionCheatTab] = useState<AvatarTargetId>("mai");
  const [eventCheatValues, setEventCheatValues] = useState<Record<EventCheatGroupId, string>>({
    metro: "",
    bus: "",
    breakfast: "",
    mart: "",
    park: "",
    street: "",
  });
  const [arrangeRouteDebugPresetId, setArrangeRouteDebugPresetId] =
    useState<ArrangeRouteDebugPresetId>("post-naotaro-photo");
  const [hoveredExpression, setHoveredExpression] = useState<{
    frameIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1440, height: 900 });

  useEffect(() => {
    setFrameProgress(loadPlayerProgress());
  }, [pathname]);

  useEffect(() => {
    const syncViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    syncViewportSize();
    window.addEventListener("resize", syncViewportSize);
    return () => {
      window.removeEventListener("resize", syncViewportSize);
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let syncTimer: number | null = null;
    const syncCurrentSearchString = () => {
      if (!isActive) return;
      setCurrentSearchString(window.location.search.replace(/^\?/, ""));
      setFrameProgress(loadPlayerProgress());
    };
    const scheduleCurrentSearchStringSync = () => {
      if (syncTimer !== null) {
        window.clearTimeout(syncTimer);
      }
      syncTimer = window.setTimeout(() => {
        syncTimer = null;
        syncCurrentSearchString();
      }, 0);
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      scheduleCurrentSearchStringSync();
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      scheduleCurrentSearchStringSync();
      return result;
    };
    syncCurrentSearchString();
    window.addEventListener("popstate", scheduleCurrentSearchStringSync);
    window.addEventListener("focus", scheduleCurrentSearchStringSync);
    window.addEventListener("pageshow", scheduleCurrentSearchStringSync);
    return () => {
      isActive = false;
      if (syncTimer !== null) {
        window.clearTimeout(syncTimer);
      }
      window.removeEventListener("popstate", scheduleCurrentSearchStringSync);
      window.removeEventListener("focus", scheduleCurrentSearchStringSync);
      window.removeEventListener("pageshow", scheduleCurrentSearchStringSync);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [pathname]);

  useEffect(() => {
    const handleSceneJumpContextChange = (event: Event) => {
      const payload = (event as CustomEvent<SceneJumpContextPayload>).detail;
      if (!payload) return;
      if (payload.clear) {
        setSceneJumpContext((current) =>
          !payload.eventId || current?.eventId === payload.eventId ? null : current,
        );
        return;
      }
      setSceneJumpContext(payload);
    };

    window.addEventListener(GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT, handleSceneJumpContextChange);
    setSceneJumpContext(getSceneJumpContextSnapshot());
    return () => {
      window.removeEventListener(GAME_SCENE_JUMP_CONTEXT_CHANGE_EVENT, handleSceneJumpContextChange);
    };
  }, []);

  useEffect(() => {
    if (initialTrialProfile) {
      setStoredTrialProfile(initialTrialProfile);
      setActiveTrialProfile(initialTrialProfile === STANDARD_TRIAL_PROFILE_VALUE ? null : initialTrialProfile);
    }
  }, [initialTrialProfile]);

  useEffect(() => {
    const syncTrialProfile = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const trialProfileFromSearch = parseTrialProfilePreference(searchParams.get("trial") ?? undefined);
      if (trialProfileFromSearch) {
        setStoredTrialProfile(trialProfileFromSearch);
        setActiveTrialProfile(
          trialProfileFromSearch === STANDARD_TRIAL_PROFILE_VALUE ? null : trialProfileFromSearch,
        );
        return;
      }
      setActiveTrialProfile(getActiveTrialProfile());
    };
    syncTrialProfile();
    window.addEventListener("storage", syncTrialProfile);
    window.addEventListener("focus", syncTrialProfile);
    return () => {
      window.removeEventListener("storage", syncTrialProfile);
      window.removeEventListener("focus", syncTrialProfile);
    };
  }, [pathname]);

  useEffect(() => {
    const syncProgress = () => setFrameProgress(loadPlayerProgress());
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncProgress();
    };

    window.addEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
    window.addEventListener("storage", syncProgress);
    window.addEventListener("focus", syncProgress);
    window.addEventListener("pageshow", syncProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(PLAYER_PROGRESS_CHANGE_EVENT, syncProgress);
      window.removeEventListener("storage", syncProgress);
      window.removeEventListener("focus", syncProgress);
      window.removeEventListener("pageshow", syncProgress);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const triggerEventCheat = (eventId: string) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EVENT_CHEAT_TRIGGER, { detail: { eventId } }),
    );
  };
  const handleEventCheatSelect = (groupId: EventCheatGroupId, eventId: GameEventId) => {
    triggerEventCheat(eventId);
    setEventCheatValues((prev) => ({
      ...prev,
      [groupId]: "",
    }));
  };
  const triggerAvatarMotion = (motionId: AvatarMotionId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_MOTION_TRIGGER, { detail: { motionId } }),
    );
  };
  const triggerAvatarExpression = (frameIndex: number, targetSpriteId: AvatarTargetId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_AVATAR_EXPRESSION_TRIGGER, {
        detail: { frameIndex, targetSpriteId },
      }),
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
  const triggerSceneTransition = (preset: SceneTransitionPresetId, durationMs = 380) => {
    window.dispatchEvent(
      new CustomEvent(GAME_SCENE_TRANSITION_TRIGGER, { detail: { preset, durationMs } }),
    );
  };
  const triggerComicCheat = (comicId: ComicCheatId) => {
    window.dispatchEvent(
      new CustomEvent(GAME_COMIC_CHEAT_TRIGGER, { detail: { comicId } }),
    );
  };
  const prepareChapterOneHubGuide = () => {
    const current = loadPlayerProgress();
    const now = Date.now();
    const ensureTile = (
      tiles: RewardPlaceTile[],
      sourceId: RewardPlaceTile["sourceId"],
      category: RewardPlaceTile["category"],
      pattern: RewardPlaceTile["pattern"],
      label: string,
      centerEmoji: string,
    ) => {
      const exists = tiles.some(
        (tile) =>
          tile.sourceId === sourceId &&
          tile.category === category &&
          JSON.stringify(tile.pattern) === JSON.stringify(pattern),
      );
      if (exists) return tiles;
      return [
        ...tiles,
        {
          instanceId: `${sourceId}-quick-${now}-${tiles.length + 1}`,
          sourceId,
          category,
          label,
          centerEmoji,
          pattern,
        },
      ];
    };
    const ensureStreetTileCount = (
      tiles: RewardPlaceTile[],
      pattern: RewardPlaceTile["pattern"],
      index: number,
    ) => {
      const requiredCount = FIRST_STREET_REWARD_PATTERNS.slice(0, index + 1).filter(
        (rewardPattern) => JSON.stringify(rewardPattern) === JSON.stringify(pattern),
      ).length;
      const existingCount = tiles.filter(
        (tile) =>
          tile.sourceId === "street" &&
          tile.category === "place" &&
          JSON.stringify(tile.pattern) === JSON.stringify(pattern),
      ).length;
      if (existingCount >= requiredCount) return tiles;
      return [
        ...tiles,
        {
          instanceId: `street-quick-${now}-${tiles.length + 1}`,
          sourceId: "street" as const,
          category: "place" as const,
          label: `街道 ${index + 1}`,
          centerEmoji: "💡",
          pattern,
        },
      ];
    };
    const nextRewardTiles = FIRST_STREET_REWARD_PATTERNS.reduce(
      (tiles, pattern, index) => ensureStreetTileCount(tiles, pattern, index),
      ensureTile(
        current.rewardPlaceTiles,
        "metro-station",
        "place",
        [
          [1, 1, 1],
          [0, 1, 0],
          [1, 1, 1],
        ],
        "捷運",
        "🚋",
      ),
    );
    const nextOwnedPlaceIds = Array.from(
      new Set([...current.ownedPlaceTileIds, "metro-station", "street"]),
    ) as PlaceTileId[];
    const nextStickerCollection = current.stickerCollection.includes("naotaro-basic")
      ? current.stickerCollection
      : [...current.stickerCollection, "naotaro-basic"];
    const nextProgress: PlayerProgress = {
      ...current,
      currentDay: Math.max(1, current.currentDay),
      offworkRewardClaimCount: Math.max(1, current.offworkRewardClaimCount),
      workShiftCount: Math.max(1, current.workShiftCount),
      hasPassedThroughStreet: true,
      hasSeenDiaryFirstReveal: true,
      hasSeenSunbeastFirstReveal: true,
      hasSeenBaiFirstEncounterIntro: true,
      hasSeenFirstSunbeastNightHubGuide: true,
      hasSeenFirstSunbeastNightHubGuideV2: true,
      hasSeenFirstSunbeastNightHubGuideV3: true,
      hasSeenFirstHomeHubFeatureGuide: true,
      hasPendingFirstSunbeastNightHubGuide: false,
      hasPendingFrogDiaryFragmentHubGuide: false,
      hasPendingFrogDiarySleepGuide: false,
      hasPendingFrogReturnHomeDiaryGuide: false,
      hasSeenFirstFrogReturnHomeScene: true,
      hasSeenGameLobbyGuide: false,
      streetForgotLunchFrogPhotoAttemptCount: 0,
      streetForgotLunchFrogPhotoCaptures: [],
      hasUnlockedBaiEntry2SecondFragment: false,
      hasCompletedStreetForgotLunchFrogEvent: false,
      ownedPlaceTileIds: nextOwnedPlaceIds,
      rewardPlaceTiles: nextRewardTiles,
      unlockedDiaryEntryIds: ["bai-entry-1"] as DiaryEntryId[],
      stickerCollection: nextStickerCollection as StickerId[],
      lastPhotoScore: current.lastPhotoScore ?? 90,
      lastDogPhotoCapture: current.lastDogPhotoCapture ?? {
        sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
        previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
        dogCoveragePercent: 90,
        cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
        capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
        capturedAt: new Date().toISOString(),
      },
    };
    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);
    return nextProgress;
  };

  const triggerChapterOneFastComplete = () => {
    prepareChapterOneHubGuide();
    const target = withTrialProfileSearch(
      `${ROUTES.gameScene("scene-night-hub")}?quick=ch1`,
      effectiveTrialProfile,
    );
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const prepareNaotaroReadyOffworkProgress = () => {
    const dogPhotoCapture = {
      sourceImage: "/images/428出圖/動物事件/黃金獵犬１.png",
      previewImage: "/images/428出圖/動物事件/黃金獵犬１.png",
      dogCoveragePercent: 90,
      cameraFrameRect: { x: 0.18, y: 0.51, width: 0.63, height: 0.2 },
      capturedRect: { x: 0.29, y: 0.51, width: 0.43, height: 0.2 },
      capturedAt: new Date().toISOString(),
    };
    const nextProgress: PlayerProgress = {
      ...INITIAL_PLAYER_PROGRESS,
      currentDay: 1,
      status: {
        ...INITIAL_PLAYER_PROGRESS.status,
        savings: 12,
        actionPower: 1,
      },
      arrangeRouteDepartureCount: 1,
      workShiftCount: 1,
      offworkRewardClaimCount: 0,
      ownedPlaceTileIds: ["metro-station"],
      pendingPlaceUnlockIntroIds: [],
      claimedPlaceUnlockIntroRewardIds: [],
      rewardPlaceTiles: [],
      consumedPlaceTileInstanceIds: [],
      unlockedDiaryEntryIds: ["bai-entry-1"] as DiaryEntryId[],
      stickerCollection: ["naotaro-basic"] as StickerId[],
      lastPhotoScore: 90,
      lastDogPhotoCapture: dogPhotoCapture,
      hasSeenDiaryFirstReveal: true,
      hasSeenSunbeastFirstReveal: true,
      hasSeenFirstSunbeastNightHubGuide: false,
      hasSeenFirstSunbeastNightHubGuideV2: false,
      hasSeenFirstSunbeastNightHubGuideV3: false,
      hasSeenFirstHomeHubFeatureGuide: false,
      hasPendingFirstSunbeastNightHubGuide: true,
      hasSeenSunbeastShadowGuide: false,
      hasSeenBaiFirstEncounterIntro: true,
      encounteredCharacterIds: ["mai", "beigo"],
    };

    savePlayerProgress(nextProgress);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ARRANGE_ROUTE_LOGIC_TUTORIAL_SEEN_KEY, "1");
      window.localStorage.setItem(ARRANGE_ROUTE_PLACE_MISSION_TUTORIAL_SEEN_KEY, "1");
      window.localStorage.setItem(ARRANGE_ROUTE_CONVENIENCE_TUTORIAL_SEEN_KEY, "1");
    }

    return nextProgress;
  };

  const triggerNaotaroReadyOffwork = () => {
    prepareNaotaroReadyOffworkProgress();

    const target = withTrialProfileSearch(ROUTES.gameScene("scene-offwork"), effectiveTrialProfile);
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const triggerPostNaotaroFirstFrogHome = () => {
    const baseProgress = prepareNaotaroReadyOffworkProgress();
    const frogPhotoCapture = {
      sourceImage: "/images/outside/mart.jpg",
      previewImage: "/images/animals/青蛙_撲.png",
      dogCoveragePercent: 88,
      cameraFrameRect: { x: 0.32, y: 0.23, width: 0.36, height: 0.28 },
      capturedRect: { x: 0.35, y: 0.25, width: 0.3, height: 0.24 },
      capturedAt: new Date().toISOString(),
    };
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      currentDay: Math.max(2, baseProgress.currentDay),
      arrangeRouteDepartureCount: Math.max(2, baseProgress.arrangeRouteDepartureCount),
      workShiftCount: Math.max(2, baseProgress.workShiftCount),
      offworkRewardClaimCount: Math.max(1, baseProgress.offworkRewardClaimCount),
      hasPendingFirstSunbeastNightHubGuide: false,
      hasSeenFirstSunbeastNightHubGuide: true,
      hasSeenFirstSunbeastNightHubGuideV2: true,
      hasSeenFirstSunbeastNightHubGuideV3: true,
      hasSeenFirstHomeHubFeatureGuide: true,
      hasTriggeredWorkLunchForgotBentoEvent: true,
      streetForgotLunchFrogPhotoAttemptCount: 1,
      streetForgotLunchFrogPhotoCaptures: [frogPhotoCapture],
      hasUnlockedBaiEntry2SecondFragment: false,
      hasCompletedStreetForgotLunchFrogEvent: false,
      hasUnlockedSunbeastFrogHint: true,
      hasPendingFrogDiaryFragmentHubGuide: true,
      hasPendingFrogDiarySleepGuide: false,
      encounteredCharacterIds: Array.from(new Set([...baseProgress.encounteredCharacterIds, "beigo"])),
    };

    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);

    const target = withTrialProfileSearch(ROUTES.gameScene("scene-night-hub"), effectiveTrialProfile);
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const triggerFrogDessertShopClueOffwork = () => {
    const baseProgress = prepareNaotaroReadyOffworkProgress();
    const capturedAt = new Date().toISOString();
    const firstFrogPhotoCapture = {
      sourceImage: "/images/outside/mart.jpg",
      previewImage: "/images/animals/青蛙_撲.png",
      dogCoveragePercent: 88,
      cameraFrameRect: { x: 0.32, y: 0.23, width: 0.36, height: 0.28 },
      capturedRect: { x: 0.35, y: 0.25, width: 0.3, height: 0.24 },
      capturedAt,
    };
    const flyerFrogPhotoCapture = {
      sourceImage: "/images/428出圖/特殊事件/傳單道路.png",
      previewImage: "/images/animals/青蛙_撲.png",
      dogCoveragePercent: 91,
      cameraFrameRect: { x: 0.31, y: 0.22, width: 0.38, height: 0.3 },
      capturedRect: { x: 0.34, y: 0.24, width: 0.31, height: 0.25 },
      capturedAt,
    };
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      currentDay: Math.max(3, baseProgress.currentDay),
      arrangeRouteDepartureCount: Math.max(3, baseProgress.arrangeRouteDepartureCount),
      workShiftCount: Math.max(3, baseProgress.workShiftCount),
      offworkRewardClaimCount: Math.max(2, baseProgress.offworkRewardClaimCount),
      hasPendingFirstSunbeastNightHubGuide: false,
      hasSeenFirstSunbeastNightHubGuide: true,
      hasSeenFirstSunbeastNightHubGuideV2: true,
      hasSeenFirstSunbeastNightHubGuideV3: true,
      hasSeenFirstHomeHubFeatureGuide: true,
      hasTriggeredWorkLunchForgotBentoEvent: true,
      streetForgotLunchFrogPhotoAttemptCount: 2,
      streetForgotLunchFrogPhotoCaptures: [firstFrogPhotoCapture, flyerFrogPhotoCapture],
      hasUnlockedBaiEntry2SecondFragment: true,
      hasCompletedStreetForgotLunchFrogEvent: false,
      hasUnlockedSunbeastFrogHint: true,
      hasPendingFrogDiaryFragmentHubGuide: false,
      hasPendingFrogDiarySleepGuide: false,
      encounteredCharacterIds: Array.from(new Set([...baseProgress.encounteredCharacterIds, "beigo"])),
    };

    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);

    const target = withTrialProfileSearch(ROUTES.gameScene("scene-offwork"), effectiveTrialProfile);
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const handleArrangeRouteDebugPresetApply = () => {
    applyArrangeRouteDebugPreset(arrangeRouteDebugPresetId);
    const shouldUseFrogClueRoute =
      arrangeRouteDebugPresetId === "post-frog-first-photo" ||
      arrangeRouteDebugPresetId === "post-frog-second-photo";
    const target = shouldUseFrogClueRoute
      ? `${ROUTES.gameArrangeRoute}?storyRoute=frog-clue&debugPreset=${arrangeRouteDebugPresetId}`
      : `${ROUTES.gameArrangeRoute}?debugPreset=${arrangeRouteDebugPresetId}`;
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };
  const handleStreetExploreDebugApply = () => {
    const presetId: ArrangeRouteDebugPresetId = "post-convenience-unlock-arrange";
    applyArrangeRouteDebugPreset(presetId);
    if (pathname === ROUTES.gameArrangeRoute) {
      window.dispatchEvent(new CustomEvent(STREET_EXPLORE_CHEAT_TRIGGER));
      return;
    }
    const target = `${ROUTES.gameArrangeRoute}?debugPreset=${presetId}&streetExplore=1`;
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }
    router.push(target);
  };

  const effectiveOnResetProgress = onResetProgress ?? (() => {
    resetPlayerProgress();
    setFrameProgress(INITIAL_PLAYER_PROGRESS);
    if (typeof window !== "undefined") {
      window.location.assign(withTrialProfileSearch(ROUTES.gameRoot, effectiveTrialProfile));
    }
  });
  const progressSnapshot = frameProgress;

  const expressionSpriteMeta = AVATAR_SPRITE_META[expressionCheatTab];
  const expressionFrameCount =
    expressionSpriteMeta.framePaths?.length ?? expressionSpriteMeta.cols * expressionSpriteMeta.rows;
  const expressionOptions = AVATAR_EXPRESSION_OPTIONS_BY_TARGET[expressionCheatTab]
    .slice(0, expressionFrameCount)
    .filter((expression) => !expression.title.startsWith("保留"));
  const previewFrame =
    hoveredExpression === null
      ? null
      : Math.max(0, Math.min(expressionFrameCount - 1, hoveredExpression.frameIndex));
  const previewExpressionTitle =
    previewFrame === null
      ? null
      : (
          expressionOptions.find((expression) => expression.frameIndex === previewFrame)?.title ??
          `表情 ${previewFrame + 1}`
        );
  const previewCol = previewFrame === null ? 0 : previewFrame % expressionSpriteMeta.cols;
  const previewRow =
    previewFrame === null ? 0 : Math.floor(previewFrame / expressionSpriteMeta.cols);
  const previewWidth = SPRITE_FRAME_WIDTH * PREVIEW_SCALE;
  const previewHeight = SPRITE_FRAME_HEIGHT * PREVIEW_SCALE;
  const previewSheetWidth = SPRITE_FRAME_WIDTH * expressionSpriteMeta.cols * PREVIEW_SCALE;
  const previewSheetHeight = SPRITE_FRAME_HEIGHT * expressionSpriteMeta.rows * PREVIEW_SCALE;
  const previewFramePath = previewFrame === null ? null : expressionSpriteMeta.framePaths?.[previewFrame];
  const tooltipOffset = 14;
  const tooltipEstimatedWidth = previewWidth + 110;
  const tooltipEstimatedHeight = Math.max(previewHeight + 16, 56);
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const tooltipLeft =
    hoveredExpression === null
      ? 0
      : Math.max(
          8,
          Math.min(
            hoveredExpression.x + tooltipOffset,
            viewportWidth - tooltipEstimatedWidth - 8,
          ),
        );
  const tooltipTop =
    hoveredExpression === null
      ? 0
      : Math.max(
          8,
          Math.min(
            hoveredExpression.y + tooltipOffset,
            viewportHeight - tooltipEstimatedHeight - 8,
          ),
        );
  const storySceneIds = SCENE_ORDER.filter((id) => id !== "scene-offwork");
  const goldenRetrieverStartIndex = storySceneIds.indexOf("scene-69");
  const goldenRetrieverEndIndex = storySceneIds.indexOf("scene-97");
  const scene60dOrderIndex = storySceneIds.indexOf("scene-60d");
  const frogReturnHomeSceneIds = storySceneIds.filter((id) => id.startsWith("scene-frog-first-return-"));
  const frogStorySceneIds = [
    "scene-98",
    "scene-98-to-company",
    "scene-98-work",
  ] as const;
  const frogDailyHubSceneIds = [
    "scene-daily-adventure-return-room",
    "scene-daily-adventure-return-beigo",
  ] as const;
  const frogStorySceneIdSet = new Set<string>(frogStorySceneIds);
  const frogHubSceneIds = new Set<string>([
    ...frogDailyHubSceneIds,
    "scene-night-hub",
    "scene-morning-hub",
  ]);
  const frogSequenceOrderStart = Math.max(0, goldenRetrieverEndIndex + 1);
  const frogInitialEventOrderStart = frogSequenceOrderStart + frogStorySceneIds.length;
  const frogReturnHomeSceneOrderStart = frogInitialEventOrderStart + 4;
  const frogFirstNightHubOrder = frogReturnHomeSceneOrderStart + frogReturnHomeSceneIds.length;
  const frogStreetSceneOrderStart = frogFirstNightHubOrder + 2;
  const frogDailyHubOrderStart = frogStreetSceneOrderStart + 2;
  const frogDessertSceneOrderStart = frogDailyHubOrderStart + frogDailyHubSceneIds.length;
  const koalaSceneOrderStart = frogDessertSceneOrderStart + 2;
  const getStorySceneJumpKind = (id: string, index: number): SceneJumpFilter => {
    if (frogHubSceneIds.has(id) || id.startsWith("scene-frog-first-return-")) return "frog-hub";
    if (frogStorySceneIdSet.has(id)) return "frog";
    if (
      goldenRetrieverStartIndex >= 0 &&
      goldenRetrieverEndIndex >= goldenRetrieverStartIndex &&
      index >= goldenRetrieverStartIndex &&
      index <= goldenRetrieverEndIndex
    ) {
      return "golden";
    }
    return "prologue";
  };
  const storySceneOptions: SceneJumpOption[] = storySceneIds.map((id, index) => {
    const item = GAME_SCENES[id];
    const kind = getStorySceneJumpKind(id, index);
    const preview = getSceneJumpNodeSummary(item) ?? undefined;
    const titleParts = [
      id,
      getSceneJumpKindLabel(kind),
      id === "scene-night-hub" || id === "scene-morning-hub"
        ? "Hub"
        : getSceneJumpNodeType(item),
    ];
    const frogStoryIndex = frogStorySceneIds.indexOf(id as (typeof frogStorySceneIds)[number]);
    const frogReturnHomeIndex = frogReturnHomeSceneIds.indexOf(id);
    const frogDailyHubIndex = frogDailyHubSceneIds.indexOf(id as (typeof frogDailyHubSceneIds)[number]);
    const orderIndex =
      frogStoryIndex >= 0
        ? frogSequenceOrderStart + frogStoryIndex
        : frogReturnHomeIndex >= 0
          ? frogReturnHomeSceneOrderStart + frogReturnHomeIndex
          : id === "scene-night-hub"
            ? frogFirstNightHubOrder
            : id === "scene-morning-hub"
              ? frogFirstNightHubOrder + 1
              : frogDailyHubIndex >= 0
                ? frogDailyHubOrderStart + frogDailyHubIndex
                : index;
    return {
      id,
      path: ROUTES.gameScene(id),
      label: buildSceneJumpOptionLabel(titleParts, preview),
      titleParts,
      preview,
      kind,
      onBeforeSelect:
        id === "scene-night-hub" || id === "scene-morning-hub" || frogReturnHomeIndex >= 0
          ? () => {
              const nextProgress = applyArrangeRouteDebugPreset("post-frog-first-photo");
              setFrameProgress(nextProgress);
            }
          : undefined,
      orderIndex,
    };
  });
  const applySceneJumpPreset = (presetId: ArrangeRouteDebugPresetId) => {
    const nextProgress = applyArrangeRouteDebugPreset(presetId);
    setFrameProgress(nextProgress);
  };
  const applyWorkLunchFrogEventSceneJumpPreset = () => {
    const baseProgress = applyArrangeRouteDebugPreset("post-naotaro-photo");
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      hasTriggeredWorkLunchForgotBentoEvent: true,
    };
    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);
  };
  const applyFinalFrogSceneJumpPreset = () => {
    const baseProgress = applyArrangeRouteDebugPreset("post-frog-second-photo");
    const capturedAt = new Date().toISOString();
    const existingFrogCaptures = baseProgress.streetForgotLunchFrogPhotoCaptures.slice(0, 2);
    const finalFrogCapture = {
      sourceImage: "/images/events/frog-dessert-shop/dessert-shop-cake-bag.png",
      previewImage: "/images/animals/青蛙.png",
      dogCoveragePercent: 93,
      cameraFrameRect: { x: 0.5, y: 0.2, width: 0.3, height: 0.24 },
      capturedRect: { x: 0.52, y: 0.22, width: 0.27, height: 0.21 },
      capturedAt,
    };
    const frogCaptures = [...existingFrogCaptures, finalFrogCapture];
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      currentDay: Math.max(4, baseProgress.currentDay),
      arrangeRouteDepartureCount: Math.max(4, baseProgress.arrangeRouteDepartureCount),
      workShiftCount: Math.max(4, baseProgress.workShiftCount),
      offworkRewardClaimCount: Math.max(3, baseProgress.offworkRewardClaimCount),
      streetForgotLunchFrogPhotoAttemptCount: 3,
      streetForgotLunchFrogPhotoCaptures: frogCaptures,
      hasUnlockedBaiEntry2SecondFragment: true,
      hasCompletedStreetForgotLunchFrogEvent: true,
      hasUnlockedSunbeastFrogHint: true,
      hasPendingFrogDiaryFragmentHubGuide: false,
      hasPendingFrogDiarySleepGuide: false,
      hasPendingFrogReturnHomeDiaryGuide: false,
      hasSeenGameLobbyGuide: true,
      unlockedDiaryEntryIds: Array.from(
        new Set<DiaryEntryId>([...baseProgress.unlockedDiaryEntryIds, "bai-entry-2", "bai-entry-5"]),
      ),
      sunbeastPhotoCapturesById: {
        ...baseProgress.sunbeastPhotoCapturesById,
        frog: frogCaptures,
      },
    };
    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);
    return nextProgress;
  };
  const applyKoalaSceneJumpPreset = (
    completedRequestCount: 0 | 1 | 2 | 3,
    options?: { koalaCaptured?: boolean },
  ) => {
    const baseProgress = applyFinalFrogSceneJumpPreset();
    const capturedAt = new Date().toISOString();
    const koalaCapture = {
      sourceImage: "/images/work/Office_Work_Dusk_Focus_G01.png",
      previewImage: "/images/animals/放視大賞 5/無尾熊替身.png",
      dogCoveragePercent: 92,
      cameraFrameRect: { x: 0.53, y: 0.31, width: 0.3, height: 0.42 },
      capturedRect: { x: 0.55, y: 0.33, width: 0.26, height: 0.38 },
      capturedAt,
    };
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      currentDay: Math.max(4 + completedRequestCount, baseProgress.currentDay),
      arrangeRouteDepartureCount: Math.max(4 + completedRequestCount, baseProgress.arrangeRouteDepartureCount),
      workShiftCount: Math.max(4 + completedRequestCount, baseProgress.workShiftCount),
      offworkRewardClaimCount: Math.max(3, baseProgress.offworkRewardClaimCount),
      hasPendingFrogReturnHomeDiaryGuide: false,
      dependentCoworkerRequestCount: completedRequestCount,
      hasTriggeredOfficeSunbeastKoalaEvent: Boolean(options?.koalaCaptured),
      sunbeastPhotoCapturesById: {
        ...baseProgress.sunbeastPhotoCapturesById,
        ...(options?.koalaCaptured ? { koala: [koalaCapture] } : {}),
      },
    };
    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);
  };
  const applyKoalaArrangeRouteSceneJumpPreset = () => {
    const baseProgress = applyFinalFrogSceneJumpPreset();
    const nextProgress: PlayerProgress = {
      ...baseProgress,
      hasPendingFrogReturnHomeDiaryGuide: false,
    };
    savePlayerProgress(nextProgress);
    setFrameProgress(nextProgress);
  };
  const buildFrogEventMenuSteps = (eventId: FrogDiaryClueEventId, photoAttemptNumber: number) => {
    const stage = getFrogDiaryClueStageByEventId(eventId);
    if (!stage) return [];
    return buildFrogDiaryClueSceneJumpSteps({
      stage,
      photoAttemptNumber,
      requiredPhotoAttempts: 3,
    });
  };
  const frogReturnToWorkSteps: SceneJumpContextStep[] = [
    { id: "return-to-work", kindLabel: "對話", speaker: "小麥", text: "趕緊回到公司享用涼麵吧。" },
    { id: "work-transition", kindLabel: "上班", text: "回到公司，完成今天剩下的工作。" },
  ];
  const frogOffworkSteps: SceneJumpContextStep[] = [
    { id: "offwork", kindLabel: "下班", text: "結束今天的工作，準備回家。" },
  ];
  const isFirstFrogPhotoFollowupStep = (step?: SceneJumpContextStep) => {
    const stepId = step?.id ?? "";
    return (
      stepId === "escape-line" ||
      stepId === "waiting-diary" ||
      stepId.startsWith("diary-") ||
      stepId.startsWith("frog-match-") ||
      stepId.startsWith("work-lunch-return-")
    );
  };
  const frogScene1TitleParts = ["frog-scene-1", "青蛙", "安排路徑"];
  const frogScene1Preview = `安排路徑：${getSceneJumpPreviewText("中午發現忘記帶便當，前往便利商店買午餐")}`;
  const frogScene2TitleParts = ["frog-scene-2", "青蛙", "對話"];
  const frogScene2Preview = `便利商店：${getFrogEventSceneJumpText("frog-clue-shop-cold-noodles")}`;
  const frogScene3TitleParts = ["frog-scene-3", "青蛙", "上班"];
  const frogScene3Preview = "公司：帶著涼麵回公司，完成下午的工作";
  const frogScene4TitleParts = ["frog-scene-4", "青蛙", "下班"];
  const frogScene4Preview = "公司：結束工作，進入第一次回家短劇";
  const frogScene5TitleParts = ["frog-scene-5", "街道傳單", "路線"];
  const frogScene5Preview = `街道：${getSceneJumpPreviewText("依照日記的新線索安排前往街道")}`;
  const frogScene6TitleParts = ["frog-scene-6", "街道傳單", "對話"];
  const frogScene6Preview = `街道：${getFrogEventSceneJumpText("frog-clue-street-flyer")}`;
  const frogScene7TitleParts = ["frog-scene-7", "甜點店", "路線"];
  const frogScene7Preview = `甜點店：${getSceneJumpPreviewText("下班後陪同事尋找曾推薦的甜點店")}`;
  const frogScene8TitleParts = ["frog-scene-8", "甜點店", "對話"];
  const frogScene8Preview = `甜點店：${getFrogEventSceneJumpText("frog-clue-dessert-shop-birthday-cake")}`;
  const frogDessertShopEventSteps = buildFrogEventMenuSteps(
    "frog-clue-dessert-shop-birthday-cake",
    3,
  );
  const frogDessertShopSteps = frogDessertShopEventSteps.filter(
    (step) => !isKoalaChapterSceneJumpStepId(step.id),
  );
  const koalaChapterOpeningSteps = frogDessertShopEventSteps.filter((step) =>
    isKoalaChapterSceneJumpStepId(step.id),
  );
  const frogSceneOptions: SceneJumpOption[] = [
    {
      id: WORK_LUNCH_SCENE_JUMP_OPTION_ID,
      path: `${ROUTES.gameScene("scene-98-work")}?frogJourney=work-lunch`,
      pathForStep: (step) =>
        step?.id === "route"
          ? `${ROUTES.gameArrangeRoute}?storyRoute=work-lunch-convenience`
          : `${ROUTES.gameScene("scene-98-work")}?frogJourney=work-lunch`,
      label: buildSceneJumpOptionLabel(frogScene1TitleParts, frogScene1Preview),
      titleParts: frogScene1TitleParts,
      preview: frogScene1Preview,
      steps: WORK_LUNCH_SCENE_JUMP_STEPS,
      kind: "frog",
      orderIndex: frogInitialEventOrderStart,
      onBeforeSelect: () => applySceneJumpPreset("post-naotaro-photo"),
    },
    {
      id: "frog-scene-2-shop-event",
      path: `${ROUTES.gameArrangeRoute}?eventId=frog-clue-shop-cold-noodles`,
      label: buildSceneJumpOptionLabel(frogScene2TitleParts, frogScene2Preview),
      titleParts: frogScene2TitleParts,
      preview: frogScene2Preview,
      steps: buildFrogEventMenuSteps("frog-clue-shop-cold-noodles", 1),
      kind: "frog",
      orderIndex: frogInitialEventOrderStart + 1,
      onBeforeSelect: (step) => {
        if (isFirstFrogPhotoFollowupStep(step)) {
          applySceneJumpPreset("post-frog-first-photo");
          return;
        }
        applyWorkLunchFrogEventSceneJumpPreset();
      },
    },
    {
      id: "frog-scene-3-return-to-work",
      path: `${ROUTES.gameArrangeRoute}?frogLunchReturn=1`,
      label: buildSceneJumpOptionLabel(frogScene3TitleParts, frogScene3Preview),
      titleParts: frogScene3TitleParts,
      preview: frogScene3Preview,
      steps: frogReturnToWorkSteps,
      kind: "frog",
      orderIndex: frogInitialEventOrderStart + 2,
      onBeforeSelect: () => applySceneJumpPreset("post-frog-first-photo"),
    },
    {
      id: "frog-scene-4-offwork",
      path: `${ROUTES.gameScene("scene-offwork")}?frogJourney=offwork`,
      label: buildSceneJumpOptionLabel(frogScene4TitleParts, frogScene4Preview),
      titleParts: frogScene4TitleParts,
      preview: frogScene4Preview,
      steps: frogOffworkSteps,
      kind: "frog",
      orderIndex: frogInitialEventOrderStart + 3,
      onBeforeSelect: () => applySceneJumpPreset("post-frog-first-photo"),
    },
    {
      id: "frog-scene-5-street-route",
      path: `${ROUTES.gameArrangeRoute}?storyRoute=frog-clue`,
      label: buildSceneJumpOptionLabel(frogScene5TitleParts, frogScene5Preview),
      titleParts: frogScene5TitleParts,
      preview: frogScene5Preview,
      kind: "frog-street",
      orderIndex: frogStreetSceneOrderStart,
      onBeforeSelect: () => applySceneJumpPreset("post-frog-first-photo"),
    },
    {
      id: "frog-scene-6-street-event",
      path: `${ROUTES.gameArrangeRoute}?eventId=frog-clue-street-flyer`,
      label: buildSceneJumpOptionLabel(frogScene6TitleParts, frogScene6Preview),
      titleParts: frogScene6TitleParts,
      preview: frogScene6Preview,
      steps: buildFrogEventMenuSteps("frog-clue-street-flyer", 2),
      kind: "frog-street",
      orderIndex: frogStreetSceneOrderStart + 1,
      onBeforeSelect: (step) => {
        if (isFrogDiaryRevealSceneJumpStepId(step?.id)) {
          applySceneJumpPreset("post-frog-second-photo");
          return;
        }
        applySceneJumpPreset("post-frog-first-photo");
      },
    },
    {
      id: "frog-scene-7-dessert-shop-route",
      path: `${ROUTES.gameArrangeRoute}?storyRoute=frog-clue`,
      label: buildSceneJumpOptionLabel(frogScene7TitleParts, frogScene7Preview),
      titleParts: frogScene7TitleParts,
      preview: frogScene7Preview,
      kind: "frog-dessert",
      orderIndex: frogDessertSceneOrderStart,
      onBeforeSelect: () => applySceneJumpPreset("post-frog-second-photo"),
    },
    {
      id: "frog-scene-8-dessert-shop-event",
      path: `${ROUTES.gameArrangeRoute}?eventId=frog-clue-dessert-shop-birthday-cake&frogReturn=offwork`,
      label: buildSceneJumpOptionLabel(frogScene8TitleParts, frogScene8Preview),
      titleParts: frogScene8TitleParts,
      preview: frogScene8Preview,
      steps: frogDessertShopSteps,
      stepFilter: (step) => !isKoalaChapterSceneJumpStepId(step.id),
      kind: "frog-dessert",
      orderIndex: frogDessertSceneOrderStart + 1,
      onBeforeSelect: (step) => {
        if (isFrogPostPhotoSceneJumpStepId(step?.id)) {
          applyFinalFrogSceneJumpPreset();
          return;
        }
        applySceneJumpPreset("post-frog-second-photo");
      },
    },
  ];
  const koalaScene1TitleParts = ["koala-scene-1", "無尾熊", "日記"];
  const koalaScene1Preview = "交換日記：閱讀《無尾熊的晚餐》，發現三個同事請託";
  const koalaScene2TitleParts = ["koala-scene-2", "無尾熊", "安排行程"];
  const koalaScene2Preview = "隔天：依照無尾熊日記的線索安排上班行程";
  const koalaScene3TitleParts = ["koala-scene-3", "無尾熊", "上班"];
  const koalaScene3Preview = "公司：第一次同事請託，整理櫃子";
  const koalaScene4TitleParts = ["koala-scene-4", "無尾熊", "上班"];
  const koalaScene4Preview = "公司：第二次同事請託，拼回公文";
  const koalaScene5TitleParts = ["koala-scene-5", "無尾熊", "上班"];
  const koalaScene5Preview = "公司：第三次同事請託，辨認底色分類重要文件";
  const koalaScene6TitleParts = ["koala-scene-6", "無尾熊", "對話"];
  const koalaScene6Preview = "公司：察覺依賴、拍下無尾熊並還原日記";
  const koalaSceneOptions: SceneJumpOption[] = [
    {
      id: "koala-scene-1-diary",
      path: `${ROUTES.gameArrangeRoute}?eventId=frog-clue-dessert-shop-birthday-cake&frogReturn=offwork`,
      label: buildSceneJumpOptionLabel(koalaScene1TitleParts, koalaScene1Preview),
      titleParts: koalaScene1TitleParts,
      preview: koalaScene1Preview,
      steps: koalaChapterOpeningSteps,
      stepFilter: (step) => isKoalaChapterSceneJumpStepId(step.id),
      kind: "koala",
      orderIndex: koalaSceneOrderStart,
      onBeforeSelect: () => applyFinalFrogSceneJumpPreset(),
    },
    {
      id: "koala-scene-2-arrange-route",
      path: `${ROUTES.gameArrangeRoute}?storyRoute=koala-work`,
      label: buildSceneJumpOptionLabel(koalaScene2TitleParts, koalaScene2Preview),
      titleParts: koalaScene2TitleParts,
      preview: koalaScene2Preview,
      kind: "koala",
      orderIndex: koalaSceneOrderStart + 1,
      onBeforeSelect: applyKoalaArrangeRouteSceneJumpPreset,
    },
    {
      id: "koala-scene-3-cabinet",
      path: `${ROUTES.gameScene("scene-98-work")}?koalaRequest=1`,
      label: buildSceneJumpOptionLabel(koalaScene3TitleParts, koalaScene3Preview),
      titleParts: koalaScene3TitleParts,
      preview: koalaScene3Preview,
      kind: "koala",
      orderIndex: koalaSceneOrderStart + 2,
      onBeforeSelect: () => applyKoalaSceneJumpPreset(0),
    },
    {
      id: "koala-scene-4-shredded-document",
      path: `${ROUTES.gameScene("scene-98-work")}?koalaRequest=2`,
      label: buildSceneJumpOptionLabel(koalaScene4TitleParts, koalaScene4Preview),
      titleParts: koalaScene4TitleParts,
      preview: koalaScene4Preview,
      kind: "koala",
      orderIndex: koalaSceneOrderStart + 3,
      onBeforeSelect: () => applyKoalaSceneJumpPreset(1),
    },
    {
      id: "koala-scene-5-meeting-files",
      path: `${ROUTES.gameScene("scene-98-work")}?koalaRequest=3`,
      label: buildSceneJumpOptionLabel(koalaScene5TitleParts, koalaScene5Preview),
      titleParts: koalaScene5TitleParts,
      preview: koalaScene5Preview,
      kind: "koala",
      orderIndex: koalaSceneOrderStart + 4,
      onBeforeSelect: () => applyKoalaSceneJumpPreset(2),
    },
    {
      id: "koala-scene-6-office-event",
      path: `${ROUTES.gameArrangeRoute}?eventId=office-sunbeast-koala`,
      label: buildSceneJumpOptionLabel(koalaScene6TitleParts, koalaScene6Preview),
      titleParts: koalaScene6TitleParts,
      preview: koalaScene6Preview,
      steps: [...KOALA_SCENE_JUMP_STEPS],
      kind: "koala",
      orderIndex: koalaSceneOrderStart + 5,
      onBeforeSelect: (step) =>
        applyKoalaSceneJumpPreset(3, {
          koalaCaptured: isKoalaPostPhotoSceneJumpStepId(step?.id),
        }),
    },
  ];
  const sceneJumpOptions: SceneJumpOption[] = [
    ...storySceneOptions,
    ...frogSceneOptions,
    ...koalaSceneOptions,
    {
      id: "scene-60d-observation-sleeping-bai",
      path: `${ROUTES.gameScene("scene-60d")}?beigoObservation=sleepingBai`,
      label: buildSceneJumpOptionLabel(["scene-60d", "序章", "選項"], "沈睡的小白"),
      titleParts: ["scene-60d", "序章", "選項"],
      preview: "沈睡的小白",
      kind: "prologue",
      orderIndex: scene60dOrderIndex >= 0 ? scene60dOrderIndex + 0.1 : koalaSceneOrderStart + koalaSceneOptions.length,
    },
    {
      id: "scene-60d-observation-beigo",
      path: `${ROUTES.gameScene("scene-60d")}?beigoObservation=beigo`,
      label: buildSceneJumpOptionLabel(["scene-60d", "序章", "選項"], "小貝狗"),
      titleParts: ["scene-60d", "序章", "選項"],
      preview: "小貝狗",
      kind: "prologue",
      orderIndex: scene60dOrderIndex >= 0 ? scene60dOrderIndex + 0.2 : koalaSceneOrderStart + koalaSceneOptions.length + 1,
    },
    {
      id: "scene-60d-observation-diary",
      path: `${ROUTES.gameScene("scene-60d")}?beigoObservation=diary`,
      label: buildSceneJumpOptionLabel(["scene-60d", "序章", "選項"], "地上的日記（進到打開日記）"),
      titleParts: ["scene-60d", "序章", "選項"],
      preview: "地上的日記（進到打開日記）",
      kind: "prologue",
      orderIndex: scene60dOrderIndex >= 0 ? scene60dOrderIndex + 0.3 : koalaSceneOrderStart + koalaSceneOptions.length + 2,
    },
  ];
  const searchParams = new URLSearchParams(currentSearchString);
  const sceneJumpValue = (() => {
    const activeContextOptionId = getSceneJumpContextOptionId(sceneJumpContext);
    if (activeContextOptionId) return activeContextOptionId;

    const frogJourney = searchParams.get("frogJourney");
    if (scene.id === "scene-98-work" && frogJourney === "work-lunch") return WORK_LUNCH_SCENE_JUMP_OPTION_ID;
    if (scene.id === "scene-98-work") {
      const koalaRequest = searchParams.get("koalaRequest");
      if (koalaRequest === "1") return "koala-scene-3-cabinet";
      if (koalaRequest === "2") return "koala-scene-4-shredded-document";
      if (koalaRequest === "3") return "koala-scene-5-meeting-files";
    }
    if (scene.id === "scene-offwork" && frogJourney === "offwork") return "frog-scene-4-offwork";

    if (pathname === ROUTES.gameArrangeRoute) {
      if (searchParams.get("frogLunchReturn") === "1") return "frog-scene-3-return-to-work";
      const eventId = searchParams.get("eventId");
      if (eventId === "office-sunbeast-koala") return "koala-scene-6-office-event";
      if (eventId === "frog-clue-shop-cold-noodles") return "frog-scene-2-shop-event";
      if (eventId === "frog-clue-street-flyer") return "frog-scene-6-street-event";
      if (eventId === "frog-clue-dessert-shop-birthday-cake") {
        return isKoalaChapterSceneJumpStepId(searchParams.get("sceneStep"))
          ? "koala-scene-1-diary"
          : "frog-scene-8-dessert-shop-event";
      }

      if (searchParams.get("koalaJourney") === "arrange-route") {
        return "koala-scene-2-arrange-route";
      }

      const storyRoute = searchParams.get("storyRoute");
      if (storyRoute === "work-lunch-convenience") return WORK_LUNCH_SCENE_JUMP_OPTION_ID;
      if (storyRoute === "koala-work") return "koala-scene-2-arrange-route";
      if (storyRoute === "frog-clue") {
        if (
          progressSnapshot.hasCompletedStreetForgotLunchFrogEvent &&
          progressSnapshot.unlockedDiaryEntryIds.includes("bai-entry-5") &&
          progressSnapshot.dependentCoworkerRequestCount < 3
        ) {
          return "koala-scene-2-arrange-route";
        }
        return progressSnapshot.streetForgotLunchFrogPhotoAttemptCount >= 2
          ? "frog-scene-7-dessert-shop-route"
          : "frog-scene-5-street-route";
      }
      if (
        progressSnapshot.hasCompletedStreetForgotLunchFrogEvent &&
        progressSnapshot.unlockedDiaryEntryIds.includes("bai-entry-5") &&
        progressSnapshot.dependentCoworkerRequestCount < 3
      ) {
        return "koala-scene-2-arrange-route";
      }
    }

    if (scene.id === "scene-60d") {
      const observation = searchParams.get("beigoObservation");
      if (observation === "sleepingBai") return "scene-60d-observation-sleeping-bai";
      if (observation === "beigo") return "scene-60d-observation-beigo";
      if (observation === "diary") return "scene-60d-observation-diary";
    }

    return scene.id;
  })();
  const visibleSceneJumpOptions = sceneJumpOptions;
  const visibleSceneJumpFilters = SCENE_JUMP_FILTERS;
  const currentSceneJumpPath = `${pathname ?? ""}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const trialModeLabel = TRIAL_BUILD_LABEL;
  const progressShortcutGroups: DevShortcutGroup[] = [
    {
      id: "story-progress",
      title: "流程進度",
      items: [
        {
          id: "chapter-one-complete",
          label: "第一章完成",
          description: "重播章節完成與客廳導引",
          tone: "green",
          onClick: triggerChapterOneFastComplete,
        },
        {
          id: "naotaro-ready-offwork",
          label: "直太郎後下班",
          description: "拍完直太郎，準備領下班獎勵",
          tone: "amber",
          onClick: triggerNaotaroReadyOffwork,
        },
        {
          id: "frog-first-home",
          label: "青蛙第一次後回家",
          description: "拍到局部青蛙，進夜晚 Hub",
          tone: "blue",
          onClick: triggerPostNaotaroFirstFrogHome,
        },
        {
          id: "frog-dessert-shop-offwork",
          label: "青蛙甜點店線索下班",
          description: "保留兩張青蛙線索照片",
          tone: "purple",
          onClick: triggerFrogDessertShopClueOffwork,
        },
      ],
    },
    {
      id: "common-destinations",
      title: "常用入口",
      items: [
        {
          id: "street-options",
          label: "街道選項",
          description: "套用便利商店解鎖後進街道",
          tone: "brown",
          onClick: handleStreetExploreDebugApply,
        },
        {
          id: "game-lobby",
          label: "外層大廳",
          description: "主線 / 每日入口",
          tone: "green",
          href: withTrialProfileSearch(ROUTES.gameLobby, effectiveTrialProfile),
        },
        {
          id: "journal",
          label: "交換日記",
          description: "夜晚 Hub 直接開日記",
          tone: "brown",
          href: withTrialProfileSearch(`${ROUTES.gameScene("scene-night-hub")}?diary=1`, effectiveTrialProfile),
        },
        {
          id: "sunbeast-book",
          label: "小日獸圖鑑",
          description: "夜晚 Hub 直接開圖鑑",
          tone: "blue",
          href: withTrialProfileSearch(`${ROUTES.gameScene("scene-night-hub")}?diary=1&tab=sunbeast`, effectiveTrialProfile),
        },
        {
          id: "metro-exit",
          label: "捷運出口關卡",
          description: "直接進出口路線教學",
          tone: "green",
          href: withTrialProfileSearch(`${ROUTES.gameArrangeRoute}?storyRoute=metro-exit`, effectiveTrialProfile),
        },
        {
          id: "arrange-route",
          label: "安排路線",
          description: "回到路線盤",
          tone: "neutral",
          href: withTrialProfileSearch(ROUTES.gameArrangeRoute, effectiveTrialProfile),
        },
      ],
    },
  ];
  const marketingShortcutGroup: DevShortcutGroup = {
    id: "marketing-materials",
    title: "行銷素材",
    items: MARKETING_MATERIALS.map((material) => ({
      id: material.id,
      label: material.title,
      description: material.description,
      tone: material.category === "社群素材" ? "purple" : "green",
      href: withTrialProfileSearch(material.href, effectiveTrialProfile),
    })),
  };
  return (
    <Flex minH="100dvh" bgColor="#F2F1E7" alignItems="center" justifyContent="center">
      <Flex
        w="100%"
        maxW="1800px"
        px={{ base: "0", lg: "16px", xl: "32px" }}
        py={{ base: "0", lg: "16px", xl: "24px" }}
        gap={{ base: "0", lg: "12px", xl: "24px" }}
        alignItems="center"
        justifyContent="center"
      >
        <Flex
          display={{ base: "none", lg: "flex" }}
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
              <Flex direction="column" gap="6px" mt="4px">
                {showDebugTools ? (
                  <SceneJumpDropdown
                    menuId="dev-scene-jump"
                    options={visibleSceneJumpOptions}
                    filters={visibleSceneJumpFilters}
                    activeContext={sceneJumpContext}
                    value={sceneJumpValue}
                    placeholder="選擇敘事節點"
                    onSelect={(option, step) => {
                      const target = withTrialProfileSearch(
                        withSceneJumpStep(option.pathForStep?.(step) ?? option.path, step?.id),
                        effectiveTrialProfile,
                      );
                      option.onBeforeSelect?.(step);
                      if (option.onBeforeSelect && typeof window !== "undefined") {
                        window.location.assign(target);
                        return;
                      }
                      if (target === currentSceneJumpPath) return;
                      setCurrentSearchString(getRouteSearchString(target));
                      router.push(target);
                    }}
                  />
                ) : null}
              </Flex>
            </Flex>
            {showDebugTools ? (
              <>
                <Flex wrap="wrap" gap="8px">
                  <Flex
                    flex="1 1 calc(50% - 4px)"
                    minW="0"
                    px="10px"
                    bgColor="#4D7B6F"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="600"
                    textAlign="center"
                    lineHeight="1.2"
                    onClick={triggerChapterOneFastComplete}
                  >
                    金手指：第一章完成
                  </Flex>
                  <NextLink
                    href={ROUTES.gameArrangeRoute}
                    style={{ flex: "1 1 calc(50% - 4px)", minWidth: 0, textDecoration: "none" }}
                  >
                    <Flex
                      w="100%"
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
                      textAlign="center"
                      lineHeight="1.2"
                    >
                      金手指：安排路線
                    </Flex>
                  </NextLink>
                  <Flex
                    as="button"
                    flex="1 1 calc(50% - 4px)"
                    minW="0"
                    px="10px"
                    border="0"
                    bgColor="#9D7859"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="600"
                    textAlign="center"
                    lineHeight="1.2"
                    onClick={effectiveOnResetProgress}
                  >
                    重新開始
                  </Flex>
                  <Flex
                    as="button"
                    flex="1 1 calc(50% - 4px)"
                    minW="0"
                    px="10px"
                    border="0"
                    bgColor="#7F5A5A"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={effectiveOnResetProgress}
                    opacity={1}
                    pointerEvents="auto"
                    fontSize="12px"
                    fontWeight="600"
                    textAlign="center"
                    lineHeight="1.2"
                  >
                    重置玩家資料
                  </Flex>
                </Flex>
                <ArrangeRoutePresetPicker
                  presets={ARRANGE_ROUTE_DEBUG_PRESETS}
                  value={arrangeRouteDebugPresetId}
                  onChange={setArrangeRouteDebugPresetId}
                  onApply={handleArrangeRouteDebugPresetApply}
                />
              </>
            ) : (
              <Flex wrap="wrap" gap="8px">
                <NextLink
                  href={ROUTES.home}
                  style={{ flex: "1 1 calc(50% - 4px)", minWidth: 0, textDecoration: "none" }}
                >
                  <Flex
                    w="100%"
                    px="10px"
                    bgColor="#6C8E5E"
                    color="white"
                    h="38px"
                    borderRadius="10px"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="12px"
                    fontWeight="700"
                    textAlign="center"
                  >
                    回到標題
                  </Flex>
                </NextLink>
                <Flex
                  flex="1 1 calc(50% - 4px)"
                  minW="0"
                  px="10px"
                  bgColor="#7F5A5A"
                  color="white"
                  h="38px"
                  borderRadius="10px"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={effectiveOnResetProgress}
                  opacity={1}
                  pointerEvents="auto"
                  fontSize="12px"
                  fontWeight="700"
                  textAlign="center"
                >
                  重置進度
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>

        <Flex
          w={{ base: "100vw", lg: "393px" }}
          justifyContent="center"
          cursor={GAME_PROTOTYPE_CURSOR}
          css={{
            "& *": {
              cursor: `${GAME_PROTOTYPE_CURSOR} !important`,
            },
            "&:active, &:active *": {
              cursor: `${GAME_PROTOTYPE_ACTIVE_CURSOR} !important`,
            },
          }}
        >
          {children}
        </Flex>

        <Flex
          display={{ base: "none", lg: "flex" }}
          flex="1"
          minW="240px"
          maxW="360px"
          h="852px"
          bgColor="#E4E2C8"
          borderRadius="16px"
          p="20px"
          alignItems="flex-start"
        >
          <Flex direction="column" w="100%" h="100%" gap="10px" overflowY="auto" pr="2px" css={{ scrollbarWidth: "thin" }}>
            {isMarketingRoute ? (
              <>
                <Flex
                  w="100%"
                  minH="72px"
                  borderRadius="12px"
                  bgColor="#4DB1C7"
                  border="1px solid rgba(255,255,255,0.42)"
                  boxShadow="0 8px 18px rgba(66,60,44,0.12)"
                  px="14px"
                  py="12px"
                  direction="column"
                  justifyContent="center"
                >
                  <Text color="rgba(255,255,255,0.76)" fontSize="10px" fontWeight="800" lineHeight="1">
                    MARKETING MODE
                  </Text>
                  <Text color="white" fontSize="19px" fontWeight="900" lineHeight="1.4">
                    行銷素材路由
                  </Text>
                </Flex>
                <DevShortcutSection group={marketingShortcutGroup} />
                <NextLink
                  href={withTrialProfileSearch(ROUTES.gameRoot, effectiveTrialProfile)}
                  style={{ textDecoration: "none" }}
                >
                  <Flex
                    w="100%"
                    h="42px"
                    borderRadius="10px"
                    bgColor="#8E6D52"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="13px"
                    fontWeight="900"
                  >
                    返回遊戲
                  </Flex>
                </NextLink>
              </>
            ) : showDebugTools ? (
              <>
            {progressShortcutGroups.map((group) => (
              <DevShortcutSection key={group.id} group={group} />
            ))}
            <Flex direction="column" gap="7px" p="9px" borderRadius="11px" bgColor="rgba(255,255,255,0.3)">
              <Text color="#5F5B49" fontSize="12px" fontWeight="900" lineHeight="1">
                事件入口
              </Text>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
              {EVENT_CHEAT_GROUPS.map((group) => (
                <EventCheatSelect
                  key={group.id}
                  group={group}
                  value={eventCheatValues[group.id]}
                  onSelect={handleEventCheatSelect}
                />
              ))}
            </Grid>
            </Flex>
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
              onClick={() => setIsEmotionCueOpen((prev) => !prev)}
            >
              {isEmotionCueOpen ? "收合表情符號 ▲" : "展開表情符號 ▼"}
            </Flex>
            {isEmotionCueOpen ? (
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
            ) : null}
            <Grid templateColumns="repeat(1, minmax(0, 1fr))" gap="6px">
              <Flex
                h="30px"
                borderRadius="8px"
                bgColor="#7E6A5A"
                color="white"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="11px"
                onClick={() => triggerSceneTransition("fade-black", 380)}
              >
                黑幕淡入淡出
              </Flex>
            </Grid>
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
              onClick={() => setIsComicCheatOpen((prev) => !prev)}
            >
              {isComicCheatOpen ? "收合漫畫格 ▲" : "展開漫畫格 ▼"}
            </Flex>
            {isComicCheatOpen ? (
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="6px">
                {COMIC_CHEAT_OPTIONS.map((comic) => (
                  <Flex
                    key={comic.id}
                    h="30px"
                    borderRadius="8px"
                    bgColor="#7E6A5A"
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    fontSize="11px"
                    onClick={() => triggerComicCheat(comic.id)}
                  >
                    {comic.label}
                  </Flex>
                ))}
              </Grid>
            ) : null}
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
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(139,106,78,0.2)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={() => setIsAvatarMotionOpen((prev) => !prev)}
            >
              {isAvatarMotionOpen ? "收合頭像動作金手指 ▲" : "展開頭像動作金手指 ▼"}
            </Flex>
            {isAvatarMotionOpen ? (
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
            ) : null}
            <Box h="1px" bgColor="rgba(90,86,72,0.25)" my="6px" />
            <Flex
              h="28px"
              borderRadius="8px"
              bgColor="rgba(111,126,139,0.2)"
              color="#5F5B49"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              fontSize="12px"
              fontWeight="700"
              onClick={() => {
                setIsAvatarExpressionOpen((prev) => !prev);
                setHoveredExpression(null);
              }}
            >
              {isAvatarExpressionOpen ? "收合角色表情金手指 ▲" : "展開角色表情金手指 ▼"}
            </Flex>
            {isAvatarExpressionOpen ? (
              <>
                <Flex gap="6px" mb="2px">
                  {([
                    { id: "mai", label: "小麥" },
                    { id: "bai", label: "小白" },
                    { id: "beigo", label: "小貝狗" },
                  ] as const).map((tab) => (
                    <Flex
                      key={tab.id}
                      flex="1"
                      h="28px"
                      borderRadius="8px"
                      bgColor={expressionCheatTab === tab.id ? "#6F7E8B" : "rgba(255,255,255,0.34)"}
                      color={expressionCheatTab === tab.id ? "white" : "#5F5B49"}
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      fontSize="12px"
                      fontWeight="700"
                      onClick={() => {
                        setExpressionCheatTab(tab.id);
                        setHoveredExpression(null);
                      }}
                    >
                      {tab.label}
                    </Flex>
                  ))}
                </Flex>
                <Flex wrap="wrap" gap="6px">
                  {expressionOptions.map((expression) => (
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
                      onMouseEnter={(event) =>
                        setHoveredExpression({
                          frameIndex: expression.frameIndex,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseMove={(event) =>
                        setHoveredExpression({
                          frameIndex: expression.frameIndex,
                          x: event.clientX,
                          y: event.clientY,
                        })
                      }
                      onMouseLeave={() => setHoveredExpression(null)}
                      onClick={() =>
                        triggerAvatarExpression(expression.frameIndex, expressionCheatTab)
                      }
                    >
                      {expression.title}
                    </Flex>
                  ))}
                </Flex>
              </>
            ) : null}
            {previewFrame !== null && hoveredExpression ? (
              <Flex
                position="fixed"
                left={`${tooltipLeft}px`}
                top={`${tooltipTop}px`}
                zIndex={2000}
                px="8px"
                py="8px"
                borderRadius="8px"
                bgColor="rgba(58,56,49,0.96)"
                border="1px solid rgba(255,255,255,0.18)"
                boxShadow="0 8px 18px rgba(0,0,0,0.25)"
                pointerEvents="none"
                alignItems="center"
                gap="8px"
              >
                <Flex
                  w={`${previewWidth}px`}
                  h={`${previewHeight}px`}
                  borderRadius="6px"
                  border="1px solid rgba(255,255,255,0.24)"
                  backgroundImage={
                    previewFramePath
                      ? `url('${previewFramePath}')`
                      : `url('${expressionSpriteMeta.imagePath}')`
                  }
                  bgRepeat="no-repeat"
                  backgroundSize={
                    previewFramePath ? "contain" : `${previewSheetWidth}px ${previewSheetHeight}px`
                  }
                  backgroundPosition={
                    previewFramePath
                      ? "center"
                      : `-${previewCol * SPRITE_FRAME_WIDTH * PREVIEW_SCALE}px -${previewRow * SPRITE_FRAME_HEIGHT * PREVIEW_SCALE}px`
                  }
                />
                <Text color="white" fontSize="11px" whiteSpace="nowrap">
                  {expressionCheatTab === "mai"
                    ? "小麥"
                    : expressionCheatTab === "bai"
                      ? "小白"
                      : "小貝狗"}{" "}
                  · {previewExpressionTitle}
                </Text>
              </Flex>
            ) : null}
              </>
            ) : (
              <>
                <Flex
                  w="100%"
                  minH="72px"
                  borderRadius="12px"
                  bgColor="#6C8E5E"
                  border="1px solid rgba(255,255,255,0.42)"
                  boxShadow="0 8px 18px rgba(66,60,44,0.12)"
                  px="14px"
                  py="12px"
                  direction="column"
                  justifyContent="center"
                >
                  <Text color="rgba(255,255,255,0.76)" fontSize="11px" fontWeight="800" lineHeight="1">
                    {trialModeLabel}
                  </Text>
                  <Text color="white" fontSize="20px" fontWeight="900" lineHeight="1.35">
                    走走小日
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>

    </Flex>
  );
}

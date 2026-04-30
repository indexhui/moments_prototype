export type NarrativeMode = "normal" | "key";

export type NarrativeModeSettings = {
  mode: NarrativeMode;
  visualStyle?: "focus";
  typingMode?: "default" | "pause";
  continueDelayMs?: number;
};

export function isKeyNarrativeMode(
  settings?: NarrativeModeSettings,
): settings is NarrativeModeSettings & { mode: "key" } {
  return settings?.mode === "key";
}

export function shouldShowNarrativeFocus(settings?: NarrativeModeSettings) {
  return isKeyNarrativeMode(settings) && settings.visualStyle === "focus";
}

export function shouldUseNarrativePauseTyping(settings?: NarrativeModeSettings) {
  return isKeyNarrativeMode(settings) && settings.typingMode === "pause";
}

export function getNarrativeContinueDelayMs(settings?: NarrativeModeSettings) {
  if (!isKeyNarrativeMode(settings)) return 0;
  return settings.continueDelayMs ?? 0;
}

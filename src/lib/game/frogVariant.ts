import {
  SUNBEAST_EVENT_VARIANT,
  type SunbeastEventVariant,
} from "@/lib/game/sunbeastVariant";

export type FrogEventVariant = SunbeastEventVariant;

export const FROG_EVENT_VARIANT: FrogEventVariant = SUNBEAST_EVENT_VARIANT;

export const FROG_SUNBEAST_NAME = FROG_EVENT_VARIANT === "B" ? "青蛙B" : "青蛙";

export const FROG_A_CLUE_TEXT = "安排行程時，先經過街道，接著經過便利商店，將會遇到。";

export const FROG_B_CLUE_TEXT =
  "運勢占卜說，這個月很容易健忘的日子，但若樂於幫助人，可能會有好事發生喔！";

export const FROG_ACTIVE_CLUE_TEXT =
  FROG_EVENT_VARIANT === "B" ? FROG_B_CLUE_TEXT : FROG_A_CLUE_TEXT;

export function isFrogBEventEnabled() {
  return FROG_EVENT_VARIANT === "B";
}

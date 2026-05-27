export type SunbeastEventVariant = "A" | "B";

// Change this single value to "B" to preview the writer's alternate B-version flows.
const ACTIVE_SUNBEAST_EVENT_VARIANT: string = "A";

export const SUNBEAST_EVENT_VARIANT: SunbeastEventVariant =
  ACTIVE_SUNBEAST_EVENT_VARIANT === "B" ? "B" : "A";

export const SUNBEAST_EVENT_VERSION_LABEL =
  SUNBEAST_EVENT_VARIANT === "B" ? "版本B" : "版本A";

export const CAT_B_CLUE_TEXT =
  "若想要捕捉小日獸，有時候可以先準備好小日獸喜歡的東西喔！\n有時若想要有不同的際遇，也許走走看不同的路線。";

export const SUNBEAST_B_CLUE_SUMMARY_TEXT = "發現了青蛙B、公雞與貓的版本B線索。";

export function isSunbeastBEventEnabled() {
  return SUNBEAST_EVENT_VARIANT === "B";
}

export const CABINET_BOX_MOTION_VARIANTS = [
  "one-way",
  "tempo-shift",
  "corner-turn",
  "accelerating-bounce",
  "brief-stop",
  "wrong-way",
] as const;

export type CabinetBoxMotionVariant =
  (typeof CABINET_BOX_MOTION_VARIANTS)[number];

export const DEFAULT_EXHIBITION_DISPATCH_BOX_MOTION_VARIANT: CabinetBoxMotionVariant =
  "wrong-way";

export const CABINET_BOX_MOTION_VARIANT_META: Record<
  CabinetBoxMotionVariant,
  { label: string; description: string }
> = {
  "one-way": {
    label: "1・單向急件",
    description: "每趟只穿越一次，下一趟由反方向補送",
  },
  "tempo-shift": {
    label: "2・忽快忽慢",
    description: "同一趟途中會突然換檔",
  },
  "corner-turn": {
    label: "3・雙軸轉彎",
    description: "先走一軸，經過塔心後轉向另一軸",
  },
  "accelerating-bounce": {
    label: "4・鐘擺加速",
    description: "每次折返都更快，放下一箱後重置",
  },
  "brief-stop": {
    label: "5・短暫停靠",
    description: "高速通過塔心時停靠 180ms",
  },
  "wrong-way": {
    label: "6・錯向箱",
    description: "錯向可直接放；先滑正會讓下一箱貼滿貼紙",
  },
};

export function parseCabinetBoxMotionVariant(
  value: string | null | undefined,
): CabinetBoxMotionVariant | null {
  return CABINET_BOX_MOTION_VARIANTS.includes(
    value as CabinetBoxMotionVariant,
  )
    ? (value as CabinetBoxMotionVariant)
    : null;
}

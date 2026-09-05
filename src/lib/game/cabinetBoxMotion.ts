export const CABINET_BOX_MOTION_VARIANTS = [
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
  "wrong-way": {
    label: "錯向箱",
    description: "箱子會從不同方向出現，可先滑正再對齊堆疊",
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

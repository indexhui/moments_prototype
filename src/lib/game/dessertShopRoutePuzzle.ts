export type SlidingTileId =
  | "vertical"
  | "corner-bottom-right"
  | "horizontal"
  | "corner-left-top"
  | "vertical-alternate";

export type SlidingSlot = SlidingTileId | null;

export const INITIAL_DESSERT_ROUTE_SLOTS: SlidingSlot[] = [
  "vertical",
  "corner-bottom-right",
  "corner-left-top",
  "horizontal",
  "vertical-alternate",
  null,
];

type Direction = "top" | "right" | "bottom" | "left";

const TILE_CONNECTIONS: Record<SlidingTileId, readonly Direction[]> = {
  vertical: ["top", "bottom"],
  "corner-bottom-right": ["bottom", "right"],
  horizontal: ["left", "right"],
  "corner-left-top": ["left", "top"],
  "vertical-alternate": ["top", "bottom"],
};

const NEXT_SLOT: Record<Direction, number> = { top: -3, right: 1, bottom: 3, left: -1 };
const OPPOSITE: Record<Direction, Direction> = {
  top: "bottom", right: "left", bottom: "top", left: "right",
};

export function areDessertRouteSlotsAdjacent(first: number, second: number) {
  if (first < 0 || first >= 6 || second < 0 || second >= 6) return false;
  return Math.abs(Math.floor(first / 3) - Math.floor(second / 3)) +
    Math.abs(first % 3 - second % 3) === 1;
}

/** Follow matching road openings from the office below slot 3 to the shop above slot 2. */
export function getConnectedDessertRoute(slots: readonly SlidingSlot[]): number[] {
  if (slots.length !== 6) return [];
  const route: number[] = [];
  let slotIndex = 3;
  let entry: Direction = "bottom";

  while (!route.includes(slotIndex)) {
    const tile = slots[slotIndex];
    if (!tile || !TILE_CONNECTIONS[tile].includes(entry)) return [];
    route.push(slotIndex);

    const exit = TILE_CONNECTIONS[tile].find((direction) => direction !== entry);
    if (!exit) return [];
    if (slotIndex === 2 && exit === "top") return route;

    const nextSlotIndex = slotIndex + NEXT_SLOT[exit];
    if (!areDessertRouteSlotsAdjacent(slotIndex, nextSlotIndex)) return [];
    slotIndex = nextSlotIndex;
    entry = OPPOSITE[exit];
  }

  return [];
}

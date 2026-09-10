/** Shared text-grid rules used by the playable diary and recording demonstrations. */
export const DIARY_PUZZLE_TEXT_GRID = { columnCount: 16, tileSize: 20, gap: 1, fontSize: 13 } as const;
export const DIARY_PUZZLE_TEXT_MOTION = { settleMs: 320, swappedSettleMs: 520, landDelayMs: 42 } as const;

const LAYER_SEQUENCE = [2, 0, 3, 1, 1, 3, 0, 2, 0, 2, 1, 3, 3, 1, 2, 0] as const;
const FIVE_ROW_SCATTER_COLUMNS = [
  [0, 2, 3, 4, 6, 7, 9, 10, 12, 13, 14, 15],
  [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 15],
  [0, 1, 2, 4, 5, 7, 8, 10, 11, 12, 14, 15],
  [0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14, 15],
  [0, 1, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15],
] as const;

export function getDiaryPuzzleTextLayerIndex(tokenIndex: number, layerCount: number) {
  return LAYER_SEQUENCE[tokenIndex % LAYER_SEQUENCE.length] % Math.max(1, layerCount);
}

export function assignDiaryPuzzleTextLayers<T>(tokens: readonly T[], layerCount?: number) {
  const counts: number[] = [];
  return tokens.map((token, tokenIndex) => {
    const layerIndex = layerCount === undefined ? null : getDiaryPuzzleTextLayerIndex(tokenIndex, layerCount);
    const layerTokenIndex = layerIndex === null ? 0 : counts[layerIndex] ?? 0;
    if (layerIndex !== null) counts[layerIndex] = layerTokenIndex + 1;
    return { token, tokenIndex, layerIndex, layerTokenIndex };
  });
}

export function buildDiaryPuzzleTextScatterSlots(tokenCount: number, layout: { columnCount: number; rowCount: number }) {
  const allSlots = Array.from({ length: layout.columnCount * layout.rowCount }, (_, index) => index);
  const preferredSlots = layout.columnCount === 16 && layout.rowCount === 5
    ? FIVE_ROW_SCATTER_COLUMNS.flatMap((columns, row) => columns.map((column) => row * layout.columnCount + column))
    : allSlots.filter((slot) => (slot % layout.columnCount + Math.floor(slot / layout.columnCount) * 2) % 4 !== 1);
  const preferredSet = new Set(preferredSlots);
  return [...preferredSlots, ...allSlots.filter((slot) => !preferredSet.has(slot))].slice(0, tokenCount);
}

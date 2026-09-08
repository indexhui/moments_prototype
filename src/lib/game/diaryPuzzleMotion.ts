type InterchangeablePieceGroups = readonly (readonly number[])[];

function getAcceptedSlotIndexes(pieceId: number, groups: InterchangeablePieceGroups) {
  return groups.find((group) => group.includes(pieceId)) ?? [pieceId];
}

export function isDiaryPuzzlePieceInCorrectSlot(
  pieceId: number,
  slotIndex: number,
  groups: InterchangeablePieceGroups = [],
) {
  return getAcceptedSlotIndexes(pieceId, groups).includes(slotIndex);
}

export function isDiaryPuzzleOrderSolved(
  order: readonly number[],
  groups: InterchangeablePieceGroups = [],
) {
  return order.length > 0 && new Set(order).size === order.length && order.every(
    (pieceId, slotIndex) =>
      Number.isInteger(pieceId) && pieceId >= 0 && pieceId < order.length &&
      isDiaryPuzzlePieceInCorrectSlot(pieceId, slotIndex, groups),
  );
}

/** Continuous text restoration as an image piece approaches its home in a 2D grid. */
export function getDiaryPuzzleDragRestoreProgress({
  pieceId,
  originSlotIndex,
  columnCount,
  deltaX,
  deltaY,
  slotStepX,
  slotStepY,
  interchangeablePieceGroups = [],
}: {
  pieceId: number;
  originSlotIndex: number;
  columnCount: number;
  deltaX: number;
  deltaY: number;
  slotStepX: number;
  slotStepY: number;
  interchangeablePieceGroups?: InterchangeablePieceGroups;
}) {
  const acceptedSlots = getAcceptedSlotIndexes(pieceId, interchangeablePieceGroups);
  const distanceToAcceptedSlot = (x: number, y: number) => Math.min(
    ...acceptedSlots.map((slot) => Math.hypot(x - slot % columnCount, y - Math.floor(slot / columnCount))),
  );
  const originX = originSlotIndex % columnCount;
  const originY = Math.floor(originSlotIndex / columnCount);
  const originDistance = Math.max(1, distanceToAcceptedSlot(originX, originY));
  const currentDistance = distanceToAcceptedSlot(
    originX + deltaX / Math.max(1, slotStepX),
    originY + deltaY / Math.max(1, slotStepY),
  );
  return 1 - Math.min(1, currentDistance / originDistance);
}

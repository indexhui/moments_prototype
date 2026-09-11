import type { CabinetBoxStickerId } from "./cabinetBoxScoring";

type BoxBounds = { x: number; z: number; width: number; depth: number };

/** A decal stays in box-local coordinates; UV bounds preserve any cut fragment. */
export type CabinetBoxRewardSticker = {
  id: string;
  stickerId: CabinetBoxStickerId;
  face: "front" | "side";
  x: number;
  z: number;
  size: number;
  uvStart: number;
  uvEnd: number;
};

const EPSILON = 0.00001;

export function createCabinetBoxRewardStickers(
  sequence: number,
  stickerId: CabinetBoxStickerId,
  box: Pick<BoxBounds, "width" | "depth">,
): CabinetBoxRewardSticker[] {
  // Alternate two visible faces with a single sticker on either face.
  const faces: CabinetBoxRewardSticker["face"][] = sequence % 2 === 0
    ? ["front", "side"]
    : [sequence % 4 === 1 ? "front" : "side"];
  const size = Math.min(25, box.width * 0.32, box.depth * 0.4);
  return faces.map((face) => ({
    id: `reward-${sequence}-${face}`,
    stickerId,
    face,
    x: face === "front" ? -box.width * 0.24 : box.width / 2,
    z: face === "front" ? box.depth / 2 : -box.depth * 0.18,
    size,
    uvStart: 0,
    uvEnd: 1,
  }));
}

export function isCabinetBoxStickerIntact(sticker: CabinetBoxRewardSticker) {
  return sticker.uvStart <= EPSILON && sticker.uvEnd >= 1 - EPSILON;
}

/** Clip onto an actual piece, never onto its newly exposed cut face.
 * Use the snapped source center on perfect axes, so the placement tolerance
 * moves the whole box (including its stickers) without trimming anything.
 */
export function clipCabinetBoxRewardStickers(
  stickers: CabinetBoxRewardSticker[],
  source: BoxBounds,
  piece: BoxBounds,
): CabinetBoxRewardSticker[] {
  return stickers.flatMap((sticker) => {
    const front = sticker.face === "front";
    const worldX = source.x + sticker.x;
    const worldZ = source.z + sticker.z;
    const facePlane = front ? worldZ : worldX;
    const pieceFacePlane = front ? piece.z + piece.depth / 2 : piece.x + piece.width / 2;
    if (Math.abs(facePlane - pieceFacePlane) > EPSILON) return [];

    const center = front ? worldX : worldZ;
    const halfWidth = sticker.size * (sticker.uvEnd - sticker.uvStart) / 2;
    const pieceCenter = front ? piece.x : piece.z;
    const pieceSize = front ? piece.width : piece.depth;
    const start = Math.max(center - halfWidth, pieceCenter - pieceSize / 2);
    const end = Math.min(center + halfWidth, pieceCenter + pieceSize / 2);
    if (end - start <= EPSILON) return [];

    const clippedCenter = (start + end) / 2;
    return [{
      ...sticker,
      x: (front ? clippedCenter : worldX) - piece.x,
      z: (front ? worldZ : clippedCenter) - piece.z,
      uvStart: Math.max(0, sticker.uvStart + (start - (center - halfWidth)) / sticker.size),
      uvEnd: Math.min(1, sticker.uvEnd - (center + halfWidth - end) / sticker.size),
    }];
  });
}

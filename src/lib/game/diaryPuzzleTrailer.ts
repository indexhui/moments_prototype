import { getDiaryPuzzleDragRestoreProgress, isDiaryPuzzleOrderSolved } from "./diaryPuzzleMotion";
import { MOVING_DIARY_FIRST_INITIAL_ORDERS, MOVING_DIARY_FIRST_LAYERS } from "./movingDiaryPuzzle";
import { assignDiaryPuzzleTextLayers, buildDiaryPuzzleTextScatterSlots, DIARY_PUZZLE_TEXT_GRID, DIARY_PUZZLE_TEXT_MOTION } from "./diaryPuzzleText";
import type { ExhibitionLocale } from "./exhibitionI18n";

export const DEFAULT_DIARY_PUZZLE_DURATION = 8;
export const DIARY_PUZZLE_ART = {
  panorama: "/images/recording/diary-puzzle/moving-empty-panorama.png",
  layers: MOVING_DIARY_FIRST_LAYERS.map((layer) => layer.imagePath),
  pointer: "/images/pointer_up.png",
  paper: ["card_top.svg", "card_repeat.svg", "card_bottom.svg"].map((file) => `/images/diary/paper-frame/${file}`),
} as const;

export const DIARY_PUZZLE_BEATS = { secondLayer: 2.96, restored: 6.9, panStart: 0.25, panEnd: 7 } as const;
export const DIARY_PUZZLE_MOVES = [
  { at: 0.55, layer: 0, from: 2, to: 0 },
  { at: 1.6, layer: 0, from: 3, to: 1 },
  { at: 3.2, layer: 1, from: 1, to: 0 },
  { at: 4.3, layer: 1, from: 2, to: 1 },
  { at: 5.4, layer: 1, from: 3, to: 2 },
] as const;
export const DIARY_PUZZLE_DRAG = { pickup: 0.15, drop: 0.67, cover: 0.08, settle: 0.18 } as const;
export const DIARY_PUZZLE_PANORAMA = { width: 2260, height: 684, stageWidth: 1920, stageHeight: 1080 } as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const point = (slot: number) => ({ x: slot % 2, y: Math.floor(slot / 2) });
const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
// The playable diary's cubic-bezier(0.18, 0.76, 0.24, 1), sampled without CSS playback state.
function textSettleEase(value: number) {
  const x = clamp(value);
  if (x === 0 || x === 1) return x;
  const bezier = (t: number, a: number, b: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let lower = 0, upper = 1;
  for (let i = 0; i < 22; i++) {
    const mid = (lower + upper) / 2;
    if (bezier(mid, 0.18, 0.24) < x) lower = mid; else upper = mid;
  }
  return bezier((lower + upper) / 2, 0.76, 1);
}

// Store each move's incoming arrangement so seeking backwards never depends on previous playback.
const orders = MOVING_DIARY_FIRST_INITIAL_ORDERS.map((order) => [...order] as number[]);
const MOVES = DIARY_PUZZLE_MOVES.map((move) => {
  const before = [...orders[move.layer]];
  const after = [...before];
  [after[move.from], after[move.to]] = [after[move.to], after[move.from]];
  orders[move.layer] = after;
  return { ...move, before, after, piece: before[move.from], displaced: before[move.to] };
});

/** All image pieces, text, hand and panorama use the recording clock, including drag and drop. */
export function sampleDiaryPuzzleTrailer(time: number, duration = DEFAULT_DIARY_PUZZLE_DURATION) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DIARY_PUZZLE_DURATION;
  const t = clamp((Number.isFinite(time) ? time : 0) / safeDuration) * DEFAULT_DIARY_PUZZLE_DURATION;
  const drag = DIARY_PUZZLE_DRAG;
  const motionEnd = drag.drop + drag.cover + drag.settle;
  const activeMove = MOVES.find((move) => t >= move.at - 0.2 && t < move.at + motionEnd + 0.12);
  const layers = MOVING_DIARY_FIRST_LAYERS.map((_, layerIndex) => {
    const layerMoves = MOVES.filter((move) => move.layer === layerIndex);
    const completedMove = layerMoves.findLast((move) => t >= move.at + drag.drop);
    const order = completedMove?.after ?? [...MOVING_DIARY_FIRST_INITIAL_ORDERS[layerIndex]];
    const current = layerMoves.find((move) => t >= move.at && t < move.at + motionEnd);
    const solvedAt = layerMoves[layerMoves.length - 1].at + motionEnd;
    const settled = ease((t - solvedAt) / 0.48);
    const pieces = [0, 1, 2, 3].map((id) => {
      const slot = order.indexOf(id);
      let { x, y } = point(slot);
      let lift = 0;
      const moving = current?.piece === id;
      if (current) {
        const from = point(current.from);
        const to = point(current.to);
        if (moving) {
          const progress = ease((t - current.at - drag.pickup) / (drag.drop - drag.pickup));
          x = interpolate(from.x, to.x, progress);
          y = interpolate(from.y, to.y, progress);
          lift = Math.sin(clamp((t - current.at) / drag.drop) * Math.PI);
        } else if (current.displaced === id) {
          const progress = ease((t - current.at - drag.drop - drag.cover) / drag.settle);
          x = interpolate(to.x, from.x, progress);
          y = interpolate(to.y, from.y, progress);
        }
      }
      const origin = current ? current.before.indexOf(id) : slot;
      const originPoint = point(origin);
      const restore = getDiaryPuzzleDragRestoreProgress({
        pieceId: id, originSlotIndex: origin, columnCount: 2,
        deltaX: x - originPoint.x, deltaY: y - originPoint.y, slotStepX: 1, slotStepY: 1,
      });
      const displacedBy = layerMoves.findLast((move) => move.displaced === id && t >= move.at + drag.drop);
      let textRestore = restore;
      if (displacedBy) {
        const progress = textSettleEase((t - displacedBy.at - drag.drop - DIARY_PUZZLE_TEXT_MOTION.landDelayMs / 1000)
          / (DIARY_PUZZLE_TEXT_MOTION.swappedSettleMs / 1000));
        if (progress < 1) {
          textRestore = interpolate(Number(displacedBy.before.indexOf(id) === id), Number(displacedBy.after.indexOf(id) === id), progress);
        }
      }
      return { id, x, y, lift, moving, restore, textRestore, textDragging: Boolean(moving && current && t < current.at + drag.drop) };
    });
    return {
      order, pieces, settled, solved: t >= solvedAt && isDiaryPuzzleOrderSolved(order),
      textMergeAge: Math.min(0.9, Math.max(0, t - layerMoves[layerMoves.length - 1].at - drag.drop)),
      opacity: layerIndex === 0 ? 1 : ease((t - DIARY_PUZZLE_BEATS.secondLayer) / 0.2),
      visible: layerIndex === 0 || t >= DIARY_PUZZLE_BEATS.secondLayer,
    };
  });
  const hand = { x: 0, y: 0, opacity: 0, scale: 1, pressed: false };
  let target: { x: number; y: number; opacity: number } | null = null;
  if (activeMove) {
    const local = t - activeMove.at;
    const from = point(activeMove.from);
    const to = point(activeMove.to);
    const progress = ease((local - drag.pickup) / (drag.drop - drag.pickup));
    const release = ease((local - drag.drop) / 0.32);
    hand.x = interpolate(from.x, to.x, progress) + 0.5 + release * 0.06;
    hand.y = interpolate(from.y, to.y, progress) + 0.5 + release * 0.12;
    hand.opacity = ease((local + 0.2) / 0.16) * (1 - ease((local - motionEnd + 0.03) / 0.15));
    hand.pressed = local >= 0 && local < drag.drop;
    hand.scale = 1 - 0.08 * ease(local / 0.1) * (1 - release);
    target = { ...to, opacity: ease((local - drag.pickup) / 0.15) * (1 - ease((local - drag.drop) / 0.3)) };
  }
  const pan = ease((t - DIARY_PUZZLE_BEATS.panStart) / (DIARY_PUZZLE_BEATS.panEnd - DIARY_PUZZLE_BEATS.panStart));
  const artworkWidth = DIARY_PUZZLE_PANORAMA.width * DIARY_PUZZLE_PANORAMA.stageHeight / DIARY_PUZZLE_PANORAMA.height;
  return {
    phase: t >= DIARY_PUZZLE_BEATS.restored ? "hold" : t >= DIARY_PUZZLE_BEATS.secondLayer ? "people" : "background",
    layers, hand, target,
    titleProgress: ease((t - 6.55) / 0.35),
    panoramaX: -(artworkWidth - DIARY_PUZZLE_PANORAMA.stageWidth) * pan,
    completedMoves: MOVES.filter((move) => t >= move.at + motionEnd).length,
  };
}

export function buildDiaryPuzzleTrailerText(text: string, locale: ExhibitionLocale = "zh") {
  const grid = DIARY_PUZZLE_TEXT_GRID;
  const columnCount = locale === "en" ? grid.columnCount * 2 : grid.columnCount;
  const rowStep = grid.tileSize + grid.gap;
  const columnStep = locale === "en" ? rowStep / 2 : rowStep;
  const cells: ({ text: string; index: number } | null)[] = [];
  if (locale === "en") {
    let index = 0;
    const words = text.replace(/\s+/g, " ").trim().match(/\S+\s*/gu) ?? [];
    for (const word of words) {
      const column = cells.length % columnCount;
      if (column > 0 && column + Array.from(word.trimEnd()).length > columnCount) {
        cells.push(...Array<null>(columnCount - column).fill(null));
      }
      for (const character of Array.from(word)) cells.push({ text: character, index: index++ });
    }
  } else {
    cells.push(...Array.from(text.replace(/\n/g, "")).map((character, index) => ({ text: character, index })));
  }
  const rowCount = Math.ceil(cells.length / columnCount) + 1;
  const scatter = buildDiaryPuzzleTextScatterSlots(cells.length, { columnCount, rowCount });
  return {
    columnCount, rowCount, columnStep, rowStep,
    width: columnCount * columnStep - grid.gap,
    height: rowCount * rowStep - grid.gap,
    // Include word-wrap gaps when assigning ownership, then omit their visuals.
    // This keeps each column bound to the same layer/piece across every row.
    tokens: assignDiaryPuzzleTextLayers(cells, MOVING_DIARY_FIRST_LAYERS.length).flatMap(entry => {
      if (entry.token === null) return [];
      // All locales use the game's sparse, cross-row scatter. Later-layer
      // letters use the recording's reserved row so restored letters stay clear.
      const scatterSlot = entry.layerIndex === 0 ? scatter[entry.tokenIndex] : entry.tokenIndex + columnCount;
      return [{
        text: entry.token.text, index: entry.token.index, layer: entry.layerIndex!, piece: entry.layerTokenIndex % 4,
        scatterSlot, solvedSlot: entry.tokenIndex,
        solvedLeft: entry.tokenIndex % columnCount * columnStep,
        solvedTop: Math.floor(entry.tokenIndex / columnCount) * rowStep,
        scatterLeft: scatterSlot % columnCount * columnStep,
        scatterTop: Math.floor(scatterSlot / columnCount) * rowStep,
        width: columnStep - grid.gap, height: grid.tileSize, fontSize: grid.fontSize,
      }];
    }),
  };
}

export function sampleDiaryPuzzleTrailerText(model: ReturnType<typeof buildDiaryPuzzleTrailerText>, scene: ReturnType<typeof sampleDiaryPuzzleTrailer>) {
  return model.tokens.filter((token) => scene.layers[token.layer].visible).map((token) => {
    const layer = scene.layers[token.layer];
    const piece = layer.pieces[token.piece];
    const progress = piece.textRestore;
    const merge = ease((layer.textMergeAge - Math.min(0.28, token.index * 0.01)) / 0.62);
    return {
      ...token, progress, merge, dragging: piece.textDragging, restored: progress >= 0.98, opacity: layer.opacity,
      left: interpolate(token.scatterLeft, token.solvedLeft, progress),
      top: interpolate(token.scatterTop, token.solvedTop, progress),
    };
  });
}

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/game/cabinetBoxScoring.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { calculateCabinetBoxScore: score, getCabinetBoxStarCount: stars,
  getCabinetBoxSticker: sticker, isCabinetBoxQuickFlip: quick } = loaded.exports;
const empty = { normal: 0, r: 0, sr: 0 };

test('zero successful boxes earn no points, including a zero-second run', () => {
  const result = score({ layers: 0, stackingElapsedMs: 0, stickers: empty, quickFlips: 0 });
  assert.equal(result.total, 0);
  assert.equal(result.stars, 0);
});

test('speed is relative to layer count, capped at 50 per layer and never negative', () => {
  const points = (seconds, layers = 10) => score({ layers, stackingElapsedMs: seconds * 1000, stickers: empty, quickFlips: 0 }).speedPoints;
  assert.equal(points(15), 500);
  assert.equal(points(10), 500);
  assert.equal(points(27.5), 250);
  assert.equal(points(40), 0);
  assert.equal(points(400), 0);
  assert.equal(points(13.75, 5), 125, 'same pace earns the same per-layer bonus');
});

test('stickers rotate N, R, SR and each collected reward counts once', () => {
  assert.deepEqual(Array.from({ length: 7 }, (_, index) => sticker(index).id), ['normal', 'r', 'sr', 'normal', 'r', 'sr', 'normal']);
  for (const [id, points] of [['normal', 50], ['r', 100], ['sr', 150]]) {
    assert.equal(score({ layers: 1, stackingElapsedMs: 4000, stickers: { ...empty, [id]: 1 }, quickFlips: 0 }).stickerPoints, points);
  }
});

test('quick flip requires a real correction, no reversal and placement within 400ms', () => {
  const attempt = { correctedAtMs: 1000, placedAtMs: 1400, directionChanges: 0 };
  assert.equal(quick(attempt), true);
  assert.equal(quick({ ...attempt, placedAtMs: 1401 }), false);
  assert.equal(quick({ ...attempt, placedAtMs: 999 }), false);
  assert.equal(quick({ ...attempt, correctedAtMs: null }), false);
  assert.equal(quick({ ...attempt, directionChanges: 1 }), false);
  assert.equal(quick({ ...attempt, directionChanges: 2 }), false);
});

test('star boundaries use total score, including exact thresholds', () => {
  for (const [points, expected] of [[0, 0], [699, 0], [700, 1], [1399, 1], [1400, 2], [2199, 2], [2200, 3], [50000, 3]]) {
    assert.equal(stars(points), expected);
  }
});

test('ordinary and advanced reference runs award the intended stars', () => {
  const normal = score({ layers: 7, stackingElapsedMs: 17500, stickers: { normal: 1, r: 1, sr: 0 }, quickFlips: 0 });
  assert.equal(normal.total, 1060);
  assert.equal(normal.stars, 1);
  const steady = score({ layers: 10, stackingElapsedMs: 25000, stickers: { normal: 1, r: 1, sr: 0 }, quickFlips: 0 });
  assert.equal(steady.total, 1450);
  assert.equal(steady.stars, 2);
  const full = score({ layers: 14, stackingElapsedMs: 28000, stickers: { normal: 1, r: 1, sr: 1 }, quickFlips: 0 });
  assert.equal(full.total, 2260);
  assert.equal(full.stars, 3);
  const advanced = score({ layers: 12, stackingElapsedMs: 24000, stickers: { normal: 2, r: 1, sr: 1 }, quickFlips: 4 });
  assert.equal(advanced.total, 2430);
  assert.equal(advanced.stars, 3);
  assert.equal(advanced.total, advanced.layerPoints + advanced.speedPoints + advanced.stickerPoints + advanced.quickFlipPoints);
});

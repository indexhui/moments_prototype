const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/lib/game/cabinetBoxStickers.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const { createCabinetBoxRewardStickers: create, clipCabinetBoxRewardStickers: clip,
  isCabinetBoxStickerIntact: intact } = loaded.exports;
const box = { x: 40, z: -30, width: 160, depth: 100 };
const stickers = create(0, 'normal', box);
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, `${a} ≠ ${b}`);

// A positive cut removes the high-coordinate edge, matching game placement.
function cut(axis, direction, amount, decals = stickers, original = box) {
  const dimension = axis === 'x' ? 'width' : 'depth';
  const retained = { ...original, [dimension]: original[dimension] - amount,
    [axis]: original[axis] - direction * amount / 2 };
  const fallen = { ...original, [dimension]: amount,
    [axis]: original[axis] + direction * (original[dimension] - amount) / 2 };
  return { kept: clip(decals, original, retained), lost: clip(decals, original, fallen), retained, fallen };
}

test('reward boxes have one or two decals, with at most one on each visible face', () => {
  for (let i = 0; i < 12; i++) {
    const decals = create(i, 'r', box);
    assert.equal(decals.length, i % 2 === 0 ? 2 : 1);
    assert.equal(new Set(decals.map(d => d.face)).size, decals.length);
    assert.ok(decals.every(d => d.stickerId === 'r' && intact(d)));
  }
  assert.equal(create(1, 'r', box)[0].face, 'front');
  assert.equal(create(3, 'normal', box)[0].face, 'side');
});

test('perfect placement keeps both stickers intact, including the snapped box center', () => {
  assert.deepEqual(clip(stickers, box, box), stickers);
  const snapped = { ...box, x: box.x + 5, z: box.z - 3 };
  assert.deepEqual(clip(stickers, snapped, snapped), stickers);
});

test('removing the right edge carries the side sticker away, without copying it to the cut face', () => {
  const { kept, lost } = cut('x', 1, 25);
  assert.deepEqual(kept.filter(intact).map(d => d.face), ['front']);
  assert.deepEqual(lost.filter(intact).map(d => d.face), ['side']);
});

test('removing the front edge carries the front sticker away', () => {
  const { kept, lost } = cut('z', 1, 20);
  assert.deepEqual(kept.filter(intact).map(d => d.face), ['side']);
  assert.deepEqual(lost.filter(intact).map(d => d.face), ['front']);
});

test('cuts from the other two edges retain both stickers when they miss the decals', () => {
  for (const axis of ['x', 'z']) {
    const { kept, lost } = cut(axis, -1, 10);
    assert.equal(kept.filter(intact).length, 2);
    assert.equal(lost.length, 0);
  }
});

test('large cuts can lose every sticker even though part of the box lands successfully', () => {
  const { kept, lost } = cut('x', 1, 145);
  assert.equal(kept.length, 0);
  assert.equal(lost.filter(intact).length, 2);
});

test('a cut through either sticker creates complementary UV fragments and awards neither fragment', () => {
  for (const [axis, face] of [['x', 'front'], ['z', 'side']]) {
    const decal = stickers.find(d => d.face === face);
    const dimension = axis === 'x' ? 'width' : 'depth';
    const { kept, lost } = cut(axis, -1, box[dimension] / 2 + decal[axis]);
    const keptDecal = kept.find(d => d.face === face);
    const lostDecal = lost.find(d => d.face === face);
    assert.ok(keptDecal && lostDecal);
    assert.equal(intact(keptDecal), false);
    assert.equal(intact(lostDecal), false);
    near(keptDecal.uvStart, 0.5);
    near(lostDecal.uvEnd, 0.5);
    near(keptDecal.uvEnd - keptDecal.uvStart + lostDecal.uvEnd - lostDecal.uvStart, 1);
  }
});

test('unclipped decals keep their world position after rebasing to each piece', () => {
  for (const axis of ['x', 'z']) {
    for (const direction of [-1, 1]) {
      const { kept, lost, retained, fallen } = cut(axis, direction, 10);
      for (const [decals, piece] of [[kept, retained], [lost, fallen]]) {
        for (const decal of decals.filter(intact)) {
          const before = stickers.find(d => d.id === decal.id);
          near(piece.x + decal.x, box.x + before.x);
          near(piece.z + decal.z, box.z + before.z);
        }
      }
    }
  }
});

test('an exact sticker-edge cut preserves the full sticker without a duplicate sliver', () => {
  const decal = stickers.find(d => d.face === 'front');
  const { kept, lost } = cut('x', -1, box.width / 2 + decal.x - decal.size / 2);
  assert.ok(kept.find(d => d.id === decal.id && intact(d)));
  assert.equal(lost.length, 0);
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/game/diaryPuzzleMotion.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const loaded = { exports: {} };
new Function('module', 'exports', outputText)(loaded, loaded.exports);
const progress = loaded.exports.getDiaryPuzzleDragRestoreProgress;
const { isDiaryPuzzleOrderSolved, isDiaryPuzzlePieceInCorrectSlot } = loaded.exports;
const grid = { columnCount: 2, slotStepX: 120, slotStepY: 80, deltaX: 0, deltaY: 0 };

test('vertical and horizontal drags restore text continuously before dropping', () => {
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    assert.equal(progress({ ...grid, pieceId: 0, originSlotIndex: 2, deltaY: -80 * fraction }), fraction);
    assert.equal(progress({ ...grid, pieceId: 0, originSlotIndex: 1, deltaX: -120 * fraction }), fraction);
  }
});

test('diagonal movement uses both axes, including rectangular puzzle pieces', () => {
  assert.equal(progress({ ...grid, pieceId: 0, originSlotIndex: 3, deltaX: -60, deltaY: -40 }), 0.5);
  assert.equal(progress({ ...grid, pieceId: 0, originSlotIndex: 3, deltaX: -120, deltaY: -80 }), 1);
  assert.ok(progress({ ...grid, pieceId: 0, originSlotIndex: 3, deltaX: -120 }) < 1);
});

test('lifting a correct piece and moving it away releases its restored text', () => {
  assert.equal(progress({ ...grid, pieceId: 1, originSlotIndex: 1 }), 1);
  assert.equal(progress({ ...grid, pieceId: 1, originSlotIndex: 1, deltaX: 60 }), 0.5);
  assert.equal(progress({ ...grid, pieceId: 1, originSlotIndex: 1, deltaX: 120 }), 0);
});

test('the dining-table layer accepts exactly the two upper-row permutations', () => {
  function permutations(values) {
    return values.length === 0 ? [[]] : values.flatMap((value, index) =>
      permutations(values.filter((_, i) => i !== index)).map((rest) => [value, ...rest]),
    );
  }
  const orders = permutations([0, 1, 2, 3]);
  assert.deepEqual(orders.filter((order) => isDiaryPuzzleOrderSolved(order, [[0, 1]])), [
    [0, 1, 2, 3], [1, 0, 2, 3],
  ]);
  // The other layers retain their original exact-order rule.
  assert.deepEqual(orders.filter((order) => isDiaryPuzzleOrderSolved(order)), [[0, 1, 2, 3]]);
  assert.equal(isDiaryPuzzleOrderSolved([0, 0, 2, 3], [[0, 1]]), false);
});

test('upper-row text accepts either upper slot even while the lower row is unsolved', () => {
  for (const pieceId of [0, 1]) {
    for (const slotIndex of [0, 1]) {
      assert.equal(isDiaryPuzzlePieceInCorrectSlot(pieceId, slotIndex, [[0, 1]]), true);
      assert.equal(progress({ ...grid, pieceId, originSlotIndex: slotIndex, interchangeablePieceGroups: [[0, 1]] }), 1);
    }
    assert.equal(isDiaryPuzzlePieceInCorrectSlot(pieceId, 2, [[0, 1]]), false);
    assert.equal(isDiaryPuzzlePieceInCorrectSlot(pieceId, 3, [[0, 1]]), false);
  }
});

test('a blank piece restores when dragged into either upper slot, but lower pieces remain distinct', () => {
  const blank = { ...grid, pieceId: 0, originSlotIndex: 3, interchangeablePieceGroups: [[0, 1]] };
  assert.equal(progress({ ...blank, deltaY: -40 }), 0.5);
  assert.equal(progress({ ...blank, deltaY: -80 }), 1);
  assert.equal(progress({ ...blank, deltaX: -120, deltaY: -80 }), 1);
  assert.equal(progress({ ...blank, deltaY: 80 }), 0);
  assert.equal(progress({ ...blank, pieceId: 2 }), 0);
  assert.equal(progress({ ...blank, pieceId: 2, deltaX: -120 }), 1);
});

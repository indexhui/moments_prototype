const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/game', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, (id) => load(id.replace('./', '')));
  cache.set(name, loaded.exports);
  return loaded.exports;
}
const { sampleDiaryPuzzleTrailer: sample, DIARY_PUZZLE_MOVES: moves, DIARY_PUZZLE_DRAG: drag, DIARY_PUZZLE_ART: art, DIARY_PUZZLE_PANORAMA: panorama } = load('diaryPuzzleTrailer');
const { MOVING_DIARY_FIRST_INITIAL_ORDERS: initial } = load('movingDiaryPuzzle');
const { buildDiaryPuzzleTrailerText: buildText, sampleDiaryPuzzleTrailerText: sampleText } = load('diaryPuzzleTrailer');
const diaryText = '今天是和小麥正式成為室友的日子！\n我們約了搬家公司，只是在門口等搬家公司來的時候，街道忽然傳來一陣騷動……';
const textModel = buildText(diaryText);
const { TRAILER_COPY, TRAILER_LOGOS } = load('trailerI18n');

test('translated diary characters fit the paper and never overlap during the second layer', () => {
  for (const locale of ['zh', 'en', 'ja']) {
    const model = buildText(TRAILER_COPY.diaryText[locale], locale);
    assert.ok(model.height / model.width * 37.5 < 14.2, `${locale}: diary text exceeds the paper`);
    assert.equal(model.tokens.map(token => token.text).join(''), TRAILER_COPY.diaryText[locale].replace(/\n/g, ''));
    if (locale === 'en') assert.ok(model.tokens.every(token => Array.from(token.text).length === 1), 'each English letter has its own tile');
    for (let frame = 355; frame <= 960; frame++) {
      const tiles = sampleText(model, sample(frame / 120));
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        assert.ok(tile.left >= 0 && tile.left + tile.width <= model.width + 1e-8);
        assert.ok(tile.top >= 0 && tile.top + tile.height <= model.height + 1e-8);
        for (const other of tiles.slice(i + 1)) {
          const overlapX = Math.min(tile.left + tile.width, other.left + other.width) - Math.max(tile.left, other.left);
          const overlapY = Math.min(tile.top + tile.height, other.top + other.height) - Math.max(tile.top, other.top);
          assert.ok(overlapX < 1e-8 || overlapY < 1e-8, `${locale} tiles ${tile.index}/${other.index} overlap at ${frame / 120}`);
        }
      }
    }
    assert.ok(sampleText(model, sample(8)).every(tile => tile.progress === 1 && tile.merge === 1));
    assert.ok(fs.existsSync(path.join(__dirname, '../public', TRAILER_LOGOS[locale].src)));
  }
});
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('English letters within a word follow their own image pieces and restore readable word spacing', () => {
  const text = TRAILER_COPY.diaryText.en;
  const model = buildText(text, 'en');
  const wordStart = text.indexOf('roommates');
  const word = model.tokens.slice(wordStart, wordStart + 'roommates'.length);
  assert.ok(new Set(word.map(tile => `${tile.layer}:${tile.piece}`)).size > 1, 'letters within a word move independently');
  assert.equal(new Set(word.map(tile => tile.solvedTop)).size, 1, 'wrapping must not split a word');
  for (const move of moves) {
    const before = sampleText(model, sample(move.at));
    const during = sampleText(model, sample(move.at + drag.pickup + (drag.drop - drag.pickup) / 2));
    const pieceId = sample(move.at).layers[move.layer].order[move.from];
    const moving = during.filter(tile => tile.layer === move.layer && tile.piece === pieceId && tile.text.trim());
    assert.ok(moving.length > 0);
    let movedCount = 0;
    for (const tile of moving) {
      assert.equal(tile.dragging, true);
      const previous = before.find(previous => previous.index === tile.index);
      const distanceBefore = Math.hypot(previous.left - tile.solvedLeft, previous.top - tile.solvedTop);
      const distanceDuring = Math.hypot(tile.left - tile.solvedLeft, tile.top - tile.solvedTop);
      if (distanceBefore > 0) {
        assert.ok(distanceDuring < distanceBefore);
        movedCount++;
      }
    }
    assert.ok(movedCount > 1);
    for (const tile of during.filter(tile => tile.layer === move.layer && tile.piece !== pieceId)) {
      const previous = before.find(previous => previous.index === tile.index);
      assert.equal(tile.dragging, false);
      // A previous swap can still be finishing its settling animation.
      if (previous.progress === 1) near(tile.top, previous.top);
    }
  }
  const restored = sampleText(model, sample(8));
  assert.equal(restored.map(tile => tile.text).join(''), text);
  assert.ok(restored.every(tile => tile.top === tile.solvedTop && tile.left === tile.solvedLeft));
  const partial = sampleText(model, sample(3.6));
  sampleText(model, sample(8));
  assert.deepEqual(sampleText(model, sample(3.6)), partial, 'letter motions must rewind exactly');
});

test('English uses the shared Chinese scatter, cross-column travel and preserved-layer recording rules', () => {
  const { buildDiaryPuzzleTextScatterSlots: scatterSlots } = load('diaryPuzzleText');
  const model = buildText(TRAILER_COPY.diaryText.en, 'en');
  const slotCount = model.tokens.at(-1).solvedSlot + 1;
  const shared = scatterSlots(slotCount, model);
  const first = model.tokens.filter(tile => tile.layer === 0 && tile.text.trim());
  for (const tile of first) assert.equal(tile.scatterSlot, shared[tile.solvedSlot]);
  assert.ok(first.filter(tile => tile.scatterLeft !== tile.solvedLeft).length > first.length * .75, 'letters must cross columns');
  assert.ok(first.some(tile => tile.scatterLeft < tile.solvedLeft), 'some letters move right');
  assert.ok(first.some(tile => tile.scatterLeft > tile.solvedLeft), 'some letters move left');
  assert.ok(first.some(tile => Math.abs(tile.scatterLeft - tile.solvedLeft) > model.width / 2), 'scatter spans the page');
  assert.ok(first.some(tile => tile.scatterTop - tile.solvedTop >= model.rowStep * 2), 'scatter crosses multiple rows');
  const second = model.tokens.filter(tile => tile.layer === 1);
  assert.ok(second.every(tile => tile.scatterSlot === tile.solvedSlot + model.columnCount));
  for (const tile of sampleText(model, sample(4.7)).filter(tile => tile.layer === 0)) {
    near(tile.left, tile.solvedLeft);
    near(tile.top, tile.solvedTop);
  }
});

test('five legal swaps solve the actual two-layer first moving diary without disturbing a solved layer', () => {
  const orders = initial.map(order => [...order]);
  for (const move of moves) {
    assert.equal(orders[move.layer][move.from], move.to, 'the dragged piece belongs in the target slot');
    [orders[move.layer][move.from], orders[move.layer][move.to]] = [orders[move.layer][move.to], orders[move.layer][move.from]];
    const state = sample(move.at + drag.drop + drag.cover + drag.settle + .01);
    assert.deepEqual(state.layers.map(layer => layer.order), orders);
    if (move.layer === 1) assert.equal(state.layers[0].solved, true);
  }
  assert.deepEqual(orders, [[0, 1, 2, 3], [0, 1, 2, 3]]);
  assert.equal(sample(0).layers[1].visible, false);
  assert.equal(sample(2.9).layers[0].solved, true);
  assert.equal(sample(2.9).layers[1].visible, false);
});

test('finger stays attached to the moving piece on horizontal, vertical and diagonal drags', () => {
  for (const move of moves) {
    const start = sample(move.at);
    const draggedId = start.layers[move.layer].order[move.from];
    for (const fraction of [.1, .5, .9]) {
      const state = sample(move.at + drag.pickup + (drag.drop - drag.pickup) * fraction);
      const piece = state.layers[move.layer].pieces[draggedId];
      assert.equal(piece.moving, true);
      assert.equal(state.hand.pressed, true);
      assert.equal(state.hand.opacity, 1);
      near(state.hand.x, piece.x + .5);
      near(state.hand.y, piece.y + .5);
      assert.ok(piece.restore > 0 && piece.restore < 1);
    }
  }
});

test('displaced tile waits beneath the dropped piece then returns to the vacated slot', () => {
  const move = moves[0];
  const covered = sample(move.at + drag.drop + drag.cover / 2);
  near(covered.layers[0].pieces[2].y, 0);
  const sliding = sample(move.at + drag.drop + drag.cover + drag.settle / 2);
  near(sliding.layers[0].pieces[2].y, .5);
  const settled = sample(move.at + drag.drop + drag.cover + drag.settle + .01);
  near(settled.layers[0].pieces[2].y, 1);
  assert.equal(settled.layers[0].pieces[2].restore, 1);
});

test('panorama travels left while always covering the 16:9 stage', () => {
  const width = panorama.width * panorama.stageHeight / panorama.height;
  let previousX = 0;
  for (let i = 0; i <= 800; i++) {
    const x = sample(i / 100).panoramaX;
    assert.ok(x <= previousX && x <= 0);
    assert.ok(x + width >= panorama.stageWidth - 1e-8);
    previousX = x;
  }
  near(sample(0).panoramaX, 0);
  near(sample(8).panoramaX, panorama.stageWidth - width);
});

test('final hold restores all pieces and text, resolves the title and clears the hand', () => {
  const state = sample(8);
  assert.equal(state.phase, 'hold');
  assert.equal(state.completedMoves, 5);
  assert.equal(state.hand.opacity, 0);
  assert.equal(state.titleProgress, 1);
  for (const layer of state.layers) {
    assert.equal(layer.solved, true);
    assert.equal(layer.settled, 1);
    assert.ok(layer.pieces.every(piece => piece.restore === 1 && piece.lift === 0));
  }
  assert.deepEqual(sample(7.2), state);
  assert.deepEqual(sample(100), state);
});

test('pause, reverse seeking and total duration changes produce the same pose', () => {
  const rounded = value => JSON.stringify(value, (_, v) => typeof v === 'number' ? Number(v.toFixed(8)) : v);
  for (const duration of [5.5, 8, 14]) {
    for (const time of [.2, .7, 1, 1.9, 2.6, 3.05, 3.6, 4.7, 5.9, 6.6, 8]) {
      const state = sample(time * duration / 8, duration);
      assert.equal(rounded(state), rounded(sample(time)));
      sample(duration, duration);
      assert.deepEqual(sample(time * duration / 8, duration), state);
    }
  }
  assert.deepEqual(sample(-3), sample(0));
  assert.deepEqual(sample(0, 0), sample(0));
});

test('all original artwork and the exported empty panorama are available locally', () => {
  for (const asset of Object.values(art).flat()) assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
});

test('text layers interleave through the whole diary and the first layer retains its sparse scatter slots', () => {
  assert.deepEqual(textModel.tokens.slice(0, 16).map(token => token.layer), [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0]);
  assert.deepEqual(textModel.tokens.filter(token => token.layer === 0).slice(0, 8).map(token => token.piece), [0, 1, 2, 3, 0, 1, 2, 3]);
  const firstLayer = textModel.tokens.filter(token => token.layer === 0);
  assert.deepEqual(firstLayer.slice(0, 8).map(token => token.scatterSlot), [0, 2, 9, 10, 12, 13, 19, 20]);
  assert.equal(new Set(firstLayer.map(token => token.scatterSlot)).size, firstLayer.length);
  assert.equal(textModel.tokens.map(token => token.text).join(''), diaryText.replace(/\n/g, ''));
  const start = sampleText(textModel, sample(0));
  assert.ok(start.every(tile => tile.layer === 0));
  assert.ok(start.some(tile => tile.index >= diaryText.indexOf('\n')), 'first-layer characters extend into the later sentence');
});

test('second-layer letters never overlap settled letters or each other throughout entry, drag and settling', () => {
  const firstLayerFinal = sampleText(textModel, sample(8)).filter(tile => tile.layer === 0);
  // Sweep at 120 Hz, including both sides of layer entry and every drag/drop boundary.
  const times = Array.from({ length: Math.ceil((8 - 2.95) * 120) + 1 }, (_, index) => 2.95 + index / 120);
  for (const move of moves.filter(move => move.layer === 1)) {
    for (const offset of [0, drag.pickup, drag.drop, drag.drop + drag.cover, drag.drop + drag.cover + drag.settle]) {
      times.push(move.at + offset - .0001, move.at + offset, move.at + offset + .0001);
    }
  }
  for (const time of times) {
    const tiles = sampleText(textModel, sample(time));
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      assert.ok(tile.left >= 0 && tile.left + 20 <= textModel.width + 1e-8);
      assert.ok(tile.top >= 0 && tile.top + 20 <= textModel.height + 1e-8);
      if (tile.layer === 0) {
        const final = firstLayerFinal.find(item => item.index === tile.index);
        assert.equal(tile.left, final.left);
        assert.equal(tile.top, final.top);
      }
      for (let j = i + 1; j < tiles.length; j++) {
        const other = tiles[j];
        const overlapX = Math.min(tile.left, other.left) + 20 - Math.max(tile.left, other.left);
        const overlapY = Math.min(tile.top, other.top) + 20 - Math.max(tile.top, other.top);
        assert.ok(overlapX <= 0 || overlapY <= 0, `letters ${tile.index} and ${other.index} overlap at ${time}s`);
      }
    }
  }
});

test('dragging a piece moves only its assigned text group toward its own reading slots', () => {
  const before = sampleText(textModel, sample(.55));
  const during = sampleText(textModel, sample(.98));
  let movingCount = 0;
  during.forEach((tile, index) => {
    if (tile.piece === 0) {
      assert.equal(tile.dragging, true);
      assert.ok(tile.progress > 0 && tile.progress < 1);
      if (tile.scatterSlot !== tile.solvedSlot) {
        assert.ok(tile.left !== before[index].left || tile.top !== before[index].top);
        movingCount++;
      }
    } else {
      assert.equal(tile.dragging, false);
      assert.equal(tile.left, before[index].left);
      assert.equal(tile.top, before[index].top);
    }
  });
  assert.ok(movingCount > 1);
});

test('swapped text keeps its own settling delay after the image returns to its home', () => {
  const state = sample(1.52);
  assert.equal(state.layers[0].pieces[2].restore, 1);
  assert.ok(state.layers[0].pieces[2].textRestore > 0 && state.layers[0].pieces[2].textRestore < 1);
  const prior = sampleText(textModel, sample(2.9));
  const next = sampleText(textModel, sample(3.2));
  assert.equal(next.length, textModel.tokens.length);
  prior.forEach(tile => {
    const preserved = next.find(item => item.index === tile.index);
    assert.equal(preserved.left, tile.left);
    assert.equal(preserved.top, tile.top);
    assert.equal(preserved.merge, 1);
  });
});

test('all text finishes in unique reading slots and stays deterministic when seeking or changing duration', () => {
  const ending = sampleText(textModel, sample(8));
  assert.equal(new Set(ending.map(tile => `${tile.left},${tile.top}`)).size, ending.length);
  assert.ok(ending.every(tile => tile.progress === 1 && tile.merge === 1));
  assert.ok(ending.every(tile => tile.left >= 0 && tile.left + 20 <= textModel.width && tile.top >= 0 && tile.top + 20 <= textModel.height));
  for (const time of [.98, 1.52, 2.9, 3.8, 4.8, 6.3, 7.2]) {
    const original = sampleText(textModel, sample(time));
    sampleText(textModel, sample(8));
    assert.deepEqual(sampleText(textModel, sample(time)), original);
    const doubled = sampleText(textModel, sample(time * 2, 16));
    assert.deepEqual(doubled, original);
  }
});

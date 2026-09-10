const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sharp = require('sharp');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/game', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, id => load(id.replace('./', '')));
  cache.set(name, loaded.exports);
  return loaded.exports;
}
const { sampleEndingTrailer: sample, ENDING_TITLE_LAYERS: layers, ENDING_TRAILER_ASSETS: assets, ENDING_TRAILER_BEATS: beats, ENDING_FROG_JUMP_CUE: jumpCue } = load('endingTrailer');
const { FROG_REVEAL_FRAME_DURATION_MS: frameDurations, FROG_REVEAL_FRAME_SOURCES: frames, FROG_REVEAL_BACKGROUND_SRC: box } = load('frogRevealSequence');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('the empty box precedes all nine original frog drawings and their gameplay timing', () => {
  assert.equal(sample(0).phase, 'box');
  assert.equal(sample(0).frogFrame, -1);
  assert.equal(sample(0).boxVisible, true);
  assert.equal(sample(0).titleVisible, false);
  assert.equal(frames.length, 9);
  assert.equal(frameDurations.reduce((a, b) => a + b), 3300);
  let start = beats.frogStart;
  for (const [index, duration] of frameDurations.entries()) {
    assert.equal(sample(start + .001).frogFrame, index);
    assert.equal(sample(start + duration / 1000 - .001).frogFrame, index);
    if (index === 6) near(start, jumpCue);
    start += duration / 1000;
  }
  assert.equal(sample(beats.greenStart + .001).frogFrame, 8);
});

test('the green hold fully covers the box-to-ending handoff and clears before the title settles', () => {
  assert.equal(sample(3).greenOpacity, 0);
  assert.ok(sample(3.4).greenOpacity > 0 && sample(3.4).greenOpacity < 1);
  for (const offset of [-.001, 0, .001]) {
    const state = sample(beats.titleScene + offset);
    assert.equal(state.greenOpacity, 1, 'the underlying scene switches only under solid green');
    assert.notEqual(state.boxVisible, state.titleVisible);
  }
  assert.equal(sample(3.7).greenOpacity, 1);
  assert.ok(sample(4).greenOpacity > 0 && sample(4).greenOpacity < 1);
  assert.equal(sample(beats.greenGone).greenOpacity, 0);
  assert.equal(sample(beats.titleReady).phase, 'float');
});

test('the title enters after the main cast and settles in its Figma position', () => {
  const logo = layers.find(layer => layer.id === 'logo');
  for (const id of ['street', 'mai', 'frog', 'beigo']) {
    assert.ok(layers.find(layer => layer.id === id).entry.at < logo.entry.at);
  }
  const preLogo = sample(logo.entry.at - .001);
  assert.equal(preLogo.layers.find(layer => layer.id === 'logo').opacity, 0);
  assert.equal(preLogo.layers.find(layer => layer.id === 'mai').opacity, 1);
  const settled = sample(beats.titleReady);
  for (const layer of settled.layers) {
    assert.equal(layer.opacity, 1);
    assert.equal(layer.scale, 1);
  }
  assert.deepEqual(settled.layers.find(layer => layer.id === 'logo'), { id: 'logo', x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
});

test('selected characters gently float while the street, paper frame, and readable title remain fixed', () => {
  const seen = new Map(layers.map(layer => [layer.id, new Set()]));
  for (let frame = 0; frame <= 450; frame++) {
    const state = sample(beats.titleReady + frame / 120);
    for (const pose of state.layers) {
      const layer = layers.find(layer => layer.id === pose.id);
      if (!layer.float) assert.deepEqual([pose.x, pose.y, pose.rotation], [0, 0, 0]);
      else {
        assert.ok(Math.abs(pose.x) <= layer.float.x + 1e-8);
        assert.ok(Math.abs(pose.y) <= layer.float.y + 1e-8);
        assert.ok(Math.abs(pose.rotation) <= layer.float.rotation + 1e-8);
        seen.get(layer.id).add(pose.y.toFixed(3));
      }
    }
  }
  for (const layer of layers.filter(layer => layer.float)) assert.ok(seen.get(layer.id).size > 100, layer.id);
});

test('pause, reverse seeking, and duration changes reproduce the same pose and stop at the final frame', () => {
  const rounded = value => JSON.stringify(value, (_, v) => typeof v === 'number' ? Number(v.toFixed(8)) : v);
  for (const duration of [6, 9, 15]) {
    for (const time of [0, .5, 1.9, 2.8, 3.35, 3.7, 4.15, 4.8, 5.3, 6.8, 8, 9]) {
      const state = sample(time * duration / 9, duration);
      assert.equal(rounded(state), rounded(sample(time)));
      sample(duration, duration);
      assert.deepEqual(sample(time * duration / 9, duration), state);
    }
  }
  assert.deepEqual(sample(-1), sample(0));
  assert.deepEqual(sample(NaN), sample(0));
  assert.deepEqual(sample(1, 0), sample(1));
  assert.deepEqual(sample(100), sample(9));
});

test('all final-card layers exist and every frog frame remains aligned with the original phone canvas', async () => {
  assert.equal(new Set(layers.map(layer => layer.id)).size, layers.length);
  for (const asset of assets) assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
  for (const asset of [box, ...frames]) {
    const metadata = await sharp(path.join(__dirname, '../public', asset)).metadata();
    assert.deepEqual([metadata.width, metadata.height], [786, 1704]);
  }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/game', `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, id => load(id.replace('./', '')));
  return loaded.exports;
}
const { sampleBaiDiaryTrailer: sample, BAI_DIARY_BEATS: beats, BAI_DIARY_LINES: lines, BAI_DIARY_TRAILER_ART: art, BAI_DIARY_PICKUP_FRAMES: pickupFrames } = load('baiDiaryTrailer');

test('both Bai lines type in all languages, finish before the cut and rewind with the clock', () => {
  for (const locale of ['zh', 'en', 'ja']) {
    for (const [start, end] of [[beats.discover, beats.call], [beats.call, beats.clear]]) {
      const first = sample(start, 5.5, locale);
      assert.equal(first.dialogueVisibleCharacters, 0);
      assert.equal(first.dialogueComplete, false);
      const during = sample(start + .16, 5.5, locale);
      assert.ok(during.dialogueVisibleCharacters > 0 && during.dialogueVisibleCharacters < Array.from(during.dialogue).length);
      const completed = sample(start + (end - start) * .7, 5.5, locale);
      assert.equal(completed.dialogueComplete, true);
      sample(5.5, 5.5, locale);
      assert.deepEqual(sample(start + .16, 5.5, locale), during);
      for (const duration of [3.5, 10]) {
        assert.equal(sample((start + .16) * duration / 5.5, duration, locale).dialogueVisibleCharacters, during.dialogueVisibleCharacters);
      }
    }
    assert.equal(sample(beats.pickup, 5.5, locale).dialogue, null);
  }
});

test('Mai discovers Bai then calls out using the existing story dialogue', () => {
  assert.equal(sample(0).lineIndex, null);
  assert.equal(sample(.8).lineIndex, 0);
  assert.equal(sample(2).lineIndex, 1);
  assert.equal(sample(2).uiOpacity, 1);
  assert.equal(lines[0], '嗚哇——！小、小白……！？');
  assert.equal(lines[1], '小白……？妳聽得見我嗎？');
  assert.ok(sample(1.8).bai.y < sample(.2).bai.y, 'Bai rises while Mai calls');
  assert.equal(sample(2).diary.visible, false);
});

test('dialogue and portrait clear before the diary comic lifts into view', () => {
  const clearing = sample(beats.clear + .05);
  assert.ok(clearing.uiOpacity > 0 && clearing.uiOpacity < 1);
  assert.equal(clearing.diary.visible, false);
  const pickup = sample(beats.pickup);
  assert.equal(pickup.lineIndex, null);
  assert.equal(pickup.uiOpacity, 0);
  assert.equal(pickup.diary.visible, true);
  assert.equal(pickup.diary.opacity, 0);
  assert.equal(pickup.diary.y, 60);
  assert.equal(sample(beats.pickup + .3).diary.y, 0);
  assert.equal(sample(beats.pickup + .3).diary.opacity, 1);
});

test('pickup follows the exhibition 1→2→1→2→3→4→5 drawings while the room light builds and recedes', () => {
  assert.deepEqual(pickupFrames.map(entry => sample(beats.pickup + entry.at + .01).diary.frame), [0, 1, 0, 1, 2, 3, 4]);
  const lights = [.2, .45, .59, .9, 1.2, 1.45].map(time => sample(beats.pickup + time).light.to);
  assert.deepEqual(lights, [0, 1, 2, 3, 2, 1]);
  const dissolve = sample(beats.pickup + .42).light;
  assert.equal(dissolve.from, 0);
  assert.equal(dissolve.to, 1);
  assert.ok(dissolve.mix > 0 && dissolve.mix < 1);
});

test('final hold matches the Figma glowing diary and second Bai lighting frame', () => {
  const ending = sample(5.5);
  assert.equal(ending.phase, 'hold');
  assert.equal(ending.lineIndex, null);
  assert.equal(ending.diary.frame, 4);
  assert.equal(ending.light.to, 1);
  assert.equal(ending.light.mix, 1);
  assert.equal(ending.light.opacity, 1);
  assert.equal(ending.diary.scale, 1);
  assert.deepEqual(sample(5), ending);
  assert.deepEqual(sample(20), ending);
});

test('duration changes, replay, and reverse scrubbing keep image and lighting poses synchronized', () => {
  const rounded = value => JSON.stringify(value, (_, v) => typeof v === 'number' ? Number(v.toFixed(8)) : v);
  for (const duration of [3.5, 5.5, 10]) {
    for (const time of [.4, .8, 1.6, 2.4, 3.1, 3.4, 3.7, 4.05, 4.4, 5.5]) {
      const result = sample(time * duration / 5.5, duration);
      assert.equal(rounded(result), rounded(sample(time)));
      sample(duration, duration);
      sample(0, duration);
      assert.deepEqual(sample(time * duration / 5.5, duration), result);
    }
  }
});

test('the complete scene uses existing local artwork and preloads all light and diary frames', () => {
  const assets = Object.values(art).flat();
  assert.equal(assets.length, 15);
  for (const asset of assets) assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
});

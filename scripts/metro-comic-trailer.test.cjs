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
const { sampleMetroComicTrailer: sample, METRO_COMIC_BEATS: beats, METRO_COMIC_TRAILER_ART: art, getMetroComicSoundCues: cues } = load('metroComicTrailer');

test('every translated metro line finishes typing while preserving the same shot and choice timing', () => {
  const shots = [[beats.crowded, beats.backpack], [beats.backpack, beats.pain], [beats.pain, beats.cramped], [beats.cramped, beats.choice], [beats.beigoReveal, 5.5]];
  for (const locale of ['zh', 'en', 'ja']) {
    for (const [start, end] of shots) {
      assert.equal(sample(start, 5.5, locale).dialogueVisibleCharacters, 0);
      const during = sample(start + .1, 5.5, locale);
      assert.ok(during.dialogueVisibleCharacters > 0 && !during.dialogueComplete);
      assert.equal(sample(start + (end - start) * .7, 5.5, locale).dialogueComplete, true);
      assert.deepEqual(during.comic, sample(start + .1).comic);
      sample(end, 5.5, locale);
      assert.deepEqual(sample(start + .1, 5.5, locale), during);
    }
    assert.equal(sample(beats.bagEnter, 5.5, locale).dialogue, null);
  }
});

test('left camera pans down while the right background stays positioned from the first frame', () => {
  assert.equal(Math.abs(sample(0).backgroundY), 0);
  let previous = 0;
  for (let ms = 0; ms <= 5500; ms += 10) {
    const frame = sample(ms / 1000);
    assert.ok(frame.backgroundY <= previous, 'left camera must not reverse');
    assert.ok(frame.backgroundY <= 0 && frame.backgroundY + 2288 >= 1080, 'left artwork must cover its half');
    assert.equal(frame.rightBackgroundY, -725);
    assert.ok(frame.rightBackgroundY + 1853 >= 1080, 'right artwork must cover its half');
    previous = frame.backgroundY;
  }
  assert.equal(previous, -806);
  assert.equal(sample(beats.crowded + .2).phase, 'crowded');
  assert.ok(sample(beats.crowded + .2).backgroundY > -806, 'first comic enters during pan');
});

test('single comics replace each other and Mai reacts to each event in storyboard order', () => {
  const expected = [
    [.2, 'opening', null, null],
    [1, 'crowded', 0, 0],
    [1.8, 'backpack', 1, null],
    [2.2, 'pain', 1, 1],
    [3, 'cramped', 2, 2],
    [3.8, 'choice', 2, 2],
    [4.5, 'bag', 3, null],
    [4.8, 'bag-open', 4, null],
    [5.2, 'beigo', 5, 3],
  ];
  for (const [time, phase, comic, portrait] of expected) {
    const frame = sample(time);
    assert.equal(frame.phase, phase);
    assert.equal(frame.comic.index, comic);
    assert.equal(frame.mai.index, portrait);
    assert.equal(frame.comic.opacity, comic === null ? 0 : 1);
    assert.equal(frame.mai.opacity, portrait === null ? 0 : 1);
  }
  assert.equal(sample(1.8).dialogue, '迎面而來的大包包');
  assert.equal(sample(2.2).dialogue, '哎呀！好痛，沒閃過');
  assert.deepEqual(sample(1.8).comic, sample(2.2).comic, 'pain reaction must not restart the backpack comic');
});

test('choice border and finger travel from first to second, holding there without a click', () => {
  const before = sample(3.3);
  const choice = sample(3.8);
  assert.equal(before.choices, false);
  assert.equal(choice.choices, true);
  assert.equal(choice.choiceOpacity, 1);
  assert.equal(choice.dialogue, null);
  assert.deepEqual(choice.comic, before.comic);
  assert.equal(choice.mai.index, before.mai.index);
  assert.equal(choice.mai.bottom, 429);
  const first = sample(beats.choiceMoveStart);
  const moving = sample((beats.choiceMoveStart + beats.choiceMoveEnd) / 2);
  const second = sample(beats.choiceMoveEnd);
  assert.equal(first.consideredChoice, 0);
  assert.equal(first.choiceFocusY, 0);
  assert.ok(moving.choiceFocusY > 0 && moving.choiceFocusY < 151);
  assert.equal(second.consideredChoice, 1);
  assert.equal(second.choiceFocusY, 151);
  let previous = 0;
  for (let time = beats.choice; time < beats.bagEnter; time += .01) {
    const frame = sample(time);
    assert.equal(frame.choices, true);
    assert.ok(frame.choiceFocusY >= previous, 'border and pointer cannot reverse');
    previous = frame.choiceFocusY;
  }
  assert.equal(sample(beats.bagEnter).choices, false);
});

test('Beigo uses all three original bag comics in order and reveals Mai surprise only on the third', () => {
  const bag = sample(4.51);
  const open = sample(4.8);
  const reveal = sample(5.4);
  assert.deepEqual([bag.comic.index, open.comic.index, reveal.comic.index], [3, 4, 5]);
  assert.deepEqual([bag.comic.opacity, open.comic.opacity, reveal.comic.opacity], [1, 1, 1]);
  assert.deepEqual([bag.mai.index, open.mai.index, reveal.mai.index], [null, null, 3]);
  for (let time = beats.bagEnter; time < beats.beigoReveal; time += .01) {
    const frame = sample(time);
    assert.equal(frame.choices, false, 'clear options and finger before the bag sequence');
    assert.equal(frame.mai.index, null, 'keep Mai hidden until Beigo peeks out');
    assert.equal(frame.dialogue, null);
    assert.equal(frame.rightBackgroundY, -725, 'reset overlays while preserving the fixed background');
  }
  for (const frame of [bag, open, reveal]) {
    assert.equal(frame.comic.x, 516);
    assert.equal(frame.comic.y, 516);
    assert.equal(frame.comic.width, 728);
  }
  assert.equal(open.comic.offsetY, 0, 'later drawings must not slide into the frame again');
  assert.notEqual(sample(beats.bagEnter + .1).comic.rotation, 0);
  assert.equal(open.comic.rotation, 0);
  assert.equal(bag.dialogue, null);
  assert.equal(open.dialogue, null);
  assert.equal(reveal.dialogue, '哇！在包包裡面');
});

test('Mai motions freeze with the clock and settle for the final recording hold', () => {
  assert.notEqual(sample(beats.pain + .08).mai.x, 0);
  assert.notEqual(sample(beats.cramped + .1).mai.rotation, 0);
  assert.ok(sample(beats.beigoReveal + .1).mai.y < 0);
  const ending = sample(5.5);
  assert.equal(ending.comic.opacity, 1);
  assert.equal(ending.comic.scale, 1);
  assert.equal(Math.abs(ending.mai.y), 0);
  assert.equal(ending.mai.scale, 1);
  assert.deepEqual(sample(20), ending);
  assert.deepEqual(sample(5.4), ending);
});

test('duration changes preserve storyboard poses, reverse scrubbing, and comic sound cues', () => {
  const rounded = value => JSON.stringify(value, (_, v) => typeof v === 'number' ? Number(v.toFixed(8)) : v);
  for (const duration of [3.5, 5.5, 10]) {
    for (const time of [.4, .75, 1.7, 2.1, 2.9, 3.6, 3.9, 4.4, 4.8, 5.1, 5.5]) {
      const expected = sample(time);
      const actual = sample(time * duration / 5.5, duration);
      assert.equal(rounded(actual), rounded(expected));
      sample(duration, duration);
      sample(0, duration);
      assert.deepEqual(sample(time * duration / 5.5, duration), actual);
    }
    const soundTimes = cues(duration);
    assert.equal(soundTimes.length, 6);
    assert.ok(soundTimes.every((cue, i) => cue > (soundTimes[i - 1] ?? 0) && cue < duration));
    soundTimes.forEach((cue, index) => assert.equal(sample(cue + .02, duration).comic.index, index));
  }
});

test('all scene, portrait, and arrow assets are local and available to preload', () => {
  const assets = Object.values(art).flat();
  assert.equal(assets.length, 14);
  for (const asset of assets) assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
});

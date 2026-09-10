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
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, id => load(id.replace('./', '')));
  cache.set(name, loaded.exports);
  return loaded.exports;
}
const { sampleFlyerTrailer: sample, FLYER_TRAILER_ATTEMPTS: attempts, FLYER_TRAILER_ART: art, FLYER_TRANSITION_PAPERS: papers } = load('flyerTrailer');
const { FLYER_FEEDBACK_DURATION_MS: feedbackMs, getFlyerPosition } = load('flyerWindMotion');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('the two misses are outside the real catch window; the third tap lands on its center', () => {
  assert.equal(attempts.length, 3);
  for (const [index, attempt] of attempts.entries()) {
    const progressAtTap = (attempt.tap - attempt.start) * 1000 / attempt.step.durationMs;
    const error = Math.abs(progressAtTap - attempt.step.targetProgress);
    if (index < 2) assert.ok(error > attempt.step.hitWindow);
    else near(error, 0);
    assert.equal(sample(attempt.tap - .001).scene.result, null);
    const tapped = sample(attempt.tap).scene;
    assert.equal(tapped.result, index < 2 ? 'missed' : 'bonus');
    assert.equal(tapped.inFeedback, true);
    near(tapped.hand.opacity, 1);
    const target = getFlyerPosition(attempt.step.track, attempt.step.targetProgress);
    near(tapped.hand.xPct, target.xPct + 8);
    near(tapped.hand.yPct, target.yPct + 3);
    if (index > 0) assert.ok(attempt.start > attempts[index - 1].tap + feedbackMs / 1000, 'feedback finishes before the next flyer');
  }
});

test('hearts only decrease once per miss, and a miss exits while the catch stops on target', () => {
  assert.equal(sample(0).scene.hearts, 3);
  for (const [index, attempt] of attempts.entries()) {
    assert.equal(sample(attempt.tap - .001).scene.hearts, 3 - index);
    for (const age of [0, .1, .3, .5, .9]) {
      const scene = sample(attempt.tap + age).scene;
      assert.equal(scene.hearts, index === 0 ? 2 : 1);
      if (index < 2 && age < .34) assert.ok(scene.progress < 1);
      if (index < 2 && age >= .5) assert.equal(scene.documentVisible, false);
      if (index === 2) near(scene.progress, attempt.step.targetProgress);
    }
    assert.ok(sample(attempt.tap + .02).scene.documentVisible);
  }
});

test('small windblown papers cross left to right without covering the scene and clear before the first judgment', () => {
  const initial = sample(0);
  assert.equal(initial.phase, 'diary');
  assert.equal(initial.diaryOpacity, 1);
  assert.equal(initial.gameOpacity, 0);
  assert.equal(initial.scene.showLane, false);
  assert.ok(initial.papers.every(paper => !paper.visible));
  let previous = initial.papers;
  for (let frame = 0; frame <= 264; frame++) {
    const time = frame / 120;
    const state = sample(time);
    near(state.diaryOpacity + state.gameOpacity, 1);
    if (state.gameOpacity > 0 && state.gameOpacity < 1) {
      assert.ok(state.papers.some(paper => paper.visible && paper.x > 0 && paper.x < 1920));
    }
    let paperArea = 0;
    for (const paper of state.papers) {
      assert.ok([paper.x, paper.y, paper.width, paper.rotation, paper.scaleX, paper.opacity].every(Number.isFinite));
      assert.ok(paper.width > 0 && paper.width < 150 && paper.opacity >= 0 && paper.opacity <= 1);
      assert.ok(paper.x >= previous[paper.id].x, 'the wind always carries each flyer toward the right');
      if (paper.visible) paperArea += paper.width ** 2 * papers[paper.art].height / papers[paper.art].width;
    }
    assert.ok(paperArea < 1920 * 1080 * .25, 'the moving paper group leaves most of the scene visible');
    previous = state.papers;
  }
  assert.equal(sample(2.2).gameOpacity, 1);
  assert.ok(sample(2.2).papers.every(paper => !paper.visible && paper.x > 1920));
});

test('the final hold keeps the successful comic and one heart without starting another round', () => {
  const final = sample(9);
  assert.equal(final.phase, 'hold');
  assert.equal(final.scene.attempt, 3);
  assert.equal(final.scene.result, 'bonus');
  assert.equal(final.scene.inFeedback, true);
  assert.equal(final.scene.mood, 'happy');
  assert.equal(final.scene.hearts, 1);
  assert.equal(final.scene.documentVisible, false);
  assert.equal(final.scene.hand.opacity, 0);
  assert.deepEqual(sample(7.5), final);
  assert.deepEqual(sample(100), final);
});

test('duration changes and backward seeking preserve every timeline pose', () => {
  const rounded = value => JSON.stringify(value, (_, v) => typeof v === 'number' ? Number(v.toFixed(8)) : v);
  for (const duration of [6, 9, 15]) {
    for (const time of [0, .65, 1.1, 1.6, 2.3, 2.55, 3.15, 4.21, 4.5, 5.1, 6.2, 6.5, 7, 9]) {
      const state = sample(time * duration / 9, duration);
      assert.equal(rounded(state), rounded(sample(time)));
      sample(duration, duration);
      assert.deepEqual(sample(time * duration / 9, duration), state);
    }
  }
  assert.deepEqual(sample(-1), sample(0));
  assert.deepEqual(sample(NaN), sample(0));
  assert.deepEqual(sample(1, 0), sample(1));
});

test('all transition papers and scene art are the existing local game assets', () => {
  for (const src of [...Object.values(art), ...papers.map(paper => paper.src)]) {
    assert.ok(fs.existsSync(path.join(__dirname, '../public', src)), src);
  }
  for (const paper of papers) {
    assert.ok(paper.left >= 0 && paper.left + paper.width <= 786);
    assert.ok(paper.top >= 0 && paper.top + paper.height <= 1704);
  }
});

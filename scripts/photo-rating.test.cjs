const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const modules = new Map();
function loadModule(name) {
  if (modules.has(name)) return modules.get(name);
  const source = fs.readFileSync(path.join(__dirname, '../src', name.replace('@/', '') + '.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, loadModule);
  modules.set(name, loaded.exports);
  return loaded.exports;
}
const { getPhotoStarCount: rate, GOLDEN_RETRIEVER_PHOTO_STARS: dog, GOLDEN_RETRIEVER_PHOTO_BODY: body,
  GOLDEN_RETRIEVER_PHOTO_EYES: eyes, PHOTO_RESULT_TIMING: timing, samplePhotoResultReveal: sample } = loadModule('@/lib/game/photoRating');
const legs = { x: .18, y: .57, width: .64, height: .295 };
const face = { x: .18, y: .44, width: .64, height: .295 };

test('golden retriever uses strict 50 and 60 boundaries and requires both eyes for two stars', () => {
  for (const score of [0, 25, 50]) assert.equal(rate(score, legs, dog), 0);
  for (const score of [51, 55, 60, 61, 100]) assert.equal(rate(score, legs, dog), 1);
  assert.equal(rate(60, face, dog), 1);
  assert.equal(rate(61, face, dog), 2);
  assert.equal(rate(100, face, dog), 2, 'high accuracy alone must not earn full-body stars');
  const oneEye = { ...face, x: eyes.x + eyes.width / 2 };
  assert.equal(rate(90, oneEye, dog), 1);
});

test('full body includes ears, feet and tail, independently of the legacy accuracy rectangle', () => {
  assert.equal(rate(90, body, dog), 3);
  assert.equal(rate(90, { x: .18, y: .475, width: .64, height: .295 }, dog), 3);
  assert.equal(rate(90, { ...body, height: body.height - .003 }, dog), 2, 'cropped feet');
  assert.equal(rate(90, { ...body, width: body.width - .003 }, dog), 2, 'cropped tail');
  assert.equal(rate(90, { ...body, y: body.y + .003 }, dog), 2, 'cropped ears');
  assert.equal(rate(90, { ...body, width: 0 }, dog), 1);
});

test('level criteria are independent and can use their own score and framing requirements', () => {
  const anotherLevel = [{ scoreAbove: 40 }, { scoreAbove: 75 }, { scoreAbove: 95 }];
  assert.equal(rate(55, legs, anotherLevel), 1);
  assert.equal(rate(80, legs, anotherLevel), 2);
  assert.equal(rate(96, legs, anotherLevel), 3);
  assert.equal(rate(96, legs, dog), 1);
});

test('accuracy counts from zero after developing, reaches the real score, then switches to stars', () => {
  const endCount = timing.developMs + timing.countMs;
  const endHold = endCount + timing.scoreHoldMs;
  for (const score of [0, 25, 50, 55, 61, 90, 100]) {
    assert.equal(sample(0, score, 2).displayedScore, 0);
    assert.equal(sample(timing.developMs, score, 2).displayedScore, 0);
    assert.equal(sample(timing.developMs + timing.countMs / 2, score, 2).displayedScore, Math.floor(score / 2));
    assert.equal(sample(endCount, score, 2).displayedScore, score);
    assert.equal(sample(endHold - 1, score, 2).showStars, false);
    assert.equal(sample(endHold, score, 2).showStars, true);
  }
});

test('one, two and three star reveals light sequentially and wait for the last star to settle', () => {
  const start = timing.developMs + timing.countMs + timing.scoreHoldMs + timing.firstStarMs;
  for (const stars of [1, 2, 3]) {
    assert.equal(sample(start - 1, 90, stars).litStars, 0);
    for (let index = 0; index < stars; index++) {
      const time = start + index * timing.starIntervalMs;
      assert.equal(sample(time, 90, stars).litStars, index + 1);
      assert.equal(sample(time, 90, stars).complete, false);
    }
    const complete = start + (stars - 1) * timing.starIntervalMs + timing.starSettleMs;
    assert.equal(sample(complete - 1, 90, stars).complete, false);
    assert.equal(sample(complete, 90, stars).complete, true);
    assert.equal(sample(complete + 10000, 90, stars).litStars, stars);
  }
});

test('failed shots and levels without star rules finish on accuracy, and a retake starts at zero', () => {
  for (const stars of [0, undefined]) {
    assert.deepEqual(sample(10000, 25, stars), { displayedScore: 25, showStars: false, litStars: 0, complete: true });
    assert.deepEqual(sample(0, 25, stars), { displayedScore: 0, showStars: false, litStars: 0, complete: false });
  }
});

test('kept star ratings survive both collection and exhibition storage; legacy photos remain valid', () => {
  const storage = () => {
    const data = new Map();
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  };
  global.window = Object.assign(new EventTarget(), { localStorage: storage(), sessionStorage: storage() });
  const progress = loadModule('@/lib/game/playerProgress');
  const exhibition = loadModule('@/lib/game/exhibitionEnding');
  const capture = {
    sourceImage: 'metro.jpg', previewImage: 'data:image/jpeg;base64,photo',
    dogCoveragePercent: 91, cameraFrameRect: face, capturedRect: face, stars: 2,
  };
  progress.recordPhotoCapture(capture);
  progress.recordSunbeastPhotoCapture('naotaro', capture, { maxCaptures: 1 });
  assert.equal(progress.loadPlayerProgress().lastDogPhotoCapture.stars, 2);
  assert.equal(progress.getLatestSunbeastPhotoCapture(progress.loadPlayerProgress(), 'naotaro').stars, 2);
  exhibition.saveExhibitionPhoto(0, { imagePath: capture.previewImage, score: 91, stars: 2 });
  assert.equal(exhibition.loadExhibitionPhotos()[0].stars, 2);
  const { stars, ...legacy } = capture;
  progress.recordPhotoCapture(legacy);
  assert.equal(progress.loadPlayerProgress().lastDogPhotoCapture.stars, undefined);
  assert.equal(progress.loadPlayerProgress().lastDogPhotoCapture.dogCoveragePercent, 91);
  progress.recordPhotoCapture({ ...capture, stars: 9 });
  assert.equal(progress.loadPlayerProgress().lastDogPhotoCapture.stars, undefined);
  delete global.window;
});

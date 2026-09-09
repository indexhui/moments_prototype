const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const modules = new Map();
function loadModule(name) {
  if (modules.has(name)) return modules.get(name);
  const source = fs.readFileSync(path.join(__dirname, '../src', name.replace('@/', '') + '.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const loaded = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(loaded, loaded.exports, loadModule);
  modules.set(name, loaded.exports);
  return loaded.exports;
}
const { DEFAULT_SUNBEAST_TRAILER_TIMING: defaults, getSunbeastTrailerTimeline: timeline, sampleSunbeastTrailer: sample, SUNBEAST_TRAILER_ART: art, sampleTrailerFrogHop: hop, getSunbeastTrailerPhotoCrop: crop, SUNBEAST_TRAILER_FRAMING: framing, TRAILER_FROG_HOP_SECONDS: cycle } = loadModule('@/lib/game/sunbeastTrailer');
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);

test('the 5.5-second take starts photography early and finishes both three-star results', () => {
  const t = timeline(defaults);
  close(t.dogFocus, 1);
  close(t.dogShot, 1.6);
  close(t.frogShot, 3.7);
  assert.equal(t.duration, 5.5);
  assert.deepEqual(sample(t.frogFocus, defaults, 'dog').stars, [1, 1, 1]);
  for (const side of ['dog', 'frog']) {
    assert.equal(sample(5.2, defaults, side).polaroidProgress, 1);
    assert.deepEqual(sample(5.2, defaults, side).stars, [1, 1, 1]);
  }
});

test('the entire left panel appears before the right, and focus waits until both are revealed', () => {
  assert.equal(sample(0, defaults, 'dog').appearance, 0);
  assert.equal(sample(0, defaults, 'frog').appearance, 0);
  assert.equal(sample(.45, defaults, 'dog').appearance, 1);
  assert.equal(sample(.45, defaults, 'frog').appearance, 0);
  assert.equal(sample(.725, defaults, 'dog').appearance, 1);
  assert.ok(sample(.725, defaults, 'frog').appearance > 0);
  assert.ok(sample(.725, defaults, 'frog').appearance < 1);
  const t = timeline(defaults);
  assert.ok(t.revealComplete <= 1, 'both panels finish their entrance within one second');
  for (const side of ['dog', 'frog']) {
    assert.equal(sample(t.revealComplete, defaults, side).appearance, 1);
    assert.equal(sample(t.revealComplete, defaults, side).viewfinderOpacity, 0);
  }
  assert.ok(Math.abs(t.dogFocus - t.revealComplete - defaults.wait) < 1e-9);
});

test('all timing options keep both panels revealed before focusing, one side at a time', () => {
  for (const wait of [.1, 1.5, 3, 8]) for (const focus of [.5, .6, 1.6, 3]) for (const gap of [.5, 1.5, 2, 6]) {
    const settings = { wait, focus, gap };
    const t = timeline(settings);
    assert.ok(t.dogFocus > t.revealComplete);
    assert.equal(sample(t.dogFocus, settings, 'dog').appearance, 1);
    assert.equal(sample(t.dogFocus, settings, 'frog').appearance, 1);
    assert.equal(sample(t.dogShot, settings, 'frog').viewfinderOpacity, 0);
    assert.equal(sample(t.frogShot, settings, 'dog').viewfinderOpacity, 0);
    assert.ok(t.frogFocus > t.dogShot);
    assert.ok(Math.abs(t.duration - t.frogShot - 1.8) < 1e-9);
  }
});

test('each shutter flashes only its own panel then holds a frozen picture and completed result', () => {
  const t = timeline(defaults);
  assert.ok(sample(t.dogShot + .06, defaults, 'dog').flashOpacity > .9);
  assert.equal(sample(t.dogShot + .06, defaults, 'frog').flashOpacity, 0);
  assert.equal(sample(t.frogShot + .06, defaults, 'dog').flashOpacity, 0);
  assert.ok(sample(t.frogShot + .06, defaults, 'frog').flashOpacity > .9);
  for (const side of ['dog', 'frog']) {
    const ending = sample(t.duration, defaults, side);
    assert.equal(ending.flashOpacity, 0);
    assert.equal(ending.viewfinderOpacity, 0);
    assert.equal(ending.captured, true);
    assert.equal(ending.polaroidProgress, 1);
    assert.deepEqual(ending.stars, [1, 1, 1]);
    assert.deepEqual(ending, sample(t.duration + 10, defaults, side));
    assert.equal(sample(0, defaults, side).captured, false);
  }
});

test('frog reuses all six poses and travels right to left in repeating jump arcs', () => {
  const shot = 20;
  const start = shot - cycle * 2 - 1.4;
  let previousX = Infinity;
  const poses = new Set();
  for (let ms = 1; ms < cycle * 1000; ms += 10) {
    const time = start + ms / 1000;
    const pose = hop(time, shot);
    assert.ok(pose.x <= previousX + 1e-9, 'horizontal travel must never reverse inside a cycle');
    previousX = pose.x;
    poses.add(pose.frameIndex);
    const nextCycle = hop(time + cycle, shot);
    close(nextCycle.x, pose.x);
    close(nextCycle.y, pose.y);
    assert.equal(nextCycle.frameIndex, pose.frameIndex);
  }
  assert.deepEqual([...poses], [0, 1, 2, 3, 4, 5]);
  assert.ok(hop(start + .01, shot).x > .7);
  assert.ok(hop(start + cycle - .01, shot).x < -1);
  assert.ok(hop(start + .46, shot).y < 0, 'first jump rises above counter');
  close(hop(start + 1.4, shot).y, 0);
  assert.ok(hop(start + 2.435, shot).y < 0, 'departure also jumps');
});

test('custom timing always photographs the frog on the counter and freezes all photo layers', () => {
  for (const wait of [.1, 1.5, 3, 8]) for (const focus of [.5, .6, 1.6, 3]) for (const gap of [.5, 1.5, 2, 6]) {
    const settings = { wait, focus, gap };
    const shot = timeline(settings).frogShot;
    const captured = sample(shot, settings, 'frog');
    close(captured.frogPose.x, 0);
    close(captured.frogPose.y, 0);
    for (const later of [.6, 3, 10]) {
      const held = sample(shot + later, settings, 'frog');
      assert.deepEqual(held.frogPose, captured.frogPose);
      assert.deepEqual(held.ticket, captured.ticket);
      assert.equal(held.frame, captured.frame);
    }
  }
});

test('each photo develops after its own shutter and earns three stars from left to right', () => {
  const t = timeline(defaults);
  for (const side of ['dog', 'frog']) {
    const shot = side === 'dog' ? t.dogShot : t.frogShot;
    assert.equal(sample(shot - .01, defaults, side).polaroidProgress, 0);
    assert.equal(sample(shot + .1, defaults, side).polaroidProgress, 0);
    const developing = sample(shot + .6, defaults, side);
    assert.ok(developing.polaroidProgress > 0 && developing.polaroidProgress < 1);
    assert.deepEqual(developing.stars, [0, 0, 0]);
    const first = sample(shot + .9, defaults, side).stars;
    assert.ok(first[0] > 0);
    assert.equal(first[1], 0);
    assert.equal(first[2], 0);
    const second = sample(shot + 1.1, defaults, side).stars;
    assert.equal(second[0], 1);
    assert.ok(second[1] > 0 && second[1] < 1);
    assert.equal(second[2], 0);
    assert.deepEqual(sample(shot + 1.5, defaults, side).stars, [1, 1, 1]);
    assert.deepEqual(sample(0, defaults, side).stars, [0, 0, 0]);
  }
  assert.equal(sample(t.dogShot + 1.5, defaults, 'frog').polaroidProgress, 0);
  assert.equal(sample(t.frogShot + 1.5, defaults, 'dog').polaroidProgress, 1);
});

test('polaroid crop is square and exactly matches the settled viewfinder', () => {
  const aspect = 786 / 1704;
  const visibleHeight = 9 / 8 * aspect;
  for (const side of ['dog', 'frog']) {
    const box = crop(side);
    const frame = framing[side];
    close(box.width * 786, box.height * 1704);
    close(box.x + box.width / 2, frame.x);
    close((box.y + box.height / 2 - (1 - visibleHeight) * frame.artAnchor) / visibleHeight, frame.y);
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1 && box.y + box.height <= 1);
  }
});

test('scrubbing and replaying a time produce the same picture independently of sampling order', () => {
  const captureTime = timeline(defaults).dogShot + .05;
  for (const side of ['dog', 'frog']) {
    const before = sample(captureTime, defaults, side);
    sample(20, defaults, side);
    sample(0, defaults, side);
    assert.deepEqual(sample(captureTime, defaults, side), before);
  }
});

test('all layered art exists in the repository', () => {
  for (const asset of Object.values(art).flat()) {
    assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
  }
});

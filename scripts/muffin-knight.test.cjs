const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const output = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/lib/game/muffinKnight.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', output)(moduleUnderTest, moduleUnderTest.exports);
const { createKnightState, stepKnight, BEASTS, STAGES, SPRINGS, PORTALS, platformsAt, enemyScale } = moduleUnderTest.exports;
const idle = { left: false, right: false, jump: false, attack: false };
const start = (stage = 0) => { const s = createKnightState(stage); s.phase = 'playing'; s.spawnIn = 1e6; return s; };
const step = (s, input = idle, frames = 1) => { for (let i = 0; i < frames; i++) stepKnight(s, { ...idle, ...input }, 1 / 120, () => .5); };
const enemy = (x, y, extras = {}) => ({ id: 1, x, y, vx: 0, vy: 0, hp: 1, angry: false, ...extras });

test('movement, jumping, one-way landing and key hold cannot create infinite jumps', () => {
  const s = start(); step(s, { right: true }, 30); assert.ok(s.player.x > 210);
  const startY = s.player.y; step(s, { jump: true }, 30); assert.ok(s.player.y < startY - 90);
  step(s, { jump: true }, 180); assert.equal(s.player.grounded, true); assert.equal(s.player.y, 438);
});
test('every platform is reachable with the least mobile beast, including across gaps', () => {
  // Solve the real physics from launch points on every reachable platform, without teleporting mid-jump.
  for (let stage = 0; stage < STAGES.length; stage++) {
    const platforms = STAGES[stage].platforms; const reached = new Set([0]);
    for (let pass = 0; pass < platforms.length; pass++) {
      for (const from of [...reached]) for (let to = 0; to < platforms.length; to++) {
        if (reached.has(to)) continue;
        const a = platforms[from], b = platforms[to];
        for (const x of [a.x + 20, a.x + a.w / 2, a.x + a.w - 20]) for (const targetX of [b.x + 4, b.x + b.w / 2, b.x + b.w - 4]) {
          const s = start(stage); s.beast = 4; s.player.x = x; s.player.y = a.y;
          s.muffin = { x: -100, y: -100, platform: 0 };
          for (let n = 0; n < 180; n++) {
            const movingTarget = platformsAt(stage, s.time)[to]; const aim = movingTarget.x + targetX - b.x;
            step(s, { jump: n < 55, left: s.player.x > aim + 1, right: s.player.x < aim - 1 });
            const landing = platformsAt(stage, s.time)[to];
            if (s.player.grounded && Math.abs(s.player.y - landing.y) < .01 && s.player.x >= landing.x && s.player.x <= landing.x + landing.w) { reached.add(to); break; }
          }
        }
      }
    }
    assert.equal(reached.size, platforms.length, `stage ${stage} has unreachable platforms`);
  }
});
test('only chicken gets a second jump and holding jump does not retrigger it', () => {
  for (const beast of [0, 2]) { const s = start(); s.beast = beast; step(s, { jump: true }, 18); step(s, {}, 25); const vy = s.player.vy; step(s, { jump: true }); assert.equal(s.player.vy < vy - 100, beast === 2); if (beast === 2) { step(s, {}, 15); const secondVy = s.player.vy; step(s, { jump: true }); assert.ok(s.player.vy >= secondVy); } }
});
test('burgers transform exactly once, move to another platform, and 15 wins with hearts bonus', () => {
  const s = start();
  for (let count = 1; count <= 15; count++) { while (s.hitStop > 0) step(s); s.player.x = s.muffin.x; s.player.y = s.muffin.y + 27; s.player.vy = 0; const lastPlatform = s.muffin.platform; step(s); assert.equal(s.muffins, count); assert.equal(s.beast, count % BEASTS.length); assert.notEqual(s.muffin.platform, lastPlatform); }
  assert.equal(s.phase, 'won'); assert.equal(s.score, 2100); const time = s.time; step(s, { attack: true, jump: true }, 100); assert.equal(s.score, 2100); assert.equal(s.time, time);
});
test('all seven abilities have distinct projectiles or dash and respect cooldowns', () => {
  for (let b = 0; b < BEASTS.length; b++) { const s = start(); s.beast = b; step(s, { attack: true }); assert.equal(s.shots.length, [1, 1, 3, 0, 8, 1, 1][b]); if (b === 3) assert.ok(s.player.dash > 0); const count = s.shots.length; step(s, { attack: true }); assert.equal(s.shots.length, count); }
});
test('projectiles defeat enemies and award points once; frog splashes nearby enemies', () => {
  const s = start(); s.enemies = [enemy(215, 548)]; step(s, { attack: true }, 10); assert.equal(s.kills, 1); assert.equal(s.score, 25); step(s, { attack: true }, 30); assert.equal(s.score, 25);
  const frog = start(); frog.beast = 1; frog.enemies = [enemy(215, 526), enemy(260, 526)]; step(frog, { attack: true }, 10); assert.equal(frog.kills, 2);
});
test('raccoon dash defeats contact enemies without losing a heart', () => {
  const s = start(); s.beast = 3; s.enemies = [enemy(190, 548)]; step(s, { attack: true }); assert.equal(s.hearts, 3); assert.equal(s.kills, 1);
});
test('contact has invulnerability grace, third hit ends run, retry resets it', () => {
  const s = start(); s.enemies = [enemy(160, 548)]; step(s); assert.equal(s.hearts, 2); step(s); assert.equal(s.hearts, 2);
  for (let i = 0; i < 2; i++) { while (s.hitStop > 0) step(s); s.player.invulnerable = 0; s.player.x = 160; s.player.y = 548; s.player.vy = 0; step(s); }
  assert.equal(s.phase, 'lost'); assert.equal(s.hearts, 0); const fresh = createKnightState(); assert.equal(fresh.hearts, 3); assert.equal(fresh.score, 0);
});
test('falling costs one heart and respawns safely; fallen enemies grow twice then cap their speed and size', () => {
  const s = start(1); s.player.y = 660; step(s); assert.equal(s.hearts, 2); assert.equal(s.player.x, 160); assert.equal(s.player.y, 548);
  while (s.hitStop > 0) step(s); s.enemies = [enemy(470, 640, { vx: 60 })]; step(s); assert.equal(s.enemies[0].angry, true); assert.equal(s.enemies[0].hp, 2); assert.equal(s.enemies[0].vx, 90); s.enemies[0].y = 640; step(s); assert.equal(s.enemies[0].vx, 112.5); assert.equal(s.enemies[0].hp, 3); assert.equal(enemyScale(s.enemies[0]), 1.9); s.enemies[0].y = 640; step(s); assert.equal(s.enemies[0].vx, 112.5); assert.equal(s.enemies[0].hp, 3);
});
test('pause freezes physics, enemies, cooldowns and score', () => { const s = start(); step(s, { attack: true }); s.phase = 'paused'; const before = JSON.stringify(s); step(s, { jump: true, attack: true, right: true }, 120); assert.equal(JSON.stringify(s), before); });

test('holding jump reaches higher than a tap, with coyote time and landing buffer', () => {
  const apex = hold => { const s = start(); let top = s.player.y; for (let i = 0; i < 100; i++) { step(s, { jump: i < hold }); top = Math.min(top, s.player.y); } return top; };
  assert.ok(apex(55) < apex(1) - 40);
  const coyote = start(); coyote.player.grounded = false; coyote.player.y = 520; coyote.player.coyote = .08;
  step(coyote, { jump: true }); assert.ok(coyote.player.vy < -600);
  const buffer = start(); buffer.player.y = 540; buffer.player.vy = 300; buffer.player.grounded = false; buffer.player.coyote = 0;
  step(buffer, { jump: true }); step(buffer, {}, 8); assert.ok(buffer.player.vy < -400, 'jump queued before landing should launch after touchdown');
});
test('hit stop freezes physics while preserving a jump pressed during impact', () => {
  const s = start(); s.hitStop = .045; const x = s.player.x, y = s.player.y;
  step(s, { right: true, jump: true }); assert.equal(s.player.x, x); assert.equal(s.player.y, y); assert.ok(s.fxTime > 0);
  step(s, {}, 8); assert.ok(s.player.vy < -400); assert.equal(s.events.filter(e => e.type === 'jump').length, 1);
});
test('snake pierces exactly three unique enemies, never re-hitting one enemy', () => {
  const s = start(); s.beast = 5;
  s.enemies = [enemy(220, 548, { id: 10 }), enemy(285, 548, { id: 11 }), enemy(350, 548, { id: 12 }), enemy(415, 548, { id: 13 })];
  step(s, { attack: true }); step(s, {}, 90); assert.equal(s.kills, 3); assert.equal(s.enemies[0].id, 13);
  const armored = start(); armored.beast = 5; armored.enemies = [enemy(220, 548, { id: 4, hp: 2, angry: true })];
  step(armored, { attack: true }); step(armored, {}, 30); assert.equal(armored.enemies[0].hp, 1); assert.equal(armored.kills, 0);
});
test('combo raises points, expires, and damage clears it without erasing best', () => {
  const s = start();
  for (let i = 0; i < 4; i++) { s.enemies = [enemy(215, 548, { id: i })]; s.attackCooldown = 0; step(s, { attack: true }); step(s, {}, 15); }
  assert.equal(s.combo, 4); assert.equal(s.bestCombo, 4); assert.equal(s.score, 125);
  step(s, {}, 400); assert.equal(s.combo, 0); assert.equal(s.bestCombo, 4);
  s.enemies = [enemy(215, 548, { id: 5 })]; step(s, { attack: true }); step(s, {}, 15); assert.equal(s.combo, 1);
  s.enemies = [enemy(s.player.x, s.player.y, { id: 6 })]; step(s); assert.equal(s.combo, 0); assert.equal(s.bestCombo, 4); assert.ok(s.player.vx !== 0);
});
test('every beast atlas has valid nonempty frame regions and local audio exists', async () => {
  const path = require('node:path'), sharp = require('sharp');
  const base = path.join(__dirname, '../public/images/muffin-knight/sprites');
  const atlas = JSON.parse(fs.readFileSync(path.join(base, 'atlas.json'), 'utf8'));
  for (const beast of BEASTS) {
    const file = path.join(base, `${beast.id}.png`), meta = await sharp(file).metadata(); assert.equal(meta.hasAlpha, true);
    if (beast.id === 'frog') { assert.equal(meta.width, 1320); assert.equal(meta.height, 740); continue; }
    const frames = atlas[beast.id].frames; assert.equal(frames.length, 8);
    for (const f of frames) { assert.ok(f.w > 30 && f.h > 30 && f.x >= 0 && f.y >= 0 && f.x + f.w <= meta.width && f.y + f.h <= meta.height); }
  }
  for (const name of ['footstep00.ogg', 'cloth1.ogg']) assert.ok(fs.statSync(path.join(__dirname, '../public/sounds/Audio_rpg', name)).size > 1000);
});
test('brief attacks queue across impact and cooldown, without firing twice', () => {
  const s = start(); s.hitStop = .04; s.attackCooldown = .06;
  step(s, { attack: true }); step(s, {}, 20);
  assert.equal(s.events.filter(e => e.type === 'attack').length, 1);
  step(s, {}, 60); assert.equal(s.events.filter(e => e.type === 'attack').length, 1);
});

test('forest spring launches both player and enemies above the upper ledges without holding jump', () => {
  const s = start(); s.player.x = SPRINGS[0].x; step(s);
  assert.ok(s.player.vy < -1000); assert.equal(s.player.grounded, false); assert.equal(s.player.boosted, true);
  let top = s.player.y; for (let i = 0; i < 110; i++) { step(s); top = Math.min(top, s.player.y); }
  assert.ok(top < 218, `spring apex ${top} must clear upper ledge`);
  const enemyRun = start(); enemyRun.enemies = [enemy(SPRINGS[0].x, 548)]; step(enemyRun);
  assert.ok(enemyRun.enemies[0].vy < -1000); assert.equal(enemyRun.events.filter(e => e.type === 'spring').length, 1);
});
test('rooftop portals work both ways and protect against immediate re-entry', () => {
  const s = start(1); s.player.x = PORTALS[0].x; step(s);
  assert.equal(s.player.x, PORTALS[1].x - 49); assert.equal(s.player.y, PORTALS[1].y - 2); assert.ok(s.player.invulnerable > 0);
  s.player.x = PORTALS[1].x; s.player.y = PORTALS[1].y; s.player.vy = 0;
  step(s, {}, 20); assert.equal(s.events.filter(e => e.type === 'portal').length, 1);
  step(s, {}, 95); assert.equal(s.events.filter(e => e.type === 'portal').length, 2); assert.ok(s.player.x < 410); assert.ok(s.player.y > 500);
  const enemyRun = start(1); enemyRun.enemies = [enemy(PORTALS[0].x, 548, { vx: 60 })]; step(enemyRun);
  assert.equal(enemyRun.enemies[0].x, PORTALS[1].x - 49); assert.equal(enemyRun.enemies[0].vx, -60);
});
test('moving platforms carry players, enemies and burgers with stable relative coordinates', () => {
  for (const index of [2, 5]) {
    const s = start(2), initial = platformsAt(2, 0)[index];
    s.player.x = initial.x + 30; s.player.y = initial.y;
    s.enemies = [enemy(initial.x + initial.w - 30, initial.y)];
    s.muffin = { platform: index, x: initial.x + initial.w / 2, y: initial.y - 26 };
    step(s, {}, 120); const current = platformsAt(2, s.time)[index];
    assert.ok(Math.abs(s.player.x - current.x - 30) < .001); assert.ok(Math.abs(s.player.y - current.y) < .001);
    assert.ok(Math.abs(s.enemies[0].x - current.x - initial.w + 30) < .001); assert.ok(Math.abs(s.enemies[0].y - current.y) < .001);
    assert.ok(Math.abs(s.muffin.x - current.x - initial.w / 2) < .001); assert.ok(Math.abs(s.muffin.y - current.y + 26) < .001);
    s.phase = 'paused'; const frozen = JSON.stringify(s); step(s, {}, 100); assert.equal(JSON.stringify(s), frozen);
  }
});
test('jumping off a moving platform detaches the rider', () => {
  const s = start(2); s.player.x = 400; s.player.y = 438; s.muffin = { x: -100, y: -100, platform: 0 };
  step(s, { jump: true }); const x = s.player.x; step(s, { jump: true }, 15);
  assert.equal(s.player.x, x); assert.ok(s.player.y < 400); assert.equal(s.player.grounded, false);
});
test('giant collision size matches its larger silhouette and charges only after a warning', () => {
  for (const level of [0, 2]) {
    const s = start(); s.enemies = [enemy(250, 548, { level, hp: level + 1, angry: level > 0 })];
    s.shots = [{ x: 250, y: 470, vx: 0, vy: 0, life: 1, kind: 0, r: 10, pierce: 1, hit: [] }];
    step(s); assert.equal(s.enemies[0].hp, level === 2 ? 2 : 1);
  }
  const s = start(); s.enemies = [enemy(700, 548, { level: 2, angry: true, hp: 3, vx: 60, rushIn: .001 })];
  step(s); assert.ok(s.enemies[0].windup > .5); assert.equal(s.enemies[0].x, 700);
  step(s, {}, 40); assert.equal(s.enemies[0].x, 700);
  step(s, {}, 30); assert.ok(s.enemies[0].rush > 0); assert.ok(s.enemies[0].vx < 0); assert.ok(s.enemies[0].x < 700);
});
test('armor survives splash and a single dash; giant kill awards 100 base points', () => {
  const frog = start(); frog.beast = 1; frog.enemies = [enemy(215, 526, { id: 1 }), enemy(270, 526, { id: 2, level: 2, angry: true, hp: 3 })];
  step(frog, { attack: true }); step(frog, {}, 12); assert.equal(frog.enemies.find(e => e.id === 2).hp, 2);
  const dash = start(); dash.beast = 3; dash.muffin = { x: -100, y: -100, platform: 0 }; dash.enemies = [enemy(200, 548, { level: 2, angry: true, hp: 3 })];
  step(dash, { attack: true }); step(dash, {}, 20); assert.equal(dash.enemies[0].hp, 2); assert.equal(dash.hearts, 3);
  const kill = start(); kill.enemies = [enemy(250, 548, { level: 2, angry: true, hp: 1 })];
  kill.shots = [{ x: 250, y: 510, vx: 0, vy: 0, life: 1, kind: 0, r: 10, pierce: 1, hit: [] }]; step(kill);
  assert.equal(kill.kills, 1); assert.equal(kill.score, 100);
});

test('first arena keeps slow spawns and one-hit enemies throughout the run', () => {
  assert.equal(createKnightState(0).spawnIn, 6);
  for (const burgers of [0, 7, 14]) {
    const s = start(0); s.muffins = burgers; s.spawnIn = 0; step(s);
    assert.equal(s.enemies.length, 1); assert.equal(Math.abs(s.enemies[0].vx), 42);
    assert.equal(s.spawnIn, 5.5); assert.equal(s.enemies[0].hp, 1);
    for (let i = 0; i < 5; i++) { s.enemies[0].y = 640; step(s); }
    assert.equal(s.enemies[0].level, 0); assert.equal(s.enemies[0].angry, false);
    assert.equal(s.enemies[0].hp, 1); assert.equal(Math.abs(s.enemies[0].vx), 42); assert.equal(enemyScale(s.enemies[0]), 1);
    assert.equal(s.events.filter(e => e.type === 'grow').length, 0);
  }
});
test('first arena caps at three enemies while later arenas retain progression', () => {
  const s = start(); s.enemies = [0, 1, 2].map(i => enemy(600 + i * 50, 100, { id: i })); s.spawnIn = 0;
  step(s); assert.equal(s.enemies.length, 3);
  s.enemies.pop(); step(s); assert.equal(s.enemies.length, 3); assert.equal(s.spawnIn, 5.5);
  for (const stage of [1, 2]) {
    const early = start(stage), late = start(stage); late.muffins = 14; early.spawnIn = late.spawnIn = 0;
    step(early); step(late); assert.ok(late.spawnIn < early.spawnIn); assert.ok(Math.abs(late.enemies[0].vx) > Math.abs(early.enemies[0].vx));
    late.enemies[0].y = 640; step(late); assert.equal(late.enemies[0].level, 1); assert.equal(late.enemies[0].hp, 2);
  }
});

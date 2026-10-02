const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const output = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/lib/game/muffinKnight.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', output)(moduleUnderTest, moduleUnderTest.exports);
const { createKnightState, stepKnight, BEASTS, STAGES, SPRINGS, PORTALS, platformsAt, enemyScale, beginKnight, chooseBlessing, abilityCooldown, arenaWidth, wallsAt, raccoonRank, canRelay, beastWeights, BLESSING_BEASTS, createGuardianPractice, rocksAt, RUINS_LIFTS, RUINS_ZOOM, GUARDIAN_BODY, GUARDIAN_PHASES, guardianBody, beastChances } = moduleUnderTest.exports;
const idle = { left: false, right: false, jump: false, attack: false };
const start = (stage = 0) => { const s = createKnightState(stage, 0); s.phase = 'playing'; if (stage === 3) s.beast = 1; s.spawnIn = 1e6; return s; };
const step = (s, input = idle, frames = 1) => { for (let i = 0; i < frames; i++) stepKnight(s, { ...idle, ...input }, 1 / 120, () => .5); };
const enemy = (x, y, extras = {}) => ({ id: 1, x, y, vx: 0, vy: 0, hp: 1, angry: false, ...extras });

test('movement, jumping, one-way landing and key hold cannot create infinite jumps', () => {
  const s = start(); step(s, { right: true }, 30); assert.ok(s.player.x > 210);
  const startY = s.player.y; step(s, { jump: true }, 30); assert.ok(s.player.y < startY - 90);
  step(s, { jump: true }, 180); assert.equal(s.player.grounded, true); assert.equal(s.player.y, 438);
});
test('every platform is reachable with the least mobile beast, including across gaps', () => {
  // Solve the real physics from launch points on every reachable platform, without teleporting mid-jump.
  for (let stage = 0; stage < STAGES.length; stage++) for (const layout of (stage === 3 ? [0, 1, 2] : [0])) {
    const platforms = platformsAt(stage, 0, layout); const reached = new Set([0]);
    for (let pass = 0; pass < platforms.length; pass++) {
      for (const from of [...reached]) for (let to = 0; to < platforms.length; to++) {
        if (reached.has(to)) continue;
        const a = platforms[from], b = platforms[to];
        launch: for (const wait of (a.lift === undefined ? [0] : [0, 180, 360])) for (const x of [a.x + 20, a.x + a.w / 2, a.x + a.w - 20, Math.max(a.x+20, Math.min(a.x+a.w-20,b.x+b.w/2))]) for (const targetX of [b.x + 4, b.x + b.w / 2, b.x + b.w - 4]) {
          const s = start(stage); s.run.layout = layout; s.beast = 4; s.player.x = x; s.player.y = a.y;
          s.muffin = { x: -100, y: -100, platform: 0 }; s.player.invulnerable=100; s.run.omenIn=1e6; step(s,{},wait);
          for (let n = 0; n < 180; n++) {
            const movingTarget = platformsAt(stage, s.time, layout)[to]; const aim = movingTarget.x + targetX - b.x;
            step(s, { jump: n < 55, left: s.player.x > aim + 1, right: s.player.x < aim - 1 });
            const landing = platformsAt(stage, s.time, layout)[to];
            if (s.player.grounded && Math.abs(s.player.y - landing.y) < .01 && s.player.x >= landing.x && s.player.x <= landing.x + landing.w) { reached.add(to); break launch; }
          }
        }
      }
    }
    assert.equal(reached.size, platforms.length, `stage ${stage}, layout ${layout} has unreachable platforms: ${platforms.map((p,i)=>reached.has(i)?null:i).filter(i=>i!==null)}`);
  }
});
test('only chicken gets a second jump and holding jump does not retrigger it', () => {
  for (const beast of [0, 2]) { const s = start(); s.beast = beast; step(s, { jump: true }, 18); step(s, {}, 25); const vy = s.player.vy; step(s, { jump: true }); assert.equal(s.player.vy < vy - 100, beast === 2); if (beast === 2) { step(s, {}, 15); const secondVy = s.player.vy; step(s, { jump: true }); assert.ok(s.player.vy >= secondVy); } }
});
test('burgers transform exactly once, move to another platform, and 15 wins with hearts bonus', () => {
  const s = start();
  for (let count = 1; count <= 15; count++) { while (s.hitStop > 0) step(s); s.player.x = s.muffin.x; s.player.y = s.muffin.y + 26; s.player.vy = 0; const lastPlatform = s.muffin.platform; step(s); assert.equal(s.muffins, count); assert.equal(s.beast, count % BEASTS.length); assert.notEqual(s.muffin.platform, lastPlatform); }
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
  step(dash, { attack: true }); step(dash, {}, 20); assert.equal(dash.enemies[0].hp, 1); assert.equal(dash.hearts, 3);
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

test('frog swallows only the nearest enemy in front and hold never auto-spits', () => {
  const s = start(); s.beast = 1; s.enemies = [enemy(90, 548, { id: 1 }), enemy(240, 548, { id: 2 }), enemy(310, 548, { id: 3 })];
  step(s, { special: true }); assert.equal(s.stomach, 0); assert.equal(s.kills, 1); assert.equal(s.enemies.some(e => e.id === 2), false);
  step(s, { special: true }, 75); assert.equal(s.stomach, 0); assert.equal(s.events.filter(e => e.type === 'spit').length, 0);
  step(s); step(s, { special: true }); assert.equal(s.stomach, null); assert.equal(s.events.filter(e => e.type === 'spit').length, 1);
  assert.ok(s.shots.some(p => p.cargo === 0 && p.damage === 2));
});
test('frog cannot swallow full-health armor, but can swallow wounded giants', () => {
  const s = start(1); s.beast = 1; s.enemies = [enemy(260, 548, { level: 2, hp: 3, angry: true })];
  step(s, { special: true }); assert.equal(s.stomach, null); assert.equal(s.enemies[0].hp, 3); assert.ok(s.floaters.some(f => f.text === '先削弱！'));
  step(s, {}, 65); s.enemies[0].hp = 1; step(s, { special: true }); assert.equal(s.stomach, 2); assert.equal(s.kills, 1);
  const hunter = start(3); hunter.run.perks = ['hunger']; hunter.enemies = [enemy(255, 548, { level: 1, hp: 2, angry: true })];
  step(hunter, { special: true }); assert.equal(hunter.stomach, 1);
  step(hunter, {}, 65); step(hunter, { special: true }); assert.equal(hunter.shots[0].damage, 5);
});
test('swallowed cargo survives transformation, spits through unique targets and resets on retry', () => {
  const s = start(3); s.beast = 1; s.stomach = 2; s.player.x = s.muffin.x; step(s); assert.notEqual(s.beast, 1); assert.equal(s.stomach, 2);
  s.muffin = { x: -100, y: -100, platform: 0 }; step(s, {}, 65); step(s, { special: true }); assert.equal(s.stomach, 2);
  s.beast = 1; s.player.x = 160; s.player.y = 548; step(s);
  s.enemies = [enemy(245, 548, { id: 10, hp: 3, angry: true, level: 2 }), enemy(305, 548, { id: 11, hp: 3, angry: true, level: 2 }), enemy(365, 548, { id: 12, hp: 3, angry: true, level: 2 })];
  step(s, { special: true }); step(s, {}, 85); assert.equal(s.kills, 3); assert.equal(s.stomach, null);
  assert.equal(createKnightState().stomach, null);
});
test('special action buffers across hit stop and cannot swallow distant or vertical targets', () => {
  const s = start(); s.beast = 1; s.hitStop = .04; s.enemies = [enemy(230, 548)]; step(s, { special: true }); step(s, {}, 12); assert.equal(s.stomach, 0);
  const far = start(); far.beast = 1; far.enemies = [enemy(320, 548), enemy(230, 400)]; step(far, { special: true }); assert.equal(far.stomach, null); assert.equal(far.kills, 0);
});
test('seeded drafts offer three unique choices, freeze all simulation and reject invalid selections', () => {
  const a = createKnightState(3, 44), b = createKnightState(3, 44); beginKnight(a); beginKnight(b);
  assert.equal(a.phase, 'draft'); assert.deepEqual(a.run.offer, b.run.offer); assert.equal(new Set(a.run.offer).size, 3);
  const frozen = JSON.stringify(a); step(a, { right: true, attack: true, special: true }, 120); assert.equal(JSON.stringify(a), frozen);
  const invalid = Object.keys(moduleUnderTest.exports.BLESSINGS).find(id => !a.run.offer.includes(id)); assert.equal(chooseBlessing(a, invalid), false);
  const first = a.run.offer[0]; assert.equal(chooseBlessing(a, first), true); assert.equal(a.phase, 'playing'); assert.deepEqual(a.run.perks, [first]); assert.equal(chooseBlessing(a, first), false);
  beginKnight(a); assert.equal(a.phase, 'playing');
});
function collect(s) { while (s.hitStop > 0) step(s); s.player.x = s.muffin.x; s.player.y = s.muffin.y + 26; s.player.vy = 0; step(s); }
test('fourth stage grants four non-repeating upgrades and needs both 15 burgers and the guardian', () => {
  const s = createKnightState(3, 12); s.spawnIn = 1e6; beginKnight(s);
  chooseBlessing(s, s.run.offer.find(id => id !== 'blood')); const selected = new Set(s.run.perks);
  for (let n = 1; n <= 15; n++) {
    s.enemies = []; s.run.hazards = []; s.player.invulnerable = 100; collect(s); assert.equal(s.muffins, n);
    if (n % 4 === 0) { assert.equal(s.phase, 'draft'); assert.ok(s.run.offer.every(id => !selected.has(id))); s.hearts = 2;
      const id = s.run.offer.find(id => id !== 'blood'); chooseBlessing(s, id); selected.add(id);
    }
    if (n >= 12) assert.ok(s.run.boss);
  }
  assert.equal(s.phase, 'playing'); assert.equal(s.run.perks.length, 4); assert.equal(s.run.drafts, 4);
  s.run.anchors.forEach(a => a.hp = 0);
  s.shots = [{ x: s.run.boss.x, y: 500, vx: 0, vy: 0, kind: 0, r: 10, life: 1, hit: [], pierce: 1, damage: 100 }];
  while(s.hitStop > 0) step(s); step(s); assert.equal(s.run.bossDefeated, true); assert.equal(s.phase, 'won');
  const score = s.score; step(s, { attack: true }, 120); assert.equal(s.score, score);
  const fresh = createKnightState(3, 13); assert.equal(fresh.run.perks.length, 0); assert.equal(fresh.run.boss, null); assert.equal(fresh.run.hazards.length, 0);
});
test('raccoon technique has no life payment and does not grant unrelated projectile damage', () => {
  const s = start(3); s.phase = 'draft'; s.run.offer = ['blood']; s.hearts = 1;
  assert.equal(chooseBlessing(s, 'blood'), true); assert.equal(s.hearts, 1); s.beast = 0; step(s, { attack: true }); assert.equal(s.shots[0].damage, 1);
  const forest = start(); forest.run.perks = ['blood', 'haste', 'echo']; step(forest, { attack: true }); assert.equal(forest.shots[0].damage, 1); assert.equal(forest.shots[0].pierce, 1); assert.equal(abilityCooldown(forest), BEASTS[0].cooldown);
});
test('seal shield absorbs one hit, recharges upon becoming seal and water clears only nearby waves', () => {
  const s = start(3); s.run.perks = ['shell']; s.run.shield = 1; s.enemies = [enemy(160, 548)]; step(s); assert.equal(s.hearts, 3); assert.equal(s.run.shield, 0);
  s.player.invulnerable = 0; step(s); assert.equal(s.hearts, 2);
  s.enemies = []; s.muffins = 3; s.run.nextBeast=4; collect(s); assert.equal(s.hearts, 3); assert.equal(s.run.shield, 1); assert.equal(s.phase, 'draft');
  s.phase='playing'; s.hitStop=0; s.player.hurtTime=0; s.run.hazards=[{x:s.player.x+50,y:525,vx:0,life:2,delay:0,kind:'wave'},{x:s.player.x-180,y:525,vx:0,life:2,delay:0,kind:'wave'},{x:s.player.x,y:525,vx:0,life:2,delay:1,kind:'sigil'}]; step(s,{attack:true}); assert.equal(s.run.hazards.length,2); assert.ok(s.run.hazards.some(h=>h.kind==='sigil'));
});
test('snake fangs bounce twice, add penetration and never re-hit the same enemy', () => {
  const s = start(3); s.run.perks = ['echo']; s.beast = 5; s.player.x = arenaWidth(3) - 80; s.player.y=250; s.player.grounded=false; step(s, { attack: true });
  assert.equal(s.shots[0].pierce, 4); assert.equal(s.shots[0].bounces, 2); step(s, {}, 20); assert.ok(s.shots[0].vx < 0); assert.equal(s.shots[0].bounces, 1);
  const shot = s.shots[0]; shot.x = 16; shot.y = 490; shot.vx = -500; shot.life = 10; step(s); assert.ok(shot.vx > 0); assert.equal(shot.bounces, 0);
  shot.x = arenaWidth(3) - 16; step(s, {}, 20); assert.equal(s.shots.length, 0);
});
test('dog shots chain to at most two nearby enemies and other beast shots do not', () => {
  for(const kind of [0,5]) { const s = start(3); s.run.perks = ['spark']; s.enemies = [enemy(235, 548, { id: 1, hp: 10 }), enemy(280, 548, { id: 2, hp: 10 }), enemy(320, 548, { id: 3, hp: 10 }), enemy(360, 548, { id: 4, hp: 10 })];
    s.shots = [{ x: 235, y: 524, vx: 0, vy: 0, kind, r: 2, life: 1, hit: [], pierce: 3 }]; step(s);
    assert.deepEqual(s.enemies.map(e => e.hp), kind===0?[9, 9, 9, 10]:[9,10,10,10]);
  }
});
test('chicken air jumps shed feathers, ostrich run attacks double-kick and only frogs make landing splashes', () => {
  for (const beast of [0, 2]) { const s = start(3); s.beast = beast; s.run.perks = ['feather'];
    step(s, { jump: true }, 12); step(s, {}, 12); const vy=s.player.vy; step(s, { jump: true }); assert.equal(s.player.vy<vy-100,beast===2); assert.equal(s.shots.length,beast===2?4:0);
    step(s, {}, 12); const lastVy = s.player.vy; step(s, { jump: true }); assert.equal(s.player.vy < lastVy - 100, beast === 2);
  }
  const quick = start(3); quick.beast=6; quick.run.perks=['haste']; quick.player.vx=335; step(quick,{attack:true,right:true}); assert.equal(quick.shots.length,2); assert.ok(Math.abs(quick.attackCooldown-.5*.72)<.001);
  const frog = start(3); frog.run.perks=['haste']; step(frog,{attack:true,special:true}); assert.equal(frog.attackCooldown,.48); assert.equal(frog.specialCooldown,.48);
  for(const beast of [0,1]) { const land = start(3); land.beast=beast; land.run.perks=['nova','blood']; land.player.y=540; land.player.vy=400; land.player.grounded=false; step(land,{},3); assert.equal(land.shots.length,beast===1?4:0); assert.ok(land.shots.every(p=>p.damage===1&&p.kind===1)); }
});
function bossRun() { const s = start(3); s.muffin = { x: -100, y: -100, platform: 0 }; s.phase = 'draft'; s.muffins = 12; s.run.offer = ['echo']; chooseBlessing(s, 'echo'); s.spawnIn = 1e6; s.player.invulnerable = 0; s.run.anchors = []; return s; }
test('guardian warns before waves and sigils; jumping avoids waves, moving avoids sigils', () => {
  const s = bossRun(); s.run.boss.x=350; s.run.boss.timer = .001; step(s); assert.equal(s.run.boss.phase, 'windup'); assert.equal(s.run.hazards.length, 0);
  step(s, {}, 120); assert.equal(s.run.hazards.length, 0); step(s, {}, 30); assert.equal(s.run.hazards.length, 2);
  const dodged = bossRun(); dodged.run.hazards = [{ x: 160, y: 537, vx: 0, life: .5, delay: 0, kind: 'wave' }]; dodged.player.y = 470; dodged.player.grounded = false; step(dodged); assert.equal(dodged.hearts, 3);
  const hit = bossRun(); hit.run.hazards = [{ x: 160, y: 524, vx: 0, life: .5, delay: .2, kind: 'sigil' }]; step(hit, {}, 20); assert.equal(hit.hearts, 3); step(hit, {}, 10); assert.equal(hit.hearts, 2);
  const moved = bossRun(); moved.run.hazards = [{ x: 160, y: 524, vx: 0, life: .5, delay: .6, kind: 'sigil' }]; step(moved, { right: true }, 90); assert.equal(moved.hearts, 3);
});
test('guardian vulnerable window amplifies attacks and boss death alone does not clear the stage', () => {
  for (const phase of ['rest', 'windup']) { const s = bossRun(); const b = s.run.boss; b.phase = phase; b.timer = 10;
    s.shots = [{ x: s.run.boss.x, y: 500, vx: 0, vy: 0, kind: 0, r: 10, life: 1, hit: [], pierce: 1, damage: 2 }]; step(s); assert.equal(b.hp, phase === 'rest' ? 27 : 28);
    s.shots = [{ x: s.run.boss.x, y: 500, vx: 0, vy: 0, kind: 0, r: 10, life: 1, hit: [], pierce: 1, damage: 100 }]; step(s); assert.equal(s.run.bossDefeated, true); assert.equal(s.phase, 'playing'); assert.equal(s.score, 750);
  }
});
test('fourth arena introduces armored enemies only after upgrade milestones', () => {
  for (const [burgers, id, expected] of [[0, 2, 0], [4, 2, 1], [8, 3, 2]]) { const s = start(3); s.muffins = burgers; s.nextId = id; s.spawnIn = 0; step(s); assert.equal(s.enemies[0].level, expected); assert.equal(s.enemies[0].hp, expected + 1); }
});
test('overkill damage counts a kill and score once, without disappearing silently', () => {
  const s = start(3); s.beast = 0; s.run.perks = ['blood']; s.enemies = [enemy(215, 548)];
  step(s, { attack: true }); step(s, {}, 20); assert.equal(s.kills, 1); assert.equal(s.score, 25); step(s, {}, 60); assert.equal(s.score, 25);
});
test('guardian alternates to a telegraphed location which does not follow the player', () => {
  const s = bossRun(); const b = s.run.boss; b.x=300; b.move = 1; b.timer = .001;
  step(s); assert.equal(b.phase, 'windup'); const target = b.targetX; assert.equal(target, 160);
  step(s, { left: true }, 150); assert.equal(b.targetX, target); assert.ok(s.run.hazards.some(h => h.kind === 'sigil' && h.x === target)); assert.equal(s.hearts, 3);
});
test('projectiles striking the guardian also conduct spark to nearby enemies', () => {
  const s = bossRun(); s.run.perks = ['spark']; s.run.boss.timer = 10;
  s.enemies = [enemy(s.run.boss.x - 100, 548, { id: 1, hp: 2 }), enemy(s.run.boss.x + 120, 548, { id: 2, hp: 2 }), enemy(s.run.boss.x - 230, 548, { id: 3, hp: 2 })];
  s.shots = [{ x: s.run.boss.x, y: 500, vx: 0, vy: 0, kind: 0, r: 10, life: 1, hit: [], pierce: 1, damage: 1 }]; step(s);
  assert.deepEqual(s.enemies.map(e => e.hp), [1, 1, 2]); assert.equal(s.run.boss.hp, 28.5);
});

test('raccoon clings, slides slowly, wall-jumps away and holding jump never repeats', () => {
  const s = start(); s.beast = 3; s.player.x = 26; s.player.y = 380; s.player.vy = 300; s.player.grounded = false; s.player.coyote = 0;
  step(s, { left: true }, 35); assert.equal(s.mobility.wall, -1); assert.ok(s.player.vy <= 80); assert.ok(s.player.y < 410);
  step(s, { left: true, jump: true }); assert.ok(s.player.vx > 400); assert.ok(s.player.vy < -700); assert.equal(s.mobility.wall, 0);
  const wallEvents = s.events.filter(e => e.type === 'wall').length; step(s, { left: true, jump: true }, 15); assert.equal(s.events.filter(e => e.type === 'wall').length, wallEvents);
  const dog = start(); dog.player.x = 26; dog.player.y = 380; dog.player.vy = 300; dog.player.grounded = false; step(dog, { left: true }, 10); assert.ok(dog.player.vy > 300); assert.equal(dog.mobility.wall, 0);
});
test('amber walls collide with dashes and support raccoon wall-jumps on both sides', () => {
  const w = wallsAt(3, 0, 0)[0];
  for (const direction of [-1, 1]) { const s = start(3); s.beast = 3; s.player.x = direction > 0 ? w.x - 17 : w.x + w.w + 17; s.player.y = w.y + 65; s.player.grounded = false; s.player.vy = 60; s.player.coyote = 0;
    step(s, { left: direction < 0, right: direction > 0 }); assert.equal(s.mobility.wall, direction); step(s, { jump: true }); assert.equal(Math.sign(s.player.vx), -direction); assert.ok(s.player.vy < -700);
  }
  const dash = start(3); dash.beast = 3; dash.player.x = w.x + w.w + 60; dash.player.y = w.y + 70; dash.player.grounded = false; dash.player.facing = -1;
  step(dash, { dash: true }); step(dash, { left: true }, 15); assert.ok(dash.player.x >= w.x + w.w + 17); assert.equal(dash.player.dash, 0);
});
test('second upgrade rewards wall-jump into charged dash and enables jump cancel', () => {
  const s = start(3); s.beast = 3; s.run.perks = ['echo','haste']; s.player.x = 26; s.player.y = 410; s.player.vy = 50; s.player.grounded = false; s.player.coyote = 0;
  step(s, { left: true }); step(s, { jump: true }); assert.ok(s.mobility.momentum > 1);
  step(s, { dash: true }); assert.equal(s.mobility.charged, true); assert.ok(s.player.vx > 900); assert.equal(s.player.vy, 0);
  step(s, { jump: true }); assert.equal(s.player.dash, 0); assert.ok(s.player.vy < -500);
});
test('relay unlocks exactly on the third selection, and a new jump cannot grant infinite air dashes', () => {
  for (const count of [1,2,3,4]) { const s = start(3); s.run.perks = ['echo','shell','spark','feather'].slice(0,count); s.beast = 0; step(s, { dash: true }); assert.equal(s.player.dash > 0, count >= 3); assert.equal(canRelay(s), count >= 3); }
  const s = start(3); s.run.perks = ['echo','shell','spark']; s.beast = 0; s.player.grounded = false; s.player.y = 230; step(s, { dash: true }); assert.ok(s.mobility.assist > 0); s.mobility.dashCooldown = 0; s.player.dash = 0; step(s); step(s, { dash: true }); assert.equal(s.player.dash, 0);
});
test('all seven relay finishers differ, consume the window once and leave the player in their form', () => {
  const expectedShots = [3,3,5,0,8,2,1];
  for (let beast=0; beast<7; beast++) { const s = start(3); s.beast=beast; s.run.perks=['echo','shell','spark'];
    step(s,{dash:true}); step(s,{attack:true}); assert.equal(s.beast,beast); assert.equal(s.mobility.relayTime,0); assert.equal(s.shots.length,expectedShots[beast]); assert.equal(s.events.filter(e=>e.type==='finisher').length,1);
    if(beast===2) assert.ok(s.player.vy<0); if(beast===3) assert.equal(s.player.facing,-1); if(beast===4) assert.ok(s.player.invulnerable>0); if(beast===6) assert.equal(s.shots[0].r,34);
    step(s,{attack:true},15); assert.equal(s.events.filter(e=>e.type==='finisher').length,1);
  }
});
test('frog relay turns stored cargo into a heavy shot; holding attack or waiting misses the timing bonus', () => {
  const frog = start(3); frog.run.perks=['echo','shell','spark']; frog.stomach=1; step(frog,{dash:true}); step(frog,{attack:true}); assert.equal(frog.stomach,null); assert.equal(frog.shots.length,1); assert.equal(frog.shots[0].damage,5); assert.equal(frog.shots[0].pierce,5);
  const late=start(3); late.beast=0; late.run.perks=['echo','shell','spark']; step(late,{dash:true}); step(late,{},110); step(late,{attack:true}); assert.equal(late.events.filter(e=>e.type==='finisher').length,0);
  const held=start(3); held.beast=0; held.run.perks=['echo','shell','spark']; step(held,{attack:true}); step(held,{attack:true,dash:true}); assert.equal(held.events.filter(e=>e.type==='finisher').length,0);
});
test('fourth arena has genuine scrolling space, camera stays inside level bounds and pause freezes it', () => {
  const s=start(3); s.muffin={x:-100,y:-100,platform:0}; s.player.invulnerable=100; s.run.omenIn=1e6;
  assert.ok(arenaWidth(3)>WORLD_WIDTH*2); s.player.x=1720; step(s,{right:true},90); assert.ok(s.player.x>1800); assert.ok(s.camera.x>1200);
  s.player.x=arenaWidth(3)-26; step(s,{},240); assert.ok(s.camera.x + 480/s.camera.zoom <= arenaWidth(3)+.01);
  assert.ok(s.camera.x-480/s.camera.zoom>=0); s.phase='paused'; const frozen=JSON.stringify(s); step(s,{left:true},120); assert.equal(JSON.stringify(s),frozen);
});
const WORLD_WIDTH=960;
test('seals protect the guardian, breaking them lowers a bridge that carries riders and exposes the core', () => {
  const s=start(3); s.phase='draft'; s.muffins=12; s.run.offer=['echo']; chooseBlessing(s,'echo'); s.player.invulnerable=100; s.spawnIn=1e6;
  const b=s.run.boss; s.shots=[{x:b.x,y:500,vx:0,vy:0,kind:0,r:10,life:1,hit:[],pierce:1,damage:100}]; step(s); assert.equal(b.hp,30);
  s.player.x=1900; s.player.y=218; s.player.vy=0; s.player.grounded=true; s.muffin={x:-100,y:-100,platform:0};
  for(const a of s.run.anchors) { s.hitStop=0; s.shots=[{x:a.x,y:a.y,vx:0,vy:0,kind:0,r:10,life:1,hit:[],pierce:1,damage:3}]; step(s); assert.equal(a.hp,0); }
  step(s,{},170); assert.equal(s.run.bridgeDrop,110); assert.equal(s.player.y,328); assert.equal(platformsAt(3,s.time,0,s.run.bridgeDrop)[10].y,328);
  s.hitStop=0; s.shots=[{x:b.x,y:500,vx:0,vy:0,kind:0,r:10,life:1,hit:[],pierce:1,damage:100}]; step(s); assert.equal(s.run.bossDefeated,true);
});
test('guardian resonance follows a selected platform and shockwaves stop at that platform edge', () => {
  const s=bossRun(), b=s.run.boss, p=platformsAt(3,0)[8]; s.player.x=p.x+30; s.player.y=p.y; s.player.vy=0; s.player.grounded=true; b.platform=8; b.x=p.x+p.w-50; b.y=p.y; b.timer=.001;
  step(s); assert.equal(b.resonance,8); step(s,{jump:true},150); const waves=s.run.hazards.filter(h=>h.minX===p.x); assert.equal(waves.length,2); assert.ok(waves.every(h=>h.y===p.y-11));
  step(s,{},200); assert.equal(s.run.hazards.filter(h=>h.minX===p.x).length,0);
});
test('skill affinity increases the related beast weight, keeps all others possible and allows upgraded forms to repeat', () => {
  const s=start(3); s.run.perks=['hunger','nova']; const weights=beastWeights(s); assert.equal(weights[1],19); assert.equal(weights[2],1); assert.equal(weights[4],1);
  const counts=Array(7).fill(0); for(let seed=1;seed<=500;seed++) { const a=createKnightState(3,Math.imul(seed,2654435761)>>>0); a.beast=1; a.phase='draft'; a.run.offer=['hunger']; chooseBlessing(a,'hunger'); counts[a.run.nextBeast]++; }
  assert.ok(counts[1]>250 && counts[1]>counts[0]*6,JSON.stringify(counts)); assert.ok(counts[4]>0);
  const forest=start(); forest.run.perks=['hunger']; assert.deepEqual(beastWeights(forest),Array(7).fill(1));
});
test('affinity rerolls the displayed next form and a long-absent upgraded beast receives a turn', () => {
  const s=start(3); s.run.perks=['haste']; s.run.drought[6]=8; s.phase='draft'; s.run.offer=['hunger']; chooseBlessing(s,'hunger'); assert.equal(s.run.nextBeast,6);
  collect(s); assert.equal(s.beast,6); assert.equal(s.run.drought[6],0); assert.ok(s.run.nextBeast>=0);
});

test('guardian walks after recovery, locks a leap destination, lands on a real platform and recovers', () => {
  const s=bossRun(), b=s.run.boss; s.player.invulnerable=100; b.timer=1; const original=b.x; step(s,{},60); assert.ok(b.x<original-40); assert.equal(b.y,548);
  const platform=platformsAt(3,s.time,s.run.layout)[8]; s.player.x=platform.x+100; s.player.y=platform.y; s.player.vy=0; s.player.grounded=true; b.move=2; b.timer=.001;
  step(s); assert.equal(b.phase,'leapWindup'); const targetX=b.targetX, targetY=b.targetY; assert.equal(targetY,platform.y); assert.equal(b.resonance,8);
  step(s,{right:true},90); assert.equal(b.targetX,targetX); assert.equal(b.targetY,targetY); assert.equal(b.phase,'leapWindup');
  step(s,{},45); assert.equal(b.phase,'leap'); const fromX=b.x; step(s,{},40); assert.notEqual(b.x,fromX); assert.ok(b.y<548);
  step(s,{},85); assert.equal(b.phase,'rest'); assert.equal(b.x,targetX); assert.equal(b.y,platform.y); assert.equal(b.platform,8); assert.ok(s.run.hazards.filter(h=>h.kind==='wave').every(h=>h.y===platform.y-11));
  const pausedX=b.x; s.phase='paused'; step(s,{},120); assert.equal(b.x,pausedX);
});
test('raccoon technique enables early wall charge and resets dash after a defeat', () => {
  const s=start(3); s.beast=3; s.run.perks=['blood']; s.player.x=26; s.player.y=410; s.player.vy=50; s.player.grounded=false; s.player.coyote=0;
  step(s,{left:true}); step(s,{left:true,jump:true}); assert.ok(s.mobility.momentum>0); step(s,{dash:true}); assert.equal(s.mobility.charged,true);
  s.enemies=[enemy(s.player.x+20,s.player.y,{id:99,hp:4,angry:true,level:2})]; step(s); assert.equal(s.kills,1); assert.equal(s.mobility.dashCooldown,0); assert.equal(s.mobility.dashAirUsed,false);
});
test('snake fangs reflect from climbable terrain pillars', () => {
  const s=start(3); s.beast=5; s.run.perks=['echo']; const wall=wallsAt(3,0,s.run.layout)[2];
  s.shots=[{x:wall.x-2,y:wall.y+50,vx:600,vy:0,kind:5,r:10,life:1,hit:[],pierce:4,bounces:2}]; step(s); assert.ok(s.shots[0].vx<0); assert.equal(s.shots[0].bounces,1);
});

test('draft offers favor distinct beasts and guardian practice is explicit and isolated', () => {
  for(let seed=0;seed<100;seed++) { const s=createKnightState(3,Math.imul(seed,2654435761)); beginKnight(s); assert.equal(new Set(s.run.offer.map(id=>BLESSING_BEASTS[id][0])).size,3); }
  const s=createGuardianPractice(0); assert.equal(s.run.practice,true); assert.equal(s.phase,'playing'); assert.equal(s.muffins,12); assert.equal(s.run.anchors.length,2); assert.equal(s.run.boss.hp,30); assert.equal(canRelay(s),true); assert.ok(s.player.x>1300); assert.equal(createKnightState(3).run.practice,false);
});

test('rock masses block running and dashes, have walkable tops and solid undersides', () => {
  for(const beast of [0,3]) { const s=start(3); s.beast=beast; const r=rocksAt(3)[0]; s.player.x=r.x-30; s.player.y=548; step(s,{right:true,attack:beast===3},60); assert.ok(s.player.x<=r.x-17); }
  const cap=start(3),r=rocksAt(3)[0]; cap.player.x=r.x+80; cap.player.y=r.y-15; cap.player.vy=300; cap.player.grounded=false; step(cap,{},15); assert.equal(cap.player.y,r.y); assert.equal(cap.player.grounded,true);
  const under=start(3),ceiling=rocksAt(3)[0]; under.player.x=ceiling.x+75; under.player.y=ceiling.y+ceiling.h+60; under.player.vy=-500; under.player.grounded=false; step(under,{jump:true}); assert.ok(under.player.y-55>=ceiling.y+ceiling.h); assert.equal(under.player.vy,0);
});
test('raccoon wall jump scales a 330px cliff directly while a normal single jump cannot', () => {
  const r=rocksAt(3)[1];
  for(const beast of [3,4]) { const s=start(3); s.beast=beast; s.player.x=r.x-17; s.muffin={x:-100,y:-100,platform:0}; s.player.invulnerable=100;
    step(s,{right:true,jump:true},55); step(s,{right:true},15); if(beast===3) assert.equal(s.mobility.wall,1);
    step(s,{right:true,jump:true},75); assert.equal(s.player.x>r.x && s.player.y<=r.y,beast===3,`beast ${beast}: ${s.player.x},${s.player.y}`);
  }
});
test('solid rocks stop enemy movement, ordinary shots and ground shockwaves', () => {
  const s=start(3),r=rocksAt(3)[0]; s.enemies=[enemy(r.x-25,548,{vx:70})]; step(s,{},30); assert.ok(s.enemies[0].x<r.x); assert.ok(s.enemies[0].vx<0);
  s.shots=[{x:r.x-2,y:500,vx:600,vy:0,kind:0,r:10,life:2,pierce:1,hit:[]}]; s.run.hazards=[{x:r.x-2,y:537,vx:300,life:2,delay:0,kind:'wave'}]; step(s); assert.equal(s.shots.length,0); assert.equal(s.run.hazards.length,0);
});

test('upgraded dog double jump rolls with limited invulnerability, dives and resets only on landing', () => {
  const s=start(3); s.beast=0; s.run.perks=['spark']; s.muffin={x:-100,y:-100,platform:0};
  step(s,{jump:true},20); step(s,{},1); step(s,{jump:true}); assert.equal(s.player.jumps,2); assert.ok(s.player.rollTime>0); assert.ok(s.player.invulnerable>=.35); assert.ok(s.player.vy<0);
  const count=s.events.filter(e=>e.type==='roll').length; step(s,{jump:true},12); assert.equal(s.events.filter(e=>e.type==='roll').length,count);
  step(s,{},1); step(s,{jump:true}); assert.equal(s.events.filter(e=>e.type==='roll').length,count);
  step(s,{},20); assert.ok(s.player.vy>=430 || s.player.grounded); step(s,{},100); assert.equal(s.player.rollTime,0); assert.equal(s.player.invulnerable,0); assert.equal(s.player.jumps,0);
  const plain=start(3); plain.beast=0; step(plain,{jump:true},20); step(plain); step(plain,{jump:true}); assert.equal(plain.player.rollTime,0);
});
test('ostrich upgrade steps up a cliff in place but cannot create unlimited air jumps', () => {
  const s=start(3); s.beast=6; s.run.perks=['haste']; const r=rocksAt(3)[1]; s.player.x=r.x-17; s.muffin={x:-100,y:-100,platform:0};
  step(s,{right:true,jump:true},30); step(s,{right:true}); step(s,{right:true,jump:true}); assert.ok(s.mobility.strideTime>0); assert.equal(s.mobility.strideUsed,true); assert.ok(s.player.vy < -800); assert.equal(s.player.invulnerable,0);
  const count=s.events.filter(e=>e.type==='stride').length; step(s,{right:true},1); step(s,{right:true,jump:true},55); assert.equal(s.events.filter(e=>e.type==='stride').length,count); assert.ok(s.player.x>r.x); assert.ok(s.player.y<r.y);
  const plain=start(3); plain.beast=6; plain.run.perks=['haste']; plain.player.y=300; plain.player.grounded=false; plain.player.coyote=0; step(plain,{jump:true}); assert.equal(plain.mobility.strideTime,0);
});
test('seal needs two fresh same-direction presses, with a ground roll cooldown and no held-key retriggers', () => {
  for(const direction of ['left','right']) { const s=start(3); s.beast=4; s.run.perks=['shell']; s.muffin={x:-100,y:-100,platform:0};
    step(s,{[direction]:true},5); assert.equal(s.mobility.sealRollTime,0); step(s,{},2); step(s,{[direction]:true}); assert.ok(s.mobility.sealRollTime>0); assert.equal(Math.sign(s.player.vx),direction==='left'?-1:1); assert.ok(s.player.invulnerable>0);
    step(s,{[direction]:true},120); assert.equal(s.events.filter(e=>e.type==='roll').length,1);
  }
  const s=start(3); s.beast=4; s.run.perks=['shell']; step(s,{right:true}); step(s,{},40); step(s,{right:true}); assert.equal(s.mobility.sealRollTime,0);
  step(s,{}); step(s,{left:true}); assert.equal(s.mobility.sealRollTime,0);
  s.player.grounded=false; s.player.y=250; step(s,{}); step(s,{left:true}); assert.equal(s.mobility.sealRollTime,0);
});

test('guardian uses an intervening rock as a stepping stone and its leap clears the rock face', () => {
  const s=bossRun(), b=s.run.boss; s.player.invulnerable=100; s.player.x=1400; s.player.y=188; s.player.grounded=true; b.move=2; b.timer=.001;
  step(s); const landing=platformsAt(3,s.time,s.run.layout)[b.resonance]; assert.equal(landing.rock,3); assert.equal(b.targetY,268);
  step(s,{},134); assert.equal(b.phase,'leap');
  for(let i=0;i<115;i++) { step(s); if(b.phase==='leap') for(const r of rocksAt(3)) {
    if(b.x+50>r.x && b.x-50<r.x+r.w && b.y-90<r.y+r.h) assert.ok(b.y<=r.y+1,`guardian clipped rock at ${b.x},${b.y}`);
  } }
  assert.equal(b.phase,'rest'); assert.equal(b.y,landing.y);
});
test('roll dodges expire and seal rolling cannot pass through a rock', () => {
  const s=start(3); s.beast=4; s.run.perks=['shell']; s.run.shield=0; s.muffin={x:-100,y:-100,platform:0};
  step(s,{right:true}); step(s); step(s,{right:true});
  s.enemies=[enemy(s.player.x,s.player.y)]; step(s); assert.equal(s.hearts,3);
  s.enemies=[]; step(s,{},60); assert.equal(s.player.invulnerable,0);
  s.enemies=[enemy(s.player.x,s.player.y)]; step(s); assert.equal(s.hearts,2);
  const wall=start(3), r=rocksAt(3)[0]; wall.beast=4; wall.run.perks=['shell']; wall.player.x=r.x-35;
  step(wall,{right:true}); step(wall); step(wall,{right:true},10); assert.equal(wall.mobility.sealRollTime,0); assert.ok(wall.player.x<=r.x-17);
});
test('guardian practice retains the chosen beast and provides its actual upgraded movement', () => {
  for(const [beast,perk] of [[0,'spark'],[4,'shell'],[6,'haste']]) {
    const s=createGuardianPractice(0,beast); assert.equal(s.beast,beast); assert.ok(s.run.perks.includes(perk)); assert.equal(new Set(s.run.perks).size,4); assert.equal(s.run.practice,true);
  }
});

test('down drops through one wooden deck, holding it catches the next deck and repressing drops again', () => {
  const s=start(); s.player.x=200; s.player.y=218; s.muffin={x:-100,y:-100,platform:0};
  step(s,{down:true,jump:true}); assert.equal(s.player.grounded,false); assert.ok(s.player.vy>0); assert.equal(s.player.coyote,0);
  step(s,{down:true},100); assert.equal(s.player.grounded,true); assert.equal(s.player.y,438);
  step(s); step(s,{down:true},100); assert.equal(s.player.y,548); assert.equal(s.player.grounded,true);
});
test('drop input never passes through solid rocks or ground and is not queued indefinitely in the air', () => {
  const s=start(3),r=rocksAt(3)[0]; s.player.x=r.x+r.w/2; s.player.y=r.y;
  step(s,{down:true},30); assert.equal(s.player.y,r.y); assert.equal(s.player.dropPlatform,-1);
  const floor=start(); step(floor,{down:true},60); assert.equal(floor.player.y,548);
  const air=start(); air.player.x=200; air.player.y=100; air.player.grounded=false; step(air,{down:true},120); assert.equal(air.player.y,218);
});
test('every lift carries player, enemy and burger through a full cycle; dropping detaches the rider', () => {
  for(const lift of RUINS_LIFTS) for(const layout of [0,1,2]) {
    const s=start(3); s.run.layout=layout; s.run.omenIn=1e6; s.player.invulnerable=100; const deck=platformsAt(3,0,layout)[lift.platform];
    s.player.x=deck.x+25; s.player.y=deck.y; s.muffin={x:deck.x+deck.w-20,y:deck.y-26,platform:lift.platform};
    s.enemies=[enemy(deck.x+deck.w/2,deck.y)];
    for(let i=0;i<Math.ceil(lift.period*120);i++) {
      step(s); const current=platformsAt(3,s.time,layout)[lift.platform];
      assert.ok(Math.abs(s.player.y-current.y)<.01); assert.equal(s.player.grounded,true);
      assert.ok(Math.abs(s.enemies[0].y-current.y)<.01); assert.ok(Math.abs(s.muffin.y+26-current.y)<.01);
    }
    step(s,{down:true}); assert.equal(s.player.dropPlatform,lift.platform); assert.equal(s.player.grounded,false);
    step(s,{},100); assert.equal(s.player.y,548); assert.equal(s.player.grounded,true);
  }
});
test('lift shafts stay clear of rocks and provide body clearance beneath upper decks in every layout', () => {
  for(const layout of [0,1,2]) for(let t=0;t<7;t+=.1) {
    const platforms=platformsAt(3,t,layout);
    assert.equal(wallsAt(3,t,layout).length,rocksAt(3).length,'no blocking posts beneath wooden decks');
    for(const lift of RUINS_LIFTS) {
      const p=platforms[lift.platform];
      for(const rock of rocksAt(3)) assert.ok(p.x+p.w+39<=rock.x || p.x-39>=rock.x+rock.w);
      for(const other of platforms) if(other!==p && other.y<p.y && other.x<p.x+p.w && other.x+other.w>p.x) assert.ok(p.y-other.y>=100);
    }
  }
});

test('wide lens exposes substantially more terrain and keeps player and guardian in frame', () => {
  const s=start(3); assert.ok(960/s.camera.zoom>1450); s.player.invulnerable=100; s.run.omenIn=1e6; s.muffin={x:-100,y:-100,platform:0};
  s.player.x=1300; step(s,{},120); assert.ok(Math.abs(s.camera.zoom-RUINS_ZOOM.explore)<.001);
  const fight=createGuardianPractice(0); step(fight,{},120); assert.ok(960/fight.camera.zoom>1700);
  const half=480/fight.camera.zoom; assert.ok(fight.player.x>fight.camera.x-half && fight.player.x<fight.camera.x+half);
  assert.ok(fight.run.boss.x>fight.camera.x-half && fight.run.boss.x<fight.camera.x+half);
  assert.ok(GUARDIAN_BODY.height>=200); assert.ok(GUARDIAN_BODY.drawScale>=2);
});
test('guardian reacts to distance and blocked paths instead of waiting for its third attack', () => {
  const s=bossRun(),b=s.run.boss; b.terrainCooldown=20; b.timer=.001; b.move=0;
  step(s); assert.equal(b.phase,'leapWindup'); assert.ok(b.targetX<b.x); assert.ok(b.targetX>400,'uses a reachable rock step rather than teleporting across the arena');
  const blocked=bossRun(); blocked.player.x=1770; blocked.run.boss.blocked=true; blocked.run.boss.terrainCooldown=20; blocked.run.boss.timer=.001;
  step(blocked); assert.equal(blocked.run.boss.phase,'leapWindup');
});
test('guardian telegraphs actual rock growth, carries riders and anchors, then restores the ground', () => {
  const s=createGuardianPractice(0), b=s.run.boss, r=rocksAt(3)[3]; s.spawnIn=1e6; s.player.invulnerable=100;
  s.player.x=r.x+r.w/2; s.player.y=r.y; s.player.grounded=true; s.player.vy=0; s.muffin={x:-100,y:-100,platform:0};
  b.timer=.001; b.terrainCooldown=0; step(s); assert.equal(b.phase,'reshape'); assert.equal(s.run.terrain.pattern,'rampart');
  step(s,{},120); assert.equal(s.run.terrain.amount,0); assert.equal(s.player.y,r.y);
  step(s,{},190); assert.equal(s.run.terrain.phase,'hold'); assert.equal(s.player.y,r.y-80);
  assert.equal(s.run.anchors[0].y,r.y-80-26); assert.equal(wallsAt(3,s.time,0,0,s.run.terrain)[3].h,r.h+80);
  s.phase='paused'; const paused=JSON.stringify(s); step(s,{},120); assert.equal(JSON.stringify(s),paused);
  s.phase='playing'; s.run.bossDefeated=true; b.hp=0; step(s,{},170); assert.equal(s.run.terrain.phase,'idle'); assert.equal(s.run.terrain.amount,0); assert.equal(s.player.y,r.y);
});
test('guardian sinks the occupied thin platform while raising a separate escape lift; down still escapes', () => {
  const s=createGuardianPractice(0); s.spawnIn=1e6; s.player.invulnerable=100; s.muffin={x:-100,y:-100,platform:0};
  const deck=platformsAt(3,0)[8]; s.player.x=deck.x+30; s.player.y=deck.y; s.player.grounded=true;
  s.run.boss.timer=.001; s.run.boss.terrainCooldown=0; step(s); assert.equal(s.run.terrain.pattern,'undertow'); assert.equal(s.run.terrain.target,8);
  step(s,{},310); const changed=platformsAt(3,s.time,0,0,s.run.terrain); assert.equal(s.run.terrain.phase,'hold');
  assert.equal(changed[8].y,453); assert.equal(s.player.y,453); assert.equal(changed[7].y,RUINS_LIFTS[2].top);
  step(s,{down:true},80); assert.equal(s.player.y,548); assert.equal(s.player.grounded,true);
});
test('one selected beast dominates a long run, can repeat, and never goes missing for three draws', () => {
  const s=createKnightState(3,517); beginKnight(s); s.run.offer=['hunger']; chooseBlessing(s,'hunger'); s.run.omenIn=1e6; s.spawnIn=1e6; s.player.invulnerable=1e6;
  let chosen=0, repeats=0, missed=0;
  for(let i=0;i<1500;i++) {
    const previous=s.beast; s.muffins=0; s.hitStop=0; s.muffin={x:200,y:522,platform:0}; s.player.grounded=true; s.player.vx=0; collect(s);
    if(s.beast===1) { chosen++; if(previous===1) repeats++; missed=0; } else missed++;
    assert.ok(missed<=2); assert.equal(s.phase,'playing');
  }
  assert.ok(chosen>900,`selected ${chosen}/1500`); assert.ok(repeats>400,`repeat count ${repeats}`);
  assert.equal(s.run.perks.length,1);
});


const strike = (s, x, y, damage=1) => { s.hitStop=0; s.shots=[{x,y,vx:0,vy:0,kind:0,r:10,life:1,hit:[],pierce:1,damage}]; step(s); };
test('seal damage progresses through cracks, rupture, flying shards and persistent rubble, scoring once', () => {
  const s=createGuardianPractice(0),a=s.run.anchors[0]; s.run.boss.timer=100; s.player.invulnerable=100;
  for (const expected of [2,1,0]) { strike(s,a.x,a.y-37); assert.equal(a.hp,expected); assert.ok(a.flash>0); assert.ok(s.events.some(e=>e.type===(expected?'sealHit':'sealBreak'))); }
  assert.equal(s.score,150); assert.equal(a.breakTime,1.1); assert.equal(s.shards.length,40); assert.equal(s.rings.length,2);
  const shard=s.shards.at(-1),x=shard.x,y=shard.y,angle=shard.angle; s.hitStop=0; step(s,{},12);
  assert.notEqual(shard.x,x); assert.notEqual(shard.y,y); assert.notEqual(shard.angle,angle);
  s.phase='paused'; const frozen=JSON.stringify(s); step(s,{},60); assert.equal(JSON.stringify(s),frozen); s.phase='playing';
  step(s,{},240); assert.equal(s.shards.length,0); assert.equal(a.breakTime,0); assert.equal(a.hp,0);
  strike(s,a.x,a.y-37,100); assert.equal(s.score,150); assert.equal(s.shards.length,0);
});
test('broken seal fragments bounce on the ground before fading', () => {
  const s=createGuardianPractice(0),a=s.run.anchors[1]; s.run.boss.timer=100; strike(s,a.x,a.y-37,3); s.hitStop=0;
  const pieces=[...s.shards]; step(s,{},180); assert.ok(pieces.some(p=>p.bounced)); assert.ok(pieces.every(p=>p.y<=548));
});
test('guardian changes phase at both health thresholds, clears old attacks and still takes transition damage', () => {
  const s=bossRun(),b=s.run.boss; s.player.invulnerable=100; b.phase='windup'; b.timer=100;
  strike(s,b.x,b.y-100,11); assert.equal(b.hp,19); assert.equal(b.tier,1); assert.equal(b.phase,'awaken'); assert.ok(s.events.some(e=>e.type==='enrage'));
  s.run.hazards=[{x:0,y:0,vx:0,life:10,delay:10,kind:'sigil'}]; s.run.summons=[{x:400,platform:0,delay:10,level:0}];
  strike(s,b.x,b.y-100,10); assert.equal(b.hp,9); assert.equal(b.tier,2); assert.equal(b.phase,'awaken'); assert.equal(s.run.hazards.length,0); assert.equal(s.run.summons.length,0);
  strike(s,b.x,b.y-100,2); assert.equal(b.hp,7); assert.equal(b.phase,'awaken');
  strike(s,b.x,b.y-100,100); assert.equal(b.hp,0); assert.equal(s.run.bossDefeated,true); assert.equal(s.score,750);
});
test('health transition during a leap finishes the physical arc before awakening', () => {
  const s=bossRun(),b=s.run.boss; s.player.invulnerable=100; b.terrainCooldown=100; b.timer=.001; step(s); step(s,{},134); assert.equal(b.phase,'leap');
  strike(s,b.x,b.y-100,11); assert.equal(b.phase,'leap'); assert.equal(b.pendingAwaken,true); const x=b.x,y=b.y;
  step(s); assert.ok(Math.abs(b.x-x)<30); assert.ok(Math.abs(b.y-y)<30); step(s,{},120);
  assert.equal(b.phase,'awaken'); assert.equal(b.pendingAwaken,false); assert.equal(b.y,platformsAt(3,s.time,s.run.layout,s.run.bridgeDrop,s.run.terrain)[b.platform].y);
});
test('first two health phases shorten normal attacks while the final form switches to telegraphed fist combos', () => {
  const intervals=[];
  for(let tier=0;tier<2;tier++) {
    const s=bossRun(),b=s.run.boss; b.hp=[30,18,9][tier]; b.tier=tier; b.x=350; b.timer=.001; b.terrainCooldown=100; b.summonCooldown=100; s.player.invulnerable=100;
    step(s); assert.equal(b.phase,'windup'); assert.equal(b.timer,GUARDIAN_PHASES[tier].windup);
    let frames=0; while(b.phase==='windup' && frames<200) { step(s); frames++; }
    assert.equal(b.phase,'rest'); assert.equal(b.timer,GUARDIAN_PHASES[tier].recovery); assert.ok(frames>=85);
    intervals.push(frames/120+b.timer);
  }
  assert.ok(intervals[0]>intervals[1]);
  const s=createGuardianPractice(0,3,2),b=s.run.boss; b.timer=.001; b.ritualCooldown=100; b.terrainCooldown=100; b.summonCooldown=100; step(s); assert.equal(b.phase,'windup'); assert.equal(s.run.hazards.filter(h=>h.kind==='fist').length,3); assert.ok(s.run.hazards.every(h=>h.delay>1));
});
test('phase two and three summon on real terrain only after a warning, with armor and a six-enemy cap', () => {
  for(const tier of [1,2]) {
    const s=createGuardianPractice(0,3,tier),b=s.run.boss; s.player.invulnerable=100; s.muffin={x:-100,y:-100,platform:0}; b.timer=.001; step(s);
    assert.equal(b.phase,'summon'); assert.equal(s.run.summons.length,tier+1); assert.equal(s.enemies.length,0);
    assert.ok(s.run.summons.every(portal=>Math.abs(portal.x-s.player.x)>125));
    const sites=s.run.summons.map(p=>({...p})); step(s,{},100); assert.equal(s.enemies.length,0);
    s.phase='paused'; const paused=JSON.stringify(s); step(s,{},120); assert.equal(JSON.stringify(s),paused); s.phase='playing'; step(s,{},50);
    assert.equal(s.enemies.length,tier+1); assert.ok(s.enemies.every(e=>e.summoned)); assert.equal(s.run.summons.length,0); assert.equal(s.run.practiceTier,tier);
    assert.equal(s.enemies.some(e=>e.hp===2),tier===2); assert.ok(sites.every(site=>platformsAt(3,s.time)[site.platform]));
    s.enemies=Array.from({length:5},(_,i)=>enemy(100+i*35,548,{id:100+i})); b.phase='rest'; b.timer=.001; b.summonCooldown=0; step(s); assert.equal(s.run.summons.length,1);
    step(s,{},160); assert.equal(s.enemies.length,6);
    b.phase='rest'; b.timer=.001; b.summonCooldown=0; step(s); assert.notEqual(b.phase,'summon'); assert.equal(s.run.summons.length,0);
  }
});
test('defeating the guardian cancels pending reinforcements and ordinary spawns stay disabled during the boss fight', () => {
  const s=createGuardianPractice(0,3,2),b=s.run.boss; s.player.invulnerable=100; b.timer=.001; s.spawnIn=0; step(s); assert.equal(s.enemies.length,0); assert.equal(s.run.summons.length,3);
  strike(s,b.x,b.y-guardianBody(b).height*.6,100); assert.equal(s.run.summons.length,0); assert.equal(s.run.bossDefeated,true); step(s,{},160); assert.equal(s.enemies.length,0);
});


test('health transitions warn before permanently rearranging the arena and carry the rider and burger', () => {
  const s=createGuardianPractice(0), b=s.run.boss; s.run.anchors=[]; s.run.bridgeDrop=110; s.player.invulnerable=100; b.timer=100; b.phase='windup';
  const r=rocksAt(3)[2]; s.player.x=r.x+10; s.player.y=r.y; s.player.vy=0; s.player.grounded=true;
  s.muffin={x:r.x+r.w-5,y:r.y-26,platform:13};
  strike(s,b.x,b.y-100,11); assert.equal(s.run.terrain.evolutionTarget,1); const original=rocksAt(3,s.run.terrain)[2].y;
  step(s,{},100); assert.equal(rocksAt(3,s.run.terrain)[2].y,original);
  step(s,{},280); assert.ok(Math.abs(s.run.terrain.evolution-1)<.001); assert.equal(rocksAt(3,s.run.terrain)[2].y,303); assert.equal(s.player.y,303); assert.equal(s.muffin.y,277);
  assert.equal(rocksAt(3,s.run.terrain)[1].y,308); assert.equal(platformsAt(3,s.time,0,110,s.run.terrain)[8].y,378);
});
test('phase two ground fissures lock all locations before striking and reward a double-damage punish', () => {
  const s=createGuardianPractice(0,3,1),b=s.run.boss; b.timer=.001; b.ritualCooldown=0; s.player.invulnerable=100;
  step(s); assert.equal(b.phase,'ritual'); const cracks=s.run.hazards.filter(h=>h.kind==='pillar'); assert.equal(cracks.length,3); const positions=cracks.map(h=>h.x);
  assert.ok(cracks[0].delay>1.2); assert.ok(cracks[2].delay>2.5); step(s,{left:true},100); assert.deepEqual(cracks.map(h=>h.x),positions);
  step(s,{},350); assert.equal(b.phase,'rest'); assert.ok(b.exposed>0); const hp=b.hp; strike(s,b.x,b.y-100,1); assert.equal(b.hp,hp-2);
});
test('final flood warns for two seconds, hurts low ground, leaves raised terrain safe and clears', () => {
  for(const high of [false,true]) {
    const s=createGuardianPractice(0,3,2),b=s.run.boss; s.run.shield=0; s.muffin={x:-100,y:-100,platform:0}; s.player.invulnerable=0;
    s.player.x=high?1100:550; s.player.y=high?158:548; s.player.vy=0; s.player.grounded=true; b.timer=.001; b.ritualCooldown=0;
    step(s); assert.equal(b.phase,'ritual'); assert.equal(s.run.hazards[0].kind,'flood'); step(s,{},210); assert.equal(s.hearts,3);
    step(s,{},55); assert.equal(s.hearts,high?3:2);
    s.player.invulnerable=100; step(s,{},530); assert.ok(!s.run.hazards.some(h=>h.kind==='flood')); assert.ok(b.exposed>0);
  }
});
test('colossus has a larger real torso, anchors its body and attacks with locked sequential palms', () => {
  const s=createGuardianPractice(0,3,2),b=s.run.boss; s.player.invulnerable=100;
  assert.ok(guardianBody(b).height>GUARDIAN_BODY.height*2.5); assert.equal(b.x,1660); assert.equal(b.y,548);
  b.timer=.001; b.ritualCooldown=100; b.summonCooldown=100; b.terrainCooldown=100; step(s); const hands=s.run.hazards.filter(h=>h.kind==='fist');
  assert.equal(hands.length,3); assert.ok(hands[2].delay-hands[0].delay>.99); const x=hands.map(h=>h.x); step(s,{left:true},60);
  assert.deepEqual(hands.map(h=>h.x),x); assert.equal(b.x,1660); assert.equal(b.y,548); assert.notEqual(b.phase,'leap');
});
test('final giant growth is continuous and the arena retracts when the boss is defeated', () => {
  const s=bossRun(),b=s.run.boss; s.player.invulnerable=100; b.timer=100; b.phase='windup'; strike(s,b.x,b.y-100,21);
  assert.equal(b.tier,2); assert.equal(b.phase,'awaken'); assert.ok((b.giant??0)<.02); let x=b.x;
  for(let i=0;i<220;i++) { step(s); assert.ok(Math.abs(b.x-x)<10); x=b.x; } assert.equal(b.giant,1); assert.equal(b.x,1660);
  strike(s,b.x,b.y-guardianBody(b).height*.6,100); step(s,{},500); assert.equal(s.run.terrain.evolution,0); assert.equal(s.run.bossDefeated,true);
});
test('both evolved arenas retain reachable platforms for the least mobile beast and clear lift shafts', () => {
  for(const evolution of [1,2]) {
    const control={phase:'idle',pattern:'rampart',timer:0,amount:0,target:8,cycle:0,evolution,evolutionTarget:evolution};
    const platforms=platformsAt(3,0,0,110,control), reached=new Set([0]);
    for(let pass=0;pass<platforms.length;pass++) for(const from of [...reached]) for(let to=0;to<platforms.length;to++) {
      if(reached.has(to)) continue; const a=platforms[from],b=platforms[to];
      launch: for(const wait of (a.lift===undefined?[0]:[0,180,360])) for(const x of [a.x+20,a.x+a.w/2,a.x+a.w-20]) for(const target of [b.x+4,b.x+b.w/2,b.x+b.w-4]) {
        const s=start(3); s.run.terrain={...control}; s.run.bridgeDrop=110; s.run.omenIn=1e6; s.beast=4; s.player.invulnerable=100; s.player.x=x; s.player.y=a.y; s.muffin={x:-100,y:-100,platform:0}; step(s,{},wait);
        for(let n=0;n<200;n++) { step(s,{jump:n<55,left:s.player.x>target+1,right:s.player.x<target-1}); const p=platformsAt(3,s.time,0,110,control)[to]; if(s.player.grounded && Math.abs(s.player.y-p.y)<.01 && s.player.x>=p.x && s.player.x<=p.x+p.w) { reached.add(to); break launch; } }
      }
    }
    assert.equal(reached.size,platforms.length,`phase ${evolution+1}: unreachable ${platforms.map((_,i)=>reached.has(i)?null:i).filter(i=>i!==null)}`);
    for(let t=0;t<7;t+=.1) for(const lift of RUINS_LIFTS) { const p=platformsAt(3,t,0,110,control)[lift.platform]; assert.ok(p.y<=420); for(const r of rocksAt(3,control)) assert.ok(p.x+p.w+39<=r.x || p.x-39>=r.x+r.w); }
  }
});

const { createKnightRun, createFinalePractice, TOWER_PLATFORMS, TOWER_CHECKPOINTS } = moduleUnderTest.exports;
const towerFixture = () => { const s=createFinalePractice(0,4,2); s.phase='playing'; s.run.boss=null;s.run.bossDefeated=true;s.run.anchors=[];s.run.perks=[];s.spawnIn=1e6;s.muffin={x:-100,y:900,platform:0};s.player.invulnerable=1e6;return s; };
test('live fourth level preserves the original arena until the third boss phase', () => {
  const initial=createKnightRun(3,0);assert.equal(initial.run.finalAscent,true);assert.equal(initial.run.tower,undefined);
  for(const tier of [0,1]) {const s=createFinalePractice(0,3,tier);assert.equal(s.run.tower,undefined);assert.equal(platformsAt(3,0,s.run.layout,0,s.run.terrain).length,16);assert.equal(s.run.boss.maxHp,72);}
  const s=createFinalePractice(0,3,1);s.player.invulnerable=100;s.run.boss.hp=25;s.run.boss.phase='rest';s.run.boss.timer=5;
  strike(s,s.run.boss.x,s.run.boss.y-100,2);assert.equal(s.run.boss.tier,2);assert.equal(s.run.tower,undefined,'the telegraph precedes terrain replacement');
  step(s,{},400);assert.ok(s.run.tower);assert.equal(s.run.terrain.tower,true);assert.equal(s.run.anchors.length,3);assert.equal(s.run.boss.maxHp,72);assert.ok(Number.isFinite(s.player.y));
  const positions=s.run.anchors.map(a=>a.y);step(s,{},120);assert.deepEqual(s.run.anchors.map(a=>a.y),positions,'tower crystals are not attached to old arena rocks');
});
test('final tower route is climbable with unupgraded seal in every lift timing layout', () => {
  const route=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18];
  for(const layout of [0,1,2]) for(let n=1;n<route.length;n++) {
    const from=route[n-1],to=route[n],a=TOWER_PLATFORMS[from],b=TOWER_PLATFORMS[to];let reached=false;
    outer: for(const wait of [0,90,180,270,360,450,540,630]) for(const fraction of [.1,.5,.9]) for(const aimFraction of [.1,.5,.9]) {
      const s=towerFixture();s.run.layout=layout;s.player.x=a.x+a.w*fraction;s.player.y=platformsAt(3,0,layout,0,s.run.terrain)[from].y;s.run.tower.highestY=s.player.y;s.run.tower.checkpoint=from;step(s,{},wait);
      for(let frame=0;frame<150;frame++) {const target=platformsAt(3,s.time,layout,0,s.run.terrain)[to];const aim=target.x+target.w*aimFraction;step(s,{jump:frame<58,left:s.player.x>aim+2,right:s.player.x<aim-2});
        if(s.player.grounded && Math.abs(s.player.y-target.y)<2 && s.player.x>=target.x && s.player.x<=target.x+target.w) {reached=true;break outer;}
      }
    }
    assert.ok(reached,`layout ${layout}: ascent ${from} → ${to} must be reachable without any skill`);
  }
});
test('tower camera follows altitude and checkpoints recover a missed landing', () => {
  const s=towerFixture(),deck=TOWER_PLATFORMS[10];s.player.x=deck.x+200;s.player.y=deck.y;step(s,{},180);
  assert.equal(s.run.tower.checkpoint,10);assert.ok(s.camera.y < -700);const hp=s.hearts;
  s.player.x=2133;s.player.y=s.run.tower.highestY+645;s.player.grounded=false;s.run.shield=0;step(s);
  assert.equal(s.hearts,hp-1);assert.equal(s.player.y,deck.y);assert.equal(s.player.x,deck.x+70);
});
test('tower flood is warned at the current altitude then rises instead of staying at old ground level', () => {
  const s=createFinalePractice(0,3,2);s.player.y=-650;s.player.x=500;s.player.invulnerable=100;s.run.boss.phase='rest';s.run.boss.timer=0;s.run.boss.ritualCooldown=0;
  step(s);const flood=s.run.hazards.find(h=>h.kind==='flood');assert.ok(flood);assert.ok(flood.y < -500);assert.ok(flood.delay>1.9);
  const y=flood.y;step(s,{},280);assert.ok(flood.y<y);assert.ok(s.run.boss.y<548,'the giant rises with the ascent');
});
test('three tower locks can be broken and unlock the actual giant hitbox', () => {
  const s=createFinalePractice(0,0,2);s.player.invulnerable=100;const b=s.run.boss;const hp=b.hp;
  strike(s,b.x,b.y-220,1);assert.equal(b.hp,hp);
  for(const a of s.run.anchors) {strike(s,a.x,a.y-37,3);assert.equal(a.hp,0);assert.ok(s.shards.length>0);}
  strike(s,b.x,b.y-220,2);assert.ok(b.hp<hp);assert.equal(s.run.anchors.filter(a=>a.hp>0).length,0);
  s.muffins=15;strike(s,b.x,b.y-220,100);assert.equal(s.phase,'won');
});
test('snake charges on hold and launches on release, with steering and one air charge', () => {
  const s=start(3);s.beast=5;s.run.perks=['echo'];s.player.x=320;s.muffin.x=-100;s.run.omenIn=1e6;
  step(s,{special:true},65);assert.equal(s.mobility.coilActive,true);assert.ok(s.mobility.coilCharge>.5);
  step(s,{right:true});assert.ok(s.player.vy < -800);assert.ok(s.player.vx>450);assert.equal(s.mobility.coilUsed,true);assert.ok(s.shots.some(a=>a.kind===5 && a.vy<0));
  s.specialCooldown=0;step(s,{special:true});assert.equal(s.mobility.coilActive,false,'cannot reset the launch while airborne');
});
test('dog pounce damages a target and rebounds; a missed pounce cannot be spammed in the air', () => {
  const s=start(3);s.beast=0;s.run.perks=['spark'];s.player.x=220;s.player.y=430;s.player.grounded=false;s.player.vy=0;s.muffin.x=-100;s.run.omenIn=1e6;
  s.enemies=[enemy(300,425,{hp:3})];step(s,{special:true},18);
  assert.ok(s.kills>0);assert.ok(s.player.vy<-600);assert.equal(s.mobility.pounceUsed,false,'a hit refunds the action');
  const miss=start(3);miss.beast=0;miss.run.perks=['spark'];miss.player.x=300;miss.muffin.x=-100;step(miss,{special:true});assert.equal(miss.mobility.pounceUsed,true);
  step(miss,{},20);miss.specialCooldown=0;step(miss,{special:true});assert.equal(miss.mobility.pounceUsed,true);assert.ok(miss.mobility.pounceTime<.2,'air miss cannot restart the pounce');
});
test('seal bubble is a temporary landing surface with bounce, damage and wave cancellation', () => {
  const s=start(3);s.beast=4;s.run.perks=['shell'];s.player.x=650;s.player.y=70;s.player.grounded=false;s.muffin.x=-100;s.run.omenIn=1e6;
  step(s,{special:true});assert.ok(s.run.bubble);const {x,y}=s.run.bubble;assert.equal(s.mobility.bubbleUsed,true);
  s.player.x=x;s.player.y=y-2;s.player.vy=180;s.enemies=[enemy(x+65,y,{hp:2})];s.run.hazards=[{kind:'wave',x:x+70,y,vx:0,life:3,delay:0}];step(s,{},2);
  assert.equal(s.run.bubble,undefined);assert.ok(s.player.vy < -850);assert.equal(s.kills,1);assert.equal(s.run.hazards.length,0);
  s.specialCooldown=0;step(s,{special:true});assert.equal(s.run.bubble,undefined,'one planted bubble per airtime');
});
test('new special techniques remain locked before their beast upgrade', () => {
  for(const beast of [0,4,5]) {const s=start(3);s.beast=beast;s.muffin.x=-100;step(s,{special:true},90);assert.equal(s.mobility.pounceTime,0);assert.equal(s.mobility.coilActive,false);assert.equal(s.run.bubble,undefined);assert.equal(s.player.grounded,true);}
});
test('dog locks a reachable elevated enemy and does not acquire through rock', () => {
  const s=towerFixture();s.beast=0;s.run.perks=['spark'];s.player.x=1050;s.player.y=308;s.player.grounded=false;s.player.vy=0;s.player.jumps=1;
  s.enemies=[enemy(1170,68,{hp:3})];step(s,{special:true},44);assert.equal(s.kills,1);assert.equal(s.mobility.pounceUsed,false);assert.ok(s.player.vy<0);
  const blocked=towerFixture();blocked.beast=0;blocked.run.perks=['spark'];blocked.player.x=1800;blocked.player.y=0;blocked.player.grounded=false;blocked.enemies=[enemy(2080,0,{hp:3})];step(blocked,{special:true},45);assert.equal(blocked.kills,0);
});
test('tower lifts carry players and crystals follow a sinking checkpoint deck', () => {
  const s=towerFixture();s.player.x=1030;s.player.y=platformsAt(3,0,s.run.layout,0,s.run.terrain)[3].y;s.run.tower.highestY=s.player.y;const y=s.player.y;step(s,{},60);
  const deck=platformsAt(3,s.time,s.run.layout,0,s.run.terrain)[3];assert.ok(Math.abs(s.player.y-y)>10);assert.ok(Math.abs(s.player.y-deck.y)<.01);
  const combat=createFinalePractice(0,3,2);combat.run.boss.phase='rest';combat.run.boss.timer=100;combat.player.invulnerable=100;Object.assign(combat.run.terrain,{phase:'moving',timer:1.2,pattern:'undertow',target:5,amount:0});step(combat,{},60);
  const moving=platformsAt(3,combat.time,combat.run.layout,0,combat.run.terrain)[5];assert.ok(moving.y>TOWER_PLATFORMS[5].y);assert.equal(combat.run.anchors[0].y,moving.y-26);
});
test('paused ascent freezes the boss, rising flood and a planted bubble', () => {
  const s=createFinalePractice(0,4,2);s.run.bubble={x:500,y:400,life:4};s.run.hazards=[{kind:'flood',x:1080,y:500,vx:0,life:4,delay:0}];s.phase='paused';const before=JSON.stringify(s);step(s,{special:true,jump:true},120);assert.equal(JSON.stringify(s),before);
});

function sealEncounter(beast=0, index=0) {
  const s=createFinalePractice(0,beast,2),a=s.run.anchors[index],deck=platformsAt(3,0,s.run.layout,0,s.run.terrain)[[5,10,14][index]];
  s.muffins=15;s.player.x=a.x-140;s.player.y=deck.y;s.player.invulnerable=0;s.run.shield=0;s.player.facing=1;
  Object.assign(s.run.boss,{phase:'rest',timer:100,y:deck.y+300,ritualCooldown:100,terrainCooldown:100,summonCooldown:100});
  s.run.tower.highestY=deck.y;s.run.tower.checkpoint=[5,10,14][index];s.run.hazards=[];s.run.summons=[];s.enemies=[];return s;
}
test('finale torso is safe to cross both while sealed and after core unlock', () => {
  for(const sealed of [true,false]) {const s=sealEncounter();if(!sealed)s.run.anchors.forEach(a=>a.hp=0);const x=s.player.x,hp=s.hearts;step(s,{right:true},55);assert.equal(s.hearts,hp);assert.equal(s.player.hurtTime,0);assert.ok(s.player.x>x+100);}
});
test('all six ranged beasts can break each real seal with J through the protected giant', () => {
  for(const beast of [0,1,2,4,5,6]) for(const index of [0,1,2]) {
    const s=sealEncounter(beast,index),a=s.run.anchors[index],hp=s.run.boss.hp;
    for(let i=0;i<400 && a.hp>0;i++) step(s,{attack:true});
    assert.equal(a.hp,0,`beast ${beast}, seal ${index}: shots must reach the seal from its platform`);
    assert.equal(s.run.boss.hp,hp,'protected torso must not consume a seal shot or take damage');assert.equal(s.hearts,3,'no invisible torso contact damage');
  }
});
test('raccoon can dash through protected torso to shatter a seal and dog C targets the seal', () => {
  const dash=sealEncounter(3);dash.mobility.momentum=1;step(dash,{dash:true},22);assert.equal(dash.run.anchors[0].hp,0);assert.equal(dash.hearts,3);
  const dog=sealEncounter(0);step(dog,{special:true},35);assert.equal(dog.run.anchors[0].hp,0);assert.equal(dog.mobility.pounceUsed,false);assert.ok(dog.player.vy<0);
});
test('breaking a tower seal clears marked attacks and grants a brief climbing window', () => {
  const s=sealEncounter(3);s.mobility.momentum=1;s.hearts=2;s.run.hazards=[{kind:'fist',x:s.run.anchors[0].x,y:s.player.y,vx:0,life:.5,delay:1}];
  step(s,{dash:true},22);assert.equal(s.run.hazards.length,0);assert.equal(s.run.boss.phase,'rest');assert.ok(s.run.boss.timer>2);assert.ok(s.player.invulnerable>1);assert.equal(s.hearts,3);
});
test('finale active palms still damage and unlocked core still accepts player shots', () => {
  const s=sealEncounter();s.run.hazards=[{kind:'fist',x:s.player.x,y:s.player.y,vx:0,life:.5,delay:0}];step(s);assert.equal(s.hearts,2);
  const unlocked=sealEncounter();unlocked.run.anchors.forEach(a=>a.hp=0);const hp=unlocked.run.boss.hp;step(unlocked,{attack:true},12);assert.ok(unlocked.run.boss.hp<hp);
});

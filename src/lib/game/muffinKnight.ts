/** Deterministic fixed-step arcade simulation. Coordinates are foot anchors. */
export const WORLD = { width: 960, height: 600, gravity: 1500, target: 15 };
export const BURGER_IMAGE = "/images/muffin-knight/hamburger.png";
export const BEASTS = [
  { id: "naotaro", name: "黃金獵犬", skill: "暖陽連射", hint: "快速直線射擊。保持距離，連續壓制。", color: "#eab759", speed: 280, jump: 670, cooldown: .23, crop: [52, 90, 500, 414] },
  { id: "frog", name: "青蛙", skill: "彈跳水砲", hint: "高跳躍＋拋物線水砲，命中造成範圍爆破。", color: "#9dbf7b", speed: 260, jump: 760, cooldown: .48, crop: [73, 73, 359, 375] },
  { id: "chicken", name: "公雞", skill: "羽毛散射", hint: "空中二段跳，三向羽毛一次清場。", color: "#e5bd7b", speed: 290, jump: 665, cooldown: .38, crop: [0, 0, 512, 512] },
  { id: "raccoon", name: "浣熊", skill: "翻滾突擊", hint: "短暫無敵衝刺，穿過並撞散敵群。", color: "#b5a799", speed: 275, jump: 680, cooldown: .8, crop: [0, 0, 512, 512] },
  { id: "seal", name: "魯魯", skill: "環形水波", hint: "八方向泡泡，適合被包圍時反擊。", color: "#7ebfc9", speed: 245, jump: 670, cooldown: .62, crop: [48, 18, 732, 374] },
  { id: "snake", name: "蛇", skill: "穿透毒牙", hint: "毒牙能穿透三個敵人，排成一線再出手。", color: "#acbf74", speed: 285, jump: 675, cooldown: .42, crop: [0, 0, 512, 512] },
  { id: "ostrich", name: "鴕鳥", skill: "疾風踢", hint: "移動速度最快，向前踢出寬幅風刃。", color: "#c4a98a", speed: 335, jump: 695, cooldown: .5, crop: [0, 0, 512, 512] },
] as const;
export const beastImage = (id: string) => id === "frog" ? "/assets/pet-sanctuary/characters/frog/portrait.png" : `/images/muffin-knight/sprites/${id}.png`;
export type Platform = { x: number; y: number; w: number };
export const STAGES = [
  { name: "暖陽小森林", mechanic: "彈簧練習・固定難度", rule: "踩彈簧練習跳上高台；怪物不強化，最多同時 3 隻。", subtitle: "練習移動與變身，收集漢堡也不會加快出怪。", tag: "01 / FOREST", sky: "#e8efe3", hill: "#cfddc9", leaf: "#8da78a", wood: "#aa8968", platforms: [{ x: 30, y: 548, w: 410 }, { x: 110, y: 438, w: 235 }, { x: 610, y: 438, w: 235 }, { x: 370, y: 328, w: 220 }, { x: 80, y: 218, w: 225 }, { x: 655, y: 218, w: 225 }, { x: 520, y: 548, w: 410 }] },
  { name: "午後屋頂", mechanic: "雙向傳送門", rule: "金色與藍色門互通，玩家和怪物都能穿越。", subtitle: "從低處瞬移至對側高台，留意追進門的怪物。", tag: "02 / ROOFTOP", sky: "#f3e8dc", hill: "#e1cbb9", leaf: "#b88c77", wood: "#b18c78", platforms: [{ x: 30, y: 548, w: 380 }, { x: 550, y: 548, w: 380 }, { x: 55, y: 438, w: 230 }, { x: 675, y: 438, w: 230 }, { x: 340, y: 348, w: 280 }, { x: 135, y: 238, w: 240 }, { x: 585, y: 238, w: 240 }] },
  { name: "月光池畔", mechanic: "移動高台", rule: "橫移木橋與升降高台會載著角色、怪物及漢堡移動。", subtitle: "抓準交會時機換台，別在橋離開時跳進水裡。", tag: "03 / MOONLIGHT", sky: "#dce5ed", hill: "#bfcedb", leaf: "#8095ad", wood: "#8e8eaa", platforms: [{ x: 30, y: 548, w: 370 }, { x: 560, y: 548, w: 370 }, { x: 335, y: 438, w: 290 }, { x: 55, y: 328, w: 235 }, { x: 670, y: 328, w: 235 }, { x: 365, y: 218, w: 230 }] },
] as const;
export const SPRINGS = [{ x: 400, y: 548, power: 1060 }, { x: 730, y: 438, power: 920 }] as const;
export const PORTALS = [{ x: 355, y: 548, facing: -1, color: "#f3c574" }, { x: 770, y: 238, facing: -1, color: "#8ee3ed" }] as const;
/** Shared by simulation and drawing, including reduced-motion mode. */
export function platformsAt(stage: number, time: number): Platform[] {
  return STAGES[stage].platforms.map((p, i) => ({ ...p,
    x: p.x + (stage === 2 && i === 2 ? Math.sin(time * .7) * 150 : 0),
    y: p.y + (stage === 2 && i === 5 ? (1 - Math.cos(time * .85)) * 55 : 0),
  }));
}
type TerrainBody = { x: number; y: number; vx: number; vy: number; portalTime?: number; springTime?: number; boosted?: boolean };
export type Input = { left: boolean; right: boolean; jump: boolean; attack: boolean };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
export type Enemy = { id: number; x: number; y: number; vx: number; vy: number; angry: boolean; hp: number; level?: number; rushIn?: number; windup?: number; rush?: number; flash?: number; portalTime?: number; springTime?: number; boosted?: boolean };
export type Shot = { x: number; y: number; vx: number; vy: number; life: number; kind: number; r: number; pierce: number; hit: number[] };
export type KnightEvent = { type: "jump" | "land" | "attack" | "hit" | "hurt" | "collect" | "win" | "lose" | "spring" | "portal" | "grow"; x: number; y: number; beast: number; power: number };
export type Ring = { x: number; y: number; age: number; duration: number; radius: number; color: string };
export type Floater = { x: number; y: number; text: string; life: number; color: string };
export type KnightState = {
  phase: "ready" | "playing" | "paused" | "won" | "lost";
  stage: number; time: number; fxTime: number; muffins: number; score: number; kills: number; hearts: number; beast: number;
  player: { x: number; y: number; vx: number; vy: number; facing: number; grounded: boolean; jumps: number; invulnerable: number; dash: number; coyote: number; jumpBuffer: number; jumpTime: number; landTime: number; attackTime: number; hurtTime: number; dashHits: number[]; portalTime: number; springTime: number; boosted: boolean };
  muffin: { x: number; y: number; platform: number }; enemies: Enemy[]; shots: Shot[]; particles: Particle[]; rings: Ring[]; floaters: Floater[]; events: KnightEvent[];
  attackCooldown: number; attackBuffer: number; attackHeld: boolean; spawnIn: number; nextId: number; jumpHeld: boolean; notice: string; noticeTime: number; flash: number; shake: number; hitStop: number; transform: number; combo: number; comboTime: number; bestCombo: number;
};
export function createKnightState(stage = 0): KnightState {
  return { phase: "ready", stage: Math.max(0, Math.min(2, Math.floor(stage) || 0)), time: 0, fxTime: 0, muffins: 0, score: 0, kills: 0, hearts: 3, beast: 0,
    player: { x: 160, y: 548, vx: 0, vy: 0, facing: 1, grounded: true, jumps: 0, invulnerable: 0, dash: 0, coyote: .11, jumpBuffer: 0, jumpTime: 0, landTime: 0, attackTime: 0, hurtTime: 0, dashHits: [], portalTime: 0, springTime: 0, boosted: false },
    muffin: { x: stage === 1 ? 265 : 325, y: 522, platform: 0 }, enemies: [], shots: [], particles: [], rings: [], floaters: [], events: [], attackCooldown: 0, attackBuffer: 0, attackHeld: false, spawnIn: stage === 0 ? 6 : 3.2, nextId: 0, jumpHeld: false, notice: "收集 15 個漢堡，每次收集都會變身。", noticeTime: 3, flash: 0, shake: 0, hitStop: 0, transform: 0, combo: 0, comboTime: 0, bestCombo: 0 };
}
const overlap = (x: number, y: number, ex: number, ey: number, w: number, h: number) => Math.abs(x - ex) < w && Math.abs(y - ey) < h;
function emit(s: KnightState, type: KnightEvent["type"], x = s.player.x, y = s.player.y, power = 1) { s.events.push({ type, x, y, beast: s.beast, power }); if (s.events.length > 64) s.events.shift(); }
function ring(s: KnightState, x: number, y: number, radius: number, color: string) { s.rings.push({ x, y, age: 0, duration: .38, radius, color }); }
function burst(s: KnightState, x: number, y: number, color: string, count = 12) {
  for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; s.particles.push({ x, y, vx: Math.cos(a) * (65 + i % 3 * 45), vy: Math.sin(a) * 130 - 35, life: .55 + i % 3 * .09, color }); }
}
export const enemyLevel = (e: Enemy) => e.level ?? (e.angry ? 1 : 0);
export const enemyScale = (e: Enemy) => [1, 1.45, 1.9][enemyLevel(e)];
function carry(body: TerrainBody, before: Platform[], after: Platform[]) {
  if (body.vy !== 0) return;
  const i = before.findIndex(p => Math.abs(body.y - p.y) < .6 && body.x + 15 > p.x && body.x - 15 < p.x + p.w);
  if (i < 0) return;
  body.x += after[i].x - before[i].x; body.y += after[i].y - before[i].y;
}
function terrain(s: KnightState, body: TerrainBody, prevY: number, player: boolean) {
  if (s.stage === 0 && !(body.springTime && body.springTime > 0) && body.vy >= 0) {
    for (const pad of SPRINGS) if (Math.abs(body.x - pad.x) < 33 && ((prevY <= pad.y - 17 && body.y >= pad.y - 18) || Math.abs(body.y - pad.y) < .6)) {
      body.y = pad.y - 19; body.vy = -pad.power; body.boosted = true; body.springTime = .28;
      if (player) { s.player.grounded = false; s.player.jumps = 0; s.player.coyote = 0; s.player.jumpTime = .28; s.player.landTime = 0; }
      ring(s, pad.x, pad.y - 18, 58, "#ffe29a"); burst(s, pad.x, pad.y - 18, "#ffe29a", 14); emit(s, "spring", pad.x, pad.y, player ? 1 : .55);
      break;
    }
  }
  if (s.stage === 1 && !(body.portalTime && body.portalTime > 0)) {
    const i = PORTALS.findIndex(g => Math.abs(body.x - g.x) < 27 && Math.abs(body.y - g.y) < 38);
    if (i < 0) return;
    const from = PORTALS[i], to = PORTALS[1 - i];
    body.x = to.x + to.facing * 49; body.y = to.y - 2; body.vx = Math.abs(body.vx) * to.facing; body.vy = Math.min(0, body.vy); body.portalTime = .85;
    if (player) { s.player.facing = to.facing; s.player.grounded = false; s.player.coyote = 0; s.player.jumps = 0; s.player.invulnerable = Math.max(s.player.invulnerable, .4); }
    for (const g of [from, to]) { ring(s, g.x, g.y - 32, 67, g.color); burst(s, g.x, g.y - 32, g.color, 12); }
    emit(s, "portal", from.x, from.y, player ? 1 : .5);
  }
}
function evolve(s: KnightState, e: Enemy) {
  e.y = 100; e.x = e.x < 480 ? 185 : 785; e.vy = 0; e.boosted = false; e.portalTime = .4;
  // The opening arena keeps the same pressure from the first burger to the last.
  if (s.stage === 0) {
    e.level = 0; e.angry = false; e.hp = 1; e.vx = (Math.sign(e.vx) || 1) * 42;
    e.rushIn = 0; e.windup = 0; e.rush = 0; e.flash = 0;
    return;
  }
  const oldLevel = enemyLevel(e), level = Math.min(2, oldLevel + 1);
  e.level = level; e.angry = true; e.hp = level + 1;
  if (oldLevel < level) e.vx *= oldLevel === 0 ? 1.5 : 1.25;
  e.rushIn = 2.5; e.windup = 0; e.rush = 0; e.flash = .3;
  ring(s, e.x, e.y - 25, 75, level === 2 ? "#f3a575" : "#e6bc83");
  s.floaters.push({ x: e.x, y: e.y + 30, text: level === 2 ? "巨化！" : "強化！", life: 1.4, color: "#ffd092" });
  s.notice = level === 2 ? "巨型怪物回場！留意蓄力衝撞。" : "怪物強化回場：體型、速度、耐久提升。"; s.noticeTime = 2.4;
  emit(s, "grow", e.x, e.y, level);
}
function defeat(s: KnightState, e: Enemy) {
  if (e.hp < 0) return; e.hp = -1; s.kills++; s.combo++; s.comboTime = 3; s.bestCombo = Math.max(s.bestCombo, s.combo);
  const points = ([25, 50, 100][enemyLevel(e)]) * Math.min(4, 1 + Math.floor((s.combo - 1) / 3)); s.score += points;
  s.floaters.push({ x: e.x, y: e.y - 30, text: `+${points}`, life: .85, color: "#fff3b5" });
  burst(s, e.x, e.y - 18, "#e6d68e", 18); ring(s, e.x, e.y - 18, 45, "#fff3ce");
  s.hitStop = .045; s.shake = Math.max(s.shake, 3.5); emit(s, "hit", e.x, e.y, s.combo);
}
function hurt(s: KnightState, fromX = s.player.x - s.player.facing * 10) {
  const p = s.player; if (p.invulnerable > 0 || p.dash > 0) return;
  s.hearts--; p.invulnerable = 1.8; p.hurtTime = .3; p.vy = -320; p.vx = p.x >= fromX ? 290 : -290; s.flash = .18; s.shake = 9; s.hitStop = .075;
  s.combo = 0; s.comboTime = 0; burst(s, p.x, p.y - 22, "#df9684", 18); emit(s, "hurt");
  if (s.hearts <= 0) { s.phase = "lost"; s.notice = "本次挑戰結束"; emit(s, "lose"); }
}
function attack(s: KnightState) {
  const p = s.player; const b = s.beast; s.attackCooldown = BEASTS[b].cooldown; p.attackTime = .22; emit(s, "attack");
  const shot = (angle: number, speed: number, r = 10) => s.shots.push({ x: p.x + p.facing * 26, y: p.y - 31, vx: Math.cos(angle) * speed * p.facing, vy: Math.sin(angle) * speed, kind: b, r, life: 1.7, pierce: b === 5 ? 3 : b === 6 ? 2 : 1, hit: [] });
  if (b === 3) { p.dashHits = []; p.dash = .24; burst(s, p.x, p.y - 18, BEASTS[b].color, 8); }
  else if (b === 4) { for (let i = 0; i < 8; i++) shot(i * Math.PI / 4, 310, 11); ring(s, p.x, p.y - 25, 65, "#a3e0ec"); }
  else if (b === 2) for (const angle of [-.23, 0, .23]) shot(angle, 530, 8);
  else if (b === 1) shot(-.55, 440, 15);
  else if (b === 5) shot(0, 620, 10);
  else if (b === 6) shot(0, 540, 22);
  else shot(0, 610, 10);
  burst(s, p.x + p.facing * 29, p.y - 30, BEASTS[b].color, 4);
}
function tickEffects(s: KnightState, dt: number) {
  s.fxTime += dt; s.flash = Math.max(0, s.flash - dt); s.shake = Math.max(0, s.shake - dt * 28); s.transform = Math.max(0, s.transform - dt);
  for (const key of ["jumpTime", "landTime", "attackTime", "hurtTime"] as const) s.player[key] = Math.max(0, s.player[key] - dt);
  for (const p of s.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
  s.particles = s.particles.filter(p => p.life > 0).slice(-240);
  for (const r of s.rings) r.age += dt; s.rings = s.rings.filter(r => r.age < r.duration);
  for (const f of s.floaters) { f.life -= dt; f.y -= dt * 38; } s.floaters = s.floaters.filter(f => f.life > 0);
}
/** Fixed-step updates keep collision and feedback consistent at any display refresh rate. */
export function stepKnight(s: KnightState, input: Input, delta: number, random: () => number = Math.random) {
  if (s.phase !== "playing") return;
  const dt = Math.min(Math.max(delta, 0), 1 / 30); const p = s.player; const beast = BEASTS[s.beast];
  tickEffects(s, dt);
  if (input.jump && !s.jumpHeld) p.jumpBuffer = .13; s.jumpHeld = input.jump;
  if (input.attack && !s.attackHeld) s.attackBuffer = .14; s.attackHeld = input.attack;
  if (s.hitStop > 0) { s.hitStop = Math.max(0, s.hitStop - dt); return; }
  const before = platformsAt(s.stage, s.time);
  const platforms = platformsAt(s.stage, s.time + dt);
  if (p.grounded) carry(p, before, platforms);
  const foodPlatform = s.muffin.platform;
  s.muffin.x += platforms[foodPlatform].x - before[foodPlatform].x; s.muffin.y += platforms[foodPlatform].y - before[foodPlatform].y;
  s.time += dt; s.attackCooldown -= dt; s.attackBuffer = Math.max(0, s.attackBuffer - dt); s.noticeTime -= dt; s.comboTime = Math.max(0, s.comboTime - dt); if (!s.comboTime) s.combo = 0;
  p.portalTime = Math.max(0, p.portalTime - dt); p.springTime = Math.max(0, p.springTime - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt); p.dash = Math.max(0, p.dash - dt);
  p.coyote = p.grounded ? .11 : Math.max(0, p.coyote - dt); p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && (p.coyote > 0 || (s.beast === 2 && p.jumps < 2))) {
    p.boosted = false; p.vy = -beast.jump; p.jumps++; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; p.jumpTime = .28;
    burst(s, p.x, p.y, "#f8edd0", 8); ring(s, p.x, p.y, 23, "#fff1cd"); emit(s, "jump");
  }
  const direction = Number(input.right) - Number(input.left);
  if (direction && p.dash <= 0 && p.hurtTime <= 0) p.facing = direction;
  if ((input.attack || s.attackBuffer > 0) && s.attackCooldown <= 0 && p.hurtTime <= 0) { attack(s); s.attackBuffer = 0; }
  const targetVx = direction * beast.speed; const acceleration = (direction ? 2800 : 3600) * dt;
  if (p.dash > 0) p.vx = p.facing * 790;
  else if (p.hurtTime <= .1) p.vx += Math.max(-acceleration, Math.min(acceleration, targetVx - p.vx));
  p.x = Math.max(26, Math.min(934, p.x + p.vx * dt));
  const prevY = p.y; const wasGrounded = p.grounded;
  const gravity = WORLD.gravity * (p.vy < -230 && !input.jump && !p.boosted ? 2.1 : p.vy > 0 ? 1.15 : 1);
  if (p.vy >= 0) p.boosted = false;
  p.vy += gravity * dt; const landingSpeed = p.vy; p.y += p.vy * dt; p.grounded = false;
  for (const platform of platforms) if (p.vy >= 0 && prevY <= platform.y + .5 && p.y >= platform.y && p.x + 17 > platform.x && p.x - 17 < platform.x + platform.w) {
    p.y = platform.y; p.vy = 0; p.grounded = true; p.jumps = 0;
    if (!wasGrounded && landingSpeed > 220) { p.landTime = .2; burst(s, p.x, p.y, "#e9e2c2", 8); emit(s, "land", p.x, p.y, Math.min(1, landingSpeed / 700)); }
    break;
  }
  terrain(s, p, prevY, true);
  if (p.y > 650) { p.invulnerable = 0; p.dash = 0; hurt(s); p.x = 160; p.y = 548; p.vy = 0; p.vx = 0; p.jumps = 0; p.boosted = false; p.grounded = true; }
  if (s.phase !== "playing") return;
  if (overlap(p.x, p.y - 27, s.muffin.x, s.muffin.y, 35, 38)) {
    s.muffins++; s.score += 100; burst(s, s.muffin.x, s.muffin.y, "#f4c76b", 30);
    s.floaters.push({ x: s.muffin.x, y: s.muffin.y - 24, text: "+100", life: 1, color: "#ffe39b" });
    s.beast = (s.beast + 1) % BEASTS.length; p.invulnerable = Math.max(.8, p.invulnerable); s.attackCooldown = 0; s.transform = .55;
    ring(s, p.x, p.y - 30, 80, BEASTS[s.beast].color); s.shake = 3; s.hitStop = .045; emit(s, "collect");
    s.notice = `${BEASTS[s.beast].name} · ${BEASTS[s.beast].skill}`; s.noticeTime = 1.8;
    const candidates = platforms.map((_, i) => i).filter(i => i !== s.muffin.platform);
    const index = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    const next = platforms[index]; s.muffin = { x: next.x + 35 + random() * (next.w - 70), y: next.y - 26, platform: index };
    if (s.muffins >= WORLD.target) { s.phase = "won"; s.score += s.hearts * 200; emit(s, "win"); return; }
  }
  s.spawnIn -= dt;
  if (s.spawnIn <= 0 && s.enemies.length < (s.stage === 0 ? 3 : 10)) {
    const right = random() > .5;
    s.enemies.push({ id: s.nextId++, x: right ? 785 : 185, y: 70, vx: (right ? -1 : 1) * (s.stage === 0 ? 42 : 52 + s.muffins * 3), vy: 0, angry: false, hp: 1, level: 0 });
    s.spawnIn = s.stage === 0 ? 5.5 : Math.max(1.35, 3.8 - s.muffins * .14);
  }
  for (const e of s.enemies) {
    e.flash = Math.max(0, (e.flash || 0) - dt);
    e.portalTime = Math.max(0, (e.portalTime || 0) - dt); e.springTime = Math.max(0, (e.springTime || 0) - dt);
    carry(e, before, platforms);
    // Giants visibly wind up, then charge in the player's direction.
    e.rush = Math.max(0, (e.rush || 0) - dt);
    if (enemyLevel(e) === 2 && e.vy === 0) {
      if ((e.windup || 0) > 0) { e.windup = Math.max(0, e.windup! - dt); if (e.windup === 0) { e.rush = .7; e.vx = Math.max(65, Math.abs(e.vx)) * (p.x >= e.x ? 1 : -1); } }
      else { e.rushIn = (e.rushIn ?? 2.5) - dt; if (e.rushIn <= 0) { e.windup = .55; e.rushIn = 4; } }
    }
    const oldY = e.y; e.vy += WORLD.gravity * dt; e.x += e.vx * dt * ((e.windup || 0) > 0 ? 0 : (e.rush || 0) > 0 ? 2.1 : 1); e.y += e.vy * dt;
    if (e.x < 22 || e.x > 938) { e.vx *= -1; e.x = Math.max(22, Math.min(938, e.x)); }
    for (const platform of platforms) if (e.vy > 0 && oldY <= platform.y && e.y >= platform.y && e.x > platform.x && e.x < platform.x + platform.w) { e.y = platform.y; e.vy = 0; break; }
    terrain(s, e, oldY, false);
    if (e.y > 635) evolve(s, e);
    const size = enemyScale(e);
    if (overlap(p.x, p.y - 24, e.x, e.y - 20 * size, 16 + 22 * size, 20 + 20 * size)) { if (p.dash > 0) {
      if (!p.dashHits.includes(e.id)) { p.dashHits.push(e.id); e.hp--; e.flash = .15; if (e.hp <= 0) defeat(s, e); else { burst(s, e.x, e.y - 24, "#ffe3ac", 8); emit(s, "hit", e.x, e.y, .4); } }
    } else hurt(s, e.x); }
  }
  if (s.phase !== "playing") return;
  for (const shot of s.shots) {
    shot.life -= dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; if (shot.kind === 1) shot.vy += 500 * dt;
    for (const e of s.enemies) if (e.hp > 0 && shot.life > 0 && !shot.hit.includes(e.id) && overlap(shot.x, shot.y, e.x, e.y - 20 * enemyScale(e), shot.r + 22 * enemyScale(e), shot.r + 21 * enemyScale(e))) {
      e.hp--; e.flash = .15; shot.hit.push(e.id); shot.pierce--; if (shot.pierce <= 0) shot.life = 0;
      if (e.hp <= 0) defeat(s, e); else { burst(s, e.x, e.y - 20, "#fff0bc", 6); emit(s, "hit", e.x, e.y, .4); }
      if (shot.kind === 1) { ring(s, e.x, e.y - 20, 100, "#b7e5af"); for (const other of s.enemies) if (other.hp > 0 && Math.hypot(other.x - e.x, other.y - e.y) < 100) { other.hp--; other.flash = .15; if (other.hp <= 0) defeat(s, other); } }
    }
  }
  s.shots = s.shots.filter(shot => shot.life > 0 && shot.x > -30 && shot.x < 990 && shot.y < 660);
  s.enemies = s.enemies.filter(e => e.hp > 0);
}

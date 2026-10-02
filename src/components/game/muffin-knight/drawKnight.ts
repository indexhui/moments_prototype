import { workshopBackdrop, workshopMechanisms, workshopPlatform } from "./drawWorkshop";
import { BEASTS, STAGES, arenaWidth, SPRINGS, PORTALS, platformsAt, enemyLevel, enemyScale, RUINS_ZOOM, type KnightState } from "@/lib/game/muffinKnight";
import { ruinsBackdrop, ruinsPlatform, ruinsForeground, drawRuinsThreats, type RuinsArt } from "./drawRuins";
import { paintBeast } from "./knightSprites";
const TAU = Math.PI * 2;
function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string | CanvasGradient) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function cloud(c: CanvasRenderingContext2D, x: number, y: number, scale = 1) { c.save(); c.translate(x, y); c.scale(scale, scale); ellipse(c, 0, 0, 52, 17, "#fffdf3"); ellipse(c, -18, -13, 24, 22, "#fffdf3"); ellipse(c, 14, -20, 26, 26, "#fffdf3"); c.restore(); }
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rotation = 0) { c.fillStyle = color; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2 + rotation; const d = i % 2 ? r * .48 : r; c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); c.fill(); }
function hamburger(c: CanvasRenderingContext2D, x: number, y: number, t: number, image: HTMLImageElement | null) {
  c.save(); c.translate(x, y + Math.sin(t * 3) * 4);
  ellipse(c, 0, 0, 31, 31, "#fff5d682");
  if (image?.complete && image.naturalWidth > 0) c.drawImage(image, -29, -29, 58, 58);
  star(c, 30, -18, 5, "#d9a64e", t); star(c, -27, 9, 4, "#d9a64e", -t); c.restore();
}
function grass(c: CanvasRenderingContext2D, x: number, y: number, color: string) { c.strokeStyle = color; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 5, y - 7); c.quadraticCurveTo(x, y - 6, x, y); c.quadraticCurveTo(x, y - 11, x + 6, y - 13); c.moveTo(x, y); c.quadraticCurveTo(x + 7, y - 7, x + 11, y - 6); c.stroke(); }
function backdrop(c: CanvasRenderingContext2D, s: KnightState, t: number, background?: HTMLImageElement, reduced = false, art?: RuinsArt) {
  const theme = STAGES[s.stage];
  c.fillStyle = theme.sky; c.fillRect(0, 0, 960, 600);
  if (s.stage === 4) workshopBackdrop(c, s, reduced);
  else if (s.stage === 3) ruinsBackdrop(c, s, t, background, reduced, art);
  else if (background?.complete && background.naturalWidth > 0) c.drawImage(background, 0, 0, 960, 600);
  else { ellipse(c, 490, 125, 61, 61, "#f8dfa1"); cloud(c, 285, 107, .7); cloud(c, 701, 86, .85); ellipse(c, 210, 604, 385, 265, theme.hill); ellipse(c, 800, 610, 370, 325, theme.hill); }
  // Small drifting motes stay in the background; gameplay projectiles are larger and brighter.
  for (let i = 0; i < 16; i++) { const x = (i * 149 + Math.sin(t * .25 + i) * 15) % 950; const y = 110 + (i * 73) % 400 + Math.sin(t * .5 + i) * 9; c.globalAlpha = .3 + Math.sin(t + i) * .13; ellipse(c, x, y, 1.5, 1.5, "#fff0b5"); } c.globalAlpha = 1;
  for (const x of (s.stage === 4 ? [] : s.stage === 3 ? [Math.max(90, s.player.x - 320), Math.min(2070, s.player.x + 320)] : [185, 785])) {
    const warning = s.phase === "playing" && s.spawnIn < .8;
    c.strokeStyle = warning ? "#e4a06d" : "#667a6160"; c.lineWidth = warning ? 3 : 2;
    c.setLineDash([5, 6]); c.beginPath(); c.ellipse(x, s.run.tower ? s.player.y-230 : 80, warning ? 31 + Math.sin(t * 15) * 3 : 28, 10, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    if (warning) { c.fillStyle = "#9f654d"; c.font = "bold 20px sans-serif"; c.textAlign = "center"; c.fillText("!", x, s.run.tower ? s.player.y-250 : 62); }
  }
  if (s.stage === 2) {
    c.save(); c.setLineDash([6, 9]); c.strokeStyle = "#ccebc266"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(185, 451); c.lineTo(775, 451); c.moveTo(480, 218); c.lineTo(480, 328); c.stroke(); c.restore();
  }
  for (const [index, platform] of platformsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain).entries()) {
    const { x, y, w } = platform; const roof = s.stage === 1, moon = s.stage >= 2;
    if (s.stage === 4) { workshopPlatform(c, platform, index); continue; }
    if (s.stage === 3 && platform.rock !== undefined) continue;
    if (s.stage === 3) { ruinsPlatform(c, x, y, w, index, art, platform.lift, !!s.run.tower); continue; }
    c.save(); c.shadowColor = "#24352635"; c.shadowBlur = 10; c.shadowOffsetY = 6;
    round(c, x + 2, y + 3, w - 4, y === 548 ? 65 : 24, 8, roof ? "#bc8060" : moon ? "#6e7c75" : "#a9835e"); c.restore();
    c.strokeStyle = roof ? "#97664e" : moon ? "#4e675e" : "#796d4d"; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(x + 2, y + 3, w - 4, y === 548 ? 65 : 24, 8); c.stroke();
    c.strokeStyle = roof ? "#dca27b" : moon ? "#9ba58c" : "#c9a77a"; c.lineWidth = 1.5;
    for (let k = 0; k < Math.floor(w / 38); k++) { const lx = x + 15 + k * 38; c.beginPath(); c.moveTo(lx, y + 18); c.quadraticCurveTo(lx + 10, y + 13 + k % 3, lx + 23, y + 19); c.stroke(); }
    round(c, x, y, w, 12, 5, roof ? "#dca17f" : moon ? "#89ab94" : "#9fba7a");
    c.strokeStyle = roof ? "#f5d0a1" : moon ? "#b8d9ae" : "#dae4a4"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + 7, y + 2); for (let k = 18; k < w - 7; k += 16) c.lineTo(x + k, y + 2 + Math.sin(k) * 1.5); c.stroke();
    if (s.stage === 2 && (index === 2 || index === 5)) {
      c.fillStyle = "#233e39"; c.textAlign = "center"; c.font = "bold 17px sans-serif";
      c.fillText(index === 2 ? "↔" : "↕", x + w / 2, y + 23);
      for (const lx of [x + 8, x + w - 8]) ellipse(c, lx, y + 7, 3, 3, "#e6ffb4");
    }
    if (!roof) { grass(c, x + 22, y, moon ? "#99ba8f" : "#70885a"); grass(c, x + w - 27, y, moon ? "#99ba8f" : "#70885a"); }
    if (index % 2 === 1) { const fx = x + w - 49; c.strokeStyle = "#6e8253"; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, y - 13); c.stroke(); for (let i = 0; i < 5; i++) ellipse(c, fx + Math.cos(i * TAU / 5) * 4, y - 15 + Math.sin(i * TAU / 5) * 4, 3, 3, "#fff5d3"); ellipse(c, fx, y - 15, 2, 2, "#dca74f"); }
  }
  if (s.stage === 0) {
    const pit = c.createLinearGradient(0, 548, 0, 600); pit.addColorStop(0, "#20352245"); pit.addColorStop(1, "#10221dda");
    c.fillStyle = pit; c.fillRect(440, 548, 80, 52); c.fillStyle = "#f3d594"; c.textAlign = "center"; c.font = "bold 18px sans-serif"; c.fillText("↓", 480, 582);
  }
  if (s.stage === 0) for (const pad of SPRINGS) {
    const near = [s.player, ...(s.secondPlayer ? [s.secondPlayer.player] : []), ...s.enemies].some(body => (body.springTime || 0) > 0 && Math.abs(body.x - pad.x) < 65);
    const compression = near ? 5 + Math.sin(t * 36) * 3 : 0;
    c.save(); c.translate(pad.x, pad.y);
    round(c, -30, -5, 60, 7, 3, "#6d573e");
    c.strokeStyle = "#eee2b7"; c.lineWidth = 4; c.beginPath(); c.moveTo(-17, -5);
    for (let i = 0; i < 5; i++) c.lineTo(i % 2 ? -17 : 17, -7 - i * (4 - compression / 5)); c.stroke();
    round(c, -34, -25 + compression, 68, 10, 5, "#eec468");
    c.strokeStyle = "#8f693d"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#6b542f"; c.font = "bold 16px sans-serif"; c.textAlign = "center"; c.fillText("↑↑", 0, -15 + compression);
    c.restore();
  }
  if (s.stage === 1) for (const [i, g] of PORTALS.entries()) {
    c.save(); c.translate(g.x, g.y - 36);
    c.shadowColor = g.color; c.shadowBlur = 14;
    ellipse(c, 0, 0, 27, 39, "#233e4699"); c.strokeStyle = g.color; c.lineWidth = 5;
    c.beginPath(); c.ellipse(0, 0, 27, 39, 0, 0, TAU); c.stroke(); c.shadowBlur = 0;
    c.globalAlpha = .7; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(0, 0, 8 + k * 6, 15 + k * 7, Math.sin(t * 2 + k) * .2, t + k, t + k + 4); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = "#fff1ce"; c.textAlign = "center"; c.font = "bold 12px sans-serif"; c.fillText(i === 0 ? "A → B" : "B → A", 0, -49);
    c.restore();
  }
  if (s.stage > 0 && s.stage < 3) { c.fillStyle = s.stage === 2 ? "#48798999" : "#576d7255"; c.fillRect(0, 584, 960, 16); for (let i = 0; i < 15; i++) round(c, i * 72 + Math.sin(t + i) * 8, 591, 35, 2, 1, "#dce6df88"); }
}
export function drawKnight(c: CanvasRenderingContext2D, s: KnightState, images: HTMLImageElement[], burger: HTMLImageElement | null, backgrounds: HTMLImageElement[], time: number, reduced = false, art?: RuinsArt) {
  const t = reduced ? 0 : time;
  c.clearRect(0, 0, 960, 600); c.save();
  if (s.stage === 3) {
    const zoom = reduced ? (s.run.boss && s.run.boss.hp > 0 ? RUINS_ZOOM.boss : RUINS_ZOOM.explore) : s.camera.zoom;
    const x = reduced ? Math.max(480 / zoom, Math.min(arenaWidth(s.stage) - 480 / zoom, s.player.x)) : s.camera.x;
    c.translate(480, 300); c.scale(zoom, zoom); c.translate(-x, -(s.run.tower && reduced ? s.player.y-150/zoom : s.camera.y));
  }
  if (!reduced && s.shake > 0) c.translate(Math.sin(t * 87) * s.shake * .7, Math.cos(t * 113) * s.shake * .45);
  backdrop(c, s, t, backgrounds[s.stage], reduced, art);
  drawRuinsThreats(c, s, t, art);
  if (s.stage === 4) workshopMechanisms(c, s, reduced);
  const m = s.muffin; if (s.muffins < 15) { ellipse(c, m.x, m.y + 25, 18, 4, "#5b635222"); hamburger(c, m.x, m.y, t, burger); }
  if (s.muffins === 0) { c.textAlign = "center"; c.font = "bold 13px sans-serif"; c.fillStyle = "#7e735b"; c.fillText("收集漢堡", m.x, m.y - 44); }
  for (const e of s.enemies) {
    c.save(); c.translate(e.x, e.y); const size = enemyScale(e); c.scale(size, size); const bob = Math.sin(t * 8 + e.id) * 2;
    ellipse(c, 0, 1, 20, 4, "#34493b22");
    const color = e.flash ? "#fff0bb" : enemyLevel(e) === 2 ? "#a65b76" : e.angry ? "#ad6158" : "#526a58";
    c.fillStyle = color; c.strokeStyle = e.angry ? "#754a44" : "#3d5140"; c.lineWidth = 2;
    c.beginPath(); for (let k = 0; k < 24; k++) { const a = k * TAU / 24; const r = 22 + (k % 2 ? -2 : 2); c.lineTo(Math.cos(a) * r, -22 + bob + Math.sin(a) * r * .85); } c.closePath(); c.fill(); c.stroke();
    ellipse(c, -10, -2, 6, 4, color); ellipse(c, 10, -2, 6, 4, color);
    ellipse(c, 0, -19 + bob, 23, 19, color); ellipse(c, -13, -25 + bob, 12, 13, color); ellipse(c, 7, -31 + bob, 13, 12, color);
    ellipse(c, -7, -20 + bob, 2.5, 3, "#f8f4de"); ellipse(c, 7, -20 + bob, 2.5, 3, "#f8f4de");
    c.strokeStyle = "#f8f4de"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-4, -10 + bob); c.quadraticCurveTo(0, -14 + bob, 4, -10 + bob); c.stroke();
    if (e.summoned) {
      // The guardian's offspring share its stone armor and amber core.
      c.fillStyle=e.flash ? "#fff2c5" : "#819184"; c.strokeStyle="#c0c5a0"; c.lineWidth=1.5;
      for (const side of [-1,1]) {
        c.beginPath(); c.moveTo(side*15,-40+bob); c.lineTo(side*26,-31+bob); c.lineTo(side*22,-14+bob); c.lineTo(side*15,-20+bob); c.closePath(); c.fill(); c.stroke();
      }
      c.strokeStyle=e.angry ? "#ffb875" : "#e4cc88"; c.beginPath(); c.moveTo(-4,-38+bob); c.lineTo(2,-32+bob); c.lineTo(-2,-27+bob); c.stroke();
      ellipse(c,0,-14+bob,4,5,e.angry?"#ffb875":"#f2d48d");
    }
    if (e.angry) {
      c.textAlign = "center"; c.fillStyle = "#fff0b3"; c.font = "bold 12px sans-serif";
      c.fillText((e.windup || 0) > 0 ? "!!" : enemyLevel(e) === 2 ? "III" : "II", 0, -49);
      for (let i = 0; i < enemyLevel(e) + 1; i++) round(c, -15 + i * 11, -44, 8, 3, 1, i < e.hp ? "#ffdc8e" : "#503b42");
    }
    if ((e.windup || 0) > 0) { c.strokeStyle = "#ffd69d"; c.lineWidth = 2; c.beginPath(); c.moveTo(-31, -31); c.lineTo(-37, -37); c.moveTo(31, -31); c.lineTo(37, -37); c.stroke(); }
    if ((e.rush || 0) > 0) { c.strokeStyle = "#f8d4b899"; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-Math.sign(e.vx) * 30, -10 - k * 10); c.lineTo(-Math.sign(e.vx) * (45 + k * 6), -10 - k * 10); c.stroke(); } }
    c.restore();
  }
  for (const shot of s.shots) {
    for (let trail = 3; trail > 0; trail--) { c.globalAlpha = .12 * (4 - trail); ellipse(c, shot.x - shot.vx * .009 * trail, shot.y - shot.vy * .009 * trail, shot.r * .75, shot.r * .65, BEASTS[shot.kind].color); } c.globalAlpha = 1;
    if (shot.cargo !== undefined) {
      c.save(); c.translate(shot.x, shot.y); c.rotate(t * 5 * Math.sign(shot.vx));
      ellipse(c, 0, 0, shot.r, shot.r, "#5b8068"); c.strokeStyle = "#f8dfa0"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, shot.r + 3, 0, TAU); c.stroke();
      ellipse(c, -6, -3, 3, 4, "#fff2c2"); ellipse(c, 6, -3, 3, 4, "#fff2c2");
      c.restore();
    }
    else if (shot.kind === 0) star(c, shot.x, shot.y, 11, "#efbf62", t * 5);
    else if (shot.kind === 2) { c.save(); c.translate(shot.x, shot.y); c.rotate(Math.atan2(shot.vy, shot.vx)); ellipse(c, 0, 0, 13, 5, "#b6896e"); c.restore(); }
    else if (shot.kind === 5) { c.save(); c.translate(shot.x, shot.y); c.scale(shot.vx > 0 ? 1 : -1, 1); c.fillStyle = "#dce99b"; c.strokeStyle = "#698e57"; c.lineWidth = 2; c.beginPath(); c.moveTo(15, 0); c.lineTo(-11, -7); c.lineTo(-4, 0); c.lineTo(-11, 7); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    else if (shot.kind === 6) { c.strokeStyle = "#fff0c0"; c.lineWidth = 6; c.beginPath(); c.arc(shot.x - Math.sign(shot.vx) * 12, shot.y, 24, shot.vx > 0 ? -.9 : 2.25, shot.vx > 0 ? .9 : 4.05); c.stroke(); }
    else { ellipse(c, shot.x, shot.y, shot.r, shot.r, shot.kind === 1 ? "#b1d4a6b0" : "#a6d5dfb0"); c.strokeStyle = "#f5fff0"; c.lineWidth = 2; c.beginPath(); c.arc(shot.x, shot.y, shot.r - 3, 3.3, 4.9); c.stroke(); }
  }
  for (const r of s.rings) { const progress = r.age / r.duration; c.globalAlpha = 1 - progress; c.strokeStyle = r.color; c.lineWidth = 5 * (1 - progress) + 1; c.beginPath(); c.ellipse(r.x, r.y, Math.max(1, r.radius * progress), Math.max(1, r.radius * progress * .65), 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
  drawPlayer(c, s, images, t, reduced, s.secondPlayer ? "1P" : undefined);
  if (s.secondPlayer) drawPlayer(c, { ...s, ...s.secondPlayer }, images, t, reduced, s.mode === "cpu" ? "CPU" : "2P");
  for (const particle of (reduced ? s.particles.slice(0, 12) : s.particles)) { c.globalAlpha = Math.max(0, particle.life / .6); star(c, particle.x, particle.y, 4, particle.color, particle.life * 4); } c.globalAlpha = 1;
  for (const f of s.floaters) { c.globalAlpha = Math.min(1, f.life * 3); c.textAlign = "center"; c.font = "900 23px sans-serif"; c.lineWidth = 4; c.strokeStyle = "#4c5a40"; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y); } c.globalAlpha = 1;

  if (s.stage === 3) ruinsForeground(c, s, t, reduced, art);
  c.restore();
  if (s.stage === 3) {
    const vignette = c.createRadialGradient(480, 300, 240, 480, 300, 600); vignette.addColorStop(0, "#071f2900"); vignette.addColorStop(1, "#071f2970"); c.fillStyle = vignette; c.fillRect(0, 0, 960, 600);
    if (s.camera.reveal > 0 && !reduced) { c.fillStyle = "#101f2bed"; const bar = Math.min(20, s.camera.reveal * 28); c.fillRect(0, 0, 960, bar); c.fillRect(0, 600 - bar, 960, bar); }
    if(s.run.boss && s.run.boss.hp>0) {
      const b=s.run.boss,locks=s.run.anchors.filter(a=>a.hp>0).length;
      round(c,22,536,265,45,8,"#102630dd");c.fillStyle="#f2ddb0";c.font="bold 13px sans-serif";c.textAlign="left";
      c.fillText(`負星岩衛 · ${locks ? `先破${s.run.tower ? "鎖星" : "封印"} ${locks}` : (b.exposed ?? 0)>0 ? "過載 ×2" : "核心暴露"}`,34,555);
      round(c,34,565,241,5,2,"#50635c");round(c,34,565,Math.max(1,241*b.hp/b.maxHp),5,2,"#eac484");
    }
    const anchor = s.run.anchors.find(a => a.hp > 0);
    const targetX = s.run.tower && anchor ? anchor.x : s.muffins < 15 ? s.muffin.x : anchor?.x ?? s.run.boss?.x ?? s.player.x;
    const zoom = reduced ? (s.run.boss && s.run.boss.hp > 0 ? RUINS_ZOOM.boss : RUINS_ZOOM.explore) : s.camera.zoom;
    const left = (reduced ? Math.max(480 / zoom, Math.min(2160 - 480 / zoom, s.player.x)) : s.camera.x) - 480 / zoom;
    if(s.run.tower) {
      const targetY=s.run.tower && anchor ? anchor.y-40 : s.muffins<15?s.muffin.y:(s.run.boss?.y ?? s.player.y)-(s.run.boss ? 150 : 0);
      const cy=reduced?s.player.y-150/zoom:s.camera.y,px=(targetX-left)*zoom,py=(targetY-cy)*zoom+300;
      if(py<65 || py>550) {c.fillStyle="#ffe4a3";c.font="bold 15px sans-serif";c.textAlign="center";c.fillText(`${py<65?"↑":"↓"} ${anchor ? "鎖星岩晶" : s.muffins<15?"漢堡路線":"守衛"}`,Math.max(90,Math.min(870,px)),py<65?62:550);}
      round(c,22,22,160,47,10,"#102630bb");c.textAlign="left";c.fillStyle="#eddbaf";c.font="bold 14px sans-serif";c.fillText(`天階高度  ${Math.max(0,Math.round((548-s.run.tower.highestY)/10))} m`,34,43);
      round(c,34,53,136,4,2,"#53645f");round(c,34,53,Math.max(1,136*Math.min(1,(548-s.run.tower.highestY)/2040)),4,2,"#efce87");
    }
    if (targetX < left + 30 / zoom || targetX > left + 930 / zoom) { const right = targetX > left + 930 / zoom; c.fillStyle = "#ffe4a3"; c.font = "bold 14px sans-serif"; c.textAlign = right ? "right" : "left"; c.fillText(`${right ? "" : "← "}${s.run.tower && anchor ? "鎖星" : s.muffins < 15 ? "漢堡" : anchor ? "封印" : "守衛"} ${Math.round(Math.abs(targetX - s.player.x))}步${right ? " →" : ""}`, right ? 938 : 22, 300); }
  }
  if (s.combo >= 2) { c.textAlign = "right"; c.font = "900 28px sans-serif"; c.lineWidth = 4; c.strokeStyle = "#4a6149"; c.strokeText(`${s.combo} COMBO`, 926, 135); c.fillStyle = "#fff0ae"; c.fillText(`${s.combo} COMBO`, 926, 135); round(c, 806, 146, 120, 4, 2, "#263e3455"); round(c, 806, 146, Math.max(1, s.comboTime / 3 * 120), 4, 2, "#efcb76"); }
  if (s.flash > 0 && !reduced) { c.fillStyle = `rgba(221,141,121,${s.flash * .7})`; c.fillRect(0, 0, 960, 600); }
}

function drawPlayer(c: CanvasRenderingContext2D, s: KnightState, images: HTMLImageElement[], t: number, reduced: boolean, label?: string) {
  const p = s.player;
  if (s.rescueBubble) {
    c.save(); c.translate(p.x, p.y - 30);
    const tint = label === "1P" ? "#d4efbd" : "#bdeaff";
    const glow = c.createRadialGradient(-14, -17, 3, 0, 0, 43);
    glow.addColorStop(0, "#ffffff88"); glow.addColorStop(.65, "#b4eaff25"); glow.addColorStop(1, "#83cfe577");
    ellipse(c, 0, 0, 43, 45, glow);
    c.strokeStyle = tint; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 43, 45, 0, 0, TAU); c.stroke();
    const img = images[s.beast];
    if (img?.complete && img.naturalWidth > 0) {
      c.save(); c.translate(0, 24); c.scale(-p.facing * .68, .68); c.globalAlpha = .8; paintBeast(c, img, s, 0); c.restore();
    }
    c.strokeStyle = "#ffffffcc"; c.lineWidth = 4; c.lineCap = "round";
    c.beginPath(); c.ellipse(-5, -6, 29, 30, 0, 3.6, 4.4); c.stroke();
    round(c, -58, -80, 116, 24, 10, "#203b49e8");
    c.fillStyle = tint; c.font = "bold 12px sans-serif"; c.textAlign = "center";
    c.fillText(`${label} · 等待救援`, 0, -64);
    c.fillStyle = "#ffffff"; c.font = "bold 11px sans-serif"; c.fillText("隊友碰觸救回", 0, 66);
    c.restore(); return;
  }
  if(s.run.bubble) {
    const b=s.run.bubble;c.save();c.globalAlpha=Math.min(1,b.life*2);
    ellipse(c,b.x,b.y+8,53,23,"#70cbd966");c.strokeStyle="#c7ffef";c.lineWidth=3;c.beginPath();c.ellipse(b.x,b.y+8,53,23,0,0,TAU);c.stroke();
    c.beginPath();c.moveTo(b.x-42,b.y);c.lineTo(b.x+42,b.y);c.stroke();
    c.fillStyle="#defbed";c.font="bold 13px sans-serif";c.textAlign="center";c.fillText("↓ 踩泡彈高",b.x,b.y-27);c.restore();
  }
  if(s.mobility.coilActive) {
    const charge=s.mobility.coilCharge/.7;c.strokeStyle="#e4ffb1";c.lineWidth=5;c.beginPath();c.arc(p.x,p.y-28,48,-Math.PI/2,-Math.PI/2+TAU*charge);c.stroke();
    c.fillStyle="#efffd0";c.font="bold 14px sans-serif";c.textAlign="center";c.fillText("放開 C · 彈射",p.x,p.y-88);
  }
  if(s.mobility.pounceTime>0) {c.strokeStyle="#ffe7a4";c.lineWidth=6;c.beginPath();c.moveTo(p.x,p.y-25);c.lineTo(p.x-p.vx*.075,p.y-25-p.vy*.075);c.stroke();}

  ellipse(c, p.x, p.y + 2, 27, 5, "#273c3540");
  if (p.invulnerable > 0 && p.hurtTime <= 0) { c.strokeStyle = "#fff3bd99"; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y - 32, 44, 47, 0, 0, TAU); c.stroke(); }
  if (s.run.shield > 0) { c.strokeStyle = "#edcd78aa"; c.lineWidth = 3; c.beginPath(); c.ellipse(p.x, p.y - 34, 46, 49, 0, 0, TAU); c.stroke(); star(c, p.x + 33, p.y - 69, 7, "#ffe0a0", t); }
  if (s.tongue && s.beast === 1) { const extend = Math.sin(Math.min(1, s.tongue.life / .2) * Math.PI / 2); const tx = p.x + (s.tongue.x - p.x) * extend, ty = p.y - 30 + (s.tongue.y - p.y + 30) * extend; c.strokeStyle = "#cf8991"; c.lineWidth = 8; c.lineCap = "round"; c.beginPath(); c.moveTo(p.x + p.facing * 20, p.y - 30); c.quadraticCurveTo((p.x + tx) / 2, ty + 8, tx, ty); c.stroke(); ellipse(c, tx, ty, 8, 6, "#edb0aa"); c.lineCap = "butt"; }
  const img = images[s.beast];
  if (img?.complete && img.naturalWidth > 0) {
    c.save(); c.translate(p.x, p.y); c.scale(-p.facing, 1);
    if(s.mobility.coilActive) c.scale(1+s.mobility.coilCharge*.4,1-s.mobility.coilCharge*.5);
    const rollTime = s.beast === 0 ? p.rollTime : s.beast === 4 ? s.mobility.sealRollTime : 0;
    if (rollTime > 0 && !reduced) {
      const progress = 1 - rollTime / (s.beast === 0 ? .52 : .42);
      c.translate(0, -34); c.rotate(-progress * TAU); c.translate(0, 34);
      c.shadowColor = s.beast === 0 ? "#ffe3a3" : "#b3e5ef"; c.shadowBlur = 16;
    }
    if (s.beast === 6 && s.mobility.strideTime > 0) c.scale(1, 1.12);
    if (s.beast === 3 && s.mobility.wall && !p.grounded) c.rotate(s.mobility.wall * p.facing * .28);
    const land = reduced ? 0 : Math.sin(p.landTime / .2 * Math.PI) * .2;
    const stretch = reduced || p.jumpTime <= 0 ? 0 : Math.sin(p.jumpTime / .28 * Math.PI) * .1;
    const breath = reduced || !p.grounded || Math.abs(p.vx) > 30 ? 0 : Math.sin(t * 3) * .015;
    c.scale((1 + land - stretch * .45) * (s.beast === 1 && s.stomach !== null ? 1.12 : 1), 1 - land + stretch + breath);
    if (p.dash > 0 && !reduced) { for (let i = 3; i > 0; i--) { c.save(); c.translate(i * 18, 0); c.globalAlpha = .07 * (4 - i); paintBeast(c, img, s); c.restore(); } }
    if (p.invulnerable > 0 && p.hurtTime > 0 && Math.floor(s.fxTime * 18) % 2 === 0) c.globalAlpha = .35;
    if (p.hurtTime > .15) c.filter = "brightness(1.6)";
    paintBeast(c, img, s, s.beast === 6 && s.mobility.strideTime > 0 ? 4 : undefined); c.restore();
  }
  if ((s.beast === 0 && p.rollTime > 0) || (s.beast === 4 && s.mobility.sealRollTime > 0)) {
    c.strokeStyle = s.beast === 0 ? "#ffe3a3bb" : "#b3e5efbb"; c.lineWidth = 3;
    const rotation = reduced ? 0 : t * 18; for (let i=0;i<3;i++) { c.beginPath(); c.arc(p.x,p.y-34,46+i*4,rotation+i*2,rotation+i*2+1.1); c.stroke(); }
  }
  if (s.beast === 6 && s.mobility.strideTime > 0) {
    c.strokeStyle = "#f3dfb599"; c.lineWidth = 3; for (const dx of [-10,10]) { c.beginPath(); c.moveTo(p.x+dx,p.y+15); c.quadraticCurveTo(p.x+dx-12*p.facing,p.y+48,p.x+dx-5*p.facing,p.y+65); c.stroke(); }
  }
  if (s.stomach !== null && s.beast === 1) { star(c, p.x + 32, p.y - 62, 7, "#ffe1a4", t); }
  if (s.mobility.assist > 0 && s.beast !== 3 && images[3]?.complete) {
    c.save(); c.translate(p.x - p.facing * 24, p.y - 6); c.scale(-p.facing * 1.12, 1.12); c.globalAlpha = Math.min(.8, s.mobility.assist / .36); c.shadowColor = "#f3d495"; c.shadowBlur = 15;
    paintBeast(c, images[3], { ...s, beast: 3 }, 6); c.restore();
  }
  if (s.mobility.momentum > 0 || s.mobility.relayTime > 0) { c.strokeStyle = s.mobility.relayTime > 0 ? "#f1c773" : "#b9ecd8"; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y - 35, 47, -.8, 1.8); c.stroke(); }
  c.fillStyle = s.stage === 3 ? "#ffe3a5" : "#52634e"; c.beginPath(); c.moveTo(p.x, p.y - 87); c.lineTo(p.x - 5, p.y - 95); c.lineTo(p.x + 5, p.y - 95); c.fill();
  if (label) {
    round(c, p.x - 21, p.y - 119, 42, 21, 8, label === "1P" ? "#526d48" : "#356c96");
    c.fillStyle = "#ffffff"; c.textAlign = "center"; c.font = "bold 13px sans-serif"; c.fillText(label, p.x, p.y - 104);
  }
}

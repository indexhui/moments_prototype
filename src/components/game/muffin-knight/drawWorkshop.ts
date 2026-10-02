import { courseHazards, courseSprings, type KnightState, type Platform } from "@/lib/game/muffinKnight";

const TAU = Math.PI * 2;
function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 3) {
  c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, radius); c.fill();
}
function line(c: CanvasRenderingContext2D, points: number[], color: string, width = 2) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]); c.stroke();
}
function circle(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
}
function bolt(c: CanvasRenderingContext2D, x: number, y: number) {
  circle(c, x, y, 3.2, "#d5c8a4", "#596560"); line(c, [x - 1.4, y + 1.4, x + 1.4, y - 1.4], "#66716a", 1);
}
function gear(c: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, color: string) {
  c.save(); c.translate(x, y); c.rotate(angle); c.fillStyle = color; c.beginPath();
  for (let i = 0; i < 48; i++) { const a = i * TAU / 48, d = i % 4 < 2 ? r : r * .83; c.lineTo(Math.cos(a) * d, Math.sin(a) * d); }
  c.closePath(); c.fill(); circle(c, 0, 0, r * .58, "#374c47");
  for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); box(c, r * .12, -3, r * .55, 6, color, 2); }
  circle(c, 0, 0, r * .16, "#d8b775", "#455b50"); c.restore();
}
function rope(c: CanvasRenderingContext2D, x: number, y: number, bottom: number) {
  line(c, [x, y, x, bottom], "#596456", 5); line(c, [x - 1, y, x - 1, bottom], "#c0ad7e", 2);
  for (let v = y + 7; v < bottom; v += 10) line(c, [x - 3, v, x + 3, v - 3], "#8f835d", 1);
}
function chevrons(c: CanvasRenderingContext2D, x: number, y: number, direction: number, color: string) {
  for (let i = 0; i < 3; i++) line(c, [x + i * 13, y - 4, x + i * 13 + direction * 5, y, x + i * 13, y + 4], color, 2);
}

export function workshopBackdrop(c: CanvasRenderingContext2D, s: KnightState, reduced: boolean) {
  const t = reduced ? 0 : s.time;
  const sky = c.createLinearGradient(0, 0, 0, 600); sky.addColorStop(0, "#ecd9ae"); sky.addColorStop(.5, "#b9cbb7"); sky.addColorStop(1, "#6d9990");
  c.fillStyle = sky; c.fillRect(0, 0, 960, 600);
  circle(c, 760, 106, 68, "#fff0c99c"); circle(c, 760, 106, 52, "#fff2ce");
  // Distant rooftops and arched windows stay subdued behind the playable silhouettes.
  for (let i = 0; i < 8; i++) {
    const x = i * 144 - 50, top = 300 + i % 3 * 37;
    box(c, x, top, 124, 300, i % 2 ? "#75999045" : "#85a09845");
    c.fillStyle = "#78958a55"; c.beginPath(); c.moveTo(x - 10, top); c.lineTo(x + 55, top - 38); c.lineTo(x + 134, top); c.fill();
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) box(c, x + 13 + col * 35, top + 23 + row * 49, 18, 29, "#e6dfb73b", 8);
  }
  // Workshop frame: cross-braced timber, metal feet and paired transmission wheels.
  for (const x of [18, 942]) {
    box(c, x - 10, 32, 20, 568, "#766b50"); box(c, x - 7, 32, 5, 560, "#aa9770");
    for (let y = 140; y < 570; y += 120) {
      box(c, x - 14, y, 28, 17, "#516c60"); bolt(c, x - 6, y + 8); bolt(c, x + 6, y + 8);
      line(c, [x, y + 18, x + (x < 480 ? 65 : -65), y + 82], "#71887980", 7);
    }
  }
  box(c, 16, 28, 928, 15, "#6c755b"); box(c, 16, 28, 928, 4, "#baad80");
  gear(c, 50, 82, 28, t * .25, "#a18c58"); gear(c, 90, 68, 19, -t * .36, "#b3a06c");
  gear(c, 910, 82, 28, -t * .25, "#a18c58");
  line(c, [50, 108, 50, 518, 78, 548], "#77877370", 3);
  line(c, [910, 108, 910, 518, 882, 548], "#77877370", 3);
  c.strokeStyle = "#63765d"; c.lineWidth = 2; c.beginPath(); c.moveTo(100, 50); c.quadraticCurveTo(480, 100, 860, 50); c.stroke();
  for (let i = 0; i < 17; i++) {
    const x = 110 + i * 43, y = 50 + Math.sin((x - 100) / 760 * Math.PI) * 24;
    c.fillStyle = ["#b9674c", "#d5ae61", "#4e8580"][i % 3]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 19, y + 1); c.lineTo(x + 9, y + 21); c.fill();
  }
  // The travelling bridge has a visible rail and end stops; its deck is drawn at the physics position.
  box(c, 268, 484, 424, 7, "#6f817386"); line(c, [273, 485, 687, 485], "#c9c39477", 1);
  for (const x of [268, 692]) { box(c, x - 5, 476, 10, 24, "#627768"); bolt(c, x, 489); }
  chevrons(c, 446, 506, 1, "#607c6e"); chevrons(c, 488, 506, -1, "#607c6e");
  // Recessed machinery below the deck reads as a pit, not a walkable floor.
  const pit = c.createLinearGradient(0, 550, 0, 600); pit.addColorStop(0, "#2a504873"); pit.addColorStop(1, "#193c36"); c.fillStyle = pit; c.fillRect(0, 550, 960, 50);
  for (let x = 292; x < 680; x += 70) gear(c, x, 602, 28, t * .4 * (x % 2 ? -1 : 1), "#647967");
}

/** Platform detail follows the exact collision deck, including horizontal movement. */
export function workshopPlatform(c: CanvasRenderingContext2D, deck: Platform, index: number) {
  const { x, y, w } = deck, moving = index === 4, launch = index === 11, ground = y === 548;
  c.save();
  if (index === 7 || index === 8 || index === 9) {
    for (const rx of [x + 17, x + w - 17]) { rope(c, rx, 43, y + 17); box(c, rx - 6, y + 10, 12, 18, "#567367"); }
  } else if (!ground && !moving && !launch) {
    for (const px of [x + 24, x + w - 24]) {
      line(c, [px, y + 18, px, y + 47, px + (px < 480 ? 30 : -30), y + 18], "#607b6b99", 6);
      bolt(c, px, y + 26);
    }
  }
  if (ground) {
    box(c, x + 8, y + 20, w - 16, 65, "#566d60", 4);
    for (let row = 0; row < 3; row++) for (let j = 0; j < Math.floor(w / 50); j++) box(c, x + 12 + j * 48 + (row % 2 ? 10 : 0), y + 25 + row * 19, 39, 14, ["#7b8668", "#8b8f70", "#6c7e64"][(j + row) % 3], 2);
  }
  c.shadowColor = "#183e3b45"; c.shadowBlur = 8; c.shadowOffsetY = 5;
  box(c, x, y + 5, w, 22, "#544c38", 4); c.shadowBlur = 0; c.shadowOffsetY = 0;
  const plank = c.createLinearGradient(0, y, 0, y + 22); plank.addColorStop(0, "#caa16b"); plank.addColorStop(1, "#8e6946");
  c.fillStyle = plank; c.fillRect(x + 2, y + 6, w - 4, 14);
  for (let px = x + 4, i = 0; px < x + w - 3; px += 29, i++) {
    line(c, [px, y + 7, px, y + 20], "#70563c", 1);
    line(c, [px + 4, y + 11 + i % 3, Math.min(px + 22, x + w - 4), y + 12 + i % 3], "#e0b77c77", 1);
    if (i % 3 === 1) { c.strokeStyle = "#78573f99"; c.lineWidth = 1; c.beginPath(); c.ellipse(px + 13, y + 15, 4, 1.6, 0, 0, TAU); c.stroke(); }
  }
  box(c, x - 1, y - 1, w + 2, 7, "#527e62", 3); line(c, [x + 4, y, x + w - 4, y], "#c6df9c", 2);
  for (const bx of [x + 9, x + w - 9]) { box(c, bx - 5, y + 5, 10, 21, "#526e62", 2); bolt(c, bx, y + 13); }
  if (moving) {
    for (const wheelX of [x + 30, x + w - 30]) { circle(c, wheelX, y + 24, 10, "#334d46", "#baa16d"); circle(c, wheelX, y + 24, 4, "#b7b894"); }
    box(c, x + w / 2 - 28, y + 9, 56, 12, "#ddba67", 2); chevrons(c, x + w / 2 - 15, y + 15, 1, "#5b614a");
  }
  if (launch) { box(c, x + 20, y + 10, w - 40, 10, "#e4bf6b", 1); for (let i = 0; i < 6; i++) line(c, [x + 24 + i * 20, y + 10, x + 32 + i * 20, y + 20], "#776742", 3); }
  c.restore();
}

export function workshopMechanisms(c: CanvasRenderingContext2D, s: KnightState, reduced: boolean) {
  c.save();
  // The saw runs on a continuous overhead carriage, making its entire sweep legible.
  box(c, 348, 337, 264, 8, "#4d655d"); line(c, [352, 339, 608, 339], "#b9b49a", 2);
  for (const x of [348, 612]) { box(c, x - 5, 332, 10, 17, "#8b6c4a"); bolt(c, x, 339); }
  for (const h of courseHazards(s.time)) {
    c.save(); c.translate(h.x, h.y);
    if (h.kind === "saw") {
      box(c, -12, -36, 24, 12, "#698478"); bolt(c, 0, -30); line(c, [0, -25, 0, -8], "#6c7463", 6);
      c.save(); if (!reduced) c.rotate(s.time * 4);
      const steel = c.createLinearGradient(-23, -23, 23, 23); steel.addColorStop(0, "#eef0d8"); steel.addColorStop(.5, "#9ead9f"); steel.addColorStop(1, "#e0d8b9");
      c.fillStyle = steel; c.strokeStyle = "#8d4c3b"; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i < 36; i++) { const a = i * TAU / 36, r = i % 3 === 0 ? h.r + 2 : i % 3 === 1 ? h.r - 6 : h.r - 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill(); c.stroke();
      circle(c, 0, 0, 15, "#8d9c91", "#c9d2b8");
      for (let i = 0; i < 4; i++) { const a = i * TAU / 4; circle(c, Math.cos(a) * 10, Math.sin(a) * 10, 2, "#44594f"); }
      circle(c, 0, 0, 6, "#bf7852", "#694c3a"); c.restore();
    } else {
      box(c, -36, 10, 72, 12, "#4d655a"); box(c, -33, 11, 66, 3, "#bba779");
      for (let i = -1; i <= 1; i++) {
        box(c, i * 19 - 7, 9, 14, 3, "#283e35", 1);
        if (h.active || h.warning) {
          c.fillStyle = h.active ? "#be7560" : "#b9b29a"; c.beginPath(); c.moveTo(i * 19 - 7, 10); c.lineTo(i * 19, h.active ? -17 : 5); c.lineTo(i * 19 + 7, 10); c.fill();
          line(c, [i * 19, h.active ? -15 : 5, i * 19 + 4, 9], "#f4d4ac", 1);
        }
      }
      for (const x of [-31, 31]) bolt(c, x, 17);
      box(c, 40, 2, 15, 20, "#516b5a", 3);
      circle(c, 47, 8, 4, h.active ? "#e78260" : h.warning ? "#ffde83" : "#73917b", "#3b5748");
      if (h.warning) { c.fillStyle = "#f3ca74"; c.font = "bold 16px sans-serif"; c.textAlign = "center"; c.fillText("!", 47, -4); }
    }
    c.restore();
  }
  for (const pad of courseSprings()) {
    const pressed = [s.player, ...(s.secondPlayer ? [s.secondPlayer.player] : []), ...s.enemies].some(p => (p.springTime ?? 0) > 0 && Math.abs(p.x - pad.x) < 40);
    const compression = pressed ? 6 : 0;
    box(c, pad.x - 30, pad.y - 4, 60, 7, "#455e50");
    for (const dx of [-14, 14]) {
      line(c, [pad.x + dx, pad.y - 3, pad.x + dx, pad.y - 22 + compression], "#697b65", 3);
      const points = [pad.x + dx - 6, pad.y - 5]; for (let i = 0; i < 6; i++) points.push(pad.x + dx + (i % 2 ? -6 : 6), pad.y - 6 - i * (3 - compression / 6));
      line(c, points, "#eed6a1", 3);
    }
    box(c, pad.x - 29, pad.y - 27 + compression, 58, 9, "#b18b49"); box(c, pad.x - 27, pad.y - 27 + compression, 54, 3, "#f3d58a");
    for (const x of [-22, 22]) bolt(c, pad.x + x, pad.y - 21 + compression);
    c.fillStyle = "#6d643f"; c.font = "bold 13px sans-serif"; c.textAlign = "center"; c.fillText("↑↑", pad.x, pad.y - 15 + compression);
  }
  // Enemy chutes line up with the actual spawn coordinates (185 / 785, y=70).
  for (const x of [185, 785]) {
    box(c, x - 26, 30, 52, 35, "#536c61", 7); box(c, x - 20, 35, 40, 20, "#263f37", 6);
    box(c, x - 30, 60, 60, 10, "#967953", 3); line(c, [x - 25, 61, x + 25, 61], "#cfb27a", 2);
    for (const side of [-22, 22]) bolt(c, x + side, 42);
    const warning = s.phase === "playing" && s.spawnIn < .8;
    circle(c, x, 40, 5, warning ? "#f0b76a" : "#729b80", "#243f35");
    if (warning) { c.fillStyle = "#f3ca74"; c.font = "bold 14px sans-serif"; c.textAlign = "center"; c.fillText("!", x, 88); }
  }
  c.restore();
}

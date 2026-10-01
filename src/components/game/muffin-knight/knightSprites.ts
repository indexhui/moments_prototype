import atlasData from "../../../../public/images/muffin-knight/sprites/atlas.json";
import { BEASTS, type KnightState } from "@/lib/game/muffinKnight";
type Frame = { x: number; y: number; w: number; h: number };
const atlas: Record<string, { frames: Frame[]; scale: number }> = atlasData;
export const spritePath = (id: string) => `/images/muffin-knight/sprites/${id}.png`;
export function animationFrame(s: KnightState) {
  const p = s.player, frog = BEASTS[s.beast].id === "frog";
  if (frog) {
    if (p.hurtTime > 0 || p.landTime > .08) return 2;
    if (!p.grounded) return p.jumpTime > .16 ? 4 : p.vy < -100 ? 5 : p.vy < 160 ? 0 : 1;
    if (p.attackTime > 0) return 2;
    return Math.abs(p.vx) > 30 ? [3, 2, 4, 5, 0, 1][Math.floor(s.fxTime * 12) % 6] : 3;
  }
  if (p.hurtTime > 0) return 7;
  if (p.attackTime > 0 || p.dash > 0) return 6;
  if (!p.grounded) return p.vy < 0 ? 4 : 5;
  if (Math.abs(p.vx) > 30) return 2 + Math.floor(s.fxTime * 12) % 2;
  return s.fxTime % 3.5 > 3.3 ? 1 : 0;
}
export function paintBeast(c: CanvasRenderingContext2D, image: HTMLImageElement, s: KnightState, frame = animationFrame(s)) {
  const id = BEASTS[s.beast].id;
  if (id === "frog") {
    // Shared region / source baseline (1084). Never normalize individual frog silhouettes.
    const yOffsets = [0, -1, -7, 0, 7, 0];
    c.drawImage(image, frame % 3 * 440, Math.floor(frame / 3) * 370, 440, 370, -55, -87.5 + yOffsets[frame] * .25, 110, 92.5);
  } else {
    const data = atlas[id], f = data?.frames[frame]; if (!f) return;
    c.drawImage(image, f.x, f.y, f.w, f.h, -f.w * data.scale / 2, -f.h * data.scale, f.w * data.scale, f.h * data.scale);
  }
}
export function portraitStyle(id: string) {
  if (id === "frog") return { backgroundImage: 'url("/assets/pet-sanctuary/characters/frog/portrait.png")', backgroundSize: "contain", backgroundPosition: "center" };
  // Four-by-two sheets: first cell is the neutral portrait.
  return { backgroundImage: `url("${spritePath(id)}")`, backgroundSize: "400% 200%", backgroundPosition: "0 0" };
}

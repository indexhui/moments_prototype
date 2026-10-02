import { wallsAt, platformsAt, rocksAt, RUINS_LIFTS, TOWER_LIFTS, TOWER_CHECKPOINTS, TOWER_PLATFORMS, RUINS_ZOOM, GUARDIAN_BODY, GUARDIAN_PHASES, type KnightState } from "@/lib/game/muffinKnight";
export type RuinsArt = { rocks?: HTMLImageElement; guardian?: HTMLImageElement; seal?: HTMLImageElement; colossus?: HTMLImageElement };
const TAU = Math.PI * 2;
function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function stone(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) { c.fillStyle = fill; c.strokeStyle = "#8b998c55"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 7, y); c.lineTo(x + w - 3, y + 2); c.lineTo(x + w, y + h - 5); c.lineTo(x + w - 8, y + h); c.lineTo(x, y + h - 2); c.lineTo(x + 2, y + 7); c.closePath(); c.fill(); c.stroke(); }
/** Architecture spans the entire playable ascent; distant layers track a fraction of camera travel. */
function towerBackdrop(c: CanvasRenderingContext2D,s: KnightState,t: number,background?: HTMLImageElement) {
  const cy=s.camera.y, top=cy-700, evo=s.run.terrain.evolution ?? 0;
  const sky=c.createLinearGradient(0,-2100,0,800); sky.addColorStop(0,"#111a36");sky.addColorStop(.5,"#243d4c");sky.addColorStop(1,"#294b44");
  c.fillStyle=sky;c.fillRect(-200,-2600,2600,3600);
  if(background?.complete && background.naturalWidth) {c.save();c.globalAlpha=.5;c.drawImage(background,-80,cy*.55-680,2320,1160);c.restore();}
  // The broken tower ribs give depth and scale without looking like solid collision walls.
  c.save();c.translate((s.camera.x-1080)*.2,cy*.16);
  for(const x of [220,740,1260,1780]) {
    const grad=c.createLinearGradient(x,0,x+92,0);grad.addColorStop(0,"#102733bb");grad.addColorStop(.5,"#4b646c55");grad.addColorStop(1,"#10243399");
    c.fillStyle=grad;c.fillRect(x,-2400,92,3250);
    for(let y=-2200;y<700;y+=310) {c.strokeStyle="#a0b5a322";c.lineWidth=5;c.beginPath();c.moveTo(x+92,y+140);c.bezierCurveTo(x+150,y-20,x+390,y-20,x+520,y+140);c.stroke();c.lineWidth=2;c.strokeRect(x+8,y,75,25);}
  }
  c.restore();
  for(let i=0;i<80;i++) {const y=-2200+(i*173)%2900; if(y<top || y>cy+700)continue;disc(c,(i*367)%2140,y+Math.sin(t+i)*9,i%4?1.3:2.5,"#e6d59888");}
  // A distant astrolabe is the landmark at the summit, visible several floors in advance.
  c.save();c.translate(1470,-1530);c.strokeStyle=evo>1?"#e6b58666":"#b8c5b54d";
  for(let i=0;i<4;i++) {c.lineWidth=i===0?10:2;c.beginPath();c.ellipse(0,0,200+i*40,200+i*40,t*.025,0,TAU);c.stroke();}
  for(let i=0;i<12;i++){const a=i*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*210,Math.sin(a)*210);c.lineTo(Math.cos(a)*280,Math.sin(a)*280);c.stroke();}
  disc(c,0,0,38,"#f1dca533");c.restore();
  for(const [i,index] of TOWER_CHECKPOINTS.entries()) {
    const deck=TOWER_PLATFORMS[index],lit=index<=s.run.tower!.checkpoint,x=deck.x+60;
    const glow=c.createRadialGradient(x,deck.y-24,1,x,deck.y-24,110);glow.addColorStop(0,lit?"#ffd28b44":"#83b4aa22");glow.addColorStop(1,"#182d3700");c.fillStyle=glow;c.fillRect(x-110,deck.y-134,220,220);
    stone(c,x-13,deck.y-9,26,9,"#819183");
    c.fillStyle=lit?"#ffe3a1":"#99b9b2";c.beginPath();c.moveTo(x-10,deck.y-10);c.quadraticCurveTo(x-14,deck.y-30,x+3,deck.y-49-Math.sin(t*5)*3);c.quadraticCurveTo(x+20,deck.y-18,x+10,deck.y-10);c.fill();
    c.textAlign="left";c.font="bold 16px sans-serif";c.fillStyle=lit?"#f9dfaa":"#b5cbc3";c.fillText(["01 · 根部大廳","02 · 迴旋外廊","03 · 斷橋營火","04 · 星核前庭","05 · 天階之巔"][i],x+25,deck.y-40);
    c.font="12px sans-serif";c.fillText(lit?"營火已點亮":"落地點亮存點",x+25,deck.y-21);
  }
}
export function ruinsBackdrop(c: CanvasRenderingContext2D, s: KnightState, t: number, background?: HTMLImageElement, reduced = false, art?: RuinsArt) {
  const zoom = s.run.boss && s.run.boss.hp > 0 ? RUINS_ZOOM.boss : RUINS_ZOOM.explore;
  const cameraX = reduced ? Math.max(480 / zoom, Math.min(2160 - 480 / zoom, s.player.x)) : s.camera.x;
  if(s.run.tower) towerBackdrop(c,s,t,background); else {
  c.fillStyle = "#273c46"; c.fillRect(-40, -550, 2240, 1400);
  if (background?.complete && background.naturalWidth) {
    // Background moves at 45% of world speed; collision platforms remain in world space.
    c.drawImage(background, (cameraX - 1080) * .3 - 80, -500, 2320, 1120);
    const veil = c.createLinearGradient(0, 0, 0, 600); veil.addColorStop(0, "#19334210"); veil.addColorStop(.7, "#16323a28"); veil.addColorStop(1, "#11252d99"); c.fillStyle = veil; c.fillRect(0, -500, 2160, 1350);
  }
  const evolution = s.run.terrain.evolution ?? 0;
  if (evolution > 0) {
    const glow = c.createLinearGradient(0, 548, 0, -180);
    glow.addColorStop(0, evolution > 1 ? "#db643525" : "#edbf7720"); glow.addColorStop(1,"#29224700");
    c.fillStyle=glow; c.fillRect(0,-180,2160,728);
    // Broken observatory rings wake up in the world, behind the readable terrain.
    c.save(); c.translate(1600,30); c.strokeStyle=evolution>1?"#f2ad8660":"#ecd69c40"; c.lineWidth=4;
    for(let i=0;i<3;i++) { c.beginPath(); c.ellipse(0,0,180+i*42,65+i*35,t*.06*(i%2?1:-1),0,TAU); c.stroke(); }
    c.restore();
  }
  // Midground architecture moves independently of the distant observatory.
  c.save(); c.translate((cameraX - 480) * .22, 0);
  for (const x of [360, 970, 1540, 2110]) {
    c.fillStyle = "#193b4245"; c.fillRect(x, 85, 27, 515); c.strokeStyle = "#91a79125"; c.lineWidth = 2;
    for (let y = 100; y < 600; y += 45) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 27, y - 5); c.stroke(); }
    c.beginPath(); c.arc(x + 160, 155, 148, Math.PI, TAU); c.stroke();
  }
  c.restore();
  for (let i = 0; i < 42; i++) { const x = (i * 137 + Math.sin(t * .45 + i) * 18) % 2160, y = 65 + i * 73 % 465 + Math.sin(t * .7 + i) * 13; disc(c, x, y, i % 4 ? 1 : 2, i % 4 ? "#f8ebbd60" : "#f7d391aa"); }
  for (const [i, x] of [190, 990, 1820].entries()) {
    c.fillStyle = "#e8d5a970"; c.font = "12px serif"; c.textAlign = "center"; c.fillText(["I · 樹根入口", "II · 斷裂水道", "III · 封印機關庭"][i], x, 126);
  }
  }
  for (const wall of wallsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)) {
    if (wall.solid) continue;
    for (let y = wall.y + 4; y < wall.y + wall.h; y += 25) stone(c, wall.x, y, wall.w, Math.min(24, wall.y + wall.h - y), "#6f7970");
    for (const x of [wall.x + 2, wall.x + wall.w - 2]) { c.strokeStyle = "#d7b773"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, wall.y + 15); c.lineTo(x, wall.y + wall.h - 6); c.stroke(); }
    c.fillStyle = "#f3deaa"; c.textAlign = "center"; c.font = "bold 13px sans-serif"; c.fillText("↟", wall.x + 11, wall.y + 48);
  }
  for (const [index, rock] of rocksAt(s.stage, s.run.terrain).entries()) {
    const {x,y,w,h,skin} = rock;
    c.save(); c.shadowColor = "#061b28bb"; c.shadowBlur = 15; c.shadowOffsetX = 6;
    // The face is the solid body, not a parallax layer. Art edges coincide with collision bounds.
    if (art?.rocks?.complete && art.rocks.naturalWidth) {
      c.drawImage(art.rocks, skin % 3 * 512 + 40, Math.floor(skin / 3) * 512 + 45, 440, 449, x - 3, y - 8, w + 6, h + 8);
    } else stone(c, x, y, w, h, "#596d65");
    c.restore();
    c.strokeStyle = "#ddc88c"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, y); c.lineTo(x + w - 4, y); c.stroke();
    // Broken amber grip seams distinguish climbable faces from distant scenery.
    for (const edge of [x + 3, x + w - 3]) { c.strokeStyle = "#d6b477aa"; c.lineWidth = 2; c.beginPath(); for (let k=22; k<h-10; k+=32) { c.moveTo(edge, y+k); c.lineTo(edge, y+k+16); } c.stroke(); }
    if (index === 0 || index === 3) { c.fillStyle = "#eddcaf"; c.font = "bold 12px sans-serif"; c.textAlign = "center"; c.fillText("↟ 蹬牆捷徑", x + w/2, y + 57); }
  }
}
export function ruinsPlatform(c: CanvasRenderingContext2D, x: number, y: number, w: number, index: number, art?: RuinsArt, lift?: number, tower = false) {
  if (index > 0 && lift !== undefined) {
    c.save();
    const track = lift === undefined ? undefined : (tower ? TOWER_LIFTS : RUINS_LIFTS)[lift];
    if (track) {
      // Ropes and counterweights are decorative; only the thin deck carries riders.
      for (const px of [x + 12, x + w - 12]) {
        c.strokeStyle = "#cfb78b55"; c.lineWidth = 2; c.setLineDash([4, 6]);
        c.beginPath(); c.moveTo(px, track.top - 27); c.lineTo(px, track.bottom + 25); c.stroke(); c.setLineDash([]);
        c.strokeStyle = "#bda47b"; c.lineWidth = 3; c.beginPath(); c.moveTo(px, track.top - 27); c.lineTo(px, y + 7); c.stroke();
        disc(c, px, track.top - 27, 9, "#425650"); disc(c, px, track.top - 27, 4, "#d3af70");
      }
      c.fillStyle = "#b6d6c088"; c.font = "12px sans-serif"; c.textAlign = "center";
      c.fillText("↕", x + w / 2, track.top - 28);
    }
    c.shadowColor = "#071a2480"; c.shadowBlur = 8; c.shadowOffsetY = 5;
    c.fillStyle = "#584b36"; c.fillRect(x, y + 5, w, 15); c.shadowBlur = 0; c.shadowOffsetY = 0;
    const count = Math.ceil(w / 28), plank = w / count;
    for (let i = 0; i < count; i++) {
      const px = x + i * plank; c.fillStyle = i % 2 ? "#b29261" : "#c6a674";
      c.fillRect(px + 1, y, plank - 2, 13);
      c.strokeStyle = "#71583b88"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 5, y + 6); c.lineTo(px + plank - 5, y + 7); c.stroke();
    }
    c.strokeStyle = track ? "#f2db9b" : "#e6c892"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke();
    for (const px of [x + 10, x + w - 10]) { c.fillStyle = "#5e7061"; c.fillRect(px - 3, y, 6, 18); disc(c, px, y + 5, 2, "#eee2bc"); }
    c.fillStyle = "#f1dfb5"; c.font = "10px sans-serif"; c.textAlign = "center";
    c.fillText(track ? "升降木台 · ↓ 穿落" : "↓", x + w / 2, y + 33);
    c.restore(); return;
  }
  c.save(); c.shadowColor = "#071a24aa"; c.shadowBlur = 12; c.shadowOffsetY = 7;
  stone(c, x, y + 3, w, y === 548 ? 240 : 28, index === 10 ? "#8c8063" : "#64766d"); c.restore();
  if (art?.rocks?.complete && art.rocks.naturalWidth && index > 0) c.drawImage(art.rocks, 40, 557, 440, 350, x-2, y-5, w+4, 32);
  for (let px = x + 8; px < x + w - 10; px += 38) { c.strokeStyle = "#263f3b80"; c.lineWidth = 2; c.beginPath(); c.moveTo(px, y + 8); c.lineTo(px - 3, y + 31); c.stroke(); }
  c.strokeStyle = "#c5c99b"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(x + 4, y + 2); c.lineTo(x + w - 4, y + 2); c.stroke(); c.lineCap = "butt";
  if (index > 0) {
    for (let i = 0; i < 4; i++) { const px = x + w * (i + 1) / 5; c.strokeStyle = "#a6b285aa"; c.lineWidth = 2; c.beginPath(); c.moveTo(px, y + 31); c.quadraticCurveTo(px - 8, y + 51, px + 4, y + 49 + i % 2 * 7); c.stroke(); }
    disc(c, x + 12, y + 16, 3, "#efd698"); disc(c, x + w - 12, y + 16, 3, "#efd698");
  }
}
export function ruinsForeground(c: CanvasRenderingContext2D, s: KnightState, t: number, reduced: boolean, art?: RuinsArt) {
  const zoom = s.run.boss && s.run.boss.hp > 0 ? RUINS_ZOOM.boss : RUINS_ZOOM.explore;
  const cx = reduced ? Math.max(480 / zoom, Math.min(2160 - 480 / zoom, s.player.x)) : s.camera.x;
  c.save(); c.translate(-(cx - 480) * .12, 0);
  c.strokeStyle = "#152d31dd"; c.lineWidth = 12; c.lineCap = "round";
  for (const x of [-30, 690, 1460, 2190]) { c.beginPath(); c.moveTo(x, 605); c.bezierCurveTo(x + 40, 570, x + 90, 606, x + 140, 577); c.stroke(); for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#254a43" : "#203b3b"; c.beginPath(); c.ellipse(x + k * 19, 581 + k % 3 * 5, 18, 5, -.5 + k % 2, 0, TAU); c.fill(); } }
  c.restore();
  const b = s.run.boss;
  for (const a of s.run.anchors) {
    c.save();
    const foot=a.y+26, breaking=(a.breakTime ?? 0)>0;
    if (a.hp>0) {
      c.strokeStyle="#ebc57b66"; c.setLineDash([5,7]); c.lineWidth=2; c.beginPath(); c.moveTo(a.x,a.y-45);
      c.quadraticCurveTo((a.x+(b?.x ?? 1880))/2,Math.min(a.y,b?.y ?? 548)-170,b?.x ?? 1880,(b?.y ?? 548)-115); c.stroke(); c.setLineDash([]);
    }
    c.translate(a.x + (!reduced && (a.flash ?? 0)>0 ? Math.sin(t*95)*3 : 0),foot);
    c.fillStyle="#10232177"; c.beginPath(); c.ellipse(0,1,43,7,0,0,TAU); c.fill();
    const frame=a.hp>0?3-a.hp:!reduced && breaking?((a.breakTime ?? 0)>.92?3:(a.breakTime ?? 0)>.65?4:5):5;
    if (art?.seal?.complete && art.seal.naturalWidth) {
      const cell=art.seal.naturalWidth/3, row=art.seal.naturalHeight/2, baseline=frame<3?500/512:473/512;
      if ((a.flash ?? 0)>0) c.filter="brightness(1.65)";
      c.drawImage(art.seal,frame%3*cell,Math.floor(frame/3)*row,cell,row,-72,-144*baseline,144,144); c.filter="none";
    } else {
      stone(c,-36,-18,72,18,"#667b68");
      if (a.hp>0) { stone(c,-24,-108,48,90,"#7b8473"); disc(c,0,-64,13,"#f7c773"); }
    }
    if (a.hp>0) {
      c.fillStyle="#ffe7ab"; c.textAlign="center"; c.font="bold 13px sans-serif"; c.fillText(s.run.tower?"鎖星岩晶 · 攻擊破壞":"封印岩晶",0,-149);
      if(s.run.tower) {c.strokeStyle="#c7f5d3";c.lineWidth=2;c.beginPath();c.ellipse(0,-4,49,10,0,0,TAU);c.stroke();}
      for(let i=0;i<3;i++) disc(c,(i-1)*12,-138,3.5,i<a.hp?"#fce3a0":"#4f5145");
    }
    c.restore();
  }
  for (const shard of (reduced ? s.shards.slice(0,8) : s.shards)) {
    c.save(); c.translate(shard.x,shard.y); c.rotate(reduced?0:shard.angle); c.globalAlpha=Math.min(1,shard.life*2);
    c.fillStyle=shard.amber?"#f5c363":"#7d897b"; c.strokeStyle=shard.amber?"#fff0b4":"#bbc3a0"; c.lineWidth=1.3;
    c.beginPath(); c.moveTo(-shard.size,-shard.size*.4); c.lineTo(shard.size*.3,-shard.size); c.lineTo(shard.size,shard.size*.4); c.lineTo(-shard.size*.2,shard.size*.8); c.closePath(); c.fill(); c.stroke(); c.restore();
  }

}
function sigil(c: CanvasRenderingContext2D, x: number, y: number, progress: number, active: boolean, t: number) {
  c.save(); c.translate(x, y); c.strokeStyle = active ? "#fff1bc" : "#f4a890"; c.lineWidth = active ? 5 : 2;
  disc(c, 0, 0, 47, active ? "#ffad6688" : "#ce655520");
  c.beginPath(); c.arc(0, 0, 47, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(.02, progress)); c.stroke();
  c.rotate(t * .5); c.strokeRect(-26, -26, 52, 52); c.rotate(-t * .5);
  c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.moveTo(0, -8); c.lineTo(0, 8); c.stroke();
  if (!active) { c.fillStyle = "#ffe5bd"; c.font = "bold 13px sans-serif"; c.textAlign = "center"; c.fillText("離開落印", 0, -57); }
  c.restore();
}
export function drawRuinsThreats(c: CanvasRenderingContext2D, s: KnightState, t: number, art?: RuinsArt) {
  if (s.stage !== 3) return;
  const control = s.run.terrain;
  if (control.phase !== "idle") {
    const terrain = platformsAt(3, s.time, s.run.layout, s.run.bridgeDrop, control);
    const affected = control.pattern === "rampart"
      ? rocksAt(3, control).filter((_, i) => i === 2 || i === 3)
      : terrain.filter((p, i) => i === control.target || p.lift !== undefined);
    c.save();
    for (const surface of affected) {
      const down = control.pattern === "undertow" && surface === terrain[control.target];
      c.fillStyle = control.phase === "warning" ? "#f1ac7444" : "#ffdc8a22";
      c.fillRect(surface.x - 4, surface.y - 10, surface.w + 8, 20);
      c.strokeStyle = "#f9cb87"; c.lineWidth = 3; c.setLineDash([7, 7]);
      c.strokeRect(surface.x, surface.y - 8, surface.w, 16); c.setLineDash([]);
      c.fillStyle = "#ffe4aa"; c.font = "bold 18px sans-serif"; c.textAlign = "center";
      c.fillText(down ? "↓↓ 平台下沉" : control.pattern === "rampart" ? "↑↑ 岩階隆起" : "↑↑ 逃生木台", surface.x + surface.w / 2, surface.y - 24);
      if (s.run.boss && control.phase === "warning") {
        c.strokeStyle = "#edc98d88"; c.lineWidth = 2; c.beginPath();
        c.moveTo(s.run.boss.x, s.run.boss.y - 145);
        c.quadraticCurveTo((s.run.boss.x + surface.x) / 2, surface.y - 180, surface.x + surface.w / 2, surface.y); c.stroke();
      }
    }
    c.restore();
  }
  const changing = (control.evolutionDelay ?? 0)>0 || Math.abs((control.evolutionTarget ?? 0)-(control.evolution ?? 0))>.02;
  if (changing) {
    const target = {...control,evolution:control.evolutionTarget ?? 0};
    for(const [i,rock] of rocksAt(3,target).entries()) {
      const current=rocksAt(3,control)[i]; if(Math.abs(rock.y-current.y)<5) continue;
      c.save(); c.strokeStyle="#ffe3ad"; c.lineWidth=3; c.setLineDash([8,7]); c.strokeRect(rock.x,rock.y,rock.w,548-rock.y);
      c.fillStyle="#ffce8b18"; c.fillRect(rock.x,Math.min(rock.y,current.y),rock.w,Math.abs(rock.y-current.y)); c.setLineDash([]);
      c.textAlign="center"; c.font="bold 15px sans-serif"; c.fillStyle="#ffe2af"; c.fillText(rock.y<current.y?"↑ 地層抬升":"↓ 岩壁崩降",rock.x+rock.w/2,Math.min(rock.y,current.y)-18); c.restore();
    }
  }
  if ((s.run.boss?.giant ?? 0)>0 && art?.colossus?.complete && art.colossus.naturalWidth) drawColossus(c,s,t,art);
  for (const portal of s.run.summons) {
    const deck=platformsAt(3,s.time,s.run.layout,s.run.bridgeDrop,s.run.terrain)[portal.platform];
    c.save(); c.translate(portal.x,deck.y); const pulse=1-portal.delay/1.25;
    c.fillStyle="#c5d98433"; c.beginPath(); c.ellipse(0,-3,38,12,0,0,TAU); c.fill();
    c.strokeStyle="#d0efa1"; c.lineWidth=3; c.beginPath(); c.ellipse(0,-3,38,12,0,0,TAU*pulse); c.stroke();
    c.setLineDash([4,6]); c.strokeStyle="#e3d39b99"; c.beginPath(); c.ellipse(0,-3,47,17,0,0,TAU); c.stroke(); c.setLineDash([]);
    for(let i=0;i<5;i++) { const angle=t*2+i*TAU/5; disc(c,Math.cos(angle)*23,-12-Math.sin(pulse*Math.PI)*35+i%2*8,3,"#e8dda8"); }
    c.fillStyle="#e6f2b8"; c.font="bold 15px sans-serif"; c.textAlign="center"; c.fillText("岩靈召喚",0,-65); c.restore();
  }
  for (const h of s.run.hazards) {
    if (h.kind === "flood") {
      c.save(); const active=h.delay<=0, level=h.y+(s.run.tower ? 0 : active?Math.max(0,4.2-h.life)<.3?(1-(4.2-h.life)/.3)*90:0:0);
      if (!active) {
        c.fillStyle="#ffb26525"; c.fillRect(30,h.y,2100,548-h.y); c.strokeStyle="#ffbc83"; c.lineWidth=3; c.setLineDash([15,10]);
        c.beginPath(); c.moveTo(30,h.y); c.lineTo(2130,h.y); c.stroke(); c.setLineDash([]);
        c.font="bold 20px sans-serif"; c.textAlign="center"; c.fillStyle="#ffe9b7";
        for(const x of [450,1100,1800]) c.fillText("↑ 離開低地 · 洪潮將至",x,h.y-24);
      } else {
        const glow=c.createLinearGradient(0,level,0,580); glow.addColorStop(0,"#fff0ba"); glow.addColorStop(.12,"#ffa65dbb"); glow.addColorStop(1,"#7f352aee"); c.fillStyle=glow;
        c.beginPath(); c.moveTo(30,580); for(let x=30;x<=2130;x+=14) c.lineTo(x,level+Math.sin(x*.032+t*6)*5); c.lineTo(2130,580); c.closePath(); c.fill();
        c.strokeStyle="#ffe5ad"; c.lineWidth=2; for(let x=60;x<2100;x+=105) { const drift=(t*80+x)%2100; c.beginPath(); c.moveTo(drift,490); c.lineTo(drift+45,487); c.stroke(); }
      }
      const decks=platformsAt(3,s.time,s.run.layout,s.run.bridgeDrop,control);
      c.strokeStyle="#bbf3d5"; c.lineWidth=4;
      for(const deck of decks) if(deck.y<h.y-12) { c.beginPath(); c.moveTo(deck.x+5,deck.y-4); c.lineTo(deck.x+deck.w-5,deck.y-4); c.stroke(); }
      c.restore();
    } else if (h.kind === "fist") {
      c.save(); c.translate(h.x,h.y); const impact=h.delay<=0, descend=impact?1:Math.max(0,1-h.delay/.25);
      c.fillStyle=impact?"#ffd28f99":"#fbc38b22"; c.strokeStyle="#ffd496"; c.lineWidth=3;
      c.beginPath(); c.ellipse(0,-3,87,16,0,0,TAU); c.fill(); c.stroke();
      if(!impact) { c.setLineDash([8,8]); c.strokeRect(-85,-125,170,125); c.setLineDash([]); c.fillStyle="#ffe4b0"; c.font="bold 17px sans-serif"; c.textAlign="center"; c.fillText("巨掌落點",0,-140); }
      c.translate(0,-245*(1-descend)); c.shadowColor="#f5b76c"; c.shadowBlur=impact?24:6;
      stone(c,-71,-104,142,100,"#6d8073");
      for(let i=0;i<4;i++) { stone(c,-69+i*35,-120+(i%2)*5,33,60,"#91a08b"); c.strokeStyle="#e8c78a"; c.lineWidth=2; c.beginPath(); c.moveTo(-61+i*35,-102); c.lineTo(-49+i*35,-89); c.lineTo(-55+i*35,-69); c.stroke(); }
      stone(c,-91,-76,35,60,"#7b8e7a");
      if(impact) { c.strokeStyle="#ffe2a0"; c.lineWidth=5; c.beginPath(); c.ellipse(0,-1,100+(1-h.life/.5)*45,15,0,0,TAU); c.stroke(); }
      c.restore();
    } else if (h.kind === "pillar") {
      c.save(); c.translate(h.x,h.y); const active=h.delay<=0;
      c.fillStyle=active?"#ffc985aa":"#ed996533"; c.strokeStyle="#ffd5a0"; c.lineWidth=3;
      c.beginPath(); c.ellipse(0,-3,62,12,0,0,TAU); c.fill(); c.stroke();
      if(active) {
        const height=220*Math.min(1,(.6-h.life)*12+.15); c.shadowColor="#fbc87d"; c.shadowBlur=15;
        for(let i=0;i<5;i++) { const x=(i-2)*24; stone(c,x-13,-height*(1-Math.abs(i-2)*.12),26,height*(1-Math.abs(i-2)*.12),i%2?"#d5aa77":"#7d8774"); }
      } else {
        c.setLineDash([5,8]); c.strokeRect(-62,-220,124,220); c.setLineDash([]); c.fillStyle="#ffe4b3"; c.font="bold 16px sans-serif"; c.textAlign="center"; c.fillText("地裂 · "+Math.ceil(h.delay*10)/10+"s",0,-235);
        for(let i=0;i<3;i++) { c.beginPath(); c.moveTo(-30+i*25,-8); c.lineTo(-22+i*25,-25); c.lineTo(-31+i*25,-40); c.stroke(); }
      } c.restore();
    } else if (h.kind === "sigil") sigil(c, h.x, h.y, 1 - h.delay / 1.4, h.delay <= 0, t);
    else { c.save(); c.translate(h.x, h.y); c.scale(Math.sign(h.vx), 1); c.shadowColor = "#ffbb74"; c.shadowBlur = 12; c.strokeStyle = "#ffe6a6"; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 10); c.quadraticCurveTo(18, -47, 24, 10); c.stroke(); c.strokeStyle = "#dd8b6c"; c.lineWidth = 3; c.beginPath(); c.moveTo(-32, 12); c.quadraticCurveTo(-3, -30, 10, 10); c.stroke(); c.restore(); }
  }
  const b = s.run.boss; if (!b || b.hp <= 0) return;
  if ((b.giant ?? 0)>0 && art?.colossus?.complete && art.colossus.naturalWidth) {
    return;
  }
  const support = platformsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)[b.platform ?? 0];
  c.fillStyle = "#071b2870"; c.beginPath(); c.ellipse(b.x, b.phase === "leap" ? b.targetY : b.y + 2, 108, 13, 0, 0, TAU); c.fill();
  if (b.phase === "leapWindup" || b.phase === "leap") {
    c.save(); c.strokeStyle = "#f6c879"; c.lineWidth = 3; c.setLineDash([7, 6]); c.beginPath(); c.ellipse(b.targetX, b.targetY - 3, 110, 20, 0, 0, TAU); c.stroke();
    if (b.phase === "leapWindup") { c.globalAlpha = .5; c.beginPath(); c.moveTo(b.x, b.y - 35); c.quadraticCurveTo((b.x + b.targetX) / 2, Math.min(b.y, b.targetY) - 155, b.targetX, b.targetY - 10); c.stroke(); }
    c.setLineDash([]); c.globalAlpha = 1; c.fillStyle = "#ffe5b0"; c.textAlign = "center"; c.font = "bold 14px sans-serif"; c.fillText("躍擊落點 · 換層反擊", b.targetX, b.targetY - 33); c.restore();
  }
  if (b.phase === "windup") {
    if (b.attack === "sigil") sigil(c, b.targetX, b.targetY, 1 - b.timer / GUARDIAN_PHASES[b.tier ?? 0].windup, false, t);
    else { c.save(); c.setLineDash([12, 9]); c.strokeStyle = "#f1b280aa"; c.lineWidth = 3; c.beginPath(); c.moveTo(support.x, support.y - 11); c.lineTo(support.x + support.w, support.y - 11); c.stroke(); c.restore(); c.font = "bold 14px sans-serif"; c.fillStyle = "#ffe9ac"; c.textAlign = "center"; c.fillText("↑ 換層避開共鳴震擊", b.x, b.y - 153);
      const platform = platformsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)[b.resonance ?? -1];
      if (platform && (b.resonance ?? 0) > 0) { c.fillStyle = "#ef8f6977"; c.fillRect(platform.x, platform.y - 5, platform.w, 10); c.fillStyle = "#ffe2a8"; c.fillText("此平台即將震擊", platform.x + platform.w / 2, platform.y - 35); } }
  }
  c.save(); c.translate(b.x, b.y); c.scale(GUARDIAN_BODY.drawScale, GUARDIAN_BODY.drawScale);
  const tier=b.tier ?? 0;
  if (b.phase === "awaken") { const pulse=1+Math.sin(t*22)*.025; c.scale(pulse,pulse); }
  if (b.phase === "ritual") {
    // The stone shell separates around a suspended core while channeling its arena attack.
    c.translate(0,-10-Math.sin(t*3)*3);
    c.save(); c.translate(0,-80); c.rotate(t*.5); c.strokeStyle=tier===2?"#ffbd8f":"#edda9c"; c.lineWidth=1.5;
    c.beginPath(); c.ellipse(0,0,105,74,0,0,TAU); c.stroke();
    for(let i=0;i<6;i++) { const a=i*TAU/6; c.save(); c.translate(Math.cos(a)*100,Math.sin(a)*74); c.rotate(a); stone(c,-9,-6,18,12,"#859282"); c.restore(); }
    c.restore();
  }
  const stride = b.walking ? Math.sin(t * 10) * 7 : 0;
  if (b.phase === "leapWindup") c.scale(1.08, .88);
  else if (b.phase === "leap") c.rotate((b.facing ?? 1) * .12);
  else c.translate(0, -Math.abs(stride) * .45);
  const hasArt = art?.guardian?.complete && art.guardian.naturalWidth;
  if (hasArt) {
    const frame = b.phase === "leap" ? 4 : b.phase === "leapWindup" || b.phase === "windup" || b.phase === "reshape" || b.phase === "summon" || b.phase === "awaken" || b.phase === "ritual" ? 3 : b.walking ? 1 + Math.floor(t * 5) % 2 : (b.landingTime ?? 0) > 0 ? 5 : 0;
    const baseline = [474,476,480,990,930,1000][frame];
    const sourceY = frame === 4 ? 485 : Math.floor(frame/3)*512;
    c.save(); c.scale(-(b.facing ?? -1), 1); if (b.flash > 0) c.filter = "brightness(1.7)";
    c.drawImage(art!.guardian!, frame%3*512, sourceY, 512, frame<3?480:1024-sourceY, -82, -(baseline-sourceY)*.32, 164, (frame<3?480:1024-sourceY)*.32); c.restore();
  } else {
  disc(c, 0, -46, 65, "#eac6850b");
  const body = b.flash > 0 ? "#f9e6ba" : b.phase === "windup" ? "#a18b71" : "#818d7b";
  stone(c, -49, -86, 98, 69, body); stone(c, -35, -112, 70, 42, body);
  stone(c, -60, -68 + stride, 22, 48, "#67796c"); stone(c, 38, -68 - stride, 22, 48, "#67796c");
  stone(c, -37 - stride, -22, 28, 22, "#5c7167"); stone(c, 9 + stride, -22, 28, 22, "#5c7167");
  // Moss, cracked brow and a exposed amber core make the rest state readable.
  c.strokeStyle = "#c3c994"; c.lineWidth = 4; c.beginPath(); c.moveTo(-33, -109); c.lineTo(-15, -114); c.lineTo(-7, -105); c.moveTo(23, -105); c.lineTo(34, -108); c.stroke();
  c.strokeStyle = "#4a5a50"; c.lineWidth = 2; c.beginPath(); c.moveTo(6, -110); c.lineTo(1, -94); c.lineTo(9, -87); c.stroke();
  disc(c, -16 + (b.facing ?? 0) * 3, -91, 3.5, "#ffe4a4"); disc(c, 17 + (b.facing ?? 0) * 3, -91, 3.5, "#ffe4a4");
  }
  if (tier>0) {
    const color=tier===1?"#ffd57b":"#ff9c70";
    c.strokeStyle=color; c.lineWidth=tier===1?1.5:2.2; c.shadowColor=color; c.shadowBlur=7;
    for(const side of [-1,1]) { c.beginPath(); c.moveTo(side*13,-88); c.lineTo(side*29,-72); c.lineTo(side*24,-56); c.lineTo(side*40,-39); c.stroke(); }
    disc(c,-15,-59,7+Math.sin(t*7),color); c.shadowBlur=0;
    for(let i=0;i<tier*5;i++) { const age=(t*.55+i*.19)%1; disc(c,Math.sin(i*17)*50,-20-age*100,2*(1-age),color); }
  }
  if ((b.exposed ?? 0)>0) { c.save(); c.strokeStyle="#b9f9e0"; c.lineWidth=2; c.setLineDash([4,5]); c.beginPath(); c.arc(0,-65,32+Math.sin(t*6)*3,0,TAU); c.stroke(); c.restore(); }
  const sealed = s.run.anchors.some(a => a.hp > 0);
  const pulse = !sealed && b.phase === "rest" ? 17 + Math.sin(t * 5) * 1.5 : 12;
  if (!hasArt) { c.shadowColor = "#ffdc89"; c.shadowBlur = b.phase === "rest" ? 20 : 4; disc(c, 0, -53, pulse, "#efd39a"); c.shadowBlur = 0; }
  else if (sealed) { c.strokeStyle = "#ecd7a880"; c.lineWidth = 2; c.setLineDash([8,5]); c.beginPath(); c.ellipse(0,-72,83,82,0,0,TAU); c.stroke(); c.setLineDash([]); }
  c.fillStyle = "#f3dfaf"; c.font = "bold 11px sans-serif"; c.textAlign = "center"; c.fillText(b.phase === "awaken" ? GUARDIAN_PHASES[tier].name+" · 地層重構" : b.phase === "ritual" ? tier===2?"崩星洪潮 · 登高避難":"連鎖地裂 · 換台閃避" : (b.exposed ?? 0)>0 ? "星核過載 · 破綻 ×2" : b.phase === "summon" ? "呼喚岩靈" : sealed ? "封印護甲・先破岩頂晶核" : b.phase === "rest" ? "核心暴露 ×1.5" : b.phase === "leap" ? "躍擊中" : b.phase === "reshape" ? "重塑地形" : "蓄力中", 0, -160);
  c.restore();
}


function drawColossus(c: CanvasRenderingContext2D, s: KnightState, t: number, art: RuinsArt) {
  const b=s.run.boss!, growth=b.giant ?? 0, img=art.colossus!;
  const width=344+656*growth, height=310+430*growth;
  const palms=s.run.hazards.some(h=>h.kind==="fist" && h.delay<=0);
  const frame=(b.exposed ?? 0)>0?3:palms?2:b.phase==="ritual" || b.phase==="awaken"?1:0;
  const baseline=frame<2?508:478, cw=img.naturalWidth/2, ch=img.naturalHeight/2;
  c.save(); c.translate(b.x,b.y); c.fillStyle="#0a1b2599"; c.beginPath(); c.ellipse(0,0,200,17,0,0,TAU); c.fill();
  const protectedCore=!!s.run.tower && s.run.anchors.some(a=>a.hp>0);
  if(protectedCore) c.globalAlpha=.72;
  if(b.flash>0) c.filter="brightness(1.55)";
  c.drawImage(img,frame%2*cw,Math.floor(frame/2)*ch,cw,ch,-width/2,-height*baseline/512,width,height); c.filter="none";c.globalAlpha=1;
  // Amber joints orbit subtly; the marked palms alone deal arm-contact damage.
  c.strokeStyle="#e8ce9266"; c.lineWidth=2; c.beginPath(); c.ellipse(0,-height*.49,width*.44,height*.25,t*.025,0,TAU); c.stroke();
  if((b.exposed ?? 0)>0) { c.strokeStyle="#c1ffe1"; c.lineWidth=4; c.setLineDash([8,7]); c.beginPath(); c.arc(0,-height*.48,54+Math.sin(t*6)*3,0,TAU); c.stroke(); c.setLineDash([]); }
  c.fillStyle="#ffedbd"; c.font="bold 22px sans-serif"; c.textAlign="center";
  c.fillText(b.phase==="ritual"?"崩星洪潮 · 登高避難":(b.exposed ?? 0)>0?"星核過載 · 傷害 ×2":b.phase==="awaken"?"星骸巨像 · 甦醒":protectedCore?"鎖星護甲 · 先拆岩晶":"星骸巨像",0,-height*.95-20);
  c.restore();
  // Routes in front of the enormous body must remain readable and match collision.
  const terrain=platformsAt(3,s.time,s.run.layout,s.run.bridgeDrop,s.run.terrain);
  for(const [index,p] of terrain.entries()) { if(p.rock!==undefined || (s.run.tower ? Math.abs(p.y-b.y)>850 : ![8,9,10].includes(index))) continue; ruinsPlatform(c,p.x,p.y,p.w,index,art,p.lift,!!s.run.tower); }
  const rock=rocksAt(3,s.run.terrain)[3];
  if(art.rocks?.complete && art.rocks.naturalWidth) c.drawImage(art.rocks,40,45,440,449,rock.x-3,rock.y-8,rock.w+6,rock.h+8);
  c.strokeStyle="#e4d391"; c.lineWidth=3; c.beginPath(); c.moveTo(rock.x,rock.y); c.lineTo(rock.x+rock.w,rock.y); c.stroke();
}

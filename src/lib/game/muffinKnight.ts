/** Deterministic fixed-step arcade simulation. Coordinates are foot anchors. */
export const WORLD = { width: 960, height: 600, gravity: 1500, target: 15 };
export const arenaWidth = (stage: number) => stage === 3 ? 2160 : WORLD.width;
export const RUINS_ZOOM = { explore: .65, boss: .56 };
export const GUARDIAN_BODY = { halfWidth: 88, height: 210, drawScale: 2.1 };
export const GUARDIAN_PHASES = [
  { name: "I · 守岩", recovery: 1.8, windup: 1.1, walk: 190, terrain: 8.5, summon: 0 },
  { name: "II · 崩解", recovery: 1.3, windup: .9, walk: 225, terrain: 7.6, summon: 10 },
  { name: "III · 星骸巨像", recovery: .95, windup: .72, walk: 265, terrain: 6.8, summon: 8 },
] as const;
export const guardianTier = (boss: { hp: number; maxHp: number }): number => boss.hp / boss.maxHp > .66 ? 0 : boss.hp / boss.maxHp > .33 ? 1 : 2;
export type TerrainControl = { tower?: boolean; phase: "idle" | "warning" | "moving" | "hold" | "return"; pattern: "rampart" | "undertow"; timer: number; amount: number; target: number; cycle: number; evolution?: number; evolutionTarget?: number; evolutionDelay?: number };
export const BURGER_IMAGE = "/images/muffin-knight/hamburger.png";
export const BEASTS = [
  { id: "naotaro", name: "黃金獵犬", skill: "暖陽連射", hint: "快速直線射擊。保持距離，連續壓制。", color: "#eab759", speed: 280, jump: 670, cooldown: .23, crop: [52, 90, 500, 414] },
  { id: "frog", name: "青蛙", skill: "吞吐水砲", hint: "J 水砲；C 吞下前方普通怪或殘血強敵，再按 C 吐出穿透彈。", color: "#9dbf7b", speed: 260, jump: 760, cooldown: .48, crop: [73, 73, 359, 375] },
  { id: "chicken", name: "公雞", skill: "羽毛散射", hint: "空中二段跳，三向羽毛一次清場。", color: "#e5bd7b", speed: 290, jump: 665, cooldown: .38, crop: [0, 0, 512, 512] },
  { id: "raccoon", name: "浣熊", skill: "蹬牆突襲", hint: "朝牆推住吸附，空白鍵蹬牆；J／Shift 衝刺。進階後蹬牆蓄勢破甲，第三次升級解鎖全隊接力。", color: "#b5a799", speed: 315, jump: 700, cooldown: .6, crop: [0, 0, 512, 512] },
  { id: "seal", name: "魯魯", skill: "環形水波", hint: "八方向泡泡，適合被包圍時反擊。", color: "#7ebfc9", speed: 245, jump: 670, cooldown: .62, crop: [48, 18, 732, 374] },
  { id: "snake", name: "蛇", skill: "穿透毒牙", hint: "毒牙能穿透三個敵人，排成一線再出手。", color: "#acbf74", speed: 285, jump: 675, cooldown: .42, crop: [0, 0, 512, 512] },
  { id: "ostrich", name: "鴕鳥", skill: "疾風踢", hint: "移動速度最快，向前踢出寬幅風刃。", color: "#c4a98a", speed: 335, jump: 695, cooldown: .5, crop: [0, 0, 512, 512] },
] as const;
export const beastImage = (id: string) => id === "frog" ? "/assets/pet-sanctuary/characters/frog/portrait.png" : `/images/muffin-knight/sprites/${id}.png`;
export type Platform = { x: number; y: number; w: number; rock?: number; wood?: boolean; oneWay?: boolean; lift?: number };
export type RockMass = { x: number; y: number; w: number; h: number; skin: number };
export const RUINS_ROCKS: readonly RockMass[] = [
  { x: 440, y: 448, w: 130, h: 100, skin: 0 },
  { x: 850, y: 218, w: 140, h: 330, skin: 1 },
  { x: 1230, y: 463, w: 80, h: 85, skin: 2 },
  { x: 1550, y: 268, w: 130, h: 280, skin: 0 },
  { x: 2040, y: 438, w: 90, h: 110, skin: 4 },
];
/** A continuous ascent: 120-unit steps, two open lift shafts and broad combat landings. */
export const TOWER_PLATFORMS: readonly Platform[] = [
  {x:30,y:548,w:2100},{x:260,y:428,w:380},{x:540,y:308,w:380},
  {x:860,y:188,w:260,lift:0},{x:1100,y:68,w:410},{x:1430,y:-52,w:400},
  {x:1150,y:-172,w:400},{x:850,y:-292,w:400},{x:550,y:-412,w:400},
  {x:280,y:-532,w:290,lift:1},{x:140,y:-652,w:440},{x:470,y:-772,w:410},
  {x:790,y:-892,w:420},{x:1110,y:-1012,w:420},{x:1430,y:-1132,w:450},
  {x:1160,y:-1252,w:430},{x:830,y:-1372,w:440},{x:1740,y:-1372,w:370},
  {x:1140,y:-1492,w:710},{x:1740,y:188,w:300},{x:1770,y:-412,w:300},
  {x:120,y:-172,w:330},{x:560,y:-1132,w:300},{x:290,y:-1012,w:320},
];
export const TOWER_LIFTS = [{platform:3,top:188,bottom:308,period:5.2},{platform:9,top:-532,bottom:-412,period:4.8}] as const;
export const TOWER_CHECKPOINTS = [0,5,10,14,16] as const;
const TOWER_ROCKS: readonly RockMass[] = [
  {x:70,y:308,w:140,h:240,skin:0},{x:1900,y:-172,w:150,h:360,skin:1},
  {x:30,y:-652,w:100,h:340,skin:2},{x:1980,y:-1372,w:120,h:360,skin:0},
  {x:1660,y:-1492,w:100,h:160,skin:4},
];
export const rocksAt = (stage: number, control?: TerrainControl): readonly RockMass[] => stage === 3 && control?.tower ? TOWER_ROCKS.map((r,i)=>{const rise=control.pattern==="rampart" && (i===2 || i===3) ? control.amount*80 : 0;return {...r,y:r.y-rise,h:r.h+rise};}) : stage === 3 ? RUINS_ROCKS.map((rock, index) => {
  const evolution = control?.evolution ?? 0, second = Math.min(1, evolution), third = Math.max(0, evolution - 1);
  const permanent = [0, -90, 160, -45, 150][index] * second + [40, -40, 50, 50, 40][index] * third;
  const rise = permanent + (control?.pattern === "rampart" && (index === 2 || index === 3) ? control.amount * (index === 2 ? 110 : 80) : 0);
  return { ...rock, y: rock.y - rise, h: rock.h + rise };
}) : [];

export const STAGES = [
  { name: "暖陽小森林", mechanic: "彈簧練習・固定難度", rule: "踩彈簧練習跳上高台；怪物不強化，最多同時 3 隻。", subtitle: "練習移動與變身，收集漢堡也不會加快出怪。", tag: "01 / FOREST", sky: "#e8efe3", hill: "#cfddc9", leaf: "#8da78a", wood: "#aa8968", platforms: [{ x: 30, y: 548, w: 410 }, { x: 110, y: 438, w: 235 }, { x: 610, y: 438, w: 235 }, { x: 370, y: 328, w: 220 }, { x: 80, y: 218, w: 225 }, { x: 655, y: 218, w: 225 }, { x: 520, y: 548, w: 410 }] },
  { name: "午後屋頂", mechanic: "雙向傳送門", rule: "金色與藍色門互通，玩家和怪物都能穿越。", subtitle: "從低處瞬移至對側高台，留意追進門的怪物。", tag: "02 / ROOFTOP", sky: "#f3e8dc", hill: "#e1cbb9", leaf: "#b88c77", wood: "#b18c78", platforms: [{ x: 30, y: 548, w: 380 }, { x: 550, y: 548, w: 380 }, { x: 55, y: 438, w: 230 }, { x: 675, y: 438, w: 230 }, { x: 340, y: 348, w: 280 }, { x: 135, y: 238, w: 240 }, { x: 585, y: 238, w: 240 }] },
  { name: "月光池畔", mechanic: "移動高台", rule: "橫移木橋與升降高台會載著角色、怪物及漢堡移動。", subtitle: "抓準交會時機換台，別在橋離開時跳進水裡。", tag: "03 / MOONLIGHT", sky: "#dce5ed", hill: "#bfcedb", leaf: "#8095ad", wood: "#8e8eaa", platforms: [{ x: 30, y: 548, w: 370 }, { x: 560, y: 548, w: 370 }, { x: 335, y: 438, w: 290 }, { x: 55, y: 328, w: 235 }, { x: 670, y: 328, w: 235 }, { x: 365, y: 218, w: 230 }] },
  { name: "星火遺跡", mechanic: "遺跡交戰・終局天階追擊", rule: "收集漢堡迎戰岩衛；最後階段戰場崩升成天階，向上破除鎖星岩晶，再擊敗巨像。", subtitle: "前兩階段在遺跡周旋；巨像甦醒後向上攀登，營火存點接續挑戰。", tag: "04 / EMBER RUINS", sky: "#192537", hill: "#303d4b", leaf: "#a5b29a", wood: "#796e6c", platforms: [{ x: 30, y: 548, w: 2100 }, { x: 90, y: 438, w: 300 }, { x: 80, y: 298, w: 310 }, { x: 625, y: 470, w: 170 }, { x: 620, y: 128, w: 200 }, { x: 1040, y: 470, w: 150 }, { x: 1030, y: 158, w: 180 }, { x: 1350, y: 478, w: 150 }, { x: 1740, y: 328, w: 270 }, { x: 1350, y: 188, w: 170 }, { x: 1790, y: 218, w: 220 }] },
] as const;
export const BLESSINGS = {
  spark: { name: "獵犬・逐星撲躍", mark: "ϟ", tag: "黃金獵犬 / 追擊", text: "C 撲向前方敵人，命中反彈躍高並重置撲躍；沒命中則每次滯空限一次。保留二段翻滾與連鎖星彈。", combo: "跳躍 → C 借敵反彈 → 翻滾越過震波 → 接力落台。" },
  echo: { name: "蛇・盤身彈射", mark: "↔", tag: "蛇 / 封路", text: "按住 C 盤身蓄力，放開向上彈射；配合方向斜飛，滿蓄短暫無敵並向上射毒牙。原毒牙保留穿透與反彈。", combo: "空中蓄力減速 → 放開越層 → 毒牙清開頭頂 → 接力轉向。" },
  feather: { name: "公雞・振翅羽陣", mark: "↑", tag: "公雞 / 空戰", text: "公雞可三段跳；每次空中起跳，向左右各灑出兩枚羽毛。", combo: "跳躍本身就是攻擊，連接羽刃接招維持制空。" },
  haste: { name: "鴕鳥・長腳跨岩", mark: "»", tag: "鴕鳥 / 助跑", text: "貼近岩壁再按跳躍，用長腳蹬上岩頂，每次滯空限一次。踢擊冷卻 -28%，助跑時追加風刃。", combo: "朝岩頂跨越，落地後奔跑接雙踢；與浣熊的反向蹬牆不同。" },
  hunger: { name: "青蛙・大口吞吐", mark: "◉", tag: "青蛙 / 吞吐", text: "可直接吞下滿血強化怪，吐出的怪物彈 +2 傷害；巨型怪仍需削弱。", combo: "先存一顆怪物彈，再用接力重砲打穿守衛。" },
  shell: { name: "魯魯・踏浪泡跳", mark: "◇", tag: "魯魯 / 護援", text: "C 放出持續 4 秒的浪泡，落在泡上會彈高，爆泡傷敵並清震波；每次滯空限一顆。保留雙按方向翻滾與護盾。", combo: "翻滾離開危險 → 空中放泡 → 踩泡彈高 → 接力跨層。" },
  blood: { name: "浣熊・蹬牆獵手", mark: "✦", tag: "浣熊 / 反擊", text: "蹬牆立即蓄勢；蓄勢衝刺再加 1 傷害。衝刺擊倒敵人會完全重置冷卻。", combo: "蹬牆 → 破甲 → 擊倒 → 再衝刺，操作決定續航。" },
  nova: { name: "青蛙・落水震盪", mark: "◎", tag: "青蛙 / 落地", text: "青蛙高速落地時，向兩側濺出四發水砲，每秒最多一次。", combo: "先跳上高台吞怪，再下落濺射並吐出重砲。" },
} as const;
export const BLESSING_BEASTS: Record<keyof typeof BLESSINGS, readonly number[]> = {
  spark: [0], echo: [5], feather: [2], haste: [6], hunger: [1], shell: [4], blood: [3], nova: [1],
};
export type Blessing = keyof typeof BLESSINGS;
export type Hazard = { x: number; y: number; vx: number; life: number; delay: number; kind: "wave" | "sigil" | "pillar" | "flood" | "fist"; warning?: number; platform?: number; minX?: number; maxX?: number };
export type Guardian = { x: number; y: number; hp: number; maxHp: number; timer: number; phase: "windup" | "rest" | "leapWindup" | "leap" | "reshape" | "awaken" | "summon" | "ritual"; giant?: number; ritualCooldown?: number; exposed?: number; tier?: number; pendingAwaken?: boolean; summonCooldown?: number; terrainCooldown?: number; landingTime?: number; campTime?: number; watchX?: number; blocked?: boolean; attack?: "waves" | "sigil"; move: number; flash: number; targetX: number; targetY: number; resonance?: number; platform?: number; fromX?: number; fromY?: number; facing?: number; walking?: boolean; arcHeight?: number };
/** Torso bounds receive attacks. In the tower finale only marked attacks, not the backdrop body, hurt the player. */
export function guardianBody(b: Guardian) { const growth = b.giant ?? 0; return {halfWidth:88+growth*62,height:210+growth*370,drawScale:2.1+growth*3}; }
export const SPRINGS = [{ x: 400, y: 548, power: 1060 }, { x: 730, y: 438, power: 920 }] as const;
export const PORTALS = [{ x: 355, y: 548, facing: -1, color: "#f3c574" }, { x: 770, y: 238, facing: -1, color: "#8ee3ed" }] as const;
/** Clear shafts: movement never intersects a rock or the deck above it. */
export const RUINS_LIFTS = [
  { platform: 3, top: 248, bottom: 470, period: 6.4 },
  { platform: 5, top: 278, bottom: 470, period: 5.6 },
  { platform: 7, top: 328, bottom: 478, period: 5.0 },
] as const;
/** Shared by simulation and drawing, including reduced-motion mode. */
export function platformsAt(stage: number, time: number, layout = 0, bridgeDrop = 0, control?: TerrainControl): Platform[] {
  if (stage === 3 && control?.tower) {
    const decks = TOWER_PLATFORMS.map((p,index) => {
      const lift = p.lift === undefined ? undefined : TOWER_LIFTS[p.lift];
      const y = lift ? lift.bottom - (1-Math.cos(time*Math.PI*2/lift.period+layout*2*Math.PI/3))/2*(lift.bottom-lift.top) : p.y;
      // Only the threatened deck moves. Adjacent routes retain their reachable spacing.
      const sinking = control.pattern === "undertow" && index === control.target ? 72*control.amount : 0;
      return {...p, y:y+sinking, oneWay:index>0, wood:!!lift};
    });
    return decks.concat(rocksAt(stage,control).map((r,rock)=>({x:r.x,y:r.y,w:r.w,rock,oneWay:false,wood:false})));
  }
  const platforms: Platform[] = STAGES[stage].platforms.map((p, i) => {
    const lift = stage === 3 ? RUINS_LIFTS.findIndex(l => l.platform === i) : -1;
    const track = RUINS_LIFTS[lift];
    return { ...p, oneWay: p.y < 548, wood: stage === 3 ? lift >= 0 : p.y < 548, ...(track ? { lift } : {}),
      x: p.x + (stage === 2 && i === 2 ? Math.sin(time * .7) * 150 : 0),
      y: track ? track.bottom - (1 - Math.cos(time * Math.PI * 2 / track.period + layout * Math.PI * 2 / 3)) / 2 * (track.bottom - track.top)
        : p.y + (stage === 3 && i === 10 ? bridgeDrop : 0) + (stage === 2 && i === 5 ? (1 - Math.cos(time * .85)) * 55 : 0),
    };
  });
  if (stage === 3 && (control?.evolution ?? 0) > 0) {
    const second = Math.min(1, control!.evolution!), third = Math.max(0, control!.evolution! - 1);
    const firstShift = [0,-70,-50,0,0,0,60,0,50,-20,-90];
    const finalShift = [0,-60,-40,0,0,0,-60,0,-100,-60,-120];
    for (const [i, deck] of platforms.entries()) {
      if (deck.lift !== undefined) {
        // Raising the bottom stops leaves a continuous route above the late-phase flood.
        const top = RUINS_LIFTS[deck.lift].top;
        const raised = Math.min(deck.y, 420 - third * 10);
        deck.y += (Math.max(top, raised) - deck.y) * second;
      } else deck.y += firstShift[i] * second + finalShift[i] * third;
    }
  }
  if (stage === 3 && control?.pattern === "undertow" && control.amount > 0) {
    for (const [index, deck] of platforms.entries()) {
      if (index === control.target && deck.oneWay) deck.y += (Math.min(458, deck.y + 125) - deck.y) * control.amount;
      else if (deck.lift !== undefined) deck.y += (RUINS_LIFTS[deck.lift].top - deck.y) * control.amount;
    }
  }
  return platforms.concat(rocksAt(stage, control).map((r, rock) => ({ x: r.x, y: r.y, w: r.w, rock })));
}
type TerrainBody = { x: number; y: number; vx: number; vy: number; portalTime?: number; springTime?: number; boosted?: boolean; summoned?: boolean };
export type Input = { left: boolean; right: boolean; jump: boolean; attack: boolean; special?: boolean; dash?: boolean; down?: boolean };
export type StoneShard = { x: number; y: number; vx: number; vy: number; angle: number; spin: number; size: number; life: number; amber: boolean; bounced: boolean };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
export type Enemy = { id: number; x: number; y: number; vx: number; vy: number; angry: boolean; hp: number; level?: number; rushIn?: number; windup?: number; rush?: number; flash?: number; portalTime?: number; springTime?: number; boosted?: boolean; summoned?: boolean };
export type Shot = { x: number; y: number; vx: number; vy: number; life: number; kind: number; r: number; pierce: number; hit: number[]; damage?: number; cargo?: number; bounces?: number };
export type KnightEvent = { type: "jump" | "land" | "attack" | "hit" | "hurt" | "collect" | "win" | "lose" | "spring" | "portal" | "grow" | "swallow" | "spit" | "boon" | "boss" | "shield" | "wall" | "relay" | "finisher" | "roll" | "stride" | "drop" | "sealHit" | "sealBreak" | "enrage" | "summon"; x: number; y: number; beast: number; power: number };
export type Ring = { x: number; y: number; age: number; duration: number; radius: number; color: string };
export type Floater = { x: number; y: number; text: string; life: number; color: string };
export type KnightState = {
  phase: "ready" | "playing" | "paused" | "draft" | "won" | "lost";
  camera: { x: number; y: number; zoom: number; reveal: number };
  mobility: { coilCharge: number; coilActive: boolean; coilUsed: boolean; pounceTime: number; pounceUsed: boolean; bubbleUsed: boolean; sealRollTime: number; sealRollCooldown: number; sealRollDir: number; pressDirection: number; previousDirection: number; tapDir: number; tapTime: number; strideTime: number; strideUsed: boolean; strideDir: number; wall: number; wallGrace: number; grip: number; kickLock: number; momentum: number; dashCooldown: number; dashAirUsed: boolean; dashBuffer: number; dashHeld: boolean; charged: boolean; relayTime: number; assist: number; refund: boolean; finisher: number };
  stomach: number | null; specialCooldown: number; specialBuffer: number; specialHeld: boolean; tongue: { x: number; y: number; life: number } | null;
  run: { finalAscent?: boolean; tower?: { highestY: number; checkpoint: number }; bubble?: {x: number; y: number; life: number}; summons: { x: number; platform: number; delay: number; level: number }[]; terrain: TerrainControl; affinityMisses: number; practice: boolean; practiceTier?: number; bridgeDrop: number; anchors: { id: number; x: number; y: number; hp: number; flash?: number; breakTime?: number }[]; nextBeast: number; formRng: number; drought: number[]; seed: number; rng: number; layout: number; perks: Blessing[]; offer: Blessing[]; drafts: number; shield: number; novaCooldown: number; omenIn: number; hazards: Hazard[]; boss: Guardian | null; bossDefeated: boolean };
  stage: number; time: number; fxTime: number; muffins: number; score: number; kills: number; hearts: number; beast: number;
  player: { dropPlatform: number; dropBuffer: number; dropHeld: boolean; dropTime: number; rollTime: number; rollFacing: number; x: number; y: number; vx: number; vy: number; facing: number; grounded: boolean; jumps: number; invulnerable: number; dash: number; coyote: number; jumpBuffer: number; jumpTime: number; landTime: number; attackTime: number; hurtTime: number; dashHits: number[]; portalTime: number; springTime: number; boosted: boolean };
  shards: StoneShard[]; muffin: { x: number; y: number; platform: number }; enemies: Enemy[]; shots: Shot[]; particles: Particle[]; rings: Ring[]; floaters: Floater[]; events: KnightEvent[];
  attackCooldown: number; attackBuffer: number; attackHeld: boolean; spawnIn: number; nextId: number; jumpHeld: boolean; notice: string; noticeTime: number; flash: number; shake: number; hitStop: number; transform: number; combo: number; comboTime: number; bestCombo: number;
};
export function createKnightState(stage = 0, seed = Math.floor(Math.random() * 0xffffffff)): KnightState {
  stage = Math.max(0, Math.min(STAGES.length - 1, Math.floor(stage) || 0));
  return { phase: "ready", stage,
    camera: { x: stage === 3 ? 480 / RUINS_ZOOM.explore : 480, y: stage === 3 ? 548 - 238 / RUINS_ZOOM.explore : 300, zoom: stage === 3 ? RUINS_ZOOM.explore : 1, reveal: 0 },
    mobility: { coilCharge: 0, coilActive: false, coilUsed: false, pounceTime: 0, pounceUsed: false, bubbleUsed: false, sealRollTime: 0, sealRollCooldown: 0, sealRollDir: 1, pressDirection: 0, previousDirection: 0, tapDir: 0, tapTime: 0, strideTime: 0, strideUsed: false, strideDir: 1, wall: 0, wallGrace: 0, grip: 0, kickLock: 0, momentum: 0, dashCooldown: 0, dashAirUsed: false, dashBuffer: 0, dashHeld: false, charged: false, relayTime: 0, assist: 0, refund: false, finisher: 0 },
    stomach: null, specialCooldown: 0, specialBuffer: 0, specialHeld: false, tongue: null,
    run: { summons: [], terrain: { phase: "idle", pattern: "rampart", timer: 0, amount: 0, target: 8, cycle: 0 }, affinityMisses: 0, practice: false, bridgeDrop: 0, anchors: [], nextBeast: stage === 3 ? 4 : 1, formRng: (seed ^ 0x9e3779b9) >>> 0, drought: BEASTS.map(() => 0), seed: seed >>> 0, rng: seed >>> 0, layout: (seed >>> 0) % 3, perks: [], offer: [], drafts: 0, shield: 0, novaCooldown: 0, omenIn: 8, hazards: [], boss: null, bossDefeated: false }, time: 0, fxTime: 0, muffins: 0, score: 0, kills: 0, hearts: 3, beast: stage === 3 ? 3 : 0,
    player: { dropPlatform: -1, dropBuffer: 0, dropHeld: false, dropTime: 0, rollTime: 0, rollFacing: 1, x: 160, y: 548, vx: 0, vy: 0, facing: 1, grounded: true, jumps: 0, invulnerable: 0, dash: 0, coyote: .11, jumpBuffer: 0, jumpTime: 0, landTime: 0, attackTime: 0, hurtTime: 0, dashHits: [], portalTime: 0, springTime: 0, boosted: false },
    shards: [], muffin: { x: stage === 1 ? 265 : 325, y: 522, platform: 0 }, enemies: [], shots: [], particles: [], rings: [], floaters: [], events: [], attackCooldown: 0, attackBuffer: 0, attackHeld: false, spawnIn: stage === 0 ? 6 : 3.2, nextId: 0, jumpHeld: false, notice: "收集 15 個漢堡，抽選下一位小日獸。", noticeTime: 3, flash: 0, shake: 0, hitStop: 0, transform: 0, combo: 0, comboTime: 0, bestCombo: 0 };
}
/** The first two boss phases use the original ruins. Only the finale unfolds the vertical tower. */
export function createKnightRun(stage = 0, seed?: number): KnightState {
  const s=createKnightState(stage,seed); s.run.finalAscent=s.stage===3; return s;
}
const towerFoodPlatform = (count: number) => count <= 12 ? 5 : count === 13 ? 10 : 18;
function activateFinalAscent(s: KnightState) {
  if(s.run.tower || !s.run.boss || s.run.boss.hp<=0) return;
  s.run.tower={highestY:548,checkpoint:0};
  s.run.terrain={...s.run.terrain,tower:true,phase:"idle",amount:0,evolution:2,evolutionTarget:2,evolutionDelay:0};
  s.run.anchors=[5,10,14].map((index,i)=>({id:-20-i,x:TOWER_PLATFORMS[index].x+TOWER_PLATFORMS[index].w-65,y:TOWER_PLATFORMS[index].y-26,hp:3}));
  s.run.bridgeDrop=0;s.run.hazards=[];s.run.summons=[];s.enemies=[];s.shots=[];delete s.run.bubble;
  const p=s.player;Object.assign(p,{x:430,y:548,vx:0,vy:0,grounded:true,jumps:0,invulnerable:3,dash:0,dropPlatform:-1,dropTime:0,rollTime:0,boosted:false});
  Object.assign(s.mobility,{coilActive:false,coilCharge:0,pounceTime:0,sealRollTime:0,strideTime:0,kickLock:0,wall:0,wallGrace:0});
  const index=towerFoodPlatform(s.muffins),deck=TOWER_PLATFORMS[index];s.muffin={x:deck.x+deck.w/2,y:deck.y-26,platform:index};
  Object.assign(s.run.boss,{x:1660,y:548,platform:0,phase:"awaken",timer:1.5,giant:1,ritualCooldown:3,summonCooldown:4,terrainCooldown:5});
  s.camera.x=480/s.camera.zoom;s.camera.y=548-150/s.camera.zoom;s.camera.reveal=1.4;s.shake=10;
  s.notice="終局・天階崩升！向上打破三枚鎖星岩晶，解除巨像護甲";s.noticeTime=5;emit(s,"enrage",1660,548,2);
}
export const hasBlessing = (s: KnightState, id: Blessing) => s.stage === 3 && s.run.perks.includes(id);
export function beastWeights(s: KnightState) {
  return BEASTS.map((_, beast) => 1 + (s.stage === 3 ? s.run.perks.reduce((weight, id) => weight + (BLESSING_BEASTS[id].includes(beast) ? 9 : 0), 0) : 0));
}
/** This is the actual pool for the next draw, including the selected-beast guarantee. */
export function beastChances(s: KnightState) {
  const weights = beastWeights(s);
  const missing = s.run.drought.findIndex((count, i) => count >= 6 && weights[i] > 1 && i !== s.beast);
  if (s.stage === 3 && missing >= 0) return weights.map((_, i) => i === missing ? 1 : 0);
  const guarantee = s.stage === 3 && s.run.perks.length > 0 && s.run.affinityMisses >= 2;
  const pool = weights.map((w, i) => guarantee && w === 1 ? 0 : i === s.beast ? (w > 1 ? w * .7 : 0) : w);
  const total = pool.reduce((a, b) => a + b, 0);
  return pool.map(w => w / total);
}
function nextForm(s: KnightState) {
  if (s.stage !== 3) return (s.beast + 1) % BEASTS.length;
  const weights = beastWeights(s);
  const missing = s.run.drought.findIndex((count, i) => count >= 6 && weights[i] > 1 && i !== s.beast);
  if (missing >= 0) return missing;
  s.run.formRng = (Math.imul(s.run.formRng, 1664525) + 1013904223) >>> 0;
  let roll = s.run.formRng / 4294967296;
  const chances = beastChances(s);
  for (let i = 0; i < chances.length; i++) { roll -= chances[i]; if (roll < 0) return i; }
  return chances.findIndex(chance => chance > 0);
}
export const raccoonRank = (s: KnightState) => s.stage === 3 ? Math.max(1, Math.min(3, s.run.perks.length)) : 1;
export const canRelay = (s: KnightState) => s.stage === 3 && raccoonRank(s) >= 3;
export const RELAY_FINISHERS = ["三連追光", "吞彈重砲", "騰空羽刃", "折返突襲", "護身潮汐", "雙生毒牙", "破陣風踢"] as const;
export type ClimbWall = { x: number; y: number; w: number; h: number; solid?: boolean };
export function wallsAt(stage: number, time: number, layout = 0, bridgeDrop = 0, control?: TerrainControl): ClimbWall[] {
  if (stage !== 3) return [];
  // Suspended wooden decks have no invisible blocking posts underneath.
  return rocksAt(stage, control).map(r => ({ ...r, solid: true }));
}
export const abilityCooldown = (s: KnightState) => BEASTS[s.beast].cooldown * (s.beast === 6 && hasBlessing(s, "haste") ? .72 : 1);
function runRandom(s: KnightState) { s.run.rng = (Math.imul(s.run.rng, 1664525) + 1013904223) >>> 0; return s.run.rng / 4294967296; }
function draft(s: KnightState) {
  const pool = (Object.keys(BLESSINGS) as Blessing[]).filter(id => !s.run.perks.includes(id));
  s.run.offer = [];
  while (s.run.offer.length < 3 && pool.length) {
    const distinct = pool.filter(id => !s.run.offer.some(selected => BLESSING_BEASTS[selected][0] === BLESSING_BEASTS[id][0]));
    const options = distinct.length ? distinct : pool;
    const selected = options[Math.floor(runRandom(s) * options.length)]; s.run.offer.push(selected); pool.splice(pool.indexOf(selected), 1);
  }
  s.mobility.dashBuffer = 0; s.mobility.relayTime = 0; s.run.drafts++; s.phase = "draft"; s.attackBuffer = 0; s.specialBuffer = 0; s.player.jumpBuffer = 0;
  emit(s, "boon");
}
export function beginKnight(s: KnightState) { if (s.phase !== "ready") return; s.phase = "playing"; s.run.nextBeast = nextForm(s); if (s.stage === 3) draft(s); }
export function chooseBlessing(s: KnightState, id: Blessing) {
  if (s.phase !== "draft" || !s.run.offer.includes(id) || s.run.perks.includes(id)) return false;
  s.run.perks.push(id); s.run.offer = []; if (id === "shell") s.run.shield = 1;
  s.run.nextBeast = nextForm(s);
  s.phase = "playing"; s.player.invulnerable = Math.max(s.player.invulnerable, 1); s.hitStop = 0;
  s.notice = `招式習得：${BLESSINGS[id].name}`; s.noticeTime = 2.5; emit(s, "boon");
  if (s.run.perks.length === 1) s.camera.reveal = 1.4;
  if (s.run.perks.length === 2) { s.notice = "浣熊進階 II：蹬牆蓄勢 → 破甲衝刺"; s.noticeTime = 4; }
  if (s.run.perks.length === 3) { s.notice = "接力 III 解鎖：Shift 浣熊衝刺 → J 專屬接招"; s.noticeTime = 5; emit(s, "relay"); }
  if (s.muffins >= 12 && !s.run.boss && !s.run.bossDefeated) {
    s.run.anchors = [{ id: -10, x: 1620, y: 242, hp: 3 }, { id: -11, x: 2085, y: 412, hp: 3 }];
    s.run.boss = { x: 1880, y: 548, hp: 30, maxHp: 30, timer: 2, phase: "rest", tier: 0, summonCooldown: 0, terrainCooldown: 1, campTime: 0, move: 0, flash: 0, targetX: 480, targetY: 520 };
    if(s.run.finalAscent) {s.run.boss.hp=72;s.run.boss.maxHp=72;}
    s.run.hazards = []; s.enemies = []; s.spawnIn = 3; s.camera.reveal = 1.6; s.player.invulnerable = 2;
    s.notice = "遺跡守衛甦醒！先破高台封印，再沿降下的橋切入核心！"; s.noticeTime = 3; emit(s, "boss");
  }
  return true;
}
/** An explicit developer shortcut; normal runs still reach the guardian at 12 burgers. */
export function createGuardianPractice(seed?: number, beast = 3, tier = 0): KnightState {
  const s = createKnightState(3, seed); s.beast = Math.max(0, Math.min(BEASTS.length - 1, Math.trunc(beast)));
  const technique: Blessing = ["spark", "hunger", "feather", "blood", "shell", "echo", "haste"][s.beast] as Blessing;
  s.run.practice = true; s.run.practiceTier = Math.max(0, Math.min(2, Math.trunc(tier))); s.run.perks = (["blood", "hunger", "shell", "nova"] as Blessing[]).filter(id => id !== technique).slice(0, 3); s.run.drafts = 4;
  s.muffins = 12; s.phase = "draft"; s.run.offer = [technique]; chooseBlessing(s, technique); s.run.shield = 1;
  const platforms = platformsAt(3, 0, s.run.layout); s.player.x = platforms[7].x + 100; s.player.y = platforms[7].y;
  s.muffin = { x: platforms[8].x + 160, y: platforms[8].y - 26, platform: 8 }; s.camera.zoom = RUINS_ZOOM.boss; s.camera.x = Math.min(2160 - 480 / s.camera.zoom, 1640); s.camera.y = 548 - 238 / s.camera.zoom;
  if (tier > 0 && s.run.boss) {
    s.run.boss.hp = s.run.boss.maxHp * (tier === 1 ? .6 : .3); s.run.boss.tier = guardianTier(s.run.boss);
    s.run.anchors = []; s.run.bridgeDrop = 110;
    s.run.terrain.evolution = tier; s.run.terrain.evolutionTarget = tier;
    s.run.boss.ritualCooldown = 4.5;
    if (tier === 2) { s.run.boss.giant=1; s.run.boss.x=1660; s.run.boss.y=548; s.run.boss.platform=0; }
    s.player.y = platformsAt(3,0,s.run.layout,110,s.run.terrain)[7].y;
    s.muffin.y = platformsAt(3,0,s.run.layout,110,s.run.terrain)[8].y - 26;
  }
  s.notice = tier > 0 ? `守衛演練 · ${GUARDIAN_PHASES[Math.min(2,tier)].name}，核心已解除封印` : "守衛演練 · 接力 III 已解鎖，先破兩枚封印"; s.noticeTime = 4;
  return s;
}
/** The developer shortcut enters the same final arena as the live health transition. */
export function createFinalePractice(seed?: number, beast = 3, tier = 0): KnightState {
  const s=createGuardianPractice(seed,beast,tier);s.run.finalAscent=true;
  if(s.run.boss) {s.run.boss.maxHp=72;s.run.boss.hp=72*[1,.6,.3][Math.max(0,Math.min(2,tier))];}
  if(tier>=2) activateFinalAscent(s);
  return s;
}
function win(s: KnightState) { if (s.phase !== "playing") return; s.phase = "won"; s.score += s.hearts * 200; emit(s, "win"); }
function upgradeShot(s: KnightState, shot: Shot) {
  if (shot.kind === 5 && hasBlessing(s, "echo")) { shot.pierce++; shot.bounces = 2; }
  shot.damage = shot.damage ?? 1;
  s.shots.push(shot);
}
function swallowOrSpit(s: KnightState) {
  const p = s.player; s.specialCooldown = .48; p.attackTime = .22;
  if (s.stomach !== null) {
    const level = s.stomach; s.stomach = null;
    upgradeShot(s, { x: p.x + p.facing * 30, y: p.y - 32, vx: p.facing * 730, vy: -35, life: 2, kind: 1, r: 20 + level * 4, pierce: 3, hit: [], damage: 2 + level + (hasBlessing(s, "hunger") ? 2 : 0), cargo: level });
    ring(s, p.x + p.facing * 28, p.y - 30, 40, "#ecdb98"); s.shake = 4; emit(s, "spit"); return;
  }
  const target = s.enemies.filter(e => e.hp > 0 && (e.x - p.x) * p.facing >= -8 && (e.x - p.x) * p.facing < 155 && Math.abs(e.y - 20 * enemyScale(e) - (p.y - 30)) < 56).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
  s.tongue = { x: target?.x ?? p.x + p.facing * 150, y: target ? target.y - 20 * enemyScale(target) : p.y - 30, life: .2 };
  if (!target) { emit(s, "attack"); return; }
  if (target.hp > 1 && !(hasBlessing(s, "hunger") && enemyLevel(target) <= 1)) {
    s.floaters.push({ x: target.x, y: target.y - 65, text: "先削弱！", life: .9, color: "#ffe4bc" }); return;
  }
  s.stomach = enemyLevel(target); defeat(s, target); s.enemies = s.enemies.filter(e => e.hp > 0);
  p.invulnerable = Math.max(p.invulnerable, .25); emit(s, "swallow");
}
function damageEnemy(s: KnightState, e: Enemy, amount: number) {
  if (e.hp <= 0) return;
  e.hp = Math.max(0, e.hp - amount); e.flash = .15;
  if (e.hp <= 0) defeat(s, e); else { burst(s, e.x, e.y - 20, "#fff0bc", 6); emit(s, "hit", e.x, e.y, .4); }
}
function chainSpark(s: KnightState, x: number, y: number, exclude?: Enemy) {
  if (!hasBlessing(s, "spark")) return;
  const nearby = s.enemies.filter(e => e !== exclude && e.hp > 0 && Math.hypot(e.x - x, e.y - 20 - y) < 170).sort((a, b) => Math.hypot(a.x - x, a.y - 20 - y) - Math.hypot(b.x - x, b.y - 20 - y)).slice(0, 2);
  for (const e of nearby) {
    damageEnemy(s, e, 1); ring(s, e.x, e.y - 20, 45, "#fff4a3");
    for (let i = 0; i < 8; i++) { const f = i / 7; s.particles.push({ x: x + (e.x - x) * f, y: y + (e.y - 20 - y) * f + (i % 2 ? 5 : -5), vx: 0, vy: 0, life: .2, color: "#ffe6a3" }); }
  }
}
function damageAnchor(s: KnightState, anchor: KnightState["run"]["anchors"][number], damage: number) {
  if (anchor.hp <= 0) return;
  anchor.hp = Math.max(0, anchor.hp - damage); anchor.flash = .18;
  const broken = anchor.hp === 0, count = broken ? 28 : 6;
  for (let i=0;i<count;i++) {
    const angle = i / count * Math.PI * 2, speed = (broken ? 180 : 75) + i % 5 * 26;
    s.shards.push({x:anchor.x+Math.cos(angle)*14,y:anchor.y-28,vx:Math.cos(angle)*speed,vy:-140-Math.abs(Math.sin(angle))*speed,angle,spin:(i%2?1:-1)*(3+i%4),size:broken?5+i%7:3+i%4,life:broken?1.8:1,amber:i%3===0,bounced:false});
  }
  s.shards=s.shards.slice(-120); s.hitStop = broken ? .085 : .045; s.shake = broken ? 8 : 3;
  emit(s, broken ? "sealBreak" : "sealHit", anchor.x, anchor.y);
  if (broken) {
    if(s.run.tower) {
      // Breaking a lock interrupts queued attacks so the player can leave its landing safely.
      s.run.hazards=[];s.run.summons=[];s.player.invulnerable=Math.max(s.player.invulnerable,1.5);
      if(s.run.boss && s.run.boss.hp>0) {s.run.boss.phase="rest";s.run.boss.timer=2.4;s.run.boss.ritualCooldown=Math.max(s.run.boss.ritualCooldown ?? 0,4);}
    }
    anchor.breakTime=1.1; s.score += 150; ring(s,anchor.x,anchor.y-25,150,"#fff0b0"); ring(s,anchor.x,anchor.y-25,90,"#c5efcd");
    s.notice = s.run.tower ? (s.run.anchors.every(a=>a.hp<=0) ? "鎖星全破！巨像核心暴露，登高反擊！" : "鎖星岩晶崩解！掌擊中斷、生命 +1，趁空檔上行") : s.run.anchors.every(a => a.hp <= 0) ? "封印全破！橋面下降，核心暴露" : "岩晶崩解！天橋下降一階"; if(s.run.tower) s.hearts=Math.min(3,s.hearts+1); s.noticeTime = 3;
  }
}
function hitGuardian(s: KnightState, damage: number) {
  const b = s.run.boss; if (!b || b.hp <= 0) return;
  if (s.run.anchors.some(a => a.hp > 0)) { if (b.flash <= 0) s.floaters.push({ x: b.x, y: b.y - 135, text: "先破高台封印", life: .7, color: "#f0dca6" }); b.flash = .15; return; }
  // Transition still accepts damage; it never silently discards a strong finishing combo.
  b.hp = Math.max(0, b.hp - damage * ((b.exposed ?? 0) > 0 ? 2 : b.phase === "rest" ? 1.5 : 1)); b.flash = .14; s.shake = 4; emit(s, "hit", b.x, b.y);
  const nextTier = guardianTier(b);
  if (b.hp > 0 && nextTier > (b.tier ?? 0)) {
    b.tier = nextTier; if (b.phase === "leap") b.pendingAwaken = true; else { b.phase = "awaken"; b.timer = 1.4 + Math.abs(nextTier - (s.run.terrain.evolution ?? 0)) * 1.6; } b.summonCooldown = 0; b.terrainCooldown = Math.min(b.terrainCooldown ?? 0, 2);
    s.run.terrain.evolutionTarget = nextTier; s.run.terrain.evolutionDelay = 1.4;
    b.ritualCooldown = 0; b.exposed = 0;
    s.run.hazards = []; s.run.summons = []; s.player.invulnerable = Math.max(s.player.invulnerable, b.timer, 3);
    s.notice = `${GUARDIAN_PHASES[nextTier].name}！${nextTier === 1 ? "地層斷裂！岩階重排，準備閃避連鎖地裂" : s.run.finalAscent ? "天階即將崩升！戰場轉為向上追擊" : "遺跡抬升！登上高台，避開崩星洪潮"}`; s.noticeTime = 3;
    ring(s,b.x,b.y-100,240,nextTier === 1 ? "#efc978" : "#ff9e78"); emit(s,"enrage",b.x,b.y,nextTier);
  }
  if (b.hp === 0) { s.run.summons = []; s.run.bossDefeated = true; s.run.hazards = []; s.score += 750; burst(s, b.x, b.y - 60, "#ffd683", 40); ring(s, b.x, b.y - 60, 150, "#ffe6a9"); s.notice = "守衛擊破！收齊漢堡即可通關。"; s.noticeTime = 3; emit(s, "boss"); }
}
export function advanceTerrain(s: KnightState, dt: number) {
  const t = s.run.terrain;
  if (s.stage !== 3) return;
  const target = s.run.bossDefeated ? 0 : t.evolutionTarget ?? 0;
  if ((t.evolutionDelay ?? 0) > 0) t.evolutionDelay = Math.max(0, t.evolutionDelay! - dt);
  else t.evolution = (t.evolution ?? 0) + Math.max(-dt / 1.6, Math.min(dt / 1.6, target - (t.evolution ?? 0)));
  if (t.phase === "idle") return;
  if (s.run.bossDefeated && t.phase !== "return") { t.phase = "return"; t.timer = t.amount * 1.3; }
  t.timer = Math.max(0, t.timer - dt);
  if (t.phase === "moving") t.amount = 1 - t.timer / 1.2;
  if (t.phase === "return") t.amount = t.timer / 1.3;
  if (t.timer <= 0) {
    if (t.phase === "warning") { t.phase = "moving"; t.timer = 1.2; s.shake = 7; emit(s, "boss"); }
    else if (t.phase === "moving") { t.phase = "hold"; t.timer = 3.2; t.amount = 1; }
    else if (t.phase === "hold") { t.phase = "return"; t.timer = 1.3; }
    else { t.phase = "idle"; t.amount = 0; }
  }
}
function updateRogue(s: KnightState, dt: number) {
  if (s.stage !== 3) return;
  const r = s.run, p = s.player, b = r.boss;
  if (b && b.hp > 0) {
    const terrain = platformsAt(s.stage, s.time, r.layout, r.bridgeDrop, r.terrain);
    const tier = guardianTier(b), baseTuning = GUARDIAN_PHASES[tier], tuning = r.finalAscent ? {...baseTuning,recovery:baseTuning.recovery*(r.tower ? .75 : .85),walk:baseTuning.walk*1.15,summon:tier===0?11:baseTuning.summon*.8} : baseTuning; b.tier = tier;
    if (tier === 2 && b.phase !== "leap") {
      const previous = b.giant ?? 0; b.giant = Math.min(1, previous + dt / 1.8);
      if (b.giant > previous) {
        const fraction = (b.giant - previous) / Math.max(.00001, 1 - previous);
        b.x += (1660-b.x)*fraction; b.y += ((r.tower ? Math.max(-1372,Math.min(548,p.y+340)) : 548)-b.y)*fraction;
      }
      if (b.giant === 1) { b.x=1660; b.y=r.tower ? b.y+Math.max(-dt*160,Math.min(dt*160,Math.max(-1372,Math.min(548,p.y+340))-b.y)) : 548; b.platform=0; }
    }
    const body = guardianBody(b);
    b.ritualCooldown = Math.max(0, (b.ritualCooldown ?? 7) - dt); b.exposed = Math.max(0, (b.exposed ?? 0) - dt);
    b.summonCooldown = Math.max(0, (b.summonCooldown ?? 0) - dt);
    b.flash = Math.max(0, b.flash - dt); b.timer -= dt; b.walking = false;
    b.landingTime = Math.max(0, (b.landingTime ?? 0) - dt);
    b.terrainCooldown = Math.max(0, (b.terrainCooldown ?? 0) - dt);
    b.campTime = Math.abs(p.x - (b.watchX ?? p.x)) < 1 ? (b.campTime ?? 0) + dt : Math.max(0, (b.campTime ?? 0) - dt * 2);
    b.watchX = p.x;
    if (b.phase !== "leap" && !(tier===2 && ((b.giant ?? 0)<1 || r.tower))) b.y = terrain[b.platform ?? 0].y;
    b.facing = Math.sign(p.x - b.x) || b.facing || -1;
    if (b.phase === "leapWindup" || b.phase === "leap") b.targetY = terrain[b.resonance ?? 0].y;
    if (b.phase === "rest" && tier < 2) {
      const floor = terrain[b.platform ?? 0]; b.y = floor.y;
      // Recover in place first. Only the latter part of the rest window pursues the player.
      if (b.timer < 1.1 && b.timer > 0 && Math.abs(p.x - b.x) > 175) {
        const destination = Math.max(Math.max(105, floor.x + 45), Math.min(floor.x + floor.w - 45, p.x));
        const movement = Math.max(-dt * tuning.walk, Math.min(dt * tuning.walk, destination - b.x));
        const oldX = b.x; b.x += movement;
        for (const wall of wallsAt(s.stage, s.time, r.layout, r.bridgeDrop, r.terrain)) {
          if (b.y <= wall.y + 8 || b.y - GUARDIAN_BODY.height >= wall.y + wall.h) continue;
          if (oldX + GUARDIAN_BODY.halfWidth <= wall.x && b.x + GUARDIAN_BODY.halfWidth > wall.x) b.x = wall.x - GUARDIAN_BODY.halfWidth;
          if (oldX - GUARDIAN_BODY.halfWidth >= wall.x + wall.w && b.x - GUARDIAN_BODY.halfWidth < wall.x + wall.w) b.x = wall.x + wall.w + GUARDIAN_BODY.halfWidth;
        }
        b.walking = Math.abs(b.x - oldX) > .01; b.blocked = Math.abs(b.x - oldX - movement) > .01;
        if (b.walking && Math.floor(s.time * 2.5) !== Math.floor((s.time - dt) * 2.5)) { burst(s, b.x, b.y, "#a9b6a1", 3); emit(s, "land", b.x, b.y, .35); }
      }
    } else if (b.phase === "leap") {
      const progress = Math.min(1, Math.max(0, 1 - b.timer / .95));
      b.x = b.fromX! + (b.targetX - b.fromX!) * progress;
      b.y = b.fromY! + (b.targetY - b.fromY!) * progress - Math.sin(progress * Math.PI) * (b.arcHeight ?? 155);
    }
    if (b.timer <= 0) {
      if (b.phase === "rest") {
        const underfoot = terrain.findIndex(deck => Math.abs(p.y - deck.y) < 12 && p.x >= deck.x && p.x <= deck.x + deck.w);
        const shouldShape = b.terrainCooldown <= 0 && r.terrain.phase === "idle";
        if (tier > 0 && b.ritualCooldown <= 0 && Math.abs((r.terrain.evolution ?? 0) - tier) < .02) {
          b.phase = "ritual"; b.timer = tier === 1 ? 3.6 : 6.2; b.ritualCooldown = tier === 1 ? 12 : 14;
          if (tier === 1) {
            // Lock all three locations up front; later impacts do not track the player.
            for (let i = 0; i < 3; i++) r.hazards.push({kind:"pillar",x:Math.max(70,Math.min(2090,p.x+(i-1)*235)),y:p.y,vx:0,life:.6,delay:1.3+i*.65,warning:1.3+i*.65});
            s.notice = "連鎖地裂！三道裂口依序爆發，換台繞後反擊";
          } else {
            r.hazards.push({kind:"flood",x:1080,y:r.tower ? p.y+70 : 458,vx:0,life:4.2,delay:2,warning:2});
            s.notice = "崩星洪潮！2 秒後淹沒低地，登上岩階與升降台";
          }
          s.noticeTime = tier === 1 ? 3.6 : 5; emit(s,"enrage",b.x,b.y,tier);
        } else if ((tier > 0 || r.tower) && b.summonCooldown <= 0 && s.enemies.length + r.summons.length < 6) {
          const desired = [p.x-260,p.x+260,p.x+(b.facing ?? 1)*400].slice(0,r.tower ? Math.min(3,tier+2) : tier+1);
          for (const desiredX of desired) {
            if (s.enemies.length + r.summons.length >= 6) break;
            const sites = terrain.map((deck,index)=>({deck,index,x:Math.max(deck.x+30,Math.min(deck.x+deck.w-30,desiredX))})).filter(site => site.deck.w >= 90 && Math.abs(site.x-p.x)>125 && !r.summons.some(portal=>Math.abs(portal.x-site.x)<90) && !rocksAt(3,r.terrain).some(rock=>site.x>rock.x && site.x<rock.x+rock.w && site.deck.y>rock.y+1 && site.deck.y<rock.y+rock.h+1));
            sites.sort((a,z)=>(Math.abs(a.x-desiredX)+Math.abs(a.deck.y-p.y)*.4)-(Math.abs(z.x-desiredX)+Math.abs(z.deck.y-p.y)*.4));
            if (sites[0]) r.summons.push({x:sites[0].x,platform:sites[0].index,delay:1.25,level:tier===2 && r.summons.length%2===0 ? 1 : 0});
          }
          b.phase="summon"; b.timer=1.25; b.summonCooldown=tuning.summon;
          s.notice=`${tuning.name} · 岩靈召喚！避開琥珀召喚圈`; s.noticeTime=2; emit(s,"summon",b.x,b.y,tier);
        } else if (shouldShape) {
          const pattern = underfoot > 0 && terrain[underfoot].oneWay ? "undertow" : "rampart";
          r.terrain = { ...r.terrain, phase: "warning", pattern, timer: 1.3, amount: 0, target: underfoot > 0 ? underfoot : 8, cycle: r.terrain.cycle + 1 };
          b.phase = "reshape"; b.timer = 1.3; b.terrainCooldown = tuning.terrain;
          s.notice = pattern === "undertow" ? "地形掌控：腳下平台即將下沉！跳往升起的木台，或按 ↓ 穿落" : "地形掌控：琥珀岩階即將隆起！可借岩階躍上守衛背部";
          s.noticeTime = 3; emit(s, "grow", b.x, b.y);
        } else if (tier === 2) {
          b.phase="windup"; b.timer=1.05; b.attack="sigil"; b.targetX=p.x; b.targetY=p.y;
          for (let i=0;i<3;i++) r.hazards.push({kind:"fist",x:Math.max(100,Math.min(2060,p.x+(i-1)*245)),y:p.y,vx:0,life:.5,delay:1.05+i*.5,warning:1.05+i*.5});
          s.notice="巨像三連掌！落點已鎖定，穿過掌間空隙"; s.noticeTime=2.7;
        } else if (b.move % 3 === 2 || b.blocked || Math.abs(p.x-b.x) > 300 || Math.abs(p.y-b.y) > 145) {
          b.blocked = false;
          // Pick and lock a real landing surface. Telegraph never chases the player.
          const candidates = terrain.map((platform, index) => ({ platform, index })).filter(({ platform, index }) => index === 0 || (platform.w >= 120));
          candidates.sort((a, z) => (Math.abs(a.platform.y - p.y) * 2 + Math.abs(a.platform.x + a.platform.w / 2 - p.x) * (a.index === 0 ? 0 : .3)) - (Math.abs(z.platform.y - p.y) * 2 + Math.abs(z.platform.x + z.platform.w / 2 - p.x) * (z.index === 0 ? 0 : .3)));
          const destination = candidates[0]; b.resonance = destination.index;
          b.targetX = Math.max(Math.max(105, destination.platform.x + 45), Math.min(destination.platform.x + destination.platform.w - 45, p.x)); b.targetY = destination.platform.y;
          const intervening = terrain.map((platform,index)=>({platform,index})).filter(({platform,index}) => {
            if (platform.rock === undefined || index === b.platform || index === b.resonance) return false;
            return platform.x < Math.max(b.x,b.targetX) && platform.x+platform.w > Math.min(b.x,b.targetX) && platform.y < Math.max(b.y,b.targetY)-40;
          }).sort((a,z)=>Math.abs(a.platform.x+a.platform.w/2-b.x)-Math.abs(z.platform.x+z.platform.w/2-b.x));
          if (intervening.length) { const stop=intervening[0]; b.resonance=stop.index; b.targetX=stop.platform.x+stop.platform.w/2; b.targetY=stop.platform.y; }
          b.fromX = b.x; b.fromY = b.y; b.arcHeight = 145;
          // Solve clearance over every intervening rock, including the guardian's body width.
          for (const rock of rocksAt(s.stage, s.run.terrain)) for (const edge of [rock.x - GUARDIAN_BODY.halfWidth - 5, rock.x + rock.w + GUARDIAN_BODY.halfWidth + 5]) {
            const progress = (edge - b.x) / (b.targetX - b.x);
            if (progress > .05 && progress < .95) b.arcHeight = Math.max(b.arcHeight, (b.y + (b.targetY-b.y)*progress - rock.y + 10) / Math.sin(progress*Math.PI));
          }
          b.phase = "leapWindup"; b.timer = Math.max(.8,tuning.windup);
          s.notice = "守衛躍擊！離開金色落點，換到另一層反擊"; s.noticeTime = 2; emit(s, "grow", b.x, b.y);
        } else {
          b.attack = (b.campTime ?? 0) > 2 || b.move % 2 ? "sigil" : "waves";
          b.phase = "windup"; b.timer = tuning.windup; b.targetX = Math.max(30, Math.min(2130, p.x + Math.max(-85, Math.min(85, p.vx * .2)))); b.targetY = p.y - 24; b.resonance = underfoot;
        }
      } else if (b.phase === "awaken") { b.phase="rest"; b.timer=.35; }
      else if (b.phase === "ritual") { b.phase="rest"; b.timer=3; b.exposed=3; b.summonCooldown=Math.max(b.summonCooldown ?? 0,3); s.notice="星核過載！3 秒破綻，攻擊傷害 ×2"; s.noticeTime=3; ring(s,b.x,b.y-100,150,"#bfeede"); emit(s,"shield",b.x,b.y); }
      else if (b.phase === "summon") { b.phase="rest"; b.timer=tuning.recovery; }
      else if (b.phase === "reshape") { b.landingTime = .3; b.move++; b.phase = "rest"; b.timer = tuning.recovery; }
      else if (b.phase === "leapWindup") { b.fromX = b.x; b.fromY = b.y; b.phase = "leap"; b.timer = .95; emit(s, "spring", b.x, b.y); }
      else if (b.phase === "leap") {
        const landing = terrain[b.resonance ?? 0]; b.x = b.targetX; b.y = landing.y; b.platform = b.resonance ?? 0; b.landingTime = .3;
        for (const direction of [-1, 1]) r.hazards.push({ x: b.x, y: b.y - 11, vx: direction * 230, life: 3, delay: .18, kind: "wave", platform: b.resonance ?? 0, minX: landing.x, maxX: landing.x + landing.w });
        b.move++; b.phase = "rest"; b.timer = tuning.recovery; s.shake = 8; ring(s, b.x, b.y, 110, "#f7d9a1"); burst(s, b.x, b.y, "#c7bc90", 24); emit(s, "boss");
        if (b.pendingAwaken) { b.pendingAwaken=false; b.phase="awaken"; b.timer=3; p.invulnerable=Math.max(p.invulnerable,3); }
      } else {
        if (tier === 2) { /* Fists were scheduled with locked positions before the windup. */ }
        else if (b.attack === "waves") {
          const support = terrain[b.platform ?? 0];
          for (const direction of [-1, 1]) r.hazards.push({ x: b.x, y: b.y - 11, vx: direction * 270, life: 7, delay: 0, kind: "wave", platform: b.platform ?? 0, minX: support.x, maxX: support.x + support.w });
          const platform = platformsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)[b.resonance ?? -1];
          if (platform && (b.resonance ?? 0) > 0 && b.resonance !== (b.platform ?? 0)) for (const direction of [-1, 1]) r.hazards.push({ x: platform.x + platform.w / 2, y: platform.y - 11, vx: direction * 220, life: 2, delay: 0, kind: "wave", platform: b.resonance, minX: platform.x, maxX: platform.x + platform.w });
        }
        else r.hazards.push({ x: b.targetX, y: b.targetY, vx: 0, life: .5, delay: 0, kind: "sigil" });
        b.move++; b.phase = "rest"; b.timer = tier === 2 ? (r.tower ? 1.35 : 2.3) : tuning.recovery; s.shake = 5; emit(s, "boss");
      }
    }
    if ((!r.tower || !r.anchors.some(a=>a.hp>0)) && overlap(p.x, p.y - 30, b.x, b.y - body.height / 2, body.halfWidth + 14, body.height / 2 + 22)) {
      if (p.dash > 0) { if (!p.dashHits.includes(-1)) { p.dashHits.push(-1); hitGuardian(s, 3 + (hasBlessing(s, "blood") && s.mobility.charged ? 1 : 0)); } }
      else if(s.mobility.pounceTime>0) { hitGuardian(s,3); rebound(s); } else if(!r.tower) hurt(s, b.x);
    }
  } else if (!r.bossDefeated) {
    r.omenIn -= dt;
    if (r.omenIn <= 0) { r.omenIn = 8; r.hazards.push({ x: p.x, y: p.y - 24, vx: 0, life: .5, delay: 1.4, kind: "sigil" }); }
  }
  for (const portal of r.summons) {
    portal.delay -= dt;
    if (portal.delay <= 0 && b && b.hp > 0 && s.enemies.length < 6) {
      const deck=platformsAt(3,s.time,r.layout,r.bridgeDrop,r.terrain)[portal.platform];
      s.enemies.push({id:s.nextId++,x:portal.x,y:deck.y-2,vx:(p.x>portal.x?1:-1)*(65+15*portal.level),vy:0,hp:1+portal.level,angry:portal.level>0,level:portal.level,summoned:true,flash:.3});
      burst(s,portal.x,deck.y-12,"#c5bb8b",15); ring(s,portal.x,deck.y,60,"#efcf83"); emit(s,"grow",portal.x,deck.y);
    }
  }
  r.summons=r.summons.filter(portal=>portal.delay>0 && b && b.hp>0);
  for (const h of r.hazards) {
    if (h.platform !== undefined) h.y = platformsAt(s.stage, s.time, r.layout, r.bridgeDrop, r.terrain)[h.platform].y - 11;
    if (h.delay > 0) {
      h.delay -= dt;
      if(h.delay<=0 && (h.kind === "fist" || h.kind === "pillar" || h.kind === "flood")) {
        s.shake=h.kind === "flood"?5:8; emit(s,h.kind === "flood"?"grow":"boss",h.x,h.y);
        if(h.kind!=="flood") { ring(s,h.x,h.y,110,"#ffdfa0"); burst(s,h.x,h.y,"#d6bd8a",18); }
      }
      continue;
    }
    h.life -= dt; h.x += h.vx * dt;
    if (h.kind === "wave" && rocksAt(s.stage, s.run.terrain).some(r => h.x > r.x && h.x < r.x + r.w && h.y > r.y && h.y < r.y + r.h)) { h.life = 0; continue; }
    if (h.kind === "flood") { if(r.tower) h.y-=dt*42; if (p.y > h.y + 6 && p.y - 55 < 548) hurt(s, p.x < 1080 ? 2160 : 0); }
    else if (h.kind === "pillar" || h.kind === "fist") { if (Math.abs(p.x-h.x)<(h.kind === "fist" ? 85 : 64) && p.y>h.y-(h.kind === "fist" ? 125 : 220) && p.y-55<h.y+12) hurt(s,h.x); }
    else if (overlap(p.x, p.y - 25, h.x, h.y, h.kind === "wave" ? 31 : 47, h.kind === "wave" ? 25 : 47)) hurt(s, h.x);
  }
  r.hazards = r.hazards.filter(h => h.life > 0 && h.x > -60 && h.x < arenaWidth(s.stage) + 60 && h.x >= (h.minX ?? -60) && h.x <= (h.maxX ?? arenaWidth(s.stage) + 60));
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
  e.y = 100; e.x = s.stage === 3 ? Math.max(100, Math.min(arenaWidth(s.stage) - 100, s.player.x + (e.x < s.player.x ? -260 : 260))) : e.x < 480 ? 185 : 785; e.vy = 0; e.boosted = false; e.portalTime = .4;
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
  if (e.hp < 0) return; e.hp = -1;
  if (s.player.dash > 0 && !s.mobility.refund) { s.mobility.refund = true; s.mobility.dashCooldown = hasBlessing(s, "blood") ? 0 : Math.max(0, s.mobility.dashCooldown - .35); if (hasBlessing(s, "blood")) s.mobility.dashAirUsed = false; } s.kills++; s.combo++; s.comboTime = 3; s.bestCombo = Math.max(s.bestCombo, s.combo);
  const points = ([25, 50, 100][enemyLevel(e)]) * Math.min(4, 1 + Math.floor((s.combo - 1) / 3)); s.score += points;
  s.floaters.push({ x: e.x, y: e.y - 30, text: `+${points}`, life: .85, color: "#fff3b5" });
  burst(s, e.x, e.y - 18, "#e6d68e", 18); ring(s, e.x, e.y - 18, 45, "#fff3ce");
  s.hitStop = .045; s.shake = Math.max(s.shake, 3.5); emit(s, "hit", e.x, e.y, s.combo);
}
function hurt(s: KnightState, fromX = s.player.x - s.player.facing * 10) {
  const p = s.player; if (p.invulnerable > 0 || p.dash > 0) return;
  if (s.run.shield > 0) { s.run.shield = 0; p.invulnerable = 1; ring(s, p.x, p.y - 30, 65, "#ffe8a8"); emit(s, "shield"); return; }
  s.mobility.sealRollTime = 0; s.player.rollTime = 0;
  s.hearts--; p.invulnerable = 1.8; p.hurtTime = .3; p.vy = -320; p.vx = p.x >= fromX ? 290 : -290; s.flash = .18; s.shake = 9; s.hitStop = .075;
  s.combo = 0; s.comboTime = 0; burst(s, p.x, p.y - 22, "#df9684", 18); emit(s, "hurt");
  if (s.hearts <= 0) { s.phase = "lost"; s.notice = "本次挑戰結束"; emit(s, "lose"); }
}
/** A landed pounce turns an enemy into a launch point; a miss consumes the air action. */
function rebound(s: KnightState) {
  const p=s.player,m=s.mobility;
  m.pounceTime=0; m.pounceUsed=false; m.kickLock=.1; p.vy=-790; p.vx*=.35; p.boosted=true;
  p.grounded=false; p.jumps=1; p.coyote=0; p.rollTime=0; p.invulnerable=Math.max(p.invulnerable,.3);
  s.specialCooldown=.45; ring(s,p.x,p.y,85,"#ffe39c"); burst(s,p.x,p.y,"#ffe39c",18); emit(s,"finisher");
}
function specialMobility(s: KnightState,input: Input,dt: number,direction: number) {
  const p=s.player,m=s.mobility;
  m.pounceTime=Math.max(0,m.pounceTime-dt);
  if(p.hurtTime>0) {m.coilActive=false;m.coilCharge=0;m.pounceTime=0;return;}
  if(s.beast===5 && hasBlessing(s,"echo")) {
    if(s.specialBuffer>0 && s.specialCooldown<=0 && !m.coilUsed) {m.coilActive=true;m.coilCharge=0;s.specialBuffer=0;p.dash=0;}
    if(m.coilActive) {
      m.coilCharge=Math.min(.7,m.coilCharge+dt);
      if(!input.special || m.coilCharge>=.7) {
        const power=m.coilCharge/.7; m.coilActive=false;m.coilUsed=true;s.specialCooldown=.65;
        p.vy=-610-power*290;p.vx=direction*(300+power*220);p.facing=direction||p.facing;p.boosted=true;p.grounded=false;p.jumps=1;p.coyote=0;
        m.kickLock=.22;p.jumpTime=.28;p.invulnerable=Math.max(p.invulnerable,power>.8?.24:0);
        for(const vx of [-230,0,230]) upgradeShot(s,{x:p.x,y:p.y-30,vx,vy:-440,kind:5,r:10,life:1.1,pierce:2,hit:[],damage:1});
        ring(s,p.x,p.y,70,"#d3ee99");burst(s,p.x,p.y,"#c7e88f",18);emit(s,"spring");m.coilCharge=0;
      }
    }
  } else {m.coilActive=false;m.coilCharge=0;}
  if(s.specialBuffer<=0 || s.specialCooldown>0 || p.dash>0) return;
  if(s.beast===0 && hasBlessing(s,"spark") && !m.pounceUsed) {
    const targets=s.enemies.filter(e=>e.hp>0).map(e=>({x:e.x,y:e.y-20,priority:1}));
    const locks=s.run.anchors.filter(a=>a.hp>0);
    for(const a of locks) targets.push({x:a.x,y:a.y-37,priority:0});
    const b=s.run.boss;if(b && b.hp>0 && !locks.length) targets.push({x:b.x,y:Math.max(b.y-guardianBody(b).height+35,Math.min(b.y-30,p.y-80)),priority:1});
    const target=targets.filter(e=>Math.hypot(e.x-p.x,e.y-(p.y-25))<340 && (e.x-p.x)*(direction||p.facing)>-25 && !rocksAt(s.stage,s.run.terrain).some(r=>{
      for(let k=1;k<10;k++){const f=k/10,x=p.x+(e.x-p.x)*f,y=p.y-25+(e.y-(p.y-25))*f;if(x>r.x-12 && x<r.x+r.w+12 && y>r.y && y<r.y+r.h)return true;}return false;
    })).sort((a,b)=>(a.priority-b.priority)*1000+Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    const dx=target ? target.x-p.x : (direction||p.facing)*200,dy=target ? target.y-(p.y-25) : -300,d=Math.max(1,Math.hypot(dx,dy));
    const flight=Math.max(.12,d/950);p.vx=target?dx/flight:dx/d*850;p.vy=target?dy/flight-WORLD.gravity*flight/2:dy/d*850;p.facing=Math.sign(dx)||p.facing;p.boosted=true;p.grounded=false;p.jumps=Math.max(1,p.jumps);p.coyote=0;p.rollTime=0;
    m.pounceTime=target?flight+.08:.34;m.pounceUsed=true;m.kickLock=m.pounceTime;s.specialCooldown=.7;p.invulnerable=Math.max(p.invulnerable,.34);
    s.specialBuffer=0;ring(s,p.x,p.y-25,45,"#ffdf90");emit(s,"stride");
  }
  if(s.beast===4 && hasBlessing(s,"shell") && !m.bubbleUsed) {
    const x=Math.max(65,Math.min(arenaWidth(s.stage)-65,p.x+p.facing*70));
    const y=p.grounded?p.y-75:p.y+45;
    // No bubble may be planted inside a solid rock face.
    if(rocksAt(s.stage,s.run.terrain).some(r=>x+45>r.x && x-45<r.x+r.w && y>r.y && y<r.y+r.h)) return;
    s.run.bubble={x,y,life:4};m.bubbleUsed=true;s.specialCooldown=1.4;s.specialBuffer=0;
    ring(s,x,y,65,"#b5eeee");emit(s,"shield",x,y);
  }
}
function startDash(s: KnightState) {
  const p = s.player, m = s.mobility;
  if (p.rollTime > 0 || m.sealRollTime > 0 || (s.beast !== 3 && !canRelay(s)) || m.dashCooldown > 0 || (!p.grounded && m.dashAirUsed) || p.hurtTime > 0) return false;
  m.charged = m.momentum > 0; m.momentum = 0;
  m.dashCooldown = s.beast === 3 ? .6 : 1.35;
  m.dashAirUsed = !p.grounded; m.refund = false; m.wall = 0; m.wallGrace = 0; m.kickLock = 0;
  p.dashHits = []; p.dash = m.charged ? .26 : .2; p.vy = 0; p.attackTime = .22;
  if (canRelay(s)) { m.relayTime = .85; m.assist = .36; s.attackCooldown = 0; }
  else s.attackCooldown = m.dashCooldown;
  burst(s, p.x, p.y - 28, "#efcc8e", 12); ring(s, p.x, p.y - 25, m.charged ? 70 : 38, "#edce91");
  emit(s, "relay"); return true;
}
function wallContact(s: KnightState, direction: number) {
  const p = s.player; if (s.beast !== 3 || p.grounded || p.hurtTime > 0 || p.dash > 0 || s.mobility.kickLock > 0 || p.vy < 0) return 0;
  if (direction < 0 && p.x <= 27 && p.y > 90 && p.y < 550) return -1;
  if (direction > 0 && p.x >= arenaWidth(s.stage) - 27 && p.y > 90 && p.y < 550) return 1;
  for (const w of wallsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)) {
    if (p.y <= w.y + 8 || p.y - 55 >= w.y + w.h - 3) continue;
    if (direction > 0 && Math.abs(p.x + 17 - w.x) < 3) return 1;
    if (direction < 0 && Math.abs(p.x - 17 - w.x - w.w) < 3) return -1;
  }
  return 0;
}
function attack(s: KnightState) {
  if (s.beast === 3 && canRelay(s) && s.mobility.relayTime > 0 && s.attackBuffer > 0) {
    s.mobility.relayTime = 0; s.mobility.finisher = .45; s.mobility.charged = true; s.player.facing *= -1; s.player.dash = .16; s.player.dashHits = []; s.attackCooldown = .6;
    s.notice = "接力成功 · 折返突襲"; s.noticeTime = 1.3; ring(s, s.player.x, s.player.y - 30, 80, "#f4d495"); emit(s, "finisher"); return;
  }
  if (s.beast === 3) { if (!startDash(s)) s.attackCooldown = Math.max(.08, s.mobility.dashCooldown); return; }
  const relay = canRelay(s) && s.mobility.relayTime > 0 && s.attackBuffer > 0;
  if (relay) { s.mobility.relayTime = 0; s.mobility.finisher = .45; s.notice = `接力成功 · ${RELAY_FINISHERS[s.beast]}`; s.noticeTime = 1.3; ring(s, s.player.x, s.player.y - 30, 90, BEASTS[s.beast].color); emit(s, "finisher"); }
  if (relay && s.beast === 1 && s.stomach !== null) { swallowOrSpit(s); const shot = s.shots[s.shots.length - 1]; shot.damage = (shot.damage ?? 1) + 2; shot.r += 6; shot.pierce += 2; s.attackCooldown = abilityCooldown(s); return; }
  const p = s.player; const b = s.beast; s.attackCooldown = abilityCooldown(s); p.attackTime = .22; emit(s, "attack");
  const shot = (angle: number, speed: number, r = 10) => upgradeShot(s, { x: p.x + p.facing * 26, y: p.y - 31, vx: Math.cos(angle) * speed * p.facing, vy: Math.sin(angle) * speed, kind: b, r, life: 1.7, pierce: (b === 5 ? 3 : b === 6 ? 2 : 1) + (relay ? 1 : 0), damage: relay ? 2 : 1, hit: [] });
  if (b === 4) { for (let i = 0; i < 8; i++) shot(i * Math.PI / 4, 310, 11); ring(s, p.x, p.y - 25, 65, "#a3e0ec"); if (relay) p.invulnerable = Math.max(p.invulnerable, .65);
    if (hasBlessing(s, "shell")) { const removed = s.run.hazards.filter(h => h.kind === "wave" && Math.hypot(h.x - p.x, h.y - (p.y - 25)) < 145); s.run.hazards = s.run.hazards.filter(h => !removed.includes(h)); if (removed.length) { ring(s, p.x, p.y - 25, 145, "#a3e0ec"); emit(s, "shield"); } }
  }
  else if (b === 2) { for (const angle of (relay ? [-.5, -.25, 0, .25, .5] : [-.23, 0, .23])) shot(angle, 530, 8); if (relay) { p.vy = -510; p.dash = 0; p.grounded = false; } }
  else if (b === 1) { for (const angle of (relay ? [-.4, 0, .4] : [-.55])) shot(angle, relay ? 590 : 440, relay ? 20 : 15); }
  else if (b === 5) { shot(0, 620, 10); if (relay) shot(Math.PI, 620, 10); }
  else if (b === 6) { shot(0, relay ? 780 : 540, relay ? 34 : 22); if (hasBlessing(s, "haste") && (Math.abs(p.vx) >= 250 || relay)) shot(-.22, 660, 26); }
  else for (const angle of (relay ? [-.15, 0, .15] : [0])) shot(angle, 610, 10);
  burst(s, p.x + p.facing * 29, p.y - 30, BEASTS[b].color, 4);
}
function tickEffects(s: KnightState, dt: number) {
  for (const anchor of s.run.anchors) { anchor.flash=Math.max(0,(anchor.flash ?? 0)-dt); anchor.breakTime=Math.max(0,(anchor.breakTime ?? 0)-dt); }
  for (const shard of s.shards) {
    shard.life-=dt; shard.x+=shard.vx*dt; shard.y+=shard.vy*dt; shard.vy+=840*dt; shard.angle+=shard.spin*dt;
    if (shard.y>=548 && shard.vy>0) { shard.y=548; shard.vy=shard.bounced?0:-shard.vy*.32; shard.vx*=.55; shard.spin*=.5; shard.bounced=true; }
  }
  s.shards=s.shards.filter(shard=>shard.life>0);
  if (s.tongue) { s.tongue.life -= dt; if (s.tongue.life <= 0) s.tongue = null; }
  s.camera.reveal = Math.max(0, s.camera.reveal - dt);
  if (s.stage === 3) {
    const p = s.player, cam = s.camera, boss = s.run.boss;
    const zoom = boss && boss.hp > 0 ? RUINS_ZOOM.boss : RUINS_ZOOM.explore;
    const ease = 1 - Math.exp(-dt * 3.5); cam.zoom += (zoom - cam.zoom) * ease;
    const halfW = 480 / cam.zoom;
    // Frame the player and giant together whenever their separation fits the lens.
    const focus = boss && boss.hp > 0 ? p.x * .62 + boss.x * .38 : p.x + p.facing * 100;
    const tx = Math.max(halfW, Math.min(arenaWidth(s.stage) - halfW, Math.max(p.x - halfW + 100, Math.min(p.x + halfW - 100, focus))));
    cam.x += (tx - cam.x) * ease;
    cam.x = Math.max(halfW, Math.min(arenaWidth(s.stage) - halfW, cam.x));
    const targetY=s.run.tower ? p.y-150/cam.zoom : 548-238/cam.zoom; cam.y += (targetY-cam.y)*ease;

  }
  s.mobility.assist = Math.max(0, s.mobility.assist - dt); s.mobility.finisher = Math.max(0, s.mobility.finisher - dt);
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
  if (input.down && !p.dropHeld) p.dropBuffer = .13; p.dropHeld = !!input.down;
  if (input.jump && !s.jumpHeld) p.jumpBuffer = .13; s.jumpHeld = input.jump;
  if (input.attack && !s.attackHeld) s.attackBuffer = .14; s.attackHeld = input.attack;
  if (input.special && !s.specialHeld) s.specialBuffer = .15;
  s.specialHeld = !!input.special;
  if (input.dash && !s.mobility.dashHeld) s.mobility.dashBuffer = .16; s.mobility.dashHeld = !!input.dash;
  if (s.hitStop > 0) { s.hitStop = Math.max(0, s.hitStop - dt); return; }
  if(s.run.finalAscent && !s.run.tower && s.run.boss && s.run.boss.hp>0 && guardianTier(s.run.boss)===2 && s.run.boss.phase==="awaken" && s.run.boss.timer<=1.6) activateFinalAscent(s);
  const before = platformsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain);
  const previousRocks = rocksAt(s.stage, s.run.terrain);
  advanceTerrain(s, dt);
  const currentRocks = rocksAt(s.stage, s.run.terrain);
  for (const anchor of s.run.anchors) { if(s.run.tower) continue; const rock = anchor.id === -10 ? 3 : 4; anchor.y += currentRocks[rock].y - previousRocks[rock].y; }
  const targetDrop = s.run.tower ? 0 : s.run.anchors.filter(a => a.hp <= 0).length * 55;
  s.run.bridgeDrop += Math.min(Math.max(0, targetDrop - s.run.bridgeDrop), dt * 90);
  const platforms = platformsAt(s.stage, s.time + dt, s.run.layout, s.run.bridgeDrop, s.run.terrain);
  if(s.run.tower) for(const [i,a] of s.run.anchors.entries()) a.y=platforms[[5,10,14][i]].y-26;
  if (p.grounded) carry(p, before, platforms);
  // A rising rock lifts a body already above its old surface instead of pushing it into a side wall.
  for (const [i, rock] of currentRocks.entries()) if (rock.y < previousRocks[i].y && p.y > rock.y && p.y <= previousRocks[i].y + .5 && p.x + 17 > rock.x && p.x - 17 < rock.x + rock.w) {
    p.y = rock.y; p.vy = 0; p.grounded = true;
  }
  p.dropTime = Math.max(0, p.dropTime - dt);
  if (p.dropPlatform >= 0 && p.y - 55 > platforms[p.dropPlatform].y + 18) p.dropPlatform = -1;
  if (p.dropBuffer > 0 && p.grounded && p.hurtTime <= 0) {
    const support = platforms.findIndex(deck => deck.oneWay && Math.abs(p.y - deck.y) < 1 && p.x + 17 > deck.x && p.x - 17 < deck.x + deck.w);
    if (support >= 0) {
      p.dropPlatform = support; p.dropTime = .25; p.y += 6; p.vy = 110; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; p.dash = 0; p.boosted = false;
      s.mobility.wall = 0; s.mobility.wallGrace = 0; s.mobility.sealRollTime = 0;
      burst(s, p.x, p.y - 6, "#dfc399", 5); emit(s, "drop");
    }
    p.dropBuffer = 0;
  }
  p.dropBuffer = Math.max(0, p.dropBuffer - dt);
  const foodPlatform = s.muffin.platform;
  s.muffin.x += platforms[foodPlatform].x - before[foodPlatform].x; s.muffin.y += platforms[foodPlatform].y - before[foodPlatform].y;
  s.specialCooldown = Math.max(0, s.specialCooldown - dt); s.specialBuffer = Math.max(0, s.specialBuffer - dt); s.run.novaCooldown = Math.max(0, s.run.novaCooldown - dt);
  s.time += dt; s.attackCooldown -= dt; s.attackBuffer = Math.max(0, s.attackBuffer - dt); s.noticeTime -= dt; s.comboTime = Math.max(0, s.comboTime - dt); if (!s.comboTime) s.combo = 0;
  p.portalTime = Math.max(0, p.portalTime - dt); p.springTime = Math.max(0, p.springTime - dt);
  p.rollTime = Math.max(0, p.rollTime - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt); p.dash = Math.max(0, p.dash - dt);
  const m = s.mobility, direction = Number(input.right) - Number(input.left);
  for (const key of ["sealRollTime", "sealRollCooldown", "tapTime", "strideTime", "dashCooldown", "kickLock", "momentum", "relayTime", "dashBuffer", "wallGrace"] as const) m[key] = Math.max(0, m[key] - dt);
  const pressedDirection = m.pressDirection || (direction && direction !== m.previousDirection ? direction : 0); m.pressDirection = 0; m.previousDirection = direction;
  if (pressedDirection && s.beast === 4 && hasBlessing(s,"shell")) {
    if (m.tapDir === pressedDirection && m.tapTime > 0 && p.grounded && m.sealRollCooldown <= 0 && p.hurtTime <= 0) {
      m.sealRollTime = .42; m.sealRollCooldown = .9; m.sealRollDir = pressedDirection; m.tapTime = 0; m.tapDir = 0; p.facing = pressedDirection; p.dash = 0; p.invulnerable = Math.max(p.invulnerable,.25); ring(s,p.x,p.y-25,48,"#b5e6ef"); emit(s,"roll");
    } else { m.tapDir = pressedDirection; m.tapTime = .27; }
  }
  if (p.grounded) { m.coilUsed=false; m.pounceUsed=false; m.bubbleUsed=false; p.rollTime = 0; m.strideUsed = false; m.strideTime = 0; m.dashAirUsed = false; m.wall = 0; m.wallGrace = 0; }
  const contact = wallContact(s, direction);
  if (contact) { if (!m.wall) { m.grip = .18; emit(s, "wall"); } m.wall = contact; m.wallGrace = .12; m.grip = Math.max(0, m.grip - dt); p.vy = m.grip > 0 ? 0 : Math.min(80, p.vy); }
  else { m.grip = 0; if (!m.wallGrace) m.wall = 0; }
  if (p.jumpBuffer > 0 && m.wall && m.wallGrace > 0 && s.beast === 3) {
    p.facing = -m.wall; p.vx = -m.wall * 440; p.vy = -760; p.boosted = true; p.grounded = false; p.jumps = 1; p.coyote = 0; p.jumpBuffer = 0; p.dash = 0; p.jumpTime = .28;
    m.wall = 0; m.wallGrace = 0; m.kickLock = .12; m.dashAirUsed = false; m.dashCooldown = 0; m.momentum = raccoonRank(s) >= 2 || hasBlessing(s, "blood") ? 1.3 : 0;
    burst(s, p.x, p.y - 25, "#ffe0a1", 14); emit(s, "wall");
  }
  if (p.jumpBuffer > 0 && p.dash > 0 && s.beast === 3 && raccoonRank(s) >= 2) { p.dash = 0; p.vy = -600; p.grounded = false; p.jumpBuffer = 0; p.jumps = Math.max(1, p.jumps); p.jumpTime = .28; m.kickLock = .13; emit(s, "jump"); }
  p.coyote = p.grounded ? .11 : Math.max(0, p.coyote - dt); p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0 && p.coyote <= 0 && s.beast === 0 && hasBlessing(s, "spark") && p.jumps < 2 && p.hurtTime <= 0) {
    p.rollTime = .52; p.rollFacing = direction || p.facing; p.facing = p.rollFacing; p.vy = -380; p.dash = 0; p.jumps = 2; p.boosted = true; p.grounded = false; p.jumpBuffer = 0;
    p.invulnerable = Math.max(p.invulnerable, .36); ring(s, p.x, p.y-35, 55, "#ffe5a3"); emit(s, "roll");
  }
  if (p.jumpBuffer > 0 && s.beast === 6 && hasBlessing(s, "haste") && !m.strideUsed && p.coyote <= 0 && p.hurtTime <= 0) {
    const facing = direction || p.facing;
    const ledge = wallsAt(s.stage,s.time,s.run.layout,s.run.bridgeDrop,s.run.terrain).find(w => Math.abs((facing > 0 ? w.x-17 : w.x+w.w+17)-p.x)<18 && p.y-w.y>30 && p.y-w.y<=250 && p.y-55<w.y+w.h);
    if (ledge) { m.strideUsed = true; m.strideTime = .7; m.strideDir = facing; p.facing = facing; p.vy = -840; p.dash = 0; p.jumps = 2; p.boosted = true; p.grounded = false; p.jumpBuffer = 0; ring(s,p.x+facing*20,p.y-15,55,"#e8d6b0"); emit(s,"stride"); }
  }
  if (p.jumpBuffer > 0 && (p.coyote > 0 || (s.beast === 2 && p.jumps < 2 + (hasBlessing(s, "feather") ? 1 : 0)))) {
    if (s.beast === 2 && p.coyote <= 0 && hasBlessing(s, "feather")) for (const vx of [-420, -230, 230, 420]) upgradeShot(s, { x: p.x, y: p.y - 20, vx, vy: 180, kind: 2, r: 8, life: 1, hit: [], pierce: 1 });
    p.boosted = false; p.vy = -beast.jump; p.jumps++; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; p.jumpTime = .28;
    burst(s, p.x, p.y, "#f8edd0", 8); ring(s, p.x, p.y, 23, "#fff1cd"); emit(s, "jump");
  }
  if (direction && m.kickLock <= 0 && p.dash <= 0 && p.hurtTime <= 0 && p.rollTime <= 0 && m.sealRollTime <= 0) p.facing = direction;
  if (m.dashBuffer > 0 && startDash(s)) m.dashBuffer = 0;
  if ((input.attack || s.attackBuffer > 0) && (s.attackCooldown <= 0 || (canRelay(s) && m.relayTime > 0 && s.attackBuffer > 0)) && p.hurtTime <= 0) { attack(s); s.attackBuffer = 0; }
  if (s.beast === 1 && s.specialBuffer > 0 && s.specialCooldown <= 0 && p.hurtTime <= 0) { swallowOrSpit(s); s.specialBuffer = 0; }
  specialMobility(s,input,dt,direction);
  if (m.strideTime > 0 && direction && direction !== m.strideDir) m.strideTime = 0;
  const targetVx = (m.strideTime > 0 ? m.strideDir : direction) * beast.speed; const acceleration = (direction ? (s.beast === 3 && !p.grounded ? 3600 : 2800) : 3600) * dt;
  if (m.coilActive) p.vx *= .75;
  else if (m.sealRollTime > 0) p.vx = m.sealRollDir * 580;
  else if (p.rollTime > .28) p.vx = p.rollFacing * 320;
  else if (p.dash > 0) p.vx = p.facing * (m.charged ? 950 : 790);
  else if (p.hurtTime <= .1 && m.kickLock <= 0) p.vx += Math.max(-acceleration, Math.min(acceleration, targetVx - p.vx));
  const previousX = p.x;
  p.x = Math.max(26, Math.min(arenaWidth(s.stage) - 26, p.x + p.vx * dt));
  for (const w of wallsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)) if (p.y > w.y + (w.solid ? 0 : 8) && p.y - 55 < w.y + w.h - 2 && p.x + 17 > w.x && p.x - 17 < w.x + w.w) {
    p.x = previousX < w.x + w.w / 2 ? w.x - 17 : w.x + w.w + 17; p.vx = 0; p.dash = 0; m.sealRollTime = 0;
  }
  const prevY = p.y; const wasGrounded = p.grounded;
  const gravity = WORLD.gravity * (p.vy < -230 && !input.jump && !p.boosted ? 2.1 : p.vy > 0 ? 1.15 : 1);
  if (p.rollTime > 0 && p.rollTime <= .28) p.vy = Math.max(p.vy, 430);
  if (p.vy >= 0) p.boosted = false;
  if (p.dash > 0) p.vy = 0; else if(m.coilActive) p.vy = Math.min(35,p.vy+gravity*dt*.15); else p.vy += gravity * dt;
  if (contact && p.vy >= 0) p.vy = m.grip > 0 ? 0 : Math.min(80, p.vy);
  const landingSpeed = p.vy; p.y += p.vy * dt; p.grounded = false;
  for (const rock of rocksAt(s.stage, s.run.terrain)) if (p.vy < 0 && p.x + 17 > rock.x && p.x - 17 < rock.x + rock.w && prevY - 55 >= rock.y + rock.h && p.y - 55 < rock.y + rock.h) {
    p.y = rock.y + rock.h + 55; p.vy = 0; p.boosted = false;
  }
  for (const [index, platform] of platforms.entries()) if (index !== p.dropPlatform && p.vy >= 0 && prevY <= (wasGrounded ? platform.y : before[index].y) + .5 && p.y >= platform.y && p.x + 17 > platform.x && p.x - 17 < platform.x + platform.w) {
    p.y = platform.y; p.vy = 0; p.grounded = true; p.jumps = 0;
    if (p.rollTime > 0) { p.rollTime = 0; burst(s,p.x,p.y,"#ffe5a3",16); ring(s,p.x,p.y,50,"#ffe5a3"); }
    if (!wasGrounded && landingSpeed > 220) { p.landTime = .2; burst(s, p.x, p.y, "#e9e2c2", 8); emit(s, "land", p.x, p.y, Math.min(1, landingSpeed / 700)); }
    if (!wasGrounded && landingSpeed > 220 && s.beast === 1 && hasBlessing(s, "nova") && s.run.novaCooldown <= 0) {
      s.run.novaCooldown = 1; ring(s, p.x, p.y, 85, "#b7e5af");
      for (const angle of [-2.9, -2.5, -.65, -.25]) upgradeShot(s, { x: p.x, y: p.y - 25, vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, kind: 1, r: 12, life: 1.2, hit: [], pierce: 1 });
    }
    break;
  }
  const bubble=s.run.bubble;
  if(bubble) {
    bubble.life-=dt;
    if(p.vy>=0 && prevY<=bubble.y+3 && p.y>=bubble.y && Math.abs(p.x-bubble.x)<65) {
      p.y=bubble.y; p.vy=-880; p.boosted=true; p.grounded=false; p.jumps=1; p.coyote=0;
      ring(s,bubble.x,bubble.y,110,"#b3f3ee"); burst(s,bubble.x,bubble.y,"#a4e7ea",22); emit(s,"spring");
      for(const e of s.enemies) if(Math.hypot(e.x-bubble.x,e.y-bubble.y)<150) damageEnemy(s,e,2);
      s.run.hazards=s.run.hazards.filter(h=>h.kind!=="wave" || Math.hypot(h.x-bubble.x,h.y-bubble.y)>150);
      delete s.run.bubble;
    } else if(bubble.life<=0) delete s.run.bubble;
  }
  if(s.run.tower && p.grounded) {
    const tower=s.run.tower; tower.highestY=Math.min(tower.highestY,p.y);
    const checkpoint=TOWER_CHECKPOINTS.find(i=>i>tower.checkpoint && Math.abs(p.y-platforms[i].y)<1 && p.x>platforms[i].x && p.x<platforms[i].x+platforms[i].w);
    if(checkpoint!==undefined) {tower.checkpoint=checkpoint; emit(s,"shield"); ring(s,p.x,p.y,85,"#c5efd0"); s.notice="營火已點亮 · 失足將回到此層"; s.noticeTime=2;}
  }
  terrain(s, p, prevY, true);
  if (p.y > 650 || (s.run.tower && p.y>s.run.tower.highestY+640)) { p.invulnerable = 0; p.dash = 0; hurt(s); p.x = s.stage === 3 ? Math.max(160, Math.min(arenaWidth(s.stage) - 160, p.x)) : 160; p.y = 548; if(s.run.tower) { const deck=platforms[s.run.tower.checkpoint]; p.x=deck.x+70; p.y=deck.y; } p.vy = 0; p.vx = 0; p.jumps = 0; p.boosted = false; p.grounded = true; }
  if (s.phase !== "playing") return;
  if (s.muffins < WORLD.target && overlap(p.x, p.y - 27, s.muffin.x, s.muffin.y, 35, 38)) {
    s.muffins++; s.score += 100; burst(s, s.muffin.x, s.muffin.y, "#f4c76b", 30);
    s.floaters.push({ x: s.muffin.x, y: s.muffin.y - 24, text: "+100", life: 1, color: "#ffe39b" });
    s.beast = s.stage === 3 ? s.run.nextBeast : (s.beast + 1) % BEASTS.length;
    s.run.affinityMisses = beastWeights(s)[s.beast] > 1 ? 0 : s.run.affinityMisses + 1;
    s.run.drought = s.run.drought.map((count, i) => i === s.beast ? 0 : count + 1); s.run.nextBeast = nextForm(s); m.coilActive=false; m.coilCharge=0; m.pounceTime=0; m.sealRollTime = 0; m.tapTime = 0; m.tapDir = 0; p.rollTime = 0; m.strideTime = 0; m.wall = 0; m.wallGrace = 0; m.kickLock = 0; p.invulnerable = Math.max(.8, p.invulnerable); s.attackCooldown = 0; s.transform = .55;
    if (s.beast === 4 && hasBlessing(s, "shell")) s.run.shield = 1;
    ring(s, p.x, p.y - 30, 80, BEASTS[s.beast].color); s.shake = 3; s.hitStop = .045; emit(s, "collect");
    s.notice = `${BEASTS[s.beast].name} · ${BEASTS[s.beast].skill}`; s.noticeTime = 1.8;
    const candidates = platforms.map((_, i) => i).filter(i => i !== s.muffin.platform && (s.stage !== 3 || (i > 0 && platforms[i].x >= (s.muffins < 4 ? 0 : s.muffins < 8 ? 650 : 1320) && platforms[i].x < (s.muffins < 4 ? 1000 : s.muffins < 8 ? 1600 : 2160))));
    const index = s.run.tower ? towerFoodPlatform(s.muffins) : candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    const next = platforms[index]; s.muffin = { x: next.x + (s.run.tower ? next.w/2 : 35+random()*(next.w-70)), y: next.y - 26, platform: index };
    for (const anchor of s.run.anchors) if (anchor.hp > 0 && Math.abs(anchor.y - s.muffin.y) < 40 && Math.abs(anchor.x - s.muffin.x) < 75) {
      const left = next.x + 35, right = next.x + next.w - 35;
      s.muffin.x = Math.abs(anchor.x - left) > Math.abs(anchor.x - right) ? left : right;
    }
    if (s.stage === 3 && s.muffins % 4 === 0) { s.hearts = Math.min(3, s.hearts + 1); draft(s); return; }
    if (s.muffins >= WORLD.target && (s.stage !== 3 || s.run.bossDefeated)) { win(s); return; }
  }
  if(s.run.tower) s.enemies=s.enemies.filter(e=>e.y<p.y+650 && e.y>p.y-1000);
  s.spawnIn -= dt;
  if (s.spawnIn <= 0 && !s.run.boss && s.enemies.length < (s.stage === 0 ? 3 : s.stage === 3 ? (s.run.boss ? 3 : 6) : 10)) {
    const right = random() > .5;
    const level = s.stage === 3 ? (s.muffins >= 8 && s.nextId % 4 === 3 ? 2 : s.muffins >= 4 && s.nextId % 3 === 2 ? 1 : 0) : 0;
    s.enemies.push({ id: s.nextId++, x: s.stage === 3 ? Math.max(90, Math.min(arenaWidth(s.stage) - 90, p.x + (right ? 320 : -320))) : right ? 785 : 185, y: s.run.tower ? p.y-230 : 70, vx: (right ? -1 : 1) * (s.stage === 0 ? 42 : 52 + s.muffins * 3), vy: 0, angry: level > 0, hp: level + 1, level });
    s.spawnIn = s.stage === 0 ? 5.5 : s.stage === 3 ? (s.run.boss ? 4 : 3.6) : Math.max(1.35, 3.8 - s.muffins * .14);
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
    const oldY = e.y, oldX = e.x; e.vy += WORLD.gravity * dt; e.x += e.vx * dt * ((e.windup || 0) > 0 ? 0 : (e.rush || 0) > 0 ? 2.1 : 1); e.y += e.vy * dt;
    if (e.x < 22 || e.x > arenaWidth(s.stage) - 22) { e.vx *= -1; e.x = Math.max(22, Math.min(arenaWidth(s.stage) - 22, e.x)); }
    for (const platform of platforms) if (e.vy > 0 && oldY <= platform.y && e.y >= platform.y && e.x > platform.x && e.x < platform.x + platform.w) { e.y = platform.y; e.vy = 0; break; }
    for (const rock of rocksAt(s.stage, s.run.terrain)) {
      const radius = 18 * enemyScale(e);
      if (e.y > rock.y + 2 && e.y - radius * 2 < rock.y + rock.h && e.x + radius > rock.x && e.x - radius < rock.x + rock.w) {
        e.x = oldX < rock.x + rock.w / 2 ? rock.x - radius : rock.x + rock.w + radius; e.vx = -e.vx;
      }
    }
    terrain(s, e, oldY, false);
    if (e.y > 635) evolve(s, e);
    const size = enemyScale(e);
    if (overlap(p.x, p.y - 24, e.x, e.y - 20 * size, 16 + 22 * size, 20 + 20 * size)) { if (p.dash > 0) {
      if (!p.dashHits.includes(e.id)) { p.dashHits.push(e.id); damageEnemy(s, e, (m.charged ? 3 : 2) + (hasBlessing(s, "blood") && m.charged ? 1 : 0)); }
    } else if(m.pounceTime>0) { damageEnemy(s,e,3); rebound(s); } else hurt(s, e.x); }
  }
  if (s.phase !== "playing") return;
  for (const a of s.run.anchors) if (a.hp > 0 && p.dash > 0 && !p.dashHits.includes(a.id) && overlap(p.x, p.y - 28, a.x, a.y - 37, 45, 65)) { p.dashHits.push(a.id); damageAnchor(s, a, m.charged ? 3 : 2); }
  if(m.pounceTime>0) {
    const a=s.run.anchors.find(a=>a.hp>0 && overlap(p.x,p.y-28,a.x,a.y-37,45,65));
    if(a) {damageAnchor(s,a,3);rebound(s);}
  }
  for (const shot of s.shots) {
    const oldShotX = shot.x;
    shot.life -= dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; if (shot.kind === 1 && shot.cargo === undefined) shot.vy += 500 * dt;
    if ((shot.bounces || 0) > 0) for (const wall of wallsAt(s.stage, s.time, s.run.layout, s.run.bridgeDrop, s.run.terrain)) {
      if (shot.y < wall.y || shot.y > wall.y + wall.h) continue;
      if ((oldShotX <= wall.x && shot.x >= wall.x) || (oldShotX >= wall.x + wall.w && shot.x <= wall.x + wall.w)) { shot.x = shot.vx > 0 ? wall.x - 1 : wall.x + wall.w + 1; shot.vx *= -1; shot.bounces = (shot.bounces ?? 1) - 1; ring(s, shot.x, shot.y, 22, "#dce99b"); break; }
    }
    if ((shot.bounces || 0) > 0 && (shot.x < 15 || shot.x > arenaWidth(s.stage) - 15)) { shot.x = Math.max(15, Math.min(arenaWidth(s.stage) - 15, shot.x)); shot.vx *= -1; shot.bounces = (shot.bounces ?? 0) - 1; ring(s, shot.x, shot.y, 22, "#e8dbff"); }
    if (rocksAt(s.stage, s.run.terrain).some(r => shot.x > r.x && shot.x < r.x + r.w && shot.y > r.y && shot.y < r.y + r.h)) shot.life = 0;
    for (const a of s.run.anchors) if (a.hp > 0 && shot.life > 0 && !shot.hit.includes(a.id) && overlap(shot.x, shot.y, a.x, a.y - 37, shot.r + 30, shot.r + 55)) { shot.hit.push(a.id); damageAnchor(s, a, shot.damage ?? 1); shot.pierce--; if (shot.pierce <= 0) shot.life = 0; }
    const boss = s.run.boss;
    const bossBody = boss ? guardianBody(boss) : GUARDIAN_BODY;
    if (shot.life > 0 && boss && boss.hp > 0 && !(s.run.tower && s.run.anchors.some(a=>a.hp>0)) && !shot.hit.includes(-1) && overlap(shot.x, shot.y, boss.x, boss.y - bossBody.height / 2, shot.r + bossBody.halfWidth, shot.r + bossBody.height / 2)) { shot.hit.push(-1); hitGuardian(s, shot.damage ?? 1); if (shot.kind === 0) chainSpark(s, boss.x, boss.y - bossBody.height / 2); shot.pierce--; if (shot.pierce <= 0) shot.life = 0; }
    for (const e of s.enemies) if (e.hp > 0 && shot.life > 0 && !shot.hit.includes(e.id) && overlap(shot.x, shot.y, e.x, e.y - 20 * enemyScale(e), shot.r + 22 * enemyScale(e), shot.r + 21 * enemyScale(e))) {
      damageEnemy(s, e, shot.damage ?? 1); shot.hit.push(e.id); shot.pierce--; if (shot.pierce <= 0) shot.life = 0;
      if (shot.kind === 0) chainSpark(s, e.x, e.y - 20, e);
      if (shot.kind === 1) { ring(s, e.x, e.y - 20, 100, "#b7e5af"); for (const other of s.enemies) if (other !== e && other.hp > 0 && Math.hypot(other.x - e.x, other.y - e.y) < 100) damageEnemy(s, other, 1); }
    }
  }
  s.shots = s.shots.filter(shot => shot.life > 0 && shot.x > -30 && shot.x < arenaWidth(s.stage) + 30 && shot.y < 660);
  s.enemies = s.enemies.filter(e => e.hp > 0);
  updateRogue(s, dt);
  if (s.stage === 3 && s.muffins >= WORLD.target && s.run.bossDefeated && s.phase === "playing") win(s);
}

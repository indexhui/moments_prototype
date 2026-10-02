"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuCheck, LuChevronRight, LuHeart, LuMusic2, LuMaximize, LuPause, LuPlay, LuRotateCcw, LuSparkles, LuSun, LuTrophy, LuVolume2, LuVolumeX, LuX } from "react-icons/lu";
import { knightStages, type KnightMode, BEASTS, GUARDIAN_PHASES, BLESSINGS, BLESSING_BEASTS, beastWeights, beastChances, raccoonRank, canRelay, RELAY_FINISHERS, beginKnight, chooseBlessing, abilityCooldown, type Blessing, BURGER_IMAGE, STAGES, WORLD, createKnightRun as createKnightState, createFinalePractice as createGuardianPractice, stepKnight, knightKeyboardInput, type Input, type KnightState } from "@/lib/game/muffinKnight";
import { KnightAudio } from "./KnightAudio";
import { spritePath, portraitStyle } from "./knightSprites";
import type { RuinsArt } from "./drawRuins";
import { drawKnight } from "./drawKnight";
import styles from "./MuffinKnightGame.module.css";

const STORAGE_KEY = "moment:muffin-knight:best:v1";
const emptyInput = (): Input => ({ left: false, right: false, down: false, jump: false, attack: false, special: false, dash: false });
const snapshot = (s: KnightState) => ({ mode: s.mode, secondPlayer: s.secondPlayer ? { beast: s.secondPlayer.beast, collected: s.secondPlayer.collected, hearts: s.secondPlayer.hearts, bubbled: !!s.secondPlayer.rescueBubble } : null, bubbled: !!s.rescueBubble, collected: s.collected, tower: s.run.tower ? {...s.run.tower} : null, dropTime: s.player.dropTime, rollTime: s.player.rollTime, jumps: s.player.jumps, grounded: s.player.grounded, practice: s.run.practice, practiceTier: s.run.practiceTier ?? 0, phase: s.phase, stage: s.stage, beast: s.beast, hearts: s.hearts, score: s.score, muffins: s.muffins, kills: s.kills, bestCombo: s.bestCombo, time: s.time, notice: s.noticeTime > 0 ? s.notice : "", cooldown: Math.max(0, s.attackCooldown), rank: raccoonRank(s), relay: canRelay(s), mobility: { ...s.mobility }, weights: beastWeights(s), chances: beastChances(s), terrain: { ...s.run.terrain }, nextBeast: s.stage === 3 ? s.run.nextBeast : (s.beast + 1) % BEASTS.length, cooldownDuration: abilityCooldown(s), stomach: s.stomach, specialCooldown: s.specialCooldown, perks: [...s.run.perks], offer: [...s.run.offer], drafts: s.run.drafts, shield: s.run.shield, seed: s.run.seed, layout: s.run.layout, boss: s.run.boss ? { ...s.run.boss } : null, anchorsLeft: s.run.anchors.filter(a => a.hp > 0).length, bossDefeated: s.run.bossDefeated });
type View = ReturnType<typeof snapshot>;

export default function MuffinKnightGame() {
  const game = useRef<KnightState>(createKnightState());
  const canvas = useRef<HTMLCanvasElement>(null);
  const arena = useRef<HTMLDivElement>(null);
  const input = useRef<Input>(emptyInput());
  const secondInput = useRef<Input>(emptyInput());
  const keys = useRef(new Set<string>());
  const pointers = useRef(new Map<number, keyof Input>());
  const images = useRef<HTMLImageElement[]>([]);
  const burgerImage = useRef<HTMLImageElement | null>(null);
  const audio = useRef<KnightAudio | null>(null);
  const backgrounds = useRef<HTMLImageElement[]>([]);
  const ruinsArt = useRef<RuinsArt>({});
  const reduced = useRef(false);
  const bestRef = useRef<number[]>(STAGES.map(() => 0));
  const [best, setBest] = useState(STAGES.map(() => 0));
  const [view, setView] = useState<View>(() => snapshot(game.current));
  const [muted, setMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [reduceFx, setReduceFx] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [help, setHelp] = useState(false);
  const [modeMenu, setModeMenu] = useState(true);
  const sync = useCallback(() => setView(snapshot(game.current)), []);
  const clearInput = useCallback(() => {
    keys.current.clear(); pointers.current.clear(); input.current = emptyInput(); secondInput.current = emptyInput();
    for (const actor of [game.current, game.current.secondPlayer]) {
      if (!actor) continue;
      actor.player.dropBuffer = 0; actor.player.dropHeld = false; actor.player.jumpBuffer = 0;
      actor.attackBuffer = 0; actor.specialBuffer = 0;
      actor.attackHeld = false; actor.specialHeld = false; actor.jumpHeld = false;
      const mobility = actor.mobility; mobility.dashBuffer = 0; mobility.dashHeld = false; mobility.coilActive = false; mobility.coilCharge = 0;
      mobility.pressDirection = 0; mobility.previousDirection = 0; mobility.tapDir = 0; mobility.tapTime = 0;
    }
  }, []);
  const updateInput = useCallback(() => {
    const held = [...pointers.current.values()];
    const keyboard = knightKeyboardInput(keys.current, !!game.current.secondPlayer);
    for (const action of held) keyboard[action] = true;
    input.current = keyboard;
    secondInput.current = knightKeyboardInput(keys.current, true, true);
  }, []);
  const start = (stage = game.current.stage, beast = game.current.beast) => {
    const mode = game.current.mode;
    const seed = game.current.phase === "ready" && game.current.stage === stage ? game.current.run.seed : undefined;
    clearInput(); game.current = createKnightState(stage, seed, mode); game.current.beast = beast; beginKnight(game.current); setHelp(false);
    void audio.current?.unlock();
    sync(); canvas.current?.focus({ preventScroll: true });
  };
  const selectBlessing = useCallback((id: Blessing) => {
    if (!chooseBlessing(game.current, id)) return;
    clearInput(); void audio.current?.unlock(); sync(); canvas.current?.focus({ preventScroll: true });
  }, [clearInput, sync]);
  useEffect(() => {
    if (view.phase !== "draft") return;
    clearInput(); audio.current?.finish();
    document.querySelector<HTMLButtonElement>('[data-blessing]:not(:disabled)')?.focus();
  }, [view.phase, clearInput]);
  const pause = useCallback(() => {
    const s = game.current; if (s.phase === "playing") { s.phase = "paused"; audio.current?.pause(); } else if (s.phase === "paused") { s.phase = "playing"; void audio.current?.unlock(); }
    clearInput(); sync();
  }, [clearInput, sync]);
  const startPractice = (tier = 0) => { clearInput(); game.current = createGuardianPractice(undefined, game.current.beast, tier); setHelp(false); void audio.current?.unlock(); sync(); canvas.current?.focus({ preventScroll: true }); };
  const selectStage = (stage: number) => { audio.current?.pause(); clearInput(); game.current = createKnightState(stage, undefined, game.current.mode); sync(); };
  const selectMode = (mode: KnightMode) => {
    audio.current?.pause(); clearInput(); game.current = createKnightState(mode === "solo" ? 3 : 0, undefined, mode);
    setLoaded(false); setModeMenu(false); setHelp(false); sync();
  };
  const openModeMenu = () => { audio.current?.pause(); clearInput(); game.current.phase = "ready"; setHelp(false); setModeMenu(true); sync(); };
  useEffect(() => {
    if (modeMenu) return;
    let disposed = false;
    audio.current = new KnightAudio();
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; setReduceFx(reduced.current);
    try { const saved: unknown = JSON.parse(localStorage.getItem(`${STORAGE_KEY}:${game.current.mode}`) || "[]"); if (Array.isArray(saved)) { bestRef.current = STAGES.map((_, i) => typeof saved[i] === "number" && Number.isFinite(saved[i]) ? Math.max(0, saved[i]) : 0); setBest([...bestRef.current]); } } catch { /* Private browsing still supports the current session. */ }
    images.current = BEASTS.map(beast => { const img = new Image(); img.src = spritePath(beast.id); return img; });
    burgerImage.current = new Image();
    burgerImage.current.src = BURGER_IMAGE;
    backgrounds.current = ["forest", "rooftop", "moonlight", "ruins-cinematic"].map(id => { const img = new Image(); img.src = `/images/muffin-knight/environments/${id}.png`; return img; });
    const rockArt = new Image(); rockArt.src = "/images/muffin-knight/terrain/rock-atlas.png";
    const guardianArt = new Image(); guardianArt.src = "/images/muffin-knight/terrain/guardian-atlas.png";
    const sealArt = new Image(); sealArt.src = "/images/muffin-knight/terrain/seal-atlas.png";
    const colossusArt = new Image(); colossusArt.src = "/images/muffin-knight/terrain/guardian-colossus-atlas.png";
    ruinsArt.current = { rocks: rockArt, guardian: guardianArt, seal: sealArt, colossus: colossusArt };
    void Promise.all([...images.current, burgerImage.current, ...backgrounds.current, rockArt, guardianArt, sealArt, colossusArt].map(img => img.decode())).then(() => { if (!disposed) setLoaded(true); }).catch(() => { if (!disposed) setAssetError(true); });
    const c = canvas.current?.getContext("2d"); if (!c) return;
    let frame = 0; let previous = 0; let accumulator = 0; let uiAt = 0;
    const animate = (now: number) => {
      const elapsed = previous ? Math.min(.06, (now - previous) / 1000) : 0; previous = now;
      const s = game.current; const oldMuffins = s.muffins; const oldHearts = s.hearts; const oldSecondHearts = s.secondPlayer?.hearts;
      if (s.phase === "playing") {
        accumulator += elapsed;
        while (accumulator >= 1 / 120) { stepKnight(s, input.current, 1 / 120, Math.random, secondInput.current); accumulator -= 1 / 120; }
      } else accumulator = 0;
      for (const event of s.events.splice(0)) { audio.current?.play(event); if (event.type === "win" || event.type === "lose") audio.current?.finish(); }
      if (!s.run.practice && (s.phase === "won" || s.phase === "lost") && s.score > bestRef.current[s.stage]) {
        bestRef.current[s.stage] = s.score; setBest([...bestRef.current]);
        try { localStorage.setItem(`${STORAGE_KEY}:${s.mode}`, JSON.stringify(bestRef.current)); } catch { /* Keep the in-memory score when storage is unavailable. */ }
      }
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.current && canvas.current.width !== 960 * scale) { canvas.current.width = 960 * scale; canvas.current.height = 600 * scale; }
      c.setTransform(scale, 0, 0, scale, 0, 0);
      drawKnight(c, s, images.current, burgerImage.current, backgrounds.current, s.fxTime, reduced.current, ruinsArt.current);
      if (now - uiAt > 80 || s.muffins !== oldMuffins || s.hearts !== oldHearts || s.secondPlayer?.hearts !== oldSecondHearts) { sync(); uiAt = now; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { disposed = true; cancelAnimationFrame(frame); audio.current?.close(); audio.current = null; };
  }, [sync, modeMenu]);
  useEffect(() => { audio.current?.setEnabled(!muted, !musicMuted); }, [muted, musicMuted, modeMenu]);
  useEffect(() => {
    const controlled = ["ArrowLeft", "ArrowRight", "ArrowDown", "KeyS", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyJ", "KeyX", "KeyC", "ShiftLeft", "ShiftRight", "KeyL", "Comma", "Period"];
    const down = (e: KeyboardEvent) => {
      if (modeMenu) return;
      if (game.current.phase === "draft") {
        if (/^Digit[123]$/.test(e.code) && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); const choice = game.current.run.offer[Number(e.code.slice(-1)) - 1]; if (choice) selectBlessing(choice); }
        return;
      }
      if (help) { if (e.code === "Escape") setHelp(false); return; }
      if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) { pause(); return; }
      if (game.current.phase !== "playing" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (controlled.includes(e.code)) {
        e.preventDefault();
        if (game.current.mode === "cpu" && (e.code.startsWith("Arrow") || e.code === "Comma" || e.code === "Period")) return;
        const second = !!game.current.secondPlayer && (e.code.startsWith("Arrow") || e.code === "Comma" || e.code === "Period");
        const actor = second ? game.current.secondPlayer! : game.current;
        const pressed = knightKeyboardInput(new Set([e.code]), !!game.current.secondPlayer, second);
        if (!e.repeat) {
          if (pressed.down) actor.player.dropBuffer = .13;
          if (pressed.jump) actor.player.jumpBuffer = .13;
          if (pressed.attack) actor.attackBuffer = .14;
          if (pressed.special) actor.specialBuffer = .15;
          if (pressed.dash) actor.mobility.dashBuffer = .16;
          if (pressed.left || pressed.right) actor.mobility.pressDirection = pressed.left ? -1 : 1;
        }
        keys.current.add(e.code); updateInput();
      }
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.code); updateInput(); };
    const blur = () => { clearInput(); if (game.current.phase === "playing") { game.current.phase = "paused"; audio.current?.pause(); sync(); } };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [clearInput, help, modeMenu, pause, sync, updateInput, selectBlessing]);
  const pointerProps = (action: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); if (game.current.phase !== "playing") return; e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, action); if (action === "left" || action === "right") game.current.mobility.pressDirection = action === "left" ? -1 : 1; if (action === "down") game.current.player.dropBuffer = .13; if (action === "jump") game.current.player.jumpBuffer = .13; if (action === "attack") game.current.attackBuffer = .14; if (action === "special") game.current.specialBuffer = .15; if (action === "dash") game.current.mobility.dashBuffer = .16; updateInput(); },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const specialLabel = view.beast===1 ? (view.stomach===null ? "吞入" : "吐擊") : view.beast===0 && view.perks.includes("spark") ? "撲躍" : view.beast===5 && view.perks.includes("echo") ? "蓄彈" : view.beast===4 && view.perks.includes("shell") ? "浪泡" : null;
  const stageIds = knightStages(view.mode);
  const nextStage = stageIds[stageIds.indexOf(view.stage) + 1];
  const modeLabel = view.mode === "solo" ? "1P 爬塔模式" : view.mode === "duo" ? "2P 模式" : "1P 和電腦模式";
  const partnerLabel = view.mode === "cpu" ? "CPU" : "2P";
  const active = BEASTS[view.beast]; const finished = view.phase === "won" || view.phase === "lost";
  const elapsed = `${Math.floor(view.time / 60).toString().padStart(2, "0")}:${Math.floor(view.time % 60).toString().padStart(2, "0")}`;
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}><span className={styles.brandIcon}><LuSun /></span><span>走走小日<small>WALK WALK · LITTLE DAYS</small></span></Link>
          <div className={styles.headerRight}><span className={styles.arcadeTag}>小日遊戲室</span><Link href="/" className={styles.back}><LuArrowLeft /> 回到小日</Link></div>
        </header>
        <div className={styles.titleRow}><div><p className={styles.eyebrow}>WALK WALK ARCADE · BURGER BRAWL</p><h1>小日獸<span>・</span>點心大作戰<span className={styles.titleSpark}><LuSparkles /></span></h1><p className={styles.subtitle}>收集漢堡，切換能力，突破敵群。</p></div>{!modeMenu && <div className={styles.best}><LuTrophy /><span>本關最佳紀錄<strong>{best[view.stage].toLocaleString()} <small>分</small></strong></span></div>}</div>
        {modeMenu ? <section className={styles.modeMenu} aria-label="選擇遊戲模式">
          <p className={styles.eyebrow}>CHOOSE YOUR ADVENTURE</p><h2>今天，和誰一起搶漢堡？</h2><p>選擇玩法，開始你的小日冒險。</p>
          <div className={styles.modeCards}>
            <button onClick={() => selectMode("solo")}><span>01 / SOLO</span><LuSun /><h3>1P 爬塔模式</h3><p>獨自挑戰星火遺跡，選擇招式，登上天階迎戰巨像。</p><b>一人鍵盤 · 守衛與爬塔 →</b></button>
            <button onClick={() => selectMode("duo")}><span>02 / LOCAL CO-OP</span><LuHeart /><h3>2P 模式</h3><p>和朋友共享鍵盤，搶漢堡、救氣泡，再一起闖進第 4 關的發條機關與小怪陣。</p><b>雙人同場 · 四座競技場 →</b></button>
            <button onClick={() => selectMode("cpu")}><span>03 / CPU PARTNER</span><LuSparkles /><h3>1P 和電腦模式</h3><p>電腦接替 2P 找路、收集與救援；一起過關，各自計數。</p><b>電腦隊友 · 同樣四個關卡 →</b></button>
          </div>
        </section> : <><div className={styles.modeBar}><strong>{modeLabel}</strong><span>{view.mode === "solo" ? "單人冒險" : "各自生命 · 氣泡互救 · 合計 15 個漢堡"}</span><button onClick={openModeMenu}>切換模式</button></div>
        <div className={styles.layout}>
          <section className={styles.gameColumn} aria-label="遊戲區">
            <nav className={styles.stageTabs} aria-label="選擇關卡">{stageIds.map((i, order) => { const stage = STAGES[i]; return <button key={stage.name} disabled={["playing", "paused", "draft"].includes(view.phase)} onClick={() => selectStage(i)} aria-pressed={view.stage === i} className={view.stage === i ? styles.selectedTab : ""}><span>0{order + 1}</span>{stage.name}{view.stage === i && <span className={styles.tabDot} />}</button>; })}</nav>
            <div className={styles.mechanicBanner}><LuSparkles /><div><strong>{STAGES[view.stage].mechanic}</strong><span>{STAGES[view.stage].rule}</span></div></div>
            {view.stage === 3 && <div className={styles.runStrip}>
              <div><span>{view.practice ? "守衛演練" : "本局招式"} {view.perks.length}/4</span><small>{view.tower ? `終局登塔 · ${Math.max(0,Math.round((548-view.tower.highestY)/10))} m` : `${["低位起步", "上行交會", "下行交會"][view.layout]} · 升降路線`}</small></div>
              <div className={styles.relayTrack}><strong>浣熊接力 {['Ⅰ', 'Ⅱ', 'Ⅲ'][view.rank - 1]}</strong><span>{view.rank === 1 ? "吸牆 → 蹬牆跳 → 衝刺" : view.rank === 2 ? "蹬牆蓄勢 → 破甲衝刺 · 空白鍵取消衝刺" : "全隊 Shift 衝刺 → 0.85 秒內 J 專屬接招"}</span><small>{view.rank < 3 ? `第 ${view.rank + 1} 次選卡進階 · ${view.rank === 1 ? 4 : 8} 漢堡` : "接力已解鎖"}</small></div>
              <p className={styles.affinitySummary}>已學招式的角色權重 ×10 起，可連續出場；連續兩次未抽中，下次保證回到已升級角色。</p>
              <div className={styles.perks}>{view.perks.length ? view.perks.map(id => <span key={id} title={`${BLESSINGS[id].text} ${BLESSINGS[id].combo}`}>{BLESSINGS[id].mark} {BLESSINGS[id].name}</span>) : <small>入場選擇第一項招式</small>}{view.shield > 0 && <span>◇ 護盾就緒</span>}</div>
              {view.boss && <div className={styles.bossHud}><strong>{view.bossDefeated ? `守衛已擊破` : `負星岩衛 ${GUARDIAN_PHASES[view.boss.tier ?? 0].name}`}</strong><progress aria-label="負星岩衛生命" value={view.boss.hp} max={view.boss.maxHp} /><small>{view.bossDefeated ? `漢堡 ${view.muffins}/15` : view.boss.phase === "awaken" ? "地層重構 · 留意岩階升降" : view.boss.phase === "ritual" ? ((view.boss.tier ?? 0) === 2 ? "崩星洪潮！登上綠邊高台" : "連鎖地裂！換台繞後") : (view.boss.exposed ?? 0) > 0 ? "星核過載 · 傷害 ×2" : view.boss.phase === "summon" ? "召喚岩靈 · 避開召喚圈" : view.boss.phase === "leap" || view.boss.phase === "leapWindup" ? "躍擊！離開金色落點" : view.boss.phase === "reshape" ? (view.terrain.pattern === "rampart" ? "岩階即將隆起 · 借勢上行" : "腳下平台下沉 · 準備跳離") : view.boss.phase === "windup" ? ((view.boss.tier ?? 0) === 2 ? "三連掌預告！穿過掌間空隙" : view.boss.attack === "sigil" ? "落印預告！離開標記" : "震擊預告！準備換層") : view.anchorsLeft > 0 ? `${view.tower ? "向上破除鎖星" : "先破高台封印"} ${view.anchorsLeft}/${view.tower ? 3 : 2}` : "核心暴露 ×1.5"}</small></div>}
            </div>}
            <div ref={arena} className={styles.arena}>
              <div className={styles.hud}>
                <div className={styles.collect}><span className={styles.muffinIcon}><img src={BURGER_IMAGE} alt="漢堡" width={31} height={31} /></span><span><small>{view.secondPlayer ? "雙人合計" : "漢堡收集"}</small><strong data-testid="muffins">{view.muffins}<em> / {WORLD.target}</em></strong></span></div>
                {!view.secondPlayer && <div className={styles.health} aria-label={`剩餘 ${view.hearts} 顆愛心`}>{[0, 1, 2].map(i => <LuHeart key={i} className={i < view.hearts ? styles.fullHeart : styles.emptyHeart} />)}</div>}
                <div className={styles.score}><small>SCORE</small><strong data-testid="score">{view.score.toString().padStart(4, "0")}</strong></div>
                <button className={styles.iconButton} aria-label={muted ? "開啟音效" : "關閉音效"} onClick={() => setMuted(!muted)}>{muted ? <LuVolumeX /> : <LuVolume2 />}</button>
                <button className={styles.iconButton} aria-label={view.phase === "paused" ? "繼續遊戲" : "暫停遊戲"} disabled={view.phase !== "playing" && view.phase !== "paused"} onClick={pause}>{view.phase === "paused" ? <LuPlay /> : <LuPause />}</button>
              </div>
              {view.secondPlayer && <div className={styles.coopStrip} aria-label="雙人生命與漢堡計數">
                {[{ id: 1, beast: view.beast, hearts: view.hearts, bubbled: view.bubbled, collected: view.collected }, { id: 2, ...view.secondPlayer }].map(actor => <div key={actor.id}>
                  <strong>{actor.id === 2 ? partnerLabel : "1P"} · {BEASTS[actor.beast].name}</strong><span>漢堡 <b data-testid={`p${actor.id}-muffins`}>{actor.collected}</b></span>
                  <div className={styles.coopHealth} role="status" aria-label={`${actor.id === 2 ? partnerLabel : "1P"} 剩餘 ${actor.hearts} 顆愛心${actor.bubbled ? "，氣泡等待救援" : ""}`} data-testid={`p${actor.id}-health`} data-hearts={actor.hearts} data-bubbled={actor.bubbled}>
                    {[0, 1, 2].map(i => <LuHeart key={i} className={i < actor.hearts ? styles.fullHeart : styles.emptyHeart} />)}
                    <em>{actor.bubbled ? "氣泡中 · 隊友碰觸救回" : "各自生命 · 碰觸氣泡救隊友"}</em>
                  </div>
                  <small>{actor.id === 1 ? "A / D 移動 · W / 空白跳躍 · S 穿落 · J / X 攻擊" : view.mode === "cpu" ? "電腦自動操作 · 優先救援氣泡中的你" : "← → 移動 · ↑ 跳躍 · ↓ 穿落 · < 攻擊"}</small>
                </div>)}
              </div>}
              <div className={styles.canvasWrap}>
                <canvas ref={canvas} tabIndex={0} width={960} height={600} aria-label={view.secondPlayer ? "雙人平台遊戲。1P：A、D 移動，W 或空白跳躍，S 穿落，J 或 X 攻擊。2P：方向鍵移動、跳躍及穿落，< 攻擊。P 暫停。" : "小日獸平台遊戲。方向鍵移動、下鍵穿落平台、空白鍵跳躍、J 使用能力、C 特殊招式、Shift 浣熊接力、P 暫停。"} data-phase={view.phase} data-beast={active.id} />
                <div className={styles.location}>{STAGES[view.stage].tag}<span>{elapsed}</span></div>
                {view.phase === "playing" && view.notice && <div className={styles.notice} key={view.notice}><LuSparkles /> {view.notice}</div>}
                {(view.phase === "ready" || view.phase === "paused" || finished) && <div className={styles.overlay}>
                  <div className={styles.dialog} role="dialog" aria-modal={view.phase !== "ready"} aria-labelledby="game-dialog-title">
                    <div className={styles.dialogStamp}>{finished ? (view.phase === "won" ? <LuTrophy /> : <LuHeart />) : view.phase === "paused" ? <LuPause /> : <LuSun />}</div>
                    <p className={styles.eyebrow}>{view.phase === "ready" ? "CHOOSE YOUR BEAST" : view.phase === "paused" ? "PAUSED" : view.phase === "won" ? "STAGE CLEAR" : "RUN COMPLETE"}</p>
                    <h2 id="game-dialog-title">{view.phase === "ready" ? (view.secondPlayer ? "雙人搶漢堡，一起開打！" : "選好角色，準備開打。") : view.phase === "paused" ? "遊戲暫停" : view.phase === "won" ? "挑戰成功！" : "挑戰結束"}</h2>
                    <p>{view.phase === "ready" ? STAGES[view.stage].rule : view.phase === "paused" ? "調整節奏，再次進場。" : view.phase === "won" ? (view.stage === 3 ? "遺跡守衛擊破！本局招式組合完成挑戰。" : nextStage === undefined ? "15 個漢堡到手！四座競技場挑戰完成。" : "15 個漢堡到手！前往下一座競技場。") : view.secondPlayer ? "兩人都變成氣泡了！再一起挑戰，記得碰觸氣泡救隊友。" : "換一位小日獸，挑戰更高分數。"}</p>
                    {view.phase === "ready" && <div className={styles.introSteps}><span><b>01</b> 收集漢堡</span><LuChevronRight /><span><b>02</b> 小日獸變身</span><LuChevronRight /><span><b>03</b> {STAGES[view.stage].mechanic}</span></div>}
                    {finished && view.secondPlayer && <p className={styles.coopResult}>1P 吃到 {view.collected} 個 · {partnerLabel} 吃到 {view.secondPlayer.collected} 個</p>}
                    {finished && <div className={styles.results}><span><strong>{view.score}</strong>本次得分</span><span><strong>{view.muffins}<small> / 15</small></strong>漢堡收集</span><span><strong>{view.bestCombo}</strong>最高連擊</span></div>}
                    <button className={styles.primaryButton} disabled={!loaded} onClick={() => view.phase === "paused" ? (pause(), canvas.current?.focus({ preventScroll: true })) : view.practice ? startPractice(view.practiceTier) : start(view.stage, view.phase === "ready" ? view.beast : view.stage === 3 ? 3 : 0)}><LuPlay />{assetError ? "素材載入失敗，請重新整理" : !loaded ? "載入角色與場景…" : view.phase === "ready" ? "開始挑戰" : view.phase === "paused" ? "繼續遊戲" : "再玩一次"}</button>
                    {view.phase === "won" && nextStage !== undefined && <button className={styles.textButton} onClick={() => start(nextStage, nextStage === 3 ? 3 : 0)}>前往{STAGES[nextStage].name} <LuArrowRight /></button>}
                    {view.phase === "paused" && <button className={styles.textButton} onClick={() => selectStage(view.stage)}><LuRotateCcw /> 回到準備畫面</button>}
                    {view.phase === "ready" && <small className={styles.dialogFoot}>{view.stage === 3 ? "四次招式選擇 · 每 4 個漢堡恢復一顆生命" : "合計 15 個漢堡過關 · 每人三顆生命 · 碰觸氣泡救隊友"}</small>}
                  </div>
                </div>}
              </div>
              <div className={styles.abilityBar}><span>{active.skill}</span><div role="progressbar" aria-label="能力恢復" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, 1 - view.cooldown / view.cooldownDuration) * 100)}><i style={{ width: `${Math.max(0, 1 - view.cooldown / view.cooldownDuration) * 100}%` }} /></div><small>下次變身：{BEASTS[view.nextBeast].name}</small></div>
              {view.stage === 3 && view.beast === 0 && view.perks.includes("spark") && <div className={styles.swallowStatus}>{view.rollTime > 0 ? "↻ 翻滾躍擊 · 前段無敵 → 俯落" : view.grounded || view.jumps < 2 ? "空中再按跳躍：二段翻滾 · 無敵 0.36 秒" : "翻滾已使用 · 落地重置"}</div>}
              {view.stage === 3 && view.beast === 6 && view.perks.includes("haste") && <div className={styles.swallowStatus}>{view.mobility.strideTime > 0 ? "↟ 長腳跨岩！" : view.mobility.strideUsed ? "跨岩已使用 · 落地重置" : "貼住岩壁再按跳躍：長腳向上蹬，跨上岩頂"}</div>}
              {view.stage === 3 && view.beast === 4 && view.perks.includes("shell") && <div className={styles.swallowStatus}>{view.mobility.sealRollTime > 0 ? "↻ 潮汐翻滾" : view.mobility.sealRollCooldown > 0 ? `翻滾恢復 ${view.mobility.sealRollCooldown.toFixed(1)}s` : "← ← 或 → → 同方向連按兩下：向前翻滾"}</div>}
              {(view.beast === 1 || view.stomach !== null) && <div className={styles.swallowStatus} aria-live="polite">{view.stomach === null ? "C 吞入前方怪物 → 再按 C 吐出穿透彈" : view.beast === 1 ? `● 已吞入${["普通", "強化", "巨型"][view.stomach]}怪物 · C 吐擊` : "● 怪物彈已保留，變回青蛙可吐出"}</div>}
              {(view.beast === 3 || view.relay) && <div className={styles.relayStatus} aria-live="polite"><strong>{view.mobility.relayTime > 0 ? `J 接招：${RELAY_FINISHERS[view.beast]}` : view.mobility.momentum > 0 ? "蓄勢就緒 · 衝刺破甲" : view.mobility.wall ? "吸牆中 · 空白鍵蹬牆" : view.mobility.dashCooldown > 0 ? `衝刺恢復 ${view.mobility.dashCooldown.toFixed(1)}s` : view.relay ? "Shift / L 浣熊接力" : "Shift / L 衝刺 · 推住牆面吸附"}</strong><div><i style={{width: `${view.mobility.relayTime > 0 ? view.mobility.relayTime / .85 * 100 : Math.max(0, 1 - view.mobility.dashCooldown / (view.beast === 3 ? .6 : 1.35)) * 100}%`}} /></div></div>}
              {specialLabel && view.beast!==1 && <div className={styles.swallowStatus} aria-live="polite">{view.beast===5 ? (view.mobility.coilActive ? `盤身蓄力 ${Math.round(view.mobility.coilCharge/.7*100)}% · 放開彈射` : "C 按住蓄力 → 放開彈射；方向控制斜飛") : view.beast===0 ? "C 撲向前方敵人 → 命中借力躍高 → 可再撲" : "C 放浪泡 → 跳起踩泡彈高；爆泡清敵清震波"}{view.specialCooldown>0 ? ` · 冷卻 ${view.specialCooldown.toFixed(1)}s` : (view.beast===5 && view.mobility.coilUsed) || (view.beast===0 && view.mobility.pounceUsed) || (view.beast===4 && view.mobility.bubbleUsed) ? " · 落地重置" : " · 可使用"}</div>}
              <div className={styles.terrainHint}>{view.dropTime > 0 ? "↓ 穿落換層" : "薄平台 ↓ / S 穿落"}{view.tower ? " · 巨像身體可穿越；小心預告掌擊與洪潮" : view.stage === 3 && " · 搭升降台上行，岩壁可蹬牆"}</div>
              <div className={styles.controlBar}>
                <div className={styles.moveControls}><button aria-label="向左移動" {...pointerProps("left")}><LuArrowLeft /></button><button aria-label="向右移動" {...pointerProps("right")}><LuArrowRight /></button><button aria-label="向下穿過平台" title="↓ / S 穿落平台" {...pointerProps("down")}><LuArrowDown /></button><span>{view.secondPlayer ? "1P · A / D · S" : "A / D · ↓ / S"}<br /><small>移動 · 穿落</small></span></div>
                <div className={styles.actionControls}><button aria-label="跳躍" {...pointerProps("jump")}><LuArrowUp /><span>跳躍<small>SPACE</small></span></button><button aria-label="使用能力" className={styles.attackButton} {...pointerProps("attack")}><LuSparkles /><span>能力<small>J / X</small></span></button>{(view.beast === 3 || view.relay) && <button aria-label="浣熊接力衝刺" className={styles.relayButton} {...pointerProps("dash")}><span>{view.relay ? "接力" : "衝刺"}<small>SHIFT / L</small></span></button>}{specialLabel && <button aria-label={specialLabel} className={styles.specialButton} {...pointerProps("special")}><span>{specialLabel}<small>{view.beast===5 ? "按住 C" : "C"}</small></span></button>}</div>
              </div>
              {view.phase === "draft" && <div className={styles.draftBackdrop}><section className={styles.draftDialog} role="dialog" aria-modal="true" aria-labelledby="draft-title" onKeyDown={e => {
                if (e.key !== "Tab") return;
                const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
              }}>
                <p className={styles.draftEyebrow}>BEAST TECHNIQUE / {String(view.drafts).padStart(2, "0")} OF 04</p><h2 id="draft-title">這次，練哪一位的絕招？</h2><p className={styles.draftIntro}>選到角色相關技能，該小日獸出現率提高。技能與接力進階持續至本局結束。{view.muffins > 0 && "補給：恢復 1 顆生命，上限 3 顆。"}</p>
                <p className={styles.draftUpgrade}>{view.perks.length === 1 ? "本次同時解鎖：浣熊 II・蹬牆蓄勢破甲" : view.perks.length === 2 ? "本次同時解鎖：浣熊 III・全隊殘影接力" : view.perks.length === 0 ? "浣熊 I・吸牆與蹬牆跳已就緒" : "接力 III 持續生效・準備迎戰守衛"}</p><div className={styles.blessingCards}>{view.offer.map((id, i) => { const b = BLESSINGS[id]; return <button key={id} data-blessing={id} onClick={() => selectBlessing(id)} >
                  <span className={styles.cardTop}><span>{b.tag}</span><kbd>{i + 1}</kbd></span><span className={styles.blessingMark}><span role="img" aria-label={BEASTS[BLESSING_BEASTS[id][0]].name} style={portraitStyle(BEASTS[BLESSING_BEASTS[id][0]].id)} /></span><strong>{b.name}</strong><span className={styles.cardText}>{b.text}</span><span className={styles.cardAffinity}>{BLESSING_BEASTS[id].map(i => BEASTS[i].name).join("・")} 出現權重 +9 · 可連續出場</span><span className={styles.cardCombo}>{b.combo}</span><span className={styles.cardChoose}>習得招式 →</span>
                </button>; })}</div>
                <div className={styles.draftFoot}><span>生命 {view.hearts}/3 · {view.muffins}/15 漢堡 · 按 1 / 2 / 3 選擇</span><button onClick={() => selectStage(view.stage)}>結束本局</button></div>
              </section></div>}
            </div>
            <div className={styles.settings}><button aria-pressed={!musicMuted} onClick={() => setMusicMuted(!musicMuted)}><LuMusic2 />音樂 {musicMuted ? "關" : "開"}</button><button aria-pressed={!reduceFx} onClick={() => { reduced.current = !reduceFx; setReduceFx(!reduceFx); }}>動態特效 {reduceFx ? "低" : "標準"}</button><Link href="/muffin-knight/sprites">動作圖集 ↗</Link></div>
            <div className={styles.belowGame}><span><span className={styles.liveDot} />{STAGES[view.stage].subtitle}</span><button onClick={() => { if (game.current.phase === "playing") pause(); setHelp(true); }}>玩法說明</button><button aria-label="切換全螢幕" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else if (arena.current?.requestFullscreen) void arena.current.requestFullscreen().catch(() => {}); }}><LuMaximize /></button></div>
          </section>
          <aside className={styles.sidebar}>
            <section className={styles.devSwitch} aria-label="開發快速切關"><p>DEV / 快速切關</p><div>{stageIds.map((i, order) => { const stage = STAGES[i]; return <button key={stage.name} aria-label={`開發切換第${order + 1}關${stage.name}`} aria-pressed={view.stage === i} onClick={() => { selectStage(i); setHelp(false); }}><b>0{order + 1}</b>{stage.name}</button>; })}</div>{view.mode === "solo" && <><button className={styles.guardianPractice} onClick={() => startPractice()}>第四關・守衛演練 ↗</button><div className={styles.phasePractice}><button onClick={() => startPractice(1)}>守衛 II・裂地</button><button onClick={() => startPractice(2)}>守衛 III・登塔</button></div><small>演練使用目前角色與升級 · 不計紀錄</small></>}</section>
            <div className={styles.companionHeader}><div><p className={styles.eyebrow}>BEAST SELECT / ABILITY</p><h2>{view.secondPlayer ? "1P 的戰鬥方式" : "選擇你的戰鬥方式"}</h2></div><span>0{view.beast + 1}</span></div>
            <div className={styles.activeBeast} style={{ "--beast-color": active.color } as React.CSSProperties}><span className={styles.beastBadge}>{view.phase === "ready" ? "起始角色" : "目前小日獸"}</span><div className={styles.portraitHalo}><span className={styles.spritePortrait} role="img" aria-label={active.name} style={portraitStyle(active.id)} /></div><h3>{active.name}</h3><span className={styles.skill}><LuSparkles />{active.skill}</span><p>{active.hint}</p></div>
            <div className={styles.rosterHeader}><strong>{view.stage === 3 ? "本局出場傾向" : "變身順序"}</strong><span>{view.phase === "ready" ? "點選起始角色" : (view.stage === 3 ? "金框角色優先・可連續出場" : "每個漢堡，都會變身")}</span></div>
            <div className={styles.roster}>{BEASTS.map((beast, i) => <button key={beast.id} className={`${i === view.beast ? styles.activeRoster : ""} ${view.weights[i] > 1 ? styles.favoredRoster : ""}`} onClick={() => { if (game.current.phase === "ready") { game.current.beast = i; sync(); } }} disabled={view.phase !== "ready"} aria-label={`選擇${beast.name}`} aria-pressed={view.beast === i}><i className={styles.rosterPortrait} style={portraitStyle(beast.id)} /><span>{beast.name}<small>{view.stage === 3 && view.weights[i] > 1 ? `★ 優先 · 抽選占比 ${Math.round(view.chances[i] * 100)}%` : view.stage === 3 && view.perks.length ? `抽選占比 ${Math.round(view.chances[i] * 100)}%` : beast.skill}</small></span>{i === view.beast ? <LuCheck /> : <span className={styles.rosterIndex}>0{i + 1}</span>}</button>)}</div>
            <div className={styles.tip}><LuSun /><p>三秒內連續擊倒敵人，<br />連擊分數最高提升至四倍。</p></div>
          </aside>
        </div>
        </>}
        <footer className={styles.footer}><span>走走小日 <span> / </span> 七種能力・四座競技場</span><span>WALK WALK ARCADE <LuSun /></span></footer>
      </div>
      {help && <div className={styles.helpBackdrop} onClick={() => setHelp(false)}><div className={styles.helpDialog} role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button aria-label="關閉說明" className={styles.closeHelp} onClick={() => setHelp(false)}><LuX /></button><p className={styles.eyebrow}>HOW TO PLAY</p><h2 id="help-title">操作與計分</h2>{view.mode === "cpu" && <p>CPU 自動找路、收集漢堡與攻擊附近敵人，你變成氣泡時會優先前來救援。CPU 也會受傷，記得救回它！</p>}{view.secondPlayer && <p><strong>第 1～4 關：合作模式</strong><br />1P：A / D 移動、W / 空白跳躍、S 穿落、J / X 攻擊、C 青蛙吞吐。<br />2P：← / → 移動、↑ 跳躍、↓ 穿落、&lt; 攻擊、&gt; 青蛙吞吐。&lt; / &gt; 使用逗號／句號鍵，不需要按 Shift。<br />每人各有三顆生命，共用總分與 15 個漢堡的通關進度；各自計算漢堡數量，吃到的人變身。生命耗盡會變成漂浮氣泡，無法攻擊或收集漢堡；隊友碰觸氣泡即可救回，恢復一顆心並獲得兩秒無敵。兩人都變成氣泡才會挑戰失敗。下方觸控按鈕控制 1P。</p>}<p>合作模式四關合計收集 15 個漢堡過關；單人星火遺跡還需擊敗守衛。每吃一個就會抽選角色；單人遺跡已升級角色權重為 10 起，可連續出場，連續兩次未抽中就保證回到已升級角色；依技能權重抽選，並獲得短暫保護。</p><ul><li><strong>移動</strong>　{view.secondPlayer ? "1P：A / D；2P：← / →" : "← → 或 A / D"}</li><li><strong>跳躍</strong>　{view.secondPlayer ? "1P：空白鍵 / W；2P：↑。" : "空白鍵、↑ 或 W；"}短按小跳、長按高跳；公雞可二段跳</li><li><strong>能力</strong>　{view.secondPlayer ? "1P 按住 J / X；2P 按住 <，連續使用" : "按住 J / X 連續使用"}</li><li><strong>青蛙吞吐</strong>　C 吞下前方怪物，再按一次吐擊；強敵需先削弱。吞入的彈藥在變身後仍保留。</li><li><strong>浣熊</strong>　推向牆壁吸附，空白鍵蹬牆；J 或 Shift／L 衝刺。第二次選卡後，蹬牆後衝刺可破甲，衝刺中可跳躍取消。</li><li><strong>接力 III</strong>　第三次選卡後，全角色可按 Shift／L 召喚浣熊殘影衝刺，0.85 秒內 J 接專屬招式；每次滯空限一次衝刺。</li><li><strong>獵犬升級</strong>　C 朝前方敵人撲躍，命中反彈躍高並重置撲躍，沒命中則每次滯空一次。空中再次跳躍仍可翻滾閃避。</li><li><strong>鴕鳥升級</strong>　靠近岩壁再按跳躍，以長腳向上蹬岩，單次滯空限一次。</li><li><strong>魯魯升級</strong>　C 放出浪泡，跳起落在泡上彈高，爆泡傷敵並清除震波。每次滯空一顆、持續 4 秒；雙按方向仍可翻滾。</li><li><strong>蛇升級</strong>　按住 C 盤身，放開向上彈射，搭配方向斜飛；滿蓄短暫無敵。每次滯空限一次，落地重置。</li><li><strong>穿落</strong>　↓ / S，穿過腳下薄平台；岩塊與地面不可穿落</li><li><strong>暫停</strong>　P / Esc；離開視窗會自動暫停</li></ul><p><strong>{STAGES[view.stage].mechanic}</strong>：{STAGES[view.stage].rule} {STAGES[view.stage].subtitle}</p>{view.stage === 3 && <p>開場及 4／8／12 個漢堡時三選一，最多四項招式；每 4 個漢堡回復一顆生命。場景寬 2160，穿越入口、水道與機關庭。寬闊固定平台、兩座高岩壁與低岩階構成戰場，三座升降木平台連接高低路線；薄平台按 ↓ / S 可穿落，按住不會連續穿過多層；一般角色搭升降台，浣熊可蹬牆抄近路，鴕鳥升級後可長腳跨岩。先打破高台上的兩枚封印，橋面會下降，守衛核心才可受傷。震擊會沿地面與腳下平台傳播，要換層或跳開。守衛體型加大，會依你的位置追擊、越過阻礙，並重塑地形：琥珀預告後岩階隆起或腳下平台下沉，其餘升降台上行成為逃生路線。守衛會跳到平台：金色落點鎖定後不會追蹤，換層躲開再反擊。紅色落印先預警才爆發。守衛停手時受到 1.5 倍傷害。血量低於 66% 進入崩解：岩壁崩降、岩階抬升，三道地裂按預告位置依序爆發。低於 33% 才進入終局天階：原場景崩升為縱向戰場，玩家從根部大廳向上攀登，鏡頭跟隨高度。沿途寬台、升降木台和攀岩近路交錯；落地點亮營火，失足扣一顆心並回到最近存點。巨像軀幹可穿越且不造成接觸傷害；護甲未解除時，子彈穿過身體直達封印石。向上擊碎三枚鎖星岩晶，每枚回復一顆心、中斷預告攻擊並提供短暫保護，全部破除後巨像核心可受傷。獵犬 C 優先撲擊範圍內的岩晶，浣熊可直接衝刺拆封印。多臂三連掌鎖定落點；洪潮預告 2 秒後從腳下上升，繼續登高避開。大招結束過載 3 秒，反擊傷害 ×2；右側「守衛 III・登塔」可直接試玩。第二階段起召喚岩靈，場上最多 6 隻。重新開始會重抽招式與升降節奏。</p>}<p>手機可同時按住方向與跳躍／能力。碰到敵人或掉落會失去一顆愛心。{view.stage === 0 ? "第一關為固定難度：怪物一擊可打倒，掉落回場也不會強化；每 5.5 秒出怪，最多同時 3 隻。" : "掉出場景的敵人會從上方變大回來：強化怪需 2 次命中，巨型怪需 3 次並會蓄力衝撞！"}</p><p>漢堡 +100 分，普通怪 +25 分。{view.stage !== 0 && "強化怪 +50 分、巨型怪 +100 分。"}3 秒內連續擊倒可累積連擊，擊倒分數最高四倍。過關時每顆剩餘愛心再加 200 分。</p><button className={styles.primaryButton} onClick={() => setHelp(false)}>知道了</button></div></div>}
    </main>
  );
}

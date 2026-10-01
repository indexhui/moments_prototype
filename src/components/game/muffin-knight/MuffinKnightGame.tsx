"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuArrowLeft, LuArrowRight, LuArrowUp, LuCheck, LuChevronRight, LuHeart, LuMusic2, LuMaximize, LuPause, LuPlay, LuRotateCcw, LuSparkles, LuSun, LuTrophy, LuVolume2, LuVolumeX, LuX } from "react-icons/lu";
import { BEASTS, BURGER_IMAGE, STAGES, WORLD, createKnightState, stepKnight, type Input, type KnightState } from "@/lib/game/muffinKnight";
import { KnightAudio } from "./KnightAudio";
import { spritePath, portraitStyle } from "./knightSprites";
import { drawKnight } from "./drawKnight";
import styles from "./MuffinKnightGame.module.css";

const STORAGE_KEY = "moment:muffin-knight:best:v1";
const emptyInput = (): Input => ({ left: false, right: false, jump: false, attack: false });
const snapshot = (s: KnightState) => ({ phase: s.phase, stage: s.stage, beast: s.beast, hearts: s.hearts, score: s.score, muffins: s.muffins, kills: s.kills, bestCombo: s.bestCombo, time: s.time, notice: s.noticeTime > 0 ? s.notice : "", cooldown: Math.max(0, s.attackCooldown) });
type View = ReturnType<typeof snapshot>;

export default function MuffinKnightGame() {
  const game = useRef<KnightState>(createKnightState());
  const canvas = useRef<HTMLCanvasElement>(null);
  const arena = useRef<HTMLDivElement>(null);
  const input = useRef<Input>(emptyInput());
  const keys = useRef(new Set<string>());
  const pointers = useRef(new Map<number, keyof Input>());
  const images = useRef<HTMLImageElement[]>([]);
  const burgerImage = useRef<HTMLImageElement | null>(null);
  const audio = useRef<KnightAudio | null>(null);
  const backgrounds = useRef<HTMLImageElement[]>([]);
  const reduced = useRef(false);
  const bestRef = useRef<number[]>([0, 0, 0]);
  const [best, setBest] = useState([0, 0, 0]);
  const [view, setView] = useState<View>(() => snapshot(game.current));
  const [muted, setMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [reduceFx, setReduceFx] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [help, setHelp] = useState(false);
  const sync = useCallback(() => setView(snapshot(game.current)), []);
  const clearInput = useCallback(() => { keys.current.clear(); pointers.current.clear(); input.current = emptyInput(); }, []);
  const updateInput = useCallback(() => {
    const held = [...pointers.current.values()]; const k = keys.current;
    input.current = { left: k.has("ArrowLeft") || k.has("KeyA") || held.includes("left"), right: k.has("ArrowRight") || k.has("KeyD") || held.includes("right"), jump: k.has("Space") || k.has("ArrowUp") || k.has("KeyW") || held.includes("jump"), attack: k.has("KeyJ") || k.has("KeyX") || held.includes("attack") };
  }, []);
  const start = (stage = game.current.stage, beast = game.current.beast) => {
    clearInput(); game.current = createKnightState(stage); game.current.beast = beast; game.current.phase = "playing"; setHelp(false);
    void audio.current?.unlock();
    sync(); canvas.current?.focus({ preventScroll: true });
  };
  const pause = useCallback(() => {
    const s = game.current; if (s.phase === "playing") { s.phase = "paused"; audio.current?.pause(); } else if (s.phase === "paused") { s.phase = "playing"; void audio.current?.unlock(); }
    clearInput(); sync();
  }, [clearInput, sync]);
  const selectStage = (stage: number) => { audio.current?.pause(); clearInput(); game.current = createKnightState(stage); sync(); };
  useEffect(() => {
    let disposed = false;
    audio.current = new KnightAudio();
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; setReduceFx(reduced.current);
    try { const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); if (Array.isArray(saved)) { bestRef.current = [0, 1, 2].map(i => typeof saved[i] === "number" && Number.isFinite(saved[i]) ? Math.max(0, saved[i]) : 0); setBest([...bestRef.current]); } } catch { /* Private browsing still supports the current session. */ }
    images.current = BEASTS.map(beast => { const img = new Image(); img.src = spritePath(beast.id); return img; });
    burgerImage.current = new Image();
    burgerImage.current.src = BURGER_IMAGE;
    backgrounds.current = ["forest", "rooftop", "moonlight"].map(id => { const img = new Image(); img.src = `/images/muffin-knight/environments/${id}.png`; return img; });
    void Promise.all([...images.current, burgerImage.current, ...backgrounds.current].map(img => img.decode())).then(() => { if (!disposed) setLoaded(true); }).catch(() => { if (!disposed) setAssetError(true); });
    const c = canvas.current?.getContext("2d"); if (!c) return;
    let frame = 0; let previous = 0; let accumulator = 0; let uiAt = 0;
    const animate = (now: number) => {
      const elapsed = previous ? Math.min(.06, (now - previous) / 1000) : 0; previous = now;
      const s = game.current; const oldMuffins = s.muffins; const oldHearts = s.hearts;
      if (s.phase === "playing") {
        accumulator += elapsed;
        while (accumulator >= 1 / 120) { stepKnight(s, input.current, 1 / 120); accumulator -= 1 / 120; }
      } else accumulator = 0;
      for (const event of s.events.splice(0)) { audio.current?.play(event); if (event.type === "win" || event.type === "lose") audio.current?.finish(); }
      if ((s.phase === "won" || s.phase === "lost") && s.score > bestRef.current[s.stage]) {
        bestRef.current[s.stage] = s.score; setBest([...bestRef.current]);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bestRef.current)); } catch { /* Keep the in-memory score when storage is unavailable. */ }
      }
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.current && canvas.current.width !== 960 * scale) { canvas.current.width = 960 * scale; canvas.current.height = 600 * scale; }
      c.setTransform(scale, 0, 0, scale, 0, 0);
      drawKnight(c, s, images.current, burgerImage.current, backgrounds.current, s.fxTime, reduced.current);
      if (now - uiAt > 80 || s.muffins !== oldMuffins || s.hearts !== oldHearts) { sync(); uiAt = now; }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => { disposed = true; cancelAnimationFrame(frame); audio.current?.close(); audio.current = null; };
  }, [sync]);
  useEffect(() => { audio.current?.setEnabled(!muted, !musicMuted); }, [muted, musicMuted]);
  useEffect(() => {
    const controlled = ["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyJ", "KeyX"];
    const down = (e: KeyboardEvent) => {
      if (help) { if (e.code === "Escape") setHelp(false); return; }
      if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat) { pause(); return; }
      if (game.current.phase !== "playing" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (controlled.includes(e.code)) { e.preventDefault(); if (!e.repeat && ["Space", "ArrowUp", "KeyW"].includes(e.code)) game.current.player.jumpBuffer = .13; if (!e.repeat && ["KeyJ", "KeyX"].includes(e.code)) game.current.attackBuffer = .14; keys.current.add(e.code); updateInput(); }
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.code); updateInput(); };
    const blur = () => { clearInput(); if (game.current.phase === "playing") { game.current.phase = "paused"; audio.current?.pause(); sync(); } };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur); document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility); };
  }, [clearInput, help, pause, sync, updateInput]);
  const pointerProps = (action: keyof Input) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); if (game.current.phase !== "playing") return; e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, action); if (action === "jump") game.current.player.jumpBuffer = .13; if (action === "attack") game.current.attackBuffer = .14; updateInput(); },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onLostPointerCapture: (e: React.PointerEvent<HTMLButtonElement>) => { pointers.current.delete(e.pointerId); updateInput(); },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });
  const active = BEASTS[view.beast]; const finished = view.phase === "won" || view.phase === "lost";
  const elapsed = `${Math.floor(view.time / 60).toString().padStart(2, "0")}:${Math.floor(view.time % 60).toString().padStart(2, "0")}`;
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}><span className={styles.brandIcon}><LuSun /></span><span>走走小日<small>WALK WALK · LITTLE DAYS</small></span></Link>
          <div className={styles.headerRight}><span className={styles.arcadeTag}>小日遊戲室</span><Link href="/" className={styles.back}><LuArrowLeft /> 回到小日</Link></div>
        </header>
        <div className={styles.titleRow}><div><p className={styles.eyebrow}>WALK WALK ARCADE · BURGER BRAWL</p><h1>小日獸<span>・</span>點心大作戰<span className={styles.titleSpark}><LuSparkles /></span></h1><p className={styles.subtitle}>收集漢堡，切換能力，突破敵群。</p></div><div className={styles.best}><LuTrophy /><span>本關最佳紀錄<strong>{best[view.stage].toLocaleString()} <small>分</small></strong></span></div></div>
        <div className={styles.layout}>
          <section className={styles.gameColumn} aria-label="遊戲區">
            <nav className={styles.stageTabs} aria-label="選擇關卡">{STAGES.map((stage, i) => <button key={stage.name} disabled={view.phase === "playing" || view.phase === "paused"} onClick={() => selectStage(i)} aria-pressed={view.stage === i} className={view.stage === i ? styles.selectedTab : ""}><span>0{i + 1}</span>{stage.name}{view.stage === i && <span className={styles.tabDot} />}</button>)}</nav>
            <div className={styles.mechanicBanner}><LuSparkles /><div><strong>{STAGES[view.stage].mechanic}</strong><span>{STAGES[view.stage].rule}</span></div></div>
            <div ref={arena} className={styles.arena}>
              <div className={styles.hud}>
                <div className={styles.collect}><span className={styles.muffinIcon}><img src={BURGER_IMAGE} alt="漢堡" width={31} height={31} /></span><span><small>漢堡收集</small><strong data-testid="muffins">{view.muffins}<em> / {WORLD.target}</em></strong></span></div>
                <div className={styles.health} aria-label={`剩餘 ${view.hearts} 顆愛心`}>{[0, 1, 2].map(i => <LuHeart key={i} className={i < view.hearts ? styles.fullHeart : styles.emptyHeart} />)}</div>
                <div className={styles.score}><small>SCORE</small><strong data-testid="score">{view.score.toString().padStart(4, "0")}</strong></div>
                <button className={styles.iconButton} aria-label={muted ? "開啟音效" : "關閉音效"} onClick={() => setMuted(!muted)}>{muted ? <LuVolumeX /> : <LuVolume2 />}</button>
                <button className={styles.iconButton} aria-label={view.phase === "paused" ? "繼續遊戲" : "暫停遊戲"} disabled={view.phase !== "playing" && view.phase !== "paused"} onClick={pause}>{view.phase === "paused" ? <LuPlay /> : <LuPause />}</button>
              </div>
              <div className={styles.canvasWrap}>
                <canvas ref={canvas} tabIndex={0} width={960} height={600} aria-label="小日獸平台遊戲。方向鍵移動、空白鍵跳躍、J 使用能力、P 暫停。" data-phase={view.phase} data-beast={active.id} />
                <div className={styles.location}>{STAGES[view.stage].tag}<span>{elapsed}</span></div>
                {view.phase === "playing" && view.notice && <div className={styles.notice} key={view.notice}><LuSparkles /> {view.notice}</div>}
                {(view.phase === "ready" || view.phase === "paused" || finished) && <div className={styles.overlay}>
                  <div className={styles.dialog} role="dialog" aria-modal={view.phase !== "ready"} aria-labelledby="game-dialog-title">
                    <div className={styles.dialogStamp}>{finished ? (view.phase === "won" ? <LuTrophy /> : <LuHeart />) : view.phase === "paused" ? <LuPause /> : <LuSun />}</div>
                    <p className={styles.eyebrow}>{view.phase === "ready" ? "CHOOSE YOUR BEAST" : view.phase === "paused" ? "PAUSED" : view.phase === "won" ? "STAGE CLEAR" : "RUN COMPLETE"}</p>
                    <h2 id="game-dialog-title">{view.phase === "ready" ? "選好角色，準備開打。" : view.phase === "paused" ? "遊戲暫停" : view.phase === "won" ? "挑戰成功！" : "挑戰結束"}</h2>
                    <p>{view.phase === "ready" ? STAGES[view.stage].rule : view.phase === "paused" ? "調整節奏，再次進場。" : view.phase === "won" ? "15 個漢堡到手！前往下一座競技場。" : "換一位小日獸，挑戰更高分數。"}</p>
                    {view.phase === "ready" && <div className={styles.introSteps}><span><b>01</b> 收集漢堡</span><LuChevronRight /><span><b>02</b> 小日獸變身</span><LuChevronRight /><span><b>03</b> {STAGES[view.stage].mechanic}</span></div>}
                    {finished && <div className={styles.results}><span><strong>{view.score}</strong>本次得分</span><span><strong>{view.muffins}<small> / 15</small></strong>漢堡收集</span><span><strong>{view.bestCombo}</strong>最高連擊</span></div>}
                    <button className={styles.primaryButton} disabled={!loaded} onClick={() => view.phase === "paused" ? (pause(), canvas.current?.focus({ preventScroll: true })) : start(view.stage, view.phase === "ready" ? view.beast : 0)}><LuPlay />{assetError ? "素材載入失敗，請重新整理" : !loaded ? "載入角色與場景…" : view.phase === "ready" ? "開始挑戰" : view.phase === "paused" ? "繼續遊戲" : "再玩一次"}</button>
                    {view.phase === "won" && view.stage < 2 && <button className={styles.textButton} onClick={() => start(view.stage + 1, 0)}>前往{STAGES[view.stage + 1].name} <LuArrowRight /></button>}
                    {view.phase === "paused" && <button className={styles.textButton} onClick={() => selectStage(view.stage)}><LuRotateCcw /> 回到準備畫面</button>}
                    {view.phase === "ready" && <small className={styles.dialogFoot}>收集 15 個漢堡過關 · 三顆生命 · 七種能力</small>}
                  </div>
                </div>}
              </div>
              <div className={styles.abilityBar}><span>{active.skill}</span><div role="progressbar" aria-label="能力恢復" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, 1 - view.cooldown / active.cooldown) * 100)}><i style={{ width: `${Math.max(0, 1 - view.cooldown / active.cooldown) * 100}%` }} /></div><small>下次變身：{BEASTS[(view.beast + 1) % BEASTS.length].name}</small></div>
              <div className={styles.controlBar}>
                <div className={styles.moveControls}><button aria-label="向左移動" {...pointerProps("left")}><LuArrowLeft /></button><button aria-label="向右移動" {...pointerProps("right")}><LuArrowRight /></button><span>A / D<br /><small>左右移動</small></span></div>
                <div className={styles.actionControls}><button aria-label="跳躍" {...pointerProps("jump")}><LuArrowUp /><span>跳躍<small>SPACE</small></span></button><button aria-label="使用能力" className={styles.attackButton} {...pointerProps("attack")}><LuSparkles /><span>能力<small>J / X</small></span></button></div>
              </div>
            </div>
            <div className={styles.settings}><button aria-pressed={!musicMuted} onClick={() => setMusicMuted(!musicMuted)}><LuMusic2 />音樂 {musicMuted ? "關" : "開"}</button><button aria-pressed={!reduceFx} onClick={() => { reduced.current = !reduceFx; setReduceFx(!reduceFx); }}>動態特效 {reduceFx ? "低" : "標準"}</button><Link href="/muffin-knight/sprites">動作圖集 ↗</Link></div>
            <div className={styles.belowGame}><span><span className={styles.liveDot} />{STAGES[view.stage].subtitle}</span><button onClick={() => { if (game.current.phase === "playing") pause(); setHelp(true); }}>玩法說明</button><button aria-label="切換全螢幕" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else if (arena.current?.requestFullscreen) void arena.current.requestFullscreen().catch(() => {}); }}><LuMaximize /></button></div>
          </section>
          <aside className={styles.sidebar}>
            <div className={styles.companionHeader}><div><p className={styles.eyebrow}>BEAST SELECT / ABILITY</p><h2>選擇你的戰鬥方式</h2></div><span>0{view.beast + 1}</span></div>
            <div className={styles.activeBeast} style={{ "--beast-color": active.color } as React.CSSProperties}><span className={styles.beastBadge}>{view.phase === "ready" ? "起始角色" : "目前小日獸"}</span><div className={styles.portraitHalo}><span className={styles.spritePortrait} role="img" aria-label={active.name} style={portraitStyle(active.id)} /></div><h3>{active.name}</h3><span className={styles.skill}><LuSparkles />{active.skill}</span><p>{active.hint}</p></div>
            <div className={styles.rosterHeader}><strong>變身順序</strong><span>{view.phase === "ready" ? "點選起始角色" : "每個漢堡，都會變身"}</span></div>
            <div className={styles.roster}>{BEASTS.map((beast, i) => <button key={beast.id} className={i === view.beast ? styles.activeRoster : ""} onClick={() => { if (game.current.phase === "ready") { game.current.beast = i; sync(); } }} disabled={view.phase !== "ready"} aria-label={`選擇${beast.name}`} aria-pressed={view.beast === i}><i className={styles.rosterPortrait} style={portraitStyle(beast.id)} /><span>{beast.name}<small>{beast.skill}</small></span>{i === view.beast ? <LuCheck /> : <span className={styles.rosterIndex}>0{i + 1}</span>}</button>)}</div>
            <div className={styles.tip}><LuSun /><p>三秒內連續擊倒敵人，<br />連擊分數最高提升至四倍。</p></div>
          </aside>
        </div>
        <footer className={styles.footer}><span>走走小日 <span> / </span> 七種能力・三座競技場</span><span>WALK WALK ARCADE <LuSun /></span></footer>
      </div>
      {help && <div className={styles.helpBackdrop} onClick={() => setHelp(false)}><div className={styles.helpDialog} role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e => e.stopPropagation()}><button aria-label="關閉說明" className={styles.closeHelp} onClick={() => setHelp(false)}><LuX /></button><p className={styles.eyebrow}>HOW TO PLAY</p><h2 id="help-title">操作與計分</h2><p>收集 15 個漢堡就能過關。每吃一個，就依接力隊順序變身，並獲得短暫保護。</p><ul><li><strong>移動</strong>　← → 或 A / D</li><li><strong>跳躍</strong>　空白鍵、↑ 或 W；短按小跳、長按高跳；公雞可二段跳</li><li><strong>能力</strong>　按住 J / X 連續使用</li><li><strong>暫停</strong>　P / Esc；離開視窗會自動暫停</li></ul><p><strong>{STAGES[view.stage].mechanic}</strong>：{STAGES[view.stage].rule} {STAGES[view.stage].subtitle}</p><p>手機可同時按住方向與跳躍／能力。碰到敵人或掉落會失去一顆愛心。{view.stage === 0 ? "第一關為固定難度：怪物一擊可打倒，掉落回場也不會強化；每 5.5 秒出怪，最多同時 3 隻。" : "掉出場景的敵人會從上方變大回來：強化怪需 2 次命中，巨型怪需 3 次並會蓄力衝撞！"}</p><p>漢堡 +100 分，普通怪 +25 分。{view.stage !== 0 && "強化怪 +50 分、巨型怪 +100 分。"}3 秒內連續擊倒可累積連擊，擊倒分數最高四倍。過關時每顆剩餘愛心再加 200 分。</p><button className={styles.primaryButton} onClick={() => setHelp(false)}>知道了</button></div></div>}
    </main>
  );
}

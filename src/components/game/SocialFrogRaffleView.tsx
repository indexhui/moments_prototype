"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { drawFrogRaffle, FROG_RAFFLE_COUNT_KEY, FROG_RAFFLE_MIN_TICKETS, FROG_RAFFLE_STORAGE_KEY, FROG_RAFFLE_TICKET_COUNT, parseFrogRaffleCount, parseFrogRaffleResult, ticketNumber, type FrogRaffleResult } from "@/lib/game/socialFrogRaffle";
import { frogRaffleEntry, SOCIAL_FROG_RAFFLE_ENTRIES } from "@/lib/game/socialFrogRaffleEntries";
import styles from "./SocialFrogRaffleView.module.css";

type Phase = "idle" | "hop-one" | "touch-one" | "hop-two" | "touch-two" | "unveiling" | "revealed";
type Point = { left: number; top: number };
type Targets = { first: Point; second: Point };
const FROG_SIZE = 66;

export function SocialFrogRaffleView() {
  const [ticketCount, setTicketCount] = useState<number>(FROG_RAFFLE_TICKET_COUNT);
  const [draftCount, setDraftCount] = useState(String(FROG_RAFFLE_TICKET_COUNT));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [result, setResult] = useState<FrogRaffleResult | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [freshReveal, setFreshReveal] = useState(false);
  const [revealedComments, setRevealedComments] = useState(2);
  const [saveNotice, setSaveNotice] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const ticketRefs = useRef<Array<HTMLDivElement | null>>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const saved = parseFrogRaffleResult(window.localStorage.getItem(FROG_RAFFLE_STORAGE_KEY));
      const count = saved?.ticketCount ?? parseFrogRaffleCount(window.localStorage.getItem(FROG_RAFFLE_COUNT_KEY));
      setTicketCount(count);
      setDraftCount(String(count));
      if (saved) { setResult(saved); setPhase("revealed"); }
    } catch {
      // Local drawing remains available if storage is disabled.
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modalOpen && !dialog.open) dialog.showModal();
    if (!modalOpen && dialog.open) dialog.close();
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen || !freshReveal) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRevealedComments(2);
      setFreshReveal(false);
      return;
    }
    const first = window.setTimeout(() => setRevealedComments(1), 850);
    const second = window.setTimeout(() => {
      setRevealedComments(2);
      setFreshReveal(false);
    }, 1550);
    return () => { window.clearTimeout(first); window.clearTimeout(second); };
  }, [modalOpen, freshReveal]);

  useEffect(() => {
    if (runId === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const beats: [number, Phase][] = reduced
      ? [[80, "hop-one"], [160, "touch-one"], [240, "hop-two"], [320, "touch-two"], [400, "revealed"]]
      : [[180, "hop-one"], [1020, "touch-one"], [1330, "hop-two"], [2170, "touch-two"], [2700, "unveiling"], [3220, "revealed"]];
    const timers = beats.map(([delay, next]) => window.setTimeout(() => setPhase(next), delay));
    return () => timers.forEach(window.clearTimeout);
  }, [runId]);

  useEffect(() => {
    if (phase === "revealed" && runId > 0) {
      setFreshReveal(true);
      setRevealedComments(0);
      setModalOpen(true);
    }
  }, [phase, runId]);

  const measureTargets = useCallback((winners: [number, number]): Targets | null => {
    const stage = stageRef.current;
    const first = ticketRefs.current[winners[0]];
    const second = ticketRefs.current[winners[1]];
    if (!stage || !first || !second) return null;
    const stageBox = stage.getBoundingClientRect();
    const point = (element: HTMLDivElement): Point => {
      const box = element.getBoundingClientRect();
      return { left: box.left - stageBox.left + (box.width - FROG_SIZE) / 2,
        top: box.top - stageBox.top + (box.height - FROG_SIZE) / 2 };
    };
    return { first: point(first), second: point(second) };
  }, []);

  const clearResult = useCallback(() => {
    try { window.localStorage.removeItem(FROG_RAFFLE_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
    setResult(null);
    setPhase("idle");
    setRunId(0);
    setTargets(null);
    setModalOpen(false);
    setFreshReveal(false);
    setRevealedComments(2);
    setSaveNotice(false);
  }, []);

  const applyTicketCount = useCallback(() => {
    const count = Number(draftCount);
    if (!Number.isInteger(count) || count < FROG_RAFFLE_MIN_TICKETS || count > FROG_RAFFLE_TICKET_COUNT) return;
    if (count !== ticketCount) clearResult();
    setTicketCount(count);
    setDraftCount(String(count));
    setSettingsOpen(false);
    try { window.localStorage.setItem(FROG_RAFFLE_COUNT_KEY, String(count)); } catch { /* Storage may be disabled. */ }
  }, [draftCount, ticketCount, clearResult]);

  const handleDraw = useCallback(() => {
    if (phase === "revealed" && result) { setFreshReveal(false); setRevealedComments(2); setModalOpen(true); return; }
    if (phase !== "idle") return;
    const next = drawFrogRaffle(ticketCount);
    const positions = measureTargets(next.winners);
    if (!positions) return;
    setTargets(positions);
    setResult(next);
    setSettingsOpen(false);
    setSaveNotice(false);
    try { window.localStorage.setItem(FROG_RAFFLE_STORAGE_KEY, JSON.stringify(next)); }
    catch { setSaveNotice(true); }
    setPhase("idle");
    setRunId((previous) => previous + 1);
  }, [phase, result, ticketCount, measureTargets]);

  const tickets = Array.from({ length: ticketCount }, (_, index) => index + 1);
  const columns = ticketCount <= 10 ? 2 : 3;
  const rows = Math.ceil(ticketCount / columns);
  const firstTouched = phase === "touch-one" || phase === "hop-two" || phase === "touch-two" || phase === "unveiling" || phase === "revealed";
  const secondTouched = phase === "touch-two" || phase === "unveiling" || phase === "revealed";
  const isAnimating = runId > 0 && phase !== "revealed";
  const frogPoint = phase === "idle" || !targets ? { left: -FROG_SIZE, top: -FROG_SIZE }
    : phase === "hop-one" || phase === "touch-one" ? targets.first : targets.second;

  return (
    <main className={styles.page} data-social-frog-raffle="true" data-no-story-advance="true">
      <header className={styles.toolbar}>
        <h1>Threads 抽獎券 <span>{ticketCount} 張</span></h1>
        <div className={styles.toolbarActions}>
          <button type="button" onClick={() => { setDraftCount(String(ticketCount)); setSettingsOpen((open) => !open); }} disabled={isAnimating} aria-expanded={settingsOpen} aria-controls="frog-raffle-settings">數量</button>
          <button type="button" onClick={clearResult}>重置</button>
        </div>
      </header>

      {settingsOpen && (
        <div className={styles.settings} id="frog-raffle-settings">
          <label htmlFor="frog-raffle-count">抽獎券數量（{FROG_RAFFLE_MIN_TICKETS}–{FROG_RAFFLE_TICKET_COUNT}）</label>
          <div>
            <input id="frog-raffle-count" type="number" inputMode="numeric" min={FROG_RAFFLE_MIN_TICKETS} max={FROG_RAFFLE_TICKET_COUNT} value={draftCount} onChange={(event) => setDraftCount(event.target.value)} />
            <button type="button" onClick={applyTicketCount} disabled={!Number.isInteger(Number(draftCount)) || Number(draftCount) < FROG_RAFFLE_MIN_TICKETS || Number(draftCount) > FROG_RAFFLE_TICKET_COUNT}>套用</button>
          </div>
          <p>目前有 {FROG_RAFFLE_TICKET_COUNT} 則 Threads 編號留言。</p>
        </div>
      )}

      <section className={styles.ticketStage} data-phase={phase} ref={stageRef} aria-label={`${ticketCount} 張抽獎券`}>
        <div className={styles.ticketGrid} style={{ "--columns": columns, "--rows": rows } as CSSProperties}>
          {tickets.map((number) => (
            <div key={number} ref={(element) => { ticketRefs.current[number] = element; }} className={styles.ticket}
              data-touched={number === result?.winners[0] ? firstTouched : number === result?.winners[1] ? secondTouched : false}
              data-winning={phase === "revealed" && result?.winners.includes(number)}>
              <strong>#{ticketNumber(number)}</strong><span className={styles.ticketStub} aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className={styles.frog} style={{ left: frogPoint.left, top: frogPoint.top }} aria-hidden="true">
          <div className={styles.frogBounce}><img src="/images/social/prize-reveal/frog-sticker.png" width="354" height="354" alt="" draggable={false} /></div>
        </div>
        {targets && <>
          <span className={styles.contact} data-visible={firstTouched} style={{ left: targets.first.left + 46, top: targets.first.top - 8 }} aria-hidden="true">✦</span>
          <span className={styles.contact} data-visible={secondTouched} style={{ left: targets.second.left + 46, top: targets.second.top - 8 }} aria-hidden="true">✦</span>
        </>}
        {phase === "unveiling" && targets && <span className={styles.stageReveal} style={{ left: targets.second.left + FROG_SIZE / 2, top: targets.second.top + FROG_SIZE / 2 }} aria-hidden="true" />}
      </section>

      <footer className={styles.footer}>
        <p role="status">{isAnimating ? "青蛙抽獎中…" : saveNotice ? "結果沒有存下來，請先截圖記錄。" : ""}</p>
        <button type="button" onClick={handleDraw} disabled={isAnimating}>{result && phase === "revealed" ? "查看結果" : "開始抽獎"}</button>
      </footer>

      <dialog ref={dialogRef} className={styles.resultModal} onClose={() => { setModalOpen(false); setFreshReveal(false); setRevealedComments(2); }} aria-labelledby="frog-raffle-result-title">
        <div className={styles.modalHeader}>
          <h2 id="frog-raffle-result-title">恭喜！</h2>
          <button type="button" onClick={() => setModalOpen(false)} aria-label="關閉中獎結果">關閉</button>
        </div>
        {result && <div className={styles.modalBody}>
          <p className={styles.prizeLine}>明信片和抽獎組送給這兩位</p>
          <div className={styles.winners} aria-live="polite">
            {result.winners.map((number, index) => {
              const entry = frogRaffleEntry(number);
              const shown = index < revealedComments;
              return <article className={styles.winner} key={number} data-revealed={shown}>
                <div className={styles.winnerMeta}><strong>#{ticketNumber(number)}</strong>{shown && <span className={styles.maskedAccount}>{entry.account}</span>}</div>
                <div className={styles.winnerReveal}><div>{shown && <p>{entry.comment}</p>}</div></div>
              </article>;
            })}
          </div>
          {revealedComments === 2 && <div className={styles.thanks}>
            <div className={styles.postcards} aria-hidden="true">
              <img src="/images/exhibition/ending/postcard-summer.png" width="1378" height="2039" alt="" draggable={false} />
              <img src="/images/exhibition/ending/postcard-fireworks.png" width="1378" height="2039" alt="" draggable={false} />
            </div>
            <h3>謝謝大家在 Threads 的留言與祝福！</h3>
          </div>}
          {revealedComments === 2 && <details className={styles.allComments}>
            <summary>查看全部 {FROG_RAFFLE_TICKET_COUNT} 則 Threads 留言</summary>
            <div className={styles.commentList}>
              {SOCIAL_FROG_RAFFLE_ENTRIES.map((entry) => <article className={styles.comment} key={entry.number}>
                <div><strong>#{ticketNumber(entry.number)}</strong><span className={styles.maskedAccount}>{entry.account}</span></div>
                <p>{entry.comment}</p>
              </article>)}
            </div>
          </details>}
        </div>}
      </dialog>
    </main>
  );
}

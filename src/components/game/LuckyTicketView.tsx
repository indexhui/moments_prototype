"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { FiX } from "react-icons/fi";
import { playGameSfx } from "@/lib/game/soundEffects";
import { PRIZE_TIERS, type PrizeTier } from "@/lib/game/exhibitionRaffle";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import styles from "./LuckyTicketView.module.css";

type Phase = "idle" | "dragging" | "drawing" | "tearing" | "revealed";

// Equal chances for this preview; choose once per ticket, never during a tear.
function drawPrize() {
  return PRIZE_TIERS[Math.floor(Math.random() * PRIZE_TIERS.length)];
}

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  distance: number;
  progress: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  soundStep: number;
};

const PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const radius = 105 + (index % 3) * 34;
  return {
    "--x": `${Math.cos(angle) * radius}px`,
    "--y": `${Math.sin(angle) * radius * 0.8}px`,
    "--delay": `${(index % 4) * 35}ms`,
    "--spin": `${index % 2 ? 100 : -110}deg`,
    color: ["#dcad4e", "#74bcb0", "#df9582"][index % 3],
    fontSize: `${14 + (index % 3) * 6}px`,
  } as CSSProperties;
});

export function LuckyTicketView({ onClose, onDraw, onContinue, locale = "zh" }: {
  onClose?: () => void;
  onDraw?: () => Promise<PrizeTier | null>;
  onContinue?: () => void;
  locale?: ExhibitionLocale;
}) {
  const copy = {
    zh: { title: "幸運抽獎券", tear: "向右撕開抽獎券", hint: "捏住票根，向右撕開", almost: "就快撕開了⋯", good: "好運，拆開了！", won: "恭喜抽中", next: "查看獎品", busy: "正在開獎⋯", error: "抽獎結果暫時無法儲存，請再試一次。" },
    ja: { title: "ラッキーチケット", tear: "右に引いてチケットを開く", hint: "半券をつまんで、右に引こう", almost: "もう少し⋯", good: "幸運がやってきた！", won: "当選！", next: "賞品を見る", busy: "抽選中⋯", error: "結果を保存できません。もう一度お試しください。" },
    en: { title: "Lucky ticket", tear: "Tear the ticket to the right", hint: "Pinch the stub and pull to the right", almost: "Almost there…", good: "A little bit of luck!", won: "You won", next: "View prize", busy: "Drawing…", error: "Unable to save your result. Please try again." },
  }[locale];
  const [prize, setPrize] = useState<PrizeTier>(() => onDraw ? "A" : drawPrize());
  const [error, setError] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [lift, setLift] = useState(0);
  const [round, setRound] = useState(0);
  const [tearDuration, setTearDuration] = useState(600);
  const drag = useRef<Drag | null>(null);
  const locked = useRef(false);
  const strip = useRef<HTMLButtonElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useRef(onClose);
  const mounted = useRef(true);
  close.current = onClose;
  const isOpen = phase === "tearing" || phase === "revealed";

  useEffect(() => {
    mounted.current = true;
    const previousFocus = document.activeElement;
    // Warm all four original artworks so a replay does not flash an empty ticket.
    PRIZE_TIERS.forEach((tier) => {
      const artwork = new Image();
      artwork.src = `/images/ticket/LuckyTicket_${tier}.png`;
    });
    strip.current?.focus({ preventScroll: true });
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !close.current) return;
      event.preventDefault();
      event.stopPropagation();
      close.current?.();
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => {
      mounted.current = false;
      window.removeEventListener("keydown", handleEscape, true);
      if (finishTimer.current) clearTimeout(finishTimer.current);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (phase === "revealed") replay.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (round > 0) strip.current?.focus({ preventScroll: true });
  }, [round]);

  async function reveal(velocity = 0) {
    if (locked.current) return;
    locked.current = true;
    drag.current = null;
    setError(false);
    if (onDraw) {
      setPhase("drawing");
      try {
        const awardedPrize = await onDraw();
        if (!mounted.current) return;
        if (!awardedPrize) { onContinue?.(); return; }
        setPrize(awardedPrize);
      } catch {
        if (!mounted.current) return;
        locked.current = false;
        setProgress(0);
        setLift(0);
        setPhase("idle");
        setError(true);
        return;
      }
    }
    const duration = Math.max(380, 620 - velocity * 180);
    setTearDuration(duration);
    setPhase("tearing");
    playGameSfx("diaryWashiTapePeel", { volumeScale: 0.75, playbackRate: 1.1 });
    playGameSfx("creatorStudioMaterialRare", { volumeScale: 0.72 });
    finishTimer.current = setTimeout(() => {
      finishTimer.current = null;
      setPhase("revealed");
    }, duration);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (locked.current || drag.current || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      // Reach the tear point before the finger runs out of phone-screen space.
      distance: event.currentTarget.getBoundingClientRect().width * 0.62,
      progress: 0,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      soundStep: 0,
    };
    setProgress(0);
    setLift(0);
    setPhase("dragging");
    playGameSfx("diaryPuzzlePickUp", { volumeScale: 0.35 });
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId || locked.current) return;
    const elapsed = Math.max(1, event.timeStamp - active.lastTime);
    active.velocity = (event.clientX - active.lastX) / elapsed;
    active.lastX = event.clientX;
    active.lastTime = event.timeStamp;
    active.progress = Math.max(0, Math.min(1, (event.clientX - active.startX) / active.distance));
    setProgress(active.progress);
    setLift(Math.max(-7, Math.min(7, (event.clientY - active.startY) * 0.12)));
    const soundStep = Math.floor(active.progress * 3);
    if (soundStep > active.soundStep) {
      active.soundStep = soundStep;
      playGameSfx("diaryWashiTapePeel", {
        volumeScale: 0.12 + active.progress * 0.1,
        playbackRate: 1.1 + active.progress * 0.45,
      });
    }
    if (active.progress >= 1) reveal(Math.max(0, active.velocity));
  }

  function cancelDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setProgress(0);
    setLift(0);
    setPhase("idle");
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const velocity = event.timeStamp - active.lastTime < 90 ? active.velocity : 0;
    const projectedProgress = active.progress + (Math.max(0, velocity) * 55) / active.distance;
    if (active.progress >= 0.86 || (active.progress >= 0.42 && projectedProgress >= 1)) {
      reveal(Math.max(0, velocity));
    } else {
      cancelDrag(event);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function reset() {
    locked.current = false;
    drag.current = null;
    setProgress(0);
    setLift(0);
    setPhase("idle");
    setPrize(drawPrize());
    setRound((value) => value + 1);
  }

  return (
    <section
      role="dialog"
      aria-label={copy.title}
      className={styles.page}
      data-phase={phase}
      data-no-story-advance="true"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      style={{
        "--progress": progress,
        "--lift": `${lift}px`,
        "--tear-duration": `${tearDuration}ms`,
      } as CSSProperties}
    >
      {onClose && <button type="button" className={styles.close} onClick={onClose} aria-label="關閉抽獎券">
        <FiX aria-hidden="true" />
      </button>}
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.ticketPosition}>
        <div key={round} className={styles.ticket}>
          <img className={styles.ticketArt} src={`/images/ticket/LuckyTicket_${prize}.png`} width={679} height={296} alt={isOpen ? `抽獎券，${prize} 賞` : "尚未拆開的抽獎券"} draggable={false} />
          <div className={styles.seamLight} aria-hidden="true" />
          <button
            ref={strip}
            type="button"
            className={styles.strip}
            aria-label={copy.tear}
            aria-describedby="lucky-ticket-instruction"
            aria-disabled={isOpen || phase === "drawing"}
            tabIndex={isOpen ? -1 : 0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={cancelDrag}
            onLostPointerCapture={cancelDrag}
            onClick={(event) => { if (event.detail === 0) reveal(); }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight") return;
              event.preventDefault();
              reveal();
            }}
          >
            <img src="/images/ticket/LuckyTicket_TearStrip.png" width={178} height={296} alt="" draggable={false} />
          </button>
          {isOpen && (
            <div className={styles.celebration} aria-hidden="true">
              <span className={styles.ring} />
              {PARTICLES.map((style, index) => (
                <span key={index} className={styles.particle} style={style}>{index % 3 ? "✦" : "✧"}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.instruction} id="lucky-ticket-instruction" aria-hidden={isOpen}>
        <span>{phase === "drawing" ? copy.busy : phase === "dragging" && progress > 0.45 ? copy.almost : copy.hint}</span>
        <span className={styles.arrow} aria-hidden="true">→</span>
      </div>
      <div className={styles.result} role="status" aria-live="polite" aria-atomic="true">
        {error && <span role="alert">{copy.error}</span>}
        {isOpen && <><span className={styles.resultEyebrow}>{copy.good}</span><strong>{copy.won} {prize}{locale === "en" ? "!" : " 賞"}</strong></>}
      </div>
      {phase === "revealed" && (
        <button ref={replay} type="button" className={styles.replay} onClick={onContinue ?? reset}>{onContinue ? copy.next : "再拆一張"}</button>
      )}
    </section>
  );
}

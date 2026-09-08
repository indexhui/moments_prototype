"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { LuckyTicketView } from "@/components/game/LuckyTicketView";
import {
  SOCIAL_PRIZE_PRESENTATION_COMMAND,
  type SocialPrizePresentationStart,
} from "@/lib/game/socialPrizePresentation";
import styles from "./SocialPrizeRevealView.module.css";

// Positions are the original 786 × 1704 Figma canvas, independent of motion.
const PRIZES = [
  { id: "summer", src: "/images/exhibition/ending/postcard-summer.png", alt: "夏日明信片", x: 39, y: 472, width: 428.591, height: 593.236, artWidth: 379.225, artHeight: 561.132, tilt: -5.21, delay: 400, duration: 900, fromX: -75, fromY: 95, fromTilt: -18, kind: "postcard" },
  { id: "fireworks", src: "/images/exhibition/ending/postcard-fireworks.png", alt: "煙火明信片", x: 288, y: 600, width: 494.345, height: 631.324, artWidth: 379.225, artHeight: 561.132, tilt: 12.83, delay: 1200, duration: 900, fromX: 85, fromY: 100, fromTilt: 20, kind: "postcard" },
  { id: "friends", src: "/images/social/prize-reveal/friends-sticker.png", alt: "青蛙、小貝狗與直太郎貼紙", x: 13, y: 996, width: 372, height: 372, artWidth: 372, artHeight: 372, tilt: 0, delay: 2050, duration: 540, fromX: -22, fromY: 65, fromTilt: -15, kind: "sticker" },
  { id: "frog", src: "/images/social/prize-reveal/frog-sticker.png", alt: "青蛙貼紙", x: 307, y: 1173, width: 277, height: 277, artWidth: 277, artHeight: 277, tilt: 0, delay: 2590, duration: 540, fromX: 0, fromY: 75, fromTilt: 12, kind: "sticker" },
  { id: "naotaro", src: "/images/social/prize-reveal/naotaro-sticker.png", alt: "直太郎貼紙", x: 522, y: 1196, width: 232, height: 232, artWidth: 232, artHeight: 232, tilt: 0, delay: 3130, duration: 540, fromX: 28, fromY: 55, fromTilt: 16, kind: "sticker" },
] as const;

const CONTINUE_DELAY_MS = Math.max(...PRIZES.map((prize) => prize.delay + prize.duration)) + 160;
const CONTINUE_DURATION_MS = 360;
// Start the prize entrance while the ticket is still leaving: no empty beat.
const TICKET_EXIT_MS = 620;

const ASSETS = [
  "/images/ticket/Ticket_Dots.png",
  "/images/ticket/LuckyTicket_A.png",
  "/images/ticket/LuckyTicket_TearStrip.png",
  ...PRIZES.map((prize) => prize.src),
];
// A fixed demo result; this does not call the exhibition raffle or save a receipt.
const drawPresentationPrize = async () => "A" as const;

function PrizeSequence({ onReplay }: { onReplay: () => void }) {
  const [finished, setFinished] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    const timer = setTimeout(() => setFinished(true), CONTINUE_DELAY_MS + CONTINUE_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={styles.prizes}
      aria-label="A 賞明信片與貼紙組"
      data-complete={finished}
      style={{ "--continue-delay": `${CONTINUE_DELAY_MS}ms`, "--continue-duration": `${CONTINUE_DURATION_MS}ms` } as CSSProperties}
    >
      <header className={styles.header}>
        <p>Ａ賞獲得</p>
        <h1 ref={title} tabIndex={-1}>明信片與貼紙組</h1>
      </header>
      {PRIZES.map((prize) => (
        <div
          key={prize.id}
          className={styles.placement}
          data-prize={prize.id}
          style={{
            left: `${prize.x / 786 * 100}%`,
            top: `${prize.y / 1704 * 100}%`,
            width: `${prize.width / 786 * 100}%`,
            height: `${prize.height / 1704 * 100}%`,
            "--tilt": `${prize.tilt}deg`,
            "--delay": `${prize.delay}ms`,
            "--duration": `${prize.duration}ms`,
            "--from-x": `${prize.fromX}%`,
            "--from-y": `${prize.fromY}%`,
            "--from-tilt": `${prize.fromTilt}deg`,
          } as CSSProperties}
        >
          <div className={styles[prize.kind]}>
            <img
              className={styles.artwork}
              src={prize.src}
              alt={prize.alt}
              draggable={false}
              width={prize.artWidth}
              height={prize.artHeight}
              style={{ width: `${prize.artWidth / prize.width * 100}%`, height: `${prize.artHeight / prize.height * 100}%` }}
            />
          </div>
        </div>
      ))}
      <button type="button" className={styles.continue} disabled={!finished} onClick={onReplay} aria-label="繼續，重新播放社群活動演出">繼續</button>
    </section>
  );
}

export function SocialPrizeRevealView() {
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [assetState, setAssetState] = useState<"loading" | "ready" | "error">("loading");
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<"ticket" | "transition" | "prizes">("ticket");
  const replay = useCallback((start: SocialPrizePresentationStart = "ticket") => {
    setPhase(start);
    setRunId((previous) => previous + 1);
  }, []);
  const showPrizes = useCallback(() => setPhase("transition"), []);

  useEffect(() => {
    let cancelled = false;
    setAssetState("loading");
    Promise.all(ASSETS.map(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
    })).then(
      () => { if (!cancelled) setAssetState("ready"); },
      () => { if (!cancelled) setAssetState("error"); },
    );
    return () => { cancelled = true; };
  }, [loadAttempt]);

  useEffect(() => {
    const onCommand = (event: Event) => {
      const start = (event as CustomEvent<unknown>).detail;
      if (start === "ticket" || start === "prizes") replay(start);
    };
    window.addEventListener(SOCIAL_PRIZE_PRESENTATION_COMMAND, onCommand);
    return () => window.removeEventListener(SOCIAL_PRIZE_PRESENTATION_COMMAND, onCommand);
  }, [replay]);

  useEffect(() => {
    if (phase !== "transition") return;
    const timer = setTimeout(() => setPhase("prizes"), TICKET_EXIT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className={styles.viewport} data-social-prize-reveal="true" data-no-story-advance="true">
      <div className={styles.canvas} data-phase={phase} data-assets={assetState}>
        {assetState === "loading" && <p className={styles.message} role="status">準備演出中…</p>}
        {assetState === "error" && <div className={styles.message} role="alert"><p>圖片載入失敗，請重新載入。</p><button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>重新載入</button></div>}
        {assetState === "ready" && (
          <>
            {phase !== "ticket" && <PrizeSequence key={runId} onReplay={() => replay()} />}
            {phase !== "prizes" && (
              <div className={styles.ticketLayer} data-leaving={phase === "transition"} style={{ "--ticket-exit-duration": `${TICKET_EXIT_MS}ms` } as CSSProperties}>
                <LuckyTicketView key={runId} presentationMode onDraw={drawPresentationPrize} onContinue={showPrizes} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

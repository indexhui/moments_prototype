"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { SUNBEAST_IDS, SUNBEAST_REGISTRY, type SunbeastId } from "@/lib/game/sunbeastRegistry";
import type { CardDuelReaction } from "./LobbyBeigoCardDuel";
import styles from "./LobbyBeigoFormationDuel.module.css";

type Owner = "player" | "beigo";
type Winner = Owner | "draw";
type Phase = "playerPick" | "beigoPick" | "checking" | "complete";

type MemoryCard = {
  id: string;
  beastId: SunbeastId;
  matchedBy: Owner | null;
};

type GameState = {
  cards: MemoryCard[];
  phase: Phase;
  revealedIds: string[];
  playerScore: number;
  beigoScore: number;
  winner: Winner | null;
  message: string;
};

type Props = {
  onExit: () => void;
  onReaction: (reaction: CardDuelReaction) => void;
};

let deckSerial = 0;

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createDeck() {
  deckSerial += 1;
  return shuffle(SUNBEAST_IDS.flatMap((beastId) => [0, 1].map((copy) => ({
    id: `${beastId}-${copy}-${deckSerial}`,
    beastId,
    matchedBy: null,
  }))));
}

function createInitialState(): GameState {
  return {
    cards: createDeck(),
    phase: "playerPick",
    revealedIds: [],
    playerScore: 0,
    beigoScore: 0,
    winner: null,
    message: "翻兩張一樣的小日獸",
  };
}

function chooseBeigoPair(cards: MemoryCard[], seen: Map<string, SunbeastId>) {
  const available = cards.filter((card) => !card.matchedBy);
  if (available.length < 2) return null;
  const knownByBeast = new Map<SunbeastId, MemoryCard[]>();
  available.forEach((card) => {
    if (!seen.has(card.id)) return;
    const group = knownByBeast.get(card.beastId) ?? [];
    group.push(card);
    knownByBeast.set(card.beastId, group);
  });
  const knownPairs = [...knownByBeast.values()].filter((group) => group.length >= 2);
  if (knownPairs.length > 0 && Math.random() < 0.78) {
    const pair = knownPairs[Math.floor(Math.random() * knownPairs.length)];
    if (pair?.[0] && pair[1]) return [pair[0], pair[1]] as const;
  }

  const first = available[Math.floor(Math.random() * available.length)];
  if (!first) return null;
  const remaining = available.filter((card) => card.id !== first.id);
  const rememberedMatch = remaining.find((card) => card.beastId === first.beastId && seen.has(card.id));
  const second = rememberedMatch && Math.random() < 0.68
    ? rememberedMatch
    : remaining[Math.floor(Math.random() * remaining.length)];
  if (!second) return null;
  return [first, second] as const;
}

export function LobbyBeigoFormationDuel({ onExit, onReaction }: Props) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const stateRef = useRef(state);
  const seenRef = useRef<Map<string, SunbeastId>>(new Map());
  const timersRef = useRef<number[]>([]);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((item) => item !== timer);
      callback();
    }, delay);
    timersRef.current.push(timer);
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    seenRef.current.clear();
    commit(createInitialState());
    onReaction("ready");
  }, [clearTimers, commit, onReaction]);

  useEffect(() => {
    resetGame();
    return clearTimers;
  }, [clearTimers, resetGame]);

  const resolvePair = useCallback((owner: Owner) => {
    const current = stateRef.current;
    if (current.revealedIds.length !== 2 || current.winner) return;
    const first = current.cards.find((card) => card.id === current.revealedIds[0]);
    const second = current.cards.find((card) => card.id === current.revealedIds[1]);
    if (!first || !second) return;

    if (first.beastId === second.beastId) {
      seenRef.current.delete(first.id);
      seenRef.current.delete(second.id);
      const cards = current.cards.map((card) => current.revealedIds.includes(card.id) ? { ...card, matchedBy: owner } : card);
      const playerScore = current.playerScore + (owner === "player" ? 1 : 0);
      const beigoScore = current.beigoScore + (owner === "beigo" ? 1 : 0);
      const finished = playerScore + beigoScore >= SUNBEAST_IDS.length;
      const winner: Winner | null = finished
        ? playerScore === beigoScore ? "draw" : playerScore > beigoScore ? "player" : "beigo"
        : null;
      commit({
        ...current,
        cards,
        revealedIds: [],
        playerScore,
        beigoScore,
        phase: finished ? "complete" : owner === "player" ? "playerPick" : "beigoPick",
        winner,
        message: finished
          ? winner === "player" ? "你配到最多組！" : winner === "beigo" ? "小貝配到最多組！" : "一樣多，平手！"
          : owner === "player" ? "配對成功！再翻一次" : "小貝配對成功，再翻一次",
      });
      onReaction(finished
        ? winner === "player" ? "playerWin" : winner === "beigo" ? "beigoWin" : "draw"
        : owner === "player" ? "playerClaim" : "beigoClaim");
      return;
    }

    commit({ ...current, phase: "checking", message: "沒有配對，換手！" });
    schedule(() => {
      const latest = stateRef.current;
      if (latest.winner) return;
      const nextPhase: Phase = owner === "player" ? "beigoPick" : "playerPick";
      commit({
        ...latest,
        phase: nextPhase,
        revealedIds: [],
        message: owner === "player" ? "換小貝翻牌" : "換你翻兩張",
      });
      onReaction(owner === "player" ? "thinking" : "ready");
    }, 720);
  }, [commit, onReaction, schedule]);

  const flipPlayerCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.phase !== "playerPick" || current.winner || current.revealedIds.includes(cardId)) return;
    const card = current.cards.find((item) => item.id === cardId);
    if (!card || card.matchedBy) return;
    seenRef.current.set(card.id, card.beastId);
    const revealedIds = [...current.revealedIds, card.id];
    commit({
      ...current,
      phase: revealedIds.length === 2 ? "checking" : "playerPick",
      revealedIds,
      message: revealedIds.length === 2 ? "看看是不是同一隻！" : "再翻一張",
    });
    onReaction("play");
    if (revealedIds.length === 2) schedule(() => resolvePair("player"), 620);
  }, [commit, onReaction, resolvePair, schedule]);

  useEffect(() => {
    if (state.phase !== "beigoPick" || state.revealedIds.length > 0 || state.winner) return;
    onReaction("thinking");
    schedule(() => {
      const current = stateRef.current;
      if (current.phase !== "beigoPick" || current.winner) return;
      const pair = chooseBeigoPair(current.cards, seenRef.current);
      if (!pair) return;
      const [first, second] = pair;
      seenRef.current.set(first.id, first.beastId);
      commit({ ...current, revealedIds: [first.id], message: "小貝翻了一張……" });
      schedule(() => {
        const latest = stateRef.current;
        if (latest.phase !== "beigoPick" || latest.winner) return;
        seenRef.current.set(second.id, second.beastId);
        commit({ ...latest, phase: "checking", revealedIds: [first.id, second.id], message: "小貝再翻一張！" });
        onReaction("play");
        schedule(() => resolvePair("beigo"), 620);
      }, 560);
    }, 620);
  }, [commit, onReaction, resolvePair, schedule, state.phase, state.revealedIds.length, state.winner]);

  return (
    <section className={styles.root} aria-label="配配看遊戲">
      <div className={styles.hud}>
        <strong>配配看</strong>
        <span>配對收札</span>
        <button type="button" onClick={onExit} aria-label="結束配配看">×</button>
      </div>

      {!state.winner ? <div className={styles.prompt} role="status" aria-live="polite">{state.message}</div> : null}

      <div className={styles.scoreBoard} aria-label={`你 ${state.playerScore} 分，小貝 ${state.beigoScore} 分`}>
        <span className={state.phase === "playerPick" ? styles.scoreActive : ""}><b>你</b><strong>{state.playerScore}</strong></span>
        <i>☀</i>
        <span className={state.phase === "beigoPick" ? styles.scoreActive : ""}><b>小貝</b><strong>{state.beigoScore}</strong></span>
      </div>

      <div className={styles.cardBoard} aria-label="十張配對牌">
        {state.cards.map((card) => {
          const revealed = state.revealedIds.includes(card.id) || Boolean(card.matchedBy);
          const beast = SUNBEAST_REGISTRY[card.beastId];
          return (
            <button
              key={card.id}
              type="button"
              className={`${styles.memoryCard} ${revealed ? styles.memoryCardRevealed : ""} ${card.matchedBy ? styles.memoryCardMatched : ""}`}
              disabled={state.phase !== "playerPick" || Boolean(card.matchedBy) || state.revealedIds.length >= 2}
              onClick={() => flipPlayerCard(card.id)}
              aria-label={revealed ? `${beast.name}${card.matchedBy ? `，${card.matchedBy === "player" ? "你" : "小貝"}已收下` : ""}` : "翻開配對牌"}
            >
              <span className={styles.cardInner}>
                <span className={styles.cardBack} aria-hidden="true"><b>☀</b><i>🐾</i></span>
                <span className={styles.cardFront}>
                  <span className={styles.cardImage}><Image src={beast.imagePath} alt="" fill sizes="68px" /></span>
                  <strong>{beast.name}</strong>
                  {card.matchedBy ? <i className={card.matchedBy === "beigo" ? styles.matchBeigo : ""}>{card.matchedBy === "player" ? "你" : "小貝"}</i> : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${styles.turnBadge} ${state.phase === "beigoPick" ? styles.turnBadgeBeigo : ""}`}>
        {state.phase === "beigoPick" ? "小貝回合" : state.phase === "checking" ? "配對中" : state.phase === "complete" ? "配對完成" : "你的回合"}
      </div>

      {state.winner ? (
        <div className={styles.result} role="dialog" aria-label="配配看結果">
          <span aria-hidden="true">{state.winner === "player" ? "☀" : state.winner === "beigo" ? "🐾" : "🤝"}</span>
          <strong>{state.winner === "player" ? "你贏了！" : state.winner === "beigo" ? "小貝贏了！" : "平手！"}</strong>
          <b>你 {state.playerScore}：{state.beigoScore} 小貝</b>
          <div><button type="button" onClick={resetGame}>再玩一次</button><button type="button" onClick={onExit}>先休息</button></div>
        </div>
      ) : null}
    </section>
  );
}

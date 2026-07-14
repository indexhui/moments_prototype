"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LobbyBeigoCardDuel.module.css";

type Winner = "player" | "beigo";
type MatchResult = Winner | "draw";
type RoundWinner = Winner | "tie";
type Gesture = "rock" | "paper" | "scissors";
type Phase = "draftPlayer" | "draftBeigo" | "draftComplete" | "battleChoose" | "reveal" | "roundResult" | "complete";

export type CardDuelReaction =
  | "ready"
  | "thinking"
  | "play"
  | "playerClaim"
  | "beigoClaim"
  | "playerWin"
  | "beigoWin"
  | "draw";

type DuelCard = {
  id: string;
  gesture: Gesture;
  source: "deck" | "market";
};

type MarketCard = {
  card: DuelCard;
  takenBy: Winner | null;
};

type RoundResult = {
  winner: RoundWinner;
  playerCard: DuelCard;
  beigoCard: DuelCard;
};

type DuelState = {
  playerHand: DuelCard[];
  beigoHand: DuelCard[];
  market: MarketCard[];
  phase: Phase;
  draftPickCount: number;
  roundIndex: number;
  playerScore: number;
  beigoScore: number;
  pendingBeigoCardId: string | null;
  currentPlayerCard: DuelCard | null;
  currentBeigoCard: DuelCard | null;
  results: RoundResult[];
  winner: MatchResult | null;
  message: string;
};

type Props = {
  onExit: () => void;
  onReaction: (reaction: CardDuelReaction) => void;
};

const GESTURES: Gesture[] = ["rock", "paper", "scissors"];
const GESTURE_META: Record<Gesture, { icon: string; name: string; beats: string }> = {
  rock: { icon: "✊", name: "石頭", beats: "打贏剪刀" },
  paper: { icon: "✋", name: "布", beats: "包住石頭" },
  scissors: { icon: "✌", name: "剪刀", beats: "剪開布" },
};
const BEATS: Record<Gesture, Gesture> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};
const COUNTER: Record<Gesture, Gesture> = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

let cardSerial = 0;

function drawCard(owner: string, source: DuelCard["source"]): DuelCard {
  const gesture = GESTURES[Math.floor(Math.random() * GESTURES.length)];
  cardSerial += 1;
  return { id: `${owner}-${source}-${cardSerial}`, gesture, source };
}

function drawCards(owner: string, count: number, source: DuelCard["source"]) {
  return Array.from({ length: count }, () => drawCard(owner, source));
}

function mostCommonGesture(cards: DuelCard[]) {
  const counts: Record<Gesture, number> = { rock: 0, paper: 0, scissors: 0 };
  cards.forEach((card) => { counts[card.gesture] += 1; });
  return GESTURES.reduce((best, gesture) => counts[gesture] > counts[best] ? gesture : best, GESTURES[0]);
}

function chooseBeigoDraftCard(market: MarketCard[], playerHand: DuelCard[]) {
  const available = market.filter((item) => !item.takenBy);
  const wanted = COUNTER[mostCommonGesture(playerHand)];
  const counterPick = available.find((item) => item.card.gesture === wanted);
  return counterPick ?? available[Math.floor(Math.random() * available.length)];
}

function chooseBeigoBattleCard(beigoHand: DuelCard[], playerHand: DuelCard[]) {
  const predictedPlayerCard = mostCommonGesture(playerHand);
  const wanted = COUNTER[predictedPlayerCard];
  const counters = beigoHand.filter((card) => card.gesture === wanted);
  if (counters.length > 0 && Math.random() < 0.58) {
    return counters[Math.floor(Math.random() * counters.length)];
  }
  return beigoHand[Math.floor(Math.random() * beigoHand.length)];
}

function judgeRound(player: Gesture, beigo: Gesture): RoundWinner {
  if (player === beigo) return "tie";
  return BEATS[player] === beigo ? "player" : "beigo";
}

function createInitialState(): DuelState {
  return {
    playerHand: drawCards("player", 3, "deck"),
    beigoHand: drawCards("beigo", 3, "deck"),
    market: drawCards("market", 4, "market").map((card) => ({ card, takenBy: null })),
    phase: "draftPlayer",
    draftPickCount: 0,
    roundIndex: 0,
    playerScore: 0,
    beigoScore: 0,
    pendingBeigoCardId: null,
    currentPlayerCard: null,
    currentBeigoCard: null,
    results: [],
    winner: null,
    message: "你先拿一張檯面牌；小貝拿完後再換你",
  };
}

function GestureCard({ card, compact = false, revealed = false }: { card: DuelCard; compact?: boolean; revealed?: boolean }) {
  const meta = GESTURE_META[card.gesture];
  return (
    <span className={`${styles.gestureCard} ${styles[`gesture_${card.gesture}`]} ${compact ? styles.gestureCardCompact : ""} ${revealed ? styles.gestureCardRevealed : ""}`}>
      <small>猜拳牌</small>
      <strong aria-hidden="true">{meta.icon}</strong>
      <span>{meta.name}</span>
    </span>
  );
}

function CardBack({ compact = false }: { compact?: boolean }) {
  return <span className={`${styles.cardBack} ${compact ? styles.cardBackCompact : ""}`}><i>🐾</i><small>小貝牌</small></span>;
}

export function LobbyBeigoCardDuel({ onExit, onReaction }: Props) {
  const [state, setState] = useState<DuelState>(() => createInitialState());
  const stateRef = useRef(state);
  const timerRef = useRef<number | null>(null);

  const commit = useCallback((next: DuelState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    clearTimer();
    commit(createInitialState());
    onReaction("ready");
  }, [clearTimer, commit, onReaction]);

  useEffect(() => {
    resetGame();
    return clearTimer;
  }, [clearTimer, resetGame]);

  const takeMarketCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.phase !== "draftPlayer") return;
    const selected = current.market.find((item) => item.card.id === cardId && !item.takenBy);
    if (!selected) return;

    const afterPlayer: DuelState = {
      ...current,
      playerHand: [...current.playerHand, selected.card],
      market: current.market.map((item) => item.card.id === cardId ? { ...item, takenBy: "player" } : item),
      phase: "draftBeigo",
      draftPickCount: current.draftPickCount + 1,
      message: "小貝正在挑牌……",
    };
    commit(afterPlayer);
    onReaction("playerClaim");

    timerRef.current = window.setTimeout(() => {
      const latest = stateRef.current;
      if (latest.phase !== "draftBeigo") return;
      const beigoPick = chooseBeigoDraftCard(latest.market, latest.playerHand);
      if (!beigoPick) return;
      const beigoHand = [...latest.beigoHand, beigoPick.card];
      const draftPickCount = latest.draftPickCount + 1;
      const draftComplete = draftPickCount >= 4;
      const afterBeigo: DuelState = {
        ...latest,
        beigoHand,
        market: latest.market.map((item) => item.card.id === beigoPick.card.id ? { ...item, takenBy: "beigo" } : item),
        phase: draftComplete ? "draftComplete" : "draftPlayer",
        draftPickCount,
        message: draftComplete ? `小貝拿走${GESTURE_META[beigoPick.card.gesture].name}，雙方都湊齊五張！` : "又輪到你，再拿一張檯面牌",
      };
      commit(afterBeigo);
      onReaction("beigoClaim");
      if (!draftComplete) {
        timerRef.current = null;
        return;
      }
      timerRef.current = window.setTimeout(() => {
        const completed = stateRef.current;
        if (completed.phase !== "draftComplete") return;
        commit({
          ...completed,
          phase: "battleChoose",
          pendingBeigoCardId: chooseBeigoBattleCard(completed.beigoHand, completed.playerHand).id,
          message: "雙方五張到齊！選一張開始第 1 局",
        });
        onReaction("ready");
        timerRef.current = null;
      }, 850);
    }, 650);
  }, [commit, onReaction]);

  const advanceRound = useCallback((resolved: DuelState) => {
    const roundIndex = resolved.roundIndex + 1;
    const pending = chooseBeigoBattleCard(resolved.beigoHand, resolved.playerHand);
    const next: DuelState = {
      ...resolved,
      phase: "battleChoose",
      roundIndex,
      pendingBeigoCardId: pending.id,
      currentPlayerCard: null,
      currentBeigoCard: null,
      message: `第 ${roundIndex + 1} 局，從剩下的牌選一張`,
    };
    commit(next);
    onReaction("ready");
    timerRef.current = null;
  }, [commit, onReaction]);

  const resolveRound = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "reveal" || !current.currentPlayerCard || !current.currentBeigoCard) return;
    const roundWinner = judgeRound(current.currentPlayerCard.gesture, current.currentBeigoCard.gesture);
    const playerScore = current.playerScore + (roundWinner === "player" ? 1 : 0);
    const beigoScore = current.beigoScore + (roundWinner === "beigo" ? 1 : 0);
    const results = [...current.results, {
      winner: roundWinner,
      playerCard: current.currentPlayerCard,
      beigoCard: current.currentBeigoCard,
    }];
    const isLastRound = current.roundIndex >= 4;
    const winner: MatchResult | null = isLastRound
      ? playerScore === beigoScore ? "draw" : playerScore > beigoScore ? "player" : "beigo"
      : null;
    const roundText = roundWinner === "tie"
      ? "一樣的牌，這局平手！"
      : `${roundWinner === "player" ? "你" : "小貝"}贏下第 ${current.roundIndex + 1} 局！`;
    const resolved: DuelState = {
      ...current,
      phase: winner ? "complete" : "roundResult",
      playerScore,
      beigoScore,
      results,
      winner,
      message: winner
        ? winner === "draw" ? "五局打完，最後平手！" : `五局打完，${winner === "player" ? "你" : "小貝"}獲勝！`
        : roundText,
    };
    commit(resolved);
    onReaction(winner
      ? winner === "draw" ? "draw" : winner === "player" ? "playerWin" : "beigoWin"
      : roundWinner === "tie" ? "draw" : roundWinner === "player" ? "playerClaim" : "beigoClaim");
    timerRef.current = null;
    if (!winner) timerRef.current = window.setTimeout(() => advanceRound(resolved), 1050);
  }, [advanceRound, commit, onReaction]);

  const playCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.phase !== "battleChoose" || !current.pendingBeigoCardId || current.winner) return;
    const playerCard = current.playerHand.find((card) => card.id === cardId);
    const beigoCard = current.beigoHand.find((card) => card.id === current.pendingBeigoCardId);
    if (!playerCard || !beigoCard) return;
    const next: DuelState = {
      ...current,
      playerHand: current.playerHand.filter((card) => card.id !== playerCard.id),
      beigoHand: current.beigoHand.filter((card) => card.id !== beigoCard.id),
      pendingBeigoCardId: null,
      phase: "reveal",
      currentPlayerCard: playerCard,
      currentBeigoCard: beigoCard,
      message: "剪刀、石頭、布——出拳！",
    };
    commit(next);
    onReaction("play");
    timerRef.current = window.setTimeout(resolveRound, 620);
  }, [commit, onReaction, resolveRound]);

  const drafting = state.phase === "draftPlayer" || state.phase === "draftBeigo" || state.phase === "draftComplete";

  return (
    <section className={styles.root} aria-label="剪刀石頭布卡牌對決">
      <div className={styles.hud} role="status" aria-live="polite">
        <span className={styles.title}>剪刀・石頭・布</span>
        <span className={styles.rule}>{drafting ? "共享選牌" : "五局對決"}</span>
        <span className={styles.score}>你 {state.playerScore} : {state.beigoScore} 小貝</span>
        <button type="button" onClick={onExit} aria-label="結束剪刀石頭布">×</button>
      </div>

      {!state.winner ? <div className={styles.prompt} role="status" aria-live="polite">{state.message}</div> : null}
      <div className={styles.simpleRule}>石頭贏剪刀・剪刀贏布・布贏石頭</div>

      {drafting ? (
        <>
          <div className={styles.draftHands}>
            <section className={styles.draftPile} aria-label={`小貝目前有 ${state.beigoHand.length} 張牌`}>
              <strong>小貝的牌　{state.beigoHand.length}/5</strong>
              <div>{state.beigoHand.map((card) => card.source === "market" ? <GestureCard key={card.id} card={card} compact /> : <CardBack key={card.id} compact />)}</div>
            </section>
            <section className={`${styles.draftPile} ${styles.playerDraftPile}`} aria-label={`你目前有 ${state.playerHand.length} 張牌`}>
              <strong>你的牌　{state.playerHand.length}/5</strong>
              <div>{state.playerHand.map((card) => <GestureCard key={card.id} card={card} compact />)}</div>
            </section>
          </div>

          <div className={styles.marketPanel} aria-label="檯面上的四張公開牌">
            <strong>檯面公開牌</strong>
            <small>你和小貝輪流各拿兩張</small>
            <div className={styles.marketCards}>
              {state.market.map((item) => (
                <button
                  key={item.card.id}
                  type="button"
                  className={`${styles.marketCardButton} ${item.takenBy ? styles.marketCardTaken : ""}`}
                  disabled={state.phase !== "draftPlayer" || Boolean(item.takenBy)}
                  onClick={() => takeMarketCard(item.card.id)}
                  aria-label={item.takenBy ? `${GESTURE_META[item.card.gesture].name}，已被${item.takenBy === "player" ? "你" : "小貝"}拿走` : `拿取${GESTURE_META[item.card.gesture].name}`}
                >
                  <GestureCard card={item.card} />
                  {item.takenBy ? <i>{item.takenBy === "player" ? "你拿走" : "小貝拿走"}</i> : null}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.roundTrack} aria-label="五局結果">
            {Array.from({ length: 5 }, (_, index) => {
              const result = state.results[index];
              return (
                <span key={index} className={`${styles.roundChip} ${result ? styles[`round_${result.winner}`] : ""} ${index === state.roundIndex && !state.winner ? styles.roundCurrent : ""}`}>
                  <strong>{index + 1}</strong><small>{result ? result.winner === "tie" ? "平" : result.winner === "player" ? "你" : "貝" : "局"}</small>
                </span>
              );
            })}
          </div>

          <div className={styles.beigoHandInfo} aria-label={`小貝剩下 ${state.beigoHand.length} 張牌`}>
            <span>小貝剩 {state.beigoHand.length} 張</span>
            <div>{state.beigoHand.map((card) => <CardBack key={card.id} compact />)}</div>
          </div>

          <div className={styles.duelStage}>
            {state.currentPlayerCard && state.currentBeigoCard ? (
              <div className={styles.revealPair} aria-label="本局翻牌結果">
                <div><label>你</label><GestureCard card={state.currentPlayerCard} revealed /></div>
                <span>VS</span>
                <div><label>小貝</label><GestureCard card={state.currentBeigoCard} revealed /></div>
              </div>
            ) : (
              <div className={styles.chooseMark} aria-hidden="true"><span>✊</span><small>選一張出拳</small></div>
            )}
          </div>

          <div className={styles.handPanel} aria-label="你的手牌">
            <span className={styles.handTitle}>{state.phase === "battleChoose" ? `第 ${state.roundIndex + 1} 局：選一張牌` : "等待本局結果"}</span>
            <div className={styles.hand}>
              {state.playerHand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={styles.handCard}
                  disabled={state.phase !== "battleChoose" || Boolean(state.winner)}
                  onClick={() => playCard(card.id)}
                  aria-label={`出${GESTURE_META[card.gesture].name}，${GESTURE_META[card.gesture].beats}`}
                >
                  <GestureCard card={card} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {state.winner ? (
        <div className={styles.result} role="dialog" aria-label="剪刀石頭布結果">
          <strong>{state.winner === "draw" ? "五局平手！" : state.winner === "player" ? "你贏下五局對決！" : "小貝贏下五局對決！"}</strong>
          <span>你 {state.playerScore}：{state.beigoScore} 小貝</span>
          <small>先抽三張，再從公開牌各拿兩張；五局全部打完才結算</small>
          <div><button type="button" onClick={resetGame}>再比一次</button><button type="button" onClick={onExit}>先休息</button></div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BeigoPokerGame.module.css";

type Suit = "club" | "diamond" | "heart" | "spade";
type Phase = "player" | "discard" | "enemy" | "victory" | "defeat";
type EffectTone = "damage" | "heal" | "critical" | "utility";

type PokerCard = {
  id: string;
  rank: number;
  suit: Suit;
  split?: boolean;
};

type GameState = {
  playerHp: number;
  enemyHp: number;
  hand: PokerCard[];
  deck: PokerCard[];
  discard: PokerCard[];
  selectedIds: string[];
  unlockedSuits: Suit[];
  phase: Phase;
  turn: number;
  message: string;
  eventLog: string[];
  effect: { id: number; text: string; tone: EffectTone } | null;
  drawnPreview: PokerCard[];
};

const MAX_PLAYER_HP = 48;
const MAX_ENEMY_HP = 78;
const HAND_SIZE = 8;
const MAX_HAND_SIZE = 16;

const SUIT_ORDER: Suit[] = ["club", "diamond", "heart", "spade"];
const SUIT_META: Record<Suit, { symbol: string; name: string; label: string }> = {
  club: { symbol: "♣", name: "梅花", label: "分裂" },
  diamond: { symbol: "♦", name: "方塊", label: "濾牌" },
  heart: { symbol: "♥", name: "愛心", label: "溢血" },
  spade: { symbol: "♠", name: "黑桃", label: "追擊" },
};

const UNLOCK_TURN: Partial<Record<number, Suit>> = {
  3: "diamond",
  5: "heart",
  7: "spade",
};

let generatedCardId = 0;

function seededShuffle<T>(items: T[], seed: number) {
  const next = [...items];
  let value = seed >>> 0;
  for (let index = next.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const target = value % (index + 1);
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function makeSuitCards(suit: Suit, copies = 2) {
  const cards: PokerCard[] = [];
  for (let copy = 0; copy < copies; copy += 1) {
    for (let rank = 1; rank <= 12; rank += 1) {
      cards.push({ id: `${suit}-${copy}-${rank}`, suit, rank });
    }
  }
  return cards;
}

function makeGeneratedCard(suit: Suit, rank: number): PokerCard {
  generatedCardId += 1;
  return { id: `split-${suit}-${rank}-${generatedCardId}`, suit, rank, split: true };
}

function drawCards(deck: PokerCard[], discard: PokerCard[], count: number) {
  let nextDeck = [...deck];
  let nextDiscard = [...discard];
  const drawn: PokerCard[] = [];

  while (drawn.length < count) {
    if (nextDeck.length === 0) {
      if (nextDiscard.length === 0) break;
      nextDeck = seededShuffle(nextDiscard, 71 + generatedCardId + count);
      nextDiscard = [];
    }
    const card = nextDeck.shift();
    if (card) drawn.push(card);
  }

  return { drawn, deck: nextDeck, discard: nextDiscard };
}

function createInitialState(): GameState {
  const clubDeck = seededShuffle(makeSuitCards("club"), 20260818);
  const opening = drawCards(clubDeck, [], HAND_SIZE);
  return {
    playerHp: MAX_PLAYER_HP,
    enemyHp: MAX_ENEMY_HP,
    hand: opening.drawn,
    deck: opening.deck,
    discard: opening.discard,
    selectedIds: [],
    unlockedSuits: ["club"],
    phase: "player",
    turn: 1,
    message: "選擇同點數，或三至五張連號牌攻擊小貝",
    eventLog: ["牌局開始：梅花牌組已啟用"],
    effect: null,
    drawnPreview: [],
  };
}

function getSplitRanks(rank: number) {
  if (![3, 6, 9, 12].includes(rank)) return [];
  const splitRank = rank / 3;
  return [splitRank, splitRank, splitRank];
}

function cardAbility(card: PokerCard) {
  if (card.suit === "club" && [3, 6, 9, 12].includes(card.rank)) return "分成 3 份";
  if (card.suit === "diamond" && card.rank === 4) return "全換";
  if (card.suit === "diamond" && card.rank === 5) return "棄 1 抽 2";
  if (card.suit === "heart" && [2, 4, 6, 12].includes(card.rank)) return `回 ${card.rank}`;
  if (card.suit === "spade") return "追擊";
  return null;
}

function getHandMeta(cards: PokerCard[]) {
  if (cards.length === 0) return { name: "尚未選牌", multiplier: 1, valid: false, isCombo: false };

  const ranks = cards.map((card) => card.rank);
  const allSameRank = ranks.every((rank) => rank === ranks[0]);
  if (allSameRank) {
    if (cards.length >= 5) return { name: "五張同點", multiplier: 1.75, valid: true, isCombo: true };
    if (cards.length === 4) return { name: "四條", multiplier: 1.5, valid: true, isCombo: true };
    if (cards.length === 3) return { name: "三條", multiplier: 1.35, valid: true, isCombo: true };
    if (cards.length === 2) return { name: "對子", multiplier: 1.2, valid: true, isCombo: true };
    return { name: "單牌", multiplier: 1, valid: true, isCombo: false };
  }

  const sortedRanks = [...ranks].sort((a, b) => a - b);
  const hasUniqueRanks = new Set(sortedRanks).size === sortedRanks.length;
  const isConsecutive = sortedRanks.every((rank, index) => index === 0 || rank === sortedRanks[index - 1] + 1);
  if (cards.length >= 3 && hasUniqueRanks && isConsecutive) {
    if (cards.length >= 5) return { name: "五張順子", multiplier: 1.6, valid: true, isCombo: true };
    if (cards.length === 4) return { name: "四張順子", multiplier: 1.4, valid: true, isCombo: true };
    return { name: "三張順子", multiplier: 1.25, valid: true, isCombo: true };
  }

  return { name: "牌型未完成", multiplier: 1, valid: false, isCombo: false };
}

function getHandDamage(cards: PokerCard[]) {
  const handMeta = getHandMeta(cards);
  if (!handMeta.valid) return 0;
  const faceValue = cards.reduce((sum, card) => sum + card.rank, 0);
  return Math.ceil(faceValue * handMeta.multiplier);
}

function enemyIntent(turn: number) {
  return Math.min(7, 2 + Math.floor(turn / 3));
}

function appendLog(log: string[], entries: string[]) {
  return [...entries, ...log].slice(0, 4);
}

function PlayingCard({
  card,
  selected = false,
  disabled = false,
  mini = false,
  onClick,
}: {
  card: PokerCard;
  selected?: boolean;
  disabled?: boolean;
  mini?: boolean;
  onClick?: () => void;
}) {
  const meta = SUIT_META[card.suit];
  const ability = cardAbility(card);
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[`card_${card.suit}`]} ${selected ? styles.cardSelected : ""} ${mini ? styles.cardMini : ""}`}
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-pressed={selected}
      aria-label={`${meta.name} ${card.rank}${ability ? `，${ability}` : ""}`}
    >
      <span className={styles.cardCorner}><strong>{card.rank}</strong><i>{meta.symbol}</i></span>
      <span className={styles.cardCenter} aria-hidden="true">{meta.symbol}</span>
      {ability && <span className={styles.cardAbility}>{ability}</span>}
      {card.split && <span className={styles.splitMark}>+</span>}
    </button>
  );
}

export function BeigoPokerGame() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [showRules, setShowRules] = useState(true);
  const stateRef = useRef(state);
  const timersRef = useRef<number[]>([]);

  const commit = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const resetGame = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    commit(createInitialState());
    setShowRules(false);
  }, [commit]);

  const startNextTurn = useCallback((afterAttack: GameState) => {
    let deck = afterAttack.deck;
    let unlockedSuits = afterAttack.unlockedSuits;
    let eventLog = afterAttack.eventLog;
    let message = "輪到你了，找同點數牌型或連號順子";
    const nextTurn = afterAttack.turn + 1;
    const unlocked = UNLOCK_TURN[nextTurn];

    if (unlocked && !unlockedSuits.includes(unlocked)) {
      const addedCards = seededShuffle(makeSuitCards(unlocked), 4100 + nextTurn);
      deck = seededShuffle([...deck, ...addedCards], 8100 + nextTurn);
      unlockedSuits = [...unlockedSuits, unlocked];
      const meta = SUIT_META[unlocked];
      message = `${meta.symbol} ${meta.name}牌組解鎖：${meta.label}`;
      eventLog = appendLog(eventLog, [`解鎖 ${meta.name}｜${meta.label}`]);
    }

    const draw = drawCards(deck, afterAttack.discard, Math.max(0, HAND_SIZE - afterAttack.hand.length));
    commit({
      ...afterAttack,
      hand: [...afterAttack.hand, ...draw.drawn],
      deck: draw.deck,
      discard: draw.discard,
      selectedIds: [],
      unlockedSuits,
      phase: "player",
      turn: nextTurn,
      message,
      eventLog,
      effect: unlocked ? { id: Date.now(), text: `${SUIT_META[unlocked].symbol} 解鎖`, tone: "utility" } : null,
      drawnPreview: [],
    });
  }, [commit]);

  const runEnemyTurn = useCallback((resolved: GameState) => {
    if (resolved.enemyHp <= 0) return;
    schedule(() => {
      const current = stateRef.current;
      if (current.phase !== "enemy") return;
      const damage = enemyIntent(current.turn);
      const playerHp = Math.max(0, current.playerHp - damage);
      const hit: GameState = {
        ...current,
        playerHp,
        message: `小貝打出搗蛋牌，對你造成 ${damage} 點傷害`,
        eventLog: appendLog(current.eventLog, [`小貝的搗蛋牌造成 ${damage} 傷害`]),
        effect: { id: Date.now(), text: `-${damage}`, tone: "damage" },
      };
      if (playerHp <= 0) {
        commit({ ...hit, phase: "defeat", message: "牌被小貝搶光了……再試一局吧！" });
        return;
      }
      commit(hit);
      schedule(() => startNextTurn(stateRef.current), 650);
    }, 800);
  }, [commit, schedule, startNextTurn]);

  const resolvePlay = useCallback((baseState: GameState) => {
    const selected = baseState.hand.filter((card) => baseState.selectedIds.includes(card.id));
    if (selected.length === 0) return;
    const handMeta = getHandMeta(selected);
    if (!handMeta.valid) return;

    const selectedIds = new Set(selected.map((card) => card.id));
    let hand = baseState.hand.filter((card) => !selectedIds.has(card.id));
    let deck = baseState.deck;
    let discard = [...baseState.discard, ...selected];
    const logs: string[] = [];
    const rank = selected[0].rank;
    const isCombo = handMeta.isCombo;
    const faceValue = selected.reduce((sum, card) => sum + card.rank, 0);
    let damage = getHandDamage(selected);
    const heal = selected
      .filter((card) => card.suit === "heart" && [2, 4, 6, 12].includes(card.rank))
      .reduce((sum, card) => sum + card.rank, 0);

    if (selected.some((card) => card.suit === "diamond" && card.rank === 4)) {
      const replaceCount = hand.length;
      discard = [...discard, ...hand];
      const redraw = drawCards(deck, discard, replaceCount);
      hand = redraw.drawn;
      deck = redraw.deck;
      discard = redraw.discard;
      logs.push(`方塊 4 全換 ${replaceCount} 張手牌`);
    }

    let spadeDrawn: PokerCard[] = [];
    let critical = false;
    if (isCombo && selected.some((card) => card.suit === "spade")) {
      const pursuit = drawCards(deck, discard, 2);
      spadeDrawn = pursuit.drawn;
      deck = pursuit.deck;
      discard = pursuit.discard;
      const room = Math.max(0, MAX_HAND_SIZE - hand.length);
      hand = [...hand, ...spadeDrawn.slice(0, room)];
      critical = spadeDrawn.length === 2 && spadeDrawn[0].rank === spadeDrawn[1].rank;
      if (critical) damage = Math.ceil(damage * 1.5);
      logs.push(critical ? "黑桃追擊成對：傷害 ×1.5！" : "黑桃追擊抽 2 張");
    }

    const healedHp = Math.min(MAX_PLAYER_HP, baseState.playerHp + heal);
    const overflow = Math.max(0, baseState.playerHp + heal - MAX_PLAYER_HP);
    damage += overflow;
    const enemyHp = Math.max(0, baseState.enemyHp - damage);
    if (isCombo) {
      logs.unshift(`${handMeta.name}｜${faceValue} ×${handMeta.multiplier}${critical ? " ×1.5 暴擊" : ""}，造成 ${damage} 傷害`);
    } else logs.unshift(`${rank} 點單牌，造成 ${damage} 傷害`);
    if (heal > 0) logs.push(overflow > 0 ? `回復 ${heal}，溢出 ${overflow} 轉為傷害` : `回復 ${heal} 點生命`);

    const refill = drawCards(deck, discard, Math.max(0, HAND_SIZE - hand.length));
    hand = [...hand, ...refill.drawn];
    deck = refill.deck;
    discard = refill.discard;

    const result: GameState = {
      ...baseState,
      playerHp: healedHp,
      enemyHp,
      hand,
      deck,
      discard,
      selectedIds: [],
      phase: enemyHp <= 0 ? "victory" : "enemy",
      message: enemyHp <= 0 ? "漂亮收尾！你贏下了小貝的怪手牌局" : critical ? "追擊成對，Combo 暴擊！" : `造成 ${damage} 點傷害，小貝要出牌了`,
      eventLog: appendLog(baseState.eventLog, logs),
      effect: { id: Date.now(), text: critical ? `CRIT ${damage}` : `-${damage}`, tone: critical ? "critical" : heal > 0 ? "heal" : "damage" },
      drawnPreview: spadeDrawn,
    };
    commit(result);
    if (enemyHp > 0) runEnemyTurn(result);
  }, [commit, runEnemyTurn]);

  const playSelected = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "player" || current.selectedIds.length === 0) return;
    const selected = current.hand.filter((card) => current.selectedIds.includes(card.id));
    if (!getHandMeta(selected).valid) return;
    const needsDiscard = selected.some((card) => card.suit === "diamond" && card.rank === 5);
    const hasDiscardTarget = current.hand.some((card) => !current.selectedIds.includes(card.id));
    if (needsDiscard && hasDiscardTarget) {
      commit({ ...current, phase: "discard", message: "方塊 5：指定一張未選的手牌棄掉，再抽兩張" });
      return;
    }
    resolvePlay(current);
  }, [commit, resolvePlay]);

  const splitSelected = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "player" || current.selectedIds.length === 0) return;
    const selectedIds = new Set(current.selectedIds);
    const splitTargets = current.hand.filter(
      (card) => selectedIds.has(card.id) && card.suit === "club" && getSplitRanks(card.rank).length === 3,
    );
    if (splitTargets.length === 0) return;
    if (current.hand.length + splitTargets.length * 2 > MAX_HAND_SIZE) {
      commit({ ...current, message: `手牌上限為 ${MAX_HAND_SIZE} 張，請先出牌再分裂` });
      return;
    }

    const targetIds = new Set(splitTargets.map((card) => card.id));
    const hand = current.hand.flatMap((card) => {
      if (!targetIds.has(card.id)) return [card];
      return getSplitRanks(card.rank).map((rank) => makeGeneratedCard("club", rank));
    });
    const descriptions = splitTargets.map((card) => `${card.rank}→${card.rank / 3}＋${card.rank / 3}＋${card.rank / 3}`);
    commit({
      ...current,
      hand,
      selectedIds: [],
      message: `分裂完成：${descriptions.join("、")}，重新選擇要出的牌`,
      eventLog: appendLog(current.eventLog, [`出牌前分裂｜${descriptions.join("、")}`]),
      effect: { id: Date.now(), text: "SPLIT ×3", tone: "utility" },
    });
  }, [commit]);

  const discardForDiamond = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.phase !== "discard" || current.selectedIds.includes(cardId)) return;
    const target = current.hand.find((card) => card.id === cardId);
    if (!target) return;
    const remaining = current.hand.filter((card) => card.id !== cardId);
    const draw = drawCards(current.deck, [...current.discard, target], 2);
    const prepared: GameState = {
      ...current,
      hand: [...remaining, ...draw.drawn].slice(0, MAX_HAND_SIZE),
      deck: draw.deck,
      discard: draw.discard,
      message: `棄掉 ${SUIT_META[target.suit].symbol}${target.rank}，抽了兩張牌`,
      eventLog: appendLog(current.eventLog, [`方塊 5：棄 ${SUIT_META[target.suit].symbol}${target.rank}，抽 2`]),
    };
    commit(prepared);
    schedule(() => resolvePlay(stateRef.current), 360);
  }, [commit, resolvePlay, schedule]);

  const toggleCard = useCallback((cardId: string) => {
    const current = stateRef.current;
    if (current.phase === "discard") {
      discardForDiamond(cardId);
      return;
    }
    if (current.phase !== "player") return;
    const card = current.hand.find((item) => item.id === cardId);
    if (!card) return;
    const alreadySelected = current.selectedIds.includes(cardId);
    let selectedIds: string[];
    if (alreadySelected) selectedIds = current.selectedIds.filter((id) => id !== cardId);
    else selectedIds = [...current.selectedIds, cardId].slice(0, 5);
    const nextSelected = current.hand.filter((item) => selectedIds.includes(item.id));
    const handMeta = getHandMeta(nextSelected);
    const message = selectedIds.length === 0
      ? "選擇同點數，或三至五張連號牌"
      : handMeta.valid && handMeta.isCombo
        ? `${handMeta.name}｜傷害倍率 ×${handMeta.multiplier}`
        : selectedIds.length === 1
          ? "再選同點數，或接成至少三張順子"
          : "牌型未完成：繼續補連號，或取消不需要的牌";
    commit({ ...current, selectedIds, message });
  }, [commit, discardForDiamond]);

  const selectedCards = state.hand.filter((card) => state.selectedIds.includes(card.id));
  const selectedSplitTargets = selectedCards.filter(
    (card) => card.suit === "club" && getSplitRanks(card.rank).length === 3,
  );
  const canSplitSelected =
    state.phase === "player" &&
    selectedSplitTargets.length > 0 &&
    state.hand.length + selectedSplitTargets.length * 2 <= MAX_HAND_SIZE;
  const selectedRank = selectedCards[0]?.rank ?? 0;
  const selectedHandMeta = getHandMeta(selectedCards);
  const previewDamage = getHandDamage(selectedCards);
  const progress = Math.max(0, (state.enemyHp / MAX_ENEMY_HP) * 100);
  const playerProgress = Math.max(0, (state.playerHp / MAX_PLAYER_HP) * 100);

  return (
    <main className={styles.root}>
      <div className={styles.ambient} aria-hidden="true"><i /><i /><i /><i /></div>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandPaw}>♣</span>
          <span><small>小貝狗小遊戲系列</small><strong>怪手牌局</strong></span>
        </div>
        <nav>
          <button type="button" onClick={() => setShowRules(true)}>玩法</button>
          <Link href="/game/lobby">離開牌桌</Link>
        </nav>
      </header>

      <section className={styles.gameShell}>
        <div className={styles.opponentArea}>
          <div className={styles.opponentName}><span>牌桌主人</span><strong>小貝</strong></div>
          <div className={`${styles.enemyPortrait} ${state.phase === "enemy" ? styles.enemyAttacking : ""}`}>
            <span className={styles.intent}>下一擊 <strong>{enemyIntent(state.turn)}</strong></span>
            <img src="/images/lobby/beigo_idle.png" alt="開心坐在牌桌對面的小貝" />
            {state.effect && state.effect.tone !== "heal" && <b key={state.effect.id} className={`${styles.floatingEffect} ${styles[`effect_${state.effect.tone}`]}`}>{state.effect.text}</b>}
          </div>
          <div className={styles.healthBlock}>
            <div className={styles.healthLabel}><span>小貝的耐心</span><strong>{state.enemyHp} / {MAX_ENEMY_HP}</strong></div>
            <div className={styles.healthTrack}><i style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <div className={styles.tableCenter}>
          <div className={styles.deckStack} aria-label={`牌庫剩餘 ${state.deck.length} 張`}><i /><i /><strong>♣</strong><small>{state.deck.length}</small></div>
          <div className={styles.turnMessage}>
            <span>ROUND {state.turn}</span>
            <strong>{state.message}</strong>
          </div>
          <div className={styles.drawnCards}>
            {state.drawnPreview.length > 0 && <small>黑桃追擊</small>}
            {state.drawnPreview.map((card) => <PlayingCard key={card.id} card={card} mini />)}
          </div>
        </div>

        <aside className={styles.suitRail} aria-label="花色能力解鎖進度">
          {SUIT_ORDER.map((suit) => {
            const unlocked = state.unlockedSuits.includes(suit);
            const meta = SUIT_META[suit];
            return <div key={suit} className={`${styles.suitToken} ${styles[`suit_${suit}`]} ${unlocked ? styles.suitUnlocked : ""}`}><b>{meta.symbol}</b><span><strong>{meta.name}</strong><small>{unlocked ? meta.label : "尚未解鎖"}</small></span></div>;
          })}
        </aside>

        <aside className={styles.eventLog}>
          <strong>牌局紀錄</strong>
          {state.eventLog.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)}
        </aside>

        <div className={styles.playerArea}>
          <div className={styles.playerHud}>
            <div className={styles.playerAvatar}>你</div>
            <div className={styles.playerHealth}>
              <span><strong>{state.playerHp}</strong> / {MAX_PLAYER_HP}</span>
              <div><i style={{ width: `${playerProgress}%` }} /></div>
            </div>
            <div className={styles.drawInfo}><span>手牌 {state.hand.length}</span><span>棄牌 {state.discard.length}</span></div>
          </div>

          <div className={`${styles.hand} ${state.phase === "discard" ? styles.handDiscarding : ""}`}>
            {state.hand.map((card, index) => (
              <div key={card.id} className={styles.cardSlot} style={{ "--card-index": index, "--card-total": state.hand.length } as React.CSSProperties}>
                <PlayingCard
                  card={card}
                  selected={state.selectedIds.includes(card.id)}
                  disabled={state.phase !== "player" && state.phase !== "discard"}
                  onClick={() => toggleCard(card.id)}
                />
              </div>
            ))}
          </div>

          <div className={`${styles.actionBar} ${selectedSplitTargets.length > 0 ? styles.actionBarSplitReady : ""}`}>
            <div className={styles.comboReadout}>
              <small>{selectedCards.length >= 2 ? selectedHandMeta.name : "CARD DAMAGE"}</small>
              <strong>{previewDamage || "—"}</strong>
              <span>{selectedCards.length > 0 ? `總值 ${selectedCards.reduce((sum, card) => sum + card.rank, 0)} · 倍率 ${selectedHandMeta.multiplier}` : "選牌後預覽"}</span>
            </div>
            {selectedSplitTargets.length > 0 && (
              <button type="button" className={styles.splitButton} disabled={!canSplitSelected} onClick={splitSelected}>
                <span>先分成三份</span>
                <strong>
                  {canSplitSelected
                    ? `${selectedRank} → ${selectedRank / 3}＋${selectedRank / 3}＋${selectedRank / 3}`
                    : `手牌上限 ${MAX_HAND_SIZE} 張`}
                </strong>
              </button>
            )}
            <button type="button" className={styles.playButton} disabled={state.phase !== "player" || !selectedHandMeta.valid} onClick={playSelected}>
              <span>{selectedHandMeta.isCombo ? `打出${selectedHandMeta.name}` : "打出這張"}</span>
              <strong>{selectedCards.length === 0 ? "請先選牌" : selectedHandMeta.valid ? `${previewDamage} 傷害` : "牌型未完成"}</strong>
            </button>
          </div>
        </div>
      </section>

      {(state.phase === "victory" || state.phase === "defeat") && (
        <div className={styles.resultOverlay}>
          <section className={styles.resultCard}>
            <span className={styles.resultSuit}>{state.phase === "victory" ? "♠" : "♣"}</span>
            <small>{state.phase === "victory" ? "TABLE CLEARED" : "TRY AGAIN"}</small>
            <h1>{state.phase === "victory" ? "你贏下牌局！" : "被小貝反將一軍"}</h1>
            <p>{state.phase === "victory" ? `用了 ${state.turn} 回合破解四種花色的連鎖。` : "同點數牌型與三張以上的順子，都能獲得額外傷害倍率。"}</p>
            <button type="button" onClick={resetGame}>再玩一局</button>
            <Link href="/game/lobby">回小貝大廳</Link>
          </section>
        </div>
      )}

      {showRules && (
        <div className={styles.rulesOverlay} role="dialog" aria-modal="true" aria-labelledby="rules-title">
          <section className={styles.rulesCard}>
            <button type="button" className={styles.closeRules} onClick={() => setShowRules(false)} aria-label="關閉玩法">×</button>
            <span className={styles.eyebrow}>HOW TO PLAY</span>
            <h1 id="rules-title">從梅花開始，讓牌組越打越怪</h1>
            <p className={styles.rulesLead}>每回合可出單牌、同點數牌型，或三至五張<strong>連號順子</strong>。對子 ×1.2、三條 ×1.35、四條 ×1.5；順子依長度獲得 ×1.25 至 ×1.6。</p>
            <div className={styles.ruleGrid}>
              <article className={styles.ruleClub}><b>♣</b><span><strong>梅花・出牌前分裂</strong><small>3、6、9、12 可先分成三張 1/3 點數牌，再重新決定如何出牌。</small></span></article>
              <article className={styles.ruleDiamond}><b>♦</b><span><strong>方塊・濾牌</strong><small>4 全換手牌；5 可指定棄一張、再抽兩張。</small></span></article>
              <article className={styles.ruleHeart}><b>♥</b><span><strong>愛心・溢血</strong><small>2、4、6、12 回復同等生命；超過上限的治療轉為傷害。</small></span></article>
              <article className={styles.ruleSpade}><b>♠</b><span><strong>黑桃・追擊</strong><small>參與 Combo 時抽兩張；若兩張同點數，該次傷害 ×1.5。</small></span></article>
            </div>
            <button type="button" className={styles.startButton} onClick={() => setShowRules(false)}>坐上牌桌</button>
          </section>
        </div>
      )}
    </main>
  );
}

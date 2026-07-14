"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { SUNBEAST_REGISTRY, type SunbeastId } from "@/lib/game/sunbeastRegistry";
import type { CardDuelReaction } from "./LobbyBeigoCardDuel";
import styles from "./LobbyBeigoSunCards.module.css";

type Owner = "player" | "beigo";
type Winner = Owner | "draw";
type Phase = "hub" | "deck" | "shop" | "planning" | "battle" | "complete";
type CardKind =
  | "naotaro_dash"
  | "naotaro_guard"
  | "naotaro_cheer"
  | "naotaro_dodge"
  | "frog_escape"
  | "frog_team"
  | "cat_coin"
  | "cat_ambush"
  | "chicken_dawn"
  | "chicken_solo"
  | "koala_guard"
  | "koala_center"
  | "naotaro_charge"
  | "naotaro_gate";

type CardDefinition = {
  name: string;
  beastId: SunbeastId;
  imagePath?: string;
  power: number;
  icon: string;
  ability: string;
  shopPrice: number;
};

type CardInstance = { id: string; kind: CardKind };
type SideState = { deck: CardInstance[]; hand: CardInstance[]; discard: CardInstance[] };
type HandDrag = {
  pointerId: number;
  cardId: string;
  kind: CardKind;
  startX: number;
  startY: number;
  x: number;
  y: number;
  tilt: number;
  active: boolean;
};
type LaneOutcome = {
  winner: Owner | "tie" | null;
  damage: number;
  dodged: boolean;
  koalaReduced: boolean;
  gateReduced: boolean;
};

type PlayerProfile = {
  sunCoins: number;
  ownedCards: CardKind[];
  activeDeck: CardKind[];
  matches: number;
  beigoLevel: number;
};

type GameState = {
  phase: Phase;
  round: number;
  beigoLevel: number;
  player: SideState;
  beigo: SideState;
  playerHp: number;
  beigoHp: number;
  playerLanes: Array<CardInstance | null>;
  beigoLanes: Array<CardInstance | null>;
  selectedCardId: string | null;
  outcomes: LaneOutcome[] | null;
  winner: Winner | null;
  message: string;
};

type Props = {
  onExit: () => void;
  onReaction: (reaction: CardDuelReaction) => void;
};

const MAX_HP = 7;
const MAX_ROUNDS = 5;
const DECK_SIZE = 6;
const CARDS_PER_ROUND = 2;
const PROFILE_KEY = "moment-sun-cards-profile-v4";
const LANE_LABELS = ["左路", "中路", "右路"];

const CARD_DEFINITIONS: Record<CardKind, CardDefinition> = {
  naotaro_dash: { name: "飛奔直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-dash.png", power: 2, icon: "側", ability: "飛奔：放在左右路時力量 +1", shopPrice: 4 },
  naotaro_guard: { name: "警戒直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-guard.png", power: 2, icon: "中", ability: "警戒：放在中路時力量 +1", shopPrice: 4 },
  naotaro_cheer: { name: "打氣直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-cheer.png", power: 1, icon: "+1", ability: "打氣：相鄰隊友力量 +1", shopPrice: 4 },
  naotaro_dodge: { name: "閃身直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-dodge.png", power: 1, icon: "↗", ability: "閃身：落敗時擋住這一路傷害", shopPrice: 4 },
  frog_escape: { name: "逃跳蛙", beastId: "frog", power: 1, icon: "↗", ability: "逃跳：落敗時擋住這一路傷害", shopPrice: 2 },
  frog_team: { name: "連跳蛙", beastId: "frog", power: 2, icon: "+1", ability: "連跳：相鄰有青蛙時力量 +1", shopPrice: 3 },
  cat_coin: { name: "中路貓", beastId: "cat", power: 2, icon: "中", ability: "撲擊：放在中路時力量 +1", shopPrice: 3 },
  cat_ambush: { name: "埋伏貓", beastId: "cat", power: 2, icon: "側", ability: "埋伏：放在左右路時力量 +1", shopPrice: 4 },
  chicken_dawn: { name: "報曉雞", beastId: "chicken", power: 2, icon: "+1", ability: "報曉：相鄰隊友力量 +1", shopPrice: 3 },
  chicken_solo: { name: "夾攻雞", beastId: "chicken", power: 2, icon: "夾", ability: "夾攻：和隊友分站左右時力量 +1", shopPrice: 4 },
  koala_guard: { name: "抱抱熊", beastId: "koala", power: 3, icon: "盾", ability: "抱緊：替相鄰一路減少 1 傷害", shopPrice: 5 },
  koala_center: { name: "守中熊", beastId: "koala", power: 3, icon: "中", ability: "守中：放在中路時力量 +1", shopPrice: 5 },
  naotaro_charge: { name: "衝撞直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-charge.png", power: 3, icon: "×2", ability: "衝撞：撞贏時造成 2 傷害", shopPrice: 8 },
  naotaro_gate: { name: "守門直太郎", beastId: "naotaro", imagePath: "/images/sun-cards/naotaro-gate.png", power: 3, icon: "門", ability: "守門：這一路受到的傷害 −1", shopPrice: 7 },
};

const STARTER_DECK: CardKind[] = [
  "naotaro_dash",
  "naotaro_guard",
  "naotaro_cheer",
  "naotaro_dodge",
  "naotaro_charge",
  "naotaro_gate",
];

const SHOP_POOL: CardKind[] = [
  "frog_escape",
  "cat_coin",
  "chicken_dawn",
  "frog_team",
  "cat_ambush",
  "koala_guard",
  "chicken_solo",
  "koala_center",
];

const BEIGO_DECKS: Record<number, CardKind[]> = {
  1: ["frog_escape", "frog_escape", "frog_escape", "frog_team", "cat_coin", "cat_ambush"],
  2: ["frog_escape", "frog_escape", "frog_team", "cat_coin", "cat_ambush", "chicken_dawn"],
  3: ["frog_escape", "frog_team", "cat_coin", "chicken_dawn", "koala_guard", "koala_center"],
  4: ["frog_team", "cat_ambush", "chicken_dawn", "koala_guard", "koala_center", "naotaro_charge"],
  5: ["cat_ambush", "chicken_dawn", "koala_guard", "koala_center", "naotaro_charge", "naotaro_gate"],
};

const DEFAULT_PROFILE: PlayerProfile = {
  sunCoins: 3,
  ownedCards: STARTER_DECK,
  activeDeck: STARTER_DECK,
  matches: 0,
  beigoLevel: 1,
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

function getShopOffers(matches: number) {
  const start = matches % SHOP_POOL.length;
  return [0, 2, 4].map((offset) => SHOP_POOL[(start + offset) % SHOP_POOL.length]);
}

function sanitizeActiveDeck(candidate: unknown, ownedCards: CardKind[]) {
  const remaining = new Map<CardKind, number>();
  ownedCards.forEach((kind) => remaining.set(kind, (remaining.get(kind) ?? 0) + 1));
  const result: CardKind[] = [];
  if (Array.isArray(candidate)) {
    candidate.forEach((value) => {
      if (result.length >= DECK_SIZE || typeof value !== "string" || !(value in CARD_DEFINITIONS)) return;
      const kind = value as CardKind;
      if ((remaining.get(kind) ?? 0) <= 0) return;
      result.push(kind);
      remaining.set(kind, (remaining.get(kind) ?? 0) - 1);
    });
  }
  ownedCards.forEach((kind) => {
    if (result.length >= DECK_SIZE || (remaining.get(kind) ?? 0) <= 0) return;
    result.push(kind);
    remaining.set(kind, (remaining.get(kind) ?? 0) - 1);
  });
  return result;
}

function loadProfile(): PlayerProfile {
  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    if (!saved) return DEFAULT_PROFILE;
    const parsed = JSON.parse(saved) as Partial<PlayerProfile>;
    const ownedCards = Array.isArray(parsed.ownedCards)
      ? parsed.ownedCards.filter((kind): kind is CardKind => typeof kind === "string" && kind in CARD_DEFINITIONS)
      : [];
    const safeOwned = ownedCards.length >= DECK_SIZE ? ownedCards : STARTER_DECK;
    return {
      sunCoins: Math.max(0, Number(parsed.sunCoins) || 0),
      ownedCards: safeOwned,
      activeDeck: sanitizeActiveDeck(parsed.activeDeck, safeOwned),
      matches: Math.max(0, Number(parsed.matches) || 0),
      beigoLevel: Math.min(5, Math.max(1, Number(parsed.beigoLevel) || 1)),
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile: PlayerProfile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // The current game remains playable when persistent storage is unavailable.
  }
}

function createSide(owner: Owner, kinds: CardKind[]): SideState {
  deckSerial += 1;
  const cards = shuffle(kinds.map((kind, index) => ({ id: `${owner}-${kind}-${index}-${deckSerial}`, kind })));
  return { deck: cards.slice(4), hand: cards.slice(0, 4), discard: [] };
}

function createGameState(profile: PlayerProfile, phase: Phase = "planning"): GameState {
  const tutorial = profile.matches === 0;
  return {
    phase,
    round: 1,
    beigoLevel: profile.beigoLevel,
    player: createSide("player", profile.activeDeck),
    beigo: createSide("beigo", BEIGO_DECKS[profile.beigoLevel]),
    playerHp: MAX_HP,
    beigoHp: tutorial ? 5 : MAX_HP,
    playerLanes: [null, null, null],
    beigoLanes: [null, null, null],
    selectedCardId: null,
    outcomes: null,
    winner: null,
    message: tutorial ? "① 按住手札，拖到上方卡槽" : "拖 2 張手札到三路",
  };
}

function getCardPower(card: CardInstance, laneIndex: number, lanes: Array<CardInstance | null>) {
  let power = CARD_DEFINITIONS[card.kind].power;
  if (card.kind === "naotaro_dash" && laneIndex !== 1) power += 1;
  if (card.kind === "naotaro_guard" && laneIndex === 1) power += 1;
  if (card.kind === "cat_coin" && laneIndex === 1) power += 1;
  if (card.kind === "cat_ambush" && laneIndex !== 1) power += 1;
  if (card.kind === "chicken_solo" && lanes.some((other, index) => Boolean(other) && index !== laneIndex && Math.abs(index - laneIndex) === 2)) power += 1;
  if (card.kind === "koala_center" && laneIndex === 1) power += 1;
  if (card.kind === "frog_team" && lanes.some((other, index) => other?.kind.startsWith("frog_") && index !== laneIndex && Math.abs(index - laneIndex) === 1)) power += 1;
  if (lanes.some((other, index) => other?.kind === "naotaro_cheer" && index !== laneIndex && Math.abs(index - laneIndex) === 1)) power += 1;
  if (lanes.some((other, index) => other?.kind === "chicken_dawn" && index !== laneIndex && Math.abs(index - laneIndex) === 1)) power += 1;
  return power;
}

function drawCards(side: SideState, count: number): SideState {
  let deck = [...side.deck];
  let discard = [...side.discard];
  const hand = [...side.hand];
  for (let draw = 0; draw < count && hand.length < 4; draw += 1) {
    if (deck.length === 0 && discard.length > 0) {
      deck = shuffle(discard);
      discard = [];
    }
    const card = deck.shift();
    if (!card) break;
    hand.push(card);
  }
  return { deck, discard, hand };
}

function chooseBeigoPlan(side: SideState, level: number) {
  let bestPlan: Array<CardInstance | null> = [null, null, null];
  let bestScore = -Infinity;
  const targetCount = Math.min(CARDS_PER_ROUND, side.hand.length);
  const search = (laneIndex: number, plan: Array<CardInstance | null>, used: Set<string>) => {
    if (laneIndex === 3) {
      if (plan.filter(Boolean).length !== targetCount) return;
      let score = plan.reduce((total, card, index) => total + (card ? getCardPower(card, index, plan) : 0), 0);
      plan.forEach((card, index) => {
        if (!card) return;
        if (card.kind === "naotaro_charge") score += 1.3;
        if (card.kind === "koala_guard" && index === 1) score += 0.7;
      });
      score += Math.random() * Math.max(0.35, 5 - level * 0.85);
      if (score > bestScore) {
        bestScore = score;
        bestPlan = [...plan];
      }
      return;
    }
    search(laneIndex + 1, [...plan, null], used);
    side.hand.forEach((card) => {
      if (used.has(card.id)) return;
      const nextUsed = new Set(used);
      nextUsed.add(card.id);
      search(laneIndex + 1, [...plan, card], nextUsed);
    });
  };
  search(0, [], new Set());
  return bestPlan;
}

function resolveLanes(playerLanes: Array<CardInstance | null>, beigoLanes: Array<CardInstance | null>) {
  const outcomes: LaneOutcome[] = playerLanes.map((playerCard, index) => {
    const beigoCard = beigoLanes[index];
    if (!playerCard && !beigoCard) return { winner: null, damage: 0, dodged: false, koalaReduced: false, gateReduced: false };
    const playerPower = playerCard ? getCardPower(playerCard, index, playerLanes) : 0;
    const beigoPower = beigoCard ? getCardPower(beigoCard, index, beigoLanes) : 0;
    if (playerPower === beigoPower) return { winner: "tie", damage: 0, dodged: false, koalaReduced: false, gateReduced: false };
    const winner: Owner = playerPower > beigoPower ? "player" : "beigo";
    const winningCard = winner === "player" ? playerCard : beigoCard;
    const losingCard = winner === "player" ? beigoCard : playerCard;
    const dodged = losingCard?.kind === "frog_escape" || losingCard?.kind === "naotaro_dodge";
    const gateReduced = losingCard?.kind === "naotaro_gate";
    const baseDamage = winningCard?.kind === "naotaro_charge" ? 2 : 1;
    return {
      winner,
      damage: dodged ? 0 : Math.max(0, baseDamage - (gateReduced ? 1 : 0)),
      dodged,
      koalaReduced: false,
      gateReduced,
    };
  });
  (["player", "beigo"] as Owner[]).forEach((defender) => {
    const defenderLanes = defender === "player" ? playerLanes : beigoLanes;
    const usedKoalas = new Set<number>();
    outcomes.forEach((outcome, laneIndex) => {
      if (outcome.damage <= 0 || outcome.winner === defender || outcome.winner === "tie" || outcome.winner === null) return;
      const koalaIndex = defenderLanes.findIndex((card, index) => card?.kind === "koala_guard" && Math.abs(index - laneIndex) === 1 && !usedKoalas.has(index));
      if (koalaIndex < 0) return;
      usedKoalas.add(koalaIndex);
      outcome.damage = Math.max(0, outcome.damage - 1);
      outcome.koalaReduced = true;
    });
  });
  return outcomes;
}

function rewardFor(winner: Winner) {
  return winner === "player" ? 5 : winner === "draw" ? 3 : 2;
}

function CardFace({ card, owner, compact = false, power }: { card: CardInstance; owner: Owner; compact?: boolean; power?: number }) {
  const definition = CARD_DEFINITIONS[card.kind];
  const beast = SUNBEAST_REGISTRY[definition.beastId];
  return (
    <span className={`${styles.cardFace} ${owner === "beigo" ? styles.cardBeigo : styles.cardPlayer} ${compact ? styles.cardCompact : ""}`}>
      <b className={styles.cardPower}><span aria-hidden="true">攻</span>{power ?? definition.power}</b>
      <span className={styles.cardImage}><Image src={definition.imagePath ?? beast.imagePath} alt="" fill sizes={compact ? "56px" : "78px"} /></span>
      <strong>{definition.name}</strong>
    </span>
  );
}

export function LobbyBeigoSunCards({ onExit, onReaction }: Props) {
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [state, setState] = useState<GameState>(() => createGameState(DEFAULT_PROFILE, "hub"));
  const [detailKind, setDetailKind] = useState<CardKind | null>(null);
  const [dragPreview, setDragPreview] = useState<HandDrag | null>(null);
  const [hoverLane, setHoverLane] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const handDragRef = useRef<HandDrag | null>(null);
  const suppressCardClickUntilRef = useRef(0);
  const stateRef = useRef(state);
  const timersRef = useRef<number[]>([]);
  const rewardedRef = useRef(false);

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

  const updateProfile = useCallback((updater: (current: PlayerProfile) => PlayerProfile) => {
    setProfile((current) => {
      const next = updater(current);
      saveProfile(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    commit(createGameState(loaded, "hub"));
    onReaction("ready");
    return clearTimers;
  }, [clearTimers, commit, onReaction]);

  const inspectCard = useCallback((kind: CardKind) => {
    setDetailKind(kind);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailKind(null);
  }, []);

  const openPage = useCallback((phase: "hub" | "deck" | "shop") => {
    clearTimers();
    closeDetail();
    commit(createGameState(profile, phase));
  }, [clearTimers, closeDetail, commit, profile]);

  const beginBattle = useCallback(() => {
    if (profile.activeDeck.length !== DECK_SIZE) return;
    clearTimers();
    closeDetail();
    rewardedRef.current = false;
    commit(createGameState(profile));
    onReaction("ready");
  }, [clearTimers, closeDetail, commit, onReaction, profile]);

  const buyCard = useCallback((kind: CardKind) => {
    if (stateRef.current.phase !== "shop") return;
    updateProfile((current) => {
      const definition = CARD_DEFINITIONS[kind];
      const copies = current.ownedCards.filter((owned) => owned === kind).length;
      if (copies >= 2 || current.sunCoins < definition.shopPrice) return current;
      return { ...current, sunCoins: current.sunCoins - definition.shopPrice, ownedCards: [...current.ownedCards, kind] };
    });
  }, [updateProfile]);

  const removeDeckCard = useCallback((index: number) => {
    updateProfile((current) => ({ ...current, activeDeck: current.activeDeck.filter((_, cardIndex) => cardIndex !== index) }));
  }, [updateProfile]);

  const addDeckCard = useCallback((kind: CardKind) => {
    updateProfile((current) => {
      if (current.activeDeck.length >= DECK_SIZE) return current;
      const ownedCount = current.ownedCards.filter((owned) => owned === kind).length;
      const deckCount = current.activeDeck.filter((owned) => owned === kind).length;
      if (deckCount >= ownedCount) return current;
      return { ...current, activeDeck: [...current.activeDeck, kind] };
    });
  }, [updateProfile]);

  const awardMatch = useCallback((winner: Winner) => {
    if (rewardedRef.current) return;
    rewardedRef.current = true;
    updateProfile((current) => ({
      ...current,
      sunCoins: current.sunCoins + rewardFor(winner),
      matches: current.matches + 1,
      beigoLevel: Math.min(5, current.beigoLevel + 1),
    }));
  }, [updateProfile]);

  const placeCard = useCallback((cardId: string, laneIndex: number) => {
    const current = stateRef.current;
    const placedCount = current.playerLanes.filter(Boolean).length;
    if (current.phase !== "planning" || placedCount >= CARDS_PER_ROUND || current.playerLanes[laneIndex]) return;
    const card = current.player.hand.find((item) => item.id === cardId);
    if (!card) return;
    const playerLanes = current.playerLanes.map((laneCard, index) => index === laneIndex ? card : laneCard);
    const nextCount = playerLanes.filter(Boolean).length;
    commit({
      ...current,
      player: { ...current.player, hand: current.player.hand.filter((item) => item.id !== card.id) },
      playerLanes,
      selectedCardId: null,
      message: nextCount === CARDS_PER_ROUND ? "兩張已放好，按「一起撞！」" : "再拖第 2 張上去",
    });
  }, [commit]);

  const findDropLane = useCallback((x: number, y: number) => {
    for (let laneIndex = 0; laneIndex < LANE_LABELS.length; laneIndex += 1) {
      const lane = rootRef.current?.querySelector<HTMLElement>(`[data-sun-drop-lane="${laneIndex}"]`);
      if (!lane) continue;
      const rect = lane.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return laneIndex;
    }
    return null;
  }, []);

  const beginHandDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>, card: CardInstance) => {
    const current = stateRef.current;
    if (current.phase !== "planning" || current.playerLanes.filter(Boolean).length >= CARDS_PER_ROUND) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const drag: HandDrag = {
      pointerId: event.pointerId,
      cardId: card.id,
      kind: card.kind,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      tilt: 0,
      active: false,
    };
    handDragRef.current = drag;
    setHoverLane(null);
    setDragPreview(drag);
  }, []);

  const moveHandDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = handDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const active = drag.active || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7;
    const tilt = active ? Math.max(-8, Math.min(8, (event.clientX - drag.x) * 0.72)) : 0;
    const next = { ...drag, x: event.clientX, y: event.clientY, tilt, active };
    handDragRef.current = next;
    setDragPreview(next);
    setHoverLane(active ? findDropLane(event.clientX, event.clientY) : null);
    if (active) event.preventDefault();
  }, [findDropLane]);

  const endHandDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = handDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.active) {
      suppressCardClickUntilRef.current = Date.now() + 350;
      const laneIndex = findDropLane(event.clientX, event.clientY);
      if (laneIndex !== null) placeCard(drag.cardId, laneIndex);
    }
    handDragRef.current = null;
    setDragPreview(null);
    setHoverLane(null);
  }, [findDropLane, placeCard]);

  const cancelHandDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = handDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    handDragRef.current = null;
    setDragPreview(null);
    setHoverLane(null);
  }, []);

  const returnCard = useCallback((laneIndex: number) => {
    const current = stateRef.current;
    if (current.phase !== "planning") return;
    const card = current.playerLanes[laneIndex];
    if (!card) return;
    commit({
      ...current,
      player: { ...current.player, hand: [...current.player.hand, card] },
      playerLanes: current.playerLanes.map((laneCard, index) => index === laneIndex ? null : laneCard),
      selectedCardId: null,
      message: "已收回，重新選 2 張",
    });
  }, [commit]);

  const startBattle = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "planning" || current.playerLanes.filter(Boolean).length !== CARDS_PER_ROUND) return;
    const beigoLanes = chooseBeigoPlan(current.beigo, current.beigoLevel);
    const beigoCardIds = new Set(beigoLanes.filter((card): card is CardInstance => Boolean(card)).map((card) => card.id));
    const outcomes = resolveLanes(current.playerLanes, beigoLanes);
    const playerDamage = outcomes.reduce((total, outcome) => total + (outcome.winner === "beigo" ? outcome.damage : 0), 0);
    const beigoDamage = outcomes.reduce((total, outcome) => total + (outcome.winner === "player" ? outcome.damage : 0), 0);
    const playerHp = Math.max(0, current.playerHp - playerDamage);
    const beigoHp = Math.max(0, current.beigoHp - beigoDamage);
    const matchEnded = playerHp <= 0 || beigoHp <= 0 || current.round >= MAX_ROUNDS;
    const winner: Winner | null = matchEnded ? playerHp === beigoHp ? "draw" : playerHp > beigoHp ? "player" : "beigo" : null;
    commit({
      ...current,
      phase: "battle",
      beigo: { ...current.beigo, hand: current.beigo.hand.filter((card) => !beigoCardIds.has(card.id)) },
      playerHp,
      beigoHp,
      beigoLanes,
      selectedCardId: null,
      outcomes,
      winner,
      message: playerDamage === 0 && beigoDamage === 0 ? "三路碰撞，全都擋下！" : `你撞 ${beigoDamage} · 小貝撞 ${playerDamage}`,
    });
    onReaction("play");
    schedule(() => {
      if (winner) onReaction(winner === "player" ? "playerWin" : winner === "beigo" ? "beigoWin" : "draw");
      else if (beigoDamage > playerDamage) onReaction("playerClaim");
      else if (playerDamage > beigoDamage) onReaction("beigoClaim");
      else onReaction("draw");
    }, 760);
    if (winner) {
      awardMatch(winner);
      schedule(() => {
        const latest = stateRef.current;
        commit({ ...latest, phase: "complete" });
      }, 1250);
    }
  }, [awardMatch, commit, onReaction, schedule]);

  const nextRound = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "battle" || current.winner) return;
    const playerDiscard = [...current.player.discard, ...current.playerLanes.filter((card): card is CardInstance => Boolean(card))];
    const beigoDiscard = [...current.beigo.discard, ...current.beigoLanes.filter((card): card is CardInstance => Boolean(card))];
    commit({
      ...current,
      phase: "planning",
      round: current.round + 1,
      player: drawCards({ ...current.player, discard: playerDiscard }, CARDS_PER_ROUND),
      beigo: drawCards({ ...current.beigo, discard: beigoDiscard }, CARDS_PER_ROUND),
      playerLanes: [null, null, null],
      beigoLanes: [null, null, null],
      selectedCardId: null,
      outcomes: null,
      message: "按住手札，拖 2 張到三路",
    });
    onReaction("ready");
  }, [commit, onReaction]);

  const placedCount = state.playerLanes.filter(Boolean).length;
  const shopOffers = getShopOffers(profile.matches);
  const groupedOwned = (Object.keys(CARD_DEFINITIONS) as CardKind[])
    .map((kind) => ({
      kind,
      owned: profile.ownedCards.filter((card) => card === kind).length,
      used: profile.activeDeck.filter((card) => card === kind).length,
    }))
    .filter((item) => item.owned > 0);

  return (
    <section ref={rootRef} className={styles.root} aria-label="小日札三路撞札遊戲">
      <div className={styles.hud}>
        <strong>小日札</strong>
        {state.phase === "planning" || state.phase === "battle" || state.phase === "complete"
          ? <span className={styles.health}>你 {state.playerHp}<i>♥</i>{state.beigoHp} 小貝</span>
          : <span className={styles.health}>牌組 {profile.activeDeck.length}/{DECK_SIZE}</span>}
        <span className={styles.coins}>{state.phase === "planning" || state.phase === "battle" || state.phase === "complete" ? `${placedCount}/${CARDS_PER_ROUND}` : `☀${profile.sunCoins}`}</span>
        <button type="button" onClick={onExit} aria-label="結束小日札">×</button>
      </div>

      {state.phase === "hub" ? (
        <div className={`${styles.deckSetup} ${styles.flowPanel}`}>
          <div className={styles.flowHero}>
            <span>{profile.matches === 0 ? "新手教學戰" : `下一戰 · 小貝 Lv.${profile.beigoLevel}`}</span>
            <strong>{profile.matches === 0 ? "六隻直太郎，準備出發" : "出戰準備"}</strong>
            <div><b>牌組 {profile.activeDeck.length}/{DECK_SIZE}</b><b>{profile.matches === 0 ? "小貝 5 ♥" : `小貝 Lv.${profile.beigoLevel}`}</b></div>
          </div>
          <div className={styles.hubActions}>
            <button type="button" onClick={() => openPage("deck")}><span>▦</span><b>牌組</b><small>{profile.activeDeck.length}/{DECK_SIZE} 張</small></button>
            <button type="button" disabled={profile.matches === 0} onClick={() => openPage("shop")}><span>☀</span><b>商店</b><small>{profile.matches === 0 ? "首戰後開啟" : `持有 ${profile.sunCoins}`}</small></button>
          </div>
          <div className={styles.deckPreviewHeader}><strong>出戰牌組</strong><button type="button" onClick={() => openPage("deck")}>編輯 ›</button></div>
          <div className={styles.activeDeckPreview} aria-label="出戰牌組預覽">
            {profile.activeDeck.map((kind, index) => <button key={`${kind}-${index}`} type="button" className={styles.previewCardButton} onClick={() => inspectCard(kind)} aria-label={`查看${CARD_DEFINITIONS[kind].name}`}><CardFace card={{ id: `preview-${index}`, kind }} owner="player" compact /></button>)}
          </div>
          <button type="button" className={styles.primaryFlowButton} disabled={profile.activeDeck.length !== DECK_SIZE} onClick={beginBattle}>{profile.matches === 0 ? "開始教學戰" : "開始對戰"}</button>
        </div>
      ) : null}

      {state.phase === "deck" ? (
        <div className={`${styles.deckSetup} ${styles.subPage}`}>
          <div className={styles.subPageHeader}><button type="button" onClick={() => openPage("hub")}>‹</button><span><strong>選 6 張出戰</strong><small>先點上方移除，再從收藏加入</small></span><b>{profile.activeDeck.length}/{DECK_SIZE}</b></div>
          <div className={styles.deckSlots}>
            {Array.from({ length: DECK_SIZE }, (_, index) => {
              const kind = profile.activeDeck[index];
              return kind ? <div key={`${kind}-${index}`} className={styles.deckSlotCard}><button type="button" onClick={() => inspectCard(kind)} aria-label={`查看${CARD_DEFINITIONS[kind].name}`}><CardFace card={{ id: `deck-${index}`, kind }} owner="player" compact /></button><button type="button" onClick={() => removeDeckCard(index)} aria-label={`移除${CARD_DEFINITIONS[kind].name}`}>−</button></div> : <span key={index}>＋</span>;
            })}
          </div>
          <div className={styles.libraryHeading}><strong>你的收藏</strong><span>點一下加入</span></div>
          <div className={styles.ownedLibrary}>
            {groupedOwned.map(({ kind, owned, used }) => (
              <div key={kind} className={styles.libraryCard}>
                <button type="button" onClick={() => inspectCard(kind)} aria-label={`查看${CARD_DEFINITIONS[kind].name}`}><CardFace card={{ id: `library-${kind}`, kind }} owner="player" compact /></button>
                <span>{used}/{owned}</span><button type="button" disabled={profile.activeDeck.length >= DECK_SIZE || used >= owned} onClick={() => addDeckCard(kind)} aria-label={`加入${CARD_DEFINITIONS[kind].name}`}>＋</button>
              </div>
            ))}
          </div>
          <button type="button" className={styles.primaryFlowButton} disabled={profile.activeDeck.length !== DECK_SIZE} onClick={() => openPage("hub")}>完成牌組</button>
        </div>
      ) : null}

      {state.phase === "shop" ? (
        <div className={`${styles.deckSetup} ${styles.subPage}`}>
          <div className={styles.subPageHeader}><button type="button" onClick={() => openPage("hub")}>‹</button><span><strong>小日獸商店</strong><small>購買後永久加入收藏</small></span><b>☀{profile.sunCoins}</b></div>
          <div className={styles.shopIntro}>本次出現 3 張札，對戰後換貨</div>
          <div className={styles.shopOffers}>
            {shopOffers.map((kind) => {
              const definition = CARD_DEFINITIONS[kind];
              const copies = profile.ownedCards.filter((owned) => owned === kind).length;
              const soldOut = copies >= 2;
              return (
                <div key={kind} className={styles.shopOffer}>
                  <button type="button" className={styles.shopCardInspect} onClick={() => inspectCard(kind)} aria-label={`查看${definition.name}`}><CardFace card={{ id: `shop-${kind}`, kind }} owner="player" compact /></button>
                  <strong>{definition.ability}</strong>
                  <button type="button" disabled={soldOut || profile.sunCoins < definition.shopPrice} onClick={() => buyCard(kind)}>{soldOut ? "已有 2 張" : `☀ ${definition.shopPrice} 購買`}</button>
                </div>
              );
            })}
          </div>
          <div className={styles.shopTip}><b>勝 +5</b><b>平 +3</b><b>敗 +2</b></div>
          <button type="button" className={styles.primaryFlowButton} onClick={() => openPage("deck")}>前往組牌</button>
        </div>
      ) : null}

      {state.phase === "planning" || state.phase === "battle" || state.phase === "complete" ? (
        <>
          <div className={styles.prompt} role="status" aria-live="polite">{state.message}</div>
          <div className={styles.rounds} aria-label={`第 ${state.round} 回合，共 ${MAX_ROUNDS} 回合`}>
            {Array.from({ length: MAX_ROUNDS }, (_, index) => <i key={index} className={index + 1 <= state.round ? styles.roundActive : ""} />)}
            <strong>第 {state.round} 回合 · 小貝 Lv.{state.beigoLevel}</strong>
          </div>
          <div className={`${styles.laneBoard} ${state.phase === "battle" ? styles.laneBoardBattle : ""}`}>
            {LANE_LABELS.map((label, laneIndex) => {
              const playerCard = state.playerLanes[laneIndex];
              const beigoCard = state.beigoLanes[laneIndex];
              const outcome = state.outcomes?.[laneIndex];
              const outcomeLabel = outcome?.dodged ? "閃過！" : outcome?.koalaReduced && outcome.damage === 0 ? "抱住！" : outcome?.gateReduced && outcome.damage === 0 ? "守住！" : outcome?.winner === "tie" ? "碰！" : outcome?.winner === "player" ? `你撞 ${outcome.damage}` : outcome?.winner === "beigo" ? `小貝撞 ${outcome.damage}` : "";
              return (
                <div key={label} className={styles.lane}>
                  <strong className={styles.laneLabel}>{label}</strong>
                  <div className={`${styles.cardSlot} ${styles.beigoSlot}`}>
                    {state.phase === "planning" ? <span className={styles.cardBack} aria-label="小貝的蓋牌">?</span> : beigoCard ? <span className={`${styles.battleCard} ${styles.battleCardBeigo}`}><CardFace card={beigoCard} owner="beigo" power={getCardPower(beigoCard, laneIndex, state.beigoLanes)} /></span> : <span className={styles.emptySlot}>空</span>}
                  </div>
                  <div className={styles.clashZone} aria-live="polite">
                    {state.phase === "battle" || state.phase === "complete" ? <span className={styles.clashSpark}>✦</span> : <span>VS</span>}
                    {outcomeLabel ? <b className={outcome?.winner === "beigo" ? styles.outcomeBeigo : ""}>{outcomeLabel}</b> : null}
                  </div>
                  <button type="button" data-sun-drop-lane={laneIndex} className={`${styles.cardSlot} ${styles.playerSlot} ${dragPreview?.active && !playerCard && placedCount < CARDS_PER_ROUND ? styles.slotReady : ""} ${hoverLane === laneIndex && !playerCard ? styles.slotHover : ""}`} disabled={state.phase !== "planning" || !playerCard} onClick={() => playerCard ? returnCard(laneIndex) : undefined} aria-label={playerCard ? `收回${CARD_DEFINITIONS[playerCard.kind].name}` : `拖曳手札到${label}`}>
                    {playerCard ? <span className={`${styles.battleCard} ${state.phase === "battle" ? styles.battleCardPlayer : ""}`}><CardFace card={playerCard} owner="player" power={getCardPower(playerCard, laneIndex, state.playerLanes)} /></span> : <span className={styles.addSlot}>{dragPreview?.active && placedCount < CARDS_PER_ROUND ? "+" : "—"}</span>}
                  </button>
                </div>
              );
            })}
          </div>
          {state.phase === "planning" ? <div className={styles.abilityBar}><span>{dragPreview?.active ? "↑" : placedCount === CARDS_PER_ROUND ? "✓" : "↥"}</span><strong>{dragPreview?.active ? "拖到發亮的空卡槽後放開" : placedCount === CARDS_PER_ROUND ? "兩張已就位，可以一起撞！" : `按住卡片往上拖 · 還要 ${CARDS_PER_ROUND - placedCount} 張`}</strong></div> : null}
          <div className={styles.handPanel}>
            <div className={styles.handTitle}>
              <strong>{state.phase === "planning" ? `拖 2 張上場 · 已放 ${placedCount}/2` : `牌庫 ${state.player.deck.length} · 棄札 ${state.player.discard.length}`}</strong>
              {state.phase === "planning" ? <button type="button" className={styles.battleButton} disabled={placedCount !== CARDS_PER_ROUND} onClick={startBattle}>一起撞！</button> : !state.winner ? <button type="button" className={styles.battleButton} onClick={nextRound}>下一回合</button> : null}
            </div>
            <div className={styles.handCards}>
              {state.player.hand.map((card) => <button key={card.id} type="button" className={dragPreview?.active && dragPreview.cardId === card.id ? styles.handCardDragging : ""} disabled={state.phase !== "planning" || placedCount >= CARDS_PER_ROUND} onClick={() => { if (Date.now() >= suppressCardClickUntilRef.current) inspectCard(card.kind); }} onPointerDown={(event) => beginHandDrag(event, card)} onPointerMove={moveHandDrag} onPointerUp={endHandDrag} onPointerCancel={cancelHandDrag} aria-label={`拖曳${CARD_DEFINITIONS[card.kind].name}到一路，輕點查看`}><CardFace card={card} owner="player" compact /></button>)}
            </div>
          </div>
        </>
      ) : null}

      {state.phase === "complete" && state.winner ? (
        <div className={styles.result} role="dialog" aria-label="小日札對戰結果">
          <span aria-hidden="true">{state.winner === "player" ? "☀" : state.winner === "beigo" ? "🐾" : "✦"}</span>
          <strong>{state.winner === "player" ? "你撞贏了！" : state.winner === "beigo" ? "小貝守住了！" : "撞成平手！"}</strong>
          <b>獲得 ☀ {rewardFor(state.winner)} · 商店換貨</b>
          <div><button type="button" onClick={beginBattle}>再戰一次</button><button type="button" onClick={() => openPage("hub")}>回到準備</button></div>
        </div>
      ) : null}

      {detailKind ? (
        <div className={styles.cardDetailBackdrop} role="presentation" onClick={closeDetail}>
          <div className={styles.cardDetail} role="dialog" aria-modal="true" aria-label={`${CARD_DEFINITIONS[detailKind].name}卡片說明`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.cardDetailClose} onClick={closeDetail} aria-label="關閉卡片說明">×</button>
            <div className={styles.cardDetailCard}><CardFace card={{ id: `detail-${detailKind}`, kind: detailKind }} owner="player" /></div>
            <span>基本力量 {CARD_DEFINITIONS[detailKind].power}</span>
            <strong>{CARD_DEFINITIONS[detailKind].name}</strong>
            <p>{CARD_DEFINITIONS[detailKind].ability}</p>
            <small>{SUNBEAST_REGISTRY[CARD_DEFINITIONS[detailKind].beastId].name}的小日札</small>
          </div>
        </div>
      ) : null}

      {dragPreview?.active && typeof document !== "undefined" ? createPortal(
        <div className={styles.dragGhost} style={{ left: dragPreview.x, top: dragPreview.y, "--drag-tilt": `${dragPreview.tilt}deg` } as CSSProperties} aria-hidden="true"><CardFace card={{ id: dragPreview.cardId, kind: dragPreview.kind }} owner="player" compact /></div>,
        document.body,
      ) : null}
    </section>
  );
}

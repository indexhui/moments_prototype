"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Matter from "matter-js";
import styles from "./LobbyBeigoPlayground.module.css";
import { LobbyBeigoCardDuel, type CardDuelReaction } from "./LobbyBeigoCardDuel";
import { LobbyBeigoFormationDuel } from "./LobbyBeigoFormationDuel";
import { LobbyBeigoSunCards } from "./LobbyBeigoSunCards";

const DOG_SIZE = 148;
const EDGE_PADDING = 9;
const SPRITE_SHEET = "/images/lobby/beigo_interactions.png";
const WIN_SCORE = 3;
const FIXED_STEP = 1000 / 60;
const BALL_SIZE = 46;

type Position = { x: number; y: number };
type Mood = "idle" | "walk" | "dragging" | "happy" | "sleepy" | "squish";
type Activity = "none" | "menu" | "cards" | "formation" | "sunCards" | "game" | "fetch";
type Winner = "player" | "beigo";
type FetchPhase = "serve" | "held" | "outbound" | "dogHold" | "return" | "reset" | "complete";

type LobbyDrag = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  lastX: number;
  moved: boolean;
  longPressed: boolean;
};

type PointerSample = Position & { time: number };

type StarWorld = {
  engine: Matter.Engine;
  star: Matter.Body;
  player: Matter.Body;
  dog: Matter.Body;
  playerConstraint: Matter.Constraint;
  playerTarget: Position;
  pointerId: number | null;
  frameId: number;
  lastTimestamp: number;
  accumulator: number;
  resolved: boolean;
  finished: boolean;
  timer: number | null;
  lastDogLunge: number;
  dogAttackAt: number;
};

type FetchWorld = {
  engine: Matter.Engine;
  ball: Matter.Body;
  dog: Matter.Body;
  frameId: number;
  lastTimestamp: number;
  accumulator: number;
  pointerId: number | null;
  samples: PointerSample[];
  dragConstraint: Matter.Constraint | null;
  holdConstraint: Matter.Constraint | null;
  mouthConstraint: Matter.Constraint | null;
  timer: number | null;
  resolved: boolean;
  finished: boolean;
};

const SPRITES: Record<Mood, { col: number; row: number }> = {
  idle: { col: 0, row: 0 },
  walk: { col: 3, row: 3 },
  dragging: { col: 4, row: 2 },
  happy: { col: 3, row: 2 },
  sleepy: { col: 1, row: 1 },
  squish: { col: 2, row: 3 },
};

const BUBBLES = {
  pet: ["嘿嘿～", "再摸一下", "喜歡！"],
  drop: ["噗唷！", "軟呼呼～", "再一次！"],
  idle: ["今天也一起玩？", "小貝在這裡", "……要摸摸嗎？"],
} as const;

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createBallisticVelocity(start: Position, target: Position, duration: number, gravityScale = 0.00108) {
  const steps = duration / FIXED_STEP;
  const gravityPerStep = gravityScale * FIXED_STEP ** 2;
  return {
    x: (target.x - start.x) / steps,
    y: (target.y - start.y - 0.5 * gravityPerStep * steps ** 2) / steps,
  };
}

function hasPair(pair: Matter.Pair, first: string, second: string) {
  const a = pair.bodyA.label;
  const b = pair.bodyB.label;
  return (a === first && b === second) || (a === second && b === first);
}

function removeConstraint(engine: Matter.Engine, constraint: Matter.Constraint | null) {
  if (constraint) Matter.Composite.remove(engine.world, constraint);
}

export function LobbyBeigoPlayground() {
  const playgroundRef = useRef<HTMLDivElement>(null);
  const dogRef = useRef<HTMLButtonElement>(null);
  const starRef = useRef<HTMLSpanElement>(null);
  const playerPaddleRef = useRef<HTMLButtonElement>(null);
  const fetchBallRef = useRef<HTMLButtonElement>(null);
  const fetchGuideRef = useRef<HTMLSpanElement>(null);

  const positionRef = useRef<Position>({ x: 33, y: 70 });
  const dragRef = useRef<LobbyDrag | null>(null);
  const activityRef = useRef<Activity>("none");
  const busyUntilRef = useRef(0);
  const reactionTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const activityTimerRef = useRef<number | null>(null);
  const starWorldRef = useRef<StarWorld | null>(null);
  const fetchWorldRef = useRef<FetchWorld | null>(null);
  const playerScoreRef = useRef(0);
  const beigoScoreRef = useRef(0);
  const fetchPlayerScoreRef = useRef(0);
  const fetchBeigoScoreRef = useRef(0);
  const fetchPhaseRef = useRef<FetchPhase>("serve");
  const facingRef = useRef<1 | -1>(1);

  const [position, setPositionState] = useState<Position>(positionRef.current);
  const [mood, setMood] = useState<Mood>("idle");
  const [facing, setFacingState] = useState<1 | -1>(1);
  const [moveDuration, setMoveDuration] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [heartBurst, setHeartBurst] = useState(0);
  const [activity, setActivityState] = useState<Activity>("none");

  const [playerScore, setPlayerScore] = useState(0);
  const [beigoScore, setBeigoScore] = useState(0);
  const [gameWinner, setGameWinner] = useState<Winner | null>(null);
  const [gameMessage, setGameMessage] = useState("守住下方，把星星往上撞進小貝的球門！");
  const [gameHitBurst, setGameHitBurst] = useState(0);
  const [gameSessionKey, setGameSessionKey] = useState(0);
  const [paddleDragging, setPaddleDragging] = useState(false);

  const [fetchPlayerScore, setFetchPlayerScore] = useState(0);
  const [fetchBeigoScore, setFetchBeigoScore] = useState(0);
  const [fetchWinner, setFetchWinner] = useState<Winner | null>(null);
  const [fetchPhase, setFetchPhaseState] = useState<FetchPhase>("serve");
  const [fetchMessage, setFetchMessage] = useState("抓住球，往小貝方向甩出去！");
  const [fetchSessionKey, setFetchSessionKey] = useState(0);
  const [fetchCatchBurst, setFetchCatchBurst] = useState(0);

  const setPosition = useCallback((next: Position) => {
    positionRef.current = next;
    setPositionState(next);
  }, []);

  const setFacing = useCallback((next: 1 | -1) => {
    if (facingRef.current === next) return;
    facingRef.current = next;
    setFacingState(next);
  }, []);

  const setActivity = useCallback((next: Activity) => {
    activityRef.current = next;
    setActivityState(next);
  }, []);

  const setFetchPhase = useCallback((next: FetchPhase) => {
    fetchPhaseRef.current = next;
    setFetchPhaseState(next);
  }, []);

  const handleCardReaction = useCallback((reaction: CardDuelReaction) => {
    const reactions: Record<CardDuelReaction, { mood: Mood; bubble: string }> = {
      ready: { mood: "happy", bubble: "五局對決！" },
      thinking: { mood: "idle", bubble: "……" },
      play: { mood: "squish", bubble: "這張！" },
      playerClaim: { mood: "squish", bubble: "被你搶到了！" },
      beigoClaim: { mood: "happy", bubble: "這張歸我！" },
      playerWin: { mood: "squish", bubble: "你贏了……" },
      beigoWin: { mood: "happy", bubble: "小貝贏了！" },
      draw: { mood: "happy", bubble: "再來一次！" },
    };
    const next = reactions[reaction];
    setMood(next.mood);
    setBubble(next.bubble);
    setFacing(-1);
    if (reaction === "playerWin" || reaction === "beigoWin") {
      setHeartBurst((value) => value + 1);
    }
  }, [setFacing]);

  const handleFormationReaction = useCallback((reaction: CardDuelReaction) => {
    const reactions: Record<CardDuelReaction, { mood: Mood; bubble: string }> = {
      ready: { mood: "happy", bubble: "翻牌！" },
      thinking: { mood: "idle", bubble: "我記得……" },
      play: { mood: "squish", bubble: "是哪一隻？" },
      playerClaim: { mood: "squish", bubble: "被你配到了！" },
      beigoClaim: { mood: "happy", bubble: "小貝記得！" },
      playerWin: { mood: "squish", bubble: "你記得好多……" },
      beigoWin: { mood: "happy", bubble: "小貝收得比較多！" },
      draw: { mood: "happy", bubble: "平手，再來！" },
    };
    const next = reactions[reaction];
    setMood(next.mood);
    setBubble(next.bubble);
    setFacing(-1);
    if (reaction === "playerWin" || reaction === "beigoWin") {
      setHeartBurst((value) => value + 1);
    }
  }, [setFacing]);

  const handleSunCardsReaction = useCallback((reaction: CardDuelReaction) => {
    const reactions: Record<CardDuelReaction, { mood: Mood; bubble: string }> = {
      ready: { mood: "happy", bubble: "來布置三路！" },
      thinking: { mood: "idle", bubble: "小貝也在配牌……" },
      play: { mood: "squish", bubble: "撞札！" },
      playerClaim: { mood: "squish", bubble: "被你撞開了！" },
      beigoClaim: { mood: "happy", bubble: "小貝撞進去！" },
      playerWin: { mood: "squish", bubble: "我的日光沒了……" },
      beigoWin: { mood: "happy", bubble: "小貝守住了！" },
      draw: { mood: "happy", bubble: "一起撞飛了！" },
    };
    const next = reactions[reaction];
    setMood(next.mood);
    setBubble(next.bubble);
    setFacing(-1);
    if (reaction === "playerWin" || reaction === "beigoWin") setHeartBurst((value) => value + 1);
  }, [setFacing]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const clearActivityTimer = useCallback(() => {
    if (activityTimerRef.current !== null) {
      window.clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
  }, []);

  const stopStarWorld = useCallback(() => {
    const world = starWorldRef.current;
    if (!world) return;
    world.finished = true;
    window.cancelAnimationFrame(world.frameId);
    if (world.timer !== null) window.clearTimeout(world.timer);
    Matter.Composite.clear(world.engine.world, false, true);
    Matter.Engine.clear(world.engine);
    starWorldRef.current = null;
  }, []);

  const stopFetchWorld = useCallback(() => {
    const world = fetchWorldRef.current;
    if (!world) return;
    world.finished = true;
    window.cancelAnimationFrame(world.frameId);
    if (world.timer !== null) window.clearTimeout(world.timer);
    Matter.Composite.clear(world.engine.world, false, true);
    Matter.Engine.clear(world.engine);
    fetchWorldRef.current = null;
  }, []);

  const finishReaction = useCallback((delay: number) => {
    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    busyUntilRef.current = Date.now() + delay;
    reactionTimerRef.current = window.setTimeout(() => {
      setMood("idle");
      setBubble(null);
      reactionTimerRef.current = null;
    }, delay);
  }, []);

  const closeActivity = useCallback(() => {
    clearActivityTimer();
    stopStarWorld();
    stopFetchWorld();
    setPositionState({ ...positionRef.current });
    setActivity("none");
    setGameWinner(null);
    setFetchWinner(null);
    setPaddleDragging(false);
    setMoveDuration(0);
    setMood("idle");
    setBubble(null);
    busyUntilRef.current = Date.now() + 650;
  }, [clearActivityTimer, setActivity, stopFetchWorld, stopStarWorld]);

  const petBeigo = useCallback(() => {
    if (activityRef.current === "menu") closeActivity();
    setShowHint(false);
    setMoveDuration(0);
    setMood("happy");
    setBubble(pick(BUBBLES.pet));
    setHeartBurst((value) => value + 1);
    finishReaction(1150);
  }, [closeActivity, finishReaction]);

  const openActionMenu = useCallback(() => {
    clearActivityTimer();
    if (reactionTimerRef.current !== null) {
      window.clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
    setShowHint(false);
    setActivity("menu");
    setMoveDuration(0);
    setMood("happy");
    setBubble("想玩哪個？");
    busyUntilRef.current = Date.now() + 1000;
  }, [clearActivityTimer, setActivity]);

  const startCardGame = useCallback(() => {
    clearActivityTimer();
    stopFetchWorld();
    stopStarWorld();
    setMood("happy");
    setBubble("來猜拳選牌！");
    setFacing(-1);
    setActivity("cards");
  }, [clearActivityTimer, setActivity, setFacing, stopFetchWorld, stopStarWorld]);

  const startFormationGame = useCallback(() => {
    clearActivityTimer();
    stopFetchWorld();
    stopStarWorld();
    setMood("happy");
    setBubble("來玩配配看！");
    setFacing(-1);
    setActivity("formation");
  }, [clearActivityTimer, setActivity, setFacing, stopFetchWorld, stopStarWorld]);

  const startSunCardsGame = useCallback(() => {
    clearActivityTimer();
    stopFetchWorld();
    stopStarWorld();
    setMood("happy");
    setBubble("來撞札！");
    setFacing(-1);
    setActivity("sunCards");
  }, [clearActivityTimer, setActivity, setFacing, stopFetchWorld, stopStarWorld]);

  const startPongGame = useCallback(() => {
    clearActivityTimer();
    stopFetchWorld();
    stopStarWorld();
    playerScoreRef.current = 0;
    beigoScoreRef.current = 0;
    setPlayerScore(0);
    setBeigoScore(0);
    setGameWinner(null);
    setGameMessage("拖動下方手掌，把星星往上打進小貝的球門！");
    setMood("walk");
    setBubble("這次我會認真喔！");
    setFacing(-1);
    setActivity("game");
    setGameSessionKey((value) => value + 1);
  }, [clearActivityTimer, setActivity, setFacing, stopFetchWorld, stopStarWorld]);

  const startFetchGame = useCallback(() => {
    clearActivityTimer();
    stopStarWorld();
    stopFetchWorld();
    fetchPlayerScoreRef.current = 0;
    fetchBeigoScoreRef.current = 0;
    setFetchPlayerScore(0);
    setFetchBeigoScore(0);
    setFetchWinner(null);
    setFetchPhase("serve");
    setFetchMessage("抓住球，往小貝方向甩出去！");
    setMood("happy");
    setBubble("真的要接住喔！");
    setFacing(-1);
    setActivity("fetch");
    setFetchSessionKey((value) => value + 1);
  }, [clearActivityTimer, setActivity, setFacing, setFetchPhase, stopFetchWorld, stopStarWorld]);

  useEffect(() => {
    if (activity !== "game") return;

    const playground = playgroundRef.current;
    if (!playground) return;
    const width = playground.clientWidth || 393;
    const height = playground.clientHeight || 364;
    const arenaTop = 108;
    const arenaBottom = height - 18;
    const centerX = width * 0.5;
    const centerY = (arenaTop + arenaBottom) * 0.5;
    const playerStartY = clamp(arenaBottom - 82, centerY + 42, arenaBottom - 42);
    const dogStartY = clamp(arenaTop + 88, arenaTop + 42, centerY - 42);
    const goalWidth = Math.max(180, width - 88);

    const CAT_STAR = 0x0001;
    const CAT_PADDLE = 0x0002;
    const CAT_ARENA = 0x0004;
    const CAT_DIVIDER = 0x0008;
    const engine = Matter.Engine.create({ enableSleeping: false });
    engine.gravity.scale = 0;

    const star = Matter.Bodies.circle(centerX, centerY, 22, {
      label: "star",
      restitution: 0.96,
      friction: 0.01,
      frictionAir: 0.0015,
      density: 0.0022,
      collisionFilter: { category: CAT_STAR, mask: CAT_PADDLE | CAT_ARENA },
    });
    const player = Matter.Bodies.circle(centerX, playerStartY, 28, {
      label: "playerPaddle",
      restitution: 0.82,
      friction: 0.02,
      frictionAir: 0.08,
      density: 0.008,
      collisionFilter: { category: CAT_PADDLE, mask: CAT_STAR | CAT_ARENA | CAT_DIVIDER | CAT_PADDLE },
    });
    const dog = Matter.Bodies.circle(centerX, dogStartY, 34, {
      label: "dogPaddle",
      restitution: 0.72,
      friction: 0.03,
      frictionAir: 0.07,
      density: 0.009,
      collisionFilter: { category: CAT_PADDLE, mask: CAT_STAR | CAT_ARENA | CAT_DIVIDER | CAT_PADDLE },
    });
    Matter.Body.setInertia(player, Infinity);
    Matter.Body.setInertia(dog, Infinity);

    const playerTarget = { x: centerX, y: playerStartY };
    const playerConstraint = Matter.Constraint.create({
      label: "playerHandConstraint",
      pointA: playerTarget,
      bodyB: player,
      length: 0,
      stiffness: 0.5,
      damping: 0.18,
    });
    const arenaOptions = {
      isStatic: true,
      restitution: 0.9,
      collisionFilter: { category: CAT_ARENA, mask: CAT_STAR | CAT_PADDLE },
    };
    const walls = [
      Matter.Bodies.rectangle(centerX, arenaTop - 8, width + 40, 18, { ...arenaOptions, label: "wall" }),
      Matter.Bodies.rectangle(centerX, arenaBottom + 8, width + 40, 18, { ...arenaOptions, label: "wall" }),
      Matter.Bodies.rectangle(-8, (arenaTop + arenaBottom) * 0.5, 18, arenaBottom - arenaTop + 30, { ...arenaOptions, label: "wall" }),
      Matter.Bodies.rectangle(width + 8, (arenaTop + arenaBottom) * 0.5, 18, arenaBottom - arenaTop + 30, { ...arenaOptions, label: "wall" }),
    ];
    const divider = Matter.Bodies.rectangle(centerX, centerY, width, 8, {
      isStatic: true,
      label: "paddleDivider",
      collisionFilter: { category: CAT_DIVIDER, mask: CAT_PADDLE },
    });
    const bumperA = Matter.Bodies.circle(centerX - 112, centerY - 42, 13, { ...arenaOptions, label: "bumper" });
    const bumperB = Matter.Bodies.circle(centerX + 112, centerY + 42, 15, { ...arenaOptions, label: "bumper" });
    const topGoal = Matter.Bodies.rectangle(centerX, arenaTop + 18, goalWidth, 28, {
      isStatic: true,
      isSensor: true,
      label: "topGoal",
      collisionFilter: { category: CAT_ARENA, mask: CAT_STAR },
    });
    const bottomGoal = Matter.Bodies.rectangle(centerX, arenaBottom - 18, goalWidth, 28, {
      isStatic: true,
      isSensor: true,
      label: "bottomGoal",
      collisionFilter: { category: CAT_ARENA, mask: CAT_STAR },
    });
    Matter.Composite.add(engine.world, [
      star,
      player,
      dog,
      playerConstraint,
      ...walls,
      divider,
      bumperA,
      bumperB,
      topGoal,
      bottomGoal,
    ]);

    const world: StarWorld = {
      engine,
      star,
      player,
      dog,
      playerConstraint,
      playerTarget,
      pointerId: null,
      frameId: 0,
      lastTimestamp: performance.now(),
      accumulator: 0,
      resolved: false,
      finished: false,
      timer: null,
      lastDogLunge: performance.now() - 900,
      dogAttackAt: performance.now() + 1800,
    };
    starWorldRef.current = world;

    const renderBodies = () => {
      if (starRef.current) {
        starRef.current.style.transform = `translate3d(${star.position.x - 27}px, ${star.position.y - 27}px, 0) rotate(${star.angle}rad)`;
      }
      if (playerPaddleRef.current) {
        playerPaddleRef.current.style.transform = `translate3d(${player.position.x - 31}px, ${player.position.y - 31}px, 0)`;
      }
      if (dogRef.current) {
        const x = dog.position.x - DOG_SIZE * 0.5;
        const y = dog.position.y - 68;
        positionRef.current = { x, y };
        dogRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.94)`;
      }
      if (Math.abs(dog.velocity.x) > 0.3) setFacing(dog.velocity.x < 0 ? -1 : 1);
    };

    const resetRound = () => {
      Matter.Body.setPosition(star, { x: centerX, y: centerY - 17 + Math.random() * 34 });
      Matter.Body.setVelocity(star, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(star, 0);
      Matter.Body.setPosition(player, { x: centerX, y: playerStartY });
      Matter.Body.setVelocity(player, { x: 0, y: 0 });
      world.playerTarget.x = centerX;
      world.playerTarget.y = playerStartY;
      world.playerConstraint.pointA = world.playerTarget;
      Matter.Body.setPosition(dog, { x: centerX, y: dogStartY });
      Matter.Body.setVelocity(dog, { x: 0, y: 0 });
      world.lastDogLunge = performance.now() - 900;
      world.dogAttackAt = performance.now() + 1500;
      world.resolved = false;
      setMood("walk");
      setBubble(null);
      setGameMessage("守住下半場，抓準角度把星星往上撞！");
    };

    const finishGoal = (winner: Winner) => {
      if (world.resolved || world.finished) return;
      world.resolved = true;
      Matter.Body.setVelocity(star, { x: 0, y: 0 });
      const nextPlayer = playerScoreRef.current + (winner === "player" ? 1 : 0);
      const nextBeigo = beigoScoreRef.current + (winner === "beigo" ? 1 : 0);
      playerScoreRef.current = nextPlayer;
      beigoScoreRef.current = nextBeigo;
      setPlayerScore(nextPlayer);
      setBeigoScore(nextBeigo);
      setGameHitBurst((value) => value + 1);
      setMood(winner === "player" ? "squish" : "happy");
      setBubble(winner === "player" ? "居然被你撞進去了！" : "守門成功，換我得分！");
      setGameMessage(winner === "player" ? "漂亮！星星撞進上方球門，你得一分" : "小貝把星星打進下方球門了！");

      if (nextPlayer >= WIN_SCORE || nextBeigo >= WIN_SCORE) {
        world.finished = true;
        setGameWinner(winner);
        setHeartBurst((value) => value + 1);
        return;
      }
      world.timer = window.setTimeout(() => {
        if (starWorldRef.current !== world) return;
        world.timer = null;
        resetRound();
      }, 820);
    };

    Matter.Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        if (hasPair(pair, "star", "topGoal")) {
          finishGoal("player");
          return;
        }
        if (hasPair(pair, "star", "bottomGoal")) {
          finishGoal("beigo");
          return;
        }
        if (hasPair(pair, "star", "playerPaddle") || hasPair(pair, "star", "dogPaddle") || hasPair(pair, "star", "bumper")) {
          setGameHitBurst((value) => value + 1);
        }
      }
    });

    const stepWorld = () => {
      if (world.resolved || world.finished) return;
      const now = performance.now();
      const canDogAttack = now >= world.dogAttackAt;
      const starOnDogSide = star.position.y <= centerY + 58;
      const predictedStarX = star.position.x + star.velocity.x * 6;
      const defendX = clamp(predictedStarX, 42, width - 42);
      const defendY = canDogAttack && starOnDogSide
        ? clamp(star.position.y - 38, arenaTop + 52, centerY - 34)
        : dogStartY;
      const dx = defendX - dog.position.x;
      const dy = defendY - dog.position.y;
      Matter.Body.applyForce(dog, dog.position, {
        x: clamp(dx * 0.00024, -0.008, 0.008),
        y: clamp(dy * 0.00024, -0.008, 0.008),
      });
      const dogSpeed = Matter.Body.getSpeed(dog);
      if (dogSpeed > 7.2) Matter.Body.setSpeed(dog, 7.2);
      const lungeDistance = Math.hypot(star.position.x - dog.position.x, star.position.y - dog.position.y);
      if (canDogAttack && star.position.y <= centerY + 34 && lungeDistance < 122 && now - world.lastDogLunge > 900) {
        world.lastDogLunge = now;
        Matter.Body.setVelocity(dog, {
          x: clamp((predictedStarX - dog.position.x) * 0.14, -4.2, 4.2),
          y: 8,
        });
      }
      const playerSpeed = Matter.Body.getSpeed(player);
      if (playerSpeed > 11.5) Matter.Body.setSpeed(player, 11.5);
      Matter.Engine.update(engine, FIXED_STEP);
    };

    const tick = (timestamp: number) => {
      if (starWorldRef.current !== world) return;
      const elapsed = clamp(timestamp - world.lastTimestamp, 0, 50);
      world.lastTimestamp = timestamp;
      world.accumulator += elapsed;
      while (world.accumulator >= FIXED_STEP) {
        stepWorld();
        world.accumulator -= FIXED_STEP;
      }
      renderBodies();
      if (!world.finished) world.frameId = window.requestAnimationFrame(tick);
    };
    renderBodies();
    world.frameId = window.requestAnimationFrame(tick);

    return () => {
      if (starWorldRef.current === world) stopStarWorld();
    };
  }, [activity, gameSessionKey, setFacing, stopStarWorld]);

  useEffect(() => {
    if (activity !== "fetch") return;
    const playground = playgroundRef.current;
    if (!playground) return;
    const width = playground.clientWidth || 393;
    const height = playground.clientHeight || 364;
    const fieldTop = 102;
    const fieldCenterY = (fieldTop + height - 18) * 0.5;
    const engine = Matter.Engine.create({ enableSleeping: false });
    engine.gravity.x = 0;
    engine.gravity.y = 1;
    engine.gravity.scale = 0.00108;

    const ballOrigin = { x: 72, y: clamp(fieldCenterY + 92, 210, height - 82) };
    const dogOrigin = { x: width - 82, y: fieldCenterY };
    const ball = Matter.Bodies.circle(ballOrigin.x, ballOrigin.y, 17, {
      label: "fetchBall",
      restitution: 0.76,
      friction: 0.035,
      frictionAir: 0.004,
      density: 0.0024,
    });
    const dog = Matter.Bodies.circle(dogOrigin.x, dogOrigin.y, 36, {
      isStatic: true,
      label: "fetchDog",
      restitution: 0.18,
      friction: 0.04,
    });
    const ground = Matter.Bodies.rectangle(width * 0.5, height - 8, width + 60, 26, {
      isStatic: true,
      label: "fetchGround",
      restitution: 0.55,
      friction: 0.24,
    });
    const ceiling = Matter.Bodies.rectangle(width * 0.5, fieldTop, width + 40, 16, { isStatic: true, label: "fetchWall", restitution: 0.72 });
    const leftWall = Matter.Bodies.rectangle(-10, height * 0.5, 24, height + 40, { isStatic: true, label: "fetchWall", restitution: 0.72 });
    const rightWall = Matter.Bodies.rectangle(width + 10, height * 0.5, 24, height + 40, { isStatic: true, label: "fetchWall", restitution: 0.72 });
    const tableLeg = Matter.Bodies.circle(width * 0.5, height - 62, 15, {
      isStatic: true,
      label: "fetchBumper",
      restitution: 0.86,
      friction: 0.02,
    });
    const holdConstraint = Matter.Constraint.create({
      label: "playerHold",
      pointA: { ...ballOrigin },
      bodyB: ball,
      length: 0,
      stiffness: 0.72,
      damping: 0.18,
    });
    Matter.Composite.add(engine.world, [ball, dog, ground, ceiling, leftWall, rightWall, tableLeg, holdConstraint]);

    const world: FetchWorld = {
      engine,
      ball,
      dog,
      frameId: 0,
      lastTimestamp: performance.now(),
      accumulator: 0,
      pointerId: null,
      samples: [],
      dragConstraint: null,
      holdConstraint,
      mouthConstraint: null,
      timer: null,
      resolved: false,
      finished: false,
    };
    fetchWorldRef.current = world;

    const addHoldConstraint = (point: Position) => {
      removeConstraint(engine, world.dragConstraint);
      removeConstraint(engine, world.holdConstraint);
      world.dragConstraint = null;
      const next = Matter.Constraint.create({
        label: "playerHold",
        pointA: { ...point },
        bodyB: ball,
        length: 0,
        stiffness: 0.72,
        damping: 0.18,
      });
      Matter.Composite.add(engine.world, next);
      world.holdConstraint = next;
    };

    const resetBall = () => {
      removeConstraint(engine, world.dragConstraint);
      removeConstraint(engine, world.holdConstraint);
      removeConstraint(engine, world.mouthConstraint);
      world.dragConstraint = null;
      world.holdConstraint = null;
      world.mouthConstraint = null;
      world.pointerId = null;
      world.samples = [];
      Matter.Body.setPosition(ball, ballOrigin);
      Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ball, 0);
      addHoldConstraint(ballOrigin);
      world.resolved = false;
      setFetchPhase("serve");
      setFetchMessage("抓住實體球，往小貝方向甩出去！");
      setMood("idle");
      setBubble("換你發球！");
    };

    const awardDog = (message: string) => {
      if (world.resolved || world.finished) return;
      world.resolved = true;
      const next = fetchBeigoScoreRef.current + 1;
      fetchBeigoScoreRef.current = next;
      setFetchBeigoScore(next);
      setFetchPhase(next >= WIN_SCORE ? "complete" : "reset");
      setFetchMessage(message);
      setMood("happy");
      setBubble("這球是我的！");
      if (next >= WIN_SCORE) {
        world.finished = true;
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        setFetchWinner("beigo");
        return;
      }
      world.timer = window.setTimeout(() => {
        if (fetchWorldRef.current !== world) return;
        world.timer = null;
        resetBall();
      }, 760);
    };

    const dogCatch = () => {
      if (fetchPhaseRef.current !== "outbound" || world.resolved || world.finished) return;
      setFetchPhase("dogHold");
      setFetchMessage("小貝用身體真的接住了！");
      setMood("squish");
      setBubble("接到了！");
      Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      world.mouthConstraint = Matter.Constraint.create({
        label: "dogMouthHold",
        bodyA: dog,
        pointA: { x: -31, y: -4 },
        bodyB: ball,
        length: 0,
        stiffness: 0.9,
        damping: 0.16,
      });
      Matter.Composite.add(engine.world, world.mouthConstraint);
      world.timer = window.setTimeout(() => {
        if (fetchWorldRef.current !== world || fetchPhaseRef.current !== "dogHold") return;
        removeConstraint(engine, world.mouthConstraint);
        world.mouthConstraint = null;
        world.timer = null;
        const totalPoints = fetchPlayerScoreRef.current + fetchBeigoScoreRef.current;
        Matter.Body.setPosition(ball, { x: dog.position.x - 40, y: dog.position.y - 12 });
        Matter.Body.setVelocity(ball, {
          x: -7.1 - totalPoints * 0.48,
          y: -6.5 - totalPoints * 0.2,
        });
        Matter.Body.setAngularVelocity(ball, -0.18);
        world.resolved = false;
        setFetchPhase("return");
        setFetchMessage("回球來了——直接抓住飛行中的球！");
        setMood("happy");
        setBubble("接回去！");
      }, 430);
    };

    Matter.Events.on(engine, "collisionStart", (event) => {
      for (const pair of event.pairs) {
        if (hasPair(pair, "fetchBall", "fetchDog")) {
          dogCatch();
          continue;
        }
        if (hasPair(pair, "fetchBall", "fetchGround")) {
          if (fetchPhaseRef.current === "return") awardDog("你漏接了，小貝得一分！");
          if (fetchPhaseRef.current === "outbound") awardDog("球沒到小貝身邊，小貝得一分！");
        }
      }
    });

    const renderBodies = () => {
      if (fetchBallRef.current) {
        fetchBallRef.current.style.transform = `translate3d(${ball.position.x - BALL_SIZE * 0.5}px, ${ball.position.y - BALL_SIZE * 0.5}px, 0) rotate(${ball.angle}rad)`;
      }
      if (dogRef.current) {
        const x = dog.position.x - DOG_SIZE * 0.5;
        const y = dog.position.y - 68;
        positionRef.current = { x, y };
        dogRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0.94)`;
      }
      if (fetchGuideRef.current) {
        const showGuide = fetchPhaseRef.current === "serve" || fetchPhaseRef.current === "held";
        const dx = dog.position.x - ball.position.x;
        const dy = dog.position.y - ball.position.y;
        fetchGuideRef.current.style.opacity = showGuide ? "1" : "0";
        fetchGuideRef.current.style.width = `${Math.hypot(dx, dy)}px`;
        fetchGuideRef.current.style.transform = `translate3d(${ball.position.x}px, ${ball.position.y}px, 0) rotate(${Math.atan2(dy, dx)}rad)`;
      }
    };

    const stepWorld = () => {
      if (world.finished) return;
      if (fetchPhaseRef.current === "outbound") {
        const targetY = clamp(ball.position.y + 3, fieldTop + 70, height - 92);
        const nextY = dog.position.y + clamp(targetY - dog.position.y, -1.45, 1.45);
        Matter.Body.setPosition(dog, { x: dogOrigin.x, y: nextY });
      } else if (fetchPhaseRef.current === "serve" || fetchPhaseRef.current === "held") {
        const nextY = dog.position.y + clamp(dogOrigin.y - dog.position.y, -0.65, 0.65);
        Matter.Body.setPosition(dog, { x: dogOrigin.x, y: nextY });
      }
      Matter.Engine.update(engine, FIXED_STEP);
    };

    const tick = (timestamp: number) => {
      if (fetchWorldRef.current !== world) return;
      const elapsed = clamp(timestamp - world.lastTimestamp, 0, 50);
      world.lastTimestamp = timestamp;
      world.accumulator += elapsed;
      while (world.accumulator >= FIXED_STEP) {
        stepWorld();
        world.accumulator -= FIXED_STEP;
      }
      renderBodies();
      if (!world.finished) world.frameId = window.requestAnimationFrame(tick);
    };
    renderBodies();
    world.frameId = window.requestAnimationFrame(tick);

    return () => {
      if (fetchWorldRef.current === world) stopFetchWorld();
    };
  }, [activity, fetchSessionKey, setFetchPhase, stopFetchWorld]);

  const localPoint = useCallback((clientX: number, clientY: number) => {
    const rect = playgroundRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handlePaddlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const world = starWorldRef.current;
    const point = localPoint(event.clientX, event.clientY);
    if (!world || !point || world.finished || event.button !== 0) return;
    event.preventDefault();
    const width = playgroundRef.current?.clientWidth ?? 393;
    const height = playgroundRef.current?.clientHeight ?? 364;
    const centerY = (108 + height - 18) * 0.5;
    world.pointerId = event.pointerId;
    world.playerTarget.x = clamp(point.x, 34, width - 34);
    world.playerTarget.y = clamp(point.y, centerY + 34, height - 52);
    world.playerConstraint.pointA = world.playerTarget;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPaddleDragging(true);
    setGameMessage("左右移動接球，看準角度把星星往上撞！");
  };

  const handlePaddlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const world = starWorldRef.current;
    const point = localPoint(event.clientX, event.clientY);
    if (!world || !point || world.pointerId !== event.pointerId) return;
    event.preventDefault();
    const width = playgroundRef.current?.clientWidth ?? 393;
    const height = playgroundRef.current?.clientHeight ?? 364;
    const centerY = (108 + height - 18) * 0.5;
    world.playerTarget.x = clamp(point.x, 34, width - 34);
    world.playerTarget.y = clamp(point.y, centerY + 34, height - 52);
  };

  const finishPaddlePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const world = starWorldRef.current;
    if (!world || world.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    world.pointerId = null;
    setPaddleDragging(false);
  };

  const handlePaddleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const world = starWorldRef.current;
    if (!world || world.finished) return;
    const delta: Partial<Record<string, Position>> = {
      ArrowLeft: { x: -24, y: 0 },
      ArrowRight: { x: 24, y: 0 },
      ArrowUp: { x: 0, y: -22 },
      ArrowDown: { x: 0, y: 22 },
    };
    const movement = delta[event.key];
    if (!movement) return;
    event.preventDefault();
    const width = playgroundRef.current?.clientWidth ?? 393;
    const height = playgroundRef.current?.clientHeight ?? 364;
    const centerY = (108 + height - 18) * 0.5;
    world.playerTarget.x = clamp(world.playerTarget.x + movement.x, 34, width - 34);
    world.playerTarget.y = clamp(world.playerTarget.y + movement.y, centerY + 34, height - 52);
    world.playerConstraint.pointA = world.playerTarget;
  };

  const attachFetchBall = useCallback((point: Position, pointerId: number) => {
    const world = fetchWorldRef.current;
    if (!world || world.finished) return false;
    const phase = fetchPhaseRef.current;
    if (phase !== "serve" && phase !== "held" && phase !== "return") return false;

    removeConstraint(world.engine, world.holdConstraint);
    removeConstraint(world.engine, world.dragConstraint);
    world.holdConstraint = null;
    world.dragConstraint = Matter.Constraint.create({
      label: "playerDrag",
      pointA: { ...point },
      bodyB: world.ball,
      length: 0,
      stiffness: 0.62,
      damping: 0.18,
    });
    Matter.Composite.add(world.engine.world, world.dragConstraint);
    world.pointerId = pointerId;
    world.samples = [{ ...point, time: performance.now() }];
    Matter.Body.setVelocity(world.ball, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(world.ball, 0);

    if (phase === "return") {
      const next = fetchPlayerScoreRef.current + 1;
      fetchPlayerScoreRef.current = next;
      setFetchPlayerScore(next);
      setFetchCatchBurst((value) => value + 1);
      setHeartBurst((value) => value + 1);
      setMood("squish");
      setBubble("被你直接抓到了！");
      if (next >= WIN_SCORE) {
        world.finished = true;
        setFetchPhase("complete");
        setFetchMessage("你連續接住三次回球，獲勝！");
        setFetchWinner("player");
        return true;
      }
      world.resolved = false;
      setFetchMessage("接住了！不用重置，直接把同一顆球甩回去");
    } else {
      setFetchMessage("保持抓住，往右甩向小貝！");
    }
    setFetchPhase("held");
    return true;
  }, [setFetchPhase]);

  const releaseFetchBall = useCallback(() => {
    const world = fetchWorldRef.current;
    if (!world || world.finished || fetchPhaseRef.current !== "held") return;
    removeConstraint(world.engine, world.dragConstraint);
    removeConstraint(world.engine, world.holdConstraint);
    world.dragConstraint = null;
    world.holdConstraint = null;
    world.pointerId = null;

    const recent = world.samples.filter((sample) => performance.now() - sample.time < 150);
    const first = recent[0];
    const last = recent[recent.length - 1];
    let velocity: Position | null = null;
    if (first && last && last.time - first.time > 20) {
      const steps = (last.time - first.time) / FIXED_STEP;
      velocity = {
        x: clamp(((last.x - first.x) / steps) * 0.74, -10.5, 11.5),
        y: clamp(((last.y - first.y) / steps) * 0.74, -10.5, 8.5),
      };
    }
    if (!velocity || velocity.x < 1.8 || Math.hypot(velocity.x, velocity.y) < 2.8) {
      velocity = createBallisticVelocity(world.ball.position, { x: world.dog.position.x - 12, y: world.dog.position.y }, 720);
    }
    Matter.Body.setVelocity(world.ball, velocity);
    Matter.Body.setAngularVelocity(world.ball, clamp(velocity.x * 0.03, -0.24, 0.24));
    world.resolved = false;
    world.samples = [];
    setFetchPhase("outbound");
    setFetchMessage("球是自由的物理物件——小貝正在移動接球！");
    setMood("walk");
    setBubble(null);
  }, [setFetchPhase]);

  const handleFetchBallPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const point = localPoint(event.clientX, event.clientY);
    if (!point || !attachFetchBall(point, event.pointerId)) return;
    event.preventDefault();
    if (!fetchWorldRef.current?.finished) event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFetchBallPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const world = fetchWorldRef.current;
    const point = localPoint(event.clientX, event.clientY);
    if (!world || !point || world.pointerId !== event.pointerId || !world.dragConstraint) return;
    event.preventDefault();
    const next = {
      x: clamp(point.x, 24, (playgroundRef.current?.clientWidth ?? 393) - 24),
      y: clamp(point.y, 126, (playgroundRef.current?.clientHeight ?? 364) - 34),
    };
    world.dragConstraint.pointA = next;
    world.samples.push({ ...next, time: performance.now() });
    if (world.samples.length > 8) world.samples.shift();
  };

  const finishFetchBallPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const world = fetchWorldRef.current;
    if (!world || world.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    releaseFetchBall();
  };

  const handleFetchBallKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const world = fetchWorldRef.current;
    if (!world || world.finished) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (fetchPhaseRef.current === "return") {
        attachFetchBall({ ...world.ball.position }, -1);
      } else if (fetchPhaseRef.current === "serve") {
        attachFetchBall({ ...world.ball.position }, -1);
        releaseFetchBall();
      } else if (fetchPhaseRef.current === "held") {
        releaseFetchBall();
      }
      return;
    }
    const delta: Partial<Record<string, Position>> = {
      ArrowLeft: { x: -22, y: 0 },
      ArrowRight: { x: 22, y: 0 },
      ArrowUp: { x: 0, y: -20 },
      ArrowDown: { x: 0, y: 20 },
    };
    const movement = delta[event.key];
    if (!movement) return;
    event.preventDefault();
    if (fetchPhaseRef.current === "serve") attachFetchBall({ ...world.ball.position }, -1);
    const constraint = world.dragConstraint;
    if (!constraint?.pointA) return;
    constraint.pointA = {
      x: clamp(constraint.pointA.x + movement.x, 24, (playgroundRef.current?.clientWidth ?? 393) - 24),
      y: clamp(constraint.pointA.y + movement.y, 126, (playgroundRef.current?.clientHeight ?? 364) - 34),
    };
  };

  useEffect(() => {
    const hintTimer = window.setTimeout(() => setShowHint(false), 7000);
    return () => window.clearTimeout(hintTimer);
  }, []);

  useEffect(() => {
    let wanderTimer: number | null = null;
    let arrivalTimer: number | null = null;
    let idleTimer: number | null = null;
    const scheduleWander = () => {
      wanderTimer = window.setTimeout(() => {
        if (dragRef.current || activityRef.current !== "none" || Date.now() < busyUntilRef.current) {
          scheduleWander();
          return;
        }
        const playground = playgroundRef.current;
        if (!playground) {
          scheduleWander();
          return;
        }
        const maxX = Math.max(EDGE_PADDING, playground.clientWidth - DOG_SIZE - EDGE_PADDING);
        const maxY = Math.max(74, playground.clientHeight - DOG_SIZE - 44);
        const next = {
          x: EDGE_PADDING + Math.random() * (maxX - EDGE_PADDING),
          y: 54 + Math.random() * (maxY - 54),
        };
        const current = positionRef.current;
        const distance = Math.hypot(next.x - current.x, next.y - current.y);
        const duration = clamp(distance * 8.6, 760, 1850);
        setFacing(next.x >= current.x ? 1 : -1);
        setMoveDuration(duration);
        setMood("walk");
        setBubble(null);
        setPosition(next);
        arrivalTimer = window.setTimeout(() => {
          if (dragRef.current) return;
          const wantsNap = Math.random() < 0.28;
          setMoveDuration(0);
          setMood(wantsNap ? "sleepy" : "idle");
          setBubble(wantsNap ? "Zzz…" : Math.random() < 0.22 ? pick(BUBBLES.idle) : null);
          idleTimer = window.setTimeout(() => {
            if (!dragRef.current) {
              setMood("idle");
              setBubble(null);
            }
            scheduleWander();
          }, wantsNap ? 2450 : 1250);
        }, duration);
      }, 2200 + Math.random() * 2700);
    };
    scheduleWander();
    return () => {
      if (wanderTimer !== null) window.clearTimeout(wanderTimer);
      if (arrivalTimer !== null) window.clearTimeout(arrivalTimer);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, [setFacing, setPosition]);

  useEffect(() => () => {
    if (reactionTimerRef.current !== null) window.clearTimeout(reactionTimerRef.current);
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    if (activityTimerRef.current !== null) window.clearTimeout(activityTimerRef.current);
    stopStarWorld();
    stopFetchWorld();
  }, [stopFetchWorld, stopStarWorld]);

  const handleDogPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const dogRect = event.currentTarget.getBoundingClientRect();
    const playgroundRect = playgroundRef.current?.getBoundingClientRect();
    if (playgroundRect) setPosition({ x: dogRect.left - playgroundRect.left, y: dogRect.top - playgroundRect.top });
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - dogRect.left,
      offsetY: event.clientY - dogRect.top,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      moved: false,
      longPressed: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setShowHint(false);
    setMoveDuration(0);
    setBubble("咦？");
    setMood("dragging");
    busyUntilRef.current = Date.now() + 1000;
    if (activityRef.current === "none") {
      const pointerId = event.pointerId;
      clearLongPress();
      longPressTimerRef.current = window.setTimeout(() => {
        const activeDrag = dragRef.current;
        if (!activeDrag || activeDrag.pointerId !== pointerId || activeDrag.moved) return;
        activeDrag.longPressed = true;
        longPressTimerRef.current = null;
        openActionMenu();
      }, 560);
    }
  };

  const handleDogPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const playground = playgroundRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !playground || drag.longPressed) return;
    event.preventDefault();
    const rect = playground.getBoundingClientRect();
    const next = {
      x: clamp(event.clientX - rect.left - drag.offsetX, EDGE_PADDING, Math.max(EDGE_PADDING, rect.width - DOG_SIZE - EDGE_PADDING)),
      y: clamp(event.clientY - rect.top - drag.offsetY, 18, Math.max(48, rect.height - DOG_SIZE - 18)),
    };
    const movedDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.moved && movedDistance > 6) {
      clearLongPress();
      if (activityRef.current === "menu") {
        closeActivity();
        setMood("dragging");
        setBubble("咦？");
      }
    }
    if (Math.abs(event.clientX - drag.lastX) > 1) setFacing(event.clientX >= drag.lastX ? 1 : -1);
    drag.lastX = event.clientX;
    drag.moved ||= movedDistance > 6;
    setPosition(next);
  };

  const finishDogPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    clearLongPress();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setMoveDuration(0);
    if (drag.longPressed) return;
    if (!drag.moved) {
      petBeigo();
      return;
    }
    setMood("squish");
    setBubble(pick(BUBBLES.drop));
    setHeartBurst((value) => value + 1);
    finishReaction(880);
  };

  const cancelDogPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    clearLongPress();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setMoveDuration(0);
    if (activityRef.current === "none") {
      setMood("idle");
      setBubble(null);
    }
  };

  const sprite = SPRITES[mood];
  const depthScale = 0.9 + clamp(position.y / 260, 0, 1) * 0.1;
  const expandedActive = activity === "cards" || activity === "formation" || activity === "sunCards" || activity === "game" || activity === "fetch";
  const dogStyle: CSSProperties = activity === "sunCards"
    ? { left: "calc(100% - 112px)", top: 18, zIndex: 420, transition: "transform 180ms ease", transform: "scale(0.52)" }
    : activity === "formation"
    ? { left: "calc(100% - 116px)", top: 70, zIndex: 420, transition: "transform 180ms ease", transform: "scale(0.56)" }
    : activity === "cards"
    ? { left: "calc(50% - 74px)", top: 82, zIndex: 420, transition: "transform 180ms ease", transform: "scale(0.82)" }
    : expandedActive
      ? { left: 0, top: 0, zIndex: 420, transition: "none" }
      : {
        left: position.x,
        top: position.y,
        zIndex: 10 + Math.round(position.y),
        transition: moveDuration > 0 ? `left ${moveDuration}ms linear, top ${moveDuration}ms linear` : "none",
        transform: `scale(${depthScale})`,
      };
  const sheetStyle: CSSProperties = {
    transform: `translate3d(${-sprite.col * DOG_SIZE}px, ${-sprite.row * DOG_SIZE}px, 0)`,
  };
  const fetchBallLabel = fetchPhase === "return"
    ? "抓住飛回來的球"
    : fetchPhase === "serve" || fetchPhase === "held"
      ? "抓住球並甩向小貝"
      : "球正在物理場景中飛行";

  return (
    <div
      ref={playgroundRef}
      className={`${styles.playground} ${expandedActive ? styles.playgroundExpanded : ""}`}
      aria-label="小貝狗遊戲空間"
    >
      {activity === "menu" ? (
        <div className={styles.actionMenu} role="dialog" aria-label="小貝狗互動選單">
          <div className={styles.actionMenuTitle}>四款小貝遊戲 · 選一款試玩</div>
          <div className={styles.actionMenuButtons}>
            <button type="button" className={styles.actionChoice} onClick={startPongGame}>
              <span aria-hidden="true">↕</span>
              <span><strong>星星乒乓</strong><small>上下來回反擊</small></span>
            </button>
            <button type="button" className={styles.actionChoice} onClick={startCardGame}>
              <span aria-hidden="true">✊</span>
              <span><strong>剪刀石頭布</strong><small>抽三張，再輪流選牌</small></span>
            </button>
            <button type="button" className={styles.actionChoice} onClick={startFormationGame}>
              <span aria-hidden="true">▦</span>
              <span><strong>配配看</strong><small>翻兩張，找出同一隻</small></span>
            </button>
            <button type="button" className={styles.actionChoice} onClick={startSunCardsGame}>
              <span aria-hidden="true">☀</span>
              <span><strong>小日札</strong><small>三路蓋牌，撞擊搶生命</small></span>
            </button>
          </div>
          <button type="button" className={styles.closeButton} onClick={closeActivity} aria-label="關閉互動選單">×</button>
        </div>
      ) : null}

      {activity === "cards" ? (
        <LobbyBeigoCardDuel onExit={closeActivity} onReaction={handleCardReaction} />
      ) : null}

      {activity === "formation" ? (
        <LobbyBeigoFormationDuel onExit={closeActivity} onReaction={handleFormationReaction} />
      ) : null}

      {activity === "sunCards" ? (
        <LobbyBeigoSunCards onExit={closeActivity} onReaction={handleSunCardsReaction} />
      ) : null}

      {activity === "game" ? (
        <>
          <div className={styles.pongBackdrop} aria-hidden="true" />
          <div className={styles.gameHud} role="status" aria-live="polite">
            <span className={styles.gameTitle}>星星乒乓</span>
            <span className={styles.gameRule}>先拿 {WIN_SCORE} 分</span>
            <span className={styles.gameScoreBoard}><span>你 <strong>{playerScore}</strong></span><em>:</em><span><strong>{beigoScore}</strong> 小貝</span></span>
            <button type="button" className={styles.gameCloseButton} onClick={closeActivity} aria-label="結束星星乒乓">×</button>
          </div>
          {!gameWinner ? <div className={styles.gamePlayPrompt} role="status" aria-live="polite">{gameMessage}</div> : null}
          <div className={`${styles.gameGoal} ${styles.gameGoalPlayer}`} aria-hidden="true"><span>你的球門</span></div>
          <div className={`${styles.gameGoal} ${styles.gameGoalBeigo}`} aria-hidden="true"><span>小貝球門</span></div>
          <span className={styles.arenaDivider} aria-hidden="true" />
          <span className={`${styles.arenaBumper} ${styles.arenaBumperA}`} aria-hidden="true" />
          <span className={`${styles.arenaBumper} ${styles.arenaBumperB}`} aria-hidden="true" />
          <span ref={starRef} className={styles.gameStar} aria-hidden="true">★{gameHitBurst > 0 ? <i key={gameHitBurst}>✦</i> : null}</span>
          <button
            ref={playerPaddleRef}
            type="button"
            className={`${styles.playerPaddle} ${paddleDragging ? styles.playerPaddleDragging : ""}`}
            aria-label="拖動你的手掌撞擊星星"
            onPointerDown={handlePaddlePointerDown}
            onPointerMove={handlePaddlePointerMove}
            onPointerUp={finishPaddlePointer}
            onPointerCancel={finishPaddlePointer}
            onKeyDown={handlePaddleKeyDown}
          ><span aria-hidden="true">✋</span><small>你</small></button>
          {gameWinner ? (
            <div className={styles.gameResult} role="dialog" aria-label="星星乒乓結果">
              <strong>{gameWinner === "player" ? "你贏了！" : "小貝狗贏了！"}</strong>
              <span>你 {playerScore}：{beigoScore} 小貝</span>
              <div><button type="button" onClick={startPongGame}>再比一次</button><button type="button" onClick={closeActivity}>先休息</button></div>
            </div>
          ) : null}
        </>
      ) : null}

      {activity === "fetch" ? (
        <>
          <div className={styles.fetchHud} role="status" aria-live="polite">
            <span className={styles.fetchTitle}>飛球來回</span>
            <span className={styles.fetchRound}>先拿 {WIN_SCORE} 分</span>
            <span className={styles.fetchDuelScore}>你 {fetchPlayerScore} : {fetchBeigoScore} 小貝</span>
            <button type="button" onClick={closeActivity} aria-label="結束飛球來回">×</button>
          </div>
          {!fetchWinner ? <div className={`${styles.fetchPlayPrompt} ${fetchPhase === "return" ? styles.fetchPlayPromptUrgent : ""}`} role="status" aria-live="polite">{fetchMessage}</div> : null}
          <span ref={fetchGuideRef} className={styles.fetchAimLine} aria-hidden="true" />
          <span className={styles.fetchDogBodyHint} aria-hidden="true">碰到小貝才算接到</span>
          <span className={styles.fetchFurnitureBumper} aria-hidden="true" />
          <button
            ref={fetchBallRef}
            type="button"
            className={`${styles.fetchPhysicsBall} ${fetchPhase === "return" ? styles.fetchPhysicsBallCatchable : ""}`}
            aria-label={fetchBallLabel}
            disabled={fetchPhase === "outbound" || fetchPhase === "dogHold" || fetchPhase === "reset" || fetchPhase === "complete"}
            onPointerDown={handleFetchBallPointerDown}
            onPointerMove={handleFetchBallPointerMove}
            onPointerUp={finishFetchBallPointer}
            onPointerCancel={finishFetchBallPointer}
            onKeyDown={handleFetchBallKeyDown}
          ><span aria-hidden="true">●</span>{fetchCatchBurst > 0 ? <i key={fetchCatchBurst}>✦</i> : null}</button>
          {fetchWinner ? (
            <div className={styles.fetchResultCard} role="dialog" aria-label="飛球來回結果">
              <strong>{fetchWinner === "player" ? "你接球獲勝！" : "小貝狗獲勝！"}</strong>
              <span>{fetchPlayerScore} : {fetchBeigoScore}</span>
              <small>每一分都由實際抓球或落地碰撞決定</small>
              <div><button type="button" onClick={startFetchGame}>再玩一次</button><button type="button" onClick={closeActivity}>先休息</button></div>
            </div>
          ) : null}
        </>
      ) : null}

      <button
        ref={dogRef}
        type="button"
        className={styles.dog}
        style={dogStyle}
        disabled={expandedActive}
        aria-label="小貝狗。點一下摸摸牠、拖曳牠移動，或長按選擇遊戲。"
        onPointerDown={handleDogPointerDown}
        onPointerMove={handleDogPointerMove}
        onPointerUp={finishDogPointer}
        onPointerCancel={cancelDogPointer}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            petBeigo();
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            openActionMenu();
          }
        }}
      >
        {bubble ? <span className={styles.bubble} role="status" aria-live="polite">{bubble}</span> : null}
        {heartBurst > 0 && mood !== "idle" && mood !== "walk" && mood !== "sleepy" ? (
          <span key={heartBurst} aria-hidden="true"><span className={styles.heart}>♥</span><span className={styles.heart}>♥</span><span className={styles.heart}>♥</span></span>
        ) : null}
        <span className={`${styles.shadow} ${mood === "dragging" ? styles.dragShadow : ""}`} />
        <span className={`${styles.spriteStage} ${styles[mood]}`} aria-hidden="true">
          <span className={styles.spriteWindow} style={{ transform: `scaleX(${facing})` }}>
            <img className={styles.spriteSheet} src={SPRITE_SHEET} alt="" style={sheetStyle} draggable={false} />
          </span>
        </span>
      </button>

      <div className={`${styles.hint} ${showHint ? "" : styles.hintHidden}`} aria-hidden="true"><span className={styles.paw}>♥</span>點一下摸摸 · 長按選遊戲</div>
    </div>
  );
}

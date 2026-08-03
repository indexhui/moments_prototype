"use client";

import { useEffect, useRef } from "react";
import type PhaserTypes from "phaser";

type PhaserGoatRunnerCanvasProps = {
  variant: "metro" | "office";
  initialProgress: number;
  targetProgress: number;
  initialSeconds: number;
  resetNonce: number;
  onStatsChange: (stats: { progress: number; secondsRemaining: number }) => void;
  onCollect: () => void;
  onFocusCollect: () => void;
  onBreakthrough: (kind: GoatRunnerBreakthroughKind) => void;
  onBreakthroughBreak: () => void;
  onRebound: (kind: GoatRunnerBreakthroughKind) => void;
  onComboChange: (combo: number) => void;
  onPenalty: (secondsLost: number) => void;
  onComplete: (result: { progress: number; secondsRemaining: number }) => void;
  onFail: () => void;
};

type RunnerCallbacks = Pick<
  PhaserGoatRunnerCanvasProps,
  | "onStatsChange"
  | "onCollect"
  | "onFocusCollect"
  | "onBreakthrough"
  | "onBreakthroughBreak"
  | "onRebound"
  | "onComboChange"
  | "onPenalty"
  | "onComplete"
  | "onFail"
>;

const GAME_SIZE = 720;
const PLAYER_X = 146;
const GROUND_Y = 606;
export const GOAT_RUNNER_DOCUMENT_PROGRESS_VALUE = 1;
export const GOAT_RUNNER_FOCUS_PROGRESS_VALUE = 3;
export const GOAT_RUNNER_BREAKTHROUGH_PROGRESS_VALUE = 2;
export const GOAT_RUNNER_REBOUND_PROGRESS_VALUE = 1;
export const GOAT_RUNNER_JUMP_REQUEST_EVENT =
  "moment:goat-runner-jump-request";
export type GoatRunnerBreakthroughKind = "rise" | "slam";
const DOUBLE_TAP_WINDOW_MS = 230;
const BREAKTHROUGH_DURATION_MS = 520;
const BREAKTHROUGH_COOLDOWN_MS = 620;

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function createRunnerSoundBank() {
  let context: AudioContext | null = null;
  const getContext = () => {
    if (!context) context = new AudioContext();
    if (context.state === "suspended") void context.resume();
    return context;
  };
  const tone = (
    startFrequency: number,
    endFrequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    delay = 0,
  ) => {
    const audioContext = getContext();
    const startAt = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, endFrequency),
      startAt + duration,
    );
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  };

  return {
    jump: () => tone(250, 560, 0.14, 0.055, "sine"),
    collect: (combo: number) =>
      tone(710 + Math.min(combo, 9) * 38, 980 + Math.min(combo, 9) * 42, 0.09, 0.05, "triangle"),
    hit: () => tone(150, 58, 0.24, 0.075, "sawtooth"),
    breakthrough: (kind: GoatRunnerBreakthroughKind) =>
      kind === "slam"
        ? tone(360, 84, 0.2, 0.075, "square")
        : tone(210, 680, 0.18, 0.07, "triangle"),
    breakBlock: () => {
      tone(210, 74, 0.14, 0.07, "sawtooth");
      tone(520, 760, 0.12, 0.045, "triangle", 0.04);
    },
    focus: () => {
      tone(720, 1120, 0.12, 0.05, "triangle");
      tone(980, 1320, 0.1, 0.035, "sine", 0.055);
    },
    rebound: () => {
      tone(260, 760, 0.16, 0.065, "triangle");
      tone(620, 1120, 0.12, 0.04, "sine", 0.06);
    },
    complete: () => {
      [660, 880, 1100].forEach((note, index) =>
        tone(note, note * 1.05, 0.18, 0.045, "triangle", index * 0.085),
      );
    },
    fail: () => tone(230, 90, 0.32, 0.065, "sine"),
    dispose: () => {
      if (context) {
        void context.close();
        context = null;
      }
    },
  };
}

export function PhaserGoatRunnerCanvas({
  variant,
  initialProgress,
  targetProgress,
  initialSeconds,
  resetNonce,
  onStatsChange,
  onCollect,
  onFocusCollect,
  onBreakthrough,
  onBreakthroughBreak,
  onRebound,
  onComboChange,
  onPenalty,
  onComplete,
  onFail,
}: PhaserGoatRunnerCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef<RunnerCallbacks>({
    onStatsChange,
    onCollect,
    onFocusCollect,
    onBreakthrough,
    onBreakthroughBreak,
    onRebound,
    onComboChange,
    onPenalty,
    onComplete,
    onFail,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStatsChange,
      onCollect,
      onFocusCollect,
      onBreakthrough,
      onBreakthroughBreak,
      onRebound,
      onComboChange,
      onPenalty,
      onComplete,
      onFail,
    };
  }, [
    onCollect,
    onFocusCollect,
    onBreakthrough,
    onBreakthroughBreak,
    onRebound,
    onComboChange,
    onComplete,
    onFail,
    onPenalty,
    onStatsChange,
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let game: PhaserTypes.Game | null = null;
    const soundBank = createRunnerSoundBank();
    const runnerTapEvent = `goat-runner-tap-${variant}-${resetNonce}`;
    const requestTap = () => game?.events.emit(runnerTapEvent);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      event.preventDefault();
      requestTap();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(GOAT_RUNNER_JUMP_REQUEST_EVENT, requestTap);

    const startGame = async () => {
      const Phaser = (await import("phaser")).default;
      if (cancelled || !mountRef.current) return;

      const startingProgress = clampProgress(initialProgress);
      const endingProgress = clampProgress(targetProgress);
      const startingSeconds = Math.max(1, Math.round(initialSeconds));
      const isMetro = variant === "metro";

      class GoatRunnerScene extends Phaser.Scene {
        private player!: PhaserTypes.GameObjects.Rectangle;
        private playerBody!: PhaserTypes.Physics.Arcade.Body;
        private maiAvatar!: PhaserTypes.GameObjects.DOMElement;
        private ground!: PhaserTypes.GameObjects.Rectangle;
        private documents!: PhaserTypes.Physics.Arcade.Group;
        private focusDocuments!: PhaserTypes.Physics.Arcade.Group;
        private solidTerrainBlocks!: PhaserTypes.Physics.Arcade.Group;
        private breakableBlocks!: PhaserTypes.Physics.Arcade.Group;
        private impactPads!: PhaserTypes.Physics.Arcade.Group;
        private terrainPlatforms!: PhaserTypes.Physics.Arcade.Group;
        private spawnTimer?: PhaserTypes.Time.TimerEvent;
        private backgroundLayers: PhaserTypes.GameObjects.Image[] = [];
        private backgroundWidth = 0;
        private floorStripes: PhaserTypes.GameObjects.Rectangle[] = [];
        private elapsedMs = 0;
        private progressValue = startingProgress;
        private secondsValue = startingSeconds;
        private comboValue = 0;
        private patternIndex = 0;
        private finished = false;
        private runClock = 0;
        private lastGroundedAt = 0;
        private jumpQueuedUntil = 0;
        private lastTapAt = Number.NEGATIVE_INFINITY;
        private lastBreakthroughAt = Number.NEGATIVE_INFINITY;
        private breakthroughStartedAt = 0;
        private breakthroughEndsAt = 0;
        private breakthroughHitUntil = 0;
        private breakthroughKind: GoatRunnerBreakthroughKind | null = null;
        private wasGrounded = true;

        constructor() {
          super({ key: `goat-runner-${variant}-${resetNonce}` });
        }

        preload() {
          this.load.image(
            "goat-work-world",
            "/images/goat-runner/work-world-bg.png",
          );
          this.load.image(
            "goat-work-document",
            "/images/goat-runner/work-document-v2.png",
          );
          this.load.image(
            "goat-work-inspiration",
            "/images/goat-runner/work-inspiration-v2.png",
          );
          this.load.image(
            "goat-work-breakable",
            "/images/goat-runner/work-breakable-v2.png",
          );
          this.load.image(
            "goat-work-terrain-block",
            "/images/goat-runner/work-terrain-block-v2.png",
          );
        }

        create() {
          this.createScrollingWorkWorld();
          this.createGround();
          this.createPlayer();
          this.createGameplayGroups();

          this.time.delayedCall(520, () => this.spawnPattern());
          this.spawnTimer = this.time.addEvent({
            delay: isMetro ? 1900 : 1450,
            loop: true,
            callback: () => this.spawnPattern(),
          });

          this.input.on("pointerdown", this.handleTap, this);
          this.game.events.on(runnerTapEvent, this.handleTap, this);
          this.events.once("shutdown", () => {
            this.game.events.off(runnerTapEvent, this.handleTap, this);
          });

          this.reportStats();
          callbacksRef.current.onComboChange(0);
        }

        update(_time: number, delta: number) {
          if (this.finished) return;
          this.elapsedMs += delta;
          this.runClock += delta;
          const nextSeconds = Math.max(
            0,
            Math.ceil((startingSeconds * 1000 - this.elapsedMs) / 1000),
          );
          if (nextSeconds !== this.secondsValue) {
            this.secondsValue = nextSeconds;
            this.reportStats();
          }

          this.updateScrollingWorld(delta);
          this.updatePlayerLane();
          this.updateJumpBuffer();
          this.updateBreakthroughState();
          this.updateAvatar();
          this.updateGameplayDecorations();
          this.cleanupGameplayObjects();

          if (this.secondsValue <= 0 && this.progressValue < endingProgress) {
            this.failRun();
          }
        }

        private createScrollingWorkWorld() {
          const source = this.textures
            .get("goat-work-world")
            .getSourceImage() as { width: number; height: number };
          this.backgroundWidth = (source.width / source.height) * GAME_SIZE;
          for (let index = 0; index < 2; index += 1) {
            const background = this.add
              .image(index * this.backgroundWidth, GAME_SIZE / 2, "goat-work-world")
              .setOrigin(0, 0.5)
              .setDisplaySize(this.backgroundWidth, GAME_SIZE)
              .setDepth(0);
            if (!isMetro) background.setTint(0xf4efdf);
            this.backgroundLayers.push(background);
          }
          this.add
            .rectangle(GAME_SIZE / 2, GAME_SIZE / 2, GAME_SIZE, GAME_SIZE, 0xffffff, 0.08)
            .setDepth(1);
        }

        private createGround() {
          this.ground = this.add
            .rectangle(GAME_SIZE / 2, GROUND_Y + 58, GAME_SIZE, 116, 0x8c765d, 0.34)
            .setDepth(4);
          this.physics.add.existing(this.ground, true);
          this.add
            .rectangle(GAME_SIZE / 2, GROUND_Y + 4, GAME_SIZE, 9, 0xfff4d8, 0.92)
            .setDepth(5);
          for (let index = 0; index < 12; index += 1) {
            this.floorStripes.push(
              this.add
                .rectangle(index * 72, GROUND_Y + 13, 34, 7, 0xe6c88c, 0.8)
                .setRotation(-0.08)
                .setDepth(6),
            );
          }
        }

        private createPlayer() {
          this.player = this.add
            .rectangle(PLAYER_X, GROUND_Y - 75, 68, 148, 0xffffff, 0)
            .setDepth(10);
          this.physics.add.existing(this.player);
          this.playerBody = this.player.body as PhaserTypes.Physics.Arcade.Body;
          this.playerBody.setSize(58, 138);
          this.playerBody.setCollideWorldBounds(true);
          this.physics.add.collider(this.player, this.ground);

          const avatarNode = document.createElement("img");
          avatarNode.src = "/images/mai/walk.gif";
          avatarNode.alt = "";
          avatarNode.draggable = false;
          Object.assign(avatarNode.style, {
            width: "108px",
            height: "184px",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
            filter: "drop-shadow(0 10px 8px rgba(73,55,39,0.22))",
          });
          this.maiAvatar = this.add.dom(PLAYER_X, GROUND_Y - 92, avatarNode).setDepth(12);
        }

        private createGameplayGroups() {
          this.documents = this.physics.add.group({ allowGravity: false, immovable: true });
          this.focusDocuments = this.physics.add.group({
            allowGravity: false,
            immovable: true,
          });
          this.solidTerrainBlocks = this.physics.add.group({
            allowGravity: false,
            immovable: true,
          });
          this.breakableBlocks = this.physics.add.group({
            allowGravity: false,
            immovable: true,
          });
          this.impactPads = this.physics.add.group({ allowGravity: false, immovable: true });
          this.terrainPlatforms = this.physics.add.group({
            allowGravity: false,
            immovable: true,
          });
          this.physics.add.collider(this.player, this.terrainPlatforms);
          this.physics.add.collider(
            this.player,
            this.solidTerrainBlocks,
            (_playerObject, terrainObject) =>
              this.hitSolidTerrain(terrainObject as PhaserTypes.Physics.Arcade.Image),
          );
          this.physics.add.overlap(
            this.player,
            this.documents,
            (_playerObject, documentObject) =>
              this.collectDocument(documentObject as PhaserTypes.Physics.Arcade.Image),
          );
          this.physics.add.overlap(
            this.player,
            this.focusDocuments,
            (_playerObject, focusObject) =>
              this.collectFocusDocument(focusObject as PhaserTypes.Physics.Arcade.Image),
          );
          this.physics.add.collider(
            this.player,
            this.breakableBlocks,
            (_playerObject, blockObject) =>
              this.hitBreakableBlock(blockObject as PhaserTypes.Physics.Arcade.Image),
          );
          this.physics.add.overlap(
            this.player,
            this.impactPads,
            (_playerObject, padObject) =>
              this.hitImpactPad(padObject as PhaserTypes.GameObjects.Rectangle),
          );
        }

        private getRunnerSpeed() {
          return (isMetro ? 315 : 340) + Math.min(85, (this.elapsedMs / 1000) * 3.2);
        }

        private spawnPattern() {
          if (this.finished) return;
          const startX = GAME_SIZE + 75;
          const currentPatternId = this.patternIndex;
          const patterns: Array<{
            documents: Array<[number, number]>;
            focus: [number, number] | null;
            solidTerrain: {
              offsetX: number;
              placement: "ground" | "ceiling";
            } | null;
            breakableX: number | null;
            impactPadX: number | null;
            terrainHeight: number;
            platformWidth: number;
          }> = [
            {
              documents: [[0, 184], [58, 226], [174, 226], [232, 184]],
              focus: [116, 266],
              solidTerrain: null,
              breakableX: null,
              impactPadX: null,
              terrainHeight: 0,
              platformWidth: 0,
            },
            {
              documents: [[0, 150], [62, 202], [124, 254], [186, 286], [248, 300]],
              focus: [214, 330],
              solidTerrain: { offsetX: 326, placement: "ground" },
              breakableX: null,
              impactPadX: null,
              terrainHeight: 0,
              platformWidth: 0,
            },
            {
              documents: [[0, 116], [58, 132], [116, 126], [174, 114], [232, 108]],
              focus: [284, 124],
              solidTerrain: { offsetX: 342, placement: "ceiling" },
              breakableX: null,
              impactPadX: null,
              terrainHeight: 0,
              platformWidth: 0,
            },
            {
              documents: [[0, 220], [64, 250], [128, 220], [192, 250], [256, 220]],
              focus: null,
              solidTerrain: null,
              breakableX: 318,
              impactPadX: null,
              terrainHeight: 0,
              platformWidth: 0,
            },
            {
              documents: [[0, 132], [64, 174], [192, 202], [256, 164]],
              focus: [128, 238],
              solidTerrain: null,
              breakableX: null,
              impactPadX: null,
              terrainHeight: 68,
              platformWidth: 430,
            },
          ];
          const pattern = patterns[this.patternIndex % patterns.length] ?? patterns[0];
          this.patternIndex += 1;
          const speed = this.getRunnerSpeed();
          const surfaceY = GROUND_Y - pattern.terrainHeight;

          if (pattern.terrainHeight > 0) {
            this.createRaisedPlatform(
              startX - 38,
              surfaceY,
              pattern.terrainHeight,
              pattern.platformWidth,
              speed,
            );
          }

          pattern.documents.forEach(([offsetX, height]) => {
            const collectible = this.documents.create(
              startX + offsetX,
              surfaceY - height,
              "goat-work-document",
            ) as PhaserTypes.Physics.Arcade.Image;
            collectible.setDepth(9).setDisplaySize(68, 68).setVelocityX(-speed);
            collectible.setData("pattern-id", currentPatternId);
            const body = collectible.body as PhaserTypes.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setImmovable(true);
            body.setSize(440, 500).setOffset(100, 70);
          });

          if (pattern.focus) {
            this.createFocusDocument(
              startX + pattern.focus[0],
              surfaceY - pattern.focus[1],
              speed,
            );
          }

          if (pattern.solidTerrain) {
            this.createSolidTerrainBlock(
              startX + pattern.solidTerrain.offsetX,
              pattern.solidTerrain.placement,
              speed,
            );
          }

          if (pattern.breakableX !== null) {
            const breakableBlock = this.breakableBlocks.create(
              startX + pattern.breakableX,
              surfaceY - 48,
              "goat-work-breakable",
            ) as PhaserTypes.Physics.Arcade.Image;
            breakableBlock
              .setDepth(9)
              .setDisplaySize(146, 98)
              .setVelocityX(-speed);
            const body = breakableBlock.body as PhaserTypes.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setImmovable(true);
            body.setSize(540, 400).setOffset(110, 60);
            breakableBlock.setData(
              "label",
              this.createGameplayLabel(
                breakableBlock.x,
                breakableBlock.y - 64,
                "下撞可破",
                "#A96D2D",
              ),
            );
          }

          if (pattern.impactPadX !== null) {
            this.createImpactPad(startX + pattern.impactPadX, surfaceY, speed);
          }
        }

        private createSolidTerrainBlock(
          x: number,
          placement: "ground" | "ceiling",
          speed: number,
        ) {
          const displayHeight = placement === "ground" ? 270 : 292;
          const y = placement === "ground" ? GROUND_Y - displayHeight / 2 : displayHeight / 2 - 18;
          const block = this.solidTerrainBlocks.create(
            x,
            y,
            "goat-work-terrain-block",
          ) as PhaserTypes.Physics.Arcade.Image;
          block
            .setDepth(8)
            .setDisplaySize(148, displayHeight)
            .setVelocityX(-speed);
          block.setFlipY(placement === "ceiling");
          block.setData("placement", placement);
          const body = block.body as PhaserTypes.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(true);
          body.setSize(320, 820).setOffset(65, 40);
        }

        private createGameplayLabel(
          x: number,
          y: number,
          text: string,
          backgroundColor: string,
        ) {
          return this.add
            .text(x, y, text, {
              backgroundColor,
              color: "#fffaf0",
              fontFamily: "sans-serif",
              fontSize: "19px",
              fontStyle: "bold",
              padding: { x: 9, y: 5 },
              stroke: "rgba(74,48,35,0.72)",
              strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(11);
        }

        private createFocusDocument(x: number, y: number, speed: number) {
          const focusDocument = this.focusDocuments.create(
            x,
            y,
            "goat-work-inspiration",
          ) as PhaserTypes.Physics.Arcade.Image;
          focusDocument
            .setDepth(10)
            .setDisplaySize(84, 84)
            .setVelocityX(-speed);
          const body = focusDocument.body as PhaserTypes.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(true);
          body.setSize(300, 520).setOffset(170, 40);
          const halo = this.add
            .ellipse(x, y, 62, 70, 0x28b9c4, 0.24)
            .setStrokeStyle(4, 0xd9ffff, 0.88)
            .setDepth(9);
          this.tweens.add({
            targets: halo,
            scale: 1.14,
            alpha: 0.32,
            duration: 520,
            yoyo: true,
            repeat: -1,
            ease: "Sine.InOut",
          });
          focusDocument.setData("halo", halo);
        }

        private createImpactPad(x: number, surfaceY: number, speed: number) {
          const pad = this.add
            .rectangle(x, surfaceY - 8, 86, 16, 0x38c9d2, 0.98)
            .setStrokeStyle(4, 0xd9ffff, 0.95)
            .setDepth(10);
          this.physics.add.existing(pad);
          this.impactPads.add(pad);
          const body = pad.body as PhaserTypes.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(true);
          body.setVelocityX(-speed);
          const label = this.add
            .text(x, surfaceY - 34, "轉勢板", {
              color: "#D9FFFF",
              fontFamily: "sans-serif",
              fontSize: "16px",
              fontStyle: "bold",
              stroke: "#256F78",
              strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(11);
          const stripes = [-24, 0, 24].map((offsetX) =>
            this.add
              .rectangle(x + offsetX, surfaceY - 8, 5, 12, 0xffffff, 0.78)
              .setRotation(-0.35)
              .setDepth(11),
          );
          pad.setData("label", label);
          pad.setData("stripes", stripes);
        }

        private createRaisedPlatform(
          startX: number,
          surfaceY: number,
          terrainHeight: number,
          width: number,
          speed: number,
        ) {
          const depth = terrainHeight + 72;
          const centerX = startX + width / 2;
          const platform = this.add
            .rectangle(centerX, surfaceY + depth / 2, width, depth, 0x6f7f82, 0.96)
            .setDepth(6);
          this.physics.add.existing(platform);
          this.terrainPlatforms.add(platform);
          const body = platform.body as PhaserTypes.Physics.Arcade.Body;
          body.setAllowGravity(false);
          body.setImmovable(true);
          body.setVelocityX(-speed);
          body.checkCollision.left = false;
          body.checkCollision.right = false;
          body.checkCollision.down = false;
          const cap = this.add
            .rectangle(centerX, surfaceY + 3, width, 10, 0xffedbd, 0.98)
            .setDepth(7);
          const paperSeams = [28, 58, 88]
            .filter((offsetY) => offsetY < depth - 10)
            .map((offsetY) =>
              this.add
                .rectangle(centerX, surfaceY + offsetY, width - 22, 3, 0xb9d0cf, 0.34)
                .setDepth(7),
            );
          platform.setData("cap", cap);
          platform.setData("paper-seams", paperSeams);
        }

        private updateScrollingWorld(delta: number) {
          const backgroundDistance = delta * (isMetro ? 0.046 : 0.054);
          this.backgroundLayers.forEach((background) => {
            background.x -= backgroundDistance;
            if (background.x + this.backgroundWidth < 0) {
              background.x += this.backgroundWidth * 2;
            }
          });
          const floorDistance = delta * (isMetro ? 0.25 : 0.29);
          this.floorStripes.forEach((stripe) => {
            stripe.x -= floorDistance;
            if (stripe.x < -36) stripe.x += 864;
          });
        }

        private updatePlayerLane() {
          const distanceToLane = PLAYER_X - this.player.x;
          this.playerBody.setVelocityX(
            Math.abs(distanceToLane) < 2
              ? 0
              : Math.max(-180, Math.min(280, distanceToLane * 12)),
          );
        }

        private handleTap(pointer?: PhaserTypes.Input.Pointer) {
          if (this.finished) return;
          const now = this.time.now;
          if (now - this.lastTapAt <= DOUBLE_TAP_WINDOW_MS) {
            this.lastTapAt = Number.NEGATIVE_INFINITY;
            const kind: GoatRunnerBreakthroughKind =
              (pointer?.y ?? this.player.y) < GAME_SIZE * 0.5 ? "rise" : "slam";
            this.performBreakthrough(kind);
            return;
          }
          this.lastTapAt = now;
          this.jump();
        }

        private jump() {
          if (this.finished) return;
          if (this.isGrounded() || this.time.now - this.lastGroundedAt <= 100) {
            this.performJump();
          } else {
            this.jumpQueuedUntil = this.time.now + 190;
          }
        }

        private isGrounded() {
          return this.playerBody.blocked.down || this.playerBody.touching.down;
        }

        private updateJumpBuffer() {
          if (!this.isGrounded()) return;
          this.lastGroundedAt = this.time.now;
          if (this.jumpQueuedUntil >= this.time.now) this.performJump();
        }

        private performJump() {
          this.jumpQueuedUntil = 0;
          this.playerBody.setVelocityY(-930);
          soundBank.jump();
          this.tweens.add({
            targets: this.maiAvatar,
            scaleX: 1.07,
            scaleY: 0.94,
            duration: 95,
            yoyo: true,
            ease: "Sine.Out",
          });
        }

        private performBreakthrough(kind: GoatRunnerBreakthroughKind) {
          if (
            this.finished ||
            this.time.now - this.lastBreakthroughAt < BREAKTHROUGH_COOLDOWN_MS
          ) {
            return;
          }
          this.lastBreakthroughAt = this.time.now;
          this.breakthroughStartedAt = this.time.now;
          this.breakthroughEndsAt = this.time.now + BREAKTHROUGH_DURATION_MS;
          this.breakthroughHitUntil = this.time.now + 900;
          this.breakthroughKind = kind;
          this.jumpQueuedUntil = 0;
          this.playerBody.setVelocityY(
            kind === "slam"
              ? Math.max(1180, this.playerBody.velocity.y)
              : Math.min(-1120, this.playerBody.velocity.y),
          );
          const avatarNode = this.maiAvatar.node as HTMLImageElement;
          avatarNode.style.filter =
            kind === "slam"
              ? "drop-shadow(12px 12px 6px rgba(41,155,166,0.58)) saturate(1.3)"
              : "drop-shadow(14px -10px 6px rgba(41,155,166,0.58)) saturate(1.3)";
          soundBank.breakthrough(kind);
          callbacksRef.current.onBreakthrough(kind);
          this.createBreakthroughTrail(kind);
          this.cameras.main.shake(90, kind === "slam" ? 0.006 : 0.004);
        }

        private updateBreakthroughState() {
          const grounded = this.isGrounded();
          if (this.breakthroughKind === "slam" && grounded && !this.wasGrounded) {
            this.createLandingImpact();
            this.finishBreakthrough();
          }
          this.wasGrounded = grounded;
          if (!this.breakthroughKind || this.time.now < this.breakthroughEndsAt) return;
          this.finishBreakthrough();
        }

        private finishBreakthrough() {
          this.breakthroughKind = null;
          const avatarNode = this.maiAvatar.node as HTMLImageElement;
          avatarNode.style.filter = "drop-shadow(0 10px 8px rgba(73,55,39,0.22))";
        }

        private createBreakthroughTrail(kind: GoatRunnerBreakthroughKind) {
          const colors = [0xffffff, 0x9bf3f2, 0x34bbc6, 0xffdd7a];
          for (let index = 0; index < 7; index += 1) {
            const trail = this.add
              .rectangle(
                this.player.x - 28 - index * 11,
                this.player.y - 45 + (index % 3) * 22,
                38 + index * 8,
                5 + (index % 2) * 3,
                colors[index % colors.length],
                0.72,
              )
              .setDepth(11)
              .setRotation(kind === "slam" ? 0.32 : -0.32);
            this.tweens.add({
              targets: trail,
              x: trail.x - 100,
              y: trail.y + (kind === "slam" ? -52 : 52),
              alpha: 0,
              scaleX: 1.5,
              duration: 230 + index * 22,
              ease: "Quad.Out",
              onComplete: () => trail.destroy(),
            });
          }
        }

        private createLandingImpact() {
          const impactX = this.player.x + 24;
          const impactY = this.player.y + 62;
          [
            { width: 74, height: 18, color: 0xffd46b, alpha: 0.78 },
            { width: 46, height: 12, color: 0xb6ffff, alpha: 0.9 },
          ].forEach((style, index) => {
            const ring = this.add
              .ellipse(impactX, impactY, style.width, style.height, style.color, style.alpha)
              .setDepth(13);
            this.tweens.add({
              targets: ring,
              scaleX: 2.4 + index * 0.4,
              scaleY: 1.8,
              alpha: 0,
              duration: 300 + index * 70,
              ease: "Quad.Out",
              onComplete: () => ring.destroy(),
            });
          });
          this.cameras.main.shake(130, 0.01);
          this.cameras.main.flash(70, 255, 214, 107, false);
        }

        private updateAvatar() {
          const grounded = this.isGrounded();
          const breakthroughProgress = this.breakthroughKind
            ? Math.min(
                1,
                (this.time.now - this.breakthroughStartedAt) / BREAKTHROUGH_DURATION_MS,
              )
            : 0;
          const breakthroughOffset = this.breakthroughKind
            ? Math.sin(breakthroughProgress * Math.PI) *
              (this.breakthroughKind === "rise" ? 62 : 44)
            : 0;
          this.maiAvatar.setPosition(
            this.player.x + breakthroughOffset,
            this.player.y -
              18 +
              (grounded ? Math.sin(this.runClock / 74) * 4 : 0) +
              (this.breakthroughKind === "slam" ? 12 : this.breakthroughKind === "rise" ? -12 : 0),
          );
          this.maiAvatar.setRotation(
            this.breakthroughKind
              ? this.breakthroughKind === "slam"
                ? 0.36
                : -0.28
              : grounded
              ? Math.sin(this.runClock / 120) * 0.012
              : Math.max(-0.08, this.playerBody.velocity.y / 11000),
          );
        }

        private flyRewardToHud(
          textureKey: "goat-work-document" | "goat-work-inspiration",
          x: number,
          y: number,
          delay = 0,
        ) {
          const backing = this.add
            .circle(0, 0, 31, textureKey === "goat-work-inspiration" ? 0xb9ffff : 0xffe5a0, 0.88)
            .setStrokeStyle(3, 0xffffff, 0.92);
          const reward = this.add.image(0, 0, textureKey).setDisplaySize(54, 54);
          const flyingReward = this.add
            .container(x, y, [backing, reward])
            .setDepth(30)
            .setScale(0.72);
          this.tweens.add({
            targets: flyingReward,
            x: GAME_SIZE - 62,
            y: 112,
            scale: 0.28,
            rotation: 0.34,
            duration: 540,
            delay,
            ease: "Cubic.In",
            onComplete: () => {
              flyingReward.destroy(true);
              const arrival = this.add
                .circle(GAME_SIZE - 62, 112, 18, 0xffffff, 0.72)
                .setStrokeStyle(4, 0x65dce2, 0.9)
                .setDepth(31);
              this.tweens.add({
                targets: arrival,
                alpha: 0,
                scale: 2.2,
                duration: 260,
                ease: "Quad.Out",
                onComplete: () => arrival.destroy(),
              });
            },
          });
        }

        private collectDocument(document: PhaserTypes.Physics.Arcade.Image) {
          if (this.finished || !document.active) return;
          const patternId = document.getData("pattern-id");
          const trailDocuments = this.documents
            .getChildren()
            .filter((child) => {
              const candidate = child as PhaserTypes.Physics.Arcade.Image;
              return (
                candidate.active &&
                candidate.getData("pattern-id") === patternId &&
                Math.abs(candidate.x - document.x) <= 125
              );
            })
            .slice(0, 3) as PhaserTypes.Physics.Arcade.Image[];

          trailDocuments.forEach((candidate, index) => {
            const collectX = candidate.x;
            const collectY = candidate.y;
            candidate.disableBody(true, true);
            this.flyRewardToHud("goat-work-document", collectX, collectY, index * 70);
            this.comboValue += 1;
            this.progressValue = Math.min(
              endingProgress,
              this.progressValue + GOAT_RUNNER_DOCUMENT_PROGRESS_VALUE,
            );
            callbacksRef.current.onCollect();
            const burst = this.add.circle(collectX, collectY, 18, 0xffe28b, 0.94).setDepth(13);
            this.tweens.add({
              targets: burst,
              alpha: 0,
              scale: 2.5,
              duration: 340,
              ease: "Quad.Out",
              onComplete: () => burst.destroy(),
            });
          });
          soundBank.collect(this.comboValue);
          callbacksRef.current.onComboChange(this.comboValue);
          this.reportStats();
          if (this.progressValue >= endingProgress) this.completeRun();
        }

        private collectFocusDocument(focusDocument: PhaserTypes.Physics.Arcade.Image) {
          if (this.finished || !focusDocument.active) return;
          const collectX = focusDocument.x;
          const collectY = focusDocument.y;
          const halo = focusDocument.getData("halo") as
            | PhaserTypes.GameObjects.Ellipse
            | undefined;
          halo?.destroy();
          focusDocument.disableBody(true, true);
          this.flyRewardToHud("goat-work-inspiration", collectX, collectY);
          this.comboValue += 2;
          this.progressValue = Math.min(
            endingProgress,
            this.progressValue + GOAT_RUNNER_FOCUS_PROGRESS_VALUE,
          );
          soundBank.focus();
          callbacksRef.current.onFocusCollect();
          callbacksRef.current.onComboChange(this.comboValue);
          const rings = [0x5ed6df, 0xffffff, 0xffdb73].map((color, index) =>
            this.add
              .ellipse(collectX, collectY, 28 + index * 12, 38 + index * 12, color, 0.72)
              .setDepth(14),
          );
          rings.forEach((ring, index) => {
            this.tweens.add({
              targets: ring,
              alpha: 0,
              scale: 2.2 + index * 0.2,
              duration: 380 + index * 60,
              ease: "Quad.Out",
              onComplete: () => ring.destroy(),
            });
          });
          this.cameras.main.flash(65, 94, 214, 223, false);
          this.reportStats();
          if (this.progressValue >= endingProgress) this.completeRun();
        }

        private hitSolidTerrain(terrainBlock: PhaserTypes.Physics.Arcade.Image) {
          if (
            this.finished ||
            !terrainBlock.active ||
            terrainBlock.getData("penalized")
          ) {
            return;
          }
          terrainBlock.setData("penalized", true);
          this.breakthroughHitUntil = 0;
          if (this.breakthroughKind) this.finishBreakthrough();
          this.elapsedMs += 2000;
          this.resetCombo();
          soundBank.hit();
          callbacksRef.current.onPenalty(2);
          this.cameras.main.shake(180, 0.012);
          this.cameras.main.flash(100, 188, 80, 72, false);
          this.tweens.add({
            targets: this.maiAvatar,
            angle: { from: -7, to: 0 },
            duration: 250,
            ease: "Back.Out",
          });
        }

        private hitBreakableBlock(breakableBlock: PhaserTypes.Physics.Arcade.Image) {
          if (this.finished || !breakableBlock.active) return;
          const label = breakableBlock.getData("label") as
            | PhaserTypes.GameObjects.Text
            | undefined;
          const canBreak =
            this.breakthroughKind === "slam" &&
            this.time.now <= this.breakthroughHitUntil;
          if (!canBreak) {
            if (breakableBlock.getData("penalized")) return;
            breakableBlock.setData("penalized", true);
            this.elapsedMs += 2000;
            this.resetCombo();
            soundBank.hit();
            callbacksRef.current.onPenalty(2);
            this.cameras.main.shake(180, 0.014);
            this.cameras.main.flash(110, 202, 77, 67, false);
            return;
          }

          const breakX = breakableBlock.x;
          const breakY = breakableBlock.y;
          this.breakthroughHitUntil = 0;
          label?.destroy();
          breakableBlock.disableBody(true, true);
          this.flyRewardToHud("goat-work-inspiration", breakX, breakY);
          this.progressValue = Math.min(
            endingProgress,
            this.progressValue + GOAT_RUNNER_BREAKTHROUGH_PROGRESS_VALUE,
          );
          soundBank.breakBlock();
          callbacksRef.current.onBreakthroughBreak();
          const shardColors = [0xffe6a8, 0xe0a94f, 0xb6ffff, 0xfff6d7];
          for (let index = 0; index < 8; index += 1) {
            const shard = this.add
              .rectangle(
                breakX,
                breakY,
                8 + (index % 3) * 4,
                6 + (index % 2) * 5,
                shardColors[index % shardColors.length],
                0.96,
              )
              .setDepth(14)
              .setRotation(index * 0.38);
            this.tweens.add({
              targets: shard,
              x: breakX + 42 + index * 9,
              y: breakY - 58 + (index % 4) * 38,
              alpha: 0,
              angle: 150 + index * 25,
              duration: 360 + index * 18,
              ease: "Quad.Out",
              onComplete: () => shard.destroy(),
            });
          }
          this.cameras.main.shake(120, 0.007);
          this.reportStats();
          if (this.progressValue >= endingProgress) this.completeRun();
        }

        private hitImpactPad(pad: PhaserTypes.GameObjects.Rectangle) {
          if (
            this.finished ||
            !pad.active ||
            !this.breakthroughKind ||
            this.time.now > this.breakthroughHitUntil
          ) {
            return;
          }
          const kind = this.breakthroughKind;
          const padX = pad.x;
          const padY = pad.y;
          const label = pad.getData("label") as PhaserTypes.GameObjects.Text | undefined;
          const stripes = (pad.getData("stripes") ?? []) as PhaserTypes.GameObjects.Rectangle[];
          label?.destroy();
          stripes.forEach((stripe) => stripe.destroy());
          pad.destroy();
          this.breakthroughHitUntil = 0;
          this.finishBreakthrough();
          this.wasGrounded = false;
          this.playerBody.setVelocityY(kind === "slam" ? -1120 : -840);
          this.progressValue = Math.min(
            endingProgress,
            this.progressValue + GOAT_RUNNER_REBOUND_PROGRESS_VALUE,
          );
          soundBank.rebound();
          callbacksRef.current.onRebound(kind);
          const burstColors = [0xd9ffff, 0x49d6dd, 0xffd46b];
          for (let index = 0; index < 9; index += 1) {
            const spark = this.add
              .rectangle(
                padX,
                padY,
                7 + (index % 3) * 3,
                5 + (index % 2) * 3,
                burstColors[index % burstColors.length],
                0.96,
              )
              .setDepth(14)
              .setRotation(index * 0.45);
            this.tweens.add({
              targets: spark,
              x: padX - 96 + index * 24,
              y: padY - 54 - (index % 3) * 24,
              alpha: 0,
              angle: 100 + index * 32,
              duration: 360 + index * 24,
              ease: "Quad.Out",
              onComplete: () => spark.destroy(),
            });
          }
          this.cameras.main.shake(120, 0.008);
          this.cameras.main.flash(80, 73, 214, 221, false);
          this.reportStats();
          if (this.progressValue >= endingProgress) this.completeRun();
        }

        private resetCombo() {
          if (this.comboValue === 0) return;
          this.comboValue = 0;
          callbacksRef.current.onComboChange(0);
        }

        private updateGameplayDecorations() {
          this.breakableBlocks.getChildren().forEach((child) => {
            const object = child as PhaserTypes.Physics.Arcade.Image;
            const label = object.getData("label") as
              | PhaserTypes.GameObjects.Text
              | undefined;
            if (object.active && label?.active) label.setPosition(object.x, object.y - 64);
          });
          this.focusDocuments.getChildren().forEach((child) => {
            const focusDocument = child as PhaserTypes.Physics.Arcade.Image;
            const halo = focusDocument.getData("halo") as
              | PhaserTypes.GameObjects.Ellipse
              | undefined;
            if (focusDocument.active && halo?.active) {
              halo.setPosition(focusDocument.x, focusDocument.y);
            }
          });
          this.impactPads.getChildren().forEach((child) => {
            const pad = child as PhaserTypes.GameObjects.Rectangle;
            const label = pad.getData("label") as PhaserTypes.GameObjects.Text | undefined;
            const stripes = (pad.getData("stripes") ?? []) as PhaserTypes.GameObjects.Rectangle[];
            if (!pad.active) return;
            if (label?.active) label.setPosition(pad.x, pad.y - 26);
            stripes.forEach((stripe, index) => {
              if (stripe.active) stripe.setPosition(pad.x - 24 + index * 24, pad.y);
            });
          });
          this.terrainPlatforms.getChildren().forEach((child) => {
            const platform = child as PhaserTypes.GameObjects.Rectangle;
            const cap = platform.getData("cap") as PhaserTypes.GameObjects.Rectangle | undefined;
            if (platform.active && cap?.active) cap.x = platform.x;
            const paperSeams = (platform.getData("paper-seams") ?? []) as
              PhaserTypes.GameObjects.Rectangle[];
            if (platform.active) paperSeams.forEach((seam) => (seam.x = platform.x));
          });
        }

        private cleanupGameplayObjects() {
          this.documents.getChildren().forEach((child) => {
            const document = child as PhaserTypes.Physics.Arcade.Image;
            if (
              document.active &&
              document.x < PLAYER_X - 55 &&
              !document.getData("counted-miss")
            ) {
              document.setData("counted-miss", true);
              this.resetCombo();
            }
            if (document.active && document.x < -90) document.destroy();
          });
          this.focusDocuments.getChildren().forEach((child) => {
            const focusDocument = child as PhaserTypes.Physics.Arcade.Image;
            if (
              focusDocument.active &&
              focusDocument.x < PLAYER_X - 55 &&
              !focusDocument.getData("counted-miss")
            ) {
              focusDocument.setData("counted-miss", true);
              this.resetCombo();
            }
            if (focusDocument.active && focusDocument.x < -90) {
              const halo = focusDocument.getData("halo") as
                | PhaserTypes.GameObjects.Ellipse
                | undefined;
              halo?.destroy();
              focusDocument.destroy();
            }
          });
          this.solidTerrainBlocks.getChildren().forEach((child) => {
            const terrainBlock = child as PhaserTypes.Physics.Arcade.Image;
            if (terrainBlock.active && terrainBlock.x < -160) {
              terrainBlock.destroy();
            }
          });
          this.breakableBlocks.getChildren().forEach((child) => {
            const breakableBlock = child as PhaserTypes.Physics.Arcade.Image;
            if (breakableBlock.active && breakableBlock.x < -160) {
              const label = breakableBlock.getData("label") as
                | PhaserTypes.GameObjects.Text
                | undefined;
              label?.destroy();
              breakableBlock.destroy();
            }
          });
          this.impactPads.getChildren().forEach((child) => {
            const pad = child as PhaserTypes.GameObjects.Rectangle;
            if (pad.active && pad.x < -100) {
              const label = pad.getData("label") as PhaserTypes.GameObjects.Text | undefined;
              const stripes = (pad.getData("stripes") ?? []) as
                PhaserTypes.GameObjects.Rectangle[];
              label?.destroy();
              stripes.forEach((stripe) => stripe.destroy());
              pad.destroy();
            }
          });
          this.terrainPlatforms.getChildren().forEach((child) => {
            const platform = child as PhaserTypes.GameObjects.Rectangle;
            if (platform.active && platform.x + platform.width / 2 < -100) {
              const cap = platform.getData("cap") as PhaserTypes.GameObjects.Rectangle | undefined;
              const paperSeams = (platform.getData("paper-seams") ?? []) as
                PhaserTypes.GameObjects.Rectangle[];
              cap?.destroy();
              paperSeams.forEach((seam) => seam.destroy());
              platform.destroy();
            }
          });
        }

        private reportStats() {
          callbacksRef.current.onStatsChange({
            progress: this.progressValue,
            secondsRemaining: this.secondsValue,
          });
        }

        private stopSpawning() {
          this.spawnTimer?.remove(false);
          this.spawnTimer = undefined;
          [
            ...this.documents.getChildren(),
            ...this.focusDocuments.getChildren(),
            ...this.solidTerrainBlocks.getChildren(),
            ...this.breakableBlocks.getChildren(),
          ].forEach((child) => {
            const object = child as PhaserTypes.Physics.Arcade.Image;
            if (object.active) object.setVelocityX(0);
          });
          this.impactPads.getChildren().forEach((child) => {
            const pad = child as PhaserTypes.GameObjects.Rectangle;
            const body = pad.body as PhaserTypes.Physics.Arcade.Body | null;
            body?.setVelocityX(0);
          });
          this.terrainPlatforms.getChildren().forEach((child) => {
            const platform = child as PhaserTypes.GameObjects.Rectangle;
            const body = platform.body as PhaserTypes.Physics.Arcade.Body | null;
            body?.setVelocityX(0);
          });
        }

        private completeRun() {
          if (this.finished) return;
          this.finished = true;
          this.stopSpawning();
          this.playerBody.setVelocity(0, 0);
          this.playerBody.setAllowGravity(false);
          soundBank.complete();
          this.cameras.main.flash(180, 255, 244, 201, false);
          this.time.delayedCall(460, () =>
            callbacksRef.current.onComplete({
              progress: endingProgress,
              secondsRemaining: Math.max(1, this.secondsValue),
            }),
          );
        }

        private failRun() {
          if (this.finished) return;
          this.finished = true;
          this.stopSpawning();
          this.playerBody.setVelocity(0, 0);
          this.playerBody.setAllowGravity(false);
          soundBank.fail();
          callbacksRef.current.onFail();
        }
      }

      game = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: mountRef.current,
        width: GAME_SIZE,
        height: GAME_SIZE,
        transparent: true,
        physics: {
          default: "arcade",
          arcade: { gravity: { x: 0, y: 2000 }, debug: false },
        },
        dom: { createContainer: true },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: GoatRunnerScene,
        audio: { noAudio: true },
      });
    };

    void startGame();
    return () => {
      cancelled = true;
      game?.destroy(true);
      game = null;
      soundBank.dispose();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(GOAT_RUNNER_JUMP_REQUEST_EVENT, requestTap);
      mount.replaceChildren();
    };
  }, [initialProgress, initialSeconds, resetNonce, targetProgress, variant]);

  return (
    <div
      ref={mountRef}
      aria-label="工作進度跳躍跑酷遊戲"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        touchAction: "none",
      }}
    />
  );
}

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
  onComboChange: (combo: number) => void;
  onPenalty: (secondsLost: number) => void;
  onComplete: (result: { progress: number; secondsRemaining: number }) => void;
  onFail: () => void;
};

type RunnerCallbacks = Pick<
  PhaserGoatRunnerCanvasProps,
  | "onStatsChange"
  | "onCollect"
  | "onComboChange"
  | "onPenalty"
  | "onComplete"
  | "onFail"
>;

const GAME_SIZE = 720;
const PLAYER_X = 146;
const GROUND_Y = 606;
export const GOAT_RUNNER_DOCUMENT_PROGRESS_VALUE = 1;
export const GOAT_RUNNER_JUMP_REQUEST_EVENT =
  "moment:goat-runner-jump-request";

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
  onComboChange,
  onPenalty,
  onComplete,
  onFail,
}: PhaserGoatRunnerCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef<RunnerCallbacks>({
    onStatsChange,
    onCollect,
    onComboChange,
    onPenalty,
    onComplete,
    onFail,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStatsChange,
      onCollect,
      onComboChange,
      onPenalty,
      onComplete,
      onFail,
    };
  }, [onCollect, onComboChange, onComplete, onFail, onPenalty, onStatsChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let game: PhaserTypes.Game | null = null;
    const soundBank = createRunnerSoundBank();
    const runnerJumpEvent = `goat-runner-jump-${variant}-${resetNonce}`;
    const requestJump = () => game?.events.emit(runnerJumpEvent);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      event.preventDefault();
      requestJump();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(GOAT_RUNNER_JUMP_REQUEST_EVENT, requestJump);

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
        private obstacles!: PhaserTypes.Physics.Arcade.Group;
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
            "/images/goat-runner/work-document.png",
          );
          this.load.image(
            "goat-work-obstacle",
            "/images/goat-runner/work-obstacle.png",
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

          this.input.on("pointerdown", this.jump, this);
          this.game.events.on(runnerJumpEvent, this.jump, this);
          this.events.once("shutdown", () => {
            this.game.events.off(runnerJumpEvent, this.jump, this);
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
          this.updateJumpBuffer();
          this.updateAvatar();
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
          this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
          this.physics.add.overlap(
            this.player,
            this.documents,
            (_playerObject, documentObject) =>
              this.collectDocument(documentObject as PhaserTypes.Physics.Arcade.Image),
          );
          this.physics.add.overlap(
            this.player,
            this.obstacles,
            (_playerObject, obstacleObject) =>
              this.hitObstacle(obstacleObject as PhaserTypes.Physics.Arcade.Image),
          );
        }

        private getRunnerSpeed() {
          return (isMetro ? 315 : 340) + Math.min(85, (this.elapsedMs / 1000) * 3.2);
        }

        private spawnPattern() {
          if (this.finished) return;
          const startX = GAME_SIZE + 75;
          const currentPatternId = this.patternIndex;
          const patterns = [
            {
              documents: [[0, 184], [58, 226], [116, 256], [174, 226], [232, 184]],
              obstacleX: null,
            },
            {
              documents: [[0, 205], [62, 252], [124, 276], [186, 252], [248, 205]],
              obstacleX: 128,
            },
            {
              documents: [[0, 176], [58, 230], [116, 270], [174, 230], [232, 176]],
              obstacleX: 184,
            },
            {
              documents: [[0, 220], [64, 250], [128, 220], [192, 250], [256, 220]],
              obstacleX: null,
            },
          ] as const;
          const pattern = patterns[this.patternIndex % patterns.length] ?? patterns[0];
          this.patternIndex += 1;
          const speed = this.getRunnerSpeed();

          pattern.documents.forEach(([offsetX, height]) => {
            const collectible = this.documents.create(
              startX + offsetX,
              GROUND_Y - height,
              "goat-work-document",
            ) as PhaserTypes.Physics.Arcade.Image;
            collectible.setDepth(9).setScale(0.062).setVelocityX(-speed);
            collectible.setData("pattern-id", currentPatternId);
            const body = collectible.body as PhaserTypes.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setImmovable(true);
            body.setSize(920, 1040).setOffset(165, 115);
          });

          if (pattern.obstacleX !== null) {
            const obstacle = this.obstacles.create(
              startX + pattern.obstacleX,
              GROUND_Y - 44,
              "goat-work-obstacle",
            ) as PhaserTypes.Physics.Arcade.Image;
            obstacle.setDepth(8).setScale(0.105).setVelocityX(-speed);
            const body = obstacle.body as PhaserTypes.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setImmovable(true);
            body.setSize(1320, 610).setOffset(180, 245);
          }
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

        private updateAvatar() {
          const grounded = this.isGrounded();
          this.maiAvatar.setPosition(
            this.player.x,
            this.player.y - 18 + (grounded ? Math.sin(this.runClock / 74) * 4 : 0),
          );
          this.maiAvatar.setRotation(
            grounded
              ? Math.sin(this.runClock / 120) * 0.012
              : Math.max(-0.08, this.playerBody.velocity.y / 11000),
          );
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

          trailDocuments.forEach((candidate) => {
            const collectX = candidate.x;
            const collectY = candidate.y;
            candidate.disableBody(true, true);
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

        private hitObstacle(obstacle: PhaserTypes.Physics.Arcade.Image) {
          if (this.finished || !obstacle.active) return;
          obstacle.disableBody(true, true);
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

        private resetCombo() {
          if (this.comboValue === 0) return;
          this.comboValue = 0;
          callbacksRef.current.onComboChange(0);
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
          this.obstacles.getChildren().forEach((child) => {
            const obstacle = child as PhaserTypes.Physics.Arcade.Image;
            if (obstacle.active && obstacle.x < -160) obstacle.destroy();
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
          [...this.documents.getChildren(), ...this.obstacles.getChildren()].forEach((child) => {
            const object = child as PhaserTypes.Physics.Arcade.Image;
            if (object.active) object.setVelocityX(0);
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
      window.removeEventListener(GOAT_RUNNER_JUMP_REQUEST_EVENT, requestJump);
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

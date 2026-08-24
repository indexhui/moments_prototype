"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { FiArrowLeft, FiList, FiRefreshCw, FiVolume2, FiVolumeX, FiX } from "react-icons/fi";
import * as CANNON from "cannon-es";
import * as THREE from "three";
import { ExhibitionIchibanTearReveal } from "@/components/game/ExhibitionIchibanTearReveal";
import { ROUTES } from "@/lib/routes";
import styles from "./ExhibitionIchibanView.module.css";

type PrizeDefinition = {
  id: string;
  tier: "S" | "A" | "B" | "C";
  name: string;
  color: string;
  innerColor: string;
};

type CardRuntime = {
  prize: PrizeDefinition;
  body: CANNON.Body;
  group: THREE.Group;
  cardMesh: THREE.Mesh;
  outline: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  removing: boolean;
  removed: boolean;
};

type PoolRuntime = {
  world: CANNON.World;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  cards: CardRuntime[];
  selectedId: string | null;
  stirrer: CANNON.Body;
  frameId: number;
  timers: number[];
};

export type IchibanPoolHandle = {
  drawRandom: () => boolean;
  shake: () => void;
  removeCard: (id: string) => void;
  returnCard: (id: string) => void;
};

const CARD_PALETTE = {
  S: { color: "#F1B662", innerColor: "#FFE2A7" },
  A: { color: "#E78178", innerColor: "#F7B7AF" },
  B: { color: "#7898D7", innerColor: "#AFC3EE" },
  C: { color: "#79B999", innerColor: "#AFE0C2" },
} as const;

const PRIZE_GROUPS = [
  { tier: "S" as const, name: "限定小日獸壓克力立牌", count: 1 },
  { tier: "A" as const, name: "小麥與小白拍立得組", count: 3 },
  { tier: "B" as const, name: "交換日記貼紙包", count: 6 },
  { tier: "C" as const, name: "MOMENT 紀念明信片", count: 14 },
] as const;

const CARD_WIDTH = 4.15;
const CARD_DEPTH = 6.35;
const CARD_HEIGHT = 0.28;
const ARENA_HALF_X = 6.65;
const ARENA_HALF_Z = 10.6;
const BROWN = 0x645246;
const HOVER_RED = 0xd85f54;

function shuffle<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function createPrizeDeck() {
  const deck: PrizeDefinition[] = [];
  PRIZE_GROUPS.forEach((group) => {
    const palette = CARD_PALETTE[group.tier];
    for (let index = 0; index < group.count; index += 1) {
      deck.push({
        id: `${group.tier}-${index + 1}`,
        tier: group.tier,
        name: group.name,
        color: palette.color,
        innerColor: palette.innerColor,
      });
    }
  });
  return shuffle(deck);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundedShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const top = -height / 2;
  shape.moveTo(left + radius, top);
  shape.lineTo(left + width - radius, top);
  shape.quadraticCurveTo(left + width, top, left + width, top + radius);
  shape.lineTo(left + width, top + height - radius);
  shape.quadraticCurveTo(left + width, top + height, left + width - radius, top + height);
  shape.lineTo(left + radius, top + height);
  shape.quadraticCurveTo(left, top + height, left, top + height - radius);
  shape.lineTo(left, top + radius);
  shape.quadraticCurveTo(left, top, left + radius, top);
  return shape;
}

function createRoundedExtrude(width: number, height: number, depth: number, radius: number) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
    depth,
    bevelEnabled: false,
    curveSegments: 5,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  return geometry;
}

function createRoundedPlane(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(roundedShape(width, height, radius), 5);
  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  return geometry;
}

function createCardTexture(prize: PrizeDefinition) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = prize.color;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const wash = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  wash.addColorStop(0, "rgba(255,255,255,0.34)");
  wash.addColorStop(0.5, "rgba(255,255,255,0.04)");
  wash.addColorStop(1, "rgba(70,45,30,0.12)");
  context.fillStyle = wash;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255,255,255,0.48)";
  context.lineWidth = 15;
  context.setLineDash([38, 18]);
  context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
  context.setLineDash([]);

  context.fillStyle = "rgba(255,255,255,0.72)";
  context.font = '900 57px ui-rounded, "Arial Rounded MT Bold", sans-serif';
  context.textAlign = "center";
  context.fillText("MOMENT", canvas.width / 2, 111);

  context.fillStyle = prize.innerColor;
  context.beginPath();
  context.roundRect(72, 585, 368, 86, 43);
  context.fill();

  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.roundRect(152 + index * 56, 613, 34, 30, 15);
    context.fillStyle = "rgba(255,255,255,0.58)";
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function makeWall(
  world: CANNON.World,
  halfExtents: CANNON.Vec3,
  position: CANNON.Vec3,
  material: CANNON.Material,
) {
  const body = new CANNON.Body({ mass: 0, material, position });
  body.addShape(new CANNON.Box(halfExtents));
  world.addBody(body);
  return body;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((entry) => {
    const candidate = entry as THREE.Material & { map?: THREE.Texture | null };
    candidate.map?.dispose();
    entry.dispose();
  });
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function playSynthSound(kind: "shake" | "draw" | "paper", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const now = context.currentTime;
  const duration = kind === "paper" ? 0.2 : 0.13;
  const length = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const envelope = 1 - index / length;
    channel[index] = (Math.random() * 2 - 1) * envelope;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = buffer;
  filter.type = kind === "paper" ? "bandpass" : "lowpass";
  filter.frequency.value = kind === "paper" ? 1500 : 520;
  filter.Q.value = kind === "paper" ? 0.75 : 0.35;
  gain.gain.setValueAtTime(kind === "shake" ? 0.05 : 0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start(now);
  noise.stop(now + duration);

  if (kind === "draw") {
    const oscillator = context.createOscillator();
    const oscillatorGain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(145, now);
    oscillator.frequency.exponentialRampToValueAtTime(72, now + 0.15);
    oscillatorGain.gain.setValueAtTime(0.05, now);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(oscillatorGain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.16);
  }

  window.setTimeout(() => void context.close(), 320);
}

function updatePointerFromEvent(
  event: PointerEvent,
  renderer: THREE.WebGLRenderer,
  pointer: THREE.Vector2,
) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
}

function raycastCard(
  runtime: PoolRuntime,
  pointer: THREE.Vector2,
  raycaster: THREE.Raycaster,
) {
  raycaster.setFromCamera(pointer, runtime.camera);
  const candidates = runtime.cards
    .filter((card) => !card.removed && !card.removing)
    .map((card) => card.cardMesh);
  const hit = raycaster.intersectObjects(candidates, false)[0];
  if (!hit) return null;
  return runtime.cards.find((card) => card.cardMesh === hit.object) ?? null;
}

const ExhibitionIchibanPool = forwardRef<
  IchibanPoolHandle,
  {
    prizes: PrizeDefinition[];
    soundEnabled: boolean;
    disabled: boolean;
    onPick: (prize: PrizeDefinition) => void;
    onReadyChange: (ready: boolean) => void;
  }
>(function ExhibitionIchibanPool(
  { prizes, soundEnabled, disabled, onPick, onReadyChange },
  forwardedRef,
) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<PoolRuntime | null>(null);
  const onPickRef = useRef(onPick);
  const soundEnabledRef = useRef(soundEnabled);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const presentPrize = useCallback((card: CardRuntime) => {
    const runtime = runtimeRef.current;
    if (!runtime || runtime.selectedId || card.removed || card.removing) return;
    runtime.selectedId = card.prize.id;
    runtime.cards.forEach((entry) => entry.body.wakeUp());
    card.body.wakeUp();
    card.body.velocity.set(0, 46, 0);
    card.body.angularVelocity.set(
      (Math.random() - 0.5) * 17,
      (Math.random() - 0.5) * 17,
      (Math.random() - 0.5) * 17,
    );
    playSynthSound("draw", soundEnabledRef.current);
    triggerHaptic([16, 24, 20]);
    const timer = window.setTimeout(() => {
      if (!runtimeRef.current || runtimeRef.current.selectedId !== card.prize.id) return;
      card.body.type = CANNON.Body.STATIC;
      card.body.velocity.setZero();
      card.body.angularVelocity.setZero();
      card.body.updateMassProperties();
      onPickRef.current(card.prize);
    }, 620);
    runtime.timers.push(timer);
  }, []);

  useImperativeHandle(
    forwardedRef,
    () => ({
      drawRandom() {
        const runtime = runtimeRef.current;
        if (!runtime || runtime.selectedId || disabledRef.current) return false;
        const available = runtime.cards.filter(
          (card) => !card.removing && !card.removed && card.body.type !== CANNON.Body.STATIC,
        );
        if (available.length === 0) return false;
        const chosen = available[Math.floor(Math.random() * available.length)];
        if (!chosen) return false;
        presentPrize(chosen);
        return true;
      },
      shake() {
        const runtime = runtimeRef.current;
        if (!runtime || disabledRef.current) return;
        runtime.cards.forEach((card) => {
          if (card.removed || card.removing || runtime.selectedId === card.prize.id) return;
          card.body.wakeUp();
          card.body.velocity.set(
            (Math.random() - 0.5) * 20,
            18 + Math.random() * 12,
            (Math.random() - 0.5) * 20,
          );
          card.body.angularVelocity.set(
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9,
            (Math.random() - 0.5) * 9,
          );
        });
        playSynthSound("shake", soundEnabledRef.current);
        triggerHaptic(18);
      },
      removeCard(id) {
        const runtime = runtimeRef.current;
        const card = runtime?.cards.find((entry) => entry.prize.id === id);
        if (!runtime || !card || card.removing || card.removed) return;
        runtime.selectedId = null;
        card.removing = true;
        card.body.collisionFilterGroup = 0;
        card.body.collisionFilterMask = 0;
      },
      returnCard(id) {
        const runtime = runtimeRef.current;
        const card = runtime?.cards.find((entry) => entry.prize.id === id);
        if (!runtime || !card || card.removed) return;
        runtime.selectedId = null;
        card.body.type = CANNON.Body.DYNAMIC;
        card.body.mass = 8;
        card.body.position.set((Math.random() - 0.5) * 5, 12, (Math.random() - 0.5) * 5);
        card.body.velocity.set((Math.random() - 0.5) * 8, -5, (Math.random() - 0.5) * 8);
        card.body.angularVelocity.set(2, -2, 1.5);
        card.body.updateMassProperties();
        card.body.wakeUp();
      },
    }),
    [presentPrize],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    onReadyChange(false);
    mount.replaceChildren();

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("aria-label", "一番賞卡片池，可拖曳或點選卡片");
    mount.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-8, 8, 18, -18, 0.1, 200);
    camera.position.set(0, 31, 25);
    camera.lookAt(0, 1.4, 0);
    scene.add(camera);

    const ambient = new THREE.HemisphereLight(0xfffbef, 0xa98874, 2.35);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(-7, 18, 12);
    scene.add(keyLight);

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -42, 0), allowSleep: true });
    world.broadphase = new CANNON.SAPBroadphase(world);
    (world.solver as CANNON.GSSolver).iterations = 12;
    const cardMaterial = new CANNON.Material("ticket");
    const arenaMaterial = new CANNON.Material("arena");
    world.addContactMaterial(
      new CANNON.ContactMaterial(cardMaterial, arenaMaterial, {
        friction: 0.08,
        restitution: 0.48,
      }),
    );
    world.addContactMaterial(
      new CANNON.ContactMaterial(cardMaterial, cardMaterial, {
        friction: 0.1,
        restitution: 0.36,
      }),
    );

    const floor = new CANNON.Body({ mass: 0, material: arenaMaterial });
    floor.addShape(new CANNON.Plane());
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floor);
    makeWall(world, new CANNON.Vec3(0.35, 5, ARENA_HALF_Z), new CANNON.Vec3(-ARENA_HALF_X, 5, 0), arenaMaterial);
    makeWall(world, new CANNON.Vec3(0.35, 5, ARENA_HALF_Z), new CANNON.Vec3(ARENA_HALF_X, 5, 0), arenaMaterial);
    makeWall(world, new CANNON.Vec3(ARENA_HALF_X, 5, 0.35), new CANNON.Vec3(0, 5, -ARENA_HALF_Z), arenaMaterial);
    makeWall(world, new CANNON.Vec3(ARENA_HALF_X, 5, 0.35), new CANNON.Vec3(0, 5, ARENA_HALF_Z), arenaMaterial);

    const stirrer = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.KINEMATIC,
      material: arenaMaterial,
      position: new CANNON.Vec3(0, -20, 0),
    });
    stirrer.addShape(new CANNON.Sphere(1.35));
    world.addBody(stirrer);

    const cardGeometry = createRoundedExtrude(CARD_WIDTH, CARD_DEPTH, CARD_HEIGHT, 0.34);
    const outlineGeometry = createRoundedExtrude(CARD_WIDTH + 0.24, CARD_DEPTH + 0.24, CARD_HEIGHT + 0.16, 0.44);
    const decalGeometry = createRoundedPlane(CARD_WIDTH - 0.16, CARD_DEPTH - 0.16, 0.28);
    const shadowGeometry = createRoundedPlane(CARD_WIDTH + 0.5, CARD_DEPTH + 0.5, 0.46);
    const bodyShape = new CANNON.Box(new CANNON.Vec3(CARD_WIDTH / 2, CARD_HEIGHT / 2, CARD_DEPTH / 2));

    const cards: CardRuntime[] = prizes.map((prize, index) => {
      const cardGroup = new THREE.Group();
      const color = new THREE.Color(prize.color);
      const cardMaterialThree = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0,
      });
      const cardMesh = new THREE.Mesh(cardGeometry, cardMaterialThree);
      cardGroup.add(cardMesh);

      const texture = createCardTexture(prize);
      if (texture) {
        const decal = new THREE.Mesh(
          decalGeometry,
          new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.05 }),
        );
        decal.position.y = CARD_HEIGHT / 2 + 0.014;
        cardGroup.add(decal);
      }

      const outline = new THREE.Mesh(
        outlineGeometry,
        new THREE.MeshBasicMaterial({ color: BROWN, side: THREE.BackSide }),
      );
      cardGroup.add(outline);
      outline.renderOrder = -1;

      const shadow = new THREE.Mesh(
        shadowGeometry,
        new THREE.MeshBasicMaterial({ color: 0xdacb9c, transparent: true, opacity: 0.38, depthWrite: false }),
      );
      shadow.position.y = 0.026;
      scene.add(shadow);
      scene.add(cardGroup);

      const body = new CANNON.Body({
        mass: 8,
        material: cardMaterial,
        position: new CANNON.Vec3(
          (Math.random() - 0.5) * 8,
          4 + index * 0.74,
          (Math.random() - 0.5) * 9,
        ),
        angularDamping: 0.72,
        linearDamping: 0.08,
        allowSleep: true,
        sleepSpeedLimit: 0.2,
        sleepTimeLimit: 0.5,
      });
      body.addShape(bodyShape);
      body.quaternion.setFromEuler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      body.velocity.set((Math.random() - 0.5) * 6, -2, (Math.random() - 0.5) * 6);
      world.addBody(body);

      return {
        prize,
        body,
        group: cardGroup,
        cardMesh,
        outline,
        shadow,
        removing: false,
        removed: false,
      };
    });

    const runtime: PoolRuntime = {
      world,
      scene,
      camera,
      renderer,
      cards,
      selectedId: null,
      stirrer,
      frameId: 0,
      timers: [],
    };
    runtimeRef.current = runtime;

    const pointer = new THREE.Vector2(9, 9);
    const pointerDown = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const groundPoint = new THREE.Vector3();
    let dragging = false;
    let moved = false;
    let pointerDownAt = 0;
    let hovered: CardRuntime | null = null;

    const updateHover = () => {
      if (disabledRef.current || dragging || runtime.selectedId) return;
      const nextHovered = raycastCard(runtime, pointer, raycaster);
      if (hovered && hovered !== nextHovered) hovered.outline.material.color.setHex(BROWN);
      if (nextHovered && hovered !== nextHovered) nextHovered.outline.material.color.setHex(HOVER_RED);
      hovered = nextHovered;
    };

    const moveStirrer = () => {
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, groundPoint)) return;
      groundPoint.x = clamp(groundPoint.x, -ARENA_HALF_X + 1.2, ARENA_HALF_X - 1.2);
      groundPoint.z = clamp(groundPoint.z, -ARENA_HALF_Z + 1.2, ARENA_HALF_Z - 1.2);
      stirrer.position.set(groundPoint.x, 1.1, groundPoint.z);
      stirrer.velocity.setZero();
      cards.forEach((card) => card.body.wakeUp());
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (disabledRef.current || runtime.selectedId) return;
      updatePointerFromEvent(event, renderer, pointer);
      pointerDown.copy(pointer);
      pointerDownAt = performance.now();
      dragging = true;
      moved = false;
      moveStirrer();
      renderer.domElement.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointerFromEvent(event, renderer, pointer);
      if (dragging) {
        if (pointer.distanceTo(pointerDown) > 0.035) moved = true;
        moveStirrer();
      } else {
        updateHover();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      updatePointerFromEvent(event, renderer, pointer);
      dragging = false;
      stirrer.position.set(0, -20, 0);
      stirrer.velocity.setZero();
      if (!moved && performance.now() - pointerDownAt < 320 && !disabledRef.current) {
        const card = raycastCard(runtime, pointer, raycaster);
        if (card) presentPrize(card);
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown, { passive: false });
    renderer.domElement.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });

    const resize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      const aspect = width / Math.max(height, 1);
      const viewHeight = 35.5;
      camera.left = -(viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastFrameTime = performance.now();
    const euler = new THREE.Euler();
    let elapsed = 0;
    const animate = (frameTime: number) => {
      runtime.frameId = window.requestAnimationFrame(animate);
      const delta = Math.min(Math.max((frameTime - lastFrameTime) / 1000, 0), 0.05);
      lastFrameTime = frameTime;
      elapsed += delta;
      world.step(1 / 60, delta, 3);

      cards.forEach((card) => {
        if (card.removed) return;
        if (card.removing) {
          card.group.scale.multiplyScalar(0.84);
          card.outline.scale.multiplyScalar(0.995);
          card.shadow.scale.multiplyScalar(0.84);
          if (card.group.scale.x < 0.04) {
            card.removed = true;
            world.removeBody(card.body);
            scene.remove(card.group);
            scene.remove(card.shadow);
          }
          return;
        }
        card.group.position.copy(card.body.position as unknown as THREE.Vector3);
        card.group.quaternion.copy(card.body.quaternion as unknown as THREE.Quaternion);
        card.shadow.position.x = card.body.position.x + 0.28;
        card.shadow.position.z = card.body.position.z + 0.34;
        euler.setFromQuaternion(card.group.quaternion, "YXZ");
        card.shadow.rotation.z = -euler.y;
        const heightScale = clamp(1 - Math.max(0, card.body.position.y - 1) * 0.035, 0.54, 1);
        card.shadow.scale.setScalar(heightScale);
        card.shadow.material.opacity = clamp(0.42 - Math.max(0, card.body.position.y - 1) * 0.018, 0.08, 0.42);
      });

      if (!dragging && !runtime.selectedId) {
        camera.position.x = Math.sin(elapsed * 0.18) * 1.35;
        camera.lookAt(0, 1.4, 0);
      }
      renderer.render(scene, camera);
    };
    runtime.frameId = window.requestAnimationFrame(animate);
    onReadyChange(true);

    return () => {
      onReadyChange(false);
      runtime.timers.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(runtime.frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      cards.forEach((card) => {
        disposeMaterial(card.cardMesh.material);
        card.group.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child !== card.cardMesh && child !== card.outline) {
            disposeMaterial(child.material);
          }
        });
        disposeMaterial(card.outline.material);
        disposeMaterial(card.shadow.material);
      });
      cardGeometry.dispose();
      outlineGeometry.dispose();
      decalGeometry.dispose();
      shadowGeometry.dispose();
      renderer.forceContextLoss();
      renderer.dispose();
      mount.replaceChildren();
      runtimeRef.current = null;
    };
  }, [onReadyChange, presentPrize, prizes]);

  return <div ref={mountRef} className={styles.canvasMount} />;
});

function PrizeBoard({
  deck,
  drawnIds,
  onClose,
}: {
  deck: PrizeDefinition[];
  drawnIds: string[];
  onClose: () => void;
}) {
  const drawnSet = useMemo(() => new Set(drawnIds), [drawnIds]);
  return (
    <div className={styles.rosterOverlay} role="dialog" aria-modal="true" aria-label="獎項一覽">
      <div className={styles.rosterCard}>
        <div className={styles.rosterHeader}>
          <div>
            <span>PRIZE BOARD</span>
            <h2>今日獎池</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="關閉獎項一覽">
            <FiX />
          </button>
        </div>
        <div className={styles.rosterList}>
          {PRIZE_GROUPS.map((group) => {
            const total = deck.filter((prize) => prize.tier === group.tier).length;
            const drawn = deck.filter(
              (prize) => prize.tier === group.tier && drawnSet.has(prize.id),
            ).length;
            return (
              <div className={styles.rosterItem} key={group.tier}>
                <div
                  className={styles.rosterTier}
                  style={{ backgroundColor: CARD_PALETTE[group.tier].color }}
                >
                  {group.tier}
                </div>
                <div className={styles.rosterName}>
                  <strong>{group.name}</strong>
                  <span>{total - drawn} 張尚未抽出</span>
                </div>
                <div className={styles.rosterCount}>
                  {drawn}/{total}
                </div>
              </div>
            );
          })}
        </div>
        <p className={styles.rosterHint}>拖動卡片可以翻找，直接點卡也能指定抽出。</p>
      </div>
    </div>
  );
}

export function ExhibitionIchibanView() {
  const [deck, setDeck] = useState<PrizeDefinition[]>(() => createPrizeDeck());
  const [sceneKey, setSceneKey] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<PrizeDefinition | null>(null);
  const [drawnIds, setDrawnIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [poolReady, setPoolReady] = useState(false);
  const poolRef = useRef<IchibanPoolHandle | null>(null);
  const remaining = deck.length - drawnIds.length;

  const handlePick = useCallback((prize: PrizeDefinition) => {
    setSelectedPrize(prize);
  }, []);

  const handleDraw = () => {
    if (!poolRef.current?.drawRandom()) return;
  };

  const handleConfirmPrize = () => {
    if (!selectedPrize) return;
    poolRef.current?.removeCard(selectedPrize.id);
    setDrawnIds((current) =>
      current.includes(selectedPrize.id) ? current : [...current, selectedPrize.id],
    );
    setSelectedPrize(null);
  };

  const handleCancelPrize = () => {
    if (!selectedPrize) return;
    poolRef.current?.returnCard(selectedPrize.id);
    setSelectedPrize(null);
  };

  const handleReset = () => {
    setSelectedPrize(null);
    setRosterOpen(false);
    setDrawnIds([]);
    setPoolReady(false);
    setDeck(createPrizeDeck());
    setSceneKey((value) => value + 1);
  };

  return (
    <main className={styles.root}>
      <div className={styles.paperNoise} aria-hidden="true" />
      <header className={styles.header}>
        <Link href={ROUTES.gameExhibition} className={styles.iconButton} aria-label="返回展覽流程">
          <FiArrowLeft />
        </Link>
        <div className={styles.titleBlock}>
          <span>MOMENT EXHIBITION LOTTERY</span>
          <h1>小日獸一番賞</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setRosterOpen(true)}
            aria-label="查看獎項一覽"
          >
            <FiList />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setSoundEnabled((value) => !value)}
            aria-label={soundEnabled ? "關閉音效" : "開啟音效"}
          >
            {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
          </button>
        </div>
      </header>

      <div className={styles.statusPill}>
        <span>REMAINING</span>
        <strong>{remaining}</strong>
        <span>/ {deck.length}</span>
      </div>

      <p className={styles.operationText}>
        {remaining > 0 ? "拖動翻找・點卡抽出" : "今日獎池已全部抽完"}
      </p>

      <section className={styles.poolArea} aria-label="一番賞互動區">
        <ExhibitionIchibanPool
          key={sceneKey}
          ref={poolRef}
          prizes={deck}
          soundEnabled={soundEnabled}
          disabled={Boolean(selectedPrize) || remaining === 0}
          onPick={handlePick}
          onReadyChange={setPoolReady}
        />
        {!poolReady ? (
          <div className={styles.loading}>
            <span />
            <p>正在整理獎池…</p>
          </div>
        ) : null}
        {remaining === 0 ? (
          <div className={styles.emptyState}>
            <span>COMPLETE</span>
            <strong>今天的好運已全數送出</strong>
          </div>
        ) : null}
      </section>

      <div className={styles.controls}>
        <button type="button" className={`${styles.circleButton} ${styles.resetButton}`} onClick={handleReset}>
          <FiRefreshCw />
          <span>重置</span>
        </button>
        <button
          type="button"
          className={`${styles.circleButton} ${styles.shakeButton}`}
          onClick={() => poolRef.current?.shake()}
          disabled={!poolReady || Boolean(selectedPrize) || remaining === 0}
        >
          <span>搖動</span>
        </button>
        <button
          type="button"
          className={`${styles.circleButton} ${styles.drawButton}`}
          onClick={handleDraw}
          disabled={!poolReady || Boolean(selectedPrize) || remaining === 0}
        >
          <small>DRAW</small>
          <span>抽獎</span>
        </button>
      </div>

      {selectedPrize ? (
        <ExhibitionIchibanTearReveal
          prize={selectedPrize}
          soundEnabled={soundEnabled}
          onCancel={handleCancelPrize}
          onConfirm={handleConfirmPrize}
        />
      ) : null}

      {rosterOpen ? (
        <PrizeBoard deck={deck} drawnIds={drawnIds} onClose={() => setRosterOpen(false)} />
      ) : null}
    </main>
  );
}

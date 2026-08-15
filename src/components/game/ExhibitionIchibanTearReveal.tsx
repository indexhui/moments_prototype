"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import styles from "./ExhibitionIchibanView.module.css";

type RevealPrize = {
  id: string;
  tier: string;
  name: string;
  color: string;
  innerColor: string;
};

type RevealStatus = "idle" | "peeling" | "peeled" | "auto" | "torn";

type RevealRuntime = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  baseGroup: THREE.Group;
  flap: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  flapGeometry: THREE.PlaneGeometry;
  originalPositions: Float32Array;
  frameId: number;
  width: number;
  height: number;
  textures: THREE.Texture[];
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
};

const TICKET_WIDTH = 13.4;
const TICKET_HEIGHT = 6.45;
const TICKET_FRAME_WIDTH = TICKET_WIDTH + 0.38;
const TICKET_FRAME_HEIGHT = TICKET_HEIGHT + 0.38;
const TICKET_VIEWPORT_WIDTH_RATIO = 0.84;
const TICKET_VIEWPORT_HEIGHT_RATIO = 0.46;
const OUTLINE_COLOR = "#645246";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTicketCameraDistance(camera: THREE.PerspectiveCamera, width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov) / 2;
  const verticalScale = Math.tan(halfVerticalFov);
  const distanceForWidth =
    TICKET_FRAME_WIDTH / (2 * verticalScale * aspect * TICKET_VIEWPORT_WIDTH_RATIO);
  const distanceForHeight =
    TICKET_FRAME_HEIGHT / (2 * verticalScale * TICKET_VIEWPORT_HEIGHT_RATIO);

  return Math.max(distanceForWidth, distanceForHeight);
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function createCoverTexture(prize: RevealPrize) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 760;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);

  roundedRectPath(context, 30, 30, 1540, 700, 58);
  context.fillStyle = prize.color;
  context.fill();
  context.lineWidth = 34;
  context.strokeStyle = OUTLINE_COLOR;
  context.stroke();

  const wash = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  wash.addColorStop(0, "rgba(255,255,255,0.42)");
  wash.addColorStop(0.52, "rgba(255,255,255,0.06)");
  wash.addColorStop(1, "rgba(80,45,34,0.12)");
  roundedRectPath(context, 50, 50, 1500, 660, 42);
  context.fillStyle = wash;
  context.fill();

  roundedRectPath(context, 188, 178, 1224, 404, 104);
  context.fillStyle = prize.innerColor;
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.58)";
  context.lineWidth = 16;
  context.setLineDash([28, 24]);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = "rgba(255,255,255,0.68)";
  context.font = '900 86px ui-rounded, "Arial Rounded MT Bold", sans-serif';
  context.textAlign = "center";
  context.fillText("PULL TO OPEN", 800, 410);

  for (let index = 0; index < 12; index += 1) {
    const x = 235 + index * 103;
    context.fillStyle = index % 2 === 0 ? "rgba(255,255,255,0.65)" : "rgba(100,70,54,0.16)";
    roundedRectPath(context, x, 123, 54, 20, 10);
    context.fill();
    roundedRectPath(context, x, 617, 54, 20, 10);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function createPrizeTexture(prize: RevealPrize) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 760;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);

  roundedRectPath(context, 30, 30, 1540, 700, 58);
  context.fillStyle = "#2F3030";
  context.fill();
  context.lineWidth = 34;
  context.strokeStyle = OUTLINE_COLOR;
  context.stroke();

  context.fillStyle = prize.color;
  context.fillRect(48, 92, 1504, 126);
  context.fillStyle = "rgba(255,255,255,0.94)";
  context.fillRect(48, 218, 1504, 42);

  context.fillStyle = "#FFF8E9";
  context.font = '900 286px ui-rounded, "Arial Rounded MT Bold", sans-serif';
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(prize.tier, 174, 485);

  context.fillStyle = "rgba(255,248,233,0.76)";
  context.font = '800 42px ui-rounded, "Arial Rounded MT Bold", sans-serif';
  context.fillText("MOMENT PRIZE TICKET", 574, 375);

  const lines = prize.name.length > 12 ? [prize.name.slice(0, 12), prize.name.slice(12)] : [prize.name];
  context.font = '900 68px "PingFang TC", "Noto Sans TC", sans-serif';
  lines.forEach((line, index) => context.fillText(line, 574, 465 + index * 82));

  context.fillStyle = "rgba(255,255,255,0.34)";
  for (let row = 0; row < 3; row += 1) {
    let x = 574;
    for (let segment = 0; segment < 5; segment += 1) {
      const width = 48 + ((row + segment) % 3) * 42;
      roundedRectPath(context, x, 625 + row * 27, width, 12, 6);
      context.fill();
      x += width + 22;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function deformFlap(runtime: RevealRuntime, progress: number, verticalCurl: number) {
  const geometry = runtime.flapGeometry;
  const positions = geometry.attributes.position.array as Float32Array;
  const original = runtime.originalPositions;
  const foldX = -TICKET_WIDTH / 2 + progress * TICKET_WIDTH;
  const radius = 0.78;
  const maxAngle = Math.PI * 0.93;
  const arcLength = radius * maxAngle;

  for (let index = 0; index < original.length; index += 3) {
    const sourceX = original[index];
    const sourceY = original[index + 1];
    const sourceZ = original[index + 2];
    if (sourceX >= foldX) {
      positions[index] = sourceX;
      positions[index + 1] = sourceY;
      positions[index + 2] = sourceZ;
      continue;
    }

    const distance = foldX - sourceX;
    const verticalOffset = distance * verticalCurl;
    if (distance <= arcLength) {
      const angle = distance / radius;
      positions[index] = foldX - radius * Math.sin(angle);
      positions[index + 1] = sourceY + verticalOffset;
      positions[index + 2] = radius - radius * Math.cos(angle) + 0.04;
    } else {
      const extension = distance - arcLength;
      positions[index] = foldX - radius * Math.sin(maxAngle) - extension * Math.cos(maxAngle);
      positions[index + 1] = sourceY + verticalOffset;
      positions[index + 2] =
        radius - radius * Math.cos(maxAngle) + extension * Math.sin(maxAngle) + 0.04;
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function triggerPaperSound(enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !window.AudioContext) return;
  const context = new window.AudioContext();
  const length = Math.ceil(context.sampleRate * 0.24);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const normalized = index / length;
    data[index] = (Math.random() * 2 - 1) * Math.pow(1 - normalized, 1.8);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 1700;
  filter.Q.value = 0.52;
  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
  source.stop(context.currentTime + 0.24);
  window.setTimeout(() => void context.close(), 340);
}

export function ExhibitionIchibanTearReveal({
  prize,
  soundEnabled,
  onCancel,
  onConfirm,
}: {
  prize: RevealPrize;
  soundEnabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<RevealRuntime | null>(null);
  const [status, setStatus] = useState<RevealStatus>("idle");
  const statusRef = useRef<RevealStatus>("idle");
  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const verticalTarget = useRef(0);
  const verticalCurrent = useRef(0);
  const autoTear = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartProgress = useRef(0);
  const pointerMoved = useRef(false);

  const updateStatus = (next: RevealStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  const tear = () => {
    if (statusRef.current === "torn") return;
    updateStatus("torn");
    targetProgress.current = 1;
    triggerPaperSound(soundEnabled);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([22, 28, 18]);
  };

  const handlePrimary = () => {
    if (status === "torn") {
      onConfirm();
      return;
    }
    if (status === "peeled") {
      tear();
      return;
    }
    autoTear.current = true;
    targetProgress.current = 1;
    updateStatus("auto");
    triggerPaperSound(soundEnabled);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (statusRef.current === "torn" || statusRef.current === "auto") return;
    isDragging.current = true;
    pointerMoved.current = false;
    dragStartX.current = event.clientX;
    dragStartY.current = event.clientY;
    dragStartProgress.current = currentProgress.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || statusRef.current === "torn") return;
    const deltaX = event.clientX - dragStartX.current;
    const deltaY = event.clientY - dragStartY.current;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5) pointerMoved.current = true;
    const width = runtimeRef.current?.width ?? window.innerWidth;
    targetProgress.current = clamp(dragStartProgress.current + deltaX / Math.max(width * 0.52, 1), 0, 1);
    currentProgress.current = targetProgress.current;
    verticalTarget.current = clamp(-deltaY / Math.max((runtimeRef.current?.height ?? 700) * 0.55, 1), -0.45, 0.45);
    if (targetProgress.current > 0.025 && statusRef.current === "idle") updateStatus("peeling");
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    verticalTarget.current = 0;
    if (!pointerMoved.current && statusRef.current === "peeled") {
      tear();
      return;
    }
    if (currentProgress.current > 0.31) {
      targetProgress.current = 1;
      updateStatus("peeled");
      triggerPaperSound(soundEnabled);
    } else {
      targetProgress.current = 0;
      updateStatus("idle");
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.replaceChildren();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.1, getTicketCameraDistance(camera, mount.clientWidth, mount.clientHeight));
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(6, 10, 14);
    scene.add(keyLight);

    const baseGroup = new THREE.Group();
    baseGroup.rotation.x = -0.18;
    baseGroup.rotation.z = -0.015;
    baseGroup.position.y = 1.2;
    scene.add(baseGroup);

    const textures: THREE.Texture[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const coverTexture = createCoverTexture(prize);
    const prizeTexture = createPrizeTexture(prize);
    if (coverTexture) textures.push(coverTexture);
    if (prizeTexture) textures.push(prizeTexture);

    const outlineGeometry = new THREE.PlaneGeometry(TICKET_FRAME_WIDTH, TICKET_FRAME_HEIGHT);
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR });
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outline.position.z = -0.07;
    baseGroup.add(outline);
    geometries.push(outlineGeometry);
    materials.push(outlineMaterial);

    const prizeGeometry = new THREE.PlaneGeometry(TICKET_WIDTH, TICKET_HEIGHT);
    const prizeMaterial = new THREE.MeshStandardMaterial({
      map: prizeTexture,
      color: prizeTexture ? 0xffffff : prize.color,
      roughness: 0.88,
      metalness: 0,
    });
    const prizeMesh = new THREE.Mesh(prizeGeometry, prizeMaterial);
    baseGroup.add(prizeMesh);
    geometries.push(prizeGeometry);
    materials.push(prizeMaterial);

    const flapGeometry = new THREE.PlaneGeometry(TICKET_WIDTH, TICKET_HEIGHT, 50, 3);
    const flapMaterial = new THREE.MeshStandardMaterial({
      map: coverTexture,
      color: coverTexture ? 0xffffff : prize.color,
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const flap = new THREE.Mesh(flapGeometry, flapMaterial);
    flap.position.z = 0.055;
    baseGroup.add(flap);
    geometries.push(flapGeometry);
    materials.push(flapMaterial);

    const originalPositions = new Float32Array(flapGeometry.attributes.position.array as Float32Array);
    const runtime: RevealRuntime = {
      renderer,
      scene,
      camera,
      baseGroup,
      flap,
      flapGeometry,
      originalPositions,
      frameId: 0,
      width: mount.clientWidth,
      height: mount.clientHeight,
      textures,
      geometries,
      materials,
    };
    runtimeRef.current = runtime;
    deformFlap(runtime, 0, 0);

    const resize = () => {
      if (!mountRef.current) return;
      runtime.width = mountRef.current.clientWidth;
      runtime.height = mountRef.current.clientHeight;
      camera.aspect = runtime.width / Math.max(runtime.height, 1);
      camera.position.z = getTicketCameraDistance(camera, runtime.width, runtime.height);
      camera.updateProjectionMatrix();
      renderer.setSize(runtime.width, runtime.height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastFrameTime = performance.now();
    let elapsed = 0;
    const animate = (frameTime: number) => {
      runtime.frameId = window.requestAnimationFrame(animate);
      const delta = Math.min(Math.max((frameTime - lastFrameTime) / 1000, 0), 0.05);
      lastFrameTime = frameTime;
      elapsed += delta;
      const ease = statusRef.current === "auto" ? 0.085 : 0.14;
      if (!isDragging.current) {
        currentProgress.current += (targetProgress.current - currentProgress.current) * ease;
      }
      verticalCurrent.current += (verticalTarget.current - verticalCurrent.current) * 0.12;

      if (statusRef.current !== "torn") {
        deformFlap(runtime, currentProgress.current, verticalCurrent.current);
        baseGroup.rotation.y += ((Math.sin(elapsed * 0.9) * 0.022 + currentProgress.current * 0.06) - baseGroup.rotation.y) * 0.06;
        camera.position.x += (currentProgress.current * 2.7 - camera.position.x) * 0.045;
        if (autoTear.current && currentProgress.current > 0.965) {
          autoTear.current = false;
          tear();
        }
      } else {
        baseGroup.position.x += (-18 - baseGroup.position.x) * 0.065;
        flap.position.x += (8.5 - flap.position.x) * 0.08;
        flap.rotation.y += (Math.PI - flap.rotation.y) * 0.085;
        flap.scale.x += (1.12 - flap.scale.x) * 0.08;
        flap.scale.y += (1.12 - flap.scale.y) * 0.08;
        camera.position.x += (0 - camera.position.x) * 0.08;
      }
      renderer.render(scene, camera);
    };
    runtime.frameId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(runtime.frameId);
      runtime.textures.forEach((texture) => texture.dispose());
      runtime.geometries.forEach((geometry) => geometry.dispose());
      runtime.materials.forEach((material) => material.dispose());
      renderer.forceContextLoss();
      renderer.dispose();
      mount.replaceChildren();
      runtimeRef.current = null;
    };
  }, [prize]);

  const primaryLabel = status === "torn" ? "收下結果" : status === "peeled" ? "揭曉" : "撕開";
  const instruction =
    status === "torn"
      ? "今天的相遇，會成為交換日記的新一頁。"
      : status === "peeled"
        ? "再點一下，揭曉你的獎項"
        : "按住獎券往右撕開";

  return (
    <div className={styles.revealOverlay} role="dialog" aria-modal="true" aria-label="撕開獎券">
      <div className={styles.revealTopCopy}>
        <span>{status === "torn" ? "YOU FOUND A MOMENT" : "OPEN YOUR MOMENT"}</span>
        <p>{instruction}</p>
      </div>

      <div
        ref={mountRef}
        className={styles.revealCanvas}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className={`${styles.revealResult} ${status === "torn" ? styles.revealResultVisible : ""}`}>
        <span style={{ backgroundColor: prize.color }}>{prize.tier} 賞</span>
        <strong>{prize.name}</strong>
      </div>

      <div className={styles.revealActions}>
        <button type="button" className={styles.revealSecondary} onClick={onCancel} disabled={status !== "idle"}>
          放回
        </button>
        <button type="button" className={styles.revealPrimary} onClick={handlePrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

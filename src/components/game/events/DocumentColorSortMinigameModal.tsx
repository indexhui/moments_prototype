"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { FiRefreshCw } from "react-icons/fi";
import * as THREE from "three";

type DocumentColor = "red" | "yellow" | "blue" | "green";
type ColorWord = "紅" | "黃" | "藍" | "綠";
type SortDirection = "left" | "right" | "up" | "down";
type SortPhase = "ready" | "playing" | "success" | "game-over";

type DocumentDefinition = {
  id: string;
  paperColor: DocumentColor;
  word?: ColorWord;
  wordInk?: DocumentColor;
  code: string;
  title: string;
};

type SortFeedback = {
  id: number;
  kind: "correct" | "wrong";
  direction: SortDirection;
  releaseX: number;
  releaseY: number;
  message: string;
};

type ThreeSortFrame = {
  document: DocumentDefinition;
  documents: DocumentDefinition[];
  stackCount: number;
  isHolding: boolean;
  gestureX: number;
  gestureY: number;
  feedback: SortFeedback | null;
};

const DOCUMENT_TEMPLATES: DocumentDefinition[] = [
  { id: "mtg-01", paperColor: "red", word: "紅", wordInk: "red", code: "MTG-01", title: "會議議程" },
  { id: "mtg-02", paperColor: "yellow", code: "MTG-02", title: "預算摘要" },
  { id: "mtg-03", paperColor: "blue", word: "綠", wordInk: "green", code: "MTG-03", title: "客戶修訂" },
  { id: "mtg-04", paperColor: "green", word: "綠", wordInk: "green", code: "MTG-04", title: "時程附件" },
  { id: "mtg-05", paperColor: "red", code: "MTG-05", title: "風險清單" },
  { id: "mtg-06", paperColor: "yellow", word: "黃", wordInk: "yellow", code: "MTG-06", title: "報價明細" },
  { id: "mtg-07", paperColor: "blue", word: "紅", wordInk: "red", code: "MTG-07", title: "合約備註" },
  { id: "mtg-08", paperColor: "green", code: "MTG-08", title: "提案索引" },
  { id: "mtg-09", paperColor: "red", word: "紅", wordInk: "red", code: "MTG-09", title: "決議草稿" },
  { id: "mtg-10", paperColor: "yellow", word: "綠", wordInk: "green", code: "MTG-10", title: "簡報附錄" },
  { id: "mtg-11", paperColor: "blue", code: "MTG-11", title: "成本試算" },
  { id: "mtg-12", paperColor: "green", word: "綠", wordInk: "green", code: "MTG-12", title: "法務說明" },
  { id: "mtg-13", paperColor: "red", word: "黃", wordInk: "yellow", code: "MTG-13", title: "確認事項" },
  { id: "mtg-14", paperColor: "yellow", code: "MTG-14", title: "出席名單" },
  { id: "mtg-15", paperColor: "blue", word: "藍", wordInk: "blue", code: "MTG-15", title: "提案摘要" },
  { id: "mtg-16", paperColor: "green", word: "紅", wordInk: "red", code: "MTG-16", title: "決策紀錄" },
];

const TUTORIAL_KEY = "moment:document-color-sort-tutorial-v7";
const RUN_DURATION_MS = 15_000;
const TOTAL_DOCUMENT_COUNT = 40;
const PASS_SCORE = 10;
const TWO_STAR_SCORE = 15;
const THREE_STAR_SCORE = 20;
const SWIPE_THRESHOLD = 52;
const PAPER_STACK_STEP = 0.071;
const PAPER_STACK_BASE_Y = 0.1;
const PAPER_STACK_Z = 5.2;
const PAPER_THICKNESS = 0.05;
const SORT_FLIGHT_MS = 280;
const DOCUMENT_DEPTH_SHEAR = -0.52;
const PAPER_COLOR: Record<DocumentColor, string> = {
  red: "#D77A72",
  yellow: "#E4CA58",
  blue: "#70A9C6",
  green: "#7FAE7B",
};
const PAPER_DARK_COLOR: Record<DocumentColor, string> = {
  red: "#8E3935",
  yellow: "#9A7E16",
  blue: "#376D88",
  green: "#3F7442",
};
const COLOR_FOR_DIRECTION: Record<SortDirection, DocumentColor> = {
  left: "red",
  right: "yellow",
  up: "blue",
  down: "green",
};
const EDGE_COLOR: Record<SortDirection, string> = {
  left: "#C95D52",
  right: "#E7D06A",
  up: "#42A9E7",
  down: "#A9DDA3",
};

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const edgeJudgeFlash = keyframes`
  0% { filter: brightness(1); opacity: 0.72; }
  22% { filter: brightness(1.65); opacity: 1; }
  100% { filter: brightness(1.05); opacity: 1; }
`;

const leftTrayClose = keyframes`
  from { transform: translateX(-104%); }
  to { transform: translateX(0); }
`;

const rightTrayClose = keyframes`
  from { transform: translateX(104%); }
  to { transform: translateX(0); }
`;

const successTextIn = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

function makeDocument(serial: number): DocumentDefinition {
  const template = DOCUMENT_TEMPLATES[serial % DOCUMENT_TEMPLATES.length] ?? DOCUMENT_TEMPLATES[0];
  return {
    ...template,
    id: `${template.id}-${serial}`,
    code: `${template.code}-${String(serial + 1).padStart(2, "0")}`,
  };
}

function createInitialQueue() {
  return Array.from({ length: TOTAL_DOCUMENT_COUNT }, (_, index) => makeDocument(index));
}

function getStarCount(score: number) {
  if (score >= THREE_STAR_SCORE) return 3;
  if (score >= TWO_STAR_SCORE) return 2;
  if (score >= PASS_SCORE) return 1;
  return 0;
}

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createDocumentTexture(document: DocumentDefinition) {
  return makeCanvasTexture(768, 520, (context) => {
    context.fillStyle = PAPER_COLOR[document.paperColor];
    context.fillRect(0, 0, 768, 520);

    const wash = context.createLinearGradient(0, 0, 768, 520);
    wash.addColorStop(0, "rgba(255,255,255,0.42)");
    wash.addColorStop(0.42, "rgba(255,255,255,0.08)");
    wash.addColorStop(1, "rgba(62,42,28,0.12)");
    context.fillStyle = wash;
    context.fillRect(0, 0, 768, 520);

    context.fillStyle = PAPER_DARK_COLOR[document.paperColor];
    context.fillRect(0, 0, 768, 52);

    context.fillStyle = "rgba(255,250,235,0.94)";
    context.font = '800 24px "PingFang TC", "Noto Sans TC", sans-serif';
    context.fillText("CONFIDENTIAL · 明早會議", 30, 35);

    if (document.word && document.wordInk) {
      context.fillStyle = PAPER_DARK_COLOR[document.wordInk];
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = '900 196px "PingFang TC", "Noto Sans TC", sans-serif';
      context.fillText(document.word, 384, 250);
    }

    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "rgba(48,42,35,0.76)";
    context.font = '800 27px "PingFang TC", "Noto Sans TC", sans-serif';
    context.fillText(document.title, 36, 416);
    context.font = '700 20px ui-monospace, "SFMono-Regular", monospace';
    context.fillText(document.code, 36, 455);

    context.fillStyle = "rgba(45,39,33,0.22)";
    for (let index = 0; index < 4; index += 1) {
      context.fillRect(420, 391 + index * 24, 300 - index * 26, 5);
    }

    context.strokeStyle = "rgba(70,49,34,0.4)";
    context.lineWidth = 8;
    context.strokeRect(8, 8, 752, 504);
  });
}

function createDeskTexture() {
  return makeCanvasTexture(1024, 1024, (context) => {
    const base = context.createLinearGradient(0, 0, 1024, 1024);
    base.addColorStop(0, "#D7C39E");
    base.addColorStop(0.52, "#CBAF82");
    base.addColorStop(1, "#B99468");
    context.fillStyle = base;
    context.fillRect(0, 0, 1024, 1024);

    context.lineCap = "round";
    for (let index = 0; index < 18; index += 1) {
      const y = 34 + index * 57;
      context.beginPath();
      context.moveTo(-40, y);
      context.bezierCurveTo(250, y - 9, 610, y + 13, 1064, y - 3);
      context.strokeStyle = index % 3 === 0 ? "rgba(113,76,44,0.16)" : "rgba(255,246,222,0.12)";
      context.lineWidth = index % 3 === 0 ? 3 : 2;
      context.stroke();
    }

    context.strokeStyle = "rgba(105,73,46,0.17)";
    context.lineWidth = 2;
    context.strokeRect(2, 2, 1020, 1020);
  });
}

function disposeThreeObject(object: THREE.Object3D) {
  object.traverse((entry) => {
    const mesh = entry as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    materials.forEach((material) => {
      const materialWithMap = material as THREE.Material & { map?: THREE.Texture | null };
      materialWithMap.map?.dispose();
      material.dispose();
    });
  });
}

function shearDocumentGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.applyMatrix4(
    new THREE.Matrix4().set(
      1, 0, DOCUMENT_DEPTH_SHEAR, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ),
  );
  return geometry;
}

function createDocumentVisual(document: DocumentDefinition) {
  const group = new THREE.Group();
  const thickness = new THREE.Mesh(
    shearDocumentGeometry(new THREE.BoxGeometry(3.05, PAPER_THICKNESS, 2.08)),
    new THREE.MeshStandardMaterial({
      color: PAPER_DARK_COLOR[document.paperColor],
      roughness: 0.78,
    }),
  );
  thickness.castShadow = true;
  group.add(thickness);

  const texture = createDocumentTexture(document);
  if (texture) {
    const faceGeometry = new THREE.PlaneGeometry(3, 2.02);
    faceGeometry.rotateX(-Math.PI / 2);
    shearDocumentGeometry(faceGeometry);
    const face = new THREE.Mesh(
      faceGeometry,
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0 }),
    );
    face.position.y = PAPER_THICKNESS / 2 + 0.002;
    face.castShadow = true;
    group.add(face);
  }
  group.userData.documentId = document.id;
  return group;
}

function ThreeDocumentSortStage({ frame }: { frame: ThreeSortFrame }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(frame);
  const [renderError, setRenderError] = useState(false);
  frameRef.current = frame;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrame = 0;
    let currentDocumentId = "";
    let documentVisual: THREE.Group | null = null;
    let nextDocumentId = "";
    let nextDocumentVisual: THREE.Group | null = null;
    let feedbackId = 0;
    let feedbackStartedAt = 0;
    const waitingPaperMeshes: THREE.Mesh[] = [];
    const waitingPaperTint = new THREE.Color("#F5EEDC");

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#C8C3B8");
      scene.fog = new THREE.Fog("#C8C3B8", 15, 32);

      const camera = new THREE.OrthographicCamera(-5, 5, 6.5, -6.5, 0.1, 80);
      camera.position.set(0, 10.48, 12.2);
      camera.lookAt(0, 0.4, 0.65);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.dataset.threeCanvas = "document-color-sort";
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight("#FFF6DE", "#4E6164", 2.2));
      const keyLight = new THREE.DirectionalLight("#FFF0D0", 4.4);
      keyLight.position.set(7, 12, 8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -8;
      keyLight.shadow.camera.right = 8;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -7;
      keyLight.shadow.bias = -0.0008;
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight("#9EC8CA", 1.55);
      rimLight.position.set(-7, 6, -5);
      scene.add(rimLight);

      const deskTexture = createDeskTexture();
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(10.8, 0.24, 15),
        new THREE.MeshStandardMaterial({
          color: "#FFFFFF",
          map: deskTexture,
          roughness: 0.84,
          metalness: 0.02,
        }),
      );
      desk.position.set(0, -0.12, 2.6);
      desk.receiveShadow = true;
      scene.add(desk);

      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(11, 7, 0.3),
        new THREE.MeshStandardMaterial({ color: "#D8D2C4", roughness: 0.92 }),
      );
      backWall.position.set(0, 3.05, -5.05);
      backWall.receiveShadow = true;
      scene.add(backWall);

      const windowPanel = new THREE.Mesh(
        new THREE.BoxGeometry(8.7, 3.25, 0.14),
        new THREE.MeshStandardMaterial({
          color: "#9FB2AC",
          roughness: 0.36,
          metalness: 0.08,
        }),
      );
      windowPanel.position.set(0, 3.35, -4.82);
      scene.add(windowPanel);

      const windowFrameMaterial = new THREE.MeshStandardMaterial({
        color: "#71847F",
        roughness: 0.52,
        metalness: 0.12,
      });
      const windowFramePieces = [
        { size: [8.95, 0.13, 0.19] as const, position: [0, 4.98, -4.72] as const },
        { size: [8.95, 0.13, 0.19] as const, position: [0, 1.72, -4.72] as const },
        { size: [0.13, 3.38, 0.19] as const, position: [-4.41, 3.35, -4.72] as const },
        { size: [0.13, 3.38, 0.19] as const, position: [4.41, 3.35, -4.72] as const },
        { size: [0.1, 3.24, 0.19] as const, position: [0, 3.35, -4.72] as const },
      ];
      windowFramePieces.forEach(({ size, position }) => {
        const piece = new THREE.Mesh(
          new THREE.BoxGeometry(size[0], size[1], size[2]),
          windowFrameMaterial,
        );
        piece.position.set(position[0], position[1], position[2]);
        piece.castShadow = true;
        scene.add(piece);
      });

      const deskBackLip = new THREE.Mesh(
        new THREE.BoxGeometry(10.8, 0.16, 0.26),
        new THREE.MeshStandardMaterial({ color: "#96724D", roughness: 0.76 }),
      );
      deskBackLip.position.set(0, 0.07, -4.72);
      deskBackLip.castShadow = true;
      scene.add(deskBackLip);

      for (let index = 0; index < TOTAL_DOCUMENT_COUNT - 1; index += 1) {
        const waitingPaperMaterial = new THREE.MeshStandardMaterial({ color: "#D8D1BF", roughness: 0.86 });
        const waitingPaper = new THREE.Mesh(
          shearDocumentGeometry(new THREE.BoxGeometry(3.12, 0.058, 2.12)),
          waitingPaperMaterial,
        );
        waitingPaper.position.set(
          (index % 3 - 1) * 0.055,
          PAPER_STACK_BASE_Y + index * PAPER_STACK_STEP,
          PAPER_STACK_Z + ((index + 1) % 3 - 1) * 0.04,
        );
        waitingPaper.rotation.y = (index % 2 === 0 ? 1 : -1) * 0.018;
        waitingPaper.visible = false;
        waitingPaper.castShadow = true;
        waitingPaper.receiveShadow = true;
        waitingPaperMeshes.push(waitingPaper);
        scene.add(waitingPaper);
      }

      const resize = () => {
        if (!renderer) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        const aspect = width / height;
        const halfHeight = 5.75;
        camera.left = -halfHeight * aspect;
        camera.right = halfHeight * aspect;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const animate = (now: number) => {
        const current = frameRef.current;
        host.dataset.documentGestureX = current.gestureX.toFixed(3);
        host.dataset.documentGestureY = current.gestureY.toFixed(3);
        host.dataset.documentStackCount = String(current.stackCount);
        const activeY = PAPER_STACK_BASE_Y + Math.max(0, current.stackCount - 1) * PAPER_STACK_STEP;
        const nextDocument = current.documents[1];
        const nextY = PAPER_STACK_BASE_Y + Math.max(0, current.stackCount - 2) * PAPER_STACK_STEP;

        if (current.document.id !== currentDocumentId) {
          if (documentVisual) {
            scene.remove(documentVisual);
            disposeThreeObject(documentVisual);
          }
          currentDocumentId = current.document.id;
          documentVisual = createDocumentVisual(current.document);
          documentVisual.position.set(0, activeY, PAPER_STACK_Z);
          scene.add(documentVisual);
        }

        if ((nextDocument?.id ?? "") !== nextDocumentId) {
          if (nextDocumentVisual) {
            scene.remove(nextDocumentVisual);
            disposeThreeObject(nextDocumentVisual);
            nextDocumentVisual = null;
          }
          nextDocumentId = nextDocument?.id ?? "";
          if (nextDocument) {
            nextDocumentVisual = createDocumentVisual(nextDocument);
            scene.add(nextDocumentVisual);
          }
        }

        if (nextDocumentVisual) {
          nextDocumentVisual.position.set(0, nextY + 0.012, PAPER_STACK_Z);
          nextDocumentVisual.rotation.y = 0;
        }

        if (current.feedback?.id !== feedbackId) {
          feedbackId = current.feedback?.id ?? 0;
          feedbackStartedAt = now;
        }

        if (documentVisual) {
          const hover = Math.sin(now * 0.0045) * 0.045;
          documentVisual.position.x = current.gestureX * 2.25;
          documentVisual.position.z = PAPER_STACK_Z + current.gestureY * 1.85;
          documentVisual.position.y = activeY + hover + (current.isHolding ? 0.18 : 0);
          documentVisual.rotation.y = -current.gestureX * 0.012;
          documentVisual.rotation.z = -current.gestureX * 0.026;

          if (current.feedback) {
            const progress = clamp((now - feedbackStartedAt) / SORT_FLIGHT_MS, 0, 1);
            const directionVector = {
              left: { x: -1, z: 0 },
              right: { x: 1, z: 0 },
              up: { x: 0, z: -1 },
              down: { x: 0, z: 1 },
            }[current.feedback.direction];
            const wrongWobble = current.feedback.kind === "wrong"
              ? Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.22
              : 0;
            const startX = current.feedback.releaseX * 2.25;
            const startZ = PAPER_STACK_Z + current.feedback.releaseY * 1.85;
            documentVisual.position.x = startX + directionVector.x * progress * 5.4 + directionVector.z * wrongWobble;
            documentVisual.position.z = startZ + directionVector.z * progress * 4.9 + directionVector.x * wrongWobble;
            documentVisual.position.y = activeY + progress * 0.34;
            documentVisual.rotation.y = directionVector.x * progress * -0.08;
            documentVisual.rotation.z = directionVector.x * progress * -0.14 + wrongWobble * 0.12;
            documentVisual.rotation.x = directionVector.z * progress * 0.12;
            documentVisual.scale.setScalar(1 - progress * 0.12);
          } else {
            documentVisual.scale.setScalar(1);
          }
        }

        waitingPaperMeshes.forEach((paper, index) => {
          const isVisible = index < Math.max(0, current.stackCount - 1);
          const isNextDocument = index === current.stackCount - 2;
          paper.visible = isVisible && !isNextDocument;
          if (!paper.visible) return;
          const documentForLayer = current.documents[current.stackCount - 1 - index];
          if (!documentForLayer) return;
          const material = paper.material as THREE.MeshStandardMaterial;
          material.color
            .set(PAPER_COLOR[documentForLayer.paperColor])
            .lerp(waitingPaperTint, 0.44);
        });

        renderer?.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        disposeThreeObject(scene);
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch (error) {
      console.warn("[DocumentColorSort] Three.js renderer unavailable", error);
      setRenderError(true);
      renderer?.dispose();
      renderer?.domElement.remove();
      return undefined;
    }
  }, []);

  return (
    <Box
      ref={hostRef}
      role="img"
      aria-label="Three.js 斜俯視中央四向文件柱分類場景"
      data-three-document-sort-stage="true"
      position="absolute"
      inset="0"
      overflow="hidden"
    >
      {renderError ? (
        <Flex position="absolute" inset="0" align="center" justify="center" color="#45585B" fontSize="13px" fontWeight="800">
          3D 場景載入失敗，請稍後重新整理再試
        </Flex>
      ) : null}
    </Box>
  );
}

function DirectionEdgeMarker({
  direction,
  aimedDirection,
  feedback,
}: {
  direction: SortDirection;
  aimedDirection: SortDirection | null;
  feedback: SortFeedback | null;
}) {
  const isVertical = direction === "left" || direction === "right";
  const isJudged = feedback?.direction === direction;
  const isWrong = isJudged && feedback.kind === "wrong";
  const isAimed = aimedDirection === direction;

  return (
    <>
      <Box
        data-direction-edge={direction}
        data-edge-state={isWrong ? "wrong" : isJudged ? "correct" : isAimed ? "aimed" : "idle"}
        position="absolute"
        zIndex={18}
        left={direction === "left" ? "0" : direction === "up" || direction === "down" ? "0" : undefined}
        right={direction === "right" ? "0" : direction === "up" || direction === "down" ? "0" : undefined}
        top={direction === "up" ? "0" : direction === "left" || direction === "right" ? "0" : undefined}
        bottom={direction === "down" ? "0" : direction === "left" || direction === "right" ? "0" : undefined}
        w={isVertical ? "8px" : "auto"}
        h={isVertical ? "auto" : "8px"}
        bgColor={isWrong ? "#C63F3A" : EDGE_COLOR[direction]}
        opacity={isJudged || isAimed ? 1 : 0.68}
        boxShadow={
          isWrong
            ? "0 0 0 3px rgba(255,235,222,0.55), 0 0 24px rgba(214,55,48,0.95)"
            : isJudged || isAimed
              ? `0 0 22px ${EDGE_COLOR[direction]}`
              : "none"
        }
        animation={isJudged ? `${edgeJudgeFlash} ${SORT_FLIGHT_MS}ms ease both` : undefined}
        pointerEvents="none"
      />
      {isWrong ? (
        <Flex
          position="absolute"
          zIndex={24}
          left={direction === "left" ? "0" : direction === "up" || direction === "down" ? "50%" : undefined}
          right={direction === "right" ? "0" : undefined}
          top={direction === "up" ? "0" : direction === "left" || direction === "right" ? "50%" : undefined}
          bottom={direction === "down" ? "0" : undefined}
          transform={isVertical ? "translateY(-50%)" : "translateX(-50%)"}
          minW={isVertical ? "66px" : "76px"}
          h="31px"
          px="10px"
          borderRadius={
            direction === "left"
              ? "0 999px 999px 0"
              : direction === "right"
                ? "999px 0 0 999px"
                : direction === "up"
                  ? "0 0 999px 999px"
                  : "999px 999px 0 0"
          }
          bgColor="#A82F2C"
          border="2px solid #FFE1D8"
          color="white"
          align="center"
          justify="center"
          fontSize="13px"
          fontWeight="900"
          letterSpacing="0.08em"
          textShadow="0 1px 3px rgba(70,13,11,0.5)"
          boxShadow="0 0 20px #E05A51"
          animation={`${edgeJudgeFlash} ${SORT_FLIGHT_MS}ms ease both`}
          pointerEvents="none"
        >
          錯誤
        </Flex>
      ) : null}
    </>
  );
}

export function DocumentColorSortMinigameModal({
  onSkip,
  onSolved,
  onComplete,
  title = "重要文件分類",
  successRewardHeading = "同事的請託",
  successRewardLabel = "重要文件分類完成",
  successFootnote = "依文件底色完成四向分流，沒有被標示文字騙到",
}: {
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  title?: string;
  successRewardHeading?: string;
  successRewardLabel?: string | null;
  successFootnote?: string;
}) {
  const activePointerRef = useRef<number | null>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);
  const gestureRef = useRef({ x: 0, y: 0, dx: 0, dy: 0 });
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<DocumentDefinition[]>(createInitialQueue());
  const scoreRef = useRef(0);
  const runStartedAtRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const solvedNotifiedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onSolvedRef = useRef(onSolved);
  const onCompleteRef = useRef(onComplete);

  const [queue, setQueue] = useState<DocumentDefinition[]>(createInitialQueue);
  const [phase, setPhase] = useState<SortPhase>("ready");
  const [isHolding, setIsHolding] = useState(false);
  const [gesture, setGesture] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState<SortFeedback | null>(null);
  const [score, setScore] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeRemainingMs, setTimeRemainingMs] = useState(RUN_DURATION_MS);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const activeDocument = queue[0] ?? makeDocument(0);
  const isInteractionBlocked = phase !== "playing" || Boolean(feedback) || isHintOpen || isTutorialOpen;
  const earnedStars = getStarCount(score);
  const secondsRemaining = Math.max(0, Math.ceil(timeRemainingMs / 1000));
  const aimedDirection: SortDirection | null = isHolding && Math.max(Math.abs(gesture.x), Math.abs(gesture.y)) >= 0.28
    ? Math.abs(gesture.x) >= Math.abs(gesture.y)
      ? gesture.x < 0
        ? "left"
        : "right"
      : gesture.y < 0
        ? "up"
        : "down"
    : null;

  useEffect(() => {
    onSolvedRef.current = onSolved;
  }, [onSolved]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTimers = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const playSortSound = useCallback((correct: boolean) => {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;
    try {
      const context = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startedAt = context.currentTime;
      oscillator.type = correct ? "sine" : "sawtooth";
      oscillator.frequency.setValueAtTime(correct ? 280 : 118, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 520 : 64, startedAt + 0.12);
      gain.gain.setValueAtTime(correct ? 0.09 : 0.07, startedAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.14);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + 0.15);
    } catch {
      // Audio is optional; visual and haptic feedback remain available.
    }
  }, []);

  const completeRun = useCallback((qualified: boolean) => {
    clearTimers();
    setIsHolding(false);
    setGesture({ x: 0, y: 0 });
    setFeedback(null);
    if (!qualified) {
      setPhase("game-over");
      return;
    }
    setPhase("success");
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolvedRef.current?.();
    }
  }, [clearTimers]);

  const startGame = useCallback(() => {
    clearTimers();
    const initialQueue = createInitialQueue();
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    queueRef.current = initialQueue;
    scoreRef.current = 0;
    runStartedAtRef.current = now;
    pauseStartedAtRef.current = null;
    solvedNotifiedRef.current = false;
    activePointerRef.current = null;
    pointerOriginRef.current = null;
    gestureRef.current = { x: 0, y: 0, dx: 0, dy: 0 };
    setQueue(initialQueue);
    setScore(0);
    setMistakeCount(0);
    setStreak(0);
    setTimeRemainingMs(RUN_DURATION_MS);
    setFeedback(null);
    setIsHolding(false);
    setGesture({ x: 0, y: 0 });
    setPhase("playing");
  }, [clearTimers]);

  const resetGame = startGame;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(TUTORIAL_KEY) === "1") {
      startGame();
      return;
    }
    setIsTutorialOpen(true);
  }, [startGame]);

  useEffect(() => {
    if (phase !== "playing" || isHintOpen) return;
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - runStartedAtRef.current;
      const remaining = Math.max(0, RUN_DURATION_MS - elapsed);
      setTimeRemainingMs(remaining);
      if (remaining <= 0) {
        if (feedback) return;
        completeRun(scoreRef.current >= PASS_SCORE);
      }
    }, 80);
    return () => window.clearInterval(interval);
  }, [completeRun, feedback, isHintOpen, phase]);

  useEffect(() => {
    if (phase !== "success") return;
    completionTimerRef.current = setTimeout(() => {
      completionTimerRef.current = null;
      onCompleteRef.current?.();
    }, 4200);
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [phase]);

  useEffect(
    () => () => {
      clearTimers();
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") void context.close();
    },
    [clearTimers],
  );

  const closeTutorial = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(TUTORIAL_KEY, "1");
    setIsTutorialOpen(false);
    startGame();
  }, [startGame]);

  const openHint = useCallback(() => {
    if (phase === "playing") pauseStartedAtRef.current = performance.now();
    setIsHintOpen(true);
  }, [phase]);

  const closeHint = useCallback(() => {
    if (phase === "playing" && pauseStartedAtRef.current !== null) {
      const pausedFor = performance.now() - pauseStartedAtRef.current;
      runStartedAtRef.current += pausedFor;
    }
    pauseStartedAtRef.current = null;
    setIsHintOpen(false);
  }, [phase]);

  const attemptSort = useCallback(
    (direction: SortDirection, releaseX: number, releaseY: number) => {
      if (isInteractionBlocked) return;
      const targetColor = COLOR_FOR_DIRECTION[direction];
      const feedbackId = Date.now();
      if (activeDocument.paperColor !== targetColor) {
        setMistakeCount((count) => count + 1);
        setStreak(0);
        setFeedback({
          id: feedbackId,
          kind: "wrong",
          direction,
          releaseX,
          releaseY,
          message: "錯誤",
        });
        playSortSound(false);
        triggerHaptic([45, 25, 45]);
        transitionTimerRef.current = setTimeout(() => {
          transitionTimerRef.current = null;
          setFeedback(null);
          const next = queueRef.current.slice(1);
          queueRef.current = next;
          setQueue(next);
          if (next.length === 0) completeRun(scoreRef.current >= PASS_SCORE);
        }, SORT_FLIGHT_MS);
        return;
      }

      const nextScore = scoreRef.current + 1;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setStreak((current) => current + 1);
      setFeedback({
        id: feedbackId,
        kind: "correct",
        direction,
        releaseX,
        releaseY,
        message: nextScore === PASS_SCORE ? "通關！" : "正確",
      });
      playSortSound(true);
      triggerHaptic([16, 12, 24]);
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setFeedback(null);
        const next = queueRef.current.slice(1);
        queueRef.current = next;
        setQueue(next);
        if (next.length === 0) completeRun(scoreRef.current >= PASS_SCORE);
      }, SORT_FLIGHT_MS);
    },
    [activeDocument, completeRun, isInteractionBlocked, playSortSound],
  );

  const resetGesture = useCallback(() => {
    activePointerRef.current = null;
    pointerOriginRef.current = null;
    gestureRef.current = { x: 0, y: 0, dx: 0, dy: 0 };
    setIsHolding(false);
    setGesture({ x: 0, y: 0 });
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isInteractionBlocked) return;
    event.preventDefault();
    activePointerRef.current = event.pointerId;
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    gestureRef.current = { x: 0, y: 0, dx: 0, dy: 0 };
    setGesture({ x: 0, y: 0 });
    setIsHolding(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const origin = pointerOriginRef.current;
    if (isInteractionBlocked || activePointerRef.current !== event.pointerId || !origin) return;
    event.preventDefault();
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    const nextGesture = {
      x: clamp(dx / 90, -1, 1),
      y: clamp(dy / 90, -1, 1),
      dx,
      dy,
    };
    gestureRef.current = nextGesture;
    setGesture({ x: nextGesture.x, y: nextGesture.y });
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const completed = gestureRef.current;
    resetGesture();
    const horizontal = Math.abs(completed.dx) >= Math.abs(completed.dy);
    const distance = horizontal ? Math.abs(completed.dx) : Math.abs(completed.dy);
    if (distance < SWIPE_THRESHOLD) return;
    const direction: SortDirection = horizontal
      ? completed.dx < 0
        ? "left"
        : "right"
      : completed.dy < 0
        ? "up"
        : "down";
    attemptSort(direction, completed.x, completed.y);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetGesture();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (isTutorialOpen) {
          closeTutorial();
          return;
        }
        if (isHintOpen) {
          closeHint();
          return;
        }
        onSkip();
        return;
      }
      const directionByKey: Partial<Record<string, SortDirection>> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const direction = directionByKey[event.key];
      if (!direction) return;
      event.preventDefault();
      if (event.repeat || isInteractionBlocked) return;
      attemptSort(
        direction,
        direction === "left" ? -1 : direction === "right" ? 1 : 0,
        direction === "up" ? -1 : direction === "down" ? 1 : 0,
      );
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attemptSort, closeHint, closeTutorial, isHintOpen, isInteractionBlocked, isTutorialOpen, onSkip]);

  return (
    <Flex
      position="absolute"
      inset="0"
      zIndex={70}
      direction="column"
      overflow="hidden"
      bgColor="#D3D4CC"
      backgroundImage="linear-gradient(180deg, #ECEAE0 0%, #C6CECB 100%)"
    >
      <Flex h="58px" flexShrink={0} px="14px" align="center" justify="space-between" zIndex={5}>
        <Flex
          as="button"
          aria-label="重新開始"
          onClick={resetGame}
          w="34px"
          h="34px"
          borderRadius="999px"
          bgColor="rgba(255,251,242,0.94)"
          color="#745338"
          align="center"
          justify="center"
          boxShadow="0 4px 12px rgba(75,52,34,0.15)"
        >
          <FiRefreshCw size={16} />
        </Flex>

        <Flex direction="column" align="center" gap="1px">
          <Text color="#35464A" fontSize="18px" fontWeight="900" lineHeight="1.1">
            {title}
          </Text>
          <Text color="#657479" fontSize="11px" fontWeight="800">
            得分 {score} · {secondsRemaining} 秒 · 剩餘 {queue.length}/{TOTAL_DOCUMENT_COUNT}
          </Text>
        </Flex>

        <Flex gap="7px">
          <Flex
            as="button"
            onClick={openHint}
            minW="48px"
            h="32px"
            px="9px"
            borderRadius="999px"
            bgColor="rgba(61,80,84,0.14)"
            color="#40565A"
            align="center"
            justify="center"
            fontSize="11px"
            fontWeight="800"
          >
            提示
          </Flex>
          <Flex
            as="button"
            onClick={onSkip}
            minW="64px"
            h="32px"
            px="9px"
            borderRadius="999px"
            bgColor="rgba(61,80,84,0.14)"
            color="#40565A"
            align="center"
            justify="center"
            fontSize="11px"
            fontWeight="800"
          >
            稍後再做
          </Flex>
        </Flex>
      </Flex>

      <Flex flex="1" minH="0" px="13px" pb="10px">
        <Box
          position="relative"
          flex="1"
          minH="0"
          p="12px 10px 10px"
          borderRadius="8px 8px 4px 4px"
          bgColor="#68777B"
          border="2px solid #46575C"
          boxShadow="0 12px 26px rgba(45,57,59,0.28), inset 0 1px rgba(255,255,255,0.22)"
          overflow="hidden"
        >
          <Flex
            position="absolute"
            top="2px"
            left="50%"
            zIndex={4}
            transform="translateX(-50%)"
            h="18px"
            px="12px"
            borderRadius="2px"
            bgColor="#ECE9D8"
            border="1px solid #526165"
            color="#45575B"
            align="center"
            fontSize="7px"
            fontWeight="900"
            letterSpacing="0.12em"
          >
            MEETING FILES · 重要文件
          </Flex>

          <Box
            role="button"
            tabIndex={0}
            aria-label="滑動柱頂文件：紅色向左、黃色向右、藍色向上、綠色向下"
            data-document-id={activeDocument.id}
            data-document-paper-color={activeDocument.paperColor}
            data-document-word={activeDocument.word}
            data-document-word-ink={activeDocument.wordInk}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerCancel}
            position="relative"
            w="100%"
            h="100%"
            overflow="hidden"
            border="2px solid #39494C"
            borderRadius="3px"
            bgColor="#C9C7BC"
            boxShadow="inset 0 0 34px rgba(35,45,46,0.3)"
            cursor={isInteractionBlocked ? "default" : isHolding ? "grabbing" : "pointer"}
            touchAction="none"
            outline="none"
            _focusVisible={{ boxShadow: "inset 0 0 0 3px rgba(255,241,163,0.9)" }}
          >
            <ThreeDocumentSortStage
              frame={{
                document: activeDocument,
                documents: queue,
                stackCount: queue.length,
                isHolding,
                gestureX: gesture.x,
                gestureY: gesture.y,
                feedback,
              }}
            />

            {(["left", "right", "up", "down"] as const).map((direction) => (
              <DirectionEdgeMarker
                key={direction}
                direction={direction}
                aimedDirection={aimedDirection}
                feedback={feedback}
              />
            ))}

            <Box
              position="absolute"
              top="38px"
              left="18px"
              right="18px"
              zIndex={20}
              h="4px"
              borderRadius="999px"
              bgColor="rgba(41,54,56,0.32)"
              overflow="hidden"
              pointerEvents="none"
            >
              <Box
                h="100%"
                w={`${(timeRemainingMs / RUN_DURATION_MS) * 100}%`}
                bgColor={secondsRemaining <= 5 ? "#D96359" : "#FFE39A"}
                transition="width 80ms linear, background-color 180ms ease"
              />
            </Box>

            {streak >= 2 && phase === "playing" ? (
              <Flex
                position="absolute"
                top="52px"
                right="14px"
                zIndex={20}
                h="28px"
                px="10px"
                borderRadius="999px"
                bgColor="rgba(255,247,225,0.88)"
                color="#755338"
                align="center"
                fontSize="11px"
                fontWeight="900"
                pointerEvents="none"
              >
                連續正確 ×{streak}
              </Flex>
            ) : null}

            {phase === "game-over" ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={58}
                bgColor="rgba(45,34,28,0.76)"
                align="center"
                justify="center"
                px="24px"
              >
                <Flex
                  w="100%"
                  maxW="286px"
                  borderRadius="14px"
                  bgColor="#FFF7E9"
                  direction="column"
                  align="center"
                  gap="9px"
                  p="20px"
                  boxShadow="0 16px 32px rgba(32,21,14,0.3)"
                  animation={`${fadeUp} 220ms ease both`}
                >
                  <Text color="#65462F" fontSize="20px" fontWeight="900">
                    {queue.length === 0 ? "正確數不足" : "時間到"}
                  </Text>
                  <Text color="#8A674D" fontSize="13px" lineHeight="1.6" textAlign="center">
                    已處理 {TOTAL_DOCUMENT_COUNT - queue.length} 份，其中正確 {score} 份。15 秒內至少正確分類 {PASS_SCORE} 份即可通關。
                  </Text>
                  <Flex gap="9px" mt="4px">
                    <Flex
                      as="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSkip();
                      }}
                      h="38px"
                      px="15px"
                      borderRadius="999px"
                      bgColor="#E9DDCD"
                      color="#76583F"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight="800"
                    >
                      稍後再做
                    </Flex>
                    <Flex
                      as="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        startGame();
                      }}
                      h="38px"
                      px="18px"
                      borderRadius="999px"
                      bgColor="#8A5D39"
                      color="white"
                      align="center"
                      justify="center"
                      fontSize="12px"
                      fontWeight="900"
                    >
                      再試一次
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            ) : null}

            {phase === "success" ? (
              <Flex position="absolute" inset="0" zIndex={60} pointerEvents="none">
                <Box
                  position="absolute"
                  insetY="0"
                  left="0"
                  w="50.4%"
                  bg="linear-gradient(180deg, #64777A, #455C60)"
                  borderRight="3px solid #4D3231"
                  boxShadow="inset -8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${leftTrayClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
                />
                <Box
                  position="absolute"
                  insetY="0"
                  right="0"
                  w="50.4%"
                  bg="linear-gradient(180deg, #64777A, #455C60)"
                  borderLeft="3px solid #5E5226"
                  boxShadow="inset 8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${rightTrayClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
                />
                <Flex
                  position="absolute"
                  inset="0"
                  direction="column"
                  align="center"
                  justify="center"
                  gap="7px"
                  px="26px"
                  opacity={0}
                  animation={`${successTextIn} 300ms ease 860ms both`}
                >
                  <Text color="#FFF7E8" fontSize="24px" fontWeight="900" textShadow="0 2px 6px rgba(52,34,22,0.35)">
                    分類完成！
                  </Text>
                  <Flex aria-label={`${earnedStars} 顆星`} gap="5px" mb="1px">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Text
                        key={`result-star-${index}`}
                        color={index < earnedStars ? "#FFD66B" : "rgba(255,255,255,0.24)"}
                        fontSize="25px"
                        lineHeight="1"
                      >
                        ★
                      </Text>
                    ))}
                  </Flex>
                  <Text color="#FFF7E8" fontSize="12px" fontWeight="800">
                    正確 {score} · 錯誤 {mistakeCount} · 已處理 {TOTAL_DOCUMENT_COUNT - queue.length}/{TOTAL_DOCUMENT_COUNT}
                  </Text>
                  {successRewardLabel !== null ? (
                    <>
                      <Text color="#E8E1D2" fontSize="13px" fontWeight="800">
                        {successRewardHeading}
                      </Text>
                      <Text color="white" fontSize="17px" fontWeight="900">
                        {successRewardLabel}
                      </Text>
                    </>
                  ) : null}
                  {successFootnote ? (
                    <Text maxW="270px" color="rgba(255,247,232,0.86)" fontSize="11px" lineHeight="1.55" fontWeight="700" textAlign="center">
                      {successFootnote}
                    </Text>
                  ) : null}
                </Flex>
              </Flex>
            ) : null}
          </Box>
        </Box>
      </Flex>

      <Flex h="74px" flexShrink={0} px="22px" pb="14px" align="center" justify="center">
        <Flex
          w="100%"
          h="44px"
          px="14px"
          borderRadius="12px"
          bgColor="rgba(255,251,242,0.72)"
          border="1px solid rgba(75,87,88,0.18)"
          color="#4C5E60"
          align="center"
          justify="center"
          textAlign="center"
          fontSize="12px"
          lineHeight="1.45"
          fontWeight="900"
        >
          {TOTAL_DOCUMENT_COUNT} 份開場｜往四邊滑出｜{PASS_SCORE} 份正確通關
        </Flex>
      </Flex>

      {isHintOpen ? (
        <Flex position="absolute" inset="0" zIndex={100} bgColor="rgba(49,33,23,0.52)" align="center" justify="center" p="24px">
          <Flex w="100%" maxW="300px" borderRadius="14px" bgColor="#FFF7E9" direction="column" p="20px" gap="12px" boxShadow="0 16px 34px rgba(34,22,14,0.3)" animation={`${fadeUp} 220ms ease both`}>
            <Text color="#65462F" fontSize="19px" fontWeight="900">
              分類提示
            </Text>
            <Text color="#7D5C43" fontSize="14px" lineHeight="1.7">
              唯一判斷依據是紙張底色。文件可能沒有中央大字；有字時可能與底色一致，也可能造成干擾。
            </Text>
            <Text color="#7D5C43" fontSize="13px" lineHeight="1.65">
              紅色往左、黃色往右、藍色往上、綠色往下。開場共有 {TOTAL_DOCUMENT_COUNT} 份，無論對錯每滑出一份，文件柱就會少一層，不會再補進新文件。
            </Text>
            <Flex justify="flex-end">
              <Flex as="button" onClick={closeHint} h="36px" px="18px" borderRadius="999px" bgColor="#845839" color="white" align="center" justify="center" fontSize="12px" fontWeight="900">
                知道了
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}

      {isTutorialOpen ? (
        <Flex position="absolute" inset="0" zIndex={110} bgColor="rgba(49,33,23,0.56)" align="center" justify="center" p="22px">
          <Flex w="100%" maxW="312px" borderRadius="16px" overflow="hidden" bgColor="#FFF7E9" boxShadow="0 18px 36px rgba(33,21,14,0.34)" direction="column" animation={`${fadeUp} 240ms ease both`}>
            <Flex h="164px" position="relative" bg="linear-gradient(145deg, #798688, #CBD0C8)" overflow="hidden" align="center" justify="center">
              <Box position="absolute" insetY="0" left="0" w="7px" bgColor={EDGE_COLOR.left} />
              <Box position="absolute" insetY="0" right="0" w="7px" bgColor={EDGE_COLOR.right} />
              <Box position="absolute" insetX="0" top="0" h="7px" bgColor={EDGE_COLOR.up} />
              <Box position="absolute" insetX="0" bottom="0" h="7px" bgColor={EDGE_COLOR.down} />
              <Box position="absolute" left="90px" top="34px" w="132px" h="96px" borderRadius="4px" bgColor={PAPER_COLOR.yellow} border="4px solid #8D7724" transform="rotate(-4deg)" boxShadow="0 12px 22px rgba(40,31,23,0.28)">
                <Text color="#A52F2E" fontSize="60px" fontWeight="900" lineHeight="108px" textAlign="center">
                  紅
                </Text>
              </Box>
              <Text position="absolute" left="7px" top="72px" color="#FFF7ED" bgColor="rgba(44,52,53,0.78)" px="7px" py="3px" borderRadius="0 999px 999px 0" fontSize="13px" fontWeight="900">← 紅</Text>
              <Text position="absolute" right="7px" top="72px" color="#FFF7ED" bgColor="rgba(44,52,53,0.78)" px="7px" py="3px" borderRadius="999px 0 0 999px" fontSize="13px" fontWeight="900">黃 →</Text>
              <Text position="absolute" left="50%" top="7px" transform="translateX(-50%)" color="#FFF7ED" bgColor="rgba(44,52,53,0.78)" px="8px" py="3px" borderRadius="0 0 999px 999px" fontSize="13px" fontWeight="900">↑ 藍</Text>
              <Text position="absolute" left="50%" bottom="7px" transform="translateX(-50%)" color="#FFF7ED" bgColor="rgba(44,52,53,0.78)" px="8px" py="3px" borderRadius="999px 999px 0 0" fontSize="13px" fontWeight="900">綠 ↓</Text>
            </Flex>
            <Flex p="19px" direction="column" gap="10px">
              <Text color="#60422D" fontSize="20px" fontWeight="900">
                一個動作，四向分類
              </Text>
              <Text color="#7A5941" fontSize="13px" lineHeight="1.65">
                這張文件底色是黃色，所以答案是黃色。其他文件可能沒有大字、文字與底色相同，或像這張一樣產生干擾。
              </Text>
              <Text color="#7A5941" fontSize="13px" lineHeight="1.65">
                你有 15 秒處理眼前這一大疊。每滑出一份，文件柱就會少一層；滑錯仍會送出，但只在該側顯示「錯誤」、不加分並中斷連擊。
              </Text>
              <Flex justify="flex-end" mt="4px">
                <Flex as="button" onClick={closeTutorial} h="38px" px="20px" borderRadius="999px" bgColor="#845839" color="white" align="center" justify="center" fontSize="13px" fontWeight="900">
                  開始分類
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
}

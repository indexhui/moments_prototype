"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import * as THREE from "three";
import { playGameSfx } from "@/lib/game/soundEffects";
import type { ExhibitionLocale } from "@/lib/game/exhibitionI18n";
import {
  type CabinetBoxMotionVariant,
} from "@/lib/game/cabinetBoxMotion";

type BoxPattern = "diagonal" | "checker" | "dots" | "chevron" | "waves" | "diamonds" | "grid";
type BoxArtVariant = "A" | "B" | "C";

type BoxDefinition = {
  id: string;
  pattern: BoxPattern;
  artVariant?: BoxArtVariant;
  color: string;
  topColor: string;
  sideColor: string;
  edgeColor: string;
  tapeColor: string;
};

type MoveAxis = "x" | "z";
type MotionPosition = { x: number; z: number };
type TowerPhase = "preparing" | "moving" | "placing" | "miss" | "game-over" | "success";

export type CabinetBoxStackVariant = "archive" | "dispatch";
type CabinetBoxMotionMode = "classic" | CabinetBoxMotionVariant;

type TowerBlock = {
  id: string;
  definition: BoxDefinition;
  width: number;
  depth: number;
  x: number;
  z: number;
  level: number;
  isBase?: boolean;
  rotationQuarterTurns?: number;
  wasWrongWayCorrected?: boolean;
  stickerBomb?: boolean;
};

type ActiveTowerBlock = TowerBlock & {
  axis: MoveAxis;
  definitionIndex: number;
};

type FallingPiece = TowerBlock & {
  direction: -1 | 1;
  axis: MoveAxis;
};

type PlacementEffect = {
  id: number;
  blockId: string;
  x: number;
  z: number;
  level: number;
  perfect: boolean;
};

type PlacementCue = {
  id: number;
  text: string;
  tone: "perfect" | "halfway" | "danger";
};

const START_WIDTH = 164;
const START_DEPTH = 96;
const PASS_LAYER_COUNT = 7;
const TWO_STAR_LAYER_COUNT = 10;
const THREE_STAR_LAYER_COUNT = 14;
const DISPATCH_LAYER_COUNT = 9;
const DISPATCH_BATCH_SIZE = 3;
const TOWER_SCROLL_START_LAYER = 8;
const SPEED_STEP_PER_LAYER = 0.18;
const PERFECT_TOLERANCE = 6;
const FAILURE_OVERLAP_EPSILON = 0.5;
const BOX_STACKING_ART_ROOT = "/images/minigame/box_stacking";
const BOX_STACKING_BACKGROUND_URL = `${BOX_STACKING_ART_ROOT}/BoxStacking_BG.png`;
const BOX_STACKING_BACKGROUND_TILE_URL = `${BOX_STACKING_ART_ROOT}/BoxStacking_BG_Tile.png`;
const BOX_STACKING_LABEL_URL = `${BOX_STACKING_ART_ROOT}/label.png`;
const BOX_STACKING_TOP_BANNER_URL = "/images/minigame/flyer_chase/top_banner_normal.png";
const BOX_STACKING_TOP_BANNER_LINE_URL = "/images/minigame/flyer_chase/top_banner_line.png";
const GOLDEN_RETRIEVER_STICKER_URL = "/slot/golden.png";
const BOX_LABEL_SOURCE_HEIGHT = 2554;
const BOX_LABEL_CROP_TOP = 1522;
const BOX_LABEL_CROP_HEIGHT = 587;
const BOX_ART_TEXTURE_REPEAT_SCALE = 0.68;
const BOX_LABEL_TEXTURE_REPEAT_SCALE = 0.3;
const BOX_STACKING_BACKGROUND_SOURCE_WIDTH = 786;
const BOX_STACKING_PLATFORM_CENTER_FROM_BOTTOM = 270.25;

const BOXES: BoxDefinition[] = [
  {
    id: "archive-a",
    pattern: "diagonal",
    artVariant: "A",
    color: "#C99A61",
    topColor: "#E5BD83",
    sideColor: "#9A6B3E",
    edgeColor: "#765236",
    tapeColor: "#4F7780",
  },
  {
    id: "archive-b",
    pattern: "checker",
    artVariant: "B",
    color: "#D2A369",
    topColor: "#EDC78E",
    sideColor: "#A27648",
    edgeColor: "#79583A",
    tapeColor: "#68805A",
  },
  {
    id: "receipts",
    pattern: "dots",
    artVariant: "C",
    color: "#BF9168",
    topColor: "#DDB58F",
    sideColor: "#8E6349",
    edgeColor: "#704D3A",
    tapeColor: "#9A5B52",
  },
  {
    id: "meeting",
    pattern: "chevron",
    artVariant: "A",
    color: "#CDA273",
    topColor: "#E7C294",
    sideColor: "#987046",
    edgeColor: "#73563C",
    tapeColor: "#596F8C",
  },
  {
    id: "samples",
    pattern: "waves",
    artVariant: "B",
    color: "#BF9778",
    topColor: "#DBB79C",
    sideColor: "#8B6650",
    edgeColor: "#6F5040",
    tapeColor: "#87658A",
  },
  {
    id: "stationery",
    pattern: "diamonds",
    artVariant: "C",
    color: "#D2A368",
    topColor: "#EDC88F",
    sideColor: "#9E7042",
    edgeColor: "#765438",
    tapeColor: "#A66B45",
  },
];

const BASE_DEFINITION: BoxDefinition = {
  id: "cabinet-shelf",
  pattern: "grid",
  color: "#68797C",
  topColor: "#AEB8B6",
  sideColor: "#4A5C60",
  edgeColor: "#35474B",
  tapeColor: "#7D8B8C",
};

const BASE_BLOCK: TowerBlock = {
  id: "cabinet-shelf-base",
  definition: BASE_DEFINITION,
  width: START_WIDTH,
  depth: START_DEPTH,
  x: 0,
  z: 0,
  level: 0,
  isBase: true,
};

type BoxTextureFace = "front" | "side" | "top";

function getBoxArtFaceUrl(variant: BoxArtVariant, face: BoxTextureFace) {
  const faceIndex = face === "front" ? "01" : face === "side" ? "02" : "03";
  return `${BOX_STACKING_ART_ROOT}/Box_Variant_${variant}_${faceIndex}.png`;
}

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const placementCuePop = keyframes`
  0% { opacity: 0; transform: translate(-50%, 12px) scale(0.82); }
  24% { opacity: 1; transform: translate(-50%, 0) scale(1.08); }
  68% { opacity: 1; transform: translate(-50%, -4px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -20px) scale(0.96); }
`;

const sceneKick = keyframes`
  0% { transform: translateY(0); }
  18% { transform: translateY(4px); }
  42% { transform: translateY(-2px); }
  70% { transform: translateY(1px); }
  100% { transform: translateY(0); }
`;

const leftDoorClose = keyframes`
  from { transform: translateX(-104%); }
  to { transform: translateX(0); }
`;

const rightDoorClose = keyframes`
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

function getStarCount(layerCount: number) {
  if (layerCount >= THREE_STAR_LAYER_COUNT) return 3;
  if (layerCount >= TWO_STAR_LAYER_COUNT) return 2;
  if (layerCount >= PASS_LAYER_COUNT) return 1;
  return 0;
}

function isBlockTurnedSideways(block: TowerBlock) {
  return Math.abs(block.rotationQuarterTurns ?? 0) % 2 === 1;
}

function getBlockFootprint(block: TowerBlock) {
  return isBlockTurnedSideways(block)
    ? { width: block.depth, depth: block.width }
    : { width: block.width, depth: block.depth };
}

function getLocalDimensionsFromFootprint(
  footprint: { width: number; depth: number },
  rotationQuarterTurns: number,
) {
  return Math.abs(rotationQuarterTurns) % 2 === 1
    ? { width: footprint.depth, depth: footprint.width }
    : footprint;
}

function getCornerTurnPosition({
  progress,
  definitionIndex,
  rangeX,
  rangeZ,
}: {
  progress: number;
  definitionIndex: number;
  rangeX: number;
  rangeZ: number;
}): { position: MotionPosition; axis: MoveAxis; turnProgress: number } {
  const horizontalFirst = definitionIndex % 2 === 0;
  const entrySign = definitionIndex % 4 < 2 ? -1 : 1;
  const exitSign = definitionIndex % 4 === 0 || definitionIndex % 4 === 3 ? 1 : -1;
  const firstRange = horizontalFirst ? rangeX : rangeZ;
  const secondRange = horizontalFirst ? rangeZ : rangeX;
  const turnProgress = firstRange / (firstRange + secondRange);

  if (progress <= turnProgress) {
    const localProgress = progress / turnProgress;
    const firstOffset = entrySign * firstRange * (1 - localProgress);
    return {
      position: horizontalFirst
        ? { x: firstOffset, z: 0 }
        : { x: 0, z: firstOffset },
      axis: horizontalFirst ? "x" : "z",
      turnProgress,
    };
  }

  const localProgress = (progress - turnProgress) / (1 - turnProgress);
  const secondOffset = exitSign * secondRange * localProgress;
  return {
    position: horizontalFirst
      ? { x: 0, z: secondOffset }
      : { x: secondOffset, z: 0 },
    axis: horizontalFirst ? "z" : "x",
    turnProgress,
  };
}

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

const THREE_WORLD_SCALE = 0.025;
const THREE_BOX_HEIGHT = 1.15;
const THREE_BASE_HEIGHT = 0.42;
const THREE_TOWER_ORIGIN_X = -0.166;
const THREE_TOWER_ORIGIN_Z = 0.166;
const THREE_BASE_CAMERA_TARGET_Y = 5.28;
const THREE_CAMERA_HALF_WIDTH = 3.32;
const THREE_ISOMETRIC_Y_SCREEN_FACTOR = 2 / Math.sqrt(6);

type ThreeBlockRole = "base" | "placed" | "active" | "falling";

type ThreeTowerFrame = {
  placedBlocks: TowerBlock[];
  activeBlock: TowerBlock | null;
  activeAxis: MoveAxis;
  fallingPiece: FallingPiece | null;
  placementEffect: PlacementEffect | null;
  completedCount: number;
};

type ThreeBlockVisual = {
  group: THREE.Group;
  createdAt: number;
  role: ThreeBlockRole;
};

type BoxArtTextureCache = Map<string, THREE.Texture>;

function makeBoxArtTexture(
  definition: BoxDefinition,
  face: BoxTextureFace,
  repeatX: number,
  repeatY: number,
  textureCache: BoxArtTextureCache,
) {
  if (!definition.artVariant) return null;
  const sourceTexture = textureCache.get(getBoxArtFaceUrl(definition.artVariant, face));
  if (!sourceTexture) return null;
  const texture = sourceTexture.clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(
    Math.max(0.18, repeatX * BOX_ART_TEXTURE_REPEAT_SCALE),
    Math.max(0.18, repeatY * BOX_ART_TEXTURE_REPEAT_SCALE),
  );
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
  texture.needsUpdate = true;
  return texture;
}

function makeBoxLabelTexture(repeatX: number, textureCache: BoxArtTextureCache) {
  const sourceTexture = textureCache.get(BOX_STACKING_LABEL_URL);
  if (!sourceTexture) return null;
  const texture = sourceTexture.clone();
  const cropHeight = BOX_LABEL_CROP_HEIGHT / BOX_LABEL_SOURCE_HEIGHT;
  const cropBottom =
    1 - (BOX_LABEL_CROP_TOP + BOX_LABEL_CROP_HEIGHT) / BOX_LABEL_SOURCE_HEIGHT;
  const scaledCropHeight = cropHeight * BOX_LABEL_TEXTURE_REPEAT_SCALE;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.repeat.set(
    Math.max(0.18, repeatX * BOX_LABEL_TEXTURE_REPEAT_SCALE),
    scaledCropHeight,
  );
  texture.offset.set(
    (1 - texture.repeat.x) / 2,
    cropBottom + (cropHeight - scaledCropHeight) / 2,
  );
  texture.needsUpdate = true;
  return texture;
}

function makeGoldenRetrieverStickerTexture(textureCache: BoxArtTextureCache) {
  const sourceTexture = textureCache.get(GOLDEN_RETRIEVER_STICKER_URL);
  if (!sourceTexture) return null;
  const texture = sourceTexture.clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function disposeThreeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const renderable = object as THREE.Mesh | THREE.LineSegments;
    renderable.geometry?.dispose();
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material
        ? [renderable.material]
        : [];
    materials.forEach((material) => {
      if ("map" in material) {
        (material as THREE.MeshStandardMaterial).map?.dispose();
      }
      material.dispose();
    });
  });
}

function createThreeBlockVisual(
  block: TowerBlock,
  role: ThreeBlockRole,
  textureCache: BoxArtTextureCache,
  showCharacterStickers: boolean,
) {
  const group = new THREE.Group();
  const width = block.width * THREE_WORLD_SCALE;
  const depth = block.depth * THREE_WORLD_SCALE;
  const height = block.isBase ? THREE_BASE_HEIGHT : THREE_BOX_HEIGHT;

  if (block.isBase) {
    // The illustrated background already includes the starting platform.
  } else {
    const widthRatio = Math.max(0.18, block.width / START_WIDTH);
    const depthRatio = Math.max(0.18, block.depth / START_DEPTH);
    const frontTexture = makeBoxArtTexture(
      block.definition,
      "front",
      widthRatio,
      1,
      textureCache,
    );
    const sideTexture = makeBoxArtTexture(
      block.definition,
      "side",
      depthRatio,
      1,
      textureCache,
    );
    const topTexture = makeBoxArtTexture(
      block.definition,
      "top",
      widthRatio,
      depthRatio,
      textureCache,
    );
    const sideMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      map: sideTexture,
      toneMapped: false,
    });
    const frontMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      map: frontTexture,
      toneMapped: false,
    });
    const topMaterial = new THREE.MeshBasicMaterial({
      color: "#FFFFFF",
      map: topTexture,
      toneMapped: false,
    });
    const bottomMaterial = new THREE.MeshBasicMaterial({
      color: block.definition.edgeColor,
      toneMapped: false,
    });
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(bodyGeometry, [
      sideMaterial,
      sideMaterial.clone(),
      topMaterial,
      bottomMaterial,
      frontMaterial,
      sideMaterial.clone(),
    ]);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.8, height * 0.64),
      new THREE.MeshBasicMaterial({
        map: makeBoxLabelTexture(widthRatio, textureCache),
        transparent: true,
        alphaTest: 0.03,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    label.position.set(0, -height * 0.015, depth / 2 + 0.008);
    label.renderOrder = 2;
    group.add(label);

    if (showCharacterStickers && block.level % 4 === 3) {
      const stickerSize = Math.min(height * 0.58, width * 0.24);
      const sticker = new THREE.Mesh(
        new THREE.PlaneGeometry(stickerSize, stickerSize),
        new THREE.MeshBasicMaterial({
          map: makeGoldenRetrieverStickerTexture(textureCache),
          transparent: true,
          alphaTest: 0.04,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      sticker.name = "golden-retriever-sticker";
      sticker.position.set(width * 0.27, height * 0.08, depth / 2 + 0.012);
      sticker.rotation.z = block.level % 8 === 3 ? -0.12 : 0.1;
      sticker.renderOrder = 3;
      group.add(sticker);
    }

    if (block.stickerBomb) {
      const stickerSize = Math.min(height * 0.31, width * 0.12, depth * 0.22);
      const makeSticker = () => {
        const sticker = new THREE.Mesh(
          new THREE.PlaneGeometry(stickerSize, stickerSize),
          new THREE.MeshBasicMaterial({
            map: makeGoldenRetrieverStickerTexture(textureCache),
            transparent: true,
            alphaTest: 0.04,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        sticker.renderOrder = 4;
        return sticker;
      };

      [-0.3, 0, 0.3].forEach((xRatio, columnIndex) => {
        [-0.2, 0.2].forEach((yRatio, rowIndex) => {
          const sticker = makeSticker();
          sticker.position.set(
            width * xRatio,
            height * yRatio,
            depth / 2 + 0.018,
          );
          sticker.rotation.z = (columnIndex - rowIndex) * 0.12 - 0.08;
          group.add(sticker);
        });
      });

      [-0.24, 0.24].forEach((xRatio, columnIndex) => {
        [-0.2, 0.2].forEach((zRatio, rowIndex) => {
          const sticker = makeSticker();
          sticker.position.set(
            width * xRatio,
            height / 2 + 0.072,
            depth * zRatio,
          );
          sticker.rotation.x = -Math.PI / 2;
          sticker.rotation.z = (columnIndex + rowIndex) * 0.13 - 0.12;
          group.add(sticker);
        });
      });

      [-0.2, 0.2].forEach((yRatio, rowIndex) => {
        [-0.22, 0.22].forEach((zRatio, columnIndex) => {
          const sticker = makeSticker();
          sticker.position.set(
            width / 2 + 0.018,
            height * yRatio,
            depth * zRatio,
          );
          sticker.rotation.y = Math.PI / 2;
          sticker.rotation.z = (rowIndex - columnIndex) * 0.11 + 0.05;
          group.add(sticker);
        });
      });
    }

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.96, 0.055, depth * 0.96),
      new THREE.MeshBasicMaterial({
        color: "#FFFFFF",
        map: topTexture,
        toneMapped: false,
      }),
    );
    lid.position.y = height / 2 + 0.035;
    lid.castShadow = true;
    group.add(lid);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeometry, 18),
      new THREE.LineBasicMaterial({
        color: block.definition.edgeColor,
        transparent: true,
        opacity: role === "active" ? 0.86 : 0.62,
        toneMapped: false,
      }),
    );
    group.add(edges);
  }

  group.userData.blockId = block.id;
  group.userData.role = role;
  group.rotation.y = (block.rotationQuarterTurns ?? 0) * (Math.PI / 2);
  return group;
}

function getThreeBlockY(block: TowerBlock) {
  if (block.isBase) return THREE_BASE_HEIGHT / 2;
  return THREE_BASE_HEIGHT + (block.level - 0.5) * THREE_BOX_HEIGHT;
}

function ThreeIsometricTower({
  locale = "zh",
  frame,
  showCharacterStickers = true,
}: {
  locale?: ExhibitionLocale;
  frame: ThreeTowerFrame;
  showCharacterStickers?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(frame);
  const [renderError, setRenderError] = useState(false);
  const accessibilityCopy = {
    zh: {
      scene: "Three.js 等角投影辦公紙箱堆疊場景",
      error: "3D 場景載入失敗，請重新整理",
    },
    ja: {
      scene: "Three.jsで描画された、オフィスの箱を積み上げるアイソメトリックシーン",
      error: "3Dシーンを読み込めませんでした。再読み込みしてください",
    },
    en: {
      scene: "Three.js isometric office box-stacking scene",
      error: "The 3D scene failed to load. Please refresh the page.",
    },
  }[locale];
  frameRef.current = frame;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let animationFrame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let impactRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial> | null = null;
    let impactStartedAt = 0;
    let impactId: number | null = null;
    let texturesReady = false;
    let isDisposed = false;
    const visuals = new Map<string, ThreeBlockVisual>();
    const textureCache: BoxArtTextureCache = new Map();

    try {
      const scene = new THREE.Scene();

      const camera = new THREE.OrthographicCamera(-4, 4, 6, -6, 0.1, 80);
      let responsiveBaseCameraTargetY = THREE_BASE_CAMERA_TARGET_Y;
      let cameraTargetY = responsiveBaseCameraTargetY;

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.dataset.threeCanvas = "isometric-cabinet";
      host.appendChild(renderer.domElement);

      const textureLoader = new THREE.TextureLoader();
      const textureUrls = [
        ...(["A", "B", "C"] as const).flatMap((variant) =>
          (["front", "side", "top"] as const).map((face) =>
            getBoxArtFaceUrl(variant, face),
          ),
        ),
        BOX_STACKING_LABEL_URL,
        GOLDEN_RETRIEVER_STICKER_URL,
      ];
      void Promise.all(
        textureUrls.map(
          (url) =>
            new Promise<void>((resolve) => {
              textureLoader.load(
                url,
                (texture) => {
                  if (isDisposed) {
                    texture.dispose();
                    resolve();
                    return;
                  }
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.anisotropy = 4;
                  texture.wrapS = THREE.ClampToEdgeWrapping;
                  texture.wrapT = THREE.ClampToEdgeWrapping;
                  textureCache.set(url, texture);
                  resolve();
                },
                undefined,
                () => resolve(),
              );
            }),
        ),
      ).then(() => {
        if (!isDisposed) texturesReady = true;
      });

      const hemisphere = new THREE.HemisphereLight("#FFF7DF", "#536466", 2.3);
      scene.add(hemisphere);
      const keyLight = new THREE.DirectionalLight("#FFF0CF", 4.6);
      keyLight.position.set(7, 13, 9);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -9;
      keyLight.shadow.camera.right = 9;
      keyLight.shadow.camera.top = 18;
      keyLight.shadow.camera.bottom = -4;
      keyLight.shadow.bias = -0.0008;
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight("#9BC0C2", 1.7);
      rimLight.position.set(-8, 7, -4);
      scene.add(rimLight);

      const resize = () => {
        if (!renderer) return;
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        const aspect = width / height;
        const halfHeight = THREE_CAMERA_HALF_WIDTH / aspect;
        const previousBaseCameraTargetY = responsiveBaseCameraTargetY;
        const projectedWorldPixels = width / (THREE_CAMERA_HALF_WIDTH * 2);
        const backgroundScale = width / BOX_STACKING_BACKGROUND_SOURCE_WIDTH;
        const platformCenterY =
          height - BOX_STACKING_PLATFORM_CENTER_FROM_BOTTOM * backgroundScale;
        responsiveBaseCameraTargetY =
          THREE_BASE_HEIGHT +
          (platformCenterY - height / 2) /
            (projectedWorldPixels * THREE_ISOMETRIC_Y_SCREEN_FACTOR);
        cameraTargetY += responsiveBaseCameraTargetY - previousBaseCameraTargetY;
        camera.left = -THREE_CAMERA_HALF_WIDTH;
        camera.right = THREE_CAMERA_HALF_WIDTH;
        camera.top = halfHeight;
        camera.bottom = -halfHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      const removeVisual = (id: string) => {
        const visual = visuals.get(id);
        if (!visual) return;
        scene.remove(visual.group);
        disposeThreeObject(visual.group);
        visuals.delete(id);
      };

      const animate = (now: number) => {
        const current = frameRef.current;
        const desired = new Map<
          string,
          { block: TowerBlock; role: ThreeBlockRole; falling?: FallingPiece }
        >();
        current.placedBlocks.forEach((block) => {
          desired.set(block.id, {
            block,
            role: block.isBase ? "base" : "placed",
          });
        });
        if (current.activeBlock) {
          desired.set(current.activeBlock.id, {
            block: current.activeBlock,
            role: "active",
          });
        }
        if (current.fallingPiece) {
          desired.set(current.fallingPiece.id, {
            block: current.fallingPiece,
            role: "falling",
            falling: current.fallingPiece,
          });
        }

        Array.from(visuals.keys()).forEach((id) => {
          if (!desired.has(id)) removeVisual(id);
        });

        desired.forEach(({ block, role, falling }, id) => {
          let visual = visuals.get(id);
          if (!visual && texturesReady) {
            const group = createThreeBlockVisual(
              block,
              role,
              textureCache,
              showCharacterStickers,
            );
            scene.add(group);
            visual = { group, role, createdAt: now };
            visuals.set(id, visual);
          }
          if (!visual) return;

          const group = visual.group;
          group.position.set(
            THREE_TOWER_ORIGIN_X + block.x * THREE_WORLD_SCALE,
            getThreeBlockY(block),
            THREE_TOWER_ORIGIN_Z + block.z * THREE_WORLD_SCALE,
          );
          const targetRotationY =
            (block.rotationQuarterTurns ?? 0) * (Math.PI / 2);
          group.rotation.x = 0;
          group.rotation.z = 0;
          group.rotation.y += (targetRotationY - group.rotation.y) * 0.24;
          group.scale.set(1, 1, 1);

          if (role === "active") {
            const pulse = 1 + Math.sin(now * 0.008) * 0.008;
            group.scale.set(pulse, 1, pulse);
          }

          if (role === "falling" && falling) {
            const progress = clamp((now - visual.createdAt) / 780, 0, 1);
            const travel = falling.direction * progress * 4.2;
            if (falling.axis === "x") {
              group.position.x += travel;
              group.rotation.z = falling.direction * -progress * 0.9;
            } else {
              group.position.z += travel;
              group.rotation.x = falling.direction * progress * 0.9;
            }
            group.position.y -= progress * progress * 7.5;
            group.traverse((object) => {
              const mesh = object as THREE.Mesh;
              const materials = Array.isArray(mesh.material)
                ? mesh.material
                : mesh.material
                  ? [mesh.material]
                  : [];
              materials.forEach((material) => {
                material.transparent = true;
                material.opacity = 1 - progress * 0.72;
              });
            });
          }

          if (current.placementEffect?.blockId === id) {
            const effectProgress = clamp((now - impactStartedAt) / 300, 0, 1);
            const squash = Math.sin(effectProgress * Math.PI);
            group.scale.y = 1 - squash * 0.15;
            group.scale.x *= 1 + squash * 0.045;
            group.scale.z *= 1 + squash * 0.045;
          }
        });

        if (current.placementEffect && current.placementEffect.id !== impactId) {
          if (impactRing) {
            scene.remove(impactRing);
            impactRing.geometry.dispose();
            impactRing.material.dispose();
          }
          impactId = current.placementEffect.id;
          impactStartedAt = now;
          impactRing = new THREE.Mesh(
            new THREE.RingGeometry(0.52, 0.68, 48),
            new THREE.MeshBasicMaterial({
              color: current.placementEffect.perfect ? "#FFF09A" : "#F5C97C",
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
              depthWrite: false,
            }),
          );
          impactRing.rotation.x = -Math.PI / 2;
          impactRing.position.set(
            THREE_TOWER_ORIGIN_X + current.placementEffect.x * THREE_WORLD_SCALE,
            THREE_BASE_HEIGHT + current.placementEffect.level * THREE_BOX_HEIGHT + 0.08,
            THREE_TOWER_ORIGIN_Z + current.placementEffect.z * THREE_WORLD_SCALE,
          );
          scene.add(impactRing);
        }
        if (impactRing) {
          const ringProgress = clamp((now - impactStartedAt) / 520, 0, 1);
          const ringScale = 0.55 + ringProgress * 2.8;
          impactRing.scale.setScalar(ringScale);
          impactRing.material.opacity = 0.9 * (1 - ringProgress);
        }

        const targetCameraY = Math.max(
          responsiveBaseCameraTargetY,
          responsiveBaseCameraTargetY +
            Math.max(0, current.completedCount - TOWER_SCROLL_START_LAYER) *
              THREE_BOX_HEIGHT,
        );
        cameraTargetY += (targetCameraY - cameraTargetY) * 0.07;
        camera.position.set(9.5, cameraTargetY + 9.5, 9.5);
        camera.lookAt(0, cameraTargetY, 0);
        renderer?.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        visuals.forEach((visual) => {
          scene.remove(visual.group);
          disposeThreeObject(visual.group);
        });
        visuals.clear();
        textureCache.forEach((texture) => texture.dispose());
        textureCache.clear();
        if (impactRing) {
          impactRing.geometry.dispose();
          impactRing.material.dispose();
        }
        scene.traverse((object) => {
          if (object === scene) return;
          const renderable = object as THREE.Mesh | THREE.LineSegments;
          renderable.geometry?.dispose();
          const materials = Array.isArray(renderable.material)
            ? renderable.material
            : renderable.material
              ? [renderable.material]
              : [];
          materials.forEach((material) => material.dispose());
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    } catch (error) {
      isDisposed = true;
      console.warn("[CabinetBoxStack] Three.js renderer unavailable", error);
      renderer?.dispose();
      renderer?.domElement.remove();
      setRenderError(true);
      return;
    }
  }, [showCharacterStickers]);

  return (
    <Box
      ref={hostRef}
      data-three-isometric-stage="true"
      role="img"
      aria-label={accessibilityCopy.scene}
      position="absolute"
      inset="0"
      zIndex={10}
      overflow="hidden"
      pointerEvents="none"
    >
      {renderError ? (
        <Flex position="absolute" inset="0" align="center" justify="center" color="#45585B" fontSize="13px" fontWeight="800">
          {accessibilityCopy.error}
        </Flex>
      ) : null}
    </Box>
  );
}

export function CabinetBoxStackMinigameModal({
  locale = "zh",
  variant = "archive",
  motionVariant = "classic",
  onSkip,
  onSolved,
  onComplete,
  successRewardHeading = "同事的請託",
  successRewardLabel = "櫃子整理完成",
  successFootnote = "箱子整齊收進櫃子，之後找資料方便多了",
}: {
  locale?: ExhibitionLocale;
  variant?: CabinetBoxStackVariant;
  motionVariant?: CabinetBoxMotionMode;
  baseFatigue: number;
  onSkip: () => void;
  onSolved?: () => void;
  onComplete?: () => void;
  title?: string;
  successRewardHeading?: string;
  successRewardLabel?: string | null;
  successFootnote?: string;
}) {
  const isDispatch = variant === "dispatch";
  const targetLayerCount = isDispatch ? DISPATCH_LAYER_COUNT : THREE_STAR_LAYER_COUNT;
  const copy = {
    zh: {
      kept: "挑戰結束，成績保留！", miss: "完全落空！", three: "★★★ 三星達成！", two: "★★ 兩星達成！",
      pass: "通關！繼續挑戰三星", perfect: "完美貼合！", trimmed: "切齊！", restart: "重新開始",
      layers: (count: number) => `${count}/${THREE_STAR_LAYER_COUNT} 層 · ${PASS_LAYER_COUNT} 層通關`,
      hint: "提示", later: "稍後再做", cabinet: "ARCHIVE 03 · 文件櫃", speed: "速度",
      gameOver: "箱子完全落空", gameOverBody: "通關前只要完全沒有重疊，整箱就會掉出櫃外並失敗。先疊穩 7 層，再挑戰更高星等。",
      retry: "再試一次", threeDone: "三星完成！", done: "整理完成！", score: (count: number) => `本次成績：${count} 層`,
      stars: (count: number) => `${count} 顆星`, finish: "完成", challenge: "繼續挑戰", place: "放置箱子",
      placing: "切齊中⋯⋯", falling: "箱子掉落中⋯⋯", working: "整理中⋯⋯", hintTitle: "堆箱提示",
      hintBody: "箱子會輪流沿左右與斜向深度移動，而且每疊一層都會加速。疊穩 7 層即可通關並選擇完成；繼續到 10 層是兩星，14 層可獲得三星。",
      gotIt: "知道了", tutorialTitle: "看準位置，切齊箱子",
      tutorialBody1: "箱子會像 Tower Blocks 一樣，輪流沿兩個方向移動。點擊櫃子或「放置箱子」就會立即定格。",
      tutorialBody2: "箱子來源會循環出現，每成功一層速度都會提高。超出的紙箱會被切下；先疊穩 7 層通關，繼續到 14 層可獲得三星。",
      start: "開始整理", movingBox: "移動中的箱子，點擊放置", moveX: "左右方向移動", moveDepth: "斜向深度移動",
      cuePerfect: "完美！", cueHalfway: "剩一半！", cueDanger: "危險！",
    },
    ja: {
      kept: "チャレンジ終了。記録を保存しました！", miss: "完全に外れた！", three: "★★★ 3つ星達成！", two: "★★ 2つ星達成！",
      pass: "クリア！ 3つ星に挑戦", perfect: "ぴったり！", trimmed: "そろった！", restart: "やり直す",
      layers: (count: number) => `${count}/${THREE_STAR_LAYER_COUNT}段 · ${PASS_LAYER_COUNT}段でクリア`,
      hint: "ヒント", later: "あとで", cabinet: "ARCHIVE 03 · 書類棚", speed: "速度",
      gameOver: "箱が完全に外れた", gameOverBody: "クリア前に箱がまったく重ならないと、棚から落ちて失敗です。まず7段を安定して積み、その先の星を目指しましょう。",
      retry: "もう一度", threeDone: "3つ星完成！", done: "整理完了！", score: (count: number) => `今回の記録：${count}段`,
      stars: (count: number) => `${count}つ星`, finish: "完了", challenge: "挑戦を続ける", place: "箱を置く",
      placing: "そろえ中…", falling: "箱が落下中…", working: "整理中…", hintTitle: "積み上げのヒント",
      hintBody: "箱は左右と奥行き方向を交互に動き、1段ごとに速くなります。7段でクリア、10段で2つ星、14段で3つ星です。",
      gotIt: "わかった", tutorialTitle: "位置を見極めて箱をそろえよう",
      tutorialBody1: "箱は2方向を交互に動きます。棚か「箱を置く」をタップすると、その場で止まります。",
      tutorialBody2: "成功するたびに速度が上がり、はみ出した部分は切り落とされます。7段でクリア、14段で3つ星です。",
      start: "整理を始める", movingBox: "動いている箱。タップして置く", moveX: "左右方向に移動", moveDepth: "奥行き方向に移動",
      cuePerfect: "ぴったり！", cueHalfway: "あと半分！", cueDanger: "危ない！",
    },
    en: {
      kept: "Challenge over—score saved!", miss: "Total miss!", three: "★★★ Three Stars!", two: "★★ Two Stars!",
      pass: "Clear! Keep going for three stars", perfect: "Perfect fit!", trimmed: "Trimmed!", restart: "Restart",
      layers: (count: number) => `${count}/${THREE_STAR_LAYER_COUNT} layers · Clear at ${PASS_LAYER_COUNT}`,
      hint: "Hint", later: "Do Later", cabinet: "ARCHIVE 03 · FILE CABINET", speed: "SPEED",
      gameOver: "The box missed completely", gameOverBody: "Before clearing the challenge, a box with no overlap falls from the cabinet and ends the run. Stack 7 stable layers first, then aim higher.",
      retry: "Try Again", threeDone: "Three Stars Complete!", done: "Sorting Complete!", score: (count: number) => `Score: ${count} layers`,
      stars: (count: number) => `${count} stars`, finish: "Finish", challenge: "Keep Going", place: "Place Box",
      placing: "Trimming…", falling: "Box falling…", working: "Sorting…", hintTitle: "Stacking Hint",
      hintBody: "Boxes alternate between horizontal and depth movement, speeding up after each layer. Stack 7 to clear, 10 for two stars, or 14 for three stars.",
      gotIt: "Got It", tutorialTitle: "Time It and Align the Boxes",
      tutorialBody1: "Boxes move along two alternating axes. Tap the cabinet or Place Box to stop one instantly.",
      tutorialBody2: "Each successful layer increases the speed. Overhanging cardboard is trimmed away. Reach 7 layers to clear or 14 for three stars.",
      start: "Start Sorting", movingBox: "Moving box; tap to place", moveX: "Moving horizontally", moveDepth: "Moving diagonally in depth",
      cuePerfect: "Perfect!", cueHalfway: "Halfway!", cueDanger: "Danger!",
    },
  }[locale];
  const dispatchCopy = {
    zh: {
      batchDone: (count: number) => `第 ${count} 批封箱！`,
      retrying: "急件重送！",
      wrongWayControl: "移動中的箱子；錯向箱可直接放下，或先左右滑動轉正",
      perfect: "精準！",
      danger: "小心傾斜！",
      completeTitle: "三批急件交付完成！",
      completeLabel: "準時送出 3 批資料箱",
      score: (perfect: number, missed: number) => `精準 ${perfect} 次 · 重送 ${missed} 次`,
    },
    ja: {
      batchDone: (count: number) => `第${count}ロット梱包！`,
      retrying: "箱を再送！",
      wrongWayControl: "動いている箱。向きが違う箱はそのまま置くか、左右にスワイプして直す",
      perfect: "正確！",
      danger: "傾き注意！",
      completeTitle: "3ロット発送完了！",
      completeLabel: "資料箱3ロットを定刻発送",
      score: (perfect: number, missed: number) => `正確 ${perfect}回 · 再送 ${missed}回`,
    },
    en: {
      batchDone: (count: number) => `Batch ${count} sealed!`,
      retrying: "Box reissued!",
      wrongWayControl: "Moving box; place a misoriented box as-is, or swipe sideways to correct it first",
      perfect: "Precise!",
      danger: "Watch the lean!",
      completeTitle: "Three Rush Batches Shipped!",
      completeLabel: "3 file-box batches shipped on time",
      score: (perfect: number, missed: number) => `${perfect} precise · ${missed} reissued`,
    },
  }[locale];
  const activeRef = useRef<ActiveTowerBlock | null>(null);
  const placedRef = useRef<TowerBlock[]>([BASE_BLOCK]);
  const phaseRef = useRef<TowerPhase>("preparing");
  const directionRef = useRef<1 | -1>(1);
  const motionPositionRef = useRef<MotionPosition>({ x: 0, z: 0 });
  const motionRangeRef = useRef<MotionPosition>({ x: 100, z: 100 });
  const motionAxisRef = useRef<MoveAxis>("x");
  const motionPathProgressRef = useRef(0);
  const motionBounceCountRef = useRef(0);
  const motionPauseUntilRef = useRef(0);
  const hasPausedThisPassRef = useRef(false);
  const stagePointerRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const stickerBoxDefinitionIndexRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solvedNotifiedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onSolvedRef = useRef(onSolved);
  const onCompleteRef = useRef(onComplete);

  const [placedBlocks, setPlacedBlocks] = useState<TowerBlock[]>([BASE_BLOCK]);
  const [activeBlock, setActiveBlock] = useState<ActiveTowerBlock | null>(null);
  const [motionPosition, setMotionPosition] = useState<MotionPosition>({ x: 0, z: 0 });
  const [motionAxis, setMotionAxis] = useState<MoveAxis>("x");
  const [phase, setPhase] = useState<TowerPhase>("preparing");
  const [fallingPiece, setFallingPiece] = useState<FallingPiece | null>(null);
  const [placementEffect, setPlacementEffect] = useState<PlacementEffect | null>(null);
  const [placementCue, setPlacementCue] = useState<PlacementCue | null>(null);
  const [perfectCount, setPerfectCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  const completedCount = placedBlocks.length - 1;
  const earnedStars = isDispatch
    ? perfectCount >= 6
      ? 3
      : perfectCount >= 3
        ? 2
        : 1
    : getStarCount(completedCount);
  const backgroundScrollLayerCount = Math.max(
    0,
    completedCount - TOWER_SCROLL_START_LAYER,
  );
  const backgroundScrollWidthPercent =
    backgroundScrollLayerCount *
    ((THREE_BOX_HEIGHT * THREE_ISOMETRIC_Y_SCREEN_FACTOR) /
      (THREE_CAMERA_HALF_WIDTH * 2)) *
    100;

  useEffect(() => {
    onSolvedRef.current = onSolved;
  }, [onSolved]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const setGamePhase = useCallback((nextPhase: TowerPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (!transitionTimerRef.current) return;
    clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
  }, []);

  const primeAudio = useCallback(() => {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
    try {
      const context = audioContextRef.current ?? new window.AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") void context.resume();
      return context;
    } catch {
      return null;
    }
  }, []);

  const playPlacementSound = useCallback(
    (perfect: boolean, missed = false) => {
      if (missed) {
        playGameSfx("cabinetBoxMiss");
        return;
      }
      const context = primeAudio();
      if (!context || context.state === "closed") return;
      const startedAt = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = perfect ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(perfect ? 190 : 128, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        perfect ? 104 : 62,
        startedAt + (perfect ? 0.16 : 0.11),
      );
      gain.gain.setValueAtTime(perfect ? 0.055 : 0.065, startedAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + (perfect ? 0.18 : 0.13));
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + 0.19);
    },
    [primeAudio],
  );

  const spawnActive = useCallback(
    (definitionIndex: number, target: TowerBlock) => {
      const definition = BOXES[definitionIndex % BOXES.length];
      if (!definition) return;
      const axis: MoveAxis = definitionIndex % 2 === 0 ? "z" : "x";
      const targetFootprint = getBlockFootprint(target);
      const rangeX = Math.max(118, targetFootprint.width + 32);
      const rangeZ = Math.max(118, targetFootprint.depth + 70);
      const startSide: 1 | -1 = definitionIndex % 4 < 2 ? -1 : 1;
      const startsWrongWay =
        isDispatch &&
        motionVariant === "wrong-way" &&
        definitionIndex % DISPATCH_BATCH_SIZE === 1;
      const nextActive: ActiveTowerBlock = {
        id: `active-${definition.id}-${Date.now()}`,
        definition,
        definitionIndex,
        width: targetFootprint.width,
        depth: targetFootprint.depth,
        x: target.x,
        z: target.z,
        level: target.level + 1,
        axis,
        rotationQuarterTurns: startsWrongWay
          ? Math.floor(definitionIndex / DISPATCH_BATCH_SIZE) % 2 === 0
            ? 1
            : -1
          : 0,
        wasWrongWayCorrected: false,
        stickerBomb:
          motionVariant === "wrong-way" &&
          stickerBoxDefinitionIndexRef.current === definitionIndex,
      };
      activeRef.current = nextActive;
      motionRangeRef.current = { x: rangeX, z: rangeZ };
      motionPathProgressRef.current = 0;
      motionBounceCountRef.current = 0;
      motionPauseUntilRef.current = 0;
      hasPausedThisPassRef.current = false;
      directionRef.current =
        isDispatch && motionVariant === "corner-turn"
          ? 1
          : startSide === -1
            ? 1
            : -1;
      const initialMotion =
        isDispatch && motionVariant === "corner-turn"
          ? getCornerTurnPosition({
              progress: 0,
              definitionIndex,
              rangeX,
              rangeZ,
            })
          : {
              position:
                axis === "x"
                  ? { x: rangeX * startSide, z: 0 }
                  : { x: 0, z: rangeZ * startSide },
              axis,
            };
      motionPositionRef.current = initialMotion.position;
      motionAxisRef.current = initialMotion.axis;
      lastFrameRef.current = 0;
      setMotionPosition(initialMotion.position);
      setMotionAxis(initialMotion.axis);
      setActiveBlock(nextActive);
      setFallingPiece(null);
      setPlacementEffect(null);
      setGamePhase("moving");
    },
    [isDispatch, motionVariant, setGamePhase],
  );

  const resetGame = useCallback(() => {
    clearTransitionTimer();
    placedRef.current = [BASE_BLOCK];
    activeRef.current = null;
    solvedNotifiedRef.current = false;
    stickerBoxDefinitionIndexRef.current = null;
    setPlacedBlocks([BASE_BLOCK]);
    setActiveBlock(null);
    setFallingPiece(null);
    setPlacementEffect(null);
    setPlacementCue(null);
    setPerfectCount(0);
    setMissedCount(0);
    setGamePhase("preparing");
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      spawnActive(0, BASE_BLOCK);
    }, 90);
  }, [clearTransitionTimer, setGamePhase, spawnActive]);

  useEffect(() => {
    resetGame();
    return clearTransitionTimer;
  }, [clearTransitionTimer, resetGame]);

  useEffect(() => {
    let animationFrame = 0;
    const animate = (now: number) => {
      if (phaseRef.current === "moving" && activeRef.current) {
        const previous = lastFrameRef.current || now;
        const deltaMs = clamp(now - previous, 0, 34);
        lastFrameRef.current = now;
        const active = activeRef.current;
        const ranges = motionRangeRef.current;

        if (isDispatch && motionVariant === "corner-turn") {
          const currentCorner = getCornerTurnPosition({
            progress: motionPathProgressRef.current,
            definitionIndex: active.definitionIndex,
            rangeX: ranges.x,
            rangeZ: ranges.z,
          });
          const turnDistance = Math.abs(
            motionPathProgressRef.current - currentCorner.turnProgress,
          );
          const turnSlowdown = turnDistance < 0.1 ? 0.48 : 1;
          const levelSpeedMultiplier = 1 + active.definitionIndex * 0.045;
          const totalPathDistance = ranges.x + ranges.z;
          let nextProgress =
            motionPathProgressRef.current +
            directionRef.current *
              ((0.225 * levelSpeedMultiplier * turnSlowdown * deltaMs) /
                totalPathDistance);
          if (nextProgress >= 1) {
            nextProgress = 1;
            directionRef.current = -1;
          } else if (nextProgress <= 0) {
            nextProgress = 0;
            directionRef.current = 1;
          }
          motionPathProgressRef.current = nextProgress;
          const nextCorner = getCornerTurnPosition({
            progress: nextProgress,
            definitionIndex: active.definitionIndex,
            rangeX: ranges.x,
            rangeZ: ranges.z,
          });
          motionPositionRef.current = nextCorner.position;
          setMotionPosition(nextCorner.position);
          if (motionAxisRef.current !== nextCorner.axis) {
            motionAxisRef.current = nextCorner.axis;
            setMotionAxis(nextCorner.axis);
          }
        } else {
          const axis = active.axis;
          const range = axis === "x" ? ranges.x : ranges.z;
          const previousOffset =
            axis === "x"
              ? motionPositionRef.current.x
              : motionPositionRef.current.z;
          const levelSpeedMultiplier =
            1 +
            active.definitionIndex *
              (isDispatch
                ? motionVariant === "classic"
                  ? 0.13
                  : 0.055
                : SPEED_STEP_PER_LAYER);
          let speed =
            (axis === "x" ? 0.16 : 0.23) * levelSpeedMultiplier;

          if (isDispatch) {
            if (motionVariant === "one-way") {
              speed = (axis === "x" ? 0.205 : 0.285) * levelSpeedMultiplier;
              if (now < motionPauseUntilRef.current) {
                animationFrame = requestAnimationFrame(animate);
                return;
              }
            } else if (motionVariant === "tempo-shift") {
              const passProgress = clamp(
                directionRef.current === 1
                  ? (previousOffset + range) / (range * 2)
                  : (range - previousOffset) / (range * 2),
                0,
                1,
              );
              const shiftMultiplier =
                passProgress < 0.32
                  ? 0.58
                  : passProgress < 0.68
                    ? 1.72
                    : 0.82;
              speed =
                (axis === "x" ? 0.17 : 0.235) *
                levelSpeedMultiplier *
                shiftMultiplier;
            } else if (motionVariant === "accelerating-bounce") {
              const bounceMultiplier = Math.min(
                2.5,
                1 + motionBounceCountRef.current * 0.46,
              );
              speed =
                (axis === "x" ? 0.135 : 0.19) *
                levelSpeedMultiplier *
                bounceMultiplier;
            } else if (motionVariant === "brief-stop") {
              speed = (axis === "x" ? 0.235 : 0.315) * levelSpeedMultiplier;
              if (now < motionPauseUntilRef.current) {
                animationFrame = requestAnimationFrame(animate);
                return;
              }
            }
          }

          let nextOffset =
            previousOffset + directionRef.current * speed * deltaMs;
          if (
            isDispatch &&
            motionVariant === "brief-stop" &&
            !hasPausedThisPassRef.current &&
            ((previousOffset < 0 && nextOffset >= 0) ||
              (previousOffset > 0 && nextOffset <= 0))
          ) {
            nextOffset = 0;
            hasPausedThisPassRef.current = true;
            motionPauseUntilRef.current = now + 180;
          }
          if (nextOffset >= range) {
            nextOffset = range;
            directionRef.current = -1;
            motionBounceCountRef.current += 1;
            hasPausedThisPassRef.current = false;
            if (isDispatch && motionVariant === "one-way") {
              motionPauseUntilRef.current = now + 120;
            }
          } else if (nextOffset <= -range) {
            nextOffset = -range;
            directionRef.current = 1;
            motionBounceCountRef.current += 1;
            hasPausedThisPassRef.current = false;
            if (isDispatch && motionVariant === "one-way") {
              motionPauseUntilRef.current = now + 120;
            }
          }
          const nextPosition =
            axis === "x"
              ? { x: nextOffset, z: 0 }
              : { x: 0, z: nextOffset };
          motionPositionRef.current = nextPosition;
          setMotionPosition(nextPosition);
        }
      } else {
        lastFrameRef.current = now;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isDispatch, motionVariant]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") void context.close();
    },
    [],
  );

  const completeRun = useCallback(() => {
    activeRef.current = null;
    setActiveBlock(null);
    setFallingPiece(null);
    setGamePhase("success");
    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolvedRef.current?.();
    }
  }, [setGamePhase]);

  const correctWrongWayBox = useCallback(() => {
    if (
      phaseRef.current !== "moving" ||
      !isDispatch ||
      motionVariant !== "wrong-way"
    ) {
      return;
    }
    const active = activeRef.current;
    if (!active || !active.rotationQuarterTurns) return;
    const corrected = {
      ...active,
      rotationQuarterTurns: 0,
      wasWrongWayCorrected: true,
    };
    activeRef.current = corrected;
    setActiveBlock(corrected);
    playGameSfx("uiDialogContinue", { volumeScale: 0.48 });
    triggerHaptic(22);
  }, [isDispatch, motionVariant]);

  const placeActiveBlock = useCallback(() => {
    if (phaseRef.current !== "moving") return;
    const active = activeRef.current;
    const target = placedRef.current[placedRef.current.length - 1];
    if (!active || !target) return;

    primeAudio();
    setGamePhase("placing");
    activeRef.current = null;

    // Judge the same position that was rendered for the player. The animation ref can
    // already be one frame ahead when the pointer event arrives, which makes a visually
    // aligned box feel unfair and prevents the perfect-placement cue from triggering.
    const currentX = active.x + motionPosition.x;
    const currentZ = active.z + motionPosition.z;
    const failActiveBox = (
      failureAxis: MoveAxis,
      failureDirection: -1 | 1,
      cueText: string | null,
    ) => {
      const missedPiece: FallingPiece = {
        ...active,
        id: `missed-${active.definition.id}-${Date.now()}`,
        x: currentX,
        z: currentZ,
        axis: failureAxis,
        direction: failureDirection,
      };
      setActiveBlock(null);
      setFallingPiece(missedPiece);
      setPlacementCue(
        cueText ? { id: Date.now(), text: cueText, tone: "danger" } : null,
      );
      const alreadyQualified = active.definitionIndex >= PASS_LAYER_COUNT;
      setGamePhase("miss");
      if (isDispatch) setMissedCount((count) => count + 1);
      playPlacementSound(false, true);
      triggerHaptic([58, 30, 58]);
      clearTransitionTimer();
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setFallingPiece(null);
        if (isDispatch) {
          spawnActive(active.definitionIndex, target);
          return;
        }
        if (alreadyQualified) {
          completeRun();
          return;
        }
        setGamePhase("game-over");
      }, 820);
    };

    const targetFootprint = getBlockFootprint(target);
    const activeFootprint = getBlockFootprint(active);
    const deltaX = currentX - target.x;
    const deltaZ = currentZ - target.z;
    const targetLeft = target.x - targetFootprint.width / 2;
    const targetRight = target.x + targetFootprint.width / 2;
    const activeLeft = currentX - activeFootprint.width / 2;
    const activeRight = currentX + activeFootprint.width / 2;
    const overlapLeft = Math.max(targetLeft, activeLeft);
    const overlapRight = Math.min(targetRight, activeRight);
    const targetNear = target.z - targetFootprint.depth / 2;
    const targetFar = target.z + targetFootprint.depth / 2;
    const activeNear = currentZ - activeFootprint.depth / 2;
    const activeFar = currentZ + activeFootprint.depth / 2;
    const overlapNear = Math.max(targetNear, activeNear);
    const overlapFar = Math.min(targetFar, activeFar);
    const overlapX = overlapRight - overlapLeft;
    const overlapZ = overlapFar - overlapNear;
    const xRetention = overlapX / activeFootprint.width;
    const zRetention = overlapZ / activeFootprint.depth;
    const dominantAxis: MoveAxis = xRetention <= zRetention ? "x" : "z";
    const dominantDelta = dominantAxis === "x" ? deltaX : deltaZ;
    const direction: -1 | 1 = dominantDelta < 0 ? -1 : 1;

    if (
      overlapX <= FAILURE_OVERLAP_EPSILON ||
      overlapZ <= FAILURE_OVERLAP_EPSILON
    ) {
      failActiveBox(
        dominantAxis,
        direction,
        isDispatch ? dispatchCopy.retrying : null,
      );
      return;
    }

    const activeIsSideways = isBlockTurnedSideways(active);
    const perfectX =
      !activeIsSideways &&
      Math.abs(deltaX) <= PERFECT_TOLERANCE &&
      Math.abs(activeFootprint.width - targetFootprint.width) <=
        PERFECT_TOLERANCE;
    const perfectZ =
      !activeIsSideways &&
      Math.abs(deltaZ) <= PERFECT_TOLERANCE &&
      Math.abs(activeFootprint.depth - targetFootprint.depth) <=
        PERFECT_TOLERANCE;
    const perfect = perfectX && perfectZ;
    const placedFootprint = {
      width: perfectX ? targetFootprint.width : overlapX,
      depth: perfectZ ? targetFootprint.depth : overlapZ,
    };
    const placedLocalDimensions = getLocalDimensionsFromFootprint(
      placedFootprint,
      active.rotationQuarterTurns ?? 0,
    );
    const placed: TowerBlock = {
      ...active,
      id: `placed-${active.definition.id}-${Date.now()}`,
      x: perfectX ? target.x : (overlapLeft + overlapRight) / 2,
      z: perfectZ ? target.z : (overlapNear + overlapFar) / 2,
      width: placedLocalDimensions.width,
      depth: placedLocalDimensions.depth,
    };

    let chopped: FallingPiece | null = null;
    if (!perfect && !activeIsSideways) {
      const choppedDimension = Math.abs(dominantDelta);
      chopped = {
        ...active,
        id: `trimmed-${active.definition.id}-${Date.now()}`,
        axis: dominantAxis,
        width:
          dominantAxis === "x" ? choppedDimension : targetFootprint.width,
        depth:
          dominantAxis === "z" ? choppedDimension : targetFootprint.depth,
        x:
          dominantAxis === "x"
            ? target.x +
              direction * (targetFootprint.width / 2 + choppedDimension / 2)
            : target.x,
        z:
          dominantAxis === "z"
            ? target.z +
              direction * (targetFootprint.depth / 2 + choppedDimension / 2)
            : target.z,
        direction,
      };
    }

    const nextPlacedBlocks = [...placedRef.current, placed];
    const nextCount = nextPlacedBlocks.length - 1;
    if (active.stickerBomb) {
      stickerBoxDefinitionIndexRef.current = null;
    }
    if (motionVariant === "wrong-way" && active.wasWrongWayCorrected) {
      stickerBoxDefinitionIndexRef.current = nextCount;
    }
    const retainedOnAxisRatio = Math.min(xRetention, zRetention);
    const placedFootprintForCue = getBlockFootprint(placed);
    const remainingSurfaceRatio = Math.min(
      placedFootprintForCue.width / START_WIDTH,
      placedFootprintForCue.depth / START_DEPTH,
    );
    const nextCue: PlacementCue | null =
      isDispatch &&
      nextCount % DISPATCH_BATCH_SIZE === 0 &&
      nextCount < DISPATCH_LAYER_COUNT
        ? {
            id: Date.now(),
            text: dispatchCopy.batchDone(nextCount / DISPATCH_BATCH_SIZE),
            tone: "halfway",
          }
        : !isDispatch && nextCount === PASS_LAYER_COUNT
        ? { id: Date.now(), text: copy.cueHalfway, tone: "halfway" }
        : perfect
          ? {
              id: Date.now(),
              text: isDispatch ? dispatchCopy.perfect : copy.cuePerfect,
              tone: "perfect",
            }
          : retainedOnAxisRatio <= 0.62 || remainingSurfaceRatio <= 0.5
            ? {
                id: Date.now(),
                text: isDispatch ? dispatchCopy.danger : copy.cueDanger,
                tone: "danger",
              }
            : null;
    placedRef.current = nextPlacedBlocks;
    setPlacedBlocks(nextPlacedBlocks);
    setActiveBlock(null);
    setFallingPiece(chopped);
    setPlacementCue(nextCue);
    setPlacementEffect({
      id: Date.now(),
      blockId: placed.id,
      x: placed.x,
      z: placed.z,
      level: placed.level,
      perfect,
    });
    if (perfect) setPerfectCount((count) => count + 1);
    playPlacementSound(perfect);
    triggerHaptic(perfect ? [20, 18, 34] : [22, 18, 24]);

    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      setFallingPiece(null);
      if (nextCount >= targetLayerCount) {
        completeRun();
        return;
      }
      spawnActive(nextCount, placed);
    }, perfect ? 360 : 430);
  }, [
    clearTransitionTimer,
    completeRun,
    copy.cueDanger,
    copy.cueHalfway,
    copy.cuePerfect,
    dispatchCopy,
    isDispatch,
    motionPosition,
    motionVariant,
    playPlacementSound,
    primeAudio,
    setGamePhase,
    spawnActive,
    targetLayerCount,
  ]);

  useEffect(() => {
    if (phase !== "success") return;
    clearTransitionTimer();
    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      onCompleteRef.current?.();
    }, 3000);
    return clearTransitionTimer;
  }, [clearTransitionTimer, phase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }
      if (
        motionVariant === "wrong-way" &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        event.preventDefault();
        correctWrongWayBox();
        return;
      }
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      placeActiveBlock();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [correctWrongWayBox, motionVariant, onSkip, placeActiveBlock]);

  const displayedActive: TowerBlock | null = activeBlock
    ? {
        ...activeBlock,
        x: activeBlock.x + motionPosition.x,
        z: activeBlock.z + motionPosition.z,
      }
    : null;
  const activeAxis = activeBlock ? motionAxis : completedCount % 2 === 0 ? "x" : "z";

  return (
    <Flex
      data-cabinet-box-stack-variant={variant}
      data-cabinet-box-motion-variant={isDispatch ? motionVariant : "classic"}
      position="absolute"
      inset="0"
      zIndex={70}
      direction="column"
      overflow="hidden"
      containerType="inline-size"
      bgColor="#F2EEDF"
      backgroundImage="linear-gradient(180deg, #F8F4E7 0%, #E9E3D2 100%)"
    >
      <Box
        role="button"
        aria-label={
          isDispatch && motionVariant === "wrong-way"
            ? dispatchCopy.wrongWayControl
            : copy.movingBox
        }
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault();
          if (isDispatch && motionVariant === "wrong-way") {
            stagePointerRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
          }
          placeActiveBlock();
        }}
        onPointerUp={(event) => {
          if (!isDispatch || motionVariant !== "wrong-way") return;
          event.preventDefault();
          const gesture = stagePointerRef.current;
          stagePointerRef.current = null;
          if (!gesture || gesture.pointerId !== event.pointerId) return;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          const deltaX = event.clientX - gesture.startX;
          const deltaY = event.clientY - gesture.startY;
          if (Math.abs(deltaX) >= 32 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
            correctWrongWayBox();
            return;
          }
          placeActiveBlock();
        }}
        onPointerCancel={() => {
          stagePointerRef.current = null;
        }}
        position="relative"
        flex="1"
        minH="0"
        w="100%"
        overflow="hidden"
        bgColor="#F4F0E1"
        backgroundImage={`url(${BOX_STACKING_BACKGROUND_TILE_URL})`}
        backgroundPosition={`center ${backgroundScrollWidthPercent}cqw`}
        backgroundSize="100% auto"
        backgroundRepeat="repeat-y"
        cursor={phase === "moving" ? "pointer" : "default"}
        touchAction="none"
        outline="none"
      >
            <Box
              data-background-loop-layer={backgroundScrollLayerCount}
              position="absolute"
              inset="0"
              zIndex={0}
              backgroundImage={`url(${BOX_STACKING_BACKGROUND_URL})`}
              backgroundPosition="center bottom"
              backgroundSize="100% auto"
              backgroundRepeat="no-repeat"
              transform={`translateY(${backgroundScrollWidthPercent}cqw)`}
              transition="transform 360ms ease-out"
              pointerEvents="none"
            />
            <Flex
              position="absolute"
              top="0"
              left="0"
              zIndex={280}
              w="100%"
              h="clamp(64px, 20.36vw, 80px)"
              bgColor="#F4F3EA"
              backgroundImage={`url(${BOX_STACKING_TOP_BANNER_URL})`}
              backgroundSize="100% auto"
              backgroundPosition="center 88%"
              backgroundRepeat="no-repeat"
              align="center"
              justify="center"
              pointerEvents="none"
            >
              <Flex
                w="40.1%"
                h="58.1%"
                mt="2.2%"
                borderRadius="clamp(8px, 2.55vw, 10px)"
                bgColor="rgba(255,255,255,0.5)"
                color="#5A6F48"
                align="center"
                justify="center"
              >
                <Text fontSize="clamp(22px, 6.1vw, 24px)" fontWeight="400" lineHeight="1">
                  {activeBlock?.level ?? completedCount}
                </Text>
              </Flex>
              <Box
                position="absolute"
                left="0"
                right="0"
                bottom="0"
                h="3px"
                backgroundImage={`url(${BOX_STACKING_TOP_BANNER_LINE_URL})`}
                backgroundSize="100% 100%"
                backgroundRepeat="no-repeat"
              />
            </Flex>

            <Box
              position="absolute"
              inset="0"
              animation={placementEffect ? `${sceneKick} 240ms ease-out both` : undefined}
              pointerEvents="none"
            >
              <ThreeIsometricTower
                locale={locale}
                showCharacterStickers={!isDispatch}
                frame={{
                  placedBlocks,
                  activeBlock: displayedActive,
                  activeAxis,
                  fallingPiece,
                  placementEffect,
                  completedCount,
                }}
              />

              {displayedActive ? (
                <Box
                  data-tower-block={displayedActive.definition.id}
                  data-block-role="active"
                  data-move-axis={motionAxis}
                  data-motion-x={motionPosition.x.toFixed(2)}
                  data-motion-z={motionPosition.z.toFixed(2)}
                  data-box-orientation-quarter-turns={
                    displayedActive.rotationQuarterTurns ?? 0
                  }
                  position="absolute"
                  w="1px"
                  h="1px"
                  opacity={0}
                />
              ) : null}
              {fallingPiece ? (
                <Box data-falling-piece="true" position="absolute" w="1px" h="1px" opacity={0} />
              ) : null}
              {placementEffect ? (
                <Box
                  data-placement-impact={placementEffect.perfect ? "perfect" : "trimmed"}
                  position="absolute"
                  w="1px"
                  h="1px"
                  opacity={0}
                />
              ) : null}
            </Box>

            {placementCue ? (
              <Text
                key={placementCue.id}
                data-placement-cue={placementCue.tone}
                role="status"
                aria-live="polite"
                position="absolute"
                left="50%"
                top="23%"
                zIndex={290}
                color={
                  placementCue.tone === "perfect"
                    ? "#5A7948"
                    : placementCue.tone === "halfway"
                      ? "#A66A37"
                      : "#B34E45"
                }
                fontSize="clamp(26px, 8.2cqw, 32px)"
                fontWeight="900"
                lineHeight="1"
                letterSpacing="0.08em"
                whiteSpace="nowrap"
                textShadow="0 2px 0 rgba(255,255,255,0.96), 0 5px 14px rgba(77,57,40,0.28)"
                animation={`${placementCuePop} 920ms ease-out both`}
                pointerEvents="none"
              >
                {placementCue.text}
              </Text>
            ) : null}

            {phase === "game-over" ? (
              <Flex
                position="absolute"
                inset="0"
                zIndex={300}
                bgColor="rgba(50,34,23,0.72)"
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
                  gap="10px"
                  p="20px"
                  boxShadow="0 16px 32px rgba(32,21,14,0.3)"
                  animation={`${fadeUp} 220ms ease both`}
                >
                  <Text color="#65462F" fontSize="20px" fontWeight="900">
                    {copy.gameOver}
                  </Text>
                  <Text color="#8A674D" fontSize="13px" lineHeight="1.6" textAlign="center">
                    {copy.gameOverBody}
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
                      {copy.later}
                    </Flex>
                    <Flex
                      as="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        resetGame();
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
                      {copy.retry}
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            ) : null}

            {phase === "success" ? (
              <Flex position="absolute" inset="0" zIndex={310} pointerEvents="none">
                <Box
                  position="absolute"
                  insetY="0"
                  left="0"
                  w="50.4%"
                  bgColor="#718084"
                  borderRight="3px solid #3E4E52"
                  boxShadow="inset -8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${leftDoorClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
                />
                <Box
                  position="absolute"
                  insetY="0"
                  right="0"
                  w="50.4%"
                  bgColor="#718084"
                  borderLeft="3px solid #3E4E52"
                  boxShadow="inset 8px 0 16px rgba(31,43,46,0.2)"
                  animation={`${rightDoorClose} 620ms cubic-bezier(0.2,0.84,0.25,1) both`}
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
                    {isDispatch
                      ? dispatchCopy.completeTitle
                      : earnedStars === 3
                        ? copy.threeDone
                        : copy.done}
                  </Text>
                  <Flex aria-label={copy.stars(earnedStars)} gap="5px" mb="1px">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Text
                        key={`result-star-${index}`}
                        color={index < earnedStars ? "#FFD66B" : "rgba(255,255,255,0.24)"}
                        fontSize="25px"
                        lineHeight="1"
                        textShadow={index < earnedStars ? "0 2px 8px rgba(255,197,61,0.34)" : undefined}
                      >
                        ★
                      </Text>
                    ))}
                  </Flex>
                  <Text color="#FFF7E8" fontSize="12px" fontWeight="800">
                    {isDispatch
                      ? dispatchCopy.score(perfectCount, missedCount)
                      : copy.score(completedCount)}
                  </Text>
                  {isDispatch || successRewardLabel !== null ? (
                    <>
                      <Text color="#D8E1DE" fontSize="13px" fontWeight="800">
                        {successRewardHeading}
                      </Text>
                      <Text color="white" fontSize="17px" fontWeight="900">
                        {isDispatch ? dispatchCopy.completeLabel : successRewardLabel}
                      </Text>
                    </>
                  ) : null}
                  {successFootnote ? (
                    <Text maxW="260px" color="rgba(255,247,232,0.82)" fontSize="11px" lineHeight="1.55" fontWeight="700" textAlign="center">
                      {successFootnote}
                    </Text>
                  ) : null}
                </Flex>
              </Flex>
            ) : null}
      </Box>
    </Flex>
  );
}

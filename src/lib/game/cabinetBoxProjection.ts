import * as THREE from "three";

// Back, right, front, left inner corners, measured in the 786 x 2833 artwork.
const PLATFORM_CORNERS = [
  [292, 2422],
  [673, 2583],
  [448, 2722],
  [120, 2539],
] as const;

// The artist's 404 x 328 box reference has a different rear corner from the
// empty platform. Express that corner in the two front-edge axes, so refining
// the lid perspective leaves the approved front/left/right corners in place.
const BOX_REFERENCE = {
  back: new THREE.Vector2(185, 88),
  right: new THREE.Vector2(340, 164),
  front: new THREE.Vector2(237, 229),
  left: new THREE.Vector2(66, 136),
};
const referenceLeft = BOX_REFERENCE.left.clone().sub(BOX_REFERENCE.front);
const referenceRight = BOX_REFERENCE.right.clone().sub(BOX_REFERENCE.front);
const referenceBack = BOX_REFERENCE.back.clone().sub(BOX_REFERENCE.front);
const referenceDeterminant = referenceLeft.cross(referenceRight);
const BACK_LEFT_WEIGHT = referenceBack.cross(referenceRight) / referenceDeterminant;
const BACK_RIGHT_WEIGHT = referenceLeft.cross(referenceBack) / referenceDeterminant;

export function createCabinetBoxFloorProjection(center: THREE.Vector2) {
  const average = PLATFORM_CORNERS.reduce(
    (sum, [x, y]) => sum.add(new THREE.Vector2(x, y)),
    new THREE.Vector2(),
  ).multiplyScalar(0.25);
  // Preserve the approved front-side placement and visible platform rim.
  const [back, right, front, left] = PLATFORM_CORNERS.map(([x, y]) =>
    new THREE.Vector2(x, y).sub(average).multiplyScalar(0.9).add(center),
  );
  back.copy(front)
    .addScaledVector(left.clone().sub(front), BACK_LEFT_WEIGHT)
    .addScaledVector(right.clone().sub(front), BACK_RIGHT_WEIGHT);
  const dx1 = right.x - front.x;
  const dx2 = left.x - front.x;
  const dx3 = back.x - right.x + front.x - left.x;
  const dy1 = right.y - front.y;
  const dy2 = left.y - front.y;
  const dy3 = back.y - right.y + front.y - left.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const projection = new THREE.Matrix3().set(
    right.x - back.x + g * right.x, left.x - back.x + h * left.x, back.x,
    right.y - back.y + g * right.y, left.y - back.y + h * left.y, back.y,
    g, h, 1,
  );
  // Logical box coordinates are centered on zero, rather than the rear corner.
  projection.multiply(new THREE.Matrix3().set(1, 0, 0.5, 0, 1, 0.5, 0, 0, 1));
  return projection.multiplyScalar(1 / (1 + (g + h) / 2));
}

export function createCabinetBoxArtProjection({
  center,
  origin,
  footprint,
  sourceToWorld,
  azimuth,
  elevation,
}: {
  center: THREE.Vector2;
  origin: THREE.Vector2;
  footprint: THREE.Vector2;
  sourceToWorld: number;
  azimuth: number;
  elevation: number;
}) {
  const sinElevation = Math.sin(elevation);
  const uniforms = {
    cabinetFloorProjection: { value: createCabinetBoxFloorProjection(center) },
    cabinetOrigin: { value: origin },
    cabinetFootprint: { value: footprint },
    cabinetCenter: { value: center },
    cabinetSourceToWorld: { value: sourceToWorld },
    cabinetGroundToWorld: {
      value: new THREE.Vector4(
        Math.cos(azimuth), Math.sin(azimuth) / sinElevation,
        -Math.sin(azimuth), Math.cos(azimuth) / sinElevation,
      ),
    },
  };

  return (root: THREE.Object3D) => {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
      // CPU bounds describe the original geometry, before the art projection.
      object.frustumCulled = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: THREE.Material) => {
        material.customProgramCacheKey = () => "cabinet-art-perspective-v1";
        material.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, uniforms);
          shader.vertexShader = `
            uniform mat3 cabinetFloorProjection;
            uniform vec2 cabinetOrigin;
            uniform vec2 cabinetFootprint;
            uniform vec2 cabinetCenter;
            uniform float cabinetSourceToWorld;
            uniform vec4 cabinetGroundToWorld;
            ${shader.vertexShader}
          `.replace("#include <project_vertex>", `
            vec4 cabinetWorld = modelMatrix * vec4(transformed, 1.0);
            vec2 cabinetGround = (cabinetWorld.xz - cabinetOrigin) / cabinetFootprint;
            vec3 cabinetArt = cabinetFloorProjection * vec3(cabinetGround, 1.0);
            float cabinetW = max(cabinetArt.z, 0.15);
            vec2 cabinetOffset =
              (cabinetArt.xy / cabinetW - cabinetCenter) * cabinetSourceToWorld;
            cabinetWorld.xz = cabinetOrigin + vec2(
              dot(cabinetGroundToWorld.xy, cabinetOffset),
              dot(cabinetGroundToWorld.zw, cabinetOffset)
            );
            vec4 mvPosition = viewMatrix * cabinetWorld;
            gl_Position = projectionMatrix * mvPosition;
            // Use the same projective interpolation for the artwork and outlines.
            gl_Position *= cabinetW;
          `);
        };
      });
    });
  };
}

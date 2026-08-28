export type DoorHandlePosition = {
  xPercent: number;
  yPercent: number;
};

export type DoorTurnPointerState = {
  lastAngleDegrees: number | null;
  turnDegrees: number;
};

export const DOOR_TURN_THRESHOLD_DEGREES = 82;
export const DOOR_TURN_MAX_DEGREES = 104;

export const DEFAULT_DOOR_HANDLE_POSITION: DoorHandlePosition = {
  xPercent: 59.4,
  yPercent: 49.6,
};

const MIN_POINTER_RADIUS_PX = 18;

type InteractionBounds = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function getDoorTurnPointerAngle(
  clientX: number,
  clientY: number,
  bounds: InteractionBounds,
  handlePosition: DoorHandlePosition,
) {
  const centerX = bounds.left + bounds.width * (handlePosition.xPercent / 100);
  const centerY = bounds.top + bounds.height * (handlePosition.yPercent / 100);
  const offsetX = clientX - centerX;
  const offsetY = clientY - centerY;

  if (Math.hypot(offsetX, offsetY) < MIN_POINTER_RADIUS_PX) {
    return null;
  }

  return (Math.atan2(offsetY, offsetX) * 180) / Math.PI;
}

function normalizeAngleDelta(deltaDegrees: number) {
  return ((deltaDegrees + 540) % 360) - 180;
}

export function advanceCounterclockwiseDoorTurn(
  pointerState: DoorTurnPointerState,
  nextAngleDegrees: number | null,
): DoorTurnPointerState {
  if (nextAngleDegrees === null) {
    return pointerState;
  }

  if (pointerState.lastAngleDegrees === null) {
    return { ...pointerState, lastAngleDegrees: nextAngleDegrees };
  }

  // Browser coordinates grow downward, so a negative angular delta is the
  // counterclockwise motion that physically turns the illustrated handle.
  const angularDelta = normalizeAngleDelta(
    nextAngleDegrees - pointerState.lastAngleDegrees,
  );
  const turnDegrees = Math.min(
    DOOR_TURN_MAX_DEGREES,
    Math.max(0, pointerState.turnDegrees - angularDelta),
  );

  return {
    lastAngleDegrees: nextAngleDegrees,
    turnDegrees,
  };
}

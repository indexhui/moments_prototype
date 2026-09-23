// The save retains its original logical coordinates. Only presentation adapts
// to the room floor and viewport, so existing arrangements survive the redesign.
export const ROOM_WIDTH = 393;
export const ROOM_HEIGHT = 852;
export function roomFloor(height: number) {
  const back = height * .56;
  return { back, front: Math.max(back + 65, height - 235) };
}
export function toRoomPoint(x: number, y: number, height: number) {
  const floor = roomFloor(height);
  return { x: x * ROOM_WIDTH / 100, y: floor.back + (y - 30) / 46 * (floor.front - floor.back) };
}
export function fromRoomPoint(x: number, y: number, height: number) {
  const floor = roomFloor(height);
  return { x: x / ROOM_WIDTH * 100, y: 30 + (y - floor.back) / (floor.front - floor.back) * 46 };
}

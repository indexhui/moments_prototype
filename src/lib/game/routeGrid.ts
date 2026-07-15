export type RouteGridConnector = {
  top: number[];
  right: number[];
  bottom: number[];
  left: number[];
};

export const ROUTE_GRID_NEIGHBOR_MAP: Record<
  keyof RouteGridConnector,
  { dr: number; dc: number; opposite: keyof RouteGridConnector }
> = {
  top: { dr: -1, dc: 0, opposite: "bottom" },
  right: { dr: 0, dc: 1, opposite: "left" },
  bottom: { dr: 1, dc: 0, opposite: "top" },
  left: { dr: 0, dc: -1, opposite: "right" },
};

export function areRouteGridConnectorSlotsEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

export function hasOpenRouteGridConnectorMatch(left: number[], right: number[]) {
  return left.length > 0 && areRouteGridConnectorSlotsEqual(left, right);
}

export function getRouteGridOrthogonalNeighborIndices({
  index,
  rows,
  cols,
}: {
  index: number;
  rows: number;
  cols: number;
}) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return (Object.keys(ROUTE_GRID_NEIGHBOR_MAP) as Array<keyof RouteGridConnector>)
    .flatMap((direction) => {
      const { dr, dc } = ROUTE_GRID_NEIGHBOR_MAP[direction];
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
        return [];
      }
      return [nextRow * cols + nextCol];
    });
}

export function getReachableRouteGridIndices({
  rows,
  cols,
  startIndex,
  getConnector,
}: {
  rows: number;
  cols: number;
  startIndex: number;
  getConnector: (index: number) => RouteGridConnector | null;
}) {
  const visited = new Set<number>([startIndex]);
  const queue = [startIndex];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentConnector = getConnector(current);
    if (!currentConnector) continue;
    const row = Math.floor(current / cols);
    const col = current % cols;

    (Object.keys(ROUTE_GRID_NEIGHBOR_MAP) as Array<keyof RouteGridConnector>).forEach(
      (direction) => {
        const { dr, dc, opposite } = ROUTE_GRID_NEIGHBOR_MAP[direction];
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) return;
        const nextIndex = nextRow * cols + nextCol;
        const nextConnector = getConnector(nextIndex);
        if (!nextConnector) return;
        if (
          !hasOpenRouteGridConnectorMatch(
            currentConnector[direction],
            nextConnector[opposite],
          )
        ) {
          return;
        }
        if (visited.has(nextIndex)) return;
        visited.add(nextIndex);
        queue.push(nextIndex);
      },
    );
  }

  return visited;
}

export function isRouteGridConnected({
  rows,
  cols,
  startIndex,
  endIndex,
  getConnector,
}: {
  rows: number;
  cols: number;
  startIndex: number;
  endIndex: number;
  getConnector: (index: number) => RouteGridConnector | null;
}) {
  return getReachableRouteGridIndices({ rows, cols, startIndex, getConnector }).has(endIndex);
}

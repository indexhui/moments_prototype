export const ROUTES = {
  home: "/",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gameMap: "/game/map",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

export const ROUTES = {
  home: "/",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gamePlayHistory: "/game/play-history",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

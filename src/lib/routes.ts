export const ROUTES = {
  home: "/",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;


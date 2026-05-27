export const ROUTES = {
  home: "/",
  gameWorksTrial: "/trial/gameworks",
  visionTrial: "/vision",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gameMap: "/game/map",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

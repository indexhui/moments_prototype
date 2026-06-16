export const ROUTES = {
  home: "/",
  gameWorksTrial: "/trial/gameworks",
  hibimon: "/hibimon",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gameMap: "/game/map",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

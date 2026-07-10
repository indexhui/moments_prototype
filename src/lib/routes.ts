export const ROUTES = {
  home: "/",
  hibimon: "/hibimon",
  gameArrangeRoute: "/game/arrange-route",
  gameDaily: "/game/daily",
  gameLobby: "/game/lobby",
  gameRoot: "/game",
  gameMap: "/game/map",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

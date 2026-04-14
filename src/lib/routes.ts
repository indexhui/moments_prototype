export const ROUTES = {
  home: "/",
  gameArrangeRoute: "/game/arrange-route",
  gameRoot: "/game",
  gameMap: "/game/map",
  gamePlayHistory: "/game/play-history",
  gameSunbeastWiki: "/game/sunbeast-wiki",
  gameScene: (sceneId: string) => `/game/${sceneId}`,
} as const;

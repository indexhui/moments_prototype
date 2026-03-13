export type GameEventId =
  | "metro-seat-choice"
  | "street-cookie-sale"
  | "street-comfy-breeze"
  | "street-humid-weather";

export const GAME_EVENT_LIST: Array<{ id: GameEventId; title: string }> = [
  { id: "metro-seat-choice", title: "捷運：座位抉擇" },
  { id: "street-cookie-sale", title: "街道：手工餅乾推銷" },
  { id: "street-comfy-breeze", title: "街道：今天的風很舒服" },
  { id: "street-humid-weather", title: "街道：今天好濕悶" },
];

export const METRO_SEAT_EVENT_COPY = {
  sceneTitle: "捷運車廂",
  line1: "進入車廂只剩幾秒座位感。",
  line2: "...只剩下博愛座有位子呀。",
  sitResult: "早起很累，一坐下去就進入夢鄉，到站時好險有小貝貝叫醒你。",
  standResult: "原本的位置在下一站時，一對老伯伯、老婆婆坐下了，心裡鬆了口氣。",
};

export const STREET_COOKIE_EVENT_COPY = {
  sceneTitle: "街道",
  line1: "你走在街道上，遇見有人熱情推銷手工餅乾。",
  line2: "對方拿著試吃盤，期待地看著你。",
  buyResult: "你買了餅乾，吃下後精神回來了一些。",
  declineResult: "你選擇不買，對方糾纏了好一陣子，好險最後擺脫了。",
  buyEffect: "儲蓄 -2 / 行動力 +1",
  declineEffect: "疲勞值 +5",
};

export const STREET_BREEZE_EVENT_COPY = {
  sceneTitle: "街道",
  line: "今天的風很舒服。",
  effect: "疲勞值 -5",
};

export const STREET_HUMID_EVENT_COPY = {
  sceneTitle: "街道",
  line: "今天的天氣好濕悶。",
  effect: "行動力 -1 / 疲勞值 +5",
};


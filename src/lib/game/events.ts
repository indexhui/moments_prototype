export type GameEventId =
  | "metro-seat-choice"
  | "metro-commute-laugh"
  | "metro-backpack-hit"
  | "metro-card-search"
  | "metro-kid-cry"
  | "metro-door-sprint"
  | "metro-pet-stroller"
  | "metro-milk-tea-shoes"
  | "metro-cute-bag-chat"
  | "metro-seat-spread"
  | "metro-first-sunbeast-dog"
  | "breakfast-shop-choice"
  | "park-hub"
  | "park-gossip"
  | "street-cookie-sale"
  | "street-cat-treat"
  | "street-comfy-breeze"
  | "street-humid-weather"
  | "park-cat-grass";

export type GameEventMeta = {
  id: GameEventId;
  title: string;
  cheatShortcut?: boolean;
};

export const GAME_EVENT_LIST: GameEventMeta[] = [
  { id: "metro-seat-choice", title: "捷運：座位抉擇", cheatShortcut: true },
  { id: "metro-commute-laugh", title: "捷運：通勤小插曲", cheatShortcut: true },
  { id: "metro-backpack-hit", title: "捷運：背包撞臉", cheatShortcut: true },
  { id: "metro-card-search", title: "捷運：找卡烏龍", cheatShortcut: true },
  { id: "metro-kid-cry", title: "捷運：小孩跌倒大哭", cheatShortcut: true },
  { id: "metro-door-sprint", title: "捷運：衝門驚險", cheatShortcut: true },
  { id: "metro-pet-stroller", title: "捷運：毛小孩推車", cheatShortcut: true },
  { id: "metro-milk-tea-shoes", title: "捷運：奶茶濺到新鞋", cheatShortcut: true },
  { id: "metro-cute-bag-chat", title: "捷運：娃包聊天", cheatShortcut: true },
  { id: "metro-seat-spread", title: "捷運：雙腳大開", cheatShortcut: true },
  { id: "metro-first-sunbeast-dog", title: "捷運：第一隻小日獸（黃金獵犬）" },
  { id: "breakfast-shop-choice", title: "早餐店：外帶或內用", cheatShortcut: true },
  { id: "park-hub", title: "公園：休息/探索", cheatShortcut: true },
  { id: "park-gossip", title: "公園：打聽消息", cheatShortcut: true },
  { id: "street-cookie-sale", title: "街道：手工餅乾推銷", cheatShortcut: true },
  { id: "street-cat-treat", title: "街道：路人與貓肉泥", cheatShortcut: true },
  { id: "street-comfy-breeze", title: "街道：今天的風很舒服" },
  { id: "street-humid-weather", title: "街道：今天好濕悶" },
  { id: "park-cat-grass", title: "公園：貓草", cheatShortcut: true },
];

export const METRO_SEAT_EVENT_COPY = {
  sceneTitle: "捷運車廂",
  line1: "進入車廂，只剩下博愛座。",
  line2: "啊...只剩下博愛座有位子啊。",
  sitResult: "早起很累，一坐下去就進入夢鄉，到站時好險有小貝貝叫醒你。",
  standResult: "原本的位置在下一站時，一對老伯伯、老婆婆坐下了，心裡鬆了口氣。",
};

export const METRO_FIRST_SUNBEAST_DOG_EVENT_COPY = {
  sceneTitle: "第一隻小日獸：黃金獵犬",
  line1: "所以我們來到捷運站是為了什麼",
  line2: "小日獸！有小日獸在附近～嗷",
  line3: "小日獸....? 會不會跟交換日記上的內容消失有關",
  line4: "啊！？那是黃金獵犬嗎？他的尾巴要被夾住了!!",
  line5: "對，這呆萌樂天的樣子是我的好夥伴！快使用這台相機",
  line6: "啊！？ 相機",
  line7: "對，快按下快門按鍵來捕捉",
  line8: "小貝狗把拍立得收回。你拿取照片注視著，此時黃金獵犬朝你奔來，飛進了交換日記。",
  line9: "啊！飛進了日記本",
  line10: "趕快打開日記本看看",
  line11: "哦哦 是直太郎，想起來了，是小白筆下很喜歡的狗狗",
  line12: "對，是我最好的夥伴",
  line13: "捷運到站聲",
  line14: "啊 到公司的站點了，時間也差不多，要先趕去上班了.... 回家再好好看看日記",
};

export const METRO_COMMUTE_LAUGH_EVENT_COPY = {
  sceneTitle: "捷運",
  line:
    "有人靠著欄杆睡著，差點壓到旁邊乘客的手。結果一剎車，他整個人往前晃了一下，差點跌倒。你和小貝狗對看一眼，差點笑出來。",
  effect: "獲得一個拼圖碎片",
};

export const METRO_BACKPACK_HIT_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "坐在旁邊的乘客，在下站時一轉身，背包直接砸在妳臉上，超痛的 QQ",
  effect: "疲勞值 +10",
};

export const METRO_CARD_SEARCH_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "一位阿姨在包包裡找悠遊卡找超久，最後發現卡一直拿在手上。",
  effect: "獲得一個拼圖碎片",
};

export const METRO_KID_CRY_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "有個小孩在拉旁邊的手把玩耍，不小心摔倒了，放聲大哭，吵得妳戴上降噪耳機。",
  effect: "疲勞值 +5",
};

export const METRO_DOOR_SPRINT_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "門快關了，有人在最後幾秒緊衝進來，速度太快差點跌倒，自己還裝沒事滑手機。妳和小貝狗差點笑出來。",
  effect: "獲得一個拼圖碎片",
};

export const METRO_PET_STROLLER_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "右邊來了一個乘客推著嬰兒車，上面坐著毛小孩，整趟妳開心的看著牠，完全忘記要觀察小日獸可能出沒的地點蹤跡。",
  effect: "疲勞值 -20",
};

export const METRO_MILK_TEA_SHOES_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "你抓著扶手站穩，列車一煞車，旁邊乘客手上的奶茶差點灑到你，最後只濺到鞋尖。（是剛買的新鞋呀，淚目）",
  effect: "疲勞值 +15",
};

export const METRO_CUTE_BAG_CHAT_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "看到一個很可愛的娃包，忍不住問路人是在哪買的，路人眼睛發光很開心的跟妳分享。",
  effect: "疲勞值 -10",
};

export const METRO_SEAT_SPREAD_EVENT_COPY = {
  sceneTitle: "捷運",
  line: "旁邊的乘客雙腳大開，妳稍微往旁邊縮了一點。他也跟著再往外張開。妳整趟坐的很不舒服。",
  effect: "疲勞值 +30",
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

export const STREET_CAT_TREAT_EVENT_COPY = {
  sceneTitle: "街道",
  line1: "你走到街角時，看見一位路人正蹲著用貓肉泥餵貓。",
  line2: "他笑著跟你說，這一帶的貓大多都做過結紮，也很親人，不太怕生。",
  line3: "不過他最近發現一隻新面孔，和以前常見的不一樣，像是在找什麼。",
  line4: "他看了看你，問：「你有看過那隻新來的貓嗎？」",
  result: "你們聊了幾句後，他分給你一條貓肉泥，說下次遇到也可以餵牠。",
  effect: "收到一條貓肉泥",
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

export const PARK_HUB_EVENT_COPY = {
  sceneTitle: "公園",
  intro: "你到公園了，想做什麼？",
  restResultBase: "你在公園找了個安靜角落坐下，慢慢把呼吸調整回來。",
  restResultBonus: "今天風很舒服，休息效果比平常更好一些。",
  restEffectBase: "疲勞值 -15",
  restEffectBonus: "疲勞值 -20",
  wanderHint: "你在公園四處晃晃，準備打聽一些消息。",
};

export const PARK_CAT_GRASS_EVENT_COPY = {
  sceneTitle: "公園",
  line1: "你經過公園時，看見有人正蹲在花圃邊，小心地種著一小片貓草。",
  line2: "旁邊還有一兩隻小貓安靜地觀望。對方注意到你好像也很有興趣，笑著遞給你一根貓草。",
  result: "你接過那根貓草，淡淡的青草味讓心情也跟著柔軟了一點。",
  effect: "收到一根貓草",
};

export const PARK_GOSSIP_EVENT_COPY = {
  sceneTitle: "公園",
  line: "你在公園繞了一圈，聽到附近居民提到最近常看到陌生貓在這裡出沒。",
  effect: "你記下了這條消息。",
};

export const BREAKFAST_SHOP_EVENT_COPY = {
  sceneTitle: "早餐店",
  line1: "你路過早餐店，煎台香氣和烤吐司味一下就把你拉住了。",
  line2: "老闆娘抬頭問你：「今天要外帶、內用，還是先等等呢？」",
  ownerChat: "你內用時，老闆娘笑著跟你聊了幾句，問你最近通勤是不是比較辛苦。",
  takeoutResult: "你選擇外帶，拿到餐點後邊走邊吃，精神慢慢回來一些。",
  dineInResult: "你坐下來慢慢吃完，身體放鬆很多，但也多花了一點時間。",
  leaveResult: "你看了看時間，決定先離開，準備直接上路。",
  takeoutEffect: "儲蓄 -1 / 疲勞值 -5",
  dineInEffect: "儲蓄 -1 / 行動力 -1 / 疲勞值 -8",
  leaveEffect: "本次不消耗資源",
};

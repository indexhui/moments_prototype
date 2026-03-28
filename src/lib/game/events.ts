export type GameEventId =
  | "breakfast-bus-stop-unlock"
  | "bus-melody-chicken-prelude-1"
  | "bus-sunbeast-cat"
  | "convenience-store-hub"
  | "mart-melody-chicken-prelude-2"
  | "street-melody-chicken-prelude-3"
  | "office-sunbeast-chicken"
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
  | "metro-sunbeast-goat"
  | "breakfast-shop-choice"
  | "park-hub"
  | "park-gossip"
  | "street-cookie-sale"
  | "street-cat-treat"
  | "street-forgot-lunch-frog"
  | "street-comfy-breeze"
  | "street-humid-weather"
  | "park-cat-grass";

export type GameEventMeta = {
  id: GameEventId;
  title: string;
  cheatShortcut?: boolean;
};

export const GAME_EVENT_LIST: GameEventMeta[] = [
  { id: "breakfast-bus-stop-unlock", title: "早餐店：新公車情報（解鎖公車）", cheatShortcut: true },
  { id: "bus-melody-chicken-prelude-1", title: "公車：旋律與雞（前置 1）", cheatShortcut: true },
  { id: "bus-sunbeast-cat", title: "公車：小日獸（貓）", cheatShortcut: true },
  { id: "convenience-store-hub", title: "便利商店：購物/看看/離開", cheatShortcut: true },
  { id: "mart-melody-chicken-prelude-2", title: "便利商店：旋律與雞（前置 2）", cheatShortcut: true },
  { id: "street-melody-chicken-prelude-3", title: "街道：旋律與雞（前置 3）", cheatShortcut: true },
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
  { id: "metro-sunbeast-goat", title: "捷運：小日獸（山羊）", cheatShortcut: true },
  { id: "breakfast-shop-choice", title: "早餐店：外帶或內用", cheatShortcut: true },
  { id: "park-hub", title: "公園：休息/探索", cheatShortcut: true },
  { id: "park-gossip", title: "公園：打聽消息", cheatShortcut: true },
  { id: "street-cookie-sale", title: "街道：手工餅乾推銷", cheatShortcut: true },
  { id: "street-cat-treat", title: "街道：路人與貓肉泥", cheatShortcut: true },
  { id: "street-forgot-lunch-frog", title: "街道：忘記便當（青蛙）", cheatShortcut: true },
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

export const BUS_MELODY_CHICKEN_PRELUDE_EVENT_COPY = {
  sceneTitle: "公車",
  lines: [
    { speaker: "旁白", text: "在公車上" },
    { speaker: "旁白", text: "（輕微旋律聲）" },
    { speaker: "小麥", text: "是什麼聲音呀" },
    { speaker: "旁白", text: "朝旋律來源看去" },
    { speaker: "旁白", text: "公車停了。" },
    { speaker: "旁白", text: "門打開。沒有人下車。後面開始騷動。" },
    { speaker: "被擋住路的路人", text: "不好意思可以借過一下嗎" },
    { speaker: "旁白", text: "前方得路人停在逼卡機面前專心用手機" },
    { speaker: "被擋住路的路人", text: "不好意思可以借過一下嗎" },
    { speaker: "逼卡機前的路人", text: "啊、啊！不好意思！" },
    { speaker: "旁白", text: "抬頭，慌張地下車。人群重新流動。" },
    {
      speaker: "旁白",
      text: "人群重新流動。那個人，消失在人群裡。只有那段旋律，還留在腦中。",
    },
  ] as const,
  effect: "獲得一段旋律",
};

export const MART_MELODY_CHICKEN_PRELUDE_EVENT_COPY = {
  sceneTitle: "便利商店",
  lines: [
    { speaker: "旁白", text: "（輕微旋律聲）" },
    { speaker: "小麥", text: "……又是這個聲音？" },
    { speaker: "旁白", text: "朝聲音的方向看去。" },
    { speaker: "旁白", text: "櫃台前，有個人站著。他低著頭，滑著手機。店員已經開口。" },
    { speaker: "店員", text: "您好～需要什麼嗎？" },
    { speaker: "顧客", text: "啊？喔，抱歉，我要電子支付" },
    { speaker: "旁白", text: "隊伍恢復往前移動，你也完成結帳" },
  ] as const,
  effect: "獲得一段旋律",
};

export const CONVENIENCE_STORE_HUB_EVENT_COPY = {
  sceneTitle: "便利商店",
  intro1: "你走進便利商店，冷氣和熟悉的音樂一下迎面而來。",
  intro2: "在進公司前，還有一點點時間。",
  shopResult: "你拿了想買的東西，走到櫃台準備結帳。",
  lookResult: "你沿著貨架四處看看，暫時沒有發現什麼特別的事。",
  leaveResult: "你想了想，決定先離開便利商店，直接往公司去。",
  shopEffect: "準備結帳",
  lookEffect: "稍微逛了一圈",
  leaveEffect: "直接離開",
  products: [
    { itemId: "yarn", label: "毛線", price: 10 },
    { itemId: "coffee", label: "咖啡", price: 3 },
    { itemId: "milk-tea", label: "奶茶", price: 3 },
    { itemId: "energy-drink", label: "能量飲料", price: 3 },
  ] as const,
};

export const BUS_SUNBEAST_CAT_EVENT_COPY = {
  sceneTitle: "公車站牌",
  lines: [
    { speaker: "旁白", text: "小麥在公車站牌等車，百無聊賴地四處張望。" },
    { speaker: "旁白", text: "附近屋頂上，有一隻貓咪蹲坐著。" },
    { speaker: "小麥", text: "咦，是貓。" },
    { speaker: "旁白", text: "牠的眼神直直盯著對面屋頂，尾巴微微晃動，像是在測量距離。" },
    { speaker: "小麥", text: "等等……該不會想跳過去吧？" },
    { speaker: "旁白", text: "兩棟屋頂之間的距離相當遠，小麥心裡才剛覺得「不可能吧」。" },
    { speaker: "旁白", text: "那隻貓已經自信滿滿地跳了出去。" },
    { speaker: "小麥", text: "啊！" },
    { speaker: "旁白", text: "果然如預料般，貓咪沒能成功落地，兩隻小手狼狽地搆在屋頂邊緣，眼看就要掉下去。" },
    { speaker: "小麥", text: "怎麼辦！" },
    { speaker: "小貝狗", text: "就是現在，快！" },
    { speaker: "小麥", text: "好，我來拍！" },
  ] as const,
  postPhotoLines: [
    { speaker: "旁白", text: "快門聲落下的瞬間，貓咪的身影被吸進相片裡。" },
    { speaker: "小麥", text: "拍、拍到了……" },
    { speaker: "小貝狗", text: "真是驚險呀，不過這傢伙還是那麼亂來。" },
    { speaker: "小麥", text: "明明看起來那麼有自信，結果根本跳不過去嘛……" },
  ] as const,
};

export const STREET_MELODY_CHICKEN_PRELUDE_EVENT_COPY = {
  sceneTitle: "街道",
  lines: [
    {
      speaker: "旁白",
      text: "走到半路上，和小貝狗在聊著天，公司群組傳來消息，引起你的不安。",
    },
    { speaker: "小麥", text: "……" },
    { speaker: "小貝", text: "怎麼怎麼" },
    { speaker: "旁白", text: "專注的在想群組訊息怎麼回應，完全忽略小貝狗的聲音" },
    { speaker: "旁白", text: "那個旋律再次響起" },
    { speaker: "小麥", text: "啊！抱歉，我回好了，我們繼續聊天" },
  ] as const,
  effect: "獲得一段旋律",
};

export const OFFICE_SUNBEAST_CHICKEN_EVENT_COPY = {
  sceneTitle: "公司",
  workFatigueIncrease: 25,
  lines: [
    { speaker: "主管", text: "小麥，請妳幫我處理好這份文件，下班前需要完成。" },
    { speaker: "小麥", text: "好" },
    { speaker: "小麥", text: "又是...這麼臨時呢....似乎突然有很重要的案子", innerThought: true },
    { speaker: "小麥", text: "哇，一做完就快要七點半了，趕快交給主管" },
    { speaker: "小麥", text: "主管，我完成了，你要先看過嗎" },
    { speaker: "主管", text: "..." },
    { speaker: "小麥", text: "主管在忙著講電話呀，對她揮手也沒看到", innerThought: true },
    { speaker: "小麥", text: "這樣不知道什麼時候可以下班" },
    { speaker: "旁白", text: "旋律聲" },
    {
      speaker: "小貝狗",
      text: "哦 出現是雉雞，牠總是喜歡自己一個人專心的忘我，但我總是不知道牠在做什麼就是了",
    },
    { speaker: "小麥", text: "好 那就把你拍下來" },
  ] as const,
  postPhotoLines: [
    { speaker: "小麥", text: "哇！這就是心流的狀態嗎？真難拍" },
    { speaker: "主管", text: "啊！小麥你在這多久了呀，是來找我嗎" },
    { speaker: "小麥", text: "對，下午叫我處理的資料我完成了" },
    { speaker: "主管", text: "太好了！那妳趕快下班吧" },
  ] as const,
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

export const METRO_SUNBEAST_GOAT_EVENT_COPY = {
  sceneTitle: "捷運站",
  lines: [
    { speaker: "小麥", text: "啊 太晚出門，來到人潮最多的時刻，但再不上車廂，上班就要遲到了" },
    { speaker: "小貝狗", text: "哦 當人真累呀" },
    { speaker: "旁白", text: "進車廂" },
    { speaker: "小麥", text: "真是快被擠扁呀" },
    { speaker: "小貝狗", text: "我已經被擠扁" },
    { speaker: "旁白", text: "出車站" },
    { speaker: "小麥", text: "已經快來不及了呀，人潮好多，今天用走的上電扶梯好了" },
    { speaker: "小麥", text: "怎麼走到一半就卡住，好險有抬頭看，不然就要撞到前面的人" },
    { speaker: "小麥", text: "是為什麼卡住呀（抬頭瞧）" },
    { speaker: "小麥", text: "蛤 是一隻山羊嗎？" },
    { speaker: "小貝狗", text: "這帥氣的眼神，是牠，不畏懼世俗路人的眼光" },
    { speaker: "小麥", text: "OK，為了不上班遲到" },
  ] as const,
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

export const STREET_FORGOT_LUNCH_FROG_EVENT_COPY = {
  unlockEffect: "解鎖新地點：便利商店",
  streetLines: [
    { speaker: "小麥", text: "啊！忘記帶便當出門了" },
    { speaker: "小貝狗", text: "要不要回家拿" },
    { speaker: "小麥", text: "現在如果再回去可能會來不及上班" },
    { speaker: "小麥", text: "中午去便利商店買東西吃好了" },
    { speaker: "小貝狗", text: "好耶，說不定會有新發現" },
  ] as const,
  officeLine: { speaker: "小麥", text: "肚子餓了，去便利商店買午餐" } as const,
  martLines: [
    { speaker: "小麥", text: "有一個新品日式烏冬冷麵耶" },
    { speaker: "小貝狗", text: "看起來好好吃" },
    { speaker: "店員", text: "要微波嗎？" },
    { speaker: "店員", text: "啊！不對" },
    { speaker: "旁白", text: "店員意識講錯話，尷尬地紅了臉。" },
    { speaker: "小麥", text: "店員頭上冒出了青蛙，小貝狗這是...." },
    { speaker: "小貝狗", text: "沒錯" },
  ] as const,
  postPhotoLines: [
    { speaker: "小麥", text: "想不到忘記帶便當，會有意外的收穫" },
    { speaker: "小貝狗", text: "塞翁失馬焉知非福耶" },
    { speaker: "小麥", text: "肚子好餓，快帶回去吃飯了" },
  ] as const,
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
  ownerChat:
    "你內用時，老闆娘笑著跟你聊了幾句，提到最近新開了一班公車，從這附近搭去公司方便很多，站牌就在前面不遠。",
  takeoutResult: "你選擇外帶，拿到餐點後邊走邊吃，精神慢慢回來一些。",
  dineInResult: "你坐下來慢慢吃完，身體放鬆很多，但也多花了一點時間。",
  leaveResult: "你看了看時間，決定先離開，準備直接上路。",
  takeoutEffect: "儲蓄 -1 / 疲勞值 -5",
  dineInEffect: "儲蓄 -1 / 行動力 -1 / 疲勞值 -8",
  leaveEffect: "本次不消耗資源",
  unlockBusStopEffect: "解鎖新地點：公車站",
};

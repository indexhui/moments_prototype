import { FROG_B_CLUE_TEXT, FROG_EVENT_VARIANT } from "@/lib/game/frogVariant";

export type GameEventId =
  | "breakfast-bus-stop-unlock"
  | "bus-sunbeast-cat"
  | "convenience-store-hub"
  | "office-sunbeast-chicken"
  | "office-sunbeast-goat"
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
  | "metro-elevator-goat-prelude"
  | "street-dodge-goat-prelude"
  | "mart-one-dollar-goat-prelude"
  | "breakfast-shop-choice"
  | "park-hub"
  | "park-gossip"
  | "street-cookie-sale"
  | "street-vision-expo-promo"
  | "street-forgot-lunch-frog"
  | "street-comfy-breeze"
  | "street-humid-weather";

export type GameEventMeta = {
  id: GameEventId;
  title: string;
  cheatShortcut?: boolean;
};

const MELODY_EVENT_IDS = new Set<GameEventId>([
  "office-sunbeast-chicken",
]);

export const GAME_EVENT_LIST: GameEventMeta[] = [
  { id: "breakfast-bus-stop-unlock", title: "早餐店：新公車情報（解鎖公車）", cheatShortcut: true },
  { id: "bus-sunbeast-cat", title: "公車：小日獸（貓）", cheatShortcut: true },
  { id: "convenience-store-hub", title: "便利商店：購物/看看/離開", cheatShortcut: true },
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
  { id: "metro-elevator-goat-prelude", title: "捷運：山羊線索（電梯面對面）", cheatShortcut: true },
  { id: "street-dodge-goat-prelude", title: "街道：山羊線索（走路閃人）", cheatShortcut: true },
  { id: "mart-one-dollar-goat-prelude", title: "便利商店：山羊線索（一塊錢結帳）", cheatShortcut: true },
  { id: "office-sunbeast-goat", title: "公司：小日獸（山羊）", cheatShortcut: true },
  { id: "breakfast-shop-choice", title: "早餐店：外帶或內用", cheatShortcut: true },
  { id: "park-hub", title: "公園：休息/探索", cheatShortcut: true },
  { id: "park-gossip", title: "公園：打聽消息", cheatShortcut: true },
  { id: "street-cookie-sale", title: "街道：手工餅乾推銷", cheatShortcut: true },
  { id: "street-vision-expo-promo", title: "街道：放視大賞行銷素材", cheatShortcut: true },
  {
    id: "street-forgot-lunch-frog",
    title: FROG_EVENT_VARIANT === "B" ? "街道：健忘助人（青蛙B）" : "街道：忘記便當（青蛙A）",
    cheatShortcut: true,
  },
  { id: "street-comfy-breeze", title: "街道：今天的風很舒服" },
  { id: "street-humid-weather", title: "街道：今天好濕悶" },
].map(
  (event): GameEventMeta =>
    MELODY_EVENT_IDS.has(event.id as GameEventId)
      ? ({ ...event, cheatShortcut: false } as GameEventMeta)
      : (event as GameEventMeta),
);

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
  line1: "好累喔，昨天根本沒睡好……",
  line2: "嗯？怎麼感覺包裡有東西在動……",
  line3: "哇！你什麼時候偷鑽進來的！",
  line4: "啵啵！「小日獸」！「小日獸」！",
  line5: "你居然會講話！",
  line6: "小日……什麼？",
  line7: "呃！捷運上怎麼會有黃金獵犬？",
  line8: "小日獸！小日獸！",
  line9: "那隻該不會就是……你說的小日獸？",
  line10: "他的尾巴好像被夾住了……",
  line11: "啊！你是要我去幫助他嗎？",
  line12: "拍照！拍照！",
  line13: "拍照……？可是我沒有相機……",
  line14: "哇啊啊啊！",
  line15: "拍照！拍照！",
  line16: "這樣嗎……？",
  line17: "咦？那隻黃金獵犬去哪了？",
  line18: "啵啵！日記！日記！",
  line19: "這是……我早上隨手帶出的小白日記本……",
};

export const METRO_ELEVATOR_GOAT_PRELUDE_EVENT_COPY = {
  sceneTitle: "捷運站",
  introLines: [
    { speaker: "旁白", text: "捷運站連通層的電梯前，已經排了一小串人。" },
    { speaker: "小麥", text: "（剛好趕上這班，太好了。）", innerThought: true },
    { speaker: "旁白", text: "「叮」的一聲，電梯門打開，眾人魚貫地走進來。" },
    { speaker: "旁白", text: "小麥被人潮推到電梯最裡側，習慣性地轉過來面對門口。" },
    { speaker: "旁白", text: "「叮咚」門關。下一秒，小麥就察覺到了那個視線。" },
    { speaker: "小麥", text: "（嗯？前面這位先生...怎麼一直看著我？）", innerThought: true },
    { speaker: "旁白", text: "對方就站在小麥面前，不到三十公分的距離。" },
    { speaker: "旁白", text: "那雙眼睛直直地盯著小麥，沒有要移開的意思。" },
    { speaker: "小麥", text: "（是我臉上有東西？還是衣服哪裡怪怪的？）", innerThought: true },
    { speaker: "小麥", text: "（不對，這個距離...這個視線...也太尷尬了吧！）", innerThought: true },
  ] as const,
  choicePrompt: "電梯還在上升，你會怎麼做？",
  options: {
    endure: {
      label: "忍住，電梯很快就到了",
      description: "假裝在看樓層燈，撐到開門",
    },
    turn: {
      label: "轉過來，背對他",
      description: "寧可面壁，也不想再對到眼",
    },
  } as const,
  endureResultLines: [
    { speaker: "小麥", text: "（沒事的沒事的，再幾秒就到了...）", innerThought: true },
    { speaker: "旁白", text: "小麥把視線往上飄，盯著樓層顯示燈一格一格慢慢地跳。" },
    { speaker: "旁白", text: "但餘光裡，那個人還是直直地看著她，沒有移開。" },
    { speaker: "小麥", text: "（怎麼這麼慢...電梯是不是壞了？）", innerThought: true },
    { speaker: "小麥", text: "（這個人到底是怎麼回事啊！這樣盯著陌生人不會不好意思嗎！）", innerThought: true },
    { speaker: "旁白", text: "「叮——」電梯門終於打開。" },
    { speaker: "旁白", text: "小麥幾乎是用衝的走出電梯，連回頭都不敢。" },
    { speaker: "小麥", text: "（呼...剛剛那是什麼啊，今天的開頭也太衰了吧）", innerThought: true },
  ] as const,
  endureEffect: "心情大幅變差（疲勞值 +15）",
  turnResultLines: [
    { speaker: "小麥", text: "（算了，不想再看到他了，轉過去！）", innerThought: true },
    { speaker: "旁白", text: "小麥下定決心，慢慢地、僵硬地把身體轉了一百八十度。" },
    { speaker: "旁白", text: "眼前——是一面冷冰冰的金屬內牆。" },
    { speaker: "小麥", text: "（嗯...雖然有點蠢，盯著電梯內側發呆...）", innerThought: true },
    { speaker: "小麥", text: "（但比起跟陌生人面對面，看牆壁好像沒這麼糟？）", innerThought: true },
    { speaker: "旁白", text: "電梯抵達後，小麥裝作什麼事都沒發生，迅速跟著人潮走出去。" },
  ] as const,
  turnEffect: "心情小幅變差（疲勞值 +5）",
  hint: "❓❓❓ 剛才那個人的眼神...好像有點不太一樣？",
};

export const STREET_DODGE_GOAT_PRELUDE_EVENT_COPY = {
  sceneTitle: "街道",
  introLines: [
    { speaker: "旁白", text: "上班的街道，行人三三兩兩地往各自方向移動。" },
    { speaker: "小麥", text: "（時間還夠，慢慢走過去就好。）", innerThought: true },
    { speaker: "旁白", text: "前方不遠處，有一位低著頭滑手機的路人正朝小麥這個方向走來。" },
    { speaker: "旁白", text: "兩人之間的距離越來越短，小麥下意識地往左邊偏了一點。" },
    { speaker: "旁白", text: "對方也跟著往他的右邊（小麥這側）偏了一點。" },
    { speaker: "小麥", text: "（嗯？怎麼往同邊走了？）", innerThought: true },
    { speaker: "旁白", text: "小麥試著往右邊閃，對方又跟著往他的左邊靠過來。" },
    { speaker: "小麥", text: "（不是吧...真的假的？這也太巧了吧！）", innerThought: true },
    { speaker: "旁白", text: "短短幾秒之內，他們就這樣左、右、左、右地跳了三回合。" },
    { speaker: "旁白", text: "距離只剩三步，再不做決定就要撞上了。" },
  ] as const,
  choicePrompt: "眼看就要撞上，你會怎麼做？",
  options: {
    straight: {
      label: "直直走！他會閃開的！",
      description: "賭一把對方會讓路",
    },
    dodge: {
      label: "往旁邊閃！",
      description: "再讓一次，總會錯開吧",
    },
  } as const,
  straightResultLines: [
    { speaker: "小麥", text: "（不要再閃了！這次直直走，他一定會閃開！）", innerThought: true },
    { speaker: "旁白", text: "小麥咬牙穩住步伐，眼神專注地直視前方。" },
    { speaker: "旁白", text: "就在快要撞上的瞬間，對方終於抬起頭，慌張地往旁邊跨了一大步。" },
    { speaker: "路人", text: "啊！抱歉抱歉！" },
    { speaker: "小麥", text: "沒事沒事！" },
    { speaker: "旁白", text: "錯身而過後，小麥忍不住嘴角微微上揚。" },
    { speaker: "小麥", text: "（嘿嘿...今天的我，意外地有種莫名的勇氣呢。）", innerThought: true },
  ] as const,
  straightEffect: "心情上升（疲勞值 -5）",
  dodgeResultLines: [
    { speaker: "小麥", text: "（算了算了，讓他先過好了。）", innerThought: true },
    { speaker: "旁白", text: "小麥趕緊往旁邊跨了一大步，停下來等對方先通過。" },
    { speaker: "旁白", text: "對方一路低頭滑手機，從頭到尾都沒注意到差點撞上的事。" },
    { speaker: "旁白", text: "從小麥面前，毫無察覺地直直走過去。" },
    { speaker: "小麥", text: "（呼...至少沒撞到。）", innerThought: true },
    { speaker: "小麥", text: "（可是...怎麼有點不甘心啊，明明是他沒在看路。）", innerThought: true },
  ] as const,
  dodgeEffect: "心情小幅變差（疲勞值 +5）",
  hint: "❓❓❓ 為什麼剛才會這樣不停跟著閃同邊呢？",
};

export const MART_ONE_DOLLAR_GOAT_PRELUDE_EVENT_COPY = {
  sceneTitle: "便利商店",
  introLines: [
    { speaker: "旁白", text: "小麥拿著要買的東西，走到櫃台後方排隊。" },
    { speaker: "旁白", text: "前面只有一位客人，看起來應該很快就會輪到。" },
    { speaker: "小麥", text: "（太好了，這個時間還不算太晚。）", innerThought: true },
    { speaker: "旁白", text: "結果那位客人在櫃台上推了一大堆商品。" },
    { speaker: "店員", text: "總共是六百七十五元。" },
    { speaker: "前面的客人", text: "嗯，我用零錢付。" },
    { speaker: "旁白", text: "客人從口袋掏出一個鼓鼓的小袋子，倒出一堆叮叮噹噹的硬幣到櫃台上。" },
    { speaker: "旁白", text: "全部都是一塊錢。" },
    { speaker: "小麥", text: "（呃？全部都是一塊？六百多塊用一塊一塊數嗎？）", innerThought: true },
    { speaker: "旁白", text: "「一、二、三、四...」客人一個一個慢慢數，店員只能在旁邊耐心等。" },
    { speaker: "旁白", text: "小麥後方陸續又來了三、四個客人，隊伍越拉越長。" },
    { speaker: "旁白", text: "後面的人開始小聲嘆氣，有人偷偷探頭看櫃台情況。" },
    { speaker: "小麥", text: "（這...真的要繼續排嗎？看起來還要好一陣子。）", innerThought: true },
  ] as const,
  choicePrompt: "硬幣才數到一百多，你會怎麼做？",
  options: {
    stay: {
      label: "繼續排隊",
      description: "都排到一半了，再撐一下",
    },
    leave: {
      label: "離開",
      description: "把東西放回去，直接走人",
    },
  } as const,
  stayResultLines: [
    { speaker: "小麥", text: "（沒辦法，已經排這麼久了，再等一下就好。）", innerThought: true },
    { speaker: "旁白", text: "「⋯五百二十一、五百二十二⋯」硬幣的聲音持續了好幾分鐘。" },
    { speaker: "旁白", text: "終於，客人數完了。店員雙手接過，又重新核對了一次。" },
    { speaker: "旁白", text: "輪到小麥時，她迅速結帳、抓著東西走出店門。" },
    { speaker: "小麥", text: "（總算買到了...咦？等等，現在幾點了？）", innerThought: true },
    { speaker: "旁白", text: "看了一眼手機，小麥倒抽一口氣。" },
    { speaker: "小麥", text: "（糟糕！這樣到公司一定會遲到！）", innerThought: true },
  ] as const,
  stayEffect: "排隊太久遲到，被公司扣錢（儲蓄 -2）",
  leaveResultLines: [
    { speaker: "小麥", text: "（不行了，再等下去真的要遲到。）", innerThought: true },
    { speaker: "旁白", text: "小麥把手上的商品默默放回旁邊的貨架，轉身離開了便利商店。" },
    { speaker: "旁白", text: "走出店門時，店內還傳來「⋯一百八十六、一百八十七⋯」的數錢聲。" },
    { speaker: "小麥", text: "（什麼都沒買到，肚子還餓著...）", innerThought: true },
    { speaker: "小麥", text: "（今天的開頭，到底是怎樣啊。）", innerThought: true },
  ] as const,
  leaveEffect: "心情大幅變差（疲勞值 +15）",
  hint: "❓❓❓ 那個堅持用一塊錢結帳的人...是不是有點不一樣？",
};

export const OFFICE_SUNBEAST_GOAT_EVENT_COPY = {
  sceneTitle: "公司會議室",
  workFatigueIncrease: 25,
  meetingOneLines: [
    { speaker: "旁白", text: "週三的例行會議。投影機嗡嗡作響，主管把這週的進度表打到牆上。" },
    { speaker: "小麥", text: "（希望今天的會議不要拖太久...）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "旁白", text: "牆上的時鐘剛走過十點十五分，會議室裡只剩下一個空位。" },
    { speaker: "主管", text: "好，那我們就先從這週的進度開始⋯⋯" },
    { speaker: "旁白", text: "話還沒說完，會議室的門「喀」一聲被推開——" },
    { speaker: "旁白", text: "同事 A 拎著筆電，神情自若地走了進來，沒有半點趕的樣子。" },
    { speaker: "主管", text: "A，你又遲到了。" },
    { speaker: "主管", text: "這個月已經是第四次。我跟你說過很多次了，能不能稍微注意一下？" },
    { speaker: "同事 A", text: "⋯⋯嗯。" },
    { speaker: "旁白", text: "同事 A 沒有解釋、也沒有道歉，逕自走到自己的位子坐下，打開筆電。" },
    { speaker: "小麥", text: "（哇⋯這個態度，根本就是一臉不在乎吧。）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（不過⋯遲到歸遲到，主管唸他的時候，他連眉頭都沒皺一下耶。）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷！嗷！小麥小麥，我跟你說喔——", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "（噓——！你不要這個時候鑽出來啦，現在在開會！）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "可是—— 可是——", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "（晚一點再說！先給我乖乖待在包包裡。）", innerThought: true, avatarSpriteId: "mai" },
  ] as const,
  meetingTwoLines: [
    { speaker: "旁白", text: "進度報告告一段落，主管翻到下一頁簡報。" },
    { speaker: "主管", text: "接著要檢討這週的工作日誌，整體完成度比預期的低不少。" },
    { speaker: "主管", text: "特別是有幾位同事，紀錄⋯⋯幾乎是空白。" },
    { speaker: "旁白", text: "主管的視線掃過整張會議桌，最後停在同事 A 身上。" },
    { speaker: "主管", text: "A，這週你只寫了兩個字。" },
    { speaker: "同事 A", text: "⋯⋯好。" },
    { speaker: "旁白", text: "又是一句沒有任何溫度的回應，連辯解都不打算。" },
    { speaker: "小麥", text: "（咦？同事 A 以前明明會把日誌寫得超詳細的耶。）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（甚至還會在末段寫一些自己對案子的小心得⋯）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（這兩個月不知道怎麼回事，整個人都變了個樣⋯）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷！就是他！就是他！小麥，他就是小日獸！", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "（咦？真的嗎？可是我什麼都沒看到啊？）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷～再等一下！我感覺得到，牠快要顯出真身了！", avatarSpriteId: "beigo" },
    { speaker: "小貝狗", text: "牠在裡面已經很躁動了⋯⋯只差一個契機。", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "（契機⋯什麼意思啊？）", innerThought: true, avatarSpriteId: "mai" },
  ] as const,
  meetingThreeLines: [
    { speaker: "旁白", text: "會議來到下半段，老闆走進會議室，親自加入了討論。" },
    { speaker: "老闆", text: "關於這個案子的方向，我研究過之後，覺得我們應該往 A 方向走。" },
    { speaker: "老闆", text: "這樣可以最快切入市場，營收回收期也最短，風險最小。" },
    { speaker: "同事 B", text: "我覺得老闆這個觀點很合理。" },
    { speaker: "同事 C", text: "對啊，從預算的角度看，A 方向確實風險小。" },
    { speaker: "同事 D", text: "我也同意，早一點切入比較有利。" },
    { speaker: "旁白", text: "一片附和聲此起彼落，整個會議室的氣氛瞬間就倒向了同一邊。" },
    { speaker: "旁白", text: "就在所有人準備收尾這個討論時，桌邊「碰」的一聲——" },
    { speaker: "同事 A", text: "⋯⋯我不同意。" },
    { speaker: "旁白", text: "同事 A 的手掌就那樣按在桌上，沒有用力拍，但聲響足以讓全場安靜下來。" },
    { speaker: "同事 A", text: "我們應該走 B 方向。不應該被短期營收綁架。" },
    { speaker: "旁白", text: "靜默。所有人的視線都集中在同事 A 身上。" },
    { speaker: "小麥", text: "（咦⋯⋯？）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（同事 A 的頭上⋯⋯是不是有什麼東西在動？）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "旁白", text: "那一瞬間，小麥以為自己眼花了。" },
    { speaker: "小麥", text: "（剛才⋯好像看到⋯不對，再看一次。）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "旁白", text: "她揉了揉眼睛，重新望向同事 A。" },
    { speaker: "旁白", text: "沒有錯——他的太陽穴上方，浮現出兩道淡淡的、半透明的彎角。" },
    { speaker: "旁白", text: "弧度漂亮得像古老的山羊角，隨著他每一次說話的語氣，微微地擺動。" },
    { speaker: "旁白", text: "而他的眼神，此刻也比平時更加銳利、更野。" },
    { speaker: "小貝狗", text: "就、是、牠！！山羊！小日獸是山羊！", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "（果然是真的⋯⋯！可是現在在開會啊！要怎麼拿出相機拍！）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "老闆", text: "A，你冷靜一點。你說的方向我們之前評估過了。" },
    { speaker: "同事 A", text: "你們的評估根本沒考慮到後端的維護成本。" },
    { speaker: "老闆", text: "那是技術部門的事——" },
    { speaker: "同事 A", text: "不，那是整個案子能不能活下去的事。" },
    { speaker: "旁白", text: "老闆的眉頭皺了起來，會議桌邊的同事們開始坐立不安。" },
    { speaker: "同事 B", text: "A、A、先冷靜一下嘛，有話好說——" },
    { speaker: "同事 C", text: "對啊對啊，這個我們會後再討論⋯⋯" },
    { speaker: "同事 D", text: "氣氛變這麼僵⋯⋯老闆要不要先休息一下？" },
    { speaker: "旁白", text: "同事們紛紛站起來，圍到會議桌中央，試圖緩和氣氛。" },
    { speaker: "旁白", text: "原本整齊的會議室，瞬間變得人聲鼎沸。" },
    { speaker: "小麥", text: "（機會來了！現場這麼亂，沒有人會注意到我！）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（我躲到最後面⋯⋯偷偷拿出相機，把這對角拍下來！）", innerThought: true, avatarSpriteId: "mai" },
  ] as const,
  postPhotoLines: [
    { speaker: "旁白", text: "「咔嚓——」快門聲被會議室的喧嘩聲完美地蓋過去。" },
    { speaker: "小麥", text: "拍到了！剛剛那對角的弧度⋯超清楚的！", avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷！那就是山羊。外型帥氣，但個性叛逆又野。", avatarSpriteId: "beigo" },
    { speaker: "小貝狗", text: "牠最討厭被群體拉著走——越多人說「應該這樣」，牠就越想頂回去。", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "難怪同事 A 最近的反應都這麼直接⋯原來是被牠影響了。", avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "其實⋯⋯說不定剛好相反唷。", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "什麼意思？", avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷～小日獸不是憑空出現的。是同事 A 心裡某個壓抑很久的東西⋯⋯把牠召喚出來的喔。", avatarSpriteId: "beigo" },
    { speaker: "小貝狗", text: "他可能一直都不喜歡這樣附和的氛圍，只是以前選擇了忍耐。", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "⋯⋯所以那個跩跩的眼神，其實是他真正想說的話。", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小貝狗", text: "嗷～不過那種眼神，真的有點欠揍就是了。", avatarSpriteId: "beigo" },
    { speaker: "小麥", text: "哈哈！這倒是真的。", avatarSpriteId: "mai" },
    { speaker: "旁白", text: "會議室裡，老闆和同事 A 的火氣也漸漸平息下來。" },
    { speaker: "老闆", text: "好吧⋯⋯你的意見我會再評估。今天就先這樣，散會。" },
    { speaker: "旁白", text: "同事們陸續走出會議室，氣氛還有點微妙。" },
    { speaker: "小麥", text: "（希望同事 A 能找到自己舒服的方式表達⋯不要每次都這樣硬碰硬。）", innerThought: true, avatarSpriteId: "mai" },
    { speaker: "小麥", text: "（不過⋯能堅持自己想法的人，其實也很帥啦。）", innerThought: true, avatarSpriteId: "mai" },
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

export const STREET_VISION_EXPO_PROMO_EVENT_COPY = {
  sceneTitle: "街道",
  comicImages: {
    vision01: {
      src: "/images/promo/comic_content_vision_01.png",
      alt: "放視大賞宣傳漫畫",
    },
    vision02: {
      src: "/images/promo/comic_content_vision_02.png",
      alt: "放視大賞獨立遊戲展區宣傳漫畫",
    },
  },
  lines: [
    { speaker: "小麥", text: "接下來要去哪找跑出去的動物們", avatarSpriteId: "mai", avatarFrameIndex: 36, thoughtSwitch: true },
    { speaker: "小貝狗", text: "高雄", avatarSpriteId: "beigo", avatarFrameIndex: 0 },
    { speaker: "小麥", text: "高雄？", avatarSpriteId: "mai", avatarFrameIndex: 14 },
    { speaker: "小貝狗", text: "對 高雄 放視大賞", avatarSpriteId: "beigo", avatarFrameIndex: 2, comicImageId: "vision01" },
    { speaker: "小麥＆小貝狗", text: "我們將會在獨立遊戲展區出現喔！", avatarSpriteId: "mai", avatarFrameIndex: 1, comicImageId: "vision02" },
    { speaker: "小麥＆小貝狗", text: "快來和我們一起來找找小日獸們", avatarSpriteId: "mai", avatarFrameIndex: 1, comicImageId: "vision02" },
  ] as const,
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

export const STREET_FORGOT_LUNCH_FROG_A_EVENT_COPY = {
  streetLines: [
    { speaker: "小麥", text: "啊！今天忘記帶便當出門了" },
    { speaker: "小貝狗", text: "要不要回家拿" },
    { speaker: "小麥", text: "現在如果再回去可能會來不及上班" },
    { speaker: "小麥", text: "只好去便利商店買了。" },
    { speaker: "小麥", text: "但今天應該會很忙，中午大概跑不出來，先去便利商店買好涼麵放冰箱好了" },
  ] as const,
  martLines: [
    { speaker: "小麥", text: "涼麵有新口味椰，來試試看" },
    { speaker: "店員", text: "請問要微波嗎" },
    { speaker: "店員", text: "啊抱歉" },
    { speaker: "旁白", text: "店員意識講錯話，尷尬地紅了臉。" },
    { speaker: "小麥", text: "店員頭上冒出了青蛙，小貝狗這是...." },
    { speaker: "小貝狗", text: "沒錯" },
  ] as const,
  postPhotoLines: [
    { speaker: "小麥", text: "想不到早上先來買涼麵，會有意外的收穫" },
    { speaker: "小貝狗", text: "塞翁失馬焉知非福耶" },
  ] as const,
};

export const STREET_FORGOT_LUNCH_FROG_B_EVENT_COPY = {
  clue: FROG_B_CLUE_TEXT,
  homeLines: [
    { speaker: "旁白", text: "上班日的早晨，小麥整理好包包，準備出門去上班。" },
    { speaker: "旁白", text: `出門前看見運勢占卜寫著：「${FROG_B_CLUE_TEXT}」` },
  ] as const,
  streetIntroLines: [
    { speaker: "小麥", text: "奇怪，我是不是忘記了什麼⋯⋯？" },
    { speaker: "小貝狗", text: "嗷！嗷嗷！" },
    { speaker: "小麥", text: "小貝狗！？你怎麼又偷跟出來了啦！" },
    { speaker: "旁白", text: "被小貝狗一打岔，小麥原本快想起來的事又從腦中溜走了。" },
  ] as const,
  orangeIntroLines: [
    { speaker: "旁白", text: "路口前，一位阿姨剛買的橘子滾了一地。" },
    { speaker: "旁白", text: "行人號誌快要轉紅，阿姨彎腰撿著撿著，臉上越來越窘迫。" },
  ] as const,
  orangeChoicePrompt: "即將紅燈了，你會怎麼做？",
  orangeOptions: {
    ignore: {
      label: "A. 無視",
      description: "先趕去上班",
    },
    help: {
      label: "B. 幫忙撿橘子",
      description: "趕緊幫阿姨把橘子撿回袋子裡",
    },
  },
  orangeIgnoreLines: [
    { speaker: "旁白", text: "小麥看了看時間，決定先趕去公司。" },
    { speaker: "小麥", text: "結果到了辦公室才發現，今天忘了帶午餐。" },
    { speaker: "旁白", text: "那天，小麥只好餓著肚子撐到回家。" },
  ] as const,
  orangeHelpLines: [
    { speaker: "旁白", text: "小麥趕緊蹲下來，幫阿姨把散落的橘子一顆顆撿回袋子裡。" },
    { speaker: "阿姨", text: "謝謝妳，要不是妳幫忙，我真的不知道該怎麼辦。" },
    { speaker: "旁白", text: "阿姨為了道謝，塞給小麥一張附近餐廳的現金抵用券。" },
    { speaker: "小麥", text: "咦？剛剛好像聽到⋯⋯呱呱叫？" },
  ] as const,
  kidIntroLines: [
    { speaker: "旁白", text: "走了一小段路後，前方有個小孩跌倒在地。" },
    { speaker: "旁白", text: "他的屁股沾了一大片灰塵，旁邊幾個小孩忍不住笑了出來。" },
    { speaker: "旁白", text: "這時，小麥又聽見了奇怪的呱叫聲。" },
  ] as const,
  kidChoicePrompt: "小孩尷尬得低下頭，你會怎麼做？",
  kidOptions: {
    ignore: {
      label: "A. 無視",
      description: "假裝沒看見，繼續趕路",
    },
    help: {
      label: "B. 分濕紙巾",
      description: "把包裡的濕紙巾給他擦乾淨",
    },
  },
  kidIgnoreLines: [
    { speaker: "旁白", text: "小麥猶豫了一下，還是繼續往公司走去。" },
    { speaker: "小麥", text: "結果到了辦公室才發現，今天忘了帶午餐。" },
    { speaker: "旁白", text: "那天，小麥只好餓著肚子撐到回家。" },
  ] as const,
  kidHelpLines: [
    { speaker: "小麥", text: "你還好嗎？這個給你擦一下。" },
    { speaker: "旁白", text: "小麥打開包包拿濕紙巾時，忽然愣住了。" },
    { speaker: "小麥", text: "糟糕⋯⋯我忘了帶錢包，也忘了帶便當！" },
    { speaker: "小孩", text: "姐姐，妳包包裡那張抵用券的餐廳就在旁邊喔。" },
    { speaker: "小麥", text: "咦？真的耶⋯⋯謝謝你提醒我！" },
  ] as const,
  restaurantLines: [
    { speaker: "旁白", text: "小麥走進那間不知名餐廳，拿著抵用券換了一份涼麵。" },
    { speaker: "店員", text: "好的，涼麵一份。請問要幫您微波嗎？" },
    { speaker: "店員", text: "啊⋯⋯抱歉！我剛剛說錯了。" },
    { speaker: "旁白", text: "店員意識到自己講錯話，尷尬地紅了臉。" },
    { speaker: "小麥", text: "噗⋯⋯等等，呱呱叫聲變得更大了？" },
    { speaker: "旁白", text: "小麥抬頭一看，店員頭上竟然有一隻青蛙。" },
    { speaker: "小貝狗", text: "嗷嗷！小日獸！拍照！" },
  ] as const,
  postPhotoLines: [
    { speaker: "小麥", text: "收服到了⋯⋯青蛙小日獸！" },
    { speaker: "旁白", text: "日記本的空白頁發出微光，一篇小白的日記慢慢浮現。" },
    { speaker: "小麥", text: "要不是幫了阿姨，就不會有抵用券；要不是幫了小孩，也不會知道餐廳就在旁邊。" },
    { speaker: "小麥", text: "今天明明是健忘日，卻誤打誤撞變成了幸運日呢。" },
    { speaker: "小貝狗", text: "嗷！繼續抓捕小日獸，就可以一篇一篇把日記復原嗷！" },
  ] as const,
} as const;

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

import type { FrogDiaryClueStage } from "@/lib/game/frogDiaryClueFlow";

export const EXHIBITION_LOCALES = ["zh", "ja", "en"] as const;

export type ExhibitionLocale = (typeof EXHIBITION_LOCALES)[number];

export const DEFAULT_EXHIBITION_LOCALE: ExhibitionLocale = "zh";

export const EXHIBITION_LOCALE_OPTIONS: readonly {
  id: ExhibitionLocale;
  shortLabel: string;
  name: string;
  logo: string;
  logoAlt: string;
}[] = [
  {
    id: "zh",
    shortLabel: "中",
    name: "繁體中文",
    logo: "/images/exhibition/start/logo-zh.png",
    logoAlt: "走走小日",
  },
  {
    id: "ja",
    shortLabel: "日",
    name: "日本語",
    logo: "/images/exhibition/start/start-logo.png",
    logoAlt: "てくてく日和",
  },
  {
    id: "en",
    shortLabel: "EN",
    name: "English",
    logo: "/images/exhibition/start/logo-en.svg",
    logoAlt: "Ditto MOMENTS",
  },
] as const;

export function parseExhibitionLocale(value: string | null | undefined): ExhibitionLocale {
  if (value === "ja" || value === "en" || value === "zh") return value;
  if (value === "zh-Hant" || value === "zh-TW") return "zh";
  return DEFAULT_EXHIBITION_LOCALE;
}

export function getExhibitionHtmlLang(locale: ExhibitionLocale) {
  return locale === "zh" ? "zh-Hant" : locale;
}

export type ExhibitionLocalizedText = Record<ExhibitionLocale, string>;

export function getExhibitionText(
  locale: ExhibitionLocale,
  text: ExhibitionLocalizedText,
) {
  return text[locale];
}

export const EXHIBITION_UI_COPY = {
  brandName: { zh: "走走小日", ja: "てくてく日和", en: "Ditto MOMENTS" },
  menu: { zh: "選單", ja: "メニュー", en: "Menu" },
  openMenu: { zh: "開啟選單", ja: "メニューを開く", en: "Open menu" },
  close: { zh: "關閉", ja: "閉じる", en: "Close" },
  back: { zh: "返回", ja: "戻る", en: "Back" },
  closeSettings: { zh: "關閉設定", ja: "設定を閉じる", en: "Close settings" },
  history: { zh: "回顧", ja: "ログ", en: "History" },
  openHistory: { zh: "開啟對話回顧", ja: "会話ログを開く", en: "Open dialogue history" },
  historyEmpty: {
    zh: "目前還沒有可回顧的對話。",
    ja: "まだ会話ログはありません。",
    en: "There is no dialogue to review yet.",
  },
  eventHistory: { zh: "事件回顧", ja: "イベントログ", en: "Event History" },
  music: { zh: "背景音樂", ja: "BGM", en: "Music" },
  sfx: { zh: "遊戲音效", ja: "効果音", en: "Sound Effects" },
  musicOn: { zh: "關閉背景音樂", ja: "BGMをオフにする", en: "Turn music off" },
  musicOff: { zh: "開啟背景音樂", ja: "BGMをオンにする", en: "Turn music on" },
  sfxOn: { zh: "關閉遊戲音效", ja: "効果音をオフにする", en: "Turn sound effects off" },
  sfxOff: { zh: "開啟遊戲音效", ja: "効果音をオンにする", en: "Turn sound effects on" },
  language: { zh: "語言", ja: "言語", en: "Language" },
  loading: { zh: "讀取中...", ja: "読み込み中...", en: "Loading..." },
  officeDistrict: { zh: "公司附近街道", ja: "オフィス街", en: "Office District" },
  daytime: { zh: "白天", ja: "昼", en: "Daytime" },
  loadingProgress: { zh: "遊戲資源讀取進度", ja: "ゲームデータの読み込み進行状況", en: "Game asset loading progress" },
  mugiWalking: { zh: "小麥步行中", ja: "ムギが歩いている", en: "Mugi walking" },
  workDusk: {
    zh: "小麥繼續工作，窗外逐漸變成黃昏",
    ja: "ムギが仕事を続けるうち、窓の外が夕暮れに変わっていく",
    en: "Mugi keeps working as dusk settles outside the window",
  },
  mugiWorking: { zh: "小麥繼續在座位上工作", ja: "ムギが席で仕事を続けている", en: "Mugi continues working at her desk" },
  returnToTitle: { zh: "回到開始", ja: "タイトルへ戻る", en: "Return to Title" },
  cleanView: { zh: "純畫面模式", ja: "画面のみ表示", en: "Clean View" },
  hideInterface: { zh: "隱藏介面", ja: "UIを隠す", en: "Hide interface" },
  dialogSpeed: { zh: "對話速度", ja: "会話速度", en: "Text Speed" },
  typingChar: { zh: "逐字", ja: "1文字", en: "Letter" },
  typingDoubleChar: { zh: "雙字", ja: "2文字", en: "Pair" },
  typingPunctuated: { zh: "標點", ja: "句読点", en: "Phrase" },
  typingPause: { zh: "停頓", ja: "間を置く", en: "Pause" },
  speedFast: { zh: "快速", ja: "速い", en: "Fast" },
  speedStandard: { zh: "標準", ja: "標準", en: "Normal" },
  speedNatural: { zh: "自然", ja: "自然", en: "Natural" },
  speedSlow: { zh: "慢速", ja: "遅い", en: "Slow" },
  continue: { zh: "繼續", ja: "つづける", en: "Continue" },
  tapToContinue: { zh: "點擊繼續", ja: "タップしてつづける", en: "Tap to continue" },
  startPhoto: { zh: "開始拍照", ja: "撮影を始める", en: "Start Camera" },
  photographMomentling: { zh: "拍下小日獸", ja: "ヒビモンを撮ろう", en: "Photograph the Momentling" },
  photographFrogMomentling: { zh: "拍下青蛙小日獸", ja: "カエルのヒビモンを撮ろう", en: "Photograph the Frog Momentling" },
  photographFrogClue: { zh: "拍下青蛙線索", ja: "カエルの手がかりを撮ろう", en: "Photograph the Frog Clue" },
  metroPhotoHint: {
    zh: "點擊畫面或空白鍵捕捉小日獸",
    ja: "画面をタップするかスペースキーでヒビモンを撮影",
    en: "Tap the screen or press Space to capture the Momentling",
  },
  metroPhotoTutorial: {
    zh: "白框對準時，按下快門！",
    ja: "白い枠が重なったら、シャッターを押そう！",
    en: "Press the shutter when the white frame lines up!",
  },
  frogPhotoHintMoving: {
    zh: "等青蛙跳進取景框時，點擊畫面或按空白鍵拍照",
    ja: "カエルがフレームに入ったら、画面をタップするかスペースキーで撮影",
    en: "When the frog enters the frame, tap the screen or press Space",
  },
  frogPhotoHintStill: {
    zh: "點擊畫面或空白鍵捕捉青蛙小日獸",
    ja: "画面をタップするかスペースキーでカエルのヒビモンを撮影",
    en: "Tap the screen or press Space to capture the Frog Momentling",
  },
  frogPhotoTutorialMoving1: {
    zh: "青蛙會像螢幕保護程式一樣撞牆反彈。",
    ja: "カエルはスクリーンセーバーのように壁で跳ね返ります。",
    en: "The frog bounces off the edges like a screen saver.",
  },
  frogPhotoTutorialMoving2: {
    zh: "等牠跳進取景框時按下快門。",
    ja: "フレームに入った瞬間にシャッターを押しましょう。",
    en: "Press the shutter when it jumps into the frame.",
  },
  frogPhotoTutorialStill1: {
    zh: "把取景框對準青蛙小日獸的位置。",
    ja: "フレームをカエルのヒビモンに合わせましょう。",
    en: "Line up the frame with the Frog Momentling.",
  },
  frogPhotoTutorialStill2: {
    zh: "拍下牠跳出來的一瞬間。",
    ja: "飛び出した瞬間を撮影しましょう。",
    en: "Capture the moment it jumps out.",
  },
  turnDoorHandle: { zh: "逆時針滑動門把", ja: "ドアノブを反時計回りに回す", en: "Turn the handle counterclockwise" },
  photoRevealNaotaro: {
    zh: "黃金獵犬",
    ja: "ゴールデンレトリバー",
    en: "Golden Retriever",
  },
  boxGameTitle: { zh: "幫同事整理資料箱", ja: "同僚の資料箱を片づけよう", en: "Help Sort the File Boxes" },
  boxGameRewardHeading: { zh: "上午的小插曲", ja: "午前のひと幕", en: "A Morning Detour" },
  boxGameRewardLabel: { zh: "資料箱整理完成", ja: "資料箱の整理完了", en: "File Boxes Sorted" },
  boxGameFootnote: {
    zh: "箱子疊回櫃子，下班後就能趕回家確認小白的狀況",
    ja: "箱を棚に戻した。仕事が終わったら、急いでシロの様子を見に帰ろう",
    en: "The boxes are back in the cabinet. After work, Mugi can hurry home to check on Shiro.",
  },
  completeTitle: { zh: "展覽體驗完成", ja: "展示版クリア", en: "Exhibition Complete" },
  completeBody: {
    zh: "謝謝你陪小麥走完這段旅程。",
    ja: "ムギと一緒に歩いてくれて、ありがとう。",
    en: "Thank you for walking this journey with Mugi.",
  },
  restart: { zh: "重新開始", ja: "もう一度はじめる", en: "Play Again" },
  dayOneEnd: { zh: "第一天結束", ja: "1日目 終了", en: "End of Day One" },
  rest: { zh: "休息", ja: "おやすみ", en: "Rest" },
  stopAlarm: { zh: "關掉鬧鐘", ja: "アラームを止める", en: "Stop the Alarm" },
  stopAlarmLabel: { zh: "關掉鬧鐘，讓小麥起床", ja: "アラームを止めてムギを起こす", en: "Stop the alarm and wake Mugi" },
  office: { zh: "公司", ja: "会社", en: "Office" },
  morning: { zh: "上午", ja: "午前", en: "Morning" },
  tapOnceToContinue: { zh: "點一下繼續", ja: "タップしてつづける", en: "Tap to continue" },
  restoreInterface: { zh: "恢復介面", ja: "UIを表示", en: "Restore Interface" },
  openDiary: { zh: "打開日記", ja: "日記を開く", en: "Open Diary" },
  diary: { zh: "日記", ja: "日記", en: "Diary" },
  previousPage: { zh: "上一頁", ja: "前のページ", en: "Previous Page" },
  nextPage: { zh: "下一頁", ja: "次のページ", en: "Next Page" },
  diaryIllustration: { zh: "日記插圖", ja: "日記の挿絵", en: "Diary illustration" },
  unrevealedDiaryText: { zh: "尚未揭露的日記文字", ja: "まだ読めない日記の文章", en: "Diary text not yet revealed" },
  diaryUpdated: { zh: "日記更新了", ja: "日記が更新されました", en: "Diary Updated" },
  unlockDiaryEntry: { zh: "解鎖一篇日記", ja: "日記を1ページ解放", en: "Unlock a Diary Entry" },
  momentling: { zh: "小日獸", ja: "ヒビモン", en: "Momentling" },
  openMomentling: { zh: "查看小日獸", ja: "ヒビモンを見る", en: "View Momentling" },
  planRoute: { zh: "安排行程", ja: "ルートを決める", en: "Plan Route" },
  placeTileHint: { zh: "把拼圖放進空格。", ja: "ピースを空きマスに置こう。", en: "Place the tile in an empty slot." },
  removeTileHint: {
    zh: "拖到旁邊空白處，可以拿掉拼圖。",
    ja: "横の空いている場所へドラッグすると、ピースを外せます。",
    en: "Drag the tile to the empty area beside the board to remove it.",
  },
  tapOrDragTileHint: {
    zh: "點空格，或拖曳拼圖放上去。",
    ja: "空きマスをタップするか、ピースをドラッグして置こう。",
    en: "Tap an empty slot or drag the tile into place.",
  },
  tutorial: { zh: "教學", ja: "遊び方", en: "How to Play" },
  reopenTutorial: { zh: "重新打開教學", ja: "遊び方をもう一度見る", en: "Open how to play" },
  hint: { zh: "提示", ja: "ヒント", en: "Hint" },
  openHint: { zh: "查看正確答案提示", ja: "答えのヒントを見る", en: "View answer hint" },
  clueFound: { zh: "獲得線索", ja: "手がかりを入手", en: "Clue Found" },
  locationFound: { zh: "獲得地點", ja: "場所を発見", en: "Location Found" },
  hintFound: { zh: "獲得提示", ja: "ヒントを入手", en: "Hint Found" },
  momentlingDiaryHint: {
    zh: "小日獸會出現在日記\n提到的人、事、物",
    ja: "ヒビモンは日記に出てくる\n人・出来事・物に現れる",
    en: "Momentlings appear around the people,\nevents, and things mentioned in the diary.",
  },
  eachMomentlingUnlocksDiary: {
    zh: "每次遇到一隻小日獸，都會解鎖\n一篇小白寫下的交換日記",
    ja: "ヒビモンに出会うたび、\nシロが書いた交換日記が1ページ解放される",
    en: "Each Momentling you meet unlocks\none of Shiro's shared diary entries.",
  },
  metro: { zh: "捷運", ja: "地下鉄", en: "Metro" },
  street: { zh: "街道", ja: "街", en: "Street" },
  convenienceStore: { zh: "便利商店", ja: "コンビニ", en: "Convenience Store" },
  dessertShop: { zh: "甜點店", ja: "スイーツ店", en: "Dessert Shop" },
  goToStreet: { zh: "前往街道", ja: "街へ向かう", en: "Go to the Street" },
  gameLobby: { zh: "遊戲大廳", ja: "ゲームロビー", en: "Game Lobby" },
  nightHub: { zh: "前往夜間 Hub", ja: "夜のHubへ", en: "Go to Night Hub" },
  nextStep: { zh: "下一步", ja: "次へ", en: "Next" },
  restoreDiaryEntry: { zh: "還原這篇日記", ja: "この日記を復元する", en: "Restore This Entry" },
  relatedDiary: { zh: "相關的日記", ja: "関連する日記", en: "Related Diary Entry" },
  start: { zh: "開始", ja: "はじめる", en: "Start" },
  saturday: { zh: "星期六", ja: "土曜日", en: "Saturday" },
  weather: { zh: "天氣", ja: "天気", en: "Weather" },
  sunny: { zh: "晴天", ja: "晴れ", en: "Sunny" },
  retakeOffer: { zh: "這張可以免費重拍一次。要再試一次嗎？", ja: "この写真は一度だけ無料で撮り直せます。もう一度挑戦しますか？", en: "You can retake this photo once for free. Try again?" },
  freeRetake: { zh: "免費重拍", ja: "無料で撮り直す", en: "Free Retake" },
  keepThisPhoto: { zh: "收下這張", ja: "この写真にする", en: "Keep This Photo" },
  framingComplete: { zh: "取景完成", ja: "撮影完了", en: "Photo Captured" },
  keepPhoto: { zh: "收下照片", ja: "写真を残す", en: "Keep Photo" },
  retake: { zh: "重拍", ja: "撮り直す", en: "Retake" },
  takePhoto: { zh: "拍照", ja: "撮影", en: "Take Photo" },
  photoAccuracy: { zh: "拍攝精準度", ja: "撮影精度", en: "Photo Accuracy" },
  minimumScore: { zh: "需要至少", ja: "必要スコア", en: "Minimum required" },
  choosePhoto: { zh: "要留下哪一張照片？", ja: "どちらの写真を残しますか？", en: "Which photo would you like to keep?" },
  firstPhoto: { zh: "第一張", ja: "1枚目", en: "First Photo" },
  retakenPhoto: { zh: "重拍這張", ja: "撮り直した写真", en: "Retaken Photo" },
  capturedMemories: { zh: "捕捉的回憶", ja: "撮影した思い出", en: "Captured Memories" },
  goldenRetrieverMomentling: { zh: "黃金獵犬小日獸", ja: "ゴールデンレトリバーのヒビモン", en: "Golden Retriever Momentling" },
  frogMomentling: { zh: "青蛙小日獸", ja: "カエルのヒビモン", en: "Frog Momentling" },
  naotaroPhotoDescription: {
    zh: "為了趕上捷運，咻——地衝進車廂\n尾巴卻慢了一拍，被門夾個正著！\n不過看牠一臉傻樂，似乎完全沒影響好心情呢～",
    ja: "地下鉄に間に合おうと、勢いよく車内へ飛び込んだものの\n尻尾だけ一歩遅れて、ドアに挟まれてしまった！\nでも、この楽しそうな顔。ご機嫌にはまったく影響なさそう〜",
    en: "It dashed into the carriage to catch the metro—\nbut its tail was one beat too slow and got caught in the doors!\nJudging by that goofy grin, it didn't dampen its mood at all.",
  },
} as const satisfies Record<string, ExhibitionLocalizedText>;

export const EXHIBITION_WASHI_TAPE_LABELS = {
  park: { zh: "公園", ja: "公園", en: "Park" },
  station: { zh: "車站", ja: "駅", en: "Station" },
  "flower-shop": { zh: "花店", ja: "花屋", en: "Flower Shop" },
  bookstore: { zh: "書店", ja: "書店", en: "Bookstore" },
  market: { zh: "市場", ja: "市場", en: "Market" },
  checker: { zh: "格紋紙膠", ja: "チェック柄テープ", en: "Checkered Tape" },
  mart: { zh: "便利商店", ja: "コンビニ", en: "Convenience Store" },
  confetti: { zh: "彩點紙膠", ja: "ドット柄テープ", en: "Confetti Tape" },
  bridge: { zh: "天橋", ja: "歩道橋", en: "Footbridge" },
  district: { zh: "街道", ja: "街", en: "Street" },
  cafe: { zh: "咖啡店", ja: "カフェ", en: "Café" },
  "blue-scrap": { zh: "藍色紙膠", ja: "青いテープ", en: "Blue Tape" },
  "blue-yellow": { zh: "藍黃紙膠", ja: "青と黄のテープ", en: "Blue and Yellow Tape" },
  library: { zh: "圖書館", ja: "図書館", en: "Library" },
  dessert: { zh: "甜點店", ja: "スイーツ店", en: "Dessert Shop" },
  riverbank: { zh: "河堤", ja: "河川敷", en: "Riverbank" },
  school: { zh: "學校", ja: "学校", en: "School" },
  plaid: { zh: "彩格紙膠", ja: "カラーチェックテープ", en: "Plaid Tape" },
  alley: { zh: "巷口", ja: "路地", en: "Alley" },
} as const satisfies Record<string, ExhibitionLocalizedText>;

export function getExhibitionWashiTapeLabel(
  locale: ExhibitionLocale,
  tapeId: string,
  fallback: string,
) {
  return (EXHIBITION_WASHI_TAPE_LABELS as Record<string, ExhibitionLocalizedText>)[tapeId]?.[locale] ?? fallback;
}

export const EXHIBITION_WASHI_TAPE_COPY = {
  moveBookmark: { zh: "移動膠痕書籤", ja: "テープ跡のしおりを動かす", en: "Move the tape-mark bookmark" },
  slotOccupied: { zh: "這個膠痕已經貼好了", ja: "このテープ跡にはもう貼ってあります", en: "That tape mark is already filled." },
  decorativeTape: { zh: "這只是裝飾用的紙膠帶", ja: "これは飾り用のマスキングテープです", en: "This is only decorative tape." },
  shapeMismatch: { zh: "膠痕形狀不吻合", ja: "テープ跡の形が合いません", en: "The tape shape does not match the mark." },
} as const satisfies Record<string, ExhibitionLocalizedText>;

export const EXHIBITION_FROG_DIARY_TEXT = {
  zh: {
    title: "搬家",
    openingText: "今天和小麥請了搬家公司搬家。\n整理到一半，街道突然一陣騷動。",
    revealText: "原來有人玩球時不小心撞上發傳單的人，傳單瞬間散了一地。\n我和小麥只好先放下手邊的事，一起幫忙把傳單撿回來。",
    firstPuzzlePromptText: "今天和小麥請了搬家公司搬家。\n整理到一半，＿＿突然一陣騷動。",
    firstPuzzleText: "今天和小麥請了搬家公司搬家。\n整理到一半，街道突然一陣騷動。",
    secondPuzzlePromptText: "幫忙把傳單撿回來後，我們總算能繼續搬家。\n回到客廳，看到桌上有幾瓶＿＿＿＿飲料，",
    secondOpeningText: "幫忙把傳單撿回來後，我們總算能繼續搬家。\n回到客廳，看到桌上有幾瓶便利商店飲料，",
    secondRevealText: "我以為是小麥買的，就很自然地全部喝掉了。",
    thirdPuzzlePromptText: "搬家告一段落後，才發現原來客廳裡的飲料，是搬家工人的。\n我就帶著小麥去最近新開的＿＿＿，",
    thirdPuzzleText: "搬家告一段落後，才發現原來客廳裡的飲料，是搬家工人的。\n我就帶著小麥去最近新開的甜點店，",
    thirdOpeningText: "搬家告一段落後，才發現原來客廳裡的飲料，是搬家工人的。\n我就帶著小麥去最近新開的甜點店，",
    thirdRevealText: "買了布丁和紅茶當作賠罪，也順便感謝今天的幫忙。",
    fragmentHeading: "青蛙篇・新的殘篇",
    fragmentExcerpt: "只看得見一小段：",
    firstSecondSegment: "第一篇・第二段",
    secondSecondSegment: "第二篇・第二段",
    thirdSecondSegment: "第三篇・第二段",
    incompleteReaction: "這篇日記只恢復了一部分。",
  },
  ja: {
    title: "引っ越し",
    openingText: "今日はムギと引っ越し業者に頼んで引っ越し。\n片づけの途中、街が急に騒がしくなった。",
    revealText: "ボール遊びをしていた人が、チラシを配っていた人にぶつかり、チラシが一気に散らばってしまった。\n私とムギは作業を止めて、一緒にチラシを拾うことにした。",
    firstPuzzlePromptText: "今日はムギと引っ越し業者に頼んで引っ越し。\n片づけの途中、＿＿が急に騒がしくなった。",
    firstPuzzleText: "今日はムギと引っ越し業者に頼んで引っ越し。\n片づけの途中、街が急に騒がしくなった。",
    secondPuzzlePromptText: "チラシを拾い終え、ようやく引っ越し作業に戻れた。\nリビングへ戻ると、テーブルに＿＿＿＿の飲み物が何本か置いてあった。",
    secondOpeningText: "チラシを拾い終え、ようやく引っ越し作業に戻れた。\nリビングへ戻ると、テーブルにコンビニの飲み物が何本か置いてあった。",
    secondRevealText: "ムギが買ったものだと思い、何の迷いもなく全部飲んでしまった。",
    thirdPuzzlePromptText: "引っ越しが一段落してから、リビングの飲み物は業者さんのものだったと気づいた。\nそこでムギを連れて、近くにできたばかりの＿＿＿へ行き、",
    thirdPuzzleText: "引っ越しが一段落してから、リビングの飲み物は業者さんのものだったと気づいた。\nそこでムギを連れて、近くにできたばかりのスイーツ店へ行き、",
    thirdOpeningText: "引っ越しが一段落してから、リビングの飲み物は業者さんのものだったと気づいた。\nそこでムギを連れて、近くにできたばかりのスイーツ店へ行き、",
    thirdRevealText: "おわびと今日のお礼に、プリンと紅茶を買った。",
    fragmentHeading: "カエル編・新しい断片",
    fragmentExcerpt: "読めるのはほんの一部：",
    firstSecondSegment: "1ページ目・後半",
    secondSecondSegment: "2ページ目・後半",
    thirdSecondSegment: "3ページ目・後半",
    incompleteReaction: "この日記はまだ一部しか戻っていない。",
  },
  en: {
    title: "Moving Day",
    openingText: "Mugi and I hired movers today.\nHalfway through unpacking, a commotion suddenly broke out in the street.",
    revealText: "Someone playing ball ran into a person handing out flyers, sending them everywhere.\nMugi and I put everything down and helped gather the flyers.",
    firstPuzzlePromptText: "Mugi and I hired movers today.\nHalfway through unpacking, a commotion suddenly broke out in the ＿＿.",
    firstPuzzleText: "Mugi and I hired movers today.\nHalfway through unpacking, a commotion suddenly broke out in the street.",
    secondPuzzlePromptText: "After gathering the flyers, we could finally get back to unpacking.\nBack in the living room, I found several drinks from the ＿＿＿＿ on the table.",
    secondOpeningText: "After gathering the flyers, we could finally get back to unpacking.\nBack in the living room, I found several drinks from the convenience store on the table.",
    secondRevealText: "I assumed Mugi had bought them, so I naturally drank every last one.",
    thirdPuzzlePromptText: "Once the move settled down, I realized the drinks in the living room belonged to the movers.\nSo I took Mugi to the newly opened ＿＿＿ nearby,",
    thirdPuzzleText: "Once the move settled down, I realized the drinks in the living room belonged to the movers.\nSo I took Mugi to the newly opened dessert shop nearby,",
    thirdOpeningText: "Once the move settled down, I realized the drinks in the living room belonged to the movers.\nSo I took Mugi to the newly opened dessert shop nearby,",
    thirdRevealText: "where we bought pudding and black tea as an apology—and a thank-you for all their help.",
    fragmentHeading: "Frog Chapter · New Fragment",
    fragmentExcerpt: "Only a small fragment is visible:",
    firstSecondSegment: "Entry 1 · Part 2",
    secondSecondSegment: "Entry 2 · Part 2",
    thirdSecondSegment: "Entry 3 · Part 2",
    incompleteReaction: "Only part of this diary entry has been restored.",
  },
} as const;

export function getExhibitionFrogDiaryText(locale: ExhibitionLocale) {
  const copy = EXHIBITION_FROG_DIARY_TEXT[locale];
  return {
    ...copy,
    firstText: `${copy.openingText}\n${copy.revealText}`,
    secondPuzzleText: copy.secondOpeningText,
    secondPreviewText: `${copy.secondOpeningText}\n${copy.secondRevealText}`,
  };
}

const SPEAKER_NAMES: Record<string, ExhibitionLocalizedText> = {
  "旁白": { zh: "旁白", ja: "ナレーション", en: "Narration" },
  "小麥": { zh: "小麥", ja: "ムギ", en: "Mugi" },
  "小白": { zh: "小白", ja: "シロ", en: "Shiro" },
  "小貝狗": { zh: "小貝狗", ja: "ベイゴ", en: "Beigo" },
  "同事": { zh: "同事", ja: "同僚", en: "Coworker" },
  "工讀生": { zh: "工讀生", ja: "アルバイト", en: "Part-timer" },
  "店員": { zh: "店員", ja: "店員", en: "Clerk" },
};

export function getExhibitionSpeakerName(locale: ExhibitionLocale, speaker: string) {
  return SPEAKER_NAMES[speaker]?.[locale] ?? speaker;
}

const SCENE_LABELS: Record<string, { ja: string; en: string }> = {
  "白天・公司附近街道": { ja: "昼・オフィス街", en: "Daytime · Office District" },
  "回憶・小白房間": { ja: "回想・シロの部屋", en: "Memory · Shiro's Room" },
  "回憶・小白房門": { ja: "回想・シロの部屋の前", en: "Memory · Outside Shiro's Room" },
  "早晨・捷運": { ja: "朝・地下鉄", en: "Morning · Metro" },
  "上午・公司": { ja: "午前・会社", en: "Morning · Office" },
  "下午・公司": { ja: "午後・会社", en: "Afternoon · Office" },
  "黃昏・公司": { ja: "夕方・会社", en: "Dusk · Office" },
  "黃昏・下班途中": { ja: "夕方・帰宅途中", en: "Dusk · On the Way Home" },
  "晚上・玄關": { ja: "夜・玄関", en: "Night · Entryway" },
  "晚上・客廳": { ja: "夜・リビング", en: "Night · Living Room" },
  "小白房間": { ja: "シロの部屋", en: "Shiro's Room" },
  "現在・小白房間": { ja: "現在・シロの部屋", en: "Present · Shiro's Room" },
  "隔天早上・家門口": { ja: "翌朝・家の前", en: "Next Morning · Outside Home" },
  "晚上・回家後": { ja: "夜・帰宅後", en: "Night · Back Home" },
  "白天・便利商店": { ja: "昼・コンビニ", en: "Daytime · Convenience Store" },
  "傍晚・公司": { ja: "夕方・会社", en: "Evening · Office" },
  "下班・公司附近街道": { ja: "退勤後・オフィス街", en: "After Work · Office District" },
  "夜晚・公司附近街道": { ja: "夜・オフィス街", en: "Night · Office District" },
};

const LOCATION_TITLES: Record<string, { ja: string; en: string }> = {
  "隔天早上": { ja: "翌朝", en: "The Next Morning" },
  "準備出門": { ja: "出発の準備", en: "Getting Ready to Leave" },
  "公司附近街道": { ja: "オフィス街", en: "Office District" },
  "下班時間": { ja: "退勤後", en: "After Work" },
};

type NarrativeTranslation = { ja: string; en: string };

const NARRATIVE_TRANSLATIONS: Record<string, NarrativeTranslation> = {
  "EX-DEPART-00": {
    ja: "会社員のムギには、最近ひとつ悩みがあった……",
    en: "Lately, a problem has been weighing on Mugi, a young office worker...",
  },
  "EX-DEPART-01": { ja: "昨夜、いったい何が起きたんだろう？", en: "What exactly happened last night?" },
  "EX-DEPART-02": {
    ja: "シロとけんかしただけなのに、どうしてあんな姿に……",
    en: "How did one fight with Shiro leave her like that...?",
  },
  "EX-DEPART-03": {
    ja: "シロの物を踏んで転んで、腹を立てた私は……",
    en: "I remember stepping on Shiro's things, falling, and getting angry...",
  },
  "EX-DEPART-04": { ja: "ひどいことを言ってしまった……", en: "I said some truly awful things to her..." },
  "EX-DEPART-05": {
    ja: "そのあと仕事から帰ってくると、目に入ったのは……",
    en: "Then, when I came home from work, I saw...",
  },
  "EX-DEPART-06": {
    ja: "シロが……宙に浮いていた！ いくら呼んでも反応がなくて……",
    en: "Shiro was... floating in midair! No matter how much I called, she wouldn't respond...",
  },
  "EX-DEPART-07": {
    ja: "床にはこの日記が開かれていて……中身が真っ白になっていた……",
    en: "And this diary lay open on the floor... every page completely blank...",
  },
  "EX-DEPART-08": {
    ja: "この日記とシロの変化には、どんな関係があるんだろう？ それに……",
    en: "What does this diary have to do with Shiro's transformation? And...",
  },
  "EX-DEPART-09": { ja: "ワオワオワオワオ！", en: "Awoo, awoo, awoo!" },
  "EX-DEPART-10": {
    ja: "——日記と一緒に現れた、この不思議な生き物はいったい何？",
    en: "—what is this strange creature that appeared with the diary?",
  },
  "EX-DEPART-11": {
    ja: "とにかく、まずは会社へ行こう。シロを助ける方法はそれから考えなくちゃ！",
    en: "For now, I have to get to work. I'll figure out how to save Shiro afterward!",
  },
  "EX-METRO-OPEN-00": { ja: "電車がホームに入ってきた——", en: "The train pulls into the station—" },
  "EX-METRO-OPEN-01": {
    ja: "はぁ……シロがずっと元に戻らなかったら、どうしよう……？",
    en: "What if Shiro never goes back to normal...?",
  },
  "EX-METRO-OPEN-02": {
    ja: "ワオワオ！ 「ヒビモン」だ、「ヒビモン」！",
    en: "Awoo! It's a Momentling! A Momentling!",
  },
  "EX-METRO-OPEN-03": {
    ja: "うわっ！ びっくりした！ どうしてここに隠れてるの！？",
    en: "Ah! You scared me! Why were you hiding in there!?",
  },
  "EX-METRO-OPEN-04": { ja: "それで、今なんて言ったの？ 「ヒビモン」？", en: "And what did you just say? A 'Momentling'?" },
  "EX-DIARY-01": {
    ja: "これは……！ 真っ白だったページに、内容が浮かび上がってる……！",
    en: "Wait...! Words are appearing on the pages that were blank...!",
  },
  "EX-DIARY-02": {
    ja: "その通り！ ヒビモンを捕まえると、シロの日記が戻るんだよ！",
    en: "That's right! Catch a Momentling, and Shiro's diary comes back!",
  },
  "EX-DIARY-03": {
    ja: "確かに、この日記のシロは、あのおっちょこちょいなゴールデンレトリバーに似てる……",
    en: "Come to think of it, Shiro in this entry does resemble that goofy golden retriever...",
  },
  "EX-DIARY-04": {
    ja: "まさか……消えた日記の内容が、ヒビモンになったの！？",
    en: "Don't tell me... the missing diary entries turned into Momentlings!?",
  },
  "EX-DIARY-05": { ja: "ワオ〜ン！ 大正解！", en: "Awoo! Bingo!" },
  "EX-DIARY-06": {
    ja: "じゃあ、ヒビモンを全部連れ戻せば、シロは……",
    en: "Then if I bring all the Momentlings back, Shiro might...",
  },
  "EX-DIARY-07": { ja: "まずい、もう着いた！ 続きはあとで考えよう！", en: "Oh no, this is my stop! I'll think about it later!" },
  "EX-09": {
    ja: "ムギ、今日の退勤までに資料箱を棚へ積んでおいてくれる？",
    en: "Mugi, could you stack these file boxes in the cabinet before you leave today?",
  },
  "EX-10": { ja: "うん、任せて。", en: "Sure. Leave it to me." },
  "EX-WORK-00": { ja: "資料箱、全部片づいた！", en: "All the file boxes are sorted!" },
  "EX-WORK-01": { ja: "ありがとう！ ムギって本当に頼りになる！", en: "Thanks! You're always so dependable, Mugi!" },
  "EX-WORK-02": { ja: "ああ——やっと仕事が終わった！", en: "Ah—finally, work is over!" },
  "EX-WORK-02B": { ja: "急いで帰って、シロが目を覚ましたか確かめよう！", en: "I need to hurry home and see if Shiro has woken up!" },
  "EX-WORK-03": {
    ja: "ムギは会社を出ると、夕暮れの街を急いで家へ向かった。",
    en: "Mugi leaves the office and hurries home through the streets at dusk.",
  },
  "EX-HOME-01": { ja: "ただいま。", en: "I'm home." },
  "EX-HOME-02": {
    ja: "ゴールデンレトリバーは日記に戻った……シロも元に戻ったかな？",
    en: "The golden retriever is back in the diary... Maybe Shiro is back to normal too?",
  },
  "EX-HOME-03": { ja: "早くシロの部屋を見に行かなくちゃ。", en: "I need to check Shiro's room, fast." },
  "EX-16": {
    ja: "シロはまだ宙に浮いたまま。灰白色の光も消えず、目を覚ましていなかった。",
    en: "Shiro is still floating in place. The gray-white glow remains, and she has not awakened.",
  },
  "EX-17": { ja: "まだ元に戻ってない……", en: "She's still not back to normal..." },
  "EX-18": { ja: "日記〜ワオ！", en: "Diary—awoo!" },
  "EX-19": { ja: "日記？", en: "The diary?" },
  "EX-NOW-04": {
    ja: "さっき日記が光ったのに、シロは少しも変わってない……どうして？",
    en: "The diary glowed, but Shiro hasn't changed at all... Why?",
  },
  "EX-NOW-05": {
    ja: "ワオワオ！ くじけないで！ ほら、次の日記が現れたよ。もっとヒビモンを捕まえよう〜！",
    en: "Awoo! Don't give up! Look, the next entry appeared. Let's catch more Momentlings!",
  },
  "EX-MORNING-ROUTE-INTRO": {
    ja: "いい天気。今日は歩いて会社へ行こう！",
    en: "Beautiful weather. I'll walk to work today!",
  },
  "EX-NO-SUNBEAST-01": { ja: "今日はヒビモンに会えなかった……", en: "I didn't find any Momentlings today..." },
  "EX-NO-SUNBEAST-02": { ja: "もう一度、日記を見てみよう！", en: "Let's check the diary again!" },
  "EX-STREET-RETURN-01": { ja: "えっ！ カエルのヒビモン、逃げちゃったの！？", en: "What!? The Frog Momentling got away!?" },
  "EX-STREET-RETURN-02": {
    ja: "ワオワオ！ 捕まえにくいヒビモンもいるんだ！ でもあきらめないで〜。何度か挑戦すれば、きっと成功するよ！ ワオワオ！",
    en: "Awoo! Some Momentlings are harder to catch! But don't give up—keep trying and you'll get it! Awoo!",
  },
  "EX-STREET-RETURN-03": {
    ja: "くやしい……仕事のあと、またあのカエルに会えたら、今度こそ捕まえる！",
    en: "Darn it... I hope I find that frog after work. Next time, I'll catch it!",
  },
  "EX-CONVENIENCE-RETURN-01": { ja: "もう……ヒビモン一匹捕まえるのが、こんなに難しいなんて。", en: "Ugh... Why is one Momentling so hard to catch?" },
  "EX-CONVENIENCE-RETURN-02": { ja: "どうしよう。またあのカエルに会えるかな……？", en: "What now? Will I run into that frog again...?" },
  "EX-CONVENIENCE-RETURN-03": { ja: "ワオ〜。あのヒビモン、行きたい場所があるのかも〜", en: "Awoo... Maybe that Momentling is trying to get somewhere." },
  "EX-DESSERT-DEPART-01": {
    ja: "うーん、このまま帰る？ それとも、もう少しあのカエルを探してみようかな？",
    en: "Hmm... Should I head home, or look for that frog a little longer?",
  },
  "EX-DESSERT-DEPART-02": {
    ja: "ムギ、ムギ！ 前に言ってたおいしいケーキ屋さんってどこ？ 彼氏の誕生日ケーキを買いたくて！",
    en: "Mugi! Where was that great cake shop you mentioned? I want to get my boyfriend a birthday cake!",
  },
  "EX-DESSERT-DEPART-03": {
    ja: "ああ、会社の近くだよ！ でも、ちょっと見つけにくいんだ……",
    en: "Oh, it's near the office! But it can be a little hard to find...",
  },
  "EX-DESSERT-DEPART-04": { ja: "じゃあ、一緒に行こうか！", en: "Why don't I go with you?" },
  "EX-DESSERT-DEPART-05": {
    ja: "うーん……この辺りだったはずなのに、見当たらない……",
    en: "Hmm... I remember it being right here. Where did it go...?",
  },
  "EX-DESSERT-AFTER-01": {
    ja: "思い出した！ 前にこの店へ来たのは、シロの謝罪のお菓子を買うためだったんだ。",
    en: "Now I remember! Last time we came here, I was helping Shiro buy a little apology treat.",
  },
  "EX-DESSERT-AFTER-02": {
    ja: "飲み物を間違えたときの、あの気まずそうな顔。思い出すと今でも笑っちゃう。",
    en: "She looked so awkward after drinking the wrong beverage. It still makes me laugh.",
  },
  "EX-DESSERT-AFTER-03": {
    ja: "あのとき、また一緒に来て、ほかのお菓子も買おうって約束したんだ……",
    en: "We promised we'd come back together and try more treats someday...",
  },
  "EX-DESSERT-AFTER-04": { ja: "ワオ……", en: "Awoo..." },
  "EX-DESSERT-AFTER-05": { ja: "大丈夫。私はあきらめない！", en: "It's okay. I won't give up!" },
  "EX-DESSERT-AFTER-06": {
    ja: "ヒビモンを全部集めて、絶対にシロを目覚めさせる！",
    en: "I'll collect every Momentling and wake Shiro up. I promise!",
  },
};

export type LocalizableNarrativeLine = {
  id: string;
  text: string;
  sceneLabel: string;
  locationTransition?: { title: string; subtitle?: string };
  doorSwipeInteraction?: object & { instruction?: string };
};

function localizedLookup(
  locale: ExhibitionLocale,
  source: string,
  translations: Record<string, { ja: string; en: string }>,
) {
  if (locale === "zh") return source;
  return translations[source]?.[locale] ?? source;
}

export function localizeExhibitionNarrativeLines<T extends LocalizableNarrativeLine>(
  locale: ExhibitionLocale,
  lines: readonly T[],
): readonly T[] {
  if (locale === "zh") return lines;
  return lines.map((line) => {
    const translation =
      line.id === "EX-19" && line.text.includes("天氣晴朗")
        ? NARRATIVE_TRANSLATIONS["EX-MORNING-ROUTE-INTRO"]
        : NARRATIVE_TRANSLATIONS[line.id];
    return {
      ...line,
      text: translation?.[locale] ?? line.text,
      sceneLabel: localizedLookup(locale, line.sceneLabel, SCENE_LABELS),
      locationTransition: line.locationTransition
        ? {
            ...line.locationTransition,
            title: localizedLookup(locale, line.locationTransition.title, LOCATION_TITLES),
            subtitle: line.locationTransition.subtitle
              ? localizedLookup(locale, line.locationTransition.subtitle, LOCATION_TITLES)
              : undefined,
          }
        : undefined,
      doorSwipeInteraction: line.doorSwipeInteraction
        ? {
            ...line.doorSwipeInteraction,
            instruction: EXHIBITION_UI_COPY.turnDoorHandle[locale],
          }
        : undefined,
    } as T;
  });
}

type IndexedLineTranslation = readonly { ja: string; en: string }[];

const METRO_DOG_BEFORE_TRANSLATIONS: IndexedLineTranslation = [
  { ja: "えっ！ どうして地下鉄にゴールデンレトリバーが？", en: "Huh!? What's a golden retriever doing on the metro?" },
  { ja: "あれはゴールデンレトリバーじゃない！ 「ヒビモン」だよ！", en: "That's not a golden retriever! It's a Momentling!" },
  { ja: "ワオワオ！ 写真！ 写真！ これを使って！", en: "Awoo! Picture! Picture! Take this!" },
  { ja: "カメラ？ はいはい、急かさないで！ これで撮ればいいんでしょ？", en: "A camera? Okay, okay—stop rushing me! I just use this to take its picture, right?" },
];

const METRO_DOG_AFTER_TRANSLATIONS: IndexedLineTranslation = [
  { ja: "あれ？ あの「ヒビモン」はどこへ行ったの？", en: "Huh? Where did that Momentling go?" },
  { ja: "ワオワオ！ 早く日記を見て！", en: "Awoo! Check the diary!" },
  { ja: "日記……？ あっ、今朝なんとなく持ってきたシロの日記のこと……？", en: "The diary...? Oh! You mean Shiro's diary—the one I brought along this morning...?" },
];

const FORGOT_LUNCH_TRANSLATIONS: IndexedLineTranslation = [
  { ja: "ふう——お昼にしよう！", en: "Phew—time for lunch!" },
  { ja: "あっ！ お弁当を忘れちゃった！", en: "Oh! I forgot my lunch!" },
  { ja: "コンビニで買うしかないか……", en: "I guess I'll have to buy something at the convenience store..." },
  { ja: "ワオ〜〜", en: "Awooo..." },
];

const METRO_COMIC_NARRATION: ExhibitionLocalizedText = {
  zh: "順著小貝狗示意的方向看去，發現車廂裡有隻尾巴被門夾住的黃金獵犬。",
  ja: "ベイゴが示すほうを見ると、車内に尻尾をドアへ挟まれたゴールデンレトリバーがいた。",
  en: "Mugi looks where Beigo is pointing and spots a golden retriever with its tail caught in the train doors.",
};

function localizeIndexedLines<T extends { text: string }>(
  locale: ExhibitionLocale,
  lines: readonly T[],
  translations: IndexedLineTranslation,
): readonly T[] {
  if (locale === "zh") return lines;
  return lines.map((line, index) => ({
    ...line,
    text: translations[index]?.[locale] ?? line.text,
  }));
}

export function getExhibitionMetroComicNarration(locale: ExhibitionLocale) {
  return METRO_COMIC_NARRATION[locale];
}

export function getLocalizedMetroDogBeforeLines<T extends { text: string }>(
  locale: ExhibitionLocale,
  lines: readonly T[],
) {
  return localizeIndexedLines(locale, lines, METRO_DOG_BEFORE_TRANSLATIONS);
}

export function getLocalizedMetroDogAfterLines<T extends { text: string }>(
  locale: ExhibitionLocale,
  lines: readonly T[],
) {
  return localizeIndexedLines(locale, lines, METRO_DOG_AFTER_TRANSLATIONS);
}

export function getLocalizedForgotLunchLines<T extends { text: string }>(
  locale: ExhibitionLocale,
  lines: readonly T[],
) {
  return localizeIndexedLines(locale, lines, FORGOT_LUNCH_TRANSLATIONS);
}

const FROG_STAGE_TRANSLATIONS: Record<
  string,
  {
    title?: { ja: string; en: string };
    routeHint?: { ja: string; en: string };
    sceneTitle?: { ja: string; en: string };
    placeLabel?: { ja: string; en: string };
    lines: IndexedLineTranslation;
  }
> = {
  "frog-clue-street-flyer": {
    sceneTitle: { ja: "オフィス街", en: "Office District" },
    placeLabel: { ja: "街", en: "Street" },
    lines: [
      { ja: "たまには歩いて出勤するのも、気持ちいいね！", en: "Walking to work once in a while feels pretty nice!" },
      { ja: "うわっ——すごい風！", en: "Whoa—that wind is strong!" },
      { ja: "ん？ 飛んできたこのチラシは……？", en: "Huh? What's this flyer that blew over...?" },
      { ja: "少し先で、若いアルバイトが散らばったチラシを慌てて拾っていた。", en: "Nearby, a young part-timer scrambles to gather the flyers scattered by the wind." },
      { ja: "わあ……かわいそう。手伝ってあげよう。", en: "Oh no... I should help him pick them up." },
      { ja: "こんにちは〜。このチラシ、どうぞ〜", en: "Hi! Here are the flyers I picked up." },
      { ja: "ありがとうございます、助かりました！ 一人だったら、いつまでかかったか……", en: "Thank you! That was a huge help. I don't know how long it would've taken me alone..." },
      { ja: "わっ！ どうしてチラシの中にカエルが！？", en: "Whoa! Why was there a frog hiding in the flyers!?" },
      { ja: "ワオワオ！ ヒビモン！ ヒビモン！", en: "Awoo! A Momentling! A Momentling!" },
      { ja: "えっ！？ あれもヒビモンなの？", en: "What!? That's a Momentling too?" },
    ],
  },
  "frog-clue-shop-cold-noodles": {
    sceneTitle: { ja: "コンビニ", en: "Convenience Store" },
    placeLabel: { ja: "コンビニ", en: "Convenience Store" },
    lines: [
      { ja: "冷やし麺がセールだ！ 今日のお昼はこれにしよう〜♪", en: "Cold noodles are on sale! That's lunch sorted♪" },
      { ja: "108元です。冷やし麺は温めますか？", en: "That's NT$108. Would you like the cold noodles heated?" },
      { ja: "えっ……温めたら、冷やし麺じゃなくなりません……？", en: "Um... wouldn't heating cold noodles make them not cold anymore...?" },
      { ja: "し、失礼しました。お箸はお付けしますか？", en: "I-I meant, would you like utensils with that?" },
      { ja: "大丈夫です。いりません。", en: "No, thank you. I don't need any." },
      { ja: "ふふっ、言い間違えて顔が真っ赤になってる——", en: "Hehe. His face went bright red after that slip-up—" },
      { ja: "ワオワオ！ 見て、見て！", en: "Awoo! Look, look!" },
      { ja: "えっ？ あれは！？", en: "Huh? What's that!?" },
      { ja: "ヒビモンだ！ 早く、カメラ！", en: "It's a Momentling! Quick—the camera!" },
    ],
  },
  "frog-clue-dessert-shop-birthday-cake": {
    title: { ja: "スイーツ店：袋の中のカエル", en: "Dessert Shop: Frog in the Bag" },
    routeHint: { ja: "店は会社の近くだったはず。でも、少し見つけにくい。", en: "Mugi remembers the dessert shop is near the office, but it is hard to find." },
    sceneTitle: { ja: "スイーツ店", en: "Dessert Shop" },
    lines: [
      { ja: "やっと見つけた！ この店だよ！", en: "Found it at last! This is the place!" },
      { ja: "ありがとう！ じゃあ、ケーキを選んでくるね〜", en: "Thank you! I'll go pick out a cake!" },
      { ja: "ふう——見つかってよかった！ この店、シロが教えてくれて、一緒に来たんだよね……", en: "Phew—I'm glad we found it! Shiro was the one who recommended this place and brought me here..." },
      { ja: "買えた？ ん？ その顔、どうしたの？", en: "All done? Hm? What's with that look?" },
      { ja: "うう……店員さんに彼氏の年齢のろうそくを聞かれたのに、どうしても思い出せなくて……恥ずかしかった……", en: "Ugh... The clerk asked what age candle I needed, and I couldn't remember how old my boyfriend is. It was so embarrassing..." },
      { ja: "まあ〜長く付き合ってると、そういう小さなことって忘れちゃうよね。", en: "Well, when you've been together a long time, little details like that can slip your mind." },
      { ja: "ワオ！ 袋！ 袋の中！", en: "Awoo! The bag! Inside the bag!" },
      { ja: "あっ！ 今日の昼に見た、カエルのヒビモン！", en: "Ah! It's the Frog Momentling from earlier today!" },
      { ja: "今度こそ、絶対に捕まえる！", en: "This time, I'm definitely catching you!" },
    ],
  },
};

export function getLocalizedExhibitionFrogStage(
  locale: ExhibitionLocale,
  stage: FrogDiaryClueStage,
): FrogDiaryClueStage {
  if (locale === "zh") return stage;
  const translation = FROG_STAGE_TRANSLATIONS[stage.eventId];
  if (!translation) return stage;
  return {
    ...stage,
    title: translation.title?.[locale] ?? stage.title,
    routeHint: translation.routeHint?.[locale] ?? stage.routeHint,
    sceneTitle: translation.sceneTitle?.[locale] ?? stage.sceneTitle,
    placeLabel: translation.placeLabel?.[locale] ?? stage.placeLabel,
    lines: localizeIndexedLines(locale, stage.lines, translation.lines),
  };
}

export const EXHIBITION_CHARACTER_INTRO_COPY = {
  name: { zh: "小麥", ja: "ムギ", en: "Mugi" },
  englishName: { zh: "MUGI", ja: "MUGI", en: "MUGI" },
  description: {
    zh: ["剛出社會兩年的職場新鮮人", "平時省吃儉用，但看到喜歡的東西還是會手滑的平凡女孩"],
    ja: ["社会人2年目の新米会社員", "普段は節約しているけれど、好きなものを見るとつい買ってしまう、ごく普通の女の子"],
    en: ["A young professional in her second year of working life", "An ordinary girl who watches her spending—until something she loves catches her eye"],
  },
} as const;

export const EXHIBITION_BAI_ENTRY_1_TEXT = {
  zh: {
    openingText: "睡過頭趕捷運，好不容易衝上車，卻發現大家都在看我。",
    revealText: "低頭一看才發現，吉他袋被門夾住了。\n好險下一站就順利解救，自己都忍不住笑了。",
  },
  ja: {
    openingText: "寝坊して地下鉄へ駆け込み、なんとか乗れたと思ったら、みんなが私を見ていた。",
    revealText: "見下ろすと、ギターケースがドアに挟まっていた。\n次の駅ですぐ助け出せて、自分でも笑ってしまった。",
  },
  en: {
    openingText: "I overslept and raced for the metro. I barely made it aboard—only to notice everyone staring at me.",
    revealText: "Then I looked down and saw my guitar case caught in the doors.\nLuckily, I freed it at the next stop. Even I had to laugh.",
  },
} as const;

export function getExhibitionBaiEntry1Text(locale: ExhibitionLocale) {
  const copy = EXHIBITION_BAI_ENTRY_1_TEXT[locale];
  return { ...copy, firstText: `${copy.openingText}\n${copy.revealText}` };
}

export const EXHIBITION_DIARY_READ_COPY = {
  zh: [
    "小麥讀著重新浮現的日記，發現裡頭的黃金獵犬和小白很像。",
    "小貝狗拍了拍日記本，不斷重複著「小日獸」這個詞。",
    "小日獸！小日獸！",
    "所以，這隻黃金獵犬就是你說的小日獸。",
    "果然，只要找回小日獸，消失的日記內容就會慢慢恢復。",
    "這篇日記已經復原了……小白那邊呢？",
  ],
  ja: [
    "戻ってきた日記を読みながら、ムギはそこに登場するゴールデンレトリバーがシロに似ていると気づいた。",
    "ベイゴは日記をぽんぽんと叩き、「ヒビモン」という言葉を繰り返した。",
    "ヒビモン！ ヒビモン！",
    "つまり、このゴールデンレトリバーが、君の言ってたヒビモンなんだね。",
    "やっぱり。ヒビモンを連れ戻せば、消えた日記も少しずつ元に戻るんだ。",
    "この日記は戻った……じゃあ、シロは？",
  ],
  en: [
    "As Mugi reads the restored entry, she realizes its golden retriever is a lot like Shiro.",
    "Beigo pats the diary, repeating the word 'Momentling' again and again.",
    "Momentling! Momentling!",
    "So this golden retriever is the Momentling you were talking about.",
    "I knew it. Bringing back Momentlings restores the missing diary entries, little by little.",
    "This entry is restored... but what about Shiro?",
  ],
} as const;

export const EXHIBITION_FROG_PHOTO_INTRO_COPY = {
  zh: [
    "完成街道上的傳單任務後，青蛙從紙箱裡跳了出來",
    "看著店員手忙腳亂地處理涼麵，青蛙也在櫃台旁跳來跳去",
    "蛋糕紙袋裡鑽出的青蛙，終於被完整拍下來了",
  ],
  ja: [
    "街でチラシを拾い終えると、箱の中からカエルが飛び出した。",
    "店員が冷やし麺の対応に慌てる横で、カエルがレジのそばを跳ね回っていた。",
    "ケーキの紙袋から飛び出したカエルを、ついにきれいに撮影できた。",
  ],
  en: [
    "After the flyer task, a frog leapt out of the box.",
    "While the clerk fumbled with the cold noodles, the frog hopped around beside the counter.",
    "At last, Mugi got a clear shot of the frog emerging from the cake bag.",
  ],
} as const;

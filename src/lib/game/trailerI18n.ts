import { EXHIBITION_LOCALE_OPTIONS, type ExhibitionLocale, type ExhibitionLocalizedText } from "./exhibitionI18n";
import { FROG_MOVING_DIARY_STREET_FIRST_FRAGMENT } from "./frogDiaryClueFlow";

// Recording copy follows the already-recorded Chinese cut and the game's Mugi / Shiro names.
export const TRAILER_COPY = {
  bai: [
    { zh: "嗚哇——！小、小白……！？", en: "Waaah! Sh-Shiro…!?", ja: "うわあっ！ シ、シロ……！？" },
    { zh: "小白……？妳聽得見我嗎？", en: "Shiro…? Can you hear me?", ja: "シロ……？ 私の声、聞こえる？" },
  ],
  metro: {
    crowded: { zh: "今天人好多.....好險有坐到位子", en: "So crowded today… Glad I got a seat.", ja: "今日は混んでる……座れてよかった。" },
    backpack: { zh: "迎面而來的大包包", en: "A huge bag swings right at me.", ja: "大きなバッグがこっちに！" },
    pain: { zh: "哎呀！好痛，沒閃過", en: "Ow! I couldn't dodge it!", ja: "いたっ！ よけきれなかった。" },
    cramped: { zh: "一直擠過來，真不舒服", en: "They keep crowding me… So uncomfortable.", ja: "どんどんこっちに……窮屈だな。" },
    beigo: { zh: "哇！在包包裡面", en: "Whoa! Inside the bag!", ja: "わっ！ バッグの中に！" },
  },
  choices: [
    { zh: "忍耐", en: "Put up with it", ja: "我慢する" },
    { zh: "受不了，跟他說", en: "Say something", ja: "我慢できない、伝える" },
  ],
  diaryTitle: { zh: "搬家", en: "Moving Day", ja: "引っ越し" },
  diaryText: {
    zh: FROG_MOVING_DIARY_STREET_FIRST_FRAGMENT.firstPuzzleText,
    en: "Mugi and I became roommates today! We booked movers, but while we waited outside, a commotion suddenly broke out in the street…",
    ja: "今日からムギとルームシェア！\n引っ越し業者を頼んだけど、玄関先で到着を待っていたら、通りが急に騒がしくなって……",
  },
} as const satisfies {
  bai: readonly ExhibitionLocalizedText[];
  metro: Record<string, ExhibitionLocalizedText>;
  choices: readonly ExhibitionLocalizedText[];
  diaryTitle: ExhibitionLocalizedText;
  diaryText: ExhibitionLocalizedText;
};

export const TRAILER_LOGOS = Object.fromEntries(EXHIBITION_LOCALE_OPTIONS.map(option => [option.id, {
  // Keep the exact Chinese title artwork used in the original recording.
  src: option.id === "zh" ? "/images/logo/logo_svg.svg"
    : option.id === "en" ? "/images/recording/ending/hibimon-moments-en.svg" : option.logo,
  alt: option.id === "en" ? "Hibimon MOMENTS" : option.logoAlt,
}])) as Record<ExhibitionLocale, { src: string; alt: string }>;

export const RECORDING_LOCALE_STORAGE_KEY = "moment:recording-locale";

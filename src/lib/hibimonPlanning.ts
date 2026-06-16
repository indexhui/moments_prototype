import type { FrogDiaryClueEventId } from "@/lib/game/frogDiaryClueFlow";
import type { DiaryEntryId } from "@/lib/game/playerProgress";

export type HibimonStoryRouteMode = "simple-metro" | "frog-clue" | "work-lunch-convenience";

export type HibimonWorkUnit =
  | "dependent-cabinet"
  | "dependent-shredder"
  | "dependent-files"
  | "office-chicken"
  | "sticky-notes"
  | "stamp-documents"
  | "export-pdf";

export type HibimonPlayUnit =
  | { type: "story-route"; mode: HibimonStoryRouteMode }
  | { type: "frog-event"; eventId: FrogDiaryClueEventId; photoAttemptNumber: number }
  | { type: "work"; unit: HibimonWorkUnit };

export type HibimonDiaryJournalView =
  | "list"
  | "entry-bai-1"
  | "entry-bai-2-fragment"
  | "entry-bai-2"
  | "entry-bai-3"
  | "entry-bai-5";

export type HibimonDiaryTarget = {
  entryId: DiaryEntryId;
  restoredView: HibimonDiaryJournalView;
  unrestoredView: HibimonDiaryJournalView;
  unlockedBeforeEntryIds?: DiaryEntryId[];
  unrestoredBaiEntry1RestorationPreview?: boolean;
  unrestoredFrogFragmentPhotoAttemptCount?: number;
};

export type HibimonStage = {
  id: string;
  mainFunction: string;
  condition: string;
  locationRequirement: string;
  plot: string;
  diary: string;
  level: string;
  playUnit: HibimonPlayUnit | null;
  diaryTarget: HibimonDiaryTarget | null;
};

export type HibimonStageField = Exclude<keyof HibimonStage, "id" | "playUnit" | "diaryTarget">;

export type HibimonAnimal = {
  id: string;
  animal: string;
  name: string;
  temperament: string;
  stages: HibimonStage[];
};

export const HIBIMON_STAGE_FIELDS = [
  { key: "mainFunction", label: "主線功能" },
  { key: "condition", label: "條件" },
  { key: "locationRequirement", label: "地點要求" },
  { key: "plot", label: "進程劇情" },
  { key: "diary", label: "日記" },
  { key: "level", label: "關卡" },
] as const satisfies ReadonlyArray<{
  key: HibimonStageField;
  label: string;
}>;

export const HIBIMON_PLANNING: HibimonAnimal[] = [
  {
    id: "hibimon-dog",
    animal: "黃金獵犬",
    name: "TBD",
    temperament: "傻氣陽光",
    stages: [
      {
        id: "dog-metro",
        mainFunction: "帶玩家拍照、日記還原與圖鑑",
        condition: "經過捷運，完成拍照",
        locationRequirement: "捷運",
        plot: "去捷運上班遇到直太郎",
        diary: "滑雪板搭電車",
        level: "一格拼圖，選項為",
        playUnit: { type: "story-route", mode: "simple-metro" },
        diaryTarget: {
          entryId: "bai-entry-1",
          restoredView: "entry-bai-1",
          unrestoredView: "entry-bai-1",
          unrestoredBaiEntry1RestorationPreview: true,
        },
      },
    ],
  },
  {
    id: "hibimon-frog",
    animal: "青蛙",
    name: "雨呱",
    temperament: "尷尬慌張",
    stages: [
      {
        id: "frog-store-route",
        mainFunction: "學習路徑寬窄",
        condition: "經過便利商店",
        locationRequirement: "商店",
        plot: "中午發現忘記帶便當去便利商店買，店員詢問是否要微波非常尷尬",
        diary: "搬家時的飲料烏龍",
        level: "公司到便利商店路徑拼圖",
        playUnit: { type: "story-route", mode: "work-lunch-convenience" },
        diaryTarget: {
          entryId: "bai-entry-2",
          restoredView: "entry-bai-2",
          unrestoredView: "entry-bai-2-fragment",
          unlockedBeforeEntryIds: ["bai-entry-1"],
          unrestoredFrogFragmentPhotoAttemptCount: 1,
        },
      },
      {
        id: "frog-shop-event",
        mainFunction: "便利商店事件與青蛙拍照",
        condition: "完成便利商店路線後",
        locationRequirement: "商店",
        plot: "涼麵要不要微波的尷尬事件，接青蛙拍照",
        diary: "搬家時的飲料烏龍",
        level: "青蛙線索：便利商店事件",
        playUnit: { type: "frog-event", eventId: "frog-clue-shop-cold-noodles", photoAttemptNumber: 1 },
        diaryTarget: {
          entryId: "bai-entry-2",
          restoredView: "entry-bai-2",
          unrestoredView: "entry-bai-2-fragment",
          unlockedBeforeEntryIds: ["bai-entry-1"],
          unrestoredFrogFragmentPhotoAttemptCount: 1,
        },
      },
      {
        id: "frog-street-route",
        mainFunction: "學習兩格",
        condition: "經過街道",
        locationRequirement: "街道",
        plot: "出門經過街道，遇到發傳單的店員",
        diary: "回到家有飲料，就喝了",
        level: "青蛙線索路徑拼圖",
        playUnit: { type: "story-route", mode: "frog-clue" },
        diaryTarget: {
          entryId: "bai-entry-2",
          restoredView: "entry-bai-2",
          unrestoredView: "entry-bai-2-fragment",
          unlockedBeforeEntryIds: ["bai-entry-1"],
          unrestoredFrogFragmentPhotoAttemptCount: 2,
        },
      },
      {
        id: "frog-street-event",
        mainFunction: "街道事件與風向小遊戲",
        condition: "完成街道路線後",
        locationRequirement: "街道",
        plot: "傳單被風吹走，接既有風向節奏關卡與青蛙拍照",
        diary: "回到家有飲料，就喝了",
        level: "青蛙線索：街道事件",
        playUnit: { type: "frog-event", eventId: "frog-clue-street-flyer", photoAttemptNumber: 2 },
        diaryTarget: {
          entryId: "bai-entry-2",
          restoredView: "entry-bai-2",
          unrestoredView: "entry-bai-2-fragment",
          unlockedBeforeEntryIds: ["bai-entry-1"],
          unrestoredFrogFragmentPhotoAttemptCount: 2,
        },
      },
      {
        id: "frog-restaurant",
        mainFunction: "餐廳路線與最終線索",
        condition: "經過餐廳",
        locationRequirement: "餐廳",
        plot: "晚上想起日記提到的餐廳，搜索一下地點",
        diary: "回到家有飲料，就喝了",
        level: "餐廳路徑拼圖",
        playUnit: { type: "story-route", mode: "frog-clue" },
        diaryTarget: {
          entryId: "bai-entry-2",
          restoredView: "entry-bai-2",
          unrestoredView: "entry-bai-2-fragment",
          unlockedBeforeEntryIds: ["bai-entry-1"],
          unrestoredFrogFragmentPhotoAttemptCount: 2,
        },
      },
    ],
  },
  {
    id: "hibimon-koala",
    animal: "無尾熊",
    name: "瓦那",
    temperament: "依賴、黏人",
    stages: [
      {
        id: "koala-cabinet",
        mainFunction: "完成辦公小遊戲",
        condition: "小遊戲過關",
        locationRequirement: "無",
        plot: "同事請託小麥整理櫃子",
        diary: "-",
        level: "整理櫃子",
        playUnit: { type: "work", unit: "dependent-cabinet" },
        diaryTarget: null,
      },
      {
        id: "koala-shredder",
        mainFunction: "完成辦公小遊戲",
        condition: "小遊戲過關",
        locationRequirement: "無",
        plot: "同事把重要公文丟進碎紙機，拜託小麥救援",
        diary: "-",
        level: "碎紙機",
        playUnit: { type: "work", unit: "dependent-shredder" },
        diaryTarget: null,
      },
      {
        id: "koala-files",
        mainFunction: "完成辦公小遊戲",
        condition: "小遊戲過關",
        locationRequirement: "無",
        plot: "同事把會議文件搞混，拜託小麥整理",
        diary: "喜歡找小麥一起吃晚餐",
        level: "整理文件",
        playUnit: { type: "work", unit: "dependent-files" },
        diaryTarget: {
          entryId: "bai-entry-5",
          restoredView: "entry-bai-5",
          unrestoredView: "list",
          unlockedBeforeEntryIds: ["bai-entry-1", "bai-entry-2"],
        },
      },
    ],
  },
  {
    id: "hibimon-chicken",
    animal: "公雞",
    name: "公雞",
    temperament: "專注",
    stages: [
      {
        id: "chicken-boss-1",
        mainFunction: "跟老闆詢問營運項 1",
        condition: "-",
        locationRequirement: "無",
        plot: "-",
        diary: "-",
        level: "暫時無",
        playUnit: null,
        diaryTarget: null,
      },
      {
        id: "chicken-boss-2",
        mainFunction: "跟老闆詢問營運項 2",
        condition: "-",
        locationRequirement: "無",
        plot: "-",
        diary: "-",
        level: "暫時無",
        playUnit: null,
        diaryTarget: null,
      },
      {
        id: "chicken-river",
        mainFunction: "跟老闆詢問營運項 3（若需要）",
        condition: "完成轉場拼圖小白秘密基地-河畔",
        locationRequirement: "河畔",
        plot: "-",
        diary: "-",
        level: "特殊地圖 / 河畔路線",
        playUnit: null,
        diaryTarget: null,
      },
      {
        id: "chicken-rescue",
        mainFunction: "中斷拍照，回公司救火",
        condition: "救火遊戲",
        locationRequirement: "無",
        plot: "完成救火，收集到公雞、中斷太專注的老闆",
        diary: "專注的小白去河畔工作，不被打擾",
        level: "辦公室公雞專注關卡",
        playUnit: { type: "work", unit: "office-chicken" },
        diaryTarget: {
          entryId: "bai-entry-3",
          restoredView: "entry-bai-3",
          unrestoredView: "list",
          unlockedBeforeEntryIds: ["bai-entry-1", "bai-entry-2", "bai-entry-5"],
        },
      },
    ],
  },
  {
    id: "hibimon-goat",
    animal: "山羊",
    name: "斯",
    temperament: "叛逆",
    stages: [
      {
        id: "goat-route",
        mainFunction: "公車、捷運，趕時間但左側都是人\n街道，橫行的司機、路邊吵架\n公司，上班被同事開會",
        condition: "",
        locationRequirement: "",
        plot: "",
        diary: "",
        level: "",
        playUnit: null,
        diaryTarget: null,
      },
    ],
  },
  {
    id: "hibimon-seal",
    animal: "海豹",
    name: "魯魯",
    temperament: "自信、調皮",
    stages: [
      {
        id: "seal-leave",
        mainFunction: "工作心煩請假",
        condition: "-",
        locationRequirement: "無",
        plot: "-",
        diary: "-",
        level: "暫時無",
        playUnit: null,
        diaryTarget: null,
      },
    ],
  },
  {
    id: "hibimon-snake",
    animal: "蛇",
    name: "斯",
    temperament: "內向",
    stages: [
      {
        id: "snake-empty",
        mainFunction: "",
        condition: "",
        locationRequirement: "",
        plot: "",
        diary: "",
        level: "",
        playUnit: null,
        diaryTarget: null,
      },
    ],
  },
  {
    id: "hibimon-cat",
    animal: "貓",
    name: "喵嗚",
    temperament: "自信、調皮",
    stages: [
      {
        id: "cat-leave",
        mainFunction: "工作心煩請假",
        condition: "-",
        locationRequirement: "無",
        plot: "-",
        diary: "-",
        level: "暫時無",
        playUnit: null,
        diaryTarget: null,
      },
    ],
  },
];

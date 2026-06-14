export const SUNBEAST_IDS = [
  "naotaro",
  "frog",
  "koala",
  "chicken",
  "cat",
] as const;

export type SunbeastId = (typeof SUNBEAST_IDS)[number];

export type SunbeastRegistryEntry = {
  id: SunbeastId;
  name: string;
  unknownName: string;
  discoveryLabel: string;
  imagePath: string;
  shadowImagePath?: string;
  photoRequirement: number;
  diaryEntryIds: string[];
  detailCaption: string;
  incompleteCaption: string;
};

export const SUNBEAST_RETAKE_CAPTURE_PROPS = {
  freeRetakeOfferText: "這張可以免費重拍一次。要再試一次嗎？",
  freeRetakeButtonLabel: "免費重拍",
  keepPhotoButtonLabel: "收下這張",
} as const;

export const SUNBEAST_REGISTRY: Record<SunbeastId, SunbeastRegistryEntry> = {
  naotaro: {
    id: "naotaro",
    name: "直太郎",
    unknownName: "???",
    discoveryLabel: "直太郎",
    imagePath: "/images/428出圖/拍照動物/黃金獵犬.png",
    photoRequirement: 1,
    diaryEntryIds: ["bai-entry-1"],
    detailCaption: "差點趕不上捷運，尾巴被夾到了，不過似乎還是不影響開心趕上車呢",
    incompleteCaption: "照片進到日記裡了。",
  },
  frog: {
    id: "frog",
    name: "青蛙",
    unknownName: "呱？",
    discoveryLabel: "呱",
    imagePath: "/images/animals/青蛙.png",
    shadowImagePath: "/images/animals/青蛙_剪影.png",
    photoRequirement: 3,
    diaryEntryIds: ["bai-entry-2", "bai-entry-5"],
    detailCaption: "三張線索照片拼起來後，青蛙小日獸的樣子終於完整出現了。",
    incompleteCaption: "照片只讓牠在日記裡留下剪影，還需要更多線索。",
  },
  koala: {
    id: "koala",
    name: "無尾熊",
    unknownName: "???",
    discoveryLabel: "無尾熊",
    imagePath: "/images/animals/放視大賞 5/無尾熊替身.png",
    photoRequirement: 1,
    diaryEntryIds: ["bai-entry-3"],
    detailCaption: "在辦公室裡拍下的小日獸，像是把依賴別人的疲憊抱得緊緊的。",
    incompleteCaption: "照片進到日記裡了。",
  },
  chicken: {
    id: "chicken",
    name: "公雞",
    unknownName: "???",
    discoveryLabel: "公雞",
    imagePath: "/images/animals/公雞.png",
    shadowImagePath: "/images/animals/公雞_剪影.png",
    photoRequirement: 1,
    diaryEntryIds: ["bai-entry-3"],
    detailCaption: "在辦公室裡意外拍下的小日獸。牠看起來非常專心，似乎會被工作的氣氛吸引。",
    incompleteCaption: "照片進到日記裡了。",
  },
  cat: {
    id: "cat",
    name: "貓",
    unknownName: "???",
    discoveryLabel: "貓",
    imagePath: "/images/animals/demo_cat.png",
    shadowImagePath: "/images/animals/demo_cat_shadow.png",
    photoRequirement: 1,
    diaryEntryIds: [],
    detailCaption: "在公車站拍下的小日獸，像是悄悄把注意力帶往別處。",
    incompleteCaption: "照片進到日記裡了。",
  },
};

export function isSunbeastId(value: string): value is SunbeastId {
  return SUNBEAST_IDS.includes(value as SunbeastId);
}

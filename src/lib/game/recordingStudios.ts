export const RECORDING_STUDIOS = [
  { id: "sunbeasts", label: "黃金獵犬 × 青蛙・拍照演出", href: "/trial/recording/sunbeasts", description: "16:9 左右雙畫面，準星依序出現、自動拍照，最後展示三星拍立得。" },
  { id: "metro", label: "捷運事件 × 小貝狗・漫畫演出", href: "/trial/recording/metro", description: "左側依序演出捷運漫畫，右側小麥同步反應，選項停留後自動接小貝狗探頭。" },
  { id: "bai-diary", label: "小白漂浮 × 發光日記・演出", href: "/trial/recording/bai-diary", description: "小麥發現漂浮的小白、呼喊她，再拿起交換日記，日記與房間同步發光。" },
  { id: "diary-puzzle", label: "搬家日記・自動拼圖", href: "/trial/recording/diary-puzzle", description: "手指自動拼好搬家第一篇的兩層拼圖，文字跟著還原，全幅空景從右向左移動。" },
  { id: "flyers", label: "日記完成 → 撿傳單・演出", href: "/trial/recording/flyers", description: "從搬家日記完成畫面，以一群隨風向右飄過的傳單轉場，自動演出兩次 MISS、最後一次 GREAT。" },
  { id: "ending", label: "街道青蛙 → 結尾標題・演出", href: "/trial/recording/ending", description: "青蛙從街道紙箱爬出，經綠色轉場進入結尾標題，角色依序登場並輕微浮動。" },
] as const;

export type RecordingStudioId = (typeof RECORDING_STUDIOS)[number]["id"];

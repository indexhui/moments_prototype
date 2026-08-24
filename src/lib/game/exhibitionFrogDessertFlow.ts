import { FROG_DIARY_CLUE_STAGES, type FrogDiaryClueStage } from "@/lib/game/frogDiaryClueFlow";

const DESSERT_INTERIOR_IMAGE =
  "/images/events/frog-dessert-shop/dessert-shop-interior.png";
const DESSERT_CAKE_BAG_IMAGE =
  "/images/events/frog-dessert-shop/dessert-shop-cake-bag.png";
const DESSERT_BAG_CLOSED_IMAGE =
  "/images/events/frog-dessert-shop/dessert-bag-closed.png";
const DESSERT_BAG_FROG_REVEAL_IMAGE =
  "/images/events/frog-dessert-shop/dessert-bag-frog-reveal.png";

const dessertStageSource = FROG_DIARY_CLUE_STAGES[2];

/** 展覽版第三次青蛙事件：逐句對齊編劇表格，不改動正式版共用資料。 */
export const EXHIBITION_DESSERT_FROG_STAGE: FrogDiaryClueStage = {
  ...dessertStageSource,
  title: "甜點店：提袋裡的青蛙",
  routeHint: "小麥記得甜點店就在公司附近，只是有點難找。",
  frogRevealLineIndex: 7,
  containerSearch: {
    afterLineIndex: 6,
    backgroundImage: DESSERT_INTERIOR_IMAGE,
    closedContainerImage: DESSERT_BAG_CLOSED_IMAGE,
    revealedContainerImage: DESSERT_BAG_FROG_REVEAL_IMAGE,
  },
  lines: [
    {
      speaker: "小麥",
      text: "終於找到了！就是這間！",
      sceneImage: DESSERT_INTERIOR_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 0 },
    },
    {
      speaker: "同事",
      text: "謝謝妳！那我去挑一下款式～",
      sceneImage: DESSERT_INTERIOR_IMAGE,
      avatar: { spriteId: "coworker", frameIndex: 0 },
    },
    {
      speaker: "小麥",
      text: "呼——幸好有找到！想當初這間店是小白推薦我、帶我來的呢……",
      isInnerThought: true,
      sceneImage: DESSERT_INTERIOR_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 0 },
    },
    {
      speaker: "小麥",
      text: "買完啦？嗯？妳怎麼這副表情？",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 14 },
    },
    {
      speaker: "同事",
      text: "嗚——剛剛超糗的，店員問我要幾歲的蠟燭，我卻怎樣都想不起來男友幾歲……",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "coworker", frameIndex: 1 },
    },
    {
      speaker: "小麥",
      text: "哎呀～有時交往太久真的會忘記這種小事呢",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 18 },
    },
    {
      speaker: "小貝狗",
      text: "嗷！提袋！提袋裡面！",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "beigo", frameIndex: 0 },
    },
    {
      speaker: "小麥",
      text: "啊！是今天白天看到的青蛙小日獸！",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 22 },
      gameSfxId: "frogJump",
    },
    {
      speaker: "小麥",
      text: "我這次一定要抓到你！",
      sceneImage: DESSERT_CAKE_BAG_IMAGE,
      avatar: { spriteId: "mai", frameIndex: 20 },
    },
  ],
};

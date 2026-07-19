import { GAME_SCENES } from "@/lib/game/scenes";

const STATIC_PRELOAD_IMAGES = [
  "/images/title_screen.jpg",
  "/images/loading/wake_up.jpg",
  "/images/cloud/cloud_01.png",
  "/images/cloud/cloud_02.png",
  "/images/cloud/cloude_03.png",
  "/images/cloud/cloude_04.png",
  "/images/logo/logo_svg.svg",
  "/images/moment_logo.png",
  "/images/park.jpg",
  "/images/street.jpg",
  "/images/breakfast.jpg",
  "/images/428出圖/背景/捷運.png",
  "/images/office.jpg",
  "/images/icon/mystery.png",
  "/images/背景/公園.png",
  "/images/背景/公司附近街道_白天.jpg",
  "/images/背景/公司_晚上.jpg",
  "/images/428出圖/背景/公司_白天.jpg",
  "/images/animals/demo_cat.png",
  "/images/animals/demo_cat_shadow.png",
  "/images/animals/公雞.png",
  "/images/animals/公雞_剪影.png",
  "/images/ostrich/ostrich_hidden.png",
  "/images/ostrich/ostrich_normal.png",
  "/images/ostrich/ostrich_hi.png",
  "/images/work/Office_Work_Dusk_Look.png",
  "/images/work/Office_Work_Dusk_Focus_G01.png",
  "/images/work/Office_Work_Day_Phone.png",
  "/images/office/mini_game/stamp_example.jpg",
  "/images/animals/青蛙.png",
  "/images/animals/青蛙_剪影.png",
  "/images/animals/青蛙_撲.png",
  "/collection/naotaro_sm.png",
  "/collection/naotaro_lg.png",
  "/images/outside/mart.jpg",
  "/images/outside/bus.jpg",
  "/images/route/straight_v1_mart.png",
  "/images/route/wide_to_narrow_pizza.png",
  "/images/route/normal_corner_leftTop.png",
  "/images/route/mystery_corner_leftTop.png",
  "/images/route/route_new/wide_to_wide_捷運.png",
  "/images/route/route_new/wide_to_wide_超商.png",
  "/images/route/route_new/wide_to_wide_街道.png",
  "/images/route/route_new/wide_to_wide_早餐店.png",
  "/images/route/route_new/wide_to_wide.png",
  "/images/route/route_new/wide_to_narrow_捷運.png",
  "/images/route/route_new/wide_to_narrow_街道.png",
  "/images/route/route_new/wide_to_narrow_早餐店.png",
  "/images/route/route_new/wide_to_narrow.png",
  "/images/route/route_new/narrow_to_wide_早餐店.png",
  "/images/route/route_new/narrow_to_wide.png",
  "/images/route/route_new/straight_捷運.png",
  "/images/route/route_new/straight_超商.png",
  "/images/route/route_new/straight_街道.png",
  "/images/route/route_new/straight_早餐店.png",
  "/images/route/route_new/straight_公車.png",
  "/images/route/route_new/straight_餐廳.png",
  "/images/route/route_new/straight.png",
  "/images/route/route_new/wide_narrow_compnay.png",
  "/images/route/rt_store_010,110,000.jpg",
  "/images/route/start_end_new/start_home_wide.jpg",
  "/images/route/start_end_new/start_home_narrow.jpg",
  "/images/route/start_end_new/end_company_narror.jpg",
  "/images/route/start_end_new/end_company_wide.jpg",
  "/images/icon/breakfast.png",
  "/images/road_pattern_ bg.jpg",
  "/images/mai_work.jpg",
  "/images/428出圖/動物事件/黃金獵犬１.png",
  "/images/428出圖/動物事件/黃金獵犬２.png",
  "/images/428出圖/拍照動物/黃金獵犬.png",
  "/images/428出圖/漫畫格/第一章/袋子裡的日記本.png",
  "/images/428出圖/漫畫格/第一章/地上的筆記本.png",
  "/images/428出圖/漫畫格/第一章/隨手扔在地上的日記本.png",
  "/images/428出圖/漫畫格/第一章/被摔到牆上的日記本.png",
  "/images/428出圖/漫畫格/第一章/掉落在地上的日記本.png",
  "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物.png",
  "/images/428出圖/漫畫格/第一章/一閃而過的神秘生物_小白房間.png",
  "/images/428出圖/漫畫格/第一章/響了的鬧鐘.png",
  "/images/comic/throw_book.png",
  "/images/comic/beigoJumpBed.jpg",
  "/images/comic/comic_market_street.png",
  "/images/428出圖/日常事件漫畫格/街道_推銷.png",
  "/images/428出圖/日常事件漫畫格/捷運公車_煞車跌倒.png",
  "/images/428出圖/日常事件漫畫格/捷運公車_背包晃過來.png",
  "/images/428出圖/日常事件漫畫格/捷運_隔壁開腿.png",
  "/images/gamePlay_demo/gameplay_demo01.png",
  "/images/gamePlay_demo/gameplay_demo02.png",
  "/images/gamePlay_demo/gameplay_demo03.png",
  "/images/outside/Home_EnterWay.png",
  "/images/outside/Home_EnterWay_Open.png",
  "/images/428出圖/漫畫格/第一章/掉在地上的人偶.png",
  "/images/428出圖/漫畫格/第一章/相機.png",
  "/images/428出圖/漫畫格/第一章/蠕動的袋子.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗１.png",
  "/images/428出圖/漫畫格/第一章/探頭的小貝狗２.png",
  "/images/428出圖/特別演出/CH01_SC03_SE03_Book.png",
  "/images/428出圖/特別演出/CH01_SC02_SE03_Beigo_Stand_Book.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Bg.png",
  "/images/428出圖/特別演出/Comic_Beigo_Reveal_01.png",
  "/images/428出圖/特別演出/Comic_Beigo_Reveal_02.png",
  "/images/428出圖/特別演出/Comic_Beigo_Reveal_03.png",
  "/images/428出圖/特別演出/Comic_Beigo_Reveal_04.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Page_Behind.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Page_01.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Page_02.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Page_03.png",
  "/images/428出圖/特別演出/Beigo_Reveal_Star.png",
  "/images/diary/diary_demo.jpg",
  "/images/diary/diary_bg.png",
  "/images/diary/diray_photo_01.jpg",
  "/images/428出圖/日記/demo_dirary_01_01.jpg",
  "/images/animals/放視大賞 5/無尾熊替身.png",
  "/images/animals/放視大賞 5/無尾熊替身剪影.png",
  "/images/mini_game/flyers_bg.png",
  "/images/mini_game/flyers_dash.svg",
  "/images/mini_game/flyers.svg",
  "/images/mini_game/flyers.png",
  "/images/tutorial/rt_MRT_111_010_111.png",
  "/images/tutorial/rt_010_010_010.png",
  "/images/tutorial/touch_demo.png",
  "/images/mai/Mai_Spirt.png",
  "/images/mai/mai&beigo_spirt.png",
  "/images/mai/walk.gif",
  "/images/mai/mai_pose.png",
  "/images/UI/speechBubble.png",
  "/images/bai/Bai_Spirt.png",
  "/images/bai/bai_fly.png",
  "/images/beigo/Beigo_Spirt.png",
  "/images/pointer_up.png",
  "/images/pointer_up_cursor.png",
  "/images/pointer_down_cursor.png",
] as const;

const ADDITIONAL_PRELOAD_IMAGES = [
  "/images/428出圖/立繪/小麥/1_一般.png",
  "/images/428出圖/立繪/小麥/2_一般（小貝狗）.png",
  "/images/428出圖/立繪/小麥/3_無表情.png",
  "/images/428出圖/立繪/小麥/4_無奈困擾.png",
  "/images/428出圖/立繪/小麥/5_無奈（小貝狗）.png",
  "/images/428出圖/立繪/小麥/6_擔心.png",
  "/images/428出圖/立繪/小麥/7_開心.png",
  "/images/428出圖/立繪/小麥/8_誒？.png",
  "/images/428出圖/立繪/小麥/9_擔心２.png",
  "/images/428出圖/立繪/小麥/10_慌亂2閉眼.png",
  "/images/428出圖/立繪/小麥/11_痛！.png",
  "/images/428出圖/立繪/小麥/12_生氣.png",
  "/images/428出圖/立繪/小麥/13_開心２.png",
  "/images/428出圖/立繪/小麥/14_慌張擔心.png",
  "/images/428出圖/立繪/小麥/15_問號.png",
  "/images/428出圖/立繪/小麥/16_問號（小貝狗）.png",
  "/images/428出圖/立繪/小麥/17_睡衣.png",
  "/images/428出圖/立繪/小麥/18_睡衣（小貝狗）.png",
  "/images/428出圖/立繪/小麥/19_釋懷.png",
  "/images/428出圖/立繪/小麥/20_釋懷（小貝狗）.png",
  "/images/428出圖/立繪/小麥/21_生氣（閉口）.png",
  "/images/428出圖/立繪/小麥/22_生氣（開口）.png",
  "/images/428出圖/立繪/小麥/23_嚴肅（開口）.png",
  "/images/428出圖/立繪/小麥/24_嚴肅（閉口）.png",
  "/images/428出圖/立繪/小麥/25_嘆氣.png",
  "/images/428出圖/立繪/小麥/26_驚嚇.png",
  "/images/428出圖/立繪/小麥/27_驚魂未定.png",
  "/images/428出圖/立繪/小麥/28_慌亂.png",
  "/images/428出圖/立繪/小麥/29_慌亂2.png",
  "/images/428出圖/立繪/小麥/30_驚嚇_小貝狗.png",
  "/images/428出圖/立繪/小麥/31_錯愕_小貝狗.png",
  "/images/428出圖/立繪/小麥/32_嘆氣_小貝狗_睡衣.png",
  "/images/428出圖/立繪/小麥/33_疑問.png",
  "/images/428出圖/立繪/小麥/34_疑問.png",
  "/images/428出圖/立繪/小麥/35_驚訝.png",
  "/images/428出圖/立繪/小麥/36_驚訝.png",
  "/images/428出圖/立繪/小麥/37_思考1.png",
  "/images/428出圖/立繪/小麥/38_思考2.png",
  "/images/428出圖/立繪/小麥/39_恍然大悟.png",
  "/images/428出圖/立繪/小白/1_一般.png",
  "/images/428出圖/立繪/小白/2_開心.png",
  "/images/428出圖/立繪/小白/3_委屈心虛.png",
  "/images/428出圖/立繪/小白/4_難過.png",
  "/images/428出圖/立繪/小白/5_開心２.png",
  "/images/428出圖/立繪/小白/6_裝傻心虛.png",
  "/images/428出圖/立繪/小白/7_熬夜一般.png",
  "/images/428出圖/立繪/小白/8_熬夜一般2.png",
  "/images/428出圖/立繪/小白/9_熬夜疑惑.png",
  "/images/428出圖/立繪/小白/10_熬夜委屈心虛.png",
  "/images/428出圖/立繪/小白/11_熬夜抱歉.png",
  "/images/428出圖/立繪/小白/12_熬夜難過.png",
  "/images/428出圖/立繪/小貝狗/1_一般.png",
  "/images/428出圖/立繪/小貝狗/2_擔心.png",
  "/images/428出圖/立繪/小貝狗/3_開心.png",
  "/images/428出圖/路人立繪/主管_一般.png",
  "/images/428出圖/路人立繪/主管_專注.png",
  "/images/428出圖/路人立繪/主管_驚訝.png",
  "/images/428出圖/背景/玄關_關門.jpg",
  "/images/clock/clock_7.png",
  "/images/comic/book.jpg",
  "/images/comic/freshen.jpg",
  "/images/diary/diary_01_1.jpg",
  "/images/diary/diary_02_01.jpg",
  "/images/diary/diary_02_02.png",
  "/images/diary/diary_02_03.png",
  "/images/diary/diary_02/diary_02_02-1.png",
  "/images/diary/diary_02/diary_02_02-2.png",
  "/images/diary/diary_02/diary_02_02-3.png",
  "/images/diary/diary_02/diary_02_02-4.png",
  "/images/diary/diary_02_2.jpg",
  "/images/diary/diary_demo_01.png",
  "/images/diary/diary_demo_02.png",
  "/images/diary/diary_demo_03.png",
  "/images/diary/dirary_01_cover.jpg",
  "/images/diary/diary_thread.jpg",
  "/images/icon/company.png",
  "/images/icon/house.png",
  "/images/icon/icon_mai.png",
  "/images/icon/mart.png",
  "/images/icon/mrt.png",
  "/images/icon/park.png",
  "/images/icon/road.png",
  "/images/icon/street.png",
  "/images/pattern/gradient_halftone_01.png",
  "/images/pattern/gz.svg",
  "/images/route/rt_000_011_010.jpg",
  "/images/route/rt_000_110_010.jpg",
  "/images/route/rt_010_010_010.png",
  "/images/route/rt_010_010_111.jpg",
  "/images/route/rt_010_011_000.jpg",
  "/images/route/rt_010_110_000.jpg",
  "/images/route/rt_100_010_001.jpg",
  "/images/route/rt_100_010_010.jpg",
  "/images/route/rt_1111_010_010.jpg",
  "/images/route/rt_1111_100_100.jpg",
  "/images/route/rt_111_010_111.jpg",
  "/images/route/rt_MRT_010_010_111.jpg",
  "/images/route/rt_MRT_111_010_010.jpg",
  "/images/route/rt_MRT_111_010_111.png",
  "/images/sticky/sticky_01.png",
  "/images/sticky/sticky_02.png",
  "/images/sticky/sticky_03.png",
  "/images/sticky/sticky_04.png",
  "/images/sticky/sticky_05.png",
  "/images/work/Office_Work_Day_Empty.png",
  "/images/work/Office_Work_Day_Focus_01.png",
  "/images/work/Office_Work_Day_Focus_02.png",
  "/images/work/Office_Work_Day_Focus_03.png",
  "/images/work/Office_Work_Day_Look.png",
  "/images/work/Office_Work_Dusk_Focus_01.png",
  "/images/work/Office_Work_Dusk_Focus_02.png",
  "/images/work/Office_Work_Dusk_Focus_03.png",
  "/images/背景/公司附近街道_白天.jpg",
  "/images/背景/公司附近街道_黃昏.jpg",
  "/images/背景/玄關_開門.jpg",
  "/images/背景/玄關_關門.jpg",
  "/slot/golden.png",
  "/walk/Sidewalk_Day.png",
] as const;

const SCENE_IMAGES = Object.values(GAME_SCENES)
  .flatMap((scene) => [
    scene.backgroundImage,
    scene.characterAvatar,
    scene.doorSwipeInteraction?.openImage,
  ])
  .filter((value): value is string => Boolean(value));

export const GAME_PRELOAD_IMAGE_URLS = Array.from(
  new Set([...STATIC_PRELOAD_IMAGES, ...ADDITIONAL_PRELOAD_IMAGES, ...SCENE_IMAGES]),
);

const imagePreloadPromises = new Map<string, Promise<void>>();

export function preloadGameImage(url: string, timeoutMs = 15000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const existing = imagePreloadPromises.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    let finished = false;
    let timer: number | null = null;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };
    const complete = (callback: () => void) => {
      if (finished) return;
      finished = true;
      cleanup();
      callback();
    };

    const resolveAfterDecode = async () => {
      try {
        if (typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        // Some formats/browsers can reject decode even after load; the loaded image is still usable.
      }
      complete(resolve);
    };

    timer = window.setTimeout(() => {
      complete(() => reject(new Error(`preload-timeout: ${url}`)));
    }, timeoutMs);

    img.onload = () => {
      void resolveAfterDecode();
    };
    img.onerror = () => {
      complete(() => reject(new Error(`preload-error: ${url}`)));
    };
    img.decoding = "async";
    img.src = url;

    if (img.complete && img.naturalWidth > 0) {
      void resolveAfterDecode();
    }
  }).catch((error) => {
    imagePreloadPromises.delete(url);
    throw error;
  });

  imagePreloadPromises.set(url, promise);
  return promise;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let cursor = 0;
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await worker(item);
      }
    }),
  );
}

export async function preloadGameImages(
  onProgress?: (progress: { loaded: number; total: number; failed: number }) => void,
) {
  const total = GAME_PRELOAD_IMAGE_URLS.length;
  let loaded = 0;
  let failed = 0;
  onProgress?.({ loaded, total, failed });

  await runWithConcurrency(
    GAME_PRELOAD_IMAGE_URLS,
    6,
    async (url) => {
      try {
        await preloadGameImage(url);
      } catch {
        failed += 1;
      } finally {
        loaded += 1;
        onProgress?.({ loaded, total, failed });
      }
    },
  );

  return { total, failed };
}

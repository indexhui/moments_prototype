import { GAME_SCENES } from "@/lib/game/scenes";

const STATIC_PRELOAD_IMAGES = [
  "/images/title_screen.jpg",
  "/images/loading/wake_up.jpg",
  "/images/logo/logo_svg.svg",
  "/images/moment_logo.png",
  "/images/park.jpg",
  "/images/street.jpg",
  "/images/breakfast.jpg",
  "/images/428出圖/背景/捷運.png",
  "/images/mrt.png",
  "/images/office.jpg",
  "/images/icon/mystery.png",
  "/images/背景/place_chicken_demo.png",
  "/images/背景/place_chicken_demo_company.png",
  "/images/背景/公司_晚上.jpg",
  "/images/animals/demo_cat.png",
  "/images/animals/demo_cat_shadow.png",
  "/images/animals/demo_chicken.png",
  "/images/work/Office_Work_Dusk_Look.png",
  "/images/work/Office_Work_Dusk_Focus_G01.png",
  "/images/work/Office_Work_Day_Phone.png",
  "/images/office/mini_game/stamp_example.jpg",
  "/collection/chicken_sm_shadow.png",
  "/collection/frog_sm_shadow.png",
  "/collection/naotaro_sm.png",
  "/collection/naotaro_lg.png",
  "/images/outside/mart.jpg",
  "/images/outside/bus.jpg",
  "/images/CH/mart_frog.jpg",
  "/images/route/straight_v1_mart.png",
  "/images/route/normal_corner_leftTop.png",
  "/images/route/mystery_corner_leftTop.png",
  "/images/route/rt_store_010,110,000.jpg",
  "/images/route/start_end/start_home_010.jpg",
  "/images/route/start_end/start_home_111.jpg",
  "/images/route/start_end/end_company_010.jpg",
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
  "/images/diary/diary_demo.jpg",
  "/images/diary/diary_bg.png",
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

const SCENE_IMAGES = Object.values(GAME_SCENES)
  .flatMap((scene) => [scene.backgroundImage, scene.characterAvatar])
  .filter((value): value is string => Boolean(value));

export const GAME_PRELOAD_IMAGE_URLS = Array.from(
  new Set([...STATIC_PRELOAD_IMAGES, ...SCENE_IMAGES]),
);

function preloadImage(url: string, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let finished = false;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };
    const complete = (callback: () => void) => {
      if (finished) return;
      finished = true;
      cleanup();
      callback();
    };

    const timer = window.setTimeout(() => {
      complete(() => reject(new Error(`preload-timeout: ${url}`)));
    }, timeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      complete(resolve);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      complete(() => reject(new Error(`preload-error: ${url}`)));
    };
    img.decoding = "async";
    img.src = url;
  });
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
        await preloadImage(url);
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

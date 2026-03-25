import { GAME_SCENES } from "@/lib/game/scenes";

const STATIC_PRELOAD_IMAGES = [
  "/images/title_screen.jpg",
  "/images/park.jpg",
  "/images/street.jpg",
  "/images/breakfast.jpg",
  "/images/mrt_01.jpg",
  "/images/mrt.png",
  "/images/office.jpg",
  "/images/mart.jpg",
  "/images/mart_frog.jpg",
  "/images/mai_work.jpg",
  "/images/demo_show_get_dog.jpg",
  "/images/CH/CH01_SC04_MRT_DogStuck.png",
  "/images/outside/Home_EnterWay.png",
  "/images/outside/Home_EnterWay_Open.png",
  "/images/comic/comic_%20puppet.png",
  "/images/tutorial/rt_MRT_111_010_111.png",
  "/images/tutorial/rt_010_010_010.png",
  "/images/tutorial/touch_demo.png",
  "/images/mai/Mai_Spirt.png",
  "/images/bai/Bai_Spirt.png",
  "/images/beigo/Beigo_Spirt.png",
] as const;

const SCENE_IMAGES = Object.values(GAME_SCENES)
  .flatMap((scene) => [scene.backgroundImage, scene.characterAvatar])
  .filter((value): value is string => Boolean(value));

export const GAME_PRELOAD_IMAGE_URLS = Array.from(
  new Set([...STATIC_PRELOAD_IMAGES, ...SCENE_IMAGES]),
);

function preloadImage(url: string, timeoutMs = 12000): Promise<void> {
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

export async function preloadGameImages(
  onProgress?: (progress: { loaded: number; total: number; failed: number }) => void,
) {
  const total = GAME_PRELOAD_IMAGE_URLS.length;
  let loaded = 0;
  let failed = 0;
  onProgress?.({ loaded, total, failed });

  await Promise.all(
    GAME_PRELOAD_IMAGE_URLS.map(async (url) => {
      try {
        await preloadImage(url);
      } catch {
        failed += 1;
      } finally {
        loaded += 1;
        onProgress?.({ loaded, total, failed });
      }
    }),
  );

  return { total, failed };
}

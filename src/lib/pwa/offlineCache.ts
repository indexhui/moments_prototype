export type OfflineCacheProgress = {
  loaded: number;
  total: number;
  failed: number;
};

export type OfflineCacheResult = OfflineCacheProgress & {
  timedOut?: boolean;
};

function canUseServiceWorker() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    (window.isSecureContext || window.location.hostname === "localhost")
  );
}

export async function registerMomentServiceWorker() {
  if (!canUseServiceWorker()) return null;

  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function warmOfflineCache(
  onProgress?: (progress: OfflineCacheProgress) => void,
  options: { timeoutMs?: number } = {},
): Promise<OfflineCacheResult | null> {
  if (!canUseServiceWorker()) return null;

  const registration = await navigator.serviceWorker.ready;
  const worker =
    registration.active ?? registration.waiting ?? registration.installing ?? navigator.serviceWorker.controller;

  if (!worker) return null;

  const timeoutMs = options.timeoutMs ?? 120000;

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let latest: OfflineCacheResult = { loaded: 0, total: 0, failed: 0 };
    let finished = false;

    const finish = (result: OfflineCacheResult) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      channel.port1.close();
      resolve(result);
    };

    const timeout = window.setTimeout(() => {
      finish({ ...latest, timedOut: true });
    }, timeoutMs);

    channel.port1.onmessage = (event) => {
      const data = event.data as
        | { type: "OFFLINE_CACHE_PROGRESS"; loaded: number; total: number; failed: number }
        | { type: "OFFLINE_CACHE_DONE"; loaded: number; total: number; failed: number }
        | { type: "OFFLINE_CACHE_ERROR"; message?: string };

      if (data.type === "OFFLINE_CACHE_PROGRESS" || data.type === "OFFLINE_CACHE_DONE") {
        latest = {
          loaded: data.loaded,
          total: data.total,
          failed: data.failed,
        };
        onProgress?.(latest);
      }

      if (data.type === "OFFLINE_CACHE_DONE") {
        finish(latest);
      }

      if (data.type === "OFFLINE_CACHE_ERROR") {
        finish(latest);
      }
    };

    worker.postMessage({ type: "CACHE_OFFLINE_ASSETS" }, [channel.port2]);
  });
}

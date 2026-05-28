const CACHE_PREFIX = "moment-prototype";
const CACHE_VERSION = "v1";
const CORE_CACHE = `${CACHE_PREFIX}-core-${CACHE_VERSION}`;
const OFFLINE_CACHE = `${CACHE_PREFIX}-offline-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const OFFLINE_MANIFEST_URL = "/offline-cache-manifest.json";

const CORE_URLS = [
  "/",
  "/vision",
  "/trial/gameworks",
  "/game",
  "/manifest.webmanifest",
  "/favicon.png",
  "/images/title_screen.jpg",
  "/images/logo/logo_svg.svg",
  "/images/QR/早起玩家招募QR.png",
  "/images/QR/放視大賞試玩回饋.png",
];

function toAbsoluteUrl(url) {
  return new URL(url, self.location.origin).toString();
}

function toRequest(url, options = {}) {
  return new Request(toAbsoluteUrl(url), {
    credentials: "same-origin",
    ...options,
  });
}

function isCacheableResponse(response) {
  return response && response.ok && (response.type === "basic" || response.type === "cors");
}

async function cacheUrl(cache, url, options = {}) {
  const request = toRequest(url, { cache: options.cache || "reload" });
  const cached = options.skipCached ? null : await cache.match(request);
  if (cached) return true;

  const response = await fetch(request);
  if (!isCacheableResponse(response)) return false;
  await cache.put(request, response.clone());
  return true;
}

async function warmUrls(cacheName, urls, port) {
  const cache = await caches.open(cacheName);
  const uniqueUrls = Array.from(new Set(urls));
  let cursor = 0;
  let loaded = 0;
  let failed = 0;
  const total = uniqueUrls.length;

  const notify = () => {
    if (!port) return;
    port.postMessage({
      type: "OFFLINE_CACHE_PROGRESS",
      loaded,
      total,
      failed,
    });
  };

  notify();

  await Promise.all(
    Array.from({ length: Math.min(8, total) }, async () => {
      while (cursor < total) {
        const url = uniqueUrls[cursor];
        cursor += 1;
        try {
          await cacheUrl(cache, url);
        } catch {
          failed += 1;
        } finally {
          loaded += 1;
          notify();
        }
      }
    }),
  );

  return { loaded, total, failed };
}

async function getOfflineManifestUrls() {
  const response = await fetch(toRequest(OFFLINE_MANIFEST_URL, { cache: "reload" }));
  if (!response.ok) return [];

  const manifest = await response.json();
  return Array.isArray(manifest.urls) ? manifest.urls : [];
}

async function warmOfflineCache(port) {
  try {
    const manifestUrls = await getOfflineManifestUrls();
    const result = await warmUrls(OFFLINE_CACHE, [...CORE_URLS, ...manifestUrls], port);
    if (port) {
      port.postMessage({
        type: "OFFLINE_CACHE_DONE",
        loaded: result.loaded,
        total: result.total,
        failed: result.failed,
      });
    }
  } catch (error) {
    if (port) {
      port.postMessage({
        type: "OFFLINE_CACHE_ERROR",
        message: error instanceof Error ? error.message : "offline-cache-error",
      });
    }
  }
}

async function cleanupOldCaches() {
  const keep = new Set([CORE_CACHE, OFFLINE_CACHE, RUNTIME_CACHE]);
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
      .map((name) => caches.delete(name)),
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const pathnameRequest = toRequest(url.pathname);
    const fallback =
      (await caches.match(request)) ||
      (await caches.match(pathnameRequest)) ||
      (url.pathname.startsWith("/game") ? await caches.match(toRequest("/game")) : null) ||
      (await caches.match(toRequest("/vision"))) ||
      (await caches.match(toRequest("/")));

    if (fallback) return fallback;
    throw new Error(`offline-navigation-miss: ${url.pathname}`);
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|mp3|png|svg|webmanifest|webp|woff2?)$/i.test(
      url.pathname,
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await warmUrls(CORE_CACHE, CORE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await cleanupOldCaches();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const messageType = event.data && event.data.type;

  if (messageType === "CACHE_OFFLINE_ASSETS") {
    event.waitUntil(warmOfflineCache(event.ports && event.ports[0]));
  }

  if (messageType === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, OFFLINE_CACHE));
  }
});

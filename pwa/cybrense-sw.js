const CYBRENSE_SW_VERSION = "cybrense-mail-pwa-v3";
const CYBRENSE_STATIC_CACHE = CYBRENSE_SW_VERSION + "-static";
const CYBRENSE_OFFLINE_URL = "/offline.html";
const CYBRENSE_STATIC_ASSETS = [
  CYBRENSE_OFFLINE_URL,
  "/cybrense-manifest.json",
  "/static.php/skins/elastic/branding/logo_dark.png",
  "/static.php/skins/elastic/branding/pwa-icon-192.png",
  "/static.php/skins/elastic/branding/pwa-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CYBRENSE_STATIC_CACHE)
      .then((cache) => cache.addAll(CYBRENSE_STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("cybrense-mail-pwa-") && key !== CYBRENSE_STATIC_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // Authenticated Roundcube responses and message bodies are deliberately
  // never written to Cache Storage. Only a static offline page is cached.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(CYBRENSE_OFFLINE_URL))
    );
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin === self.location.origin && CYBRENSE_STATIC_ASSETS.includes(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => new Response("", {
      status: 503,
      statusText: "Offline"
    }))
  );
});

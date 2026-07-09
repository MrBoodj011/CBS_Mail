const CYBRENSE_SW_VERSION = "cybrense-mail-pwa-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => new Response("", {
      status: 503,
      statusText: "Offline"
    }))
  );
});

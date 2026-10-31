/* Gatik Events service worker: static assets and an offline fallback only.
   Authenticated HTML and API responses are never cached. */
const CACHE = "gatik-static-v2";
const STATIC_ASSETS = [
  "/offline",
  "/manifest.webmanifest",
  "/icons/gatik.jpg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/fonts/manrope-latin.woff2",
  "/fonts/instrument-serif-latin.woff2",
  "/fonts/instrument-serif-italic-latin.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Never cache requests carrying authentication state or non-static pages.
  if (request.headers.has("authorization")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((response) => response || Response.error()))
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/");

  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

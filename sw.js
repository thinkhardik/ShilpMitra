// sw.js — ShilpMitra service worker.
// Caches the app shell (the 3 HTML pages + icons) so the app opens instantly
// and works even with a flaky connection. API calls to the backend always go
// to the network (never cached) so data stays live.

const CACHE_NAME = 'shilpmitra-v1';
const APP_SHELL = [
  './index.html',
  './karigar-dashboard.html',
  './buyer-marketplace.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls to the backend — always hit the network so data is fresh.
  if (url.pathname.startsWith('/api/') || url.port === '4000') {
    return; // let the browser handle it normally
  }

  // Only handle same-origin GET requests for the app shell; everything else
  // (fonts, GSAP, Razorpay checkout.js) goes straight to the network.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});

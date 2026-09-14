/* Weight & Waist Tracker — service worker
   Simple cache-first strategy: after the first successful load, the app
   shell is cached so it keeps working with no network connection.
   All real data still lives in localStorage on the device — this worker
   never touches app data, only the static files (html/manifest/icons). */

const CACHE_NAME = 'weight-tracker-v2'; /* bump this string whenever you redeploy index.html so the new version is fetched */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); /* offline: fall back to whatever is cached */
      return cached || network;
    })
  );
});

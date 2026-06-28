const CACHE_NAME = '19nsj-cache-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Exclude non-http requests (like chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // Simple Network-first strategy for dev (MVP)
  // Falls back to cache when offline
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return res;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});

const CACHE_NAME = 'albany-cache-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './sw.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache=>{
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(response=>{
      return response || fetch(e.request);
    })
  );
});

const CACHE_NAME = 'silent-guardian-v1';
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/','/index.html','/offline.html']))));
self.addEventListener('fetch', (e) => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));

var CACHE_NAME = 'peta-kalitalang-v2';

// 1. Install & Pre-cache File Lokal Utama
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                './',
                './index.html',
                './css/leaflet.css',
                './js/leaflet.js',
                './manifest.json'
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

// 2. Fetch Event: Ambil dari Cache dulu, jika belum ada ambil dari Network & Simpan (Termasuk Tile Google)
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            // Jika file/tile sudah ada di cache, langsung gunakan
            if (response) {
                return response;
            }

            // Jika belum ada, ambil dari internet
            return fetch(event.request).then(function(networkResponse) {
                // PENTING: Izinkan menyimpan status 200 ATAU status 0 (opaque response dari Google Satellite)
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(function() {
                // Mengabaikan error jika offline dan file tidak ada di cache
            });
        })
    );
});
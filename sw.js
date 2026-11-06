var CACHE_NAME = 'peta-kalitalang-v4';
var CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/leaflet.css',
    './css/L.Control.Layers.Tree.css',
    './css/L.Control.Locate.min.css',
    './css/qgis2web.css',
    './css/fontawesome-all.min.css',
    './css/leaflet.photon.css',
    './js/qgis2web_expressions.js',
    './js/leaflet.js',
    './js/L.Control.Layers.Tree.min.js',
    './js/L.Control.Locate.min.js',
    './js/leaflet.rotatedMarker.js',
    './js/leaflet.pattern.js',
    './js/leaflet-hash.js',
    './js/Autolinker.min.js',
    './js/rbush.min.js',
    './js/labelgun.min.js',
    './js/labels.js',
    './js/leaflet.photon.js',
    './data/JalurTracking_2.js',
    './data/PosTracking_3.js',
    './data/basemap_1.png',
    './legend/PosTracking_3.png',
    './legend/JalurTracking_2.png',
    './legend/icon.png',
    './legend/logo-unnes.png',
    './legend/logo-berdampak.png',
    './legend/logo-bima.png',
    './legend/logo-klaten.png',
    './legend/logo-klaten.jpg',
    './webfonts/fa-solid-900.woff2',
    './webfonts/fa-solid-900.ttf',
    './css/images/layers.png',
    './css/images/layers-2x.png',
    './css/images/marker-icon.png',
    './css/images/marker-icon-2x.png',
    './css/images/marker-shadow.png'
];
// 1. Install & Pre-cache Seluruh File Lokal Utama (termasuk logo, jalur, pos, dan basemap)
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.allSettled(
                CORE_ASSETS.map(function(url) {
                    return cache.add(url).catch(function(err) {
                        console.warn('Gagal pre-cache asset:', url, err);
                    });
                })
            );
        })
    );
});
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(
                keyList.map(function(key) {
                    if (key !== CACHE_NAME && key.indexOf('peta-kalitalang-') === 0) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(function() {
            return clients.claim();
        })
    );
});
// 2. Fetch Event: Ambil dari Cache dulu, jika belum ada ambil dari Network & Simpan (Termasuk Tile Google)
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request).then(function(networkResponse) {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(function() {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

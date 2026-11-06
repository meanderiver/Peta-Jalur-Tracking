var CACHE_NAME = 'peta-kalitalang-v6';

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

// Ambil ulang seluruh file utama langsung dari server/disk (bypass HTTP disk cache) lalu simpan ke CacheStorage untuk mode offline
function refreshCoreCache() {
    return caches.open(CACHE_NAME).then(function(cache) {
        return Promise.allSettled(
            CORE_ASSETS.map(function(url) {
                var req = new Request(url, { cache: 'no-store' });
                return fetch(req).then(function(res) {
                    if (res && res.status === 200) {
                        return cache.put(url, res);
                    }
                }).catch(function(err) {
                    console.warn('Gagal pre-cache asset:', url, err);
                });
            })
        );
    });
}

// 1. Install: Langsung aktifkan Service Worker baru & muat aset terbaru
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(refreshCoreCache());
});

// 2. Activate: Bersihkan semua cache versi lama & segarkan tab yang sedang terbuka
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keyList) {
            var hadOldCache = false;
            return Promise.all(
                keyList.map(function(key) {
                    if (key !== CACHE_NAME) {
                        hadOldCache = true;
                        return caches.delete(key);
                    }
                })
            ).then(function() {
                return self.clients.claim().then(function() {
                    if (hadOldCache) {
                        return self.clients.matchAll({ type: 'window' }).then(function(windowClients) {
                            windowClients.forEach(function(client) {
                                client.postMessage({ type: 'CACHE_UPDATED_RELOAD' });
                                if (typeof client.navigate === 'function') {
                                    client.navigate(client.url).catch(function() {});
                                }
                            });
                        });
                    }
                });
            });
        })
    );
});

// 3. Message Listener: Tangani perintah refresh cache langsung saat pengguna me-refresh halaman
self.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data.type === 'FORCE_REFRESH_CACHE') {
        event.waitUntil(
            caches.keys().then(function(keys) {
                return Promise.all(
                    keys.map(function(k) {
                        return caches.delete(k);
                    })
                );
            }).then(function() {
                return refreshCoreCache();
            })
        );
    }
});

// 4. Fetch Event:
// - Saat ONLINE: Selalu ambil file terbaru dari server/disk menggunakan { cache: 'no-store' }
//   agar setiap perubahan kode/data langsung tampil saat di-refresh tanpa perlu hapus cache manual,
//   kemudian salinannya disimpan ke CacheStorage untuk penggunaan offline.
// - Saat OFFLINE: Otomatis mengambil dari CacheStorage.
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;

    var requestUrl = new URL(event.request.url);
    var isSameOrigin = requestUrl.origin === self.location.origin;

    if (isSameOrigin) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }).then(function(networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(function() {
                return caches.match(event.request, { ignoreSearch: true }).then(function(cachedResponse) {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html', { ignoreSearch: true });
                    }
                });
            })
        );
        return;
    }

    // Tile eksternal (Google Satellite)
    event.respondWith(
        fetch(event.request).then(function(networkResponse) {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                var responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
        }).catch(function() {
            return caches.match(event.request);
        })
    );
});

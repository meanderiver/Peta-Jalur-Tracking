var cacheName = 'evakuasi-v10';
var filesToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/leaflet.css',
  './css/L.Control.Layers.Tree.css',
  './css/L.Control.Locate.min.css',
  './css/qgis2web.css',
  './css/fontawesome-all.min.css',
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
  // FILE DATA SPASIAL SESUAI HASIL EXPORT
  './data/basemap_1.png', 
  './data/JalurTracking_2.js', 
  './data/PosTracking_3.js' 
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(cacheName).then(function(cache) {
    return Promise.all(filesToCache.map(function(url) {
      return cache.add(url).catch(function(err) { console.log('File dilewati:', url); });
    }));
  }));
});

self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(response) {
    if (response) return response; 
    return fetch(e.request).then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        var responseToCache = networkResponse.clone();
        caches.open(cacheName).then(function(cache) { cache.put(e.request, responseToCache); });
      }
      return networkResponse;
    }).catch(function() {
      if (e.request.mode === 'navigate') return caches.match('./index.html') || caches.match('./');
    });
  }));
});
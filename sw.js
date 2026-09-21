/* PAUL-3D-SWORD-2026 service worker — offline cache */
const CACHE = 'paul-3d-sword-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/game.js',
  './js/character-mesh.js',
  './js/adventure-3d.js',
  './js/audio-mobile.js',
  './js/achievements.js',
  './js/vfx.js',
  './js/level1-3d.js',
  './js/level1-phaser.js',
  './js/libs/three.min.js',
  './js/libs/phaser.min.js',
  './assets/cover.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

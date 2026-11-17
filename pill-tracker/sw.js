/*
 * Service Worker - 缓存优先离线策略
 * 架构参考 amajid17/work-tracker (MIT)：单文件应用 + sw.js 缓存 app shell。
 * 数据存于 localStorage，不经过 SW，因此更新数据无需改缓存版本。
 * 升级应用时把 CACHE_NAME 版本号 +1，activate 阶段会自动清理旧缓存。
 */
var CACHE_NAME = 'pill-tracker-v3';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // 导航请求离线回退到 app shell
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

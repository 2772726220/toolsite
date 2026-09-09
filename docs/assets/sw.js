/* 在线工具箱 · 极简 Service Worker：缓存静态资源与最近访问页面，加速回访并提供离线兜底 */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open('toolsite-v1').then(function (c) {
      return c.addAll(['./', './assets/app.css', './manifest.webmanifest']);
    })
  );
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== 'toolsite-v1'; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 优先网络，失败时回退缓存（保证工具始终使用最新版本）
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && (url.pathname.endsWith('/') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.webmanifest'))) {
        var copy = res.clone();
        caches.open('toolsite-v1').then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./'); });
    })
  );
});
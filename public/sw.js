/* ══════════════════════════════════════
   大安ㄍㄤㄍㄤ好籃球聯盟 — Service Worker
   策略：network-first（優先連網取最新資料，離線才用快取）
   ══════════════════════════════════════ */

const CACHE_NAME = 'taan-basketball-v1';

const STATIC_ASSETS = [
  './index.html',
  './schedule.html',
  './standings.html',
  './boxscore.html',
  './leaders.html',
  './roster.html',
  './dragon.html',
  './rotation.html',
  './stats.html',
  './history.html',
  './hof.html',
  './announce.html',
  './shared-styles.css',
  './shared-app.js',
  './js/api.js',
  './js/mock-data.js',
  './js/page-home.js',
  './js/page-schedule.js',
  './js/page-standings.js',
  './js/page-boxscore.js',
  './js/page-leaders.js',
  './js/page-roster.js',
  './js/page-dragon.js',
  './js/page-rotation.js',
  './js/page-stats.js',
  './js/page-hof.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ── Install：預快取所有靜態資源 ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ── Activate：清除舊版快取 ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch：network-first 策略 ── */
self.addEventListener('fetch', event => {
  // 只處理 GET，跳過 Google Sheets API（讓它直接連網）
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 連網成功：更新快取並回傳
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 離線：從快取取
        return caches.match(event.request);
      })
  );
});

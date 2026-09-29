// 每次发布新版本时，把版本号 +1，旧缓存会被自动清理
const CACHE = 'guitar-practice-v6';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/core/theory.js',
  './js/core/audio.js',
  './js/core/chords-data.js',
  './js/core/diagram.js',
  './js/core/store.js',
  './js/core/tools.js',
  './js/core/help.js',
  './js/core/learnpath.js',
  './js/core/growth.js',
  './js/core/course.js',
  './js/core/today.js',
  './js/data/course-ch1.js',
  './js/data/course-ch2.js',
  './js/data/course-ch3.js',
  './js/data/course-ch4.js',
  './js/tools/metronome.js',
  './js/tools/drum-machine.js',
  './js/tools/chord-drum.js',
  './js/tools/backing.js',
  './js/tools/strum-follow.js',
  './js/tools/strum-adv.js',
  './js/tools/chord-random.js',
  './js/tools/chord-switch.js',
  './js/tools/ear.js',
  './js/tools/song-follow.js',
  './js/tools/my-tabs.js',
  './js/tools/tuner.js',
  './js/tools/capo-calc.js',
  './js/tools/transpose.js',
  './js/tools/chord-query.js',
  './js/tools/key-helper.js',
  './js/tools/chord-morph.js',
  './js/tools/scale-trainer.js',
  './js/tools/caged-circle.js',
  './js/tools/theory-book.js',
  './js/app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 网络优先：保证用户总能拿到最新版本；断网时回退缓存，保持离线可用
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

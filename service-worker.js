// Service Worker do Olimpo Finanças (PWA)
// Estratégia segura: navegações (HTML) = network-first (sempre pega a versão nova quando
// online; cai no cache só offline). Assets same-origin = stale-while-revalidate.
// Requisições externas (Supabase, CDN do supabase-js, Google Fonts) NÃO são interceptadas:
// vão direto à rede, como sempre.
const CACHE = 'olimpo-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Só cuidamos do mesmo domínio; Supabase/CDN/fonts seguem direto pra rede.
  if (url.origin !== self.location.origin) return;

  // HTML (navegação): rede primeiro, cache como reserva offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais assets do próprio domínio (ícones etc.): usa cache e atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});

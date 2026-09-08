// Service worker do SigRouter.
// Guarda os arquivos na primeira visita para o app abrir offline depois.
// A versao no nome do cache dispara a atualizacao: ao publicar, incremente o numero.
const CACHE = 'sigrouter-v12';
const ARQUIVOS = ['./index.html', './manifest.json', './icone-192.png', './icone-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro, cache como reserva: uma versao nova chega assim que houver internet,
// e a falta dela nunca impede de abrir.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      // So guarda resposta BOA. Sem esta checagem, um 404 ou 500 momentaneo entrava no
      // cache e o app passava a abrir a pagina de erro offline, ate a proxima publicacao.
      if (r && r.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(e.request, r.clone());
      }
      return r;
    } catch (err) {
      const achou = await caches.match(e.request);
      return achou || await caches.match('./index.html');
    }
  })());
});

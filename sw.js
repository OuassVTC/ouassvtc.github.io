// sw.js v3 - laisser passer le HTML pour qu'il se mette à jour
const CACHE_NAME = 'ouassvtc-static-v3';
const ASSETS = [
  '/',            // la racine
  '/vtc-perpignan.png',
  '/manifest.json'
  // ajoute ici tes autres fichiers statiques si besoin
];

// installer
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// activer (nettoyer anciens caches)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});

// stratégie : pour le HTML -> réseau d'abord
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // pour les pages html, on veut toujours la version en ligne
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // pour le reste (images, manifest...), cache d'abord
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});

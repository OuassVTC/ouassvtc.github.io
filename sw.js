// sw.js v5 - OuassVTC

const CACHE_NAME = 'ouassvtc-static-v5';

const ASSETS = [
  '/vtc-perpignan.png',
  '/ouassvtc-app.png',
  '/manifest.json'
];


self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(
          cache =>
            cache.addAll(ASSETS)
        )

        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          keys => {

            return Promise.all(

              keys

                .filter(
                  key =>
                    key !== CACHE_NAME
                )

                .map(
                  key =>
                    caches.delete(key)
                )

            );

          }
        )

        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


self.addEventListener(
  'fetch',
  event => {

    const req =
      event.request;


    /*
      LES PAGES HTML SONT TOUJOURS
      CHARGÉES DEPUIS INTERNET.

      Cela évite de garder
      un ancien index.html en cache.
    */

    if(
      req.mode === 'navigate'
    ){

      event.respondWith(

        fetch(
          req,
          {
            cache:'no-store'
          }
        )

        .catch(
          () =>
            caches.match('/')
        )

      );

      return;

    }


    /*
      IMAGES / MANIFEST
    */

    event.respondWith(

      caches
        .match(req)

        .then(
          cached => {

            if(cached){

              return cached;

            }

            return fetch(req);

          }
        )

    );

  }
);

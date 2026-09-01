// sw.js v11 - OuassVTC

const CACHE_NAME =
  "ouassvtc-static-v11";


const ASSETS = [
  "/",
  "/vtc-perpignan.png",
  "/ouassvtc-app.png",
  "/manifest.json"
];


/* INSTALLATION */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(
          cache =>
            cache.addAll(
              ASSETS
            )
        )

        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


/* ACTIVATION */

self.addEventListener(
  "activate",
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
                    caches.delete(
                      key
                    )
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


/* REQUÊTES */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    if(
      request.mode ===
      "navigate"
    ){

      event.respondWith(

        fetch(
          request,
          {
            cache:"no-store"
          }
        )

        .then(
          response => {

            const copy =
              response.clone();


            caches
              .open(
                CACHE_NAME
              )

              .then(
                cache => {

                  cache.put(
                    "/",
                    copy
                  );

                }
              );


            return response;

          }
        )

        .catch(
          () =>
            caches.match("/")
        )

      );


      return;

    }


    event.respondWith(

      caches
        .match(
          request
        )

        .then(
          cached => {

            if(cached){
              return cached;
            }


            return fetch(
              request
            );

          }
        )

    );

  }
);

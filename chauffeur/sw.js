importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA0DXbsmSkymE55YZfZytGa-newiXBw2lU",
  authDomain: "ouassvtc-chauffeur-da466.firebaseapp.com",
  projectId: "ouassvtc-chauffeur-da466",
  storageBucket: "ouassvtc-chauffeur-da466.firebasestorage.app",
  messagingSenderId: "394811166195",
  appId: "1:394811166195:web:23da8a59731c22c6f51686"
});

const messaging = firebase.messaging();

const SW_VERSION = "79.43.20261117.01";
const CACHE_NAME = "ouassvtc-chauffeur-v79.43.20261117.01";

const APP_SHELL = [
  "/chauffeur/",
  "/chauffeur/index.html",
  "/chauffeur/chauffeur.html",
  "/chauffeur/mission.html",
  "/chauffeur/manifest.json",
  "/chauffeur/manifest-chauffeur.json",
  "/firebase-config.js",
  "/ouassvtc-app.png"
];

const OFFLINE_DEPENDENCY_HOSTS = new Set([
  "www.gstatic.com",
  "cdn.jsdelivr.net"
]);

messaging.onBackgroundMessage(payload => {
  const title = payload.data?.title || payload.notification?.title || "Nouvelle réservation OuassVTC";
  const bookingId = payload.data?.bookingId || "";
  const url = payload.data?.url || (bookingId
    ? `/chauffeur/?booking=${encodeURIComponent(bookingId)}`
    : "/chauffeur/");
  const options = {
    body: payload.data?.body || payload.notification?.body || "Une nouvelle demande de trajet vient d’arriver.",
    icon: "/ouassvtc-app.png",
    badge: "/ouassvtc-app.png",
    tag: payload.data?.tag || (bookingId ? `ouassvtc-booking-${bookingId}` : "ouassvtc-notification"),
    renotify: true,
    vibrate: [500, 250, 500, 900, 500],
    data: { url, bookingId }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        APP_SHELL.map(url => cache.add(url).catch(() => undefined))
      ))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("ouassvtc-chauffeur-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isLocal = requestUrl.origin === self.location.origin;
  const isOfflineDependency =
    OFFLINE_DEPENDENCY_HOSTS.has(requestUrl.hostname) &&
    ["script", "style", "font"].includes(event.request.destination);

  if (!isLocal && isOfflineDependency) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && (response.ok || response.type === "opaque")) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, copy))
                .catch(() => {})
            );
          }
          return response;
        });
      })
    );
    return;
  }

  if (!isLocal) return;

  const isFreshHtml =
    event.request.mode === "navigate" ||
    requestUrl.pathname === "/chauffeur/" ||
    requestUrl.pathname === "/chauffeur/index.html" ||
    requestUrl.pathname === "/chauffeur/mission.html" ||
    requestUrl.pathname === "/chauffeur/chauffeur.html";

  if (isFreshHtml) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, copy))
                .catch(() => {})
            );
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          if (requestUrl.pathname === "/chauffeur/chauffeur.html") {
            const partnerFallback = await caches.match("/chauffeur/chauffeur.html");
            if (partnerFallback) return partnerFallback;
          }

          const fallback = await caches.match("/chauffeur/");
          return fallback || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, copy))
              .catch(() => {})
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/chauffeur/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(async clients => {
        for (const client of clients) {
          if ("navigate" in client) await client.navigate(targetUrl);
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type !== "OUASSVTC_HEALTH_CHECK") return;
  const response = {
    ok: true,
    text: "Service worker actif",
    version: SW_VERSION,
    cache: CACHE_NAME
  };
  if (event.ports?.[0]) event.ports[0].postMessage(response);
});

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
messaging.onBackgroundMessage(payload => {
  const title = payload.data?.title || "Nouvelle réservation OuassVTC";
  const options = {
    body: payload.data?.body || "Une nouvelle demande de trajet vient d’arriver.",
    icon: "/ouassvtc-app.png",
    badge: "/ouassvtc-app.png",
    tag: payload.data?.tag || "ouassvtc-new-booking",
    renotify: true,
    vibrate: [500, 250, 500, 900, 500],
    data: { url: "/chauffeur/" }
  };
  return self.registration.showNotification(title, options);
});

const CACHE_NAME = "ouassvtc-chauffeur-v7";
const APP_SHELL = [
  "/chauffeur/",
  "/chauffeur/manifest.json",
  "/ouassvtc-app.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("ouassvtc-chauffeur-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match("/chauffeur/")))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/chauffeur/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(openClients => {
      const existing = openClients.find(client => new URL(client.url).pathname.startsWith("/chauffeur"));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});


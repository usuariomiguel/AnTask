const CACHE_NAME = "ansotask-v13";
const CORE_ASSETS = ["./", "./index.html", "./src/css/style.css", "./src/js/script.js", "./src/js/notifications.js", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

// ─── NOTIFICACIONES ─────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      const url = new URL(client.url);
      if (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html")) {
        client.postMessage({ type: "antask-notif-click", data: data });
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      let target = "./";
      if (data.projectId) {
        target += "?project=" + encodeURIComponent(data.projectId);
        if (data.taskId) target += "&task=" + encodeURIComponent(data.taskId);
      }
      return self.clients.openWindow(target);
    }
  })());
});

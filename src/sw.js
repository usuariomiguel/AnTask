import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

// Lista de assets precacheados inyectada por vite-plugin-pwa en el build.
// En dev se sustituye por un array vacío.
precacheAndRoute(self.__WB_MANIFEST);

// Elimina caches de versiones anteriores al activarse el nuevo SW.
cleanupOutdatedCaches();

// Toma el control inmediato de las pestañas abiertas al instalarse.
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// ── Estrategia fetch: network-first con fallback a cache ──────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open("antask-runtime-v1").then((cache) =>
            cache.put(event.request, clone)
          );
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/index.html"))
      )
  );
});

// ── Notificaciones ────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        const url = new URL(client.url);
        if (
          url.pathname.endsWith("/") ||
          url.pathname.endsWith("/index.html")
        ) {
          client.postMessage({ type: "antask-notif-click", data });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        let target = "./";
        if (data.projectId) {
          target += "?project=" + encodeURIComponent(data.projectId);
          if (data.taskId)
            target += "&task=" + encodeURIComponent(data.taskId);
        }
        return self.clients.openWindow(target);
      }
    })()
  );
});

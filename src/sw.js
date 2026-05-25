import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

// Lista de assets precacheados inyectada por vite-plugin-pwa en el build.
// En dev se sustituye por un array vacío.
precacheAndRoute(self.__WB_MANIFEST);

// Elimina caches de versiones anteriores al activarse el nuevo SW.
cleanupOutdatedCaches();

// Toma el control inmediato de las pestañas abiertas al instalarse.
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// ── Dominios que el SW NO debe interceptar ───────────────────
// Firebase Auth, Google APIs y OAuth necesitan llegar a la red
// sin pasar por el SW (rompen el flujo de signInWithRedirect).
const SW_BYPASS_HOSTS = [
  "apis.google.com",
  "accounts.google.com",
  "www.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "firebaseapp.com",
  "plausible.io",
];

function shouldBypass(url) {
  if (!url.protocol.startsWith("http")) return true; // chrome-extension://, etc.
  return SW_BYPASS_HOSTS.some((host) => url.hostname.endsWith(host));
}

// ── Estrategia fetch: network-first con fallback a cache ──────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch (_) {
    return; // URL inválida → dejar pasar al navegador
  }

  if (shouldBypass(url)) return; // No interceptar → comportamiento nativo

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open("antask-runtime-v1").then((cache) => {
            try { cache.put(event.request, clone); } catch (_) {}
          });
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/index.html"))
          .then((res) => res || new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          }))
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

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";

// Versión de la app (package.json): sale en Ajustes › Acerca de. Se sube
// con cada publicación: arreglo → 2.0.1, función nueva → 2.1.0, cambio
// grande → 3.0.0.
const APP_VERSION = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version;

// URL pública para las etiquetas Open Graph (og:url, og:image), que las
// redes exigen absolutas. En Vercel sale del dominio de producción; en
// local queda vacía y las rutas se quedan relativas.
const SITE_URL = (process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : ""))
  .replace(/\/$/, "");

/**
 * Páginas estáticas (landing, privacidad, términos):
 * - `%SITE_URL%` se sustituye por la URL pública.
 * - `<!-- LEGAL:PRIVACY.md -->` se sustituye por ese Markdown convertido a
 *   HTML: la política y los términos viven en un único sitio (los .md del
 *   repo) y la web los publica tal cual.
 */
function paginasEstaticas() {
  return {
    name: "antrack-paginas-estaticas",
    transformIndexHtml(html) {
      return html
        .replace(/%SITE_URL%/g, SITE_URL)
        .replace(/%APP_VERSION%/g, APP_VERSION)
        .replace(/<!-- LEGAL:([A-Z]+\.md) -->/g, function (_, fichero) {
          // breaks: un salto de línea simple del .md es un salto en la web
          // (p. ej. «AnTrack» y el email de contacto, cada uno en su línea).
          return marked.parse(readFileSync(resolve(__dirname, fichero), "utf8"), { breaks: true });
        });
    },
  };
}
// @ts-ignore — Vitest injects the `test` key; plain Vite ignores it.
export default defineConfig(({ command }) => ({
  root: ".",
  publicDir: "public",

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // La app sigue en la raíz; las páginas públicas van en sus rutas.
      input: {
        app: resolve(__dirname, "index.html"),
        inicio: resolve(__dirname, "inicio/index.html"),
        privacidad: resolve(__dirname, "privacidad/index.html"),
        terminos: resolve(__dirname, "terminos/index.html"),
      },
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase";
          }
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    include: ["src/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/js/utils/**", "src/js/state/sanitize.js"],
      reporter: ["text", "html"],
    },
  },

  plugins: [
    paginasEstaticas(),
    VitePWA({
      // injectManifest: usamos src/sw.js como base y el plugin
      // inyecta la lista de precache en self.__WB_MANIFEST.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      // En build: actualización automática silenciosa. En dev: "prompt"
      // para que el SW NO fuerce recargas de página en cada cambio
      // (cada regeneración del SW provocaba reloads molestos).
      registerType: command === "build" ? "autoUpdate" : "prompt",

      // El script de registro auto-inyectado (injectRegister: "auto",
      // el valor por defecto) es solo `navigator.serviceWorker.register()`
      // desnudo — no trae ninguna lógica de "hay una versión nueva,
      // recarga". Eso hacía que `registerType: "autoUpdate"` no sirviera
      // de nada en producción: el SW nuevo se activaba (skipWaiting +
      // clients.claim en src/sw.js) pero la pestaña ya abierta se quedaba
      // con el HTML/CSS/JS que ya había cargado hasta un refresco manual.
      // Se registra a mano en main.js vía `virtual:pwa-register`, que sí
      // trae el ciclo de detección de actualización.
      injectRegister: false,

      // Activo también en dev para que las notificaciones funcionen.
      devOptions: {
        enabled: true,
        type: "module",
      },

      // El manifest lo gestiona public/manifest.json directamente.
      manifest: false,

      injectManifest: {
        // Precachea todos los assets del build (JS, CSS, HTML, iconos).
        // webp incluido: el logo del splash y la sidebar lo es, y sin
        // precache la app arrancaba sin conexión con el logo roto.
        globPatterns: ["**/*.{js,css,html,svg,png,webp,ico,woff2}"],
        // Los iconos de 512 pesan ~400 KB cada uno (la textura de papel no
        // comprime) y solo los pide el sistema al instalar, que ya exige red:
        // precacharlos era descargarlos en la primera visita de todo el mundo.
        // Las capturas de la landing (/inicio) tampoco: son de la web pública,
        // no de la app, y pesan casi 1 MB entre todas.
        globIgnores: ["**/icons/icon-512.png", "**/icons/icon-maskable-512.png", "**/landing/**"],
      },
    }),
  ],
}));

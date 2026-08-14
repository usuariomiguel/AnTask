import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
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
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
}));

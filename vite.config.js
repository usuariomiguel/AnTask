import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
// @ts-ignore — Vitest injects the `test` key; plain Vite ignores it.
export default defineConfig({
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

      // Actualización automática silenciosa cuando hay nueva versión.
      registerType: "autoUpdate",

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
});

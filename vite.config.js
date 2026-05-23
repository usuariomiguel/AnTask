import { defineConfig } from "vite";

export default defineConfig({
  // index.html vive en la raíz; src/ tiene css y js
  root: ".",

  // public/ contiene service-worker.js, manifest.json, icons/
  // Vite los copia a la raíz del build sin procesarlos
  publicDir: "public",

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    // El service worker debe quedar en la raíz del build (Vite lo copia desde public/)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Firebase es ~130 KB gzip — lo separamos en su propio chunk
        // para que el bundle principal (app) cargue rápido y Firebase
        // se descargue en paralelo sin bloquear el first paint.
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "firebase";
          }
        },
      },
    },
  },
});

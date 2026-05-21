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
  },
});

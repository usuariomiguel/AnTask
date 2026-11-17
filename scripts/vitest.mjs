// Lanza Vitest con la letra de unidad en mayúscula (Windows).
//
// Si la terminal abre el repo como «c:\...» (la de VS Code suele hacerlo)
// en vez de «C:\...», Vitest carga dos copias de sí mismo —una por cada
// forma de la ruta— y TODOS los tests fallan al arrancar con «Cannot read
// properties of undefined (reading 'config')» o «failed to find the
// current suite». Vitest lee la ruta antes de cargar vite.config.js, así
// que no se puede arreglar desde ahí: se arranca en un proceso hijo con la
// ruta ya normalizada. Fuera de Windows no cambia nada.
import { spawnSync } from "node:child_process";
import { join } from "node:path";

let cwd = process.cwd();
if (process.platform === "win32" && /^[a-z]:/.test(cwd)) {
  cwd = cwd.charAt(0).toUpperCase() + cwd.slice(1);
}
const vitest = join(cwd, "node_modules", "vitest", "vitest.mjs");
const { status } = spawnSync(process.execPath, [vitest, ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(status ?? 1);

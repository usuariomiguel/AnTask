// ═══════════════════════════════════════════════════════════════
// Modo simple / completo
//
// El modo simple oculta por CSS (atributo `data-mode` en <html>)
// todo lo que no sea crear una tarea con fecha/repetición: listas,
// filtros, detalle avanzado, prefs de fila, ajustes secundarios...
// Nada de esto se borra del DOM ni del estado: solo se muestra u
// oculta según el modo, así que cambiar de modo no pierde datos.
//
// Nuevos usuarios arrancan en "simple"; el interruptor para pasar
// a "full" vive en Ajustes.
// ═══════════════════════════════════════════════════════════════

import { MODE_KEY } from "../state/keys.js";

export const MODE_DEFAULT = "simple";

/**
 * Aplica un modo sin persistirlo (solo modifica el DOM).
 * @param {"simple"|"full"} mode
 */
export function applyMode(mode) {
  document.documentElement.dataset.mode = mode === "full" ? "full" : "simple";
}

/**
 * Aplica + guarda en localStorage.
 * @param {"simple"|"full"} mode
 */
export function setMode(mode) {
  applyMode(mode);
  localStorage.setItem(MODE_KEY, mode === "full" ? "full" : "simple");
}

/**
 * Lee la preferencia guardada (o el valor por defecto) y la aplica.
 * @returns {"simple"|"full"} el modo activo
 */
export function initializeMode() {
  const saved = localStorage.getItem(MODE_KEY);
  const mode  = saved === "full" ? "full" : MODE_DEFAULT;
  applyMode(mode);
  return mode;
}

/** @returns {boolean} true si el modo activo es "simple". */
export function isSimpleMode() {
  return document.documentElement.dataset.mode !== "full";
}

/**
 * true solo si el modo es "simple" Y estamos en viewport móvil.
 *
 * El modo simple es exclusivamente para móvil — en escritorio la app se
 * comporta siempre como modo completo, sin importar el flag. Toda lógica
 * de UI que decida ocultar/simplificar algo debe usar esto, no
 * `isSimpleMode()` a secas (que solo mira el flag, no la pantalla).
 */
export function isSimpleMobile() {
  return isSimpleMode() && window.matchMedia("(max-width: 768px)").matches;
}

// ═══════════════════════════════════════════════════════════════
// Tema claro / oscuro
//
// - `initializeTheme()` se llama al arrancar y aplica lo guardado
//   en localStorage, o `prefers-color-scheme` si no hay preferencia.
// - `setTheme(theme)` cambia el tema y persiste.
// - `toggleThemeWithTransition(sourceEl)` invierte el tema usando
//   la View Transition API cuando está disponible, para animar el
//   cambio desde la posición del botón pulsado.
// ═══════════════════════════════════════════════════════════════

import { THEME_KEY } from "../state/keys.js";

export const ACCENT_KEY     = "antask-accent";
export const ACCENT_DEFAULT = "oliva";
export const ACCENTS = ["oliva", "arcilla", "terracota", "miel", "marea", "vino"];

/**
 * Aplica un tema sin persistirlo (solo modifica el DOM).
 *
 * @param {"dark"|"light"} theme
 */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Aplica + guarda en localStorage.
 *
 * @param {"dark"|"light"} nextTheme
 */
export function setTheme(nextTheme) {
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

/**
 * Lee la preferencia guardada (o la del SO) y la aplica.
 */
export function initializeTheme() {
  const saved       = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme       = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
  applyTheme(theme);
}

/**
 * Aplica el color de acento (oliva = por defecto, sin atributo).
 * @param {string} accent
 */
export function applyAccent(accent) {
  if (!accent || accent === ACCENT_DEFAULT || ACCENTS.indexOf(accent) === -1) {
    delete document.documentElement.dataset.accent;
  } else {
    document.documentElement.dataset.accent = accent;
  }
}

/** Aplica + guarda en localStorage. */
export function setAccent(accent) {
  applyAccent(accent);
  localStorage.setItem(ACCENT_KEY, accent);
}

/** Lee la preferencia guardada y la aplica. Devuelve el acento activo. */
export function initializeAccent() {
  const saved = localStorage.getItem(ACCENT_KEY) || ACCENT_DEFAULT;
  applyAccent(saved);
  return saved;
}

/**
 * Alterna el tema actual con animación de View Transition API si
 * está disponible, irradiando desde la posición del elemento que
 * disparó el evento (típicamente el botón clickado).
 *
 * El callback del View Transition NO es síncrono (el navegador lo
 * difiere), así que quien necesite reaccionar al tema ya aplicado
 * (p. ej. resincronizar un control que lo refleja) debe pasar
 * `onApplied` en vez de leer el estado justo después de llamar a
 * esta función — si no, lee el valor viejo.
 *
 * @param {HTMLElement|null} sourceEl
 * @param {() => void} [onApplied]
 */
export function toggleThemeWithTransition(sourceEl, onApplied) {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const root = document.documentElement;
  const rect = sourceEl && sourceEl.getBoundingClientRect ? sourceEl.getBoundingClientRect() : null;
  const x    = rect ? rect.left + rect.width  / 2 : window.innerWidth - 30;
  const y    = rect ? rect.top  + rect.height / 2 : 30;

  root.style.setProperty("--vt-x", x + "px");
  root.style.setProperty("--vt-y", y + "px");

  if (!document.startViewTransition) {
    setTheme(next);
    if (onApplied) onApplied();
    return;
  }

  document.startViewTransition(function () {
    setTheme(next);
    if (onApplied) onApplied();
  });
}

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
 * Alterna el tema actual con animación de View Transition API si
 * está disponible, irradiando desde la posición del elemento que
 * disparó el evento (típicamente el botón clickado).
 *
 * @param {HTMLElement|null} sourceEl
 */
export function toggleThemeWithTransition(sourceEl) {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const root = document.documentElement;
  const rect = sourceEl && sourceEl.getBoundingClientRect ? sourceEl.getBoundingClientRect() : null;
  const x    = rect ? rect.left + rect.width  / 2 : window.innerWidth - 30;
  const y    = rect ? rect.top  + rect.height / 2 : 30;

  root.style.setProperty("--vt-x", x + "px");
  root.style.setProperty("--vt-y", y + "px");

  if (!document.startViewTransition) {
    setTheme(next);
    return;
  }

  document.startViewTransition(function () {
    setTheme(next);
  });
}

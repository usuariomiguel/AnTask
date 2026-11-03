// ═══════════════════════════════════════════════════════════════
// Tema claro / oscuro
//
// Tres preferencias: "auto" (por defecto: sigue el modo del dispositivo,
// también en directo si cambia con la app abierta; en el móvil y en el
// sistema suele ir con la hora), "light" y "dark". "auto" es no tener
// nada guardado en localStorage.
//
// - `initializeTheme()` se llama al arrancar y aplica la preferencia.
// - `setThemePref(pref)` la cambia y persiste.
// - `watchSystemTheme()` repinta en "auto" cuando cambia el dispositivo.
// - `toggleThemeWithTransition(sourceEl)` invierte el tema usando
//   la View Transition API cuando está disponible, para animar el
//   cambio desde la posición del botón pulsado.
// ═══════════════════════════════════════════════════════════════

import { THEME_KEY } from "../state/keys.js";

export const ACCENT_KEY     = "antrack-accent";
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

/** @returns {"dark"|"light"} el modo del dispositivo ahora mismo */
export function systemTheme() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** @returns {"auto"|"dark"|"light"} */
export function getThemePref() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "auto";
}

/**
 * @param {"auto"|"dark"|"light"} pref
 * @returns {"dark"|"light"}
 */
export function resolveTheme(pref) {
  return pref === "light" || pref === "dark" ? pref : systemTheme();
}

/**
 * Aplica + guarda la preferencia. "auto" borra la clave.
 *
 * @param {"auto"|"dark"|"light"} pref
 */
export function setThemePref(pref) {
  if (pref === "light" || pref === "dark") localStorage.setItem(THEME_KEY, pref);
  else localStorage.removeItem(THEME_KEY);
  applyTheme(resolveTheme(pref));
}

/**
 * Lee la preferencia guardada (o la del dispositivo) y la aplica.
 */
export function initializeTheme() {
  applyTheme(resolveTheme(getThemePref()));
}

/**
 * En "auto", repinta cuando el dispositivo cambia de modo (p. ej. al
 * anochecer). `onChange` sirve para resincronizar controles.
 *
 * @param {() => void} [onChange]
 */
export function watchSystemTheme(onChange) {
  if (!window.matchMedia) return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const alCambiar = function () {
    if (getThemePref() !== "auto") return;
    initializeTheme();
    if (onChange) onChange();
  };
  if (mq.addEventListener) mq.addEventListener("change", alCambiar);
  else if (mq.addListener) mq.addListener(alCambiar);
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
 * Cambia el tema con animación de View Transition API si está
 * disponible, irradiando desde la posición del elemento que disparó
 * el evento (típicamente el botón clickado).
 *
 * Sin `pref`, invierte el tema: si el resultado coincide con el del
 * dispositivo vuelve a "auto"; si no, se queda fijo. Así el botón del
 * sol nunca deja la app atascada en un tema. Con `pref` (el selector de
 * Ajustes) aplica esa preferencia tal cual.
 *
 * El callback del View Transition NO es síncrono (el navegador lo
 * difiere), así que quien necesite reaccionar al tema ya aplicado
 * (p. ej. resincronizar un control que lo refleja) debe pasar
 * `onApplied` en vez de leer el estado justo después de llamar a
 * esta función — si no, lee el valor viejo.
 *
 * @param {HTMLElement|null} sourceEl
 * @param {() => void} [onApplied]
 * @param {"auto"|"dark"|"light"} [pref]
 */
export function toggleThemeWithTransition(sourceEl, onApplied, pref) {
  if (!pref) {
    const opuesto = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    pref = opuesto === systemTheme() ? "auto" : opuesto;
  }
  const next = pref;
  const root = document.documentElement;

  // Mismo tema a la vista (p. ej. de «Oscuro» a «Automático» de noche):
  // solo cambia la preferencia, sin animación.
  if (resolveTheme(next) === root.dataset.theme || !document.startViewTransition) {
    setThemePref(next);
    if (onApplied) onApplied();
    return;
  }

  const rect = sourceEl && sourceEl.getBoundingClientRect ? sourceEl.getBoundingClientRect() : null;
  const x    = rect ? rect.left + rect.width  / 2 : window.innerWidth - 30;
  const y    = rect ? rect.top  + rect.height / 2 : 30;

  root.style.setProperty("--vt-x", x + "px");
  root.style.setProperty("--vt-y", y + "px");

  document.startViewTransition(function () {
    setThemePref(next);
    if (onApplied) onApplied();
  });
}

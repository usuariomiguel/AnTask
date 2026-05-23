// @ts-check
import { es } from "./es.js";
import { en } from "./en.js";

const LANG_KEY = "antask_lang";
const SUPPORTED = ["es", "en"];

/** @type {Record<string, Record<string, string>>} */
const CATALOGS = { es, en };

/**
 * Detecta el idioma preferido: localStorage → navigator.language → "es".
 * @returns {"es"|"en"}
 */
function detectLang() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored && SUPPORTED.includes(stored)) return /** @type {any} */ (stored);

  const nav = (navigator.language || "").toLowerCase().slice(0, 2);
  return nav === "en" ? "en" : "es";
}

let _lang = detectLang();

/**
 * Traduce una clave al idioma activo.
 * Si la clave no existe en el catálogo activo, busca en español como fallback.
 *
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return CATALOGS[_lang]?.[key] ?? CATALOGS["es"]?.[key] ?? key;
}

/** @returns {"es"|"en"} */
export function getLang() { return _lang; }

/**
 * Cambia el idioma, lo persiste y recarga la página para aplicar
 * todos los strings generados dinámicamente.
 *
 * @param {"es"|"en"} lang
 */
export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  localStorage.setItem(LANG_KEY, lang);
  window.location.reload();
}

/**
 * Aplica las traducciones a todos los elementos del DOM que tengan
 * atributos data-i18n, data-i18n-ph, data-i18n-aria o data-i18n-title.
 * Llamar después de que el DOM esté listo.
 */
export function applyDomTranslations() {
  // Texto interior
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    const key = el.getAttribute("data-i18n") || "";
    const val = t(key);
    if (val !== key) el.textContent = val;
  });

  // placeholder
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-ph") || "";
    const val = t(key);
    if (val !== key) /** @type {HTMLInputElement} */ (el).placeholder = val;
  });

  // aria-label
  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-aria") || "";
    const val = t(key);
    if (val !== key) el.setAttribute("aria-label", val);
  });

  // title
  document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-title") || "";
    const val = t(key);
    if (val !== key) el.setAttribute("title", val);
  });

  // data-placeholder (contenteditable)
  document.querySelectorAll("[data-i18n-dp]").forEach(function (el) {
    const key = el.getAttribute("data-i18n-dp") || "";
    const val = t(key);
    if (val !== key) el.setAttribute("data-placeholder", val);
  });

  // Actualiza lang en <html>
  document.documentElement.lang = _lang;
}

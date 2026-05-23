// @ts-check
// Integración con Plausible Analytics (sin cookies, sin datos personales).
// Solo se carga si el usuario ha dado consentimiento "all".
//
// Para activar: reemplaza PLAUSIBLE_DOMAIN con tu dominio real
// (ej. "antask.app") y asegúrate de haber añadido el sitio en plausible.io.

const PLAUSIBLE_DOMAIN = ""; // ← pon aquí tu dominio cuando lo tengas
const PLAUSIBLE_SRC    = "https://plausible.io/js/script.js";

let _loaded = false;

/**
 * Carga el script de Plausible Analytics si:
 *   1. Se ha configurado un dominio.
 *   2. El usuario ha dado consentimiento de analytics.
 *   3. No se ha cargado ya.
 */
export function initAnalytics() {
  if (_loaded || !PLAUSIBLE_DOMAIN) return;
  _loaded = true;

  const script = document.createElement("script");
  script.defer = true;
  script.dataset["domain"] = PLAUSIBLE_DOMAIN;
  script.src = PLAUSIBLE_SRC;
  document.head.appendChild(script);
}

/**
 * Envía un evento personalizado a Plausible.
 * No-op si analytics no está cargado o el objeto global no existe.
 *
 * @param {string} name  Nombre del evento (ej. "Task Created")
 * @param {Record<string, string|number>} [props]
 */
export function trackEvent(name, props) {
  if (typeof window.plausible !== "function") return;
  window.plausible(name, props ? { props } : undefined);
}

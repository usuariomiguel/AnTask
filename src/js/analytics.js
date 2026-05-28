// @ts-check
// Vercel Analytics — sin cookies, GDPR-friendly.
// Solo se inicializa si el usuario ha dado consentimiento "all".

import { inject } from "@vercel/analytics";

let _loaded = false;

/**
 * Inyecta Vercel Analytics.
 * Llamado desde main.js solo tras consentimiento del usuario.
 */
export function initAnalytics() {
  if (_loaded) return;
  _loaded = true;
  inject();
}

/**
 * Envía un evento personalizado.
 * No-op si la librería no está cargada.
 *
 * @param {string} name
 * @param {Record<string, string|number>} [props]
 */
export function trackEvent(name, props) {
  if (typeof window.va !== "function") return;
  window.va("event", { name, ...(props || {}) });
}

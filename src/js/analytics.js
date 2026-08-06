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

// @ts-check
// Vercel Analytics: sin cookies, anónima. Va por defecto salvo que el
// usuario la desactive en Ajustes › Datos (ver consent.js).

import { inject } from "@vercel/analytics";
import { analyticsAllowed } from "./consent.js";

let _loaded = false;

/** Inyecta Vercel Analytics (una sola vez). */
export function initAnalytics() {
  if (_loaded) return;
  _loaded = true;
  // Filtro en cada envío: si se desactiva con el script ya cargado, lo que
  // quede por salir se descarta aquí.
  inject({ beforeSend: (evento) => (analyticsAllowed() ? evento : null) });
}

/** Retira el script. Si se vuelve a activar, initAnalytics lo pone de nuevo. */
export function stopAnalytics() {
  document.querySelectorAll('script[data-sdkn^="@vercel/analytics"]').forEach(function (s) { s.remove(); });
  _loaded = false;
}

// Entry point — orquesta la carga de todos los módulos.
//
// Orden de imports (importa para la inicialización):
//   1. setup-lucide    →  window.lucide  (debe ser el primero)
//   2. paste-utils     →  window.setupPasteHandler, window.setupImageResizer
//   3. notifications   →  window.AnsoNotif
//   4. script          →  orquestador principal
//   5. sections-and-profile  →  menú de perfil
//   6. firebase-sync   →  window.AnsoSync  (carga diferida — no bloquea TTI)
//
// El CSS NO se importa desde aquí — se carga vía <link> en index.html
// para evitar el FOUC (flash of unstyled content) en dev.

import { applyDomTranslations, getLang, setLang, t } from "./i18n/index.js";
import "./setup-lucide.js";
import "./paste-utils.js";
import "./notifications.js";
import "./script.js";
import "./sections-and-profile.js";

// Consent + analytics: se ejecuta después de que el DOM esté listo.
import { analyticsAllowed, showConsentBannerIfNeeded } from "./consent.js";
import { initAnalytics } from "./analytics.js";

// Expone t() globalmente para código legado que no puede usar imports.
window.t = t;

// Aplica traducciones antes de que el usuario vea el contenido.
applyDomTranslations();

if (analyticsAllowed()) initAnalytics();

showConsentBannerIfNeeded(function (decision) {
  if (decision === "all") initAnalytics();
});

// Botón de cambio de idioma en el menú de perfil.
document.getElementById("pf-lang-btn")?.addEventListener("click", function () {
  setLang(getLang() === "es" ? "en" : "es");
});

// Firebase carga de forma diferida: no bloquea el render inicial.
import("./firebase-sync.js");

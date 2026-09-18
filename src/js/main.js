// Entry point — orquesta la carga de todos los módulos.
//
// Orden de imports (importa para la inicialización):
//   1. fuentes self-hosted (Inter + JetBrains Mono variable)
//   2. setup-lucide    →  window.lucide  (debe ser el primero)
//   3. paste-utils     →  window.setupPasteHandler, window.setupImageResizer
//   4. notifications   →  window.AnsoNotif
//   5. script          →  orquestador principal
//   6. sections-and-profile  →  menú de perfil
//   7. firebase-sync   →  window.AnsoSync  (solo si ya se sincroniza;
//                          si no, al pulsar "Sincronizar con Google")
//
// El CSS NO se importa desde aquí — se carga vía <link> en index.html
// para evitar el FOUC (flash of unstyled content) en dev.

// Fuentes self-hosted (sin requests a Google Fonts).
// Inter = UI, JetBrains Mono = metadatos, Bricolage Grotesque = display
// (títulos y marca), tal como define el tema "tierra" del prototipo v1.
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/jetbrains-mono/wght-italic.css";
import "@fontsource-variable/bricolage-grotesque/wght.css";

import { applyDomTranslations, getLang, setLang, t } from "./i18n/index.js";
import "./setup-lucide.js";
import { initOpenmoji } from "./utils/openmoji.js";
import "./paste-utils.js";
import "./notifications.js";
import "./script.js";
import "./sections-and-profile.js";

// Consent + analytics: se ejecuta después de que el DOM esté listo.
import { analyticsAllowed, setConsent, showConsentBannerIfNeeded } from "./consent.js";
import { initAnalytics } from "./analytics.js";
import { hasSyncHistory, loadSync } from "./sync-loader.js";
import { registerSW } from "virtual:pwa-register";

// Expone t() globalmente para código legado que no puede usar imports.
window.t = t;

// Aplica traducciones antes de que el usuario vea el contenido.
applyDomTranslations();

// Sustituye emojis nativos por SVG de OpenMoji (coherentes en todos los OS).
initOpenmoji();

if (analyticsAllowed()) initAnalytics();

// Interruptor de Ajustes › Datos: la misma elección que el banner, pero
// reversible. Al desactivarla se guarda «essential» y se retira el script;
// la app no cambia de URL, así que no quedan más vistas que enviar.
const analyticsSwitch = document.getElementById("settings-analytics-btn");
function paintAnalyticsSwitch() {
  if (!analyticsSwitch) return;
  const on = analyticsAllowed();
  analyticsSwitch.classList.toggle("on", on);
  analyticsSwitch.setAttribute("aria-pressed", on ? "true" : "false");
}
paintAnalyticsSwitch();
analyticsSwitch?.addEventListener("click", function () {
  const on = !analyticsAllowed();
  setConsent(on ? "all" : "essential");
  if (on) initAnalytics();
  else document.querySelectorAll('script[src*="/_vercel/insights"]').forEach(function (s) { s.remove(); });
  // Si el banner seguía en pantalla, la decisión ya está tomada.
  const banner = document.getElementById("consent-banner");
  if (banner && !banner.hidden) banner.hidden = true;
  paintAnalyticsSwitch();
});

showConsentBannerIfNeeded(function (decision) {
  if (decision === "all") initAnalytics();
  paintAnalyticsSwitch();
});

// Botón de cambio de idioma en el menú de perfil.
document.getElementById("pf-lang-btn")?.addEventListener("click", function () {
  setLang(getLang() === "es" ? "en" : "es");
});

// Firebase (~405 KB) solo se descarga si esta persona ya sincroniza.
// Quien no ha iniciado sesión nunca no paga ese peso: el módulo se
// carga bajo demanda desde el botón "Sincronizar con Google".
if (hasSyncHistory()) loadSync();

// Registro del service worker. `injectRegister: false` en vite.config.js
// apaga el script de registro desnudo que Vite inyecta por defecto — sin
// esto, un SW nuevo se activaba en segundo plano (skipWaiting + claim en
// src/sw.js) pero la pestaña ya abierta se quedaba con el HTML/CSS/JS
// viejo hasta un refresco manual: la causa de que cambios ya en
// producción tardaran en verse.
const updateSW = registerSW({
  onNeedRefresh() {
    // En dev el registerType es "prompt" a propósito (cada rebuild del
    // SW no debe forzar un reload); en build es "autoUpdate", así que
    // ahí sí recargamos en cuanto el SW nuevo está listo.
    if (import.meta.env.PROD) updateSW(true);
  },
  onOfflineReady() {},
});

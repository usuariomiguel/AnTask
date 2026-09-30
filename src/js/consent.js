// @ts-check
// Analítica anónima: activada por defecto, con opción de desactivarla.
//
// Vercel Web Analytics no usa cookies ni guarda nada en el dispositivo (el
// visitante se reconoce con un hash que cambia cada día), así que no
// necesita el consentimiento previo de la LSSI/ePrivacy. La base es el
// interés legítimo (Art. 6.1.f RGPD): se informa en la política de
// privacidad y se puede desactivar en Ajustes › Datos.
//
// La elección se guarda en CONSENT_KEY. Solo cuenta «essential» (la
// desactivó; también la respuesta «Solo lo esencial» del antiguo banner).
// Sin valor o con «all», la analítica va.

const CONSENT_KEY = "antrack_consent";

/** @param {boolean} on */
export function setAnalytics(on) {
  localStorage.setItem(CONSENT_KEY, on ? "all" : "essential");
}

/** @returns {boolean} */
export function analyticsAllowed() {
  if (localStorage.getItem(CONSENT_KEY) === "essential") return false;
  // El navegador pide no compartir datos (Global Privacy Control): se
  // respeta mientras el usuario no la active a mano en Ajustes.
  const gpc = /** @type {any} */ (navigator).globalPrivacyControl === true;
  if (gpc && localStorage.getItem(CONSENT_KEY) !== "all") return false;
  return true;
}

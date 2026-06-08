// @ts-check
// Gestión de consentimiento GDPR/ePrivacy.
// Almacena la elección en localStorage bajo la clave CONSENT_KEY.
// Valores posibles: "all" | "essential" | null (sin respuesta aún).

const CONSENT_KEY = "antask_consent";

/** @returns {"all"|"essential"|null} */
export function getConsent() {
  return /** @type {any} */ (localStorage.getItem(CONSENT_KEY));
}

/** @param {"all"|"essential"} value */
export function setConsent(value) {
  localStorage.setItem(CONSENT_KEY, value);
}

/** @returns {boolean} */
export function hasAnswered() {
  return localStorage.getItem(CONSENT_KEY) !== null;
}

/** @returns {boolean} */
export function analyticsAllowed() {
  return localStorage.getItem(CONSENT_KEY) === "all";
}

/**
 * Muestra el banner si el usuario aún no ha respondido.
 * Llama a `onDecision` con el valor elegido cuando el usuario decide.
 *
 * @param {(value: "all"|"essential") => void} onDecision
 */
export function showConsentBannerIfNeeded(onDecision) {
  if (hasAnswered()) return;

  const banner = document.getElementById("consent-banner");
  if (!banner) return;

  banner.hidden = false;
  banner.removeAttribute("aria-hidden");

  banner.querySelector("#consent-accept")?.addEventListener("click", function () {
    setConsent("all");
    _dismiss(banner);
    onDecision("all");
    _notifyDecided("all");
  }, { once: true });

  banner.querySelector("#consent-decline")?.addEventListener("click", function () {
    setConsent("essential");
    _dismiss(banner);
    onDecision("essential");
    _notifyDecided("essential");
  }, { once: true });
}

/**
 * Avisa al resto de la app de que el usuario ya decidió el consentimiento.
 * Lo usa el onboarding para no solaparse con el banner en el primer arranque.
 * @param {"all"|"essential"} value
 */
function _notifyDecided(value) {
  document.dispatchEvent(new CustomEvent("antask:consent-decided", { detail: value }));
}

/** @param {HTMLElement} banner */
function _dismiss(banner) {
  banner.classList.add("consent-banner--out");
  banner.addEventListener("transitionend", function () {
    banner.hidden = true;
  }, { once: true });
  // Fallback por si transitionend no dispara (headless, reduce-motion)
  setTimeout(function () { banner.hidden = true; }, 400);
}

// @ts-check
// Utilidades de localStorage: escritura segura ante cuota llena.

/**
 * Escribe en localStorage. Si la cuota se supera, llama a `onQuota`
 * en lugar de lanzar. Para datos pequeños (preferencias, flags) usa
 * localStorage.setItem directamente; solo las saves grandes necesitan esto.
 *
 * @param {string}   key
 * @param {string}   value
 * @param {Function} onQuota  Llamado si se supera la cuota.
 * @returns {boolean} true si se guardó, false si hubo error de cuota.
 */
export function safeLsSet(key, value, onQuota) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    var isQuota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" ||
        err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
        err.code === 22);
    if (isQuota && typeof onQuota === "function") {
      onQuota();
    }
    return false;
  }
}

// @ts-check
// Utilidades de localStorage: escritura segura y monitorización de cuota.

/**
 * Estima el porcentaje de localStorage usado (0-100).
 * Basado en el límite habitual de ~5 MB (5 × 1024 × 1024 bytes).
 * Cada carácter JS ocupa 2 bytes en UTF-16.
 *
 * @returns {number} 0-100
 */
export function getStorageUsagePct() {
  try {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i) || "";
      var val = localStorage.getItem(key) || "";
      total += (key.length + val.length) * 2;
    }
    var limitBytes = 5 * 1024 * 1024;
    return Math.min(100, Math.round((total / limitBytes) * 100));
  } catch (_) {
    return 0;
  }
}

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

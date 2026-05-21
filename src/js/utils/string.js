// ═══════════════════════════════════════════════════════════════
// Utilidades de cadenas
// ═══════════════════════════════════════════════════════════════

/**
 * Pone en mayúscula la primera letra de una cadena. Conserva el
 * resto tal cual.
 *
 * @param {string} str
 * @returns {string}
 */
export function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

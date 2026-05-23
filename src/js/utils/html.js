// @ts-check
// ═══════════════════════════════════════════════════════════════
// Utilidades HTML
// ═══════════════════════════════════════════════════════════════

/**
 * Escapa una cadena para insertarla con seguridad dentro de HTML
 * (incluido dentro de atributos con comillas simples o dobles).
 *
 * @param {unknown} str
 * @returns {string}
 */
export function escHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

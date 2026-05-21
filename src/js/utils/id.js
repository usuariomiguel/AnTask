// ═══════════════════════════════════════════════════════════════
// Generador de IDs únicos
// ═══════════════════════════════════════════════════════════════

/**
 * Devuelve un identificador único usando `crypto.randomUUID()` cuando
 * está disponible (todos los navegadores modernos en contextos seguros)
 * y un fallback razonable en otro caso.
 */
export function generateId() {
  return (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

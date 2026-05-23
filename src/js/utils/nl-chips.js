// @ts-check
// ═══════════════════════════════════════════════════════════════
// Renderizado de chips de preview para Lenguaje Natural
//
// Usado por:
//   - El input principal de tareas (preview en vivo bajo el form)
//   - El modal de captura rápida (Ctrl+Shift+Espacio)
//
// Recibe el resultado de parseNaturalLanguage(text) y devuelve un
// array de strings HTML — cada uno un chip.
// ═══════════════════════════════════════════════════════════════

import { escHtml } from "./html.js";

/** @typedef {import("../state/types.js").ParsedNL} ParsedNL */

/** @type {{ high: string, medium: string, low: string }} */
const PRIO_LABELS = { high: "Alta", medium: "Media", low: "Baja" };

/**
 * Texto humano para una fecha ISO ("Hoy", "Mañana", "lunes", "15 mar").
 *
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatDueLabel(iso) {
  if (!iso) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(iso + "T00:00:00");
  const diff  = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0)  return "Hoy";
  if (diff === 1)  return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff <= 7) {
    return due.toLocaleDateString("es-ES", { weekday: "long" });
  }
  return due.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

/**
 * Texto humano para un intervalo de recurrencia en días.
 *
 * @param {number|null|undefined} days
 * @returns {string}
 */
export function formatRecurLabel(days) {
  if (!days) return "";
  if (days === 1)  return "Diario";
  if (days === 7)  return "Semanal";
  if (days === 14) return "Quincenal";
  if (days === 30) return "Mensual";
  if (days % 30 === 0) return "Cada " + (days / 30) + " meses";
  if (days % 7  === 0) return "Cada " + (days / 7) + " semanas";
  return "Cada " + days + " días";
}

/**
 * Construye los chips HTML a partir del objeto que devuelve
 * `parseNaturalLanguage`.
 *
 * @param {Partial<ParsedNL>} parsed
 * @returns {string[]} array de fragmentos HTML (sin contenedor)
 */
export function buildNLChipsHTML(parsed) {
  const chips = [];
  if (parsed.dueDate) {
    chips.push('<span class="nl-chip nl-chip-date">' +
      '<i data-lucide="calendar"></i> ' + formatDueLabel(parsed.dueDate) +
    '</span>');
  }
  if (parsed.recurDays) {
    chips.push('<span class="nl-chip nl-chip-recur">' +
      '<i data-lucide="repeat"></i> ' + formatRecurLabel(parsed.recurDays) +
    '</span>');
  }
  if (parsed.priority) {
    chips.push('<span class="nl-chip nl-chip-prio nl-chip-prio-' + parsed.priority + '">' +
      '<i data-lucide="flag"></i> ' + PRIO_LABELS[parsed.priority] +
    '</span>');
  }
  (parsed.labels || []).forEach(function (l) {
    chips.push('<span class="nl-chip nl-chip-label">#' + escHtml(l) + '</span>');
  });
  return chips;
}

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

import { t, getLang } from "../i18n/index.js";

/** @typedef {import("../state/types.js").ParsedNL} ParsedNL */

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
  if (diff === 0)  return t("date.today");
  if (diff === 1)  return t("date.tomorrow");
  if (diff === -1) return t("date.yesterday");
  // Resto de fechas (pasadas o futuras): "vie 20 jul", como en el prototipo v1.
  const locale   = getLang() === "en" ? "en-GB" : "es-ES";
  const weekday  = due.toLocaleDateString(locale, { weekday: "short" }).replace(".", "");
  const dayMonth = due.toLocaleDateString(locale, { day: "numeric", month: "short" });
  return weekday + " " + dayMonth;
}

/**
 * Texto humano para un intervalo de recurrencia en días.
 *
 * @param {number|null|undefined} days
 * @returns {string}
 */
export function formatRecurLabel(days) {
  if (!days) return "";
  if (days === 1)  return t("recur.daily");
  if (days === 7)  return t("recur.weekly");
  if (days === 14) return t("recur.biweekly");
  if (days === 30) return t("recur.monthly");
  if (days % 30 === 0) return t("recur.every_n_months").replace("{n}", String(days / 30));
  if (days % 7  === 0) return t("recur.every_n_weeks").replace("{n}", String(days / 7));
  return t("hoja.recur_every_n").replace("{n}", String(days));
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
    // Ya no hay niveles: un único chip "Importante".
    chips.push('<span class="nl-chip nl-chip-prio">' +
      '<i data-lucide="flag"></i> ' + t("detail.priority_important") +
    '</span>');
  }
  return chips;
}

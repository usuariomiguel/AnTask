// @ts-check
// ═══════════════════════════════════════════════════════════════
// Utilidades de fecha (sin dependencias)
// ═══════════════════════════════════════════════════════════════

import { t, getLang } from "../i18n/index.js";

/**
 * Formatea una fecha ISO (YYYY-MM-DD) como "01 ene" en el idioma activo.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatDueDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const locale = getLang() === "en" ? "en-GB" : "es-ES";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
}

/**
 * Estado visual de una fecha límite respecto a hoy.
 *
 * @typedef {object} DueDateState
 * @property {string}              label
 * @property {string}              cls    - "due-overdue" | "due-today" | "due-soon" | "due-future"
 * @property {number}              diff   - Días respecto a hoy (negativo = vencida)
 */

/**
 * Devuelve el estado visual de una fecha límite respecto a hoy, o
 * null si no se proporciona fecha.
 *
 * @param {string|null} dueDate  ISO YYYY-MM-DD o null
 * @returns {DueDateState|null}
 */
export function getDueDateState(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due  = new Date(dueDate + "T00:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0)   return { label: t("due.overdue"),        cls: "due-overdue", diff };
  if (diff === 0) return { label: t("date.today"),          cls: "due-today",   diff };
  if (diff === 1) return { label: t("date.tomorrow"),       cls: "due-soon",    diff };
  return                 { label: formatDueDate(dueDate),   cls: "due-future",  diff };
}

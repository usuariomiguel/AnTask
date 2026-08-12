// @ts-check
// ═══════════════════════════════════════════════════════════════
// Utilidades de fecha (sin dependencias)
// ═══════════════════════════════════════════════════════════════

import { t, getLang } from "../i18n/index.js";

/**
 * Trozos de una fecha ISO: día de la semana y "día mes", por separado.
 * Separados para poder ocultar el primero en móvil, donde la píldora de
 * fecha competía por el ancho con el título de la fila.
 *
 * @param {string} iso
 * @returns {{weekday: string, dayMonth: string}}
 */
export function formatDueParts(iso) {
  const d = new Date(iso + "T00:00:00");
  const locale = getLang() === "en" ? "en-GB" : "es-ES";
  return {
    weekday:  d.toLocaleDateString(locale, { weekday: "short" }).replace(".", ""),
    dayMonth: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
  };
}

/**
 * Formatea una fecha ISO como "vie 20 jul" (día de la semana + día + mes),
 * como en el prototipo v1 — se usa para fechas fuera de la ventana
 * hoy/mañana/ayer, tanto futuras como vencidas.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatDueWeekday(iso) {
  const p = formatDueParts(iso);
  return p.weekday + " " + p.dayMonth;
}

/**
 * Estado visual de una fecha límite respecto a hoy.
 *
 * @typedef {object} DueDateState
 * @property {string}              label
 * @property {string}              cls    - "due-overdue" | "due-today" | "due-soon" | "due-future"
 * @property {number}              diff   - Días respecto a hoy (negativo = vencida)
 * @property {{weekday: string, dayMonth: string}} [parts]
 *   Solo cuando la etiqueta lleva día de la semana. Permite ocultar ese
 *   trozo en móvil sin volver a formatear la fecha.
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
  if (diff === 0)  return { label: t("date.today"),         cls: "due-today",   diff };
  if (diff === 1)  return { label: t("date.tomorrow"),      cls: "due-soon",    diff };
  if (diff === -1) return { label: t("date.yesterday"),     cls: "due-overdue", diff };
  // `parts` solo en los casos con día de la semana: en móvil ese trozo se
  // oculta para que la píldora no se coma el ancho del título.
  if (diff < 0)     return { label: formatDueWeekday(dueDate), parts: formatDueParts(dueDate), cls: "due-overdue", diff };
  return                   { label: formatDueWeekday(dueDate), parts: formatDueParts(dueDate), cls: "due-future",  diff };
}

// @ts-check
// ═══════════════════════════════════════════════════════════════
// Pistas en el título de una tarea YA CREADA
//
// Si una tarea se llama "Revisar informe mensual" y no se repite, lo
// más probable es que se le haya olvidado ponerle la repetición. Este
// módulo lee el título y propone el chip que falta; la fila lo enseña
// como un fantasma que se acepta de un clic.
//
// Por qué no basta con parseNaturalLanguage(): ese parser está hecho
// para CREAR tareas. Entiende órdenes ("cada 3 días", "mañana p1") y se
// come esas palabras del título. Lo que queda escrito en una tarea ya
// hecha son adjetivos —"mensual", "semanales"—, que él no reconoce.
// Aquí se usan los dos: primero sus frases explícitas y, si no hay,
// los adjetivos.
//
// Deliberadamente NO sugiere fechas. "Llamar a Juan el viernes"
// significa el viernes de la semana en que se escribió; si la tarea
// lleva un mes creada, proponer el próximo viernes sería inventar.
// La repetición y la importancia no caducan: "mensual" hoy sigue
// queriendo decir cada 30 días.
// ═══════════════════════════════════════════════════════════════

import { parseNaturalLanguage } from "./nl-parse.js";

/**
 * Adjetivos de frecuencia, de más corto a más largo intervalo.
 *
 * "diario" a secas queda fuera a propósito: en español es sobre todo un
 * sustantivo ("Diario de viaje", "leer el diario") y daría falsos
 * positivos a diario. "diaria", "diarios" y "diariamente" sí son
 * inequívocos.
 *
 * `\b` no parte palabras: "manual" no contiene "anual" para él, ni
 * "biweekly" contiene "weekly".
 */
const RECURRENCIAS = [
  { dias: 1,   re: /\b(?:diarias?|diarios|diariamente|daily)\b/i },
  { dias: 7,   re: /\b(?:semanal(?:es|mente)?|weekly)\b/i },
  { dias: 14,  re: /\b(?:quincenal(?:es|mente)?|biweekly|fortnightly)\b/i },
  { dias: 30,  re: /\b(?:mensual(?:es|mente)?|monthly)\b/i },
  { dias: 90,  re: /\b(?:trimestral(?:es|mente)?|quarterly)\b/i },
  { dias: 365, re: /\b(?:anual(?:es|mente)?|yearly|annual(?:ly)?)\b/i },
];

/** "urgente", "importante"… y el "p1" del propio parser, por si sobrevivió. */
const IMPORTANTE = /\b(?:urgentes?|importantes?|urgent|important|asap)\b|(?:^|\s)p1(?=\s|$)/i;

/**
 * Lo que insinúa un título, sin mirar el estado de la tarea.
 *
 * @param {string} texto
 * @returns {{ recurDays: number|null, importante: boolean }}
 */
export function detectarPistas(texto) {
  const out = { recurDays: /** @type {number|null} */ (null), importante: false };
  if (!texto || typeof texto !== "string") return out;

  const explicita = parseNaturalLanguage(texto).recurDays;
  if (explicita) {
    out.recurDays = explicita;
  } else {
    for (const r of RECURRENCIAS) {
      if (r.re.test(texto)) { out.recurDays = r.dias; break; }
    }
  }

  out.importante = IMPORTANTE.test(texto);
  return out;
}

/**
 * @typedef {{ campo: "recur", valor: number, clave: string }
 *         | { campo: "importante", valor: true, clave: string }} Sugerencia
 */

/**
 * Las sugerencias que tiene sentido enseñar para una tarea.
 *
 * Solo para huecos VACÍOS: si la tarea ya se repite, aunque sea cada 3
 * días y el título diga "semanal", no se le lleva la contraria.
 *
 * La clave de descarte lleva el valor ("recur:7"), no solo el campo: si
 * descartas la semanal y luego cambias el título a "mensual", la
 * mensual es una sugerencia nueva y merece salir.
 *
 * @param {{ text?: string, done?: boolean, recurDays?: number|null, priority?: string|null }} task
 * @param {string[]} [descartadas]
 * @returns {Sugerencia[]}
 */
export function sugerenciasPara(task, descartadas) {
  if (!task || task.done) return [];
  const fuera = Array.isArray(descartadas) ? descartadas : [];
  const p = detectarPistas(task.text || "");
  /** @type {Sugerencia[]} */
  const out = [];

  if (!task.recurDays && p.recurDays) {
    const clave = "recur:" + p.recurDays;
    if (!fuera.includes(clave)) out.push({ campo: "recur", valor: p.recurDays, clave: clave });
  }
  if (!task.priority && p.importante && !fuera.includes("importante")) {
    out.push({ campo: "importante", valor: true, clave: "importante" });
  }
  return out;
}

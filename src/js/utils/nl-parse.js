// @ts-check
// ═══════════════════════════════════════════════════════════════
// Parser de lenguaje natural para nuevas tareas
//
// Detecta en el texto bruto del input:
//   - Fecha       ("hoy", "mañana", "pasado mañana", "viernes",
//                  "próximo lunes", "en 3 días", "en 2 semanas",
//                  "15/3", "15-03-2026")
//   - Prioridad   ("p1" — sin niveles, solo marca "importante")
//   - Recurrencia ("todos los lunes", "cada 2 días", "mensualmente"…)
//
// Entiende también inglés, siempre, sin mirar el idioma de la app: quien
// tiene la interfaz en español puede escribir "tomorrow", y al revés.
//   - Fecha       ("today", "tonight", "tomorrow", "day after tomorrow",
//                  "friday", "next monday", "on monday", "in 3 days",
//                  "in 2 weeks", "3/15" cuando no vale como día/mes)
//   - Recurrencia ("every day", "every 2 weeks", "every monday",
//                  "every other day"…)
// Los adjetivos sueltos ("daily", "weekly") NO cuentan: "Daily con el
// equipo" es un título, no una orden. Esos los sugiere title-hints.js.
//
// Devuelve el texto limpio de esos tokens más la metadata extraída.
// ═══════════════════════════════════════════════════════════════

/** @typedef {import("../state/types.js").ParsedNL}  ParsedNL */
/** @typedef {import("../state/types.js").Priority}  Priority */

/**
 * @typedef {object} TokenMatch
 * @property {number} index
 * @property {string} removed
 */

/** @typedef {TokenMatch & { dueDate: string }}     DateMatch */
/** @typedef {TokenMatch & { recurDays: number }}   RecurMatch */
/** @typedef {TokenMatch & { priority: Priority }}  PriorityMatch */

const WEEKDAY_INDICES = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  "miércoles": 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  "sábado": 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** @param {number} n */
function pad(n) { return n < 10 ? "0" + n : "" + n; }

/** @param {Date} d */
function toISODate(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/** @param {Date} d @param {number} n */
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** @param {Date} d */
function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/**
 * Próxima vez que cae ese día de la semana. Si es hoy, o se pidió el
 * "próximo"/"next", salta a la semana siguiente.
 *
 * @param {string} dia
 * @param {boolean} proximo
 * @returns {string|null}
 */
function proximoDiaSemana(dia, proximo) {
  const target = WEEKDAY_INDICES[dia.toLowerCase()];
  if (typeof target !== "number") return null;
  const now  = new Date();
  let   diff = (target - now.getDay() + 7) % 7;
  if (diff === 0 || proximo) diff = diff === 0 ? 7 : diff;
  return toISODate(addDays(now, diff));
}

/**
 * Intenta detectar UNA fecha en el texto. Devuelve { dueDate, removed, index }
 * o null si no encuentra ninguna. Sólo extrae la primera ocurrencia.
 *
 * @param {string} text
 * @returns {DateMatch|null}
 */
function parseDate(text) {
  let m;

  // "pasado mañana" / "day after tomorrow" (probar antes que "mañana")
  m = text.match(/\b(?:pasado\s+(?:mañana|manana)|(?:the\s+)?day\s+after\s+tomorrow)\b/i);
  if (m) return { dueDate: toISODate(addDays(new Date(), 2)), removed: m[0], index: m.index };

  // "hoy" / "today" / "tonight"
  m = text.match(/\b(?:hoy|today|tonight)\b/i);
  if (m) return { dueDate: toISODate(new Date()), removed: m[0], index: m.index };

  // "mañana" / "manana" / "tomorrow"
  m = text.match(/\b(?:mañana|manana|tomorrow)\b/i);
  if (m) return { dueDate: toISODate(addDays(new Date(), 1)), removed: m[0], index: m.index };

  // "en N días/semanas" / "in N days/weeks"
  m = text.match(/\b(?:en\s+(\d+)\s+d[ií]as?|in\s+(\d+)\s+days?)\b/i);
  if (m) {
    const n = parseInt(m[1] || m[2], 10);
    return { dueDate: toISODate(addDays(new Date(), n)), removed: m[0], index: m.index };
  }
  m = text.match(/\b(?:en\s+(\d+)\s+semanas?|in\s+(\d+)\s+weeks?)\b/i);
  if (m) {
    const n = parseInt(m[1] || m[2], 10);
    return { dueDate: toISODate(addDays(new Date(), n * 7)), removed: m[0], index: m.index };
  }

  // "(el|próximo|proximo) <día>" o sólo "<día>"
  m = text.match(/\b(?:(el|próximo|proximo|próxima|proxima)\s+)?(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado)\b/i);
  if (m) {
    const fecha = proximoDiaSemana(m[2], /próximo|proximo|próxima|proxima/i.test(m[1] || ""));
    if (fecha) return { dueDate: fecha, removed: m[0], index: m.index };
  }

  // "(on|next|this) <day>" o sólo "<day>"
  m = text.match(/\b(?:(on|next|this)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (m) {
    const fecha = proximoDiaSemana(m[2], /next/i.test(m[1] || ""));
    if (fecha) return { dueDate: fecha, removed: m[0], index: m.index };
  }

  // "15/3" o "15-03-2026" o "15.3.26"
  m = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
  if (m) {
    let day   = parseInt(m[1], 10);
    let month = parseInt(m[2], 10) - 1;
    // "3/15" no existe como día/mes: se lee como mes/día, al estilo de
    // EE. UU. Lo ambiguo ("3/4") sigue siendo día/mes, como siempre.
    if (month > 11 && day <= 12) { const d = day; day = month + 1; month = d - 1; }
    let   year  = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
    if (year < 100) year += 2000;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000) {
      const d = new Date(year, month, day);
      // Si no llevaba año y la fecha cae en el pasado, asumimos año siguiente
      if (!m[3] && d < startOfDay(new Date())) d.setFullYear(year + 1);
      return { dueDate: toISODate(d), removed: m[0], index: m.index };
    }
  }

  return null;
}

/**
 * Detecta UN patrón de recurrencia en el texto.
 *
 * Casos especiales:
 *  - "todos los lunes" / "cada martes" → consume sólo "todos los " o "cada ",
 *    dejando el nombre del día para que parseDate lo recoja como dueDate.
 *
 * @param {string} text
 * @returns {RecurMatch|null}
 */
function parseRecurrence(text) {
  let m;

  // "cada N días" / "cada N semanas" / "cada N meses" — variantes numéricas
  // (y en inglés, "every N days/weeks/months")
  m = text.match(/\b(?:cada|every)\s+(\d+)\s+(?:d[ií]as?|days?)\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10), 3650), removed: m[0], index: m.index };

  m = text.match(/\b(?:cada|every)\s+(\d+)\s+(?:semanas?|weeks?)\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10) * 7, 3650), removed: m[0], index: m.index };

  m = text.match(/\b(?:cada|every)\s+(\d+)\s+(?:meses?|months?)\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10) * 30, 3650), removed: m[0], index: m.index };

  // "every other day/week/month" — cada 2
  m = text.match(/\bevery\s+other\s+(day|week|month)\b/i);
  if (m) {
    const base = m[1].toLowerCase() === "week" ? 7 : m[1].toLowerCase() === "month" ? 30 : 1;
    return { recurDays: base * 2, removed: m[0], index: m.index };
  }

  // Diario
  m = text.match(/\b(?:todos\s+los\s+d[ií]as?|cada\s+d[ií]a|diariamente|every\s*day)\b/i);
  if (m) return { recurDays: 1, removed: m[0], index: m.index };

  // Quincenal — antes que "semanal" para que no se solape
  m = text.match(/\b(?:quincenalmente|cada\s+quincena|cada\s+15\s+d[ií]as?|every\s+fortnight)\b/i);
  if (m) return { recurDays: 14, removed: m[0], index: m.index };

  // Semanal
  m = text.match(/\b(?:cada\s+semana|semanalmente|every\s+week)\b/i);
  if (m) return { recurDays: 7, removed: m[0], index: m.index };

  // Mensual
  m = text.match(/\b(?:cada\s+mes|mensualmente|every\s+month)\b/i);
  if (m) return { recurDays: 30, removed: m[0], index: m.index };

  // "(todos los|cada|every) <día>" — consume sólo el prefijo. El día se lo
  // queda parseDate para fijar la próxima ocurrencia como dueDate.
  m = text.match(/\b(?:todos\s+los|cada)\s+(?=domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)/i)
   || text.match(/\bevery\s+(?=(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b)/i);
  if (m) return { recurDays: 7, removed: m[0], index: m.index };

  return null;
}

/**
 * @param {string} text
 * @returns {PriorityMatch|null}
 */
function parsePriority(text) {
  // "p1" marca la tarea como importante — ya no hay niveles, así que
  // "p2"/"p3" no se reconocen como token y se quedan como texto normal
  // (con boundary: no rompe palabras tipo "p10").
  const m = text.match(/(^|\s)(p1)(?=\s|$)/i);
  if (!m || m.index == null) return null;
  return {
    priority: /** @type {Priority} */ ("high"),
    removed:  m[2],
    index:    m.index + m[1].length,
  };
}

/**
 * Parsea el input del usuario y devuelve la tarea descompuesta.
 *
 * @param {string} rawInput
 * @returns {ParsedNL}
 */
export function parseNaturalLanguage(rawInput) {
  if (!rawInput || typeof rawInput !== "string") {
    return { text: "", dueDate: null, priority: null, recurDays: null };
  }

  const text = rawInput;
  const rangesToRemove = [];

  let dueDate   = null;
  let priority  = null;
  let recurDays = null;

  // Recurrencia ANTES que fecha — para que "todos los lunes" consuma
  // el "todos los" y deje "lunes" libre para parseDate.
  const recurRes = parseRecurrence(text);
  if (recurRes) {
    recurDays = recurRes.recurDays;
    rangesToRemove.push([recurRes.index, recurRes.index + recurRes.removed.length]);
  }

  const dateRes = parseDate(text);
  if (dateRes) {
    dueDate = dateRes.dueDate;
    rangesToRemove.push([dateRes.index, dateRes.index + dateRes.removed.length]);
  }

  const prioRes = parsePriority(text);
  if (prioRes) {
    priority = prioRes.priority;
    rangesToRemove.push([prioRes.index, prioRes.index + prioRes.removed.length]);
  }

  // Quitar rangos solapados sin perder índices: ordenar descendente
  rangesToRemove.sort(function (a, b) { return b[0] - a[0]; });
  let cleaned = text;
  for (let i = 0; i < rangesToRemove.length; i++) {
    const start = rangesToRemove[i][0];
    const end   = rangesToRemove[i][1];
    cleaned = cleaned.slice(0, start) + cleaned.slice(end);
  }
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Si tras limpiar quedó vacío, recuperamos el texto original
  // (probablemente solo tokens — no es lo que el usuario quería).
  if (!cleaned) {
    cleaned   = text.trim();
    dueDate   = null;
    priority  = null;
    recurDays = null;
  }

  return { text: cleaned, dueDate, priority, recurDays };
}

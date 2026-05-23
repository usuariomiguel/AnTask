// @ts-check
// ═══════════════════════════════════════════════════════════════
// Parser de lenguaje natural para nuevas tareas
//
// Detecta en el texto bruto del input:
//   - Fecha       ("hoy", "mañana", "pasado mañana", "viernes",
//                  "próximo lunes", "en 3 días", "en 2 semanas",
//                  "15/3", "15-03-2026")
//   - Prioridad   ("p1", "p2", "p3")
//   - Etiquetas   ("#personal", "#trabajo")
//   - Recurrencia ("todos los lunes", "cada 2 días", "mensualmente"…)
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
 * Intenta detectar UNA fecha en el texto. Devuelve { dueDate, removed, index }
 * o null si no encuentra ninguna. Sólo extrae la primera ocurrencia.
 *
 * @param {string} text
 * @returns {DateMatch|null}
 */
function parseDate(text) {
  let m;

  // "pasado mañana" (probar antes que "mañana")
  m = text.match(/\bpasado\s+(?:mañana|manana)\b/i);
  if (m) return { dueDate: toISODate(addDays(new Date(), 2)), removed: m[0], index: m.index };

  // "hoy"
  m = text.match(/\bhoy\b/i);
  if (m) return { dueDate: toISODate(new Date()), removed: m[0], index: m.index };

  // "mañana" / "manana"
  m = text.match(/\b(?:mañana|manana)\b/i);
  if (m) return { dueDate: toISODate(addDays(new Date(), 1)), removed: m[0], index: m.index };

  // "en N días/semanas"
  m = text.match(/\ben\s+(\d+)\s+d[ií]as?\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    return { dueDate: toISODate(addDays(new Date(), n)), removed: m[0], index: m.index };
  }
  m = text.match(/\ben\s+(\d+)\s+semanas?\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    return { dueDate: toISODate(addDays(new Date(), n * 7)), removed: m[0], index: m.index };
  }

  // "(el|próximo|proximo) <día>" o sólo "<día>"
  m = text.match(/\b(?:(el|próximo|proximo|próxima|proxima)\s+)?(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado)\b/i);
  if (m) {
    const target = WEEKDAY_INDICES[m[2].toLowerCase()];
    if (typeof target === "number") {
      const now    = new Date();
      const today  = now.getDay();
      let   diff   = (target - today + 7) % 7;
      // "próximo X" o si coincide hoy → la PRÓXIMA ocurrencia (no la de hoy)
      if (diff === 0 || /próximo|proximo|próxima|proxima/i.test(m[1] || "")) diff = diff === 0 ? 7 : diff;
      return { dueDate: toISODate(addDays(now, diff)), removed: m[0], index: m.index };
    }
  }

  // "15/3" o "15-03-2026" o "15.3.26"
  m = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?\b/);
  if (m) {
    const day   = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
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
  m = text.match(/\bcada\s+(\d+)\s+d[ií]as?\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10), 3650), removed: m[0], index: m.index };

  m = text.match(/\bcada\s+(\d+)\s+semanas?\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10) * 7, 3650), removed: m[0], index: m.index };

  m = text.match(/\bcada\s+(\d+)\s+meses?\b/i);
  if (m) return { recurDays: Math.min(parseInt(m[1], 10) * 30, 3650), removed: m[0], index: m.index };

  // Diario
  m = text.match(/\b(?:todos\s+los\s+d[ií]as?|cada\s+d[ií]a|diariamente)\b/i);
  if (m) return { recurDays: 1, removed: m[0], index: m.index };

  // Quincenal — antes que "semanal" para que no se solape
  m = text.match(/\b(?:quincenalmente|cada\s+quincena|cada\s+15\s+d[ií]as?)\b/i);
  if (m) return { recurDays: 14, removed: m[0], index: m.index };

  // Semanal
  m = text.match(/\b(?:cada\s+semana|semanalmente)\b/i);
  if (m) return { recurDays: 7, removed: m[0], index: m.index };

  // Mensual
  m = text.match(/\b(?:cada\s+mes|mensualmente)\b/i);
  if (m) return { recurDays: 30, removed: m[0], index: m.index };

  // "(todos los|cada) <día>" — consume sólo el prefijo. El día se lo
  // queda parseDate para fijar la próxima ocurrencia como dueDate.
  m = text.match(/\b(?:todos\s+los|cada)\s+(?=domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado)/i);
  if (m) return { recurDays: 7, removed: m[0], index: m.index };

  return null;
}

/**
 * @param {string} text
 * @returns {PriorityMatch|null}
 */
function parsePriority(text) {
  // p1 / p2 / p3 con boundary (no rompe palabras tipo "p10")
  const m = text.match(/(^|\s)(p)([123])(?=\s|$)/i);
  if (!m || m.index == null) return null;
  /** @type {{ [k: string]: Priority }} */
  const map = { "1": "high", "2": "medium", "3": "low" };
  return {
    priority: map[m[3]],
    removed:  m[2] + m[3],
    index:    m.index + m[1].length,
  };
}

/**
 * @param {string} text
 * @returns {{ labels: string[], ranges: Array<[number, number]> }}
 */
function parseLabels(text) {
  const labels = [];
  const ranges = [];
  const re = /#([\p{L}\p{N}_-]{1,30})/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (!labels.includes(name)) labels.push(name);
    ranges.push([m.index, m.index + m[0].length]);
  }
  return { labels, ranges };
}

/**
 * Parsea el input del usuario y devuelve la tarea descompuesta.
 *
 * @param {string} rawInput
 * @returns {ParsedNL}
 */
export function parseNaturalLanguage(rawInput) {
  if (!rawInput || typeof rawInput !== "string") {
    return { text: "", dueDate: null, priority: null, labels: [], recurDays: null };
  }

  const text = rawInput;
  const rangesToRemove = [];

  let dueDate   = null;
  let priority  = null;
  let labels    = [];
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

  const labelsRes = parseLabels(text);
  labels = labelsRes.labels;
  for (let i = 0; i < labelsRes.ranges.length; i++) rangesToRemove.push(labelsRes.ranges[i]);

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
    labels    = [];
    recurDays = null;
  }

  return { text: cleaned, dueDate, priority, labels, recurDays };
}

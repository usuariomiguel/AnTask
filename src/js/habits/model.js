// @ts-check
// ═══════════════════════════════════════════════════════════════
// Lógica de hábitos — funciones puras sobre un Habit ya saneado.
//
// Aquí no se toca el DOM ni localStorage: solo se responde a "¿tocaba
// este día?", "¿está hecho?" y "¿cuánta racha llevo?". Eso lo hace
// testeable sin navegador, que es justo lo que hace falta cuando la
// aritmética de fechas es la fuente habitual de bugs.
// ═══════════════════════════════════════════════════════════════

/** @typedef {import("../state/types.js").Habit} Habit */

/** Tope de días que recorre computeStreak, por si algún dato viene raro. */
const MAX_DIAS = 3650;

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Fecha ISO → objeto Date anclado a medianoche UTC.
 *
 * TODA la aritmética de este módulo va en UTC, nunca en hora local: un
 * día local puede durar 23 o 25 horas en los cambios de horario, y
 * sumar/restar días ahí se descuadra. En UTC todos los días miden 24 h,
 * así que las cuentas son exactas y el resultado no depende de dónde
 * esté el usuario.
 *
 * @param {string} dateISO
 * @returns {Date}
 */
function _fecha(dateISO) {
  const p = dateISO.split("-");
  return new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])));
}

/**
 * Convierte "YYYY-MM-DD" en un número de día absoluto, para restar fechas.
 * @param {string} dateISO
 * @returns {number}
 */
function _numeroDeDia(dateISO) {
  return _fecha(dateISO).getTime() / 86400000;
}

/**
 * Suma días a una fecha ISO y devuelve otra fecha ISO.
 * @param {string} dateISO
 * @param {number} dias
 * @returns {string}
 */
export function addDays(dateISO, dias) {
  const d = _fecha(dateISO);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Día en que arranca el hábito (parte fecha de `createdAt`).
 * @param {Habit} habit
 * @returns {string}
 */
export function startDate(habit) {
  const c = habit && habit.createdAt;
  if (typeof c === "string" && c.length >= 10 && RE_ISO.test(c.slice(0, 10))) {
    return c.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * ¿Tocaba este hábito ese día?
 *
 * Antes de crearse nunca tocaba: sin esto, un hábito nuevo saldría como
 * "fallado" en todo el histórico anterior a su propia existencia.
 *
 * @param {Habit} habit
 * @param {string} dateISO
 * @returns {boolean}
 */
export function isDueOn(habit, dateISO) {
  if (!habit || !RE_ISO.test(dateISO)) return false;
  if (habit.archived) return false;

  const inicio = startDate(habit);
  if (dateISO < inicio) return false;

  if (habit.schedule === "everyN" && habit.everyNDays && habit.everyNDays > 1) {
    const diff = _numeroDeDia(dateISO) - _numeroDeDia(inicio);
    return diff % habit.everyNDays === 0;
  }
  return true; // "daily"
}

/**
 * ¿Está marcado ese día?
 * @param {Habit} habit
 * @param {string} dateISO
 * @returns {boolean}
 */
export function isDoneOn(habit, dateISO) {
  return Boolean(habit && habit.log && habit.log[dateISO]);
}

/**
 * Marca o desmarca un día. Muta el hábito y lo devuelve.
 * @param {Habit} habit
 * @param {string} dateISO
 * @param {boolean} done
 * @returns {Habit}
 */
export function setDoneOn(habit, dateISO, done) {
  if (!habit || !RE_ISO.test(dateISO)) return habit;
  if (!habit.log) habit.log = {};
  if (done) habit.log[dateISO] = 1;
  else delete habit.log[dateISO];
  return habit;
}

/**
 * Racha actual: días QUE TOCABAN completados de forma consecutiva hacia
 * atrás. Los días que no tocaban no suman ni cortan.
 *
 * Hoy sin marcar no rompe la racha: queda día por delante, y cortarla a
 * las 00:01 castiga por no haber hecho todavía algo que aún se puede
 * hacer. Un día anterior que tocaba y está sin marcar sí la corta.
 *
 * @param {Habit} habit
 * @param {string} todayISO
 * @returns {number}
 */
export function computeStreak(habit, todayISO) {
  if (!habit || !RE_ISO.test(todayISO)) return 0;

  const inicio = startDate(habit);
  let racha = 0;
  let cursor = todayISO;
  let vueltas = 0;

  while (cursor >= inicio && vueltas < MAX_DIAS) {
    if (isDueOn(habit, cursor)) {
      if (isDoneOn(habit, cursor)) racha++;
      else if (cursor !== todayISO) break;
    }
    cursor = addDays(cursor, -1);
    vueltas++;
  }
  return racha;
}

/**
 * Días que tocaban y días cumplidos en una ventana [desde, hasta].
 * Es lo que necesita el mapa de calor para pintar intensidad.
 *
 * @param {Habit} habit
 * @param {string} desdeISO
 * @param {string} hastaISO
 * @returns {{due: number, done: number}}
 */
export function statsBetween(habit, desdeISO, hastaISO) {
  const out = { due: 0, done: 0 };
  if (!habit || !RE_ISO.test(desdeISO) || !RE_ISO.test(hastaISO)) return out;

  let cursor = desdeISO;
  let vueltas = 0;
  while (cursor <= hastaISO && vueltas < MAX_DIAS) {
    if (isDueOn(habit, cursor)) {
      out.due++;
      if (isDoneOn(habit, cursor)) out.done++;
    }
    cursor = addDays(cursor, 1);
    vueltas++;
  }
  return out;
}

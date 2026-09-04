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

/**
 * Une dos historiales por fecha.
 *
 * El log solo crece: cada entrada dice "este día se cumplió", nunca lo
 * contrario. Eso hace que la unión sea la fusión correcta y que dé igual
 * el orden de los argumentos — no hay conflicto posible entre dos
 * dispositivos que marcan días distintos.
 *
 * Si el mismo día llega con cuentas distintas gana la mayor. Hoy siempre
 * es 1, pero cuando el log cuente repeticiones ("5 de 8 vasos") el número
 * más alto será el más completo.
 *
 * @param {Record<string, number>} [a]
 * @param {Record<string, number>} [b]
 * @returns {Record<string, number>}
 */
export function mergeLogs(a, b) {
  /** @type {Record<string, number>} */
  const out = {};
  [a, b].forEach(function (src) {
    if (!src || typeof src !== "object") return;
    Object.keys(src).forEach(function (k) {
      if (!RE_ISO.test(k)) return;
      const v = Number(src[k]);
      if (!Number.isFinite(v) || v <= 0) return;
      if (!out[k] || v > out[k]) out[k] = v;
    });
  });
  return out;
}

/**
 * Funde los hábitos que llegan de la nube con los que hay en local.
 *
 * QUÉ hábitos existen lo decide el remoto, igual que con proyectos y
 * secciones: así un hábito borrado en otro dispositivo desaparece aquí en
 * vez de resucitar. Lo que NO se pisa es el historial — ese se une.
 *
 * El motivo: sin esto, marcar un hábito en el móvil y otro en el portátil
 * con los dos abiertos hacía que el snapshot de uno borrase la marca del
 * otro. En una tarea eso molesta; en un hábito rompe una racha visible,
 * que es justo lo que da valor a la función.
 *
 * Contrapartida asumida: DESmarcar un día no viaja entre dos dispositivos
 * abiertos a la vez — el que aún lo tenga marcado lo reintroduce al unir.
 * Se prefiere eso a perder marcas: desmarcar es raro y su peor caso es un
 * día de más, mientras que perder una marca corta una racha.
 *
 * @param {Habit[]} locales
 * @param {Habit[]} remotos
 * @returns {Habit[]}
 */
export function mergeHabits(locales, remotos) {
  /** @type {Record<string, Habit>} */
  const porId = {};
  (locales || []).forEach(function (h) { if (h && h.id) porId[h.id] = h; });

  return (remotos || []).map(function (r) {
    const l = porId[r.id];
    if (!l) return r;
    return Object.assign({}, r, { log: mergeLogs(l.log, r.log) });
  });
}

/**
 * Cuántos hábitos tocaban un día y cuántos se cumplieron.
 *
 * Es lo que da la INTENSIDAD del mapa de calor agregado: un día en que
 * tocaban cuatro y hiciste dos no es igual que uno en que tocaba uno y lo
 * hiciste. Sin esto solo se podría pintar hecho/no hecho.
 *
 * Los días anteriores a un hábito no cuentan para él (lo resuelve
 * `isDueOn`), así que un hábito nuevo no ensucia el histórico de antes.
 *
 * @param {Habit[]} lista
 * @param {string} dateISO
 * @returns {{due: number, done: number, ratio: number}}
 */
export function dayAggregate(lista, dateISO) {
  let due = 0;
  let done = 0;
  (lista || []).forEach(function (h) {
    if (!isDueOn(h, dateISO)) return;
    due++;
    if (isDoneOn(h, dateISO)) done++;
  });
  return { due: due, done: done, ratio: due ? done / due : 0 };
}

/**
 * Nivel de intensidad 0-4 para pintar una celda del mapa.
 *
 * 0 se reserva a "no tocaba nada": un día sin nada pendiente no es un
 * fracaso y no debe leerse igual que uno fallado. Por eso el 1 empieza en
 * ratio 0 CON algo pendiente.
 *
 * @param {{due: number, ratio: number}} agg
 * @returns {0|1|2|3|4}
 */
export function heatLevel(agg) {
  if (!agg || !agg.due) return 0;
  if (agg.ratio <= 0) return 1;
  if (agg.ratio < 0.5) return 2;
  if (agg.ratio < 1) return 3;
  return 4;
}

/**
 * Serie de días [desde, hasta] con su agregado y su nivel, lista para
 * pintar. Un solo recorrido: el render no vuelve a calcular nada.
 *
 * @param {Habit[]} lista
 * @param {string} desdeISO
 * @param {string} hastaISO
 * @returns {Array<{date: string, due: number, done: number, level: number}>}
 */
export function heatSeries(lista, desdeISO, hastaISO) {
  const out = [];
  if (!RE_ISO.test(desdeISO) || !RE_ISO.test(hastaISO)) return out;
  let cursor = desdeISO;
  let vueltas = 0;
  while (cursor <= hastaISO && vueltas < MAX_DIAS) {
    const agg = dayAggregate(lista, cursor);
    out.push({ date: cursor, due: agg.due, done: agg.done, level: heatLevel(agg) });
    cursor = addDays(cursor, 1);
    vueltas++;
  }
  return out;
}

/**
 * Día de la semana con LUNES = 0, que es como se ordenan las filas del
 * mapa de calor (y como se lee una semana en España).
 *
 * @param {string} dateISO
 * @returns {number} 0 (lunes) … 6 (domingo)
 */
export function weekdayIndex(dateISO) {
  if (!RE_ISO.test(dateISO)) return 0;
  return (_fecha(dateISO).getUTCDay() + 6) % 7;
}

/**
 * Lunes de la semana a la que pertenece una fecha.
 * @param {string} dateISO
 * @returns {string}
 */
export function weekStart(dateISO) {
  return addDays(dateISO, -weekdayIndex(dateISO));
}

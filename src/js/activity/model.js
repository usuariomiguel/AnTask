// @ts-check
// ═══════════════════════════════════════════════════════════════
// Registro de actividad: qué se completó y cuándo.
//
// Antes no quedaba rastro de CUÁNDO se hacía algo: una tarea solo sabía
// si estaba hecha, y los hábitos solo el día. Este registro apunta cada
// completado con su fecha y hora, y es lo que leen la vista «Actividad»,
// el «Hechas este día» del calendario y la pestaña de Estadísticas.
//
// Reglas:
//  - Solo completados (tareas y hábitos), de momento.
//  - Desmarcar no borra el evento: lo deja `anulado`. Se sincroniza
//    UNIENDO por id, y si se borrara, otro dispositivo que aún lo tuviera
//    lo volvería a meter; anulado viaja y gana.
//  - Se queda con los últimos ACTIVIDAD_DIAS días y como mucho
//    ACTIVIDAD_MAX eventos: todo el espacio de trabajo va en un único
//    documento de Firestore, con tope de 1 MB.
// ═══════════════════════════════════════════════════════════════

export const ACTIVIDAD_DIAS = 90;
export const ACTIVIDAD_MAX = 1500;
const DIA_MS = 864e5;
const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const RE_COLOR = /^#[0-9a-fA-F]{3,8}$/;

/**
 * @typedef {Object} EventoActividad
 * @property {string}  id
 * @property {"tarea"|"habito"} tipo
 * @property {number}  ts        - Cuándo se marcó (ms desde epoch)
 * @property {string}  dia       - Día al que cuenta (YYYY-MM-DD). En tareas, el
 *                                 del propio momento; en hábitos, el día
 *                                 marcado (puede ser uno pasado).
 * @property {string}  ref       - Id de la tarea o del hábito
 * @property {string}  texto     - Texto en el momento de completarlo: si la
 *                                 tarea se borra o se renombra, el registro
 *                                 sigue diciendo qué se hizo.
 * @property {string}  [lista]   - Nombre de la lista (solo tareas)
 * @property {string}  [color]   - Color de la lista
 * @property {boolean} [anulado] - Se desmarcó después
 */

/** Día local (YYYY-MM-DD) de un instante. */
export function diaLocal(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function nuevoId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) { /* sin crypto: el de abajo vale */ }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Quita lo de hace más de ACTIVIDAD_DIAS días y recorta a ACTIVIDAD_MAX
 * (se quedan los más recientes). Devuelve una lista nueva, ordenada del
 * más antiguo al más reciente.
 * @param {EventoActividad[]} eventos
 * @param {number} [ahora]
 * @returns {EventoActividad[]}
 */
export function podar(eventos, ahora = Date.now()) {
  const limite = ahora - ACTIVIDAD_DIAS * DIA_MS;
  const vivos = eventos.filter((e) => e.ts >= limite).sort((a, b) => a.ts - b.ts);
  return vivos.length > ACTIVIDAD_MAX ? vivos.slice(vivos.length - ACTIVIDAD_MAX) : vivos;
}

/**
 * Apunta un completado. Si ya hay uno vivo del mismo elemento para ese
 * día, no duplica.
 * @param {EventoActividad[]} eventos
 * @param {{tipo: "tarea"|"habito", ref: string, texto: string, dia?: string, lista?: string, color?: string}} datos
 * @param {number} [ahora]
 * @returns {EventoActividad[]}
 */
export function registrarCompletado(eventos, datos, ahora = Date.now()) {
  const dia = datos.dia || diaLocal(ahora);
  const yaEsta = eventos.some((e) => !e.anulado && e.tipo === datos.tipo && e.ref === datos.ref && e.dia === dia);
  if (yaEsta) return podar(eventos, ahora);
  /** @type {EventoActividad} */
  const ev = { id: nuevoId(), tipo: datos.tipo, ts: ahora, dia, ref: datos.ref, texto: String(datos.texto || "").slice(0, 120) };
  if (datos.lista) ev.lista = String(datos.lista).slice(0, 60);
  if (datos.color && RE_COLOR.test(datos.color)) ev.color = datos.color;
  return podar(eventos.concat(ev), ahora);
}

/**
 * Desmarcar: anula el último completado vivo de ese elemento. Con `dia`,
 * solo el de ese día (hábitos: se desmarca un día concreto); sin él, el
 * último sea del día que sea (tareas: reabrir una tarea hecha ayer deshace
 * ese completado).
 * @param {EventoActividad[]} eventos
 * @param {"tarea"|"habito"} tipo
 * @param {string} ref
 * @param {string|null} [dia]
 * @returns {EventoActividad[]}
 */
export function anularCompletado(eventos, tipo, ref, dia) {
  let idx = -1;
  for (let i = eventos.length - 1; i >= 0; i--) {
    const e = eventos[i];
    if (!e.anulado && e.tipo === tipo && e.ref === ref && (!dia || e.dia === dia)) { idx = i; break; }
  }
  if (idx < 0) return eventos;
  return eventos.map((e, i) => (i === idx ? { ...e, anulado: true } : e));
}

/**
 * Une el registro local con el que llega de la nube: por id, y si un
 * evento está anulado en cualquiera de los dos, queda anulado.
 * @param {EventoActividad[]} local
 * @param {EventoActividad[]} remoto
 * @param {number} [ahora]
 * @returns {EventoActividad[]}
 */
export function unirActividad(local, remoto, ahora = Date.now()) {
  /** @type {Map<string, EventoActividad>} */
  const porId = new Map();
  for (const e of local) porId.set(e.id, e);
  for (const e of remoto) {
    const ya = porId.get(e.id);
    porId.set(e.id, ya ? { ...ya, anulado: Boolean(ya.anulado || e.anulado) } : e);
  }
  return podar([...porId.values()], ahora);
}

/**
 * Lo que se enseña: sin anulados, del más reciente al más antiguo.
 * @param {EventoActividad[]} eventos
 * @param {{tipo?: "tarea"|"habito", dias?: number, lista?: string}} [filtro]
 * @param {number} [ahora]
 * @returns {EventoActividad[]}
 */
export function visibles(eventos, filtro = {}, ahora = Date.now()) {
  const desde = filtro.dias ? diaLocal(ahora - (filtro.dias - 1) * DIA_MS) : "";
  return eventos
    .filter((e) => !e.anulado)
    .filter((e) => !filtro.tipo || e.tipo === filtro.tipo)
    .filter((e) => !filtro.lista || e.lista === filtro.lista)
    .filter((e) => !desde || e.dia >= desde)
    .sort((a, b) => (a.dia === b.dia ? b.ts - a.ts : (a.dia < b.dia ? 1 : -1)));
}

/**
 * Agrupa por día, del más reciente al más antiguo.
 * @param {EventoActividad[]} eventos - ya filtrados y ordenados (ver visibles)
 * @returns {{dia: string, eventos: EventoActividad[]}[]}
 */
export function agruparPorDia(eventos) {
  /** @type {{dia: string, eventos: EventoActividad[]}[]} */
  const grupos = [];
  for (const e of eventos) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === e.dia) ultimo.eventos.push(e);
    else grupos.push({ dia: e.dia, eventos: [e] });
  }
  return grupos;
}

/**
 * Valida lo que venga de localStorage o de la nube y lo poda.
 * @param {any} entrada
 * @param {number} [ahora]
 * @returns {EventoActividad[]}
 */
export function sanitizeActividad(entrada, ahora = Date.now()) {
  if (!Array.isArray(entrada)) return [];
  /** @type {EventoActividad[]} */
  const limpios = [];
  for (const e of entrada) {
    if (!e || typeof e !== "object") continue;
    if (e.tipo !== "tarea" && e.tipo !== "habito") continue;
    if (typeof e.id !== "string" || !e.id) continue;
    if (typeof e.ref !== "string" || !e.ref) continue;
    if (typeof e.ts !== "number" || !isFinite(e.ts)) continue;
    if (typeof e.dia !== "string" || !RE_ISO.test(e.dia)) continue;
    /** @type {EventoActividad} */
    const ev = { id: e.id, tipo: e.tipo, ts: e.ts, dia: e.dia, ref: e.ref, texto: typeof e.texto === "string" ? e.texto.slice(0, 120) : "" };
    if (typeof e.lista === "string" && e.lista) ev.lista = e.lista.slice(0, 60);
    if (typeof e.color === "string" && RE_COLOR.test(e.color)) ev.color = e.color;
    if (e.anulado === true) ev.anulado = true;
    limpios.push(ev);
  }
  return podar(limpios, ahora);
}

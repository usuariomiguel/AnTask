// @ts-check
// ═══════════════════════════════════════════════════════════════
// Sanitización de datos (input no confiable → forma canónica)
//
// Estas funciones se aplican al cargar datos desde localStorage,
// desde import de backup, o desde sincronización Firebase.
// Garantizan que todo lo que entra al estado tiene una estructura
// estable, sin importar lo que venga de fuera.
// ═══════════════════════════════════════════════════════════════

import { generateId } from "../utils/id.js";

/** @typedef {import("./types.js").Subtask}          Subtask */
/** @typedef {import("./types.js").Task}             Task */
/** @typedef {import("./types.js").Project}          Project */
/** @typedef {import("./types.js").Priority}         Priority */

// La prioridad ya no tiene niveles: una tarea es "importante" o no lo es.
// `medium`/`low` se aceptan solo para no perder datos de antes de este
// cambio (localStorage viejo, backups, sync) — se colapsan a "high" al
// entrar, que es el único valor que la UI puede volver a escribir.
const VALID_PRIORITIES = ["high", "medium", "low"];
/**
 * @param {any} p
 * @returns {Priority}
 */
function normalizePriority(p) {
  return VALID_PRIORITIES.includes(p) ? "high" : null;
}

/**
 * @param {any} input
 * @returns {Subtask[]}
 */
export function sanitizeSubtasks(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(function (s) { return s && typeof s.text === "string"; })
    .map(function (s) {
      return {
        id:   typeof s.id === "string" ? s.id : generateId(),
        text: s.text.trim().slice(0, 120),
        done: Boolean(s.done),
      };
    })
    .filter(function (s) { return s.text.length > 0; });
}

/**
 * @param {any} input
 * @returns {Task[]}
 */
export function sanitizeTasks(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(function (i) { return i && typeof i.text === "string"; })
    .map(function (i) {
      return {
        id:         typeof i.id === "string" ? i.id : generateId(),
        text:       i.text.trim().slice(0, 120),
        comment:    typeof i.comment === "string" ? i.comment.trim().slice(0, 300) : "",
        done:       Boolean(i.done),
        priority:   normalizePriority(i.priority),
        dueDate:    typeof i.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) ? i.dueDate : null,
        dueTime:    typeof i.dueTime === "string" && /^\d{2}:\d{2}$/.test(i.dueTime) ? i.dueTime : null,
        recurDays:  (typeof i.recurDays === "number" && i.recurDays > 0) ? i.recurDays : null,
        reminderAt: typeof i.reminderAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(i.reminderAt) ? i.reminderAt : null,
        timeLogged: (typeof i.timeLogged === "number" && i.timeLogged > 0) ? i.timeLogged : 0,
        subtasks:   sanitizeSubtasks(i.subtasks),
      };
    })
    .filter(function (i) { return i.text.length > 0; });
}

/**
 * @param {any} p
 * @returns {Project}
 */
export function sanitizeProject(p) {
  return {
    id:        typeof p.id === "string" ? p.id : generateId(),
    name:      typeof p.name === "string" ? p.name.trim().slice(0, 60) : "Sin nombre",
    createdAt: p.createdAt || new Date().toISOString(),
    tasks:     sanitizeTasks(p.tasks),
    sectionId: typeof p.sectionId === "string" ? p.sectionId : null,
    archived:  !!p.archived,
    icon:      typeof p.icon === "string" ? p.icon : "",
    color:     typeof p.color === "string" ? p.color : "",
  };
}

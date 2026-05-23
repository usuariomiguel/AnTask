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
/** @typedef {import("./types.js").StandaloneNote}   StandaloneNote */
/** @typedef {import("./types.js").SmartList}        SmartList */

const VALID_STATUSES   = new Set(["progress", "waiting", null]);
const VALID_PRIORITIES = ["high", "medium", "low"];

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
        status:     VALID_STATUSES.has(i.status) ? i.status : null,
        priority:   VALID_PRIORITIES.includes(i.priority) ? i.priority : null,
        labels:     Array.isArray(i.labels)
                      ? i.labels.filter(function (l) { return typeof l === "string" && l.length > 0; }).slice(0, 10)
                      : [],
        dueDate:    typeof i.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) ? i.dueDate : null,
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
    notes:     typeof p.notes === "string" ? p.notes : "",
    labels:    Array.isArray(p.labels)
                 ? p.labels.filter(function (l) { return typeof l === "string" && l.length > 0; })
                 : [],
    sectionId: typeof p.sectionId === "string" ? p.sectionId : null,
    archived:  !!p.archived,
    icon:      typeof p.icon === "string" ? p.icon : "",
    color:     typeof p.color === "string" ? p.color : "",
  };
}

/**
 * @param {any} n
 * @returns {StandaloneNote}
 */
export function sanitizeStandaloneNote(n) {
  return {
    id:        typeof n.id === "string" ? n.id : "note-" + Date.now(),
    name:      typeof n.name === "string" ? n.name.slice(0, 80) : "Sin título",
    content:   typeof n.content === "string" ? n.content : "",
    createdAt: n.createdAt || new Date().toISOString(),
    color:     typeof n.color === "string" ? n.color : "",
  };
}

const VALID_SL_STATUS   = ["pending", "done", "any"];
const VALID_SL_DUEDATE  = ["any", "overdue", "today", "this_week", "no_date"];
const VALID_SL_PRIORITY = ["any", "high", "medium", "low"];

/**
 * Sanitiza un Smart List (filtro guardado).
 *
 * Shape:
 *   {
 *     id, name, icon, createdAt,
 *     filters: {
 *       status:   "pending" | "done" | "any",
 *       priority: "any" | "high" | "medium" | "low",
 *       dueDate:  "any" | "overdue" | "today" | "this_week" | "no_date",
 *       label:    string | null
 *     }
 *   }
 */
/**
 * @param {any} sl
 * @returns {SmartList|null}
 */
export function sanitizeSmartList(sl) {
  if (!sl || typeof sl !== "object") return null;
  const f = sl.filters || {};
  return {
    id:        typeof sl.id === "string" ? sl.id : "sl-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    name:      typeof sl.name === "string" ? sl.name.trim().slice(0, 50) : "Sin nombre",
    icon:      typeof sl.icon === "string" ? sl.icon : "🔍",
    createdAt: sl.createdAt || new Date().toISOString(),
    filters: {
      status:   VALID_SL_STATUS.includes(f.status)     ? f.status   : "pending",
      priority: VALID_SL_PRIORITY.includes(f.priority) ? f.priority : "any",
      dueDate:  VALID_SL_DUEDATE.includes(f.dueDate)   ? f.dueDate  : "any",
      label:    typeof f.label === "string" && f.label.length > 0 ? f.label : null,
    },
  };
}

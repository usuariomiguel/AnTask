// @ts-check
// ═══════════════════════════════════════════════════════════════
// Lectura del estado desde localStorage
//
// Solo lectura. Las escrituras (saveProjects, saveSections, etc.)
// dependen de variables del módulo principal y por ahora viven en
// script.js. Se moverán cuando exista un store explícito.
// ═══════════════════════════════════════════════════════════════

import {
  PROJECTS_KEY,
  SECTIONS_KEY,
  METADATA_KEY,
  TASK_PREFS_KEY,
  PROFILE_KEY,
  HABITS_KEY,
} from "./keys.js";
import { sanitizeProject, sanitizeHabits } from "./sanitize.js";

/** @typedef {import("./types.js").Project}           Project */
/** @typedef {import("./types.js").Section}           Section */
/** @typedef {import("./types.js").Habit}             Habit */
/** @typedef {import("./types.js").WorkspaceMetadata} WorkspaceMetadata */

/** @returns {Project[]} */
export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(sanitizeProject);
  } catch (_) {
    return [];
  }
}

/** @returns {Habit[]} */
export function loadHabits() {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    return sanitizeHabits(JSON.parse(raw));
  } catch (_) {
    return [];
  }
}

/** @returns {Section[]} */
export function loadSections() {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** @returns {WorkspaceMetadata} */
export function loadMetadata() {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : { lastSavedAt: null };
  } catch (_) {
    return { lastSavedAt: null };
  }
}

/** @returns {Record<string, any>} */
export function loadTaskPrefs() {
  try {
    const raw = localStorage.getItem(TASK_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/** Perfil local del usuario (nombre + avatar emoji). @returns {{name?: string, icon?: string}} */
export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return p && typeof p === "object" ? p : {};
  } catch (_) {
    return {};
  }
}

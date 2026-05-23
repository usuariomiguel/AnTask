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
  NOTES_KEY,
  METADATA_KEY,
  TASK_PREFS_KEY,
  SMART_LISTS_KEY,
} from "./keys.js";
import { sanitizeProject, sanitizeStandaloneNote, sanitizeSmartList } from "./sanitize.js";

/** @typedef {import("./types.js").Project}           Project */
/** @typedef {import("./types.js").Section}           Section */
/** @typedef {import("./types.js").StandaloneNote}    StandaloneNote */
/** @typedef {import("./types.js").SmartList}         SmartList */
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

/** @returns {Section[]} */
export function loadSections() {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/** @returns {StandaloneNote[]} */
export function loadStandaloneNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw).map(sanitizeStandaloneNote) : [];
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

/** @returns {SmartList[]} */
export function loadSmartLists() {
  try {
    const raw = localStorage.getItem(SMART_LISTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(sanitizeSmartList).filter(Boolean);
  } catch (_) {
    return [];
  }
}

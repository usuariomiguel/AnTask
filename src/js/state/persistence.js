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
} from "./keys.js";
import { sanitizeProject, sanitizeStandaloneNote } from "./sanitize.js";

export function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(sanitizeProject);
  } catch (_) {
    return [];
  }
}

export function loadSections() {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function loadStandaloneNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw).map(sanitizeStandaloneNote) : [];
  } catch (_) {
    return [];
  }
}

export function loadMetadata() {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : { lastSavedAt: null };
  } catch (_) {
    return { lastSavedAt: null };
  }
}

export function loadTaskPrefs() {
  try {
    const raw = localStorage.getItem(TASK_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

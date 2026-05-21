// ═══════════════════════════════════════════════════════════════
// Claves de localStorage + migración desde el esquema legacy
// ═══════════════════════════════════════════════════════════════

export const PROJECTS_KEY   = "anso-projects";
export const ACTIVE_KEY     = "anso-active-project";
export const METADATA_KEY   = "anso-meta";
export const NOTES_KEY      = "antask-notes";
export const TASK_PREFS_KEY = "antask-task-prefs";
export const THEME_KEY      = "mis-tareas-theme";
export const SECTIONS_KEY   = "anso-sections";

const LEGACY_PROJECTS_KEY = "ans0-projects";
const LEGACY_ACTIVE_KEY   = "ans0-active-project";
const LEGACY_METADATA_KEY = "ans0-meta";

// Otros módulos (sections-and-profile.js) consumen THEME_KEY vía window
// como fallback cuando no pueden hacer import.
window.THEME_KEY = THEME_KEY;

/**
 * Si encuentra datos guardados con el esquema antiguo (`ans0-*`) y
 * no hay datos en el nuevo (`anso-*`), los copia para no perder
 * proyectos al renombrar las claves.
 */
export function migrateStorageIfNeeded() {
  try {
    const hasNew = localStorage.getItem(PROJECTS_KEY) != null;
    const hasOld = localStorage.getItem(LEGACY_PROJECTS_KEY) != null;
    if (hasNew || !hasOld) return;

    localStorage.setItem(PROJECTS_KEY, localStorage.getItem(LEGACY_PROJECTS_KEY));

    const legacyActive = localStorage.getItem(LEGACY_ACTIVE_KEY);
    if (legacyActive) localStorage.setItem(ACTIVE_KEY, legacyActive);

    const legacyMeta = localStorage.getItem(LEGACY_METADATA_KEY);
    if (legacyMeta) localStorage.setItem(METADATA_KEY, legacyMeta);
  } catch (_) {
    // ignore
  }
}

// ═══════════════════════════════════════════════════════════════
// Claves de localStorage + migración desde el esquema legacy
// ═══════════════════════════════════════════════════════════════

export const PROJECTS_KEY     = "anso-projects";
export const ACTIVE_KEY       = "anso-active-project";
export const METADATA_KEY     = "anso-meta";
export const TASK_PREFS_KEY   = "antrack-task-prefs";
export const THEME_KEY        = "mis-tareas-theme";
export const SECTIONS_KEY     = "anso-sections";
export const PROFILE_KEY      = "antrack-profile";
export const ROW_STYLE_KEY    = "antrack-row-style";
export const MODE_KEY         = "antrack-mode";
export const HABITS_KEY       = "antrack-habits";

const LEGACY_PROJECTS_KEY = "ans0-projects";
const LEGACY_ACTIVE_KEY   = "ans0-active-project";
const LEGACY_METADATA_KEY = "ans0-meta";

/**
 * Copia las claves del rebrand AnTask → AnTrack.
 *
 * El renombrado de prefijo (`antask-*` → `antrack-*`) dejó los datos
 * existentes huérfanos: la app pasó a leer claves que nunca nadie había
 * escrito. En la mayoría de casos eso solo reinicia preferencias, pero
 * con los HÁBITOS fue destructivo de verdad: el dispositivo arrancaba con
 * la lista vacía y, en la primera sincronización, subía ese vacío a la
 * nube — que a su vez lo propagaba al resto de dispositivos. Las tareas
 * se salvaron de casualidad, porque su clave es `anso-*` y no llevaba el
 * prefijo renombrado.
 *
 * Va a nivel de módulo, no dentro de migrateStorageIfNeeded(), porque
 * esa se llama desde el cuerpo de script.js y hay módulos que leen sus
 * claves al importarse, o sea ANTES. Aquí se ejecuta en cuanto alguien
 * importa este fichero, que es lo primero que pasa.
 *
 * Recorre por prefijo en vez de listar claves para no dejarse las que
 * llevan sufijo variable (`antrack-reminder-<id>`, `antrack-daily-…`) ni
 * las de caché por cuenta (`antrack-habits-<uid>`).
 *
 * NO borra las viejas a propósito: son la única red si algo sale mal, y
 * hoy han sido exactamente eso. Ocupan poco y estorban menos que perder
 * meses de historial.
 */
export function migrateRebrandKeys() {
  try {
    const viejas = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("antask") === 0) viejas.push(k);
    }
    viejas.forEach(function (vieja) {
      // Se conserva el separador, así que cubre `antask-x` y `antask_x`.
      const nueva = "antrack" + vieja.slice("antask".length);
      // Si ya hay algo en la nueva, manda lo nuevo: puede ser trabajo
      // hecho después del rebrand y pisarlo sería el mismo error otra vez.
      if (localStorage.getItem(nueva) !== null) return;
      const valor = localStorage.getItem(vieja);
      if (valor !== null) localStorage.setItem(nueva, valor);
    });
  } catch (_) {
    // localStorage bloqueado o lleno: sin migración, pero sin romper.
  }
}

migrateRebrandKeys();

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

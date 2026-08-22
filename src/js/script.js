// ─── IMPORTS ─────────────────────────────────────────────────
import { t, getLang }                       from "./i18n/index.js";
import { escHtml }                          from "./utils/html.js";
import { capitalizeFirst }                  from "./utils/string.js";
import { getDueDateState, formatDueWeekday } from "./utils/date.js";
import { generateId }                       from "./utils/id.js";
import { parseNaturalLanguage }             from "./utils/nl-parse.js";
import { buildNLChipsHTML, formatDueLabel, formatRecurLabel } from "./utils/nl-chips.js";
import { sanitizeRichHtml }                 from "./utils/sanitize-html.js";
import { safeLsSet, getStorageUsagePct }    from "./utils/storage.js";
import {
  createModalBase,
  closeModal,
  modalHead,
  modalPrompt,
  modalConfirm,
  modalAlert,
} from "./ui/modal.js";
import {
  PROJECTS_KEY,
  ACTIVE_KEY,
  METADATA_KEY,
  TASK_PREFS_KEY,
  THEME_KEY,
  SECTIONS_KEY,
  PROFILE_KEY,
  ROW_STYLE_KEY,
  TWO_COLUMNS_KEY,
  MODE_KEY,
  migrateStorageIfNeeded,
} from "./state/keys.js";
import {
  sanitizeProject,
  sanitizeTasks,
  sanitizeSubtasks,
} from "./state/sanitize.js";
import {
  loadProjects,
  loadSections,
  loadMetadata,
  loadTaskPrefs,
  loadProfile,
} from "./state/persistence.js";
import {
  IMPORTANT_LABEL,
  renderDueBadge,
  renderRecurBadge,
  renderListBadge,
} from "./ui/task-badges.js";
import {
  INBOX_ID,
  projectColor as _projectColor,
  projectColorFromId as _projectColorFromId,
} from "./utils/project-color.js";
import { renderSubtasks } from "./ui/subtasks.js";
import { sheetPick, createSheetBase, closeSheet } from "./ui/sheet.js";
import { showGlobalSearch as _showGlobalSearch } from "./ui/search.js";
import { showQuickCapture, isQuickCaptureOpen } from "./ui/quick-capture.js";
import {
  showProjectTemplatesModal,
  showTemplatePreview,
  buildTasksFromTemplate,
} from "./ui/project-templates.js";
import {
  showOnboarding,
  shouldShowOnboarding,
  markOnboardingDone,
} from "./ui/onboarding.js";
import { hasAnswered as consentAnswered } from "./consent.js";
import {
  initializeTheme,
  toggleThemeWithTransition,
  initializeAccent,
  setAccent,
  ACCENT_KEY,
} from "./ui/theme.js";
import { renderCalendar as _renderCalendarModule } from "./ui/calendar.js";
import { initializeMode, setMode, isSimpleMode, isSimpleMobile } from "./ui/mode.js";

/** Wrapper local que inyecta el estado actual al módulo de calendario. */
function renderCalendar() {
  _renderCalendarModule(calState.year, calState.month, projects, activateProject);
}

// sections-and-profile.js usa window.toggleThemeWithTransition para
// el fallback cuando se pulsa "Cambiar tema" sin View Transition API.
window.toggleThemeWithTransition = toggleThemeWithTransition;
// sections-and-profile.js usa window.setAccent para aplicar y persistir
// el color de acento elegido en Ajustes → Apariencia.
window.setAccent = setAccent;

/**
 * Atajo no-args para la búsqueda global: inyecta los datos y los
 * callbacks que el módulo necesita (que viven en este script).
 * Se llama desde el sidebar, atajo Cmd+K, bottom-nav móvil, etc.
 */
function openGlobalSearch() {
  _showGlobalSearch({
    getProjects:        function() { return projects; },
    onNavigateToTask:   navigateToTask,
  });
}
// Lo expone también vía window porque el inline script de
// index.html (bottom-nav móvil) usa esa referencia global.
window.showGlobalSearch = openGlobalSearch;
// El script inline de index.html (barra inferior/header móvil) necesita
// saber el modo para des-ocultar sus botones — `[hidden] { display: none
// !important }` es global, así que un `hidden=false` en JS es la única
// forma de mostrarlos, un simple override CSS por especificidad no basta.
window.isSimpleMode = isSimpleMode;
window.setMode = setMode;
window.applyRowStyle = applyRowStyle;

/**
 * Abre la captura rápida. Detecta proyecto destino:
 *  - Si hay proyecto activo (no Hoy) → ahí
 *  - Si no → Inbox (fallback)
 */
function openQuickCapture(opts) {
  opts = opts || {};
  showQuickCapture({
    getTarget: function() {
      var current = activeView === "project" ? getActiveProject() : null;
      if (current) return { project: current, isFallback: false };
      var inbox = projects.find(function(p) { return p.id === INBOX_ID; });
      return { project: inbox, isFallback: true };
    },
    getLists: function() {
      var inbox = projects.find(function(p) { return p.id === INBOX_ID; });
      var others = projects.filter(function(p) { return !p.archived && p.id !== INBOX_ID; });
      return inbox ? [inbox].concat(others) : others;
    },
    inboxId: INBOX_ID,
    onCreate: function(targetProject, rawText, overrides) {
      const created = _createTaskInProject(targetProject, rawText, overrides);
      if (!created) return;
      saveProjects();
      if (typeof opts.onTaskCreated === "function") opts.onTaskCreated(created);
      // Desde una vista que no es de proyecto (Hoy/Calendario/smart-list)
      // la tarea va al Inbox; si se pide, redirigir allí para que se vea.
      if (opts.redirectToInbox && activeView !== "project") {
        activateProject(INBOX_ID);
        return;
      }
      renderSidebar();
      // Si la captura es para el proyecto que tenemos abierto, re-pintar tareas.
      if (activeView === "project" && activeProjectId === targetProject.id) {
        renderTasks();
      }
      // Si la captura va al Inbox y estamos en Hoy, refrescar contador Hoy.
      if (activeView === "today") renderTasks();
    },
    onToast: function(msg) { _showQuickToast(msg); },
    onClose: opts.onClose,
  });
}
window.openQuickCapture = openQuickCapture;

/** Toast minimalista que aparece arriba a la derecha durante 1.8s. */
function _showQuickToast(msg) {
  var existing = document.getElementById("quick-toast");
  if (existing) existing.remove();
  var t = document.createElement("div");
  t.id = "quick-toast";
  t.className = "quick-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add("quick-toast-visible"); });
  setTimeout(function() {
    t.classList.remove("quick-toast-visible");
    setTimeout(function() { t.remove(); }, 280);
  }, 1800);
}

// Otros módulos (sections-and-profile.js) acceden a modalAlert vía window.
window.modalAlert = modalAlert;

// ─── ALIASES DE GLOBALES (de otros módulos cargados antes) ───
// setupPasteHandler y setupImageResizer se leen de window porque se
// inicializan en paste-utils.js antes de que este módulo arranque.
// AnsoSync NO se cachea en local: Firebase carga de forma diferida y
// window.AnsoSync puede ser null al arrancar → siempre leer en tiempo
// de ejecución con window.AnsoSync?.method().
var setupPasteHandler = window.setupPasteHandler || null;
var setupImageResizer = window.setupImageResizer || null;

// ─── ELEMENTOS DOM ───────────────────────────────────────────
const projectListEl    = document.getElementById("project-list");
const newProjectBtn    = document.getElementById("new-project-btn");
const ctrlBar          = document.getElementById("ctrl-bar");
const tasksPanel       = document.getElementById("tasks-panel");
const projectTitleEl   = document.getElementById("project-title");
const projectSubtitle  = document.getElementById("project-subtitle");
const projectSubtitleM = document.getElementById("project-subtitle-mobile");

/** Subtítulo de móvil: pendientes, no total (así lo pide el handoff móvil,
 *  frente al «N tareas» del de escritorio). */
function _setMobileSubtitle(pending) {
  if (!projectSubtitleM) return;
  projectSubtitleM.textContent = pending + " pendiente" + (pending === 1 ? "" : "s");
}
const deleteProjectBtn = document.getElementById("delete-project-btn");
const taskForm         = document.getElementById("task-form");
const taskInput        = document.getElementById("task-input");
const taskList         = document.getElementById("task-list");

// ─── MOBILE FAB REFS ─────────────────────────────────────────
const mobileFab    = document.getElementById("mobile-fab");
const taskCounter      = document.getElementById("task-counter");
const saveStatus       = document.getElementById("save-status");
const clearDoneBtn     = document.getElementById("clear-done");
const exportBtn        = document.getElementById("export-btn");
const importFile       = document.getElementById("import-file");
const filterButtons    = document.querySelectorAll("[data-filter]");
const template         = document.getElementById("task-item-template");

// ─── ESTADO ──────────────────────────────────────────────────
migrateStorageIfNeeded();

// El proyecto especial "Inbox" —siempre existe, fijo al tope de la sidebar—
// se importa de utils/project-color.js, que también lo necesita para darle
// el acento del tema en vez de un color hasheado.

let projects        = loadProjects();
let sections        = loadSections();

// Las notas se retiraron: borra de una vez su clave para no dejar datos
// huérfanos ocupando la cuota de localStorage.
try { localStorage.removeItem("antask-notes"); } catch (_) {}
// Las recurrentes completadas se quedan marcadas hasta que llega su
// siguiente vuelta; al arrancar se comprueba si ya toca reabrirlas.
if (_reactivarRecurrentes()) saveProjects();
_checkStorageWarning();

// Asegura que el proyecto Inbox existe (sólo la primera vez).
ensureInbox();

// Si no hay nada activo arrancamos directos en el Inbox (sin pantalla de
// bienvenida) para que el usuario escriba ya.
let activeProjectId = localStorage.getItem(ACTIVE_KEY) || INBOX_ID;
// Vista activa: "project" (default) | "today" (vista Hoy virtual).
let activeView      = "project";

/* Se exponen AQUÍ y no junto al resto de globales, mucho más abajo: el
   arranque activa la vista en cuanto se evalúa este módulo, y esa activación
   llama a syncBnavActive(), que lee estas dos. Declaradas al final todavía
   valían `undefined` en ese momento, así que la barra inferior arrancaba sin
   ninguna pestaña marcada hasta que el usuario navegaba a mano. */
window.getActiveView = function() { return activeView; };
window.getActiveProjectId = function() { return activeProjectId; };

function ensureInbox() {
  if (projects.some(function(p) { return p.id === INBOX_ID; })) return;
  projects.unshift(sanitizeProject({
    id:        INBOX_ID,
    name:      "Inbox",
    icon:      "📥",
    color:     "",
    createdAt: new Date().toISOString(),
    tasks:     [],
  }));
  // Persistir directamente — saveProjects() todavía no está disponible
  // (es una function declaration y JS las hoista, pero el resto de
  // dependencias como AnsoSync sí podrían no estar). Mejor inline:
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); } catch (_) {}
}

let currentFilter      = "all";

// ─── Estado leído durante el ARRANQUE ─────────────────────────
// El bloque de arranque de más abajo pinta la primera vista mientras el
// módulo aún se está evaluando, así que todo lo que ese render lea tiene
// que estar declarado ANTES. Si se declara más abajo, un `const` da
// ReferenceError por TDZ y un `var` se lee como undefined.
var _sidebarPrevCounts = {};
// ─── PANEL DE DETALLE DE TAREA (columna derecha) ──────────────
let openDetailTaskId    = null;
let openDetailProjectId = null;
let dragSrcId          = null;
let dropIndicator      = null;
let dragSrcProjectId   = null;
let projectDropIndicator = null;

// ─── UNDO ESTADO ─────────────────────────────────────────────
let _undoStack = null;  // { projectId, task, index } | { projectId, tasks, indices }
let _undoTimer = null;

// ─── ARCHIVO DE PROYECTOS ─────────────────────────────────────
let _archivedExpanded  = false;
let taskPrefs         = loadTaskPrefs();
let userProfile       = loadProfile();

// ─── MULTI-SELECT ─────────────────────────────────────────────
let selectMode = false;
const selectedTaskIds = new Set();
const bulkActionBar  = document.getElementById("bulk-action-bar");
const bulkCount      = document.getElementById("bulk-count");
const selectModeBtn  = document.getElementById("select-mode-btn");

// ═══════════════════════════════════════════════════════════════
// ESTILO DE FILA (Limpio · Líneas · Tarjetas · Compacto) — como en v1.
// El estilo elegido se refleja como atributo data-row-style en #task-list
// y sólo cambia el aspecto de las filas (puro CSS). Se persiste aparte.
// ═══════════════════════════════════════════════════════════════
const ROW_STYLES        = ["limpio", "tarjetas"];
const DEFAULT_ROW_STYLE = "tarjetas";
const ROW_STYLE_ICON    = { limpio: "list", tarjetas: "rows-3" };
let currentRowStyle = (function() {
  try { const v = localStorage.getItem(ROW_STYLE_KEY); return ROW_STYLES.indexOf(v) !== -1 ? v : DEFAULT_ROW_STYLE; }
  catch (e) { return DEFAULT_ROW_STYLE; }
})();

/**
 * Estilo que se pinta de verdad. Antes en móvil se forzaba siempre a
 * "limpio" —el selector del header vivía oculto ahí (ver
 * `.row-style-wrap` en style.css)— pero ahora el mismo control existe
 * en Ajustes › Apariencia (ver sections-and-profile.js), así que móvil
 * respeta la preferencia real igual que escritorio.
 */
function _rowStyleEfectivo() {
  return currentRowStyle;
}

function applyRowStyle(style, persist) {
  if (ROW_STYLES.indexOf(style) === -1) style = DEFAULT_ROW_STYLE;
  currentRowStyle = style;
  if (taskList) taskList.dataset.rowStyle = _rowStyleEfectivo();
  if (persist !== false) { try { localStorage.setItem(ROW_STYLE_KEY, style); } catch (e) {} }
  _syncRowStylePicker();
}

function _syncRowStylePicker() {
  const btn = document.getElementById("row-style-btn");
  if (btn) {
    // La etiqueta solo se ve en móvil, donde el control es una píldora
    // «☰ Limpio ⌄» junto a «Filtrar»; en escritorio el CSS la oculta y queda
    // el icono suelto de siempre.
    btn.innerHTML =
      '<i data-lucide="' + (ROW_STYLE_ICON[currentRowStyle] || "list") + '"></i>' +
      '<span class="row-style-label">' + escHtml(t("rowstyle." + currentRowStyle)) + "</span>" +
      '<i data-lucide="chevron-down" class="row-style-caret"></i>';
    if (window.lucide) lucide.createIcons({ nodes: [btn] });
  }
  const panel = document.getElementById("row-style-panel");
  if (panel) {
    panel.querySelectorAll("[data-row-style]").forEach(function(b) {
      const on = b.dataset.rowStyle === currentRowStyle;
      b.classList.toggle("row-style-opt--active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// DOS COLUMNAS — toggle independiente del estilo de fila (combina con
// cualquiera de ellos). Solo tiene efecto en escritorio: en móvil el
// botón está oculto por CSS y aquí simplemente no se escribe el atributo.
// ═══════════════════════════════════════════════════════════════
let twoColumnsOn = (function() {
  try { return localStorage.getItem(TWO_COLUMNS_KEY) === "1"; }
  catch (e) { return false; }
})();

function applyTwoColumns(on, persist) {
  twoColumnsOn = !!on;
  const efectivo = twoColumnsOn && !window.matchMedia("(max-width: 768px)").matches;
  if (taskList) {
    if (efectivo) taskList.dataset.columns = "2";
    else delete taskList.dataset.columns;
  }
  if (persist !== false) { try { localStorage.setItem(TWO_COLUMNS_KEY, twoColumnsOn ? "1" : "0"); } catch (e) {} }
  // El check de "Dos columnas" en #task-prefs-panel (no un aria-pressed
  // propio: es una opción más del checklist, ver _syncTaskPrefsPanel).
  _syncTaskPrefsPanel();
}

/* Predicados de los filtros, en tabla y no en una cadena de `if`: con ocho
   casos la cadena se vuelve ilegible y hay que tocarla en tres sitios para
   añadir uno. «all» no aparece a propósito —ausencia significa no filtrar—,
   así que un valor desconocido se comporta como «todas» en vez de vaciar la
   lista. Los cinco últimos vienen del handoff móvil v1. */
const TASK_FILTERS = {
  pending: function(t) { return !t.done; },
  done:    function(t) { return t.done; },
  overdue: function(t) { return !t.done && !!t.dueDate && t.dueDate < _localDateISO(new Date()); },
  today:   function(t) { return t.dueDate === _localDateISO(new Date()); },
  nodate:  function(t) { return !t.dueDate; },
  high:    function(t) { return t.priority === "high"; },
};

// En escritorio: cursor listo en "nueva tarea" al abrir.
if (taskInput && !matchMedia("(hover: none)").matches) {
  setTimeout(function () { try { taskInput.focus(); } catch (e) {} }, 650);
}

// Recordatorios por tarea — programar timers cuando AnsoNotif ya esté
// inicializado (lo hace sections-and-profile.js, que se carga después).
setTimeout(function () {
  if (window.AnsoNotif && window.AnsoNotif.scheduleTaskReminders) {
    window.AnsoNotif.scheduleTaskReminders(projects);
  }
}, 800);

// Al dispararse un recordatorio, notifications.js ya ha limpiado
// `task.reminderAt` en memoria (mismo objeto que `projects`, por
// referencia) — falta guardarlo y quitar la campana de la fila.
window.addEventListener("antask:reminderfired", function () {
  saveAndRender();
});

// ─── OCULTAR PANTALLA DE CARGA ───────────────────────────────
// Se desvanece en cuanto la app ha pintado el primer frame real.
(function() {
  var splash = document.getElementById("splash");
  if (!splash) return;
  var removed = false;
  function removeSplash() {
    if (removed || !splash.parentNode) return;
    removed = true;
    splash.remove();
  }
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      if (!splash.parentNode) return;
      splash.classList.add("splash-done");
      splash.addEventListener("transitionend", removeSplash, { once: true });
      setTimeout(removeSplash, 500);
    });
  });
})();

// ─── ONBOARDING (primera ejecución) ──────────────────────────
// Solo se muestra si nunca se ha visto Y no hay datos previos
// (un usuario con tareas/proyectos ya creados no es "nuevo").
(function () {
  if (!shouldShowOnboarding()) return;

  var hasContent = projects.some(function (p) {
    return p.id !== INBOX_ID && Array.isArray(p.tasks) && p.tasks.length > 0;
  });

  if (hasContent) {
    // Usuario existente — marcamos como visto en silencio.
    markOnboardingDone();
    return;
  }

  // Pequeño delay para que el splash termine de desvanecerse.
  function launch() { setTimeout(function () { showOnboarding(); }, 700); }

  // No solapar con el banner de cookies: si aún no se ha respondido,
  // esperamos a que el usuario decida antes de lanzar el onboarding.
  if (consentAnswered()) {
    launch();
  } else {
    document.addEventListener("antask:consent-decided", launch, { once: true });
  }
})();

/** Re-disparable desde el menú de perfil. */
window.showOnboardingAgain = function () { showOnboarding(); };

// ─── CLOUD SYNC INIT ─────────────────────────────────────────
// Firebase carga de forma diferida (dynamic import en main.js).
// Registramos los callbacks aquí para que firebase-sync.js los recoja
// cuando termine de cargar y llame a window.AnsoSync.init() automáticamente.
window._ansoSyncCallbacks = {
  onRemoteChange:  _syncOnRemoteChange,
  onAuthChange:    _syncOnAuthChange,
  onFirstConnect:  _syncOnFirstConnect,
};

// ─── BÚSQUEDA GLOBAL ─────────────────────────────────────────
const globalSearchBtn = document.getElementById("global-search-btn");
if (globalSearchBtn) {
  globalSearchBtn.addEventListener("click", function() { openGlobalSearch(); });
}

const shortcutsBtn = document.getElementById("shortcuts-btn");
if (shortcutsBtn) {
  shortcutsBtn.addEventListener("click", function() { showShortcutsHelp(); });
}

// ─── ACCIÓN EN MASA — LISTENERS ──────────────────────────────
if (selectModeBtn) selectModeBtn.addEventListener("click", toggleSelectMode);

var _closePanelBtn = document.getElementById("close-panel-btn");
if (_closePanelBtn) _closePanelBtn.addEventListener("click", function() { activateProject(null); });

var _bulkDoneBtn   = document.getElementById("bulk-done-btn");
var _bulkPendingBtn= document.getElementById("bulk-pending-btn");
var _bulkMoveBtn   = document.getElementById("bulk-move-btn");
var _bulkDeleteBtn = document.getElementById("bulk-delete-btn");
var _bulkCancelBtn = document.getElementById("bulk-cancel-btn");
if (_bulkDoneBtn)    _bulkDoneBtn.addEventListener("click",    bulkMarkDone);
if (_bulkPendingBtn) _bulkPendingBtn.addEventListener("click", bulkMarkPending);
if (_bulkMoveBtn)    _bulkMoveBtn.addEventListener("click",    bulkMoveToProject);
if (_bulkDeleteBtn)  _bulkDeleteBtn.addEventListener("click",  bulkDelete);
if (_bulkCancelBtn)  _bulkCancelBtn.addEventListener("click",  exitSelectMode);

// ─── ATAJOS DE TECLADO GLOBALES ───────────────────────────────
document.addEventListener("keydown", function(e) {
  const tag = document.activeElement && document.activeElement.tagName;
  const isEditing = tag === "INPUT" || tag === "TEXTAREA" ||
    (document.activeElement && document.activeElement.isContentEditable);

  // Captura rápida global — funciona incluso si estás escribiendo.
  // Ctrl/Cmd + Shift + Espacio
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.code === "Space" || e.key === " ")) {
    e.preventDefault();
    if (!isQuickCaptureOpen()) openQuickCapture();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openGlobalSearch();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === ",") {
    e.preventDefault();
    if (typeof window.openSettingsModal === "function") window.openSettingsModal();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    var _sb = document.querySelector(".sidebar");
    if (_sb) _sb.classList.toggle("sidebar-collapsed");
    var _mp = document.getElementById("main-panel");
    if (_mp) _mp.classList.toggle("sidebar-is-collapsed", _sb && _sb.classList.contains("sidebar-collapsed"));
    var _collapsed = _sb && _sb.classList.contains("sidebar-collapsed");
    localStorage.setItem("anso-sidebar-collapsed", _collapsed ? "1" : "0");
    return;
  }

  if (e.key === "Escape" && selectMode) {
    exitSelectMode();
    return;
  }

  if (isEditing) return;

  if (e.key === "?") {
    e.preventDefault();
    showShortcutsHelp();
    return;
  }

});

// ═══════════════════════════════════════════════════════════════
// PICKERS / MODALES CON ESTADO DE LA APP
// (los modales genéricos viven en ./ui/modal.js)
// ═══════════════════════════════════════════════════════════════

/* Paleta cerrada de colores de lista, compartida por el selector de
   "Cambiar color" y por la hoja móvil de "Nueva lista". */
var LIST_COLORS = [
  { key: "color.red",      hex: "#ef4444" },
  { key: "color.orange",   hex: "#f97316" },
  { key: "color.amber",    hex: "#f59e0b" },
  { key: "color.gold",     hex: "#d97706" },
  { key: "color.lime",     hex: "#84cc16" },
  { key: "color.green",    hex: "#22c55e" },
  { key: "color.emerald",  hex: "#10b981" },
  { key: "color.cyan",     hex: "#06b6d4" },
  { key: "color.blue",     hex: "#3b82f6" },
  { key: "color.indigo",   hex: "#6d7ab0" },
  { key: "color.violet",   hex: "#8a6fb0" },
  { key: "color.purple",   hex: "#a855f7" },
  { key: "color.pink",     hex: "#ec4899" },
  { key: "color.brown",    hex: "#78716c" },
  { key: "color.gray",     hex: "#64748b" },
  { key: "color.silver",   hex: "#94a3b8" },
];

function showColorPicker(project) {
  var { overlay, box } = createModalBase();
  var colors = LIST_COLORS;

  var swatchesHtml = colors.map(function(c) {
    return '<button type="button" class="color-picker-swatch' +
      (project.color === c.hex ? " color-picker-swatch--active" : "") +
      '" data-color="' + c.hex + '" title="' + escHtml(t(c.key)) +
      '" style="background:' + c.hex + '"></button>';
  }).join("");

  box.classList.add("modal-box-v1");
  box.innerHTML =
    modalHead(t("project.color_picker_title"), "palette") +
    '<div class="modal-body"><div class="color-picker-grid">' + swatchesHtml + "</div></div>" +
    '<div class="modal-foot">' +
      (project.color ? '<button type="button" class="modal-btn modal-btn-cancel color-picker-clear">' + t("project.color_clear") + '</button>' : "") +
      '<button type="button" class="modal-btn modal-btn-cancel">' + t("modal.cancel") + '</button>' +
    "</div>";

  if (window.lucide) lucide.createIcons({ nodes: [box] });

  function apply(color) {
    project.color = color;
    saveProjects();
    renderSidebar();
    renderTasks(); // refresca el acento (barra izq. + check) al instante
    closeModal(overlay);
  }

  overlay._cancel = function() { closeModal(overlay); };
  box.querySelector(".modal-btn-cancel:last-child").addEventListener("click", function() { closeModal(overlay); });
  box.querySelector(".modal-head-close").addEventListener("click", function() { closeModal(overlay); });

  var clearBtn = box.querySelector(".color-picker-clear");
  if (clearBtn) clearBtn.addEventListener("click", function() { apply(""); });

  box.querySelectorAll(".color-picker-swatch").forEach(function(btn) {
    btn.addEventListener("click", function() { apply(btn.dataset.color); });
  });

  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") { closeModal(overlay); document.removeEventListener("keydown", handler); }
  });
}

/**
 * Hoja móvil "Nueva lista": nombre + color, al estilo del handoff móvil
 * (design_handoff_antask_movil/referencia/settings.jsx no cubre esto, pero
 * el patrón nombre+color+crear es el mismo "Nueva/editar lista" de las hojas
 * modales descrito en su README). Sin selector de icono: no es un dato que
 * guardemos hoy, así que se descarta esa fila del prototipo.
 *
 * Sustituye al `modalPrompt` genérico solo en móvil — ahí crear una lista
 * es la vía principal desde el chip "+" del Inbox y "Perfil", no un caso de
 * borde de escritorio con plantillas.
 *
 * @returns {Promise<{name: string, color: string}|null>}
 */
function showNewListSheet() {
  return new Promise(function(resolve) {
    const { overlay, sheet } = createSheetBase();

    const swatchesHtml = LIST_COLORS.map(function(c, i) {
      return '<button type="button" class="color-picker-swatch' + (i === 0 ? " color-picker-swatch--active" : "") +
        '" data-color="' + c.hex + '" title="' + escHtml(t(c.key)) +
        '" style="background:' + c.hex + '"></button>';
    }).join("");
    let selected = LIST_COLORS[0].hex;

    sheet.insertAdjacentHTML("beforeend",
      '<p class="modal-sheet-title">' + escHtml(t("sheet.new_list.title")) + '</p>' +
      '<div class="modal-sheet-body">' +
        '<input type="text" class="modal-input new-list-sheet-input" maxlength="60" placeholder="' +
          escHtml(t("project.new_prompt")) + '">' +
        '<p class="modal-sheet-heading">' + escHtml(t("sheet.new_list.color")) + '</p>' +
        '<div class="color-picker-grid">' + swatchesHtml + '</div>' +
        '<div class="modal-actions">' +
          '<button type="button" class="modal-btn modal-btn-cancel">' + escHtml(t("modal.cancel")) + '</button>' +
          '<button type="button" class="modal-btn modal-btn-confirm" disabled>' + escHtml(t("sheet.new_list.confirm")) + '</button>' +
        '</div>' +
      '</div>'
    );

    const input   = sheet.querySelector(".new-list-sheet-input");
    const confirm = sheet.querySelector(".modal-btn-confirm");
    const cancel  = sheet.querySelector(".modal-btn-cancel");

    input.addEventListener("input", function() { confirm.disabled = !input.value.trim(); });

    sheet.querySelectorAll(".color-picker-swatch").forEach(function(btn) {
      btn.addEventListener("click", function() {
        selected = btn.dataset.color;
        sheet.querySelectorAll(".color-picker-swatch").forEach(function(b) {
          b.classList.toggle("color-picker-swatch--active", b === btn);
        });
      });
    });

    let settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      closeSheet(overlay);
      resolve(value);
    }

    overlay._cancel = function() { finish(null); };
    cancel.addEventListener("click", function() { finish(null); });
    confirm.addEventListener("click", function() {
      const name = input.value.trim();
      if (!name) return;
      finish({ name: name, color: selected });
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && input.value.trim()) { e.preventDefault(); confirm.click(); }
    });

    setTimeout(function() { input.focus(); }, 50);
  });
}

/**
 * Modal para seleccionar un proyecto de destino
 * @param {string} excludeProjectId — ID del proyecto actual (excluirlo de la lista)
 * @returns {Promise<string|null>} — ID del proyecto elegido o null si cancela
 */
function modalProjectPicker(excludeProjectId) {
  return new Promise(function(resolve) {
    var available = projects.filter(function(p) { return p.id !== excludeProjectId; });
    if (available.length === 0) {
      modalAlert(t("task.no_other_projects"), "info");
      resolve(null);
      return;
    }
    var { overlay, box } = createModalBase();
    var listHtml = available.map(function(p) {
      var done  = p.tasks.filter(function(t) { return t.done; }).length;
      var total = p.tasks.length;
      return '<button type="button" class="modal-project-item" data-id="' + p.id + '">' +
        '<span class="modal-project-name">' + escHtml(p.name) + '</span>' +
        '<span class="modal-project-count">' + done + '/' + total + '</span>' +
        '</button>';
    }).join('');
    box.innerHTML =
      '<p class="modal-label">Mover a proyecto</p>' +
      '<div class="modal-project-list">' + listHtml + '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="modal-btn modal-btn-cancel">Cancelar</button>' +
      '</div>';
    function doCancel() { closeModal(overlay); resolve(null); }
    overlay._cancel = doCancel;
    box.querySelector('.modal-btn-cancel').addEventListener('click', doCancel);
    box.querySelectorAll('.modal-project-item').forEach(function(btn) {
      btn.addEventListener('click', function() {
        closeModal(overlay);
        resolve(btn.dataset.id);
      });
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { doCancel(); document.removeEventListener('keydown', handler); }
    });
    setTimeout(function() {
      var first = box.querySelector('.modal-project-item');
      if (first) first.focus();
    }, 50);
  });
}

// Tema vive en ./ui/theme.js (export window arriba)

// ─── NUEVO PROYECTO ──────────────────────────────────────────
/** Crea un proyecto con un nombre dado y una lista opcional de specs de tareas. */
function _createProjectWithTasks(name, taskSpecs, opts) {
  const project = {
    id: generateId(),
    name: capitalizeFirst((name || "").trim()).slice(0, 60),
    icon:  (opts && opts.icon)  || "",
    color: (opts && opts.color) || "",
    sectionId: null,
    createdAt: new Date().toISOString(),
    tasks: (taskSpecs || []).map(function (spec) {
      return {
        id:         generateId(),
        text:       (spec.text || "").slice(0, 120),
        comment:    "",
        done:       false,
        priority:   spec.priority || null,
        dueDate:    spec.dueDate || null,
        recurDays:  spec.recurDays || null,
        reminderAt: null,
        timeLogged: 0,
        subtasks:   [],
      };
    }),
  };
  projects.push(project);
  saveProjects();
  renderSidebar();
  activateProject(project.id);
}

/* Extraído del handler del botón del drawer para que la pantalla «Perfil»
   pueda lanzarlo sin pulsar por código un botón que vive en otra pantalla.
   En móvil no hay galería de plantillas: crear una lista va directo a la
   hoja de nombre + color (handoff móvil) — la galería es un paso de más
   para el caso de uso principal en touch, y tapaba el cambio (el primer
   tap seguía cayendo en la misma pantalla de siempre). Las plantillas
   siguen disponibles en escritorio, donde había sitio para ese paso. */
function startNewProject() {
  if (window.matchMedia("(max-width: 768px)").matches) {
    (async function () {
      const picked = await showNewListSheet();
      if (!picked) return;
      _createProjectWithTasks(picked.name, [], { color: picked.color });
    })();
    return;
  }
  showProjectTemplatesModal({
    onPickBlank: async function () {
      const name = await modalPrompt(t("project.new_prompt"), "", t("project.new_placeholder"));
      if (!name) return;
      _createProjectWithTasks(name, []);
    },
    onPickTemplate: async function (template) {
      const name = await showTemplatePreview(template);
      if (!name) return;
      _createProjectWithTasks(name, buildTasksFromTemplate(template), {
        icon:  template.icon,
        color: template.color || "",
      });
    },
  });
}
newProjectBtn.addEventListener("click", function() { startNewProject(); });

// ─── ELIMINAR PROYECTO ───────────────────────────────────────
if (deleteProjectBtn) deleteProjectBtn.addEventListener("click", async function() {
  const project = getActiveProject();
  if (!project) return;
  const confirmed = await modalConfirm(
    t("project.confirm_delete").replace("{name}", escHtml(project.name)),
    t("modal.delete")
  );
  if (!confirmed) return;
  projects = projects.filter(function(p) { return p.id !== project.id; });
  saveProjects();
  activeProjectId = null;
  localStorage.removeItem(ACTIVE_KEY);
  renderSidebar();
  activateProject(null);
});

// ─── ELIMINAR TODO (Ajustes → Datos) ─────────────────────────
// Vacía el workspace entero: todas las listas, todas las tareas, todos
// los grupos. Confirmación reforzada porque no hay deshacer — a
// diferencia de borrar una tarea o una lista, no queda ningún registro
// del que recuperarse salvo un backup exportado a mano.
var deleteAllBtn = document.getElementById("settings-delete-all-btn");
if (deleteAllBtn) deleteAllBtn.addEventListener("click", async function() {
  const confirmed = await modalConfirm(
    t("settings.data.delete_all_confirm"),
    t("modal.delete")
  );
  if (!confirmed) return;
  projects = [];
  sections = [];
  // Sin esto el Inbox desaparecía de la sidebar: no es un elemento
  // virtual, es un proyecto real con `id: INBOX_ID` que normalmente crea
  // el arranque la primera vez. "Eliminar todo" debe dejar un workspace
  // limpio y usable, no una sidebar vacía sin ni Inbox.
  ensureInbox();
  saveProjects();
  saveSections();
  activeProjectId = null;
  localStorage.removeItem(ACTIVE_KEY);
  if (typeof window.closeSettingsModal === "function") window.closeSettingsModal();
  renderSidebar();
  activateProject(null);
});

// ─── FORMULARIO DE TAREA ─────────────────────────────────────

// ─── PREVIEW DE LENGUAJE NATURAL (chips bajo el task-input) ───
// Se pinta como un pequeño contenedor inyectado debajo del input
// principal. Lo gestionamos perezosamente: se crea cuando aparece
// el primer token detectado y se oculta cuando no hay nada que mostrar.
let _nlPreviewEl = null;
function _ensureNLPreview() {
  if (_nlPreviewEl) return _nlPreviewEl;
  if (!taskForm) return null;
  _nlPreviewEl = document.createElement("div");
  _nlPreviewEl.id = "nl-preview";
  _nlPreviewEl.className = "nl-preview";
  _nlPreviewEl.hidden = true;
  taskForm.insertAdjacentElement("afterend", _nlPreviewEl);
  return _nlPreviewEl;
}

// _formatDueLabel y _formatRecurLabel viven en ./utils/nl-chips.js

function _renderNLPreview(rawText) {
  const el = _ensureNLPreview();
  if (!el) return;

  // Si el input está vacío, ocultar.
  if (!rawText || !rawText.trim()) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  const p = parseNaturalLanguage(rawText);
  // En modo simple no se reconoce prioridad por texto ("p1"): la tarea
  // se queda solo con fecha/repetición, así que tampoco se previsualiza.
  const chips = buildNLChipsHTML(isSimpleMobile() ? { dueDate: p.dueDate, recurDays: p.recurDays } : p);

  if (chips.length === 0) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  el.hidden = false;
  el.innerHTML =
    '<span class="nl-preview-arrow">↳</span>' +
    chips.join("") +
    (p.text ? '<span class="nl-preview-rest">' + escHtml(p.text) + '</span>' : "");

  if (window.lucide) window.lucide.createIcons({ nodes: [el] });
}

if (taskInput) {
  taskInput.addEventListener("input", function() { _renderNLPreview(taskInput.value); });
  taskInput.addEventListener("blur",  function() {
    // Ocultar al perder foco si no hay tokens
    setTimeout(function() {
      if (_nlPreviewEl && _nlPreviewEl.hidden === false && !taskInput.value.trim()) {
        _nlPreviewEl.hidden = true;
        _nlPreviewEl.innerHTML = "";
      }
    }, 120);
  });
}

/**
 * Crea una tarea aplicando parseo de lenguaje natural sobre el
 * texto bruto. NO persiste ni re-renderiza — eso lo decide el caller.
 */
function _createTaskInProject(project, rawText, overrides) {
  overrides = overrides || {};
  const parsed = parseNaturalLanguage(rawText);
  const text = capitalizeFirst(parsed.text).slice(0, 120);
  if (!text) return null;

  // En modo simple no se reconoce prioridad por texto ("p1") — solo
  // fecha/repetición. Un `overrides.priority` explícito (p.ej. desde el
  // detalle en modo completo) sigue respetándose.
  const nlPriority = isSimpleMobile() ? null : parsed.priority;

  const task = {
    id:         generateId(),
    text:       text,
    comment:    "",
    done:       false,
    priority:   overrides.priority || nlPriority || null,
    dueDate:    overrides.dueDate || parsed.dueDate || null,
    recurDays:  overrides.recurDays || parsed.recurDays || null,
    reminderAt: null,
    timeLogged: 0,
    subtasks:   [],
  };
  project.tasks.unshift(task);
  return task;
}

taskForm.addEventListener("submit", function(event) {
  event.preventDefault();
  // Fallback: si no hay proyecto activo (ej. usuario sale del último proyecto)
  // mandamos la tarea al Inbox automáticamente.
  let project = getActiveProject();
  if (!project) {
    project = projects.find(function(p) { return p.id === INBOX_ID; });
    if (!project) return;
  }
  const created = _createTaskInProject(project, taskInput.value);
  if (!created) return;
  taskInput.value = "";
  _renderNLPreview();
  saveAndRender();
});

// ─── MOBILE FAB ──────────────────────────────────────────────
// El FAB abre la MISMA captura rápida que el atajo de escritorio
// (preview de chips + chuleta de lenguaje natural). En vistas que no
// son de proyecto, la tarea va al Inbox y redirige allí.
//
// Antes abría un bottom-sheet propio (#fab-sheet, con su formulario y
// su backdrop). Al pasar a la captura rápida nadie volvió a llamar a
// `openFabSheet`, así que el panel ya no podía abrirse: se ha retirado
// junto con su markup y su CSS.
if (mobileFab) {
  mobileFab.addEventListener("click", function() {
    openQuickCapture({ redirectToInbox: true });
  });
}

// Barra de captura flotante de escritorio → misma captura rápida del atajo
var captureBar = document.getElementById("capture-bar");
if (captureBar) {
  captureBar.addEventListener("click", function() {
    openQuickCapture({ redirectToInbox: activeView !== "project" });
  });
}

// ─── LIMPIAR HECHAS ──────────────────────────────────────────
clearDoneBtn.addEventListener("click", function() {
  const project = getActiveProject();
  if (!project) return;
  project.tasks = project.tasks.filter(function(t) { return !t.done; });
  saveAndRender();
});

// ─── EXPORTAR (workspace completo) ───────────────────────────
exportBtn.addEventListener("click", function() {
  // Las listas archivadas se quedan fuera: al restaurar el backup volvían
  // a aparecer, y archivarlas es precisamente decir que ya no se quieren
  // a la vista. Siguen guardadas en este dispositivo, solo no viajan.
  const exportables = projects.filter(function(p) { return !p.archived; });
  if (exportables.length === 0) {
    modalAlert(t("task.nothing_to_export"), "info");
    return;
  }
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    projects: exportables,
    sections: sections,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = _localDateISO(new Date());
  link.download = "ansotask-workspace-" + dateStr + ".json";
  link.click();
  URL.revokeObjectURL(url);
});

// ─── IMPORTAR ────────────────────────────────────────────────
importFile.addEventListener("change", async function() {
  const file = importFile.files && importFile.files[0];
  if (!file) return;
  try {
    const content = await file.text();
    const parsed = JSON.parse(content);

    // ── Backup de workspace completo (version 2) ──
    if (parsed.version === 2 && Array.isArray(parsed.projects)) {
      const confirmed = await modalConfirm(
        t("backup.restore_confirm"),
        t("backup.restore_title")
      );
      if (!confirmed) return;
      projects = parsed.projects.map(sanitizeProject);
      if (Array.isArray(parsed.sections)) {
        sections = parsed.sections.filter(function(s) {
          return s && typeof s.id === "string" && typeof s.name === "string";
        }).map(function(s) {
          return { id: s.id, name: s.name, collapsed: !!s.collapsed };
        });
        saveSections();
      }
      // Los backups antiguos traen `standaloneNotes`: se ignoran sin fallar.
      activeProjectId = projects.length > 0 ? projects[0].id : null;
      if (activeProjectId) localStorage.setItem(ACTIVE_KEY, activeProjectId);
      else localStorage.removeItem(ACTIVE_KEY);
      saveProjects();
      renderSidebar();
      activateProject(activeProjectId);
      var secCount = Array.isArray(parsed.sections) ? parsed.sections.length : 0;
      var restoredMsg;
      if (secCount > 0) {
        restoredMsg = t("backup.restored_with_secs")
          .replace("{count}", String(projects.length))
          .replace("{sec}", String(secCount));
      } else {
        restoredMsg = (projects.length === 1 ? t("backup.restored_one") : t("backup.restored_other"))
          .replace("{count}", String(projects.length));
      }
      await modalAlert(restoredMsg, "info");
      return;
    }

    // ── Backup antiguo de un solo proyecto ──
    const currentProject = getActiveProject();
    const importedTasks = Array.isArray(parsed) ? parsed : parsed.tasks;
    if (!Array.isArray(importedTasks)) {
      await modalAlert(t("backup.invalid_format"), "error");
      return;
    }
    if (!currentProject) {
      await modalAlert(t("backup.need_active"), "error");
      return;
    }
    currentProject.tasks = sanitizeTasks(importedTasks);
    saveAndRender();
  } catch(e) {
    await modalAlert(t("backup.parse_error"), "error");
  } finally {
    importFile.value = "";
  }
});

/**
 * Pantalla «Perfil» (menú) del handoff móvil v1: grupos de filas sobre
 * tarjeta, cada una con su cuadro de color, etiqueta, contador y chevron.
 *
 * Sustituye a la cadena que había —abrir el drawer y, 300 ms después,
 * pulsar por código el botón de perfil de dentro—, que dependía de que la
 * animación hubiera terminado.
 *
 * El nombre, el avatar y el estado de cuenta se leen del DOM que
 * `_updateProfileMenu()` ya mantiene al día, en vez de recalcularlos: así
 * esta pantalla no duplica nada de la lógica de sesión.
 */
function showProfileMenu() {
  const { overlay, sheet } = createSheetBase();
  const txt = function(id, fallback) {
    const el = document.getElementById(id);
    return el && el.textContent.trim() ? el.textContent.trim() : fallback;
  };
  const signedIn = (function() {
    const u = document.getElementById("pf-sync-user");
    return !!(u && !u.hidden);
  })();

  // `edit` añade el lápiz de 44px que el handoff pide en las listas del
  // usuario. Va FUERA del botón de la fila —no se pueden anidar botones— así
  // que la fila se envuelve y el lápiz queda como hermano.
  const fila = function(attrs, color, icon, label, count, edit) {
    const btn = '<button type="button" class="pmenu-row" ' + attrs + ">" +
      '<span class="pmenu-row-ico' + (color ? " pmenu-row-ico--color" : "") + '"' +
        (color ? ' style="background:' + escHtml(color) + '"' : "") + ">" +
        '<i data-lucide="' + icon + '"></i>' +
      "</span>" +
      '<span class="pmenu-row-label">' + escHtml(label) + "</span>" +
      (count != null ? '<span class="pmenu-row-count">' + count + "</span>" : "") +
      (edit ? "" : '<i data-lucide="chevron-right" class="pmenu-row-chev"></i>') +
    "</button>";
    if (!edit) return btn;
    return '<span class="pmenu-rowwrap">' + btn +
      '<button type="button" class="pmenu-edit" data-edit="' + escHtml(edit) + '"' +
        ' aria-label="' + escHtml(t("project.rename")) + '"><i data-lucide="pencil-line"></i></button>' +
    "</span>";
  };

  const lists = projects.filter(function(p) { return p.id !== INBOX_ID; });
  let html =
    '<div class="pmenu-head">' +
      '<span class="pmenu-avatar">' + escHtml(txt("profile-avatar", "A")) + "</span>" +
      "<span class='pmenu-id'>" +
        '<span class="pmenu-name">' + escHtml(txt("profile-name", "")) + "</span>" +
        '<span class="pmenu-sub">' + escHtml(txt("profile-sub", "")) + "</span>" +
      "</span>" +
      '<button type="button" class="pmenu-close" data-act="close" aria-label="' + escHtml(t("detail.close")) + '"><i data-lucide="x"></i></button>' +
    "</div>";

  const filaLista = function(p) {
    const pend = p.tasks.filter(function(x) { return !x.done; }).length;
    return fila('data-goto="' + escHtml(p.id) + '"', _projectColor(p), "list", p.name, pend, p.id);
  };

  html += '<p class="pmenu-section-label">' + escHtml(t("pmenu.lists")) + "</p>";

  if (lists.length) {
    html += "<div class='pmenu-group'>" + lists.map(filaLista).join("") + "</div>";
  }

  html += "<div class='pmenu-group'>" +
    fila('data-act="new-list"', null, "plus", t("sidebar.add_list")) +
  "</div>";

  html += "<div class='pmenu-group'>" +
    fila('data-act="settings"', null, "settings", t("profile.settings")) +
    (signedIn
      ? fila('data-act="signout"', null, "log-out", t("profile.signout"))
      : fila('data-act="signin"', null, "log-in", t("profile.signin"))) +
  "</div>";

  sheet.insertAdjacentHTML("beforeend", html);
  sheet.classList.add("modal-sheet--menu");
  if (window.lucide) window.lucide.createIcons({ nodes: [sheet] });

  sheet.addEventListener("click", function(e) {
    const btn = e.target.closest("[data-goto],[data-act],[data-edit]");
    if (!btn) return;
    if (btn.dataset.edit) {
      // El menú completo (renombrar, color, archivar, ELIMINAR) — antes
      // solo renombraba, así que en móvil no había forma de borrar una
      // lista. Se ancla al lápiz ANTES de cerrar la hoja: una vez cerrada,
      // el botón sale del DOM y pierde su posición en pantalla.
      const p = projects.find(function(x) { return x.id === btn.dataset.edit; });
      if (p) showProjectMenu(p, btn);
      closeSheet(overlay);
      return;
    }
    closeSheet(overlay);
    if (btn.dataset.goto) { activateProject(btn.dataset.goto); return; }
    switch (btn.dataset.act) {
      case "new-list":  startNewProject(); break;
      case "settings":  if (window.openSettingsModal) window.openSettingsModal(); break;
      // Sesión: se llama a la función real, no al botón del drawer. Trae la
      // carga bajo demanda del módulo de sincronización y el tratamiento de
      // popup cerrado / bloqueado / dominio no autorizado.
      case "signin":    if (window.antaskSignIn)  window.antaskSignIn();  break;
      case "signout":   if (window.antaskSignOut) window.antaskSignOut(); break;
      // "close" no necesita caso: closeSheet(overlay) ya se disparó arriba.
    }
  });

  overlay._cancel = function() { closeSheet(overlay); };
}
window.showProfileMenu = showProfileMenu;

/**
 * La búsqueda dentro de la lista se retiró de Inbox/listas: en móvil ahora
 * vive como destino propio en la barra inferior (#bnav-search-btn), que abre
 * la búsqueda global — la misma que Ctrl+K en escritorio, no una por lista.
 */
function _syncListSearchVisibility() {
  const box = document.getElementById("list-search");
  if (box) box.hidden = true;
}

/**
 * Tema, estilo de fila y detalles/columnas viven en la cabecera de la
 * lista en escritorio (.view-nav-right) y junto a «Filtrar» en móvil
 * (#list-filter-actions, en el cuerpo de la lista). No suben a
 * #mobile-header-right pese al nombre: esa cabecera (.mobile-header, la
 * barra compacta con el logo) está apagada a propósito en móvil —
 * "Ajustes vive en «Perfil»" dice su propio comentario en el CSS—, así
 * que cualquier cosa que se mueva ahí queda invisible. #list-filter-actions
 * cuelga de .tasks-header, que sí se ve en móvil. Se mueven los nodos en
 * vez de duplicarlos para no tener dos botones con el mismo id ni dos
 * estados que sincronizar. Se reevalúa al cruzar el breakpoint, así que
 * redimensionar o girar el teléfono los recoloca.
 */
function _placeRowStyleControl() {
  // Al cruzar el breakpoint cambia el estilo efectivo (móvil = limpio fijo),
  // así que hay que repintar el atributo además de recolocar el control.
  if (taskList) taskList.dataset.rowStyle = _rowStyleEfectivo();
  applyTwoColumns(twoColumnsOn, false);
  const headerActions = document.querySelector(".tasks-header .view-nav-right");
  const filterActions = document.getElementById("list-filter-actions");
  if (!headerActions || !filterActions) return;
  const enMovil = window.matchMedia("(max-width: 768px)").matches;
  const destino = enMovil ? filterActions : headerActions;

  ["theme-toggle-btn", "row-style-wrap", "task-prefs-wrap"].forEach(function(id) {
    const el = document.getElementById(id);
    if (el && el.parentElement !== destino) destino.appendChild(el);
  });
}

/**
 * Chips de listas — igual que el prototipo v1: siempre presentes, con «Todas»
 * delante y todas las listas detrás. La activa NO desaparece, se queda
 * marcada, de modo que la fila indica a la vez dónde estás y a dónde puedes ir.
 *
 * Solo en móvil: en escritorio la sidebar está siempre visible y hace este
 * trabajo mejor. En «Hoy» tampoco, porque esa vista no es de una lista.
 */
function _renderListChips() {
  const host = document.getElementById("list-chips");
  if (!host) return;

  // Las archivadas no salen: archivar es sacar una lista de la vista, y en
  // móvil estos chips SON la navegación entre listas. Asomaban aquí aunque
  // sus tareas ya se filtraban bien del resto de vistas.
  // El "+" tiene que verse aunque no haya ninguna lista aún: es la única
  // forma de crear la primera desde el Inbox en móvil.
  const lists = projects.filter(function(p) {
    return p.id !== INBOX_ID && !p.archived;
  });
  if (activeView !== "project") {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  // «Todas» es el Inbox: la vista con el pool completo. Va sin punto de color,
  // como en v1, porque no es una lista más sino la vuelta a todas.
  const chip = function(id, name, color, active) {
    return '<button type="button" class="list-chip' + (active ? " list-chip--active" : "") + '"' +
             ' data-chip-target="' + escHtml(id) + '"' +
             (active ? ' aria-current="true"' : "") + ">" +
             (color ? '<span class="list-chip-dot" style="background:' + escHtml(color) + '"></span>' : "") +
             "<span>" + escHtml(name) + "</span>" +
           "</button>";
  };

  let html = chip(INBOX_ID, t("filter.all"), null, activeProjectId === INBOX_ID);
  lists.forEach(function(p) {
    html += chip(p.id, p.name, p.color || _projectColorFromId(p.id), p.id === activeProjectId);
  });
  // "+" al final de la fila, como en WhatsApp: crear una lista es un
  // chip más, no un botón aparte en otro sitio.
  html += '<button type="button" class="list-chip list-chip--add" data-chip-add="1" aria-label="' +
    escHtml(t("sidebar.add_list")) + '"><i data-lucide="plus"></i></button>';

  host.innerHTML = html;
  host.hidden = false;
  if (window.lucide) window.lucide.createIcons({ nodes: [host] });
}

/* Búsqueda dentro de la lista que se está viendo (buscador de móvil). Es
   distinta de la búsqueda global de «Perfil»: esta filtra lo visible y no
   navega a ningún sitio. No se persiste a propósito —una búsqueda que
   sobrevive a recargar deja la lista aparentemente vacía sin motivo—. */
let currentQuery = "";

/** Normaliza para comparar sin tildes ni mayúsculas: buscar «formacion»
 *  tiene que encontrar «Formación». */
function _norm(s) {
  // NFD separa la letra de su tilde; el rango del class son los diacríticos
  // combinantes (U+0300–U+036F), que se descartan. El fichero es UTF-8, así
  // que van como caracteres y no como escapes.
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function _matchesQuery(task, project) {
  if (!currentQuery) return true;
  const q = _norm(currentQuery);
  if (_norm(task.text).indexOf(q) !== -1 || _norm(task.comment).indexOf(q) !== -1) return true;
  // Como en la búsqueda global (Cmd+K): también por nombre de lista.
  if (project && _norm(project.name).indexOf(q) !== -1) return true;
  return false;
}

/* Iconos de las opciones de filtro. Van en un mapa porque lucide borra
   `data-lucide` del SVG que genera, así que no se pueden leer del DOM.
   Debe seguir a los `data-lucide` de #filter-panel en index.html. */
const FILTER_OPT_ICON = {
  "filter:all":     "list",
  "filter:pending": "circle-dashed",
  "filter:done":    "check-circle-2",
  "filter:overdue": "triangle-alert",
  "filter:today":   "sun",
  "filter:nodate":  "calendar",
  "filter:high":    "flag",
};

/**
 * Traduce #filter-panel a las secciones que espera `sheetPick`. Se lee del
 * DOM en vez de declararlo aparte para que las etiquetas y el estado activo
 * salgan de una sola fuente: si mañana se añade una opción al panel, la hoja
 * la hereda sin tocar nada.
 */
function _filterPanelSections() {
  const panel = document.getElementById("filter-panel");
  if (!panel) return [];
  return Array.prototype.map.call(panel.querySelectorAll(".filter-panel-section"), function(sec) {
    const headEl = sec.querySelector(".filter-panel-label");
    const options = Array.prototype.map.call(sec.querySelectorAll("[data-filter]"), function(b) {
      const value = "filter:" + b.dataset.filter;
      return {
        value: value,
        icon: FILTER_OPT_ICON[value] || "list",
        label: (b.querySelector("span") || {}).textContent || value,
        active: b.classList.contains("filter-opt--active"),
      };
    });
    return { heading: headEl ? headEl.textContent : "", options: options };
  }).filter(function(s) { return s.options.length > 0; });
}

// ─── FILTROS ─────────────────────────────────────────────────

/**
 * Marca el filtro activo en los DOS sitios donde vive: el segmentado
 * visible de escritorio y las opciones del panel, que se conservan
 * porque de ahí se construye la hoja de filtros de móvil.
 * @param {string} value
 */
function _marcarFiltroActivo(value) {
  document.querySelectorAll("#list-filter-row [data-filter]").forEach(function(b) {
    var on = b.dataset.filter === value;
    b.classList.toggle("filter-opt--active", on);
    // Solo el segmentado es un grupo de pulsación; las del panel son
    // menuitemradio y su estado ya lo lleva la clase.
    if (b.classList.contains("filter-segment")) b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function applyFilter(value) {
  currentFilter = value;
  // El ámbito es la fila entera, no solo el panel: los tres filtros de uso
  // diario viven ahora fuera, como segmentado, y el panel los conserva para
  // la hoja de móvil. Los dos juegos tienen que marcarse a la vez.
  _marcarFiltroActivo(value);
  _updateFilterTriggerLabel();
  renderTasks();
}
window.applyFilter = applyFilter;

function _syncFilterPanel(filter) {
  document.querySelectorAll("#filter-panel [data-filter]").forEach(function(b) {
    b.classList.toggle("filter-opt--active", b.dataset.filter === filter);
  });
  var triggerBtn = document.getElementById("filter-trigger-btn");
  if (triggerBtn) triggerBtn.classList.remove("filter-trigger-btn--active");
  var labelEl = document.getElementById("filter-trigger-label");
  var isDesktop = window.matchMedia("(min-width: 769px)").matches;
  if (labelEl) labelEl.textContent = t(isDesktop ? "filter.trigger_label" : "filter.trigger_label_mobile");
}

function _updateFilterTriggerLabel() {
  var labelEl    = document.getElementById("filter-trigger-label");
  var triggerBtn = document.getElementById("filter-trigger-btn");
  if (!labelEl) return;
  // En escritorio Todas/Pendientes/Hechas ya se leen en el segmentado de al
  // lado: repetirlas aquí es redundante, así que el botón ("Otros") solo
  // cambia de texto para los filtros que NO están en ese segmentado (Hoy,
  // Vencidas, Sin fecha, Importantes). En móvil, sin el segmentado siempre
  // visible, sigue reflejando cualquier filtro activo.
  var isDesktop  = window.matchMedia("(min-width: 769px)").matches;
  var inSegments = currentFilter === "all" || currentFilter === "pending" || currentFilter === "done";
  var parts = [];
  // Antes era un ternario pending/done: con ocho filtros, cualquier otro
  // habría rotulado «Hechas». La clave se deriva del propio valor.
  if (currentFilter !== "all" && !(isDesktop && inSegments)) parts.push(t("filter." + currentFilter));
  if (triggerBtn) triggerBtn.classList.toggle("filter-trigger-btn--active", parts.length > 0);
  labelEl.textContent = parts.length > 0 ? parts.join(", ") : t(isDesktop ? "filter.trigger_label" : "filter.trigger_label_mobile");
}

// ─── STORAGE EVENT ───────────────────────────────────────────
window.addEventListener("storage", function(event) {
  if (event.key === PROJECTS_KEY) {
    projects = loadProjects();
    if (_reactivarRecurrentes()) saveProjects();
    renderSidebar();
    renderTasks();
  }
  if (event.key === THEME_KEY) initializeTheme();
  if (event.key === ACCENT_KEY) initializeAccent();
  if (event.key === MODE_KEY) initializeMode();
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES CORE
// ═══════════════════════════════════════════════════════════════

// Expuesto a window para que notifications.js pueda saltar al
// proyecto cuando el usuario pulsa una notificación.
window.activateProject = function(id) { return activateProject(id); };
function activateProject(id) {
  activeView = "project";
  activeProjectId = id;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);

  // Cierra paneles alternativos si estaban abiertos
  _closeAllAltPanels();

  const project = getActiveProject();

  // Sin proyecto —id nulo, o la lista que había abierta se acaba de borrar—
  // ya no hay pantalla de estado vacío que enseñar: caemos en "Hoy", que es
  // la vista por defecto de la app desde el arranque.
  if (!project) {
    localStorage.removeItem(ACTIVE_KEY);
    activateTodayView();
    return;
  }

  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.remove("ctrl-bar--alt"); }
  if (mobileFab) mobileFab.classList.add("visible");
  tasksPanel.hidden = false;
  // Restauramos el formulario por si veníamos de la vista Hoy.
  if (taskForm) taskForm.style.display = "";
  _setActiveViewTab("tasks");

  // Update mobile header: show project title
  var mobileHeader = document.getElementById("mobile-header");
  var mobileHeaderTitle = document.getElementById("mobile-header-title");
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeader) {
    mobileHeader.classList.add("mobile-header--project");
    if (mobileHeaderTitle) mobileHeaderTitle.textContent = project.name;
    if (mobileHeaderCount) mobileHeaderCount.textContent =
      project.tasks.filter(function(t) { return !t.done; }).length + " pendientes";
    // Color dot del proyecto delante del título (ancla visual).
    // Mismo hash/explícito que en el sidebar para sistema visual coherente.
    mobileHeader.style.setProperty(
      "--mobile-header-project-color",
      project.color || _projectColorFromId(project.id)
    );
  }

  projectTitleEl.textContent = project.name;
  projectSubtitle.textContent = project.tasks.length + " tarea" + (project.tasks.length !== 1 ? "s" : "");
  _setMobileSubtitle(project.tasks.filter(function(x) { return !x.done; }).length);

  if (selectMode) exitSelectMode();
  currentFilter = "all";
  _syncFilterPanel("all");

  closeTaskDetail();
  renderSidebar();
  renderTasks();
  updateSaveStatus(loadMetadata().lastSavedAt);
  // La barra inferior no se sincronizaba al entrar en un proyecto —solo lo
  // hacían Hoy y el calendario—, así que al arrancar en Inbox, o al abrir una
  // lista, ninguna pestaña quedaba marcada.
  if (typeof window.syncBnavActive === "function") window.syncBnavActive();
}

/**
 * Activa la vista virtual "Hoy" — muestra todas las tareas
 * pendientes con dueDate <= hoy de todos los proyectos.
 */
function activateTodayView() {
  activeView = "today";
  activeProjectId = null;
  localStorage.removeItem(ACTIVE_KEY);

  _closeAllAltPanels();

  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.remove("ctrl-bar--alt"); }
  if (mobileFab) mobileFab.classList.add("visible");
  tasksPanel.hidden = false;
  _setActiveViewTab("tasks");

  // El task-form no aplica en Hoy — ocultar input.
  if (taskForm) taskForm.style.display = "none";

  // Mobile header
  var mobileHeader = document.getElementById("mobile-header");
  var mobileHeaderTitle = document.getElementById("mobile-header-title");
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeader) mobileHeader.classList.add("mobile-header--project");
  if (mobileHeaderTitle) mobileHeaderTitle.textContent = t("view.today_title");
  if (mobileHeaderCount) mobileHeaderCount.textContent = "";

  document.title = t("view.today_title") + " — antask";
  if (projectTitleEl)  projectTitleEl.textContent  = t("view.today_title");
  if (projectSubtitle) {
    // Fecha larga como en el prototipo: "Sábado, 18 de julio"
    var fecha = new Date().toLocaleDateString(getLang() === "en" ? "en-GB" : "es-ES",
      { weekday: "long", day: "numeric", month: "long" });
    projectSubtitle.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  }
  if (projectSubtitleM) {
    // En móvil, la fecha con el mes abreviado: "Miércoles, 12 ago".
    // Sin esto el subtítulo se quedaba con el «N pendientes» de la lista
    // que estuviera abierta antes, porque solo se escribe al abrir una.
    var fechaM = new Date().toLocaleDateString(getLang() === "en" ? "en-GB" : "es-ES",
      { weekday: "long", day: "numeric", month: "short" });
    projectSubtitleM.textContent = fechaM.charAt(0).toUpperCase() + fechaM.slice(1);
  }

  if (selectMode) exitSelectMode();
  currentFilter = "all";
  _syncFilterPanel("all");

  closeTaskDetail();
  renderSidebar();
  renderTasks();
  if (typeof window.syncBnavActive === "function") window.syncBnavActive();
}


/**
 * Pinta los items fijos al tope de la sidebar: vista "Hoy" + proyecto Inbox.
 * Se redibujan en cada renderSidebar().
 */
function renderPinnedItems(inboxProject) {
  // ── Item "Hoy" — vista virtual ─────────────────────────────────
  var today = _localDateISO(new Date());
  var todayCount = 0;
  projects.forEach(function(p) {
    (p.tasks || []).forEach(function(t) {
      if (!t.done && t.dueDate && t.dueDate <= today) todayCount++;
    });
  });

  var hoy = document.createElement("li");
  hoy.className = "project-item project-item-pinned project-item-today" +
    (activeView === "today" ? " active" : "");
  hoy.innerHTML =
    '<div class="project-item-top">' +
      '<span class="project-item-icon project-item-icon--system"><i data-lucide="calendar"></i></span>' +
      '<span class="project-item-name">' + t("sidebar.today") + '</span>' +
      (todayCount > 0 ? '<span class="project-item-count">' + todayCount + '</span>' : "") +
    '</div>';
  hoy.addEventListener("click", function() { activateTodayView(); });
  hoy.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopPropagation();
    showTodayMenu(e.clientX, e.clientY);
  });
  projectListEl.appendChild(hoy);

  // ── Item Inbox — proyecto real, fijado ─────────────────────────
  if (inboxProject) {
    // El Inbox muestra el pool completo → su contador también.
    var pending = 0;
    projects.forEach(function(p) {
      if (p.archived) return;
      (p.tasks || []).forEach(function(t) { if (!t.done) pending++; });
    });
    var inbox = document.createElement("li");
    inbox.className = "project-item project-item-pinned project-item-inbox" +
      (activeView === "project" && activeProjectId === INBOX_ID ? " active" : "");
    inbox.dataset.projectId = INBOX_ID;
    inbox.innerHTML =
      '<div class="project-item-top">' +
        '<span class="project-item-icon project-item-icon--system"><i data-lucide="inbox"></i></span>' +
        '<span class="project-item-name">' + t("sidebar.inbox") + '</span>' +
        (pending > 0 ? '<span class="project-item-count">' + pending + '</span>' : "") +
      '</div>';
    inbox.addEventListener("click", function() { activateProject(INBOX_ID); });
    inbox.addEventListener("contextmenu", function(e) {
      e.preventDefault();
      e.stopPropagation();
      showInboxMenu(inboxProject, e.clientX, e.clientY);
    });

    inbox.addEventListener("dragover", function(e) {
      if (!dragSrcId || dragSrcProjectId) return;
      if (activeProjectId === INBOX_ID) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      inbox.classList.add("project-task-drop-target");
    });
    inbox.addEventListener("dragleave", function(e) {
      if (!inbox.contains(e.relatedTarget)) {
        inbox.classList.remove("project-task-drop-target");
      }
    });
    inbox.addEventListener("drop", function(e) {
      inbox.classList.remove("project-task-drop-target");
      if (!dragSrcId || dragSrcProjectId) return;
      if (activeProjectId === INBOX_ID) return;
      e.preventDefault();
      const srcProject = getActiveProject();
      if (!srcProject) return;
      const taskIdx = srcProject.tasks.findIndex(function(t) { return t.id === dragSrcId; });
      if (taskIdx === -1) return;
      const [moved] = srcProject.tasks.splice(taskIdx, 1);
      inboxProject.tasks.push(moved);
      saveAndRender();
    });

    projectListEl.appendChild(inbox);
  }

  // ── Separador visual ───────────────────────────────────────────
  var sep = document.createElement("li");
  sep.className = "project-pinned-sep";
  sep.setAttribute("aria-hidden", "true");
  projectListEl.appendChild(sep);
}


// ── Creación inline en la sidebar, al estilo del prototipo v1: un botón
//    "+ Añadir lista" que se convierte en un input en línea; Enter confirma,
//    Escape o blur cancela. ─────────────────────────────────────────────
var _addingList = false; // input de "+ Añadir lista" activo

/** Título de sección dentro de #project-list (Vistas, Listas...). */
function _sidebarSectionLabel(text) {
  var li = document.createElement("li");
  li.className = "sidebar-section-label";
  li.textContent = text;
  return li;
}

/** Botón "+ Añadir lista". */
function _sidebarAddButton(opts) {
  var li = document.createElement("li");
  li.className = "sidebar-add-btn sidebar-add-btn--group";
  li.innerHTML = '<i data-lucide="plus"></i><span></span>';
  li.querySelector("span").textContent = opts.label;
  li.addEventListener("click", function(e) { e.stopPropagation(); opts.onClick(); });
  return li;
}

/** Input inline para crear una lista. */
function _sidebarInlineInput(opts) {
  var li = document.createElement("li");
  li.className = "sidebar-add-input";
  var input = document.createElement("input");
  input.type = "text";
  input.className = "sidebar-add-input-field";
  input.placeholder = opts.placeholder || "";
  input.maxLength = 60;
  var done = false;
  var commit = function() {
    if (done) return; done = true;
    opts.onCommit(input.value);
  };
  var cancel = function() {
    if (done) return; done = true;
    opts.onCancel();
  };
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  });
  input.addEventListener("blur", function() { commit(); });
  li.appendChild(input);
  // Autofoco tras insertarse en el DOM.
  requestAnimationFrame(function() { input.focus(); input.select(); });
  return li;
}

function _commitAddList(value) {
  var name = (value || "").trim();
  _addingList = false;
  if (!name) { renderSidebar(); return; }
  _createProjectWithTasks(name, []);
}

/**
 * Sincroniza el rail de la sidebar colapsada con el estado de la app:
 * marca la vista activa y pone un punto de aviso cuando Hoy o Inbox
 * tienen tareas pendientes (equivalente al `attention` de v1).
 *
 * Se llama desde renderSidebar() para no duplicar el cómputo de contadores.
 */
function syncSidebarRail() {
  const todayBtn = document.getElementById("sidebar-rail-today");
  const inboxBtn = document.getElementById("sidebar-rail-inbox");
  if (!todayBtn || !inboxBtn) return;

  const today = _localDateISO(new Date());
  let todayCount = 0;
  let pending    = 0;
  projects.forEach(function(p) {
    if (p.archived) return;
    (p.tasks || []).forEach(function(tk) {
      if (tk.done) return;
      pending++;
      if (tk.dueDate && tk.dueDate <= today) todayCount++;
    });
  });

  todayBtn.classList.toggle("active", activeView === "today");
  inboxBtn.classList.toggle("active", activeView === "project" && activeProjectId === INBOX_ID);

  if (todayCount > 0) todayBtn.setAttribute("data-attention", "");
  else                todayBtn.removeAttribute("data-attention");
  if (pending > 0)    inboxBtn.setAttribute("data-attention", "");
  else                inboxBtn.removeAttribute("data-attention");

  // La inicial del avatar la mantiene el menú de perfil; el rail la copia.
  const railAvatar = document.getElementById("sidebar-rail-avatar");
  const profileAvatar = document.getElementById("profile-avatar");
  if (railAvatar && profileAvatar) railAvatar.textContent = profileAvatar.textContent;
}

function renderSidebar() {
  // Capture previous counts so we can animate changes
  _sidebarPrevCounts = {};
  projectListEl.querySelectorAll("[data-project-id]").forEach(function(li) {
    var id = li.dataset.projectId;
    var span = li.querySelector(".project-item-count");
    if (id && span) _sidebarPrevCounts[id] = span.textContent;
  });
  projectListEl.innerHTML = "";
  // Inbox y otros proyectos se separan: Inbox vive en su propio "pin" arriba.
  const inboxProject = projects.find(function(p) { return p.id === INBOX_ID; });
  const realActive   = projects.filter(function(p) { return !p.archived && p.id !== INBOX_ID; });

  // ── Items fijados al tope: Hoy + Inbox ───────────────────────
  projectListEl.appendChild(_sidebarSectionLabel(t("sidebar.pinned_section")));
  renderPinnedItems(inboxProject);

  // Listas: lista plana, sin agrupar.
  projectListEl.appendChild(_sidebarSectionLabel(t("sidebar.lists_section")));
  realActive.forEach(function(p) { renderProjectItem(p); });

  // "+ Añadir lista" al final (o input activo), como en v1.
  if (_addingList) {
    projectListEl.appendChild(_sidebarInlineInput({
      placeholder: t("sidebar.list_name"),
      onCommit: function(v) { _commitAddList(v); },
      onCancel: function() { _addingList = false; renderSidebar(); },
    }));
  } else {
    projectListEl.appendChild(_sidebarAddButton({
      label: t("sidebar.add_list"),
      onClick: function() { _addingList = true; renderSidebar(); },
    }));
  }

  if (window.lucide) lucide.createIcons();
  // Archivados se renderiza SIEMPRE — la cabecera aparece aunque la lista
  // esté vacía, para que el "scaffolding" del sidebar quede estable.
  renderArchivedWidget();
  syncSidebarRail();
}

function renderArchivedWidget() {
  var wrap = document.getElementById("archived-section");
  if (!wrap) return;
  wrap.innerHTML = "";

  var archived = projects.filter(function(p) { return p.archived; });
  var isEmpty  = archived.length === 0;

  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "archived-section-toggle" + (isEmpty ? " archived-section-toggle--empty" : "");
  toggle.innerHTML =
    '<i data-lucide="' + (_archivedExpanded ? "chevron-down" : "chevron-right") + '"></i>' +
    '<i data-lucide="archive"></i>' +
    '<span>' + t("sidebar.archived") + '</span>' +
    (isEmpty ? '' : '<span class="archived-section-count">' + archived.length + '</span>');
  toggle.addEventListener("click", function() {
    _archivedExpanded = !_archivedExpanded;
    renderArchivedWidget();
    if (window.lucide) lucide.createIcons({ nodes: [wrap] });
  });
  wrap.appendChild(toggle);

  if (_archivedExpanded) {
    if (isEmpty) {
      var empty = document.createElement("p");
      empty.className = "sidebar-section-empty";
      empty.textContent = t("sidebar.archived_empty");
      wrap.appendChild(empty);
    } else {
      var list = document.createElement("ul");
      list.className = "archived-project-list";
      archived.forEach(function(p) { renderProjectItem(p, true, list); });
      wrap.appendChild(list);
    }
  }

  if (window.lucide) lucide.createIcons({ nodes: [wrap] });
}

/**
 * Patrón de dasharray para un anillo SVG segmentado: un arco por unidad
 * de `total` (no un único arco proporcional), con los primeros `done`
 * coloreados. Devuelve { track, fill } listos para `stroke-dasharray`.
 *
 * El hueco entre arcos se ata al grosor del trazo (`strokeWidth`), no a un
 * % fijo del hueco que le toca a cada unidad: con `stroke-linecap: round`
 * cada arco sobresale medio grosor a cada lado, así que un hueco más fino
 * que el trazo se ve fusionado con el vecino aunque exista en el path. Si
 * hay demasiadas unidades para el tamaño del anillo, se cede longitud de
 * arco antes que hueco: con extremos redondeados un arco casi nulo sigue
 * viéndose como un punto, pero un hueco casi nulo deja de verse del todo.
 */
function _segmentedRingDash(total, done, C, strokeWidth) {
  if (total <= 0) return { track: "none", fill: "0 " + C.toFixed(2) };
  var slot = C / total;
  var targetGap = strokeWidth * 1.3;
  var minSeg = strokeWidth * 0.15;
  var gap = Math.max(0, Math.min(targetGap, slot - minSeg));
  var seg = slot - gap;
  var track = seg.toFixed(2) + " " + gap.toFixed(2);
  var fill = "0 " + C.toFixed(2);
  if (done > 0) {
    var parts = [];
    for (var i = 0; i < done; i++) {
      var isLast = i === done - 1;
      parts.push(seg.toFixed(2));
      parts.push((isLast ? (gap + (C - done * slot)) : gap).toFixed(2));
    }
    fill = parts.join(" ");
  }
  return { track: track, fill: fill };
}

function renderProjectItem(project, isArchived, parentEl) {
  const target = parentEl || projectListEl;
  const li = document.createElement("li");
  li.className = "project-item" + (isArchived ? " project-item-archived" : "");
  li.dataset.projectId = project.id;
  if (project.id === activeProjectId) li.classList.add("active");

  const done  = project.tasks.filter(function(t) { return t.done; }).length;
  const total = project.tasks.length;

  // Las listas ya no llevan icono propio: siempre muestran el anillo de
  // progreso (el color de la lista sólo se ve aquí, en el anillo). Como v1.
  const iconBtn = null;
  const _done  = project.tasks.filter(function(t) { return t.done; }).length;
  const _total = project.tasks.length;
  const R = 8;
  const STROKE = 2;
  const C = 2 * Math.PI * R;
  const dash = _segmentedRingDash(_total, _done, C, STROKE);

  const ringEl = document.createElement("span");
  ringEl.className = "project-ring";
  ringEl.setAttribute("aria-hidden", "true");
  ringEl.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 20 20">' +
      '<circle class="project-ring-track" cx="10" cy="10" r="' + R + '" fill="none" stroke-width="' + STROKE + '" stroke-linecap="round" ' +
        'stroke-dasharray="' + dash.track + '" transform="rotate(-90 10 10)"></circle>' +
      '<circle class="project-ring-fill" cx="10" cy="10" r="' + R + '" fill="none" stroke-width="' + STROKE + '" stroke-linecap="round" ' +
        'stroke-dasharray="' + dash.fill + '" transform="rotate(-90 10 10)"></circle>' +
    '</svg>';

  const nameSpan = document.createElement("span");
  nameSpan.className = "project-item-name";
  nameSpan.textContent = project.name;
  nameSpan.title = t("project.dblclick_rename");
  nameSpan.addEventListener("dblclick", async function(e) {
    e.stopPropagation();
    const newName = await modalPrompt(t("project.rename_prompt"), project.name, project.name);
    if (newName === null) return;
    const trimmed = capitalizeFirst(newName.trim());
    if (!trimmed || trimmed === project.name) return;
    project.name = trimmed;
    saveProjects();
    renderSidebar();
    if (project.id === activeProjectId) activateProject(project.id);
  });

  const countSpan = document.createElement("span");
  const newCountText = done + "/" + total;
  countSpan.className = "project-item-count";
  countSpan.textContent = newCountText;
  if (_sidebarPrevCounts[project.id] !== undefined && _sidebarPrevCounts[project.id] !== newCountText) {
    countSpan.classList.add("count-flip");
  }

  const kebabBtn = document.createElement("button");
  kebabBtn.type = "button";
  kebabBtn.className = "project-kebab-btn";
  kebabBtn.innerHTML = '<i data-lucide="ellipsis"></i>';
  kebabBtn.title = t("project.kebab_title");
  kebabBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    showProjectMenu(project, kebabBtn);
  });

  const topRow = document.createElement("div");
  topRow.className = "project-item-top";
  if (iconBtn) topRow.appendChild(iconBtn);
  else if (ringEl) topRow.appendChild(ringEl);
  topRow.appendChild(nameSpan);
  topRow.appendChild(countSpan);
  topRow.appendChild(kebabBtn);

  // Color del proyecto: explícito o fallback derivado del id (hash → hue
   // determinista). Alimenta el arco del anillo de progreso.
  li.style.setProperty("--project-color", project.color || _projectColorFromId(project.id));

  li.setAttribute("draggable", "false");
  li.appendChild(topRow);
  li.addEventListener("click", function() { activateProject(project.id); });
  li.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopPropagation();
    showProjectMenu(project, kebabBtn);
  });
  initProjectDragDrop(li, project.id);

  if (!isArchived) {
    li.addEventListener("dragover", function(e) {
      if (!dragSrcId || dragSrcProjectId) return;
      if (project.id === activeProjectId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      li.classList.add("project-task-drop-target");
    });
    li.addEventListener("dragleave", function(e) {
      if (!li.contains(e.relatedTarget)) {
        li.classList.remove("project-task-drop-target");
      }
    });
    li.addEventListener("drop", function(e) {
      li.classList.remove("project-task-drop-target");
      if (!dragSrcId || dragSrcProjectId) return;
      if (project.id === activeProjectId) return;
      e.preventDefault();
      const srcProject = getActiveProject();
      if (!srcProject) return;
      const taskIdx = srcProject.tasks.findIndex(function(t) { return t.id === dragSrcId; });
      if (taskIdx === -1) return;
      const [moved] = srcProject.tasks.splice(taskIdx, 1);
      project.tasks.push(moved);
      saveAndRender();
    });
  }

  target.appendChild(li);
}

// ── Context menu for projects ────────────────────────────────────────────────

var _ctxMenu = null;
var _ctxCloseHandler = null;

function closeCtxMenu() {
  if (_ctxMenu) {
    _ctxMenu.remove();
    _ctxMenu = null;
  }
  if (_ctxCloseHandler) {
    document.removeEventListener("mousedown", _ctxCloseHandler);
    _ctxCloseHandler = null;
  }
}

function positionCtxMenu(menu, anchor) {
  menu.style.position = "fixed";
  menu.style.visibility = "hidden";
  document.body.appendChild(menu);

  var rect = anchor.getBoundingClientRect();
  var mw = menu.offsetWidth;
  var mh = menu.offsetHeight;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  var left = rect.right - mw;
  if (left < 4) left = rect.left;
  if (left + mw > vw - 4) left = vw - mw - 4;

  var top = rect.bottom + 4;
  if (top + mh > vh - 4) top = rect.top - mh - 4;

  menu.style.left = left + "px";
  menu.style.top  = top  + "px";
  menu.style.visibility = "visible";
}

function positionCtxMenuAt(menu, x, y) {
  menu.style.position = "fixed";
  menu.style.visibility = "hidden";
  document.body.appendChild(menu);

  var mw = menu.offsetWidth;
  var mh = menu.offsetHeight;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  var left = x;
  if (left + mw > vw - 4) left = vw - mw - 4;
  if (left < 4) left = 4;
  var top = y;
  if (top + mh > vh - 4) top = y - mh;
  if (top < 4) top = 4;

  menu.style.left = left + "px";
  menu.style.top  = top  + "px";
  menu.style.visibility = "visible";
}

function _buildCtxMenu(items) {
  var menu = document.createElement("div");
  menu.className = "ctx-menu";
  items.forEach(function(item) {
    if (item === null) {
      var sep = document.createElement("div");
      sep.className = "ctx-sep";
      menu.appendChild(sep);
      return;
    }
    if (item.header) {
      var hdr = document.createElement("div");
      hdr.className = "ctx-header";
      hdr.textContent = item.label;
      menu.appendChild(hdr);
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctx-item" + (item.danger ? " ctx-item-danger" : "");
    btn.textContent = item.label;
    btn.addEventListener("click", function() {
      closeCtxMenu();
      item.action();
    });
    menu.appendChild(btn);
  });
  return menu;
}

/* Renombrar una lista. Extraído del menú de proyecto porque el lápiz de la
   pantalla «Perfil» hace exactamente lo mismo (handoff móvil v1: cada lista
   del usuario lleva su botón de editar). */
async function renameProject(project) {
  var newName = await modalPrompt(t("project.rename_prompt"), project.name, project.name);
  if (newName === null) return;
  var trimmed = capitalizeFirst(newName.trim());
  if (!trimmed || trimmed === project.name) return;
  project.name = trimmed;
  saveProjects();
  renderSidebar();
  if (project.id === activeProjectId) activateProject(project.id);
}

async function showProjectMenu(project, anchor) {
  closeCtxMenu();

  var archiveItems = project.archived
    ? [
        {
          _id: "restore",
          label: t("project.restore"),
          action: function() {
            project.archived = false;
            saveProjects();
            renderSidebar();
          }
        },
        null,
        {
          _id: "delete-permanent",
          label: t("project.delete_permanent"),
          danger: true,
          action: async function() {
            var ok = await modalConfirm(
              t("project.confirm_delete_permanent").replace("{name}", escHtml(project.name)),
              t("modal.delete")
            );
            if (!ok) return;
            projects = projects.filter(function(p) { return p.id !== project.id; });
            if (activeProjectId === project.id) {
              var active = projects.filter(function(p) { return !p.archived; });
              activeProjectId = active.length > 0 ? active[0].id : null;
            }
            saveProjects();
            renderSidebar();
            renderTasks();
          }
        }
      ]
    : [
        {
          label: t("project.change_color"),
          action: function() { showColorPicker(project); }
        },
        {
          label: t("project.rename"),
          action: function() { return renameProject(project); }
        },
        null,
        {
          _id: "delete",
          label: t("project.delete"),
          danger: true,
          action: async function() {
            var ok = await modalConfirm(
              t("project.confirm_delete").replace("{name}", escHtml(project.name)),
              t("modal.delete")
            );
            if (!ok) return;
            projects = projects.filter(function(p) { return p.id !== project.id; });
            if (activeProjectId === project.id) {
              var active = projects.filter(function(p) { return !p.archived; });
              activeProjectId = active.length > 0 ? active[0].id : null;
            }
            saveProjects();
            renderSidebar();
            renderTasks();
          }
        }
      ];

  var items = archiveItems;

  // El proyecto Inbox no se puede eliminar.
  if (project.id === INBOX_ID) {
    items = items.filter(function(it) {
      if (!it || it === null) return true;
      return it._id !== "delete";
    });
  }

  var menu = _buildCtxMenu(items);
  positionCtxMenu(menu, anchor);
  _ctxMenu = menu;

  requestAnimationFrame(function() {
    _ctxCloseHandler = function(e) {
      if (!menu.contains(e.target)) closeCtxMenu();
    };
    document.addEventListener("mousedown", _ctxCloseHandler);
  });
}

// ── Context menu for "Hoy" virtual view ────────────────────────────────
async function showTodayMenu(x, y) {
  closeCtxMenu();

  var today = _localDateISO(new Date());
  var pending = [];
  projects.forEach(function(p) {
    if (p.archived) return;
    (p.tasks || []).forEach(function(t) {
      if (!t.done && t.dueDate && t.dueDate <= today) pending.push({ task: t, project: p });
    });
  });

  var items = [
    {
      label: pending.length > 0
        ? t("today.menu.complete_n").replace("{count}", String(pending.length))
        : t("today.menu.complete"),
      action: async function() {
        if (pending.length === 0) return;
        var ok = await modalConfirm(
          t("today.menu.complete_confirm").replace("{count}", String(pending.length)),
          t("today.menu.complete_title")
        );
        if (!ok) return;
        pending.forEach(function(it) {
          it.task.done = true;
          it.task.completedAt = Date.now();
        });
        saveAndRender();
      }
    },
    {
      label: t("today.menu.postpone_all"),
      action: async function() {
        var unfinished = pending.filter(function(it) { return !it.task.done; });
        if (unfinished.length === 0) return;
        var ok = await modalConfirm(
          (unfinished.length === 1
            ? t("today.menu.postpone_confirm_one")
            : t("today.menu.postpone_confirm_other")).replace("{count}", String(unfinished.length)),
          t("today.menu.postpone_title")
        );
        if (!ok) return;
        var tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        var iso = _localDateISO(tomorrow);
        unfinished.forEach(function(it) { it.task.dueDate = iso; });
        saveAndRender();
      }
    }
  ];

  var menu = _buildCtxMenu(items);
  positionCtxMenuAt(menu, x, y);
  _ctxMenu = menu;

  requestAnimationFrame(function() {
    _ctxCloseHandler = function(e) {
      if (!menu.contains(e.target)) closeCtxMenu();
    };
    document.addEventListener("mousedown", _ctxCloseHandler);
  });
}

// ── Context menu for Inbox ─────────────────────────────────────────────
async function showInboxMenu(inboxProject, x, y) {
  closeCtxMenu();

  var pending = (inboxProject.tasks || []).filter(function(t) { return !t.done; });
  var completed = (inboxProject.tasks || []).filter(function(t) { return t.done; });

  var items = [];

  items.push({
    label: completed.length > 0
      ? t("inbox.menu.clear_done_n").replace("{count}", String(completed.length))
      : t("inbox.menu.clear_done"),
    action: async function() {
      if (completed.length === 0) return;
      var ok = await modalConfirm(
        (completed.length === 1
          ? t("inbox.menu.clear_done_confirm_one")
          : t("inbox.menu.clear_done_confirm_other")).replace("{count}", String(completed.length)),
        t("inbox.menu.clear_done_title")
      );
      if (!ok) return;
      inboxProject.tasks = inboxProject.tasks.filter(function(t) { return !t.done; });
      saveAndRender();
    }
  });

  // Marcamos la acción "vaciar" con id para poder filtrarla cuando el inbox está vacío.
  items.push({
    _id: "empty-inbox",
    label: t("inbox.menu.empty"),
    danger: true,
    action: async function() {
      if (inboxProject.tasks.length === 0) return;
      var ok = await modalConfirm(
        t("inbox.menu.empty_confirm").replace("{count}", String(inboxProject.tasks.length)),
        t("inbox.menu.empty_title")
      );
      if (!ok) return;
      inboxProject.tasks = [];
      saveAndRender();
    }
  });

  // Si no hay nada, deshabilitamos las opciones de limpieza visualmente quitándolas.
  if (pending.length === 0 && completed.length === 0) {
    items = items.filter(function(it) {
      if (!it) return true;
      return it._id !== "empty-inbox";
    });
  }

  var menu = _buildCtxMenu(items);
  positionCtxMenuAt(menu, x, y);
  _ctxMenu = menu;

  requestAnimationFrame(function() {
    _ctxCloseHandler = function(e) {
      if (!menu.contains(e.target)) closeCtxMenu();
    };
    document.addEventListener("mousedown", _ctxCloseHandler);
  });
}

// ── End context menus ────────────────────────────────────────────────────────

/**
 * Render diff-based de la lista de tareas.
 *
 * Reutiliza nodos DOM existentes por `data-task-id`. Solo recrea
 * un nodo si:
 *   - No existía antes
 *   - El objeto task fue reemplazado (otra referencia) — pasa al
 *     hacer import o sync desde la nube, no en interacción normal
 *
 * Esto evita: clonar el template ~200 veces, atar ~30 listeners
 * por tarea, y todo el coste de lucide.createIcons() sobre nodos
 * que no han cambiado. Antes con 200 tareas era jank visible.
 */
function renderTasks() {
  // La vista de Hoy y el Inbox agrupado rehacen bloques enteros, y quitar
  // contenido por encima del punto de lectura empuja el scroll hacia
  // arriba: completar una tarea a media lista devolvía al principio.
  // Se guarda la posición y se restaura tras pintar.
  var _scroller = document.querySelector(".task-list-scroll");
  var _scrollTop = _scroller ? _scroller.scrollTop : 0;
  function _restaurarScroll() {
    if (!_scroller || _scroller.scrollTop === _scrollTop) return;
    _scroller.scrollTop = _scrollTop;
  }

  // Con la app abierta al cambiar el día, las recurrentes completadas ayer
  // vuelven a estar pendientes al primer repintado.
  if (_reactivarRecurrentes()) saveProjects();

  // Antes de los returns tempranos: si no, al saltar a «Hoy» los chips de la
  // lista anterior se quedarían pintados.
  _renderListChips();
  _syncListSearchVisibility();

  // Vistas virtuales — render alternativo
  if (activeView === "today") {
    renderTodayView();
    _restaurarScroll();
    return;
  }
  _removeHoyHeaderExtra();
  const project = getActiveProject();
  if (!project) { taskList.innerHTML = ""; _restaurarScroll(); return; }

  taskList.classList.add("task-list--project");
  // Lista plana de filas: nunca va a dos columnas (lo hacen las vistas
  // por bloques, que es donde la partición tiene sentido).
  taskList.classList.remove("task-list--hoy", "task-list--grupos");

  // El Inbox del prototipo muestra TODO el pool: sus propias tareas
  // ("Sin lista") más las de cada proyecto, agrupadas por proyecto.
  // En modo simple (móvil) no existen otras listas — aunque el usuario
  // tenga alguna de antes (creada en modo completo), el Inbox no las
  // trae aquí: solo enseña las tareas que son literalmente del Inbox.
  const isInbox = project.id === INBOX_ID;
  let items = getVisibleTasks(project).map(function(tk) {
    return { task: tk, project: project };
  });
  if (isInbox && !isSimpleMobile()) {
    projects.forEach(function(p) {
      if (p.id === INBOX_ID || p.archived) return;
      getVisibleTasks(p).forEach(function(tk) {
        items.push({ task: tk, project: p });
      });
    });
  }

  // Las completadas se quedan donde están: al marcar una tarea no se mueve
  // a ningún bloque aparte, sólo cambia de aspecto. Para verlas solas está
  // el filtro "Completadas".
  let pendingItems = items;

  // Agrupar el Inbox por proyecto (las "listas" del prototipo): cada
  // proyecto es un grupo con cabecera y punto en su color; las tareas
  // del propio Inbox van al final bajo "Sin lista".
  // En modo simple (móvil) no hay concepto de listas propias — aunque
  // existan de antes (creadas en modo completo), el Inbox las funde en
  // una sola lista plana sin cabeceras, para no reintroducir por la
  // puerta de atrás algo que el resto de la UI ya oculta.
  let inboxGroups = null;
  // Se agrupa con cualquier filtro salvo «done»: la lista de aquí son las
  // pendientes, así que los filtros nuevos (vencidas, hoy, sin fecha…) se
  // agrupan igual de bien. Antes se enumeraban los filtros permitidos, lo que
  // habría dejado los nuevos sin agrupar sin ningún motivo.
  if (isInbox && currentFilter !== "done" && !isSimpleMobile()) {
    const byProj = new Map();
    pendingItems.forEach(function(it) {
      const k = it.project.id;
      if (!byProj.has(k)) byProj.set(k, { project: it.project, items: [] });
      byProj.get(k).items.push(it);
    });
    const groups = [];
    projects.forEach(function(p) {
      if (p.id !== INBOX_ID && byProj.has(p.id)) groups.push(byProj.get(p.id));
    });
    if (byProj.has(INBOX_ID)) groups.push(byProj.get(INBOX_ID));
    // Cabeceras solo si hay algún proyecto real en juego.
    if (groups.length > 1 || (groups.length === 1 && groups[0].project.id !== INBOX_ID)) {
      inboxGroups = groups;
      pendingItems = [];
      groups.forEach(function(g) { pendingItems = pendingItems.concat(g.items); });
    }
  }

  let visible = pendingItems;

  // ── Inbox agrupado: cada proyecto es un BLOQUE separado (como las
  // secciones de Hoy), no filas dentro de un único contenedor.
  //
  // Se hace por diferencias, no rehaciendo el HTML. Vaciar el contenedor
  // y volver a colgarlo todo obliga al navegador a CANCELAR y REINICIAR
  // las animaciones de cada fila al reinsertarlas: bastaba tocar una
  // tarea para que la lista entera repitiera su entrada, y se leía como
  // si la página se recargase sola. Reutilizando bloques y filas, un
  // render que no cambia nada estructural no mueve un solo nodo.
  if (inboxGroups) {
    taskList.classList.remove("task-list--project");
    // Inbox por bloques: candidato a dos columnas en pantallas anchas.
    taskList.classList.add("task-list--grupos");

    const bloquesPrevios = new Map();
    Array.from(taskList.children).forEach(function(n) {
      if (n.dataset && n.dataset.groupId) bloquesPrevios.set(n.dataset.groupId, n);
      else n.remove();   // pie o estado vacío de un render anterior
    });

    let secPrev = null;
    inboxGroups.forEach(function(g) {
      if (g.items.length === 0) return;
      const isNone = g.project.id === INBOX_ID;
      let sec = bloquesPrevios.get(g.project.id);
      let head, ul;
      if (sec) {
        bloquesPrevios.delete(g.project.id);
        head = sec.querySelector(".inbox-group-head");
        ul   = sec.querySelector(".inbox-group-list");
      } else {
        sec = document.createElement("li");
        sec.className = "hoy-section inbox-group-block";
        sec.dataset.groupId = g.project.id;
        head = document.createElement("div");
        head.className = "inbox-group-head";
        head.insertAdjacentHTML("beforeend",
          '<span class="inbox-group-dot"></span>' +
          '<span class="inbox-group-name"></span>' +
          '<span class="inbox-group-count"></span>' +
          '<span class="inbox-group-rule"></span>');
        ul = document.createElement("ul");
        ul.className = "inbox-group-list";
        sec.appendChild(head);
        sec.appendChild(ul);
      }

      head.querySelector(".inbox-group-name").textContent = isNone
        ? t("inbox.group_none")
        : g.project.name;
      // Número pelado, como en el prototipo móvil (`GroupHead`): los
      // paréntesis eran nuestros. Igual que en las secciones de Hoy.
      head.querySelector(".inbox-group-count").textContent = String(g.items.length);
      head.querySelector(".inbox-group-dot").style.background = isNone
        ? ""
        : _projectColor(g.project);

      const filasPrevias = new Map();
      Array.from(ul.children).forEach(function(n) {
        if (n.dataset && n.dataset.taskId) filasPrevias.set(n.dataset.taskId, n);
        else n.remove();
      });

      let nodoPrev = null;
      g.items.forEach(function(it) {
        // El prototipo móvil pinta el chip de lista en toda fila, también
        // bajo cabecera de grupo. Se construye siempre y en escritorio se
        // oculta por CSS, donde la cabecera ya nombra la lista.
        let node = filasPrevias.get(it.task.id);
        if (node && node._task === it.task && node._showList === true) {
          filasPrevias.delete(it.task.id);
          _updateTaskNode(node, it.task);
        } else {
          // El objeto cambió de referencia (sync, import…): hay que rehacer
          // la fila para que los listeners apunten al nuevo `task`.
          if (node) { node.remove(); filasPrevias.delete(it.task.id); }
          node = _buildTaskNode(it.task, it.project, true);
        }
        node.style.setProperty("--task-accent", _projectColor(it.project));
        node.classList.toggle("task-item--foreign", it.project.id !== project.id);
        const destino = nodoPrev ? nodoPrev.nextSibling : ul.firstChild;
        if (destino !== node) ul.insertBefore(node, destino);
        nodoPrev = node;
      });
      filasPrevias.forEach(function(n) { n.remove(); });

      const destinoSec = secPrev ? secPrev.nextSibling : taskList.firstChild;
      if (destinoSec !== sec) taskList.insertBefore(sec, destinoSec);
      secPrev = sec;
    });
    bloquesPrevios.forEach(function(n) { n.remove(); });

    _renderTasksFooter(project, isInbox);
    if (window.lucide) lucide.createIcons();
    _restaurarScroll();
    return;
  }

  // Limpieza: si venimos de la vista "Hoy" o de otro estado, eliminamos
  // cualquier nodo huérfano (`.today-item`, `.empty-illustrated`, ...) que no
  // pertenece al diff por data-task-id.
  Array.from(taskList.children).forEach(function (n) {
    if (!n.dataset || !n.dataset.taskId) n.remove();
  });

  // Mapa de nodos existentes por id
  const existing = new Map();
  for (let i = 0; i < taskList.children.length; i++) {
    const n = taskList.children[i];
    if (n.dataset && n.dataset.taskId) existing.set(n.dataset.taskId, n);
  }

  // Build/reuse + colocar en orden
  let prevNode = null;
  for (let i = 0; i < visible.length; i++) {
    const task = visible[i].task;
    const taskProject = visible[i].project;
    let node = existing.get(task.id);
    // Inbox plano (sin cabeceras de grupo): la fila de otro proyecto lleva
    // su etiqueta de lista, si no no habría forma de saber de dónde sale.
    const showList = taskProject.id !== project.id;
    if (!node || node._task !== task || node._showList !== showList) {
      // El objeto task cambió de referencia (sync remoto, import…)
      // → reconstruir el nodo entero para que los listeners apunten al nuevo task.
      if (node) node.remove();
      node = _buildTaskNode(task, taskProject, showList);
    } else {
      // Mismo objeto task → solo refrescar lo visible (barato).
      _updateTaskNode(node, task);
    }
    existing.delete(task.id);
    // Refresca el acento (color del proyecto) por si cambió el color.
    node.style.setProperty("--task-accent", _projectColor(taskProject));
    // Las tareas de otros proyectos no se reordenan desde el Inbox.
    node.classList.toggle("task-item--foreign", taskProject.id !== project.id);

    // Reordenar si es necesario (mover solo si no está en su sitio).
    const targetSibling = prevNode ? prevNode.nextSibling : taskList.firstChild;
    if (targetSibling !== node) taskList.insertBefore(node, targetSibling);
    prevNode = node;
  }

  // Eliminar nodos sobrantes (tareas filtradas o borradas)
  existing.forEach(function (n) { n.remove(); });

  // Empty state (v1): el Inbox realmente vacío lleva icono y sin CTA;
  // un proyecto/lista sin ninguna tarea invita a crear la primera; si
  // hay tareas pero el filtro activo no muestra ninguna, una sola línea.
  if (visible.length === 0) {
    const empty = document.createElement("li");
    const hasAnyTask = isInbox ? items.length > 0 : project.tasks.length > 0;

    if (!hasAnyTask && isInbox) {
      empty.className = "empty-illustrated empty-illustrated--badge";
      empty.innerHTML =
        '<div class="empty-illustrated-badge"><i data-lucide="inbox"></i></div>' +
        '<p class="empty-illustrated-title">' + t("empty.inbox.title") + '</p>' +
        '<p class="empty-illustrated-sub">' + t("empty.inbox.sub") + '</p>';
    } else if (!hasAnyTask) {
      empty.className = "empty-illustrated empty-illustrated--badge";
      empty.innerHTML =
        '<div class="empty-illustrated-badge"><i data-lucide="list-todo"></i></div>' +
        '<p class="empty-illustrated-title">' + t("empty.tasks.title_new").replace("{list}", project.name) + '</p>' +
        '<p class="empty-illustrated-sub">' + t("empty.tasks.sub_default") + '</p>' +
        '<button type="button" class="empty-illustrated-cta" data-empty-action="add">' +
          '<i data-lucide="plus"></i> ' + t("empty.cta.add_task") +
        '</button>';
    } else {
      empty.className = "empty-illustrated empty-illustrated--line";
      empty.innerHTML = '<p class="empty-illustrated-line">' + t("empty.tasks.title_filtered") + '</p>';
    }
    taskList.appendChild(empty);
    _wireEmptyStateCTA(empty);
  }

  // "Editar lista" al final de sus tareas — solo móvil (por CSS) y solo
  // para una lista real, no el Inbox: en escritorio ya está la sidebar, y
  // sin este atajo, editar una lista creada desde el chip "+" solo se
  // podía hacer desde Perfil, bastante lejos de donde se acaba de crear.
  if (!isInbox) {
    const editRow = document.createElement("li");
    editRow.className = "task-list-edit-row";
    editRow.innerHTML =
      '<button type="button" class="task-list-edit-btn"><i data-lucide="pencil-line"></i>' +
      escHtml(t("project.edit_this_list")) + "</button>";
    editRow.querySelector("button").addEventListener("click", function() {
      showProjectMenu(project, this);
    });
    taskList.appendChild(editRow);
  }

  _renderTasksFooter(project, isInbox);

  if (window.lucide) lucide.createIcons();
  _restaurarScroll();
}

/** Contadores / título de la vista proyecto. El Inbox cuenta el pool completo. */
function _renderTasksFooter(project, isInbox) {
  let poolTasks = project.tasks;
  if (isInbox) {
    poolTasks = [];
    projects.forEach(function(p) {
      if (!p.archived) poolTasks = poolTasks.concat(p.tasks || []);
    });
  }
  const pending = poolTasks.filter(function(t) { return !t.done; }).length;
  if (taskCounter) taskCounter.textContent = (pending === 1 ? t("task.counter_one") : t("task.counter_other"))
    .replace("{count}", String(pending));
  projectSubtitle.textContent = poolTasks.length + " tarea" + (poolTasks.length !== 1 ? "s" : "");
  _setMobileSubtitle(pending);
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeaderCount) mobileHeaderCount.textContent = pending + " pendiente" + (pending === 1 ? "" : "s");
  document.title = pending > 0
    ? "(" + pending + ") " + project.name + " — antask"
    : project.name + " — antask";
}

/** Pinta un badge de solo lectura con la prioridad de la tarea (o nada). */
function renderPriorityBadge(task, container) {
  if (!container) return;
  container.innerHTML = "";
  // Completar ya no esconde los chips: la fila completada sigue diciendo
  // de qué lista era y qué prioridad tenía. Lo único que cambia es que
  // el título se apaga.
  if (!task.priority) return;
  // Ya no hay niveles: una bandera roja es "importante", sin más.
  const badge = document.createElement("span");
  badge.className = "priority-badge";
  badge.title = IMPORTANT_LABEL();
  badge.innerHTML = '<i data-lucide="flag"></i>';
  container.appendChild(badge);
}

/** Pinta un badge de solo lectura con la campana de recordatorio (o nada). */
function renderReminderBadge(task, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!task.reminderAt) return;
  const badge = document.createElement("span");
  badge.className = "reminder-badge";
  badge.title = t("detail.reminder");
  badge.innerHTML = '<i data-lucide="bell"></i>';
  container.appendChild(badge);
}

/**
 * Elimina una tarea con soporte de deshacer. Compartida por el atajo de
 * teclado, el menú contextual y el pie del panel de detalle.
 */
function deleteTaskWithUndo(task, project) {
  const taskIndex = project.tasks.findIndex(function(tk) { return tk.id === task.id; });
  if (taskIndex === -1) return;
  _undoStack = { projectId: project.id, task: JSON.parse(JSON.stringify(task)), index: taskIndex };
  if (openDetailTaskId === task.id) closeTaskDetail();
  project.tasks = project.tasks.filter(function(tk) { return tk.id !== task.id; });
  saveAndRender();
  showUndoToast();
}

/** Duplica una tarea (con sus subtareas) justo debajo del original. */
function duplicateTask(task, project) {
  const idx = project.tasks.findIndex(function(tk) { return tk.id === task.id; });
  if (idx === -1) return;
  const copy = JSON.parse(JSON.stringify(task));
  copy.id = generateId();
  copy.subtasks = (copy.subtasks || []).map(function(s) { return Object.assign({}, s, { id: generateId() }); });
  project.tasks.splice(idx + 1, 0, copy);
  saveAndRender();
}

/**
 * Actualiza el estado visible de un nodo de tarea sin tocar
 * listeners. Asume que el nodo ya fue construido por _buildTaskNode.
 */
function _updateTaskNode(node, task) {
  const checkbox = node.querySelector(".task-toggle");
  const text     = node.querySelector(".task-text");

  checkbox.checked    = task.done;
  text.textContent    = task.text;
  node.classList.toggle("done", task.done);

  // Los chips se rehacen a base de vaciar y volver a crear el nodo, así que
  // repintarlos sin necesidad reinicia sus transiciones y provoca un
  // parpadeo en TODA la lista cada vez que se toca una sola tarea. Con una
  // firma de lo que les afecta, un render que no cambia nada no los toca.
  const firmaChips = [
    task.priority || "",
    task.reminderAt || "",
    task.dueDate || "",
    task.recurDays || "",
    node._showList && node._project ? node._project.id : "",
    node._showList && node._project ? node._project.name : "",
    getLang(),
    // Preferencias de detalles visibles: cambiarlas desde el modal debe
    // repintar los chips aunque la tarea en sí no haya cambiado.
    taskPrefs.showPriority, taskPrefs.showReminder, taskPrefs.showList, taskPrefs.showRecur,
    isSimpleMobile(),
  ].join("|");
  if (node._firmaChips !== firmaChips) {
    node._firmaChips = firmaChips;
    // Modo simple (móvil): solo fecha y repetir son campos reales — prioridad,
    // recordatorio y lista se quedan ocultos pase lo que pase en las prefs
    // (que además ni se pueden tocar: su botón está oculto, ver style.css).
    var simpleRow = isSimpleMobile();
    if (simpleRow || taskPrefs.showPriority === false) node.querySelector(".task-priority-container").innerHTML = "";
    else renderPriorityBadge(task, node.querySelector(".task-priority-container"));
    if (simpleRow || taskPrefs.showReminder === false) node.querySelector(".task-reminder-container").innerHTML = "";
    else renderReminderBadge(task, node.querySelector(".task-reminder-container"));
    // La etiqueta de lista solo aparece si la fila no cuelga de una cabecera
    // de grupo que ya la nombre (lo decide _buildTaskNode y queda en el nodo).
    if (simpleRow || taskPrefs.showList === false) node.querySelector(".task-list-container").innerHTML = "";
    else renderListBadge(node._showList ? node._project : null,
                    node.querySelector(".task-list-container"));
    renderDueBadge(task, node.querySelector(".task-due-container"));
    if (!simpleRow && taskPrefs.showRecur === false) node.querySelector(".task-recur-container").innerHTML = "";
    else renderRecurBadge(task, node.querySelector(".task-recur-container"));
  }

  // El panel de detalle (columna derecha) sustituye a la expansión en la
  // fila — solo marcamos si su panel está abierto (barra de acento).
  node.classList.toggle("detail-open", openDetailTaskId === task.id);

  // Select mode visual
  const selectCb = node.querySelector(".task-select-cb");
  if (selectCb) {
    const isSelected = selectedTaskIds.has(task.id);
    selectCb.checked = isSelected;
    node.classList.toggle("selected", isSelected);
  }

  // El texto se corta con puntos suspensivos: el tooltip lo deja leer
  // entero (mismo detalle que la fila de v1).
  text.title = task.text;
}

/**
 * Crea un nodo de tarea desde el template, ata todos los listeners
 * (que capturan `task` y `project` en closure), y aplica el estado
 * visual inicial vía _updateTaskNode. Se cachea la referencia al
 * task en `node._task` para detectar cambios de identidad.
 */
function _buildTaskNode(task, project, showList) {
    const node       = template.content.firstElementChild.cloneNode(true);
    node.setAttribute("data-task-id", task.id);
    // El proyecto de la fila y si debe mostrar su etiqueta de lista viajan
    // con el nodo: _updateTaskNode los reutiliza al refrescar sin rebuild.
    node._project    = project;
    node._showList   = !!showList;
    node.setAttribute("draggable", "false");
    // Color del proyecto → el check de completar usa este acento.
    node.style.setProperty("--task-accent", _projectColor(project));

    const checkbox = node.querySelector(".task-toggle");
    const text     = node.querySelector(".task-text");

    // Badge de fecha vencida: pulsable, mueve la tarea a hoy sin abrir el panel.
    node.querySelector(".task-due-container").addEventListener("click", function(e) {
      const btn = e.target.closest('[data-due-action="move-today"]');
      if (!btn) return;
      e.stopPropagation();
      task.dueDate = _localDateISO(new Date());
      saveAndRender();
    });

    checkbox.addEventListener("click", function(e) { e.stopPropagation(); });
    // Sin animación de fila: marcar aplica y repinta en el acto. Antes se
    // esperaba a que corriese (460ms al completar, 220 al descompletar).
    checkbox.addEventListener("change", function() {
      task.done = checkbox.checked;
      if (task.done && task.recurDays) {
        // La tarea SE QUEDA marcada y con su fecha: completarla no la hacía
        // desaparecer de Hoy en el acto, que es lo que se veía antes al
        // adelantar la fecha aquí mismo. El salto a la siguiente vuelta lo
        // hace `_reactivarRecurrentes()` cuando llega el día.
        saveAndRender();
        _showRecurToast(task.recurDays, _proximaRecurrencia(task));
        return;
      }
      saveAndRender();
    });

    // Sin renombrar por doble clic: la fila entera es un solo objetivo
    // clicable (abre el detalle). Para renombrar está «Renombrar» en el
    // menú de la tarea, que llama al mismo startInlineEdit.

    function openTaskActionsMenu(anchorOrPoint) {
      if (selectMode) return;
      closeCtxMenu();

      var items = [
        { label: t("action.rename"),   action: function() { startInlineEdit(text, task); } },
        { label: t("detail.open"),     action: function() { openTaskDetail(task.id, project.id); } },
        { label: t("action.duplicate"), action: function() { duplicateTask(task, project); } },
        null,
        {
          label: t("task.move_to_project"),
          action: async function() {
            var targetId = await modalProjectPicker(project.id);
            if (!targetId) return;
            var target = projects.find(function(p) { return p.id === targetId; });
            if (!target) return;
            var idx = project.tasks.findIndex(function(tk) { return tk.id === task.id; });
            if (idx === -1) return;
            var moved = project.tasks.splice(idx, 1)[0];
            if (openDetailTaskId === moved.id) openDetailProjectId = target.id;
            target.tasks.unshift(moved);
            saveAndRender();
          }
        },
        { label: t("action.delete"), danger: true, action: function() { deleteTaskWithUndo(task, project); } },
      ];

      var menu = _buildCtxMenu(items);
      if (anchorOrPoint && typeof anchorOrPoint.x === "number") {
        positionCtxMenuAt(menu, anchorOrPoint.x, anchorOrPoint.y);
      } else {
        positionCtxMenu(menu, anchorOrPoint);
      }
      _ctxMenu = menu;
      requestAnimationFrame(function() {
        _ctxCloseHandler = function(ev) {
          if (!menu.contains(ev.target)) closeCtxMenu();
        };
        document.addEventListener("mousedown", _ctxCloseHandler);
      });
    }

    // ── Menú contextual (click derecho) ──────────────────────
    node.addEventListener("contextmenu", async function(e) {
      if (e.target.closest("button, input")) return;
      e.preventDefault();
      openTaskActionsMenu({ x: e.clientX, y: e.clientY });
    });

    // ── Pulsar la fila abre el panel de detalle; volver a pulsarla lo
    // cierra. Antes cerrarlo pedía doble clic. ──
    node.addEventListener("click", function(e) {
      if (e.target.closest("button")) return;
      if (selectMode) {
        e.preventDefault();
        toggleTaskSelection(task.id, node);
        return;
      }
      if (e.target.closest("input")) return;
      // Modo simple: la fila no tiene panel de detalle — se edita fecha y
      // repetir en el sitio, con un popover ligero anclado a la propia fila.
      if (isSimpleMobile()) { _openInlineDateRecurPopover(task, node); return; }
      if (openDetailTaskId === task.id) { closeTaskDetail(); return; }
      openTaskDetail(task.id, project.id);
    });
    node.addEventListener("keydown", function(e) {
      if (e.target.closest("button, input")) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectMode) { toggleTaskSelection(task.id, node); return; }
        if (isSimpleMobile()) { _openInlineDateRecurPopover(task, node); return; }
        // Alterna, como el clic y como anuncia el modal de atajos.
        if (openDetailTaskId === task.id) { closeTaskDetail(); return; }
        openTaskDetail(task.id, project.id);
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        startInlineEdit(text, task);
        return;
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        checkbox.click();
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        deleteTaskWithUndo(task, project);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(taskList.querySelectorAll(".task-item"));
        const idx = items.indexOf(node);
        if (idx > 0) items[idx - 1].focus();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const items = Array.from(taskList.querySelectorAll(".task-item"));
        const idx = items.indexOf(node);
        if (idx < items.length - 1) items[idx + 1].focus();
        return;
      }
    });

    // ── Checkbox de selección ─────────────────────────────────
    const selectCb = node.querySelector(".task-select-cb");
    if (selectCb) {
      selectCb.checked = selectedTaskIds.has(task.id);
      if (selectedTaskIds.has(task.id)) node.classList.add("selected");
      selectCb.addEventListener("change", function(e) {
        e.stopPropagation();
        toggleTaskSelection(task.id, node);
      });
      selectCb.addEventListener("click", function(e) { e.stopPropagation(); });
    }

    initDragDrop(node, task.id);
    if (window.matchMedia("(max-width: 768px)").matches) {
      initSwipeGesture(node, task, project);
    }

    // Marcar referencia para detectar cambio de objeto en renders
    // futuros y aplicar el estado visual inicial.
    node._task = task;
    _updateTaskNode(node, task);
    return node;
}

// ═══════════════════════════════════════════════════════════════
// PANEL DE DETALLE DE TAREA (columna derecha, prototipo v1)
//
// Las características de la tarea (prioridad, estado, fecha,
// repetición, aviso, nota, subtareas, mover de lista) ya no se editan
// en la fila — se editan aquí, en un panel fijo a la derecha, con el
// mismo mecanismo de "empuje" (ancho animado) que el sidebar.
// ═══════════════════════════════════════════════════════════════

const _detailPanelEls = {
  wrap:         document.getElementById("task-detail-wrap"),
  back:         document.getElementById("task-detail-back"),
  backLabel:    document.getElementById("task-detail-back-label"),
  menuBtn:      document.getElementById("task-detail-menu-btn"),
  close:        document.getElementById("task-detail-close"),
  toggle:       document.getElementById("task-detail-toggle"),
  title:        document.getElementById("task-detail-title"),
  comment:      document.getElementById("task-detail-comment"),
  priority:     document.getElementById("task-detail-priority"),
  dateField:    document.getElementById("task-detail-date-field"),
  dateBtn:      document.getElementById("task-detail-date-btn"),
  dateText:     document.getElementById("task-detail-date-text"),
  recurField:   document.getElementById("task-detail-recur-field"),
  recurBtn:     document.getElementById("task-detail-recur-btn"),
  recurText:    document.getElementById("task-detail-recur-text"),
  reminderField:document.getElementById("task-detail-reminder-field"),
  reminderBtn:  document.getElementById("task-detail-reminder-btn"),
  reminderText: document.getElementById("task-detail-reminder-text"),
  subtasks:     document.getElementById("task-detail-subtasks"),
  subtaskForm:  document.getElementById("task-detail-subtask-form"),
  subtaskInput: document.getElementById("task-detail-subtask-input"),
  projectField: document.getElementById("task-detail-project-field"),
  projectBtn:   document.getElementById("task-detail-project-btn"),
  projectText:  document.getElementById("task-detail-project-text"),
  projectChevron: document.getElementById("task-detail-project-chevron"),
  deleteBtn:    document.getElementById("task-detail-delete-btn"),
};

/** Busca la tarea/proyecto abiertos en el panel. Null si ya no existen
 *  (borrados, movidos por sync…) — el caller debe cerrar el panel. */
function _getOpenDetailTask() {
  if (!openDetailTaskId || !openDetailProjectId) return null;
  const project = projects.find(function(p) { return p.id === openDetailProjectId; });
  if (!project) return null;
  const task = project.tasks.find(function(tk) { return tk.id === openDetailTaskId; });
  if (!task) return null;
  return { task: task, project: project };
}

function openTaskDetail(taskId, projectId) {
  if (selectMode) return;
  openDetailTaskId    = taskId;
  openDetailProjectId = projectId;
  if (_detailPanelEls.wrap) _detailPanelEls.wrap.classList.add("task-detail-wrap--open");
  document.body.classList.add("task-detail-active");
  _renderTaskDetail();
  renderTasks(); // refresca la barra de acento en la fila abierta
  // .task-detail-wrap anima su ancho (62px → 100%/340px) durante
  // --shell-collapse (320ms). _renderTaskDetail() ya llamó a
  // _autoGrowTitle() en ese mismo instante, con el textarea todavía
  // estrecho a mitad de esa transición — el título se envolvía en un
  // montón de líneas y esa altura enorme se quedaba fijada para
  // siempre (en móvil, literalmente toda la pantalla). Al terminar la
  // transición de ancho, se vuelve a medir con el layout ya asentado.
  if (_detailPanelEls.wrap) {
    _detailPanelEls.wrap.addEventListener("transitionend", function onEnd(e) {
      if (e.propertyName !== "width" || e.target !== _detailPanelEls.wrap) return;
      _detailPanelEls.wrap.removeEventListener("transitionend", onEnd);
      _autoGrowTitle();
    });
  }
}

function closeTaskDetail() {
  if (!openDetailTaskId) return;
  openDetailTaskId    = null;
  openDetailProjectId = null;
  if (_detailPanelEls.wrap) _detailPanelEls.wrap.classList.remove("task-detail-wrap--open");
  document.body.classList.remove("task-detail-active");
  renderTasks(); // quita la barra de acento de la fila que tenía el panel abierto
}

// ═══════════════════════════════════════════════════════════════
// POPOVERS DE CAMPO (fecha, hora, repetir, aviso, lista)
//
// Sustituyen a los modal-box del prototipo anterior: se anclan al
// campo del panel (como en el prototipo v1), no tapan la pantalla.
// Solo uno puede estar abierto a la vez; clic fuera o Escape cierra.
// ═══════════════════════════════════════════════════════════════
let _openPopover = null; // { el, anchorBtn, onDoc, onEsc }

function _closeFieldPopover() {
  if (!_openPopover) return;
  const p = _openPopover;
  _openPopover = null;
  document.removeEventListener("mousedown", p.onDoc, true);
  document.removeEventListener("keydown", p.onEsc, true);
  if (p.anchorBtn) p.anchorBtn.classList.remove("field-btn-open");
  p.el.remove();
}

/**
 * Abre un popover anclado a `fieldEl` (el wrapper `.task-detail-field`,
 * para que ocupe todo el ancho del campo como en el prototipo).
 * Si ya había uno abierto para el mismo botón, simplemente lo cierra
 * (toggle). `buildFn(pop, close)` rellena el contenido.
 */
function _openFieldPopover(fieldEl, anchorBtn, placement, buildFn) {
  const wasOpenForSameBtn = _openPopover && _openPopover.anchorBtn === anchorBtn;
  _closeFieldPopover();
  if (wasOpenForSameBtn) return;

  const pop = document.createElement("div");
  pop.className = "field-popover" + (placement === "up" ? " field-popover--up" : "");

  // En móvil, dentro de una fila a dos columnas (Prioridad+Fecha,
  // Repetir+Recordatorio), el popover se monta como HERMANO de la fila
  // en vez de dentro del campo: si viviera dentro, el campo abierto tenía
  // que ocupar toda la fila para que el popover cupiera entero, dejando al
  // campo vecino huérfano a media columna con un hueco muerto al lado. Como
  // hermano de la fila, ambos campos se quedan intactos arriba y el
  // desplegable aparece debajo, a todo el ancho del panel.
  const row = fieldEl.closest(".task-detail-field-row");
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (row && isMobile) {
    row.parentNode.insertBefore(pop, row.nextSibling);
  } else {
    fieldEl.appendChild(pop);
  }
  if (anchorBtn) anchorBtn.classList.add("field-btn-open");

  function close() { _closeFieldPopover(); }
  buildFn(pop, close);
  if (window.lucide) window.lucide.createIcons({ nodes: [pop] });

  const onDoc = function(e) { if (!fieldEl.contains(e.target) && !pop.contains(e.target)) close(); };
  const onEsc = function(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } };
  setTimeout(function() {
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onEsc, true);
  }, 0);
  _openPopover = { el: pop, anchorBtn: anchorBtn, onDoc: onDoc, onEsc: onEsc };
}

/** ISO YYYY-MM-DD en hora LOCAL (no UTC como Date#toISOString). */
function _localDateISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function _openDatePopover(fieldEl, anchorBtn) {
  const openTask = _getOpenDetailTask();
  if (!openTask) return;
  const task = openTask.task;
  const init = task.dueDate ? new Date(task.dueDate + "T00:00") : new Date();
  let vy = init.getFullYear();
  let vm = init.getMonth();

  _openFieldPopover(fieldEl, anchorBtn, "down", function(pop, close) {
    function render() {
      const localeD = getLang() === "en" ? "en-GB" : "es-ES";
      const todayISO = _localDateISO(new Date());
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = _localDateISO(tomorrow);
      const inWeek = new Date(); inWeek.setDate(inWeek.getDate() + 7);
      const inWeekISO = _localDateISO(inWeek);
      const first = new Date(vy, vm, 1);
      const monthTitle = first.toLocaleDateString(localeD, { month: "long", year: "numeric" });
      const offset = (first.getDay() + 6) % 7; // lunes = 0
      const nDays = new Date(vy, vm + 1, 0).getDate();
      const mondayRef = new Date(2024, 0, 1); // un lunes
      const dowNames = Array.from({ length: 7 }, function(_, i) {
        const d = new Date(mondayRef); d.setDate(mondayRef.getDate() + i);
        return d.toLocaleDateString(localeD, { weekday: "narrow" }).toUpperCase();
      });

      let cellsHtml = "";
      for (let i = 0; i < offset; i++) cellsHtml += '<span class="field-popover-cal-empty">·</span>';
      for (let day = 1; day <= nDays; day++) {
        const iso = vy + "-" + String(vm + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
        const cls = ["field-popover-cal-day"];
        if (iso === task.dueDate) cls.push("field-popover-cal-day--selected");
        else if (iso === todayISO) cls.push("field-popover-cal-day--today");
        cellsHtml += '<span class="' + cls.join(" ") + '" data-day-iso="' + iso + '">' + day + '</span>';
      }

      pop.innerHTML =
        '<div class="field-popover-chips">' +
          '<button type="button" class="field-popover-chip' + (task.dueDate === todayISO ? " active" : "") + '" data-quick="today">' + t("date.today") + '</button>' +
          '<button type="button" class="field-popover-chip' + (task.dueDate === tomorrowISO ? " active" : "") + '" data-quick="tomorrow">' + t("date.tomorrow") + '</button>' +
          '<button type="button" class="field-popover-chip' + (task.dueDate === inWeekISO ? " active" : "") + '" data-quick="week">' + t("date.in_week") + '</button>' +
          (task.dueDate ? '<button type="button" class="field-popover-chip field-popover-chip--clear" data-quick="clear">' + t("modal.clear") + '</button>' : "") +
        '</div>' +
        '<div class="field-popover-cal-head">' +
          '<button type="button" class="field-popover-cal-nav" data-cal-nav="-1" aria-label="Mes anterior">‹</button>' +
          '<span class="field-popover-cal-title">' + escHtml(monthTitle) + '</span>' +
          '<button type="button" class="field-popover-cal-nav" data-cal-nav="1" aria-label="Mes siguiente">›</button>' +
        '</div>' +
        '<div class="field-popover-cal-grid">' +
          dowNames.map(function(d) { return '<span class="field-popover-cal-dow">' + d + '</span>'; }).join("") +
          cellsHtml +
        '</div>';

      pop.querySelector('[data-cal-nav="-1"]').addEventListener("click", function() {
        vm--; if (vm < 0) { vm = 11; vy--; }
        render();
      });
      pop.querySelector('[data-cal-nav="1"]').addEventListener("click", function() {
        vm++; if (vm > 11) { vm = 0; vy++; }
        render();
      });
      pop.querySelectorAll("[data-quick]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          const q = btn.dataset.quick;
          task.dueDate = q === "today" ? todayISO : q === "tomorrow" ? tomorrowISO : q === "week" ? inWeekISO : null;
          saveAndRender();
          close();
        });
      });
      pop.querySelectorAll("[data-day-iso]").forEach(function(el) {
        el.addEventListener("click", function() {
          task.dueDate = el.dataset.dayIso;
          saveAndRender();
          close();
        });
      });
    }
    render();
  });
}

function _openRecurPopover(fieldEl, anchorBtn) {
  const openTask = _getOpenDetailTask();
  if (!openTask) return;
  const task = openTask.task;
  const presets = [
    { label: t("recur.daily"),        days: 1  },
    { label: t("recur.every_2_days"), days: 2  },
    { label: t("recur.weekly"),       days: 7  },
    { label: t("recur.biweekly"),     days: 14 },
    { label: t("recur.monthly"),      days: 30 },
  ];

  _openFieldPopover(fieldEl, anchorBtn, "down", function(pop, close) {
    const rowsHtml = presets.map(function(p) {
      const active = task.recurDays === p.days;
      return '<button type="button" class="field-popover-row' + (active ? " active" : "") + '" data-days="' + p.days + '">' +
        '<span class="field-popover-row-label">' + p.label + '</span>' +
        (active ? '<i data-lucide="check"></i>' : "") +
      '</button>';
    }).join("");
    const isPreset = task.recurDays != null && presets.some(function(p) { return p.days === task.recurDays; });

    pop.innerHTML =
      '<div class="field-popover-list">' + rowsHtml + '</div>' +
      '<div class="field-popover-sep"></div>' +
      '<div class="field-popover-input-row">' +
        '<input type="number" min="1" max="3650" placeholder="' + t("modal_recur.custom_placeholder") + '" value="' +
          (task.recurDays && !isPreset ? task.recurDays : "") + '" />' +
        (task.recurDays ? '<button type="button" class="field-popover-chip field-popover-chip--clear">' + t("modal.clear") + '</button>' : "") +
      '</div>';

    pop.querySelectorAll("[data-days]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        task.recurDays = parseInt(btn.dataset.days, 10);
        saveAndRender();
        close();
      });
    });
    const input = pop.querySelector('input[type="number"]');
    input.addEventListener("keydown", function(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const v = parseInt(input.value, 10);
      task.recurDays = (isNaN(v) || v <= 0) ? null : Math.min(v, 3650);
      saveAndRender();
      close();
    });
    const clearBtn = pop.querySelector(".field-popover-chip--clear");
    if (clearBtn) clearBtn.addEventListener("click", function() {
      task.recurDays = null;
      saveAndRender();
      close();
    });
  });
}

// ─── POPOVER DE FILA (modo simple) ──────────────────────────
// En modo simple, tocar una fila no abre el panel de detalle completo:
// abre este popover ligero, anclado a la propia fila, con solo fecha y
// repetir — los dos únicos campos que ese modo expone. Reutiliza el
// mismo calendario/presets que _openDatePopover/_openRecurPopover, pero
// anclado con `position: fixed` (como en quick-capture.js) en vez de
// depender del panel de detalle, y cierra tras cada elección — igual
// que el resto de popovers de campo de esta sección.
let _inlineRowPopoverEl     = null;
let _inlineRowPopoverTaskId = null;
let _inlineRowPopoverCleanup = null;

function _closeInlineRowPopover() {
  if (!_inlineRowPopoverEl) return;
  if (_inlineRowPopoverCleanup) _inlineRowPopoverCleanup();
  _inlineRowPopoverEl.remove();
  _inlineRowPopoverEl = null;
  _inlineRowPopoverTaskId = null;
  _inlineRowPopoverCleanup = null;
}

/** Coloca un popover `position: fixed` bajo (o, si no cabe, sobre) la fila. */
function _placeInlineRowPopover(pop, anchorEl) {
  const MARGIN = 8;
  const r      = anchorEl.getBoundingClientRect();
  const width  = Math.min(280, window.innerWidth - MARGIN * 2);
  pop.style.position  = "fixed";
  pop.style.width     = width + "px";
  pop.style.overflowY = "auto";
  let left = Math.max(MARGIN, Math.min(r.left, window.innerWidth - width - MARGIN));
  pop.style.left  = left + "px";
  pop.style.right = "auto";
  const spaceBelow = window.innerHeight - r.bottom - MARGIN;
  const spaceAbove = r.top - MARGIN;
  const maxH       = Math.min(420, Math.max(spaceBelow, spaceAbove));
  if (spaceBelow >= Math.min(maxH, 380) || spaceBelow >= spaceAbove) {
    pop.style.top = (r.bottom + 6) + "px";
    pop.style.bottom = "auto";
    pop.style.maxHeight = spaceBelow + "px";
  } else {
    pop.style.bottom = (window.innerHeight - r.top + 6) + "px";
    pop.style.top = "auto";
    pop.style.maxHeight = spaceAbove + "px";
  }
}

function _openInlineDateRecurPopover(task, anchorEl) {
  const wasOpenForSameTask = _inlineRowPopoverEl && _inlineRowPopoverTaskId === task.id;
  _closeInlineRowPopover();
  if (wasOpenForSameTask) return;

  let vy, vm;
  (function resetCalMonth() {
    const init = task.dueDate ? new Date(task.dueDate + "T00:00") : new Date();
    vy = init.getFullYear();
    vm = init.getMonth();
  })();

  const RECUR_PRESETS = [
    { label: t("recur.daily"),        days: 1  },
    { label: t("recur.every_2_days"), days: 2  },
    { label: t("recur.weekly"),       days: 7  },
    { label: t("recur.biweekly"),     days: 14 },
    { label: t("recur.monthly"),      days: 30 },
  ];

  const pop = document.createElement("div");
  pop.className = "field-popover field-popover--fixed";

  function renderPop() {
    const localeD     = getLang() === "en" ? "en-GB" : "es-ES";
    const todayISO    = _localDateISO(new Date());
    const tomorrow    = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = _localDateISO(tomorrow);
    const inWeek      = new Date(); inWeek.setDate(inWeek.getDate() + 7);
    const inWeekISO   = _localDateISO(inWeek);
    const first       = new Date(vy, vm, 1);
    const monthTitle  = first.toLocaleDateString(localeD, { month: "long", year: "numeric" });
    const offset      = (first.getDay() + 6) % 7; // lunes = 0
    const nDays       = new Date(vy, vm + 1, 0).getDate();
    const mondayRef   = new Date(2024, 0, 1);
    const dowNames    = Array.from({ length: 7 }, function(_, i) {
      const d = new Date(mondayRef); d.setDate(mondayRef.getDate() + i);
      return d.toLocaleDateString(localeD, { weekday: "narrow" }).toUpperCase();
    });

    let cellsHtml = "";
    for (let i = 0; i < offset; i++) cellsHtml += '<span class="field-popover-cal-empty">·</span>';
    for (let day = 1; day <= nDays; day++) {
      const iso = vy + "-" + String(vm + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
      const cls = ["field-popover-cal-day"];
      if (iso === task.dueDate) cls.push("field-popover-cal-day--selected");
      else if (iso === todayISO) cls.push("field-popover-cal-day--today");
      cellsHtml += '<span class="' + cls.join(" ") + '" data-day-iso="' + iso + '">' + day + '</span>';
    }

    const recurRows = RECUR_PRESETS.map(function(p) {
      const active = task.recurDays === p.days;
      return '<button type="button" class="field-popover-row' + (active ? " active" : "") + '" data-recur-days="' + p.days + '">' +
        '<span class="field-popover-row-label">' + p.label + '</span>' +
        (active ? '<i data-lucide="check"></i>' : "") +
      '</button>';
    }).join("");

    pop.innerHTML =
      '<div class="field-popover-section-label">' + t("detail.due_date") + '</div>' +
      '<div class="field-popover-chips">' +
        '<button type="button" class="field-popover-chip' + (task.dueDate === todayISO ? " active" : "") + '" data-quick="today">' + t("date.today") + '</button>' +
        '<button type="button" class="field-popover-chip' + (task.dueDate === tomorrowISO ? " active" : "") + '" data-quick="tomorrow">' + t("date.tomorrow") + '</button>' +
        '<button type="button" class="field-popover-chip' + (task.dueDate === inWeekISO ? " active" : "") + '" data-quick="week">' + t("date.in_week") + '</button>' +
        (task.dueDate ? '<button type="button" class="field-popover-chip field-popover-chip--clear" data-quick="clear">' + t("modal.clear") + '</button>' : "") +
      '</div>' +
      '<div class="field-popover-cal-head">' +
        '<button type="button" class="field-popover-cal-nav" data-cal-nav="-1" aria-label="Mes anterior">‹</button>' +
        '<span class="field-popover-cal-title">' + escHtml(monthTitle) + '</span>' +
        '<button type="button" class="field-popover-cal-nav" data-cal-nav="1" aria-label="Mes siguiente">›</button>' +
      '</div>' +
      '<div class="field-popover-cal-grid">' +
        dowNames.map(function(d) { return '<span class="field-popover-cal-dow">' + d + '</span>'; }).join("") +
        cellsHtml +
      '</div>' +
      '<div class="field-popover-sep"></div>' +
      '<div class="field-popover-section-label">' + t("detail.recur") + '</div>' +
      '<div class="field-popover-list">' + recurRows + '</div>' +
      (task.recurDays ? '<div class="field-popover-sep"></div>' +
        '<button type="button" class="field-popover-row field-popover-row--clear" data-recur-clear>' +
          '<span class="field-popover-row-label">' + t("modal.clear") + '</span>' +
        '</button>' : "");

    if (window.lucide) window.lucide.createIcons({ nodes: [pop] });

    pop.querySelector('[data-cal-nav="-1"]').addEventListener("click", function() {
      vm--; if (vm < 0) { vm = 11; vy--; }
      renderPop();
    });
    pop.querySelector('[data-cal-nav="1"]').addEventListener("click", function() {
      vm++; if (vm > 11) { vm = 0; vy++; }
      renderPop();
    });
    pop.querySelectorAll("[data-quick]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const q = btn.dataset.quick;
        task.dueDate = q === "today" ? todayISO : q === "tomorrow" ? tomorrowISO : q === "week" ? inWeekISO : null;
        saveAndRender();
        _closeInlineRowPopover();
      });
    });
    pop.querySelectorAll("[data-day-iso]").forEach(function(el) {
      el.addEventListener("click", function() {
        task.dueDate = el.dataset.dayIso;
        saveAndRender();
        _closeInlineRowPopover();
      });
    });
    pop.querySelectorAll("[data-recur-days]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        task.recurDays = parseInt(btn.dataset.recurDays, 10);
        saveAndRender();
        _closeInlineRowPopover();
      });
    });
    const recurClearBtn = pop.querySelector("[data-recur-clear]");
    if (recurClearBtn) recurClearBtn.addEventListener("click", function() {
      task.recurDays = null;
      saveAndRender();
      _closeInlineRowPopover();
    });
  }
  renderPop();

  document.body.appendChild(pop);
  _placeInlineRowPopover(pop, anchorEl);

  const onDoc = function(e) { if (!anchorEl.contains(e.target) && !pop.contains(e.target)) _closeInlineRowPopover(); };
  const onEsc = function(e) { if (e.key === "Escape") { e.stopPropagation(); _closeInlineRowPopover(); } };
  setTimeout(function() {
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onEsc, true);
  }, 0);

  _inlineRowPopoverEl      = pop;
  _inlineRowPopoverTaskId  = task.id;
  _inlineRowPopoverCleanup = function() {
    document.removeEventListener("mousedown", onDoc, true);
    document.removeEventListener("keydown", onEsc, true);
  };
}

function _openReminderPopover(fieldEl, anchorBtn) {
  const openTask = _getOpenDetailTask();
  if (!openTask) return;
  const task = openTask.task;

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function toLocalISO(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
           "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  const now = new Date();
  const presets = [];
  presets.push({ label: t("reminder.preset.in_1h"), iso: toLocalISO(new Date(now.getTime() + 60 * 60 * 1000)) });
  presets.push({ label: t("reminder.preset.in_4h"), iso: toLocalISO(new Date(now.getTime() + 4 * 60 * 60 * 1000)) });
  const eveningToday = new Date(now); eveningToday.setHours(18, 0, 0, 0);
  if (eveningToday.getTime() > now.getTime()) {
    presets.push({ label: t("reminder.preset.this_evening"), iso: toLocalISO(eveningToday) });
  }
  const tomMorning = new Date(now); tomMorning.setDate(tomMorning.getDate() + 1); tomMorning.setHours(9, 0, 0, 0);
  presets.push({ label: t("reminder.preset.tomorrow_9am"), iso: toLocalISO(tomMorning) });
  const in2 = new Date(now); in2.setDate(in2.getDate() + 2); in2.setHours(9, 0, 0, 0);
  presets.push({ label: t("reminder.preset.in_2_days"), iso: toLocalISO(in2) });

  _openFieldPopover(fieldEl, anchorBtn, "down", function(pop, close) {
    const currentVal = (task.reminderAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(task.reminderAt))
      ? task.reminderAt.slice(0, 16)
      : "";

    pop.innerHTML =
      '<div class="field-popover-list">' +
        presets.map(function(p) {
          return '<button type="button" class="field-popover-row" data-iso="' + p.iso + '"><span class="field-popover-row-label">' + p.label + '</span></button>';
        }).join("") +
      '</div>' +
      '<div class="field-popover-sep"></div>' +
      '<div class="field-popover-input-row">' +
        '<input type="datetime-local" value="' + currentVal + '" />' +
        (task.reminderAt ? '<button type="button" class="field-popover-chip field-popover-chip--clear">' + t("modal.clear") + '</button>' : "") +
      '</div>';

    function afterChange() {
      saveAndRender();
      if (window.AnsoNotif && window.AnsoNotif.scheduleTaskReminders) {
        window.AnsoNotif.scheduleTaskReminders(projects);
      }
    }

    pop.querySelectorAll("[data-iso]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        task.reminderAt = btn.dataset.iso;
        afterChange();
        close();
      });
    });
    const input = pop.querySelector('input[type="datetime-local"]');
    input.addEventListener("change", function() {
      if (!input.value) return;
      task.reminderAt = input.value;
      afterChange();
      close();
    });
    const clearBtn = pop.querySelector(".field-popover-chip--clear");
    if (clearBtn) clearBtn.addEventListener("click", function() {
      task.reminderAt = null;
      afterChange();
      close();
    });
  });
}

function _openProjectPopover(fieldEl, anchorBtn) {
  const openTask = _getOpenDetailTask();
  if (!openTask) return;
  const currentProjectId = openTask.project.id;

  _openFieldPopover(fieldEl, anchorBtn, "up", function(pop, close) {
    const rowsHtml = projects.filter(function(p) { return !p.archived; }).map(function(p) {
      const active = p.id === currentProjectId;
      return '<button type="button" class="field-popover-row' + (active ? " active" : "") + '" data-project-id="' + p.id + '"' +
          ' style="--dot-color:' + escHtml(_projectColor(p)) + '">' +
        '<span class="field-popover-row-dot"></span>' +
        '<span class="field-popover-row-label">' + escHtml(p.name) + '</span>' +
        (active ? '<i data-lucide="check"></i>' : "") +
      '</button>';
    }).join("");
    pop.innerHTML = '<div class="field-popover-list">' + rowsHtml + '</div>';

    pop.querySelectorAll("[data-project-id]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        const targetId = btn.dataset.projectId;
        close();
        if (targetId === currentProjectId) return;
        const stillOpen = _getOpenDetailTask();
        if (!stillOpen) return;
        const target = projects.find(function(p) { return p.id === targetId; });
        if (!target) return;
        const idx = stillOpen.project.tasks.findIndex(function(tk) { return tk.id === stillOpen.task.id; });
        if (idx === -1) return;
        const moved = stillOpen.project.tasks.splice(idx, 1)[0];
        target.tasks.unshift(moved);
        openDetailProjectId = target.id;
        saveAndRender();
      });
    });
  });
}

function _formatReminderLabel(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return t("detail.no_reminder");
  const localeR = getLang() === "en" ? "en-GB" : "es-ES";
  return d.toLocaleString(localeR, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Ajusta el alto del textarea del título a su contenido — sin esto un
 *  título largo quedaba en una caja de 2 líneas con scroll interno en
 *  vez de crecer, y no se podía leer entero. */
function _autoGrowTitle() {
  var el = _detailPanelEls.title;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/** Pinta el panel con el estado actual de la tarea abierta (si hay alguna). */
function _renderTaskDetail() {
  const open = _getOpenDetailTask();
  if (!open) { closeTaskDetail(); return; }
  const task = open.task, project = open.project;
  const els  = _detailPanelEls;

  els.toggle.checked = task.done;
  if (document.activeElement !== els.title)   els.title.value   = task.text;
  if (document.activeElement !== els.comment) els.comment.value = task.comment || "";
  els.title.classList.toggle("done", task.done);
  _autoGrowTitle();

  // Sin niveles: el botón único se activa si la tarea tiene cualquier
  // prioridad puesta (solo "high" puede llegar aquí, pero un valor
  // heredado de datos viejos —"medium"/"low"— también debe leerse
  // como "importante").
  els.priority.classList.toggle("active", !!task.priority);

  els.dateText.textContent     = task.dueDate    ? formatDueLabel(task.dueDate)     : t("detail.no_date");
  els.recurText.textContent    = task.recurDays  ? formatRecurLabel(task.recurDays) : t("detail.no_recur");
  els.reminderText.textContent = task.reminderAt ? _formatReminderLabel(task.reminderAt) : t("detail.no_reminder");
  els.projectText.textContent  = project.name;

  // Color del botón de fecha/hora: mismo código que el due-badge de la
  // fila (hoy / vencida / con el color de la lista) — sin esto el panel
  // no reflejaba ninguna de las señales de urgencia que sí se ven fuera.
  var dueState = task.dueDate ? getDueDateState(task.dueDate) : null;
  // `--proj-color` se pone en el CAMPO (el contenedor), no en el botón:
  // la etiqueta en píldora de arriba (.task-detail-label) también lo
  // necesita para teñirse a juego (ver :has() en CSS), y una custom
  // property en el estilo inline del botón no la heredan sus hermanos.
  if (els.dateField) {
    if (task.dueDate) els.dateField.style.setProperty("--proj-color", _projectColor(project));
    else els.dateField.style.removeProperty("--proj-color");
  }
  [[els.dateBtn, !!task.dueDate]].forEach(function(pair) {
    var btn = pair[0], active = pair[1];
    btn.classList.toggle("task-detail-field-btn--has-value", active);
    btn.classList.toggle("task-detail-field-btn--due-today", active && !!dueState && dueState.cls === "due-today");
    btn.classList.toggle("task-detail-field-btn--due-overdue", active && !!dueState && dueState.cls === "due-overdue");
  });
  els.reminderBtn.classList.toggle("task-detail-field-btn--reminder-set", !!task.reminderAt);
  els.recurBtn.classList.toggle("task-detail-field-btn--recur-set", !!task.recurDays);
  // Lista: siempre tiene una (Inbox si no hay otra), así que siempre se
  // tiñe de su color — igual que el punto de la fila en la sidebar.
  if (els.projectField) els.projectField.style.setProperty("--proj-color", _projectColor(project));
  if (els.projectBtn) els.projectBtn.classList.add("task-detail-field-btn--has-value");
  if (els.backLabel) els.backLabel.textContent = project.name;

  renderSubtasks(task, els.subtasks, {
    onMutation:  saveAndRenderDetail,
    onEditStart: startSubtaskInlineEdit,
  });

  if (window.lucide) window.lucide.createIcons({ nodes: [els.priority, els.subtasks] });
}

/** Ata los listeners del panel una sola vez (elementos estáticos del DOM,
 *  no plantillas por tarea) — cada handler resuelve la tarea abierta al
 *  vuelo vía _getOpenDetailTask() para no depender de closures viejas. */
function _initTaskDetailPanel() {
  const els = _detailPanelEls;
  if (!els.wrap) return;

  if (els.close) els.close.addEventListener("click", closeTaskDetail);
  if (els.back)  els.back.addEventListener("click", closeTaskDetail);

  if (els.menuBtn) {
    els.menuBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      closeCtxMenu();
      const open = _getOpenDetailTask();
      if (!open) return;
      const items = [
        { label: t("action.rename"), action: function() { els.title.focus(); els.title.select(); } },
        { label: t("action.duplicate"), action: function() {
            const cur = _getOpenDetailTask();
            if (cur) duplicateTask(cur.task, cur.project);
          } },
        { label: t("action.delete"), danger: true, action: function() {
            const cur = _getOpenDetailTask();
            if (cur) deleteTaskWithUndo(cur.task, cur.project);
          } },
      ];
      const menu = _buildCtxMenu(items);
      positionCtxMenu(menu, els.menuBtn);
      _ctxMenu = menu;
      requestAnimationFrame(function() {
        _ctxCloseHandler = function(ev) {
          if (!menu.contains(ev.target)) closeCtxMenu();
        };
        document.addEventListener("mousedown", _ctxCloseHandler);
      });
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key !== "Escape" || !openDetailTaskId) return;
    if (document.querySelector(".modal-overlay")) return; // deja que el modal se cierre primero
    closeTaskDetail();
  });

  if (els.toggle) {
    els.toggle.addEventListener("change", function() {
      const open = _getOpenDetailTask();
      if (!open) return;
      open.task.done = els.toggle.checked;
      saveAndRender();
    });
  }

  if (els.title) {
    els.title.addEventListener("input", function() {
      _autoGrowTitle();
      const open = _getOpenDetailTask();
      if (!open) return;
      open.task.text = els.title.value.slice(0, 120);
      saveProjects();
      renderTasks();
    });
    els.title.addEventListener("blur", function() {
      const open = _getOpenDetailTask();
      if (!open) return;
      const clean = capitalizeFirst(els.title.value.trim()).slice(0, 120);
      open.task.text = clean || open.task.text;
      saveAndRender();
    });
  }

  if (els.comment) {
    let commentTimer = null;
    els.comment.addEventListener("input", function() {
      const open = _getOpenDetailTask();
      if (!open) return;
      open.task.comment = els.comment.value.slice(0, 300);
      clearTimeout(commentTimer);
      commentTimer = setTimeout(function() { saveProjects(); }, 400);
    });
  }

  if (els.priority) {
    // Interruptor, no selector: cada clic alterna importante/sin marcar.
    els.priority.addEventListener("click", function() {
      const open = _getOpenDetailTask();
      if (!open) return;
      open.task.priority = open.task.priority ? null : "high";
      saveAndRender();
    });
  }

  if (els.dateBtn) {
    els.dateBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      _openDatePopover(els.dateField, els.dateBtn);
    });
  }

  if (els.recurBtn) {
    els.recurBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      _openRecurPopover(els.recurField, els.recurBtn);
    });
  }

  if (els.reminderBtn) {
    els.reminderBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      _openReminderPopover(els.reminderField, els.reminderBtn);
    });
  }

  if (els.subtaskForm) {
    els.subtaskForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const open = _getOpenDetailTask();
      if (!open) return;
      const val = els.subtaskInput.value.trim().slice(0, 120);
      if (!val) return;
      open.task.subtasks.unshift({ id: generateId(), text: val, done: false });
      els.subtaskInput.value = "";
      saveAndRenderDetail();
    });
  }

  if (els.projectBtn) {
    els.projectBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      _openProjectPopover(els.projectField, els.projectBtn);
    });
  }

  if (els.deleteBtn) {
    els.deleteBtn.addEventListener("click", function() {
      const open = _getOpenDetailTask();
      if (open) deleteTaskWithUndo(open.task, open.project);
    });
  }
}
_initTaskDetailPanel();

/**
 * Wirea el CTA "Añadir tarea" de un empty state. En móvil dispara
 * el FAB sheet (captura rápida que cae al Inbox o al proyecto activo).
 * En desktop pone foco en el input de creación de tareas si está
 * visible, o también dispara el FAB sheet como fallback.
 */
function _wireEmptyStateCTA(emptyNode) {
  var cta = emptyNode.querySelector("[data-empty-action='add']");
  if (!cta) return;
  cta.addEventListener("click", function(e) {
    e.preventDefault();
    var fab = document.getElementById("mobile-fab");
    var taskInput = document.getElementById("task-input");
    var captureBarEl = document.getElementById("capture-bar");
    if (taskInput && taskInput.offsetParent !== null) {
      taskInput.focus();
    } else if (fab && fab.offsetParent !== null) {
      fab.click();
    } else if (captureBarEl && captureBarEl.offsetParent !== null) {
      // En escritorio la creación va por la barra de captura flotante: el
      // form de #task-input está oculto ahí (ver .task-form en CSS), así
      // que sin este fallback el CTA no hacía nada.
      captureBarEl.click();
    }
  });
}

// renderSubtasks() vive en ./ui/subtasks.js

// ═══════════════════════════════════════════════════════════════
// VISTA HOY (virtual — atraviesa todos los proyectos)
// ═══════════════════════════════════════════════════════════════

function renderTodayView() {
  taskList.innerHTML = "";
  taskList.classList.remove("task-list--project", "task-list--grupos");
  taskList.classList.add("task-list--hoy");
  var today = _localDateISO(new Date());

  // Agrupar como el prototipo: vencidas / para hoy (incluye las hechas hoy,
  // para el progreso) / sin fecha como sugeridas.
  var overdueRaw = [], todaysRaw = [], nodateRaw = [];
  projects.forEach(function(p) {
    if (p.archived) return;
    (p.tasks || []).forEach(function(tk) {
      if (!tk.dueDate) { nodateRaw.push({ task: tk, project: p }); return; }
      if (tk.dueDate < today) { overdueRaw.push({ task: tk, project: p }); }
      else if (tk.dueDate === today) todaysRaw.push({ task: tk, project: p });
    });
  });

  // Las stats/anillo de progreso salen siempre del conjunto sin filtrar de
  // "para hoy" — si dependieran de lo que hay filtrado, seleccionar
  // "Hechas" en la barra falsearía el progreso mostrado.
  var hoyDoneStats  = todaysRaw.filter(function(x) { return x.task.done; }).length;
  var totalHoyStats = overdueRaw.filter(function(x) { return !x.task.done; }).length + todaysRaw.length;

  // El filtro de la barra (Todas/Pendientes/Hechas/…) se aplica sobre los
  // tres grupos — como son ortogonales al agrupado por fecha, "Vencidas"/
  // "Hoy"/"Sin fecha" del panel simplemente aíslan su sección.
  var overdue, todays, nodate;
  if (currentFilter !== "all" && TASK_FILTERS[currentFilter]) {
    var _pred = TASK_FILTERS[currentFilter];
    overdue = overdueRaw.filter(function(it) { return _pred(it.task); });
    todays  = todaysRaw.filter(function(it) { return _pred(it.task); });
    nodate  = nodateRaw.filter(function(it) { return _pred(it.task); });
  } else {
    // Sin filtro: "vencidas" y "sin fecha" mantienen su comportamiento de
    // siempre y no muestran hechas (solo "para hoy" las lleva, para el
    // anillo de progreso).
    overdue = overdueRaw.filter(function(it) { return !it.task.done; });
    todays  = todaysRaw;
    nodate  = nodateRaw.filter(function(it) { return !it.task.done; });
  }

  // Importante primero, empatando por fecha; el resto no distingue orden.
  function prioOf(x) {
    return x.task.priority === "high" ? 0 : 1;
  }
  function byDue(a, b) {
    if (a.task.dueDate !== b.task.dueDate) {
      return a.task.dueDate < b.task.dueDate ? -1 : 1;
    }
    return prioOf(a) - prioOf(b);
  }
  overdue.sort(byDue);
  todays.sort(byDue);
  nodate.sort(function(a, b) { return prioOf(a) - prioOf(b); });

  var pendingStats = totalHoyStats - hoyDoneStats;

  // Contador en el footer
  if (taskCounter) {
    taskCounter.textContent = (pendingStats === 1 ? t("today.counter_one") : t("today.counter_other"))
      .replace("{count}", String(pendingStats));
  }

  // Stats + anillo de progreso en la cabecera: siempre sobre el total real
  // del día, no sobre lo que deja ver el filtro seleccionado.
  _renderHoyHeaderExtra(hoyDoneStats, totalHoyStats, overdueRaw.filter(function(x) { return !x.task.done; }).length);

  var allClear = overdue.length === 0 && todays.length === 0;

  // ── Vencidas ──
  if (overdue.length > 0) {
    var secV = _hoySectionEl("overdue", t("hoy.overdue"), String(overdue.length),
      t("hoy.move_all"), function() { _hoySetDueToday(overdue); });
    overdue.forEach(function(it) {
      secV.list.appendChild(renderTodayItem(it.task, it.project, today, "overdue"));
    });
    taskList.appendChild(secV.li);
  }

  // ── Para hoy — siempre visible, con quick-add contextual ──
  var secH = _hoySectionEl("today", t("hoy.for_today"), hoyDoneStats + "/" + todaysRaw.length, null, null);
  todays.forEach(function(it) {
    secH.list.appendChild(renderTodayItem(it.task, it.project, today, "today"));
  });
  // Fuera de la lista, no dentro: la lista es la tarjeta redondeada y su
  // `overflow: hidden` le comía el borde. El quick-add es su propia caja
  // debajo, separada por un hueco.
  secH.li.appendChild(_hoyQuickAddEl(today));
  taskList.appendChild(secH.li);

  // ── Sin fecha · sugeridas ──
  if (nodate.length > 0) {
    var secN = _hoySectionEl("nodate", t("hoy.nodate"), String(nodate.length),
      t("hoy.schedule_all"), function() { _hoySetDueToday(nodate); });
    nodate.forEach(function(it) {
      secN.list.appendChild(renderTodayItem(it.task, it.project, today, "nodate"));
    });
    taskList.appendChild(secN.li);
  }

  // El aviso de "todo al día" va debajo de las secciones (Para hoy sigue
  // siendo el sitio para añadir algo nuevo), no por delante tapándolas.
  if (allClear) {
    // Mismas clases que el resto de empty states (Inbox / lista): antes
    // era su propio bloque (.hoy-allclear) con otra escala de badge y
    // tipografía, y las tres vistas no se veían relacionadas entre sí.
    var clearLi = document.createElement("li");
    clearLi.className = "empty-illustrated empty-illustrated--badge";
    clearLi.innerHTML =
      '<div class="empty-illustrated-badge"><i data-lucide="check"></i></div>' +
      '<p class="empty-illustrated-title">' + t("today.empty_title_full") + '</p>' +
      '<p class="empty-illustrated-sub">' + t("today.empty_sub_full") + '</p>';
    taskList.appendChild(clearLi);
  }

  if (window.lucide) lucide.createIcons();

  if (_hoyQuickAddRefocus) {
    _hoyQuickAddRefocus = false;
    var qa = taskList.querySelector(".hoy-quickadd-input");
    if (qa) qa.focus();
  }
}

// ── Piezas de la vista Hoy (según referencia/v1/hoy-view.jsx) ──

var _hoyQuickAddRefocus = false;


function _hoySectionEl(tone, label, count, actionLabel, onAction) {
  var li = document.createElement("li");
  li.className = "hoy-section hoy-section--" + tone;
  var head = document.createElement("div");
  head.className = "hoy-section-head";
  // Icono por tono, como el prototipo: sol para hoy, aviso para lo vencido
  // y bandeja para lo que no tiene fecha. Sustituye al punto de color.
  var ICONO_TONO = { overdue: "triangle-alert", today: "sun", nodate: "inbox" };
  head.insertAdjacentHTML("beforeend",
    '<i data-lucide="' + (ICONO_TONO[tone] || "sun") + '" class="hoy-section-ico"></i>' +
    '<span class="hoy-section-title"></span>' +
    '<span class="hoy-section-count"></span>' +
    '<span class="hoy-section-rule"></span>');
  head.querySelector(".hoy-section-title").textContent = label;
  // Sin paréntesis: el contador va en píldora, no entre signos.
  head.querySelector(".hoy-section-count").textContent = count;
  if (actionLabel && onAction) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hoy-section-action";
    btn.innerHTML = '<i data-lucide="arrow-right"></i> ';
    // La etiqueta va en su propio span: en móvil no cabe junto al rótulo de
    // la sección y se oculta, dejando el botón como icono con `aria-label`.
    var lbl = document.createElement("span");
    lbl.className = "hoy-section-action-label";
    lbl.textContent = actionLabel;
    btn.appendChild(lbl);
    btn.setAttribute("aria-label", actionLabel);
    btn.title = actionLabel;
    btn.addEventListener("click", onAction);
    head.appendChild(btn);
  }
  var list = document.createElement("ul");
  list.className = "hoy-section-list";
  li.appendChild(head);
  li.appendChild(list);
  return { li: li, list: list };
}

/** Acción masiva del prototipo: fija dueDate=hoy en las tareas dadas. */
function _hoySetDueToday(items) {
  if (!items || items.length === 0) return;
  var today = _localDateISO(new Date());
  items.forEach(function(it) { it.task.dueDate = today; });
  saveProjects();
  renderTasks();
  renderSidebar();
}

/** Quick-add contextual del bloque "Para hoy": crea en el Inbox con fecha hoy. */
function _hoyQuickAddEl(todayStr) {
  // `div`, no `li`: cuelga del bloque de sección, no de un `ul`, y un `li`
  // suelto ahí es HTML inválido (axe lo marca como «serious»).
  var li = document.createElement("div");
  li.className = "hoy-quickadd";
  li.innerHTML =
    '<span class="hoy-quickadd-ico"><i data-lucide="plus"></i></span>' +
    '<input type="text" class="hoy-quickadd-input" maxlength="120" autocomplete="off">' +
    '<button type="button" class="hoy-quickadd-btn" hidden><i data-lucide="plus"></i> ' +
      '<span></span></button>';
  var input = li.querySelector(".hoy-quickadd-input");
  var btn = li.querySelector(".hoy-quickadd-btn");
  input.placeholder = t("hoy.quickadd_ph");
  btn.querySelector("span").textContent = t("task.add_btn");
  function submit() {
    var value = input.value.trim();
    if (!value) return;
    var inbox = projects.find(function(p) { return p.id === INBOX_ID; });
    if (!inbox) return;
    var created = _createTaskInProject(inbox, value);
    if (!created) return;
    // El parser NL puede haber fijado ya una fecha ("mañana"); si no, va a hoy.
    if (!created.dueDate) created.dueDate = todayStr;
    saveProjects();
    _hoyQuickAddRefocus = true;
    renderTasks();
    renderSidebar();
  }
  input.addEventListener("input", function() { btn.hidden = input.value.trim() === ""; });
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") { input.value = ""; btn.hidden = true; input.blur(); }
  });
  btn.addEventListener("mousedown", function(e) { e.preventDefault(); });
  btn.addEventListener("click", submit);
  li.addEventListener("click", function(e) { if (e.target === li) input.focus(); });
  return li;
}

/** Stats "N de M hechas · X vencidas" + anillo de progreso en la cabecera. */
function _renderHoyHeaderExtra(done, total, overdueN) {
  var host = document.querySelector(".tasks-header .header-actions");
  if (!host) return;
  var el = document.getElementById("hoy-header-extra");
  if (!el) {
    el = document.createElement("div");
    el.id = "hoy-header-extra";
    el.className = "hoy-header-extra";
    host.insertBefore(el, host.firstChild);
  }
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;
  // Anillo de 44 con r=18 (handoff móvil v1). A 42/17 el «100%» centrado
  // llegaba a rozar el trazo; dos píxeles más de diámetro le dan sitio sin
  // engordar el stroke.
  var SZ = 44, R = 18, STROKE = 4.5, C = 2 * Math.PI * R;
  // Mismo anillo segmentado que las listas del sidebar: un arco por tarea
  // de hoy en vez de un único arco proporcional.
  var dash = _segmentedRingDash(total, done, C, STROKE);
  // El punto va en su propio span: en móvil las vencidas caen a una segunda
  // línea —como pide la ficha— y ahí el separador sobra.
  var overdueTxt = overdueN > 0
    ? '<p class="hoy-stats-overdue">' + overdueN + " " +
      (overdueN === 1 ? t("hoy.overdue_one") : t("hoy.overdue_other")) + "</p>"
    : "";
  var statsHtml =
    t("hoy.done_of")
      .replace("{done}", "<strong>" + done + "</strong>")
      .replace("{total}", String(total)) +
    overdueTxt;

  // El primer render construye el SVG; a partir de ahí se parchea en vez
  // de rehacer el innerHTML entero, para no perder el foco/tooltip del
  // anillo en cada actualización de stats.
  var bar = el.querySelector(".hoy-ring-bar");
  if (bar) {
    el.querySelector(".hoy-stats").innerHTML = statsHtml;
    el.querySelector(".hoy-ring-pct").textContent = pct + "%";
    el.querySelector(".hoy-ring-track").setAttribute("stroke-dasharray", dash.track);
    bar.setAttribute("stroke-dasharray", dash.fill);
    return;
  }

  el.innerHTML =
    '<span class="hoy-stats">' + statsHtml + "</span>" +
    '<span class="hoy-ring" title="' + t("hoy.ring_title") + '">' +
      '<svg width="' + SZ + '" height="' + SZ + '" viewBox="0 0 ' + SZ + ' ' + SZ + '" aria-hidden="true">' +
        '<circle cx="' + SZ / 2 + '" cy="' + SZ / 2 + '" r="' + R + '" fill="none" class="hoy-ring-track" stroke-width="' + STROKE + '" stroke-linecap="round" ' +
          'stroke-dasharray="' + dash.track + '"></circle>' +
        '<circle cx="' + SZ / 2 + '" cy="' + SZ / 2 + '" r="' + R + '" fill="none" class="hoy-ring-bar" stroke-width="' + STROKE + '" stroke-linecap="round" ' +
          'stroke-dasharray="' + dash.fill + '"></circle>' +
      "</svg>" +
      '<span class="hoy-ring-pct">' + pct + "%</span>" +
    "</span>";
}

function _removeHoyHeaderExtra() {
  var el = document.getElementById("hoy-header-extra");
  if (el) el.remove();
}


function renderTodayItem(task, project, todayStr, tone) {
  // Cuando la tarea NO tiene fecha (caso smart list "Sin fecha" o sección
  // "sugeridas"), el badge de fecha se omite y no marcamos overdue.
  var hasDate   = !!task.dueDate;
  var due       = hasDate ? new Date(task.dueDate + "T00:00:00") : null;
  var diff      = hasDate ? Math.floor((due - new Date(todayStr + "T00:00:00")) / 86400000) : 0;
  // Como el resto de la app: relativo solo para ayer/hoy/mañana, el resto
  // (incluidas las vencidas) muestra "vie 20 jul", no "hace Nd".
  var dateLabel = !hasDate ? ""
    : diff === 0 ? t("date.today")
    : diff === 1 ? t("date.tomorrow")
    : diff === -1 ? t("date.yesterday")
    : formatDueWeekday(task.dueDate);
  var overdue = hasDate && diff < 0;
  var done = !!task.done;

  var li = document.createElement("li");
  li.className = "today-item" +
    (tone ? " today-item--" + tone : "") +
    (done ? " today-item--done" : "") +
    (overdue ? " today-overdue" : "") +
    // Misma marca que .task-item en Inbox/listas: sin esto, abrir el
    // panel de detalle de una tarea desde Hoy no resaltaba su fila.
    (openDetailTaskId === task.id ? " detail-open" : "");
  // Color del proyecto → el check de completar usa este acento.
  li.style.setProperty("--task-accent", _projectColor(project));

  // Checkbox para marcar hecha / reabrir
  var cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "today-check";
  cb.checked = done;
  cb.setAttribute("aria-label", done ? t("hoy.reopen") : "Marcar como hecha");
  cb.addEventListener("click", function(e) { e.stopPropagation(); });
  cb.addEventListener("change", function() {
    if (!cb.checked) {
      // Reabrir una tarea hecha hoy (visible en la sección "Para hoy")
      task.done = false;
      saveProjects();
      renderTasks();
      renderSidebar();
      return;
    }
    // Las recurrentes se quedan marcadas y con su fecha: adelantarla aquí
    // las hacía desaparecer de Hoy nada más completarlas. Reaparecen
    // pendientes cuando llega su vuelta (`_reactivarRecurrentes`).
    task.done = true;
    saveProjects();
    renderTasks();
    renderSidebar();
    if (task.recurDays) _showRecurToast(task.recurDays, _proximaRecurrencia(task));
  });

  var text = document.createElement("span");
  text.className = "today-text";
  text.textContent = task.text;

  li.appendChild(cb);
  li.appendChild(text);

  // Chips y acciones en un contenedor: en escritorio es display:contents
  // (misma fila) y en móvil salta a una segunda línea con sangría.
  var meta = document.createElement("span");
  meta.className = "today-meta";
  li.appendChild(meta);

  if (task.priority && taskPrefs.showPriority !== false) {
    var pEl = document.createElement("span");
    // Mismo chip que la fila del task-list — comparten clase, no una copia.
    // Ya no hay niveles: la bandera roja es la única marca de "importante".
    pEl.className = "priority-badge";
    pEl.title = IMPORTANT_LABEL();
    pEl.innerHTML = '<i data-lucide="flag"></i>';
    meta.appendChild(pEl);
  }

  if (task.reminderAt && taskPrefs.showReminder !== false) {
    var rEl = document.createElement("span");
    // Mismo chip que la fila del task-list — comparten clase, no una copia.
    rEl.className = "reminder-badge";
    rEl.title = t("detail.reminder");
    rEl.innerHTML = '<i data-lucide="bell"></i>';
    meta.appendChild(rEl);
  }

  // Etiqueta de lista (el `LabelTag` de v1) — aquí además es pulsable
  // y lleva al proyecto, que es lo que ya hacía esta vista. Las tareas
  // del Inbox no llevan ninguna: v1 omite la píldora cuando no hay
  // lista, para no dejar cápsulas vacías.
  if (project.id !== INBOX_ID && taskPrefs.showList !== false) {
    var projBadge = document.createElement("button");
    projBadge.type = "button";
    projBadge.className = "task-list-badge today-project-badge";
    projBadge.textContent = project.name;
    // Color efectivo, no `project.color` a secas: si no, las listas sin color
    // elegido (las importadas de un .json) salían con el chip gris mientras
    // la franja de acento de su propia fila sí iba coloreada.
    projBadge.style.setProperty("--proj-color", _projectColor(project));
    projBadge.title = "Ir al proyecto " + project.name;
    projBadge.addEventListener("click", function(e) {
      e.stopPropagation();
      activateProject(project.id);
      if (typeof navigateToTask === "function") {
        setTimeout(function() { navigateToTask(project.id, task.id); }, 60);
      }
    });
    meta.appendChild(projBadge);
  }

  // Repetición: mismo chip mono que en el task-list. Completar no lo
  // esconde —igual que la prioridad y la fecha— solo apaga el título.
  var tieneRecur = false;
  if (taskPrefs.showRecur !== false) {
    var recurWrap = document.createElement("span");
    recurWrap.className = "today-recur";
    renderRecurBadge(task, recurWrap);
    tieneRecur = !!recurWrap.firstChild;
    if (tieneRecur) meta.appendChild(recurWrap);
  }

  // Mover/programar a hoy: antes era un botón con texto ("Mover a hoy",
  // "Programar hoy") que aparecía en hover — ocupaba más que la propia
  // fecha que ya se estaba mostrando al lado. Ahora es la fecha misma la
  // que actúa: una píldora compacta con flecha, pulsable en cualquier
  // tamaño de pantalla. "Sin fecha" no tiene píldora que reaprovechar, así
  // que la suya dice "Hoy" directamente.
  if (dateLabel) {
    var dateText = dateLabel;
    var dEl = document.createElement("span");
    dEl.className = "today-date-pill" +
      (tone === "today" ? " today-date-pill--today" : "") +
      (overdue ? " today-date-pill--overdue" : "");
    if (overdue && !done) {
      dEl.innerHTML = '<span class="today-date-label"></span><i data-lucide="arrow-right"></i>';
      dEl.querySelector(".today-date-label").textContent = dateText;
      dEl.title = t("hoy.move_one");
      dEl.addEventListener("click", function(e) {
        e.stopPropagation();
        task.dueDate = todayStr;
        saveProjects();
        renderTasks();
        renderSidebar();
      });
    } else {
      dEl.textContent = dateText;
    }
    // Cuelga de la FILA, no de `meta`. En escritorio no cambia nada porque
    // `.today-meta` es `display: contents` y sus hijos ya se maquetaban como
    // hermanos; en móvil, en cambio, `meta` salta a una segunda línea y la
    // fecha tiene que quedarse arriba, pegada al borde derecho.
    li.appendChild(dEl);
  } else if (!done && tone === "nodate") {
    var noDateEl = document.createElement("span");
    noDateEl.className = "today-date-pill today-date-pill--action";
    noDateEl.innerHTML = '<span class="today-date-label"></span><i data-lucide="arrow-right"></i>';
    noDateEl.querySelector(".today-date-label").textContent = t("hoy.move_one");
    noDateEl.title = t("hoy.schedule_one");
    noDateEl.addEventListener("click", function(e) {
      e.stopPropagation();
      task.dueDate = todayStr;
      saveProjects();
      renderTasks();
      renderSidebar();
    });
    li.appendChild(noDateEl);
  }

  // Clic en la fila → abre el panel de detalle, igual que en una lista, para
  // poder editar sin salir de Hoy. Antes saltaba al proyecto, lo que sacaba
  // de la vista; para eso está el chip con el nombre de la lista.
  // Volver a pulsar la fila abierta lo cierra.
  li.addEventListener("click", function(e) {
    if (e.target.closest("button, input")) return;
    if (openDetailTaskId === task.id) { closeTaskDetail(); return; }
    openTaskDetail(task.id, project.id);
  });

  return li;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getActiveProject() {
  return projects.find(function(p) { return p.id === activeProjectId; }) || null;
}

function getVisibleTasks(project) {
  let tasks = project.tasks.slice();
  const pred = TASK_FILTERS[currentFilter];
  if (pred) tasks = tasks.filter(pred);
  if (currentQuery) tasks = tasks.filter(function(tk) { return _matchesQuery(tk, project); });

  return tasks;
}

function startInlineEdit(textSpan, task) {
  if (textSpan.querySelector("input.inline-edit")) return;
  const current = task.text;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit";
  input.value = current;
  input.maxLength = 120;
  textSpan.textContent = "";
  textSpan.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const newText = capitalizeFirst(input.value.trim()).slice(0, 120);
    if (newText && newText !== current) {
      task.text = newText;
      saveAndRender();
    } else {
      textSpan.textContent = current;
    }
  }
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter")  { e.preventDefault(); input.blur(); }
    if (e.key === "Escape") { input.value = current; input.blur(); }
    e.stopPropagation();
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", function(e) { e.stopPropagation(); });
}

function startSubtaskInlineEdit(textSpan, subtask) {
  if (textSpan.querySelector("input.inline-edit")) return;
  const current = subtask.text;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "inline-edit subtask-inline-edit";
  input.value = current;
  input.maxLength = 120;
  textSpan.textContent = "";
  textSpan.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const newText = capitalizeFirst(input.value.trim()).slice(0, 120);
    if (newText && newText !== current) {
      subtask.text = newText;
      saveAndRenderDetail();
    } else {
      textSpan.textContent = current;
    }
  }
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter")  { e.preventDefault(); input.blur(); }
    if (e.key === "Escape") { input.value = current; input.blur(); }
    e.stopPropagation();
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", function(e) { e.stopPropagation(); });
}

/** Fecha de la siguiente vuelta de una tarea con repetición. */
function _proximaRecurrencia(task) {
  var next = new Date();
  if (task.dueDate) next = new Date(task.dueDate + "T00:00:00");
  next.setDate(next.getDate() + task.recurDays);
  return _localDateISO(next);
}

/**
 * Reabre las tareas con repetición cuya vuelta ya ha llegado.
 *
 * Completar una recurrente la deja marcada y con la fecha de esta vuelta,
 * para que siga a la vista el resto del día. Es aquí donde, al pasar el
 * día, salta a la siguiente fecha y vuelve a quedar pendiente. El bucle
 * cubre el caso de no abrir la app en varios ciclos.
 *
 * @returns {boolean} true si cambió algo (hay que guardar)
 */
function _reactivarRecurrentes() {
  var hoy = _localDateISO(new Date());
  var cambios = false;
  projects.forEach(function(p) {
    p.tasks.forEach(function(task) {
      if (!task.recurDays || !task.done || !task.dueDate) return;
      if (task.dueDate >= hoy) return;
      var next = new Date(task.dueDate + "T00:00:00");
      var guarda = 0;
      do {
        next.setDate(next.getDate() + task.recurDays);
        guarda++;
      } while (_localDateISO(next) < hoy && guarda < 1000);
      task.dueDate = _localDateISO(next);
      task.done = false;
      cambios = true;
    });
  });
  return cambios;
}

function _showRecurToast(days, nextDate) {
  var msg = t("toast.task_recurred");
  if (nextDate) {
    var d = new Date(nextDate + "T00:00:00");
    msg += " · vence " + d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  }
  var toast = document.createElement("div");
  toast.className = "recur-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(function() { toast.classList.add("recur-toast-visible"); });
  setTimeout(function() {
    toast.classList.remove("recur-toast-visible");
    toast.addEventListener("transitionend", function() { toast.remove(); }, { once: true });
    setTimeout(function() { toast.remove(); }, 500);
  }, 2800);
}

// ═══════════════════════════════════════════════════════════════
// SWIPE GESTURES (mobile)
// ═══════════════════════════════════════════════════════════════

/* La clave va literal dentro de cada función y NO en una `var` de módulo a
   propósito: el primer render se dispara mientras el módulo aún se está
   evaluando, así que una var de nivel superior todavía valdría `undefined` y
   acabaríamos escribiendo en la clave "undefined" —con lo que el tutorial se
   repetiría siempre—. Ver la deuda conocida del arranque. */

/** ¿Toca enseñar el tutorial del deslizamiento? Una vez por dispositivo, y
 *  nunca si el usuario ha pedido menos movimiento. */
function _shouldHintSwipe() {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try { return !localStorage.getItem("antask_swipe_hinted"); } catch (_) { return false; }
}

/** Marca el tutorial como visto. */
function _markSwipeHinted() {
  try { localStorage.setItem("antask_swipe_hinted", "1"); } catch (_) {}
}

function initSwipeGesture(node, task, project) {
  var THRESHOLD   = 80;   // px needed to trigger action
  var MAX_OVER    = 140;  // max visual translation
  var startX = 0, startY = 0, currentX = 0;
  var tracking = false, axisLocked = false, isHorizontal = false;

  // Handoff móvil v1: derecha → mover a hoy, izquierda → eliminar. Antes
  // estaba al revés, con el gesto destructivo en la dirección constructiva.
  // "Mover a hoy" se deshabilita si ya está hecha o si ya vence hoy.
  var canMoveToday = !task.done && task.dueDate !== _localDateISO(new Date());

  var content = document.createElement("div");
  content.className = "task-swipe-content";
  while (node.firstChild) content.appendChild(node.firstChild);
  node.appendChild(content);

  // Deslizar a la DERECHA descubre el panel pegado a la izquierda.
  var actToday = document.createElement("div");
  actToday.className = "task-swipe-act task-swipe-act-today" + (canMoveToday ? "" : " task-swipe-act-disabled");
  actToday.innerHTML = '<i data-lucide="sun"></i><span class="task-swipe-act-label">' + t("date.today") + "</span>";
  node.appendChild(actToday);

  // Deslizar a la IZQUIERDA descubre el panel pegado a la derecha.
  var actDelete = document.createElement("div");
  actDelete.className = "task-swipe-act task-swipe-act-delete";
  actDelete.innerHTML = '<span class="task-swipe-act-label">' + t("action.delete") + '</span><i data-lucide="trash-2"></i>';
  node.appendChild(actDelete);

  if (window.lucide) window.lucide.createIcons({ nodes: [actToday, actDelete] });

  // Tutorial de una sola vez (handoff móvil v1): la primera fila se aparta
  // 54px y vuelve, para que se vea que las filas se deslizan. La bandera se
  // escribe AL EMPEZAR, no al terminar: si se guardase al final, un re-render
  // dentro de esos 2s volvería a lanzarlo.
  if (canMoveToday && !node.previousElementSibling && _shouldHintSwipe()) {
    _markSwipeHinted();
    setTimeout(function() {
      content.style.transition = "transform 0.45s cubic-bezier(0.22,1,0.36,1)";
      content.style.transform  = "translateX(54px)";
      actToday.style.opacity   = 0.85;
      setTimeout(function() {
        content.style.transform = "translateX(0)";
        actToday.style.opacity  = 0;
      }, 700);
    }, 900);
  }

  node.addEventListener("touchstart", function(e) {
    if (e.touches.length !== 1) return;
    var t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    currentX = 0;
    tracking = true;
    axisLocked = false;
    isHorizontal = false;
    content.style.transition = "none";
  }, { passive: true });

  node.addEventListener("touchmove", function(e) {
    if (!tracking || e.touches.length !== 1) return;
    var t = e.touches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;

    if (!axisLocked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isHorizontal = Math.abs(dx) > Math.abs(dy);
      axisLocked = true;
      if (!isHorizontal) { tracking = false; return; }
    }

    if (!isHorizontal) return;
    e.preventDefault();

    // Sin acción configurada en ese lado (derecha deshabilitada cuando no se
    // puede mover a hoy) → goma blanda en vez del recorrido completo.
    if (dx > 0 && !canMoveToday) dx *= 0.35;

    // Resist past threshold
    if (Math.abs(dx) > THRESHOLD) {
      var over = Math.abs(dx) - THRESHOLD;
      var sign = dx > 0 ? 1 : -1;
      dx = sign * (THRESHOLD + over * 0.25);
    }
    dx = Math.max(-MAX_OVER, Math.min(MAX_OVER, dx));
    currentX = dx;

    content.style.transform = "translateX(" + dx + "px)";

    // El panel del lado que se está descubriendo entra según el progreso.
    var pct = Math.min(Math.abs(dx) / THRESHOLD, 1);
    if (dx > 0) {
      actToday.style.opacity  = canMoveToday ? pct : 0;
      actDelete.style.opacity = 0;
    } else if (dx < 0) {
      actDelete.style.opacity = pct;
      actToday.style.opacity  = 0;
    } else {
      actToday.style.opacity  = 0;
      actDelete.style.opacity = 0;
    }
    // Al llegar al umbral el panel se "arma": lo marcamos para que el CSS
    // pueda dar el realce sin que el JS tenga que conocer los colores.
    actToday.classList.toggle("task-swipe-act-armed", dx >= THRESHOLD && canMoveToday);
    actDelete.classList.toggle("task-swipe-act-armed", dx <= -THRESHOLD);
  }, { passive: false });

  node.addEventListener("touchend", function() {
    if (!tracking) return;
    tracking = false;

    var dx = currentX;
    content.style.transition = "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)";
    actToday.style.transition  = "opacity 0.18s";
    actDelete.style.transition = "opacity 0.18s";

    if (dx >= THRESHOLD && canMoveToday) {
      // Swipe derecha → mover a hoy
      content.style.transform = "translateX(110%)";
      setTimeout(function() {
        task.dueDate = _localDateISO(new Date());
        saveAndRender();
      }, 200);
    } else if (dx <= -THRESHOLD) {
      // Swipe izquierda → eliminar
      content.style.transform = "translateX(-110%)";
      setTimeout(function() {
        deleteTaskWithUndo(task, project);
      }, 200);
    } else {
      // Snap back
      content.style.transform = "translateX(0)";
      actToday.style.opacity  = 0;
      actDelete.style.opacity = 0;
      actToday.classList.remove("task-swipe-act-armed");
      actDelete.classList.remove("task-swipe-act-armed");
    }
  });

  node.addEventListener("touchcancel", function() {
    if (!tracking) return;
    tracking = false;
    content.style.transition = "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)";
    content.style.transform  = "translateX(0)";
    actToday.style.opacity   = 0;
    actDelete.style.opacity  = 0;
    actToday.classList.remove("task-swipe-act-armed");
    actDelete.classList.remove("task-swipe-act-armed");
  });
}

// ═══════════════════════════════════════════════════════════════
// DRAG & DROP
// ═══════════════════════════════════════════════════════════════

function initDragDrop(node, taskId) {
  // Solo activo en filtro "all": con cualquier otro, el orden visual ya
  // no es el orden real del array y arrastrar reordenaría a ciegas.
  if (currentFilter !== "all") return;

  // Sin icono de "agarre": se arrastra la fila entera, siempre que el
  // gesto no empiece sobre un control interactivo (botón, checkbox,
  // input o texto en edición). Las tareas de otros proyectos (Inbox
  // agrupado) no se reordenan desde ahí.
  function isInteractiveTarget(target) {
    return !!target.closest("button, input, a, [contenteditable]");
  }
  node.addEventListener("mousedown", function(e) {
    if (node.classList.contains("task-item--foreign") || isInteractiveTarget(e.target)) return;
    node.setAttribute("draggable", "true");
  });
  node.addEventListener("touchstart", function(e) {
    if (node.classList.contains("task-item--foreign") || isInteractiveTarget(e.target)) return;
    node.setAttribute("draggable", "true");
  }, { passive: true });

  node.addEventListener("dragend", function() {
    node.setAttribute("draggable", "false");
  });

  node.addEventListener("dragstart", function(e) {
    dragSrcId = taskId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    setTimeout(function() { node.classList.add("drag-ghost"); }, 0);
    document.body.classList.add("task-dragging");
  });

  node.addEventListener("dragend", function() {
    node.classList.remove("drag-ghost");
    node.setAttribute("draggable", "false");
    removeDropIndicator();
    dragSrcId = null;
    document.body.classList.remove("task-dragging");
    document.querySelectorAll(".project-task-drop-target").forEach(function(el) {
      el.classList.remove("project-task-drop-target");
    });
  });

  node.addEventListener("dragover", function(e) {
    if (!dragSrcId || dragSrcId === taskId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    showDropIndicator(node, e.clientY);
  });

  node.addEventListener("dragleave", function(e) {
    // Solo quitar si el ratón sale del taskList completamente
    if (!e.relatedTarget || !taskList.contains(e.relatedTarget)) {
      removeDropIndicator();
    }
  });

  node.addEventListener("drop", function(e) {
    e.preventDefault();
    if (!dragSrcId || dragSrcId === taskId) { removeDropIndicator(); return; }

    const project = getActiveProject();
    if (!project) return;

    const srcIdx  = project.tasks.findIndex(function(t) { return t.id === dragSrcId; });
    const destIdx = project.tasks.findIndex(function(t) { return t.id === taskId; });
    if (srcIdx === -1 || destIdx === -1) { removeDropIndicator(); return; }

    // Decidir si insertar antes o después según posición del ratón
    const rect   = node.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;

    const [moved] = project.tasks.splice(srcIdx, 1);
    const insertAt = isAfter
      ? (destIdx >= srcIdx ? destIdx : destIdx + 1)
      : (destIdx <= srcIdx ? destIdx : destIdx - 1 + 1);

    project.tasks.splice(Math.max(0, insertAt), 0, moved);

    removeDropIndicator();
    saveAndRender();
  });
}

function showDropIndicator(targetNode, clientY) {
  removeDropIndicator();
  const rect    = targetNode.getBoundingClientRect();
  const isAfter = clientY > rect.top + rect.height / 2;

  dropIndicator = document.createElement("div");
  dropIndicator.className = "drop-indicator";

  if (isAfter) {
    targetNode.after(dropIndicator);
  } else {
    targetNode.before(dropIndicator);
  }
}

function removeDropIndicator() {
  if (dropIndicator) { dropIndicator.remove(); dropIndicator = null; }
}

// ─── PROJECT DRAG & DROP ──────────────────────────────────────
function initProjectDragDrop(li, projectId) {
  li.setAttribute("draggable", "true");

  li.addEventListener("dragstart", function(e) {
    // No iniciar drag si el gesto comienza sobre un control interactivo.
    if (e.target.closest(".project-kebab-btn, .project-item-icon")) {
      e.preventDefault();
      return;
    }
    dragSrcProjectId = projectId;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(function() { li.classList.add("drag-ghost"); }, 0);
    document.body.classList.add("project-dragging");
  });

  li.addEventListener("dragend", function() {
    li.classList.remove("drag-ghost");
    removeProjectDropIndicator();
    dragSrcProjectId = null;
    document.body.classList.remove("project-dragging");
  });

  li.addEventListener("dragover", function(e) {
    if (!dragSrcProjectId || dragSrcProjectId === projectId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    showProjectDropIndicator(li, e.clientY);
  });

  li.addEventListener("dragleave", function(e) {
    if (!e.relatedTarget || !projectListEl.contains(e.relatedTarget)) {
      removeProjectDropIndicator();
    }
  });

  li.addEventListener("drop", function(e) {
    e.preventDefault();
    if (!dragSrcProjectId || dragSrcProjectId === projectId) {
      removeProjectDropIndicator(); return;
    }
    const srcIdx  = projects.findIndex(function(p) { return p.id === dragSrcProjectId; });
    const destIdx = projects.findIndex(function(p) { return p.id === projectId; });
    if (srcIdx === -1 || destIdx === -1) { removeProjectDropIndicator(); return; }

    const rect = li.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;

    const [moved] = projects.splice(srcIdx, 1);
    var newIdx = destIdx > srcIdx ? destIdx - 1 : destIdx;
    if (isAfter) newIdx += 1;
    projects.splice(Math.max(0, Math.min(newIdx, projects.length)), 0, moved);

    removeProjectDropIndicator();
    saveProjects();
    renderSidebar();
    if (window.lucide) lucide.createIcons();
  });
}

function showProjectDropIndicator(targetNode, clientY) {
  removeProjectDropIndicator();
  const rect = targetNode.getBoundingClientRect();
  const isAfter = clientY > rect.top + rect.height / 2;
  projectDropIndicator = document.createElement("div");
  projectDropIndicator.className = "drop-indicator";
  if (isAfter) targetNode.after(projectDropIndicator);
  else         targetNode.before(projectDropIndicator);
}

function removeProjectDropIndicator() {
  if (projectDropIndicator) { projectDropIndicator.remove(); projectDropIndicator = null; }
}

// ═══════════════════════════════════════════════════════════════
// UNDO TOAST
// ═══════════════════════════════════════════════════════════════

function showUndoToast() {
  // Remove any existing toast
  const existing = document.getElementById("undo-toast");
  if (existing) existing.remove();
  if (_undoTimer) clearTimeout(_undoTimer);

  const toast = document.createElement("div");
  toast.id = "undo-toast";
  toast.className = "undo-toast";
  toast.innerHTML =
    '<span class="undo-toast-msg">' + t("toast.task_deleted") + '</span>' +
    '<button type="button" class="undo-toast-btn">' + t("toast.undo") + '</button>' +
    '<div class="undo-toast-bar"></div>';

  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add("undo-toast-visible");
    // Trigger bar animation
    const bar = toast.querySelector(".undo-toast-bar");
    if (bar) bar.style.animationDuration = "5s";
  });

  toast.querySelector(".undo-toast-btn").addEventListener("click", function() {
    undoDelete();
    dismissUndoToast();
  });

  _undoTimer = setTimeout(function() {
    dismissUndoToast();
    _undoStack = null;
  }, 5000);
}

function dismissUndoToast() {
  if (_undoTimer) { clearTimeout(_undoTimer); _undoTimer = null; }
  const toast = document.getElementById("undo-toast");
  if (!toast) return;
  toast.classList.remove("undo-toast-visible");
  // Respaldo por plazo: sin transición (o si el navegador la salta), el
  // toast se quedaba en el DOM para siempre.
  var removed = false;
  function remove() {
    if (removed || !toast.parentNode) return;
    removed = true;
    toast.remove();
  }
  toast.addEventListener("transitionend", remove, { once: true });
  setTimeout(remove, 350);
}

function undoDelete() {
  if (!_undoStack) return;
  const project = projects.find(function(p) { return p.id === _undoStack.projectId; });
  if (!project) return;

  if (Array.isArray(_undoStack.tasks)) {
    // Bulk delete: restaurar en orden de índice ascendente
    var pairs = _undoStack.tasks.map(function(t, i) {
      return { task: t, index: _undoStack.indices[i] };
    });
    pairs.sort(function(a, b) { return a.index - b.index; });
    pairs.forEach(function(p) {
      var idx = Math.min(p.index, project.tasks.length);
      project.tasks.splice(idx, 0, p.task);
    });
  } else {
    // Single delete
    var safeIndex = Math.min(_undoStack.index, project.tasks.length);
    project.tasks.splice(safeIndex, 0, _undoStack.task);
  }

  _undoStack = null;
  saveAndRender();
}

// ═══════════════════════════════════════════════════════════════
// ACCIÓN EN MASA (MULTI-SELECT)
// ═══════════════════════════════════════════════════════════════

function toggleSelectMode() {
  if (selectMode) exitSelectMode();
  else enterSelectMode();
}

function enterSelectMode() {
  selectMode = true;
  selectedTaskIds.clear();
  taskList.classList.add("select-mode");
  if (selectModeBtn) {
    selectModeBtn.innerHTML = '<i data-lucide="x"></i>';
    selectModeBtn.classList.add("active");
    if (window.lucide) lucide.createIcons({ nodes: [selectModeBtn] });
  }
  renderBulkBar();
  renderTasks();
}

function exitSelectMode() {
  if (!selectMode) return;
  selectMode = false;
  selectedTaskIds.clear();
  taskList.classList.remove("select-mode");
  if (selectModeBtn) {
    selectModeBtn.innerHTML = '<i data-lucide="square-check-big"></i>';
    selectModeBtn.classList.remove("active");
    if (window.lucide) lucide.createIcons({ nodes: [selectModeBtn] });
  }
  if (bulkActionBar) bulkActionBar.hidden = true;
  renderTasks();
}

function renderBulkBar() {
  if (!bulkActionBar) return;
  if (!selectMode) { bulkActionBar.hidden = true; return; }
  bulkActionBar.hidden = false;
  var n = selectedTaskIds.size;
  if (bulkCount) {
    bulkCount.textContent = (n === 1 ? t("bulk.count_one") : t("bulk.count_other"))
      .replace("{count}", String(n));
  }
}

function toggleTaskSelection(taskId, node) {
  if (selectedTaskIds.has(taskId)) {
    selectedTaskIds.delete(taskId);
    node.classList.remove("selected");
    var cb = node.querySelector(".task-select-cb");
    if (cb) cb.checked = false;
  } else {
    selectedTaskIds.add(taskId);
    node.classList.add("selected");
    var cb = node.querySelector(".task-select-cb");
    if (cb) cb.checked = true;
  }
  renderBulkBar();
}

function bulkMarkDone() {
  var project = getActiveProject();
  if (!project || selectedTaskIds.size === 0) return;
  project.tasks.forEach(function(t) {
    if (selectedTaskIds.has(t.id)) t.done = true;
  });
  exitSelectMode();
  saveAndRender();
}

function bulkMarkPending() {
  var project = getActiveProject();
  if (!project || selectedTaskIds.size === 0) return;
  project.tasks.forEach(function(t) {
    if (selectedTaskIds.has(t.id)) t.done = false;
  });
  exitSelectMode();
  saveAndRender();
}

function bulkDelete() {
  var project = getActiveProject();
  if (!project || selectedTaskIds.size === 0) return;
  var toDelete = project.tasks
    .map(function(t, i) { return { task: t, index: i }; })
    .filter(function(x) { return selectedTaskIds.has(x.task.id); });
  _undoStack = {
    projectId: project.id,
    tasks:   toDelete.map(function(x) { return JSON.parse(JSON.stringify(x.task)); }),
    indices: toDelete.map(function(x) { return x.index; }),
  };
  if (toDelete.some(function(x) { return x.task.id === openDetailTaskId; })) closeTaskDetail();
  project.tasks = project.tasks.filter(function(t) { return !selectedTaskIds.has(t.id); });
  exitSelectMode();
  saveAndRender();
  showUndoToast();
}

async function bulkMoveToProject() {
  var project = getActiveProject();
  if (!project || selectedTaskIds.size === 0) return;
  var targetId = await modalProjectPicker(project.id);
  if (!targetId) return;
  var target = projects.find(function(p) { return p.id === targetId; });
  if (!target) return;
  var toMove = project.tasks.filter(function(t) { return selectedTaskIds.has(t.id); });
  project.tasks = project.tasks.filter(function(t) { return !selectedTaskIds.has(t.id); });
  toMove.reverse().forEach(function(t) { target.tasks.unshift(t); });
  exitSelectMode();
  saveAndRender();
}

// ═══════════════════════════════════════════════════════════════
// VIEW-NAV: TABS + FILTER PANEL + MORE-ACTIONS
// ═══════════════════════════════════════════════════════════════

(function() {
  // ── Tab clicks ───────────────────────────────────────────────
  var viewNavTabs = document.getElementById("view-nav-tabs");
  if (viewNavTabs) {
    viewNavTabs.addEventListener("click", function(e) {
      var tab = e.target.closest(".view-tab");
      if (!tab) return;
      var view = tab.dataset.view;
      if (view === "tasks")  { _closeAllAltPanels(); _restoreMainPanel(); }
      else if (view === "cal")     showCalendarPanel();
    });
  }

  // ── Filter panel toggle ──────────────────────────────────────
  // Buscador de la lista (móvil).
  var listSearch = document.getElementById("list-search-input");
  var listSearchClear = document.getElementById("list-search-clear");
  if (listSearch) {
    listSearch.addEventListener("input", function() {
      currentQuery = listSearch.value.trim();
      if (listSearchClear) listSearchClear.hidden = !currentQuery;
      renderTasks();
    });
    listSearch.addEventListener("keydown", function(e) {
      // Escape limpia y desenfoca, como en el prototipo.
      if (e.key === "Escape") { listSearch.value = ""; currentQuery = ""; if (listSearchClear) listSearchClear.hidden = true; renderTasks(); listSearch.blur(); }
    });
  }
  if (listSearchClear) {
    listSearchClear.addEventListener("click", function() {
      listSearch.value = ""; currentQuery = ""; listSearchClear.hidden = true;
      renderTasks(); listSearch.focus();
    });
  }

  // Coloca el control de vista según el breakpoint, ahora y al cruzarlo.
  _placeRowStyleControl();
  window.matchMedia("(max-width: 768px)").addEventListener("change", _placeRowStyleControl);

  // Chips de listas — delegado, porque el contenido se repinta en cada render.
  var listChips = document.getElementById("list-chips");
  if (listChips) {
    listChips.addEventListener("click", function(e) {
      if (e.target.closest("[data-chip-add]")) { startNewProject(); return; }
      var chip = e.target.closest("[data-chip-target]");
      if (chip) activateProject(chip.dataset.chipTarget);
    });
  }

  var filterTriggerBtn = document.getElementById("filter-trigger-btn");
  var filterPanel      = document.getElementById("filter-panel");
  if (filterTriggerBtn && filterPanel) {
    filterTriggerBtn.addEventListener("click", function(e) {
      e.stopPropagation();

      // En móvil, hoja en vez de desplegable (handoff móvil v1, «Filtrar»).
      // El valor lleva el prefijo "filter:" porque `sheetPick` es genérico
      // y lo devuelve tal cual llegó en `_filterPanelSections()`.
      if (window.matchMedia("(max-width: 768px)").matches) {
        var sections = _filterPanelSections();
        sheetPick(t("filter.trigger_label"), sections).then(function(picked) {
          if (!picked) return;
          applyFilter(picked.slice(picked.indexOf(":") + 1));
        });
        return;
      }

      var opening = filterPanel.hidden;
      filterPanel.hidden = !opening;
      filterTriggerBtn.classList.toggle("open", opening);
    });
  }

  // ── Segmentado visible (escritorio) ──────────────────────────
  var filterSegments = document.getElementById("filter-segments");
  if (filterSegments) {
    filterSegments.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-filter]");
      if (btn) applyFilter(btn.dataset.filter);
    });
  }

  // ── Filter options ───────────────────────────────────────────
  if (filterPanel) {
    filterPanel.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-filter]");
      if (btn) { applyFilter(btn.dataset.filter); filterPanel.hidden = true; if (filterTriggerBtn) filterTriggerBtn.classList.remove("open"); }
    });
  }

  // ── More-actions panel toggle ─────────────────────────────────
  var moreActionsBtn   = document.getElementById("more-actions-btn");
  var moreActionsPanel = document.getElementById("more-actions-panel");
  if (moreActionsBtn && moreActionsPanel) {
    moreActionsBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      moreActionsPanel.hidden = !moreActionsPanel.hidden;
    });
    moreActionsPanel.addEventListener("click", function() {
      moreActionsPanel.hidden = true;
    });
  }

  // ── Row-style panel (estilo de fila: Limpio · Líneas · Tarjetas · Compacto) ──
  var rowStyleBtn   = document.getElementById("row-style-btn");
  var rowStylePanel = document.getElementById("row-style-panel");
  if (rowStyleBtn && rowStylePanel) {
    rowStyleBtn.addEventListener("click", function(e) {
      e.stopPropagation();

      // En móvil el desplegable se sustituye por una hoja que sube desde
      // abajo (handoff móvil v1, «Modo de vista»). Las etiquetas se leen del
      // propio panel para no duplicar los textos traducidos; los iconos, de
      // ROW_STYLE_ICON, porque lucide quita `data-lucide` del SVG que genera
      // y ya no se pueden leer del DOM.
      if (window.matchMedia("(max-width: 768px)").matches) {
        var options = Array.prototype.map.call(
          rowStylePanel.querySelectorAll("[data-row-style]"),
          function(b) {
            var v = b.dataset.rowStyle;
            return {
              value: v,
              icon: ROW_STYLE_ICON[v] || "list",
              label: (b.querySelector("span") || {}).textContent || v,
              active: v === currentRowStyle,
            };
          }
        );
        sheetPick(t("rowstyle.trigger"), [{ options: options }]).then(function(picked) {
          if (picked) applyRowStyle(picked);
        });
        return;
      }

      var opening = rowStylePanel.hidden;
      rowStylePanel.hidden = !opening;
      rowStyleBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    rowStylePanel.addEventListener("click", function(e) {
      var opt = e.target.closest("[data-row-style]");
      if (!opt) return;
      applyRowStyle(opt.dataset.rowStyle);
      rowStylePanel.hidden = true;
      rowStyleBtn.setAttribute("aria-expanded", "false");
    });
  }

  // ── Task-prefs panel (qué detalles se ven en la fila) — mismo patrón
  // que el de estilo de fila de arriba, pero como checklist: cada opción
  // es independiente, así que alterna su propio check sin cerrar el
  // panel (a diferencia de row-style, que es una elección única). ──
  var taskPrefsBtn   = document.getElementById("task-prefs-btn");
  var taskPrefsPanel = document.getElementById("task-prefs-panel");
  if (taskPrefsBtn && taskPrefsPanel) {
    _syncTaskPrefsPanel();
    taskPrefsBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      var opening = taskPrefsPanel.hidden;
      if (opening) _syncTaskPrefsPanel();
      taskPrefsPanel.hidden = !opening;
      taskPrefsBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    });
    taskPrefsPanel.addEventListener("click", function(e) {
      var opt = e.target.closest("[data-pref-key]");
      if (!opt) return;
      // A diferencia de row-style (que cierra al elegir), aquí cada click
      // solo alterna su propio check — sin esto, el listener de "cerrar al
      // hacer click fuera" (en document, más abajo) también se dispara por
      // el burbujeo y cierra el panel en cada toggle.
      e.stopPropagation();
      var key = opt.dataset.prefKey;
      // "Dos columnas" no es un taskPrefs.showX: es el mismo estado que
      // manejaba el viejo columns-toggle-btn (variable aparte, su propia
      // clave de localStorage). applyTwoColumns ya llama a
      // _syncTaskPrefsPanel por su cuenta.
      if (key === "twoColumns") {
        applyTwoColumns(!twoColumnsOn);
      } else {
        taskPrefs[key] = !_taskPrefOn(key);
        saveTaskPrefs();
        applyTaskPrefs();
        _syncTaskPrefsPanel();
      }
      renderTasks();
    });
  }

  // ── Close dropdowns on outside click ─────────────────────────
  document.addEventListener("click", function() {
    if (filterPanel)      filterPanel.hidden = true;
    if (filterTriggerBtn) filterTriggerBtn.classList.remove("open");
    if (moreActionsPanel) moreActionsPanel.hidden = true;
    if (rowStylePanel)    { rowStylePanel.hidden = true; if (rowStyleBtn) rowStyleBtn.setAttribute("aria-expanded", "false"); }
    if (taskPrefsPanel)   { taskPrefsPanel.hidden = true; if (taskPrefsBtn) taskPrefsBtn.setAttribute("aria-expanded", "false"); }
  });
})();

function _closeAllAltPanels() {
  var calPanel = document.getElementById("cal-panel");
  var calBtn   = document.getElementById("cal-btn");
  if (calPanel) calPanel.hidden = true;
  if (calBtn)   calBtn.classList.remove("active");
}

// ═══════════════════════════════════════════════════════════════
// CALENDARIO
// ═══════════════════════════════════════════════════════════════

var calState = { year: new Date().getFullYear(), month: new Date().getMonth() };

(function() {
  var calBtn = document.getElementById("cal-btn");
  if (calBtn) calBtn.addEventListener("click", function() { showCalendarPanel(); });

  var calExpandBtn = document.getElementById("cal-expand-btn");
  if (calExpandBtn) {
    calExpandBtn.addEventListener("click", function() {
      var layout = document.querySelector(".layout");
      if (layout) {
        layout.classList.remove("sidebar-is-collapsed");
        var sidebar = document.querySelector(".sidebar");
        if (sidebar) sidebar.classList.remove("sidebar-collapsed");
        localStorage.removeItem("sidebar-collapsed");
      }
    });
  }

  var prevBtn = document.getElementById("cal-prev-btn");
  var nextBtn = document.getElementById("cal-next-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", function() {
      calState.month--;
      if (calState.month < 0) { calState.month = 11; calState.year--; }
      renderCalendar();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function() {
      calState.month++;
      if (calState.month > 11) { calState.month = 0; calState.year++; }
      renderCalendar();
    });
  }
})();

window.showCalendarPanel = showCalendarPanel;
window.activateTodayView = activateTodayView;

function showCalendarPanel() {
  var calPanel = document.getElementById("cal-panel");
  if (!calPanel) return;

  if (!calPanel.hidden) {
    _closeAllAltPanels();
    _restoreMainPanel();
    return;
  }

  _closeAllAltPanels();
  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.add("ctrl-bar--alt"); }
  tasksPanel.hidden = true;
  calPanel.hidden = false;
  _setActiveViewTab("cal");
  if (mobileFab) mobileFab.classList.add("visible");
  renderCalendar();
  if (typeof window.syncBnavActive === "function") window.syncBnavActive();
}

function _restoreMainPanel() {
  var isVirtualView = (activeView === "today");
  // Si el proyecto que estaba abierto ya no existe, "Hoy" hace de red de
  // seguridad: sin estado vacío, el panel se quedaría en blanco.
  if (!isVirtualView && !getActiveProject()) { activateTodayView(); return; }
  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.remove("ctrl-bar--alt"); }
  tasksPanel.hidden = false;
  _setActiveViewTab("tasks");
  if (isVirtualView) renderTasks();
  if (typeof window.syncBnavActive === "function") window.syncBnavActive();
}

function _setActiveViewTab(view) {
  document.querySelectorAll(".view-tab").forEach(function(t) {
    t.classList.toggle("view-tab--active", t.dataset.view === view);
  });
  var isTasksView    = (view === "tasks");
  var listActions    = isTasksView;
  var listFilterRow  = document.getElementById("list-filter-row");
  if (listFilterRow) listFilterRow.style.display = listActions ? "" : "none";
  // El selector de estilo de fila acompaña a Hoy y a las listas normales
  // (como en el prototipo v1); se oculta sólo en la vista de mes.
  var rowStyleWrap   = document.getElementById("row-style-wrap");
  if (rowStyleWrap) rowStyleWrap.style.display = isTasksView ? "" : "none";
  // Ocultar task-form en vistas alternativas
  var taskFormEl = document.getElementById("task-form");
  if (taskFormEl) taskFormEl.style.display = isTasksView ? "" : "none";
  // Eyebrow que indica la vista actual encima del título
  var eyebrow = document.getElementById("view-eyebrow");
  if (eyebrow) {
    var labels = { tasks: t("view.eyebrow_tasks"), cal: t("view.eyebrow_calendar") };
    eyebrow.textContent = labels[view] || "";
  }
}


// ═══════════════════════════════════════════════════════════════
// ATAJOS DE TECLADO — MODAL DE AYUDA
// ═══════════════════════════════════════════════════════════════

function showShortcutsHelp() {
  const { overlay, box } = createModalBase();
  box.classList.add("modal-box-shortcuts");

  function row(keys, desc) {
    return '<div class="sc-row"><span class="sc-keys">' + keys + '</span>' +
           '<span class="sc-desc">' + desc + '</span></div>';
  }
  function group(title, rows) {
    return '<div class="sc-group"><div class="sc-group-title">' + title + '</div>' + rows + '</div>';
  }

  box.innerHTML =
    '<p class="modal-label">Atajos de teclado</p>' +
    '<div class="shortcuts-cols">' +
      group("General",
        row('<kbd>Ctrl</kbd>+<kbd>B</kbd>', 'Mostrar / ocultar sidebar') +
        row('<kbd>Ctrl</kbd>+<kbd>K</kbd>', 'Búsqueda global') +
        row('<kbd>Ctrl</kbd>+<kbd>,</kbd>', 'Ajustes') +
        row('<kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Espacio</kbd>', 'Captura rápida (al Inbox)')
      ) +
      group("En una tarea",
        row('<kbd>↑</kbd> <kbd>↓</kbd>', 'Navegar entre tareas') +
        row('<kbd>⏎</kbd> / <kbd>Espacio</kbd>', 'Expandir / colapsar tarea') +
        row('<kbd>E</kbd>', 'Editar texto de la tarea') +
        row('<kbd>D</kbd>', 'Marcar hecha / pendiente') +
        row('<kbd>⌫</kbd>', 'Eliminar tarea (con deshacer)') +
        row('<kbd>⎋</kbd>', 'Cerrar modal abierto')
      ) +
      group("Al crear tarea — sintaxis natural",
        row('<kbd>mañana</kbd> <kbd>hoy</kbd> <kbd>viernes</kbd>', 'Fecha límite') +
        row('<kbd>en 3 días</kbd> <kbd>15/3</kbd>', 'Fecha relativa o numérica') +
        row('<kbd>todos los lunes</kbd> <kbd>cada 2 días</kbd>', 'Recurrencia') +
        row('<kbd>p1</kbd> <kbd>p2</kbd> <kbd>p3</kbd>', 'Prioridad alta · media · baja') +
        row('<kbd>#etiqueta</kbd>', 'Crear/asignar etiqueta') +
        row('<kbd>?</kbd>', 'Ver esta lista de atajos')
      ) +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="modal-btn modal-btn-confirm">Cerrar</button>' +
    '</div>';

  const btn = box.querySelector(".modal-btn-confirm");
  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  btn.addEventListener("click", doClose);
  setTimeout(function() { btn.focus(); }, 50);
}
window.showShortcutsHelp = showShortcutsHelp;

// ═══════════════════════════════════════════════════════════════
// BÚSQUEDA GLOBAL
// ═══════════════════════════════════════════════════════════════

// showGlobalSearch() vive en ./ui/search.js — aquí usamos openGlobalSearch()


window.navigateToTask = function(projectId, taskId) { return navigateToTask(projectId, taskId); };
function navigateToTask(projectId, taskId) {
  activateProject(projectId);
  // After render, flash-highlight the task
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      const nodes = document.querySelectorAll("#task-list .task-item");
      nodes.forEach(function(node) {
        // match by text content approach: compare rendered text
        // We stored taskId in a data attr so let's find it via the visible list
      });
      // Expand and scroll to the task by searching the live DOM
      // We need to find it — inject data-task-id into rendered nodes
      const target = document.querySelector('[data-task-id="' + taskId + '"]');
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("task-highlight");
      setTimeout(function() { target.classList.remove("task-highlight"); }, 2000);
    });
  });
}

function saveAndRender() {
  saveProjects();
  renderTasks();
  renderSidebar();
  if (openDetailTaskId) _renderTaskDetail();
}

/**
 * Guarda y repinta SOLO el panel de detalle.
 *
 * Para lo que vive únicamente ahí — las subtareas — llamar a
 * saveAndRender() reconstruía además la lista y el sidebar entero, que no
 * muestran nada derivado de las subtareas: los contadores del sidebar son
 * de tareas, y la fila no tiene indicador de subtareas. Era trabajo tirado
 * y se notaba como un salto de toda la interfaz.
 */
function saveAndRenderDetail() {
  saveProjects();
  if (openDetailTaskId) _renderTaskDetail();
}

// ─── PERSISTENCIA ────────────────────────────────────────────

/** Muestra el modal de cuota llena con botón de exportar workspace. */
function _showQuotaModal() {
  var { overlay, box } = createModalBase();
  box.innerHTML =
    '<p class="modal-label" style="color:var(--c-danger,#ef4444)">⚠ ' + t("quota.title") + '</p>' +
    '<p style="font-size:0.88rem;color:var(--t-soft);line-height:1.6;margin-bottom:1.2rem">' +
      t("quota.body") +
    '</p>' +
    '<div class="modal-actions">' +
      '<button class="modal-btn modal-btn-confirm" id="_quota-export">' + t("quota.export_btn") + '</button>' +
      '<button class="modal-btn modal-btn-cancel" id="_quota-close">' + t("quota.close_btn") + '</button>' +
    '</div>';

  if (window.lucide) lucide.createIcons({ nodes: [box] });

  overlay._cancel = function() { closeModal(overlay); };
  box.querySelector("#_quota-close").addEventListener("click", function() { closeModal(overlay); });
  box.querySelector("#_quota-export").addEventListener("click", function() {
    closeModal(overlay);
    exportBtn.click();
  });
}

/** Actualiza el indicador de uso en el footer cuando supera el 75%. */
function _checkStorageWarning() {
  var pct = getStorageUsagePct();
  var el = document.getElementById("save-status");
  if (!el) return;
  if (pct >= 90) {
    el.textContent = t("save.storage_warn").replace("{pct}", String(pct));
    el.style.color = "var(--c-danger, #ef4444)";
  } else if (pct >= 75) {
    el.textContent = t("save.storage_info").replace("{pct}", String(pct));
    el.style.color = "var(--c-warning, #f97316)";
  } else {
    el.style.color = "";
  }
}

function saveProjects() {
  const ok = safeLsSet(PROJECTS_KEY, JSON.stringify(projects), _showQuotaModal);
  if (!ok) return;
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  updateSaveStatus(now);
  var user = window.AnsoSync?.getUser?.() ?? null;
  if (user) _saveAccountCache(user.uid);
  window.AnsoSync?.scheduleSave?.(projects, sections);
  if (window.AnsoNotif?.scheduleTaskReminders) {
    window.AnsoNotif.scheduleTaskReminders(projects);
  }
  _checkStorageWarning();
}


function saveTaskPrefs() {
  localStorage.setItem(TASK_PREFS_KEY, JSON.stringify(taskPrefs));
}

function applyTaskPrefs() {
  document.body.classList.toggle("tasks-compact", taskPrefs.compactView === true);
}

// Los 4 de detalle vienen encendidos por defecto: "on" es cualquier valor
// salvo `false` explícito — mismo criterio que sus guardas en el render de
// filas. "Dos columnas" no vive en taskPrefs (ver applyTwoColumns).
function _taskPrefOn(key) {
  return key === "twoColumns" ? twoColumnsOn : taskPrefs[key] !== false;
}

function _syncTaskPrefsPanel() {
  var panel = document.getElementById("task-prefs-panel");
  if (!panel) return;
  panel.querySelectorAll("[data-pref-key]").forEach(function(b) {
    var on = _taskPrefOn(b.dataset.prefKey);
    b.classList.toggle("task-prefs-opt--active", on);
    b.setAttribute("aria-checked", on ? "true" : "false");
  });
}

function saveSections() {
  const ok = safeLsSet(SECTIONS_KEY, JSON.stringify(sections), _showQuotaModal);
  if (!ok) return;
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  var user = window.AnsoSync?.getUser?.() ?? null;
  if (user) _saveAccountCache(user.uid);
  window.AnsoSync?.scheduleSave?.(projects, sections);
}

function updateSaveStatus(lastSavedAt) {
  if (!saveStatus) return; // el footer de estado se retiró de la UI
  if (!lastSavedAt) { saveStatus.textContent = "–"; return; }
  const date = new Date(lastSavedAt);
  const locale = getLang() === "en" ? "en-GB" : "es-ES";
  if (Number.isNaN(date.getTime())) { saveStatus.textContent = t("toast.saved"); return; }
  saveStatus.textContent = t("toast.last_saved") + " " + date.toLocaleString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// initializeTheme() / applyTheme() viven en ./ui/theme.js

// ── AUTO BACKUP SYSTEM ──────────────────────────────────────────
const AUTO_BACKUP_PREFIX = "autoBackup_";
const MAX_AUTO_BACKUPS = 10; // Mantener máximo 10 backups automáticos
const AUTO_BACKUP_INTERVAL_DAYS = 2; // Cada 2 días

function saveAutoBackup() {
  const now = new Date();
  const dateStr = _localDateISO(now); // YYYY-MM-DD en hora local
  const key = AUTO_BACKUP_PREFIX + dateStr;
  const data = {
    projects: projects,
    activeProjectId: activeProjectId,
    timestamp: now.toISOString(),
    version: "auto-backup"
  };
  // El auto-backup falla silenciosamente si no hay espacio — no molestamos
  // al usuario con el modal de cuota en un proceso en segundo plano.
  const ok = safeLsSet(key, JSON.stringify(data), function() {});
  if (!ok) return;
  cleanOldAutoBackups();
}

function cleanOldAutoBackups() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(AUTO_BACKUP_PREFIX));
  if (keys.length <= MAX_AUTO_BACKUPS) return;

  // Ordenar por fecha descendente (más reciente primero)
  keys.sort((a, b) => {
    const dateA = new Date(a.replace(AUTO_BACKUP_PREFIX, ''));
    const dateB = new Date(b.replace(AUTO_BACKUP_PREFIX, ''));
    return dateB - dateA;
  });

  // Eliminar los más antiguos, dejando solo MAX_AUTO_BACKUPS
  const toDelete = keys.slice(MAX_AUTO_BACKUPS);
  toDelete.forEach(k => localStorage.removeItem(k));
}

function checkAutoBackup() {
  const lastBackupKey = localStorage.getItem("lastAutoBackup");
  if (!lastBackupKey) {
    // Primer backup
    saveAutoBackup();
    localStorage.setItem("lastAutoBackup", new Date().toISOString());
    return;
  }

  const lastBackupDate = new Date(lastBackupKey);
  const now = new Date();
  const daysSinceLastBackup = (now - lastBackupDate) / (1000 * 60 * 60 * 24);

  if (daysSinceLastBackup >= AUTO_BACKUP_INTERVAL_DAYS) {
    saveAutoBackup();
    localStorage.setItem("lastAutoBackup", now.toISOString());
  }
}

// ── INITIALIZATION ──────────────────────────────────────────────
window.addEventListener("load", function() {
  loadProjects();
  renderSidebar();
  renderTasks();
  initializeTheme();
  checkAutoBackup(); // Verificar backup automático al cargar
});
// ── SIDEBAR COLAPSAR/EXPANDIR (solo escritorio) ─────────────────
(function () {
  const COLLAPSED_KEY = "anso-sidebar-collapsed";
  const sidebarEl        = document.querySelector(".sidebar");
  const mainPanel        = document.getElementById("main-panel");
  const collapseBtn      = document.getElementById("sidebar-collapse-btn");
  const expandBtn        = document.getElementById("sidebar-expand-btn");
  // Rail colapsado (v1): marca y avatar despliegan; buscar/Hoy/Inbox navegan.
  const railExpand       = document.getElementById("sidebar-rail-expand");
  const railAvatar       = document.getElementById("sidebar-rail-avatar");
  const railSearch       = document.getElementById("sidebar-rail-search");
  const railToday        = document.getElementById("sidebar-rail-today");
  const railInbox        = document.getElementById("sidebar-rail-inbox");

  function setSidebarCollapsed(collapsed) {
    if (!sidebarEl || !mainPanel) return;
    sidebarEl.classList.toggle("sidebar-collapsed", collapsed);
    mainPanel.classList.toggle("sidebar-is-collapsed", collapsed);
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    if (collapsed) syncSidebarRail();
  }

  if (collapseBtn)    collapseBtn.addEventListener("click",    function () { setSidebarCollapsed(true); });
  if (expandBtn)      expandBtn.addEventListener("click",      function () { setSidebarCollapsed(false); });
  if (railExpand)     railExpand.addEventListener("click",     function () { setSidebarCollapsed(false); });
  if (railAvatar)     railAvatar.addEventListener("click",     function () { setSidebarCollapsed(false); });
  if (railSearch)     railSearch.addEventListener("click",     function () { openGlobalSearch(); });
  if (railToday)      railToday.addEventListener("click",      function () { activateTodayView(); });
  if (railInbox)      railInbox.addEventListener("click",      function () { activateProject(INBOX_ID); });

  // Restaurar estado solo en escritorio
  if (window.innerWidth > 768) {
    if (localStorage.getItem(COLLAPSED_KEY) === "1") setSidebarCollapsed(true);
  }
})();

// ═══════════════════════════════════════════════════════════════
// CLOUD SYNC CALLBACKS
// ═══════════════════════════════════════════════════════════════

// ─── Claves por cuenta ────────────────────────────────────────
// Cada usuario tiene su propio espacio en localStorage:
//   anso-projects-{uid}, anso-sections-{uid}, anso-meta-{uid}
// Las claves anónimas (sin uid) son exclusivas del modo local.

function _acctKey(uid)      { return PROJECTS_KEY + "-" + uid; }
function _acctSectKey(uid)  { return SECTIONS_KEY + "-" + uid; }
function _acctMetaKey(uid)  { return METADATA_KEY + "-" + uid; }

function _saveAccountCache(uid) {
  var now = new Date().toISOString();
  safeLsSet(_acctKey(uid),     JSON.stringify(projects),  _showQuotaModal);
  safeLsSet(_acctSectKey(uid), JSON.stringify(sections),  _showQuotaModal);
  safeLsSet(_acctMetaKey(uid), JSON.stringify({ lastSavedAt: now }), _showQuotaModal);
}

var _syncWasConnected = false;

function _syncOnAuthChange(user) {
  _updateProfileMenu(user);
  if (!user && _syncWasConnected) {
    _clearLocalData();
  }
  _syncWasConnected = Boolean(user);
}

function _clearLocalData() {
  // Al cerrar sesión: limpiamos el espacio anónimo para que no contamine
  // el siguiente login. Los datos de la cuenta quedan en anso-projects-{uid}
  // y en la nube — no se pierden.
  projects          = [];
  sections          = [];
  activeProjectId   = null;
  activeView        = "project";

  // localStorage del espacio anónimo
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(SECTIONS_KEY);
  localStorage.removeItem(METADATA_KEY);
  localStorage.removeItem(ACTIVE_KEY);

  // El Inbox es estructural — siempre debe existir. Recrearlo tras el clear.
  ensureInbox();

  // Reset visual completo (panel vacío + sidebar repintada).
  activateProject(null);
}

function _updateProfileMenu(user) {
  var pfSigninBtn    = document.getElementById("pf-signin-btn");
  var pfSyncUser     = document.getElementById("pf-sync-user");
  var pfSyncSep      = document.getElementById("pf-sync-sep");
  var pfSyncName     = document.getElementById("pf-sync-name");
  var pfSignoutBtn   = document.getElementById("pf-signout-btn");
  var pfAvatar       = document.getElementById("profile-avatar");
  var pfAvatarTop    = document.getElementById("profile-avatar-top");
  var settingsAvatar = document.getElementById("settings-avatar");
  var pfName         = document.getElementById("profile-name");
  var pfNameTop      = document.getElementById("profile-name-top");
  var settingsName   = document.getElementById("settings-name");
  var pfSub          = document.getElementById("profile-sub");
  var pfSubTop       = document.getElementById("profile-sub-top");
  var settingsSub    = document.getElementById("settings-sub");
  var settingsSigninBtn = document.getElementById("settings-signin-btn");
  var settingsSyncUser  = document.getElementById("settings-sync-user");

  if (pfSyncSep)   pfSyncSep.hidden   = false;
  if (pfSigninBtn) pfSigninBtn.hidden = Boolean(user);
  if (pfSyncUser)  pfSyncUser.hidden  = !user;
  if (settingsSigninBtn) settingsSigninBtn.hidden = Boolean(user);
  if (settingsSyncUser)  settingsSyncUser.hidden  = !user;

  // Valores base según el modo (cuenta Google vs. local).
  var baseName, baseInitial;
  if (user) {
    baseInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "☁");
    baseName = user.displayName || user.email || t("profile.user_default");
    if (pfSub)      pfSub.innerHTML     = '<span class="profile-sync-dot"></span>' + t("profile.synced");
    if (pfSubTop)   pfSubTop.textContent = user.email || user.displayName || t("profile.sync_active");
    if (settingsSub) settingsSub.textContent = user.email || user.displayName || t("profile.sync_active");
    if (pfSyncName) pfSyncName.textContent = user.email || user.displayName || "";
    if (pfSignoutBtn) pfSignoutBtn.addEventListener("click", function() { window.AnsoSync?.signOut?.(); });
  } else {
    baseInitial = "A";
    baseName = "antask";
    if (pfSub)       pfSub.textContent       = t("profile.local");
    if (pfSubTop)    pfSubTop.textContent    = t("profile.local_storage");
    if (settingsSub) settingsSub.textContent = t("profile.local_storage");
  }

  // El nombre local tiene prioridad. El avatar es siempre su inicial: se
  // retiró el selector de emojis, así que ya no se lee userProfile.icon.
  var name  = (userProfile.name && userProfile.name.trim()) || baseName;
  var avatarValue = name ? name.charAt(0).toUpperCase() : baseInitial;

  _applyAvatar(pfAvatar, avatarValue);
  _applyAvatar(pfAvatarTop, avatarValue);
  _applyAvatar(settingsAvatar, avatarValue);
  // La pestaña «Perfil» de la barra inferior lleva el mismo avatar: en el
  // handoff ese destino se identifica por la cara, no por un icono.
  _applyAvatar(document.getElementById("bnav-avatar"), avatarValue);
  if (pfName)       pfName.textContent       = name;
  if (settingsName) settingsName.textContent = name;
  if (pfNameTop) pfNameTop.textContent = name;
}

function _applyAvatar(el, value) {
  if (!el) return;
  el.textContent = value;
}

function saveProfile() {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile)); } catch (_) {}
}

// Modal de edición del perfil local: solo el nombre. El avatar es siempre
// la inicial — el selector de emojis se retiró.
function showProfileModal() {
  var { overlay, box } = createModalBase();

  box.classList.add("modal-box-v1");
  box.innerHTML =
    modalHead(t("profile.edit_title"), "user-round") +
    '<div class="modal-body">' +
      '<input class="modal-input profile-name-input" type="text" maxlength="40"' +
        ' placeholder="' + escHtml(t("profile.name_placeholder")) + '"' +
        ' value="' + escHtml(userProfile.name || "") + '" autocomplete="off"/>' +
    '</div>' +
    '<div class="modal-foot">' +
      '<button type="button" class="modal-btn modal-btn-cancel profile-cancel">' + t("modal.cancel") + '</button>' +
      '<button type="button" class="modal-btn modal-btn-confirm profile-save">' + t("modal.save") + '</button>' +
    '</div>';
  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  var nameInput = box.querySelector('.profile-name-input');

  function save() {
    userProfile.name = nameInput.value.trim();
    // Limpia el emoji que hubiera guardado de antes: sin selector no habría
    // forma de quitarlo y el avatar se quedaría clavado.
    userProfile.icon = "";
    saveProfile();
    _updateProfileMenu(window.AnsoSync?.getUser?.() ?? null);
    closeModal(overlay);
  }

  overlay._cancel = function() { closeModal(overlay); };
  box.querySelector('.profile-cancel').addEventListener('click', function() { closeModal(overlay); });
  box.querySelector('.modal-head-close').addEventListener('click', function() { closeModal(overlay); });
  box.querySelector('.profile-save').addEventListener('click', save);

  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
  });

  setTimeout(function() { nameInput.focus(); nameInput.select(); }, 50);
}
window.showProfileModal = showProfileModal;

// Expuesta para que doSignIn() (sections-and-profile.js, otro módulo) pueda
// forzar un repintado tras un login fallido — sin esto, si algo dejaba el
// menú de perfil en un estado "conectado" que no correspondía al usuario
// real de Firebase, no había forma de corregirlo desde fuera hasta el
// siguiente onAuthStateChanged (que con un login fallido puede no llegar).
window._updateProfileMenu = _updateProfileMenu;

/** ¿Tiene algún proyecto de la lista al menos una tarea real? */
function _hasRealTasks(list) {
  return Array.isArray(list) && list.some(function(p) {
    return p && Array.isArray(p.tasks) && p.tasks.length > 0;
  });
}

function _syncOnFirstConnect(cloudData) {
  var user = window.AnsoSync?.getUser?.() ?? null;
  if (!user) return;
  var uid = user.uid;

  // ── ¿Tiene esta cuenta caché propio en este dispositivo? ──────
  var hasAccountCache = localStorage.getItem(_acctKey(uid)) !== null;

  if (hasAccountCache) {
    // Dispositivo ya usado con esta cuenta → comparar caché vs nube
    if (!cloudData || !Array.isArray(cloudData.projects)) {
      // Nube vacía → subir caché local
      try {
        projects = JSON.parse(localStorage.getItem(_acctKey(uid)) || "[]").map(sanitizeProject);
        sections = JSON.parse(localStorage.getItem(_acctSectKey(uid)) || "[]");
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
        renderSidebar(); renderTasks();
      } catch(e) {}
      window.AnsoSync?.scheduleSave?.(projects, sections);
      return;
    }
    var cachedMeta = JSON.parse(localStorage.getItem(_acctMetaKey(uid)) || "null");
    var localTime  = cachedMeta && cachedMeta.lastSavedAt ? new Date(cachedMeta.lastSavedAt).getTime() : 0;
    var cloudTime  = cloudData.updatedAt ? cloudData.updatedAt.toMillis() : 0;
    var cachedProjects  = JSON.parse(localStorage.getItem(_acctKey(uid)) || "[]");
    var cloudHasContent = _hasRealTasks(cloudData.projects);
    var localHasContent = _hasRealTasks(cachedProjects);

    // Una caché local VACÍA con marca de tiempo más reciente no debe ganar
    // nunca a datos reales de la nube: solo dice "aquí no se guardó nada
    // desde entonces", no "esto es lo correcto". Sin esta excepción, un
    // dispositivo recién limpiado que cachea su vacío se queda sordo a la
    // nube para siempre, aunque tenga todas las tareas esperando ahí.
    if (cloudTime >= localTime || (cloudHasContent && !localHasContent)) {
      _syncApplyRemote(cloudData.projects, cloudData.sections || [], uid);
    } else {
      // Caché local más reciente → restaurar y subir
      try {
        projects = JSON.parse(localStorage.getItem(_acctKey(uid)) || "[]").map(sanitizeProject);
        sections = JSON.parse(localStorage.getItem(_acctSectKey(uid)) || "[]");
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
        renderSidebar(); renderTasks();
      } catch(e) {}
      window.AnsoSync?.scheduleSave?.(projects, sections);
    }
    return;
  }

  // ── Primera vez con esta cuenta en este dispositivo ───────────
  // Solo cuenta como "datos anónimos" si hay tareas reales.
  // Proyectos vacíos auto-creados (Inbox) no deben disparar el modal de conflicto.
  var hasAnonymousData = projects.some(function(p) { return p.tasks && p.tasks.length > 0; });

  if (!cloudData || !Array.isArray(cloudData.projects)) {
    // Sin datos en la nube → inicializar caché con lo que haya en local
    _saveAccountCache(uid);
    if (projects.length > 0) window.AnsoSync?.scheduleSave?.(projects, sections);
    return;
  }

  if (!hasAnonymousData) {
    // Sin datos locales → usar nube directamente
    _syncApplyRemote(cloudData.projects, cloudData.sections || [], uid);
    return;
  }

  // ── Posible conflicto: hay datos locales Y datos en la nube ───
  // Si los timestamps son muy cercanos, es probablemente la misma sesión
  // (caso: usuario ya tenía cuenta y es la primera vez tras esta actualización)
  var anonMeta   = loadMetadata();
  var anonTime   = anonMeta.lastSavedAt ? new Date(anonMeta.lastSavedAt).getTime() : 0;
  var cloudTime2 = cloudData.updatedAt ? cloudData.updatedAt.toMillis() : 0;

  if (Math.abs(cloudTime2 - anonTime) < 15000) {
    // Menos de 15 s de diferencia → misma sesión, usar la más reciente
    if (cloudTime2 >= anonTime) _syncApplyRemote(cloudData.projects, cloudData.sections || [], uid);
    else { _saveAccountCache(uid); window.AnsoSync?.scheduleSave?.(projects, sections); }
    return;
  }

  // Diferencia significativa → preguntar al usuario
  _showSyncConflictModal(cloudData, uid);
}

function _showSyncConflictModal(cloudData, uid) {
  var localCount = projects.length;
  var cloudCount = Array.isArray(cloudData.projects) ? cloudData.projects.length : 0;
  var { overlay, box } = createModalBase();

  var bodyKey = "sync.conflict_body_" +
    (localCount === 1 ? "one_" : "other_") +
    (cloudCount === 1 ? "one"   : "other");
  var conflictBody = t(bodyKey)
    .replace("{local}", String(localCount))
    .replace("{cloud}", String(cloudCount));

  box.innerHTML =
    '<p class="modal-label">' + t("sync.conflict_title") + '</p>' +
    '<p style="font-size:0.88rem;color:var(--t-soft);margin-bottom:1.2rem;line-height:1.55">' + conflictBody + '</p>' +
    '<div class="modal-actions" style="flex-direction:column;gap:0.5rem">' +
      '<button type="button" class="modal-btn modal-btn-confirm" id="_sc-cloud">' + t("sync.use_cloud") + '</button>' +
      '<button type="button" class="modal-btn modal-btn-cancel" id="_sc-local">' + t("sync.use_local") + '</button>' +
    '</div>';

  // No se puede cerrar con Escape — el usuario debe elegir
  overlay._cancel = null;

  box.querySelector("#_sc-cloud").addEventListener("click", function() {
    closeModal(overlay);
    _syncApplyRemote(cloudData.projects, cloudData.sections || [], uid);
  });

  box.querySelector("#_sc-local").addEventListener("click", function() {
    closeModal(overlay);
    _saveAccountCache(uid);
    window.AnsoSync?.scheduleSave?.(projects, sections);
  });
}

function _syncOnRemoteChange(remoteProjects, remoteSections, remoteUpdatedAt) {
  var user = window.AnsoSync?.getUser?.() ?? null;
  var uid  = user ? user.uid : null;

  // Igual que en la primera conexión: si lo que llega de la nube es más
  // viejo que la última vez que este dispositivo guardó, se ignora. Sin
  // esto, un dispositivo que sube por error un estado antiguo (p.ej. tras
  // arrancar con la caché offline de Firestore desactualizada) pisaba sin
  // avisar los datos buenos de cualquier otro dispositivo conectado.
  if (uid && remoteUpdatedAt && typeof remoteUpdatedAt.toMillis === "function") {
    var cachedMeta = JSON.parse(localStorage.getItem(_acctMetaKey(uid)) || "null");
    var localTime  = cachedMeta && cachedMeta.lastSavedAt ? new Date(cachedMeta.lastSavedAt).getTime() : 0;
    // Mismo motivo que en _syncOnFirstConnect: un local vacío con marca de
    // tiempo reciente no debe silenciar datos reales de la nube para siempre.
    var localEmptyButNewer = remoteUpdatedAt.toMillis() < localTime &&
      _hasRealTasks(remoteProjects) && !_hasRealTasks(projects);
    if (remoteUpdatedAt.toMillis() < localTime && !localEmptyButNewer) {
      console.warn("AnsoSync: cambio remoto descartado por ser más antiguo que el local");
      return;
    }
  }

  _syncApplyRemote(remoteProjects, remoteSections || [], uid);
}

async function _syncApplyRemote(remoteProjects, remoteSections, uid) {
  try {
    var cleanProjects = remoteProjects.map(sanitizeProject);

    // Write to localStorage first — if this throws we haven't touched memory yet.
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(cleanProjects));
    if (Array.isArray(remoteSections)) {
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(remoteSections));
    }

    // Commit to memory only after successful persistence.
    projects = cleanProjects;
    ensureInbox();
    if (Array.isArray(remoteSections)) sections = remoteSections;

    if (uid) _saveAccountCache(uid);

    renderSidebar();
    var proj = getActiveProject();
    if (proj) {
      renderTasks();
    }
    updateSaveStatus(new Date().toISOString());
    _checkStorageWarning();
  } catch (e) {
    console.warn("AnsoSync: error aplicando cambios remotos:", e);
  }
}

// ─── ARRANQUE ────────────────────────────────────────────────
// Se ejecuta al final del fichero (no justo tras declarar el DOM) para que
// todas las const/let de nivel superior que usan las funciones de render
// (TASK_FILTERS, currentQuery, etc.) ya estén inicializadas.
try { initializeTheme(); } catch(e) { console.error("initializeTheme error:", e); }
try { initializeAccent(); } catch(e) { console.error("initializeAccent error:", e); }
try { initializeMode(); } catch(e) { console.error("initializeMode error:", e); }
try { applyTaskPrefs(); } catch(e) { console.error("applyTaskPrefs error:", e); }
try { applyRowStyle(currentRowStyle, false); } catch(e) { console.error("applyRowStyle error:", e); }
try { applyTwoColumns(twoColumnsOn, false); } catch(e) { console.error("applyTwoColumns error:", e); }
try { renderSidebar(); } catch(e) { console.error("renderSidebar error:", e); }
// Vista por defecto: "Hoy" (ya no se muestra la pantalla de estado vacío).
// Sólo se restaura una lista/proyecto si fue abierto explícitamente (hay una
// clave ACTIVE_KEY guardada y ese proyecto aún existe). En cualquier otro caso
// —incluido el arranque limpio o el "modo simple"— entramos directos en Hoy.
try {
  var _bootActive = localStorage.getItem(ACTIVE_KEY);
  if (_bootActive && projects.some(function(p) { return p.id === _bootActive; })) {
    activateProject(_bootActive);
  } else {
    activateTodayView();
  }
} catch(e) { console.error("boot view error:", e); }
try { _updateProfileMenu(window.AnsoSync?.getUser?.() ?? null); } catch(e) { console.error("_updateProfileMenu error:", e); }
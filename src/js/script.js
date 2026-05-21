// ─── IMPORTS ─────────────────────────────────────────────────
import { escHtml }                          from "./utils/html.js";
import { capitalizeFirst }                  from "./utils/string.js";
import { getDueDateState, formatDueDate }   from "./utils/date.js";
import { generateId }                       from "./utils/id.js";
import {
  createModalBase,
  closeModal,
  modalPrompt,
  modalConfirm,
  modalAlert,
  modalDate,
  modalRecurrence,
} from "./ui/modal.js";
import {
  PROJECTS_KEY,
  ACTIVE_KEY,
  METADATA_KEY,
  NOTES_KEY,
  TASK_PREFS_KEY,
  THEME_KEY,
  SECTIONS_KEY,
  migrateStorageIfNeeded,
} from "./state/keys.js";
import {
  sanitizeProject,
  sanitizeTasks,
  sanitizeSubtasks,
  sanitizeStandaloneNote,
} from "./state/sanitize.js";
import {
  loadProjects,
  loadSections,
  loadStandaloneNotes,
  loadMetadata,
  loadTaskPrefs,
} from "./state/persistence.js";
import {
  STATUS_CYCLE,
  STATUS_CONFIG,
  PRIORITY_CYCLE,
  PRIORITY_CONFIG,
  applyStatusToNode,
  updateStatusBtn,
  applyPriorityToNode,
  updatePriorityBtn,
  renderDueBadge,
  renderRecurBadge,
  updateRecurBtn,
} from "./ui/task-badges.js";
import {
  getLabelSlot,
  getLabelColor,
  renderTaskLabels,
} from "./ui/labels.js";
import { renderSubtasks } from "./ui/subtasks.js";
import { showGlobalSearch as _showGlobalSearch } from "./ui/search.js";
import {
  initializeTheme,
  toggleThemeWithTransition,
} from "./ui/theme.js";
import { renderCalendar as _renderCalendarModule } from "./ui/calendar.js";
import { renderAgenda as _renderAgendaModule } from "./ui/agenda.js";

/** Wrapper local que inyecta el estado actual al módulo de calendario. */
function renderCalendar() {
  _renderCalendarModule(calState.year, calState.month, projects, activateProject);
}

/** Wrapper local de agenda — inyecta proyectos y callback de navegación. */
function renderAgenda() {
  _renderAgendaModule(projects, activateProject);
}

// sections-and-profile.js usa window.toggleThemeWithTransition para
// el fallback cuando se pulsa "Cambiar tema" sin View Transition API.
window.toggleThemeWithTransition = toggleThemeWithTransition;

/**
 * Atajo no-args para la búsqueda global: inyecta los datos y los
 * callbacks que el módulo necesita (que viven en este script).
 * Se llama desde el sidebar, atajo Cmd+K, bottom-nav móvil, etc.
 */
function openGlobalSearch() {
  _showGlobalSearch({
    getProjects:        function() { return projects; },
    getStandaloneNotes: function() { return standaloneNotes; },
    onNavigateToTask:   navigateToTask,
    onActivateNote:     activateNote,
  });
}
// Lo expone también vía window porque el inline script de
// index.html (bottom-nav móvil) usa esa referencia global.
window.showGlobalSearch = openGlobalSearch;

// Otros módulos (sections-and-profile.js) acceden a modalAlert vía window.
window.modalAlert = modalAlert;

// ─── ALIASES DE GLOBALES (de otros módulos cargados antes) ───
// Capturamos los globales que exponen los demás módulos en window
// para poder usarlos con sintaxis bare (`AnsoSync.foo()`).
var AnsoSync          = window.AnsoSync          || null;
var setupPasteHandler = window.setupPasteHandler || null;
var setupImageResizer = window.setupImageResizer || null;

// ─── ELEMENTOS DOM ───────────────────────────────────────────
const projectListEl    = document.getElementById("project-list");
const newProjectBtn    = document.getElementById("new-project-btn");
const emptyState       = document.getElementById("empty-state");
const ctrlBar          = document.getElementById("ctrl-bar");
const tasksPanel       = document.getElementById("tasks-panel");
const projectTitleEl   = document.getElementById("project-title");
const projectSubtitle  = document.getElementById("project-subtitle");
const deleteProjectBtn = document.getElementById("delete-project-btn");
const taskForm         = document.getElementById("task-form");
const taskInput        = document.getElementById("task-input");
const taskList         = document.getElementById("task-list");

// ─── MOBILE FAB REFS ─────────────────────────────────────────
const mobileFab    = document.getElementById("mobile-fab");
const fabBackdrop  = document.getElementById("fab-backdrop");
const fabSheet     = document.getElementById("fab-sheet");
const fabForm      = document.getElementById("fab-form");
const fabInput     = document.getElementById("fab-input");
const taskCounter      = document.getElementById("task-counter");
const saveStatus       = document.getElementById("save-status");
const clearDoneBtn     = document.getElementById("clear-done");
const exportBtn        = document.getElementById("export-btn");
const importFile       = document.getElementById("import-file");
const filterButtons    = document.querySelectorAll("[data-filter]");
const template         = document.getElementById("task-item-template");

// ─── ESTADO ──────────────────────────────────────────────────
migrateStorageIfNeeded();

// Proyecto especial "Inbox" — siempre existe, fijo al tope de la sidebar.
const INBOX_ID = "__inbox__";

let projects        = loadProjects();
let sections        = loadSections();
let standaloneNotes = loadStandaloneNotes();

// Asegura que el proyecto Inbox existe (sólo la primera vez).
ensureInbox();

let activeProjectId = localStorage.getItem(ACTIVE_KEY) || null;
let activeNoteId    = null;
// Vista activa: "project" (default) | "today" (vista Hoy virtual).
let activeView      = "project";

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
let _notePanelSaveTimer = null;
let currentFilter      = "all";
let currentSort        = "manual";
let currentLabelFilter = null;   // null = sin filtro de etiqueta
var _sidebarPrevCounts = {};
const expandedTaskIds  = new Set();
let dragSrcId          = null;
let dropIndicator      = null;
let dragSrcProjectId   = null;
let projectDropIndicator = null;
let dragSrcSectionId   = null;

// ─── UNDO ESTADO ─────────────────────────────────────────────
let _undoStack = null;  // { projectId, task, index } | { projectId, tasks, indices }
let _undoTimer = null;

// ─── ARCHIVO DE PROYECTOS ─────────────────────────────────────
let _archivedExpanded = false;
let _notesExpanded    = true;
let taskPrefs         = loadTaskPrefs();

// ─── MULTI-SELECT ─────────────────────────────────────────────
let selectMode = false;
const selectedTaskIds = new Set();
const bulkActionBar  = document.getElementById("bulk-action-bar");
const bulkCount      = document.getElementById("bulk-count");
const selectModeBtn  = document.getElementById("select-mode-btn");

// ─── ARRANQUE ────────────────────────────────────────────────
try { initializeTheme(); } catch(e) { console.error("initializeTheme error:", e); }
try { applyTaskPrefs(); } catch(e) { console.error("applyTaskPrefs error:", e); }
try { renderSidebar(); } catch(e) { console.error("renderSidebar error:", e); }
try { activateProject(activeProjectId); } catch(e) { console.error("activateProject error:", e); }

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

// ─── CLOUD SYNC INIT ─────────────────────────────────────────
// El UI de sync vive ahora en el dropdown de perfil (sections-and-profile.js).
if (window.AnsoSync) {
  window.AnsoSync.init(_syncOnRemoteChange, _syncOnAuthChange, _syncOnFirstConnect);
}

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

var _taskPrefsBtnEl = document.getElementById("task-prefs-btn");
if (_taskPrefsBtnEl) _taskPrefsBtnEl.addEventListener("click", showTaskPrefsModal);

var _closePanelBtn = document.getElementById("close-panel-btn");
if (_closePanelBtn) _closePanelBtn.addEventListener("click", function() { activateProject(null); });

var _closeNoteBtn = document.getElementById("close-note-btn");
if (_closeNoteBtn) _closeNoteBtn.addEventListener("click", function() {
  var notePanel = document.getElementById("note-panel");
  if (notePanel) notePanel.hidden = true;
  activeNoteId = null;
  if (emptyState) emptyState.hidden = false;
  if (mobileFab)  mobileFab.classList.remove("visible");
  document.title = "antask";
  renderSidebar();
});
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

// Color palettes — standalone note panel
document.querySelectorAll(".fmt-color-wrap").forEach(function(wrap) {
  var colorBtn     = wrap.querySelector(".fmt-color-btn");
  var palette      = wrap.querySelector(".fmt-color-palette");
  var colorLabel   = wrap.querySelector(".fmt-color-label");
  if (!colorBtn || !palette) return;

  colorBtn.addEventListener("mousedown", function(e) {
    e.preventDefault();
    palette.hidden = !palette.hidden;
  });

  palette.querySelectorAll(".fmt-color-swatch").forEach(function(swatch) {
    swatch.addEventListener("mousedown", function(e) {
      e.preventDefault();
      var color = swatch.dataset.color;
      if (color) {
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, color);
        if (colorLabel) colorLabel.style.color = color;
      } else {
        document.execCommand("removeFormat", false, null);
        if (colorLabel) colorLabel.style.color = "";
      }
      palette.hidden = true;
      var editor = wrap.closest("[contenteditable]") ||
                   document.getElementById("note-editor");
      if (editor) editor.focus();
      if (typeof saveActiveNote === "function") saveActiveNote();
    });
  });

  document.addEventListener("mousedown", function(e) {
    if (!wrap.contains(e.target)) palette.hidden = true;
  });
});

// ─── ATAJOS DE TECLADO GLOBALES ───────────────────────────────
document.addEventListener("keydown", function(e) {
  const tag = document.activeElement && document.activeElement.tagName;
  const isEditing = tag === "INPUT" || tag === "TEXTAREA" ||
    (document.activeElement && document.activeElement.isContentEditable);

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openGlobalSearch();
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

  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    const input = document.getElementById("task-input");
    if (!input || !tasksPanel) return;
    if (tasksPanel.hidden && activeProjectId) {
      _closeAllAltPanels();
      tasksPanel.hidden = false;
      if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.remove("ctrl-bar--alt"); }
      _setActiveViewTab("tasks");
    }
    setTimeout(function() { input.focus(); input.select(); }, 50);
    return;
  }

  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    (async function() {
      var name = await modalPrompt("// Nueva sección", "", "Nombre de la sección");
      if (name === null) return;
      var trimmed = name.trim();
      if (!trimmed) return;
      sections.push({ id: "sec-" + Date.now(), name: trimmed, collapsed: false });
      saveSections();
      renderSidebar();
    })();
    return;
  }

  if (e.key === "a" || e.key === "A") {
    e.preventDefault();
    showAgendaPanel();
    return;
  }

  if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    showCalendarPanel();
    return;
  }
});

// ═══════════════════════════════════════════════════════════════
// PICKERS / MODALES CON ESTADO DE LA APP
// (los modales genéricos viven en ./ui/modal.js)
// ═══════════════════════════════════════════════════════════════

function showIconPicker(project) {
  var { overlay, box } = createModalBase();

  var emojis = [
    "📁","📂","🗂️","📋","📌","📎","🗒️","📝","✏️","🖊️",
    "💼","🏢","🏗️","🔧","⚙️","🛠️","🔬","🧪","💡","🔋",
    "🚀","🎯","🏆","🥇","🎖️","⭐","🌟","💎","🔥","⚡",
    "📊","📈","📉","💰","💳","🧾","📣","🔔","📡","🌐",
    "🎨","🎵","🎬","📸","🎮","🕹️","🎲","🧩","🎭","🎪",
    "🏠","🌱","🌿","🍀","🌸","🌊","🌍","☀️","🌙","❄️",
    "👥","🤝","🧠","💪","🏃","🧘","❤️","🦋","🐝","🦄",
    "📚","🎓","🏫","🔑","🗝️","🔐","🛡️","⚖️","🧭","🗺️",
  ];

  var gridHtml = emojis.map(function(e) {
    return '<button type="button" class="icon-picker-emoji' +
      (project.icon === e ? ' icon-picker-emoji--active' : '') +
      '" data-emoji="' + e + '">' + e + '</button>';
  }).join('');

  box.innerHTML =
    '<p class="modal-label">// Icono del proyecto</p>' +
    '<div class="icon-picker-grid">' + gridHtml + '</div>' +
    '<div class="icon-picker-custom">' +
      '<input class="modal-input icon-picker-input" type="text" maxlength="4"' +
        ' placeholder="O escribe un emoji..." autocomplete="off"/>' +
    '</div>' +
    '<div class="modal-actions">' +
      (project.icon ? '<button type="button" class="modal-btn modal-btn-cancel icon-picker-clear">Quitar icono</button>' : '') +
      '<button type="button" class="modal-btn modal-btn-cancel">Cancelar</button>' +
    '</div>';

  function apply(emoji) {
    project.icon = emoji;
    saveProjects();
    renderSidebar();
    closeModal(overlay);
  }

  overlay._cancel = function() { closeModal(overlay); };

  box.querySelector('.modal-btn-cancel:last-child').addEventListener('click', function() { closeModal(overlay); });

  var clearBtn = box.querySelector('.icon-picker-clear');
  if (clearBtn) clearBtn.addEventListener('click', function() { apply(''); });

  box.querySelectorAll('.icon-picker-emoji').forEach(function(btn) {
    btn.addEventListener('click', function() { apply(btn.dataset.emoji); });
  });

  var customInput = box.querySelector('.icon-picker-input');
  customInput.addEventListener('input', function() {
    var val = Array.from(customInput.value).slice(0, 2).join('');
    if (val) apply(val);
  });

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', handler); }
  });

  setTimeout(function() { customInput.focus(); }, 50);
}

function showColorPicker(project) {
  var { overlay, box } = createModalBase();

  var colors = [
    { name: "Rojo",      hex: "#ef4444" },
    { name: "Naranja",   hex: "#f97316" },
    { name: "Ámbar",     hex: "#f59e0b" },
    { name: "Oro",       hex: "#d97706" },
    { name: "Lima",      hex: "#84cc16" },
    { name: "Verde",     hex: "#22c55e" },
    { name: "Esmeralda", hex: "#10b981" },
    { name: "Cian",      hex: "#06b6d4" },
    { name: "Azul",      hex: "#3b82f6" },
    { name: "Índigo",    hex: "#6366f1" },
    { name: "Violeta",   hex: "#8b5cf6" },
    { name: "Púrpura",   hex: "#a855f7" },
    { name: "Rosa",      hex: "#ec4899" },
    { name: "Marrón",    hex: "#78716c" },
    { name: "Gris",      hex: "#64748b" },
    { name: "Plateado",  hex: "#94a3b8" },
  ];

  var swatchesHtml = colors.map(function(c) {
    return '<button type="button" class="color-picker-swatch' +
      (project.color === c.hex ? " color-picker-swatch--active" : "") +
      '" data-color="' + c.hex + '" title="' + c.name +
      '" style="background:' + c.hex + '"></button>';
  }).join("");

  box.innerHTML =
    '<div class="modal-icon"><i data-lucide="palette"></i></div>' +
    '<p class="modal-label">Color del proyecto</p>' +
    '<div class="color-picker-grid">' + swatchesHtml + "</div>" +
    '<div class="modal-actions">' +
      (project.color ? '<button type="button" class="modal-btn modal-btn-cancel color-picker-clear">Sin color</button>' : "") +
      '<button type="button" class="modal-btn modal-btn-cancel">Cancelar</button>' +
    "</div>";

  if (window.lucide) lucide.createIcons({ nodes: [box] });

  function apply(color) {
    project.color = color;
    saveProjects();
    renderSidebar();
    closeModal(overlay);
  }

  overlay._cancel = function() { closeModal(overlay); };
  box.querySelector(".modal-btn-cancel:last-child").addEventListener("click", function() { closeModal(overlay); });

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
 * Modal para seleccionar un proyecto de destino
 * @param {string} excludeProjectId — ID del proyecto actual (excluirlo de la lista)
 * @returns {Promise<string|null>} — ID del proyecto elegido o null si cancela
 */
function modalProjectPicker(excludeProjectId) {
  return new Promise(function(resolve) {
    var available = projects.filter(function(p) { return p.id !== excludeProjectId; });
    if (available.length === 0) {
      modalAlert("No hay otros proyectos disponibles.", "info");
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
      '<p class="modal-label">// Mover a proyecto</p>' +
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
newProjectBtn.addEventListener("click", async function() {
  const name = await modalPrompt("// Nombre del proyecto", "", "mi-proyecto...");
  if (!name) return;
  const project = {
    id: generateId(),
    name: capitalizeFirst(name.trim()).slice(0, 60),
    createdAt: new Date().toISOString(),
    tasks: [],
  };
  projects.push(project);
  saveProjects();
  renderSidebar();
  activateProject(project.id);
});

// ─── ELIMINAR PROYECTO ───────────────────────────────────────
if (deleteProjectBtn) deleteProjectBtn.addEventListener("click", async function() {
  const project = getActiveProject();
  if (!project) return;
  const confirmed = await modalConfirm(
    'Eliminar <strong>' + escHtml(project.name) + '</strong> y todas sus tareas?',
    "Eliminar"
  );
  if (!confirmed) return;
  projects = projects.filter(function(p) { return p.id !== project.id; });
  saveProjects();
  activeProjectId = null;
  localStorage.removeItem(ACTIVE_KEY);
  renderSidebar();
  activateProject(null);
});

// ─── FORMULARIO DE TAREA ─────────────────────────────────────
taskForm.addEventListener("submit", function(event) {
  event.preventDefault();
  // Fallback: si no hay proyecto activo (ej. usuario sale del último proyecto)
  // mandamos la tarea al Inbox automáticamente.
  let project = getActiveProject();
  if (!project) {
    project = projects.find(function(p) { return p.id === INBOX_ID; });
    if (!project) return;
  }
  const text = capitalizeFirst(taskInput.value.trim());
  if (!text) return;
  project.tasks.unshift({
    id: generateId(),
    text: text,
    comment: "",
    done: false,
    status: null,
    dueDate: null,
    recurDays: null,
    timeLogged: 0,
    subtasks: [],
  });
  taskInput.value = "";
  saveAndRender();
});

// ─── MOBILE FAB ──────────────────────────────────────────────
function openFabSheet() {
  if (!mobileFab || !fabSheet || !fabBackdrop) return;
  mobileFab.classList.add("open");
  fabSheet.classList.add("open");
  fabBackdrop.classList.add("active");
  fabSheet.setAttribute("aria-hidden", "false");
  setTimeout(function() { if (fabInput) fabInput.focus(); }, 60);
}

function closeFabSheet() {
  if (!mobileFab || !fabSheet || !fabBackdrop) return;
  mobileFab.classList.remove("open");
  fabSheet.classList.remove("open");
  fabBackdrop.classList.remove("active");
  fabSheet.setAttribute("aria-hidden", "true");
  if (fabInput) fabInput.value = "";
}

if (mobileFab) {
  mobileFab.addEventListener("click", function() {
    fabSheet && fabSheet.classList.contains("open") ? closeFabSheet() : openFabSheet();
  });
}
if (fabBackdrop) fabBackdrop.addEventListener("click", closeFabSheet);

if (fabForm) {
  fabForm.addEventListener("submit", function(e) {
    e.preventDefault();
    let project = getActiveProject();
    if (!project) {
      project = projects.find(function(p) { return p.id === INBOX_ID; });
      if (!project) return;
    }
    const text = fabInput ? capitalizeFirst(fabInput.value.trim()) : "";
    if (!text) return;
    project.tasks.unshift({
      id: generateId(),
      text: text,
      comment: "",
      done: false,
      status: null,
      dueDate: null,
      recurDays: null,
      timeLogged: 0,
      subtasks: [],
    });
    closeFabSheet();
    saveAndRender();
  });
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape" && fabSheet && fabSheet.classList.contains("open")) closeFabSheet();
});

// ─── LIMPIAR HECHAS ──────────────────────────────────────────
clearDoneBtn.addEventListener("click", function() {
  const project = getActiveProject();
  if (!project) return;
  project.tasks = project.tasks.filter(function(t) { return !t.done; });
  saveAndRender();
});

// ─── EXPORTAR (workspace completo) ───────────────────────────
exportBtn.addEventListener("click", function() {
  if (projects.length === 0) {
    modalAlert("No hay proyectos que exportar.", "info");
    return;
  }
  const backup = {
    version: 2,
    exportedAt: new Date().toISOString(),
    projects: projects,
    sections: sections,
    standaloneNotes: standaloneNotes,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
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
        "Esto reemplazará <strong>todos los proyectos actuales</strong> con el backup. ¿Continuar?",
        "Restaurar workspace"
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
      if (Array.isArray(parsed.standaloneNotes)) {
        standaloneNotes = parsed.standaloneNotes.map(sanitizeStandaloneNote);
        localStorage.setItem(NOTES_KEY, JSON.stringify(standaloneNotes));
      }
      activeProjectId = projects.length > 0 ? projects[0].id : null;
      if (activeProjectId) localStorage.setItem(ACTIVE_KEY, activeProjectId);
      else localStorage.removeItem(ACTIVE_KEY);
      saveProjects();
      renderSidebar();
      activateProject(activeProjectId);
      var secCount = Array.isArray(parsed.sections) ? parsed.sections.length : 0;
      await modalAlert(
        "Workspace restaurado con " + projects.length + " proyecto(s)" +
        (secCount > 0 ? " y " + secCount + " sección(es)" : "") + ".",
        "info"
      );
      return;
    }

    // ── Backup antiguo de un solo proyecto ──
    const currentProject = getActiveProject();
    const importedTasks = Array.isArray(parsed) ? parsed : parsed.tasks;
    if (!Array.isArray(importedTasks)) {
      await modalAlert("Formato no válido. Asegúrate de importar un backup generado por antask.", "error");
      return;
    }
    if (!currentProject) {
      await modalAlert("Selecciona un proyecto antes de importar un backup de proyecto individual.", "error");
      return;
    }
    currentProject.tasks = sanitizeTasks(importedTasks);
    if (typeof parsed.notes === "string") currentProject.notes = parsed.notes;
    saveAndRender();
  } catch(e) {
    await modalAlert("No se pudo importar. Revisa que el archivo sea un JSON válido.", "error");
  } finally {
    importFile.value = "";
  }
});

// ─── FILTROS ─────────────────────────────────────────────────
var _filterLabels = { all: "Todas", pending: "Pendientes", done: "Hechas" };

function applyFilter(value) {
  currentFilter = value;
  document.querySelectorAll("#filter-panel [data-filter]").forEach(function(b) {
    b.classList.toggle("filter-opt--active", b.dataset.filter === value);
  });
  _updateFilterTriggerLabel();
  renderTasks();
}
window.applyFilter = applyFilter;

// ─── ORDENACIÓN ──────────────────────────────────────────────
function applySort(value) {
  currentSort = value;
  document.querySelectorAll("#filter-panel [data-sort]").forEach(function(b) {
    b.classList.toggle("filter-opt--active", b.dataset.sort === value);
  });
  _updateFilterTriggerLabel();
  renderTasks();
}

function _syncFilterPanel(filter, sort) {
  document.querySelectorAll("#filter-panel [data-filter]").forEach(function(b) {
    b.classList.toggle("filter-opt--active", b.dataset.filter === filter);
  });
  document.querySelectorAll("#filter-panel [data-sort]").forEach(function(b) {
    b.classList.toggle("filter-opt--active", b.dataset.sort === sort);
  });
  var triggerBtn = document.getElementById("filter-trigger-btn");
  if (triggerBtn) triggerBtn.classList.remove("filter-trigger-btn--active");
  var labelEl = document.getElementById("filter-trigger-label");
  if (labelEl) labelEl.textContent = "Filtrar";
}

function _updateFilterTriggerLabel() {
  var labelEl    = document.getElementById("filter-trigger-label");
  var triggerBtn = document.getElementById("filter-trigger-btn");
  if (!labelEl) return;
  var parts = [];
  if (currentFilter !== "all")    parts.push(currentFilter === "pending" ? "Pendientes" : "Hechas");
  if (currentSort   !== "manual") parts.push(currentSort === "priority" ? "Prioridad" : currentSort === "due" ? "Fecha" : "A–Z");
  if (triggerBtn) triggerBtn.classList.toggle("filter-trigger-btn--active", parts.length > 0);
  labelEl.textContent = parts.length > 0 ? parts.join(", ") : "Filtrar";
}

// ─── STORAGE EVENT ───────────────────────────────────────────
window.addEventListener("storage", function(event) {
  if (event.key === PROJECTS_KEY) {
    projects = loadProjects();
    renderSidebar();
    renderTasks();
  }
  if (event.key === THEME_KEY) initializeTheme();
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
  activeNoteId = null;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);

  // Cierra paneles alternativos si estaban abiertos
  _closeAllAltPanels();

  const project = getActiveProject();
  const hasProject = Boolean(project);

  emptyState.hidden = hasProject;
  if (ctrlBar) { ctrlBar.hidden = !hasProject; ctrlBar.classList.remove("ctrl-bar--alt"); }
  if (mobileFab) mobileFab.classList.toggle("visible", hasProject);
  tasksPanel.hidden = !hasProject;
  // Restauramos el formulario por si veníamos de la vista Hoy.
  if (taskForm) taskForm.style.display = hasProject ? "" : "none";
  if (hasProject) _setActiveViewTab("tasks");
  if (!hasProject) document.title = "antask";

  // Update mobile header: show project title or logo
  var mobileHeader = document.getElementById("mobile-header");
  var mobileHeaderTitle = document.getElementById("mobile-header-title");
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeader) {
    mobileHeader.classList.toggle("mobile-header--project", hasProject);
    if (mobileHeaderTitle) mobileHeaderTitle.textContent = hasProject ? project.name : "";
    if (mobileHeaderCount) mobileHeaderCount.textContent = hasProject
      ? project.tasks.filter(function(t) { return !t.done; }).length + " pendientes"
      : "";
  }

  if (!hasProject) { renderSidebar(); return; }

  projectTitleEl.textContent = project.name;
  projectSubtitle.textContent = "// " + project.tasks.length + " tarea" + (project.tasks.length !== 1 ? "s" : "");

  if (selectMode) exitSelectMode();
  currentFilter = "all";
  currentSort   = "manual";
  currentLabelFilter = null;
  _syncFilterPanel("all", "manual");

  expandedTaskIds.clear();
  renderSidebar();
  renderTasks();
  renderLabelFilterBar();
  updateSaveStatus(loadMetadata().lastSavedAt);
}

/**
 * Activa la vista virtual "Hoy" — muestra todas las tareas
 * pendientes con dueDate <= hoy de todos los proyectos.
 */
function activateTodayView() {
  activeView = "today";
  activeProjectId = null;
  activeNoteId = null;
  localStorage.removeItem(ACTIVE_KEY);

  _closeAllAltPanels();

  emptyState.hidden = true;
  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.remove("ctrl-bar--alt"); }
  if (mobileFab) mobileFab.classList.remove("visible");
  tasksPanel.hidden = false;
  _setActiveViewTab("tasks");

  // El task-form no aplica en Hoy — ocultar input.
  if (taskForm) taskForm.style.display = "none";

  // Mobile header
  var mobileHeader = document.getElementById("mobile-header");
  var mobileHeaderTitle = document.getElementById("mobile-header-title");
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeader) mobileHeader.classList.add("mobile-header--project");
  if (mobileHeaderTitle) mobileHeaderTitle.textContent = "Hoy";
  if (mobileHeaderCount) mobileHeaderCount.textContent = "";

  document.title = "Hoy — antask";
  if (projectTitleEl)  projectTitleEl.textContent  = "Hoy";
  if (projectSubtitle) projectSubtitle.textContent = "// vencidas y de hoy, todos los proyectos";

  if (selectMode) exitSelectMode();
  currentFilter = "all";
  currentSort   = "manual";
  currentLabelFilter = null;
  _syncFilterPanel("all", "manual");

  expandedTaskIds.clear();
  renderSidebar();
  renderTasks();
  if (typeof renderLabelFilterBar === "function") {
    var bar = document.getElementById("label-filter-bar");
    if (bar) bar.hidden = true;  // sin filtro de etiquetas en Hoy
  }
}

/**
 * Pinta los items fijos al tope de la sidebar: vista "Hoy" + proyecto Inbox.
 * Se redibujan en cada renderSidebar().
 */
function renderPinnedItems(inboxProject) {
  // ── Item "Hoy" — vista virtual ─────────────────────────────────
  var today = new Date().toISOString().slice(0, 10);
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
      '<span class="project-item-icon project-item-icon--system">☀️</span>' +
      '<span class="project-item-name">Hoy</span>' +
      (todayCount > 0 ? '<span class="project-item-count">' + todayCount + '</span>' : "") +
    '</div>';
  hoy.addEventListener("click", function() { activateTodayView(); });
  projectListEl.appendChild(hoy);

  // ── Item Inbox — proyecto real, fijado ─────────────────────────
  if (inboxProject) {
    var pending = (inboxProject.tasks || []).filter(function(t) { return !t.done; }).length;
    var inbox = document.createElement("li");
    inbox.className = "project-item project-item-pinned project-item-inbox" +
      (activeView === "project" && activeProjectId === INBOX_ID ? " active" : "");
    inbox.dataset.projectId = INBOX_ID;
    inbox.innerHTML =
      '<div class="project-item-top">' +
        '<span class="project-item-icon">📥</span>' +
        '<span class="project-item-name">Inbox</span>' +
        (pending > 0 ? '<span class="project-item-count">' + pending + '</span>' : "") +
      '</div>';
    inbox.addEventListener("click", function() { activateProject(INBOX_ID); });
    projectListEl.appendChild(inbox);
  }

  // ── Separador visual ───────────────────────────────────────────
  var sep = document.createElement("li");
  sep.className = "project-pinned-sep";
  sep.setAttribute("aria-hidden", "true");
  projectListEl.appendChild(sep);
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
  const knownSectionIds = new Set(sections.map(function(s) { return s.id; }));
  // Inbox y otros proyectos se separan: Inbox vive en su propio "pin" arriba.
  const inboxProject = projects.find(function(p) { return p.id === INBOX_ID; });
  const realActive   = projects.filter(function(p) { return !p.archived && p.id !== INBOX_ID; });
  const archived     = projects.filter(function(p) { return p.archived; });
  const ungrouped    = realActive.filter(function(p) { return !p.sectionId || !knownSectionIds.has(p.sectionId); });

  // ── Items fijados al tope: Hoy + Inbox ───────────────────────
  renderPinnedItems(inboxProject);

  if (realActive.length === 0 && sections.length === 0 && archived.length === 0) {
    return;
  }

  ungrouped.forEach(function(p) { renderProjectItem(p); });

  sections.forEach(function(section) {
    const sectionProjects = realActive.filter(function(p) { return p.sectionId === section.id; });
    renderSectionHeader(section, sectionProjects);
    if (!section.collapsed) {
      sectionProjects.forEach(function(p) { renderProjectItem(p, true); });
    }
  });

  if (window.lucide) lucide.createIcons();
  renderArchivedWidget();
  renderNotesSidebar();
}

function renderArchivedWidget() {
  var wrap = document.getElementById("archived-section");
  if (!wrap) return;
  wrap.innerHTML = "";

  var archived = projects.filter(function(p) { return p.archived; });
  if (archived.length === 0) return;

  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "archived-section-toggle";
  toggle.innerHTML =
    '<i data-lucide="' + (_archivedExpanded ? "chevron-down" : "chevron-right") + '"></i>' +
    '<i data-lucide="archive"></i>' +
    '<span>Archivados</span>' +
    '<span class="archived-section-count">' + archived.length + '</span>';
  toggle.addEventListener("click", function() {
    _archivedExpanded = !_archivedExpanded;
    renderArchivedWidget();
    if (window.lucide) lucide.createIcons({ nodes: [wrap] });
  });
  wrap.appendChild(toggle);

  if (_archivedExpanded) {
    var list = document.createElement("ul");
    list.className = "archived-project-list";
    archived.forEach(function(p) { renderProjectItem(p, false, true, list); });
    wrap.appendChild(list);
  }

  if (window.lucide) lucide.createIcons({ nodes: [wrap] });
}

function renderSectionHeader(section, sectionProjects) {
  const li = document.createElement("li");
  li.className = "section-header";
  li.setAttribute("data-section-id", section.id);

  const sectionDragHandle = document.createElement("span");
  sectionDragHandle.className = "section-drag-handle";
  sectionDragHandle.innerHTML = '<i data-lucide="grip-vertical"></i>';
  sectionDragHandle.setAttribute("aria-hidden", "true");

  const chevron = document.createElement("span");
  chevron.className = "section-chevron";
  chevron.innerHTML = section.collapsed
    ? '<i data-lucide="chevron-right"></i>'
    : '<i data-lucide="chevron-down"></i>';

  const nameEl = document.createElement("span");
  nameEl.className = "section-name";
  nameEl.textContent = section.name;

  const countEl = document.createElement("span");
  countEl.className = "section-count";
  countEl.textContent = sectionProjects.length;

  const menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "section-menu-btn";
  menuBtn.innerHTML = '<i data-lucide="ellipsis"></i>';
  menuBtn.title = "Opciones de sección";
  menuBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    showSectionMenu(section, menuBtn);
  });

  li.appendChild(sectionDragHandle);
  li.appendChild(chevron);
  li.appendChild(nameEl);
  li.appendChild(countEl);
  li.appendChild(menuBtn);
  li.addEventListener("click", function(e) {
    if (e.target.closest(".section-drag-handle") || e.target.closest(".section-menu-btn")) return;
    section.collapsed = !section.collapsed;
    saveSections();
    renderSidebar();
  });

  initSectionDropTarget(li, section);
  initSectionDragDrop(li, section.id);
  projectListEl.appendChild(li);
}

function renderProjectItem(project, indented, isArchived, parentEl) {
  const target = parentEl || projectListEl;
  const li = document.createElement("li");
  li.className = "project-item" + (indented ? " project-item-indented" : "") + (isArchived ? " project-item-archived" : "");
  li.dataset.projectId = project.id;
  if (project.id === activeProjectId) li.classList.add("active");

  const done  = project.tasks.filter(function(t) { return t.done; }).length;
  const total = project.tasks.length;

  const iconBtn = project.icon ? document.createElement("button") : null;
  if (iconBtn) {
    iconBtn.type = "button";
    iconBtn.className = "project-item-icon";
    iconBtn.textContent = project.icon;
    iconBtn.title = "Cambiar icono";
    iconBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      showIconPicker(project);
    });
  }

  const nameSpan = document.createElement("span");
  nameSpan.className = "project-item-name";
  nameSpan.textContent = project.name;
  nameSpan.title = "Doble clic para renombrar";
  nameSpan.addEventListener("dblclick", async function(e) {
    e.stopPropagation();
    const newName = await modalPrompt("// Cambiar nombre del proyecto", project.name, project.name);
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
  kebabBtn.title = "Opciones";
  kebabBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    showProjectMenu(project, kebabBtn);
  });

  const dragHandle = document.createElement("span");
  dragHandle.className = "project-drag-handle";
  dragHandle.innerHTML = '<i data-lucide="grip-vertical"></i>';
  dragHandle.title = "Arrastrar para reordenar";
  dragHandle.setAttribute("aria-hidden", "true");

  const colorDot = project.color ? document.createElement("span") : null;
  if (colorDot) {
    colorDot.className = "project-color-dot";
    colorDot.style.background = project.color;
  }

  const topRow = document.createElement("div");
  topRow.className = "project-item-top";
  topRow.appendChild(dragHandle);
  if (colorDot) topRow.appendChild(colorDot);
  if (iconBtn) topRow.appendChild(iconBtn);
  topRow.appendChild(nameSpan);
  topRow.appendChild(countSpan);
  topRow.appendChild(kebabBtn);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.createElement("div");
  bar.className = "project-progress-bar";
  bar.innerHTML = '<div class="project-progress-fill" style="width:' + pct + '%"></div>';

  if (project.color) li.style.setProperty("--project-color", project.color);

  li.setAttribute("draggable", "false");
  li.appendChild(topRow);
  if (total > 0) li.appendChild(bar);
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

// ── Context menus for sections and projects ─────────────────────────────────

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

async function showSectionMenu(section, anchor) {
  closeCtxMenu();

  var items = [
    {
      label: "Renombrar sección",
      action: async function() {
        var newName = await modalPrompt("// Cambiar nombre de sección", section.name, section.name);
        if (newName === null) return;
        var trimmed = capitalizeFirst(newName.trim());
        if (!trimmed || trimmed === section.name) return;
        section.name = trimmed;
        saveSections();
        renderSidebar();
      }
    },
    null,
    {
      label: "Eliminar sección",
      danger: true,
      action: async function() {
        var inSection = projects.filter(function(p) { return p.sectionId === section.id; });
        var count     = inSection.length;
        var message   = count === 0
          ? "¿Eliminar la sección <strong>" + escHtml(section.name) + "</strong>?"
          : "¿Eliminar la sección <strong>" + escHtml(section.name) + "</strong> y sus " +
            count + " proyecto" + (count === 1 ? "" : "s") +
            "? Esta acción no se puede deshacer.";
        var ok = await modalConfirm(message, "Eliminar");
        if (!ok) return;

        // Borrar también todos los proyectos de la sección (cascada).
        var deletedIds = new Set(inSection.map(function(p) { return p.id; }));
        projects = projects.filter(function(p) { return !deletedIds.has(p.id); });
        sections = sections.filter(function(s) { return s.id !== section.id; });

        // Si el proyecto activo era uno de los borrados, saltamos al primer proyecto restante (o ninguno).
        if (deletedIds.has(activeProjectId)) {
          var stillActive = projects.filter(function(p) { return !p.archived; });
          activeProjectId = stillActive.length > 0 ? stillActive[0].id : null;
        }

        saveProjects();
        saveSections();
        renderSidebar();
        activateProject(activeProjectId);
      }
    }
  ];

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

async function showProjectMenu(project, anchor) {
  closeCtxMenu();

  var sectionOptions = sections.map(function(s) {
    return {
      label: (project.sectionId === s.id ? "• " : "  ") + s.name,
      action: function() {
        project.sectionId = project.sectionId === s.id ? null : s.id;
        saveProjects();
        renderSidebar();
      }
    };
  });

  var assignGroup = sectionOptions.length > 0
    ? [{ label: "Mover a sección", header: true }].concat(sectionOptions).concat([null])
    : [];

  var archiveItems = project.archived
    ? [
        {
          label: "Restaurar proyecto",
          action: function() {
            project.archived = false;
            saveProjects();
            renderSidebar();
          }
        },
        null,
        {
          label: "Eliminar permanentemente",
          danger: true,
          action: async function() {
            var ok = await modalConfirm(
              "¿Eliminar permanentemente <strong>" + escHtml(project.name) + "</strong> y todas sus tareas? Esta acción no se puede deshacer.",
              "Eliminar"
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
          label: "Cambiar icono",
          action: function() { showIconPicker(project); }
        },
        {
          label: "Cambiar color",
          action: function() { showColorPicker(project); }
        },
        {
          label: "Renombrar proyecto",
          action: async function() {
            var newName = await modalPrompt("// Cambiar nombre del proyecto", project.name, project.name);
            if (newName === null) return;
            var trimmed = capitalizeFirst(newName.trim());
            if (!trimmed || trimmed === project.name) return;
            project.name = trimmed;
            saveProjects();
            renderSidebar();
            if (project.id === activeProjectId) activateProject(project.id);
          }
        },
        null,
        {
          label: "Archivar proyecto",
          action: function() {
            project.archived = true;
            project.sectionId = null;
            if (activeProjectId === project.id) {
              var active = projects.filter(function(p) { return !p.archived; });
              activeProjectId = active.length > 0 ? active[0].id : null;
            }
            _archivedExpanded = true;
            saveProjects();
            renderSidebar();
            renderTasks();
          }
        },
        {
          label: "Eliminar proyecto",
          danger: true,
          action: async function() {
            var ok = await modalConfirm(
              "¿Eliminar el proyecto <strong>" + escHtml(project.name) + "</strong> y todas sus tareas?",
              "Eliminar"
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

  var items = assignGroup.concat(archiveItems);

  // El proyecto Inbox no se puede archivar ni eliminar.
  if (project.id === INBOX_ID) {
    items = items.filter(function(it) {
      if (!it || it === null) return true;
      var lbl = it.label || "";
      return lbl !== "Archivar proyecto" &&
             lbl !== "Eliminar proyecto" &&
             lbl !== "Mover a sección" &&
             lbl !== "Quitar de sección";
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

// New section button
(function() {
  var newSectionBtn = document.getElementById("new-section-btn");
  if (newSectionBtn) {
    newSectionBtn.addEventListener("click", async function() {
      var name = await modalPrompt("// Nueva sección", "", "Nombre de la sección");
      if (name === null) return;
      var trimmed = name.trim();
      if (!trimmed) return;
      sections.push({ id: "sec-" + Date.now(), name: trimmed, collapsed: false });
      saveSections();
      renderSidebar();
    });
  }
})();

// ── End context menus ────────────────────────────────────────────────────────

function renderTasks() {
  // Vista virtual "Hoy" — render alternativo
  if (activeView === "today") {
    renderTodayView();
    return;
  }
  const project = getActiveProject();
  if (!project) { taskList.innerHTML = ""; return; }

  taskList.innerHTML = "";
  getVisibleTasks(project).forEach(function(task) {
    const node       = template.content.firstElementChild.cloneNode(true);
    const checkbox   = node.querySelector(".task-toggle");
    const text       = node.querySelector(".task-text");
    const comment    = node.querySelector(".task-comment");
    const commentBtn = node.querySelector(".comment-btn");
    const deleteBtn  = node.querySelector(".delete-btn");
    const subAddBtn  = node.querySelector(".subtask-add-btn");
    const subtaskList= node.querySelector(".subtask-list");
    const statusBtn     = node.querySelector(".status-btn");
    const priorityBtn   = node.querySelector(".priority-btn");
    const labelsContainer = node.querySelector(".task-labels-container");
    const recurBtn   = node.querySelector(".recur-btn");

    checkbox.checked       = task.done;
    text.textContent       = task.text;
    comment.textContent    = task.comment || "Sin comentario";
    node.classList.toggle("done", task.done);

    applyStatusToNode(node, task);
    updateStatusBtn(statusBtn, task);
    applyPriorityToNode(node, task);
    updatePriorityBtn(priorityBtn, task);
    renderTaskLabels(task, labelsContainer, function(labelName) {
      currentLabelFilter = currentLabelFilter === labelName ? null : labelName;
      renderLabelFilterBar();
      renderTasks();
    });
    renderSubtasks(task, subtaskList, {
      onMutation:  saveAndRender,
      onEditStart: startSubtaskInlineEdit,
    });

    if (expandedTaskIds.has(task.id)) {
      node.classList.add("expanded");
      node.setAttribute("aria-expanded", "true");
    }

    checkbox.addEventListener("click", function(e) { e.stopPropagation(); });
    checkbox.addEventListener("change", function() {
      task.done = checkbox.checked;
      if (task.done) task.status = null;
      if (task.done) {
        node.classList.add("task-completing");
        setTimeout(function() {
          if (task.recurDays) {
            task.done = false;
            task.status = null;
            var next = new Date();
            if (task.dueDate) {
              next = new Date(task.dueDate + "T00:00:00");
              next.setDate(next.getDate() + task.recurDays);
            } else {
              next.setDate(next.getDate() + task.recurDays);
            }
            task.dueDate = next.toISOString().slice(0, 10);
            saveAndRender();
            _showRecurToast(task.recurDays, task.dueDate);
          } else {
            saveAndRender();
          }
        }, 320);
      } else {
        node.classList.add("task-uncompleting");
        setTimeout(function() { saveAndRender(); }, 220);
      }
      renderDueBadge(task, node.querySelector(".task-due-container"));
    });

    text.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      startInlineEdit(text, task);
    });
    text.title = "Doble clic para renombrar";

    statusBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (task.done) return;
      cycleStatus(task);
    });

    priorityBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      cyclePriority(task);
    });

    // ── Fecha límite ──────────────────────────────────────
    const dueBadgeContainer = node.querySelector(".task-due-container");
    renderDueBadge(task, dueBadgeContainer);

    // ── Recurrencia ───────────────────────────────────────
    renderRecurBadge(task, node.querySelector(".task-recur-container"));
    updateRecurBtn(recurBtn, task);
    recurBtn.addEventListener("click", async function(e) {
      e.stopPropagation();
      var result = await modalRecurrence(task.recurDays || null);
      if (result === undefined) return;       // cancelado
      task.recurDays = result;                // null = quitar, número = días
      saveAndRender();
    });

    const dateBtn = node.querySelector(".date-btn");
    dateBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      modalDate(task.dueDate || null).then(function(result) {
        if (result === undefined) return;
        task.dueDate = result === "clear" ? null : result;
        saveAndRender();
      });
    });

    commentBtn.addEventListener("click", async function(e) {
      e.stopPropagation();
      const next = await modalPrompt("// Comentario", task.comment || "", "escribe un comentario...");
      if (next === null) return;
      task.comment = next.trim().slice(0, 300);
      saveAndRender();
    });

    const labelAddBtn = node.querySelector(".label-add-btn");
    labelAddBtn.addEventListener("click", async function(e) {
      e.stopPropagation();
      await showLabelPicker(task);
    });

    subAddBtn.addEventListener("click", async function(e) {
      e.stopPropagation();
      const subText = await modalPrompt("// Nueva subtarea", "", "escribe la subtarea...");
      if (!subText || !subText.trim()) return;
      task.subtasks.unshift({ id: generateId(), text: subText.trim().slice(0, 120), done: false });
      saveAndRender();
    });

    if (window.matchMedia("(max-width: 768px)").matches) {
      const extraContent = node.querySelector(".task-extra-content");
      const inlineActions = document.createElement("div");
      inlineActions.className = "mobile-inline-actions";

      const editCommentBtn = document.createElement("button");
      editCommentBtn.type = "button";
      editCommentBtn.className = "mobile-inline-btn";
      editCommentBtn.textContent = task.comment ? "Editar comentario" : "Añadir comentario";
      editCommentBtn.addEventListener("click", async function(e) {
        e.stopPropagation();
        const next = await modalPrompt("// Comentario", task.comment || "", "escribe un comentario...");
        if (next === null) return;
        task.comment = next.trim().slice(0, 300);
        saveAndRender();
      });

      const addSubtaskBtn = document.createElement("button");
      addSubtaskBtn.type = "button";
      addSubtaskBtn.className = "mobile-inline-btn";
      addSubtaskBtn.textContent = "+ Añadir subtarea";
      addSubtaskBtn.addEventListener("click", async function(e) {
        e.stopPropagation();
        const subText = await modalPrompt("// Nueva subtarea", "", "escribe la subtarea...");
        if (!subText || !subText.trim()) return;
        task.subtasks.unshift({ id: generateId(), text: subText.trim().slice(0, 120), done: false });
        saveAndRender();
      });

      inlineActions.append(editCommentBtn, addSubtaskBtn);
      extraContent.insertBefore(inlineActions, subtaskList);
    }

    deleteBtn.addEventListener("click", function() {
      const taskIndex = project.tasks.findIndex(function(t) { return t.id === task.id; });
      _undoStack = { projectId: project.id, task: JSON.parse(JSON.stringify(task)), index: taskIndex };
      expandedTaskIds.delete(task.id);
      project.tasks = project.tasks.filter(function(t) { return t.id !== task.id; });
      saveAndRender();
      showUndoToast();
    });

    node.addEventListener("click", function(e) {
      if (e.target.closest("button")) return;
      if (e.target.closest(".subtask-list")) return;
      if (selectMode) {
        e.preventDefault();
        toggleTaskSelection(task.id, node);
        return;
      }
      if (e.target.closest("input")) return;
      toggleExpansion(node, task.id);
    });
    node.addEventListener("keydown", function(e) {
      if (e.target.closest("button, input")) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (selectMode) { toggleTaskSelection(task.id, node); return; }
        toggleExpansion(node, task.id);
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        const textSpan = node.querySelector(".task-text");
        if (textSpan) startInlineEdit(textSpan, task);
        return;
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        const cb = node.querySelector(".task-toggle");
        if (cb) cb.click();
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        const delBtn = node.querySelector(".delete-btn");
        if (delBtn) delBtn.click();
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

    // ── Menú contextual (click derecho) ──────────────────────
    node.addEventListener("contextmenu", async function(e) {
      if (e.target.closest("button, input")) return;
      e.preventDefault();
      if (selectMode) return;
      closeCtxMenu();
      var items = [
        {
          label: "Mover a proyecto...",
          action: async function() {
            var targetId = await modalProjectPicker(project.id);
            if (!targetId) return;
            var target = projects.find(function(p) { return p.id === targetId; });
            if (!target) return;
            var idx = project.tasks.findIndex(function(t) { return t.id === task.id; });
            if (idx === -1) return;
            var moved = project.tasks.splice(idx, 1)[0];
            expandedTaskIds.delete(moved.id);
            target.tasks.unshift(moved);
            saveAndRender();
          }
        }
      ];
      var menu = _buildCtxMenu(items);
      var fakeAnchor = {
        getBoundingClientRect: function() {
          return { left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY, width: 0, height: 0 };
        }
      };
      positionCtxMenu(menu, fakeAnchor);
      _ctxMenu = menu;
      requestAnimationFrame(function() {
        _ctxCloseHandler = function(ev) {
          if (!menu.contains(ev.target)) closeCtxMenu();
        };
        document.addEventListener("mousedown", _ctxCloseHandler);
      });
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

    node.setAttribute("draggable", "false");
    node.setAttribute("data-task-id", task.id);
    initDragDrop(node, task.id);
    if (window.matchMedia("(max-width: 768px)").matches) {
      initSwipeGesture(node, task, project);
    }
    taskList.appendChild(node);
  });

  const pending = project.tasks.filter(function(t) { return !t.done; }).length;
  taskCounter.textContent = pending + " pendiente" + (pending === 1 ? "" : "s");
  projectSubtitle.textContent = "// " + project.tasks.length + " tarea" + (project.tasks.length !== 1 ? "s" : "");
  var mobileHeaderCount = document.getElementById("mobile-header-count");
  if (mobileHeaderCount) mobileHeaderCount.textContent = pending + " pendiente" + (pending === 1 ? "" : "s");
  document.title = pending > 0
    ? "(" + pending + ") " + project.name + " — antask"
    : project.name + " — antask";
  if (window.lucide) lucide.createIcons();
}

// renderSubtasks() vive en ./ui/subtasks.js

// ═══════════════════════════════════════════════════════════════
// VISTA HOY (virtual — atraviesa todos los proyectos)
// ═══════════════════════════════════════════════════════════════

function renderTodayView() {
  taskList.innerHTML = "";
  var today = new Date().toISOString().slice(0, 10);

  // Recopilar tareas pendientes con dueDate <= hoy de TODOS los proyectos
  var items = [];
  projects.forEach(function(p) {
    if (p.archived) return;
    (p.tasks || []).forEach(function(t) {
      if (t.done) return;
      if (!t.dueDate || t.dueDate > today) return;
      items.push({ task: t, project: p });
    });
  });

  // Orden: vencidas primero, luego por prioridad
  var prioRank = { high: 0, medium: 1, low: 2 };
  items.sort(function(a, b) {
    if (a.task.dueDate !== b.task.dueDate) {
      return a.task.dueDate < b.task.dueDate ? -1 : 1;
    }
    var pa = prioRank[a.task.priority] != null ? prioRank[a.task.priority] : 3;
    var pb = prioRank[b.task.priority] != null ? prioRank[b.task.priority] : 3;
    return pa - pb;
  });

  // Contador en el footer
  if (taskCounter) {
    taskCounter.textContent = items.length + (items.length === 1 ? " tarea" : " tareas") + " para hoy";
  }

  if (items.length === 0) {
    var empty = document.createElement("li");
    empty.className = "today-empty";
    empty.innerHTML =
      '<div class="today-empty-icon">☀️</div>' +
      '<p class="today-empty-title">Todo limpio</p>' +
      '<p class="today-empty-sub">No hay tareas vencidas ni para hoy. ¡Disfruta!</p>';
    taskList.appendChild(empty);
    return;
  }

  items.forEach(function(it) {
    taskList.appendChild(renderTodayItem(it.task, it.project, today));
  });

  if (window.lucide) lucide.createIcons({ nodes: [taskList] });
}

function renderTodayItem(task, project, todayStr) {
  var due  = new Date(task.dueDate + "T00:00:00");
  var diff = Math.floor((due - new Date(todayStr + "T00:00:00")) / 86400000);
  var dateLabel = diff === 0 ? "Hoy" : diff === -1 ? "Ayer" : diff < 0 ? "Hace " + (-diff) + "d" : "";
  var overdue = diff < 0;

  var li = document.createElement("li");
  li.className = "today-item" +
    (task.priority ? " today-priority-" + task.priority : "") +
    (overdue ? " today-overdue" : "");

  // Checkbox para marcar hecha
  var cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "today-check";
  cb.checked = false;
  cb.setAttribute("aria-label", "Marcar como hecha");
  cb.addEventListener("click", function(e) { e.stopPropagation(); });
  cb.addEventListener("change", function() {
    task.done = true;
    task.status = null;
    li.classList.add("today-completing");
    setTimeout(function() {
      if (task.recurDays) {
        task.done = false;
        task.status = null;
        var next = new Date(task.dueDate + "T00:00:00");
        next.setDate(next.getDate() + task.recurDays);
        task.dueDate = next.toISOString().slice(0, 10);
      }
      saveProjects();
      renderTasks();
      renderSidebar();
    }, 280);
  });

  // Cuerpo: prioridad + texto + proyecto
  var body = document.createElement("div");
  body.className = "today-body";

  var text = document.createElement("span");
  text.className = "today-text";
  text.textContent = task.text;
  body.appendChild(text);

  var meta = document.createElement("div");
  meta.className = "today-meta";

  if (dateLabel) {
    var dEl = document.createElement("span");
    dEl.className = "today-date" + (overdue ? " today-date-overdue" : "");
    dEl.textContent = dateLabel;
    meta.appendChild(dEl);
  }

  if (task.priority) {
    var prioLabels = { high: "Alta", medium: "Media", low: "Baja" };
    var pEl = document.createElement("span");
    pEl.className = "today-prio today-prio-" + task.priority;
    pEl.textContent = prioLabels[task.priority];
    meta.appendChild(pEl);
  }

  var projBadge = document.createElement("button");
  projBadge.type = "button";
  projBadge.className = "today-project-badge";
  projBadge.textContent = (project.icon ? project.icon + " " : "") + project.name;
  if (project.color) projBadge.style.setProperty("--proj-color", project.color);
  projBadge.title = "Ir al proyecto " + project.name;
  projBadge.addEventListener("click", function(e) {
    e.stopPropagation();
    activateProject(project.id);
    if (typeof navigateToTask === "function") {
      setTimeout(function() { navigateToTask(project.id, task.id); }, 60);
    }
  });
  meta.appendChild(projBadge);

  body.appendChild(meta);

  li.appendChild(cb);
  li.appendChild(body);

  // Clic en el cuerpo (no en checkbox ni badge) → ir al proyecto + scroll a la tarea
  body.addEventListener("click", function() {
    activateProject(project.id);
    if (typeof navigateToTask === "function") {
      setTimeout(function() { navigateToTask(project.id, task.id); }, 60);
    }
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
  if (currentFilter === "pending") tasks = tasks.filter(function(t) { return !t.done; });
  else if (currentFilter === "done") tasks = tasks.filter(function(t) { return t.done; });
  if (currentLabelFilter) tasks = tasks.filter(function(t) {
    return Array.isArray(t.labels) && t.labels.includes(currentLabelFilter);
  });

  if (currentSort === "priority") {
    var order = { high: 0, medium: 1, low: 2 };
    tasks.sort(function(a, b) {
      var pa = a.priority ? (order[a.priority] !== undefined ? order[a.priority] : 3) : 3;
      var pb = b.priority ? (order[b.priority] !== undefined ? order[b.priority] : 3) : 3;
      if (pa !== pb) return pa - pb;
      // secondary: done tasks last
      return (a.done ? 1 : 0) - (b.done ? 1 : 0);
    });
  } else if (currentSort === "due") {
    tasks.sort(function(a, b) {
      var hasA = !!a.dueDate, hasB = !!b.dueDate;
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;   // sin fecha al final
      if (!hasB) return -1;
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    });
  } else if (currentSort === "az") {
    tasks.sort(function(a, b) {
      return a.text.localeCompare(b.text, undefined, { sensitivity: "base" });
    });
  }

  return tasks;
}

function toggleExpansion(node, taskId) {
  const isExpanded = node.classList.toggle("expanded");
  node.setAttribute("aria-expanded", String(isExpanded));
  if (isExpanded) expandedTaskIds.add(taskId);
  else expandedTaskIds.delete(taskId);
}

function cycleStatus(task) {
  const idx = STATUS_CYCLE.indexOf(task.status);
  task.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
  saveAndRender();
}

window.setTaskStatus = function(taskId, status) {
  for (var i = 0; i < projects.length; i++) {
    var tasks = projects[i].tasks;
    if (!tasks) continue;
    for (var j = 0; j < tasks.length; j++) {
      if (tasks[j].id === taskId) {
        tasks[j].status = (status === "none") ? null : status;
        saveAndRender();
        return;
      }
    }
  }
};

// ─── PRIORIDAD ────────────────────────────────────────────────
function cyclePriority(task) {
  const idx = PRIORITY_CYCLE.indexOf(task.priority || null);
  task.priority = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
  saveAndRender();
}

// ─── ETIQUETAS ─────────────────────────────────────────────────
function getProjectLabels() {
  const project = getActiveProject();
  if (!project) return [];
  return Array.isArray(project.labels) ? project.labels : [];
}

function saveProjectLabels(labels) {
  const project = getActiveProject();
  if (!project) return;
  project.labels = labels;
  saveProjects();
}

// renderTaskLabels() vive en ./ui/labels.js

function renderLabelFilterBar() {
  const project = getActiveProject();
  const bar = document.getElementById("label-filter-bar");
  if (!bar) return;
  bar.innerHTML = "";
  const labels = project ? (project.labels || []) : [];
  if (labels.length === 0) { bar.hidden = true; return; }
  bar.hidden = false;

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = "label-filter-btn" + (currentLabelFilter === null ? " active" : "");
  allBtn.textContent = "Todas";
  allBtn.addEventListener("click", function() {
    currentLabelFilter = null;
    renderLabelFilterBar();
    renderTasks();
  });
  bar.appendChild(allBtn);

  labels.forEach(function(labelName) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "label-filter-btn" + (currentLabelFilter === labelName ? " active" : "");
    btn.textContent = labelName;
    var _slot2 = getLabelSlot(labelName);
    btn.style.setProperty("--tag-bg", "var(--tag-" + _slot2 + "-bg)");
    btn.style.setProperty("--tag-fg", "var(--tag-" + _slot2 + "-fg)");
    btn.addEventListener("click", function() {
      currentLabelFilter = currentLabelFilter === labelName ? null : labelName;
      renderLabelFilterBar();
      renderTasks();
    });
    bar.appendChild(btn);
  });
}

async function showLabelPicker(task) {
  const project = getActiveProject();
  if (!project) return;
  if (!Array.isArray(project.labels)) project.labels = [];
  if (!Array.isArray(task.labels))    task.labels    = [];

  return new Promise(function(resolve) {
    const { overlay, box } = createModalBase();

    function buildHTML() {
      const labels = project.labels;
      const taskLabels = task.labels;
      let checkboxes = labels.length === 0
        ? '<p class="modal-label" style="color:var(--t-muted);font-size:0.78rem">Sin etiquetas. Crea una abajo.</p>'
        : labels.map(function(l) {
            const checked = taskLabels.includes(l) ? "checked" : "";
            const color   = getLabelColor(l);
            return '<label class="label-picker-row">' +
              '<input type="checkbox" value="' + escHtml(l) + '" ' + checked + ' />' +
              '<span class="label-picker-dot" style="background:' + color + '"></span>' +
              '<span class="label-picker-name">' + escHtml(l) + '</span>' +
              '<button type="button" class="label-delete-btn" data-label="' + escHtml(l) + '" title="Eliminar etiqueta"><i data-lucide="x"></i></button>' +
              '</label>';
          }).join("");

      box.innerHTML =
        '<p class="modal-label">// Etiquetas</p>' +
        '<div class="label-picker-list">' + checkboxes + '</div>' +
        '<div class="label-picker-new">' +
          '<input class="modal-input" type="text" maxlength="30" placeholder="nueva etiqueta..." style="margin-bottom:0;flex:1" />' +
          '<button type="button" class="modal-btn modal-btn-confirm label-create-btn">+ Crear</button>' +
        '</div>' +
        '<div class="modal-actions" style="margin-top:0.75rem">' +
          '<button class="modal-btn modal-btn-cancel">Cerrar</button>' +
          '<button class="modal-btn modal-btn-confirm">Guardar</button>' +
        '</div>';
      if (window.lucide) lucide.createIcons({ nodes: [box] });

      // delete label buttons
      box.querySelectorAll(".label-delete-btn").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
          e.preventDefault(); e.stopPropagation();
          const lname = btn.dataset.label;
          project.labels = project.labels.filter(function(l) { return l !== lname; });
          // remove from all tasks in project
          project.tasks.forEach(function(t) {
            if (Array.isArray(t.labels)) t.labels = t.labels.filter(function(l) { return l !== lname; });
          });
          if (currentLabelFilter === lname) currentLabelFilter = null;
          buildHTML();
        });
      });

      // create button
      const newInput = box.querySelector(".label-picker-new .modal-input");
      box.querySelector(".label-create-btn").addEventListener("click", function() {
        const val = newInput.value.trim().slice(0, 30);
        if (!val || project.labels.includes(val)) { newInput.focus(); return; }
        project.labels.push(val);
        newInput.value = "";
        buildHTML();
      });
      newInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") { e.preventDefault(); box.querySelector(".label-create-btn").click(); }
        e.stopPropagation();
      });

      // save button (el del bloque .modal-actions, no el de crear)
      box.querySelector(".modal-actions .modal-btn-confirm").addEventListener("click", function() {
        const checked = Array.from(box.querySelectorAll(".label-picker-list input[type=checkbox]:checked"))
          .map(function(cb) { return cb.value; });
        task.labels = checked;
        saveProjects();
        renderTasks();
        renderLabelFilterBar();
        closeModal(overlay);
        resolve();
      });

      // cancel
      box.querySelector(".modal-btn-cancel").addEventListener("click", function() {
        saveProjects(); // save any label creations/deletions
        renderLabelFilterBar();
        closeModal(overlay);
        resolve();
      });
      overlay._cancel = function() {
        saveProjects();
        renderLabelFilterBar();
        closeModal(overlay);
        resolve();
      };
    }

    buildHTML();
  });
}

// getLabelSlot() / getLabelColor() viven en ./ui/labels.js


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

function _showRecurToast(days, nextDate) {
  var msg = "↻ Tarea regenerada";
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

function initSwipeGesture(node, task, project) {
  var THRESHOLD   = 80;   // px needed to trigger action
  var MAX_OVER    = 140;  // max visual translation
  var startX = 0, startY = 0, currentX = 0;
  var tracking = false, axisLocked = false, isHorizontal = false;

  var content = document.createElement("div");
  content.className = "task-swipe-content";
  while (node.firstChild) content.appendChild(node.firstChild);
  node.appendChild(content);

  var hintRight = document.createElement("div");
  hintRight.className = "task-swipe-hint task-swipe-hint-right";
  hintRight.textContent = "✓";
  node.appendChild(hintRight);

  var hintLeft = document.createElement("div");
  hintLeft.className = "task-swipe-hint task-swipe-hint-left";
  hintLeft.textContent = "✕";
  node.appendChild(hintLeft);

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

    // Resist past threshold
    if (Math.abs(dx) > THRESHOLD) {
      var over = Math.abs(dx) - THRESHOLD;
      var sign = dx > 0 ? 1 : -1;
      dx = sign * (THRESHOLD + over * 0.25);
    }
    dx = Math.max(-MAX_OVER, Math.min(MAX_OVER, dx));
    currentX = dx;

    content.style.transform = "translateX(" + dx + "px)";

    // Fade hints based on direction and progress
    var pct = Math.min(Math.abs(dx) / THRESHOLD, 1);
    if (dx > 0) {
      hintRight.style.opacity = pct;
      hintLeft.style.opacity  = 0;
    } else if (dx < 0) {
      hintLeft.style.opacity  = pct;
      hintRight.style.opacity = 0;
    } else {
      hintRight.style.opacity = 0;
      hintLeft.style.opacity  = 0;
    }
  }, { passive: false });

  node.addEventListener("touchend", function() {
    if (!tracking) return;
    tracking = false;

    var dx = currentX;
    content.style.transition = "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)";
    hintRight.style.transition = "opacity 0.18s";
    hintLeft.style.transition  = "opacity 0.18s";

    if (dx >= THRESHOLD) {
      // Swipe right → toggle complete
      content.style.transform = "translateX(110%)";
      setTimeout(function() {
        task.done = !task.done;
        saveAndRender();
      }, 200);
    } else if (dx <= -THRESHOLD) {
      // Swipe left → delete
      content.style.transform = "translateX(-110%)";
      setTimeout(function() {
        var taskIndex = project.tasks.findIndex(function(t) { return t.id === task.id; });
        _undoStack = { projectId: project.id, task: JSON.parse(JSON.stringify(task)), index: taskIndex };
        expandedTaskIds.delete(task.id);
        project.tasks = project.tasks.filter(function(t) { return t.id !== task.id; });
        saveAndRender();
        showUndoToast();
      }, 200);
    } else {
      // Snap back
      content.style.transform = "translateX(0)";
      hintRight.style.opacity = 0;
      hintLeft.style.opacity  = 0;
    }
  });

  node.addEventListener("touchcancel", function() {
    if (!tracking) return;
    tracking = false;
    content.style.transition = "transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94)";
    content.style.transform  = "translateX(0)";
    hintRight.style.opacity  = 0;
    hintLeft.style.opacity   = 0;
  });
}

// ═══════════════════════════════════════════════════════════════
// DRAG & DROP
// ═══════════════════════════════════════════════════════════════

function initDragDrop(node, taskId) {
  // Solo activo en filtro "all" y sin ordenación activa
  if (currentFilter !== "all" || currentSort !== "manual") return;

  const handle = node.querySelector(".drag-handle");
  if (!handle) return;

  // Hacer draggable solo al agarrar el handle
  handle.addEventListener("mousedown", function() {
    node.setAttribute("draggable", "true");
  });
  handle.addEventListener("touchstart", function() {
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
  const handle = li.querySelector(".project-drag-handle");
  if (!handle) return;

  handle.addEventListener("mousedown", function() {
    li.setAttribute("draggable", "true");
  });
  handle.addEventListener("touchstart", function() {
    li.setAttribute("draggable", "true");
  }, { passive: true });

  li.addEventListener("dragstart", function(e) {
    dragSrcProjectId = projectId;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(function() { li.classList.add("drag-ghost"); }, 0);
    document.body.classList.add("project-dragging");
  });

  li.addEventListener("dragend", function() {
    li.classList.remove("drag-ghost");
    li.setAttribute("draggable", "false");
    removeProjectDropIndicator();
    dragSrcProjectId = null;
    document.body.classList.remove("project-dragging");
    document.querySelectorAll(".section-drop-target").forEach(function(el) {
      el.classList.remove("section-drop-target");
    });
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

    // Inherit section membership from drop target (handles move in/out of sections)
    const knownSectionIds = new Set(sections.map(function(s) { return s.id; }));
    const destSection = projects[destIdx].sectionId;
    projects[srcIdx].sectionId = (destSection && knownSectionIds.has(destSection)) ? destSection : null;

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

function initSectionDropTarget(li, section) {
  li.addEventListener("dragover", function(e) {
    if (!dragSrcProjectId) return;
    e.preventDefault();
    li.classList.add("section-drop-target");
  });
  li.addEventListener("dragleave", function(e) {
    if (!e.relatedTarget || !projectListEl.contains(e.relatedTarget)) {
      li.classList.remove("section-drop-target");
    }
  });
  li.addEventListener("drop", function(e) {
    e.preventDefault();
    li.classList.remove("section-drop-target");
    if (!dragSrcProjectId) return;
    const srcIdx = projects.findIndex(function(p) { return p.id === dragSrcProjectId; });
    if (srcIdx === -1) return;
    projects[srcIdx].sectionId = section.id;
    // Move to end of this section's block in the array
    const [moved] = projects.splice(srcIdx, 1);
    var insertAt = projects.reduce(function(last, p, i) {
      return p.sectionId === section.id ? i + 1 : last;
    }, projects.length);
    projects.splice(insertAt, 0, moved);
    removeProjectDropIndicator();
    saveProjects();
    renderSidebar();
    if (window.lucide) lucide.createIcons();
  });
}

function initSectionDragDrop(li, sectionId) {
  const handle = li.querySelector(".section-drag-handle");
  if (!handle) return;

  handle.addEventListener("mousedown", function() { li.setAttribute("draggable", "true"); });
  handle.addEventListener("touchstart", function() { li.setAttribute("draggable", "true"); }, { passive: true });

  li.addEventListener("dragstart", function(e) {
    if (dragSrcProjectId) return; // project drag takes priority
    dragSrcSectionId = sectionId;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(function() { li.classList.add("drag-ghost"); }, 0);
  });

  li.addEventListener("dragend", function() {
    li.classList.remove("drag-ghost");
    li.setAttribute("draggable", "false");
    removeProjectDropIndicator();
    dragSrcSectionId = null;
  });

  li.addEventListener("dragover", function(e) {
    if (!dragSrcSectionId || dragSrcSectionId === sectionId) return;
    e.preventDefault();
    showProjectDropIndicator(li, e.clientY);
  });

  li.addEventListener("drop", function(e) {
    e.preventDefault();
    li.classList.remove("section-drop-target");
    if (!dragSrcSectionId || dragSrcSectionId === sectionId) { removeProjectDropIndicator(); return; }

    const srcIdx  = sections.findIndex(function(s) { return s.id === dragSrcSectionId; });
    const destIdx = sections.findIndex(function(s) { return s.id === sectionId; });
    if (srcIdx === -1 || destIdx === -1) { removeProjectDropIndicator(); return; }

    const rect = li.getBoundingClientRect();
    const isAfter = e.clientY > rect.top + rect.height / 2;
    const [moved] = sections.splice(srcIdx, 1);
    var newIdx = destIdx > srcIdx ? destIdx - 1 : destIdx;
    if (isAfter) newIdx += 1;
    sections.splice(Math.max(0, Math.min(newIdx, sections.length)), 0, moved);

    removeProjectDropIndicator();
    saveSections();
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
    '<span class="undo-toast-msg">Tarea eliminada</span>' +
    '<button type="button" class="undo-toast-btn">Deshacer</button>' +
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
  toast.addEventListener("transitionend", function() { toast.remove(); }, { once: true });
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
  if (bulkCount) bulkCount.textContent = n + " seleccionada" + (n !== 1 ? "s" : "");
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
    if (selectedTaskIds.has(t.id)) { t.done = true; t.status = null; }
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
  toDelete.forEach(function(x) { expandedTaskIds.delete(x.task.id); });
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
      else if (view === "agenda")  showAgendaPanel();
      else if (view === "cal")     showCalendarPanel();
    });
  }

  // ── Filter panel toggle ──────────────────────────────────────
  var filterTriggerBtn = document.getElementById("filter-trigger-btn");
  var filterPanel      = document.getElementById("filter-panel");
  if (filterTriggerBtn && filterPanel) {
    filterTriggerBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      var opening = filterPanel.hidden;
      filterPanel.hidden = !opening;
      filterTriggerBtn.classList.toggle("open", opening);
    });
  }

  // ── Filter options ───────────────────────────────────────────
  if (filterPanel) {
    filterPanel.addEventListener("click", function(e) {
      var btn = e.target.closest("[data-filter]");
      if (btn) { applyFilter(btn.dataset.filter); filterPanel.hidden = true; if (filterTriggerBtn) filterTriggerBtn.classList.remove("open"); return; }
      var sortBtn = e.target.closest("[data-sort]");
      if (sortBtn) { applySort(sortBtn.dataset.sort); filterPanel.hidden = true; if (filterTriggerBtn) filterTriggerBtn.classList.remove("open"); }
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

  // ── Close dropdowns on outside click ─────────────────────────
  document.addEventListener("click", function() {
    if (filterPanel)      filterPanel.hidden = true;
    if (filterTriggerBtn) filterTriggerBtn.classList.remove("open");
    if (moreActionsPanel) moreActionsPanel.hidden = true;
  });
})();

window.showAgendaPanel  = showAgendaPanel;

// ═══════════════════════════════════════════════════════════════
// VISTA DE AGENDA
// ═══════════════════════════════════════════════════════════════


function _closeAllAltPanels() {
  var agendaPanel = document.getElementById("agenda-panel");
  var agendaBtn   = document.getElementById("agenda-btn");
  var calPanel    = document.getElementById("cal-panel");
  var calBtn      = document.getElementById("cal-btn");
  if (agendaPanel) agendaPanel.hidden = true;
  if (agendaBtn)   agendaBtn.classList.remove("active");
  if (calPanel)    calPanel.hidden = true;
  if (calBtn)      calBtn.classList.remove("active");
  var notePanel = document.getElementById("note-panel");
  if (notePanel)   notePanel.hidden = true;
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

function showCalendarPanel() {
  var calPanel = document.getElementById("cal-panel");
  if (!calPanel) return;

  if (!calPanel.hidden) {
    _closeAllAltPanels();
    _restoreMainPanel();
    return;
  }

  _closeAllAltPanels();
  emptyState.hidden = true;
  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.add("ctrl-bar--alt"); }
  tasksPanel.hidden = true;
  calPanel.hidden = false;
  _setActiveViewTab("cal");
  renderCalendar();
}

function _restoreMainPanel() {
  var project = getActiveProject();
  emptyState.hidden = Boolean(project);
  if (ctrlBar) { ctrlBar.hidden = !project; ctrlBar.classList.remove("ctrl-bar--alt"); }
  tasksPanel.hidden = !project;
  _setActiveViewTab("tasks");
}

function _setActiveViewTab(view) {
  document.querySelectorAll(".view-tab").forEach(function(t) {
    t.classList.toggle("view-tab--active", t.dataset.view === view);
  });
  var filterWrap     = document.getElementById("filter-wrap");
  var selectModeBtn  = document.getElementById("select-mode-btn");
  var moreActionsWrap = document.getElementById("more-actions-wrap");
  var isTasksView    = (view === "tasks");
  var taskPrefsBtnEl  = document.getElementById("task-prefs-btn");
  if (filterWrap)      filterWrap.style.display      = isTasksView ? "" : "none";
  if (selectModeBtn)   selectModeBtn.style.display    = isTasksView ? "" : "none";
  if (moreActionsWrap) moreActionsWrap.style.display   = isTasksView ? "" : "none";
  if (taskPrefsBtnEl)  taskPrefsBtnEl.style.display   = isTasksView ? "" : "none";
  // Ocultar task-form en vistas alternativas
  var taskFormEl = document.getElementById("task-form");
  if (taskFormEl) taskFormEl.style.display = isTasksView ? "" : "none";
  // Eyebrow que indica la vista actual encima del título
  var eyebrow = document.getElementById("view-eyebrow");
  if (eyebrow) {
    var labels = { tasks: "Vista lista", agenda: "Vista agenda", cal: "Vista mes" };
    eyebrow.textContent = labels[view] || "";
  }
}

function showAgendaPanel() {
  var agendaPanel = document.getElementById("agenda-panel");
  if (!agendaPanel) return;

  if (!agendaPanel.hidden) {
    _closeAllAltPanels();
    _restoreMainPanel();
    return;
  }

  _closeAllAltPanels();
  emptyState.hidden = true;
  if (ctrlBar) { ctrlBar.hidden = false; ctrlBar.classList.add("ctrl-bar--alt"); }
  tasksPanel.hidden = true;
  agendaPanel.hidden = false;
  _setActiveViewTab("agenda");
  renderAgenda();
}


// ═══════════════════════════════════════════════════════════════
// ATAJOS DE TECLADO — MODAL DE AYUDA
// ═══════════════════════════════════════════════════════════════

function showShortcutsHelp() {
  const { overlay, box } = createModalBase();

  box.innerHTML =
    '<p class="modal-label">// Atajos de teclado</p>' +
    '<table class="shortcuts-table">' +
      '<tbody>' +
        '<tr><td><kbd>N</kbd></td><td>Enfocar campo nueva tarea</td></tr>' +
        '<tr><td><kbd>S</kbd></td><td>Nueva sección</td></tr>' +
        '<tr><td><kbd>A</kbd></td><td>Vista de agenda</td></tr>' +
        '<tr><td><kbd>K</kbd></td><td>Vista Kanban</td></tr>' +
        '<tr><td><kbd>C</kbd></td><td>Vista calendario</td></tr>' +
        '<tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Búsqueda global</td></tr>' +
        '<tr><td><kbd>?</kbd></td><td>Ver esta lista de atajos</td></tr>' +
        '<tr class="shortcuts-sep"><td colspan="2"></td></tr>' +
        '<tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>Navegar entre tareas</td></tr>' +
        '<tr><td><kbd>Enter</kbd> / <kbd>Esp.</kbd></td><td>Expandir / colapsar tarea</td></tr>' +
        '<tr><td><kbd>E</kbd></td><td>Editar texto de la tarea</td></tr>' +
        '<tr><td><kbd>D</kbd></td><td>Marcar hecha / pendiente</td></tr>' +
        '<tr><td><kbd>Supr</kbd></td><td>Eliminar tarea (con deshacer)</td></tr>' +
        '<tr class="shortcuts-sep"><td colspan="2"></td></tr>' +
        '<tr><td><kbd>Esc</kbd></td><td>Cerrar modal abierto</td></tr>' +
      '</tbody>' +
    '</table>' +
    '<div class="modal-actions">' +
      '<button class="modal-btn modal-btn-confirm">Cerrar</button>' +
    '</div>';

  const btn = box.querySelector(".modal-btn-confirm");
  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  btn.addEventListener("click", doClose);
  setTimeout(function() { btn.focus(); }, 50);
}

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
  renderLabelFilterBar();
}

// ─── PERSISTENCIA ────────────────────────────────────────────
function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  updateSaveStatus(now);
  var user = window.AnsoSync && AnsoSync.getUser ? AnsoSync.getUser() : null;
  if (user) _saveAccountCache(user.uid);
  if (window.AnsoSync) AnsoSync.scheduleSave(projects, sections, standaloneNotes);
}

// ═══════════════════════════════════════════════════════════════
// NOTAS INDEPENDIENTES
// ═══════════════════════════════════════════════════════════════

function renderNotesSidebar() {
  var wrap = document.getElementById("notes-sidebar-section");
  if (!wrap) return;
  wrap.innerHTML = "";
  if (standaloneNotes.length === 0) return;

  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "archived-section-toggle";
  toggle.innerHTML =
    '<i data-lucide="' + (_notesExpanded ? "chevron-down" : "chevron-right") + '"></i>' +
    '<i data-lucide="file-text"></i>' +
    '<span>Notas</span>' +
    '<span class="archived-section-count">' + standaloneNotes.length + "</span>";
  toggle.addEventListener("click", function() {
    _notesExpanded = !_notesExpanded;
    renderNotesSidebar();
    if (window.lucide) lucide.createIcons({ nodes: [wrap] });
  });
  wrap.appendChild(toggle);

  if (_notesExpanded) {
    var list = document.createElement("ul");
    list.className = "archived-project-list";
    standaloneNotes.forEach(function(note) {
      var li = document.createElement("li");
      li.className = "note-sidebar-item";
      if (note.id === activeNoteId) li.classList.add("active");
      if (note.color) li.style.setProperty("--project-color", note.color);

      var icon = document.createElement("span");
      icon.className = "note-sidebar-icon";
      icon.innerHTML = '<i data-lucide="file-text"></i>';

      var name = document.createElement("span");
      name.className = "note-sidebar-name";
      name.textContent = note.name;

      var kebab = document.createElement("button");
      kebab.type = "button";
      kebab.className = "project-kebab-btn";
      kebab.innerHTML = '<i data-lucide="ellipsis"></i>';
      kebab.addEventListener("click", function(e) {
        e.stopPropagation();
        showNoteMenu(note, kebab);
      });

      li.appendChild(icon);
      li.appendChild(name);
      li.appendChild(kebab);
      li.addEventListener("click", function() { activateNote(note.id); });
      li.addEventListener("contextmenu", function(e) {
        e.preventDefault();
        e.stopPropagation();
        showNoteMenu(note, kebab);
      });
      list.appendChild(li);
    });
    wrap.appendChild(list);
  }

  if (window.lucide) lucide.createIcons({ nodes: [wrap] });
}

function activateNote(noteId) {
  activeNoteId = noteId;
  activeProjectId = null;
  localStorage.removeItem(ACTIVE_KEY);

  _closeAllAltPanels();
  var notePanel = document.getElementById("note-panel");
  if (emptyState) emptyState.hidden = true;
  if (ctrlBar)    ctrlBar.hidden = true;
  if (tasksPanel) tasksPanel.hidden = true;
  if (mobileFab)  mobileFab.classList.remove("visible");
  if (notePanel)  notePanel.hidden = false;

  var note = standaloneNotes.find(function(n) { return n.id === noteId; });
  if (!note) return;

  var noteEditor = document.getElementById("note-editor");
  var noteTitleEl = document.getElementById("note-title");
  if (noteEditor)  noteEditor.innerHTML = note.content || "";
  if (noteTitleEl) noteTitleEl.textContent = note.name;

  document.title = note.name + " — antask";
  renderSidebar();
}

function saveActiveNote() {
  var note = standaloneNotes.find(function(n) { return n.id === activeNoteId; });
  if (!note) return;
  var noteEditor = document.getElementById("note-editor");
  if (noteEditor) note.content = noteEditor.innerHTML;
  saveStandaloneNotes();

  var statusEl = document.getElementById("note-save-status");
  if (statusEl) {
    var t = new Date();
    statusEl.textContent = "Guardado " + t.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    statusEl.classList.add("note-save-status--flash");
    setTimeout(function() { statusEl.classList.remove("note-save-status--flash"); }, 800);
  }
}

function showNoteMenu(note, anchor) {
  closeCtxMenu();
  var items = [
    {
      label: "Renombrar",
      action: async function() {
        var newName = await modalPrompt("// Renombrar nota", note.name, note.name);
        if (newName === null) return;
        var trimmed = newName.trim().slice(0, 80);
        if (!trimmed || trimmed === note.name) return;
        note.name = trimmed;
        if (activeNoteId === note.id) {
          var titleEl = document.getElementById("note-title");
          if (titleEl) titleEl.textContent = note.name;
          document.title = note.name + " — antask";
        }
        saveStandaloneNotes();
        renderNotesSidebar();
      }
    },
    null,
    {
      label: "Eliminar nota",
      danger: true,
      action: async function() {
        var ok = await modalConfirm("¿Eliminar la nota <strong>" + escHtml(note.name) + "</strong>?", "Eliminar");
        if (!ok) return;
        standaloneNotes = standaloneNotes.filter(function(n) { return n.id !== note.id; });
        saveStandaloneNotes();
        if (activeNoteId === note.id) {
          activeNoteId = null;
          var notePanel = document.getElementById("note-panel");
          if (notePanel) notePanel.hidden = true;
          var firstActive = projects.find(function(p) { return !p.archived; });
          if (firstActive) activateProject(firstActive.id);
          else { if (emptyState) emptyState.hidden = false; if (ctrlBar) ctrlBar.hidden = true; }
        }
        renderSidebar();
      }
    }
  ];
  var menu = _buildCtxMenu(items);
  positionCtxMenu(menu, anchor);
  _ctxMenu = menu;
  requestAnimationFrame(function() {
    _ctxCloseHandler = function(e) { if (!menu.contains(e.target)) closeCtxMenu(); };
    document.addEventListener("mousedown", _ctxCloseHandler);
  });
}

// ─── Inicialización del editor de notas independientes ────────
(function() {
  var noteEditor  = document.getElementById("note-editor");
  var noteFmtBtns = document.querySelectorAll(".note-fmt-btn");
  var noteTitleEl = document.getElementById("note-title");
  var newNoteBtn  = document.getElementById("new-note-btn");

  if (noteEditor) {
    if (typeof window.setupPasteHandler === "function") window.setupPasteHandler(noteEditor, saveActiveNote);
    if (typeof window.setupImageResizer === "function") window.setupImageResizer(noteEditor);

    noteEditor.addEventListener("input", function() {
      if (_notePanelSaveTimer) clearTimeout(_notePanelSaveTimer);
      _notePanelSaveTimer = setTimeout(saveActiveNote, 700);
    });
    noteEditor.addEventListener("keydown", function(e) {
      if (e.ctrlKey || e.metaKey) {
        var cmd = { b: "bold", i: "italic", u: "underline", m: "strikeThrough" }[e.key.toLowerCase()];
        if (cmd) { e.preventDefault(); document.execCommand(cmd, false, null); _syncNoteFmtBtns(); }
      }
      e.stopPropagation();
    });
    noteEditor.addEventListener("keyup",   _syncNoteFmtBtns);
    noteEditor.addEventListener("mouseup", _syncNoteFmtBtns);
  }

  noteFmtBtns.forEach(function(btn) {
    btn.addEventListener("mousedown", function(e) {
      e.preventDefault();
      if (btn.classList.contains("fmt-color-btn")) return;
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
      if (noteEditor) noteEditor.focus();
      _syncNoteFmtBtns();
    });
  });

  if (noteTitleEl) {
    noteTitleEl.addEventListener("input", function() {
      var note = standaloneNotes.find(function(n) { return n.id === activeNoteId; });
      if (!note) return;
      note.name = (noteTitleEl.textContent || "").trim().slice(0, 80) || "Sin título";
      document.title = note.name + " — antask";
      if (_notePanelSaveTimer) clearTimeout(_notePanelSaveTimer);
      _notePanelSaveTimer = setTimeout(function() { saveStandaloneNotes(); renderNotesSidebar(); }, 700);
    });
    noteTitleEl.addEventListener("keydown", function(e) {
      if (e.key === "Enter") { e.preventDefault(); if (noteEditor) noteEditor.focus(); }
      e.stopPropagation();
    });
    noteTitleEl.addEventListener("blur", function() {
      if (!noteTitleEl.textContent.trim()) noteTitleEl.textContent = "Sin título";
    });
  }

  if (newNoteBtn) {
    newNoteBtn.addEventListener("click", async function() {
      var name = await modalPrompt("// Nombre de la nota", "", "Mi nota...");
      if (!name || !name.trim()) return;
      var note = sanitizeStandaloneNote({
        id:        "note-" + generateId(),
        name:      capitalizeFirst(name.trim()).slice(0, 80),
        content:   "",
        createdAt: new Date().toISOString(),
      });
      standaloneNotes.push(note);
      saveStandaloneNotes();
      activateNote(note.id);
      setTimeout(function() { if (noteEditor) noteEditor.focus(); }, 80);
    });
  }
})();

function _syncNoteFmtBtns() {
  document.querySelectorAll(".note-fmt-btn").forEach(function(btn) {
    try {
      btn.classList.toggle("fmt-active", document.queryCommandState(btn.dataset.cmd));
    } catch(e) {}
  });
}

// ═══════════════════════════════════════════════════════════════
// PREFERENCIAS DE BOTONES DE TAREA
// ═══════════════════════════════════════════════════════════════

const TASK_BTN_DEFS = [
  { key: "priority", label: "Prioridad",   icon: "flag"          },
  { key: "status",   label: "Estado",      icon: "circle-dashed" },
  { key: "date",     label: "Fecha",       icon: "calendar"      },
  { key: "recur",    label: "Repetir",     icon: "repeat"        },
  { key: "comment",  label: "Nota rápida", icon: "message-circle"},
  { key: "labels",   label: "Etiquetas",   icon: "tag"           },
  { key: "subtasks", label: "Subtareas",   icon: "list-plus"     },
];

function saveTaskPrefs() {
  localStorage.setItem(TASK_PREFS_KEY, JSON.stringify(taskPrefs));
}

function applyTaskPrefs() {
  TASK_BTN_DEFS.forEach(function(def) {
    document.body.classList.toggle("hide-task-" + def.key, taskPrefs[def.key] === false);
  });
  document.body.classList.toggle("tasks-compact", taskPrefs.compactView === true);
}

function showTaskPrefsModal() {
  var { overlay, box } = createModalBase();

  var rowsHtml = TASK_BTN_DEFS.map(function(def) {
    var on = taskPrefs[def.key] !== false;
    return '<label class="task-pref-row">' +
      '<span class="task-pref-icon"><i data-lucide="' + def.icon + '"></i></span>' +
      '<span class="task-pref-label">' + def.label + '</span>' +
      '<span class="task-pref-toggle' + (on ? " task-pref-on" : "") + '" data-key="' + def.key + '">' +
        '<span class="task-pref-thumb"></span>' +
      '</span>' +
    '</label>';
  }).join("");

  var compactOn = taskPrefs.compactView === true;
  box.innerHTML =
    '<p class="modal-label">Vista</p>' +
    '<div class="task-pref-list">' +
      '<label class="task-pref-row">' +
        '<span class="task-pref-icon"><i data-lucide="rows-3"></i></span>' +
        '<span class="task-pref-label">Vista compacta</span>' +
        '<span class="task-pref-toggle' + (compactOn ? " task-pref-on" : "") + '" data-key="compactView" data-type="view">' +
          '<span class="task-pref-thumb"></span>' +
        '</span>' +
      '</label>' +
    '</div>' +
    '<p class="modal-label" style="margin-top:1rem">Botones de tarea</p>' +
    '<div class="task-pref-list">' + rowsHtml + '</div>' +
    '<div class="modal-actions">' +
      '<button class="modal-btn modal-btn-confirm">Listo</button>' +
    '</div>';

  if (window.lucide) lucide.createIcons({ nodes: [box] });

  box.querySelectorAll(".task-pref-toggle").forEach(function(toggle) {
    toggle.addEventListener("click", function() {
      var key = toggle.dataset.key;
      taskPrefs[key] = !toggle.classList.contains("task-pref-on");
      toggle.classList.toggle("task-pref-on", taskPrefs[key]);
      saveTaskPrefs();
      applyTaskPrefs();
    });
  });

  overlay._cancel = function() { closeModal(overlay); };
  box.querySelector(".modal-btn-confirm").addEventListener("click", function() { closeModal(overlay); });

  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") { closeModal(overlay); document.removeEventListener("keydown", handler); }
  });
}

function saveStandaloneNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(standaloneNotes));
  if (window.AnsoSync) AnsoSync.scheduleSave(projects, sections, standaloneNotes);
}

function saveSections() {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  var user = window.AnsoSync && AnsoSync.getUser ? AnsoSync.getUser() : null;
  if (user) _saveAccountCache(user.uid);
  if (window.AnsoSync) AnsoSync.scheduleSave(projects, sections, standaloneNotes);
}

function updateSaveStatus(lastSavedAt) {
  if (!lastSavedAt) { saveStatus.textContent = "Sin cambios recientes"; return; }
  const date = new Date(lastSavedAt);
  if (Number.isNaN(date.getTime())) { saveStatus.textContent = "Guardado automático activo"; return; }
  saveStatus.textContent = "Último guardado: " + date.toLocaleString("es-ES", {
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
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const key = AUTO_BACKUP_PREFIX + dateStr;
  const data = {
    projects: projects,
    activeProjectId: activeProjectId,
    timestamp: now.toISOString(),
    version: "auto-backup"
  };
  localStorage.setItem(key, JSON.stringify(data));
  cleanOldAutoBackups();
  console.log("Backup automático guardado:", dateStr);
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

function getAutoBackups() {
  const backups = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(AUTO_BACKUP_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        backups.push({
          key: key,
          date: key.replace(AUTO_BACKUP_PREFIX, ''),
          timestamp: data.timestamp,
          projectsCount: data.projects.length
        });
      } catch(e) {
        // Backup corrupto, ignorar
      }
    }
  }
  return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
  const expandBtnEmpty   = document.getElementById("sidebar-expand-btn-empty");

  function setSidebarCollapsed(collapsed) {
    if (!sidebarEl || !mainPanel) return;
    sidebarEl.classList.toggle("sidebar-collapsed", collapsed);
    mainPanel.classList.toggle("sidebar-is-collapsed", collapsed);
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }

  if (collapseBtn)    collapseBtn.addEventListener("click",    function () { setSidebarCollapsed(true); });
  if (expandBtn)      expandBtn.addEventListener("click",      function () { setSidebarCollapsed(false); });
  if (expandBtnEmpty) expandBtnEmpty.addEventListener("click", function () { setSidebarCollapsed(false); });

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
  localStorage.setItem(_acctKey(uid),     JSON.stringify(projects));
  localStorage.setItem(_acctSectKey(uid), JSON.stringify(sections));
  localStorage.setItem(_acctMetaKey(uid), JSON.stringify({ lastSavedAt: now }));
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
  projects = [];
  sections = [];
  activeProjectId = null;
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(SECTIONS_KEY);
  localStorage.removeItem(METADATA_KEY);
  localStorage.removeItem(ACTIVE_KEY);
  renderSidebar();
  renderTasks();
  renderLabelFilterBar();
}

function _updateProfileMenu(user) {
  var pfSigninBtn    = document.getElementById("pf-signin-btn");
  var pfSyncUser     = document.getElementById("pf-sync-user");
  var pfSyncSep      = document.getElementById("pf-sync-sep");
  var pfSyncName     = document.getElementById("pf-sync-name");
  var pfSignoutBtn   = document.getElementById("pf-signout-btn");
  var pfAvatar       = document.getElementById("profile-avatar");
  var pfAvatarTop    = document.getElementById("profile-avatar-top");
  var pfName         = document.getElementById("profile-name");
  var pfNameTop      = document.getElementById("profile-name-top");
  var pfSub          = document.getElementById("profile-sub");
  var pfSubTop       = document.getElementById("profile-sub-top");

  if (pfSyncSep)   pfSyncSep.hidden   = false;
  if (pfSigninBtn) pfSigninBtn.hidden = Boolean(user);
  if (pfSyncUser)  pfSyncUser.hidden  = !user;

  if (user) {
    var initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "☁");
    var displayName = user.displayName || user.email || "Usuario";
    if (pfAvatar)    pfAvatar.textContent    = initial;
    if (pfAvatarTop) pfAvatarTop.textContent = initial;
    if (pfName)      pfName.textContent      = displayName;
    if (pfNameTop)   pfNameTop.textContent   = displayName;
    if (pfSub)       pfSub.textContent       = "Sincronizado";
    if (pfSubTop)    pfSubTop.textContent    = "Sincronización activa";
    if (pfSyncName)  pfSyncName.textContent  = user.email || user.displayName || "";
    if (pfSignoutBtn) pfSignoutBtn.addEventListener("click", function() { AnsoSync.signOut(); });
  } else {
    if (pfAvatar)    pfAvatar.textContent    = "A";
    if (pfAvatarTop) pfAvatarTop.textContent = "A";
    if (pfName)      pfName.textContent      = "antask";
    if (pfNameTop)   pfNameTop.textContent   = "antask";
    if (pfSub)       pfSub.textContent       = "Local";
    if (pfSubTop)    pfSubTop.textContent    = "Almacenamiento local";
  }
}

function _syncOnFirstConnect(cloudData) {
  var user = window.AnsoSync && AnsoSync.getUser ? AnsoSync.getUser() : null;
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
      AnsoSync.scheduleSave(projects, sections, standaloneNotes);
      return;
    }
    var cachedMeta = JSON.parse(localStorage.getItem(_acctMetaKey(uid)) || "null");
    var localTime  = cachedMeta && cachedMeta.lastSavedAt ? new Date(cachedMeta.lastSavedAt).getTime() : 0;
    var cloudTime  = cloudData.updatedAt ? cloudData.updatedAt.toMillis() : 0;

    if (cloudTime >= localTime) {
      _syncApplyRemote(cloudData.projects, cloudData.sections || [], cloudData.standaloneNotes || [], uid);
    } else {
      // Caché local más reciente → restaurar y subir
      try {
        projects = JSON.parse(localStorage.getItem(_acctKey(uid)) || "[]").map(sanitizeProject);
        sections = JSON.parse(localStorage.getItem(_acctSectKey(uid)) || "[]");
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
        renderSidebar(); renderTasks();
      } catch(e) {}
      AnsoSync.scheduleSave(projects, sections, standaloneNotes);
    }
    return;
  }

  // ── Primera vez con esta cuenta en este dispositivo ───────────
  var hasAnonymousData = projects.length > 0;

  if (!cloudData || !Array.isArray(cloudData.projects)) {
    // Sin datos en la nube → inicializar caché con lo que haya en local
    _saveAccountCache(uid);
    if (projects.length > 0) AnsoSync.scheduleSave(projects, sections, standaloneNotes);
    return;
  }

  if (!hasAnonymousData) {
    // Sin datos locales → usar nube directamente
    _syncApplyRemote(cloudData.projects, cloudData.sections || [], cloudData.standaloneNotes || [], uid);
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
    if (cloudTime2 >= anonTime) _syncApplyRemote(cloudData.projects, cloudData.sections || [], cloudData.standaloneNotes || [], uid);
    else { _saveAccountCache(uid); AnsoSync.scheduleSave(projects, sections, standaloneNotes); }
    return;
  }

  // Diferencia significativa → preguntar al usuario
  _showSyncConflictModal(cloudData, uid);
}

function _showSyncConflictModal(cloudData, uid) {
  var localCount = projects.length;
  var cloudCount = Array.isArray(cloudData.projects) ? cloudData.projects.length : 0;
  var { overlay, box } = createModalBase();

  box.innerHTML =
    '<p class="modal-label">// Conflicto de datos</p>' +
    '<p style="font-size:0.88rem;color:var(--t-soft);margin-bottom:1.2rem;line-height:1.55">' +
      'Tienes <strong>' + localCount + ' proyecto' + (localCount !== 1 ? "s" : "") + ' locales</strong> ' +
      'y <strong>' + cloudCount + ' proyecto' + (cloudCount !== 1 ? "s" : "") + ' en la nube</strong>. ' +
      '¿Cuáles quieres usar?' +
    '</p>' +
    '<div class="modal-actions" style="flex-direction:column;gap:0.5rem">' +
      '<button type="button" class="modal-btn modal-btn-confirm" id="_sc-cloud">☁ Usar datos de la nube</button>' +
      '<button type="button" class="modal-btn modal-btn-cancel" id="_sc-local">💻 Subir mis datos locales</button>' +
    '</div>';

  // No se puede cerrar con Escape — el usuario debe elegir
  overlay._cancel = null;

  box.querySelector("#_sc-cloud").addEventListener("click", function() {
    closeModal(overlay);
    _syncApplyRemote(cloudData.projects, cloudData.sections || [], cloudData.standaloneNotes || [], uid);
  });

  box.querySelector("#_sc-local").addEventListener("click", function() {
    closeModal(overlay);
    _saveAccountCache(uid);
    AnsoSync.scheduleSave(projects, sections, standaloneNotes);
  });
}

function _syncOnRemoteChange(remoteProjects, remoteSections, remoteStandaloneNotes) {
  var user = window.AnsoSync && AnsoSync.getUser ? AnsoSync.getUser() : null;
  _syncApplyRemote(remoteProjects, remoteSections || [], remoteStandaloneNotes || [], user ? user.uid : null);
}

function _syncApplyRemote(remoteProjects, remoteSections, remoteStandaloneNotes, uid) {
  try {
    projects = remoteProjects.map(sanitizeProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (Array.isArray(remoteSections)) {
      sections = remoteSections;
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
    }
    if (Array.isArray(remoteStandaloneNotes)) {
      standaloneNotes = remoteStandaloneNotes.map(sanitizeStandaloneNote);
      localStorage.setItem(NOTES_KEY, JSON.stringify(standaloneNotes));
    }
    // Actualizar caché por cuenta
    if (uid) _saveAccountCache(uid);

    renderSidebar();
    var proj = getActiveProject();
    if (proj) {
      renderTasks();
      renderLabelFilterBar();
    }
    updateSaveStatus(new Date().toISOString());
  } catch (e) {
    console.warn("AnsoSync: error aplicando cambios remotos:", e);
  }
}
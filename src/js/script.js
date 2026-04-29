// ─── CLAVES DE ALMACENAMIENTO ────────────────────────────────
const PROJECTS_KEY   = "anso-projects";
const ACTIVE_KEY     = "anso-active-project";
const METADATA_KEY   = "anso-meta";
const THEME_KEY      = "mis-tareas-theme";
const SECTIONS_KEY   = "anso-sections";

const LEGACY_PROJECTS_KEY = "ans0-projects";
const LEGACY_ACTIVE_KEY   = "ans0-active-project";
const LEGACY_METADATA_KEY = "ans0-meta";

function migrateStorageIfNeeded() {
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

// ─── ESTADO DE CICLO ─────────────────────────────────────────
const STATUS_CYCLE = [null, "progress", "waiting"];
const STATUS_CONFIG = {
  progress: { label: "▶ Progreso", cls: "status-progress" },
  waiting:  { label: "⏸ En espera", cls: "status-waiting" },
};

// ─── PRIORIDAD ────────────────────────────────────────────────
const PRIORITY_CYCLE  = [null, "high", "medium", "low"];
const PRIORITY_CONFIG = {
  high:   { label: "▲ Alta",   cls: "priority-high",   short: "▲" },
  medium: { label: "◆ Media",  cls: "priority-medium", short: "◆" },
  low:    { label: "▽ Baja",   cls: "priority-low",    short: "▽" },
};

// ─── ELEMENTOS DOM ───────────────────────────────────────────
const themeToggle      = document.getElementById("theme-toggle");
const projectListEl    = document.getElementById("project-list");
const newProjectBtn    = document.getElementById("new-project-btn");
const emptyState       = document.getElementById("empty-state");
const tasksPanel       = document.getElementById("tasks-panel");
const projectTitleEl   = document.getElementById("project-title");
const projectSubtitle  = document.getElementById("project-subtitle");
const notesLink        = document.getElementById("notes-link");
const deleteProjectBtn = document.getElementById("delete-project-btn");
const taskForm         = document.getElementById("task-form");
const taskInput        = document.getElementById("task-input");
const taskList         = document.getElementById("task-list");
const taskCounter      = document.getElementById("task-counter");
const saveStatus       = document.getElementById("save-status");
const clearDoneBtn     = document.getElementById("clear-done");
const exportBtn        = document.getElementById("export-btn");
const importFile       = document.getElementById("import-file");
const filterButtons    = document.querySelectorAll("[data-filter]");
const template         = document.getElementById("task-item-template");

// ─── CLOUD SYNC DOM REFS ─────────────────────────────────────
const syncSection    = document.getElementById("sync-section");
const syncSigninBtn  = document.getElementById("sync-signin-btn");
const syncUserInfo   = document.getElementById("sync-user-info");
const syncUserAvatar = document.getElementById("sync-user-avatar");
const syncUserName   = document.getElementById("sync-user-name");
const syncSignoutBtn = document.getElementById("sync-signout-btn");

// ─── PANEL DE NOTAS LATERAL ───────────────────────────────────
const notesSidePanel  = document.getElementById("notes-side-panel");
const notesSideClose  = document.getElementById("notes-side-close");
const notesSideEditor = document.getElementById("notes-side-editor");
const notesSideStatus = document.getElementById("notes-side-status");
const notesFmtBtns    = document.querySelectorAll(".notes-fmt-btn");
let _notesSaveTimer   = null;

// ─── ESTADO ──────────────────────────────────────────────────
migrateStorageIfNeeded();

let projects        = loadProjects();
let sections        = loadSections();
let activeProjectId = localStorage.getItem(ACTIVE_KEY) || null;
let currentFilter      = "all";
let currentSort        = "manual";
let currentLabelFilter = null;   // null = sin filtro de etiqueta
const expandedTaskIds  = new Set();
let dragSrcId   = null;   // id de la tarea que se arrastra
let dropIndicator = null; // línea visual de posición

// ─── UNDO ESTADO ─────────────────────────────────────────────
let _undoStack = null;  // { projectId, task, index } | { projectId, tasks, indices }
let _undoTimer = null;

// ─── MULTI-SELECT ─────────────────────────────────────────────
let selectMode = false;
const selectedTaskIds = new Set();
const bulkActionBar  = document.getElementById("bulk-action-bar");
const bulkCount      = document.getElementById("bulk-count");
const selectModeBtn  = document.getElementById("select-mode-btn");

// ─── ARRANQUE ────────────────────────────────────────────────
var _splashStart = performance.now();
try { initializeTheme(); } catch(e) { console.error("initializeTheme error:", e); }
try { renderSidebar(); } catch(e) { console.error("renderSidebar error:", e); }
try { activateProject(activeProjectId); } catch(e) { console.error("activateProject error:", e); }

// ─── OCULTAR PANTALLA DE CARGA ───────────────────────────────
(function() {
  var splash = document.getElementById("splash");
  if (!splash) return;
  var minMs = 1350;
  var wait = Math.max(0, minMs - (performance.now() - _splashStart));
  setTimeout(function() {
    if (!splash.parentNode) return;
    var removed = false;
    function removeSplash() {
      if (removed) return;
      removed = true;
      splash.remove();
    }
    splash.classList.add("splash-done");
    splash.addEventListener("transitionend", removeSplash, { once: true });
    setTimeout(removeSplash, 700);
  }, wait);
})();

// ─── CLOUD SYNC INIT ─────────────────────────────────────────
if (window.AnsoSync) {
  if (syncSection) syncSection.hidden = false;
  if (syncSigninBtn) {
    syncSigninBtn.addEventListener("click", function () {
      AnsoSync.signIn().catch(function (err) {
        if (err.code !== "auth/popup-closed-by-user") {
          console.warn("AnsoSync: error en inicio de sesión:", err);
        }
      });
    });
  }
  if (syncSignoutBtn) {
    syncSignoutBtn.addEventListener("click", function () { AnsoSync.signOut(); });
  }
  AnsoSync.init(_syncOnRemoteChange, _syncOnAuthChange, _syncOnFirstConnect);
}

// ─── BÚSQUEDA GLOBAL ─────────────────────────────────────────
const globalSearchBtn = document.getElementById("global-search-btn");
if (globalSearchBtn) {
  globalSearchBtn.addEventListener("click", function() { showGlobalSearch(); });
}

const shortcutsBtn = document.getElementById("shortcuts-btn");
if (shortcutsBtn) {
  shortcutsBtn.addEventListener("click", function() { showShortcutsHelp(); });
}

// ─── ACCIÓN EN MASA — LISTENERS ──────────────────────────────
if (selectModeBtn) selectModeBtn.addEventListener("click", toggleSelectMode);
var _bulkDoneBtn   = document.getElementById("bulk-done-btn");
var _bulkPendingBtn= document.getElementById("bulk-pending-btn");
var _bulkDeleteBtn = document.getElementById("bulk-delete-btn");
var _bulkCancelBtn = document.getElementById("bulk-cancel-btn");
if (_bulkDoneBtn)    _bulkDoneBtn.addEventListener("click",    bulkMarkDone);
if (_bulkPendingBtn) _bulkPendingBtn.addEventListener("click", bulkMarkPending);
if (_bulkDeleteBtn)  _bulkDeleteBtn.addEventListener("click",  bulkDelete);
if (_bulkCancelBtn)  _bulkCancelBtn.addEventListener("click",  exitSelectMode);

// Interceptar el enlace de notas para abrir panel lateral
notesLink.addEventListener("click", function(e) {
  e.preventDefault();
  openNotesPanel();
});

// Cerrar panel de notas con el backdrop compartido (móvil)
var _sheetBackdropEl = document.getElementById("sheet-backdrop");
if (_sheetBackdropEl) {
  _sheetBackdropEl.addEventListener("click", function() { closeNotesPanel(); });
}

// Cerrar panel de notas con el botón ✕
if (notesSideClose) {
  notesSideClose.addEventListener("click", function() { closeNotesPanel(); });
}

// Editor de notas: guardado y formato
if (notesSideEditor) {
  notesSideEditor.addEventListener("input", function() {
    if (_notesSaveTimer) clearTimeout(_notesSaveTimer);
    _notesSaveTimer = setTimeout(saveNotesSide, 600);
  });
  notesSideEditor.addEventListener("keyup",    updateNotesFmtButtons);
  notesSideEditor.addEventListener("mouseup",  updateNotesFmtButtons);
  notesSideEditor.addEventListener("keydown", function(e) {
    if (e.ctrlKey || e.metaKey) {
      var cmd = { b: "bold", i: "italic", u: "underline", m: "strikeThrough" }[e.key.toLowerCase()];
      if (cmd) {
        e.preventDefault();
        document.execCommand(cmd, false, null);
        updateNotesFmtButtons();
        saveNotesSide();
      }
    }
  });
}

notesFmtBtns.forEach(function(btn) {
  btn.addEventListener("mousedown", function(e) {
    e.preventDefault();
    document.execCommand(btn.dataset.cmd, false, null);
    if (notesSideEditor) notesSideEditor.focus();
    updateNotesFmtButtons();
    saveNotesSide();
  });
});

// ─── ATAJOS DE TECLADO GLOBALES ───────────────────────────────
document.addEventListener("keydown", function(e) {
  const tag = document.activeElement && document.activeElement.tagName;
  const isEditing = tag === "INPUT" || tag === "TEXTAREA" ||
    (document.activeElement && document.activeElement.isContentEditable);

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showGlobalSearch();
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
    if (input && tasksPanel && !tasksPanel.hidden) {
      input.focus();
      input.select();
    }
    return;
  }
});

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE MODALES
// ═══════════════════════════════════════════════════════════════

function createModalBase() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";
  overlay.appendChild(box);

  // Cerrar al hacer clic fuera
  overlay.addEventListener("mousedown", function(e) {
    if (e.target === overlay) overlay._cancel && overlay._cancel();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(function() { overlay.classList.add("modal-visible"); });
  return { overlay, box };
}

function closeModal(overlay) {
  overlay.classList.remove("modal-visible");
  overlay.addEventListener("transitionend", function() {
    overlay.remove();
  }, { once: true });
}

/**
 * Modal de entrada de texto (reemplaza window.prompt)
 * @param {string} label   — Título del modal
 * @param {string} [value] — Valor inicial del input
 * @param {string} [placeholder]
 * @returns {Promise<string|null>}  — texto ingresado o null si cancela
 */
function modalPrompt(label, value, placeholder) {
  return new Promise(function(resolve) {
    const { overlay, box } = createModalBase();

    box.innerHTML =
      '<p class="modal-label">' + label + '</p>' +
      '<input class="modal-input" type="text" maxlength="120" autocomplete="off" />' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Aceptar</button>' +
      '</div>';

    const input   = box.querySelector(".modal-input");
    const confirm = box.querySelector(".modal-btn-confirm");
    const cancel  = box.querySelector(".modal-btn-cancel");

    if (value)       input.value = value;
    if (placeholder) input.placeholder = placeholder;

    function doConfirm() {
      const val = input.value.trim();
      closeModal(overlay);
      resolve(val || null);
    }
    function doCancel() {
      closeModal(overlay);
      resolve(null);
    }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    // Focus al input
    setTimeout(function() { input.focus(); input.select(); }, 50);
  });
}

/**
 * Modal de confirmación (reemplaza window.confirm)
 * @param {string} message
 * @param {string} [confirmLabel]
 * @returns {Promise<boolean>}
 */
function modalConfirm(message, confirmLabel) {
  return new Promise(function(resolve) {
    const { overlay, box } = createModalBase();

    box.innerHTML =
      '<p class="modal-label">' + message + '</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-danger">' + (confirmLabel || "Eliminar") + '</button>' +
      '</div>';

    const confirm = box.querySelector(".modal-btn-danger");
    const cancel  = box.querySelector(".modal-btn-cancel");

    function doConfirm() { closeModal(overlay); resolve(true); }
    function doCancel()  { closeModal(overlay); resolve(false); }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape") { doCancel(); document.removeEventListener("keydown", handler); }
      if (e.key === "Enter")  { doConfirm(); document.removeEventListener("keydown", handler); }
    });

    setTimeout(function() { confirm.focus(); }, 50);
  });
}

/**
 * Modal de alerta informativa (reemplaza window.alert)
 * @param {string} message
 * @param {"info"|"error"} [type]
 * @returns {Promise<void>}
 */
function modalAlert(message, type) {
  return new Promise(function(resolve) {
    const { overlay, box } = createModalBase();
    const icon = type === "error" ? "✕" : "⬡";
    const cls  = type === "error" ? "modal-label modal-label-error" : "modal-label";

    box.innerHTML =
      '<div class="modal-icon">' + icon + '</div>' +
      '<p class="' + cls + '">' + message + '</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-confirm">Entendido</button>' +
      '</div>';

    const btn = box.querySelector(".modal-btn-confirm");
    function doClose() { closeModal(overlay); resolve(); }

    overlay._cancel = doClose;
    btn.addEventListener("click", doClose);
    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        doClose(); document.removeEventListener("keydown", handler);
      }
    });

    setTimeout(function() { btn.focus(); }, 50);
  });
}


/**
 * Modal para seleccionar fecha límite
 * @param {string|null} current — valor ISO actual (YYYY-MM-DD) o null
 * @returns {Promise<string|null|"clear">}
 */
function modalDate(current) {
  return new Promise(function(resolve) {
    const { overlay, box } = createModalBase();

    const now = new Date();
    const dow = now.getDay(); // 0=Dom … 6=Sáb

    function toDateStr(d) { return d.toISOString().slice(0, 10); }
    function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }

    const todayStr    = toDateStr(now);
    const tomorrowStr = toDateStr(addDays(now, 1));
    const daysToFri   = (5 - dow + 7) % 7 || 7;   // días hasta el próximo viernes
    const daysToMon   = (1 - dow + 7) % 7 || 7;   // días hasta el próximo lunes
    const thisFriStr  = toDateStr(addDays(now, daysToFri));
    const nextMonStr  = toDateStr(addDays(now, daysToMon));

    const quickPicks = [
      { label: "Hoy",            value: todayStr    },
      { label: "Mañana",         value: tomorrowStr },
      { label: "Este viernes",   value: thisFriStr  },
      { label: "Próximo lunes",  value: nextMonStr  },
    ];

    box.innerHTML =
      '<p class="modal-label">// Fecha límite</p>' +
      '<div class="date-quick-picks">' +
        quickPicks.map(function(p) {
          const active = current === p.value ? ' active' : '';
          return '<button type="button" class="date-quick-btn' + active + '" data-value="' + p.value + '">' + p.label + '</button>';
        }).join('') +
      '</div>' +
      '<input class="modal-input modal-input-date" type="date" />' +
      '<div class="modal-actions modal-actions-date">' +
        '<button class="modal-btn modal-btn-clear">✕ Quitar</button>' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Guardar</button>' +
      '</div>';

    const input   = box.querySelector(".modal-input-date");
    const confirm = box.querySelector(".modal-btn-confirm");
    const cancel  = box.querySelector(".modal-btn-cancel");
    const clear   = box.querySelector(".modal-btn-clear");

    input.min   = todayStr;
    input.value = current || "";

    // Click en botón rápido → confirma directamente
    box.querySelectorAll(".date-quick-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        closeModal(overlay);
        resolve(btn.dataset.value);
      });
    });

    // Resaltar botón rápido cuando el input cambia manualmente
    input.addEventListener("input", function() {
      box.querySelectorAll(".date-quick-btn").forEach(function(btn) {
        btn.classList.toggle("active", btn.dataset.value === input.value);
      });
    });

    function doConfirm() { closeModal(overlay); resolve(input.value || null); }
    function doCancel()  { closeModal(overlay); resolve(undefined); }
    function doClear()   { closeModal(overlay); resolve("clear"); }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    clear.addEventListener("click",   doClear);
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function() { input.focus(); }, 50);
  });
}

// ─── TEMA ────────────────────────────────────────────────────
function setTheme(nextTheme) {
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

function toggleThemeWithTransition(sourceEl) {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const root = document.documentElement;
  const rect = sourceEl && sourceEl.getBoundingClientRect ? sourceEl.getBoundingClientRect() : null;
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 30;
  const y = rect ? rect.top + rect.height / 2 : 30;

  root.style.setProperty("--vt-x", x + "px");
  root.style.setProperty("--vt-y", y + "px");

  if (!document.startViewTransition) {
    setTheme(next);
    return;
  }

  document.startViewTransition(function() {
    setTheme(next);
  });
}

window.toggleThemeWithTransition = toggleThemeWithTransition;

if (themeToggle) themeToggle.addEventListener("click", function() {
  toggleThemeWithTransition(themeToggle);
});

// ─── NUEVO PROYECTO ──────────────────────────────────────────
newProjectBtn.addEventListener("click", async function() {
  const name = await modalPrompt("// Nombre del proyecto", "", "mi-proyecto...");
  if (!name) return;
  const project = {
    id: generateId(),
    name: name.trim().slice(0, 60),
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
    'Eliminar <strong>' + project.name + '</strong> y todas sus tareas?',
    "✕ Eliminar"
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
  const project = getActiveProject();
  if (!project) return;
  const text = taskInput.value.trim();
  if (!text) return;
  project.tasks.unshift({
    id: generateId(),
    text: text,
    comment: "",
    done: false,
    status: null,
    dueDate: null,
    subtasks: [],
  });
  taskInput.value = "";
  saveAndRender();
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
        "↓ Restaurar workspace"
      );
      if (!confirmed) return;
      projects = parsed.projects.map(sanitizeProject);
      activeProjectId = projects.length > 0 ? projects[0].id : null;
      if (activeProjectId) localStorage.setItem(ACTIVE_KEY, activeProjectId);
      else localStorage.removeItem(ACTIVE_KEY);
      saveProjects();
      renderSidebar();
      activateProject(activeProjectId);
      await modalAlert("Workspace restaurado con " + projects.length + " proyecto(s).", "info");
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
  var filterEl = document.getElementById("filter-select");
  if (filterEl && filterEl.value !== value) filterEl.value = value;
  // sync mobile label & active state
  var filterLabelEl = document.getElementById("mobile-filter-label");
  if (filterLabelEl) filterLabelEl.textContent = _filterLabels[value] || "Todas";
  document.querySelectorAll("#mobile-filter-dropdown [data-filter]").forEach(function(b) {
    b.classList.toggle("active", b.dataset.filter === value);
  });
  renderTasks();
}
window.applyFilter = applyFilter;

var filterSelect = document.getElementById("filter-select");
if (filterSelect) {
  filterSelect.addEventListener("change", function() { applyFilter(filterSelect.value); });
}

// ─── ORDENACIÓN ──────────────────────────────────────────────
function applySort(value) {
  currentSort = value;
  var sortEl  = document.getElementById("sort-select");
  var sortElM = document.getElementById("sort-select-mobile");
  if (sortEl  && sortEl.value  !== value) sortEl.value  = value;
  if (sortElM && sortElM.value !== value) sortElM.value = value;
  renderTasks();
}

var sortSelect = document.getElementById("sort-select");
if (sortSelect) {
  sortSelect.addEventListener("change", function() { applySort(sortSelect.value); });
}
var sortSelectMobile = document.getElementById("sort-select-mobile");
if (sortSelectMobile) {
  sortSelectMobile.addEventListener("change", function() { applySort(sortSelectMobile.value); });
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

function activateProject(id) {
  activeProjectId = id;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);

  const project = getActiveProject();
  const hasProject = Boolean(project);

  emptyState.hidden = hasProject;
  tasksPanel.hidden = !hasProject;
  if (!hasProject) document.title = "antask";

  if (!hasProject) { renderSidebar(); return; }

  projectTitleEl.textContent = project.name;
  projectSubtitle.textContent = "// " + project.tasks.length + " tarea" + (project.tasks.length !== 1 ? "s" : "");
  notesLink.href = "./notas.html?project=" + project.id;

  if (selectMode) exitSelectMode();
  currentFilter = "all";
  currentSort   = "manual";
  currentLabelFilter = null;
  var filterEl = document.getElementById("filter-select");
  if (filterEl) filterEl.value = "all";
  var sortEl = document.getElementById("sort-select");
  var sortElM = document.getElementById("sort-select-mobile");
  if (sortEl)  sortEl.value  = "manual";
  if (sortElM) sortElM.value = "manual";

  expandedTaskIds.clear();
  renderSidebar();
  renderTasks();
  renderLabelFilterBar();
  updateSaveStatus(loadMetadata().lastSavedAt);

  if (notesSidePanel && notesSidePanel.classList.contains("notes-side-open")) {
    notesSideEditor.innerHTML = project.notes || "";
    updateNotesSideStatus();
  }
}

function renderSidebar() {
  projectListEl.innerHTML = "";
  const knownSectionIds = new Set(sections.map(function(s) { return s.id; }));
  const ungrouped = projects.filter(function(p) { return !p.sectionId || !knownSectionIds.has(p.sectionId); });

  if (projects.length === 0 && sections.length === 0) {
    const li = document.createElement("li");
    li.className = "project-empty";
    li.textContent = "Sin proyectos aún";
    projectListEl.appendChild(li);
    return;
  }

  ungrouped.forEach(function(p) { renderProjectItem(p); });

  sections.forEach(function(section) {
    const sectionProjects = projects.filter(function(p) { return p.sectionId === section.id; });
    renderSectionHeader(section, sectionProjects);
    if (!section.collapsed) {
      sectionProjects.forEach(function(p) { renderProjectItem(p, true); });
    }
  });
}

function renderSectionHeader(section, sectionProjects) {
  const li = document.createElement("li");
  li.className = "section-header";

  const chevron = document.createElement("span");
  chevron.className = "section-chevron";
  chevron.textContent = section.collapsed ? "▶" : "▼";

  const nameEl = document.createElement("span");
  nameEl.className = "section-name";
  nameEl.textContent = section.name;

  const countEl = document.createElement("span");
  countEl.className = "section-count";
  countEl.textContent = sectionProjects.length;

  const menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.className = "section-menu-btn";
  menuBtn.textContent = "⋯";
  menuBtn.title = "Opciones de sección";
  menuBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    showSectionMenu(section, menuBtn);
  });

  li.appendChild(chevron);
  li.appendChild(nameEl);
  li.appendChild(countEl);
  li.appendChild(menuBtn);
  li.addEventListener("click", function() {
    section.collapsed = !section.collapsed;
    saveSections();
    renderSidebar();
  });
  projectListEl.appendChild(li);
}

function renderProjectItem(project, indented) {
  const li = document.createElement("li");
  li.className = "project-item" + (indented ? " project-item-indented" : "");
  if (project.id === activeProjectId) li.classList.add("active");

  const done  = project.tasks.filter(function(t) { return t.done; }).length;
  const total = project.tasks.length;

  const nameSpan = document.createElement("span");
  nameSpan.className = "project-item-name";
  nameSpan.textContent = project.name;
  nameSpan.title = "Doble clic para renombrar";
  nameSpan.addEventListener("dblclick", async function(e) {
    e.stopPropagation();
    const newName = await modalPrompt("// Cambiar nombre del proyecto", project.name, project.name);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === project.name) return;
    project.name = trimmed;
    saveProjects();
    renderSidebar();
    if (project.id === activeProjectId) activateProject(project.id);
  });

  const countSpan = document.createElement("span");
  countSpan.className = "project-item-count";
  countSpan.textContent = done + "/" + total;

  const kebabBtn = document.createElement("button");
  kebabBtn.type = "button";
  kebabBtn.className = "project-kebab-btn";
  kebabBtn.textContent = "⋯";
  kebabBtn.title = "Opciones";
  kebabBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    showProjectMenu(project, kebabBtn);
  });

  const topRow = document.createElement("div");
  topRow.className = "project-item-top";
  topRow.appendChild(nameSpan);
  topRow.appendChild(countSpan);
  topRow.appendChild(kebabBtn);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.createElement("div");
  bar.className = "project-progress-bar";
  bar.innerHTML = '<div class="project-progress-fill" style="width:' + pct + '%"></div>';

  li.appendChild(topRow);
  if (total > 0) li.appendChild(bar);
  li.addEventListener("click", function() { activateProject(project.id); });
  projectListEl.appendChild(li);
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
        var trimmed = newName.trim();
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
        var ok = await modalConfirm(
          "¿Eliminar la sección <strong>" + section.name + "</strong>? Los proyectos pasarán a sin sección.",
          "✕ Eliminar"
        );
        if (!ok) return;
        projects.forEach(function(p) {
          if (p.sectionId === section.id) p.sectionId = null;
        });
        sections = sections.filter(function(s) { return s.id !== section.id; });
        saveProjects();
        saveSections();
        renderSidebar();
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
      label: (project.sectionId === s.id ? "✓ " : "    ") + s.name,
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

  var items = assignGroup.concat([
    {
      label: "Renombrar proyecto",
      action: async function() {
        var newName = await modalPrompt("// Cambiar nombre del proyecto", project.name, project.name);
        if (newName === null) return;
        var trimmed = newName.trim();
        if (!trimmed || trimmed === project.name) return;
        project.name = trimmed;
        saveProjects();
        renderSidebar();
        if (project.id === activeProjectId) activateProject(project.id);
      }
    },
    null,
    {
      label: "Eliminar proyecto",
      danger: true,
      action: async function() {
        var ok = await modalConfirm(
          "¿Eliminar el proyecto <strong>" + project.name + "</strong> y todas sus tareas?",
          "✕ Eliminar"
        );
        if (!ok) return;
        projects = projects.filter(function(p) { return p.id !== project.id; });
        if (activeProjectId === project.id) {
          activeProjectId = projects.length > 0 ? projects[0].id : null;
        }
        saveProjects();
        renderSidebar();
        renderTasks();
      }
    }
  ]);

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
  const project = getActiveProject();
  if (!project) return;

  taskList.innerHTML = "";
  getVisibleTasks(project).forEach(function(task) {
    const node       = template.content.firstElementChild.cloneNode(true);
    const checkbox   = node.querySelector(".task-toggle");
    const text       = node.querySelector(".task-text");
    const expandedTx = node.querySelector(".task-text-expanded");
    const comment    = node.querySelector(".task-comment");
    const commentBtn = node.querySelector(".comment-btn");
    const deleteBtn  = node.querySelector(".delete-btn");
    const subAddBtn  = node.querySelector(".subtask-add-btn");
    const subtaskList= node.querySelector(".subtask-list");
    const statusBtn     = node.querySelector(".status-btn");
    const priorityBtn   = node.querySelector(".priority-btn");
    const labelsContainer = node.querySelector(".task-labels-container");

    checkbox.checked       = task.done;
    text.textContent       = task.text;
    expandedTx.textContent = task.text;
    expandedTx.hidden      = true;
    comment.textContent    = task.comment || "Sin comentario";
    node.classList.toggle("done", task.done);

    applyStatusToNode(node, task);
    updateStatusBtn(statusBtn, task);
    applyPriorityToNode(node, task);
    updatePriorityBtn(priorityBtn, task);
    renderTaskLabels(task, labelsContainer);
    renderSubtasks(task, subtaskList);

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
        setTimeout(function() { saveAndRender(); }, 320);
      } else {
        node.classList.add("task-uncompleting");
        setTimeout(function() { saveAndRender(); }, 220);
      }
      renderDueBadge(task, node.querySelector(".task-due-container"));
    });

    text.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      startInlineEdit(text, task, expandedTx);
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
        const expandedTx = node.querySelector(".task-text-expanded");
        if (textSpan) startInlineEdit(textSpan, task, expandedTx);
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
    requestAnimationFrame(function() {
      expandedTx.hidden = !(text.scrollWidth > text.clientWidth);
    });
  });

  const pending = project.tasks.filter(function(t) { return !t.done; }).length;
  taskCounter.textContent = pending + " pendiente" + (pending === 1 ? "" : "s");
  projectSubtitle.textContent = "// " + project.tasks.length + " tarea" + (project.tasks.length !== 1 ? "s" : "");
  document.title = pending > 0
    ? "(" + pending + ") " + project.name + " — antask"
    : project.name + " — antask";
}

function renderSubtasks(task, subtaskList) {
  subtaskList.innerHTML = "";
  if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) {
    const li = document.createElement("li");
    li.className = "subtask-empty";
    li.textContent = "Sin subtareas";
    subtaskList.appendChild(li);
    return;
  }
  task.subtasks.forEach(function(subtask) {
    const item = document.createElement("li");
    item.className = "subtask-item";
    const label = document.createElement("label");
    label.className = "subtask-label";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = subtask.done;
    cb.addEventListener("change", function() { subtask.done = cb.checked; saveAndRender(); });
    const span = document.createElement("span");
    span.className = "subtask-text";
    span.textContent = subtask.text;
    span.classList.toggle("done", subtask.done);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "subtask-delete-btn";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Eliminar subtarea");
    del.addEventListener("click", function() {
      task.subtasks = task.subtasks.filter(function(s) { return s.id !== subtask.id; });
      saveAndRender();
    });
    label.append(cb, span);
    item.append(label, del);
    subtaskList.appendChild(item);
  });
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

function applyStatusToNode(node, task) {
  node.classList.remove("status-progress", "status-waiting");
  if (task.done || !task.status) return;
  node.classList.add("status-" + task.status);
}

function updateStatusBtn(btn, task) {
  if (task.done || !task.status) {
    btn.textContent = "⬡ Estado";
    btn.className = "status-btn";
  } else {
    const cfg = STATUS_CONFIG[task.status];
    btn.textContent = cfg.label;
    btn.className = "status-btn " + cfg.cls + "-btn";
  }
}

// ─── PRIORIDAD ────────────────────────────────────────────────
function cyclePriority(task) {
  const idx = PRIORITY_CYCLE.indexOf(task.priority || null);
  task.priority = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
  saveAndRender();
}

function applyPriorityToNode(node, task) {
  node.classList.remove("priority-high", "priority-medium", "priority-low");
  if (!task.priority) return;
  node.classList.add("priority-" + task.priority);
}

function updatePriorityBtn(btn, task) {
  if (!task.priority) {
    btn.textContent = "◇ Prior.";
    btn.className = "priority-btn";
  } else {
    const cfg = PRIORITY_CONFIG[task.priority];
    btn.textContent = cfg.label;
    btn.className = "priority-btn " + cfg.cls + "-btn";
  }
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

function renderTaskLabels(task, container) {
  container.innerHTML = "";
  if (!Array.isArray(task.labels) || task.labels.length === 0) return;
  task.labels.forEach(function(labelName) {
    const badge = document.createElement("span");
    badge.className = "label-badge";
    badge.textContent = labelName;
    badge.style.setProperty("--label-color", getLabelColor(labelName));
    badge.addEventListener("click", function(e) {
      e.stopPropagation();
      currentLabelFilter = currentLabelFilter === labelName ? null : labelName;
      renderLabelFilterBar();
      renderTasks();
    });
    container.appendChild(badge);
  });
}

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
    btn.style.setProperty("--label-color", getLabelColor(labelName));
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
              '<button type="button" class="label-delete-btn" data-label="' + escHtml(l) + '" title="Eliminar etiqueta">✕</button>' +
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

function getLabelColor(name) {
  // deterministic color from label name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return "hsl(" + hue + ", 70%, 55%)";
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function startInlineEdit(textSpan, task, expandedText) {
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
    const newText = input.value.trim().slice(0, 120);
    if (newText && newText !== current) {
      task.text = newText;
      saveAndRender();
    } else {
      textSpan.textContent = current;
      if (expandedText) expandedText.textContent = current;
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


// ─── FECHA LÍMITE ─────────────────────────────────────────────
function getDueDateState(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)  return { label: "Vencida", cls: "due-overdue",  diff };
  if (diff === 0) return { label: "Hoy",    cls: "due-today",   diff };
  if (diff === 1) return { label: "Mañana", cls: "due-soon",    diff };
  return { label: formatDueDate(dueDate), cls: "due-future", diff };
}

function formatDueDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function renderDueBadge(task, container) {
  const existing = container.querySelector(".due-badge");
  if (existing) existing.remove();
  if (task.done || !task.dueDate) return;
  const state = getDueDateState(task.dueDate);
  if (!state) return;
  const badge = document.createElement("span");
  badge.className = "due-badge " + state.cls;
  badge.textContent = "⏱ " + state.label;
  container.appendChild(badge);
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
  });

  node.addEventListener("dragend", function() {
    node.classList.remove("drag-ghost");
    node.setAttribute("draggable", "false");
    removeDropIndicator();
    dragSrcId = null;
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
    selectModeBtn.textContent = "✕ Cancelar";
    selectModeBtn.classList.add("active");
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
    selectModeBtn.textContent = "⊡ Seleccionar";
    selectModeBtn.classList.remove("active");
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

// ═══════════════════════════════════════════════════════════════
// PANEL DE NOTAS LATERAL
// ═══════════════════════════════════════════════════════════════

function openNotesPanel() {
  const project = getActiveProject();
  if (!project || !notesSidePanel) return;
  notesSideEditor.innerHTML = project.notes || "";
  updateNotesSideStatus();
  notesSidePanel.classList.add("notes-side-open");
  if (window.innerWidth <= 768) {
    var backdrop = document.getElementById("sheet-backdrop");
    if (backdrop) backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  updateNotesFmtButtons();
  setTimeout(function() { if (notesSideEditor) notesSideEditor.focus(); }, 100);
}

function closeNotesPanel() {
  if (!notesSidePanel || !notesSidePanel.classList.contains("notes-side-open")) return;
  notesSidePanel.classList.remove("notes-side-open");
  if (window.innerWidth <= 768) {
    var backdrop = document.getElementById("sheet-backdrop");
    if (backdrop) backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function saveNotesSide() {
  const project = getActiveProject();
  if (!project || !notesSideEditor) return;
  project.notes = notesSideEditor.innerHTML;
  saveProjects();
  updateNotesSideStatus();
}

function updateNotesSideStatus() {
  if (!notesSideStatus) return;
  const meta = loadMetadata();
  if (!meta.lastSavedAt) { notesSideStatus.textContent = "Sin cambios recientes"; return; }
  const date = new Date(meta.lastSavedAt);
  if (Number.isNaN(date.getTime())) { notesSideStatus.textContent = "Sin cambios recientes"; return; }
  notesSideStatus.textContent = "Último guardado: " + date.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function updateNotesFmtButtons() {
  notesFmtBtns.forEach(function(btn) {
    try {
      var active = document.queryCommandState(btn.dataset.cmd);
      btn.classList.toggle("fmt-active", active);
      btn.setAttribute("aria-pressed", String(active));
    } catch(e) {}
  });
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

function showGlobalSearch() {
  const { overlay, box } = createModalBase();

  box.className = "modal-box modal-box-search";
  box.innerHTML =
    '<p class="modal-label">// Buscar en todos los proyectos</p>' +
    '<input class="modal-input" type="text" maxlength="100" autocomplete="off" placeholder="escribe para buscar..." />' +
    '<div id="search-results" class="search-results"></div>' +
    '<div class="modal-actions"><button class="modal-btn modal-btn-cancel">Cerrar</button></div>';

  const input   = box.querySelector(".modal-input");
  const results = box.querySelector("#search-results");
  const cancel  = box.querySelector(".modal-btn-cancel");

  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  cancel.addEventListener("click", doClose);

  input.addEventListener("keydown", function(e) {
    if (e.key === "Escape") doClose();
    e.stopPropagation();
  });

  input.addEventListener("input", function() {
    const q = input.value.trim().toLowerCase();
    renderSearchResults(results, q, doClose);
  });

  setTimeout(function() { input.focus(); }, 50);
}

function renderSearchResults(container, q, closeCallback) {
  container.innerHTML = "";
  if (q.length < 2) {
    container.innerHTML = '<p class="search-hint">Escribe al menos 2 caracteres…</p>';
    return;
  }

  let total = 0;
  projects.forEach(function(project) {
    const matches = project.tasks.filter(function(t) {
      return t.text.toLowerCase().includes(q) ||
             (t.comment && t.comment.toLowerCase().includes(q));
    });
    if (matches.length === 0) return;
    total += matches.length;

    const group = document.createElement("div");
    group.className = "search-group";

    const heading = document.createElement("p");
    heading.className = "search-group-heading";
    heading.textContent = project.name;
    group.appendChild(heading);

    matches.forEach(function(task) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "search-result-item" + (task.done ? " search-result-done" : "");

      const hl = highlightMatch(task.text, q);
      item.innerHTML =
        '<span class="search-result-check">' + (task.done ? "✓" : "○") + '</span>' +
        '<span class="search-result-text">' + hl + '</span>';

      if (task.comment && task.comment.toLowerCase().includes(q)) {
        const snippet = document.createElement("span");
        snippet.className = "search-result-snippet";
        snippet.innerHTML = highlightMatch(task.comment.slice(0, 80), q);
        item.appendChild(snippet);
      }

      item.addEventListener("click", function() {
        closeCallback();
        navigateToTask(project.id, task.id);
      });

      group.appendChild(item);
    });

    container.appendChild(group);
  });

  if (total === 0) {
    container.innerHTML = '<p class="search-hint">Sin resultados para <em>' + escHtml(q) + '</em></p>';
  }
}

function highlightMatch(text, q) {
  const safe = escHtml(text);
  const safeQ = escHtml(q);
  const re = new RegExp("(" + safeQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  return safe.replace(re, '<mark class="search-hl">$1</mark>');
}

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
function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map(sanitizeProject);
  } catch(e) { return []; }
}

function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  updateSaveStatus(now);
  if (window.AnsoSync) AnsoSync.scheduleSave(projects, sections);
}

function loadSections() {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveSections() {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  const now = new Date().toISOString();
  localStorage.setItem(METADATA_KEY, JSON.stringify({ lastSavedAt: now }));
  if (window.AnsoSync) AnsoSync.scheduleSave(projects, sections);
}

function loadMetadata() {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : { lastSavedAt: null };
  } catch(e) { return { lastSavedAt: null }; }
}

function sanitizeProject(p) {
  return {
    id:        typeof p.id === "string" ? p.id : generateId(),
    name:      typeof p.name === "string" ? p.name.trim().slice(0, 60) : "Sin nombre",
    createdAt: p.createdAt || new Date().toISOString(),
    tasks:     sanitizeTasks(p.tasks),
    notes:     typeof p.notes === "string" ? p.notes : "",
    labels:    Array.isArray(p.labels) ? p.labels.filter(function(l){ return typeof l==="string" && l.length>0; }) : [],
    sectionId: typeof p.sectionId === "string" ? p.sectionId : null,
  };
}

function sanitizeTasks(input) {
  if (!Array.isArray(input)) return [];
  const validStatuses = new Set(["progress", "waiting", null]);
  return input
    .filter(function(i) { return i && typeof i.text === "string"; })
    .map(function(i) {
      return {
        id:       typeof i.id === "string" ? i.id : generateId(),
        text:     i.text.trim().slice(0, 120),
        comment:  typeof i.comment === "string" ? i.comment.trim().slice(0, 300) : "",
        done:     Boolean(i.done),
        status:   validStatuses.has(i.status) ? i.status : null,
        priority: ["high","medium","low"].includes(i.priority) ? i.priority : null,
        labels:   Array.isArray(i.labels) ? i.labels.filter(function(l){ return typeof l==="string" && l.length>0; }).slice(0,10) : [],
        dueDate:  typeof i.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) ? i.dueDate : null,
        subtasks: sanitizeSubtasks(i.subtasks),
      };
    })
    .filter(function(i) { return i.text.length > 0; });
}

function sanitizeSubtasks(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter(function(s) { return s && typeof s.text === "string"; })
    .map(function(s) {
      return {
        id:   typeof s.id === "string" ? s.id : generateId(),
        text: s.text.trim().slice(0, 120),
        done: Boolean(s.done),
      };
    })
    .filter(function(s) { return s.text.length > 0; });
}

function updateSaveStatus(lastSavedAt) {
  if (!lastSavedAt) { saveStatus.textContent = "Sin cambios recientes"; return; }
  const date = new Date(lastSavedAt);
  if (Number.isNaN(date.getTime())) { saveStatus.textContent = "Guardado automático activo"; return; }
  saveStatus.textContent = "Último guardado: " + date.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function generateId() {
  return (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function initializeTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
    themeToggle.setAttribute("aria-label", "Cambiar tema (actual: " + (theme === "dark" ? "oscuro" : "claro") + ")");
  }
}

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

function _syncOnAuthChange(user) {
  // Update legacy hidden elements (backward compat)
  if (syncUserAvatar) syncUserAvatar.textContent = user ? (user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "?")) : "A";
  if (syncUserName)   syncUserName.textContent   = user ? (user.displayName || user.email || "") : "";
  // Update profile menu
  _updateProfileMenu(user);
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
  if (!cloudData || !Array.isArray(cloudData.projects)) {
    // Sin datos en la nube: subir datos locales
    if (projects.length > 0) AnsoSync.scheduleSave(projects, sections);
    return;
  }
  // Comparar timestamps: tomar el más reciente
  var localMeta = loadMetadata();
  var localTime = localMeta.lastSavedAt ? new Date(localMeta.lastSavedAt).getTime() : 0;
  var cloudTime = cloudData.updatedAt ? cloudData.updatedAt.toMillis() : 0;
  if (cloudTime > localTime) {
    _syncApplyRemote(cloudData.projects, cloudData.sections || []);
  } else {
    AnsoSync.scheduleSave(projects, sections);
  }
}

function _syncOnRemoteChange(remoteProjects, remoteSections) {
  _syncApplyRemote(remoteProjects, remoteSections || []);
}

function _syncApplyRemote(remoteProjects, remoteSections) {
  try {
    projects = remoteProjects.map(sanitizeProject);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    if (Array.isArray(remoteSections)) {
      sections = remoteSections;
      localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
    }
    renderSidebar();
    var proj = getActiveProject();
    if (proj) {
      renderTasks();
      renderLabelFilterBar();
      if (notesSidePanel && notesSidePanel.classList.contains("notes-side-open")) {
        notesSideEditor.innerHTML = proj.notes || "";
      }
    }
    updateSaveStatus(new Date().toISOString());
  } catch (e) {
    console.warn("AnsoSync: error aplicando cambios remotos:", e);
  }
}
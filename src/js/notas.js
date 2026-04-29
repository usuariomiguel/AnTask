const PROJECTS_KEY   = "anso-projects";
const NOTES_META_KEY = "anso-notes-meta";
const THEME_KEY      = "mis-tareas-theme";

const ACTIVE_KEY = "anso-active-project";

const LEGACY_PROJECTS_KEY = "ans0-projects";
const LEGACY_NOTES_META_KEY = "ans0-notes-meta";
const LEGACY_ACTIVE_KEY = "ans0-active-project";

function migrateStorageIfNeeded() {
  try {
    const hasNew = localStorage.getItem(PROJECTS_KEY) != null;
    const hasOld = localStorage.getItem(LEGACY_PROJECTS_KEY) != null;
    if (hasNew || !hasOld) return;

    localStorage.setItem(PROJECTS_KEY, localStorage.getItem(LEGACY_PROJECTS_KEY));

    const legacyActive = localStorage.getItem(LEGACY_ACTIVE_KEY);
    if (legacyActive) localStorage.setItem(ACTIVE_KEY, legacyActive);

    const legacyNotesMeta = localStorage.getItem(LEGACY_NOTES_META_KEY);
    if (legacyNotesMeta) localStorage.setItem(NOTES_META_KEY, legacyNotesMeta);
  } catch (_) {
    // ignore
  }
}

const editor            = document.getElementById("daily-notes");
const notesStatus       = document.getElementById("notes-status");
const themeToggle       = document.getElementById("theme-toggle");
const fmtButtons        = document.querySelectorAll(".fmt-btn");
const projectListEl     = document.getElementById("project-list");
const newProjectBtn     = document.getElementById("new-project-btn");
const emptyState        = document.getElementById("empty-state");
const notesPanel        = document.getElementById("notes-panel");
const projectTitleEl    = document.getElementById("project-title");
const exportWorkspaceBtn= document.getElementById("export-workspace-btn");

// Leer proyecto de la URL
const urlParams       = new URLSearchParams(window.location.search);
migrateStorageIfNeeded();

let   activeProjectId = urlParams.get("project") || localStorage.getItem(ACTIVE_KEY) || null;

let projects = loadProjects();

// ── Arranque ──────────────────────────────────────────────────
var _splashStart = performance.now();
initializeTheme();
try { renderSidebar(); } catch(e) { console.error("renderSidebar error:", e); }
try { activateProject(activeProjectId); } catch(e) { console.error("activateProject error:", e); }

// ── Ocultar pantalla de carga ──────────────────────────────────
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

// Inicializar auth para que scheduleSave tenga usuario
if (window.AnsoSync) AnsoSync.init(null, null, null);

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE MODALES (compartido con script.js)
// ═══════════════════════════════════════════════════════════════

function createModalBase() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";
  overlay.appendChild(box);

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

    setTimeout(function() { input.focus(); input.select(); }, 50);
  });
}

// ── Tema ──────────────────────────────────────────────────────
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

themeToggle.addEventListener("click", function() {
  toggleThemeWithTransition(themeToggle);
});

// ── Exportar workspace completo ────────────────────────────────────
if (exportWorkspaceBtn) {
  exportWorkspaceBtn.addEventListener("click", function() {
    if (projects.length === 0) {
      alert("No hay proyectos que exportar.");
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
}

// ── Nuevo proyecto desde sidebar ──────────────────────────────
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

// ── Guardado automático ───────────────────────────────────────
editor.addEventListener("input", saveNotes);

// ── Atajos de teclado personalizados ─────────────────────────
editor.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
    e.preventDefault();
    document.execCommand("strikeThrough", false, null);
    updateActiveButtons();
    saveNotes();
  }
});

// ── Barra de formato ──────────────────────────────────────────
fmtButtons.forEach(function(btn) {
  btn.addEventListener("mousedown", function(e) {
    e.preventDefault();
    document.execCommand(btn.dataset.cmd, false, null);
    editor.focus();
    updateActiveButtons();
    saveNotes();
  });
});

editor.addEventListener("keyup", updateActiveButtons);
editor.addEventListener("mouseup", updateActiveButtons);
editor.addEventListener("selectionchange", updateActiveButtons);

// ── Storage (otras pestañas) ──────────────────────────────────
window.addEventListener("storage", function(event) {
  if (event.key === PROJECTS_KEY) {
    projects = loadProjects();
    renderSidebar();
    const project = getActiveProject();
    if (project) {
      editor.innerHTML = project.notes || "";
    }
  }
  if (event.key === THEME_KEY) initializeTheme();
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════

function activateProject(id) {
  activeProjectId = id;
  if (id) localStorage.setItem(ACTIVE_KEY, id);

  const project = getActiveProject();
  const hasProject = Boolean(project);

  emptyState.hidden = hasProject;
  notesPanel.hidden = !hasProject;

  if (!hasProject) { renderSidebar(); return; }

  projectTitleEl.textContent = project.name;

  editor.innerHTML = project.notes || "";

  const url = new URL(window.location.href);
  url.searchParams.set("project", project.id);
  window.history.replaceState(null, "", url.toString());

  updateStatus(loadMetadata().lastSavedAt);
  renderSidebar();
}

function renderSidebar() {
  projectListEl.innerHTML = "";
  if (projects.length === 0) {
    const li = document.createElement("li");
    li.className = "project-empty";
    li.textContent = "Sin proyectos aún";
    projectListEl.appendChild(li);
    return;
  }
  projects.forEach(function(project) {
    const li = document.createElement("li");
    li.className = "project-item";
    if (project.id === activeProjectId) li.classList.add("active");

    const nameSpan = document.createElement("span");
    nameSpan.className = "project-item-name";
    nameSpan.textContent = project.name;

    const countSpan = document.createElement("span");
    countSpan.className = "project-item-count";
    const done  = (project.tasks || []).filter(function(t) { return t.done; }).length;
    const total = (project.tasks || []).length;
    countSpan.textContent = done + "/" + total;

    li.appendChild(nameSpan);
    li.appendChild(countSpan);
    li.addEventListener("click", function() { activateProject(project.id); });
    projectListEl.appendChild(li);
  });
}

function saveNotes() {
  const project = getActiveProject();
  if (!project) return;
  project.notes = editor.innerHTML;
  saveProjects();
  const lastSavedAt = new Date().toISOString();
  localStorage.setItem(NOTES_META_KEY, JSON.stringify({ lastSavedAt: lastSavedAt }));
  updateStatus(lastSavedAt);
}

function updateActiveButtons() {
  fmtButtons.forEach(function(btn) {
    const active = document.queryCommandState(btn.dataset.cmd);
    btn.classList.toggle("fmt-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function getActiveProject() {
  return projects.find(function(p) { return p.id === activeProjectId; }) || null;
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch(e) { return []; }
}

function saveProjects() {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  if (window.AnsoSync) AnsoSync.scheduleSave(projects);
}

function loadMetadata() {
  try {
    const raw = localStorage.getItem(NOTES_META_KEY);
    return raw ? JSON.parse(raw) : { lastSavedAt: null };
  } catch(e) { return { lastSavedAt: null }; }
}

function updateStatus(lastSavedAt) {
  if (!lastSavedAt) { notesStatus.textContent = "Sin cambios recientes"; return; }
  const date = new Date(lastSavedAt);
  if (Number.isNaN(date.getTime())) { notesStatus.textContent = "Sin cambios recientes"; return; }
  notesStatus.textContent = "Último guardado: " + date.toLocaleString("es-ES");
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
  const emoji = theme === "dark" ? "🌙" : "☀️";
  const label = "Cambiar tema (actual: " + (theme === "dark" ? "oscuro" : "claro") + ")";
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = emoji;
  themeToggle.setAttribute("aria-label", label);
  const tmm = document.getElementById("theme-toggle-mobile");
  if (tmm) { tmm.textContent = emoji; tmm.setAttribute("aria-label", label); }
}
// ── Mobile: sidebar toggle ────────────────────────────────────
const mobileSidebarBtn  = document.getElementById("mobile-sidebar-btn");
const sidebarEl         = document.getElementById("sidebar");
const sidebarBackdrop   = document.getElementById("sidebar-backdrop");
const themeToggleMobile = document.getElementById("theme-toggle-mobile");

function openSidebar() {
  sidebarEl.classList.add("sidebar-open");
  sidebarBackdrop.classList.add("active");
}

function closeSidebar() {
  sidebarEl.classList.remove("sidebar-open");
  sidebarBackdrop.classList.remove("active");
}

if (mobileSidebarBtn) {
  mobileSidebarBtn.addEventListener("click", function() {
    sidebarEl.classList.contains("sidebar-open") ? closeSidebar() : openSidebar();
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener("click", closeSidebar);
}

// Cerrar sidebar al seleccionar proyecto en móvil
projectListEl.addEventListener("click", function(e) {
  if (e.target.closest(".project-item")) closeSidebar();
});

// Mobile theme toggle
if (themeToggleMobile) {
  themeToggleMobile.addEventListener("click", function() {
    toggleThemeWithTransition(themeToggleMobile);
  });
}
// ── SIDEBAR COLAPSAR/EXPANDIR (solo escritorio) ─────────────────
(function () {
  const COLLAPSED_KEY    = "anso-sidebar-collapsed";
  const sidebarEl        = document.getElementById("sidebar");
  const mainPanel        = document.querySelector(".main-panel");
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

  if (window.innerWidth > 768) {
    if (localStorage.getItem(COLLAPSED_KEY) === "1") setSidebarCollapsed(true);
  }
})();
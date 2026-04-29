// ═══════════════════════════════════════════════════════════════
// SECCIONES DE PROYECTOS
// ═══════════════════════════════════════════════════════════════

var newSectionBtn = document.getElementById("new-section-btn");
if (newSectionBtn) {
  newSectionBtn.addEventListener("click", async function() {
    var name = await modalPrompt("// Nombre de la sección", "", "ej: Trabajo, Personal...");
    if (!name) return;
    sections.push({ id: generateId(), name: name.trim().slice(0, 60), collapsed: false });
    saveSections();
    renderSidebar();
  });
}

function showSectionMenu(section, anchor) {
  closeCtxMenu();
  var menu = document.createElement("ul");
  menu.className = "ctx-menu";

  var renameItem = document.createElement("li");
  renameItem.className = "ctx-item";
  renameItem.textContent = "Renombrar sección";
  renameItem.addEventListener("click", async function() {
    closeCtxMenu();
    var name = await modalPrompt("// Renombrar sección", section.name, section.name);
    if (!name || !name.trim()) return;
    section.name = name.trim().slice(0, 60);
    saveSections();
    renderSidebar();
  });
  menu.appendChild(renameItem);

  var deleteItem = document.createElement("li");
  deleteItem.className = "ctx-item ctx-item-danger";
  deleteItem.textContent = "Eliminar sección";
  deleteItem.addEventListener("click", async function() {
    closeCtxMenu();
    var ok = await modalConfirm(
      "¿Eliminar la sección <strong>" + section.name + "</strong>? Los proyectos quedarán sin agrupar.",
      "Eliminar"
    );
    if (!ok) return;
    projects.forEach(function(p) { if (p.sectionId === section.id) p.sectionId = null; });
    sections = sections.filter(function(s) { return s.id !== section.id; });
    saveSections();
    saveProjects();
    renderSidebar();
  });
  menu.appendChild(deleteItem);

  positionCtxMenu(menu, anchor);
}

function showProjectMenu(project, anchor) {
  closeCtxMenu();
  var menu = document.createElement("ul");
  menu.className = "ctx-menu";

  if (sections.length > 0 || project.sectionId) {
    var header = document.createElement("li");
    header.className = "ctx-header";
    header.textContent = "Mover a sección";
    menu.appendChild(header);

    if (project.sectionId) {
      var noSection = document.createElement("li");
      noSection.className = "ctx-item";
      noSection.textContent = "✕ Sin sección";
      noSection.addEventListener("click", function() {
        project.sectionId = null;
        saveProjects();
        renderSidebar();
        closeCtxMenu();
      });
      menu.appendChild(noSection);
    }

    sections.forEach(function(s) {
      if (s.id === project.sectionId) return;
      var item = document.createElement("li");
      item.className = "ctx-item";
      item.textContent = "→ " + s.name;
      item.addEventListener("click", function() {
        project.sectionId = s.id;
        if (s.collapsed) { s.collapsed = false; saveSections(); }
        saveProjects();
        renderSidebar();
        closeCtxMenu();
      });
      menu.appendChild(item);
    });

    var sep = document.createElement("li");
    sep.className = "ctx-sep";
    menu.appendChild(sep);
  }

  var renameItem = document.createElement("li");
  renameItem.className = "ctx-item";
  renameItem.textContent = "Renombrar proyecto";
  renameItem.addEventListener("click", async function() {
    closeCtxMenu();
    var name = await modalPrompt("// Cambiar nombre del proyecto", project.name, project.name);
    if (!name || !name.trim() || name.trim() === project.name) return;
    project.name = name.trim().slice(0, 60);
    saveProjects();
    renderSidebar();
    if (project.id === activeProjectId) activateProject(project.id);
  });
  menu.appendChild(renameItem);

  positionCtxMenu(menu, anchor);
}

function positionCtxMenu(menu, anchor) {
  document.body.appendChild(menu);
  var rect = anchor.getBoundingClientRect();
  var menuH = menu.offsetHeight || 180;
  var spaceBelow = window.innerHeight - rect.bottom;
  var top = spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4;
  menu.style.left     = Math.min(rect.left, window.innerWidth - 180) + "px";
  menu.style.top      = top + "px";
  menu.style.position = "fixed";
  menu.style.zIndex   = "9000";

  setTimeout(function() {
    document.addEventListener("click", closeCtxMenu, { once: true });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { closeCtxMenu(); document.removeEventListener("keydown", esc); }
    });
  }, 0);
}

function closeCtxMenu() {
  var existing = document.querySelector(".ctx-menu");
  if (existing) existing.remove();
}

// ═══════════════════════════════════════════════════════════════
// MENÚ DE PERFIL
// ═══════════════════════════════════════════════════════════════

(function initProfileMenu() {
  var profileBtn      = document.getElementById("profile-btn");
  var profileDropdown = document.getElementById("profile-dropdown");
  var pfExportBtn     = document.getElementById("pf-export-btn");
  var pfImportInput   = document.getElementById("pf-import-input");
  var pfThemeBtn      = document.getElementById("pf-theme-btn");
  var pfThemeIco      = document.getElementById("pf-theme-ico");
  var pfSigninBtn     = document.getElementById("pf-signin-btn");
  var pfSyncSep       = document.getElementById("pf-sync-sep");

  if (!profileBtn || !profileDropdown) return;

  if (window.AnsoSync) {
    if (pfSyncSep)   pfSyncSep.hidden   = false;
    if (pfSigninBtn) pfSigninBtn.hidden = false;
  }

  function syncThemeIcon() {
    if (pfThemeIco) pfThemeIco.textContent = document.documentElement.dataset.theme === "dark" ? "🌙" : "☀️";
  }

  profileBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    var open = !profileDropdown.hidden;
    profileDropdown.hidden = open;
    profileBtn.setAttribute("aria-expanded", String(!open));
    if (!open) syncThemeIcon();
  });

  document.addEventListener("click", function(e) {
    if (!profileDropdown.hidden) {
      var wrap = document.getElementById("profile-wrap");
      if (wrap && !wrap.contains(e.target)) {
        profileDropdown.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
      }
    }
  });

  if (pfExportBtn) {
    pfExportBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      var btn = document.getElementById("export-btn");
      if (btn) btn.click();
    });
  }

  if (pfImportInput) {
    pfImportInput.addEventListener("change", function() {
      var file = pfImportInput.files && pfImportInput.files[0];
      if (!file) return;
      profileDropdown.hidden = true;
      try {
        var dt = new DataTransfer();
        dt.items.add(file);
        var realInput = document.getElementById("import-file");
        if (realInput) {
          realInput.files = dt.files;
          realInput.dispatchEvent(new Event("change"));
        }
      } catch (_) {
        var realInput2 = document.getElementById("import-file");
        if (realInput2) realInput2.dispatchEvent(new Event("change"));
      }
      pfImportInput.value = "";
    });
  }

  if (pfThemeBtn) {
    pfThemeBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      if (window.toggleThemeWithTransition) {
        toggleThemeWithTransition(pfThemeBtn);
      } else {
        var cur  = document.documentElement.dataset.theme;
        var next = cur === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem(THEME_KEY, next);
      }
    });
  }

  if (pfSigninBtn) {
    pfSigninBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      if (window.AnsoSync) AnsoSync.signIn().catch(function(e) {
        if (e.code !== "auth/popup-closed-by-user") console.warn(e);
      });
    });
  }
})();

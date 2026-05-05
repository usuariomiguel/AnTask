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
    if (!pfThemeIco) return;
    var isDark = document.documentElement.dataset.theme === "dark";
    var ico = pfThemeIco.querySelector("i[data-lucide]");
    if (ico) {
      ico.setAttribute("data-lucide", isDark ? "moon" : "sun");
      if (window.lucide) lucide.createIcons({ nodes: [pfThemeIco] });
    }
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
      } catch (_) {}
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

  var pfSignoutBtn = document.getElementById("pf-signout-btn");
  if (pfSignoutBtn) {
    pfSignoutBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      if (window.AnsoSync) AnsoSync.signOut();
    });
  }

  // ─── Notificaciones ──────────────────────────────────────────
  var pfNotifBtn     = document.getElementById("pf-notif-btn");
  var pfNotifLabel   = document.getElementById("pf-notif-label");
  var pfNotifPill    = document.getElementById("pf-notif-pill");
  var pfNotifIco     = document.getElementById("pf-notif-ico");
  var pfNotifOptions = document.getElementById("pf-notif-options");
  var pfNotifTime    = document.getElementById("pf-notif-time");
  var pfNotifTest    = document.getElementById("pf-notif-test");

  function refreshNotifUI() {
    if (!window.AnsoNotif || !pfNotifBtn) return;
    if (!AnsoNotif.isSupported()) {
      pfNotifBtn.disabled = true;
      pfNotifLabel.textContent = "Avisos no soportados";
      if (pfNotifPill) pfNotifPill.hidden = true;
      if (pfNotifOptions) pfNotifOptions.hidden = true;
      return;
    }
    var enabled = AnsoNotif.isEnabled();
    var perm    = AnsoNotif.permission();

    if (enabled) {
      pfNotifLabel.textContent = "Avisos activados";
      pfNotifPill.textContent  = "ON";
      pfNotifPill.classList.add("on");
      if (pfNotifIco) {
        pfNotifIco.innerHTML = '<i data-lucide="bell-ring"></i>';
        if (window.lucide) lucide.createIcons({ nodes: [pfNotifIco] });
      }
      if (pfNotifOptions) pfNotifOptions.hidden = false;
      if (pfNotifTime) pfNotifTime.value = AnsoNotif.getTime();
    } else {
      pfNotifLabel.textContent = perm === "denied" ? "Avisos bloqueados" : "Activar avisos";
      pfNotifPill.textContent  = "OFF";
      pfNotifPill.classList.remove("on");
      if (pfNotifIco) {
        pfNotifIco.innerHTML = '<i data-lucide="bell"></i>';
        if (window.lucide) lucide.createIcons({ nodes: [pfNotifIco] });
      }
      if (pfNotifOptions) pfNotifOptions.hidden = true;
    }
  }

  if (pfNotifBtn && window.AnsoNotif) {
    refreshNotifUI();
    pfNotifBtn.addEventListener("click", function() {
      if (!AnsoNotif.isSupported()) return;
      if (AnsoNotif.isEnabled()) {
        AnsoNotif.disable();
        refreshNotifUI();
      } else {
        if (AnsoNotif.permission() === "denied") {
          alert("Las notificaciones están bloqueadas en este navegador. Habilítalas desde los ajustes del sitio para poder activarlas aquí.");
          return;
        }
        AnsoNotif.requestEnable().then(function(ok) {
          refreshNotifUI();
          if (!ok && AnsoNotif.permission() === "denied") {
            alert("Permiso denegado. No se podrán mostrar avisos.");
          }
        });
      }
    });
  }

  if (pfNotifTime && window.AnsoNotif) {
    pfNotifTime.addEventListener("change", function() {
      AnsoNotif.setTime(pfNotifTime.value);
    });
  }

  if (pfNotifTest && window.AnsoNotif) {
    pfNotifTest.addEventListener("click", function() {
      if (!AnsoNotif.fireTest()) {
        alert("Activa primero los avisos para poder probarlos.");
      }
    });
  }

  // Inicializar el módulo de notificaciones
  if (window.AnsoNotif) AnsoNotif.init();
})();

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
})();

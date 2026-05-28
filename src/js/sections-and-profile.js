// ═══════════════════════════════════════════════════════════════
// MENÚ DE PERFIL
// ═══════════════════════════════════════════════════════════════

import { t } from "./i18n/index.js";

(function initProfileMenu() {
  // Aliases de globales expuestos por otros módulos
  var AnsoNotif                  = window.AnsoNotif                  || null;
  var modalAlert                 = window.modalAlert                 || null;
  var toggleThemeWithTransition  = window.toggleThemeWithTransition  || null;
  var THEME_KEY                  = window.THEME_KEY                  || "mis-tareas-theme";

  var profileBtn      = document.getElementById("profile-btn");
  var profileDropdown = document.getElementById("profile-dropdown");
  var pfExportBtn     = document.getElementById("pf-export-btn");
  var pfImportInput   = document.getElementById("pf-import-input");
  var pfThemeBtn      = document.getElementById("pf-theme-btn");
  var pfThemeIco      = document.getElementById("pf-theme-ico");
  var pfSigninBtn     = document.getElementById("pf-signin-btn");
  var pfSyncSep       = document.getElementById("pf-sync-sep");

  if (!profileBtn || !profileDropdown) return;

  // La visibilidad del botón sync la gestiona _updateSyncUI() en script.js
  // cuando Firebase dispara onAuthStateChanged (carga diferida).

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

  var shortcutsItem = document.getElementById("shortcuts-btn");
  if (shortcutsItem) {
    shortcutsItem.addEventListener("click", function() {
      profileDropdown.hidden = true;
      profileBtn.setAttribute("aria-expanded", "false");
    });
  }

  var tourBtn = document.getElementById("tour-btn");
  if (tourBtn) {
    tourBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      profileBtn.setAttribute("aria-expanded", "false");
      if (typeof window.showOnboardingAgain === "function") window.showOnboardingAgain();
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
      if (!window.AnsoSync) {
        if (window.modalAlert) modalAlert("La sincronización aún se está cargando. Espera un momento e inténtalo de nuevo.", "info");
        return;
      }
      AnsoSync.signIn().catch(function(e) {
        if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
        var msg = e.code === "auth/popup-blocked"
          ? "El navegador ha bloqueado la ventana emergente. Permite popups para este sitio e inténtalo de nuevo."
          : e.code === "auth/unauthorized-domain"
          ? "Este dominio no está autorizado en Firebase. Añádelo en Firebase Console → Authentication → Dominios autorizados."
          : "Error al iniciar sesión: " + (e.message || e.code);
        console.error("AnsoSync signIn error:", e);
        if (window.modalAlert) modalAlert(msg, "error");
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
  var pfNotifBtn       = document.getElementById("pf-notif-btn");
  var pfNotifLabel     = document.getElementById("pf-notif-label");
  var pfNotifPill      = document.getElementById("pf-notif-pill");
  var pfNotifIco       = document.getElementById("pf-notif-ico");
  var pfNotifOptions   = document.getElementById("pf-notif-options");
  var pfNotifTimesList = document.getElementById("pf-notif-times-list");
  var pfNotifNewTime   = document.getElementById("pf-notif-new-time");
  var pfNotifAddBtn    = document.getElementById("pf-notif-add");
  var pfNotifTest      = document.getElementById("pf-notif-test");

  function renderNotifTimes() {
    if (!pfNotifTimesList || !window.AnsoNotif) return;
    var times = AnsoNotif.getTimes();
    pfNotifTimesList.innerHTML = "";
    times.forEach(function(timeStr) {
      var chip = document.createElement("span");
      chip.className = "profile-notif-time-chip";
      chip.innerHTML = '<span class="profile-notif-time-text">' + timeStr + '</span>' +
        '<button type="button" class="profile-notif-time-del" aria-label="' + t("notif.remove_time") + '">' +
        '<i data-lucide="x"></i></button>';
      var delBtn = chip.querySelector(".profile-notif-time-del");
      delBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        if (AnsoNotif.getTimes().length <= 1) {
          if (window.modalAlert) modalAlert(t("notif.error_min_time"), "info");
          return;
        }
        AnsoNotif.removeTime(timeStr);
        renderNotifTimes();
      });
      pfNotifTimesList.appendChild(chip);
    });
    if (window.lucide) lucide.createIcons({ nodes: [pfNotifTimesList] });
  }

  function refreshNotifUI() {
    if (!window.AnsoNotif || !pfNotifBtn) return;
    if (!AnsoNotif.isSupported()) {
      pfNotifBtn.disabled = true;
      pfNotifLabel.textContent = t("notif.unsupported");
      if (pfNotifPill) pfNotifPill.hidden = true;
      if (pfNotifOptions) pfNotifOptions.hidden = true;
      return;
    }
    var enabled = AnsoNotif.isEnabled();
    var perm    = AnsoNotif.permission();

    if (enabled) {
      pfNotifLabel.textContent = t("notif.enabled");
      pfNotifPill.textContent  = "ON";
      pfNotifPill.classList.add("on");
      if (pfNotifIco) {
        pfNotifIco.innerHTML = '<i data-lucide="bell-ring"></i>';
        if (window.lucide) lucide.createIcons({ nodes: [pfNotifIco] });
      }
      if (pfNotifOptions) pfNotifOptions.hidden = false;
      renderNotifTimes();
    } else {
      pfNotifLabel.textContent = perm === "denied" ? t("notif.blocked") : t("notif.enable");
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
          if (window.modalAlert) modalAlert(t("notif.error_blocked"), "error");
          return;
        }
        AnsoNotif.requestEnable().then(function(ok) {
          refreshNotifUI();
          if (!ok && AnsoNotif.permission() === "denied") {
            if (window.modalAlert) modalAlert(t("notif.error_denied"), "error");
          }
        });
      }
    });
  }

  if (pfNotifAddBtn && pfNotifNewTime && window.AnsoNotif) {
    pfNotifAddBtn.addEventListener("click", function() {
      var v = pfNotifNewTime.value;
      if (!v) return;
      var ok = AnsoNotif.addTime(v);
      if (!ok) {
        // ya existe — silencioso, solo refrescar
      }
      renderNotifTimes();
    });
  }

  if (pfNotifTest && window.AnsoNotif) {
    pfNotifTest.addEventListener("click", function() {
      if (!AnsoNotif.fireTest()) {
        if (window.modalAlert) modalAlert(t("notif.error_not_enabled"), "info");
      }
    });
  }

  // Inicializar el módulo de notificaciones
  if (window.AnsoNotif) AnsoNotif.init();
})();

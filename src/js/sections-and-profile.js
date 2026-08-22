// ═══════════════════════════════════════════════════════════════
// MENÚ DE PERFIL
// ═══════════════════════════════════════════════════════════════

import { t } from "./i18n/index.js";
import { loadSync } from "./sync-loader.js";

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
  var pfSigninBtn     = document.getElementById("pf-signin-btn");
  var pfSyncSep       = document.getElementById("pf-sync-sep");

  if (!profileBtn || !profileDropdown) return;

  // La visibilidad del botón sync la gestiona _updateSyncUI() en script.js
  // cuando Firebase dispara onAuthStateChanged (carga diferida).

  profileBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    var open = !profileDropdown.hidden;
    profileDropdown.hidden = open;
    profileBtn.setAttribute("aria-expanded", String(!open));
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

  // ─── Modal de Ajustes ──────────────────────────────────────────
  var settingsOverlay  = document.getElementById("settings-overlay");
  var settingsCloseBtn = document.getElementById("settings-close-btn");
  var pfSettingsBtn    = document.getElementById("pf-settings-btn");

  function syncThemeSeg() {
    var seg = document.getElementById("settings-theme-seg");
    if (!seg) return;
    var cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    seg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.themeValue === cur);
    });
  }

  function syncModeSeg() {
    var seg = document.getElementById("settings-mode-seg");
    if (!seg) return;
    var cur = document.documentElement.dataset.mode === "full" ? "full" : "simple";
    seg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.modeValue === cur);
    });
  }

  function syncRowStyleSeg() {
    var seg = document.getElementById("settings-rowstyle-seg");
    var taskList = document.getElementById("task-list");
    if (!seg || !taskList) return;
    var cur = taskList.dataset.rowStyle === "limpio" ? "limpio" : "tarjetas";
    seg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.rowstyleValue === cur);
    });
  }

  function openSettingsModal() {
    if (!settingsOverlay) return;
    syncThemeSeg();
    syncModeSeg();
    syncRowStyleSeg();
    syncAccentDots();
    // En móvil no hay pestañas de navegación (todo va en una sola pantalla
    // con tarjetas, al estilo del handoff): las secciones se muestran todas
    // a la vez en vez de una por pestaña activa.
    if (window.matchMedia("(max-width: 768px)").matches) {
      settingsPanels.forEach(function(p) { p.hidden = false; });
    }
    settingsOverlay.hidden = false;
    requestAnimationFrame(function() { settingsOverlay.classList.add("modal-visible"); });
  }
  function closeSettingsModal() {
    if (!settingsOverlay || settingsOverlay.hidden) return;
    settingsOverlay.classList.remove("modal-visible");
    // `transitionend` no llega si no hay transición (o el navegador la
    // salta) y el overlay se quedaba con `hidden=false` para siempre,
    // bloqueando toda la interfaz por debajo. Plazo de respaldo, igual
    // que closeModal() en ui/modal.js.
    var hidden = false;
    function hide() {
      if (hidden) return;
      hidden = true;
      settingsOverlay.hidden = true;
    }
    settingsOverlay.addEventListener("transitionend", hide, { once: true });
    setTimeout(hide, 350);
  }
  window.openSettingsModal = openSettingsModal;
  window.closeSettingsModal = closeSettingsModal;

  if (pfSettingsBtn) {
    pfSettingsBtn.addEventListener("click", function() {
      profileDropdown.hidden = true;
      profileBtn.setAttribute("aria-expanded", "false");
      openSettingsModal();
    });
  }
  if (settingsCloseBtn) settingsCloseBtn.addEventListener("click", closeSettingsModal);
  if (settingsOverlay) {
    settingsOverlay.addEventListener("mousedown", function(e) {
      if (e.target === settingsOverlay) closeSettingsModal();
    });
  }
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && settingsOverlay && !settingsOverlay.hidden) closeSettingsModal();
  });

  // ─── Navegación entre secciones del modal de Ajustes ──────────
  var settingsNavBtns = document.querySelectorAll(".settings-nav-item");
  var settingsPanels  = document.querySelectorAll(".settings-section-panel");
  settingsNavBtns.forEach(function(btn) {
    btn.addEventListener("click", function() {
      var target = btn.dataset.settingsPanel;
      settingsNavBtns.forEach(function(b) { b.classList.toggle("active", b === btn); });
      settingsPanels.forEach(function(p) { p.hidden = (p.dataset.settingsPanel !== target); });
    });
  });

  var shortcutsItem = document.getElementById("shortcuts-btn");
  if (shortcutsItem) {
    shortcutsItem.addEventListener("click", function() {
      profileDropdown.hidden = true;
      profileBtn.setAttribute("aria-expanded", "false");
    });
  }

  var settingsShortcutsLink = document.getElementById("settings-shortcuts-link");
  if (settingsShortcutsLink) {
    settingsShortcutsLink.addEventListener("click", function() {
      if (typeof window.showShortcutsHelp === "function") window.showShortcutsHelp();
    });
  }

  var settingsEditProfileBtn = document.getElementById("settings-edit-profile-btn");
  if (settingsEditProfileBtn) {
    settingsEditProfileBtn.addEventListener("click", function() {
      if (typeof window.showProfileModal === "function") window.showProfileModal();
    });
  }

  // ─── Tema (segmentado real: Claro/Oscuro) ─────────────────────
  var themeSeg = document.getElementById("settings-theme-seg");
  if (themeSeg) {
    themeSeg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var next = btn.dataset.themeValue;
        if (document.documentElement.dataset.theme === next) return;
        if (window.toggleThemeWithTransition) {
          // El callback del View Transition es asíncrono: syncThemeSeg()
          // debe correr cuando el tema YA está aplicado, no justo después
          // de disparar el cambio (si no, resincroniza con el valor viejo
          // y el segmentado queda marcando la opción contraria).
          window.toggleThemeWithTransition(btn, syncThemeSeg);
        } else {
          document.documentElement.dataset.theme = next;
          localStorage.setItem(THEME_KEY, next);
          syncThemeSeg();
        }
      });
    });
    syncThemeSeg();
  }

  // ─── Modo simple/completo ──────────────────────────────────────
  // El modo simple solo cambia algo en móvil (ver isSimpleMobile() en
  // ui/mode.js) — en escritorio la app se ve y comporta siempre igual,
  // por eso el interruptor vive aquí y no hace falta duplicarlo.
  var modeSeg = document.getElementById("settings-mode-seg");
  if (modeSeg) {
    modeSeg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var next = btn.dataset.modeValue;
        var cur  = document.documentElement.dataset.mode === "full" ? "full" : "simple";
        if (cur === next) return;
        if (window.setMode) window.setMode(next);
        // El modo simple afecta a muchas rutas de render (fila, nav,
        // captura...) que hoy se leen una sola vez al montar la UI —
        // recargar es lo único que garantiza que todo quede coherente.
        location.reload();
      });
    });
    syncModeSeg();
  }

  // ─── Estilo de fila (Limpio/Tarjetas) ───────────────────────────
  // El selector de escritorio (#row-style-btn) vive oculto en móvil (ver
  // .row-style-wrap en style.css) — aquí es el único sitio para tocarlo
  // ahí, y ahora también sirve en modo simple. Puramente visual: no hace
  // falta recargar, applyRowStyle() ya repinta al vuelo.
  var rowStyleSeg = document.getElementById("settings-rowstyle-seg");
  if (rowStyleSeg) {
    rowStyleSeg.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var next = btn.dataset.rowstyleValue;
        if (window.applyRowStyle) window.applyRowStyle(next);
        syncRowStyleSeg();
      });
    });
    syncRowStyleSeg();
  }

  // ─── Botón claro/oscuro de la barra de tareas (escritorio) ────
  var toolbarThemeBtn = document.getElementById("theme-toggle-btn");
  if (toolbarThemeBtn) {
    toolbarThemeBtn.addEventListener("click", function() {
      if (window.toggleThemeWithTransition) {
        window.toggleThemeWithTransition(toolbarThemeBtn, syncThemeSeg);
      } else {
        var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem(THEME_KEY, next);
        syncThemeSeg();
      }
    });
  }

  // ─── Controles de Apariencia/Tareas/Notificaciones que aún no
  // tienen función real (prioridad por defecto, resumen diario, semana
  // en lunes): solo reflejan la selección en la sesión actual, igual
  // que hace el propio prototipo v1 cuando no está conectado a un
  // ajuste real. ───────────────
  function wireInertSeg(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.querySelectorAll(".settings-seg-opt").forEach(function(btn) {
      btn.addEventListener("click", function() {
        el.querySelectorAll(".settings-seg-opt").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
    });
  }
  wireInertSeg("settings-priority-seg");

  function wireInertToggle(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", function() {
      var on = el.classList.toggle("on");
      el.setAttribute("aria-pressed", String(on));
    });
  }
  // "settings-digest-toggle" queda deshabilitado a propósito (v2, ver
  // el atributo `disabled` en index.html) — sin wireInertToggle.
  wireInertToggle("settings-monday-toggle");

  // ─── Color de acento (real: se aplica y persiste) ─────────────
  var accentRow = document.getElementById("settings-accent-row");
  function syncAccentDots() {
    if (!accentRow) return;
    var current = document.documentElement.dataset.accent || "oliva";
    accentRow.querySelectorAll(".settings-accent-dot").forEach(function(b) {
      var on = b.dataset.accent === current;
      b.classList.toggle("active", on);
      b.innerHTML = on ? '<i data-lucide="check"></i>' : "";
    });
    if (window.lucide) lucide.createIcons({ nodes: [accentRow] });
  }
  if (accentRow) {
    accentRow.querySelectorAll(".settings-accent-dot").forEach(function(btn) {
      btn.addEventListener("click", function() {
        if (typeof window.setAccent === "function") window.setAccent(btn.dataset.accent);
        syncAccentDots();
      });
    });
    syncAccentDots();
  }

  // ─── Cuenta / sincronización con Google ───────────────────────
  function doSignIn() {
    // El desplegable puede no existir (la pantalla «Perfil» de móvil llama
    // aquí directamente, sin pasar por él).
    if (profileDropdown) profileDropdown.hidden = true;
    // Quien no sincroniza todavía no ha descargado Firebase: este clic
    // es justo el momento de traerlo. `loadSync` recuerda la promesa,
    // así que pulsar dos veces no descarga dos veces.
    loadSync().then(function () {
      if (!window.AnsoSync) {
        if (window.modalAlert) modalAlert("La sincronización no está disponible ahora mismo. Inténtalo de nuevo en un momento.", "info");
        return;
      }
      return AnsoSync.signIn().catch(function(e) {
        if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
        var msg = e.code === "auth/popup-blocked"
          ? "El navegador ha bloqueado la ventana emergente. Permite popups para este sitio e inténtalo de nuevo."
          : e.code === "auth/unauthorized-domain"
          ? "Este dominio no está autorizado en Firebase. Añádelo en Firebase Console → Authentication → Dominios autorizados."
          : e.code === "auth/user-cancelled"
          ? "Google no ha completado el inicio de sesión. Si la app está instalada, ciérrala y ábrela de nuevo antes de reintentar."
          : "Error al iniciar sesión: " + (e.message || e.code);
        console.error("AnsoSync signIn error:", e);
        if (window.modalAlert) modalAlert(msg, "error");
        // El login ha fallado: repinta el menú de perfil con el usuario REAL
        // (probablemente null). Sin esto, si algo lo había dejado en un
        // estado "conectado" que no corresponde, se quedaba así hasta el
        // siguiente onAuthStateChanged — que con un login fallido puede no
        // llegar nunca, dejando una sincronización fantasma en pantalla.
        if (typeof window._updateProfileMenu === "function") {
          window._updateProfileMenu(window.AnsoSync?.getUser?.() ?? null);
        }
      });
    }).catch(function (e) {
      console.error("AnsoSync: no se pudo cargar el módulo de sincronización:", e);
      if (window.modalAlert) modalAlert("No se ha podido cargar la sincronización. Comprueba tu conexión e inténtalo de nuevo.", "error");
    });
  }
  function doSignOut() {
    if (profileDropdown) profileDropdown.hidden = true;
    if (window.AnsoSync) AnsoSync.signOut();
  }

  /* Expuestas para la pantalla «Perfil» de móvil. No se duplican allí:
     doSignIn carga el módulo de sincronización bajo demanda y distingue
     popup cerrado, popup bloqueado y dominio no autorizado. */
  window.antaskSignIn  = doSignIn;
  window.antaskSignOut = doSignOut;
  [pfSigninBtn, document.getElementById("settings-signin-btn")].forEach(function(btn) {
    if (btn) btn.addEventListener("click", doSignIn);
  });
  [
    document.getElementById("pf-signout-btn"),
    document.getElementById("settings-signout-btn"),
    document.getElementById("settings-signout-about-btn"),
  ].forEach(function(btn) {
    if (btn) btn.addEventListener("click", doSignOut);
  });

  // ─── Notificaciones ──────────────────────────────────────────
  var pfNotifBtn       = document.getElementById("pf-notif-btn");
  var pfNotifLabel     = document.getElementById("pf-notif-label");
  var pfNotifPill      = document.getElementById("pf-notif-pill");
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

    pfNotifBtn.classList.toggle("on", enabled);
    pfNotifBtn.setAttribute("aria-pressed", String(enabled));

    if (enabled) {
      pfNotifLabel.textContent = t("notif.enabled");
      if (pfNotifPill) { pfNotifPill.textContent = "ON"; pfNotifPill.classList.add("on"); }
      if (pfNotifOptions) pfNotifOptions.hidden = false;
      renderNotifTimes();
    } else {
      pfNotifLabel.textContent = perm === "denied" ? t("notif.blocked") : t("notif.enable");
      if (pfNotifPill) { pfNotifPill.textContent = "OFF"; pfNotifPill.classList.remove("on"); }
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

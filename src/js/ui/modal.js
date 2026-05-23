// ═══════════════════════════════════════════════════════════════
// SISTEMA DE MODALES
//
// Modales genéricos sin dependencias del estado de la app.
// Si necesitas un modal que conoce datos de la app (proyectos,
// notas…), úsalo desde script.js consumiendo estos primitives.
// ═══════════════════════════════════════════════════════════════

/**
 * Crea el overlay + box base de un modal y lo inserta en el DOM.
 * Devuelve { overlay, box } para que el llamador rellene el `box`.
 * El overlay cierra automáticamente al hacer clic fuera si se
 * asigna `overlay._cancel`.
 */
export function createModalBase() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";
  overlay.appendChild(box);

  overlay.addEventListener("mousedown", function (e) {
    if (e.target === overlay) overlay._cancel && overlay._cancel();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(function () { overlay.classList.add("modal-visible"); });
  return { overlay, box };
}

/**
 * Cierra y elimina del DOM un overlay creado con createModalBase.
 */
export function closeModal(overlay) {
  overlay.classList.remove("modal-visible");
  overlay.addEventListener("transitionend", function () {
    overlay.remove();
  }, { once: true });
}

/**
 * Modal de entrada de texto (reemplaza window.prompt).
 * @returns {Promise<string|null>} — texto o null si cancela
 */
export function modalPrompt(label, value, placeholder) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    box.innerHTML =
      '<div class="modal-icon"><i data-lucide="pencil-line"></i></div>' +
      '<p class="modal-label">' + label + '</p>' +
      '<input class="modal-input" type="text" maxlength="120" autocomplete="off" />' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Aceptar</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

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
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () { input.focus(); input.select(); }, 50);
  });
}

/**
 * Modal de confirmación (reemplaza window.confirm).
 * @returns {Promise<boolean>}
 */
export function modalConfirm(message, confirmLabel) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    box.innerHTML =
      '<div class="modal-icon modal-icon--danger"><i data-lucide="triangle-alert"></i></div>' +
      '<p class="modal-label">' + message + '</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-danger">' + (confirmLabel || "Eliminar") + '</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

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

    setTimeout(function () { confirm.focus(); }, 50);
  });
}

/**
 * Modal de alerta informativa (reemplaza window.alert).
 * @returns {Promise<void>}
 */
export function modalAlert(message, type) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();
    const icon = type === "error"
      ? '<i data-lucide="circle-x"></i>'
      : '<i data-lucide="info"></i>';
    const cls  = type === "error" ? "modal-label modal-label-error" : "modal-label";

    box.innerHTML =
      '<div class="modal-icon">' + icon + '</div>' +
      '<p class="' + cls + '">' + message + '</p>' +
      '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-confirm">Entendido</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    const btn = box.querySelector(".modal-btn-confirm");
    function doClose() { closeModal(overlay); resolve(); }

    overlay._cancel = doClose;
    btn.addEventListener("click", doClose);
    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        doClose(); document.removeEventListener("keydown", handler);
      }
    });

    setTimeout(function () { btn.focus(); }, 50);
  });
}

/**
 * Modal para seleccionar fecha límite.
 * @param {string|null} current — valor ISO actual (YYYY-MM-DD) o null
 * @returns {Promise<string|null|"clear"|undefined>}
 *   - string ISO → guarda esa fecha
 *   - "clear"    → quita la fecha
 *   - null       → guarda sin fecha
 *   - undefined  → cancela (no toques nada)
 */
export function modalDate(current) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    const now = new Date();
    const dow = now.getDay(); // 0=Dom … 6=Sáb

    function toDateStr(d) { return d.toISOString().slice(0, 10); }
    function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }

    const todayStr    = toDateStr(now);
    const tomorrowStr = toDateStr(addDays(now, 1));
    const daysToFri   = (5 - dow + 7) % 7 || 7;
    const daysToMon   = (1 - dow + 7) % 7 || 7;
    const thisFriStr  = toDateStr(addDays(now, daysToFri));
    const nextMonStr  = toDateStr(addDays(now, daysToMon));

    const quickPicks = [
      { label: "Hoy",           value: todayStr    },
      { label: "Mañana",        value: tomorrowStr },
      { label: "Este viernes",  value: thisFriStr  },
      { label: "Próximo lunes", value: nextMonStr  },
    ];

    box.innerHTML =
      '<p class="modal-label">Fecha límite</p>' +
      '<div class="date-quick-picks">' +
        quickPicks.map(function (p) {
          const active = current === p.value ? ' active' : '';
          return '<button type="button" class="date-quick-btn' + active + '" data-value="' + p.value + '">' + p.label + '</button>';
        }).join('') +
      '</div>' +
      '<input class="modal-input modal-input-date" type="date" />' +
      '<div class="modal-actions modal-actions-date">' +
        '<button class="modal-btn modal-btn-clear">Quitar</button>' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Guardar</button>' +
      '</div>';

    const input   = box.querySelector(".modal-input-date");
    const confirm = box.querySelector(".modal-btn-confirm");
    const cancel  = box.querySelector(".modal-btn-cancel");
    const clear   = box.querySelector(".modal-btn-clear");

    input.min   = todayStr;
    input.value = current || "";

    box.querySelectorAll(".date-quick-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(overlay);
        resolve(btn.dataset.value);
      });
    });

    input.addEventListener("input", function () {
      box.querySelectorAll(".date-quick-btn").forEach(function (btn) {
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
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () { input.focus(); }, 50);
  });
}

/**
 * Modal para configurar un recordatorio puntual de una tarea.
 *
 * @param {string|null} currentISO  - ISO datetime actual o null
 * @returns {Promise<string|null|undefined>}
 *   - string ISO → guardar ese recordatorio
 *   - null       → quitar recordatorio existente
 *   - undefined  → cancelar (no tocar)
 */
export function modalReminder(currentISO) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function toLocalISO(d) {
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
             "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }

    const now = new Date();
    const presets = [];
    // En 1 hora
    presets.push({ label: "En 1 hora",  iso: toLocalISO(new Date(now.getTime() + 60 * 60 * 1000)) });
    // En 4 horas
    presets.push({ label: "En 4 horas", iso: toLocalISO(new Date(now.getTime() + 4 * 60 * 60 * 1000)) });
    // Esta tarde 18:00 (si aún no son)
    const eveningToday = new Date(now); eveningToday.setHours(18, 0, 0, 0);
    if (eveningToday.getTime() > now.getTime()) {
      presets.push({ label: "Esta tarde (18:00)", iso: toLocalISO(eveningToday) });
    }
    // Mañana 9:00
    const tomMorning = new Date(now); tomMorning.setDate(tomMorning.getDate() + 1); tomMorning.setHours(9, 0, 0, 0);
    presets.push({ label: "Mañana 9:00", iso: toLocalISO(tomMorning) });
    // En 2 días
    const in2 = new Date(now); in2.setDate(in2.getDate() + 2); in2.setHours(9, 0, 0, 0);
    presets.push({ label: "En 2 días",   iso: toLocalISO(in2) });

    const chipsHtml = presets.map(function (p) {
      return '<button type="button" class="date-quick-btn" data-iso="' + p.iso + '">' + p.label + '</button>';
    }).join("");

    const currentVal = (currentISO && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(currentISO))
      ? currentISO.slice(0, 16)
      : "";

    box.innerHTML =
      '<div class="modal-icon"><i data-lucide="bell"></i></div>' +
      '<p class="modal-label">Recordatorio</p>' +
      '<div class="date-quick-picks">' + chipsHtml + '</div>' +
      '<input class="modal-input" type="datetime-local" value="' + currentVal + '" />' +
      '<div class="modal-actions modal-actions-date">' +
        '<button class="modal-btn modal-btn-clear">Quitar</button>' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Guardar</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    const input   = box.querySelector(".modal-input");
    const confirm = box.querySelector(".modal-btn-confirm");
    const cancel  = box.querySelector(".modal-btn-cancel");
    const clear   = box.querySelector(".modal-btn-clear");

    box.querySelectorAll(".date-quick-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(overlay);
        resolve(btn.dataset.iso);
      });
    });

    function doConfirm() {
      const v = input.value;
      closeModal(overlay);
      if (!v) { resolve(null); return; }
      // Validar que es futuro
      const parsed = new Date(v);
      if (isNaN(parsed.getTime())) { resolve(null); return; }
      resolve(v);
    }
    function doCancel() { closeModal(overlay); resolve(undefined); }
    function doClear()  { closeModal(overlay); resolve(null); }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    clear.addEventListener("click",   doClear);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () { input.focus(); }, 50);
  });
}

/**
 * Modal de recurrencia con presets.
 * @param {number|null} current — días de recurrencia actuales
 * @returns {Promise<number|null|undefined>}
 *   - número    → repetir cada N días
 *   - null      → quitar recurrencia
 *   - undefined → cancela
 */
export function modalRecurrence(current) {
  return new Promise(function (resolve) {
    var presets = [
      { label: "Diario",      days: 1  },
      { label: "Cada 2 días", days: 2  },
      { label: "Semanal",     days: 7  },
      { label: "Quincenal",   days: 14 },
      { label: "Mensual",     days: 30 },
    ];
    const { overlay, box } = createModalBase();
    var isPreset = current != null && presets.some(function (p) { return p.days === current; });
    var chipsHtml = presets.map(function (p) {
      var active = current === p.days ? " active" : "";
      return '<button type="button" class="date-quick-btn' + active + '" data-days="' + p.days + '">' + p.label + '</button>';
    }).join("");

    box.innerHTML =
      '<div class="modal-icon"><i data-lucide="repeat"></i></div>' +
      '<p class="modal-label">Repetir cada</p>' +
      '<div class="date-quick-picks">' + chipsHtml + '</div>' +
      '<input class="modal-input" type="number" min="1" max="3650" placeholder="Personalizado (días)" value="' +
        (current && !isPreset ? current : "") + '" />' +
      '<div class="modal-actions modal-actions-date">' +
        '<button class="modal-btn modal-btn-clear">Quitar</button>' +
        '<button class="modal-btn modal-btn-cancel">Cancelar</button>' +
        '<button class="modal-btn modal-btn-confirm">Guardar</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    var input   = box.querySelector(".modal-input");
    var confirm = box.querySelector(".modal-btn-confirm");
    var cancel  = box.querySelector(".modal-btn-cancel");
    var clear   = box.querySelector(".modal-btn-clear");

    box.querySelectorAll(".date-quick-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeModal(overlay);
        resolve(parseInt(btn.dataset.days, 10));
      });
    });

    function doConfirm() {
      var v = parseInt(input.value, 10);
      closeModal(overlay);
      resolve((isNaN(v) || v <= 0) ? null : Math.min(v, 3650));
    }
    function doCancel() { closeModal(overlay); resolve(undefined); }
    function doClear()  { closeModal(overlay); resolve(null); }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    clear.addEventListener("click",   doClear);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () {
      if (input) input.focus();
    }, 50);
  });
}

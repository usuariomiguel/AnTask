// ═══════════════════════════════════════════════════════════════
// Captura rápida global
//
// Modal minimalista para crear una tarea desde cualquier sitio de
// la app (típicamente vía atajo Ctrl/Cmd+Shift+Espacio).
//
// El módulo es agnóstico del estado: recibe via `deps` el destino
// actual (proyecto al que ir), la lista de proyectos elegibles y
// el callback para crear la tarea.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";
import { escHtml } from "../utils/html.js";
import { parseNaturalLanguage } from "../utils/nl-parse.js";
import { buildNLChipsHTML, formatRecurLabel, formatDueLabel } from "../utils/nl-chips.js";
import { t } from "../i18n/index.js";
import { projectColor } from "../utils/project-color.js";
import { isSimpleMobile } from "./mode.js";

let _isOpen = false;

/**
 * @typedef {Object} QuickCaptureDeps
 * @property {() => {project: any, isFallback: boolean}} getTarget
 *   Devuelve el proyecto donde irá la tarea. `isFallback` es true
 *   cuando no había proyecto activo y se usa Inbox por defecto.
 * @property {() => any[]} [getLists]
 *   Devuelve todos los proyectos elegibles desde el selector de
 *   lista (Inbox primero, luego el resto sin archivar).
 * @property {string} [inboxId]
 *   Id del proyecto Inbox — solo para el matiz de color del chip.
 * @property {(project: any, text: string, overrides: {priority?: string, dueDate?: string, recurDays?: number}) => void} onCreate
 *   Callback para crear la tarea en el proyecto indicado. `overrides`
 *   lleva prioridad/fecha elegidas a mano en los chips (pisan lo
 *   detectado en el texto).
 * @property {(message: string) => void} [onToast]
 *   Mensaje de confirmación tras crear (opcional).
 */

/**
 * Devuelve true si el modal ya está abierto.
 * Útil para evitar abrirlo dos veces desde el handler global.
 */
export function isQuickCaptureOpen() {
  return _isOpen;
}

/** ISO YYYY-MM-DD en hora local para "hoy" / "mañana" / fecha explícita. */
function _dueKeyToISO(key) {
  if (!key) return null;
  // Ya es una fecha explícita en ISO (elegida a mano en el calendario).
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  const d = new Date();
  if (key === "manana") d.setDate(d.getDate() + 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** ISO YYYY-MM-DD en hora local, para construir el calendario. */
function _localISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/**
 * Busca un `#lista` en el texto bruto y lo empareja con un proyecto
 * existente (por nombre exacto, sin distinguir mayúsculas). No usa
 * el parser compartido de lenguaje natural — es un atajo local solo
 * para enrutar la tarea, igual que hace el prototipo.
 */
function _detectHashList(raw, lists) {
  const m = raw.match(/(?:^|\s)#([^\s#]+)/);
  if (!m || m.index == null) return null;
  const needle = m[1].toLowerCase();
  const found = (lists || []).find(function (p) { return p.name && p.name.toLowerCase() === needle; });
  if (!found) return null;
  return { project: found, start: m.index, end: m.index + m[0].length };
}

function _stripRange(text, start, end) {
  return (text.slice(0, start) + text.slice(end)).replace(/\s+/g, " ").trim();
}

/**
 * Abre el modal de captura rápida.
 *
 * @param {QuickCaptureDeps} deps
 */
export function showQuickCapture(deps) {
  if (_isOpen) return;
  _isOpen = true;

  const { project } = deps.getTarget() || {};
  if (!project) {
    _isOpen = false;
    return;
  }

  const lists  = (typeof deps.getLists === "function" ? deps.getLists() : []) || [];
  // El modo simple es solo para móvil — en escritorio esta captura rápida
  // se muestra siempre completa, sin importar el flag.
  const simple = isSimpleMobile();

  const { overlay, box } = createModalBase();
  overlay.classList.add("modal-overlay--top");
  box.className = "modal-box modal-box-quick";

  // Overrides manuales: los chips pisan lo detectado en el texto.
  let dueOverride   = null;    // "hoy" | "manana" | null
  let prioOverride  = null;    // "high" | null — sin niveles, solo "importante"
  let recurOverride = null;    // número de días | null
  let selectedId    = project.id;
  let manualPick    = false;   // true en cuanto se elige una lista a mano

  box.innerHTML =
    '<div class="quick-capture-header">' +
      '<span class="quick-capture-title">' + t("quick_capture.title") + '</span>' +
      '<span class="quick-capture-spacer"></span>' +
      '<span class="quick-capture-kbd-hint">' +
        '<span class="qc-kbd">Ctrl</span><span class="qc-kbd-plus">+</span>' +
        '<span class="qc-kbd">⇧</span><span class="qc-kbd-plus">+</span>' +
        '<span class="qc-kbd qc-kbd--wide">Espacio</span>' +
      '</span>' +
      '<button type="button" class="quick-capture-close" aria-label="' + t("modal.close") + '"><i data-lucide="x"></i></button>' +
    '</div>' +
    '<input class="quick-capture-input" type="text" maxlength="120" autocomplete="off"' +
      ' placeholder="' + t("quick_capture.placeholder") + '" />' +
    '<div class="quick-capture-preview nl-preview" hidden></div>' +
    '<div class="quick-capture-chips">' +
      '<div class="qc-date-picker">' +
        '<button type="button" class="qc-chip qc-date-trigger" aria-expanded="false" aria-haspopup="dialog">' +
          '<i data-lucide="calendar"></i><span class="qc-date-label">' + t("detail.due_date") + '</span>' +
        '</button>' +
      '</div>' +
      // Prioridad: solo en modo completo — el simple se limita a fecha/repetir.
      (simple ? "" :
        '<span class="qc-chip-sep"></span>' +
        // Ya no hay niveles: un único chip que marca "importante" (bandera roja).
        '<button type="button" class="qc-chip qc-chip--high" data-prio="high"><i data-lucide="flag"></i>' + t("detail.priority_important") + '</button>'
      ) +
      '<span class="qc-chip-sep"></span>' +
      '<div class="qc-recur-picker">' +
        '<button type="button" class="qc-chip qc-recur-trigger" aria-expanded="false" aria-haspopup="listbox">' +
          '<i data-lucide="repeat"></i><span class="qc-recur-label">' + t("detail.recur") + '</span>' +
        '</button>' +
      '</div>' +
      // Selector de lista: solo en modo completo.
      (simple ? "" :
        '<span class="qc-chip-sep"></span>' +
        '<div class="qc-list-picker">' +
          '<button type="button" class="qc-chip qc-list-trigger" aria-expanded="false" aria-haspopup="listbox">' +
            '<span class="qc-list-dot"></span><span class="qc-list-label"></span><i data-lucide="chevron-down" class="qc-list-caret"></i>' +
          '</button>' +
        '</div>'
      ) +
    '</div>' +
    '<div class="quick-capture-footer">' +
      // Solo visible en móvil: en la hoja deslizante el aspa de la cabecera
      // no se ve, así que la salida es un botón de texto como en v1.
      '<button type="button" class="quick-capture-cancel">' + t("modal.cancel") + '</button>' +
      '<span class="quick-capture-hint">' +
        '<span class="qc-hint-word">' + t("quick_capture.hint_type") + '</span>' +
        (simple ? '<code>hoy</code><code>cada 2 días</code>' : '<code>hoy</code><code>#lista</code><code>p1</code>') +
        '<span class="qc-hint-word">' + t("quick_capture.hint_autocomplete") + '</span>' +
      '</span>' +
      '<span class="quick-capture-spacer"></span>' +
      '<button type="button" class="quick-capture-submit" disabled>' +
        '<span>' + t("quick_capture.submit") + '</span>' +
        '<span class="qc-kbd qc-kbd--accent">↵</span>' +
      '</button>' +
    '</div>';

  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  const input        = box.querySelector(".quick-capture-input");
  const preview      = box.querySelector(".quick-capture-preview");
  const dateTrigger  = box.querySelector(".qc-date-trigger");
  const dateLabel    = box.querySelector(".qc-date-label");
  const prioBtns     = box.querySelectorAll("[data-prio]");
  const recurTrigger = box.querySelector(".qc-recur-trigger");
  const recurLabel   = box.querySelector(".qc-recur-label");
  const listPicker   = box.querySelector(".qc-list-picker");
  const listTrigger  = box.querySelector(".qc-list-trigger");
  const listLabel    = box.querySelector(".qc-list-label");
  const submitBtn    = box.querySelector(".quick-capture-submit");
  let   datePopoverEl  = null;
  let   recurPopoverEl = null;
  let   listPopoverEl  = null;

  function findList(id) {
    return lists.find(function (p) { return p.id === id; }) || project;
  }

  function closeDatePopover() {
    if (!datePopoverEl) return;
    datePopoverEl.remove();
    datePopoverEl = null;
    dateTrigger.setAttribute("aria-expanded", "false");
  }

  function openDatePopover() {
    closeDatePopover();
    dateTrigger.setAttribute("aria-expanded", "true");

    const currentISO = dueOverride != null
      ? _dueKeyToISO(dueOverride)
      : parseNaturalLanguage(input.value).dueDate;
    const init = currentISO ? new Date(currentISO + "T00:00") : new Date();
    let vy = init.getFullYear();
    let vm = init.getMonth();

    const pop = document.createElement("div");
    pop.className = "field-popover field-popover--fixed";

    function renderCal() {
      const todayISO    = _localISO(new Date());
      const tomorrow    = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = _localISO(tomorrow);
      const inWeek      = new Date(); inWeek.setDate(inWeek.getDate() + 7);
      const inWeekISO   = _localISO(inWeek);
      const first       = new Date(vy, vm, 1);
      const monthTitle  = first.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      const offset      = (first.getDay() + 6) % 7; // lunes = 0
      const nDays       = new Date(vy, vm + 1, 0).getDate();
      const mondayRef   = new Date(2024, 0, 1);
      const dowNames    = Array.from({ length: 7 }, function (_, i) {
        const d = new Date(mondayRef); d.setDate(mondayRef.getDate() + i);
        return d.toLocaleDateString("es-ES", { weekday: "narrow" }).toUpperCase();
      });

      let cellsHtml = "";
      for (let i = 0; i < offset; i++) cellsHtml += '<span class="field-popover-cal-empty">·</span>';
      for (let day = 1; day <= nDays; day++) {
        const iso = vy + "-" + String(vm + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
        const cls = ["field-popover-cal-day"];
        if (iso === currentISO) cls.push("field-popover-cal-day--selected");
        else if (iso === todayISO) cls.push("field-popover-cal-day--today");
        cellsHtml += '<span class="' + cls.join(" ") + '" data-day-iso="' + iso + '">' + day + '</span>';
      }

      pop.innerHTML =
        '<div class="field-popover-chips">' +
          '<button type="button" class="field-popover-chip' + (currentISO === todayISO ? " active" : "") + '" data-quick="hoy">' + t("date.today") + '</button>' +
          '<button type="button" class="field-popover-chip' + (currentISO === tomorrowISO ? " active" : "") + '" data-quick="manana">' + t("date.tomorrow") + '</button>' +
          '<button type="button" class="field-popover-chip' + (currentISO === inWeekISO ? " active" : "") + '" data-quick="week">' + t("date.in_week") + '</button>' +
          (dueOverride != null ? '<button type="button" class="field-popover-chip field-popover-chip--clear" data-quick="clear">' + t("modal.clear") + '</button>' : "") +
        '</div>' +
        '<div class="field-popover-cal-head">' +
          '<button type="button" class="field-popover-cal-nav" data-cal-nav="-1" aria-label="Mes anterior">‹</button>' +
          '<span class="field-popover-cal-title">' + escHtml(monthTitle) + '</span>' +
          '<button type="button" class="field-popover-cal-nav" data-cal-nav="1" aria-label="Mes siguiente">›</button>' +
        '</div>' +
        '<div class="field-popover-cal-grid">' +
          dowNames.map(function (d) { return '<span class="field-popover-cal-dow">' + d + '</span>'; }).join("") +
          cellsHtml +
        '</div>';

      if (window.lucide) window.lucide.createIcons({ nodes: [pop] });

      pop.querySelector('[data-cal-nav="-1"]').addEventListener("click", function () {
        vm--; if (vm < 0) { vm = 11; vy--; }
        renderCal();
      });
      pop.querySelector('[data-cal-nav="1"]').addEventListener("click", function () {
        vm++; if (vm > 11) { vm = 0; vy++; }
        renderCal();
      });
      pop.querySelectorAll("[data-quick]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const q = btn.dataset.quick;
          dueOverride = q === "hoy" ? "hoy" : q === "manana" ? "manana" : q === "week" ? inWeekISO : null;
          closeDatePopover();
          render();
        });
      });
      pop.querySelectorAll("[data-day-iso]").forEach(function (el) {
        el.addEventListener("click", function () {
          dueOverride = el.dataset.dayIso;
          closeDatePopover();
          render();
        });
      });
    }
    renderCal();

    document.body.appendChild(pop);
    _placeFixedPopover(pop, dateTrigger);
    datePopoverEl = pop;
  }

  function closeListPopover() {
    if (!listPopoverEl) return;
    listPopoverEl.remove();
    listPopoverEl = null;
    listTrigger.setAttribute("aria-expanded", "false");
  }

  function openListPopover() {
    closeListPopover();
    listTrigger.setAttribute("aria-expanded", "true");
    const pop = document.createElement("div");
    // El modal de captura rápida es bajo y el disparador vive a media
    // altura: anclado con `position: absolute` dentro del modal (como el
    // resto de popovers de campo), un listado largo se salía por arriba
    // o por abajo de esa caja pequeña y quedaba cortado o tapando el
    // input/el botón de enviar. Aquí va con `position: fixed` sobre todo
    // el documento, colocado a mano según el hueco real del viewport
    // (abre hacia abajo si cabe, si no hacia arriba) y con su propio
    // scroll interno tope, así nunca depende del tamaño del modal.
    pop.className = "field-popover field-popover--narrow field-popover--fixed";
    pop.innerHTML = '<div class="field-popover-list">' +
      lists.map(function (p) {
        const active = p.id === selectedId;
        return '<button type="button" class="field-popover-row' + (active ? " active" : "") + '" data-list-id="' + escHtml(p.id) + '"' +
            ' style="--dot-color:' + escHtml(projectColor(p)) + '">' +
          '<span class="field-popover-row-dot"></span>' +
          '<span class="field-popover-row-label">' + escHtml(p.name) + '</span>' +
          (active ? '<i data-lucide="check"></i>' : "") +
        '</button>';
      }).join("") +
    '</div>';
    document.body.appendChild(pop);
    _placeFixedPopover(pop, listTrigger);
    if (window.lucide) window.lucide.createIcons({ nodes: [pop] });
    pop.querySelectorAll("[data-list-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedId = btn.dataset.listId;
        manualPick = true;
        closeListPopover();
        render();
      });
    });
    listPopoverEl = pop;
  }

  /** Coloca un popover `position: fixed` bajo (o, si no cabe, sobre) su
   *  disparador, con margen de seguridad al borde del viewport. */
  function _placeFixedPopover(pop, trigger) {
    const MARGIN = 8;
    const r = trigger.getBoundingClientRect();
    const maxH = Math.min(320, window.innerHeight - MARGIN * 2);
    pop.style.maxHeight = maxH + "px";
    pop.style.overflowY = "auto";
    // Ancho fijo (240px, ver .field-popover--narrow): se alinea al borde
    // derecho del disparador sin salirse por la izquierda del viewport.
    const width = pop.offsetWidth || 240;
    let left = r.right - width;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
    const spaceBelow = window.innerHeight - r.bottom - MARGIN;
    const spaceAbove = r.top - MARGIN;
    const openDown = spaceBelow >= Math.min(maxH, pop.scrollHeight) || spaceBelow >= spaceAbove;
    pop.style.position = "fixed";
    pop.style.left = left + "px";
    pop.style.right = "auto";
    if (openDown) {
      pop.style.top = (r.bottom + 6) + "px";
      pop.style.bottom = "auto";
      pop.style.maxHeight = Math.min(maxH, spaceBelow) + "px";
    } else {
      pop.style.bottom = (window.innerHeight - r.top + 6) + "px";
      pop.style.top = "auto";
      pop.style.maxHeight = Math.min(maxH, spaceAbove) + "px";
    }
  }

  if (listTrigger) {
    listTrigger.addEventListener("click", function () {
      if (listPopoverEl) closeListPopover();
      else openListPopover();
    });
  }

  dateTrigger.addEventListener("click", function () {
    if (datePopoverEl) closeDatePopover();
    else openDatePopover();
  });

  // Mismos presets que el popover de repetición del panel de detalle
  // (ver _showRecurPopover en script.js) — no hay input de días a medida
  // aquí, la captura rápida se queda con los valores típicos.
  const RECUR_PRESETS = [
    { label: t("recur.daily"),        days: 1  },
    { label: t("recur.every_2_days"), days: 2  },
    { label: t("recur.weekly"),       days: 7  },
    { label: t("recur.biweekly"),     days: 14 },
    { label: t("recur.monthly"),      days: 30 },
  ];

  function closeRecurPopover() {
    if (!recurPopoverEl) return;
    recurPopoverEl.remove();
    recurPopoverEl = null;
    recurTrigger.setAttribute("aria-expanded", "false");
  }

  function openRecurPopover() {
    closeRecurPopover();
    recurTrigger.setAttribute("aria-expanded", "true");
    const pop = document.createElement("div");
    pop.className = "field-popover field-popover--narrow field-popover--fixed";
    const parsedDays = parseNaturalLanguage(input.value).recurDays;
    const activeDays = recurOverride != null ? recurOverride : parsedDays;
    pop.innerHTML = '<div class="field-popover-list">' +
      RECUR_PRESETS.map(function (p) {
        const active = activeDays === p.days;
        return '<button type="button" class="field-popover-row' + (active ? " active" : "") + '" data-recur-days="' + p.days + '">' +
          '<span class="field-popover-row-label">' + p.label + '</span>' +
          (active ? '<i data-lucide="check"></i>' : "") +
        '</button>';
      }).join("") +
      (activeDays ? '<div class="field-popover-sep"></div>' +
        '<button type="button" class="field-popover-row field-popover-row--clear" data-recur-clear>' +
          '<span class="field-popover-row-label">' + t("modal.clear") + '</span>' +
        '</button>' : "") +
    '</div>';
    document.body.appendChild(pop);
    _placeFixedPopover(pop, recurTrigger);
    if (window.lucide) window.lucide.createIcons({ nodes: [pop] });
    pop.querySelectorAll("[data-recur-days]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        recurOverride = parseInt(btn.dataset.recurDays, 10);
        closeRecurPopover();
        render();
      });
    });
    const clearBtn = pop.querySelector("[data-recur-clear]");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      // Vacío, no null: si el texto sigue diciendo "cada semana" queremos
      // que se lea de ahí de nuevo, no forzar "sin repetición" a la fuerza.
      recurOverride = null;
      closeRecurPopover();
      render();
    });
    recurPopoverEl = pop;
  }

  recurTrigger.addEventListener("click", function () {
    if (recurPopoverEl) closeRecurPopover();
    else openRecurPopover();
  });

  function render() {
    const raw = input.value;
    const hashMatch = simple ? null : _detectHashList(raw, lists);

    if (!manualPick) selectedId = hashMatch ? hashMatch.project.id : project.id;
    const resolved = findList(selectedId);

    // píldoras detectadas en el texto (solo si no hay override manual del mismo campo)
    const parsed = parseNaturalLanguage(raw);
    const chips = [];
    if (parsed.dueDate && !dueOverride) chips.push(buildNLChipsHTML({ dueDate: parsed.dueDate })[0]);
    if (hashMatch && manualPick) {
      chips.push('<span class="nl-chip nl-chip-list"><span class="nl-chip-hash">#</span>' + escHtml(hashMatch.project.name) + '</span>');
    }
    if (!simple && parsed.priority && !prioOverride) chips.push(buildNLChipsHTML({ priority: parsed.priority })[0]);
    if (parsed.recurDays && recurOverride == null) chips.push(buildNLChipsHTML({ recurDays: parsed.recurDays })[0]);
    if (chips.length) {
      preview.hidden = false;
      preview.innerHTML = chips.join("");
      if (window.lucide) window.lucide.createIcons({ nodes: [preview] });
    } else {
      preview.hidden = true;
      preview.innerHTML = "";
    }

    const finalPrio  = prioOverride || parsed.priority;
    const finalRecur = recurOverride != null ? recurOverride : parsed.recurDays;
    const finalDue   = dueOverride != null ? _dueKeyToISO(dueOverride) : parsed.dueDate;
    dateTrigger.classList.toggle("active", !!finalDue);
    dateLabel.textContent = finalDue ? formatDueLabel(finalDue) : t("detail.due_date");
    prioBtns.forEach(function (btn) { btn.classList.toggle("active", btn.dataset.prio === finalPrio); });
    recurTrigger.classList.toggle("active", !!finalRecur);
    recurLabel.textContent = finalRecur ? formatRecurLabel(finalRecur) : t("detail.recur");

    if (listLabel) listLabel.textContent = resolved.name;
    if (listTrigger) {
      listTrigger.classList.add("active");
      // El color es el mismo que en cualquier otro sitio de la app (chip de
      // lista, punto de grupo…) — Inbox incluido, con el acento del tema en
      // vez de un ámbar aparte que no pegaba con el resto de la paleta.
      listTrigger.style.setProperty("--dot-color", projectColor(resolved));
    }

    submitBtn.disabled = raw.trim().length === 0;
  }

  input.addEventListener("input", render);
  prioBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const p = btn.dataset.prio;
      prioOverride = (prioOverride === p) ? null : p;
      render();
    });
  });

  render();

  function close() {
    _isOpen = false;
    document.removeEventListener("mousedown", onDocMouseDown, true);
    // Los popovers de fecha/lista/repetición ya no viven dentro de `box`
    // (ver openDatePopover/openListPopover/openRecurPopover), así que
    // cerrar el modal no se los lleva por delante solos.
    closeDatePopover();
    closeListPopover();
    closeRecurPopover();
    closeModal(overlay);
    // Se llama en TODAS las salidas (creada o cancelada) — quien abrió la
    // captura desde otro flujo (p.ej. el onboarding, que se queda oculto
    // mientras tanto) necesita saber que ha terminado para reaparecer,
    // independientemente de si se llegó a crear una tarea o no.
    if (typeof deps.onClose === "function") deps.onClose();
  }

  function submit() {
    const raw = input.value.trim();
    if (!raw) {
      input.focus();
      return;
    }
    const hashMatch = simple ? null : _detectHashList(raw, lists);
    const text = hashMatch ? _stripRange(raw, hashMatch.start, hashMatch.end) : raw;
    const targetProject = findList(selectedId);
    const overrides = {};
    if (prioOverride) overrides.priority = prioOverride;
    if (dueOverride) overrides.dueDate = _dueKeyToISO(dueOverride);
    if (recurOverride != null) overrides.recurDays = recurOverride;

    if (typeof deps.onCreate === "function") {
      deps.onCreate(targetProject, text, overrides);
    }
    if (typeof deps.onToast === "function") {
      deps.onToast(t("quick_capture.added_to") + " " + targetProject.name);
    }
    close();
  }

  overlay._cancel = close;
  const closeBtn = box.querySelector(".quick-capture-close");
  if (closeBtn) closeBtn.addEventListener("click", close);
  const cancelBtn = box.querySelector(".quick-capture-cancel");
  if (cancelBtn) cancelBtn.addEventListener("click", close);
  submitBtn.addEventListener("click", submit);

  input.addEventListener("keydown", function (e) {
    e.stopPropagation();  // Evita que atajos globales (n, s, a, c) actúen
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (datePopoverEl) closeDatePopover();
      else if (listPopoverEl) closeListPopover();
      else close();
    }
  });

  function onDocMouseDown(e) {
    // Los popovers ya no cuelgan de su disparador (ver openDatePopover/
    // openListPopover/openRecurPopover: van en `document.body` con
    // `position: fixed`), así que un clic dentro de ellos también cuenta
    // como "dentro".
    if (datePopoverEl && !dateTrigger.contains(e.target) && !datePopoverEl.contains(e.target)) {
      closeDatePopover();
    }
    if (listPopoverEl && !listPicker.contains(e.target) && !listPopoverEl.contains(e.target)) {
      closeListPopover();
    }
    if (recurPopoverEl && !recurTrigger.contains(e.target) && !recurPopoverEl.contains(e.target)) {
      closeRecurPopover();
    }
  }
  document.addEventListener("mousedown", onDocMouseDown, true);

  // Focus inmediato
  setTimeout(function () { input.focus(); }, 40);
}

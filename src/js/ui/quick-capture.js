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
import { buildNLChipsHTML } from "../utils/nl-chips.js";
import { t } from "../i18n/index.js";
import { projectColor } from "../utils/project-color.js";

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
 * @property {(project: any, text: string, overrides: {priority?: string, dueDate?: string}) => void} onCreate
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

/** ISO YYYY-MM-DD en hora local para "hoy" / "mañana". */
function _dueKeyToISO(key) {
  if (!key) return null;
  const d = new Date();
  if (key === "manana") d.setDate(d.getDate() + 1);
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

  const lists = (typeof deps.getLists === "function" ? deps.getLists() : []) || [];

  // El overlay cuelga de <body> y por defecto cubre todo el viewport
  // (`inset: 0`), pero la barra de captura vive centrada en `.main-panel`
  // —descuenta la sidebar y el panel de detalle—, no en la pantalla
  // entera. Sin esto, el modal se abre centrado más a la derecha (o a la
  // izquierda) de donde estaba la barra, y por poco que se disimule con
  // la transición de entrada se nota como un salto. Se mide ANTES de
  // montar el overlay: montarlo ya desplaza el layout (el scrollbar de
  // la página desaparece al bloquear el scroll de fondo), así que medir
  // después daba un centro distinto al que el usuario tenía delante.
  let mainPanelRect = null;
  if (window.matchMedia("(min-width: 769px)").matches) {
    const mainPanel = document.querySelector(".main-panel");
    if (mainPanel) mainPanelRect = mainPanel.getBoundingClientRect();
  }

  const { overlay, box } = createModalBase();
  overlay.classList.add("modal-overlay--top");
  box.className = "modal-box modal-box-quick";

  if (mainPanelRect) {
    overlay.style.left  = mainPanelRect.left + "px";
    overlay.style.width = mainPanelRect.width + "px";
  }

  // Overrides manuales: los chips pisan lo detectado en el texto.
  let dueOverride  = null;    // "hoy" | "manana" | null
  let prioOverride = null;    // "high" | null — sin niveles, solo "importante"
  let selectedId   = project.id;
  let manualPick   = false;   // true en cuanto se elige una lista a mano

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
      '<button type="button" class="qc-chip" data-due="hoy"><i data-lucide="sun"></i>' + t("date.today") + '</button>' +
      '<button type="button" class="qc-chip" data-due="manana"><i data-lucide="calendar"></i>' + t("date.tomorrow") + '</button>' +
      '<span class="qc-chip-sep"></span>' +
      // Ya no hay niveles: un único chip que marca "importante" (bandera roja).
      '<button type="button" class="qc-chip qc-chip--high" data-prio="high"><i data-lucide="flag"></i>' + t("detail.priority_important") + '</button>' +
      '<span class="qc-chip-sep"></span>' +
      '<div class="qc-list-picker">' +
        '<button type="button" class="qc-chip qc-list-trigger" aria-expanded="false" aria-haspopup="listbox">' +
          '<span class="qc-list-dot"></span><span class="qc-list-label"></span><i data-lucide="chevron-down" class="qc-list-caret"></i>' +
        '</button>' +
      '</div>' +
    '</div>' +
    '<div class="quick-capture-footer">' +
      // Solo visible en móvil: en la hoja deslizante el aspa de la cabecera
      // no se ve, así que la salida es un botón de texto como en v1.
      '<button type="button" class="quick-capture-cancel">' + t("modal.cancel") + '</button>' +
      '<span class="quick-capture-hint">' +
        '<span class="qc-hint-word">' + t("quick_capture.hint_type") + '</span>' +
        '<code>hoy</code><code>#lista</code><code>p1</code>' +
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
  const dueBtns      = box.querySelectorAll("[data-due]");
  const prioBtns     = box.querySelectorAll("[data-prio]");
  const listPicker   = box.querySelector(".qc-list-picker");
  const listTrigger  = box.querySelector(".qc-list-trigger");
  const listLabel    = box.querySelector(".qc-list-label");
  const submitBtn    = box.querySelector(".quick-capture-submit");
  let   listPopoverEl = null;

  function findList(id) {
    return lists.find(function (p) { return p.id === id; }) || project;
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
    // Hacia abajo, no hacia arriba: el modal de captura rápida es bajo y
    // el disparador vive a media altura, así que un popover largo (muchas
    // listas) abriendo hacia arriba se salía por encima del propio modal
    // —zona que su `overflow-y: auto` no puede alcanzar, al no haber
    // scroll negativo— y quedaba inalcanzable. Hacia abajo, en cambio, el
    // propio scroll del modal lo deja a la vista.
    pop.className = "field-popover field-popover--narrow";
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
    listPicker.appendChild(pop);
    // Con muchas listas el popover puede sobrar por debajo del propio
    // modal (que hace scroll, no recorta); sin esto quedaba técnicamente
    // alcanzable pero fuera de la vista hasta que el usuario adivinara
    // que tenía que desplazar el modal a mano.
    pop.scrollIntoView({ block: "nearest" });
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

  listTrigger.addEventListener("click", function () {
    if (listPopoverEl) closeListPopover();
    else openListPopover();
  });

  function render() {
    const raw = input.value;
    const hashMatch = _detectHashList(raw, lists);

    if (!manualPick) selectedId = hashMatch ? hashMatch.project.id : project.id;
    const resolved = findList(selectedId);

    // píldoras detectadas en el texto (solo si no hay override manual del mismo campo)
    const parsed = parseNaturalLanguage(raw);
    const chips = [];
    if (parsed.dueDate && !dueOverride) chips.push(buildNLChipsHTML({ dueDate: parsed.dueDate })[0]);
    if (hashMatch && manualPick) {
      chips.push('<span class="nl-chip nl-chip-list"><span class="nl-chip-hash">#</span>' + escHtml(hashMatch.project.name) + '</span>');
    }
    if (parsed.priority && !prioOverride) chips.push(buildNLChipsHTML({ priority: parsed.priority })[0]);
    if (chips.length) {
      preview.hidden = false;
      preview.innerHTML = chips.join("");
      if (window.lucide) window.lucide.createIcons({ nodes: [preview] });
    } else {
      preview.hidden = true;
      preview.innerHTML = "";
    }

    const finalPrio = prioOverride || parsed.priority;
    dueBtns.forEach(function (btn) { btn.classList.toggle("active", btn.dataset.due === dueOverride); });
    prioBtns.forEach(function (btn) { btn.classList.toggle("active", btn.dataset.prio === finalPrio); });

    listLabel.textContent = resolved.name;
    listTrigger.classList.add("active");
    // El color es el mismo que en cualquier otro sitio de la app (chip de
    // lista, punto de grupo…) — Inbox incluido, con el acento del tema en
    // vez de un ámbar aparte que no pegaba con el resto de la paleta.
    listTrigger.style.setProperty("--dot-color", projectColor(resolved));

    submitBtn.disabled = raw.trim().length === 0;
  }

  input.addEventListener("input", render);
  dueBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const key = btn.dataset.due;
      dueOverride = dueOverride === key ? null : key;
      render();
    });
  });
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
    closeModal(overlay);
  }

  function submit() {
    const raw = input.value.trim();
    if (!raw) {
      input.focus();
      return;
    }
    const hashMatch = _detectHashList(raw, lists);
    const text = hashMatch ? _stripRange(raw, hashMatch.start, hashMatch.end) : raw;
    const targetProject = findList(selectedId);
    const overrides = {};
    if (prioOverride) overrides.priority = prioOverride;
    if (dueOverride) overrides.dueDate = _dueKeyToISO(dueOverride);

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
      if (listPopoverEl) closeListPopover();
      else close();
    }
  });

  function onDocMouseDown(e) {
    if (listPopoverEl && !listPicker.contains(e.target)) closeListPopover();
  }
  document.addEventListener("mousedown", onDocMouseDown, true);

  // Focus inmediato
  setTimeout(function () { input.focus(); }, 40);
}

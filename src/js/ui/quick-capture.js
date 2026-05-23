// ═══════════════════════════════════════════════════════════════
// Captura rápida global
//
// Modal minimalista para crear una tarea desde cualquier sitio de
// la app (típicamente vía atajo Ctrl/Cmd+Shift+Espacio).
//
// El módulo es agnóstico del estado: recibe via `deps` el destino
// actual (proyecto al que ir) y el callback para crear la tarea.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";
import { escHtml } from "../utils/html.js";
import { parseNaturalLanguage } from "../utils/nl-parse.js";
import { buildNLChipsHTML } from "../utils/nl-chips.js";

let _isOpen = false;

/**
 * @typedef {Object} QuickCaptureDeps
 * @property {() => {project: any, isFallback: boolean}} getTarget
 *   Devuelve el proyecto donde irá la tarea. `isFallback` es true
 *   cuando no había proyecto activo y se usa Inbox por defecto.
 * @property {(project: any, text: string) => void} onCreate
 *   Callback para crear la tarea en el proyecto indicado.
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

/**
 * Abre el modal de captura rápida.
 *
 * @param {QuickCaptureDeps} deps
 */
export function showQuickCapture(deps) {
  if (_isOpen) return;
  _isOpen = true;

  const { project, isFallback } = deps.getTarget() || {};
  if (!project) {
    _isOpen = false;
    return;
  }

  const { overlay, box } = createModalBase();
  box.className = "modal-box modal-box-quick";

  const projLabel = (project.icon ? project.icon + " " : "") + project.name;

  box.innerHTML =
    '<div class="quick-capture-header">' +
      '<span class="quick-capture-eyebrow">Nueva tarea</span>' +
      '<span class="quick-capture-target' + (isFallback ? " quick-capture-target--inbox" : "") + '">' +
        '<i data-lucide="corner-down-right"></i> ' +
        escHtml(projLabel) +
      '</span>' +
    '</div>' +
    '<input class="modal-input quick-capture-input" type="text" maxlength="120" autocomplete="off"' +
      ' placeholder="Escribe la tarea y pulsa Enter..." />' +
    '<div class="quick-capture-preview nl-preview" hidden></div>' +
    '<div class="quick-capture-hint">' +
      '<kbd>Enter</kbd> para crear · <kbd>Esc</kbd> para cancelar' +
    '</div>';

  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  const input   = box.querySelector(".quick-capture-input");
  const preview = box.querySelector(".quick-capture-preview");

  function renderPreview(raw) {
    if (!raw || !raw.trim()) {
      preview.hidden = true;
      preview.innerHTML = "";
      return;
    }
    const parsed = parseNaturalLanguage(raw);
    const chips  = buildNLChipsHTML(parsed);
    if (chips.length === 0) {
      preview.hidden = true;
      preview.innerHTML = "";
      return;
    }
    preview.hidden = false;
    preview.innerHTML =
      '<span class="nl-preview-arrow">↳</span>' +
      chips.join("") +
      (parsed.text ? '<span class="nl-preview-rest">' + escHtml(parsed.text) + '</span>' : "");
    if (window.lucide) window.lucide.createIcons({ nodes: [preview] });
  }

  input.addEventListener("input", function () { renderPreview(input.value); });

  function close() {
    _isOpen = false;
    closeModal(overlay);
  }

  function submit() {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    if (typeof deps.onCreate === "function") {
      deps.onCreate(project, text);
    }
    if (typeof deps.onToast === "function") {
      deps.onToast("Añadida a " + projLabel);
    }
    close();
  }

  overlay._cancel = close;

  input.addEventListener("keydown", function (e) {
    e.stopPropagation();  // Evita que atajos globales (n, s, a, c) actúen
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  });

  // Focus inmediato
  setTimeout(function () { input.focus(); }, 40);
}

// ═══════════════════════════════════════════════════════════════
// SISTEMA DE MODALES
import { t } from "../i18n/index.js";
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

  // El overlay se quita al acabar el fundido (opacity .18s), pero
  // `transitionend` NO llega si el navegador se salta la transición —pasa
  // cuando se abre y se cierra en el mismo frame, o con reduced-motion—, y
  // entonces el modal se quedaba en el DOM tapando la interfaz. Un plazo de
  // respaldo garantiza que siempre desaparece.
  let removed = false;
  function remove() {
    if (removed) return;
    removed = true;
    overlay.remove();
  }
  overlay.addEventListener("transitionend", remove, { once: true });
  setTimeout(remove, 350);
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
        '<button class="modal-btn modal-btn-cancel">' + t("modal.cancel") + '</button>' +
        '<button class="modal-btn modal-btn-confirm">' + t("modal.accept") + '</button>' +
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
        '<button class="modal-btn modal-btn-cancel">' + t("modal.cancel") + '</button>' +
        '<button class="modal-btn modal-btn-danger">' + (confirmLabel || t("modal.delete")) + '</button>' +
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
        '<button class="modal-btn modal-btn-confirm">' + t("modal.understood") + '</button>' +
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


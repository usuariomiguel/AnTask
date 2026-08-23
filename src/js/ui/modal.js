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

  // Escape cierra, aquí y no en cada modal: varios lo montaban por su
  // cuenta y a otros —perfil, cuota— se les había olvidado, así que
  // había ventanas que solo se cerraban con el ratón.
  overlay._onKey = function (e) {
    if (e.key !== "Escape") return;
    // Con modales apilados (plantillas → nombre de la lista) solo
    // responde el de encima; si no, Escape los cerraría todos de golpe.
    const stack = document.querySelectorAll(".modal-overlay");
    if (stack[stack.length - 1] !== overlay) return;
    if (overlay._cancel) overlay._cancel();
  };
  document.addEventListener("keydown", overlay._onKey);

  document.body.appendChild(overlay);
  requestAnimationFrame(function () { overlay.classList.add("modal-visible"); });
  return { overlay, box };
}

/**
 * Cabecera del diálogo v1: distintivo con icono + título + botón de
 * cerrar. La comparten prompt/confirm/alert y el modal de perfil para
 * que todas las ventanas emergentes se lean igual.
 *
 * @param {string} title  — texto ya traducido
 * @param {string} icon   — nombre del icono lucide
 * @param {string} [variant] — "danger" tiñe el distintivo de rojo
 */
export function modalHead(title, icon, variant) {
  return '<div class="modal-head">' +
    '<span class="modal-head-badge' + (variant === "danger" ? " modal-head-badge--danger" : "") + '">' +
      '<i data-lucide="' + icon + '"></i>' +
    '</span>' +
    '<p class="modal-head-title">' + title + '</p>' +
    '<button type="button" class="modal-head-close" aria-label="' + t("modal.close") + '">' +
      '<i data-lucide="x"></i>' +
    '</button>' +
  '</div>';
}

/**
 * Cierra y elimina del DOM un overlay creado con createModalBase.
 */
export function closeModal(overlay) {
  overlay.classList.remove("modal-visible");
  if (overlay._onKey) {
    document.removeEventListener("keydown", overlay._onKey);
    overlay._onKey = null;
  }

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

    box.classList.add("modal-box-v1");
    box.innerHTML =
      modalHead(label, "pencil-line") +
      '<div class="modal-body">' +
        '<input class="modal-input" type="text" maxlength="120" autocomplete="off" />' +
      '</div>' +
      '<div class="modal-foot">' +
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
    box.querySelector(".modal-head-close").addEventListener("click", doCancel);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () { input.focus(); input.select(); }, 50);
  });
}

/**
 * Modal de email + contraseña (login/registro con Firebase Auth).
 * `mode` solo cambia el texto del botón — la decisión de si es alta o
 * inicio de sesión la toma quien llama, según lo que responda Firebase.
 * @param {"signin"|"signup"} mode
 * @returns {Promise<{email: string, password: string}|null>}
 */
export function modalEmailPassword(mode) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    box.classList.add("modal-box-v1");
    box.innerHTML =
      modalHead(t(mode === "signup" ? "auth.signup_title" : "auth.signin_title"), "lock") +
      '<div class="modal-body modal-body--stack">' +
        '<input class="modal-input" type="email" autocomplete="email" placeholder="' + t("auth.email_ph") + '" />' +
        '<input class="modal-input" type="password" autocomplete="current-password" placeholder="' + t("auth.password_ph") + '" />' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="modal-btn modal-btn-cancel">' + t("modal.cancel") + '</button>' +
        '<button class="modal-btn modal-btn-confirm">' + t(mode === "signup" ? "auth.signup_btn" : "auth.signin_btn") + '</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    const inputs   = box.querySelectorAll(".modal-input");
    const email    = inputs[0];
    const password = inputs[1];
    const confirm  = box.querySelector(".modal-btn-confirm");
    const cancel   = box.querySelector(".modal-btn-cancel");

    function doConfirm() {
      const e = email.value.trim();
      const p = password.value;
      if (!e || !p) return;
      closeModal(overlay);
      resolve({ email: e, password: p });
    }
    function doCancel() {
      closeModal(overlay);
      resolve(null);
    }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    box.querySelector(".modal-head-close").addEventListener("click", doCancel);
    [email, password].forEach(function (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter")  doConfirm();
        if (e.key === "Escape") doCancel();
      });
    });

    setTimeout(function () { email.focus(); }, 50);
  });
}

/**
 * Modal de confirmación (reemplaza window.confirm).
 * @returns {Promise<boolean>}
 */
export function modalConfirm(message, confirmLabel) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();

    box.classList.add("modal-box-v1");
    box.innerHTML =
      // El título es fijo: el mensaje del llamador suele ser una frase
      // entera y en la cabecera se cortaría con puntos suspensivos.
      modalHead(t("modal.confirm_title"), "triangle-alert", "danger") +
      '<div class="modal-body"><p class="modal-desc">' + message + '</p></div>' +
      '<div class="modal-foot">' +
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
    box.querySelector(".modal-head-close").addEventListener("click", doCancel);
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
    const isError = type === "error";

    box.classList.add("modal-box-v1");
    box.innerHTML =
      modalHead(isError ? t("modal.error_title") : t("modal.notice_title"),
                isError ? "circle-x" : "info",
                isError ? "danger" : "") +
      '<div class="modal-body">' +
        '<p class="modal-desc' + (isError ? " modal-label-error" : "") + '">' + message + '</p>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="modal-btn modal-btn-confirm">' + t("modal.understood") + '</button>' +
      '</div>';
    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    const btn = box.querySelector(".modal-btn-confirm");
    function doClose() { closeModal(overlay); resolve(); }

    overlay._cancel = doClose;
    btn.addEventListener("click", doClose);
    box.querySelector(".modal-head-close").addEventListener("click", doClose);
    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        doClose(); document.removeEventListener("keydown", handler);
      }
    });

    setTimeout(function () { btn.focus(); }, 50);
  });
}


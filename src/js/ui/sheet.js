// ═══════════════════════════════════════════════════════════════
// HOJAS MODALES (bottom sheets) — móvil
//
// El handoff móvil v1 usa una hoja que sube desde abajo en seis
// sitios: captura rápida, nueva/editar lista, opciones de nota,
// opciones de tarea, filtros y modo de vista.
//
// Se construye SOBRE `createModalBase()` en vez de en paralelo: así
// hereda el cierre con Escape respetando el apilado, el clic fuera y
// el respaldo por plazo cuando `transitionend` no llega. Lo único
// propio es la posición, la animación y el asa.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";

/**
 * Crea la base de una hoja. Devuelve `{ overlay, sheet }`; el llamador
 * rellena `sheet`. Igual que en los modales, asigna `overlay._cancel`
 * para que el clic fuera y Escape sepan qué hacer.
 */
export function createSheetBase() {
  const { overlay, box } = createModalBase();
  overlay.classList.add("modal-overlay--sheet");
  box.classList.add("modal-sheet");

  // Asa. Decorativa: no se arrastra (el prototipo tampoco), así que
  // queda fuera del árbol de accesibilidad en vez de anunciarse.
  const grip = document.createElement("span");
  grip.className = "modal-sheet-grip";
  grip.setAttribute("aria-hidden", "true");
  box.appendChild(grip);

  return { overlay, sheet: box };
}

/** Cierra una hoja creada con `createSheetBase`. */
export const closeSheet = closeModal;

/**
 * Hoja de selección: título y secciones de opciones. Es el patrón de
 * «Filtrar» y «Modo de vista» del handoff.
 *
 * @param {string} title
 * @param {Array<{heading?: string, options: Array<{value: string, icon: string, label: string, active?: boolean}>}>} sections
 * @returns {Promise<string|null>} valor elegido, o null si se cierra sin elegir
 */
export function sheetPick(title, sections) {
  return new Promise(function (resolve) {
    const { overlay, sheet } = createSheetBase();

    let html = '<p class="modal-sheet-title">' + title + "</p>" +
               '<div class="modal-sheet-body">';
    sections.forEach(function (sec) {
      if (sec.heading) {
        html += '<p class="modal-sheet-heading">' + sec.heading + "</p>";
      }
      sec.options.forEach(function (o) {
        html +=
          '<button type="button" class="modal-sheet-opt' + (o.active ? " modal-sheet-opt--active" : "") + '"' +
            ' role="menuitemradio" aria-checked="' + (o.active ? "true" : "false") + '"' +
            ' data-value="' + o.value + '">' +
            '<span class="modal-sheet-opt-ico"><i data-lucide="' + o.icon + '"></i></span>' +
            '<span class="modal-sheet-opt-label">' + o.label + "</span>" +
            '<i data-lucide="check" class="modal-sheet-opt-check"></i>' +
          "</button>";
      });
    });
    html += "</div>";

    sheet.insertAdjacentHTML("beforeend", html);
    sheet.querySelector(".modal-sheet-body").setAttribute("role", "menu");
    if (window.lucide) window.lucide.createIcons({ nodes: [sheet] });

    let settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      closeSheet(overlay);
      resolve(value);
    }

    overlay._cancel = function () { finish(null); };
    sheet.addEventListener("click", function (e) {
      const opt = e.target.closest("[data-value]");
      if (opt) finish(opt.dataset.value);
    });

    // Al abrir, el foco va a la opción activa —o a la primera—, igual que
    // los modales enfocan su control principal.
    setTimeout(function () {
      const target = sheet.querySelector(".modal-sheet-opt--active") || sheet.querySelector(".modal-sheet-opt");
      if (target) target.focus();
    }, 50);
  });
}

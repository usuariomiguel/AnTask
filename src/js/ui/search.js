// ═══════════════════════════════════════════════════════════════
// Búsqueda global — paleta de comandos (referencia/v1, SearchPalette)
//
// El módulo no conoce el estado de la app: recibe los datos vía
// callbacks (`getProjects`) y delega la navegación al caller
// (`onNavigateToTask`).
//
// Esto permite usarlo desde el botón "Buscar" de la sidebar,
// el atajo Cmd+K, o el botón del bottom-nav móvil con la misma API.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";
import { escHtml } from "../utils/html.js";
import { t } from "../i18n/index.js";

/** Cuántos resultados se muestran. v1: 7 en reposo, 8 al filtrar. */
const MAX_REPOSO = 7;
const MAX_FILTRO = 8;

/**
 * @typedef {Object} SearchDeps
 * @property {() => Array<any>} getProjects
 * @property {(projectId: string, taskId: string) => void} onNavigateToTask
 */

/**
 * Normaliza para comparar: minúsculas y sin diacríticos, como el
 * `norm()` de v1. Así "titulacion" encuentra "titulación".
 * @param {string} s
 */
function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Envuelve los matches en `<mark>` para resaltar. Escapa HTML. */
function highlightMatch(text, q) {
  const safe = escHtml(text);
  if (!q) return safe;
  // Se busca sobre el texto normalizado pero se resalta sobre el
  // original: si no, "titulacion" no marcaría nada en "titulación".
  const base = norm(safe);
  const needle = norm(q);
  let out = "";
  let i = 0;
  for (;;) {
    const at = base.indexOf(needle, i);
    if (at === -1 || !needle) { out += safe.slice(i); break; }
    out += safe.slice(i, at) + '<mark class="search-hl">' +
           safe.slice(at, at + needle.length) + "</mark>";
    i = at + needle.length;
  }
  return out;
}

/** Aplana todas las tareas de todos los proyectos en una sola lista. */
function recolectar(deps) {
  const out = [];
  (deps.getProjects() || []).forEach(function (project) {
    if (project.archived) return;
    (project.tasks || []).forEach(function (task) {
      out.push({ task: task, project: project });
    });
  });
  return out;
}

/** Filtra por texto de tarea, nombre de lista y notas — como v1. */
function filtrar(todas, q) {
  if (!q) return todas.slice(0, MAX_REPOSO);
  const nq = norm(q);
  return todas.filter(function (r) {
    return norm(r.task.text).includes(nq) ||
           norm(r.project.name).includes(nq) ||
           norm(r.task.comment || "").includes(nq);
  }).slice(0, MAX_FILTRO);
}

/**
 * Abre el modal de búsqueda global.
 *
 * @param {SearchDeps} deps
 */
export function showGlobalSearch(deps) {
  const { overlay, box } = createModalBase();

  // Paleta tipo "spotlight" (prototipo v1): overlay superior + fila con
  // icono de lupa + input sin borde + píldora ESC, resultados y pie.
  overlay.classList.add("modal-overlay--top");
  box.className = "modal-box modal-box-search";
  box.innerHTML =
    '<div class="search-head">' +
      '<i data-lucide="search" class="search-head-ico"></i>' +
      // Patrón combobox: el input mantiene el foco y `aria-activedescendant`
      // apunta a la fila activa, así un lector de pantalla la anuncia al
      // moverse con las flechas sin que el foco salte de sitio.
      '<input class="search-input" type="text" maxlength="100" autocomplete="off"' +
        ' role="combobox" aria-expanded="true" aria-controls="search-results"' +
        ' aria-autocomplete="list" aria-label="' + t("sidebar.search") + '"' +
        ' placeholder="' + t("search.placeholder") + '" />' +
      '<button type="button" class="search-esc" aria-label="' + t("modal.close") + '">esc</button>' +
    '</div>' +
    '<div id="search-results" class="search-results" role="listbox" aria-label="' + t("search.results_aria") + '"></div>' +
    '<div class="search-foot">' +
      '<span class="search-foot-hint">' + t("search.hint_nav") + '</span>' +
      '<span class="search-foot-hint">' + t("search.hint_open") + '</span>' +
      '<span class="search-foot-count" id="search-foot-count"></span>' +
    '</div>';

  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  const input   = box.querySelector(".search-input");
  const results = box.querySelector("#search-results");
  const esc     = box.querySelector(".search-esc");
  const countEl = box.querySelector("#search-foot-count");

  const todas = recolectar(deps);
  /** @type {Array<{task:any,project:any}>} */
  let visibles = [];
  let sel = 0;

  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  esc.addEventListener("click", doClose);

  function abrir(i) {
    const r = visibles[i];
    if (!r) return;
    doClose();
    if (typeof deps.onNavigateToTask === "function") {
      deps.onNavigateToTask(r.project.id, r.task.id);
    }
  }

  /** Marca visualmente la fila activa y la deja a la vista. */
  function pintarSeleccion() {
    const filas = results.querySelectorAll(".search-result-item");
    filas.forEach(function (el, i) {
      const on = i === sel;
      el.classList.toggle("search-result-item--sel", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    const activa = filas[sel];
    if (activa) {
      input.setAttribute("aria-activedescendant", activa.id);
      if (activa.scrollIntoView) activa.scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function pintar(q) {
    visibles = filtrar(todas, q);
    sel = 0;
    results.innerHTML = "";

    if (visibles.length === 0) {
      results.innerHTML = '<p class="search-hint">' + t("search.no_results") +
                          ' <em>' + escHtml(q) + '</em></p>';
      countEl.textContent = "";
      return;
    }

    visibles.forEach(function (r, i) {
      const item = document.createElement("button");
      item.type = "button";
      item.id = "search-opt-" + i;
      item.setAttribute("role", "option");
      item.className = "search-result-item" + (r.task.done ? " search-result-done" : "");
      item.innerHTML =
        '<span class="search-result-check"></span>' +
        '<span class="search-result-text">' + highlightMatch(r.task.text, q) + '</span>' +
        '<span class="search-result-list"></span>' +
        '<i data-lucide="arrow-right" class="search-result-go"></i>';
      item.querySelector(".search-result-list").textContent = r.project.name;
      // El ratón manda sobre el teclado: pasar por encima selecciona,
      // igual que en v1, para que no haya dos "activos" a la vez.
      item.addEventListener("mouseenter", function () { sel = i; pintarSeleccion(); });
      item.addEventListener("click", function () { abrir(i); });
      results.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [results] });
    countEl.textContent = visibles.length === 1
      ? t("search.count_one")
      : t("search.count_other").replace("{n}", String(visibles.length));
    pintarSeleccion();
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { doClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      sel = Math.min(sel + 1, visibles.length - 1);
      pintarSeleccion();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sel = Math.max(sel - 1, 0);
      pintarSeleccion();
    } else if (e.key === "Enter") {
      e.preventDefault();
      abrir(sel);
    }
    // El resto de teclas no salen del modal: fuera esperan los atajos
    // globales de la app y dispararían acciones sobre la lista de detrás.
    e.stopPropagation();
  });

  input.addEventListener("input", function () {
    pintar(input.value.trim());
  });

  // v1 abre con contenido: las primeras tareas, no una caja vacía.
  pintar("");
  setTimeout(function () { input.focus(); }, 50);
}

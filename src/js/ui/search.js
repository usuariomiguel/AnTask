// ═══════════════════════════════════════════════════════════════
// Búsqueda global (proyectos + tareas)
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

/**
 * @typedef {Object} SearchDeps
 * @property {() => Array<any>} getProjects
 * @property {(projectId: string, taskId: string) => void} onNavigateToTask
 */

/** Envuelve los matches en `<mark>` para resaltar. Escapa HTML. */
function highlightMatch(text, q) {
  const safe  = escHtml(text);
  const safeQ = escHtml(q);
  const re    = new RegExp("(" + safeQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  return safe.replace(re, '<mark class="search-hl">$1</mark>');
}

function renderSearchResults(container, q, deps, closeCallback) {
  container.innerHTML = "";
  if (q.length < 2) {
    container.innerHTML = '<p class="search-hint">' + t("search.hint_min_chars") + '</p>';
    return;
  }

  const projects = deps.getProjects() || [];

  const taskGroups = [];
  projects.forEach(function (project) {
    const matches = (project.tasks || []).filter(function (t) {
      return t.text.toLowerCase().includes(q) ||
             (t.comment && t.comment.toLowerCase().includes(q));
    });
    if (matches.length > 0) taskGroups.push({ project: project, tasks: matches });
  });

  const total = taskGroups.reduce(function (s, g) { return s + g.tasks.length; }, 0);

  if (total === 0) {
    container.innerHTML = '<p class="search-hint">' + t("search.no_results") + ' <em>' + escHtml(q) + '</em></p>';
    return;
  }

  // ── Sección tareas ───────────────────────────────────────────
  if (taskGroups.length > 0) {
    const tasksSection = document.createElement("div");
    tasksSection.className = "search-section";
    tasksSection.innerHTML =
      '<div class="search-section-label search-section-label--tasks">' +
        '<i data-lucide="check-square"></i><span>' + t("search.section.tasks") + '</span>' +
      '</div>';

    taskGroups.forEach(function (g) {
      const group = document.createElement("div");
      group.className = "search-group";

      const heading = document.createElement("p");
      heading.className = "search-group-heading";
      if (g.project.color) heading.style.setProperty("--group-color", g.project.color);
      heading.innerHTML =
        '<span class="search-group-dot" style="background:' + (g.project.color || "var(--c-primary-500)") + '"></span>' +
        escHtml(g.project.name);
      group.appendChild(heading);

      g.tasks.forEach(function (task) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "search-result-item" + (task.done ? " search-result-done" : "");

        item.innerHTML =
          '<span class="search-result-check">' +
            (task.done ? '<i data-lucide="check-circle-2"></i>' : '<i data-lucide="circle"></i>') +
          '</span>' +
          '<span class="search-result-text">' + highlightMatch(task.text, q) + '</span>';

        if (task.comment && task.comment.toLowerCase().includes(q)) {
          const snippet = document.createElement("span");
          snippet.className = "search-result-snippet";
          snippet.innerHTML = highlightMatch(task.comment.slice(0, 80), q);
          item.appendChild(snippet);
        }

        item.addEventListener("click", function () {
          closeCallback();
          if (typeof deps.onNavigateToTask === "function") {
            deps.onNavigateToTask(g.project.id, task.id);
          }
        });

        group.appendChild(item);
      });

      tasksSection.appendChild(group);
    });

    container.appendChild(tasksSection);
  }


  if (window.lucide) window.lucide.createIcons({ nodes: [container] });
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
      '<input class="search-input" type="text" maxlength="100" autocomplete="off" placeholder="' + t("search.placeholder") + '" />' +
      '<button type="button" class="search-esc" aria-label="' + t("modal.close") + '">esc</button>' +
    '</div>' +
    '<div id="search-results" class="search-results"></div>' +
    '<div class="search-foot"><span class="search-foot-count" id="search-foot-count"></span></div>';

  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  const input   = box.querySelector(".search-input");
  const results = box.querySelector("#search-results");
  const esc     = box.querySelector(".search-esc");
  const countEl = box.querySelector("#search-foot-count");

  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  esc.addEventListener("click", doClose);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") doClose();
    e.stopPropagation();
  });

  input.addEventListener("input", function () {
    const q = input.value.trim().toLowerCase();
    renderSearchResults(results, q, deps, doClose);
    const n = results.querySelectorAll(".search-result-item").length;
    countEl.textContent = q.length < 2 ? "" :
      (n === 1 ? t("search.count_one") : t("search.count_other").replace("{n}", String(n)));
  });

  setTimeout(function () { input.focus(); }, 50);
}

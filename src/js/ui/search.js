// ═══════════════════════════════════════════════════════════════
// Búsqueda global (proyectos + tareas + notas standalone)
//
// El módulo no conoce el estado de la app: recibe los datos vía
// callbacks (`getProjects`, `getStandaloneNotes`) y delega la
// navegación al caller (`onNavigateToTask`, `onActivateNote`).
//
// Esto permite usarlo desde el botón "Buscar" de la sidebar,
// el atajo Cmd+K, o el botón del bottom-nav móvil con la misma API.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";
import { escHtml } from "../utils/html.js";

/**
 * @typedef {Object} SearchDeps
 * @property {() => Array<any>} getProjects
 * @property {() => Array<any>} getStandaloneNotes
 * @property {(projectId: string, taskId: string) => void} onNavigateToTask
 * @property {(noteId: string) => void} onActivateNote
 */

/** Convierte el HTML de una nota a texto plano (para buscar dentro). */
function noteToPlainText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

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
    container.innerHTML = '<p class="search-hint">Escribe al menos 2 caracteres…</p>';
    return;
  }

  const projects = deps.getProjects() || [];
  const standaloneNotes = deps.getStandaloneNotes() || [];

  const taskGroups = [];
  projects.forEach(function (project) {
    const matches = (project.tasks || []).filter(function (t) {
      return t.text.toLowerCase().includes(q) ||
             (t.comment && t.comment.toLowerCase().includes(q));
    });
    if (matches.length > 0) taskGroups.push({ project: project, tasks: matches });
  });

  const noteMatches = standaloneNotes.filter(function (n) {
    return n.name.toLowerCase().includes(q) ||
           noteToPlainText(n.content).toLowerCase().includes(q);
  });

  const total = taskGroups.reduce(function (s, g) { return s + g.tasks.length; }, 0) + noteMatches.length;

  if (total === 0) {
    container.innerHTML = '<p class="search-hint">Sin resultados para <em>' + escHtml(q) + '</em></p>';
    return;
  }

  // ── Sección tareas ───────────────────────────────────────────
  if (taskGroups.length > 0) {
    const tasksSection = document.createElement("div");
    tasksSection.className = "search-section";
    tasksSection.innerHTML =
      '<div class="search-section-label search-section-label--tasks">' +
        '<i data-lucide="check-square"></i><span>Tareas</span>' +
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

  // ── Sección notas ────────────────────────────────────────────
  if (noteMatches.length > 0) {
    const notesSection = document.createElement("div");
    notesSection.className = "search-section";
    notesSection.innerHTML =
      '<div class="search-section-label search-section-label--notes">' +
        '<i data-lucide="file-text"></i><span>Notas</span>' +
      '</div>';

    noteMatches.forEach(function (note) {
      const plain = noteToPlainText(note.content);
      const item = document.createElement("button");
      item.type = "button";
      item.className = "search-result-item search-result-item--note";

      item.innerHTML =
        '<span class="search-result-check search-result-check--note"><i data-lucide="file-text"></i></span>' +
        '<span class="search-result-text">' + highlightMatch(note.name, q) + '</span>';

      if (plain.toLowerCase().includes(q)) {
        const idx     = plain.toLowerCase().indexOf(q);
        const start   = Math.max(0, idx - 30);
        const excerpt = (start > 0 ? "…" : "") + plain.slice(start, idx + q.length + 40);
        const snippet = document.createElement("span");
        snippet.className = "search-result-snippet";
        snippet.innerHTML = highlightMatch(excerpt, q);
        item.appendChild(snippet);
      }

      item.addEventListener("click", function () {
        closeCallback();
        if (typeof deps.onActivateNote === "function") {
          deps.onActivateNote(note.id);
        }
      });

      notesSection.appendChild(item);
    });

    container.appendChild(notesSection);
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

  box.className = "modal-box modal-box-search";
  box.innerHTML =
    '<p class="modal-label">Buscar en proyectos y notas</p>' +
    '<input class="modal-input" type="text" maxlength="100" autocomplete="off" placeholder="escribe para buscar..." />' +
    '<div id="search-results" class="search-results"></div>' +
    '<div class="modal-actions"><button class="modal-btn modal-btn-cancel">Cerrar</button></div>';

  const input   = box.querySelector(".modal-input");
  const results = box.querySelector("#search-results");
  const cancel  = box.querySelector(".modal-btn-cancel");

  function doClose() { closeModal(overlay); }
  overlay._cancel = doClose;
  cancel.addEventListener("click", doClose);

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") doClose();
    e.stopPropagation();
  });

  input.addEventListener("input", function () {
    const q = input.value.trim().toLowerCase();
    renderSearchResults(results, q, deps, doClose);
  });

  setTimeout(function () { input.focus(); }, 50);
}

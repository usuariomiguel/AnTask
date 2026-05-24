// ═══════════════════════════════════════════════════════════════
// Render de la lista de subtareas de una tarea
//
// Las mutaciones (toggle de checkbox, borrar subtarea) modifican
// directamente `task.subtasks` y luego avisan al caller con
// callbacks.onMutation para que persista (saveAndRender en
// script.js). El edit inline se delega a callbacks.onEditStart
// porque su implementación vive aún en script.js.
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} SubtasksCallbacks
 * @property {() => void} [onMutation] — llamado tras toggle/eliminar
 * @property {(textSpan: HTMLElement, subtask: any) => void} [onEditStart] — dblclick sobre el texto
 */

/**
 * Pinta el `<ul>` de subtareas de una tarea.
 *
 * @param {{subtasks?: Array<{id:string,text:string,done:boolean}>}} task
 * @param {HTMLElement} subtaskList — el `<ul>` destino
 * @param {SubtasksCallbacks} [callbacks]
 */
import { t } from "../i18n/index.js";

export function renderSubtasks(task, subtaskList, callbacks) {
  const cbs = callbacks || {};
  subtaskList.innerHTML = "";

  if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) {
    const li = document.createElement("li");
    li.className = "subtask-empty";
    li.textContent = t("subtask.empty");
    subtaskList.appendChild(li);
    return;
  }

  task.subtasks.forEach(function (subtask) {
    const item = document.createElement("li");
    item.className = "subtask-item";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "subtask-checkbox";
    cb.checked = subtask.done;
    cb.addEventListener("change", function () {
      subtask.done = cb.checked;
      if (typeof cbs.onMutation === "function") cbs.onMutation();
    });

    const span = document.createElement("span");
    span.className = "subtask-text";
    span.textContent = subtask.text;
    span.classList.toggle("done", subtask.done);
    span.title = t("task.rename_hint");
    span.addEventListener("dblclick", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof cbs.onEditStart === "function") cbs.onEditStart(span, subtask);
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "subtask-delete-btn";
    del.innerHTML = '<i data-lucide="x"></i>';
    del.setAttribute("aria-label", t("subtask.delete_aria"));
    del.addEventListener("click", function () {
      task.subtasks = task.subtasks.filter(function (s) { return s.id !== subtask.id; });
      if (typeof cbs.onMutation === "function") cbs.onMutation();
    });

    item.append(cb, span, del);
    subtaskList.appendChild(item);
  });
}

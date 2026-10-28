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

// Con muchas subtareas la lista se hacía larguísima: como las listas de
// la barra lateral, se ven las primeras SUBTAREAS_VISIBLES y un «Mostrar
// N más». Solo a partir de dos ocultas (un «Mostrar 1 más» ocupa lo mismo
// que la subtarea). Lo desplegado se recuerda por tarea durante la sesión.
const SUBTAREAS_VISIBLES = 5;
/** Ids de las tareas con todas sus subtareas a la vista. */
const _desplegadas = new Set();

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

  const total = task.subtasks.length;
  const plegable = total > SUBTAREAS_VISIBLES + 1;
  const todas = !plegable || _desplegadas.has(task.id);
  const visibles = todas ? task.subtasks : task.subtasks.slice(0, SUBTAREAS_VISIBLES);

  visibles.forEach(function (subtask) {
    const item = document.createElement("li");
    item.className = "subtask-item";
    // La lista se rehace entera en cada repintado: el id permite saber qué
    // fila es nueva, cuál se ha ido y cuál ha cambiado (ver _animarSubtareas).
    item.dataset.subtaskId = subtask.id;
    item.dataset.subtaskDone = subtask.done ? "1" : "0";

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

  if (plegable) subtaskList.appendChild(botonMas(task, subtaskList, cbs, todas, total - SUBTAREAS_VISIBLES));
}

/** «Mostrar N más» / «Mostrar menos» al pie de la lista. */
function botonMas(task, subtaskList, cbs, abierto, ocultas) {
  const li = document.createElement("li");
  li.className = "subtask-more";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "subtask-more-btn";
  btn.setAttribute("aria-expanded", String(abierto));
  btn.innerHTML = '<i data-lucide="' + (abierto ? "chevron-up" : "chevron-down") + '"></i><span></span>';
  btn.querySelector("span").textContent = abierto
    ? t("sidebar.show_less")
    : t("sidebar.show_more").replace("{n}", String(ocultas));
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (abierto) _desplegadas.delete(task.id);
    else _desplegadas.add(task.id);
    renderSubtasks(task, subtaskList, cbs);
    if (window.lucide) window.lucide.createIcons({ nodes: [subtaskList] });
    const otra = subtaskList.querySelector(".subtask-more-btn");
    if (otra) otra.focus();
    // Las que aparecen entran escalonadas con un fundido.
    if (abierto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    subtaskList.querySelectorAll(".subtask-item").forEach(function (el, i) {
      if (i < SUBTAREAS_VISIBLES) return;
      el.animate([{ opacity: 0, transform: "translateY(-4px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 200, delay: Math.min((i - SUBTAREAS_VISIBLES) * 25, 150), easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" });
    });
  });
  li.appendChild(btn);
  return li;
}

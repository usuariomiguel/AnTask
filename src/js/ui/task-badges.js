// ═══════════════════════════════════════════════════════════════
// Badges visuales de una tarea (prioridad, fecha, recurrencia)
//
// Funciones puras de DOM: reciben (node, task) y mutan ese elemento.
// No acceden a globals ni disparan re-renders — eso lo decide el
// caller en script.js.
// ═══════════════════════════════════════════════════════════════

import { getDueDateState } from "../utils/date.js";
import { projectColor } from "../utils/project-color.js";
import { t } from "../i18n/index.js";

// ─── PRIORIDAD ──────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  high:   { label: () => t("priority.high"),   cls: "priority-high",   short: "H" },
  medium: { label: () => t("priority.medium"), cls: "priority-medium", short: "M" },
  low:    { label: () => t("priority.low"),    cls: "priority-low",    short: "L" },
};

export function applyPriorityToNode(node, task) {
  node.classList.remove("priority-high", "priority-medium", "priority-low");
  if (!task.priority) return;
  node.classList.add("priority-" + task.priority);
}

// ─── LISTA (proyecto) ───────────────────────────────────────
/**
 * Etiqueta con la lista a la que pertenece la tarea — el `LabelTag` del
 * prototipo v1. Solo se pinta cuando la fila NO va bajo una cabecera de
 * grupo que ya diga la lista (Inbox plano, bloque de completadas); en la
 * vista de un proyecto sería redundante.
 */
export function renderListBadge(project, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!project) return;
  const badge = document.createElement("span");
  badge.className = "task-list-badge";
  badge.textContent = project.name;
  badge.title = t("task.in_list") + ": " + project.name;
  // Color efectivo: las listas sin color elegido —las importadas de un
  // .json— también tienen el suyo, derivado del id.
  badge.style.setProperty("--proj-color", projectColor(project));
  container.appendChild(badge);
}

// ─── FECHA LÍMITE ───────────────────────────────────────────
export function renderDueBadge(task, container) {
  const existing = container.querySelector(".due-badge");
  if (existing) existing.remove();
  if (task.done || !task.dueDate) return;
  const state = getDueDateState(task.dueDate);
  if (!state) return;
  const badge = document.createElement("span");
  badge.className = "due-badge " + state.cls;
  // Como el `DueChip` de v1: icono de calendario + fecha relativa, y la
  // hora colgando detrás con separador ("Hoy · 11:30").
  const label = state.label + (task.dueTime ? " · " + task.dueTime : "");
  // Vencida: pulsable — mueve la tarea a hoy sin abrir el detalle
  // (mismo atajo que el prototipo v1 en la fila de tarea).
  if (state.cls === "due-overdue") {
    badge.classList.add("due-badge--action");
    badge.dataset.dueAction = "move-today";
    badge.title = t("hoy.move_one");
    badge.innerHTML = '<i data-lucide="calendar"></i><span class="due-badge-label"></span>' +
                      '<i data-lucide="arrow-right" class="due-badge-arrow"></i>';
  } else {
    badge.innerHTML = '<i data-lucide="calendar"></i><span class="due-badge-label"></span>';
  }
  badge.querySelector(".due-badge-label").textContent = label;
  container.appendChild(badge);
}

// ─── RECURRENCIA ────────────────────────────────────────────
export function renderRecurBadge(task, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!task.recurDays) return;
  const badge = document.createElement("span");
  badge.className = "recur-badge";
  badge.title = t("detail.recur");
  badge.innerHTML = '<i data-lucide="repeat"></i><span class="recur-badge-label"></span>';
  badge.querySelector(".recur-badge-label").textContent = task.recurDays + "d";
  container.appendChild(badge);
}

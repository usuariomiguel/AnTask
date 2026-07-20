// ═══════════════════════════════════════════════════════════════
// Badges visuales de una tarea (prioridad, fecha, recurrencia)
//
// Funciones puras de DOM: reciben (node, task) y mutan ese elemento.
// No acceden a globals ni disparan re-renders — eso lo decide el
// caller en script.js.
// ═══════════════════════════════════════════════════════════════

import { getDueDateState } from "../utils/date.js";
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

// ─── FECHA LÍMITE ───────────────────────────────────────────
export function renderDueBadge(task, container) {
  const existing = container.querySelector(".due-badge");
  if (existing) existing.remove();
  if (task.done || !task.dueDate) return;
  const state = getDueDateState(task.dueDate);
  if (!state) return;
  const badge = document.createElement("span");
  badge.className = "due-badge " + state.cls;
  // Vencida: pulsable — mueve la tarea a hoy sin abrir el detalle
  // (mismo atajo que el prototipo v1 en la fila de tarea).
  if (state.cls === "due-overdue") {
    badge.classList.add("due-badge--action");
    badge.dataset.dueAction = "move-today";
    badge.title = t("hoy.move_one");
    badge.innerHTML = state.label + ' <i data-lucide="arrow-right"></i>';
  } else {
    badge.textContent = state.label;
  }
  container.appendChild(badge);
}

// ─── RECURRENCIA ────────────────────────────────────────────
export function renderRecurBadge(task, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!task.recurDays) return;
  const badge = document.createElement("span");
  badge.className = "recur-badge";
  badge.innerHTML = '<i data-lucide="repeat"></i> ' + task.recurDays + 'd';
  container.appendChild(badge);
}

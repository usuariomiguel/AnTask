// ═══════════════════════════════════════════════════════════════
// Badges y estados visuales de una tarea
//
// Funciones puras de DOM: reciben (node | btn, task) y mutan ese
// elemento. No acceden a globals ni disparan re-renders.
// El ciclo de estados (cycleStatus/cyclePriority) sigue en
// script.js porque llama a saveAndRender(); aquí solo viven los
// constants y los pintores.
// ═══════════════════════════════════════════════════════════════

import { getDueDateState } from "../utils/date.js";
import { t } from "../i18n/index.js";

// ─── ESTADO ─────────────────────────────────────────────────
export const STATUS_CYCLE = [null, "progress", "waiting"];
export const STATUS_CONFIG = {
  progress: { label: () => t("status.progress"), cls: "status-progress" },
  waiting:  { label: () => t("status.waiting"),  cls: "status-waiting" },
};

export function applyStatusToNode(node, task) {
  node.classList.remove("status-progress", "status-waiting");
  if (task.done || !task.status) return;
  node.classList.add("status-" + task.status);
}

export function updateStatusBtn(btn, task) {
  if (task.done || !task.status) {
    btn.innerHTML = '<i data-lucide="circle-dashed"></i> ' + t("task_btn.status");
    btn.className = "status-btn";
  } else {
    const icons = { progress: "play-circle", waiting: "pause-circle" };
    const cfg = STATUS_CONFIG[task.status];
    btn.innerHTML = '<i data-lucide="' + (icons[task.status] || "circle-dashed") + '"></i> ' + cfg.label();
    btn.className = "status-btn " + cfg.cls + "-btn";
  }
}

// ─── PRIORIDAD ──────────────────────────────────────────────
export const PRIORITY_CYCLE  = [null, "high", "medium", "low"];
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

export function updatePriorityBtn(btn, task) {
  if (!task.priority) {
    btn.innerHTML = '<i data-lucide="flag"></i>';
    btn.className = "priority-btn";
  } else {
    const cfg = PRIORITY_CONFIG[task.priority];
    btn.innerHTML = cfg.label();
    btn.className = "priority-btn " + cfg.cls + "-btn";
  }
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
  badge.textContent = state.label;
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

export function updateRecurBtn(btn, task) {
  if (!btn) return;
  btn.classList.toggle("recur-active", Boolean(task.recurDays));
  btn.title = task.recurDays
    ? t("modal_recur.title") + " " + task.recurDays + "d"
    : t("task.recur_set");
}

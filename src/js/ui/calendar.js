// ═══════════════════════════════════════════════════════════════
// Vista Calendario mensual
//
// `renderCalendar` recibe el año/mes a pintar, la lista actual de
// proyectos (para extraer las tareas con `dueDate` que caen en ese
// mes) y un callback `onActivateProject(projectId)` para cuando el
// usuario hace clic en un chip o en un proyecto del detalle.
//
// Lee `#cal-content` y `#cal-month-label` del DOM y rellena la
// rejilla mensual. Las celdas con tareas muestran:
//   - puntitos (móvil) por tarea/prioridad
//   - chips de texto (desktop) con título y proyecto
//   - clic abre el panel de detalle del día con la lista completa
// ═══════════════════════════════════════════════════════════════

import { t, getLang } from "../i18n/index.js";

function getMonthNames() {
  return [1,2,3,4,5,6,7,8,9,10,11,12].map(function (n) { return t("calendar.month." + n); });
}

function getDayHeaders() {
  return ["mon","tue","wed","thu","fri","sat","sun"].map(function (k) { return t("calendar.day." + k); });
}

/**
 * Pinta la rejilla del calendario para un mes concreto.
 *
 * @param {number} year
 * @param {number} month  0..11
 * @param {Array<{id:string,name:string,tasks?:Array}>} projects
 * @param {(projectId: string) => void} onActivateProject
 */
export function renderCalendar(year, month, projects, onActivateProject) {
  const content    = document.getElementById("cal-content");
  const monthLabel = document.getElementById("cal-month-label");
  if (!content) return;

  const MONTH_NAMES = getMonthNames();
  if (monthLabel) monthLabel.textContent = MONTH_NAMES[month] + " " + year;

  // Recopilar tareas con dueDate dentro del mes (incluyendo hechas)
  const tasksByDay = {};
  projects.forEach(function (project) {
    (project.tasks || []).forEach(function (task) {
      if (!task.dueDate) return;
      const tYear  = parseInt(task.dueDate.slice(0, 4), 10);
      const tMonth = parseInt(task.dueDate.slice(5, 7), 10) - 1;
      if (tYear !== year || tMonth !== month) return;
      const key = task.dueDate;
      if (!tasksByDay[key]) tasksByDay[key] = [];
      tasksByDay[key].push({ task: task, project: project });
    });
  });

  content.innerHTML = "";

  // Cabecera de días de la semana
  const headerRow = document.createElement("div");
  headerRow.className = "cal-day-headers";
  getDayHeaders().forEach(function (d) {
    const el = document.createElement("div");
    el.className = "cal-day-header";
    el.textContent = d;
    headerRow.appendChild(el);
  });
  content.appendChild(headerRow);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  // Offset para empezar en lunes
  const startDow    = firstDay.getDay();
  const startOffset = startDow === 0 ? 6 : startDow - 1;

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  // Días del mes anterior (relleno)
  const prevLast = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    grid.appendChild(buildCalCell(null, prevLast - i, true, [], today, false, onActivateProject));
  }

  // Días del mes actual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr  = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const cellDate = new Date(year, month, d);
    const isToday  = cellDate.getTime() === today.getTime();
    grid.appendChild(buildCalCell(dateStr, d, false, tasksByDay[dateStr] || [], today, isToday, onActivateProject));
  }

  // Relleno al final hasta completar la última semana
  const totalCells = startOffset + lastDay.getDate();
  const tail       = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= tail; i++) {
    grid.appendChild(buildCalCell(null, i, true, [], today, false, onActivateProject));
  }

  content.appendChild(grid);

  if (window.lucide) window.lucide.createIcons();
}

function buildCalCell(dateStr, dayNum, isOther, taskItems, _today, isToday, onActivateProject) {
  const cell = document.createElement("div");
  cell.className = "cal-cell";
  if (isOther) cell.classList.add("cal-cell-other");
  if (isToday) cell.classList.add("cal-cell-today");
  if (!isOther && taskItems.length > 0) cell.classList.add("cal-cell-has-tasks");
  if (dateStr) cell.dataset.calDate = dateStr;

  const numEl = document.createElement("span");
  numEl.className = "cal-cell-num";
  numEl.textContent = dayNum;
  cell.appendChild(numEl);

  if (!isOther && taskItems.length > 0) {
    // Dots row (móvil)
    const dotsRow = document.createElement("div");
    dotsRow.className = "cal-dots";
    const MAX_DOTS = 5;
    taskItems.slice(0, MAX_DOTS).forEach(function (item) {
      const dot = document.createElement("span");
      dot.className = "cal-dot" +
        (item.task.priority ? " cal-dot-" + item.task.priority : "") +
        (item.task.done ? " cal-dot-done" : "");
      dotsRow.appendChild(dot);
    });
    if (taskItems.length > MAX_DOTS) {
      const xtra = document.createElement("span");
      xtra.className = "cal-dot-extra";
      xtra.textContent = "+" + (taskItems.length - MAX_DOTS);
      dotsRow.appendChild(xtra);
    }
    cell.appendChild(dotsRow);

    // Chips (desktop)
    const MAX = 3;
    const visible  = taskItems.slice(0, MAX);
    const overflow = taskItems.length - MAX;

    visible.forEach(function (item) {
      const chip = document.createElement("div");
      chip.className = "cal-task-chip";
      if (item.task.priority) chip.classList.add("cal-chip-" + item.task.priority);
      if (item.task.done)     chip.classList.add("cal-chip-done");
      chip.textContent = item.task.text;
      chip.title = item.task.text + " — " + item.project.name;
      chip.addEventListener("click", function (e) {
        e.stopPropagation();
        if (typeof onActivateProject === "function") onActivateProject(item.project.id);
      });
      cell.appendChild(chip);
    });

    if (overflow > 0) {
      const more = document.createElement("div");
      more.className = "cal-task-more";
      more.textContent = "+" + overflow + " " + t("calendar.more");
      cell.appendChild(more);
    }

    // Clic en la celda → panel de detalle del día
    cell.addEventListener("click", function () {
      showCalDayDetail(dateStr, taskItems, cell, onActivateProject);
    });
  }

  return cell;
}

function showCalDayDetail(dateStr, taskItems, cellEl, onActivateProject) {
  const content = document.getElementById("cal-content");
  if (!content) return;

  // Limpia selección visual de cualquier otra celda
  content.querySelectorAll(".cal-cell-selected").forEach(function (c) {
    c.classList.remove("cal-cell-selected");
  });

  // Toggle: re-tap del mismo día cierra el panel
  const existing = content.querySelector(".cal-day-detail");
  if (existing) {
    const wasDate = existing.dataset.detailDate;
    existing.remove();
    if (wasDate === dateStr) return;
  }

  if (cellEl) cellEl.classList.add("cal-cell-selected");

  const due    = new Date(dateStr + "T00:00:00");
  const detail = document.createElement("div");
  detail.className          = "cal-day-detail";
  detail.dataset.detailDate = dateStr;

  const titleEl = document.createElement("div");
  titleEl.className   = "cal-day-detail-title";
  const locale = getLang() === "en" ? "en-GB" : "es-ES";
  titleEl.textContent = due.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  detail.appendChild(titleEl);

  const list = document.createElement("ul");
  list.className = "cal-day-detail-list";

  taskItems.forEach(function (item) {
    const li = document.createElement("li");
    li.className = "cal-day-detail-item";
    if (item.task.priority) li.classList.add("cal-detail-priority-" + item.task.priority);
    if (item.task.done)     li.classList.add("cal-detail-done");

    const left = document.createElement("div");
    left.className = "cal-day-detail-left";

    const dot = document.createElement("span");
    dot.className = "cal-day-detail-dot";

    const textEl = document.createElement("span");
    textEl.className   = "cal-day-detail-text";
    textEl.textContent = item.task.text;

    left.appendChild(dot);
    left.appendChild(textEl);

    const projEl = document.createElement("span");
    projEl.className   = "cal-day-detail-proj";
    projEl.textContent = item.project.name;

    li.appendChild(left);
    li.appendChild(projEl);

    li.addEventListener("click", function () {
      if (typeof onActivateProject === "function") onActivateProject(item.project.id);
    });

    list.appendChild(li);
  });

  detail.appendChild(list);
  content.appendChild(detail);
  setTimeout(function () { detail.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50);
}

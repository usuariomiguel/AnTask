// ═══════════════════════════════════════════════════════════════
// Vista Agenda — tareas con fecha límite agrupadas por urgencia
//
// Agrupa todas las tareas pendientes con `dueDate` en 4 cubos:
//   - vencidas (diff < 0)
//   - hoy (diff === 0)
//   - esta semana (diff 1..7)
//   - más adelante (diff > 7)
//
// Recibe `projects` (lista actual) y `onActivateProject(id)` para
// el clic sobre una tarea (lleva al proyecto al que pertenece).
// ═══════════════════════════════════════════════════════════════

const GROUP_DEFS = [
  { key: "overdue", label: "Vencidas" },
  { key: "today",   label: "Hoy" },
  { key: "week",    label: "Esta semana" },
  { key: "later",   label: "Más adelante" },
];

/**
 * Pinta la agenda dentro de `#agenda-content`.
 *
 * @param {Array<{id:string,name:string,tasks?:Array}>} projects
 * @param {(projectId: string) => void} onActivateProject
 */
export function renderAgenda(projects, onActivateProject) {
  const content = document.getElementById("agenda-content");
  if (!content) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const groups = { overdue: [], today: [], week: [], later: [] };

  projects.forEach(function (project) {
    (project.tasks || []).forEach(function (task) {
      if (!task.dueDate || task.done) return;
      const due  = new Date(task.dueDate + "T00:00:00");
      const diff = Math.floor((due - today) / 86400000);
      const key  = diff < 0 ? "overdue"
                 : diff === 0 ? "today"
                 : diff <= 7 ? "week"
                 : "later";
      groups[key].push({ task: task, project: project });
    });
  });

  ["overdue", "today", "week", "later"].forEach(function (key) {
    groups[key].sort(function (a, b) {
      return a.task.dueDate < b.task.dueDate ? -1 : a.task.dueDate > b.task.dueDate ? 1 : 0;
    });
  });

  content.innerHTML = "";

  const total = groups.overdue.length + groups.today.length + groups.week.length + groups.later.length;

  if (total === 0) {
    const empty = document.createElement("div");
    empty.className = "agenda-empty";
    const icon = document.createElement("span");
    icon.className = "agenda-empty-icon";
    icon.textContent = "⏱";
    const msg = document.createElement("p");
    msg.textContent = "No hay tareas con fecha límite pendientes";
    empty.appendChild(icon);
    empty.appendChild(msg);
    content.appendChild(empty);
    return;
  }

  GROUP_DEFS.forEach(function (def) {
    const items = groups[def.key];
    if (!items.length) return;

    const section = document.createElement("div");
    section.className = "agenda-group agenda-group-" + def.key;

    const header = document.createElement("div");
    header.className = "agenda-group-header";

    const labelEl = document.createElement("span");
    labelEl.className = "agenda-group-label";
    labelEl.textContent = def.label;

    const countEl = document.createElement("span");
    countEl.className = "agenda-group-count";
    countEl.textContent = items.length;

    header.appendChild(labelEl);
    header.appendChild(countEl);
    section.appendChild(header);

    const list = document.createElement("ul");
    list.className = "agenda-task-list";

    items.forEach(function (item) {
      list.appendChild(buildAgendaTaskItem(item.task, item.project, today, onActivateProject));
    });

    section.appendChild(list);
    content.appendChild(section);
  });
}

function buildAgendaTaskItem(task, project, today, onActivateProject) {
  const due  = new Date(task.dueDate + "T00:00:00");
  const diff = Math.floor((due - today) / 86400000);

  const dateLabel = diff === 0  ? "Hoy"
    : diff === 1  ? "Mañana"
    : diff === -1 ? "Ayer"
    : due.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  const li = document.createElement("li");
  li.className = "agenda-task-item";
  if (task.priority) li.classList.add("agenda-priority-" + task.priority);

  const main = document.createElement("div");
  main.className = "agenda-task-main";

  const textEl = document.createElement("span");
  textEl.className = "agenda-task-text";
  textEl.textContent = task.text;
  main.appendChild(textEl);

  const badges = document.createElement("div");
  badges.className = "agenda-task-badges";

  if (task.priority) {
    const pb = document.createElement("span");
    pb.className = "agenda-badge agenda-badge-priority agenda-badge-" + task.priority;
    pb.textContent = task.priority === "high" ? "Alta"
      : task.priority === "medium" ? "Media" : "Baja";
    badges.appendChild(pb);
  }

  if (task.status) {
    const sb = document.createElement("span");
    sb.className = "agenda-badge agenda-badge-status agenda-badge-" + task.status;
    sb.textContent = task.status === "progress" ? "Progreso" : "Espera";
    badges.appendChild(sb);
  }

  const projBadge = document.createElement("span");
  projBadge.className = "agenda-badge agenda-badge-project";
  projBadge.textContent = project.name;
  badges.appendChild(projBadge);

  const dateEl = document.createElement("span");
  dateEl.className = "agenda-badge agenda-badge-date";
  dateEl.textContent = dateLabel;
  badges.appendChild(dateEl);

  main.appendChild(badges);
  li.appendChild(main);

  li.addEventListener("click", function () {
    if (typeof onActivateProject === "function") onActivateProject(project.id);
  });

  return li;
}

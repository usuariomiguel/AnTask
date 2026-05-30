// ═══════════════════════════════════════════════════════════════
// Plantillas de proyecto + galería de selección
//
// Cada template define un conjunto de tareas con fechas relativas
// (dueOffset = días desde la creación del proyecto), prioridad y
// recurrencia opcionales. Al aplicar el template, los offsets se
// convierten en fechas absolutas tomando como base "hoy".
//
// Los textos visibles (nombre, descripción, tareas) NO viven aquí:
// se resuelven dinámicamente vía t() para soportar i18n. Cada
// template lleva una `id` que coincide con el prefijo de claves
// (tpl.<id>.name, tpl.<id>.desc, tpl.<id>.task.N).
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";
import { escHtml } from "../utils/html.js";
import { t } from "../i18n/index.js";

/**
 * @typedef {object} TemplateTaskSpec
 * @property {number}                       [dueOffset]   - Días desde hoy hasta el dueDate
 * @property {"high"|"medium"|"low"}        [priority]
 * @property {number}                       [recurDays]
 */

/**
 * @typedef {object} ProjectTemplate
 * @property {string}              id
 * @property {string}              icon
 * @property {string}              [color]
 * @property {TemplateTaskSpec[]}  tasks
 */

/** @type {ProjectTemplate[]} */
export const PROJECT_TEMPLATES = [
  {
    id:    "moving",
    icon:  "🏠",
    color: "#f97316",
    tasks: [
      { dueOffset: 3,  priority: "high"   },
      { dueOffset: 7                      },
      { dueOffset: 10                     },
      { dueOffset: 14                     },
      { dueOffset: 17                     },
      { dueOffset: 20                     },
      { dueOffset: 14                     },
      { dueOffset: 25                     },
      { dueOffset: 21, priority: "high"   },
      { dueOffset: 22                     },
      { dueOffset: 21, priority: "medium" },
    ],
  },
  {
    id:    "trip",
    icon:  "✈️",
    color: "#3b82f6",
    tasks: [
      { dueOffset: 60, priority: "high" },
      { dueOffset: 50, priority: "high" },
      { dueOffset: 40 },
      { dueOffset: 30 },
      { dueOffset: 14 },
      { dueOffset: 7  },
      { dueOffset: 2  },
      { dueOffset: 1,  priority: "high" },
      { dueOffset: 1  },
    ],
  },
  {
    id:    "new-job",
    icon:  "💼",
    color: "#8b5cf6",
    tasks: [
      { dueOffset: 0,  priority: "high" },
      { dueOffset: 2  },
      { dueOffset: 7  },
      { dueOffset: 10 },
      { dueOffset: 5  },
      { dueOffset: 3,  priority: "high" },
      { dueOffset: 4  },
      { dueOffset: 30 },
    ],
  },
  {
    id:    "course",
    icon:  "🎓",
    color: "#22c55e",
    tasks: [
      { priority: "high" },
      { dueOffset: 3 },
      { dueOffset: 5 },
      { recurDays: 2 },
      { recurDays: 7 },
      { dueOffset: 30 },
    ],
  },
  {
    id:    "event",
    icon:  "🎉",
    color: "#ec4899",
    tasks: [
      { dueOffset: 0,  priority: "high" },
      { dueOffset: 3  },
      { dueOffset: 7  },
      { dueOffset: 14 },
      { dueOffset: 21 },
      { dueOffset: 25 },
      { dueOffset: 30, priority: "high" },
      { dueOffset: 31 },
    ],
  },
  {
    id:    "health",
    icon:  "🏥",
    color: "#06b6d4",
    tasks: [
      { dueOffset: 0,  priority: "high" },
      { dueOffset: 3  },
      { dueOffset: 7  },
      { dueOffset: 14 },
      { dueOffset: 21 },
      { recurDays: 365 },
    ],
  },
];

// `id` -> prefijo de clave i18n. "new-job" usa "newjob" para
// evitar guiones en los identificadores de claves.
function tplKeyPrefix(id) {
  return id === "new-job" ? "newjob" : id;
}

function tplName(tpl)        { return t("tpl." + tplKeyPrefix(tpl.id) + ".name"); }
function tplDesc(tpl)        { return t("tpl." + tplKeyPrefix(tpl.id) + ".desc"); }
function tplTaskText(tpl, i) { return t("tpl." + tplKeyPrefix(tpl.id) + ".task." + i); }

/** Convierte un dueOffset (días desde hoy) a fecha ISO YYYY-MM-DD. */
function offsetToISO(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/**
 * Aplica un template y devuelve un array de specs de tarea listos
 * para insertar (con dueDates absolutos calculados desde hoy).
 *
 * @param {ProjectTemplate} template
 * @returns {Array<{text:string, priority:string|null, dueDate:string|null, recurDays:number|null}>}
 */
export function buildTasksFromTemplate(template) {
  return template.tasks.map(function (spec, i) {
    return {
      text:      tplTaskText(template, i),
      priority:  spec.priority  || null,
      dueDate:   typeof spec.dueOffset === "number" ? offsetToISO(spec.dueOffset) : null,
      recurDays: spec.recurDays || null,
    };
  });
}

/** Devuelve el nombre traducido (para mostrar en cabeceras externas). */
export function getTemplateName(template) { return tplName(template); }

/**
 * Abre la galería de templates. El caller decide qué hacer:
 *   - onPickBlank() — al elegir "Proyecto en blanco"
 *   - onPickTemplate(template) — al elegir una plantilla
 *
 * @param {{ onPickBlank: () => void, onPickTemplate: (t: ProjectTemplate) => void }} deps
 */
export function showProjectTemplatesModal(deps) {
  const { overlay, box } = createModalBase();
  box.className = "modal-box modal-box-templates";

  function metaTasks(n) {
    return (n === 1 ? t("tpl.meta.tasks_one") : t("tpl.meta.tasks_other")).replace("{count}", String(n));
  }

  // Card especial "En blanco" como primera opción
  const blankCard =
    '<button type="button" class="tpl-card tpl-card-blank" data-tpl-id="__blank__">' +
      '<span class="tpl-icon">📄</span>' +
      '<span class="tpl-name">' + escHtml(t("tpl.blank.name")) + '</span>' +
      '<span class="tpl-meta">' + escHtml(t("tpl.blank.meta")) + '</span>' +
    '</button>';

  const templateCards = PROJECT_TEMPLATES.map(function (tpl) {
    const colorStyle = tpl.color ? ' style="--tpl-color: ' + tpl.color + '"' : "";
    return '<button type="button" class="tpl-card" data-tpl-id="' + tpl.id + '"' + colorStyle + '>' +
      '<span class="tpl-icon">' + tpl.icon + '</span>' +
      '<span class="tpl-name">' + escHtml(tplName(tpl)) + '</span>' +
      '<span class="tpl-meta">' + escHtml(metaTasks(tpl.tasks.length)) + '</span>' +
    '</button>';
  }).join("");

  box.innerHTML =
    '<div class="modal-icon"><span class="tpl-preview-icon">✨</span></div>' +
    '<p class="modal-label">' + t("tpl.modal.title") + '</p>' +
    '<p class="modal-sub">' + t("tpl.modal.sub") + '</p>' +
    '<div class="tpl-grid">' + blankCard + templateCards + '</div>' +
    '<div class="modal-actions">' +
      '<button type="button" class="modal-btn modal-btn-cancel">' + t("modal.cancel") + '</button>' +
    '</div>';

  if (window.lucide) window.lucide.createIcons({ nodes: [box] });

  function doCancel() { closeModal(overlay); }
  overlay._cancel = doCancel;
  box.querySelector(".modal-btn-cancel").addEventListener("click", doCancel);

  box.querySelectorAll(".tpl-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const id = card.dataset.tplId;
      closeModal(overlay);
      if (id === "__blank__") {
        if (typeof deps.onPickBlank === "function") deps.onPickBlank();
      } else {
        const tpl = PROJECT_TEMPLATES.find(function (t) { return t.id === id; });
        if (tpl && typeof deps.onPickTemplate === "function") deps.onPickTemplate(tpl);
      }
    });
  });
}

/**
 * Modal de preview de una plantilla: muestra el nombre editable y
 * la lista de tareas que se van a crear. Devuelve el nombre final
 * o null si el usuario cancela.
 *
 * @param {ProjectTemplate} template
 * @returns {Promise<string|null>}
 */
export function showTemplatePreview(template) {
  return new Promise(function (resolve) {
    const { overlay, box } = createModalBase();
    box.className = "modal-box modal-box-tpl-preview";

    const tasksHTML = template.tasks.map(function (spec, i) {
      const priorityChip = spec.priority
        ? '<span class="tpl-task-prio tpl-task-prio-' + spec.priority + '">' +
            t("tpl.prio." + spec.priority) +
          '</span>'
        : "";
      const dueChip = (typeof spec.dueOffset === "number")
        ? '<span class="tpl-task-due">' +
            (spec.dueOffset === 0 ? t("tpl.chip.today") :
             spec.dueOffset === 1 ? t("tpl.chip.tomorrow") :
             t("tpl.chip.in_days").replace("{n}", String(spec.dueOffset))) +
          '</span>'
        : "";
      const recurChip = spec.recurDays
        ? '<span class="tpl-task-recur">' + t("tpl.chip.recur").replace("{n}", String(spec.recurDays)) + '</span>'
        : "";
      return '<li class="tpl-task-row">' +
        '<span class="tpl-task-text">' + escHtml(tplTaskText(template, i)) + '</span>' +
        '<span class="tpl-task-chips">' + dueChip + priorityChip + recurChip + '</span>' +
      '</li>';
    }).join("");

    const tplLocalizedName = tplName(template);
    const countLabel = (template.tasks.length === 1
      ? t("tpl.preview.tasks_count_one")
      : t("tpl.preview.tasks_count_other")).replace("{count}", String(template.tasks.length));

    box.innerHTML =
      '<div class="modal-icon"><span class="tpl-preview-icon">' + template.icon + '</span></div>' +
      '<p class="modal-label">' + escHtml(tplLocalizedName) + '</p>' +
      '<p class="modal-sub">' + escHtml(tplDesc(template)) + '</p>' +
      '<input class="modal-input tpl-name-input" type="text" maxlength="60"' +
        ' value="' + escHtml(tplLocalizedName) + '" placeholder="' + escHtml(t("tpl.preview.name_placeholder")) + '" />' +
      '<div class="tpl-tasks-preview-wrap">' +
        '<p class="tpl-tasks-preview-label">' + escHtml(countLabel) + '</p>' +
        '<ul class="tpl-tasks-preview">' + tasksHTML + '</ul>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="modal-btn modal-btn-cancel">' + t("tpl.preview.back") + '</button>' +
        '<button type="button" class="modal-btn modal-btn-confirm">' + t("tpl.preview.confirm") + '</button>' +
      '</div>';

    const input   = box.querySelector(".tpl-name-input");
    const confirm = box.querySelector(".modal-btn-confirm");
    const cancel  = box.querySelector(".modal-btn-cancel");

    function doConfirm() {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      closeModal(overlay);
      resolve(name);
    }
    function doCancel() { closeModal(overlay); resolve(null); }

    overlay._cancel = doCancel;
    confirm.addEventListener("click", doConfirm);
    cancel.addEventListener("click",  doCancel);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter")  doConfirm();
      if (e.key === "Escape") doCancel();
    });

    setTimeout(function () { input.focus(); input.select(); }, 50);
  });
}

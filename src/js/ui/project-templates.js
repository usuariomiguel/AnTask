// ═══════════════════════════════════════════════════════════════
// Plantillas de proyecto + galería de selección
//
// Cada template define un conjunto de tareas con fechas relativas
// (dueOffset = días desde la creación del proyecto), prioridad y
// recurrencia opcionales. Al aplicar el template, los offsets se
// convierten en fechas absolutas tomando como base "hoy".
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal, modalPrompt } from "./modal.js";
import { escHtml } from "../utils/html.js";

/**
 * @typedef {object} TemplateTaskSpec
 * @property {string}                       text
 * @property {number}                       [dueOffset]   - Días desde hoy hasta el dueDate
 * @property {"high"|"medium"|"low"}        [priority]
 * @property {number}                       [recurDays]
 */

/**
 * @typedef {object} ProjectTemplate
 * @property {string}              id
 * @property {string}              name
 * @property {string}              icon
 * @property {string}              [color]
 * @property {string}              description
 * @property {TemplateTaskSpec[]}  tasks
 */

/** @type {ProjectTemplate[]} */
export const PROJECT_TEMPLATES = [
  {
    id:          "moving",
    name:        "Mudanza",
    icon:        "🏠",
    color:       "#f97316",
    description: "Pasos típicos para una mudanza",
    tasks: [
      { text: "Comparar empresas de mudanza",                       dueOffset: 3,  priority: "high" },
      { text: "Contratar furgoneta o transportistas",               dueOffset: 7 },
      { text: "Pedir cajas y embalaje",                             dueOffset: 10 },
      { text: "Empaquetar cocina",                                  dueOffset: 14 },
      { text: "Empaquetar dormitorios",                             dueOffset: 17 },
      { text: "Empaquetar salón y otros",                           dueOffset: 20 },
      { text: "Notificar cambio de dirección (banco, subs)",        dueOffset: 14 },
      { text: "Empadronamiento en el nuevo domicilio",              dueOffset: 25 },
      { text: "Día de la mudanza",                                  dueOffset: 21, priority: "high" },
      { text: "Limpieza piso antiguo (entrega llaves)",             dueOffset: 22 },
      { text: "Alta luz / agua / internet en nuevo piso",           dueOffset: 21, priority: "medium" },
    ],
  },
  {
    id:          "trip",
    name:        "Viaje",
    icon:        "✈️",
    color:       "#3b82f6",
    description: "Preparar un viaje con vuelo",
    tasks: [
      { text: "Reservar vuelos",                                    dueOffset: 60, priority: "high" },
      { text: "Reservar alojamiento",                               dueOffset: 50, priority: "high" },
      { text: "Revisar caducidad pasaporte / DNI",                  dueOffset: 40 },
      { text: "Visados o requisitos de entrada",                    dueOffset: 30 },
      { text: "Sacar moneda local o tarjeta sin comisión",          dueOffset: 14 },
      { text: "Copia digital de documentos importantes",            dueOffset: 7 },
      { text: "Previsión del tiempo y hacer maleta",                dueOffset: 2 },
      { text: "Check-in online y tarjeta de embarque",              dueOffset: 1, priority: "high" },
      { text: "Comprobar medicación / cargadores / adaptadores",    dueOffset: 1 },
    ],
  },
  {
    id:          "new-job",
    name:        "Nuevo trabajo",
    icon:        "💼",
    color:       "#8b5cf6",
    description: "Primer mes en un trabajo nuevo",
    tasks: [
      { text: "Firmar contrato y enviar documentación",             dueOffset: 0,  priority: "high" },
      { text: "Setup laptop y cuentas (mail, slack…)",              dueOffset: 2 },
      { text: "Conocer el equipo — 1:1 con cada compañero",         dueOffset: 7 },
      { text: "Leer documentación interna del producto",            dueOffset: 10 },
      { text: "Configurar entorno de desarrollo",                   dueOffset: 5 },
      { text: "Primera reunión con manager (expectativas)",         dueOffset: 3,  priority: "high" },
      { text: "Apuntar dudas y preguntar antes del viernes",        dueOffset: 4 },
      { text: "Review 30 días con manager",                         dueOffset: 30 },
    ],
  },
  {
    id:          "course",
    name:        "Curso / aprendizaje",
    icon:        "🎓",
    color:       "#22c55e",
    description: "Estructura para un curso o tema nuevo",
    tasks: [
      { text: "Definir objetivo concreto del aprendizaje",          priority: "high" },
      { text: "Recopilar materiales (libros, vídeos, cursos)",      dueOffset: 3 },
      { text: "Planificar sesiones semanales",                      dueOffset: 5 },
      { text: "Hacer ejercicios prácticos",                         recurDays: 2 },
      { text: "Repaso de lo aprendido",                             recurDays: 7 },
      { text: "Mini-proyecto final aplicando todo",                 dueOffset: 30 },
    ],
  },
  {
    id:          "event",
    name:        "Evento o fiesta",
    icon:        "🎉",
    color:       "#ec4899",
    description: "Organizar cumple, boda, reunión…",
    tasks: [
      { text: "Definir fecha y lugar",                              dueOffset: 0,  priority: "high" },
      { text: "Hacer lista de invitados",                           dueOffset: 3 },
      { text: "Enviar invitaciones (o save the date)",              dueOffset: 7 },
      { text: "Reservar catering o bebida",                         dueOffset: 14 },
      { text: "Confirmar asistencias (RSVP)",                       dueOffset: 21 },
      { text: "Decoración y música",                                dueOffset: 25 },
      { text: "Día del evento",                                     dueOffset: 30, priority: "high" },
      { text: "Agradecer asistencia (fotos, mensaje)",              dueOffset: 31 },
    ],
  },
  {
    id:          "health",
    name:        "Trámites médicos",
    icon:        "🏥",
    color:       "#06b6d4",
    description: "Citas, pruebas y seguimiento",
    tasks: [
      { text: "Pedir cita con médico de familia",                   dueOffset: 0,  priority: "high" },
      { text: "Llevar listado de medicación y síntomas",            dueOffset: 3 },
      { text: "Pruebas / análisis solicitados",                     dueOffset: 7 },
      { text: "Recoger resultados",                                 dueOffset: 14 },
      { text: "Cita de seguimiento",                                dueOffset: 21 },
      { text: "Revisión anual",                                     recurDays: 365 },
    ],
  },
];

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
  return template.tasks.map(function (spec) {
    return {
      text:      spec.text,
      priority:  spec.priority  || null,
      dueDate:   typeof spec.dueOffset === "number" ? offsetToISO(spec.dueOffset) : null,
      recurDays: spec.recurDays || null,
    };
  });
}

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

  // Card especial "En blanco" como primera opción
  const blankCard =
    '<button type="button" class="tpl-card tpl-card-blank" data-tpl-id="__blank__">' +
      '<span class="tpl-icon">📄</span>' +
      '<span class="tpl-name">En blanco</span>' +
      '<span class="tpl-meta">Empieza desde cero</span>' +
    '</button>';

  const templateCards = PROJECT_TEMPLATES.map(function (t) {
    const colorStyle = t.color ? ' style="--tpl-color: ' + t.color + '"' : "";
    return '<button type="button" class="tpl-card" data-tpl-id="' + t.id + '"' + colorStyle + '>' +
      '<span class="tpl-icon">' + t.icon + '</span>' +
      '<span class="tpl-name">' + escHtml(t.name) + '</span>' +
      '<span class="tpl-meta">' + t.tasks.length + ' tarea' + (t.tasks.length === 1 ? "" : "s") + '</span>' +
    '</button>';
  }).join("");

  box.innerHTML =
    '<div class="modal-icon"><span class="tpl-preview-icon">✨</span></div>' +
    '<p class="modal-label">Nuevo proyecto</p>' +
    '<p class="modal-sub">Empieza desde una plantilla o uno en blanco</p>' +
    '<div class="tpl-grid">' + blankCard + templateCards + '</div>' +
    '<div class="modal-actions">' +
      '<button type="button" class="modal-btn modal-btn-cancel">Cancelar</button>' +
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

    const tasksHTML = template.tasks.map(function (t) {
      const priorityChip = t.priority
        ? '<span class="tpl-task-prio tpl-task-prio-' + t.priority + '">' +
            (t.priority === "high" ? "Alta" : t.priority === "medium" ? "Media" : "Baja") +
          '</span>'
        : "";
      const dueChip = (typeof t.dueOffset === "number")
        ? '<span class="tpl-task-due">' +
            (t.dueOffset === 0 ? "Hoy" :
             t.dueOffset === 1 ? "Mañana" :
             "En " + t.dueOffset + "d") +
          '</span>'
        : "";
      const recurChip = t.recurDays
        ? '<span class="tpl-task-recur">↻ Cada ' + t.recurDays + "d" + '</span>'
        : "";
      return '<li class="tpl-task-row">' +
        '<span class="tpl-task-text">' + escHtml(t.text) + '</span>' +
        '<span class="tpl-task-chips">' + dueChip + priorityChip + recurChip + '</span>' +
      '</li>';
    }).join("");

    box.innerHTML =
      '<div class="modal-icon"><span class="tpl-preview-icon">' + template.icon + '</span></div>' +
      '<p class="modal-label">' + escHtml(template.name) + '</p>' +
      '<p class="modal-sub">' + escHtml(template.description) + '</p>' +
      '<input class="modal-input tpl-name-input" type="text" maxlength="60"' +
        ' value="' + escHtml(template.name) + '" placeholder="Nombre del proyecto" />' +
      '<div class="tpl-tasks-preview-wrap">' +
        '<p class="tpl-tasks-preview-label">Se crearán ' + template.tasks.length + ' tarea' +
          (template.tasks.length === 1 ? "" : "s") + ':</p>' +
        '<ul class="tpl-tasks-preview">' + tasksHTML + '</ul>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button type="button" class="modal-btn modal-btn-cancel">Atrás</button>' +
        '<button type="button" class="modal-btn modal-btn-confirm">Usar plantilla</button>' +
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

// @ts-check
// ═══════════════════════════════════════════════════════════════
// Modelos del dominio (typedefs JSDoc compartidos).
//
// Esto NO genera código en runtime — son anotaciones que VSCode y
// TypeScript leen para dar autocompletado y detectar bugs de tipo.
//
// Para usar un tipo en otro archivo:
//
//   /** @typedef {import("../state/types.js").Task} Task */
//
//   /**
//    * @param {Task} task
//    * @param {HTMLElement} container
//    */
//   function renderDueBadge(task, container) { ... }
//
// O directamente inline:
//
//   /** @param {import("../state/types.js").Task} task */
// ═══════════════════════════════════════════════════════════════

/**
 * Prioridad de una tarea.
 * @typedef {("high"|"medium"|"low"|null)} Priority
 */

/**
 * Estado de progreso de una tarea.
 *  - "progress" → en curso
 *  - "waiting"  → en espera
 *  - null       → sin estado (default)
 * @typedef {("progress"|"waiting"|null)} TaskStatus
 */

/**
 * Subtarea (item dentro de una Task).
 *
 * @typedef {object} Subtask
 * @property {string}  id
 * @property {string}  text
 * @property {boolean} done
 */

/**
 * Tarea — la unidad básica de trabajo.
 *
 * @typedef {object} Task
 * @property {string}        id
 * @property {string}        text             - Texto principal, máx 120 chars
 * @property {string}        [comment]        - Comentario opcional, máx 300 chars
 * @property {boolean}       done
 * @property {TaskStatus}    [status]
 * @property {Priority}      [priority]
 * @property {string[]}      [labels]         - Lista de etiquetas (subset de project.labels)
 * @property {string|null}   [dueDate]        - ISO YYYY-MM-DD o null si sin fecha
 * @property {number|null}   [recurDays]      - Días entre repeticiones; null = no recurrente
 * @property {string|null}   [reminderAt]     - ISO datetime "YYYY-MM-DDTHH:mm" para recordatorio puntual; null = sin recordatorio
 * @property {number}        [timeLogged]     - Milisegundos acumulados (legacy del timer eliminado)
 * @property {Subtask[]}     [subtasks]
 */

/**
 * Proyecto — agrupa tareas. Hay un proyecto especial Inbox (id="__inbox__").
 *
 * @typedef {object} Project
 * @property {string}        id
 * @property {string}        name
 * @property {string}        [createdAt]      - ISO timestamp
 * @property {Task[]}        tasks
 * @property {string}        [notes]          - HTML de las notas del proyecto (legacy)
 * @property {string[]}      [labels]         - Etiquetas disponibles para tareas de este proyecto
 * @property {string|null}   [sectionId]      - ID de la sección a la que pertenece (o null)
 * @property {boolean}       [archived]
 * @property {string}        [icon]           - Emoji
 * @property {string}        [color]          - Hex color
 */

/**
 * Sección en la sidebar — agrupador visual de proyectos.
 *
 * @typedef {object} Section
 * @property {string}  id
 * @property {string}  name
 * @property {boolean} [collapsed]
 */

/**
 * Nota independiente (no atada a un proyecto).
 *
 * @typedef {object} StandaloneNote
 * @property {string}  id
 * @property {string}  name
 * @property {string}  content    - HTML del editor
 * @property {string}  createdAt
 * @property {string}  [color]
 */

/**
 * Filtros de un Smart List.
 *
 * @typedef {object} SmartListFilters
 * @property {("pending"|"done"|"any")}                              status
 * @property {("any"|"high"|"medium"|"low")}                         priority
 * @property {("any"|"overdue"|"today"|"this_week"|"no_date")}       dueDate
 * @property {string|null}                                           label
 */

/**
 * Smart List — vista virtual basada en un conjunto de filtros guardados.
 *
 * @typedef {object} SmartList
 * @property {string}            id
 * @property {string}            name
 * @property {string}            icon       - Emoji
 * @property {string}            createdAt
 * @property {SmartListFilters}  filters
 */

/**
 * Metadatos persistidos junto al workspace (timestamp del último guardado).
 *
 * @typedef {object} WorkspaceMetadata
 * @property {string|null} lastSavedAt
 */

/**
 * Resultado del parser de lenguaje natural (lo que extrae del texto bruto).
 *
 * @typedef {object} ParsedNL
 * @property {string}        text
 * @property {string|null}   dueDate
 * @property {Priority}      priority
 * @property {string[]}      labels
 * @property {number|null}   recurDays
 */

// Marker — convierte este archivo en módulo para que `import` funcione.
export {};

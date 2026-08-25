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
 * Prioridad de una tarea: solo existe "importante" o nada. "medium"/"low"
 * quedan en el tipo únicamente porque `sanitizeTasks` los acepta como
 * entrada de datos antiguos (los colapsa a "high" al cargar) — nada nuevo
 * los vuelve a escribir.
 * @typedef {("high"|"medium"|"low"|null)} Priority
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
 * @property {Priority}      [priority]
 * @property {string|null}   [dueDate]        - ISO YYYY-MM-DD o null si sin fecha
 * @property {number|null}   [recurDays]      - Días entre repeticiones; null = no recurrente
 * @property {string|null}   [reminderAt]     - ISO datetime "YYYY-MM-DDTHH:mm" para recordatorio puntual; null = sin recordatorio
 * @property {number}        [timeLogged]     - Milisegundos acumulados (legacy del timer eliminado)
 * @property {Record<string, number>} [log]   - Historial de completados {"YYYY-MM-DD": 1}; solo se escribe en tareas con `recurDays`
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
 * @property {string|null}   [sectionId]      - ID de la sección a la que pertenece (o null)
 * @property {boolean}       [archived]
 * @property {string}        [icon]           - Emoji
 * @property {string}        [color]          - Hex color
 */

/**
 * Hábito — algo que se repite y del que interesa el histórico, no el
 * "hecho y fuera" de una tarea.
 *
 * Se guarda aparte de `Task` a propósito: un hábito no se completa nunca
 * del todo, no vive en ninguna lista y no debe contar en los contadores
 * de Hoy/Inbox. Lo único que comparten es el formato del historial.
 *
 * `schedule`:
 *  - "daily"  → toca todos los días.
 *  - "everyN" → toca cada `everyNDays` días contando desde `createdAt`.
 *
 * No hay "N veces por semana" a propósito: ese modo no tiene un "toca
 * hoy" que marcar ni una celda que fallar, así que necesita otra UI. Si
 * se añade, será un `schedule` nuevo, sin tocar los dos existentes.
 *
 * @typedef {object} Habit
 * @property {string}  id
 * @property {string}  name
 * @property {string}  [icon]        - Emoji
 * @property {string}  [color]       - Hex color
 * @property {("daily"|"everyN")} schedule
 * @property {number|null} [everyNDays] - Solo con schedule "everyN"; ≥2
 * @property {string}  createdAt     - ISO timestamp; ancla de "qué días tocaba"
 * @property {boolean} [archived]
 * @property {Record<string, number>} log - Historial {"YYYY-MM-DD": 1}
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
 * @property {number|null}   recurDays
 */

// Marker — convierte este archivo en módulo para que `import` funcione.
export {};

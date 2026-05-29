// @ts-check
/** @type {Record<string, string>} */
export const es = {
  // ── Sidebar ───────────────────────────────────────────────
  "sidebar.search":           "Buscar tareas",
  "sidebar.new_project":      "Proyecto",
  "sidebar.new_note":         "Nota",
  "sidebar.inbox":            "Inbox",
  "sidebar.today":            "Hoy",
  "sidebar.projects_label":   "Proyectos",
  "sidebar.new_section":      "Nueva sección de proyectos",
  "sidebar.hide_sidebar":     "Ocultar barra de proyectos",
  "sidebar.lists":            "Listas",
  "sidebar.lists_empty":      "Sin listas todavía",
  "sidebar.archived":         "Archivados",
  "sidebar.archived_empty":   "Sin archivados",
  "sidebar.notes":            "Notas",
  "sidebar.notes_empty":      "Sin notas todavía",
  "sidebar.add_list_title":   "Nueva lista guardada",

  // ── Perfil ────────────────────────────────────────────────
  "profile.local":            "Local",
  "profile.local_storage":    "Almacenamiento local",
  "profile.export":           "Exportar workspace",
  "profile.import":           "Importar workspace",
  "profile.notifications":    "Activar avisos",
  "profile.theme":            "Cambiar tema",
  "profile.shortcuts":        "Atajos de teclado",
  "profile.tour":             "Ver tour de bienvenida",
  "profile.lang_switch":      "Switch to English",
  "profile.synced":           "Sincronizado",
  "profile.sync_active":      "Sincronización activa",
  "profile.default_name":     "Usuario",
  "profile.signout":          "Desconectar",
  "profile.signin":           "Sincronizar con Google",

  // ── Input de tareas ───────────────────────────────────────
  "task.input.placeholder":   "Nueva tarea (prueba: todos los lunes p1 #personal)",
  "task.input.placeholder_fab": "Nueva tarea...",
  "task.add_btn":             "Añadir",

  // ── Panel de notas ────────────────────────────────────────
  "note.title_placeholder":   "Sin título",
  "note.body_placeholder":    "Empieza a escribir...",
  "note.saved_at":            "Guardado",
  "note.rename":              "Renombrar",
  "note.rename_prompt":       "Renombrar nota",
  "note.new_prompt":          "Nombre de la nota",
  "note.new_placeholder":     "Mi nota...",
  "note.delete":              "Eliminar nota",
  "note.confirm_delete":      "¿Eliminar la nota",

  // ── Navegación inferior (móvil) ───────────────────────────
  "nav.projects":             "Proyectos",
  "nav.search":               "Buscar",
  "nav.inbox":                "Bandeja",
  "nav.today":                "Hoy",
  "nav.agenda":               "Agenda",
  "nav.calendar":             "Calendario",

  // ── Toast / estado ────────────────────────────────────────
  "toast.task_deleted":       "Tarea eliminada",
  "toast.undo":               "Deshacer",
  "toast.task_recurred":      "↻ Tarea regenerada",
  "toast.saved":              "Guardado",
  "toast.save_error":         "Error al guardar",
  "toast.last_saved":         "Último guardado:",
  "toast.saving":             "Guardando…",

  // ── Valores por defecto ───────────────────────────────────
  "default.untitled":         "Sin título",
  "default.unnamed":          "Sin nombre",
  "default.no_tasks":         "Sin tareas pendientes",

  // ── Modal de cuota ────────────────────────────────────────
  "quota.title":              "Almacenamiento lleno",
  "quota.body":               "El navegador ha rechazado el guardado porque el espacio disponible se ha agotado (~5 MB).<br><br><strong>Tus últimos cambios no se han guardado.</strong><br><br>Exporta una copia de seguridad y elimina proyectos o notas que ya no necesites.",
  "quota.export_btn":         "Exportar backup ahora",
  "quota.close_btn":          "Cerrar",

  // ── Vistas ────────────────────────────────────────────────
  "view.today_title":         "Hoy",
  "view.today_subtitle":      "Vencidas y de hoy, en todos los proyectos",
  "view.saved_filter":        "Filtro guardado",
  "view.list":                "Lista",
  "view.agenda":              "Agenda",
  "view.calendar":            "Mes",

  // ── Accesibilidad ─────────────────────────────────────────
  "a11y.mark_done":           "Marcar tarea como completada",
  "a11y.select_task":         "Seleccionar tarea",
  "a11y.mobile_settings":     "Ajustes",
  "a11y.mobile_projects":     "Proyectos",
  "a11y.loading":             "Cargando antask",

  // ── Empty state ───────────────────────────────────────────
  "empty.title":              "¿Qué quieres abrir?",
  "empty.sub":                "Selecciona un proyecto o una nota desde la barra lateral",

  // ── Hoy (vista) ───────────────────────────────────────────
  "today.empty_title":        "Todo limpio",
  "today.empty_subtitle":     "No hay tareas vencidas ni para hoy. ¡Disfruta!",
  "today.task_count_one":     "tarea para hoy",
  "today.task_count_other":   "tareas para hoy",
  "today.go_to_project":      "Ir al proyecto",

  // ── Smart lists ───────────────────────────────────────────
  "smartlist.empty_title":    "Sin resultados",
  "smartlist.empty_subtitle": "Ninguna tarea cumple este filtro ahora mismo.",
  "smartlist.preset.overdue": "Vencidas",
  "smartlist.preset.this_week": "Esta semana",
  "smartlist.preset.high_priority": "Prioridad alta",
  "smartlist.modal.new_title":   "Nueva lista guardada",
  "smartlist.modal.edit_title":  "Editar lista",
  "smartlist.modal.label_name":  "Nombre",
  "smartlist.modal.name_placeholder": "Ej: Urgentes con #trabajo",
  "smartlist.modal.label_icon":  "Icono",
  "smartlist.modal.label_status":"Estado",
  "smartlist.modal.label_priority": "Prioridad",
  "smartlist.modal.label_duedate":"Fecha límite",
  "smartlist.modal.label_label": "Con etiqueta",
  "smartlist.modal.any_label":   "(cualquiera)",
  "smartlist.confirm_delete":    "¿Eliminar la lista? Las tareas que filtra no se borran.",
  "smartlist.task_count_one":    "tarea",
  "smartlist.task_count_other":  "tareas",

  // ── Filtros ───────────────────────────────────────────────
  "filter.trigger_label":     "Filtrar",
  "filter.all":               "Todas",
  "filter.pending":           "Pendientes",
  "filter.done":              "Hechas",
  "filter.any":               "Cualquiera",
  "filter.overdue":           "Vencidas",
  "filter.today":             "Hoy",
  "filter.this_week":         "Esta semana",
  "filter.no_date":           "Sin fecha",
  "sort.priority":            "Prioridad",
  "sort.due":                 "Fecha",
  "sort.az":                  "A–Z",

  // ── Prioridad ─────────────────────────────────────────────
  "priority.high":            "Alta",
  "priority.medium":          "Media",
  "priority.low":             "Baja",

  // ── Estado ────────────────────────────────────────────────
  "status.progress":          "Progreso",
  "status.waiting":           "En espera",

  // ── Proyecto ──────────────────────────────────────────────
  "project.new_prompt":       "Nombre del proyecto",
  "project.new_placeholder":  "mi-proyecto...",
  "project.rename":           "Renombrar proyecto",
  "project.rename_prompt":    "Cambiar nombre del proyecto",
  "project.rename_hint":      "Doble clic para renombrar",
  "project.archive":          "Archivar proyecto",
  "project.restore":          "Restaurar proyecto",
  "project.delete":           "Eliminar proyecto",
  "project.delete_permanent": "Eliminar permanentemente",
  "project.confirm_delete":   "¿Eliminar el proyecto y todas sus tareas?",
  "project.confirm_delete_permanent": "¿Eliminar permanentemente y todas sus tareas? Esta acción no se puede deshacer.",
  "project.change_icon":      "Cambiar icono",
  "project.change_color":     "Cambiar color",
  "project.icon_picker_title":"Icono del proyecto",
  "project.icon_placeholder": "O escribe un emoji...",
  "project.icon_clear":       "Quitar icono",
  "project.color_picker_title":"Color del proyecto",
  "project.color_clear":      "Sin color",
  "project.move_to_section":  "Mover a sección",
  "project.remove_from_section": "Quitar de sección",
  "project.no_other_projects":"No hay otros proyectos disponibles.",
  "project.no_export":        "No hay proyectos que exportar.",
  "project.task_count_one":   "tarea",
  "project.task_count_other": "tareas",
  "project.pending_count_one":   "pendiente",
  "project.pending_count_other": "pendientes",

  // ── Sección ───────────────────────────────────────────────
  "section.new_prompt":       "Nueva sección",
  "section.new_placeholder":  "Nombre de la sección",
  "section.rename":           "Renombrar sección",
  "section.rename_prompt":    "Cambiar nombre de sección",
  "section.options":          "Opciones de sección",
  "section.delete":           "Eliminar sección",
  "section.confirm_delete":   "¿Eliminar la sección?",
  "section.move_to":          "Mover a sección",

  // ── Tarea ─────────────────────────────────────────────────
  "task.rename_hint":         "Doble clic para renombrar",
  "task.no_comment":          "Sin comentario",
  "task.add_comment":         "Añadir comentario",
  "task.edit_comment":        "Editar comentario",
  "task.comment_prompt":      "Comentario",
  "task.comment_placeholder": "escribe un comentario...",
  "task.move_to_project":     "Mover a proyecto...",
  "task.move_modal_title":    "Mover a proyecto",
  "task.reminder_set":        "Establecer recordatorio",
  "task.recur_set":           "Establecer repetición",
  "task.mark_done_aria":      "Marcar como hecha",
  "task.pending_count_one":   "pendiente",
  "task.pending_count_other": "pendientes",

  // ── Subtarea ──────────────────────────────────────────────
  "subtask.add_btn":          "+ Añadir subtarea",
  "subtask.new_prompt":       "Nueva subtarea",
  "subtask.new_placeholder":  "escribe la subtarea...",
  "subtask.empty":            "Sin subtareas",
  "subtask.delete_aria":      "Eliminar subtarea",

  // ── Etiquetas ─────────────────────────────────────────────
  "label.picker.title":       "Etiquetas",
  "label.picker.empty":       "Sin etiquetas. Crea una abajo.",
  "label.picker.new_placeholder": "nueva etiqueta...",
  "label.picker.create_btn":  "+ Crear",
  "label.delete_title":       "Eliminar etiqueta",
  "label.filter_all":         "Todas",

  // ── Modales comunes ───────────────────────────────────────
  "modal.cancel":             "Cancelar",
  "modal.save":               "Guardar",
  "modal.create":             "Crear",
  "modal.close":              "Cerrar",
  "modal.done":               "Listo",
  "modal.accept":             "Aceptar",
  "modal.understood":         "Entendido",
  "modal.clear":              "Quitar",
  "modal.delete":             "Eliminar",

  // ── Acciones ──────────────────────────────────────────────
  "action.options":           "Opciones",
  "action.edit":              "Editar",
  "action.delete":            "Eliminar",
  "action.rename":            "Renombrar",
  "action.drag_reorder":      "Arrastrar para reordenar",
  "action.irreversible":      "Esta acción no se puede deshacer.",

  // ── Fecha / modal fecha ───────────────────────────────────
  "date.today":               "Hoy",
  "date.tomorrow":            "Mañana",
  "date.yesterday":           "Ayer",
  "date.this_friday":         "Este viernes",
  "date.next_monday":         "Próximo lunes",
  "date.days_ago":            "d",
  "modal_date.title":         "Fecha límite",

  // ── Recordatorio ──────────────────────────────────────────
  "modal_reminder.title":     "Recordatorio",
  "reminder.preset.in_1h":    "En 1 hora",
  "reminder.preset.in_4h":    "En 4 horas",
  "reminder.preset.this_evening": "Esta tarde (18:00)",
  "reminder.preset.tomorrow_9am": "Mañana 9:00",
  "reminder.preset.in_2_days":"En 2 días",

  // ── Recurrencia ───────────────────────────────────────────
  "modal_recur.title":        "Repetir cada",
  "modal_recur.custom_placeholder": "Personalizado (días)",
  "recur.daily":              "Diario",
  "recur.every_2_days":       "Cada 2 días",
  "recur.weekly":             "Semanal",
  "recur.biweekly":           "Quincenal",
  "recur.monthly":            "Mensual",

  // ── Calendario ────────────────────────────────────────────
  "calendar.month.1":  "Enero",   "calendar.month.2":  "Febrero",
  "calendar.month.3":  "Marzo",   "calendar.month.4":  "Abril",
  "calendar.month.5":  "Mayo",    "calendar.month.6":  "Junio",
  "calendar.month.7":  "Julio",   "calendar.month.8":  "Agosto",
  "calendar.month.9":  "Septiembre","calendar.month.10":"Octubre",
  "calendar.month.11": "Noviembre","calendar.month.12":"Diciembre",
  "calendar.day.mon":  "Lu", "calendar.day.tue": "Ma",
  "calendar.day.wed":  "Mi", "calendar.day.thu": "Ju",
  "calendar.day.fri":  "Vi", "calendar.day.sat": "Sa",
  "calendar.day.sun":  "Do",
  "calendar.more":     "más",

  // ── Fecha límite (badge por tarea) ───────────────────────
  "due.overdue":              "Vencida",

  // ── Agenda ────────────────────────────────────────────────
  "agenda.group.overdue":     "Vencidas",
  "agenda.group.today":       "Hoy",
  "agenda.group.this_week":   "Esta semana",
  "agenda.group.later":       "Más adelante",
  "agenda.empty":             "No hay tareas con fecha límite pendientes",

  // ── Búsqueda ──────────────────────────────────────────────
  "search.modal_title":       "Buscar en proyectos y notas",
  "search.placeholder":       "escribe para buscar...",
  "search.hint_min_chars":    "Escribe al menos 2 caracteres…",
  "search.no_results":        "Sin resultados para",
  "search.section.tasks":     "Tareas",
  "search.section.notes":     "Notas",

  // ── Captura rápida ────────────────────────────────────────
  "quick_capture.eyebrow":    "Nueva tarea",
  "quick_capture.placeholder":"Escribe la tarea y pulsa Enter...",
  "quick_capture.hint":       "<kbd>Enter</kbd> para crear · <kbd>Esc</kbd> para cancelar",
  "quick_capture.added_to":   "Añadida a",

  // ── Importar / exportar ───────────────────────────────────
  "import.confirm_replace":   "Esto reemplazará <strong>todos los proyectos actuales</strong> con el backup. ¿Continuar?",
  "import.restore_label":     "Restaurar workspace",
  "import.error_invalid":     "Formato no válido. Asegúrate de importar un backup generado por antask.",
  "import.error_no_project":  "Selecciona un proyecto antes de importar un backup de proyecto individual.",
  "import.error_json":        "No se pudo importar. Revisa que el archivo sea un JSON válido.",

  // ── Preferencias de tarea ─────────────────────────────────
  "task_prefs.view_section":  "Vista",
  "task_prefs.compact_view":  "Vista compacta",
  "task_prefs.buttons_section":"Botones de tarea",
  "task_btn.priority":        "Prioridad",
  "task_btn.status":          "Estado",
  "task_btn.date":            "Fecha",
  "task_btn.recur":           "Repetir",
  "task_btn.comment":         "Nota rápida",
  "task_btn.labels":          "Etiquetas",
  "task_btn.subtasks":        "Subtareas",
  "task_btn.delete":          "Eliminar",
  "task_btn.move":            "Mover",
  "task_btn.reminder":        "Recordatorio",

  // ── Almacenamiento ────────────────────────────────────────
  "storage.warning_high":     "Almacenamiento al",
  "storage.warning_export":   "— exporta tu workspace",

  // ── Notificaciones ────────────────────────────────────────
  "notif.enable":             "Activar avisos",
  "notif.enabled":            "Avisos activados",
  "notif.blocked":            "Avisos bloqueados",
  "notif.unsupported":        "Avisos no soportados",
  "notif.error_min_time":     "Debe quedar al menos una hora de aviso. Si no quieres avisos, desactívalos arriba.",
  "notif.error_blocked":      "Las notificaciones están bloqueadas en este navegador. Habilítalas desde los ajustes del sitio para poder activarlas aquí.",
  "notif.error_denied":       "Permiso denegado. No se podrán mostrar avisos.",
  "notif.error_not_enabled":  "Activa primero los avisos para poder probarlos.",
  "notif.test_label":         "prueba",
  "notif.test_body":          "Las notificaciones están funcionando correctamente.",
  "notif.task_overdue":       "Tarea vencida",
  "notif.task_due_today":     "Tarea vence hoy",
  "notif.tasks_due":          "tareas pendientes",
  "notif.reminder_title":     "Recordatorio",
  "notif.unknown_project":    "Sin proyecto",
  "notif.remove_time":        "Quitar hora",

  // ── Sincronización ────────────────────────────────────────
  "sync.conflict_title":      "Conflicto de datos",
  "sync.use_cloud":           "☁ Usar datos de la nube",
  "sync.use_local":           "💻 Subir mis datos locales",

  // ── Atajos de teclado ─────────────────────────────────────
  "shortcuts.title":          "Atajos de teclado",

  // ── Onboarding ────────────────────────────────────────────
  "onboarding.skip":          "Saltar",
  "onboarding.prev":          "← Atrás",
  "onboarding.next":          "Siguiente →",
  "onboarding.finish":        "Empezar",

  // ── Consent banner ────────────────────────────────────────
  "consent.text":             "antask guarda tus tareas en tu dispositivo (almacenamiento local). ¿Aceptas también analytics anónimos para ayudarnos a mejorar la app?",
  "consent.privacy_link":     "Política de privacidad",
  "consent.accept":           "Aceptar analytics",
  "consent.decline":          "Solo lo esencial",
};

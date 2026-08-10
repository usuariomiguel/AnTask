// @ts-check
/** @type {Record<string, string>} */
export const es = {
  // ── Sidebar ───────────────────────────────────────────────
  "sidebar.search":           "Buscar tareas",
  "sidebar.search_short":     "Buscar",
  "sidebar.inbox":            "Inbox",
  "sidebar.today":            "Hoy",
  "sidebar.new_section":      "Nuevo grupo",
  "sidebar.hide_sidebar":     "Ocultar la barra lateral",
  "sidebar.show_sidebar":     "Desplegar la barra lateral",
  "sidebar.add_list":         "Añadir lista",
  "sidebar.add_first_list":   "Añadir la primera lista",
  "sidebar.new_group":        "Nuevo grupo",
  "sidebar.list_name":        "Nombre de la lista",
  "sidebar.group_name":       "Nombre del grupo",
  "sidebar.archived":         "Archivados",
  "sidebar.archived_empty":   "Sin archivados",
  "sidebar.more":             "Más",

  // ── Perfil ────────────────────────────────────────────────
  "profile.local":            "Local",
  "profile.local_storage":    "Almacenamiento local",
  "profile.edit_title":       "Tu nombre",
  "profile.name_placeholder": "Escribe tu nombre...",
  "profile.settings":         "Ajustes",
  "profile.export":           "Exportar workspace",
  "profile.import":           "Importar workspace",
  "profile.shortcuts":        "Atajos de teclado",
  "profile.lang_switch":      "Switch to English",
  "profile.synced":           "Sincronizado",
  "profile.sync_active":      "Sincronización activa",
  "profile.signout":          "Cerrar sesión",
  "profile.workspace_section":"Espacio de trabajo",
  "profile.signin":           "Sincronizar con Google",

  // ── Ajustes (diálogo de dos paneles) ───────────────────────
  "settings.nav.account":              "Cuenta",
  "settings.nav.appearance":           "Apariencia",
  "settings.nav.notifications":        "Notificaciones",
  "settings.nav.tasks":                "Tareas",
  "settings.nav.data":                 "Datos",
  "settings.nav.about":                "Acerca de",

  "settings.account.sync":             "Sincronización con Google",
  "settings.account.sync_desc":        "Tus tareas se guardan en la nube.",
  "settings.account.connected":        "Conectado",
  "settings.account.language":         "Idioma",
  "settings.account.language_desc":    "Idioma de la interfaz.",

  "settings.appearance.theme":         "Tema",
  "settings.appearance.theme_desc":    "Claro para el día, oscuro para la noche.",
  "settings.appearance.light":         "Claro",
  "settings.appearance.dark":          "Oscuro",
  "settings.appearance.accent":        "Color de acento",
  "settings.appearance.accent_desc":   "Define el carácter de la interfaz.",
  "settings.appearance.container":        "Contenedor",
  "settings.appearance.container_desc":   "Paneles pegados o flotando sobre el lienzo.",
  "settings.appearance.shell_attached":   "Pegado",
  "settings.appearance.shell_floating":   "Flotante",

  "settings.notifications.tasks":      "Avisos de tareas",
  "settings.notifications.tasks_desc": "Recordatorios cuando una tarea vence.",
  "settings.notifications.times":      "Horas de aviso",
  "settings.notifications.add":        "Añadir",
  "settings.notifications.test":       "Probar aviso",
  "settings.notifications.digest":     "Resumen diario",
  "settings.notifications.digest_desc":"Un correo cada mañana con el plan del día.",

  "settings.tasks.monday":             "La semana empieza el lunes",
  "settings.tasks.monday_desc":        "Afecta al orden de los días en las fechas.",
  "settings.tasks.default_priority":       "Prioridad por defecto",
  "settings.tasks.default_priority_desc":  "Se aplica a las tareas nuevas sin prioridad.",
  "settings.tasks.priority_none":      "Ninguna",

  "settings.data.export":              "Exportar",
  "settings.data.export_desc":         "Descarga todas tus tareas en un archivo.",
  "settings.data.import":              "Importar",
  "settings.data.import_desc":         "Restaura desde un archivo exportado previamente.",
  "settings.data.clear":               "Limpiar",
  "settings.data.clear_completed":     "Limpiar tareas completadas",
  "settings.data.clear_completed_desc":"Elimina de forma permanente las tareas ya hechas.",

  "settings.about.version":            "Versión",
  "settings.about.version_desc":       "Antask para escritorio.",
  "settings.about.session":            "Sesión",
  "settings.about.session_desc":       "Cierra la sesión en este dispositivo.",

  // ── Input de tareas ───────────────────────────────────────
  "task.input.placeholder":   "Nueva tarea…",
  "task.add_btn":             "Añadir",


  // ── Navegación inferior (móvil) ───────────────────────────
  "nav.today":                "Hoy",
  "nav.calendar":             "Calendario",
  "nav.profile":              "Perfil",

  // ── Toast / estado ────────────────────────────────────────
  "toast.task_deleted":       "Tarea eliminada",
  "toast.undo":               "Deshacer",
  "toast.task_recurred":      "↻ Tarea regenerada",
  "toast.saved":              "Guardado",
  "toast.last_saved":         "Último guardado:",

  // ── Valores por defecto ───────────────────────────────────
  "default.unnamed":          "Sin nombre",

  // ── Modal de cuota ────────────────────────────────────────
  "quota.title":              "Almacenamiento lleno",
  "quota.body":               "El navegador ha rechazado el guardado porque el espacio disponible se ha agotado (~5 MB).<br><br><strong>Tus últimos cambios no se han guardado.</strong><br><br>Exporta una copia de seguridad y elimina proyectos que ya no necesites.",
  "quota.export_btn":         "Exportar backup ahora",
  "quota.close_btn":          "Cerrar",

  // ── Vistas ────────────────────────────────────────────────
  "view.today_title":         "Hoy",

  // ── Accesibilidad ─────────────────────────────────────────
  "a11y.mobile_settings":     "Ajustes",
  "a11y.list_chips":         "Cambiar de lista",
  "a11y.mobile_projects":     "Proyectos",

  // ── Hoy (vista) ───────────────────────────────────────────
  "today.empty_title_full":   "Todo al día",
  "today.empty_sub_full":     "No tienes nada vencido ni ninguna tarea para hoy.",
  "today.counter_one":        "{count} tarea para hoy",
  "today.counter_other":      "{count} tareas para hoy",
  "today.go_to_project":      "Ir al proyecto",

  "hoy.overdue":              "Vencidas",
  "hoy.for_today":            "Para hoy",
  "hoy.nodate":               "Sin fecha · sugeridas",
  "hoy.move_all":             "Mover todas a hoy",
  "hoy.schedule_all":         "Programar todas hoy",
  "hoy.move_one":             "Mover a hoy",
  "hoy.schedule_one":         "Programar hoy",
  "hoy.quickadd_ph":          "Añadir una tarea para hoy…",
  "hoy.done_of":              "{done} de {total} hechas",
  "hoy.overdue_one":          "vencida",
  "hoy.overdue_other":        "vencidas",
  "hoy.ring_title":           "Progreso del día",
  "hoy.reopen":               "Reabrir tarea",
  "capture.bar_hint":         "Captura rápida — pulsa para escribir…",
  "capture.open":             "Abrir captura rápida",
  "inbox.group_none":         "Sin lista",


  // ── Filtros ───────────────────────────────────────────────
  "filter.trigger_label":     "Filtrar",
  "filter.all":               "Todas",
  "filter.pending":           "Pendientes",
  "filter.done":              "Hechas",
  "filter.overdue":           "Vencidas",
  "filter.today":             "Hoy",
  "filter.nodate":            "Sin fecha",
  "filter.high":              "Alta prioridad",
  "filter.note":              "Con nota",
  "sort.priority":            "Prioridad",
  "sort.due":                 "Fecha",
  "sort.az":                  "A–Z",

  // ── Prioridad ─────────────────────────────────────────────
  "priority.high":            "P1",
  "priority.medium":          "P2",
  "priority.low":             "P3",

  // ── Proyecto ──────────────────────────────────────────────
  "project.new_prompt":       "Nombre de la lista",
  "project.new_placeholder":  "mi-lista...",
  "project.rename":           "Renombrar lista",
  "project.rename_prompt":    "Cambiar nombre de la lista",
  "project.archive":          "Archivar lista",
  "project.restore":          "Restaurar lista",
  "project.delete":           "Eliminar lista",
  "project.delete_permanent": "Eliminar permanentemente",
  "project.confirm_delete":   "¿Eliminar la lista <strong>{name}</strong> y todas sus tareas?",
  "project.confirm_delete_permanent": "¿Eliminar permanentemente <strong>{name}</strong> y todas sus tareas? Esta acción no se puede deshacer.",
  "project.change_color":     "Cambiar color",
  "project.color_picker_title":"Color de la lista",
  "project.color_clear":      "Sin color",
  "color.red":                "Rojo",
  "color.orange":             "Naranja",
  "color.amber":              "Ámbar",
  "color.gold":               "Oro",
  "color.lime":               "Lima",
  "color.green":              "Verde",
  "color.emerald":            "Esmeralda",
  "color.cyan":               "Cian",
  "color.blue":               "Azul",
  "color.indigo":             "Índigo",
  "color.violet":             "Violeta",
  "color.purple":             "Púrpura",
  "color.pink":               "Rosa",
  "color.brown":              "Marrón",
  "color.gray":               "Gris",
  "color.silver":             "Plateado",
  "project.move_to_section":  "Mover a grupo",

  // ── Grupo (antes "sección") ───────────────────────────────
  "section.new_prompt":       "Nuevo grupo",
  "section.new_placeholder":  "Nombre del grupo",
  "section.rename":           "Renombrar grupo",
  "section.rename_prompt":    "Cambiar nombre del grupo",
  "section.options":          "Opciones de grupo",
  "section.delete":           "Eliminar grupo",
  "section.confirm_delete":          "¿Eliminar el grupo <strong>{name}</strong>?",
  "section.confirm_delete_cascade":  "¿Eliminar el grupo <strong>{name}</strong> y sus {count} listas? Esta acción no se puede deshacer.",
  "section.confirm_delete_cascade_one": "¿Eliminar el grupo <strong>{name}</strong> y su 1 lista? Esta acción no se puede deshacer.",

  // ── Tarea ─────────────────────────────────────────────────
  "task.rename_hint":         "Doble clic para renombrar",
  "task.move_to_project":     "Mover a proyecto...",
  "task.in_list":             "Lista",

  // ── Panel de detalle de tarea ─────────────────────────────
  "detail.title":             "Detalle de tarea",
  "detail.close":             "Cerrar panel de detalles",
  "detail.rail_hint":         "Detalle de tarea — selecciona una tarea para ver sus campos",
  "detail.title_placeholder": "Sin título",
  "detail.note":              "Nota",
  "detail.note_placeholder":  "Añade notas o detalles…",
  "detail.priority":          "Prioridad",
  "detail.priority_none":     "Ninguna",
  "detail.due_date":          "Fecha y hora",
  "detail.no_date":           "Sin fecha",
  "detail.no_time":           "Hora",
  "detail.recur":             "Repetir",
  "detail.no_recur":          "No se repite",
  "detail.reminder":          "Recordatorio",
  "detail.no_reminder":       "Sin recordatorio",
  "detail.subtasks":          "Subtareas",
  "detail.subtask_placeholder": "Añadir subtarea…",
  "detail.list":              "Lista",
  "detail.open":              "Ver detalles",

  // ── Subtarea ──────────────────────────────────────────────
  "subtask.empty":            "Sin subtareas",
  "subtask.delete_aria":      "Eliminar subtarea",

  // ── Modales comunes ───────────────────────────────────────
  "modal.cancel":             "Cancelar",
  "modal.save":               "Guardar",
  "modal.close":              "Cerrar",
  "modal.done":               "Listo",
  "modal.accept":             "Aceptar",
  "modal.understood":         "Entendido",
  "modal.clear":              "Quitar",
  "modal.delete":             "Eliminar",
  "modal.confirm_title":      "Confirmar",
  "modal.notice_title":       "Aviso",
  "modal.error_title":        "Error",

  // ── Acciones ──────────────────────────────────────────────
  "action.delete":            "Eliminar",
  "action.rename":            "Renombrar",
  "action.duplicate":         "Duplicar",

  // ── Fecha / modal fecha ───────────────────────────────────
  "date.today":               "Hoy",
  "date.tomorrow":            "Mañana",
  "date.yesterday":           "Ayer",

  // ── Recordatorio ──────────────────────────────────────────
  "reminder.preset.in_1h":    "En 1 hora",
  "reminder.preset.in_4h":    "En 4 horas",
  "reminder.preset.this_evening": "Esta tarde (18:00)",
  "reminder.preset.tomorrow_9am": "Mañana 9:00",
  "reminder.preset.in_2_days":"En 2 días",

  // ── Recurrencia ───────────────────────────────────────────
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

  // ── Búsqueda ──────────────────────────────────────────────
  "search.results_aria":      "Resultados de la búsqueda",
  "search.hint_nav":          "↑↓ navegar",
  "search.hint_open":         "↵ abrir",
  "search.placeholder":       "Buscar tareas…",
  "search.no_results":        "Sin resultados para",
  "search.count_one":         "1 resultado",
  "search.count_other":       "{n} resultados",

  // ── Captura rápida ────────────────────────────────────────
  "quick_capture.title":      "Captura rápida",
  "quick_capture.placeholder":"¿Qué hay que hacer?",
  "quick_capture.key_space":  "Espacio",
  "quick_capture.hint_type":          "Escribe",
  "quick_capture.hint_autocomplete":  "para autocompletar",
  "quick_capture.submit":     "Añadir tarea",
  "quick_capture.added_to":   "Añadida a",

  // ── Importar / exportar ───────────────────────────────────

  // ── Preferencias de tarea ─────────────────────────────────
  "task_prefs.view_section":  "Vista",
  "task_prefs.compact_view":  "Vista compacta",

  // ── Almacenamiento ────────────────────────────────────────

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
  "notif.digest_overdue":     "Vencidas",
  "notif.digest_today":       "Hoy",
  "notif.reminder_title":     "Recordatorio",
  "notif.unknown_project":    "Sin proyecto",
  "notif.remove_time":        "Quitar hora",

  // ── Sincronización ────────────────────────────────────────
  "sync.conflict_title":      "Conflicto de datos",
  "sync.use_cloud":           "☁ Usar datos de la nube",
  "sync.use_local":           "💻 Subir mis datos locales",

  // ── Atajos de teclado ─────────────────────────────────────

  // ── Onboarding ────────────────────────────────────────────

  // ── Consent banner ────────────────────────────────────────
  "consent.text":             "antask guarda tus tareas en tu dispositivo (almacenamiento local). ¿Aceptas también analytics anónimos para ayudarnos a mejorar la app?",
  "consent.privacy_link":     "Política de privacidad",
  "consent.accept":           "Aceptar analytics",
  "consent.decline":          "Solo lo esencial",

  // ── Backup / import ───────────────────────────────────────
  "backup.restore_title":     "Restaurar workspace",
  "backup.restore_confirm":   "Esto reemplazará <strong>todos los proyectos actuales</strong> con el backup. ¿Continuar?",
  "backup.restored_one":      "Workspace restaurado con {count} proyecto.",
  "backup.restored_other":    "Workspace restaurado con {count} proyectos.",
  "backup.restored_with_secs":"Workspace restaurado con {count} proyecto(s) y {sec} sección(es).",
  "backup.invalid_format":    "Formato no válido. Asegúrate de importar un backup generado por antask.",
  "backup.need_active":       "Selecciona un proyecto antes de importar un backup de proyecto individual.",
  "backup.parse_error":       "No se pudo importar. Revisa que el archivo sea un JSON válido.",

  // ── Today / Inbox menus ───────────────────────────────────
  "today.menu.complete_n":    "Completar las {count} tareas de hoy",
  "today.menu.complete":      "Completar tareas de hoy",
  "today.menu.complete_title":"Completar",
  "today.menu.complete_confirm":"¿Marcar las <strong>{count}</strong> tareas de hoy como completadas?",
  "today.menu.postpone_all":  "Posponer todas a mañana",
  "today.menu.postpone_title":"Posponer",
  "today.menu.postpone_confirm_one":   "¿Mover <strong>{count}</strong> tarea a mañana?",
  "today.menu.postpone_confirm_other": "¿Mover <strong>{count}</strong> tareas a mañana?",

  "inbox.menu.clear_done_n":  "Limpiar completadas ({count})",
  "inbox.menu.clear_done":    "Limpiar completadas",
  "inbox.menu.clear_done_title":"Limpiar",
  "inbox.menu.clear_done_confirm_one":   "¿Eliminar <strong>{count}</strong> tarea completada del Inbox?",
  "inbox.menu.clear_done_confirm_other": "¿Eliminar <strong>{count}</strong> tareas completadas del Inbox?",
  "inbox.menu.empty":         "Vaciar Inbox",
  "inbox.menu.empty_title":   "Vaciar",
  "inbox.menu.empty_confirm": "¿Eliminar <strong>todas las {count} tareas</strong> del Inbox? Esta acción no se puede deshacer.",

  // ── Empty states ──────────────────────────────────────────
  "empty.tasks.title_filtered":"Sin tareas para este filtro.",
  "empty.tasks.title_new":    "Aún no hay tareas en «{list}».",
  "empty.tasks.sub_default":  "Crea la primera para esta lista.",
  "empty.inbox.title":        "Inbox limpio.",
  "empty.inbox.sub":          "Todo procesado — captura algo nuevo cuando llegue.",
  "task.counter_one":         "{count} pendiente",
  "task.counter_other":       "{count} pendientes",
  "empty.cta.add_task":       "Nueva tarea",

  // ── Today badges (sidebar) ────────────────────────────────


  // ── Sync / profile ────────────────────────────────────────
  "profile.user_default":     "Usuario",
  "project.kebab_title":      "Opciones",
  "project.dblclick_rename":  "Doble clic para renombrar",
  "nav.tasks":                "Lista",
  "nav.calendar_short":       "Mes",
  "filter.section_show":      "Mostrar",
  "filter.section_when":      "Cuándo",
  "filter.section_attrs":     "Atributos",
  "filter.section_sort":      "Ordenar",
  "sort.manual":              "Manual",
  "sort.due_short":           "Fecha límite",
  "rowstyle.trigger":         "Estilo de filas",
  "rowstyle.limpio":          "Limpio",
  "rowstyle.lineas":          "Líneas",
  "rowstyle.tarjetas":        "Tarjetas",
  "rowstyle.compacto":        "Compacto",
  "rowstyle.cebra":           "Cebra",
  "bulk.count_one":           "{count} seleccionada",
  "bulk.count_other":         "{count} seleccionadas",
  "bulk.mark_done":           "Marcar hechas",
  "bulk.mark_pending":        "Pendientes",
  "bulk.move_to":             "Mover a...",
  "bulk.delete":              "Eliminar",
  "bulk.cancel":              "Cancelar",
  "task.no_other_projects":   "No hay otros proyectos disponibles.",
  "task.nothing_to_export":   "No hay proyectos que exportar.",
  "view.eyebrow_tasks":       "Lista",
  "view.eyebrow_calendar":    "Calendario",

  // ── Conflict / cloud-vs-local (body con placeholders) ─────
  "sync.conflict_body_one_one":     "Tienes <strong>{local} proyecto local</strong> y <strong>{cloud} proyecto en la nube</strong>. ¿Cuáles quieres usar?",
  "sync.conflict_body_one_other":   "Tienes <strong>{local} proyecto local</strong> y <strong>{cloud} proyectos en la nube</strong>. ¿Cuáles quieres usar?",
  "sync.conflict_body_other_one":   "Tienes <strong>{local} proyectos locales</strong> y <strong>{cloud} proyecto en la nube</strong>. ¿Cuáles quieres usar?",
  "sync.conflict_body_other_other": "Tienes <strong>{local} proyectos locales</strong> y <strong>{cloud} proyectos en la nube</strong>. ¿Cuáles quieres usar?",

  // ── Save status ───────────────────────────────────────────
  "save.storage_warn":        "⚠ Almacenamiento al {pct}% — exporta tu workspace",
  "save.storage_info":        "Almacenamiento al {pct}%",

  // ── Project templates ─────────────────────────────────────
  "tpl.modal.title":          "Nuevo proyecto",
  "tpl.modal.sub":            "Empieza desde una plantilla o uno en blanco",
  "tpl.blank.name":           "En blanco",
  "tpl.blank.meta":           "Empieza desde cero",
  "tpl.meta.tasks_one":       "{count} tarea",
  "tpl.meta.tasks_other":     "{count} tareas",
  "tpl.preview.name_placeholder": "Nombre del proyecto",
  "tpl.preview.tasks_count_one":   "Se creará {count} tarea:",
  "tpl.preview.tasks_count_other": "Se crearán {count} tareas:",
  "tpl.preview.back":         "Atrás",
  "tpl.preview.confirm":      "Usar plantilla",
  "tpl.chip.today":           "Hoy",
  "tpl.chip.tomorrow":        "Mañana",
  "tpl.chip.in_days":         "En {n}d",
  "tpl.chip.recur":           "↻ Cada {n}d",
  "tpl.prio.high":            "Alta",
  "tpl.prio.medium":          "Media",
  "tpl.prio.low":             "Baja",

  "tpl.moving.name":          "Mudanza",
  "tpl.moving.desc":          "Pasos típicos para una mudanza",
  "tpl.moving.task.0":        "Comparar empresas de mudanza",
  "tpl.moving.task.1":        "Contratar furgoneta o transportistas",
  "tpl.moving.task.2":        "Pedir cajas y embalaje",
  "tpl.moving.task.3":        "Empaquetar cocina",
  "tpl.moving.task.4":        "Empaquetar dormitorios",
  "tpl.moving.task.5":        "Empaquetar salón y otros",
  "tpl.moving.task.6":        "Notificar cambio de dirección (banco, subs)",
  "tpl.moving.task.7":        "Empadronamiento en el nuevo domicilio",
  "tpl.moving.task.8":        "Día de la mudanza",
  "tpl.moving.task.9":        "Limpieza piso antiguo (entrega llaves)",
  "tpl.moving.task.10":       "Alta luz / agua / internet en nuevo piso",

  "tpl.trip.name":            "Viaje",
  "tpl.trip.desc":            "Preparar un viaje con vuelo",
  "tpl.trip.task.0":          "Reservar vuelos",
  "tpl.trip.task.1":          "Reservar alojamiento",
  "tpl.trip.task.2":          "Revisar caducidad pasaporte / DNI",
  "tpl.trip.task.3":          "Visados o requisitos de entrada",
  "tpl.trip.task.4":          "Sacar moneda local o tarjeta sin comisión",
  "tpl.trip.task.5":          "Copia digital de documentos importantes",
  "tpl.trip.task.6":          "Previsión del tiempo y hacer maleta",
  "tpl.trip.task.7":          "Check-in online y tarjeta de embarque",
  "tpl.trip.task.8":          "Comprobar medicación / cargadores / adaptadores",

  "tpl.newjob.name":          "Nuevo trabajo",
  "tpl.newjob.desc":          "Primer mes en un trabajo nuevo",
  "tpl.newjob.task.0":        "Firmar contrato y enviar documentación",
  "tpl.newjob.task.1":        "Setup laptop y cuentas (mail, slack…)",
  "tpl.newjob.task.2":        "Conocer el equipo — 1:1 con cada compañero",
  "tpl.newjob.task.3":        "Leer documentación interna del producto",
  "tpl.newjob.task.4":        "Configurar entorno de desarrollo",
  "tpl.newjob.task.5":        "Primera reunión con manager (expectativas)",
  "tpl.newjob.task.6":        "Apuntar dudas y preguntar antes del viernes",
  "tpl.newjob.task.7":        "Review 30 días con manager",

  "tpl.course.name":          "Curso / aprendizaje",
  "tpl.course.desc":          "Estructura para un curso o tema nuevo",
  "tpl.course.task.0":        "Definir objetivo concreto del aprendizaje",
  "tpl.course.task.1":        "Recopilar materiales (libros, vídeos, cursos)",
  "tpl.course.task.2":        "Planificar sesiones semanales",
  "tpl.course.task.3":        "Hacer ejercicios prácticos",
  "tpl.course.task.4":        "Repaso de lo aprendido",
  "tpl.course.task.5":        "Mini-proyecto final aplicando todo",

  "tpl.event.name":           "Evento o fiesta",
  "tpl.event.desc":           "Organizar cumple, boda, reunión…",
  "tpl.event.task.0":         "Definir fecha y lugar",
  "tpl.event.task.1":         "Hacer lista de invitados",
  "tpl.event.task.2":         "Enviar invitaciones (o save the date)",
  "tpl.event.task.3":         "Reservar catering o bebida",
  "tpl.event.task.4":         "Confirmar asistencias (RSVP)",
  "tpl.event.task.5":         "Decoración y música",
  "tpl.event.task.6":         "Día del evento",
  "tpl.event.task.7":         "Agradecer asistencia (fotos, mensaje)",

  "tpl.health.name":          "Trámites médicos",
  "tpl.health.desc":          "Citas, pruebas y seguimiento",
  "tpl.health.task.0":        "Pedir cita con médico de familia",
  "tpl.health.task.1":        "Llevar listado de medicación y síntomas",
  "tpl.health.task.2":        "Pruebas / análisis solicitados",
  "tpl.health.task.3":        "Recoger resultados",
  "tpl.health.task.4":        "Cita de seguimiento",
  "tpl.health.task.5":        "Revisión anual",
};

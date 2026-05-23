# antask

> Tus tareas, tu día. Una app de tareas rápida, local-first, con captura por lenguaje natural.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/build-Vite-646cff?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalable-5b4cdb?style=flat-square)
![JSDoc tipado](https://img.shields.io/badge/JSDoc-tipado-1d4ed8?style=flat-square)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue?style=flat-square)

---

## ¿Qué es antask?

**antask** es una aplicación web para gestionar tareas del día a día. Local-first: todo lo que escribes se guarda en el `localStorage` del navegador y la app funciona sin conexión después del primer arranque. Opcionalmente puedes iniciar sesión con Google para sincronizar entre dispositivos vía Firebase Firestore.

Tres ideas guían el producto:

- 📥 **Inbox** — captura tareas sin pensar dónde guardarlas
- ☀️ **Hoy** — vista virtual con todas las tareas vencidas y de hoy, atravesando proyectos
- ⚡ **Captura rápida** — añade tareas desde cualquier sitio con `Ctrl+Shift+Espacio`

---

## Características

### Tareas

- Crear, completar, eliminar (con deshacer), renombrar inline
- **Subtareas** anidadas
- **Comentarios** por tarea
- **Prioridades** alta · media · baja
- **Estados** En progreso · En espera
- **Fechas límite** con indicador visual de vencimiento
- **Recurrencia** con presets (diario / semanal / quincenal / mensual / personalizado)
- **Recordatorios puntuales** por tarea (notificación del SO cuando llega la hora)
- **Etiquetas** personalizables con asignación por color automático
- **Filtros** todas · pendientes · completadas
- **Ordenación** manual (drag) · por prioridad · por fecha · alfabético
- **Multi-selección** para acciones en lote (completar, mover, eliminar)

### Lenguaje natural en el input

Al escribir una nueva tarea, el parser detecta automáticamente:

```
Pagar gimnasio cada mes p1 #facturas
  ↓
texto:       "Pagar gimnasio"
recurrencia: mensual (30 días)
prioridad:   alta
etiqueta:    #facturas
```

| Patrón | Ejemplo |
|---|---|
| Fechas | `hoy`, `mañana`, `viernes`, `el lunes`, `en 3 días`, `15/3` |
| Recurrencia | `todos los lunes`, `cada 2 días`, `mensualmente`, `quincenalmente` |
| Prioridad | `p1`, `p2`, `p3` |
| Etiquetas | `#trabajo`, `#personal` |

Chips de preview en vivo muestran lo detectado mientras escribes.

### Organización

- **Proyectos múltiples** con sidebar y secciones colapsables
- **Proyecto Inbox** auto-creado y fijado al tope — destino fallback para captura
- **Vistas**: Lista · Agenda · Calendario mensual · Hoy (virtual)
- **Smart Lists / Filtros guardados** — vistas virtuales basadas en criterios combinables (status + prioridad + fecha + etiqueta). 3 presets predefinidos: Vencidas, Esta semana, Prioridad alta.
- **Archivado** de proyectos
- **Búsqueda global** (Cmd/Ctrl + K) — tareas y notas, con resaltado de coincidencias

### Notas

- Notas independientes (no atadas a proyectos), gestionadas desde la sidebar
- Editor enriquecido (negrita, cursiva, listas, color, tamaños)
- Guardado automático mientras escribes

### Notificaciones

- Avisos diarios a las horas que configures (puedes definir varias)
- Recordatorios puntuales por tarea
- Click en la notificación → te lleva a la tarea correspondiente

### General

- Tema oscuro / claro con animación radial al cambiar (View Transitions API)
- Instalable como **PWA** — funciona offline
- **Onboarding de 3 pasos** la primera vez
- Privacidad total: sin analíticas, sin cookies de seguimiento

---

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + K` | Búsqueda global |
| `Ctrl/Cmd + Shift + Espacio` | Captura rápida (al Inbox o al proyecto activo) |
| `Ctrl/Cmd + B` | Mostrar/ocultar sidebar |
| `N` | Enfocar campo "nueva tarea" |
| `S` | Crear nueva sección |
| `A` | Vista Agenda |
| `C` | Vista Calendario |
| `?` | Ver todos los atajos |

---

## Uso

Requisitos: **Node.js 18+** y **npm**.

```bash
# 1. Instala dependencias (solo la primera vez)
npm install

# 2. Modo desarrollo (con hot-reload)
npm run dev          # arranca en http://localhost:5173

# 3. Build de producción
npm run build        # genera /dist con todo bundleado y minificado

# 4. Previsualizar el build
npm run preview

# 5. (Opcional) Type-check vía JSDoc — requiere instalar typescript
npm install -D typescript
npm run typecheck
```

Para desplegar en cualquier hosting estático (Netlify, Vercel, GitHub Pages, S3…) sube el contenido de `dist/`.

### Instalar como PWA

En navegadores Chromium aparece el botón **Instalar** en la barra de direcciones.
En Safari: **Compartir → Añadir a pantalla de inicio**.

Una vez instalada, la aplicación funciona completamente sin conexión.

---

## Estructura del proyecto

```
AnTask/
├── index.html                  # Página principal — única HTML de la app
├── vite.config.js              # Config del bundler (code splitting de Firebase)
├── jsconfig.json               # Habilita JSDoc tipado en VSCode
├── package.json
├── public/                     # Assets sin procesar (copiados a la raíz del build)
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
└── src/
    ├── css/
    │   └── style.css           # Sistema de diseño completo
    └── js/
        ├── main.js             # Entry point — orquesta carga de módulos
        ├── script.js           # Lógica principal (vistas, render, orquestador)
        ├── firebase-sync.js    # Sincronización Firebase modular (opcional)
        ├── notifications.js    # Avisos diarios + recordatorios por tarea
        ├── paste-utils.js      # Utilidades de pegado en editores
        ├── sections-and-profile.js  # Menú de perfil + ajustes
        ├── state/              # ── Capa de datos ───────────────────
        │   ├── types.js        # Typedefs JSDoc: Task, Project, SmartList…
        │   ├── keys.js         # Claves de localStorage + migración legacy
        │   ├── sanitize.js     # Saneamiento al cargar (input no confiable → forma canónica)
        │   └── persistence.js  # Lectura de localStorage (loadProjects, loadSmartLists…)
        ├── ui/                 # ── Componentes UI ─────────────────
        │   ├── modal.js        # Sistema de modales genéricos
        │   ├── task-badges.js  # Badges de prioridad/estado/fecha/recurrencia
        │   ├── labels.js       # Render y color-hash de etiquetas
        │   ├── subtasks.js     # Lista de subtareas
        │   ├── search.js       # Búsqueda global
        │   ├── theme.js        # Sistema de temas
        │   ├── calendar.js     # Vista Calendario
        │   ├── agenda.js       # Vista Agenda
        │   ├── quick-capture.js # Modal Ctrl+Shift+Espacio
        │   └── onboarding.js   # Tour de 3 pasos
        └── utils/              # ── Utilidades puras ───────────────
            ├── html.js         # escHtml
            ├── string.js       # capitalizeFirst
            ├── id.js           # generateId
            ├── date.js         # getDueDateState, formatDueDate
            ├── nl-parse.js     # Parser de lenguaje natural
            └── nl-chips.js     # Chips de preview NL
```

---

## Almacenamiento

Todos los datos se guardan en el `localStorage` del navegador:

| Clave                       | Contenido                                            |
|-----------------------------|------------------------------------------------------|
| `anso-projects`             | Array JSON con todos los proyectos y sus tareas      |
| `anso-active-project`       | ID del proyecto activo                               |
| `anso-meta`                 | Metadatos (timestamp del último guardado)            |
| `anso-sections`             | Secciones de la sidebar                              |
| `antask-notes`              | Notas independientes                                 |
| `antask-smart-lists`        | Filtros guardados (smart lists)                      |
| `antask-task-prefs`         | Preferencias de visibilidad de botones de tarea      |
| `mis-tareas-theme`          | Preferencia de tema (`dark` / `light`)               |
| `antask-onboarded`          | Flag de onboarding visto                             |
| `anso-notif-enabled`        | Notificaciones activadas (`0` / `1`)                 |
| `anso-notif-times`          | Array de horas de aviso (`["09:00", "18:00"]`)       |

Los datos persisten entre sesiones en el mismo navegador. Para llevarlos a otro dispositivo usa **Exportar / Importar** desde el menú del perfil.

---

## Exportar e importar

- **Exportar**: descarga un `.json` con todos tus proyectos, tareas, subtareas, secciones, notas y filtros guardados.
- **Importar**: sube un `.json` exportado previamente para restaurar o migrar datos entre dispositivos.

---

## Sincronización con Firebase (opcional)

El módulo `firebase-sync.js` usa la API **modular de Firebase v9+** (tree-shakeable) y se carga como chunk separado para no bloquear el render inicial.

Para habilitar la sincronización:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Authentication** → Google.
3. Activa **Firestore Database** en modo producción.
4. En Firestore → Reglas, sustituye el contenido por:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/workspace/{doc} {
         allow read, write: if request.auth != null
                            && request.auth.uid == uid;
       }
     }
   }
   ```

5. Sustituye el objeto `firebaseConfig` en `src/js/firebase-sync.js` con las credenciales de tu app.
6. Inicia sesión desde el menú de perfil de la app.

Los datos se almacenan en `/users/{uid}/workspace/data`. Si no se configura, la app funciona idéntica en modo local.

---

## Stack tecnológico

| Aspecto        | Tecnología                                  |
|----------------|---------------------------------------------|
| Lenguaje       | HTML5, CSS3, JavaScript ES6+ (vanilla)      |
| Frameworks     | Ninguno                                     |
| Build tool     | Vite                                        |
| Tipado         | JSDoc + `// @ts-check` en módulos críticos  |
| Almacenamiento | `localStorage`                              |
| Sincronización | Firebase Firestore modular v9+ (opcional)   |
| Iconos         | Lucide (CDN)                                |
| Tipografías    | Google Fonts (Inter)                        |
| PWA            | Service Worker + `manifest.json`            |

---

## Compatibilidad

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| 90+    | 90+     | 15+    | 90+  |

Requiere soporte de `localStorage`, `crypto.randomUUID()`, Service Workers y ES Modules. La View Transition API se usa para animaciones de tema pero degrada elegantemente si el navegador no la soporta.

---

## Privacidad

antask no recopila ningún dato. No hay analíticas, no hay cookies de seguimiento, no hay peticiones a servidores externos salvo:

- Google Fonts (para Inter)
- Lucide CDN (para iconos)
- Firebase (sólo si el usuario inicia sesión voluntariamente)

Lo que escribes se queda en tu dispositivo.

---

## Licencia

[MIT](https://opensource.org/licenses/MIT) — úsalo, modifícalo y distribúyelo libremente.

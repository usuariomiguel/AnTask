# antask

> Tus tareas, tu día. Una app de tareas rápida, local-first, con captura por lenguaje natural.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/build-Vite-646cff?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalable-5b4cdb?style=flat-square)
![JSDoc tipado](https://img.shields.io/badge/JSDoc-tipado-1d4ed8?style=flat-square)
[![CI](https://github.com/usuariomiguel/AnTask/actions/workflows/ci.yml/badge.svg)](https://github.com/usuariomiguel/AnTask/actions/workflows/ci.yml)
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
- **Nota** libre por tarea (hasta 300 caracteres)
- **Prioridad** — marcador único de "importante" (sin niveles P1/P2/P3)
- **Fechas límite**, con hora opcional e indicador visual de vencimiento
- **Recurrencia** con presets (diario / semanal / quincenal / mensual / personalizado)
- **Recordatorios puntuales** por tarea (notificación del SO cuando llega la hora)
- **Filtros**: todas · pendientes · hechas · vencidas · hoy · sin fecha · importantes
- **Ordenación** manual (drag) · por prioridad · por fecha · alfabético
- **Multi-selección** para acciones en lote (completar, mover, eliminar)
- **Estilo de fila** a elegir — tarjetas o filas planas ("limpio") — y diseño a 1 o 2 columnas

### Lenguaje natural en el input

Al escribir una nueva tarea, el parser detecta automáticamente:

```
Pagar gimnasio cada mes p1
  ↓
texto:       "Pagar gimnasio"
recurrencia: mensual (30 días)
prioridad:   importante
```

| Patrón | Ejemplo |
|---|---|
| Fechas | `hoy`, `mañana`, `viernes`, `el lunes`, `en 3 días`, `15/3` |
| Recurrencia | `todos los lunes`, `cada 2 días`, `mensualmente`, `quincenalmente` |
| Prioridad | `p1` (marca la tarea como importante — sin niveles) |

Chips de preview en vivo muestran lo detectado mientras escribes.

### Organización

- **Proyectos múltiples** con sidebar y secciones colapsables
- **Proyecto Inbox** auto-creado y fijado al tope — destino fallback para captura
- **Plantillas de proyecto**: 6 listas para arrancar rápido (mudanza, viaje, nuevo trabajo, curso, trámites médicos, evento)
- **Vistas**: Lista · Calendario mensual · Hoy (virtual)
- **Archivado** de proyectos
- **Búsqueda global** (Cmd/Ctrl + K) — tareas, con resaltado de coincidencias
- **Exportar / Importar** todo el workspace como `.json`

### Notificaciones

- Avisos diarios a las horas que configures (puedes definir varias)
- Recordatorios puntuales por tarea
- Click en la notificación → te lleva a la tarea correspondiente

### Personalización

- Tema oscuro / claro con animación radial al cambiar (View Transitions API)
- **6 colores de acento** a elegir (oliva, arcilla, terracota, miel, marea, vino)
- **Español / English**, autodetectado por idioma del navegador
- Instalable como **PWA** — funciona offline
- Onboarding guiado la primera vez

---

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + K` | Búsqueda global |
| `Ctrl/Cmd + Shift + Espacio` | Captura rápida (al Inbox o al proyecto activo) |
| `Ctrl/Cmd + B` | Mostrar/ocultar sidebar |
| `S` | Crear nueva sección |
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

# 5. Type-check vía JSDoc
npm run typecheck
```

Para desplegar en cualquier hosting estático (Netlify, Vercel, GitHub Pages, S3…) sube el contenido de `dist/`.

### Tests

```bash
npm test               # unit tests (Vitest)
npm run test:watch     # unit tests en watch mode
npm run test:coverage  # con cobertura
npm run test:e2e       # e2e (Playwright) — arranca el dev server automáticamente
npm run test:e2e:ui    # e2e con la UI interactiva de Playwright
```

Cada push/PR a `main` corre build + unit + e2e + `npm audit` en GitHub Actions (`.github/workflows/ci.yml`).

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
├── playwright.config.js        # Config de los e2e
├── package.json
├── e2e/                        # Tests end-to-end (Playwright)
│   ├── smoke.spec.js
│   └── a11y.spec.js            # Auditoría de accesibilidad (axe-core)
├── scripts/
│   └── fetch-openmoji.mjs      # Descarga el set de emoji usado en iconos de proyecto
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
        ├── analytics.js        # Vercel Analytics — solo tras consentimiento
        ├── consent.js          # Banner y estado de consentimiento de analítica
        ├── sync-loader.js      # Carga diferida del chunk de Firebase
        ├── paste-utils.js      # Utilidades de pegado en editores
        ├── setup-lucide.js     # Registro/render de iconos Lucide
        ├── sections-and-profile.js  # Menú de perfil + ajustes
        ├── i18n/                # ── Internacionalización ───────────
        │   ├── index.js         # Detección de idioma + t()
        │   ├── es.js
        │   └── en.js
        ├── state/               # ── Capa de datos ───────────────────
        │   ├── types.js          # Typedefs JSDoc: Task, Project, Section…
        │   ├── keys.js            # Claves de localStorage + migración legacy
        │   ├── sanitize.js        # Saneamiento al cargar (input no confiable → forma canónica)
        │   └── persistence.js     # Lectura de localStorage (loadProjects…)
        ├── ui/                   # ── Componentes UI ─────────────────
        │   ├── modal.js           # Sistema de modales genéricos
        │   ├── sheet.js           # Hojas modales (bottom sheets) — móvil
        │   ├── task-badges.js     # Badges de prioridad/fecha/recurrencia
        │   ├── subtasks.js        # Lista de subtareas
        │   ├── search.js          # Búsqueda global
        │   ├── theme.js           # Tema, acento de color
        │   ├── calendar.js        # Vista Calendario
        │   ├── project-templates.js  # Galería de plantillas de proyecto
        │   ├── quick-capture.js   # Modal Ctrl+Shift+Espacio
        │   └── onboarding.js      # Tour guiado
        └── utils/                # ── Utilidades puras ───────────────
            ├── html.js             # escHtml
            ├── sanitize-html.js    # Saneamiento de HTML (DOMPurify)
            ├── string.js           # capitalizeFirst
            ├── id.js               # generateId
            ├── date.js             # getDueDateState, formatDueDate
            ├── storage.js          # Escritura segura + cuota de localStorage
            ├── project-color.js    # Color determinista por proyecto
            ├── openmoji.js         # Picker de emoji para iconos de proyecto
            ├── nl-parse.js         # Parser de lenguaje natural
            ├── nl-chips.js         # Chips de preview NL
            └── __tests__/          # Unit tests (Vitest)
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
| `anso-sidebar-collapsed`    | Sidebar colapsada o no                               |
| `antask-task-prefs`         | Preferencias de visibilidad de botones de tarea      |
| `antask-row-style`          | Estilo de fila (`tarjetas` / `limpio`)               |
| `antask-two-columns`        | Diseño a 2 columnas activado o no                    |
| `mis-tareas-theme`          | Preferencia de tema (`dark` / `light`)               |
| `antask-accent`             | Color de acento elegido                              |
| `antask-profile`            | Nombre y avatar del perfil local                     |
| `antask_lang`               | Idioma (`es` / `en`)                                 |
| `antask-onboarded`          | Flag de onboarding visto                             |
| `antask_consent`            | Consentimiento de analítica (opt-in)                 |
| `antask-sync-enabled`       | Sincronización con Firebase activada o no            |
| `anso-notif-enabled`        | Notificaciones activadas (`0` / `1`)                 |
| `anso-notif-times`          | Array de horas de aviso (`["09:00", "18:00"]`)       |

Los datos persisten entre sesiones en el mismo navegador. Para llevarlos a otro dispositivo usa **Exportar / Importar** desde el menú del perfil.

---

## Exportar e importar

- **Exportar**: descarga un `.json` con todos tus proyectos, tareas y subtareas.
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

| Aspecto        | Tecnología                                       |
|----------------|---------------------------------------------------|
| Lenguaje       | HTML5, CSS3, JavaScript ES6+ (vanilla)            |
| Frameworks     | Ninguno                                           |
| Build tool     | Vite                                              |
| Tipado         | JSDoc + `// @ts-check` en módulos críticos        |
| Tests          | Vitest (unit) + Playwright (e2e, con axe-core a11y) |
| Almacenamiento | `localStorage`                                    |
| Sincronización | Firebase Firestore modular v9+ (opcional)         |
| Saneamiento    | DOMPurify (contenido de usuario)                  |
| Analítica      | Vercel Analytics — opt-in, sin cookies            |
| i18n           | Español / English                                 |
| Iconos         | Lucide (self-hosted vía npm)                      |
| Tipografías    | Inter + Bricolage Grotesque + JetBrains Mono (self-hosted) |
| PWA            | Service Worker + `manifest.json`                  |

---

## Compatibilidad

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| 90+    | 90+     | 15+    | 90+  |

Requiere soporte de `localStorage`, `crypto.randomUUID()`, Service Workers y ES Modules. La View Transition API se usa para animaciones de tema pero degrada elegantemente si el navegador no la soporta.

---

## Privacidad

antask no recopila datos personales por defecto. Sin cookies de seguimiento y sin requests a CDN de terceros sin consentimiento.

- Fuentes (Inter, Bricolage Grotesque, JetBrains Mono) e iconos (Lucide) se sirven **self-hosted** desde el propio dominio.
- Firebase solo se carga si el usuario inicia sesión voluntariamente.
- **Vercel Analytics**, opt-in vía banner de consentimiento — sin cookies, sin IPs personales almacenadas.

Lo que escribes se queda en tu dispositivo. Ver también [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md) y [TERMS.md](TERMS.md).

---

## Licencia

[MIT](LICENSE) — úsalo, modifícalo y distribúyelo libremente.

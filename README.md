# Ansotask

> Gestión de tareas y notas minimalista — sin servidores, sin cuentas, sin rastro.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-instalable-5b4cdb?style=flat-square)
![Vite](https://img.shields.io/badge/build-Vite-646cff?style=flat-square)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue?style=flat-square)

---

## ¿Qué es Ansotask?

**Ansotask** es una aplicación web ligera para gestionar tareas del día a día y tomar notas rápidas. Funciona completamente en el navegador: no necesita instalación, no requiere conexión a internet después de la primera carga, y no envía ningún dato a ningún servidor externo. Todo se guarda automáticamente en el `localStorage` de tu navegador.

Opcionalmente puede sincronizarse con **Firebase** para acceder a tus datos desde cualquier dispositivo.

---

## Características

### Gestión de tareas (`index.html`)

- Crear, completar y eliminar tareas
- **Subtareas** anidadas por tarea
- **Comentarios** individuales en cada tarea
- **Prioridades**: alta, media y baja
- **Estados**: En progreso / En espera
- **Fechas límite** con indicador visual de vencimiento
- **Recurrencia** con presets (diario, semanal, quincenal, mensual, personalizado)
- **Etiquetas** personalizables
- **Filtros**: todas / pendientes / completadas
- **Ordenamiento**: manual (drag), por prioridad, por fecha límite, alfabético
- **Proyectos múltiples** con panel lateral y secciones
- **Vistas**: lista, agenda y calendario mensual
- **Búsqueda global** de tareas y notas
- **Multi-selección** para acciones en lote (completar, eliminar, mover de proyecto)
- Limpieza rápida de tareas completadas
- Exportar e importar datos en `.json`
- Sincronización opcional con Firebase en tiempo real

### Notas

- Notas independientes en la barra lateral (no atadas a un proyecto)
- Editor enriquecido: negrita, cursiva, subrayado, tachado, listas, color de texto, tamaños
- Guardado automático mientras escribes

### General

- Tema oscuro / claro con persistencia entre sesiones
- Instalable como **PWA** (funciona offline)
- Privacidad total: sin analíticas, sin cookies de seguimiento

---

## Uso rápido

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
├── index.html              # Página principal — única página de la app
├── manifest.json           # Configuración PWA
├── service-worker.js       # Caché offline
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── css/
    │   └── style.css       # Sistema de diseño completo
    └── js/
        ├── script.js                 # Lógica principal de tareas, proyectos y notas
        ├── sections-and-profile.js   # Menú de perfil + ajustes
        ├── notifications.js          # Avisos diarios de tareas vencidas
        ├── paste-utils.js            # Utilidades de pegado en editores
        └── firebase-sync.js          # Módulo de sincronización Firebase (opcional)
```

---

## Almacenamiento

Todos los datos se guardan en el `localStorage` del navegador:

| Clave                 | Contenido                                       |
|-----------------------|-------------------------------------------------|
| `anso-projects`       | Array JSON con todos los proyectos y sus tareas |
| `anso-active-project` | ID del proyecto activo                          |
| `anso-meta`           | Metadatos de la workspace                       |
| `mis-tareas-theme`    | Preferencia de tema (`dark` / `light`)          |

Los datos persisten entre sesiones en el mismo navegador. Para llevarlos a otro dispositivo usa la función **Exportar / Importar** disponible en la barra de herramientas.

---

## Exportar e importar

- **Exportar**: descarga un archivo `.json` con todos tus proyectos, tareas, subtareas y metadatos.
- **Importar**: sube un `.json` exportado previamente para restaurar o migrar datos entre dispositivos.

---

## Sincronización con Firebase (opcional)

El módulo `firebase-sync.js` añade sincronización bidireccional en tiempo real a través de Firestore. Para habilitarla:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activa **Firestore** en modo producción.
3. Activa **Authentication** con el proveedor que prefieras.
4. Sustituye el objeto `firebaseConfig` en `firebase-sync.js` con las credenciales de tu proyecto.
5. Inicia sesión desde la interfaz de la app.

Los datos se almacenan en `/users/{uid}/workspace/data`. El módulo es independiente: si no se configura, la app funciona igual sin él.

---

## Stack tecnológico

| Aspecto        | Tecnología                              |
|----------------|-----------------------------------------|
| Lenguaje       | HTML5, CSS3, JavaScript ES6+ (vanilla)  |
| Frameworks     | Ninguno                                 |
| Build tool     | Vite                                    |
| Almacenamiento | `localStorage`                          |
| Sincronización | Firebase Firestore (opcional)           |
| Tipografías    | Google Fonts (Inter, JetBrains Mono)    |
| PWA            | Service Worker + `manifest.json`        |

---

## Compatibilidad

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| 90+    | 90+     | 15+    | 90+  |

Requiere soporte de `localStorage`, `crypto.randomUUID()` y Service Workers. La View Transition API se usa para animaciones de tema pero degrada elegantemente si el navegador no la soporta.

---

## Privacidad

Ansotask no recopila ningún dato. No hay analíticas, no hay peticiones a servidores externos (excepto Google Fonts para las tipografías), no hay cookies de seguimiento. Lo que escribes se queda en tu dispositivo.

---

## Licencia

[MIT](https://opensource.org/licenses/MIT) — úsalo, modifícalo y distribúyelo libremente.

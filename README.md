# ⬡ Ansotask

> Gestión de tareas y notas minimalista — sin servidores, sin cuentas, sin rastro.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Sin dependencias](https://img.shields.io/badge/dependencias-ninguna-00f5ff?style=flat-square)
![localStorage](https://img.shields.io/badge/almacenamiento-localStorage-7b2fff?style=flat-square)

---

## ¿Qué es Ansotask?

**Ansotask** es una aplicación web ligera para gestionar tareas del día a día y tomar notas rápidas. Funciona completamente en el navegador: no necesita instalación, no requiere conexión a internet después de cargarse, y no envía ningún dato a ningún servidor. Todo se guarda automáticamente en el `localStorage` de tu navegador.

---

## Características

### Lista de tareas (`index.html`)
- ✅ Añadir, completar y eliminar tareas
- 💬 Añadir comentarios individuales a cada tarea
- 🔽 Subtareas anidadas por tarea
- 🔍 Filtros: todas / pendientes / hechas
- 🗑️ Limpieza rápida de tareas completadas
- 💾 Exportar copia de seguridad en `.json`
- 📥 Importar copia de seguridad previamente exportada
- 🕐 Indicador de último guardado
- 🌙 / ☀️ Tema oscuro y claro con persistencia

### Bloc de notas (`notas.html`)
- 📝 Área de texto libre para apuntes del día a día
- 💾 Guardado automático mientras escribes
- 🕐 Indicador de último guardado
- 🌙 / ☀️ Tema compartido con la lista de tareas

---

## Estructura del proyecto

```
ansotask/
├── index.html          # Página principal — lista de tareas
├── notas.html          # Bloc de notas
└── src/
    ├── css/
    │   └── style.css   # Estilos completos (tema Web3 futurista)
    ├── js/
    │   ├── script.js   # Lógica de la lista de tareas
    │   └── notas.js    # Lógica del bloc de notas
    └── img/
        └── Anso.png    # Favicon
```

---

## Uso

No hay nada que instalar. Solo abre `index.html` en tu navegador:

```bash
# Opción 1 — abrir directamente
open index.html

# Opción 2 — servidor local (recomendado para evitar restricciones CORS)
npx serve .
# o
python3 -m http.server 8080
```

---

## Cómo funciona el almacenamiento

Toda la información se guarda en el `localStorage` del navegador, bajo estas claves:

| Clave | Contenido |
|---|---|
| `mis-tareas` | Array JSON con todas las tareas y subtareas |
| `mis-tareas-meta` | Metadatos: fecha del último guardado |
| `mis-notas-diarias` | Texto libre del bloc de notas |
| `mis-notas-diarias-meta` | Metadatos: fecha del último guardado |
| `mis-tareas-theme` | Preferencia de tema (`dark` / `light`) |

> **Nota:** Los datos persisten entre sesiones en el mismo navegador y dispositivo. Para llevarlos a otro dispositivo, usa la función de exportar / importar.

---

## Exportar e importar tareas

El botón **↑ Exportar** genera un archivo `mis-tareas-backup.json` con todas tus tareas en este formato:

```json
{
  "exportedAt": "2025-01-01T12:00:00.000Z",
  "tasks": [
    {
      "id": "uuid",
      "text": "Nombre de la tarea",
      "comment": "Comentario opcional",
      "done": false,
      "subtasks": [
        { "id": "uuid", "text": "Subtarea", "done": false }
      ]
    }
  ]
}
```

El botón **↓ Importar** acepta este mismo formato y reemplaza las tareas actuales.

---

## Diseño

La interfaz sigue una estética **Web3 / futurista** con:

- **Orbitron** — tipografía de display para títulos
- **Syne** — tipografía de cuerpo moderna y limpia
- **Space Mono** — tipografía monoespaciada para labels, contadores y notas
- Fondo con gradientes de luz y rejilla sutil estilo terminal
- Acento neón cyan/violeta con efectos glow en hover
- Esquinas decorativas en el panel principal
- Compatible con tema oscuro y claro, respetando `prefers-color-scheme`

---

## Compatibilidad

Funciona en cualquier navegador moderno que soporte:

- `localStorage`
- CSS custom properties
- `crypto.randomUUID()` (con fallback incluido)
- `<template>` HTML

| Chrome | Firefox | Safari | Edge |
|--------|---------|--------|------|
| ✅ 90+ | ✅ 90+ | ✅ 15+ | ✅ 90+ |

---

## Privacidad

Ansotask no recopila ningún dato. No hay analíticas, no hay peticiones a servidores externos (excepto Google Fonts para las tipografías), no hay cookies de seguimiento. Lo que escribes se queda en tu dispositivo.

---

## Licencia

MIT — úsalo, modifícalo y distribúyelo libremente.

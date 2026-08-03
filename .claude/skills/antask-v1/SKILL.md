---
name: antask-v1
description: Replicar el rediseño "Tierra v1" de AnTask sobre el código de producción. Úsala para cualquier trabajo de UI en este repo — tocar src/css/style.css, las filas de tarea, el sidebar, el panel de detalle, las vistas Hoy/Inbox o el móvil; y siempre que haya que comparar con design_handoff_antask_v1 o verificar un cambio visual en el navegador.
---

Este repo no es un proyecto de diseño en verde: es un **re-skin fiel** de un prototipo ya cerrado.
La pregunta nunca es "¿qué queda bien?" sino "**¿qué hace v1?**". Antes de proponer nada,
búscalo en el handoff.

## 1. Lee el handoff antes de tocar nada

`design_handoff_antask_v1/README.md` es la autoridad. Tiene la configuración elegida, el mapa
de archivos y **restricciones duras**. Resumen de lo que NO se toca:

- Firebase (`src/js/firebase-sync.js`, `window.AnsoSync`, login Google, Firestore).
- Capa de datos: `src/js/state/*`, las claves de `localStorage`, export/import.
- Parser de lenguaje natural, notificaciones, PWA/service worker, i18n, consentimiento.
- Atajos de teclado y flujos existentes.
- La landing (`index.html` + `src/css/landing.css`) queda **fuera** salvo petición explícita:
  tiene su propio sistema tipográfico y no comparte tokens con la app.

`design_handoff_antask_v1/tokens.css` es la fuente de verdad de los valores.

> **Discrepancia conocida.** El README dice *"Fuente de títulos: Sans (Inter) — no hay fuentes
> nuevas"*, pero `referencia/themes.jsx` define para el tema tierra `fontDisplay: F.grotesk`
> (Bricolage Grotesque). En producción se implementó **Bricolage** por decisión del usuario, y
> se añadió `@fontsource-variable/bricolage-grotesque`. No lo revuelvas sin preguntar.

## 2. Mapa de la referencia

| Archivo | Para qué |
|---|---|
| `referencia/Antask v1.html` | Prototipo de escritorio. **La config por defecto que trae ES la elegida.** |
| `referencia/Antask Móvil v1.html` | Prototipo móvil. |
| `referencia/themes.jsx` | Objeto de tema. El tema real es **`tierra`**. |
| `referencia/v1/inbox-view.jsx` | Fila de tarea, sidebar, panel de detalle, rails. **Manda sobre `referencia/inbox-view.jsx`, que es la versión vieja.** |
| `referencia/v1/hoy-view.jsx` | Vista Hoy. |
| `referencia/views.jsx` | Átomos compartidos: `PrioP`, `LabelTag`, paleta `PRIO`, formato de fechas. |
| `referencia/quick-capture.jsx` | Captura rápida. |
| `tweaks-panel.jsx`, `image-slot.js` | Infraestructura del prototipo — **ignorar**. |

**Ojo:** hay dos `inbox-view.jsx` (en `referencia/` y en `referencia/v1/`). Usa siempre el de `v1/`.

### El objeto `t` → tokens CSS

Los JSX se pintan con un objeto de tema `t`. Traducción al tema tierra de producción:

| `t.*` | CSS |
|---|---|
| `t.ink` / `ink2` / `ink3` | `--text-primary` / `--text-secondary` / `--text-tertiary` |
| `t.canvas` / `card` / `border` | `--surface-canvas` / `--surface-card` / `--border-default` |
| `t.accent` / `accentInk` / `accentOn` / `tintBg` | `--c-primary-500` / `--c-primary-300` / `--accent-on` / `--accent-tint` |
| `t.fontUI` / `fontMono` / `fontDisplay` | `--font-sans` / `--font-mono` / `--font-display` |
| `t.rowHover` | `--row-hover` (hover de tarea: `--task-hover`) |
| `t.sb.*` | El bloque oscuro de sidebar — ver §3 |
| `t.monoMeta: true` | Los metadatos de fila van en **mono** |

`t.mode === 'dark'` no mapea a nuestro modo oscuro: en tierra vale `'light'`. Para valores por
tema, mira las dos ramas del ternario en el JSX, no `t.mode`.

## 3. Convenciones de `src/css/style.css` (~9000 líneas)

**Sidebar y panel de detalle son oscuros en AMBOS temas.** Los tokens se redeclaran en un
bloque con ámbito:

```css
:root[data-theme="light"] .sidebar,
:root[data-theme="light"] .task-detail-wrap { /* set completo de tokens oscuros */ }
```

Si un componente nuevo cae ahí dentro y sale con colores del tema claro, es que le falta un
token a ese bloque — **añádelo al bloque, no dupliques declaraciones**.

**La caja visible va en el elemento que anima.** `.sidebar` y `.task-detail-wrap` llevan fondo,
borde, radio y sombra, y son los que animan `width`. Los hijos (`.sidebar-rail`,
`.task-detail-panel`, `.task-detail-rail`) van **sin caja propia** y con ancho fijo, para que su
contenido no se recomponga durante el plegado. Ambos comparten `--shell-collapse`.

### Trampas que ya han mordido

- **Orden de cascada.** Los bloques `@media` de este archivo suelen estar **antes** que las
  reglas base que quieren pisar. A igual especificidad gana la última, así que el `@media` no
  aplica. Comprueba el orden real (`grep -n`) antes de dar por buena una regla; a veces hace
  falta `!important` con un comentario que explique por qué.
- **Alias heredados.** Al final del `:root` hay alias de migración. Si defines un token que ya
  existe ahí, el alias gana por ser posterior. Borra el alias.
- **`:has()` cambia la especificidad.** `.a:has(+ .b:not(:empty))` pesa más que `.a--modifier`,
  así que puede pisar reglas que no esperabas. Acota con `:not()` si hace falta.
- Antes de editar, **grepea el cuerpo exacto de la regla**: los números de línea se desplazan
  entre ediciones y hay reglas con texto idéntico en el bloque de tema claro (`replace_all`
  suele ser lo correcto ahí, pero decídelo mirando).

## 4. Verificación en navegador

Nada de aprobar cambios visuales a ojo: **mide**.

### Suite existente — úsala

```bash
npm run test:e2e          # playwright; arranca el dev server solo (webServer en la config)
npm test                  # vitest, 84 tests
npm run build
```

`e2e/smoke.spec.js` tiene `freshLoad(page)` y `addTask(page, texto)` ya resueltos. Si el cambio
es de flujo, añade ahí en vez de improvisar.

**Estado conocido:** `npm run test:e2e` da **6 pasan / 2 fallan**. Los dos fallos son de
contraste en `.sidebar-add-btn > span` ("Nuevo grupo") y son **preexistentes** — verifícalo con
`git stash` antes de culpar a tu cambio.

### Scripts de usar y tirar

Para medir o capturar algo puntual, un `.mjs` **en la raíz del repo** (no en el scratchpad: ahí
`@playwright/test` no resuelve desde `node_modules`). Bórralo al terminar.

```js
import { chromium } from '@playwright/test';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript((pr) => {
  localStorage.setItem('anso-projects', JSON.stringify(pr));
  localStorage.setItem('anso-active-project', '__inbox__');
  localStorage.setItem('mis-tareas-theme', 'light');   // o 'dark'
  localStorage.setItem('antask-onboarded', '1');        // sin esto, el tour tapa todo
  localStorage.setItem('antask_consent', JSON.stringify({ analytics: false, ts: Date.now() }));
  localStorage.setItem('anso-sidebar-collapsed', '0');
  // localStorage.setItem('antask-row-style', 'limpio'|'lineas'|'tarjetas'|'compacto');
}, projects);
await p.goto('http://localhost:5173/app.html');
await p.waitForSelector('.task-item');
```

Prefiere **números** a capturas: `getBoundingClientRect()`, `getComputedStyle()`,
`document.fonts.check()`. Una captura confirma; una medida demuestra.

### Gestos que no son obvios

- `INBOX_ID` es **`"__inbox__"`**, no `"inbox"`. Sembrarlo mal da falsos negativos.
- **Móvil:** la sidebar es un drawer fuera del viewport. Para ir a Hoy, `#bnav-today-btn`.
- **El bloque "N completadas" necesita DOS clics** para abrirse la primera vez (bug, §5).
- Los heredocs de Git Bash se comen las contrabarras de rutas Windows: usa `/` o escribe el
  script con la herramienta Write.
- El Inbox agrupa por proyecto solo con orden manual y filtro all/pending; con otro orden es
  una lista plana. Son dos ramas de render distintas en `renderTasks()`.

### Cobertura mínima antes de dar algo por hecho

Los cuatro `data-row-style`, **los dos temas**, y móvil (390px). Un cambio en una fila de tarea
puede romperse solo en "compacto" o solo en claro.

## 5. Deuda conocida (no la re-descubras)

- **`npm run typecheck` está roto**: el script llama a `tsc` pero `typescript` no está en
  `devDependencies`, pese a `jsconfig.json` y ficheros con `// @ts-check`.
- **TDZ en el arranque**: el primer render se dispara durante la evaluación del módulo, antes de
  que `script.js` inicialice sus `const`/`var` de nivel superior. Lanza
  `ReferenceError: Cannot access 'PRIORITY_PNUM' before initialization`, queda capturado y un
  render posterior lo tapa.
- **Consecuencia del anterior**: `var _doneFoldExpanded = true` todavía es `undefined` en ese
  primer render, así que el bloque de completadas se pinta plegado con el estado a `true` — de
  ahí los dos clics.
- **a11y**: contraste insuficiente en `.sidebar-add-btn > span`.

## 6. Git

Rama de trabajo: `redesign/tierra-v1`. `git add -p` **no funciona** en este entorno (es
interactivo), así que cuando los cambios se entrelazan en `style.css` no se pueden separar en
commits distintos: haz uno solo, bien descrito, y dilo.

`test-results/` está **versionado**, así que `git stash` puede chocar con `.last-run.json`
después de correr los e2e. Si pasa: `git checkout -- test-results/.last-run.json` y reintenta.

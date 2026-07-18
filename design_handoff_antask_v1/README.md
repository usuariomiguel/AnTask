# Handoff: Rediseño Antask v1 (tema cálido "Tierra") — escritorio + móvil

## Objetivo
Implementar en el repo de producción **usuariomiguel/AnTask** el rediseño visual completo de Antask v1: nueva paleta cálida "Tierra" (acento **oliva**), nuevo estilo de filas de tarea ("tarjetas"), shell flotante, y la propuesta de UI móvil. **La lógica de la app no cambia** — es un re-skin profundo + ajustes de layout.

## Sobre los archivos de referencia
Los archivos de `referencia/` son **prototipos de diseño hechos en HTML/React** — muestran el aspecto y comportamiento previstos, **no son código para copiar a producción**. La tarea es **recrear estos diseños dentro del stack existente del repo**: HTML + CSS (custom properties en `src/css/style.css`) + JavaScript vanilla ES6, bundleado con Vite. No introducir React ni ningún framework.

Los dos prototipos se abren directamente en el navegador (doble click):
- `referencia/Antask v1.html` — app de escritorio (vistas Hoy e Inbox, sidebar, captura rápida, ajustes). Tiene un panel de "Tweaks" lateral: la **configuración elegida** es la que trae por defecto.
- `referencia/Antask Móvil v1.html` — app móvil dentro de un marco iPhone (lista, notas, apariencias, paywall PRO, barra inferior "liquid glass").

Los `.jsx` acompañantes son el código fuente de los prototipos — útiles para leer valores exactos (colores, paddings, radios), no para copiar.

## Fidelidad
**Alta (hi-fi).** Colores, tipografía, espaciados y estados son finales. Recrear con precisión de píxel usando los patrones existentes del codebase.

## Configuración de diseño elegida
- Apariencia: **Tierra** (cálida) · modos claro y oscuro (el oscuro es el cálido "marrón + miel", NO el dark violeta actual)
- Acento: **oliva** — claro `#6f7a3d`, oscuro `#a3b366`
- Fuente de títulos: **Sans (Inter)** — se mantienen Inter + JetBrains Mono self-hosted, no hay fuentes nuevas
- Radio base: **8px** (filas), inputs 10px, paneles 14px
- Estilo de fila: **tarjetas** (elevated: fondo card + borde sutil + sombra pequeña)
- Shell: **flotante** (el área de contenido es un panel con radio y borde, separado del canvas)

## Qué NO tocar (restricciones duras)
- **Autenticación y sincronización Firebase** (`src/js/firebase-sync.js`, `window.AnsoSync`, login Google, Firestore) — mantener intacta.
- Capa de datos: `src/js/state/*`, claves de `localStorage` (`anso-*`, `antask-*`), export/import.
- Parser de lenguaje natural (`utils/nl-parse.js`, `nl-chips.js`), notificaciones, PWA/service worker, i18n, analítica/consentimiento, onboarding (solo re-tematizar).
- Atajos de teclado y flujos existentes.
- La **landing** (`index.html` + `landing.css`) queda fuera de este handoff salvo que se pida.

## Mapa de trabajo sobre el repo
| Área | Archivos de prod | Cambio |
|---|---|---|
| Tokens | `src/css/style.css` (bloque `:root` + tema claro) | Sustituir valores por los de `tokens.css` (este paquete). Los NOMBRES de variable existentes se conservan; hay 3 tokens nuevos: `--accent-on`, `--accent-tint`, `--row-hover`. |
| Tema | `src/js/ui/theme.js` | Igual mecánica claro/oscuro (View Transitions incluida). Solo cambian los valores. |
| Filas de tarea | `style.css` + render en `script.js` | Estilo "tarjetas": fondo `--surface-card`, borde `--border-default`, radio `--r-md` (8px), sombra `--shadow-sm`, alto ≈42px, padding 9px 12px, hover `--row-hover`. Checkbox circular. |
| Shell flotante | layout en `app.html` / `style.css` | Contenido principal como panel flotante: fondo `--surface-card`... ver prototipo (borde `--border-default`, radio 14px, margen respecto al canvas). |
| Sidebar | `style.css` | En tema claro la sidebar permanece OSCURA (`#221d16`) — rasgo distintivo. Ver bloque `.sidebar` en `tokens.css`. Item activo: fondo `--accent-tint` + texto acento. |
| Vistas Hoy/Inbox | `script.js` (render) | Layout según prototipo: cabecera con título grande (30px/700/-0.02em), contador, segmentos de filtro con fondo `--surface-raised` en el activo. |
| Captura rápida | `src/js/ui/quick-capture.js` | Re-tematizar modal según `referencia/quick-capture.jsx`. |
| Móvil | `style.css` (media queries) o vistas dedicadas | Recrear la UI de `Antask Móvil v1.html`: barra inferior de navegación (efecto vidrio, safe-area), lista, notas, hoja de ajustes/apariencias. Objetivos táctiles ≥44px. |
| Ajustes/perfil | `sections-and-profile.js` | Re-tematizar; añadir selector de apariencia si se quiere exponer (el prototipo `appearances.jsx` muestra el picker). |

## Tokens de diseño
Fuente de verdad: **`tokens.css`** (en este paquete), ya mapeado a los nombres de variable de `style.css`. Resumen:

Oscuro (por defecto): canvas `#17120d`, card `#211a13`, sidebar `#100c08`, texto `#f1e9dc` / `#b6a691` / `#80715c`, borde `rgba(255,238,214,.09)`, acento `#a3b366` (texto sobre acento `#241910`), éxito `#5fb3a3`, aviso `#e0a35a`.

Claro: canvas `#f4efe3`, card `#fffdf6`, sidebar oscura `#221d16`, texto `#2a251d` / `#6a6151` / `#7a7060`, borde `rgba(50,40,24,.11)`, acento `#6f7a3d` (texto sobre acento `#fffdf6`).

Tipografía: Inter (UI y títulos), JetBrains Mono (kbd/mono). Título de vista: 30px / 700 / -0.02em. Escalas de tamaño, espaciado y sombras de prod se conservan.

## Interacciones y estados
- Hover de fila: fondo `--row-hover`, transición 120–150ms.
- Segmentos de filtro: pista `--surface-input`; activo `--surface-raised` + sombra sutil.
- Cambio de tema: mantener la animación radial (View Transitions) existente.
- Móvil: la barra inferior tiene un brillo animado sutil que respeta `prefers-reduced-motion` (ver `@keyframes lgShine` en el HTML móvil).
- Todo lo demás (drag, multi-selección, undo…) se conserva tal cual, re-tematizado.

## Orden de implementación sugerido
1. `tokens.css` → volcar a `style.css` (oscuro primero, luego claro + sidebar clara-oscura).
2. Barrido de residuos violeta: buscar `#8b5cf6`, `#a78bfa`, `#7c3aed`, `rgba(139, 92, 246` hardcodeados fuera de variables.
3. Filas "tarjetas" + shell flotante + sidebar.
4. Vistas Hoy/Inbox + captura rápida + modales.
5. Móvil.
6. QA: ambos temas × escritorio/móvil, contraste AA, `npm run test:e2e` (existe suite de a11y con axe).

## Criterios de aceptación
- Ningún violeta del tema antiguo visible en la app (la landing puede quedar como está).
- Claro y oscuro completos y conmutables como hoy; preferencia en `mis-tareas-theme` intacta.
- Login Google + sync Firestore funcionan sin cambios.
- Los e2e y tests existentes pasan.
- Comparación lado a lado con los prototipos: fiel a nivel de píxel en colores, radios, espaciado y jerarquía.

## Archivos del paquete
- `README.md` — este documento
- `tokens.css` — tokens finales mapeados a las variables de prod
- `referencia/Antask v1.html` (+ `themes.jsx`, `views.jsx`, `v1/*.jsx`, `quick-capture.jsx`) — escritorio
- `referencia/Antask Móvil v1.html` (+ `mobile-app-v3.jsx`, `notes-view.jsx`, `appearances.jsx`, `pro-paywall.jsx`, `ios-frame.jsx`) — móvil
- `tweaks-panel.jsx`, `image-slot.js` — infraestructura del prototipo (ignorar)

## Prompt sugerido para Claude Code
> Lee `design_handoff_antask_v1/README.md` y `tokens.css`. Abre los dos HTML de `referencia/` en el navegador y usa los `.jsx` para valores exactos. Implementa el rediseño en este repo siguiendo el orden sugerido, sin tocar Firebase, la capa de datos ni las claves de localStorage. Trabaja en una rama `redesign/tierra-v1` con commits por fase.

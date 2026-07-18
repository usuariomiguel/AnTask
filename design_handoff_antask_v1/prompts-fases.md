# Prompts por fases — rediseño Tierra en Claude Code

Uno por sesión, en orden. Cada uno acaba con verificación visual obligatoria. Trabaja siempre en la rama `redesign/tierra-v1`.

---

## Fase 1 — Shell flotante + sidebar

> Lee `design_handoff_antask_v1/tokens.css` y abre `design_handoff_antask_v1/referencia/Antask v1.html` en el navegador (configuración por defecto del panel de tweaks). Implementa SOLO el shell y la sidebar, sin tocar nada más:
>
> 1. **Shell flotante**: en `app.html` el contenido es `main.main-panel` (línea ~208) dentro del layout con `aside.sidebar` (línea ~100). En `src/css/style.css`, convierte `.main-panel` en un panel flotante: fondo `var(--surface-card)`, borde 1px `var(--border-default)`, `border-radius: 14px`, margen ~10px respecto al canvas (`--surface-canvas` de fondo en el body/contenedor), `overflow: hidden`. En móvil (<768px) el panel va a sangre completa (sin radio ni margen).
> 2. **Sidebar**: fondo `var(--surface-deep)`. CLAVE: en tema claro (`:root[data-theme="light"]`) la sidebar PERMANECE oscura (`#221d16`) — copia el bloque `[data-theme="light"] .sidebar` de `tokens.css` con sus tokens de texto/borde locales. Item de proyecto activo: fondo `var(--accent-tint)` + texto en acento; radio 8px.
> 3. No toques `.task-item`, vistas, ni JS.
>
> Verifica: `npm run dev`, captura la app en claro y oscuro, compárala lado a lado con el prototipo abierto. No des la fase por terminada sin esa comparación.

---

## Fase 2 — Filas de tarea "tarjeta"

> Con el prototipo `referencia/Antask v1.html` abierto (vista Hoy), restyla `.task-item` en `src/css/style.css` (bloque principal línea ~1974; variantes en ~2043 light, ~2426 compact, ~4268 móvil, ~5488 select-mode — actualiza TODAS):
>
> - Fondo `var(--surface-card)`, borde 1px `var(--border-default)`, `border-radius: 8px`, sombra pequeña (usa la `--shadow-sm` existente), padding 9px 12px, alto mínimo ~42px, separación entre filas 6px (gap del contenedor, no margin).
> - Hover: fondo `var(--row-hover)`, transición 130ms.
> - Checkbox circular: 18px, borde 1.5px `var(--border-strong)`, redondo; al completar, relleno `var(--c-primary-500)` con check en `var(--accent-on)`.
> - Tarea completada: texto `var(--text-tertiary)` con line-through suave.
> - Modo compacto (`body.tasks-compact`) conserva la tarjeta pero con padding 6px 10px.
> - Lee `referencia/v1/hoy-view.jsx` para los valores exactos de tipografía y metadatos de fila.
>
> Verifica lado a lado con el prototipo en ambos temas, incluyendo estados hover, completada, seleccionada y compacto.

---

## Fase 3 — Cabeceras de vista + segmentos de filtro

> Según el prototipo (vistas Hoy e Inbox) y `referencia/v1/hoy-view.jsx` / `inbox-view.jsx`:
>
> - Título de vista: 30px / weight 700 / letter-spacing -0.02em / `var(--text-primary)`, con contador de tareas al lado en `var(--text-tertiary)` (15px, weight 400).
> - Subtítulo/fecha: 14px `var(--text-secondary)`.
> - Segmentos de filtro: pista con fondo `var(--surface-input)`, radio 8px, padding interno 3px; segmento activo con fondo `var(--surface-raised)`, sombra sutil y texto `var(--text-primary)`; inactivos `var(--text-tertiary)`.
> - Botón de acción primaria de cabecera: fondo `var(--grad-primary)`, texto `var(--accent-on)`, radio 8px, glow `var(--glow-primary)` en hover.
>
> No cambies la lógica de filtros en `script.js` — solo clases/estilos y, si hace falta, marcado de la cabecera. Verifica lado a lado en ambos temas.

---

## Fase 4 — Captura rápida + modales

> Re-tematiza el modal de captura rápida (`src/js/ui/quick-capture.js` + su CSS) y los modales (`src/js/ui/modal.js`) según `referencia/quick-capture.jsx`:
>
> - Panel: fondo `var(--surface-overlay)`, borde `var(--border-default)`, radio 14px, backdrop con blur.
> - Input: 17px, fondo transparente; chips del parser NL con `var(--accent-tint)` y texto en acento.
> - Botón enviar: acento oliva (`--c-primary-500` / `--accent-on`).
> - Los footers de atajos usan `var(--kbd-bg)` para las teclas.
>
> No toques `nl-parse.js` ni la lógica. Verifica abriendo la captura rápida (Cmd+K / atajo existente) junto al prototipo.

---

## Fase 5 — Móvil

> Abre `referencia/Antask Móvil v1.html` en el navegador. Implementa la UI móvil en `src/css/style.css` (media queries; `.mobile-bottom-nav` está en ~4940 y su variante light en ~4954) y `app.html` (nav línea ~420):
>
> - **Barra inferior**: efecto vidrio (fondo semitransparente + `backdrop-filter: blur`), radio 22px, flotante con margen y `env(safe-area-inset-bottom)`, borde `var(--border-default)`. Ítem activo: `var(--accent-tint)` + icono en acento. Objetivos táctiles ≥44px. El brillo animado del prototipo (`@keyframes lgShine` en el HTML móvil) es opcional; si lo añades, respeta `prefers-reduced-motion`.
> - **FAB**: gradiente `var(--grad-primary)`, icono `var(--accent-on)`, glow.
> - Lista y cabeceras móviles heredan lo hecho en fases 2-3; ajusta paddings según el prototipo.
> - Lee `referencia/mobile-app-v3.jsx` para valores exactos.
>
> Verifica en el device toolbar (iPhone 14, 390×844) claro y oscuro, comparando con el prototipo.

---

## Fase 6 — Barrido final + QA

> 1. Busca residuos del tema violeta antiguo en todo `src/`: `#8b5cf6`, `#a78bfa`, `#7c3aed`, `#6d28d9`, `rgba(139, 92, 246` y cualquier hsl violeta hardcodeado fuera de variables. Sustituye por el token equivalente. La landing (`index.html`, `landing.css`) queda FUERA.
> 2. Comprueba contraste AA en ambos temas (texto secundario sobre card, acento sobre fondos).
> 3. Corre `npm run test` y `npm run test:e2e` — deben pasar.
> 4. Recorre toda la app (Hoy, Inbox, proyectos, calendario, agenda, búsqueda, ajustes, onboarding) en claro/oscuro × escritorio/móvil y lista cualquier pantalla que siga viéndose del tema antiguo. Corrígelas.
> 5. Login Google + sync Firestore intactos.

---

### Regla para todas las fases
Al terminar cada fase: captura de pantalla del resultado junto al prototipo, en claro y oscuro. Si algo no coincide en color, radio, espaciado o jerarquía, corrígelo antes de hacer commit. Un commit por fase: `redesign(fase-N): …`.

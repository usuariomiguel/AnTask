# Handoff: Antask Móvil v1

## Overview

Antask es una app de tareas con acento cálido y editorial. Este paquete cubre la **v1 móvil**: la app completa tal y como debe salir a producción, con cuatro destinos de navegación (Hoy, Inbox, botón +, Perfil) y sus pantallas secundarias (detalle de tarea, menú, ajustes, apariencias, PRO).

El alcance de la v1 deja **Notas bloqueada**: la pestaña aparece en la barra inferior con candado y opacidad reducida, no es pulsable. El código de Notas está presente y funciona, pero no debe exponerse en producción hasta que el producto lo decida.

## Sobre los archivos de diseño

Los archivos de `referencia/` son **referencias de diseño escritas en HTML/JSX sobre Babel en el navegador**. Son prototipos que muestran la apariencia y el comportamiento previstos, **no código de producción para copiar tal cual**. Concretamente:

- Todo el estilo va en objetos de estilo inline de React; no hay hojas de estilo ni sistema de componentes.
- Los datos son fixtures en memoria (`ANTASK_DATED`, `NOTES_DATA`).
- La app se renderiza dentro de un marco de iPhone simulado (`ios-frame.jsx`) a 402×874, que **no forma parte del producto**.
- Hay un panel de "Tweaks" (`tweaks-panel.jsx`) para explorar variantes de diseño; **tampoco va a producción**.

La tarea es **recrear estos diseños en el entorno de la app real** (React Native, Swift/SwiftUI, Kotlin/Compose o React web con Capacitor, según lo que ya exista), usando sus patrones y librerías establecidos. Si aún no hay entorno, elige el más apropiado; para una app de tareas con offline-first, React Native o SwiftUI son las apuestas naturales.

## Fidelidad

**Alta fidelidad.** Colores, tipografía, espaciado, radios y transiciones son definitivos. La UI debe recrearse fielmente. Los únicos elementos deliberadamente provisionales son los datos de ejemplo y el avatar del usuario (hoy un hueco de imagen).

---

## Sistema de temas

Todo el color sale de un objeto `theme` construido en tiempo de render. No hay colores sueltos en los componentes salvo los rojos de estado, que están pendientes de tokenizar (ver *Deuda conocida*).

El tema se compone de tres capas:

1. **Base de modo** — `tierra` (claro) u `oscuro`. Definen lienzo, tarjeta, tintas y bordes.
2. **Acento** — cinco opciones cálidas. En modo oscuro se usa la variante aclarada (`sb`) para que lea sobre fondo oscuro.
3. **Ajustes del usuario** — fuente de título y radio de esquinas.

### Tokens · modo claro (tierra)

| Token | Valor | Uso |
|---|---|---|
| `canvas` | `#f4efe3` | Fondo de pantalla |
| `card` | `#fffdf6` | Tarjetas, hojas, barra inferior |
| `ink` | `#2a251d` | Texto principal |
| `ink2` | `#6a6151` | Texto secundario, metadatos |
| `ink3` | `#7a7060` | Texto terciario, iconos inactivos |
| `border` | `rgba(50,40,24,0.11)` | Bordes de tarjeta y separadores |
| `accent` | `#ad5230` | Acento (arcilla, por defecto) |
| `accentOn` | `#fffdf6` | Texto sobre acento |
| `accentInk` | `#9c4628` | Acento como texto sobre lienzo |
| `tintBg` | `rgba(173,82,48,0.13)` | Fondos teñidos, contadores |
| `inputBg` | `#fffdf6` | Campos |
| `zebraBg` | `rgba(50,42,28,0.025)` | Franja alterna en vista Cebra |

### Tokens · modo oscuro

| Token | Valor |
|---|---|
| `canvas` | `#17120d` |
| `card` | `#211a13` |
| `ink` | `#f1e9dc` |
| `ink2` | `#b6a691` |
| `ink3` | `#80715c` |
| `border` | `rgba(255,238,214,0.09)` |
| `accent` | `#e0915a` |
| `accentOn` | `#2a1c10` |
| `accentInk` | `#e8a36c` |
| `tintBg` | `rgba(224,145,90,0.15)` |
| `inputBg` | `rgba(255,245,230,0.045)` |
| `zebraBg` | `rgba(255,255,255,0.045)` |

### Acentos

| Nombre | Claro | Oscuro (`sb`) |
|---|---|---|
| arcilla (defecto) | `#ad5230` | `#e08a5a` |
| terracota | `#c25e3a` | `#e8956a` |
| miel | `#d98a4f` | `#ecae74` |
| oliva | `#6b7a4a` | `#a3b075` |
| burdeos | `#9a3f43` | `#c97478` |

### Etiquetas (tags)

Claro: verde `bg rgba(74,118,68,.14)` / `fg #3c6b38`; ámbar `bg rgba(181,130,54,.16)` / `fg #85591a`; pizarra `bg rgba(110,100,80,.13)` / `fg #6a6151`.
Oscuro: verde `fg #7fd0c0`; ámbar `fg #f0bd84`; pizarra `fg #cabba2`, todos sobre fondos al 14–16% de opacidad.

### Colores de lista

Paleta cerrada para listas creadas por el usuario: `#c98a3c`, `#5aa06b`, `#3f8a7d`, `#b0664a`, `#8a7c5e`, `#b58236`.

---

## Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| UI | Inter | Todo el texto de interfaz |
| Display | Bricolage Grotesque (defecto), Inter o Newsreader | Títulos de pantalla y de tarea |
| Mono | JetBrains Mono | Fechas, contadores, chips, cabeceras de sección |
| Serif | Newsreader | Cuerpo de notas y respuestas a consultas |

El usuario elige la fuente de display entre Grotesca / Sans / Serif en Ajustes.

### Escala

| Elemento | Tamaño | Peso | Notas |
|---|---|---|---|
| Título de pantalla | 29–30px | 700 | `letter-spacing: -0.035em` en Grotesca |
| Título de detalle de tarea | 22px | 600 | Escalado por `--tm` |
| Título de tarea en fila | 15px | 500 | 2 líneas máximo, luego elipsis |
| Cuerpo de nota | 14.5px | 400 | Serif, `line-height: 1.45` |
| Fila de menú | 15.5px | 500 | |
| Metadatos y fechas | 12px | 600–700 | Mono, `tabular-nums` |
| Chips y contadores | 12px | 650–700 | Mono |
| Etiqueta de pestaña | 12px | 550 / 700 activa | |

**Nada baja de 12px.** Es un mínimo firme para producción.

Un multiplicador de escala de texto (`--tm`, ajuste de accesibilidad) afecta a títulos y cuerpo; los metadatos quedan fuera a propósito para no romper las filas.

---

## Forma y elevación

- Radio de esquinas: tarjetas de tarea `max(radio + 2, 8)`, grupos de menú `max(radio + 4, 14)`, campos `radio + 2`, hojas `22px 22px 0 0`, barra inferior `28px`, chips `5px`, checkbox `50%`. El radio base es un ajuste del usuario (0–16, por defecto 8).
- Sombras: tarjetas `0 1px 2px rgba(40,30,15,0.05)`; barra inferior `0 14px 32px -12px rgba(40,28,12,0.38)` en claro y `0 10px 30px -10px rgba(0,0,0,0.7)` en oscuro; hojas `0 -10px 40px rgba(0,0,0,0.3)`; FAB `0 8px 18px -6px` del acento al 55%.
- Velo de hoja modal: `rgba(20,14,6,0.42)`.

---

## Pantallas

### 1 · Hoy

**Propósito.** Lo que toca hacer hoy y lo que se quedó atrás.

**Layout.** Cabecera grande con título "Hoy", subtítulo con la fecha larga en español y, a la derecha, el resumen del día: "N de M hechas" (12px, `ink2`, alineado a la derecha) más un anillo de progreso de 44px. Si hay vencidas, bajo el resumen aparece "N vencidas" en rojo, peso 700.

**Anillo de progreso.** SVG de 44×44, radio 18, trazo 4.5, rotado −90°. Pista al 9% de blanco en oscuro / 7% de negro en claro; arco en `accent` con `stroke-linecap: round`. El porcentaje va centrado, 10px, peso 700, `tabular-nums`. Transición `stroke-dashoffset .5s cubic-bezier(0.45,0.05,0.2,1)`.

**Contenido.** Campo de añadido rápido ("Añadir una tarea para hoy…") que crea la tarea con vencimiento hoy; el botón Añadir solo aparece con texto. Después, secciones en este orden: Vencidas, Hoy, Consultas pendientes. Cada cabecera de sección lleva icono, etiqueta en versalitas mono y contador en píldora.

La sección Vencidas ofrece "Mover todas a hoy". Cada fecha vencida es pulsable y mueve esa tarea a hoy.

### 2 · Inbox

**Propósito.** Todas las tareas, filtrables y buscables.

**Layout.** Cabecera con título ("Inbox" o el nombre de la lista activa) y subtítulo con el número de pendientes. Buscador. Fila de dos controles: Filtrar (filtro fijo: Todas, Pendientes, Completadas, Vencidas, Hoy, Sin fecha, Alta prioridad, Con nota) y modo de vista.

**Modos de vista.** Cuatro, persistidos: Tarjetas (tarjeta con borde y sombra), Limpio (sin adorno), Líneas (separador inferior), Cebra (franja alterna).

**Completadas** van en una sección plegable al final, con contador.

### 3 · Detalle de tarea

Cabecera de subpantalla: botón atrás con el nombre de la pantalla de origen, y botón de opciones (⋯) a la derecha. Título editable en un textarea que crece solo, 22px display. Debajo, campos: vencimiento, prioridad, lista, nota asociada.

### 4 · Menú (Perfil)

Grupos de filas sobre tarjeta. Cada fila: cuadrado de color de 30px con icono, etiqueta, contador y chevron. Las listas del usuario tienen botón de editar (lápiz) de 44px. Al final, acceso a Ajustes, Apariencia y Antask PRO.

### 5 · Ajustes / Apariencia / PRO

Ajustes expone modo, acento, fuente de título y radio. Apariencia es una galería de packs con vista previa; los packs PRO llevan insignia y abren el muro de pago. PRO es una pantalla de suscripción con selector mensual/anual y lista de ventajas.

---

## Componentes

### Fila de tarea

Altura mínima cómoda, `padding: 13px 15px`, `gap: 12`. De izquierda a derecha: checkbox, bloque de contenido (título más chips de prioridad y etiqueta), y fecha alineada a la derecha.

**No hay barra de color a la izquierda.** Se retiró a propósito: la prioridad se lee por su chip.

**Checkbox.** Área táctil de 44×44 con `margin: -11` para no alterar la altura de la fila; el círculo visible es de 22px. Sin marcar: borde de 2px en `ink3` al 60% de opacidad. Marcado: relleno en el color de la lista o el acento, con check de 13px. En producción debe ser un control real con estado marcado accesible.

**Tachado.** Al completar, el título se tacha con un garabato SVG dibujado a mano en 0.42s: entra bajo por la izquierda, ondula al cruzar, se escapa por la derecha y hace un retorno corto sobre el tramo final. Grosor constante (1.6px) sea cual sea el ancho de la fila. Color de tinta, no acento. Ver `v1/scribble-strike.jsx` en el proyecto para las curvas exactas.

**Deslizar.** Izquierda a derecha mueve a Hoy (fondo acento, icono sol); derecha a izquierda elimina (fondo `#b0473f`, icono papelera). Umbral de disparo, resistencia en los extremos y un tutorial de una sola vez que empuja la primera fila 54px y vuelve, guardado en `antask_swipe_hinted`.

**Fecha.** Formato relativo capitalizado ("Ayer", "Hoy", "Mañana", luego fecha corta). Vencida y sin completar: píldora roja pulsable con flecha, que mueve la tarea a hoy.

### Barra inferior

Flotante sobre el contenido, `padding: 8px 14px max(22px, env(safe-area-inset-bottom))`. Pastilla de fondo `card` con borde, radio 28. Cuatro destinos en v1: Hoy, Inbox, botón +, Perfil.

Cada pestaña es un botón de 56×44 mínimo, en columna: icono de 23px (trazo 2.4 activo / 1.9 inactivo) y etiqueta de 12px. Activa en `accentInk` con peso 700; inactiva en `ink3`. Perfil usa el avatar circular de 26px con anillo, no un icono.

El botón + es un círculo de 50px en `accent`. Su colocación es configurable (Separado, Centrado, Integrado); **Separado es la de producción**: el FAB va fuera de la pastilla, a su derecha.

### Hojas modales

Suben desde abajo con `translateY(100%) → 0` en 0.26s `cubic-bezier`, el velo entra con fade de 0.2s. Asa de 38×5 arriba. `paddingBottom: max(22px, env(safe-area-inset-bottom))`. Se usan para: captura rápida, nueva/editar lista, opciones de nota, opciones de tarea, filtros y modo de vista.

### Toast de deshacer

Aparece al completar o eliminar. Icono, etiqueta y botón "Deshacer" en acento. Se va solo a los 6 segundos.

---

## Interacciones y movimiento

| Acción | Comportamiento |
|---|---|
| Tocar fila | Abre el detalle |
| Tocar checkbox | Alterna hecho, muestra toast de deshacer |
| Deslizar derecha | Mover a hoy |
| Deslizar izquierda | Eliminar, con toast de deshacer |
| Tocar fecha vencida | Mueve a hoy |
| Tocar + | Abre captura rápida |
| Enter en captura | Guarda |
| Escape en añadido rápido | Limpia y desenfoca |

**Duraciones.** Hojas 0.26s, velo 0.2s, anillo de progreso 0.5s, tachado 0.42s, cambios de color 0.12–0.16s.

Todo lo continuo (el brillo que recorre la barra inferior, los efectos ambientales de los packs de apariencia) debe respetar `prefers-reduced-motion`.

---

## Estado y persistencia

### Estado de la app

```
screen        pantalla actual
prev          pantalla anterior (para el botón atrás)
tasks         [{ id, title, due, done, prio, label, lk, list, noteId }]
notes         [{ id, title, pin, updated }]
linesByNote   { [noteId]: [{ id, text, kind, done }] }   kind: texto | tarea | consulta
lists         [{ id, name, color, icon, count }]
rowStyle      tarjetas | limpio | lineas | cebra
activeList    filtro de lista en Inbox
toast         { label, onUndo } | null
```

### Persistencia

Prefijo `antask_m_v1_`, una clave por dato: `tasks`, `notes`, `lines`, `lists`, `rowstyle`. Se escribe en cada cambio y toda lectura/escritura va envuelta en try/catch (el modo privado de Safari lanza al escribir). Una clave corrupta solo afecta a su dato; el resto carga con los valores de origen.

**En producción esto debe ser una base de datos local real** (SQLite, Room, Core Data, WatermelonDB) con sincronización. `localStorage` era lo adecuado para el prototipo, no para la app.

---

## Accesibilidad

Ya resuelto en el prototipo y **obligatorio de mantener**:

- Todo control es un botón real, enfocable y accionable con teclado, con `aria-label` cuando el contenido no basta.
- Las pestañas llevan `aria-current` y la bloqueada va `disabled` con etiqueta que lo dice.
- El checkbox de tarea expone rol y estado marcado.
- Foco visible solo con teclado (`:focus-visible`), anillo de 2px con 2px de separación.
- Áreas táctiles de 44px mínimo en toda la navegación y en los iconos de cabecera.
- Sin destello azul al tocar en iOS.

Pendiente: repasar contraste de los rojos de estado en modo oscuro y verificar con VoiceOver/TalkBack.

---

## Safe areas

`viewport-fit=cover`. La barra inferior y todas las hojas usan `max(22px, env(safe-area-inset-bottom))`; el contenedor de scroll reserva `calc(104px + env(safe-area-inset-bottom))`. En el marco simulado el inset es 0, así que el resultado es idéntico al diseño; en un dispositivo real respeta el indicador de inicio.

La zona superior es un espaciador fijo de 56px para status bar e isla dinámica. En producción debe salir de `env(safe-area-inset-top)` o del equivalente nativo.

---

## Deuda conocida antes de producción

1. **Rojos de estado sin tokenizar.** `#b0473f` (claro) y `#e0846a` (oscuro) están escritos a mano en varios sitios. Deben ser tokens del tema y revisarse en cada apariencia.
2. **Sin confirmación al eliminar una lista con tareas dentro.** Las tareas se quedan huérfanas.
3. **Faltan estados vacíos** para Hoy sin tareas, búsqueda sin resultados y lista vacía. Solo existe "Crear tu primera lista".
4. **Sin error boundary.** Un fallo en una vista deja la pantalla en blanco.
5. **`prefers-reduced-motion` incompleto.** Solo lo respeta el brillo de la barra inferior; falta en hojas y transiciones.
6. **Notas está bloqueada pero su código está cargado.** Decidir si se elimina del bundle de v1.
7. **El avatar es un hueco de imagen.** Necesita un componente real con carga, recorte y respaldo por iniciales.

---

## Assets

- **Fuentes:** Inter, JetBrains Mono, Newsreader, Bricolage Grotesque (Google Fonts). En nativo, empaquetarlas.
- **Iconos:** todos dibujados en SVG dentro de `inbox-view.jsx` (componente `Ico`). Trazo, sin relleno. En producción conviene sustituirlos por el set de iconos de la plataforma o empaquetarlos como assets.
- **Avatar:** hueco de imagen, sin asset real.
- No hay imágenes de mapa de bits en el diseño.

---

## Archivos de referencia

| Archivo | Qué contiene |
|---|---|
| `Antask Móvil v1.html` | Punto de entrada: fuentes, reset de botones, defaults de tweaks, montaje |
| `mobile-app-v3.jsx` | **La app entera.** Todas las pantallas, componentes y estado |
| `themes.jsx` | Paletas, acentos, fuentes y constructor de tema |
| `appearances.jsx` | Packs de apariencia (incluido el pack oscuro Ceniza) |
| `inbox-view.jsx` | Set de iconos (`Ico`) y componentes compartidos con escritorio |
| `views.jsx` | Datos de ejemplo con fecha, prioridades y helpers de fecha |
| `notes-view.jsx` | Datos de notas y helpers de líneas |
| `settings.jsx` | Pantalla de ajustes |
| `pro-paywall.jsx` | Plan y muro de pago |
| `ios-frame.jsx` | Marco de iPhone simulado — **no va a producción** |
| `tweaks-panel.jsx` | Panel de exploración de diseño — **no va a producción** |
| `image-slot.js` | Hueco de imagen del prototipo — **no va a producción** |

Para abrir la referencia: servir la carpeta `referencia/` por HTTP (no `file://`, Babel necesita origen) y abrir `Antask Móvil v1.html`.

---

## Orden sugerido de implementación

1. Tokens de tema y tipografía; verificar claro y oscuro en paralelo.
2. Fila de tarea con checkbox, chips y fecha. Es el componente que más se repite.
3. Pantalla Hoy con anillo de progreso y añadido rápido.
4. Barra inferior y navegación.
5. Persistencia real y detalle de tarea.
6. Inbox con filtros, búsqueda y modos de vista.
7. Deslizar, toast de deshacer y hojas modales.
8. Menú, ajustes y apariencias.
9. La deuda conocida de arriba, antes de publicar.

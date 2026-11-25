# «La hormiga»: más personalidad para el tema actual

Maquetas del 20-nov-2026, hechas sobre el diseño actual (Tierra), en modo claro y oscuro.
Usan la silueta real del logo (`src/img/logo-hormiga.svg`), separada en piezas: antenas, cuerpo y patas.
Nada de esto está en la app; es solo referencia. **Para verlo todo de un vistazo, abre `resumen.html`.**

## Archivos

- **`index.html`** (PC, 1440×900). Hashes:
  - `#hoy`: la hormiga se lleva una tarea al abrir la página. Al pulsar un círculo se lleva otra, y al pulsar un hábito se suma una hormiga a la racha.
  - `#hoy-congelado`: el mismo momento detenido a mitad, para la captura.
  - `#fin`: día terminado.
  - `#actividad`: el hormiguero.
  - `#vacios`: estados vacíos y pequeños momentos.
- **`movil.html`** (390×844). Hashes: `#hoy`, `#hoy-congelado`, `#habitos`, `#fin`, `#actividad` e `#inbox` (vacío).
- **Modo oscuro:** añade `?oscuro` antes del hash (por ejemplo, `index.html?oscuro#fin`) o pulsa el botón del sol de la maqueta.
- **Capturas:**
  - PC: `hoy.png`, `fin.png`, `actividad.png`, `vacios.png`;
  - móvil: `movil-hoy.png`, `movil-habitos.png`, `movil-fin.png`, `movil-actividad.png`, `movil-inbox.png`;
  - las mismas terminadas en `-oscuro`, en modo oscuro.

Las fuentes se cargan desde Google Fonts, así que hace falta conexión para verlas bien. En la app ya están autoalojadas, porque son Bricolage Grotesque y Figtree.

## Las ideas

1. **El progreso como rastro.** El anillo del porcentaje se sustituye por un caminito de puntos que acaba en un hormiguero. La hormiga avanza según completas tareas y cada tarea deja una miga en el montículo.
2. **La hormiga se lleva la tarea.** Al completar una tarea, primero se tacha a mano. Después llega la hormiga, la carga encima y se la lleva, y la tarea reaparece en hechas. Con «reducir movimiento», solo se marca como hecha.
3. **Rachas de hábitos como filas de hormigas:** una hormiga por cada día cumplido.
4. **Estados vacíos con la hormiga:**
   - día terminado: la hormiga duerme en una hoja que hace de hamaca;
   - Inbox vacío;
   - búsqueda sin resultados («Ni rastro de…»);
   - sin conexión: la hormiga con una antena doblada;
   - hábito nuevo.
5. **Actividad como hormiguero en corte.** Cada cámara es una semana y cada semilla, una tarea hecha, con el color de su lista. La semana en curso se está cavando.
6. **Detalles:**
   - una hormiga asomada encima de la barra de captura, o del botón + en el móvil;
   - el indicador de carga es una hormiga caminando.
7. **Menos ruido y más materia:**
   - las filas solo muestran la bandera, la repetición o el enlace si los tienen;
   - títulos de sección en Bricolage, con líneas de puntos en vez de rayas;
   - el menú lateral en papel kraft y la hoja más clara, con otra hoja asomando debajo;
   - la pestaña activa se mete bajo la hoja, como un marcapáginas;
   - en el móvil, las pestañas Tareas | Hábitos asoman como pestañas de carpeta.

## Modo oscuro

Usa los tokens oscuros de la app (`:root` en `src/css/style.css`):
- la mesa es `--surface-desk`;
- la hoja es un tono entre `--surface-card` y `--surface-canvas`;
- el acento es `--c-primary-500` (#a4b272), con el texto oscuro encima;
- el texto va en `--text-*`;
- vencidas, en `--c-overdue`.

La hormiga pasa a oliva claro, y los colores de las listas se aclaran para que se lean sobre oscuro. Para que no sea un simple negativo, lleva toques de noche:
- estrellas que titilan sobre el rastro;
- la entrada del hormiguero con luz cálida;
- luna y luciérnagas en el día terminado;
- las cámaras del hormiguero iluminadas desde dentro, como con un farol.

## Cómo encajarlo en la app

- **Animaciones:** la de llevarse la tarea usa la Web Animations API, sin librerías. Cada paso está en `llevarse()` de las maquetas.
- **Cuándo aparece:** la hormiga solo sale en momentos concretos, así que la app sigue sobria en el día a día.
- **El hormiguero:** se puede alimentar con lo que ya registra `src/js/activity/`, agrupado por semanas.
- **Pendiente:**
  - textos en inglés: «¿Qué cargamos hoy?», «Todo cargado.», «Ni rastro de…»;
  - decidir si la hormiga se puede desactivar en Ajustes.

## Añadido el 23-nov-2026: Notas y Agenda (móvil)

Dos pantallas nuevas en `movil.html`. Las de antes no cambian: se comprobó, elemento a elemento, que generan el mismo HTML y los mismos estilos que la versión anterior, en claro y en oscuro. Ninguna captura existente se ha sustituido.

- **`#notas`**: sección nueva de notas.
  - Pestañas de carpeta «Todas | Fijadas» y bloques «Fijadas» y «Esta semana» con la línea de puntos.
  - Notas en dos columnas, como hojitas sobre la hoja. Las fijadas llevan un trozo de cinta de papel.
  - Una nota puede ser una lista; sus casillas se marcan, y «Pasar 2 a tareas» convierte lo pendiente en tareas.
  - Cada nota lleva el color de su lista y su fecha.
- **`#agenda`**: Hoy por horas, como tercera pestaña junto a «Tareas | Hábitos».
  - Arriba, «Sin hora»: las tareas de hoy sin hora, para arrastrarlas a un hueco.
  - Debajo, la rejilla del día con líneas de puntos por hora y la línea de «ahora» (9:41).
  - Tareas con hora: tarjeta con casilla y el color de su lista.
  - Eventos de otros calendarios (Google, iCloud): sin casilla y teñidos con el color de su calendario.
  - Hábitos con hora: en píldora, con su hormiga.
  - Si dos cosas se solapan, van en columnas (la presentación y el dentista).
  - Las vencidas se quedan en la pestaña «Tareas».
- **Barra inferior:** en estas dos pantallas lleva «Notas» (Hoy · Inbox · Notas · Buscar · perfil). Las demás siguen con la de antes, para poder compararlas.
- **Capturas:** `movil-notas.png`, `movil-agenda.png` y las mismas terminadas en `-oscuro`.

Para llevarlo a la app:
- **Notas:** la app tuvo notas y se retiraron; al arrancar todavía borra la clave `antrack-notes` de localStorage. Las nuevas necesitan otra clave, o se borrarían solas.
- **Agenda:** las tareas no tienen hora ni duración (solo `dueDate` y `reminderAt`), así que hacen falta dos campos nuevos, con cuidado de que un dispositivo con la versión vieja no los borre al sincronizar.
- **Calendarios:** la app es una PWA y no puede leer los calendarios del teléfono. Los eventos de Google o iCloud entrarían por una URL .ics o por la API de Google; la lectura directa del calendario del móvil solo con una app nativa.

## Añadido el 23-nov-2026: Inbox con listas y detalle de tarea (móvil)

Tres pantallas nuevas en `movil.html`. `#inbox` (la bandeja vacía) y `movil-inbox.png` no cambian, y las demás pantallas tampoco.

- **`#inbox-listas`**: el Inbox con tareas.
  - Debajo del título, las listas en fichas sobre el kraft («Todas» y una por lista), con el mismo anillo de puntos que la barra lateral y `hechas/total`.
  - Pestañas de carpeta «Pendientes | Hechas».
  - Tareas agrupadas por lista, cada grupo con su punto de color, su número y la línea de puntos. Primero «Sin lista», que es lo que queda por ordenar.
  - Las filas ya no repiten la lista: la dice el grupo. Muestran la fecha (en oliva si es hoy, con su hora), las vencidas en rojo, la bandera, la repetición, los enlaces y las subtareas solo si los tienen.
  - Al tocar una fila se abre `#detalle`; al tocar el círculo, la hormiga se la lleva, como en Hoy.
- **`#detalle`**: la hoja de la tarea, que sube sobre el Inbox. El Inbox se queda detrás, encogido y en penumbra.
  - Arriba, la lista a la que pertenece (se toca para moverla), «Más» y cerrar.
  - El título, con la casilla y su anillo de subtareas.
  - «Cuándo»: los botones rápidos de fecha que ya tiene la hoja de la app (Hoy · Mañana · Lunes · Otra) y, en una tarjeta, Hora (la de la Agenda), Repetir, Aviso e Importante.
  - Subtareas, Enlaces y una Nota en papel pautado; al final, Duplicar y Eliminar.
- **`#detalle-abajo`**: la misma hoja, desplazada hasta el final, para ver la nota y las acciones.
- **Capturas:** `movil-inbox-listas.png`, `movil-detalle.png`, `movil-detalle-abajo.png` y las mismas terminadas en `-oscuro`.

Respecto a la hoja de tarea que hay hoy en la app, esta añade la hora, el aviso, Importante, la lista, la nota y «Más». Las demás piezas (fecha con botones, Repetir, Subtareas, Enlaces, Duplicar y Eliminar) ya existen.

## Ajustes del 24-nov-2026 (tras la revisión)

- **Hormiga del +:** lleva un contorno del color de la hoja y el degradado de abajo es más alto, así que ya no tapa el texto que pasa por detrás. Afecta a todas las pantallas del móvil, por eso se han rehecho todas las capturas.
- **Barra inferior con Notas:** queda Hoy · Inbox · Notas · perfil. «Buscar» sale de la barra porque ya está en las cabeceras (lupa en Notas y en Inbox).
- **Agenda:**
  - la cabecera se queda compacta: fecha pequeña y la tira de la semana, sin el rastro, que vuelve al subir;
  - al tocar otro día de la tira se ve su agenda, y la cabecera cambia a ese día (captura `movil-agenda-otro-dia.png`);
  - la pestaña lleva número, como las otras dos;
  - los bloques estrechos (dos citas a la vez) muestran solo título y hora;
  - lo que no tiene hora se puede tocar o arrastrar, y cada chip lleva un reloj.
- **Notas:**
  - las pestañas pasan a «Notas | Archivadas», para no repetir «Fijadas», que ya es una sección;
  - en esta pantalla el botón + crea una nota y lleva su propio icono;
  - las casillas marcadas usan el tachado a mano.
- **Inbox:** las filas de una sola línea son más bajas, y el subtítulo dice «2 sin ordenar · 2 vencidas» en vez de repetir el 17.
- **Detalle:** las subtareas hechas usan el mismo tachado a mano que las filas.
- **Agenda en las pantallas antiguas:** Hoy, Hábitos y Día terminado también llevan la pestaña «Agenda» junto a «Tareas | Hábitos», y al tocarla se abre `#agenda`.

## Añadido el 24-nov-2026: las pantallas nuevas en PC

Cuatro pantallas nuevas en `index.html`, en claro y en oscuro, que siguen las del móvil:

- **`#agenda`**: Hoy por horas.
  - Arriba, «Lista | Agenda» y el día con flechas y botón «Hoy». En Hoy, «Ver por horas» lleva aquí y «Lista» vuelve.
  - A la izquierda, el día, con espacio para que las citas que coinciden muestren todos sus datos.
  - A la derecha, una columna con «Sin hora» (para arrastrar o pulsar el reloj), las vencidas y la semana; al pulsar otro día cambia la agenda (`agenda-otro-dia.png`).
- **`#notas`**:
  - un campo «Escribe una nota…» arriba;
  - las notas en cuatro columnas, con Fijadas y Esta semana;
  - un buscador propio;
  - pestañas «Notas | Archivadas».
  - Aquí no sale la barra de captura de tareas.
- **`#inbox-listas`**: el Inbox agrupado por lista («Sin lista» primero), con «Agrupar por lista». En PC no lleva las fichas de listas del móvil, porque ya están en la barra lateral.
- **`#detalle`**: la tarea se abre como tercera columna, una hoja aparte junto al Inbox, con la fila elegida marcada. Tiene lo mismo que la hoja del móvil y además «Ampliar» y la fecha de creación.

**Cambios en las pantallas de antes:**
- la barra lateral suma «Notas» y el Inbox lleva al Inbox lleno;
- la hormiga de la barra de captura lleva contorno de papel y el degradado de abajo es más alto, para no tapar texto.

Por eso se han rehecho todas las capturas de PC, más `agenda`, `notas`, `inbox-listas`, `detalle`, sus versiones `-oscuro` y `agenda-otro-dia.png`.

## Añadido el 25-nov-2026: captura rápida, búsqueda y menú lateral (móvil)

- **`#captura`**: la hoja que sale al pulsar +, con el teclado. Mientras escribes «Llamar al dentista mañana a las 10 #personal p1», cada parte reconocida se colorea y aparece debajo como chip (fecha, hora, lista, importante) que se puede quitar. Abajo dice cómo se guardará el título. «Mañana», «p1» y las repeticiones ya los entiende la app hoy (`nl-parse.js`); **la hora («a las 10») y la lista («#personal») serían nuevas**, y van marcadas con «nuevo».
- **`#buscar`**: búsqueda a pantalla completa, con filtros Todo · Tareas · Notas · Listas, resultados agrupados, la palabra resaltada y las hechas al final.
- **`#buscar-vacio`**: «Ni rastro de…» con la hormiga y la lupa, «Buscar en el archivo» y las búsquedas recientes.
- **`#menu`**: el menú lateral (☰) en kraft: perfil y sincronización, vistas con contadores, listas con su anillo y «+» para crear, y Ajustes y Ayuda abajo, con la hormiga dormida.
- En la maqueta, el + abre la captura, ☰ abre el menú, la lupa abre la búsqueda y tocar el velo cierra.
- Capturas: `movil-captura.png`, `movil-buscar.png`, `movil-buscar-vacio.png`, `movil-menu.png` y sus `-oscuro`.

## Añadido el 25-nov-2026: Ajustes y panel de listas (móvil)

- **Navegación:** la barra de abajo es la navegación principal (Hoy · Inbox · Notas · perfil). El menú ☰ ya no repite esas vistas: es un **panel de listas** (`#menu`), con «Todas las tareas», tus listas con su anillo, «Nueva lista» y Actividad abajo.
- **`#ajustes`** (al tocar el avatar de la barra) y **`#ajustes-abajo`**:
  - la cuenta y la sincronización arriba;
  - **Apariencia:** tema (Automático · Claro · Oscuro) y los 6 acentos de la app, con una vista previa que cambia al tocar cada uno. **Decisión:** el acento tiñe el rastro, las casillas y los botones; la hormiga se queda siempre en oliva, porque es la marca;
  - **La hormiga:** interruptores para que se lleve la tarea, el rastro en Hoy, las hormigas en las rachas y las ilustraciones de pantallas vacías. Con «Reducir movimiento» del sistema, aparece pero no se mueve;
  - **Estilo:** Tierra (el actual) y Relicario («Pronto»), con una miniatura de cada uno;
  - **General:** avisos, inicio de semana, idioma, copia de seguridad y ayuda.
- Capturas: `movil-ajustes.png`, `movil-ajustes-abajo.png`, `movil-menu.png` (rehecha) y sus `-oscuro`.

## Añadido el 25-nov-2026: detalle de nota, vista de lista, y búsqueda y Ajustes en PC

**Móvil (`movil.html`):**
- **`#nota`** (al tocar una nota): la nota abierta como una hoja con su cinta, la lista y «Editada hoy». Texto en papel pautado con casillas mezcladas. Cada casilla pendiente puede pasar a tarea («→ Tarea»); si ya lo es, lo indica («en Trabajo») y una nota de la hormiga avisa de que se tachará sola al completarla. Abajo, barra de formato (casilla, negrita, imagen, enlace) y «Guardada».
- **`#lista`** (al tocar Trabajo en el panel de listas): cabecera con un anillo grande de progreso, «4 de 8 hechas · 1 vencida», fichas para saltar a otra lista, pestañas «Pendientes | Hechas» y tareas por Vencidas · Esta semana · Más adelante, con las hechas recogidas abajo.

**PC (`index.html`):**
- **`#buscar`** (Ctrl+K, o «Buscar» en la barra lateral): ventana flotante sobre Hoy, con los mismos filtros y grupos que el móvil, el primer resultado marcado y atajos de teclado abajo (↑ ↓, ↵, Tab, Esc).
- **`#ajustes`** (al pulsar la cuenta en la barra lateral): ventana de dos columnas con el menú en kraft (Cuenta, Apariencia, Avisos, Calendarios, Atajos, Datos y copia, Acerca de) y Apariencia abierta: tema, acentos con vista previa, la hormiga, estilo y filas compactas.
- Capturas: `movil-nota.png`, `movil-lista.png`, `buscar.png`, `ajustes.png` y sus `-oscuro`.

## Añadido el 25-nov-2026: bienvenida, avisos, mes y tableta

**Móvil (`movil.html`):**
- **`#bienvenida-1`, `#bienvenida-2`, `#bienvenida-3`**: la primera vez que se abre la app, en tres pasos con la hormiga.
  1. «Hola. Yo cargo con tus tareas»: sin cuenta y sin conexión.
  2. «Apunta tu primera tarea»: se escribe de verdad, con ejemplos para tocar, y se ve cómo la entiende la app.
  3. «Cada tarea hecha, una miga al hormiguero»: explica el rastro y Actividad.
  Sustituye al modal de 3 pasos que tiene hoy la app (`src/js/ui/onboarding.js`), con el mismo contenido de fondo.
- **`#avisos`**: la pantalla de bloqueo con los avisos de AnTrack. Un aviso de tarea con hora y botones «Hecha · En 1 hora · Mañana», el resumen de la mañana y un aviso de racha.
- **`#deshacer`**: el aviso dentro de la app al completar una tarea («Llevada: … · Deshacer»).
- **`#mes`**: el calendario del mes. Cada día lleva puntos de tareas, vencidas y eventos; hoy en papel y el día elegido marcado. Debajo, las tareas de ese día, con pestaña para pasar a su Agenda.

**PC (`index.html`) en tableta y ventanas medianas (≤ 1100 px):**
- la barra lateral pasa a un raíl de iconos;
- el rastro baja a su propia fila;
- en la Agenda, «Sin hora» y Vencidas suben encima del día;
- el detalle flota encima de la lista, en lugar de estrecharla;
- Notas en dos columnas;
- Ajustes y la búsqueda ocupan casi toda la pantalla.

**Capturas:**
- móvil: `movil-bienvenida-1/2/3.png`, `movil-avisos.png`, `movil-deshacer.png`, `movil-mes.png` y sus `-oscuro`;
- tableta (834 × 1112): `tableta-hoy.png`, `tableta-agenda.png`, `tableta-detalle.png`, `tableta-notas.png`.

## Añadido el 26-nov-2026: propuesta de progreso con paradas (`progreso.html`)

Comparación, en claro y oscuro, del rastro actual con una propuesta más legible:
- **una parada (semilla) por tarea del día:** las vacías son lo pendiente, y al completar una se colorea con el color de su lista;
- **el orden:** primero lo hecho; las vencidas esperan en rojo delante de la hormiga, que se planta en la siguiente pendiente;
- **«2/6» grande** junto al hormiguero, que acumula las semillas de colores; al terminar, la entrada se ilumina y sale una bandera;
- **con más de 10 tareas**, las paradas se hacen pequeñas.

Incluye los casos: empezando, casi, día completo, 14 tareas, y la versión móvil. «Completar una» anima la propuesta. Capturas: `progreso.png` y `progreso-oscuro.png`. Si se elige, sustituye al rastro en Hoy (móvil y PC).
- **Camino (actualizado el 26-nov):** la línea de puntos pasa a ser una senda de tierra con bordes irregulares que llega hasta la entrada del hormiguero. Detrás de la hormiga quedan sus pisadas en verde; delante, en gris. A los lados hay matas, piedras y una hoja. Las semillas llevan una pequeña sombra.
- **Entrada (26-nov):** la puerta del hormiguero pasa de la cima a la base, mirando al camino, y la senda sube por una rampa de tierra hasta ella. Al terminar el día, la hormiga espera en la puerta.

# «La hormiga»: más personalidad para el tema actual

Maquetas del 20-nov-2026, hechas sobre el diseño actual (Tierra), en modo claro y oscuro.
Usan la silueta real del logo (`src/img/logo-hormiga.svg`), separada en piezas: antenas, cuerpo y patas.
Nada de esto está en la app; es solo referencia.

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

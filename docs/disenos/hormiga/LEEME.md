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

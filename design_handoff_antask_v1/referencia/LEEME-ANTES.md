# Aviso: los prototipos móviles de esta carpeta están superados

Para **cualquier trabajo de móvil**, la autoridad es `design_handoff_antask_movil/`,
no esta carpeta.

Los archivos de aquí conservan sus nombres originales, así que es fácil abrir el
equivocado. No son copias del paquete nuevo: son una **versión anterior**. Entre
las dos hay ~120 líneas de diferencia real, y algunas cambian el diseño, no solo
el código.

## Qué cambió en el paquete nuevo

| Cambio | Antes (aquí) | Ahora (`design_handoff_antask_movil/`) |
|---|---|---|
| Barra de color de prioridad a la izquierda de la fila | Existe, 4px | **Retirada.** La prioridad se lee por su chip |
| Tamaño mínimo de texto | 10,5 / 11 / 11,5px sueltos | **12px, mínimo firme.** Nada baja de ahí |
| Checkbox de tarea | `<span>` con `onClick` | `<button role="checkbox">` con estado accesible |
| Anillo de progreso | 40px, r=16 | **44px, r=18** (a 40 el «100 %» rozaba el trazo) |
| Padding de la fila | `13px 15px 13px 16px` | `13px 15px` |

## Qué NO está superado

El prototipo de **escritorio** (`Antask v1.html`) y los archivos que consume
siguen siendo válidos y son los que manda `design_handoff_antask_v1/README.md`.
Por eso esta carpeta no se borra: `Antask v1.html` depende de `themes.jsx`,
`inbox-view.jsx`, `views.jsx` y compañía en **su** versión de aquí.

Dicho de otro modo: mismos nombres de archivo, dos destinos distintos.

- Escritorio → `design_handoff_antask_v1/`
- Móvil → `design_handoff_antask_movil/`

## Para abrir cualquiera de los dos

Babel necesita un origen HTTP; con `file://` no cargan, y con Vite tampoco
(transforma los `.jsx` a ESM y Babel se rompe con `require`). Hay que servirlos
con un estático plano:

```bash
npx http-server design_handoff_antask_movil/referencia -p 8123
```

# Estilo «Relicario» (dark fantasy) — maquetas aparcadas

Maquetas del 20-nov-2026. Aparcado hasta tener lista la app móvil.
Nada de esto está en la app; es solo referencia.

## Archivos

- `index.html`: PC. Hashes `#apariencia` (selector de Estilo en Ajustes) y `#detalle` (panel de tarea).
- `movil.html`: móvil (390×844). Hashes `#habitos` y `#detalle`.
- `hoy.png`, `apariencia.png`, `detalle-pc.png`, `movil-hoy.png`, `movil-habitos.png`, `detalle-movil.png`: capturas.

Las fuentes (Pirata One, Cinzel, EB Garamond) se cargan desde Google Fonts, así que hace falta conexión para verlas bien.

## Cómo encajarlo en la app

- **Ajuste nuevo:** «Estilo» en Apariencia, con el atributo `data-estilo="relicario"` en `<html>`. Se guarda en localStorage como el acento (`src/js/ui/theme.js`).
- **Hoja propia:** una hoja de estilos aparte que solo se carga con el estilo activo.
- **Fuentes:** la CSP solo permite fuentes servidas desde la propia web (`font-src 'self'`), así que hay que autoalojarlas con @fontsource (unos 200 KB, cargados solo con el estilo activo).
- **Tema y acento:** solo oscuro al principio, con el selector de tema bloqueado. El acento se desactiva, porque Relicario lleva su propia paleta.
- **Inicial iluminada:** el título del detalle es un `<textarea>`, así que `::first-letter` no sirve. La solución es mostrar el título decorado mientras no se edita y pasar al campo normal al tocarlo.
- **Legibilidad:** Pirata One solo en títulos. Los números romanos se pueden desactivar en Ajustes.

## Fases

1. **Base:** selector de Estilo, colores, fuentes y la vista Hoy en PC y móvil, todo oculto tras un interruptor.
2. **Resto de pantallas:** detalle, Inbox, hábitos, ajustes, modales y menú del móvil.
3. **Piezas especiales y lanzamiento:**
   - checkbox de vela (`script.js`, función que crea `.task-check`), rosario de progreso, números romanos e inicial iluminada;
   - ambiente (velas, brasas, campana), respetando `prefers-reduced-motion`;
   - textos en es/en y pruebas con capturas;
   - por último, quitar «Próximamente».

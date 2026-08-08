/* Tachado animado tipo "garabato a mano", dibujado en SVG (sin librerías).
   El SVG se estira horizontalmente (preserveAspectRatio="none") pero el grosor NO,
   gracias a vector-effect="non-scaling-stroke": así el trazo mantiene el peso de un
   bolígrafo en filas estrechas y anchas. El garabato sobresale de ambos extremos y
   vuelve sobre sí mismo en el tramo final, como un tachón hecho de un tirón. */
function ScribbleStrike({ t, done }) {
  const c = t.ink2 || t.ink;
  const anim = (dur, delay) => ({
    strokeDasharray: 1, strokeDashoffset: done ? 0 : 1, opacity: done ? 1 : 0,
    transition: done
      ? `stroke-dashoffset ${dur}s cubic-bezier(.42,.06,.2,1) ${delay}s, opacity .01s`
      : 'opacity .16s .26s, stroke-dashoffset 0s'
  });
  return (
    <svg width="100%" height="12" viewBox="0 0 200 12" preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', overflow: 'visible' }}>
      {/* pasada principal: entra baja por la izquierda, ondula al cruzar y se escapa arriba a la derecha */}
      <path d="M-4 8.4 C 26 4.2, 52 9.2, 78 5.4 C 104 1.9, 128 8.6, 152 4.8 C 172 1.7, 188 6.4, 204 3.2"
        pathLength="1" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" style={anim(0.4, 0)} />
      {/* retorno corto sobre el tramo final: cierra el tachón sin ensuciar el texto */}
      <path d="M202 4.6 C 178 8.2, 150 3.6, 126 7.4"
        pathLength="1" fill="none" stroke={c} strokeWidth="1.35" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" opacity="0.9" style={anim(0.22, 0.34)} />
    </svg>);

}
window.ScribbleStrike = ScribbleStrike;

/* inbox-view.jsx — Vista Lista (Inbox) reutilizable para explorar direcciones cálidas.
   Exporta window.InboxView, window.ANTASK_THEMES, window.ANTASK_DATA. */

/* ───────────────────────── DATA ───────────────────────── */
/* Helper de fechas relativas al día de hoy */
const _D = (() => {const n = new Date();const off = (d) => {const r = new Date(n);r.setDate(r.getDate() + d);return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`;};return off;})();
const ANTASK_DATA = {
  nav: [
  { icon: 'calendar', label: 'Hoy', count: 9, attention: true },
  { icon: 'inbox', label: 'Inbox', count: 6, active: true }],

  groups: [
  {
    label: 'Personal', count: 2, open: true, items: [
    { name: 'Buceo', progress: [1, 4], dot: '#3d8fb0' },
    { name: 'Inversión', progress: [0, 1], dot: '#7c8a52' }]

  },
  {
    label: 'Trabajo', count: 3, open: true, items: [
    { name: 'Firma Digital', progress: [6, 12], dot: '#c98a3c' },
    { name: 'Formación', progress: [0, 2], dot: '#7c8a52' },
    { name: 'IRPs', progress: [0, 1], dot: '#5aa06b' }]

  },
  { label: 'Licitaciones', count: 2, items: [] }],

  bottom: [],

  filters: ['Todas', 'Inversión', 'Buceo'],
  tasks: [
  { id: 1, title: 'Enviar propuesta de colaboración a par en par', done: false, prio: 'media', due: _D(-2), time: '11:30', list: 'Firma Digital' },
  { id: 2, title: 'Añadir opción de nota y consulta en la versión móvil', done: false, origin: 'Ideas para la app', list: 'Firma Digital' },
  { id: 3, title: 'Coger autobús a Almuñécar para la inmersión', done: false, list: 'Buceo', due: _D(-1) },
  { id: 4, title: 'Enviar correo del seguro de buceo', done: false, list: 'Buceo', prio: 'alta', due: _D(-1), time: '09:00' },
  { id: 5, title: 'Subir foto de perfil en PADI', done: true, list: 'Buceo' },
  { id: 6, title: 'Enviar PDF del certificado PADI', done: false, list: 'Buceo', origin: 'Renovar el certificado PADI' },
  { id: 7, title: 'Salida a bolsa de Anthropic', done: false, list: 'Inversión', prio: 'baja', due: _D(100) },
  { id: 8, title: 'Preparar material del taller de phishing', done: false, list: 'Formación', prio: 'media', due: _D(3), time: '10:00' },
  { id: 9, title: 'Actualizar política de contraseñas corporativas', done: true, list: 'Formación' },
  { id: 10, title: 'Revisar módulo de seguridad en la nube', done: false, list: 'Formación', prio: 'baja' },
  { id: 11, title: 'Revisar incidente de acceso no autorizado', done: false, list: 'IRPs', prio: 'alta', due: _D(-3) },
  { id: 12, title: 'Actualizar árbol de decisión del IRP principal', done: false, list: 'IRPs', prio: 'media' },
  { id: 13, title: 'Documentar respuesta al simulacro de ciberseguridad', done: true, list: 'IRPs' }]

};

/* ───────────────────────── ICONS (Lucide-style, minimal inline) ───────────────────────── */
function Ico({ name, size = 16, sw = 1.7, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'sun':return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'inbox':return <svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.5Z" /></svg>;
    case 'chevron':return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>;
    case 'chevronL':return <svg {...p}><path d="m15 18-6-6 6-6" /></svg>;
    case 'plus':return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case 'list':return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case 'calendar':return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
    case 'grid':return <svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
    case 'filter':return <svg {...p}><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" /></svg>;
    case 'search':return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case 'note':return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>;
    case 'lock':return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
    case 'archive':return <svg {...p}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></svg>;
    case 'layers':return <svg {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
    case 'panel':return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></svg>;
    case 'cards':return <svg {...p}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="15" width="18" height="7" rx="2" /></svg>;
    case 'check':return <svg {...p} strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>;
    case 'circle':return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
    case 'grip':return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></svg>;
    case 'x':return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
    case 'flag':return <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" /><path d="M4 22v-7" /></svg>;
    case 'tag':return <svg {...p}><path d="M12.6 2H21v8.4l-9 9L3 10.4V4a2 2 0 0 1 2-2Z" /><circle cx="7.5" cy="7.5" r="1.4" /></svg>;
    case 'trash':return <svg {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>;
    case 'align':return <svg {...p}><path d="M3 6h18M3 12h12M3 18h16" /></svg>;
    case 'help':return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.2 9.2a2.8 2.8 0 0 1 5.5.8c0 1.9-2.8 2.3-2.8 4" /><path d="M12 17h.01" /></svg>;
    case 'pin':return <svg {...p}><path d="M12 17v5" /><path d="M9 10.8V4h6v6.8l2.4 3.2H6.6L9 10.8Z" /></svg>;
    case 'arrowRight':return <svg {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
    case 'sparkles':return <svg {...p}><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z" /></svg>;
    case 'pilcrow':return <svg {...p}><path d="M13 4v16M18 4v16M18 4H9.5a4.5 4.5 0 0 0 0 9H13" /></svg>;
    case 'dots':return <svg {...p} style={{ height: "10px", width: "9px" }}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
    case 'ellipsis':return <svg {...p}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>;
    case 'user':return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>;
    case 'settings':return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5l1.4 2.6 2.9-.5.5 2.9 2.6 1.4-1.4 2.6 1.4 2.6-2.6 1.4-.5 2.9-2.9-.5L12 21.5l-1.4-2.6-2.9.5-.5-2.9-2.6-1.4 1.4-2.6L4 9.9l2.6-1.4.5-2.9 2.9.5L12 2.5Z" /></svg>;
    case 'bell':return <svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.3 20a2 2 0 0 0 3.4 0" /></svg>;
    case 'moon':return <svg {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 7.5 7.5 0 1 0 20 14.5Z" /></svg>;
    case 'logout':return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>;
    case 'command':return <svg {...p}><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" /></svg>;
    case 'check2':return <svg {...p} strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>;
    case 'undo':return <svg {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-2" /></svg>;
    case 'clock':return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    default:return null;
  }
}

/* ───────────────────────── small atoms ───────────────────────── */
function Pill({ children, t, soft }) {
  return <span style={{
    fontSize: 11, fontWeight: 600, fontFamily: t.fontUI, lineHeight: 1,
    padding: '4px 8px', borderRadius: t.rPill,
    color: soft ? t.ink2 : t.ink3,
    background: soft ? t.tintBg : 'transparent',
    border: soft ? 'none' : `1px solid ${t.border}`,
    fontVariantNumeric: 'tabular-nums'
  }}>{children}</span>;
}

function Tag({ tag, t }) {
  const c = t.tags[tag.key] || t.tags.slate;
  return <span style={{
    fontSize: 11, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI,
    letterSpacing: t.monoMeta ? '0.01em' : '-0.005em',
    padding: '3px 9px', borderRadius: t.rTag, color: c.fg, background: c.bg,
    border: t.tagBorder ? `1px solid ${c.bd || 'transparent'}` : 'none',
    whiteSpace: 'nowrap'
  }}>{tag.label}</span>;
}

/* ── meta de fila: prioridad + fecha (mismo lenguaje que Agenda) ── */
const PRIO_COLOR = { alta: '#b0473f', media: '#c98a3c', baja: '#7c8a52' };
const PRIO_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' };
const DUE_DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DUE_MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatDue(iso) {
  if (!iso) return null;
  const today = new Date();today.setHours(0, 0, 0, 0);
  const p = String(iso).split('-').map(Number);
  const due = new Date(p[0], p[1] - 1, p[2]);due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  let label;
  if (diff === 0) label = 'Hoy';else
  if (diff === 1) label = 'Mañana';else
  if (diff === -1) label = 'Ayer';else
  label = `${DUE_DOW[due.getDay()]} ${p[2]} ${DUE_MON[p[1] - 1]}`;
  return { label, overdue: diff < 0, soon: diff === 0 };
}
function PrioFlag({ prio }) {
  const c = PRIO_COLOR[prio];
  if (!c) return null;
  return <span title={`Prioridad ${PRIO_LABEL[prio]}`} style={{ display: 'inline-flex', flexShrink: 0, color: c }}><Ico name="flag" size={13} sw={2} /></span>;
}
function DueChip({ iso, t, dim, time }) {
  const f = formatDue(iso);
  if (!f) return null;
  const col = dim ? t.ink3 : f.overdue ? '#b0473f' : f.soon ? t.accentInk : t.ink2;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 11.5, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI, color: col, fontVariantNumeric: 'tabular-nums', opacity: dim ? 0.6 : 1 }}>
      <Ico name="calendar" size={12} sw={2} style={{ opacity: 0.8 }} />{f.label}{time ? ` · ${time}` : ''}
    </span>);
}

/* ───────────────────────── ROW ───────────────────────── */
function TaskRow({ task, t, idx, onToggle, selected, onSelect, isMultiMode, isSelected, onToggleSelect, flash, first = true, last = true }) {
  const [hover, setHover] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const barColor = t.accent;
  /* estilo de fila (Limpio · Líneas · Tarjetas · Compacto) dentro del bloque */
  const elevated = t.cardStyle === 'elevated';
  const stacked = t.cardStyle === 'stacked';
  const cardBorder = t.mode === 'dark' ? t.border : 'rgba(50,40,24,0.08)';
  const stackRadius = stacked ? `${first ? t.rInput : 0}px ${first ? t.rInput : 0}px ${last ? t.rInput : 0}px ${last ? t.rInput : 0}px` : null;
  return (
    <div
      draggable={!isMultiMode}
      onDragStart={(e) => {
        if (isMultiMode) {e.preventDefault();return;}
        e.dataTransfer.effectAllowed = 'move';
        try {e.dataTransfer.setData('text/plain', task.title);} catch (_) {}
        window.__antaskDragTask = { id: task.id, list: task.list || null };
        window.dispatchEvent(new CustomEvent('antask:dragstart'));
        setDragging(true);
      }}
      onDragEnd={() => {window.__antaskDragTask = null;window.dispatchEvent(new CustomEvent('antask:dragend'));setDragging(false);}}
      onClick={(e) => isMultiMode ? onToggleSelect && onToggleSelect(task.id, false) : e.shiftKey ? onToggleSelect && onToggleSelect(task.id, true) : onSelect && onSelect(selected ? null : task.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', overflow: 'hidden',
        padding: t.rowPad, paddingLeft: t.rowPadX,
        position: 'relative', borderRadius: stacked ? undefined : t.rowRadius,
        ...(stacked ? { borderRadius: stackRadius } : {}),
        opacity: dragging ? 0.45 : 1,
        background: isSelected ? t.tintBg : selected ? t.tintBg : hover ? hexA(t.accent, t.mode === 'dark' ? 0.10 : 0.07) : (elevated || stacked) ? t.card : 'transparent',
        border: elevated ? `1px solid ${isSelected || selected ? t.accent : cardBorder}` : stacked ? `1px solid ${isSelected || selected ? t.accent : cardBorder}` : 'none',
        boxShadow: flash ? `inset 0 0 0 2px ${t.accent}` : elevated ? (hover ? '0 6px 16px -8px rgba(40,30,15,0.28)' : '0 1px 2px rgba(40,30,15,0.05)') : 'none',
        animation: flash && !window.__ANTASK_NOANIM ? 'qcFlash 1.6s ease-out' : 'none',
        marginBottom: elevated ? 6 : stacked && last ? 8 : 0,
        marginTop: stacked && !first ? -1 : 0,
        zIndex: stacked && (selected || isSelected) ? 1 : undefined,
        borderBottom: (elevated || stacked) ? `1px solid ${isSelected || selected ? t.accent : cardBorder}` : (t.rowDivider && !last ? `1px solid ${t.border}` : 'none'),
        minHeight: Math.max((t.rowH || 42) + 5, 47),
        transition: 'background .12s, box-shadow .15s, opacity .15s'
      }}>
      {selected && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.accent }} />}
      {/* selección múltiple */}
      <span onClick={(e) => {e.stopPropagation();onToggleSelect && onToggleSelect(task.id, e.shiftKey);}}
      style={{ width: isMultiMode ? 18 : 0, height: 18, flexShrink: 0, borderRadius: 5, cursor: 'pointer',
        marginRight: isMultiMode ? -4 : 0, overflow: 'hidden',
        border: isMultiMode ? `1.7px solid ${isSelected ? t.accent : t.ink3}` : 'none',
        background: isSelected ? t.accent : 'transparent', color: t.accentOn,
        display: 'grid', placeItems: 'center',
        transition: 'width .15s, margin .15s, border-color .12s, background .12s' }}>
        {isSelected && <Ico name="check" size={11} sw={3} />}
      </span>
      {/* checkbox — área clicable de 28px, dibujo de 19px */}
      <span role="checkbox" aria-checked={task.done} aria-label={`${task.done ? 'Reabrir' : 'Completar'}: ${task.title}`} tabIndex={0}
      onKeyDown={(e) => {if (e.key === ' ' || e.key === 'Enter') {e.preventDefault();e.stopPropagation();onToggle && onToggle(task.id);}}}
      onClick={(e) => {e.stopPropagation();onToggle && onToggle(task.id);}} style={{ width: 28, height: 28, margin: '0 -4px', flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        {task.done ?
        <span style={{ width: 19, height: 19, borderRadius: t.checkRadius, background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center' }}>
            <Ico name="check" size={12} sw={3} />
          </span> :
        <span style={{ width: 19, height: 19, borderRadius: t.checkRadius, border: `1.7px solid ${hover ? t.accent : t.ink3}`, boxShadow: hover ? `0 0 0 3px ${t.tintBg}` : 'none', opacity: hover ? 0.9 : 0.55, transition: 'border-color .12s, opacity .12s, box-shadow .15s' }} />}
      </span>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 14.5, fontFamily: t.fontUI, fontWeight: 450,
        color: task.done ? t.ink3 : t.ink, letterSpacing: '-0.006em', lineHeight: 1.4,
        textDecoration: task.done ? 'line-through' : 'none',
        whiteSpace: 'normal', overflowWrap: 'break-word'
      }}>{task.title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, opacity: task.done ? 0.55 : 1 }}>
        {task.origin &&
        <span title={`Viene de la nota: ${task.origin}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, maxWidth: 168, fontSize: 11, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI, padding: '3px 9px', borderRadius: t.rTag, color: t.accentInk, background: t.tintBg, cursor: 'pointer' }}>
          <Ico name="note" size={11} sw={2} style={{ flexShrink: 0 }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.origin}</span>
        </span>}
        {window.PrioP ? <window.PrioP p={task.prio} t={t} /> : <PrioFlag prio={task.prio} />}
        <DueChip iso={task.due} t={t} dim={task.done} time={task.time} />
      </div>
    </div>);

}

/* ───────────────────────── SHORTCUTS (atajos de teclado) ───────────────────────── */
const SC_GROUPS = [
{ title: 'General', icon: 'sparkles', items: [
  { keys: ['Ctrl', '⇧', 'Espacio'], label: 'Captura rápida' },
  { keys: ['⌘', 'K'], label: 'Buscar en todo' },
  { keys: ['⌘', ','], label: 'Abrir ajustes' },
  { keys: ['?'], label: 'Mostrar estos atajos' },
  { keys: ['Esc'], label: 'Cerrar o volver' }]
},
{ title: 'Navegación', icon: 'arrowRight', items: [
  { keys: ['G', 'H'], join: 'then', label: 'Ir a Hoy' },
  { keys: ['G', 'I'], join: 'then', label: 'Ir a Inbox' },
  { keys: ['G', 'N'], join: 'then', label: 'Ir a Notas' },
  { keys: ['⌘', 'B'], label: 'Mostrar / ocultar panel' }]
},
{ title: 'En una tarea', icon: 'check2', items: [
  { keys: ['N'], label: 'Nueva tarea' },
  { keys: ['Espacio'], label: 'Completar / reabrir' },
  { keys: ['Enter'], label: 'Abrir o editar' },
  { keys: ['1', '4'], join: '–', label: 'Prioridad P1 a P4' },
  { keys: ['T'], label: 'Mover a hoy' },
  { keys: ['⌫'], label: 'Eliminar' }]
},
{ title: 'En una nota', icon: 'note', items: [
  { keys: ['⇧', 'N'], label: 'Nueva nota' },
  { keys: ['⌘', '1'], label: 'Convertir línea en tarea' },
  { keys: ['⌘', '2'], label: 'Convertir en consulta' },
  { keys: ['⌘', 'P'], label: 'Fijar / desfijar nota' }]
}];


/* ── useFocusTrap: atrapa el foco dentro de modales ── */
function useFocusTrap(ref, active) {
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const items = () => [...el.querySelectorAll(sel)];
    const saved = document.activeElement;
    const first = items()[0];if (first) first.focus();
    const trap = (e) => {
      if (e.key !== 'Tab') return;
      const all = items();if (!all.length) return;
      const last = all[all.length - 1];
      if (e.shiftKey) {if (document.activeElement === all[0]) {e.preventDefault();last.focus();}} else
      {if (document.activeElement === last) {e.preventDefault();all[0].focus();}}
    };
    document.addEventListener('keydown', trap);
    return () => {document.removeEventListener('keydown', trap);if (saved && saved.focus) saved.focus();};
  }, [active, ref]);
}

function KbCap({ t, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 24, height: 26, padding: '0 8px',
      borderRadius: 7, fontFamily: t.fontMono, fontSize: 12.5, fontWeight: 600, color: t.ink2, background: t.inputBg,
      border: `1px solid ${t.border}`, boxShadow: `0 1.5px 0 ${t.border}` }}>{children}</span>);
}

function KbCombo({ t, keys, join }) {
  const conn = join === 'then' ? 'luego' : join || '+';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {keys.map((k, i) =>
      <React.Fragment key={i}>
          {i > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: t.ink3, fontFamily: t.fontMono }}>{conn}</span>}
          <KbCap t={t}>{k}</KbCap>
        </React.Fragment>)}
    </span>);
}

function ShortcutsModal({ t, onClose }) {
  const dialogRef = React.useRef(null);
  useFocusTrap(dialogRef, true);
  React.useEffect(() => {
    const onKey = (e) => {if (e.key === 'Escape') {e.stopPropagation();onClose();}};
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9700, background: window.antaskHexA ? window.antaskHexA(t.canvas, 0.66) : 'rgba(14,10,5,0.55)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 'clamp(14px,4vw,40px)', fontFamily: t.fontUI }}>
      <div ref={dialogRef} onClick={(e) => e.stopPropagation()} style={{ width: 'min(760px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: t.canvas, border: `1px solid ${t.border}`, borderRadius: 18, boxShadow: '0 40px 100px -30px rgba(14,10,5,0.6)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: `1px solid ${t.border}`, background: t.card, position: 'sticky', top: 0, zIndex: 1, borderRadius: '18px 18px 0 0' }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk, flexShrink: 0 }}><Ico name="command" size={17} sw={2} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 21, letterSpacing: t.titleTrack, color: t.ink }}>Atajos de teclado</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: t.ink3 }}>Muévete por Antask sin soltar las manos del teclado.</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.border}`, cursor: 'pointer', background: t.inputBg, color: t.ink2, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ico name="x" size={18} /></button>
        </div>
        {/* grid de grupos */}
        <div style={{ padding: '20px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '26px 36px' }}>
          {SC_GROUPS.map((g) =>
          <div key={g.title}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Ico name={g.icon} size={14} sw={2} style={{ color: t.accentInk }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.ink3 }}>{g.title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.items.map((it, i) =>
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 2px', borderBottom: i === g.items.length - 1 ? 'none' : `1px solid ${t.border}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: t.ink2 }}>{it.label}</span>
                    <KbCombo t={t} keys={it.keys} join={it.join} />
                  </div>)}
              </div>
            </div>)}
        </div>
        <div style={{ padding: '0 24px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.ink3, fontFamily: t.fontMono }}>
            <Ico name="sparkles" size={13} sw={2} style={{ color: t.ink3 }} />
            Pulsa <KbCap t={t}>?</KbCap> en cualquier momento para volver aquí.
          </div>
        </div>
      </div>
    </div>, document.body);
}

/* ───────────────────────── PROFILE MENU ───────────────────────── */
function ProfileMenu({ t, sb, sbAccent, onOpenSettings }) {
  const [open, setOpen] = React.useState(window.__ANTASK_PROFILE_OPEN || false);
  const [shortcuts, setShortcuts] = React.useState(false);
  const ref = React.useRef(null);
  // atajo global: "?" abre la hoja de atajos (salvo escribiendo en un campo)
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      e.preventDefault();setOpen(false);setShortcuts(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    const onKey = (e) => {if (e.key === 'Escape') setOpen(false);};
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {document.removeEventListener('mousedown', onDoc);document.removeEventListener('keydown', onKey);};
  }, [open]);

  /* El panel usa los tokens del tema activo — coherente en claro y oscuro. */
  const _dk = t.mode === 'dark';
  const panelBg = t.card;
  const panelInk = t.ink;
  const panelInk2 = t.ink2;
  const panelInk3 = t.ink3;
  const panelBorder = t.border;
  const panelHover = t.rowHover;
  const panelAccent = t.accentInk;
  const danger = _dk ? '#e0846a' : '#9a3f43';
  const Item = ({ icon, label, kbd, danger: dg, right, onClick }) => {
    const [h, setH] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        padding: '8px 10px', border: 'none', cursor: 'pointer', borderRadius: t.rNav,
        background: h ? dg ? 'rgba(224,132,106,0.14)' : panelHover : 'transparent',
        color: dg ? danger : h ? panelInk : panelInk2, font: 'inherit', transition: 'background .12s, color .12s'
      }}>
        <span style={{ display: 'flex', color: dg ? danger : h ? panelAccent : panelInk3, transition: 'color .12s' }}><Ico name={icon} size={16} sw={1.8} /></span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 550, letterSpacing: '-0.006em' }}>{label}</span>
        {right}
        {kbd && <span style={{ fontSize: 11, fontFamily: t.fontMono, color: panelInk3, letterSpacing: '0.02em' }}>{kbd}</span>}
      </button>);

  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón perfil */}
      <button type="button" onClick={() => setOpen((o) => !o)}
      onMouseEnter={(e) => { if (!open) { e.currentTarget.style.background = sb.inputBg; e.currentTarget.style.borderColor = sb.border; } }}
      onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        padding: 6,
        border: `1px solid ${open ? sb.border : 'transparent'}`, borderRadius: t.rInput,
        background: open ? sb.inputBg : 'transparent', cursor: 'pointer', font: 'inherit',
        transition: 'background .12s, border-color .12s'
      }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}>
          <image-slot id="antask-avatar" shape="circle" style={{ width: '30px', height: '30px', display: 'block' }} placeholder="👤" fit="cover" /></span>
        <div style={{ lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: sb.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>miguel cantos</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: sbAccent, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#46c66b', flexShrink: 0, animation: window.__ANTASK_NOANIM ? 'none' : 'antaskPulse 2.4s ease-out infinite' }} />
            Sincronizado
          </div>
        </div>
        <span style={{ display: 'flex', color: sb.ink3, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}><Ico name="chevron" size={15} style={{ transform: 'rotate(-90deg)' }} /></span>
      </button>

      {/* Menú */}
      {open &&
      <div style={{
        position: 'absolute', bottom: 'calc(100% + 8px)', left: -4, right: -4, zIndex: 50,
        background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: t.rInput + 4,
        boxShadow: '0 1px 0 rgba(255,245,225,0.05) inset, 0 18px 44px -8px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
        padding: 6, transformOrigin: 'bottom center',
        animation: 'antaskMenuIn .17s cubic-bezier(0.34,1.2,0.64,1) both'
      }}>
          {/* cabecera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px 10px' }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${panelBorder}`, display: 'block' }}>
              <image-slot id="antask-avatar" shape="circle" style={{ width: '44px', height: '44px', display: 'block' }} placeholder="📷" fit="cover" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: panelInk, fontFamily: t.fontDisplay, letterSpacing: '-0.02em' }}>miguel cantos</div>
              <div style={{ fontSize: 11.5, color: panelInk3, fontFamily: t.fontMono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>miguel@antask.app</div>
            </div>
          </div>

          <div style={{ height: 1, background: panelBorder, margin: '2px 4px 6px' }} />

          <Item icon="settings" label="Ajustes" kbd="⌘," onClick={() => {setOpen(false);onOpenSettings && onOpenSettings('apariencia');}} />

          <div style={{ height: 1, background: panelBorder, margin: '6px 4px' }} />

          <div style={{ padding: '5px 10px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: panelInk3, fontFamily: t.fontMono }}>Espacio de trabajo</div>
          <Item icon="command" label="Atajos de teclado" kbd="?" onClick={() => {setOpen(false);setShortcuts(true);}} />
          <Item icon="help" label="Ayuda y soporte" />

          <div style={{ height: 1, background: panelBorder, margin: '6px 4px' }} />

          <Item icon="logout" label="Cerrar sesión" danger />
        </div>}
      {shortcuts && <ShortcutsModal t={t} onClose={() => setShortcuts(false)} />}
    </div>);

}

/* ───────────────────────── DROP MENU (reutilizable) ─────────────────────────
   Mismo lenguaje que el menú de perfil; se adapta a la superficie:
   'paper' (sobre tarjeta clara) o 'dark' (sobre la sidebar cálida oscura).
   trigger = ({ open, toggle, ref }) => elemento.  sections = [[item,…],…]      */
function DropMenu({ t, sb, surface = 'paper', align = 'right', placement = 'bottom', width = 212, header, sections = [], trigger }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const trigRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const place = React.useCallback(() => {
    const el = trigRef.current;if (!el) return;
    const r = el.getBoundingClientRect();
    const p = { position: 'fixed', zIndex: 9999, width };
    if (placement === 'top') p.bottom = Math.round(window.innerHeight - r.top + 7);else
    p.top = Math.round(r.bottom + 7);
    if (align === 'right') p.right = Math.max(8, Math.round(window.innerWidth - r.right));else
    p.left = Math.min(Math.round(r.left), window.innerWidth - width - 8);
    setPos(p);
  }, [align, placement, width]);

  React.useLayoutEffect(() => {if (open) place();}, [open, place]);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      if (trigRef.current && trigRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {if (e.key === 'Escape') setOpen(false);};
    const onScroll = () => place();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {document.removeEventListener('mousedown', onDoc);document.removeEventListener('keydown', onKey);window.removeEventListener('resize', place);window.removeEventListener('scroll', onScroll, true);};
  }, [open, place]);

  const sbx = sb || t.sb;
  const darkUI = t.mode === 'dark';
  const S = surface === 'dark' ? {
    bg: t.card,
    ink: t.ink, ink2: t.ink2, ink3: t.ink3,
    border: t.border,
    hover: t.rowHover, accent: t.accentInk,
    danger: darkUI ? '#e0846a' : '#9a3f43', dangerHover: darkUI ? 'rgba(224,132,106,0.14)' : 'rgba(154,63,67,0.10)',
    shadow: darkUI ?
    '0 18px 44px -10px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)' :
    '0 12px 34px -10px rgba(50,40,24,0.26), 0 2px 8px rgba(50,40,24,0.10)'
  } : {
    bg: t.card, ink: t.ink, ink2: t.ink2, ink3: t.ink3,
    border: t.border, hover: t.rowHover, accent: t.accentInk,
    danger: darkUI ? '#e0846a' : '#9a3f43', dangerHover: darkUI ? 'rgba(224,132,106,0.14)' : 'rgba(154,63,67,0.10)',
    shadow: darkUI ?
    '0 1px 0 rgba(255,245,225,0.05) inset, 0 18px 44px -10px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)' :
    '0 12px 34px -10px rgba(50,40,24,0.26), 0 2px 8px rgba(50,40,24,0.10)'
  };

  const MenuItem = ({ icon, label, kbd, danger: dg, right, onClick }) => {
    const [h, setH] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      onClick={() => {if (onClick) onClick();setOpen(false);}}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        padding: '7px 10px', border: 'none', cursor: 'pointer', borderRadius: t.rNav,
        background: h ? dg ? S.dangerHover : S.hover : 'transparent',
        color: dg ? S.danger : h ? S.ink : S.ink2, font: 'inherit', transition: 'background .12s, color .12s'
      }}>
        {icon && <span style={{ display: 'flex', color: dg ? S.danger : h ? S.accent : S.ink3, transition: 'color .12s' }}><Ico name={icon} size={15.5} sw={1.8} /></span>}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 550, letterSpacing: '-0.006em' }}>{label}</span>
        {right}
        {kbd && <span style={{ fontSize: 10.5, fontFamily: t.fontMono, color: S.ink3, letterSpacing: '0.02em' }}>{kbd}</span>}
      </button>);

  };

  const vertOrigin = placement === 'top' ? 'bottom center' : 'top center';

  return (
    <React.Fragment>
      <span ref={trigRef} style={{ display: 'inline-flex' }}>
        {trigger({ open, toggle: () => setOpen((o) => !o) })}
      </span>
      {open && pos && ReactDOM.createPortal(
        <div ref={menuRef} style={{
          ...pos, transformOrigin: vertOrigin,
          background: S.bg, border: `1px solid ${S.border}`, borderRadius: t.rInput + 4,
          boxShadow: S.shadow, padding: 6,
          animation: window.__ANTASK_NOANIM ? 'none' : 'antaskMenuIn .16s cubic-bezier(0.34,1.2,0.64,1) both'
        }}>
          {header && <React.Fragment>{header(S)}<div style={{ height: 1, background: S.border, margin: '2px 4px 6px' }} /></React.Fragment>}
          {sections.map((items, si) =>
          <React.Fragment key={si}>
            {si > 0 && <div style={{ height: 1, background: S.border, margin: '6px 4px' }} />}
            {items.map((it, ii) => it.heading ?
            <div key={ii} style={{ padding: '5px 10px 4px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: S.ink3, fontFamily: t.fontMono }}>{it.heading}</div> :
            <MenuItem key={ii} {...it} />)}
          </React.Fragment>)}
        </div>, document.body)}
    </React.Fragment>);

}

/* ───────────────────────── SEARCH PALETTE (buscador ⌘K) ───────────────────────── */
function norm(s) {return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');}
function SearchPalette({ t, onClose }) {
  const dialogRef = React.useRef(null);
  useFocusTrap(dialogRef, true);
  const sb = t.sb;
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);
  const all = React.useMemo(() => {
    const seen = new Set();
    return [...(window.ANTASK_DATA && window.ANTASK_DATA.tasks || []), ...(window.ANTASK_DATED || [])].
    filter((x) => {if (seen.has(x.title)) return false;seen.add(x.title);return true;});
  }, []);
  const results = React.useMemo(() => {
    const nq = norm(q.trim());
    if (!nq) return all.slice(0, 7);
    return all.filter((x) => norm(x.title).includes(nq) || norm(x.list).includes(nq) || norm(x.origin).includes(nq)).slice(0, 8);
  }, [q, all]);
  React.useEffect(() => {setSel(0);}, [q]);
  React.useEffect(() => {inputRef.current && inputRef.current.focus();}, []);
  React.useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {e.preventDefault();onClose();} else
      if (e.key === 'ArrowDown') {e.preventDefault();setSel((s) => Math.min(s + 1, results.length - 1));} else
      if (e.key === 'ArrowUp') {e.preventDefault();setSel((s) => Math.max(s - 1, 0));} else
      if (e.key === 'Enter' && results[sel]) {e.preventDefault();onClose();}
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [results, sel, onClose]);
  const accent = sb.accentInk || t.accentInk;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9800, background: 'rgba(20,14,6,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', fontFamily: t.fontUI }}>
      <div ref={dialogRef} onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)', background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 4, overflow: 'hidden', boxShadow: '0 24px 64px -16px rgba(30,20,8,0.5)', animation: window.__ANTASK_NOANIM ? 'none' : 'antaskMenuIn .16s ease both' }}>
        {/* input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 18px', borderBottom: `1px solid ${t.border}` }}>
          <Ico name="search" size={18} style={{ color: t.ink3, flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tareas, listas, notas…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, fontFamily: t.fontUI, color: t.ink }} />
          <span onClick={onClose} style={{ fontSize: 10.5, fontWeight: 600, fontFamily: t.fontMono, padding: '2px 7px', borderRadius: 5, border: `1px solid ${t.border}`, color: t.ink3, cursor: 'pointer' }}>ESC</span>
        </div>
        {/* results */}
        <div style={{ maxHeight: '46vh', overflow: 'auto', padding: 6 }}>
          {results.length === 0 ?
          <div style={{ padding: '26px 18px', textAlign: 'center', color: t.ink3, fontSize: 14 }}>Sin resultados para “{q}”.</div> :
          results.map((r, i) => {
            const on = i === sel;
            return (
              <div key={r.id} onMouseEnter={() => setSel(i)} onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: t.rInput, cursor: 'pointer', background: on ? t.tintBg : 'transparent' }}>
                <span style={{ width: 16, height: 16, flexShrink: 0, borderRadius: r.done ? t.checkRadius : t.checkRadius, border: r.done ? 'none' : `1.6px solid ${t.ink3}`, background: r.done ? t.accent : 'transparent', color: t.accentOn, display: 'grid', placeItems: 'center' }}>{r.done && <Ico name="check" size={10} sw={3} />}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: r.done ? 'line-through' : 'none' }}>{r.title}</span>
                {r.list && <span style={{ fontSize: 11, fontWeight: 600, color: t.ink3, fontFamily: t.monoMeta ? t.fontMono : t.fontUI, flexShrink: 0 }}>{r.list}</span>}
                {r.origin && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: accent, flexShrink: 0 }}><Ico name="note" size={11} sw={2} />nota</span>}
                {on && <Ico name="arrowRight" size={15} style={{ color: t.ink3, flexShrink: 0 }} />}
              </div>);
          })}
        </div>
        {/* footer hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 16px', borderTop: `1px solid ${t.border}`, color: t.ink3, fontSize: 11.5, fontFamily: t.monoMeta ? t.fontMono : t.fontUI }}>
          <span>↑↓ navegar</span><span>↵ abrir</span><span style={{ marginLeft: 'auto' }}>{results.length} resultado{results.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>, document.body);
}

/* ── Diálogo de confirmación (aviso al borrar grupos con listas) ── */
function ConfirmDialog({ t, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onKey = (e) => {if (e.key === 'Escape') {e.preventDefault();onCancel();} else if (e.key === 'Enter') {e.preventDefault();onConfirm();}};
    window.addEventListener('keydown', onKey);
    const id = requestAnimationFrame(() => {if (ref.current) ref.current.focus();});
    return () => {window.removeEventListener('keydown', onKey);cancelAnimationFrame(id);};
  }, [onConfirm, onCancel]);
  const dCol = danger ? '#c5563a' : t.accent;
  return ReactDOM.createPortal(
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 9750, background: window.antaskHexA ? window.antaskHexA(t.canvas, 0.62) : 'rgba(14,10,5,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(400px, 94vw)', background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 6, boxShadow: '0 24px 60px rgba(0,0,0,0.32)', padding: '24px 24px 20px', fontFamily: t.fontUI, animation: window.__ANTASK_NOANIM ? 'none' : 'antaskMenuIn .16s cubic-bezier(0.34,1.2,0.64,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 13 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: danger ? 'rgba(197,86,58,0.12)' : t.tintBg, color: dCol }}><Ico name="trash" size={18} /></span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.ink, fontFamily: t.fontDisplay }}>{title}</h3>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, lineHeight: 1.55, color: t.ink2 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: t.ink2, padding: '8px 16px', border: `1px solid ${t.border}`, borderRadius: t.rInput, background: t.inputBg, fontFamily: t.fontUI }}>Cancelar</button>
          <button ref={ref} type="button" onClick={onConfirm} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 650, color: '#fff', padding: '8px 16px', border: 'none', borderRadius: t.rInput, background: dCol, fontFamily: t.fontUI }}>{confirmLabel}</button>
        </div>
      </div>
    </div>, document.body);
}

/* ── Fila de cabecera de grupo (Listas, Trabajo…) con menú contextual ── */
function SectionHeader({ t, sb, sbAccent, g, open, onToggle, onAddList, onRename, onDelete }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onToggle}
    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', justifyContent: 'space-between', borderRadius: t.rNav, cursor: 'pointer', background: hover ? hexA(sb.ink, 0.05) : 'transparent', transition: 'background .12s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: sb.ink2, minWidth: 0 }}>
        <span style={{ color: sb.ink3, transform: open ? 'rotate(90deg)' : 'none', display: 'flex', transition: 'transform .15s' }}><Ico name="chevron" size={14} sw={2} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, color: sb.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <DropMenu t={t} sb={sb} surface="dark" align="left" placement="bottom" width={194}
        sections={[
        [{ heading: g.label }, { icon: 'plus', label: 'Nueva lista', onClick: onAddList }, { icon: 'note', label: 'Renombrar grupo', onClick: () => onRename && onRename() }, { icon: 'tag', label: 'Color y etiqueta' }],
        [{ icon: 'align', label: 'Ordenar por' }],
        [{ icon: 'trash', label: 'Eliminar grupo', danger: true, onClick: () => onDelete && onDelete() }]]
        }
        trigger={({ open, toggle }) =>
        <button type="button" onClick={(e) => {e.stopPropagation();toggle();}} aria-label="Opciones de grupo"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', color: open ? sbAccent : sb.ink3, background: open ? sb.activeBg : 'transparent', opacity: hover || open ? 1 : 0, transition: 'opacity .12s, background .12s, color .12s', lineHeight: "1.4", fontWeight: "300", width: "17px", height: "17px" }}>
              <Ico name="dots" size={16} />
            </button>} />
        {g.plus ?
        <button type="button" onClick={(e) => {e.stopPropagation();onAddList && onAddList();}} aria-label="Nueva lista" style={{ color: sb.ink3, display: 'flex', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}><Ico name="plus" size={15} /></button> :
        <span style={{ fontSize: 12, fontWeight: 600, color: sb.ink3, fontVariantNumeric: 'tabular-nums', fontFamily: t.monoMeta ? t.fontMono : t.fontUI, minWidth: 12, textAlign: 'right' }}>{g.count}</span>}
      </div>
    </div>);

}

/* ── Input inline para crear o renombrar grupo o lista en el sidebar ── */
function SidebarAddInput({ t, sb, placeholder, indent, defaultValue, hideIcon, onCommit, onCancel }) {
  const ref = React.useRef(null);
  const done = React.useRef(false);
  React.useEffect(() => {const id = requestAnimationFrame(() => {if (ref.current) {ref.current.focus();ref.current.select();}});return () => cancelAnimationFrame(id);}, []);
  const commit = (v) => {if (done.current) return;done.current = true;onCommit(v);};
  const cancel = () => {if (done.current) return;done.current = true;onCancel();};
  return (
    <div style={{ padding: indent ? '2px 10px 2px 24px' : '2px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      {!hideIcon && <Ico name="plus" size={14} sw={2} style={{ color: sb.ink3, flexShrink: 0 }} />}
      <input ref={ref} placeholder={placeholder} defaultValue={defaultValue || ''}
      onKeyDown={(e) => {if (e.key === 'Enter') commit(e.currentTarget.value);else if (e.key === 'Escape') cancel();}}
      onBlur={(e) => commit(e.currentTarget.value)}
      style={{ flex: 1, minWidth: 0, border: `1px solid ${sb.accentInk || sb.border}`, outline: 'none', background: hexA(sb.ink, 0.04), color: sb.ink, fontFamily: t.fontUI, fontSize: 13, fontWeight: 500, padding: '5px 9px', borderRadius: t.rNav }} />
    </div>);

}

/* ── Fila de lista/proyecto con menú contextual ── */
function openList(name) {
  window.dispatchEvent(new CustomEvent('antask:openlist', { detail: { list: name, n: Date.now() } }));
}
function ProjectItem({ t, sb, sbAccent, it, active, onDelete, onRename, onMoveTask, dragActive }) {
  const [hover, setHover] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const done = it.progress[0],total = it.progress[1];
  const pct = total ? done / total : 0;
  const C = 2 * Math.PI * 6;
  const prevDone = React.useRef(done);
  const [celebrate, setCelebrate] = React.useState(false);
  const [burst, setBurst] = React.useState(false);
  React.useEffect(() => {
    const timers = [];
    if (done > prevDone.current) {
      setCelebrate(true);
      timers.push(setTimeout(() => setCelebrate(false), 560));
      if (total > 0 && done === total) {
        setBurst(true);
        timers.push(setTimeout(() => setBurst(false), 850));
      }
    }
    prevDone.current = done;
    return () => timers.forEach(clearTimeout);
  }, [done, total]);
  return (
    <div onClick={() => openList(it.name)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    onDragOver={(e) => {const d = window.__antaskDragTask;if (d && d.list !== it.name) {e.preventDefault();e.dataTransfer.dropEffect = 'move';if (!dragOver) setDragOver(true);}}}
    onDragLeave={() => setDragOver(false)}
    onDrop={(e) => {e.preventDefault();setDragOver(false);const d = window.__antaskDragTask;if (d && d.list !== it.name) onMoveTask && onMoveTask(d.id, it.name);}}
    style={{ position: 'relative', padding: '6px 10px 6px 24px', borderRadius: t.rNav, cursor: 'pointer',
      background: dragOver ? sb.activeBg : active ? sb.activeBg : dragActive ? hexA(sbAccent, 0.07) : hover ? hexA(sb.ink, 0.05) : 'transparent',
      boxShadow: dragOver ? `inset 0 0 0 1.5px ${sbAccent}` : 'none',
      transition: 'background .12s, box-shadow .12s' }}>
      {active && <span style={{ position: 'absolute', left: -8, top: 5, bottom: 5, width: 3, borderRadius: '0 3px 3px 0', background: sbAccent }} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ position: 'relative', width: 16, height: 16, flexShrink: 0, display: 'grid', placeItems: 'center', animation: celebrate ? 'antaskRingPop .56s cubic-bezier(.34,1.4,.5,1)' : 'none' }}>
            {burst && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${it.dot || sbAccent}`, animation: 'antaskBurstRing .82s ease-out forwards', pointerEvents: 'none' }} />}
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="none" stroke={sb.barTrack} strokeWidth="2" />
              <circle cx="8" cy="8" r="6" fill="none" stroke={it.dot || sbAccent} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 8 8)"
              style={{ transition: window.__ANTASK_NOANIM ? 'none' : 'stroke-dashoffset .55s cubic-bezier(.34,1.2,.5,1)', opacity: pct > 0 ? 1 : 0 }} />
            </svg>
          </span>
          <span style={{ fontSize: 13, fontWeight: active ? 650 : 500, color: active ? sb.ink : sb.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
        </div>
        {hover ?
        <DropMenu t={t} sb={sb} surface="dark" align="left" placement="bottom" width={194}
        sections={[
        [{ icon: 'arrowRight', label: 'Abrir lista', onClick: () => openList(it.name) }, { icon: 'note', label: 'Renombrar', onClick: () => onRename && onRename() }, { icon: 'tag', label: 'Cambiar color' }],
        [{ icon: 'trash', label: 'Eliminar', danger: true, onClick: () => onDelete && onDelete() }]]
        }
        trigger={({ open, toggle }) =>
        <button type="button" onClick={(e) => {e.stopPropagation();toggle();}} aria-label="Opciones de lista"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 20, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', color: open ? sbAccent : sb.ink3, background: open ? sb.activeBg : 'transparent', transition: 'background .12s, color .12s' }}>
                  <Ico name="dots" size={15} />
                </button>} /> :
        <span key={done} style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 600, color: celebrate ? sbAccent : sb.ink3, fontVariantNumeric: 'tabular-nums', fontFamily: t.fontUI, animation: celebrate ? 'antaskCountPop .5s cubic-bezier(.34,1.4,.5,1)' : 'none', transition: 'color .3s' }}>{done}/{total}</span>}
      </div>
    </div>);

}

/* ───────────────────────── SIDEBAR ───────────────────────── */
function Sidebar({ t, active, tw, setTweak, onNav }) {
  const sb = t.sb;
  const sbAccent = sb.accentInk || t.accentInk;
  const hoverBg = hexA(sb.ink, 0.05); /* tinte de hover unificado, sensible al tema */
  const [hovered, setHovered] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState(false);
  /* Contador dinámico de “Hoy”: tareas vencidas o de hoy sin completar */
  const _calcHoy = (tasks) => {
    if (!tasks || !window.antaskParseDue || !window.antaskDiffDays) return null;
    return tasks.filter((tk) => !tk.done && tk.due && window.antaskDiffDays(window.antaskParseDue(tk.due)) <= 0).length;
  };
  const [hoyCount, setHoyCount] = React.useState(() =>
  window.ANTASK_STORE ? _calcHoy(window.ANTASK_STORE.getAll()) : null
  );
  React.useEffect(() => {
    const h = (e) => {const { tasks } = e.detail || {};if (tasks) setHoyCount(_calcHoy(tasks));};
    window.addEventListener('antask:storechange', h);
    return () => window.removeEventListener('antask:storechange', h);
  }, []);
  /* grupos y listas en estado (creables por el usuario) */
  /* progreso real de cada lista, derivado de ANTASK_DATA.tasks (hechas/total) */
  const listProgress = React.useMemo(() => {
    const m = {};
    (ANTASK_DATA.tasks || []).forEach((tk) => {
      const k = tk.list;
      if (!k) return;
      if (!m[k]) m[k] = [0, 0];
      m[k][1] += 1;
      if (tk.done) m[k][0] += 1;
    });
    return m;
  }, []);
  const [groups, setGroups] = React.useState(() => ANTASK_DATA.groups.map((g) => ({
    ...g,
    items: (g.items || []).map((it) => ({ ...it, progress: listProgress[it.name] || [0, 0] }))
  })));
  const groupsRef = React.useRef(groups);
  React.useEffect(() => {groupsRef.current = groups;}, [groups]);
  const LIST_PALETTE = ['#c98a3c', '#7c8a52', '#5aa06b', '#3d8fb0', '#b0473f', '#8a6fb0'];
  const [addingGroup, setAddingGroup] = React.useState(false);
  const [addingListFor, setAddingListFor] = React.useState(null);
  const addGroup = (name) => {
    const label = (name || '').trim();
    if (!label) {setAddingGroup(false);return;}
    setGroups((gs) => [...gs, { label, count: 0, open: true, items: [] }]);
    setOpenSecs((s) => ({ ...s, [label]: true }));
    setAddingGroup(false);
    /* enlaza el flujo: recién creado el grupo, pide ya su primera lista */
    setAddingListFor(label);
  };
  const addList = (groupLabel, name) => {
    const nm = (name || '').trim();
    setAddingListFor(null);
    if (!nm) return;
    setGroups((gs) => gs.map((g) => {
      if (g.label !== groupLabel) return g;
      if ((g.items || []).some((it) => it.name === nm)) return g;
      const dot = LIST_PALETTE[(g.items || []).length % LIST_PALETTE.length];
      return { ...g, count: (g.count || 0) + 1, items: [...(g.items || []), { name: nm, progress: [0, 0], dot }] };
    }));
    setOpenSecs((s) => ({ ...s, [groupLabel]: true }));
  };
  /* eliminar lista con red de seguridad (toast Deshacer) */
  const [toast, setToast] = React.useState(null);
  const undoTimer = React.useRef(null);
  const dismissToast = React.useCallback(() => {clearTimeout(undoTimer.current);setToast(null);}, []);
  const showUndoToast = React.useCallback((label, onUndo) => {
    clearTimeout(undoTimer.current);
    setToast({ label, onUndo });
    undoTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  React.useEffect(() => () => clearTimeout(undoTimer.current), []);
  const deleteList = (groupLabel, listName) => {
    let snap = null;
    setGroups((gs) => gs.map((g) => {
      if (g.label !== groupLabel) return g;
      const idx = (g.items || []).findIndex((it) => it.name === listName);
      if (idx === -1) return g;
      snap = { idx, item: g.items[idx], prevCount: g.count };
      return { ...g, count: Math.max(0, (g.count || 0) - 1), items: g.items.filter((it) => it.name !== listName) };
    }));
    if (activeList === listName) window.dispatchEvent(new CustomEvent('antask:openlist', { detail: { list: null, n: Date.now() } }));
    showUndoToast('Lista eliminada', () => {
      if (snap) setGroups((gs) => gs.map((g) => {
        if (g.label !== groupLabel) return g;
        const next = [...g.items];
        next.splice(snap.idx, 0, snap.item);
        return { ...g, count: snap.prevCount, items: next };
      }));
      dismissToast();
    });
  };
  const [openSecs, setOpenSecs] = React.useState(() => {
    const o = {};ANTASK_DATA.groups.forEach((g) => {o[g.label] = !!g.open;});return o;
  });
  const toggleSec = (label) => setOpenSecs((s) => ({ ...s, [label]: !s[label] }));
  /* eliminar grupo: aviso si contiene listas, con red de seguridad (toast Deshacer) */
  const [confirmDel, setConfirmDel] = React.useState(null); /* { label, count } */
  const removeGroup = (groupLabel) => {
    let snap = null;
    setGroups((gs) => {
      const idx = gs.findIndex((g) => g.label === groupLabel);
      if (idx === -1) return gs;
      snap = { idx, group: gs[idx] };
      return gs.filter((g) => g.label !== groupLabel);
    });
    if (snap && (snap.group.items || []).some((it) => it.name === activeList)) {
      window.dispatchEvent(new CustomEvent('antask:openlist', { detail: { list: null, n: Date.now() } }));
    }
    setOpenSecs((s) => {const o = { ...s };delete o[groupLabel];return o;});
    showUndoToast('Grupo eliminado', () => {
      if (snap) setGroups((gs) => {const next = [...gs];next.splice(snap.idx, 0, snap.group);return next;});
      dismissToast();
    });
  };
  const requestDeleteGroup = (groupLabel) => {
    const g = groupsRef.current.find((gg) => gg.label === groupLabel);
    const n = g ? (g.items || []).length : 0;
    if (n > 0) setConfirmDel({ label: groupLabel, count: n });else
    removeGroup(groupLabel);
  };
  /* lista activa (filtro del Inbox) para resaltarla aquí */
  const [activeList, setActiveList] = React.useState(null);
  React.useEffect(() => {
    const onAL = (e) => {
      const name = e.detail ? e.detail.list : null;
      setActiveList(name);
      if (name) {
        const grp = groupsRef.current.find((g) => (g.items || []).some((it) => it.name === name));
        if (grp) setOpenSecs((s) => s[grp.label] ? s : { ...s, [grp.label]: true });
      }
    };
    window.addEventListener('antask:activelist', onAL);
    return () => window.removeEventListener('antask:activelist', onAL);
  }, []);
  /* al salir del Inbox, deja de resaltar la lista */
  React.useEffect(() => {if (active !== 'Inbox') setActiveList(null);}, [active]);
  /* refleja en vivo el progreso de cada lista cuando cambian las tareas en el Inbox */
  React.useEffect(() => {
    const onLP = (e) => {
      const m = e.detail || {};
      setGroups((gs) => gs.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it, progress: m[it.name] || [0, 0] })) })));
    };
    window.addEventListener('antask:listprogress', onLP);
    return () => window.removeEventListener('antask:listprogress', onLP);
  }, []);
  /* arrastrar tareas: resalta las listas como destinos de soltado mientras se arrastra */
  const [dragActive, setDragActive] = React.useState(false);
  React.useEffect(() => {
    const on = () => setDragActive(true);
    const off = () => setDragActive(false);
    window.addEventListener('antask:dragstart', on);
    window.addEventListener('antask:dragend', off);
    return () => {window.removeEventListener('antask:dragstart', on);window.removeEventListener('antask:dragend', off);};
  }, []);
  const moveTaskToList = (id, listName) => window.dispatchEvent(new CustomEvent('antask:movetask', { detail: { id, list: listName } }));
  /* renombrar lista / grupo en línea */
  const [renameList, setRenameList] = React.useState(null); /* { group, name } */
  const [renameGroup, setRenameGroup] = React.useState(null); /* label */
  const commitRenameList = (groupLabel, oldName, value) => {
    const nm = (value || '').trim();
    setRenameList(null);
    if (!nm || nm === oldName) return;
    setGroups((gs) => gs.map((g) => {
      if (g.label !== groupLabel) return g;
      if ((g.items || []).some((it) => it.name === nm)) return g;
      return { ...g, items: g.items.map((it) => it.name === oldName ? { ...it, name: nm } : it) };
    }));
    window.dispatchEvent(new CustomEvent('antask:renamelist', { detail: { from: oldName, to: nm } }));
    if (activeList === oldName) {setActiveList(nm);window.dispatchEvent(new CustomEvent('antask:openlist', { detail: { list: nm, n: Date.now() } }));}
  };
  const commitRenameGroup = (oldLabel, value) => {
    const nm = (value || '').trim();
    setRenameGroup(null);
    if (!nm || nm === oldLabel) return;
    setGroups((gs) => gs.some((g) => g.label === nm) ? gs : gs.map((g) => g.label === oldLabel ? { ...g, label: nm } : g));
    setOpenSecs((s) => {const o = { ...s };o[nm] = s[oldLabel];delete o[oldLabel];return o;});
  };
  /* navegar: “Inbox” limpia el filtro de lista; el resto, navegación normal */
  const navClick = (label) => {
    if (label === 'Inbox') window.dispatchEvent(new CustomEvent('antask:openlist', { detail: { list: null, n: Date.now() } }));else
    onNav && onNav(label);
  };
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {e.preventDefault();setSettingsOpen(true);}
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {e.preventDefault();setSearchOpen(true);}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const Row = ({ children, style, onClick, onMouseEnter, onMouseLeave }) => <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ display: 'flex', alignItems: 'center', gap: 10, ...style }}>{children}</div>;
  const floating = t.shell === 'floating';

  /* ── Botón del rail plegado ── */
  const RailBtn = ({ icon, label, on, attention, locked, size = 19, onClick }) => {
    const h = hovered === '__r' + label;
    return (
      <button type="button" title={locked ? label + ' · próximamente' : label} onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHovered('__r' + label)} onMouseLeave={() => setHovered(null)}
      style={{ position: 'relative', width: 38, height: 38, display: 'grid', placeItems: 'center', border: 'none', borderRadius: t.rNav, cursor: locked ? 'default' : 'pointer',
        background: on ? sb.activeBg : h && !locked ? hoverBg : 'transparent', color: locked ? sb.ink3 : on ? sb.accentInk || t.accentInk : sb.ink2, opacity: locked ? 0.6 : 1, transition: 'background .12s, color .12s' }}>
        <Ico name={icon} size={size} />
        {locked && <span style={{ position: 'absolute', bottom: 4, right: 5, display: 'flex', color: sb.ink3 }}><Ico name="lock" size={10} sw={2.4} /></span>}
        {attention && !locked && <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: sbAccent, border: `1.5px solid ${sb.bg}` }} />}
      </button>);
  };

  return (
    <React.Fragment>
    <aside style={{ width: collapsed ? 62 : 226, flexShrink: 0, overflow: 'hidden', position: 'relative', zIndex: 40, background: sb.bg, fontFamily: t.fontUI,
        transition: 'width .32s cubic-bezier(0.45,0.05,0.2,1)',
        borderRight: floating ? 'none' : `1px solid ${sb.border}`,
        borderRadius: floating ? t.rInput + 4 : 0,
        border: floating ? `1px solid ${sb.border}` : undefined,
        boxShadow: floating ? t.shellShadow : 'none' }}>
      {collapsed ?
        <div key="rail" style={{ width: 62, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 0 12px' }}>
        <button type="button" title="Desplegar la barra lateral" onClick={() => setCollapsed(false)}
          style={{ width: 30, height: 30, borderRadius: 8, background: t.grad, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: t.fontDisplay, border: 'none', cursor: 'pointer', marginBottom: 8 }}>A</button>
        <RailBtn icon="search" label="Buscar  ⌘K" size={18} onClick={() => setSearchOpen(true)} />
        {ANTASK_DATA.nav.map((n) =>
          <RailBtn key={n.label} icon={n.icon} label={n.label} size={18} attention={n.attention} on={(active != null ? active === n.label : n.active) && !(activeList && n.label === 'Inbox')} onClick={() => navClick(n.label)} />
          )}
        <div style={{ height: 1, width: 26, background: sb.border, margin: '7px 0' }} />
        {ANTASK_DATA.bottom.map((b) =>
          <RailBtn key={b.label} icon={b.icon} label={b.label} size={17} locked={b.locked} on={active === b.label} onClick={() => onNav && onNav(b.label)} />
          )}
        <div style={{ flex: 1 }} />
        <button type="button" title="Cuenta · miguel cantos" onClick={() => setCollapsed(false)}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${window.antaskHexA ? window.antaskHexA(t.accent, 0.55) : t.accent}`}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          style={{ width: 34, height: 34, borderRadius: '50%', background: t.tintBg, display: 'grid', placeItems: 'center', overflow: 'hidden', padding: 0, border: 'none', cursor: 'pointer', marginTop: 4 }}>
          <image-slot id="antask-avatar" shape="circle" style={{ width: '34px', height: '34px', display: 'block', pointerEvents: 'none' }} placeholder="👤" fit="cover" /></button>
      </div> :
        <div key="full" style={{ width: 226, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* brand */}
      <Row style={{ padding: '15px 14px 14px', justifyContent: 'space-between' }}>
        <Row style={{ gap: 9 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: t.grad, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: t.fontDisplay }}>A</span>
          <span style={{ fontFamily: t.fontDisplay, fontWeight: t.brandWeight, fontSize: 19, color: sb.ink, letterSpacing: '-0.02em' }}>antask</span>
        </Row>
        <Row style={{ gap: 6, color: sb.ink3 }}>
          <span title="Plegar la barra lateral" onClick={() => setCollapsed(true)} style={{ display: 'flex', cursor: 'pointer', borderRadius: 5, padding: 1, color: hovered === '__collapse' ? sb.ink : sb.ink3 }} onMouseEnter={() => setHovered('__collapse')} onMouseLeave={() => setHovered(null)}><Ico name="panel" size={16} /></span>
        </Row>
      </Row>

      {/* buscador — arriba, bajo el brand (como en Antask Visión) */}
      <div style={{ padding: '0 12px 12px' }}>
        <Row onClick={() => setSearchOpen(true)} onMouseEnter={() => setHovered('__search')} onMouseLeave={() => setHovered(null)} style={{ gap: 9, padding: '9px 11px', cursor: 'pointer', background: sb.inputBg, border: `1px solid ${hovered === '__search' ? sbAccent : sb.border}`, borderRadius: t.rInput, color: sb.ink3, justifyContent: 'space-between', transition: 'border-color .12s' }}>
          <Row style={{ gap: 9 }}><Ico name="search" size={15} /><span style={{ fontSize: 13 }}>Buscar</span></Row>
          <span style={{ fontWeight: 600, fontFamily: t.fontMono, padding: '1px 6px', borderRadius: 5, border: `1px solid ${sb.border}`, color: sb.ink3, letterSpacing: '0.02em', fontSize: "10px" }}>⌘+K</span>
        </Row>
      </div>

      <div style={{ padding: '2px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {ANTASK_DATA.nav.map((n) => {
              const on = (active != null ? active === n.label : n.active) && !(activeList && n.label === 'Inbox');
              const displayCount = n.label === 'Hoy' && hoyCount != null ? hoyCount : n.count;
              return (
                <Row key={n.label} onClick={() => navClick(n.label)} onMouseEnter={() => setHovered(n.label)} onMouseLeave={() => setHovered(null)} style={{
                  position: 'relative', cursor: 'pointer',
                  padding: '8px 10px', borderRadius: t.rNav, justifyContent: 'space-between',
                  background: on ? sb.activeBg : hovered === n.label ? hoverBg : 'transparent',
                  transition: 'background .12s'
                }}>
            {on && <span style={{ position: 'absolute', left: -8, top: 5, bottom: 5, width: 3, borderRadius: '0 3px 3px 0', background: sbAccent }} />}
            <Row style={{ gap: 10, color: on ? sbAccent : sb.ink2 }}>
              <Ico name={n.icon} size={17} sw={1.7} />
              <span style={{ fontSize: 13.5, fontWeight: on ? 650 : 550, color: on ? sb.ink : sb.ink2 }}>{n.label}</span>
            </Row>
            {n.attention ?
                  <span style={{ ...{ fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: t.monoMeta ? t.fontMono : t.fontUI, color: t.accentOn, background: sbAccent, padding: '1px 7px', borderRadius: 999, minWidth: 18, textAlign: 'center', lineHeight: 1.5 }, color: "rgb(3, 3, 3)" }}>{displayCount}</span> :
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? sbAccent : sb.ink3, fontVariantNumeric: 'tabular-nums', fontFamily: t.monoMeta ? t.fontMono : t.fontUI }}>{displayCount}</span>}
          </Row>);

            })}
      </div>

      <div style={{ height: 1, background: sb.border, margin: '8px 14px' }} />

      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', flex: 1, minHeight: 0, color: "rgb(244, 239, 227)" }}>
        {groups.map((g) => {
              const open = !!openSecs[g.label];
              return (
                <div key={g.label}>
            {renameGroup === g.label ?
                  <SidebarAddInput t={t} sb={sb} hideIcon defaultValue={g.label} placeholder="Nombre del grupo" onCommit={(v) => commitRenameGroup(g.label, v)} onCancel={() => setRenameGroup(null)} /> :
                  <SectionHeader t={t} sb={sb} sbAccent={sbAccent} g={g} open={open} onToggle={() => toggleSec(g.label)} onRename={() => setRenameGroup(g.label)} onDelete={() => requestDeleteGroup(g.label)} onAddList={() => {setOpenSecs((s) => ({ ...s, [g.label]: true }));setAddingListFor(g.label);}} />}
            {open && g.items.map((it) =>
                  renameList && renameList.group === g.label && renameList.name === it.name ?
                  <SidebarAddInput key={it.name} t={t} sb={sb} indent hideIcon defaultValue={it.name} placeholder="Nombre de la lista" onCommit={(v) => commitRenameList(g.label, it.name, v)} onCancel={() => setRenameList(null)} /> :
                  <ProjectItem key={it.name} t={t} sb={sb} sbAccent={sbAccent} it={it} active={activeList === it.name} dragActive={dragActive} onMoveTask={moveTaskToList} onRename={() => setRenameList({ group: g.label, name: it.name })} onDelete={() => deleteList(g.label, it.name)} />
                  )}
            {open && addingListFor === g.label &&
                  <SidebarAddInput t={t} sb={sb} indent placeholder="Nombre de la lista" onCommit={(v) => addList(g.label, v)} onCancel={() => setAddingListFor(null)} />}
            {open && addingListFor !== g.label &&
                  <button type="button" onClick={() => {setOpenSecs((s) => ({ ...s, [g.label]: true }));setAddingListFor(g.label);}}
                  onMouseEnter={() => setHovered('__addlist_' + g.label)} onMouseLeave={() => setHovered(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', border: 'none', font: 'inherit', cursor: 'pointer', padding: '5px 10px 5px 24px', borderRadius: t.rNav, fontSize: 12.5, fontWeight: 550, color: hovered === '__addlist_' + g.label ? sb.ink2 : sb.ink3, background: hovered === '__addlist_' + g.label ? hoverBg : 'transparent', transition: 'background .12s, color .12s' }}>
                    <Ico name="plus" size={13} sw={2} /><span>{g.items.length ? 'Añadir lista' : 'Añadir la primera lista'}</span>
                  </button>}
          </div>);
            })}
        {addingGroup ?
            <SidebarAddInput t={t} sb={sb} placeholder="Nombre del grupo" onCommit={addGroup} onCancel={() => setAddingGroup(false)} /> :
            <button type="button" onClick={() => setAddingGroup(true)} onMouseEnter={() => setHovered('__newsec')} onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '6px 0 2px', padding: '7px 10px', width: '100%', textAlign: 'left', border: 'none', borderRadius: t.rNav, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 550, color: hovered === '__newsec' ? sb.ink : sb.ink3, background: hovered === '__newsec' ? hoverBg : 'transparent', transition: 'background .12s, color .12s' }}>
          <Ico name="plus" size={15} sw={2} /><span>Nuevo grupo</span>
        </button>}
      </div>

      {/* pie fijo: accesos siempre visibles */}
      <div style={{ padding: '6px 8px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ height: 1, background: sb.border, margin: '2px 6px 6px' }} />
        {ANTASK_DATA.bottom.map((b) => {
              const locked = !!b.locked;
              const on = !locked && active === b.label;
              return (
                <Row key={b.label} onClick={() => {if (!locked && onNav) onNav(b.label);}} onMouseEnter={() => setHovered(b.label)} onMouseLeave={() => setHovered(null)} title={locked ? 'Próximamente' : undefined} style={{ position: 'relative', cursor: locked ? 'default' : 'pointer', padding: '7px 10px', borderRadius: t.rNav, justifyContent: 'space-between', background: on ? sb.activeBg : !locked && hovered === b.label ? hoverBg : 'transparent', opacity: locked ? 0.55 : 1, transition: 'background .12s' }}>
            {on && <span style={{ position: 'absolute', left: -8, top: 5, bottom: 5, width: 3, borderRadius: '0 3px 3px 0', background: sbAccent }} />}
            <Row style={{ gap: 10, color: on ? sbAccent : sb.ink2 }}>
              <Ico name={b.icon} size={16} /><span style={{ fontSize: 13, fontWeight: on ? 650 : 550, color: on ? sb.ink : sb.ink2 }}>{b.label}</span>
            </Row>
            {locked ?
                  <Ico name="lock" size={13} style={{ color: sb.ink3 }} /> :
                  <span style={{ fontSize: 12, fontWeight: 600, color: on ? sbAccent : sb.ink3, fontFamily: t.monoMeta ? t.fontMono : t.fontUI }}>{b.count}</span>}
          </Row>);

            })}
      </div>

      {/* pie: perfil */}
      <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ProfileMenu t={t} sb={sb} sbAccent={sbAccent} onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      </div>}
    </aside>
    {settingsOpen && window.SettingsModal && <window.SettingsModal t={t} tw={tw} setTweak={setTweak} onClose={() => setSettingsOpen(false)} />}
    {searchOpen && <SearchPalette t={t} onClose={() => setSearchOpen(false)} />}
    {toast && <UndoToast t={t} toast={toast} onUndo={toast.onUndo} onClose={dismissToast} />}
    {confirmDel && <ConfirmDialog t={t} danger title="Eliminar grupo"
      confirmLabel={`Eliminar grupo y ${confirmDel.count} lista${confirmDel.count === 1 ? '' : 's'}`}
      message={<React.Fragment>El grupo <strong style={{ color: t.ink, fontWeight: 650 }}>«{confirmDel.label}»</strong> contiene {confirmDel.count} lista{confirmDel.count === 1 ? '' : 's'}. Al eliminarlo se borrará{confirmDel.count === 1 ? '' : 'n'} también {confirmDel.count === 1 ? 'esa lista' : 'todas sus listas'}. Podrás deshacerlo justo después.</React.Fragment>}
      onCancel={() => setConfirmDel(null)}
      onConfirm={() => {removeGroup(confirmDel.label);setConfirmDel(null);}} />}
    </React.Fragment>);

}

/* ───────────────────────── DETAIL / EDIT PANEL ───────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('antask-detail-anim')) {
  const s = document.createElement('style');
  s.id = 'antask-detail-anim';
  s.textContent = '@keyframes antaskSlideIn{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes antaskMenuIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes antaskToastIn{from{opacity:0;transform:translate(-50%,16px) scale(.97)}to{opacity:1;transform:translate(-50%,0) scale(1)}}@keyframes antaskPulse{0%{box-shadow:0 0 0 0 rgba(70,198,107,0.45)}70%{box-shadow:0 0 0 5px rgba(70,198,107,0)}100%{box-shadow:0 0 0 0 rgba(70,198,107,0)}}@keyframes antaskFade{from{opacity:0}to{opacity:1}}@keyframes antaskRingPop{0%{transform:scale(1)}38%{transform:scale(1.32)}100%{transform:scale(1)}}@keyframes antaskCountPop{0%{transform:scale(1)}40%{transform:scale(1.34)}100%{transform:scale(1)}}@keyframes antaskBurstRing{0%{transform:scale(.65);opacity:.85}100%{transform:scale(2.5);opacity:0}}';
  document.head.appendChild(s);
}

function hexA(h, a) {
  const n = h.replace('#', '');
  const r = parseInt(n.substr(0, 2), 16),g = parseInt(n.substr(2, 2), 16),b = parseInt(n.substr(4, 2), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const DETAIL_LISTS = ['Inbox', 'Buceo', 'Inversión', 'Firma Digital', 'Formación', 'IRPs'];

/* ── Selector propio de fecha y hora (popover tematizado, sustituye a los nativos) ── */
const DTP_MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DTP_DIAS = ['L','M','X','J','V','S','D'];
function dtpFmtDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${DTP_MESES[m - 1].slice(0, 3)} ${y}`;
}
function dtpISO(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function DateTimePicker({ t, task, onEdit }) {
  const sb = t.sb;
  const [open, setOpen] = React.useState(null); /* null | 'date' | 'time' */
  const today = new Date();
  const init = task.due ? new Date(task.due + 'T00:00') : today;
  const [vy, setVy] = React.useState(init.getFullYear());
  const [vm, setVm] = React.useState(init.getMonth());
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(null); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  const btn = (active) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: t.rInput, cursor: 'pointer',
    border: `1px solid ${active ? t.sb.accentInk + '88' : sb.border}`, background: active ? sb.inputBg : sb.inputBg, color: sb.ink,
    fontSize: 13.5, fontFamily: t.fontUI, userSelect: 'none', transition: 'border-color .12s' });
  const pop = { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40, borderRadius: t.rInput + 3,
    background: sb.bg, border: `1px solid ${sb.border}`, boxShadow: '0 18px 44px -10px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
    padding: 12, fontFamily: t.fontUI };
  const chip = (on) => ({ padding: '5px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${on ? t.sb.accentInk : sb.border}`, color: on ? t.sb.accentInk : sb.ink2, background: on ? window.antaskHexA(t.sb.accentInk, 0.12) : 'transparent' });
  /* calendario del mes visible */
  const first = new Date(vy, vm, 1);
  const offset = (first.getDay() + 6) % 7; /* lunes = 0 */
  const nDays = new Date(vy, vm + 1, 0).getDate();
  const cells = Array.from({ length: offset }, () => null).concat(Array.from({ length: nDays }, (_, i) => i + 1));
  const isoToday = dtpISO(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const isoTom = dtpISO(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const setDue = (iso) => { onEdit(task.id, { due: iso || undefined }); setOpen(null); };
  /* horas: 06:00–23:30 cada 30 min */
  const times = [];
  for (let h = 6; h < 24; h++) { times.push(`${String(h).padStart(2, '0')}:00`); times.push(`${String(h).padStart(2, '0')}:30`); }
  const navBtn = { width: 26, height: 26, display: 'grid', placeItems: 'center', borderRadius: 7, cursor: 'pointer', color: sb.ink2, border: 'none', background: 'transparent' };
  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', gap: 8 }}>
      <span role="button" tabIndex={0} onClick={() => setOpen(open === 'date' ? null : 'date')}
      onKeyDown={(e) => { if (e.key === 'Enter') setOpen(open === 'date' ? null : 'date'); }}
      onMouseEnter={(e) => { if (open !== 'date') e.currentTarget.style.borderColor = t.sb.accentInk + '88'; }}
      onMouseLeave={(e) => { if (open !== 'date') e.currentTarget.style.borderColor = sb.border; }}
      style={{ ...btn(open === 'date'), flex: 1 }}>
        <Ico name="calendar" size={14} style={{ color: sb.ink3, flexShrink: 0 }} />
        <span style={{ color: task.due ? sb.ink : sb.ink3 }}>{task.due ? (task.due === isoToday ? 'Hoy' : task.due === isoTom ? 'Mañana' : dtpFmtDate(task.due)) : 'Sin fecha'}</span>
      </span>
      <span role="button" tabIndex={0} onClick={() => setOpen(open === 'time' ? null : 'time')}
      onKeyDown={(e) => { if (e.key === 'Enter') setOpen(open === 'time' ? null : 'time'); }}
      onMouseEnter={(e) => { if (open !== 'time') e.currentTarget.style.borderColor = t.sb.accentInk + '88'; }}
      onMouseLeave={(e) => { if (open !== 'time') e.currentTarget.style.borderColor = sb.border; }}
      style={{ ...btn(open === 'time'), width: 108, flexShrink: 0, justifyContent: 'flex-start' }}>
        <Ico name="clock" size={14} style={{ color: sb.ink3, flexShrink: 0 }} />
        <span style={{ color: task.time ? sb.ink : sb.ink3 }}>{task.time || 'Hora'}</span>
      </span>

      {open === 'date' &&
      <div style={pop}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 11 }}>
          <span style={chip(task.due === isoToday)} onClick={() => setDue(isoToday)}>Hoy</span>
          <span style={chip(task.due === isoTom)} onClick={() => setDue(isoTom)}>Mañana</span>
          {task.due && <span style={{ ...chip(false), marginLeft: 'auto' }} onClick={() => setDue(null)}>Quitar</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" aria-label="Mes anterior" style={navBtn} onClick={() => { const m = vm - 1; setVm((m + 12) % 12); if (m < 0) setVy(vy - 1); }}>‹</button>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: sb.ink, textTransform: 'capitalize' }}>{DTP_MESES[vm]} {vy}</span>
          <button type="button" aria-label="Mes siguiente" style={navBtn} onClick={() => { const m = vm + 1; setVm(m % 12); if (m > 11) setVy(vy + 1); }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
          {DTP_DIAS.map((d, i) => <span key={'h' + i} style={{ fontSize: 10, fontWeight: 700, color: sb.ink3, padding: '3px 0' }}>{d}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={'e' + i} />;
            const iso = dtpISO(vy, vm, d);
            const sel = task.due === iso;
            const isT = iso === isoToday;
            return (
              <span key={iso} onClick={() => setDue(iso)}
              style={{ padding: '5px 0', fontSize: 12, borderRadius: 7, cursor: 'pointer', fontWeight: sel || isT ? 700 : 450,
                background: sel ? t.accent : 'transparent', color: sel ? t.accentOn : isT ? t.sb.accentInk : sb.ink2,
                border: isT && !sel ? `1px solid ${window.antaskHexA(t.sb.accentInk, 0.45)}` : '1px solid transparent' }}
              onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = sb.inputBg; }}
              onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>{d}</span>);
          })}
        </div>
      </div>}

      {open === 'time' &&
      <div style={{ ...pop, left: 'auto', width: 148, maxHeight: 238, overflow: 'auto', padding: 6 }}>
        <span onClick={() => { onEdit(task.id, { time: undefined }); setOpen(null); }}
        style={{ display: 'block', padding: '7px 10px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', color: sb.ink3 }}
        onMouseEnter={(e) => e.currentTarget.style.background = sb.inputBg} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Sin hora</span>
        {times.map((tm) => {
          const sel = task.time === tm;
          return (
            <span key={tm} onClick={() => { onEdit(task.id, { time: tm }); setOpen(null); }}
            style={{ display: 'block', padding: '7px 10px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', fontFamily: t.fontMono,
              fontWeight: sel ? 700 : 450, background: sel ? window.antaskHexA(t.sb.accentInk, 0.14) : 'transparent', color: sel ? t.sb.accentInk : sb.ink2 }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = sb.inputBg; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>{tm}</span>);
        })}
      </div>}
    </div>);
}

/* ── Selector de lista (popover tematizado, mismo formato que fecha y hora) ── */
function DetailListPicker({ t, task, onEdit }) {
  const sb = t.sb;
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);
  const current = task.list || 'Inbox';
  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <span role="button" tabIndex={0} onClick={() => setOpen(!open)}
      onKeyDown={(e) => { if (e.key === 'Enter') setOpen(!open); }}
      onMouseEnter={(e) => { if (!open) e.currentTarget.style.borderColor = t.sb.accentInk + '88'; }}
      onMouseLeave={(e) => { if (!open) e.currentTarget.style.borderColor = sb.border; }}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: t.rInput, cursor: 'pointer',
        border: `1px solid ${open ? t.sb.accentInk + '88' : sb.border}`, background: sb.inputBg, color: sb.ink,
        fontSize: 13.5, fontFamily: t.fontUI, userSelect: 'none', transition: 'border-color .12s' }}>
        <Ico name="inbox" size={14} style={{ color: sb.ink3, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{current}</span>
        <Ico name="chevron" size={13} style={{ color: sb.ink3, transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
      </span>
      {open &&
      <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40, borderRadius: t.rInput + 3,
        background: sb.bg, border: `1px solid ${sb.border}`, boxShadow: '0 18px 44px -10px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
        padding: 6, fontFamily: t.fontUI, maxHeight: 238, overflow: 'auto' }}>
        {DETAIL_LISTS.map((l) => {
          const sel = l === current;
          return (
            <span key={l} onClick={() => { onEdit(task.id, { list: l === 'Inbox' ? undefined : l }); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, fontSize: 12.5, cursor: 'pointer',
              fontWeight: sel ? 700 : 450, background: sel ? window.antaskHexA(t.sb.accentInk, 0.14) : 'transparent', color: sel ? t.sb.accentInk : sb.ink2 }}
            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = sb.inputBg; }}
            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ flex: 1 }}>{l}</span>
              {sel && <Ico name="check" size={12} sw={3} />}
            </span>);
        })}
      </div>}
    </div>);
}

function DetailPanel({ t, task, onClose, onEdit, onToggle, onDelete }) {
  const floating = t.shell === 'floating';
  const sb = t.sb; /* mismo lenguaje de color que la sidebar */
  const PRIOS = [
  { key: null, label: 'Ninguna', color: sb.ink3 },
  { key: 'baja', label: 'Baja', color: '#a3b366' },
  { key: 'media', label: 'Media', color: '#e0a35a' },
  { key: 'alta', label: 'Alta', color: '#d9756c' }];

  const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: sb.ink3, fontFamily: t.monoMeta ? t.fontMono : t.fontUI };
  const fieldWrap = { display: 'flex', flexDirection: 'column', gap: 9 };
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: t.rInput, border: `1px solid ${sb.border}`, background: sb.inputBg, color: sb.ink, fontSize: 14, fontFamily: t.fontUI, outline: 'none', colorScheme: 'dark' };
  return (
    <aside style={{ width: '100%', flexShrink: 0, border: `1px solid ${sb.border}`, borderRadius: floating ? t.rInput + 4 : 0, overflow: 'hidden', background: sb.bg, color: sb.ink, display: 'flex', flexDirection: 'column', fontFamily: t.fontUI, minHeight: 0, boxShadow: 'none', alignItems: "stretch", justifyContent: "flex-start", margin: 0, borderTop: floating ? undefined : 'none', borderRight: floating ? undefined : 'none', borderBottom: floating ? undefined : 'none' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderBottom: `1px solid ${sb.border}`, flexShrink: 0, fontSize: "11px" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: sb.ink3, fontFamily: t.monoMeta ? t.fontMono : t.fontUI }}>Detalle de tarea</span>
        <button type="button" onClick={onClose} aria-label="Cerrar panel de detalles" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, cursor: 'pointer', color: sb.ink2, padding: 0, border: 'none', background: 'transparent', borderRadius: 6, transition: 'background .12s, color .12s' }} onMouseEnter={(e) => {e.currentTarget.style.background = sb.inputBg;e.currentTarget.style.color = sb.ink;}} onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';e.currentTarget.style.color = sb.ink2;}}><Ico name="x" size={18} sw={2.2} /></button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* title + checkbox */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {task.done ?
          <span onClick={() => onToggle(task.id)} style={{ width: 21, height: 21, marginTop: 2, borderRadius: t.checkRadius, background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}><Ico name="check" size={13} sw={3} /></span> :
          <span onClick={() => onToggle(task.id)} style={{ width: 21, height: 21, marginTop: 2, borderRadius: t.checkRadius, border: `1.8px solid ${sb.ink3}`, flexShrink: 0, cursor: 'pointer' }} />}
          <textarea value={task.title} onChange={(e) => onEdit(task.id, { title: e.target.value })} rows={2}
          style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 19, lineHeight: 1.32, color: task.done ? sb.ink3 : sb.ink, letterSpacing: '-0.01em', textDecoration: task.done ? 'line-through' : 'none' }} />
        </div>

        {/* descripción */}
        <div style={fieldWrap}>
          <span style={labelStyle}><Ico name="align" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Descripción</span>
          <textarea value={task.desc || ''} onChange={(e) => onEdit(task.id, { desc: e.target.value })} rows={4} placeholder="Añade notas, enlaces o detalles…"
          onMouseEnter={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = t.sb.accentInk + '88'; }}
          onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = sb.border; }}
          onFocus={(e) => e.currentTarget.style.borderColor = t.sb.accentInk + '88'}
          onBlur={(e) => e.currentTarget.style.borderColor = sb.border}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 84, lineHeight: 1.5, transition: 'border-color .12s' }} />
        </div>

        {/* fecha + hora */}
        <div style={fieldWrap}>
          <span style={labelStyle}><Ico name="calendar" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Fecha y hora</span>
          <DateTimePicker t={t} task={task} onEdit={onEdit} />
        </div>

        {/* prioridad */}
        <div style={fieldWrap}>
          <span style={labelStyle}><Ico name="flag" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Prioridad</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {PRIOS.map((pr) => {
              const on = (task.prio || null) === pr.key;
              return (
                <span key={String(pr.key)} onClick={() => onEdit(task.id, { prio: pr.key })}
                onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = hexA(pr.color, 0.10); e.currentTarget.style.borderColor = hexA(pr.color, 0.55); e.currentTarget.style.color = pr.color; } }}
                onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = sb.border; e.currentTarget.style.color = sb.ink2; } }}
                style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: t.rInput, fontSize: 12.5, fontWeight: 650, cursor: 'pointer',
                  border: `1px solid ${on ? pr.color : sb.border}`, background: on ? hexA(pr.color, 0.16) : 'transparent', color: on ? pr.color : sb.ink2, transition: 'background .12s, border-color .12s, color .12s' }}>{pr.label}</span>);

            })}
          </div>
        </div>

        {/* lista */}
        <div style={fieldWrap}>
          <span style={labelStyle}><Ico name="inbox" size={13} style={{ marginRight: 6, verticalAlign: '-2px' }} />Lista</span>
          <DetailListPicker t={t} task={task} onEdit={onEdit} />
        </div>

      </div>

      {/* footer */}
      <div style={{ padding: '13px 18px', borderTop: `1px solid ${sb.border}`, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexShrink: 0 }}>
        <span onClick={() => onDelete(task.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: '#d9756c', fontSize: 13, fontWeight: 600 }}><Ico name="trash" size={15} />Eliminar</span>
      </div>
    </aside>);

}

/* Rail plegado del panel de detalle — espejo del rail de la sidebar colapsada.
   Se muestra cuando no hay ninguna tarea seleccionada: una franja estrecha de
   iconos (los mismos campos del panel) que insinúa el contenido sin ocupar espacio. */
function DetailRail({ t }) {
  const floating = t.shell === 'floating';
  const sb = t.sb;
  const RAIL_ICONS = [['align', 'Descripción'], ['calendar', 'Fecha y hora'], ['flag', 'Prioridad'], ['inbox', 'Lista']];
  return (
    <aside style={{ width: '100%', height: '100%', flexShrink: 0, overflow: 'hidden',
      border: `1px solid ${sb.border}`, borderRadius: floating ? t.rInput + 4 : 0,
      borderTop: floating ? undefined : 'none', borderRight: floating ? undefined : 'none', borderBottom: floating ? undefined : 'none',
      background: sb.bg, boxShadow: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 0 12px', fontFamily: t.fontUI }}>
      <span title="Detalle de tarea — selecciona una tarea para ver sus campos"
      style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 9, color: sb.ink2 }}>
        <Ico name="panel" size={18} />
      </span>
      <div style={{ height: 1, width: 26, background: sb.border, margin: '7px 0' }} />
      {RAIL_ICONS.map(([ic, tip]) =>
      <span key={ic} title={tip} style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 9, color: sb.ink3, opacity: 0.55 }}>
        <Ico name={ic} size={17} />
      </span>)}
    </aside>);

}

/* ───────────────────────── UNDO TOAST (red de seguridad) ───────────────────────── */
function UndoToast({ t, toast, onUndo, onClose }) {
  const [hoverUndo, setHoverUndo] = React.useState(false);
  const [hoverX, setHoverX] = React.useState(false);
  if (!toast) return null;
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', left: '50%', bottom: 'clamp(20px,4vh,34px)', zIndex: 9600, transform: 'translateX(-50%)',
      animation: window.__ANTASK_NOANIM ? 'none' : 'antaskToastIn .22s cubic-bezier(0.34,1.2,0.64,1) both' }}>
      <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 11px 10px 14px',
        background: '#2b241a', color: '#f4efe3', borderRadius: 13, fontFamily: t.fontUI,
        boxShadow: '0 1px 0 rgba(255,245,225,0.06) inset, 0 20px 48px -12px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.32)',
        border: '1px solid rgba(255,245,225,0.10)' }}>
        <span style={{ width: 22, height: 22, borderRadius: t.checkRadius, background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Ico name="check" size={13} sw={3} />
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 550, letterSpacing: '-0.006em', whiteSpace: 'nowrap' }}>{toast.label || 'Tarea completada'}</span>
        <button type="button" onClick={onUndo}
        onMouseEnter={() => setHoverUndo(true)} onMouseLeave={() => setHoverUndo(false)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4, padding: '6px 12px', borderRadius: 9, cursor: 'pointer', font: 'inherit',
          fontSize: 13, fontWeight: 650, color: '#f4efe3',
          background: hoverUndo ? 'rgba(255,245,225,0.16)' : 'rgba(255,245,225,0.09)',
          border: '1px solid rgba(255,245,225,0.16)', transition: 'background .12s' }}>
          <Ico name="undo" size={14} sw={2} />Deshacer
        </button>
        <button type="button" onClick={onClose} aria-label="Descartar"
        onMouseEnter={() => setHoverX(true)} onMouseLeave={() => setHoverX(false)}
        style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', padding: 0,
          color: hoverX ? '#f4efe3' : 'rgba(244,239,227,0.55)', background: hoverX ? 'rgba(255,245,225,0.08)' : 'transparent',
          border: 'none', transition: 'background .12s, color .12s' }}>
          <Ico name="x" size={16} />
        </button>
      </div>
    </div>, document.body);
}

/* ───────────────────────── BULK ACTION BAR ───────────────────────── */
function BulkActionBar({ t, count, onComplete, onDelete, onClear }) {
  const Btn = ({ icon, label, onClick, danger }) => {
    const [h, setH] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: label ? '8px 14px' : '8px 10px',
        border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 650,
        color: danger ? h ? '#f4efe3' : '#f0927a' : '#f4efe3',
        background: h ? danger ? 'rgba(224,100,80,0.20)' : 'rgba(255,245,225,0.12)' : 'transparent',
        borderRadius: 8, transition: 'background .12s, color .12s' }}>
        <Ico name={icon} size={15} sw={2} />{label && <span>{label}</span>}
      </button>);

  };
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9500,
      display: 'inline-flex', alignItems: 'center', background: '#2b241a', borderRadius: 14,
      border: '1px solid rgba(255,245,225,0.12)',
      boxShadow: '0 1px 0 rgba(255,245,225,0.05) inset, 0 20px 48px -12px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.32)',
      fontFamily: t.fontUI, color: '#f4efe3', overflow: 'hidden',
      animation: window.__ANTASK_NOANIM ? 'none' : 'antaskToastIn .22s cubic-bezier(0.34,1.2,0.64,1) both' }}>
      <span style={{ padding: '0 16px', fontSize: 13.5, fontWeight: 650, letterSpacing: '-0.006em',
        borderRight: '1px solid rgba(255,245,225,0.10)', alignSelf: 'stretch',
        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {count} tarea{count === 1 ? '' : 's'}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', gap: 2 }}>
        <Btn icon="check2" label="Completar" onClick={onComplete} />
        <Btn icon="trash" label="Eliminar" onClick={onDelete} danger />
      </div>
      <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,245,225,0.10)' }} />
      <div style={{ padding: '4px 6px' }}><Btn icon="x" onClick={onClear} /></div>
    </div>, document.body
  );
}

/* ───────────────────────── ROW STYLE PICKER ───────────────────────── */
const ROW_STYLES_DEF = [
{ value: 'limpio', label: 'Limpio', icon: 'list' },
{ value: 'lineas', label: 'Líneas', icon: 'align' },
{ value: 'tarjetas', label: 'Tarjetas', icon: 'cards' },
{ value: 'compacto', label: 'Compacto', icon: 'layers' }];


function RowStylePicker({ t, tw, setTweak, compact = false }) {
  const current = tw && tw.rowStyle && tw.rowStyle !== 'auto' ? tw.rowStyle : null;
  const def = ROW_STYLES_DEF.find((s) => s.value === current);
  const label = def ? def.label : 'Vista';
  const icon = def ? def.icon : 'list';

  return (
    <DropMenu t={t} align="right" placement="bottom" width={172}
    sections={[ROW_STYLES_DEF.map((s) => ({
      icon: s.icon,
      label: s.label,
      right: current === s.value ?
      <Ico name="check2" size={14} style={{ color: t.accentInk }} /> :
      null,
      onClick: () => setTweak && setTweak('rowStyle', s.value)
    }))]}
    trigger={({ open, toggle }) =>
    <div onClick={toggle} title={compact ? label : 'Estilo de filas'}
    onMouseEnter={(e) => { if (!open) { e.currentTarget.style.background = t.tintBg; e.currentTarget.style.color = t.accentInk; if (!compact) e.currentTarget.style.borderColor = t.accentInk + '60'; } }}
    onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.ink2; if (!compact) e.currentTarget.style.borderColor = t.border; } }}
    style={{
      display: 'flex', alignItems: 'center', gap: compact ? 0 : 6,
      padding: compact ? '7px 10px' : '7px 12px',
      borderRadius: t.rSeg, cursor: 'pointer',
      border: compact ? 'none' : `1px solid ${open ? t.accentInk + '60' : t.border}`,
      color: open ? t.accentInk : t.ink2,
      background: open ? compact ? t.tintBg : t.tintBg : 'transparent',
      fontSize: 13, fontWeight: 550,
      transition: 'color .15s, background .15s',
      userSelect: 'none',
      borderRadius: t.rSeg
    }}>
      <Ico name={icon} size={14} sw={1.9} />
      {!compact && <span>{label}</span>}
    </div>
    } />);
}

/* ───────────────────────── MAIN VIEW ───────────────────────── */
function InboxView({ theme: t, tw, setTweak, embed = false, hidden = false, archived = false }) {
  const views = [{ id: 'lista', ic: 'list', l: 'Lista' }, { id: 'agenda', ic: 'calendar', l: 'Agenda' }, { id: 'mes', ic: 'grid', l: 'Mes' }];
  const [view, setView] = React.useState('lista');
  const [tasks, setTasks] = React.useState(() => ANTASK_DATA.tasks.map((x) => ({ ...x })));
  const displayTasks = React.useMemo(() => archived ? tasks.filter((x) => x.done) : tasks, [tasks, archived]);
  /* difunde el progreso real por lista (hechas/total) para que la sidebar lo refleje en vivo */
  React.useEffect(() => {
    if (archived) return;
    const m = {};
    tasks.forEach((tk) => {
      if (!tk.list) return;
      if (!m[tk.list]) m[tk.list] = [0, 0];
      m[tk.list][1] += 1;
      if (tk.done) m[tk.list][0] += 1;
    });
    window.dispatchEvent(new CustomEvent('antask:listprogress', { detail: m }));
  }, [tasks, archived]);
  const [selectedId, setSelectedId] = React.useState(null);
  /* Toast "Deshacer" — red de seguridad al completar una tarea */
  const [toast, setToast] = React.useState(null);
  const undoTimer = React.useRef(null);
  const dismissToast = React.useCallback(() => {clearTimeout(undoTimer.current);setToast(null);}, []);
  const showUndoToast = React.useCallback((label, onUndo) => {
    clearTimeout(undoTimer.current);
    setToast({ label, onUndo });
    undoTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  React.useEffect(() => () => clearTimeout(undoTimer.current), []);
  /* completa/reabre; al completar muestra el toast de deshacer */
  const completeToggle = (id, setter, arr) => {
    const task = arr.find((x) => x.id === id);
    setter((ts) => ts.map((x) => x.id === id ? { ...x, done: !x.done } : x));
    if (task && !task.done) {
      showUndoToast('Tarea completada', () => {setter((ts) => ts.map((x) => x.id === id ? { ...x, done: false } : x));dismissToast();});
    } else {
      dismissToast();
    }
  };
  const toggle = (id) => {
    completeToggle(id, setTasks, tasks);
    if (window.ANTASK_STORE) {
      const task = tasks.find((x) => x.id === id);
      if (task) window.ANTASK_STORE.setDone(id, !task.done, 'inbox');
    }
  };
  const editTask = (id, patch) => {
    setTasks((ts) => ts.map((x) => x.id === id ? { ...x, ...patch } : x));
    if (window.ANTASK_STORE && patch.due !== undefined) window.ANTASK_STORE.update(id, { due: patch.due }, 'inbox');
  };
  const deleteTask = (id) => {
    const task = tasks.find((x) => x.id === id);
    const idx = tasks.findIndex((x) => x.id === id);
    setTasks((ts) => ts.filter((x) => x.id !== id));
    setSelectedId(null);
    showUndoToast('Tarea eliminada', () => {
      setTasks((ts) => {const next = [...ts];next.splice(idx, 0, task);return next;});
      dismissToast();
    });
  };
  /* acciones en lote */
  const bulkDelete = (ids) => {
    const snapshot = [...tasks];const count = ids.size;
    setTasks((ts) => ts.filter((x) => !ids.has(x.id)));setSelectedId(null);
    showUndoToast(`${count} tarea${count === 1 ? '' : 's'} eliminada${count === 1 ? '' : 's'}`, () => {setTasks(snapshot);dismissToast();});
  };
  const bulkComplete = (ids) => {
    const count = ids.size;
    setTasks((ts) => ts.map((x) => ids.has(x.id) ? { ...x, done: true } : x));
    showUndoToast(`${count} tarea${count === 1 ? '' : 's'} completada${count === 1 ? '' : 's'}`, () => {setTasks((ts) => ts.map((x) => ids.has(x.id) ? { ...x, done: false } : x));dismissToast();});
  };

  const selectedTask = tasks.find((x) => x.id === selectedId) || null;
  /* Agenda: dataset y selección propios, mismo panel de detalle */
  const [agendaTasks, setAgendaTasks] = React.useState(() => (window.ANTASK_DATED || []).map((x) => ({ ...x })));
  const [selectedAgendaId, setSelectedAgendaId] = React.useState(null);
  const toggleAgenda = (id) => {
    completeToggle(id, setAgendaTasks, agendaTasks);
    if (window.ANTASK_STORE) {
      const task = agendaTasks.find((x) => x.id === id);
      if (task) window.ANTASK_STORE.setDone(id, !task.done, 'inbox');
    }
  };
  const editAgenda = (id, patch) => {
    setAgendaTasks((ts) => ts.map((x) => x.id === id ? { ...x, ...patch } : x));
    if (window.ANTASK_STORE && patch.due !== undefined) window.ANTASK_STORE.update(id, { due: patch.due }, 'inbox');
  };
  const deleteAgenda = (id) => {
    const task = agendaTasks.find((x) => x.id === id);
    const idx = agendaTasks.findIndex((x) => x.id === id);
    setAgendaTasks((ts) => ts.filter((x) => x.id !== id));
    setSelectedAgendaId(null);
    showUndoToast('Tarea eliminada', () => {
      setAgendaTasks((ts) => {const next = [...ts];next.splice(idx, 0, task);return next;});
      dismissToast();
    });
  };
  const selectedAgendaTask = agendaTasks.find((x) => x.id === selectedAgendaId) || null;
  /* Mes: comparte el dataset con fechas (agendaTasks), selección propia */
  const [selectedMesId, setSelectedMesId] = React.useState(null);
  const deleteMes = (id) => {
    const task = agendaTasks.find((x) => x.id === id);
    const idx = agendaTasks.findIndex((x) => x.id === id);
    setAgendaTasks((ts) => ts.filter((x) => x.id !== id));
    setSelectedMesId(null);
    showUndoToast('Tarea eliminada', () => {
      setAgendaTasks((ts) => {const next = [...ts];next.splice(idx, 0, task);return next;});
      dismissToast();
    });
  };
  const selectedMesTask = agendaTasks.find((x) => x.id === selectedMesId) || null;
  /* Captura rápida (Ctrl+⇧+Espacio): el overlay global emite esta tarea.
     Sólo el Inbox vivo la recoge; la añade arriba y la resalta un instante. */
  const [flashId, setFlashId] = React.useState(null);
  React.useEffect(() => {
    if (archived) return;
    const onNew = (e) => {
      const task = e.detail;
      if (!task) return;
      setTasks((ts) => [task, ...ts]);
      setFlashId(task.id);
      setTimeout(() => setFlashId((f) => f === task.id ? null : f), 1600);
    };
    window.addEventListener('antask:newtask', onNew);
    return () => window.removeEventListener('antask:newtask', onNew);
  }, [archived]);
  /* Mover una tarea a otra lista (drag & drop desde la lista hacia el sidebar) */
  React.useEffect(() => {
    if (archived) return;
    const onMove = (e) => {
      const { id, list } = e.detail || {};
      if (id == null) return;
      let info = null;
      setTasks((ts) => {
        const cur = ts.find((x) => x.id === id);
        if (!cur || cur.list === list) return ts;
        info = { prevList: cur.list, title: cur.title };
        return ts.map((x) => x.id === id ? { ...x, list } : x);
      });
      if (info) {
        setFlashId(id);
        setTimeout(() => setFlashId((f) => f === id ? null : f), 1600);
        showUndoToast(`Movida a «${list}»`, () => {
          setTasks((p) => p.map((x) => x.id === id ? { ...x, list: info.prevList } : x));
          dismissToast();
        });
      }
    };
    window.addEventListener('antask:movetask', onMove);
    return () => window.removeEventListener('antask:movetask', onMove);
  }, [archived, showUndoToast, dismissToast]);
  /* Renombrar lista: las tareas con esa lista siguen el nuevo nombre */
  React.useEffect(() => {
    if (archived) return;
    const onRn = (e) => {
      const { from, to } = e.detail || {};
      if (!from || !to) return;
      setTasks((ts) => ts.map((x) => x.list === from ? { ...x, list: to } : x));
    };
    window.addEventListener('antask:renamelist', onRn);
    return () => window.removeEventListener('antask:renamelist', onRn);
  }, [archived]);
  /* Sync con store — refleja cambios de HoyView (completar, mover a hoy) en Lista y Agenda */
  React.useEffect(() => {
    const handler = (e) => {
      const { tasks: storeTasks, source } = e.detail || {};
      if (source === 'inbox' || !storeTasks) return;
      // Busca match por id numérico/string O por título normalizado (los datasets tienen ids distintos)
      const sync = (ts) => ts.map((t) => {
        const match =
        storeTasks.find((x) => String(x.id) === String(t.id)) ||
        storeTasks.find((x) => x.title.trim().toLowerCase() === t.title.trim().toLowerCase());
        return match ? { ...t, done: match.done, due: match.due } : t;
      });
      setTasks(sync);
      setAgendaTasks(sync);
    };
    window.addEventListener('antask:storechange', handler);
    return () => window.removeEventListener('antask:storechange', handler);
  }, []);
  /* Abrir una lista desde el sidebar: cambia a vista Lista y filtra por esa lista */
  const [listReq, setListReq] = React.useState(null);
  const [activeListName, setActiveListName] = React.useState(null);
  React.useEffect(() => {
    if (archived) return;
    const onOpen = (e) => {
      if (!e.detail) return;
      setView('lista');
      setListReq(e.detail);
    };
    window.addEventListener('antask:openlist', onOpen);
    return () => window.removeEventListener('antask:openlist', onOpen);
  }, [archived]);
  React.useEffect(() => {
    const h = (e) => {if (e.key === 'Escape') {setSelectedId(null);setSelectedAgendaId(null);setSelectedMesId(null);}};
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const pending = archived ? displayTasks.length : tasks.filter((x) => !x.done).length;
  const counts = { lista: pending, agenda: agendaTasks.filter((x) => !x.done).length, mes: agendaTasks.length };
  const floating = t.shell === 'floating';
  const mainEl =
  <main data-om-label="VISTA TAREAS" style={{ flex: 1, minWidth: 0, display: hidden ? 'none' : 'flex', flexDirection: 'column',
    background: floating ? t.shellPanel : 'transparent',
    borderRadius: floating ? t.rInput + 4 : 0,
    border: floating ? `1px solid ${t.border}` : 'none',
    boxShadow: floating ? t.shellShadow : 'none',
    overflow: floating ? 'hidden' : 'visible' }}>
        {/* header */}
        <div style={{ padding: '14px 26px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ maxWidth: 932, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: t.titleSize, letterSpacing: t.titleTrack, color: t.ink, whiteSpace: 'nowrap' }}>{archived ? 'Archivados' : activeListName || 'Inbox'}</h1>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontUI, padding: '3px 9px', borderRadius: 999, background: t.tintBg, border: `1px solid ${t.accentInk}30`, color: t.accentInk, fontVariantNumeric: 'tabular-nums', lineHeight: 1.6, flexShrink: 0 }}>{counts[view]}</span>
          </div>
          {!archived && <RowStylePicker t={t} tw={tw} setTweak={setTweak} compact />}
          </div>
        </div>

        {view === 'lista' &&
    <div style={{ flex: 1, minHeight: 0, display: 'flex', padding: "0px" }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ListaBody t={t} tasks={displayTasks} toggle={toggle} selectedId={selectedId} onSelect={setSelectedId} hideAdd={archived} onBulkDelete={bulkDelete} onBulkComplete={bulkComplete} flashId={flashId} onQuickAdd={() => window.openQuickCapture && window.openQuickCapture()} externalFilter={listReq} onActiveList={setActiveListName} />
            </div>
          </div>}
      </main>;
  const toastEl = <UndoToast t={t} toast={toast} onUndo={() => {toast && toast.onUndo && toast.onUndo();}} onClose={dismissToast} />;
  const activeDetailProps =
  view === 'lista' && selectedTask ? { task: selectedTask, onClose: () => setSelectedId(null), onEdit: editTask, onToggle: toggle, onDelete: deleteTask } :
  view === 'agenda' && selectedAgendaTask ? { task: selectedAgendaTask, onClose: () => setSelectedAgendaId(null), onEdit: editAgenda, onToggle: toggleAgenda, onDelete: deleteAgenda } :
  view === 'mes' && selectedMesTask ? { task: selectedMesTask, onClose: () => setSelectedMesId(null), onEdit: editAgenda, onToggle: toggleAgenda, onDelete: deleteMes } :
  null;
  const detailEl =
  <div style={{ width: activeDetailProps ? 340 : 62, flexShrink: 0, overflow: 'hidden', transition: 'width .32s cubic-bezier(0.45,0.05,0.2,1)', display: hidden ? 'none' : 'flex' }}>
      {activeDetailProps ? <DetailPanel t={t} {...activeDetailProps} /> : <DetailRail t={t} />}
    </div>;

  if (embed) return <React.Fragment>{mainEl}{detailEl}{toastEl}</React.Fragment>;
  return (
    <div style={{ display: 'flex', height: '100%', gap: '10px', padding: '10px', boxSizing: 'border-box', background: floating ? t.desk : t.canvas, color: t.ink, fontFamily: t.fontUI }}>
      <Sidebar t={t} tw={tw} setTweak={setTweak} />
      {mainEl}
      {toastEl}
    </div>);

}

/* ───────────────────────── LISTA body ───────────────────────── */
function ListaBody({ t, tasks, toggle, selectedId, onSelect, hideAdd, onBulkDelete, onBulkComplete, flashId, onQuickAdd, externalFilter, onActiveList }) {
  const [activeFilter, setActiveFilter] = React.useState('Todas');
  /* inline task add */
  const [addingTask, setAddingTask] = React.useState(false);
  const [addTitle, setAddTitle] = React.useState('');
  const addInputRef = React.useRef(null);
  React.useEffect(() => {if (addingTask && addInputRef.current) addInputRef.current.focus();}, [addingTask]);
  const startAdd = () => {setAddTitle('');setAddingTask(true);};
  const commitAdd = () => {
    const title = addTitle.trim();
    if (title) {
      const FIXED = ['pendientes', 'completadas', 'vencidas', 'hoy', 'sin-fecha', 'alta-prio', 'con-nota'];
      const list = !FIXED.includes(activeFilter) && activeFilter !== 'Todas' ? activeFilter : undefined;
      window.dispatchEvent(new CustomEvent('antask:newtask', { detail: { id: 'inline-' + Date.now(), title, done: false, list } }));
    }
    setAddingTask(false);setAddTitle('');
  };
  const cancelAdd = () => {setAddingTask(false);setAddTitle('');};
  /* aplica la lista pedida desde el sidebar */
  React.useEffect(() => {
    if (!externalFilter) return;
    setActiveFilter(externalFilter.list ? externalFilter.list : 'Todas');
  }, [externalFilter]);
  /* avisa al resto de la app (título + sidebar) qué lista está activa */
  React.useEffect(() => {
    const isFixed = ['pendientes', 'completadas', 'vencidas', 'hoy', 'sin-fecha', 'alta-prio', 'con-nota'].includes(activeFilter);
    const listName = !isFixed && activeFilter !== 'Todas' ? activeFilter : null;
    onActiveList && onActiveList(listName);
    window.dispatchEvent(new CustomEvent('antask:activelist', { detail: { list: listName } }));
  }, [activeFilter, onActiveList]);

  /* filtros dinámicos: listas presentes en las tareas → chip con punto de color */
  const LIST_DOTS = React.useMemo(() => {
    const m = {};
    (ANTASK_DATA.groups || []).forEach((g) => (g.items || []).forEach((it) => {if (it.dot) m[it.name] = it.dot;}));
    return m;
  }, []);
  const listFilters = React.useMemo(() => {
    const seen = new Set(),out = [];
    tasks.forEach((tk) => {if (tk.list && !seen.has(tk.list)) {seen.add(tk.list);out.push({ id: tk.list, label: tk.list });}});
    return out;
  }, [tasks, LIST_DOTS, t.accentInk]);
  const dynamicFilters = listFilters;

  const filtered = React.useMemo(() => {
    const today = new Date();today.setHours(0, 0, 0, 0);
    const parseIso = (iso) => {const p = String(iso).split('-').map(Number);const d = new Date(p[0], p[1] - 1, p[2]);d.setHours(0, 0, 0, 0);return d;};
    switch (activeFilter) {
      case 'Todas':return tasks;
      case 'pendientes':return tasks.filter((x) => !x.done);
      case 'completadas':return tasks.filter((x) => x.done);
      case 'vencidas':return tasks.filter((x) => x.due && !x.done && parseIso(x.due) < today);
      case 'hoy':return tasks.filter((x) => x.due && parseIso(x.due).getTime() === today.getTime());
      case 'sin-fecha':return tasks.filter((x) => !x.due);
      case 'alta-prio':return tasks.filter((x) => x.prio === 'alta');
      case 'con-nota':return tasks.filter((x) => !!x.origin);
      default:return tasks.filter((x) => x.list === activeFilter);
    }
  }, [tasks, activeFilter]);

  /* progreso real por lista (hechas/total) desde el set completo — alimenta la barra de cada grupo */
  const listStats = React.useMemo(() => {
    const m = {};
    tasks.forEach((tk) => {
      if (!tk.list) return;
      if (!m[tk.list]) m[tk.list] = { done: 0, total: 0 };
      m[tk.list].total += 1;if (tk.done) m[tk.list].done += 1;
    });
    return m;
  }, [tasks]);
  /* plegado de completadas */
  const [showDone, setShowDone] = React.useState(false);

  const FIXED_FILTER_IDS = ['pendientes', 'completadas', 'vencidas', 'hoy', 'sin-fecha', 'alta-prio', 'con-nota'];
  const FIXED_FILTER_LABEL = { pendientes: 'Pendientes', completadas: 'Completadas', vencidas: 'Vencidas', hoy: 'Hoy', 'sin-fecha': 'Sin fecha', 'alta-prio': 'Alta prioridad', 'con-nota': 'Con nota' };
  const isFixedActive = FIXED_FILTER_IDS.includes(activeFilter);

  const menuSections = [
  [
  { heading: 'Estado' },
  { icon: 'circle', label: 'Pendientes', right: activeFilter === 'pendientes' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'pendientes' ? 'Todas' : 'pendientes') },
  { icon: 'check', label: 'Completadas', right: activeFilter === 'completadas' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'completadas' ? 'Todas' : 'completadas') }],

  [
  { heading: 'Tiempo' },
  { icon: 'flag', label: 'Vencidas', right: activeFilter === 'vencidas' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'vencidas' ? 'Todas' : 'vencidas') },
  { icon: 'sun', label: 'Hoy', right: activeFilter === 'hoy' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'hoy' ? 'Todas' : 'hoy') },
  { icon: 'calendar', label: 'Sin fecha', right: activeFilter === 'sin-fecha' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'sin-fecha' ? 'Todas' : 'sin-fecha') }],

  [
  { heading: 'Atributos' },
  { icon: 'flag', label: 'Alta prioridad', right: activeFilter === 'alta-prio' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'alta-prio' ? 'Todas' : 'alta-prio') },
  { icon: 'note', label: 'Con nota', right: activeFilter === 'con-nota' ? <Ico name="check2" size={14} style={{ color: t.accentInk }} /> : null, onClick: () => setActiveFilter(activeFilter === 'con-nota' ? 'Todas' : 'con-nota') }]];



  const Chip = ({ id, label, dot, tag }) => {
    const on = id === activeFilter;
    return (
      <span onClick={() => setActiveFilter(on ? 'Todas' : id)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600, padding: '5px 13px', borderRadius: t.rPill, cursor: 'pointer',
        background: on ? t.tintBg : 'transparent', color: on ? t.accentInk : t.ink2,
        border: on ? `1px solid ${t.accentInk}44` : `1px solid ${t.border}`,
        transition: 'all .12s', whiteSpace: 'nowrap', flexShrink: 0, opacity: "1"
      }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
        {tag && <span style={{ opacity: 0.5, fontWeight: 700 }}>#</span>}
        {label}
      </span>);

  };

  /* ── selección múltiple ── */
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const lastSelIdxRef = React.useRef(null);
  const isMultiMode = selectedIds.size > 0;
  const clearSel = () => {setSelectedIds(new Set());lastSelIdxRef.current = null;};
  const toggleSelect = (id, shiftKey) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelIdxRef.current !== null) {
        const curIdx = filtered.findIndex((x) => x.id === id);
        if (curIdx !== -1) {
          const from = Math.min(lastSelIdxRef.current, curIdx);
          const to = Math.max(lastSelIdxRef.current, curIdx);
          for (let i = from; i <= to; i++) {if (filtered[i]) next.add(filtered[i].id);}
        }
      } else {
        if (next.has(id)) next.delete(id);else next.add(id);
      }
      return next;
    });
    lastSelIdxRef.current = filtered.findIndex((x) => x.id === id);
  };
  React.useEffect(() => {setSelectedIds(new Set());lastSelIdxRef.current = null;}, [activeFilter]);
  React.useEffect(() => {
    if (!isMultiMode) return;
    const h = (e) => {if (e.key === 'Escape') clearSel();};
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isMultiMode]);

  return (
    <React.Fragment>
      {/* quick add */}
      {!hideAdd &&
      <div style={{ maxWidth: 932, width: '100%', borderStyle: "solid", borderColor: "rgb(195, 196, 195)", borderWidth: "0px", margin: "0 auto", padding: "1px 26px 0px", display: "none" }}>
          {addingTask ?
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: t.inputBg, border: `1px solid ${t.accentInk}55`, borderRadius: t.rInput, boxShadow: `0 0 0 3px ${t.accentInk}14` }}>
              <span style={{ color: t.accentInk, fontWeight: 700, flexShrink: 0, fontSize: 16 }}>+</span>
              <input ref={addInputRef} value={addTitle} onChange={(e) => setAddTitle(e.target.value)}
          onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault();commitAdd();} else if (e.key === 'Escape') {e.preventDefault();cancelAdd();}}}
          onBlur={commitAdd}
          placeholder="Nombre de la tarea…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: t.fontUI, fontSize: 14.5, color: t.ink }} />
              <span style={{ fontSize: 12, color: t.ink3, flexShrink: 0 }}>↵ guardar · Esc cancelar</span>
            </div> :

        <div onClick={startAdd} style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '13px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: t.rInput, color: t.ink3, fontSize: 14.5, cursor: 'text', justifyContent: "center" }}>
              <span style={{ color: t.accentInk, marginRight: 10, fontWeight: 700 }}>+</span>
              Nueva tarea…
              <span title="Captura rápida con metadatos" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 3, opacity: 0.85 }}>
                {['Ctrl', '⇧', 'Espacio'].map((k, i) =>
            <React.Fragment key={k}>
                  {i > 0 && <span style={{ fontSize: 9.5, color: t.ink3 }}>+</span>}
                  <span style={{ fontFamily: t.fontMono, fontSize: 9.5, lineHeight: 1, padding: '2px 5px', borderRadius: 4, background: t.kbdBg, border: `1px solid ${t.border}`, color: t.ink3 }}>{k}</span>
                </React.Fragment>
            )}
              </span>
            </div>
        }
        </div>
      }

      {/* filtros */}
      <div style={{ padding: '14px 26px 10px', overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', justifyContent: "flex-start", maxWidth: 932, margin: '0 auto', width: '100%' }}>

          {/* botón Filtrar → dropdown con filtros fijos */}
          <DropMenu t={t} align="left" placement="bottom" width={210}
          sections={menuSections}
          trigger={({ open, toggle }) =>
          <div onClick={toggle}
          onMouseEnter={(e) => { if (!isFixedActive && !open) { e.currentTarget.style.background = t.tintBg; e.currentTarget.style.color = t.accentInk; e.currentTarget.style.borderColor = t.accentInk + '66'; } }}
          onMouseLeave={(e) => { if (!isFixedActive && !open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.ink2; e.currentTarget.style.borderColor = t.border; } }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px',
            borderRadius: t.rPill, cursor: 'pointer', flexShrink: 0,
            border: `1px solid ${isFixedActive || open ? t.accentInk + '66' : t.border}`,
            background: isFixedActive || open ? t.tintBg : 'transparent',
            color: isFixedActive || open ? t.accentInk : t.ink2,
            fontSize: 13, fontWeight: 600, transition: 'all .12s'
          }}>
                <Ico name="filter" size={13} />
                <span>{isFixedActive ? FIXED_FILTER_LABEL[activeFilter] : 'Filtrar'}</span>
                {isFixedActive ?
            <span onClick={(e) => {e.stopPropagation();setActiveFilter('Todas');}}
            style={{ display: 'flex', marginLeft: 2, opacity: 0.7 }}>
                      <Ico name="x" size={13} />
                    </span> :
            <Ico name="chevron" size={13} style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
            }
              </div>
          } />
          

          {/* lista activa (desde la sidebar): un único chip para verla y quitarla */}
          {!isFixedActive && activeFilter !== 'Todas' &&
          <Chip id={activeFilter} label={activeFilter} dot={LIST_DOTS[activeFilter]} />}

          {/* conteo */}
          {activeFilter !== 'Todas' &&
          <span style={{ fontSize: 12, color: t.ink3, fontWeight: 550, marginLeft: 4, flexShrink: 0 }}>
              {filtered.length} {filtered.length === 1 ? 'tarea' : 'tareas'}
            </span>
          }
        </div>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2px 26px 96px', width: '100%', boxSizing: 'border-box' }}>
        <div data-antask-content style={{ maxWidth: 932, margin: '0 auto', width: '100%' }}>
        {(() => {
          const renderTask = (task, i, arr) =>
          <TaskRow key={task.id} task={task} t={t} idx={i} first={i === 0} last={i === arr.length - 1} onToggle={toggle} selected={task.id === selectedId} onSelect={onSelect} isMultiMode={isMultiMode} isSelected={selectedIds.has(task.id)} onToggleSelect={toggleSelect} flash={task.id === flashId} />;

          if (filtered.length === 0) {
            return !isFixedActive && activeFilter !== 'Todas' ?
            <div style={{ padding: '52px 8px', textAlign: 'center', color: t.ink3 }}>
                <div style={{ fontSize: 14.5, fontWeight: 550, color: t.ink2 }}>Aún no hay tareas en «{activeFilter}».</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Crea la primera para esta lista.</div>
                <button type="button" onClick={onQuickAdd} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', background: t.accent, color: t.accentOn, fontFamily: t.fontUI, fontSize: 13.5, fontWeight: 650 }}>
                  <Ico name="plus" size={15} sw={2.4} /> Nueva tarea
                </button>
              </div> :
            activeFilter === 'Todas' ?
            <div style={{ padding: '56px 8px', textAlign: 'center', color: t.ink3 }}>
                <div style={{ width: 44, height: 44, margin: '0 auto 14px', borderRadius: '50%', background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk }}><Ico name="inbox" size={20} sw={2} /></div>
                <div style={{ fontSize: 14.5, fontWeight: 550, color: t.ink2 }}>Inbox limpio.</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Todo procesado — captura algo nuevo cuando llegue.</div>
              </div> :
            <div style={{ padding: '48px 8px', textAlign: 'center', color: t.ink3, fontSize: 14 }}>Sin tareas para este filtro.</div>;
          }

          const groupByList = activeFilter === 'Todas' || activeFilter === 'pendientes';
          const foldCompleted = activeFilter !== 'completadas';
          const pend = foldCompleted ? filtered.filter((x) => !x.done) : filtered;
          const done = foldCompleted ? filtered.filter((x) => x.done) : [];

          /* bloque sobrio — mismo lenguaje que la vista Hoy */
          const blockStyle = { marginBottom: 14, background: t.mode === 'dark' ? 'rgba(255,240,220,0.032)' : 'rgba(50,42,28,0.032)', border: `1px solid ${t.border}`, borderRadius: (t.rowRadius != null ? t.rowRadius : 8) + 8, padding: `11px 11px ${t.cardStyle === 'elevated' || t.cardStyle === 'stacked' ? 4 : 11}px` };
          /* cabecera de grupo con punto en el color de la lista */
          const GroupHead = ({ name, dot, pendCount }) => {
            const col = dot || t.ink3;
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '1px 3px 10px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                <span style={{ fontFamily: t.fontDisplay, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', color: t.ink }}>{name || 'Sin lista'}</span>
                <span style={{ fontFamily: t.fontUI, fontSize: 12, fontWeight: 600, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>({pendCount})</span>
                <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${t.border}, transparent)`, marginLeft: 2 }} />
              </div>);
          };

          const pendBlock = (() => {
            if (!groupByList) return pend.length ? <div style={blockStyle}>{pend.map(renderTask)}</div> : null;
            const byList = {};
            pend.forEach((tk) => {const k = tk.list || '__none';(byList[k] = byList[k] || []).push(tk);});
            const blocks = [];
            listFilters.forEach((f) => {
              if (byList[f.id]) blocks.push(
                <div key={'g-' + f.id} style={blockStyle}>
                  <GroupHead name={f.id} dot={f.dot || LIST_DOTS[f.id]} pendCount={byList[f.id].length} />
                  {byList[f.id].map(renderTask)}
                </div>);
            });
            if (byList['__none']) blocks.push(
              <div key="g-none" style={blockStyle}>
                <GroupHead name={null} dot={null} pendCount={byList['__none'].length} />
                {byList['__none'].map(renderTask)}
              </div>);
            return blocks;
          })();

          return (
            <React.Fragment>
              {pendBlock}
              {done.length > 0 &&
              <div style={{ margin: '14px 0 8px' }}>
                  <button type="button" onClick={() => setShowDone((s) => !s)} style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer',
                    padding: '11px 15px', borderRadius: t.rInput, background: 'transparent',
                    border: `1px dashed ${t.border}`, color: t.ink3, fontFamily: t.fontUI, fontSize: 13
                  }}>
                    <span style={{ width: 17, height: 17, borderRadius: '50%', background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Ico name="check" size={11} sw={3} />
                    </span>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <b style={{ color: t.ink2, fontWeight: 650 }}>{done.length} completada{done.length === 1 ? '' : 's'}</b>
                      {!showDone && <span> — {done.slice(0, 2).map((x) => x.title).join(', ')}{done.length > 2 ? '…' : ''}</span>}
                    </span>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: t.accentInk, flexShrink: 0 }}>
                      {showDone ? 'Ocultar' : 'Mostrar'}
                      <Ico name="chevron" size={13} style={{ transform: showDone ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
                    </span>
                  </button>
                  {showDone && <div style={{ ...blockStyle, marginTop: 10 }}>{done.map(renderTask)}</div>}
                </div>
              }
            </React.Fragment>);
        })()}
        </div>
      </div>
      {isMultiMode &&
      <BulkActionBar t={t} count={selectedIds.size}
      onComplete={() => {onBulkComplete && onBulkComplete(selectedIds);clearSel();}}
      onDelete={() => {onBulkDelete && onBulkDelete(selectedIds);clearSel();}}
      onClear={clearSel} />

      }
    </React.Fragment>);

}

window.InboxView = InboxView;
window.ANTASK_DATA = ANTASK_DATA;
window.Ico = Ico;
window.Sidebar = Sidebar;
window.DropMenu = DropMenu;
window.RowStylePicker = RowStylePicker;
window.UndoToast = UndoToast;
window.antaskHexA = hexA;
window.PrioFlag = PrioFlag;
window.DetailPanel = DetailPanel;
window.DetailRail = DetailRail;
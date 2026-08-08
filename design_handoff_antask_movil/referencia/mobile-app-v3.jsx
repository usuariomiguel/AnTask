/* mobile-app.jsx — Antask en móvil (dirección cálida "tierra").
   App de teléfono clicable que reutiliza el tema, los datos y los iconos del
   rediseño de escritorio. Pantallas: Hoy · Inbox · Notas · Nota (doc. vivo) ·
   Detalle de tarea · Menú. Captura rápida como hoja deslizante con selector
   tarea/nota/consulta y sintaxis natural.
   Exporta window.MobileApp. */

/* fecha de "hoy" real — antes estaba fijada al 8-jun-2026, lo que rompía "Mover a hoy"
   (la tarea quedaba en el pasado y seguía apareciendo como vencida) */
const _mToday = new Date(); _mToday.setHours(0, 0, 0, 0);
const M_TODAY_STR = `${_mToday.getFullYear()}-${String(_mToday.getMonth() + 1).padStart(2, '0')}-${String(_mToday.getDate()).padStart(2, '0')}`;

const M_INIT_LISTS = [
  { id: 'firma', name: 'Firma Digital', color: '#c98a3c', count: '6/12', icon: 'tag' },
  { id: 'buceo', name: 'Buceo', color: '#5aa06b', count: 5, icon: 'layers' },
  { id: 'licit', name: 'Licitaciones', color: '#8a7c5e', count: 2, icon: 'grid' },
];
const M_LIST_COLORS = ['#c98a3c', '#5aa06b', '#3f8a7d', '#b0664a', '#8a7c5e', '#b58236'];
const M_LIST_ICONS = ['tag', 'layers', 'grid', 'flag'];

/* ───────── átomos móviles ───────── */
function MIco(props) { return <window.Ico {...props} />; }

function MCheck({ done, t, color, onClick, size = 22 }) {
  const c = color || t.accent;
  return (
    <button type="button" role="checkbox" aria-checked={!!done} aria-label={done ? 'Marcar como pendiente' : 'Marcar como hecha'} className="m-btn"
      onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{ width: 44, height: 44, margin: -11, flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
      <span style={{ width: size, height: size, borderRadius: t.checkRadius, display: 'grid', placeItems: 'center',
        background: done ? c : 'transparent', border: done ? 'none' : `2px solid ${t.ink3}`, color: t.accentOn, opacity: done ? 1 : 0.6 }}>
        {done && <MIco name="check" size={13} sw={3} />}
      </span>
    </button>);
}

function MPrio({ p, t }) {
  const base = window.ANTASK_PRIO[p];
  if (!base) return null;
  // en modo oscuro los fg y bg del PRIO global son demasiado oscuros — usamos variantes luminosas
  const dark = t.mode === 'dark';
  const darkOverrides = {
    alta:   { fg: '#ff8078', bg: 'rgba(255,120,112,0.18)' },
    media:  { fg: '#f5be72', bg: 'rgba(245,190,114,0.18)' },
    espera: { fg: '#c4b49a', bg: 'rgba(196,180,154,0.16)' },
    baja:   { fg: '#9ed47a', bg: 'rgba(158,212,122,0.18)' },
  };
  const c = dark ? { ...base, ...darkOverrides[p] } : base;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, padding: '2px 8px', borderRadius: t.rTag, color: c.fg, background: c.bg }}><span style={{ fontSize: 8 }}>{c.mark}</span>{c.label}</span>;
}

function MLabel({ label, lk, t }) {
  if (!label) return null; /* sin etiqueta → sin píldora (evita cápsulas vacías) */
  const c = t.tags[lk] || t.tags.slate;
  // en modo oscuro asegurar que fg tenga contraste suficiente sobre el card oscuro
  const fg = t.mode === 'dark' ? (c.fg && c.fg.startsWith('#') ? c.fg : t.ink2) : c.fg;
  return <span style={{ fontSize: 12, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI, padding: '2px 8px', borderRadius: t.rTag, color: fg, background: c.bg }}>{label}</span>;
}

/* ───────── fila deslizable (swipe actions) ───────── */
function MSwipeRow({ radius, right, left, children, hint }) {
  const [dx, setDx] = React.useState(0);
  const [drag, setDrag] = React.useState(false);
  const [hintDx, setHintDx] = React.useState(0);
  const [hintActive, setHintActive] = React.useState(false);
  const hintFired = React.useRef(false);
  React.useEffect(() => {
    if (!hint || hintFired.current || drag) return;
    if (localStorage.getItem('antask_swipe_hinted')) return;
    hintFired.current = true;
    const t1 = setTimeout(() => { setHintDx(54); setHintActive(true); }, 900);
    const t2 = setTimeout(() => { setHintDx(0); }, 1600);
    const t3 = setTimeout(() => { setHintActive(false); localStorage.setItem('antask_swipe_hinted', '1'); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [hint]);
  const s = React.useRef({ x: 0, y: 0, axis: null, on: false, moved: false, dx: 0 });
  const THRESH = 68, MAX = 128;
  const down = (e) => { s.current = { x: e.clientX, y: e.clientY, axis: null, on: true, moved: false, dx: 0 }; };
  const move = (e) => {
    const c = s.current; if (!c.on) return;
    const ax = e.clientX - c.x, ay = e.clientY - c.y;
    if (!c.axis) {
      if (Math.abs(ax) > 10 || Math.abs(ay) > 10) {
        c.axis = Math.abs(ax) > Math.abs(ay) ? 'x' : 'y';
        if (c.axis === 'x') { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} setDrag(true); }
      }
    }
    if (c.axis === 'x') {
      c.moved = true;
      let v = ax;
      if (v > 0 && !right) v *= 0.12;
      if (v < 0 && !left) v *= 0.12;
      v = Math.max(-MAX, Math.min(MAX, v));
      c.dx = v;
      setDx(v);
    }
  };
  const up = () => {
    const c = s.current; if (!c.on) return; c.on = false;
    setDrag(false);
    const v = c.dx; c.dx = 0; setDx(0);
    if (v >= THRESH && right) right.onTrigger();
    else if (v <= -THRESH && left) left.onTrigger();
  };
  const clickGuard = (e) => { if (s.current.moved) { e.stopPropagation(); s.current.moved = false; } };
  const pR = right ? Math.min(1, Math.max(0, dx) / THRESH) : 0;
  const pL = left ? Math.min(1, Math.max(0, -dx) / THRESH) : 0;
  const Action = ({ a, side, p }) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
      gap: 9, padding: side === 'left' ? '0 0 0 22px' : '0 22px 0 0', background: a.bg, color: a.fg, opacity: p > 0 ? 1 : 0 }}>
      {side === 'right' && <span style={{ fontSize: 14.5, fontWeight: 700 }}>{a.label}</span>}
      <MIco name={a.icon} size={21} sw={2.3} style={{ transform: `scale(${0.7 + 0.3 * p})`, transition: 'transform .08s' }} />
      {side === 'left' && <span style={{ fontSize: 14.5, fontWeight: 700 }}>{a.label}</span>}
    </div>);
  return (
    <div style={{ position: 'relative', borderRadius: radius, overflow: 'hidden' }}>
      {right && <Action a={right} side="left" p={pR} />}
      {left && <Action a={left} side="right" p={pL} />}
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={clickGuard}
        style={{ position: 'relative', touchAction: 'pan-y', transform: `translateX(${drag ? dx : dx + hintDx}px)`, transition: drag ? 'none' : hintActive ? 'transform .45s cubic-bezier(0.22,1,0.36,1)' : 'transform .32s cubic-bezier(0.22,1,0.36,1)' }}>
        {children}
      </div>
    </div>);
}

/* ───────── buscador ───────── */
function MSearch({ t, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 2, padding: '11px 13px', marginBottom: 13, boxShadow: '0 1px 2px rgba(40,30,15,0.04)' }}>
      <MIco name="search" size={17} sw={2} style={{ color: t.ink3, flexShrink: 0 }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: t.fontUI, fontSize: 15, color: t.ink }} />
      {value && <span onClick={() => onChange('')} style={{ cursor: 'pointer', color: t.ink3, display: 'grid', placeItems: 'center', flexShrink: 0 }}><MIco name="x" size={16} sw={2.2} /></span>}
    </div>);
}

function MEmpty({ t, icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11, padding: '52px 20px', textAlign: 'center', color: t.ink3 }}>
      <span style={{ width: 50, height: 50, borderRadius: '50%', background: t.tintBg, display: 'grid', placeItems: 'center', color: t.ink3 }}><MIco name={icon} size={23} sw={1.9} /></span>
      <div style={{ fontSize: 14.5 }}>{text}</div>
    </div>);
}

/* radio mínimo para cards estructurales — el tema Terminal baja a 2px pero en móvil
   necesitamos al menos un mínimo para que el chrome de iOS se vea nativo */
function mR(base, add = 0, floor = 8) { return Math.max(base + add, floor); }

/* capitaliza la primera letra del formato de fecha para consistencia con el header */
function mFmtDate(dt) { const s = window.antaskFmtRelative(dt); return s.charAt(0).toUpperCase() + s.slice(1); }

/* ───────── tarjeta de tarea ───────── */
function MTaskCard({ task, t, tone, onToggle, onOpen, onMoveToday, hint, onDelete, rowStyle = 'tarjetas', idx = 0, last = false }) {
  const done = !!task.done;
  const dt = task.due ? window.antaskParseDue(task.due) : null;
  const dateColor = tone === 'overdue' ? '#b0473f' : tone === 'today' ? t.accentInk : t.ink2;
  const canToday = !!onMoveToday && !done && (!dt || window.antaskDiffDays(dt) !== 0);
  const right = onDelete ? { icon: 'trash', label: 'Eliminar', bg: '#b0473f', fg: '#fff', onTrigger: () => onDelete(task.id) } : null;
  const left = canToday ? { icon: 'sun', label: 'Hoy', bg: t.accent, fg: t.accentOn, onTrigger: () => onMoveToday(task.id) } : null;
  /* modos de vista (equivalentes a los del escritorio): tarjetas · limpio · líneas · cebra */
  const card = rowStyle === 'tarjetas';
  const radius = card ? mR(t.rInput, 2, 8) : 0;
  const zebraStripe = rowStyle === 'cebra' && idx % 2 === 1;
  const zebraBg = t.zebraBg || (t.mode === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(60,40,15,0.04)');
  const rowStyleObj = {
    display: 'flex', alignItems: 'center', gap: 12,
    background: card ? t.card : zebraStripe ? zebraBg : 'transparent',
    border: card ? `1px solid ${t.border}` : 'none',
    borderBottom: rowStyle === 'lineas' && !last ? `1px solid ${t.border}` : card ? undefined : 'none',
    borderRadius: radius,
    padding: '13px 15px', position: 'relative', overflow: 'hidden',
    boxShadow: card ? '0 1px 2px rgba(40,30,15,0.05)' : 'none'
  };
  return (
    <MSwipeRow radius={radius} right={right} left={left} hint={hint}>
    <div onClick={() => onOpen && onOpen(task.id)} style={rowStyleObj}>
      <MCheck done={done} t={t} onClick={() => onToggle(task.id)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'calc(15px * var(--tm, 1))', fontWeight: 500, color: done ? t.ink3 : t.ink, lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
          {task.prio && <MPrio p={task.prio} t={t} />}
          <MLabel label={task.label} lk={task.lk} t={t} />
        </div>
      </div>
      {dt && (
        tone === 'overdue' && !done
          ? <span onClick={(e) => { e.stopPropagation(); onMoveToday(task.id); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                padding: '4px 8px', borderRadius: t.rTag, color: '#b0473f', background: 'rgba(176,71,63,0.09)', border: '1px solid rgba(176,71,63,0.25)' }}>
              {mFmtDate(dt)}<MIco name="arrowRight" size={11} sw={2.4} />
            </span>
          : <span style={{ fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, color: dateColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {mFmtDate(dt)}
            </span>
      )}
    </div>
    </MSwipeRow>);
}

function MSectionHead({ t, icon, label, count, tone }) {
  const types = window.antaskNoteTypes(t);
  const tones = { overdue: '#b0473f', today: t.accentInk, consulta: types.consulta.fg, nodate: t.ink2 };
  const c = tones[tone] || t.ink2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '22px 4px 11px' }}>
      <MIco name={icon} size={15} sw={2} style={{ color: c }} />
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', color: c }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, padding: '1px 7px', borderRadius: 999, background: tone === 'overdue' ? 'rgba(176,71,63,0.13)' : t.tintBg, color: c }}>{count}</span>
    </div>);
}

/* ───────── encabezado de pantalla (título grande) ───────── */
function MHeader({ t, title, subtitle, right }) {
  return (
    <div style={{ padding: '8px 20px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 'calc(32px * var(--tm, 1))', letterSpacing: t.titleTrack, color: t.ink, lineHeight: 1.05 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 'calc(13.5px * var(--tm, 1))', fontWeight: 500, color: t.ink2, marginTop: 4, whiteSpace: 'nowrap' }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>);
}

/* ───────── anillo «Progreso del día» (compacto, paralelo al escritorio) ───────── */
function MProgressRing({ t, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  /* anillo de 44: el diámetro interior deja sitio a «100%» sin tocar el trazo */
  const SZ = 44, R = 18, C = 2 * Math.PI * R;
  const track = t.mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  return (
    <div title={`Progreso del día · ${done} de ${total} hechas`} style={{ position: 'relative', width: SZ, height: SZ, flexShrink: 0 }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke={track} strokeWidth={4.5} />
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke={t.accent} strokeWidth={4.5} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset .5s cubic-bezier(0.45,0.05,0.2,1)' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontUI, fontSize: 10, fontWeight: 700, lineHeight: 1, color: t.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`${pct}%`}</span>
    </div>);
}

/* ───────── quick-add contextual: crea una tarea con due = hoy ───────── */
function MHoyAdd({ t, onAdd }) {
  const [v, setV] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const submit = () => { const s = v.trim(); if (!s) return; onAdd(s); setV(''); };
  const active = focused || v.length > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.card, border: `1px solid ${active ? t.accent : t.border}`, borderRadius: mR(t.rInput, 2, 10), padding: '12px 14px', marginTop: 9, boxShadow: active ? `0 0 0 3px ${t.tintBg}` : '0 1px 2px rgba(40,30,15,0.05)', transition: 'border-color .12s, box-shadow .15s' }}>
      <span style={{ color: t.accentInk, display: 'grid', placeItems: 'center', flexShrink: 0 }}><MIco name="plus" size={16} sw={2.4} /></span>
      <input value={v} onChange={(e) => setV(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') { setV(''); e.currentTarget.blur(); } }}
        placeholder="Añadir una tarea para hoy…"
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 'calc(14.5px * var(--tm, 1))', fontFamily: t.fontUI, color: t.ink }} />
      {v.trim() && <button type="button" className="m-btn" onClick={submit} onMouseDown={(e) => e.preventDefault()} style={{ minHeight: 36, padding: '6px 13px', borderRadius: 999, background: t.accent, color: t.accentOn, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Añadir</button>}
    </div>);
}

/* ───────── PANTALLA: HOY ───────── */
function MHoy({ t, tasks, linesByNote, onToggle, onOpen, onMoveToday, onMoveAll, onAdd, openNote, onDelete, rowStyle = 'tarjetas', onRowStyle }) {
  const diff = window.antaskDiffDays, parse = window.antaskParseDue, qA = window.antaskQAnswered;
  const [sheet, setSheet] = React.useState(false);
  const overdue = [], today = [], nodate = [];
  tasks.forEach((tk) => { if (!tk.due) { if (!tk.done) nodate.push(tk); return; } const d = diff(parse(tk.due)); if (d < 0 && !tk.done) overdue.push(tk); else if (d === 0) today.push(tk); });
  /* mismo modo de vista que el Inbox (Tarjetas · Limpio · Líneas · Cebra) */
  const listWrap = rowStyle === 'tarjetas' ? { display: 'flex', flexDirection: 'column', gap: 9 }
    : rowStyle === 'limpio' ? { display: 'flex', flexDirection: 'column', gap: 2 }
    : { display: 'flex', flexDirection: 'column', background: t.card, border: `1px solid ${t.border}`, borderRadius: mR(t.rInput, 2, 10), overflow: 'hidden', boxShadow: '0 1px 2px rgba(40,30,15,0.05)' };
  const byDue = (a, b) => parse(a.due) - parse(b.due);
  overdue.sort(byDue); today.sort(byDue);
  const notesById = {}; (window.NOTES_DATA || []).forEach((n) => notesById[n.id] = n);
  const consultas = []; /* Notas deshabilitadas — no se exponen consultas (cierra el único acceso vivo al detalle de nota) */
  const hoyDone = today.filter((x) => x.done).length;
  const types = window.antaskNoteTypes(t);
  const allClear = !overdue.length && !today.length && !consultas.length;
  const viewSections = [{ heading: 'Modo de vista', options: M_ROWSTYLES.map((r) => ({ icon: r.icon, label: r.label, active: rowStyle === r.id, onClick: () => onRowStyle && onRowStyle(r.id) })) }];
  return (
    <div>
      {onRowStyle && !allClear &&
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 }}>
        <span onClick={() => setSheet(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', userSelect: 'none', color: t.ink2, background: t.card, border: `1px solid ${t.border}` }}>
          <MIco name={M_ROWSTYLE_MAP[rowStyle].icon} size={15} sw={2} />
          <span>{M_ROWSTYLE_MAP[rowStyle].label}</span>
          <MIco name="chevron" size={13} sw={2} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
        </span>
      </div>}
      {allClear &&
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11, padding: '60px 20px', textAlign: 'center', color: t.ink3 }}>
        <span style={{ width: 54, height: 54, borderRadius: '50%', background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk }}><MIco name="check2" size={26} /></span>
        <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 19, color: t.ink2 }}>Todo al día</div>
        <div style={{ fontSize: 14, maxWidth: 280 }}>No tienes nada vencido ni ninguna tarea para hoy.</div>
      </div>}
      {allClear && onAdd && <MHoyAdd t={t} onAdd={onAdd} />}
      {overdue.length > 0 && <React.Fragment>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MSectionHead t={t} icon="flag" label="Vencidas" count={overdue.length} tone="overdue" />
          <span onClick={onMoveAll} style={{ marginRight: 4, fontSize: 12.5, fontWeight: 650, color: '#b0473f', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '6px 2px', userSelect: 'none' }}><MIco name="arrowRight" size={13} sw={2.2} />Todas a hoy</span>
        </div>
        <div style={listWrap}>{overdue.map((tk, i) => <MTaskCard key={tk.id} task={tk} t={t} tone="overdue" onToggle={onToggle} onOpen={onOpen} onMoveToday={onMoveToday} hint={i === 0} onDelete={onDelete} rowStyle={rowStyle} idx={i} last={i === overdue.length - 1} />)}</div>
      </React.Fragment>}
      {today.length > 0 && <React.Fragment>
        <MSectionHead t={t} icon="sun" label="Para hoy" count={`${hoyDone}/${today.length}`} tone="today" />
        <div style={listWrap}>{today.map((tk, i) => <MTaskCard key={tk.id} task={tk} t={t} tone="today" onToggle={onToggle} onOpen={onOpen} onMoveToday={onMoveToday} hint={overdue.length === 0 && i === 0} onDelete={onDelete} rowStyle={rowStyle} idx={i} last={i === today.length - 1} />)}</div>
        {onAdd && <MHoyAdd t={t} onAdd={onAdd} />}
      </React.Fragment>}
      {!allClear && today.length === 0 && onAdd && <MHoyAdd t={t} onAdd={onAdd} />}
      {nodate.length > 0 && <React.Fragment>
        <MSectionHead t={t} icon="inbox" label="Sin fecha · sugeridas" count={nodate.length} tone="nodate" />
        <div style={listWrap}>{nodate.map((tk, i) => <MTaskCard key={tk.id} task={tk} t={t} tone="nodate" onToggle={onToggle} onOpen={onOpen} onMoveToday={onMoveToday} onDelete={onDelete} rowStyle={rowStyle} idx={i} last={i === nodate.length - 1} />)}</div>
      </React.Fragment>}
      {consultas.length > 0 && <React.Fragment>
        <MSectionHead t={t} icon="help" label="Consultas pendientes" count={consultas.length} tone="consulta" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {consultas.map((it, i) =>
          <div key={i} onClick={() => openNote(it.noteId)} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 2, padding: '13px 15px', position: 'relative', overflow: 'hidden', boxShadow: '0 1px 2px rgba(40,30,15,0.05)' }}>
            <MIco name="help" size={17} sw={1.9} style={{ color: types.consulta.fg, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: types.consulta.fg, lineHeight: 1.35 }}>{it.text}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: t.ink3 }}><MIco name="note" size={12} sw={2} /><span style={{ fontSize: 12, fontWeight: 550 }}>{it.note.title}</span></div>
            </div>
            <MIco name="chevron" size={15} style={{ color: t.ink3, flexShrink: 0, marginTop: 2 }} />
          </div>)}
        </div>
      </React.Fragment>}
      {sheet && <MPickSheet t={t} title="Modo de vista" sections={viewSections} onClose={() => setSheet(false)} />}
    </div>);
}
/* ───────── HOJA DE OPCIONES (filtros / modo de vista) ───────── */
function MPickSheet({ t, title, sections, onClose }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,14,6,0.42)', animation: 'mFade .2s ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: t.canvas, borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', animation: 'mSheet .26s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: t.border, margin: '9px auto 2px' }} />
        <div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 18, color: t.ink, textAlign: 'center', padding: '6px 0 8px' }}>{title}</div>
        <div style={{ padding: '0 12px 8px' }}>
          {sections.map((sec, si) => (
            <div key={si}>
              {sec.heading &&
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.ink3, margin: si === 0 ? '6px 6px 4px' : '14px 6px 4px' }}>{sec.heading}</div>}
              {sec.options.map((o) => (
                <div key={o.label} onClick={() => { o.onClick(); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 10px', borderRadius: mR(t.rInput, 0, 10), cursor: 'pointer',
                    background: o.active ? t.tintBg : 'transparent', transition: 'background .12s' }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 26, color: o.active ? t.accentInk : t.ink2, flexShrink: 0 }}><MIco name={o.icon} size={19} sw={1.9} /></span>
                  <span style={{ flex: 1, fontSize: 15.5, fontWeight: o.active ? 650 : 500, color: o.active ? t.accentInk : t.ink }}>{o.label}</span>
                  {o.active && <MIco name="check2" size={18} sw={2.4} style={{ color: t.accentInk, flexShrink: 0 }} />}
                </div>))}
            </div>))}
        </div>
        <div style={{ height: 'max(14px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>);
}

/* etiquetas e iconos de los modos de vista (paralelos al escritorio) */
const M_ROWSTYLES = [
  { id: 'tarjetas', label: 'Tarjetas', icon: 'grid' },
  { id: 'limpio', label: 'Limpio', icon: 'align' },
  { id: 'lineas', label: 'Líneas', icon: 'list' },
  { id: 'cebra', label: 'Cebra', icon: 'layers' },
];
const M_ROWSTYLE_MAP = M_ROWSTYLES.reduce((m, r) => (m[r.id] = r, m), {});
const M_FIXED_LABEL = { pendientes: 'Pendientes', completadas: 'Completadas', vencidas: 'Vencidas', hoy: 'Hoy', 'sin-fecha': 'Sin fecha', 'alta-prio': 'Alta prioridad', 'con-nota': 'Con nota' };

/* ───────── PANTALLA: INBOX ───────── */
function MInbox({ t, tasks, lists, onToggle, onOpen, onMoveToday, activeList, onActiveList, onDelete, rowStyle = 'tarjetas', onRowStyle }) {
  const [q, setQ] = React.useState('');
  const [ff, setFf] = React.useState('Todas'); /* filtro fijo (Filtrar) */
  const [sheet, setSheet] = React.useState(null); /* null | 'filter' | 'view' */
  const chooseRow = (id) => onRowStyle && onRowStyle(id);

  const norm = (s) => (s || '').toLowerCase();
  const diff = window.antaskDiffDays, parse = window.antaskParseDue;
  const matchQ = (x) => !q.trim() || norm(x.title).includes(norm(q)) || norm(x.label || x.list).includes(norm(q));
  const byList = activeList ? tasks.filter((x) => (x.label || x.list) === activeList) : tasks;
  const applyFixed = (arr) => {
    switch (ff) {
      case 'pendientes': return arr.filter((x) => !x.done);
      case 'completadas': return arr.filter((x) => x.done);
      case 'vencidas': return arr.filter((x) => x.due && !x.done && diff(parse(x.due)) < 0);
      case 'hoy': return arr.filter((x) => x.due && diff(parse(x.due)) === 0);
      case 'sin-fecha': return arr.filter((x) => !x.due);
      case 'alta-prio': return arr.filter((x) => x.prio === 'alta');
      case 'con-nota': return arr.filter((x) => !!x.origin);
      default: return arr;
    }
  };
  const base = applyFixed(byList).filter(matchQ);
  const isFixed = ff !== 'Todas';
  const splitDone = ff === 'Todas'; /* sólo separamos «Completadas» cuando no hay filtro fijo */
  const pend = splitDone ? base.filter((x) => !x.done) : base;
  const done = splitDone ? base.filter((x) => x.done) : [];
  const groupByList = !isFixed && !activeList; /* agrupar por lista como en la v1 de escritorio */
  const [showDone, setShowDone] = React.useState(false);

  /* listas presentes en las tareas → chips (color de la lista si existe) */
  const listNames = React.useMemo(() => {
    const seen = new Set(), out = [];
    tasks.forEach((tk) => { const n = tk.label || tk.list; if (n && !seen.has(n)) { seen.add(n); out.push(n); } });
    return out;
  }, [tasks]);
  const listColor = (name) => {
    const l = (lists || []).find((x) => x.name === name);
    if (l) return l.color;
    const tk = tasks.find((x) => (x.label || x.list) === name && x.lk);
    if (tk && t.tags[tk.lk]) return t.tags[tk.lk].fg || t.tags[tk.lk].bg;
    return t.accentInk;
  };
  const setList = (name) => onActiveList && onActiveList(activeList === name ? null : name);

  /* hojas de opciones */
  const filterSections = [
    { heading: 'Estado', options: [
      { icon: 'circle', label: 'Pendientes', active: ff === 'pendientes', onClick: () => setFf(ff === 'pendientes' ? 'Todas' : 'pendientes') },
      { icon: 'check', label: 'Completadas', active: ff === 'completadas', onClick: () => setFf(ff === 'completadas' ? 'Todas' : 'completadas') }] },
    { heading: 'Tiempo', options: [
      { icon: 'flag', label: 'Vencidas', active: ff === 'vencidas', onClick: () => setFf(ff === 'vencidas' ? 'Todas' : 'vencidas') },
      { icon: 'sun', label: 'Hoy', active: ff === 'hoy', onClick: () => setFf(ff === 'hoy' ? 'Todas' : 'hoy') },
      { icon: 'calendar', label: 'Sin fecha', active: ff === 'sin-fecha', onClick: () => setFf(ff === 'sin-fecha' ? 'Todas' : 'sin-fecha') }] },
    { heading: 'Atributos', options: [
      { icon: 'flag', label: 'Alta prioridad', active: ff === 'alta-prio', onClick: () => setFf(ff === 'alta-prio' ? 'Todas' : 'alta-prio') },
      { icon: 'note', label: 'Con nota', active: ff === 'con-nota', onClick: () => setFf(ff === 'con-nota' ? 'Todas' : 'con-nota') }] },
  ];
  const viewSections = [{ heading: 'Modo de vista', options: M_ROWSTYLES.map((r) => ({ icon: r.icon, label: r.label, active: rowStyle === r.id, onClick: () => chooseRow(r.id) })) }];

  /* estilos de la lista según el modo de vista */
  const listWrap = rowStyle === 'tarjetas' ? { display: 'flex', flexDirection: 'column', gap: 9 }
    : rowStyle === 'limpio' ? { display: 'flex', flexDirection: 'column', gap: 2 }
    : { display: 'flex', flexDirection: 'column', background: t.card, border: `1px solid ${t.border}`, borderRadius: mR(t.rInput, 2, 10), overflow: 'hidden', boxShadow: '0 1px 2px rgba(40,30,15,0.05)' };
  const renderRows = (arr, offset = 0) => arr.map((tk, i) =>
    <MTaskCard key={tk.id} task={tk} t={t} tone="plain" onToggle={onToggle} onOpen={onOpen} onMoveToday={onMoveToday} onDelete={onDelete}
      rowStyle={rowStyle} idx={offset + i} last={i === arr.length - 1} />);

  /* cabecera de grupo: punto de color + nombre + conteo (paralelo a la v1 de escritorio) */
  const GroupHead = ({ name, dot, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '20px 4px 9px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot || t.ink3, flexShrink: 0 }} />
      <span style={{ fontFamily: t.fontDisplay, fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', color: t.ink }}>{name || 'Sin lista'}</span>
      <span style={{ fontFamily: t.fontMono, fontSize: 12, fontWeight: 600, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      <span style={{ flex: 1, height: 1, background: t.border, marginLeft: 2 }} />
    </div>);

  /* bloque de pendientes: agrupado por lista o plano */
  const pendBlock = (() => {
    if (!groupByList) return <div style={listWrap}>{renderRows(pend)}</div>;
    const byGroup = {};
    pend.forEach((tk) => { const k = tk.label || tk.list || '__none'; (byGroup[k] = byGroup[k] || []).push(tk); });
    const order = [...listNames.filter((n) => byGroup[n]), ...(byGroup['__none'] ? ['__none'] : [])];
    let off = 0;
    return order.map((k) => {
      const arr = byGroup[k];
      const block = (
        <div key={'g-' + k}>
          <GroupHead name={k === '__none' ? null : k} dot={k === '__none' ? null : listColor(k)} count={arr.length} />
          <div style={listWrap}>{renderRows(arr, off)}</div>
        </div>);
      off += arr.length;
      return block;
    });
  })();

  const pillBase = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', userSelect: 'none', transition: 'all .12s' };

  return (
    <div>
      <MSearch t={t} value={q} onChange={setQ} placeholder="Buscar tareas…" />

      {/* barra de filtros y vista */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
        {/* Filtrar */}
        <span onClick={() => setSheet('filter')} style={{ ...pillBase,
          color: isFixed ? t.accentInk : t.ink2,
          background: isFixed ? t.tintBg : t.card,
          border: `1px solid ${isFixed ? t.accentInk + '55' : t.border}` }}>
          <MIco name="filter" size={14} sw={2} />
          <span>{isFixed ? M_FIXED_LABEL[ff] : 'Filtrar'}</span>
          {isFixed
            ? <span onClick={(e) => { e.stopPropagation(); setFf('Todas'); }} style={{ display: 'flex', marginLeft: 1, opacity: 0.8 }}><MIco name="x" size={14} sw={2.2} /></span>
            : <MIco name="chevron" size={13} sw={2} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />}
        </span>
        <span style={{ flex: 1 }} />
        {/* Modo de vista */}
        <span onClick={() => setSheet('view')} style={{ ...pillBase, color: t.ink2, background: t.card, border: `1px solid ${t.border}` }}>
          <MIco name={M_ROWSTYLE_MAP[rowStyle].icon} size={15} sw={2} />
          <span>{M_ROWSTYLE_MAP[rowStyle].label}</span>
          <MIco name="chevron" size={13} sw={2} style={{ transform: 'rotate(90deg)', opacity: 0.7 }} />
        </span>
      </div>

      {/* chips de listas */}
      {listNames.length > 0 &&
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 9, WebkitOverflowScrolling: 'touch' }}>
          {[{ name: 'Todas', dot: null }, ...listNames.map((n) => ({ name: n, dot: listColor(n) }))].map((c) => {
            const on = c.name === 'Todas' ? !activeList : activeList === c.name;
            return (
              <span key={c.name} onClick={() => c.name === 'Todas' ? onActiveList && onActiveList(null) : setList(c.name)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0, fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: on ? t.tintBg : 'transparent', color: on ? t.accentInk : t.ink2, border: `1px solid ${on ? t.accentInk + '44' : t.border}`, transition: 'all .12s' }}>
                {c.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />}
                {c.name}
              </span>);
          })}
        </div>}

      {pend.length === 0 && done.length === 0 &&
        <MEmpty t={t} icon={q.trim() ? 'search' : 'check2'} text={q.trim() ? `Sin resultados para “${q}”` : isFixed || activeList ? 'Sin tareas para este filtro.' : 'Bandeja vacía. ¡Buen trabajo!'} />}

      {pend.length > 0 && pendBlock}
      {done.length > 0 && <React.Fragment>
        <div onClick={() => setShowDone((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 9, margin: '22px 4px 9px', cursor: 'pointer', userSelect: 'none' }}>
          <MIco name="check2" size={15} sw={2} style={{ color: t.ink2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.ink2 }}>Completadas</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, padding: '1px 7px', borderRadius: 999, background: t.tintBg, color: t.ink2 }}>{done.length}</span>
          <span style={{ flex: 1 }} />
          <MIco name="chevron" size={16} sw={2} style={{ color: t.ink3, transform: showDone ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .18s' }} />
        </div>
        {showDone && <div style={listWrap}>{renderRows(done)}</div>}
      </React.Fragment>}

      {sheet === 'filter' && <MPickSheet t={t} title="Filtrar" sections={filterSections} onClose={() => setSheet(null)} />}
      {sheet === 'view' && <MPickSheet t={t} title="Modo de vista" sections={viewSections} onClose={() => setSheet(null)} />}
    </div>);
}

/* ───────── PANTALLA: NOTAS (lista) ───────── */
function MNotas({ t, notes, linesByNote, openNote, onOptions }) {
  const [q, setQ] = React.useState('');
  const types = window.antaskNoteTypes(t);
  const eff = (n) => {
    const ls = linesByNote[n.id] || [];
    const openQ = ls.some((l) => l.kind === 'consulta' && !window.antaskQAnswered(l));
    const openT = ls.some((l) => l.kind === 'tarea' && !l.done);
    return openQ ? 'consulta' : openT ? 'tarea' : 'nota';
  };
  const norm = (s) => (s || '').toLowerCase();
  const visible = notes.filter((n) => {
    if (!q.trim()) return true;
    const ls = linesByNote[n.id] || [];
    return norm(n.title).includes(norm(q)) || norm(n.body).includes(norm(q)) || norm(n.list).includes(norm(q)) || ls.some((l) => norm(l.text).includes(norm(q)));
  });
  const ordered = [...visible].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0));
  return (
    <div>
      <MSearch t={t} value={q} onChange={setQ} placeholder="Buscar notas…" />
      {visible.length === 0 && <MEmpty t={t} icon="search" text={`Sin resultados para “${q}”`} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ordered.map((n) => {
        const ls = linesByNote[n.id] || [];
        const m = types[eff(n)];
        const openT = ls.filter((l) => l.kind === 'tarea' && !l.done).length;
        const q = ls.filter((l) => l.kind === 'consulta' && !window.antaskQAnswered(l)).length;
        return (
          <div key={n.id} onClick={() => openNote(n.id)} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: mR(t.rInput, 2, 8), padding: '14px 15px', boxShadow: '0 1px 2px rgba(40,30,15,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, padding: '3px 8px 3px 7px', borderRadius: t.rTag, color: m.fg, background: m.bg }}><MIco name={m.icon} size={11} sw={2} />{m.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: t.ink2 }}>{n.pin && <MIco name="pin" size={13} />}<span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: t.fontMono }}>{n.date}</span><span onClick={(e) => { e.stopPropagation(); onOptions && onOptions(n.id); }} aria-label="Opciones de la nota" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, margin: '-5px -7px -5px 1px', borderRadius: 7, cursor: 'pointer', color: t.ink3 }}><MIco name="ellipsis" size={17} /></span></span>
            </div>
            <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'calc(16px * var(--tm, 1))', lineHeight: 1.3, color: t.ink, marginTop: 10 }}>{n.title}</div>
            <div style={{ fontSize: 'calc(13px * var(--tm, 1))', lineHeight: 1.5, color: t.ink2, marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ls[0] ? ls[0].text : n.body}</div>
            {(openT > 0 || q > 0 || n.list) &&
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 11 }}>
              {n.list && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: t.ink2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: t.ink3 }} />{n.list}</span>}
              <span style={{ flex: 1 }} />
              {openT > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, color: types.tarea.fg }}><MIco name="check" size={12} sw={2.5} />{openT}</span>}
              {q > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, color: types.consulta.fg }}><MIco name="help" size={12} />{q}</span>}
            </div>}
          </div>);
      })}
      </div>
    </div>);
}

/* ───────── PANTALLA: NOTA (documento vivo) ───────── */
function MNoteDetail({ t, note, lines, onToggleLine, onSetLineKind }) {
  const types = window.antaskNoteTypes(t);
  const [editLine, setEditLine] = React.useState(null);
  const KINDS = ['tarea', 'nota', 'consulta'];
  return (
    <div style={{ padding: '4px 4px 10px' }}>
      {note.list && <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: t.ink3 }} /><span style={{ fontSize: 13, fontWeight: 600, color: t.ink3 }}>{note.list}</span></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {lines.map((l) => {
          const answered = l.kind === 'consulta' && !!(l.answer && l.answer.trim());
          const lineKind = l.kind === 'text' ? 'nota' : l.kind;
          const m = types[lineKind];
          const editing = editLine === l.id;
          return (
            <div key={l.id} style={{ borderRadius: t.rInput, background: editing ? t.tintBg : 'transparent', transition: 'background .15s', margin: editing ? '2px -8px' : 0, padding: editing ? '2px 8px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '8px 0' }}>
              <span style={{ width: 24, flexShrink: 0, marginTop: 2, display: 'grid', placeItems: 'center' }}>
                {l.kind === 'tarea' && <MCheck done={l.done} t={t} size={20} onClick={() => onToggleLine(note.id, l.id)} />}
                {l.kind === 'consulta' && <MIco name={answered ? 'check' : 'help'} size={answered ? 16 : 19} sw={answered ? 2.4 : 1.9} style={{ color: answered ? t.ink3 : m.fg }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span onClick={() => setEditLine(editing ? null : l.id)} style={{ cursor: 'pointer', fontSize: 'calc(16px * var(--tm, 1))', lineHeight: 1.5, fontFamily: l.kind === 'text' ? "'Newsreader', Georgia, serif" : t.fontUI,
                  color: l.kind === 'tarea' && l.done ? t.ink3 : l.kind === 'consulta' ? answered ? t.ink3 : m.fg : t.ink,
                  textDecoration: l.kind === 'tarea' && l.done ? 'line-through' : 'none' }}>{l.text}</span>
                {answered && <div style={{ marginTop: 6, paddingLeft: 11, borderLeft: `2px solid ${m.fg}`, fontSize: 14.5, lineHeight: 1.45, fontFamily: "'Newsreader', Georgia, serif", color: t.ink2 }}>{l.answer}</div>}
                {l.kind === 'consulta' && !answered && <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: m.fg, fontFamily: t.fontMono }}>pendiente de responder</div>}
                {editing && <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 4 }}>
                  {KINDS.map((k) => {
                    const tm = types[k], on = k === lineKind;
                    return (
                      <span key={k} onClick={() => { onSetLineKind(note.id, l.id, k === 'nota' ? 'text' : k); setEditLine(null); }}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 650, padding: '8px 0', borderRadius: t.rInput, cursor: 'pointer',
                          color: on ? tm.fg : t.ink2, background: on ? tm.bg : t.card, border: `1px solid ${on ? 'transparent' : t.border}`, transition: 'all .12s' }}>
                        <MIco name={tm.icon} size={14} sw={2} />{tm.label}
                      </span>);
                  })}
                </div>}
              </div>
              {/* badge de tipo — affordance visual de que la línea es editable */}
              {!editing && <span onClick={() => setEditLine(l.id)}
                style={{ flexShrink: 0, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: t.rTag, cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, color: m.fg, background: m.bg, opacity: 0.75, transition: 'opacity .12s' }}>
                <MIco name={m.icon} size={10} sw={2} />{m.label}
              </span>}
            </div>
            </div>);
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', color: t.ink3 }}>
          <span style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 18 }}>+</span>
          <span style={{ fontSize: 15, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>Añade otra línea…</span>
        </div>
      </div>
    </div>);
}

/* ───────── PANTALLA: DETALLE DE TAREA ───────── */
function MTaskDetail({ t, task, lists, titleRef, onToggle, onMoveToday, onDelete, onUpdate, onNewList }) {
  const dt = task.due ? window.antaskParseDue(task.due) : null;
  const [openField, setOpenField] = React.useState(null);
  const [title, setTitle] = React.useState(task.title);
  React.useEffect(() => { setTitle(task.title); setOpenField(null); }, [task.id]);
  const upd = (patch) => onUpdate && onUpdate(task.id, patch);
  const commitTitle = () => { const v = (title || '').trim(); if (v && v !== task.title) upd({ title: v }); else if (!v) setTitle(task.title); };
  const isoOff = (n) => { const r = new Date(); r.setHours(0, 0, 0, 0); r.setDate(r.getDate() + n); return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`; };
  const dateOpts = [{ key: isoOff(0), label: 'Hoy' }, { key: isoOff(1), label: 'Mañana' }, { key: isoOff(7), label: 'En 1 semana' }, { key: null, label: 'Sin fecha' }];
  const prioOpts = [{ key: 'alta', label: 'Alta' }, { key: 'media', label: 'Media' }, { key: 'baja', label: 'Baja' }, { key: null, label: 'Ninguna' }];
  const prioColor = (k) => {
    const base = (window.ANTASK_PRIO || {})[k];
    if (!base) return null;
    const ov = { alta: { fg: '#ff8078', bg: 'rgba(255,120,112,0.18)' }, media: { fg: '#f5be72', bg: 'rgba(245,190,114,0.18)' }, baja: { fg: '#9ed47a', bg: 'rgba(158,212,122,0.18)' } };
    return t.mode === 'dark' ? { ...base, ...(ov[k] || {}) } : base;
  };
  const listOpts = (lists || []).map((l) => ({ key: l.name, label: l.name }));
  const toggleField = (f) => setOpenField((cur) => cur === f ? null : f);

  const Field = ({ icon, label, children, field }) => (
    <div onClick={() => toggleField(field)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }}>
      <MIco name={icon} size={17} sw={1.9} style={{ color: t.ink3, flexShrink: 0 }} />
      <span style={{ fontSize: 14.5, color: t.ink2, flex: 1 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}<MIco name="chevron" size={14} sw={2} style={{ color: t.ink3, transform: openField === field ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} /></span>
    </div>);

  const OptRow = ({ opts, active, onPick }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg }}>
      {opts.map((o) => {
        const on = active === o.key;
        return (
          <span key={String(o.key)} onClick={(e) => { e.stopPropagation(); onPick(o.key); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
              color: on ? t.accentOn : t.ink2, background: on ? t.accent : t.card, border: `1px solid ${on ? t.accent : t.border}` }}>
            {o.label}
          </span>);
      })}
    </div>);

  return (
    <div style={{ padding: '4px 0 10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '4px 4px 18px' }}>
        <MCheck done={task.done} t={t} onClick={() => onToggle(task.id)} size={24} />
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
          rows={1} aria-label="Título de la tarea"
          style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', padding: 0, overflow: 'hidden',
            fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'calc(22px * var(--tm, 1))', lineHeight: 1.25,
            color: task.done ? t.ink3 : t.ink, textDecoration: task.done ? 'line-through' : 'none' }}
          ref={(el) => { if (titleRef) titleRef.current = el; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} />
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: mR(t.rInput, 4, 14), overflow: 'hidden' }}>
        <Field icon="calendar" label="Fecha" field="fecha">
          {dt
            ? (window.antaskDiffDays(dt) < 0
                ? <span onClick={(e) => { e.stopPropagation(); onMoveToday(task.id); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, fontFamily: t.fontMono, cursor: 'pointer',
                      padding: '5px 10px', borderRadius: t.rTag, color: '#b0473f', background: 'rgba(176,71,63,0.09)', border: '1px solid rgba(176,71,63,0.25)' }}>
                    {mFmtDate(dt)}<MIco name="arrowRight" size={12} sw={2.4} />
                  </span>
                : <span style={{ fontSize: 14, fontWeight: 650, fontFamily: t.fontMono, color: window.antaskDiffDays(dt) === 0 ? t.accentInk : t.ink }}>{mFmtDate(dt)}</span>)
            : <span style={{ fontSize: 14, color: t.ink3 }}>Sin fecha</span>}
        </Field>
        {openField === 'fecha' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg }}>
            {dateOpts.map((o) => {
              const on = (task.due || null) === o.key;
              return (
                <span key={String(o.key)} onClick={(e) => { e.stopPropagation(); upd({ due: o.key || undefined }); setOpenField(null); }}
                  style={{ fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', color: on ? t.accentOn : t.ink2, background: on ? t.accent : t.card, border: `1px solid ${on ? t.accent : t.border}` }}>{o.label}</span>);
            })}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', color: t.ink2, background: t.card, border: `1px solid ${t.border}`, position: 'relative' }}>
              <MIco name="calendar" size={14} sw={2} />Personalizada
              <input type="date" value={task.due || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => { if (e.target.value) { upd({ due: e.target.value }); setOpenField(null); } }}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            </label>
          </div>)}
        <Field icon="flag" label="Prioridad" field="prio">{task.prio ? <MPrio p={task.prio} t={t} /> : <span style={{ fontSize: 14, color: t.ink3 }}>Ninguna</span>}</Field>
        {openField === 'prio' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg }}>
            {prioOpts.map((o) => {
              const on = (task.prio || null) === o.key;
              const c = o.key ? prioColor(o.key) : null;
              const fg = c ? c.fg : t.ink2;
              const bg = c ? c.bg : t.card;
              return (
                <span key={String(o.key)} onClick={(e) => { e.stopPropagation(); upd({ prio: o.key }); setOpenField(null); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                    color: fg, background: bg, border: `1.5px solid ${on ? fg : 'transparent'}` }}>
                  {c && <span style={{ fontSize: 8 }}>{c.mark}</span>}{o.label}
                </span>);
            })}
          </div>)}
        <Field icon="inbox" label="Lista" field="lista">{task.label ? <MLabel label={task.label} lk={task.lk} t={t} /> : <span style={{ fontSize: 14, color: t.ink3 }}>Sin lista</span>}</Field>
        {openField === 'lista' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.inputBg }}>
            {listOpts.map((o) => {
              const on = (task.label || null) === o.key;
              return (
                <span key={String(o.key)} onClick={(e) => { e.stopPropagation(); upd({ label: o.key }); setOpenField(null); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                    color: on ? t.accentOn : t.ink2, background: on ? t.accent : t.card, border: `1px solid ${on ? t.accent : t.border}` }}>{o.label}</span>);
            })}
            {onNewList && <span onClick={(e) => { e.stopPropagation(); setOpenField(null); onNewList(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 650, padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                color: t.accentInk, background: t.card, border: `1px dashed ${t.border}` }}>
              <MIco name="plus" size={14} sw={2.4} />Nueva lista
            </span>}
          </div>)}
      </div>
      {onDelete && <button type="button" onClick={() => onDelete(task.id)}
        style={{ marginTop: 24, width: '100%', padding: '14px', borderRadius: mR(t.rInput, 4, 14), border: '1px solid rgba(176,71,63,0.30)', background: 'rgba(176,71,63,0.07)', cursor: 'pointer', font: 'inherit',
          fontSize: 15, fontWeight: 650, fontFamily: t.fontUI, color: '#b0473f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
        <MIco name="trash" size={17} sw={2} />Eliminar tarea
      </button>}
    </div>);
}

/* ───────── PANTALLA: MENÚ ───────── */
function MMenu({ t, go, onSettings, lists, onNewList, onEditList, onDeleteList, counts, onListClick, v1 }) {
  const c = counts || {};
  const Group = ({ children }) => <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: mR(t.rInput, 4, 14), overflow: 'hidden', marginBottom: 18 }}>{children}</div>;
  const Row = ({ icon, label, count, color, onClick, last, onEdit, locked }) => (
    <div onClick={locked ? undefined : onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', cursor: locked ? 'default' : 'pointer', background: t.card, borderBottom: last ? 'none' : `1px solid ${t.border}`, opacity: locked ? 0.5 : 1 }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: (color || t.accent), display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}><MIco name={icon} size={16} sw={2} /></span>
      <span style={{ flex: 1, fontSize: 15.5, fontWeight: 500, color: t.ink }}>{label}</span>
      {locked
        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 650, color: t.ink3 }}>Pronto<MIco name="lock" size={15} /></span>
        : <React.Fragment>
            {count != null && <span style={{ fontSize: 13, fontWeight: 600, fontFamily: t.fontMono, color: t.ink3 }}>{count}</span>}
            {onEdit
              ? <button type="button" className="m-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }} aria-label="Editar lista" style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, marginRight: -12, marginTop: -7, marginBottom: -7, borderRadius: 8, color: t.ink3, cursor: 'pointer' }}><MIco name="settings" size={17} /></button>
              : <MIco name="chevron" size={15} style={{ color: t.ink3 }} />}
          </React.Fragment>}
    </div>);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '6px 6px 20px' }}>
        <span style={{ width: 52, height: 52, borderRadius: 15, overflow: 'hidden', flexShrink: 0, display: 'block', border: `1.5px solid ${t.border}` }}>
          <image-slot id="antask-avatar" shape="rounded" radius="14" style={{ width: '52px', height: '52px', display: 'block' }} placeholder="👤" fit="cover" />
        </span>
        <div><div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 19, color: t.ink }}>miguel cantos</div><div style={{ fontSize: 13, color: t.accentInk, fontWeight: 600 }}>Sincronizado</div></div>
      </div>
      <Group>
        <Row icon="calendar" label="Hoy" count={c.hoy} color="#c98a3c" onClick={() => go('hoy')} />
        <Row icon="inbox" label="Inbox" count={c.inbox} onClick={() => go('inbox')} last={!!v1} />
        {!v1 && <Row icon="note" label="Notas" color="#6f7a3d" locked last />}
      </Group>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 9px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.ink2 }}>Listas</span>
        <span onClick={onNewList} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 650, color: t.accentInk, cursor: 'pointer', padding: '2px 4px' }}><MIco name="plus" size={15} sw={2.4} />Nueva lista</span>
      </div>
      <Group>
        {lists.length === 0
          ? <div onClick={onNewList} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px', cursor: 'pointer', color: t.ink3 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px dashed ${t.ink3}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}><MIco name="plus" size={15} sw={2.2} /></span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>Crear tu primera lista</span>
            </div>
          : lists.map((l, i) =>
            <MSwipeRow key={l.id} radius={0}
              right={{ icon: 'settings', label: 'Editar', bg: t.accent, fg: t.accentOn, onTrigger: () => onEditList(l) }}
              left={{ icon: 'trash', label: 'Eliminar', bg: '#b0473f', fg: '#fff', onTrigger: () => onDeleteList(l.id) }}>
              <Row icon={l.icon} label={l.name} count={l.count} color={l.color} onEdit={() => onEditList(l)} onClick={() => onListClick && onListClick(l.name)} last={i === lists.length - 1} />
            </MSwipeRow>)}
      </Group>
      <Group>
        <Row icon="settings" label="Ajustes" onClick={() => onSettings()} last />
      </Group>
    </div>);
}

/* ───────── HOJA: NUEVA / EDITAR LISTA ───────── */
function MListSheet({ t, initial, onClose, onSave }) {
  const editing = !!initial;
  const [name, setName] = React.useState(initial ? initial.name : '');
  const [color, setColor] = React.useState(initial ? initial.color : M_LIST_COLORS[0]);
  const [icon, setIcon] = React.useState(initial ? initial.icon : 'tag');
  const valid = name.trim().length > 0;
  const Label = ({ children }) => <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink2, margin: '14px 2px 9px' }}>{children}</div>;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,14,6,0.42)', animation: 'mFade .2s ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: t.canvas, borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', animation: 'mSheet .26s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: t.border, margin: '9px auto 2px' }} />
        <div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 18, color: t.ink, textAlign: 'center', padding: '6px 0 4px' }}>{editing ? 'Editar lista' : 'Nueva lista'}</div>
        <div style={{ padding: '6px 16px 14px' }}>
          {/* nombre con preview de color/icono */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: t.card, border: `1.5px solid ${color}`, borderRadius: t.rInput + 2 }}>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: color, display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}><MIco name={icon} size={17} sw={2} /></span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la lista"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: t.fontUI, fontSize: 16, fontWeight: 600, color: t.ink }} />
          </div>

          <Label>Color</Label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {M_LIST_COLORS.map((c) => (
              <span key={c} onClick={() => setColor(c)} style={{ width: 34, height: 34, borderRadius: '50%', background: c, cursor: 'pointer', display: 'grid', placeItems: 'center',
                boxShadow: color === c ? `0 0 0 2px ${t.canvas}, 0 0 0 4px ${c}` : 'none', transition: 'box-shadow .12s' }}>
                {color === c && <MIco name="check2" size={16} style={{ color: '#fff' }} />}
              </span>))}
          </div>

          <Label>Icono</Label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {M_LIST_ICONS.map((ic) => {
              const on = ic === icon;
              return (
                <span key={ic} onClick={() => setIcon(ic)} style={{ width: 42, height: 42, borderRadius: t.rInput, display: 'grid', placeItems: 'center', cursor: 'pointer',
                  color: on ? t.accentOn : t.ink2, background: on ? color : t.card, border: `1px solid ${on ? 'transparent' : t.border}`, transition: 'all .12s' }}>
                  <MIco name={ic} size={19} sw={2} />
                </span>);
            })}
          </div>
        </div>
        {/* acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 14px' }}>
          <button type="button" className="m-btn" onClick={onClose} style={{ minHeight: 44, fontSize: 14.5, fontWeight: 600, color: t.ink2, padding: '11px 16px', cursor: 'pointer' }}>Cancelar</button>
          <span style={{ flex: 1 }} />
          <button type="button" className="m-btn" disabled={!valid} onClick={() => valid && onSave({ id: initial ? initial.id : 'l' + Date.now(), name: name.trim(), color, icon, count: initial ? initial.count : null })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: valid ? t.accentOn : t.ink3, background: valid ? t.accent : t.border, padding: '11px 22px', borderRadius: 999, cursor: valid ? 'pointer' : 'default', transition: 'all .12s' }}>
            <MIco name="check" size={15} sw={2.6} />{editing ? 'Guardar' : 'Crear lista'}
          </button>
        </div>
        <window.IOSKeyboard dark={t.mode === 'dark'} />
      </div>
    </div>);
}

/* ───────── CAPTURA RÁPIDA (hoja deslizante) ───────── */
function MCapture({ t, onClose, onCreate }) {
  const types = window.antaskNoteTypes(t);
  const TYPES = ['tarea']; /* Notas deshabilitadas: la captura rápida solo crea tareas */
  const [type, setType] = React.useState('tarea');
  const [text, setText] = React.useState('');
  const m = types[type];
  // parseo de sintaxis natural (sólo visual)
  const tokens = [];
  const pm = text.match(/\bp([1-4])\b/i); if (pm) tokens.push({ k: 'prio', v: 'P' + pm[1] });
  const lm = text.match(/#(\w+)/); if (lm) tokens.push({ k: 'lista', v: '#' + lm[1] });
  if (/\b(hoy|mañana|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i.test(text)) tokens.push({ k: 'fecha', v: (text.match(/\b(hoy|mañana|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/i) || [])[0] });
  const ph = { tarea: 'p. ej. Llamar a la gestoría mañana p1 #IRPs', nota: 'Escribe una nota…', consulta: 'p. ej. ¿Cubre el seguro Almuñécar?' };
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,14,6,0.42)', animation: 'mFade .2s ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: t.canvas, borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', paddingBottom: 0, animation: 'mSheet .26s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: t.border, margin: '9px auto 4px' }} />
        {/* selector de tipo (oculto mientras solo haya un tipo) */}
        {TYPES.length > 1 && <div style={{ display: 'flex', gap: 5, padding: '10px 16px 12px' }}>
          {TYPES.map((k) => {
            const tm = types[k], on = k === type;
            return (
              <span key={k} onClick={() => setType(k)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: t.rInput, cursor: 'pointer', fontSize: 14, fontWeight: 650,
                color: on ? tm.fg : t.ink2, background: on ? tm.bg : 'transparent', border: `1px solid ${on ? 'transparent' : t.border}`, transition: 'all .12s' }}>
                <MIco name={tm.icon} size={15} sw={2} />{tm.label}
              </span>);
          })}
        </div>}
        {/* campo */}
        <div style={{ padding: '12px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', background: t.card, border: `1.5px solid ${m.fg}`, borderRadius: t.rInput + 2 }}>
            <MIco name={m.icon} size={18} sw={2} style={{ color: m.fg, flexShrink: 0, marginTop: 2 }} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={ph[type]}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim() && onCreate) onCreate({ type, text }); } }}
              style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: t.fontUI, fontSize: 16, lineHeight: 1.4, color: t.ink }} />
          </div>
          {/* chips de sintaxis detectada */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, minHeight: 26, flexWrap: 'wrap' }}>
            {tokens.length === 0
              ? <span style={{ fontSize: 12, fontWeight: 500, color: t.ink2 }}>Prueba: <b style={{ color: t.ink }}>p1</b> prioridad · <b style={{ color: t.ink }}>#lista</b> · <b style={{ color: t.ink }}>mañana</b></span>
              : tokens.map((tk, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 650, fontFamily: t.fontMono, padding: '3px 9px', borderRadius: t.rTag, color: t.accentInk, background: t.tintBg }}><MIco name={tk.k === 'prio' ? 'flag' : tk.k === 'lista' ? 'tag' : 'calendar'} size={11} sw={2} />{tk.v}</span>)}
          </div>
        </div>
        {/* acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 16px 14px' }}>
          <button type="button" className="m-btn" onClick={onClose} style={{ minHeight: 44, fontSize: 14.5, fontWeight: 600, color: t.ink2, padding: '11px 16px', cursor: 'pointer' }}>Cancelar</button>
          <span style={{ flex: 1 }} />
          <button type="button" className="m-btn" disabled={!text.trim()} onClick={() => { if (text.trim() && onCreate) onCreate({ type, text }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: text.trim() ? t.accentOn : t.ink3, background: text.trim() ? t.accent : t.border, padding: '11px 22px', borderRadius: 999, cursor: text.trim() ? 'pointer' : 'default', transition: 'all .12s' }}>
            <MIco name="check" size={15} sw={2.6} />Guardar {m.label.toLowerCase()}
          </button>
        </div>
        <window.IOSKeyboard dark={t.mode === 'dark'} />
      </div>
    </div>);
}

/* ───────── BARRA INFERIOR ───────── */
function MTabBar({ t, screen, go, onCapture, v1, addBtn }) {
  const tabs = (v1
    ? [{ id: 'hoy', ic: 'calendar', label: 'Hoy' }, { id: 'inbox', ic: 'inbox', label: 'Inbox' }, { id: '__add' }, { id: 'menu', label: 'Perfil' }]
    : [{ id: 'hoy', ic: 'calendar', label: 'Hoy' }, { id: 'inbox', ic: 'inbox', label: 'Inbox' }, { id: '__add' }, { id: 'notas', ic: 'note', label: 'Notas' }, { id: 'menu', label: 'Perfil' }]);
  const dark = t.mode === 'dark';
  /* colocación del botón + (solo v1): Centrado · Separado (FAB fuera) · Integrado (en fila) */
  const mode = v1 ? (addBtn || 'Separado') : 'Integrado';
  const AddFab = ({ size = 50, inline = true }) => (
    <button type="button" onClick={onCapture} aria-label="Añadir" className="m-btn" style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, width: size, height: size, margin: inline ? '-3px 0' : 0,
      borderRadius: '50%', background: t.accent, color: t.accentOn, boxShadow: dark ? '0 8px 18px -6px rgba(0,0,0,0.7)' : `0 8px 18px -6px ${window.antaskHexA ? window.antaskHexA(t.accent, 0.55) : 'rgba(40,28,12,0.4)'}`,
      transition: 'transform .12s' }}>
      <MIco name="plus" size={26} sw={2.4} />
    </button>);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexShrink: 0, padding: '8px 14px max(22px, env(safe-area-inset-bottom))', background: 'transparent', zIndex: 30, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{ position: 'relative', flex: 1, padding: '8px 12px', borderRadius: 28, pointerEvents: 'auto',
        boxShadow: dark ? '0 10px 30px -10px rgba(0,0,0,0.7)' : '0 14px 32px -12px rgba(40,28,12,0.38)' }}>
        {/* ── fondo sólido de la pastilla ── */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 28, zIndex: 0, background: t.card, border: `1px solid ${t.border}` }} />
        {/* contenido por encima del cristal */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {(() => {
        const Tab = (tb) => {
          const on = tb.id === screen;
          if (tb.id === 'menu') return (
            <button type="button" key="menu" onClick={() => go('menu')} aria-current={on ? 'page' : undefined} className="m-btn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', minWidth: 56, minHeight: 44, padding: '2px 0' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', display: 'block', outline: on ? `2.5px solid ${t.accentInk}` : `1.5px solid ${on ? t.accentInk : t.ink3}`, outlineOffset: '1.5px', opacity: on ? 1 : 0.65 }}>
                <image-slot id="antask-avatar" shape="circle" style={{ width: '26px', height: '26px', display: 'block' }} placeholder="👤" fit="cover" />
              </span>
              <span style={{ fontSize: 12, fontWeight: on ? 700 : 600, letterSpacing: '0.01em', color: on ? t.accentInk : t.ink2 }}>{tb.label}</span>
            </button>);
          const locked = tb.id === 'notas';
          return (
            <button type="button" key={tb.id} onClick={locked ? undefined : () => go(tb.id)} disabled={locked} aria-current={on ? 'page' : undefined} aria-label={locked ? tb.label + ' (bloqueado)' : tb.label} className="m-btn" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: locked ? 'default' : 'pointer', color: on ? t.accentInk : t.ink3, opacity: locked ? 0.42 : 1, transition: 'color .15s', minWidth: 56, minHeight: 44, padding: '2px 0' }}>
              <span style={{ position: 'relative', display: 'flex' }}>
                <MIco name={tb.ic} size={23} sw={on ? 2.4 : 1.9} />
                {locked && <span style={{ position: 'absolute', bottom: -2, right: -8, display: 'flex', color: t.ink3 }}><MIco name="lock" size={11} sw={2.4} /></span>}
              </span>
              <span style={{ fontSize: 12, fontWeight: on ? 700 : 550, letterSpacing: '0.01em' }}>{tb.label}</span>
            </button>);
        };
        const plain = tabs.filter((tb) => tb.id !== '__add');
        if (mode === 'Separado') return plain.map(Tab);
        if (mode === 'Centrado') return (
          <React.Fragment>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>{plain.slice(0, -1).map(Tab)}</div>
            <AddFab />
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>{plain.slice(-1).map(Tab)}</div>
          </React.Fragment>);
        return tabs.map((tb) => tb.id === '__add' ? <AddFab key="add" /> : Tab(tb));
        })()}
        </div>
      </div>
      {mode === 'Separado' && <span style={{ pointerEvents: 'auto', display: 'flex' }}><AddFab size={54} inline={false} /></span>}
    </div>);
}

/* ───────── PANTALLA: APARIENCIAS (galería nativa móvil) ───────── */
function MAppearances({ t, tw, setTweak, go }) {
  const PACKS = window.ANTASK_APPEARANCES || [];
  const [hasPro, setHasPro] = React.useState(!!(tw && tw.pro));
  const [filter, setFilter] = React.useState('Todas');
  const FILTERS = ['Todas', 'Gratis', 'PRO'];

  const apply = (pack) => {
    if (pack.pro && !hasPro) { if (window.openProUpgrade) window.openProUpgrade(); return; }
    const mode = pack.defaultMode || (pack.caps.modes.includes('light') ? 'Claro' : 'Oscuro');
    const accent = pack.caps.accents ? (pack.caps.accents.def || (tw && tw.accent)) : (tw && tw.accent);
    setTweak({ appearance: pack.id, mode, ...((pack.caps.accents || pack.id === 'tierra') ? { accent } : {}) });
    // salir a la app para ver la apariencia aplicada en contexto
    if (go) go('hoy');
  };
  const ptheme = (pack) => window.buildAppearanceTheme({
    ...tw, appearance: pack.id, shell: 'Pegado',
    mode: pack.defaultMode || (pack.caps.modes.includes('light') ? 'Claro' : 'Oscuro'),
    accent: (pack.caps.accents && pack.caps.accents.def) ? pack.caps.accents.def : (tw && tw.accent),
  });

  const list = PACKS.filter((p) => filter === 'Todas' ? true : filter === 'Gratis' ? !p.pro : p.pro);
  const proGrad = 'linear-gradient(135deg,#e0915a,#c25e3a)';

  return (
    <div>
      <p style={{ margin: '0 4px 14px', fontSize: 14, lineHeight: 1.45, color: t.ink3 }}>
        Cambia el mundo visual completo de Antask. Toca <b style={{ color: t.ink2, fontWeight: 650 }}>Aplicar</b> para activar una apariencia; los ajustes finos (modo, acento) están en Ajustes.
      </p>

      {/* filtros + simular PRO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <span key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: f === filter ? 700 : 550,
            color: f === filter ? t.accentOn : t.ink2, background: f === filter ? t.accent : t.card, border: `1px solid ${f === filter ? t.accent : t.border}` }}>{f}</span>))}
        <span style={{ flex: 1 }} />
        <span onClick={() => { const v = !hasPro; setHasPro(v); setTweak('pro', v); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 650,
            color: hasPro ? '#fff' : t.ink2, background: hasPro ? proGrad : t.card, border: `1px solid ${hasPro ? 'transparent' : t.border}` }}>
          <MIco name="sparkles" size={13} sw={2} />{hasPro ? 'PRO activo' : 'Simular PRO'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {list.map((pack) => {
          const active = tw && pack.id === tw.appearance;
          const locked = pack.pro && !hasPro;
          return (
            <div key={pack.id} style={{ background: t.card, border: `1.5px solid ${active ? t.accent : t.border}`, borderRadius: t.rInput + 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,14,6,0.08)' }}>
              {/* preview */}
              <div style={{ position: 'relative', borderBottom: `1px solid ${t.border}` }}>
                <window.AppearancePreview theme={ptheme(pack)} height={150} />
                {active && (
                  <span style={{ position: 'absolute', top: 9, right: 9, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: t.accentOn, background: t.accent, padding: '4px 9px', borderRadius: 999 }}>
                    <MIco name="check" size={11} sw={3} />Activa
                  </span>)}
                {locked && (
                  <span style={{ position: 'absolute', top: 9, left: 9, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#fff', background: proGrad, padding: '4px 9px', borderRadius: 999 }}>
                    <MIco name="sparkles" size={11} sw={2} />PRO
                  </span>)}
              </div>
              {/* meta */}
              <div style={{ padding: '13px 15px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 17.5, color: t.ink, letterSpacing: '-0.01em' }}>{pack.name}</span>
                  <span style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 5 }}>
                    {pack.swatches.map((c, i) => <span key={i} style={{ width: 15, height: 15, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.12)' }} />)}
                  </div>
                </div>
                <p style={{ margin: '7px 0 13px', fontSize: 13, lineHeight: 1.45, color: t.ink3 }}>{pack.tagline}</p>
                <span onClick={() => apply(pack)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: t.rInput, fontSize: 14, fontWeight: 700,
                    cursor: active ? 'default' : 'pointer',
                    color: active ? t.ink3 : locked ? t.ink2 : t.accentOn,
                    background: active ? t.inputBg : locked ? t.card : t.accent,
                    border: `1px solid ${active ? t.border : locked ? t.border : t.accent}` }}>
                  {active ? <React.Fragment><MIco name="check" size={15} sw={2.6} />Activa</React.Fragment>
                    : locked ? <React.Fragment><MIco name="sparkles" size={14} sw={2} />Requiere PRO</React.Fragment>
                      : <React.Fragment><MIco name="check" size={15} sw={2.4} />Aplicar</React.Fragment>}
                </span>
              </div>
            </div>);
        })}
      </div>
      <p style={{ marginTop: 22, fontSize: 12, color: t.ink3, textAlign: 'center', fontFamily: t.fontMono }}>{list.length} apariencia{list.length === 1 ? '' : 's'} · más en camino</p>
    </div>);
}

/* ───────── EFECTOS DE APARIENCIA EN EL MARCO (in-frame) ───────── */
function MAppearanceFX({ appearance, t }) {
  if (appearance === 'terminal') {
    return (
      <React.Fragment>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(2,12,6,0.30) 3px, rgba(2,12,6,0.30) 3px)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 41, pointerEvents: 'none',
          background: 'radial-gradient(125% 105% at 50% 45%, rgba(40,255,150,0.045) 0%, rgba(0,0,0,0) 42%, rgba(0,14,5,0.5) 100%)' }} />
      </React.Fragment>);
  }
  if (!window.AmbientDeco) return null;
  return <window.AmbientDeco appearance={appearance} theme={t} position="absolute" zIndex={-1} />;
}

/* ───────── PANTALLA: ANTASK PRO (upgrade nativo móvil) ───────── */
function MUpgrade({ t, onUpgrade }) {
  const PLAN = window.PRO_PLAN || { monthly: { price: '3 €', suffix: '/mes', caption: '' }, annual: { price: '29 €', suffix: '/año', caption: '', save: '−19%' }, trialDays: 7, features: [], freeIncludes: [] };
  const [billing, setBilling] = React.useState('annual');
  const proGrad = 'linear-gradient(135deg,#e0915a,#c25e3a)';
  const proInk = '#c25e3a';
  const hexA = window.antaskHexA || ((h) => h);
  const p = PLAN[billing];
  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4px 0 22px' }}>
        <span style={{ width: 62, height: 62, borderRadius: 18, background: proGrad, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 12px 26px -10px rgba(194,94,58,0.6)' }}><MIco name="sparkles" size={30} sw={1.9} /></span>
        <h1 style={{ margin: '18px 0 0', fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 27, letterSpacing: '-0.02em', color: t.ink }}>Antask PRO</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.5, color: t.ink2, maxWidth: 280 }}>Quita los límites y hazlo del todo tuyo.</p>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: t.card, borderRadius: 14, border: `1px solid ${t.border}`, marginBottom: 18 }}>
        {[{ k: 'monthly', l: 'Mensual' }, { k: 'annual', l: 'Anual' }].map((o) => {
          const on = o.k === billing;
          return (
            <span key={o.k} onClick={() => setBilling(o.k)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 0', borderRadius: 11, cursor: 'pointer', fontSize: 14, fontWeight: on ? 700 : 550, color: on ? '#fff' : t.ink2, background: on ? proGrad : 'transparent' }}>
              {o.l}{o.k === 'annual' && <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: t.fontMono, padding: '2px 6px', borderRadius: 999, color: on ? '#fff' : proInk, background: on ? 'rgba(255,255,255,0.22)' : hexA(proInk, 0.12), lineHeight: 1 }}>−19%</span>}
            </span>);
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 46, letterSpacing: '-0.02em', color: t.ink, lineHeight: 1 }}>{p.price}</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: t.ink2 }}>{p.suffix}</span>
        </div>
        <span style={{ fontSize: 12.5, color: t.ink3, fontFamily: t.fontMono }}>{p.caption}</span>
      </div>
      <span onClick={onUpgrade} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '15px 0', borderRadius: 14, cursor: 'pointer', fontSize: 15.5, fontWeight: 700, color: '#fff', background: proGrad, boxShadow: '0 12px 26px -12px rgba(194,94,58,0.6)' }}>
        <MIco name="sparkles" size={17} sw={2} />Empieza {PLAN.trialDays} días gratis
      </span>
      <p style={{ margin: '12px 0 22px', fontSize: 12, fontWeight: 500, color: t.ink2, textAlign: 'center' }}>Luego {p.price}{p.suffix} · cancela cuando quieras</p>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 4, overflow: 'hidden' }}>
        {(PLAN.features || []).map((f, i) => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '14px 15px', borderBottom: i < PLAN.features.length - 1 ? `1px solid ${t.border}` : 'none' }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: hexA(proInk, 0.13), display: 'grid', placeItems: 'center', color: proInk, flexShrink: 0, marginTop: 1 }}><MIco name="check" size={13} sw={3} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 650, color: t.ink }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: t.ink2, marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: t.rInput + 4, background: t.card, border: `1px solid ${t.border}` }}>
        <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink2 }}>Plan gratis</div>
        <div style={{ fontSize: 13, color: t.ink2, lineHeight: 1.5 }}>{(PLAN.freeIncludes || []).join(' · ')}</div>
      </div>
    </div>);
}

/* ───────── HOJA: OPCIONES DE NOTA ───────── */
function MNoteOptions({ t, note, onTogglePin, onRename, onDuplicate, onDelete, onClose }) {
  if (!note) return null;
  const dc = t.mode === 'dark' ? '#e0846a' : '#b0473f';
  const Item = ({ icon, label, onClick, danger, last }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${t.border}`, color: danger ? dc : t.ink }}>
      <MIco name={icon} size={19} sw={1.9} style={{ color: danger ? dc : t.ink3, flexShrink: 0 }} />
      <span style={{ fontSize: 15.5, fontWeight: 500 }}>{label}</span>
    </div>);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,14,6,0.42)', animation: 'mFade .2s ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: t.canvas, borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', paddingBottom: 'max(22px, env(safe-area-inset-bottom))', animation: 'mSheet .26s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: t.border, margin: '9px auto 2px' }} />
        <div style={{ padding: '10px 20px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink3 }}>Opciones de nota</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: t.ink, marginTop: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.title}</div>
        </div>
        <div style={{ borderTop: `1px solid ${t.border}` }}>
          <Item icon="pin" label={note.pin ? 'Quitar de fijadas' : 'Anclar arriba'} onClick={() => { onTogglePin(note.id); onClose(); }} />
          <Item icon="note" label="Renombrar" onClick={() => onRename && onRename(note.id)} />
          <Item icon="layers" label="Duplicar" onClick={() => onDuplicate(note.id)} />
          <Item icon="trash" label="Eliminar nota" danger last onClick={() => onDelete(note.id)} />
        </div>
      </div>
    </div>);
}

/* ───────── HOJA: OPCIONES DE TAREA ───────── */
function MTaskOptions({ t, task, onRename, onDuplicate, onDelete, onClose }) {
  if (!task) return null;
  const dc = t.mode === 'dark' ? '#e0846a' : '#b0473f';
  const Item = ({ icon, label, onClick, danger, last }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', cursor: 'pointer',
      borderBottom: last ? 'none' : `1px solid ${t.border}`, color: danger ? dc : t.ink }}>
      <MIco name={icon} size={19} sw={1.9} style={{ color: danger ? dc : t.ink3, flexShrink: 0 }} />
      <span style={{ fontSize: 15.5, fontWeight: 500 }}>{label}</span>
    </div>);
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,14,6,0.42)', animation: 'mFade .2s ease both' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: t.canvas, borderRadius: '22px 22px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', paddingBottom: 'max(22px, env(safe-area-inset-bottom))', animation: 'mSheet .26s cubic-bezier(0.22,1,0.36,1) both', overflow: 'hidden' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: t.border, margin: '9px auto 2px' }} />
        <div style={{ padding: '10px 20px 12px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink3 }}>Opciones de tarea</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: t.ink, marginTop: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.title}</div>
        </div>
        <div style={{ borderTop: `1px solid ${t.border}` }}>
          <Item icon="note" label="Renombrar" onClick={() => onRename && onRename(task.id)} />
          <Item icon="layers" label="Duplicar" onClick={() => onDuplicate(task.id)} />
          <Item icon="trash" label="Eliminar tarea" danger last onClick={() => onDelete(task.id)} />
        </div>
      </div>
    </div>);
}

/* ───────── TOAST "DESHACER" (red de seguridad para acciones destructivas) ───────── */
function MToast({ t, label, onUndo }) {
  const dark = t.mode === 'dark';
  return (
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 92, zIndex: 60, display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 8px 13px 17px', borderRadius: 15, animation: 'mFade .2s ease both',
      background: dark ? 'rgba(58,48,35,0.97)' : 'rgba(34,27,18,0.97)', color: '#f4efe3',
      boxShadow: '0 12px 32px -10px rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
      <MIco name="trash" size={16} sw={2} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 550 }}>{label}</span>
      <button type="button" className="m-btn" onClick={onUndo}
        style={{ minHeight: 44, fontSize: 14.5, fontWeight: 750, color: t.accent, cursor: 'pointer', padding: '6px 12px', borderRadius: 9, whiteSpace: 'nowrap' }}>Deshacer</button>
    </div>);
}

/* ───────── persistencia local ─────────
   Todo lo que el usuario crea o modifica sobrevive a la recarga. Cada clave se
   guarda por separado para que un dato corrupto no tire el resto del estado, y
   toda lectura/escritura va envuelta (modo privado de Safari lanza al escribir). */
const M_STORE = 'antask_m_v1_';
function mLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(M_STORE + key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val == null ? fallback : val;
  } catch (e) { return fallback; }
}
function mSave(key, val) {
  try { localStorage.setItem(M_STORE + key, JSON.stringify(val)); } catch (e) {}
}
/* estado persistido: idéntico a useState pero se escribe en cada cambio */
function useStored(key, seed) {
  const [val, set] = React.useState(() => mLoad(key, typeof seed === 'function' ? seed() : seed));
  React.useEffect(() => { mSave(key, val); }, [key, val]);
  return [val, set];
}

/* ───────── APP ───────── */
function MobileApp({ theme: t, tw, setTweak, v1 }) {
  const [screen, setScreen] = React.useState('hoy');
  const [prev, setPrev] = React.useState('hoy');
  const [tasks, setTasks] = useStored('tasks', () => (window.ANTASK_DATED || []).map((x) => ({ ...x })));
  const [linesByNote, setLines] = useStored('lines', () => window.buildNoteLines());
  const [notes, setNotes] = useStored('notes', () => (window.NOTES_DATA || []).map((n) => ({ ...n })));
  const [noteSheet, setNoteSheet] = React.useState(null);
  const [selTask, setSelTask] = React.useState(null);
  const [selNote, setSelNote] = React.useState(null);
  const [capture, setCapture] = React.useState(false);
  const [lists, setLists] = useStored('lists', M_INIT_LISTS);
  const [listSheet, setListSheet] = React.useState(null);
  const [activeList, setActiveList] = React.useState(null);
  const [rowStyle, setRowStyle] = useStored('rowstyle', 'tarjetas');
  const chooseRow = (id) => setRowStyle(id);
  const [toast, setToast] = React.useState(null);
  const undoTimer = React.useRef(null);
  const showUndoToast = (label, onUndo) => { clearTimeout(undoTimer.current); setToast({ label, onUndo }); undoTimer.current = setTimeout(() => setToast(null), 6000); };
  const dismissToast = () => { clearTimeout(undoTimer.current); setToast(null); };
  React.useEffect(() => () => clearTimeout(undoTimer.current), []);

  const scrollRef = React.useRef(null);
  const noteTitleRef = React.useRef(null);
  const taskTitleRef = React.useRef(null);
  const [taskSheet, setTaskSheet] = React.useState(null);

  const onToggle = (id) => {
    const task = tasks.find((x) => x.id === id);
    setTasks((ts) => ts.map((x) => x.id === id ? { ...x, done: !x.done } : x));
    if (task && !task.done) showUndoToast('Tarea completada', () => setTasks((ts) => ts.map((x) => x.id === id ? { ...x, done: false } : x)));
    else dismissToast();
  };
  const onMoveToday = (id) => setTasks((ts) => ts.map((x) => x.id === id ? { ...x, due: M_TODAY_STR } : x));
  const onMoveAll = () => setTasks((ts) => ts.map((x) => x.due && !x.done && window.antaskDiffDays(window.antaskParseDue(x.due)) < 0 ? { ...x, due: M_TODAY_STR } : x));
  const onAddToday = (title) => setTasks((ts) => [...ts, { id: 'm' + Date.now(), title, due: M_TODAY_STR, done: false }]);
  const onToggleLine = (noteId, lineId) => setLines((map) => ({ ...map, [noteId]: map[noteId].map((l) => l.id === lineId ? { ...l, done: !l.done } : l) }));
  const onSetLineKind = (noteId, lineId, kind) => setLines((map) => ({ ...map, [noteId]: map[noteId].map((l) => l.id === lineId ? { ...l, kind, done: kind === 'tarea' ? !!l.done : l.done } : l) }));
  const go = (s) => { if (s === 'notas') return; /* sección bloqueada — aún sin lugar en el producto */ setScreen(s); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const goToList = (name) => { setActiveList(name); go('inbox'); };
  const screenRef = React.useRef('hoy'); screenRef.current = screen;
  const openTask = (id) => { setSelTask(id); setPrev(screen); go('detalle'); };
  const openNote = (id) => { setSelNote(id); setPrev(screen); go('nota'); };
  const openSettings = () => { setPrev('menu'); go('ajustes'); };
  const onSaveList = (l) => {
    const prev = lists.find((x) => x.id === l.id);
    if (prev && prev.name !== l.name) setTasks((ts) => ts.map((tk) => tk.list === prev.name ? { ...tk, list: l.name } : tk));
    setLists((ls) => ls.some((x) => x.id === l.id) ? ls.map((x) => x.id === l.id ? l : x) : [...ls, l]);
  };
  const onDeleteList = (id) => { const snap = lists; setLists((ls) => ls.filter((x) => x.id !== id)); showUndoToast('Lista eliminada', () => setLists(snap)); };
  const deleteTask = (id) => { const snap = tasks; const removed = tasks.find((x) => x.id === id); setTasks((ts) => ts.filter((x) => x.id !== id)); setTaskSheet(null); if (screenRef.current === 'detalle') go(prev); if (removed) showUndoToast('Tarea eliminada', () => setTasks(snap)); };
  const updateTask = (id, patch) => setTasks((ts) => ts.map((x) => x.id === id ? { ...x, ...patch } : x));
  const onDuplicateTask = (id) => {
    const src = tasks.find((x) => x.id === id); if (!src) return;
    setTasks((ts) => { const i = ts.findIndex((x) => x.id === id); const out = ts.slice(); out.splice(i + 1, 0, { ...src, id: 'm' + Date.now(), done: false }); return out; });
    setTaskSheet(null);
  };
  const onRenameTask = (id) => { setTaskSheet(null); setTimeout(() => { if (taskTitleRef.current) { taskTitleRef.current.focus(); taskTitleRef.current.select(); } }, 80); };
  const onTogglePin = (id) => setNotes((ns) => ns.map((n) => n.id === id ? { ...n, pin: !n.pin } : n));
  const onDuplicateNote = (id) => {
    const src = notes.find((n) => n.id === id); if (!src) return;
    const newId = notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
    setNotes((ns) => { const i = ns.findIndex((n) => n.id === id); const out = ns.slice(); out.splice(i + 1, 0, { ...src, id: newId, pin: false }); return out; });
    setLines((map) => ({ ...map, [newId]: (map[id] || []).map((l) => ({ ...l })) }));
    setNoteSheet(null);
  };
  const onRemoveNote = (id) => { const snapN = notes, snapL = linesByNote; setNotes((ns) => ns.filter((n) => n.id !== id)); setNoteSheet(null); if (screenRef.current === 'nota') go(prev); showUndoToast('Nota eliminada', () => { setNotes(snapN); setLines(snapL); }); };
  const renameNote = (id, title) => setNotes((ns) => ns.map((n) => n.id === id ? { ...n, title } : n));
  const onRenameNote = (id) => { setNoteSheet(null); openNote(id); setTimeout(() => { if (noteTitleRef.current) { noteTitleRef.current.focus(); noteTitleRef.current.select(); } }, 120); };

  /* crear desde la captura rápida: aplica prioridad (p1–4), lista (#x) y fecha (hoy/mañana/día) */
  const onCapture = ({ type, text }) => {
    const isoOff = (n) => { const r = new Date(); r.setHours(0, 0, 0, 0); r.setDate(r.getDate() + n); return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`; };
    const WD = { domingo: 0, lunes: 1, martes: 2, 'miércoles': 3, miercoles: 3, jueves: 4, viernes: 5, 'sábado': 6, sabado: 6 };
    const dueFromWord = (w) => {
      w = (w || '').toLowerCase();
      if (w === 'hoy') return isoOff(0);
      if (w === 'mañana' || w === 'manana') return isoOff(1);
      const tg = WD[w]; if (tg == null) return undefined;
      const r = new Date(); r.setHours(0, 0, 0, 0);
      let add = (tg - r.getDay() + 7) % 7; if (add === 0) add = 7;
      return isoOff(add);
    };
    let body = text || '';
    let prio = null, list = null, due;
    const pm = body.match(/\bp([1-4])\b/i); if (pm) { prio = { '1': 'alta', '2': 'media', '3': 'baja', '4': 'espera' }[pm[1]]; body = body.replace(pm[0], ''); }
    const lm = body.match(/#(\w+)/); if (lm) { list = lm[1]; body = body.replace(lm[0], ''); }
    const dm = body.match(/\b(hoy|mañana|manana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/i);
    if (dm) { due = dueFromWord(dm[0]); body = body.replace(dm[0], ''); }
    const title = body.replace(/\s{2,}/g, ' ').trim();
    if (!title) { setCapture(false); return; }
    if (type === 'tarea') {
      const match = list && lists.find((l) => l.name.toLowerCase() === list.toLowerCase());
      setTasks((ts) => [{ id: 'm' + Date.now(), title, prio: prio || null, label: match ? match.name : (list || undefined), lk: 'slate', due, done: false }, ...ts]);
      setCapture(false);
      setActiveList(null); go(due === M_TODAY_STR ? 'hoy' : 'inbox');
    } else {
      const id = notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
      const shortDate = `${TODAY.getDate()} ${window.ANTASK_MO[TODAY.getMonth()]}`;
      setNotes((ns) => [{ id, type, pin: false, title, body: '', date: shortDate, list: list || undefined }, ...ns]);
      setLines((map) => ({ ...map, [id]: [{ id: 1, kind: type === 'consulta' ? 'consulta' : 'text', text: title }] }));
      setCapture(false);
      go('notas');
    }
  };

  // Ajustes › Biblioteca de apariencias abre la galería nativa móvil
  React.useEffect(() => {
    if (!v1) window.openAppearanceLibrary = () => { setPrev('ajustes'); go('apariencias'); };
    if (!v1) window.openProUpgrade = () => { setPrev(screenRef.current === 'pro' ? 'ajustes' : screenRef.current); go('pro'); };
    return () => { delete window.openAppearanceLibrary; delete window.openProUpgrade; };
  }, []);

  const TODAY = window.ANTASK_TODAY;
  const _fechaRaw = `${['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][TODAY.getDay()]}, ${TODAY.getDate()} ${window.ANTASK_MO[TODAY.getMonth()]}`;
  const fecha = _fechaRaw.charAt(0).toUpperCase() + _fechaRaw.slice(1); /* solo la inicial */

  // conteos reales para el Menú (derivados de los datos, no fijos)
  const diffD = window.antaskDiffDays, parseD = window.antaskParseDue;
  const hoyCount = tasks.filter((x) => { if (!x.due) return false; const d = diffD(parseD(x.due)); return (d < 0 && !x.done) || d === 0; }).length;
  const inboxCount = tasks.filter((x) => !x.done).length;
  const menuCounts = { hoy: hoyCount, inbox: inboxCount, notas: notes.length };

  const titles = { hoy: 'Hoy', inbox: activeList || 'Inbox', notas: 'Notas', menu: 'Menú', ajustes: 'Ajustes', apariencias: 'Apariencia', pro: 'Antask PRO' };
  /* progreso del día en el encabezado — paralelo al escritorio v1 */
  const _hToday = tasks.filter((x) => x.due && diffD(parseD(x.due)) === 0);
  const _hOver = tasks.filter((x) => x.due && !x.done && diffD(parseD(x.due)) < 0).length;
  const _hDone = _hToday.filter((x) => x.done).length;
  const _hTotal = _hOver + _hToday.length;
  const hoyRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: t.ink2, fontVariantNumeric: 'tabular-nums', textAlign: 'right', lineHeight: 1.35, whiteSpace: 'nowrap' }}>
        {_hDone} de {_hTotal} hechas
        {_hOver > 0 && <span style={{ display: 'block', color: '#b0473f', fontWeight: 700 }}>{_hOver} vencida{_hOver === 1 ? '' : 's'}</span>}
      </span>
      <MProgressRing t={t} done={_hDone} total={_hTotal} />
    </div>);
  const subs = { hoy: fecha, inbox: activeList ? null : `${inboxCount} pendientes`, notas: `${notes.length} notas`, menu: null };
  const isSub = screen === 'detalle' || screen === 'nota' || screen === 'ajustes' || screen === 'apariencias' || screen === 'pro';
  const rootTab = screen === 'detalle' ? (prev === 'hoy' ? 'hoy' : 'inbox') : { nota: 'notas', ajustes: 'menu', apariencias: 'menu', pro: 'menu' }[screen] || screen;
  const note = notes.find((n) => n.id === selNote);
  const task = tasks.find((x) => x.id === selTask);

  return (
    <div style={{ height: '100%', position: 'relative', zIndex: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: t.canvas, color: t.ink, fontFamily: t.fontUI, '--tm': tw && tw.textScale != null ? tw.textScale : 1 }}>
      {/* decoración / mundo de la apariencia, recortado al marco */}
      <MAppearanceFX appearance={tw && tw.appearance} t={t} />
      {/* safe-area superior (deja sitio a la status bar + isla) */}
      <div style={{ height: 56, flexShrink: 0 }} />

      {/* cabecera */}
      {isSub
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 12px' }}>
            <button type="button" className="m-btn" onClick={() => go(prev)} aria-label={'Volver a ' + (titles[prev] || 'atrás')} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minHeight: 44, fontSize: 16, fontWeight: 600, color: t.accentInk, padding: '6px 10px 6px 4px', cursor: 'pointer' }}><MIco name="chevronL" size={20} sw={2.2} />{titles[prev] || 'Atrás'}</button>
            <span style={{ flex: 1 }} />
            {screen === 'nota' && note && <button type="button" className="m-btn" onClick={() => setNoteSheet(note.id)} aria-label="Opciones de la nota" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, cursor: 'pointer', color: t.ink2 }}><MIco name="ellipsis" size={21} /></button>}
            {screen === 'detalle' && task && <button type="button" className="m-btn" onClick={() => setTaskSheet(task.id)} aria-label="Opciones de la tarea" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, cursor: 'pointer', color: t.ink2 }}><MIco name="ellipsis" size={21} /></button>}
          </div>
        : <MHeader t={t} title={titles[screen]} subtitle={subs[screen]} right={screen === 'hoy' ? hoyRight : null} />}

      {/* contenido */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '0 16px', paddingBottom: 'calc(104px + env(safe-area-inset-bottom))' }}>
        {screen === 'hoy' && <MHoy t={t} tasks={tasks} linesByNote={linesByNote} onToggle={onToggle} onOpen={openTask} onMoveToday={onMoveToday} onMoveAll={onMoveAll} onAdd={onAddToday} openNote={openNote} onDelete={deleteTask} rowStyle={rowStyle} onRowStyle={chooseRow} />}
        {screen === 'inbox' && <MInbox t={t} tasks={tasks} lists={lists} onToggle={onToggle} onOpen={openTask} onMoveToday={onMoveToday} activeList={activeList} onActiveList={setActiveList} onDelete={deleteTask} rowStyle={rowStyle} onRowStyle={chooseRow} />}
        {screen === 'notas' && <MNotas t={t} notes={notes} linesByNote={linesByNote} openNote={openNote} onOptions={(id) => setNoteSheet(id)} />}
        {screen === 'menu' && <MMenu t={t} go={go} onSettings={openSettings} lists={lists} onNewList={() => setListSheet({})} onEditList={(l) => setListSheet({ list: l })} onDeleteList={onDeleteList} counts={menuCounts} onListClick={goToList} v1={v1} />}
        {screen === 'ajustes' && <MobileSettings t={t} tw={tw} setTweak={setTweak} v1={v1} />}
        {screen === 'apariencias' && <MAppearances t={t} tw={tw} setTweak={setTweak} go={go} />}
        {screen === 'pro' && <MUpgrade t={t} onUpgrade={() => { setTweak('pro', true); go(prev); }} />}
        {screen === 'detalle' && task && <MTaskDetail t={t} task={task} lists={lists} titleRef={taskTitleRef} onToggle={onToggle} onMoveToday={onMoveToday} onDelete={deleteTask} onUpdate={updateTask} onNewList={() => setListSheet({})} />}
        {screen === 'nota' && note && <React.Fragment>
          <textarea key={note.id} defaultValue={note.title}
            ref={(el) => { noteTitleRef.current = el; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== note.title) renameNote(note.id, v); else if (!v) e.target.value = note.title; }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
            rows={1} aria-label="Título de la nota"
            style={{ display: 'block', width: '100%', margin: '0 0 6px', padding: '0 4px', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden', background: 'transparent', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 'calc(25px * var(--tm, 1))', lineHeight: 1.2, color: t.ink }} />
          <MNoteDetail t={t} note={note} lines={linesByNote[note.id] || []} onToggleLine={onToggleLine} onSetLineKind={onSetLineKind} />
        </React.Fragment>}
      </div>

      {/* barra inferior flotante — siempre visible para permitir navegación lateral */}
      <MTabBar t={t} screen={rootTab} addBtn={tw && tw.addBtn} go={(s) => { if (s === 'inbox') setActiveList(null); if (isSub && s !== rootTab) { setPrev(prev); } go(s); }} onCapture={() => setCapture(true)} v1={v1} />

      {noteSheet != null && <MNoteOptions t={t} note={notes.find((n) => n.id === noteSheet)} onTogglePin={onTogglePin} onRename={onRenameNote} onDuplicate={onDuplicateNote} onDelete={onRemoveNote} onClose={() => setNoteSheet(null)} />}
      {capture && <MCapture t={t} onCreate={onCapture} onClose={() => setCapture(false)} />}
      {taskSheet != null && <MTaskOptions t={t} task={tasks.find((x) => x.id === taskSheet)} onRename={onRenameTask} onDuplicate={onDuplicateTask} onDelete={deleteTask} onClose={() => setTaskSheet(null)} />}
      {listSheet && <MListSheet t={t} initial={listSheet.list} onClose={() => setListSheet(null)} onSave={(l) => { onSaveList(l); setListSheet(null); }} />}
      {toast && <MToast t={t} label={toast.label} onUndo={() => { toast.onUndo(); dismissToast(); }} />}
    </div>);
}

window.MobileApp = MobileApp;

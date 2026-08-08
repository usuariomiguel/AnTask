/* views.jsx — Vistas Agenda y Mes para Antask, en la dirección cálida "tierra".
   Reutiliza window.Ico (de inbox-view.jsx) y el theme construido en el HTML.
   Exporta window.AgendaView, window.MonthView, window.ANTASK_DATED. */

/* ───────────────────────── prioridades (cálidas, armónicas) ───────────────────────── */
const PRIO = {
  alta: { bar: '#b0473f', bg: 'rgba(176,71,63,0.13)', fg: '#9a3a33', bd: 'rgba(176,71,63,0.30)', label: 'Alta', mark: '▲' },
  media: { bar: '#bf8636', bg: 'rgba(191,134,54,0.15)', fg: '#8a5e1a', bd: 'rgba(191,134,54,0.32)', label: 'Media', mark: '◆' },
  espera: { bar: '#8a7c5e', bg: 'rgba(138,124,94,0.14)', fg: '#665a40', bd: 'rgba(138,124,94,0.30)', label: 'En espera', mark: '⏸' },
  baja: { bar: '#6f7a3d', bg: 'rgba(111,122,61,0.14)', fg: '#566030', bd: 'rgba(111,122,61,0.30)', label: 'Baja', mark: '▽' }
};

/* ───────────────────────── dataset con fechas (real, de las capturas) ───────────────────────── */
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const _off = (n) => { const r = new Date(TODAY); r.setDate(r.getDate() + n); return `${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,'0')}-${String(r.getDate()).padStart(2,'0')}`; };
const ANTASK_DATED = [
{ id: 'a1',  title: 'Lanzar simulacro de ciberseguridad',           prio: 'alta',  label: 'Formación',    lk: 'amber', list: 'Formación',    due: _off(-29) },
{ id: 'a4',  title: 'Revisar los IRPs con el equipo de sistemas',    prio: 'alta',  label: 'IRPs',         lk: 'green', list: 'IRPs',         due: _off(-22) },
{ id: 'a7',  title: 'Coger autobús a Almuñécar para la inmersión',  prio: null,    label: 'Buceo',        lk: 'green', list: 'Buceo',         due: _off(-2)  },
{ id: 'a8',  title: 'Enviar correo del seguro de buceo',             prio: 'alta',  label: 'Buceo',        lk: 'green', list: 'Buceo',         due: _off(-2), time: '09:00' },
{ id: 'a9',  title: 'Enviar propuesta de colaboración a par en par', prio: 'media', label: 'Firma Digital', lk: 'amber', list: 'Firma Digital', due: _off(0),  time: '11:30' },
{ id: 'a10', title: 'Enviar PDF del certificado PADI',               prio: null,    label: 'Buceo',        lk: 'green', list: 'Buceo',         due: _off(0)   },
{ id: 'a11', title: 'Subir foto de perfil en PADI',                  prio: null,    label: 'Buceo',        lk: 'green', list: 'Buceo',         due: _off(0),  done: true },
{ id: 'a12', title: 'Llamar a la gestoría — IRPF trimestral',        prio: 'alta',  label: 'IRPs',         lk: 'green', list: 'IRPs',         due: _off(1),  time: '16:00' },
{ id: 'a13', title: 'Salida a bolsa de Anthropic',                   prio: 'media', label: 'Inversión',    lk: 'amber', list: 'Inversión',     due: _off(5)   },
{ id: 'a14', title: 'Reservar inmersión doble en Almuñécar',         prio: 'baja',  label: 'Buceo',        lk: 'green', list: 'Buceo',         due: _off(11)  },
{ id: 'a15', title: 'Explorar idea de secadero de frutas',           prio: null,    label: 'Inversión',    lk: 'amber', list: 'Inversión',     due: _off(30)  },
{ id: 'a18', title: 'Comparar precios de cámara submarina',          prio: 'baja',  label: 'Buceo',        lk: 'green', list: 'Buceo',         due: null      }];


/* ───────────────────────── helpers de fecha ───────────────────────── */
const WD = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MOL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function parseDue(s) {const [y, m, d] = s.split('-').map(Number);return new Date(y, m - 1, d);}
function dayKey(dt) {return dt.getFullYear() * 372 + dt.getMonth() * 31 + dt.getDate();}
function diffDays(dt) {return dayKey(dt) - dayKey(TODAY);}

function fmtRelative(dt) {
  const d = diffDays(dt);
  if (d === 0) return 'Hoy';
  if (d === -1) return 'Ayer';
  if (d === 1) return 'Mañana';
  return `${WD[dt.getDay()]}, ${dt.getDate()} ${MO[dt.getMonth()]}`;
}

/* ───────────────────────── atoms ───────────────────────── */
function PrioTag({ p, t }) {
  const c = PRIO[p];
  if (!c) return null;
  return <span style={{
    fontSize: 11, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI,
    letterSpacing: t.monoMeta ? '0.01em' : '-0.005em',
    padding: '3px 9px', borderRadius: t.rTag, color: c.fg, background: c.bg,
    border: t.tagBorder ? `1px solid ${c.bd}` : 'none', whiteSpace: 'nowrap',
    display: 'inline-flex', alignItems: 'center', gap: 5
  }}><span style={{ fontSize: 9 }}>{c.mark}</span>{c.label}</span>;
}

/* Etiqueta compacta P1/P2/P3 (estilo Antask Visión, con nuestra paleta cálida):
   texto en color + fondo tenue + anillo interior del mismo tono. */
const PRIO_PNUM = { alta: 'P1', media: 'P2', baja: 'P3', espera: 'P4' };
function PrioP({ p, t }) {
  const c = PRIO[p];
  if (!c) return null;
  /* jerarquía: P1/P2 son urgencia real → píldora con color; P3/P4 son ruido de fondo → texto plano tenue */
  const strong = p === 'alta' || p === 'media';
  if (!strong) return <span title={`Prioridad ${c.label}`} style={{
    fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em',
    color: t.ink3, opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums'
  }}>{PRIO_PNUM[p] || 'P?'}</span>;
  return <span title={`Prioridad ${c.label}`} style={{
    fontFamily: t.fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.03em',
    padding: '2px 7px', borderRadius: 6, color: c.fg, background: c.bg,
    boxShadow: `inset 0 0 0 1px ${c.bd}`, whiteSpace: 'nowrap', flexShrink: 0,
    fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center'
  }}>{PRIO_PNUM[p] || 'P?'}</span>;
}

function LabelTag({ label, lk, t }) {
  if (!label) return null; /* sin etiqueta → sin píldora (evita cápsulas vacías) */
  const c = t.tags[lk] || t.tags.slate;
  return <span style={{
    fontSize: 11, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI,
    letterSpacing: t.monoMeta ? '0.01em' : '-0.005em',
    padding: '3px 9px', borderRadius: t.rTag, color: c.fg, background: c.bg,
    border: t.tagBorder ? `1px solid ${c.bd || 'transparent'}` : 'none', whiteSpace: 'nowrap'
  }}>{label}</span>;
}

/* ───────────────────────── AGENDA: fila (misma que Lista, respeta cardStyle) ───────────────────────── */
function AgendaCard({ task, t, tone, idx = 0, selected, onSelect, onToggle }) {
  const [hover, setHover] = React.useState(false);
  const done = !!task.done;
  const dt = task.due ? parseDue(task.due) : null;
  const elevated = t.cardStyle === 'elevated';
  const barColor = task.prio ? PRIO[task.prio]?.bar || t.accent : t.accent;
  const dateColor = tone === 'overdue' ? '#b0473f' : tone === 'today' ? t.accentInk : t.ink3;
  const baseBg = idx % 2 && t.zebra ? t.zebraBg : 'transparent';
  const showBar = selected;
  return (
    <div
      onClick={() => onSelect && onSelect(selected ? null : task.id)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        padding: elevated ? '12px 16px 12px 18px' : t.rowPad,
        paddingLeft: showBar ? elevated ? 18 : t.rowPadX : t.rowPadX,
        borderRadius: elevated ? t.rInput : t.rowRadius,
        background: selected ? t.tintBg : hover ? t.rowHover : elevated ? t.card : baseBg,
        border: elevated ? `1px solid ${selected ? t.accent : t.border}` : 'none',
        boxShadow: elevated ? selected || hover ? '0 6px 18px -10px rgba(40,30,15,0.30)' : '0 1px 2px rgba(40,30,15,0.06)' : 'none',
        borderBottom: elevated ? `1px solid ${selected ? t.accent : t.border}` : (t.rowDivider ? `1px solid ${t.border}` : 'none'),
        minHeight: Math.max((t.rowH || 42) + 9, 51),
        transition: 'box-shadow .15s, background .12s, border-color .12s, transform .15s',
        transform: elevated && hover && !selected ? 'translateY(-1px)' : 'none'
      }}>
      {showBar && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.accent }} />}
      {/* checkbox — área clicable 28px, dibujo 19px (igual que Lista) */}
      <span role="checkbox" aria-checked={done} aria-label={`${done ? 'Reabrir' : 'Completar'}: ${task.title}`} tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onToggle && onToggle(task.id); } }}
        onClick={(e) => { e.stopPropagation(); onToggle && onToggle(task.id); }} style={{ width: 28, height: 28, margin: '0 -4px', flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        {done ?
        <span style={{ width: 19, height: 19, borderRadius: t.checkRadius, background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center' }}><Ico name="check" size={12} sw={3} /></span> :
        <span style={{ width: 19, height: 19, borderRadius: t.checkRadius, border: `1.7px solid ${hover ? t.accent : t.ink3}`, boxShadow: hover ? `0 0 0 3px ${t.tintBg}` : 'none', opacity: hover ? 0.9 : 0.55, transition: 'border-color .12s, opacity .12s, box-shadow .15s' }} />}
      </span>
      <span title={task.title} style={{
        flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 450, fontFamily: t.fontUI, color: done ? t.ink3 : t.ink,
        letterSpacing: '-0.006em', textDecoration: done ? 'line-through' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>{task.title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, opacity: done ? 0.55 : 1 }}>
        {window.PrioP && <window.PrioP p={task.prio} t={t} />}
        <LabelTag label={task.label} lk={task.lk} t={t} />
        <span style={{ fontSize: 12.5, fontWeight: 650, fontFamily: t.fontMono, color: dateColor, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{dt ? fmtRelative(dt) : 'Sin fecha'}{task.time ? ` · ${task.time}` : ''}</span>
      </div>
    </div>);

}

/* ───────────────────────── AGENDA: sección ───────────────────────── */
function AgendaSection({ label, tone, tasks, t, selectedId, onSelect, onToggle }) {
  if (!tasks.length) return null;
  const cfg = tone === 'overdue'  ? { fg: '#b0473f', strip: '#b0473f', badge: 'rgba(176,71,63,0.12)' } :
              tone === 'today'    ? { fg: t.accentInk, strip: t.accent, badge: t.tintBg } :
              tone === 'upcoming' ? { fg: t.ink2, strip: t.ink3, badge: 'rgba(110,100,80,0.10)' } :
                                    { fg: t.ink3, strip: t.border, badge: 'rgba(110,100,80,0.07)' };
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${t.border}` }}>
        <span style={{ width: 3, height: 16, borderRadius: 2, flexShrink: 0, background: cfg.strip }} />
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: t.fontDisplay, letterSpacing: '-0.01em', color: cfg.fg }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: t.fontMono, padding: '2px 8px', borderRadius: 999, background: cfg.badge, color: cfg.fg, fontVariantNumeric: 'tabular-nums', lineHeight: 1.6 }}>{tasks.length}</span>
        <span style={{ flex: 1 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: t.cardStyle === 'elevated' ? 8 : 0 }}>
        {tasks.map((tk, i) => <AgendaCard key={tk.id} task={tk} t={t} tone={tone} idx={i} selected={tk.id === selectedId} onSelect={onSelect} onToggle={onToggle} />)}
      </div>
    </div>);

}

/* ───────────────────────── AGENDA: vista ───────────────────────── */
function AgendaView({ theme: t, tasks, selectedId, onSelect, onToggle }) {
  const data = tasks || ANTASK_DATED;
  const groups = { overdue: [], today: [], upcoming: [], nodate: [] };
  data.forEach((tk) => {
    if (!tk.due) {groups.nodate.push(tk);return;}
    const d = diffDays(parseDue(tk.due));
    if (d < 0 && !tk.done) groups.overdue.push(tk);else
    if (d === 0) groups.today.push(tk);else
    if (d > 0) groups.upcoming.push(tk);
  });
  const sortByDue = (a, b) => parseDue(a.due) - parseDue(b.due);
  groups.overdue.sort(sortByDue);groups.today.sort(sortByDue);groups.upcoming.sort(sortByDue);
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '6px 26px 32px' }}>
      <div style={{ maxWidth: 932, margin: '0 auto', width: '100%' }}>
        <AgendaSection label="Vencidas" tone="overdue" tasks={groups.overdue} t={t} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
        <AgendaSection label="Hoy" tone="today" tasks={groups.today} t={t} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
        <AgendaSection label="Próximos" tone="upcoming" tasks={groups.upcoming} t={t} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
        <AgendaSection label="Sin fecha" tone="nodate" tasks={groups.nodate} t={t} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
      </div>
    </div>);

}

/* ───────────────────────── MES: vista ───────────────────────── */
function MonthView({ theme: t, tasks, selectedId, onSelect, onToggle, onGoAgenda }) {
  const data = tasks || ANTASK_DATED;
  const overdue = data.filter((tk) => tk.due && !tk.done && diffDays(parseDue(tk.due)) < 0).sort((a, b) => parseDue(a.due) - parseDue(b.due));
  const [mode, setMode] = React.useState('mes'); // 'mes' | 'semana'
  const [cursor, setCursor] = React.useState(new Date(TODAY));
  const [mesPopover, setMesPopover] = React.useState(null);
  const popoverRef = React.useRef(null);
  React.useEffect(() => {
    if (!mesPopover) return;
    const onDoc = (e) => { if (popoverRef.current && !popoverRef.current.contains(e.target)) setMesPopover(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMesPopover(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [mesPopover]);
  const year = cursor.getFullYear(), month = cursor.getMonth();

  const addDays = (d, n) => {const x = new Date(d);x.setDate(x.getDate() + n);return x;};
  const mondayOf = (d) => {const x = new Date(d);x.setDate(x.getDate() - (x.getDay() + 6) % 7);x.setHours(0, 0, 0, 0);return x;};

  // map de tareas por clave de día (global), válido para mes y semana
  const byKey = {};
  data.forEach((tk) => {
    if (!tk.due) return;
    const dt = parseDue(tk.due);
    (byKey[dayKey(dt)] = byKey[dayKey(dt)] || []).push(tk);
  });

  // celdas del mes
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const monthCells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dt = new Date(year, month, dayNum);
    monthCells.push({ i, dayNum, inMonth, isToday: inMonth && dayKey(dt) === dayKey(TODAY), tasks: inMonth ? byKey[dayKey(dt)] || [] : [] });
  }

  // celdas de la semana
  const wkMon = mondayOf(cursor);
  const wkSun = addDays(wkMon, 6);
  const weekCells = [];
  for (let i = 0; i < 7; i++) {
    const dt = addDays(wkMon, i);
    weekCells.push({ i, dt, isToday: dayKey(dt) === dayKey(TODAY), weekend: i >= 5, tasks: byKey[dayKey(dt)] || [] });
  }

  const navBtn = (dir, name) =>
  <button onClick={() => setCursor(mode === 'mes' ? new Date(year, month + dir, 1) : addDays(cursor, dir * 7))} style={{
    width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer',
    borderRadius: t.rSeg, border: `1px solid ${t.border}`, background: t.card, color: t.ink2
  }}><Ico name={name} size={17} /></button>;

  const headerLabel = mode === 'mes' ?
  `${MOL[month]} ${year}` :
  `${wkMon.getDate()} ${MO[wkMon.getMonth()]} – ${wkSun.getDate()} ${MO[wkSun.getMonth()]}`;

  const TaskChip = ({ tk }) => {
    const lc = t.tags[tk.lk] || t.tags.slate;
    const sel = tk.id === selectedId;
    return (
      <span onClick={(e) => {e.stopPropagation();onSelect && onSelect(sel ? null : tk.id);}} title={tk.title} style={{
        fontSize: 11.5, fontWeight: 600, fontFamily: t.fontUI, color: lc.fg, background: lc.bg,
        borderLeft: `2px solid ${PRIO[tk.prio]?.bar || t.accent}`,
        borderRadius: t.rTag, padding: '3px 7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer',
        textDecoration: tk.done ? 'line-through' : 'none', opacity: tk.done ? 0.6 : 1,
        boxShadow: sel ? `0 0 0 2px ${t.accent}` : 'none', transition: 'box-shadow .12s'
      }}>{tk.title}</span>);

  };

  return (
    <React.Fragment>
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', padding: '16px 26px 26px' }}>
      {/* nav + toggle Mes/Semana */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {navBtn(-1, 'chevronL')}
          <span style={{ fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 22, letterSpacing: t.titleTrack, color: t.ink, minWidth: 196, textAlign: 'center' }}>{headerLabel}</span>
          {navBtn(1, 'chevron')}
        </div>
        <div style={{ display: 'flex', gap: 2, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
          {[['mes', 'Mes'], ['semana', 'Semana']].map(([id, l]) => {
            const on = mode === id;
            return (
              <div key={id} onClick={() => setMode(id)} style={{
                padding: '6px 14px', borderRadius: t.rSeg - 3, cursor: 'pointer', fontFamily: t.fontUI,
                background: on ? t.segOn : 'transparent', color: on ? t.accentInk : t.ink2,
                fontWeight: on ? 650 : 550, fontSize: 13, boxShadow: on ? t.segShadow : 'none', transition: 'background .12s, color .12s'
              }}>{l}</div>);

          })}
        </div>
      </div>

      {overdue.length > 0 &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 14,
        background: 'rgba(176,71,63,0.09)', border: '1px solid rgba(176,71,63,0.28)', borderRadius: t.rInput, color: '#9a3a33' }}>
          <Ico name="flag" size={15} sw={2} />
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: t.fontUI, flex: 1 }}>
            {overdue.length} {overdue.length === 1 ? 'tarea vencida' : 'tareas vencidas'} · desde el {parseDue(overdue[0].due).getDate()} {MO[parseDue(overdue[0].due).getMonth()]}
          </span>
          {onGoAgenda &&
        <span onClick={onGoAgenda} style={{ fontSize: 12.5, fontWeight: 650, fontFamily: t.fontUI, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>Ver en Agenda</span>
        }
        </div>
      }

      {mode === 'mes' ?
      <React.Fragment>
          {/* cabecera días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 8, marginBottom: 8 }}>
            {['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'].map((d, i) =>
          <div key={d} style={{ fontSize: 11, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.1em', color: i >= 5 ? t.ink3 : t.ink2, textAlign: 'center', padding: '2px 0' }}>{d}</div>
          )}
          </div>
          {/* grid mes */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gridAutoRows: 'minmax(108px, 1fr)', gap: 8 }}>
            {monthCells.map((c) => {
            const shown = c.tasks.slice(0, 3);
            const extra = c.tasks.length - shown.length;
            return (
              <div key={c.i} style={{
                border: `1px solid ${c.isToday ? t.accent : t.border}`,
                background: c.isToday ? t.tintBg : c.inMonth ? t.card : 'transparent',
                borderRadius: Math.max(6, t.rowRadius + 2), padding: 8, minHeight: 0, minWidth: 0,
                display: 'flex', flexDirection: 'column', gap: 5,
                opacity: c.inMonth ? 1 : 0.45,
                boxShadow: c.inMonth ? '0 1px 2px rgba(40,30,15,0.05)' : 'none'
              }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {c.isToday ?
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, fontFamily: t.fontMono }}>{c.dayNum}</span> :
                <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: t.fontMono, color: c.inMonth ? t.ink2 : t.ink3, padding: '2px 3px' }}>{c.inMonth ? c.dayNum : ''}</span>
                }
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    {shown.map((tk) => <TaskChip key={tk.id} tk={tk} />)}
                    {extra > 0 && (
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMesPopover({ tasks: c.tasks.slice(3), x: r.left, y: r.bottom + 6 }); }}
                        style={{ fontSize: 11, fontWeight: 700, fontFamily: t.fontMono, color: t.accentInk, background: t.tintBg, border: 'none', borderRadius: t.rTag, padding: '3px 8px', cursor: 'pointer', textAlign: 'left', transition: 'opacity .12s' }}>
                        +{extra} más
                      </button>
                    )}
                  </div>
                </div>);

          })}
          </div>
        </React.Fragment> :

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 8, minHeight: 0 }}>
          {weekCells.map((c) =>
        <div key={c.i} style={{
          border: `1px solid ${c.isToday ? t.accent : t.border}`,
          background: c.isToday ? t.tintBg : t.card,
          borderRadius: Math.max(6, t.rowRadius + 2), padding: 8, minHeight: 0, minWidth: 0,
          display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: '0 1px 2px rgba(40,30,15,0.05)'
        }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.weekend ? t.ink3 : t.ink2 }}>{WD[c.dt.getDay()]}</span>
                {c.isToday ?
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: t.accent, color: t.accentOn, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, fontFamily: t.fontMono }}>{c.dt.getDate()}</span> :
            <span style={{ fontSize: 12.5, fontWeight: 600, fontFamily: t.fontMono, color: t.ink2 }}>{c.dt.getDate()}</span>
            }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden', minHeight: 0 }}>
                {c.tasks.map((tk) => <TaskChip key={tk.id} tk={tk} />)}
              </div>
            </div>
        )}
        </div>
      }
    </div>
    {mesPopover && ReactDOM.createPortal(
      <div ref={popoverRef} style={{
        position: 'fixed', left: Math.min(mesPopover.x, window.innerWidth - 244), top: Math.min(mesPopover.y, window.innerHeight - 240),
        zIndex: 9900, width: 232, background: t.card, border: `1px solid ${t.border}`,
        borderRadius: t.rInput + 2, boxShadow: '0 12px 32px -8px rgba(40,30,15,0.28), 0 2px 8px rgba(40,30,15,0.10)',
        padding: 6, fontFamily: t.fontUI, animation: 'antaskMenuIn .14s ease both'
      }}>
        <div style={{ padding: '6px 10px 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.ink3, fontFamily: t.fontMono, borderBottom: `1px solid ${t.border}`, marginBottom: 4 }}>
          {mesPopover.tasks.length} tarea{mesPopover.tasks.length !== 1 ? 's' : ''} más
        </div>
        {mesPopover.tasks.map((tk) => (
          <div key={tk.id}
            onClick={() => { onSelect && onSelect(tk.id === selectedId ? null : tk.id); setMesPopover(null); }}
            onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: t.rNav, cursor: 'pointer', transition: 'background .1s' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: (PRIO[tk.prio] && PRIO[tk.prio].bar) || t.accent }} />
            <span style={{ flex: 1, fontSize: 13, color: tk.done ? t.ink3 : t.ink, textDecoration: tk.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tk.title}</span>
          </div>
        ))}
      </div>, document.body
    )}
    </React.Fragment>);

}

window.AgendaView = AgendaView;
window.MonthView = MonthView;
window.ANTASK_DATED = ANTASK_DATED;
/* helpers compartidos para otras vistas (p. ej. Hoy) */
window.ANTASK_PRIO = PRIO;
window.ANTASK_TODAY = TODAY;
window.antaskParseDue = parseDue;
window.antaskDiffDays = diffDays;
window.antaskFmtRelative = fmtRelative;
window.antaskDayKey = dayKey;
window.ANTASK_WD = WD;
window.ANTASK_MO = MO;
window.AgendaCard = AgendaCard;
window.PrioTag = PrioTag;
window.PrioP = PrioP;
window.LabelTag = LabelTag;

/* ── ANTASK_STORE — estado unificado compartido entre HoyView e InboxView ──────────────
   Mezcla ANTASK_DATED + ANTASK_DATA.tasks deduplicando por título normalizado.
   InboxView tiene IDs numéricos (1,2…) y ANTASK_DATED usa IDs string ('a1','a2'…).
   La misma tarea real puede vivir en ambos datasets; el store la unifica y propaga
   cambios (done, due) a todos los suscriptores usando la fuente ('hoy'|'inbox') para
   evitar bucles. */
;(() => {
  let _all = null;
  const _subs = new Set();

  function _init() {
    if (_all) return;
    const inbox = ((window.ANTASK_DATA && window.ANTASK_DATA.tasks) || []).map(t => ({ ...t }));
    const dated = ANTASK_DATED.map(t => ({ ...t }));
    // Deduplicar por título: dated toma precedencia (tiene due), pero conservamos el id del inbox
    const byKey = new Map();
    inbox.forEach(t => byKey.set(t.title.trim().toLowerCase(), { ...t }));
    dated.forEach(t => {
      const k = t.title.trim().toLowerCase();
      const ex = byKey.get(k);
      byKey.set(k, ex ? { ...ex, ...t, id: ex.id } : { ...t });
    });
    _all = [...byKey.values()];
  }

  function _snap()      { return _all.map(t => ({ ...t })); }
  function _notify(src) {
    const s = _snap();
    _subs.forEach(fn => fn(s, src));
    window.dispatchEvent(new CustomEvent('antask:storechange', { detail: { tasks: s, source: src } }));
  }

  window.ANTASK_STORE = {
    getAll()               { _init(); return _snap(); },
    subscribe(fn)          { _init(); _subs.add(fn); return () => _subs.delete(fn); },
    toggle(id, src)        { _init(); _all = _all.map(t => String(t.id) === String(id) ? { ...t, done: !t.done } : t); _notify(src); },
    setDone(id, done, src) { _init(); _all = _all.map(t => String(t.id) === String(id) ? { ...t, done } : t); _notify(src); },
    update(id, patch, src) { _init(); _all = _all.map(t => String(t.id) === String(id) ? { ...t, ...patch } : t); _notify(src); },
    batchUpdate(patches, src) {
      _init();
      patches.forEach(({ id, patch }) => { _all = _all.map(t => String(t.id) === String(id) ? { ...t, ...patch } : t); });
      _notify(src);
    },
    add(task, src) { _init(); _all = [{ ...task }, ..._all]; _notify(src); },
  };
})();
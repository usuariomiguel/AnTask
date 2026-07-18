/* hoy-view.jsx — Vista "Hoy" para Antask (dirección cálida "tierra").
   Reúne en una pantalla las cuatro cosas que reclaman atención hoy:
     · VENCIDAS    — tareas con fecha pasada sin completar (+ "mover a hoy")
     · HOY         — lo que vence hoy
     · CONSULTAS   — preguntas abiertas en cualquier nota, respondibles aquí
     · SIN FECHA   — material sugerido para programar
   Reutiliza window.Sidebar/Ico/DropMenu (inbox-view), helpers de fecha y
   PrioTag/LabelTag (views), y buildNoteLines/qAnswered/noteTypes (notes-view).
   Exporta window.HoyView. */

const _hoyNow = new Date();
const HOY_TODAY_STR = `${_hoyNow.getFullYear()}-${String(_hoyNow.getMonth()+1).padStart(2,'0')}-${String(_hoyNow.getDate()).padStart(2,'0')}`;
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ───────── bloque de sección — contenedor tintado por tono ───────── */
function HoySection({ t, idx, icon, label, count, tone, action, view = 'list', children }) {
  const hexA = window.antaskHexA;
  const dark = t.mode === 'dark';
  const tones = {
    overdue: { fg: dark ? '#e08a80' : '#b0473f', base: dark ? '#d9756c' : '#b0473f' },
    today:   { fg: t.accentInk, base: t.accent },
    nodate:  { fg: dark ? '#a9c48e' : '#4a7644', base: dark ? '#8fae74' : '#4a7644' }
  };
  const c = tones[tone] || tones.nodate;
  const rad = (t.rowRadius != null ? t.rowRadius : 8) + 8;
  /* bloque sobrio: superficie neutra apenas elevada, el tono solo colorea el título */
  const blockBg = dark ? 'rgba(255,240,220,0.032)' : 'rgba(50,42,28,0.032)';
  return (
    <section style={{ marginBottom: 14, background: blockBg, border: `1px solid ${t.border}`, borderRadius: rad, padding: '11px 11px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, padding: '0 3px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.base, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 700, fontFamily: t.fontDisplay, letterSpacing: '-0.01em', color: c.fg }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: t.fontUI, color: t.ink3, fontVariantNumeric: 'tabular-nums' }}>({count})</span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${t.border}, transparent)` }} />
        {action}
      </div>
      <div style={view === 'cards'
        ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))', gap: 12, alignItems: 'start' }
        : { display: 'flex', flexDirection: 'column', gap: t.cardStyle === 'elevated' ? 6 : (t.rowDivider || t.cardStyle === 'stacked' ? 0 : 3) }}>{children}</div>
    </section>);
}

/* ───────── tarjeta de tarea (densidad equilibrada) ───────── */
function HoyTask({ task, t, tone, onToggle, onMoveToday, idx = 0, selected, onSelect, first = true, last = true, isNew = false }) {
  const [hover, setHover] = React.useState(false);
  const PRIO = window.ANTASK_PRIO;
  const done = !!task.done;
  const dt = task.due ? window.antaskParseDue(task.due) : null;
  const dark = t.mode === 'dark';
  const dateChip = tone === 'overdue'
    ? { bg: 'rgba(176,71,63,0.13)', fg: dark ? '#e89a90' : '#b0473f' }
    : tone === 'today'
    ? { bg: t.tintBg, fg: t.accentInk }
    : { bg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.045)', fg: t.ink3 };
  const actionLabel = tone === 'overdue' ? 'Mover a hoy' : tone === 'nodate' ? 'Programar hoy' : null;
  /* estilo de fila (Limpio · Líneas · Tarjetas · Compacto) dentro del bloque */
  const elevated = t.cardStyle === 'elevated';
  const stacked = t.cardStyle === 'stacked';
  const cardBorder = t.mode === 'dark' ? t.border : 'rgba(50,40,24,0.08)';
  const stackRadius = `${first ? t.rInput : 0}px ${first ? t.rInput : 0}px ${last ? t.rInput : 0}px ${last ? t.rInput : 0}px`;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => onSelect && onSelect(selected ? null : task.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 13, position: 'relative', overflow: 'hidden', cursor: 'pointer',
        padding: '10px 14px 10px 16px',
        background: selected ? t.tintBg : hover ? window.antaskHexA(t.accent, t.mode === 'dark' ? 0.10 : 0.07) : (elevated || stacked) ? t.card : 'transparent',
        border: (elevated || stacked) ? `1px solid ${selected ? t.accent : cardBorder}` : 'none',
        borderBottom: (elevated || stacked) ? `1px solid ${selected ? t.accent : cardBorder}` : (t.rowDivider && !last ? `1px solid ${t.border}` : 'none'),
        borderRadius: elevated ? t.rInput : stacked ? stackRadius : (t.rowRadius != null ? t.rowRadius : 0),
        marginTop: stacked && !first ? -1 : 0,
        marginBottom: stacked && last ? 8 : 0,
        zIndex: stacked && selected ? 1 : undefined,
        boxShadow: elevated ? (hover || selected ? '0 8px 22px -14px rgba(0,0,0,0.30)' : '0 1px 2px rgba(40,30,15,0.05)') : (!stacked && selected ? `inset 0 0 0 1px ${t.accent}` : 'none'),
        transition: 'box-shadow .15s, transform .12s, background .12s, border-color .12s',
        animation: isNew && !window.__ANTASK_NOANIM ? 'qcPop .28s cubic-bezier(0.34,1.2,0.64,1) both' : 'none',
        transform: elevated && hover && !selected ? 'translateY(-1px)' : 'none' }}>

      {selected && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.accent }} />}
      <span role="checkbox" aria-checked={done} aria-label={`${done ? 'Reabrir' : 'Completar'}: ${task.title}`} tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onToggle(task.id); } }}
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }} style={{ width: 28, height: 28, margin: -4, flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        <span style={{ width: 20, height: 20, borderRadius: t.checkRadius, display: 'grid', placeItems: 'center',
          background: done ? t.grad : 'transparent',
          border: done ? 'none' : `1.8px solid ${hover ? t.accent : t.ink3}`,
          boxShadow: !done && hover ? `0 0 0 3px ${t.tintBg}` : 'none',
          opacity: done ? 1 : hover ? 1 : 0.6, color: t.accentOn, transition: 'border-color .12s, opacity .12s, box-shadow .15s' }}>{done && <Ico name="check" size={11} sw={3} />}</span>
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 500, color: done ? t.ink3 : t.ink, letterSpacing: '-0.006em', lineHeight: 1.4, textDecoration: done ? 'line-through' : 'none', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{task.title}</span>
      {!done && window.PrioP && <window.PrioP p={task.prio} t={t} />}
      <window.LabelTag label={task.label || task.list} lk={task.lk} t={t} />
      {actionLabel && !done &&
      <button type="button" onClick={(e) => { e.stopPropagation(); onMoveToday(task.id); }} title={actionLabel} tabIndex={hover ? 0 : -1}
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '6px 11px', borderRadius: t.rSeg, cursor: 'pointer',
          opacity: hover ? 1 : 0, pointerEvents: hover ? 'auto' : 'none',
          border: `1px solid ${tone === 'overdue' ? 'rgba(176,71,63,0.4)' : t.accent}`,
          background: tone === 'overdue' ? 'rgba(176,71,63,0.10)' : t.tintBg,
          color: tone === 'overdue' ? '#b0473f' : t.accentInk, fontSize: 12, fontWeight: 650, fontFamily: t.fontUI, transition: 'opacity .14s' }}>
        <Ico name="arrowRight" size={13} sw={2.2} />{actionLabel}
      </button>}
      {dt &&
      <span style={{ flexShrink: 0, fontFamily: t.fontUI, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 7, background: dateChip.bg, color: dateChip.fg, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{window.antaskFmtRelative(dt)}{task.time ? ` · ${task.time}` : ''}</span>}
    </div>);
}

/* ───────── quick-add contextual: crea una tarea con due = hoy ───────── */
function HoyQuickAdd({ t, onAdd }) {
  const [focused, setFocused] = React.useState(false);
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef(null);
  const submit = () => {
    const title = value.trim();
    if (!title) return;
    onAdd(title);
    setValue('');
    if (inputRef.current) inputRef.current.focus();
  };
  const active = focused || value.length > 0;
  return (
    <div onClick={() => inputRef.current && inputRef.current.focus()}
      style={{ display: 'flex', alignItems: 'center', gap: 11, background: t.card, borderRadius: t.rInput,
        border: `1px solid ${active ? t.accent : (t.mode === 'dark' ? t.border : 'rgba(50,40,24,0.08)')}`, padding: '11px 15px 11px 17px', marginTop: 2, cursor: 'text',
        boxShadow: active ? `0 0 0 3px ${t.tintBg}` : '0 1px 2px rgba(40,30,15,0.05)', transition: 'border-color .12s, box-shadow .15s' }}>
      <span style={{ display: 'grid', placeItems: 'center', width: 19, height: 19, flexShrink: 0, color: t.accentInk }}><Ico name="plus" size={16} sw={2.4} /></span>
      <input ref={inputRef} value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') { setValue(''); e.currentTarget.blur(); } }}
        placeholder="Añadir una tarea para hoy…"
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 450, fontFamily: t.fontUI, color: t.ink, letterSpacing: '-0.006em' }} />
      {value.trim() &&
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={submit}
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '6px 12px', borderRadius: t.rSeg, cursor: 'pointer',
          border: 'none', background: t.accent, color: t.accentOn, fontSize: 12.5, fontWeight: 650, fontFamily: t.fontUI }}>
        <Ico name="plus" size={13} sw={2.4} />Añadir
      </button>}
    </div>);
}

/* ───────── consulta pendiente (con respuesta en línea) ───────── */
/* ───────── anillo «Progreso del día» (compacto) ───────── */
function HoyProgressRing({ t, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  const SZ = 42, R = 17, C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);
  const track = t.mode === 'dark' ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  return (
    <div title={`Progreso del día · ${done} de ${total} hechas`} style={{ position: 'relative', width: SZ, height: SZ, flexShrink: 0 }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke={track} strokeWidth={4.5} />
        <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke={t.accent} strokeWidth={4.5} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset .5s cubic-bezier(0.45,0.05,0.2,1)' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontUI, fontSize: 10.5, fontWeight: 700, lineHeight: 1, color: t.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`${pct}%`}</span>
    </div>);
}

/* ───────── resumen del encabezado ───────── */
function HoySummary({ t, n }) {
  const item = (icon, label, value, color) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Ico name={icon} size={15} sw={2} style={{ color }} />
      <span style={{ fontSize: 14, color: t.ink2 }}><strong style={{ color: t.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</strong> {label}</span>
    </div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      {n.overdue > 0 && item('flag', n.overdue === 1 ? 'vencida' : 'vencidas', n.overdue, '#b0473f')}
      {item('sun', 'para hoy', n.today, t.accentInk)}
    </div>);
}

/* ───────── vista ───────── */
function HoyView({ theme: t, mode = 'manual', tw, setTweak, embed = false, hidden = false }) {
  const todayDt = window.ANTASK_TODAY;
  const [tasks, setTasks] = React.useState(() =>
    window.ANTASK_STORE ? window.ANTASK_STORE.getAll() : (window.ANTASK_DATED || []).map((x) => ({ ...x }))
  );

  /* Suscribirse al store — refleja cambios de InboxView (y otras vistas) en tiempo real */
  React.useEffect(() => {
    if (!window.ANTASK_STORE) return;
    return window.ANTASK_STORE.subscribe((newTasks, source) => {
      if (source === 'hoy') return; // evitar bucle
      setTasks(newTasks);
    });
  }, []);
  const diffDays = window.antaskDiffDays;
  const parseDue = window.antaskParseDue;

  const onToggle = (id) => {
    const task = tasks.find((x) => String(x.id) === String(id));
    setTasks((ts) => ts.map((x) => String(x.id) === String(id) ? { ...x, done: !x.done } : x));
    if (window.ANTASK_STORE) window.ANTASK_STORE.toggle(id, 'hoy');
    if (task && !task.done) {
      showUndoToast('Tarea completada', () => {
        setTasks((ts) => ts.map((x) => String(x.id) === String(id) ? { ...x, done: false } : x));
        if (window.ANTASK_STORE) window.ANTASK_STORE.setDone(id, false, 'hoy');
        dismissToast();
      });
    } else {
      dismissToast();
    }
  };
  const onMoveToday = (id) => {
    setTasks((ts) => ts.map((x) => String(x.id) === String(id) ? { ...x, due: HOY_TODAY_STR } : x));
    if (window.ANTASK_STORE) window.ANTASK_STORE.update(id, { due: HOY_TODAY_STR }, 'hoy');
  };
  const onAddToday = (title) => {
    const newTask = { id: `hoy-${Date.now()}`, title, due: HOY_TODAY_STR, done: false };
    setTasks((ts) => [...ts, newTask]);
    setNewId(newTask.id);
    if (window.ANTASK_STORE) window.ANTASK_STORE.add(newTask, 'hoy');
  };
  const onScheduleAllNodate = () => {
    const patches = tasks
      .filter(x => !x.due && !x.done)
      .map(x => ({ id: x.id, patch: { due: HOY_TODAY_STR } }));
    setTasks((ts) => ts.map((x) => !x.due && !x.done ? { ...x, due: HOY_TODAY_STR } : x));
    if (window.ANTASK_STORE && patches.length) window.ANTASK_STORE.batchUpdate(patches, 'hoy');
  };
  const onMoveAll = () => {
    const patches = tasks
      .filter(x => x.due && !x.done && diffDays(parseDue(x.due)) < 0)
      .map(x => ({ id: x.id, patch: { due: HOY_TODAY_STR } }));
    setTasks((ts) => ts.map((x) => x.due && !x.done && diffDays(parseDue(x.due)) < 0 ? { ...x, due: HOY_TODAY_STR } : x));
    if (window.ANTASK_STORE && patches.length) window.ANTASK_STORE.batchUpdate(patches, 'hoy');
  };

  /* selección + panel de detalle — mismo patrón que Inbox */
  const [selectedId, setSelectedId] = React.useState(null);
  const [newId, setNewId] = React.useState(null); /* última tarea creada — anima su entrada */
  const editTask = (id, patch) => {
    setTasks((ts) => ts.map((x) => String(x.id) === String(id) ? { ...x, ...patch } : x));
    if (window.ANTASK_STORE && patch.due !== undefined) window.ANTASK_STORE.update(id, { due: patch.due }, 'hoy');
  };
  const deleteTask = (id) => {
    const task = tasks.find((x) => String(x.id) === String(id));
    const idx = tasks.findIndex((x) => String(x.id) === String(id));
    setTasks((ts) => ts.filter((x) => String(x.id) !== String(id)));
    setSelectedId(null);
    showUndoToast('Tarea eliminada', () => {
      setTasks((ts) => { const next = [...ts]; next.splice(idx, 0, task); return next; });
      dismissToast();
    });
  };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Toast "Deshacer" — misma red de seguridad que el Inbox al completar */
  const [toast, setToast] = React.useState(null);
  const undoTimer = React.useRef(null);
  const dismissToast = React.useCallback(() => { clearTimeout(undoTimer.current); setToast(null); }, []);
  const showUndoToast = React.useCallback((label, onUndo) => {
    clearTimeout(undoTimer.current);
    setToast({ label, onUndo });
    undoTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  React.useEffect(() => () => clearTimeout(undoTimer.current), []);

  // grupos de tareas
  const overdue = [], today = [], nodate = [];
  tasks.forEach((tk) => {
    if (!tk.due) { if (!tk.done) nodate.push(tk); return; }
    const d = diffDays(parseDue(tk.due));
    if (d < 0 && !tk.done) overdue.push(tk);
    else if (d === 0) today.push(tk);
  });
  const byDue = (a, b) => parseDue(a.due) - parseDue(b.due);
  overdue.sort(byDue); today.sort(byDue);

  const counts = { overdue: overdue.length, today: today.length };
  const allClear = overdue.length === 0 && today.length === 0;
  const hoyDone = today.filter((x) => x.done).length;

  const floating = t.shell === 'floating';
  const _fechaRaw = `${DIAS[todayDt.getDay()]}, ${todayDt.getDate()} de ${MESES[todayDt.getMonth()]}`;
  const fecha = _fechaRaw.charAt(0).toUpperCase() + _fechaRaw.slice(1); /* solo la inicial — no cada palabra */

  const mainEl = (
      <main style={{ flex: 1, minWidth: 0, display: hidden ? 'none' : 'flex', flexDirection: 'column',
        background: floating ? t.shellPanel : 'transparent', borderRadius: floating ? t.rInput + 4 : 0,
        border: floating ? `1px solid ${t.border}` : 'none', boxShadow: floating ? t.shellShadow : 'none',
        overflow: floating ? 'hidden' : 'visible' }}>
        {/* encabezado compacto — título + fecha, progreso discreto a la derecha */}
        <div style={{ padding: '15px 26px 13px', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ maxWidth: 932, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: Math.round(t.titleSize * 0.95), letterSpacing: t.titleTrack, color: t.ink, whiteSpace: 'nowrap' }}>Hoy</h1>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: t.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{fecha}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 13, fontWeight: 550, color: t.ink2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {hoyDone} de {overdue.length + today.length} hechas
            {counts.overdue > 0 && <span style={{ color: '#b0473f', fontWeight: 650 }}> · {counts.overdue} vencida{counts.overdue === 1 ? '' : 's'}</span>}
          </span>
          <HoyProgressRing t={t} done={hoyDone} total={overdue.length + today.length} />
          {setTweak && window.RowStylePicker && <window.RowStylePicker t={t} tw={tw} setTweak={setTweak} compact />}
          </div>
        </div>

        {/* cuerpo */}
        <div style={{ flex: 1, overflow: 'auto', padding: '22px 26px 96px', boxSizing: 'border-box' }}>
          <div data-antask-content style={{ maxWidth: 932, margin: '0 auto' }}>
            {allClear &&
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '52px 0 30px', color: t.ink3, textAlign: 'center' }}>
              <span style={{ width: 56, height: 56, borderRadius: '50%', background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk }}><Ico name="check2" size={28} /></span>
              <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 20, color: t.ink2 }}>Todo al día</div>
              <div style={{ fontSize: 14, maxWidth: 320 }}>No tienes nada vencido ni ninguna tarea para hoy.</div>
            </div>}

            {allClear &&
            <HoySection t={t} icon="sun" label="Para hoy" count={0} tone="today">
              <HoyQuickAdd t={t} onAdd={onAddToday} />
            </HoySection>}

            {overdue.length > 0 &&
            <HoySection t={t} icon="flag" label="Vencidas" count={overdue.length} tone="overdue"
              action={
              <button type="button" onClick={onMoveAll}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(176,71,63,0.17)'; e.currentTarget.style.borderColor = 'rgba(176,71,63,0.52)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(176,71,63,0.09)'; e.currentTarget.style.borderColor = 'rgba(176,71,63,0.32)'; }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: t.rSeg, cursor: 'pointer', border: '1px solid rgba(176,71,63,0.32)', background: 'rgba(176,71,63,0.09)', color: '#b0473f', fontSize: 12.5, fontWeight: 650, fontFamily: t.fontUI, transition: 'background .12s, border-color .12s' }}>
                <Ico name="arrowRight" size={14} sw={2.2} />Mover todas a hoy
              </button>}>
              {overdue.map((tk, i) => <HoyTask key={tk.id} task={tk} t={t} tone="overdue" idx={i} first={i === 0} last={i === overdue.length - 1} onToggle={onToggle} onMoveToday={onMoveToday} selected={selectedId === tk.id} onSelect={setSelectedId} />)}
            </HoySection>}

            {!allClear &&
            <HoySection t={t} icon="sun" label="Para hoy" count={`${hoyDone}/${today.length}`} tone="today">
              {today.map((tk, i) => <HoyTask key={tk.id} task={tk} t={t} tone="today" idx={i} first={i === 0} last={i === today.length - 1} isNew={String(tk.id) === String(newId)} onToggle={onToggle} onMoveToday={onMoveToday} selected={selectedId === tk.id} onSelect={setSelectedId} />)}
              <HoyQuickAdd t={t} onAdd={onAddToday} />
            </HoySection>}

            {nodate.length > 0 &&
            <HoySection t={t} icon="inbox" label="Sin fecha · sugeridas" count={nodate.length} tone="nodate"
              action={
              <button type="button" onClick={onScheduleAllNodate}
                onMouseEnter={(e) => { const d = t.mode === 'dark'; e.currentTarget.style.background = d ? 'rgba(143,174,116,0.18)' : 'rgba(74,118,68,0.15)'; e.currentTarget.style.borderColor = d ? 'rgba(143,174,116,0.6)' : 'rgba(74,118,68,0.5)'; }}
                onMouseLeave={(e) => { const d = t.mode === 'dark'; e.currentTarget.style.background = d ? 'rgba(143,174,116,0.10)' : 'rgba(74,118,68,0.08)'; e.currentTarget.style.borderColor = d ? 'rgba(143,174,116,0.4)' : 'rgba(74,118,68,0.32)'; }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: t.rSeg, cursor: 'pointer', border: `1px solid ${t.mode === 'dark' ? 'rgba(143,174,116,0.4)' : 'rgba(74,118,68,0.32)'}`, background: t.mode === 'dark' ? 'rgba(143,174,116,0.10)' : 'rgba(74,118,68,0.08)', color: t.mode === 'dark' ? '#a9c48e' : '#4a7644', fontSize: 12.5, fontWeight: 650, fontFamily: t.fontUI, transition: 'background .12s, border-color .12s' }}>
                <Ico name="arrowRight" size={14} sw={2.2} />Programar todas hoy
              </button>}>
              {nodate.map((tk, i) => <HoyTask key={tk.id} task={tk} t={t} tone="nodate" idx={i} first={i === 0} last={i === nodate.length - 1} onToggle={onToggle} onMoveToday={onMoveToday} selected={selectedId === tk.id} onSelect={setSelectedId} />)}
            </HoySection>}
          </div>
        </div>
      </main>);

  const selectedTask = tasks.find((x) => String(x.id) === String(selectedId)) || null;
  const detailEl = (
    <div style={{ width: selectedTask ? 340 : 62, flexShrink: 0, overflow: 'hidden', transition: 'width .32s cubic-bezier(0.45,0.05,0.2,1)', display: hidden ? 'none' : 'flex' }}>
      {selectedTask && window.DetailPanel ?
      <window.DetailPanel t={t} task={selectedTask} onClose={() => setSelectedId(null)} onEdit={editTask} onToggle={onToggle} onDelete={deleteTask} /> :
      window.DetailRail ? <window.DetailRail t={t} /> : null}
    </div>);

  if (embed) return <React.Fragment>{mainEl}{detailEl}{window.UndoToast && <window.UndoToast t={t} toast={toast} onUndo={() => { toast && toast.onUndo && toast.onUndo(); }} onClose={dismissToast} />}</React.Fragment>;
  return (
    <div style={{ display: 'flex', height: '100%', gap: floating ? 10 : 0, padding: floating ? 10 : 0, boxSizing: 'border-box', background: floating ? t.desk : t.canvas, color: t.ink, fontFamily: t.fontUI }}>
      <Sidebar t={t} active="Hoy" tw={tw} setTweak={setTweak} />
      {mainEl}
      {detailEl}
      {window.UndoToast && <window.UndoToast t={t} toast={toast} onUndo={() => { toast && toast.onUndo && toast.onUndo(); }} onClose={dismissToast} />}
    </div>);
}

window.HoyView = HoyView;

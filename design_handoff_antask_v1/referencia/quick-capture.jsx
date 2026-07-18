/* quick-capture.jsx — Captura rápida (Ctrl + ⇧ + Espacio).
   Overlay centrado de escritorio para crear una tarea sin salir de la vista actual.
   Exporta window.QuickCapture y window.QuickCaptureKbd. */

const { Ico } = window;

/* Tecla física — se ve como una tecla de teclado de PC */
function Kbd({ children, t, wide = false, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: wide ? 64 : 26, height: 26, padding: wide ? '0 12px' : '0 7px',
      fontFamily: t.fontMono, fontSize: 12, fontWeight: 600, color: t.ink2,
      background: t.kbdBg, borderRadius: 6,
      border: `1px solid ${t.border}`,
      boxShadow: `0 1.5px 0 ${t.border}`,
      lineHeight: 1,
      ...style,
    }}>{children}</span>
  );
}
window.QuickCaptureKbd = Kbd;

/* Parser ligero: extrae prioridad (p1–p3 / !1–!3), lista (#nombre) y
   fecha (hoy / mañana) del texto; devuelve el título limpio y los metadatos. */
const PRIO_MAP = { '1': 'alta', '2': 'media', '3': 'baja' };
function parseInput(raw) {
  let title = raw;
  let prio = null, list = null, due = null, dueLabel = null;

  title = title.replace(/(?:^|\s)[p!]([123])\b/gi, (m, n) => { prio = PRIO_MAP[n]; return ' '; });
  title = title.replace(/(?:^|\s)#([^\s#]+)/g, (m, n) => { list = n; return ' '; });
  title = title.replace(/(?:^|\s)(hoy|mañana|manana)\b/gi, (m, w) => {
    const d = new Date();
    if (/ana$/i.test(w)) d.setDate(d.getDate() + 1);
    due = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dueLabel = /ana$/i.test(w) ? 'Mañana' : 'Hoy';
    return ' ';
  });

  return { title: title.replace(/\s+/g, ' ').trim(), prio, list, due, dueLabel };
}

const PRIO_LABEL = { alta: 'P1 · Alta', media: 'P2 · Media', baja: 'P3 · Baja' };
const PRIO_COLOR = { alta: '#d2603a', media: '#c98a3c', baja: '#7c8a52' };

function QuickCapture({ theme: t, defaultList, onCreate, onClose }) {
  const [raw, setRaw] = React.useState('');
  const [list, setList] = React.useState(defaultList || null);
  const [prio, setPrio] = React.useState(null);
  const [dueKey, setDueKey] = React.useState(null); // 'hoy' | 'mañana' | null
  const [saved, setSaved] = React.useState(false);
  const [listPickerOpen, setListPickerOpen] = React.useState(false);
  const allLists = React.useMemo(() => {
    const out = [];
    ((window.ANTASK_DATA && window.ANTASK_DATA.groups) || []).forEach((g) => {
      (g.items || []).forEach((it) => out.push(it.name));
    });
    return out;
  }, []);
  const inputRef = React.useRef(null);
  const cardRef = React.useRef(null);

  const parsed = parseInput(raw);
  // los chips manuales tienen prioridad sobre lo parseado del texto
  const finalPrio = prio || parsed.prio;
  const finalList = list || parsed.list;
  const finalDue = dueKey
    ? (() => { const d = new Date(); if (dueKey === 'mañana') d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
    : parsed.due;
  const finalDueLabel = dueKey ? (dueKey === 'mañana' ? 'Mañana' : 'Hoy') : parsed.dueLabel;
  const canSave = parsed.title.length > 0;

  React.useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current && inputRef.current.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const submit = () => {
    if (!canSave) return;
    const task = {
      id: 'qc-' + Date.now(),
      title: parsed.title,
      done: false,
      prio: finalPrio || null,
      list: finalList || undefined,
      due: finalDue || undefined,
    };
    onCreate(task);
    setRaw(''); setList(null); setPrio(null); setDueKey(null);
    onClose();
  };

  const onInputKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  const chipBase = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px',
    borderRadius: t.rPill, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${t.border}`, background: 'transparent', color: t.ink2,
    fontFamily: t.fontUI, transition: 'all .12s', whiteSpace: 'nowrap',
  };
  const chipOn = (on, color) => on ? {
    background: t.tintBg, border: `1px solid ${(color || t.accentInk) + '66'}`, color: color || t.accentInk,
  } : {};

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
        background: t.mode === 'dark' ? 'rgba(8,6,4,0.62)' : 'rgba(40,32,18,0.34)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        animation: window.__ANTASK_NOANIM ? 'none' : 'qcFade .14s ease-out',
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: 'min(620px, calc(100vw - 40px))',
          background: t.card, color: t.ink,
          borderRadius: Math.max(14, t.rInput + 6),
          border: `1px solid ${t.border}`,
          boxShadow: t.shellShadow,
          fontFamily: t.fontUI,
          animation: window.__ANTASK_NOANIM ? 'none' : 'qcPop .18s cubic-bezier(.2,.9,.3,1.2)',
        }}
      >
        {/* encabezado con el atajo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 18px', borderBottom: `1px solid ${t.border}`,
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            background: t.tintBg, color: t.accentInk,
            display: 'grid', placeItems: 'center',
          }}><Ico name="sparkles" size={15} sw={2} /></span>
          <span style={{ fontSize: 13.5, fontWeight: 650, letterSpacing: '-0.01em', color: t.ink2 }}>Captura rápida</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Kbd t={t}>Ctrl</Kbd>
            <span style={{ fontSize: 11, color: t.ink3 }}>+</span>
            <Kbd t={t}>⇧</Kbd>
            <span style={{ fontSize: 11, color: t.ink3 }}>+</span>
            <Kbd t={t} wide>Espacio</Kbd>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, marginLeft: 6,
              borderRadius: 8, border: `1px solid ${t.border}`,
              background: 'transparent', color: t.ink3,
              cursor: 'pointer', flexShrink: 0, transition: 'background .12s, color .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.rowHover; e.currentTarget.style.color = t.ink; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.ink3; }}
          >
            <Ico name="x" size={16} sw={2.2} />
          </button>
        </div>

        {/* campo principal */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 18px 8px' }}>
          <input
            ref={inputRef}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="¿Qué hay que hacer?"
            style={{
              maxWidth: 932, width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: 20, fontWeight: 500, fontFamily: t.fontUI, color: t.ink,
              letterSpacing: '-0.015em', padding: '8px 0', textAlign: 'center',
            }}
          />
        </div>

        {/* meta detectada en el texto */}
        {(parsed.prio || parsed.list || parsed.dueLabel) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 18px 0', justifyContent: 'center' }}>
            {parsed.dueLabel && !dueKey && <DetectedPill t={t} icon="calendar" label={parsed.dueLabel} />}
            {parsed.list && !list && <DetectedPill t={t} icon="hash-text" label={parsed.list} />}
            {parsed.prio && !prio && <DetectedPill t={t} icon="flag" label={PRIO_LABEL[parsed.prio]} color={PRIO_COLOR[parsed.prio]} />}
          </div>
        )}

        {/* chips de acción */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, padding: '12px 18px 6px', justifyContent: 'center' }}>
          <button type="button" style={{ ...chipBase, ...chipOn(dueKey === 'hoy') }}
            onClick={() => setDueKey(dueKey === 'hoy' ? null : 'hoy')}>
            <Ico name="sun" size={13} sw={2} /> Hoy
          </button>
          <button type="button" style={{ ...chipBase, ...chipOn(dueKey === 'mañana') }}
            onClick={() => setDueKey(dueKey === 'mañana' ? null : 'mañana')}>
            <Ico name="calendar" size={12} sw={2} /> Mañana
          </button>
          <span style={{ width: 1, height: 18, background: t.border, margin: '0 2px' }} />
          {['alta', 'media', 'baja'].map((p) => (
            <button key={p} type="button" style={{ ...chipBase, ...chipOn(finalPrio === p, PRIO_COLOR[p]) }}
              onClick={() => setPrio(prio === p ? null : (parsed.prio === p ? null : p))}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: PRIO_COLOR[p] }} />
              {p === 'alta' ? 'P1' : p === 'media' ? 'P2' : 'P3'}
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: t.border, margin: '0 2px' }} />
          {/* selector de lista con desplegable */}
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => setListPickerOpen((v) => !v)}
            style={{ ...chipBase, ...chipOn(!!finalList), position: 'relative', zIndex: 99 }}>
              <Ico name="inbox" size={12} sw={2} />
              {finalList || 'Inbox'}
              <Ico name="chevron" size={11} sw={2} style={{ transform: listPickerOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s', marginLeft: 1 }} />
            </button>
            {listPickerOpen && (
              <>
                <div onClick={() => setListPickerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 200, background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 2, boxShadow: '0 -8px 28px rgba(0,0,0,0.15)', minWidth: 172, overflow: 'hidden' }}>
                  {[{ name: null, label: 'Inbox' }, ...allLists.map((n) => ({ name: n, label: n }))].map(({ name, label }) => {
                    const on = finalList === name || (!finalList && !name);
                    return (
                      <div key={String(name)} onClick={() => { setList(name); setListPickerOpen(false); }} onMouseDown={(e) => e.preventDefault()}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', cursor: 'pointer',
                        background: on ? t.tintBg : 'transparent', color: on ? t.accentInk : t.ink,
                        fontSize: 13, fontWeight: on ? 600 : 450, transition: 'background .1s' }}>
                        <span style={{ width: 14, display: 'flex', flexShrink: 0 }}>{on && <Ico name="check" size={12} sw={3} />}</span>
                        {label}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* pie */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', marginTop: 6,
          borderTop: `1px solid ${t.border}`,
          background: t.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)',
        }}>
          <span style={{ fontSize: 12, color: t.ink3, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ opacity: 0.85 }}>Escribe</span>
            <code style={{ fontFamily: t.fontMono, fontSize: 11, padding: '2px 6px', borderRadius: 5, background: t.kbdBg, color: t.ink2 }}>hoy</code>
            <code style={{ fontFamily: t.fontMono, fontSize: 11, padding: '2px 6px', borderRadius: 5, background: t.kbdBg, color: t.ink2 }}>#lista</code>
            <code style={{ fontFamily: t.fontMono, fontSize: 11, padding: '2px 6px', borderRadius: 5, background: t.kbdBg, color: t.ink2 }}>p1</code>
            <span style={{ opacity: 0.85 }}>para autocompletar</span>
          </span>
          <div style={{ flex: 1 }} />
          {saved && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: PRIO_COLOR.baja }}>
              <Ico name="check2" size={14} sw={2.6} /> Añadida al Inbox
            </span>
          )}
          <button type="button" onClick={submit} disabled={!canSave}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 15px', borderRadius: t.rInput, border: 'none',
              fontFamily: t.fontUI, fontSize: 13.5, fontWeight: 650, letterSpacing: '-0.01em',
              cursor: canSave ? 'pointer' : 'not-allowed',
              background: canSave ? t.accent : t.kbdBg,
              color: canSave ? t.accentOn : t.ink3,
              opacity: canSave ? 1 : 0.7, transition: 'all .12s',
            }}>
            <span style={{ color: t.accentOn }}>Añadir tarea</span>
            <Kbd t={t} style={{ color: t.accentOn, background: window.antaskHexA ? window.antaskHexA(t.accentOn, 0.16) : 'transparent', borderColor: window.antaskHexA ? window.antaskHexA(t.accentOn, 0.45) : t.accentOn, boxShadow: `0 1.5px 0 ${window.antaskHexA ? window.antaskHexA(t.accentOn, 0.45) : t.accentOn}` }}>↵</Kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

function DetectedPill({ t, icon, label, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: t.rTag, fontSize: 11.5, fontWeight: 600,
      fontFamily: t.monoMeta ? t.fontMono : t.fontUI,
      background: t.tintBg, color: color || t.accentInk,
    }}>
      {icon === 'hash-text'
        ? <span style={{ fontWeight: 800 }}>#</span>
        : <Ico name={icon} size={11} sw={2} />}
      {label}
    </span>
  );
}

window.QuickCapture = QuickCapture;

/* animaciones del overlay (una sola vez) */
if (!document.getElementById('qc-anim')) {
  const s = document.createElement('style');
  s.id = 'qc-anim';
  s.textContent = `
    @keyframes qcFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes qcPop { from { opacity: 0; transform: translateY(-8px) scale(.985) } to { opacity: 1; transform: none } }
    @keyframes qcFlash { 0%,55% { background: var(--qc-flash, rgba(173,82,48,0.10)) } 100% { background: transparent } }
  `;
  document.head.appendChild(s);
}

/* notes-view.jsx — Vista Notas para Antask, estilo Apple Notes.
   Modelo B+C combinado:
     · LISTA (esqueleto)   → notas a la izquierda + nota abierta a la derecha.
     · DOCUMENTO VIVO      → dentro de cada nota, cada LÍNEA puede ser
                              texto · tarea · consulta (clic en el margen).
   Variantes de presentación: 'lista' (principal) y 'tablon' (galería).
   Reutiliza window.Sidebar + window.Ico de inbox-view.
   Exporta window.NotesView. */

/* placeholder para el campo de respuesta editable (contentEditable) */
if (typeof document !== 'undefined' && !document.getElementById('notes-view-css')) {
  const s = document.createElement('style');
  s.id = 'notes-view-css';
  s.textContent = '.av-ans:empty:before{content:attr(data-ph);opacity:.55;pointer-events:none;}';
  document.head.appendChild(s);
}

/* una consulta se considera CERRADA cuando tiene respuesta escrita */
function qAnswered(l) {return !!(l.answer && l.answer.trim());}

const NOTES_DATA = [
{ id: 1, type: 'consulta', pin: true, title: '¿El seguro de buceo cubre Almuñécar?', body: 'Confirmar con el centro PADI la cobertura en inmersiones fuera de la zona habitual antes de reservar.', date: '9 jun', list: 'Buceo' },
{ id: 2, type: 'nota', pin: true, title: 'Equipo de buceo — checklist', body: 'Repasar el material antes de salir.', date: '8 jun', list: 'Buceo' },
{ id: 3, type: 'nota', title: 'Anthropic — tesis de inversión', body: 'Salida a bolsa prevista para octubre. Revisar múltiplos frente a comparables y definir tamaño de posición antes del Q3.', date: '7 jun', list: 'inversion' },
{ id: 4, type: 'tarea', title: 'Renovar el certificado PADI', body: 'Subir la foto de perfil y enviar el PDF del WhatsApp al instructor.', date: '7 jun', list: 'Buceo', done: false },
{ id: 5, type: 'nota', title: 'Ideas para la app', body: 'En móvil, que cada captura pueda ser tarea, nota o consulta.', date: '6 jun' },
{ id: 6, type: 'consulta', title: '¿Horario del autobús a Almuñécar?', body: 'Mirar las salidas de la mañana del sábado y si para cerca del centro de buceo.', date: '6 jun', list: 'Buceo' },
{ id: 7, type: 'nota', title: 'Firma digital — pasos', body: 'Trámite para obtener el certificado.', date: '5 jun', list: 'Firma Digital' },
{ id: 8, type: 'consulta', title: '¿Fecha límite de la licitación?', body: 'Confirmar el plazo de presentación y la documentación obligatoria.', date: '4 jun', list: 'Licitaciones' },
{ id: 9, type: 'nota', title: 'Reunión de formación', body: 'Calendario del curso, materiales pendientes y fechas de evaluación.', date: '3 jun', list: 'Formación' },
{ id: 10, type: 'tarea', title: 'Reservar vacaciones de agosto', body: 'Bloquear la semana del 12 y avisar al equipo.', date: '2 jun', list: 'Vacaciones', done: true },
{ id: 11, type: 'nota', title: 'Accesos y contraseñas', body: 'Gestor actualizado. Revisar el 2FA en las cuentas críticas.', date: '1 jun' },
{ id: 12, type: 'nota', title: 'Lista de la compra', body: 'Arroz · azafrán · pimiento · pollo · garrofó · aceite.', date: '31 may' }];


/* líneas por nota — el cuerpo "vivo". Si una nota no aparece aquí,
   se genera una sola línea de texto a partir de su body. */
const NOTE_LINES = {
  1: [
  { kind: 'consulta', text: '¿El seguro cubre inmersiones fuera de la zona habitual?' },
  { kind: 'text', text: 'El centro de Almuñécar trabaja con otra aseguradora; conviene verificar antes de pagar la salida.' },
  { kind: 'tarea', text: 'Llamar al centro PADI para confirmar la cobertura', done: false },
  { kind: 'tarea', text: 'Guardar el justificante en la carpeta de Buceo', done: false }],

  2: [
  { kind: 'text', text: 'Repasar el material la noche antes de salir:' },
  { kind: 'tarea', text: 'Regulador revisado', done: true },
  { kind: 'tarea', text: 'Neopreno 5 mm', done: false },
  { kind: 'tarea', text: 'Ordenador de buceo cargado', done: false },
  { kind: 'tarea', text: 'Boya de señalización', done: false },
  { kind: 'consulta', text: '¿Hace falta linterna para la inmersión de la tarde?' }],

  5: [
  { kind: 'text', text: 'En móvil, cada captura puede ser tarea, nota o consulta.' },
  { kind: 'text', text: 'El tipo se decide al escribir y se puede cambiar después sin perder el texto.' },
  { kind: 'tarea', text: 'Prototipar el selector de tipo', done: false },
  { kind: 'consulta', text: '¿Merece la pena un atajo de teclado por cada tipo?', answer: 'Solo para tarea y consulta; el texto queda como estado por defecto.' }],

  7: [
  { kind: 'tarea', text: 'Solicitar el certificado', done: true },
  { kind: 'tarea', text: 'Verificar identidad en la oficina', done: false },
  { kind: 'tarea', text: 'Descargar e instalar el certificado', done: false },
  { kind: 'consulta', text: '¿Sirve el mismo certificado para la sede de Hacienda?', answer: 'Sí, el mismo certificado vale para la sede electrónica de Hacienda.' }]

};

function buildLines() {
  const map = {};
  NOTES_DATA.forEach((n) => {
    const seed = NOTE_LINES[n.id] || [{ kind: 'text', text: n.body }];
    map[n.id] = seed.map((l, j) => ({ ...l, id: j + 1 }));
  });
  return map;
}

/* tipo → metadatos visuales (derivados del tema) */
function noteTypes(t) {
  const dark = t.mode === 'dark';
  const consultaFg = t.consultaFg || (dark ? '#7fd0c0' : '#3d6e85');
  const consultaBg = t.consultaBg || (dark ? 'rgba(95,179,163,0.16)' : 'rgba(61,110,133,0.13)');
  const neutralBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(60,48,30,0.06)';
  return {
    nota: { key: 'nota', label: 'Nota', icon: 'pilcrow', fg: t.ink2, bg: neutralBg },
    tarea: { key: 'tarea', label: 'Tarea', icon: 'check', fg: t.accentInk, bg: t.tintBg },
    consulta: { key: 'consulta', label: 'Consulta', icon: 'help', fg: consultaFg, bg: consultaBg }
  };
}
const TYPE_CYCLE = ['nota', 'tarea', 'consulta'];
function listDot(t, list) {return list && t.listColors[list] || t.ink3;}

/* tipo DEDUCIDO de una nota a partir de su contenido vivo.
   El eje real no es nota/tarea/consulta, sino "¿tiene un ciclo que se cierra?":
     · consulta sin responder  → se comporta como Consulta (pendiente de respuesta)
     · tarea abierta           → se comporta como Tarea (pendiente de hacer)
     · todo cerrado o solo texto → Nota (material de referencia) */
function deriveType(lines) {
  const ls = lines || [];
  const openQ = ls.some((l) => l.kind === 'consulta' && !qAnswered(l));
  const openT = ls.some((l) => l.kind === 'tarea' && !l.done);
  if (openQ) return 'consulta';
  if (openT) return 'tarea';
  return 'nota';
}

/* tipo EFECTIVO según el modelo activo:
     · manual  → el que fijó el usuario (note.type)
     · derived → siempre deducido del contenido
     · hybrid  → deducido salvo que la nota esté fijada (note.auto === false) */
function effType(n, lines, mode) {
  if (mode === 'derived') return deriveType(lines);
  if (mode === 'hybrid') return n.auto ? deriveType(lines) : n.type;
  return n.type;
}

/* ───────── átomos ───────── */
function TypeBadge({ m, t, withLabel = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 650,
      fontFamily: t.monoMeta ? t.fontMono : t.fontUI, letterSpacing: t.monoMeta ? '0.02em' : '0',
      padding: withLabel ? '3px 9px 3px 7px' : 4, borderRadius: t.rTag, color: m.fg, background: m.bg, whiteSpace: 'nowrap' }}>
      <Ico name={m.icon} size={12} sw={2} />{withLabel && m.label}
    </span>);
}

function NotesHeader({ t, variant, setVariant, count }) {
  const segs = [
  { id: 'lista', ic: 'list', l: 'Lista' },
  { id: 'tablon', ic: 'grid', l: 'Tablón' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 26px 14px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: t.titleSize, letterSpacing: t.titleTrack, color: t.ink }}>Notas</h1>
        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI, padding: '4px 8px', borderRadius: t.rPill, color: t.ink2, background: t.tintBg, fontVariantNumeric: 'tabular-nums' }}>{count} notas</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
        <div style={{ display: 'flex', gap: 2, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
          {segs.map((v) => {
            const on = v.id === variant;
            return (
              <div key={v.id} onClick={() => setVariant(v.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: t.rSeg - 3, cursor: 'pointer',
                background: on ? t.segOn : 'transparent', color: on ? t.accentInk : t.ink2,
                fontWeight: on ? 650 : 550, fontSize: 13, boxShadow: on ? t.segShadow : 'none', transition: 'background .12s, color .12s' }}>
                <Ico name={v.ic} size={15} /><span>{v.l}</span>
              </div>);
          })}
        </div>
      </div>
    </div>);
}

/* ───────── línea viva: texto · tarea · consulta ───────── */
function VivaLine({ ln, t, types, onSetKind, onToggle, onAnswer, onSendToInbox }) {
  const [hover, setHover] = React.useState(false);
  const ansRef = React.useRef(null);
  const m = types[ln.kind === 'text' ? 'nota' : ln.kind];
  const answered = ln.kind === 'consulta' && qAnswered(ln);
  React.useEffect(() => {
    if (ansRef.current && ansRef.current.textContent !== (ln.answer || '')) ansRef.current.textContent = ln.answer || '';
  }, [ln.answer]);
  const focusAns = () => {
    const el = ansRef.current;
    if (!el) return;
    el.focus();
    const r = document.createRange();r.selectNodeContents(el);r.collapse(false);
    const sel = window.getSelection();sel.removeAllRanges();sel.addRange(r);
  };
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: '5px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        {/* margen: menú de conversión de la línea (texto · tarea · consulta) */}
        <DropMenu t={t} surface="paper" align="left" placement="bottom" width={190}
        sections={[
        [{ heading: 'Convertir en' },
        ...TYPE_CYCLE.map((k) => ({ icon: types[k].icon, label: types[k].label, onClick: () => onSetKind(ln.id, k) }))],
        ...(ln.kind === 'tarea' ? [[
        ln.linked ?
        { icon: 'check2', label: 'Vinculada al Inbox' } :
        { icon: 'inbox', label: 'Enviar al Inbox', onClick: () => onSendToInbox(ln.id) }]] : [])]
        }
        trigger={({ open, toggle }) =>
        <button type="button" onClick={toggle} title="Convertir línea en…" aria-label="Convertir línea en otro tipo"
        style={{ width: 24, height: 26, flexShrink: 0, marginTop: 0, padding: 0, border: 'none', borderRadius: 6, display: 'grid', placeItems: 'center', cursor: 'pointer',
          color: open ? t.accentInk : t.ink3, background: open || hover ? t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(60,48,30,0.07)' : 'transparent',
          opacity: open ? 1 : hover ? 0.9 : 0.34, transition: 'background .12s, opacity .12s, color .12s' }}>
              <Ico name="ellipsis" size={16} />
            </button>} />
        {/* marcador (slot fijo → alinea todas las líneas) */}
        <span style={{ width: 24, flexShrink: 0, marginTop: 3, display: 'grid', placeItems: 'center' }}>
          {ln.kind === 'tarea' &&
          <span onClick={() => onToggle(ln.id)} style={{ width: 28, height: 28, margin: -4, flexShrink: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <span style={{ width: 19, height: 19, borderRadius: t.checkRadius, display: 'grid', placeItems: 'center', background: ln.done ? t.accent : 'transparent', border: ln.done ? 'none' : `1.7px solid ${t.ink3}`, color: t.accentOn }}>{ln.done && <Ico name="check" size={11} sw={3} />}</span>
          </span>}
          {ln.kind === 'consulta' && <Ico name={answered ? 'check' : 'help'} size={answered ? 15 : 18} sw={answered ? 2.4 : 1.9} style={{ color: answered ? t.ink3 : m.fg }} />}
        </span>
        <span style={{ flex: 1, fontSize: 16, lineHeight: 1.55, paddingTop: 1,
          fontFamily: ln.kind === 'text' ? "'Newsreader', Georgia, serif" : t.fontUI,
          color: ln.kind === 'tarea' && ln.done ? t.ink3 : ln.kind === 'consulta' ? answered ? t.ink3 : m.fg : t.ink,
          fontWeight: ln.kind === 'consulta' ? 500 : 400,
          textDecoration: ln.kind === 'tarea' && ln.done ? 'line-through' : 'none' }}>
          {ln.text}
          {ln.kind === 'tarea' && ln.linked &&
          <span title="Esta tarea está vinculada a una tarea del Inbox"
          style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 650, fontFamily: t.fontMono, padding: '2px 8px', borderRadius: t.rTag, verticalAlign: 'middle', background: t.tintBg, color: t.accentInk }}>
            <Ico name="inbox" size={10} sw={2.4} />En Inbox
          </span>}
          {ln.kind === 'consulta' &&
          <span onClick={focusAns} title={answered ? 'Editar la respuesta' : 'Responder'}
          style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, fontWeight: 650, fontFamily: t.fontMono, padding: '2px 8px', borderRadius: t.rTag, verticalAlign: 'middle',
            background: answered ? t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(60,48,30,0.06)' : m.bg,
            color: answered ? t.ink3 : m.fg }}>
            <Ico name={answered ? 'check' : 'help'} size={10} sw={2.6} />{answered ? 'respondida' : 'pendiente'}
          </span>}
        </span>
      </div>
      {/* respuesta de la consulta — bloque anidado y editable; al escribir, cierra la consulta */}
      {ln.kind === 'consulta' &&
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginLeft: 50, marginTop: 4, paddingLeft: 12, borderLeft: `2px solid ${answered ? m.fg : t.border}` }}>
        <span style={{ flexShrink: 0, marginTop: 3, fontSize: 10.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.03em', color: answered ? m.fg : t.ink3 }}>R</span>
        <div ref={ansRef} className="av-ans" contentEditable suppressContentEditableWarning
        data-ph="Escribe la respuesta…"
        onBlur={(e) => onAnswer(ln.id, e.currentTarget.textContent.trim())}
        onKeyDown={(e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();e.currentTarget.blur();}}}
        style={{ flex: 1, outline: 'none', fontSize: 15, lineHeight: 1.5, fontFamily: "'Newsreader', Georgia, serif", color: answered ? t.ink2 : t.ink3 }} />
      </div>}
    </div>);
}

function TypeSwitch({ t, types, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
      {TYPE_CYCLE.map((k) => {
        const m = types[k],on = k === value;
        return (
          <span key={k} onClick={() => onChange(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: t.rSeg - 3, cursor: 'pointer', fontSize: 12.5, fontWeight: 650, color: on ? m.fg : t.ink2, background: on ? k === 'nota' ? t.segOn : m.bg : 'transparent', boxShadow: on ? t.segShadow : 'none', transition: 'all .12s' }}>
            <Ico name={m.icon} size={13} sw={2} /><span>{m.label}</span>
          </span>);
      })}
    </div>);
}

/* indicador del tipo DEDUCIDO — no es un selector, es un estado calculado.
   Sustituye a TypeSwitch en el modelo "tipo deducido". */
function DerivedStatus({ t, types, lines }) {
  const k = deriveType(lines);
  const m = types[k];
  const reason = k === 'consulta' ? 'consulta sin responder' :
  k === 'tarea' ? 'tarea por hacer' :
  'solo texto · referencia';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 9px', borderRadius: t.rSeg, fontSize: 12.5, fontWeight: 650, color: m.fg, background: m.bg }}>
        <Ico name={m.icon} size={13} sw={2} /><span>{m.label}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 550, color: t.ink3, fontFamily: t.fontMono }}>
        <Ico name="sparkles" size={12} style={{ color: t.ink3 }} />
        <span>auto · {reason}</span>
      </span>
    </div>);
}

/* control HÍBRIDO: deduce por defecto (Auto), pero el usuario puede fijar
   un tipo a mano; «Auto» vuelve a deducir. El segmento Auto muestra, en
   pequeño, el tipo que se está deduciendo ahora mismo. */
function HybridTypeControl({ t, types, note, lines, onSetType, onAuto }) {
  const derived = deriveType(lines);
  const auto = note.auto;
  const dm = types[derived];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
      <span onClick={onAuto} title="Deducir del contenido"
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: t.rSeg - 3, cursor: 'pointer', fontSize: 12.5, fontWeight: 650,
        color: auto ? dm.fg : t.ink2, background: auto ? dm.bg : 'transparent', boxShadow: auto ? t.segShadow : 'none', transition: 'all .12s' }}>
        <Ico name="sparkles" size={13} />
        <span>Auto{auto && <span style={{ opacity: 0.72, fontWeight: 600 }}> · {dm.label}</span>}</span>
      </span>
      <span style={{ width: 1, alignSelf: 'stretch', margin: '2px 2px', background: t.border }} />
      {TYPE_CYCLE.map((k) => {
        const m = types[k],on = !auto && k === note.type;
        return (
          <span key={k} onClick={() => onSetType(k)} title={`Fijar como ${m.label}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: t.rSeg - 3, cursor: 'pointer', fontSize: 12.5, fontWeight: 650,
            color: on ? m.fg : t.ink3, background: on ? k === 'nota' ? t.segOn : m.bg : 'transparent', boxShadow: on ? t.segShadow : 'none', transition: 'all .12s' }}>
            <Ico name={m.icon} size={13} sw={2} /><span>{m.label}</span>
          </span>);
      })}
    </div>);
}

/* ───────── EDITOR: nota = documento vivo ───────── */
function NoteEditor({ t, types, note, lines, mode, onSetType, onAuto, onSetLineKind, onToggleLine, onAnswerLine, onSendToInbox }) {
  const counts = { tarea: 0, consulta: 0, done: 0 };
  lines.forEach((l) => {if (l.kind === 'tarea') {counts.tarea++;if (l.done) counts.done++;}if (l.kind === 'consulta') counts.consulta++;});
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: t.card }}>
      {/* barra: tipo de la nota + meta — alineada a la columna del contenido */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 26px 13px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {mode === 'derived' ?
          <DerivedStatus t={t} types={types} lines={lines} /> :
          mode === 'hybrid' ?
          <HybridTypeControl t={t} types={types} note={note} lines={lines} onSetType={(k) => onSetType(note.id, k)} onAuto={() => onAuto(note.id)} /> :
          <TypeSwitch t={t} types={types} value={note.type} onChange={(k) => onSetType(note.id, k)} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: t.ink3 }}>
          {(counts.tarea > 0 || counts.consulta > 0) &&
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, fontFamily: t.fontMono }}>
              {counts.tarea > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: types.tarea.fg }}><Ico name="check" size={13} sw={2.4} />{counts.done}/{counts.tarea}</span>}
              {counts.consulta > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: types.consulta.fg }}><Ico name="help" size={13} />{counts.consulta}</span>}
            </div>}
          <span style={{ fontSize: 12, fontFamily: t.fontMono, whiteSpace: 'nowrap' }}>{note.date}</span>
          <DropMenu t={t} surface="paper" align="right" placement="bottom"
            sections={[
            [{ icon: 'pin', label: note.pin ? 'Quitar de fijadas' : 'Fijar arriba' }, { icon: 'layers', label: 'Duplicar' }, { icon: 'arrowRight', label: 'Mover a lista' }],
            [{ icon: 'tag', label: 'Etiquetas' }],
            [{ icon: 'trash', label: 'Eliminar nota', danger: true }]]
            }
            trigger={({ open, toggle }) =>
            <button type="button" onClick={toggle} aria-label="Opciones de la nota"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, padding: 0, border: 'none', borderRadius: 7, cursor: 'pointer', color: open ? t.accentInk : t.ink3, background: open ? t.tintBg : 'transparent', transition: 'background .12s, color .12s' }}>
                <Ico name="dots" size={18} />
              </button>} />
        </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px 28px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          {/* título + meta de lista */}
          <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 25, lineHeight: 1.22, letterSpacing: '-0.02em', color: t.ink }}>{note.title}</h2>
          {note.list &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: listDot(t, note.list) }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: t.ink3 }}>{note.list}</span>
            </div>}
          {/* hint contextual — sólo en notas nuevas/cortas, no permanente */}
          {lines.length <= 1 &&
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '16px 0 0', color: t.ink3 }}>
            <Ico name="sparkles" size={13} style={{ color: t.accentInk, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>Clic en el margen ⠿ de una línea para volverla <span style={{ color: types.tarea.fg, fontWeight: 600 }}>tarea</span> o <span style={{ color: types.consulta.fg, fontWeight: 600 }}>consulta</span>{mode !== 'manual' ? ' — el tipo de la nota se deduce solo' : ''}.</span>
          </div>}
          {/* cuerpo vivo */}
          <div style={{ marginTop: 14 }}>
            {lines.map((ln) => <VivaLine key={ln.id} ln={ln} t={t} types={types} onSetKind={(id, k) => onSetLineKind(note.id, id, k)} onToggle={(id) => onToggleLine(note.id, id)} onAnswer={(id, text) => onAnswerLine(note.id, id, text)} onSendToInbox={(id) => onSendToInbox(note.id, id)} />)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 0', color: t.ink3 }}>
              <span style={{ width: 22, flexShrink: 0 }} />
              <span style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 18, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 15, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>Añade otra línea…</span>
            </div>
          </div>
        </div>
      </div>
    </div>);
}

/* ───────── fila de la lista (izquierda) ───────── */
function BandRow({ n, t, types, lines, mode, sel, onClick }) {
  const [hover, setHover] = React.useState(false);
  const m = types[effType(n, lines, mode)];
  const open = (lines || []).filter((l) => l.kind === 'tarea' && !l.done).length;
  const q = (lines || []).filter((l) => l.kind === 'consulta' && !qAnswered(l)).length;
  const snippet = lines && lines[0] ? lines[0].text : n.body;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, padding: '11px 15px 11px 16px', cursor: 'pointer',
      background: sel ? t.tintBg : hover ? t.rowHover : 'transparent', borderBottom: `1px solid ${t.border}` }}>
      {sel && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: t.accent }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Ico name={m.icon} size={13} sw={2} style={{ color: m.fg, flexShrink: 0, marginTop: 3 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: t.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingLeft: 21, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontFamily: t.fontMono, color: t.ink3, flexShrink: 0 }}>{n.date}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: t.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{snippet}</span>
      </div>
      {(open > 0 || q > 0) &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 21, marginTop: 1 }}>
          {open > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, fontFamily: t.fontMono, color: types.tarea.fg }}><Ico name="check" size={11} sw={2.6} />{open}</span>}
          {q > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, fontFamily: t.fontMono, color: types.consulta.fg }}><Ico name="help" size={11} />{q}</span>}
        </div>}
    </div>);
}

/* ───────── LISTA = esqueleto B + cuerpo vivo C ───────── */
/* hint del atajo de captura rápida — mismo patrón que el Inbox.
   compact: para columnas estrechas (Notas·Lista) — teclas pequeñas, sin descriptor, una sola línea. */
function CaptureHint({ t, style, compact }) {
  const chip = compact ?
  { fontFamily: t.fontMono, fontSize: 10, padding: '1px 5px', borderRadius: 4, background: t.kbdBg, border: `1px solid ${t.border}`, color: t.ink2 } :
  { fontFamily: t.fontMono, fontSize: 11, padding: '2px 7px', borderRadius: 5, background: t.kbdBg, border: `1px solid ${t.border}`, color: t.ink2 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6, marginTop: 9, marginBottom: 2, flexWrap: 'nowrap', whiteSpace: 'nowrap', ...style }}>
      {['Ctrl', 'Shift', 'Espacio'].map((k, i) =>
      <React.Fragment key={k}>
          {i > 0 && <span style={{ fontSize: compact ? 10 : 11, color: t.ink3 }}>+</span>}
          <span style={chip}>{k}</span>
        </React.Fragment>
      )}
      {!compact && <span style={{ fontSize: 12, color: t.ink3, marginLeft: 4 }}>captura rápida</span>}
    </div>);
}

/* captura rápida compacta para la columna de notas (mismo patrón que el Inbox y el Tablón) */
function CompactCapture({ t, types }) {
  const [qa, setQa] = React.useState('nota');
  return (
    <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px 7px 11px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: t.rInput }}>
        <span style={{ color: t.accentInk, fontWeight: 700, fontSize: 15, lineHeight: 1, flexShrink: 0 }}>+</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: t.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Captura como {types[qa].label.toLowerCase()}…</span>
        <div style={{ display: 'flex', gap: 2, padding: 2, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}`, flexShrink: 0 }}>
          {TYPE_CYCLE.map((k) => {
            const m = types[k],on = k === qa;
            return (
              <span key={k} onClick={() => setQa(k)} title={`Capturar como ${m.label}`} style={{ display: 'grid', placeItems: 'center', width: 24, height: 22, borderRadius: Math.max(2, t.rSeg - 3), cursor: 'pointer', color: on ? m.fg : t.ink3, background: on ? k === 'nota' ? t.segOn : m.bg : 'transparent', transition: 'all .12s' }}>
                <Ico name={m.icon} size={13} sw={2} />
              </span>);
          })}
        </div>
      </div>

    </div>);
}

function ListGroupLabel({ t, icon, count, collapsed, onToggle, children }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" onClick={onToggle} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '13px 16px 6px', border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', textAlign: 'left',
      color: h ? t.ink2 : t.ink3, transition: 'color .12s' }}>
      <span style={{ display: 'flex', transform: collapsed ? 'none' : 'rotate(90deg)', transition: 'transform .15s' }}><Ico name="chevron" size={11} sw={2.6} /></span>
      {icon && <Ico name={icon} size={11} sw={2} />}
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: t.monoMeta ? t.fontMono : t.fontUI }}>{children}</span>
      {count != null && <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: t.fontMono, color: t.ink3 }}>{count}</span>}
    </button>);
}

function Lista({ t, types, notes, linesByNote, mode, selId, setSelId, onSetType, onAuto, onSetLineKind, onToggleLine, onAnswerLine, onSendToInbox }) {
  const note = notes.find((n) => n.id === selId) || notes[0];
  const pinned = notes.filter((n) => n.pin);
  const rest = notes.filter((n) => !n.pin);
  const [collapsed, setCollapsed] = React.useState({});
  const toggle = (k) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));
  const row = (n) => <BandRow key={n.id} n={n} t={t} types={types} lines={linesByNote[n.id]} mode={mode} sel={n.id === note.id} onClick={() => setSelId(n.id)} />;
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <div style={{ width: 288, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.border}` }}>
        <div style={{ padding: '14px 14px 9px', borderBottom: `1px solid ${t.border}`, height: "62px" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: t.rInput, color: t.ink3 }}>
            <Ico name="search" size={15} /><span style={{ fontSize: 13 }}>Filtrar estas notas…</span>
          </div>
        </div>
        <CompactCapture t={t} types={types} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {pinned.length > 0 && <ListGroupLabel t={t} icon="pin" count={pinned.length} collapsed={collapsed.fijadas} onToggle={() => toggle('fijadas')}>Fijadas</ListGroupLabel>}
          {pinned.length > 0 && !collapsed.fijadas && pinned.map(row)}
          {rest.length > 0 && <ListGroupLabel t={t} count={rest.length} collapsed={collapsed.rest} onToggle={() => toggle('rest')}>{pinned.length > 0 ? 'Anteriores' : 'Todas'}</ListGroupLabel>}
          {rest.length > 0 && !collapsed.rest && rest.map(row)}
        </div>
      </div>
      <NoteEditor t={t} types={types} note={note} lines={linesByNote[note.id] || []} mode={mode} onSetType={onSetType} onAuto={onAuto} onSetLineKind={onSetLineKind} onToggleLine={onToggleLine} onAnswerLine={onAnswerLine} onSendToInbox={onSendToInbox} />
    </div>);
}

/* ───────── TABLÓN (galería, vista alterna) ───────── */
function QuickAdd({ t, types, qaType, setQaType }) {
  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: t.rInput, color: t.ink3, fontSize: 14.5 }}>
        <span style={{ color: t.accentInk, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>+</span>
        <span style={{ flex: 1 }}>Captura rápida… <span style={{ color: t.ink3 }}>se guarda como {types[qaType].label.toLowerCase()}</span></span>
        <div style={{ display: 'flex', gap: 3, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
          {TYPE_CYCLE.map((k) => {
            const m = types[k],on = k === qaType;
            return (
              <span key={k} onClick={() => setQaType(k)} title={m.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: t.rSeg - 3, cursor: 'pointer', fontSize: 12, fontWeight: 650, color: on ? m.fg : t.ink3, background: on ? m.bg : 'transparent', transition: 'all .12s' }}>
                <Ico name={m.icon} size={13} sw={2} /><span>{m.label}</span>
              </span>);
          })}
        </div>
      </div>

    </React.Fragment>);
}

function NoteCard({ n, t, types, lines, mode, onSelect }) {
  const [hover, setHover] = React.useState(false);
  const m = types[effType(n, lines, mode)];
  const open = (lines || []).filter((l) => l.kind === 'tarea' && !l.done).length;
  const q = (lines || []).filter((l) => l.kind === 'consulta' && !qAnswered(l)).length;
  return (
    <div onClick={() => onSelect(n.id)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ background: t.card, border: `1px solid ${hover ? t.accent : t.border}`,
      borderRadius: t.rInput + 2, padding: '13px 15px 14px', cursor: 'pointer',
      boxShadow: hover ? '0 10px 26px -14px rgba(40,30,15,0.35)' : '0 1px 2px rgba(40,30,15,0.05)',
      transform: hover ? 'translateY(-1px)' : 'none', transition: 'box-shadow .15s, border-color .12s, transform .15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TypeBadge m={m} t={t} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: t.ink3 }}>
          {n.pin && <Ico name="pin" size={13} />}
          <span style={{ fontSize: 11, fontFamily: t.fontMono, fontVariantNumeric: 'tabular-nums' }}>{n.date}</span>
        </div>
      </div>
      <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: 15.5, lineHeight: 1.3, color: t.ink, letterSpacing: '-0.01em', marginTop: 11 }}>{n.title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: t.ink2, marginTop: 7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lines && lines[0] ? lines[0].text : n.body}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, minHeight: 20 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {n.list && <React.Fragment>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: listDot(t, n.list), flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 550, color: t.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.list}</span>
          </React.Fragment>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {open > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 650, fontFamily: t.fontMono, color: types.tarea.fg }}><Ico name="check" size={12} sw={2.5} />{open}</span>}
          {q > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 650, fontFamily: t.fontMono, color: types.consulta.fg }}><Ico name="help" size={12} />{q}</span>}
        </span>
      </div>
    </div>);
}

function Tablon({ t, types, notes, linesByNote, mode, onSelect }) {
  const [filter, setFilter] = React.useState('todas');
  const [qaType, setQaType] = React.useState('nota');
  const typeOf = (n) => effType(n, linesByNote[n.id], mode);
  const counts = { todas: notes.length, nota: 0, tarea: 0, consulta: 0 };
  notes.forEach((n) => counts[typeOf(n)]++);
  const chips = [
  { k: 'todas', l: 'Todas' }, { k: 'nota', l: 'Notas' }, { k: 'tarea', l: 'Tareas' }, { k: 'consulta', l: 'Consultas' }];
  const shown = filter === 'todas' ? notes : notes.filter((n) => typeOf(n) === filter);
  const ordered = [...shown].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0));
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 26px 0' }}><QuickAdd t={t} types={types} qaType={qaType} setQaType={setQaType} /></div>
      <div style={{ display: 'flex', gap: 8, padding: '14px 26px 12px' }}>
        {chips.map((c) => {
          const on = c.k === filter;
          return (
            <span key={c.k} onClick={() => setFilter(c.k)} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: t.rPill, cursor: 'pointer',
              background: on ? t.tintBg : 'transparent', color: on ? t.accentInk : t.ink2, border: on ? 'none' : `1px solid ${t.border}` }}>
              {c.l}<span style={{ fontFamily: t.fontMono, fontSize: 11, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{counts[c.k]}</span>
            </span>);
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 26px 26px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {[0, 1].map((ci) =>
          <div key={ci} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ordered.filter((_, i) => i % 2 === ci).map((n) => <NoteCard key={n.id} n={n} t={t} types={types} lines={linesByNote[n.id]} mode={mode} onSelect={onSelect} />)}
            </div>
          )}
        </div>
      </div>
    </div>);
}

/* ───────── DISPATCHER ───────── */
function NotesView({ theme: t, variant: initial = 'lista', initialNote, mode = 'manual', tw, setTweak, embed = false, hidden = false }) {
  const [variant, setVariant] = React.useState(initial);
  const [notes, setNotes] = React.useState(() => NOTES_DATA.map((n) => ({ ...n, auto: true })));
  const [linesByNote, setLines] = React.useState(buildLines);
  const [selId, setSelId] = React.useState(() => initialNote || (NOTES_DATA.find((n) => n.pin) || NOTES_DATA[0]).id);
  const types = noteTypes(t);
  const onSetType = (id, type) => setNotes((ns) => ns.map((n) => n.id === id ? { ...n, type, auto: false } : n));
  const onAuto = (id) => setNotes((ns) => ns.map((n) => n.id === id ? { ...n, auto: true } : n));
  const onSetLineKind = (noteId, lineId, kind) => setLines((map) => ({
    ...map,
    [noteId]: map[noteId].map((l) => {
      if (l.id !== lineId) return l;
      const next = kind === 'nota' ? 'text' : kind;
      return { ...l, kind: next, done: kind === 'tarea' ? l.done || false : false };
    })
  }));
  const onToggleLine = (noteId, lineId) => setLines((map) => ({
    ...map,
    [noteId]: map[noteId].map((l) => l.id === lineId ? { ...l, done: !l.done } : l)
  }));
  const onAnswerLine = (noteId, lineId, text) => setLines((map) => ({
    ...map,
    [noteId]: map[noteId].map((l) => l.id === lineId ? { ...l, answer: text } : l)
  }));
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);
  const onSendToInbox = (noteId, lineId) => {
    let sent = null;
    setLines((map) => ({
      ...map,
      [noteId]: map[noteId].map((l) => {
        if (l.id !== lineId) return l;
        sent = l.text;
        return { ...l, linked: true };
      })
    }));
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(sent || 'Tarea');
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  React.useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);
  const openInList = (id) => {setSelId(id);setVariant('lista');};
  const floating = t.shell === 'floating';
  const mainEl =
  <main style={{ flex: 1, minWidth: 0, display: hidden ? 'none' : 'flex', flexDirection: 'column',
    background: floating ? t.shellPanel : 'transparent',
    borderRadius: floating ? t.rInput + 4 : 0,
    border: floating ? `1px solid ${t.border}` : 'none',
    boxShadow: floating ? t.shellShadow : 'none',
    overflow: floating ? 'hidden' : 'visible' }}>
        <NotesHeader t={t} variant={variant} setVariant={setVariant} count={notes.length} />
        {variant === 'lista' ?
    <Lista t={t} types={types} notes={notes} linesByNote={linesByNote} mode={mode} selId={selId} setSelId={setSelId} onSetType={onSetType} onAuto={onAuto} onSetLineKind={onSetLineKind} onToggleLine={onToggleLine} onAnswerLine={onAnswerLine} onSendToInbox={onSendToInbox} /> :
    <Tablon t={t} types={types} notes={notes} linesByNote={linesByNote} mode={mode} onSelect={openInList} />}
      </main>;
  const toastEl = toast &&
  <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 9999,
    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 16px', maxWidth: 460,
    background: t.mode === 'dark' ? '#2b241a' : t.ink, color: t.mode === 'dark' ? t.ink : '#fffdf6',
    borderRadius: t.rInput + 2, boxShadow: '0 12px 34px -10px rgba(0,0,0,0.5), 0 3px 10px rgba(0,0,0,0.25)',
    animation: window.__ANTASK_NOANIM ? 'none' : 'antaskMenuIn .2s cubic-bezier(0.34,1.2,0.64,1) both' }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: '50%', background: t.accent, color: t.accentOn, flexShrink: 0 }}><Ico name="inbox" size={13} sw={2.2} /></span>
        <span style={{ fontSize: 13.5, fontWeight: 550, minWidth: 0 }}>Enviada al Inbox — <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>«{toast.length > 42 ? toast.slice(0, 42) + '…' : toast}»</span></span>
        <span onClick={() => setToast(null)} style={{ flexShrink: 0, opacity: 0.7, cursor: 'pointer', display: 'flex', marginLeft: 4 }}><Ico name="x" size={15} /></span>
      </div>;
  if (embed) return <React.Fragment>{mainEl}{toastEl}</React.Fragment>;
  return (
    <div style={{ display: 'flex', height: '100%', gap: floating ? 10 : 0, padding: floating ? 10 : 0, boxSizing: 'border-box', background: floating ? t.desk : t.canvas, color: t.ink, fontFamily: t.fontUI }}>
      <Sidebar t={t} active="Notas" tw={tw} setTweak={setTweak} />
      {mainEl}
      {toastEl}
    </div>);
}

window.NotesView = NotesView;
window.NOTES_DATA = NOTES_DATA;
/* helpers compartidos para la vista Hoy */
window.buildNoteLines = buildLines;
window.antaskQAnswered = qAnswered;
window.antaskNoteTypes = noteTypes;
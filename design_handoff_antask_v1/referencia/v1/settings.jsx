/* settings.jsx — Pantalla/diálogo de Ajustes para Antask (móvil + escritorio).
   Reutiliza window.Ico, el tema construido y los acentos compartidos.
   La sección "Apariencia" pilota los tweaks reales (tema, acento, tipografía)
   cuando se le pasan tw + setTweak; si no, cae en estado local (sólo visual).
   Exporta window.MobileSettings y window.SettingsModal. */

const SIco = (props) => React.createElement(window.Ico, props);

/* ── Icono cámara (no está en Ico) ── */
const CameraIco = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/* ── Helper: abre el selector de archivo del image-slot del avatar ── */
function triggerAvatarPicker() {
  const slot = document.querySelector('image-slot#antask-avatar');
  if (!slot || !slot.shadowRoot) return;
  const empty = slot.shadowRoot.querySelector('.empty');
  const replace = slot.shadowRoot.querySelector('[data-act="replace"]');
  if (empty && empty.style.display !== 'none') empty.click();
  else if (replace) replace.click();
  else if (empty) empty.click();
}

/* ── Avatar grande clicable con overlay de cámara ── */
function AvatarPickerBtn({ t, size = 90 }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{ position: 'relative', width: size, height: size, cursor: 'pointer', flexShrink: 0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={triggerAvatarPicker}
      title="Cambiar foto de perfil"
    >
      <image-slot
        id="antask-avatar"
        shape="circle"
        style={{ width: `${size}px`, height: `${size}px`, display: 'block', pointerEvents: 'none' }}
        placeholder="📷"
        fit="cover"
      />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: hover ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4, transition: 'background .15s', opacity: hover ? 1 : 0,
        color: '#fff', userSelect: 'none'
      }}>
        <CameraIco size={22} color="#fff" />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em' }}>Cambiar</span>
      </div>
    </div>
  );
}

const S_PRO_GRAD = 'linear-gradient(135deg,#e0915a,#c25e3a)';

/* CTA de upgrade reutilizable: cierra Ajustes y abre el modal PRO del host. */
function SUpgradeBtn({ t, onClose, compact }) {
  const [h, setH] = React.useState(false);
  const go = () => { if (onClose) onClose(); setTimeout(() => window.openProUpgrade && window.openProUpgrade(), compact ? 0 : 60); };
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={go}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: 700, fontFamily: t.fontUI, color: '#fff', background: S_PRO_GRAD, whiteSpace: 'nowrap',
        boxShadow: h ? '0 10px 22px -10px rgba(194,94,58,0.7)' : '0 6px 16px -10px rgba(194,94,58,0.55)', transition: 'box-shadow .14s' }}>
      <SIco name="sparkles" size={14} sw={2} />Mejorar a PRO
    </button>);
}
function SProBadge({ t }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, fontFamily: t.fontMono, letterSpacing: '0.04em', padding: '4px 10px', borderRadius: t.rTag, color: '#fff', background: S_PRO_GRAD }}>
      <SIco name="sparkles" size={12} sw={2} />PRO
    </span>);
}

/* ───────── átomos de control (válidos para móvil y escritorio) ───────── */
function SToggle({ t, on, onChange }) {
  return (
    <span onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      style={{ width: 42, height: 24, borderRadius: 999, padding: 3, flexShrink: 0, cursor: 'pointer',
        background: on ? t.accent : (t.mode === 'dark' ? 'rgba(255,245,225,0.16)' : 'rgba(60,48,30,0.17)'),
        display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background .16s' }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.32)', transition: 'all .16s' }} />
    </span>);
}

function SSeg({ t, value, options, onChange, compact }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <span key={o} onClick={() => onChange(o)} style={{
            padding: compact ? '5px 11px' : '6px 13px', borderRadius: Math.max(4, t.rSeg - 3), cursor: 'pointer',
            fontSize: 13, fontWeight: on ? 650 : 550, fontFamily: t.fontUI,
            color: on ? t.accentInk : t.ink2, background: on ? t.segOn : 'transparent',
            boxShadow: on ? t.segShadow : 'none', transition: 'background .12s, color .12s', whiteSpace: 'nowrap'
          }}>{o}</span>);
      })}
    </div>);
}

function SAccent({ t, value, onChange, size = 26 }) {
  const ACC = window.ANTASK_ACCENTS, ORD = window.ANTASK_ACCENT_ORDER;
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {ORD.map((k) => {
        const c = ACC[k].accent, on = k === value;
        return (
          <span key={k} onClick={() => onChange(k)} title={k}
            style={{ width: size, height: size, borderRadius: '50%', background: c, cursor: 'pointer', display: 'grid', placeItems: 'center',
              boxShadow: on ? `0 0 0 2px ${t.card}, 0 0 0 4px ${c}` : 'none', transition: 'box-shadow .12s' }}>
            {on && <SIco name="check" size={Math.round(size * 0.5)} sw={3} style={{ color: '#fff' }} />}
          </span>);
      })}
    </div>);
}

function SBtn({ t, icon, label, danger, onClick }) {
  const [h, setH] = React.useState(false);
  const dc = t.mode === 'dark' ? '#e0846a' : '#9a3f43';
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: t.rInput, cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: 600, fontFamily: t.fontUI,
        color: danger ? dc : t.ink2, background: h ? (danger ? (t.mode === 'dark' ? 'rgba(224,132,106,0.14)' : 'rgba(154,63,67,0.09)') : t.rowHover) : t.inputBg,
        border: `1px solid ${danger ? (h ? dc : t.border) : t.border}`, transition: 'all .12s', whiteSpace: 'nowrap' }}>
      {icon && <SIco name={icon} size={15} sw={1.9} />}{label}
    </button>);
}

/* puente Apariencia ⇆ tweaks reales (o estado local de respaldo) */
function sApariencia(tw, setTweak, local, setLocal) {
  const live = !!(tw && setTweak);
  return {
    mode: live ? tw.mode : local.mode,
    accent: live ? tw.accent : local.accent,
    font: live ? (tw.titleFont || 'Grotesca') : local.font,
    shell: live ? tw.shell : local.shell,
    setMode: (v) => live ? setTweak('mode', v) : setLocal((s) => ({ ...s, mode: v })),
    setAccent: (v) => live ? setTweak('accent', v) : setLocal((s) => ({ ...s, accent: v })),
    setFont: (v) => live ? setTweak('titleFont', v) : setLocal((s) => ({ ...s, font: v })),
    setShell: (v) => live ? setTweak('shell', v) : setLocal((s) => ({ ...s, shell: v })),
    hasShell: live ? (tw.shell != null) : false,
  };
}

const S_PRIOS = ['Ninguna', 'Baja', 'Media', 'Alta'];

/* Capacidades de la apariencia activa: ¿ofrece elección de modo / de acento cálido?
   Los packs que sólo tienen un modo (Papel=claro, Terminal=oscuro) o que no exponen
   acento ajustable (Marea, Bosque, Terminal usa el suyo en la biblioteca) ocultan
   esos controles aquí, para que Ajustes refleje lo que el pack realmente permite. */
function apCaps(tw) {
  const pack = (tw && window.ANTASK_APPEARANCE_BY_ID) ? window.ANTASK_APPEARANCE_BY_ID[tw.appearance] : null;
  const modes = (pack && pack.caps && pack.caps.modes) ? pack.caps.modes : ['light', 'dark'];
  return {
    showMode: !pack || modes.length > 1,
    showAccent: !pack || !!(pack.caps && pack.caps.accents && pack.caps.accents.warm),
    showFont: !pack || pack.caps.font !== false,
  };
}

/* Banner de acceso a la Biblioteca de apariencias (sólo si el host la expone).
   Muestra los swatches de la apariencia activa y abre el store. */
function ApBanner({ t, tw, onClose, compact }) {
  const [h, setH] = React.useState(false);
  const pack = (window.ANTASK_APPEARANCE_BY_ID || {})[(tw && tw.appearance) || 'tierra'] || (window.ANTASK_APPEARANCES || [])[0];
  const open = () => { if (onClose) onClose(); setTimeout(() => window.openAppearanceLibrary && window.openAppearanceLibrary(), compact ? 0 : 60); };
  if (!pack) return null;
  return (
    <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={open}
      style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
        marginTop: compact ? 0 : 18, padding: compact ? '13px 15px' : '15px 17px', borderRadius: compact ? 0 : t.rInput + 4,
        background: h ? t.tintBg : (compact ? 'transparent' : t.inputBg), border: compact ? 'none' : `1px solid ${h ? t.accent : t.border}`,
        transition: 'background .12s, border-color .12s' }}>
      <span style={{ width: 38, height: 38, borderRadius: 11, background: pack.swatches[3], display: 'grid', placeItems: 'center', flexShrink: 0, border: `1px solid ${t.border}` }}>
        <SIco name="sparkles" size={17} sw={2} style={{ color: pack.swatches[0] }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: t.ink, lineHeight: 1.3 }}>Biblioteca de apariencias</div>
        <div style={{ fontSize: 12.5, color: t.ink3, marginTop: 2 }}>Activa: <span style={{ fontWeight: 650, color: t.ink2 }}>{pack.name}</span> ·\nexplora más mundos</div>
      </div>
      <span style={{ display: 'flex', gap: 4, flexShrink: 0, marginRight: 4 }}>
        {pack.swatches.map((c, i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.12)' }} />)}
      </span>
      <SIco name="chevron" size={16} style={{ color: t.ink3, flexShrink: 0 }} />
    </button>);
}

/* ═══════════════════════════ MÓVIL: sub-pantalla Editar Perfil ═══════════════════════════ */
function MobileEditProfile({ t, onBack }) {
  const [name, setName] = React.useState('miguel cantos');
  const [email, setEmail] = React.useState('miguel@antask.app');
  const [saved, setSaved] = React.useState(false);

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: `1px solid ${t.border}`,
    borderRadius: t.rInput, background: t.inputBg, color: t.ink, fontSize: 15,
    fontFamily: t.fontUI, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .14s'
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 900);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header con botón Atrás */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px 20px' }}>
        <button type="button" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: t.accentInk, font: 'inherit', fontSize: 15, fontWeight: 600, padding: '6px 2px' }}>
          <SIco name="chevronL" size={18} sw={2.2} />Ajustes
        </button>
      </div>

      {/* Avatar centrado */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 0 28px' }}>
        <AvatarPickerBtn t={t} size={96} />
        <button type="button" onClick={triggerAvatarPicker}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: t.accentInk, font: 'inherit', fontSize: 14, fontWeight: 650, padding: 4 }}>
          <CameraIco size={14} color={t.accentInk} />Cambiar foto
        </button>
      </div>

      {/* Campos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.ink3, marginBottom: 7 }}>Nombre</div>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = t.accent}
            onBlur={e => e.target.style.borderColor = t.border} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.ink3, marginBottom: 7 }}>Correo electrónico</div>
          <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
            onFocus={e => e.target.style.borderColor = t.accent}
            onBlur={e => e.target.style.borderColor = t.border} />
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <button type="button" onClick={handleSave}
          style={{ width: '100%', padding: '13px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', font: 'inherit',
            fontSize: 15, fontWeight: 700, fontFamily: t.fontUI, color: t.accentOn,
            background: saved ? '#5aa06b' : t.accent, transition: 'background .2s' }}>
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MÓVIL: pantalla de Ajustes ═══════════════════════════ */
function MobileSettings({ t, tw, setTweak }) {
  const [local, setLocal] = React.useState({ mode: t.mode === 'dark' ? 'Oscuro' : 'Claro', accent: 'arcilla', font: 'Grotesca', shell: 'Pegado' });
  const ap = sApariencia(tw, setTweak, local, setLocal);
  const isPro = !!(tw && tw.pro);
  const caps = apCaps(tw);
  const [notif, setNotif] = React.useState(true);
  const [digest, setDigest] = React.useState(false);
  const [monday, setMonday] = React.useState(true);
  const [simple, setSimple] = React.useState(false);
  const [prio, setPrio] = React.useState('Ninguna');
  const [prioOpen, setPrioOpen] = React.useState(false);
  const [editingProfile, setEditingProfile] = React.useState(false);
  const dc = t.mode === 'dark' ? '#e0846a' : '#b0473f';

  const GLabel = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.ink3, margin: '0 6px 9px' }}>{children}</div>);
  const Card = ({ children }) => (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput + 4, overflow: 'hidden', marginBottom: 22, boxShadow: '0 1px 2px rgba(40,30,15,0.05)' }}>{children}</div>);
  const Row = ({ icon, label, sub, right, danger, onClick, last, align }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: align || 'center', gap: 13, padding: '13px 15px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: last ? 'none' : `1px solid ${t.border}` }}>
      {icon && <span style={{ width: 22, flexShrink: 0, display: 'grid', placeItems: 'center', color: danger ? dc : t.ink3, marginTop: align === 'flex-start' ? 1 : 0 }}><SIco name={icon} size={18} sw={1.9} /></span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: danger ? dc : t.ink, lineHeight: 1.3 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, lineHeight: 1.35 }}>{sub}</div>}
      </div>
      {right}
    </div>);
  const Chevron = <SIco name="chevron" size={15} style={{ color: t.ink3, flexShrink: 0 }} />;
  const ValueR = ({ children }) => <span style={{ fontSize: 13.5, fontWeight: 600, color: t.ink3, fontFamily: t.fontMono, flexShrink: 0 }}>{children}</span>;

  if (editingProfile) return <MobileEditProfile t={t} onBack={() => setEditingProfile(false)} />;

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* perfil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '4px 6px 20px' }}>
        <span style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
          <image-slot id="antask-avatar" shape="circle" style={{ width: '56px', height: '56px', display: 'block' }} placeholder="📷" fit="cover" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 20, color: t.ink, lineHeight: 1.15 }}>miguel cantos</div>
          <div style={{ fontSize: 13, color: t.ink3, fontFamily: t.fontMono, marginTop: 2 }}>miguel@antask.app</div>
        </div>
      </div>

      <GLabel>Cuenta</GLabel>
      <Card>
        <Row icon="user" label="Editar perfil" right={Chevron} onClick={() => setEditingProfile(true)} />
        <Row icon="check2" label="Sincronización" sub="Conectado con Google" right={<span style={{ fontSize: 13, fontWeight: 650, color: '#5aa06b' }}>Activa</span>} last />
      </Card>

      <GLabel>Apariencia</GLabel>
      <Card>
        {caps.showMode && <Row icon={ap.mode === 'Oscuro' ? 'moon' : 'sun'} label="Tema" right={<SSeg t={t} value={ap.mode} options={['Claro', 'Oscuro']} onChange={ap.setMode} compact />} />}
        {caps.showAccent && <Row icon="tag" label="Color de acento" align="flex-start" right={<SAccent t={t} value={ap.accent} onChange={ap.setAccent} size={26} />} />}
        {caps.showFont && <Row icon="note" label="Tipografía" right={<SSeg t={t} value={ap.font} options={['Grotesca', 'Sans', 'Serif']} onChange={ap.setFont} compact />} last />}
      </Card>
      {window.openAppearanceLibrary && <Card><ApBanner t={t} tw={tw} compact /></Card>}

      <GLabel>Notificaciones</GLabel>
      <Card>
        <Row icon="bell" label="Avisos de tareas" sub="Recordatorios de vencimientos" right={<SToggle t={t} on={notif} onChange={setNotif} />} />
        {notif && <Row icon="calendar" label="Hora de aviso" right={<ValueR>09:00</ValueR>} onClick={() => {}} last />}
      </Card>
      <Card>
        <Row icon="sun" label="Resumen diario" sub="Un correo con el plan del día" right={<SToggle t={t} on={digest} onChange={setDigest} />} last />
      </Card>

      <GLabel>Tareas</GLabel>
      <Card>
        <Row icon="calendar" label="La semana empieza el lunes" right={<SToggle t={t} on={monday} onChange={setMonday} />} />
        <div>
          <Row icon="flag" label="Prioridad por defecto"
            right={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.ink3, fontFamily: t.fontMono }}>{prio}</span>
              <SIco name="chevron" size={14} style={{ color: t.ink3, transform: prioOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
            </span>}
            onClick={() => setPrioOpen((o) => !o)} last={!prioOpen} />
          {prioOpen && <div style={{ padding: '10px 15px 14px' }}>
            <SSeg t={t} value={prio} options={S_PRIOS} onChange={(v) => { setPrio(v); setPrioOpen(false); }} compact />
          </div>}
        </div>
      </Card>

      <GLabel>Datos</GLabel>
      <Card>
        <Row icon="archive" label="Exportar espacio de trabajo" right={Chevron} onClick={() => {}} />
        <Row icon="arrowRight" label="Importar espacio de trabajo" right={Chevron} onClick={() => {}} />
        <Row icon="trash" label="Limpiar tareas completadas" danger onClick={() => {}} last />
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '4px 0 8px' }}>
        <span onClick={() => {}} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 650, color: dc, cursor: 'pointer', padding: '8px 16px' }}><SIco name="logout" size={16} sw={2} />Cerrar sesión</span>
        <span style={{ fontSize: 12, color: t.ink3, fontFamily: t.fontMono }}>Antask · versión 1.0</span>
      </div>
    </div>);
}
window.MobileSettings = MobileSettings;

/* ═══════════════════════════ ESCRITORIO: diálogo de Ajustes ═══════════════════════════ */
const S_NAV = [
  { id: 'cuenta', icon: 'user', label: 'Cuenta' },
  { id: 'apariencia', icon: 'sun', label: 'Apariencia' },
  { id: 'notif', icon: 'bell', label: 'Notificaciones' },
  { id: 'tareas', icon: 'check2', label: 'Tareas' },
  { id: 'datos', icon: 'archive', label: 'Datos' },
  { id: 'acerca', icon: 'help', label: 'Acerca de' },
];

function SDRow({ t, label, desc, children, last, align }) {
  return (
    <div style={{ display: 'flex', alignItems: align || 'center', justifyContent: 'space-between', gap: 28, padding: '17px 0', borderBottom: last ? 'none' : `1px solid ${t.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, letterSpacing: '-0.005em' }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: t.ink3, marginTop: 4, lineHeight: 1.45, maxWidth: 360 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>);
}

function SSectionTitle({ t, children }) {
  return <h3 style={{ margin: '0 0 4px', fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 22, letterSpacing: t.titleTrack, color: t.ink }}>{children}</h3>;
}

function SettingsModal({ t, tw, setTweak, onClose }) {
  const [sec, setSec] = React.useState('cuenta');
  const [local, setLocal] = React.useState({ mode: t.mode === 'dark' ? 'Oscuro' : 'Claro', accent: 'oliva', font: 'Grotesca', shell: 'Flotante' });
  const ap = sApariencia(tw, setTweak, local, setLocal);
  const isPro = !!(tw && tw.pro);
  const caps = apCaps(tw);
  const [notif, setNotif] = React.useState(true);
  const [digest, setDigest] = React.useState(false);
  const [monday, setMonday] = React.useState(true);
  const [simple, setSimple] = React.useState(false);
  const [prio, setPrio] = React.useState('Ninguna');
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profileName, setProfileName] = React.useState('miguel cantos');
  const [profileEmail, setProfileEmail] = React.useState('miguel@antask.app');
  const [profileSaved, setProfileSaved] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const Section = () => {
    if (sec === 'cuenta') return (
      <React.Fragment>
        <SSectionTitle t={t}>Cuenta</SSectionTitle>

        {/* ── Editar perfil: panel inline ── */}
        {editingProfile ? (
          <div style={{ padding: '18px 0 8px' }}>
            {/* Avatar centrado con picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <AvatarPickerBtn t={t} size={84} />
              <button type="button" onClick={triggerAvatarPicker}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: t.accentInk, font: 'inherit', fontSize: 13, fontWeight: 650, padding: 4 }}>
                <CameraIco size={13} color={t.accentInk} />Cambiar foto de perfil
              </button>
            </div>
            {/* Campos */}
            <SDRow t={t} label="Nombre" desc="Tu nombre visible en Antask.">
              <input value={profileName} onChange={e => setProfileName(e.target.value)}
                style={{ padding: '7px 11px', border: `1px solid ${t.border}`, borderRadius: t.rInput, background: t.inputBg, color: t.ink, fontSize: 14, fontFamily: t.fontUI, outline: 'none', width: 200, transition: 'border-color .14s' }}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </SDRow>
            <SDRow t={t} label="Correo electrónico" desc="Tu dirección de contacto.">
              <input value={profileEmail} onChange={e => setProfileEmail(e.target.value)}
                style={{ padding: '7px 11px', border: `1px solid ${t.border}`, borderRadius: t.rInput, background: t.inputBg, color: t.ink, fontSize: 14, fontFamily: t.fontUI, outline: 'none', width: 220, transition: 'border-color .14s' }}
                onFocus={e => e.target.style.borderColor = t.accent}
                onBlur={e => e.target.style.borderColor = t.border} />
            </SDRow>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
              <SBtn t={t} label="Cancelar" onClick={() => setEditingProfile(false)} />
              <button type="button"
                onClick={() => { setProfileSaved(true); setTimeout(() => { setProfileSaved(false); setEditingProfile(false); }, 900); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', font: 'inherit',
                  fontSize: 13, fontWeight: 700, fontFamily: t.fontUI, color: t.accentOn,
                  background: profileSaved ? '#5aa06b' : t.accent, transition: 'background .2s' }}>
                {profileSaved ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
            <div style={{ height: 1, background: t.border, margin: '16px 0 4px' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0 6px' }}>
            <span style={{ width: 60, height: 60, borderRadius: 17, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
              <image-slot id="antask-avatar" shape="circle" style={{ width: '60px', height: '60px', display: 'block' }} placeholder="📷" fit="cover" />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 19, color: t.ink, letterSpacing: '-0.01em' }}>{profileName}</div>
              <div style={{ fontSize: 13, color: t.ink3, fontFamily: t.fontMono, marginTop: 2 }}>{profileEmail}</div>
            </div>
            <SBtn t={t} icon="user" label="Editar perfil" onClick={() => setEditingProfile(true)} />
          </div>
        )}
        {!editingProfile && <>
          <div style={{ height: 1, background: t.border, margin: '12px 0 4px' }} />
          <SDRow t={t} label="Sincronización con Google" desc="Tus tareas y notas se guardan en la nube." last>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 650, color: '#5aa06b' }}>Conectado</span>
              <SBtn t={t} label="Desconectar" danger onClick={() => {}} />
            </div>
          </SDRow>
        </>}

      </React.Fragment>);

    if (sec === 'apariencia') return (
      <React.Fragment>
        <SSectionTitle t={t}>Apariencia</SSectionTitle>
        <div style={{ height: 8 }} />
        {caps.showMode && (
          <SDRow t={t} label="Tema" desc="Claro para el día, oscuro para la noche.">
            <SSeg t={t} value={ap.mode} options={['Claro', 'Oscuro']} onChange={ap.setMode} />
          </SDRow>)}
        {caps.showAccent && (
          <SDRow t={t} label="Color de acento" desc="Define el carácter de la interfaz." align="flex-start">
            <SAccent t={t} value={ap.accent} onChange={ap.setAccent} size={28} />
          </SDRow>)}
        {caps.showFont && <SDRow t={t} label="Tipografía de títulos" desc="El estilo de los encabezados." last={!ap.hasShell}>
          <SSeg t={t} value={ap.font} options={['Grotesca', 'Sans', 'Serif']} onChange={ap.setFont} />
        </SDRow>}
        {ap.hasShell && (
          <SDRow t={t} label="Contenedor" desc="Paneles pegados o flotando sobre el lienzo." last>
            <SSeg t={t} value={ap.shell} options={['Pegado', 'Flotante']} onChange={ap.setShell} />
          </SDRow>)}
        {window.openAppearanceLibrary && <ApBanner t={t} tw={tw} onClose={onClose} />}
      </React.Fragment>);

    if (sec === 'notif') return (
      <React.Fragment>
        <SSectionTitle t={t}>Notificaciones</SSectionTitle>
        <div style={{ height: 8 }} />
        <SDRow t={t} label="Avisos de tareas" desc="Recordatorios cuando una tarea vence.">
          <SToggle t={t} on={notif} onChange={setNotif} />
        </SDRow>
        {notif && (
          <SDRow t={t} label="Hora de aviso" desc="A qué hora del día recibir los recordatorios.">
            <SSeg t={t} value={'09:00'} options={['09:00', '13:00', '18:00']} onChange={() => {}} />
          </SDRow>)}
        <SDRow t={t} label="Resumen diario" desc="Un correo cada mañana con el plan del día." last>
          <SToggle t={t} on={digest} onChange={setDigest} />
        </SDRow>
      </React.Fragment>);

    if (sec === 'tareas') return (
      <React.Fragment>
        <SSectionTitle t={t}>Tareas</SSectionTitle>
        <div style={{ height: 8 }} />
        <SDRow t={t} label="La semana empieza el lunes" desc="Afecta al orden de los días en las fechas.">
          <SToggle t={t} on={monday} onChange={setMonday} />
        </SDRow>
        <SDRow t={t} label="Prioridad por defecto" desc="Se aplica a las tareas nuevas sin prioridad." align="flex-start" last>
          <SSeg t={t} value={prio} options={S_PRIOS} onChange={setPrio} />
        </SDRow>
      </React.Fragment>);

    if (sec === 'datos') return (
      <React.Fragment>
        <SSectionTitle t={t}>Datos</SSectionTitle>
        <div style={{ height: 8 }} />
        <SDRow t={t} label="Exportar espacio de trabajo" desc="Descarga todas tus tareas y notas en un archivo.">
          <SBtn t={t} icon="archive" label="Exportar" onClick={() => {}} />
        </SDRow>
        <SDRow t={t} label="Importar espacio de trabajo" desc="Restaura desde un archivo exportado previamente.">
          <SBtn t={t} icon="arrowRight" label="Importar" onClick={() => {}} />
        </SDRow>
        <SDRow t={t} label="Limpiar tareas completadas" desc="Elimina de forma permanente las tareas ya hechas." last>
          <SBtn t={t} icon="trash" label="Limpiar" danger onClick={() => {}} />
        </SDRow>
      </React.Fragment>);

    return (
      <React.Fragment>
        <SSectionTitle t={t}>Acerca de</SSectionTitle>
        <div style={{ height: 8 }} />
        <SDRow t={t} label="Versión" desc="Antask para escritorio.">
          <span style={{ fontSize: 13, fontWeight: 650, color: t.ink2, fontFamily: t.fontMono }}>1.0</span>
        </SDRow>
        <SDRow t={t} label="Atajos de teclado">
          <span style={{ fontSize: 12, fontFamily: t.fontMono, color: t.ink3, padding: '3px 8px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.kbdBg }}>?</span>
        </SDRow>

        <SDRow t={t} label="Sesión" desc="Cierra la sesión en este dispositivo." last>
          <SBtn t={t} icon="logout" label="Cerrar sesión" danger onClick={() => {}} />
        </SDRow>
      </React.Fragment>);
  };

  const overlay = (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(20,14,6,0.46)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'center', padding: 24, opacity: 1, fontFamily: t.fontUI }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(760px, 96vw)', height: 'min(580px, 92vh)', display: 'flex', opacity: 1,
        background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 30px 80px -24px rgba(20,14,6,0.5), 0 8px 24px rgba(20,14,6,0.25)' }}>
        {/* nav */}
        <div style={{ width: 210, flexShrink: 0, background: t.mode === 'dark' ? 'rgba(0,0,0,0.18)' : 'rgba(60,48,30,0.035)', borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', padding: '18px 12px' }}>
          <div style={{ fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 17, letterSpacing: t.titleTrack, color: t.ink, padding: '0 8px 14px' }}>Ajustes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {S_NAV.map((n) => {
              const on = n.id === sec;
              return (
                <button key={n.id} type="button" onClick={() => setSec(n.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', font: 'inherit',
                  padding: '9px 10px', borderRadius: t.rNav, cursor: 'pointer', border: 'none',
                  background: on ? t.tintBg : 'transparent', color: on ? t.accentInk : t.ink2, transition: 'background .12s, color .12s' }}>
                  <SIco name={n.icon} size={16} sw={1.9} />
                  <span style={{ fontSize: 13.5, fontWeight: on ? 650 : 550 }}>{n.label}</span>
                </button>);
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px', borderRadius: t.rInput, color: t.ink3 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'block' }}>
              <image-slot id="antask-avatar" shape="circle" style={{ width: '28px', height: '28px', display: 'block' }} placeholder="📷" fit="cover" />
            </span>
            <div style={{ minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 650, color: t.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>miguel cantos</div>
              <div style={{ fontSize: 10.5, color: t.ink3, fontFamily: t.fontMono }}>Sincronizado</div>
            </div>
          </div>
        </div>
        {/* contenido */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
            <span onClick={onClose} style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: t.ink2, background: 'transparent', transition: 'background .12s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><SIco name="x" size={19} /></span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '2px 32px 32px' }}>
            <Section />
          </div>
        </div>
      </div>
    </div>);

  return ReactDOM.createPortal(overlay, document.body);
}
window.SettingsModal = SettingsModal;

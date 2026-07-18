/* pro-paywall.jsx — Pantalla de upgrade a Antask PRO (2 variaciones).
   ──────────────────────────────────────────────────────────────────────
   Define el plan PRO como DATO compartido y dos presentaciones del muro:
     · PaywallEditorial  — comparación cálida a dos columnas (venta + tabla)
     · PaywallFocus      — tarjeta única, directa, centrada en la conversión

   Ambas reciben { t } (el theme construido) y son coherentes con la marca.
   Exporta window.PaywallEditorial, window.PaywallFocus, window.PRO_PLAN. */

(function () {
  const PRO_GRAD = 'linear-gradient(135deg,#e0915a,#c25e3a)';
  const PRO_INK = '#c25e3a';
  const hexA = (h, a) => (window.antaskHexA ? window.antaskHexA(h, a) : h);

  /* ───────── plan (única fuente de verdad) ───────── */
  const PRO_PLAN = {
    monthly: { price: '3 €', suffix: '/mes', caption: 'facturado mensualmente' },
    annual: { price: '29 €', suffix: '/año', caption: '2,42 €/mes · facturado anual', save: '−19%' },
    trialDays: 7,
    features: [
      { icon: 'infinity', title: 'Proyectos ilimitados', desc: 'Sin el tope de 3. Tantos espacios como necesites.', free: '3' },
      { icon: 'note', title: 'Notas ilimitadas', desc: 'Escribe sin contar. Adiós al límite de 10.', free: '10' },
      { icon: 'palette', title: 'Todas las apariencias', desc: 'Marea, Terminal y cada pack premium que llegue.', free: 'Gratuitas' },
      { icon: 'repeat', title: 'Tareas recurrentes', desc: 'Repite a diario, semanal o a tu medida.', free: '—' },
      { icon: 'paperclip', title: 'Adjuntos y archivos', desc: 'Suma documentos e imágenes a cualquier tarea.', free: '—' },
    ],
    freeIncludes: ['3 proyectos', '10 notas', 'Apariencias gratuitas', 'Todos los modos de vista'],
  };

  /* ───────── iconos locales (autónomos) ───────── */
  function PIco({ name, size = 18, sw = 1.85, style }) {
    const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
    switch (name) {
      case 'x': return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
      case 'check': return <svg {...p} strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>;
      case 'sparkles': return <svg {...p}><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z" /><path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" /></svg>;
      case 'infinity': return <svg {...p}><path d="M6.5 9a3 3 0 1 0 0 6c1.5 0 2.6-1.2 3.5-2.5L12 10.5C12.9 9.2 14 8 15.5 8a3 3 0 1 1 0 6c-1.5 0-2.6-1.2-3.5-2.5" /></svg>;
      case 'note': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>;
      case 'palette': return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-.9.7-1.5 1.6-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7.5-9-7.5Z" /><circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="16.5" cy="11" r="1.1" fill="currentColor" stroke="none" /></svg>;
      case 'repeat': return <svg {...p}><path d="M17 2l3 3-3 3" /><path d="M4 11V9a4 4 0 0 1 4-4h12" /><path d="M7 22l-3-3 3-3" /><path d="M20 13v2a4 4 0 0 1-4 4H4" /></svg>;
      case 'paperclip': return <svg {...p}><path d="M21 8.5l-9 9a4.5 4.5 0 0 1-6.4-6.4l9-9a3 3 0 0 1 4.3 4.3l-9 9a1.5 1.5 0 0 1-2.1-2.1l8.3-8.3" /></svg>;
      case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
      case 'arrowRight': return <svg {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
      case 'shield': return <svg {...p}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /></svg>;
      default: return null;
    }
  }

  /* ───────── átomos compartidos ───────── */
  function ProMark({ size = 52, radius = 15 }) {
    return (
      <span style={{ width: size, height: size, borderRadius: radius, background: PRO_GRAD, display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 10px 24px -10px rgba(194,94,58,0.65)' }}>
        <PIco name="sparkles" size={size * 0.5} sw={1.9} />
      </span>);
  }

  function Wordmark({ t }) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 16, letterSpacing: t.titleTrack, color: t.ink }}>antask</span>
        <span style={{ fontFamily: t.fontMono, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#fff', background: PRO_GRAD, padding: '3px 8px', borderRadius: 5 }}>PRO</span>
      </span>);
  }

  function BillingToggle({ t, value, onChange }) {
    const opts = [{ k: 'monthly', label: 'Mensual' }, { k: 'annual', label: 'Anual' }];
    return (
      <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: t.segBg, borderRadius: t.rSeg + 2, border: `1px solid ${t.border}` }}>
        {opts.map((o) => {
          const on = o.k === value;
          return (
            <button key={o.k} type="button" onClick={() => onChange(o.k)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: t.rSeg - 1, cursor: 'pointer', border: 'none', font: 'inherit',
              fontSize: 13.5, fontWeight: on ? 650 : 550, fontFamily: t.fontUI, color: on ? t.accentInk : t.ink2,
              background: on ? t.segOn : 'transparent', boxShadow: on ? t.segShadow : 'none', transition: 'background .12s, color .12s',
            }}>
              {o.label}
              {o.k === 'annual' && (
                <span style={{ fontSize: 10.5, fontWeight: 800, fontFamily: t.fontMono, color: on ? '#fff' : PRO_INK, background: on ? PRO_GRAD : hexA(PRO_INK, 0.12), padding: '2px 6px', borderRadius: 999, lineHeight: 1 }}>−19%</span>
              )}
            </button>);
        })}
      </div>);
  }

  function PriceBlock({ t, billing, align = 'flex-start' }) {
    const p = PRO_PLAN[billing];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 44, letterSpacing: '-0.02em', color: t.ink, lineHeight: 1 }}>{p.price}</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: t.ink2 }}>{p.suffix}</span>
        </div>
        <span style={{ fontSize: 12.5, color: t.ink3, fontFamily: t.fontMono }}>{p.caption}</span>
      </div>);
  }

  function CTA({ t, label, full, onClick }) {
    const [h, setH] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} style={{
        width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        padding: '14px 24px', borderRadius: t.rInput + 2, border: 'none', cursor: 'pointer', font: 'inherit',
        fontSize: 15, fontWeight: 700, fontFamily: t.fontUI, color: '#fff', background: PRO_GRAD,
        boxShadow: h ? '0 16px 34px -12px rgba(194,94,58,0.75)' : '0 10px 24px -12px rgba(194,94,58,0.6)',
        transform: h ? 'translateY(-1px)' : 'none', transition: 'transform .14s, box-shadow .14s',
      }}>
        <PIco name="sparkles" size={17} sw={2} />{label}
      </button>);
  }

  function FeatureRow({ t, f, showFree }) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: `1px solid ${t.border}` }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk, flexShrink: 0 }}>
          <PIco name={f.icon} size={19} sw={1.85} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 650, color: t.ink, letterSpacing: '-0.005em' }}>{f.title}</div>
          <div style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, lineHeight: 1.4 }}>{f.desc}</div>
        </div>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: hexA(PRO_INK, 0.13), display: 'grid', placeItems: 'center', color: PRO_INK, flexShrink: 0, marginTop: 7 }}>
          <PIco name="check" size={13} sw={3} />
        </span>
      </div>);
  }

  function FreeFootnote({ t, center }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: center ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.ink3 }}>
          <PIco name="lock" size={13} sw={2} />Gratis
        </span>
        <span style={{ fontSize: 12.5, color: t.ink3, lineHeight: 1.5 }}>
          {PRO_PLAN.freeIncludes.join(' · ')}
        </span>
      </div>);
  }

  function CloseBtn({ t, onClick }) {
    const [h, setH] = React.useState(false);
    return (
      <button type="button" onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onClick} aria-label="Cerrar"
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 5, width: 34, height: 34, borderRadius: 10, border: `1px solid ${h ? t.border : 'transparent'}`, cursor: 'pointer', background: h ? t.inputBg : 'transparent', color: t.ink2, display: 'grid', placeItems: 'center', transition: 'background .12s, border-color .12s' }}>
        <PIco name="x" size={18} />
      </button>);
  }

  /* ════════════════════ VARIACIÓN A — EDITORIAL ════════════════════ */
  function PaywallEditorial({ t, onClose, onUpgrade }) {
    const [billing, setBilling] = React.useState('annual');
    return (
      <div style={{ width: 920, height: 648, background: t.card, borderRadius: 22, overflow: 'hidden', display: 'flex', position: 'relative', fontFamily: t.fontUI, border: `1px solid ${t.border}`, boxShadow: t.shellShadow }}>
        <CloseBtn t={t} onClick={onClose} />

        {/* columna de venta */}
        <div style={{ width: 372, flexShrink: 0, padding: '46px 40px 40px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.border}`, background: `linear-gradient(165deg, ${hexA(PRO_INK, 0.09)} 0%, transparent 46%)` }}>
          <Wordmark t={t} />
          <h1 style={{ margin: '28px 0 0', fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 38, lineHeight: 1.08, letterSpacing: '-0.02em', color: t.ink, textWrap: 'balance' }}>
            Tu espacio,<br />sin límites.
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: 14.5, lineHeight: 1.55, color: t.ink2, maxWidth: 280 }}>
            Quita los topes, abre cada apariencia y deja que Antask crezca contigo.
          </p>

          <div style={{ flex: 1 }} />

          <BillingToggle t={t} value={billing} onChange={setBilling} />
          <div style={{ height: 18 }} />
          <PriceBlock t={t} billing={billing} />
          <div style={{ height: 22 }} />
          <CTA t={t} full label={`Empieza ${PRO_PLAN.trialDays} días gratis`} onClick={() => onUpgrade && onUpgrade(billing)} />
          <p style={{ margin: '13px 0 0', fontSize: 12, color: t.ink3, textAlign: 'center', lineHeight: 1.5 }}>
            Luego {PRO_PLAN[billing].price}{PRO_PLAN[billing].suffix} · cancela cuando quieras
          </p>
        </div>

        {/* columna de contenido */}
        <div style={{ flex: 1, minWidth: 0, padding: '46px 44px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.accentInk, marginBottom: 6 }}>
            Incluido en PRO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PRO_PLAN.features.map((f) => <FeatureRow key={f.title} t={t} f={f} />)}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ marginTop: 22, padding: '15px 17px', borderRadius: t.rInput + 2, background: t.inputBg, border: `1px solid ${t.border}` }}>
            <FreeFootnote t={t} />
          </div>
        </div>
      </div>);
  }

  /* ════════════════════ VARIACIÓN B — ENFOQUE ════════════════════ */
  function PaywallFocus({ t, onClose, onUpgrade }) {
    const [billing, setBilling] = React.useState('annual');
    return (
      <div style={{ width: 460, height: 712, background: t.card, borderRadius: 22, overflow: 'hidden', position: 'relative', fontFamily: t.fontUI, border: `1px solid ${t.border}`, boxShadow: t.shellShadow, display: 'flex', flexDirection: 'column' }}>
        <CloseBtn t={t} onClick={onClose} />

        {/* cabecera */}
        <div style={{ padding: '44px 38px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: `linear-gradient(180deg, ${hexA(PRO_INK, 0.1)} 0%, transparent 100%)` }}>
          <ProMark size={58} radius={17} />
          <h1 style={{ margin: '20px 0 0', fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 30, letterSpacing: '-0.02em', color: t.ink, whiteSpace: 'nowrap' }}>
            Antask PRO
          </h1>
          <p style={{ margin: '9px 0 0', fontSize: 14.5, lineHeight: 1.5, color: t.ink2, maxWidth: 300 }}>
            Quita los límites y hazlo del todo tuyo.
          </p>
        </div>

        {/* precio + CTA */}
        <div style={{ padding: '0 38px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <BillingToggle t={t} value={billing} onChange={setBilling} />
          <PriceBlock t={t} billing={billing} align="center" />
          <CTA t={t} full label={`Empezar prueba de ${PRO_PLAN.trialDays} días`} onClick={() => onUpgrade && onUpgrade(billing)} />
          <p style={{ margin: 0, fontSize: 12, color: t.ink3, textAlign: 'center' }}>
            Luego {PRO_PLAN[billing].price}{PRO_PLAN[billing].suffix} · cancela cuando quieras
          </p>
        </div>

        {/* features */}
        <div style={{ padding: '24px 38px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 1, background: t.border, marginBottom: 6 }} />
          {PRO_PLAN.features.map((f) => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: hexA(PRO_INK, 0.13), display: 'grid', placeItems: 'center', color: PRO_INK, flexShrink: 0 }}>
                <PIco name="check" size={12} sw={3} />
              </span>
              <span style={{ fontSize: 14, fontWeight: 550, color: t.ink }}>{f.title}</span>
            </div>
          ))}
        </div>

        {/* pie */}
        <div style={{ padding: '16px 38px 30px' }}>
          <div style={{ padding: '13px 16px', borderRadius: t.rInput + 2, background: t.inputBg, border: `1px solid ${t.border}` }}>
            <FreeFootnote t={t} center />
          </div>
        </div>
      </div>);
  }

  /* ════════════════════ MODAL (overlay sobre la app) ════════════════════
     Envuelve la variación elegida (A · Editorial por defecto) en un portal
     con backdrop + Esc. onUpgrade simula la compra (el host marca pro:true). */
  function ProUpgradeModal({ t, variant = 'editorial', onClose, onUpgrade }) {
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose && onClose(); } };
      document.addEventListener('keydown', onKey, true);
      return () => document.removeEventListener('keydown', onKey, true);
    }, [onClose]);
    const Inner = variant === 'focus' ? PaywallFocus : PaywallEditorial;
    return ReactDOM.createPortal(
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9800, background: 'rgba(20,14,6,0.52)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 'clamp(12px, 3vw, 40px)', overflow: 'auto', fontFamily: t.fontUI }}>
        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          <Inner t={t} onClose={onClose} onUpgrade={onUpgrade} />
        </div>
      </div>, document.body);
  }

  window.PRO_PLAN = PRO_PLAN;
  window.PaywallEditorial = PaywallEditorial;
  window.PaywallFocus = PaywallFocus;
  window.ProUpgradeModal = ProUpgradeModal;
})();

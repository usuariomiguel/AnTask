/* appearances.jsx — Biblioteca de apariencias para Antask.
   ──────────────────────────────────────────────────────────────────────
   Una "apariencia" (pack) es un preset COMPLETO de tokens: paleta, tipo,
   forma y atmósfera. Cada pack declara sus capacidades (modos disponibles,
   acentos ajustables) y si es PRO.

   Arquitectura: el pack es DATO. `pack.build(tw)` devuelve un theme completo
   con la misma forma que window.ANTASK_THEMES (lo que consumen todas las
   vistas). Los packs "cálidos" (Tierra/Papel) delegan en buildAntaskTheme
   para no duplicar; los nuevos se construyen sobre la base oscura/clara.

   Exporta:
     window.ANTASK_APPEARANCES        (array ordenado)
     window.ANTASK_APPEARANCE_BY_ID   (mapa id → pack)
     window.buildAppearanceTheme(tw)  (selector central)
     window.AppearancePreview         (mini-app esquemática)
     window.AppearanceLibrary         (galería tipo store) */

(function () {
  const hexA = (hex, a) => (window.antaskHexA ? window.antaskHexA(hex, a) : hex);
  const TH = () => window.ANTASK_THEMES;

  /* ───────── tipografías de los packs (cargadas en el HTML) ───────── */
  const PF = {
    inter: "'Inter', system-ui, sans-serif",
    jb: "'JetBrains Mono', monospace",
    serif: "'Newsreader', Georgia, serif",
    grotesk: "'Bricolage Grotesque', 'Inter', sans-serif",
    outfit: "'Outfit', 'Inter', sans-serif",
    spectral: "'Spectral', Georgia, serif",
    plex: "'IBM Plex Mono', 'JetBrains Mono', monospace",
  };

  const sombra = (dark) => dark
    ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 22px -6px rgba(0,0,0,0.55), 0 26px 52px -16px rgba(0,0,0,0.6)'
    : '0 1px 2px rgba(40,30,15,0.05), 0 6px 14px -4px rgba(40,30,15,0.10), 0 18px 36px -12px rgba(40,30,15,0.18)';

  const isDark = (tw) => tw && tw.mode === 'Oscuro';
  const floatingOf = (tw) => (tw && tw.shell === 'Pegado') ? 'flush' : 'floating';

  /* ════════════════════════ ACENTOS POR PACK ════════════════════════ */
  const TERM_ACCENTS = { verde: '#33ff7b', ambar: '#ffb454', cian: '#3bdcff', magenta: '#ff5cf0' };

  /* ════════════════════════ BUILDERS DE PACK ════════════════════════ */

  /* —— MAREA (acuático) —— atmósfera; abismo oscuro + bajíos claros —— */
  function buildMarea(tw) {
    const dark = isDark(tw);
    const base = { ...(dark ? TH().oscuro : TH().tierra) };
    const shell = floatingOf(tw);
    const t = {
      ...base, mode: dark ? 'dark' : 'light',
      fontUI: PF.inter, fontMono: PF.jb, fontDisplay: PF.outfit,
      titleWeight: 600, titleTrack: '-0.02em', titleSize: 31, brandWeight: 600,
      rPill: 999, rInput: 14, rSeg: 11, rTag: 8, rNav: 11, rowRadius: 12, checkRadius: '50%',
      rowDivider: true, zebra: false, bars: false, monoMeta: false, tagBorder: false, segShadow: 'none',
    };
    if (dark) Object.assign(t, {
      canvas: '#06141c', card: '#0e2531',
      ink: '#e9f7fb', ink2: '#9ec6d2', ink3: '#5f8a98',
      border: 'rgba(125,211,235,0.13)',
      accent: '#2dd4bf', accentInk: '#5fe4d4', accentOn: '#04201f',
      tintBg: 'rgba(45,212,191,0.16)', grad: 'linear-gradient(135deg,#22d3ee,#2dd4bf)',
      consultaFg: '#7dd3fc', consultaBg: 'rgba(125,211,252,0.15)',
      segBg: 'rgba(125,211,235,0.06)', segOn: '#123243',
      inputBg: 'rgba(125,211,235,0.05)', kbdBg: 'rgba(125,211,235,0.09)', rowHover: 'rgba(125,211,235,0.055)',
      listColors: { Buceo: '#22d3ee', inversion: '#fcd34d' },
      tags: {
        green: { bg: 'rgba(45,212,191,.16)', fg: '#5fe4d4' },
        amber: { bg: 'rgba(252,211,77,.15)', fg: '#fcd34d' },
        slate: { bg: 'rgba(148,180,200,.14)', fg: '#b6d2dc' },
      },
      sb: { bg: '#04101a', ink: '#e9f7fb', ink2: '#9ec6d2', ink3: '#5f8a98', border: 'rgba(125,211,235,0.08)', activeBg: 'rgba(45,212,191,0.17)', inputBg: 'rgba(125,211,235,0.05)', barTrack: 'rgba(125,211,235,0.12)', accentInk: '#5fe4d4' },
      desk: 'radial-gradient(125% 85% at 80% -12%, #0a3b46 0%, #061a24 50%, #030c12 100%)',
    });
    else Object.assign(t, {
      canvas: '#eaf4f5', card: '#ffffff',
      ink: '#0c2a32', ink2: '#4e7079', ink3: '#85a6ad',
      border: 'rgba(12,60,72,0.11)',
      accent: '#0891b2', accentInk: '#0c7c93', accentOn: '#ffffff',
      tintBg: 'rgba(8,145,178,0.12)', grad: 'linear-gradient(135deg,#22b8cf,#0891b2)',
      consultaFg: '#2f6f9e', consultaBg: 'rgba(47,111,158,0.12)',
      segBg: '#dcecee', segOn: '#ffffff', segShadow: '0 1px 2px rgba(12,60,72,0.10)',
      inputBg: '#ffffff', kbdBg: '#dcecee', rowHover: '#e2eff0',
      listColors: { Buceo: '#0891b2', inversion: '#c2873a' },
      tags: {
        green: { bg: 'rgba(8,145,178,.13)', fg: '#0c7c93' },
        amber: { bg: 'rgba(194,135,58,.16)', fg: '#945f1c' },
        slate: { bg: 'rgba(80,120,135,.13)', fg: '#4e7079' },
      },
      sb: { bg: '#0c2a32', ink: '#eef7f8', ink2: '#a8c6cc', ink3: '#739198', border: 'rgba(220,240,245,0.09)', activeBg: 'rgba(34,184,207,0.20)', inputBg: 'rgba(220,240,245,0.06)', barTrack: 'rgba(220,240,245,0.12)', accentInk: '#4cc6db' },
      desk: 'radial-gradient(125% 85% at 82% -12%, #cfe9ec 0%, #e1f0f1 52%, #d6e9ea 100%)',
    });
    return finish(t, dark, shell);
  }

  /* —— BOSQUE (naturaleza) —— atmósfera; serif + verdes orgánicos —— */
  function buildBosque(tw) {
    const dark = isDark(tw);
    const base = { ...(dark ? TH().oscuro : TH().tierra) };
    const shell = floatingOf(tw);
    const t = {
      ...base, mode: dark ? 'dark' : 'light',
      fontUI: PF.inter, fontMono: PF.jb, fontDisplay: PF.spectral,
      titleWeight: 500, titleTrack: '-0.005em', titleSize: 33, brandWeight: 600,
      rPill: 999, rInput: 10, rSeg: 9, rTag: 7, rNav: 9, rowRadius: 9, checkRadius: '50%',
      rowDivider: true, zebra: false, bars: false, monoMeta: false, tagBorder: false,
    };
    if (dark) Object.assign(t, {
      canvas: '#0f160e', card: '#172118',
      ink: '#e7f0e0', ink2: '#a7b89c', ink3: '#6c7d61',
      border: 'rgba(200,230,180,0.10)',
      accent: '#8fce5a', accentInk: '#a6db74', accentOn: '#13200c',
      tintBg: 'rgba(143,206,90,0.15)', grad: 'linear-gradient(135deg,#a3d96f,#5f9a36)',
      consultaFg: '#6fc9b0', consultaBg: 'rgba(111,201,176,0.14)',
      segBg: 'rgba(200,230,180,0.05)', segOn: '#1d2a19', segShadow: 'none',
      inputBg: 'rgba(200,230,180,0.045)', kbdBg: 'rgba(200,230,180,0.07)', rowHover: 'rgba(200,230,180,0.05)',
      listColors: { Buceo: '#6fc9b0', inversion: '#d3a14e' },
      tags: {
        green: { bg: 'rgba(143,206,90,.16)', fg: '#a6db74' },
        amber: { bg: 'rgba(211,161,78,.16)', fg: '#e0bd7a' },
        slate: { bg: 'rgba(170,185,155,.13)', fg: '#c2ccb2' },
      },
      sb: { bg: '#0a110a', ink: '#e7f0e0', ink2: '#a7b89c', ink3: '#6c7d61', border: 'rgba(200,230,180,0.07)', activeBg: 'rgba(143,206,90,0.16)', inputBg: 'rgba(200,230,180,0.045)', barTrack: 'rgba(200,230,180,0.10)', accentInk: '#a6db74' },
      desk: 'radial-gradient(125% 95% at 14% -12%, #16240f 0%, #0d150b 55%, #080d07 100%)',
    });
    else Object.assign(t, {
      canvas: '#edf1e4', card: '#fbfdf6',
      ink: '#1f2719', ink2: '#54614a', ink3: '#8a9778',
      border: 'rgba(40,55,25,0.12)',
      accent: '#4d7c2f', accentInk: '#3f6826', accentOn: '#fbfdf6',
      tintBg: 'rgba(77,124,47,0.13)', grad: 'linear-gradient(135deg,#6ba83f,#3f6826)',
      consultaFg: '#2f7d6b', consultaBg: 'rgba(47,125,107,0.13)',
      segBg: '#e3ead4', segOn: '#fbfdf6', segShadow: '0 1px 2px rgba(40,55,25,0.10)',
      inputBg: '#fbfdf6', kbdBg: '#e3ead4', rowHover: '#e8efda',
      listColors: { Buceo: '#2f8a6d', inversion: '#b9842f' },
      tags: {
        green: { bg: 'rgba(77,124,47,.14)', fg: '#3f6826' },
        amber: { bg: 'rgba(185,132,47,.16)', fg: '#86591a' },
        slate: { bg: 'rgba(110,120,90,.13)', fg: '#54614a' },
      },
      sb: { bg: '#1c2a18', ink: '#e8efdd', ink2: '#a6b596', ink3: '#71805f', border: 'rgba(230,240,210,0.08)', activeBg: 'rgba(107,168,63,0.20)', inputBg: 'rgba(230,240,210,0.05)', barTrack: 'rgba(230,240,210,0.10)', accentInk: '#9ccb6a' },
      desk: 'radial-gradient(125% 95% at 14% -12%, #dfe7cd 0%, #e7edd9 55%, #e1e8d0 100%)',
    });
    return finish(t, dark, shell);
  }

  /* —— TERMINAL (retro/cyber) —— "mundo"; mono fosforescente, scanlines —— */
  function buildTerminal(tw) {
    const a = TERM_ACCENTS[tw && tw.accent] || TERM_ACCENTS.verde;
    const base = { ...TH().oscuro };
    const shell = floatingOf(tw);
    const t = {
      ...base, mode: 'dark',
      fontUI: PF.plex, fontMono: PF.plex, fontDisplay: PF.plex,
      titleWeight: 600, titleTrack: '0', titleSize: 26, brandWeight: 700,
      monoMeta: true, bars: true, tagBorder: true, zebra: true, zebraBg: 'rgba(120,255,170,0.028)',
      rPill: 3, rInput: 2, rSeg: 2, rTag: 2, rNav: 3, rowRadius: 2, checkRadius: 2,
      rowDivider: true, segShadow: 'none',
      canvas: '#070b09', card: '#0c120e',
      ink: '#d6f7de', ink2: '#7bb78f', ink3: '#4d7159',
      border: 'rgba(120,255,170,0.15)',
      accent: a, accentInk: a, accentOn: '#05140a',
      tintBg: hexA(a, 0.13), grad: `linear-gradient(135deg,${a},${a})`,
      consultaFg: '#3bdcff', consultaBg: 'rgba(59,220,255,0.12)',
      segBg: 'rgba(120,255,170,0.05)', segOn: '#0e1a12',
      inputBg: 'rgba(120,255,170,0.04)', kbdBg: 'rgba(120,255,170,0.08)', rowHover: 'rgba(120,255,170,0.05)',
      listColors: { Buceo: '#3bdcff', inversion: a },
      tags: {
        green: { bg: hexA(a, 0.13), fg: a, bd: hexA(a, 0.4) },
        amber: { bg: 'rgba(255,180,84,.14)', fg: '#ffb454', bd: 'rgba(255,180,84,.4)' },
        slate: { bg: 'rgba(123,183,143,.12)', fg: '#9ecdaa', bd: 'rgba(123,183,143,.3)' },
      },
      sb: { bg: '#050807', ink: '#d6f7de', ink2: '#7bb78f', ink3: '#4d7159', border: 'rgba(120,255,170,0.1)', activeBg: hexA(a, 0.16), inputBg: 'rgba(120,255,170,0.04)', barTrack: 'rgba(120,255,170,0.12)', accentInk: a },
      desk: 'repeating-linear-gradient(0deg, #050907 0px, #050907 2px, #070d0a 3px, #070d0a 4px)',
    };
    return finish(t, true, shell);
  }

  /* —— AURORA (visión) —— obsidiana + degradado violeta→rosa→cian —— */
  function buildAurora(tw) {
    const base = { ...TH().oscuro };
    const shell = floatingOf(tw);
    const t = {
      ...base, mode: 'dark',
      fontUI: PF.inter, fontMono: PF.jb, fontDisplay: PF.inter,
      titleWeight: 800, titleTrack: '-0.03em', titleSize: 32, brandWeight: 700,
      rPill: 999, rInput: 12, rSeg: 10, rTag: 999, rNav: 9, rowRadius: 11, checkRadius: '50%',
      rowDivider: true, zebra: false, bars: false, monoMeta: true, tagBorder: false, segShadow: 'none',
      canvas: '#0b0b12', card: '#13131d',
      ink: '#f5f4fa', ink2: '#b6b4c8', ink3: '#807e95',
      border: 'rgba(255,255,255,0.09)',
      accent: '#8b5cf6', accentInk: '#c4b5fd', accentOn: '#ffffff',
      tintBg: 'rgba(139,92,246,0.16)',
      grad: 'linear-gradient(120deg,#8b5cf6 0%,#ec4899 52%,#22d3ee 100%)',
      consultaFg: '#67e8f9', consultaBg: 'rgba(34,211,238,0.12)',
      segBg: 'rgba(255,255,255,0.04)', segOn: '#1e1e2c',
      inputBg: 'rgba(255,255,255,0.035)', kbdBg: 'rgba(255,255,255,0.06)', rowHover: 'rgba(255,255,255,0.045)',
      listColors: { Buceo: '#22d3ee', inversion: '#f472b6' },
      tags: {
        green: { bg: 'rgba(52,211,153,.14)', fg: '#6ee7b7' },
        amber: { bg: 'rgba(251,191,36,.13)', fg: '#fcd34d' },
        slate: { bg: 'rgba(167,139,250,.15)', fg: '#c4b5fd' },
      },
      sb: { bg: '#08080e', ink: '#f5f4fa', ink2: '#b6b4c8', ink3: '#807e95', border: 'rgba(255,255,255,0.06)', activeBg: 'rgba(139,92,246,0.18)', inputBg: 'rgba(255,255,255,0.035)', barTrack: 'rgba(255,255,255,0.12)', accentInk: '#c4b5fd' },
      desk: 'radial-gradient(120% 90% at 14% -10%, #1c1233 0%, #0a0a12 48%, #07070b 100%)',
    };
    return finish(t, true, shell);
  }

  /* —— CENIZA (mundo) —— hierro frío, ceniza y oro pálido. Oscuro puro ——
     Referencia de ánimo: fantasía oscura melancólica. Tokens propios:
     lienzo casi negro con tinte verde-hierro, tarjetas de piedra húmeda,
     tipografía serif grabada en títulos, filas con hairline de oro. */
  function buildCeniza(tw) {
    const base = { ...TH().oscuro };
    const shell = floatingOf(tw);
    const oro = '#c9a961';
    const t = {
      ...base, mode: 'dark',
      fontUI: PF.inter, fontMono: PF.plex, fontDisplay: PF.spectral,
      titleWeight: 500, titleTrack: '0.01em', titleSize: 34, brandWeight: 500,
      rPill: 4, rInput: 3, rSeg: 3, rTag: 2, rNav: 3, rowRadius: 3, checkRadius: '50%',
      rowDivider: true, zebra: false, bars: true, monoMeta: true, tagBorder: true, segShadow: 'none',
      canvas: '#0b0c0b', card: '#151715',
      ink: '#e6e2d6', ink2: '#a09a8b', ink3: '#6b665b',
      border: 'rgba(201,169,97,0.16)',
      accent: oro, accentInk: '#dcc07e', accentOn: '#14120b',
      tintBg: 'rgba(201,169,97,0.13)',
      grad: 'linear-gradient(135deg,#dcc07e,#a8813c)',
      consultaFg: '#8fa8a4', consultaBg: 'rgba(143,168,164,0.12)',
      segBg: 'rgba(201,169,97,0.05)', segOn: '#1e211d',
      inputBg: 'rgba(230,226,214,0.035)', kbdBg: 'rgba(201,169,97,0.09)', rowHover: 'rgba(201,169,97,0.055)',
      listColors: { Buceo: '#8fa8a4', inversion: oro },
      tags: {
        green: { bg: 'rgba(201,169,97,.11)', fg: '#dcc07e', bd: 'rgba(201,169,97,.34)' },
        amber: { bg: 'rgba(158,58,48,.16)', fg: '#d08a7c', bd: 'rgba(158,58,48,.42)' },
        slate: { bg: 'rgba(160,154,139,.10)', fg: '#b3ada0', bd: 'rgba(160,154,139,.26)' },
      },
      sb: { bg: '#080908', ink: '#e6e2d6', ink2: '#a09a8b', ink3: '#6b665b', border: 'rgba(201,169,97,0.10)', activeBg: 'rgba(201,169,97,0.14)', inputBg: 'rgba(230,226,214,0.035)', barTrack: 'rgba(201,169,97,0.12)', accentInk: '#dcc07e' },
      desk: 'radial-gradient(130% 100% at 50% 118%, #2a1d10 0%, #14130f 34%, #0a0b0a 72%, #050605 100%)',
    };
    return finish(t, true, shell);
  }

  function finish(t, dark, shell) {
    t.shell = shell;
    t.shellPanel = t.card;
    t.shellShadow = sombra(dark);
    return t;
  }

  /* ════════════════════════ REGISTRO DE PACKS ════════════════════════ */
  /* depth: 'tinte' | 'atmosfera' | 'mundo' · caps.modes: ['light','dark']
     caps.accents: null | { order, swatch(k), def } */
  const ANTASK_APPEARANCES = [
    {
      id: 'tierra', name: 'Tierra', tagline: 'Cálida, terrosa, por defecto. Arcilla sobre papel.',
      group: 'Cálidas', depth: 'atmosfera', pro: false,
      caps: { modes: ['light', 'dark'], accents: { order: null, swatch: null, def: 'oliva', warm: true }, font: false },
      swatches: ['#ad5230', '#6f7a3d', '#f4efe3', '#221d16'],
      build: (tw) => window.buildAntaskTheme({ ...tw, accent: warmAccent(tw.accent) }, { checkRadius: '50%' }),
    },
    {
      id: 'papel', name: 'Papel editorial', tagline: 'Crema, serif y terracota. Como un cuaderno.',
      group: 'Cálidas', depth: 'tinte', pro: false,
      caps: { modes: ['light'], accents: null, font: false },
      swatches: ['#c25e3a', '#3d6e85', '#f7f2e8', '#2c2620'],
      build: (tw) => {
        const t = { ...TH().papel };
        return finish(t, false, floatingOf(tw));
      },
    },
    {
      id: 'marea', name: 'Marea', tagline: 'Profundidad oceánica, turquesa y vidrio. Respira.',
      group: 'Frescas', depth: 'atmosfera', pro: true,
      caps: { modes: ['light', 'dark'], accents: null, font: false },
      swatches: ['#2dd4bf', '#22d3ee', '#0e2531', '#06141c'],
      defaultMode: 'Oscuro',
      build: buildMarea,
    },
    {
      id: 'bosque', name: 'Bosque', tagline: 'Verde musgo y luz filtrada. Calma orgánica.',
      group: 'Frescas', depth: 'atmosfera', pro: false,
      caps: { modes: ['light', 'dark'], accents: null, font: false },
      swatches: ['#4d7c2f', '#8fce5a', '#edf1e4', '#0f160e'],
      build: buildBosque,
    },
    {
      id: 'terminal', name: 'Terminal', tagline: 'Monoespacio fosforescente y scanlines. Modo hacker.',
      group: 'Especiales', depth: 'mundo', pro: true,
      caps: { modes: ['dark'], accents: { order: ['verde', 'ambar', 'cian', 'magenta'], swatch: (k) => TERM_ACCENTS[k], def: 'verde' }, font: false },
      swatches: ['#33ff7b', '#3bdcff', '#0c120e', '#070b09'],
      defaultMode: 'Oscuro',
      build: buildTerminal,
    },
    {
      id: 'aurora', name: 'Aurora', tagline: 'Obsidiana profunda y aurora violeta→rosa→cian. La visión.',
      group: 'Especiales', depth: 'atmosfera', pro: false,
      caps: { modes: ['dark'], accents: null, font: false },
      swatches: ['#8b5cf6', '#ec4899', '#22d3ee', '#0b0b12'],
      defaultMode: 'Oscuro',
      build: buildAurora,
    },
    {
      id: 'ceniza', name: 'Ceniza', tagline: 'Hierro frío, ceniza y oro pálido. Cada tarea, una hoguera.',
      group: 'Especiales', depth: 'mundo', pro: true,
      caps: { modes: ['dark'], accents: null, font: false },
      swatches: ['#c9a961', '#9e3a30', '#151715', '#0b0c0b'],
      defaultMode: 'Oscuro',
      build: buildCeniza,
    },
  ];

  function warmAccent(k) {
    const A = window.ANTASK_ACCENTS || {};
    return A[k] ? k : 'oliva';
  }

  const BY_ID = {};
  ANTASK_APPEARANCES.forEach((p) => { BY_ID[p.id] = p; });

  /* selector central: el HTML llama a esto para construir el theme activo */
  function buildAppearanceTheme(tw) {
    const pack = BY_ID[tw.appearance] || BY_ID.tierra;
    // respeta capacidades del pack (modo disponible)
    const tw2 = { ...tw };
    if (!pack.caps.modes.includes('dark') && tw2.mode === 'Oscuro') tw2.mode = 'Claro';
    if (!pack.caps.modes.includes('light') && tw2.mode === 'Claro') tw2.mode = 'Oscuro';
    return pack.build(tw2);
  }

  /* ════════════════════════ ÍCONOS LOCALES ════════════════════════ */
  function LockIco({ size = 13, sw = 2, style }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
        <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>);
  }
  const Ico = (p) => React.createElement(window.Ico, p);

  /* ════════════════════════ MINI-APP ESQUEMÁTICA ════════════════════════
     Render fiel pero ligero de la app en un theme dado. No corre HoyView:
     dibuja un sidebar + lista "Hoy" a escala. */
  const PREV_TASKS = [
    { title: 'Revisar la propuesta', tag: 'trabajo', done: false, prio: true },
    { title: 'Reservar el vuelo a Bali', tag: 'buceo', done: false },
    { title: 'Llamar al equipo', tag: null, done: true },
  ];

  function AppearancePreview({ theme: t, height = 196, big = false }) {
    const k = big ? 1.34 : 1;
    const nav = [
      { ic: 'sun', label: 'Hoy', on: true },
      { ic: 'inbox', label: 'Inbox', on: false },
      { ic: 'note', label: 'Notas', on: false },
    ];
    const tagC = t.tags.green;
    return (
      <div style={{
        height, width: '100%', background: t.desk, padding: 10 * k, display: 'flex', gap: 7 * k,
        fontFamily: t.fontUI, boxSizing: 'border-box', overflow: 'hidden', borderRadius: 0,
      }}>
        {/* sidebar */}
        <div style={{
          width: 76 * k, flexShrink: 0, background: t.sb.bg, borderRadius: Math.min(14, t.rInput + 3),
          padding: 9 * k, display: 'flex', flexDirection: 'column', gap: 8 * k, border: `1px solid ${t.sb.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 * k, marginBottom: 2 * k }}>
            <span style={{ width: 13 * k, height: 13 * k, borderRadius: 4, background: t.accent, flexShrink: 0 }} />
            <span style={{ fontFamily: t.fontDisplay, fontWeight: t.brandWeight, fontSize: 11 * k, color: t.sb.ink, letterSpacing: t.titleTrack }}>antask</span>
          </div>
          {nav.map((n) => (
            <div key={n.label} style={{
              display: 'flex', alignItems: 'center', gap: 6 * k, padding: `${4.5 * k}px ${6 * k}px`,
              borderRadius: Math.min(9, t.rNav), background: n.on ? t.sb.activeBg : 'transparent',
              color: n.on ? (t.sb.accentInk || t.accentInk) : t.sb.ink2,
            }}>
              <span style={{ display: 'flex' }}><Ico name={n.ic} size={11 * k} sw={1.9} /></span>
              <span style={{ fontSize: 9.5 * k, fontWeight: n.on ? 650 : 500 }}>{n.label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 4 * k }}>
            <span style={{ width: 6 * k, height: 6 * k, borderRadius: '50%', background: t.listColors.Buceo }} />
            <span style={{ width: 6 * k, height: 6 * k, borderRadius: '50%', background: t.listColors.inversion }} />
          </div>
        </div>
        {/* panel */}
        <div style={{
          flex: 1, minWidth: 0, background: t.shellPanel, borderRadius: Math.min(16, t.rInput + 3),
          border: `1px solid ${t.border}`, boxShadow: t.shellShadow, padding: `${10 * k}px ${11 * k}px`,
          display: 'flex', flexDirection: 'column', gap: 8 * k, overflow: 'hidden',
        }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 * k }}>
            <span style={{ fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 16 * k, color: t.ink, letterSpacing: t.titleTrack }}>Hoy</span>
            <span style={{ fontSize: 8.5 * k, fontFamily: t.fontMono, color: t.ink3 }}>lunes, 8 jun</span>
          </div>
          {/* section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 * k }}>
            <span style={{ fontSize: 7.5 * k, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.accentInk }}>Para hoy</span>
            <span style={{ fontSize: 7 * k, fontWeight: 700, fontFamily: t.fontMono, padding: `${1 * k}px ${5 * k}px`, borderRadius: 999, background: t.tintBg, color: t.accentInk }}>3</span>
            <span style={{ flex: 1, height: 1, background: t.border }} />
          </div>
          {/* rows */}
          {PREV_TASKS.map((task, i) => {
            const bar = task.prio ? '#d98a4f' : task.tag ? (t.listColors.Buceo) : t.accent;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8 * k, position: 'relative',
                background: t.card, border: `1px solid ${t.border}`, borderRadius: t.rInput,
                padding: `${7 * k}px ${9 * k}px ${7 * k}px ${t.bars ? 11 * k : 9 * k}px`, overflow: 'hidden',
              }}>
                <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 * k, background: bar }} />
                <span style={{
                  width: 13 * k, height: 13 * k, borderRadius: t.checkRadius, flexShrink: 0,
                  display: 'grid', placeItems: 'center', color: t.accentOn,
                  background: task.done ? t.accent : 'transparent', border: task.done ? 'none' : `1.5px solid ${t.ink3}`, opacity: task.done ? 1 : 0.6,
                }}>{task.done && <Ico name="check" size={8 * k} sw={3} />}</span>
                <span style={{
                  flex: 1, minWidth: 0, fontSize: 10.5 * k, fontWeight: 500, color: task.done ? t.ink3 : t.ink,
                  textDecoration: task.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{task.title}</span>
                {task.tag && (
                  <span style={{
                    fontSize: 7.5 * k, fontWeight: 600, fontFamily: t.monoMeta ? t.fontMono : t.fontUI,
                    padding: `${1.5 * k}px ${6 * k}px`, borderRadius: t.rTag, color: tagC.fg, background: tagC.bg,
                    border: t.tagBorder ? `1px solid ${tagC.bd || 'transparent'}` : 'none', flexShrink: 0,
                  }}>{task.tag}</span>
                )}
              </div>);
          })}
        </div>
      </div>);
  }

  /* ════════════════════════ GALERÍA (STORE) ════════════════════════ */
  function Chip({ t, on, onClick, children }) {
    return (
      <button type="button" onClick={onClick} style={{
        padding: '6px 13px', borderRadius: 999, cursor: 'pointer', font: 'inherit', fontFamily: t.fontUI,
        fontSize: 12.5, fontWeight: on ? 650 : 550, whiteSpace: 'nowrap',
        color: on ? t.accentOn : t.ink2, background: on ? t.accent : t.inputBg,
        border: `1px solid ${on ? t.accent : t.border}`, transition: 'all .12s',
      }}>{children}</button>);
  }

  function Badge({ t, kind }) {
    const map = {
      mundo: { label: 'Mundo', bg: t.tintBg, fg: t.accentInk },
      atmosfera: { label: 'Atmósfera', bg: hexA(t.ink2, 0.1), fg: t.ink2 },
      tinte: { label: 'Tinte', bg: hexA(t.ink2, 0.1), fg: t.ink2 },
    };
    const c = map[kind] || map.tinte;
    return (
      <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, color: c.fg, background: c.bg }}>{c.label}</span>);
  }

  function ProTag({ t, sized = 1 }) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5 * sized, fontWeight: 800, fontFamily: t.fontMono, letterSpacing: '0.06em', padding: `${3 * sized}px ${8 * sized}px`, borderRadius: 5, color: '#fff', background: 'linear-gradient(135deg,#e0915a,#c25e3a)' }}>
        <Ico name="sparkles" size={11 * sized} sw={2} />PRO
      </span>);
  }

  function previewTw(pack, tw) {
    const base = { radius: 8, titleFont: 'Grotesca', accent: 'oliva', ...tw };
    return { ...base, appearance: pack.id, mode: pack.defaultMode || (pack.caps.modes.includes('light') ? 'Claro' : 'Oscuro'), accent: pack.caps.accents && pack.caps.accents.def ? pack.caps.accents.def : base.accent, shell: 'Flotante' };
  }

  function AppearanceCard({ t, pack, active, hasPro, onApply, onOpen }) {
    const [hover, setHover] = React.useState(false);
    const locked = pack.pro && !hasPro;
    const ptheme = pack.build(previewTw(pack, {}));
    return (
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          background: t.card, border: `1.5px solid ${active ? t.accent : t.border}`, borderRadius: t.rInput + 6,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: hover ? '0 16px 36px -16px rgba(20,14,6,0.4)' : '0 1px 3px rgba(20,14,6,0.08)',
          transform: hover ? 'translateY(-3px)' : 'none', transition: 'transform .16s, box-shadow .16s, border-color .12s',
        }}>
        {/* preview clicable */}
        <div onClick={() => onOpen(pack)} style={{ cursor: 'pointer', position: 'relative', borderBottom: `1px solid ${t.border}` }}>
          <AppearancePreview theme={ptheme} height={188} />
          {locked && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,4,0) 40%, rgba(10,8,4,0.45) 100%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(20,14,6,0.55)', backdropFilter: 'blur(3px)', padding: '5px 10px', borderRadius: 999 }}>
                <LockIco size={12} />Vista previa
              </span>
            </div>
          )}
          {active && (
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: t.accentOn, background: t.accent, padding: '4px 9px', borderRadius: 999 }}>
              <Ico name="check" size={11} sw={3} />Activa
            </div>
          )}
        </div>
        {/* meta */}
        <div style={{ padding: '13px 15px 15px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 18, color: t.ink, letterSpacing: t.titleTrack }}>{pack.name}</span>
            <span style={{ flex: 1 }} />
            {pack.pro && <ProTag t={t} />}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, color: t.ink3, minHeight: 36 }}>{pack.tagline}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {pack.swatches.map((c, i) => (
                <span key={i} style={{ width: 16, height: 16, borderRadius: 5, background: c, border: '1px solid rgba(0,0,0,0.12)' }} />
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <Badge t={t} kind={pack.depth} />
          </div>
          {/* CTA */}
          <button type="button" onClick={() => (locked ? onOpen(pack) : onApply(pack))} disabled={active && !locked}
            style={{
              marginTop: 4, padding: '9px 14px', borderRadius: t.rInput, cursor: active ? 'default' : 'pointer', font: 'inherit',
              fontFamily: t.fontUI, fontSize: 13, fontWeight: 650, transition: 'all .12s',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              color: active ? t.ink3 : locked ? t.ink : t.accentOn,
              background: active ? t.inputBg : locked ? 'transparent' : t.accent,
              border: `1px solid ${active ? t.border : locked ? t.border : t.accent}`,
            }}>
            {active ? <React.Fragment><Ico name="check" size={14} sw={2.6} />Activa</React.Fragment>
              : locked ? <React.Fragment><LockIco size={13} />Vista previa</React.Fragment>
                : <React.Fragment><Ico name="check" size={14} sw={2.4} />Aplicar</React.Fragment>}
          </button>
        </div>
      </div>);
  }

  /* —— modal de detalle / preview ampliada —— */
  function AppearanceDetail({ t, pack, tw, hasPro, onApply, onUnlock, onClose }) {
    const modes = pack.caps.modes;
    const initMode = (tw.mode && modes.includes(tw.mode === 'Oscuro' ? 'dark' : 'light')) ? tw.mode : (pack.defaultMode || (modes.includes('light') ? 'Claro' : 'Oscuro'));
    const [mode, setMode] = React.useState(initMode);
    const accCfg = pack.caps.accents;
    const ACC = window.ANTASK_ACCENTS || {};
    const ACC_ORDER = window.ANTASK_ACCENT_ORDER || [];
    const accentList = accCfg
      ? (accCfg.order ? accCfg.order.map((k) => ({ key: k, color: accCfg.swatch(k) }))
        : accCfg.warm ? ACC_ORDER.map((k) => ({ key: k, color: (ACC[k] || {}).accent })) : null)
      : null;
    const [acc, setAcc] = React.useState(accCfg ? ((accCfg.warm && tw.accent) ? tw.accent : accCfg.def) : (tw.accent || 'oliva'));
    const locked = pack.pro && !hasPro;
    const ptheme = pack.build({ ...tw, appearance: pack.id, mode, accent: acc, shell: 'Flotante' });

    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
      document.addEventListener('keydown', onKey, true);
      return () => document.removeEventListener('keydown', onKey, true);
    }, [onClose]);

    return ReactDOM.createPortal(
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9600, background: 'rgba(14,10,5,0.55)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 24, fontFamily: t.fontUI }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(880px, 96vw)', maxHeight: '92vh', overflow: 'auto', background: t.card, border: `1px solid ${t.border}`, borderRadius: 18, boxShadow: '0 36px 90px -28px rgba(14,10,5,0.6)' }}>
          {/* preview grande */}
          <div style={{ position: 'relative', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' }}>
            <AppearancePreview theme={ptheme} height={300} big />
            <button type="button" onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(20,14,6,0.5)', color: '#fff', display: 'grid', placeItems: 'center', backdropFilter: 'blur(3px)' }}><Ico name="x" size={18} /></button>
          </div>
          {/* cuerpo */}
          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 25, color: t.ink, letterSpacing: t.titleTrack }}>{pack.name}</h3>
              {pack.pro ? <ProTag t={t} sized={1.05} /> : <Badge t={t} kind={pack.depth} />}
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 14.5, lineHeight: 1.5, color: t.ink2, maxWidth: 560 }}>{pack.tagline}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, alignItems: 'flex-end' }}>
              {modes.length > 1 && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink3, marginBottom: 8 }}>Modo</div>
                  <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: t.segBg, borderRadius: t.rSeg, border: `1px solid ${t.border}` }}>
                    {['Claro', 'Oscuro'].map((m) => (
                      <span key={m} onClick={() => setMode(m)} style={{ padding: '7px 16px', borderRadius: Math.max(4, t.rSeg - 3), cursor: 'pointer', fontSize: 13, fontWeight: m === mode ? 650 : 550, color: m === mode ? t.accentInk : t.ink2, background: m === mode ? t.segOn : 'transparent', boxShadow: m === mode ? t.segShadow : 'none' }}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {accentList && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: t.fontMono, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.ink3, marginBottom: 8 }}>Acento</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 290 }}>
                    {accentList.map(({ key: kk, color: c }) => {
                      const on = kk === acc;
                      return <span key={kk} onClick={() => setAcc(kk)} title={kk} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: on ? `0 0 0 2px ${t.card}, 0 0 0 4px ${c}` : 'none' }}>{on && <Ico name="check" size={14} sw={3} style={{ color: '#04140a' }} />}</span>;
                    })}
                  </div>
                </div>
              )}
              <span style={{ flex: 1 }} />
              {locked ? (
                <button type="button" onClick={() => onUnlock(pack)} style={{ padding: '12px 22px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#e0915a,#c25e3a)', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px -8px rgba(194,94,58,0.6)' }}>
                  <LockIco size={15} />Desbloquear con PRO
                </button>
              ) : (
                <button type="button" onClick={() => onApply(pack, { mode, accent: acc })} style={{ padding: '12px 24px', borderRadius: t.rInput, border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 700, color: t.accentOn, background: t.accent, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Ico name="check" size={16} sw={2.6} />Aplicar apariencia
                </button>
              )}
            </div>
          </div>
        </div>
      </div>, document.body);
  }

  function AppearanceLibrary({ tw, setTweak, onClose }) {
    const t = buildAppearanceTheme(tw);
    const [filter, setFilter] = React.useState('Todas');
    const [detail, setDetail] = React.useState(null);
    const [hasPro, setHasPro] = React.useState(!!tw.pro);
    React.useEffect(() => { setHasPro(!!tw.pro); }, [tw.pro]);

    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape' && !detail) { e.stopPropagation(); onClose(); } };
      document.addEventListener('keydown', onKey, true);
      return () => document.removeEventListener('keydown', onKey, true);
    }, [onClose, detail]);

    const apply = (pack, opts) => {
      const o = opts || {};
      const mode = o.mode || pack.defaultMode || (pack.caps.modes.includes('light') ? 'Claro' : 'Oscuro');
      const accent = pack.caps.accents ? (o.accent || pack.caps.accents.def) : (pack.caps.accents === null && pack.id === 'tierra' ? (tw.accent || 'oliva') : tw.accent);
      setTweak({ appearance: pack.id, mode, ...(pack.caps.accents || pack.id === 'tierra' ? { accent } : {}) });
      setDetail(null);
    };
    const unlock = (pack) => {
      if (window.openProUpgrade) { setDetail(null); window.openProUpgrade(); }
      else { setHasPro(true); setTweak('pro', true); }
    };

    const FILTERS = ['Todas', 'Gratis', 'PRO', 'Cálidas', 'Frescas', 'Especiales'];
    const list = ANTASK_APPEARANCES.filter((p) => {
      if (filter === 'Todas') return true;
      if (filter === 'Gratis') return !p.pro;
      if (filter === 'PRO') return p.pro;
      return p.group === filter;
    });

    return ReactDOM.createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 9400, background: hexA(t.canvas, 0.7), backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', padding: 'clamp(12px, 3vw, 40px)', fontFamily: t.fontUI }}>
        <div style={{ width: 'min(1180px, 97vw)', height: 'min(860px, 94vh)', display: 'flex', flexDirection: 'column', background: t.canvas, border: `1px solid ${t.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 50px 120px -40px rgba(14,10,5,0.6)' }}>
          {/* header */}
          <div style={{ padding: '22px 28px 18px', borderBottom: `1px solid ${t.border}`, background: t.card, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: t.tintBg, display: 'grid', placeItems: 'center', color: t.accentInk }}><Ico name="sparkles" size={17} sw={2} /></span>
                  <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: t.titleWeight, fontSize: 24, color: t.ink, letterSpacing: t.titleTrack }}>Biblioteca de apariencias</h2>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: t.ink3, maxWidth: 620, lineHeight: 1.45 }}>Cambia el mundo visual completo de Antask. Toca una tarjeta para previsualizar; aplica con un clic.</p>
              </div>
              {/* simular PRO + cerrar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <button type="button" onClick={() => { const v = !hasPro; setHasPro(v); setTweak('pro', v); }} title="Alterna entre plan gratuito y PRO para ver el comportamiento"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 650, color: hasPro ? '#fff' : t.ink2, background: hasPro ? 'linear-gradient(135deg,#e0915a,#c25e3a)' : t.inputBg, border: `1px solid ${hasPro ? 'transparent' : t.border}` }}>
                  <Ico name="sparkles" size={13} sw={2} />{hasPro ? 'Plan PRO activo' : 'Simular PRO'}
                </button>
                <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.border}`, cursor: 'pointer', background: t.inputBg, color: t.ink2, display: 'grid', placeItems: 'center' }}><Ico name="x" size={19} /></button>
              </div>
            </div>
            {/* filtros */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {FILTERS.map((f) => <Chip key={f} t={t} on={f === filter} onClick={() => setFilter(f)}>{f}</Chip>)}
            </div>
          </div>
          {/* grid */}
          <div style={{ flex: 1, overflow: 'auto', padding: '22px 28px 30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {list.map((pack) => (
                <AppearanceCard key={pack.id} t={t} pack={pack} active={pack.id === tw.appearance} hasPro={hasPro}
                  onApply={(p) => apply(p)} onOpen={(p) => setDetail(p)} />
              ))}
            </div>
            <p style={{ marginTop: 26, fontSize: 12, color: t.ink3, textAlign: 'center', fontFamily: t.fontMono }}>
              {list.length} apariencia{list.length === 1 ? '' : 's'} · más en camino
            </p>
          </div>
        </div>
        {detail && <AppearanceDetail t={t} pack={detail} tw={tw} hasPro={hasPro} onApply={apply} onUnlock={unlock} onClose={() => setDetail(null)} />}
      </div>, document.body);
  }

  /* ════════════════════════ DECORACIÓN AMBIENTAL (nivel 2) ════════════════════════
     Capa de "atmósfera" por apariencia: blobs de gradiente muy suaves, sesgados a las
     esquinas/bordes para no estorbar la columna de lectura, + un grano sutil en los
     packs cálidos. Vive sobre las vistas (pointer-events:none) como el CRT, pero a un
     z menor que el lanzador / la biblioteca. Deriva muy lento (gateado por
     prefers-reduced-motion); sin animación sigue viéndose, sólo queda estático.
     Nota: 'terminal' tiene su propio mundo (TerminalFX), aquí se omite.

     Cada blob = { c: color rgba, s: tamaño px, x/y: centro %, anim: 'A'|'B', d: dur s }.
     Colores explícitos por pack+modo para control fino de legibilidad. */
  const AMBIENT_DECO = {
    tierra: {
      light: [
        { c: 'rgba(173,82,48,0.13)', s: 600, x: '-3%', y: '-8%', anim: 'A', d: 34 },
        { c: 'rgba(111,122,61,0.11)', s: 520, x: '102%', y: '94%', anim: 'B', d: 42 },
      ],
      dark: [
        { c: 'rgba(196,110,72,0.17)', s: 600, x: '-3%', y: '-8%', anim: 'A', d: 34 },
        { c: 'rgba(140,150,80,0.13)', s: 520, x: '102%', y: '94%', anim: 'B', d: 42 },
      ],
      grain: 0.04,
    },
    papel: {
      light: [
        { c: 'rgba(194,94,58,0.13)', s: 560, x: '101%', y: '-7%', anim: 'A', d: 36 },
        { c: 'rgba(61,110,133,0.09)', s: 500, x: '-3%', y: '98%', anim: 'B', d: 46 },
      ],
      grain: 0.045,
    },
    marea: {
      light: [
        { c: 'rgba(8,145,178,0.15)', s: 620, x: '101%', y: '-6%', anim: 'A', d: 30 },
        { c: 'rgba(34,184,207,0.12)', s: 540, x: '-4%', y: '94%', anim: 'B', d: 40 },
      ],
      dark: [
        { c: 'rgba(45,212,191,0.20)', s: 640, x: '101%', y: '-8%', anim: 'A', d: 30 },
        { c: 'rgba(34,211,238,0.15)', s: 560, x: '-5%', y: '94%', anim: 'B', d: 40 },
      ],
    },
    bosque: {
      light: [
        { c: 'rgba(107,168,63,0.15)', s: 600, x: '-3%', y: '-9%', anim: 'A', d: 32 },
        { c: 'rgba(47,125,107,0.11)', s: 520, x: '101%', y: '96%', anim: 'B', d: 44 },
      ],
      dark: [
        { c: 'rgba(143,206,90,0.18)', s: 620, x: '-3%', y: '-9%', anim: 'A', d: 32 },
        { c: 'rgba(111,201,176,0.14)', s: 540, x: '101%', y: '96%', anim: 'B', d: 44 },
      ],
    },
    aurora: {
      dark: [
        { c: 'rgba(124,58,237,0.22)', s: 640, x: '10%', y: '-8%', anim: 'A', d: 30 },
        { c: 'rgba(6,182,218,0.14)', s: 520, x: '97%', y: '2%', anim: 'B', d: 40 },
        { c: 'rgba(236,72,153,0.13)', s: 560, x: '82%', y: '103%', anim: 'A', d: 46 },
      ],
      grain: 0.05,
    },
  };

  // grano sutil reutilizable (feTurbulence → data URI), tintado por opacidad del div
  const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

  function AmbientDeco({ appearance, theme, position = 'fixed', zIndex = 4000 }) {
    const spec = AMBIENT_DECO[appearance];
    if (!spec) return null;
    const dark = theme && theme.mode === 'dark';
    const blobs = (dark ? spec.dark : spec.light) || spec.light || [];
    return (
      <React.Fragment>
        <style>{`
          @keyframes antaskDecoA { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(calc(-50% + 30px), calc(-50% - 24px)) scale(1.06)} }
          @keyframes antaskDecoB { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(calc(-50% - 26px), calc(-50% + 28px)) scale(1.08)} }
          .antask-deco-blob{ animation: none; }
          @media (prefers-reduced-motion: no-preference){
            .antask-deco-blob[data-anim="A"]{ animation: antaskDecoA var(--d) ease-in-out infinite; }
            .antask-deco-blob[data-anim="B"]{ animation: antaskDecoB var(--d) ease-in-out infinite; }
          }
        `}</style>
        <div aria-hidden="true" style={{ position, inset: 0, zIndex, pointerEvents: 'none', overflow: 'hidden' }}>
          {blobs.map((b, i) => (
            <div key={i} className="antask-deco-blob" data-anim={b.anim}
              style={{
                position: 'absolute', left: b.x, top: b.y, width: b.s, height: b.s,
                transform: 'translate(-50%,-50%)', '--d': b.d + 's',
                background: `radial-gradient(circle at center, ${b.c} 0%, transparent 70%)`,
              }} />
          ))}
          {spec.grain && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN_URL, backgroundSize: '160px 160px',
              opacity: spec.grain, mixBlendMode: dark ? 'screen' : 'multiply' }} />
          )}
        </div>
      </React.Fragment>);
  }

  /* dispatcher: elige el mundo CRT (terminal) o la decoración ambiental (resto) */
  function AppearanceFX({ appearance, theme }) {
    if (appearance === 'terminal') return <TerminalFX />;
    if (appearance === 'ceniza') return <CenizaFX />;
    return <AmbientDeco appearance={appearance} theme={theme} />;
  }

  /* ════════════════════════ EFECTOS "MUNDO" (CRT Terminal) ════════════════════════
     Capa global que vive sobre las vistas (no las modifica): scanlines + flicker,
     glow fosforescente en TODO el texto del #root, vignette, prompt con cursor y un
     boot-flash al activar el pack. */
  function TerminalFX() {
    const [boot, setBoot] = React.useState(false);
    React.useEffect(() => {
      const cls = 'antask-crt';
      document.documentElement.classList.add(cls);
      return () => document.documentElement.classList.remove(cls);
    }, []);
    React.useEffect(() => { setBoot(true); const id = setTimeout(() => setBoot(false), 1250); return () => clearTimeout(id); }, []);
    const acc = TERM_ACCENTS.verde;
    const blockCur = { display: 'inline-block', width: 8, height: 14, background: acc, verticalAlign: '-2px', boxShadow: `0 0 7px ${acc}`, animation: 'antaskBlink 1s steps(1) infinite' };
    return (
      <React.Fragment>
        <style>{`
          @keyframes antaskCrtFlicker { 0%,100%{opacity:.92} 47%{opacity:.94} 49%{opacity:.78} 51%{opacity:.96} 53%{opacity:.82} }
          @keyframes antaskBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
          @keyframes antaskBootOut { 0%{opacity:1} 65%{opacity:1} 100%{opacity:0;visibility:hidden} }
          @media (prefers-reduced-motion: no-preference){ .antask-crt-scan{ animation: antaskCrtFlicker 4s steps(2,end) infinite; } }
          .antask-crt #root, .antask-crt #root * { text-shadow: 0 0 1.4px rgba(51,255,123,0.30); }
        `}</style>
        {/* scanlines + flicker */}
        <div className="antask-crt-scan" style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(2,12,6,0.34) 3px, rgba(2,12,6,0.34) 3px)' }} />
        {/* vignette + glow ambiental */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 9001, pointerEvents: 'none',
          background: 'radial-gradient(125% 105% at 50% 48%, rgba(40,255,150,0.035) 0%, rgba(0,0,0,0) 42%, rgba(0,14,5,0.5) 100%)' }} />
        {/* prompt persistente con cursor */}
        <div style={{ position: 'fixed', right: 24, bottom: 74, zIndex: 9002, pointerEvents: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, color: acc, textShadow: `0 0 6px ${acc}`, letterSpacing: '0.02em', opacity: 0.9 }}>
          antask@crt:~$ <span style={blockCur} />
        </div>
        {/* boot flash al activar */}
        {boot && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9100, background: '#04080a', padding: '15vh 0 0 9vw', fontFamily: "'IBM Plex Mono', monospace", color: acc, textShadow: `0 0 8px ${acc}`, animation: 'antaskBootOut 1.25s ease forwards', pointerEvents: 'none' }}>
            <div style={{ fontSize: 15, lineHeight: 1.8 }}>
              <div>antask terminal — phosphor green · v1.0</div>
              <div style={{ opacity: 0.75 }}>mounting workspace … <span style={{ color: '#d6f7de' }}>ok</span></div>
              <div>loading 12 notes, 6 tasks … <span style={{ color: '#d6f7de' }}>ok</span></div>
              <div>{'>'} ./antask --launch<span style={{ ...blockCur, height: 15, marginLeft: 5 }} /></div>
            </div>
          </div>
        )}
      </React.Fragment>);
  }

  /* ════════════════════ MUNDO CENIZA (brasas + niebla) ════════════════════
     Capa ambiental sobre las vistas: vignette pesada, resplandor de hoguera
     abajo al centro, brasas que suben muy lento y un velo de grano. Sin
     movimiento si el usuario pide reduced-motion. */
  const EMBERS = [
    { x: 14, s: 2.4, d: 21, delay: 0, o: 0.55, dx: 26 },
    { x: 27, s: 1.6, d: 28, delay: 5, o: 0.4, dx: -18 },
    { x: 41, s: 2.8, d: 18, delay: 2, o: 0.6, dx: 14 },
    { x: 53, s: 1.8, d: 25, delay: 9, o: 0.45, dx: -24 },
    { x: 62, s: 2.2, d: 23, delay: 13, o: 0.5, dx: 20 },
    { x: 74, s: 1.5, d: 30, delay: 4, o: 0.35, dx: -12 },
    { x: 86, s: 2.6, d: 20, delay: 11, o: 0.55, dx: 18 },
    { x: 94, s: 1.7, d: 26, delay: 7, o: 0.4, dx: -20 },
  ];

  function CenizaFX() {
    const [boot, setBoot] = React.useState(false);
    React.useEffect(() => { setBoot(true); const id = setTimeout(() => setBoot(false), 1500); return () => clearTimeout(id); }, []);
    return (
      <React.Fragment>
        <style>{`
          @keyframes antaskEmber { 0%{transform:translate(0,0) scale(.8);opacity:0} 12%{opacity:1} 78%{opacity:.5} 100%{transform:translate(var(--dx),-92vh) scale(.4);opacity:0} }
          @keyframes antaskHearth { 0%,100%{opacity:.72} 43%{opacity:.92} 61%{opacity:.66} }
          @keyframes antaskCenizaIn { 0%{opacity:1} 55%{opacity:1} 100%{opacity:0;visibility:hidden} }
          @keyframes antaskCenizaWord { 0%{opacity:0;letter-spacing:.42em} 34%{opacity:1;letter-spacing:.3em} 100%{opacity:1;letter-spacing:.28em} }
          .antask-ember{ opacity:0 }
          @media (prefers-reduced-motion: no-preference){
            .antask-ember{ animation: antaskEmber var(--d) linear var(--delay) infinite; }
            .antask-hearth{ animation: antaskHearth 7s ease-in-out infinite; }
          }
        `}</style>
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 4000, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* resplandor de hoguera */}
          <div className="antask-hearth" style={{ position: 'absolute', left: '50%', bottom: '-30vh', width: '92vw', height: '62vh', transform: 'translateX(-50%)', background: 'radial-gradient(closest-side, rgba(219,142,58,0.20) 0%, rgba(160,84,28,0.10) 42%, rgba(0,0,0,0) 78%)' }} />
          {/* niebla lateral fría */}
          <div style={{ position: 'absolute', left: '-14%', top: '-10%', width: 640, height: 640, background: 'radial-gradient(circle at center, rgba(143,168,164,0.10) 0%, rgba(0,0,0,0) 68%)' }} />
          {/* brasas */}
          {EMBERS.map((e, i) => (
            <span key={i} className="antask-ember" style={{
              position: 'absolute', left: e.x + '%', bottom: '-2vh', width: e.s, height: e.s, borderRadius: '50%',
              background: i % 3 === 0 ? '#e8b872' : '#d98a4f', boxShadow: `0 0 ${e.s * 4}px ${e.s}px rgba(224,150,74,${e.o})`,
              '--d': e.d + 's', '--delay': e.delay + 's', '--dx': e.dx + 'px',
            }} />
          ))}
          {/* vignette pesada */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(122% 104% at 50% 46%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.42) 84%, rgba(0,0,0,0.66) 100%)' }} />
          {/* grano / ceniza en suspensión */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN_URL, backgroundSize: '170px 170px', opacity: 0.05, mixBlendMode: 'screen' }} />
        </div>
        {boot && (
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'radial-gradient(120% 100% at 50% 116%, #2a1a0c 0%, #0a0a09 58%, #040404 100%)', display: 'grid', placeItems: 'center', animation: 'antaskCenizaIn 1.5s ease forwards', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', animation: 'antaskCenizaWord 1.1s ease forwards' }}>
              <div style={{ fontFamily: PF.spectral, fontSize: 27, fontWeight: 500, color: '#dcc07e', letterSpacing: '0.28em', textTransform: 'uppercase', textShadow: '0 0 26px rgba(201,169,97,0.35)' }}>Hoguera encendida</div>
              <div style={{ marginTop: 14, width: 118, height: 1, margin: '14px auto 0', background: 'linear-gradient(90deg, rgba(201,169,97,0) 0%, rgba(201,169,97,0.8) 50%, rgba(201,169,97,0) 100%)' }} />
            </div>
          </div>
        )}
      </React.Fragment>);
  }

  /* lanzador flotante reutilizable (lo usan Lista / Notas / Hoy) */
  function AppearanceLauncher({ theme: t, onClick }) {
    return (
      <button type="button" onClick={onClick}
        style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 8000, display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '12px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: t.fontUI, fontSize: 14, fontWeight: 650,
          color: t.accentOn, background: t.accent, boxShadow: '0 10px 28px -10px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.2)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z" /></svg>
        Apariencias
      </button>);
  }

  /* ════════════════════════ EXPORTS ════════════════════════ */
  window.ANTASK_APPEARANCES = ANTASK_APPEARANCES;
  window.ANTASK_APPEARANCE_BY_ID = BY_ID;
  window.buildAppearanceTheme = buildAppearanceTheme;
  window.AppearancePreview = AppearancePreview;
  window.AppearanceLibrary = AppearanceLibrary;
  window.AppearanceLauncher = AppearanceLauncher;
  window.AppearanceFX = AppearanceFX;
  window.AmbientDeco = AmbientDeco;
})();

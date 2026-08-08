/* themes.jsx — paletas para las direcciones cálidas + referencia "Actual".
   window.ANTASK_THEMES = { actual, papel, tierra, oscuro } */

const F = {
  ui: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  serif: "'Newsreader', Georgia, serif",
  grotesk: "'Bricolage Grotesque', 'Inter', sans-serif",
};

const base = {
  fontUI: F.ui, fontMono: F.mono, fontDisplay: F.ui,
  brandWeight: 600, titleWeight: 700, titleSize: 30, titleTrack: '-0.02em',
  rPill: 999, rTag: 6, rNav: 8, rInput: 10, rSeg: 9,
  rowPad: '9px 12px', rowPadX: 12, rowRadius: 8, rowH: 42,
  rowDivider: false, zebra: false, zebraBg: 'transparent',
  bars: false, monoMeta: false, tagBorder: false, checkRadius: '50%',
  segShadow: 'none', rowHover: 'rgba(0,0,0,0.035)', cardStyle: 'flat',
};

const ANTASK_THEMES = {
  /* ── ACTUAL: dark frío + violeta (referencia) ── */
  actual: {
    ...base, mode: 'dark',
    canvas: '#111118', card: '#16161f',
    ink: '#f4f4f8', ink2: '#b4b3c5', ink3: '#7e7d92',
    border: 'rgba(255,255,255,0.10)',
    accent: '#8b5cf6', accentOn: '#fff', accentInk: '#a78bfa',
    tintBg: 'rgba(139,92,246,0.16)', grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
    consultaFg: '#7fd0c0', consultaBg: 'rgba(95,179,163,0.16)',
    segBg: 'rgba(255,255,255,0.04)', segOn: '#1c1c27',
    inputBg: 'rgba(255,255,255,0.04)', kbdBg: 'rgba(255,255,255,0.06)', rowHover: 'rgba(255,255,255,0.045)',
    listColors: { Buceo: '#34d399', inversion: '#fbbf24' },
    tags: {
      green: { bg: 'rgba(52,211,153,.14)', fg: '#6ee7b7' },
      amber: { bg: 'rgba(251,191,36,.14)', fg: '#fcd34d' },
      slate: { bg: 'rgba(148,163,184,.14)', fg: '#cbd5e1' },
    },
    sb: { bg: '#0a0a0f', ink: '#f4f4f8', ink2: '#b4b3c5', ink3: '#7e7d92', border: 'rgba(255,255,255,0.07)', activeBg: 'rgba(139,92,246,0.14)', inputBg: 'rgba(255,255,255,0.04)', barTrack: 'rgba(255,255,255,0.1)' },
  },

  /* ── A · PAPEL CÁLIDO: light crema, terracota, títulos serif ── */
  papel: {
    ...base, mode: 'light',
    fontDisplay: F.serif, titleWeight: 500, titleSize: 32, titleTrack: '-0.01em', brandWeight: 600,
    rowDivider: true, rowH: 41, rowRadius: 8,
    canvas: '#f7f2e8', card: '#fffdf7',
    ink: '#2c2620', ink2: '#6f6555', ink3: '#8a7d66',
    border: 'rgba(60,48,30,0.10)',
    accent: '#c25e3a', accentOn: '#fffdf7', accentInk: '#b14e2d',
    tintBg: 'rgba(194,94,58,0.13)', grad: 'linear-gradient(135deg,#d4703f,#bf4f2c)',
    consultaFg: '#3d6e85', consultaBg: 'rgba(61,110,133,0.13)',
    segBg: '#efe7d6', segOn: '#fffdf7', segShadow: '0 1px 2px rgba(60,48,30,0.10)',
    inputBg: '#fffdf7', kbdBg: '#efe7d6', rowHover: '#f1e9d8',
    listColors: { Buceo: '#3f8a7d', inversion: '#c2873a' },
    tags: {
      green: { bg: 'rgba(63,138,125,.15)', fg: '#2f7163' },
      amber: { bg: 'rgba(194,135,58,.18)', fg: '#945f1c' },
      slate: { bg: 'rgba(120,108,88,.14)', fg: '#6f6555' },
    },
    sb: { bg: '#f0e8d8', ink: '#2c2620', ink2: '#6f6555', ink3: '#a89b83', border: 'rgba(60,48,30,0.09)', activeBg: 'rgba(194,94,58,0.14)', inputBg: '#fffdf7', barTrack: 'rgba(60,48,30,0.10)' },
  },

  /* ── B · TIERRA CONTEMPORÁNEA: sidebar oscuro + papel, arcilla, mono, barras ── */
  tierra: {
    ...base, mode: 'light',
    fontDisplay: F.grotesk, titleWeight: 700, titleSize: 29, titleTrack: '-0.035em', brandWeight: 700,
    monoMeta: true, bars: true, tagBorder: true, zebra: true, zebraBg: 'rgba(50,42,28,0.025)',
    rowH: 40, rowRadius: 7, checkRadius: 6, rTag: 5, rSeg: 8, rInput: 9,
    canvas: '#f4efe3', card: '#fffdf6',
    ink: '#2a251d', ink2: '#6a6151', ink3: '#7a7060',
    border: 'rgba(50,40,24,0.11)',
    accent: '#ad5230', accentOn: '#fffdf6', accentInk: '#9c4628',
    tintBg: 'rgba(173,82,48,0.13)', grad: 'linear-gradient(135deg,#c0673a,#9c4426)',
    consultaFg: '#3d6e85', consultaBg: 'rgba(61,110,133,0.12)',
    segBg: '#e7dfcf', segOn: '#fffdf6', segShadow: '0 1px 2px rgba(50,40,24,0.10)',
    inputBg: '#fffdf6', kbdBg: '#e7dfcf', rowHover: '#efe6d4',
    listColors: { Buceo: '#3f7d8a', inversion: '#b58236' },
    tags: {
      green: { bg: 'rgba(74,118,68,.14)', fg: '#3c6b38', bd: 'rgba(74,118,68,.30)' },
      amber: { bg: 'rgba(181,130,54,.16)', fg: '#85591a', bd: 'rgba(181,130,54,.32)' },
      slate: { bg: 'rgba(110,100,80,.13)', fg: '#6a6151', bd: 'rgba(110,100,80,.28)' },
    },
    sb: { bg: '#221d16', ink: '#f2ece0', ink2: '#b3a892', ink3: '#7a7059', border: 'rgba(255,245,225,0.08)', activeBg: 'rgba(192,103,58,0.22)', inputBg: 'rgba(255,250,240,0.05)', barTrack: 'rgba(255,245,225,0.10)', accentInk: '#e08a5a' },
  },

  /* ── C · CÁLIDO OSCURO: marrón cálido + miel/ámbar ── */
  oscuro: {
    ...base, mode: 'dark',
    fontDisplay: F.ui, titleWeight: 700, titleSize: 30, titleTrack: '-0.025em',
    rowDivider: true, rowH: 42,
    canvas: '#17120d', card: '#211a13',
    ink: '#f1e9dc', ink2: '#b6a691', ink3: '#80715c',
    border: 'rgba(255,238,214,0.09)',
    accent: '#e0915a', accentOn: '#2a1c10', accentInk: '#e8a36c',
    tintBg: 'rgba(224,145,90,0.15)', grad: 'linear-gradient(135deg,#e8a063,#d27a3e)',
    consultaFg: '#73b6d2', consultaBg: 'rgba(115,182,210,0.15)',
    segBg: 'rgba(255,238,214,0.05)', segOn: '#2c241b',
    inputBg: 'rgba(255,245,230,0.045)', kbdBg: 'rgba(255,245,230,0.07)', rowHover: 'rgba(255,238,214,0.055)',
    listColors: { Buceo: '#5fb3a3', inversion: '#e0a35a' },
    tags: {
      green: { bg: 'rgba(95,179,163,.16)', fg: '#7fd0c0' },
      amber: { bg: 'rgba(224,163,90,.16)', fg: '#f0bd84' },
      slate: { bg: 'rgba(180,165,140,.14)', fg: '#cabba2' },
    },
    sb: { bg: '#100c08', ink: '#f1e9dc', ink2: '#b6a691', ink3: '#80715c', border: 'rgba(255,238,214,0.07)', activeBg: 'rgba(224,145,90,0.16)', inputBg: 'rgba(255,245,230,0.045)', barTrack: 'rgba(255,238,214,0.10)', accentInk: '#e8a36c' },
  },
};

/* ───────── TOKENS COMPARTIDOS: acentos, fuentes y constructor de tema ─────────
   Única fuente de verdad para todas las páginas (Vista Lista, Notas, …).
   window.ANTASK_ACCENTS, window.ANTASK_ACCENT_ORDER, window.ANTASK_FONTS, window.buildAntaskTheme */

const ANTASK_ACCENTS = {
  arcilla:   { accent: '#ad5230', ink: '#9c4628', sb: '#e08a5a', grad: 'linear-gradient(135deg,#c0673a,#9c4426)', tint: 'rgba(173,82,48,0.13)',  act: 'rgba(192,103,58,0.22)' },
  terracota: { accent: '#c25e3a', ink: '#b14e2d', sb: '#e8956a', grad: 'linear-gradient(135deg,#d4703f,#bf4f2c)', tint: 'rgba(194,94,58,0.13)',  act: 'rgba(212,112,63,0.20)' },
  miel:      { accent: '#d98a4f', ink: '#b86a30', sb: '#ecae74', grad: 'linear-gradient(135deg,#e8a063,#d27a3e)', tint: 'rgba(217,138,79,0.15)', act: 'rgba(232,160,99,0.20)' },
  oliva:     { accent: '#6f7a3d', ink: '#5a6330', sb: '#a3b366', grad: 'linear-gradient(135deg,#8a9a5b,#566030)', tint: 'rgba(111,122,61,0.14)', act: 'rgba(138,154,91,0.20)' },
  burdeos:   { accent: '#9a3f43', ink: '#87363a', sb: '#c97478', grad: 'linear-gradient(135deg,#b05c5c,#7a2e35)', tint: 'rgba(154,63,67,0.13)',  act: 'rgba(176,92,92,0.20)' },
};
const ANTASK_ACCENT_ORDER = ['arcilla', 'terracota', 'miel', 'oliva', 'burdeos'];

const ANTASK_FONTS = {
  Grotesca: { f: "'Bricolage Grotesque', 'Inter', sans-serif", w: 700, tr: '-0.035em' },
  Sans:     { f: "'Inter', system-ui, sans-serif",             w: 700, tr: '-0.02em'  },
  Serif:    { f: "'Newsreader', Georgia, serif",               w: 500, tr: '-0.01em'  },
};

/* Construye el tema "tierra" (claro/oscuro) a partir de los tweaks comunes:
     tw = { mode: 'Claro'|'Oscuro', shell: 'Pegado'|'Flotante', accent, titleFont, radius }
   `extra` permite a cada página añadir/sobrescribir tokens propios
   (p. ej. checkRadius o los flags de estilo de fila de la Vista Lista). */
function buildAntaskTheme(tw, extra = {}) {
  const a = ANTASK_ACCENTS[tw.accent] || ANTASK_ACCENTS.arcilla;
  const fnt = ANTASK_FONTS[tw.titleFont] || ANTASK_FONTS.Grotesca;
  const hexA = window.antaskHexA;
  const r = tw.radius;
  const dark = tw.mode === 'Oscuro';
  const floating = tw.shell === 'Flotante';
  const themeBase = dark ? ANTASK_THEMES.oscuro : ANTASK_THEMES.tierra;

  // En oscuro el acento se aclara (versión 'sb') para leer sobre fondo oscuro,
  // y el texto sobre el relleno pasa a ser oscuro.
  return {
    ...themeBase,
    accent: dark ? a.sb : a.accent, accentInk: dark ? a.sb : a.ink, accentOn: dark ? '#241910' : '#fffdf6',
    tintBg: dark ? hexA(a.sb, 0.15) : a.tint, grad: a.grad,
    fontDisplay: fnt.f, titleWeight: fnt.w, titleTrack: fnt.tr,
    zebraBg: dark ? 'rgba(255,240,220,0.028)' : 'rgba(50,42,28,0.025)',
    rowRadius: r, rInput: Math.max(4, r + 2), rSeg: Math.max(4, r + 1), rTag: Math.max(3, r - 2), rNav: Math.max(4, r + 1),
    shell: floating ? 'floating' : 'flush',
    /* Superficie del panel central: HUNDIDA (más oscura que las tarjetas), estilo Notas de iOS.
       Las secciones y tareas usan `card` / `blockBg` y quedan por encima, más claras. */
    /* en oscuro la elevación no puede venir de la sombra: la tarjeta sube de tono */
    card: dark ? '#251e16' : themeBase.card,
    shellPanel: dark ? '#12100c' : '#e8dfcd',
    blockBg: dark ? 'rgba(255,240,220,0.045)' : 'rgba(255,253,246,0.66)',
    desk: dark ? '#080605' : '#d6c9b0',
    shellShadow: dark
      ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px -6px rgba(0,0,0,0.5), 0 24px 48px -14px rgba(0,0,0,0.6)'
      : '0 1px 2px rgba(50,40,24,0.05), 0 6px 14px -4px rgba(50,40,24,0.10), 0 18px 36px -12px rgba(50,40,24,0.18)',
    sb: { ...themeBase.sb, accentInk: a.sb, activeBg: dark ? hexA(a.sb, 0.17) : a.act },
    ...extra,
  };
}

window.ANTASK_THEMES = ANTASK_THEMES;
window.ANTASK_ACCENTS = ANTASK_ACCENTS;
window.ANTASK_ACCENT_ORDER = ANTASK_ACCENT_ORDER;
window.ANTASK_FONTS = ANTASK_FONTS;
window.buildAntaskTheme = buildAntaskTheme;

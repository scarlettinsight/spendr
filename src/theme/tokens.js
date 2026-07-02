// Spendr design tokens — V2 (single source of truth).
// V2 rules: exactly 4 accents + neutral bar fill. Color always means STATE, never
// category. Cyan is reserved for interactive elements only. Surfaces are flat.
// Glow budget: hero number, header status dot, celebrations — everything else flat
// (kept by user choice: FAB hover bloom + faint toast shadows).

export const font = {
  readout: "'Chakra Petch', sans-serif", // numbers, ALL-CAPS labels, chips
  body: "'Space Grotesk', sans-serif",    // UI body, merchant/bill names, human copy
};

export const color = {
  // surfaces (flat — no card gradients)
  bg: '#070a12',
  bg2: '#0a0f19',
  card: '#0e1422',
  sheet: '#0d1320',

  // text
  textHi: '#eef3fe',
  textMid: '#c3cee2',
  textDim: '#8593ad',
  textFaint: '#5b6880',

  // the 4 accents
  safe: '#3be8a6',    // emerald — safe / paid / received / funded / positive
  amber: '#ffb437',   // caution — due soon / tight / watch / limit reached
  red: '#ff5470',     // debt / BNPL / critical / destructive
  redText: '#ff8098', // debt amounts / danger text
  cyan: '#2fe1f0',    // INTERACTIVE ONLY: active tab, links, primary buttons, selected chips, FAB
  onCyan: '#051018',  // near-black text on solid cyan/emerald

  // neutral bar fill (data without status meaning)
  neutral: '#5f7fae',

  // lines
  border: 'rgba(136,160,205,0.12)',
  borderSoft: 'rgba(136,160,205,0.08)',
  borderStrong: 'rgba(136,160,205,0.14)',
  divider: 'linear-gradient(90deg, rgba(136,160,205,0.16), transparent)',

  // legacy aliases (v1 names still referenced in a few places — map to v2 values)
  textHiWarm: '#eef3fe',
  textDim2: '#8593ad',
  slate: '#5b6880',
  safeSoft: '#3be8a6',
  amberSoft: '#ffb437',
  redText2: '#ff8098',
};

export const radius = {
  chip: 6,
  pill: 9,
  seg: 12,
  card: 14,
  cardLg: 16,
  hero: 20,
  sheet: 28,
  frame: 46,
  round: '50%',
};

export const space = {
  screenX: 16,
  headerX: 18,
  section: 15,
};

// Flat surfaces
export const surface = {
  card: '#0e1422',
  sheet: '#0d1320',
  hero: 'linear-gradient(170deg, #101a2c, #0b1120)',
};

// Motion tokens (Pass 2)
export const motion = {
  fast: '150ms',                                    // chips, toggles, ripples
  base: '220ms',                                    // sheets, tabs, cards, toasts
  easeOut: 'ease-out',
  spring: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)',       // celebrations, one-shot
  barEase: 'cubic-bezier(0.22, 1, 0.36, 1)',
};

// Composition-bar fills (hero)
export const composition = {
  spokenFor: 'rgba(133,147,173,0.4)',
  buffer: 'repeating-linear-gradient(135deg, rgba(133,147,173,0.45) 0 4px, rgba(133,147,173,0.16) 4px 8px)',
  safe: '#3be8a6',
};

// Financial-state → theming. Glow fields are ONLY for the two allowed spots.
export const stateTheme = {
  Stable: {
    key: 'Stable',
    color: '#3be8a6',
    rgb: '59,232,166',
    label: 'STABLE',
    labelText: '#3be8a6',
    border: 'rgba(59,232,166,0.28)',
    chipBg: 'rgba(59,232,166,0.08)',
    chipBorder: 'rgba(59,232,166,0.26)',
    heroGlow: '0 0 30px rgba(59,232,166,0.3)',
    heroGlowRolling: '0 0 30px rgba(59,232,166,0.45)',
    dotGlow: '0 0 8px #3be8a6',
  },
  Caution: {
    key: 'Caution',
    color: '#ffb437',
    rgb: '255,180,55',
    label: 'CAUTION',
    labelText: '#ffb437',
    border: 'rgba(255,180,55,0.30)',
    chipBg: 'rgba(255,180,55,0.08)',
    chipBorder: 'rgba(255,180,55,0.26)',
    heroGlow: '0 0 30px rgba(255,180,55,0.3)',
    heroGlowRolling: '0 0 30px rgba(255,180,55,0.45)',
    dotGlow: '0 0 8px #ffb437',
  },
  Critical: {
    key: 'Critical',
    color: '#ff5470',
    rgb: '255,84,112',
    label: 'CRITICAL',
    labelText: '#ff8098',
    border: 'rgba(255,84,112,0.32)',
    chipBg: 'rgba(255,84,112,0.08)',
    chipBorder: 'rgba(255,84,112,0.28)',
    heroGlow: '0 0 30px rgba(255,84,112,0.3)',
    heroGlowRolling: '0 0 30px rgba(255,84,112,0.45)',
    dotGlow: '0 0 8px #ff5470',
  },
};

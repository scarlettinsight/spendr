import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// V2 tags: one per bill max. DEBT/BNPL = red (BNPL folds into debt), SUB = neutral
// text tag. Flat tinted bg, no glow, 10px floor, tracking ≤ 2.
export const CHIP = {
  DEBT: { color: color.redText, rgb: '255,84,112', bg: 0.10, bd: 0.30 },
  BNPL: { color: color.redText, rgb: '255,84,112', bg: 0.10, bd: 0.30 },
  SUB:  { color: color.textDim, rgb: '136,160,205', bg: 0.08, bd: 0.22 },
};

export function Chip({ variant, children, tint, size = 10, style = {} }) {
  const t = CHIP[variant] || tint || CHIP.SUB;
  return html`<span style=${{
    fontFamily: font.readout,
    fontSize: size + 'px',
    letterSpacing: '1px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '5px',
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
    color: t.color,
    background: `rgba(${t.rgb},${t.bg})`,
    border: `1px solid rgba(${t.rgb},${t.bd})`,
    ...style,
  }}>${children != null ? children : variant}</span>`;
}

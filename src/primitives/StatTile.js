import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// Micro uppercase label + value. Optional semantic tint (bg/border/value color).
export function StatTile({ label, value, tint, valueColor, boxed = true }) {
  const bg = tint ? `rgba(${tint.rgb},0.05)` : 'rgba(255,255,255,0.03)';
  const bd = tint ? `rgba(${tint.rgb},0.16)` : 'rgba(120,160,220,0.1)';
  return html`<div style=${{
    flex: 1,
    background: boxed ? bg : 'transparent',
    border: boxed ? `1px solid ${bd}` : 'none',
    borderRadius: '11px',
    padding: boxed ? '9px 10px' : '0',
  }}>
    <div style=${{ fontSize: '8.5px', letterSpacing: '1px', color: color.textFaint, fontFamily: font.readout }}>${label}</div>
    <div style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '15px', color: valueColor || color.textMid, marginTop: '3px' }}>${value}</div>
  </div>`;
}

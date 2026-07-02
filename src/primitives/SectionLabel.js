import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// Uppercase Chakra Petch section header. V2: 10px floor, tracking ≤ 2px, flat dot.
export function SectionLabel({ children, accent, dot = false, divider = false, right, rightColor, onRight, tracking = 2, size = 11 }) {
  const c = accent || color.textFaint;
  return html`<div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    ${dot && html`<span style=${{ width: '6px', height: '6px', borderRadius: '2px', background: c }}></span>`}
    <span style=${{ fontFamily: font.readout, fontSize: Math.max(10, size) + 'px', letterSpacing: Math.min(2, tracking) + 'px', color: c, textTransform: 'uppercase' }}>${children}</span>
    ${divider && html`<span style=${{ flex: 1, height: '1px', background: color.divider }}></span>`}
    ${right != null && html`<span onClick=${onRight} style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: rightColor || color.cyan, cursor: onRight ? 'pointer' : 'default' }}>${right}</span>`}
  </div>`;
}

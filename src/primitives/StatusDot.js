import { html } from '../lib/html.js';

// Colored dot. V2 glow budget: flat by default — glow is opt-in and reserved
// for the header status-pill dot (and celebration moments).
export function StatusDot({ color, size = 8, square = false, glow = false, style = {} }) {
  return html`<span style=${{
    width: size + 'px',
    height: size + 'px',
    borderRadius: square ? '2px' : '50%',
    background: color,
    flex: '0 0 auto',
    boxShadow: glow ? `0 0 8px ${color}` : 'none',
    ...style,
  }}></span>`;
}

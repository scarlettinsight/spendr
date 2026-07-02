import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';

// V2 buttons: no gradients, no glow.
// primary = solid cyan (interactive), confirm = solid emerald (positive),
// ghost = tinted border + 5% bg, danger = ghost red (destructive).
export function Button({ variant = 'primary', children, onClick, full = false, style = {} }) {
  const base = {
    minHeight: '44px',
    padding: '14px',
    borderRadius: '13px',
    textAlign: 'center',
    fontFamily: font.readout,
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '1.5px',
    cursor: 'pointer',
    border: 'none',
    width: full ? '100%' : 'auto',
    userSelect: 'none',
    transition: 'transform 150ms ease-out, opacity 150ms ease-out',
  };
  const variants = {
    primary: { background: color.cyan, color: color.onCyan },
    confirm: { background: color.safe, color: color.onCyan },
    ghost: {
      background: 'rgba(47,225,240,0.05)',
      color: color.cyan,
      border: '1px solid rgba(47,225,240,0.28)',
      fontSize: '12px',
    },
    neutral: {
      background: 'rgba(136,160,205,0.05)',
      color: color.textMid,
      border: `1px solid ${color.border}`,
      fontSize: '12px',
    },
    danger: {
      background: 'rgba(255,84,112,0.05)',
      color: color.redText,
      border: '1px solid rgba(255,84,112,0.28)',
      fontSize: '12px',
      letterSpacing: '1px',
    },
  };
  return html`<button onClick=${onClick} style=${{ ...base, ...variants[variant], ...style }}>${children}</button>`;
}

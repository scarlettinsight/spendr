import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';

// Conic ring + inner disc. Center value + caption. Used for committed % (Home)
// and allocated % (Budget). Sweeps up from 0 on mount and glides on change;
// when `value` is a plain percentage string, the label rolls with the sweep.
export function ProgressRing({ pct, color: c, size = 82, value, caption, valueSize = 19 }) {
  const [p] = useAnimatedNumber(pct, { animateOnMount: true, duration: 850 });
  const clamped = Math.max(0, Math.min(100, p));
  const label = typeof value === 'string' && /^-?\d+%$/.test(value)
    ? `${Math.round(p)}%`
    : value;
  const inner = size - 20;
  return html`<div style=${{
    flex: '0 0 auto',
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    background: `conic-gradient(${c} 0% ${clamped}%, rgba(255,255,255,0.06) ${clamped}% 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 22px ${c}40`,
  }}>
    <div style=${{
      width: inner + 'px',
      height: inner + 'px',
      borderRadius: '50%',
      background: '#0a0e17',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1px',
    }}>
      <span style=${{ fontFamily: font.readout, fontSize: valueSize + 'px', color: c }}>${label}</span>
      <span style=${{ fontSize: '7px', letterSpacing: '1px', color: color.textDim2 }}>${caption}</span>
    </div>
  </div>`;
}

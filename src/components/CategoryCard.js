import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { money } from '../lib/format.js';
import { ProgressBar } from '../primitives/ProgressBar.js';

// Envelope card. Expects a month-rollup row: { name, color, budget, spent,
// committed, remaining, over }. Bar = two segments: Spent (solid) + Committed
// (same hue, dimmed). Status text is live; past months show OVER/UNDER.
function statusFor(row, isPast) {
  const used = row.spent + row.committed;
  const ratio = row.budget ? used / row.budget : 0;
  if (isPast) {
    return row.spent > row.budget
      ? { text: `OVER BY ${money(row.spent - row.budget)}`, color: color.amber, bar: color.amber }
      : { text: `UNDER BY ${money(row.budget - row.spent)}`, color: color.safe, bar: row.color || color.neutral };
  }
  if (ratio >= 1) return { text: 'LIMIT REACHED', color: color.amber, bar: color.amber };
  if (ratio >= 0.85) return { text: 'TIGHT', color: color.amber, bar: color.amber };
  if (ratio >= 0.75) return { text: 'WATCH', color: color.amber, bar: color.amber };
  return { text: 'ON TRACK', color: color.textDim, bar: row.color || color.neutral };
}

function segments(row, st) {
  const pct = (v) => row.budget ? Math.min(100, (v / row.budget) * 100) : 0;
  const spentPct = pct(row.spent);
  const segs = [{ pct: spentPct, color: st.bar }];
  if (row.committed > 0) segs.push({ pct: Math.min(100 - spentPct, pct(row.committed)), color: `${st.bar}45` });
  return segs;
}

export function CategoryCard({ row, isPast = false, pulse = false, onClick }) {
  const st = statusFor(row, isPast);
  return html`<div onClick=${onClick} style=${{
    borderRadius: '14px', padding: '14px',
    background: surface.card,
    border: `1px solid ${color.border}`,
    animation: pulse ? 'sp-pulse 900ms ease-in-out 2' : 'none',
    cursor: onClick ? 'pointer' : 'default',
  }}>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style=${{ width: '8px', height: '8px', borderRadius: '3px', background: row.color || color.neutral, flex: '0 0 auto' }}></span>
        <span style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '14px', color: color.textHi }}>${row.name}</span>
      </div>
      <span key=${st.text} style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', fontWeight: 600, color: st.color, animation: 'spendr-fade-in 300ms ease-out' }}>${st.text}</span>
    </div>

    <div style=${{ marginTop: '11px' }}>
      <${ProgressBar} segments=${segments(row, st)} height=${6} />
    </div>

    <div style=${{ display: 'flex', justifyContent: 'space-between', marginTop: '9px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.4px', color: color.textFaint }}>
        ${money(row.spent)} spent of ${money(row.budget)}${row.committed > 0 ? ` · ${money(row.committed)} committed` : ''}
      </span>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', fontWeight: 600, color: row.remaining <= 0 ? color.amber : color.textMid }}>${money(row.remaining)} left</span>
    </div>
  </div>`;
}

// 2-col mini card used on Home.
export function CategoryMiniCard({ row, onClick }) {
  const st = statusFor(row, false);
  return html`<div onClick=${onClick} style=${{
    flex: '1 1 calc(50% - 5px)', minWidth: '140px',
    background: surface.card,
    border: `1px solid ${color.border}`, borderRadius: '13px', padding: '12px',
    display: 'flex', flexDirection: 'column', gap: '9px',
    cursor: onClick ? 'pointer' : 'default',
  }}>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
        <span style=${{ width: '7px', height: '7px', borderRadius: '2px', background: row.color || color.neutral, flex: '0 0 auto' }}></span>
        <span style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '12.5px', color: color.textMid, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${row.name}</span>
      </div>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', color: row.remaining <= 0 ? color.amber : color.textMid, flex: '0 0 auto' }}>${money(row.remaining)}</span>
    </div>
    <${ProgressBar} segments=${segments(row, st)} height=${5} />
    <span style=${{ fontSize: '10px', color: color.textFaint, fontFamily: font.readout, letterSpacing: '0.4px' }}>${money(row.spent)} + ${money(row.committed)} committed</span>
  </div>`;
}

import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { money } from '../lib/format.js';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { ProgressBar } from '../primitives/ProgressBar.js';

// V2: flat card, red hairline (debt = state). Split bar: paid emerald vs
// upcoming red — flat, no glow. Paying a bill visibly shifts the split and
// rolls the numbers (BNPL folds into debt-red).
export function DebtPulseCard({ debt }) {
  const paidPct = debt.paidPct;
  const [paidD] = useAnimatedNumber(debt.paid, { duration: 650 });
  const [upcomingD] = useAnimatedNumber(debt.upcoming, { duration: 650 });

  return html`<div style=${{
    borderRadius: '16px', padding: '16px',
    background: surface.card,
    border: '1px solid rgba(255,84,112,0.22)',
  }}>
    <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style=${{ width: '6px', height: '6px', borderRadius: '50%', background: color.red }}></span>
        <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '2px', color: color.redText }}>DEBT PULSE</span>
      </div>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '1.5px', color: color.textDim }}>TACTICAL</span>
    </div>

    <div style=${{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginTop: '12px' }}>
      <span style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '30px', color: color.redText }}>${money(debt.total)}</span>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textDim, marginBottom: '6px' }}>due this month</span>
    </div>

    <div style=${{ marginTop: '12px' }}>
      <${ProgressBar} height=${7} segments=${[
        { pct: paidPct, color: color.safe },
        { pct: 100 - paidPct, color: color.red },
      ]} />
    </div>

    <div style=${{ display: 'flex', gap: '8px', marginTop: '13px' }}>
      ${stat('PAID', money(paidD), color.safe)}
      ${stat('UPCOMING', money(upcomingD), color.amber)}
      ${stat('BNPL / AFFIRM', money(debt.bnpl), color.redText)}
    </div>
  </div>`;
}

function stat(label, value, c) {
  return html`<div style=${{ flex: 1 }}>
    <div style=${{ fontSize: '10px', letterSpacing: '1px', color: color.textFaint, fontFamily: font.readout }}>${label}</div>
    <div style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: c, marginTop: '2px' }}>${value}</div>
  </div>`;
}

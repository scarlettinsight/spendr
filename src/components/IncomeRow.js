import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { money } from '../lib/format.js';
import { fmtShort } from '../lib/dates.js';
import { freqLabel } from '../lib/recur.js';

// Planned-income OCCURRENCE row. Tap to manage (edit / mark received / delete).
export function IncomeRow({ occ, onOpen }) {
  const st = occ.received
    ? { text: 'RECEIVED ✓', color: color.safe }
    : { text: 'PLANNED', color: color.textDim };
  const amtColor = occ.received ? color.safe : color.textMid;
  const meta = [
    `${occ.received ? 'Received' : 'Expected'} ${fmtShort(occ.received ? occ.receivedInfo.date : occ.date)}`,
    occ.recurring ? `↻ ${freqLabel(occ.series.recurrence)}` : null,
    !occ.received ? 'tap when it lands' : null,
  ].filter(Boolean).join(' · ');

  return html`<div onClick=${onOpen ? () => onOpen(occ) : undefined} style=${{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 13px', borderRadius: '12px',
    background: surface.card,
    border: `1px solid ${color.border}`,
    cursor: onOpen ? 'pointer' : 'default',
  }}>
    <div style=${{ minWidth: 0 }}>
      <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13px', color: color.textHi, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${occ.name}</div>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, letterSpacing: '0.5px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${meta}</div>
    </div>
    <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flex: '0 0 auto', marginLeft: '10px' }}>
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: amtColor }}>+${money(occ.received ? occ.receivedInfo.amount : occ.amount, { cents: true })}</span>
      <span key=${st.text} style=${{
        fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', fontWeight: 600, color: st.color,
        animation: occ.received ? 'spendr-pop-in 340ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
      }}>${st.text}</span>
    </div>
  </div>`;
}

import { html } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { money } from '../lib/format.js';
import { useStore } from '../state/store.js';
import { dayOfMonth } from '../lib/dates.js';

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const IMPACT = {
  down: { text: '↓ Checking', color: color.textDim },
  up: { text: '↑ Checking', color: color.safe },
  none: { text: 'Card · no impact', color: color.textFaint },
};

// Ledger row (V3): real date block, category color + name, flags in meta,
// ⇄ marks a bill-payment link.
export function TransactionRow({ tx, onClick }) {
  const { state } = useStore();
  const impact = IMPACT[tx.impact] || IMPACT.none;
  const cat = state.categories.find((c) => c.id === tx.categoryId);
  const isDebt = (tx.flagIds || []).some((id) => state.flags.some((f) => f.id === id && f.system === 'debt'));
  const amtColor = tx.amount > 0 ? color.safe : isDebt ? color.redText : color.textHi;
  const amtStr = money(tx.amount, { cents: true, sign: tx.amount > 0 });
  const flagNames = (tx.flagIds || [])
    .map((id) => state.flags.find((f) => f.id === id))
    .filter(Boolean).map((f) => f.name);
  const metaBits = [cat ? cat.name : (tx.amount > 0 ? 'Income' : 'Uncategorized'), tx.sourceName, tx.billId ? '⇄ bill' : null, ...flagNames].filter(Boolean);

  return html`<div onClick=${onClick} style=${{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 13px',
    borderRadius: '12px', background: surface.card,
    border: `1px solid ${color.borderSoft}`,
    cursor: onClick ? 'pointer' : 'default',
  }}>
    <div style=${{ flex: '0 0 auto', width: '38px', textAlign: 'center' }}>
      <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textFaint }}>${MON[Number(tx.date.slice(5, 7)) - 1]}</div>
      <div style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '16px', color: color.textMid, lineHeight: 1 }}>${String(dayOfMonth(tx.date)).padStart(2, '0')}</div>
    </div>
    <div style=${{ width: '1px', alignSelf: 'stretch', background: color.border }}></div>
    <div style=${{ flex: 1, minWidth: 0 }}>
      <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '13px', color: color.textHi, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${tx.name}</div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
        ${cat && html`<span style=${{ width: '6px', height: '6px', borderRadius: '2px', background: cat.color, flex: '0 0 auto' }}></span>`}
        <span style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${metaBits.join(' · ')}</span>
      </div>
    </div>
    <div style=${{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: amtColor }}>${amtStr}</span>
      <span style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: impact.color }}>${impact.text}</span>
    </div>
  </div>`;
}

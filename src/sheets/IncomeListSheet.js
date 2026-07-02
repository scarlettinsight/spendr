import { html } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { IncomeRow } from '../components/IncomeRow.js';

// Income manager: upcoming occurrences (tappable → occurrence sheet) + add.
export function IncomeListSheet({ open, onClose }) {
  const { derived } = useStore();
  const upcoming = derived.incomeOcc.filter((o) => o.date >= derived.today || o.received).slice(0, 8);

  return html`<${BottomSheet} title="Income" onClose=${onClose}>
    <div style=${{ fontFamily: font.readout, fontSize: '10px', letterSpacing: '0.5px', color: color.textDim, marginBottom: '12px' }}>
      Tap an entry to receive, edit its series, skip, or delete
    </div>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '14px' }}>
      ${upcoming.map((o) => html`<${IncomeRow} key=${o.incomeId + o.key} occ=${o}
        onOpen=${(x) => open({ type: 'income', occ: x })} />`)}
      ${upcoming.length === 0 && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, textAlign: 'center', padding: '10px' }}>no planned income yet</div>`}
    </div>
    <${Button} variant="ghost" full onClick=${() => open({ type: 'add', kind: 'Income' })}>+ ADD INCOME<//>
  </${BottomSheet}>`;
}

import { html, React } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast } from '../lib/toast.js';
import { fmtShort } from '../lib/dates.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { FieldLabel } from './fields.js';
import { FlagPicker } from './FlagPicker.js';

// Ledger entry detail: flags apply instantly; deleting a bill-payment entry
// also releases that bill occurrence back to unpaid (and undo re-links it).
export function TxSheet({ tx, onClose }) {
  const { state, dispatch } = useStore();
  const [tags, setTags] = React.useState(tx ? (tx.flagIds || []) : []);
  if (!tx) return null;

  const cat = state.categories.find((c) => c.id === tx.categoryId);

  const applyTags = (next) => {
    setTags(next);
    dispatch({ type: 'updateExpense', id: tx.id, patch: { flagIds: next } });
  };

  const del = () => {
    const index = state.expenses.findIndex((t) => t.id === tx.id);
    dispatch({ type: 'removeExpense', id: tx.id });
    pushToast({
      detail: `${tx.name} · entry deleted${tx.billId ? ' · bill back to unpaid' : ''}`,
      undo: () => dispatch({ type: 'restoreExpense', tx, index }),
    });
    onClose();
  };

  return html`<${BottomSheet} title="Entry" onClose=${onClose}>
    <div style=${{
      borderRadius: '14px', padding: '16px', background: surface.card,
      border: `1px solid ${color.border}`, marginBottom: '16px', textAlign: 'center',
    }}>
      <div style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '15px', color: color.textHi }}>${tx.name}</div>
      <div style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '26px', color: tx.amount > 0 ? color.safe : color.textHi, marginTop: '6px' }}>${money(tx.amount, { cents: true, sign: tx.amount > 0 })}</div>
      <div style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textDim, marginTop: '6px', letterSpacing: '0.4px' }}>
        ${fmtShort(tx.date)} · ${cat ? cat.name : (tx.amount > 0 ? 'Income' : 'Uncategorized')} · ${tx.sourceName || '—'}
      </div>
      ${tx.billId && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, marginTop: '5px' }}>⇄ linked bill payment</div>`}
    </div>

    <${FieldLabel}>FLAGS<//>
    <div style=${{ marginBottom: '16px' }}>
      <${FlagPicker} selected=${tags} onChange=${applyTags} />
    </div>

    <${Button} variant="danger" full onClick=${del}>DELETE ENTRY<//>
  </${BottomSheet}>`;
}

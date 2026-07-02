import { html, React } from '../lib/html.js';
import { font, color, surface } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast } from '../lib/toast.js';
import { payOccurrence, occDueText } from '../lib/actions.js';
import { freqLabel } from '../lib/recur.js';
import { fmtShort } from '../lib/dates.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { Chip } from '../primitives/Chip.js';
import { FieldLabel, FieldRow, TextField, MoneyField, ToggleRow, SelectPill, SourceTile, DatePicker, RecurrencePicker } from './fields.js';
import { FlagPicker } from './FlagPicker.js';

// Bill OCCURRENCE sheet.
//   View: pay (amount editable at payment time), or manage.
//   Edit: for recurring bills, saving/deleting prompts
//         "This occurrence only" vs "This and all future occurrences".
//   Occurrence overrides persist across later series edits (split-series carries
//   them forward).
export function MarkPaid({ occ, onClose }) {
  const { state, derived, dispatch } = useStore();
  const [mode, setMode] = React.useState('view'); // view | edit | scope-save | scope-delete
  const [deduct, setDeduct] = React.useState(true);

  // pay-time fields (amount may differ from planned)
  const [payAmount, setPayAmount] = React.useState(occ ? String(occ.amount) : '0');
  const [payDate, setPayDate] = React.useState(derived.today);
  const [showPayDate, setShowPayDate] = React.useState(false);

  // edit fields
  const [name, setName] = React.useState(occ ? occ.name : '');
  const [amount, setAmount] = React.useState(occ ? String(occ.amount) : '0');
  const [date, setDate] = React.useState(occ ? (occ.flexible ? occ.key : occ.date) : derived.today);
  const [rec, setRec] = React.useState(occ ? { ...occ.bill.recurrence } : { freq: 'monthly', anchorDate: derived.today });
  const [catId, setCatId] = React.useState(occ ? occ.categoryId : null);
  const [inBudget, setInBudget] = React.useState(occ ? !!occ.inBudget : true);
  const [tags, setTags] = React.useState(occ ? [...(occ.flagIds || [])] : []);
  const [sourceId, setSourceId] = React.useState(occ ? occ.sourceId : 'chk');

  if (!occ) return null;
  const bill = occ.bill;
  const recurring = occ.recurring;
  const src = state.sources.find((s) => s.id === occ.sourceId) || state.sources[0];
  const cat = state.categories.find((c) => c.id === occ.categoryId);
  const meta = [occDueText(occ, derived.today), src ? src.name : null, `↻ ${freqLabel(bill.recurrence)}`].filter(Boolean).join(' · ');

  /* ---------- pay ---------- */
  const confirmPay = () => {
    const amt = Math.abs(parseFloat(payAmount || '0') || 0) || occ.amount;
    payOccurrence(dispatch, derived, occ, { amount: amt, date: payDate, deductNow: deduct });
    onClose();
  };

  const markUnpaid = () => {
    dispatch({ type: 'unpayOccurrence', billId: occ.billId, key: occ.key });
    pushToast({
      detail: `${occ.name} · back to unpaid`,
      undo: () => dispatch({ type: 'payOccurrence', billId: occ.billId, key: occ.key, name: occ.name, amount: occ.paidInfo.amount, date: occ.paidInfo.date, expenseId: occ.paidInfo.expenseId, deductNow: true }),
    });
    onClose();
  };

  /* ---------- edit: build the patch, then choose scope ---------- */
  const editedAmount = Math.abs(parseFloat(amount || '0') || 0) || occ.amount;
  const requestSave = () => {
    if (!recurring) { applySeries(); return; }
    setMode('scope-save');
  };

  const applyThisOnly = () => {
    // occurrence-level fields only: name / amount / date
    const patch = {};
    if (name && name !== occ.name) patch.name = name;
    if (editedAmount !== occ.amount) patch.amount = editedAmount;
    if (!occ.flexible && date !== occ.date) patch.date = date;
    const prev = (bill.overrides || {})[occ.key] || null;
    dispatch({ type: 'overrideOccurrence', billId: bill.id, key: occ.key, patch });
    pushToast({
      detail: `${occ.name} · this occurrence updated`,
      undo: () => prev
        ? dispatch({ type: 'overrideOccurrence', billId: bill.id, key: occ.key, patch: prev })
        : dispatch({ type: 'clearOverride', billId: bill.id, key: occ.key }),
    });
    onClose();
  };

  const applyFuture = () => {
    const newId = 'bill' + Date.now();
    const original = bill;
    dispatch({
      type: 'splitBillSeries', billId: bill.id, fromKey: occ.key, newId,
      patch: {
        name: name || bill.name, amount: editedAmount,
        categoryId: catId, inBudget: !!catId && inBudget,
        flagIds: tags, sourceId,
        recurrence: { ...rec, anchorDate: occ.flexible ? occ.key : date, flexible: !!rec.flexible },
      },
    });
    pushToast({
      detail: `${name || bill.name} · this + future updated`,
      undo: () => dispatch({ type: 'unsplitBillSeries', original, newId }),
    });
    onClose();
  };

  const applySeries = () => { // non-recurring (one-time) bill
    const prev = { name: bill.name, amount: bill.amount, categoryId: bill.categoryId, inBudget: bill.inBudget, flagIds: bill.flagIds, sourceId: bill.sourceId, recurrence: bill.recurrence };
    dispatch({ type: 'updateBill', id: bill.id, patch: {
      name: name || bill.name, amount: editedAmount,
      categoryId: catId, inBudget: !!catId && inBudget, flagIds: tags, sourceId,
      recurrence: { ...rec, anchorDate: date },
    } });
    pushToast({
      detail: `${name || bill.name} · updated`,
      undo: () => dispatch({ type: 'updateBill', id: bill.id, patch: prev }),
    });
    onClose();
  };

  /* ---------- delete ---------- */
  const requestDelete = () => {
    if (!recurring) { deleteSeries(); return; }
    setMode('scope-delete');
  };

  const deleteThisOnly = () => { // skip this occurrence
    const prev = (bill.overrides || {})[occ.key] || null;
    dispatch({ type: 'overrideOccurrence', billId: bill.id, key: occ.key, patch: { skipped: true } });
    pushToast({
      detail: `${occ.name} · ${fmtShort(occ.date)} skipped`,
      undo: () => prev
        ? dispatch({ type: 'overrideOccurrence', billId: bill.id, key: occ.key, patch: { ...prev, skipped: false } })
        : dispatch({ type: 'clearOverride', billId: bill.id, key: occ.key }),
    });
    onClose();
  };

  const deleteSeries = () => {
    const index = state.bills.findIndex((b) => b.id === bill.id);
    dispatch({ type: 'removeBill', id: bill.id });
    pushToast({
      detail: `${bill.name} · series deleted`,
      undo: () => dispatch({ type: 'restoreBill', bill, index }),
    });
    onClose();
  };

  /* ---------- scope chooser (Google Calendar pattern) ---------- */
  if (mode === 'scope-save' || mode === 'scope-delete') {
    const saving = mode === 'scope-save';
    return html`<${BottomSheet} title=${saving ? 'Apply changes to…' : 'Delete…'} onClose=${onClose}>
      <div style=${{ fontFamily: font.body, fontSize: '13px', color: color.textMid, marginBottom: '16px', lineHeight: 1.5 }}>
        ${bill.name} repeats ${freqLabel(bill.recurrence).toLowerCase()}. ${saving ? 'Where should the changes apply?' : 'What should be deleted?'}
      </div>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <${Button} variant="primary" full onClick=${saving ? applyThisOnly : deleteThisOnly}>
          THIS OCCURRENCE ONLY · ${fmtShort(occ.date)}
        <//>
        <${Button} variant=${saving ? 'confirm' : 'danger'} full onClick=${saving ? applyFuture : deleteSeries}>
          ${saving ? 'THIS AND ALL FUTURE' : 'ENTIRE SERIES'}
        <//>
        <${Button} variant="neutral" full onClick=${() => setMode(saving ? 'edit' : 'view')}>CANCEL<//>
      </div>
    </${BottomSheet}>`;
  }

  /* ---------- edit mode ---------- */
  if (mode === 'edit') {
    return html`<${BottomSheet} title="Edit Bill" onClose=${onClose}>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '16px' }}>
        <${TextField} label="NAME" value=${name} onChange=${setName} placeholder="e.g. Internet — Verizon" />
        <${MoneyField} label="AMOUNT" value=${amount} onChange=${setAmount} />
      </div>

      ${!occ.flexible && html`<div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>DATE${recurring ? ' (this occurrence · series keeps its rhythm unless "all future")' : ''}<//>
        <${DatePicker} value=${date} onChange=${setDate} />
      </div>`}

      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>REPEATS (applies to series / future)<//>
        <${RecurrencePicker} rec=${rec} onChange=${setRec} />
      </div>

      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>BUDGET CATEGORY<//>
        <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          <${SelectPill} label="None" active=${catId === null} onClick=${() => setCatId(null)} />
          ${state.categories.map((c) => html`<${SelectPill} key=${c.id} label=${c.name} dot=${c.color} active=${catId === c.id} onClick=${() => setCatId(c.id)} />`)}
        </div>
      </div>

      ${catId && html`<div style=${{ marginBottom: '16px' }}>
        <${ToggleRow} label="Counts toward budget" caption="unpaid = committed · paid = spent" on=${inBudget} onChange=${setInBudget} />
      </div>`}

      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>FLAGS<//>
        <${FlagPicker} selected=${tags} onChange=${setTags} />
      </div>

      <div style=${{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        ${state.sources.map((s, i) => html`<${SourceTile} key=${s.id} source=${s} active=${sourceId === s.id}
          expand=${i === 0} onClick=${() => setSourceId(s.id)} />`)}
      </div>

      <${Button} variant="primary" full onClick=${requestSave}>SAVE CHANGES<//>
      <div style=${{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <${Button} variant="neutral" onClick=${() => setMode('view')} style=${{ flex: 1 }}>BACK<//>
        <${Button} variant="danger" onClick=${requestDelete} style=${{ flex: 1 }}>DELETE<//>
      </div>
    </${BottomSheet}>`;
  }

  /* ---------- view mode ---------- */
  return html`<${BottomSheet} title=${occ.paid ? 'Bill' : 'Mark Paid'} onClose=${onClose}>
    <div style=${{
      position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '16px 16px 16px 18px', borderRadius: '14px',
      background: surface.card,
      border: `1px solid ${occ.debt ? 'rgba(255,84,112,0.28)' : color.border}`, marginBottom: '18px',
    }}>
      <div style=${{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', background: occ.debt ? color.red : 'rgba(95,127,174,0.55)' }}></div>
      <div style=${{ minWidth: 0 }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          ${cat && html`<span style=${{ width: '7px', height: '7px', borderRadius: '2px', background: cat.color, flex: '0 0 auto' }}></span>`}
          <span style=${{ fontFamily: font.body, fontWeight: 600, fontSize: '15px', color: color.textHi, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>${occ.name}</span>
          ${occ.debt && html`<${Chip} variant="DEBT" />`}
        </div>
        <div style=${{ fontFamily: font.readout, fontSize: '11px', color: color.textDim, marginTop: '6px', letterSpacing: '0.3px' }}>${meta}</div>
      </div>
      <span style=${{ fontFamily: font.readout, fontWeight: 700, fontSize: '22px', color: occ.debt ? color.redText : color.textHi, flex: '0 0 auto', marginLeft: '10px' }}>${money(occ.amount)}</span>
    </div>

    ${!occ.paid && html`<div>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '16px' }}>
        <${MoneyField} label="AMOUNT PAID" value=${payAmount} onChange=${setPayAmount} />
        <div onClick=${() => setShowPayDate(!showPayDate)} style=${{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}`, cursor: 'pointer' }}>
          <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>DATE PAID</span>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textHi }}>${payDate === derived.today ? 'Today' : fmtShort(payDate)} ▾</span>
        </div>
        ${showPayDate && html`<${DatePicker} value=${payDate} onChange=${(d) => { setPayDate(d); setShowPayDate(false); }} />`}
        <${FieldRow} label="PAID FROM" value=${src ? src.name : '—'} />
      </div>

      ${Math.abs(parseFloat(payAmount || '0') - occ.amount) > 0.005 && html`<div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textDim, marginBottom: '12px', letterSpacing: '0.4px' }}>
        planned ${money(occ.amount, { cents: true })} → paying ${money(parseFloat(payAmount || '0') || 0, { cents: true })} · the paid amount hits the ledger; the committed amount is released
      </div>`}

      <div style=${{ marginBottom: '16px' }}>
        <${ToggleRow} label="Deduct from checking now" on=${deduct} onChange=${setDeduct} />
      </div>

      <${Button} variant="confirm" full onClick=${confirmPay}>CONFIRM PAID<//>
    </div>`}

    ${occ.paid && html`<div style=${{ marginBottom: '2px' }}>
      <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.safe, textAlign: 'center', marginBottom: '14px' }}>
        PAID ✓ ${money(occ.paidInfo.amount, { cents: true })} on ${fmtShort(occ.paidInfo.date)}
      </div>
      <${Button} variant="neutral" full onClick=${markUnpaid}>MARK UNPAID<//>
    </div>`}

    <div style=${{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <${Button} variant="neutral" onClick=${() => setMode('edit')} style=${{ flex: 1 }}>EDIT BILL<//>
      <${Button} variant="danger" onClick=${requestDelete} style=${{ flex: 1 }}>DELETE<//>
    </div>
  </${BottomSheet}>`;
}

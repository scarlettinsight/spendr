import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast } from '../lib/toast.js';
import { receiveOccurrence } from '../lib/actions.js';
import { freqLabel } from '../lib/recur.js';
import { fmtShort } from '../lib/dates.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { TextField, MoneyField, FieldLabel, DatePicker, RecurrencePicker } from './fields.js';

// Income OCCURRENCE sheet: mark received (amount editable — M4 payday),
// edit the series (name/amount/date/recurrence), skip this occurrence,
// or delete the series. All with 5s undo.
export function IncomeSheet({ occ, onClose }) {
  const { state, dispatch, derived } = useStore();
  const [recvAmount, setRecvAmount] = React.useState(occ ? String(occ.amount) : '0');
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(occ ? occ.series.name : '');
  const [amount, setAmount] = React.useState(occ ? String(occ.series.amount) : '0');
  const [date, setDate] = React.useState(occ ? occ.series.recurrence.anchorDate : derived.today);
  const [rec, setRec] = React.useState(occ ? { ...occ.series.recurrence } : { freq: 'once', anchorDate: derived.today });
  if (!occ) return null;
  const series = occ.series;

  const receive = () => {
    const amt = Math.abs(parseFloat(recvAmount || '0') || 0) || occ.amount;
    receiveOccurrence(dispatch, occ, { amount: amt, date: derived.today });
    onClose();
  };

  const unreceive = () => {
    dispatch({ type: 'unreceiveOccurrence', incomeId: occ.incomeId, key: occ.key });
    pushToast({ detail: `${occ.name} · back to planned` });
    onClose();
  };

  const skipOccurrence = () => {
    const prev = (series.overrides || {})[occ.key] || null;
    dispatch({ type: 'updateIncome', id: series.id, patch: {
      overrides: { ...(series.overrides || {}), [occ.key]: { ...(prev || {}), skipped: true } },
    } });
    pushToast({
      detail: `${occ.name} · ${fmtShort(occ.date)} skipped`,
      undo: () => dispatch({ type: 'updateIncome', id: series.id, patch: { overrides: { ...(series.overrides || {}), [occ.key]: prev || undefined } } }),
    });
    onClose();
  };

  const saveEdit = () => {
    const amt = Math.abs(parseFloat(amount || '0') || 0) || series.amount;
    const prev = { name: series.name, amount: series.amount, recurrence: series.recurrence };
    dispatch({ type: 'updateIncome', id: series.id, patch: {
      name: name || series.name, amount: amt,
      recurrence: { ...rec, anchorDate: date },
      isPaycheck: /paycheck|salary|payroll/i.test(name || series.name),
    } });
    pushToast({
      detail: `${name || series.name} · updated`,
      undo: () => dispatch({ type: 'updateIncome', id: series.id, patch: prev }),
    });
    onClose();
  };

  const del = () => {
    const index = state.income.findIndex((i) => i.id === series.id);
    dispatch({ type: 'removeIncome', id: series.id });
    pushToast({
      detail: `${series.name} · deleted`,
      undo: () => dispatch({ type: 'restoreIncome', income: series, index }),
    });
    onClose();
  };

  if (editing) {
    return html`<${BottomSheet} title="Edit Income" onClose=${onClose}>
      <div style=${{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '16px' }}>
        <${TextField} label="NAME" value=${name} onChange=${setName} placeholder="e.g. Paycheck" />
        <${MoneyField} label="AMOUNT" value=${amount} onChange=${setAmount} />
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>ANCHOR DATE<//>
        <${DatePicker} value=${date} onChange=${setDate} />
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>REPEATS<//>
        <${RecurrencePicker} rec=${rec} onChange=${setRec} />
      </div>
      <${Button} variant="primary" full onClick=${saveEdit}>SAVE CHANGES<//>
      <div style=${{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <${Button} variant="neutral" onClick=${() => setEditing(false)} style=${{ flex: 1 }}>BACK<//>
        <${Button} variant="danger" onClick=${del} style=${{ flex: 1 }}>DELETE SERIES<//>
      </div>
    </${BottomSheet}>`;
  }

  return html`<${BottomSheet} title="Income" onClose=${onClose}>
    <div style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: occ.received ? color.safe : color.textDim, textAlign: 'center', marginBottom: '6px' }}>
      ${occ.received ? `RECEIVED ✓ ${money(occ.receivedInfo.amount, { cents: true })} on ${fmtShort(occ.receivedInfo.date)}` : `PLANNED · ${fmtShort(occ.date)}`}
    </div>
    <div style=${{ fontFamily: font.readout, fontSize: '10px', color: color.textFaint, textAlign: 'center', marginBottom: '14px' }}>
      ${occ.name} · ↻ ${freqLabel(series.recurrence)}
    </div>

    ${!occ.received && html`<div>
      <div style=${{ marginBottom: '12px' }}>
        <${MoneyField} label="AMOUNT RECEIVED" value=${recvAmount} onChange=${setRecvAmount} />
      </div>
      <${Button} variant="confirm" full onClick=${receive}>MARK RECEIVED<//>
      <div style=${{ marginTop: '10px' }}>
        <${Button} variant="neutral" full onClick=${skipOccurrence}>SKIP THIS ONE · ${fmtShort(occ.date).toUpperCase()}<//>
      </div>
    </div>`}

    ${occ.received && html`<${Button} variant="neutral" full onClick=${unreceive}>MARK NOT RECEIVED<//>`}

    <div style=${{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <${Button} variant="neutral" onClick=${() => setEditing(true)} style=${{ flex: 1 }}>EDIT SERIES<//>
      <${Button} variant="danger" onClick=${del} style=${{ flex: 1 }}>DELETE<//>
    </div>
  </${BottomSheet}>`;
}

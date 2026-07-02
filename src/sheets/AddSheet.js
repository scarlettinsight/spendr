import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore, previewSafeAfter } from '../state/store.js';
import { money } from '../lib/format.js';
import { pushToast, pushCelebration } from '../lib/toast.js';
import { fmtShort, todayISO } from '../lib/dates.js';
import { BottomSheet } from '../components/BottomSheet.js';
import { Button } from '../primitives/Button.js';
import { FieldLabel, Segment, SelectPill, SourceTile, AmountInput, TextField, ToggleRow, DatePicker, RecurrencePicker } from './fields.js';
import { FlagPicker } from './FlagPicker.js';

// Quick-add sheet: Expense (actual spending, dated) / Income (planned series) /
// Bill (planned series with recurrence — any future date in any month).
export function AddSheet({ onClose, initialKind = 'Expense', initialDate }) {
  const { state, derived, dispatch } = useStore();
  const today = derived.today;

  const [kind, setKind] = React.useState(initialKind);
  const [amount, setAmount] = React.useState('48');
  const [name, setName] = React.useState('');
  const [categoryId, setCategoryId] = React.useState((state.categories.find((c) => c.name === 'Food') || state.categories[0] || {}).id || null);
  const [billCatId, setBillCatId] = React.useState(null);
  const [inBudget, setInBudget] = React.useState(true);
  const [sourceId, setSourceId] = React.useState((state.sources[0] || {}).id);
  const [tags, setTags] = React.useState([]);
  const [date, setDate] = React.useState(initialDate || today);
  const [showDate, setShowDate] = React.useState(!!initialDate);
  const [rec, setRec] = React.useState({ freq: 'monthly', anchorDate: initialDate || today, flexible: false });

  const src = state.sources.find((s) => s.id === sourceId) || state.sources[0] || {};
  const amt = parseFloat(amount || '0') || 0;
  const fromChecking = !!src.isChecking;
  const safeAfter = previewSafeAfter(derived, amt, fromChecking && kind !== 'Income');
  const cautionPreview = safeAfter < derived.buffer;

  const catColorOf = (id) => (state.categories.find((c) => c.id === id) || {}).color;

  // ---- expense commit (form + quick-log): M2 undo toast + M3 limit check ----
  const logExpense = ({ title, amount: a, categoryId: cid, sourceId: sid, sourceName, isChecking, tags: txTags = [], date: d }) => {
    const id = 'tx' + Date.now();
    dispatch({ type: 'addExpense', expense: {
      id, date: d || today, name: title, amount: -Math.abs(a),
      categoryId: cid || null, flagIds: txTags,
      sourceId: sid, sourceName, impact: isChecking ? 'down' : 'none',
    } });
    pushToast({
      detail: `${title} · ${money(a, { cents: true })} logged${cid ? ' · ' + ((state.categories.find((c) => c.id === cid) || {}).name || '') : ''}`,
      undo: () => dispatch({ type: 'removeExpense', id }),
    });

    // M3: crossing the envelope limit → calm amber moment
    const row = derived.monthRollup(d || today).rows.find((r) => r.id === cid);
    if (row && row.budget > 0) {
      const before = row.spent + row.committed;
      if (before < row.budget && before + a >= row.budget) {
        const other = derived.monthRollup(d || today).rows.find((r) => r.name === 'Other');
        const canShift = row.name !== 'Other' && other && (other.budget - other.spent - other.committed) >= 20;
        pushCelebration({
          type: 'limit', cat: row.name, canShift,
          onShift: () => {
            const otherCat = state.categories.find((c) => c.name === 'Other');
            const target = state.categories.find((c) => c.id === cid);
            if (!otherCat || !target) return;
            dispatch({ type: 'updateCategory', id: otherCat.id, patch: { budget: otherCat.budget - 20 } });
            dispatch({ type: 'updateCategory', id: target.id, patch: { budget: target.budget + 20 } });
            pushToast({
              detail: `$20 shifted · Other → ${target.name}`,
              undo: () => {
                dispatch({ type: 'updateCategory', id: otherCat.id, patch: { budget: otherCat.budget } });
                dispatch({ type: 'updateCategory', id: target.id, patch: { budget: target.budget } });
              },
            });
          },
        });
      }
    }
  };

  const save = () => {
    if (kind === 'Income') {
      const id = 'inc' + Date.now();
      dispatch({ type: 'addIncome', income: {
        id, name: name || 'New income', amount: amt,
        recurrence: { ...rec, anchorDate: date, flexible: false },
        toChecking: true, isPaycheck: /paycheck|salary|payroll/i.test(name),
        received: {}, overrides: {},
      } });
      pushToast({
        detail: `${name || 'New income'} · +${money(amt)} · ${fmtShort(date)}`,
        undo: () => dispatch({ type: 'removeIncome', id }),
      });
    } else if (kind === 'Bill') {
      const id = 'bill' + Date.now();
      dispatch({ type: 'addBill', bill: {
        id, name: name || 'New bill', amount: amt,
        recurrence: { ...rec, anchorDate: rec.flexible ? date.slice(0, 8) + '01' : date },
        categoryId: billCatId, inBudget: !!billCatId && inBudget,
        flagIds: tags, sourceId, overrides: {}, paid: {},
      } });
      pushToast({
        detail: `${name || 'New bill'} · ${money(amt)} · ${rec.flexible ? 'anytime monthly' : fmtShort(date)}`,
        undo: () => dispatch({ type: 'removeBill', id }),
      });
    } else {
      logExpense({ title: name || (state.categories.find((c) => c.id === categoryId) || {}).name || 'Expense',
        amount: amt, categoryId, sourceId: src.id, sourceName: src.name, isChecking: fromChecking, tags, date });
    }
    onClose();
  };

  const quickLog = (q) => {
    const qSrc = state.sources.find((s) => s.id === q.sourceId) || state.sources.find((s) => s.name === q.sourceName);
    setTimeout(() => {
      logExpense({ title: q.name, amount: q.amount, categoryId: q.categoryId,
        sourceId: qSrc ? qSrc.id : src.id, sourceName: q.sourceName,
        isChecking: qSrc ? !!qSrc.isChecking : /Checking/.test(q.sourceName || ''), tags: q.flagIds || [], date: today });
      onClose();
    }, 160);
  };

  return html`<${BottomSheet} title=${`Add ${kind}`} onClose=${onClose}>
    ${kind === 'Expense' && derived.quickLog.length > 0 && html`<div style=${{ marginBottom: '14px' }}>
      <${FieldLabel}>QUICK LOG<//>
      <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        ${derived.quickLog.map((q) => html`<${SelectPill} key=${q.name + q.amount} ripple
          label=${`${q.name} · ${money(q.amount, { cents: true })}`}
          onClick=${() => quickLog(q)} />`)}
      </div>
    </div>`}

    <${AmountInput} value=${amount} onChange=${setAmount} />

    <${Segment} options=${['Expense', 'Income', 'Bill']} value=${kind} onChange=${setKind} />

    <div style=${{ marginBottom: '11px' }}>
      <${TextField} label="NAME" value=${name} onChange=${setName}
        placeholder=${kind === 'Bill' ? 'e.g. Internet — Verizon' : kind === 'Income' ? 'e.g. Paycheck' : 'e.g. Coffee'} />
    </div>

    ${kind === 'Expense' && html`<div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>CATEGORY<//>
        <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          ${state.categories.map((c) => html`<${SelectPill} key=${c.id} label=${c.name} dot=${c.color} active=${categoryId === c.id} onClick=${() => setCategoryId(c.id)} />`)}
        </div>
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>FLAGS<//>
        <${FlagPicker} selected=${tags} onChange=${setTags} />
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <div onClick=${() => setShowDate(!showDate)} style=${{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color.border}`, cursor: 'pointer', marginBottom: showDate ? '9px' : 0 }}>
          <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: color.textDim }}>DATE</span>
          <span style=${{ fontFamily: font.body, fontSize: '13px', color: color.textHi }}>${date === today ? 'Today' : fmtShort(date)} ▾</span>
        </div>
        ${showDate && html`<${DatePicker} value=${date} onChange=${(d) => { setDate(d); setShowDate(false); }} />`}
      </div>
    </div>`}

    ${kind !== 'Expense' && html`<div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>${kind === 'Bill' ? (rec.flexible ? 'STARTING MONTH' : 'DUE DATE') : 'EXPECTED DATE'}<//>
        <${DatePicker} value=${date} onChange=${setDate} />
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>REPEATS<//>
        <${RecurrencePicker} rec=${rec} onChange=${setRec} />
      </div>
    </div>`}

    ${kind === 'Bill' && html`<div>
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>BUDGET CATEGORY<//>
        <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          <${SelectPill} label="None" active=${billCatId === null} onClick=${() => setBillCatId(null)} />
          ${state.categories.map((c) => html`<${SelectPill} key=${c.id} label=${c.name} dot=${c.color} active=${billCatId === c.id} onClick=${() => setBillCatId(c.id)} />`)}
        </div>
      </div>
      ${billCatId && html`<div style=${{ marginBottom: '16px' }}>
        <${ToggleRow} label="Counts toward budget"
          caption="unpaid = committed · paid = spent in the category"
          on=${inBudget} onChange=${setInBudget} />
      </div>`}
      <div style=${{ marginBottom: '16px' }}>
        <${FieldLabel}>FLAGS<//>
        <${FlagPicker} selected=${tags} onChange=${setTags} />
      </div>
    </div>`}

    ${kind !== 'Income' && html`<div style=${{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
      ${state.sources.map((s, i) => html`<${SourceTile} key=${s.id} source=${s} active=${sourceId === s.id}
        expand=${i === 0} onClick=${() => setSourceId(s.id)} />`)}
    </div>`}

    ${kind === 'Expense' && html`<div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '11px',
      background: cautionPreview ? 'rgba(255,180,55,0.06)' : 'rgba(59,232,166,0.06)',
      border: cautionPreview ? '1px solid rgba(255,180,55,0.22)' : '1px solid rgba(59,232,166,0.22)', marginBottom: '16px' }}>
      <span style=${{ fontFamily: font.readout, fontSize: '11px', letterSpacing: '1px', color: cautionPreview ? color.amber : color.safe }}>SAFE TO SPEND AFTER</span>
      <span style=${{ fontFamily: font.readout, fontWeight: 600, fontSize: '14px', color: cautionPreview ? color.amber : color.safe }}>${money(safeAfter, { cents: true })}</span>
    </div>`}

    <${Button} variant="primary" full onClick=${save}>SAVE ${kind.toUpperCase()}<//>
  </${BottomSheet}>`;
}

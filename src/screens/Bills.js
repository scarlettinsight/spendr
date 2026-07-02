import { html, React } from '../lib/html.js';
import { font, color } from '../theme/tokens.js';
import { useStore } from '../state/store.js';
import { money } from '../lib/format.js';
import { payOccurrence } from '../lib/actions.js';
import { StatusBar, ScreenTitle } from '../components/StatusBar.js';
import { BillGroup } from '../components/BillGroup.js';
import { EmptyState } from '../components/Banners.js';
import { Button } from '../primitives/Button.js';

// Bills tab: upcoming occurrences grouped by urgency, filterable by category
// AND flag, sortable by date or amount.
export function FilterChips({ items, active, onSelect }) {
  return html`<div style=${{ display: 'flex', gap: '8px', padding: '8px 18px 2px', overflowX: 'auto' }} className="scroll-hide">
    ${items.map((f) => {
      const on = active === f.key;
      return html`<span key=${f.key} onClick=${() => onSelect(f.key)} style=${{
        fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', padding: '6px 12px',
        borderRadius: '9px', cursor: 'pointer', whiteSpace: 'nowrap', flex: '0 0 auto',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: on ? color.onCyan : color.textDim,
        background: on ? color.cyan : 'rgba(255,255,255,0.04)',
        border: on ? '1px solid transparent' : `1px solid ${color.border}`,
        transition: 'background 150ms ease-out, color 150ms ease-out',
      }}>
        ${f.dot && html`<span style=${{ width: '6px', height: '6px', borderRadius: '50%', background: f.dot }}></span>`}
        ${f.label}
      </span>`;
    })}
  </div>`;
}

export function Bills({ open }) {
  const { state, derived, dispatch } = useStore();
  const [catFilter, setCatFilter] = React.useState('all');
  const [flagFilter, setFlagFilter] = React.useState('all');
  const [sort, setSort] = React.useState('date'); // date | amount

  const catChips = [{ key: 'all', label: 'ALL' },
    ...state.categories.map((c) => ({ key: c.id, label: c.name.toUpperCase(), dot: c.color }))];
  const flagChips = [{ key: 'all', label: 'ALL FLAGS' },
    ...state.flags.map((f) => ({ key: f.id, label: f.name.toUpperCase() }))];

  const match = (o) =>
    (catFilter === 'all' || o.categoryId === catFilter) &&
    (flagFilter === 'all' || (o.flagIds || []).includes(flagFilter));

  const groups = derived.groups
    .map((g) => {
      const items = g.items.filter(match);
      const sorted = sort === 'amount' ? [...items].sort((a, b) => b.amount - a.amount) : items;
      return { ...g, items: sorted, total: sorted.reduce((s, o) => s + o.amount, 0) };
    })
    .filter((g) => g.items.length > 0);

  return html`<div>
    <${StatusBar} />
    <${ScreenTitle} title="BILLS"
      subtitle=${`${derived.billsActiveCount} left this month · ${money(derived.remainingThisCycle)} remaining`}
      right=${html`<span onClick=${() => setSort(sort === 'date' ? 'amount' : 'date')} style=${{
        fontFamily: font.readout, fontSize: '10px', letterSpacing: '1px', color: color.cyan, cursor: 'pointer', paddingBottom: '4px',
      }}>SORT: ${sort.toUpperCase()} ⇅</span>`} />

    <${FilterChips} items=${catChips} active=${catFilter} onSelect=${setCatFilter} />
    <${FilterChips} items=${flagChips} active=${flagFilter} onSelect=${setFlagFilter} />

    <div style=${{ flex: 1, padding: '10px 16px 96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      ${groups.length === 0
        ? html`<${EmptyState} title="Nothing here" caption="No bills match these filters" />`
        : groups.map((g) => html`<${BillGroup} key=${g.key} group=${g} showTotal
            onBill=${(o) => open({ type: 'bill', occ: o })} onPay=${(o) => payOccurrence(dispatch, derived, o)} />`)}
      <${Button} variant="ghost" full onClick=${() => open({ type: 'add', kind: 'Bill' })}>+ ADD BILL<//>
    </div>
  </div>`;
}
